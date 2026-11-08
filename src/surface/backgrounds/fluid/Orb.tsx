"use client";
// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 Orb 条目, 实现为 HX 自有.

import { useRef, type JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import type { Rgb } from "../../backdrop/kernel/color";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { glowFallback } from "../../backdrop/kernel/fallback";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import { ORB_FRAGMENT, createOrbState, stepOrb, type OrbState } from "./orb-shader";

export interface OrbProps extends BackdropCommonProps {
  /** 光环颜色, 1 到 3 个, 沿环流转. 默认 primary, accent. */
  readonly colors?: readonly string[];
  /** 色相旋转 (度), 默认 0. */
  readonly hue?: number;
  /** 底色, 默认 background. */
  readonly backgroundColor?: string;
  /** 光球大小倍率, 默认 1. */
  readonly size?: number;
  /** 外侧泛光, 默认 1. */
  readonly glow?: number;
  /** 向指针隆起的幅度, 默认 1. */
  readonly bleed?: number;
  /** 环的噪声起伏, 默认 1. */
  readonly wobble?: number;
  /** 内侧高光点, 默认 1. */
  readonly highlight?: number;
  /** 尾迹长度, 0 关掉, 默认 1. */
  readonly trail?: number;
  /** 绕横轴倾斜 (度), 默认 0. */
  readonly tiltX?: number;
  /** 绕竖轴倾斜 (度), 默认 0. */
  readonly tiltY?: number;
  /** 悬停时增亮的幅度, 默认 1. */
  readonly hoverIntensity?: number;
  /** 悬停时缓慢自转, 默认 true. */
  readonly rotateOnHover?: boolean;
  /** 一直按悬停态画. */
  readonly forceHoverState?: boolean;
  /** 光环向指针隆起, 尾迹头部转向指针, 默认 true. */
  readonly followCursor?: boolean;
  /** 点击弹一下并放出回声环, 默认 true. */
  readonly clickPulse?: boolean;
  /** 出现时光环从小到大亮起, 默认 true. */
  readonly intro?: boolean;
}

const DEFAULT_COLORS = ["primary", "accent"];
/** 指针离球心多远 (光球半径倍数) 以内算瞄着. */
const AIM_RADIUS = 1.2;
const GREY: Rgb = [0.5, 0.5, 0.5];

/**
 * 光球: 一圈噪声扰动的光环, 内侧渐隐出体积, 外侧泛光; 指针靠近时增亮并向指针隆起 (弹簧 70 / 7),
 * 尾迹头部转向指针, 点击给脉冲弹簧 (170 / 11) 一个初速并放出回声环. 减弱动效只画一帧静止的光环.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-fluid.md
 */
export function Orb(props: OrbProps): JSX.Element {
  const {
    colors = DEFAULT_COLORS, hue = 0, backgroundColor = "background", size = 1, glow = 1, bleed = 1, wobble = 1, highlight = 1, trail = 1, tiltX = 0, tiltY = 0,
    hoverIntensity = 1, rotateOnHover = true, forceHoverState = false, followCursor = true, clickPulse = true, intro = true, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const palette = (colors.length > 0 ? colors : DEFAULT_COLORS).slice(0, 3);
  const state = useRef<OrbState | null>(null);
  const seenTap = useRef(-1);

  const advance = (frame: BackdropFrame): OrbState => {
    state.current ??= createOrbState(!intro);
    const s = state.current;
    if (frame.reduced) {
      Object.assign(s, createOrbState(true), { hover: forceHoverState ? 1 : 0, near: forceHoverState ? hoverIntensity : 0 });
      return s;
    }
    const { pointer, fit } = frame;
    const short = Math.min(fit.width, fit.height) || 1;
    const radius = Math.max(size, 0.05) * 0.5;
    const aimX = ((pointer.x - 0.5) * fit.width) / short / radius;
    const aimY = ((pointer.y - 0.5) * fit.height) / short / radius;
    const tap = pointer.taps[pointer.taps.length - 1];
    const tapped = tap !== undefined && tap.at > seenTap.current;
    if (tap) seenTap.current = Math.max(seenTap.current, tap.at);
    stepOrb(s, { aimX, aimY, inside: pointer.inside, aimed: Math.hypot(aimX, aimY) < AIM_RADIUS, tapped }, { hoverIntensity, rotateOnHover, forceHoverState, followCursor, clickPulse }, frame.dt);
    return s;
  };

  const handle = useShaderBackdrop(
    {
      fragment: ORB_FRAGMENT,
      uniforms: (frame) => {
        const s = advance(frame);
        const c0 = frame.colors[0] ?? GREY;
        const c1 = palette.length > 1 ? (frame.colors[1] ?? c0) : c0;
        const reach = Math.hypot(s.reachX, s.reachY);
        const clip = reach > 1 ? 1 / reach : 1;
        return {
          u_c0: c0,
          u_c1: c1,
          u_c2: palette.length > 2 ? (frame.colors[2] ?? c1) : c1,
          u_bg: frame.colors[palette.length] ?? GREY,
          u_hue: hue,
          u_size: size,
          u_glow: glow,
          u_bleed: bleed,
          u_wobble: wobble,
          u_highlight: highlight,
          u_trail: trail,
          u_tilt: [(tiltX * Math.PI) / 180, (tiltY * Math.PI) / 180],
          u_rotation: s.rotation,
          u_reach: [s.reachX * clip, s.reachY * clip],
          u_near: s.near + s.kick * 0.5,
          u_orbit: s.orbit,
          u_pulse: s.pulse,
          u_echo: [s.echo, 1 - s.echo],
          u_reveal: s.reveal,
        };
      },
    },
    { ...options, colors: [...palette, backgroundColor] },
  );

  return (
    <BackdropShell handle={handle} fallback={glowFallback(backgroundColor, palette[0] ?? "primary")} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
