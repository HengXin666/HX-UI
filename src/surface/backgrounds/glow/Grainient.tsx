"use client";
// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Grainient 条目, 实现为 HX 自有.

import { useRef, type JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { fallbackGradient } from "../../backdrop/kernel/fallback";
import type { UniformList, UniformMap } from "../../backdrop/kernel/gl";
import { clamp } from "../../backdrop/kernel/math";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import { colorCount, colorList, createFollower, DEG, finishUniforms, introProgress, stepFollower, type Follower } from "./glow-kit";
import {
  GRAINIENT_FOLLOW_TAU, GRAINIENT_FRAGMENT, GRAINIENT_INTRO_SECONDS, GRAINIENT_LIFT, GRAINIENT_MAX_COLORS, GRAINIENT_MAX_STIRS, GRAINIENT_STIR_LIFE,
  GRAINIENT_STIR_STEP, GRAINIENT_TYPES,
} from "./grainient-shader";

/** 默认色标: 语义 token 名. */
export const GRAINIENT_DEFAULT_COLORS = ["primary", "accent", "primary-glow"] as const;

export type GrainientType = keyof typeof GRAINIENT_TYPES;

/** 搅动点的步长: vec4 (x, y, 已过寿命比例, 力度). */
const STIR_STRIDE = 4;
/** 指针速度 (每秒归一化单位) 换搅动力度的倍率 (本库定), 慢慢划也能搅开. */
const STIR_SPEED_GAIN = 1.5;
/** variation 换成噪声种子偏移的倍率 (本库定). */
const SEED_SPAN = 13.1;
/** 跟随在场进 / 离 (本库定, 与内核指针一致). */
const PRESENCE_TAU = { enter: 0.35, leave: 0.6 } as const;

export interface GrainientProps extends BackdropCommonProps {
  /** 色标 (token 名或 CSS 颜色), 至多 8 个, 在 Oklab 里插值. */
  readonly colors?: readonly string[];
  /** 线性或径向, 默认 linear. */
  readonly type?: GrainientType;
  /** 线性渐变方向 (度), 默认 55. */
  readonly angle?: number;
  /** 色带往返次数, 默认 1. */
  readonly bands?: number;
  /** 噪声流动的扭曲量, 默认 0.8. */
  readonly flow?: number;
  /** 流动噪声尺度, 默认 1. */
  readonly scale?: number;
  /** 色标间过渡的柔和程度 0..1, 默认 1. */
  readonly softness?: number;
  /** 丝光细纹 0..1, 默认 0.35. */
  readonly silk?: number;
  /** 颗粒强度, 默认 0.08. */
  readonly grainAmount?: number;
  /** 颗粒尺寸 (CSS 像素), 默认 1.2. */
  readonly grainSize?: number;
  /** 颗粒逐帧跳动, 默认 true. */
  readonly grainAnimated?: boolean;
  readonly contrast?: number;
  readonly saturation?: number;
  /** 变体: 换一组噪声种子, 默认 0. */
  readonly variation?: number;
  /** 规格名的指针开关, 与 mouseInteraction 同义, 两者任一为 false 即关. */
  readonly interactive?: boolean;
  /** 指针划过留下的搅动强度, 默认 1. */
  readonly stir?: number;
  /** 点击搅出一个旋涡 (同时至多 4 个), 默认 true. */
  readonly clickSwirl?: boolean;
  /** 入场: 1.6 秒内由首色向外显出. 默认 true. */
  readonly intro?: boolean;
  /** 亮底模式: 整体提亮 0.2. */
  readonly lightMode?: boolean;
}

export interface GrainientSettings {
  readonly type: GrainientType;
  readonly angle: number;
  readonly bands: number;
  readonly flow: number;
  readonly scale: number;
  readonly softness: number;
  readonly silk: number;
  readonly grainAmount: number;
  readonly grainSize: number;
  readonly grainAnimated: boolean;
  readonly contrast: number;
  readonly saturation: number;
  readonly variation: number;
  readonly stir: number;
  readonly clickSwirl: boolean;
  readonly intro: boolean;
  readonly lightMode: boolean;
}

/** 一个搅动点: 归一化坐标, 年龄 (秒), 长成程度 0..1, 力度 0..1. */
export interface Stir {
  x: number;
  y: number;
  age: number;
  grow: number;
  strength: number;
}

/** 搅动轨迹: 点列 (最新在末尾) 与距下一次落点的累计时间. */
export interface StirTrail {
  stirs: Stir[];
  since: number;
}

export function createStirTrail(): StirTrail {
  return { stirs: [], since: 0 };
}

/**
 * 推进搅动轨迹: 点逐帧变老, 过寿命移除; 指针在场且在动时每 STIR_STEP 秒落一个点, 最新点在 STIR_STEP 内长成; 至多 MAX_STIRS 个.
 *
 * @param trail 轨迹, 原地修改.
 * @param follower 平滑后的指针.
 * @param dt 帧长 (秒), 静态帧为 0 时不动.
 * @param engaged 指针在场且开了交互.
 */
export function stepStirs(trail: StirTrail, follower: Follower, dt: number, engaged: boolean): void {
  if (dt <= 0) return;
  for (const s of trail.stirs) {
    s.age += dt;
    s.grow = Math.min(1, s.grow + dt / GRAINIENT_STIR_STEP);
  }
  trail.stirs = trail.stirs.filter((s) => s.age < GRAINIENT_STIR_LIFE);
  const moving = Math.hypot(follower.vx, follower.vy);
  trail.since += dt;
  if (!engaged || moving <= 0 || trail.since < GRAINIENT_STIR_STEP) return;
  trail.since = 0;
  trail.stirs.push({ x: follower.x, y: follower.y, age: 0, grow: 0, strength: clamp(moving * STIR_SPEED_GAIN, 0, 1) });
  if (trail.stirs.length > GRAINIENT_MAX_STIRS) trail.stirs.shift();
}

/** 搅动点打包成 vec4 数组 uniform (x, y, 已过寿命比例, 长成 * 力度). 纯函数. */
export function stirList(trail: StirTrail): UniformList {
  const list = new Float32Array(GRAINIENT_MAX_STIRS * STIR_STRIDE);
  trail.stirs.slice(-GRAINIENT_MAX_STIRS).forEach((s, i) => list.set([s.x, s.y, s.age / GRAINIENT_STIR_LIFE, s.grow * s.strength], i * STIR_STRIDE));
  return { list, size: STIR_STRIDE };
}

/** 由一帧与搅动轨迹求 uniform. 纯函数. */
export function grainientUniforms(frame: Pick<BackdropFrame, "colors" | "elapsed">, trail: StirTrail, s: GrainientSettings): UniformMap {
  const a = s.angle * DEG;
  return {
    u_ramp: colorList(frame.colors, GRAINIENT_MAX_COLORS),
    u_count: colorCount(frame.colors, GRAINIENT_MAX_COLORS),
    u_type: GRAINIENT_TYPES[s.type],
    u_dir: [Math.cos(a), Math.sin(a)],
    u_bands: Math.max(s.bands, 1),
    u_flow: s.flow,
    u_scale: Math.max(s.scale, 0.01),
    u_softness: s.softness,
    u_silk: s.silk,
    u_grain_amount: s.grainAmount,
    u_grain_size: s.grainSize,
    u_grain_live: s.grainAnimated ? 1 : 0,
    u_contrast: s.contrast,
    u_saturation: s.saturation,
    u_seed: s.variation * SEED_SPAN,
    u_stir: s.stir,
    u_twirl_on: s.clickSwirl ? 1 : 0,
    u_reveal: introProgress(frame.elapsed, GRAINIENT_INTRO_SECONDS, s.intro),
    u_lift: s.lightMode ? GRAINIENT_LIFT : 0,
    u_stirs: stirList(trail),
    u_stir_count: Math.min(trail.stirs.length, GRAINIENT_MAX_STIRS),
  };
}

/**
 * 颗粒渐变: 色标在 Oklab 里插值的线性 / 径向渐变, 被分形噪声缓缓扭动, 叠丝光细纹与胶片颗粒.
 * 指针划过留下一串小旋涡, 点击搅出一个大旋涡; 入场由首色向外显出. 减弱动效时内核只画一帧.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-glow.md
 */
export function Grainient(props: GrainientProps): JSX.Element {
  const {
    colors = GRAINIENT_DEFAULT_COLORS, type = "linear", angle = 55, bands = 1, flow = 0.8, scale = 1, softness = 1, silk = 0.35, grainAmount = 0.08,
    grainSize = 1.2, grainAnimated = true, contrast = 1, saturation = 1, variation = 0, interactive = true, stir = 1, clickSwirl = true, intro = true,
    lightMode = false, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const engaged = interactive && options.pointer !== false;
  const follower = useRef(createFollower());
  const trail = useRef(createStirTrail());
  const stops = colors.slice(0, GRAINIENT_MAX_COLORS);
  const settings: GrainientSettings = {
    type, angle, bands, flow, scale, softness, silk, grainAmount, grainSize, grainAnimated, contrast, saturation, variation, stir, clickSwirl, intro, lightMode,
  };
  const handle = useShaderBackdrop(
    {
      fragment: GRAINIENT_FRAGMENT,
      uniforms: (frame) => {
        stepFollower(follower.current, frame, { move: GRAINIENT_FOLLOW_TAU, ...PRESENCE_TAU }, engaged);
        stepStirs(trail.current, follower.current, frame.dt, engaged && frame.pointer.inside);
        return { ...grainientUniforms(frame, trail.current, settings), ...finishUniforms(false, 0, 0) };
      },
    },
    { ...options, pointer: options.pointer !== false && (interactive || clickSwirl), colors: stops },
  );
  return (
    <BackdropShell handle={handle} fallback={fallbackGradient(stops, angle)} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
