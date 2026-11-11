"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 PillNav 条目, 实现为 HX 自有.

import { useLayoutEffect, useRef, useState, type JSX, type PointerEvent } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { DOUBLE, NAV_DISABLED, NAV_FOCUS, PLAIN_EASE, PX, navTone, transitionOf, type NavTone, useNavMotion, type NavMotion } from "../tokens";
import { BarEntry, moveBarFocus, type BarItem } from "./parts/bar-entry";
import { PILL_COLOR_MS, PILL_DEFAULTS, PILL_POP_FROM, PILL_PRESS_SCALE, PILL_PRESS_SPRING, PILL_SIZES, PILL_SURFACE_MS, PILL_TAU, pillBox, pillSpring, type PillSize } from "./parts/pill-spec";

export { PILL_DEFAULTS, PILL_PRESS_SCALE, PILL_PRESS_SPRING, PILL_SIZES, PILL_STRETCH_GAIN, PILL_TAU, pillBox, pillSpring, type PillSize } from "./parts/pill-spec";
export type { BarItem } from "./parts/bar-entry";

export type PillIndicator = "pill" | "dot" | "both";

export interface PillTabsProps {
  readonly items: readonly BarItem[];
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onChange?: (value: string) => void;
  /** pill: 活动项底下一块; dot: 活动项下方一个点; both: 两者都有. */
  readonly indicator?: PillIndicator;
  /** 悬停时跟随一块浅色块. */
  readonly hoverFill?: boolean;
  readonly size?: PillSize;
  /** glass 半透明加模糊, solid 实底. */
  readonly surface?: "glass" | "solid";
  /** 指示块回弹 0..1. */
  readonly bounce?: number;
  /** 指示块随速度拉伸 0..1. */
  readonly stretch?: number;
  readonly highlightTone?: NavTone;
  readonly highlightTextTone?: NavTone;
  readonly textTone?: NavTone;
  readonly hoverTone?: NavTone;
  readonly ariaLabel?: string;
  readonly className?: string;
}

const PILL = "pill";
const DOT = "dot";
const ids = { x: "x", w: "w", hx: "hx", hw: "hw", alpha: "alpha", pop: "pop", press: "press", dot: "dot" } as const;

/**
 * 胶囊导航条: 活动块按弹簧滑到所选项, 速度越快拉得越宽; 悬停块指数淡入淡出并弹出; 按下有自己的弹簧.
 * 条目可以是链接或按钮, aria-current 标在活动项上; 左右方向键移焦点. 减弱动效时位置和透明度直接落定.
 *
 * .agents/notes/implemented/feature/2026-11-09-controls-nav.md
 */
