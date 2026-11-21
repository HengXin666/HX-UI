"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useRef, type JSX } from "react";
import { AREA_OPACITY, AXIS_TEXT, READOUT_SEPARATOR, SERIES_TONES, STAGE_HEIGHT, type StageRenderer, GRID_OPACITY, SVG_ATTR } from "../../constants/data-stage";
import { DEFAULT_TICK_COUNT } from "../../constants/data-scale";
import { cn } from "../../primitives/utils";
import { axisRescale, axisTicks } from "../kernel-axis";
import { scaleLinear, scalePoint, scaleTime } from "../kernel-scale";
import { DataStage, type StageSize } from "../kernel-stage";
import { areaPath, extent, linePath, niceDomain, project, revealSeries, type Domain, type Point } from "../scale";
import { VIZ_CLASS } from "../tokens";
import { useVizStage } from "../use-stage";

/**
 * 折线 / 面积图 (`@hx/ui/data`). 多序列, 类目轴或时间轴, 受控进度, 越界重标.
 * 几何纯函数 `seriesPath` / `seriesGeometry` 也给 viz 的 Trend 用, 两边画出来的线完全一致.
 * .agents/notes/implemented/architecture/2026-11-19-omni-data-kernel.md
 */

export interface SeriesGeometry {
  points: Point[];
  line: string;
  area: string;
  /** 截到进度处的读数 (插值); 不给进度时是末值. */
  value: number | undefined;
}

/** 已投影的点 → 折线, 面积与读数. progress 不给时原样全画. */
export function seriesPath(all: readonly Point[], values: readonly number[], baseline: number, progress?: number): SeriesGeometry {
  const reveal = progress === undefined ? { points: [...all], value: values[values.length - 1] } : revealSeries(all, values, progress);
  return { points: reveal.points, line: linePath(reveal.points), area: areaPath(reveal.points, baseline), value: reveal.value };
}

/** 一条序列在 viewBox 盒子里的几何. Trend 用它. */
export function seriesGeometry(values: readonly number[], domain: Domain, box: { width: number; height: number; pad: number }, progress?: number): SeriesGeometry {
  return seriesPath(project(values, domain, box), values, box.height - box.pad, progress);
}

export interface LineSeries {
  id: string;
  label: string;
  values: readonly number[];
}

export interface LineProps {
  series: readonly LineSeries[];
  /** 读屏名称, 也是图注. */
  label: string;
  /** 横轴: 类目或日期. 不给时按序号. 长度应与序列一致. */
  x?: readonly string[] | readonly Date[];
  area?: boolean;
  height?: number;
  /** 量不到宽度时的宽度 (服务端, 测试). */
  width?: number;
  /** 受控进度 0..1. 给了就停用入场描线, 线与读数画到这个进度; 减弱动效时视为 1. */
  progress?: number;
  format?: (value: number) => string;
  renderer?: StageRenderer;
  summary?: string;
  className?: string;
}


export function isDates(x: LineProps["x"]): x is readonly Date[] {
  return !!x && x.length > 0 && x[0] instanceof Date;
}

/** 横轴位置与刻度: 日期走时间轴, 其余按类目点轴. Area 共用. */
export function xPositions(x: LineProps["x"], count: number, inner: StageSize["inner"]): { px: number[]; ticks: { px: number; label: string }[] } {
  const range: Domain = [inner.x, inner.x + inner.w];
  if (isDates(x)) {
    const times = x.map((d) => d.getTime());
    const first = new Date(Math.min(...times));
    const last = new Date(Math.max(...times));
    const scale = scaleTime([first, last], range);
    return { px: x.map((d) => scale(d)), ticks: axisTicks(scale) };
  }
  const keys = x ? x.map(String) : Array.from({ length: count }, (_, i) => String(i + 1));
  const scale = scalePoint(keys, range);
  return { px: keys.map((k) => scale(k) ?? inner.x), ticks: axisTicks(scale) };
}

