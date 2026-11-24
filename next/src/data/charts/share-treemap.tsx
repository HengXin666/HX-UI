"use client";

import { AnimatePresence, m } from "motion/react";
import { hierarchy, treemap, treemapSquarify } from "d3-hierarchy";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "@/motion/use-reduced-motion";
import { cn } from "@/lib/utils";

export interface TreemapNode {
  name: string;
  value?: number;
  children?: TreemapNode[];
  /** 自定义颜色; 不给时顶层分组按首次出现的顺序取 --chart-1..5, 子项继承 */
  color?: string;
}

export interface ShareTreemapProps {
  /** 一层: 各项; 两层: 分组 + 子项, 同组同色 */
  data: TreemapNode[];
  format?: (v: number) => string;
  height?: number;
  className?: string;
  /** 整张图的读屏名称 */
  ariaLabel?: string;
}

interface Cell {
  /** 稳定键: 分组名/子项名, 动画按它配对 */
  k: string;
  name: string;
  group?: string;
  value: number;
  share: number;
  x: number; y: number; w: number; h: number;
  color: string;
}

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * 矩形树图: 面积即占比, 适合类目 / 品牌 / SKU 的结构 (比环形图装得下更多项).
 * 数据变化时按名字配对: 留下的格子滑到新位置并改变大小, 新格子从中心放大出现, 删掉的缩小淡出.
 */
export function ShareTreemap({ data, format = (v) => v.toLocaleString("zh-CN"), height = 300, className, ariaLabel = "矩形树图" }: ShareTreemapProps) {
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

  // 分组颜色按首次出现的顺序固定下来, 增删分组时其余分组不换色
  const colorOf = useRef(new Map<string, number>());
  const groupColor = (name: string, own?: string) => {
    if (own) return own;
    const map = colorOf.current;
    if (!map.has(name)) map.set(name, map.size);
    return `var(--chart-${(map.get(name)! % 5) + 1})`;
  };

  const nested = data.some((d) => d.children?.length);
  const cells = useMemo<Cell[]>(() => {
    if (!width) return [];
    const root = hierarchy<TreemapNode>({ name: "root", children: data }, (d) => d.children)
      .sum((d) => (d.children?.length ? 0 : Math.max(0, d.value ?? 0)))
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
    treemap<TreemapNode>().tile(treemapSquarify.ratio(4 / 3)).size([width, height]).paddingInner((n) => (n.depth === 0 && nested ? 5 : 2)).paddingOuter(0).round(true)(root);
    const total = root.value || 1;
    return root.leaves().filter((l) => l.depth > 0).map((l) => {
      const top = l.ancestors().find((a) => a.depth === 1)!;
      const n = l as typeof l & { x0: number; x1: number; y0: number; y1: number };
      return {
        k: nested ? `${top.data.name}/${l.data.name}` : l.data.name,
        name: l.data.name,
        group: nested ? top.data.name : undefined,
        value: l.value ?? 0,
        share: (l.value ?? 0) / total,
        x: n.x0, y: n.y0, w: Math.max(0, n.x1 - n.x0), h: Math.max(0, n.y1 - n.y0),
        color: l.data.color ?? groupColor(top.data.name, top.data.color),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, width, height, nested]);

  const tr = reduced ? { duration: 0.2 } : { duration: 0.42, ease: EASE };
  const tip = hover ? cells.find((c) => c.k === hover) : undefined;

  return (
    <div ref={box} className={cn("relative w-full", className)} style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="group" aria-label={ariaLabel} className="block overflow-visible">
          <AnimatePresence initial={!reduced}>
            {cells.map((c) => {
              const show = c.w > 54 && c.h > 30;
              return (
                <m.g
                  key={c.k}
                  data-k={c.k}
                  role="img"
                  tabIndex={0}
                  aria-label={`${c.group ? `${c.group} · ` : ""}${c.name}，${format(c.value)}，占 ${(c.share * 100).toFixed(1)}%`}
                  // 位置用 transform 滑动; 新格子在最终位置原地出现
                  initial={reduced ? { x: c.x, y: c.y, opacity: 0 } : { x: c.x, y: c.y, opacity: 0, scale: 0.6 }}
                  animate={{ x: c.x, y: c.y, opacity: hover && hover !== c.k ? 0.55 : 1, scale: 1 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
                  transition={tr}
                  style={{ transformBox: "fill-box", transformOrigin: "center" }}
                  onPointerEnter={() => setHover(c.k)}
                  onPointerLeave={() => setHover((h) => (h === c.k ? null : h))}
                  onFocus={() => setHover(c.k)}
                  onBlur={() => setHover((h) => (h === c.k ? null : h))}
                  className="cursor-default outline-none focus-visible:[&>rect]:stroke-foreground focus-visible:[&>rect]:stroke-2"
                >
                  <m.rect initial={{ width: c.w, height: c.h }} animate={{ width: c.w, height: c.h }} transition={tr} rx={6} fill={c.color} fillOpacity={0.88} />
                  <m.text x={9} y={19} fill="white" fontSize={12} fontWeight={600} initial={false} animate={{ opacity: show ? 1 : 0 }} transition={{ duration: 0.15 }} aria-hidden>
                    {c.name}
                  </m.text>
                  <m.text x={9} y={35} fill="white" fontSize={11} className="tabular-nums" initial={false} animate={{ opacity: show && c.h > 46 ? 0.8 : 0 }} transition={{ duration: 0.15 }} aria-hidden>
                    {format(c.value)}
                  </m.text>
                </m.g>
              );
            })}
          </AnimatePresence>
        </svg>
      )}
      <div
        aria-hidden
        className={cn("pointer-events-none absolute z-10 min-w-36 rounded-lg border bg-popover/95 px-3 py-2 text-xs shadow-float backdrop-blur transition-opacity duration-150", tip ? "opacity-100" : "opacity-0")}
        style={tip ? { left: Math.max(76, Math.min(width - 76, tip.x + tip.w / 2)), top: Math.max(0, tip.y + tip.h / 2), transform: "translate(-50%, 8px)" } : { left: 0, top: 0 }}
      >
        {tip && (
          <>
            <p className="font-medium">{tip.group ? `${tip.group} · ` : ""}{tip.name}</p>
            <p className="mt-1 flex justify-between gap-4 text-muted-foreground"><span>{format(tip.value)}</span><span className="tabular-nums">{(tip.share * 100).toFixed(1)}%</span></p>
          </>
        )}
      </div>
    </div>
  );
}
