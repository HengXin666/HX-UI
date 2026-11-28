"use client";

import { AnimatePresence, m } from "motion/react";
import { arc as d3arc } from "d3-shape";
import { scaleLinear, scaleSqrt } from "d3-scale";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "@/motion/use-reduced-motion";
import { cn } from "@/lib/utils";
import { useArcTween, type Arc } from "./arc-tween";

export interface RoseSeries { key: string; name: string; color?: string }
export type RoseDatum = { label: string } & Record<string, number | string>;

export interface RoseProps {
  /** 每个类目一行, 各系列的值写在系列 key 上 */
  data: RoseDatum[];
  /** 堆叠的系列 (从里到外); 只有一个时就是普通玫瑰图 */
  series: RoseSeries[];
  /** area: 面积和数值成正比 (半径按平方根, 不夸大大值); radius: 半径和数值成正比 */
  scale?: "area" | "radius";
  /** 内圈留空的比例 0–0.6 */
  innerRadius?: number;
  /** 图的直径上限 */
  size?: number;
  /** 类目名写在外圈 */
  showLabels?: boolean;
  legend?: boolean;
  format?: (v: number) => string;
  unit?: string;
  ariaLabel?: string;
  className?: string;
}

const TAU = Math.PI * 2;
const PALETTE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

/**
 * 南丁格尔玫瑰图: 每个类目一片等角扇形, 长短表示大小, 可堆叠多个系列.
 * 默认按面积映射, 避免半径映射把大值放大成平方倍.
 * 增删类目时其余扇形转到新角度让位, 新扇形从内圈长出来; 图例开关系列时那一层伸缩.
 */
