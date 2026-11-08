"use client";
// 行为规格参照 docs/research/catalog/textanimations.md 的 CircularText 条目, 实现为 HX 自有.

import { useRef, type JSX, type PointerEvent as ReactPointerEvent } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { makeAxis, stepAxis } from "../../../motion/drive/axis";
import { useFrameLoop } from "../../../motion/frame/use-frame-loop";
import { decay } from "../../../motion/spring/follow";
import { stepSpringExact } from "../../../motion/spring/step";
import { cn } from "../../../primitives/utils";
import { clamp } from "../kernel/curve";
import { graphemes } from "../kernel/split";
import { HALF, MS_PER_S, SR_ONLY, TEXT_FRAME } from "../kernel/tokens";
import { FULL_TURN_DEG, ORBIT_BONKERS_SCALE, ORBIT_DEFAULTS, ORBIT_FLING_TAU_S, ORBIT_HOVER_SPEED, ORBIT_MAX_FLING, ORBIT_SCALE_SPRING, ORBIT_SPEED_SPRING } from "./tokens";

export type OrbitHover = keyof typeof ORBIT_HOVER_SPEED;

export interface OrbitTextProps {
  readonly text: string;
  /** 转一圈的秒数. */
  readonly spinDuration?: number;
  /** 悬停时的速度档: slowDown 0.5 倍, speedUp 4 倍, pause 停, goBonkers 20 倍并放大. */
  readonly onHover?: OrbitHover;
  readonly direction?: "clockwise" | "counterclockwise";
  /** 直径 (像素). */
  readonly size?: number;
  /** 第一个字的起始角 (度). */
  readonly startAngle?: number;
  /** 文字绕圈重复几次. */
  readonly repeat?: number;
  /** 可拖着转, 松手按角速度甩出后衰减. */
  readonly draggable?: boolean;
  readonly className?: string;
}

/** 第 i 个字在圈上的角度 (度). */
export function orbitAngle(i: number, count: number, startAngle: number): number {
  return startAngle + (FULL_TURN_DEG / Math.max(1, count)) * i;
}

/**
 * 环形字: 字等分排在圆上, 整圈匀速转. 悬停时速度倍数走弹簧 (刚度 60, 阻尼 18), 中途离开保留速度;
 * goBonkers 时缩放走另一条弹簧 (300, 20). 可拖着转, 松手甩出后按 0.7s 时间常数衰减. 减弱动效时静止.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-text-scroll.md
 */
export function OrbitText({
  text,
  spinDuration = ORBIT_DEFAULTS.spinDuration,
  onHover = "speedUp",
  direction = "clockwise",
  size = ORBIT_DEFAULTS.size,
  startAngle = 0,
  repeat = 1,
  draggable = false,
  className,
}: OrbitTextProps): JSX.Element {
  const reduced = useReducedMotion();
  const ring = useRef<HTMLSpanElement>(null);
  const st = useRef({ angle: 0, fling: 0, speed: makeAxis(1), scale: makeAxis(1), drag: null as null | { a: number; t: number; v: number } });
  const glyphs = Array.from({ length: Math.max(1, repeat) }, () => graphemes(text)).flat();
  const sign = direction === "clockwise" ? 1 : -1;

  const loop = useFrameLoop((dtMs) => {
    const s = st.current;
    stepAxis(s.speed, ORBIT_SPEED_SPRING, dtMs, stepSpringExact);
    stepAxis(s.scale, ORBIT_SCALE_SPRING, dtMs, stepSpringExact);
    s.fling = decay(s.fling, dtMs / MS_PER_S, ORBIT_FLING_TAU_S);
    if (!s.drag) s.angle += ((sign * FULL_TURN_DEG) / Math.max(0.1, spinDuration) * s.speed.current + s.fling) * (dtMs / MS_PER_S);
    if (ring.current) ring.current.style.transform = `rotate(${s.angle % FULL_TURN_DEG}deg) scale(${s.scale.current})`;
    return true;
  }, { ...TEXT_FRAME, active: !reduced });

  const hover = (on: boolean): void => {
    const s = st.current;
    s.speed.target = on ? ORBIT_HOVER_SPEED[onHover] : 1;
    s.scale.target = on && onHover === "goBonkers" ? ORBIT_BONKERS_SCALE : 1;
    loop.wake();
  };
  const angleOf = (e: ReactPointerEvent<HTMLElement>): number => {
    const r = e.currentTarget.getBoundingClientRect();
    return (Math.atan2(e.clientY - (r.top + r.height * HALF), e.clientX - (r.left + r.width * HALF)) * FULL_TURN_DEG) / (2 * Math.PI);
  };
  const down = (e: ReactPointerEvent<HTMLElement>): void => {
    if (!draggable || reduced) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    st.current.drag = { a: angleOf(e), t: e.timeStamp, v: 0 };
  };
  const move = (e: ReactPointerEvent<HTMLElement>): void => {
    const d = st.current.drag;
    if (!d) return;
    const a = angleOf(e);
    let delta = a - d.a;
    if (delta > FULL_TURN_DEG * HALF) delta -= FULL_TURN_DEG;
    if (delta < -FULL_TURN_DEG * HALF) delta += FULL_TURN_DEG;
    st.current.angle += delta;
    d.v = delta / (Math.max(1, e.timeStamp - d.t) / MS_PER_S);
    d.a = a;
    d.t = e.timeStamp;
  };
  const up = (): void => {
    const d = st.current.drag;
    st.current.drag = null;
    if (d) st.current.fling = clamp(d.v, -ORBIT_MAX_FLING, ORBIT_MAX_FLING);
  };

  const radius = size * HALF;
  return (
    <span
      data-slot="orbit-text"
      className={cn("relative inline-block select-none", draggable && !reduced && "cursor-grab touch-none", className)}
      style={{ width: size, height: size }}
      onPointerEnter={() => hover(true)}
      onPointerLeave={() => hover(false)}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
    >
      <span className={SR_ONLY}>{text}</span>
      <span ref={ring} aria-hidden="true" className="absolute inset-0" style={{ transform: "rotate(0deg)" }}>
        {glyphs.map((g, i) => (
          <span key={i} className="absolute left-1/2 top-0 inline-block" style={{ height: radius, transformOrigin: "50% 100%", transform: `translateX(-50%) rotate(${orbitAngle(i, glyphs.length, startAngle)}deg)` }}>
            {g}
          </span>
        ))}
      </span>
    </span>
  );
}
