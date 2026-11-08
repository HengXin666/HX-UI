// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Backgrounds 族共用 (单画布, DPR 上限, 离屏停帧) 条目, 实现为 HX 自有.
import type { RefObject } from "react";
import type { CanvasFit } from "./math";
import type { BackdropFactory, BackdropFrame } from "./use-backdrop";

/** Canvas2D 背景: 每帧在设备像素坐标里画一遍. 内核不替它清屏, 拖尾类效果自己决定怎么擦. */
export interface CanvasSpec {
  readonly draw: (ctx: CanvasRenderingContext2D, frame: BackdropFrame) => void;
  readonly resize?: (fit: CanvasFit) => void;
}

/** 纯 DOM 背景: 内核只给调度, 指针与颜色, 渲染直接改宿主里的节点. */
export interface DomSpec {
  readonly render: (host: HTMLElement, frame: BackdropFrame) => void;
  readonly resize?: (fit: CanvasFit) => void;
}

/** Canvas2D 渲染器工厂. 拿不到 2d 上下文时返回 null, 走 CSS 兜底. */
export function canvasFactory(spec: RefObject<CanvasSpec>): BackdropFactory {
  return (canvas) => {
    const ctx = canvas?.getContext("2d") ?? null;
    if (!ctx) return null;
    return {
      resize: (fit) => spec.current.resize?.(fit),
      render: (frame) => spec.current.draw(ctx, frame),
      dispose: () => undefined,
    };
  };
}

/** DOM 渲染器工厂, 永远可用. */
export function domFactory(spec: RefObject<DomSpec>): BackdropFactory {
  return (_canvas, host) => ({
    resize: (fit) => spec.current.resize?.(fit),
    render: (frame) => spec.current.render(host, frame),
    dispose: () => undefined,
  });
}
