"use client";
// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 SideRays 条目, 实现为 HX 自有.

import { useRef, type JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { fallbackGradient } from "../../backdrop/kernel/fallback";
import { clamp } from "../../backdrop/kernel/math";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import { budgetEdge, followStep, introProgress, radians, RAY_ORIGINS, rgbAt, type RayOrigin } from "./field";
import { SIDE_RAYS, SIDE_RAYS_FRAGMENT, springStep } from "./side-rays-shader";

export interface SideRaysProps extends BackdropCommonProps {
  /** 第一种光色: token 名或 CSS 颜色. */
  readonly rayColor1?: string;
  /** 第二种光色. */
  readonly rayColor2?: string;
  /** 第二种光色的占比 0..1. */
  readonly blend?: number;
  /** 光源方位. */
  readonly origin?: RayOrigin;
  readonly intensity?: number;
  /** 扇面张角 (弧度量级). */
  readonly spread?: number;
  /** 光束密度. */
  readonly density?: number;
  /** 束边锐度 0..1. */
  readonly sharpness?: number;
  /** 扇面整体偏转 (度). */
  readonly tilt?: number;
  /** 距离衰减指数, 1 / (1 + (r / 0.4)^falloff). */
  readonly falloff?: number;
  /** 源头辉光. */
  readonly glow?: number;
  readonly saturation?: number;
  /** 浮尘量 0..1. */
  readonly dust?: number;
  /** 扇面朝向与聚光跟随指针. */
  readonly followMouse?: boolean;
  /** 跟随指针的比例 0..1. */
  readonly mouseInfluence?: number;
  /** 是否播放 1.6 秒的揭开. */
  readonly intro?: boolean;
}

/** 规格的默认时钟倍率 (speed = 2.5) 落在公共 speed 上. */
const DEFAULT_SPEED = 2.5;
/** 聚光宽度占张角的比例, 聚光峰值相对 mouseInfluence 的倍数 (本库定). */
const FOCUS = { width: 0.25, gain: 2 } as const;

/** 光源指向画面中心的角度 (弧度, 屏幕比例下). */
export function baseAngle(origin: readonly [number, number], aspect: number): number {
  return Math.atan2(0.5 - origin[1], (0.5 - origin[0]) * aspect);
}

/** 角度差折回 -PI..PI. */
export function wrapAngle(a: number): number {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

/**
 * 侧光: 从画面一角或一边斜射进来的双色扇形光束, 两层值噪声成束, 越远越淡. 指针在场时扇面朝向由临界阻尼弹簧
 * (刚度 18) 拉过去, 指针方向另有一道聚光加亮; 可撒一层闪烁的浮尘.
 */
export function SideRays(props: SideRaysProps): JSX.Element {
  const {
    rayColor1 = "primary", rayColor2 = "foreground", blend = 0.6, origin = "top-right", intensity = 2, spread = 2, density = 5,
    sharpness = 0.5, tilt = 0, falloff = 1.6, glow = 1, saturation = 1, dust = 0, followMouse = true, mouseInfluence = 0.5, intro = true,
    speed = DEFAULT_SPEED, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon({ ...common, speed });
  const state = useRef({ aim: 0, velocity: 0, focus: 0, strength: 0 });

  const uniforms = (frame: BackdropFrame) => {
    const { pointer, dt, fit } = frame;
    const s = state.current;
    const source = RAY_ORIGINS[origin] ?? RAY_ORIGINS["top-right"];
    const aspect = fit.width / Math.max(1, fit.height);
    const base = baseAngle(source, aspect) + radians(tilt);
    const tracking = followMouse && pointer.inside;
    const pointed = wrapAngle(Math.atan2(pointer.y - source[1], (pointer.x - source[0]) * aspect) - base);
    const target = tracking ? pointed * mouseInfluence : 0;
    [s.aim, s.velocity] = dt > 0 ? springStep(s.aim, s.velocity, target, dt) : [target, 0];
    const limit = spread * SIDE_RAYS.focusReach;
    if (tracking) s.focus = followStep(s.focus, clamp(pointed - s.aim, -limit, limit), dt, SIDE_RAYS.focusRate);
    s.strength = followStep(s.strength, tracking ? 1 : 0, dt, SIDE_RAYS.focusRate);
    return {
      u_color_a: rgbAt(frame.colors, 0),
      u_color_b: rgbAt(frame.colors, 1),
      u_origin: source,
      u_base: base + s.aim,
      u_blend: blend,
      u_intensity: intensity,
      u_spread: spread,
      u_density: density,
      u_sharp: sharpness,
      u_falloff: falloff,
      u_glow: glow,
      u_sat: saturation,
      u_dust: dust,
      u_focus: [s.focus, spread * FOCUS.width, s.strength * mouseInfluence * FOCUS.gain],
      u_reveal: introProgress(frame.elapsed, SIDE_RAYS.revealSeconds, intro),
    };
  };

  const handle = useShaderBackdrop(
    { fragment: SIDE_RAYS_FRAGMENT, uniforms },
    { ...options, colors: [rayColor1, rayColor2], maxEdge: budgetEdge(SIDE_RAYS.pixelBudget) },
  );
  return (
    <BackdropShell handle={handle} fallback={fallbackGradient(["background", rayColor1, rayColor2])} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
