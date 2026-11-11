/**
 * 触屏摇杆 + 键盘输入。
 * 游戏只消费 getVector()，以后接手柄或点击寻路时，不必改人物逻辑。
 */
export class InputController {
  /**
   * @param {{ joystick: HTMLElement, knob: HTMLElement }} elements
   */
  constructor({ joystick, knob }) {
    this.joystick = joystick;
    this.knob = knob;
    this.enabled = false;
    this.joystickPointerId = null;
    this.joystickVector = { x: 0, y: 0 };
    this.keys = new Set();
    this.maxKnobOffset = 32;

    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onBlur = this.onBlur.bind(this);

    joystick.addEventListener('pointerdown', this.onPointerDown);
    joystick.addEventListener('pointermove', this.onPointerMove);
    joystick.addEventListener('pointerup', this.onPointerUp);
    joystick.addEventListener('pointercancel', this.onPointerUp);
    window.addEventListener('keydown', this.onKeyDown, { passive: false });
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.reset();
    }
  }

  reset() {
    this.joystickPointerId = null;
    this.joystickVector.x = 0;
    this.joystickVector.y = 0;
    this.keys.clear();
    this.joystick.classList.remove('is-active');
    this.knob.style.transform = 'translate(-50%, -50%)';
  }

  /**
   * 返回可能超过单位长度的原始向量，交给 Player 限幅。
   * @returns {{ x: number, y: number }}
   */
  getVector() {
    if (!this.enabled) {
      return { x: 0, y: 0 };
    }

    let x = this.joystickVector.x;
    let y = this.joystickVector.y;

    if (this.keys.has('up')) y -= 1;
    if (this.keys.has('down')) y += 1;
    if (this.keys.has('left')) x -= 1;
    if (this.keys.has('right')) x += 1;

    const magnitude = Math.hypot(x, y);
    if (magnitude > 1) {
      x /= magnitude;
      y /= magnitude;
    }

    return { x, y };
  }

  onPointerDown(event) {
    if (!this.enabled || this.joystickPointerId !== null) return;

    event.preventDefault();
    this.joystickPointerId = event.pointerId;
    this.joystick.setPointerCapture?.(event.pointerId);
    this.joystick.classList.add('is-active');
    this.updateJoystick(event);
  }

  onPointerMove(event) {
    if (!this.enabled || event.pointerId !== this.joystickPointerId) return;
    event.preventDefault();
    this.updateJoystick(event);
  }

  onPointerUp(event) {
    if (event.pointerId !== this.joystickPointerId) return;
    this.joystickPointerId = null;
    this.joystickVector.x = 0;
    this.joystickVector.y = 0;
    this.joystick.classList.remove('is-active');
    this.knob.style.transform = 'translate(-50%, -50%)';

    if (this.joystick.hasPointerCapture?.(event.pointerId)) {
      this.joystick.releasePointerCapture(event.pointerId);
    }
  }

  updateJoystick(event) {
    const rect = this.joystick.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    this.maxKnobOffset = rect.width * 0.28;

    let dx = (event.clientX - centerX) / this.maxKnobOffset;
    let dy = (event.clientY - centerY) / this.maxKnobOffset;
    const magnitude = Math.hypot(dx, dy);

    if (magnitude > 1) {
      dx /= magnitude;
      dy /= magnitude;
    }

    // 小死区，避免手指轻微抖动就触发走路。
    if (Math.hypot(dx, dy) < 0.1) {
      dx = 0;
      dy = 0;
    }

    this.joystickVector.x = dx;
    this.joystickVector.y = dy;

    const offsetX = dx * this.maxKnobOffset;
    const offsetY = dy * this.maxKnobOffset;
    this.knob.style.transform =
      `translate(calc(-50% + ${offsetX.toFixed(2)}px), calc(-50% + ${offsetY.toFixed(2)}px))`;
  }

  onKeyDown(event) {
    if (!this.enabled) return;
    const direction = keyToDirection(event.code);
    if (!direction) return;

    event.preventDefault();
    this.keys.add(direction);
  }

  onKeyUp(event) {
    const direction = keyToDirection(event.code);
    if (!direction) return;
    this.keys.delete(direction);
  }

  onBlur() {
    this.reset();
  }
}

function keyToDirection(code) {
  switch (code) {
    case 'ArrowUp':
    case 'KeyW':
      return 'up';
    case 'ArrowDown':
    case 'KeyS':
      return 'down';
    case 'ArrowLeft':
    case 'KeyA':
      return 'left';
    case 'ArrowRight':
    case 'KeyD':
      return 'right';
    default:
      return null;
  }
}
