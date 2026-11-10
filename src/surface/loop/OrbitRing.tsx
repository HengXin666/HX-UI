"use client";
// 行为规格参照 docs/research/catalog/animations.md 的 OrbitImages 条目, 实现为 HX 自有.

import { useEffect, useMemo, useRef, useState, type JSX, type KeyboardEvent, type PointerEvent } from "react";
import { FOCUS_RING } from "../../craft/tokens";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { useFrameLoop } from "../../motion/frame/use-frame-loop";
import { approach, decay } from "../../motion/spring/follow";
import { prefersReducedMotion } from "../../primitives/motion";
import { cn } from "../../primitives/utils";
import { buildOrbit, lapPhase, orbitAt, orbitLook, type OrbitShape } from "./parts/orbit";
import { ORBIT } from "./tokens";

export interface OrbitImage {
  readonly src: string;
  readonly alt?: string;
}

export interface OrbitRingProps {
  readonly images: readonly OrbitImage[];
  /** 整组的读屏名. */
  readonly label: string;
  /** 没给 alt 的图读作 "altPrefix 序号". */
  readonly altPrefix?: string;
  readonly shape?: OrbitShape;
  /** 轨道的设计宽度, 半径都以它为基准随容器缩放. */
  readonly baseWidth?: number;
  readonly radiusX?: number;
  readonly radiusY?: number;
  readonly radius?: number;
  readonly starPoints?: number;
  readonly starInnerRatio?: number;
  /** 轨道旋转 (度). */
  readonly rotation?: number;
  /** 一圈的秒数. */
  readonly duration?: number;
  readonly itemSize?: number;
  readonly direction?: "normal" | "reverse";
  /** 均分整条轨道; false 时按件宽首尾相接. */
  readonly fill?: boolean;
  readonly easing?: "linear" | "ease";
  readonly paused?: boolean;
  readonly pauseOnHover?: boolean;
  readonly showPath?: boolean;
  readonly pathWidth?: number;
  readonly pathDash?: number;
  readonly className?: string;
}

/**
 * 轨道环绕: 图片沿椭圆, 圆, 方或星形轨道按弧长匀速环行, 前排放大, 后排缩小压暗.
 * 速度一阶跟随 (悬停或 paused 时归零), 可拖动甩出, 左右方向键换一位. 离开视口或页面隐藏时停帧.
 * 减弱动效: 停在初始位置不动.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-loop.md
 */
