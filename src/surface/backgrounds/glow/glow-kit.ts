// 行为规格参照 docs/research/catalog/backgrounds-1.md 与 backgrounds-2.md 的 glow 路条目 (Aurora 等着色器场) 共用部分, 实现为 HX 自有.
import type { Rgb } from "../../backdrop/kernel/color";
import type { UniformList } from "../../backdrop/kernel/gl";
import { approach, clamp } from "../../backdrop/kernel/math";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";

/** 颜色数组 uniform 的步长 (vec3). */
export const RGB_STRIDE = 3;
/** 颜色解析失败时的中灰兜底. */
export const NEUTRAL: Rgb = [0.5, 0.5, 0.5];
/** 亮色兜底 (高光一类的第二色). */
export const LIGHT: Rgb = [0.95, 0.95, 0.95];

/**
 * 颜色表换成定长 vec3 数组 uniform, 不足 max 的位置重复最后一色, 超出的截掉.
 *
 * @param colors 内核解析出的 sRGB 列表.
 * @param max 着色器里数组的长度.
 */
export function colorList(colors: readonly Rgb[], max: number): UniformList {
  const list = new Float32Array(max * RGB_STRIDE);
  const source = colors.length ? colors : [NEUTRAL];
  for (let i = 0; i < max; i += 1) list.set(source[Math.min(i, source.length - 1)], i * RGB_STRIDE);
  return { list, size: RGB_STRIDE };
}

/** 颜色表实际参与的个数: 至少 1, 至多 max. */
export function colorCount(colors: readonly unknown[], max: number): number {
  return clamp(colors.length, 1, max);
}

/**
 * 入场进度 0..1. 关掉入场或减弱动效 (elapsed 为 Infinity) 时直接为 1.
 *
 * @param elapsed 内核的出帧真实秒数.
 * @param seconds 入场时长.
 * @param enabled intro prop.
 */
export function introProgress(elapsed: number, seconds: number, enabled: boolean): number {
  if (!enabled || !Number.isFinite(elapsed) || seconds <= 0) return 1;
  return clamp(elapsed / seconds, 0, 1);
}

/** 指数跟随的速率 k (每秒) 换成时间常数 tau = 1 / k: 规格里 1 - exp(-dt * k) 与 approach(..., tau) 等价. */
export function tauOf(rate: number): number {
  return rate > 0 ? 1 / rate : 0;
}

/** 平滑后的指针: 归一化坐标 (y 朝上), 速度 (每秒归一化单位), 在场程度 0..1. */
export interface Follower {
  x: number;
  y: number;
  vx: number;
  vy: number;
  presence: number;
}

/** 跟随的时间常数 (秒): 位置, 速度, 进场, 离场. */
export interface FollowTaus {
  readonly move: number;
  readonly drag?: number;
  readonly enter: number;
  readonly leave: number;
}

const CENTER = 0.5;
/** 速度换算时的帧长下限 (秒), 防止除零. */
const MIN_DT = 0.001;

export function createFollower(): Follower {
  return { x: CENTER, y: CENTER, vx: 0, vy: 0, presence: 0 };
}

/**
 * 按帧推进平滑指针. 静态帧 (dt 为 0) 不动; 关掉交互时在场程度退回 0.
 *
 * @param f 跟随状态, 原地修改.
 * @param frame 当前帧.
 * @param taus 各分量的时间常数.
 * @param enabled 是否响应指针.
 */
export function stepFollower(f: Follower, frame: Pick<BackdropFrame, "dt" | "pointer">, taus: FollowTaus, enabled: boolean): void {
  const { dt, pointer } = frame;
  if (dt <= 0) return;
  const engaged = enabled && pointer.inside;
  const px = f.x;
  const py = f.y;
  if (engaged) {
    f.x = approach(f.x, pointer.x, dt, taus.move);
    f.y = approach(f.y, pointer.y, dt, taus.move);
  }
  const drag = taus.drag ?? taus.move;
  f.vx = approach(f.vx, (f.x - px) / Math.max(dt, MIN_DT), dt, drag);
  f.vy = approach(f.vy, (f.y - py) / Math.max(dt, MIN_DT), dt, drag);
  f.presence = approach(f.presence, engaged ? 1 : 0, dt, engaged ? taus.enter : taus.leave);
}

/** 角度 (度) 换弧度. */
export const DEG = Math.PI / 180;

/**
 * 本路各件共用的收尾: 边缘渐隐 (fade), 胶片颗粒 (grain), 亮底模式 (light) 下把光色压成墨色.
 * 输出直通 alpha (上下文 premultipliedAlpha 为 false). 依赖 GLSL_HASH 与 GLSL_UTIL.
 */
export const GLOW_GLSL = `
uniform float u_light;
uniform float u_fade;
uniform float u_grain;
vec4 glow_finish(vec3 ink, float density, vec2 frag) {
  vec2 uv = frag / u_res;
  float edge = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
  float mask = mix(1.0, smoothstep(0.0, 0.35, edge), clamp(u_fade, 0.0, 1.0));
  float a = clamp(density * mask + hx_grain(frag, u_time) * u_grain * density, 0.0, 1.0);
  vec3 dark = clamp(ink, 0.0, 1.0);
  vec3 light = clamp(mix(ink, ink * ink, 0.55), 0.0, 1.0);
  return vec4(mix(dark, light, u_light), a);
}
`;

/** 收尾三个 uniform. */
export function finishUniforms(lightMode: boolean, fade: number, grain: number): { u_light: number; u_fade: number; u_grain: number } {
  return { u_light: lightMode ? 1 : 0, u_fade: fade, u_grain: grain };
}
