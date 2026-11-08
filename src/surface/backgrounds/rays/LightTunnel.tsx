"use client";
// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 LightTunnel 条目, 实现为 HX 自有.

import { useRef, type JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { glowFallback } from "../../backdrop/kernel/fallback";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import { followStep, introProgress, rgbAt } from "./field";
import { LIGHT_TUNNEL, LIGHT_TUNNEL_FRAGMENT, tunnelDrift } from "./light-tunnel-shader";

export type TunnelFlow = "inward" | "outward";

export interface LightTunnelProps extends BackdropCommonProps {
  /** 线缆颜色: token 名或 CSS 颜色. */
  readonly cableColor?: string;
  /** 脉冲颜色. */
  readonly pulseColor?: string;
  /** 隧道壁颜色. */
  readonly tunnelColor?: string;
  /** 隧道壁不透明度 0..1, 0 为不画. */
  readonly tunnelOpacity?: number;
  /** 线缆朝前漂移的速度 (另加 0.2 的基础速度). */
  readonly drift?: number;
  /** 脉冲流向. */
  readonly flowDirection?: TunnelFlow;
  readonly pulseSpeed?: number;
  /** 脉冲拖尾长度. */
  readonly pulseLength?: number;
  /** 脉冲颜色与线缆颜色的混合 0..1. */
  readonly pulseBlend?: number;
  /** 脉冲宽度相对线缆宽度. */
  readonly pulseWidth?: number;
  /** 脉冲密度 0..1, 同时决定带脉冲的线缆比例. */
  readonly pulseDensity?: number;
  readonly cableCount?: number;
  readonly thickness?: number;
  /** 线缆边光宽度. */
  readonly rimWidth?: number;
  /** 线缆波动幅度. */
  readonly waviness?: number;
  /** 线缆摆动速度. */
  readonly sway?: number;
  /** 指针牵动隧道中段弯曲的强度. */
  readonly bend?: number;
  /** 整体缩放. */
  readonly size?: number;
  /** 消失点偏移 (短边为 1). */
  readonly centerX?: number;
  readonly centerY?: number;
  readonly glow?: number;
  /** 近处淡出半径与远处淡出半径 (短边为 1). */
  readonly fadeNear?: number;
  readonly fadeFar?: number;
  readonly brightness?: number;
  /** 是否播放 1.8 秒的由外向内揭开. */
  readonly intro?: boolean;
}

/** 指针能把消失点拉开的最大距离 (短边为 1, 本库定). */
const STEER_REACH = 0.35;

/**
 * 光缆隧道: 一圈线缆按 1 / r 投影汇向消失点, 沿缆有头尾分明的光脉冲流动. 远处线缆密到像素级时化成整体光,
 * 指针拉动隧道中段弯曲 (时间常数 0.6s).
 */
export function LightTunnel(props: LightTunnelProps): JSX.Element {
  const {
    cableColor = "foreground", pulseColor = "primary", tunnelColor = "foreground", tunnelOpacity = 0, drift = 0.1,
    flowDirection = "inward", pulseSpeed = 2, pulseLength = 0.28, pulseBlend = 0.6, pulseWidth = 1, pulseDensity = 0.5,
    cableCount = 56, thickness = 0.35, rimWidth = 0.15, waviness = 0.3, sway = 0.5, bend = 0.4, size = 1, centerX = 0, centerY = 0,
    glow = 1, fadeNear = 0.5, fadeFar = 2, brightness = 1, intro = true, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const steer = useRef({ x: 0, y: 0 });

  const uniforms = (frame: BackdropFrame) => {
    const { pointer, dt, fit } = frame;
    const s = steer.current;
    const aspect = fit.width / Math.max(1, fit.height);
    const engaged = options.pointer !== false && pointer.inside;
    const rate = 1 / LIGHT_TUNNEL.followTau;
    s.x = followStep(s.x, engaged ? (pointer.x - 0.5) * aspect * STEER_REACH * 2 : 0, dt, rate);
    s.y = followStep(s.y, engaged ? (pointer.y - 0.5) * STEER_REACH * 2 : 0, dt, rate);
    const reveal = introProgress(frame.elapsed, LIGHT_TUNNEL.introSeconds, intro);
    return {
      u_cable: rgbAt(frame.colors, 0),
      u_pulse: rgbAt(frame.colors, 1),
      u_tube: rgbAt(frame.colors, 2),
      u_tube_alpha: tunnelOpacity,
      u_drift: tunnelDrift(frame.time, drift),
      u_phase: frame.time * pulseSpeed * pulseDensity,
      u_dir: flowDirection === "outward" ? -1 : 1,
      u_plen: pulseLength,
      u_pblend: pulseBlend,
      u_pwidth: pulseWidth,
      u_pdensity: pulseDensity,
      u_count: Math.max(1, Math.min(LIGHT_TUNNEL.maxCables, Math.round(cableCount))),
      u_thick: thickness,
      u_rim: rimWidth,
      u_wavy: waviness,
      u_sway: sway,
      u_bend: bend,
      u_size: size,
      u_center: [centerX, centerY],
      u_steer: [s.x, s.y],
      u_glow: glow,
      u_near: fadeNear,
      u_far: fadeFar,
      u_bright: brightness,
      u_reveal: reveal * LIGHT_TUNNEL.revealSpan,
    };
  };

  const handle = useShaderBackdrop({ fragment: LIGHT_TUNNEL_FRAGMENT, uniforms }, { ...options, colors: [cableColor, pulseColor, tunnelColor] });
  return (
    <BackdropShell handle={handle} fallback={glowFallback("background", pulseColor)} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
