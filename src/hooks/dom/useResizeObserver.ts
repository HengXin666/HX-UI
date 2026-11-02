import { useCallback, useEffect, useState, type RefCallback } from "react";
import { canUseDOM, isFunction } from "../../constants/hooks";

/** useResizeObserver 记录的元素尺寸, 字段与 DOMRectReadOnly 的同名字段一致. */
export interface ObserverRect {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  left: number;
  bottom: number;
  right: number;
}

/** 元素尚未挂载时的尺寸. */
const EMPTY_RECT: ObserverRect = { x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, bottom: 0, right: 0 };

/** useResizeObserver 的返回: [绑定到元素的回调 ref, 最新 contentRect]. */
export type UseResizeObserverReturn<T extends Element> = [RefCallback<T>, ObserverRect];

/**
 * 用 ResizeObserver 跟踪元素的 contentRect, 元素换成别的节点时自动改为观察新节点 (对标 Mantine useResizeObserver).
 *
 * @param options ResizeObserver.observe 的选项, 例如 box.
 * @returns [ref, rect].
 * @example
 * const [ref, rect] = useResizeObserver<HTMLDivElement>();
 * return <div ref={ref}>{rect.width} x {rect.height}</div>;
 */
export function useResizeObserver<T extends Element = HTMLElement>(options?: ResizeObserverOptions): UseResizeObserverReturn<T> {
  const [node, setNode] = useState<T | null>(null);
  const [rect, setRect] = useState<ObserverRect>(EMPTY_RECT);
  const box = options?.box;
  const ref = useCallback<RefCallback<T>>((element) => setNode(element), []);

  useEffect(() => {
    if (!node || !canUseDOM() || !isFunction(window.ResizeObserver)) return;
    let frame = 0;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const { x, y, width, height, top, left, bottom, right } = entry.contentRect;
        setRect({ x, y, width, height, top, left, bottom, right });
      });
    });
    observer.observe(node, box ? { box } : undefined);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [node, box]);

  return [ref, rect];
}
