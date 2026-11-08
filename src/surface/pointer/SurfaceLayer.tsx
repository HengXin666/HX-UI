"use client";
// 行为规格参照 docs/research/catalog/animations.md 的 ClickSpark, Crosshair, BlobCursor 等画布条目 (叠在内容上的单画布), 实现为 HX 自有.

import type { CSSProperties, JSX, ReactNode } from "react";
import type { BackdropHandle } from "../backdrop/kernel/use-backdrop";
import { cn } from "../../primitives/utils";

export interface SurfaceLayerProps {
  readonly handle: BackdropHandle;
  /** 画布叠在内容上方 (指针效果) 还是垫在下面 (场效果). */
  readonly front?: boolean;
  /** 内核拿不到上下文时铺的 CSS background, 不给就什么都不铺. */
  readonly fallback?: string;
  readonly opacity?: number;
  readonly slot: string;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly children?: ReactNode;
}

/**
 * Animations 族的宿主: 与 backdrop 内核的 BackdropShell 同一套 refs 与状态属性, 只是画布可以叠在内容上方,
 * 宿主也不强制撑满父元素. 画布对读屏隐藏且不接收指针; 指针由内核挂在宿主上.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-pointer.md
 */
export function SurfaceLayer({ handle, front = true, fallback, opacity, slot, className, style, children }: SurfaceLayerProps): JSX.Element {
  const failed = handle.status === "fallback";
  const layer = cn("pointer-events-none absolute inset-0 block size-full", front ? "z-10" : "-z-10");
  return (
    <div ref={handle.hostRef} data-slot={slot} data-backdrop-status={handle.status} data-backdrop-plan={handle.plan} className={cn("relative isolate", className)} style={style}>
      {failed && fallback ? <div aria-hidden className={layer} style={{ background: fallback, opacity }} /> : null}
      <canvas ref={handle.canvasRef} aria-hidden className={layer} style={{ opacity, visibility: failed ? "hidden" : undefined }} />
      {children}
    </div>
  );
}
