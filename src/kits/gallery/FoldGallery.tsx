"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 AccordionGallery 条目, 实现为 HX 自有.

import { useRef, useState, type JSX, type KeyboardEvent, type ReactNode } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { cn } from "../../primitives/utils";
import { KIT_FOCUS, KIT_OUT, kitTone, transitionOf, wrapIndex, type KitTone } from "./tokens";

export interface FoldItem {
  readonly image: string;
  readonly title: ReactNode;
  readonly subtitle?: ReactNode;
}

export interface FoldGalleryProps {
  readonly items: readonly FoldItem[];
  readonly defaultIndex?: number;
  /** 受控的展开项. */
  readonly index?: number;
  readonly onIndexChange?: (index: number) => void;
  readonly orientation?: "horizontal" | "vertical";
  /** 总高 px. */
  readonly height?: number;
  readonly gap?: number;
  /** 展开项占总长的比例. */
  readonly expandRatio?: number;
  readonly trigger?: "hover" | "click";
  readonly showLabels?: boolean;
  /** 未展开项去色. */
  readonly grayscale?: boolean;
  /** 展开过渡 ms. */
  readonly duration?: number;
  /** 标签两行的错峰 ms. */
  readonly stagger?: number;
  readonly accentTone?: KitTone;
  readonly textTone?: KitTone;
  readonly ariaLabel?: string;
  readonly className?: string;
}

/** 规格默认 (AccordionGallery.jsx:17-34). */
export const FOLD_DEFAULTS = { defaultIndex: 2, height: 460, gap: 10, expandRatio: 0.52, duration: 600, stagger: 60 } as const;
/** 标签收起时左移 px 与时长比例 (AccordionGallery.jsx:104). */
export const FOLD_LABEL_SHIFT_PX = -14;
export const FOLD_LABEL_OUT = 0.6;
/** 展开比例的取值区间, 防止除零. HX 自定. */
const RATIO_MIN = 0.05;
const RATIO_MAX = 0.95;

/** 展开项的 flex-grow, 使它占总长 ratio (其余各项 grow 为 1). 只有一项时为 1. */
export function foldGrow(count: number, ratio: number): number {
  if (count <= 1) return 1;
  const r = Math.min(RATIO_MAX, Math.max(RATIO_MIN, ratio));
  return (r * (count - 1)) / (1 - r);
}

/**
 * 手风琴画廊: 一排面板, 展开项按比例撑开, 其余等分; 展开项的色条与标题错峰滑入, 其余项可去色.
 * 悬停或点击切换, 方向键在面板间移动并展开. 减弱动效时直接切换, 无过渡.
 *
 * .agents/notes/implemented/feature/2026-11-09-kits-gallery.md
 */
export function FoldGallery({
  items,
  defaultIndex = FOLD_DEFAULTS.defaultIndex,
  index,
  onIndexChange,
  orientation = "horizontal",
  height = FOLD_DEFAULTS.height,
  gap = FOLD_DEFAULTS.gap,
  expandRatio = FOLD_DEFAULTS.expandRatio,
  trigger = "hover",
  showLabels = true,
  grayscale = true,
  duration = FOLD_DEFAULTS.duration,
  stagger = FOLD_DEFAULTS.stagger,
  accentTone = "primary",
  textTone = "foreground",
  ariaLabel = "Gallery",
  className,
}: FoldGalleryProps): JSX.Element {
  const reduced = useReducedMotion();
  const [inner, setInner] = useState(() => Math.min(Math.max(0, defaultIndex), Math.max(0, items.length - 1)));
  const active = index ?? inner;
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const grow = foldGrow(items.length, expandRatio);
  const vertical = orientation === "vertical";

  const pick = (i: number): void => {
    if (i === active) return;
    if (index === undefined) setInner(i);
    onIndexChange?.(i);
  };
  const onKey = (event: KeyboardEvent<HTMLElement>, i: number): void => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = wrapIndex(i + step, items.length);
    pick(next);
    buttons.current[next]?.focus();
  };
  const outMs = duration * FOLD_LABEL_OUT;

  return (
    <ul
      aria-label={ariaLabel}
      data-slot="fold-gallery"
      className={cn("m-0 flex w-full list-none p-0", vertical ? "flex-col" : "flex-row", className)}
      style={{ height, gap }}
    >
      {items.map((item, i) => {
        const on = i === active;
        const label = (k: number): { opacity: number; transform: string; transition: string } => ({
          opacity: on ? 1 : 0,
          transform: `translateX(${on ? 0 : FOLD_LABEL_SHIFT_PX}px)`,
          transition: transitionOf(
            [
              ["opacity", on ? duration : outMs, KIT_OUT, on ? k * stagger : 0],
              ["transform", on ? duration : outMs, KIT_OUT, on ? k * stagger : 0],
            ],
            reduced,
          ),
        });
        return (
          <li
            key={i}
            data-slot="fold-gallery-panel"
            data-active={on || undefined}
            className="relative min-h-0 min-w-0 overflow-hidden rounded-xl"
            style={{ flexGrow: on ? grow : 1, flexBasis: 0, transition: transitionOf([["flex-grow", duration, KIT_OUT]], reduced) }}
          >
            <button
              ref={(node) => {
                buttons.current[i] = node;
              }}
              type="button"
              aria-pressed={on}
              onPointerEnter={trigger === "hover" ? () => pick(i) : undefined}
              onFocus={() => pick(i)}
              onClick={() => pick(i)}
              onKeyDown={(event) => onKey(event, i)}
              className={cn("absolute inset-0 block size-full cursor-pointer border-0 bg-transparent p-0 text-left", KIT_FOCUS)}
            >
              <img
                src={item.image}
                alt=""
                draggable={false}
                className="absolute inset-0 size-full object-cover"
                style={{ filter: grayscale && !on ? "grayscale(1)" : "grayscale(0)", transition: transitionOf([["filter", duration, KIT_OUT]], reduced) }}
              />
              {showLabels ? (
                <span className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-5" style={{ color: kitTone(textTone) }}>
                  <span data-slot="fold-gallery-bar" className="block h-10 w-1 shrink-0 rounded-full" style={{ backgroundColor: kitTone(accentTone), ...label(0) }} />
                  <span data-slot="fold-gallery-text" className="flex flex-col" style={label(1)}>
                    <span className="text-lg font-semibold">{item.title}</span>
                    {item.subtitle ? <span className="text-sm opacity-80">{item.subtitle}</span> : null}
                  </span>
                </span>
              ) : (
                <span className="sr-only">{item.title}</span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
