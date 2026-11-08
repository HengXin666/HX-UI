"use client";
// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 Scanner 条目, 实现为 HX 自有.

import type { JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { fallbackGradient } from "../../backdrop/kernel/fallback";
import type { UniformMap } from "../../backdrop/kernel/gl";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import { colorAt, introProgress, modeOf } from "./kit";
import { SCAN_DIRECTIONS, SCANNER, SCANNER_FRAGMENT, type ScanDirection } from "./scanner-shader";

export interface ScannerProps extends BackdropCommonProps {
  /** 条纹暗部色 (token 名或 CSS 颜色), 默认 primary. */
  readonly color1?: string;
  /** 条纹亮部色, 默认 accent. */
  readonly color2?: string;
  /** 扫描线前沿高光色, 默认 foreground. */
  readonly color3?: string;
  /** 底色, 默认 background. */
  readonly backgroundColor?: string;
  /** 扫描速度 (每秒行程比例), 默认 0.25. */
  readonly sweepSpeed?: number;
  /** 扫描前沿宽度, 默认 1.6. */
  readonly sweepWidth?: number;
  /** 扫过后余亮长度, 默认 0.5. */
  readonly trail?: number;
  /** 反向扫描, 默认 false. */
  readonly reverse?: boolean;
  /** 波形缩放, 默认 1.5. */
  readonly scale?: number;
  /** 波形频率, 默认 2. */
  readonly frequency?: number;
  /** 波形起伏幅度, 默认 0.22. */
  readonly ripple?: number;
  /** 条纹密度 (短边内条数), 默认 11. */
  readonly bandDensity?: number;
  /** 线宽 (设备像素倍率), 默认 1.2. */
  readonly lineWidth?: number;
  /** 线条辉光, 默认 0.6. */
  readonly glow?: number;
  /** 扫描方向, 默认 vertical (竖线横扫). */
  readonly scanDirection?: ScanDirection;
  /** 色彩沿条纹的铺展, 默认 0.7. */
  readonly colorSpread?: number;
  /** 亮度, 默认 1. */
  readonly brightness?: number;
  /** 暗角, 默认 0.3. */
  readonly vignette?: number;
  /** 显示扫描线, 默认 true. */
  readonly scanline?: boolean;
  /** 扫描线强度, 默认 0.5. */
  readonly scanlineIntensity?: number;
  /** 显示颗粒, 默认 true. */
  readonly grain?: boolean;
  /** 颗粒强度, 默认 0.04. */
  readonly grainIntensity?: number;
  /** 入场: 由扫描起点一侧展开, 默认 true. */
  readonly intro?: boolean;
}

const DEFAULTS = {
  sweepSpeed: 0.25, sweepWidth: 1.6, trail: 0.5, scale: 1.5, frequency: 2, ripple: 0.22, bandDensity: 11, lineWidth: 1.2, glow: 0.6, colorSpread: 0.7,
  vignette: 0.3, scanlineIntensity: 0.5, grainIntensity: 0.04,
} as const;
/** 条纹至少 1 条. */
const MIN_BANDS = 1;

type Knobs = Required<Omit<ScannerProps, keyof BackdropCommonProps | "color1" | "color2" | "color3" | "backgroundColor">>;

/** 本件的 uniform, 纯函数, 单测覆盖. */
export function scannerUniforms(frame: Pick<BackdropFrame, "colors" | "elapsed">, k: Knobs): UniformMap {
  return {
    u_c1: colorAt(frame.colors, 0),
    u_c2: colorAt(frame.colors, 1),
    u_c3: colorAt(frame.colors, 2),
    u_back: colorAt(frame.colors, 3),
    u_sweep_speed: k.sweepSpeed,
    u_sweep_width: k.sweepWidth,
    u_trail: Math.max(0, k.trail),
    u_reverse: k.reverse ? 1 : 0,
    u_scale: k.scale,
    u_freq: k.frequency,
    u_ripple: k.ripple,
    u_bands: Math.max(MIN_BANDS, k.bandDensity),
    u_line: Math.max(0, k.lineWidth),
    u_glow: k.glow,
    u_dir: modeOf(SCAN_DIRECTIONS, k.scanDirection, "vertical"),
    u_spread: k.colorSpread,
    u_brightness: k.brightness,
    u_vignette: k.vignette,
    u_scanline: k.scanline ? k.scanlineIntensity : 0,
    u_grain: k.grain ? k.grainIntensity : 0,
    u_ping_life: SCANNER.pingSeconds,
    u_intro: introProgress(frame.elapsed, SCANNER.introSeconds, k.intro),
    u_time_base: SCANNER.timeBase,
  };
}

/**
 * 扫描仪: 正弦加梯度噪声起伏的等距条纹 (每条亮度 0.62 + 0.38 * 哈希, 过密时淡成平均灰), 一道扫描线沿所选方向循环扫过,
 * 前沿用 color3 高光, 扫过处按 trail 指数余亮, 余亮从 color1 过渡到 color2. 指针附近条纹鼓起并增亮; 点击发出回波环
 * (最多 6 个, 环宽 0.12 + 0.1 * age, 亮度 exp(-0.9 * age)). 带扫描线, 颗粒与暗角. 入场 2 秒由扫描起点一侧展开. 减弱动效时内核只画一帧.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-glyph.md
 */
export function Scanner(props: ScannerProps): JSX.Element {
  const {
    color1 = "primary",
    color2 = "accent",
    color3 = "foreground",
    backgroundColor = "background",
    sweepSpeed = DEFAULTS.sweepSpeed,
    sweepWidth = DEFAULTS.sweepWidth,
    trail = DEFAULTS.trail,
    reverse = false,
    scale = DEFAULTS.scale,
    frequency = DEFAULTS.frequency,
    ripple = DEFAULTS.ripple,
    bandDensity = DEFAULTS.bandDensity,
    lineWidth = DEFAULTS.lineWidth,
    glow = DEFAULTS.glow,
    scanDirection = "vertical",
    colorSpread = DEFAULTS.colorSpread,
    brightness = 1,
    vignette = DEFAULTS.vignette,
    scanline = true,
    scanlineIntensity = DEFAULTS.scanlineIntensity,
    grain = true,
    grainIntensity = DEFAULTS.grainIntensity,
    intro = true,
    ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const k: Knobs = {
    sweepSpeed, sweepWidth, trail, reverse, scale, frequency, ripple, bandDensity, lineWidth, glow, scanDirection, colorSpread, brightness, vignette,
    scanline, scanlineIntensity, grain, grainIntensity, intro,
  };
  const handle = useShaderBackdrop(
    { fragment: SCANNER_FRAGMENT, uniforms: (frame) => scannerUniforms(frame, k) },
    { ...options, colors: [color1, color2, color3, backgroundColor] },
  );
  return (
    <BackdropShell handle={handle} fallback={fallbackGradient([backgroundColor, color1, backgroundColor])} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
