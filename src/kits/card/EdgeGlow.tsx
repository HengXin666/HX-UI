"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 BorderGlow 条目, 实现为 HX 自有.

import { useEffect, useRef, type HTMLAttributes, type JSX, type ReactNode } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { prefersReducedMotion } from "../../primitives/motion";
import { cn } from "../../primitives/utils";
import * as E from "./parts/edge-spec";
import { cardPoint, kitTone, transitionOf, useKitMotion, type KitTone } from "./tokens";

export { EDGE_DEFAULTS, EDGE_SWEEP_MS, edgeAngle, edgeCone, edgeLevel, edgeProximity, edgeSweep } from "./parts/edge-spec";

export interface EdgeGlowProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  readonly children?: ReactNode;
  readonly edgeSensitivity?: number;
  readonly glowTone?: KitTone;
  /** 光锥与边缘填充的颜色序列 (语义色). */
  readonly tones?: readonly KitTone[];
  readonly radius?: number;
  readonly glowRadius?: number;
  readonly glowIntensity?: number;
  readonly coneSpread?: number;
  readonly fillOpacity?: number;
  /** 挂上后自演示一次扫边. */
  readonly animated?: boolean;
}

/**
 * 边缘辉光卡: 指针靠近卡边 (离边 edgeSensitivity% 以内) 时, 朝指针方位亮起一道张角 2 × coneSpread 的光锥:
 * 边框一圈, 外侧 glowRadius 的柔光, 内侧沿边的彩色填充 (fillOpacity). 出现 0.25s ease-out, 消退 0.75s ease-in-out.
 * animated 时挂上先自演示一次扫边 (4s). 减弱动效时不演示, 辉光直接显隐.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-card.md
 */
export function EdgeGlow({
  children,
  edgeSensitivity = E.EDGE_DEFAULTS.edgeSensitivity,
  glowTone = "primary",
  tones = ["primary", "accent", "secondary"],
  radius = E.EDGE_DEFAULTS.radius,
  glowRadius = E.EDGE_DEFAULTS.glowRadius,
  glowIntensity = E.EDGE_DEFAULTS.glowIntensity,
  coneSpread = E.EDGE_DEFAULTS.coneSpread,
  fillOpacity = E.EDGE_DEFAULTS.fillOpacity,
  animated = false,
  className,
  style,
  ...rest
}: EdgeGlowProps): JSX.Element {
  const still = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const sweep = useRef({ t: -1, on: false });

  const fadeIn = transitionOf([["opacity", E.EDGE_IN_MS, "ease-out"]], still);
  const fadeOut = transitionOf([["opacity", E.EDGE_OUT_MS, "ease-in-out"]], still);
  const paint = (level: number, angle: number | null, on: boolean): void => {
    const node = root.current;
    if (!node) return;
    node.style.setProperty("--edge", level.toFixed(3));
    if (angle !== null) node.style.setProperty("--edge-angle", `${angle.toFixed(1)}deg`);
    node.dataset.glow = on ? "on" : "off";
    node.style.setProperty("--edge-fade", on ? fadeIn : fadeOut);
  };
  const motion = useKitMotion(
    () => undefined,
    still,
    (dtMs) => {
      const sw = sweep.current;
      if (!sw.on) return false;
      sw.t += dtMs;
      const { proximity, angle } = E.edgeSweep(sw.t);
      paint(proximity / 100, angle, sw.t < 2500);
      if (sw.t >= E.EDGE_SWEEP_MS) sw.on = false;
      return sw.on;
    },
  );
  useEffect(() => {
    if (!animated || still || prefersReducedMotion()) return;
    sweep.current = { t: 0, on: true };
    motion.wake();
  }, [animated, still, motion]);

  const tone = kitTone(glowTone);
  const cone = E.edgeCone(tones.map(kitTone), coneSpread);
  const fade = { transition: "var(--edge-fade)", opacity: "var(--edge, 0)" } as const;

  return (
    <div
      ref={root}
      data-slot="edge-glow"
      data-glow="off"
      {...rest}
      onPointerMove={(event) => {
        rest.onPointerMove?.(event);
        const node = root.current;
        if (!node) return;
        sweep.current.on = false;
        const p = cardPoint(node.getBoundingClientRect(), event.clientX, event.clientY);
        const level = E.edgeLevel(E.edgeProximity(p.nx, p.ny), edgeSensitivity);
        paint(level, E.edgeAngle(p.nx, p.ny), level > 0);
      }}
      onPointerLeave={(event) => {
        rest.onPointerLeave?.(event);
        paint(0, null, false);
      }}
      className={cn("relative isolate bg-card p-6 text-card-foreground", className)}
      style={{ borderRadius: radius, ["--edge-fade" as string]: fadeOut, ...style }}
    >
      <span
        aria-hidden
        data-slot="edge-glow-halo"
        className="pointer-events-none absolute -z-10"
        style={{ ...fade, inset: 0 - glowRadius / 2, borderRadius: radius + glowRadius / 2, background: cone, filter: `blur(${(glowRadius / 2).toFixed(0)}px)`, opacity: `calc(var(--edge, 0) * ${Math.max(0, glowIntensity) * 0.6})` }}
      />
      <span
        aria-hidden
        data-slot="edge-glow-fill"
        className="pointer-events-none absolute inset-0"
        style={{
          ...fade,
          borderRadius: radius,
          background: cone,
          opacity: `calc(var(--edge, 0) * ${fillOpacity})`,
          mask: `radial-gradient(farthest-side, transparent 70%, black)`,
        }}
      />
      <span
        aria-hidden
        data-slot="edge-glow-ring"
        className="pointer-events-none absolute inset-0"
        style={{
          ...fade,
          borderRadius: radius,
          padding: E.EDGE_RING_PX,
          background: `${cone}, linear-gradient(color-mix(in oklab, ${tone} 25%, transparent), color-mix(in oklab, ${tone} 25%, transparent))`,
          mask: "linear-gradient(black, black) content-box, linear-gradient(black, black)",
          maskComposite: "exclude",
        }}
      />
      <span aria-hidden className="pointer-events-none absolute inset-0 border border-border" style={{ borderRadius: radius }} />
      <div className="relative">{children}</div>
    </div>
  );
}