export function OrbitRing({
  images,
  label,
  altPrefix = "Orbiting image",
  shape = "ellipse",
  baseWidth = ORBIT.baseWidth,
  radiusX = ORBIT.radiusX,
  radiusY = ORBIT.radiusY,
  radius = ORBIT.radius,
  starPoints = ORBIT.starPoints,
  starInnerRatio = ORBIT.starInnerRatio,
  rotation = ORBIT.rotation,
  duration = ORBIT.duration,
  itemSize = ORBIT.itemSize,
  direction = "normal",
  fill = true,
  easing = "linear",
  paused = false,
  pauseOnHover = true,
  showPath = false,
  pathWidth = ORBIT.pathWidth,
  pathDash = 0,
  className,
}: OrbitRingProps): JSX.Element {
  const reduced = useReducedMotion();
  const still = reduced || prefersReducedMotion();
  const table = useMemo(() => buildOrbit({ shape, radiusX, radiusY, radius, starPoints, starInnerRatio, rotation }, ORBIT.samples), [shape, radiusX, radiusY, radius, starPoints, starInnerRatio, rotation]);
  const width = baseWidth;
  const height = Math.ceil(table.halfHeight * 2 + itemSize * (1 + ORBIT.frontGrow));
  const perimeter = table.acc[table.acc.length - 1];
  const count = images.length;
  const slot = (i: number): number => (fill || perimeter <= 0 ? i / Math.max(1, count) : (i * itemSize * (1 + ORBIT.frontGrow)) / perimeter);
  const host = useRef<HTMLDivElement>(null);
  const nodes = useRef<(HTMLLIElement | null)[]>([]);
  const [visible, setVisible] = useState(true);
  const s = useRef({ lap: 0, speed: paused ? 0 : 1, manual: 0, glide: 0, seek: null as null | { from: number; to: number; t: number }, t: still ? Infinity : 0, hovered: false, drag: null as null | { id: number; x: number; at: number; moved: number; vel: number } });

  const place = (u: number, fade: number): { left: string; top: string; transform: string; opacity: string; zIndex: string } => {
    const p = orbitAt(table, u);
    const look = orbitLook(p.y, table.halfHeight, ORBIT.frontGrow, ORBIT.backShrink, ORBIT.backDim);
    return {
      left: `${((p.x + width / 2) / width) * 100}%`,
      top: `${((p.y + height / 2) / height) * 100}%`,
      transform: `translate(-50%, -50%) scale(${look.scale})`,
      opacity: String(look.opacity * fade),
      zIndex: String(Math.round((look.depth + 1) * 100)),
    };
  };

  useEffect(() => {
    const el = host.current;
    if (still || !el || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(([e]) => setVisible(e?.isIntersecting ?? true), { threshold: ORBIT.viewThreshold });
    io.observe(el);
    return () => io.disconnect();
  }, [still]);

  useFrameLoop((dtMs) => {
    const st = s.current;
    const dt = Math.min(ORBIT.maxDtS, dtMs / 1000);
    st.speed = approach(st.speed, paused || (pauseOnHover && st.hovered) || st.drag ? 0 : 1, dt, ORBIT.speedTauS);
    if (duration > 0) st.lap += (st.speed * dt) / duration;
    if (!st.drag) {
      st.glide = decay(st.glide, dt, ORBIT.glideTauS);
      st.manual += st.glide * dt;
    }
    if (st.seek) {
      st.seek.t = Math.min(1, st.seek.t + dt / ORBIT.seekS);
      st.manual = st.seek.from + (st.seek.to - st.seek.from) * lapPhase(st.seek.t * 0.999999, "ease");
      if (st.seek.t >= 1) { st.manual = st.seek.to; st.seek = null; }
    }
    if (st.t < Infinity) st.t += dt;
    const spread = st.t === Infinity ? 1 : 1 - (1 - Math.min(1, st.t / ORBIT.introSpreadS)) ** 3;
    const fade = st.t === Infinity ? 1 : Math.min(1, st.t / ORBIT.introFadeS);
    if (st.t > ORBIT.introSpreadS) st.t = Infinity;
    const phase = lapPhase(st.lap, easing) * (direction === "reverse" ? -1 : 1) + st.manual;
    nodes.current.forEach((n, i) => { if (n) Object.assign(n.style, place(phase + spread * slot(i), fade)); });
    return true;
  }, { maxDtMs: ORBIT.maxDtS * 1000, active: !still && visible && count > 0, pauseWhenHidden: true });

  const onDown = (e: PointerEvent): void => {
    if (still || e.button !== 0) return;
    s.current.drag = { id: e.pointerId, x: e.clientX, at: e.timeStamp, moved: 0, vel: 0 };
    s.current.glide = 0;
    s.current.seek = null;
  };
  const onMove = (e: PointerEvent): void => {
    const d = s.current.drag;
    if (!d || d.id !== e.pointerId || perimeter <= 0) return;
    const scale = (host.current?.clientWidth || width) / width;
    const du = -(e.clientX - d.x) / (perimeter * scale);
    const dt = Math.max(0.001, (e.timeStamp - d.at) / 1000);
    d.moved += Math.abs(e.clientX - d.x);
    d.vel = approach(d.vel, du / dt, dt, 0.05);
    d.x = e.clientX;
    d.at = e.timeStamp;
    s.current.manual += du;
    if (d.moved > ORBIT.dragThresholdPx && !host.current?.hasPointerCapture?.(e.pointerId)) host.current?.setPointerCapture?.(e.pointerId);
  };
  const onUp = (e: PointerEvent): void => {
    const d = s.current.drag;
    if (!d || d.id !== e.pointerId) return;
    s.current.drag = null;
    if (d.moved > ORBIT.dragThresholdPx) s.current.glide = d.vel;
  };
  const onKey = (e: KeyboardEvent): void => {
    if (still || count === 0 || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
    e.preventDefault();
    const st = s.current;
    const from = st.manual;
    const base = st.seek ? st.seek.to : from;
    st.seek = { from, to: base + (e.key === "ArrowLeft" ? 1 : -1) / count, t: 0 };
  };

  const d = useMemo(() => {
    const n = table.xs.length;
    let out = "";
    for (let i = 0; i < n; i += 4) out += `${i === 0 ? "M" : "L"}${(table.xs[i] + width / 2).toFixed(1)} ${(table.ys[i] + height / 2).toFixed(1)}`;
    return `${out}Z`;
  }, [table, width, height]);

  return (
    <div
      ref={host}
      data-slot="orbit-ring"
      role="group"
      aria-label={label}
      tabIndex={still ? undefined : 0}
      className={cn("relative w-full touch-pan-y select-none", !still && FOCUS_RING, className)}
      style={{ aspectRatio: `${width} / ${height}` }}
      onPointerEnter={() => { s.current.hovered = true; }}
      onPointerLeave={() => { s.current.hovered = false; }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onLostPointerCapture={onUp}
      onKeyDown={onKey}
      onDragStart={(e) => e.preventDefault()}
    >
      {showPath && (
        <svg aria-hidden="true" className="absolute inset-0 size-full text-border" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <path d={d} fill="none" stroke="currentColor" strokeWidth={pathWidth} strokeDasharray={pathDash > 0 ? pathDash : undefined} vectorEffect="non-scaling-stroke" />
        </svg>
      )}
      <ul className="absolute inset-0">
        {images.map((img, i) => (
          <li key={i} ref={(n) => { nodes.current[i] = n; }} data-orbit-index={i} className="absolute aspect-square" style={{ width: `${(itemSize / width) * 100}%`, ...place(slot(i), still ? 1 : 0) }}>
            <img src={img.src} alt={img.alt ?? `${altPrefix} ${i + 1}`} draggable={false} className="size-full rounded-md object-cover" />
          </li>
        ))}
      </ul>
    </div>
  );
}
