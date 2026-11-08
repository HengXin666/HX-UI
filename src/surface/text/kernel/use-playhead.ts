"use client";
// 行为规格参照 docs/research/catalog/textanimations.md 的 BlurText, SplitText, DecryptedText, Shuffle, TextType, FoldText, MaskedHeading 条目, 实现为 HX 自有.

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useFrameLoop } from "../../../motion/frame/use-frame-loop";
import { TEXT_CLOCK, VIEW_THRESHOLD } from "./tokens";

/**
 * 文本族的播放头: 一段毫秒时间轴, 由触发方式起播, 可循环, 可重播.
 * 帧循环走 motion/frame 的 useFrameLoop; 减弱动效时时间直接停在终点, 不排一帧.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-text-kernel.md
 */

/** mount 挂载即播; view 进视口播; hover 指针进入播; click 点击播; manual 由 play 控制. */
export type PlayTrigger = "mount" | "view" | "hover" | "click" | "manual";

export interface PlayheadOptions {
  readonly durationMs: number;
  readonly reduced: boolean;
  readonly trigger?: PlayTrigger;
  /** 播完是否从头再来. */
  readonly loop?: boolean;
  /** 循环之间停在终点的时长. */
  readonly loopDelayMs?: number;
  /** 进视口判定的露出比例. */
  readonly threshold?: number;
  readonly rootMargin?: string;
  /** view 触发时是否只播一次; false 时离开再进来重播. */
  readonly once?: boolean;
  /** manual 触发的开关: 变 true 时从头播. */
  readonly play?: boolean;
  /** 每次播到终点时回调 (循环时每圈一次). */
  readonly onComplete?: () => void;
}

export interface Playhead {
  /** 已过毫秒, 钳在 [0, durationMs]. */
  readonly elapsedMs: number;
  /** 0 到 1. */
  readonly progress: number;
  /** 是否已经起播过 (减弱动效时恒为 true). */
  readonly started: boolean;
  readonly running: boolean;
  /** 从头再播一次. */
  readonly replay: () => void;
  /** 挂到根元素上的事件, 只有 hover 与 click 触发时有内容. */
  readonly bind: { readonly onPointerEnter?: () => void; readonly onClick?: () => void; readonly onFocus?: () => void };
}

export function usePlayhead(ref: RefObject<Element | null>, options: PlayheadOptions): Playhead {
  const { durationMs, reduced, trigger = "view", loop = false, loopDelayMs = 0, threshold = VIEW_THRESHOLD, rootMargin, once = true, play, onComplete } = options;
  const total = Math.max(0, durationMs);
  const [elapsed, setElapsed] = useState(reduced ? total : 0);
  const [started, setStarted] = useState(reduced);
  const clock = useRef(reduced ? total : 0);
  const opts = useRef(options);
  opts.current = options;

  const frames = useFrameLoop((dtMs) => {
    const o = opts.current;
    const end = Math.max(0, o.durationMs);
    const before = clock.current;
    clock.current += dtMs;
    if (before < end && clock.current >= end) o.onComplete?.();
    if (clock.current < end) {
      setElapsed(clock.current);
      return true;
    }
    if (o.loop && clock.current >= end + (o.loopDelayMs ?? 0)) {
      clock.current = 0;
      setElapsed(0);
      return true;
    }
    setElapsed(end);
    return Boolean(o.loop);
  }, TEXT_CLOCK);

  const replay = useCallback(() => {
    setStarted(true);
    if (opts.current.reduced) {
      clock.current = Math.max(0, opts.current.durationMs);
      setElapsed(clock.current);
      opts.current.onComplete?.();
      return;
    }
    frames.stop();
    clock.current = 0;
    setElapsed(0);
    frames.wake();
  }, [frames]);

  useEffect(() => {
    if (!reduced) return;
    frames.stop();
    clock.current = total;
    setElapsed(total);
    setStarted(true);
  }, [reduced, total, frames]);

  useEffect(() => {
    if (reduced || trigger !== "mount") return;
    replay();
  }, [reduced, trigger, replay]);

  useEffect(() => {
    if (reduced || trigger !== "manual" || !play) return;
    replay();
  }, [reduced, trigger, play, replay]);

  useEffect(() => {
    const el = ref.current;
    if (reduced || trigger !== "view" || !el) return undefined;
    if (typeof IntersectionObserver === "undefined") {
      replay();
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          replay();
          if (once) io.disconnect();
        }
      },
      { threshold, rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, reduced, trigger, threshold, rootMargin, once, replay]);

  const idle = (): void => {
    if (!frames.running()) replay();
  };
  const bind = trigger === "hover" ? { onPointerEnter: idle, onFocus: idle } : trigger === "click" ? { onClick: replay } : {};
  const shown = Math.min(total, Math.max(0, elapsed));
  return { elapsedMs: shown, progress: total > 0 ? shown / total : 1, started, running: frames.running(), replay, bind };
}
