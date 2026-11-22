import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(cb: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/**
 * 用户是否要求减弱动效. 代替 motion 的 useReducedMotion:
 * 服务端和水合那一帧固定返回 false, 水合后再换成真实值,
 * 预渲染的 HTML 与客户端第一帧一致, 不会水合不匹配.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}
