"use client";

import { type JSX, type ReactNode } from "react";
import {
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { cn } from "../primitives/utils";

/**
 * 图表外壳。基于 Recharts 3 套一层, 解决四件事:
 *
 *   1. 响应式。所有图表都放进 ResponsiveContainer, 宽度跟随父元素。
 *      **不要给图表设固定 width** —— 那是最常见的错误, 它会撑破容器或被裁掉。
 *
 *   2. 主题。坐标轴、网格、提示面板的配色全部走 token, 换肤自动生效。
 *      Recharts 默认的灰色调与这套设计语言不搭, 必须显式覆盖。
 *
 *   3. 提示面板。Recharts 的默认 tooltip 是一个灰底小方块。
 *      这里换成与库内其他浮层同款的面板 (圆角、边框、毛玻璃、语义色圆点)。
 *
 *   4. 增量动画。见 src/charts/animation.ts —— 那是这个包与直接用 Recharts 最不同的地方。
 */

/** 坐标轴与网格的统一配色。改这里就换全站图表观感。 */
export const CHART_THEME = {
  grid: "color-mix(in srgb, var(--border) 70%, transparent)",
  axis: "var(--muted-foreground)",
  axisLine: "var(--border)",
  /** 图表色序。取自设计令牌, 与分段图表色同源。 */
  series: [
    "var(--primary)",
    "var(--segment-2)",
    "var(--segment-3)",
    "var(--segment-4)",
    "var(--segment-5)",
  ],
} as const;

/** 按序号取一个图表色。超出序列长度时循环。 */
export function seriesColor(index: number): string {
  return CHART_THEME.series[index % CHART_THEME.series.length];
}

/**
 * 提示面板。
 *
 * 与库内其他浮层同款: rounded-lg + 边框 + 毛玻璃 + shadow。不用 Recharts 的默认样式,
 * 因为它是一个内联样式的灰方块, 与这套设计语言不一致, 而且深色主题下对比度不足。
 *
 * 布局是「一行一条 series」: 左侧圆点取该 series 的颜色, 右侧数值右对齐。
 * 多条 series 时数值能对齐成一列, 比一行一个标签更好扫读。
 */
/*
 * 泛型为什么必须写出来, 而不是钉成 <number, string>:
 *
 * Recharts 3 把 \`content\` 的属性类型声明成 \`ContentType<ValueType, NameType>\`,
 * 其中 ValueType 默认是 \`number | string | Array<number | string>\`。函数参数是**逆变**的 ——
 * 钉死成 <number, string> 之后, 这个组件就不再是 ContentType 的合法子类型,
 * 于是每一处 \`<Tooltip content={ChartTooltip} />\` 都报 TS2322 (实测 7 处)。
 *
 * 在本库自己的 tsconfig 下看不出来 (strict: false 让函数参数双变), 但任何
 * 开启 strict 的消费者一 import 就会炸 —— gh-pool 面板的 build 正是因此在库里失败。
 * 让泛型跟着 Recharts 走, 两边就一致了。
 */
function ChartTooltip({
  active,
  payload,
  label,
  // 参数类型写成"recharts 的默认泛型" —— 即不写类型参数, 直接用 TooltipContentProps
  // 的 default。这样它与 <Tooltip content={...}> 期望的 ContentType 完全同型。
}: TooltipContentProps): JSX.Element | null {
  if (!active || !payload?.length) return null;
  return (
    <div className="pointer-events-none rounded-lg border border-border/60 bg-popover/95 px-2.5 py-2 shadow-lg backdrop-blur-sm">
      {label !== undefined && label !== "" ? (
        <div className="mb-1 text-[11px] font-medium text-muted-foreground">{String(label)}</div>
      ) : null}
      <div className="flex flex-col gap-0.5">
        {payload.map((entry, i) => (
          <div key={`${entry.dataKey ?? i}`} className="flex items-center gap-2 text-[11.5px]">
            <span
              className="size-1.5 shrink-0 rounded-full"
              style={{ background: entry.color ?? seriesColor(i) }}
              aria-hidden
            />
            <span className="text-muted-foreground">{String(entry.name ?? entry.dataKey ?? "")}</span>
            <span className="ml-auto font-mono font-medium tabular-nums text-popover-foreground">
              {typeof entry.value === "number" ? entry.value.toLocaleString() : String(entry.value ?? "")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface ChartFrameProps {
  readonly children: ReactNode;
  /** 高度。必须给 —— ResponsiveContainer 只接管宽度, 高度要由容器决定。 */
  readonly height?: number;
  /** 横轴数据键。传 false 表示不画横轴。 */
  readonly xKey?: string | false;
  /** 是否画网格。默认只画横向 (纵向网格线在多数图表里是噪音)。 */
  readonly grid?: boolean | "both";
  /** 纵轴格式化。 */
  readonly yFormat?: (v: number) => string;
  /** 横轴 tick 的间隔策略。数据点多时传 "preserveStartEnd"。 */
  readonly xInterval?: number | "preserveStartEnd" | "preserveStart" | "preserveEnd";
  /** 是否显示提示面板。默认显示。 */
  readonly tooltip?: boolean;
  readonly className?: string;
}

export function ChartFrame({
  children,
  height = 260,
  xKey = "name",
  grid = true,
  yFormat,
  xInterval,
  tooltip = true,
  className,
}: ChartFrameProps): JSX.Element {
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {/* Recharts 的容器需要一个明确的图表类型作为 children, 这里透传 */}
        {children as never}
      </ResponsiveContainer>
    </div>
  );
}

/**
 * 统一的坐标轴与网格配置。
 *
 * 单独导出而不是塞进 ChartFrame 的原因: Recharts 的 XAxis / YAxis / CartesianGrid
 * 必须是图表组件的**直接子元素**, 不能由外面包一层再传进来。
 * 所以这里给配置而不是给组件 —— 使用方在图表里写 <XAxis {...CHART_AXIS} />。
 */
export const CHART_AXIS = {
  stroke: CHART_THEME.axis,
  tickLine: false,
  axisLine: { stroke: CHART_THEME.axisLine },
  tick: { fill: CHART_THEME.axis, fontSize: 11 },
} as const;

export const CHART_GRID = {
  stroke: CHART_THEME.grid,
  strokeDasharray: "3 3",
} as const;

/** 提示面板组件。使用方在图表里写 <Tooltip content={<ChartTooltip />} />。 */
export { ChartTooltip };

/** 便捷包装: 一次给出 Recharts 的 Grid / Axis / Tooltip, 少写四行。 */
export function ChartChrome({
  xKey = "name",
  grid = true,
  yFormat,
  xInterval,
  tooltip = true,
}: Pick<ChartFrameProps, "xKey" | "grid" | "yFormat" | "xInterval" | "tooltip">): JSX.Element {
  return (
    <>
      {grid ? (
        <CartesianGrid
          {...CHART_GRID}
          // 只画横线: 纵向网格线在多数图表里是噪音, 除非要对照具体点
          vertical={grid === "both"}
          horizontal
        />
      ) : null}
      {xKey !== false ? <XAxis dataKey={xKey} {...CHART_AXIS} interval={xInterval} /> : null}
      <YAxis {...CHART_AXIS} width={44} tickFormatter={yFormat} />
      {/*
        content 传函数而不是 <ChartTooltip /> 元素:
        TooltipContentProps 里 active / payload / coordinate 等是必填, 但它们由 Recharts
        在运行时注入。传元素形式会让 TS 报"缺属性"; 传函数则签名为 (props) => ReactNode,
        类型上是完整的 —— 这是 Recharts 自定义 content 的推荐写法。
      */}
      {tooltip ? <Tooltip content={ChartTooltip} cursor={{ stroke: CHART_THEME.axisLine }} /> : null}
    </>
  );
}