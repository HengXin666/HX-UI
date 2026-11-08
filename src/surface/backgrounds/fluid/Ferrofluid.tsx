"use client";
// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Ferrofluid 条目, 实现为 HX 自有.
// ENGINE-GAP: 条目的 Canvas2D 叠层 (尖刺阴影预烘) 不做, 阴影与雾都在同一个射线步进的片元里近似.

import { useRef, type JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import type { Rgb } from "../../backdrop/kernel/color";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { glowFallback } from "../../backdrop/kernel/fallback";
import { approach } from "../../backdrop/kernel/math";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import { FERRO_FLOW, FERRO_FRAGMENT, FERRO_INTRO_SECONDS, FERRO_STRENGTH_TAU, ferroFollow, ferroPulse, type FerroFlow } from "./ferrofluid-shader";

export interface FerrofluidProps extends BackdropCommonProps {
  /** 高光色, 第一个照低处, 第二个照尖端. 默认 foreground. */
  readonly colors?: readonly string[];
  /** 单色写法, 给了就覆盖 colors. */
  readonly color?: string;
  /** 底色, 默认 background. */
  readonly backgroundColor?: string;
  /** 尖刺间距倍率, 默认 1.6. */
  readonly scale?: number;
  /** 尖刺高度, 默认 1. */
  readonly spikeHeight?: number;
  /** 尖刺锐度 (锥形指数), 默认 2.5. */
  readonly sharpness?: number;
  /** 底面起伏与图样抖动, 默认 1. */
  readonly turbulence?: number;
  /** 图样演化快慢, 默认 0.5. */
  readonly fluidity?: number;
  /** 俯视角 (度), 默认 48. */
  readonly tilt?: number;
  /** 磁场强度, 默认 1. */
  readonly magnetism?: number;
  /** 尖刺之间的高度差异 0..1, 默认 0. */
  readonly variation?: number;
  /** 图样漂移方向, 默认 down. */
  readonly flowDirection?: FerroFlow;
  /** 亮度倍率, 默认 1. */
  readonly brightness?: number;
  /** 指针处尖刺抬升的强度, 默认 1. */
  readonly mouseStrength?: number;
  /** 指针影响半径 (平面单位), 默认 0.22. */
  readonly mouseRadius?: number;
  /** 指针跟随的时间常数 (秒), 默认 0.15. */
  readonly mouseDampening?: number;
  /** 点击放出一圈脉冲, 默认 true. */
  readonly clickPulse?: boolean;
  /** 出现时尖刺从平面长出, 默认 true. */
  readonly intro?: boolean;
  /** 浅色模式. */
  readonly lightMode?: boolean;
  /** 透明底 (只画液面), 默认 true. */
  readonly transparent?: boolean;
}

const DEFAULT_COLORS = ["foreground"];
const DEFAULT_SPEED = 0.5;
const DEFAULT_SCALE = 1.6;
const DEFAULT_SHARPNESS = 2.5;
const DEFAULT_FLUIDITY = 0.5;
const DEFAULT_TILT = 48;
const DEFAULT_RADIUS = 0.22;
const DEFAULT_DAMPENING = 0.15;
/** 射线步进件默认像素比上限压到 1, 需要更细时用 dpr 打开. */
const DEFAULT_DPR = 1;
/** 平面单位换算: mouseRadius 0.22 约等于两三根尖刺. */
const RADIUS_TO_PLANE = 6;
const GREY: Rgb = [0.5, 0.5, 0.5];

interface FerroState {
  x: number;
  y: number;
  strength: number;
}

/**
 * 磁流体: 斜视的液面上六角排布的尖刺, 高度跟着一张漂移的磁场图样起落, 指针处尖刺抬升, 点击放出一圈脉冲.
 * 全屏片元射线步进求交 (72 步加 5 次二分), 近黑液面只靠菲涅耳与环境亮带反光.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-fluid.md
 */
export function Ferrofluid(props: FerrofluidProps): JSX.Element {
  const {
    colors = DEFAULT_COLORS, color, backgroundColor = "background", scale = DEFAULT_SCALE, spikeHeight = 1, sharpness = DEFAULT_SHARPNESS, turbulence = 1,
    fluidity = DEFAULT_FLUIDITY, tilt = DEFAULT_TILT, magnetism = 1, variation = 0, flowDirection = "down", brightness = 1, mouseStrength = 1,
    mouseRadius = DEFAULT_RADIUS, mouseDampening = DEFAULT_DAMPENING, clickPulse = true, intro = true, lightMode = false, transparent = true,
    speed = DEFAULT_SPEED, dpr = DEFAULT_DPR, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon({ ...common, speed, dpr });
  const palette = color ? [color] : colors.slice(0, 2);
  const state = useRef<FerroState>({ x: 0.5, y: 0.5, strength: 0 });

  const cursorOf = (frame: BackdropFrame): number[] => {
    const s = state.current;
    const { pointer } = frame;
    if (frame.reduced) {
      s.strength = 0;
    } else {
      const k = ferroFollow(frame.dt, mouseDampening);
      s.x += (pointer.x - s.x) * k;
      s.y += (pointer.y - s.y) * k;
      s.strength = approach(s.strength, pointer.presence * mouseStrength, frame.dt, FERRO_STRENGTH_TAU);
    }
    return [s.x, s.y, s.strength, mouseRadius * RADIUS_TO_PLANE * 0.5];
  };

  const pulseOf = (frame: BackdropFrame): number[] => {
    const tap = frame.pointer.taps[frame.pointer.taps.length - 1];
    if (!clickPulse || !tap || frame.reduced) return [0, 0, 0, 0];
    const age = frame.elapsed - tap.at;
    return [tap.x, tap.y, age, ferroPulse(age)];
  };

  const handle = useShaderBackdrop(
    {
      fragment: FERRO_FRAGMENT,
      uniforms: (frame) => {
        const c0 = frame.colors[0] ?? GREY;
        const grow = intro && !frame.reduced && Number.isFinite(frame.elapsed) ? Math.min(1, frame.elapsed / FERRO_INTRO_SECONDS) : 1;
        return {
          u_c0: c0,
          u_c1: palette.length > 1 ? (frame.colors[1] ?? c0) : c0,
          u_bg: frame.colors[palette.length] ?? GREY,
          u_scale: scale / DEFAULT_SCALE,
          u_height: spikeHeight,
          u_sharp: sharpness,
          u_turb: turbulence,
          u_fluid: fluidity,
          u_tilt: tilt,
          u_magnet: magnetism,
          u_vary: variation,
          u_flow: FERRO_FLOW[flowDirection] ?? FERRO_FLOW.none,
          u_bright: brightness,
          u_cursor: cursorOf(frame),
          u_pulse: pulseOf(frame),
          u_grow: grow * grow * (3 - 2 * grow),
          u_light: lightMode,
          u_transparent: transparent,
        };
      },
    },
    { ...options, colors: [...palette, backgroundColor] },
  );

  return (
    <BackdropShell handle={handle} fallback={glowFallback(backgroundColor, palette[0] ?? "foreground")} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
