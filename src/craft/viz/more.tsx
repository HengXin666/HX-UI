"use client";

import { type JSX } from "react";
import type { SeriesPoint } from "./series";

/** 雷达. 顶点按最大值归一. */
export function RadarChart({ points }: { readonly points: readonly SeriesPoint[] }): JSX.Element {
  const top = Math.max(1, ...points.map((point) => point.value));
  const count = Math.max(1, points.length);
  const coords = points.map((point, index) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    const radius = (point.value / top) * 36;
    return [40 + Math.cos(angle) * radius, 40 + Math.sin(angle) * radius] as const;
  });
  const d = coords.map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x} ${y}`).join(" ") + " Z";
  return (
    <svg viewBox="0 0 80 80" className="size-28" role="img" aria-label="雷达">
      <polygon points="40,8 70,32 58,68 22,68 10,32" className="fill-none stroke-border" strokeWidth="1" />
      <path d={d} className="fill-primary/30 stroke-primary" strokeWidth="1" />
    </svg>
  );
}

/** 时间线. 当前步之前的点用主色. */
export function Timeline({ points, active }: { readonly points: readonly SeriesPoint[]; readonly active: number }): JSX.Element {
  return (
    <ol className="flex flex-col gap-2 text-sm">
      {points.map((point, index) => (
        <li key={point.label} className="flex items-center gap-2 text-foreground">
          <span className={index <= active ? "size-2 rounded-full bg-primary" : "size-2 rounded-full bg-border"} />
          {point.label}
        </li>
      ))}
    </ol>
  );
}

/** 流程. 节点之间用 1px 线连起来. */
export function FlowDiagram({ points }: { readonly points: readonly SeriesPoint[] }): JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-foreground">
      {points.map((point, index) => (
        <span key={point.label} className="flex items-center gap-2">
          <span className="rounded-md border border-border px-2 py-1">{point.label}</span>
          {index < points.length - 1 ? <span className="h-px w-4 bg-border" /> : null}
        </span>
      ))}
    </div>
  );
}

/** 指标卡. 数字用等宽, 说明用次要色. */
export function KpiCard({ label, value, hint }: { readonly label: string; readonly value: string; readonly hint: string }): JSX.Element {
  return (
    <article className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl tabular-nums text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </article>
  );
}
