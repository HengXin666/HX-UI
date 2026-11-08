// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 FloatingLines 条目, 实现为 HX 自有.
"use client";

import { useRef, type CSSProperties, type JSX } from "react";
import { BackdropShell, fallbackGradient, splitCommon, useShaderBackdrop, type BackdropCommonProps, type BackdropFrame } from "../../backdrop/kernel";
import {
  dampingTau, FLOATING_BEND_UNIT, FLOATING_DISTANCE_UNIT, FLOATING_INTRO_SECONDS, FLOATING_LINES_FRAGMENT, FLOATING_MAX_LINES, FLOATING_WAVE_Y, FLOATING_WAVES,
  waveFlags, type FloatingWave,
} from "./floating-lines-shader";
import { clampCount, createFollowPointer, introProgress, paletteCount, paletteUniform, stepFollow } from "./tokens";

/** 默认渐变: 主色到强调色. */
const DEFAULT_GRADIENT: readonly string[] = ["primary", "accent"];

export interface FloatingLinesProps extends BackdropCommonProps {
  /** 线的渐变色 (token 名或 CSS 颜色), 至多 8 个, 按线序分布. 默认 primary, accent. */
  readonly linesGradient?: readonly string[];
  /** 启用哪几组, 默认三组全开. */
  readonly enabledWaves?: readonly FloatingWave[];
  /** 每组线数, 1..24, 默认 10. */
  readonly lineCount?: number;
  /** 相邻线间距, 单位为短边的 0.4%, 默认 6. */
  readonly lineDistance?: number;
  /** 上组纵向位置 (以短边为 1 的居中坐标, y 朝上), 默认 0.26. */
  readonly topWavePosition?: number;
  /** 中组纵向位置, 默认 0. */
  readonly middleWavePosition?: number;
  /** 下组纵向位置, 默认 -0.26. */
  readonly bottomWavePosition?: number;
  /** 波动速度倍率 (叠在 speed 上), 默认 1. */
  readonly animationSpeed?: number;
  /** 波幅倍率, 默认 1. */
  readonly amplitude?: number;
  /** 线宽 (CSS 像素), 默认 1. */
  readonly lineWidth?: number;
  /** 实线或虚线. */
  readonly lineStyle?: "solid" | "dashed";
  /** 光晕强度, 默认 1. */
  readonly glow?: number;
  /** 亮度倍率, 默认 1. */
  readonly brightness?: number;
  /** 景深: 外侧的线更虚更暗, 0..1, 默认 0.5. */
  readonly depthOfField?: number;
  /** 左右边缘淡出宽度 (画布宽度的比例), 默认 0. */
  readonly edgeFade?: number;
  /** 是否弯折与视差跟手, 默认 true. */
  readonly interactive?: boolean;
  /** 弯折半径, 单位为短边的 5%, 默认 5. */
  readonly bendRadius?: number;
  /** 弯折强度, 负值把线吸向指针, 正值推开, 默认 -0.5. */
  readonly bendStrength?: number;
  /** 跟手阻尼 (每 1/60 秒走的比例), 默认 0.05. */
  readonly mouseDamping?: number;
  /** 视差开关, 默认 true. */
  readonly parallax?: boolean;
  /** 视差强度, 默认 0.2. */
  readonly parallaxStrength?: number;
  /** 点击处起旋涡, 默认 true. */
  readonly clickSwirl?: boolean;
  /** 入场从左向右扫出, 默认 true. */
  readonly intro?: boolean;
  /** 宿主的混合模式, 默认 normal (颜色来自 token, 明暗主题都可读). */
  readonly mixBlendMode?: CSSProperties["mixBlendMode"];
}

/**
 * 漂浮线: 至多三组平行波浪线, 指针附近弯折, 各组随指针视差平移, 点击处起衰减旋涡.
 * WebGL2 全屏片元; 减弱动效时内核只画一帧 (入场视为结束), WebGL 不可用时铺渐变兜底.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-lines.md
 */
export function FloatingLines(props: FloatingLinesProps): JSX.Element {
  const {
    linesGradient = DEFAULT_GRADIENT, enabledWaves = FLOATING_WAVES, lineCount = 10, lineDistance = 6, topWavePosition = FLOATING_WAVE_Y.top,
    middleWavePosition = FLOATING_WAVE_Y.middle, bottomWavePosition = FLOATING_WAVE_Y.bottom, animationSpeed = 1, amplitude = 1, lineWidth = 1,
    lineStyle = "solid", glow = 1, brightness = 1, depthOfField = 0.5, edgeFade = 0, interactive = true, bendRadius = 5, bendStrength = -0.5,
    mouseDamping = 0.05, parallax = true, parallaxStrength = 0.2, clickSwirl = true, intro = true, mixBlendMode, style, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const follow = useRef(createFollowPointer());
  const pointerOn = options.pointer !== false && interactive;

  const uniforms = (frame: BackdropFrame) => {
    const f = stepFollow(follow.current, frame, dampingTau(mouseDamping), pointerOn);
    return {
      u_colors: paletteUniform(frame.colors),
      u_color_count: paletteCount(frame.colors),
      u_reveal: introProgress(frame.elapsed, FLOATING_INTRO_SECONDS, intro),
      u_count: clampCount(lineCount, FLOATING_MAX_LINES),
      u_spacing: lineDistance * FLOATING_DISTANCE_UNIT,
      u_waves: waveFlags(enabledWaves),
      u_wave_y: [topWavePosition, middleWavePosition, bottomWavePosition],
      u_amp: amplitude,
      u_anim: animationSpeed,
      u_width: lineWidth,
      u_dashed: lineStyle === "dashed",
      u_glow: glow,
      u_bright: brightness,
      u_dof: depthOfField,
      u_edge: edgeFade,
      u_follow: [f.x, f.y, f.presence],
      u_bend: [bendRadius * FLOATING_BEND_UNIT, bendStrength],
      u_parallax: parallax ? parallaxStrength : 0,
      u_swirl: clickSwirl && pointerOn,
    };
  };

  const handle = useShaderBackdrop({ fragment: FLOATING_LINES_FRAGMENT, uniforms }, { ...options, pointer: pointerOn, colors: linesGradient });
  return (
    <BackdropShell handle={handle} fallback={fallbackGradient(linesGradient)} opacity={opacity} style={{ mixBlendMode, ...style }} {...rest}>
      {children}
    </BackdropShell>
  );
}
