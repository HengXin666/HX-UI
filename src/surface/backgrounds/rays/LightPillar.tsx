"use client";
// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 LightPillar 条目, 实现为 HX 自有.
// 已补 (2026-11-09): 规格的射线步进 + 独立合成 / 泛光通道: 步进 56 步改在按 quality 比例缩放的离屏通道里跑,
// 上屏程序以 ../bloom.ts 的降采样金字塔合成泛光 (quality 低 / 中 / 高 取 2 / 3 / 4 级), 不再以峰值处解析增益近似.
// mixBlendMode 交给使用方的 className, resolution 由 quality 档位 (步进通道比例) 与公共 dpr 承担.

import { useRef, type JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { glowFallback } from "../../backdrop/kernel/fallback";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import { bloomPyramid } from "../bloom";
import { followStep, introProgress, radians, raysBloomFragment, rgbAt } from "./field";
import { LIGHT_PILLAR, LIGHT_PILLAR_SCENE, quintic, type PillarQuality } from "./light-pillar-shader";

export interface LightPillarProps extends BackdropCommonProps {
  /** 柱顶光色: token 名或 CSS 颜色. */
  readonly topColor?: string;
  /** 柱底光色. */
  readonly bottomColor?: string;
  readonly intensity?: number;
  /** 绕柱轴自转速度. */
  readonly rotationSpeed?: number;
  /** 噪声沿柱流动的速度. */
  readonly flow?: number;
  /** 指针牵动视角. */
  readonly interactive?: boolean;
  /** 点击时一道亮环沿柱上行. */
  readonly clickPulse?: boolean;
  /** 每步辉光系数. */
  readonly glowAmount?: number;
  /** 泛光强度 (降采样模糊泛光叠回画面的比例). */
  readonly bloom?: number;
  /** 柱宽. */
  readonly pillarWidth?: number;
  /** 柱高系数, 越大柱身越短. */
  readonly pillarHeight?: number;
  /** 柱身倾角 (度). */
  readonly pillarRotation?: number;
  /** 沿柱扭转. */
  readonly twist?: number;
  /** 噪声层数 1..6. */
  readonly detail?: number;
  /** 柱身扰动幅度. */
  readonly noiseIntensity?: number;
  /** 四边淡出宽度 0..1. */
  readonly fade?: number;
  /** 是否播放 2.1 秒的自下而上揭开. */
  readonly intro?: boolean;
  /** 画质档位: 决定步进通道的渲染比例与泛光级数. */
  readonly quality?: PillarQuality;
}

/** 揭开推进的总行程: 1 + 遮罩软边 0.9. */
const REVEAL_SPAN = 1.9;
/** 指针牵动视角的最大偏航 / 俯仰 (弧度, 本库定). */
const VIEW_REACH = { yaw: 0.35, pitch: 0.2 } as const;

/**
 * 光柱: 一根扭转的噪声光柱, 颜色自下而上渐变, 沿柱轴自转, 射线步进累积 1 / d 辉光.
 * 指针在场时视角缓缓偏向指针 (速率 2.4), 点击时一道亮环沿柱上行 (寿命 1.4s).
 */
export function LightPillar(props: LightPillarProps): JSX.Element {
  const {
    topColor = "primary", bottomColor = "accent-2", intensity = 1, rotationSpeed = 0.3, flow = 1, interactive = true, clickPulse = true,
    glowAmount = 0.002, bloom = 0.5, pillarWidth = 3, pillarHeight = 0.4, pillarRotation = 25, twist = 0.4, detail = 4,
    noiseIntensity = 0.5, fade = 0, intro = true, quality = "high", ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const state = useRef({ yaw: 0, pitch: 0, touch: 0 });

  const uniforms = (frame: BackdropFrame) => {
    const { pointer, dt } = frame;
    const s = state.current;
    const engaged = interactive && pointer.inside;
    s.yaw = followStep(s.yaw, engaged ? (pointer.x - 0.5) * VIEW_REACH.yaw * 2 : 0, dt, LIGHT_PILLAR.followRate);
    s.pitch = followStep(s.pitch, engaged ? (pointer.y - 0.5) * VIEW_REACH.pitch * 2 : 0, dt, LIGHT_PILLAR.followRate);
    s.touch = followStep(s.touch, engaged ? 1 : 0, dt, LIGHT_PILLAR.touchRate);
    return {
      u_top: rgbAt(frame.colors, 0),
      u_bottom: rgbAt(frame.colors, 1),
      u_fade: fade,
      u_clock: frame.time * LIGHT_PILLAR.spin * rotationSpeed,
      u_intensity: intensity,
      u_flow: flow,
      u_glow: glowAmount,
      u_width: pillarWidth,
      u_height: pillarHeight,
      u_tilt: radians(pillarRotation),
      u_twist: twist,
      u_detail: detail,
      u_noise: noiseIntensity,
      u_view: [s.yaw, s.pitch, s.touch],
      u_reveal: quintic(introProgress(frame.elapsed, LIGHT_PILLAR.introSeconds, intro)) * REVEAL_SPAN,
      u_pulse_on: clickPulse ? 1 : 0,
    };
  };

  const tier = quality in LIGHT_PILLAR.quality ? quality : "high";
  const pyramid = bloomPyramid({
    scene: LIGHT_PILLAR_SCENE, sceneUniforms: uniforms, levels: LIGHT_PILLAR.bloomLevels[tier],
    sceneScale: Math.max(LIGHT_PILLAR.minScale, LIGHT_PILLAR.quality[tier]),
    threshold: LIGHT_PILLAR.bloomThreshold, knee: LIGHT_PILLAR.bloomKnee, strength: bloom * LIGHT_PILLAR.bloomGain,
  });
  const handle = useShaderBackdrop(
    { fragment: raysBloomFragment(pyramid.compositeGlsl), passes: pyramid.passes, uniforms: () => ({ u_backdrop: [0, 0, 0, 0], u_fade: fade, ...pyramid.uniforms }) },
    { ...options, colors: [topColor, bottomColor] },
  );
  return (
    <BackdropShell handle={handle} fallback={glowFallback("background", topColor)} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
