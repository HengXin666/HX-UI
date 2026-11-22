import { AnimatePresence, m } from "motion/react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "@/motion/use-reduced-motion";
import { spring } from "@/motion/presets";
import { cn } from "@/lib/utils";

export interface DepthLevel {
  price: number;
  /** 这一档的挂单量 */
  size: number;
}

export interface DepthChartProps {
  /** 买盘, 顺序随意 (内部按价格从高到低) */
  bids: DepthLevel[];
  /** 卖盘, 顺序随意 (内部按价格从低到高) */
  asks: DepthLevel[];
  /** cn = 买红卖绿 (默认), us = 买绿卖红 */
  scheme?: "cn" | "us";
  precision?: number;
  formatSize?: (v: number) => string;
  height?: number;
  /** 读屏名称 */
  ariaLabel?: string;
  className?: string;
}

interface Step { key: string; side: "bid" | "ask"; price: number; size: number; cum: number; x0: number; x1: number }

const PAD = { l: 8, r: 56, t: 12, b: 24 };
const compact = new Intl.NumberFormat("zh-CN", { notation: "compact", maximumFractionDigits: 1 });

/**
 * 深度图: 买卖盘的累计挂单量, 中间是盘口价差. 每一档是一级台阶, 按价格配对:
 * 新挂的档位从地面升起, 撤掉的档位落回地面, 挂单量变化时台阶高度平滑过渡, 其余台阶滑到新的累计高度.
 * 悬停读出该价位的累计量; 读屏读摘要和每档明细表.
 */
