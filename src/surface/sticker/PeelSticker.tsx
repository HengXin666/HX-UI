"use client";
// 行为规格参照 docs/research/catalog/animations.md 的 StickerPeel 条目, 实现为 HX 自有.
// ENGINE-GAP: 规格用 96 x 96 网格在顶点着色器里按 curlRadius 卷曲并分 gloss / matte / holo 三种表面光照;
// backdrop 内核只有全屏片元管线, 没有可位移的网格顶点, 这里退化为沿直线对折 (镜像 + 渐变高光), 卷曲半径只用作高光带宽.

import { useEffect, useRef, type JSX, type PointerEvent } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { useFrameLoop } from "../../motion/frame/use-frame-loop";
import { approach } from "../../motion/spring/follow";
import { prefersReducedMotion } from "../../primitives/motion";
import { cn } from "../../primitives/utils";
import { clipHalfPlane, foldLine, mirrorMatrix, polygonCss, springStep, type Pt } from "./parts/peel";
import { PEEL } from "./tokens";

export interface PeelStickerProps {
  readonly imageSrc: string;
  /** 贴纸图的读屏文字. */
  readonly alt: string;
  readonly width?: number;
  /** 贴纸整体旋转 (度). */
  readonly rotate?: number;
  /** 揭起方向 (度), 0 从右边, 90 从下边; followPointer 时悬停中改由指针方向决定. */
  readonly peelDirection?: number;
  /** 悬停与按下时揭起的百分比. */
  readonly peelBackHoverPct?: number;
  readonly peelBackActivePct?: number;
  /** 折痕高光带宽 px. */
  readonly curlRadius?: number;
  /** 背面高光与投影的强度 0 到 1. */
  readonly lightingIntensity?: number;
  readonly shadowIntensity?: number;
  readonly followPointer?: boolean;
  readonly draggable?: boolean;
  /** 拖动时的摆动幅度倍数, 松手后的滑行摩擦 0 到 1. */
  readonly swing?: number;
  readonly friction?: number;
  readonly intro?: boolean;
  readonly onDragStart?: () => void;
  readonly onDragEnd?: () => void;
  readonly className?: string;
}

const RECT = (w: number, h: number): Pt[] => [[0, 0], [w, 0], [w, h], [0, h]];

/**
 * 揭角贴纸: 悬停时从一边揭起一角 (背面带高光与投影), 按下揭得更多; 可拖动, 拖动时托起并像挂件一样摆, 松手后带惯性滑行.
 * 揭起, 托起, 摆动都是阻尼弹簧; 全部落定且不拖动时停帧. 背面层 aria-hidden, 贴纸图带 alt.
 * 减弱动效: 静态贴纸, 不揭不拖.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-sticker.md
 */
