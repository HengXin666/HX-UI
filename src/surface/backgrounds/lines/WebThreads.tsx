// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 WebThreads 条目, 实现为 HX 自有.
"use client";

import { useRef, type CSSProperties, type JSX } from "react";
import { BackdropShell, fallbackGradient, splitCommon, useShaderBackdrop, type BackdropCommonProps, type BackdropFrame } from "../../backdrop/kernel";
import { WEB_MAX_COLORS, WEB_MAX_SURGES, WEB_MAX_THREADS, WEB_THREADS_FRAGMENT, webIntroLength, webStagger } from "./web-threads-shader";
import { clampCount, createFollowPointer, DEG, introProgress, LINE_GREY, paletteCount, paletteUniform, stepFollow } from "./tokens";

const DEFAULT_COLORS: readonly string[] = ["primary"];
/** 条目默认速度 0.2, 作为本件 speed 的默认值. */
const DEFAULT_SPEED = 0.2;
/** 指针拉线的跟手时间常数 (本库定). */
const BEND_TAU = 0.12;

export interface WebThreadsProps extends BackdropCommonProps {
  /** 线色 (token 名或 CSS 颜色), 至多 6 个, 按线序分布. 默认 primary. */
  readonly colors?: readonly string[];
  /** 能量叠高处的芯色, 默认 foreground. */
  readonly coreColor?: string;
  /** 底色 token; 不给时透明. */
  readonly backgroundColor?: string;
  /** 浅色底: 芯色只轻混, 默认 false. */
  readonly lightMode?: boolean;
  /** 线数, 1..24, 默认 6. */
  readonly threadCount?: number;
  /** 起伏频率, 默认 5. */
  readonly frequency?: number;
  /** 张开幅度 (画布高的比例), 默认 0.18. */
  readonly spread?: number;
  /** 逐线振幅递增 (amp = 1 + i * taper), 默认 1. */
  readonly taper?: number;
  /** 线束纵向位置 0..1, 默认 0.5. */
  readonly position?: number;
  /** 结点处收拢的锐度, 默认 0.5. */
  readonly pinch?: number;
  /** 结点数, 默认 1. */
  readonly nodes?: number;
  /** 线束旋转 (度), 默认 0. */
  readonly angle?: number;
  /** 光晕强度, 默认 0.02. */
  readonly glow?: number;
  /** 光晕衰减指数, 默认 0.6. */
  readonly falloff?: number;
  /** 线芯粗细 (CSS 像素), 默认 1.1. */
  readonly thickness?: number;
  /** 亮度, 默认 0.6. */
  readonly brightness?: number;
  /** 绕轴的纵深明暗, 0..1, 默认 0. */
  readonly depth?: number;
  /** 自动沿线跑的光点密度, 0 关闭, 默认 0. */
  readonly pulses?: number;
  /** 镜像成对, 默认 true. */
  readonly mirror?: boolean;
  /** 沿线闪烁, 默认 false. */
  readonly shimmer?: boolean;
  /** 左右两端淡出宽度, 默认 0. */
  readonly fade?: number;
  /** 颗粒, 默认 0.05. */
  readonly grain?: number;
  /** 入场逐线描出, 默认 true. */
  readonly intro?: boolean;
  /** 宿主的混合模式. */
  readonly mixBlendMode?: CSSProperties["mixBlendMode"];
}

/**
 * 网丝: 一组在结点处收拢的正弦线, 线芯带光晕, 叠高处发白; 入场逐线描出, 指针附近线被拉近, 点击沿线放出光涌.
 * WebGL2 全屏片元; 减弱动效只画一帧, WebGL 不可用时铺渐变兜底.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-lines.md
 */
export function WebThreads(props: WebThreadsProps): JSX.Element {
  const {
    colors = DEFAULT_COLORS, coreColor = "foreground", backgroundColor, lightMode = false, threadCount = 6, frequency = 5, spread = 0.18, taper = 1,
    position = 0.5, pinch = 0.5, nodes = 1, angle = 0, glow = 0.02, falloff = 0.6, thickness = 1.1, brightness = 0.6, depth = 0, pulses = 0,
    mirror = true, shimmer = false, fade = 0, grain = 0.05, intro = true, mixBlendMode, style, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const follow = useRef(createFollowPointer());
  const pointerOn = options.pointer !== false;
  const palette = (colors.length > 0 ? colors : DEFAULT_COLORS).slice(0, WEB_MAX_COLORS);
  const count = clampCount(threadCount, WEB_MAX_THREADS);

  const uniforms = (frame: BackdropFrame) => {
    const f = stepFollow(follow.current, frame, BEND_TAU, pointerOn);
    const lines = frame.colors.slice(0, palette.length);
    const length = webIntroLength(count);
    const reveal = introProgress(frame.elapsed, length, intro);
    return {
      u_colors: paletteUniform(lines),
      u_color_count: paletteCount(lines),
      u_count: count,
      u_freq: frequency,
      u_spread: spread,
      u_taper: taper,
      u_position: position,
      u_pinch: Math.max(pinch, 0.01),
      u_nodes: Math.max(nodes, 0.1),
      u_angle: angle * DEG,
      u_glow: glow,
      u_falloff: falloff,
      u_thick: thickness * frame.fit.scale,
      u_bright: brightness,
      u_depth: depth,
      u_pulses: pulses,
      u_mirror: mirror,
      u_shimmer: shimmer,
      u_fade: fade,
      u_grain: grain,
      u_intro: reveal >= 1 ? 2 * length : reveal * length,
      u_stagger: webStagger(count),
      u_surge: pointerOn ? WEB_MAX_SURGES : 0,
      u_bend: [f.x, f.y, f.presence * 0.5],
      u_core: frame.colors[palette.length] ?? LINE_GREY,
      u_bg: frame.colors[palette.length + 1] ?? LINE_GREY,
      u_opaque: backgroundColor !== undefined,
      u_light: lightMode,
    };
  };

  const handle = useShaderBackdrop(
    { fragment: WEB_THREADS_FRAGMENT, uniforms },
    { ...options, speed: options.speed ?? DEFAULT_SPEED, colors: [...palette, coreColor, backgroundColor ?? coreColor] },
  );
  const fallback = backgroundColor === undefined ? fallbackGradient(palette) : fallbackGradient([backgroundColor, ...palette]);
  return (
    <BackdropShell handle={handle} fallback={fallback} opacity={opacity} style={{ mixBlendMode, ...style }} {...rest}>
      {children}
    </BackdropShell>
  );
}
