"use client";

import { useEffect, useRef, useState } from "react";
import { stepSpring, type SpringSpec } from "../../craft/spring";
import { createFrameLoop, type FrameLoop } from "../frame/loop";
import type { SpringIntegrator } from "../spring/step";

/**
 * 一条自带帧循环的弹簧轴: to 换目标时保留位置与速度, 可带起步延迟与落定回调.
 * 每帧把值交给 onFrame. useSpringValue 是它的 React 外壳, 把值写进状态.
 *
 * .agents/notes/implemented/feature/2026-11-08-motion-spring-frame.md
 */
export interface DriveOptions {
  /** 起步速度. 不给时沿用当前速度, 中途换目标不清零. */
  readonly velocity?: number;
  readonly delayMs?: number;
  readonly onRest?: () => void;
}

const PLACEHOLDER: SpringSpec = { stiffness: 1, damping: 1, mass: 1 };

export class SpringDriver {
  value: number;
  velocity = 0;
  private target: number;
  private spec: SpringSpec = PLACEHOLDER;
  private startAt = 0;
  private rest: (() => void) | undefined;
  private readonly onFrame: (value: number) => void;
  private readonly integrate: SpringIntegrator;
  private readonly loop: FrameLoop;

  /**
   * @param initial 初值.
   * @param onFrame 每帧收到当前值.
   * @param integrate 积分器, 默认 craft 的半隐式 stepSpring.
   */
  constructor(initial: number, onFrame: (value: number) => void, integrate: SpringIntegrator = stepSpring) {
    this.value = initial;
    this.target = initial;
    this.onFrame = onFrame;
    this.integrate = integrate;
    this.loop = createFrameLoop((dt, now) => this.tick(dt, now));
  }

  get moving(): boolean {
    return this.loop.running();
  }

  get goal(): number {
    return this.target;
  }

  to(target: number, spec: SpringSpec, options: DriveOptions = {}): void {
    this.target = target;
    this.spec = spec;
    if (options.velocity !== undefined) this.velocity = options.velocity;
    this.rest = options.onRest;
    this.startAt = performance.now() + (options.delayMs ?? 0);
    this.loop.wake();
  }

  /** 直接落到某值: 减弱动效, 拖拽跟手与首帧摆位用. */
  jump(value: number): void {
    this.stop();
    this.value = value;
    this.target = value;
    this.velocity = 0;
    this.onFrame(value);
  }

  stop(): void {
    this.loop.stop();
  }

  private tick(dt: number, now: number): boolean {
    if (now < this.startAt) return true;
    const step = this.integrate(this.value, this.velocity, this.target, this.spec, dt);
    this.value = step.current;
    this.velocity = step.velocity;
    this.onFrame(step.current);
    if (!step.resting) return true;
    this.loop.stop();
    this.rest?.();
    return false;
  }
}

/**
 * 组件里用的弹簧轴: 每帧把值写进状态, 卸载时停表.
 *
 * @param initial 初值.
 * @param integrate 积分器, 默认 craft 的半隐式 stepSpring.
 */
export function useSpringValue(initial: number, integrate?: SpringIntegrator): readonly [number, SpringDriver] {
  const [value, setValue] = useState(initial);
  const driver = useRef<SpringDriver | null>(null);
  if (!driver.current) driver.current = new SpringDriver(initial, setValue, integrate);
  useEffect(() => () => driver.current?.stop(), []);
  return [value, driver.current] as const;
}
