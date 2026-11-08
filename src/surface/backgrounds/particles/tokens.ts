// 行为规格参照 docs/research/catalog/backgrounds-1.md 与 backgrounds-2.md 的 particles 路各条目 (Particles, Galaxy, Hyperspeed, Antigravity, Ballpit, AeroShards, GhostFibers, MagnetLines, GradientBlinds), 实现为 HX 自有.
import type { Rgb } from "../../backdrop/kernel/color";
import type { UniformList } from "../../backdrop/kernel/gl";
import type { CanvasFit } from "../../backdrop/kernel/math";

/** 整圈弧度. */
export const TURN = Math.PI * 2;
export const HALF = 0.5;
/** 角度换弧度. */
export const DEG = Math.PI / 180;
/** 颜色解析失败时的中灰. */
const MID_GREY: Rgb = [HALF, HALF, HALF];
/** color(srgb ...) 串里每个通道保留的小数位. */
const INK_DIGITS = 4;

/**
 * 内核解析出的 sRGB 写成 2d 画布能用的 color(srgb r g b / a) 串. 不出现任意色值字面量.
 *
 * @param rgb 0..1 三通道, 缺省为中灰.
 * @param alpha 不透明度 0..1.
 */
export function inkOf(rgb: Rgb | undefined, alpha: number = 1): string {
  const [r, g, b] = rgb ?? MID_GREY;
  const a = Math.min(1, Math.max(0, alpha));
  return `color(srgb ${r.toFixed(INK_DIGITS)} ${g.toFixed(INK_DIGITS)} ${b.toFixed(INK_DIGITS)} / ${a.toFixed(INK_DIGITS)})`;
}

/** 两色按 t 线性混合 (sRGB 空间, 给渐变取色用). */
export function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** 按序号循环取色, 列表为空时中灰. */
export function pickColor(colors: readonly Rgb[], index: number): Rgb {
  if (colors.length === 0) return MID_GREY;
  return colors[((Math.floor(index) % colors.length) + colors.length) % colors.length];
}

/** 沿 0..1 在色板上连续取色 (首尾不循环). */
export function rampColor(colors: readonly Rgb[], t: number): Rgb {
  if (colors.length <= 1) return pickColor(colors, 0);
  const x = Math.min(1, Math.max(0, t)) * (colors.length - 1);
  const i = Math.min(colors.length - 2, Math.floor(x));
  return mixRgb(colors[i], colors[i + 1], x - i);
}

/**
 * 可复现的伪随机 (mulberry32 结构). 同一种子同一序列, 粒子布局在重渲染之间不跳.
 *
 * @param seed 任意整数种子.
 */
export function seeded(seed: number): () => number {
  let s = Math.floor(seed) >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 一阶跟随每帧走的比例 1 - exp(-dt / tau); tau 不大于 0 时一步到位. */
export function follow(dt: number, tau: number): number {
  return tau <= 0 ? 1 : 1 - Math.exp(-dt / tau);
}

/** 归一化指针坐标 (y 朝上) 换设备像素 (y 朝下). */
export function toPixels(x: number, y: number, fit: CanvasFit): [number, number] {
  return [x * fit.width, (1 - y) * fit.height];
}

/**
 * 入场进度 0..1. 减弱动效的静态帧 elapsed 为 Infinity, 视为入场结束; 关掉入场时恒为 1.
 *
 * @param elapsed 出帧以来真实秒数.
 * @param seconds 入场时长.
 * @param enabled 是否有入场.
 */
export function introProgress(elapsed: number, seconds: number, enabled: boolean): number {
  if (!enabled || !Number.isFinite(elapsed) || seconds <= 0) return 1;
  return Math.min(1, Math.max(0, elapsed / seconds));
}

/** Hermite 平滑阶跃, 与 GLSL smoothstep 同义 (允许 edge0 > edge1 反向). */
export function smooth(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * 色板摊成着色器的 vec3 数组 uniform, 不足 max 个用最后一色补齐.
 *
 * @param colors 解析后的 sRGB 列表.
 * @param max 着色器里数组的长度.
 */
export function paletteUniform(colors: readonly Rgb[], max: number): UniformList {
  const list = new Float32Array(max * 3);
  for (let i = 0; i < max; i += 1) list.set(pickColor(colors, Math.min(i, Math.max(0, colors.length - 1))), i * 3);
  return { list, size: 3 };
}

/** 角度差折回 (-period/2, period/2]. */
export function wrapAngle(a: number, period: number = TURN): number {
  return a - period * Math.round(a / period);
}

/** 清屏 (Canvas2D 背景每帧自己擦). */
export function clearFrame(ctx: CanvasRenderingContext2D, fit: CanvasFit): void {
  ctx.clearRect(0, 0, fit.width, fit.height);
}
