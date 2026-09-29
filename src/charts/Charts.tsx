"use client";

import { type JSX, type ReactNode } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, RadialBar, RadialBarChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { CHART_AXIS, CHART_GRID, CHART_THEME, ChartTooltip, seriesColor } from "./ChartFrame";
import { useChartAnimation, type ChartAnimationOptions } from "./useChartAnimation";

/**
 * 图表组件集。基于 Recharts 3 套一层, 统一样式与动画策略。
 *
 * 所有图表都:
 *   - 响应式 (ResponsiveContainer, 宽度跟随父元素)
 *   - 配色走 token (换肤自动生效)
 *   - 使用统一的好看提示面板
 *   - 区分首次加载与增量动画 (见 animation.ts)
 *
 * 数据形状约定: 每条记录是一个对象, 横轴取 xKey (默认 "name"), 各系列取自己的 dataKey。
 */

export interface SeriesDef<T = Record<string, unknown>> {
  readonly dataKey: string;
  /** 图例与提示面板里显示的名字。不传则用 dataKey。 */
  readonly name?: string;
  /** 颜色。不传按序取自主题色序。 */
  readonly color?: string;
}

type AnimOpts<T> = Omit<ChartAnimationOptions<T>, "disabled"> & { readonly disabled?: boolean };

/* ── 折线图 ──────────────────────────────────────────────────────────────── */

export interface LineChartProps<T extends Record<string, unknown>> {
  readonly data: readonly T[];
  readonly series: readonly SeriesDef<T>[];
  readonly xKey?: string;
  readonly height?: number;
  readonly showDots?: boolean;
  readonly curved?: boolean;
  readonly animation?: AnimOpts<T>;
  readonly className?: string;
}

