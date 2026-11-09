// 行为规格参照 docs/research/catalog/textanimations.md 的 TextCursor 条目, 实现为 HX 自有.

import { clamp01 } from "../../kernel/curve";
import { DOUBLE, HALF } from "../../kernel/tokens";

/**
 * StampTrail 的纯函数: 章的朝向 (含保持正立), 退场与弹出的外观, 收章节拍, 章的内容.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-text-pointer.md
 */

const DEG_PER_RAD = 180 / Math.PI;
const QUARTER_TURN_DEG = 90;
const HALF_TURN_DEG = 180;

/** 移动方向的角度 (度); keepUpright 时翻到 -90 到 90 之间, 字不倒着. */
export function stampAngle(dx: number, dy: number, keepUpright: boolean): number {
  if (dx === 0 && dy === 0) return 0;
  let a = Math.atan2(dy, dx) * DEG_PER_RAD;
  if (keepUpright && (a > QUARTER_TURN_DEG || a < -QUARTER_TURN_DEG)) a -= Math.sign(a) * HALF_TURN_DEG;
  return a;
}

/** 二次缓出. */
function easeOut(t: number): number {
  const x = clamp01(t);
  return 1 - (1 - x) * (1 - x);
}

/**
 * 一枚章的缩放与不透明度.
 *
 * @param ageS 盖下后过了多久.
 * @param exitS 开始退场后过了多久, 未退场为负.
 * @param popS 弹出时长, 0 时不弹.
 */
export function stampLook(ageS: number, exitS: number, popS: number, exitDuration: number, shrink: number, fade: number): { readonly scale: number; readonly opacity: number; readonly done: boolean } {
  let scale = popS > 0 ? easeOut(ageS / popS) : 1;
  let opacity = 1;
  if (exitS >= 0) {
    const e = exitDuration > 0 ? easeOut(exitS / exitDuration) : 1;
    scale *= 1 - clamp01(shrink) * e;
    opacity *= 1 - clamp01(fade) * e;
    return { scale, opacity: e >= 1 ? 0 : opacity, done: e >= 1 };
  }
  return { scale, opacity, done: false };
}

/**
 * 收章节拍: 指针停下后按间隔累加, 返回本帧要收几枚与余下的累积.
 *
 * @param acc 上一帧余下的累积 (枚).
 * @param dtS 帧长.
 * @param intervalS 每枚的间隔.
 */
export function removalTick(acc: number, dtS: number, intervalS: number): { readonly count: number; readonly acc: number } {
  const next = acc + dtS / intervalS;
  const count = Math.floor(next);
  return { count, acc: next - count };
}

/** 第 n 枚章的内容: stamp 整段原文; trail 逐字轮换 (跳过空白). */
export function stampContent(text: string, n: number, mode: "stamp" | "trail"): string {
  if (mode === "stamp") return text;
  const chars = Array.from(text).filter((c) => c.trim() !== "");
  return chars.length === 0 ? "" : chars[n % chars.length];
}

/** 漂浮偏移: 各章按自己的种子错相. */
export function stampFloat(t: number, seed: number, amp: number, rate: number): { readonly x: number; readonly y: number } {
  const p = seed * Math.PI * DOUBLE;
  return { x: Math.sin(t * rate + p) * amp * HALF, y: Math.cos(t * rate * HALF + p) * amp };
}
