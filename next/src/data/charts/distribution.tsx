import { AnimatePresence, m } from "motion/react";
import { bin, extent, mean, quantileSorted } from "d3-array";
import { scaleBand, scaleLinear } from "d3-scale";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "@/motion/use-reduced-motion";
import { spring } from "@/motion/presets";
import { cn } from "@/lib/utils";

export interface DistributionGroup { name: string; values: number[] }

export interface DistributionProps {
  /** histogram: 一组数据的直方图 (顶上带箱线); box: 多组对比的箱线图 */
  mode?: "histogram" | "box";
  /** histogram 用 */
  values?: number[];
  /** box 用; histogram 模式给了 groups 时取第一组 */
  groups?: DistributionGroup[];
  /** 直方图分几档 (近似, 会取整到好看的边界) */
  bins?: number;
  /** 画均值 / 中位数 / P90 标线 */
  markers?: boolean;
  /** 直方图顶上的箱线条 */
  boxStrip?: boolean;
  /** 箱线图画离群点 */
  outliers?: boolean;
  /** 横轴上下限; 不给按数据 */
  domain?: [number, number];
  /** 长尾截断: 横轴只画到这个分位数, 更大的值并成最后一档「x+」(箱线图则不画超出的离群点). 1 表示不截断 */
  clip?: number;
  format?: (v: number) => string;
  unit?: string;
  height?: number;
  ariaLabel?: string;
  className?: string;
}

interface Stats { n: number; min: number; q1: number; median: number; q3: number; max: number; mean: number; p90: number; lo: number; hi: number; out: number[] }

function stats(values: number[]): Stats | null {
  const s = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!s.length) return null;
  const q1 = quantileSorted(s, 0.25)!, q3 = quantileSorted(s, 0.75)!, iqr = q3 - q1;
  // 须线到 1.5 倍四分位距内最远的点, 之外算离群
  const lo = s.find((v) => v >= q1 - 1.5 * iqr) ?? s[0];
  const hi = [...s].reverse().find((v) => v <= q3 + 1.5 * iqr) ?? s[s.length - 1];
  return { n: s.length, min: s[0], q1, median: quantileSorted(s, 0.5)!, q3, max: s[s.length - 1], mean: mean(s)!, p90: quantileSorted(s, 0.9)!, lo, hi, out: s.filter((v) => v < lo || v > hi) };
}

/**
 * 分布图: 直方图看一组数据长什么样 (客单价, 加载耗时), 箱线图横向对比几组 (各渠道, 各版本).
 * 数据增减时柱子高度、箱体、标线平滑过渡, 新分组从中位数处展开. 方向键逐个柱子 / 分组查看.
 */
