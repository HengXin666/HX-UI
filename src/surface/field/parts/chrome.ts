// 行为规格参照 docs/research/catalog/animations.md 的 MetallicPaint 条目, 实现为 HX 自有.
/**
 * ChromeMark 的小状态: 指针带动的倾斜 (一阶弹簧) 与入场进度. 纯函数.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-field.md
 */
import { CHROME } from "../tokens";

export interface ChromeState {
  tilt: number;
  intro: number;
}

export function makeChrome(intro: boolean): ChromeState {
  return { tilt: 0, intro: intro ? 0 : 1 };
}

/**
 * 推进一帧: 倾斜向 (pointer.x - 0.5) x 2 x mouseTilt x tiltMax 靠拢 (不在场时回 0), 入场按 introS 走满.
 *
 * @returns 本帧条纹的角度 (弧度).
 */
export function stepChrome(s: ChromeState, dt: number, angleDeg: number, mouseTilt: number, pointer: { x: number; inside: boolean }): number {
  const goal = pointer.inside ? (pointer.x - 0.5) * 2 * mouseTilt * CHROME.tiltMax : 0;
  s.tilt += (goal - s.tilt) * (dt > 0 ? 1 - Math.exp(-dt / CHROME.tiltTau) : 0);
  if (dt > 0) s.intro = Math.min(1, s.intro + dt / CHROME.introS);
  return (angleDeg * Math.PI) / 180 + s.tilt;
}

/** 泊松源项: 让短边约占 scale 一半的圆盘中心隆起到 1 左右. side 为通道短边像素. */
export function chromeSource(side: number, scale: number): number {
  const r = Math.max(2, side * Math.max(0.05, scale) * 0.5);
  return 4 / (r * r);
}
