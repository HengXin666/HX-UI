"use client";

import type { JSX } from "react";

/**
 * 画布网格  对齐 UE5 的双层网格。
 *
 * ## UE5 的实际规格
 *
 * 网格粒度是 `UEditorStyleSettings::GridSnapSize`, 默认 **16**。
 * 细线每 16px 一条, 每 8 格 (128px) 一条更亮的主线  缩得很远时靠主线
 * 判断大致位置, 拉近时靠细线对齐。
 *
 * 颜色官方没公开, 这里用极低透明度的白/黑 (走 --bp-grid-line 令牌),
 * 亮暗主题各自取值。
 *
 * ## 为什么用 background-image 而不是 SVG
 *
 * 一层 div + 两条 linear-gradient 就能画出来, 缩放时只改 background-size
 * 与 position  不产生任何 DOM 节点。而 SVG 网格要生成上百条 line,
 * 平移缩放时每帧重排, 大图上会明显掉帧。
 *
 * 代价是"对齐到视口"要手动算 position, 但那只是两个减法。
 */

export interface GridView {
  readonly x: number;
  readonly y: number;
  readonly zoom: number;
}

/** 细线间距 (图坐标)。与 UE5 的 GridSnapSize 默认 16 对齐。 */
export const GRID_SIZE = 16;
/** 每几格画一条主线。 */
export const GRID_MAJOR_EVERY = 8;

export function CanvasGrid({ view }: { readonly view: GridView }): JSX.Element {
  const step = GRID_SIZE * view.zoom;
  // 缩得太小就不画细线了: 那时细线会糊成一片灰, 反而干扰
  const showMinor = step >= 6;
  const major = step * GRID_MAJOR_EVERY;

  const minor = showMinor
    ? `linear-gradient(to right, var(--bp-grid-line) 1px, transparent 1px),
       linear-gradient(to bottom, var(--bp-grid-line) 1px, transparent 1px)`
    : "";
  const majorLines = `linear-gradient(to right, var(--bp-grid-line-bold) 1px, transparent 1px),
       linear-gradient(to bottom, var(--bp-grid-line-bold) 1px, transparent 1px)`;

  return (
    <div
      data-grid="1"
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: showMinor ? `${minor}, ${majorLines}` : majorLines,
        backgroundSize: showMinor ? `${step}px ${step}px, ${step}px ${step}px, ${major}px ${major}px, ${major}px ${major}px` : `${major}px ${major}px, ${major}px ${major}px`,
        backgroundPosition: `${view.x}px ${view.y}px`,
      }}
    />
  );
}
