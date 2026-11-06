import { useEffect, type RefObject } from "react";
import { canUseDOM } from "../../constants/hooks";
import { useEventCallback } from "../state/useEventCallback";

/** useEventListener 可挂载的目标: 元素 ref, document ref, 或缺省为 window. */
export type EventListenerTarget = RefObject<HTMLElement | Document | MediaQueryList | null> | undefined;

/**
 * 在 window, document 或某个元素上订阅 DOM 事件, 卸载或目标变化时自动解绑 (对标 usehooks-ts useEventListener).
 * handler 总是最新的, 改变 handler 不会重新绑定.
 *
 * .agents/notes/implemented/architecture/2026-11-02-shared-hooks.md
 *
 * @param eventName 事件名.
 * @param handler 事件处理函数.
 * @param element 目标 ref, 缺省时挂在 window.
 * @param options addEventListener 的选项.
 * @example
 * useEventListener("resize", () => setWidth(window.innerWidth));
 * useEventListener("scroll", onScroll, panelRef, { passive: true });
 */
export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element?: undefined,
  options?: boolean | AddEventListenerOptions,
): void;
export function useEventListener<K extends keyof HTMLElementEventMap, T extends HTMLElement = HTMLElement>(
  eventName: K,
  handler: (event: HTMLElementEventMap[K]) => void,
  element: RefObject<T | null>,
  options?: boolean | AddEventListenerOptions,
): void;
export function useEventListener<K extends keyof DocumentEventMap>(
  eventName: K,
  handler: (event: DocumentEventMap[K]) => void,
  element: RefObject<Document | null>,
  options?: boolean | AddEventListenerOptions,
): void;
export function useEventListener<K extends keyof MediaQueryListEventMap>(
  eventName: K,
  handler: (event: MediaQueryListEventMap[K]) => void,
  element: RefObject<MediaQueryList | null>,
  options?: boolean | AddEventListenerOptions,
): void;
export function useEventListener(
  eventName: string,
  handler: (event: Event) => void,
  element?: EventListenerTarget,
  options?: boolean | AddEventListenerOptions,
): void {
  const listener = useEventCallback(handler);
  const normalized: AddEventListenerOptions = options === true || options === false ? { capture: options } : options ?? {};
  const { capture, passive, once } = normalized;

  useEffect(() => {
    const target: EventTarget | null | undefined = element ? element.current : canUseDOM() ? window : null;
    if (!target) return;
    const opts: AddEventListenerOptions = { capture, passive, once };
    target.addEventListener(eventName, listener, opts);
    return () => target.removeEventListener(eventName, listener, opts);
  }, [eventName, element, listener, capture, passive, once]);
}
