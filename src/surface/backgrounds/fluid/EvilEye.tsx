"use client";
// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 EvilEye 条目, 实现为 HX 自有.
// 条目用一张噪声纹理烧火焰, 这里改为片元里的三维值噪声叠加, 不需要纹理上传.

import { useRef, type JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import type { Rgb } from "../../backdrop/kernel/color";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { glowFallback } from "../../backdrop/kernel/fallback";
import { approach } from "../../backdrop/kernel/math";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import { EYE_FRAGMENT, EYE_LOOK_TAU, eyeLookTarget } from "./evil-eye-shader";

export interface EvilEyeProps extends BackdropCommonProps {
  /** 眼与火焰的颜色, 默认 primary. */
  readonly eyeColor?: string;
  /** 底色, 默认 background. */
  readonly backgroundColor?: string;
  /** 火焰与虹膜的亮度, 默认 1.5. */
  readonly intensity?: number;
  /** 瞳孔大小, 默认 0.6. */
  readonly pupilSize?: number;
  /** 虹膜环宽, 默认 0.25. */
  readonly irisWidth?: number;
  /** 外圈光晕, 默认 0.35. */
  readonly glowIntensity?: number;
  /** 眼的大小, 默认 0.8. */
  readonly scale?: number;
  /** 火焰噪声的尺度, 默认 1. */
  readonly noiseScale?: number;
  /** 瞳孔跟随指针的程度, 0 不跟, 默认 1. */
  readonly pupilFollow?: number;
  /** 火焰外窜速度, 默认 1. */
  readonly flameSpeed?: number;
  /** 浅色模式: 浅底上画深色的眼. */
  readonly lightMode?: boolean;
}

const DEFAULT_INTENSITY = 1.5;
const DEFAULT_PUPIL = 0.6;
const DEFAULT_IRIS = 0.25;
const DEFAULT_GLOW = 0.35;
const DEFAULT_SCALE = 0.8;
/** irisWidth 换算成眼眶坐标里的环半宽. */
const IRIS_TO_PLANE = 0.4;
const GREY: Rgb = [0.5, 0.5, 0.5];

/**
 * 邪眼: 极坐标噪声火焰从眼心向外窜, 一圈发亮的虹膜, 竖缝瞳孔跟着指针转 (tau 0.2 秒), 外圈椭圆光晕.
 * 减弱动效只画一帧, 瞳孔居中.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-fluid.md
 */
export function EvilEye(props: EvilEyeProps): JSX.Element {
  const {
    eyeColor = "primary", backgroundColor = "background", intensity = DEFAULT_INTENSITY, pupilSize = DEFAULT_PUPIL, irisWidth = DEFAULT_IRIS,
    glowIntensity = DEFAULT_GLOW, scale = DEFAULT_SCALE, noiseScale = 1, pupilFollow = 1, flameSpeed = 1, lightMode = false, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const look = useRef<[number, number]>([0, 0]);

  const lookOf = (frame: BackdropFrame): [number, number] => {
    const l = look.current;
    if (frame.reduced) {
      l[0] = 0;
      l[1] = 0;
      return l;
    }
    const [tx, ty] = eyeLookTarget(frame.pointer.x, frame.pointer.y, frame.pointer.inside, pupilFollow);
    l[0] = approach(l[0], tx, frame.dt, EYE_LOOK_TAU);
    l[1] = approach(l[1], ty, frame.dt, EYE_LOOK_TAU);
    return [l[0], l[1]];
  };

  const handle = useShaderBackdrop(
    {
      fragment: EYE_FRAGMENT,
      uniforms: (frame) => ({
        u_eye: frame.colors[0] ?? GREY,
        u_bg: frame.colors[1] ?? GREY,
        u_intensity: intensity,
        u_pupil: pupilSize,
        u_iris: irisWidth * IRIS_TO_PLANE,
        u_glow: glowIntensity,
        u_scale: scale,
        u_noise: noiseScale,
        u_flame: flameSpeed,
        u_look: lookOf(frame),
        u_light: lightMode,
      }),
    },
    { ...options, colors: [eyeColor, backgroundColor] },
  );

  return (
    <BackdropShell handle={handle} fallback={glowFallback(backgroundColor, eyeColor)} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