export function HxLineChart<T extends Record<string, unknown>>({
  data,
  series,
  xKey = "name",
  height = 260,
  showDots = false,
  curved = true,
  animation,
  className,
}: LineChartProps<T>): JSX.Element {
  const anim = useChartAnimation({ ...animation }, data.length);
  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data as T[]} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid {...CHART_GRID} vertical={false} />
          <XAxis dataKey={xKey} {...CHART_AXIS} />
          <YAxis {...CHART_AXIS} width={44} />
          <Tooltip content={ChartTooltip} cursor={{ stroke: CHART_THEME.axisLine }} />
          {series.map((s, i) => (
            <Line
              key={s.dataKey}
              type={curved ? "monotone" : "linear"}
              dataKey={s.dataKey}
              name={s.name ?? s.dataKey}
              stroke={s.color ?? seriesColor(i)}
              strokeWidth={2}
              // 描边不随容器缩放变形 —— 响应式图表里必须加, 否则线宽会被拉扁
              vectorEffect="non-scaling-stroke"
              dot={showDots ? { r: 2.5, strokeWidth: 0, fill: s.color ?? seriesColor(i) } : false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              {...anim}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── 面积图 ──────────────────────────────────────────────────────────────── */

export interface AreaChartProps<T extends Record<string, unknown>> {
  readonly data: readonly T[];
  readonly series: readonly SeriesDef<T>[];
  readonly xKey?: string;
  readonly height?: number;
  readonly stacked?: boolean;
  readonly animation?: AnimOpts<T>;
  readonly className?: string;
}

export function HxAreaChart<T extends Record<string, unknown>>({
  data,
  series,
  xKey = "name",
  height = 260,
  stacked = false,
  animation,
  className,
}: AreaChartProps<T>): JSX.Element {
  const anim = useChartAnimation({ ...animation }, data.length);
  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data as T[]} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <defs>
            {/* 每一条面积用自己颜色的竖向渐变: 上浓下淡, 底部几乎透明 */}
            {series.map((s, i) => {
              const c = s.color ?? seriesColor(i);
              return (
                <linearGradient key={s.dataKey} id={`hx-area-${s.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={c} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={c} stopOpacity={0.02} />
                </linearGradient>
              );
            })}
          </defs>
          <CartesianGrid {...CHART_GRID} vertical={false} />
          <XAxis dataKey={xKey} {...CHART_AXIS} />
          <YAxis {...CHART_AXIS} width={44} />
          <Tooltip content={ChartTooltip} cursor={{ stroke: CHART_THEME.axisLine }} />
          {series.map((s, i) => {
            const c = s.color ?? seriesColor(i);
            return (
              <Area
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                name={s.name ?? s.dataKey}
                stroke={c}
                strokeWidth={2}
                fill={`url(#hx-area-${s.dataKey})`}
                vectorEffect="non-scaling-stroke"
                stackId={stacked ? "1" : undefined}
                {...anim}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── 柱状图 ──────────────────────────────────────────────────────────────── */

export interface BarChartProps<T extends Record<string, unknown>> {
  readonly data: readonly T[];
  readonly series: readonly SeriesDef<T>[];
  readonly xKey?: string;
  readonly height?: number;
  readonly stacked?: boolean;
  readonly radius?: number;
  readonly animation?: AnimOpts<T>;
  readonly className?: string;
}

export function HxBarChart<T extends Record<string, unknown>>({
  data,
  series,
  xKey = "name",
  height = 260,
  stacked = false,
  radius = 4,
  animation,
  className,
}: BarChartProps<T>): JSX.Element {
  const anim = useChartAnimation({ ...animation }, data.length);
  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data as T[]} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid {...CHART_GRID} vertical={false} />
          <XAxis dataKey={xKey} {...CHART_AXIS} />
          <YAxis {...CHART_AXIS} width={44} />
          <Tooltip content={ChartTooltip} cursor={{ fill: "color-mix(in srgb, var(--foreground) 5%, transparent)" }} />
          {series.map((s, i) => (
            <Bar
              key={s.dataKey}
              dataKey={s.dataKey}
              name={s.name ?? s.dataKey}
              fill={s.color ?? seriesColor(i)}
              stackId={stacked ? "1" : undefined}
              // 圆角只给顶边: 底边也圆会让柱子像浮着
              radius={[radius, radius, 0, 0]}
              maxBarSize={48}
              {...anim}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── 饼图 / 环形图 ──────────────────────────────────────────────────────── */

export interface PieChartProps {
  readonly data: ReadonlyArray<{ readonly name: string; readonly value: number }>;
  readonly height?: number;
  /** 内圈半径。(0 是实心饼, > 0 是环形) */
  readonly innerRadius?: number;
  readonly animation?: AnimOpts<{ name: string; value: number }>;
  readonly className?: string;
}

export function HxPieChart({
  data,
  height = 260,
  innerRadius = 56,
  animation,
  className,
}: PieChartProps): JSX.Element {
  const anim = useChartAnimation({ ...animation }, data.length);
  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={ChartTooltip} />
          <Pie
            data={data as Array<{ name: string; value: number }>}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius="78%"
            paddingAngle={2}
            // 扇区之间留缝: 贴着会看不出边界, 尤其是相邻色相接近时
            strokeWidth={0}
            {...anim}
          >
            {data.map((entry, i) => (
              <Cell key={entry.name} fill={seriesColor(i)} />
            ))}
          </Pie>
          <Legend
            verticalAlign="bottom"
            height={28}
            formatter={(v) => <span className="text-[11.5px] text-muted-foreground">{v}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── 雷达图 ──────────────────────────────────────────────────────────────── */

export interface RadarChartProps<T extends Record<string, unknown>> {
  readonly data: readonly T[];
  readonly series: readonly SeriesDef<T>[];
  readonly angleKey?: string;
  readonly height?: number;
  readonly animation?: AnimOpts<T>;
  readonly className?: string;
}

export function HxRadarChart<T extends Record<string, unknown>>({
  data,
  series,
  angleKey = "name",
  height = 260,
  animation,
  className,
}: RadarChartProps<T>): JSX.Element {
  const anim = useChartAnimation({ ...animation }, data.length);
  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data as T[]} cx="50%" cy="50%" outerRadius="72%">
          <PolarGrid stroke={CHART_GRID.stroke} />
          <PolarAngleAxis dataKey={angleKey} tick={{ fill: CHART_THEME.axis, fontSize: 11 }} />
          <Tooltip content={ChartTooltip} />
          {series.map((s, i) => (
            <Radar
              key={s.dataKey}
              dataKey={s.dataKey}
              name={s.name ?? s.dataKey}
              stroke={s.color ?? seriesColor(i)}
              fill={s.color ?? seriesColor(i)}
              fillOpacity={0.22}
              strokeWidth={2}
              {...anim}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── 径向条形 (进度环) ─────────────────────────────────────────────────── */

export interface RadialChartProps {
  readonly data: ReadonlyArray<{ readonly name: string; readonly value: number; readonly fill?: string }>;
  readonly height?: number;
  /** 量程上限。用于把 value 换算成百分比。 */
  readonly max?: number;
  readonly animation?: AnimOpts<{ name: string; value: number }>;
  readonly className?: string;
}

export function HxRadialChart({
  data,
  height = 220,
  max = 100,
  animation,
  className,
}: RadialChartProps): JSX.Element {
  const anim = useChartAnimation({ ...animation }, data.length);
  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          data={data as Array<{ name: string; value: number; fill?: string }>}
          cx="50%"
          cy="50%"
          innerRadius="32%"
          outerRadius="96%"
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, max]} tick={false} axisLine={false} />
          <Tooltip content={ChartTooltip} />
          <RadialBar
            dataKey="value"
            background={{ fill: "color-mix(in srgb, var(--muted-foreground) 14%, transparent)" }}
            cornerRadius={6}
            {...anim}
          >
            {data.map((entry, i) => (
              <Cell key={entry.name} fill={entry.fill ?? seriesColor(i)} />
            ))}
          </RadialBar>
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
}