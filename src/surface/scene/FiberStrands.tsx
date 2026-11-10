"use client";
// 行为规格参照 docs/research/catalog/animations.md 的 Strands 条目, 实现为 HX 自有.

import { useRef, type JSX } from "react";
import { BackdropShell } from "../backdrop/kernel/BackdropShell";
import type { Rgb } from "../backdrop/kernel/color";
import { splitCommon, type BackdropCommonProps } from "../backdrop/kernel/common";
import { glowFallback } from "../backdrop/kernel/fallback";
import type { BackdropFrame } from "../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../backdrop/kernel/use-surfaces";
import { makeStrands, stepStrands, strandEnergy, strandIntro, strandPulse } from "./parts/strand";
import { STRAND_FRAGMENT } from "./parts/strand-shader";
import { STRAND } from "./tokens";

export interface FiberStrandsProps extends BackdropCommonProps {
  /** 丝带颜色 (token 名), 最多 8 个, 按根循环; 默认 primary / accent / foreground. */
  readonly colors?: readonly string[];
  /** 丝带根数, 默认 3, 上限 8. */
  readonly count?: number;
  readonly amplitude?: number;
  readonly waviness?: number;
  readonly thickness?: number;
  readonly glow?: number;
  /** 两端收细的程度, 默认 1. */
  readonly taper?: number;
  /** 根与根的竖向间距倍率, 默认 1. */
  readonly spread?: number;
  /** 色相旋转 (度). */
  readonly hueShift?: number;
  readonly intensity?: number;
  readonly saturation?: number;
  readonly scale?: number;
  /** 中央玻璃球, 默认 true. */
  readonly glass?: boolean;
  readonly refraction?: number;
  readonly dispersion?: number;
  readonly glassSize?: number;
  readonly rim?: number;
  /** 起伏能量 0..1, 默认 0.65. */
  readonly energy?: number;
  /** 外部电平 0..1 (如音量), 叠加到能量上. */
  readonly level?: number;
  /** 指针让丝带偏弯, 默认 true. */
  readonly interactive?: boolean;
  /** 点击让丝带猛摆一下, 默认 true. */
  readonly clickPulse?: boolean;
  /** 浅色底: 不加白芯, 玻璃球下方加一圈浅影. */
  readonly lightMode?: boolean;
}

const DEFAULT_COLORS = ["primary", "accent", "foreground"] as const;
const GREY: Rgb = [0.5, 0.5, 0.5];

/**
 * 发光丝带: 几根横贯宿主的丝带缓缓摆动, 叠加处发白; 可选中央玻璃球折射并色散穿过它的丝带. 指针让丝带朝它偏弯, 点击猛摆一下.
 * 宿主撑满父元素, 画布垫在 children 下面. 减弱动效时只画一帧.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-scene.md
 */
export function FiberStrands(props: FiberStrandsProps): JSX.Element {
  const {
    colors = DEFAULT_COLORS, count = STRAND.count, amplitude = 1, waviness = 1, thickness = 1, glow = 1, taper = 1, spread = 1, hueShift = 0, intensity = 1,
    saturation = 1, scale = 1, glass = true, refraction = 1, dispersion = 1, glassSize = 1, rim = 1, energy = STRAND.energy, level, interactive = true,
    clickPulse = true, lightMode = false, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const sim = useRef(makeStrands());
  const palette = (colors.length > 0 ? colors : DEFAULT_COLORS).slice(0, STRAND.maxColors);
  const coreToken = lightMode ? "background" : "foreground";

  const uniforms = (frame: BackdropFrame) => {
    const { width, height } = frame.fit;
    const short = Math.max(1, Math.min(width, height));
    const p = frame.pointer;
    const at = interactive && p.inside ? { x: (((p.x - 0.5) * width) / short) / scale, y: (((p.y - 0.5) * height) / short) / scale } : null;
    if (!frame.reduced) stepStrands(sim.current, frame.dt, at);
    const list = new Float32Array(STRAND.maxColors * 3);
    palette.forEach((_, i) => list.set(frame.colors[i] ?? GREY, i * 3));
    return {
      u_colors: { list, size: 3 as const },
      u_color_count: palette.length,
      u_count: Math.max(1, Math.min(STRAND.maxColors, Math.round(count))),
      u_amplitude: amplitude,
      u_waviness: waviness,
      u_thickness: thickness,
      u_glow: glow,
      u_taper: taper,
      u_spread: spread,
      u_hue: (hueShift * Math.PI) / 180,
      u_intensity: intensity,
      u_saturation: saturation,
      u_opacity: 1,
      u_scale: scale,
      u_glass: glass,
      u_refraction: refraction,
      u_dispersion: dispersion,
      u_glass_r: STRAND.glassRadius * glassSize,
      u_rim: rim,
      u_energy: strandEnergy(energy, level),
      u_pulse: clickPulse && !frame.reduced ? strandPulse(p.taps, frame.elapsed) : 1,
      u_lean: [sim.current.lx, sim.current.ly] as const,
      u_intro: frame.reduced ? 1 : strandIntro(frame.elapsed),
      u_light: lightMode,
      u_core: frame.colors[palette.length] ?? GREY,
    };
  };

  const handle = useShaderBackdrop({ fragment: STRAND_FRAGMENT, uniforms }, { ...options, colors: [...palette, coreToken] });
  return (
    <BackdropShell handle={handle} fallback={glowFallback("background", palette[0] ?? "primary")} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
