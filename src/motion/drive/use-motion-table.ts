"use client";

import { useRef } from "react";
import type { SpringSpec } from "../../craft/spring";
import { useFrameLoop } from "../frame/use-frame-loop";
import { SpringChannels } from "./channels";
import { approach, subStepSpring } from "./glide";

/** 趋近通道收敛到这个差值以内就落定. */
export const MOTION_SNAP = 0.001;

/**
 * 动值表 (原导航族 useNavMotion, 画廊 / 叠放 / 玻璃 / 卡片族共用): 弹簧通道 (保留速度, 改目标即中断) 和指数趋近通道 (规格里的 1 - exp(-dt / tau)) 共用一个 rAF.
 * 每帧把控制权交给 render 直接写 DOM, 不触发重渲. 通道按名字随用随建, 项数变化不用重挂.
 *
 * .agents/notes/implemented/feature/2026-11-09-controls-nav.md
 */
export interface MotionTable {
  /** 弹簧走向 target; 可覆盖起步速度, 可带起步延迟 (ms). */
  readonly spring: (id: string, target: number, spec: SpringSpec, velocity?: number, delayMs?: number) => void;
  /** 以时间常数 tauMs 指数趋近 target. 通道第一次出现时从 from 出发 (不给则直接在 target). */
  readonly ease: (id: string, target: number, tauMs: number, from?: number) => void;
  /** 直接写值并落定. */
  readonly jump: (id: string, value: number) => void;
  readonly get: (id: string, fallback?: number) => number;
  readonly velocity: (id: string) => number;
  /** 唤醒循环 (extra 回调里有活时用). */
  readonly wake: () => void;
  /** 立即调一次 render. */
  readonly paint: () => void;
}

interface Glide {
  x: number;
  target: number;
  tau: number;
}

const PLACEHOLDER: SpringSpec = { stiffness: 1, damping: 1, mass: 1 };

/**
 * @param render 每帧 (以及 jump 之后) 调用, 读通道值写 DOM.
 * @param reduced 减弱动效: spring 与 ease 都直接落到终值.
 * @param extra 每帧额外推进 (粒子, 入场进度); 返回 true 表示还要下一帧.
 */
export function useMotionTable(render: (motion: MotionTable) => void, reduced: boolean, extra?: (dtMs: number, now: number) => boolean): MotionTable {
  const springs = useRef<SpringChannels | null>(null);
  if (!springs.current) springs.current = new SpringChannels(subStepSpring);
  const glides = useRef(new Map<string, Glide>());
  const renderRef = useRef(render);
  renderRef.current = render;
  const extraRef = useRef(extra);
  extraRef.current = extra;
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const handle = useRef<MotionTable | null>(null);

  const loop = useFrameLoop((dtMs, now) => {
    const ch = springs.current;
    let busy = ch ? ch.step(dtMs, now) : false;
    for (const glide of glides.current.values()) {
      if (glide.x === glide.target) continue;
      glide.x = approach(glide.x, glide.target, dtMs, glide.tau);
      if (Math.abs(glide.x - glide.target) <= MOTION_SNAP) glide.x = glide.target;
      busy = true;
    }
    if (extraRef.current?.(dtMs, now)) busy = true;
    if (handle.current) renderRef.current(handle.current);
    return busy || Boolean(ch?.active());
  });

  if (!handle.current) {
    const paint = (): void => {
      if (handle.current) renderRef.current(handle.current);
    };
    const jump = (id: string, value: number): void => {
      const glide = glides.current.get(id);
      if (glide) {
        glide.x = value;
        glide.target = value;
      } else springs.current?.jump(id, value, PLACEHOLDER);
    };
    handle.current = {
      spring: (id, target, spec, velocity, delayMs = 0) => {
        if (reducedRef.current) {
          springs.current?.jump(id, target, spec);
          paint();
          return;
        }
        springs.current?.aim(id, target, spec, { velocity, delayMs, now: performance.now() });
        loop.wake();
      },
      ease: (id, target, tauMs, from) => {
        let glide = glides.current.get(id);
        if (!glide) {
          glide = { x: from ?? target, target, tau: tauMs };
          glides.current.set(id, glide);
        }
        glide.target = target;
        glide.tau = tauMs;
        if (reducedRef.current) glide.x = target;
        if (glide.x === target) paint();
        else loop.wake();
      },
      jump: (id, value) => {
        jump(id, value);
        paint();
      },
      get: (id, fallback = 0) => glides.current.get(id)?.x ?? springs.current?.value(id, fallback) ?? fallback,
      velocity: (id) => springs.current?.velocity(id) ?? 0,
      wake: () => loop.wake(),
      paint,
    };
  }
  return handle.current;
}
