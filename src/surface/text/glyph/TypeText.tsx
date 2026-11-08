"use client";
// 行为规格参照 docs/research/catalog/textanimations.md 的 TextType 条目, 实现为 HX 自有.

import { useEffect, useRef, useState, type ElementType, type JSX } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { playLoop } from "../../../motion/frame/play-loop";
import { cn } from "../../../primitives/utils";
import { hash01, mix } from "../kernel/curve";
import { graphemes } from "../kernel/split";
import { MS_PER_S, SR_ONLY } from "../kernel/tokens";
import { usePlayhead } from "../kernel/use-playhead";
import { TYPE_DEFAULTS } from "./tokens";

export type TypePhase = "wait" | "typing" | "pause" | "deleting" | "done";

export interface TypeTiming {
  /** 第 s 句第 i 个字的打字耗时 (毫秒). */
  readonly typing: (s: number, i: number) => number;
  readonly deleting: number;
  readonly pause: number;
  readonly loop: boolean;
  /** backspace 逐字退; clear 一次清空. */
  readonly deleteMode: "backspace" | "clear";
}

export interface TypeFrame {
  readonly index: number;
  /** 当前句显示的字数. */
  readonly count: number;
  readonly phase: TypePhase;
}

function typeSpan(len: number, s: number, o: TypeTiming): number {
  let total = 0;
  for (let i = 0; i < len; i += 1) total += o.typing(s, i);
  return total;
}

/** 一整圈的时长. 不循环时最后一句打完即止. */
export function typeCycle(lengths: readonly number[], o: TypeTiming): number {
  return lengths.reduce((sum, len, s) => {
    const last = s === lengths.length - 1 && !o.loop;
    return sum + typeSpan(len, s, o) + (last ? 0 : o.pause + (o.deleteMode === "clear" ? 0 : len * o.deleting));
  }, 0);
}

/** 打字状态机的纯函数: 时间进, 第几句, 显示几个字, 处在哪一段. */
export function typeFrame(lengths: readonly number[], t: number, o: TypeTiming): TypeFrame {
  if (lengths.length === 0 || t < 0) return { index: 0, count: 0, phase: "wait" };
  const cycle = typeCycle(lengths, o);
  let rest = o.loop && cycle > 0 ? t % cycle : t;
  for (let s = 0; s < lengths.length; s += 1) {
    const len = lengths[s];
    for (let i = 0; i < len; i += 1) {
      const d = o.typing(s, i);
      if (rest < d) return { index: s, count: i, phase: "typing" };
      rest -= d;
    }
    if (s === lengths.length - 1 && !o.loop) return { index: s, count: len, phase: "done" };
    if (rest < o.pause) return { index: s, count: len, phase: "pause" };
    rest -= o.pause;
    const del = o.deleteMode === "clear" ? 0 : len * o.deleting;
    if (rest < del) return { index: s, count: len - Math.floor(rest / o.deleting) - 1, phase: "deleting" };
    rest -= del;
  }
  return { index: lengths.length - 1, count: lengths.at(-1) ?? 0, phase: "done" };
}

export interface TypeTextProps {
  readonly text: string | readonly string[];
  readonly typingSpeed?: number;
  /** 给了就在 min 到 max 毫秒之间逐字取确定的随机速度. */
  readonly variableSpeed?: { readonly min: number; readonly max: number };
  readonly initialDelay?: number;
  readonly pauseDuration?: number;
  readonly deletingSpeed?: number;
  readonly deleteMode?: "backspace" | "clear";
  readonly loop?: boolean;
  readonly showCursor?: boolean;
  readonly hideCursorWhileTyping?: boolean;
  readonly cursorCharacter?: string;
  /** 光标半周期 (秒). */
  readonly cursorBlinkDuration?: number;
  readonly cursorClassName?: string;
  /** 每句的类 (语义 token), 按句轮用. */
  readonly textClassNames?: readonly string[];
  readonly prefix?: string;
  readonly prefixClassName?: string;
  /** 进视口才开始打. */
  readonly startOnVisible?: boolean;
  readonly onSentenceComplete?: (sentence: string, index: number) => void;
  readonly as?: ElementType;
  readonly className?: string;
}

