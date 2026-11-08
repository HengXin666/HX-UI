// 行为规格参照 docs/research/catalog/textanimations.md 的 CountUp, BlurText, RotatingText, Shuffle, ScrollFloat, FoldText, SplitText 条目, 实现为 HX 自有.

/**
 * 错峰: 单元的出场名次, 封顶间隔, 与按名次切出的单元进度.
 * 名次 rank 可以是小数 (center 在偶数个时), 延迟 = rank * step.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-text-kernel.md
 */

import { clamp01, hash01 } from "./curve";
import { HALF, STAGGER_CAP_S, STAGGER_SHARE } from "./tokens";

/** start 从头; end 从尾; center 从中间向两边; edges 从两边向中间; random 乱序; evenodd 先奇位后偶位. */
export type StaggerFrom = "start" | "end" | "center" | "edges" | "random" | "evenodd";

/**
 * 每个单元的名次.
 *
 * @param count 单元数.
 * @param from 起点.
 * @param seed random 的种子.
 */
export function staggerRanks(count: number, from: StaggerFrom = "start", seed = 1): number[] {
  const mid = (count - 1) * HALF;
  const ids = Array.from({ length: count }, (_, i) => i);
  switch (from) {
    case "end":
      return ids.map((i) => count - 1 - i);
    case "center":
      return ids.map((i) => Math.abs(mid - i));
    case "edges":
      return ids.map((i) => mid - Math.abs(mid - i));
    case "random": {
      const order = [...ids].sort((a, b) => hash01(a, seed) - hash01(b, seed));
      const ranks = new Array<number>(count);
      order.forEach((id, rank) => {
        ranks[id] = rank;
      });
      return ranks;
    }
    case "evenodd": {
      const odd = Math.floor(count * HALF);
      return ids.map((i) => (i % 2 === 1 ? Math.floor(i * HALF) : odd + i * HALF));
    }
    default:
      return ids;
  }
}

/** 名次里的最大值, 算整段时长用. */
export function maxRank(ranks: readonly number[]): number {
  return ranks.reduce((m, r) => Math.max(m, r), 0);
}

/**
 * 封顶的错峰间隔: 不超过 cap, 且全部间隔加起来不超过 total 的 share.
 *
 * @param count 单元数.
 * @param totalS 整段时长 (秒).
 * @param capS 间隔上限.
 * @param share 错峰占整段的上限比例.
 */
export function cappedStep(count: number, totalS: number, capS = STAGGER_CAP_S, share = STAGGER_SHARE): number {
  if (count <= 1) return 0;
  return Math.min(capS, (totalS * share) / (count - 1));
}

/** 封顶错峰下每个单元自己的时长: 整段减去最后一个单元的延迟. */
export function unitSpan(count: number, totalS: number, stepS: number): number {
  return Math.max(0.001, totalS - stepS * Math.max(0, count - 1));
}

/**
 * 单元进度: 整段时间 t 里, 名次 rank 的单元走到哪.
 *
 * @param t 整段已过时间.
 * @param rank 名次.
 * @param step 间隔.
 * @param span 单元时长.
 */
export function unitProgress(t: number, rank: number, step: number, span: number): number {
  if (span <= 0) return t >= rank * step ? 1 : 0;
  return clamp01((t - rank * step) / span);
}

/** 整段时长: 最后一名的延迟加单元时长. */
export function totalSpan(ranks: readonly number[], step: number, span: number): number {
  return maxRank(ranks) * step + span;
}
