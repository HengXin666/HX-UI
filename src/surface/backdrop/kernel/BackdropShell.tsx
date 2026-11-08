// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Backgrounds 族共用 (单画布, DPR 上限, 离屏停帧) 条目, 实现为 HX 自有.
"use client";

import type { ComponentPropsWithoutRef, JSX, ReactNode } from "react";
import { cn } from "../../../primitives/utils";
import type { BackdropHandle } from "./use-backdrop";

export interface BackdropShellProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  readonly handle: BackdropHandle;
  /** WebGL 或 2d 不可用时铺在底下的 CSS background 值. */
  readonly fallback: string;
  readonly opacity?: number;
  /** 纯 DOM 背景传 false, 不放画布. */
  readonly canvas?: boolean;
  readonly children?: ReactNode;
}

const LAYER = "pointer-events-none absolute inset-0 -z-10 block size-full";

/**
 * 背景宿主: 单画布垫底, 内容叠在上面. 宿主默认撑满父元素, 尺寸由 className 覆写.
 * 画布和兜底层都对读屏隐藏; data-backdrop-status 与 data-backdrop-plan 暴露内核状态, 便于测试与调试.
 */
export function BackdropShell({ handle, fallback, opacity, canvas = true, className, children, ...rest }: BackdropShellProps): JSX.Element {
  const failed = handle.status === "fallback";
  return (
    <div
      {...rest}
      ref={handle.hostRef}
      className={cn("relative isolate size-full overflow-hidden", className)}
      data-backdrop-status={handle.status}
      data-backdrop-plan={handle.plan}
    >
      {failed ? <div aria-hidden data-backdrop-fallback="" className={LAYER} style={{ background: fallback, opacity }} /> : null}
      {canvas ? <canvas ref={handle.canvasRef} aria-hidden className={LAYER} style={{ opacity, visibility: failed ? "hidden" : undefined }} /> : null}
      {children}
    </div>
  );
}
