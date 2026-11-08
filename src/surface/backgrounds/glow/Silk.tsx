"use client";
// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 Silk 条目, 实现为 HX 自有.

import { useRef, type JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { fallbackGradient } from "../../backdrop/kernel/fallback";
import type { UniformMap } from "../../backdrop/kernel/gl";
import { approach, clamp } from "../../backdrop/kernel/math";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import { createFollower, DEG, finishUniforms, introProgress, LIGHT, NEUTRAL, stepFollower, tauOf, type Follower } from "./glow-kit";
import {
  SILK_DRAG_RATE, SILK_FLOW_RATE, SILK_FOLLOW_RATE, SILK_FRAGMENT, SILK_INTRO_RUSH, SILK_INTRO_SECONDS, SILK_LIGHT_RATE, SILK_TOUCH_RATE,
} from "./silk-shader";

/** 默认双色: 绸面与高光, 都是语义 token 名. */
export const SILK_DEFAULT_COLORS = { color: "primary", sheenColor: "foreground" } as const;
/** 规格默认速度 5 (流动相位每秒推进 0.1 * speed). */
const DEFAULT_SPEED = 5;
/** variation 换成相位种子偏移的倍率 (本库定). */
const SEED_SPAN = 7.9;
/** 兜底渐变角度. */
const FALLBACK_ANGLE = 135;

export interface SilkProps extends BackdropCommonProps {
  /** 绸面色 (token 名或 CSS 颜色), 默认 token primary. */
  readonly color?: string;
  /** 高光色, 默认 token foreground. */
  readonly sheenColor?: string;
  /** 褶皱尺度, 越大褶皱越宽, 默认 1. */
  readonly scale?: number;
  /** 纤维噪点强度, 默认 1.5. */
  readonly noiseIntensity?: number;
  /** 褶皱走向旋转 (度), 默认 0. */
  readonly rotation?: number;
  /** 镜面高光 0..1, 默认 0.5. */
  readonly sheen?: number;
  /** 起伏打光深度 0..1, 默认 0.5. */
  readonly depth?: number;
  /** 指针光晕, 默认 0.3. */
  readonly glow?: number;
  /** 细褶纹混入量, 默认 1. */
  readonly ripple?: number;
  /** 大幅波动的扭曲量, 默认 1. */
  readonly wave?: number;
  /** 变体: 换一组相位, 默认 0. */
  readonly variation?: number;
  /** 指针拖动绸面的力度, 默认 1. */
  readonly interactionStrength?: number;
  /** 点击放出一圈涟漪 (寿命 1.6 秒), 默认 true. */
  readonly clickRipple?: boolean;
  /** 入场: 2.2 秒内由中心显出, 褶皱先快后慢. 默认 true. */
  readonly intro?: boolean;
  /** 边缘渐隐 0..1, 默认 0. */
  readonly fade?: number;
  readonly lightMode?: boolean;
  /** 胶片颗粒 0..1, 默认 0. */
  readonly grain?: number;
}

export interface SilkSettings {
  readonly scale: number;
  readonly noiseIntensity: number;
  readonly rotation: number;
  readonly sheen: number;
  readonly depth: number;
  readonly glow: number;
  readonly ripple: number;
  readonly wave: number;
  readonly variation: number;
  readonly interactionStrength: number;
  readonly clickRipple: boolean;
  readonly intro: boolean;
}

/** 光源位置: 比指针跟随更慢一拍 (规格 light follow 速率 3). */
export interface SilkLight {
  x: number;
  y: number;
}

/** 规格的五次缓动 t^3 (t (6t - 15) + 10), 入参钳到 0..1. */
export function silkEase(t: number): number {
  const x = clamp(t, 0, 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

/** 由一帧, 跟随状态与光源求 uniform. 纯函数. */
export function silkUniforms(frame: Pick<BackdropFrame, "colors" | "elapsed" | "time">, follower: Follower, light: SilkLight, s: SilkSettings): UniformMap {
  const open = silkEase(introProgress(frame.elapsed, SILK_INTRO_SECONDS, s.intro));
  return {
    u_color: frame.colors[0] ?? NEUTRAL,
    u_sheen_color: frame.colors[1] ?? LIGHT,
    u_scale: Math.max(s.scale, 0.01),
    u_turn: s.rotation * DEG,
    u_flow: frame.time * SILK_FLOW_RATE - SILK_INTRO_RUSH * (1 - open),
    u_noise: s.noiseIntensity,
    u_sheen: s.sheen,
    u_depth: s.depth,
    u_glow: s.glow,
    u_ripple: s.ripple,
    u_wave: s.wave,
    u_seed: s.variation * SEED_SPAN,
    u_intro: open,
    u_ripple_on: s.clickRipple ? 1 : 0,
    u_drag: [follower.x, follower.y, follower.presence],
    u_vel: [follower.vx * s.interactionStrength, follower.vy * s.interactionStrength],
    u_light_at: [light.x, light.y, follower.presence],
  };
}

/**
 * 丝绸: 两层正弦褶皱经扭曲叠成绸面, 按法线与跟随指针的光源打光, 褶峰收出镜面高光.
 * 指针拖过处推动绸面并亮起光晕, 点击放出一圈涟漪; 入场由中心显出. 减弱动效时内核只画一帧.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-glow.md
 */
export function Silk(props: SilkProps): JSX.Element {
  const {
    color = SILK_DEFAULT_COLORS.color, sheenColor = SILK_DEFAULT_COLORS.sheenColor, scale = 1, noiseIntensity = 1.5, rotation = 0, sheen = 0.5, depth = 0.5,
    glow = 0.3, ripple = 1, wave = 1, variation = 0, interactionStrength = 1, clickRipple = true, intro = true, fade = 0, lightMode = false, grain = 0,
    speed = DEFAULT_SPEED, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon({ ...common, speed });
  const interactive = options.pointer !== false;
  const follower = useRef(createFollower());
  const light = useRef<SilkLight>({ x: follower.current.x, y: follower.current.y });
  const settings: SilkSettings = { scale, noiseIntensity, rotation, sheen, depth, glow, ripple, wave, variation, interactionStrength, clickRipple, intro };
  const handle = useShaderBackdrop(
    {
      fragment: SILK_FRAGMENT,
      uniforms: (frame) => {
        const taus = { move: tauOf(SILK_FOLLOW_RATE), drag: tauOf(SILK_DRAG_RATE), enter: tauOf(SILK_TOUCH_RATE.enter), leave: tauOf(SILK_TOUCH_RATE.leave) };
        stepFollower(follower.current, frame, taus, interactive);
        light.current.x = approach(light.current.x, follower.current.x, frame.dt, tauOf(SILK_LIGHT_RATE));
        light.current.y = approach(light.current.y, follower.current.y, frame.dt, tauOf(SILK_LIGHT_RATE));
        return { ...silkUniforms(frame, follower.current, light.current, settings), ...finishUniforms(lightMode, fade, grain) };
      },
    },
    { ...options, colors: [color, sheenColor], colorFallbacks: [NEUTRAL, LIGHT] },
  );
  return (
    <BackdropShell handle={handle} fallback={fallbackGradient([color, sheenColor, color], FALLBACK_ANGLE)} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
