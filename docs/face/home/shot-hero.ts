import { ARC_MS, HERO_LIFT_PX, HERO_SINK_PX, ease, phase } from "../../../src/craft";

/** 镜 0: 顶栏已在, 主角句还不在. */
export const SHOT0_MS = 300;
const SINK_MS = 200;
const PUNCH_END_MS = 900;
const SETTLE_END_MS = 1400;
/** 记录卡 (画框) 的起点: 主角落定并静止 1000ms 之后. */
const CARD_OFFSET_MS = 2400;
export const CARD_AT_MS = SHOT0_MS + CARD_OFFSET_MS;
export const CARD_MS = 700;
const CARD_FROM_PX = 32;
const PEAK_SCALE = 0.02;
/** 整镜在这一刻之后完全静止, 时钟可以停. */
export const SHOT1_END_MS = SHOT0_MS + ARC_MS + CARD_MS;

export interface TitlePose {
  readonly y: number;
  readonly scale: number;
  readonly opacity: number;
}

export interface CardPose {
  readonly x: number;
  readonly opacity: number;
}

/**
 * 镜 1 主角句的姿态, 纯时间函数, 同一毫秒永远给同一帧.
 * 0-200 下沉 8px (in), 200-900 punch 抬到 -4px 与 1.02, 900-1400 settle 回 1, 之后不动.
 * 数字来自 docs/research/craft.md 首页镜头, 源头是 spotlight-hero-card 的 rise 与 deck-deal 的 settle.
 */
export function titlePose(ms: number): TitlePose {
  const t = ms - SHOT0_MS;
  if (t < 0) return { y: 0, scale: 1, opacity: 0 };
  if (t < SINK_MS) {
    const p = phase(t, 0, SINK_MS);
    return { y: HERO_SINK_PX * ease("in", p), scale: 1, opacity: ease("out", p) };
  }
  if (t < PUNCH_END_MS) {
    const k = ease("punch", phase(t, SINK_MS, PUNCH_END_MS - SINK_MS));
    return { y: HERO_SINK_PX + (-HERO_LIFT_PX - HERO_SINK_PX) * k, scale: 1 + PEAK_SCALE * k, opacity: 1 };
  }
  if (t < SETTLE_END_MS) {
    const k = ease("settle", phase(t, PUNCH_END_MS, SETTLE_END_MS - PUNCH_END_MS));
    return { y: -HERO_LIFT_PX * (1 - k), scale: 1 + PEAK_SCALE * (1 - k), opacity: 1 };
  }
  return { y: 0, scale: 1, opacity: 1 };
}

/** 画框与左栏其余文字一组进入: x 32px 到 0, out, 无过冲, 不逐行入场. */
export function cardPose(ms: number): CardPose {
  const k = ease("out", phase(ms, CARD_AT_MS, CARD_MS));
  return { x: CARD_FROM_PX * (1 - k), opacity: k };
}
