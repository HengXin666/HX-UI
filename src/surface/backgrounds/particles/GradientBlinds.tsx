"use client";
// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 GradientBlinds 条目, 实现为 HX 自有.

import { useRef, type JSX } from "react";
import { approach, BackdropShell, fallbackGradient, splitCommon, useShaderBackdrop, type BackdropCommonProps, type BackdropFrame } from "../../backdrop/kernel";
import { BLINDS, BLINDS_FRAGMENT, blindCountFor, blindWaves, stepShift } from "./gradient-blinds-shader";
import { DEG, introProgress, paletteUniform } from "./tokens";

export interface GradientBlindsProps extends BackdropCommonProps {
  /** 渐变色 (token 名或 CSS 颜色), 最多 8 个. 默认 ["primary", "accent"]. */
  readonly gradientColors?: readonly string[];
  /** 百叶旋转角 (度), 默认 0 (竖条). */
  readonly angle?: number;
  /** 颗粒强度, 默认 0.3. */
  readonly noise?: number;
  /** 百叶片数上限, 默认 16. */
  readonly blindCount?: number;
  /** 每片最窄 (CSS 像素), 默认 60; 画布窄时自动减片. */
  readonly blindMinWidth?: number;
  /** 聚光跟随指针的时间常数 (秒), 默认 0.15. */
  readonly mouseDampening?: number;
  /** 渐变来回镜像而不是循环, 默认 false. */
  readonly mirrorGradient?: boolean;
  /** 聚光半径 (短边比例), 默认 0.5. */
  readonly spotlightRadius?: number;
  /** 聚光边缘柔和度 0..1, 默认 1. */
  readonly spotlightSoftness?: number;
  /** 聚光强度 0..1, 默认 1. */
  readonly spotlightOpacity?: number;
  /** 条带波浪扭曲, 默认 0. */
  readonly distortAmount?: number;
  /** 受光边: left 或 right. */
  readonly shineDirection?: "left" | "right";
  /** 高光色, 默认 foreground. */
  readonly lightColor?: string;
  /** 透视: 一侧片宽一侧片窄, 默认 0. */
  readonly perspective?: number;
  /** 渐变平移速度, 默认 0. */
  readonly gradientSpeed?: number;
  /** 片沿高光强度, 默认 0.4. */
  readonly shine?: number;
  /** 片面起伏与压痕深浅, 默认 0.5. */
  readonly relief?: number;
  /** 聚光处的辉光, 默认 0.4. */
  readonly glow?: number;
  /** 百叶随时间轻摆的幅度, 默认 0.35. */
  readonly sway?: number;
  /** 点击泛起涟漪, 默认 true. */
  readonly clickRipple?: boolean;
  /** 入场 1.8s 从左向右展开, 默认 true. */
  readonly intro?: boolean;
}

interface State {
  shift: number;
  mx: number;
  my: number;
  hover: number;
  primed: boolean;
}

const DEFAULT_COLORS = ["primary", "accent"] as const;
const LIGHT_TOKEN = "foreground";

/**
 * 渐变百叶: 一排旋转的百叶条带, 每片有自己的明暗坡度, 压痕与受光沿, 色板沿条带方向渐变并可平移;
 * 指针处一团聚光压平坡度并泛起辉光, 点击泛起涟漪让百叶翻一下, 入场从左向右展开. 减弱动效时只画一帧.
 */
export function GradientBlinds(props: GradientBlindsProps): JSX.Element {
  const {
    gradientColors = DEFAULT_COLORS, angle = 0, noise = 0.3, blindCount = 16, blindMinWidth = 60, mouseDampening = 0.15, mirrorGradient = false,
    spotlightRadius = 0.5, spotlightSoftness = 1, spotlightOpacity = 1, distortAmount = 0, shineDirection = "left", lightColor = LIGHT_TOKEN,
    perspective = 0, gradientSpeed = 0, shine = 0.4, relief = 0.5, glow = 0.4, sway = 0.35, clickRipple = true, intro = true, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const colors = gradientColors.slice(0, BLINDS.maxColors);
  const state = useRef<State>({ shift: 0, mx: 0.5, my: 0.5, hover: 0, primed: false });
  const speed = options.speed ?? 1;

  const uniforms = (frame: BackdropFrame) => {
    const s = state.current;
    const p = frame.pointer;
    s.shift = stepShift(s.shift, frame.dt * speed, gradientSpeed);
    const snap = !s.primed || frame.dt === 0;
    s.primed = true;
    s.mx = snap ? p.x : approach(s.mx, p.x, frame.dt, mouseDampening);
    s.my = snap ? p.y : approach(s.my, p.y, frame.dt, mouseDampening);
    s.hover = frame.dt === 0 ? (p.inside ? 1 : 0) : approach(s.hover, p.inside ? 1 : 0, frame.dt, BLINDS.hoverTau);
    const light = frame.colors[colors.length];
    const scale = frame.fit.scale > 0 ? frame.fit.scale : 1;
    return {
      u_count: blindCountFor(frame.fit.width / scale, blindCount, blindMinWidth),
      u_angle: angle * DEG,
      u_noise: noise,
      u_spot_r: spotlightRadius,
      u_spot_soft: spotlightSoftness,
      u_spot_op: spotlightOpacity,
      u_distort: distortAmount,
      u_shine_dir: shineDirection === "right" ? -1 : 1,
      u_shine: shine,
      u_relief: relief,
      u_glow: glow,
      u_sway: frame.reduced ? 0 : sway,
      u_persp: Math.max(0, perspective),
      u_mirror: mirrorGradient ? 1 : 0,
      u_shift: s.shift,
      u_intro: introProgress(frame.elapsed, BLINDS.introSeconds, intro),
      u_hover: s.hover,
      u_ncolors: Math.max(1, colors.length),
      u_mouse: [s.mx, s.my],
      u_light: light ? [light[0], light[1], light[2]] : [1, 1, 1],
      u_colors: paletteUniform(frame.colors.slice(0, colors.length), BLINDS.maxColors),
      u_waves: { list: blindWaves(clickRipple && !frame.reduced ? p.taps : [], frame.elapsed), size: 4 as const },
    };
  };

  const handle = useShaderBackdrop({ fragment: BLINDS_FRAGMENT, uniforms }, { ...options, colors: [...colors, lightColor] });
  return (
    <BackdropShell handle={handle} fallback={fallbackGradient(colors, 90 + angle)} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
