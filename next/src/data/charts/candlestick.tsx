import { m } from "motion/react";
import { Maximize2, Minus, Plus } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "@/motion/use-reduced-motion";
import { cn } from "@/lib/utils";
import { boll, kdj, macd, rsi, sma } from "./indicators";

export interface Candle {
  /** 时间标签, 如 2026-11-20 */
  t: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export type CandleOverlay = "ma" | "boll" | "none";
export type CandleSub = "macd" | "kdj" | "rsi" | "none";

interface CandlestickProps {
  data: Candle[];
  /** cn = 红涨绿跌 (默认), us = 绿涨红跌 */
  scheme?: "cn" | "us";
  /** 主图叠加: 均线 / 布林带 / 无 */
  overlay?: CandleOverlay;
  /** 均线周期 */
  ma?: number[];
  /** 副图指标 */
  sub?: CandleSub;
  showVolume?: boolean;
  /** 空心阳线 (国内行情软件常见画法) */
  hollow?: boolean;
  /** 初始显示多少根, 默认 90; 滚轮缩放, 拖动平移 */
  visible?: number;
  /** 价格小数位 */
  precision?: number;
  height?: number;
  /** 证券名, 读屏用 */
  name?: string;
  /** 右上角缩放按钮 */
  toolbar?: boolean;
  className?: string;
}

const MA_COLORS = ["var(--chart-3)", "var(--chart-4)", "var(--chart-2)", "var(--chart-5)", "var(--chart-1)"];
const AXIS_W = 60;
const AXIS_H = 22;
const GAP = 8;
const compact = new Intl.NumberFormat("zh-CN", { notation: "compact", maximumFractionDigits: 2 });

/** 价格轴的整齐刻度 */
function niceTicks(lo: number, hi: number, count: number) {
  const span = hi - lo || 1;
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((s) => s * mag).find((s) => s >= raw) ?? raw;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) out.push(+v.toFixed(10));
  return out;
}

/**
 * 专业 K 线图: 主图 (蜡烛 + 均线或布林带 + 最新价线 + 区间最高最低标注), 成交量, 副图 (MACD / KDJ / RSI),
 * 十字光标带价格和日期标签, 顶部 OHLC 读数. 滚轮缩放, 拖动平移, 方向键逐根查看. 自绘 SVG, 几百根也流畅.
 */
