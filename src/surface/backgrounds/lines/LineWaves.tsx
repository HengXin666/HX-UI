// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 LineWaves 条目, 实现为 HX 自有.
"use client";

import { useRef, type CSSProperties, type JSX } from "react";
import { approach, BackdropShell, fallbackGradient, splitCommon, useShaderBackdrop, type BackdropCommonProps, type BackdropFrame } from "../../backdrop/kernel";
import {
  LINE_WAVES_CYCLE_RATE, LINE_WAVES_FOLLOW_TAU, LINE_WAVES_FRAGMENT, LINE_WAVES_INTRO_SECONDS, LINE_WAVES_MAX_LINES, LINE_WAVES_MAX_RIPPLES,
  LINE_WAVES_PRESENCE_TAU, revealSweep,
} from "./line-waves-shader";
import { clampCount, createFollowPointer, DEG, introProgress, paletteCount, paletteUniform, stepFollow } from "./tokens";

/** 默认三色: 主色, 强调色, 前景色 (条目 color1..3). */
const DEFAULT_COLORS: readonly string[] = ["primary", "accent", "foreground"];
/** 条目默认速度 0.3, 作为本件 speed 的默认值. */
const DEFAULT_SPEED = 0.3;

export interface LineWavesProps extends BackdropCommonProps {
  /** 循环色 (token 名或 CSS 颜色), 至多 8 个, 默认 primary, accent, foreground. */
  readonly colors?: readonly string[];
  /** 颜色循环速度倍率, 默认 1. */
  readonly colorCycleSpeed?: number;
  /** 每个短边内的线数, 默认 72. */
  readonly lineCount?: number;
  /** 线宽 (CSS 像素), 默认 1.3. */
  readonly lineWidth?: number;
  /** 光晕强度, 默认 0.6. */
  readonly glow?: number;
  /** 亮度倍率, 默认 1. */
  readonly brightness?: number;
  /** 游走高光带强度, 默认 1. */
  readonly highlight?: number;
  /** 高光带宽度倍率, 默认 1. */
  readonly highlightWidth?: number;
  /** 域扭曲强度, 默认 1. */
  readonly warpIntensity?: number;
  /** 域扭曲尺度, 默认 1. */
  readonly warpScale?: number;
  /** 线组旋转 (度), 默认 -33. */
  readonly rotation?: number;
  /** 四边淡出宽度 (画布比例), 默认 0. */
  readonly edgeFade?: number;
  /** 指针透镜推开线的强度, 默认 2. */
  readonly mouseInfluence?: number;
  /** 点击起涟漪, 默认 true. */
  readonly clickRipple?: boolean;
  /** 入场从左向右扫出, 默认 true. */
  readonly intro?: boolean;
  /** 浅色底: 高光不发白, 默认 false. */
  readonly lightMode?: boolean;
  /** 宿主的混合模式. */
  readonly mixBlendMode?: CSSProperties["mixBlendMode"];
}

/**
 * 线波: 旋转的平行线组被正弦域扭曲, 高光带缓慢游走, 颜色循环; 指针透镜推开线, 点击起涟漪.
 * WebGL2 全屏片元; 减弱动效只画一帧, WebGL 不可用时铺渐变兜底.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-lines.md
 */
export function LineWaves(props: LineWavesProps): JSX.Element {
  const {
    colors = DEFAULT_COLORS, colorCycleSpeed = 1, lineCount = 72, lineWidth = 1.3, glow = 0.6, brightness = 1, highlight = 1, highlightWidth = 1,
    warpIntensity = 1, warpScale = 1, rotation = -33, edgeFade = 0, mouseInfluence = 2, clickRipple = true, intro = true, lightMode = false,
    mixBlendMode, style, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const follow = useRef(createFollowPointer());
  const presence = useRef(0);
  const pointerOn = options.pointer !== false;
  const palette = colors.length > 0 ? colors : DEFAULT_COLORS;

  const uniforms = (frame: BackdropFrame) => {
    const f = stepFollow(follow.current, frame, LINE_WAVES_FOLLOW_TAU, pointerOn);
    const target = pointerOn ? frame.pointer.presence : 0;
    presence.current = frame.still ? target : approach(presence.current, target, frame.dt, LINE_WAVES_PRESENCE_TAU);
    const aspect = Math.max(frame.fit.width, frame.fit.height) / Math.max(Math.min(frame.fit.width, frame.fit.height), 1);
    return {
      u_colors: paletteUniform(frame.colors),
      u_color_count: paletteCount(frame.colors),
      u_lines: clampCount(lineCount, LINE_WAVES_MAX_LINES),
      u_width: lineWidth,
      u_glow: glow,
      u_bright: brightness,
      u_highlight: highlight,
      u_hl_width: highlightWidth,
      u_warp: warpIntensity,
      u_warp_scale: warpScale,
      u_angle: rotation * DEG,
      u_edge: edgeFade,
      u_lens: [f.x, f.y, presence.current],
      u_influence: mouseInfluence,
      u_ripples: clickRipple && pointerOn ? LINE_WAVES_MAX_RIPPLES : 0,
      u_sweep: revealSweep(introProgress(frame.elapsed, LINE_WAVES_INTRO_SECONDS, intro), aspect),
      u_cycle: frame.time * colorCycleSpeed * LINE_WAVES_CYCLE_RATE,
      u_light: lightMode,
    };
  };

  const handle = useShaderBackdrop({ fragment: LINE_WAVES_FRAGMENT, uniforms }, { ...options, speed: options.speed ?? DEFAULT_SPEED, colors: palette });
  return (
    <BackdropShell handle={handle} fallback={fallbackGradient(palette)} opacity={opacity} style={{ mixBlendMode, ...style }} {...rest}>
      {children}
    </BackdropShell>
  );
}
