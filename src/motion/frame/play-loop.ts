/**
 * 无限循环的 Web Animations 片段 (转圈, 呼吸). 返回取消函数; 取消时吞掉 finished 的中止拒绝.
 * 环境没有 animate 时什么都不做.
 *
 * .agents/notes/implemented/feature/2026-11-08-motion-spring-frame.md
 */
export function playLoop(el: Element | null | undefined, frames: Keyframe[], options: KeyframeAnimationOptions): () => void {
  const animation = el?.animate?.(frames, { iterations: Number.POSITIVE_INFINITY, ...options });
  animation?.finished.catch(() => undefined);
  return () => animation?.cancel();
}
