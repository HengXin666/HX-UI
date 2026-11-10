"use client";
// 行为规格参照 docs/research/catalog/animations.md 的 PixelTrail 条目, 实现为 HX 自有.

import { useEffect, useRef, type JSX, type PointerEvent, type ReactNode } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { useFrameLoop } from "../../motion/frame/use-frame-loop";
import { prefersReducedMotion } from "../../primitives/motion";
import { cn } from "../../primitives/utils";
import { CELL, cellGrid, ditherThreshold, fillCount, moveForce, stampCells, type CellDecay, type CellShape, type TrailPoint } from "./cell";
import { TONE_CLASS, type SurfaceTone } from "./tone";

export interface CellTrailProps {
  readonly children?: ReactNode;
  /** 横向格数. */
  readonly gridSize?: number;
  /** 笔刷半径, 占宽度的比例. */
  readonly trailSize?: number;
  /** 每个轨迹点的寿命 ms. */
  readonly maxAge?: number;
  /** 快速移动时两点之间最多补几个点. */
  readonly interpolate?: number;
  /** 新鲜处的色调与陈旧处的色调 (语义 token); 不给 trailTone 时一色. */
  readonly tone?: SurfaceTone;
  readonly trailTone?: SurfaceTone;
  readonly shape?: CellShape;
  /** 格间隙, 占格宽的比例. */
  readonly gap?: number;
  /** 衰减方式: 变淡, 缩小, 或有序抖动. */
  readonly decay?: CellDecay;
  readonly glow?: number;
  /** 点击时向四周散开一圈. */
  readonly clickBurst?: boolean;
  readonly className?: string;
}

/**
 * 像素轨迹: 指针在区域里移动时, 网格里被笔刷扫过的格亮起, 按寿命包络先升后落; 快速移动时在两点间补点, 力度随位移增大.
 * 区域包住 children, 画布叠在上面 aria-hidden 且不接指针. 没有活点时停帧, 指针事件唤醒.
 * 减弱动效: 不画轨迹, 正文照常.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-pointer.md
 */
