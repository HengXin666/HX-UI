"use client";
// 行为规格参照 docs/research/catalog/textanimations.md 的 CurvedLoop, TextLoop, ScrollVelocity 条目, 实现为 HX 自有.

import { useId, useLayoutEffect, useRef, useState, type JSX, type PointerEvent as ReactPointerEvent } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { useFrameLoop } from "../../../motion/frame/use-frame-loop";
import { approach, decay } from "../../../motion/spring/follow";
import { cn } from "../../../primitives/utils";
import { clamp } from "../kernel/curve";
import { HALF, MS_PER_S, PERCENT, SR_ONLY, TEXT_FRAME } from "../kernel/tokens";
import {
  MARQUEE_CHAR_EM, MARQUEE_DEFAULTS, MARQUEE_DRAG_BLEND, MARQUEE_FLING_TAU_S, MARQUEE_MAX_FLING, MARQUEE_MIN_COPIES, MARQUEE_SCROLL_FALL,
  MARQUEE_SCROLL_RISE, MARQUEE_UNIT_PX_S, MARQUEE_VELOCITY_RATE, MARQUEE_VIEW, MARQUEE_WAVE_LENGTH,
} from "./tokens";

export type MarqueeShape = "line" | "arc" | "wave";

export interface TextMarqueeProps {
  readonly text: string;
  /** line 直线 (滚动速度条带); arc 弧形; wave 波浪. 给了 path 时忽略. */
  readonly shape?: MarqueeShape;
  /** 自定路径 (画布 1440 宽的坐标), 与 viewHeight 一起给. */
  readonly path?: string;
  readonly viewHeight?: number;
  /** 速度, 1 为每秒 60 个画布单位. */
  readonly speed?: number;
  readonly direction?: "left" | "right";
  /** 弧形的弯曲量 (画布单位, 负数向上). */
  readonly curveAmount?: number;
  /** 波浪的波幅 (画布单位). */
  readonly curviness?: number;
  /** 字号 (画布单位). */
  readonly fontSize?: number;
  /** 两份文字之间的分隔. */
  readonly separator?: string;
  /** 可拖动, 松手按速度甩出后衰减. */
  readonly draggable?: boolean;
  readonly pauseOnHover?: boolean;
  /** 滚动加速: 滚动速率 (像素/秒) 乘以它加到速度上. */
  readonly scrollBoost?: number;
  /** 方向跟随滚动方向 (向上滚时反向). */
  readonly followScroll?: boolean;
  /** 两端淡出的宽度 (百分比). */
  readonly edgeFade?: number;
  readonly className?: string;
}

/** 形状的路径与画布高度. */
export function marqueePath(shape: MarqueeShape, curveAmount: number, curviness: number): { readonly d: string; readonly height: number } {
  const w = MARQUEE_VIEW.width;
  const base = MARQUEE_VIEW.height;
  if (shape === "arc") {
    const height = base + Math.abs(curveAmount);
    const y = curveAmount >= 0 ? base * HALF : base * HALF + Math.abs(curveAmount);
    return { d: `M -100 ${y} Q ${w * HALF} ${y + curveAmount * 2} ${w + 100} ${y}`, height };
  }
  if (shape === "wave") {
    const height = base + curviness * 2;
    const mid = height * HALF;
    const quarter = MARQUEE_WAVE_LENGTH / 4;
    let d = `M ${-MARQUEE_WAVE_LENGTH} ${mid} Q ${-MARQUEE_WAVE_LENGTH + quarter} ${mid - curviness * 2} ${-MARQUEE_WAVE_LENGTH + quarter * 2} ${mid}`;
    for (let x = -MARQUEE_WAVE_LENGTH + quarter * 2; x < w + MARQUEE_WAVE_LENGTH; x += quarter * 2) d += ` T ${x + quarter * 2} ${mid}`;
    return { d, height };
  }
  return { d: `M 0 ${base * HALF} L ${w} ${base * HALF}`, height: base };
}

/** 偏移折回一份文字的长度内, 保证 startOffset 永远在 (-copy, 0]. */
export function wrapOffset(offset: number, copy: number): number {
  if (copy <= 0) return 0;
  return (((offset % copy) + copy) % copy) - copy;
}

/**
 * 沿路径循环的文字条带: 直线即滚动速度条带, 弧形与波浪即曲线条带. 速度向目标一阶靠拢 (可中断),
 * 拖动时跟手, 松手按估计速度甩出并指数衰减, 滚动速率可加速或决定方向. 每帧只写 startOffset.
 * 减弱动效时静止. 读屏读一份原文.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-text-scroll.md
 */
