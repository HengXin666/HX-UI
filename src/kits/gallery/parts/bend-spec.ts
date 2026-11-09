/**
 * BendGallery 的规格常数与纯函数: 帧率无关的跟随, 圆弧上的位移与转角.
 *
 * .agents/notes/implemented/feature/2026-11-09-kits-gallery.md
 */

/** 规格默认 (CircularGallery.jsx:229-252). bend 为弧的弯曲度, gap 为卡宽的比例. */
export const BEND_DEFAULTS = { bend: 3, scrollSpeed: 2, scrollEase: 0.05, gap: 0.26, autoScroll: 0, itemAspect: 0.78 } as const;
/** 规格按 60fps 定义跟随系数 (CircularGallery.jsx:702). */
export const BEND_REF_FPS = 60;
/** 滚轮停下多久后吸附到最近一项 ms. HX 自定. */
export const BEND_SNAP_IDLE_MS = 140;
/** 滚轮 delta 每 px 推进多少项 (乘 scrollSpeed). HX 自定. */
export const BEND_WHEEL_UNIT = 0.004;
/** 跟随收敛阈值 (项). */
export const BEND_SETTLE = 0.0005;
/** 自动滚动: 规格每秒推进 autoScroll × 0.25 个间距 (CircularGallery.jsx:701). */
export const BEND_AUTO_RATE = 0.25;
const MS_TO_FRAMES = BEND_REF_FPS / 1000;

/** 帧率无关的跟随系数: 1 - (1 - ease)^(dt × 60). */
export function followFactor(ease: number, dtMs: number): number {
  const e = Math.min(1, Math.max(0, ease));
  return 1 - Math.pow(1 - e, dtMs * MS_TO_FRAMES);
}

/**
 * 横向偏移 x (px) 的卡片落在半径 R = width / bend 的圆弧上: 下沉 dy (px) 与转角 deg.
 * bend 为 0 时是直线. bend 为负时弧向上拱.
 */
export function arcPlace(x: number, width: number, bend: number): { dy: number; deg: number } {
  if (!bend || width <= 0) return { dy: 0, deg: 0 };
  const r = width / Math.abs(bend);
  const cx = Math.min(Math.abs(x), r);
  const dy = r - Math.sqrt(r * r - cx * cx);
  const deg = (Math.asin(cx / r) * 180) / Math.PI;
  const sx = Math.sign(x);
  return bend > 0 ? { dy, deg: sx * deg } : { dy: -dy, deg: -sx * deg };
}
