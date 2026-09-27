/**
 * 图表的动画策略。
 *
 * 这是这个包与"直接用 Recharts"最不同的一处, 也是做实时图表最容易做错的地方。
 *
 * ── 问题 ────────────────────────────────────────────────────────────────
 * Recharts 的默认动画是 matchByIndex: 它按**数组下标**把新旧数据配对,
 * 数量变化时按比例拉伸。5 个点变成 15 个点时, 每个旧点"覆盖"约 3 个新点 ——
 * 结果是**整条线从头重排一遍**。实时图表每秒加一个点, 就会每秒抖一次。
 *
 * ── 三种匹配模式 ─────────────────────────────────────────────────────────
 *   "index"  按下标配对 + 比例拉伸。Recharts 默认。适合"整批替换数据"。
 *   "append" 顺序配对, 多出来的新项自己淡入, 旧的**原地不动**。
 *             适合只在末尾追加的场合 —— 日志流、秒级监控。
 *   matchByDataKey('id')
 *             按数据里的业务键配对。**流式数据最该用这个** ——
 *             窗口滑动(新的进来、旧的出去)时能让"同一个 id 的点"平滑移到新位置。
 *
 * ── 首次加载 vs 增量 ─────────────────────────────────────────────────────
 * 两者要区分:
 *   首次加载  播完整的绘制动画 (线从左到右画出来 / 柱子从底部长起来)。
 *   后续增量  只动新增的那部分, 已存在的点留在原位。
 * 切换逻辑在 useChartAnimation —— 它用一个"已渲染过"的标记来选匹配模式。
 */

import { matchAppend, matchByIndex, matchByDataKey } from "recharts";

/** 匹配模式。对象形式表示"按业务键配对"。 */
export type AnimationMatchMode = "index" | "append";
export type MatchSpec<T> = AnimationMatchMode | { readonly dataKey: keyof T & string };

export interface ChartAnimationOptions<T = Record<string, unknown>> {
  /** 增量时的匹配方式。默认 "append"。首次渲染时总是用 "index" 播完整绘制动画。 */
  readonly match?: MatchSpec<T>;
  /** 动效时长 (毫秒)。默认 320 —— 加载中的数据流别设过大, 会显得拖沓。 */
  readonly duration?: number;
  /** 缓动。默认 ease-out: 数据变化该"快到位置再停", 不是匀速。 */
  readonly easing?: string;
  /** 关掉动画。数据量很大时建议关, 否则每帧都在算插值。 */
  readonly disabled?: boolean;
}

/**
 * 数据量大时关掉动画的阈值。
 * 上千个点时每帧对所有点做插值, 低端设备会明显掉帧。800 是保守值。
 */
export const ANIMATION_POINT_LIMIT = 800;

export function shouldDisableAnimation(pointCount: number): boolean {
  return pointCount > ANIMATION_POINT_LIMIT;
}

/**
 * 生成展开到 Line / Bar / Area 上的动画 props。
 *
 * 注意 animationMatchBy **不能传 undefined** —— Recharts 的默认参数只在属性缺失时生效,
 * 显式传 undefined 会让它在运行时拿到 undefined 并崩掉。所以每个分支都必须给出确定值。
 */
export function buildAnimationProps<T extends Record<string, unknown>>(
  opts: ChartAnimationOptions<T>,
  isFirstRender: boolean,
): Record<string, unknown> {
  const duration = opts.duration ?? 320;
  const easing = opts.easing ?? "ease-out";

  if (opts.disabled) {
    // 关掉动画时仍然要给 animationMatchBy 一个值, 否则 Recharts 的默认参数链路会收到 undefined
    return { isAnimationActive: false, animationMatchBy: matchByIndex };
  }

  // 首次渲染: 用 index 匹配。此时没有"旧数据"可保留, 比例拉伸无害,
  // 而且它会播完整的绘制动画 (线从左到右画出来 / 柱子从底部长起来)。
  if (isFirstRender) {
    return {
      isAnimationActive: true,
      animationDuration: duration,
      animationEasing: easing,
      animationMatchBy: matchByIndex,
    };
  }

  // 后续增量: 按配置的匹配方式, 让已存在的点留在原位。
  const match = opts.match ?? "append";
  const animationMatchBy =
    typeof match === "object" ? matchByDataKey(match.dataKey) : match === "append" ? matchAppend : matchByIndex;

  return {
    isAnimationActive: true,
    animationDuration: duration,
    animationEasing: easing,
    animationMatchBy,
  };
}
