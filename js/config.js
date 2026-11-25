/**
 * 鍏ㄥ眬鍙皟鍙傛暟銆? * 鏀瑰湴鍥炬瘮渚嬨€佽璧伴€熷害銆侀暅澶存澗绱э紝閮藉彧闇€瑕佸姩杩欓噷銆? */
export const WORLD = {
  width: 1000,
  height: 2483,
};

export const VIEW = {
  /** 鎵嬫満绔栧睆涓婂笇鏈涚湅鍒扮殑鍦板浘瀹藉害锛堜笘鐣屽儚绱狅級銆傛暟鍊艰秺灏忥紝闀滃ご瓒婅繎銆?*/
  targetWorldWidth: 390,
  minScale: 0.82,
  maxScale: 1.8,
  /** 闀滃ご鐣ュ井鐪嬪悜浜虹墿鍓嶆柟锛堝寳鏂癸級锛岃灞忓箷涓婃柟鐣欏嚭鎺㈢储绌洪棿銆?*/
  lookAheadY: -60,
  /** 闀滃ご璺熼殢閫熷害锛岃秺澶ц秺鈥滆窡鎵嬧€濄€?*/
  followLerp: 8.5,
  /** 浜虹墿璺濈寤虹瓚澶氳繎鏃讹紝鍑虹幇姘旀场鎻愮ず銆?*/
  proximity: 100,
};

export const PLAYER = {
  /** 姘稿畾闂ㄥ墠锛屽寳渚х害 180 涓栫晫鍍忕礌銆?*/
  start: { x: 480, y: 2120 },
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
    /** 鍘熷浘涓?3 鍒?脳 4 琛岋紝姣忔牸 48脳48銆?*/
    columns: 3,
    rows: 4,
    /** 瑙掕壊鍦ㄦ父鎴忎笘鐣屼腑鐨勭粯鍒堕珮搴︺€?*/
    drawSize: 46,
    frameDuration: 0.14,
    frameOrder: [0, 1, 2, 1],
    /** 绱犳潗琛岄『搴忥細涓嬨€佸乏銆佸彸銆佷笂銆?*/
    rowByFacing: {
      down: 0,
      left: 1,
      right: 2,
      up: 3,
    },
  },
};

export const AXIS = {
  /** 杩涘害鏉″崡銆佸寳涓ょ瀵瑰簲鐨勪笘鐣屽潗鏍囷紝鐢ㄦ潵璁＄畻鈥滀腑杞磋繘搴︹€濄€?*/
  southY: 2400,
  northY: 300,
};

/** 鍦板浘涓殑鍙偣鍑诲缓绛戙€傛柊澧炲缓绛戞椂锛屽線 data/pois.js 閲岃拷鍔犱竴椤瑰嵆鍙€?*/
export const HIT_SLOP = 6;

