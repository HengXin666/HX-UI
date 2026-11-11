// SparkMark 的 2d 逐帧层: 规格技法里的 "canvas2d 逐帧画" 与 onRender (ElectricLogo.jsx:599) 落成受控出口.
// 用户 2026-11-11 定: onRender 受控出口, 默认不画 (不给 onRender 就不建 2d 画布, 也不付这层的成本).

/** 每帧交给 onRender 的信息. 尺寸是 CSS 像素, ctx 已按 dpr 缩放并清空, 坐标原点在左上. */
export interface SparkRenderInfo {
  readonly time: number;
  readonly dt: number;
  readonly width: number;
  readonly height: number;
  readonly dpr: number;
  /** 形变进度 0..1 (1 为已落定). */
  readonly morph: number;
  /** 光标升温点 (宿主内 0..1, y 向下) 与强度 0..1. */
  readonly hover: { readonly x: number; readonly y: number; readonly power: number };
  /** 电弧芯色与辉光色, 0..1 的 RGB (由 color / glowColor 两个 token 解析而来). */
  readonly colors: readonly (readonly [number, number, number])[];
  readonly reduced: boolean;
}

export type SparkRender = (ctx: CanvasRenderingContext2D, info: SparkRenderInfo) => void;

/** 把 2d 画布对到宿主尺寸 (设备像素), 清空, 按 dpr 缩放后调 onRender. 画布或 2d 上下文不可用时什么也不做, 返回 false. */
export function drawSparkLayer(canvas: HTMLCanvasElement | null, render: SparkRender | undefined, info: SparkRenderInfo): boolean {
  if (!canvas || !render) return false;
  const w = Math.max(1, Math.round(info.width * info.dpr));
  const h = Math.max(1, Math.round(info.height * info.dpr));
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.setTransform(info.dpr, 0, 0, info.dpr, 0, 0);
  ctx.save();
  try {
    render(ctx, info);
  } finally {
    ctx.restore();
  }
  return true;
}
