// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 PatternWaves 条目, 实现为 HX 自有.
"use client";

import { useMemo, useRef, type JSX } from "react";
import { BackdropShell, cssColorOf, fallbackGradient, splitCommon, useShaderBackdrop, type BackdropCommonProps, type BackdropFrame } from "../../backdrop/kernel";
import { createGlyphAtlas } from "../../backdrop/kernel/atlas";
import { DEG, introProgress, LINE_GREY } from "./tokens";
import {
  enumOf, headingOf, PATTERN_WAVES_ATLAS_TILE, PATTERN_WAVES_CHARACTERS, PATTERN_WAVES_FADES, PATTERN_WAVES_FRAGMENT, PATTERN_WAVES_INTRO_SECONDS,
  PATTERN_WAVES_PATTERNS, PATTERN_WAVES_WAVES, pitchOf, resolveSurface, stepWake, waveUnit, type PatternWavesFade, type PatternWavesPattern,
  type PatternWavesWave,
} from "./pattern-waves-shader";

/** 字形记号默认用的等宽字体 token, 解析不到时退到通用等宽族. */
const MONO_TOKEN = "--font-mono";
const MONO_FALLBACK = "monospace";
/** 指针速度 (归一化每秒) 超过它算在移动, 尾流时钟才增长 (本库定). */
const MOVE_EPSILON = 0.02;

/** 透明底时的兜底: 记号色以 18% 混入透明, 居中淡淡一团, 不盖住下层内容 (本库定). */
function washFallback(color: string): string {
  return `radial-gradient(ellipse at 50% 50%, color-mix(in srgb, ${cssColorOf(color)} 18%, transparent), transparent 72%)`;
}

function fontOf(family: string): string {
  if (!family.startsWith("--")) return family;
  if (typeof document === "undefined") return MONO_FALLBACK;
  return getComputedStyle(document.documentElement).getPropertyValue(family).trim() || MONO_FALLBACK;
}

export interface PatternWavesProps extends BackdropCommonProps {
  /** 表面预设 silk / swell / ripple, 给出波形与光照的默认组合, 默认 silk. */
  readonly preset?: PatternWavesWave;
  /** 记号: dot / square / plus / line / glyph, 默认 dot. */
  readonly pattern?: PatternWavesPattern;
  /** 波形, 不给时取预设. */
  readonly wave?: PatternWavesWave;
  /** 格距 (CSS 像素), 默认 14. */
  readonly spacing?: number;
  /** 记号最大占格比例 0..1, 默认 0.8. */
  readonly markSize?: number;
  /** 高度带来的视差错位, 不给时取预设. */
  readonly depth?: number;
  /** 光照方向 (度), 不给时取预设. */
  readonly light?: number;
  /** 高光强度 0..1, 不给时取预设. */
  readonly shine?: number;
  /** 受光对比度, 不给时取预设. */
  readonly contrast?: number;
  /** 波形尺度, 越大起伏越密, 默认 1. */
  readonly scale?: number;
  /** 网格与波形的整体朝向 (度), 默认 0. */
  readonly direction?: number;
  /** 记号颜色 (token 名或 CSS 颜色), 默认 foreground. */
  readonly color?: string;
  /** 底色 token; 不给时透明. */
  readonly backgroundColor?: string;
  /** 淡出方式 none / edges / center / bottom / top, 默认 edges. */
  readonly fade?: PatternWavesFade;
  /** 淡出宽度 0..1, 默认 0.5. */
  readonly fadeSize?: number;
  /** glyph 记号的字符, 由疏到密按受光取用. */
  readonly characters?: string;
  /** glyph 记号的字体族或 CSS 变量名, 默认 --font-mono. */
  readonly fontFamily?: string;
  /** 指针按压表面与点击水纹, 默认 true. */
  readonly interactive?: boolean;
  /** 指针凹坑半径 (CSS 像素), 默认 50. */
  readonly cursorSize?: number;
  /** 指针凹坑深度 0..1, 默认 0.6. */
  readonly cursorStrength?: number;
  /** 入场由中心向外显影, 默认 true. */
  readonly intro?: boolean;
}

