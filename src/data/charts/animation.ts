"use client";

import { useEffect, useRef, useState } from "react";
import { matchAppend, matchByDataKey, matchByIndex } from "recharts";

/**
 * 图表的动画策略 (从 HX-UI 1 移植).
 *
 * Recharts 默认按数组下标配对新旧数据, 点数变化时按比例拉伸:
 * 实时图表每追加一个点, 整条线就从头重排一遍, 每秒抖一次.
 *
 * - "index": 按下标配对. 适合整批替换数据 (切换 7 天 / 30 天).
 * - "append": 旧点原地不动, 新增的点淡入. 适合只在末尾追加 (日志, 秒级监控).
 * - { dataKey }: 按业务键配对. 滑动窗口 (新的进来, 旧的出去) 时同一个点平滑移位.
 *
 * 首次渲染总是播完整的绘制动画, 之后才按 match 只动增量.
 */
export type AnimationMatchMode = "index" | "append";
export type MatchSpec = AnimationMatchMode | { readonly dataKey: string };

export interface ChartAnimationOptions {
  /** 增量时的匹配方式, 默认 "append" */
  readonly match?: MatchSpec;
  /** 时长 ms. 首次默认 900, 增量默认 320 */
  readonly duration?: number;
  readonly easing?: "ease" | "ease-in" | "ease-out" | "ease-in-out" | "linear";
  readonly disabled?: boolean;
}

import { ANIMATION_POINT_LIMIT } from "./helpers";
export { ANIMATION_POINT_LIMIT };

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * 返回可直接展开到 Line / Bar / Area 上的动画 props.
 * 注意 animationMatchBy 不能是 undefined: Recharts 的默认值只在属性缺失时生效, 显式 undefined 会崩.
 */
export function useChartAnimation(options: ChartAnimationOptions = {}, pointCount = 0) {
  // ref 记"是否已首绘", 翻转不需要重渲染; 延后一帧翻, 避免 StrictMode 双调用吞掉首次动画
  const first = useRef(true);
  const [, force] = useState(0);
  useEffect(() => {
    if (!first.current) return;
    const id = requestAnimationFrame(() => {
      first.current = false;
      force((n) => n + 1);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  if (options.disabled || pointCount > ANIMATION_POINT_LIMIT || reducedMotion()) {
    return { isAnimationActive: false, animationMatchBy: matchByIndex } as const;
  }
  if (first.current) {
    return { isAnimationActive: true, animationDuration: options.duration ?? 900, animationEasing: "ease-out", animationMatchBy: matchByIndex } as const;
  }
  const match = options.match ?? "append";
  const animationMatchBy = typeof match === "object" ? matchByDataKey(match.dataKey) : match === "append" ? matchAppend : matchByIndex;
  return {
    isAnimationActive: true,
    animationDuration: options.duration ?? 320,
    animationEasing: options.easing ?? "ease-out",
    animationMatchBy,
  } as const;
}
