// 行为规格参照 docs/research/catalog/textanimations.md 的 EchoText 条目, 实现为 HX 自有.

import { clamp, clamp01, falloff, mix } from "../../kernel/curve";
import { HALF } from "../../kernel/tokens";
import { WAKE_BURST_GAP_MS, WAKE_BURST_LIFE_MS, WAKE_DRIFT_SWAY, WAKE_MAX_ECHOES } from "../tokens";

/**
 * WakeText 的纯函数: 方向向量, 漂移领头点, 指针领头点, 链式跟随, 每层外观与爆开包络.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-text-pointer.md
 */

export type WakeDirection = "right" | "left" | "up" | "down";
export type WakeEase = "linear" | "ease-out" | "ease-in-out";

export interface Vec {
  readonly x: number;
  readonly y: number;
}

const DIRS: Record<WakeDirection, Vec> = { right: { x: 1, y: 0 }, left: { x: -1, y: 0 }, up: { x: 0, y: -1 }, down: { x: 0, y: 1 } };

export function wakeCount(echoes: number): number {
  return clamp(Math.round(Number.isFinite(echoes) ? echoes : 0), 0, WAKE_MAX_ECHOES);
}

/** 曲线: ease-out 三次缓出, ease-in-out 三次缓入缓出. */
export function wakeEase(kind: WakeEase, t: number): number {
  const x = clamp01(t);
  if (kind === "ease-out") return 1 - (1 - x) ** 3;
  if (kind === "ease-in-out") return x < HALF ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2;
  return x;
}

/** 漂移领头点: 沿 direction 偏 offset, 方向随相位左右摆 WAKE_DRIFT_SWAY 弧度. */
export function driftLead(direction: WakeDirection, offset: number, phase: number): Vec {
  const d = DIRS[direction];
  const a = Math.sin(phase) * WAKE_DRIFT_SWAY;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: (d.x * c - d.y * s) * offset, y: (d.x * s + d.y * c) * offset };
}

/** 指针领头点: 残影背离指针, 指针越近偏得越多; 半径外为 0. dx, dy 为指针相对元素中心. */
export function pointerLead(dx: number, dy: number, offset: number, radius: number): Vec {
  const dist = Math.hypot(dx, dy);
  const k = falloff(dist, radius);
  if (dist === 0 || k === 0) return { x: 0, y: 0 };
  return { x: (-dx / dist) * offset * k, y: (-dy / dist) * offset * k };
}

/**
 * 链式跟随一步: 第 i 层追第 i-1 层 (第 0 层追领头点), 越往后越滞后.
 *
 * @param chain 各层当前位置, 原地改.
 * @param lead 领头点.
 * @param lag 每 60Hz 帧留下的比例, 0 到 1, 越大拖得越长.
 * @param dtS 帧长 (秒).
 */
export function followChain(chain: { x: number; y: number }[], lead: Vec, lag: number, dtS: number, refHz: number): void {
  const k = 1 - clamp(lag, 0, 1) ** (dtS * refHz);
  let prev: Vec = lead;
  for (const p of chain) {
    p.x += (prev.x - p.x) * k;
    p.y += (prev.y - p.y) * k;
    prev = p;
  }
}

/** 第 i 层 (0 起) 的不透明度, 模糊 (px) 与缩放: 越后越淡越糊. */
export function echoLook(i: number, count: number, fade: number, blur: number, echoScale: number): { readonly opacity: number; readonly blur: number; readonly scale: number } {
  const t = count <= 1 ? 1 : (i + 1) / count;
  return { opacity: fade * (1 - i / Math.max(1, count)), blur: blur * t, scale: mix(1, echoScale, t) };
}

/** 点击爆开包络: 第 i 层晚 i x 80ms 起, 1100ms 内先涨后落, 返回 0 到 1. */
export function burstAt(elapsedMs: number, i: number, ease: WakeEase): number {
  const p = (elapsedMs - i * WAKE_BURST_GAP_MS) / WAKE_BURST_LIFE_MS;
  if (p <= 0 || p >= 1) return 0;
  return Math.sin(Math.PI * wakeEase(ease, p));
}
