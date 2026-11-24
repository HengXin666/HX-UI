"use client";

import { AnimatePresence, m } from "motion/react";
import { sankey, sankeyJustify, type SankeyLink, type SankeyNode } from "d3-sankey";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "@/motion/use-reduced-motion";
import { cn } from "@/lib/utils";

export interface SankeyFlowProps {
  /** 节点名同时是动画配对的键, 不要重名 */
  nodes: { name: string }[];
  /** source / target 是 nodes 的下标 */
  links: { source: number; target: number; value: number }[];
  format?: (v: number) => string;
  height?: number;
  className?: string;
  /** 整张图的读屏名称 */
  ariaLabel?: string;
}

type N = { name: string };
type L = { value: number };
interface NodeBox { k: string; name: string; value: number; depth: number; x: number; y: number; w: number; h: number; sink: boolean }
interface LinkPath { k: string; from: string; to: string; value: number; d: string; width: number; depth: number; mx: number; my: number }

const EASE = [0.22, 1, 0.36, 1] as const;
const color = (d = 0) => `var(--chart-${(d % 5) + 1})`;
// 固定段数的三次贝塞尔, 新旧路径数字个数相同, motion 才能逐个插值
const linkD = (x0: number, y0: number, x1: number, y1: number) => {
  const c = (x0 + x1) / 2;
  return `M${x0.toFixed(1)},${y0.toFixed(1)} C${c.toFixed(1)},${y0.toFixed(1)} ${c.toFixed(1)},${y1.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
};

/**
 * 桑基图: 流量从哪来到哪去 (渠道 → 落地页 → 成交, 预算分配). 节点按层上色.
 * 数据变化时节点按名字, 连线按 "起点→终点" 配对: 位置和粗细平滑过渡, 新节点和连线淡入, 删掉的淡出.
 */
export function SankeyFlow({ nodes, links, format = (v) => v.toLocaleString("zh-CN"), height = 320, className, ariaLabel = "桑基图" }: SankeyFlowProps) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const reduced = useReducedMotion();
  const [hover, setHover] = useState<string | null>(null);
  useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  // 窄容器 (手机) 只写节点名, 最后一层也写在右侧并预留边距
  const compact = width > 0 && width < 520;

  const { boxes, paths } = useMemo(() => {
    if (!width) return { boxes: [] as NodeBox[], paths: [] as LinkPath[] };
    const used = new Set(links.flatMap((l) => [l.source, l.target]));
    const keep = nodes.map((_, i) => i).filter((i) => used.has(i));
    const idx = new Map(keep.map((i, j) => [i, j]));
    const graph = sankey<N, L>()
      .nodeWidth(10).nodePadding(18).nodeAlign(sankeyJustify).iterations(48)
      .extent([[1, 8], [width - (compact ? 48 : 1), height - 8]])({
        nodes: keep.map((i) => ({ name: nodes[i].name })),
        links: links.filter((l) => l.value > 0).map((l) => ({ source: idx.get(l.source)!, target: idx.get(l.target)!, value: l.value })),
      });
    const boxes: NodeBox[] = graph.nodes.map((n: SankeyNode<N, L>) => ({
      k: n.name, name: n.name, value: n.value ?? 0, depth: n.depth ?? 0,
      x: n.x0 ?? 0, y: n.y0 ?? 0, w: (n.x1 ?? 0) - (n.x0 ?? 0), h: Math.max(1, (n.y1 ?? 0) - (n.y0 ?? 0)),
      sink: !(n.sourceLinks?.length),
    }));
    const paths: LinkPath[] = graph.links.map((l: SankeyLink<N, L>) => {
      const s = l.source as SankeyNode<N, L>, t = l.target as SankeyNode<N, L>;
      const x0 = s.x1 ?? 0, x1 = t.x0 ?? 0, y0 = l.y0 ?? 0, y1 = l.y1 ?? 0;
      return { k: `${s.name}→${t.name}`, from: s.name, to: t.name, value: l.value, d: linkD(x0, y0, x1, y1), width: Math.max(1, l.width ?? 1), depth: s.depth ?? 0, mx: (x0 + x1) / 2, my: (y0 + y1) / 2 };
    });
    return { boxes, paths };
  }, [nodes, links, width, height, compact]);

  const tr = reduced ? { duration: 0.2 } : { duration: 0.45, ease: EASE };
  // 悬停节点时高亮它的连线, 悬停连线时高亮这条
  const lit = (p: LinkPath) => !hover || hover === p.k || hover === p.from || hover === p.to;
  // 悬停时和它相连的节点保持不透明, 其余变淡
  const related = hover
    ? new Set([hover, ...paths.flatMap((p) => (p.k === hover ? [p.from, p.to] : p.from === hover ? [p.to] : p.to === hover ? [p.from] : []))])
    : null;
  const tipNode = boxes.find((b) => b.k === hover);
  const tipLink = paths.find((p) => p.k === hover);
  const tip = tipNode
    ? { x: tipNode.x + tipNode.w / 2, y: tipNode.y + tipNode.h / 2, title: tipNode.name, v: tipNode.value }
    : tipLink ? { x: tipLink.mx, y: tipLink.my, title: `${tipLink.from} → ${tipLink.to}`, v: tipLink.value } : null;
  const on = (k: string) => ({
    onPointerEnter: () => setHover(k),
    onPointerLeave: () => setHover((h) => (h === k ? null : h)),
    onFocus: () => setHover(k),
    onBlur: () => setHover((h) => (h === k ? null : h)),
  });

  return (
    <div ref={box} className={cn("relative w-full", className)} style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="group" aria-label={ariaLabel} className="block overflow-visible">
          <g fill="none">
            <AnimatePresence initial={!reduced}>
              {paths.map((p) => (
                <m.path
                  key={p.k} data-k={p.k} role="img" tabIndex={0} aria-label={`${p.from} 到 ${p.to}，${format(p.value)}`}
                  // 新连线直接画在终点位置再淡入, 不从别处飞过来
                  initial={{ opacity: 0, d: p.d, strokeWidth: p.width }}
                  animate={{ d: p.d, strokeWidth: p.width, opacity: 1, strokeOpacity: lit(p) ? (hover ? 0.55 : 0.28) : 0.08 }}
                  exit={{ opacity: 0 }}
                  transition={tr}
                  stroke={color(p.depth)}
                  className="cursor-default outline-none focus-visible:[stroke-opacity:0.7]"
                  {...on(p.k)}
                />
              ))}
            </AnimatePresence>
          </g>
          <AnimatePresence initial={!reduced}>
            {boxes.map((b) => {
              const right = !compact && b.sink;
              return (
                <m.g key={b.k} data-k={b.k} role="img" tabIndex={0} aria-label={`${b.name}，${format(b.value)}`}
                  initial={{ opacity: 0, x: b.x, y: b.y }} exit={{ opacity: 0 }} animate={{ opacity: related && !related.has(b.k) ? 0.45 : 1, x: b.x, y: b.y }}
                  transition={tr} className="cursor-default outline-none focus-visible:[&>rect]:stroke-foreground focus-visible:[&>rect]:stroke-2" {...on(b.k)}>
                  <m.rect width={b.w} initial={{ height: b.h }} animate={{ height: b.h }} transition={tr} rx={2} fill={color(b.depth)} />
                  <m.text initial={false} animate={{ y: b.h / 2 }} transition={tr} x={right ? -8 : b.w + 8} textAnchor={right ? "end" : "start"} dominantBaseline="middle" fontSize={12} className="fill-foreground" aria-hidden>
                    {b.name}{!compact && <tspan className="fill-muted-foreground tabular-nums"> {format(b.value)}</tspan>}
                  </m.text>
                </m.g>
              );
            })}
          </AnimatePresence>
        </svg>
      )}
      <div aria-hidden
        className={cn("pointer-events-none absolute z-10 min-w-36 rounded-lg border bg-popover/95 px-3 py-2 text-xs shadow-float backdrop-blur transition-opacity duration-150", tip ? "opacity-100" : "opacity-0")}
        style={tip ? { left: Math.max(76, Math.min(width - 76, tip.x)), top: tip.y, transform: "translate(-50%, 10px)" } : { left: 0, top: 0 }}>
        {tip && <div className="flex justify-between gap-4"><span className="font-medium">{tip.title}</span><span className="font-mono tabular-nums">{format(tip.v)}</span></div>}
      </div>
    </div>
  );
}
