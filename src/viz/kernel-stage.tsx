"use client";

import { useId, type JSX, type ReactNode, type Ref } from "react";
import { CANVAS_THRESHOLD, STAGE_HEIGHT, STAGE_PADDING, type StageRenderer } from "../constants/data-stage";
import { useResizeObserver } from "../hooks/dom/useResizeObserver";
import { cn } from "../primitives/utils";
import { VIZ_CLASS } from "./tokens";

/**
 * 数据舞台: 量宽度, 算出绘图区, 决定 svg 还是 canvas, 并给读屏一个名字和摘要. 图种只管在绘图区里画.
 * .agents/notes/implemented/architecture/2026-11-19-omni-data-kernel.md
 */

export interface StagePadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface StageInner {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface StageSize {
  width: number;
  height: number;
  inner: StageInner;
  renderer: Exclude<StageRenderer, "auto">;
}

export interface DataStageProps {
  /** 读屏名称, 也是图注. */
  label: string;
  /** 给读屏的一句话摘要 (趋势, 最大值). 视觉上隐藏. */
  summary?: string;
  height?: number;
  /** 量不到宽度时 (服务端, 测试) 用的宽度. */
  width?: number;
  padding?: Partial<StagePadding>;
  renderer?: StageRenderer;
  /** 数据点总数, auto 渲染据此判断. */
  points?: number;
  /** 挂到根节点的 ref, 给 useVizStage 的视口判定用. */
  stageRef?: Ref<HTMLElement>;
  /** 根节点的额外属性: 冲击标记. */
  shocked?: boolean;
  slot?: string;
  className?: string;
  children: (size: StageSize) => ReactNode;
  /** 绘图区之后的内容 (读数). */
  footer?: ReactNode;
}

export function stageRenderer(mode: StageRenderer, points: number): StageSize["renderer"] {
  if (mode !== "auto") return mode;
  return points > CANVAS_THRESHOLD ? "canvas" : "svg";
}

export function stageInner(width: number, height: number, padding: Partial<StagePadding> = {}): StageInner {
  const pad = { ...STAGE_PADDING, ...padding };
  return { x: pad.left, y: pad.top, w: Math.max(0, width - pad.left - pad.right), h: Math.max(0, height - pad.top - pad.bottom) };
}

export function DataStage({
  label,
  summary,
  height = STAGE_HEIGHT,
  width,
  padding,
  renderer = "auto",
  points = 0,
  stageRef,
  shocked,
  slot = "hx-data-stage",
  className,
  children,
  footer,
}: DataStageProps): JSX.Element {
  const [plotRef, rect] = useResizeObserver<HTMLDivElement>();
  const summaryId = useId();
  const measured = rect.width > 0 ? rect.width : (width ?? 0);
  const size: StageSize = { width: measured, height, inner: stageInner(measured, height, padding), renderer: stageRenderer(renderer, points) };

  return (
    <figure ref={stageRef as Ref<HTMLElement>} data-slot={slot} data-renderer={size.renderer} data-shock={shocked ? "" : undefined} className={cn(VIZ_CLASS.figure, className)}>
      <figcaption className={VIZ_CLASS.caption}>{label}</figcaption>
      <div ref={plotRef} role="img" aria-label={label} aria-describedby={summary ? summaryId : undefined} className={VIZ_CLASS.plot} style={{ height }}>
        {measured > 0 ? children(size) : null}
      </div>
      {summary ? (
        <p id={summaryId} className="sr-only">
          {summary}
        </p>
      ) : null}
      {footer}
    </figure>
  );
}
