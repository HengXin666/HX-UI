// 行为规格参照 docs/research/catalog/animations.md 的 RippleDistortion 条目, 实现为 HX 自有.
/**
 * RippleLens 的波队列: 指针每走 spacing 像素放一个波 (hover), 点击放一个 clickStrength 倍的波 (click), 振幅按 exp(-age x fade) 衰减,
 * 低于 EDGE 出队, 最多 100 个. 坐标是 CSS 像素. 纯函数.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-field.md
 */
import { LENS } from "../tokens";

export type LensTrigger = "hover" | "click" | "both";

export interface LensWave {
  readonly x: number;
  readonly y: number;
  readonly born: number;
  readonly strength: number;
}

export interface LensState {
  waves: LensWave[];
  lastX: number;
  lastY: number;
  travel: number;
  seenTap: number;
  placed: boolean;
}

export function makeLens(): LensState {
  return { waves: [], lastX: 0, lastY: 0, travel: 0, seenTap: -1, placed: false };
}

/** 波的寿命 (秒): 振幅 exp(-age x fade) 降到 EDGE 的时刻. */
export function lensLife(fade: number): number {
  return -Math.log(LENS.edge) / Math.max(0.01, fade);
}

/** 第 age 秒时波的半径 (CSS 像素). */
export function lensRadius(age: number, brushSize: number, spread: number): number {
  return (brushSize * 0.5) / LENS.startScale + age * spread * brushSize * LENS.growth;
}

export interface LensTuning {
  readonly trigger: LensTrigger;
  readonly spacing: number;
  readonly clickStrength: number;
  readonly fade: number;
  readonly enabled: boolean;
}

/**
 * 推进一帧.
 *
 * @param pointer 指针的 CSS 像素坐标 (y 从顶部量) 与是否在场.
 * @param taps 内核的点击队列, 已换成 CSS 像素.
 */
export function stepLens(s: LensState, time: number, o: LensTuning, pointer: { x: number; y: number; inside: boolean }, taps: readonly { x: number; y: number; at: number }[]): void {
  const hover = o.trigger !== "click";
  const click = o.trigger !== "hover";
  if (o.enabled && pointer.inside) {
    if (!s.placed) {
      s.lastX = pointer.x;
      s.lastY = pointer.y;
      s.placed = true;
    }
    s.travel += Math.hypot(pointer.x - s.lastX, pointer.y - s.lastY);
    s.lastX = pointer.x;
    s.lastY = pointer.y;
    const step = Math.max(1, o.spacing);
    while (hover && s.travel >= step) {
      s.travel -= step;
      s.waves.push({ x: pointer.x, y: pointer.y, born: time, strength: 1 });
    }
  } else s.placed = false;
  for (const tap of taps) {
    if (tap.at <= s.seenTap) continue;
    s.seenTap = tap.at;
    if (o.enabled && click) s.waves.push({ x: tap.x, y: tap.y, born: time, strength: o.clickStrength });
  }
  const life = lensLife(o.fade);
  s.waves = s.waves.filter((w) => time - w.born < life && time >= w.born).slice(-LENS.maxWaves);
}

/** 打包: (x, y, 半径, 振幅), 设备像素. */
export function packLens(s: LensState, time: number, o: { brushSize: number; spread: number; fade: number }, scale: number): { list: Float32Array; count: number } {
  const list = new Float32Array(LENS.maxWaves * 4);
  s.waves.forEach((w, i) => {
    const age = time - w.born;
    list.set([w.x * scale, w.y * scale, lensRadius(age, o.brushSize, o.spread) * scale, w.strength * Math.exp(-age * o.fade)], i * 4);
  });
  return { list, count: s.waves.length };
}
