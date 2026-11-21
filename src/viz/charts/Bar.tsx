"use client";

import { motion } from "motion/react";
import { useMemo, useRef, type JSX } from "react";
import { AXIS_TEXT, GROUP_PADDING, SERIES_TONES, STAGE_HEIGHT, type BarMode, type BarOrientation, GRID_OPACITY, SVG_ATTR } from "../../constants/data-stage";
import { DEFAULT_TICK_COUNT } from "../../constants/data-scale";
import { axisRescale, axisTicks } from "../kernel-axis";
import { scaleBand, scaleLinear } from "../kernel-scale";
import { DataStage, type StageSize } from "../kernel-stage";
import { linearScale, zeroDomain, type Domain } from "../scale";
import { useVizStage } from "../use-stage";

/**
 * 柱状图 (`@hx/ui/data`): 单值或多序列, 分组或堆叠, 纵向或横向. 从 0 起算, 负值按 0 画.
 * 柱数少, 只出 SVG. 入场按发牌错峰 (useVizStage), 越界重标只给根节点打 data-shock, 冲击动画仍归 viz 的 BarChart.
 * 纯函数 `barFill` 也给 BarChart 用, 两边柱高完全一致.
 * .agents/notes/implemented/architecture/2026-11-19-omni-data-kernel.md
 */

const PERCENT = 100;

/** 值在 domain 里的高度比例. 只夹下限 (负值为 0), 不夹上限: 冲击那一拍允许冲出画框. */
export function barFill(value: number, domain: Domain): number {
  return Math.max(0, linearScale(domain, [0, PERCENT])(value)) / PERCENT;
}

export interface StackSegment {
  start: number;
  end: number;
}

/** 堆叠段: 每段的起止比例. 负值按 0, 末段的 end 等于总值的比例. */
export function stackSegments(values: readonly number[], domain: Domain): StackSegment[] {
  let sum = 0;
  return values.map((value) => {
    const start = barFill(sum, domain);
    sum += Math.max(0, value);
    return { start, end: barFill(sum, domain) };
  });
}

export interface BarRow {
  id: string;
  label: string;
  /** 单序列的值. 与 values 二选一. */
  value?: number;
  /** 多序列的值, 顺序同 series. */
  values?: readonly number[];
}

export interface BarProps {
  data: readonly BarRow[];
  label: string;
  /** 多序列时的序列名 (图例与读屏). */
  series?: readonly { id: string; label: string }[];
  mode?: BarMode;
  orientation?: BarOrientation;
  height?: number;
  width?: number;
  format?: (value: number) => string;
  summary?: string;
  className?: string;
}

function rowValues(row: BarRow): readonly number[] {
  return row.values ?? [row.value ?? 0];
}