/**
 * 图案波面: 一张会动的高度场按法线受光, 受光程度决定网格记号 (点, 方块, 十字, 短线, 字形) 的大小或字形档位,
 * 高度带视差错位; 指针按出凹坑, 点击放出水纹, 五种淡出与由中心向外的入场.
 * WebGL2 全屏片元; 减弱动效只画一帧, WebGL 不可用时铺渐变兜底.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-lines.md
 */
export function PatternWaves(props: PatternWavesProps): JSX.Element {
  const {
    preset = "silk", pattern = "dot", wave, spacing = 14, markSize = 0.8, depth, light, shine, contrast, scale = 1, direction = 0, color = "foreground",
    backgroundColor, fade = "edges", fadeSize = 0.5, characters = PATTERN_WAVES_CHARACTERS, fontFamily = MONO_TOKEN, interactive = true,
    cursorSize = 50, cursorStrength = 0.6, intro = true, style, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const pointerOn = options.pointer !== false && interactive;
  const wake = useRef(0);
  const glyphs = pattern === "glyph";
  const atlas = useMemo(
    () => (glyphs ? createGlyphAtlas(characters || " ", PATTERN_WAVES_ATLAS_TILE, fontOf(fontFamily)) : null),
    [glyphs, characters, fontFamily],
  );
  const surface = resolveSurface(preset, { wave, depth, light, shine, contrast });

  const uniforms = (frame: BackdropFrame) => {
    const p = frame.pointer;
    const moving = pointerOn && p.inside && Math.hypot(p.vx, p.vy) > MOVE_EPSILON;
    wake.current = frame.still ? 0 : stepWake(wake.current, frame.dt, moving);
    const press = pointerOn ? Math.min(Math.max(cursorStrength, 0), 1) * p.presence * (0.5 + wake.current / 8 + (p.down ? 0.25 : 0)) : 0;
    return {
      u_ink: frame.colors[0] ?? LINE_GREY,
      u_bg: frame.colors[1] ?? LINE_GREY,
      u_opaque: backgroundColor !== undefined,
      u_pattern: enumOf(PATTERN_WAVES_PATTERNS, pattern, "dot"),
      u_wave: enumOf(PATTERN_WAVES_WAVES, surface.wave, "silk"),
      u_pitch: pitchOf(spacing),
      u_mark: markSize,
      u_depth: surface.depth,
      u_heading: headingOf(surface.light) as [number, number],
      u_shine: surface.shine,
      u_contrast: surface.contrast,
      u_unit: waveUnit(scale),
      u_angle: direction * DEG,
      u_fade_mode: enumOf(PATTERN_WAVES_FADES, fade, "edges"),
      u_fade_size: fadeSize,
      u_cursor: [p.x, p.y, Math.max(cursorSize, 1), press] as [number, number, number, number],
      u_tap_on: pointerOn,
      u_appear: introProgress(frame.elapsed, PATTERN_WAVES_INTRO_SECONDS, intro),
      u_atlas_grid: (atlas ? [atlas.columns, atlas.rows] : [1, 1]) as [number, number],
      u_glyph_count: atlas ? atlas.count : Math.max(1, Array.from(characters).length),
      u_has_atlas: atlas !== null,
    };
  };

  const handle = useShaderBackdrop(
    { fragment: PATTERN_WAVES_FRAGMENT, uniforms, textures: () => ({ u_atlas: atlas?.canvas }) },
    { ...options, colors: [color, backgroundColor ?? color] },
  );
  const fallback = backgroundColor === undefined ? washFallback(color) : fallbackGradient([backgroundColor]);
  return (
    <BackdropShell handle={handle} fallback={fallback} opacity={opacity} style={style} {...rest}>
      {children}
    </BackdropShell>
  );
}
