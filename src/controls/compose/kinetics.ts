"use client";

import { useCallback, useEffect, useRef } from "react";
import { stepSpring, type SpringSpec } from "../../craft/spring";
import { DPR_CAP, DT_CAP_S, FIRST_FRAME_S, MS_PER_S } from "./tokens";

/** 时长加回弹形式换算时, 包络衰减到的残差 (与常见 UI 弹簧库同一判据). */
const ENVELOPE_REST = 0.001;
const MIN_DAMPING_RATIO = 0.05;
const BISECT_STEPS = 60;
/** 临界阻尼包络 exp(-x)(1+x) 的求根上界. */
const CRITICAL_UPPER = 40;
const TWO = 2;

/**
 * 把 "时长 + 回弹" 形式的弹簧换成引擎用的 stiffness / damping / mass.
 * 阻尼比 = 1 - bounce; 自然频率取包络在 durationMs 内衰减到 0.001 的那一个, 所以同样的时长内落定, 过冲也相同.
 *
 * .agents/notes/implemented/feature/2026-11-08-controls-compose.md
 */
export function springFromDuration(durationMs: number, bounce: number, mass = 1): SpringSpec {
  // ENGINE-GAP: src/craft/spring.ts 只收 stiffness / damping / mass, 没有时长加回弹的换算, 先在本族局部实现.
  const seconds = Math.max(durationMs, 1) / MS_PER_S;
  const ratio = Math.min(1, Math.max(MIN_DAMPING_RATIO, 1 - bounce));
  let omega: number;
  if (ratio < 1) {
    const root = Math.sqrt(1 - ratio * ratio);
    omega = -Math.log((ENVELOPE_REST * root) / ratio) / (ratio * seconds);
  } else {
    let lo = 0;
    let hi = CRITICAL_UPPER;
    for (let i = 0; i < BISECT_STEPS; i += 1) {
      const mid = (lo + hi) / TWO;
      if (Math.exp(-mid) * (1 + mid) > ENVELOPE_REST) lo = mid;
      else hi = mid;
    }
    omega = (lo + hi) / TWO / seconds;
  }
  const stiffness = mass * omega * omega;
  return { stiffness, damping: TWO * ratio * Math.sqrt(mass * stiffness), mass };
}

/** 弹簧从静止走到 1 时的理论过冲比例. 临界与过阻尼为 0. */
export function springOvershoot(spec: SpringSpec): number {
  const ratio = spec.damping / (TWO * Math.sqrt(spec.stiffness * spec.mass));
  if (ratio >= 1) return 0;
  return Math.exp((-Math.PI * ratio) / Math.sqrt(1 - ratio * ratio));
}

/** 帧间隔 (秒), 钳在 DT_CAP_S 以内; 第一帧按 60fps 算. */
export function frameDt(now: number, last: number): number {
  return last ? Math.min(DT_CAP_S, (now - last) / MS_PER_S) : FIRST_FRAME_S;
}

/** 一阶追随: tau 秒内走完约 63%. 目标改了下一帧就生效, 不会跳变. */
export function approach(current: number, target: number, dt: number, tau: number): number {
  if (tau <= 0) return target;
  return current + (target - current) * (1 - Math.exp(-dt / tau));
}

/** 指数衰减. */
export function decay(value: number, dt: number, tau: number): number {
  return tau <= 0 ? 0 : value * Math.exp(-dt / tau);
}

