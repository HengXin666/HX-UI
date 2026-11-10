"use client";
// 行为规格参照 docs/research/catalog/animations.md 的 LogoLoop 条目, 实现为 HX 自有.

import { useEffect, useRef, useState, type JSX, type ReactNode } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { FOCUS_RING } from "../../craft/tokens";
import { cssCurve } from "../../motion/curves";
import { useFrameLoop } from "../../motion/frame/use-frame-loop";
import { approach, decay } from "../../motion/spring/follow";
import { prefersReducedMotion } from "../../primitives/motion";
import { cn } from "../../primitives/utils";
import { copiesNeeded, flingVelocity, introOpacity, introTotal, railOffset } from "./parts/rail";
import { RAIL } from "./tokens";

export interface MarkRailItem {
  /** 显示的内容: 标志, 图片, 文字. */
  readonly content: ReactNode;
  /** 读屏名, 内容是图形时必须写清. */
  readonly label: string;
  /** 给了就包成链接. */
  readonly href?: string;
}

export interface MarkRailProps {
  readonly items: readonly MarkRailItem[];
  /** 整条带的读屏名. */
  readonly label: string;
  /** 速度 px/s. */
  readonly speed?: number;
  readonly direction?: "left" | "right";
  /** 件与件的间距 px. */
  readonly gap?: number;
  /** 悬停或键盘聚焦时降到 hoverSpeed. */
  readonly pauseOnHover?: boolean;
  readonly hoverSpeed?: number;
  /** 可拖动, 松手后按甩出速度滑行. */
  readonly draggable?: boolean;
  /** 两侧渐隐. */
  readonly fadeEdges?: boolean;
  /** 悬停件放大. */
  readonly scaleOnHover?: boolean;
  /** 挂载后各件错峰淡入. */
  readonly intro?: boolean;
  readonly className?: string;
}

const MASK = `linear-gradient(to right, transparent, currentColor ${RAIL.fadeShare * 100}%, currentColor ${100 - RAIL.fadeShare * 100}%, transparent)`;

/**
 * 标志跑马带: 一条序列铺成多份首尾相接循环行进, 速度一阶跟随目标, 悬停与聚焦时放慢, 可拖动甩出.
 * 读屏只读第一份 (列表), 其余副本 aria-hidden 且链接不进 Tab 序. 离开视口或页面隐藏时停帧.
 * 减弱动效: 不动, 退化为可横向滚动的一行.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-loop.md
 */
