"use client";

import { useEffect, useRef } from "react";
import { createFrameLoop, type FrameClockOptions, type FrameLoop, type FrameTick } from "./loop";

/**
 * createFrameLoop 的 React 外壳: 回调取最新一次渲染的, 卸载时一定停.
 * 给了 active 就按它自动起停; pauseWhenHidden 时页面隐藏停帧, 回到前台自动接上.
 *
 * .agents/notes/implemented/feature/2026-11-08-motion-spring-frame.md
 */
export interface FrameLoopOptions extends FrameClockOptions {
  /** 给了就按它自动起停: true 时挂上即跑, false 时不跑也唤不醒. 不给时只由 start / wake 驱动. */
  readonly active?: boolean;
  /** 页面隐藏时停帧, 回到前台再唤醒. 自动接上需要同时给 active. */
  readonly pauseWhenHidden?: boolean;
}

function hidden(): boolean {
  return typeof document !== "undefined" && document.hidden;
}

export function useFrameLoop(tick?: FrameTick, options: FrameLoopOptions = {}): FrameLoop {
  const latest = useRef(tick);
  if (tick) latest.current = tick;
  const opts = useRef(options);
  opts.current = options;
  const api = useRef<FrameLoop | null>(null);

  if (!api.current) {
    const core = createFrameLoop((dt, now) => {
      const o = opts.current;
      if (o.active === false) return false;
      const keep = latest.current?.(dt, now) ?? false;
      return keep && !(o.pauseWhenHidden && hidden());
    }, options);
    const wake = (): void => {
      const o = opts.current;
      if (o.active === false || (o.pauseWhenHidden && hidden())) return;
      core.wake();
    };
    api.current = {
      start: (next) => {
        latest.current = next;
        wake();
      },
      wake,
      stop: core.stop,
      running: core.running,
    };
  }

  const { active, pauseWhenHidden } = options;
  useEffect(() => {
    const loop = api.current;
    if (!active || !loop) return undefined;
    loop.wake();
    if (!pauseWhenHidden) return () => loop.stop();
    document.addEventListener("visibilitychange", loop.wake);
    return () => {
      document.removeEventListener("visibilitychange", loop.wake);
      loop.stop();
    };
  }, [active, pauseWhenHidden]);

  useEffect(() => () => api.current?.stop(), []);
  return api.current;
}
