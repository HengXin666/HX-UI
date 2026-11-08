"use client";
// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Dither 条目, 实现为 HX 自有.

import type { JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { fallbackGradient } from "../../backdrop/kernel/fallback";
import type { UniformMap } from "../../backdrop/kernel/gl";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import { DITHER, DITHER_EFFECTS, DITHER_FRAGMENT, DITHER_MODES, DITHER_TRAIL, ditherDecay, type DitherEffect, type DitherMode } from "./dither-shader";
import { colorList, introProgress, modeOf } from "./kit";

export interface DitherProps extends BackdropCommonProps {
  /** 波场速度, 默认 0.05. */
  readonly waveSpeed?: number;
  /** 波场频率, 默认 3. */
  readonly waveFrequency?: number;
  /** 波场扭曲幅度, 默认 0.3. */
  readonly waveAmplitude?: number;
  /** 亮部颜色 (token 名或 CSS 颜色), 默认 primary. */
  readonly waveColor?: string;
  /** 暗部颜色, 默认 background. */
  readonly backgroundColor?: string;
  /** 量化级数, 默认 4. 给了 palette 时取调色板长度. */
  readonly colorNum?: number;
  /** 抖动格边长 (CSS 像素), 默认 2. */
  readonly pixelSize?: number;
  /** 停在当前画面. */
  readonly disableAnimation?: boolean;
  /** 指针影响半径倍率, 默认 1. */
  readonly mouseRadius?: number;
  /** 抖动矩阵, 默认 bayer (8x8). */
  readonly ditherMode?: DitherMode;
  /** 自定义调色板 (2 到 8 个颜色), 按亮度从暗到亮. */
  readonly palette?: readonly string[];
  /** 波场缩放, 默认 1. */
  readonly scale?: number;
  /** 对比度, 默认 1. */
  readonly contrast?: number;
  /** 亮度偏移 -1..1, 默认 0. */
  readonly brightness?: number;
  /** 指针效果, 默认 erase. */
  readonly mouseEffect?: DitherEffect;
  /** 指针效果强度, 默认 1. */
  readonly mouseStrength?: number;
  /** 拖尾长度 0..1, 默认 0.5. */
  readonly trail?: number;
  /** 点击出涟漪, 默认 true. */
  readonly clickRipple?: boolean;
  /** 由中心向外显影的入场, 默认 true. */
  readonly intro?: boolean;
}

/** 量化至少两级 (纯明暗). */
const MIN_LEVELS = 2;
const DEFAULTS = { waveSpeed: 0.05, waveFrequency: 3, waveAmplitude: 0.3, colorNum: 4, pixelSize: 2, trail: 0.5 } as const;

/** 本件的 uniform, 纯函数, 单测覆盖. */
export function ditherUniforms(frame: Pick<BackdropFrame, "colors" | "elapsed">, p: Required<Pick<DitherProps, "waveSpeed" | "waveFrequency" | "waveAmplitude" | "colorNum" | "pixelSize" | "mouseRadius" | "ditherMode" | "scale" | "contrast" | "brightness" | "mouseEffect" | "mouseStrength" | "clickRipple" | "intro">> & { readonly paletteSize: number }): UniformMap {
  const count = Math.min(DITHER.maxPalette, Math.max(MIN_LEVELS, p.paletteSize));
  return {
    u_palette: colorList(frame.colors, DITHER.maxPalette),
    u_palette_count: count,
    u_levels: p.paletteSize > MIN_LEVELS ? count : Math.max(MIN_LEVELS, Math.round(p.colorNum)),
    u_pixel: Math.max(1, p.pixelSize),
    u_wave_speed: p.waveSpeed,
    u_wave_freq: p.waveFrequency,
    u_wave_amp: p.waveAmplitude,
    u_scale: p.scale,
    u_contrast: p.contrast,
    u_brightness: p.brightness,
    u_mode: modeOf(DITHER_MODES, p.ditherMode, "bayer"),
    u_effect: modeOf(DITHER_EFFECTS, p.mouseEffect, "erase"),
    u_strength: p.mouseStrength,
    u_reach: DITHER.reachPerRadius * p.mouseRadius,
    u_ripple_on: p.clickRipple ? 1 : 0,
    u_ripple_life: DITHER.rippleSeconds,
    u_intro: introProgress(frame.elapsed, DITHER.introSeconds, p.intro),
  };
}

/**
 * 抖动波场: 分形噪声扭出的缓慢波面, 按 pixelSize 分格后用 Bayer / 网点 / 线条 / 交叉线 / 噪声矩阵量化成 colorNum 级,
 * 在 backgroundColor 与 waveColor (或 palette) 之间取色. 指针在低分辨率拖尾通道里留痕, 按 mouseEffect 擦除, 显影或起涟漪;
 * 点击发出圆环涟漪 (1.6 秒). 入场由中心向外显影 1.8 秒. 减弱动效时内核只画一帧, 入场视为已完成.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-glyph.md
 */
export function Dither(props: DitherProps): JSX.Element {
  const {
    waveSpeed = DEFAULTS.waveSpeed,
    waveFrequency = DEFAULTS.waveFrequency,
    waveAmplitude = DEFAULTS.waveAmplitude,
    waveColor = "primary",
    backgroundColor = "background",
    colorNum = DEFAULTS.colorNum,
    pixelSize = DEFAULTS.pixelSize,
    disableAnimation = false,
    mouseRadius = 1,
    ditherMode = "bayer",
    palette,
    scale = 1,
    contrast = 1,
    brightness = 0,
    mouseEffect = "erase",
    mouseStrength = 1,
    trail = DEFAULTS.trail,
    clickRipple = true,
    intro = true,
    ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const colors = palette && palette.length >= MIN_LEVELS ? palette.slice(0, DITHER.maxPalette) : [backgroundColor, waveColor];
  const knobs = { waveSpeed, waveFrequency, waveAmplitude, colorNum, pixelSize, mouseRadius, ditherMode, scale, contrast, brightness, mouseEffect, mouseStrength, clickRipple, intro, paletteSize: colors.length };
  const handle = useShaderBackdrop(
    {
      fragment: DITHER_FRAGMENT,
      uniforms: (frame) => ditherUniforms(frame, knobs),
      passes: [
        {
          name: "u_trail",
          fragment: DITHER_TRAIL,
          scale: DITHER.trailScale,
          uniforms: (frame) => ({ u_decay: ditherDecay(frame.dt, trail), u_reach: DITHER.reachPerRadius * mouseRadius }),
        },
      ],
    },
    { ...options, colors, paused: options.paused === true || disableAnimation },
  );
  return (
    <BackdropShell handle={handle} fallback={fallbackGradient(colors)} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
