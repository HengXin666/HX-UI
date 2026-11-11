/**
 * 立体族 (src/kits/stage3d) 共用的名字. 卡片族已有的动值循环, 指数跟随, 弹簧换算, 卡面坐标与过渡串在这里转出.
 * kits 公共名字取自 src/kits/tokens.ts, 帧驱动工具取自 src/motion.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-stage3d.md
 */
export { KIT_FOCUS, TAU, cardPoint, clamp, follow, kitTone, omegaSpring, transitionOf, useKitMotion, type KitMotion, type KitTone } from "../card/tokens";

/** 规格各件的指数衰减写法: v += (target - v)(1 - exp(-rate dt)), rate 单位 1/s. */
export function decayToward(value: number, target: number, rate: number, dtS: number): number {
  const next = value + (target - value) * (1 - Math.exp(0 - rate * Math.max(0, dtS)));
  return Math.abs(target - next) < 1e-4 ? target : next;
}
