"use client";
// 行为规格参照 docs/research/catalog/animations.md 的 LaserFlow 条目, 实现为 HX 自有.

import { useEffect, useRef, useState, type JSX } from "react";
import { BackdropShell } from "../backdrop/kernel/BackdropShell";
import type { Rgb } from "../backdrop/kernel/color";
import { splitCommon, type BackdropCommonProps } from "../backdrop/kernel/common";
import { fallbackGradient } from "../backdrop/kernel/fallback";
import type { BackdropFrame } from "../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../backdrop/kernel/use-surfaces";
import { beamIntro, makeBeam, stepBeam } from "./parts/beam";
import { BEAM_FRAGMENT } from "./parts/beam-shader";
import { BEAM } from "./tokens";

export interface BeamFlowProps extends BackdropCommonProps {
  /** 光柱横向位置 (宿主宽的比例), 默认 0.6. */
  readonly beamPosition?: number;
  /** 落点高度 (宿主高的比例, 从顶部量), 默认 0.78. */
  readonly surfaceLevel?: number;
  /** 三色调色板 (token 名): 光柱上段, 中段与落点, 下段与地面. 默认 primary, accent, accent-2. */
  readonly colors?: readonly string[];
  readonly intensity?: number;
  readonly beamWidth?: number;
  /** 落点光晕大小. */
  readonly flare?: number;
  /** 地面铺展宽度. */
  readonly spread?: number;
  /** 地面下方溢光. */
  readonly spill?: number;
  readonly fog?: number;
  /** 上浮尘点密度. */
  readonly dust?: number;
  /** 光柱纹路强度. */
  readonly streaks?: number;
  /** 地面上向外跑的光点. */
  readonly dots?: number;
  /** 呼吸强度. */
  readonly pulse?: number;
  /** 噪声种子. */
  readonly seed?: number;
  /** 指针处揭开的图片地址. */
  readonly revealImage?: string;
  /** 揭图半径 (CSS 像素), 默认 220. */
  readonly revealRadius?: number;
  readonly revealOpacity?: number;
  /** 光柱先落下再铺开. */
  readonly intro?: boolean;
  readonly lightMode?: boolean;
}

const DEFAULT_COLORS = ["primary", "accent", "accent-2"];
const GREY: Rgb = [0.5, 0.5, 0.5];

/**
 * 光束流: 一道竖直光柱从顶部落到地面线, 落点炸开光晕, 光沿地面向两侧铺开; 光柱上有流动的纹, 周围有雾与上浮的尘点,
 * 指针左右带着光柱轻轻横移, 可选在指针处揭开一张图. 宿主撑满父元素, 画布垫在 children 下面, 读屏隐藏.
 * 减弱动效时只画一帧 (入场已完成).
 *
 * 规格的 speed 与公共时钟倍率同义, 默认这里也是 1.5.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-field.md
 */
export function BeamFlow(props: BeamFlowProps): JSX.Element {
  const {
    beamPosition = BEAM.beamPosition, surfaceLevel = BEAM.surfaceLevel, colors = DEFAULT_COLORS, intensity = BEAM.intensity, beamWidth = BEAM.beamWidth, flare = BEAM.flare,
    spread = BEAM.spread, spill = BEAM.spill, fog = BEAM.fog, dust = BEAM.dust, streaks = BEAM.streaks, dots = BEAM.dots, pulse = BEAM.pulse, seed = BEAM.seed,
    revealImage, revealRadius = BEAM.revealRadius, revealOpacity = BEAM.revealOpacity, intro = true, lightMode = false, speed = BEAM.speed, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon({ ...common, speed });
  const state = useRef(makeBeam(intro));
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const palette = [0, 1, 2].map((i) => colors[i] ?? colors[colors.length - 1] ?? DEFAULT_COLORS[i]);

  useEffect(() => {
    if (!revealImage) {
      setImage(null);
      return undefined;
    }
    let live = true;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (live) setImage(img);
    };
    img.src = revealImage;
    return () => {
      live = false;
    };
  }, [revealImage]);

  const uniforms = (frame: BackdropFrame) => {
    const { width, height, scale } = frame.fit;
    const reduced = frame.reduced;
    const x = stepBeam(state.current, reduced ? 0 : frame.dt, beamPosition, frame.pointer, options.pointer !== false);
    const phase = reduced ? { drop: 1, flow: 1 } : beamIntro(state.current.age);
    const list = new Float32Array(9);
    palette.forEach((_c, i) => list.set(frame.colors[i] ?? GREY, i * 3));
    return {
      u_beam: [(x * width) / scale, (surfaceLevel * height) / scale, beamWidth, flare] as const,
      u_shape: [spread, spill, fog, dust] as const,
      u_extra: [pulse, streaks, dots, intensity] as const,
      u_intro: [phase.drop, phase.flow] as const,
      u_colors: { list, size: 3 as const },
      u_seed: seed,
      u_light: lightMode,
      u_reveal: [revealRadius, revealOpacity, image ? frame.pointer.presence : 0] as const,
    };
  };

  const handle = useShaderBackdrop({ fragment: BEAM_FRAGMENT, uniforms, textures: () => ({ u_image: image }) }, { ...options, colors: palette });
  return (
    <BackdropShell handle={handle} fallback={fallbackGradient(palette)} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
