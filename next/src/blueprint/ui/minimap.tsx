"use client";

import { useEffect, useMemo, useRef } from "react";
import { boundsOf, nodeBox } from "../size";
import type { BlueprintGraph } from "../types";
import type { BlueprintEditor } from "./editor";

/**
 * Optional overview (not stock UE, opt-in via `minimap`). Node boxes re-render with the graph;
 * the viewport frame follows pan / zoom imperatively. Click or drag to move the view there.
 */

const W = 180;
const H = 120;

export function Minimap({ ed, graph }: { ed: BlueprintEditor; graph: BlueprintGraph }) {
  const frame = useRef<SVGRectElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const world = useMemo(() => {
    const boxes = [...graph.nodes.map((n) => nodeBox(n, ed.registry, graph)), ...(graph.comments ?? [])];
    const b = boxes.length ? boundsOf(boxes) : { x: 0, y: 0, w: 400, h: 300 };
    const pad = 80;
    const box = { x: b.x - pad, y: b.y - pad, w: b.w + pad * 2, h: b.h + pad * 2 };
    const s = Math.min(W / box.w, H / box.h);
    return { box, s, ox: (W - box.w * s) / 2, oy: (H - box.h * s) / 2 };
  }, [ed, graph]);

  useEffect(() => {
    const paint = () => {
      const el = frame.current;
      const host = ed.el;
      if (!el || !host) return;
      const a = ed.toGraph(0, 0);
      const b = ed.toGraph(host.clientWidth, host.clientHeight);
      el.setAttribute("x", String(world.ox + (a.x - world.box.x) * world.s));
      el.setAttribute("y", String(world.oy + (a.y - world.box.y) * world.s));
      el.setAttribute("width", String(Math.max(2, (b.x - a.x) * world.s)));
      el.setAttribute("height", String(Math.max(2, (b.y - a.y) * world.s)));
    };
    paint();
    return ed.onViewport(paint);
  }, [ed, world]);

  const moveTo = (e: React.PointerEvent) => {
    const r = svg.current!.getBoundingClientRect();
    const gx = world.box.x + (e.clientX - r.left - world.ox) / world.s;
    const gy = world.box.y + (e.clientY - r.top - world.oy) / world.s;
    const host = ed.el;
    const z = ed.viewport.z;
    if (host) ed.setViewport({ x: host.clientWidth / 2 - gx * z, y: host.clientHeight / 2 - gy * z, z });
  };

  return (
    <svg ref={svg} data-bp-overlay width={W} height={H} role="img" aria-label="缩略图"
      className="absolute right-2 bottom-2 z-20 hidden rounded-lg border bg-popover/85 shadow-soft backdrop-blur sm:block"
      onPointerDown={(e) => { e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); moveTo(e); }}
      onPointerMove={(e) => { if (e.buttons & 1) moveTo(e); }}>
      {(graph.comments ?? []).map((c) => (
        <rect key={c.id} x={world.ox + (c.x - world.box.x) * world.s} y={world.oy + (c.y - world.box.y) * world.s}
          width={c.w * world.s} height={c.h * world.s} rx="2" fill="var(--muted)" />
      ))}
      {graph.nodes.map((n) => {
        const b = nodeBox(n, ed.registry, graph);
        return <rect key={n.id} x={world.ox + (b.x - world.box.x) * world.s} y={world.oy + (b.y - world.box.y) * world.s}
          width={Math.max(2, b.w * world.s)} height={Math.max(2, b.h * world.s)} rx="1.5" fill="var(--muted-foreground)" opacity="0.6" />;
      })}
      <rect ref={frame} fill="none" stroke="var(--bp-selected)" strokeWidth="1.5" rx="2" />
    </svg>
  );
}
