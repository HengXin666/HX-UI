"use client";
// 行为规格参照 docs/research/catalog/animations.md 的 CrystalizedBall 条目, 实现为 HX 自有.
// ENGINE-GAP (仍做不了, 需内核实例化 / 顶点取样状态纹理): 规格的尘埃是 STATE_WIDTH 256 的 GPGPU 状态纹理驱动的实例化粒子 (MAX_PARTICLES 40000), 带逐颗物理与深度;
// 这里在片元里按格画三层程序化光点 (视差近似深度, 无逐颗物理, 指针推不动尘埃).
// 不标 ENGINE-GAP 的替代: PIXEL_BUDGET 4.5e6 由内核 dpr 上限 2 与 maxEdge 代替 (分辨率预算, 不涉顶点 / 实例化 / 深度, 2026-11-10 复核定).

import { useRef, type JSX } from "react";
import { BackdropShell } from "../backdrop/kernel/BackdropShell";
import type { Rgb } from "../backdrop/kernel/color";
import { splitCommon, type BackdropCommonProps } from "../backdrop/kernel/common";
import { glowFallback } from "../backdrop/kernel/fallback";
import type { BackdropFrame } from "../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../backdrop/kernel/use-surfaces";
import { makePrism, packPrism, prismEnergy, prismLook, stepPrism, type PrismLook, type PrismPreset } from "./parts/prism";
import { PRISM_FRAGMENT } from "./parts/prism-shader";
import { PRISM } from "./tokens";

export interface PrismOrbProps extends BackdropCommonProps, Partial<PrismLook> {
  /** 一组打底的外观, 默认 plasma; 显式给的单项 props 覆盖它. */
  readonly preset?: PrismPreset;
  /** 电弧与辉光的颜色 (token 名), 默认 primary. */
  readonly color?: string;
  /** 玻璃体的颜色 (token 名), 默认 background. */
  readonly bodyColor?: string;
  /** 浅色底: 外晕收一点, 球内稍压暗 (对应规格 theme="light"). */
  readonly lightMode?: boolean;
  /** 球的直径占宿主短边的比例, 默认 0.7. */
  readonly size?: number;
  /** 指针靠近时拉弯最近的电弧, 默认 true. */
  readonly interactive?: boolean;
  readonly hoverStrength?: number;
  /** 挂载时电弧由中心长出, 尘埃逐颗亮起, 默认 true. */
  readonly intro?: boolean;
}

const GREY: Rgb = [0.5, 0.5, 0.5];

/**
 * 等离子球: 宿主中心一颗玻璃球, 球内电弧从中心伸到球壁并缓缓游走, 支弧闪烁, 落点有耀斑, 三层尘埃按 motion 飘动.
 * 指针靠近时最近的一根电弧被拉向指针. 宿主撑满父元素, 画布垫在 children 下面. 减弱动效时只画一帧.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-scene.md
 */
export function PrismOrb(props: PrismOrbProps): JSX.Element {
  const {
    preset = "plasma", color = "primary", bodyColor = "background", lightMode = false, size = PRISM.size, interactive = true, hoverStrength = PRISM.hoverStrength, intro = true,
    strands, crackle, flares, glow, sparks, particleCount, fill, motion, particleShape, depth, sway, twinkle, haze, dustSpeed, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const look = prismLook(preset, { strands, crackle, flares, glow, sparks, particleCount, fill, motion, particleShape, depth, sway, twinkle, haze, dustSpeed });
  const sim = useRef(makePrism());

  const uniforms = (frame: BackdropFrame) => {
    const { width, height } = frame.fit;
    const radius = Math.max(1, size * 0.5 * Math.min(width, height));
    const p = frame.pointer;
    const near = interactive && !frame.reduced ? { dx: ((p.x - 0.5) * width) / radius, dy: ((p.y - 0.5) * height) / radius, inside: p.inside } : null;
    stepPrism(sim.current, frame.dt, near);
    const settled = frame.reduced || !intro;
    const packed = packPrism(sim.current, look, frame.time, settled ? PRISM.settleSeconds : frame.elapsed, !settled, hoverStrength);
    const perLayer = look.particleCount / PRISM.dustLayers;
    return {
      u_strands: { list: packed.strands, size: 4 as const },
      u_arcs: { list: packed.arcs, size: 4 as const },
      u_size: size,
      u_color: frame.colors[0] ?? GREY,
      u_body: frame.colors[1] ?? GREY,
      u_light: lightMode ? 1 : 0,
      u_energy: settled ? 1 : prismEnergy(frame.elapsed),
      u_reveal: settled ? 2 : (frame.elapsed / PRISM.introSeconds) * 1.2,
      u_crackle: look.crackle,
      u_flares: look.flares,
      u_glow: look.glow,
      u_sparks: look.sparks,
      u_density: Math.sqrt(perLayer / Math.PI),
      u_fill: look.fill,
      u_motion: PRISM.motions[look.motion] ?? 0,
      u_square: look.particleShape === "square" ? 1 : 0,
      u_depth: look.depth,
      u_sway: look.sway,
      u_twinkle: look.twinkle,
      u_haze: look.haze,
      u_dust_time: frame.time * look.dustSpeed,
    };
  };

  const handle = useShaderBackdrop({ fragment: PRISM_FRAGMENT, uniforms }, { ...options, colors: [color, bodyColor], pointer: interactive && options.pointer });
  return (
    <BackdropShell handle={handle} fallback={glowFallback(bodyColor, color)} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
