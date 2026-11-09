/**
 * TintGrid 的规格常数与纯函数: 指针跟随系数, 显色强度趋近, 聚光遮罩.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-stack.md
 */
import { clamp } from "../tokens";

export const CHROMA_DEFAULTS = {
  columns: 3,
  minCardWidth: 180,
  gap: 12,
  radius: 260,
  softness: 0.6,
  damping: 0.45,
  fadeOut: 0.6,
  grayscale: 1,
  dim: 0.12,
  glow: 0.5,
  borderGlow: 1,
  aspectRatio: "3 / 2",
  cardRadius: 22,
} as const;
/** 卡片滤镜过渡 0.25s ease, 信息层等其余过渡 0.3s (ChromaGrid.css:60, 198-208). */
export const CHROMA_FILTER_MS = 250;
export const CHROMA_FADE_MS = 300;
/** 指针跟随时间常数 = damping × 0.32 s, 下限 0.01 s (ChromaGrid.jsx:145). */
export const CHROMA_FOLLOW_SCALE = 0.32;
export const CHROMA_FOLLOW_MIN_S = 0.01;
/** 指针进入时显色强度升起的时间常数 s. 规格只给了离开用 fadeOut, 进入值 HX 自定. */
export const CHROMA_RISE_S = 0.2;

export type ChromaReveal = "spotlight" | "card";

/** 一帧的指针跟随比例. 减弱动效时为 1. */
export function chromaFollow(dtMs: number, damping: number, reduced: boolean): number {
  if (reduced) return 1;
  return 1 - Math.exp(-dtMs / 1000 / Math.max(CHROMA_FOLLOW_MIN_S, damping * CHROMA_FOLLOW_SCALE));
}

/** 显色强度一帧: 升起用 0.2s, 回落用 fadeOut (ChromaGrid.jsx:149 的写法). */
export function chromaPower(power: number, target: number, dtMs: number, fadeOut: number, reduced: boolean): number {
  if (reduced) return target;
  const span = Math.max(0.01, target > power ? CHROMA_RISE_S : fadeOut);
  const next = power + (target - power) * (1 - Math.exp(-dtMs / 1000 / span));
  return Math.abs(target - next) < 0.001 ? target : next;
}

/**
 * 去色层的遮罩: 指针处半径 radius × power 的圆内透明 (露出原色), 内圈 (1 - softness) 全透, 往外渐到全遮.
 * power 为 0 时整层全遮 (全部去色).
 */
export function chromaMask(x: number, y: number, radius: number, softness: number, power: number): string {
  const r = Math.max(0, radius * clamp(power, 0, 1));
  if (r < 0.5) return "linear-gradient(black, black)";
  const inner = r * (1 - clamp(softness, 0, 1));
  return `radial-gradient(circle at ${x.toFixed(1)}px ${y.toFixed(1)}px, transparent 0px, transparent ${inner.toFixed(1)}px, black ${r.toFixed(1)}px)`;
}
