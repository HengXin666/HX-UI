import { AnimatePresence, m } from "motion/react";
import { geoConicEqualArea, geoPath, type GeoProjection } from "d3-geo";
import { scaleQuantize, scaleSqrt } from "d3-scale";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Feature, FeatureCollection, Geometry, MultiLineString } from "geojson";
import { useReducedMotion } from "@/motion/use-reduced-motion";
import { cn } from "@/lib/utils";

export interface ChinaMapDatum {
  /** 省份名, 全称或简称都行 ("广东" / "广东省"); 也可以写 adcode */
  name: string;
  value: number;
}

export interface ChinaMapProps {
  data: ChinaMapDatum[];
  /** fill: 按数值给省份着色; bubble: 在省份中心画圆, 面积表示数值 */
  mode?: "fill" | "bubble";
  /** 色阶分几档 (3–7) */
  classes?: number;
  /** 写省份简称 */
  showLabels?: boolean;
  /** 右下角南海诸岛小图 */
  southSea?: boolean;
  /** 显示前 N 名排行, 0 不显示 */
  ranking?: number;
  /** 选中的省份 (受控) 和回调 */
  selected?: string | null;
  onSelect?: (name: string | null) => void;
  format?: (v: number) => string;
  unit?: string;
  /** 指标名, 写进提示和读屏文本 */
  metric?: string;
  ariaLabel?: string;
  className?: string;
}

type Props = { name: string; adcode: string; cx: number | null; cy: number | null };
type Prov = Feature<Geometry, Props> & { short: string };

const SHORT: Record<string, string> = {
  内蒙古自治区: "内蒙古", 广西壮族自治区: "广西", 西藏自治区: "西藏", 宁夏回族自治区: "宁夏", 新疆维吾尔自治区: "新疆",
  香港特别行政区: "香港", 澳门特别行政区: "澳门",
};
const shortName = (n: string) => SHORT[n] ?? n.replace(/(省|市)$/, "");

// 拓扑数据单独成块, 第一次用到时才加载
export { shortName as chinaShortName };
let geoCache: Promise<{ provinces: Prov[]; borders: MultiLineString; nine: Feature<Geometry, Props> | null }> | null = null;
export function loadGeo() {
  geoCache ??= Promise.all([import("./geo/china-provinces.json"), import("topojson-client")]).then(([topo, tc]) => {
    const t = (topo.default ?? topo) as unknown as Parameters<typeof tc.feature>[0] & { objects: { provinces: Parameters<typeof tc.feature>[1] } };
    const fc = tc.feature(t, t.objects.provinces) as unknown as FeatureCollection<Geometry, Props>;
    // 九段线单独存原始精度, 简化会把短线段抹掉
    const raw = (t as unknown as { nine?: Geometry }).nine;
    const nine = raw ? ({ type: "Feature", properties: { name: "南海诸岛线", adcode: "100000_JD", cx: null, cy: null }, geometry: raw } as Feature<Geometry, Props>) : null;
    const provinces = fc.features.map((f) => Object.assign(f, { short: shortName(f.properties.name) }));
    // 省界只画一次 (共享边), 外轮廓单独画粗一点
    const borders = tc.mesh(t as never, t.objects.provinces as never, (a, b) => a !== b) as MultiLineString;
    return { provinces, borders, nine };
  });
  return geoCache;
}

const MAIN_BOX: [number, number][] = [[73.4, 18.2], [135.1, 18.2], [135.1, 53.6], [73.4, 53.6], [104, 53.6], [104, 18.2]];
const SEA_BOX: [number, number][] = [[106.5, 2.8], [123.5, 2.8], [123.5, 24.5], [106.5, 24.5]];
const proj = () => geoConicEqualArea().parallels([25, 47]).rotate([-105, 0]);

/**
 * 中国分省地图: 色阶着色或气泡, 带南海诸岛小图、排行和图例.
 * 数据变化时省份颜色渐变到新档位, 气泡从 0 长出来 / 缩回 0, 排行按新名次滑动; 图例档位也跟着更新.
 * 方向键按地理方位在省份之间移动.
 */
