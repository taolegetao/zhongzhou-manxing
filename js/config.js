/**
 * 全局可调参数。
 * 改地图比例、行走速度、镜头松紧，都只需要动这里。
 */
export const WORLD = {
  width: 1000,
  height: 2483,
};

export const VIEW = {
  /** 手机竖屏上希望看到的地图宽度（世界像素）。数值越小，镜头越近。 */
  targetWorldWidth: 390,
  minScale: 0.82,
  maxScale: 1.8,
  /** 镜头略微看向人物前方（北方），让屏幕上方留出探索空间。 */
  lookAheadY: -60,
  /** 镜头跟随速度，越大越“跟手”。 */
  followLerp: 8.5,
  /** 人物距离建筑多近时，出现“轻触查看”提示。 */
  proximity: 340,
};

export const PLAYER = {
  /** 天安门与正阳门之间，接近 map4 蓝框中的黄色人物点。 */
  start: { x: 420, y: 1700 },
  speed: 126,
  bounds: {
    minX: 100,
    maxX: 900,
    minY: 100,
    maxY: 2440,
  },
  sprite: {
    src: './assets/character/hero.png',
    frameWidth: 48,
    frameHeight: 48,
    /** 原图为 3 列 × 4 行，每格 48×48。 */
    columns: 3,
    rows: 4,
    /** 角色在游戏世界中的绘制高度。 */
    drawSize: 46,
    frameDuration: 0.14,
    frameOrder: [0, 1, 2, 1],
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
  /** 进度条南、北两端对应的世界坐标，用来计算“中轴进度”。 */
  southY: 2400,
  northY: 300,
};

/** 地图中的可点击建筑。新增建筑时，往 data/pois.js 里追加一项即可。 */
export const HIT_SLOP = 6;
