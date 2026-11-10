// 行为规格参照 docs/research/catalog/animations.md 的 MetallicPaint, ShapeBlur, ElectricLogo 条目 (形状遮罩栅格化), 实现为 HX 自有.
/**
 * 把文字, 图片或路径画成一张白色遮罩画布 (alpha 即形状), 给着色器当纹理. 拿不到 2d 上下文时返回 null.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-field.md
 */

export interface MaskCanvas {
  readonly canvas: HTMLCanvasElement;
  /** 宽 / 高. */
  readonly aspect: number;
}

const PAD = 0.08;
const INK = "white";

function sheet(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext("2d");
  return ctx ? { canvas, ctx } : null;
}

/** 遮罩画布的尺寸: 长边 = size, 另一边按宽高比. */
export function maskSize(aspect: number, size: number): readonly [number, number] {
  const a = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
  return a >= 1 ? [size, Math.max(8, Math.round(size / a))] : [Math.max(8, Math.round(size * a)), size];
}

/** 文字遮罩: 先量宽度定宽高比, 再按长边铺满 (留 8% 边). */
export function rasterText(text: string, fontFamily: string, fontWeight: number, size: number): MaskCanvas | null {
  const probe = sheet(1, 1);
  if (!probe || !text) return null;
  const font = (px: number): string => `${fontWeight} ${px}px ${fontFamily}`;
  probe.ctx.font = font(100);
  const width = Math.max(1, probe.ctx.measureText(text).width || text.length * 60);
  const aspect = width / 120;
  const [w, h] = maskSize(aspect, size);
  const out = sheet(w, h);
  if (!out) return null;
  const px = Math.min((h * (1 - 2 * PAD)) / 1.2, (w * (1 - 2 * PAD) * 100) / width);
  out.ctx.font = font(px);
  out.ctx.fillStyle = INK;
  out.ctx.textAlign = "center";
  out.ctx.textBaseline = "middle";
  out.ctx.fillText(text, w / 2, h / 2);
  return { canvas: out.canvas, aspect: w / h };
}

/** 图片遮罩: 按图片宽高比, 原样画进去 (图片自己的透明度即形状). */
export function rasterImage(image: CanvasImageSource & { width: number; height: number }, size: number): MaskCanvas | null {
  const aspect = image.width > 0 && image.height > 0 ? image.width / image.height : 1;
  const [w, h] = maskSize(aspect, size);
  const out = sheet(w, h);
  if (!out) return null;
  out.ctx.drawImage(image, w * PAD, h * PAD, w * (1 - 2 * PAD), h * (1 - 2 * PAD));
  return { canvas: out.canvas, aspect: w / h };
}

/** 路径遮罩: SVG path 数据, 视框 viewBox 为 [宽, 高]. */
export function rasterPath(d: string, viewBox: readonly [number, number], size: number): MaskCanvas | null {
  const aspect = viewBox[0] / viewBox[1];
  const [w, h] = maskSize(aspect, size);
  const out = sheet(w, h);
  if (!out || typeof Path2D === "undefined") return null;
  out.ctx.translate(w * PAD, h * PAD);
  out.ctx.scale((w * (1 - 2 * PAD)) / viewBox[0], (h * (1 - 2 * PAD)) / viewBox[1]);
  out.ctx.fillStyle = INK;
  out.ctx.fill(new Path2D(d));
  return { canvas: out.canvas, aspect: w / h };
}

/** 屏幕到遮罩的 GLSL 映射 (内核上传纹理时已翻转 y, 直接按 y 朝上取): 以短边为单位的居中坐标, 转 rotation, 除以 scale, 长边铺满. 需要 u_res, u_mask_aspect, u_mask_scale, u_mask_rot. */
export const MASK_UV_GLSL = `
uniform float u_mask_aspect;
uniform float u_mask_scale;
uniform float u_mask_rot;
vec2 maskUv(vec2 uv) {
  vec2 q = (uv - 0.5) * u_res / min(u_res.x, u_res.y);
  float c = cos(u_mask_rot);
  float s = sin(u_mask_rot);
  q = mat2(c, s, -s, c) * q / max(u_mask_scale, 1e-3);
  vec2 box = u_mask_aspect >= 1.0 ? vec2(1.0, 1.0 / u_mask_aspect) : vec2(u_mask_aspect, 1.0);
  return q / box + 0.5;
}
float maskAt(sampler2D m, vec2 uv) {
  vec2 p = maskUv(uv);
  if (p.x < 0.0 || p.y < 0.0 || p.x > 1.0 || p.y > 1.0) return 0.0;
  return texture(m, p).a;
}
`;
