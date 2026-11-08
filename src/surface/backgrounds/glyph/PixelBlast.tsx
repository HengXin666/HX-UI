"use client";
// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 PixelBlast 条目, 实现为 HX 自有.

import type { JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { fallbackGradient } from "../../backdrop/kernel/fallback";
import type { UniformMap } from "../../backdrop/kernel/gl";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import { colorAt, introProgress, modeOf } from "./kit";
import { PIXEL_BLAST, PIXEL_BLAST_FRAGMENT, PIXEL_HOVERS, PIXEL_SHAPES, type PixelHover, type PixelShape } from "./pixel-blast-shader";

export interface PixelBlastProps extends BackdropCommonProps {
  /** 像素形状, 默认 square. */
  readonly variant?: PixelShape;
  /** 像素边长 (CSS 像素), 默认 3. */
  readonly pixelSize?: number;
  /** 像素颜色 (token 名或 CSS 颜色), 默认 primary. */
  readonly color?: string;
  /** 底色, 默认 background. transparent 为 true 时不铺底. */
  readonly backgroundColor?: string;
  /** 透明底, 默认 false. */
  readonly transparent?: boolean;
  /** 图案缩放, 默认 2. */
  readonly patternScale?: number;
  /** 图案密度 (覆盖度倍率), 默认 1. */
  readonly patternDensity?: number;
  /** 像素尺寸随机抖动 0..1, 默认 0. */
  readonly pixelSizeJitter?: number;
  /** 点击涟漪, 默认 true. */
  readonly enableRipples?: boolean;
  /** 涟漪扩散速度 (短边每秒), 默认 0.4. */
  readonly rippleSpeed?: number;
  /** 涟漪环宽, 默认 0.12. */
  readonly rippleThickness?: number;
  /** 涟漪强度倍率, 默认 1.5. */
  readonly rippleIntensityScale?: number;
  /** 四边淡出宽度, 默认 0.25. */
  readonly edgeFade?: number;
  /** 阈值边缘柔化 0..1, 默认 0 (硬边). */
  readonly softness?: number;
  /** 指针悬停效果, 默认 grow. */
  readonly hover?: PixelHover;
  /** 悬停半径 (短边归一化), 默认 0.2. */
  readonly hoverRadius?: number;
  /** 由中心向外显影的入场, 默认 true. */
  readonly intro?: boolean;
}

const DEFAULTS = { pixelSize: 3, patternScale: 2, rippleSpeed: 0.4, rippleThickness: 0.12, rippleIntensityScale: 1.5, edgeFade: 0.25, hoverRadius: 0.2 } as const;

type Knobs = Required<Omit<PixelBlastProps, keyof BackdropCommonProps | "color" | "backgroundColor">>;

/** 本件的 uniform, 纯函数, 单测覆盖. */
export function pixelBlastUniforms(frame: Pick<BackdropFrame, "colors" | "elapsed">, k: Knobs): UniformMap {
  return {
    u_color: colorAt(frame.colors, 0),
    u_back: colorAt(frame.colors, 1),
    u_opaque: k.transparent ? 0 : 1,
    u_pixel: Math.max(1, k.pixelSize),
    u_shape: modeOf(PIXEL_SHAPES, k.variant, "square"),
    u_scale: k.patternScale,
    u_density: Math.max(0, k.patternDensity),
    u_jitter: Math.max(0, Math.min(1, k.pixelSizeJitter)),
    u_ripples: k.enableRipples ? 1 : 0,
    u_ripple_speed: k.rippleSpeed,
    u_ripple_thickness: k.rippleThickness,
    u_ripple_gain: k.rippleIntensityScale,
    u_ripple_life: PIXEL_BLAST.rippleSeconds,
    u_edge_fade: Math.max(0, k.edgeFade),
    u_softness: Math.max(0, Math.min(1, k.softness)),
    u_hover: modeOf(PIXEL_HOVERS, k.hover, "grow"),
    u_hover_radius: k.hoverRadius,
    u_intro: introProgress(frame.elapsed, PIXEL_BLAST.introSeconds, k.intro),
  };
}

/**
 * 像素爆发: 分形梯度噪声图案场给出覆盖度, 按 pixelSize 分格后与 Bayer 8 阈值比较决定亮灭, 亮格按覆盖度画成方块, 圆, 三角, 菱形, 十字或圆环;
 * 点击发出高斯环涟漪 (最多 8 个, 3 秒), 指针附近像素长大或只在附近显影, 四边淡出. 入场 1.8 秒按 1 - (1 - t) ** 2.4 由中心向外显影.
 * 减弱动效时内核只画一帧, 入场视为已完成.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-glyph.md
 */
export function PixelBlast(props: PixelBlastProps): JSX.Element {
  const {
    variant = "square",
    pixelSize = DEFAULTS.pixelSize,
    color = "primary",
    backgroundColor = "background",
    transparent = false,
    patternScale = DEFAULTS.patternScale,
    patternDensity = 1,
    pixelSizeJitter = 0,
    enableRipples = true,
    rippleSpeed = DEFAULTS.rippleSpeed,
    rippleThickness = DEFAULTS.rippleThickness,
    rippleIntensityScale = DEFAULTS.rippleIntensityScale,
    edgeFade = DEFAULTS.edgeFade,
    softness = 0,
    hover = "grow",
    hoverRadius = DEFAULTS.hoverRadius,
    intro = true,
    ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const k: Knobs = {
    variant, pixelSize, transparent, patternScale, patternDensity, pixelSizeJitter, enableRipples, rippleSpeed, rippleThickness, rippleIntensityScale,
    edgeFade, softness, hover, hoverRadius, intro,
  };
  const handle = useShaderBackdrop(
    { fragment: PIXEL_BLAST_FRAGMENT, uniforms: (frame) => pixelBlastUniforms(frame, k) },
    { ...options, colors: [color, backgroundColor] },
  );
  return (
    <BackdropShell handle={handle} fallback={fallbackGradient(transparent ? [color] : [backgroundColor, color])} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
