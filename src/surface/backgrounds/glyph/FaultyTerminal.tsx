"use client";
// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 FaultyTerminal 条目, 实现为 HX 自有.

import type { JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { glowFallback } from "../../backdrop/kernel/fallback";
import type { UniformMap } from "../../backdrop/kernel/gl";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import {
  FAULTY_TERMINAL, FAULTY_TERMINAL_FRAGMENT, phosphorDecay, TERMINAL_CLICKS, TERMINAL_GLYPHS, TERMINAL_SCREEN, type TerminalClick, type TerminalGlyphs,
} from "./faulty-terminal-shader";
import { atlasUniforms, colorAt, introProgress, modeOf, MONO_TOKEN } from "./kit";
import { useGlyphAtlas } from "./use-glyph-atlas";

export interface FaultyTerminalProps extends BackdropCommonProps {
  /** 格子缩放, 越大格子越大, 默认 1. */
  readonly scale?: number;
  /** 横纵两向的格子密度倍率, 默认 [2, 1]. */
  readonly gridMul?: readonly [number, number];
  /** 字形在格内的缩放 (越大越小), 默认 1.5. */
  readonly digitSize?: number;
  /** 噪声场的时间倍率, 默认 0.3. */
  readonly timeScale?: number;
  /** 停在当前画面 (等同公共的 paused). */
  readonly pause?: boolean;
  /** 扫描线强度 0..1, 默认 0.3. */
  readonly scanlineIntensity?: number;
  /** 随机横向故障幅度, 默认 1. */
  readonly glitchAmount?: number;
  /** 闪烁幅度, 默认 1. */
  readonly flickerAmount?: number;
  /** 噪声场幅度, 默认 1. */
  readonly noiseAmp?: number;
  /** 色差, 默认 0. */
  readonly chromaticAberration?: number;
  /** 有序抖动, 默认 0. */
  readonly dither?: number;
  /** 屏幕弯曲, 默认 0.2. */
  readonly curvature?: number;
  /** 荧光色 (token 名或 CSS 颜色), 默认 foreground. */
  readonly tint?: string;
  /** 屏幕底色, 默认 background. */
  readonly backgroundColor?: string;
  /** 指针推开噪声场并点亮附近字形, 默认 true. */
  readonly mouseReact?: boolean;
  /** 指针影响范围 (短边归一化), 默认 0.2. */
  readonly mouseStrength?: number;
  /** 入场: 字形按随机次序亮起, 默认 true. */
  readonly pageLoadAnimation?: boolean;
  /** 亮度, 默认 1. */
  readonly brightness?: number;
  /** 字形画法, 默认 blocks. */
  readonly glyphs?: TerminalGlyphs;
  /** 辉光, 默认 0.5. */
  readonly glow?: number;
  /** 荧光余辉 0..1, 默认 0.5. */
  readonly persistence?: number;
  /** 指针附近乱码翻动速度, 默认 0.5. */
  readonly scramble?: number;
  /** 指针附近增亮, 默认 0.6. */
  readonly mouseGlow?: number;
  /** 暗角, 默认 0.25. */
  readonly vignette?: number;
  /** 点击效果, 默认 glitch. */
  readonly clickEffect?: TerminalClick;
  /** characters 画法的字体族或 CSS 变量名. */
  readonly fontFamily?: string;
}

/** 入场时长, 秒. */
export const TERMINAL_INTRO_SECONDS = 2;
const GRID_MUL: readonly [number, number] = [2, 1];
/** 余辉, 辉光与乱码速度的默认值. */
const HALF = 0.5;
/** 缩放与密度的下限, 防止格子退化. */
const MIN_SCALE = 0.1;
const DEFAULTS = { digitSize: 1.5, timeScale: 0.3, scanlineIntensity: 0.3, curvature: 0.2, mouseStrength: 0.2, glow: HALF, persistence: HALF, scramble: HALF, mouseGlow: 0.6, vignette: 0.25 } as const;

type Knobs = Required<Omit<FaultyTerminalProps, keyof BackdropCommonProps | "pause" | "tint" | "backgroundColor" | "fontFamily">>;

/** 屏幕通道的 uniform (不含图集), 纯函数, 单测覆盖. */
export function terminalScreenUniforms(frame: Pick<BackdropFrame, "elapsed" | "dt">, k: Knobs): UniformMap {
  const base = FAULTY_TERMINAL.baseCell * Math.max(MIN_SCALE, k.scale);
  return {
    u_cell: [base / Math.max(MIN_SCALE, k.gridMul[0]), base / Math.max(MIN_SCALE, k.gridMul[1])],
    u_digit: k.digitSize,
    u_noise_amp: k.noiseAmp,
    u_glyphs: modeOf(TERMINAL_GLYPHS, k.glyphs, "blocks"),
    u_decay: phosphorDecay(k.persistence, frame.dt),
    u_scramble: k.scramble,
    u_mouse: k.mouseReact ? 1 : 0,
    u_mouse_strength: k.mouseStrength,
    u_mouse_glow: k.mouseGlow,
    u_intro: introProgress(frame.elapsed, TERMINAL_INTRO_SECONDS, k.pageLoadAnimation),
    u_flicker: k.flickerAmount,
    u_time_scale: k.timeScale,
  };
}

/** 上屏的 uniform, 纯函数. */
export function terminalUniforms(frame: Pick<BackdropFrame, "colors">, k: Knobs): UniformMap {
  const click = modeOf(TERMINAL_CLICKS, k.clickEffect, "glitch");
  return {
    u_tint: colorAt(frame.colors, 0),
    u_back: colorAt(frame.colors, 1),
    u_curvature: k.curvature,
    u_scanline: k.scanlineIntensity,
    u_glitch: k.glitchAmount,
    u_chroma: k.chromaticAberration,
    u_dither: k.dither,
    u_brightness: k.brightness,
    u_glow: k.glow,
    u_vignette: k.vignette,
    u_click: click,
    u_click_life: click === TERMINAL_CLICKS.degauss ? FAULTY_TERMINAL.degaussSeconds : FAULTY_TERMINAL.glitchSeconds,
  };
}

/**
 * 故障终端: 平面屏幕通道里由分形噪声决定哪些字形格亮起 (方块, 圆点或字符), 与上一帧余辉取较大者;
 * 上屏时做桶形弯曲, 随机横向故障, 色差, 辉光, 扫描线, 抖动与暗角. 指针推开噪声场, 点亮并加速翻动附近字形;
 * 点击触发横向撕裂 (glitch, 0.7 秒) 或消磁波纹 (degauss, 1.6 秒). 入场 2 秒字形按随机次序亮起. 减弱动效时内核只画一帧.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-glyph.md
 */
export function FaultyTerminal(props: FaultyTerminalProps): JSX.Element {
  const {
    scale = 1,
    gridMul = GRID_MUL,
    digitSize = DEFAULTS.digitSize,
    timeScale = DEFAULTS.timeScale,
    pause = false,
    scanlineIntensity = DEFAULTS.scanlineIntensity,
    glitchAmount = 1,
    flickerAmount = 1,
    noiseAmp = 1,
    chromaticAberration = 0,
    dither = 0,
    curvature = DEFAULTS.curvature,
    tint = "foreground",
    backgroundColor = "background",
    mouseReact = true,
    mouseStrength = DEFAULTS.mouseStrength,
    pageLoadAnimation = true,
    brightness = 1,
    glyphs = "blocks",
    glow = DEFAULTS.glow,
    persistence = DEFAULTS.persistence,
    scramble = DEFAULTS.scramble,
    mouseGlow = DEFAULTS.mouseGlow,
    vignette = DEFAULTS.vignette,
    clickEffect = "glitch",
    fontFamily = MONO_TOKEN,
    ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const characters = FAULTY_TERMINAL.characters;
  const atlas = useGlyphAtlas(glyphs === "characters" ? characters : "", fontFamily);
  const k: Knobs = {
    scale, gridMul, digitSize, timeScale, scanlineIntensity, glitchAmount, flickerAmount, noiseAmp, chromaticAberration, dither, curvature, mouseReact,
    mouseStrength, pageLoadAnimation, brightness, glyphs, glow, persistence, scramble, mouseGlow, vignette, clickEffect,
  };
  const handle = useShaderBackdrop(
    {
      fragment: FAULTY_TERMINAL_FRAGMENT,
      uniforms: (frame) => terminalUniforms(frame, k),
      textures: () => ({ u_atlas: atlas?.canvas }),
      passes: [
        {
          name: "u_screen",
          fragment: TERMINAL_SCREEN,
          scale: 1,
          uniforms: (frame) => ({ ...terminalScreenUniforms(frame, k), ...atlasUniforms(atlas, characters) }),
        },
      ],
    },
    { ...options, colors: [tint, backgroundColor], paused: options.paused === true || pause },
  );
  return (
    <BackdropShell handle={handle} fallback={glowFallback(backgroundColor, tint)} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
