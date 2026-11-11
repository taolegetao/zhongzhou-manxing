/**
 * 极简图片预加载器。
 * 所有素材在开始页加载完成后再进入游戏，避免人物或地图“半张图”出现。
 */
export class AssetStore {
  constructor() {
    /** @type {Map<string, HTMLImageElement>} */
    this.images = new Map();
  }

  get(id) {
    const image = this.images.get(id);
    if (!image) {
      throw new Error(`素材尚未加载：${id}`);
    }
    return image;
  }

  has(id) {
    return this.images.has(id);
  }

  /**
   * @param {{ id: string, src: string }[]} manifest
   * @param {(progress: number) => void} [onProgress]
   */
  async loadAll(manifest, onProgress) {
    let finished = 0;
    const total = manifest.length;

    await Promise.all(
      manifest.map(async ({ id, src }) => {
        const image = await loadImage(src);
        this.images.set(id, image);
        finished += 1;
        onProgress?.(total === 0 ? 1 : finished / total);
      }),
    );

    onProgress?.(1);
    return this.images;
  }
}

/**
 * @param {string} src
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`无法加载素材：${src}`));
    image.src = src;
  });
}
