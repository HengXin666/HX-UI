"use client";

import { useRef } from "react";
import type { SpringSpec } from "../../craft/spring";
import { useFrameLoop } from "../frame/use-frame-loop";
import type { SpringIntegrator } from "../spring/step";
import { SpringChannels } from "./channels";

/**
 * 多路弹簧值共用一个 rAF: SpringChannels 加帧循环. 每帧把全部当前值交给 render, 直接写 DOM, 不触发重渲.
 * 弹簧表每帧取最新一次渲染的, 改目标不清速度; reduced 时 to 直接落到目标.
 *
 * .agents/notes/implemented/feature/2026-11-08-motion-spring-frame.md
 */
export interface SpringChannelsHandle<K extends string> {
  /** 改目标, 速度保留; 可选覆盖速度 (甩出时用). */
  readonly to: (key: K, target: number, velocity?: number) => void;
  /** 直接落到某值, 速度清零. */
  readonly jump: (key: K, value: number) => void;
  readonly get: (key: K) => number;
  readonly velocity: (key: K) => number;
}

/**
 * @param initial 各路初值, 也决定有哪些路.
 * @param specs 各路弹簧.
 * @param render 每帧收到全部当前值.
 * @param reduced 减弱动效时不动画.
 * @param integrate 积分器, 默认 craft 的半隐式 stepSpring.
 */
export function useSpringChannels<K extends string>(
  initial: Record<K, number>,
  specs: Record<K, SpringSpec>,
  render: (values: Record<K, number>) => void,
  reduced: boolean,
  integrate?: SpringIntegrator,
): SpringChannelsHandle<K> {
  const keys = useRef(Object.keys(initial) as K[]);
  const channels = useRef<SpringChannels | null>(null);
  if (!channels.current) {
    channels.current = new SpringChannels(integrate);
    for (const key of keys.current) channels.current.jump(key, initial[key], specs[key]);
  }
  const renderRef = useRef(render);
  renderRef.current = render;
  const specsRef = useRef(specs);
  specsRef.current = specs;
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  const emit = (): void => {
    const ch = channels.current;
    const values = {} as Record<K, number>;
    for (const key of keys.current) values[key] = ch?.value(key) ?? 0;
    renderRef.current(values);
  };

  const loop = useFrameLoop((dtMs, now) => {
    const ch = channels.current;
    if (!ch) return false;
    for (const key of keys.current) ch.retune(key, specsRef.current[key]);
    ch.step(dtMs, now);
    emit();
    return ch.active();
  });

  const handle = useRef<SpringChannelsHandle<K> | null>(null);
  if (!handle.current) {
    handle.current = {
      to: (key, target, velocity) => {
        const ch = channels.current;
        if (!ch) return;
        if (reducedRef.current) {
          ch.jump(key, target, specsRef.current[key]);
          emit();
          return;
        }
        ch.aim(key, target, specsRef.current[key], { velocity });
        loop.wake();
      },
      jump: (key, value) => {
        channels.current?.jump(key, value, specsRef.current[key]);
        emit();
      },
      get: (key) => channels.current?.value(key) ?? 0,
      velocity: (key) => channels.current?.velocity(key) ?? 0,
    };
  }
  return handle.current;
}
