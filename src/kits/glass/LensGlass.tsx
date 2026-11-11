"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 FluidGlass 条目, 实现为 HX 自有.

import { useEffect, useRef, useState, type JSX, type PointerEvent, type ReactNode } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { cn } from "../../primitives/utils";
import * as L from "./parts/lens-spec";
import { clamp, kitTone, useKitMotion, type KitTone } from "../tokens";

export { LENS_DEFAULTS, LENS_EXTENT, lensBox, lensFilter, lensFollow, lensIdle, lensStretch, lensTilt, type LensInteraction, type LensShape } from "./parts/lens-spec";

export interface LensGlassProps {
  /** 镜片下面的内容; 不给时用 src 图片, 再不给时用 text 大字. */
  readonly children?: ReactNode;
  readonly text?: string;
  readonly fontWeight?: number;
  readonly src?: string;
  readonly fit?: "cover" | "contain";
  readonly shape?: L.LensShape;
  readonly size?: number;
  /** 0..1: 饱和与对比 (折射的近似). */
  readonly refraction?: number;
  /** 0..1: 高光与提亮. */
  readonly reflection?: number;
  /** 0..1: 磨砂模糊. */
  readonly frost?: number;
  /** 0..1: 镜片染色的浓度, 色由 tintTone 定. */
  readonly tint?: number;
  readonly tintTone?: KitTone;
  /** 0..1: 投影浓度. */
  readonly shadow?: number;
  readonly interaction?: L.LensInteraction;
  /** 0..1: 跟随指针的迟滞. */
  readonly smoothness?: number;
  /** 0..1: 拉伸与按压的晃动量. */
  readonly wobble?: number;
  /** 0..1: 自转速度 (torus, cube, prism, diamond). */
  readonly spin?: number;
  /** 无指针时镜片绕中心漂移. */
  readonly idle?: boolean;
  readonly ariaLabel?: string;
  readonly className?: string;
}

/**
 * 玻璃镜片: 一块 backdrop-filter 玻璃跟着指针 (follow), 被拖着走 (drag) 或停在中心 (static), 跟随时间常数 0.02 + smoothness × 0.2 s.
 * 移动时沿速度方向拉伸并朝运动方向倾斜, 按下时按 2.5 × wobble 反向一晃, 都是弹簧; 挂上时从 0 弹出. idle 时无指针就绕中心漂移, spin 让有棱角的形状自转.
 * 离屏与页面隐藏时停帧. 减弱动效时镜片直接贴指针, 无形变, 晃动, 自转与漂移.
 * ENGINE-GAP: 没有 WebGL 光路, 镜片下的内容不折射不放大, 无色散, 焦散与菲涅尔边光.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-glass.md
 */
