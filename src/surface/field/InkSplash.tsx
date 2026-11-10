"use client";
// 行为规格参照 docs/research/catalog/animations.md 的 SplashCursor 条目, 实现为 HX 自有.

import { useRef, type JSX } from "react";
import { BackdropShell } from "../backdrop/kernel/BackdropShell";
import type { Rgb } from "../backdrop/kernel/color";
import { splitCommon, type BackdropCommonProps } from "../backdrop/kernel/common";
import { fallbackGradient } from "../backdrop/kernel/fallback";
import type { BackdropFrame } from "../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../backdrop/kernel/use-surfaces";
import { bloomPyramid } from "../backgrounds/bloom";
import { createInkDrive, packInk, stepInk } from "./parts/ink";
import { INK_DIVERGENCE_PASS, INK_DYE_PASS, INK_PRESSURE_PASS, INK_SCENE, INK_VELOCITY_PASS, inkFragment } from "./parts/ink-shader";
import { INK, type InkQuality } from "./tokens";

export interface InkSplashProps extends BackdropCommonProps {
  /** 调色板 (token 名), rainbow 关时按时间轮换. 默认 primary, accent, accent-2. */
  readonly colors?: readonly string[];
  /** 彩虹模式: 色相随时间转, 忽略 colors. */
  readonly rainbow?: boolean;
  /** 换色速度, 默认 1. */
  readonly colorSpeed?: number;
  /** 补色量, 默认 1. */
  readonly intensity?: number;
  /** 溅点大小, 默认 1. */
  readonly size?: number;
  /** 推力, 默认 1. */
  readonly force?: number;
  /** 涡度 (打旋), 默认 3. */
  readonly swirl?: number;
  /** 染料存留, 越大拖尾越久, 默认 1. */
  readonly trail?: number;
  /** 速度存留, 越大流得越远, 默认 1. */
  readonly momentum?: number;
  /** 按浓度梯度打光 0..1, 默认 1. */
  readonly shading?: number;
  /** 泛光强度, 0 关闭, 默认 0. */
  readonly glow?: number;
  readonly quality?: InkQuality;
  /** 点击溅一朵花瓣形的墨. */
  readonly clickSplash?: boolean;
  /** 出现时画一道. */
  readonly intro?: boolean;
  /** 浅色底: 颜色压暗一点. */
  readonly lightMode?: boolean;
}

const DEFAULT_COLORS = ["primary", "accent", "accent-2"];
const GREY: Rgb = [0.5, 0.5, 0.5];

/**
 * 墨水飞溅: 指针拖过的地方打进速度与染料, 稳定流体 (平流, 涡度约束, 散度, Jacobi 压力, 投影) 把它卷开.
 * 点击溅一朵花瓣形的墨, 可选按浓度梯度打光与泛光. 宿主撑满父元素, 画布垫在 children 下面, 读屏隐藏.
 * 减弱动效时只画一帧静态墨迹.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-field.md
 */
export function InkSplash(props: InkSplashProps): JSX.Element {
  const {
    colors = DEFAULT_COLORS, rainbow = true, colorSpeed = 1, intensity = 1, size = 1, force = 1, swirl = 3, trail = 1, momentum = 1, shading = 1, glow = 0,
    quality = "high", clickSplash = true, intro = true, lightMode = false, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const drive = useRef(createInkDrive());
  const packed = useRef(packInk([]));
  const tier = INK.quality[quality] ?? INK.quality.high;
  const settings = { size, force, intensity, colorSpeed, rainbow, clickSplash, intro, simScale: tier.sim };
  const splatUniforms = () => ({ u_splat_at: { list: packed.current.at, size: 4 as const }, u_splat_paint: { list: packed.current.paint, size: 4 as const }, u_splat_meta: { list: packed.current.meta, size: 2 as const }, u_splat_count: packed.current.count });
  const dt = (frame: BackdropFrame): number => Math.min(frame.dt, INK.maxDt);
  const bloom = bloomPyramid({
    scene: INK_SCENE,
    prefix: "u_ink_bloom",
    levels: glow > 0 ? INK.bloomLevels : 0,
    sceneScale: tier.dye,
    threshold: INK.bloomThreshold,
    knee: INK.bloomKnee,
    strength: glow,
    sceneUniforms: (frame) => ({ u_shading: shading, u_static: frame.reduced, u_tint: frame.colors[0] ?? GREY }),
  });

  const handle = useShaderBackdrop(
    {
      fragment: inkFragment(bloom.compositeGlsl),
      passes: [
        {
          name: "u_vel",
          fragment: INK_VELOCITY_PASS,
          scale: tier.sim,
          uniforms: (frame) => {
            packed.current = packInk(stepInk(drive.current, frame, settings, frame.colors));
            return { u_dt: dt(frame), u_vel_diss: INK.velocityDissipation / Math.max(0.05, momentum), u_curl: swirl * INK.curlScale, ...splatUniforms() };
          },
        },
        { name: "u_div", fragment: INK_DIVERGENCE_PASS, scale: tier.sim },
        { name: "u_press", fragment: INK_PRESSURE_PASS, scale: tier.sim, iterations: tier.steps, uniforms: (_frame, i) => ({ u_keep: i === 0 ? INK.pressureKeep : 1 }) },
        {
          name: "u_dye",
          fragment: INK_DYE_PASS,
          scale: tier.dye,
          uniforms: (frame) => ({
            u_dt: dt(frame),
            u_dye_diss: 1 / Math.max(0.05, trail),
            u_sim_px: [1 / Math.max(1, frame.fit.width * tier.sim), 1 / Math.max(1, frame.fit.height * tier.sim)],
            ...splatUniforms(),
          }),
        },
        ...bloom.passes,
      ],
      uniforms: () => ({ ...bloom.uniforms, u_light: lightMode }),
    },
    { ...options, colors },
  );

  return (
    <BackdropShell handle={handle} fallback={fallbackGradient(colors)} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
