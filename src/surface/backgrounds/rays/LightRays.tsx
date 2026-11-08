"use client";
// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 LightRays 条目, 实现为 HX 自有.

import { useRef, type JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { glowFallback } from "../../backdrop/kernel/fallback";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import { budgetEdge, followStep, introProgress, radians, RAY_ORIGINS, rgbAt, type RayOrigin } from "./field";
import { LIGHT_RAYS, LIGHT_RAYS_FRAGMENT } from "./light-rays-shader";

export interface LightRaysProps extends BackdropCommonProps {
  /** 光源方位. */
  readonly raysOrigin?: RayOrigin;
  /** 光色: token 名或 CSS 颜色. */
  readonly raysColor?: string;
  /** 光束飘动速度倍率. */
  readonly raysSpeed?: number;
  /** 张角 0..1. */
  readonly lightSpread?: number;
  /** 光束长度 (短边为 1). */
  readonly rayLength?: number;
  /** 束的密度. */
  readonly rayDensity?: number;
  /** 光束整体偏转 (度). */
  readonly tilt?: number;
  /** 束边锐度 0..1. */
  readonly raySharpness?: number;
  /** 源头辉光. */
  readonly glow?: number;
  /** 雾气量 0..1. */
  readonly haze?: number;
  /** 雾气浓度倍率. */
  readonly atmosphere?: number;
  readonly intensity?: number;
  /** 打开后亮度随时间轻微起伏. */
  readonly pulsating?: boolean;
  /** 衰减距离倍率, 乘到 rayLength 上. */
  readonly fadeDistance?: number;
  readonly saturation?: number;
  /** 光束朝向跟随指针. */
  readonly followMouse?: boolean;
  /** 跟随指针的比例 0..1. */
  readonly mouseInfluence?: number;
  /** 指针在光里投下影子. */
  readonly cursorShadow?: boolean;
  /** 点击时从源头放一圈外扩脉冲. */
  readonly clickPulse?: boolean;
  /** 颗粒 0..1. */
  readonly noiseAmount?: number;
  /** 光束扭曲 0..1. */
  readonly distortion?: number;
  /** 是否播放 1.8 秒的开场. */
  readonly intro?: boolean;
}

/** 由光源与目标点 (归一化) 求屏幕比例下的单位方向. */
export function aimToward(from: readonly [number, number], to: readonly [number, number], aspect: number): [number, number] {
  const dx = (to[0] - from[0]) * aspect;
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy) || 1;
  return [dx / len, dy / len];
}

/** 方向向量旋转 deg 度. */
export function turn(v: readonly [number, number], deg: number): [number, number] {
  const a = radians(deg);
  return [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
}

/**
 * 体积光: 从画面一角或一边射入的光束, 角向噪声成束, 源头辉光与漂动雾气. 光束朝向可跟指针 (时间常数 0.2s),
 * 指针在光里投下影子, 点击时从源头放一圈外扩脉冲 (读内核点击队列, 最多 4 个).
 */
export function LightRays(props: LightRaysProps): JSX.Element {
  const {
    raysOrigin = "top-center", raysColor = "foreground", raysSpeed = 1, lightSpread = 0.5, rayLength = 3, rayDensity = 1, tilt = 0,
    raySharpness = 0.35, glow = 0.6, haze = 0.25, atmosphere = 1, intensity = 1, pulsating = false, fadeDistance = 1, saturation = 1,
    followMouse = true, mouseInfluence = 0.1, cursorShadow = true, clickPulse = true, noiseAmount = 0, distortion = 0, intro = true,
    ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const state = useRef<{ aim: [number, number] | null; sx: number; sy: number; shade: number }>({ aim: null, sx: 0.5, sy: 0.5, shade: 0 });

  const uniforms = (frame: BackdropFrame) => {
    const { pointer, dt, fit } = frame;
    const s = state.current;
    const source = RAY_ORIGINS[raysOrigin] ?? RAY_ORIGINS["top-center"];
    const aspect = fit.width / Math.max(1, fit.height);
    const base = turn(aimToward(source, [0.5, 0.5], aspect), tilt);
    const tracking = followMouse && pointer.inside;
    const toPointer = aimToward(source, [pointer.x, pointer.y], aspect);
    const target: [number, number] = tracking ? [base[0] + (toPointer[0] - base[0]) * mouseInfluence, base[1] + (toPointer[1] - base[1]) * mouseInfluence] : base;
    const prev = s.aim ?? target;
    const steer = 1 / LIGHT_RAYS.steerTau;
    s.aim = [followStep(prev[0], target[0], dt, steer), followStep(prev[1], target[1], dt, steer)];
    const shading = cursorShadow && pointer.inside;
    s.shade = followStep(s.shade, shading ? 1 : 0, dt, 1 / (shading ? LIGHT_RAYS.shadeInTau : LIGHT_RAYS.shadeOutTau));
    s.sx = followStep(s.sx, pointer.x, dt, 1 / LIGHT_RAYS.glideTau);
    s.sy = followStep(s.sy, pointer.y, dt, 1 / LIGHT_RAYS.glideTau);
    const opening = introProgress(frame.elapsed, LIGHT_RAYS.openSeconds, intro);
    const length = rayLength * fadeDistance;
    return {
      u_color: rgbAt(frame.colors, 0),
      u_source: source,
      u_aim: s.aim,
      u_rate: raysSpeed,
      u_spread: lightSpread,
      u_length: length,
      u_density: rayDensity,
      u_sharp: raySharpness,
      u_glow: glow,
      u_haze: haze,
      u_atmo: atmosphere,
      u_intensity: intensity,
      u_pulsate: pulsating ? 1 : 0,
      u_sat: saturation,
      u_noise: noiseAmount,
      u_distort: distortion,
      u_shade: [s.sx, s.sy, s.shade],
      u_intro: [opening * (length + 0.4), Math.min(1, opening * 2)],
      u_pulse_on: clickPulse ? 1 : 0,
    };
  };

  const handle = useShaderBackdrop({ fragment: LIGHT_RAYS_FRAGMENT, uniforms }, { ...options, colors: [raysColor], maxEdge: budgetEdge(LIGHT_RAYS.pixelBudget) });
  return (
    <BackdropShell handle={handle} fallback={glowFallback("background", raysColor)} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
