"use client";
// 行为规格参照 docs/research/catalog/animations.md 的 DitherVeil 条目, 实现为 HX 自有.

import { useEffect, useRef, useState, type JSX } from "react";
import { BackdropShell } from "../backdrop/kernel/BackdropShell";
import type { Rgb } from "../backdrop/kernel/color";
import { splitCommon, type BackdropCommonProps } from "../backdrop/kernel/common";
import type { BackdropFrame } from "../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../backdrop/kernel/use-surfaces";
import { dotFade, makeDot, packBursts, stepDot } from "./parts/dot";
import { DOT_MASK_PASS } from "./parts/dot-shader";
import { buildDither, isOrdered, veilGrid, type VeilFit, type VeilPalette, type VeilPattern } from "./parts/dither";
import { VEIL_FRAGMENT } from "./parts/veil-shader";
import { VEIL } from "./tokens";

export interface BayerVeilProps extends BackdropCommonProps {
  /** 图片地址 (必填, 规格默认是一张外链图, 本库不带). */
  readonly src: string;
  /** 图片的替代文字; 给了就作为宿主的 aria-label 并加 role="img". */
  readonly alt?: string;
  /** 图片怎么放进宿主, 默认 contain (留边是纸色). */
  readonly fit?: VeilFit;
  /** 抖动图样: 误差扩散 floyd / atkinson / jarvis / sierra, 或有序 bayer / noise / lines. 默认 floyd. */
  readonly pattern?: VeilPattern;
  /** 方格边长 (CSS 像素), 默认 2. */
  readonly pixelSize?: number;
  /** 每通道的色阶数, 默认 2. */
  readonly levels?: number;
  /** duotone 映到墨色到纸色; color 三通道各自抖动. 默认 duotone. */
  readonly palette?: VeilPalette;
  /** 墨色 / 纸色 (token 名), 默认 foreground / background. */
  readonly inkColor?: string;
  readonly paperColor?: string;
  readonly contrast?: number;
  readonly brightness?: number;
  /** 揭开半径 (CSS 像素), 默认 200. */
  readonly revealRadius?: number;
  readonly softness?: number;
  /** 揭开处褪回抖动要多少秒, 默认 1. */
  readonly linger?: number;
  /** 揭开边缘描边的颜色 (token 名, 默认 accent) 与强度 0..1 (默认 0, 不描). */
  readonly rimColor?: string;
  readonly rim?: number;
  /** 反过来: 平时露原图, 指针处变抖动. */
  readonly reverse?: boolean;
  /** 指针不在时沿一条慢路径自己揭开. */
  readonly wander?: boolean;
  /** 点击处爆开一圈, 默认 true. */
  readonly clickBurst?: boolean;
}

const GREY: Rgb = [0.5, 0.5, 0.5];

interface Built {
  readonly key: string;
  readonly canvas: HTMLCanvasElement | null;
}

/**
 * 抖动面纱: 图片转成 pixelSize 方格的抖动画 (误差扩散或有序阈值, duotone 或 color), 指针走过处露出原图,
 * linger 秒后褪回; 点击爆开, 可漫游, 可反向, 揭开边缘可描色. 入场时抖动由上往下铺开. 减弱动效时只画一帧抖动.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-scene.md
 */
export function BayerVeil(props: BayerVeilProps): JSX.Element {
  const {
    src, alt, fit = "contain", pattern = "floyd", pixelSize = VEIL.pixelSize, levels = VEIL.levels, palette = "duotone", inkColor = "foreground", paperColor = "background",
    contrast = VEIL.contrast, brightness = VEIL.brightness, revealRadius = VEIL.revealRadius, softness = VEIL.softness, linger = VEIL.linger, rimColor = "accent", rim = VEIL.rim,
    reverse = false, wander = false, clickBurst = true, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const sim = useRef(makeDot());
  const built = useRef<Built>({ key: "", canvas: null });
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const ordered = isOrdered(pattern);

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

  const maskUniforms = (frame: BackdropFrame) => {
    const { width, height, scale } = frame.fit;
    const css = { width: width / scale, height: height / scale };
    const p = frame.pointer;
    const s = sim.current;
    if (!frame.reduced && frame.dt > 0) {
      const taps = p.taps.map((t) => ({ x: t.x * css.width, y: (1 - t.y) * css.height, at: t.at }));
      stepDot(s, frame.dt, frame.elapsed, { x: p.x * css.width, y: (1 - p.y) * css.height, inside: p.inside, ...css, taps }, { wander, clickBurst, burstSeconds: VEIL.burstSeconds });
    }
    return {
      u_css: [css.width, css.height] as const,
      u_from: [s.fromX, s.fromY] as const,
      u_to: [s.x, s.y] as const,
      u_radius: revealRadius,
      u_softness: softness,
      u_strength: frame.reduced ? 0 : s.presence,
      u_fade: dotFade(frame.dt, linger),
      u_bursts: { list: packBursts(s, frame.elapsed, VEIL.burstSeconds), size: 4 as const },
      u_reach: 2.5,
    };
  };

  const uniforms = (frame: BackdropFrame) => {
    const { width, height, scale } = frame.fit;
    const grid = veilGrid(width / scale, height / scale, pixelSize);
    if (!ordered && image) {
      const key = [grid.cols, grid.rows, pattern, levels, contrast, brightness, fit, palette, src].join("|");
      if (built.current.key !== key) {
        built.current = { key, canvas: buildDither(image, grid.cols, grid.rows, { kernel: pattern, levels, contrast, brightness, fit, palette }) };
      }
    }
    return {
      u_tex_size: [image?.naturalWidth || image?.width || 1, image?.naturalHeight || image?.height || 1] as const,
      u_ready: image !== null && (ordered || built.current.canvas !== null) ? 1 : 0,
      u_scale: scale,
      u_grid: [grid.cols, grid.rows] as const,
      u_ordered: ordered ? 1 : 0,
      u_pattern: ordered ? VEIL.ordered[pattern] : 0,
      u_levels: Math.max(2, Math.round(levels)),
      u_color: palette === "color" ? 1 : 0,
      u_cover: fit === "cover" ? 1 : 0,
      u_ink: frame.colors[0] ?? GREY,
      u_paper: frame.colors[1] ?? GREY,
      u_rim_color: frame.colors[2] ?? GREY,
      u_rim: rim,
      u_contrast: contrast,
      u_brightness: brightness,
      u_reverse: reverse ? 1 : 0,
      u_intro: frame.reduced ? 2 : frame.elapsed / VEIL.introSeconds,
    };
  };

  const handle = useShaderBackdrop(
    {
      fragment: VEIL_FRAGMENT,
      uniforms,
      textures: () => ({ u_image: image, u_dither: ordered ? null : built.current.canvas }),
      passes: [{ name: "u_mask", fragment: DOT_MASK_PASS, scale: VEIL.maskScale, uniforms: maskUniforms }],
    },
    { ...options, colors: [inkColor, paperColor, rimColor] },
  );
  const label = alt ? { role: "img", "aria-label": alt } : {};
  return (
    <BackdropShell handle={handle} fallback={`center / ${fit} no-repeat url(${JSON.stringify(src)})`} opacity={opacity} {...label} {...rest}>
      {children}
    </BackdropShell>
  );
}
