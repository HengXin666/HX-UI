"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 GlassIcons 条目, 实现为 HX 自有.
// ENGINE-GAP: 规格用 WebGL 着色器做折射, 斜面与色散 (refraction / bevel / dispersion); 本件改用 backdrop-blur 加 1px 高光边与渐变光泽, 不做折射与色散.

import { useEffect, useRef, useState, type HTMLAttributes, type JSX, type KeyboardEvent, type ReactNode } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cssCurve } from "../../../motion/curves";
import { prefersReducedMotion } from "../../../primitives/motion";
import { cn } from "../../../primitives/utils";
import { MS_PER_SECOND, NAV_FOCUS, navTone, transitionOf, type NavTone, useNavMotion } from "../tokens";
import { GLASS_CIRCLE, GLASS_DEFAULTS, GLASS_ENTER_SPRING, GLASS_FROST_PX, GLASS_HOVER_SPRING, GLASS_LABEL_DROP, GLASS_LABEL_MS, GLASS_STAGGER_S, glassTransform, gridMove, plateTransform, type GlassHover, type GlassPlate } from "./parts/glass-spec";

export { GLASS_DEFAULTS, GLASS_STAGGER_S, glassTransform, gridMove, plateTransform, type GlassHover, type GlassPlate } from "./parts/glass-spec";

export interface GlassTile {
  readonly id: string;
  readonly label: string;
  readonly icon: ReactNode;
  /** 背板色. */
  readonly tone?: NavTone;
  /** 给了就渲染成链接. */
  readonly href?: string;
  readonly onSelect?: () => void;
}

export interface GlassTilesProps {
  readonly items: readonly GlassTile[];
  readonly size?: number;
  readonly gap?: number;
  readonly columns?: number;
  /** 0 方角, 1 圆. */
  readonly roundness?: number;
  /** 0..1 背景模糊强度. */
  readonly frost?: number;
  /** 0..1 光泽强度. */
  readonly shine?: number;
  readonly tintTone?: NavTone;
  readonly tintOpacity?: number;
  readonly plate?: GlassPlate;
  readonly tilt?: number;
  readonly spread?: number;
  readonly hover?: GlassHover;
  readonly labels?: "hover" | "always" | "none";
  readonly intro?: boolean;
  readonly onSelect?: (id: string) => void;
  readonly ariaLabel?: string;
  readonly className?: string;
}

type ShellProps = HTMLAttributes<HTMLElement> & { readonly href?: string; readonly shellRef: (node: HTMLElement | null) => void };

/** 一格的外壳: 有 href 是链接, 否则是 type=button 的按钮. */
function TileShell({ href, shellRef, ...rest }: ShellProps): JSX.Element {
  if (href) return <a ref={shellRef} href={href} {...rest} />;
  return <button ref={shellRef} type="button" {...rest} />;
}

const enterId = (i: number): string => `enter${i}`;
const hoverId = (i: number): string => `hover${i}`;
const PERCENT = 100;
const HALF = 0.5;

/**
 * 玻璃图标格: 每格一块彩色背板 (倾斜, 错位或圆形) 衬在磨砂玻璃面后; 入场按 0.07s 错峰浮起, 悬停按压或抬起, 背板随之摆开.
 * 方向键按网格移焦点. 减弱动效时不入场, 悬停姿态直接落定, 标签过渡为 none.
 *
 * .agents/notes/implemented/feature/2026-11-09-controls-nav.md
 */
