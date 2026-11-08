"use client";
// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Aurora 条目, 实现为 HX 自有.

import { useRef, type JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { fallbackGradient } from "../../backdrop/kernel/fallback";
import type { UniformMap } from "../../backdrop/kernel/gl";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import { AURORA_FOLLOW_TAU, AURORA_FRAGMENT, AURORA_INTRO_SECONDS, AURORA_MAX_LAYERS, AURORA_MAX_STOPS, AURORA_REACH_TAU } from "./aurora-shader";
import { colorCount, colorList, createFollower, finishUniforms, introProgress, stepFollower, type Follower } from "./glow-kit";

/** 默认色标: 语义 token 名. */
export const AURORA_DEFAULT_STOPS = ["primary", "accent", "primary-glow"] as const;

export type AuroraDirection = "top" | "bottom";

/** 兜底渐变角度: 光幕自上垂下时由上往下 (180 度), 自下升起时反过来 (0 度). */
const FALLBACK_DOWN = 180;
const FALLBACK_UP = 0;

export interface AuroraProps extends BackdropCommonProps {
  /** 横向色标 (token 名或 CSS 颜色), 至多 5 个. */
  readonly colorStops?: readonly string[];
  /** 光幕下缘起伏幅度, 默认 1. */
  readonly amplitude?: number;
  /** 光幕下缘的柔和程度 0..1, 默认 0.5. */
  readonly blend?: number;
  /** 光幕垂下的高度 (占画面高度), 默认 0.45. */
  readonly height?: number;
  /** 横向噪声缩放, 默认 1. */
  readonly scale?: number;
  /** 下缘光晕强度, 默认 0.6. */
  readonly glow?: number;
  /** 整体亮度, 默认 1. */
  readonly brightness?: number;
  /** 叠加的光幕层数 1..3, 默认 1. */
  readonly layers?: number;
  /** 光幕从哪条边垂下, 默认 top. */
  readonly direction?: AuroraDirection;
  /** 外部给定的时钟秒数; 给了就不用内核时钟. */
  readonly time?: number;
  /** 入场: 光幕在 2.4 秒内垂下. 默认 true. */
  readonly intro?: boolean;
  /** 亮底模式: 光色压成墨色. */
  readonly lightMode?: boolean;
  /** 边缘渐隐 0..1, 默认 0. */
  readonly fade?: number;
  /** 胶片颗粒 0..1, 默认 0. */
  readonly grain?: number;
}

/** Aurora 的入参 (纯数据), 给 auroraUniforms 用. */
export interface AuroraSettings {
  readonly amplitude: number;
  readonly blend: number;
  readonly height: number;
  readonly scale: number;
  readonly glow: number;
  readonly brightness: number;
  readonly layers: number;
  readonly direction: AuroraDirection;
  readonly intro: boolean;
  readonly time?: number;
}

/** 由一帧与跟随状态求 uniform. 纯函数 (只读 frame 与 follower). */
export function auroraUniforms(frame: Pick<BackdropFrame, "colors" | "elapsed" | "time">, follower: Follower, s: AuroraSettings): UniformMap {
  const reveal = introProgress(frame.elapsed, AURORA_INTRO_SECONDS, s.intro);
  return {
    u_stops: colorList(frame.colors, AURORA_MAX_STOPS),
    u_stop_count: colorCount(frame.colors, AURORA_MAX_STOPS),
    u_amplitude: s.amplitude,
    u_blend: Math.max(s.blend, 0),
    u_height: Math.max(s.height, 0),
    u_scale: s.scale,
    u_glow: s.glow,
    u_brightness: s.brightness,
    u_layers: Math.min(Math.max(Math.round(s.layers), 1), AURORA_MAX_LAYERS),
    u_flip: s.direction === "bottom" ? 1 : 0,
    u_reveal: reveal * reveal * (3 - 2 * reveal),
    u_reach: [follower.x, follower.y, follower.presence],
    ...(s.time === undefined ? {} : { u_time: s.time }),
  };
}

/**
 * 极光: 从一条边垂下的光幕, 下缘随噪声起伏, 竖向光丝, 横向按色标渐变. 指针横向靠近时把那一段光幕抬起,
 * 点击处闪一下. 减弱动效时内核只画一帧 (入场视为结束).
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-glow.md
 */
export function Aurora(props: AuroraProps): JSX.Element {
  const {
    colorStops = AURORA_DEFAULT_STOPS, amplitude = 1, blend = 0.5, height = 0.45, scale = 1, glow = 0.6, brightness = 1, layers = 1,
    direction = "top", time, intro = true, lightMode = false, fade = 0, grain = 0, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const follower = useRef(createFollower());
  const stops = colorStops.slice(0, AURORA_MAX_STOPS);
  const settings: AuroraSettings = { amplitude, blend, height, scale, glow, brightness, layers, direction, intro, time };
  const handle = useShaderBackdrop(
    {
      fragment: AURORA_FRAGMENT,
      uniforms: (frame) => {
        stepFollower(follower.current, frame, { move: AURORA_FOLLOW_TAU, ...AURORA_REACH_TAU }, options.pointer !== false);
        return { ...auroraUniforms(frame, follower.current, settings), ...finishUniforms(lightMode, fade, grain) };
      },
    },
    { ...options, colors: stops },
  );
  return (
    <BackdropShell handle={handle} fallback={fallbackGradient(stops, direction === "top" ? FALLBACK_DOWN : FALLBACK_UP)} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
