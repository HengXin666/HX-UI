"use client";

import { AnimatePresence, m } from "motion/react";
import { hierarchy, partition, type HierarchyRectangularNode } from "d3-hierarchy";
import { arc as d3arc } from "d3-shape";
import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "@/motion/use-reduced-motion";
import { cn } from "@/lib/utils";

export interface SunburstNode {
  name: string;
  /** 叶子的值; 有 children 时忽略, 自动求和 */
  value?: number;
  children?: SunburstNode[];
}

export interface SunburstProps {
  /** 根节点, 根本身不画 (显示在圆心) */
  data: SunburstNode;
  /** 同时显示几圈 */
  maxDepth?: number;
  /** 图的直径上限, 实际按容器宽度缩 */
  size?: number;
  /** 扇区里写名字 (放得下才写) */
  showLabels?: boolean;
  /** 同级按值从大到小 */
  sort?: boolean;
  format?: (v: number) => string;
  unit?: string;
  ariaLabel?: string;
  className?: string;
  /** 下钻 / 返回时回调当前所在的路径 */
  onDrill?: (path: string[]) => void;
}

type N = HierarchyRectangularNode<SunburstNode>;
interface Arc { a0: number; a1: number; r0: number; r1: number; o: number }
interface Meta { key: string; name: string; path: string[]; value: number; depth: number; top: string; hasKids: boolean; parent: string | null }

const TAU = Math.PI * 2;
const pathOf = (n: N) => n.ancestors().reverse().slice(1).map((a) => a.data.name);
const keyOf = (n: N) => pathOf(n).join("\u203a") || "__root";
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * 旭日图: 层级占比 (区域 › 省 › 市, 产品线 › 服务 › 资源).
 * 点扇区下钻, 点圆心或面包屑返回. 增删改数据时扇区从所在位置展开 / 收拢, 其余扇区挪位让开.
 * 方向键: 左右换同级, Enter / 下 进入, Esc / 上 返回上一级.
 */
