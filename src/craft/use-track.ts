"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { stepSpring, type SpringSpec } from "./spring";

const REDUCED = "(prefers-reduced-motion: reduce)";

export interface Track {
  readonly value: number;
  readonly setTarget: (next: number, velocity?: number) => void;
  readonly setCurrent: (next: number, velocity: number) => void;
}

function reduced(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.(REDUCED).matches === true;
}

/** 一条弹簧. 改目标不清速度, 也可以把拖拽速度写进去. */
export function useTrack(initial: number, spring: SpringSpec): Track {
  const state = useRef({ current: initial, velocity: 0, target: initial });
  const frame = useRef(0);
  const last = useRef(0);
  const [value, setValue] = useState(initial);

  const stop = (): void => {
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = 0;
  };

  const wake = (): void => {
    if (frame.current || reduced()) return;
    last.current = 0;
    const loop = (now: number): void => {
      const dt = last.current ? now - last.current : 16;
      last.current = now;
      const step = stepSpring(state.current.current, state.current.velocity, state.current.target, spring, dt);
      state.current.current = step.current;
      state.current.velocity = step.velocity;
      setValue(step.current);
      if (step.resting) {
        frame.current = 0;
        return;
      }
      frame.current = requestAnimationFrame(loop);
    };
    frame.current = requestAnimationFrame(loop);
  };

  useEffect(() => stop, []);

  const setTarget = useCallback((next: number, velocity?: number) => {
    if (reduced()) {
      state.current = { current: next, velocity: 0, target: next };
      setValue(next);
      return;
    }
    if (velocity !== undefined) state.current.velocity = velocity;
    state.current.target = next;
    wake();
  }, []);

  const setCurrent = useCallback((next: number, velocity: number) => {
    stop();
    state.current.current = next;
    state.current.velocity = velocity;
    state.current.target = next;
    setValue(next);
  }, []);

  return { value, setTarget, setCurrent };
}
