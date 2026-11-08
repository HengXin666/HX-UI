/** ReasoningTrace 的动效计算: 呼吸谷底, 换勾时刻, 从当前值续接的淡入淡出. */
import { COMPOSE_EASE_OUT, MS_PER_S, TRACE } from "../../tokens";

/** 谷底透明度. 深度钳在 0..1. */
export function breathTrough(depth: number): number {
  return 1 - Math.min(1, Math.max(0, depth));
}

/** 落定过程中图形换成勾的时刻 (ms). */
export function glyphSwapAt(settleMs: number): number {
  return settleMs * TRACE.glyphDone;
}

/** 从当前值淡到目标, 不从关键帧起点重播, 中途反向不跳. */
export function fadeTo(el: HTMLElement | null, opacity: number, seconds: number): Animation | undefined {
  if (!el) return undefined;
  const from = getComputedStyle(el).opacity;
  el.getAnimations?.().forEach((animation) => animation.cancel());
  return el.animate?.([{ opacity: from }, { opacity }], { duration: seconds * MS_PER_S, easing: COMPOSE_EASE_OUT, fill: "forwards" });
}
