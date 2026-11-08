"use client";
// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 RippleGrid 条目, 实现为 HX 自有.

import { useRef, type JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { cssColorOf } from "../../backdrop/kernel/color";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import { RIPPLE_GRID, RIPPLE_GRID_FRAGMENT, RIPPLE_VARIANTS, type RippleVariant } from "./ripple-grid-shader";
import { DEG, enumOf, introProgress, rgbAt } from "./tokens";

/** 自动涟漪: 从中心, 随机位置, 或不自动. */
export type AutoRipple = "center" | "random" | "none";

export interface RippleGridProps extends BackdropCommonProps {
  /** 格线色, token 名或 CSS 颜色, 默认 foreground. */
  readonly color?: string;
  /** 样式: lines / dots / cross. */
  readonly variant?: RippleVariant;
  /** 格距 (CSS 像素), 默认 48. */
  readonly cellSize?: number;
  /** 线宽 (CSS 像素), 默认 1. */
  readonly lineWidth?: number;
  /** 指针光晕, 默认 0.6. */
  readonly glow?: number;
  /** 涟漪强度, 默认 1. */
  readonly rippleStrength?: number;
  /** 涟漪推进速度倍率, 默认 1. */
  readonly rippleSpeed?: number;
  /** 涟漪波长倍率, 默认 1. */
  readonly rippleSize?: number;
  readonly autoRipple?: AutoRipple;
  /** 自动涟漪间隔 (秒), 默认 2.6. */
  readonly rippleInterval?: number;
  /** 格面后仰 (度, 0..80), 默认 0. */
  readonly tilt?: number;
  /** 格面旋转 (度), 默认 0. */
  readonly rotation?: number;
  /** 点击打出涟漪. */
  readonly clickRipple?: boolean;
  /** 首帧起 1.6 秒由中心铺开. */
  readonly intro?: boolean;
  /** 四边淡出 0..1, 默认 0.5. */
  readonly fade?: number;
  /** 浅色底: 光晕压暗线色而不是提亮. */
  readonly lightMode?: boolean;
}

/** 一个涟漪: 屏幕归一化坐标, 出生时刻 (场时钟), 强度. */
export interface Ripple {
  readonly x: number;
  readonly y: number;
  readonly born: number;
  readonly strength: number;
}

/** 涟漪调度状态. */
export interface RippleState {
  ripples: Ripple[];
  nextAuto: number;
  seenTap: number;
  trailAt: number;
  glow: number;
  seed: number;
}

export function makeRippleState(): RippleState {
  return { ripples: [], nextAuto: 0.3, seenTap: Number.NEGATIVE_INFINITY, trailAt: Number.NEGATIVE_INFINITY, glow: 0, seed: 1 };
}

/** 线性同余的 0..1 序列, 随机自动涟漪的位置用, 结果可复现. */
function nextRandom(s: RippleState): number {
  s.seed = (Math.imul(s.seed, 1664525) + 1013904223) >>> 0;
  return s.seed / 4294967296;
}

/**
 * 推进一帧: 按间隔放自动涟漪, 新点击放满强度涟漪, 指针移动时每 0.16 秒留一个弱涟漪, 过期的出队, 超过 12 个丢最旧的;
 * 光晕按 6 / 2.5 每秒的速率随指针进出. 静态帧 (dt 为 0) 不放新涟漪.
 *
 * @param s 原地修改的状态.
 * @param frame 场时钟, 帧长与指针.
 * @param o 自动方式, 间隔, 是否点击涟漪.
 */
export function stepRipples(s: RippleState, frame: Pick<BackdropFrame, "time" | "dt" | "pointer">, o: { auto: AutoRipple; interval: number; click: boolean }): Ripple[] {
  const { time, dt, pointer: p } = frame;
  const engaged = p.inside;
  s.glow += ((engaged ? 1 : 0) - s.glow) * (dt <= 0 ? 1 : 1 - Math.exp(-dt * (engaged ? RIPPLE_GRID.glowRise : RIPPLE_GRID.glowFall)));
  if (dt > 0) {
    if (o.auto !== "none" && time >= s.nextAuto) {
      const random = o.auto === "random";
      s.ripples.push({ x: random ? 0.15 + 0.7 * nextRandom(s) : 0.5, y: random ? 0.15 + 0.7 * nextRandom(s) : 0.5, born: time, strength: 0.8 });
      s.nextAuto = time + Math.max(0.2, o.interval);
    }
    const tap = p.taps[p.taps.length - 1];
    if (tap && tap.at > s.seenTap) {
      s.seenTap = tap.at;
      if (o.click) s.ripples.push({ x: tap.x, y: tap.y, born: time, strength: 1 });
    }
    if (engaged && Math.hypot(p.vx, p.vy) > 0.15 && time - s.trailAt >= RIPPLE_GRID.trailEvery) {
      s.trailAt = time;
      s.ripples.push({ x: p.x, y: p.y, born: time, strength: 0.3 });
    }
  }
  s.ripples = s.ripples.filter((r) => time - r.born <= RIPPLE_GRID.rippleLife && time >= r.born).slice(-RIPPLE_GRID.maxRipples);
  return s.ripples;
}

/** 涟漪打包成 vec4 数组 (x, y, 年龄, 强度). */
export function packRipples(ripples: readonly Ripple[], time: number): Float32Array {
  const out = new Float32Array(RIPPLE_GRID.maxRipples * 4);
  ripples.slice(-RIPPLE_GRID.maxRipples).forEach((r, i) => out.set([r.x, r.y, time - r.born, r.strength], i * 4));
  return out;
}

/** WebGL 不可用时的静态方格. */
export function rippleFallback(color: string, cell: number): string {
  const ink = `color-mix(in srgb, ${cssColorOf(color)} 25%, transparent)`;
  const tile = `0 0 / ${cell}px ${cell}px`;
  return `linear-gradient(${ink} 1px, transparent 1px) ${tile}, linear-gradient(90deg, ${ink} 1px, transparent 1px) ${tile}`;
}

/**
 * 涟漪格面: 线 / 点 / 十字格面可后仰成透视地面并旋转, 中心或随机位置定时泛起涟漪, 点击与指针移动也会激起,
 * 波前把格线沿径向推开并提亮; 指针处光晕, 远处挤密淡出, 入场由中心铺开.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-grid.md
 */
export function RippleGrid(props: RippleGridProps): JSX.Element {
  const {
    color = "foreground", variant = "lines", cellSize = 48, lineWidth = 1, glow = 0.6, rippleStrength = 1, rippleSpeed = 1, rippleSize = 1,
    autoRipple = "center", rippleInterval = 2.6, tilt = 0, rotation = 0, clickRipple = true, intro = true, fade = 0.5, lightMode = false, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const state = useRef(makeRippleState());
  const cell = Math.max(4, cellSize);

  const uniforms = (frame: BackdropFrame) => {
    const ripples = stepRipples(state.current, frame, { auto: autoRipple, interval: rippleInterval, click: clickRipple });
    const cssW = frame.fit.width / frame.fit.scale;
    const cssH = frame.fit.height / frame.fit.scale;
    return {
      u_color: rgbAt(frame.colors, 0),
      u_variant: enumOf(RIPPLE_VARIANTS, variant),
      u_cell: cell,
      u_width: Math.max(0.25, lineWidth),
      u_glow: glow,
      u_glow_on: state.current.glow,
      u_strength: rippleStrength,
      u_wave: cell * 1.1 * Math.max(0.1, rippleSize),
      u_front: RIPPLE_GRID.frontSpeed * rippleSpeed,
      u_tilt: Math.min(Math.max(tilt, 0), 80) * DEG,
      u_turn: rotation * DEG,
      u_fade: fade,
      u_reveal: introProgress(frame.elapsed, RIPPLE_GRID.introSeconds, intro) * (Math.hypot(cssW, cssH) / 2 + cell * 4),
      u_light: lightMode ? 1 : 0,
      u_ripples: { list: packRipples(ripples, frame.time), size: 4 as const },
      u_ripple_count: ripples.length,
    };
  };

  const handle = useShaderBackdrop({ fragment: RIPPLE_GRID_FRAGMENT, uniforms }, { ...options, colors: [color] });
  return (
    <BackdropShell handle={handle} fallback={rippleFallback(color, cell)} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
