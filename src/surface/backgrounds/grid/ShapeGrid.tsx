"use client";
// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 ShapeGrid 条目, 实现为 HX 自有.

import { useRef, type JSX } from "react";
import { BackdropShell } from "../../backdrop/kernel/BackdropShell";
import { cssColorOf } from "../../backdrop/kernel/color";
import { splitCommon, type BackdropCommonProps } from "../../backdrop/kernel/common";
import type { BackdropFrame } from "../../backdrop/kernel/use-backdrop";
import { useCanvasBackdrop } from "../../backdrop/kernel/use-surfaces";
import { drawShapeGrid, makeShapeGridState, stepShapeGrid, type ShapeGridOptions } from "./shape-grid-field";
import type { GridDirection, GridShape } from "./shape-grid-geometry";
import { rgbAt } from "./tokens";

const TRANSPARENT = "transparent";

export interface ShapeGridProps extends BackdropCommonProps {
  /** 格形: square / hex / circle / triangle. */
  readonly shape?: GridShape;
  /** 格距 (CSS 像素), 默认 40. */
  readonly cellSize?: number;
  /** 线宽 (CSS 像素), 默认 1. */
  readonly lineWidth?: number;
  /** 滚动方向: diagonal / right / left / up / down / none. */
  readonly direction?: GridDirection;
  /** 滚动速度, speed * 60 像素每秒, 默认 0.5. */
  readonly scrollSpeed?: number;
  /** 底线色, token 名或 CSS 颜色, 默认 border. */
  readonly lineColor?: string;
  /** 高亮描边色, 默认 foreground. */
  readonly hoverColor?: string;
  /** 高亮填充色, 默认同 hoverColor. */
  readonly hoverFillColor?: string;
  /** 高亮填充不透明度, 默认 0.15. */
  readonly fillOpacity?: number;
  /** 高亮按色相环着色. */
  readonly rainbow?: boolean;
  /** 绕横轴倾角 (度), 默认 0. */
  readonly tiltX?: number;
  /** 绕纵轴倾角 (度), 默认 0. */
  readonly tiltY?: number;
  /** 光斑半径 (格), 默认 1.5. */
  readonly radius?: number;
  /** 拖尾衰减时间常数 (秒), 默认 0.6. */
  readonly trail?: number;
  /** 高亮光晕, 默认 0.35. */
  readonly glow?: number;
  /** 随机格闪烁强度, 默认 0. */
  readonly twinkle?: number;
  /** 四边淡出 0..1, 默认 1. */
  readonly fade?: number;
  /** 点击打出一圈外扩的亮环. */
  readonly clickCascade?: boolean;
  /** 首帧起由中心向外铺开. */
  readonly intro?: boolean;
  /** 底色, 默认透明. */
  readonly backgroundColor?: string;
}

/** WebGL 与 2d 都不可用时的静态方格: 两层 1px 线性渐变平铺, 底色可选. */
export function gridLinesFallback(line: string, size: number, background: string | null): string {
  const ink = cssColorOf(line);
  const tile = `0 0 / ${size}px ${size}px`;
  const layers = [`linear-gradient(${ink} 1px, transparent 1px) ${tile}`, `linear-gradient(90deg, ${ink} 1px, transparent 1px) ${tile}`];
  return background ? [...layers, cssColorOf(background)].join(", ") : layers.join(", ");
}

/**
 * 滚动格面: 方, 六角, 圆, 三角四种格形匀速平移, 指针处有弹簧跟随的光斑点亮格子并留拖尾, 点击打出外扩亮环,
 * 可选透视倾斜, 彩虹与随机闪烁. Canvas2D, 底线按透明度分桶合并描边.
 * 规格里的 speed (滚动速度) 与公共时钟倍率同名, 本件改名 scrollSpeed.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-grid.md
 */
export function ShapeGrid(props: ShapeGridProps): JSX.Element {
  const {
    shape = "square", cellSize = 40, lineWidth = 1, direction = "diagonal", scrollSpeed = 0.5, lineColor = "border", hoverColor = "foreground",
    hoverFillColor, fillOpacity = 0.15, rainbow = false, tiltX = 0, tiltY = 0, radius = 1.5, trail = 0.6, glow = 0.35, twinkle = 0, fade = 1,
    clickCascade = true, intro = true, backgroundColor = TRANSPARENT, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const state = useRef(makeShapeGridState());
  const opaqueBackground = backgroundColor !== TRANSPARENT;
  const o: ShapeGridOptions = {
    shape, cellSize, lineWidth, direction, speed: scrollSpeed, fillOpacity, rainbow, tiltX, tiltY, radius, trail, glow, twinkle, fade,
    clickCascade, intro, opaqueBackground,
  };

  const draw = (ctx: CanvasRenderingContext2D, frame: BackdropFrame): void => {
    const w = frame.fit.width / frame.fit.scale;
    const h = frame.fit.height / frame.fit.scale;
    const p = frame.pointer;
    stepShapeGrid(state.current, frame.dt, o, p.inside ? [p.x * w, (1 - p.y) * h] : null);
    drawShapeGrid(ctx, frame, state.current, o, {
      line: rgbAt(frame.colors, 0),
      hover: rgbAt(frame.colors, 1),
      fill: rgbAt(frame.colors, 2),
      background: rgbAt(frame.colors, 3),
    });
  };

  const colors = [lineColor, hoverColor, hoverFillColor ?? hoverColor, opaqueBackground ? backgroundColor : lineColor];
  const handle = useCanvasBackdrop({ draw }, { ...options, colors });
  const fallback = gridLinesFallback(lineColor, cellSize, opaqueBackground ? backgroundColor : null);
  return (
    <BackdropShell handle={handle} fallback={fallback} opacity={opacity} {...rest}>
      {children}
    </BackdropShell>
  );
}
