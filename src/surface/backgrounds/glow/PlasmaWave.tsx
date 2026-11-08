"use client";
// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 PlasmaWave 条目, 实现为 HX 自有.
// ENGINE-GAP: 规格是粗 / 细两级追踪加 4 级泛光金字塔 (COARSE_RATIO, BLOOM_LEVELS, MAX_LIGHT_PIXELS), 内核没有降采样链与逐级上屏, 这里单通道按距离解析出光晕, quality 只作像素比倍率.

import { useRef, type JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { glowFallback } from "../../backdrop/kernel/fallback";
import type { UniformMap } from "../../backdrop/kernel/gl";
import { approach, clamp } from "../../backdrop/kernel/math";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import { colorCount, colorList, DEG, finishUniforms, introProgress, tauOf } from "./glow-kit";
import {
  PLASMA_WAVE_FRAGMENT, PLASMA_WAVE_HEAT_FOLLOW_RATE, PLASMA_WAVE_HEAT_SPRING, PLASMA_WAVE_INTRO_SECONDS, PLASMA_WAVE_LENS_RATE, PLASMA_WAVE_MAX_COLORS,
} from "./plasma-wave-shader";

/** 默认色标: 语义 token 名. */
export const PLASMA_WAVE_DEFAULT_COLORS = ["primary", "accent"] as const;
/** 规格像素比上限 2, quality 乘在上面. */
const DPR_CAP = 2;
const FALLBACK_BASE = "background";

export interface PlasmaWaveProps extends BackdropCommonProps {
  /** 横向色标 (token 名或 CSS 颜色), 至多 4 个. */
  readonly colors?: readonly string[];
  /** 第一条波的相速度, 默认 0.05. */
  readonly speed1?: number;
  /** 第二条波的相速度, 默认 0.05. */
  readonly speed2?: number;
  /** 第二条波方向 (1 或 -1), 默认 1. */
  readonly dir2?: number;
  /** 第一条波弯曲幅度, 默认 1. */
  readonly bend1?: number;
  /** 第二条波弯曲幅度, 默认 0.5. */
  readonly bend2?: number;
  /** 光带粗细, 默认 0.3. */
  readonly thickness?: number;
  /** 透视焦距, 越小越斜, 默认 1.25. */
  readonly focalLength?: number;
  /** 整体旋转 (度), 默认 0. */
  readonly rotationDeg?: number;
  readonly xOffset?: number;
  readonly yOffset?: number;
  readonly brightness?: number;
  /** 外圈光晕, 默认 1. */
  readonly glow?: number;
  /** 峰值泛白, 默认 0.6. */
  readonly core?: number;
  /** 胶片颗粒, 默认 0.03. */
  readonly grain?: number;
  /** 分辨率倍率 0.1..1, 乘在像素比上限上, 默认 1. */
  readonly quality?: number;
  /** 入场: 1.8 秒内亮起. 默认 true. */
  readonly intro?: boolean;
  /** 边缘渐隐 0..1, 默认 0. */
  readonly fade?: number;
  readonly lightMode?: boolean;
}

export interface PlasmaWaveSettings {
  readonly speed1: number;
  readonly speed2: number;
  readonly dir2: number;
  readonly bend1: number;
  readonly bend2: number;
  readonly thickness: number;
  readonly focalLength: number;
  readonly rotationDeg: number;
  readonly xOffset: number;
  readonly yOffset: number;
  readonly brightness: number;
  readonly glow: number;
  readonly core: number;
  readonly intro: boolean;
}

/** 热点 (横向位置, 热度与其速度) 与透镜位置. */
export interface WaveHeat {
  heatX: number;
  heat: number;
  heatVelocity: number;
  lensX: number;
  lensY: number;
}

export function createWaveHeat(): WaveHeat {
  return { heatX: 0.5, heat: 0, heatVelocity: 0, lensX: 0.5, lensY: 0.5 };
}

/**
 * 推进热点: 横向跟随速率 6; 热度弹簧 120 * (目标 - 热度) - 19 * 速度, 钳到 0..1.15; 透镜跟随速率 8 (规格原式). 静态帧不动.
 */
export function stepWaveHeat(h: WaveHeat, frame: Pick<BackdropFrame, "dt" | "pointer">, enabled: boolean): void {
  const { dt, pointer } = frame;
  if (dt <= 0) return;
  const engaged = enabled && pointer.inside;
  if (engaged) h.heatX = approach(h.heatX, pointer.x, dt, tauOf(PLASMA_WAVE_HEAT_FOLLOW_RATE));
  const { stiffness, damping, max } = PLASMA_WAVE_HEAT_SPRING;
  h.heatVelocity += (stiffness * ((engaged ? 1 : 0) - h.heat) - damping * h.heatVelocity) * dt;
  h.heat = clamp(h.heat + h.heatVelocity * dt, 0, max);
  h.lensX = approach(h.lensX, pointer.x, dt, tauOf(PLASMA_WAVE_LENS_RATE));
  h.lensY = approach(h.lensY, pointer.y, dt, tauOf(PLASMA_WAVE_LENS_RATE));
}

/** 由一帧与热点求 uniform. 纯函数. */
export function plasmaWaveUniforms(frame: Pick<BackdropFrame, "colors" | "elapsed">, h: WaveHeat, s: PlasmaWaveSettings): UniformMap {
  const open = introProgress(frame.elapsed, PLASMA_WAVE_INTRO_SECONDS, s.intro);
  return {
    u_ramp: colorList(frame.colors, PLASMA_WAVE_MAX_COLORS),
    u_count: colorCount(frame.colors, PLASMA_WAVE_MAX_COLORS),
    u_speeds: [s.speed1, s.speed2],
    u_dir2: s.dir2 < 0 ? -1 : 1,
    u_bends: [s.bend1, s.bend2],
    u_thickness: Math.max(s.thickness, 0),
    u_focal: Math.max(s.focalLength, 0.1),
    u_turn: s.rotationDeg * DEG,
    u_offset: [s.xOffset, s.yOffset],
    u_brightness: s.brightness,
    u_glow: s.glow,
    u_core: s.core,
    u_presence: open * open * (3 - 2 * open),
    u_heat: [h.heatX, h.heat],
    u_lens: [h.lensX, h.lensY, Math.min(h.heat, 1)],
  };
}

/**
 * 等离子波: 两条带透视的正弦光带交错流动, 近芯处泛白, 外圈按距离解析出柔光.
 * 指针所在处用弹簧把光带顶起并加一枚放大透镜; 入场 1.8 秒亮起. 减弱动效时内核只画一帧.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-glow.md
 */
export function PlasmaWave(props: PlasmaWaveProps): JSX.Element {
  const {
    colors = PLASMA_WAVE_DEFAULT_COLORS, speed1 = 0.05, speed2 = 0.05, dir2 = 1, bend1 = 1, bend2 = 0.5, thickness = 0.3, focalLength = 1.25, rotationDeg = 0,
    xOffset = 0, yOffset = 0, brightness = 1, glow = 1, core = 0.6, grain = 0.03, quality = 1, intro = true, fade = 0, lightMode = false, dpr, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon({ ...common, dpr: (dpr ?? DPR_CAP) * clamp(quality, 0.1, 1) });
  const heat = useRef(createWaveHeat());
  const stops = colors.slice(0, PLASMA_WAVE_MAX_COLORS);
  const settings: PlasmaWaveSettings = {
    speed1, speed2, dir2, bend1, bend2, thickness, focalLength, rotationDeg, xOffset, yOffset, brightness, glow, core, intro,
  };
  const handle = useShaderBackdrop(
    {
      fragment: PLASMA_WAVE_FRAGMENT,
      uniforms: (frame) => {
        stepWaveHeat(heat.current, frame, options.pointer !== false);
        return { ...plasmaWaveUniforms(frame, heat.current, settings), ...finishUniforms(lightMode, fade, grain) };
      },
    },
    { ...options, colors: stops },
  );
  return (
    <BackdropShell handle={handle} fallback={glowFallback(FALLBACK_BASE, stops[0] ?? PLASMA_WAVE_DEFAULT_COLORS[0])} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
