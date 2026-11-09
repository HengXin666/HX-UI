"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 SpotlightCard 条目, 实现为 HX 自有.

import { useEffect, useRef, type HTMLAttributes, type JSX, type ReactNode } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { cn } from "../../primitives/utils";
import * as L from "./parts/lamp-spec";
import { cardPoint, follow, kitTone, useKitMotion, type KitTone } from "./tokens";

export { LAMP_DEFAULTS, lampFollowTau, lampGradient, lampReach, type LampShape } from "./parts/lamp-spec";

export interface LampCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  readonly children?: ReactNode;
  readonly spotlightTone?: KitTone;
  readonly intensity?: number;
  readonly spotlightSize?: number;
  readonly softness?: number;
  readonly shape?: L.LampShape;
  readonly borderGlow?: number;
  readonly proximity?: number;
  readonly smoothing?: number;
  readonly ambient?: boolean;
  readonly flare?: boolean;
}

/**
 * 聚光卡: 卡面上一团光斑追指针 (tau 0.015 + smoothing × 0.22 s), 指针在卡外 proximity px 内光斑渐弱仍在,
 * 边框按同一光斑发光 (borderGlow). 光斑亮 0.1s 暗 0.32s; 按下闪一下 (起 0.05s 落 0.28s). 键盘聚焦时光斑停在卡心.
 * ambient 时无指针也留一团弱光在卡心. 减弱动效时光斑直接贴指针, 显隐不过渡, 无闪光.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-card.md
 */
export function LampCard({
  children,
  spotlightTone = "foreground",
  intensity = L.LAMP_DEFAULTS.intensity,
  spotlightSize = L.LAMP_DEFAULTS.size,
  softness = L.LAMP_DEFAULTS.softness,
  shape = "circle",
  borderGlow = L.LAMP_DEFAULTS.borderGlow,
  proximity = L.LAMP_DEFAULTS.proximity,
  smoothing = L.LAMP_DEFAULTS.smoothing,
  ambient = false,
  flare = true,
  className,
  style,
  ...rest
}: LampCardProps): JSX.Element {
  const still = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const s = useRef({ px: 0, py: 0, x: 0, y: 0, seen: false, want: 0, presence: 0, press: 0, flare: 0, focus: false });
  const tone = kitTone(spotlightTone);
  const rest0 = ambient ? L.LAMP_AMBIENT : 0;

  const motion = useKitMotion(
    () => {
      const node = root.current;
      if (!node) return;
      const st = s.current;
      node.style.setProperty("--lx", `${st.x.toFixed(1)}px`);
      node.style.setProperty("--ly", `${st.y.toFixed(1)}px`);
      node.style.setProperty("--lamp", (st.presence * (1 + st.flare * L.LAMP_FLARE_GAIN)).toFixed(3));
      node.style.setProperty("--lamp-scale", (1 + st.flare * L.LAMP_FLARE_GROW).toFixed(3));
    },
    still,
    (dtMs) => {
      const st = s.current;
      const dt = dtMs / 1000;
      const tau = still ? 0 : L.lampFollowTau(smoothing);
      st.x = follow(st.x, st.px, dt, tau);
      st.y = follow(st.y, st.py, dt, tau);
      const target = Math.max(st.focus ? 1 : st.want, rest0);
      st.presence = still ? target : follow(st.presence, target, dt, L.LAMP_PRESENCE_S);
      const fl = flare && !still ? st.press : 0;
      st.flare = follow(st.flare, fl, dt, L.LAMP_FLARE_S);
      return st.x !== st.px || st.y !== st.py || st.presence !== target || st.flare !== fl;
    },
  );

  useEffect(() => {
    const centre = (): void => {
      const node = root.current;
      if (!node) return;
      const st = s.current;
      st.px = node.clientWidth / 2;
      st.py = node.clientHeight / 2;
      if (!st.seen) Object.assign(st, { x: st.px, y: st.py });
    };
    centre();
    motion.wake();
    const onMove = (event: PointerEvent): void => {
      const node = root.current;
      if (!node) return;
      const p = cardPoint(node.getBoundingClientRect(), event.clientX, event.clientY);
      const st = s.current;
      st.want = L.lampReach(p.out, proximity);
      if (st.want > 0 || !ambient) {
        st.px = p.x;
        st.py = p.y;
        if (!st.seen) Object.assign(st, { x: p.x, y: p.y, seen: true });
      } else centre();
      motion.wake();
    };
    const onOut = (event: PointerEvent): void => {
      if (event.relatedTarget) return;
      s.current.want = 0;
      centre();
      motion.wake();
    };
    const onUp = (): void => {
      s.current.press = 0;
      motion.wake();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerout", onOut);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerout", onOut);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [proximity, ambient, motion]);

  const focusTo = (on: boolean): void => {
    const node = root.current;
    const st = s.current;
    st.focus = on;
    if (on && node && st.want === 0) Object.assign(st, { px: node.clientWidth / 2, py: node.clientHeight / 2 });
    motion.wake();
  };

  return (
    <div
      ref={root}
      data-slot="lamp-card"
      {...rest}
      onPointerDown={(event) => {
        s.current.press = 1;
        motion.wake();
        rest.onPointerDown?.(event);
      }}
      onFocus={(event) => {
        focusTo(true);
        rest.onFocus?.(event);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) focusTo(false);
        rest.onBlur?.(event);
      }}
      className={cn("relative isolate overflow-hidden rounded-xl border border-border bg-card p-6 text-card-foreground", className)}
      style={style}
    >
      <span
        aria-hidden
        data-slot="lamp-card-light"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          opacity: "var(--lamp, 0)",
          background: L.lampGradient(shape, spotlightSize, softness, `color-mix(in oklab, ${tone} ${(Math.min(1, Math.max(0, intensity)) * 100).toFixed(0)}%, transparent)`),
          transform: "scale(var(--lamp-scale, 1))",
          transformOrigin: "var(--lx, 50%) var(--ly, 50%)",
        }}
      />
      {borderGlow > 0 ? (
        <span
          aria-hidden
          data-slot="lamp-card-border"
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            padding: 1,
            opacity: `calc(var(--lamp, 0) * ${borderGlow})`,
            background: L.lampGradient(shape, spotlightSize, softness, tone),
            mask: "linear-gradient(black, black) content-box, linear-gradient(black, black)",
            maskComposite: "exclude",
          }}
        />
      ) : null}
      {children}
    </div>
  );
}
