"use client";

import { useMotionValue, useReducedMotion, type MotionValue } from "motion/react";
import { useEffect, useRef, type RefObject } from "react";
import { CLOCK_DEFAULT_MS, CLOCK_EVENT, CLOCK_VIEW_AMOUNT } from "../../constants/motion-recipe";
import { prefersReducedMotion } from "../../primitives/motion";
import { useFrameLoop } from "../frame/use-frame-loop";
import { CLOCK_DRIVER, clampUnit, elapsedProgress, loopProgress, scrollProgress, type ClockDriver } from "./clock";

export interface ClockOptions {
  /** 默认 view: 进视口播一次. */
  readonly driver?: ClockDriver;
  /** view / loop 的时长 (毫秒). 配方驱动时传 recipeMs(recipe). */
  readonly durationMs?: number;
  /** controlled 驱动的外部进度 0..1. */
  readonly progress?: number;
  /** view 驱动的露出比例. */
  readonly amount?: number;
}

/**
 * 一个时钟, 四种驱动: view (进视口一次), scroll (滚动进度), loop (帧循环, 离开视口与后台标签页暂停), controlled (外部进度).
 * 返回 0..1 的 MotionValue, 不触发重渲染; 减弱动效时恒为 1, 组件读到终态.
 *
 * .agents/notes/implemented/architecture/2026-11-18-omni-motion-recipe-clock.md
 */
export function useClock<T extends Element>(ref: RefObject<T | null>, options: ClockOptions = {}): MotionValue<number> {
  const { driver = CLOCK_DRIVER.view, durationMs = CLOCK_DEFAULT_MS, progress, amount = CLOCK_VIEW_AMOUNT } = options;
  const value = useMotionValue(driver === CLOCK_DRIVER.controlled ? clampUnit(progress ?? 0) : 0);
  const reducedHook = useReducedMotion();
  const elapsed = useRef(0);
  const frames = useFrameLoop();
  const reduced = (): boolean => reducedHook === true || prefersReducedMotion();

  useEffect(() => {
    if (driver !== CLOCK_DRIVER.controlled) return;
    value.set(reduced() ? 1 : clampUnit(progress ?? 0));
  });

  useEffect(() => {
    if (driver === CLOCK_DRIVER.controlled) return undefined;
    const el = ref.current;
    if (reduced() || !el) {
      value.set(1);
      return undefined;
    }
    if (driver === CLOCK_DRIVER.scroll) {
      const read = (): boolean => {
        const box = el.getBoundingClientRect();
        value.set(scrollProgress(box.top, box.height, window.innerHeight));
        return false;
      };
      const wake = (): void => frames.start(read);
      read();
      window.addEventListener(CLOCK_EVENT.scroll, wake, { passive: true });
      window.addEventListener(CLOCK_EVENT.resize, wake);
      return () => {
        window.removeEventListener(CLOCK_EVENT.scroll, wake);
        window.removeEventListener(CLOCK_EVENT.resize, wake);
        frames.stop();
      };
    }
    if (globalThis.IntersectionObserver === undefined) {
      value.set(1);
      return undefined;
    }
    const looping = driver === CLOCK_DRIVER.loop;
    const tick = (dt: number): boolean => {
      elapsed.current += dt;
      if (looping) {
        value.set(loopProgress(elapsed.current, durationMs));
        return globalThis.document?.hidden !== true;
      }
      const next = elapsedProgress(elapsed.current, durationMs);
      value.set(next);
      return next < 1;
    };
    elapsed.current = 0;
    let visible = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const seen = entries.some((entry) => entry.isIntersecting);
        visible = seen;
        if (seen && !looping) observer.disconnect();
        if (seen) frames.start(tick);
        else if (looping) frames.stop();
      },
      { threshold: amount },
    );
    observer.observe(el);
    const resume = (): void => {
      if (looping && visible && !document.hidden) frames.start(tick);
    };
    document.addEventListener(CLOCK_EVENT.visibility, resume);
    return () => {
      observer.disconnect();
      document.removeEventListener(CLOCK_EVENT.visibility, resume);
      frames.stop();
    };
  }, [driver, durationMs, amount, reducedHook]);

  return value;
}
