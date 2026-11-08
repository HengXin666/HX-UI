// 行为规格参照 docs/research/catalog/backgrounds-1.md 与 backgrounds-2.md 的 lines 路各条目 (FloatingLines 到 PatternWaves) 的共用部分, 实现为 HX 自有.
/**
 * lines 路共用: 调色板 uniform, 入场进度, 一阶跟随的指针, 画布颜色串, 以及着色器里的调色板 / 边缘淡出 / 线条覆盖率片段.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-lines.md
 */
import { approach, clamp, type BackdropFrame, type Rgb, type UniformList } from "../../backdrop/kernel";

/** 调色板 uniform 的长度上限 (各条目的 MAX_COLORS / MAX_STOPS 取 8). */
export const LINE_MAX_COLORS = 8;
/** 颜色解析失败时的中灰. */
export const LINE_GREY: Rgb = [0.5, 0.5, 0.5];
/** 线宽, 光晕等像素量按 CSS 像素给, 着色器里乘 u_dpr. 入场的默认时长 (条目 INTRO_SECONDS 1.8). */
export const LINE_INTRO_SECONDS = 1.8;

/**
 * 颜色列表摊平成 vec3 u_colors[8], 不足的位置用最后一个颜色补齐 (片元里越界取色也不会取到黑).
 *
 * @param colors 内核解析出的 sRGB.
 * @param max 槽位数.
 */
export function paletteUniform(colors: readonly Rgb[], max: number = LINE_MAX_COLORS): UniformList {
  const list = new Float32Array(max * 3);
  const last = colors[colors.length - 1] ?? LINE_GREY;
  for (let i = 0; i < max; i += 1) list.set(colors[i] ?? last, i * 3);
  return { list, size: 3 };
}

/** 调色板里实际有几个颜色 (1..max). */
export function paletteCount(colors: readonly Rgb[], max: number = LINE_MAX_COLORS): number {
  return clamp(colors.length, 1, max);
}

/** 计数 prop 取整并钳到 [1, max], 非有限值取 1. */
export function clampCount(value: number, max: number): number {
  return Number.isFinite(value) ? clamp(Math.round(value), 1, max) : 1;
}

/**
 * 入场进度 0..1. 关掉入场, 减弱动效 (elapsed 为 Infinity) 或时长不正时直接为 1.
 *
 * @param elapsed 内核的出帧秒数.
 * @param seconds 入场时长.
 * @param enabled intro prop.
 */
export function introProgress(elapsed: number, seconds: number, enabled: boolean): number {
  if (!enabled || !Number.isFinite(elapsed) || seconds <= 0) return 1;
  return clamp(elapsed / seconds, 0, 1);
}

/** 一阶跟随的指针: 坐标与在场程度, 给需要比内核更慢或更快跟手的件. */
export interface FollowPointer {
  x: number;
  y: number;
  presence: number;
}

export function createFollowPointer(): FollowPointer {
  return { x: 0.5, y: 0.5, presence: 0 };
}

/**
 * 每帧把跟随指针往内核指针走一步. 静态帧与减弱动效直接落到目标.
 *
 * @param state 被改写的跟随状态.
 * @param frame 当前帧.
 * @param tau 坐标的时间常数 (秒).
 * @param enabled 是否响应指针; 关掉时在场程度回到 0.
 */
export function stepFollow(state: FollowPointer, frame: Pick<BackdropFrame, "dt" | "still" | "pointer">, tau: number, enabled = true): FollowPointer {
  const snap = frame.still;
  const target = enabled ? frame.pointer.presence : 0;
  state.x = snap ? frame.pointer.x : approach(state.x, frame.pointer.x, frame.dt, tau);
  state.y = snap ? frame.pointer.y : approach(state.y, frame.pointer.y, frame.dt, tau);
  state.presence = snap ? target : approach(state.presence, target, frame.dt, tau);
  return state;
}

/** sRGB 0..1 加透明度换成 Canvas2D 颜色串 (CSS Color 4 的 color(srgb ...)). */
export function inkOf(rgb: Rgb | undefined, alpha = 1): string {
  const [r, g, b] = rgb ?? LINE_GREY;
  return `color(srgb ${r.toFixed(4)} ${g.toFixed(4)} ${b.toFixed(4)} / ${clamp(alpha, 0, 1).toFixed(4)})`;
}

/** 角度换弧度. */
export const DEG = Math.PI / 180;

/**
 * 着色器片段: 调色板与线条工具. 依赖 GLSL_UTIL (HX_PI).
 * ln_palette(x) 沿 0..1 在各色之间做 smoothstep 过渡; ln_cycle(x) 首尾相接循环;
 * ln_edge_fade(uv, size) 四边淡出; ln_line(dist, halfWidth, soft) 是一条线的覆盖率.
 */
export const GLSL_LINES = `
uniform vec3 u_colors[${LINE_MAX_COLORS}];
uniform float u_color_count;
vec3 ln_palette(float x) {
  float n = clamp(u_color_count, 1.0, ${LINE_MAX_COLORS}.0);
  if (n < 1.5) return u_colors[0];
  float f = clamp(x, 0.0, 1.0) * (n - 1.0);
  int i = int(min(floor(f), n - 2.0));
  return mix(u_colors[i], u_colors[i + 1], smoothstep(0.0, 1.0, f - float(i)));
}
vec3 ln_cycle(float x) {
  float n = clamp(u_color_count, 1.0, ${LINE_MAX_COLORS}.0);
  float f = fract(x) * n;
  int i = int(floor(f));
  int j = int(mod(float(i) + 1.0, n));
  return mix(u_colors[i], u_colors[j], smoothstep(0.0, 1.0, f - float(i)));
}
float ln_edge_fade(vec2 uv, float size) {
  if (size <= 0.0) return 1.0;
  vec2 d = min(uv, 1.0 - uv);
  return smoothstep(0.0, size, d.x) * smoothstep(0.0, size, d.y);
}
float ln_line(float dist, float halfWidth, float soft) {
  return smoothstep(halfWidth + soft, halfWidth - soft, dist);
}
`;
