// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 Waves 条目, 实现为 HX 自有.
"use client";

import { useRef, type CSSProperties, type JSX } from "react";
import { approach, BackdropShell, fallbackGradient, splitCommon, useShaderBackdrop, type BackdropCommonProps, type BackdropFrame } from "../../backdrop/kernel";
import { DEG, introProgress, LINE_GREY } from "./tokens";
import {
  stepSpring, WAVES_BLEND_TAU, WAVES_DRAG, WAVES_FOLLOW_TAU, WAVES_FRAGMENT, WAVES_INTRO_SECONDS, WAVES_STYLES, type WavesLineStyle, type WavesSpring,
} from "./waves-shader";

export interface WavesProps extends BackdropCommonProps {
  /** 线色 (token 名或 CSS 颜色), 默认 foreground. */
  readonly lineColor?: string;
  /** 位移大处染的强调色, 默认 primary. */
  readonly accentColor?: string;
  /** 底色 token; 不给时透明. */
  readonly backgroundColor?: string;
  /** 实线或虚线, 默认 solid. */
  readonly lineStyle?: WavesLineStyle;
  /** 线距 (CSS 像素), 默认 10. */
  readonly spacing?: number;
  /** 线宽 (CSS 像素), 默认 1. */
  readonly lineWidth?: number;
  /** 线组旋转 (度), 默认 0. */
  readonly rotation?: number;
  /** 位移幅度 (CSS 像素), 默认 32. */
  readonly amplitude?: number;
  /** 噪声尺度, 默认 1. */
  readonly scale?: number;
  /** 位移方向随噪声转的程度, 默认 1. */
  readonly twist?: number;
  /** 第二层噪声的变化量, 默认 0. */
  readonly variation?: number;
  /** 指针推挤半径 (CSS 像素), 默认 175. */
  readonly mouseRadius?: number;
  /** 指针推挤强度, 默认 1. */
  readonly mouseStrength?: number;
  /** 回弹的弹性 0..1, 默认 0.5. */
  readonly bounce?: number;
  /** 回弹周期 (秒), 默认 1.4. */
  readonly returnDuration?: number;
  /** 点击起涟漪, 默认 true. */
  readonly clickRipple?: boolean;
  /** 入场由中间向两侧长出, 默认 true. */
  readonly intro?: boolean;
  /** 四边淡出宽度 (画布比例), 默认 0. */
  readonly fade?: number;
  /** 浅色底: 线稍收, 默认 false. */
  readonly lightMode?: boolean;
  /** 宿主的混合模式. */
  readonly mixBlendMode?: CSSProperties["mixBlendMode"];
}

/**
 * 波线: 等距平行线被噪声位移场推成起伏地形, 指针处弹簧推挤并随拖动甩出, 点击放出环形涟漪, 位移大处染强调色.
 * WebGL2 全屏片元; 减弱动效只画一帧, WebGL 不可用时铺渐变兜底.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-lines.md
 */
export function Waves(props: WavesProps): JSX.Element {
  const {
    lineColor = "foreground", accentColor = "primary", backgroundColor, lineStyle = "solid", spacing = 10, lineWidth = 1, rotation = 0, amplitude = 32,
    scale = 1, twist = 1, variation = 0, mouseRadius = 175, mouseStrength = 1, bounce = 0.5, returnDuration = 1.4, clickRipple = true, intro = true,
    fade = 0, lightMode = false, mixBlendMode, style, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const pointerOn = options.pointer !== false;
  const state = useRef({ x: 0.5, y: 0.5, presence: 0, spring: { x: 0, y: 0, vx: 0, vy: 0 } as WavesSpring });

  const uniforms = (frame: BackdropFrame) => {
    const s = state.current;
    const p = frame.pointer;
    const target = pointerOn ? p.presence : 0;
    const width = frame.fit.width / Math.max(frame.fit.scale, 1e-3);
    const height = frame.fit.height / Math.max(frame.fit.scale, 1e-3);
    if (frame.still) {
      Object.assign(s, { x: p.x, y: p.y, presence: target });
      Object.assign(s.spring, { x: 0, y: 0, vx: 0, vy: 0 });
    } else {
      s.x = approach(s.x, p.x, frame.dt, WAVES_FOLLOW_TAU);
      s.y = approach(s.y, p.y, frame.dt, WAVES_FOLLOW_TAU);
      s.presence = approach(s.presence, target, frame.dt, WAVES_BLEND_TAU);
      const drag = pointerOn && p.inside ? WAVES_DRAG * mouseStrength : 0;
      stepSpring(s.spring, p.vx * width * drag, p.vy * height * drag, frame.dt, bounce, returnDuration);
    }
    return {
      u_line: frame.colors[0] ?? LINE_GREY,
      u_accent: frame.colors[1] ?? LINE_GREY,
      u_bg: frame.colors[2] ?? LINE_GREY,
      u_opaque: backgroundColor !== undefined,
      u_dashed: WAVES_STYLES[lineStyle] === WAVES_STYLES.dashed,
      u_spacing: spacing,
      u_width: lineWidth,
      u_angle: rotation * DEG,
      u_amp: amplitude,
      u_scale: scale,
      u_twist: twist,
      u_variation: variation,
      u_push: [s.x, s.y, mouseStrength, s.presence],
      u_spring: [s.spring.x, s.spring.y],
      u_radius: mouseRadius,
      u_ripples: clickRipple && pointerOn ? 8 : 0,
      u_intro: introProgress(frame.elapsed, WAVES_INTRO_SECONDS, intro),
      u_fade: fade,
      u_light: lightMode,
    };
  };

  const handle = useShaderBackdrop({ fragment: WAVES_FRAGMENT, uniforms }, { ...options, colors: [lineColor, accentColor, backgroundColor ?? lineColor] });
  const fallback = backgroundColor === undefined ? fallbackGradient([lineColor, accentColor]) : fallbackGradient([backgroundColor]);
  return (
    <BackdropShell handle={handle} fallback={fallback} opacity={opacity} style={{ mixBlendMode, ...style }} {...rest}>
      {children}
    </BackdropShell>
  );
}
