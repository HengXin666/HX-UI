/**
 * compose 族画布件 (输入框流光, 听写波形, 显影遮罩) 共用的画布尺寸与取色. 帧循环与跟随在 src/motion.
 *
 * .agents/notes/implemented/feature/2026-11-08-controls-compose.md
 */
import { DPR_CAP } from "./tokens";

/** 按像素比 (上限 2) 设定画布尺寸, 返回已缩放到 CSS 像素的上下文. */
export function fitCanvas(canvas: HTMLCanvasElement, width: number, height: number): CanvasRenderingContext2D | null {
  const dpr = Math.min(DPR_CAP, globalThis.devicePixelRatio || 1);
  const w = Math.max(1, Math.round(width * dpr));
  const h = Math.max(1, Math.round(height * dpr));
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const ctx = canvas.getContext?.("2d") ?? null;
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

/** 画布取色: 读元素计算后的 color, 颜色由语义 token 类给出. */
export function inkOf(el: Element): string {
  return getComputedStyle(el).color;
}
