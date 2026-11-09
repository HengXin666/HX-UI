"use client";
// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Iridescence 条目, 实现为 HX 自有.
// 已补 (2026-11-09): 规格的搅动场固定 48 列 (FIELD_COLUMNS): 乒乓通道倍率取 48 / 画布设备像素宽 (PassSpec.scale 为 getter, 每次 resize 读画布), 恰 48 列, 行数随宽高比.

import { useRef, type JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { fallbackGradient } from "../../backdrop/kernel/fallback";
import type { UniformMap } from "../../backdrop/kernel/gl";
import { clamp } from "../../backdrop/kernel/math";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import { canvasPixels, createFollower, DEG, finishUniforms, LIGHT, stepFollower, tauOf, type Follower } from "./glow-kit";
import {
  IRIDESCENCE_FIELD, IRIDESCENCE_FIELD_COLUMNS, IRIDESCENCE_FIELD_DECAY, IRIDESCENCE_FIELD_FRAGMENT, IRIDESCENCE_FOLLOW_RATE, IRIDESCENCE_FRAGMENT, IRIDESCENCE_MAX_DETAIL,
  IRIDESCENCE_PRESENCE_RATE,
} from "./iridescence-shader";

/** 默认着色: 语义 token foreground (暗底下近白, 即基本不改虹彩本色). */
export const IRIDESCENCE_DEFAULT_COLOR = "foreground";
/** 画布尺寸未知时的搅动场倍率 (本库定, 约合 1/16 画布); 内核随后按真实尺寸 resize 时换成恰 48 列. */
const UNKNOWN_FIELD_SCALE = 0.0625;
/** 规格 dpr = min(devicePixelRatio, 2) * resolution 里的 2. */
const DPR_CAP = 2;
/** 兜底色标: 语义 token 名. */
const FALLBACK_STOPS = ["primary", "accent", "primary-glow"] as const;

export interface IridescenceProps extends BackdropCommonProps {
  /** 乘在虹彩上的着色 (token 名或 CSS 颜色), 默认 token foreground. */
  readonly color?: string;
  /** 指针牵动整片纹理的幅度, 默认 0.1. */
  readonly amplitude?: number;
  /** 规格名的指针开关, 与 mouseInteraction 同义, 两者任一为 false 即关. */
  readonly mouseReact?: boolean;
  /** 纹理尺度, 默认 1. */
  readonly scale?: number;
  /** 迭代细节层数 1..12, 默认 8. */
  readonly detail?: number;
  /** 旋转 (度), 默认 0. */
  readonly rotation?: number;
  /** 每层扭曲量, 默认 1. */
  readonly warp?: number;
  /** 色相偏移 (圈), 默认 0. */
  readonly hueShift?: number;
  readonly saturation?: number;
  readonly brightness?: number;
  readonly contrast?: number;
  /** 指针划过搅动纹理的力度, 默认 0.5. */
  readonly stir?: number;
  /** 薄膜高光, 默认 0.3. */
  readonly sheen?: number;
  /** 点击放出旋涡 (同时至多 6 个, 寿命 3.2 秒), 默认 true. */
  readonly clickSwirl?: boolean;
  /** 胶片颗粒 0..1, 默认 0. */
  readonly grain?: number;
  /** 边缘渐隐 0..1, 默认 0. */
  readonly fade?: number;
  /** 渲染分辨率倍率, 乘在像素比上限上, 默认 1. */
  readonly resolution?: number;
}

export interface IridescenceSettings {
  readonly amplitude: number;
  readonly scale: number;
  readonly detail: number;
  readonly rotation: number;
  readonly warp: number;
  readonly hueShift: number;
  readonly saturation: number;
  readonly brightness: number;
  readonly contrast: number;
  readonly stir: number;
  readonly sheen: number;
  readonly clickSwirl: boolean;
}

/** 像素比上限: 规格 min(dpr, 2) * resolution; 用户给了 dpr 时以它为底. */
export function iridescenceDpr(resolution: number, dpr?: number): number {
  return (dpr ?? DPR_CAP) * clamp(resolution, 0.1, 1);
}

/**
 * 搅动场通道倍率: 48 / 画布设备像素宽, 内核 feedbackSize 取整后恰为 FIELD_COLUMNS 列, 行数随宽高比; 画布窄于 48 像素时为 1 (每像素一格).
 *
 * @param width 画布设备像素宽, 0 表示未知.
 */
export function iridescenceFieldScale(width: number): number {
  return width > 0 ? Math.min(1, IRIDESCENCE_FIELD_COLUMNS / width) : UNKNOWN_FIELD_SCALE;
}

/** 搅动场通道 uniform: 衰减 exp(-dt * 1.4), 指针位置与速度注入. 纯函数. */
export function iridescenceFieldUniforms(frame: Pick<BackdropFrame, "dt">, follower: Follower, stir: number): UniformMap {
  return {
    u_decay: Math.exp(-frame.dt * IRIDESCENCE_FIELD_DECAY),
    u_splat: [follower.x, follower.y, follower.presence],
    u_force: [follower.vx * stir, follower.vy * stir],
  };
}

/** 上屏 uniform. 纯函数. */
export function iridescenceUniforms(frame: Pick<BackdropFrame, "colors">, follower: Follower, s: IridescenceSettings): UniformMap {
  return {
    u_color: frame.colors[0] ?? LIGHT,
    u_amplitude: s.amplitude,
    u_scale: Math.max(s.scale, 0.01),
    u_detail: clamp(Math.round(s.detail), 1, IRIDESCENCE_MAX_DETAIL),
    u_turn: s.rotation * DEG,
    u_warp: s.warp,
    u_hue: s.hueShift,
    u_saturation: s.saturation,
    u_brightness: s.brightness,
    u_contrast: s.contrast,
    u_stir: s.stir,
    u_sheen: s.sheen,
    u_swirl_on: s.clickSwirl ? 1 : 0,
    u_mouse: [follower.x, follower.y, follower.presence],
  };
}

/**
 * 虹彩: 逐层正弦扭曲叠出油膜似的干涉纹, 相位按余弦色盘换成虹彩, 带一道薄膜高光.
 * 指针牵动整片纹理并在低分辨率搅动场里留下会衰减的流动, 点击放出旋涡. 减弱动效时内核只画一帧.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-glow.md
 */
export function Iridescence(props: IridescenceProps): JSX.Element {
  const {
    color = IRIDESCENCE_DEFAULT_COLOR, amplitude = 0.1, mouseReact = true, scale = 1, detail = 8, rotation = 0, warp = 1, hueShift = 0, saturation = 1,
    brightness = 1.5, contrast = 1, stir = 0.5, sheen = 0.3, clickSwirl = true, grain = 0, fade = 0, resolution = 1, dpr, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon({ ...common, dpr: iridescenceDpr(resolution, dpr) });
  const interactive = mouseReact && options.pointer !== false;
  const follower = useRef(createFollower());
  const settings: IridescenceSettings = { amplitude, scale, detail, rotation, warp, hueShift, saturation, brightness, contrast, stir, sheen, clickSwirl };
  const handle = useShaderBackdrop(
    {
      fragment: IRIDESCENCE_FRAGMENT,
      passes: [
        {
          name: IRIDESCENCE_FIELD,
          fragment: IRIDESCENCE_FIELD_FRAGMENT,
          get scale() {
            return iridescenceFieldScale(canvasPixels(handle.canvasRef.current)[0]);
          },
          uniforms: (frame) => {
            const presence = tauOf(IRIDESCENCE_PRESENCE_RATE);
            stepFollower(follower.current, frame, { move: tauOf(IRIDESCENCE_FOLLOW_RATE), enter: presence, leave: presence }, interactive);
            return iridescenceFieldUniforms(frame, follower.current, stir);
          },
        },
      ],
      uniforms: (frame) => ({ ...iridescenceUniforms(frame, follower.current, settings), ...finishUniforms(false, fade, grain) }),
    },
    { ...options, pointer: options.pointer !== false && (mouseReact || clickSwirl), colors: [color], colorFallbacks: [LIGHT] },
  );
  return (
    <BackdropShell handle={handle} fallback={fallbackGradient(FALLBACK_STOPS)} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