export function ChinaMap({
  data, mode = "fill", classes = 5, showLabels = true, southSea = true, ranking = 8, selected: selectedProp, onSelect,
  format = (v) => v.toLocaleString("zh-CN", { maximumFractionDigits: 1 }), unit = "", metric = "数值", ariaLabel = "中国分省地图", className,
}: ChinaMapProps) {
  const reduced = useReducedMotion();
  const [geo, setGeo] = useState<Awaited<ReturnType<typeof loadGeo>> | null>(null);
  useEffect(() => { let alive = true; loadGeo().then((g) => alive && setGeo(g)); return () => { alive = false; }; }, []);

  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  const side = ranking > 0 && width >= 640;
  const W = Math.max(260, side ? width - 212 : width);
  const H = Math.round(W * 0.76);
  const narrow = W < 480;

  // 投影: 主图只框到北纬 18° 以北, 南海在小图里
  const { path, project, insetPath, inset } = useMemo(() => {
    // 用除海南外的省份 + 海南岛本岛的南端来定范围, 南海岛礁留给小图
    const fitTo = geo
      ? { type: "FeatureCollection" as const, features: [...geo.provinces.filter((f) => f.properties.adcode !== "460000"), { type: "Feature" as const, properties: {}, geometry: { type: "MultiPoint" as const, coordinates: [[108.6, 18.15], [111.1, 20.2]] } }] }
      : { type: "MultiPoint" as const, coordinates: MAIN_BOX };
    const iw = Math.round(W * (narrow ? 0.2 : 0.17)), ih = Math.round(iw * 1.32);
    const ix = W - iw - 6, iy = H - ih - 6;
    // 主图右侧给小图让出一部分, 不压住台湾和东南沿海
    const p = proj().fitExtent([[6, 6], [W - 6 - (southSea ? iw * 0.62 : 0), H - 6]], fitTo as never);
    p.clipExtent([[0, 0], [W, H]]);
    const q: GeoProjection = proj().fitExtent([[ix + 4, iy + 4], [ix + iw - 4, iy + ih - 4]], { type: "MultiPoint", coordinates: SEA_BOX });
    q.clipExtent([[ix + 1, iy + 1], [ix + iw - 1, iy + ih - 1]]);
    return { path: geoPath(p), project: p, insetPath: geoPath(q), inset: { x: ix, y: iy, w: iw, h: ih } };
  }, [W, H, narrow, geo, southSea]);

  // 数据按省份对齐
  const byAd = useMemo(() => {
    const mp = new Map<string, number>();
    if (!geo) return mp;
    for (const d of data) {
      const f = geo.provinces.find((p) => p.properties.adcode === d.name || p.properties.name === d.name || p.short === d.name || p.properties.name.startsWith(d.name));
      if (f && Number.isFinite(d.value)) mp.set(f.properties.adcode, d.value);
    }
    return mp;
  }, [data, geo]);
  const values = [...byAd.values()];
  const lo = values.length ? Math.min(0, ...values) : 0, hi = values.length ? Math.max(...values) : 1;
  const k = Math.max(3, Math.min(7, classes));
  const quant = useMemo(() => scaleQuantize<number>().domain([lo, hi || 1]).nice(k).range(Array.from({ length: k }, (_, i) => i)), [lo, hi, k]);
  const [q0, q1] = quant.domain();
  const step = (q1 - q0) / k;
  const shade = (i: number) => `color-mix(in oklab, var(--chart-1) ${Math.round(18 + (i / (k - 1)) * 82)}%, var(--muted))`;
  const fillOf = (ad: string) => (mode === "fill" && byAd.has(ad) ? shade(quant(byAd.get(ad)!)) : "var(--muted)");
  // 省份数据消失后又回来时换一个 key, 不复用还没退场完的旧气泡 (复用时 motion 不会重新播放进入动画)
  const gens = useRef(new Map<string, { gen: number; present: boolean }>());
  for (const [ad, g] of gens.current) if (!byAd.has(ad) || mode !== "bubble") g.present = false;
  if (mode === "bubble") for (const ad of byAd.keys()) {
    const g = gens.current.get(ad);
    if (!g) gens.current.set(ad, { gen: 0, present: true });
    else if (!g.present) { g.gen++; g.present = true; }
  }
  const rScale = useMemo(() => scaleSqrt().domain([0, Math.max(1e-9, hi)]).range([0, narrow ? 14 : 22]), [hi, narrow]);

  // 交互
  const [hover, setHover] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const [selfSel, setSelfSel] = useState<string | null>(null);
  const sel = selectedProp !== undefined ? selectedProp : selfSel;
  const select = (ad: string | null) => { if (selectedProp === undefined) setSelfSel(ad); onSelect?.(ad ? geo?.provinces.find((p) => p.properties.adcode === ad)?.properties.name ?? null : null); };
  const [legendHover, setLegendHover] = useState<number | null>(null);
  const active = hover ?? focus;
  const svgRef = useRef<SVGSVGElement>(null);
  const [ptr, setPtr] = useState<[number, number] | null>(null);

  const centers = useMemo(() => {
    const mp = new Map<string, [number, number]>();
    geo?.provinces.forEach((f) => {
      const c = f.properties.cx != null ? project([f.properties.cx, f.properties.cy!]) : null;
      if (c) mp.set(f.properties.adcode, c as [number, number]);
    });
    return mp;
  }, [geo, project]);

  const ordered = useMemo(() => geo ? [...geo.provinces].sort((a, b) => (byAd.get(b.properties.adcode) ?? -Infinity) - (byAd.get(a.properties.adcode) ?? -Infinity)) : [], [geo, byAd]);
  const tabAd = focus ?? sel ?? ordered[0]?.properties.adcode;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!geo || !tabAd) return;
    const dir = ({ ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] } as Record<string, [number, number]>)[e.key];
    let next: string | null = null;
    if (dir) {
      const c = centers.get(tabAd); if (!c) return;
      let best = Infinity;
      for (const [ad, p] of centers) {
        if (ad === tabAd) continue;
        const dx = p[0] - c[0], dy = p[1] - c[1];
        const along = dx * dir[0] + dy * dir[1];
        if (along <= 1) continue;
        const across = Math.abs(dx * dir[1] - dy * dir[0]);
        const score = along + across * 2.2;
        if (score < best) { best = score; next = ad; }
      }
    } else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(sel === tabAd ? null : tabAd); return; }
    else if (e.key === "Escape") { select(null); return; }
    else if (e.key === "Home") next = ordered[0]?.properties.adcode;
    else if (e.key === "End") next = ordered[ordered.length - 1]?.properties.adcode;
    if (!next) return;
    e.preventDefault();
    setFocus(next);
    svgRef.current?.querySelector<SVGPathElement>(`path[data-k="${next}"]`)?.focus();
  };

  const nameOf = (ad: string) => geo?.provinces.find((p) => p.properties.adcode === ad);
  const rankOf = (ad: string) => (byAd.has(ad) ? ordered.findIndex((p) => p.properties.adcode === ad) + 1 : null);
  const describe = (f: Prov) => {
    const v = byAd.get(f.properties.adcode);
    return v == null ? `${f.properties.name}，暂无数据` : `${f.properties.name}，${metric} ${format(v)}${unit}，第 ${rankOf(f.properties.adcode)} 名`;
  };
  const tipF = active ? nameOf(active) : null;
  const tipXY = tipF ? (hover && ptr ? ptr : centers.get(tipF.properties.adcode) ?? null) : null;

  const rankRows = ordered.filter((p) => byAd.has(p.properties.adcode)).slice(0, ranking);
  const maxV = Math.max(1e-9, hi);
  const tr = reduced ? { duration: 0.2 } : { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <div ref={box} className={cn("w-full", className)}>
      {width > 0 && (
        <div className={cn("grid gap-4", side && "grid-cols-[1fr_196px]")}>
          <div className="relative" style={{ width: W, height: H, marginBottom: narrow && mode === "fill" && byAd.size > 0 ? 56 : 0 }} onPointerLeave={() => { setHover(null); setPtr(null); }}>
            {!geo && <div className="absolute inset-0 animate-pulse rounded-lg bg-muted/40" aria-hidden />}
            {geo && (
              <m.svg ref={svgRef} width={W} height={H} className="block overflow-visible" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}
                role="group" aria-roledescription="地图" aria-label={`${ariaLabel}，${byAd.size} 个省级行政区有数据。方向键按方位移动，回车选中`}
                onKeyDown={onKeyDown}
                onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setPtr([e.clientX - r.left, e.clientY - r.top]); }}>
                {/* 省份 */}
                <g>
                  {geo.provinces.map((f) => {
                    const ad = f.properties.adcode;
                    const has = byAd.has(ad);
                    const inClass = legendHover != null ? has && quant(byAd.get(ad)!) === legendHover : true;
                    const isSel = sel === ad;
                    return (
                      <path key={ad} data-k={ad} d={path(f) ?? undefined} role="img" aria-label={describe(f)}
                        tabIndex={ad === tabAd ? 0 : -1}
                        onPointerEnter={() => setHover(ad)} onPointerLeave={() => setHover((h) => (h === ad ? null : h))}
                        onFocus={() => setFocus(ad)} onBlur={() => setFocus((x) => (x === ad ? null : x))}
                        onClick={() => select(isSel ? null : ad)}
                        className="cursor-pointer outline-none"
                        style={{
                          fill: fillOf(ad),
                          fillOpacity: inClass ? (sel && !isSel ? 0.55 : 1) : 0.25,
                          transition: "fill 300ms ease, fill-opacity 200ms ease",
                        }} />
                    );
                  })}
                </g>
                {/* 省界 + 九段线 (主图里只露出北端) */}
                <path d={path(geo.borders) ?? undefined} fill="none" stroke="var(--background)" strokeWidth={0.7} pointerEvents="none" aria-hidden />
                {/* 选中/悬停的省份描边画在最上面, 不被邻省压住 */}
                {[active, sel].filter((x, i, a) => x && a.indexOf(x) === i).map((ad) => {
                  const f = nameOf(ad!); return f ? <path key={`hl-${ad}`} d={path(f) ?? undefined} fill="none" stroke="var(--foreground)" strokeWidth={ad === sel ? 1.6 : 1.2} pointerEvents="none" aria-hidden /> : null;
                })}

                {/* 气泡 */}
                <g aria-hidden pointerEvents="none">
                  <AnimatePresence initial={false}>
                    {mode === "bubble" && [...byAd].map(([ad, v]) => {
                      const c = centers.get(ad); if (!c) return null;
                      const dim = (sel && sel !== ad) || (legendHover != null && quant(v) !== legendHover);
                      return (
                        // 进场用 CSS 关键帧 (hx-pop-in), 退场用 motion 缩回, 数值变化时半径走 CSS transition
                        <m.circle key={`${ad}:${gens.current.get(ad)?.gen ?? 0}`} data-b={ad} cx={c[0]} cy={c[1]} className="hx-pop-in"
                          initial={false}
                          animate={{ opacity: dim ? 0.3 : 1 }}
                          exit={reduced ? { opacity: 0 } : { scale: 0, opacity: 0 }}
                          transition={tr}
                          style={{ r: rScale(v), transformBox: "fill-box", transformOrigin: "center", transition: reduced ? "none" : "r 350ms cubic-bezier(0.22, 1, 0.36, 1)" }}
                          fill="var(--chart-1)" fillOpacity={0.5} stroke="var(--background)" strokeWidth={1} />
                      );
                    })}
                  </AnimatePresence>
                </g>

                {/* 省名 */}
                {showLabels && (
                  <g aria-hidden pointerEvents="none">
                    {geo.provinces.map((f) => {
                      const c = centers.get(f.properties.adcode); if (!c) return null;
                      const b = path.bounds(f), bw = b[1][0] - b[0][0], bh = b[1][1] - b[0][1];
                      if (bw < (narrow ? 34 : 26) || bh < 12) return null;
                      const dark = mode === "fill" && byAd.has(f.properties.adcode) && quant(byAd.get(f.properties.adcode)!) >= k - 2;
                      return (
                        <text key={f.properties.adcode} x={c[0]} y={c[1] + (mode === "bubble" ? 0 : 0)} dy="0.32em" textAnchor="middle"
                          className={cn("text-[10px] transition-[fill] duration-300", dark ? "fill-white" : "fill-foreground/75")}
                          stroke={dark ? "none" : "var(--background)"} strokeOpacity={0.6} strokeWidth={2} paintOrder="stroke">
                          {f.short}
                        </text>
                      );
                    })}
                  </g>
                )}

                {/* 南海诸岛小图 */}
                {southSea && (
                  <g aria-label="南海诸岛" role="img">
                    <rect x={inset.x} y={inset.y} width={inset.w} height={inset.h} fill="var(--background)" stroke="var(--border)" />
                    {geo.provinces.map((f) => <path key={f.properties.adcode} d={insetPath(f) ?? undefined} style={{ fill: fillOf(f.properties.adcode), transition: "fill 300ms ease" }} stroke="var(--muted-foreground)" strokeOpacity={0.5} strokeWidth={0.5} />)}
                    {geo.nine && <path d={insetPath(geo.nine) ?? undefined} fill="var(--foreground)" fillOpacity={0.7} stroke="var(--foreground)" strokeOpacity={0.7} strokeWidth={0.8} strokeLinejoin="round" />}
                    <text x={inset.x + inset.w - 4} y={inset.y + inset.h - 5} textAnchor="end" className="fill-muted-foreground text-[9px]">南海诸岛</text>
                  </g>
                )}
              </m.svg>
            )}

            {/* 提示 */}
            <div aria-hidden
              className={cn("pointer-events-none absolute top-0 left-0 z-10 min-w-32 rounded-lg border bg-popover/95 px-3 py-2 text-xs shadow-float backdrop-blur transition-opacity duration-150", tipF && tipXY ? "opacity-100" : "opacity-0")}
              style={tipF && tipXY ? { transform: `translate(${Math.max(0, Math.min(W - 150, tipXY[0] + (tipXY[0] > W * 0.6 ? -160 : 14)))}px, ${Math.max(0, Math.min(H - 64, tipXY[1] - 30))}px)` } : undefined}>
              {tipF && (
                <>
                  <p className="font-medium">{tipF.properties.name}</p>
                  {byAd.has(tipF.properties.adcode) ? (
                    <>
                      <p className="mt-1 flex justify-between gap-4 text-muted-foreground"><span>{metric}</span><span className="font-mono text-foreground tabular-nums">{format(byAd.get(tipF.properties.adcode)!)}{unit}</span></p>
                      <p className="flex justify-between gap-4 text-muted-foreground"><span>排名</span><span className="font-mono text-foreground tabular-nums">{rankOf(tipF.properties.adcode)} / {byAd.size}</span></p>
                    </>
                  ) : <p className="mt-1 text-muted-foreground">暂无数据</p>}
                </>
              )}
            </div>

            {/* 图例 */}
            {mode === "fill" && byAd.size > 0 && (
              <div className={cn("absolute flex gap-1", narrow ? "top-full right-0 left-0 mt-2 flex-row flex-wrap" : "bottom-1 left-1 flex-col")} role="group" aria-label="色阶图例，悬停查看该档省份">
                {Array.from({ length: k }, (_, i) => k - 1 - i).map((i) => {
                  const count = values.filter((v) => quant(v) === i).length;
                  return (
                    <button key={i} type="button" onPointerEnter={() => setLegendHover(i)} onPointerLeave={() => setLegendHover(null)} onFocus={() => setLegendHover(i)} onBlur={() => setLegendHover(null)}
                      aria-label={`${format(q0 + step * i)}–${format(q0 + step * (i + 1))}${unit}，${count} 个省份`}
                      className={cn("flex items-center gap-1.5 rounded px-1 text-[10px] text-muted-foreground transition-opacity duration-150 hover:text-foreground", legendHover != null && legendHover !== i && "opacity-50")}>
                      <span className="h-2.5 w-4 rounded-[2px] transition-[background-color] duration-300" style={{ background: shade(i) }} />
                      <span className="font-mono tabular-nums">{format(q0 + step * i)}–{format(q0 + step * (i + 1))}</span>
                    </button>
                  );
                })}
                <span className="flex items-center gap-1.5 px-1 text-[10px] text-muted-foreground"><span className="h-2.5 w-4 rounded-[2px] bg-muted" />暂无数据</span>
              </div>
            )}
          </div>

          {/* 排行 */}
          {ranking > 0 && rankRows.length > 0 && (
            <div className={cn(!side && "mt-1")}>
              <p className="mb-2 text-xs text-muted-foreground">{metric}前 {Math.min(ranking, rankRows.length)} 名</p>
              <ol className="relative space-y-0.5">
                <AnimatePresence initial={false}>
                  {rankRows.map((f, i) => {
                    const ad = f.properties.adcode, v = byAd.get(ad)!;
                    return (
                      <m.li key={ad} layout={reduced ? false : "position"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }}
                        transition={{ layout: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 0.2 } }}>
                        <button type="button" onClick={() => select(sel === ad ? null : ad)} onPointerEnter={() => setHover(ad)} onPointerLeave={() => setHover(null)}
                          aria-pressed={sel === ad}
                          className={cn("group relative flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs transition-colors duration-150 hover:bg-accent", (sel === ad || active === ad) && "bg-accent")}>
                          <span className="w-4 font-mono text-muted-foreground tabular-nums">{i + 1}</span>
                          <span className="w-12 truncate">{f.short}</span>
                          <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <m.span className="absolute inset-y-0 left-0 rounded-full bg-[var(--chart-1)]" initial={false} animate={{ width: `${(v / maxV) * 100}%` }} transition={reduced ? { duration: 0 } : { duration: 0.35 }} />
                          </span>
                          <span className="w-14 text-right font-mono tabular-nums">{format(v)}</span>
                        </button>
                      </m.li>
                    );
                  })}
                </AnimatePresence>
              </ol>
            </div>
          )}
        </div>
      )}
      <table className="sr-only">
        <caption>{ariaLabel}</caption>
        <thead><tr><th scope="col">省份</th><th scope="col">{metric}</th></tr></thead>
        <tbody>{ordered.filter((p) => byAd.has(p.properties.adcode)).map((p) => <tr key={p.properties.adcode}><td>{p.properties.name}</td><td>{format(byAd.get(p.properties.adcode)!)}{unit}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
