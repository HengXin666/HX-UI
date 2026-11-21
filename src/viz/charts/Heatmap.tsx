"use client";

import { motion } from "motion/react";
import { useMemo, type JSX } from "react";
import { AXIS_TEXT, HEAT_CELL, STAGE_HEIGHT, SVG_ATTR } from "../../constants/data-stage";
import { AXIS_PAIR } from "../../constants/data-scale";
import { scaleBand } from "../kernel-scale";
import { DataStage, type StageSize } from "../kernel-stage";
import { extent, linearScale, type Domain } from "../scale";
import { useVizStage } from "../use-stage";

/**
 * 热力图 (`@hx/ui/data`): 行 × 列的矩阵, 颜色只用主色的透明度表达大小 (单色阶, 不出彩虹色).
 * 入场按行发牌. 读屏摘要默认说出最大格.
 * .agents/notes/implemented/architecture/2026-11-19-omni-data-kernel.md
 */

/** 值 → 透明度. 定义域退化 (全同值) 时取上限. NaN 与缺值返回 0, 调用方不画. */
export function heatOpacity(value: number | undefined, domain: Domain): number {
  if (value === undefined || Number.isNaN(value)) return 0;
  if (domain[1] === domain[0]) return HEAT_CELL.maxOpacity;
  const t = Math.min(1, Math.max(0, linearScale(domain, [0, 1])(value)));
  return HEAT_CELL.minOpacity + (HEAT_CELL.maxOpacity - HEAT_CELL.minOpacity) * t;
}

export interface HeatCell {
  row: string;
  col: string;
  value: number | undefined;
}

/** 矩阵里的最大格, 给摘要用. 全空时返回 undefined. */
export function heatPeak(cells: readonly HeatCell[]): HeatCell | undefined {
  let best: HeatCell | undefined;
  for (const cell of cells) {
    if (cell.value === undefined || Number.isNaN(cell.value)) continue;
    if (!best || (best.value as number) < cell.value) best = cell;
  }
  return best;
}

export interface HeatmapProps {
  rows: readonly { id: string; label: string }[];
  cols: readonly { id: string; label: string }[];
  /** values[r][c], 与 rows / cols 顺序一致; 缺的格子不画. */
  values: readonly (readonly (number | undefined)[])[];
  label: string;
  height?: number;
  width?: number;
  format?: (value: number) => string;
  summary?: string;
  className?: string;
}

export function Heatmap({ rows, cols, values, label, height = STAGE_HEIGHT, width, format, summary, className }: HeatmapProps): JSX.Element {
  const stage = useVizStage<HTMLElement>(rows.length);
  const show = format ?? ((input: number) => input.toLocaleString());
  const cells = useMemo<HeatCell[]>(() => rows.flatMap((r, ri) => cols.map((c, ci) => ({ row: r.id, col: c.id, value: values[ri]?.[ci] }))), [rows, cols, values]);
  const domain = useMemo<Domain>(() => extent(cells.flatMap((c) => (c.value === undefined || Number.isNaN(c.value) ? [] : [c.value]))), [cells]);
  const peak = heatPeak(cells);
  const name = (list: readonly { id: string; label: string }[], id: string) => list.find((item) => item.id === id)?.label ?? id;
  const auto = peak ? `${name(rows, peak.row)} × ${name(cols, peak.col)} ${show(peak.value as number)}` : undefined;

  const plot = (size: StageSize): JSX.Element => {
    const { inner } = size;
    const xBand = scaleBand(
      cols.map((c) => c.id),
      [inner.x, inner.x + inner.w],
      { paddingInner: 0, paddingOuter: 0 },
    );
    const yBand = scaleBand(
      rows.map((r) => r.id),
      [inner.y, inner.y + inner.h],
      { paddingInner: 0, paddingOuter: 0 },
    );
    const cw = Math.max(0, xBand.bandwidth() - HEAT_CELL.gap);
    const ch = Math.max(0, yBand.bandwidth() - HEAT_CELL.gap);
    return (
      <svg aria-hidden width={size.width} height={size.height} className="absolute inset-0 overflow-visible text-muted-foreground">
        {rows.map((r, ri) => (
          <g key={r.id} data-row={r.id}>
            <text x={inner.x - AXIS_TEXT.gap} y={(yBand(r.id) ?? 0) + yBand.bandwidth() / AXIS_PAIR} textAnchor={SVG_ATTR.end} dominantBaseline={SVG_ATTR.middle} fontSize={AXIS_TEXT.size} fill={SVG_ATTR.color}>
              {r.label}
            </text>
            {cols.map((c, ci) => {
              const value = values[ri]?.[ci];
              const opacity = heatOpacity(value, domain);
              if (opacity === 0) return null;
              return (
                <motion.rect
                  key={c.id}
                  data-cell={`${r.id}:${c.id}`}
                  x={xBand(c.id) ?? 0}
                  y={yBand(r.id) ?? 0}
                  width={cw}
                  height={ch}
                  rx={HEAT_CELL.radius}
                  className="text-primary"
                  fill={SVG_ATTR.color}
                  fillOpacity={opacity}
                  initial={stage.reduced ? false : { opacity: 0 }}
                  animate={{ opacity: stage.shown ? 1 : 0 }}
                  transition={stage.at(ri)}
                />
              );
            })}
          </g>
        ))}
        {cols.map((c) => (
          <text key={c.id} x={(xBand(c.id) ?? 0) + xBand.bandwidth() / AXIS_PAIR} y={inner.y + inner.h + AXIS_TEXT.gap + AXIS_TEXT.size} textAnchor={SVG_ATTR.middle} fontSize={AXIS_TEXT.size} fill={SVG_ATTR.color}>
            {c.label}
          </text>
        ))}
      </svg>
    );
  };

  return (
    <DataStage label={label} summary={summary ?? auto} height={height} width={width} renderer="svg" points={cells.length} stageRef={stage.ref} slot="hx-heatmap" className={className}>
      {plot}
    </DataStage>
  );
}
