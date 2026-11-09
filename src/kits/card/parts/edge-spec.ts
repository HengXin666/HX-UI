/**
 * EdgeGlow 的规格常数与纯函数: 指针离边远近, 指针方位角, 光锥渐变, 自演示扫边时间轴.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-card.md
 */
import { clamp } from "../tokens";

export const EDGE_DEFAULTS = { edgeSensitivity: 30, radius: 28, glowRadius: 40, glowIntensity: 1, coneSpread: 25, fillOpacity: 0.5 } as const;
/** 辉光出现 0.25s ease-out, 消退 0.75s ease-in-out (BorderGlow.css:46, 54). */
export const EDGE_IN_MS = 250;
export const EDGE_OUT_MS = 750;
/** 边框环宽 px (规格 css 未摘录, HX 自定). */
export const EDGE_RING_PX = 1.5;

/** 指针离卡心的归一化坐标 (-1..1) 换成离边远近 0..100: 卡心 0, 贴边 100. */
export function edgeProximity(nx: number, ny: number): number {
  return clamp(Math.max(Math.abs(nx), Math.abs(ny)), 0, 1) * 100;
}

/** 远近 0..100 按 edgeSensitivity 换成辉光强度 0..1: 只在离边 sensitivity 以内亮. */
export function edgeLevel(proximity: number, sensitivity: number): number {
  const s = clamp(sensitivity, 1, 100);
  return clamp((proximity - (100 - s)) / s, 0, 1);
}

/** 指针方位角, 正上方 0 度, 顺时针增大, 落在 [0, 360). */
export function edgeAngle(nx: number, ny: number): number {
  const deg = (Math.atan2(ny, nx) * 180) / Math.PI + 90;
  return ((deg % 360) + 360) % 360;
}

/** 以 var(--edge-angle) 为中心, 张角 2 × spread 的光锥. 颜色依次铺在锥内. */
export function edgeCone(colors: readonly string[], spread: number): string {
  const s = clamp(spread, 1, 180);
  const list = colors.length ? colors : ["currentColor"];
  const stops = list.map((c, i) => `${c} ${(list.length === 1 ? s : (i / (list.length - 1)) * 2 * s).toFixed(1)}deg`);
  return `conic-gradient(from calc(var(--edge-angle, 0deg) - ${s}deg), transparent 0deg, ${stops.join(", ")}, transparent ${(2 * s).toFixed(1)}deg)`;
}

const easeIn = (t: number): number => t * t * t;
const easeOut = (t: number): number => 1 - (1 - t) ** 3;
const seg = (t: number, delay: number, dur: number): number => clamp((t - delay) / dur, 0, 1);

/** 自演示总长 ms (最后一段 2500 + 1500). */
export const EDGE_SWEEP_MS = 4000;

/**
 * 自演示扫边 (BorderGlow.jsx:129-136): 远近 0 → 100 用 500ms 三次缓出, 2500ms 后 100 → 0 用 1500ms 三次缓入;
 * 方位 0 → 50% 用 1500ms 三次缓入, 接着 50% → 100% 用 2250ms 三次缓出. 返回远近 0..100 与角度 deg.
 */
export function edgeSweep(tMs: number): { readonly proximity: number; readonly angle: number } {
  const up = easeOut(seg(tMs, 0, 500)) * 100;
  const down = easeIn(seg(tMs, 2500, 1500)) * 100;
  const turn = tMs < 1500 ? easeIn(seg(tMs, 0, 1500)) * 50 : 50 + easeOut(seg(tMs, 1500, 2250)) * 50;
  return { proximity: up - down, angle: turn * 3.6 };
}
