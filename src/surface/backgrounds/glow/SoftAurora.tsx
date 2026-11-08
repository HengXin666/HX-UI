"use client";
// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 SoftAurora 条目, 实现为 HX 自有.

import { useRef, type JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { glowFallback } from "../../backdrop/kernel/fallback";
import type { UniformMap } from "../../backdrop/kernel/gl";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import { createFollower, DEG, finishUniforms, introProgress, LIGHT, NEUTRAL, stepFollower, type Follower } from "./glow-kit";
import { SOFT_AURORA_FOLLOW_TAU, SOFT_AURORA_FRAGMENT, SOFT_AURORA_INTRO_SECONDS, SOFT_AURORA_PRESENCE_TAU } from "./soft-aurora-shader";

/** 默认双色: 亮芯与主色, 都是语义 token 名. */
export const SOFT_AURORA_DEFAULT_COLORS = { color1: "foreground", color2: "primary" } as const;
/** 规格默认速度 0.6. */
const DEFAULT_SPEED = 0.6;
/** 兜底底色. */
const FALLBACK_BASE = "background";

export interface SoftAuroraProps extends BackdropCommonProps {
  /** 光带亮芯色, 默认 token foreground. */
  readonly color1?: string;
  /** 光带主色, 默认 token primary. */
  readonly color2?: string;
  /** 横向缩放, 越大起伏越舒缓, 默认 1.5. */
  readonly scale?: number;
  /** 整体亮度, 默认 1. */
  readonly brightness?: number;
  /** 起伏噪声频率, 默认 2.5. */
  readonly noiseFrequency?: number;
  /** 起伏幅度, 默认 1. */
  readonly noiseAmplitude?: number;
  /** 光带中线高度 0..1 (自下而上), 默认 0.5. */
  readonly bandHeight?: number;
  /** 光带厚度倍率, 默认 1. */
  readonly bandSpread?: number;
  /** 三层光带逐层衰减, 默认 0.1. */
  readonly octaveDecay?: number;
  /** 各层相位错开量, 默认 0. */
  readonly layerOffset?: number;
  /** 色相流转速度, 默认 1. */
  readonly colorSpeed?: number;
  /** 光谱色混入程度 0..1, 默认 1. */
  readonly spectrum?: number;
  /** 光带倾角 (度), 默认 0. */
  readonly tilt?: number;
  /** 规格名的指针开关, 与 mouseInteraction 同义, 两者任一为 false 即关. */
  readonly enableMouseInteraction?: boolean;
  /** 指针把光带拉向自己的程度, 默认 0.25. */
  readonly mouseInfluence?: number;
  /** 点击放出一圈脉冲 (同时至多 4 圈), 默认 true. */
  readonly clickPulse?: boolean;
  /** 入场: 光带在 2 秒内亮起. 默认 true. */
  readonly intro?: boolean;
  readonly lightMode?: boolean;
  /** 边缘渐隐 0..1, 默认 0. */
  readonly fade?: number;
  /** 胶片颗粒 0..1, 默认 0. */
  readonly grain?: number;
}

export interface SoftAuroraSettings {
  readonly scale: number;
  readonly brightness: number;
  readonly noiseFrequency: number;
  readonly noiseAmplitude: number;
  readonly bandHeight: number;
  readonly bandSpread: number;
  readonly octaveDecay: number;
  readonly layerOffset: number;
  readonly colorSpeed: number;
  readonly spectrum: number;
  readonly tilt: number;
  readonly mouseInfluence: number;
  readonly clickPulse: boolean;
  readonly intro: boolean;
}

/** 由一帧与跟随状态求 uniform. 纯函数. */
export function softAuroraUniforms(frame: Pick<BackdropFrame, "colors" | "elapsed">, follower: Follower, s: SoftAuroraSettings): UniformMap {
  const open = introProgress(frame.elapsed, SOFT_AURORA_INTRO_SECONDS, s.intro);
  return {
    u_color1: frame.colors[0] ?? LIGHT,
    u_color2: frame.colors[1] ?? NEUTRAL,
    u_scale: Math.max(s.scale, 0.01),
    u_brightness: s.brightness,
    u_freq: s.noiseFrequency,
    u_amp: s.noiseAmplitude,
    u_band_height: s.bandHeight,
    u_band_spread: Math.max(s.bandSpread, 0.01),
    u_octave_decay: s.octaveDecay,
    u_layer_offset: s.layerOffset,
    u_color_speed: s.colorSpeed,
    u_spectrum: s.spectrum,
    u_tilt: s.tilt * DEG,
    u_influence: s.mouseInfluence,
    u_pulse_on: s.clickPulse ? 1 : 0,
    u_open: 1 - (1 - open) ** 3,
    u_mouse: [follower.x, follower.y, follower.presence],
  };
}

/**
 * 柔光极光: 一条横贯画面的柔光带, 三层噪声起伏叠加, 能量高处收成亮芯, 色相沿横向缓慢流转.
 * 指针把附近的光带拉向自己, 点击放出扩散的光环. 减弱动效时内核只画一帧.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-glow.md
 */
export function SoftAurora(props: SoftAuroraProps): JSX.Element {
  const {
    color1 = SOFT_AURORA_DEFAULT_COLORS.color1, color2 = SOFT_AURORA_DEFAULT_COLORS.color2, scale = 1.5, brightness = 1, noiseFrequency = 2.5,
    noiseAmplitude = 1, bandHeight = 0.5, bandSpread = 1, octaveDecay = 0.1, layerOffset = 0, colorSpeed = 1, spectrum = 1, tilt = 0,
    enableMouseInteraction = true, mouseInfluence = 0.25, clickPulse = true, intro = true, lightMode = false, fade = 0, grain = 0,
    speed = DEFAULT_SPEED, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon({ ...common, speed });
  const interactive = enableMouseInteraction && options.pointer !== false;
  const follower = useRef(createFollower());
  const settings: SoftAuroraSettings = {
    scale, brightness, noiseFrequency, noiseAmplitude, bandHeight, bandSpread, octaveDecay, layerOffset, colorSpeed, spectrum, tilt, mouseInfluence, clickPulse, intro,
  };
  const handle = useShaderBackdrop(
    {
      fragment: SOFT_AURORA_FRAGMENT,
      uniforms: (frame) => {
        stepFollower(follower.current, frame, { move: SOFT_AURORA_FOLLOW_TAU, ...SOFT_AURORA_PRESENCE_TAU }, interactive);
        return { ...softAuroraUniforms(frame, follower.current, settings), ...finishUniforms(lightMode, fade, grain) };
      },
    },
    { ...options, pointer: options.pointer !== false && (enableMouseInteraction || clickPulse), colors: [color1, color2], colorFallbacks: [LIGHT, NEUTRAL] },
  );
  return (
    <BackdropShell handle={handle} fallback={glowFallback(FALLBACK_BASE, color2)} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
