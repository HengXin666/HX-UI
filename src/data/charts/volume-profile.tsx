"use client";

import { AnimatePresence, m } from "motion/react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "@/motion/use-reduced-motion";
import { spring } from "@/motion/presets";
import { cn } from "@/lib/utils";
import { valueAreaOf } from "./helpers";

export interface ProfileBin {
  /** 价格档 (档位下沿) */
  price: number;
  /** 该价位上的成交量 / 筹码量 */
  volume: number;
}

export interface VolumeProfileProps {
  bins: ProfileBin[];
  /** 档位宽度 (价格), 默认取相邻档位的最小间距 */
  step?: number;
  /** 现价: 低于它的是获利盘, 高于它的是套牢盘 */
  price: number;
  /** 价值区 (默认 70% 的量所在的最窄区间), 0 关闭 */
  valueArea?: number;
  /** cn = 获利红 / 套牢绿 (默认), us = 获利绿 / 套牢红 */
  scheme?: "cn" | "us";
  precision?: number;
  formatVolume?: (v: number) => string;
  height?: number;
  ariaLabel?: string;
  className?: string;
}

const PAD = { l: 52, r: 12, t: 8, b: 8 };
const compact = new Intl.NumberFormat("zh-CN", { notation: "compact", maximumFractionDigits: 1 });

export { valueAreaOf };

/**
 * 筹码分布 / 成交量分布: 每个价位上堆了多少量, 横向柱子. 现价以下是获利盘, 以上是套牢盘;
 * 标出 POC (量最大的价位) 和价值区. 柱子按价位配对: 新价位从左侧长出, 消失的价位缩回, 量变化时长度过渡,
 * 现价移动时分界线滑过去、颜色跟着翻.
 */
