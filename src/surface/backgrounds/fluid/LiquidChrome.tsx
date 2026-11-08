"use client";
// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 LiquidChrome 条目, 实现为 HX 自有.

import { useRef, type JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import type { Rgb } from "../../backdrop/kernel/color";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { fallbackGradient } from "../../backdrop/kernel/fallback";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import {
  CHROME_DROP_RADIUS, CHROME_FRAGMENT, CHROME_RIPPLE_DAMP, CHROME_SIM_CELL, CHROME_SIM_STEPS, CHROME_TAP_GAIN, CHROME_WAVE_PASS, chromeDragPush, chromeIntro,
} from "./liquid-chrome-shader";

export interface LiquidChromeProps extends BackdropCommonProps {
  /** 金属的色调, token 名或 CSS 颜色, 默认 foreground. */
  readonly color?: string;
  /** 底色, 默认 background. */
  readonly backgroundColor?: string;
  /** 液面扭曲幅度, 默认 0.3. */
  readonly amplitude?: number;
  /** 横向波频, 默认 3. */
  readonly frequencyX?: number;
  /** 纵向波频, 默认 3. */
  readonly frequencyY?: number;
  /** 叠加层数 1..8, 默认 4. */
  readonly detail?: number;
  /** 液层厚度 (起伏高度倍率), 默认 1. */
  readonly thickness?: number;
  /** 法线强度 (看起来多深), 默认 1. */
  readonly depth?: number;
  /** 反射模糊 0..1, 默认 0.3. */
  readonly roughness?: number;
  /** 曝光倍率, 默认 1. */
  readonly exposure?: number;
  /** 指针是否搅出涟漪, 默认 true. */
  readonly interactive?: boolean;
  /** 涟漪强度倍率, 默认 1. */
  readonly rippleStrength?: number;
  /** 涟漪尺度倍率, 默认 1. */
  readonly rippleSize?: number;
  /** 视线俯仰 (影响高光落点), 默认 1. */
  readonly tilt?: number;
  /** 出现时振幅由静到动, 默认 true. */
  readonly intro?: boolean;
  /** 浅色模式: 以底色为主, 反射只做明暗. */
  readonly lightMode?: boolean;
}

const DEFAULT_SPEED = 0.2;
const DEFAULT_AMPLITUDE = 0.3;
const DEFAULT_FREQUENCY = 3;
const DEFAULT_DETAIL = 4;
const DEFAULT_ROUGHNESS = 0.3;
const GREY: Rgb = [0.5, 0.5, 0.5];
const NO_DROP: [number, number, number, number] = [0, 0, 0, 0];

/**
 * 液态金属: 多层正弦扭曲出的液面当镜子, 反射一个摄影棚环境, 指针拖动与点击在液面上搅出涟漪
 * (离屏波动方程, 1/4 分辨率, 每帧两步). 减弱动效时内核只画一帧, 不注入涟漪.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-fluid.md
 */
export function LiquidChrome(props: LiquidChromeProps): JSX.Element {
  const {
    color = "foreground", backgroundColor = "background", amplitude = DEFAULT_AMPLITUDE, frequencyX = DEFAULT_FREQUENCY, frequencyY = DEFAULT_FREQUENCY,
    detail = DEFAULT_DETAIL, thickness = 1, depth = 1, roughness = DEFAULT_ROUGHNESS, exposure = 1, interactive = true, rippleStrength = 1, rippleSize = 1,
    tilt = 1, intro = true, lightMode = false, speed = DEFAULT_SPEED, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon({ ...common, speed });
  const seenTap = useRef(-1);

  const dropOf = (frame: BackdropFrame, iteration: number): [number, number, number, number] => {
    if (!interactive || frame.still || iteration > 0) return NO_DROP;
    const { pointer } = frame;
    const tap = pointer.taps[pointer.taps.length - 1];
    if (tap && tap.at > seenTap.current) {
      seenTap.current = tap.at;
      return [tap.x, tap.y, CHROME_DROP_RADIUS * rippleSize * 2, CHROME_TAP_GAIN * rippleStrength];
    }
    if (!pointer.inside) return NO_DROP;
    const push = chromeDragPush(Math.hypot(pointer.vx, pointer.vy), rippleStrength);
    return push > 0 ? [pointer.x, pointer.y, CHROME_DROP_RADIUS * rippleSize, push] : NO_DROP;
  };

  const handle = useShaderBackdrop(
    {
      fragment: CHROME_FRAGMENT,
      passes: [
        {
          name: "u_wave",
          fragment: CHROME_WAVE_PASS,
          scale: 1 / CHROME_SIM_CELL,
          iterations: CHROME_SIM_STEPS,
          uniforms: (frame, iteration) => ({ u_drop: dropOf(frame, iteration), u_damp: CHROME_RIPPLE_DAMP }),
        },
      ],
      uniforms: (frame) => ({
        u_tint: frame.colors[0] ?? GREY,
        u_bg: frame.colors[1] ?? GREY,
        u_amp: amplitude,
        u_freq: [frequencyX, frequencyY],
        u_detail: Math.max(1, Math.min(8, Math.round(detail))),
        u_thick: thickness,
        u_depth: depth,
        u_rough: roughness,
        u_exposure: exposure,
        u_ripple_size: rippleSize,
        u_tilt: tilt,
        u_intro: chromeIntro(frame.elapsed, intro && !frame.reduced),
        u_light: lightMode,
      }),
    },
    { ...options, colors: [color, backgroundColor], pointer: options.pointer !== false && interactive },
  );

  return (
    <BackdropShell handle={handle} fallback={fallbackGradient([backgroundColor, color])} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
