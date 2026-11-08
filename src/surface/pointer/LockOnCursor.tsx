"use client";
// 行为规格参照 docs/research/catalog/animations.md 的 TargetCursor 条目, 实现为 HX 自有.

import { useRef, useState, type JSX, type ReactNode } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { SpringChannels } from "../../motion/drive/channels";
import { useFrameLoop } from "../../motion/frame/use-frame-loop";
import { springFromDuration } from "../../motion/spring/fit";
import { approach } from "../../motion/spring/follow";
import { exactStepper } from "../../motion/spring/step";
import { cn } from "../../primitives/utils";
import { usePointerTrack } from "./track";
import { TONE_CLASS, type SurfaceTone } from "./tone";
import { HALF, LOCK, MAX_DT_MS, MS_PER_S, mix } from "./tokens";

const QUARTER = 90;
const FULL_DEG = 360;
const CORNERS = ["left-0 top-0 border-l border-t", "right-0 top-0 border-r border-t", "right-0 bottom-0 border-b border-r", "left-0 bottom-0 border-b border-l"] as const;

/** 自转角折回 [-45, 45): 方框四角对称, 差 90 度看起来一样. */
export function foldQuarter(angle: number): number {
  return ((((angle + QUARTER * HALF) % QUARTER) + QUARTER) % QUARTER) - QUARTER * HALF;
}

/** 方框几何: 自由态以指针为中心, 锁定态贴目标矩形外扩 padding, 按 lock 在两者间插值. */
export function lockBox(px: number, py: number, size: number, target: { x: number; y: number; w: number; h: number } | null, lock: number, padding: number, parallax: number): { cx: number; cy: number; w: number; h: number } {
  if (!target) return { cx: px, cy: py, w: size, h: size };
  const tcx = target.x + target.w * HALF + (px - (target.x + target.w * HALF)) * parallax;
  const tcy = target.y + target.h * HALF + (py - (target.y + target.h * HALF)) * parallax;
  return { cx: mix(px, tcx, lock), cy: mix(py, tcy, lock), w: mix(size, target.w + padding * 2, lock), h: mix(size, target.h + padding * 2, lock) };
}

export interface LockOnCursorProps {
  readonly children?: ReactNode;
  /** 匹配到的元素会被锁框. */
  readonly targetSelector?: string;
  readonly tone?: SurfaceTone;
  /** 锁定时的色调, 不给沿用 tone. */
  readonly lockTone?: SurfaceTone;
  /** 自由态转一圈的秒数, 0 不转. */
  readonly spinDuration?: number;
  /** 吸附到目标的时长 (秒). */
  readonly hoverDuration?: number;
  readonly parallax?: boolean;
  readonly hideDefaultCursor?: boolean;
  readonly size?: number;
  readonly cornerSize?: number;
  readonly padding?: number;
  readonly dotSize?: number;
  /** 锁定时显示目标的 data-cursor-label 或 aria-label. */
  readonly showLabel?: boolean;
  readonly clickEffect?: boolean;
  readonly className?: string;
}

/**
 * 锁定光标: 四个 1px 角标绕指针自转, 悬停到目标时停转并吸附到目标外框, 按下时收紧.
 * 出现, 锁定, 按下各是一路解析弹簧 (保留速度), 自转速度一阶跟随. 减弱动效时不转, 弹簧直接落位.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-pointer.md
 */
