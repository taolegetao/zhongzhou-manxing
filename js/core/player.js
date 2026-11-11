import { PLAYER } from '../config.js';

/**
 * 人物移动与四方向动画状态。
 * 移动向量可以是对角线，但朝向始终落在四个方向之一，方便替换 4 行序列帧。
 */
export class Player {
  constructor(config = PLAYER) {
    this.config = config;
    this.sprite = config.sprite;
    this.reset();
  }

  reset() {
    this.x = this.config.start.x;
    this.y = this.config.start.y;
    this.facing = 'down';
    this.moving = false;
    this.animationClock = 0;
    this.frame = 0;
  }

  /**
   * @param {number} dt 秒
   * @param {{ x: number, y: number }} input 已归一化/限幅的方向向量
   */
  update(dt, input) {
    const magnitude = Math.min(1, Math.hypot(input.x, input.y));

    if (magnitude < 0.08) {
      this.moving = false;
      this.frame = 0;
      this.animationClock = 0;
      return;
    }

    const vx = input.x / Math.max(1, Math.hypot(input.x, input.y));
    const vy = input.y / Math.max(1, Math.hypot(input.x, input.y));

    this.moving = true;
    this.faceTowards(vx, vy);

    const speed = this.config.speed * magnitude;
    this.x = clamp(this.x + vx * speed * dt, this.config.bounds.minX, this.config.bounds.maxX);
    this.y = clamp(this.y + vy * speed * dt, this.config.bounds.minY, this.config.bounds.maxY);

    // 走慢时脚步声也慢一些，视觉上更自然。
    this.animationClock += dt * (0.72 + magnitude * 0.28);
    const order = this.sprite.frameOrder;
    const index = Math.floor(this.animationClock / this.sprite.frameDuration) % order.length;
    this.frame = order[index];
  }

  faceTowards(vx, vy) {
    if (Math.abs(vx) > Math.abs(vy) + 0.05) {
      this.facing = vx > 0 ? 'right' : 'left';
    } else if (Math.abs(vy) > 0.05) {
      this.facing = vy > 0 ? 'down' : 'up';
    }
  }

  stop() {
    this.moving = false;
    this.frame = 0;
    this.animationClock = 0;
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
