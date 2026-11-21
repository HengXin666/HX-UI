"use client";

import { motion } from "motion/react";
import { useMemo, type JSX } from "react";
import { AXIS_TEXT, GRID_OPACITY, READOUT_SEPARATOR, SERIES_TONES, STACK_FILL_OPACITY, STAGE_HEIGHT, SVG_ATTR, type StackOffset } from "../../constants/data-stage";
import { DEFAULT_TICK_COUNT } from "../../constants/data-scale";
import { axisTicks } from "../kernel-axis";
import { scaleLinear } from "../kernel-scale";
import { DataStage, type StageSize } from "../kernel-stage";
import { linePath, niceDomain, type Domain, type Point } from "../scale";
import { VIZ_CLASS } from "../tokens";
import { useVizStage } from "../use-stage";
import { xPositions, type LineSeries } from "./Line";

/**
 * 堆叠面积图 (`@hx/ui/data`). 层按 series 顺序自下而上叠, 负值按 0; offset="expand" 时每列归一成 0..1 看占比.
 * 横轴与 Line 共用 (xPositions). 只出 SVG: 层数和点数都有限.
 * .agents/notes/implemented/architecture/2026-11-19-omni-data-kernel.md
 */

export interface StackBand {
  lower: number;
  upper: number;
}

/** 堆叠: 返回每层每列的上下沿 (数据单位). 列长取最长序列, 缺的按 0. */
export function stackSeries(series: readonly (readonly number[])[], offset: StackOffset = "zero"): StackBand[][] {
  const columns = Math.max(0, ...series.map((s) => s.length));
  const totals = Array.from({ length: columns }, (_, c) => series.reduce((sum, s) => sum + Math.max(0, s[c] ?? 0), 0));
  const floor = new Array<number>(columns).fill(0);
  return series.map((s) =>
    Array.from({ length: columns }, (_, c) => {
      const raw = Math.max(0, s[c] ?? 0);
      const value = offset === "expand" ? (totals[c] === 0 ? 0 : raw / totals[c]) : raw;
      const band = { lower: floor[c], upper: floor[c] + value };
      floor[c] = band.upper;
      return band;
    }),
  );
}

/** 一层的闭合路径: 上沿从左到右, 下沿从右到左. 少于两列返回空串. */
export function bandPath(xs: readonly number[], bands: readonly StackBand[], y: (value: number) => number): string {
  if (bands.length < 2) return "";
  const top: Point[] = bands.map((b, i) => [xs[i], y(b.upper)] as const);
  const bottom: Point[] = bands.map((b, i) => [xs[i], y(b.lower)] as const).reverse();
  return `${linePath(top)} ${linePath(bottom).replace(/^M/, "L")} Z`;
}

export interface AreaProps {
  series: readonly LineSeries[];
  label: string;
  x?: readonly string[] | readonly Date[];
  offset?: StackOffset;
  height?: number;
  width?: number;
  format?: (value: number) => string;
  summary?: string;
  className?: string;
}

const UNIT: Domain = [0, 1];

export function Area({ series, label, x, offset = "zero", height = STAGE_HEIGHT, width, format, summary, className }: AreaProps): JSX.Element {
  const stage = useVizStage<HTMLElement>(series.length);
  const expand = offset === "expand";
  const show = format ?? ((input: number) => (expand ? `${Math.round(input * 100)}%` : input.toLocaleString()));
  const bands = useMemo(() => stackSeries(series.map((s) => s.values), offset), [series, offset]);
  const domain = useMemo<Domain>(() => {
    if (expand) return UNIT;
    const top = bands[bands.length - 1] ?? [];
    return niceDomain([0, Math.max(0, ...top.map((b) => b.upper))], DEFAULT_TICK_COUNT);
  }, [bands, expand]);
  const count = bands[0]?.length ?? 0;
  const readout = series
    .map((s, i) => {
      const last = bands[i]?.[count - 1];
      return last ? `${s.label}: ${show(last.upper - last.lower)}` : null;
    })
    .filter(Boolean)
    .join(READOUT_SEPARATOR);

  const plot = (size: StageSize): JSX.Element => {
    const { inner } = size;
    const baseline = inner.y + inner.h;
    const y = scaleLinear(domain, [baseline, inner.y]);
    const xs = xPositions(x, count, inner);
    const yTicks = axisTicks(y, { format: show, label: { charWidth: AXIS_TEXT.size } });
    return (
      <svg aria-hidden width={size.width} height={size.height} className="absolute inset-0 overflow-visible text-muted-foreground">
        {yTicks.map((tick) => (
          <g key={`y${tick.value}`}>
            <line x1={inner.x} x2={inner.x + inner.w} y1={tick.px} y2={tick.px} stroke={SVG_ATTR.color} strokeOpacity={GRID_OPACITY} />
            <text x={inner.x - AXIS_TEXT.gap} y={tick.px} textAnchor={SVG_ATTR.end} dominantBaseline={SVG_ATTR.middle} fontSize={AXIS_TEXT.size} fill={SVG_ATTR.color}>
              {tick.label}
            </text>
          </g>
        ))}
        {xs.ticks.map((tick) => (
          <text key={`x${tick.label}`} x={tick.px} y={baseline + AXIS_TEXT.gap + AXIS_TEXT.size} textAnchor={SVG_ATTR.middle} fontSize={AXIS_TEXT.size} fill={SVG_ATTR.color}>
            {tick.label}
          </text>
        ))}
        {bands.map((layer, i) => (
          <motion.path
            key={series[i].id}
            data-series={series[i].id}
            d={bandPath(xs.px, layer, y)}
            fill={SVG_ATTR.color}
            fillOpacity={STACK_FILL_OPACITY}
            stroke={SVG_ATTR.color}
            strokeWidth={1}
            vectorEffect={SVG_ATTR.nonScaling}
            className={SERIES_TONES[i % SERIES_TONES.length]}
            initial={stage.reduced ? false : { opacity: 0 }}
            animate={{ opacity: stage.shown ? 1 : 0 }}
            transition={stage.at(i)}
          />
        ))}
      </svg>
    );
  };

  return (
    <DataStage
      label={label}
      summary={summary}
      height={height}
      width={width}
      renderer="svg"
      points={count * series.length}
      stageRef={stage.ref}
      slot="hx-area"
      className={className}
      footer={
        <p aria-live="polite" className={VIZ_CLASS.live}>
          {readout || null}
        </p>
      }
    >
      {plot}
    </DataStage>
  );
}
