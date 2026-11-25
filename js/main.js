import { HIT_SLOP, PLAYER, VIEW, WORLD } from './config.js';
import { POIS } from './data/pois.js';
import { ATLAS_BADGES } from './data/atlas.js';
import { AssetStore } from './core/assets.js';
import { Camera, clamp } from './core/camera.js';
import { InputController } from './core/input.js';
import { Player } from './core/player.js';
import { formatSavedAt, loadProgress, loadSlots, saveProgress, saveSlot } from './core/progress.js';
import { SceneRenderer } from './render/scene.js';
import { UI } from './ui/ui.js';

const saved = loadProgress();
const validBadgeIds = new Set(ATLAS_BADGES.map((badge) => badge.id));

const state = {
  loaded: false,
  started: false,
  modal: false,
  badges: new Set((saved?.badges ?? []).filter((id) => validBadgeIds.has(id))),
  settings: {
    reduceMotion: Boolean(saved?.settings?.reduceMotion),
    largeText: Boolean(saved?.settings?.largeText),
  },
  savedAt: saved?.savedAt ?? null,
  nearPoi: null,
  activePoi: null,
  pendingBadgeToast: false,
};

const elements = {
  stage: document.getElementById('stage'),
  canvas: document.getElementById('gameCanvas'),
  joystick: document.getElementById('joystick'),
  knob: document.getElementById('stickKnob'),
};

const assets = new AssetStore();
const ui = new UI({
  onStart: startGame,
  onPoiClose: closePoi,
  onSettingsOpen: openSettings,
  onSettingsClose: closeSettings,
  onAtlasOpen: openAtlas,
  onAtlasClose: closeAtlas,
  onSaveOpen: openSaveSlots,
  onSaveSlot: saveToSlot,
  onLoadSlot: loadFromSlot,
  onSaveClose: closeSaveSlots,
  onToggleSetting: toggleSetting,
  onQuizAnswer: answerQuiz,
  onBubbleClick: () => {
    if (state.nearPoi) openPoi(state.nearPoi);
  },
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

applySettings();
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
    if (saved?.player) {
      player.x = clamp(saved.player.x, PLAYER.bounds.minX, PLAYER.bounds.maxX);
      player.y = clamp(saved.player.y, PLAYER.bounds.minY, PLAYER.bounds.maxY);
    }

    camera = new Camera();
    scene = new SceneRenderer({
      canvas: elements.canvas,
      mapImage: assets.get('map'),
      heroImage: assets.get('hero'),
    });

    resize();
    camera.snapTo(player.x, player.y + VIEW.lookAheadY);
    state.loaded = true;
    ui.ready(Boolean(state.savedAt));
    ui.setBadgeCount(state.badges.size);
    ui.setSavedAt(state.savedAt);
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
      nearPois: state.nearPoi ? [state.nearPoi] : [],
      nearestPoi: state.nearPoi,
      time: now,
      showHints: false,
    });
  }

  window.requestAnimationFrame(tick);
}