export function Sunburst({
  data, maxDepth = 3, size = 420, showLabels = true, sort = true,
  format = (v) => v.toLocaleString("zh-CN", { maximumFractionDigits: 1 }), unit = "", ariaLabel = "旭日图", className, onDrill,
}: SunburstProps) {
  const reduced = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  const D = Math.max(160, Math.min(size, width));
  const outer = D / 2 - 4, hole = outer * 0.3;

  // 布局
  const root = useMemo(() => {
    const h = hierarchy(data).sum((d) => (d.children?.length ? 0 : Math.max(0, d.value ?? 0)));
    if (sort) h.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
    return partition<SunburstNode>().size([1, 1])(h);
  }, [data, sort]);
  const nodes = useMemo(() => root.descendants(), [root]);
  const byKey = useMemo(() => new Map(nodes.map((n) => [keyOf(n), n])), [nodes]);

  // 顶层配色按首次出现的顺序固定, 删掉一个分支别的分支不换色
  const colors = useRef(new Map<string, number>());
  for (const c of root.children ?? []) if (!colors.current.has(c.data.name)) colors.current.set(c.data.name, colors.current.size);
  // 下钻后按当前层的第一圈分色, 不然整圈都是同一个颜色
  const branchColors = useRef(new Map<string, number>());
  const branch = (mt: Meta) => {
    const z = zoom!.depth;
    if (z === 0) return mt.top;
    const k = mt.path.slice(0, z + 1).join("\u203a");
    if (!branchColors.current.has(k)) { const i = (zoom!.children ?? []).findIndex((c) => keyOf(c) === k); if (i >= 0) branchColors.current.set(k, i); }
    return k;
  };
  const fillOf = (top: string, depth: number) => {
    const i = (colors.current.get(top) ?? branchColors.current.get(top) ?? 0) % 5;
    return `color-mix(in oklch, var(--chart-${i + 1}) ${Math.max(40, 100 - (Math.max(1, depth) - 1) * 20)}%, var(--background))`;
  };

  // 当前下钻位置 (路径 key); 数据变了路径不在了就退到最近的祖先
  const [zoomKey, setZoomKey] = useState("__root");
  let zoom = byKey.get(zoomKey);
  if (!zoom) {
    const parts = zoomKey.split("\u203a");
    while (parts.length && !zoom) { parts.pop(); zoom = byKey.get(parts.join("\u203a") || "__root"); }
    zoom ??= root;
  }
  const zk = keyOf(zoom);
  useEffect(() => { if (zk !== zoomKey) setZoomKey(zk); }, [zk, zoomKey]);
  const drill = (n: N) => { const k = keyOf(n); setZoomKey(k); onDrill?.(pathOf(n)); };

  // 下钻到浅的分支时圈数变少, 每圈加宽占满, 不留空白外圈
  const levels = Math.max(1, Math.min(maxDepth, zoom!.height));
  const ring = (outer - hole) / levels;
  const target = useMemo(() => {
    const t = new Map<string, Arc>();
    const span = zoom!.x1 - zoom!.x0 || 1;
    for (const n of nodes) {
      if (n === root) continue;
      const rel = n.depth - zoom!.depth;
      const a0 = Math.max(0, Math.min(1, (n.x0 - zoom!.x0) / span)) * TAU;
      const a1 = Math.max(0, Math.min(1, (n.x1 - zoom!.x0) / span)) * TAU;
      const inside = n.x0 >= zoom!.x0 - 1e-9 && n.x1 <= zoom!.x1 + 1e-9;
      if (rel >= 1 && !inside) t.set(keyOf(n), { a0, a1, r0: hole + (Math.min(rel, levels) - 1) * ring, r1: hole + Math.min(rel, levels) * ring, o: 0 });
      else if (rel < 1) t.set(keyOf(n), { a0, a1, r0: hole * 0.98, r1: hole * 0.98, o: 0 });
      else if (rel > levels) t.set(keyOf(n), { a0, a1, r0: outer, r1: outer, o: 0 });
      else t.set(keyOf(n), { a0, a1, r0: hole + (rel - 1) * ring, r1: hole + rel * ring, o: 1 });
    }
    return t;
  }, [nodes, root, zoom, hole, outer, ring, levels]);

  // 元数据, 退场的扇区也要留着画完
  const meta = useRef(new Map<string, Meta>());
  for (const n of nodes) {
    if (n === root) continue;
    const p = pathOf(n);
    meta.current.set(keyOf(n), { key: keyOf(n), name: n.data.name, path: p, value: n.value ?? 0, depth: n.depth, top: p[0], hasKids: !!n.children?.length, parent: n.parent && n.parent !== root ? keyOf(n.parent) : null });
  }

  // 补间: 每次目标变了, 从当前画面补到新目标. 新扇区从起始角展开, 删掉的收拢到起始角
  const [frame, setFrame] = useState<Map<string, Arc>>(() => new Map());
  const cur = useRef(frame);
  cur.current = frame;
  const first = useRef(true);
  useLayoutEffect(() => {
    const from = new Map(cur.current);
    const to = new Map(target);
    for (const [k, a] of target) if (!from.has(k)) {
      // 新扇区: 父级里挤出一条缝, 从缝里长出来
      from.set(k, first.current ? { a0: 0, a1: 0, r0: a.r0, r1: a.r1, o: a.o } : { ...a, a1: a.a0, o: reduced ? 0 : a.o });
    }
    for (const [k, a] of from) if (!to.has(k)) to.set(k, { ...a, a1: a.a0, o: 0 });
    first.current = false;
    if (reduced) {
      // 减少动态: 不挪不转, 只淡入淡出
      for (const [k, a] of [...to]) {
        const f = from.get(k)!;
        if (!target.has(k)) to.set(k, { ...f, o: 0 });
        else from.set(k, { ...a, o: f.o });
      }
    }
    const dur = reduced ? 200 : from.size && [...from.values()].every((a) => a.a1 === 0) ? 700 : 480;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur), e = ease(t);
      const f = new Map<string, Arc>();
      for (const [k, b] of to) {
        const a = from.get(k) ?? b;
        f.set(k, { a0: lerp(a.a0, b.a0, e), a1: lerp(a.a1, b.a1, e), r0: lerp(a.r0, b.r0, e), r1: lerp(a.r1, b.r1, e), o: lerp(a.o, b.o, e) });
      }
      if (t >= 1) for (const k of [...f.keys()]) if (!target.has(k)) f.delete(k);
      setFrame(f);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, reduced]);

  // 交互
  const [hover, setHover] = useState<string | null>(null);
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const active = hover ?? focusKey;
  const activeMeta = active ? meta.current.get(active) : undefined;
  const activePath = new Set<string>();
  if (activeMeta) { let k: string | null = activeMeta.key; while (k) { activePath.add(k); k = meta.current.get(k)?.parent ?? null; } }
  const visible = [...target].filter(([, a]) => a.o > 0 && a.a1 - a.a0 > 0.0001).map(([k]) => byKey.get(k)!).filter(Boolean);
  const firstRing = visible.filter((n) => n.depth === zoom!.depth + 1);
  const tabKey = focusKey && target.get(focusKey)?.o ? focusKey : firstRing[0] ? keyOf(firstRing[0]) : null;
  const svgRef = useRef<SVGSVGElement>(null);
  // 下钻时目标扇区要等补间把它画出来, 所以多试几帧
  const focusEl = (k: string) => {
    setFocusKey(k);
    let tries = 0;
    const go = () => {
      const el = svgRef.current?.querySelector<SVGGElement>(`g[data-k="${CSS.escape(k)}"][role=img]`);
      if (el) { el.focus(); if (document.activeElement === el) return; }
      if (++tries < 60) requestAnimationFrame(go);
    };
    requestAnimationFrame(go);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const n = tabKey ? byKey.get(tabKey) : undefined;
    if (!n) return;
    const sibs = (n.parent?.children ?? []).filter((s) => target.get(keyOf(s))?.o);
    const i = sibs.indexOf(n);
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const j = (i + (e.key === "ArrowRight" ? 1 : -1) + sibs.length) % sibs.length;
      focusEl(keyOf(sibs[j]));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const c = n.children?.find((s) => target.get(keyOf(s))?.o);
      if (c) focusEl(keyOf(c));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (n.parent && n.parent !== zoom) focusEl(keyOf(n.parent));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (n.children?.length) { drill(n); const c = n.children[0]; focusEl(keyOf(c)); }
    } else if (e.key === "Escape" || e.key === "Backspace") {
      if (zoom !== root && zoom!.parent) { e.preventDefault(); const z = zoom!; drill(z.parent!); focusEl(keyOf(z)); }
    }
  };

  const arcGen = d3arc<Arc>().startAngle((d) => d.a0).endAngle((d) => d.a1).innerRadius((d) => d.r0).outerRadius((d) => Math.max(d.r0, d.r1 - 1.5))
    .padAngle((d) => Math.min((d.a1 - d.a0) / 2, 0.006)).padRadius(outer).cornerRadius(3);

  const total = zoom!.value ?? 0;
  const rootTotal = root.value ?? 0;
  const share = (v: number, of: number) => (of > 0 ? `${((v / of) * 100).toFixed(1)}%` : "—");
  const zoomPath = pathOf(zoom!);
  const crumbs = [{ key: "__root", name: data.name }, ...zoomPath.map((name, i) => ({ key: zoomPath.slice(0, i + 1).join("\u203a"), name }))];

  // 圆心: 悬停时显示该扇区, 否则当前层
  const center = activeMeta
    ? { title: activeMeta.name, value: activeMeta.value, sub: `占${zoom === root ? "总体" : zoom!.data.name} ${share(activeMeta.value, total)}` }
    : { title: zoom === root ? data.name : zoom!.data.name, value: total, sub: zoom === root ? `${root.children?.length ?? 0} 个分支` : `占总体 ${share(total, rootTotal)}` };

  const cx = D / 2, cy = D / 2;
  const keys = [...frame.keys()];
  // 父级先画, 子级盖在外圈
  keys.sort((a, b) => (meta.current.get(a)?.depth ?? 0) - (meta.current.get(b)?.depth ?? 0));

  return (
    <div ref={box} className={cn("relative w-full", className)}>
      {/* 面包屑 */}
      <nav aria-label="旭日图层级" className="mb-3 flex min-h-7 flex-wrap items-center gap-1 text-[13px]">
        <AnimatePresence initial={false} mode="popLayout">
          {crumbs.map((c, i) => (
            <m.span key={c.key} layout={!reduced} initial={{ opacity: 0, x: reduced ? 0 : -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden className="text-muted-foreground/60">›</span>}
              {i < crumbs.length - 1 ? (
                <button type="button" onClick={() => drill(c.key === "__root" ? root : byKey.get(c.key)!)} className="rounded-md px-1.5 py-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">{c.name}</button>
              ) : (
                <span aria-current="location" className="px-1.5 py-0.5 font-medium">{c.name}</span>
              )}
            </m.span>
          ))}
        </AnimatePresence>
      </nav>

      {width > 0 && (
        <div className="relative mx-auto" style={{ width: D, height: D }}>
          <svg ref={svgRef} width={D} height={D} role="group" aria-roledescription="旭日图" className="block overflow-visible"
            aria-label={`${ariaLabel}，当前 ${crumbs.map((c) => c.name).join(" › ")}，合计 ${format(total)}${unit}。左右键换同级，下键进入外圈，回车下钻，Esc 返回`}
            onKeyDown={onKeyDown}>
            <g transform={`translate(${cx},${cy})`}>
              {keys.map((k) => {
                const a = frame.get(k)!, mt = meta.current.get(k);
                const live = target.get(k)?.o === 1;
                // 刚进场的扇区透明度从 0 起也要先挂上 DOM, 焦点和读屏能立刻找到它
                if (!mt || (!live && a.o < 0.01) || a.a1 - a.a0 < 0.0005 && !live) return null;
                const dim = activeMeta && !activePath.has(k);
                const mid = (a.a0 + a.a1) / 2, rm = (a.r0 + a.r1) / 2;
                const arcLen = (a.a1 - a.a0) * rm, thick = a.r1 - a.r0;
                const fits = showLabels && arcLen > 30 && thick > 18;
                const maxChars = Math.floor((thick - 10) / 11.5);
                // 放不下两个字就不写, 一个字加省略号没法读
                const label = mt.name.length <= maxChars ? mt.name : maxChars >= 3 ? `${mt.name.slice(0, maxChars - 1)}…` : null;
                const deg = (mid * 180) / Math.PI;
                return (
                  <g key={k} data-k={k} role={live ? "img" : undefined} aria-hidden={live ? undefined : true}
                    tabIndex={live ? (k === tabKey ? 0 : -1) : undefined}
                    aria-label={live ? `${mt.path.join(" › ")}，${format(mt.value)}${unit}，占上级 ${share(mt.value, (byKey.get(k)?.parent?.value) ?? 0)}，占总体 ${share(mt.value, rootTotal)}${mt.hasKids ? "，可下钻" : ""}` : undefined}
                    onPointerEnter={() => live && setHover(k)}
                    onPointerLeave={() => setHover((h) => (h === k ? null : h))}
                    onFocus={() => setFocusKey(k)}
                    onBlur={() => setFocusKey((f) => (f === k ? null : f))}
                    onClick={() => { const n = byKey.get(k); if (n?.children?.length) drill(n); }}
                    className={cn("outline-none transition-opacity duration-200 focus-visible:[&>path]:stroke-[var(--ring)]", mt.hasKids && live ? "cursor-pointer" : "cursor-default")}
                    style={{ opacity: a.o * (dim ? 0.35 : 1) }}>
                    <path d={arcGen(a) ?? undefined} style={{ fill: fillOf(branch(mt), mt.depth - zoom!.depth), transition: "fill 250ms" }} stroke="var(--background)" strokeWidth={1} />
                    {fits && label && (
                      <text transform={`rotate(${deg - 90}) translate(${rm},0) rotate(${deg < 180 ? 0 : 180})`} dy="0.32em" textAnchor="middle"
                        className="pointer-events-none fill-foreground text-[11px]">
                        {label}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* 圆心: 点一下返回上一级 */}
          <button type="button" disabled={zoom === root}
            onClick={() => zoom!.parent && drill(zoom!.parent)}
            data-center={zoom === root ? "root" : "back"}
            className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full text-center transition-colors enabled:cursor-pointer enabled:hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-default"
            style={{ width: hole * 1.86, height: hole * 1.86 }}>
            {zoom !== root && <span className="sr-only">返回{zoom!.parent === root ? data.name : zoom!.parent!.data.name}，当前</span>}
            <AnimatePresence mode="wait" initial={false}>
              <m.span key={center.title} initial={{ opacity: 0, y: reduced ? 0 : 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : -4 }} transition={{ duration: 0.15 }} className="flex flex-col items-center px-2">
                <span className="max-w-full truncate text-xs text-muted-foreground">{center.title}</span>
                <span className="font-mono text-lg font-semibold tabular-nums" style={{ fontSize: Math.max(13, Math.min(20, hole / 3.6)) }}>{format(center.value)}{unit && <span className="ml-0.5 text-[11px] font-normal text-muted-foreground">{unit.trim()}</span>}</span>
                <span className="text-[11px] text-muted-foreground">{center.sub}</span>
                {zoom !== root && !activeMeta && <span className="mt-0.5 text-[10px] text-muted-foreground/80">点此返回</span>}
              </m.span>
            </AnimatePresence>
          </button>
        </div>
      )}

      <table className="sr-only">
        <caption>{ariaLabel}</caption>
        <thead><tr><th scope="col">层级</th><th scope="col">数值</th><th scope="col">占总体</th></tr></thead>
        <tbody>{nodes.filter((n) => n !== root).map((n) => <Fragment key={keyOf(n)}><tr><td>{pathOf(n).join(" › ")}</td><td>{format(n.value ?? 0)}{unit}</td><td>{share(n.value ?? 0, rootTotal)}</td></tr></Fragment>)}</tbody>
      </table>
    </div>
  );
}
