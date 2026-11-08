/** CueTip 的全局热度与倾斜换算: 所有实例共享上次收起的时刻与气泡位置. */
import { CUE, CUE_SIGN, type CueSide } from "../../../tokens";

/** 全部 CueTip 共享的热度: 上次收起的时刻与气泡位置. */
export const warmth = { closedAt: Number.NEGATIVE_INFINITY, rect: null as DOMRect | null };

/** 测试与文档站切页时清空热度. */
export function resetCueWarmth(): void {
  warmth.closedAt = Number.NEGATIVE_INFINITY;
  warmth.rect = null;
}

/** 距上次收起是否仍在热窗口内. */
export function isWarm(now: number, closedAt: number, warmWindow: number): boolean {
  return now - closedAt <= warmWindow;
}

/** 指针速度换倾斜角: 速度达到 fullLeanSpeed 时倾满, 方向随朝向翻转. */
export function leanFor(speed: number, lean: number, side: CueSide): number {
  const ratio = Math.max(-1, Math.min(1, speed / CUE.fullLeanSpeed));
  return ratio * lean * CUE_SIGN[side];
}
