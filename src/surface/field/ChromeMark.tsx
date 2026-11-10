"use client";
// 行为规格参照 docs/research/catalog/animations.md 的 MetallicPaint 条目, 实现为 HX 自有.

import { useEffect, useRef, useState, type JSX } from "react";
import { BackdropShell } from "../backdrop/kernel/BackdropShell";
import type { Rgb } from "../backdrop/kernel/color";
import { splitCommon, type BackdropCommonProps } from "../backdrop/kernel/common";
import { fallbackGradient } from "../backdrop/kernel/fallback";
import { useReducedMotionPreference } from "../backdrop/kernel/use-reduced-motion";
import { useShaderBackdrop } from "../backdrop/kernel/use-surfaces";
import { chromeSource, makeChrome, stepChrome } from "./parts/chrome";
import { CHROME_BUMP_PASS, CHROME_FRAGMENT } from "./parts/chrome-shader";
import { rasterImage, rasterText, type MaskCanvas } from "./parts/mask";
import { CHROME } from "./tokens";

export interface ChromeMarkProps extends BackdropCommonProps {
  /** 形状来源之一: 图片地址 (用它的透明度当形状). 与 text 同给时取图片. */
  readonly imageSrc?: string;
  /** 形状来源之一: 文字. */
  readonly text?: string;
  readonly fontFamily?: string;
  readonly fontWeight?: number;
  /** 金属的底色 (token 名), 默认 foreground. */
  readonly color?: string;
  /** 底色 (token 名), 默认 transparent. */
  readonly backgroundColor?: string;
  /** 条纹密度, 默认 2. */
  readonly density?: number;
  /** 条纹边缘柔和度, 默认 0.1. */
  readonly softness?: number;
  /** 色散, 默认 0.3. */
  readonly dispersion?: number;
  /** 噪声扭曲, 默认 0.07. */
  readonly distortion?: number;
  /** 条纹在边缘的弯折, 默认 0.6. */
  readonly edgeBend?: number;
  /** 条纹方向 (度), 默认 70. */
  readonly angle?: number;
  /** 形状占短边的比例, 默认 0.6. */
  readonly scale?: number;
  /** 形状旋转 (度). */
  readonly rotation?: number;
  /** 指针左右带动条纹倾斜 0..1, 默认 0.5. */
  readonly mouseTilt?: number;
  readonly lightMode?: boolean;
  /** 出现时由下往上扫亮. */
  readonly intro?: boolean;
}

const TRANSPARENT = "transparent";
const GREY: Rgb = [0.5, 0.5, 0.5];

/**
 * 镀铬标记: 把文字或图片的形状画成流动的金属, 形状内部隆起, 条纹在边缘弯折, 三色错开出色散; 指针左右带动倾斜.
 * 宿主撑满父元素, 画布垫在 children 下面, 读屏隐藏 (形状的文字请另给可读文本或 aria-label). 减弱动效时只画一帧.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-field.md
 */
export function ChromeMark(props: ChromeMarkProps): JSX.Element {
  const {
    imageSrc, text, fontFamily = "system-ui, sans-serif", fontWeight = CHROME.fontWeight, color = "foreground", backgroundColor = TRANSPARENT, density = CHROME.density,
    softness = CHROME.softness, dispersion = CHROME.dispersion, distortion = CHROME.distortion, edgeBend = CHROME.edgeBend, angle = CHROME.angle, scale = CHROME.scale,
    rotation = 0, mouseTilt = CHROME.mouseTilt, lightMode = false, intro = true, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const [mask, setMask] = useState<MaskCanvas | null>(null);
  const state = useRef(makeChrome(intro));
  const hasBg = backgroundColor !== TRANSPARENT;
  const systemReduced = useReducedMotionPreference();
  const still = (options.reducedMotion ?? systemReduced) || options.paused === true;

  useEffect(() => {
    if (!imageSrc) {
      setMask(text ? rasterText(text, fontFamily, fontWeight, CHROME.workingSize) : null);
      return undefined;
    }
    let live = true;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (live) setMask(rasterImage(img, CHROME.workingSize));
    };
    img.src = imageSrc;
    return () => {
      live = false;
    };
  }, [imageSrc, text, fontFamily, fontWeight]);

  const shared = () => ({ u_has_mask: mask !== null, u_mask_aspect: mask?.aspect ?? 1, u_mask_scale: scale, u_mask_rot: (rotation * Math.PI) / 180 });
  const handle = useShaderBackdrop(
    {
      fragment: CHROME_FRAGMENT,
      textures: () => ({ u_mask: mask?.canvas }),
      passes: [
        {
          name: "u_bump",
          fragment: CHROME_BUMP_PASS,
          scale: CHROME.bumpScale,
          iterations: still ? CHROME.bumpStillSteps : CHROME.bumpSteps,
          uniforms: (frame) => ({ ...shared(), u_k: chromeSource(Math.min(frame.fit.width, frame.fit.height) * CHROME.bumpScale, scale) }),
        },
      ],
      uniforms: (frame) => {
        const a = stepChrome(state.current, frame.reduced ? 0 : frame.dt, angle, mouseTilt, frame.pointer);
        return {
          ...shared(),
          u_tint: frame.colors[0] ?? GREY,
          u_bg: hasBg ? (frame.colors[1] ?? GREY) : GREY,
          u_bg_on: hasBg,
          u_light: lightMode,
          u_density: density,
          u_softness: softness,
          u_dispersion: dispersion,
          u_distortion: distortion,
          u_bend: edgeBend,
          u_angle: a,
          u_intro: frame.reduced ? 1 : state.current.intro,
        };
      },
    },
    { ...options, colors: hasBg ? [color, backgroundColor] : [color] },
  );

  return (
    <BackdropShell handle={handle} fallback={fallbackGradient(hasBg ? [backgroundColor, color] : [color])} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
