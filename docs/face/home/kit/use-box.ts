import { useCallback, useState, type RefCallback } from "react";
import { useResizeObserver, type ObserverRect } from "../../../../src/hooks";

/**
 * 卡内图区的元素与它的尺寸. 量宽交给库的 useResizeObserver (rAF 合帧, 换节点自动改观察);
 * 元素本身还要喂给 useNear / useLoopMs, 所以同一个回调 ref 同时记下元素.
 */
export function useBox<T extends HTMLElement>(): readonly [T | null, RefCallback<T>, ObserverRect] {
  const [box, setBox] = useState<T | null>(null);
  const [measure, rect] = useResizeObserver<T>();
  const attach = useCallback<RefCallback<T>>(
    (node) => {
      setBox(node);
      measure(node);
    },
    [measure],
  );
  return [box, attach, rect] as const;
}
