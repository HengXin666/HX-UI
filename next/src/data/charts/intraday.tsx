import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "@/motion/use-reduced-motion";
import { cn } from "@/lib/utils";

export interface IntradayPoint {
  /** 时间标签, 如 "09:31" */
  t: string;
  price: number;
  volume?: number;
}

export interface IntradayProps {
  /** 已经走过的分钟, 按时间顺序; 盘中只有前一段 */
  data: IntradayPoint[];
  /** 昨收, 涨跌幅和纵轴中线都以它为准 */
  prevClose: number;
  /** 一整天的分钟数, 默认 A 股 241 (09:30–11:30, 13:01–15:00) */
  sessionLength?: number;
  /** 横轴刻度: [下标, 文字] */
  timeTicks?: [number, string][];
  /** cn = 红涨绿跌 (默认), us = 绿涨红跌 */
  scheme?: "cn" | "us";
  /** 均价线 (成交额 / 成交量 累计) */
  showAvg?: boolean;
  showVolume?: boolean;
  precision?: number;
  height?: number;
  /** 证券名, 读屏用 */
  name?: string;
  className?: string;
}

const AXIS_L = 52;
const AXIS_R = 52;
const AXIS_H = 20;
const GAP = 8;
const A_SHARE_TICKS: [number, string][] = [[0, "09:30"], [60, "10:30"], [120, "11:30/13:00"], [180, "14:00"], [240, "15:00"]];
const compact = new Intl.NumberFormat("zh-CN", { notation: "compact", maximumFractionDigits: 1 });

/**
 * 分时图: 当天每分钟的价格线 + 均价线 + 成交量, 纵轴以昨收为中线上下对称, 右侧是涨跌幅.
 * 推送新的一分钟时线条往右长一格 (路径命令数固定, 用 CSS d 过渡), 新的量柱从底部长出; 最新价跳动时线尾平滑移动.
 * 十字光标和方向键逐分钟查看.
 */