export function DepthChart({
  bids, asks, scheme = "cn", precision = 2, formatSize = (v) => compact.format(v), height = 320, ariaLabel = "深度图", className,
}: DepthChartProps) {
  const reduced = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width)));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  const [hx, setHx] = useState<number | null>(null);

  const bidC = scheme === "cn" ? "var(--destructive)" : "var(--success)";
  const askC = scheme === "cn" ? "var(--success)" : "var(--destructive)";
  const fmt = (v: number) => v.toFixed(precision);

  const b = useMemo(() => [...bids].sort((x, y) => y.price - x.price), [bids]);
  const a = useMemo(() => [...asks].sort((x, y) => x.price - y.price), [asks]);
  const bestBid = b[0]?.price ?? 0, bestAsk = a[0]?.price ?? bestBid;
  const mid = (bestBid + bestAsk) / 2;
  // 横轴以中间价对称, 两边取更远的那一侧
  const half = Math.max(mid - (b[b.length - 1]?.price ?? mid), (a[a.length - 1]?.price ?? mid) - mid, mid * 0.001) * 1.04;
  const lo = mid - half, hi = mid + half;
  const plotW = Math.max(1, width - PAD.l - PAD.r);
  const x = (p: number) => PAD.l + ((p - lo) / (hi - lo)) * plotW;
  const pFromX = (px: number) => lo + ((px - PAD.l) / plotW) * (hi - lo);

  const steps: Step[] = useMemo(() => {
    const out: Step[] = [];
    let cum = 0;
    b.forEach((l, i) => { cum += l.size; out.push({ key: `b${l.price}`, side: "bid", price: l.price, size: l.size, cum, x0: b[i + 1]?.price ?? lo, x1: l.price }); });
    cum = 0;
    a.forEach((l, i) => { cum += l.size; out.push({ key: `a${l.price}`, side: "ask", price: l.price, size: l.size, cum, x0: l.price, x1: a[i + 1]?.price ?? hi }); });
    return out;
  }, [b, a, lo, hi]);
  const cMax = Math.max(1, ...steps.map((s) => s.cum));
  const plotH = height - PAD.t - PAD.b;
  const y = (v: number) => PAD.t + plotH - (v / (cMax * 1.08)) * plotH;
  const base = PAD.t + plotH;
  const yTicks = [0.25, 0.5, 0.75, 1].map((k) => k * cMax);
  const xTicks = [lo + half * 0.2, mid - half * 0.5, mid, mid + half * 0.5, hi - half * 0.2];
  const t = reduced ? { duration: 0 } : spring.smooth;

  // 悬停: 找到该价位所在台阶
  const hover = hx == null ? null : (() => {
    const p = pFromX(hx);
    const side = p < mid ? "bid" : "ask";
    const s = steps.find((st) => st.side === side && p >= Math.min(st.x0, st.x1) && p <= Math.max(st.x0, st.x1));
    return s ? { p, s } : null;
  })();
  const bidSum = b.reduce((s, l) => s + l.size, 0), askSum = a.reduce((s, l) => s + l.size, 0);

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-2 flex min-h-5 flex-wrap items-baseline gap-x-4 gap-y-1 font-mono text-xs tabular-nums" aria-hidden>
        <span>买一 <span style={{ color: bidC }}>{fmt(bestBid)}</span></span>
        <span>卖一 <span style={{ color: askC }}>{fmt(bestAsk)}</span></span>
        <span className="text-muted-foreground">价差 {fmt(bestAsk - bestBid)}</span>
        <span className="text-muted-foreground">委比 {(((bidSum - askSum) / Math.max(1, bidSum + askSum)) * 100).toFixed(1)}%</span>
      </div>
      <div ref={box} className="relative" style={{ height }}>
        <table className="sr-only">
          <caption>{ariaLabel}：买一 {fmt(bestBid)}，卖一 {fmt(bestAsk)}，买盘合计 {formatSize(bidSum)}，卖盘合计 {formatSize(askSum)}</caption>
          <thead><tr><th scope="col">方向</th><th scope="col">价格</th><th scope="col">挂单量</th><th scope="col">累计</th></tr></thead>
          <tbody>{steps.map((s) => <tr key={s.key}><td>{s.side === "bid" ? "买" : "卖"}</td><td>{fmt(s.price)}</td><td>{formatSize(s.size)}</td><td>{formatSize(s.cum)}</td></tr>)}</tbody>
        </table>
        {width > 0 && (
          <svg width={width} height={height} aria-hidden className="block cursor-crosshair touch-none" data-steps={steps.length}
            onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setHx(e.clientX - r.left); }} onPointerLeave={() => setHx(null)}>
            {yTicks.map((v) => (
              <g key={v}>
                <line x1={PAD.l} x2={PAD.l + plotW} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeDasharray="2 4" strokeOpacity={0.6} />
                <text x={PAD.l + plotW + 6} y={y(v)} dy="0.32em" className="fill-muted-foreground font-mono text-[10px] tabular-nums">{formatSize(v)}</text>
              </g>
            ))}
            {xTicks.map((p, i) => (
              <text key={i} x={x(p)} y={height - PAD.b / 2} dy="0.32em" textAnchor="middle" className="fill-muted-foreground font-mono text-[10px] tabular-nums">{fmt(p)}</text>
            ))}
            <line x1={PAD.l} x2={PAD.l + plotW} y1={base + 0.5} y2={base + 0.5} stroke="var(--border)" />

            <AnimatePresence initial={!reduced}>
              {steps.map((s) => {
                const c = s.side === "bid" ? bidC : askC;
                const xa = x(Math.min(s.x0, s.x1)), xb = x(Math.max(s.x0, s.x1));
                const r = { x: xa, width: Math.max(0.5, xb - xa), y: y(s.cum), height: Math.max(0, base - y(s.cum)) };
                const flat = { ...r, y: base, height: 0 };
                const lit = hover?.s.key === s.key;
                return (
                  <m.g key={s.key} data-k={s.key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    <m.rect initial={reduced ? r : flat} animate={r} exit={reduced ? r : flat} transition={t} fill={c} fillOpacity={lit ? 0.32 : 0.16} />
                    <m.line initial={reduced ? { x1: r.x, x2: r.x + r.width, y1: r.y, y2: r.y } : { x1: r.x, x2: r.x + r.width, y1: base, y2: base }}
                      animate={{ x1: r.x, x2: r.x + r.width, y1: r.y, y2: r.y }} exit={reduced ? undefined : { y1: base, y2: base }} transition={t} stroke={c} strokeWidth={1.5} />
                  </m.g>
                );
              })}
            </AnimatePresence>

            {/* 中间价 */}
            <m.g initial={false} animate={{ x: x(mid) }} transition={t}>
              <line x1={0} x2={0} y1={PAD.t} y2={base} stroke="var(--muted-foreground)" strokeDasharray="3 3" />
              <text x={0} y={PAD.t} textAnchor="middle" className="fill-foreground font-mono text-[10px] tabular-nums">{fmt(mid)}</text>
            </m.g>

            {hover && (
              <g pointerEvents="none">
                <line x1={hx!} x2={hx!} y1={PAD.t} y2={base} stroke="var(--muted-foreground)" strokeDasharray="3 3" />
                <circle cx={hx!} cy={y(hover.s.cum)} r={3.5} fill="var(--background)" stroke={hover.s.side === "bid" ? bidC : askC} strokeWidth={1.5} />
                {(() => {
                  const left = hx! > width * 0.6;
                  const w = 132;
                  const tx = left ? hx! - w - 10 : hx! + 10;
                  const ty = Math.max(PAD.t, Math.min(base - 52, y(hover.s.cum) - 26));
                  return (
                    <g transform={`translate(${tx} ${ty})`}>
                      <rect width={w} height={50} rx={6} fill="var(--popover)" stroke="var(--border)" />
                      <text x={8} y={18} className="fill-foreground font-mono text-[11px] tabular-nums">{hover.s.side === "bid" ? "买" : "卖"} {fmt(hover.s.price)}</text>
                      <text x={8} y={36} className="fill-muted-foreground font-mono text-[11px] tabular-nums">累计 {formatSize(hover.s.cum)}</text>
                    </g>
                  );
                })()}
              </g>
            )}
          </svg>
        )}
      </div>
    </div>
  );
}