export function MarkRail({
  items,
  label,
  speed = RAIL.speed,
  direction = "left",
  gap = RAIL.gap,
  pauseOnHover = true,
  hoverSpeed = 0,
  draggable = true,
  fadeEdges = true,
  scaleOnHover = false,
  intro = true,
  className,
}: MarkRailProps): JSX.Element {
  const reduced = useReducedMotion();
  const still = reduced || prefersReducedMotion();
  const host = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const seq = useRef<HTMLUListElement>(null);
  const [copies, setCopies] = useState(2);
  const [visible, setVisible] = useState(true);
  const s = useRef({ offset: 0, vel: 0, glide: 0, period: 0, t: intro ? 0 : Infinity, hovered: false, focused: false, drag: null as null | { id: number; x: number; at: number; moved: number; vel: number }, swallow: false });

  useEffect(() => {
    const el = host.current;
    if (still || !el) return undefined;
    const measure = (): void => {
      s.current.period = seq.current?.offsetWidth ?? 0;
      setCopies(copiesNeeded(el.clientWidth, s.current.period));
    };
    measure();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    ro?.observe(el);
    if (seq.current) ro?.observe(seq.current);
    const io = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([e]) => setVisible(e?.isIntersecting ?? true), { threshold: RAIL.viewThreshold });
    io?.observe(el);
    return () => {
      ro?.disconnect();
      io?.disconnect();
    };
  }, [still, items, gap]);

  useFrameLoop((dtMs) => {
    const st = s.current;
    const dt = Math.min(RAIL.maxDtS, dtMs / 1000);
    const sign = direction === "left" ? -1 : 1;
    const slow = pauseOnHover && (st.hovered || st.focused);
    if (!st.drag) {
      st.vel = approach(st.vel, (slow ? hoverSpeed : speed) * sign, dt, RAIL.smoothTauS);
      st.glide = decay(st.glide, dt, RAIL.glideTauS);
      st.offset += (st.vel + st.glide) * dt;
    }
    st.offset = railOffset(st.offset, st.period);
    if (track.current) track.current.style.transform = `translate3d(${st.offset}px, 0, 0)`;
    if (st.t < Infinity) {
      st.t += dt;
      const done = st.t > introTotal(items.length, RAIL.introS, RAIL.introStaggerS);
      const nodes = track.current?.querySelectorAll<HTMLElement>("[data-rail-index]") ?? [];
      nodes.forEach((n) => { n.style.opacity = done ? "1" : String(introOpacity(st.t, Number(n.dataset.railIndex), items.length, RAIL.introS, RAIL.introStaggerS)); });
      if (done) st.t = Infinity;
    }
    return true;
  }, { maxDtMs: RAIL.maxDtS * 1000, active: !still && visible, pauseWhenHidden: true });

  const onDown = (e: React.PointerEvent): void => {
    if (!draggable || still || e.button !== 0) return;
    s.current.drag = { id: e.pointerId, x: e.clientX, at: e.timeStamp, moved: 0, vel: 0 };
    s.current.vel = 0;
    s.current.glide = 0;
    s.current.swallow = false;
  };
  const onMove = (e: React.PointerEvent): void => {
    const d = s.current.drag;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dt = Math.max(0.001, (e.timeStamp - d.at) / 1000);
    d.moved += Math.abs(dx);
    d.vel = approach(d.vel, dx / dt, dt, RAIL.dragVelTauS);
    d.x = e.clientX;
    d.at = e.timeStamp;
    s.current.offset += dx;
    if (d.moved > RAIL.dragThresholdPx && !host.current?.hasPointerCapture?.(e.pointerId)) host.current?.setPointerCapture?.(e.pointerId);
  };
  const onUp = (e: React.PointerEvent): void => {
    const d = s.current.drag;
    if (!d || d.id !== e.pointerId) return;
    s.current.drag = null;
    if (d.moved > RAIL.dragThresholdPx) {
      s.current.glide = flingVelocity(d.vel, RAIL.maxFling);
      s.current.swallow = true;
    }
  };

  const list = (copy: number): JSX.Element => (
    <ul key={copy} ref={copy === 0 ? seq : undefined} aria-hidden={copy > 0 || undefined} aria-label={copy === 0 ? label : undefined} data-rail-copy={copy} className="flex shrink-0 items-center" style={{ gap, paddingRight: still ? 0 : gap }}>
      {items.map((it, i) => (
        <li
          key={i}
          data-rail-index={i}
          className={cn("flex shrink-0 items-center", scaleOnHover && "transition-transform hover:scale-110")}
          style={{ opacity: !still && intro ? 0 : undefined, transitionDuration: `${RAIL.hoverMs}ms`, transitionTimingFunction: cssCurve("outCubic") }}
        >
          {it.href ? (
            <a href={it.href} tabIndex={copy > 0 ? -1 : undefined} aria-label={it.label} draggable={false} className={cn("rounded-sm", FOCUS_RING)}>
              {it.content}
            </a>
          ) : (
            <span role="img" aria-label={it.label}>{it.content}</span>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <div
      ref={host}
      data-slot="mark-rail"
      className={cn("relative", still ? "overflow-x-auto" : "overflow-hidden touch-pan-y select-none", draggable && !still && "cursor-grab", className)}
      style={fadeEdges && !still ? { maskImage: MASK, WebkitMaskImage: MASK } : undefined}
      onPointerEnter={() => { s.current.hovered = true; }}
      onPointerLeave={() => { s.current.hovered = false; }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onLostPointerCapture={onUp}
      onFocus={() => { s.current.focused = true; }}
      onBlur={() => { s.current.focused = false; }}
      onDragStart={(e) => e.preventDefault()}
      onClickCapture={(e) => {
        if (s.current.swallow) {
          e.preventDefault();
          e.stopPropagation();
          s.current.swallow = false;
        }
      }}
    >
      <div ref={track} className="flex w-max will-change-transform">
        {still ? list(0) : Array.from({ length: copies }, (_, c) => list(c))}
      </div>
    </div>
  );
}