export function TextMarquee({
  text,
  shape = "line",
  path,
  viewHeight,
  speed = MARQUEE_DEFAULTS.speed,
  direction = "left",
  curveAmount = MARQUEE_DEFAULTS.curveAmount,
  curviness = MARQUEE_DEFAULTS.curviness,
  fontSize = 64,
  separator = " · ",
  draggable = true,
  pauseOnHover = false,
  scrollBoost = 0,
  followScroll = false,
  edgeFade = 0,
  className,
}: TextMarqueeProps): JSX.Element {
  const reduced = useReducedMotion();
  const id = useId();
  const svg = useRef<SVGSVGElement>(null);
  const textPath = useRef<SVGTextPathElement>(null);
  const probe = useRef<SVGTextElement>(null);
  const unit = `${text}${separator}`;
  const [copy, setCopy] = useState(unit.length * fontSize * MARQUEE_CHAR_EM);
  const s = useRef({ offset: 0, v: 0, fling: 0, level: 0, sign: 1, lastY: 0, hover: false, drag: null as null | { x: number; t: number; v: number } });
  const geometry = path ? { d: path, height: viewHeight ?? MARQUEE_VIEW.height } : marqueePath(shape, curveAmount, curviness);
  const copies = Math.max(MARQUEE_MIN_COPIES, Math.ceil((MARQUEE_VIEW.width * 2) / Math.max(1, copy)) + 1);

  useLayoutEffect(() => {
    const measured = probe.current?.getComputedTextLength?.();
    if (measured && measured > 0) setCopy(measured);
  }, [unit, fontSize]);

  useFrameLoop((dtMs) => {
    const st = s.current;
    const dt = dtMs / MS_PER_S;
    const y = typeof window === "undefined" ? 0 : window.scrollY;
    const rate = dt > 0 ? (y - st.lastY) / dt : 0;
    st.lastY = y;
    if (rate !== 0) st.sign = rate > 0 ? 1 : -1;
    st.level = approach(st.level, Math.abs(rate), dt, 1 / (Math.abs(rate) > st.level ? MARQUEE_SCROLL_RISE : MARQUEE_SCROLL_FALL));
    const dir = (direction === "left" ? -1 : 1) * (followScroll ? st.sign : 1);
    const target = st.hover && pauseOnHover ? 0 : speed * MARQUEE_UNIT_PX_S * dir;
    st.v = approach(st.v, target, dt, 1 / MARQUEE_VELOCITY_RATE);
    st.fling = decay(st.fling, dt, MARQUEE_FLING_TAU_S);
    if (!st.drag) st.offset += (st.v + st.fling + st.level * scrollBoost * dir) * dt;
    textPath.current?.setAttribute("startOffset", String(wrapOffset(st.offset, copy)));
    return true;
  }, { ...TEXT_FRAME, active: !reduced });

  const toView = (px: number): number => px * (MARQUEE_VIEW.width / Math.max(1, svg.current?.clientWidth ?? MARQUEE_VIEW.width));
  const down = (e: ReactPointerEvent<SVGSVGElement>): void => {
    if (!draggable || reduced) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    s.current.drag = { x: e.clientX, t: e.timeStamp, v: 0 };
    s.current.fling = 0;
  };
  const move = (e: ReactPointerEvent<SVGSVGElement>): void => {
    const d = s.current.drag;
    if (!d) return;
    const delta = toView(e.clientX - d.x);
    const dt = Math.max(1, e.timeStamp - d.t) / MS_PER_S;
    d.v = d.v * (1 - MARQUEE_DRAG_BLEND) + (delta / dt) * MARQUEE_DRAG_BLEND;
    s.current.offset += delta;
    d.x = e.clientX;
    d.t = e.timeStamp;
  };
  const up = (): void => {
    const d = s.current.drag;
    s.current.drag = null;
    if (d) s.current.fling = clamp(d.v, -MARQUEE_MAX_FLING, MARQUEE_MAX_FLING);
  };

  const fade = edgeFade > 0 ? `linear-gradient(to right, transparent, currentColor ${edgeFade}%, currentColor ${PERCENT - edgeFade}%, transparent)` : undefined;
  const pathId = `marquee-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <div data-slot="text-marquee" className={cn("w-full overflow-hidden", className)} onPointerEnter={() => { s.current.hover = true; }} onPointerLeave={() => { s.current.hover = false; }}>
      <span className={SR_ONLY}>{text}</span>
      <svg
        ref={svg}
        aria-hidden="true"
        viewBox={`0 0 ${MARQUEE_VIEW.width} ${geometry.height}`}
        className={cn("block w-full select-none overflow-visible", draggable && !reduced && "cursor-grab touch-pan-y")}
        style={{ maskImage: fade, WebkitMaskImage: fade }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      >
        <defs>
          <path id={pathId} d={geometry.d} fill="none" />
        </defs>
        <text ref={probe} fontSize={fontSize} opacity={0}>{unit}</text>
        <text fontSize={fontSize} fill="currentColor">
          <textPath ref={textPath} href={`#${pathId}`} startOffset={-copy}>
            {Array.from({ length: copies }, () => unit).join("")}
          </textPath>
        </text>
      </svg>
    </div>
  );
}
