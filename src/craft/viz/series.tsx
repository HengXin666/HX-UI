"use client";

import { useEffect, useState, type JSX } from "react";
import { useTrack } from "../use-track";
import { SPRING_THUMB } from "../tokens";

export interface SeriesPoint {
  readonly label: string;
  readonly value: number;
}

const VIEW = "0 0 200 110";
const PLOT = "h-28 w-full";
const ROLE = "img";
const TOP = 100;
const RISE = 90;
const CENTER = 40;
const RING = 24;
const SPAN = 200;

function maxOf(points: readonly SeriesPoint[]): number {
  return Math.max(1, ...points.map((point) => point.value));
}

function yOf(value: number, top: number): number {
  return TOP - (value / top) * RISE;
}

/** 折线. 换一组数据时线从当前形状弹簧到下一组. */
export function LineChart({ points }: { readonly points: readonly SeriesPoint[] }): JSX.Element {
  const track = useTrack(1, SPRING_THUMB);
  const [drawn, setDrawn] = useState(points);
  useEffect(() => {
    track.setTarget(1);
    setDrawn(points);
  }, [points, track.setTarget]);
  const top = maxOf(drawn);
  const step = drawn.length > 1 ? SPAN / (drawn.length - 1) : 0;
  const d = drawn.map((point, index) => `${index === 0 ? "M" : "L"} ${index * step} ${yOf(point.value, top)}`).join(" ");
  return (
    <svg viewBox={VIEW} className={PLOT} role={ROLE} aria-label="折线">
      <path d={d} fill="none" className="stroke-primary" strokeWidth={1} style={{ opacity: track.value }} />
    </svg>
  );
}

/** 面积. 与折线同一组点, 闭合到底. */
export function AreaChart({ points }: { readonly points: readonly SeriesPoint[] }): JSX.Element {
  const top = maxOf(points);
  const step = points.length > 1 ? SPAN / (points.length - 1) : 0;
  const line = points.map((point, index) => `${index * step},${yOf(point.value, top)}`).join(" ");
  const d = `M0,${TOP} ${line} ${SPAN},${TOP} Z`;
  return (
    <svg viewBox={VIEW} className={PLOT} role={ROLE} aria-label="面积">
      <path d={d} className="fill-primary/30 stroke-primary" strokeWidth={1} />
    </svg>
  );
}

/** 柱. 高度按最大值归一. */
export function BarChart({ points }: { readonly points: readonly SeriesPoint[] }): JSX.Element {
  const top = maxOf(points);
  const width = 160 / Math.max(1, points.length);
  return (
    <svg viewBox={VIEW} className={PLOT} role={ROLE} aria-label="柱">
      {points.map((point, index) => {
        const h = (point.value / top) * RISE;
        return <rect key={point.label} x={20 + index * width} y={TOP - h} width={Math.max(4, width - 6)} height={h} className="fill-primary" />;
      })}
    </svg>
  );
}

/** 环. 每段按占比画圆弧. */
export function DonutChart({ points }: { readonly points: readonly SeriesPoint[] }): JSX.Element {
  const total = points.reduce((sum, point) => sum + point.value, 0) || 1;
  let angle = 0;
  return (
    <svg viewBox="0 0 80 80" className="size-28" role={ROLE} aria-label="环">
      {points.map((point, index) => {
        const sweep = (point.value / total) * Math.PI * 2;
        const start = angle;
        angle += sweep;
        const large = sweep > Math.PI ? 1 : 0;
        const x1 = CENTER + Math.cos(start) * RING;
        const y1 = CENTER + Math.sin(start) * RING;
        const x2 = CENTER + Math.cos(angle) * RING;
        const y2 = CENTER + Math.sin(angle) * RING;
        return <path key={point.label} d={`M ${x1} ${y1} A ${RING} ${RING} 0 ${large} 1 ${x2} ${y2}`} fill="none" className={index % 2 ? "stroke-accent" : "stroke-primary"} strokeWidth={1} />;
      })}
    </svg>
  );
}
