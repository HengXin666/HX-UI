// 行为规格参照 docs/research/catalog/textanimations.md 的 DecryptedText, ScrambledText, Shuffle, SplitFlapText, TextType 条目, 实现为 HX 自有.

/**
 * 按位停格: 每一格在自己的停格时刻之前显示乱码或滚动字符, 到点后定在原文那个字上, 之后不再变.
 * 纯函数, 时间进来字串出去; 同一时刻永远是同一帧, 可倒放, 可中途改时间.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-text-kernel.md
 */

import { hash01 } from "./curve";
import { staggerRanks, type StaggerFrom } from "./stagger";
import { GLYPH_POOL, GLYPH_TICK_MS } from "./tokens";

const SPACE = /^\s+$/;

/** 从字符表里按 (格, 拍) 取一个确定的字. */
export function poolGlyph(pool: string, cell: number, tick: number): string {
  const chars = Array.from(pool.length > 0 ? pool : GLYPH_POOL);
  return chars[Math.floor(hash01(cell + 1, tick + 1) * chars.length) % chars.length];
}

/**
 * 每一格的停格时刻 (毫秒).
 *
 * @param count 格数.
 * @param from 停格顺序.
 * @param stepMs 相邻名次的间隔.
 * @param leadMs 第一格之前的乱码时长.
 */
export function lockTimes(count: number, from: StaggerFrom, stepMs: number, leadMs = 0): number[] {
  return staggerRanks(count, from).map((rank) => leadMs + rank * stepMs);
}

export interface SettleFrame {
  /** 本帧每一格显示的字. */
  readonly cells: readonly string[];
  /** 每一格是否已停格. */
  readonly locked: readonly boolean[];
  readonly done: boolean;
}

/**
 * 某一时刻的画面.
 *
 * @param target 原文逐格.
 * @param elapsedMs 已过时间.
 * @param locks 每一格的停格时刻.
 * @param pool 乱码字符表; 给空串时只从原文里取字.
 * @param tickMs 乱码换字节拍.
 */
export function settleAt(target: readonly string[], elapsedMs: number, locks: readonly number[], pool = GLYPH_POOL, tickMs = GLYPH_TICK_MS): SettleFrame {
  const tick = Math.floor(Math.max(0, elapsedMs) / Math.max(1, tickMs));
  const source = pool.length > 0 ? pool : target.filter((c) => !SPACE.test(c)).join("");
  const locked = target.map((c, i) => SPACE.test(c) || elapsedMs >= (locks[i] ?? 0));
  const cells = target.map((c, i) => (locked[i] ? c : poolGlyph(source, i, tick)));
  return { cells, locked, done: locked.every(Boolean) };
}

export interface RollFrame {
  readonly char: string;
  /** 正在翻过来的下一个字. */
  readonly next: string;
  /** 当前这一步走了多少, 0 到 1. */
  readonly phase: number;
  readonly done: boolean;
}

/**
 * 滚轮式停格: 每格从 from 字在字符表里依次走 flips 步到 to 字, 走一步耗 stepMs.
 * 起点字不在表里时从终点倒推 flips 步起翻; 步数超过 flips 时也只走最后 flips 步.
 */
export function rollGlyph(pool: readonly string[], fromChar: string, toChar: string, flips: number, localMs: number, stepMs: number): RollFrame {
  const n = pool.length;
  const to = pool.indexOf(toChar);
  if (to < 0 || stepMs <= 0) return { char: toChar, next: toChar, phase: 0, done: true };
  const at = pool.indexOf(fromChar);
  const steps = Math.min(at < 0 ? flips : (to - at + n) % n, Math.max(0, flips));
  const begin = (((to - steps) % n) + n) % n;
  const walked = Math.max(0, localMs) / stepMs;
  if (walked >= steps) return { char: toChar, next: toChar, phase: 0, done: true };
  const k = Math.floor(walked);
  return { char: pool[(begin + k) % n], next: pool[(begin + k + 1) % n], phase: walked - k, done: false };
}
