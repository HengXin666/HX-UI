"use client";
// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Balatro 条目, 实现为 HX 自有.

import { useRef, type JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import type { Rgb } from "../../backdrop/kernel/color";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { fallbackGradient } from "../../backdrop/kernel/fallback";
import { approach } from "../../backdrop/kernel/math";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import {
  BALATRO_FIELD_SCALE, BALATRO_FLOW_RATE, BALATRO_FRAGMENT, BALATRO_MAX_TWIRLS, BALATRO_SPIN_RATE, BALATRO_STEER_TAU, BALATRO_STIR_PASS, BALATRO_STIR_RADIUS,
  balatroDecay, balatroOpening, balatroTwirl,
} from "./balatro-shader";

export interface BalatroProps extends BackdropCommonProps {
  /** 主色, 默认 primary. */
  readonly color1?: string;
  /** 副色, 默认 accent. */
  readonly color2?: string;
  /** 衬底色, 默认 background. */
  readonly color3?: string;
  /** 分带对比度, 默认 3.5. */
  readonly contrast?: number;
  /** 高光强度, 默认 0.4. */
  readonly lighting?: number;
  /** 中心旋涡强度, 默认 0.25. */
  readonly swirl?: number;
  /** 自转速度, 默认 0. */
  readonly rotationSpeed?: number;
  /** 图样缩放, 默认 1. */
  readonly scale?: number;
  /** 折叠迭代次数 1..8, 默认 5. */
  readonly detail?: number;
  /** 图样平移, 默认 [0, 0]. */
  readonly offset?: readonly [number, number];
  /** 像素块边长 (CSS 像素), 默认 1.5. */
  readonly pixelSize?: number;
  /** CRT 弯曲与扫描线 0..1, 默认 0. */
  readonly crt?: number;
  /** 指针搅动强度, 默认 1. */
  readonly mouseStrength?: number;
  /** 点击拧出一个旋涡, 默认 true. */
  readonly clickSwirl?: boolean;
  /** 出现时颜料从中心旋开, 默认 true. */
  readonly intro?: boolean;
  /** 浅色模式: 颜料整体提亮. */
  readonly lightMode?: boolean;
}

const DEFAULT_CONTRAST = 3.5;
const DEFAULT_LIGHTING = 0.4;
const DEFAULT_SWIRL = 0.25;
const DEFAULT_DETAIL = 5;
const DEFAULT_PIXEL = 1.5;
const NO_OFFSET: readonly [number, number] = [0, 0];
const GREY: Rgb = [0.5, 0.5, 0.5];

interface BalatroState {
  fromX: number;
  fromY: number;
  steerX: number;
  steerY: number;
}

/**
 * 小丑牌式的颜料旋涡: 像素化坐标经中心旋涡扭过, 迭代正弦折叠出三色分带的颜料; 指针拖过时
 * 在离屏搅动场 (8 CSS 像素一格, 半径 90 像素, 每帧乘 exp(-dt / 1.6)) 里推开颜料, 点击拧出旋涡.
 * 减弱动效只画一帧, 不搅动.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-fluid.md
 */
export function Balatro(props: BalatroProps): JSX.Element {
  const {
    color1 = "primary", color2 = "accent", color3 = "background", contrast = DEFAULT_CONTRAST, lighting = DEFAULT_LIGHTING, swirl = DEFAULT_SWIRL, rotationSpeed = 0,
    scale = 1, detail = DEFAULT_DETAIL, offset = NO_OFFSET, pixelSize = DEFAULT_PIXEL, crt = 0, mouseStrength = 1, clickSwirl = true, intro = true, lightMode = false,
    ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const state = useRef<BalatroState>({ fromX: 0.5, fromY: 0.5, steerX: 0, steerY: 0 });

  const stirOf = (frame: BackdropFrame): Record<string, number | number[]> => {
    const s = state.current;
    const { pointer } = frame;
    const cssHeight = frame.fit.height / Math.max(frame.fit.scale, 1e-3);
    const live = !frame.reduced && !frame.still && pointer.inside;
    const out = {
      u_from: [s.fromX, s.fromY],
      u_to: [pointer.x, pointer.y],
      u_push: live ? mouseStrength * 0.5 : 0,
      u_radius: BALATRO_STIR_RADIUS / Math.max(cssHeight, 1),
      u_decay: balatroDecay(frame.dt),
    };
    s.fromX = pointer.x;
    s.fromY = pointer.y;
    return out;
  };

  const twirlsOf = (frame: BackdropFrame): number[] => {
    const list = new Array<number>(BALATRO_MAX_TWIRLS * 4).fill(0);
    if (!clickSwirl || frame.reduced) return list;
    frame.pointer.taps.slice(-BALATRO_MAX_TWIRLS).forEach((tap, i) => {
      list[i * 4] = tap.x;
      list[i * 4 + 1] = tap.y;
      list[i * 4 + 2] = frame.elapsed - tap.at;
      list[i * 4 + 3] = balatroTwirl(frame.elapsed - tap.at) * Math.sign(mouseStrength || 1);
    });
    return list;
  };

  const steerOf = (frame: BackdropFrame): [number, number] => {
    const s = state.current;
    const { pointer } = frame;
    const tx = frame.reduced ? 0 : (pointer.x - 0.5) * pointer.presence * mouseStrength;
    const ty = frame.reduced ? 0 : (pointer.y - 0.5) * pointer.presence * mouseStrength;
    s.steerX = frame.reduced ? 0 : approach(s.steerX, tx, frame.dt, BALATRO_STEER_TAU);
    s.steerY = frame.reduced ? 0 : approach(s.steerY, ty, frame.dt, BALATRO_STEER_TAU);
    return [s.steerX, s.steerY];
  };

  const handle = useShaderBackdrop(
    {
      fragment: BALATRO_FRAGMENT,
      passes: [{ name: "u_stir", fragment: BALATRO_STIR_PASS, scale: 1 / BALATRO_FIELD_SCALE, uniforms: (frame) => stirOf(frame) }],
      uniforms: (frame) => ({
        u_c1: frame.colors[0] ?? GREY,
        u_c2: frame.colors[1] ?? GREY,
        u_c3: frame.colors[2] ?? GREY,
        u_contrast: Math.max(contrast, 0.1),
        u_lighting: lighting,
        u_swirl: swirl,
        u_flow: frame.time * BALATRO_FLOW_RATE,
        u_spin: frame.time * rotationSpeed * BALATRO_SPIN_RATE,
        u_scale: scale,
        u_detail: Math.max(1, Math.min(8, Math.round(detail))),
        u_offset: [offset[0], offset[1]],
        u_pixel: Math.max(pixelSize, 1),
        u_crt: Math.max(0, Math.min(1, crt)),
        u_steer: steerOf(frame),
        u_twirls: { list: twirlsOf(frame), size: 4 },
        u_opening: balatroOpening(frame.elapsed, intro && !frame.reduced),
        u_light: lightMode,
      }),
    },
    { ...options, colors: [color1, color2, color3] },
  );

  return (
    <BackdropShell handle={handle} fallback={fallbackGradient([color3, color1, color2])} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