export function Intraday({
  data, prevClose, sessionLength = 241, timeTicks = A_SHARE_TICKS, scheme = "cn", showAvg = true, showVolume = true,
  precision = 2, height = 360, name = "分时图", className,
}: IntradayProps) {
  const reduced = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width)));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  const [cursor, setCursor] = useState<number | null>(null);

  const up = scheme === "cn" ? "var(--destructive)" : "var(--success)";
  const down = scheme === "cn" ? "var(--success)" : "var(--destructive)";
  const fmt = (v: number) => v.toFixed(precision);
  const pct = (v: number) => `${v >= prevClose ? "+" : ""}${(((v - prevClose) / prevClose) * 100).toFixed(2)}%`;
  const tone = (v: number) => (v > prevClose ? up : v < prevClose ? down : "var(--muted-foreground)");

  // 均价: 累计成交额 / 累计成交量 (没有量时按等权)
  const avg = useMemo(() => {
    let amt = 0, vol = 0;
    return data.map((d) => { const v = d.volume ?? 1; amt += d.price * v; vol += v; return amt / vol; });
  }, [data]);

  const n = data.length;
  const plotW = Math.max(0, width - AXIS_L - AXIS_R);
  const mainH = (height - AXIS_H - (showVolume ? GAP : 0)) * (showVolume ? 0.72 : 1);
  const volTop = mainH + GAP, volH = showVolume ? height - AXIS_H - volTop : 0;
  const xOf = (i: number) => AXIS_L + (i / Math.max(1, sessionLength - 1)) * plotW;

  // 纵轴: 昨收居中, 上下对称, 至少 ±1%
  let dev = prevClose * 0.01;
  data.forEach((d, i) => { dev = Math.max(dev, Math.abs(d.price - prevClose), showAvg ? Math.abs(avg[i] - prevClose) : 0); });
  dev *= 1.12;
  const yP = (v: number) => mainH / 2 - ((v - prevClose) / dev) * (mainH / 2 - 4);
  const ticks = [prevClose + dev * 0.9, prevClose + dev * 0.45, prevClose, prevClose - dev * 0.45, prevClose - dev * 0.9];
  const vMax = Math.max(1, ...data.map((d) => d.volume ?? 0));

  // 路径命令数固定为整天的分钟数: 还没走到的分钟收在最后一个点上, 这样追加 / 撤回 / 跳动都能用 CSS d 过渡
  const pathOf = (vals: number[]) => {
    if (!vals.length) return "";
    let d = "";
    for (let i = 0; i < sessionLength; i++) {
      const k = Math.min(i, vals.length - 1);
      d += `${i ? "L" : "M"}${xOf(k).toFixed(1)} ${yP(vals[k]).toFixed(1)}`;
    }
    return d;
  };
  const prices = data.map((d) => d.price);
  const line = pathOf(prices);
  const area = line ? `${line}L${xOf(n - 1).toFixed(1)} ${mainH.toFixed(1)}L${xOf(0).toFixed(1)} ${mainH.toFixed(1)}Z` : "";
  const avgLine = showAvg ? pathOf(avg) : "";
  const last = data[n - 1];
  const barW = Math.max(1, (plotW / sessionLength) * 0.7);
  // 前 n0 根是首屏就有的, 不做长出动画
  const n0 = useRef(n);

  const ci = cursor ?? n - 1;
  const cur = data[ci];
  const pointer = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left - AXIS_L) / Math.max(1, plotW)) * (sessionLength - 1));
    setCursor(Math.max(0, Math.min(n - 1, i)));
  };
  const onKey = (e: React.KeyboardEvent) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, Home: -Infinity, End: Infinity }[e.key];
    if (step == null || !n) return;
    e.preventDefault();
    setCursor((c) => { const b = c ?? n - 1; return Math.max(0, Math.min(n - 1, Number.isFinite(step) ? b + step : step > 0 ? n - 1 : 0)); });
  };
  const grad = useRef(`hx-intraday-${Math.random().toString(36).slice(2, 8)}`).current;
  const lastUp = last ? last.price >= prevClose : true;

  return (
    <div className={cn("w-full", className)}>
      {/* 读数 */}
      <div className="mb-2 flex min-h-5 flex-wrap items-baseline gap-x-4 gap-y-1 font-mono text-xs tabular-nums" aria-hidden>
        {cur && (
          <>
            <span className="text-muted-foreground">{cur.t}</span>
            <span>价 <span style={{ color: tone(cur.price) }}>{fmt(cur.price)}</span></span>
            <span style={{ color: tone(cur.price) }}>{pct(cur.price)}</span>
            {showAvg && <span>均 <span className="text-[var(--chart-4)]">{fmt(avg[ci])}</span></span>}
            {cur.volume != null && <span className="text-muted-foreground">量 {compact.format(cur.volume)}</span>}
          </>
        )}
      </div>
      <div
        ref={box}
        role="group"
        tabIndex={0}
        aria-label={`${name}，昨收 ${fmt(prevClose)}，已走 ${n} 分钟${last ? `，最新 ${fmt(last.price)}，${pct(last.price)}` : ""}。左右方向键逐分钟查看。`}
        onKeyDown={onKey}
        onBlur={() => setCursor(null)}
        className="relative rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ height }}
      >
        <span className="sr-only" aria-live="polite">{cursor != null && cur ? `${cur.t}，价 ${fmt(cur.price)}，${pct(cur.price)}${showAvg ? `，均价 ${fmt(avg[ci])}` : ""}${cur.volume != null ? `，量 ${compact.format(cur.volume)}` : ""}` : ""}</span>
        {width > 0 && (
          <svg width={width} height={height} aria-hidden className="block cursor-crosshair touch-none" data-n={n}
            onPointerMove={pointer} onPointerLeave={() => setCursor(null)}>
            <defs>
              <linearGradient id={grad} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            {/* 网格 */}
            {ticks.map((v, i) => (
              <g key={i}>
                <line x1={AXIS_L} x2={AXIS_L + plotW} y1={yP(v)} y2={yP(v)} stroke="var(--border)" strokeDasharray={i === 2 ? "4 3" : "2 4"} strokeOpacity={i === 2 ? 1 : 0.6} />
                <text x={AXIS_L - 6} y={yP(v)} dy="0.32em" textAnchor="end" className="font-mono text-[10px] tabular-nums" fill={i === 2 ? "var(--muted-foreground)" : tone(v)}>{fmt(v)}</text>
                <text x={AXIS_L + plotW + 6} y={yP(v)} dy="0.32em" className="font-mono text-[10px] tabular-nums" fill={i === 2 ? "var(--muted-foreground)" : tone(v)}>{pct(v)}</text>
              </g>
            ))}
            {timeTicks.map(([i, t], k) => (
              <g key={t}>
                <line x1={xOf(i)} x2={xOf(i)} y1={0} y2={height - AXIS_H} stroke="var(--border)" strokeOpacity={0.4} strokeDasharray="2 4" />
                <text x={xOf(i)} y={height - AXIS_H / 2} dy="0.32em" textAnchor={k === 0 ? "start" : k === timeTicks.length - 1 ? "end" : "middle"} className="fill-muted-foreground font-mono text-[10px]">{t}</text>
              </g>
            ))}
            {showVolume && <line x1={AXIS_L} x2={AXIS_L + plotW} y1={volTop - GAP / 2} y2={volTop - GAP / 2} stroke="var(--border)" />}

            {/* 价格面积 + 线 + 均价 */}
            {area && <path className="hx-d" style={{ d: `path("${area}")` } as React.CSSProperties} fill={`url(#${grad})`} />}
            {line && <path className="hx-d" style={{ d: `path("${line}")` } as React.CSSProperties} fill="none" stroke="var(--chart-1)" strokeWidth={1.5} strokeLinejoin="round" />}
            {avgLine && <path className="hx-d" style={{ d: `path("${avgLine}")` } as React.CSSProperties} fill="none" stroke="var(--chart-4)" strokeWidth={1.2} />}

            {/* 最新价 */}
            {last && (
              <g>
                <circle className="hx-tick" style={{ cx: xOf(n - 1), cy: yP(last.price), transition: reduced ? "none" : "cx 220ms cubic-bezier(0.22,1,0.36,1), cy 220ms cubic-bezier(0.22,1,0.36,1)" } as React.CSSProperties} r={3} fill={lastUp ? up : down} />
                {!reduced && n < sessionLength && (
                  <circle style={{ cx: xOf(n - 1), cy: yP(last.price), transition: "cx 220ms, cy 220ms" } as React.CSSProperties} r={3} fill="none" stroke={lastUp ? up : down} className="hx-pulse-ring" />
                )}
              </g>
            )}

            {/* 成交量 */}
            {showVolume && data.map((d, i) => {
              const h = ((d.volume ?? 0) / vMax) * volH * 0.92;
              const dir = i === 0 ? d.price >= prevClose : d.price >= data[i - 1].price;
              return (
                <rect key={i} className={cn("hx-tick", i >= n0.current && "hx-grow-up")} x={xOf(i) - barW / 2} width={barW}
                  style={{ y: volTop + volH - h, height: Math.max(0.5, h) } as React.CSSProperties} fill={dir ? up : down} fillOpacity={0.7} />
              );
            })}

            {/* 十字光标 */}
            {cursor != null && cur && (
              <g pointerEvents="none">
                <line x1={xOf(cursor)} x2={xOf(cursor)} y1={0} y2={height - AXIS_H} stroke="var(--muted-foreground)" strokeDasharray="3 3" />
                <line x1={AXIS_L} x2={AXIS_L + plotW} y1={yP(cur.price)} y2={yP(cur.price)} stroke="var(--muted-foreground)" strokeDasharray="3 3" />
                <circle cx={xOf(cursor)} cy={yP(cur.price)} r={3.5} fill="var(--background)" stroke="var(--chart-1)" strokeWidth={1.5} />
              </g>
            )}
          </svg>
        )}
      </div>
    </div>
  );
}

/** A 股一整天的分钟标签: 09:30–11:30, 13:01–15:00, 共 241 个 */
export function aShareMinutes() {
  const out: string[] = [];
  const push = (h: number, m: number) => out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  for (let k = 0; k <= 120; k++) { const t = 9 * 60 + 30 + k; push(Math.floor(t / 60), t % 60); }
  for (let k = 1; k <= 120; k++) { const t = 13 * 60 + k; push(Math.floor(t / 60), t % 60); }
  return out;
}
