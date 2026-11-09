"use client";
// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 DarkVeil 条目, 实现为 HX 自有.
// 已补 (2026-11-09): 规格的场像素上限 MAX_FIELD_PIXELS 按画布尺寸动态定场通道倍率 (PassSpec.scale 为 getter, 每次 resize 读画布设备像素), 场不超 90 万像素.

import { useRef, type JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { glowFallback } from "../../backdrop/kernel/fallback";
import type { UniformMap } from "../../backdrop/kernel/gl";
import { approach, clamp } from "../../backdrop/kernel/math";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import {
  DARK_VEIL_DRAG_RATE, DARK_VEIL_FIELD, DARK_VEIL_FIELD_FRAGMENT, DARK_VEIL_FOLLOW_RATE, DARK_VEIL_FRAGMENT, DARK_VEIL_INTRO_SECONDS, DARK_VEIL_LIGHT_RATE,
  DARK_VEIL_MAX_FIELD_PIXELS, DARK_VEIL_TOUCH_RATE,
} from "./dark-veil-shader";
import { canvasPixels, capPassScale, createFollower, DEG, finishUniforms, introProgress, NEUTRAL, stepFollower, tauOf, type Follower } from "./glow-kit";

/** 默认墨色: 语义 token 名. */
export const DARK_VEIL_DEFAULT_COLOR = "primary";
/** 规格默认速度 0.5. */
const DEFAULT_SPEED = 0.5;
/** 场通道倍率的上下限. */
const QUALITY_RANGE = [0.1, 1] as const;
/** variation 换成噪声种子偏移的倍率 (本库定). */
const SEED_SPAN = 37.3;
const FALLBACK_BASE = "background";

export interface DarkVeilProps extends BackdropCommonProps {
  /** 墨色 (token 名或 CSS 颜色), 默认 token primary. */
  readonly color?: string;
  /** 纹理缩放, 默认 1. */
  readonly scale?: number;
  /** 纹理旋转 (度), 默认 0. */
  readonly rotation?: number;
  /** 流动速率, 默认 1. */
  readonly flow?: number;
  /** 额外的域扭曲, 默认 0. */
  readonly warp?: number;
  /** 变体: 换一组噪声种子, 默认 0. */
  readonly variation?: number;
  readonly brightness?: number;
  /** 镜面高光 0..1, 默认 0. */
  readonly sheen?: number;
  /** 指针光晕强度, 默认 0.4. */
  readonly glow?: number;
  /** 胶片颗粒, 默认 0.03. */
  readonly grain?: number;
  /** 场通道分辨率倍率 0.1..1, 默认 0.5. */
  readonly quality?: number;
  /** 指针拖拽推动纹理的力度, 默认 1. */
  readonly mouseStrength?: number;
  /** 入场: 1.8 秒由中心向外显出. 默认 true. */
  readonly intro?: boolean;
  /** 边缘渐隐 0..1, 默认 0. */
  readonly fade?: number;
  readonly lightMode?: boolean;
}

export interface DarkVeilSettings {
  readonly scale: number;
  readonly rotation: number;
  readonly flow: number;
  readonly warp: number;
  readonly variation: number;
  readonly brightness: number;
  readonly sheen: number;
  readonly glow: number;
  readonly mouseStrength: number;
  readonly intro: boolean;
}

/** 光源位置: 比指针跟随更慢一拍 (规格 light follow 速率 4). */
export interface VeilLight {
  x: number;
  y: number;
}

/**
 * 场通道倍率: quality 钳到 0.1..1, 再按规格 MAX_FIELD_PIXELS 封顶 (画布尺寸未知时只按 quality).
 *
 * @param quality 分辨率倍率.
 * @param width 画布设备像素宽.
 * @param height 画布设备像素高.
 */
export function veilFieldScale(quality: number, width = 0, height = 0): number {
  return capPassScale(clamp(quality, QUALITY_RANGE[0], QUALITY_RANGE[1]), width, height, DARK_VEIL_MAX_FIELD_PIXELS);
}

/** 场通道 uniform. 纯函数. */
export function veilFieldUniforms(follower: Follower, s: DarkVeilSettings): UniformMap {
  return {
    u_scale: Math.max(s.scale, 0.01),
    u_turn: s.rotation * DEG,
    u_flow: s.flow,
    u_warp: s.warp,
    u_seed: s.variation * SEED_SPAN,
    u_drag: [follower.x, follower.y, follower.presence],
    u_vel: [follower.vx * s.mouseStrength, follower.vy * s.mouseStrength],
  };
}

/** 上屏 uniform. 纯函数. */
export function veilCompositeUniforms(frame: Pick<BackdropFrame, "colors" | "elapsed">, follower: Follower, light: VeilLight, s: DarkVeilSettings): UniformMap {
  return {
    u_ink: frame.colors[0] ?? NEUTRAL,
    u_brightness: s.brightness,
    u_sheen: s.sheen,
    u_glow: s.glow,
    u_intro: introProgress(frame.elapsed, DARK_VEIL_INTRO_SECONDS, s.intro),
    u_light_at: [light.x, light.y, follower.presence],
  };
}

/**
 * 暗纱: 域扭曲分形噪声作高度场 (低分辨率离屏通道), 上屏时按法线与跟随指针的光源打光, 收成一层墨色薄纱.
 * 指针拖过处纹理被推开并亮起光晕; 入场由中心向外显出. 减弱动效时内核只画一帧.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-glow.md
 */
export function DarkVeil(props: DarkVeilProps): JSX.Element {
  const {
    color = DARK_VEIL_DEFAULT_COLOR, scale = 1, rotation = 0, flow = 1, warp = 0, variation = 0, brightness = 1, sheen = 0, glow = 0.4, grain = 0.03,
    quality = 0.5, mouseStrength = 1, intro = true, fade = 0, lightMode = false, speed = DEFAULT_SPEED, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon({ ...common, speed });
  const interactive = options.pointer !== false;
  const follower = useRef(createFollower());
  const light = useRef<VeilLight>({ x: follower.current.x, y: follower.current.y });
  const settings: DarkVeilSettings = { scale, rotation, flow, warp, variation, brightness, sheen, glow, mouseStrength, intro };
  const handle = useShaderBackdrop(
    {
      fragment: DARK_VEIL_FRAGMENT,
      passes: [
        {
          name: DARK_VEIL_FIELD,
          fragment: DARK_VEIL_FIELD_FRAGMENT,
          get scale() {
            return veilFieldScale(quality, ...canvasPixels(handle.canvasRef.current));
          },
          uniforms: (frame) => {
            const taus = { move: tauOf(DARK_VEIL_FOLLOW_RATE), drag: tauOf(DARK_VEIL_DRAG_RATE), enter: tauOf(DARK_VEIL_TOUCH_RATE.enter), leave: tauOf(DARK_VEIL_TOUCH_RATE.leave) };
            stepFollower(follower.current, frame, taus, interactive);
            light.current.x = approach(light.current.x, follower.current.x, frame.dt, tauOf(DARK_VEIL_LIGHT_RATE));
            light.current.y = approach(light.current.y, follower.current.y, frame.dt, tauOf(DARK_VEIL_LIGHT_RATE));
            return veilFieldUniforms(follower.current, settings);
          },
        },
      ],
      uniforms: (frame) => ({ ...veilCompositeUniforms(frame, follower.current, light.current, settings), ...finishUniforms(lightMode, fade, grain) }),
    },
    { ...options, colors: [color], colorFallbacks: [NEUTRAL] },
  );
  return (
    <BackdropShell handle={handle} fallback={glowFallback(FALLBACK_BASE, color)} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
