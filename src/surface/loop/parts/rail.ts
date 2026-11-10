// 行为规格参照 docs/research/catalog/animations.md 的 LogoLoop 条目, 实现为 HX 自有.

/**
 * MarkRail 的纯函数: 偏移折回, 需要几份副本, 甩出速度, 入场透明度.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-loop.md
 */

/** 把偏移折回 (-period, 0]; period <= 0 时原样返回. */
export function railOffset(offset: number, period: number): number {
  if (!(period > 0)) return offset;
  const r = offset % period;
  return r > 0 ? r - period : r;
}

/** 铺满容器还要几份序列: 至少两份, 折回时不露底. */
export function copiesNeeded(containerPx: number, periodPx: number): number {
  if (!(periodPx > 0)) return 2;
  return Math.max(2, Math.ceil(containerPx / periodPx) + 1);
}

/** 甩出速度钳到 [-max, max]. */
export function flingVelocity(velocity: number, max: number): number {
  return Math.max(-max, Math.min(max, velocity));
}

/**
 * 第 index 件的入场不透明度: 各件按位置错峰起步, 每件淡入 introS 秒, 三次缓出.
 *
 * @param t 入场开始后过了多久 (秒).
 */
export function introOpacity(t: number, index: number, count: number, introS: number, staggerS: number): number {
  const delay = count > 1 ? (staggerS * index) / (count - 1) : 0;
  if (introS <= 0) return t >= delay ? 1 : 0;
  const x = Math.max(0, Math.min(1, (t - delay) / introS));
  return 1 - (1 - x) ** 3;
}

/** 入场整体时长: 最后一件起步加上淡入. */
export function introTotal(count: number, introS: number, staggerS: number): number {
  return (count > 1 ? staggerS : 0) + introS;
}
