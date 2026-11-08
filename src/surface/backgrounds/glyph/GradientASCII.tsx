"use client";
// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 GradientASCII 条目, 实现为 HX 自有.

import type { JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { fallbackGradient } from "../../backdrop/kernel/fallback";
import type { UniformMap } from "../../backdrop/kernel/gl";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import { DITHER_TRAIL } from "./dither-shader";
import { ASCII_CLICKS, ASCII_SHAPES, GRADIENT_ASCII, GRADIENT_ASCII_FRAGMENT, type AsciiClick, type AsciiShape } from "./gradient-ascii-shader";
import { atlasUniforms, colorList, introProgress, modeOf, MONO_TOKEN } from "./kit";
import { useGlyphAtlas } from "./use-glyph-atlas";

export interface GradientASCIIProps extends BackdropCommonProps {
  /** 渐变色带, 由暗到亮, 最多 8 个 (token 名或 CSS 颜色). 默认 primary, accent, foreground. */
  readonly colors?: readonly string[];
  /** 渐变形状, 默认 horizon. */
  readonly shape?: AsciiShape;
  /** 由浅到密排列的字符, 默认 " =+xX0S8#@". */
  readonly characters?: string;
  /** 字形格高 (CSS 像素), 默认 18. */
  readonly cellSize?: number;
  /** 字形密度 0..1, 默认 0.8. */
  readonly density?: number;
  /** 字形不透明度, 默认 0.85. */
  readonly glyphOpacity?: number;
  /** 辉光强度, 默认 0.2. */
  readonly glow?: number;
  /** 景深: 远离中心的字形化开, 默认 0. */
  readonly depthOfField?: number;
  /** 闪烁幅度, 默认 0.2. */
  readonly flicker?: number;
  /** 形状边缘柔和度, 默认 0.5. */
  readonly softness?: number;
  /** 形状缩放, 默认 1. */
  readonly scale?: number;
  /** 噪声流动扭曲, 默认 0.5. */
  readonly flow?: number;
  /** 字形下渐变底的不透明度, 默认 0.9. */
  readonly gradientOpacity?: number;
  /** 胶片颗粒, 默认 0.08. */
  readonly grain?: number;
  /** 噪声种子偏移, 默认 0. */
  readonly variation?: number;
  /** 指针搅乱字形的半径 (短边归一化), 默认 0.1. */
  readonly scrambleRadius?: number;
  /** 点击效果, 默认 wave. */
  readonly clickEffect?: AsciiClick;
  /** 字形按随机次序显出的入场, 默认 true. */
  readonly intro?: boolean;
  /** 浅色底: 字形压暗, 渐变底减半. */
  readonly lightMode?: boolean;
  /** 字体族或 CSS 变量名, 默认 --font-mono. */
  readonly fontFamily?: string;
}

const DEFAULT_COLORS = ["primary", "accent", "foreground"] as const;
const DEFAULTS = { cellSize: 18, density: 0.8, glyphOpacity: 0.85, glow: 0.2, flicker: 0.2, softness: 0.5, flow: 0.5, gradientOpacity: 0.9, grain: 0.08, scrambleRadius: 0.1 } as const;

type Knobs = Required<Omit<GradientASCIIProps, keyof BackdropCommonProps | "colors" | "fontFamily">>;

/** 本件的 uniform (不含图集纹理), 纯函数, 单测覆盖. */
export function gradientAsciiUniforms(frame: Pick<BackdropFrame, "colors" | "elapsed">, k: Knobs, colorCount: number): UniformMap {
  return {
    u_ramp: colorList(frame.colors, GRADIENT_ASCII.maxColors),
    u_count: Math.min(GRADIENT_ASCII.maxColors, Math.max(1, colorCount)),
    u_shape: modeOf(ASCII_SHAPES, k.shape, "horizon"),
    u_cell: Math.max(4, k.cellSize),
    u_aspect_cell: GRADIENT_ASCII.cellAspect,
    u_density: k.density,
    u_glyph_opacity: k.glyphOpacity,
    u_glow: k.glow,
    u_dof: k.depthOfField,
    u_flicker: k.flicker,
    u_softness: k.softness,
    u_scale: k.scale,
    u_flow: k.flow,
    u_gradient_opacity: k.gradientOpacity,
    u_grain: k.grain,
    u_variation: k.variation,
    u_scramble: k.scrambleRadius,
    u_click: modeOf(ASCII_CLICKS, k.clickEffect, "wave"),
    u_click_life: GRADIENT_ASCII.clickLife,
    u_intro: introProgress(frame.elapsed, GRADIENT_ASCII.introSeconds, k.intro),
    u_light: k.lightMode ? 1 : 0,
  };
}

/**
 * 渐变字符画: 一块缓慢呼吸的渐变形状 (地平线拱, 收腰, 底部升起, 日食环) 按色带上色,
 * 再按格内亮度从 characters 里挑字形 (内核 createGlyphAtlas 画的图集). 指针在拖尾通道留痕, 痕迹内的字形随机翻动;
 * 点击发出波环 (wave) 或一团爆散 (burst), 寿命 1.2 秒. 入场 2.4 秒内字形按随机次序显出.
 * 减弱动效时内核只画一帧, 入场视为已完成; 拿不到 2d 上下文时字形退成方块.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-glyph.md
 */
export function GradientASCII(props: GradientASCIIProps): JSX.Element {
  const {
    colors = DEFAULT_COLORS,
    shape = "horizon",
    characters = GRADIENT_ASCII.characters,
    cellSize = DEFAULTS.cellSize,
    density = DEFAULTS.density,
    glyphOpacity = DEFAULTS.glyphOpacity,
    glow = DEFAULTS.glow,
    depthOfField = 0,
    flicker = DEFAULTS.flicker,
    softness = DEFAULTS.softness,
    scale = 1,
    flow = DEFAULTS.flow,
    gradientOpacity = DEFAULTS.gradientOpacity,
    grain = DEFAULTS.grain,
    variation = 0,
    scrambleRadius = DEFAULTS.scrambleRadius,
    clickEffect = "wave",
    intro = true,
    lightMode = false,
    fontFamily = MONO_TOKEN,
    ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const ramp = colors.slice(0, GRADIENT_ASCII.maxColors);
  const atlas = useGlyphAtlas(characters, fontFamily);
  const k: Knobs = { shape, characters, cellSize, density, glyphOpacity, glow, depthOfField, flicker, softness, scale, flow, gradientOpacity, grain, variation, scrambleRadius, clickEffect, intro, lightMode };
  const handle = useShaderBackdrop(
    {
      fragment: GRADIENT_ASCII_FRAGMENT,
      uniforms: (frame) => ({ ...gradientAsciiUniforms(frame, k, ramp.length), ...atlasUniforms(atlas, characters) }),
      textures: () => ({ u_atlas: atlas?.canvas }),
      passes: [
        {
          name: "u_trail",
          fragment: DITHER_TRAIL,
          scale: GRADIENT_ASCII.trailScale,
          uniforms: (frame) => ({ u_decay: Math.exp(-frame.dt / (GRADIENT_ASCII.trailLife / 2)), u_reach: scrambleRadius }),
        },
      ],
    },
    { ...options, colors: ramp },
  );
  return (
    <BackdropShell handle={handle} fallback={fallbackGradient(ramp)} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
