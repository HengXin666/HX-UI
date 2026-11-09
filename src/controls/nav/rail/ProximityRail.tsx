"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 LineSidebar 条目, 实现为 HX 自有.

import { useRef, useState, type JSX, type KeyboardEvent } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { BarEntry, type BarItem } from "../bar/parts/bar-entry";
import { useNavMotion } from "../parts/use-nav-motion";
import { DOUBLE, NAV_DISABLED, NAV_FOCUS, PLAIN_EASE, PX, navTone, transitionOf, type NavTone } from "../tokens";
import { RAIL_COLOR_MS, RAIL_DEFAULTS, RAIL_INDEX_PAD, railMarker, railTarget, type RailFalloff } from "./parts/rail-spec";

export { RAIL_DEFAULTS, RAIL_FALLOFF, railMarker, railTarget, type RailFalloff } from "./parts/rail-spec";

export interface ProximityRailProps {
  readonly items: readonly BarItem[];
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onChange?: (value: string) => void;
  readonly accentTone?: NavTone;
  readonly textTone?: NavTone;
  readonly markerTone?: NavTone;
  /** 条目前显示两位序号. */
  readonly showIndex?: boolean;
  /** 条目前显示刻度线. */
  readonly showMarker?: boolean;
  /** 指针影响半径 px. */
  readonly proximityRadius?: number;
  /** 强度 1 时文字右移 px. */
  readonly maxShift?: number;
  readonly falloff?: RailFalloff;
  readonly markerLength?: number;
  readonly markerGap?: number;
  /** 强度 0 时刻度线的长度比例. */
  readonly tickScale?: number;
  readonly scaleTick?: boolean;
  readonly itemGap?: number;
  /** 字号 rem. */
  readonly fontSize?: number;
  /** 趋近时间常数 ms. */
  readonly smoothing?: number;
  readonly ariaLabel?: string;
  readonly className?: string;
}

const channel = (i: number): string => `near${i}`;
const ACTIVE_STRENGTH = 1;

/**
 * 邻近侧栏: 竖排条目, 指针靠近的几条按距离衰减向右推, 刻度线随之拉长; 强度用规格的指数趋近平滑.
 * 键盘聚焦的条目按指针正对处理, 上下方向键与 Home / End 移焦点. 减弱动效时强度直接落定.
 *
 * .agents/notes/implemented/feature/2026-11-09-controls-nav.md
 */
export function ProximityRail({
  items,
  value,
  defaultValue,
  onChange,
  accentTone = "primary",
  textTone = "muted-foreground",
  markerTone = "border",
  showIndex = true,
  showMarker = true,
  proximityRadius = RAIL_DEFAULTS.proximityRadius,
  maxShift = RAIL_DEFAULTS.maxShift,
  falloff = "smooth",
  markerLength = RAIL_DEFAULTS.markerLength,
  markerGap = RAIL_DEFAULTS.markerGap,
  tickScale = RAIL_DEFAULTS.tickScale,
  scaleTick = true,
  itemGap = RAIL_DEFAULTS.itemGap,
  fontSize = RAIL_DEFAULTS.fontSize,
  smoothing = RAIL_DEFAULTS.smoothing,
  ariaLabel = "Sections",
  className,
}: ProximityRailProps): JSX.Element {
  const reduced = useReducedMotion();
  const [inner, setInner] = useState(defaultValue ?? null);
  const current = value ?? inner;
  const refs = useRef<Array<HTMLElement | null>>([]);
  const faces = useRef<Array<HTMLSpanElement | null>>([]);
  const ticks = useRef<Array<HTMLSpanElement | null>>([]);

  const motion = useNavMotion((m) => {
    items.forEach((_, i) => {
      const s = m.get(channel(i));
      const face = faces.current[i];
      if (face) face.style.transform = `translateX(${s * maxShift}px)`;
      const tick = ticks.current[i];
      if (tick) tick.style.width = railMarker(Math.max(s, items[i]?.value === current ? ACTIVE_STRENGTH : 0), markerLength, tickScale, scaleTick) + PX;
    });
  }, reduced);

  const aim = (pointerY: number | null): void => {
    refs.current.forEach((node, i) => {
      if (!node) return;
      let target = 0;
      if (pointerY !== null) {
        const rect = node.getBoundingClientRect();
        target = railTarget(pointerY - (rect.top + rect.height / DOUBLE), proximityRadius, falloff);
      }
      motion.ease(channel(i), target, smoothing, 0);
    });
  };

  const aimAt = (i: number): void => {
    const rect = refs.current[i]?.getBoundingClientRect();
    if (rect) aim(rect.top + rect.height / DOUBLE);
  };

  const select = (item: BarItem): void => {
    if (item.disabled) return;
    if (value === undefined) setInner(item.value);
    if (item.value !== current) onChange?.(item.value);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>): void => {
    const count = items.length;
    const from = refs.current.findIndex((node) => node === document.activeElement);
    const plan: Record<string, [number, number]> = { ArrowDown: [from, 1], ArrowUp: [from, -1], Home: [-1, 1], End: [count, -1] };
    const step = plan[event.key];
    if (!step || count === 0) return;
    event.preventDefault();
    for (let k = 1; k <= count; k += 1) {
      const i = (((step[0] + step[1] * k) % count) + count) % count;
      if (!items[i]?.disabled) {
        refs.current[i]?.focus();
        return;
      }
    }
  };

  return (
    <nav aria-label={ariaLabel} data-slot="proximity-rail" className={cn("inline-block", className)}>
      <ul
        className="m-0 flex list-none flex-col p-0"
        style={{ gap: itemGap, fontSize: `${fontSize}rem` }}
        onKeyDown={onKeyDown}
        onPointerMove={(event) => aim(event.clientY)}
        onPointerLeave={() => aim(null)}
        onFocus={(event) => {
          const i = refs.current.indexOf(event.target as HTMLElement);
          if (i >= 0) aimAt(i);
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) aim(null);
        }}
      >
        {items.map((item, i) => {
          const active = item.value === current;
          return (
            <li key={item.value}>
              <BarEntry
                item={item}
                active={active}
                entryRef={(node) => {
                  refs.current[i] = node;
                }}
                onSelect={() => select(item)}
                className={cn("flex w-full select-none items-center rounded-sm text-left no-underline", NAV_FOCUS, NAV_DISABLED)}
                style={{ gap: markerGap, color: navTone(active ? accentTone : textTone), transition: transitionOf([["color", RAIL_COLOR_MS, PLAIN_EASE]], reduced) }}
              >
                {showMarker ? (
                  <span aria-hidden className="block shrink-0" style={{ width: markerLength }}>
                    <span
                      ref={(node) => {
                        ticks.current[i] = node;
                      }}
                      data-slot="proximity-rail-tick"
                      className="block h-px"
                      style={{ width: railMarker(active ? ACTIVE_STRENGTH : 0, markerLength, tickScale, scaleTick), backgroundColor: navTone(active ? accentTone : markerTone) }}
                    />
                  </span>
                ) : null}
                <span
                  ref={(node) => {
                    faces.current[i] = node;
                  }}
                  className="inline-flex items-baseline gap-2 will-change-transform"
                >
                  {showIndex ? <span className="text-xs tabular-nums opacity-60">{String(i + 1).padStart(RAIL_INDEX_PAD, "0")}</span> : null}
                  <span>{item.label}</span>
                </span>
              </BarEntry>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
