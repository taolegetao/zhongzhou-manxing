/**
 * Canvas 场景渲染。
 *
 * 图层约定（为后续遮挡关系预留）：
 *   1. 地图底图
 *   2. 地面光环 / 路径等贴地元素
 *   3. 按 y 排序的实体（人物、NPC、可遮挡建筑前景）
 *   4. 屏幕空间的操作提示
 *
 * 若以后要把建筑拆出“前景层”，只需在渲染实体阶段插入一个
 * 高于人物 y 值的 sprite，即可自然实现人物走到建筑后方被遮挡。
 */
export class SceneRenderer {
  /**
   * @param {{ canvas: HTMLCanvasElement, mapImage: HTMLImageElement, heroImage: HTMLImageElement }} options
   */
  constructor({ canvas, mapImage, heroImage }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.mapImage = mapImage;
    this.heroImage = heroImage;
    this.width = 0;
    this.height = 0;
    this.dpr = 1;
  }

  resize(width, height, dpr) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.canvas.width = Math.max(1, Math.round(width * dpr));
    this.canvas.height = Math.max(1, Math.round(height * dpr));
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
  }

  /**
   * @param {{
   *   camera: import('../core/camera.js').Camera,
   *   player: import('../core/player.js').Player,
   *   nearPois: object[],
   *   nearestPoi: object|null,
   *   time: number,
   *   showHints: boolean,
   * }} frame
   */
  render({ camera, player, nearPois, nearestPoi, time, showHints }) {
    const ctx = this.ctx;
    const { width, height, dpr } = this;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ded4bf';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(camera.scale, camera.scale);
    ctx.translate(-camera.x, -camera.y);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.mapImage, 0, 0);

    for (const poi of nearPois) {
      this.drawGroundAura(poi, camera, time);
    }

    // 以 y 值排序的实体层。现在只有人物，但接口已为 NPC / 前景遮挡留好。
    const entities = [
      {
        y: player.y,
        draw: () => this.drawPlayer(player),
      },
    ];
    entities.sort((a, b) => a.y - b.y);
    for (const entity of entities) {
      entity.draw();
    }

    ctx.restore();

    if (showHints && nearestPoi) {
      this.drawFocusCorners(nearestPoi, camera);
    }
  }

  drawGroundAura(poi, camera, time) {
    if (!poi.aura) return;
    const { x, y, rx, ry } = poi.aura;
    const visible = camera.getVisibleRect();
    if (x + rx < visible.left || x - rx > visible.right || y + ry < visible.top || y - ry > visible.bottom) {
      return;
    }

    const ctx = this.ctx;
    const cycle = ((time / 1000) + poi.order * 0.42) % 2.6;
    const phase = cycle / 2.6;
    const pulse = 1 + phase * 0.24;

    ctx.save();
    ctx.translate(x, y);

    ctx.strokeStyle = `rgba(179, 72, 52, ${0.3 * (1 - phase)})`;
    ctx.lineWidth = 1.5 / camera.scale;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * pulse, ry * pulse, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(194, 149, 83, 0.42)';
    ctx.lineWidth = 1 / camera.scale;
    ctx.setLineDash([4 / camera.scale, 6 / camera.scale]);
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * 0.82, ry * 0.82, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  drawPlayer(player) {
    const ctx = this.ctx;
    const sprite = player.config.sprite;
    const row = sprite.rowByFacing[player.facing] ?? 0;
    const sourceX = player.frame * sprite.frameWidth;
    const sourceY = row * sprite.frameHeight;

    // 影子
    ctx.save();
    ctx.translate(player.x, player.y + 3);
    ctx.scale(1, 0.34);
    const shadow = ctx.createRadialGradient(0, 0, 1, 0, 0, 22);
    shadow.addColorStop(0, 'rgba(28, 39, 34, 0.3)');
    shadow.addColorStop(1, 'rgba(28, 39, 34, 0)');
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const bob = player.moving ? Math.sin(player.animationClock * 22) * 1.1 : 0;
    const size = sprite.drawSize;
    const drawX = player.x - size / 2;
    const drawY = player.y - size + 5 + bob;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      this.heroImage,
      sourceX,
      sourceY,
      sprite.frameWidth,
      sprite.frameHeight,
      drawX,
      drawY,
      size,
      size,
    );
    ctx.restore();
  }

  /**
   * 屏幕空间四角标记，不随地图缩放变大变小。
   */
  drawFocusCorners(poi, camera) {
    const box = poi.hitbox;
    const padding = 5;
    const topLeft = camera.worldToScreen(box.x - padding, box.y - padding);
    const bottomRight = camera.worldToScreen(box.x + box.width + padding, box.y + box.height + padding);
    const left = topLeft.x;
    const top = topLeft.y;
    const right = bottomRight.x;
    const bottom = bottomRight.y;

    if (right < 0 || left > this.width || bottom < 0 || top > this.height) return;

    // 给顶部 HUD / 底部摇杆留出安全区，避免角标从面板边缘“漏”出来。
    if (top < 120 || bottom > this.height - 132 || left < 8 || right > this.width - 8) return;

    // 建筑比屏幕还宽时，四角标记会变成贴边的断线，反而干扰阅读。
    // 这种大尺度建筑只保留地面光环和底部文字提示。
    if (right - left > this.width * 0.9 || bottom - top > this.height * 0.55) return;

    const ctx = this.ctx;
    const length = 14;
    const corners = [
      [left, top, 1, 1],
      [right, top, -1, 1],
      [left, bottom, 1, -1],
      [right, bottom, -1, -1],
    ];

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const strokeCorners = (color, width) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      for (const [x, y, sx, sy] of corners) {
        ctx.beginPath();
        ctx.moveTo(x + sx * length, y);
        ctx.lineTo(x, y);
        ctx.lineTo(x, y + sy * length);
        ctx.stroke();
      }
    };

    strokeCorners('rgba(250, 246, 235, 0.62)', 3.2);
    strokeCorners('rgba(171, 66, 47, 0.84)', 1.25);

    // 顶边的小菱形，作为“可交互”的轻提示。
    ctx.translate((left + right) / 2, top - 10);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = 'rgba(171, 66, 47, 0.9)';
    ctx.fillRect(-2.3, -2.3, 4.6, 4.6);
    ctx.restore();
  }
}