export function PeelSticker({
  imageSrc,
  alt,
  width = PEEL.width,
  rotate = 0,
  peelDirection = 0,
  peelBackHoverPct = PEEL.peelBackHoverPct,
  peelBackActivePct = PEEL.peelBackActivePct,
  curlRadius = PEEL.curlRadius,
  lightingIntensity = PEEL.lightingIntensity,
  shadowIntensity = PEEL.shadowIntensity,
  followPointer = true,
  draggable = true,
  swing = PEEL.swing,
  friction = PEEL.friction,
  intro = true,
  onDragStart,
  onDragEnd,
  className,
}: PeelStickerProps): JSX.Element {
  const reduced = useReducedMotion();
  const still = reduced || prefersReducedMotion();
  const host = useRef<HTMLDivElement>(null);
  const front = useRef<HTMLImageElement>(null);
  const flap = useRef<HTMLDivElement>(null);
  const s = useRef({
    peel: 0, peelV: 0, lift: 0, liftV: 0, swing: 0, swingV: 0, intro: intro && !still ? 0 : 1,
    ax: Math.cos((peelDirection * Math.PI) / 180), ay: Math.sin((peelDirection * Math.PI) / 180),
    x: 0, y: 0, gx: 0, gy: 0, hover: false, press: false, ptr: null as null | { x: number; y: number },
    drag: null as null | { id: number; sx: number; sy: number; lx: number; ly: number; at: number; vx: number; vy: number; moving: boolean },
  });

  const write = (): void => {
    const st = s.current;
    const el = host.current;
    if (!el) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    const deg = (Math.atan2(st.ay, st.ax) * 180) / Math.PI;
    const f = foldLine(w, h, deg, Math.max(0, st.peel) / 100);
    const scale = st.intro * (1 + PEEL.liftScale * st.lift);
    el.style.transform = `translate(${st.x}px, ${st.y}px) rotate(${rotate + (st.swing * 180) / Math.PI}deg) scale(${scale})`;
    el.style.opacity = String(Math.min(1, st.intro * 1.5));
    if (front.current) front.current.style.clipPath = st.peel > 0.05 ? polygonCss(clipHalfPlane(RECT(w, h), w / 2, h / 2, f.nx, f.ny, f.fold, "near"), w, h) : "";
    if (!flap.current) return;
    const lifted = clipHalfPlane(RECT(w, h), w / 2, h / 2, f.nx, f.ny, f.fold, "far");
    flap.current.style.display = st.peel > 0.05 && lifted.length >= 3 ? "" : "none";
    flap.current.style.clipPath = polygonCss(lifted, w, h);
    flap.current.style.transform = `matrix(${mirrorMatrix(f.nx, f.ny, f.fold).map((v) => v.toFixed(5)).join(", ")})`;
    const at = ((f.fold + f.extent) / Math.max(1, 2 * f.extent)) * 100;
    const band = (curlRadius / Math.max(1, 2 * f.extent)) * 100;
    const lit = Math.round(lightingIntensity * 70);
    flap.current.style.backgroundImage = `linear-gradient(${deg + 90}deg, var(--muted) ${at.toFixed(2)}%, color-mix(in oklab, var(--background) ${lit}%, var(--muted)) ${(at + band).toFixed(2)}%, var(--muted) 100%)`;
    flap.current.style.filter = `drop-shadow(0 ${(2 + 6 * st.lift).toFixed(1)}px ${(4 + 8 * st.lift).toFixed(1)}px color-mix(in oklab, var(--foreground) ${Math.round(shadowIntensity * 40)}%, transparent))`;
  };

  const loop = useFrameLoop((dtMs) => {
    const st = s.current;
    const dt = Math.max(PEEL.minDtS, Math.min(PEEL.maxDtS, dtMs / 1000));
    if (st.intro < 1) st.intro = Math.min(1, st.intro + dt / PEEL.introS);
    if (followPointer && st.hover && st.ptr && !st.drag?.moving) {
      const len = Math.hypot(st.ptr.x, st.ptr.y) || 1;
      st.ax = approach(st.ax, st.ptr.x / len, dt, PEEL.pointerTauS);
      st.ay = approach(st.ay, st.ptr.y / len, dt, PEEL.pointerTauS);
    }
    const hot = st.press || st.hover;
    const peel = springStep(st.peel, st.peelV, st.press ? peelBackActivePct : st.hover ? peelBackHoverPct : 0, hot ? PEEL.peelHotHz : PEEL.peelRestHz, hot ? PEEL.peelHotDamping : PEEL.peelRestDamping, dt);
    st.peel = peel.x;
    st.peelV = peel.v;
    const moving = st.drag?.moving ?? false;
    const lift = springStep(st.lift, st.liftV, moving ? 1 : 0, PEEL.liftHz, PEEL.liftDamping, dt);
    st.lift = lift.x;
    st.liftV = lift.v;
    const torque = moving ? (st.drag?.vx ?? 0) * PEEL.torquePerPx * PEEL.swingDrive * swing : 0;
    const sw = springStep(st.swing, st.swingV + torque * dt, 0, PEEL.swingHz, PEEL.swingDamping, dt);
    st.swing = Math.max(-PEEL.swingCap, Math.min(PEEL.swingCap, sw.x));
    st.swingV = sw.v;
    if (!st.drag) {
      const k = Math.exp(-dt * (PEEL.frictionBase + PEEL.frictionScale * friction));
      st.gx *= k;
      st.gy *= k;
      st.x += st.gx * dt;
      st.y += st.gy * dt;
    }
    write();
    const settled = st.intro >= 1 && !st.drag && Math.abs(st.peel - (st.press ? peelBackActivePct : st.hover ? peelBackHoverPct : 0)) < 0.05 && Math.abs(st.peelV) < 0.05 && Math.abs(st.lift) < 1e-3 && Math.abs(st.liftV) < 1e-3 && Math.abs(st.swing) < 1e-3 && Math.abs(st.swingV) < 1e-3 && Math.hypot(st.gx, st.gy) < 1;
    return !settled;
  }, { maxDtMs: 1000 / 30 });

  useEffect(() => {
    if (!still) loop.wake();
  }, [still, loop]);

  const local = (e: PointerEvent): { x: number; y: number } | null => {
    const r = host.current?.getBoundingClientRect();
    return r ? { x: e.clientX - r.left - r.width / 2, y: e.clientY - r.top - r.height / 2 } : null;
  };
  const onMove = (e: PointerEvent): void => {
    if (still) return;
    const st = s.current;
    st.ptr = local(e);
    const d = st.drag;
    if (d && d.id === e.pointerId) {
      const dt = Math.max(0.001, (e.timeStamp - d.at) / 1000);
      const dx = e.clientX - d.lx;
      const dy = e.clientY - d.ly;
      d.vx = approach(d.vx, dx / dt, dt, 0.05);
      d.vy = approach(d.vy, dy / dt, dt, 0.05);
      d.lx = e.clientX;
      d.ly = e.clientY;
      d.at = e.timeStamp;
      if (!d.moving && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > PEEL.dragThresholdPx) {
        d.moving = true;
        st.press = false;
        host.current?.setPointerCapture?.(e.pointerId);
        onDragStart?.();
      }
      if (d.moving) { st.x += dx; st.y += dy; }
    }
    loop.wake();
  };
  const onDown = (e: PointerEvent): void => {
    if (still || e.button !== 0) return;
    const st = s.current;
    st.press = true;
    st.gx = 0;
    st.gy = 0;
    if (draggable) st.drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, lx: e.clientX, ly: e.clientY, at: e.timeStamp, vx: 0, vy: 0, moving: false };
    loop.wake();
  };
  const onUp = (e: PointerEvent): void => {
    const st = s.current;
    st.press = false;
    const d = st.drag;
    if (d && d.id === e.pointerId) {
      st.drag = null;
      if (d.moving) { st.gx = d.vx; st.gy = d.vy; onDragEnd?.(); }
    }
    loop.wake();
  };

  return (
    <div
      ref={host}
      data-slot="peel-sticker"
      className={cn("relative inline-block select-none", draggable && !still && "touch-none cursor-grab", className)}
      style={{ width, transform: still ? `rotate(${rotate}deg)` : undefined, opacity: still || !intro ? undefined : 0 }}
      onPointerEnter={() => { s.current.hover = true; loop.wake(); }}
      onPointerLeave={() => { s.current.hover = false; loop.wake(); }}
      onPointerMove={onMove}
      onPointerDown={onDown}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onLostPointerCapture={onUp}
      onDragStart={(e) => e.preventDefault()}
    >
      <img ref={front} src={imageSrc} alt={alt} draggable={false} className="block w-full" onLoad={() => write()} />
      {!still && (
        <div ref={flap} aria-hidden="true" data-peel-flap="" className="pointer-events-none absolute inset-0" style={{ display: "none", maskImage: `url(${imageSrc})`, WebkitMaskImage: `url(${imageSrc})`, maskSize: "100% 100%", WebkitMaskSize: "100% 100%" }} />
      )}
    </div>
  );
}
