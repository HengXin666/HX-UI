"use client";
// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 GradientWaves 条目, 实现为 HX 自有.

import { useRef, type JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { fallbackGradient } from "../../backdrop/kernel/fallback";
import type { UniformMap } from "../../backdrop/kernel/gl";
import { approach, clamp } from "../../backdrop/kernel/math";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import { DEG, finishUniforms, introProgress, LIGHT, NEUTRAL } from "./glow-kit";
import {
  GRADIENT_WAVES_CAMERA_HEIGHT, GRADIENT_WAVES_FRAGMENT, GRADIENT_WAVES_INTRO_SECONDS, GRADIENT_WAVES_LOOK_TAU, GRADIENT_WAVES_QUALITY,
  GRADIENT_WAVES_STEER_TAU, GRADIENT_WAVES_SWELL_GAIN,
} from "./gradient-waves-shader";

/** 默认三色: 远处天光, 浪身, 浪尖, 都是语义 token 名. */
export const GRADIENT_WAVES_DEFAULT_COLORS = { horizonColor: "primary", waveColor: "accent", crestColor: "foreground" } as const;
/** backgroundColor 的透明值: 不铺底, 画布直通 alpha. */
export const GRADIENT_WAVES_TRANSPARENT = "transparent";
/** 入场时浪前沿起始距离, 世界单位 (本库定): 浪由远处向镜头涌来. */
export const GRADIENT_WAVES_INTRO_REACH = 400;
/** 视角跟随指针的最大偏航 / 俯仰 (弧度, 本库定). */
export const GRADIENT_WAVES_LOOK_SPAN = { yaw: 0.18, pitch: 0.08 } as const;
/** 浪向随指针转过的最大角度 (弧度, 本库定). */
export const GRADIENT_WAVES_STEER_SPAN = 0.35;

export type GradientWavesQuality = keyof typeof GRADIENT_WAVES_QUALITY;

/** height prop 的默认值, 对应相机高 CAMERA_HEIGHT. */
const HEIGHT_REF = 5.5;
/** waveScale 换成主浪波数 (每世界单位) 的倍率 (本库定). */
const WAVE_K = 0.15;
/** 规格默认速度. */
const DEFAULT_SPEED = 0.4;
/** 百分比 prop (swell, turbulence) 换成比例. */
const PERCENT = 100;
/** 基础浪三层正弦的峰值和. */
const BASE_PEAK = 0.92;
/** 湍流噪声的峰值倍率. */
const TURB_PEAK = 0.6;
/** 光源仰角 (弧度, 本库定). */
const LIGHT_ELEVATION = 0.6;
/** 镜头焦距倍率 (本库定), 乘 zoom. */
const FOCAL = 1.4;
/** 兜底渐变角度: 天光在上, 浪在下. */
const FALLBACK_ANGLE = 180;

export interface GradientWavesProps extends BackdropCommonProps {
  /** 远处天光与雾色 (token 名或 CSS 颜色), 默认 token primary. */
  readonly horizonColor?: string;
  /** 浪身色, 默认 token accent. */
  readonly waveColor?: string;
  /** 浪尖与高光色, 默认 token foreground. */
  readonly crestColor?: string;
  /** 底色, 默认 transparent (不铺底). */
  readonly backgroundColor?: string;
  /** 亮底模式: 把光色压成墨色. */
  readonly lightMode?: boolean;
  /** 浪高 (世界单位), 默认 2.5. */
  readonly amplitude?: number;
  /** 浪的密度, 越大浪越碎, 默认 0.6. */
  readonly waveScale?: number;
  /** 横向拉伸比, 越小浪脊越长, 默认 0.9. */
  readonly waveRatio?: number;
  /** 长周期涌浪占比 (百分比), 默认 35. */
  readonly swell?: number;
  /** 碎浪噪声占比 (百分比), 默认 20. */
  readonly turbulence?: number;
  /** 镜头俯仰 (度, 0 为垂直向下, 90 为平视), 默认 64. */
  readonly tilt?: number;
  /** 镜头焦距倍率, 默认 1. */
  readonly zoom?: number;
  /** 镜头离水面的高度, 默认 5.5 (合 30 世界单位). */
  readonly height?: number;
  /** 雾的纵深, 越大看得越远, 默认 15. */
  readonly fogDepth?: number;
  /** 起伏打光强度, 默认 1. */
  readonly relief?: number;
  /** 光源方位 (度), 默认 120. */
  readonly lightAngle?: number;
  /** 镜面高光强度, 默认 0. */
  readonly sheen?: number;
  readonly brightness?: number;
  /** 胶片颗粒 0..1, 默认 0.2. */
  readonly grain?: number;
  /** 步进质量 low / medium / high (56 / 84 / 120 步), 默认 medium. */
  readonly quality?: GradientWavesQuality;
  /** 入场: 2.6 秒内浪由远处向镜头涌来. 默认 true. */
  readonly intro?: boolean;
}

export interface GradientWavesSettings {
  readonly amplitude: number;
  readonly waveScale: number;
  readonly waveRatio: number;
  readonly swell: number;
  readonly turbulence: number;
  readonly tilt: number;
  readonly zoom: number;
  readonly height: number;
  readonly fogDepth: number;
  readonly relief: number;
  readonly lightAngle: number;
  readonly sheen: number;
  readonly brightness: number;
  readonly quality: GradientWavesQuality;
  readonly intro: boolean;
  readonly background: boolean;
}

/** 镜头状态: look 为平滑后的指针偏移 (-1..1), steer 为平滑后的浪向偏转 (弧度). */
export interface WaveView {
  look: [number, number];
  steer: number;
}

export function createWaveView(): WaveView {
  return { look: [0, 0], steer: 0 };
}

/**
 * 按帧推进镜头: 视角以 LOOK_TAU 跟向指针 (离开或关掉交互时回中), 浪向再以 STEER_TAU 跟着视角偏航转. 静态帧 (dt 为 0) 不动.
 *
 * @param view 镜头状态, 原地修改.
 * @param frame 当前帧.
 * @param enabled 是否响应指针.
 */
export function stepWaveView(view: WaveView, frame: Pick<BackdropFrame, "dt" | "pointer">, enabled: boolean): void {
  const { dt, pointer } = frame;
  if (dt <= 0) return;
  const engaged = enabled && pointer.inside;
  const goalX = engaged ? clamp((pointer.x - 0.5) * 2, -1, 1) : 0;
  const goalY = engaged ? clamp((pointer.y - 0.5) * 2, -1, 1) : 0;
  view.look[0] = approach(view.look[0], goalX, dt, GRADIENT_WAVES_LOOK_TAU);
  view.look[1] = approach(view.look[1], goalY, dt, GRADIENT_WAVES_LOOK_TAU);
  view.steer = approach(view.steer, view.look[0] * GRADIENT_WAVES_STEER_SPAN, dt, GRADIENT_WAVES_STEER_TAU);
}

/**
 * 入场三元组 [进度, 浪前沿距离, 是否生效]: 前沿由 INTRO_REACH 缓出收到 0, 结束后不再生效.
 *
 * @param elapsed 内核的出帧真实秒数 (减弱动效时为 Infinity).
 * @param enabled intro prop.
 */
export function waveIntro(elapsed: number, enabled: boolean): [number, number, number] {
  const p = introProgress(elapsed, GRADIENT_WAVES_INTRO_SECONDS, enabled);
  const eased = 1 - (1 - p) ** 3;
  return [p, GRADIENT_WAVES_INTRO_REACH * (1 - eased), p < 1 ? 1 : 0];
}

/** 浪面最高可能高度 (世界单位): 步进从这一高度的平面起算. */
export function waveTop(s: Pick<GradientWavesSettings, "amplitude" | "swell" | "turbulence">): number {
  const amp = Math.max(s.amplitude, 0);
  return amp * (BASE_PEAK + s.swell / PERCENT + (TURB_PEAK * s.turbulence) / PERCENT + GRADIENT_WAVES_SWELL_GAIN);
}

/** 由一帧与镜头状态求 uniform. 纯函数. */
export function gradientWavesUniforms(frame: Pick<BackdropFrame, "colors" | "elapsed">, view: WaveView, s: GradientWavesSettings): UniformMap {
  const light = s.lightAngle * DEG;
  const flat = Math.cos(LIGHT_ELEVATION);
  return {
    u_horizon: frame.colors[0] ?? NEUTRAL,
    u_wave: frame.colors[1] ?? NEUTRAL,
    u_crest: frame.colors[2] ?? LIGHT,
    u_bg: frame.colors[3] ?? NEUTRAL,
    u_bg_on: s.background ? 1 : 0,
    u_amp: Math.max(s.amplitude, 0),
    u_wave_k: Math.max(s.waveScale, 0.01) * WAVE_K,
    u_ratio: s.waveRatio,
    u_swell_amt: s.swell / PERCENT,
    u_turb: s.turbulence / PERCENT,
    u_top: waveTop(s),
    u_eye: (GRADIENT_WAVES_CAMERA_HEIGHT * Math.max(s.height, 0.1)) / HEIGHT_REF,
    u_pitch: (90 - clamp(s.tilt, 0, 89)) * DEG,
    u_focal: FOCAL * Math.max(s.zoom, 0.05),
    u_look: [view.look[0] * GRADIENT_WAVES_LOOK_SPAN.yaw, view.look[1] * GRADIENT_WAVES_LOOK_SPAN.pitch],
    u_steer: view.steer,
    u_fog: Math.max(s.fogDepth, 0.1),
    u_relief: s.relief,
    u_light_dir: [Math.cos(light) * flat, Math.sin(LIGHT_ELEVATION), Math.sin(light) * flat],
    u_sheen: s.sheen,
    u_bright: s.brightness,
    u_steps: GRADIENT_WAVES_QUALITY[s.quality] ?? GRADIENT_WAVES_QUALITY.medium,
    u_intro: waveIntro(frame.elapsed, s.intro),
  };
}

/**
 * 渐变浪: 低空镜头望向一片起伏的浪面, 三层正弦加长周期涌浪与碎浪噪声叠成高度场, 逐像素步进求交;
 * 浪身向浪尖渐变, 按光源方位打光, 远处融进天光雾. 视角与浪向跟随指针, 点击在落点放出外扩涌浪 (同时至多 4 圈);
 * 入场时浪由远处向镜头涌来. 减弱动效时内核只画一帧.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-glow.md
 */
export function GradientWaves(props: GradientWavesProps): JSX.Element {
  const {
    horizonColor = GRADIENT_WAVES_DEFAULT_COLORS.horizonColor, waveColor = GRADIENT_WAVES_DEFAULT_COLORS.waveColor,
    crestColor = GRADIENT_WAVES_DEFAULT_COLORS.crestColor, backgroundColor = GRADIENT_WAVES_TRANSPARENT, lightMode = false, amplitude = 2.5, waveScale = 0.6,
    waveRatio = 0.9, swell = 35, turbulence = 20, tilt = 64, zoom = 1, height = HEIGHT_REF, fogDepth = 15, relief = 1, lightAngle = 120, sheen = 0,
    brightness = 1, grain = 0.2, quality = "medium", intro = true, speed = DEFAULT_SPEED, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon({ ...common, speed });
  const interactive = options.pointer !== false;
  const background = backgroundColor !== GRADIENT_WAVES_TRANSPARENT;
  const view = useRef(createWaveView());
  const settings: GradientWavesSettings = {
    amplitude, waveScale, waveRatio, swell, turbulence, tilt, zoom, height, fogDepth, relief, lightAngle, sheen, brightness, quality, intro, background,
  };
  const colors = [horizonColor, waveColor, crestColor, background ? backgroundColor : horizonColor];
  const handle = useShaderBackdrop(
    {
      fragment: GRADIENT_WAVES_FRAGMENT,
      uniforms: (frame) => {
        stepWaveView(view.current, frame, interactive);
        return { ...gradientWavesUniforms(frame, view.current, settings), ...finishUniforms(lightMode, 0, grain) };
      },
    },
    { ...options, colors, colorFallbacks: [NEUTRAL, NEUTRAL, LIGHT, NEUTRAL] },
  );
  const stops = background ? [horizonColor, waveColor, backgroundColor] : [horizonColor, waveColor];
  return (
    <BackdropShell handle={handle} fallback={fallbackGradient(stops, FALLBACK_ANGLE)} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