export function LockOnCursor({
  children,
  targetSelector = LOCK.selector,
  tone = "foreground",
  lockTone,
  spinDuration = LOCK.spinDuration,
  hoverDuration = LOCK.hoverDuration,
  parallax = true,
  hideDefaultCursor = true,
  size = LOCK.size,
  cornerSize = LOCK.cornerSize,
  padding = LOCK.padding,
  dotSize = LOCK.dotSize,
  showLabel = true,
  clickEffect = true,
  className,
}: LockOnCursorProps): JSX.Element {
  const reduced = useReducedMotion();
  const host = useRef<HTMLDivElement | null>(null);
  const box = useRef<HTMLDivElement | null>(null);
  const dot = useRef<HTMLSpanElement | null>(null);
  const target = useRef<Element | null>(null);
  const spin = useRef({ angle: 0, speed: 0 });
  const channels = useRef(new SpringChannels(exactStepper(MAX_DT_MS)));
  const [label, setLabel] = useState<string | null>(null);
  const snap = springFromDuration(Math.max(Number.EPSILON, hoverDuration), 0);

  const aim = (key: string, value: number, spec = snap): void => {
    if (reduced) channels.current.jump(key, value, spec);
    else channels.current.aim(key, value, spec, { now: performance.now() });
  };

  const loop = useFrameLoop((dtMs, now) => {
    const ch = channels.current;
    const p = pointer.current;
    const el = box.current;
    const hostEl = host.current;
    if (!el || !hostEl) return false;
    ch.step(dtMs, now);
    const dtS = dtMs / MS_PER_S;
    const want = reduced || target.current || spinDuration <= 0 ? 0 : FULL_DEG / spinDuration;
    spin.current.speed = reduced ? 0 : approach(spin.current.speed, want, dtS, 1 / LOCK.spinRate);
    spin.current.angle = foldQuarter(spin.current.angle + spin.current.speed * dtS);
    const lock = ch.value("lock");
    const hr = hostEl.getBoundingClientRect();
    const tr = target.current?.getBoundingClientRect();
    const rect = tr ? { x: tr.left - hr.left, y: tr.top - hr.top, w: tr.width, h: tr.height } : null;
    const g = lockBox(p.x, p.y, size, rect, lock, padding, parallax ? LOCK.parallax : 0);
    const press = 1 - (1 - LOCK.pressScale) * ch.value("press");
    const presence = ch.value("presence");
    el.style.opacity = String(presence);
    el.style.width = `${g.w}px`;
    el.style.height = `${g.h}px`;
    el.style.transform = `translate3d(${g.cx - g.w * HALF}px, ${g.cy - g.h * HALF}px, 0) rotate(${spin.current.angle * (1 - lock)}deg) scale(${press * presence})`;
    if (dot.current) dot.current.style.transform = `translate3d(${p.x - dotSize * HALF}px, ${p.y - dotSize * HALF}px, 0)`;
    if (dot.current) dot.current.style.opacity = String(presence * (1 - lock));
    return ch.active() || presence > 0.001;
  });

  const pointer = usePointerTrack(host, {
    onMove: (p, e) => {
      const found = e.target instanceof Element ? e.target.closest(targetSelector) : null;
      const next = found && host.current?.contains(found) ? found : null;
      if (next !== target.current) {
        target.current = next;
        aim("lock", next ? 1 : 0);
        setLabel(next && showLabel ? (next.getAttribute("data-cursor-label") ?? next.getAttribute("aria-label")) : null);
      }
      aim("presence", p.inside ? 1 : 0, LOCK.presence);
      loop.wake();
    },
    onDown: () => {
      if (clickEffect) aim("press", 1, LOCK.press);
      loop.wake();
    },
    onUp: () => {
      aim("press", 0, LOCK.press);
      loop.wake();
    },
    onLeave: () => {
      target.current = null;
      setLabel(null);
      aim("presence", 0, LOCK.presence);
      aim("lock", 0);
      aim("press", 0, LOCK.press);
      loop.wake();
    },
  });

  const locked = label !== null || target.current !== null;
  return (
    <div ref={host} data-slot="lock-on-cursor" className={cn("relative", hideDefaultCursor && "cursor-none", className)}>
      {children}
      <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-visible", TONE_CLASS[locked && lockTone ? lockTone : tone])}>
        <div ref={box} className="absolute left-0 top-0 opacity-0" style={{ width: size, height: size }}>
          {CORNERS.map((cls) => (
            <span key={cls} className={cn("absolute border-current", cls)} style={{ width: cornerSize, height: cornerSize }} />
          ))}
          {label ? <span className="absolute left-0 top-full mt-1 whitespace-nowrap font-mono text-[10px] leading-none">{label}</span> : null}
        </div>
        <span ref={dot} className="absolute left-0 top-0 rounded-full bg-current opacity-0" style={{ width: dotSize, height: dotSize }} />
      </div>
    </div>
  );
}
