"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 BubbleMenu 条目, 实现为 HX 自有.

import { useId, useRef, useState, type CSSProperties, type JSX, type ReactNode } from "react";
import { EASE, FOCUS_RING } from "../../../craft/tokens";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cssCurve } from "../../../motion/curves";
import { cn } from "../../../primitives/utils";
import { MS_PER_SECOND, PLAIN_EASE, navTone, transitionOf, type NavTone } from "../tokens";
import { BURST_BAR_GAP, BURST_CROSS_DEG, BURST_DEFAULTS, BURST_EXIT_MS, BURST_HOVER_MS, burstDelay, burstTransform } from "./parts/burst-spec";
import { LinkOrButton } from "../parts/link-or-button";
import { useMenuOpen } from "./parts/use-menu-open";

export { BURST_DEFAULTS, BURST_EXIT_MS, burstDelay, burstTransform } from "./parts/burst-spec";

export interface BurstItem {
  readonly label: ReactNode;
  readonly href?: string;
  readonly onSelect?: () => void;
  /** 静止时的摆角, 度. */
  readonly rotation?: number;
  readonly hoverTone?: NavTone;
  readonly hoverTextTone?: NavTone;
}

export interface PillBurstProps {
  readonly items: readonly BurstItem[];
  readonly logo?: ReactNode;
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly onItemClick?: (index: number) => void;
  readonly surfaceTone?: NavTone;
  readonly contentTone?: NavTone;
  /** 面板盖住整个视口, 否则落在开关下方. */
  readonly fixed?: boolean;
  /** 入场时长, 秒. */
  readonly animationDuration?: number;
  /** 每颗错峰, 秒. */
  readonly staggerDelay?: number;
  readonly menuAriaLabel?: string;
  readonly ariaLabel?: string;
  readonly className?: string;
}

/**
 * 胶囊爆开菜单: 开关一按, 一组胶囊链接按错峰从 0 弹到原尺寸 (craft 的 overshoot 曲线), 收起时一起缩回 (inQuart 0.2s).
 * 开关 aria-expanded, Escape 与点外部关闭. 减弱动效时没有缩放与延迟, 直接显隐.
 *
 * .agents/notes/implemented/feature/2026-11-09-controls-nav.md
 */
export function PillBurst({
  items,
  logo,
  open,
  defaultOpen,
  onOpenChange,
  onItemClick,
  surfaceTone = "card",
  contentTone = "foreground",
  fixed = false,
  animationDuration = BURST_DEFAULTS.animationDuration,
  staggerDelay = BURST_DEFAULTS.staggerDelay,
  menuAriaLabel = "Toggle menu",
  ariaLabel = "Main",
  className,
}: PillBurstProps): JSX.Element {
  const reduced = useReducedMotion();
  const panelId = useId();
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(-1);
  const menu = useMenuOpen({ open, defaultOpen, onOpenChange, exitMs: BURST_EXIT_MS, reduced, root, toggle });
  const bubble = "inline-flex items-center justify-center rounded-full border border-border";
  const surface: CSSProperties = { backgroundColor: navTone(surfaceTone), color: navTone(contentTone) };
  const bar = (sign: number): CSSProperties => ({
    transform: menu.open ? `translateY(${sign * BURST_BAR_GAP}px) rotate(${sign * BURST_CROSS_DEG}deg)` : "none",
    transition: transitionOf([["transform", BURST_HOVER_MS, PLAIN_EASE]], reduced),
  });

  const pillStyle = (item: BurstItem, i: number): CSSProperties => {
    const on = hovered === i;
    const entering = menu.shown;
    const motion = entering
      ? transitionOf(
          [
            ["transform", animationDuration * MS_PER_SECOND, `cubic-bezier(${EASE.overshoot})`, burstDelay(i, staggerDelay) * MS_PER_SECOND],
            ["opacity", animationDuration * MS_PER_SECOND, PLAIN_EASE, burstDelay(i, staggerDelay) * MS_PER_SECOND],
          ],
          reduced,
        )
      : transitionOf([["transform", BURST_EXIT_MS, cssCurve("inQuart")], ["opacity", BURST_EXIT_MS, cssCurve("inQuart")]], reduced);
    const settled = on ? transitionOf([["transform", BURST_HOVER_MS, PLAIN_EASE], ["background-color", BURST_HOVER_MS, PLAIN_EASE], ["color", BURST_HOVER_MS, PLAIN_EASE]], reduced) : motion;
    return {
      transform: burstTransform(entering, item.rotation ?? 0, on),
      opacity: entering ? 1 : 0,
      transition: hovered >= 0 ? settled : motion,
      backgroundColor: navTone(on ? (item.hoverTone ?? "primary") : surfaceTone),
      color: navTone(on ? (item.hoverTextTone ?? "primary-foreground") : contentTone),
    };
  };

  return (
    <div ref={root} data-slot="pill-burst" className={cn("relative", className)}>
      <div className="relative z-10 flex items-center justify-between gap-3">
        {logo ? (
          <span className={cn(bubble, "h-12 px-5")} style={surface}>
            {logo}
          </span>
        ) : (
          <span />
        )}
        <button
          ref={toggle}
          type="button"
          aria-label={menuAriaLabel}
          aria-expanded={menu.open}
          aria-controls={panelId}
          data-slot="pill-burst-toggle"
          onClick={menu.toggleOpen}
          className={cn(bubble, "size-12 flex-col gap-[5px]", FOCUS_RING)}
          style={surface}
        >
          <span aria-hidden className="block h-px w-5 bg-current" style={bar(1)} />
          <span aria-hidden className="block h-px w-5 bg-current" style={bar(-1)} />
        </button>
      </div>
      {menu.mounted ? (
        <nav
          id={panelId}
          aria-label={ariaLabel}
          data-slot="pill-burst-panel"
          data-phase={menu.phase}
          className={cn("z-0 flex items-center justify-center", fixed ? "fixed inset-0" : "absolute inset-x-0 top-full mt-4")}
        >
          <ul className="m-0 flex max-w-xl list-none flex-wrap justify-center gap-3 p-0">
            {items.map((item, i) => {
              return (
                <li key={i}>
                  <LinkOrButton
                    href={item.href}
                    data-slot="pill-burst-item"
                    className={cn("block rounded-full border border-border px-7 py-4 text-2xl font-medium no-underline", FOCUS_RING)}
                    style={pillStyle(item, i)}
                    onPointerEnter={() => setHovered(i)}
                    onPointerLeave={() => setHovered(-1)}
                    onFocus={() => setHovered(i)}
                    onBlur={() => setHovered(-1)}
                    onClick={() => {
                      item.onSelect?.();
                      onItemClick?.(i);
                      menu.setOpen(false);
                    }}
                  >
                    {item.label}
                  </LinkOrButton>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
