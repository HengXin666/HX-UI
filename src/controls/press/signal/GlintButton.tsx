"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 SpecularButton 条目, 实现为 HX 自有.
// ENGINE-GAP: 规格的 thickness (1.2) 与 WebGL SDF 边缘场不落地: 线宽按本库规则固定 1px, 高光用 CSS conic-gradient 近似, 见 ./glint.ts.

import { useEffect, useRef, type CSSProperties, type JSX, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { COLOR_MS, FOCUS_RING } from "../../../craft/tokens";
import { usePress } from "../../../craft/use-press";
import { createFrameLoop } from "../../../motion/frame/loop";
import { prefersReducedMotion } from "../../../primitives/motion";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { MS_PER_SECOND, PLAIN_EASE, transitionOf } from "../tokens";
import {
  arcDeg, edgeDistance, GLINT_DEFAULTS, GLINT_GLOW, GLINT_REST_DEG, glintVars, pointerDeg, proximityLevel, RING_MASK, ringGradient, sheenGradient, stepGlint,
  type Box, type GlintState,
} from "./glint";

export type GlintSize = "sm" | "md" | "lg";
/** 禁用时的不透明度与加载圆点的转速, 按钮合同 (docs/research/craft.md). */
export const GLINT_DISABLED_OPACITY = 0.45;
export const GLINT_SPIN_MS = 800;
const FULL_TURN = 360;
/** box 给外壳 (焦点环所在), face 给会缩放的内层. md 即合同的 32px / 12px. */
const SIZES: Record<GlintSize, { readonly box: string; readonly face: string }> = {
  sm: { box: "h-7", face: "px-2.5 text-xs" },
  md: { box: "h-8", face: "px-3 text-sm" },
  lg: { box: "h-11", face: "px-5 text-base" },
};

export interface GlintButtonProps {
  readonly children?: ReactNode;
  readonly size?: GlintSize;
  /** 圆角 px. 默认 8 (按钮合同). */
  readonly radius?: number;
  /** 高光与内侧反光的颜色, 语义 token 名 (foreground, primary...). */
  readonly line?: string;
  /** 底色薄层 (bg-foreground) 的不透明度. */
  readonly tintOpacity?: number;
  /** 底层背景模糊 px, 0 为不模糊. */
  readonly blur?: number;
  /** 指针贴近时的高光亮度. */
  readonly intensity?: number;
  /** 指针远离时的高光亮度. */
  readonly idleIntensity?: number;
  /** 高光实心段沿边的 px 长. */
  readonly shineSize?: number;
  /** 高光两侧淡出的 px 长. */
  readonly shineFade?: number;
  /** 外晕强度, 0 关闭. */
  readonly glow?: number;
  /** 自转速度, 圈每秒 (autoAnimate 时). */
  readonly speed?: number;
  readonly followMouse?: boolean;
  /** 指针离按钮外沿多少 px 开始提亮. */
  readonly proximity?: number;
  readonly autoAnimate?: boolean;
  readonly disabled?: boolean;
  /** 标签隐去但仍占宽, 中间转一个 12px 圆点; 期间不响应点击. */
  readonly loading?: boolean;
  readonly onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  readonly className?: string;
  readonly style?: CSSProperties;
}

/**
 * 边缘高光按钮. 1px 边上一段高光朝向指针方位, 指针越近越亮, 按下闪一下; 可选自转.
 * 焦点环 1px (库线宽规则压过合同的 2px), 偏移 2px.
 * 按压走按钮合同 (craft usePress: 0.97 + 1px, 松开 1.012 再回 1), 缩放只作用在内层, 焦点环不跟着缩.
 * 减弱动效: 高光停在左上, 悬停时直接落到 intensity, 不跟随不自转.
 */
export function GlintButton({
  children = "Get Started",
  size = "md",
  radius = 8,
  line = GLINT_DEFAULTS.line,
  tintOpacity = GLINT_DEFAULTS.tintOpacity,
  blur = GLINT_DEFAULTS.blur,
  intensity = GLINT_DEFAULTS.intensity,
  idleIntensity = GLINT_DEFAULTS.idleIntensity,
  shineSize = GLINT_DEFAULTS.shineSize,
  shineFade = GLINT_DEFAULTS.shineFade,
  glow = GLINT_DEFAULTS.glow,
  speed = GLINT_DEFAULTS.speed,
  followMouse = true,
  proximity = GLINT_DEFAULTS.proximity,
  autoAnimate = false,
  disabled = false,
  loading = false,
  onClick,
  className,
  style,
}: GlintButtonProps): JSX.Element {
  const reduced = useReducedMotion();
  const live = !disabled && !loading;
  const press = usePress(live);
  const host = useRef<HTMLButtonElement>(null);
  const state = useRef<GlintState>({ spot: GLINT_REST_DEG, level: 0, press: 0 });
  const target = useRef({ spot: GLINT_REST_DEG, level: idleIntensity, near: 0 });
  const wakeRef = useRef<() => void>(() => undefined);

  const paint = (): void => {
    const el = host.current;
    if (!el) return;
    for (const [name, value] of Object.entries(glintVars(state.current))) el.style.setProperty(name, value);
  };

  useEffect(() => {
    const el = host.current;
    if (!el) return undefined;
    const measure = (): void => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--hx-glint-core", `${arcDeg(shineSize, rect.width, rect.height)}deg`);
      el.style.setProperty("--hx-glint-fade", `${arcDeg(shineFade, rect.width, rect.height)}deg`);
    };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(measure);
    observer?.observe(el);
    return () => observer?.disconnect();
  }, [shineSize, shineFade]);

  useEffect(() => {
    const still = reduced || prefersReducedMotion();
    target.current.level = idleIntensity;
    if (still || !live) {
      state.current = { spot: GLINT_REST_DEG, level: idleIntensity, press: 0 };
      paint();
      wakeRef.current = () => paint();
      return undefined;
    }
    let visible = true;
    const loop = createFrameLoop((dtMs) => {
      const dt = dtMs / MS_PER_SECOND;
      if (autoAnimate && target.current.near <= 0) {
        state.current.spot = (state.current.spot + speed * FULL_TURN * dt) % FULL_TURN;
        target.current.spot = state.current.spot;
      }
      const settled = stepGlint(state.current, target.current, dt);
      paint();
      return visible && (autoAnimate || !settled);
    });
    wakeRef.current = loop.wake;
    loop.wake();
    const io = typeof IntersectionObserver === "undefined" ? undefined : new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (visible) loop.wake();
    });
    if (host.current) io?.observe(host.current);
    const onMove = (event: globalThis.PointerEvent): void => {
      const el = host.current;
      if (!el) return;
      const rect: Box = el.getBoundingClientRect();
      const distance = edgeDistance(rect, event.clientX, event.clientY);
      target.current.near = distance < proximity ? 1 : 0;
      target.current.level = proximityLevel(distance, proximity, idleIntensity, intensity);
      if (target.current.near) target.current.spot = pointerDeg(rect, event.clientX, event.clientY);
      loop.wake();
    };
    if (followMouse) window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      io?.disconnect();
      loop.stop();
    };
  }, [reduced, live, autoAnimate, followMouse, proximity, idleIntensity, intensity, speed]);

  const flash = (): void => {
    if (!live) return;
    state.current.press = 1;
    wakeRef.current();
  };
  const hoverStill = (level: number): void => {
    if (!live || !(reduced || prefersReducedMotion())) return;
    state.current.level = level;
    paint();
  };
  const activate = (event: KeyboardEvent<HTMLButtonElement>): void => {
    press.onKeyDown(event);
    if (!event.repeat && (event.key === "Enter" || event.key === " ")) flash();
  };

  const rounded: CSSProperties = { borderRadius: radius };
  const ring: CSSProperties = { ...rounded, padding: 1, background: ringGradient(line), mask: RING_MASK, maskComposite: "exclude", WebkitMaskComposite: "xor" };

  return (
    <button
      ref={host}
      type="button"
      data-slot="glint-button"
      data-loading={loading ? "" : undefined}
      disabled={disabled}
      aria-disabled={loading || undefined}
      aria-busy={loading || undefined}
      className={cn(
        "group relative inline-flex select-none align-middle",
        FOCUS_RING,
        live ? "cursor-pointer" : "cursor-default",
        SIZES[size].box,
        className,
      )}
      style={{ ...rounded, opacity: disabled ? GLINT_DISABLED_OPACITY : 1, transition: transitionOf([["opacity", COLOR_MS, PLAIN_EASE]], reduced), ...style }}
      onClick={(event) => {
        if (loading) return;
        onClick?.(event);
      }}
      onPointerDown={(event: PointerEvent<HTMLButtonElement>) => {
        press.onPointerDown(event);
        if (event.button === 0) flash();
      }}
      onPointerUp={press.onPointerUp}
      onPointerCancel={press.onPointerCancel}
      onPointerEnter={() => hoverStill(intensity)}
      onPointerLeave={() => hoverStill(idleIntensity)}
      onKeyDown={activate}
      onKeyUp={press.onKeyUp}
    >
      <span
        data-slot="glint-face"
        className={cn("relative flex h-full w-full items-center justify-center overflow-hidden border border-border font-medium text-foreground", SIZES[size].face)}
        style={{ ...rounded, ...press.style }}
      >
        <span aria-hidden className="absolute inset-0 bg-foreground" style={{ opacity: tintOpacity }} />
        {blur > 0 ? <span aria-hidden className="absolute inset-0" style={{ backdropFilter: `blur(${blur}px)` }} /> : null}
        <span aria-hidden className="absolute inset-0" style={{ background: sheenGradient(line) }} />
        <span className={cn("relative whitespace-nowrap", loading && "invisible")}>{children}</span>
        {loading ? (
          <span aria-hidden className="absolute inset-0 grid place-items-center">
            <span className={cn("size-3 rounded-full border border-current border-t-transparent", !reduced && "animate-spin")} style={{ animationDuration: `${GLINT_SPIN_MS}ms` }} />
          </span>
        ) : null}
      </span>
      <span aria-hidden data-slot="glint-ring" className="pointer-events-none absolute inset-0" style={{ transform: press.style.transform }}>
        {glow > 0 ? (
          <span className="absolute inset-0" style={{ filter: `blur(${GLINT_GLOW.blurPx}px)`, opacity: Math.min(1, glow * GLINT_GLOW.alpha) }}>
            <span className="absolute" style={{ ...ring, inset: -GLINT_GLOW.outsetPx, padding: GLINT_GLOW.bandPx, borderRadius: radius + GLINT_GLOW.outsetPx }} />
          </span>
        ) : null}
        <span className="absolute inset-0" style={ring} />
      </span>
    </button>
  );
}
