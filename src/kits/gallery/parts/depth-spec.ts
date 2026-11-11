/**
 * DepthDeck 的规格常数与纯函数: 每张牌按相对当前项的序位算位置, 透明度与模糊.
 *
 * .agents/notes/implemented/feature/2026-11-09-kits-gallery.md
 */
import { wrapIndex } from "../../tokens";

/** 规格默认 (DepthCarousel.jsx:20-41). 长度 px, 角度 deg, 时间 ms. */
export const DEPTH_DEFAULTS = {
  cardWidth: 300,
  cardHeight: 380,
  depth: 220,
  spread: 90,
  tilt: 22,
  perspective: 1400,
  visibleCards: 4,
  falloff: 0.2,
  blur: 6,
  duration: 700,
  autoplayDelay: 3200,
} as const;
/** 滚轮两次翻页的最短间隔, 取过渡时长的一半. HX 自定. */
export const DEPTH_WHEEL_GAP = 0.5;
/** 已翻过的牌向左退出的距离, 以 spread 计. HX 自定. */
export const DEPTH_EXIT_SPREAD = 2;

export interface DepthLook {
  readonly spread: number;
  readonly depth: number;
  readonly tilt: number;
  readonly tiltSign: 1 | -1;
  readonly visible: number;
  readonly falloff: number;
  readonly blur: number;
}

export interface DepthPose {
  readonly transform: string;
  readonly opacity: number;
  readonly blur: number;
  readonly z: number;
  readonly shown: boolean;
}

/** 第 i 张相对当前项 active 的序位: 循环时落在 [-(n - visible), visible) 内取最自然的一侧. */
export function depthRank(i: number, active: number, n: number, loop: boolean): number {
  const d = i - active;
  if (!loop) return d;
  return wrapIndex(d, n);
}

/** 序位 k 的姿态. k = 0 在最前; k < 0 是翻过去的牌, 向左退场; k ≥ visible 藏在最后一张后面. */
export function depthPose(k: number, look: DepthLook): DepthPose {
  if (k < 0) {
    return { transform: `translateX(${-look.spread * DEPTH_EXIT_SPREAD}px) translateZ(0px) rotateY(0deg)`, opacity: 0, blur: 0, z: 0, shown: false };
  }
  const shown = k < look.visible;
  const kk = Math.min(k, look.visible - 1);
  const rot = kk > 0 ? look.tilt * look.tiltSign : 0;
  return {
    transform: `translateX(${kk * look.spread}px) translateZ(${-kk * look.depth}px) rotateY(${rot}deg)`,
    opacity: shown ? Math.max(0, 1 - kk * look.falloff) : 0,
    blur: look.visible > 1 ? (kk * look.blur) / (look.visible - 1) : 0,
    z: look.visible * 2 - k,
    shown,
  };
}