export function VolumeProfile({
  bins, step: stepProp, price, valueArea = 0.7, scheme = "cn", precision = 2, formatVolume = (v) => compact.format(v),
  height = 360, ariaLabel = "筹码分布", className,
}: VolumeProfileProps) {
  const reduced = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width)));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  const [hover, setHover] = useState<number | null>(null);

  const profit = scheme === "cn" ? "var(--destructive)" : "var(--success)";
  const loss = scheme === "cn" ? "var(--success)" : "var(--destructive)";
  const fmt = (v: number) => v.toFixed(precision);

  const sorted = useMemo(() => [...bins].filter((b) => b.volume > 0).sort((a, b) => a.price - b.price), [bins]);
  const step = stepProp ?? Math.max(1e-9, Math.min(...sorted.slice(1).map((b, i) => b.price - sorted[i].price), Infinity) || 1);
  const lo = Math.min(sorted[0]?.price ?? price, price), hi = Math.max((sorted[sorted.length - 1]?.price ?? price) + step, price);
  const span = hi - lo || 1;
  const plotH = height - PAD.t - PAD.b;
  const y = (p: number) => PAD.t + plotH - ((p - lo) / span) * plotH;
  const bh = Math.max(1, (step / span) * plotH - 1);
  const vMax = Math.max(1, ...sorted.map((b) => b.volume));
  const plotW = Math.max(1, width - PAD.l - PAD.r - 120);
  const w = (v: number) => (v / vMax) * plotW;
  const total = sorted.reduce((s, b) => s + b.volume, 0);
  // 获利比例: 现价以下的量 (所在档按比例拆)
  const below = sorted.reduce((s, b) => s + (b.price + step <= price ? b.volume : b.price < price ? (b.volume * (price - b.price)) / step : 0), 0);
  const ratio = total ? below / total : 0;
  const avgCost = total ? sorted.reduce((s, b) => s + (b.price + step / 2) * b.volume, 0) / total : price;
  const va = valueArea > 0 ? valueAreaOf(sorted, valueArea) : null;
  const t = reduced ? { duration: 0 } : spring.smooth;
  const yTicks = (() => { const n = Math.max(3, Math.floor(plotH / 48)); return Array.from({ length: n + 1 }, (_, i) => lo + (span * i) / n); })();
  const hb = sorted.find((b) => b.price === hover);

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-2 flex min-h-5 flex-wrap items-baseline gap-x-4 gap-y-1 font-mono text-xs tabular-nums" aria-hidden>
        <span>获利比例 <span style={{ color: profit }}>{(ratio * 100).toFixed(1)}%</span></span>
        <span className="text-muted-foreground">平均成本 {fmt(avgCost)}</span>
        {va && <span className="text-muted-foreground">POC {fmt(va.poc + step / 2)}</span>}
        {hb && <span>{fmt(hb.price)}–{fmt(hb.price + step)} <span className="text-muted-foreground">{formatVolume(hb.volume)} · {((hb.volume / total) * 100).toFixed(1)}%</span></span>}
      </div>
      <div ref={box} className="relative" style={{ height }}>
        <table className="sr-only">
          <caption>{ariaLabel}：现价 {fmt(price)}，获利比例 {(ratio * 100).toFixed(1)}%，平均成本 {fmt(avgCost)}{va ? `，价值区 ${fmt(va.lo)} 到 ${fmt(va.hi + step)}` : ""}</caption>
          <thead><tr><th scope="col">价位</th><th scope="col">量</th></tr></thead>
          <tbody>{[...sorted].reverse().map((b) => <tr key={b.price}><td>{fmt(b.price)}–{fmt(b.price + step)}</td><td>{formatVolume(b.volume)}</td></tr>)}</tbody>
        </table>
        {width > 0 && (
          <svg width={width} height={height} aria-hidden className="block" data-bins={sorted.length} onPointerLeave={() => setHover(null)}>
            {yTicks.map((p, i) => (
              <g key={i}>
                <line x1={PAD.l} x2={width - PAD.r} y1={y(p)} y2={y(p)} stroke="var(--border)" strokeDasharray="2 4" strokeOpacity={0.5} />
                <text x={PAD.l - 6} y={y(p)} dy="0.32em" textAnchor="end" className="fill-muted-foreground font-mono text-[10px] tabular-nums">{fmt(p)}</text>
              </g>
            ))}
            {/* 价值区底色 */}
            {va && (
              <m.rect initial={false} animate={{ y: y(va.hi + step), height: Math.max(0, y(va.lo) - y(va.hi + step)) }} transition={t}
                x={PAD.l} width={Math.max(0, width - PAD.l - PAD.r)} fill="var(--chart-1)" fillOpacity={0.06} />
            )}
            <AnimatePresence initial={!reduced}>
              {sorted.map((b) => {
                const isProfit = b.price + step / 2 <= price;
                const r = { x: PAD.l, y: y(b.price + step) + 0.5, width: Math.max(1, w(b.volume)), height: bh };
                const poc = va && b.price === va.poc;
                return (
                  <m.g key={b.price} data-k={b.price} initial={{ opacity: 0 }} animate={{ opacity: hover != null && hover !== b.price ? 0.45 : 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                    onPointerEnter={() => setHover(b.price)}>
                    <m.rect initial={reduced ? r : { ...r, width: 0 }} animate={r} fill={isProfit ? profit : loss} style={{ transition: "fill 200ms" }} exit={reduced ? undefined : { width: 0 }} transition={t}
                      fillOpacity={poc ? 0.95 : 0.6} rx={1} />
                    <rect x={PAD.l} y={r.y} width={Math.max(0, width - PAD.l - PAD.r)} height={bh} fill="transparent" />
                  </m.g>
                );
              })}
            </AnimatePresence>
            {/* POC 标注 */}
            {va && (
              <m.g initial={false} animate={{ y: y(va.poc + step / 2) }} transition={t} pointerEvents="none">
                <text x={PAD.l + w(Math.max(...sorted.filter((b) => b.price === va.poc).map((b) => b.volume))) + 6} y={0} dy="0.32em" className="fill-foreground font-mono text-[10px]">POC</text>
              </m.g>
            )}
            {/* 现价 */}
            <m.g initial={false} animate={{ y: y(price) }} transition={t} pointerEvents="none">
              <line x1={PAD.l} x2={width - PAD.r} y1={0} y2={0} stroke="var(--foreground)" strokeDasharray="4 3" strokeOpacity={0.7} />
              <rect x={width - PAD.r - 64} y={-9} width={64} height={18} rx={4} fill="var(--foreground)" />
              <text x={width - PAD.r - 32} y={0} dy="0.32em" textAnchor="middle" className="fill-background font-mono text-[10px] tabular-nums">{fmt(price)}</text>
            </m.g>
          </svg>
        )}
      </div>
    </div>
  );
}
