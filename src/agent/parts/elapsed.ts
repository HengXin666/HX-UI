"use client";
import * as React from "react";


const subscribers = new Set<() => void>();
let timer: number | null = null;
function subscribe(cb: () => void) {
  subscribers.add(cb);
  if (timer == null) timer = window.setInterval(() => subscribers.forEach((f) => f()), 250);
  return () => {
    subscribers.delete(cb);
    if (!subscribers.size && timer != null) {
      window.clearInterval(timer);
      timer = null;
    }
  };
}

/**
 * 计时: active 时每 250ms 刷新一次 (所有计时器共用一个 interval), 否则停在 end.
 * 返回 start 到现在 (或 end) 的毫秒数.
 */
export function useElapsed(start?: number, end?: number, active = end == null): number {
  const [, tick] = React.useReducer((x: number) => x + 1, 0);
  React.useEffect(() => (active && start != null ? subscribe(tick) : undefined), [active, start]);
  if (start == null) return 0;
  return (end ?? Date.now()) - start;
}