export function Bar({ data, label, series, mode = "group", orientation = "vertical", height = STAGE_HEIGHT, width, format, summary, className }: BarProps): JSX.Element {
  const stage = useVizStage<HTMLElement>(data.length);
  const show = format ?? ((input: number) => input.toLocaleString());
  const stacked = mode === "stack";
  const extents = useMemo(() => data.map((row) => (stacked ? rowValues(row).reduce((a, v) => a + Math.max(0, v), 0) : Math.max(0, ...rowValues(row)))), [data, stacked]);
  const domainRef = useRef<Domain | null>(null);
  const { domain, shocked } = useMemo(() => {
    const previous = domainRef.current;
    const next = previous ? axisRescale(previous, extents, DEFAULT_TICK_COUNT) : { domain: zeroDomain(extents, DEFAULT_TICK_COUNT), shocked: false };
    domainRef.current = next.domain;
    return next;
  }, [extents]);
  const vertical = orientation === "vertical";

  const plot = (size: StageSize): JSX.Element => {
    const { inner } = size;
    const catRange: Domain = vertical ? [inner.x, inner.x + inner.w] : [inner.y, inner.y + inner.h];
    const band = scaleBand(
      data.map((row) => row.id),
      catRange,
    );
    const valueLength = vertical ? inner.h : inner.w;
    const valueScale = vertical ? scaleLinear(domain, [inner.y + inner.h, inner.y]) : scaleLinear(domain, [inner.x, inner.x + inner.w]);
    const ticks = axisTicks(valueScale, { format: show, label: vertical ? { charWidth: AXIS_TEXT.size } : {} });
    const rect = (catStart: number, catSize: number, from: number, to: number) =>
      vertical
        ? { x: catStart, width: catSize, y: inner.y + inner.h - to * valueLength, height: Math.max(0, (to - from) * valueLength) }
        : { y: catStart, height: catSize, x: inner.x + from * valueLength, width: Math.max(0, (to - from) * valueLength) };

    return (
      <svg aria-hidden width={size.width} height={size.height} className="absolute inset-0 overflow-visible text-muted-foreground">
        {ticks.map((tick) =>
          vertical ? (
            <g key={`v${tick.value}`}>
              <line x1={inner.x} x2={inner.x + inner.w} y1={tick.px} y2={tick.px} stroke={SVG_ATTR.color} strokeOpacity={GRID_OPACITY} />
              <text x={inner.x - AXIS_TEXT.gap} y={tick.px} textAnchor={SVG_ATTR.end} dominantBaseline={SVG_ATTR.middle} fontSize={AXIS_TEXT.size} fill={SVG_ATTR.color}>
                {tick.label}
              </text>
            </g>
          ) : (
            <g key={`v${tick.value}`}>
              <line y1={inner.y} y2={inner.y + inner.h} x1={tick.px} x2={tick.px} stroke={SVG_ATTR.color} strokeOpacity={GRID_OPACITY} />
              <text y={inner.y + inner.h + AXIS_TEXT.gap + AXIS_TEXT.size} x={tick.px} textAnchor={SVG_ATTR.middle} fontSize={AXIS_TEXT.size} fill={SVG_ATTR.color}>
                {tick.label}
              </text>
            </g>
          ),
        )}
        {data.map((row, index) => {
          const start = band(row.id) ?? catRange[0];
          const bw = band.bandwidth();
          const values = rowValues(row);
          const segments = stacked
            ? stackSegments(values, domain).map((seg) => rect(start, bw, seg.start, seg.end))
            : (() => {
                const group = scaleBand(
                  values.map((_, i) => String(i)),
                  [start, start + bw],
                  { paddingInner: GROUP_PADDING, paddingOuter: 0 },
                );
                return values.map((v, i) => rect(group(String(i)) ?? start, group.bandwidth(), 0, barFill(v, domain)));
              })();
          const center = start + bw / 2;
          return (
            <g key={row.id} data-row={row.id}>
              {segments.map((geo, i) => (
                <motion.rect
                  key={series?.[i]?.id ?? i}
                  data-series={series?.[i]?.id ?? String(i)}
                  {...geo}
                  rx={2}
                  className={SERIES_TONES[i % SERIES_TONES.length]}
                  fill={SVG_ATTR.color}
                  style={{ transformBox: "fill-box", transformOrigin: vertical ? "bottom" : "left" }}
                  initial={stage.reduced ? false : vertical ? { scaleY: 0 } : { scaleX: 0 }}
                  animate={vertical ? { scaleY: stage.shown ? 1 : 0 } : { scaleX: stage.shown ? 1 : 0 }}
                  transition={stage.at(index)}
                />
              ))}
              {vertical ? (
                <text x={center} y={inner.y + inner.h + AXIS_TEXT.gap + AXIS_TEXT.size} textAnchor={SVG_ATTR.middle} fontSize={AXIS_TEXT.size} fill={SVG_ATTR.color}>
                  {row.label}
                </text>
              ) : (
                <text x={inner.x - AXIS_TEXT.gap} y={center} textAnchor={SVG_ATTR.end} dominantBaseline={SVG_ATTR.middle} fontSize={AXIS_TEXT.size} fill={SVG_ATTR.color}>
                  {row.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  const describe = (row: BarRow): string => {
    const values = rowValues(row);
    if (!series || values.length === 1) return `${row.label} ${show(values[0] ?? 0)}`;
    return `${row.label} ${values.map((v, i) => `${series[i]?.label ?? i + 1} ${show(v)}`).join(", ")}`;
  };

  return (
    <DataStage
      label={label}
      summary={summary ?? data.map(describe).join("; ")}
      height={height}
      width={width}
      renderer="svg"
      points={data.length}
      stageRef={stage.ref}
      shocked={shocked}
      slot="hx-bar"
      className={className}
    >
      {plot}
    </DataStage>
  );
}
