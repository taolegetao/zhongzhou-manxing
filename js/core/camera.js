import { WORLD } from '../config.js';

/**
 * 世界坐标 → 屏幕坐标的唯一转换入口。
 * 后续做遮挡、粒子、小地图时，都应该复用这里的 worldToScreen。
 */
export class Camera {
  constructor() {
    this.x = WORLD.width / 2;
    this.y = WORLD.height / 2;
    this.scale = 1;
    this.viewWidth = 0;
    this.viewHeight = 0;
    this.initialized = false;
  }

  resize(viewWidth, viewHeight, scale) {
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
    this.scale = scale;
    this.clamp();
  }

  /**
   * 平滑跟随。targetY 可以比人物坐标更靠前，形成“看向前方”的镜头。
   */
  follow(targetX, targetY, dt, lerp) {
    if (!this.initialized) {
      this.snapTo(targetX, targetY);
      return;
    }

    const amount = 1 - Math.exp(-lerp * dt);
    this.x += (targetX - this.x) * amount;
    this.y += (targetY - this.y) * amount;
    this.clamp();
  }

  snapTo(targetX, targetY) {
    this.x = targetX;
    this.y = targetY;
    this.initialized = true;
    this.clamp();
  }

  clamp() {
    const halfW = this.viewWidth / (2 * this.scale);
    const halfH = this.viewHeight / (2 * this.scale);

    if (halfW * 2 >= WORLD.width) {
      this.x = WORLD.width / 2;
    } else {
      this.x = clamp(this.x, halfW, WORLD.width - halfW);
    }

    if (halfH * 2 >= WORLD.height) {
      this.y = WORLD.height / 2;
    } else {
      this.y = clamp(this.y, halfH, WORLD.height - halfH);
    }
  }

  /**
   * @returns {{ x: number, y: number }}
   */
  worldToScreen(worldX, worldY) {
    return {
      x: (worldX - this.x) * this.scale + this.viewWidth / 2,
      y: (worldY - this.y) * this.scale + this.viewHeight / 2,
    };
  }

  /**
   * @returns {{ x: number, y: number }}
   */
  screenToWorld(screenX, screenY) {
    return {
      x: (screenX - this.viewWidth / 2) / this.scale + this.x,
      y: (screenY - this.viewHeight / 2) / this.scale + this.y,
    };
  }

  getVisibleRect() {
    const halfW = this.viewWidth / (2 * this.scale);
    const halfH = this.viewHeight / (2 * this.scale);
    return {
      left: this.x - halfW,
      top: this.y - halfH,
      right: this.x + halfW,
      bottom: this.y + halfH,
    };
  }
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