function update(dt) {
  const vector = state.started && !state.modal ? input.getVector() : { x: 0, y: 0 };
  player.update(dt, vector);
  camera.follow(player.x, player.y + VIEW.lookAheadY, dt, VIEW.followLerp);

  const nextNear = findNearestPoi(player.x, player.y);
  state.nearPoi = nextNear;

  if (state.started && !state.modal && nextNear) {
    const point = camera.worldToScreen(nextNear.bubble.x, nextNear.bubble.y);
    ui.showBubble(nextNear, point);
  } else {
    ui.hideBubble();
  }
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

function startGame() {
  if (!state.loaded || state.started) return;
  state.started = true;
  input.setEnabled(true);
  ui.hideStart();
  window.setTimeout(() => {
    ui.toast('走到永定门前，轻触气泡或城门', 2800);
  }, 720);
}

function openPoi(poi) {
  if (!state.started || state.modal || !poi) return;

  state.modal = true;
  state.activePoi = poi;
  state.pendingBadgeToast = false;
  input.setEnabled(false);
  player.stop();
  ui.hideBubble();
  ui.openPoi(poi, state.badges.has(poi.id));
}

function closePoi() {
  const poiName = state.activePoi?.name;
  const allClosed = state.badges.size === POIS.length;
  state.modal = false;
  state.activePoi = null;
  input.setEnabled(state.started);
  if (state.pendingBadgeToast) {
    state.pendingBadgeToast = false;
    ui.toast(
      allClosed ? '4 个点位全部闭环 · 进度已保存' : `${poiName}徽章已点亮 · 进度已保存`,
      3000,
    );
  }
}

function answerQuiz(index) {
  const poi = state.activePoi;
  if (!poi || !poi.quiz || state.badges.has(poi.id)) return;

  const correct = index === poi.quiz.answer;
  ui.showQuizResult(correct, index, poi);

  if (!correct) return;

  state.badges.add(poi.id);
  state.pendingBadgeToast = true;
  ui.setBadgeCount(state.badges.size);
  saveGame(false);
}

function openAtlas() {
  if (!state.started || state.modal) return;
  state.modal = true;
  input.setEnabled(false);
  player.stop();
  ui.hideBubble();
  ui.openAtlas(state.badges);
}

function closeAtlas() {
  state.modal = false;
  input.setEnabled(state.started);
}

function openSettings() {
  if (!state.started || state.modal) return;
  state.modal = true;
  input.setEnabled(false);
  player.stop();
  ui.hideBubble();
  ui.openSettings(state.settings);
}

function closeSettings() {
  state.modal = false;
  input.setEnabled(state.started);
}

function openSaveSlots() {
  if (!state.started || state.modal) return;
  state.modal = true;
  input.setEnabled(false);
  player.stop();
  ui.hideBubble();
  ui.openSaveSlots(loadSlots());
}

function closeSaveSlots() {
  state.modal = false;
  input.setEnabled(state.started);
}

function saveToSlot(index) {
  if (!player) return;
  const slots = loadSlots();
  if (slots[index] && !window.confirm(`存档 ${index + 1} 已有进度，确定覆盖吗？`)) return;

  const updated = saveSlot(index, {
    badges: state.badges,
    player,
    settings: state.settings,
  });
  ui.renderSaveSlots(updated);
  saveGame(false);
  ui.toast(`已保存到存档 ${String(index + 1).padStart(2, '0')}`, 2000);
}

function loadFromSlot(index) {
  const slot = loadSlots()[index];
  if (!slot) return;
  if (!window.confirm('读取存档会覆盖当前未保存的游玩进度，确定继续吗？')) return;

  applySnapshot(slot);
  ui.closeSaveSlots();
  ui.toast(`已读取存档 ${String(index + 1).padStart(2, '0')}`, 2200);
}

function applySnapshot(snapshot) {
  if (!snapshot) return;
  state.badges = new Set(snapshot.badges.filter((id) => ATLAS_BADGES.some((badge) => badge.id === id)));
  state.settings = {
    reduceMotion: Boolean(snapshot.settings?.reduceMotion),
    largeText: Boolean(snapshot.settings?.largeText),
  };
  applySettings();

  if (snapshot.player && player) {
    player.x = clamp(snapshot.player.x, PLAYER.bounds.minX, PLAYER.bounds.maxX);
    player.y = clamp(snapshot.player.y, PLAYER.bounds.minY, PLAYER.bounds.maxY);
    camera.snapTo(player.x, player.y + VIEW.lookAheadY);
    input.reset();
  }

  ui.setBadgeCount(state.badges.size);
  ui.setSavedAt(snapshot.savedAt);
  saveGame(false);
}

function toggleSetting(key, value) {
  if (key !== 'reduceMotion' && key !== 'largeText') return;
  state.settings[key] = Boolean(value);
  applySettings();
  saveGame(false);
}

function applySettings() {
  document.documentElement.classList.toggle('reduce-motion', state.settings.reduceMotion);
  document.body.classList.toggle('large-text', state.settings.largeText);
}

function saveGame(showToast) {
  if (!player) return false;
  const savedAt = saveProgress({
    badges: state.badges,
    player,
    settings: state.settings,
  });
  if (!savedAt) {
    if (showToast) ui.toast('存档失败，请检查浏览器存储权限', 2600);
    return false;
  }

  state.savedAt = savedAt;
  ui.setSavedAt(savedAt);
  ui.flashSave();
  if (showToast) {
    ui.toast(`进度已保存 · ${formatSavedAt(savedAt)}`, 2200);
  }
  return true;
}

function resetToStart() {
  if (!state.started || !player) return;
  player.reset();
  camera.snapTo(player.x, player.y + VIEW.lookAheadY);
  input.reset();
  saveGame(false);
  ui.toast('已回到永定门前', 2000);
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
    if (document.hidden) {
      input.reset();
      if (state.started) saveGame(false);
    }
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
    answerQuiz(index) {
      answerQuiz(index);
    },
    openAtlas() {
      openAtlas();
    },
    save() {
      return saveGame(false);
    },
    setBadges(ids) {
      state.badges = new Set(ids);
      ui.setBadgeCount(state.badges.size);
    },
    world: WORLD,
  };
}
