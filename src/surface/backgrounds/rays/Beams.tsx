"use client";
// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Beams 条目, 实现为 HX 自有.

import { useRef, type JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { glowFallback } from "../../backdrop/kernel/fallback";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import { BEAMS, BEAMS_FRAGMENT } from "./beams-shader";
import { backdropOf, budgetEdge, followStep, introProgress, qualityDpr, radians, rgbAt } from "./field";

export interface BeamsProps extends BackdropCommonProps {
  /** 光色: token 名 (如 "foreground") 或 CSS 颜色. */
  readonly color?: string;
  /** 底色; 不给则透明叠在父元素上. */
  readonly backgroundColor?: string;
  /** 每根光束的宽度 (CSS px). */
  readonly beamWidth?: number;
  /** 光束走向 (度). */
  readonly rotation?: number;
  /** 沿光束的起伏波长 (CSS px). */
  readonly waveLength?: number;
  /** 曲面凸起程度, 越大高光越窄越亮. */
  readonly depth?: number;
  /** 高光锐度 0..1. */
  readonly sharpness?: number;
  /** 光束绕自身轴的扭转 (弧度幅度). */
  readonly twist?: number;
  /** 漫射补光 0..1. */
  readonly fillLight?: number;
  /** 高光外的辉光. */
  readonly glow?: number;
  /** 总亮度. */
  readonly brightness?: number;
  /** 每根光束的相位 / 速度差异 0..1. */
  readonly variation?: number;
  /** 胶片颗粒 0..1. */
  readonly grain?: number;
  /** 画质 0..1, 乘到像素比上限上. */
  readonly quality?: number;
  /** 指针牵动光源的强度. */
  readonly mouseStrength?: number;
  /** 是否播放 1.6 秒的扫入. */
  readonly intro?: boolean;
  /** 四边淡出宽度 0..1, 0 为不淡出. */
  readonly fade?: number;
}

/** 光源静止时的环绕半径与两轴角速度 (本库定). */
const ORBIT = { radius: 0.32, wx: 0.13, wy: 0.17, centerY: 0.62 } as const;

/**
 * 平行光束: 一排凸起的光带, 沿走向缓慢起伏, 掠射光源落在曲面上出 GGX 高光与菲涅尔边光.
 * 光源平时自己绕圈, 指针进入后指数跟手 (速率 7), 离开后慢慢放回.
 */
export function Beams(props: BeamsProps): JSX.Element {
  const {
    color = "foreground", backgroundColor, beamWidth = 140, rotation = 30, waveLength = 233, depth = 1, sharpness = 0.6,
    twist = 0, fillLight = 0.3, glow = 0.6, brightness = 1.6, variation = 0, grain = 0.35, quality = 0.75,
    mouseStrength = 1, intro = true, fade = 0, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const lamp = useRef<{ x: number; y: number; reach: number }>({ x: 0.5, y: ORBIT.centerY, reach: 0 });

  const uniforms = (frame: BackdropFrame) => {
    const { pointer, dt, time, fit } = frame;
    const s = lamp.current;
    const engaged = options.pointer !== false && pointer.inside;
    s.reach = followStep(s.reach, engaged ? 1 : 0, dt, engaged ? BEAMS.reachIn : BEAMS.reachOut);
    const idleX = 0.5 + ORBIT.radius * Math.cos(time * ORBIT.wx);
    const idleY = ORBIT.centerY + ORBIT.radius * Math.sin(time * ORBIT.wy);
    const pull = Math.min(1, s.reach * mouseStrength);
    const tx = engaged ? idleX + (pointer.x - idleX) * pull : idleX;
    const ty = engaged ? idleY + (pointer.y - idleY) * pull : idleY;
    s.x = dt > 0 ? followStep(s.x, tx, dt, BEAMS.followRate) : tx;
    s.y = dt > 0 ? followStep(s.y, ty, dt, BEAMS.followRate) : ty;
    const scale = fit.scale;
    return {
      u_color: rgbAt(frame.colors, 0),
      u_backdrop: backdropOf(frame.colors, 1, backgroundColor !== undefined),
      u_fade: fade,
      u_width: beamWidth * scale,
      u_turn: radians(rotation),
      u_wave: waveLength * scale,
      u_depth: depth,
      u_sharp: sharpness,
      u_twist: twist,
      u_fill: fillLight,
      u_glow: glow,
      u_bright: brightness,
      u_var: variation,
      u_grain: grain,
      u_light: [s.x, s.y, s.reach],
      u_intro: introProgress(frame.elapsed, BEAMS.introSeconds, intro),
    };
  };

  const colors = backgroundColor === undefined ? [color] : [color, backgroundColor];
  const handle = useShaderBackdrop(
    { fragment: BEAMS_FRAGMENT, uniforms },
    { ...options, colors, dpr: qualityDpr(options.dpr, quality), maxEdge: budgetEdge(BEAMS.maxFieldPixels) },
  );
  return (
    <BackdropShell handle={handle} fallback={glowFallback(backgroundColor ?? "background", color)} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
