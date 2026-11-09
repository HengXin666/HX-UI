/**
 * HelixScroll 的规格常数与纯函数: 螺旋上的位置, 边缘渐隐与模糊, 中心放大.
 *
 * .agents/notes/implemented/feature/2026-11-09-kits-gallery.md
 */
import { smoothstep } from "../tokens";

/** 规格默认 (InfiniteSpiral.jsx:14-33). 长度 px. */
export const HELIX_DEFAULTS = {
  speed: 0.55,
  radius: 170,
  cardWidth: 100,
  cardHeight: 100,
  verticalSpacing: 60,
  perspective: 1000,
  cardsPerTurn: 7,
  centerScale: 1.2,
  edgeFade: 0.3,
  edgeBlur: 6,
} as const;
/** 规格的 speed 按 60fps 每帧 px 计. */
export const HELIX_REF_FPS = 60;
/** 模糊从边缘度 0.35 起 (InfiniteSpiral.jsx:137). */
export const HELIX_BLUR_FROM = 0.35;
const FULL = 360;

export interface HelixPose {
  readonly y: number;
  readonly deg: number;
  readonly opacity: number;
  readonly blur: number;
  readonly scale: number;
}

export interface HelixLook {
  readonly count: number;
  readonly spacing: number;
  readonly perTurn: number;
  readonly half: number;
  readonly edgeFade: number;
  readonly edgeBlur: number;
  readonly centerScale: number;
}

/** 第 i 张在螺旋前进 offset px 后的姿态. 整条螺旋按 count × spacing 循环, y 落在 (-total/2, total/2]. */
export function helixPose(i: number, offset: number, look: HelixLook): HelixPose {
  const total = look.count * look.spacing;
  let y = total > 0 ? (((i * look.spacing - offset) % total) + total) % total : 0;
  if (y > total / 2) y -= total;
  const deg = look.perTurn > 0 ? ((y / look.spacing) * FULL) / look.perTurn : 0;
  const edge = look.half > 0 ? Math.min(1, Math.abs(y) / look.half) : 0;
  const opacity = 1 - smoothstep(1 - look.edgeFade, 1, edge);
  const blur = look.edgeBlur * smoothstep(HELIX_BLUR_FROM, 1, edge);
  const scale = 1 + (look.centerScale - 1) * (1 - smoothstep(0, 1, edge));
  return { y, deg, opacity, blur, scale };
}

/** 自动模式一帧前进的 px. */
export function helixAdvance(speed: number, dtMs: number): number {
  return (speed * HELIX_REF_FPS * dtMs) / 1000;
}
