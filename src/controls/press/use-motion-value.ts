"use client";

import { useEffect, useRef, useState } from "react";
import { stepSpring, type SpringSpec } from "../../craft/spring";
import { MS_PER_SECOND } from "./tokens";

const FIRST_FRAME_MS = 16;
const IDLE = "idle";

/** 一个可中断的动值: 弹簧或定时补间, 都从当前值和当前速度出发. */
export interface MotionValue {
  readonly value: number;
  /** 弹簧走向 target. 可带初速度 (单位/秒). 中途再调用不清速度. */
  readonly spring: (target: number, spec: SpringSpec, velocity?: number) => void;
  /** 从当前值补间到 target, 曲线收 0..1. 时长 0 或减弱动效时直接落定. */
  readonly tween: (target: number, ms: number, curve?: (t: number) => number) => void;
  /** 不动画, 直接写值并停下. */
  readonly jump: (value: number) => void;
  /** 暂停或恢复定时补间 (页面隐藏, 悬停暂停用). */
  readonly pause: (paused: boolean) => void;
  readonly read: () => number;
  readonly velocity: () => number;
}

interface Drive {
  kind: "spring" | "tween" | "idle";
  spec?: SpringSpec;
  from: number;
  target: number;
  ms: number;
  elapsed: number;
  curve: (t: number) => number;
}

const linear = (t: number): number => t;

/**
 * 按压族唯一的 rAF 驱动. 弹簧一步交给 craft/spring 的 stepSpring, 本身只管帧和中断.
 * reduced 为真时所有动画直接落到终值.
 *
 * @param initial 初值.
 * @param reduced 是否减弱动效.
 * @param onSettle 动画落定 (弹簧静止或补间走完) 时回调.
 */
export function useMotionValue(initial: number, reduced: boolean, onSettle?: (value: number) => void): MotionValue {
  const [value, setValue] = useState(initial);
  const current = useRef(initial);
  const speed = useRef(0);
  const drive = useRef<Drive>({ kind: IDLE, from: initial, target: initial, ms: 0, elapsed: 0, curve: linear });
  const frame = useRef(0);
  const last = useRef(0);
  const paused = useRef(false);
  const settle = useRef(onSettle);
  settle.current = onSettle;

  const stop = (): void => {
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = 0;
  };

  const write = (next: number): void => {
    current.current = next;
    setValue(next);
  };

  const finish = (): void => {
    drive.current.kind = IDLE;
    speed.current = 0;
    write(drive.current.target);
    stop();
    settle.current?.(drive.current.target);
  };

  const tick = (now: number): void => {
    const dt = last.current ? now - last.current : FIRST_FRAME_MS;
    last.current = now;
    const d = drive.current;
    if (d.kind === "spring" && d.spec) {
      const step = stepSpring(current.current, speed.current, d.target, d.spec, dt);
      speed.current = step.velocity;
      write(step.current);
      if (step.resting) {
        finish();
        return;
      }
    } else if (d.kind === "tween") {
      if (!paused.current) d.elapsed += dt;
      const t = Math.min(1, d.elapsed / d.ms);
      const prev = current.current;
      write(d.from + (d.target - d.from) * d.curve(t));
      speed.current = dt > 0 ? ((current.current - prev) / dt) * MS_PER_SECOND : 0;
      if (t >= 1) {
        finish();
        return;
      }
    } else {
      stop();
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

  const jump = (next: number): void => {
    drive.current = { ...drive.current, kind: IDLE, target: next };
    speed.current = 0;
    stop();
    write(next);
  };

  return {
    value,
    read: () => current.current,
    velocity: () => speed.current,
    jump,
    pause: (next) => {
      paused.current = next;
    },
    spring: (target, spec, velocity) => {
      if (reduced) {
        jump(target);
        settle.current?.(target);
        return;
      }
      if (velocity !== undefined) speed.current = velocity;
      drive.current = { kind: "spring", spec, from: current.current, target, ms: 0, elapsed: 0, curve: linear };
      wake();
    },
    tween: (target, ms, curve = linear) => {
      if (reduced || ms <= 0) {
        jump(target);
        settle.current?.(target);
        return;
      }
      drive.current = { kind: "tween", from: current.current, target, ms, elapsed: 0, curve };
      wake();
    },
  };
}
