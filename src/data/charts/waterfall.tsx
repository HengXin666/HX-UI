"use client";

import { AnimatePresence, m } from "motion/react";
import { scaleBand, scaleLinear } from "d3-scale";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "@/motion/use-reduced-motion";
import { spring } from "@/motion/presets";
import { cn } from "@/lib/utils";

export interface WaterfallItem {
  label: string;
  /** start: 期初 (从 0 起, 设定起点); delta: 增减额; total: 到这里为止的合计 (值自动算) */
  value?: number;
  type?: "start" | "delta" | "total";
}

export interface WaterfallProps {
  /** 第一项通常是期初 type="start"; 不写 type 的都当增减额 */
  data: WaterfallItem[];
  /** 涨跌配色: finance = 涨绿跌红, cn = 涨红跌绿 */
  scheme?: "finance" | "cn";
  /** auto: 宽度不够时横过来 */
  orientation?: "vertical" | "horizontal" | "auto";
  format?: (v: number) => string;
  /** 柱子顶上的数 */
  showValues?: boolean;
  /** 柱子之间的阶梯连线 */
  connectors?: boolean;
  height?: number;
  unit?: string;
  ariaLabel?: string;
  className?: string;
}

interface Bar { key: string; label: string; start?: boolean; type: "delta" | "total"; delta: number; from: number; to: number; i: number }

/**
 * 瀑布图: 利润拆解, 预算增减, 现金流. 每根柱子从上一根的终点开始, 合计柱从 0 起.
 * 增删项目时柱子从所在台阶长出来 / 缩回去, 其余柱子平移到新位置. 方向键在柱子间移动.
 */
