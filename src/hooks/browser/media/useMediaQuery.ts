import { useEffect, useState } from "react";
import { HOOK_EVENT, canUseDOM } from "../../../constants/hooks";

/** useMediaQuery 的选项, 与 Mantine 一致. */
export interface UseMediaQueryOptions {
  /** 为 true (默认) 时首帧用 initialValue, 挂载后再读真实值, 保证服务端与客户端首帧一致. */
  getInitialValueInEffect: boolean;
}

/** 立即读取一次媒体查询结果; 服务端或不支持 matchMedia 时返回 initialValue. */
function readMatch(query: string, initialValue?: boolean): boolean {
  if (canUseDOM() && window.matchMedia) return window.matchMedia(query).matches;
  return initialValue ?? false;
}

/**
 * 订阅 CSS 媒体查询的匹配结果, 查询状态变化时重新渲染 (对标 Mantine useMediaQuery).
 *
 * .agents/notes/implemented/architecture/2026-11-02-shared-hooks.md
 *
 * @param query 媒体查询串, 例如 "(min-width: 768px)".
 * @param initialValue 服务端渲染与首帧使用的值.
 * @param options getInitialValueInEffect 选项.
 * @returns 当前是否匹配.
 * @example
 * const wide = useMediaQuery("(min-width: 1024px)");
 * return wide ? <Sidebar /> : <Drawer />;
 */
export function useMediaQuery(
  query: string,
  initialValue?: boolean,
  options: UseMediaQueryOptions = { getInitialValueInEffect: true },
): boolean {
  const [matches, setMatches] = useState<boolean>(() =>
    options.getInitialValueInEffect ? (initialValue ?? false) : readMatch(query, initialValue),
  );

  useEffect(() => {
    if (!canUseDOM() || !window.matchMedia) return;
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener(HOOK_EVENT.change, update);
    return () => list.removeEventListener(HOOK_EVENT.change, update);
  }, [query]);

  return matches;
}
