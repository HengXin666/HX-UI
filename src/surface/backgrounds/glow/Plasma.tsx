"use client";
// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 Plasma 条目, 实现为 HX 自有.
// 已补 (2026-11-09): 规格的体积像素上限 MAX_VOLUME_PIXELS 按画布尺寸动态定体积通道倍率 (PassSpec.scale 为 getter, 每次 resize 读画布设备像素), 体积不超 160 万像素.

import { useRef, type JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { glowFallback } from "../../backdrop/kernel/fallback";
import type { UniformMap } from "../../backdrop/kernel/gl";
import { approach, clamp } from "../../backdrop/kernel/math";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import { canvasPixels, capPassScale, finishUniforms, introProgress, NEUTRAL, tauOf } from "./glow-kit";
import {
  PLASMA_FRAGMENT, PLASMA_HEAT_FOLLOW_RATE, PLASMA_HEAT_RATE, PLASMA_INTRO_SECONDS, PLASMA_MAX_VOLUME_PIXELS, PLASMA_SPRING, PLASMA_VOLUME, PLASMA_VOLUME_FRAGMENT,
} from "./plasma-shader";

/** 默认光色: 语义 token 名. */
export const PLASMA_DEFAULT_COLOR = "primary";
/** 指针偏离中心换视角偏转的倍率 (弧度, 本库定). */
export const PLASMA_ORBIT_RANGE = 0.5;
/** 体积通道倍率的上下限. */
const QUALITY_RANGE = [0.1, 1] as const;
/** 视线缩放 (规格 uZoom, 无对应 prop). */
const ZOOM = 1;
const FALLBACK_BASE = "background";

export type PlasmaDirection = "forward" | "reverse";

export interface PlasmaProps extends BackdropCommonProps {
  /** 光色 (token 名或 CSS 颜色), 默认 token primary. */
  readonly color?: string;
  /** 穿行方向, 默认 forward. */
  readonly direction?: PlasmaDirection;
  /** 湍流尺度, 默认 1. */
  readonly scale?: number;
  /** 沿视线的扭转, 默认 1. */
  readonly twist?: number;
  /** 湍流起伏, 默认 1. */
  readonly wave?: number;
  /** 光片柔和程度 0..1, 默认 0.5. */
  readonly softness?: number;
  /** 热芯泛白, 默认 1. */
  readonly shine?: number;
  readonly brightness?: number;
  /** 胶片颗粒, 默认 0.04. */
  readonly grain?: number;
  /** 体积通道分辨率倍率 0.1..1, 默认 0.75. */
  readonly quality?: number;
  /** 规格名的指针开关, 与 mouseInteraction 同义, 两者任一为 false 即关. */
  readonly mouseInteractive?: boolean;
  /** 入场: 1.6 秒内由中心外扩. 默认 true. */
  readonly intro?: boolean;
  /** 边缘渐隐 0..1, 默认 0. */
  readonly fade?: number;
  readonly lightMode?: boolean;
}

export interface PlasmaSettings {
  readonly direction: PlasmaDirection;
  readonly scale: number;
  readonly twist: number;
  readonly wave: number;
  readonly softness: number;
  readonly shine: number;
  readonly brightness: number;
  readonly intro: boolean;
}

/** 视角弹簧 (yaw / pitch 与其速度) 和指针热点 (位置与强度). */
export interface PlasmaRig {
  yaw: number;
  pitch: number;
  yawVelocity: number;
  pitchVelocity: number;
  heat: number;
  heatX: number;
  heatY: number;
}

export function createPlasmaRig(): PlasmaRig {
  return { yaw: 0, pitch: 0, yawVelocity: 0, pitchVelocity: 0, heat: 0, heatX: 0.5, heatY: 0.5 };
}

/**
 * 推进视角弹簧与热点: 弹簧加速度 = 40 * (目标 - 当前) - 11 * 速度 (规格原式); 热点进 / 离速率 4 / 2, 位置跟随 8.
 * 静态帧 (dt 为 0) 不动; 关掉交互时目标回正, 热点退去.
 */
export function stepPlasmaRig(rig: PlasmaRig, frame: Pick<BackdropFrame, "dt" | "pointer">, enabled: boolean): void {
  const { dt, pointer } = frame;
  if (dt <= 0) return;
  const engaged = enabled && pointer.inside;
  const goalYaw = engaged ? (pointer.x - 0.5) * PLASMA_ORBIT_RANGE : 0;
  const goalPitch = engaged ? (pointer.y - 0.5) * PLASMA_ORBIT_RANGE : 0;
  rig.yawVelocity += (PLASMA_SPRING.stiffness * (goalYaw - rig.yaw) - PLASMA_SPRING.damping * rig.yawVelocity) * dt;
  rig.pitchVelocity += (PLASMA_SPRING.stiffness * (goalPitch - rig.pitch) - PLASMA_SPRING.damping * rig.pitchVelocity) * dt;
  rig.yaw += rig.yawVelocity * dt;
  rig.pitch += rig.pitchVelocity * dt;
  rig.heat = approach(rig.heat, engaged ? 1 : 0, dt, tauOf(engaged ? PLASMA_HEAT_RATE.enter : PLASMA_HEAT_RATE.leave));
  if (engaged) {
    rig.heatX = approach(rig.heatX, pointer.x, dt, tauOf(PLASMA_HEAT_FOLLOW_RATE));
    rig.heatY = approach(rig.heatY, pointer.y, dt, tauOf(PLASMA_HEAT_FOLLOW_RATE));
  }
}

/**
 * 体积通道倍率: quality 钳到 0.1..1, 再按规格 MAX_VOLUME_PIXELS 封顶 (画布尺寸未知时只按 quality).
 *
 * @param quality 分辨率倍率.
 * @param width 画布设备像素宽.
 * @param height 画布设备像素高.
 */
export function plasmaVolumeScale(quality: number, width = 0, height = 0): number {
  return capPassScale(clamp(quality, QUALITY_RANGE[0], QUALITY_RANGE[1]), width, height, PLASMA_MAX_VOLUME_PIXELS);
}

/** 体积通道 uniform. softness 换成光片锐度 1 - softness. 纯函数. */
export function plasmaVolumeUniforms(rig: PlasmaRig, s: PlasmaSettings): UniformMap {
  return {
    u_scale: Math.max(s.scale, 0.01),
    u_zoom: ZOOM,
    u_twist: s.twist,
    u_wave: s.wave,
    u_sharpness: 1 - clamp(s.softness, 0, 1),
    u_orbit: [rig.yaw, rig.pitch],
    u_dir: s.direction === "reverse" ? -1 : 1,
  };
}

/** 上屏 uniform. 纯函数. */
export function plasmaUniforms(frame: Pick<BackdropFrame, "colors" | "elapsed">, rig: PlasmaRig, s: PlasmaSettings): UniformMap {
  return {
    u_ink: frame.colors[0] ?? NEUTRAL,
    u_shine: s.shine,
    u_brightness: s.brightness,
    u_intro: introProgress(frame.elapsed, PLASMA_INTRO_SECONDS, s.intro),
    u_heat: [rig.heatX, rig.heatY, rig.heat],
  };
}

/**
 * 等离子: 视线穿过沿深度扭转的正弦湍流体, 离屏体积通道累积发光密度, 上屏按 1 - exp(-peak) 收成光幕, 峰值处泛白成热芯.
 * 指针用弹簧带偏视角并在所指处升温; 入场由中心外扩. 减弱动效时内核只画一帧.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-glow.md
 */
export function Plasma(props: PlasmaProps): JSX.Element {
  const {
    color = PLASMA_DEFAULT_COLOR, direction = "forward", scale = 1, twist = 1, wave = 1, softness = 0.5, shine = 1, brightness = 1, grain = 0.04, quality = 0.75,
    mouseInteractive = true, intro = true, fade = 0, lightMode = false, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const interactive = mouseInteractive && options.pointer !== false;
  const rig = useRef(createPlasmaRig());
  const settings: PlasmaSettings = { direction, scale, twist, wave, softness, shine, brightness, intro };
  const handle = useShaderBackdrop(
    {
      fragment: PLASMA_FRAGMENT,
      passes: [
        {
          name: PLASMA_VOLUME,
          fragment: PLASMA_VOLUME_FRAGMENT,
          get scale() {
            return plasmaVolumeScale(quality, ...canvasPixels(handle.canvasRef.current));
          },
          uniforms: (frame) => {
            stepPlasmaRig(rig.current, frame, interactive);
            return plasmaVolumeUniforms(rig.current, settings);
          },
        },
      ],
      uniforms: (frame) => ({ ...plasmaUniforms(frame, rig.current, settings), ...finishUniforms(lightMode, fade, grain) }),
    },
    { ...options, pointer: interactive, colors: [color], colorFallbacks: [NEUTRAL] },
  );
  return (
    <BackdropShell handle={handle} fallback={glowFallback(FALLBACK_BASE, color)} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
