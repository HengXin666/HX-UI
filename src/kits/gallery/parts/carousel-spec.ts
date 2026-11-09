/**
 * SpringCarousel 的规格常数与纯函数: 弹簧, 环上相对位置, 松手落点.
 *
 * .agents/notes/implemented/feature/2026-11-09-kits-gallery.md
 */
import type { SpringSpec } from "../../../craft/spring";
import { wrapIndex } from "../tokens";

/** 规格 STIFFNESS / DAMPING (Carousel.jsx:90-91), 质量 1. */
export const CAROUSEL_SPRING: SpringSpec = { stiffness: 150, damping: 24, mass: 1 };
/** 自动播放间隔 ms; 规格未给默认, HX 自定. */
export const CAROUSEL_AUTOPLAY_MS = 4000;
/** 松手时拖过宽度的这一比例就翻页. HX 自定. */
export const CAROUSEL_FLIP_RATIO = 0.2;
/** 松手速度超过这个值 (px/ms) 也翻页. HX 自定. */
export const CAROUSEL_FLICK = 0.3;
/** 指示点宽度过渡 ms 与曲线取规格 (Carousel.jsx:628) 的 320ms (0.2, 0.8, 0.2, 1) 近似 lift. */
export const CAROUSEL_DOT_MS = 320;

/** 第 i 张相对当前位置 x 的偏移 (单位: 张). 循环时落在 (-n/2, n/2]. */
export function slideOffset(i: number, x: number, n: number, loop: boolean): number {
  const d = i - x;
  if (!loop || n < 3) return d;
  const w = wrapIndex(d, n);
  return w > n / 2 ? w - n : w;
}

/** 松手落点: 从起始页 start 出发, 位移或速度够大就走一页. dx / vx 向左为负. */
export function releaseTarget(start: number, dx: number, vx: number, width: number): number {
  const far = width > 0 && Math.abs(dx) > width * CAROUSEL_FLIP_RATIO;
  const fast = Math.abs(vx) > CAROUSEL_FLICK;
  if (!far && !fast) return start;
  const dir = (fast ? vx : dx) < 0 ? 1 : -1;
  return start + dir;
}
