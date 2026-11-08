// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 SlicedWaves 条目, 实现为 HX 自有.
"use client";

import { useRef, type CSSProperties, type JSX } from "react";
import { approach, BackdropShell, fallbackGradient, splitCommon, useShaderBackdrop, type BackdropCommonProps, type BackdropFrame } from "../../backdrop/kernel";
import {
  SLICED_INTRO_SECONDS, SLICED_LIFT_IN_TAU, SLICED_LIFT_OUT_TAU, SLICED_LIFT_X_TAU, SLICED_MAX_RIBBONS, SLICED_WAVES_FRAGMENT, stepFocus, type SlicedFocus,
} from "./sliced-waves-shader";
import { clampCount, DEG, introProgress, paletteCount, paletteUniform } from "./tokens";

/** 默认三色 (条目 color1..3): 强调色, 主色, ring. */
const DEFAULT_COLORS: readonly string[] = ["accent", "primary", "ring"];

export interface SlicedWavesProps extends BackdropCommonProps {
  /** 飘带色 (token 名或 CSS 颜色), 至多 8 个, 按飘带序分布. 默认 accent, primary, ring. */
  readonly colors?: readonly string[];
  /** 飘带数, 1..6, 默认 3. */
  readonly ribbons?: number;
  /** 竖条间距 (CSS 像素), 默认 28. */
  readonly spacing?: number;
  /** 竖条宽占间距的比例, 默认 0.5. */
  readonly barWidth?: number;
  /** 飘带高 (画布半高的比例), 默认 0.26. */
  readonly ribbonHeight?: number;
  /** 飘带间距, 默认 0.1. */
  readonly spread?: number;
  /** 起伏幅度, 默认 0.1. */
  readonly amplitude?: number;
  /** 起伏频率, 默认 1. */
  readonly frequency?: number;
  /** 透视强度, 默认 0.45. */
  readonly perspective?: number;
  /** 两侧推远的弯曲量, 默认 0.5. */
  readonly curve?: number;
  /** 竖向边缘虚化, 默认 0.6. */
  readonly blur?: number;
  /** 光强, 默认 1. */
  readonly glow?: number;
  /** 亮度, 默认 1.25. */
  readonly brightness?: number;
  /** 飘带组的纵向位置 (自上而下 0..1), 默认 0.78. */
  readonly position?: number;
  /** 旋转 (度), 默认 0. */
  readonly rotation?: number;
  /** 条身横切段数, 0 不切, 默认 0. */
  readonly slices?: number;
  /** 颗粒, 默认 0.08. */
  readonly grain?: number;
  /** 入场条身从中线长出, 默认 true. */
  readonly intro?: boolean;
  /** 左右淡出宽度, 默认 0. */
  readonly fade?: number;
  /** 宿主的混合模式. */
  readonly mixBlendMode?: CSSProperties["mixBlendMode"];
}

/**
 * 切片波: 几条正弦飘带被切成透视收窄的竖条, 叠加处发白; 指针附近竖条抬起, 指针高度处的飘带被聚焦提亮.
 * WebGL2 全屏片元; 减弱动效只画一帧, WebGL 不可用时铺渐变兜底.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-lines.md
 */
export function SlicedWaves(props: SlicedWavesProps): JSX.Element {
  const {
    colors = DEFAULT_COLORS, ribbons = 3, spacing = 28, barWidth = 0.5, ribbonHeight = 0.26, spread = 0.1, amplitude = 0.1, frequency = 1,
    perspective = 0.45, curve = 0.5, blur = 0.6, glow = 1, brightness = 1.25, position = 0.78, rotation = 0, slices = 0, grain = 0.08, intro = true,
    fade = 0, mixBlendMode, style, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const pointerOn = options.pointer !== false;
  const palette = colors.length > 0 ? colors : DEFAULT_COLORS;
  const state = useRef({ lift: 0, liftX: 0, focus: { value: 0.5, velocity: 0 } as SlicedFocus });

  const uniforms = (frame: BackdropFrame) => {
    const s = state.current;
    const engaged = pointerOn && frame.pointer.inside;
    const x = frame.pointer.x * 2 - 1;
    if (frame.still) {
      s.lift = engaged ? 1 : 0;
      s.liftX = x;
      s.focus.value = frame.pointer.y;
      s.focus.velocity = 0;
    } else {
      s.lift = approach(s.lift, engaged ? 1 : 0, frame.dt, engaged ? SLICED_LIFT_IN_TAU : SLICED_LIFT_OUT_TAU);
      s.liftX = approach(s.liftX, x, frame.dt, SLICED_LIFT_X_TAU);
      stepFocus(s.focus, engaged ? frame.pointer.y : 0.5, frame.dt);
    }
    return {
      u_colors: paletteUniform(frame.colors),
      u_color_count: paletteCount(frame.colors),
      u_ribbons: clampCount(ribbons, SLICED_MAX_RIBBONS),
      u_spacing: spacing,
      u_bar: barWidth,
      u_height: ribbonHeight,
      u_spread: spread,
      u_amp: amplitude,
      u_freq: frequency,
      u_persp: perspective,
      u_curve: curve,
      u_blur: blur,
      u_glow: glow,
      u_bright: brightness,
      u_position: position,
      u_angle: rotation * DEG,
      u_slices: Math.max(Math.round(slices), 0),
      u_grain: grain,
      u_lift: [s.liftX, 0, s.lift],
      u_focus: [s.focus.value, s.lift],
      u_intro: introProgress(frame.elapsed, SLICED_INTRO_SECONDS, intro),
      u_fade: fade,
    };
  };

  const handle = useShaderBackdrop({ fragment: SLICED_WAVES_FRAGMENT, uniforms }, { ...options, colors: palette });
  return (
    <BackdropShell handle={handle} fallback={fallbackGradient(palette)} opacity={opacity} style={{ mixBlendMode, ...style }} {...rest}>
      {children}
    </BackdropShell>
  );
}
