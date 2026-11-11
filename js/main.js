import { AXIS, HIT_SLOP, PLAYER, VIEW, WORLD } from './config.js';
import { POIS } from './data/pois.js';
import { AssetStore } from './core/assets.js';
import { Camera, clamp } from './core/camera.js';
import { InputController } from './core/input.js';
import { Player } from './core/player.js';
import { SceneRenderer } from './render/scene.js';
import { UI } from './ui/ui.js';

const state = {
  loaded: false,
  started: false,
  modal: false,
  found: new Set(),
  justCompleted: false,
  nearPoi: null,
};

const elements = {
  stage: document.getElementById('stage'),
  canvas: document.getElementById('gameCanvas'),
  joystick: document.getElementById('joystick'),
  knob: document.getElementById('stickKnob'),
};

const assets = new AssetStore();
const ui = new UI({
  totalPois: POIS.length,
  onStart: startGame,
  onPoiClose: closePoi,
  onHelpOpen: openHelp,
  onHelpClose: closeHelp,
  onReset: resetToStart,
});

const input = new InputController({
  joystick: elements.joystick,
  knob: elements.knob,
});

let player;
let camera;
let scene;
let lastTime = performance.now();

boot();

async function boot() {
  try {
    const manifest = [
      { id: 'map', src: './assets/map/base-map.jpg' },
      { id: 'hero', src: PLAYER.sprite.src },
      ...POIS.map((poi) => ({ id: `cover:${poi.id}`, src: poi.cover })),
    ];

    await assets.loadAll(manifest, (progress) => ui.setLoading(progress));

    player = new Player(PLAYER);
    camera = new Camera();
    scene = new SceneRenderer({
      canvas: elements.canvas,
      mapImage: assets.get('map'),
      heroImage: assets.get('hero'),
    });

    resize();
    camera.snapTo(player.x, player.y + VIEW.lookAheadY);
    state.loaded = true;
    ui.ready();
    ui.setFound(state.found);
    bindTapControls();
    bindGlobalEvents();
    exposeDebugApi();

    window.requestAnimationFrame(tick);
  } catch (error) {
    ui.fail(error instanceof Error ? error.message : '素材加载失败，请检查文件路径。');
  }
}

function resize() {
  if (!scene || !camera) return;

  const rect = elements.stage.getBoundingClientRect();
  const width = Math.max(1, rect.width);
  const height = Math.max(1, rect.height);
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  const scale = clamp(width / VIEW.targetWorldWidth, VIEW.minScale, VIEW.maxScale);

  scene.resize(width, height, dpr);
  camera.resize(width, height, scale);
}

function tick(now) {
  const dt = Math.min(Math.max((now - lastTime) / 1000, 0), 0.05);
  lastTime = now;

  if (state.loaded) {
    update(dt);
    scene.render({
      camera,
      player,
      nearPois: getNearPois(player.x, player.y),
      nearestPoi: state.nearPoi,
      time: now,
      showHints: state.started && !state.modal && Boolean(state.nearPoi),
    });
  }

  window.requestAnimationFrame(tick);
}

function update(dt) {
  const vector = state.started && !state.modal ? input.getVector() : { x: 0, y: 0 };
  player.update(dt, vector);
  camera.follow(player.x, player.y + VIEW.lookAheadY, dt, VIEW.followLerp);

  const nextNear = findNearestPoi(player.x, player.y);
  if (nextNear?.id !== state.nearPoi?.id) {
    state.nearPoi = nextNear;
    ui.setNear(state.modal ? null : nextNear);
  }

  ui.setProgress(progressFromY(player.y));
}

function getNearPois(x, y) {
  const result = [];
  for (const poi of POIS) {
    if (distanceToBox(x, y, poi.hitbox) <= VIEW.proximity + 135) {
      result.push(poi);
    }
  }
  return result;
}

function findNearestPoi(x, y) {
  let nearest = null;
  let nearestDistance = Infinity;

  for (const poi of POIS) {
    const distance = distanceToBox(x, y, poi.hitbox);
    if (distance < nearestDistance) {
      nearest = poi;
      nearestDistance = distance;
    }
  }

  return nearestDistance <= VIEW.proximity ? nearest : null;
}

function distanceToBox(x, y, box) {
  const dx = Math.max(box.x - x, 0, x - (box.x + box.width));
  const dy = Math.max(box.y - y, 0, y - (box.y + box.height));
  return Math.hypot(dx, dy);
}

function progressFromY(y) {
  const total = AXIS.southY - AXIS.northY;
  return clamp(((AXIS.southY - y) / total) * 100, 0, 100);
}

function startGame() {
  if (!state.loaded || state.started) return;
  state.started = true;
  input.setEnabled(true);
  ui.hideStart();
  window.setTimeout(() => {
    ui.toast('沿中轴向南，拜访天坛与永定门', 2800);
  }, 720);
}

