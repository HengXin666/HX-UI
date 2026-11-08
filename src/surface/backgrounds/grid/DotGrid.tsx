"use client";
// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 DotGrid 条目, 实现为 HX 自有.

import { useRef, type JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import { cssColorOf } from "../../backdrop/kernel/color";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../../backdrop/kernel/use-surfaces";
import { DOT_GRID_FRAGMENT, DOT_SHAPES, type DotShape } from "./dot-grid-shader";
import { DOT_GRID, makeLattice, packLattice, springParams, stepLattice, type DotLattice } from "./dot-grid-sim";
import { enumOf, introProgress, rgbAt } from "./tokens";

/** 入场: 点由小长到全尺寸的时长 (秒, 本库定). */
export const DOT_GRID_INTRO = 1.2;

export interface DotGridProps extends BackdropCommonProps {
  /** 点径 (CSS 像素), 默认 5. */
  readonly dotSize?: number;
  /** 格距 (CSS 像素), 默认 18. */
  readonly gap?: number;
  /** 静止色, token 名或 CSS 颜色, 默认 muted-foreground. */
  readonly baseColor?: string;
  /** 被推开时的颜色, 默认 foreground. */
  readonly activeColor?: string;
  /** 指针推力半径 (CSS 像素), 默认 140. */
  readonly proximity?: number;
  /** 指针推力, 默认 1. */
  readonly strength?: number;
  /** 回弹 0..1, 越大阻尼越小, 默认 0.6. */
  readonly bounce?: number;
  /** 邻点牵连 0..1, 默认 0.4. */
  readonly tension?: number;
  /** 回位周期 (秒), 默认 0.8. */
  readonly returnDuration?: number;
  /** 点击冲击波扩散半径 (CSS 像素), 默认 320. */
  readonly shockRadius?: number;
  /** 冲击波强度, 默认 5. */
  readonly shockStrength?: number;
  /** 点径随能量膨胀, 默认 0.8. */
  readonly swell?: number;
  /** 沿速度方向拉长, 默认 0.5. */
  readonly stretch?: number;
  /** 受扰点的光晕, 默认 0.5. */
  readonly glow?: number;
  readonly shape?: DotShape;
  /** 四边淡出 0..1, 默认 0. */
  readonly fade?: number;
  /** 首帧起点由小长大. */
  readonly intro?: boolean;
  /** 点击打出冲击波. */
  readonly clickShock?: boolean;
}

/** 帧里取出仍在扩散的冲击波, 坐标换成 CSS 像素 (y 朝上). */
export function shocksOf(frame: Pick<BackdropFrame, "pointer" | "elapsed">, cssW: number, cssH: number): Array<{ x: number; y: number; age: number }> {
  if (!Number.isFinite(frame.elapsed)) return [];
  return frame.pointer.taps
    .map((t) => ({ x: t.x * cssW, y: t.y * cssH, age: frame.elapsed - t.at }))
    .filter((s) => s.age >= 0 && s.age < DOT_GRID.shockLife);
}

/** WebGL 不可用时的静态点阵: CSS 径向渐变平铺, 点径与格距同 props. */
export function dotPatternFallback(color: string, size: number, gap: number): string {
  const r = Math.max(0.5, size / 2);
  return `radial-gradient(circle, ${cssColorOf(color)} ${r}px, transparent ${r + 0.5}px) center / ${gap}px ${gap}px`;
}

/**
 * 弹簧点阵: 每个点挂在回位弹簧上, 邻点相互牵连, 指针推开, 点击打出一圈冲击波. 积分在 JS 侧做 (半隐式欧拉, 分子步),
 * 位移与速度每帧打包成一张一格一纹素的小纹理, WebGL2 片元按九宫格查点位画出膨胀与拉长的点.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-grid.md
 */
export function DotGrid(props: DotGridProps): JSX.Element {
  const {
    dotSize = 5, gap = 18, baseColor = "muted-foreground", activeColor = "foreground", proximity = 140, strength = 1, bounce = 0.6,
    tension = 0.4, returnDuration = 0.8, shockRadius = 320, shockStrength = 5, swell = 0.8, stretch = 0.5, glow = 0.5,
    shape = "circle", fade = 0, intro = true, clickShock = true, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const lattice = useRef<DotLattice | null>(null);
  const images = useRef<ImageData[]>([]);
  const flip = useRef(0);

  const uniforms = (frame: BackdropFrame) => {
    const cssW = frame.fit.width / frame.fit.scale;
    const cssH = frame.fit.height / frame.fit.scale;
    let l = lattice.current;
    if (!l || l.gap !== Math.max(2, gap) || l.cols !== Math.max(1, Math.floor(cssW / l.gap)) || l.rows !== Math.max(1, Math.floor(cssH / l.gap))) {
      l = makeLattice(cssW, cssH, gap);
      lattice.current = l;
      images.current = typeof ImageData === "undefined" ? [] : [new ImageData(l.cols, l.rows), new ImageData(l.cols, l.rows)];
    }
    const p = frame.pointer;
    stepLattice(l, frame.dt, springParams(bounce, tension, returnDuration), {
      pointer: p.inside ? [p.x * cssW, p.y * cssH] : null,
      proximity,
      strength,
      shocks: clickShock ? shocksOf(frame, cssW, cssH) : [],
      shockRadius,
      shockStrength,
    });
    flip.current = 1 - flip.current;
    const image = images.current[flip.current];
    if (image) packLattice(l, image.data);
    return {
      u_grid: [l.cols, l.rows],
      u_margin: [l.marginX, l.marginY],
      u_gap: l.gap,
      u_size: dotSize,
      u_swell: swell,
      u_stretch: stretch,
      u_glow: glow,
      u_shape: enumOf(DOT_SHAPES, shape),
      u_fade: fade,
      u_intro: introProgress(frame.elapsed, DOT_GRID_INTRO, intro),
      u_base: rgbAt(frame.colors, 0),
      u_active: rgbAt(frame.colors, 1),
    };
  };

  const textures = () => ({ u_state: images.current[flip.current] });
  const handle = useShaderBackdrop({ fragment: DOT_GRID_FRAGMENT, uniforms, textures }, { ...options, colors: [baseColor, activeColor] });
  return (
    <BackdropShell handle={handle} fallback={dotPatternFallback(baseColor, dotSize, gap)} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
