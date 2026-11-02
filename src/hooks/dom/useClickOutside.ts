import { useEffect, useRef, type RefObject } from "react";
import { CLICK_OUTSIDE_EVENTS } from "../../constants/hooks";
import { useEventCallback } from "../state/useEventCallback";

/**
 * 在 ref 所指元素 (以及额外节点) 之外按下鼠标或触摸时调用 handler, 用于下拉菜单, 气泡的点击外部关闭 (对标 Mantine useClickOutside).
 *
 * @param handler 点击外部时的回调.
 * @param events 监听的事件名, 缺省为 mousedown 与 touchstart.
 * @param nodes 额外视为 "内部" 的节点, 例如触发按钮; 传入后不再使用返回的 ref 判定.
 * @returns 绑定到目标元素的 ref.
 * @example
 * const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
 * return <div ref={ref}>...</div>;
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: (event: Event) => void,
  events?: readonly string[] | null,
  nodes?: (HTMLElement | null)[],
): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  const callback = useEventCallback(handler);
  const list = events ?? CLICK_OUTSIDE_EVENTS;
  const eventKey = JSON.stringify(list);

  useEffect(() => {
    const listener = (event: Event) => {
      const target = event.target as Node | null;
      if (!target || !target.isConnected) return;
      if (Array.isArray(nodes)) {
        const inside = nodes.some((node) => !!node && (node === target || node.contains(target)));
        if (!inside) callback(event);
        return;
      }
      if (ref.current && !ref.current.contains(target)) callback(event);
    };
    const names: string[] = JSON.parse(eventKey);
    names.forEach((name) => document.addEventListener(name, listener));
    return () => names.forEach((name) => document.removeEventListener(name, listener));
  }, [eventKey, nodes, callback]);

  return ref;
}