function drawCanvas(canvas: HTMLCanvasElement | null, lines: readonly SeriesGeometry[], size: StageSize): void {
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) return;
  const color = getComputedStyle(canvas).color;
  ctx.clearRect(0, 0, size.width, size.height);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  for (const geo of lines) {
    ctx.beginPath();
    geo.points.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
    ctx.stroke();
  }
}

export function Line({ series, label, x, area = false, height = STAGE_HEIGHT, width, progress, format, renderer = "auto", summary, className }: LineProps): JSX.Element {
  const stage = useVizStage<HTMLElement>(series.length);
  const flat = useMemo(() => series.flatMap((s) => s.values), [series]);
  const domainRef = useRef<Domain | null>(null);
  const { domain, shocked } = useMemo(() => {
    const previous = domainRef.current;
    const next = previous ? axisRescale(previous, flat, DEFAULT_TICK_COUNT) : { domain: niceDomain(extent(flat), DEFAULT_TICK_COUNT), shocked: false };
    domainRef.current = next.domain;
    return next;
  }, [flat]);
  const controlled = progress !== undefined;
  const at = controlled ? (stage.reduced ? 1 : progress) : undefined;
  const show = format ?? ((input: number) => input.toLocaleString());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const count = Math.max(0, ...series.map((s) => s.values.length));
  const readings = series.map((s) => {
    const values = s.values;
    if (at === undefined) return values[values.length - 1];
    return revealSeries(values.map((v, i) => [i, v] as const), values, at).value;
  });
  const readout = series
    .map((s, i) => (readings[i] === undefined ? null : series.length > 1 ? `${s.label}: ${show(readings[i] as number)}` : show(readings[i] as number)))
    .filter(Boolean)
    .join(READOUT_SEPARATOR);

  const plot = (size: StageSize): JSX.Element => {
    const { inner } = size;
    const baseline = inner.y + inner.h;
    const y = scaleLinear(domain, [baseline, inner.y]);
    const xs = xPositions(x, count, inner);
    const geos = series.map((s) => seriesPath(s.values.map((v, i) => [xs.px[i] ?? inner.x, y(v)] as const), s.values, baseline, at));
    const yTicks = axisTicks(y, { format: show, label: { charWidth: AXIS_TEXT.size } });
    return (
      <>
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
          {size.renderer === "svg"
            ? geos.map((geo, i) => (
                <g key={series[i].id} data-series={series[i].id} className={SERIES_TONES[i % SERIES_TONES.length]}>
                  {area && geo.area ? <path d={geo.area} className={cn("fill-current", AREA_OPACITY)} /> : null}
                  {geo.line ? (
                    <motion.path
                      d={geo.line}
                      fill={SVG_ATTR.none}
                      stroke={SVG_ATTR.color}
                      strokeWidth={1}
                      vectorEffect={SVG_ATTR.nonScaling}
                      initial={stage.reduced || controlled ? false : { pathLength: 0 }}
                      animate={{ pathLength: stage.shown || controlled ? 1 : 0 }}
                      transition={{ pathLength: stage.draw }}
                    />
                  ) : null}
                </g>
              ))
            : null}
        </svg>
        {size.renderer === "canvas" ? (
          <CanvasLayer canvasRef={canvasRef} size={size} lines={geos} />
        ) : null}
      </>
    );
  };

  return (
    <DataStage
      label={label}
      summary={summary}
      height={height}
      width={width}
      renderer={renderer}
      points={flat.length}
      stageRef={stage.ref}
      shocked={shocked}
      slot="hx-line"
      className={className}
      footer={
        <p aria-live={controlled ? undefined : "polite"} className={VIZ_CLASS.live}>
          {readout || null}
        </p>
      }
    >
      {plot}
    </DataStage>
  );
}

function CanvasLayer({ canvasRef, size, lines }: { canvasRef: { current: HTMLCanvasElement | null }; size: StageSize; lines: readonly SeriesGeometry[] }): JSX.Element {
  useEffect(() => drawCanvas(canvasRef.current, lines, size), [canvasRef, lines, size]);
  return (
    <canvas
      ref={(node) => {
        canvasRef.current = node;
      }}
      aria-hidden
      width={size.width}
      height={size.height}
      className="absolute inset-0 text-foreground"
    />
  );
}
