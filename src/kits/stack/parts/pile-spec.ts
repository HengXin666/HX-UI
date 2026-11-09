/**
 * ScrollPile 的规格常数与纯函数: 钉住位置, 每张卡随滚动的位移, 缩放, 压暗, 模糊与转角, 滚轮平滑.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-stack.md
 */
import { clamp } from "../tokens";

export const PILE_DEFAULTS = {
  itemDistance: 100,
  itemStackDistance: 24,
  stackPosition: "15%",
  itemScale: 0.05,
  baseScale: 0.8,
  dimAmount: 0.2,
  blurAmount: 0,
  tiltAmount: 0,
  rotationAmount: 0,
  holdDistance: 200,
} as const;
/** 平滑滚动每 1/60 秒剩 0.9 的差 (ScrollStack.jsx:208). */
export const PILE_SMOOTH_KEEP = 0.9;
export const PILE_FRAME_S = 1 / 60;
/** 平滑滚动落定阈值 px. */
export const PILE_REST_PX = 0.5;

/** stackPosition: 数字为 px, "15%" 为视口高的比例. */
export function stackOffset(position: number | string, viewport: number): number {
  if (typeof position === "number") return position;
  const value = Number.parseFloat(position);
  if (!Number.isFinite(value)) return 0;
  return position.trim().endsWith("%") ? (value / 100) * viewport : value;
}

/** 平滑滚动一帧: 帧率无关, 每 1/60 秒剩 0.9 的差. */
export function pileSmooth(current: number, goal: number, dtMs: number): number {
  const next = current + (goal - current) * (1 - PILE_SMOOTH_KEEP ** (dtMs / 1000 / PILE_FRAME_S));
  return Math.abs(goal - next) < PILE_REST_PX ? goal : next;
}

export interface PileOptions {
  readonly stack: number;
  readonly itemStackDistance: number;
  readonly itemScale: number;
  readonly baseScale: number;
  readonly dimAmount: number;
  readonly blurAmount: number;
  readonly tiltAmount: number;
  readonly rotationAmount: number;
  readonly holdDistance: number;
}

export interface PilePose {
  /** 为钉住而补的下移 px. */
  readonly y: number;
  readonly scale: number;
  /** 亮度 1 - 压暗. */
  readonly brightness: number;
  readonly blur: number;
  readonly rotate: number;
  readonly tilt: number;
}

/** 第 i 张卡开始钉住时的滚动位置. */
export function pinAt(top: number, i: number, o: Pick<PileOptions, "stack" | "itemStackDistance">): number {
  return top - o.stack - i * o.itemStackDistance;
}

/**
 * 第 i 张卡在滚动位置 scroll 的姿态. tops 为各卡布局上沿 (不含变换).
 * 卡滚到钉住线后停住, 直到最后一张钉住再过 holdDistance 一起离开; 后面的卡盖上来时它缩到 baseScale + i itemScale, 压暗并可模糊转动.
 */
export function pilePose(i: number, tops: readonly number[], scroll: number, o: PileOptions): PilePose {
  const n = tops.length;
  const pins = tops.map((t, k) => pinAt(t, k, o));
  const pin = pins[i] ?? 0;
  const last = pins[n - 1] ?? 0;
  const y = clamp(scroll - pin, 0, Math.max(0, last + o.holdDistance - pin));
  const p = i < n - 1 && last > pin ? clamp((scroll - pin) / (last - pin), 0, 1) : 0;
  const covered = pins.filter((q, k) => k > i && scroll >= q).length;
  const target = o.baseScale + i * o.itemScale;
  return {
    y,
    scale: 1 - p * (1 - target),
    brightness: 1 - o.dimAmount * p,
    blur: o.blurAmount * covered,
    rotate: o.rotationAmount * i * p,
    tilt: o.tiltAmount * p,
  };
}

/** 最后一张钉住即叠完. */
export function pileComplete(tops: readonly number[], scroll: number, o: Pick<PileOptions, "stack" | "itemStackDistance">): boolean {
  const n = tops.length;
  return n > 0 && scroll >= pinAt(tops[n - 1] ?? 0, n - 1, o);
}
