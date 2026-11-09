// 行为规格参照 docs/research/catalog/textanimations.md 的 TechText 条目, 实现为 HX 自有.

import { clamp01, falloff, smoothstep } from "../../kernel/curve";
import { DOUBLE } from "../../kernel/tokens";
import { DRAFT_BOUNCE_SHARE, DRAFT_FALLOFF_STEPS, DRAFT_KICK_DECAY, DRAFT_SPRING } from "../tokens";

/**
 * DraftText 的纯函数: 回弹阻尼, 半隐式弹簧一步, 近邻描边量, 点击踢开的衰减与打字入场.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-text-pointer.md
 */

export interface Glyph2 {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/** 弹性 0 为临界阻尼, 弹性 1 留 4% 阻尼. */
export function draftDamping(bounce: number): number {
  return DOUBLE * Math.sqrt(DRAFT_SPRING) * (1 - clamp01(bounce) * DRAFT_BOUNCE_SHARE);
}

/** 字形偏移向 0 回弹一步 (半隐式欧拉), 原地改. */
export function springBack(g: Glyph2, damping: number, dtS: number): void {
  g.vx += (-DRAFT_SPRING * g.x - damping * g.vx) * dtS;
  g.vy += (-DRAFT_SPRING * g.y - damping * g.vy) * dtS;
  g.x += g.vx * dtS;
  g.y += g.vy * dtS;
}

/** 指针距离换成描边量 0 到 1: 半径内衰减, 柔度越大过渡越宽, 量化成 8 档免得每帧细碎变化. */
export function outlineAmount(distance: number, reach: number, softness: number): number {
  const k = falloff(distance, reach);
  const soft = Math.max(1e-3, clamp01(softness));
  const v = smoothstep(0, soft, k);
  return Math.round(v * DRAFT_FALLOFF_STEPS) / DRAFT_FALLOFF_STEPS;
}

/** 点击第 at 格时第 i 格分到的踢开比例: 每隔一格乘 0.62. */
export function kickShare(i: number, at: number): number {
  return DRAFT_KICK_DECAY ** Math.abs(i - at);
}

/** 打字入场: 第 i 格在 delay + i x step 之后的一格时长内显出, 返回 0 到 1. */
export function typeShown(i: number, elapsedS: number, delayS: number, stepS: number): number {
  if (stepS <= 0) return 1;
  return clamp01((elapsedS - delayS - i * stepS) / stepS);
}

/** 离 (x, y) 最近且在半径内的格, 没有时为 -1. boxes 为各格中心. */
export function nearestGlyph(x: number, y: number, centers: readonly { readonly x: number; readonly y: number }[], reach: number): number {
  let best = -1;
  let bestD = reach;
  centers.forEach((c, i) => {
    const d = Math.hypot(x - c.x, y - c.y);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}
