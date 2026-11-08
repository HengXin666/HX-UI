"use client";
// 行为规格参照 docs/research/catalog/animations.md 的 Magnet 条目, 实现为 HX 自有.

import { useEffect, useRef, type CSSProperties, type JSX, type ReactNode } from "react";
import type { SpringSpec } from "../../craft/spring";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { useSpringChannels } from "../../motion/drive/use-spring-channels";
import { exactStepper } from "../../motion/spring/step";
import { cn } from "../../primitives/utils";
import { usePointerTrack } from "./track";
import { ATTRACT, DOUBLE, HALF, MAX_DT_MS, clamp, smoothstep } from "./tokens";

export type AttractAxis = "both" | "x" | "y";

/** 宿主矩形外的距离 (px), 在矩形内为 0. */
export function outsideDistance(rect: { left: number; top: number; width: number; height: number }, x: number, y: number): number {
  const dx = Math.max(rect.left - x, 0, x - (rect.left + rect.width));
  const dy = Math.max(rect.top - y, 0, y - (rect.top + rect.height));
  return Math.hypot(dx, dy);
}

/** 吸力 0..1: padding 内一半距离满吸, 到 padding 处平滑落到 0; padding 为 0 时只在矩形内吸. */
export function attractPull(outside: number, padding: number): number {
  if (padding <= 0) return outside === 0 ? 1 : 0;
  return 1 - smoothstep(padding * HALF, padding, outside);
}

/** 规格弹簧参数的下限保护. */
export function attractSpring(spring?: Partial<SpringSpec>): SpringSpec {
  return {
    stiffness: Math.max(ATTRACT.minStiffness, spring?.stiffness ?? ATTRACT.spring.stiffness),
    damping: Math.max(0, spring?.damping ?? ATTRACT.spring.damping),
    mass: Math.max(ATTRACT.minMass, spring?.mass ?? ATTRACT.spring.mass),
  };
}

/** 同屏多块互斥时的吸力登记: 只有吸力最大的那一块被吸. */
const field = new Map<symbol, number>();

export function strongest(id: symbol): boolean {
  const mine = field.get(id) ?? 0;
  for (const [other, pull] of field) if (other !== id && pull > mine) return false;
  return mine > 0;
}

export interface AttractProps {
  readonly children?: ReactNode;
  /** 矩形外这么远开始起吸 (px). */
  readonly padding?: number;
  readonly disabled?: boolean;
  /** 越大偏移越小: 偏移 = 指针到中心的距离 / strength. */
  readonly strength?: number;
  /** 偏移上限 (px). */
  readonly maxOffset?: number;
  /** 同屏多块时只让最近的那块被吸. */
  readonly exclusive?: boolean;
  readonly axis?: AttractAxis;
  /** 吸住时朝指针倾斜的最大角度 (deg). */
  readonly tilt?: number;
  /** 吸住时的缩放. */
  readonly scale?: number;
  readonly spring?: Partial<SpringSpec>;
  readonly onActiveChange?: (active: boolean) => void;
  readonly className?: string;
  readonly innerClassName?: string;
  readonly style?: CSSProperties;
}

type Key = "x" | "y" | "s" | "rx" | "ry";

/**
 * 磁吸: 指针靠近时内容朝指针偏, 离开回弹. 积分是 src/motion 的解析弹簧 (保留速度, 每帧换目标不跳变),
 * 吸力在 padding 的后一半平滑衰减; 滚动, 失焦与 pointercancel 都松开. 减弱动效时直接落位, 不弹.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-pointer.md
 */
export function Attract({
  children,
  padding = ATTRACT.padding,
  disabled = false,
  strength = ATTRACT.strength,
  maxOffset,
  exclusive = true,
  axis = "both",
  tilt = 0,
  scale = 1,
  spring,
  onActiveChange,
  className,
  innerClassName,
  style,
}: AttractProps): JSX.Element {
  const reduced = useReducedMotion();
  const host = useRef<HTMLDivElement | null>(null);
  const inner = useRef<HTMLDivElement | null>(null);
  const id = useRef(Symbol("attract"));
  const active = useRef(false);
  const spec = attractSpring(spring);
  const specs = { x: spec, y: spec, s: spec, rx: spec, ry: spec };
  const channels = useSpringChannels<Key>(
    { x: 0, y: 0, s: 1, rx: 0, ry: 0 },
    specs,
    (v) => {
      if (inner.current) inner.current.style.transform = `translate3d(${v.x}px, ${v.y}px, 0) rotateX(${v.rx}deg) rotateY(${v.ry}deg) scale(${v.s})`;
    },
    reduced,
    exactStepper(MAX_DT_MS),
  );

  const release = (): void => {
    field.delete(id.current);
    if (active.current) {
      active.current = false;
      onActiveChange?.(false);
    }
    channels.to("x", 0);
    channels.to("y", 0);
    channels.to("s", 1);
    channels.to("rx", 0);
    channels.to("ry", 0);
  };

  usePointerTrack(host, {
    onMove: (_p, e) => {
      const el = host.current;
      if (!el || disabled) return;
      const rect = el.getBoundingClientRect();
      const pull = attractPull(outsideDistance(rect, e.clientX, e.clientY), padding);
      field.set(id.current, pull);
      const on = pull > 0 && (!exclusive || strongest(id.current));
      if (!on) {
        release();
        return;
      }
      if (!active.current) {
        active.current = true;
        onActiveChange?.(true);
      }
      const dx = e.clientX - (rect.left + rect.width * HALF);
      const dy = e.clientY - (rect.top + rect.height * HALF);
      const limit = maxOffset ?? Number.POSITIVE_INFINITY;
      const k = pull / Math.max(Number.EPSILON, strength);
      channels.to("x", axis === "y" ? 0 : clamp(dx * k, -limit, limit));
      channels.to("y", axis === "x" ? 0 : clamp(dy * k, -limit, limit));
      channels.to("s", 1 + (scale - 1) * pull);
      channels.to("rx", (-dy / Math.max(1, rect.height * HALF)) * tilt * pull);
      channels.to("ry", (dx / Math.max(1, rect.width * HALF)) * tilt * pull);
    },
    onLeave: release,
  });

  const releaseRef = useRef(release);
  releaseRef.current = release;

  useEffect(() => {
    const scroll = (): void => {
      if (active.current) releaseRef.current();
    };
    window.addEventListener("scroll", scroll, { passive: true });
    const me = id.current;
    return () => {
      window.removeEventListener("scroll", scroll);
      field.delete(me);
    };
  }, []);

  useEffect(() => {
    if (disabled) releaseRef.current();
  }, [disabled]);

  return (
    <div ref={host} data-slot="attract" className={cn("relative inline-block", className)} style={{ perspective: tilt ? `${DOUBLE * DOUBLE * ATTRACT.padding}px` : undefined, ...style }}>
      <div ref={inner} className={cn("will-change-transform", innerClassName)}>
        {children}
      </div>
    </div>
  );
}
