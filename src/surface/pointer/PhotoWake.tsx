"use client";
// 行为规格参照 docs/research/catalog/animations.md 的 ImageTrail 条目, 实现为 HX 自有.

import { useRef, type JSX, type ReactNode } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { useFrameLoop } from "../../motion/frame/use-frame-loop";
import { cn } from "../../primitives/utils";
import { usePointerTrack } from "./track";
import { DEG_PER_RAD, HALF, MAX_DT_MS, MS_PER_S, WAKE, mix, powerOut, seeded } from "./tokens";

/** GSAP 的 power4 / power2 / power1 / expo 换成 1 - (1 - t)^n 的 n. */
const POWER4 = 5;
const POWER2 = 3;
const POWER1 = 2;

interface Slot {
  live: boolean;
  born: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  rot: number;
  tiltX: number;
  tiltY: number;
  size: number;
  z: number;
}

/** 某个槽在出生后 age 秒的进度: 入场, 出场, 透明度与缩放. 出场走完返回 null. */
export function wakePhase(age: number, o: { lifetime: number; drift: number; appearScale: number; zoom: number; exitScale: number }): { inK: number; outK: number; opacity: number; scale: number } | null {
  const outS = o.drift > 0 ? WAKE.driftOutS : WAKE.outS;
  const inK = powerOut(age / WAKE.inS, POWER4);
  const outK = age < o.lifetime ? 0 : powerOut((age - o.lifetime) / outS, o.drift > 0 ? POWER2 : POWER1);
  if (age >= o.lifetime + outS) return null;
  const grown = mix(o.appearScale, o.zoom, inK);
  return { inK, outK, opacity: inK * (1 - outK), scale: mix(grown, o.exitScale, outK) };
}

/** 需要的槽位数: 至少 8, 图片多时取两倍, 一轮里同一张图不会同时出现两次以上. */
export function wakeSlots(items: number): number {
  return Math.max(WAKE.minSlots, items * 2);
}

export interface PhotoWakeProps {
  readonly items: readonly string[];
  readonly children?: ReactNode;
  readonly size?: number;
  readonly aspectRatio?: number;
  readonly radius?: number;
  /** 指针走过这么远 (px) 放下一张. */
  readonly threshold?: number;
  /** 每张停留秒数. */
  readonly lifetime?: number;
  readonly appearScale?: number;
  readonly zoom?: number;
  /** 0..1, 刚出现时的提亮. */
  readonly flash?: number;
  readonly exitScale?: number;
  /** 0..1, 出场时沿指针速度漂移. */
  readonly drift?: number;
  /** 随机旋转的最大角度 (deg). */
  readonly rotation?: number;
  /** 0..1, 尺寸随机幅度. */
  readonly sizeVariance?: number;
  readonly alignToMotion?: boolean;
  /** 随机三维倾斜的最大角度 (deg). */
  readonly tilt?: number;
  readonly className?: string;
}

/**
 * 图片尾迹: 指针每走过 threshold 放下一张图, 停留 lifetime 后缩小淡出. 未启用的槽一律
 * visibility hidden, 不会在首帧闪一下; 进出场是可回放的进度函数. 减弱动效时不放图.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-pointer.md
 */
export function PhotoWake({
  items,
  children,
  size = WAKE.size,
  aspectRatio = WAKE.aspectRatio,
  radius = WAKE.radius,
  threshold = WAKE.threshold,
  lifetime = WAKE.lifetime,
  appearScale = WAKE.appearScale,
  zoom = 1,
  flash = 0,
  exitScale = WAKE.exitScale,
  drift = 0,
  rotation = 0,
  sizeVariance = 0,
  alignToMotion = false,
  tilt = 0,
  className,
}: PhotoWakeProps): JSX.Element {
  const reduced = useReducedMotion();
  const host = useRef<HTMLDivElement | null>(null);
  const nodes = useRef<Array<HTMLImageElement | null>>([]);
  const count = wakeSlots(items.length);
  const slots = useRef<Slot[]>([]);
  const cursor = useRef({ next: 0, z: 0, lastX: Number.NaN, lastY: 0, clock: 0 });
  const rand = useRef(seeded(count));

  const loop = useFrameLoop((dtMs) => {
    const c = cursor.current;
    c.clock += dtMs / MS_PER_S;
    let busy = false;
    slots.current.forEach((s, i) => {
      const el = nodes.current[i];
      if (!el || !s.live) return;
      const ph = wakePhase(c.clock - s.born, { lifetime, drift, appearScale, zoom, exitScale });
      if (!ph) {
        s.live = false;
        el.style.visibility = "hidden";
        return;
      }
      busy = true;
      const h = s.size / aspectRatio;
      el.style.visibility = "visible";
      el.style.width = `${s.size}px`;
      el.style.zIndex = String(s.z);
      el.style.opacity = String(ph.opacity);
      el.style.filter = flash > 0 ? `brightness(${1 + flash * (1 - Math.min(1, (c.clock - s.born) / WAKE.flashS))})` : "";
      el.style.transform = `translate3d(${s.x - s.size * HALF + s.dx * ph.outK}px, ${s.y - h * HALF + s.dy * ph.outK}px, 0) rotate(${s.rot}deg) rotateX(${s.tiltX}deg) rotateY(${s.tiltY}deg) scale(${ph.scale})`;
    });
    return busy;
  }, { maxDtMs: MAX_DT_MS });

  usePointerTrack(host, {
    onMove: (p) => {
      if (reduced || items.length === 0 || !p.inside) return;
      const c = cursor.current;
      if (Number.isNaN(c.lastX)) {
        c.lastX = p.x;
        c.lastY = p.y;
      }
      if (Math.hypot(p.x - c.lastX, p.y - c.lastY) < threshold) return;
      const angle = Math.atan2(p.y - c.lastY, p.x - c.lastX) * DEG_PER_RAD;
      c.lastX = p.x;
      c.lastY = p.y;
      const r = rand.current;
      const i = c.next % count;
      c.next += 1;
      c.z += 1;
      slots.current[i] = {
        live: true,
        born: c.clock,
        x: p.x,
        y: p.y,
        dx: p.vx * WAKE.driftGain * drift,
        dy: p.vy * WAKE.driftGain * drift,
        rot: alignToMotion ? angle : (r() * 2 - 1) * rotation,
        tiltX: (r() * 2 - 1) * tilt,
        tiltY: (r() * 2 - 1) * tilt,
        size: size * (1 + (r() * 2 - 1) * sizeVariance),
        z: c.z,
      };
      loop.wake();
    },
  });

  return (
    <div ref={host} data-slot="photo-wake" className={cn("relative overflow-hidden", className)}>
      {children}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {Array.from({ length: count }, (_, i) => (
          <img
            key={i}
            ref={(el) => {
              nodes.current[i] = el;
            }}
            alt=""
            draggable={false}
            src={items.length ? items[i % items.length] : undefined}
            className="absolute left-0 top-0 object-cover will-change-transform"
            style={{ visibility: "hidden", width: size, aspectRatio: String(aspectRatio), borderRadius: radius }}
          />
        ))}
      </div>
    </div>
  );
}
