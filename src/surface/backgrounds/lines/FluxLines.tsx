// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 FluxLines 条目, 实现为 HX 自有.
"use client";

import { useRef, type CSSProperties, type JSX } from "react";
import { approach, BackdropShell, fallbackGradient, splitCommon, useShaderBackdrop, type BackdropCommonProps, type BackdropFrame } from "../../backdrop/kernel";
import { FLUX_FLOW, FLUX_INTRO_SECONDS, FLUX_LINES_FRAGMENT, FLUX_MAGNET_TAU, fluxReference, type FluxDirection } from "./flux-lines-shader";
import { createFollowPointer, introProgress, LINE_GREY, paletteCount, paletteUniform, stepFollow } from "./tokens";

const DEFAULT_COLORS: readonly string[] = ["foreground"];
/** 条目默认的场速度 0.5, 作为本件 speed 的默认值. */
const DEFAULT_SPEED = 0.5;

export interface FluxLinesProps extends BackdropCommonProps {
  /** 线色 (token 名或 CSS 颜色), 至多 8 个, 逐束取色. 默认 foreground. */
  readonly colors?: readonly string[];
  /** 场的尺度, 越大线越密越细碎, 默认 1.6. */
  readonly scale?: number;
  /** 湍流: 线束横向扭曲的幅度, 默认 1. */
  readonly turbulence?: number;
  /** 流动性: 场自身随时间变形的快慢, 默认 0.1. */
  readonly fluidity?: number;
  /** 线身边缘光的宽度, 默认 0.2. */
  readonly rimWidth?: number;
  /** 光斑锐度 (亮段的幂), 默认 2.5. */
  readonly sharpness?: number;
  /** 沿线微光强度, 默认 1.5. */
  readonly shimmer?: number;
  /** 光晕强度, 默认 2. */
  readonly glow?: number;
  /** 线宽 (CSS 像素), 0 只留光晕, 默认 1. */
  readonly lineWidth?: number;
  /** 流向, 默认 down. */
  readonly flowDirection?: FluxDirection;
  /** 磁铁强度, 默认 1. */
  readonly mouseStrength?: number;
  /** 磁铁半径 (场的参考尺度的比例), 默认 0.35. */
  readonly mouseRadius?: number;
  /** 跟手时间常数 (秒), 默认 0.15. */
  readonly mouseDampening?: number;
  /** 点击处起旋涡, 默认 true. */
  readonly clickSwirl?: boolean;
  /** 入场逐束亮起, 默认 true. */
  readonly intro?: boolean;
  /** 浅色底: 收敛光晕与发白, 默认 false. */
  readonly lightMode?: boolean;
  /** 透明底, 默认 true; false 时铺 backgroundColor. */
  readonly transparent?: boolean;
  /** 不透明时的底色 token, 默认 background. */
  readonly backgroundColor?: string;
  /** 宿主的混合模式. */
  readonly mixBlendMode?: CSSProperties["mixBlendMode"];
}

/**
 * 流线: 沿流向平流的噪声等值线, 成束流动; 指针像磁铁拉场并点亮附近, 点击起旋涡.
 * WebGL2 全屏片元; 减弱动效只画一帧, WebGL 不可用时铺渐变兜底.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-lines.md
 */
export function FluxLines(props: FluxLinesProps): JSX.Element {
  const {
    colors = DEFAULT_COLORS, scale = 1.6, turbulence = 1, fluidity = 0.1, rimWidth = 0.2, sharpness = 2.5, shimmer = 1.5, glow = 2, lineWidth = 1,
    flowDirection = "down", mouseStrength = 1, mouseRadius = 0.35, mouseDampening = 0.15, clickSwirl = true, intro = true, lightMode = false,
    transparent = true, backgroundColor = "background", mixBlendMode, style, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const follow = useRef(createFollowPointer());
  const magnet = useRef(0);
  const pointerOn = options.pointer !== false;
  const palette = colors.length > 0 ? colors : DEFAULT_COLORS;

  const uniforms = (frame: BackdropFrame) => {
    const f = stepFollow(follow.current, frame, mouseDampening, pointerOn);
    const target = pointerOn && frame.pointer.inside ? 1 : 0;
    magnet.current = frame.still ? target : approach(magnet.current, target, frame.dt, FLUX_MAGNET_TAU);
    const lines = frame.colors.slice(0, palette.length);
    return {
      u_colors: paletteUniform(lines),
      u_color_count: paletteCount(lines),
      u_flow: FLUX_FLOW[flowDirection] ?? FLUX_FLOW.down,
      u_ref: fluxReference(scale),
      u_turb: turbulence,
      u_fluid: fluidity,
      u_rim: rimWidth,
      u_sharp: Math.max(sharpness, 0.01),
      u_shimmer: shimmer,
      u_glow: glow,
      u_line: lineWidth * frame.fit.scale * 0.5,
      u_magnet: [f.x, f.y, mouseRadius, magnet.current * f.presence * mouseStrength],
      u_swirl: clickSwirl && pointerOn,
      u_reveal: introProgress(frame.elapsed, FLUX_INTRO_SECONDS, intro),
      u_light: lightMode,
      u_opaque: !transparent,
      u_bg: frame.colors[palette.length] ?? LINE_GREY,
    };
  };

  const handle = useShaderBackdrop(
    { fragment: FLUX_LINES_FRAGMENT, uniforms },
    { ...options, speed: options.speed ?? DEFAULT_SPEED, colors: [...palette, backgroundColor] },
  );
  const fallback = transparent ? fallbackGradient(palette) : fallbackGradient([backgroundColor]);
  return (
    <BackdropShell handle={handle} fallback={fallback} opacity={opacity} style={{ mixBlendMode, ...style }} {...rest}>
      {children}
    </BackdropShell>
  );
}