export function Distribution({
  mode = "histogram", values, groups, bins = 24, clip = 0.99, markers = true, boxStrip = true, outliers = true, domain,
  format = (v) => v.toLocaleString("zh-CN", { maximumFractionDigits: 1 }), unit = "", height = 300, ariaLabel = "分布图", className,
}: DistributionProps) {
  const reduced = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  const t = reduced ? { duration: 0 } : spring.smooth;

  const series = useMemo(() => (mode === "box" ? groups ?? [] : [{ name: ariaLabel, values: values ?? groups?.[0]?.values ?? [] }]), [mode, groups, values, ariaLabel]);
  const all = useMemo(() => series.flatMap((g) => g.values), [series]);
  const [x0, x1] = useMemo(() => {
    if (domain) return domain;
    const [a, b] = (extent(all) as [number, number] | [undefined, undefined]).map((v) => v ?? 0) as [number, number];
    if (clip >= 1 || all.length < 20) return [a, b] as [number, number];
    const sorted = [...all].sort((p, q) => p - q);
    let hi = quantileSorted(sorted, clip) ?? b;
    // 箱线图至少要把须线画全
    if (mode === "box") for (const g of series) { const st = stats(g.values); if (st) hi = Math.max(hi, st.hi); }
    return [a, Math.min(b, hi)] as [number, number];
  }, [domain, all, clip, mode, series]);

  const [hover, setHover] = useState<number | null>(null);
  const [focus, setFocus] = useState<number | null>(null);
  const active = hover ?? focus;
  const svgRef = useRef<SVGSVGElement>(null);

  // ---------- 直方图 ----------
  const hist = useMemo(() => {
    if (mode !== "histogram") return null;
    const v = series[0]?.values ?? [];
    const x = scaleLinear().domain([x0, x1 === x0 ? x0 + 1 : x1]).nice(bins);
    const [d0, d1] = x.domain() as [number, number];
    const b: (number[] & { x0?: number; x1?: number; overflow?: boolean })[] = bin().domain([d0, d1]).thresholds(x.ticks(bins))(v.filter((n) => n <= d1));
    // 阈值正好等于上限时 d3 会多出一档零宽的, 并到前一档
    for (let i = b.length - 1; i > 0; i--) if ((b[i].x1 ?? 0) <= (b[i].x0 ?? 0)) { b[i - 1].push(...b[i]); b.splice(i, 1); }
    // 截掉的长尾并成最后一档
    const over = v.filter((n) => n > d1);
    if (over.length) {
      const step = b.length ? (b[b.length - 1].x1 ?? d1) - (b[b.length - 1].x0 ?? d0) : 1;
      b.push(Object.assign(over, { x0: d1, x1: d1 + step, overflow: true }));
      x.domain([d0, d1 + step]);
    }
    return { x, b, st: stats(v), n: v.length, cut: over.length ? d1 : null };
  }, [mode, series, x0, x1, bins]);

  // ---------- 箱线图 ----------
  const boxes = useMemo(() => (mode === "box" ? series.map((g) => ({ name: g.name, st: stats(g.values) })) : null), [mode, series]);

  const pad = mode === "box"
    ? { l: Math.min(110, 16 + Math.max(0, ...series.map((g) => g.name.length)) * 12), r: 16, t: 8, b: 28 }
    : { l: 44, r: 12, t: boxStrip ? 40 : 14, b: 28 };
  const h = mode === "box" ? Math.max(height, series.length * 44 + pad.t + pad.b) : height;
  const xs = scaleLinear().domain(hist ? (hist.x.domain() as [number, number]) : [x0, x1 === x0 ? x0 + 1 : x1]).range([pad.l, Math.max(pad.l + 1, width - pad.r)]);
  if (!hist) xs.nice(6);
  const xticks = xs.ticks(Math.max(2, Math.floor((width - pad.l - pad.r) / 72))).filter((v) => {
    if (!hist?.cut || !hist.b.length) return true;
    // 别跟最后一档「x+」的标签挤在一起
    const last = hist.b[hist.b.length - 1];
    return v <= hist.cut && Math.abs(xs(v) - xs(((last.x0 ?? 0) + (last.x1 ?? 0)) / 2)) > 44;
  });
  const ymax = hist ? Math.max(1, ...hist.b.map((d) => d.length)) : 1;
  const ys = scaleLinear().domain([0, ymax]).nice(4).range([h - pad.b, pad.t]);
  const band = scaleBand<string>().domain(series.map((g) => g.name)).range([pad.t, h - pad.b]).paddingInner(0.35).paddingOuter(0.2);

  const count = mode === "box" ? series.length : hist?.b.length ?? 0;
  const tabIdx = focus != null && focus < count ? focus : 0;
  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    let j: number | null = null;
    if (step != null) j = Math.max(0, Math.min(count - 1, tabIdx + step));
    if (e.key === "Home") j = 0; if (e.key === "End") j = count - 1;
    if (j == null) return;
    e.preventDefault(); setFocus(j);
    // 按当前的 key 找元素: 退场中的旧元素可能占着同一个下标
    const k = mode === "box" ? series[j]?.name : hist ? `${hist.b[j]?.x0}-${hist.b[j]?.x1}` : "";
    svgRef.current?.querySelector<SVGGElement>(`g[data-k="${CSS.escape(String(k))}"]`)?.focus();
  };
  const roving = (i: number) => ({
    tabIndex: i === tabIdx ? 0 : -1,
    onPointerEnter: () => setHover(i),
    onPointerLeave: () => setHover((k) => (k === i ? null : k)),
    onFocus: () => setFocus(i),
    onBlur: () => setFocus((k) => (k === i ? null : k)),
  });
  const pctF = (v: number) => `${(v * 100).toFixed(1)}%`;

  // 提示
  let tip: { x: number; y: number; body: React.ReactNode } | null = null;
  if (active != null && hist && hist.b[active]) {
    const d = hist.b[active], cum = hist.b.slice(0, active + 1).reduce((s, x) => s + x.length, 0);
    tip = {
      x: xs(((d.x0 ?? 0) + (d.x1 ?? 0)) / 2), y: ys(d.length),
      body: (<>
        <p className="font-medium font-mono tabular-nums">{(d as { overflow?: boolean }).overflow ? `${format(d.x0 ?? 0)}${unit} 以上（长尾合并）` : `${format(d.x0 ?? 0)} – ${format(d.x1 ?? 0)}${unit}`}</p>
        <p className="mt-1 flex justify-between gap-4 text-muted-foreground"><span>笔数</span><span className="font-mono text-foreground tabular-nums">{d.length.toLocaleString("zh-CN")}</span></p>
        <p className="flex justify-between gap-4 text-muted-foreground"><span>占比</span><span className="font-mono tabular-nums">{pctF(d.length / Math.max(1, hist.n))}</span></p>
        <p className="flex justify-between gap-4 text-muted-foreground"><span>累计</span><span className="font-mono tabular-nums">{pctF(cum / Math.max(1, hist.n))}</span></p>
      </>),
    };
  } else if (active != null && boxes?.[active]?.st) {
    const { name, st } = boxes[active]; const s = st!;
    tip = {
      x: xs(s.q3), y: (band(name) ?? 0),
      body: (<>
        <p className="font-medium">{name} <span className="font-normal text-muted-foreground">· {s.n.toLocaleString("zh-CN")} 条</span></p>
        {([["最大", s.max], ["上四分位 Q3", s.q3], ["中位数", s.median], ["均值", s.mean], ["下四分位 Q1", s.q1], ["最小", s.min]] as const).map(([k, v]) => (
          <p key={k} className="flex justify-between gap-4 text-muted-foreground"><span>{k}</span><span className={cn("font-mono tabular-nums", k === "中位数" && "text-foreground")}>{format(v)}{unit}</span></p>
        ))}
        {s.out.length > 0 && <p className="mt-1 text-muted-foreground">离群点 {s.out.length} 个</p>}
      </>),
    };
  }

  const st = hist?.st;
  const markerList = st && markers ? [
    { k: "中位数", v: st.median, c: "var(--foreground)" },
    { k: "均值", v: st.mean, c: "var(--chart-2)" },
    { k: "P90", v: st.p90, c: "var(--chart-4)" },
  ] : [];

  return (
    <div ref={box} className={cn("relative w-full", className)}>
      {width > 0 && (
        <svg ref={svgRef} width={width} height={h} role="group" aria-roledescription={mode === "box" ? "箱线图" : "直方图"} onKeyDown={onKeyDown} className="block overflow-visible"
          aria-label={`${ariaLabel}，${mode === "box" ? `${series.length} 组` : `${hist?.n ?? 0} 个数据，${hist?.b.length ?? 0} 档`}。方向键逐个查看`}>
          {/* 横轴 */}
          <g aria-hidden className="text-[11px]">
            {xticks.map((v) => (
              <m.g key={v} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                {mode === "box" && <line x1={xs(v)} x2={xs(v)} y1={pad.t} y2={h - pad.b} stroke="var(--border)" strokeDasharray="2 3" />}
                <text x={xs(v)} y={h - pad.b + 17} textAnchor="middle" className="fill-muted-foreground font-mono tabular-nums">{format(v)}</text>
              </m.g>
            ))}
            <line x1={pad.l} x2={width - pad.r} y1={h - pad.b} y2={h - pad.b} stroke="var(--border)" />
            {hist?.cut != null && hist.b.length > 0 && (
              <text x={xs(((hist.b[hist.b.length - 1].x0 ?? 0) + (hist.b[hist.b.length - 1].x1 ?? 0)) / 2)} y={h - pad.b + 17} textAnchor="middle" className="fill-muted-foreground font-mono tabular-nums">{format(hist.cut)}+</text>
            )}
          </g>

          {hist && (
            <>
              {/* 纵轴网格 */}
              <g aria-hidden className="text-[11px]">
                {ys.ticks(4).map((v) => (
                  <g key={v}>
                    {v > 0 && <line x1={pad.l} x2={width - pad.r} y1={ys(v)} y2={ys(v)} stroke="var(--border)" strokeDasharray="2 3" />}
                    <text x={pad.l - 8} y={ys(v)} dy="0.32em" textAnchor="end" className="fill-muted-foreground font-mono tabular-nums">{v.toLocaleString("zh-CN")}</text>
                  </g>
                ))}
              </g>
              {/* 柱子: 按档的起点做 key, 换分档时旧柱退场新柱长出 */}
              <g>
                <AnimatePresence initial={!reduced}>
                  {hist.b.map((d, i) => {
                    const xa = xs(d.x0 ?? 0) + 1, xb = xs(d.x1 ?? 0) - 1, y = ys(d.length);
                    const dim = active != null && active !== i;
                    return (
                      <m.g key={`${d.x0}-${d.x1}`} data-k={`${d.x0}-${d.x1}`} role="img" {...roving(i)}
                        aria-label={`${d.overflow ? `${format(d.x0 ?? 0)}${unit} 以上` : `${format(d.x0 ?? 0)} 到 ${format(d.x1 ?? 0)}${unit}`}，${d.length} 个，占 ${pctF(d.length / Math.max(1, hist.n))}`}
                        initial={{ opacity: 0 }} animate={{ opacity: dim ? 0.45 : 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                        className="outline-none focus-visible:[&>rect:first-of-type]:stroke-[var(--ring)]">
                        <m.rect initial={reduced ? { x: xa, width: Math.max(0.5, xb - xa), y, height: ys(0) - y } : { x: xa, width: Math.max(0.5, xb - xa), y: ys(0), height: 0 }}
                          animate={{ x: xa, width: Math.max(0.5, xb - xa), y, height: ys(0) - y }}
                          exit={reduced ? undefined : { y: ys(0), height: 0 }} transition={t}
                          rx={2} fill={d.overflow ? "color-mix(in oklch, var(--chart-1) 45%, transparent)" : "var(--chart-1)"} fillOpacity={0.85} stroke="transparent" strokeWidth={2} strokeDasharray={d.overflow ? "3 2" : undefined} />
                        <rect x={xa} width={Math.max(1, xb - xa)} y={pad.t} height={Math.max(0, ys(0) - pad.t)} fill="transparent" />
                      </m.g>
                    );
                  })}
                </AnimatePresence>
              </g>
              {/* 标线 */}
              <g aria-hidden>
                {markerList.map((mk) => (
                  <m.g key={mk.k} initial={false} animate={{ x: xs(mk.v) }} transition={t}>
                    <line y1={pad.t - (boxStrip ? 4 : 0)} y2={h - pad.b} stroke={mk.c} strokeWidth={1.5} strokeDasharray={mk.k === "中位数" ? undefined : "4 3"} />
                  </m.g>
                ))}
              </g>
              {/* 顶部箱线条 */}
              {boxStrip && st && (
                <g aria-hidden>
                  <m.line initial={false} animate={{ x1: xs(st.lo), x2: xs(st.hi) }} transition={t} y1={18} y2={18} stroke="var(--muted-foreground)" />
                  <m.rect initial={false} animate={{ x: xs(st.q1), width: Math.max(1, xs(st.q3) - xs(st.q1)) }} transition={t} y={11} height={14} rx={3}
                    fill="color-mix(in oklch, var(--chart-1) 22%, transparent)" stroke="var(--chart-1)" />
                  <m.line initial={false} animate={{ x1: xs(st.median), x2: xs(st.median) }} transition={t} y1={11} y2={25} stroke="var(--foreground)" strokeWidth={2} />
                </g>
              )}
            </>
          )}

          {boxes && (
            <g>
              <AnimatePresence initial={!reduced}>
                {boxes.map(({ name, st: s }, i) => {
                  if (!s) return null;
                  const y = band(name) ?? 0, bh = band.bandwidth(), cy = y + bh / 2;
                  const dim = active != null && active !== i;
                  const from = reduced ? null : xs(s.median);
                  const color = `var(--chart-${(i % 5) + 1})`;
                  return (
                    <m.g key={name} data-k={name} role="img" {...roving(i)}
                      aria-label={`${name}，中位数 ${format(s.median)}${unit}，四分位 ${format(s.q1)} 到 ${format(s.q3)}，范围 ${format(s.min)} 到 ${format(s.max)}，${s.n} 条`}
                      initial={{ opacity: 0 }} animate={{ opacity: dim ? 0.4 : 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                      className="outline-none focus-visible:[&_.hx-box]:stroke-[var(--ring)] focus-visible:[&_.hx-box]:[stroke-width:2]">
                      <rect x={pad.l} y={y - 4} width={Math.max(0, width - pad.l - pad.r)} height={bh + 8} fill="transparent" />
                      <text x={pad.l - 10} y={cy} dy="0.32em" textAnchor="end" className="fill-foreground text-[12px]">{name}</text>
                      <m.line initial={from != null ? { x1: from, x2: from, y1: cy, y2: cy } : false} animate={{ x1: xs(s.lo), x2: xs(s.hi), y1: cy, y2: cy }} transition={t} stroke="var(--muted-foreground)" />
                      {[s.lo, s.hi].map((v, k) => (
                        <m.line key={k} initial={from != null ? { x1: from, x2: from, y1: y + bh * 0.25, y2: y + bh * 0.75 } : false} animate={{ x1: xs(v), x2: xs(v), y1: y + bh * 0.25, y2: y + bh * 0.75 }} transition={t} stroke="var(--muted-foreground)" />
                      ))}
                      <m.rect className="hx-box" initial={from != null ? { x: from, width: 0, y, height: bh } : false} animate={{ x: xs(s.q1), width: Math.max(1, xs(s.q3) - xs(s.q1)), y, height: bh }} transition={t}
                        rx={4} fill={`color-mix(in oklch, ${color} 24%, transparent)`} stroke={color} />
                      <m.line initial={false} animate={{ x1: xs(s.median), x2: xs(s.median), y1: y, y2: y + bh }} transition={t} stroke="var(--foreground)" strokeWidth={2} />
                      <m.circle initial={false} animate={{ cx: xs(s.mean), cy }} transition={t} r={3} fill="var(--background)" stroke="var(--foreground)" />
                      {outliers && s.out.filter((v) => v <= xs.domain()[1] && v >= xs.domain()[0]).slice(0, 80).map((v, k) => (
                        <m.circle key={`${k}-${v}`} initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ duration: 0.2 }} cx={xs(v)} cy={cy + (((k * 37) % 7) - 3) * (bh / 14)} r={2.2} fill={color} />
                      ))}
                    </m.g>
                  );
                })}
              </AnimatePresence>
            </g>
          )}
        </svg>
      )}

      {/* 标线图例 */}
      {markerList.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-hidden>
          {markerList.map((mk) => (
            <span key={mk.k} className="inline-flex items-center gap-1.5">
              <svg width="14" height="8" aria-hidden><line x1="0" x2="14" y1="4" y2="4" stroke={mk.c} strokeWidth="1.5" strokeDasharray={mk.k === "中位数" ? undefined : "4 3"} /></svg>
              {mk.k} <span className="font-mono text-foreground tabular-nums">{format(mk.v)}{unit}</span>
            </span>
          ))}
          {st && <span>样本 <span className="font-mono text-foreground tabular-nums">{st.n.toLocaleString("zh-CN")}</span></span>}
        </div>
      )}
      {st && (
        <p className="sr-only">{`中位数 ${format(st.median)}${unit}，均值 ${format(st.mean)}${unit}，P90 ${format(st.p90)}${unit}，四分位 ${format(st.q1)} 到 ${format(st.q3)}`}</p>
      )}

      <div aria-hidden
        className={cn("pointer-events-none absolute top-0 left-0 z-10 min-w-40 rounded-lg border bg-popover/95 px-3 py-2 text-xs shadow-float backdrop-blur transition-opacity duration-150", tip ? "opacity-100" : "opacity-0")}
        style={tip ? { transform: mode === "box"
          ? `translate(${tip.x + 190 < width ? tip.x + 14 : Math.max(4, tip.x - 190)}px, ${Math.max(0, Math.min(h - 160, tip.y - 40))}px)`
          : `translate(${Math.max(4, Math.min(width - 176, tip.x - 80))}px, ${Math.max(0, tip.y - 104)}px)` } : undefined}>
        {tip?.body}
      </div>
    </div>
  );
}
