"use client";
// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 CRTWarp 条目, 实现为 HX 自有.

import type { JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { glowFallback } from "../../backdrop/kernel/fallback";
import type { UniformMap } from "../../backdrop/kernel/gl";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import { CRT_CONTENT, CRT_MASKS, CRT_WARP, CRT_WARP_FRAGMENT, crtDecay, crtRise, type CrtMask } from "./crt-warp-shader";
import { colorAt, introProgress, modeOf } from "./kit";

export interface CRTWarpProps extends BackdropCommonProps {
  /** 荧光色 (token 名或 CSS 颜色), 默认 primary. */
  readonly color?: string;
  /** 屏幕底色, 默认 background. */
  readonly backgroundColor?: string;
  /** 波场变体 0..3, 默认 0. */
  readonly variation?: number;
  /** 波场扭曲幅度, 默认 0.3. */
  readonly waveAmplitude?: number;
  /** 波场频率, 默认 2.5. */
  readonly waveFrequency?: number;
  /** 量化级数, 默认 3. */
  readonly levels?: number;
  /** 横向格数, 默认 80. */
  readonly columns?: number;
  /** 荧光余辉 0..1, 默认 0.4. */
  readonly persistence?: number;
  /** 屏幕弯曲, 默认 0.25. */
  readonly curvature?: number;
  /** 屏幕圆角 0..1, 默认 0. */
  readonly corners?: number;
  /** 扫描线强度, 默认 0.6. */
  readonly scanlineStrength?: number;
  /** 扫描线条数 (整屏高), 默认 200. */
  readonly scanlineFrequency?: number;
  /** 荫罩, 默认 aperture. */
  readonly mask?: CrtMask;
  /** 荫罩强度 0..1, 默认 0.3. */
  readonly maskStrength?: number;
  /** 辉光, 默认 1.5. */
  readonly bloom?: number;
  /** 辉光半径倍率, 默认 1. */
  readonly bloomRadius?: number;
  /** 色移 (uv 单位), 默认 0.003. */
  readonly rgbShift?: number;
  /** 颗粒, 默认 0.1. */
  readonly noise?: number;
  /** 闪烁, 默认 0.15. */
  readonly flicker?: number;
  /** 工频干扰条, 默认 0.2. */
  readonly interference?: number;
  /** 暗角, 默认 0.3. */
  readonly vignette?: number;
  /** 亮度, 默认 1. */
  readonly brightness?: number;
  /** 入场: 逐行预热, 默认 true. */
  readonly intro?: boolean;
  /** 点击触发一次垂直翻滚, 默认 true. */
  readonly clickRoll?: boolean;
}

const DEFAULTS = {
  waveAmplitude: 0.3, waveFrequency: 2.5, levels: 3, columns: 80, persistence: 0.4, curvature: 0.25, scanlineStrength: 0.6, scanlineFrequency: 200,
  maskStrength: 0.3, bloom: 1.5, rgbShift: 0.003, noise: 0.1, flicker: 0.15, interference: 0.2, vignette: 0.3,
} as const;
/** 量化至少两级, 格数至少 8. */
const MIN_LEVELS = 2;
const MIN_COLUMNS = 8;

type Knobs = Required<Omit<CRTWarpProps, keyof BackdropCommonProps | "color" | "backgroundColor">>;

/** 内容通道的 uniform, 纯函数, 单测覆盖. */
export function crtContentUniforms(frame: Pick<BackdropFrame, "elapsed" | "dt" | "reduced">, k: Knobs): UniformMap {
  const reveal = introProgress(frame.elapsed, CRT_WARP.introSeconds, k.intro);
  const variant = ((Math.round(k.variation) % CRT_WARP.variants) + CRT_WARP.variants) % CRT_WARP.variants;
  return {
    u_columns: Math.max(MIN_COLUMNS, Math.round(k.columns)),
    u_levels: Math.max(MIN_LEVELS, Math.round(k.levels)),
    u_amp: k.waveAmplitude,
    u_freq: k.waveFrequency,
    u_variant: variant,
    u_decay: crtDecay(k.persistence, frame.dt, frame.reduced),
    u_rise: crtRise(reveal, frame.dt),
    u_reveal: reveal,
    u_time_base: CRT_WARP.timeBase,
  };
}

/** 上屏的 uniform, 纯函数. */
export function crtUniforms(frame: Pick<BackdropFrame, "colors">, k: Knobs): UniformMap {
  return {
    u_color: colorAt(frame.colors, 0),
    u_back: colorAt(frame.colors, 1),
    u_curvature: k.curvature,
    u_corners: Math.max(0, Math.min(1, k.corners)),
    u_scan_strength: k.scanlineStrength,
    u_scan_freq: k.scanlineFrequency,
    u_mask: modeOf(CRT_MASKS, k.mask, "aperture"),
    u_mask_strength: Math.max(0, Math.min(1, k.maskStrength)),
    u_bloom: k.bloom,
    u_bloom_radius: k.bloomRadius,
    u_shift: k.rgbShift,
    u_noise: k.noise,
    u_flicker: k.flicker,
    u_interference: k.interference,
    u_vignette: k.vignette,
    u_brightness: k.brightness,
    u_roll_on: k.clickRoll ? 1 : 0,
    u_flip: CRT_WARP.flipSeconds,
  };
}

/**
 * CRT 波场: 平面内容通道按 columns 分出宽高比 0.56 的圆角格, 四种波场变体量化成 levels 级点亮, 与上一帧余辉 (persistence ** (dt * 60)) 合成;
 * 上屏做桶形弯曲与圆角, 色移, 辉光, 栅格 / 荫罩 / 槽形三种荫罩, 扫描线, 颗粒, 闪烁, 工频干扰与暗角. 指针像磁铁一样拉偏画面并加大色移;
 * 点击让画面垂直翻滚一圈 (0.8 秒, 接缝处消隐). 入场 1.6 秒逐行预热. 减弱动效时内核只画一帧, 不留余辉.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-glyph.md
 */
export function CRTWarp(props: CRTWarpProps): JSX.Element {
  const {
    color = "primary",
    backgroundColor = "background",
    variation = 0,
    waveAmplitude = DEFAULTS.waveAmplitude,
    waveFrequency = DEFAULTS.waveFrequency,
    levels = DEFAULTS.levels,
    columns = DEFAULTS.columns,
    persistence = DEFAULTS.persistence,
    curvature = DEFAULTS.curvature,
    corners = 0,
    scanlineStrength = DEFAULTS.scanlineStrength,
    scanlineFrequency = DEFAULTS.scanlineFrequency,
    mask = "aperture",
    maskStrength = DEFAULTS.maskStrength,
    bloom = DEFAULTS.bloom,
    bloomRadius = 1,
    rgbShift = DEFAULTS.rgbShift,
    noise = DEFAULTS.noise,
    flicker = DEFAULTS.flicker,
    interference = DEFAULTS.interference,
    vignette = DEFAULTS.vignette,
    brightness = 1,
    intro = true,
    clickRoll = true,
    ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const k: Knobs = {
    variation, waveAmplitude, waveFrequency, levels, columns, persistence, curvature, corners, scanlineStrength, scanlineFrequency, mask, maskStrength,
    bloom, bloomRadius, rgbShift, noise, flicker, interference, vignette, brightness, intro, clickRoll,
  };
  const handle = useShaderBackdrop(
    {
      fragment: CRT_WARP_FRAGMENT,
      uniforms: (frame) => crtUniforms(frame, k),
      passes: [{ name: "u_content", fragment: CRT_CONTENT, scale: 1, uniforms: (frame) => crtContentUniforms(frame, k) }],
    },
    { ...options, colors: [color, backgroundColor] },
  );
  return (
    <BackdropShell handle={handle} fallback={glowFallback(backgroundColor, color)} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
