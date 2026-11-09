// 行为规格参照 docs/research/catalog/backgrounds-1.md 与 backgrounds-2.md 的 Backgrounds 条目 (技法: WebGL + canvas2d), 实现为 HX 自有.
// fluid 路的 Canvas2D 预烘: 把纯函数算出的 RGBA 字节画进一张 2D 画布, 交给 ShaderSpec.textures 上传. 不用任何颜色字面量.

/** 一张预烘画布与它的 2D 上下文. */
export interface BakeSurface {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
}

/**
 * 建一张预烘画布. 没有 document 或拿不到 2D 上下文 (SSR, 测试环境) 时返回 null, 调用方当作没有这张纹理.
 *
 * @param width 宽 (像素).
 * @param height 高 (像素).
 */
export function bakeSurface(width: number, height: number): BakeSurface | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext("2d");
  return ctx ? { canvas, ctx } : null;
}

/**
 * 把一块 RGBA 字节 (行优先, 第 0 行在上) 画进新画布. 上传时内核会翻转 y, 所以第 0 行对应 v = 1.
 *
 * @param width 宽 (像素).
 * @param height 高 (像素).
 * @param bytes width * height * 4 个字节.
 */
export function paintBytes(width: number, height: number, bytes: Uint8ClampedArray): HTMLCanvasElement | null {
  const surface = bakeSurface(width, height);
  if (!surface) return null;
  const image = surface.ctx.createImageData(width, height);
  image.data.set(bytes.subarray(0, image.data.length));
  surface.ctx.putImageData(image, 0, 0);
  return surface.canvas;
}

/**
 * 按纹理坐标 (u 向右, v 向上) 逐像素烘一张 RGBA 字节图.
 *
 * @param width 宽 (像素).
 * @param height 高 (像素).
 * @param texel 给出 (u, v) 处 0..1 的四个通道.
 */
export function bakeBytes(width: number, height: number, texel: (u: number, v: number) => readonly [number, number, number, number]): Uint8ClampedArray {
  const out = new Uint8ClampedArray(width * height * 4);
  for (let row = 0; row < height; row += 1) {
    const v = 1 - (row + 0.5) / height;
    for (let col = 0; col < width; col += 1) {
      const px = texel((col + 0.5) / width, v);
      const at = (row * width + col) * 4;
      out[at] = Math.round(px[0] * 255);
      out[at + 1] = Math.round(px[1] * 255);
      out[at + 2] = Math.round(px[2] * 255);
      out[at + 3] = Math.round(px[3] * 255);
    }
  }
  return out;
}
