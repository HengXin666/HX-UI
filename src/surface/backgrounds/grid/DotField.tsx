"use client";
// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 DotField 条目, 实现为 HX 自有.

import { useRef, type JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { fallbackGradient } from "../../backdrop/kernel/fallback";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import { DOT_FIELD_FRAGMENT, DOT_PATTERNS, type DotPattern } from "./dot-field-shader";
import { cssAngleDir, enumOf, follow, introProgress, rgbAt, type Follower } from "./tokens";

/** 规格常数. */
export const DOT_FIELD = {
  /** 入场聚焦时长 (秒). */
  introSeconds: 1.8,
  /** 透镜跟随指针时的出现时间常数 (秒). */
  lensTauIn: 0.18,
  /** 指针离开后透镜消散的时间常数 (秒). */
  lensTauOut: 0.4,
  /** 按住放大的时间常数 (秒). */
  zoomTau: 0.14,
} as const;

export interface DotFieldProps extends BackdropCommonProps {
  /** 点半径 (CSS 像素), 默认 1.5. */
  readonly dotRadius?: number;
  /** 点间距 (CSS 像素), 默认 14. */
  readonly dotSpacing?: number;
  /** 排布: grid / hex / spiral / scatter. */
  readonly pattern?: DotPattern;
  /** 渐变起点色, token 名或 CSS 颜色, 默认 primary. */
  readonly gradientFrom?: string;
  /** 渐变终点色, 默认 accent. */
  readonly gradientTo?: string;
  /** 渐变角 (度, CSS 口径), 默认 135. */
  readonly gradientAngle?: number;
  /** 指针透镜半径 (CSS 像素), 默认 240. */
  readonly cursorRadius?: number;
  /** 透镜放大强度, 默认 0.6. */
  readonly bulgeStrength?: number;
  /** 透镜中心的扭转 (弧度), 默认 0. */
  readonly twist?: number;
  /** 指针光晕色, 默认 foreground. */
  readonly glowColor?: string;
  /** 光晕半径 (CSS 像素), 默认 160. */
  readonly glowRadius?: number;
  /** 光晕强度 0..1, 默认 0.8. */
  readonly glowIntensity?: number;
  /** 静止点的不透明度, 默认 0.55. */
  readonly baseOpacity?: number;
  /** 点径随斜向波起伏的幅度, 默认 0. */
  readonly waveAmplitude?: number;
  /** 点逐个闪烁. */
  readonly sparkle?: boolean;
  /** 按住指针时透镜再放大一倍. */
  readonly holdToZoom?: boolean;
  /** 首帧起 1.8 秒由虚到实聚焦. */
  readonly intro?: boolean;
  /** 浅色底: 光晕压暗点色而不是提亮. */
  readonly lightMode?: boolean;
}

/** 每帧推进透镜在场程度与按压放大, 返回 [lens, zoom]. 纯状态推进, 单测覆盖. */
export function stepLens(lens: Follower, zoom: Follower, frame: Pick<BackdropFrame, "dt" | "pointer">, holdToZoom: boolean): readonly [number, number] {
  const inside = frame.pointer.inside ? 1 : 0;
  follow(lens, inside, frame.dt, DOT_FIELD.lensTauIn, DOT_FIELD.lensTauOut);
  follow(zoom, holdToZoom && frame.pointer.down ? 1 : 0, frame.dt, DOT_FIELD.zoomTau);
  return [lens.value, zoom.value];
}

/**
 * 点阵背景: 四种排布, 斜向渐变着色, 指针处一面放大透镜加光晕, 可选闪烁, 起伏与按住放大.
 * WebGL2 全屏片元逐像素求最近点, 不建实例缓冲.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-grid.md
 */
export function DotField(props: DotFieldProps): JSX.Element {
  const {
    dotRadius = 1.5, dotSpacing = 14, pattern = "grid", gradientFrom = "primary", gradientTo = "accent", gradientAngle = 135,
    cursorRadius = 240, bulgeStrength = 0.6, twist = 0, glowColor = "foreground", glowRadius = 160, glowIntensity = 0.8,
    baseOpacity = 0.55, waveAmplitude = 0, sparkle = false, holdToZoom = true, intro = true, lightMode = false, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const lens = useRef<Follower>({ value: 0 });
  const zoom = useRef<Follower>({ value: 0 });

  const uniforms = (frame: BackdropFrame) => {
    const [lensValue, zoomValue] = stepLens(lens.current, zoom.current, frame, holdToZoom);
    const cssW = frame.fit.width / frame.fit.scale;
    const cssH = frame.fit.height / frame.fit.scale;
    return {
      u_from: rgbAt(frame.colors, 0),
      u_to: rgbAt(frame.colors, 1),
      u_glow: rgbAt(frame.colors, 2),
      u_dir: cssAngleDir(gradientAngle),
      u_mouse: [frame.pointer.x * cssW, frame.pointer.y * cssH],
      u_radius: Math.max(0, dotRadius),
      u_spacing: Math.max(2, dotSpacing),
      u_pattern: enumOf(DOT_PATTERNS, pattern),
      u_cursor: cursorRadius,
      u_bulge: bulgeStrength,
      u_twist: twist,
      u_glow_radius: glowRadius,
      u_glow_strength: glowIntensity,
      u_base: baseOpacity,
      u_wave: waveAmplitude,
      u_sparkle: sparkle ? 1 : 0,
      u_focus: introProgress(frame.elapsed, DOT_FIELD.introSeconds, intro),
      u_lens: lensValue,
      u_zoom: zoomValue,
      u_light: lightMode ? 1 : 0,
    };
  };

  const handle = useShaderBackdrop({ fragment: DOT_FIELD_FRAGMENT, uniforms }, { ...options, colors: [gradientFrom, gradientTo, glowColor] });
  return (
    <BackdropShell handle={handle} fallback={fallbackGradient([gradientFrom, gradientTo], gradientAngle)} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
