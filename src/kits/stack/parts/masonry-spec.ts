/**
 * FlowMasonry 的规格常数与纯函数: 列数断点, 最短列落位, 入场起点, 揭开进度.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-stack.md
 */
import { TAU, clamp, omegaSpring } from "../../tokens";

export const MASONRY_DEFAULTS = { stagger: 0.05, duration: 0.6, gap: 16, hoverScale: 0.95 } as const;
/** 卡片位移与阴影 0.5s, 悬停缩放 0.25s, 透明度 0.35s (Masonry.css:40-60). */
export const MASONRY_MOVE_MS = 500;
export const MASONRY_HOVER_MS = 250;
export const MASONRY_FADE_MS = 350;
/** 揭开时的最大模糊 px (Masonry.jsx:255). */
export const MASONRY_BLUR_PX = 12;
/** 换位弹簧阻尼比: 规格按 omega = 2pi / duration 积分, zeta 未给数值, HX 自定为临界阻尼 (换位不过冲). */
export const MASONRY_ZETA = 1;
/** 入场起点离目标的距离 px (规格从视口外飞入, HX 改为固定距离, 不依赖窗口). */
export const MASONRY_FROM_PX = 80;
/** 自动列数断点: 容器宽 >= 这些值时取对应列数 (HX 自定, 沿用常见瀑布流断点). */
export const MASONRY_BREAKPOINTS: readonly (readonly [number, number])[] = [
  [1500, 5],
  [1000, 4],
  [600, 3],
  [400, 2],
];

export type MasonryFrom = "bottom" | "top" | "left" | "right" | "center" | "random";

export function masonrySpring(duration: number): ReturnType<typeof omegaSpring> {
  return omegaSpring(TAU / Math.max(0.05, duration), MASONRY_ZETA);
}

export function autoColumns(width: number): number {
  for (const [min, cols] of MASONRY_BREAKPOINTS) if (width >= min) return cols;
  return 1;
}

export interface MasonryCell {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/** 依次放进当前最矮的一列. ratios 为各项 高 / 宽. 返回各格与总高. */
export function masonryLayout(ratios: readonly number[], columns: number, width: number, gap: number): { readonly cells: MasonryCell[]; readonly height: number } {
  const cols = Math.max(1, Math.floor(columns));
  const w = Math.max(0, (width - gap * (cols - 1)) / cols);
  const heights = new Array<number>(cols).fill(0);
  const cells = ratios.map((ratio) => {
    let c = 0;
    for (let k = 1; k < cols; k += 1) if ((heights[k] ?? 0) < (heights[c] ?? 0)) c = k;
    const y = heights[c] ?? 0;
    const h = w * Math.max(0, ratio);
    heights[c] = y + h + gap;
    return { x: c * (w + gap), y, w, h };
  });
  return { cells, height: Math.max(0, ...heights.map((v) => v - gap)) };
}

/** 入场起点相对目标的偏移. random 按序号稳定取一个方向. */
export function fromOffset(from: MasonryFrom, i: number): readonly [number, number] {
  const d = MASONRY_FROM_PX;
  const pick: MasonryFrom = from === "random" ? (["bottom", "top", "left", "right"] as const)[Math.abs(Math.round(Math.sin(i * 7.13) * 1000)) % 4] ?? "bottom" : from;
  const table: Record<MasonryFrom, readonly [number, number]> = { bottom: [0, d], top: [0, -d], left: [-d, 0], right: [d, 0], center: [0, 0], random: [0, d] };
  return table[pick];
}

/** 揭开进度 (0..1) 的缓出 1 - (1 - t)^3 (Masonry.jsx:253), 给透明度与模糊. */
export function revealEase(t: number): number {
  const k = 1 - clamp(t, 0, 1);
  return 1 - k * k * k;
}