export function Waterfall({
  data, scheme = "finance", orientation = "auto", format = (v) => v.toLocaleString("zh-CN", { maximumFractionDigits: 1 }),
  showValues = true, connectors = true, height = 320, unit = "", ariaLabel = "瀑布图", className,
}: WaterfallProps) {
  const reduced = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el); return () => ro.disconnect();
  }, []);

  const bars: Bar[] = useMemo(() => {
    let run = 0;
    const seen = new Map<string, number>();
    return data.map((d, i) => {
      // 同名项也要有稳定且唯一的 key
      const n = seen.get(d.label) ?? 0; seen.set(d.label, n + 1);
      const key = n ? `${d.label}#${n}` : d.label;
      if (d.type === "start") { run = d.value ?? 0; return { key, label: d.label, start: true, type: "total" as const, delta: run, from: 0, to: run, i }; }
      if (d.type === "total") return { key, label: d.label, type: "total" as const, delta: run, from: 0, to: run, i };
      const from = run; run += d.value ?? 0;
      return { key, label: d.label, type: "delta" as const, delta: d.value ?? 0, from, to: run, i };
    });
  }, [data]);

  const horizontal = orientation === "horizontal" || (orientation === "auto" && width > 0 && width < 520);
  const up = scheme === "cn" ? "var(--destructive)" : "var(--success)";
  const down = scheme === "cn" ? "var(--success)" : "var(--destructive)";
  const fill = (b: Bar) => (b.type === "total" ? "var(--chart-1)" : b.delta >= 0 ? up : down);

  // 坐标
  const pad = horizontal ? { l: Math.min(120, 16 + Math.max(...bars.map((b) => b.label.length)) * 12), r: 56, t: 8, b: 24 } : { l: 48, r: 12, t: 24, b: 40 };
  const h = horizontal ? Math.max(height, bars.length * 34 + pad.t + pad.b) : height;
  const lo = Math.min(0, ...bars.map((b) => Math.min(b.from, b.to)));
  const hi = Math.max(0, ...bars.map((b) => Math.max(b.from, b.to)));
  const val = scaleLinear().domain([lo, hi]).nice(5).range(horizontal ? [pad.l, Math.max(pad.l + 1, width - pad.r)] : [h - pad.b, pad.t]);
  const band = scaleBand<string>().domain(bars.map((b) => b.key)).range(horizontal ? [pad.t, h - pad.b] : [pad.l, Math.max(pad.l + 1, width - pad.r)]).paddingInner(0.28).paddingOuter(0.14);
  // 横向时按可用宽度定刻度数, 窄屏不挤
  const ticks = horizontal ? val.ticks(Math.max(2, Math.floor((width - pad.l - pad.r) / 64))) : val.ticks(5);
  const bw = band.bandwidth();
  const fmtSigned = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${format(Math.abs(v))}`;

  // 交互
  const [hover, setHover] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const active = hover ?? focus;
  const activeBar = bars.find((b) => b.key === active);
  const tabKey = focus && bars.some((b) => b.key === focus) ? focus : bars[0]?.key;
  const refs = useRef(new Map<string, SVGGElement>());
  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = bars.findIndex((b) => b.key === tabKey);
    const next = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1, Home: -Infinity, End: Infinity }[e.key];
    if (next == null || i < 0) return;
    e.preventDefault();
    const j = Math.max(0, Math.min(bars.length - 1, Number.isFinite(next) ? i + next : next > 0 ? bars.length - 1 : 0));
    const k = bars[j].key; setFocus(k); refs.current.get(k)?.focus();
  };

  const t = reduced ? { duration: 0 } : spring.smooth;
  const rect = (b: Bar) => {
    const a = val(Math.min(b.from, b.to)), z = val(Math.max(b.from, b.to));
    const len = Math.max(1, Math.abs(z - a));
    const pos = band(b.key) ?? 0;
    return horizontal ? { x: a, y: pos, width: len, height: bw } : { x: pos, y: z, width: bw, height: len };
  };
  // 新柱子从它的起点台阶长出来, 退场时缩回终点
  const seed = (b: Bar) => {
    const r = rect(b), base = val(b.from);
    return horizontal ? { ...r, x: base, width: 0 } : { ...r, y: base, height: 0 };
  };

  const tip = activeBar && (() => {
    const r = rect(activeBar);
    const cx = r.x + r.width / 2, top = r.y;
    return { x: horizontal ? Math.min(width - 8, r.x + r.width + 8) : cx, y: horizontal ? r.y + r.height / 2 : top, b: activeBar };
  })();

  return (
    <div ref={box} className={cn("relative w-full", className)}>
      {width > 0 && (
        <svg width={width} height={h} role="group" aria-roledescription="瀑布图" aria-label={`${ariaLabel}，${bars.length} 项。方向键逐项查看`} className="block overflow-visible" onKeyDown={onKeyDown}>
          {/* 网格 + 数值轴 */}
          <g aria-hidden className="text-[11px]">
            {ticks.map((v) => {
              const p = val(v);
              return horizontal ? (
                <m.g key={v} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                  <line x1={p} x2={p} y1={pad.t} y2={h - pad.b} stroke="var(--border)" strokeDasharray={v === 0 ? undefined : "2 3"} />
                  <text x={p} y={h - pad.b + 16} textAnchor="middle" className="fill-muted-foreground font-mono tabular-nums">{format(v)}</text>
                </m.g>
              ) : (
                <m.g key={v} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                  <line x1={pad.l} x2={width - pad.r} y1={p} y2={p} stroke="var(--border)" strokeDasharray={v === 0 ? undefined : "2 3"} />
                  <text x={pad.l - 8} y={p} dy="0.32em" textAnchor="end" className="fill-muted-foreground font-mono tabular-nums">{format(v)}</text>
                </m.g>
              );
            })}
          </g>

          {/* 台阶连线 */}
          {connectors && (
            <g aria-hidden>
              <AnimatePresence initial={false}>
                {bars.slice(0, -1).map((b, i) => {
                  const n = bars[i + 1];
                  const level = val(b.to);
                  const s = (band(b.key) ?? 0) + bw, e = band(n.key) ?? 0;
                  const g = horizontal ? { x1: level, x2: level, y1: s, y2: e } : { x1: s, x2: e, y1: level, y2: level };
                  return (
                    <m.line key={`c-${b.key}`} initial={{ opacity: 0, ...g }} animate={{ opacity: 1, ...g }} exit={{ opacity: 0 }} transition={{ ...t, opacity: { duration: 0.2 } }}
                      stroke="var(--muted-foreground)" strokeOpacity={0.5} strokeDasharray="3 3" />
                  );
                })}
              </AnimatePresence>
            </g>
          )}

          {/* 柱子 */}
          <g>
            <AnimatePresence initial={!reduced}>
              {bars.map((b) => {
                const r = rect(b);
                const dim = active && active !== b.key;
                const label = b.type === "total" ? format(b.to) : fmtSigned(b.delta);
                const lp = horizontal
                  ? { x: (b.delta >= 0 || b.type === "total" ? r.x + r.width + 6 : r.x - 6), y: r.y + r.height / 2 }
                  : { x: r.x + r.width / 2, y: (b.delta >= 0 || b.type === "total" ? r.y - 6 : r.y + r.height + 13) };
                return (
                  <m.g
                    key={b.key}
                    ref={(el: SVGGElement | null) => { if (el) refs.current.set(b.key, el); else refs.current.delete(b.key); }}
                    tabIndex={b.key === tabKey ? 0 : -1}
                    role="img"
                    aria-label={`${b.label}，${b.start ? `期初 ${format(b.to)}` : b.type === "total" ? `合计 ${format(b.to)}` : `${b.delta >= 0 ? "增加" : "减少"} ${format(Math.abs(b.delta))}，累计 ${format(b.to)}`}${unit}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: dim ? 0.35 : 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onPointerEnter={() => setHover(b.key)}
                    onPointerLeave={() => setHover((k) => (k === b.key ? null : k))}
                    onFocus={() => setFocus(b.key)}
                    onBlur={() => setFocus((k) => (k === b.key ? null : k))}
                    className="cursor-default outline-none focus-visible:[&>rect:first-of-type]:stroke-[var(--ring)]"
                  >
                    <m.rect initial={reduced ? r : seed(b)} animate={r} exit={reduced ? r : seed({ ...b, from: b.to })} transition={t} rx={3} fill={fill(b)} stroke="transparent" strokeWidth={2}
                      fillOpacity={b.type === "total" ? 1 : 0.88} />
                    {/* 扩大命中区, 细柱子也好悬停 */}
                    <rect {...(horizontal ? { x: pad.l, y: r.y, width: Math.max(0, width - pad.l - pad.r), height: r.height } : { x: r.x, y: pad.t, width: r.width, height: Math.max(0, h - pad.t - pad.b) })} fill="transparent" />
                    {showValues && (
                      <m.text initial={{ opacity: 0, ...lp }} animate={{ opacity: 1, ...lp }} exit={{ opacity: 0 }} transition={{ ...t, opacity: { duration: 0.2, delay: reduced ? 0 : 0.12 } }}
                        textAnchor={horizontal ? (b.delta >= 0 || b.type === "total" ? "start" : "end") : "middle"} dy={horizontal ? "0.32em" : undefined}
                        className={cn("pointer-events-none font-mono text-[11px] tabular-nums", b.type === "total" ? "fill-foreground font-semibold" : "fill-muted-foreground")}>
                        {label}
                      </m.text>
                    )}
                    {/* 类目标签 */}
                    <m.text initial={false}
                      animate={horizontal ? { x: pad.l - 8, y: r.y + r.height / 2 } : { x: r.x + r.width / 2, y: h - pad.b + 18 }}
                      transition={t}
                      textAnchor={horizontal ? "end" : "middle"} dy={horizontal ? "0.32em" : undefined}
                      className={cn("pointer-events-none text-[12px]", b.type === "total" ? "fill-foreground font-medium" : "fill-muted-foreground")}>
                      {!horizontal && band.step() - 4 < b.label.length * 12 ? `${b.label.slice(0, Math.max(1, Math.floor((band.step() - 4) / 12) - 1))}…` : b.label}
                    </m.text>
                  </m.g>
                );
              })}
            </AnimatePresence>
          </g>
        </svg>
      )}

      {/* 提示 */}
      <div
        aria-hidden
        className={cn("pointer-events-none absolute top-0 left-0 z-10 min-w-36 rounded-lg border bg-popover/95 px-3 py-2 text-xs shadow-float backdrop-blur transition-opacity duration-150", tip ? "opacity-100" : "opacity-0")}
        style={tip ? { transform: horizontal ? `translate(${Math.min(tip.x, width - 150)}px, ${tip.y - 30}px)` : `translate(${Math.max(4, Math.min(width - 150, tip.x - 72))}px, ${Math.max(0, tip.y - 92)}px)` } : undefined}
      >
        {tip && (
          <>
            <p className="font-medium">{tip.b.label}</p>
            {tip.b.type === "delta" ? (
              <>
                <p className="mt-1 flex justify-between gap-4 text-muted-foreground"><span>本项</span><span className="font-mono tabular-nums" style={{ color: fill(tip.b) }}>{fmtSigned(tip.b.delta)}{unit}</span></p>
                <p className="flex justify-between gap-4 text-muted-foreground"><span>累计</span><span className="font-mono text-foreground tabular-nums">{format(tip.b.to)}{unit}</span></p>
                {bars[0] && bars[0].to !== 0 && tip.b.i > 0 && <p className="flex justify-between gap-4 text-muted-foreground"><span>占期初</span><span className="font-mono tabular-nums">{((tip.b.delta / bars[0].to) * 100).toFixed(1)}%</span></p>}
              </>
            ) : (
              <p className="mt-1 flex justify-between gap-4 text-muted-foreground"><span>{tip.b.start ? "期初" : "合计"}</span><span className="font-mono font-semibold text-foreground tabular-nums">{format(tip.b.to)}{unit}</span></p>
            )}
          </>
        )}
      </div>

      <table className="sr-only">
        <caption>{ariaLabel}</caption>
        <thead><tr><th scope="col">项目</th><th scope="col">增减</th><th scope="col">累计</th></tr></thead>
        <tbody>{bars.map((b) => <tr key={b.key}><td>{b.label}</td><td>{b.start ? "期初" : b.type === "total" ? "合计" : fmtSigned(b.delta)}</td><td>{format(b.to)}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
