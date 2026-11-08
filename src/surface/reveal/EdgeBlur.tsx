"use client";
// 行为规格参照 docs/research/catalog/animations.md 的 GradualBlur 条目, 实现为 HX 自有.

import { useState, type CSSProperties, type JSX } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { cn } from "../../primitives/utils";
import { TONE_CLASS, type SurfaceTone } from "../pointer/tone";
import { EDGE_BLUR, EDGE_CURVES, MS_PER_S, PERCENT, type EdgeCurve } from "./tokens";

export type EdgeSide = "top" | "bottom" | "left" | "right";

const TOWARD: Record<EdgeSide, string> = { top: "to top", bottom: "to bottom", left: "to left", right: "to right" };
const PLACE: Record<EdgeSide, string> = { top: "inset-x-0 top-0", bottom: "inset-x-0 bottom-0", left: "inset-y-0 left-0", right: "inset-y-0 right-0" };

/**
 * 第 i 层 (0 起) 的模糊半径 px. 层越靠边越糊: 线性按曲线分布, 指数按 2^(4t) - 1 归一化.
 *
 * @param strength 强度倍数, 最大模糊为 strength * 4px * 层数比例.
 */
export function layerBlur(i: number, layers: number, strength: number, curve: EdgeCurve, exponential: boolean): number {
  const t = (i + 1) / Math.max(1, layers);
  const k = exponential ? (2 ** (EDGE_BLUR.expSpan * t) - 1) / (2 ** EDGE_BLUR.expSpan - 1) : EDGE_CURVES[curve](t);
  return strength * EDGE_BLUR.blurUnit * layers * k;
}

/** 第 i 层的遮罩: 只在它那一段 (向边缘方向逐层后移) 不透明, 两端渐变. */
export function layerMask(i: number, layers: number, side: EdgeSide): string {
  const step = PERCENT / Math.max(1, layers);
  const a = i * step;
  const b = Math.min(PERCENT, (i + 1) * step);
  const c = Math.min(PERCENT, (i + 2) * step);
  return `linear-gradient(${TOWARD[side]}, transparent ${a}%, black ${b}%, black ${c}%, transparent ${Math.min(PERCENT, c + step)}%)`;
}

export interface EdgeBlurProps {
  readonly position?: EdgeSide;
  /** 上下边时的高度, 任意 CSS 长度. */
  readonly height?: string;
  /** 左右边时的宽度, 任意 CSS 长度. */
  readonly width?: string;
  readonly strength?: number;
  readonly layers?: number;
  readonly curve?: EdgeCurve;
  readonly exponential?: boolean;
  readonly opacity?: number;
  /** 背后内容的饱和度倍数. */
  readonly saturation?: number;
  /** 叠一层淡色调, 不给不叠. */
  readonly tint?: SurfaceTone;
  /** 悬停时模糊乘的倍数. */
  readonly hoverIntensity?: number;
  /** 强度变化的过渡秒数. */
  readonly duration?: number;
  /** 铺满视口边缘 (fixed), 默认贴着父元素 (absolute). */
  readonly fixed?: boolean;
  readonly className?: string;
  readonly style?: CSSProperties;
}

/**
 * 边缘渐进模糊: 几层叠起来的 backdrop-filter, 越靠边越糊, 每层只在自己那段可见. 悬停时整体加强,
 * 强度变化是 CSS 过渡; 减弱动效时没有过渡, 直接到位.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-reveal.md
 */
export function EdgeBlur({
  position = "bottom",
  height = EDGE_BLUR.height,
  width = EDGE_BLUR.height,
  strength = EDGE_BLUR.strength,
  layers = EDGE_BLUR.layers,
  curve = "linear",
  exponential = true,
  opacity = 1,
  saturation = 1,
  tint,
  hoverIntensity = EDGE_BLUR.hoverIntensity,
  duration = EDGE_BLUR.duration,
  fixed = false,
  className,
  style,
}: EdgeBlurProps): JSX.Element {
  const reduced = useReducedMotion();
  const [hover, setHover] = useState(false);
  const n = Math.max(1, Math.round(layers));
  const gain = hover ? hoverIntensity : 1;
  const transition = reduced ? "none" : `backdrop-filter ${duration * MS_PER_S}ms ease-out, -webkit-backdrop-filter ${duration * MS_PER_S}ms ease-out`;
  const vertical = position === "top" || position === "bottom";
  return (
    <div
      aria-hidden
      data-slot="edge-blur"
      className={cn(fixed ? "fixed" : "absolute", PLACE[position], "isolate", hoverIntensity !== 1 ? "pointer-events-auto" : "pointer-events-none", className)}
      style={{ [vertical ? "height" : "width"]: vertical ? height : width, opacity, ...style }}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      {Array.from({ length: n }, (_, i) => {
        const filter = `blur(${layerBlur(i, n, strength * gain, curve, exponential).toFixed(2)}px) saturate(${saturation})`;
        const mask = layerMask(i, n, position);
        return <div key={i} className="absolute inset-0" style={{ backdropFilter: filter, WebkitBackdropFilter: filter, maskImage: mask, WebkitMaskImage: mask, transition }} />;
      })}
      {tint ? <div className={cn("absolute inset-0 bg-current opacity-10", TONE_CLASS[tint])} style={{ maskImage: `linear-gradient(${TOWARD[position]}, transparent, black)` }} /> : null}
    </div>
  );
}
