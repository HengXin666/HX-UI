"use client";
// 行为规格参照 docs/research/catalog/components-2.md 的 TiltedCard 条目, 实现为 HX 自有.

import { useEffect, useRef, useState, type JSX, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { cn } from "../../primitives/utils";
import * as T from "./parts/tilted-spec";
import { glarePose, tiltSpring, tiltTarget } from "./parts/tilt";
import { KIT_FOCUS, cardPoint, follow, useKitMotion } from "./tokens";

export { TILTED_DEFAULTS, isTap, tipAngle } from "./parts/tilted-spec";
export { glarePose, tiltSpring, tiltTarget } from "./parts/tilt";

export interface TiltCardProps {
  readonly imageSrc?: string;
  readonly altText?: string;
  readonly captionText?: string;
  readonly width?: number | string;
  readonly height?: number | string;
  readonly scaleOnHover?: number;
  readonly rotateAmplitude?: number;
  readonly showTooltip?: boolean;
  readonly overlayContent?: ReactNode;
  readonly displayOverlayContent?: boolean;
  readonly overlayDepth?: number;
  readonly children?: ReactNode;
  readonly backContent?: ReactNode;
  readonly flipOnClick?: boolean;
  readonly flipped?: boolean;
  readonly onFlip?: (flipped: boolean) => void;
  readonly radius?: number;
  readonly perspective?: number;
  readonly smoothness?: number;
  readonly glare?: number;
  readonly shadow?: number;
  readonly className?: string;
}

/**
 * 倾斜卡: 指针在卡上时卡面朝指针倾 (rotateAmplitude 度) 并托起到 scaleOnHover, 反光随指针, 投影随托起加深.
 * 有 backContent 时点击 (移动不超过 6px) 或 Enter / 空格翻面 (omega 9.5 zeta 0.72), flipped 可受控.
 * captionText 提示框跟指针 (tau 0.035s), 按横向甩动速度倾斜. 减弱动效时不倾斜不托起, 翻面直接到位.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-card.md
 */
export function TiltCard({
  imageSrc,
  altText = "",
  captionText = "",
  width = 300,
  height = 300,
  scaleOnHover = T.TILTED_DEFAULTS.scaleOnHover,
  rotateAmplitude = T.TILTED_DEFAULTS.rotateAmplitude,
  showTooltip = true,
  overlayContent,
  displayOverlayContent = false,
  overlayDepth = T.TILTED_DEFAULTS.overlayDepth,
  children,
  backContent,
  flipOnClick = true,
  flipped,
  onFlip,
  radius = T.TILTED_DEFAULTS.radius,
  perspective = T.TILTED_DEFAULTS.perspective,
  smoothness = T.TILTED_DEFAULTS.smoothness,
  glare = T.TILTED_DEFAULTS.glare,
  shadow = T.TILTED_DEFAULTS.shadow,
  className,
}: TiltCardProps): JSX.Element {
  const still = useReducedMotion();
  const face = useRef<HTMLDivElement>(null);
  const tip = useRef<HTMLElement>(null);
  const [own, setOwn] = useState(false);
  const isFlipped = flipped ?? own;
  const flippable = Boolean(backContent) && flipOnClick;
  const s = useRef({ tx: 0, ty: 0, x: 0, y: 0, vx: 0, lastX: 0, lastT: 0, gx: 50, gy: 50, ga: 0, tip: 0, down: null as null | { x: number; y: number } });
  const tilt = tiltSpring(smoothness);
  const lift = T.liftSpring(Math.sqrt(tilt.stiffness), tilt.damping / (2 * Math.sqrt(tilt.stiffness)));

  const motion = useKitMotion(
    (m) => {
      const node = face.current;
      if (!node) return;
      const l = m.get("lift");
      const sc = 1 + (scaleOnHover - 1) * l - T.TILTED_PRESS_SHRINK * m.get("press");
      node.style.transform = `rotateX(${m.get("rx").toFixed(2)}deg) rotateY(${(m.get("ry") + m.get("flip")).toFixed(2)}deg) scale(${sc.toFixed(4)})`;
      node.style.setProperty("--lift", l.toFixed(3));
      node.style.setProperty("--gx", `${s.current.gx.toFixed(1)}%`);
      node.style.setProperty("--gy", `${s.current.gy.toFixed(1)}%`);
      node.style.setProperty("--ga", `${s.current.ga.toFixed(1)}deg`);
      if (tip.current) {
        tip.current.style.opacity = m.get("shown").toFixed(3);
        tip.current.style.transform = `translate(${s.current.x.toFixed(1)}px, ${s.current.y.toFixed(1)}px) rotate(${m.get("tip").toFixed(2)}deg)`;
      }
    },
    still,
    (dtMs) => {
      const st = s.current;
      const dt = dtMs / 1000;
      st.x = follow(st.x, st.tx, dt, still ? 0 : T.TILTED_TOOLTIP_S);
      st.y = follow(st.y, st.ty, dt, still ? 0 : T.TILTED_TOOLTIP_S);
      st.vx = follow(st.vx, 0, dt, T.TILTED_VX_DECAY_S);
      const tipTo = still ? 0 : T.tipAngle(st.vx);
      if (tipTo !== st.tip) {
        st.tip = tipTo;
        motion.spring("tip", tipTo, T.TILTED_TIP);
      }
      return st.x !== st.tx || st.y !== st.ty || st.vx !== 0;
    },
  );
  useEffect(() => {
    motion.spring("flip", isFlipped ? 180 : 0, T.TILTED_FLIP);
    motion.paint();
  }, [isFlipped, motion]);

  const onMove = (event: PointerEvent<HTMLDivElement>): void => {
    const node = event.currentTarget;
    const p = cardPoint(node.getBoundingClientRect(), event.clientX, event.clientY);
    const st = s.current;
    const now = performance.now();
    if (st.lastT > 0 && now > st.lastT) st.vx = ((event.clientX - st.lastX) / (now - st.lastT)) * 1000;
    Object.assign(st, { lastX: event.clientX, lastT: now, tx: p.x, ty: p.y });
    const g = glarePose(p.nx, p.ny);
    Object.assign(st, { gx: g.x, gy: g.y, ga: g.angle });
    const t = still ? { rx: 0, ry: 0 } : tiltTarget(p.nx, p.ny, rotateAmplitude);
    motion.spring("rx", t.rx, tilt);
    motion.spring("ry", t.ry, tilt);
    motion.spring("lift", still ? 0 : 1, lift);
    if (showTooltip && captionText) motion.spring("shown", 1, T.TILTED_SHOWN);
    motion.wake();
  };
  const onLeave = (): void => {
    s.current.lastT = 0;
    s.current.down = null;
    for (const id of ["rx", "ry", "lift", "press"]) motion.spring(id, 0, id === "lift" ? lift : id === "press" ? T.TILTED_PRESS : tilt);
    motion.spring("shown", 0, T.TILTED_SHOWN);
  };
  const toggle = (): void => {
    if (!flippable) return;
    if (flipped === undefined) setOwn(!isFlipped);
    onFlip?.(!isFlipped);
  };
  const onKey = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    toggle();
  };

  return (
    <figure data-slot="tilt-card" className={cn("relative m-0 grid place-items-center", className)} style={{ width, height, perspective }}>
      <div
        ref={face}
        data-slot="tilt-card-face"
        role={flippable ? "button" : undefined}
        tabIndex={flippable ? 0 : undefined}
        aria-pressed={flippable ? isFlipped : undefined}
        aria-label={flippable ? altText || captionText || undefined : undefined}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        onPointerCancel={onLeave}
        onPointerDown={(event) => {
          s.current.down = { x: event.clientX, y: event.clientY };
          motion.spring("press", flippable ? 1 : 0, T.TILTED_PRESS);
        }}
        onPointerUp={(event) => {
          const d = s.current.down;
          s.current.down = null;
          motion.spring("press", 0, T.TILTED_PRESS);
          if (d && T.isTap(event.clientX - d.x, event.clientY - d.y)) toggle();
        }}
        onKeyDown={onKey}
        className={cn("relative h-full w-full [transform-style:preserve-3d]", flippable && "cursor-pointer", KIT_FOCUS)}
        style={{ borderRadius: radius }}
      >
        <span aria-hidden className="pointer-events-none absolute inset-0" style={{ borderRadius: radius, boxShadow: "var(--shadow-xl)", opacity: `calc(var(--lift, 0) * ${shadow})` }} />
        <div className="absolute inset-0 overflow-hidden [backface-visibility:hidden]" style={{ borderRadius: radius }}>
          {imageSrc ? <img src={imageSrc} alt={altText} draggable={false} className="h-full w-full object-cover" /> : null}
          {children}
          {glare > 0 ? (
            <span
              aria-hidden
              data-slot="tilt-card-glare"
              className="pointer-events-none absolute inset-0"
              style={{ opacity: `calc(var(--lift, 0) * ${glare})`, background: "radial-gradient(circle at var(--gx, 50%) var(--gy, 50%), color-mix(in oklab, white 55%, transparent), transparent 60%)", mixBlendMode: "overlay" }}
            />
          ) : null}
        </div>
        {displayOverlayContent && overlayContent ? (
          <div data-slot="tilt-card-overlay" className="pointer-events-none absolute inset-0 [backface-visibility:hidden]" style={{ transform: `translateZ(${overlayDepth}px)` }}>
            {overlayContent}
          </div>
        ) : null}
        {backContent ? (
          <div data-slot="tilt-card-back" aria-hidden={!isFlipped} className="absolute inset-0 overflow-hidden bg-card text-card-foreground [backface-visibility:hidden]" style={{ borderRadius: radius, transform: "rotateY(180deg)" }}>
            {backContent}
          </div>
        ) : null}
      </div>
      {showTooltip && captionText ? (
        <figcaption ref={tip} data-slot="tilt-card-tooltip" className="pointer-events-none absolute left-0 top-0 rounded-md bg-popover px-2.5 py-1 text-xs text-popover-foreground shadow-md" style={{ opacity: 0 }}>
          {captionText}
        </figcaption>
      ) : null}
    </figure>
  );
}
