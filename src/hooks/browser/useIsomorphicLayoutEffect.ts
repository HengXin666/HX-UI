import { useEffect, useLayoutEffect } from "react";
import { canUseDOM } from "../../constants/hooks";

/**
 * 浏览器里等同 useLayoutEffect, 服务端渲染时退回 useEffect, 避免 React 的 SSR 警告.
 *
 * @returns 与 useLayoutEffect 同签名的 effect hook.
 * @example
 * useIsomorphicLayoutEffect(() => {
 * measure(ref.current);
 * }, [width]);
 */
export const useIsomorphicLayoutEffect: typeof useLayoutEffect = canUseDOM() ? useLayoutEffect : useEffect;
