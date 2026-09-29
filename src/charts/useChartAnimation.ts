"use client";

import { useEffect, useRef, useState } from "react";
import { buildAnimationProps, shouldDisableAnimation, type ChartAnimationOptions } from "./animation";

export type { ChartAnimationOptions, AnimationMatchMode, MatchSpec } from "./animation";

/**
 * 图表动画的 hook。区分「首次加载」与「后续增量」。
 *
 * 为什么需要它:
 *   两者对匹配方式的要求不同 ——
 *   首次渲染时没有"旧数据可保留", 播完整的绘制动画;
 *   之后每次数据变化, 只该动新增的那部分。
 *   而"这是第几次渲染"是组件状态, Recharts 自己不知道。
 *
 * 返回的 props 直接展开到 Line / Bar / Area 上:
 *   const anim = useChartAnimation({ dataKey: "t" }, data.length);
 *   <Line {...anim} dataKey="v" />
 *
 * 关键实现细节: 用一个 ref 记住"是否已经渲染过"。
 * 不能用 `data.length === 0` 这类判断 —— 首次拿到数据时长度也可能不为 0
 * (数据是同步传入的), 那样首次加载就不会播动画了。
 */
export function useChartAnimation<T extends Record<string, unknown>>(
  options: ChartAnimationOptions<T>,
  pointCount: number,
): Record<string, unknown> {
  // 首次为 true, 第一次 effect 之后置 false。用 ref 而不是 state:
  // 这个标记的翻转不该触发重渲染 (它只影响下一次数据变化时的动画参数)。
  const firstRenderRef = useRef(true);
  const [, force] = useState(0);

  useEffect(() => {
    if (!firstRenderRef.current) return;
    /*
     * 延后一帧再翻标记。
     *
     * 若在 effect 里同步翻掉, React 的 StrictMode 双调用会让标记在首次绘制前就变成 false,
     * 于是首次动画被跳过。用 rAF 等到首帧真的画完再翻。
     */
    const id = requestAnimationFrame(() => {
      firstRenderRef.current = false;
      force((n) => n + 1);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // 数据量过大时一律关掉动画, 不区分首次与增量
  const disabled = options.disabled || shouldDisableAnimation(pointCount);

  return buildAnimationProps({ ...options, disabled }, firstRenderRef.current);
}