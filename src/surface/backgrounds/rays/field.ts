// 行为规格参照 docs/research/catalog/backgrounds-1.md 与 backgrounds-2.md 的 Beams / LightRays / SideRays / LightPillar / LightTunnel / Lightfall / Lightning / PrismaticBurst / Prism 条目, 实现为 HX 自有.
import type { Rgb } from "../../backdrop/kernel/color";
import type { UniformList } from "../../backdrop/kernel/gl";
import { clamp } from "../../backdrop/kernel/math";

/** 光场的出光模式: 默认按覆盖率带透明度叠在任意底色上; 给了底色则屏幕混合后铺满. */
export const RAYS_COMPOSE = `
uniform vec4 u_backdrop;
uniform float u_fade;
const float RAYS_EPS = 0.0001;
vec4 rays_compose(vec3 light) {
  vec3 tone = hx_tonemap(light);
  float cover = max(tone.r, max(tone.g, tone.b));
  if (u_backdrop.w > 0.5) return vec4(1.0 - (1.0 - u_backdrop.rgb) * (1.0 - tone), 1.0);
  return vec4(tone / max(cover, RAYS_EPS), cover);
}
float rays_edge(vec2 uv) {
  if (u_fade <= 0.0) return 1.0;
  vec2 d = min(uv, 1.0 - uv);
  float span = 0.5 * u_fade;
  return smoothstep(0.0, span, d.x) * smoothstep(0.0, span, d.y);
}
vec3 rays_saturate(vec3 c, float amount) {
  return max(mix(vec3(hx_luma(c)), c, amount), 0.0);
}
`;

/** 光源方位名到归一化坐标 (y 朝上). 0.02 / 0.98 让光源略出画, 避免光心正好压在边上. */
export const RAY_ORIGINS = {
  "top-left": [0.02, 0.98],
  "top-center": [0.5, 1.02],
  "top-right": [0.98, 0.98],
  left: [-0.02, 0.5],
  right: [1.02, 0.5],
  "bottom-left": [0.02, 0.02],
  "bottom-center": [0.5, -0.02],
  "bottom-right": [0.98, 0.02],
} as const satisfies Record<string, readonly [number, number]>;

export type RayOrigin = keyof typeof RAY_ORIGINS;

/** 入场进度 0..1. 关掉入场或减弱动效 (elapsed 为 Infinity) 时直接为 1. */
export function introProgress(elapsed: number, seconds: number, enabled: boolean): number {
  if (!enabled || !Number.isFinite(elapsed) || seconds <= 0) return 1;
  return clamp(elapsed / seconds, 0, 1);
}

/** 指数跟随一步: cur 向 target 走 1 - exp(-dt * rate) 的比例. rate 为 0 或 dt 为 0 时原地. */
export function followStep(cur: number, target: number, dt: number, rate: number): number {
  if (dt <= 0 || rate <= 0) return dt <= 0 ? cur : target;
  return cur + (target - cur) * (1 - Math.exp(-dt * rate));
}

const GREY_MID = 0.5;
const GREY: Rgb = [GREY_MID, GREY_MID, GREY_MID];

/** 取第 i 个解析色, 缺了用中灰. */
export function rgbAt(colors: readonly Rgb[], i: number): Rgb {
  return colors[i] ?? GREY;
}

/** 底色 uniform: 有底色返回 rgb + 1, 否则全 0 (透明叠加). */
export function backdropOf(colors: readonly Rgb[], index: number, on: boolean): readonly [number, number, number, number] {
  const c = colors[index];
  return on && c ? [c[0], c[1], c[2], 1] : [0, 0, 0, 0];
}

/** 把若干颜色平铺成 vec3 数组 uniform, 不足 max 个时补最后一色. */
export function paletteList(colors: readonly Rgb[], max: number): UniformList {
  const list = new Float32Array(max * 3);
  const last = colors.length > 0 ? colors[colors.length - 1] : GREY;
  for (let i = 0; i < max; i += 1) list.set(colors[i] ?? last, i * 3);
  return { list, size: 3 };
}

/** 角度换弧度. */
export function radians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** 0..1 的画质系数换成像素比上限: 默认上限 2 乘画质, 下限 0.25. */
export function qualityDpr(dpr: number | undefined, quality: number): number {
  const DEFAULT_CAP = 2;
  const MIN_RATIO = 0.25;
  return Math.max(MIN_RATIO, (dpr ?? DEFAULT_CAP) * clamp(quality, 0, 1));
}

/** 宽高比 16:9, 用来把像素预算换成最长边上限 (本库定). */
const BUDGET_ASPECT = 16 / 9;

/** 像素预算换成画布最长边上限 (设备像素): 按 16:9 画面算, 超出由内核等比压缩. */
export function budgetEdge(pixels: number): number {
  return Math.round(Math.sqrt(pixels * BUDGET_ASPECT));
}