export function Candlestick({
  data, scheme = "cn", overlay = "ma", ma = [5, 10, 20, 60], sub = "macd", showVolume = true, hollow = false,
  visible = 90, precision = 2, height = 480, name = "K 线", toolbar = true, className,
}: CandlestickProps) {
  const uid = useId().replace(/:/g, "");
  const reduced = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const plotRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(0);
  const [view, setView] = useState({ end: data.length, count: Math.min(visible, data.length) });
  const [cursor, setCursor] = useState<{ i: number; y: number | null } | null>(null);
  const [live, setLive] = useState("");
  const drag = useRef<{ x: number; end: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const up = scheme === "cn" ? "var(--destructive)" : "var(--success)";
  const down = scheme === "cn" ? "var(--success)" : "var(--destructive)";
  const fmt = (v: number) => v.toFixed(precision);

  useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width)));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  // 换数据 (切周期) 时回到最新
  // 窄屏自动少显示几根, 每根至少约 6px
  const fit = width ? Math.min(visible, Math.max(24, Math.floor((width - AXIS_W) / 6))) : visible;
  const home = () => ({ end: data.length, count: Math.min(fit, data.length) });
  useEffect(() => { setView(home()); setCursor(null); }, [data, fit]); // eslint-disable-line react-hooks/exhaustive-deps

  // 指标在全量数据上算, 视窗只是切片, 平移时数值不跳
  const ind = useMemo(() => {
    const c = data.map((d) => d.close), h = data.map((d) => d.high), l = data.map((d) => d.low), v = data.map((d) => d.volume ?? 0);
    return {
      ma: ma.map((n) => sma(c, n)),
      boll: boll(c),
      volMa: [sma(v, 5), sma(v, 10)],
      macd: macd(c),
      kdj: kdj(h, l, c),
      rsi: [rsi(c, 6), rsi(c, 12), rsi(c, 24)],
    };
  }, [data, ma]);

  const clampView = (end: number, count: number) => {
    const c = Math.max(12, Math.min(data.length, Math.round(count)));
    return { count: c, end: Math.max(c, Math.min(data.length, Math.round(end))) };
  };
  const zoom = (factor: number, anchor = 1) => setView((v) => {
    const c = v.count * factor;
    const start = v.end - v.count;
    const pivot = start + v.count * anchor;
    return clampView(pivot + (c * (1 - anchor)), c);
  });

  // 滚轮缩放: 要 preventDefault, 只能手动挂非 passive 监听
  useEffect(() => {
    const el = plotRef.current; if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const anchor = Math.min(1, Math.max(0, (e.clientX - r.left) / Math.max(1, r.width - AXIS_W)));
      zoom(e.deltaY > 0 ? 1.12 : 1 / 1.12, anchor);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  });

  const start = view.end - view.count;
  const rows = data.slice(start, view.end);
  const plotW = Math.max(0, width - AXIS_W);
  const step = plotW / Math.max(1, view.count);
  const xOf = (k: number) => k * step + step / 2;
  const bodyW = Math.max(1, Math.min(18, step * 0.72));

  // 分区高度
  const panes = [{ id: "main", w: 0.6 }, ...(showVolume ? [{ id: "vol", w: 0.16 }] : []), ...(sub !== "none" ? [{ id: "sub", w: 0.24 }] : [])];
  const totalW = panes.reduce((s, p) => s + p.w, 0);
  const avail = height - AXIS_H - GAP * (panes.length - 1);
  let acc = 0;
  const pane = Object.fromEntries(panes.map((p) => { const h = (avail * p.w) / totalW; const top = acc; acc += h + GAP; return [p.id, { top, h }]; })) as Record<string, { top: number; h: number }>;

  // 主图值域
  const sliceN = (arr: (number | null)[]) => arr.slice(start, view.end);
  let lo = Infinity, hi = -Infinity;
  rows.forEach((d) => { lo = Math.min(lo, d.low); hi = Math.max(hi, d.high); });
  const overlays = overlay === "ma" ? ind.ma.map(sliceN) : overlay === "boll" ? [ind.boll.up, ind.boll.mid, ind.boll.low].map(sliceN) : [];
  overlays.forEach((a) => a.forEach((v) => { if (v != null) { lo = Math.min(lo, v); hi = Math.max(hi, v); } }));
  const pad = (hi - lo) * 0.08 || 1;
  const pLo = lo - pad, pHi = hi + pad;
  const main = pane.main;
  const yP = (v: number) => main.top + ((pHi - v) / (pHi - pLo)) * main.h;
  const pFromY = (y: number) => pHi - ((y - main.top) / main.h) * (pHi - pLo);
  const ticks = niceTicks(pLo, pHi, Math.max(3, Math.floor(main.h / 56)));

  const line = (vals: (number | null)[], y: (v: number) => number) => {
    let d = "";
    vals.forEach((v, k) => { if (v == null) return; d += `${d && vals[k - 1] != null ? "L" : "M"}${xOf(k).toFixed(1)} ${y(v).toFixed(1)}`; });
    return d;
  };

  // 成交量
  const vol = pane.vol;
  const vMax = Math.max(1, ...rows.map((d) => d.volume ?? 0));
  const yV = (v: number) => vol.top + vol.h - (v / vMax) * vol.h * 0.92;

  // 副图
  const sp = pane.sub;
  const subSeries = (() => {
    if (sub === "macd") {
      const dif = sliceN(ind.macd.dif), dea = sliceN(ind.macd.dea), hist = sliceN(ind.macd.hist);
      const mx = Math.max(1e-9, ...[...dif, ...dea, ...hist].map((v) => Math.abs(v ?? 0)));
      return { lo: -mx, hi: mx, lines: [{ label: "DIF", vals: dif, color: "var(--chart-3)" }, { label: "DEA", vals: dea, color: "var(--chart-4)" }], hist, refs: [0] };
    }
    if (sub === "kdj") {
      const k = sliceN(ind.kdj.k), d = sliceN(ind.kdj.d), j = sliceN(ind.kdj.j);
      const all = [...k, ...d, ...j].filter((v): v is number => v != null);
      return { lo: Math.min(0, ...all), hi: Math.max(100, ...all), lines: [{ label: "K", vals: k, color: "var(--chart-3)" }, { label: "D", vals: d, color: "var(--chart-4)" }, { label: "J", vals: j, color: "var(--chart-2)" }], refs: [20, 80] };
    }
    if (sub === "rsi") {
      return { lo: 0, hi: 100, lines: ind.rsi.map((a, i) => ({ label: `RSI${[6, 12, 24][i]}`, vals: sliceN(a), color: MA_COLORS[i] })), refs: [30, 70] };
    }
    return null;
  })();
  const yS = (v: number) => (sp && subSeries ? sp.top + ((subSeries.hi - v) / (subSeries.hi - subSeries.lo || 1)) * sp.h : 0);

  // 区间最高 / 最低
  let hiK = 0, loK = 0;
  rows.forEach((d, k) => { if (d.high > rows[hiK].high) hiK = k; if (d.low < rows[loK].low) loK = k; });

  // 最新价
  const last = data[data.length - 1];
  const prev = data[data.length - 2] ?? last;
  const lastUp = last ? last.close >= prev.close : true;

  // 当前读数: 光标所在根, 否则最后一根
  const cIdx = cursor ? Math.min(cursor.i, rows.length - 1) : -1;
  const ci = cursor ? start + cIdx : view.end - 1;
  const cur = data[ci];
  const before = data[ci - 1];
  const chg = cur && before ? cur.close - before.close : 0;
  const chgPct = before ? (chg / before.close) * 100 : 0;
  const amp = before ? ((cur.high - cur.low) / before.close) * 100 : 0;
  const tone = (v: number) => (v >= 0 ? up : down);

  // 时间轴标签: 间隔至少 80px
  const every = Math.max(1, Math.ceil(80 / Math.max(step, 0.1)));
  const xLabels = rows.map((d, k) => ({ k, t: d.t })).filter(({ k }) => (start + k) % every === 0 && xOf(k) > 34 && xOf(k) < plotW - 34);

  const pointer = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (drag.current) {
      const shift = Math.round((drag.current.x - e.clientX) / Math.max(step, 0.1));
      setView((v) => clampView(drag.current!.end + shift, v.count));
      return;
    }
    if (x > plotW) { setCursor(null); return; }
    setCursor({ i: Math.min(rows.length - 1, Math.max(0, Math.floor(x / step))), y });
  };

  const announce = (k: number) => {
    const d = data[start + k];
    if (d) setLive(`${d.t}，开 ${fmt(d.open)}，高 ${fmt(d.high)}，低 ${fmt(d.low)}，收 ${fmt(d.close)}`);
  };
  const onKey = (e: React.KeyboardEvent) => {
    const k = cursor ? cIdx : rows.length - 1;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const dir = e.key === "ArrowLeft" ? -1 : 1;
      const nk = k + dir;
      if (nk < 0 || nk >= rows.length) { setView((v) => clampView(v.end + dir, v.count)); announce(k); setCursor({ i: k, y: null }); return; }
      setCursor({ i: nk, y: null }); announce(nk);
    } else if (e.key === "ArrowUp") { e.preventDefault(); zoom(1 / 1.2); }
    else if (e.key === "ArrowDown") { e.preventDefault(); zoom(1.2); }
    else if (e.key === "Home") { e.preventDefault(); setView((v) => clampView(v.count, v.count)); }
    else if (e.key === "End") { e.preventDefault(); setView((v) => clampView(data.length, v.count)); }
    else if (e.key === "Escape") setCursor(null);
  };

  // 十字光标水平线落在哪个分区, 对应轴上标什么数
  const hLabel = (() => {
    if (cursor?.y == null) return null;
    const y = cursor.y;
    if (y >= main.top && y <= main.top + main.h) return { y, text: fmt(pFromY(y)) };
    if (vol && y >= vol.top && y <= vol.top + vol.h) return { y, text: compact.format(((vol.top + vol.h - y) / (vol.h * 0.92)) * vMax) };
    if (sp && subSeries && y >= sp.top && y <= sp.top + sp.h) return { y, text: (subSeries.hi - ((y - sp.top) / sp.h) * (subSeries.hi - subSeries.lo)).toFixed(2) };
    return null;
  })();

  const Legend = ({ items, nowrap }: { items: { label: string; value: string; color?: string }[]; nowrap?: boolean }) => (
    <span className={cn("flex gap-x-3 gap-y-0.5", nowrap ? "overflow-hidden" : "flex-wrap")}>
      {items.map((it) => (
        <span key={it.label} className="whitespace-nowrap"><span style={{ color: it.color }} className={it.color ? "" : "text-muted-foreground"}>{it.label}</span> <span className="tabular-nums" style={{ color: it.color }}>{it.value}</span></span>
      ))}
    </span>
  );
  const valAt = (arr: (number | null)[], digits = precision) => { const v = arr[ci]; return v == null ? "—" : v.toFixed(digits); };

  return (
    <div className={cn("w-full select-none", className)}>
      {/* 读数条: 光标所在那根, 没有光标时是最新一根 */}
      {cur && (
        <div className="mb-2 grid gap-1 font-mono text-[11px] leading-4 sm:text-xs">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <span className="text-foreground">{cur.t}</span>
            <Legend items={[
              { label: "开", value: fmt(cur.open), color: tone(cur.open - (before?.close ?? cur.open)) },
              { label: "高", value: fmt(cur.high), color: tone(cur.high - (before?.close ?? cur.high)) },
              { label: "低", value: fmt(cur.low), color: tone(cur.low - (before?.close ?? cur.low)) },
              { label: "收", value: fmt(cur.close), color: tone(chg) },
              { label: "涨跌", value: `${chg >= 0 ? "+" : ""}${fmt(chg)} (${chgPct >= 0 ? "+" : ""}${chgPct.toFixed(2)}%)`, color: tone(chg) },
              { label: "振幅", value: `${amp.toFixed(2)}%` },
              ...(cur.volume != null ? [{ label: "量", value: compact.format(cur.volume) }] : []),
            ]} />
            {toolbar && (
              <span className="ml-auto flex items-center gap-0.5 font-sans">
                {[
                  { label: "放大", icon: Plus, on: () => zoom(1 / 1.25) },
                  { label: "缩小", icon: Minus, on: () => zoom(1.25) },
                  { label: "回到最新", icon: Maximize2, on: () => setView(home()) },
                ].map(({ label, icon: I, on }) => (
                  <button key={label} type="button" onClick={on} aria-label={label} title={label}
                    className="grid size-7 place-items-center rounded-md text-muted-foreground transition-[color,background-color,transform] duration-150 hover:bg-accent hover:text-foreground active:scale-90">
                    <I className="size-3.5" aria-hidden />
                  </button>
                ))}
              </span>
            )}
          </div>
          {overlay !== "none" && (
            <Legend items={overlay === "ma"
              ? ma.map((n, i) => ({ label: `MA${n}`, value: valAt(ind.ma[i]), color: MA_COLORS[i % MA_COLORS.length] }))
              : [{ label: "BOLL 中", value: valAt(ind.boll.mid), color: "var(--chart-3)" }, { label: "上", value: valAt(ind.boll.up), color: "var(--chart-2)" }, { label: "下", value: valAt(ind.boll.low), color: "var(--chart-2)" }]} />
          )}
        </div>
      )}

      <div
        ref={box}
        role="group"
        tabIndex={0}
        aria-label={`${name}，共 ${data.length} 根，当前显示 ${rows.length} 根。左右方向键逐根查看，上下方向键缩放，Home / End 到最早 / 最新。`}
        onKeyDown={onKey}
        onBlur={() => setCursor(null)}
        className="relative rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ height }}
      >
        {width > 0 && (
          <m.div
            initial={reduced ? { opacity: 0 } : { clipPath: "inset(0 100% 0 0)" }}
            animate={reduced ? { opacity: 1 } : { clipPath: "inset(0 0% 0 0)" }}
            transition={{ duration: reduced ? 0.2 : 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
          <svg
            ref={plotRef}
            width={width}
            height={height}
            aria-hidden
            data-end={view.end}
            className={cn("block touch-none", dragging ? "cursor-grabbing" : "cursor-crosshair")}
            onPointerMove={pointer}
            onPointerLeave={() => { if (!drag.current) setCursor(null); }}
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); drag.current = { x: e.clientX, end: view.end }; setDragging(true); }}
            onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); drag.current = null; setDragging(false); }}
            onDoubleClick={() => setView(home())}
          >
            <defs>
              <clipPath id={`${uid}-plot`}><rect x={0} y={0} width={plotW} height={height - AXIS_H} /></clipPath>
            </defs>

            {/* 网格与分区线 */}
            {ticks.map((t) => <line key={t} x1={0} x2={plotW} y1={yP(t)} y2={yP(t)} stroke="var(--border)" strokeOpacity={0.6} strokeDasharray="2 4" />)}
            {xLabels.map(({ k }) => <line key={k} x1={xOf(k)} x2={xOf(k)} y1={0} y2={height - AXIS_H} stroke="var(--border)" strokeOpacity={0.35} strokeDasharray="2 4" />)}
            {panes.slice(1).map((p) => <line key={p.id} x1={0} x2={width} y1={pane[p.id].top - GAP / 2} y2={pane[p.id].top - GAP / 2} stroke="var(--border)" />)}
            <line x1={plotW + 0.5} x2={plotW + 0.5} y1={0} y2={height - AXIS_H} stroke="var(--border)" />
            <line x1={0} x2={width} y1={height - AXIS_H + 0.5} y2={height - AXIS_H + 0.5} stroke="var(--border)" />

            <g clipPath={`url(#${uid}-plot)`}>
              {/* 布林带填充 */}
              {overlay === "boll" && (() => {
                const u = sliceN(ind.boll.up), l = sliceN(ind.boll.low);
                const pts = u.map((v, k) => (v == null ? null : `${xOf(k)},${yP(v)}`)).filter(Boolean);
                const bot = l.map((v, k) => (v == null ? null : `${xOf(k)},${yP(v)}`)).filter(Boolean).reverse();
                return pts.length ? <polygon points={[...pts, ...bot].join(" ")} fill="var(--chart-2)" fillOpacity={0.07} /> : null;
              })()}

              {/* 蜡烛 */}
              {rows.map((d, k) => {
                const isUp = d.close >= d.open;
                const c = isUp ? up : down;
                const x = xOf(k);
                const top = yP(Math.max(d.open, d.close)), bot = yP(Math.min(d.open, d.close));
                const hollowBody = hollow && isUp;
                return (
                  <g key={start + k}>
                    {step < 3 ? (
                      <line x1={x} x2={x} y1={yP(d.high)} y2={yP(d.low)} stroke={c} />
                    ) : (
                      <>
                        <line x1={x} x2={x} y1={yP(d.high)} y2={hollowBody ? top : yP(d.high)} stroke={c} />
                        <line x1={x} x2={x} y1={hollowBody ? bot : yP(d.high)} y2={yP(d.low)} stroke={c} />
                        <rect x={x - bodyW / 2} y={top} width={bodyW} height={Math.max(1, bot - top)}
                          fill={hollowBody ? "var(--background)" : c} stroke={c} strokeWidth={hollowBody ? 1 : 0} />
                      </>
                    )}
                  </g>
                );
              })}

              {/* 主图叠加线 */}
              {overlay === "ma" && ind.ma.map((a, i) => <path key={i} d={line(sliceN(a), yP)} fill="none" stroke={MA_COLORS[i % MA_COLORS.length]} strokeWidth={1.25} />)}
              {overlay === "boll" && [ind.boll.up, ind.boll.mid, ind.boll.low].map((a, i) => (
                <path key={i} d={line(sliceN(a), yP)} fill="none" stroke={i === 1 ? "var(--chart-3)" : "var(--chart-2)"} strokeWidth={1.25} strokeDasharray={i === 1 ? undefined : "4 3"} />
              ))}

              {/* 区间最高 / 最低 */}
              {rows.length > 0 && [{ k: hiK, v: rows[hiK].high, y: yP(rows[hiK].high), dy: -1 }, { k: loK, v: rows[loK].low, y: yP(rows[loK].low), dy: 1 }].map((mk) => {
                const x = xOf(mk.k); const left = x > plotW * 0.7;
                return (
                  <g key={mk.dy} className="text-[10px]">
                    <line x1={x} x2={x + (left ? -18 : 18)} y1={mk.y} y2={mk.y + mk.dy * 8} stroke="var(--muted-foreground)" strokeWidth={0.8} />
                    <text x={x + (left ? -21 : 21)} y={mk.y + mk.dy * 8} textAnchor={left ? "end" : "start"} dominantBaseline="middle" className="fill-muted-foreground tabular-nums">{fmt(mk.v)}</text>
                  </g>
                );
              })}

              {/* 成交量 */}
              {vol && rows.map((d, k) => (
                <rect key={start + k} x={xOf(k) - bodyW / 2} y={yV(d.volume ?? 0)} width={bodyW} height={Math.max(0, vol.top + vol.h - yV(d.volume ?? 0))}
                  fill={d.close >= d.open ? up : down} fillOpacity={hollow && d.close >= d.open ? 0.2 : 0.55} stroke={hollow && d.close >= d.open ? up : "none"} strokeWidth={0.8} />
              ))}
              {vol && ind.volMa.map((a, i) => <path key={i} d={line(sliceN(a), yV)} fill="none" stroke={MA_COLORS[i]} strokeWidth={1} />)}

              {/* 副图 */}
              {sp && subSeries && (
                <>
                  {subSeries.refs.map((r) => <line key={r} x1={0} x2={plotW} y1={yS(r)} y2={yS(r)} stroke="var(--border)" strokeDasharray="3 3" />)}
                  {"hist" in subSeries && subSeries.hist?.map((v, k) => v == null ? null : (
                    <line key={start + k} x1={xOf(k)} x2={xOf(k)} y1={yS(0)} y2={yS(v)} stroke={v >= 0 ? up : down} strokeWidth={Math.max(1, Math.min(4, bodyW * 0.45))} strokeOpacity={0.8} />
                  ))}
                  {subSeries.lines.map((l) => <path key={l.label} d={line(l.vals, yS)} fill="none" stroke={l.color} strokeWidth={1.2} />)}
                </>
              )}
            </g>

            {/* 价格轴 */}
            {ticks.map((t) => <text key={t} x={plotW + 6} y={yP(t)} dominantBaseline="middle" className="fill-muted-foreground font-mono text-[10px] tabular-nums">{fmt(t)}</text>)}
            {vol && <text x={plotW + 6} y={vol.top + 8} dominantBaseline="middle" className="fill-muted-foreground font-mono text-[10px]">{compact.format(vMax)}</text>}
            {sp && subSeries && subSeries.refs.map((r) => <text key={r} x={plotW + 6} y={yS(r)} dominantBaseline="middle" className="fill-muted-foreground font-mono text-[10px]">{r}</text>)}
            {xLabels.map(({ k, t }) => <text key={k} x={xOf(k)} y={height - AXIS_H / 2} textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground font-mono text-[10px]">{t}</text>)}

            {/* 最新价线 */}
            {last && last.close >= pLo && last.close <= pHi && (
              <g>
                <line x1={0} x2={plotW} y1={yP(last.close)} y2={yP(last.close)} stroke={lastUp ? up : down} strokeDasharray="3 3" strokeOpacity={0.9} />
                <rect x={plotW + 1} y={yP(last.close) - 9} width={AXIS_W - 2} height={18} rx={3} fill={lastUp ? up : down} />
                <text x={plotW + AXIS_W / 2} y={yP(last.close)} textAnchor="middle" dominantBaseline="middle" fill="white" className="font-mono text-[10px] font-semibold tabular-nums">{fmt(last.close)}</text>
              </g>
            )}

            {/* 十字光标 */}
            {cursor && rows[cIdx] && (
              <g pointerEvents="none">
                <line x1={xOf(cIdx)} x2={xOf(cIdx)} y1={0} y2={height - AXIS_H} stroke="var(--foreground)" strokeOpacity={0.45} strokeDasharray="3 3" />
                {hLabel && (
                  <>
                    <line x1={0} x2={plotW} y1={hLabel.y} y2={hLabel.y} stroke="var(--foreground)" strokeOpacity={0.45} strokeDasharray="3 3" />
                    <rect x={plotW + 1} y={hLabel.y - 9} width={AXIS_W - 2} height={18} rx={3} fill="var(--foreground)" />
                    <text x={plotW + AXIS_W / 2} y={hLabel.y} textAnchor="middle" dominantBaseline="middle" fill="var(--background)" className="font-mono text-[10px] tabular-nums">{hLabel.text}</text>
                  </>
                )}
                {(() => {
                  const w = Math.max(70, rows[cIdx].t.length * 7 + 12);
                  const x = Math.min(plotW - w / 2, Math.max(w / 2, xOf(cIdx)));
                  return (
                    <>
                      <rect x={x - w / 2} y={height - AXIS_H + 2} width={w} height={AXIS_H - 4} rx={3} fill="var(--foreground)" />
                      <text x={x} y={height - AXIS_H / 2} textAnchor="middle" dominantBaseline="middle" fill="var(--background)" className="font-mono text-[10px]">{rows[cIdx].t}</text>
                    </>
                  );
                })()}
              </g>
            )}
          </svg>
          </m.div>
        )}

        {/* 副区读数, 叠在各区左上 */}
        {vol && cur && (
          <div className="pointer-events-none absolute left-1 font-mono text-[10px] leading-4" style={{ top: vol.top + 2, right: AXIS_W + 4 }}>
            <Legend nowrap items={[{ label: "VOL", value: compact.format(cur.volume ?? 0) }, { label: "MA5", value: ind.volMa[0][ci] == null ? "—" : compact.format(ind.volMa[0][ci]!), color: MA_COLORS[0] }, { label: "MA10", value: ind.volMa[1][ci] == null ? "—" : compact.format(ind.volMa[1][ci]!), color: MA_COLORS[1] }]} />
          </div>
        )}
        {sp && subSeries && cur && (
          <div className="pointer-events-none absolute left-1 font-mono text-[10px] leading-4" style={{ top: sp.top + 2, right: AXIS_W + 4 }}>
            <Legend nowrap items={[
              { label: sub.toUpperCase(), value: sub === "macd" ? "12,26,9" : sub === "kdj" ? "9,3,3" : "6,12,24" },
              ...(sub === "macd"
                ? [{ label: "DIF", value: ind.macd.dif[ci].toFixed(3), color: "var(--chart-3)" }, { label: "DEA", value: ind.macd.dea[ci].toFixed(3), color: "var(--chart-4)" }, { label: "MACD", value: ind.macd.hist[ci].toFixed(3), color: tone(ind.macd.hist[ci]) }]
                : sub === "kdj"
                  ? [{ label: "K", value: ind.kdj.k[ci].toFixed(2), color: "var(--chart-3)" }, { label: "D", value: ind.kdj.d[ci].toFixed(2), color: "var(--chart-4)" }, { label: "J", value: ind.kdj.j[ci].toFixed(2), color: "var(--chart-2)" }]
                  : ind.rsi.map((a, i) => ({ label: `RSI${[6, 12, 24][i]}`, value: a[ci] == null ? "—" : a[ci]!.toFixed(2), color: MA_COLORS[i] }))),
            ]} />
          </div>
        )}
        <p className="sr-only" aria-live="polite">{live}</p>
      </div>
    </div>
  );
}