export function LensGlass({
  children,
  text = L.LENS_DEFAULTS.text,
  fontWeight = L.LENS_DEFAULTS.fontWeight,
  src,
  fit = "cover",
  shape = "torus",
  size = L.LENS_DEFAULTS.size,
  refraction = L.LENS_DEFAULTS.refraction,
  reflection = L.LENS_DEFAULTS.reflection,
  frost = L.LENS_DEFAULTS.frost,
  tint = L.LENS_DEFAULTS.tint,
  tintTone = "primary",
  shadow = L.LENS_DEFAULTS.shadow,
  interaction = "follow",
  smoothness = L.LENS_DEFAULTS.smoothness,
  wobble = L.LENS_DEFAULTS.wobble,
  spin = L.LENS_DEFAULTS.spin,
  idle = true,
  ariaLabel,
  className,
}: LensGlassProps): JSX.Element {
  const reduced = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  const lens = useRef<HTMLDivElement>(null);
  const s = useRef({ x: 0, y: 0, tx: 0, ty: 0, w: 0, h: 0, over: false, held: false, t: 0, turn: 0, placed: false });
  const [awake, setAwake] = useState(true);
  const box = L.lensBox(shape, size);
  const spins = shape === "torus" || shape === "cube" || shape === "prism" || shape === "diamond";

  const motion = useKitMotion(
    (m) => {
      const st = s.current;
      const node = lens.current;
      if (!node) return;
      const k = m.get("stretch") || 1;
      const angle = m.get("angle");
      node.style.transform =
        `translate3d(${(st.x - box.width / 2).toFixed(2)}px, ${(st.y - box.height / 2).toFixed(2)}px, 0) perspective(600px) rotateX(${m.get("tiltX").toFixed(2)}deg) rotateY(${m.get("tiltY").toFixed(2)}deg) ` +
        `rotate(${angle.toFixed(2)}deg) scale(${k.toFixed(4)}, ${(1 / k).toFixed(4)}) rotate(${(0 - angle).toFixed(2)}deg) rotate(${(box.rotate + st.turn).toFixed(2)}deg) scale(${m.get("scale").toFixed(4)})`;
    },
    reduced,
    (dtMs) => {
      const st = s.current;
      if (!awake && !st.over) return false;
      const dt = Math.min(L.LENS_MAX_DT_S, dtMs / 1000);
      st.t += dt;
      let [gx, gy] = [st.tx, st.ty];
      if (interaction === "static" || (!st.over && !st.held)) [gx, gy] = idle && !reduced && interaction !== "static" ? L.lensIdle(st.t, st.w, st.h) : interaction === "static" ? [st.w / 2, st.h / 2] : [st.x, st.y];
      const k = reduced || st.held ? 1 : L.lensFollow(dtMs, smoothness);
      const [px, py] = [st.x, st.y];
      st.x += (gx - st.x) * k;
      st.y += (gy - st.y) * k;
      if (reduced) return false;
      if (spins) st.turn = (st.turn + spin * L.LENS_SPIN_DEG_S * dt) % 360;
      const vx = dt > 0 ? (st.x - px) / dt : 0;
      const vy = dt > 0 ? (st.y - py) / dt : 0;
      const stretch = L.lensStretch(vx, vy);
      if (stretch.amount > 0.002) motion.jump("angle", stretch.angle);
      motion.spring("stretch", 1 + stretch.amount * clamp(wobble * 2, 0, 1), L.LENS_STRETCH_SPRING);
      const tilt = L.lensTilt(vx, vy);
      motion.spring("tiltX", tilt.x, L.LENS_TILT_SPRING);
      motion.spring("tiltY", tilt.y, L.LENS_TILT_SPRING);
      return true;
    },
  );

  // 量台面, 摆到起点, 从 0 弹出
  useEffect(() => {
    const node = stage.current;
    if (!node) return undefined;
    const measure = (): void => {
      const st = s.current;
      st.w = node.clientWidth;
      st.h = node.clientHeight;
      if (!st.placed) {
        Object.assign(st, { x: st.w / 2, y: st.h / 2, tx: st.w / 2, ty: st.h / 2, placed: true });
      }
      motion.wake();
    };
    measure();
    motion.jump("stretch", 1);
    if (reduced) motion.jump("scale", 1);
    else {
      motion.jump("scale", 0);
      motion.spring("scale", 1, L.LENS_SCALE_SPRING);
    }
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    ro?.observe(node);
    const io = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => setAwake(Boolean(entry?.isIntersecting) && document.visibilityState !== "hidden"));
    io?.observe(node);
    const onVis = (): void => setAwake(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", onVis);
    return () => {
      ro?.disconnect();
      io?.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);
  useEffect(() => {
    if (awake) motion.wake();
  }, [awake, motion]);

  const aim = (event: PointerEvent<HTMLDivElement>): void => {
    const r = stage.current?.getBoundingClientRect();
    if (!r) return;
    s.current.tx = event.clientX - r.left;
    s.current.ty = event.clientY - r.top;
    motion.wake();
  };
  const onMove = (event: PointerEvent<HTMLDivElement>): void => {
    if (interaction === "follow" || s.current.held) aim(event);
    if (interaction === "follow") s.current.over = true;
  };
  const onDown = (event: PointerEvent<HTMLDivElement>): void => {
    if (interaction === "drag") {
      s.current.held = true;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      aim(event);
    }
    if (!reduced) motion.spring("stretch", 1, L.LENS_STRETCH_SPRING, 0 - L.LENS_PRESS_KICK * wobble);
  };
  const release = (): void => {
    s.current.held = false;
  };
  const onLeave = (): void => {
    s.current.over = false;
    motion.wake();
  };

  return (
    <div
      ref={stage}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      data-slot="lens-glass"
      onPointerMove={onMove}
      onPointerDown={onDown}
      onPointerUp={release}
      onPointerCancel={() => {
        release();
        onLeave();
      }}
      onPointerLeave={onLeave}
      className={cn("relative min-h-80 w-full touch-none select-none overflow-hidden", interaction === "drag" && "cursor-grab", className)}
    >
      <div aria-hidden={ariaLabel ? true : undefined} className="absolute inset-0 grid place-items-center">
        {children ?? (src ? <img src={src} alt="" draggable={false} className="h-full w-full" style={{ objectFit: fit }} /> : <span className="px-6 text-center text-6xl tracking-tight text-foreground" style={{ fontWeight }}>{text}</span>)}
      </div>
      <div
        ref={lens}
        aria-hidden
        data-slot="lens-glass-lens"
        className="pointer-events-none absolute left-0 top-0 will-change-transform"
        style={{
          width: box.width,
          height: box.height,
          borderRadius: box.borderRadius,
          clipPath: box.clipPath,
          maskImage: box.mask,
          WebkitMaskImage: box.mask,
          backdropFilter: L.lensFilter(refraction, reflection, frost),
          WebkitBackdropFilter: L.lensFilter(refraction, reflection, frost),
          background: `radial-gradient(circle at 32% 26%, color-mix(in oklab, var(--background) ${Math.round(clamp(reflection, 0, 1) * 45)}%, transparent), transparent 46%), color-mix(in oklab, ${kitTone(tintTone)} ${Math.round(clamp(tint, 0, 1) * 40)}%, transparent)`,
          boxShadow: `inset 0 0 0 1px color-mix(in oklab, var(--foreground) 18%, transparent), 0 24px 48px color-mix(in oklab, var(--foreground) ${Math.round(clamp(shadow, 0, 1) * 30)}%, transparent)`,
          transform: "scale(0)",
        }}
      />
    </div>
  );
}
