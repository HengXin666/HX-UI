"use client";
// 行为规格参照 docs/research/catalog/animations.md 的 HalftoneReveal 条目, 实现为 HX 自有.

import { useEffect, useRef, useState, type JSX } from "react";
import { BackdropShell } from "../backdrop/kernel/BackdropShell";
import type { Rgb } from "../backdrop/kernel/color";
import { splitCommon, type BackdropCommonProps } from "../backdrop/kernel/common";
import type { BackdropFrame } from "../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../backdrop/kernel/use-surfaces";
import { dotFade, dotMatte, makeDot, packBursts, stepDot } from "./parts/dot";
import { DOT_FRAGMENT, DOT_MASK_PASS } from "./parts/dot-shader";
import { DOT } from "./tokens";

export type DotMode = keyof typeof DOT.modes;
export type DotShape = keyof typeof DOT.shapes;
export type DotFit = keyof typeof DOT.fits;

export interface DotRevealProps extends BackdropCommonProps {
  /** 图片地址 (必填, 规格默认是一张外链图, 本库不带). */
  readonly src: string;
  /** 图片的替代文字; 给了就作为宿主的 aria-label 并加 role="img". */
  readonly alt?: string;
  /** 铺法: cover 裁边铺满, contain 留边全见 (留边是纸色), fill 拉伸. 默认 cover. */
  readonly fit?: DotFit;
  /** 抠底: 与底色相近处不出网点, 揭开时也露纸色. 底色取图片四角平均色 (本库定, 规格未给来源); 读不出像素时自动关闭. 适合纯色底的产品图, 默认 false. */
  readonly keyOut?: boolean;
  /** 上色方式: mono 单色网, duotone 双色套印, color 原色网点. 默认 mono. */
  readonly mode?: DotMode;
  /** 网点形状, 默认 dot. */
  readonly shape?: DotShape;
  /** 网格边长 (CSS 像素), 默认 6. */
  readonly cellSize?: number;
  /** 网角 (度), 默认 45. */
  readonly angle?: number;
  readonly dotScale?: number;
  /** 墨色 / 强调色 / 纸色 (token 名), 默认 foreground / primary / background. */
  readonly inkColor?: string;
  readonly accentColor?: string;
  readonly paperColor?: string;
  readonly contrast?: number;
  readonly brightness?: number;
  readonly invert?: boolean;
  /** 网点大小的随机起伏 0..1, 默认 0. */
  readonly roughness?: number;
  /** 套印错位 (以格为单位), 默认 0. */
  readonly misregistration?: number;
  /** 揭开半径 (CSS 像素), 默认 160. */
  readonly revealRadius?: number;
  /** 揭开边缘的羽化比例, 默认 0.6. */
  readonly softness?: number;
  /** 揭开处褪回网点要多少秒, 默认 1.2. */
  readonly linger?: number;
  /** 反过来: 平时露原图, 指针处变网点. */
  readonly reverse?: boolean;
  /** 指针不在时沿一条慢路径自己揭开. */
  readonly wander?: boolean;
  /** 点击处爆开一圈, 默认 true. */
  readonly clickBurst?: boolean;
  /** 挂载时网点由中心向外长出来, 默认 true. */
  readonly intro?: boolean;
}

const GREY: Rgb = [0.5, 0.5, 0.5];

/**
 * 网点揭示: 图片按 fit (cover / contain / fill) 铺开并转成半色调网点, 可按四角底色抠底 (六种形状, 三种上色), 指针走过处露出原图, linger 秒后褪回网点;
 * 点击爆开一圈, 可漫游自揭, 可反向. 宿主撑满父元素, 画布垫在 children 下面. 减弱动效时只画一帧网点.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-scene.md
 */
export function DotReveal(props: DotRevealProps): JSX.Element {
  const {
    src, alt, fit = "cover", keyOut = false, mode = "mono", shape = "dot", cellSize = DOT.cellSize, angle = DOT.angle, dotScale = DOT.dotScale, inkColor = "foreground", accentColor = "primary",
    paperColor = "background", contrast = DOT.contrast, brightness = DOT.brightness, invert = false, roughness = DOT.roughness, misregistration = DOT.misregistration,
    revealRadius = DOT.revealRadius, softness = DOT.softness, linger = DOT.linger, reverse = false, wander = false, clickBurst = true, intro = true, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const sim = useRef(makeDot());
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const matte = useRef<[number, number, number] | null>(null);

  useEffect(() => {
    let live = true;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!live) return;
      matte.current = dotMatte(img);
      setImage(img);
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
      stepDot(s, frame.dt, frame.elapsed, { x: p.x * css.width, y: (1 - p.y) * css.height, inside: p.inside, ...css, taps }, { wander, clickBurst });
    }
    return {
      u_css: [css.width, css.height] as const,
      u_from: [s.fromX, s.fromY] as const,
      u_to: [s.x, s.y] as const,
      u_radius: revealRadius,
      u_softness: softness,
      u_strength: frame.reduced ? 0 : s.presence,
      u_fade: dotFade(frame.dt, linger),
      u_bursts: { list: packBursts(s, frame.elapsed), size: 4 as const },
      u_reach: DOT.burstReach,
    };
  };

  const uniforms = (frame: BackdropFrame) => ({
    u_tex_size: [image?.naturalWidth || image?.width || 1, image?.naturalHeight || image?.height || 1] as const,
    u_ready: image !== null ? 1 : 0,
    u_scale: frame.fit.scale,
    u_mode: DOT.modes[mode] ?? 0,
    u_shape: DOT.shapes[shape] ?? 0,
    u_cell: Math.max(2, cellSize),
    u_angle: angle,
    u_dot_scale: dotScale,
    u_ink: frame.colors[0] ?? GREY,
    u_accent: frame.colors[1] ?? GREY,
    u_paper: frame.colors[2] ?? GREY,
    u_contrast: contrast,
    u_brightness: brightness,
    u_invert: invert ? 1 : 0,
    u_roughness: roughness,
    u_misreg: misregistration,
    u_reverse: reverse ? 1 : 0,
    u_intro: intro && !frame.reduced ? frame.elapsed / DOT.introSeconds : 2,
    u_fit: DOT.fits[fit] ?? 0,
    u_matte: matte.current ?? GREY,
    u_key: keyOut && matte.current !== null ? 1 : 0,
  });

  const handle = useShaderBackdrop(
    { fragment: DOT_FRAGMENT, uniforms, textures: () => ({ u_image: image }), passes: [{ name: "u_mask", fragment: DOT_MASK_PASS, scale: DOT.maskScale, uniforms: maskUniforms }] },
    { ...options, colors: [inkColor, accentColor, paperColor] },
  );
  const label = alt ? { role: "img", "aria-label": alt } : {};
  return (
    <BackdropShell handle={handle} fallback={`center / ${fit === "fill" ? "100% 100%" : fit} no-repeat url(${JSON.stringify(src)})`} opacity={opacity} {...label} {...rest}>
      {children}
    </BackdropShell>
  );
}
