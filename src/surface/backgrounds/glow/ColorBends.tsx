"use client";
// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 ColorBends 条目, 实现为 HX 自有.

import { useRef, type JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { fallbackGradient } from "../../backdrop/kernel/fallback";
import type { UniformMap } from "../../backdrop/kernel/gl";
import { clamp } from "../../backdrop/kernel/math";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import { colorCount, colorList, createFollower, DEG, finishUniforms, stepFollower, tauOf, type Follower } from "./glow-kit";
import { COLOR_BENDS_FRAGMENT, COLOR_BENDS_MAX_COLORS, COLOR_BENDS_MAX_ITERATIONS, COLOR_BENDS_POINTER_RATE } from "./color-bends-shader";

/** 默认色带 (colors 为空时用): 语义 token 名. */
export const COLOR_BENDS_DEFAULT_COLORS = ["primary", "accent", "primary-glow"] as const;
/** 规格默认速度 0.2. */
const DEFAULT_SPEED = 0.2;
/** 跟随在场进 / 离 (本库定, 与内核指针一致). */
const PRESENCE_TAU = { enter: 0.35, leave: 0.6 } as const;

export interface ColorBendsProps extends BackdropCommonProps {
  /** 色带 (token 名或 CSS 颜色), 至多 8 条; 空数组时用默认 token 色. */
  readonly colors?: readonly string[];
  /** 色带走向 (度), 默认 90. */
  readonly rotation?: number;
  /** 透明底: 色带之外透出下层, 默认 true. */
  readonly transparent?: boolean;
  /** 自转速度 (度每秒, 随 speed 缩放), 默认 0. */
  readonly autoRotate?: number;
  readonly scale?: number;
  /** 色带弯曲频率, 默认 1. */
  readonly frequency?: number;
  /** 扭曲强度, 大于 1 时放大位移, 默认 1. */
  readonly warpStrength?: number;
  /** 指针推开色带的力度, 默认 1. */
  readonly mouseInfluence?: number;
  /** 指针视差, 默认 0.5. */
  readonly parallax?: number;
  /** 颗粒噪点, 默认 0.15. */
  readonly noise?: number;
  /** 扭曲迭代次数 1..6, 默认 1. */
  readonly iterations?: number;
  /** 亮度, 默认 1.5. */
  readonly intensity?: number;
  /** 色带锐度, 越大越细, 默认 6. */
  readonly bandWidth?: number;
}

export interface ColorBendsSettings {
  readonly rotation: number;
  readonly transparent: boolean;
  readonly autoRotate: number;
  readonly scale: number;
  readonly frequency: number;
  readonly warpStrength: number;
  readonly mouseInfluence: number;
  readonly parallax: number;
  readonly noise: number;
  readonly iterations: number;
  readonly intensity: number;
  readonly bandWidth: number;
}

/** 实际用的色带: 空数组退到默认 token 色, 超出 8 条截掉. */
export function bendColors(colors: readonly string[]): readonly string[] {
  return (colors.length ? colors : COLOR_BENDS_DEFAULT_COLORS).slice(0, COLOR_BENDS_MAX_COLORS);
}

/** 由一帧与跟随状态求 uniform; 自转角 = rotation + autoRotate * 时钟. 纯函数. */
export function colorBendsUniforms(frame: Pick<BackdropFrame, "colors" | "time">, follower: Follower, s: ColorBendsSettings): UniformMap {
  return {
    u_colors: colorList(frame.colors, COLOR_BENDS_MAX_COLORS),
    u_color_count: colorCount(frame.colors, COLOR_BENDS_MAX_COLORS),
    u_rot: (s.rotation + s.autoRotate * frame.time) * DEG,
    u_transparent: s.transparent ? 1 : 0,
    u_scale: Math.max(s.scale, 0.01),
    u_frequency: s.frequency,
    u_warp_strength: Math.max(s.warpStrength, 0),
    u_mouse_influence: s.mouseInfluence,
    u_parallax: s.parallax,
    u_noise: s.noise,
    u_iterations: clamp(Math.round(s.iterations), 1, COLOR_BENDS_MAX_ITERATIONS),
    u_intensity: s.intensity,
    u_band_width: Math.max(s.bandWidth, 0.01),
    u_mouse: [follower.x, follower.y, follower.presence],
  };
}

/**
 * 弯色带: 几条彩色光带沿正弦弯曲, 被迭代扭曲揉动, 带宽按 1 - exp(-w / exp(w * m)) 收成锐利的光脊, 前带部分遮挡后带.
 * 指针带来视差并把附近色带推开. 减弱动效时内核只画一帧.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-glow.md
 */
export function ColorBends(props: ColorBendsProps): JSX.Element {
  const {
    colors = [], rotation = 90, transparent = true, autoRotate = 0, scale = 1, frequency = 1, warpStrength = 1, mouseInfluence = 1, parallax = 0.5, noise = 0.15,
    iterations = 1, intensity = 1.5, bandWidth = 6, speed = DEFAULT_SPEED, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon({ ...common, speed });
  const follower = useRef(createFollower());
  const bands = bendColors(colors);
  const settings: ColorBendsSettings = { rotation, transparent, autoRotate, scale, frequency, warpStrength, mouseInfluence, parallax, noise, iterations, intensity, bandWidth };
  const handle = useShaderBackdrop(
    {
      fragment: COLOR_BENDS_FRAGMENT,
      uniforms: (frame) => {
        stepFollower(follower.current, frame, { move: tauOf(COLOR_BENDS_POINTER_RATE), ...PRESENCE_TAU }, options.pointer !== false);
        return { ...colorBendsUniforms(frame, follower.current, settings), ...finishUniforms(false, 0, 0) };
      },
    },
    { ...options, colors: bands },
  );
  return (
    <BackdropShell handle={handle} fallback={fallbackGradient(bands, rotation)} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
