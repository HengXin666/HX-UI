import { useEffect, useState } from "react";
import { BREAKPOINTS, BREAKPOINT_BASE, HOOK_EVENT, canUseDOM } from "../../../constants/hooks";

/** 默认断点档名 (与 Tailwind 一致). */
export type BreakpointName = keyof typeof BREAKPOINTS;

/** 断点表: 档名到 min-width (px). */
export type BreakpointMap<K extends string = string> = Readonly<Record<K, number>>;

/** useBreakpoint 的返回: 当前命中的最大档名, 低于全部档时为 "base". */
export type BreakpointValue<K extends string = BreakpointName> = K | typeof BREAKPOINT_BASE;

/** 某一档对应的 min-width 媒体查询. */
function minWidthQuery(width: number): MediaQueryList {
  return window.matchMedia(`(min-width: ${width}px)`);
}

/** 按 min-width 计算当前命中的最大档. */
function resolve<K extends string>(map: BreakpointMap<K>): BreakpointValue<K> {
  if (!canUseDOM() || !window.matchMedia) return BREAKPOINT_BASE;
  let hit: BreakpointValue<K> = BREAKPOINT_BASE;
  let best = Number.NEGATIVE_INFINITY;
  (Object.keys(map) as K[]).forEach((key) => {
    const width = map[key];
    if (width > best && minWidthQuery(width).matches) {
      best = width;
      hit = key;
    }
  });
  return hit;
}

/**
 * 返回视口当前所处的断点档名 (min-width 语义, 默认与 Tailwind 的 sm/md/lg/xl/2xl 同值), 用于 JS 侧的响应式分支.
 *
 * @param breakpoints 自定义断点表, 缺省为 BREAKPOINTS.
 * @returns 当前命中的最大档名, 小于最小档时为 "base"; 服务端渲染与首帧恒为 "base".
 * @example
 * const bp = useBreakpoint();
 * const columns = bp === "base" || bp === "sm" ? 1 : 3;
 */
export function useBreakpoint<K extends string = BreakpointName>(
  breakpoints: BreakpointMap<K> = BREAKPOINTS as unknown as BreakpointMap<K>,
): BreakpointValue<K> {
  const [current, setCurrent] = useState<BreakpointValue<K>>(BREAKPOINT_BASE);
  const signature = JSON.stringify(breakpoints);

  useEffect(() => {
    if (!canUseDOM() || !window.matchMedia) return;
    const map: BreakpointMap<K> = JSON.parse(signature);
    const lists = Object.values<number>(map).map(minWidthQuery);
    const update = () => setCurrent(resolve(map));
    update();
    lists.forEach((list) => list.addEventListener(HOOK_EVENT.change, update));
    return () => lists.forEach((list) => list.removeEventListener(HOOK_EVENT.change, update));
  }, [signature]);

  return current;
}