/**
 * 打字机: 逐字打出, 停顿, 退格, 换下一句, 可循环. 状态机是时间的纯函数 (typeFrame), 播放头只提供时间.
 * 光标闪烁走 motion/frame 的 playLoop. 读屏读全部句子. 减弱动效时直接显示第一句, 光标不闪.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-text-glyph.md
 */
export function TypeText({
  text,
  typingSpeed = TYPE_DEFAULTS.typingSpeed,
  variableSpeed,
  initialDelay = TYPE_DEFAULTS.initialDelay,
  pauseDuration = TYPE_DEFAULTS.pauseDuration,
  deletingSpeed = TYPE_DEFAULTS.deletingSpeed,
  deleteMode = "backspace",
  loop = true,
  showCursor = true,
  hideCursorWhileTyping = false,
  cursorCharacter = TYPE_DEFAULTS.cursorCharacter,
  cursorBlinkDuration = TYPE_DEFAULTS.cursorBlinkDuration,
  cursorClassName,
  textClassNames = [],
  prefix = "",
  prefixClassName,
  startOnVisible = false,
  onSentenceComplete,
  as: Tag = "span",
  className,
}: TypeTextProps): JSX.Element {
  const reduced = useReducedMotion();
  const root = useRef<HTMLElement>(null);
  const cursor = useRef<HTMLSpanElement>(null);
  const sentences = (typeof text === "string" ? [text] : [...text]).map(graphemes);
  const lengths = sentences.map((s) => s.length);
  const timing: TypeTiming = {
    typing: (s, i) => (variableSpeed ? mix(variableSpeed.min, variableSpeed.max, hash01(s + 1, i + 1)) : typingSpeed),
    deleting: deletingSpeed,
    pause: pauseDuration,
    loop,
    deleteMode,
  };
  const cycle = typeCycle(lengths, timing);
  const [laps, setLaps] = useState(0);
  const head = usePlayhead(root, { durationMs: loop ? cycle : cycle + initialDelay, reduced, trigger: startOnVisible ? "view" : "mount", loop, onComplete: () => setLaps((n) => n + 1) });
  const t = (loop ? laps * cycle : 0) + head.elapsedMs - initialDelay;
  const frame = reduced ? { index: 0, count: lengths[0] ?? 0, phase: "done" as const } : typeFrame(lengths, head.started ? t : -1, timing);

  const report = useRef(onSentenceComplete);
  report.current = onSentenceComplete;
  const pausedAt = frame.phase === "pause" || frame.phase === "done" ? frame.index : -1;
  useEffect(() => {
    if (pausedAt >= 0 && !reduced) report.current?.(sentences[pausedAt].join(""), pausedAt);
    // 只在进入停顿那一刻回调
  }, [pausedAt, laps]);

  useEffect(() => {
    if (reduced || !showCursor) return undefined;
    return playLoop(cursor.current, [{ opacity: 1 }, { opacity: 0 }], { duration: cursorBlinkDuration * MS_PER_S, direction: "alternate", easing: "ease-in-out" });
  }, [reduced, showCursor, cursorBlinkDuration]);

  const busy = frame.phase === "typing" || frame.phase === "deleting";
  const all = sentences.map((s) => s.join(""));
  return (
    <Tag ref={root} data-slot="type-text" data-phase={frame.phase} className={className}>
      <span className={SR_ONLY}>{prefix}{all.join(" ")}</span>
      <span aria-hidden="true">
        {prefix ? <span className={prefixClassName}>{prefix}</span> : null}
        <span className={textClassNames.length > 0 ? textClassNames[frame.index % textClassNames.length] : undefined}>{sentences[frame.index]?.slice(0, frame.count).join("") ?? ""}</span>
        {showCursor ? (
          <span ref={cursor} className={cn("ml-0.5 inline-block", cursorClassName)} style={{ opacity: hideCursorWhileTyping && busy ? 0 : undefined }}>
            {cursorCharacter}
          </span>
        ) : null}
      </span>
    </Tag>
  );
}
