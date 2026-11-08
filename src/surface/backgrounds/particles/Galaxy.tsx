"use client";
// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Galaxy 条目, 实现为 HX 自有.

import { useRef, type JSX } from "react";
import { approach, BackdropShell, glowFallback, splitCommon, useShaderBackdrop, type BackdropCommonProps, type BackdropFrame } from "../../backdrop/kernel";
import { GALAXY, GALAXY_FRAGMENT, makeGalaxyState, stepGalaxy } from "./galaxy-shader";
import { DEG, introProgress, paletteUniform } from "./tokens";

export interface GalaxyProps extends BackdropCommonProps {
  /** 星场中心 (归一化, y 朝上), 默认 [0.5, 0.5]. */
  readonly focal?: readonly [number, number];
  /** 静态旋转, 写成方向向量 [cos, sin], 默认 [1, 0]. */
  readonly rotation?: readonly [number, number];
  /** 飞行速度 (层深推进), 默认 0.5. */
  readonly starSpeed?: number;
  /** 星格密度倍率, 默认 1. */
  readonly density?: number;
  /** 整体色相旋转 (度). 默认 0, 颜色按 starColors 的 token 原样出. */
  readonly hueShift?: number;
  /** 停住飞行与闪烁, 等同 paused. */
  readonly disableAnimation?: boolean;
  /** 星的光核强度, 默认 0.3. */
  readonly glowIntensity?: number;
  /** 饱和度增减 (-1..1), 0 保持 token 原色. */
  readonly saturation?: number;
  /** 指针推开星场, 默认 true. */
  readonly mouseRepulsion?: boolean;
  /** 指针推开的强度, 默认 2. */
  readonly repulsionStrength?: number;
  /** 闪烁强度 0..1, 默认 0.3. */
  readonly twinkleIntensity?: number;
  /** 自转角速度 (弧度 / 秒), 默认 0.1. */
  readonly rotationSpeed?: number;
  /** 从中心持续推开的强度, 默认 0. */
  readonly autoCenterRepulsion?: number;
  /** 透明底 (叠在内容背景上), 默认 true; false 时铺 background token. */
  readonly transparent?: boolean;
  /** 浅色底模式: 星画成带色相的暗点, 不做加色发光. */
  readonly lightMode?: boolean;
  /** 星的颜色 (token 名或 CSS 颜色), 最多 4 个. 默认 ["foreground", "primary", "accent"]. */
  readonly starColors?: readonly string[];
  /** 星的尺寸倍率, 默认 1. */
  readonly starSize?: number;
  /** 大星十字光芒强度, 默认 1. */
  readonly flareIntensity?: number;
  /** 视差层数 1..8, 默认 4. */
  readonly layers?: number;
  /** 飞行方向: forward 迎面 / backward 远去. */
  readonly direction?: "forward" | "backward";
  /** 点击跃迁加速. 默认 true. */
  readonly clickWarp?: boolean;
  /** 入场 2.2s 由中心向外点亮. 默认 true. */
  readonly intro?: boolean;
}

const DEFAULT_STARS = ["foreground", "primary", "accent"] as const;
const BACKGROUND_TOKEN = "background";

/**
 * 星空飞行背景: 若干视差层的星格循环推进, 每颗星是光核加十字光芒, 大星带闪烁; 指针推开星场, 点击跃迁加速并向中心收拢,
 * 入场由中心向外点亮. 减弱动效时只画一帧静止星空.
 */
export function Galaxy(props: GalaxyProps): JSX.Element {
  const {
    focal = [0.5, 0.5], rotation = [1, 0], starSpeed = 0.5, density = 1, hueShift = 0, disableAnimation = false, glowIntensity = 0.3,
    saturation = 0, mouseRepulsion = true, repulsionStrength = 2, twinkleIntensity = 0.3, rotationSpeed = 0.1, autoCenterRepulsion = 0,
    transparent = true, lightMode = false, starColors = DEFAULT_STARS, starSize = 1, flareIntensity = 1, layers = 4, direction = "forward",
    clickWarp = true, intro = true, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const state = useRef(makeGalaxyState());
  const stars = starColors.slice(0, GALAXY.maxColors);
  const speed = options.speed ?? 1;

  const uniforms = (frame: BackdropFrame) => {
    const s = state.current;
    const flight = starSpeed * GALAXY.flightRate * speed * (direction === "backward" ? -1 : 1);
    const p = frame.pointer;
    if (clickWarp && !frame.reduced) {
      for (const tap of p.taps) {
        if (tap.at <= s.seen) continue;
        s.seen = tap.at;
        s.boost = 1;
      }
    }
    stepGalaxy(s, frame.dt, flight, frame.reduced ? frame.time * flight : null);
    s.mx = frame.dt === 0 ? p.x : approach(s.mx, p.x, frame.dt, GALAXY.pointerTau);
    s.my = frame.dt === 0 ? p.y : approach(s.my, p.y, frame.dt, GALAXY.pointerTau);
    const bg = frame.colors[stars.length];
    return {
      u_layers: Math.max(1, Math.min(GALAXY.maxLayers, Math.round(layers))),
      u_density: Math.max(0.05, density),
      u_glow: glowIntensity,
      u_twinkle: twinkleIntensity,
      u_flare: flareIntensity,
      u_size: starSize,
      u_angle: Math.atan2(rotation[1], rotation[0]) + frame.time * rotationSpeed,
      u_depth: s.depth,
      u_reveal: introProgress(frame.elapsed, GALAXY.introSeconds, intro),
      u_hue: hueShift * DEG,
      u_sat: saturation,
      u_light: lightMode ? 1 : 0,
      u_opaque: transparent ? 0 : 1,
      u_repel: mouseRepulsion ? repulsionStrength : 0,
      u_auto: autoCenterRepulsion,
      u_warp: s.boost,
      u_count: Math.max(1, stars.length),
      u_focal: [focal[0], focal[1]],
      u_mouse: [s.mx, s.my, p.presence],
      u_colors: paletteUniform(frame.colors.slice(0, stars.length), GALAXY.maxColors),
      u_bg: bg ? [bg[0], bg[1], bg[2]] : [0, 0, 0],
    };
  };

  const handle = useShaderBackdrop(
    { fragment: GALAXY_FRAGMENT, uniforms },
    { ...options, paused: options.paused || disableAnimation, colors: [...stars, BACKGROUND_TOKEN] },
  );
  return (
    <BackdropShell handle={handle} fallback={glowFallback(BACKGROUND_TOKEN, stars[0] ?? "foreground")} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
