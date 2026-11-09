/**
 * LampCard 的规格常数与纯函数: 光斑跟随与显隐的时间常数, 按下闪光, 近场判定, 光斑渐变.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-card.md
 */
import { clamp } from "../tokens";

export const LAMP_DEFAULTS = { intensity: 0.15, size: 240, softness: 0.7, borderGlow: 0.6, proximity: 80, smoothing: 0.3 } as const;
/** 跟随 tau = 0.015 + smoothing × 0.22 s; smoothing 0 直接贴指针 (SpotlightCard.jsx:176). */
export const LAMP_FOLLOW_BASE_S = 0.015;
export const LAMP_FOLLOW_SPAN_S = 0.22;
/** 显隐: 亮 0.1s, 暗 0.32s (SpotlightCard.jsx:179). */
export const LAMP_PRESENCE_S = { rise: 0.1, fall: 0.32 } as const;
/** 按下闪光: 起 0.05s, 落 0.28s (SpotlightCard.jsx:183). */
export const LAMP_FLARE_S = { rise: 0.05, fall: 0.28 } as const;
/** 闪光时光斑强度与尺寸的放大量 (规格未摘录, HX 自定). */
export const LAMP_FLARE_GAIN = 0.6;
export const LAMP_FLARE_GROW = 0.15;
/** ambient 时无指针光斑停在卡心的强度比 (HX 自定). */
export const LAMP_AMBIENT = 0.35;

export type LampShape = "circle" | "ellipse";

export function lampFollowTau(smoothing: number): number {
  return smoothing <= 0 ? 0 : LAMP_FOLLOW_BASE_S + clamp(smoothing, 0, 1) * LAMP_FOLLOW_SPAN_S;
}

/** 指针离卡 out px 时的显隐目标: 卡内 1, proximity 外 0, 之间线性. */
export function lampReach(out: number, proximity: number): number {
  if (out <= 0) return 1;
  return proximity <= 0 ? 0 : clamp(1 - out / proximity, 0, 1);
}

/** 光斑渐变: 实心段占 (1 - softness), 之后淡到透明. size 为直径. */
export function lampGradient(shape: LampShape, size: number, softness: number, color: string): string {
  const r = Math.max(1, size / 2);
  const solid = Math.round((1 - clamp(softness, 0, 1)) * 100);
  const geo = shape === "ellipse" ? `ellipse ${r.toFixed(0)}px ${(r * 0.6).toFixed(0)}px` : `circle ${r.toFixed(0)}px`;
  return `radial-gradient(${geo} at var(--lx, 50%) var(--ly, 50%), ${color} ${solid}%, transparent 100%)`;
}
