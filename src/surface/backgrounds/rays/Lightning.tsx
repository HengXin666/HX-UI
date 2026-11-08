"use client";
// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Lightning 条目, 实现为 HX 自有.
// 规格的 speed 与公共时钟倍率同名同默认 (1), 直接由公共 speed 承担; paused / dpr 同为公共 props.

import { useRef, type JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { glowFallback } from "../../backdrop/kernel/fallback";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import { followStep, introProgress, radians, rgbAt } from "./field";
import { LIGHTNING, LIGHTNING_FRAGMENT } from "./lightning-shader";

export interface LightningProps extends BackdropCommonProps {
  /** 电光颜色: token 名或 CSS 颜色. */
  readonly color?: string;
  /** 常驻电光条数 1..4. */
  readonly bolts?: number;
  /** 多条电光之间的横向间距. */
  readonly spread?: number;
  /** 分叉量 0..1 (每条最多 3 叉). */
  readonly branches?: number;
  /** 电光整体横向偏移 (短边为 1). */
  readonly xOffset?: number;
  /** 电光绕顶端的倾角 (度). */
  readonly angle?: number;
  /** 折线尺度. */
  readonly size?: number;
  /** 芯线粗细. */
  readonly thickness?: number;
  readonly glow?: number;
  readonly intensity?: number;
  /** 闪烁与爆闪幅度 0..1. */
  readonly flicker?: number;
  /** 电光下端偏向指针的强度. */
  readonly mouseStrength?: number;
  /** 点击处落雷: 先导自顶下行 0.11s, 随后爆闪 1.3s 内散去. */
  readonly clickStrike?: boolean;
  /** 是否播放自上而下的揭开. */
  readonly intro?: boolean;
  /** 四边淡出宽度 0..1. */
  readonly fade?: number;
}

/**
 * 闪电: 自顶而下的分形折线电光, 带分叉, 周期闪现并持续抖闪, 芯线发白外裹辉光.
 * 指针在场时电光下端偏向指针, 点击处落下一道先导加爆闪的落雷 (最多 4 道, 读内核点击队列).
 */
export function Lightning(props: LightningProps): JSX.Element {
  const {
    color = "primary", bolts = 1, spread = 0.6, branches = 0.5, xOffset = 0, angle = 0, size = 1, thickness = 1, glow = 1, intensity = 1,
    flicker = 0.6, mouseStrength = 1, clickStrike = true, intro = true, fade = 0, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const lean = useRef({ x: 0, w: 0 });

  const uniforms = (frame: BackdropFrame) => {
    const { pointer, dt, fit } = frame;
    const s = lean.current;
    const short = Math.min(fit.width, fit.height) || 1;
    const engaged = options.pointer !== false && pointer.inside;
    s.x = followStep(s.x, ((pointer.x - 0.5) * fit.width) / short, dt, LIGHTNING.leanRate);
    s.w = followStep(s.w, engaged ? mouseStrength : 0, dt, LIGHTNING.leanRate);
    return {
      u_color: rgbAt(frame.colors, 0),
      u_fade: fade,
      u_phase: frame.time,
      u_intensity: intensity,
      u_size: size,
      u_thickness: thickness,
      u_glow: glow,
      u_flicker: flicker,
      u_bolts: Math.max(1, Math.min(LIGHTNING.maxBolts, Math.round(bolts))),
      u_spread: spread,
      u_branches: branches,
      u_xoff: xOffset,
      u_angle: radians(angle),
      u_lean: [s.x, s.w],
      u_intro: introProgress(frame.elapsed, LIGHTNING.introSeconds, intro),
      u_strike_on: clickStrike ? 1 : 0,
    };
  };

  const handle = useShaderBackdrop({ fragment: LIGHTNING_FRAGMENT, uniforms }, { ...options, colors: [color] });
  return (
    <BackdropShell handle={handle} fallback={glowFallback("background", color)} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
