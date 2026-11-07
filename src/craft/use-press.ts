"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { stepSpring } from "./spring";
import { PRESS_SCALE, PRESS_Y_PX, RAPID_SCALE, RELEASE_HOLD_MS, RELEASE_SCALE, SETTLE_MS, SPRING_PRESS, VELOCITY_KEEP } from "./tokens";

const REDUCED = "(prefers-reduced-motion: reduce)";
const PHASE_IDLE = "idle";

interface Axis {
  current: number;
  velocity: number;
  target: number;
}

export interface PressMotion {
  readonly style: CSSProperties;
  readonly onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  readonly onPointerUp: (event: PointerEvent<HTMLElement>) => void;
  readonly onPointerCancel: (event: PointerEvent<HTMLElement>) => void;
  readonly onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  readonly onKeyUp: (event: KeyboardEvent<HTMLElement>) => void;
}

function prefersReduced(): boolean {
  return window.matchMedia?.(REDUCED).matches === true;
}

/** 按下到 0.97, 松开先到 1.012 再收回 1. 中途改目标时速度保留. */
export function usePress(enabled: boolean): PressMotion {
  const scale = useRef<Axis>({ current: 1, velocity: 0, target: 1 });
  const y = useRef<Axis>({ current: 0, velocity: 0, target: 0 });
  const phase = useRef<"idle" | "down" | "over" | "settle">(PHASE_IDLE);
  const since = useRef(0);
  const frame = useRef(0);
  const last = useRef(0);
  const [style, setStyle] = useState<CSSProperties>({});

  const write = (nextScale: number, nextY: number): void => {
    setStyle({ transform: `translate3d(0, ${nextY}px, 0) scale(${nextScale})` });
  };

  const stop = (): void => {
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = 0;
  };

  const tick = (now: number): void => {
    const dt = last.current ? now - last.current : 16;
    last.current = now;
    const scaled = stepSpring(scale.current.current, scale.current.velocity, scale.current.target, SPRING_PRESS, dt);
    const raised = stepSpring(y.current.current, y.current.velocity, y.current.target, SPRING_PRESS, dt);
    scale.current = { ...scale.current, current: scaled.current, velocity: scaled.velocity };
    y.current = { ...y.current, current: raised.current, velocity: raised.velocity };
    if (phase.current === "over" && (scaled.current >= RELEASE_SCALE - 0.004 || now - since.current >= RELEASE_HOLD_MS)) {
      phase.current = "settle";
      since.current = now;
      scale.current.target = 1;
      y.current.target = 0;
    } else if (phase.current === "settle" && now - since.current >= SETTLE_MS && scaled.resting && raised.resting) {
      phase.current = PHASE_IDLE;
    }
    write(scale.current.current, y.current.current);
    if (phase.current === PHASE_IDLE && scaled.resting && raised.resting) {
      stop();
      write(1, 0);
      return;
    }
    frame.current = requestAnimationFrame(tick);
  };

  const wake = (): void => {
    if (frame.current) return;
    last.current = 0;
    frame.current = requestAnimationFrame(tick);
  };

  useEffect(() => stop, []);

  const down = (): void => {
    if (!enabled) return;
    if (prefersReduced()) {
      write(PRESS_SCALE, PRESS_Y_PX);
      return;
    }
    if (scale.current.current > RAPID_SCALE) scale.current.velocity *= VELOCITY_KEEP;
    phase.current = "down";
    scale.current.target = PRESS_SCALE;
    y.current.target = PRESS_Y_PX;
    wake();
  };

  const up = (): void => {
    if (!enabled) return;
    if (prefersReduced()) {
      write(1, 0);
      return;
    }
    phase.current = "over";
    since.current = performance.now();
    scale.current.target = RELEASE_SCALE;
    y.current.target = 0;
    wake();
  };

  return {
    style,
    onPointerDown: (event) => {
      if (event.button !== 0) return;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      down();
    },
    onPointerUp: up,
    onPointerCancel: up,
    onKeyDown: (event) => {
      if (event.repeat) return;
      if (event.key === "Enter" || event.key === " ") down();
    },
    onKeyUp: (event) => {
      if (event.key === "Enter" || event.key === " ") up();
    },
  };
}
