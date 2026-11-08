"use client";
// 行为规格参照 docs/research/catalog/textanimations.md 的 TrueFocus 条目, 实现为 HX 自有.

import { useEffect, useLayoutEffect, useRef, useState, type JSX } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { useSpringChannels } from "../../../motion/drive/use-spring-channels";
import { springFromVisualDuration } from "../../../motion/spring/fit";
import { cn } from "../../../primitives/utils";
import { hash01 } from "../kernel/curve";
import { MS_PER_S, SR_ONLY } from "../kernel/tokens";
import { FOCUS_DEFAULTS, FOCUS_FILTER_S, FOCUS_FRAME_GAP_PX } from "./tokens";

export interface FocusTextProps {
  readonly sentence: string;
  /** 分词符, 默认空格. */
  readonly separator?: string;
  /** true 时焦点跟随指针悬停, 不自动轮换. */
  readonly manualMode?: boolean;
  /** sequential 依次; random 乱序. */
  readonly order?: "sequential" | "random";
  /** spring 带回弹; smooth 临界阻尼, 不过冲. */
  readonly easing?: "spring" | "smooth";
  readonly blurAmount?: number;
  readonly focusScale?: number;
  readonly unfocusedOpacity?: number;
  /** 焦点框移动的可感时长 (秒). */
  readonly animationDuration?: number;
  /** 每个词停留的时长 (秒). */
  readonly pauseBetweenAnimations?: number;
  readonly cornerSize?: number;
  /** 焦点框颜色, 语义 token 类. */
  readonly frameClassName?: string;
  /** 焦点词的附加类 (高亮色等). */
  readonly highlightClassName?: string;
  readonly onFocusChange?: (index: number) => void;
  readonly className?: string;
}

type FrameKey = "x" | "y" | "w" | "h";
const ZERO: Record<FrameKey, number> = { x: 0, y: 0, w: 0, h: 0 };
const CORNERS = ["left-0 top-0 border-l border-t", "right-0 top-0 border-r border-t", "bottom-0 left-0 border-b border-l", "bottom-0 right-0 border-b border-r"] as const;

/** 下一个焦点词. random 时避开当前词. */
export function nextFocus(index: number, count: number, order: "sequential" | "random", tick: number): number {
  if (count <= 1) return 0;
  if (order === "sequential") return (index + 1) % count;
  const pick = Math.floor(hash01(tick, count) * (count - 1));
  return pick >= index ? pick + 1 : pick;
}

/**
 * 焦点词: 一次只有一个词清晰, 其余模糊; 带四角标的焦点框以弹簧移到焦点词上, 中途换词保留速度.
 * 自动轮换或跟随悬停. 减弱动效时焦点框直接落位, 不做滤镜过渡.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-text-stagger.md
 */
export function FocusText({
  sentence,
  separator = " ",
  manualMode = false,
  order = "sequential",
  easing = "spring",
  blurAmount = FOCUS_DEFAULTS.blurAmount,
  focusScale = FOCUS_DEFAULTS.focusScale,
  unfocusedOpacity = FOCUS_DEFAULTS.unfocusedOpacity,
  animationDuration = FOCUS_DEFAULTS.animationDuration,
  pauseBetweenAnimations = FOCUS_DEFAULTS.pauseBetweenAnimations,
  cornerSize = FOCUS_DEFAULTS.cornerSize,
  frameClassName = "border-primary",
  highlightClassName,
  onFocusChange,
  className,
}: FocusTextProps): JSX.Element {
  const reduced = useReducedMotion();
  const words = sentence.split(separator).filter((w) => w.length > 0);
  const [index, setIndex] = useState(0);
  const root = useRef<HTMLSpanElement>(null);
  const frame = useRef<HTMLSpanElement>(null);
  const cells = useRef<(HTMLSpanElement | null)[]>([]);
  const placed = useRef(false);
  const spec = springFromVisualDuration(animationDuration, easing === "spring" ? FOCUS_DEFAULTS.bounce : 0);
  const specs = { x: spec, y: spec, w: spec, h: spec };
  const channels = useSpringChannels<FrameKey>(ZERO, specs, (v) => {
    const el = frame.current;
    if (!el) return;
    el.style.transform = `translate(${v.x}px, ${v.y}px)`;
    el.style.width = `${v.w}px`;
    el.style.height = `${v.h}px`;
  }, reduced);

  useEffect(() => {
    if (manualMode || words.length < 2) return undefined;
    let tick = 0;
    const id = globalThis.setInterval(() => {
      tick += 1;
      setIndex((i) => nextFocus(i, words.length, order, tick));
    }, (animationDuration + pauseBetweenAnimations) * MS_PER_S);
    return () => globalThis.clearInterval(id);
  }, [manualMode, words.length, order, animationDuration, pauseBetweenAnimations]);

  const report = useRef(onFocusChange);
  report.current = onFocusChange;
  useLayoutEffect(() => {
    const host = root.current;
    const el = cells.current[index];
    if (!host || !el) return;
    const base = host.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const box = { x: r.left - base.left - FOCUS_FRAME_GAP_PX / 2, y: r.top - base.top - FOCUS_FRAME_GAP_PX / 2, w: r.width + FOCUS_FRAME_GAP_PX, h: r.height + FOCUS_FRAME_GAP_PX };
    for (const key of Object.keys(box) as FrameKey[]) {
      if (placed.current) channels.to(key, box[key]);
      else channels.jump(key, box[key]);
    }
    placed.current = true;
    report.current?.(index);
  }, [index, sentence, channels]);

  const transition = reduced ? "none" : `filter ${FOCUS_FILTER_S}s ease, opacity ${FOCUS_FILTER_S}s ease, transform ${FOCUS_FILTER_S}s ease`;
  return (
    <span ref={root} data-slot="focus-text" className={cn("relative inline-flex flex-wrap gap-x-[0.3em]", className)}>
      <span className={SR_ONLY}>{sentence}</span>
      {words.map((word, i) => {
        const on = i === index;
        return (
          <span
            key={i}
            aria-hidden="true"
            data-focused={on || undefined}
            ref={(el) => { cells.current[i] = el; }}
            onPointerEnter={manualMode ? () => setIndex(i) : undefined}
            className={cn("inline-block", on && highlightClassName)}
            style={{ filter: on ? "none" : `blur(${blurAmount}px)`, opacity: on ? 1 : unfocusedOpacity, transform: on ? `scale(${focusScale})` : undefined, transition }}
          >
            {word}
          </span>
        );
      })}
      <span ref={frame} aria-hidden="true" className="pointer-events-none absolute left-0 top-0">
        {CORNERS.map((corner) => (
          <span key={corner} className={cn("absolute", corner, frameClassName)} style={{ width: cornerSize, height: cornerSize }} />
        ))}
      </span>
    </span>
  );
}
