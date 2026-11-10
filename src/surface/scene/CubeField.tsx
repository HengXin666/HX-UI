"use client";
// 行为规格参照 docs/research/catalog/animations.md 的 Cubes 条目, 实现为 HX 自有.
// ENGINE-GAP (仍做不了, 需内核实例化 / 数据纹理): 规格是实例化方块网格走顶点投影 (uProjection); 这里片元里对邻近 9 块做射线与旋转盒求交,
// 每块状态走 vec4 uniform 数组, 片元 uniform 向量保底只有 224 个, 所以 gridSize 上限 13 (规格无上限); 要内核能上传浮点数据纹理才能放开.

import { useRef, type JSX } from "react";
import { BackdropShell } from "../backdrop/kernel/BackdropShell";
import type { Rgb } from "../backdrop/kernel/color";
import { splitCommon, type BackdropCommonProps } from "../backdrop/kernel/common";
import { glowFallback } from "../backdrop/kernel/fallback";
import type { BackdropFrame } from "../backdrop/kernel/use-backdrop";
import { useShaderBackdrop } from "../backdrop/kernel/use-surfaces";
import { cubeGrid, makeCubes, packCubes, stepCubes } from "./parts/cube";
import { CUBE_FRAGMENT } from "./parts/cube-shader";
import { CUBE } from "./tokens";

export type CubeEdgeStyle = keyof typeof CUBE.styles;

export interface CubeFieldProps extends BackdropCommonProps {
  /** 每边方块数, 默认 10, 上限 13 (见文件头 ENGINE-GAP). */
  readonly gridSize?: number;
  /** 方块间隙占格宽的比例, 默认 0.18. */
  readonly gap?: number;
  /** 面色 / 边线色 / 涟漪色 (token 名), 默认 background / foreground / primary. */
  readonly faceColor?: string;
  readonly edgeColor?: string;
  readonly rippleColor?: string;
  /** 边线宽 (CSS 像素), 默认 1. */
  readonly edgeWidth?: number;
  readonly edgeStyle?: CubeEdgeStyle;
  readonly faceOpacity?: number;
  /** 打光强度 0..1, 默认 0.6. */
  readonly shading?: number;
  /** 最大倾角 (度), 默认 45. */
  readonly maxAngle?: number;
  /** 光标影响半径 (格), 默认 3. */
  readonly radius?: number;
  /** 弹簧快慢 (k = 160 x tilt^2; speed 与公共时钟倍率同名, 改名 tiltSpeed), 默认 1. */
  readonly tiltSpeed?: number;
  /** 回弹 0..1, 默认 0.4. */
  readonly bounce?: number;
  /** 半径乘子, 默认 1. */
  readonly brush?: number;
  /** 透视 0..1, 0 为正交俯视. */
  readonly perspective?: number;
  /** 光标不在时自己漫游, 默认 true. */
  readonly autoAnimate?: boolean;
  readonly rippleOnClick?: boolean;
  readonly rippleSpeed?: number;
  /** 挂载时由中心向外长出, 默认 true. */
  readonly intro?: boolean;
}

const GREY: Rgb = [0.5, 0.5, 0.5];

/**
 * 方块阵: n x n 块方块俯视铺在宿主中央, 光标附近的方块按弹簧倾向光标, 扫过时被带着转, 点击放出一圈涟漪把方块踢翻并发亮;
 * 光标不在时可自动漫游. 宿主撑满父元素, 画布垫在 children 下面. 减弱动效时只画一帧平放的方阵.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-scene.md
 */
export function CubeField(props: CubeFieldProps): JSX.Element {
  const {
    gridSize = CUBE.gridSize, gap = CUBE.gap, faceColor = "background", edgeColor = "foreground", rippleColor = "primary", edgeWidth = CUBE.edgeWidth, edgeStyle = "solid",
    faceOpacity = CUBE.faceOpacity, shading = CUBE.shading, maxAngle = CUBE.maxAngle, radius = CUBE.radius, tiltSpeed = 1, bounce = CUBE.bounce, brush = CUBE.brush,
    perspective = CUBE.perspective, autoAnimate = true, rippleOnClick = true, rippleSpeed = CUBE.rippleSpeed, intro = true, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const n = cubeGrid(gridSize);
  const sim = useRef(makeCubes(n));
  if (sim.current.n !== n) sim.current = makeCubes(n);

  const uniforms = (frame: BackdropFrame) => {
    const { width, height } = frame.fit;
    const cell = Math.min(width, height) / n;
    const toGrid = (x: number, y: number) => ({ x: ((x - 0.5) * width) / cell, y: ((y - 0.5) * height) / cell });
    const p = frame.pointer;
    if (!frame.reduced) {
      stepCubes(sim.current, frame.dt, frame.elapsed, { pointer: p.inside ? toGrid(p.x, p.y) : null, taps: p.taps.map((t) => ({ ...toGrid(t.x, t.y), at: t.at })) }, {
        maxAngle, radius, speed: tiltSpeed, bounce, brush, autoAnimate, rippleOnClick, rippleSpeed,
      });
    }
    return {
      u_cubes: { list: packCubes(sim.current, intro && !frame.reduced), size: 4 as const },
      u_n: n,
      u_gap: Math.min(0.9, Math.max(0, gap)),
      u_persp: Math.min(1, Math.max(0, perspective)),
      u_face: frame.colors[0] ?? GREY,
      u_edge: frame.colors[1] ?? GREY,
      u_ripple: frame.colors[2] ?? GREY,
      u_edge_width: edgeWidth,
      u_style: CUBE.styles[edgeStyle] ?? 0,
      u_face_opacity: faceOpacity,
      u_shading: shading,
    };
  };

  const handle = useShaderBackdrop({ fragment: CUBE_FRAGMENT, uniforms }, { ...options, colors: [faceColor, edgeColor, rippleColor] });
  return (
    <BackdropShell handle={handle} fallback={glowFallback(faceColor, rippleColor)} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