export function CellTrail({
  children,
  gridSize = CELL.gridSize,
  trailSize = CELL.trailSize,
  maxAge = CELL.maxAge,
  interpolate = CELL.interpolate,
  tone = "primary",
  trailTone,
  shape = "square",
  gap = CELL.gap,
  decay = "fade",
  glow = CELL.glow,
  clickBurst = false,
  className,
}: CellTrailProps): JSX.Element {
  const reduced = useReducedMotion();
  const still = reduced || prefersReducedMotion();
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const fresh = useRef<HTMLSpanElement>(null);
  const stale = useRef<HTMLSpanElement>(null);
  const s = useRef({ points: [] as TrailPoint[], last: null as null | { x: number; y: number }, field: new Float32Array(0), w: 0, h: 0, dpr: 1, ink: "", inkOld: "" });

  useEffect(() => {
    const el = host.current;
    const cv = canvas.current;
    if (still || !el || !cv) return undefined;
    const fit = (): void => {
      const st = s.current;
      st.dpr = Math.min(window.devicePixelRatio || 1, CELL.dprCap);
      st.w = el.clientWidth;
      st.h = el.clientHeight;
      cv.width = Math.max(1, Math.round(st.w * st.dpr));
      cv.height = Math.max(1, Math.round(st.h * st.dpr));
      st.ink = fresh.current ? getComputedStyle(fresh.current).color : "currentColor";
      st.inkOld = stale.current ? getComputedStyle(stale.current).color : st.ink;
    };
    fit();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(fit);
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [still, tone, trailTone]);

  const paint = (): void => {
    const st = s.current;
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    const g = cellGrid(st.w, st.h, gridSize);
    if (st.field.length !== g.cols * g.rows) st.field = new Float32Array(g.cols * g.rows);
    else st.field.fill(0);
    stampCells(st.field, g.cols, g.rows, g.cell, st.points, trailSize * g.cols, maxAge, CELL.riseShare);
    ctx.setTransform(st.dpr, 0, 0, st.dpr, 0, 0);
    ctx.clearRect(0, 0, st.w, st.h);
    ctx.shadowBlur = glow * g.cell * 0.6;
    const inset = (g.cell * Math.max(0, Math.min(0.9, gap))) / 2;
    for (let r = 0; r < g.rows; r += 1) {
      for (let c = 0; c < g.cols; c += 1) {
        const v = Math.min(1, st.field[r * g.cols + c]);
        if (v < CELL.minStrength) continue;
        if (decay === "dither" && v < ditherThreshold(c, r)) continue;
        const ink = trailTone && v < 0.5 ? st.inkOld : st.ink;
        ctx.fillStyle = ink;
        ctx.shadowColor = ink;
        ctx.globalAlpha = decay === "fade" ? v : 1;
        const k = decay === "shrink" ? v : 1;
        const half = (g.cell / 2 - inset) * k;
        const cx = (c + 0.5) * g.cell;
        const cy = (r + 0.5) * g.cell;
        ctx.beginPath();
        if (shape === "circle") ctx.arc(cx, cy, half, 0, Math.PI * 2);
        else if (shape === "diamond") {
          ctx.moveTo(cx, cy - half);
          ctx.lineTo(cx + half, cy);
          ctx.lineTo(cx, cy + half);
          ctx.lineTo(cx - half, cy);
          ctx.closePath();
        } else ctx.rect(cx - half, cy - half, half * 2, half * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  };

  const loop = useFrameLoop((dtMs) => {
    const st = s.current;
    const dt = Math.min(CELL.maxDtS * 1000, dtMs);
    st.points = st.points.filter((p) => (p.age += dt) < maxAge);
    paint();
    return st.points.length > 0;
  }, { maxDtMs: CELL.maxDtS * 1000 });

  const push = (p: TrailPoint): void => {
    const pts = s.current.points;
    pts.push(p);
    if (pts.length > CELL.maxPoints) pts.splice(0, pts.length - CELL.maxPoints);
  };

  const locate = (e: PointerEvent): { x: number; y: number } | null => {
    const rect = host.current?.getBoundingClientRect();
    return rect ? { x: e.clientX - rect.left, y: e.clientY - rect.top } : null;
  };

  const onMove = (e: PointerEvent): void => {
    if (still) return;
    const p = locate(e);
    if (!p) return;
    const st = s.current;
    const w = Math.max(1, st.w || host.current?.clientWidth || 1);
    const last = st.last ?? p;
    const force = moveForce((p.x - last.x) / w, (p.y - last.y) / w, CELL.forceScale, CELL.forceMin);
    const cell = w / Math.max(1, gridSize);
    const extra = fillCount(Math.hypot(p.x - last.x, p.y - last.y) / cell, interpolate);
    for (let i = extra; i >= 1; i -= 1) push({ x: p.x - ((p.x - last.x) * i) / (extra + 1), y: p.y - ((p.y - last.y) * i) / (extra + 1), age: 0, force });
    push({ x: p.x, y: p.y, age: 0, force });
    st.last = p;
    loop.wake();
  };

  const onDown = (e: PointerEvent): void => {
    if (still || !clickBurst) return;
    const p = locate(e);
    if (!p) return;
    const reach = (s.current.w || 1) * trailSize;
    for (let i = 0; i < CELL.burstPoints; i += 1) {
      const a = (i / CELL.burstPoints) * Math.PI * 2;
      push({ x: p.x + Math.cos(a) * reach, y: p.y + Math.sin(a) * reach, age: 0, force: 1 });
    }
    loop.wake();
  };

  return (
    <div ref={host} data-slot="cell-trail" className={cn("relative overflow-hidden", className)} onPointerMove={onMove} onPointerDown={onDown} onPointerLeave={() => { s.current.last = null; }} onPointerCancel={() => { s.current.last = null; }}>
      {children}
      {!still && (
        <>
          <span ref={fresh} aria-hidden="true" className={cn("hidden", TONE_CLASS[tone])} />
          <span ref={stale} aria-hidden="true" className={cn("hidden", TONE_CLASS[trailTone ?? tone])} />
          <canvas ref={canvas} aria-hidden="true" data-cell-canvas="" className="pointer-events-none absolute inset-0 size-full" />
        </>
      )}
    </div>
  );
}
