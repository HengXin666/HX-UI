"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { resting, stepSpring, type Channel } from "./spring";
import { PX, REDUCE_QUERY, SCALE, SPRING } from "./tokens";

/** 读系统的减弱动效. 为真时弹簧不积分, 直接写终值. */
export function useReducedMotion(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const query = window.matchMedia(REDUCE_QUERY);
    const sync = (): void => setOn(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return on;
}

/**
 * 跟随目标的一维弹簧. target 为 null 时不画.
 * 第一次拿到数字时贴上去, 不从 0 飞入. 之后改目标保留速度.
 */
export function useSpringNumber(target: number | null, spring: keyof typeof SPRING, reduced: boolean): number {
  const state = useRef<Channel & { seen: boolean }>({ x: target ?? 0, v: 0, seen: false });
  const [value, setValue] = useState(target ?? 0);
  useEffect(() => {
    if (target === null) return undefined;
    if (!state.current.seen || reduced) {
      state.current = { x: target, v: 0, seen: true };
      setValue(target);
      return undefined;
    }
    let frame = 0;
    let last = performance.now();
    const tick = (now: number): void => {
      const dt = now - last;
      last = now;
      stepSpring(state.current, target, SPRING[spring], dt);
      setValue(state.current.x);
      if (!resting(state.current, target)) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, spring, reduced]);
  return value;
}

type Phase = "idle" | "down" | "over" | "back";

/** 按下 0.97 / 下移 1px, 松开先到 1.012 再收回 1. 中途改目标, 速度不清零. */
export function useButtonPress(reduced: boolean): {
  ref: RefObject<HTMLSpanElement | null>;
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
} {
  const ref = useRef<HTMLSpanElement>(null);
  const phase = useRef<Phase>("idle");
  const scale = useRef<Channel>({ x: SCALE.rest, v: 0 });
  const y = useRef<Channel>({ x: 0, v: 0 });
  const frame = useRef(0);

  const paint = (): void => {
    const node = ref.current;
    if (!node) return;
    if (reduced) {
      node.style.transform = "";
      return;
    }
    const quiet = phase.current === "idle"
      && Math.abs(scale.current.x - SCALE.rest) < PX.rest
      && Math.abs(y.current.x) < PX.vel;
    node.style.transform = quiet
      ? ""
      : `translate3d(0, ${y.current.x.toFixed(2)}px, 0) scale(${scale.current.x.toFixed(4)})`;
  };

  const kick = (): void => {
    if (frame.current || reduced) {
      paint();
      return;
    }
    let last = performance.now();
    const tick = (now: number): void => {
      const dt = now - last;
      last = now;
      const scaleTarget = phase.current === "down"
        ? SCALE.press
        : phase.current === "over" ? SCALE.release : SCALE.rest;
      const yTarget = phase.current === "down" ? PX.pressY : 0;
      stepSpring(scale.current, scaleTarget, SPRING.press, dt);
      stepSpring(y.current, yTarget, SPRING.press, dt);
      if (phase.current === "over" && Math.abs(scale.current.x - SCALE.release) < PX.near) {
        phase.current = "back";
      }
      if (phase.current === "back" && resting(scale.current, SCALE.rest) && resting(y.current, 0)) {
        phase.current = "idle";
      }
      paint();
      const moving = phase.current === "down" || phase.current === "over" || phase.current === "back";
      if (moving) frame.current = requestAnimationFrame(tick);
      else frame.current = 0;
    };
    frame.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>): void => {
    if (event.currentTarget.disabled || reduced) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    if (scale.current.x > SCALE.retrigger) scale.current.v *= SCALE.velDamp;
    phase.current = "down";
    kick();
  };

  const release = (): void => {
    if (phase.current !== "down") return;
    phase.current = reduced ? "idle" : "over";
    kick();
  };

  return { ref, onPointerDown, onPointerUp: release, onPointerCancel: release };
}
