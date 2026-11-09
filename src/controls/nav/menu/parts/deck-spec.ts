/**
 * DeckNav 的规格常数与纯函数: 卡片错峰, 展开弹簧, 卡片姿态.
 *
 * .agents/notes/implemented/feature/2026-11-09-controls-nav.md
 */
import type { SpringSpec } from "../../../../craft/spring";
import { springFromDuration } from "../../../../motion/spring/fit";
import { clamp } from "../../tokens";

/** 规格默认 (CardNav.jsx:129-153). stagger 秒, cardHeight / maxWidth px. */
export const DECK_DEFAULTS = { stagger: 0.12, bounce: 0.2, speed: 1, cardHeight: 176, maxWidth: 800 } as const;
/** 规格: stagger 钳到 [0, 0.3] (CardNav.jsx:176), 总错峰不超过 0.7s (CardNav.jsx:229). */
export const DECK_STAGGER_MAX = 0.3;
export const DECK_LAG_BUDGET_S = 0.7;
/** 规格展开时长 0.5s (CardNav.css:100-101), 按 speed 缩放. */
export const DECK_OPEN_S = 0.5;
/** 规格卡片入场 0.45s (CardNav.css:342), 离场淡出 0.2s (CardNav.css:321). */
export const DECK_CARD_MS = 450;
export const DECK_CARD_OUT_MS = 200;
/** 规格开关底色 0.2s (CardNav.css:65). */
export const DECK_COLOR_MS = 200;
/** 顶栏高度 px 与卡片入场下沉比例. HX 自定. */
export const DECK_BAR = 60;
export const DECK_RISE = 0.3;
/** 汉堡两条线间距 px. HX 自定. */
export const DECK_BAR_GAP = 3;
export const DECK_CROSS_DEG = 45;
const MIN_SPEED = 0.1;

/** 每张卡的错峰 (秒): min(stagger, 0.7 / (n - 1)), 单张为 0. */
export function deckLag(stagger: number, count: number): number {
  if (count <= 1) return 0;
  return Math.min(clamp(stagger, 0, DECK_STAGGER_MAX), DECK_LAG_BUDGET_S / (count - 1));
}

/** 展开高度的弹簧: 时长 0.5 / speed, 回弹 bounce. */
export function deckSpring(bounce: number, speed: number): SpringSpec {
  return springFromDuration(DECK_OPEN_S / Math.max(MIN_SPEED, speed), clamp(bounce, 0, 1));
}

/** 卡片姿态: 未展开时下沉 cardHeight * 0.3 且透明. */
export function deckCard(shown: boolean, cardHeight: number): { transform: string; opacity: number } {
  return shown ? { transform: "translateY(0px)", opacity: 1 } : { transform: `translateY(${cardHeight * DECK_RISE}px)`, opacity: 0 };
}