/** 按像素比 (上限 2) 设定画布尺寸, 返回已缩放到 CSS 像素的上下文. */
export function fitCanvas(canvas: HTMLCanvasElement, width: number, height: number): CanvasRenderingContext2D | null {
  const dpr = Math.min(DPR_CAP, globalThis.devicePixelRatio || 1);
  const w = Math.max(1, Math.round(width * dpr));
  const h = Math.max(1, Math.round(height * dpr));
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const ctx = canvas.getContext?.("2d") ?? null;
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

/** 画布取色: 读元素计算后的 color, 颜色由语义 token 类给出. */
export function inkOf(el: Element): string {
  return getComputedStyle(el).color;
}

export interface SpringChannels<K extends string> {
  /** 改目标, 速度保留; 可选覆盖速度 (甩出时用). */
  readonly to: (key: K, target: number, velocity?: number) => void;
  /** 直接落到某值, 速度清零. */
  readonly jump: (key: K, value: number) => void;
  readonly get: (key: K) => number;
  readonly velocity: (key: K) => number;
}

interface ChannelState {
  current: number;
  velocity: number;
  target: number;
  resting: boolean;
}

/**
 * 多路弹簧共用一个 rAF. 每路用 craft 的 stepSpring 积分, 改目标不清速度, 所以中途反向不跳变.
 * render 每帧收到全部当前值, 直接写 DOM, 不触发 React 重渲.
 */
export function useSpringChannels<K extends string>(
  initial: Record<K, number>,
  specs: Record<K, SpringSpec>,
  render: (values: Record<K, number>) => void,
  reduced: boolean,
): SpringChannels<K> {
  // ENGINE-GAP: 引擎有单步积分 stepSpring 和专用的 usePress, 没有通用的 "多路弹簧值 + rAF 驱动" hook.
  const state = useRef<Record<string, ChannelState> | null>(null);
  if (!state.current) {
    state.current = {};
    for (const key of Object.keys(initial)) {
      const value = initial[key as K];
      state.current[key] = { current: value, velocity: 0, target: value, resting: true };
    }
  }
  const renderRef = useRef(render);
  renderRef.current = render;
  const specsRef = useRef(specs);
  specsRef.current = specs;
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const frame = useRef(0);
  const last = useRef(0);

  const emit = useCallback((): void => {
    const values = {} as Record<K, number>;
    for (const [key, channel] of Object.entries(state.current ?? {})) values[key as K] = channel.current;
    renderRef.current(values);
  }, []);

  const tick = useCallback(
    (now: number): void => {
      const dtMs = last.current ? now - last.current : FIRST_FRAME_S * MS_PER_S;
      last.current = now;
      let moving = false;
      for (const [key, channel] of Object.entries(state.current ?? {})) {
        if (channel.resting) continue;
        const step = stepSpring(channel.current, channel.velocity, channel.target, specsRef.current[key as K], dtMs);
        channel.current = step.current;
        channel.velocity = step.velocity;
        channel.resting = step.resting;
        moving = moving || !step.resting;
      }
      emit();
      frame.current = moving ? requestAnimationFrame(tick) : 0;
    },
    [emit],
  );

  const wake = useCallback((): void => {
    if (frame.current) return;
    last.current = 0;
    frame.current = requestAnimationFrame(tick);
  }, [tick]);

  useEffect(
    () => () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = 0;
    },
    [],
  );

  return useRef<SpringChannels<K>>({
    to: (key, target, velocity) => {
      const channel = state.current?.[key];
      if (!channel) return;
      channel.target = target;
      if (velocity !== undefined) channel.velocity = velocity;
      if (reducedRef.current) {
        channel.current = target;
        channel.velocity = 0;
        channel.resting = true;
        emit();
        return;
      }
      channel.resting = false;
      wake();
    },
    jump: (key, value) => {
      const channel = state.current?.[key];
      if (!channel) return;
      Object.assign(channel, { current: value, target: value, velocity: 0, resting: true });
      emit();
    },
    get: (key) => state.current?.[key]?.current ?? 0,
    velocity: (key) => state.current?.[key]?.velocity ?? 0,
  }).current;
}

/**
 * 自管画布循环: active 时跑, 回调返回 false 时停, 返回的 kick 重新点火. dt 已钳好.
 * 页面隐藏时暂停, 回来从新的一帧接上.
 */
export function useFrameLoop(active: boolean, onFrame: (dt: number, now: number) => boolean): () => void {
  const frameRef = useRef(onFrame);
  frameRef.current = onFrame;
  const raf = useRef(0);
  const last = useRef(0);
  const activeRef = useRef(active);
  activeRef.current = active;

  const run = useCallback((now: number): void => {
    const dt = frameDt(now, last.current);
    last.current = now;
    raf.current = activeRef.current && frameRef.current(dt, now) && !document.hidden ? requestAnimationFrame(run) : 0;
  }, []);

  const kick = useCallback((): void => {
    if (!activeRef.current || raf.current || document.hidden) return;
    last.current = 0;
    raf.current = requestAnimationFrame(run);
  }, [run]);

  useEffect(() => {
    if (!active) return undefined;
    kick();
    document.addEventListener("visibilitychange", kick);
    return () => {
      document.removeEventListener("visibilitychange", kick);
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, [active, kick]);

  return kick;
}
