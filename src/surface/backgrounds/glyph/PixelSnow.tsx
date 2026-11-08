"use client";
// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 PixelSnow 条目, 实现为 HX 自有.

import type { JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import type { UniformMap } from "../../backdrop/kernel/gl";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import { colorAt, introProgress, modeOf } from "./kit";
import { PIXEL_SNOW, PIXEL_SNOW_FRAGMENT, pileGrowth, SNOW_PILE, SNOW_VARIANTS, type SnowVariant } from "./pixel-snow-shader";

export interface PixelSnowProps extends BackdropCommonProps {
  /** 雪花颜色 (token 名或 CSS 颜色), 默认 foreground. 底透明, 叠在宿主背景上. */
  readonly color?: string;
  /** 雪花像素图案, 默认 snowflake. */
  readonly variant?: SnowVariant;
  /** 雪量 0..1, 默认 0.5. */
  readonly density?: number;
  /** 风 (横向漂移比例), 默认 0.25. */
  readonly wind?: number;
  /** 摇摆幅度, 默认 0.5. */
  readonly sway?: number;
  /** 雪花尺寸倍率, 默认 1. */
  readonly flakeSize?: number;
  /** 图案像素边长 (CSS 像素), 默认 3. */
  readonly pixelSize?: number;
  /** 景深明暗差 0..1, 默认 0.6. */
  readonly depth?: number;
  /** 亮度, 默认 1. */
  readonly brightness?: number;
  /** 光晕, 默认 0.8. */
  readonly glow?: number;
  /** 闪烁, 默认 0.35. */
  readonly twinkle?: number;
  /** 底部积雪, 指针靠近积雪顶会融化, 默认 false. */
  readonly accumulate?: boolean;
  /** 雪花渐次出现的入场, 默认 true. */
  readonly intro?: boolean;
  /** 向底部淡出的高度比例 0..1, 默认 0. */
  readonly fade?: number;
}

const DEFAULTS = { density: 0.5, wind: 0.25, sway: 0.5, pixelSize: 3, depth: 0.6, glow: 0.8, twinkle: 0.35 } as const;
/** 指针在积雪顶附近时每秒融化的高度比例 (本库定). */
const MELT_PER_SECOND = 1.5;
/** 指针推开雪花的强度. */
const PUSH = 1;

type Knobs = Required<Omit<PixelSnowProps, keyof BackdropCommonProps | "color">>;

/** 上屏的 uniform, 纯函数, 单测覆盖. */
export function pixelSnowUniforms(frame: Pick<BackdropFrame, "colors" | "elapsed">, k: Knobs, mouse: boolean): UniformMap {
  return {
    u_color: colorAt(frame.colors, 0),
    u_variant: modeOf(SNOW_VARIANTS, k.variant, "snowflake"),
    u_density: Math.max(0, Math.min(1, k.density)),
    u_wind: k.wind,
    u_sway: k.sway,
    u_size: Math.max(0.1, k.flakeSize),
    u_pixel: Math.max(1, k.pixelSize),
    u_depth: Math.max(0, Math.min(1, k.depth)),
    u_brightness: k.brightness,
    u_glow: k.glow,
    u_twinkle: k.twinkle,
    u_push: mouse ? PUSH : 0,
    u_intro: introProgress(frame.elapsed, PIXEL_SNOW.introSeconds, k.intro),
    u_fade: Math.max(0, Math.min(1, k.fade)),
    u_pile_on: k.accumulate ? 1 : 0,
    u_pile_max: PIXEL_SNOW.pileMax,
  };
}

/** 积雪通道的 uniform, 纯函数. */
export function snowPileUniforms(frame: Pick<BackdropFrame, "dt">, k: Pick<Knobs, "density" | "accumulate">, speed: number, mouse: boolean): UniformMap {
  return {
    u_grow: k.accumulate ? pileGrowth(k.density, speed, frame.dt) : 0,
    u_melt: mouse ? MELT_PER_SECOND * frame.dt : 0,
    u_on: k.accumulate ? 1 : 0,
    u_pile_max: PIXEL_SNOW.pileMax,
  };
}

/**
 * 像素雪: 五层景深格子里各放一片 9x9 像素雪花 (雪花, 星, 圆点, 冰晶或混合), 近层更大更快更亮; 雪花随风下落并摇摆,
 * 体内按 Bayer 4 抖动成三级明暗 (0.94 - 0.13 每级), 带光晕与闪烁. 指针把附近雪花推开; accumulate 时底部按列积雪, 指针靠近积雪顶会融化.
 * 入场 1.4 秒雪花渐次出现. 底透明. 减弱动效时内核只画一帧.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-glyph.md
 */
export function PixelSnow(props: PixelSnowProps): JSX.Element {
  const {
    color = "foreground",
    variant = "snowflake",
    density = DEFAULTS.density,
    wind = DEFAULTS.wind,
    sway = DEFAULTS.sway,
    flakeSize = 1,
    pixelSize = DEFAULTS.pixelSize,
    depth = DEFAULTS.depth,
    brightness = 1,
    glow = DEFAULTS.glow,
    twinkle = DEFAULTS.twinkle,
    accumulate = false,
    intro = true,
    fade = 0,
    ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const k: Knobs = { variant, density, wind, sway, flakeSize, pixelSize, depth, brightness, glow, twinkle, accumulate, intro, fade };
  const mouse = options.pointer !== false;
  const speed = options.speed ?? 1;
  const handle = useShaderBackdrop(
    {
      fragment: PIXEL_SNOW_FRAGMENT,
      uniforms: (frame) => pixelSnowUniforms(frame, k, mouse),
      passes: [{ name: "u_pile", fragment: SNOW_PILE, scale: PIXEL_SNOW.pileScale, uniforms: (frame) => snowPileUniforms(frame, k, speed, mouse) }],
    },
    { ...options, colors: [color] },
  );
  return (
    <BackdropShell handle={handle} fallback="transparent" opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