export function Rose({
  data, series, scale = "area", innerRadius = 0.16, size = 440, showLabels = true, legend = true,
  format = (v) => v.toLocaleString("zh-CN", { maximumFractionDigits: 1 }), unit = "", ariaLabel = "玫瑰图", className,
}: RoseProps) {
  const reduced = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  const narrow = width > 0 && width < 420;
  const D = Math.max(200, Math.min(size, width));
  // 外圈留给类目名
  const labelPad = showLabels ? (narrow ? 26 : 34) : 6;
  const outer = D / 2 - labelPad, inner = outer * Math.max(0, Math.min(0.6, innerRadius));

  const [hidden, setHidden] = useState<Set<string>>(() => new Set());
  const shown = series.filter((s) => !hidden.has(s.key));
  const colorOf = (key: string) => series.find((s) => s.key === key)?.color ?? PALETTE[series.findIndex((s) => s.key === key) % PALETTE.length];
  const val = (d: RoseDatum, k: string) => Math.max(0, Number(d[k]) || 0);
  const totals = data.map((d) => shown.reduce((s, x) => s + val(d, x.key), 0));
  const max = Math.max(1e-9, ...totals);
  const grandTotal = totals.reduce((a, b) => a + b, 0);

  const r = useMemo(() => (scale === "area" ? scaleSqrt() : scaleLinear()).domain([0, max]).range([inner, outer]).nice(), [scale, max, inner, outer]);
  // 刻度圈: 数值等距 (面积模式下圈之间越来越密, 这就是面积映射的样子)
  const ticks = r.ticks(narrow ? 3 : 4).filter((v) => v > 0);

  const step = data.length ? TAU / data.length : TAU;
  const pad = Math.min(step * 0.08, 0.03);
  const target = useMemo(() => {
    const t = new Map<string, Arc>();
    data.forEach((d, i) => {
      const a0 = (i - 0.5) * step + pad, a1 = (i + 0.5) * step - pad;
      let run = 0;
      for (const s of series) {
        const on = !hidden.has(s.key);
        const v = on ? val(d, s.key) : 0;
        const r0 = r(run), r1 = r(run + v);
        t.set(`${d.label}\u0000${s.key}`, { a0, a1, r0, r1, o: on ? 1 : 0 });
        run += v;
      }
    });
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, series, hidden, r, step, pad]);

  const frame = useArcTween(target, {
    reduced,
    // 新扇形贴着内圈长出来, 删掉的缩回内圈
    enter: (a) => ({ ...a, r0: inner, r1: inner, o: 1 }),
    exit: (a) => ({ ...a, r0: inner, r1: inner, o: 0 }),
  });

  // 类目标签也要补间角度, 用同样的 tween 驱动一条不可见的"扇形"
  const labelTarget = useMemo(() => {
    const t = new Map<string, Arc>();
    data.forEach((d, i) => t.set(d.label, { a0: (i - 0.5) * step, a1: (i + 0.5) * step, r0: outer, r1: outer, o: 1 }));
    return t;
  }, [data, step, outer]);
  const labels = useArcTween(labelTarget, { reduced, enter: (a) => ({ ...a, o: 0 }), exit: (a) => ({ ...a, o: 0 }) });

  // 交互
  const [hover, setHover] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const [legendHover, setLegendHover] = useState<string | null>(null);
  const active = hover ?? focus;
  const ai = data.findIndex((d) => d.label === active);
  const tabLabel = focus && data.some((d) => d.label === focus) ? focus : data[0]?.label;
  const svgRef = useRef<SVGSVGElement>(null);
  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = data.findIndex((d) => d.label === tabLabel);
    const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    let j = -1;
    if (dir) j = (i + dir + data.length) % data.length;
    else if (e.key === "Home") j = 0;
    else if (e.key === "End") j = data.length - 1;
    if (j < 0 || i < 0) return;
    e.preventDefault();
    const k = data[j].label; setFocus(k);
    svgRef.current?.querySelector<SVGGElement>(`g[data-k="${CSS.escape(k)}"]`)?.focus();
  };

  const arcGen = d3arc<Arc>().startAngle((d) => d.a0).endAngle((d) => d.a1).innerRadius((d) => d.r0).outerRadius((d) => Math.max(d.r0, d.r1)).cornerRadius(2);
  const ringArc = d3arc<{ r: number }>().startAngle(0).endAngle(TAU).innerRadius((d) => d.r).outerRadius((d) => d.r);

  // 提示框位置: 扇形外沿中点
  const tip = ai >= 0 && (() => {
    const d = data[ai];
    const mid = ai * step;
    const rr = r(totals[ai]);
    return { d, i: ai, x: D / 2 + Math.sin(mid) * rr, y: D / 2 - Math.cos(mid) * rr };
  })();

  const share = (v: number) => (grandTotal > 0 ? `${((v / grandTotal) * 100).toFixed(1)}%` : "—");
  const keysByLabel = new Map<string, string[]>();
  for (const k of frame.keys()) { const [l] = k.split("\u0000"); if (!keysByLabel.has(l)) keysByLabel.set(l, []); keysByLabel.get(l)!.push(k); }
  const live = new Set(data.map((d) => d.label));

  return (
    <div ref={box} className={cn("relative w-full", className)}>
      {width > 0 && (
        <div className="relative mx-auto" style={{ width: D, height: D }}>
          <svg ref={svgRef} width={D} height={D} role="group" aria-roledescription="玫瑰图" className="block overflow-visible"
            aria-label={`${ariaLabel}，${data.length} 个类目，${scale === "area" ? "面积" : "半径"}表示数值。方向键逐个查看`} onKeyDown={onKeyDown}>
            <g transform={`translate(${D / 2},${D / 2})`}>
              {/* 刻度圈 */}
              <g aria-hidden>
                <AnimatePresence initial={false}>
                  {ticks.map((v) => (
                    <m.g key={v} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                      <m.path initial={false} animate={{ d: ringArc({ r: r(v) }) ?? "" }} transition={{ duration: reduced ? 0 : 0.45 }} fill="none" stroke="var(--border)" strokeDasharray="2 3" />
                    </m.g>
                  ))}
                </AnimatePresence>
                {inner > 0 && <circle r={inner} fill="none" stroke="var(--border)" />}
              </g>

              {/* 扇形, 按类目分组 */}
              {[...keysByLabel].map(([label, keys]) => {
                const isLive = live.has(label);
                const i = data.findIndex((d) => d.label === label);
                const dim = (ai >= 0 && ai !== i) ;
                return (
                  <g key={label} data-k={label} role={isLive ? "img" : undefined} aria-hidden={isLive ? undefined : true}
                    tabIndex={isLive ? (label === tabLabel ? 0 : -1) : undefined}
                    aria-label={isLive ? `${label}，合计 ${format(totals[i])}${unit}，占 ${share(totals[i])}${shown.length > 1 ? `；${shown.map((s) => `${s.name} ${format(val(data[i], s.key))}${unit}`).join("，")}` : ""}` : undefined}
                    onPointerEnter={() => isLive && setHover(label)}
                    onPointerLeave={() => setHover((h) => (h === label ? null : h))}
                    onFocus={() => setFocus(label)}
                    onBlur={() => setFocus((f) => (f === label ? null : f))}
                    className="cursor-default outline-none transition-opacity duration-200 focus-visible:[&>path:last-of-type]:stroke-[var(--ring)]"
                    style={{ opacity: dim ? 0.35 : 1 }}>
                    {/* 命中区: 整片扇形到外圈, 短扇形也好悬停 */}
                    {isLive && <path d={arcGen({ a0: (i - 0.5) * step, a1: (i + 0.5) * step, r0: inner, r1: outer, o: 1 }) ?? undefined} fill="transparent" />}
                    {keys.map((k) => {
                      const a = frame.get(k)!;
                      if (a.r1 - a.r0 < 0.2 && a.o < 0.99) return null;
                      const sk = k.split("\u0000")[1];
                      const lh = legendHover && legendHover !== sk;
                      return <path key={k} d={arcGen(a) ?? undefined} fill={colorOf(sk)} fillOpacity={(lh ? 0.25 : 0.88) * a.o} stroke="var(--background)" strokeWidth={1} style={{ transition: "fill-opacity 200ms" }} />;
                    })}
                  </g>
                );
              })}

              {/* 刻度数字: 画在扇形上面, 放在第一片和最后一片之间的缝上 */}
              <g aria-hidden className="pointer-events-none">
                {ticks.map((v) => (
                  <text key={v} x={Math.sin(-step / 2) * r(v)} y={-Math.cos(-step / 2) * r(v)} dy="0.32em" textAnchor="middle" stroke="var(--background)" strokeWidth={3} paintOrder="stroke" className="fill-muted-foreground font-mono text-[10px] tabular-nums">{format(v)}</text>
                ))}
              </g>

              {/* 类目名 */}
              {showLabels && (
                <g aria-hidden className="pointer-events-none">
                  {[...labels].map(([label, a]) => {
                    const mid = (a.a0 + a.a1) / 2;
                    const deg = (mid * 180) / Math.PI;
                    // 太密时隔一个写一个
                    const i = data.findIndex((d) => d.label === label);
                    const every = Math.ceil((data.length * (narrow ? 26 : 30)) / (TAU * outer));
                    if (i >= 0 && every > 1 && i % every) return null;
                    const rr = outer + (narrow ? 12 : 16);
                    const x = Math.sin(mid) * rr, y = -Math.cos(mid) * rr;
                    return (
                      <text key={label} x={x} y={y} dy="0.32em" textAnchor={Math.abs(Math.sin(mid)) < 0.2 ? "middle" : Math.sin(mid) > 0 ? "start" : "end"}
                        opacity={a.o} className={cn("text-[11px]", label === active ? "fill-foreground font-medium" : "fill-muted-foreground")}
                        data-deg={deg.toFixed(0)}>
                        {label.length > 5 && narrow ? `${label.slice(0, 4)}…` : label}
                      </text>
                    );
                  })}
                </g>
              )}
            </g>
          </svg>

          {/* 提示 */}
          <div aria-hidden
            className={cn("pointer-events-none absolute top-0 left-0 z-10 min-w-36 rounded-lg border bg-popover/95 px-3 py-2 text-xs shadow-float backdrop-blur transition-opacity duration-150", tip ? "opacity-100" : "opacity-0")}
            style={tip ? { transform: `translate(${Math.max(-8, Math.min(D - 150, tip.x + (tip.x > D / 2 ? 10 : -160)))}px, ${Math.max(0, Math.min(D - 40 - shown.length * 18, tip.y - 20))}px)` } : undefined}>
            {tip && (
              <>
                <p className="flex justify-between gap-4 font-medium"><span>{tip.d.label}</span><span className="font-mono tabular-nums">{format(totals[tip.i])}{unit}</span></p>
                {shown.length > 1 && [...shown].reverse().map((s) => (
                  <p key={s.key} className="mt-1 flex items-center justify-between gap-4 text-muted-foreground">
                    <span className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: colorOf(s.key) }} />{s.name}</span>
                    <span className="font-mono text-foreground tabular-nums">{format(val(tip.d, s.key))}</span>
                  </p>
                ))}
                <p className="mt-1 flex justify-between gap-4 text-muted-foreground"><span>占全部</span><span className="font-mono tabular-nums">{share(totals[tip.i])}</span></p>
              </>
            )}
          </div>
        </div>
      )}

      {legend && series.length > 1 && (
        <div className="mt-3 flex flex-wrap justify-center gap-1.5" role="group" aria-label="系列，点击隐藏或显示">
          {series.map((s) => {
            const off = hidden.has(s.key);
            return (
              <button key={s.key} type="button" aria-pressed={!off}
                onClick={() => setHidden((h) => { const n = new Set(h); if (n.has(s.key)) n.delete(s.key); else if (n.size < series.length - 1) n.add(s.key); return n; })}
                onPointerEnter={() => setLegendHover(off ? null : s.key)} onPointerLeave={() => setLegendHover(null)}
                onFocus={() => setLegendHover(off ? null : s.key)} onBlur={() => setLegendHover(null)}
                className={cn("inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs transition-[opacity,background-color,color] duration-150 hover:bg-accent", off ? "text-muted-foreground opacity-60" : "text-foreground")}>
                <span className={cn("size-2 rounded-full transition-transform duration-200", off && "scale-50")} style={{ background: colorOf(s.key) }} />
                {s.name}
              </button>
            );
          })}
        </div>
      )}

      <table className="sr-only">
        <caption>{ariaLabel}</caption>
        <thead><tr><th scope="col">类目</th>{shown.map((s) => <th key={s.key} scope="col">{s.name}</th>)}<th scope="col">合计</th></tr></thead>
        <tbody>{data.map((d, i) => <tr key={d.label}><td>{d.label}</td>{shown.map((s) => <td key={s.key}>{format(val(d, s.key))}</td>)}<td>{format(totals[i])}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
