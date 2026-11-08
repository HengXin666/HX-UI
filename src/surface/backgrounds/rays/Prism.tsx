"use client";
// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 Prism 条目, 实现为 HX 自有.
// 规格把调色板烘焙成 64 格纹理, 此处在片元里对至多 8 色直接插值; resolution 乘到公共 dpr 上.

import { useRef, type JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { fallbackGradient } from "../../backdrop/kernel/fallback";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import { introProgress, paletteList, qualityDpr, radians } from "./field";
import { inertiaFollow, PRISM, PRISM_FRAGMENT, rollDecay, type PrismAnimation } from "./prism-shader";

export interface PrismProps extends BackdropCommonProps {
  /** 棱锥高度. */
  readonly height?: number;
  /** 棱锥底边宽. */
  readonly baseWidth?: number;
  /** rotate 绕竖轴自转, hover 朝向跟指针, rotate3d 三轴翻滚. */
  readonly animationType?: PrismAnimation;
  readonly glow?: number;
  /** 画面偏移 (CSS 像素). */
  readonly offset?: { readonly x?: number; readonly y?: number };
  /** 颗粒与表面扰动 0..1. */
  readonly noise?: number;
  /** 画面缩放, 越大棱锥越大. */
  readonly scale?: number;
  /** 色相偏移 (度). */
  readonly hueShift?: number;
  /** 取色频率. */
  readonly colorFrequency?: number;
  /** 调色板 (最多 8 色): token 名或 CSS 颜色; 不给时用连续光谱. */
  readonly colors?: readonly string[];
  /** 饱和度倍率. */
  readonly saturation?: number;
  /** 自身动画的时钟倍率. */
  readonly timeScale?: number;
  /** 指针牵动朝向 (hover 模式下为主, 其余模式叠加). */
  readonly interactive?: boolean;
  /** 指针牵动朝向的强度. */
  readonly hoverStrength?: number;
  /** 惯性 0..1, 越大跟得越快. */
  readonly inertia?: number;
  /** 是否播放 1.4 秒的放大淡入. */
  readonly intro?: boolean;
  /** 渲染比例 0..1. */
  readonly resolution?: number;
}

/** 指针牵动的最大偏航 / 俯仰 (弧度, 本库定, 再乘 hoverStrength). */
const HOVER_REACH = { yaw: 0.35, pitch: 0.2 } as const;

/**
 * 棱镜: 一座发光的四棱锥, 沿视线逐步累积辉光, 颜色按半径与高度循环流转. 默认绕竖轴自转,
 * 指针在场时朝向带惯性地偏向指针, 离开后横滚缓缓回正.
 */
export function Prism(props: PrismProps): JSX.Element {
  const {
    height = 3.5, baseWidth = 5.5, animationType = "rotate", glow = 1, offset, noise = 0, scale = 3.6, hueShift = 0, colorFrequency = 1, colors,
    saturation = 1.5, timeScale = 0.5, interactive = true, hoverStrength = 2, inertia = 0.05, intro = true, resolution = 0.5, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const palette = (colors ?? []).slice(0, PRISM.maxColors);
  const pose = useRef({ yaw: 0, pitch: 0, roll: 0 });

  const uniforms = (frame: BackdropFrame) => {
    const { pointer, dt, fit } = frame;
    const s = pose.current;
    const clock = frame.time * timeScale;
    const engaged = interactive && options.pointer !== false && pointer.inside;
    const follow = inertiaFollow(dt, inertia);
    const reach = animationType === "hover" ? hoverStrength : hoverStrength * 0.25;
    s.yaw += ((engaged ? (pointer.x - 0.5) * 2 * HOVER_REACH.yaw * reach : 0) - s.yaw) * follow;
    s.pitch += ((engaged ? (0.5 - pointer.y) * 2 * HOVER_REACH.pitch * reach : 0) - s.pitch) * follow;
    s.roll = engaged ? s.roll + (pointer.vx * 0.05 - s.roll) * follow : rollDecay(s.roll, dt);
    const spin = animationType === "hover" ? 0 : clock;
    const tumble = animationType === "rotate3d" ? 1 : 0;
    const progress = introProgress(frame.elapsed, PRISM.introSeconds, intro);
    return {
      u_colors: paletteList(frame.colors, PRISM.maxColors),
      u_color_count: palette.length,
      u_fade: 0,
      u_backdrop: [0, 0, 0, 0],
      u_clock: clock,
      u_glow: glow,
      u_noise: noise,
      u_scale: scale,
      u_hue: radians(hueShift) / (Math.PI * 2),
      u_freq: colorFrequency,
      u_sat: saturation,
      u_pose: [spin + s.yaw, s.pitch + 0.2 + tumble * Math.sin(clock * 0.7) * 0.6, s.roll + tumble * Math.sin(clock * 0.43 + 1) * 0.4],
      u_offset: [(offset?.x ?? 0) * fit.scale, -(offset?.y ?? 0) * fit.scale],
      u_inv_base_half: 2 / Math.max(baseWidth, 0.01),
      u_inv_height: 1 / Math.max(height, 0.01),
      u_center_shift: height * 0.5,
      u_intro: progress * progress * (3 - 2 * progress),
    };
  };

  const handle = useShaderBackdrop({ fragment: PRISM_FRAGMENT, uniforms }, { ...options, colors: palette, dpr: qualityDpr(options.dpr, resolution) });
  return (
    <BackdropShell handle={handle} fallback={fallbackGradient(palette.length > 0 ? palette : ["primary", "accent", "accent-2"])} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
