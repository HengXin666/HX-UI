import { useCallback, useRef } from "react";
import { useIsomorphicLayoutEffect } from "../browser/useIsomorphicLayoutEffect";

/** useEventCallback 接受与返回的函数类型. */
export type EventCallback<Args extends unknown[], R> = (...args: Args) => R;

/**
 * 返回引用永远稳定, 但调用时总是执行最新一次渲染传入的 fn 的回调 (对标 usehooks-ts useEventCallback).
 * 适合传给 effect 依赖或 memo 子组件的事件处理器; 不要在渲染期间调用它.
 *
 * @param fn 每次渲染传入的最新处理函数.
 * @returns 引用稳定的包装函数.
 * @example
 * const onSave = useEventCallback((id: string) => save(id, draft));
 * useEffect(() => subscribe(onSave), [onSave]);
 */
export function useEventCallback<Args extends unknown[], R>(fn: EventCallback<Args, R>): EventCallback<Args, R> {
  const ref = useRef<EventCallback<Args, R>>(() => {
    throw new Error("useEventCallback: 不能在渲染期间调用");
  });

  useIsomorphicLayoutEffect(() => {
    ref.current = fn;
  }, [fn]);

  return useCallback((...args: Args) => ref.current(...args), []);
}