export function PillTabs({
  items,
  value,
  defaultValue,
  onChange,
  indicator = PILL,
  hoverFill = true,
  size = "md",
  surface = "glass",
  bounce = PILL_DEFAULTS.bounce,
  stretch = PILL_DEFAULTS.stretch,
  highlightTone = "primary",
  highlightTextTone = "primary-foreground",
  textTone = "muted-foreground",
  hoverTone = "accent",
  ariaLabel = "Main",
  className,
}: PillTabsProps): JSX.Element {
  const reduced = useReducedMotion();
  const [inner, setInner] = useState(defaultValue ?? items[0]?.value);
  const current = value ?? inner;
  const index = items.findIndex((item) => item.value === current);
  const [height, fontSize, padX] = PILL_SIZES[size];
  const refs = useRef<Array<HTMLElement | null>>([]);
  const pill = useRef<HTMLSpanElement>(null);
  const hover = useRef<HTMLSpanElement>(null);
  const dot = useRef<HTMLSpanElement>(null);
  const pressed = useRef(-1);
  const placed = useRef(false);
  const spec = pillSpring(bounce);
  const showPill = indicator !== DOT;
  const showDot = indicator !== PILL;

  const paint = (m: NavMotion): void => {
    const box = pillBox(m.get(ids.x), m.get(ids.w), m.velocity(ids.x), reduced ? 0 : stretch);
    if (pill.current) {
      pill.current.style.width = box.width + PX;
      pill.current.style.transform = `translateX(${box.left}px)`;
      pill.current.style.opacity = index < 0 ? "0" : "1";
    }
    if (dot.current) {
      dot.current.style.transform = `translateX(${m.get(ids.x) + m.get(ids.w) / DOUBLE}px) translateX(-50%)`;
      dot.current.style.opacity = String(m.get(ids.dot));
    }
    if (hover.current) {
      hover.current.style.width = m.get(ids.hw) + PX;
      hover.current.style.transform = `translateX(${m.get(ids.hx)}px) scale(${m.get(ids.pop, 1)})`;
      hover.current.style.opacity = String(m.get(ids.alpha));
    }
    refs.current.forEach((node, i) => {
      const face = node?.firstElementChild as HTMLElement | null;
      if (face) face.style.transform = i === pressed.current ? `scale(${m.get(ids.press, 1)})` : "";
    });
  };
  const motion = useNavMotion(paint, reduced);

  useLayoutEffect(() => {
    const node = refs.current[index];
    if (!node) {
      motion.ease(ids.dot, 0, PILL_TAU.dot, 0);
      return;
    }
    if (!placed.current || reduced) {
      placed.current = true;
      motion.jump(ids.x, node.offsetLeft);
      motion.jump(ids.w, node.offsetWidth);
      motion.ease(ids.dot, 1, PILL_TAU.dot, 1);
      return;
    }
    motion.spring(ids.x, node.offsetLeft, spec);
    motion.spring(ids.w, node.offsetWidth, spec);
    motion.ease(ids.dot, 1, PILL_TAU.dot, 0);
    // 只在活动项与布局档变化时重摆
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, size, items.length, reduced]);

  const hoverTo = (i: number): void => {
    const node = refs.current[i];
    if (!hoverFill || !node || items[i]?.disabled) return;
    const hidden = motion.get(ids.alpha) < PILL_POP_FROM / DOUBLE;
    if (hidden) {
      motion.jump(ids.hx, node.offsetLeft);
      motion.jump(ids.hw, node.offsetWidth);
      motion.ease(ids.pop, PILL_POP_FROM, PILL_TAU.pop, PILL_POP_FROM);
      motion.jump(ids.pop, PILL_POP_FROM);
    } else {
      motion.spring(ids.hx, node.offsetLeft, spec);
      motion.spring(ids.hw, node.offsetWidth, spec);
    }
    motion.ease(ids.pop, 1, PILL_TAU.pop);
    motion.ease(ids.alpha, 1, PILL_TAU.hoverIn, 0);
  };

  const press = (i: number, down: boolean): void => {
    if (down) {
      pressed.current = i;
      motion.jump(ids.press, motion.get(ids.press, 1));
    }
    motion.spring(ids.press, down ? PILL_PRESS_SCALE : 1, PILL_PRESS_SPRING);
  };

  const select = (i: number): void => {
    const item = items[i];
    if (!item || item.disabled) return;
    if (value === undefined) setInner(item.value);
    if (item.value !== current) onChange?.(item.value);
  };

  return (
    <nav
      aria-label={ariaLabel}
      data-slot="pill-tabs"
      className={cn("inline-flex rounded-full border border-border p-1", surface === "glass" ? "bg-background/60 backdrop-blur-md" : "bg-muted", className)}
      style={{ transition: transitionOf([["background-color", PILL_SURFACE_MS, PLAIN_EASE]], reduced) }}
    >
      <ul
        className="relative m-0 flex list-none items-center p-0"
        onKeyDown={(event) => moveBarFocus(event, refs.current, items)}
        onPointerLeave={() => motion.ease(ids.alpha, 0, PILL_TAU.hoverOut)}
      >
        {hoverFill ? <span ref={hover} aria-hidden className="pointer-events-none absolute left-0 top-0 rounded-full opacity-0" style={{ height, backgroundColor: navTone(hoverTone) }} /> : null}
        {showPill ? <span ref={pill} aria-hidden className="pointer-events-none absolute left-0 top-0 rounded-full" style={{ height, backgroundColor: navTone(highlightTone) }} /> : null}
        {showDot ? <span ref={dot} aria-hidden className="pointer-events-none absolute left-0 size-1 rounded-full opacity-0" style={{ top: height + DOUBLE, backgroundColor: navTone(highlightTone) }} /> : null}
        {items.map((item, i) => {
          const active = i === index;
          return (
            <li key={item.value}>
              <BarEntry
                item={item}
                active={active}
                entryRef={(node) => {
                  refs.current[i] = node;
                }}
                onSelect={() => select(i)}
                onPointerEnter={() => hoverTo(i)}
                onPointerDown={(event: PointerEvent<HTMLElement>) => {
                  if (event.button === 0 && !item.disabled) press(i, true);
                }}
                onPointerUp={() => {
                  if (pressed.current === i) press(i, false);
                }}
                className={cn("relative flex select-none items-center whitespace-nowrap rounded-full font-medium no-underline", NAV_FOCUS, NAV_DISABLED)}
                style={{
                  height,
                  fontSize,
                  paddingInline: padX,
                  color: navTone(active && showPill ? highlightTextTone : active ? highlightTone : textTone),
                  transition: transitionOf([["color", PILL_COLOR_MS, PLAIN_EASE]], reduced),
                }}
              >
                <span className="relative inline-block">{item.label}</span>
              </BarEntry>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
