"use client";
// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 LetterGlitch 条目, 实现为 HX 自有.

import type { JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { fallbackGradient } from "../../backdrop/kernel/fallback";
import type { UniformMap } from "../../backdrop/kernel/gl";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import { atlasUniforms, colorAt, colorList, introProgress, modeOf, MONO_TOKEN } from "./kit";
import { GLITCH_CLICKS, glitchRate, LETTER_GLITCH, LETTER_GLITCH_FRAGMENT, stirOf, type GlitchClick } from "./letter-glitch-shader";
import { useGlyphAtlas } from "./use-glyph-atlas";

export interface LetterGlitchProps extends BackdropCommonProps {
  /** 闪烁时的颜色 (token 名或 CSS 颜色), 最多 8 个. 默认 primary, accent, success. */
  readonly glitchColors?: readonly string[];
  /** 静息字形颜色, 默认 muted-foreground. */
  readonly baseColor?: string;
  /** 字符集. */
  readonly characters?: string;
  /** 字体族或 CSS 变量名, 默认 --font-mono. */
  readonly fontFamily?: string;
  /** 字号 (CSS 像素), 默认 14. */
  readonly fontSize?: number;
  /** 行距系数, 默认 0.6. */
  readonly spacing?: number;
  /** 有字的格子比例 0..1, 默认 0.9. */
  readonly density?: number;
  /** 静息字形不透明度, 默认 0.16. */
  readonly baseOpacity?: number;
  /** 闪烁量 0..1, 默认 0.5. */
  readonly glitchAmount?: number;
  /** 闪烁按指数衰减淡出; false 时到寿命直接熄灭. 默认 true. */
  readonly smooth?: boolean;
  /** 指针附近触发闪烁, 默认 true. */
  readonly interactive?: boolean;
  /** 指针影响半径 (CSS 像素), 默认 140. */
  readonly cursorRadius?: number;
  /** 点击效果, 默认 tear (横向撕裂). */
  readonly clickEffect?: GlitchClick;
  /** 噪声调制静息换字速度的程度 0..1, 默认 0.5. */
  readonly flow?: number;
  /** 四边淡出 0..1, 默认 0. */
  readonly edgeFade?: number;
  /** 中心淡出 0..1, 默认 0. */
  readonly centerFade?: number;
  /** 入场 (按随机次序闪现), 默认 true. */
  readonly intro?: boolean;
  /** 底色; 不给时透明, 透出宿主背景. */
  readonly backgroundColor?: string;
}

const DEFAULT_GLITCH = ["primary", "accent", "success"] as const;
const DEFAULTS = { fontSize: 14, spacing: 0.6, density: 0.9, baseOpacity: 0.16, glitchAmount: 0.5, cursorRadius: 140, flow: 0.5 } as const;
/** colors 选项里闪烁色的起始下标: 0 是静息色, 1 是底色. */
const GLITCH_FROM = 2;

type Knobs = Required<Pick<LetterGlitchProps, "fontSize" | "spacing" | "density" | "baseOpacity" | "glitchAmount" | "smooth" | "interactive" | "cursorRadius" | "clickEffect" | "flow" | "edgeFade" | "centerFade" | "intro">> & {
  readonly glitchCount: number;
  readonly hasBack: boolean;
};

/** 本件的 uniform (不含图集), 纯函数, 单测覆盖. */
export function letterGlitchUniforms(frame: Pick<BackdropFrame, "colors" | "elapsed" | "pointer" | "fit">, k: Knobs): UniformMap {
  const height = k.fontSize * (1 + LETTER_GLITCH.spacingGain * k.spacing);
  const css = Math.max(frame.fit.scale, Number.EPSILON);
  return {
    u_palette: colorList(frame.colors.slice(GLITCH_FROM), LETTER_GLITCH.maxColors),
    u_palette_count: Math.max(1, Math.min(LETTER_GLITCH.maxColors, k.glitchCount)),
    u_base: colorAt(frame.colors, 0),
    u_back: colorAt(frame.colors, 1),
    u_has_back: k.hasBack ? 1 : 0,
    u_cell: [height * LETTER_GLITCH.cellAspect, height],
    u_density: k.density,
    u_base_opacity: k.baseOpacity,
    u_rate: glitchRate(k.glitchAmount),
    u_rest: LETTER_GLITCH.restRate,
    u_smooth: k.smooth ? 1 : 0,
    u_radius: k.interactive ? k.cursorRadius : 0,
    u_stir: stirOf(frame.pointer.vx, frame.pointer.vy, frame.fit.width / css, frame.fit.height / css),
    u_tear: modeOf(GLITCH_CLICKS, k.clickEffect, "tear"),
    u_tear_life: LETTER_GLITCH.tearSeconds,
    u_flow: k.flow,
    u_edge_fade: k.edgeFade,
    u_center_fade: k.centerFade,
    u_intro: introProgress(frame.elapsed, LETTER_GLITCH.introSeconds, k.intro),
  };
}

/**
 * 字母闪烁墙: 满屏等宽字形以 baseOpacity 静息, 按噪声调制的慢速换字; 每格按 0.1 * glitchAmount ** 1.6 次每秒的频率
 * 换成闪烁色并快速乱跳, 再淡出 (smooth) 或直接熄灭. 指针半径内按移动速度加触发, 点击沿横向撕开几行 (tear).
 * 入场 1.4 秒内各格按随机次序闪现. 减弱动效时内核只画一帧. 拿不到 2d 上下文时字形退成方块.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-glyph.md
 */
export function LetterGlitch(props: LetterGlitchProps): JSX.Element {
  const {
    glitchColors = DEFAULT_GLITCH,
    baseColor = "muted-foreground",
    characters = LETTER_GLITCH.characters,
    fontFamily = MONO_TOKEN,
    fontSize = DEFAULTS.fontSize,
    spacing = DEFAULTS.spacing,
    density = DEFAULTS.density,
    baseOpacity = DEFAULTS.baseOpacity,
    glitchAmount = DEFAULTS.glitchAmount,
    smooth = true,
    interactive = true,
    cursorRadius = DEFAULTS.cursorRadius,
    clickEffect = "tear",
    flow = DEFAULTS.flow,
    edgeFade = 0,
    centerFade = 0,
    intro = true,
    backgroundColor,
    ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const glitch = glitchColors.slice(0, LETTER_GLITCH.maxColors);
  const colors = [baseColor, backgroundColor ?? baseColor, ...glitch];
  const atlas = useGlyphAtlas(characters, fontFamily);
  const k: Knobs = { fontSize, spacing, density, baseOpacity, glitchAmount, smooth, interactive, cursorRadius, clickEffect, flow, edgeFade, centerFade, intro, glitchCount: glitch.length, hasBack: backgroundColor !== undefined };
  const handle = useShaderBackdrop(
    {
      fragment: LETTER_GLITCH_FRAGMENT,
      uniforms: (frame) => ({ ...letterGlitchUniforms(frame, k), ...atlasUniforms(atlas, characters) }),
      textures: () => ({ u_atlas: atlas?.canvas }),
    },
    { ...options, colors },
  );
  return (
    <BackdropShell handle={handle} fallback={fallbackGradient(backgroundColor ? [backgroundColor, ...glitch] : glitch)} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
