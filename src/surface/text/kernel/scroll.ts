"use client";
// 行为规格参照 docs/research/catalog/textanimations.md 的 ScrollFloat, ScrollReveal, ScrollVelocity, CurvedLoop, TextLoop 条目, 实现为 HX 自有.

import { useEffect, useRef, type RefObject } from "react";
import { useFrameLoop } from "../../../motion/frame/use-frame-loop";
import { clamp01 } from "./curve";
import { MS_PER_S, TEXT_CLOCK } from "./tokens";

/**
 * 滚动进度与滚动速度. 纯函数算进度, 钩子把滚动事件接到 motion/frame 的帧循环上.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-text-kernel.md
 */

/**
 * 元素在视口里的进度. 元素顶边到达视口 start 处为 0, 底边到达视口 end 处为 1.
 *
 * @param top 元素顶边相对视口顶边的距离.
 * @param height 元素高度.
 * @param viewport 视口高度.
 * @param start 起点在视口里的比例, 默认 1 (视口底).
 * @param end 终点在视口里的比例, 默认 0 (视口顶).
 */
export function viewProgress(top: number, height: number, viewport: number, start = 1, end = 0): number {
  const from = viewport * start;
  const to = viewport * end - height;
  if (from === to) return top <= from ? 1 : 0;
  return clamp01((from - top) / (from - to));
}

export interface ScrollSample {
  /** 0 到 1. */
  readonly progress: number;
  /** 滚动速度, 像素/秒, 向下为正. */
  readonly velocity: number;
}

export interface ScrollFrameOptions {
  /** 滚动容器, 不给时跟随整页. */
  readonly container?: RefObject<HTMLElement | null>;
  readonly start?: number;
  readonly end?: number;
  /** false 时不挂监听. */
  readonly enabled?: boolean;
}

/**
 * 滚动驱动的帧回调. 滚动或尺寸变化时唤醒帧循环, 回调返回 true 则继续排帧 (平滑, 常驻滚动条带用).
 *
 * @param ref 被测元素.
 * @param frame 每帧回调, 参数为采样与帧长 (毫秒).
 * @param options 容器, 起止比例与开关.
 */
export function useScrollFrame(ref: RefObject<Element | null>, frame: (sample: ScrollSample, dtMs: number) => boolean, options: ScrollFrameOptions = {}): { readonly wake: () => void } {
  const { container, start = 1, end = 0, enabled = true } = options;
  const latest = useRef(frame);
  latest.current = frame;
  const last = useRef<number | null>(null);

  const read = (dtMs: number): ScrollSample => {
    const el = ref.current;
    const box = container?.current;
    const pos = box ? box.scrollTop : typeof window === "undefined" ? 0 : window.scrollY;
    const prev = last.current ?? pos;
    last.current = pos;
    const velocity = dtMs > 0 ? ((pos - prev) / dtMs) * MS_PER_S : 0;
    if (!el) return { progress: 0, velocity };
    const rect = el.getBoundingClientRect();
    const top = box ? rect.top - box.getBoundingClientRect().top : rect.top;
    const viewport = box ? box.clientHeight : window.innerHeight;
    return { progress: viewProgress(top, rect.height, viewport, start, end), velocity };
  };

  const loop = useFrameLoop((dtMs) => latest.current(read(dtMs), dtMs), TEXT_CLOCK);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return undefined;
    const target: HTMLElement | Window = container?.current ?? window;
    const wake = (): void => loop.wake();
    target.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", wake);
    wake();
    return () => {
      target.removeEventListener("scroll", wake);
      window.removeEventListener("resize", wake);
    };
  }, [enabled, container, loop]);

  return { wake: loop.wake };
}
