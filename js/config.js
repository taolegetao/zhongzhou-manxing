/**
 * 全局可调参数。换地图比例、行走速度、镜头松紧，都只需要动这里。
 */
export const WORLD = {
  width: 1024,
  height: 1800,
};

export const VIEW = {
  /** 手机竖屏上希望看到的地图宽度（世界像素）。数值越小，镜头越近。 */
  targetWorldWidth: 430,
  minScale: 0.82,
  maxScale: 1.8,
  /** 镜头略微看向人物前方（北方），让屏幕上方留出探索空间。 */
  lookAheadY: -60,
  /** 镜头跟随速度，越大越"跟手"。 */
  followLerp: 8.5,
  /** 人物距离建筑多近时，出现气泡提示。 */
  proximity: 110,
};

export const PLAYER = {
  /** 永定门前。 */
  start: { x: 512, y: 1500 },
  speed: 132,
  bounds: {
    minX: 140,
    maxX: 890,
    minY: 24,
    maxY: 1762,
  },
  sprite: {
    src: './assets/character/hero.png',
    frameWidth: 128,
    frameHeight: 128,
    /** 原图 8 列 × 4 行，每格 128×128。 */
    columns: 8,
    rows: 4,
    /** 角色在游戏世界中的绘制高度。 */
    drawSize: 52,
    frameDuration: 0.072,
    frameOrder: [0, 1, 2, 3, 4, 5, 6, 7],
    /** 素材行顺序：下、左、右、上。 */
    rowByFacing: {
      down: 0,
      left: 1,
      right: 2,
      up: 3,
    },
  },
};

export const AXIS = {
  /** 进度条南、北两端对应的世界坐标，用来计算"中轴进度"。 */
  southY: 1500,
  northY: 120,
};

/** 地图中的可点击建筑。新增建筑时，往 data/pois.js 里追加一项即可。 */
export const HIT_SLOP = 6;
