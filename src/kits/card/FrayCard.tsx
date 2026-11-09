"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 DecayCard 条目, 实现为 HX 自有.
// ENGINE-GAP: 规格是 WebGL 分形噪声侵蚀 (边缘溶解, 逐像素 alpha, 色散). 这里是 SVG feTurbulence + feDisplacementMap 近似, 见 note.

import { useEffect, useId, useRef, type JSX, type ReactNode } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { cn } from "../../primitives/utils";
import * as D from "./parts/fray-spec";
import { cardPoint, clamp, follow, useKitMotion } from "./tokens";

export { FRAY_BLEED, FRAY_DEFAULTS, frayFrequency, frayScale, frayWanted } from "./parts/fray-spec";

export type FrayScope = "window" | "card";

export interface FrayCardProps {
  readonly image: string;
  readonly alt?: string;
  readonly width?: number;
  readonly height?: number;
  readonly intensity?: number;
  readonly sensitivity?: number;
  readonly hoverDecay?: number;
  readonly recovery?: number;
  readonly grain?: number;
  readonly detail?: number;
  readonly pattern?: number;
  readonly idle?: number;
  readonly flow?: number;
  readonly travel?: number;
  readonly tilt?: number;
  readonly scope?: FrayScope;
  readonly radius?: number;
  readonly grayscale?: boolean;
  readonly children?: ReactNode;
  readonly className?: string;
}

/**
 * 侵蚀卡: 图片 (出血放大 1.24) 经噪声位移滤镜, 指针移得越快图越 "碎", 停下后按 recovery 秒复原; 悬停常留 hoverDecay, 闲置时轻微呼吸.
 * 图片随指针反向平移 travel px 并倾斜 tilt 度, 跟随 tau 0.16s. scope 为 window 时全窗指针都算. grain 叠一层噪点.
 * 减弱动效时无位移, 平移与倾斜, 只留静态噪点.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-card.md
 */
export function FrayCard({
  image,
  alt = "",
  width = D.FRAY_DEFAULTS.width,
  height = D.FRAY_DEFAULTS.height,
  intensity = D.FRAY_DEFAULTS.intensity,
  sensitivity = D.FRAY_DEFAULTS.sensitivity,
  hoverDecay = D.FRAY_DEFAULTS.hoverDecay,
  recovery = D.FRAY_DEFAULTS.recovery,
  grain = D.FRAY_DEFAULTS.grain,
  detail = D.FRAY_DEFAULTS.detail,
  pattern = D.FRAY_DEFAULTS.pattern,
  idle = D.FRAY_DEFAULTS.idle,
  flow = D.FRAY_DEFAULTS.flow,
  travel = D.FRAY_DEFAULTS.travel,
  tilt = D.FRAY_DEFAULTS.tilt,
  scope = "window",
  radius = D.FRAY_DEFAULTS.radius,
  grayscale = false,
  children,
  className,
}: FrayCardProps): JSX.Element {
  const still = useReducedMotion();
  const id = useId().replace(/:/g, "");
  const root = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const disp = useRef<SVGFEDisplacementMapElement>(null);
  const turb = useRef<SVGFETurbulenceElement>(null);
  const s = useRef({ tx: 0, ty: 0, x: 0, y: 0, speed: 0, lastX: 0, lastY: 0, lastT: 0, hover: false, level: 0, t: 0 });

  const motion = useKitMotion(
    () => {
      const st = s.current;
      disp.current?.setAttribute("scale", D.frayScale(st.level, intensity).toFixed(2));
      turb.current?.setAttribute("baseFrequency", D.frayFrequency(pattern, still ? 0 : flow, st.t).toFixed(5));
      if (img.current) img.current.style.transform = `translate(${(0 - st.x * travel).toFixed(2)}px, ${(0 - st.y * travel).toFixed(2)}px) rotate(${(st.x * tilt * 0.5).toFixed(2)}deg) scale(${D.FRAY_BLEED})`;
    },
    still,
    (dtMs) => {
      const st = s.current;
      const dt = dtMs / 1000;
      st.t += dt;
      st.speed = follow(st.speed, 0, dt, 0.1);
      st.x = follow(st.x, st.tx, dt, D.FRAY_FOLLOW_S);
      st.y = follow(st.y, st.ty, dt, D.FRAY_FOLLOW_S);
      const want = still ? 0 : D.frayWanted(st.speed, sensitivity, st.hover, hoverDecay, idle, st.t);
      st.level = follow(st.level, want, dt, { rise: D.FRAY_RISE_S, fall: Math.max(0.01, recovery) });
      return !still && (idle > 0 || flow > 0 || st.level !== want || st.x !== st.tx || st.y !== st.ty || st.speed !== 0);
    },
  );

  useEffect(() => {
    const node = root.current;
    if (!node) return undefined;
    const target: Window | HTMLElement = scope === "window" ? window : node;
    const onMove = (event: Event): void => {
      const e = event as PointerEvent;
      const st = s.current;
      const now = performance.now();
      if (st.lastT > 0 && now > st.lastT) st.speed = Math.max(st.speed, (Math.hypot(e.clientX - st.lastX, e.clientY - st.lastY) / (now - st.lastT)) * 1000);
      Object.assign(st, { lastX: e.clientX, lastY: e.clientY, lastT: now });
      const p = cardPoint(node.getBoundingClientRect(), e.clientX, e.clientY);
      st.tx = still ? 0 : clamp(p.nx, -1, 1) * 0.5;
      st.ty = still ? 0 : clamp(p.ny, -1, 1) * 0.5;
      st.hover = p.out === 0;
      motion.wake();
    };
    target.addEventListener("pointermove", onMove, { passive: true });
    motion.wake();
    return () => target.removeEventListener("pointermove", onMove);
  }, [scope, still, motion]);

  return (
    <div
      ref={root}
      data-slot="fray-card"
      onPointerLeave={() => {
        Object.assign(s.current, { hover: false, tx: 0, ty: 0, lastT: 0 });
        motion.wake();
      }}
      className={cn("relative isolate overflow-hidden bg-card", className)}
      style={{ width, height, borderRadius: radius }}
    >
      <svg aria-hidden width="0" height="0" className="absolute">
        <filter id={`fray-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence ref={turb} type="fractalNoise" baseFrequency={D.frayFrequency(pattern, 0, 0).toFixed(5)} numOctaves={Math.round(clamp(detail, 1, 8))} seed="7" result="noise" />
          <feDisplacementMap ref={disp} in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id={`fray-grain-${id}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </svg>
      <img
        ref={img}
        src={image}
        alt={alt}
        draggable={false}
        data-slot="fray-card-image"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ filter: `url(#fray-${id})${grayscale ? " grayscale(1)" : ""}`, transform: `scale(${D.FRAY_BLEED})` }}
      />
      {grain > 0 ? <span aria-hidden data-slot="fray-card-grain" className="pointer-events-none absolute inset-0" style={{ filter: `url(#fray-grain-${id})`, opacity: clamp(grain, 0, 1) * 0.5, mixBlendMode: "overlay", background: "white" }} /> : null}
      {children ? <div className="relative h-full">{children}</div> : null}
    </div>
  );
}
