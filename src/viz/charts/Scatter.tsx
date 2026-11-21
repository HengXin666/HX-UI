"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useRef, type JSX } from "react";
import { AXIS_TEXT, GRID_OPACITY, SCATTER_FILL_OPACITY, SCATTER_RADIUS, SERIES_TONES, STAGE_HEIGHT, SVG_ATTR, type StageRenderer } from "../../constants/data-stage";
import { DEFAULT_TICK_COUNT } from "../../constants/data-scale";
import { axisTicks } from "../kernel-axis";
import { scaleLinear, scaleSqrt, type ContinuousScale } from "../kernel-scale";
import { DataStage, type StageSize } from "../kernel-stage";
import { extent, niceDomain, type Domain } from "../scale";
import { useVizStage } from "../use-stage";

/**
 * 散点 / 气泡图 (`@hx/ui/data`). 两条线性轴, 可选 size 按面积映射半径, 可分组上色; 点多时 auto 走 canvas.
 * .agents/notes/implemented/architecture/2026-11-19-omni-data-kernel.md
 */

export interface ScatterDatum {
  id: string;
  x: number;
  y: number;
  /** 气泡大小, 按面积映射. */
  size?: number;
  /** 分组 (决定色阶), 与 groups 的 id 对应. */
  group?: string;
  label?: string;
}

export interface PlacedPoint {
  id: string;
  cx: number;
  cy: number;
  r: number;
  tone: number;
}

/** 半径比例尺: 0 到最大 size 按 sqrt 映射到 [min, max]; 没有 size 时返回定值. */
export function radiusScale(sizes: readonly number[]): (size: number | undefined) => number {
  const max = Math.max(0, ...sizes);
  if (max <= 0) return () => SCATTER_RADIUS.base;
  const scale = scaleSqrt([0, max], [SCATTER_RADIUS.min, SCATTER_RADIUS.max]);
  return (size) => (size === undefined ? SCATTER_RADIUS.base : scale(size));
}

/** 把数据放到画布上. 纯函数, canvas 与 svg 共用. */
export function placePoints(
  data: readonly ScatterDatum[],
  x: ContinuousScale<number>,
  y: ContinuousScale<number>,
  groups: readonly string[] = [],
): PlacedPoint[] {
  const r = radiusScale(data.flatMap((d) => (d.size === undefined ? [] : [d.size])));
  return data.map((d) => ({ id: d.id, cx: x(d.x), cy: y(d.y), r: r(d.size), tone: Math.max(0, d.group ? groups.indexOf(d.group) : 0) }));
}

export interface ScatterProps {
  data: readonly ScatterDatum[];
  label: string;
  groups?: readonly { id: string; label: string }[];
  /** 坐标轴名 (给读屏摘要与轴标签用). */
  xLabel?: string;
  yLabel?: string;
  height?: number;
  width?: number;
  format?: (value: number) => string;
  renderer?: StageRenderer;
  summary?: string;
  className?: string;
}

function drawDots(canvas: HTMLCanvasElement | null, dots: readonly PlacedPoint[], size: StageSize): void {
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) return;
  ctx.clearRect(0, 0, size.width, size.height);
  ctx.fillStyle = getComputedStyle(canvas).color;
  for (const dot of dots) {
    ctx.beginPath();
    ctx.arc(dot.cx, dot.cy, dot.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function DotCanvas({ dots, size }: { dots: readonly PlacedPoint[]; size: StageSize }): JSX.Element {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => drawDots(ref.current, dots, size), [dots, size]);
  return <canvas ref={ref} aria-hidden width={size.width} height={size.height} className="absolute inset-0 text-foreground" />;
}

export function Scatter({ data, label, groups, xLabel, yLabel, height = STAGE_HEIGHT, width, format, renderer = "auto", summary, className }: ScatterProps): JSX.Element {
  const stage = useVizStage<HTMLElement>(data.length);
  const show = format ?? ((input: number) => input.toLocaleString());
  const xDomain = useMemo<Domain>(() => niceDomain(extent(data.map((d) => d.x)), DEFAULT_TICK_COUNT), [data]);
  const yDomain = useMemo<Domain>(() => niceDomain(extent(data.map((d) => d.y)), DEFAULT_TICK_COUNT), [data]);
  const groupIds = useMemo(() => (groups ?? []).map((g) => g.id), [groups]);
  const auto = `${data.length} ${xLabel ?? "x"} ${show(xDomain[0])}–${show(xDomain[1])}, ${yLabel ?? "y"} ${show(yDomain[0])}–${show(yDomain[1])}`;

  const plot = (size: StageSize): JSX.Element => {
    const { inner } = size;
    const baseline = inner.y + inner.h;
    const x = scaleLinear(xDomain, [inner.x, inner.x + inner.w]);
    const y = scaleLinear(yDomain, [baseline, inner.y]);
    const dots = placePoints(data, x, y, groupIds);
    const xTicks = axisTicks(x, { format: show });
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
          {xTicks.map((tick) => (
            <text key={`x${tick.value}`} x={tick.px} y={baseline + AXIS_TEXT.gap + AXIS_TEXT.size} textAnchor={SVG_ATTR.middle} fontSize={AXIS_TEXT.size} fill={SVG_ATTR.color}>
              {tick.label}
            </text>
          ))}
          {size.renderer === "svg"
            ? dots.map((dot, index) => (
                <motion.circle
                  key={dot.id}
                  data-point={dot.id}
                  cx={dot.cx}
                  cy={dot.cy}
                  r={dot.r}
                  fill={SVG_ATTR.color}
                  fillOpacity={SCATTER_FILL_OPACITY}
                  className={SERIES_TONES[dot.tone % SERIES_TONES.length]}
                  style={{ transformBox: "fill-box", transformOrigin: "center" }}
                  initial={stage.reduced ? false : { scale: 0 }}
                  animate={{ scale: stage.shown ? 1 : 0 }}
                  transition={stage.at(index)}
                />
              ))
            : null}
        </svg>
        {size.renderer === "canvas" ? <DotCanvas dots={dots} size={size} /> : null}
      </>
    );
  };

  return (
    <DataStage label={label} summary={summary ?? auto} height={height} width={width} renderer={renderer} points={data.length} stageRef={stage.ref} slot="hx-scatter" className={className}>
      {plot}
    </DataStage>
  );
}