export function GlassTiles({
  items,
  size = GLASS_DEFAULTS.size,
  gap = GLASS_DEFAULTS.gap,
  columns = GLASS_DEFAULTS.columns,
  roundness = GLASS_DEFAULTS.roundness,
  frost = GLASS_DEFAULTS.frost,
  shine = GLASS_DEFAULTS.shine,
  tintTone = "background",
  tintOpacity = GLASS_DEFAULTS.tintOpacity,
  plate = "tilt",
  tilt = GLASS_DEFAULTS.tilt,
  spread = GLASS_DEFAULTS.spread,
  hover = "press",
  labels = "hover",
  intro = true,
  onSelect,
  ariaLabel = "Apps",
  className,
}: GlassTilesProps): JSX.Element {
  const reduced = useReducedMotion();
  const refs = useRef<Array<HTMLElement | null>>([]);
  const glass = useRef<Array<HTMLSpanElement | null>>([]);
  const plates = useRef<Array<HTMLSpanElement | null>>([]);
  const [shown, setShown] = useState<number | null>(null);
  const radius = (size * Math.min(1, Math.max(0, roundness))) / 2;

  const motion = useNavMotion((m) => {
    items.forEach((_, i) => {
      const h = m.get(hoverId(i));
      const face = glass.current[i];
      if (face) {
        const e = m.get(enterId(i), 1);
        face.style.transform = glassTransform(hover, size, e, h);
        face.style.opacity = String(Math.min(1, Math.max(0, e)));
      }
      const back = plates.current[i];
      if (back) back.style.transform = plateTransform(plate, size, tilt, spread, h);
    });
  }, reduced);

  // useReducedMotion 首帧恒为 false, 入场前再同步问一次媒体查询, 免得减弱动效下也播一遍
  useEffect(() => {
    const still = !intro || reduced || prefersReducedMotion();
    items.forEach((_, i) => {
      if (still) {
        motion.jump(enterId(i), 1);
        return;
      }
      motion.jump(enterId(i), 0);
      motion.spring(enterId(i), 1, GLASS_ENTER_SPRING, 0, i * GLASS_STAGGER_S * MS_PER_SECOND);
    });
    // 只在挂上与项数变化时入场
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  useEffect(() => {
    if (reduced) items.forEach((_, i) => motion.jump(enterId(i), 1));
    // 切到减弱动效时把入场直接落定
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  const lean = (i: number, on: boolean): void => {
    if (hover === "none" && plate === "none") return;
    motion.spring(hoverId(i), on ? 1 : 0, GLASS_HOVER_SPRING);
    setShown(on ? i : null);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>): void => {
    const from = refs.current.findIndex((node) => node === document.activeElement);
    const next = gridMove(event.key, from < 0 ? 0 : from, items.length, columns);
    if (next === null) return;
    event.preventDefault();
    refs.current[next]?.focus();
  };

  const labelOn = (i: number): boolean => labels === "always" || (labels === "hover" && shown === i);
  const ease = cssCurve("outQuint");
  return (
    <nav aria-label={ariaLabel} data-slot="glass-tiles" className={className}>
      <ul className="m-0 grid list-none p-0" style={{ gridTemplateColumns: `repeat(${Math.max(1, columns)}, ${size}px)`, gap }} onKeyDown={onKeyDown}>
        {items.map((item, i) => {
          return (
            <li key={item.id} className="relative" style={{ width: size, height: size }}>
              <TileShell
                href={item.href}
                shellRef={(node) => {
                  refs.current[i] = node;
                }}
                aria-label={item.label}
                data-slot="glass-tiles-tile"
                className={cn("relative block size-full select-none no-underline", NAV_FOCUS)}
                style={{ borderRadius: radius }}
                onPointerEnter={() => lean(i, true)}
                onPointerLeave={() => lean(i, false)}
                onFocus={() => lean(i, true)}
                onBlur={() => lean(i, false)}
                onClick={() => {
                  item.onSelect?.();
                  onSelect?.(item.id);
                }}
              >
                {plate !== "none" ? (
                  <span
                    ref={(node) => {
                      plates.current[i] = node;
                    }}
                    aria-hidden
                    data-slot="glass-tiles-plate"
                    className="absolute"
                    style={
                      plate === "circle"
                        ? { width: size * GLASS_CIRCLE, height: size * GLASS_CIRCLE, right: 0, top: 0, borderRadius: "50%", backgroundColor: navTone(item.tone ?? "primary") }
                        : { inset: 0, borderRadius: radius, backgroundColor: navTone(item.tone ?? "primary") }
                    }
                  />
                ) : null}
                <span
                  ref={(node) => {
                    glass.current[i] = node;
                  }}
                  aria-hidden
                  data-slot="glass-tiles-glass"
                  className="absolute inset-0 flex items-center justify-center overflow-hidden border border-border text-foreground"
                  style={{ borderRadius: radius, backdropFilter: `blur(${frost * GLASS_FROST_PX}px)`, backgroundColor: `color-mix(in oklab, ${navTone(tintTone)} ${tintOpacity * PERCENT}%, transparent)` }}
                >
                  <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-background to-transparent" style={{ opacity: shine * HALF }} />
                  <span className="relative flex items-center justify-center" style={{ width: size * HALF, height: size * HALF }}>
                    {item.icon}
                  </span>
                </span>
                {labels !== "none" ? (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 top-full mt-2 whitespace-nowrap text-sm text-foreground"
                    style={{
                      opacity: labelOn(i) ? 1 : 0,
                      transform: `translate(-50%, ${labelOn(i) ? 0 : -GLASS_LABEL_DROP}px)`,
                      transition: transitionOf([["opacity", GLASS_LABEL_MS, ease], ["transform", GLASS_LABEL_MS, ease]], reduced),
                    }}
                  >
                    {item.label}
                  </span>
                ) : null}
              </TileShell>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
