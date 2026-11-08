import { DEAL_FIRST_MS, DEAL_LAST_MS, FRAME_MS, ease, phase } from "../../../../../src/craft";

/**
 * 镜 3 组件墙, 来自 deck-deal-flyin (docs/research/shots/part-5.md) 与 docs/research/craft.md 镜 3.
 * 0 到 26f 牌堆静止; 26f 到 36f (333ms) 预备: 牌堆下压 48px, 顶卡再回拉 30px;
 * 36f 发出第一张. 每张 267ms dive (到槽位上方 scale 1.06) + 133ms settle + 67ms press 0.996 到 1;
 * 阴影晚 80ms, 从 8px 收到 2px; 满板后至少 hold 500ms.
 */
export const DEAL_CARDS = 8;
const ANTICIPATE_FRAMES = 26;
const FIRST_FRAMES = 36;
export const ANTICIPATE_AT_MS = ANTICIPATE_FRAMES * FRAME_MS;
export const FIRST_CUE_MS = FIRST_FRAMES * FRAME_MS;
const ANTICIPATE_MS = FIRST_CUE_MS - ANTICIPATE_AT_MS;
export const PILE_DOWN_PX = 48;
export const TOP_PULL_PX = 30;
export const STACK_STEP_PX = 3;
export const DIVE_MS = 267;
const SETTLE_MS = 133;
const PRESS_MS = 67;
export const LAND_MS = DIVE_MS + SETTLE_MS + PRESS_MS;
export const HOVER_SCALE = 1.06;
export const PRESS_FROM = 0.996;
export const SHADOW_LAG_MS = 80;
export const SHADOW_FROM_PX = 8;
export const SHADOW_TO_PX = 2;
const FULL_HOLD_MS = 500;

/** 第 k 张的出手时刻. 间隔从 120ms 线性收到 40ms (卡里 36+4k-0.0792k(k-1) 的间隔也是线性收窄). */
export function cueMs(k: number, count: number = DEAL_CARDS): number {
  let at = FIRST_CUE_MS;
  for (let j = 0; j < k; j += 1) {
    const t = count <= 2 ? 1 : j / (count - 2);
    at += DEAL_FIRST_MS + (DEAL_LAST_MS - DEAL_FIRST_MS) * t;
  }
  return at;
}

const LAST_LAND_MS = cueMs(DEAL_CARDS - 1) + LAND_MS + SHADOW_LAG_MS;
/** 满板 hold 之后舞台到头. */
export const DEAL_END_MS = Math.ceil((LAST_LAND_MS + FULL_HOLD_MS) / FRAME_MS) * FRAME_MS;

export interface Vec {
  readonly x: number;
  readonly y: number;
}

export interface CardPose {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly shadow: number;
  /** 在牌堆里 / 飞行中 / 已落槽, 决定叠放次序. */
  readonly layer: "pile" | "air" | "slot";
}

function length(v: Vec): number {
  return Math.hypot(v.x, v.y) || 1;
}

/**
 * 第 k 张卡的姿态, 纯时间函数. pile 是牌堆相对这张卡槽位的偏移 (像素).
 * 牌堆里第 k 张往上叠 k 个 STACK_STEP; 预备段整堆下压, 顶卡沿出手方向的反向再回拉.
 */
export function cardPose(k: number, ms: number, pile: Vec, count: number = DEAL_CARDS): CardPose {
  const cue = cueMs(k, count);
  const press = ease("out", phase(ms, ANTICIPATE_AT_MS, ANTICIPATE_MS));
  const pull = k === 0 ? TOP_PULL_PX * press : 0;
  const away = { x: pile.x / length(pile), y: pile.y / length(pile) };
  const rest = {
    x: pile.x + away.x * pull,
    y: pile.y - STACK_STEP_PX * (count - 1 - k) + PILE_DOWN_PX * press + away.y * pull,
  };
  if (ms < cue) return { x: rest.x, y: rest.y, scale: 1, shadow: SHADOW_TO_PX, layer: "pile" };
  const t = ms - cue;
  const dive = ease("dive", phase(t, 0, DIVE_MS));
  const lift = ease("out", phase(t, 0, SHADOW_LAG_MS));
  const fall = ease("out", phase(t, SHADOW_LAG_MS, LAND_MS));
  const shadow = t < SHADOW_LAG_MS ? SHADOW_TO_PX + (SHADOW_FROM_PX - SHADOW_TO_PX) * lift : SHADOW_FROM_PX + (SHADOW_TO_PX - SHADOW_FROM_PX) * fall;
  if (t < DIVE_MS) {
    return { x: rest.x * (1 - dive), y: rest.y * (1 - dive), scale: 1 + (HOVER_SCALE - 1) * dive, shadow, layer: "air" };
  }
  if (t < DIVE_MS + SETTLE_MS) {
    const settle = ease("settle", phase(t, DIVE_MS, SETTLE_MS));
    return { x: 0, y: 0, scale: HOVER_SCALE + (PRESS_FROM - HOVER_SCALE) * settle, shadow, layer: "air" };
  }
  const tap = ease("out", phase(t, DIVE_MS + SETTLE_MS, PRESS_MS));
  return { x: 0, y: 0, scale: PRESS_FROM + (1 - PRESS_FROM) * tap, shadow, layer: "slot" };
}