function openPoi(poi) {
  if (!state.started || state.modal || !poi) return;

  state.modal = true;
  state.justCompleted = false;
  input.setEnabled(false);
  player.stop();
  ui.setNear(null);

  const isNew = !state.found.has(poi.id);
  state.found.add(poi.id);
  ui.setFound(state.found);
  if (isNew && state.found.size === POIS.length) {
    state.justCompleted = true;
  }

  ui.openPoi(poi);
}

function closePoi() {
  state.modal = false;
  input.setEnabled(state.started);
  ui.setNear(state.nearPoi);
  if (state.justCompleted) {
    state.justCompleted = false;
    ui.toast('中轴遗产点已全部收录 · 本次漫游完成', 3400);
  }
}

function openHelp() {
  if (!state.started || state.modal) return;
  state.modal = true;
  input.setEnabled(false);
  player.stop();
  ui.setNear(null);
  ui.openHelp();
}

function closeHelp() {
  state.modal = false;
  input.setEnabled(state.started);
  ui.setNear(state.nearPoi);
}

function resetToStart() {
  if (!state.started || state.modal) return;
  player.reset();
  camera.snapTo(player.x, player.y + VIEW.lookAheadY);
  input.reset();
  ui.toast('已回到起点 · 外金水桥附近', 2200);
}

function bindTapControls() {
  let press = null;

  elements.canvas.addEventListener('pointerdown', (event) => {
    if (!state.started || state.modal) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    press = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      time: performance.now(),
    };
  });

  elements.canvas.addEventListener('pointermove', (event) => {
    if (!press || press.pointerId !== event.pointerId) {
      if (event.pointerType === 'mouse') {
        updateCursor(event);
      }
      return;
    }

    if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > 12) {
      press.moved = true;
    }
  });

  elements.canvas.addEventListener('pointerup', (event) => {
    if (!press || press.pointerId !== event.pointerId) return;
    const elapsed = performance.now() - press.time;
    const moved = press.moved || Math.hypot(event.clientX - press.x, event.clientY - press.y) > 12;
    press = null;

    if (moved || elapsed > 700) return;

    const rect = elements.canvas.getBoundingClientRect();
    const worldPoint = camera.screenToWorld(event.clientX - rect.left, event.clientY - rect.top);
    const poi = hitTest(worldPoint.x, worldPoint.y);
    if (poi) openPoi(poi);
  });

  elements.canvas.addEventListener('pointercancel', () => {
    press = null;
  });

  elements.canvas.addEventListener('contextmenu', (event) => {
    event.preventDefault();
  });

  elements.canvas.addEventListener('pointerleave', (event) => {
    if (event.pointerType === 'mouse') elements.canvas.style.cursor = 'default';
  });
}

function hitTest(x, y) {
  for (const poi of POIS) {
    const box = poi.hitbox;
    if (
      x >= box.x - HIT_SLOP &&
      x <= box.x + box.width + HIT_SLOP &&
      y >= box.y - HIT_SLOP &&
      y <= box.y + box.height + HIT_SLOP
    ) {
      return poi;
    }
  }
  return null;
}

function updateCursor(event) {
  const rect = elements.canvas.getBoundingClientRect();
  const point = camera.screenToWorld(event.clientX - rect.left, event.clientY - rect.top);
  elements.canvas.style.cursor = hitTest(point.x, point.y) ? 'pointer' : 'default';
}

function bindGlobalEvents() {
  let resizeFrame = 0;
  const scheduleResize = () => {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(resize);
  };

  window.addEventListener('resize', scheduleResize);
  window.addEventListener('orientationchange', scheduleResize);
  if ('ResizeObserver' in window) {
    new ResizeObserver(scheduleResize).observe(elements.stage);
  }

  document.addEventListener('visibilitychange', () => {
    lastTime = performance.now();
    if (document.hidden) input.reset();
  });
}

function exposeDebugApi() {
  const params = new URLSearchParams(window.location.search);
  if (!params.has('debug')) return;

  window.__zhongzhouDebug = {
    state,
    player,
    camera,
    start() {
      startGame();
    },
    teleport(x, y) {
      player.x = clamp(x, PLAYER.bounds.minX, PLAYER.bounds.maxX);
      player.y = clamp(y, PLAYER.bounds.minY, PLAYER.bounds.maxY);
      camera.snapTo(player.x, player.y + VIEW.lookAheadY);
    },
    openPoi(id) {
      openPoi(POIS.find((poi) => poi.id === id));
    },
    setFound(ids) {
      state.found = new Set(ids);
      ui.setFound(state.found);
    },
    world: WORLD,
  };
}
