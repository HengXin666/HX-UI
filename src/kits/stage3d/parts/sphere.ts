/**
 * SphereMenu 的规格常数与球面数学: 斐波那契球面布点, 球心旋转后的朝前程度, 最近朝前格, 吸附目标, 各趋近速率.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-stage3d.md
 */
import { TAU, clamp } from "../tokens";

/** 格数 160, 格大小 0.63, 圆角 0.2, 拉近 1.65, 后退 1, 拉伸 0.6, 惯性 0.6, 自动播放 3s, 压暗 0.5 (InfiniteMenu.jsx:157-166). */
export const SPHERE_DEFAULTS = { count: 160, tileSize: 0.63, roundness: 0.2, zoom: 1.65, pullBack: 1, stretch: 0.6, inertia: 0.6, autoplay: 3, dim: 0.5 } as const;
/** 显现 0.7s; 拖拽跟手 exp(-30 dt); 拖拽中速度衰减 14/s, 自由时 (6 - 5 inertia)/s; 吸附 6/s (有目标) 或 8/s; 镜头 4.5/s; 位移 6/s (InfiniteMenu.jsx:536-605). */
export const SPHERE_REVEAL_S = 0.7;
export const SPHERE_RATES = { follow: 30, dragDecay: 14, snapTarget: 6, snapFree: 8, camera: 4.5, shift: 6, settleIn: 3, settleOut: 10 } as const;
/** 信息栏切换 0.45s outQuint; 格子按压 0.18s (InfiniteMenu.css:41-117). */
export const SPHERE_INFO_MS = 450;
export const SPHERE_PRESS_MS = 180;
/** 拖拽 rad/px, 俯仰上限, 速度低于此值 (rad/s) 开始吸附, 移动时镜头退后量 (规格的四元数轨迹球数值未摘录, 以下 HX 自定). */
export const SPHERE_DRAG = 0.005;
export const SPHERE_PITCH_LIMIT = 1.3;
export const SPHERE_SNAP_SPEED = 0.35;
export const SPHERE_PULL = 0.18;
/** 背面阈值: 朝前程度低于此值的格子隐藏 (规格 alpha 用 smoothstep(0.02, 0.4, front)). */
export const SPHERE_FRONT_HIDE = 0.02;
export const SPHERE_FRONT_FULL = 0.4;
/** 聚焦格判定 smoothstep(0.93, 0.997, front) (InfiniteMenu.jsx:77). */
export const SPHERE_FOCUS = [0.93, 0.997] as const;

export interface SpherePoint {
  readonly lon: number;
  readonly lat: number;
}

/** 斐波那契球面: n 个近似均匀的经纬点 (弧度). */
export function fibonacciSphere(n: number): SpherePoint[] {
  const out: SpherePoint[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i += 1) {
    const y = n === 1 ? 0 : 1 - (i / (n - 1)) * 2;
    out.push({ lat: Math.asin(clamp(y, -1, 1)), lon: wrapAngle(i * golden) });
  }
  return out;
}

/** 角度折到 [-pi, pi). */
export function wrapAngle(a: number): number {
  const t = (((a + Math.PI) % TAU) + TAU) % TAU;
  return t - Math.PI;
}

/** 球按 rotateX(pitch) rotateY(yaw) 转过后, 格子朝前程度 (单位球上的 z, -1..1). */
export function frontness(p: SpherePoint, yaw: number, pitch: number): number {
  const a = p.lon + yaw;
  return Math.sin(p.lat) * Math.sin(pitch) + Math.cos(p.lat) * Math.cos(a) * Math.cos(pitch);
}

/** 最朝前的格子序号. */
export function frontmost(points: readonly SpherePoint[], yaw: number, pitch: number): number {
  let best = -1;
  let score = -2;
  points.forEach((p, i) => {
    const f = frontness(p, yaw, pitch);
    if (f > score) {
      score = f;
      best = i;
    }
  });
  return best;
}

/** 把格子转到正前方的目标角: yaw 取离当前最近的等价角. */
export function snapTarget(p: SpherePoint, yaw: number): { readonly yaw: number; readonly pitch: number } {
  const want = 0 - p.lon;
  return { yaw: yaw + wrapAngle(want - yaw), pitch: clamp(p.lat, 0 - SPHERE_PITCH_LIMIT, SPHERE_PITCH_LIMIT) };
}

/** 格子透明度与压暗: 背面隐去, 非聚焦格按 dim 压暗. */
export function tileLook(front: number, dim: number): { readonly alpha: number; readonly focus: number; readonly shade: number } {
  const s = (lo: number, hi: number, x: number): number => {
    const t = clamp((x - lo) / (hi - lo), 0, 1);
    return t * t * (3 - 2 * t);
  };
  const focus = s(SPHERE_FOCUS[0], SPHERE_FOCUS[1], front);
  return { alpha: s(SPHERE_FRONT_HIDE, SPHERE_FRONT_FULL, front), focus, shade: 1 - clamp(dim, 0, 1) * (1 - focus) };
}

/** 第 item 项 (格子按 i % items 循环填) 里最朝前的那格. */
export function nearestOfItem(points: readonly SpherePoint[], item: number, items: number, yaw: number, pitch: number): number {
  let best = -1;
  let score = -2;
  points.forEach((p, i) => {
    if (items <= 0 || i % items !== item) return;
    const f = frontness(p, yaw, pitch);
    if (f > score) [best, score] = [i, f];
  });
  return best;
}

/** 弧度换成 CSS 度数串. */
export function toDeg(r: number): string {
  return ((r * 180) / Math.PI).toFixed(2);
}
