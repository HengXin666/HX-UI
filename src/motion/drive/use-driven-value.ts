"use client";

import { useEffect, useRef, useState } from "react";
import { stepSpring, type SpringSpec } from "../../craft/spring";
import { createFrameLoop, type FrameLoop } from "../frame/loop";
import type { SpringIntegrator } from "../spring/step";

/**
 * 一个可中断的动值: 弹簧或定时补间, 都从当前值和当前速度出发. 值写进 React 状态.
 * reduced 为真时所有动画直接落到终值; 落定 (弹簧静止或补间走完) 时回调 onSettle.
 *
 * .agents/notes/implemented/feature/2026-11-08-motion-spring-frame.md
 */
export interface DrivenValue {
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

const IDLE = "idle";
const SPRING = "spring";
const TWEEN = "tween";
const MS_PER_S = 1000;
const linear = (t: number): number => t;

/**
 * @param initial 初值.
 * @param reduced 是否减弱动效.
 * @param onSettle 动画落定时回调.
 * @param integrate 弹簧积分器, 默认 craft 的半隐式 stepSpring.
 */
export function useDrivenValue(initial: number, reduced: boolean, onSettle?: (value: number) => void, integrate: SpringIntegrator = stepSpring): DrivenValue {
  const [value, setValue] = useState(initial);
  const current = useRef(initial);
  const speed = useRef(0);
  const drive = useRef<Drive>({ kind: IDLE, from: initial, target: initial, ms: 0, elapsed: 0, curve: linear });
  const paused = useRef(false);
  const settle = useRef(onSettle);
  settle.current = onSettle;
  const integrateRef = useRef(integrate);
  integrateRef.current = integrate;
  const loop = useRef<FrameLoop | null>(null);

  const write = (next: number): void => {
    current.current = next;
    setValue(next);
  };

  if (!loop.current) {
    const finish = (): void => {
      drive.current.kind = IDLE;
      speed.current = 0;
      write(drive.current.target);
      loop.current?.stop();
      settle.current?.(drive.current.target);
    };
    loop.current = createFrameLoop((dt) => {
      const d = drive.current;
      if (d.kind === SPRING && d.spec) {
        const step = integrateRef.current(current.current, speed.current, d.target, d.spec, dt);
        speed.current = step.velocity;
        write(step.current);
        if (!step.resting) return true;
        finish();
        return false;
      }
      if (d.kind !== TWEEN) return false;
      if (!paused.current) d.elapsed += dt;
      const t = Math.min(1, d.elapsed / d.ms);
      const prev = current.current;
      write(d.from + (d.target - d.from) * d.curve(t));
      speed.current = dt > 0 ? ((current.current - prev) / dt) * MS_PER_S : 0;
      if (t < 1) return true;
      finish();
      return false;
    });
  }

  useEffect(() => () => loop.current?.stop(), []);

  const jump = (next: number): void => {
    drive.current = { ...drive.current, kind: IDLE, target: next };
    speed.current = 0;
    loop.current?.stop();
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
      drive.current = { kind: SPRING, spec, from: current.current, target, ms: 0, elapsed: 0, curve: linear };
      loop.current?.wake();
    },
    tween: (target, ms, curve = linear) => {
      if (reduced || ms <= 0) {
        jump(target);
        settle.current?.(target);
        return;
      }
      drive.current = { kind: TWEEN, from: current.current, target, ms, elapsed: 0, curve };
      loop.current?.wake();
    },
  };
}
