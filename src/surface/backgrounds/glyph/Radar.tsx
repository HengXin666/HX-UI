"use client";
// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 Radar 条目, 实现为 HX 自有.

import type { JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { glowFallback } from "../../backdrop/kernel/fallback";
import type { UniformMap } from "../../backdrop/kernel/gl";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import { colorAt, introProgress, modeOf } from "./kit";
import { RADAR, RADAR_FRAGMENT, RADAR_MODES, radarSquash, type RadarMode } from "./radar-shader";

export interface RadarProps extends BackdropCommonProps {
  /** 荧光色 (token 名或 CSS 颜色), 默认 primary. */
  readonly color?: string;
  /** 底色, 默认 transparent (不铺底, 叠在宿主背景上). */
  readonly backgroundColor?: string;
  /** 显示模式, 默认 sweep. */
  readonly mode?: RadarMode;
  /** 扫过后余亮的衰减 (圈数), 默认 0.35. */
  readonly trail?: number;
  /** 圆盘半径占短边一半的比例, 默认 0.9. */
  readonly scale?: number;
  /** 距离环数, 默认 6. */
  readonly ringCount?: number;
  /** 辐条数, 默认 12. */
  readonly spokeCount?: number;
  /** 外圈刻度与外框, 默认 true. */
  readonly ticks?: boolean;
  /** 目标数 (上限 16), 默认 6. */
  readonly targets?: number;
  /** 杂波量 0..1, 默认 0.35. */
  readonly clutter?: number;
  /** 辉光, 默认 1. */
  readonly glow?: number;
  /** 亮度, 默认 1. */
  readonly brightness?: number;
  /** 网格不透明度, 默认 1. */
  readonly gridOpacity?: number;
  /** 线宽 (设备像素倍率), 默认 1. */
  readonly lineWidth?: number;
  /** 俯仰角 (度, 0..70), 默认 0. */
  readonly tilt?: number;
  /** 圆心横向位置 0..1, 默认 0.5. */
  readonly centerX?: number;
  /** 圆心纵向位置 0..1 (自上而下), 默认 0.5. */
  readonly centerY?: number;
  /** 入场: 环, 刻度, 辐条与扫描分段亮起, 默认 true. */
  readonly intro?: boolean;
  /** 颗粒, 默认 0.03. */
  readonly grain?: number;
  /** 外缘淡出 0..1, 默认 0. */
  readonly fade?: number;
}

const DEFAULTS = { trail: 0.35, scale: 0.9, ringCount: 6, spokeCount: 12, targets: 6, clutter: 0.35, centre: 0.5, grain: 0.03 } as const;
const TRANSPARENT = "transparent";
/** 环数至少 1. */
const MIN_RINGS = 1;

type Knobs = Required<Omit<RadarProps, keyof BackdropCommonProps | "color" | "backgroundColor">>;

/** 本件的 uniform, 纯函数, 单测覆盖. 圆心 y 按自上而下给, 着色器坐标 y 朝上. */
export function radarUniforms(frame: Pick<BackdropFrame, "colors" | "elapsed">, k: Knobs, opaque: boolean, mouse: boolean): UniformMap {
  return {
    u_color: colorAt(frame.colors, 0),
    u_back: colorAt(frame.colors, 1),
    u_opaque: opaque ? 1 : 0,
    u_mode: modeOf(RADAR_MODES, k.mode, "sweep"),
    u_trail: Math.max(0.02, k.trail),
    u_scale: Math.max(0.05, k.scale),
    u_rings: Math.max(MIN_RINGS, Math.round(k.ringCount)),
    u_spokes: Math.max(0, Math.round(k.spokeCount)),
    u_ticks: k.ticks ? 1 : 0,
    u_targets: Math.max(0, Math.min(RADAR.maxTargets, Math.round(k.targets))),
    u_clutter: Math.max(0, Math.min(1, k.clutter)),
    u_glow: k.glow,
    u_brightness: k.brightness,
    u_grid: k.gridOpacity,
    u_line: Math.max(0.5, k.lineWidth),
    u_squash: radarSquash(k.tilt),
    u_center: [k.centerX, 1 - k.centerY],
    u_period: RADAR.periodSeconds,
    u_grain: k.grain,
    u_fade: Math.max(0, Math.min(1, k.fade)),
    u_intro: introProgress(frame.elapsed, RADAR.introSeconds, k.intro),
    u_lock: mouse ? 1 : 0,
  };
}

/**
 * 雷达: 极坐标网格 (距离环, 外环, 每度刻度且 5 度与 15 度加长, 辐条, 正方位轴, 外框), 一道扫描束顺时针旋转 (或同心脉冲外扩),
 * 扫过处按 exp(-behind / trail) 余亮; 杂波由分形噪声成团, 目标沿慢速漂移的轨道运动, 被扫到时亮起并保留 4 次历史回波.
 * 指针在盘内时出现锁定框并点亮附近目标. 入场 2.2 秒依次画出环, 辐条, 刻度与扫描. 减弱动效时内核只画一帧.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-glyph.md
 */
export function Radar(props: RadarProps): JSX.Element {
  const {
    color = "primary",
    backgroundColor = TRANSPARENT,
    mode = "sweep",
    trail = DEFAULTS.trail,
    scale = DEFAULTS.scale,
    ringCount = DEFAULTS.ringCount,
    spokeCount = DEFAULTS.spokeCount,
    ticks = true,
    targets = DEFAULTS.targets,
    clutter = DEFAULTS.clutter,
    glow = 1,
    brightness = 1,
    gridOpacity = 1,
    lineWidth = 1,
    tilt = 0,
    centerX = DEFAULTS.centre,
    centerY = DEFAULTS.centre,
    intro = true,
    grain = DEFAULTS.grain,
    fade = 0,
    ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const opaque = backgroundColor !== TRANSPARENT;
  const mouse = options.pointer !== false;
  const k: Knobs = {
    mode, trail, scale, ringCount, spokeCount, ticks, targets, clutter, glow, brightness, gridOpacity, lineWidth, tilt, centerX, centerY, intro, grain, fade,
  };
  const handle = useShaderBackdrop(
    { fragment: RADAR_FRAGMENT, uniforms: (frame) => radarUniforms(frame, k, opaque, mouse) },
    { ...options, colors: [color, opaque ? backgroundColor : "background"] },
  );
  return (
    <BackdropShell handle={handle} fallback={opaque ? glowFallback(backgroundColor, color) : TRANSPARENT} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
