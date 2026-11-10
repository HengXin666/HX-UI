"use client";
// 行为规格参照 docs/research/catalog/animations.md 的 RippleDistortion 条目, 实现为 HX 自有.

import { useEffect, useRef, useState, type JSX } from "react";
import { BackdropShell } from "../backdrop/kernel/BackdropShell";
import type { Rgb } from "../backdrop/kernel/color";
import { splitCommon, type BackdropCommonProps } from "../backdrop/kernel/common";
import type { BackdropFrame } from "../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../backdrop/kernel/use-surfaces";
import { makeLens, packLens, stepLens, type LensTrigger } from "./parts/lens";
import { LENS_FRAGMENT } from "./parts/lens-shader";
import { LENS, type LensQuality } from "./tokens";

export interface RippleLensProps extends BackdropCommonProps {
  /** 被扭曲的图片地址 (必填, 规格默认是一张外链图, 本库不带). */
  readonly src: string;
  /** 图片的替代文字; 给了就作为宿主的 aria-label 并加 role="img". */
  readonly alt?: string;
  /** 笔刷大小 (CSS 像素), 默认 150. */
  readonly brushSize?: number;
  /** 位移强度, 默认 0.2. */
  readonly strength?: number;
  /** 切向漩涡, 默认 1. */
  readonly swirl?: number;
  /** 波带里的起伏道数, 默认 4. */
  readonly rings?: number;
  /** 波扩散速度, 默认 5. */
  readonly spread?: number;
  /** 衰减速度, 默认 3 (寿命 5 / fade 秒). */
  readonly fade?: number;
  /** 指针每走多少像素放一个波, 默认 15. */
  readonly spacing?: number;
  /** 色散, 默认 0. */
  readonly dispersion?: number;
  /** 波峰高光, 默认 0. */
  readonly glint?: number;
  /** 染色 (token 名), 默认 primary. */
  readonly tint?: string;
  readonly tintAmount?: number;
  /** 去色, 默认 true. */
  readonly grayscale?: boolean;
  /** 高光色 (token 名), 默认 foreground. */
  readonly highlightColor?: string;
  readonly trigger?: LensTrigger;
  /** 点击波的强度倍数, 默认 2. */
  readonly clickStrength?: number;
  /** 画质档: 像素比上限乘 0.4 / 0.7 / 1, 默认 low. */
  readonly quality?: LensQuality;
  /** 关掉后不再放新波. */
  readonly enabled?: boolean;
}

const GREY: Rgb = [0.5, 0.5, 0.5];
const DEFAULT_DPR = 2;

/**
 * 涟漪透镜: 一张图片铺满宿主, 指针走过 (或点击) 处放出一圈圈向外扩散的波, 波带把图片径向推开并带一点漩涡,
 * 可选色散, 高光, 去色与染色. 宿主撑满父元素, 画布垫在 children 下面. 减弱动效时只画一帧静止的图.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-field.md
 */
export function RippleLens(props: RippleLensProps): JSX.Element {
  const {
    src, alt, brushSize = LENS.brushSize, strength = LENS.strength, swirl = LENS.swirl, rings = LENS.rings, spread = LENS.spread, fade = LENS.fade, spacing = LENS.spacing,
    dispersion = LENS.dispersion, glint = LENS.glint, tint = "primary", tintAmount = LENS.tintAmount, grayscale = true, highlightColor = "foreground", trigger = "hover",
    clickStrength = LENS.clickStrength, quality = "low", enabled = true, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const sim = useRef(makeLens());
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    let live = true;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (live) setImage(img);
    };
    img.src = src;
    return () => {
      live = false;
    };
  }, [src]);

  const uniforms = (frame: BackdropFrame) => {
    const { width, height, scale } = frame.fit;
    const css = (x: number, y: number) => ({ x: (x * width) / scale, y: ((1 - y) * height) / scale });
    const p = frame.pointer;
    if (!frame.reduced && frame.dt > 0) {
      stepLens(sim.current, frame.time, { trigger, spacing, clickStrength, fade, enabled }, { ...css(p.x, p.y), inside: p.inside }, p.taps.map((t) => ({ ...css(t.x, t.y), at: t.at })));
    }
    const packed = packLens(sim.current, frame.time, { brushSize, spread, fade }, scale);
    return {
      u_tex_size: [image?.naturalWidth || image?.width || 1, image?.naturalHeight || image?.height || 1] as const,
      u_ready: image !== null,
      u_waves: { list: packed.list, size: 4 as const },
      u_count: frame.reduced ? 0 : packed.count,
      u_band: brushSize * LENS.bandRatio * scale,
      u_push: brushSize * LENS.pushRatio * strength * scale,
      u_swirl: swirl,
      u_rings: rings,
      u_dispersion: dispersion,
      u_glint: glint,
      u_tint: frame.colors[0] ?? GREY,
      u_tint_amount: tintAmount,
      u_gray: grayscale,
      u_highlight: frame.colors[1] ?? GREY,
    };
  };

  const dpr = (options.dpr ?? DEFAULT_DPR) * (LENS.quality[quality] ?? LENS.quality.low);
  const handle = useShaderBackdrop({ fragment: LENS_FRAGMENT, uniforms, textures: () => ({ u_image: image }) }, { ...options, dpr, colors: [tint, highlightColor] });
  const label = alt ? { role: "img", "aria-label": alt } : {};
  return (
    <BackdropShell handle={handle} fallback={`center / cover no-repeat url(${JSON.stringify(src)})`} opacity={opacity} {...label} {...rest}>
      {children}
    </BackdropShell>
  );
}
