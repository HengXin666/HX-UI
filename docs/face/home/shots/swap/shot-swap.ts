import { FRAME_MS, SPRING_THUMB, ease, phase } from "../../../../../src/craft";
import { THUMB_MAX_MS } from "../../../../../src/craft/tokens";
import { springAt } from "../stage";

/**
 * 镜 4 切换, 来自 docs/research/craft.md 镜 4 与 segmented-thumb-hero 的控件合同.
 * 进度走到 SWITCH_AT 的每一刻切一次档: 旧页 x 0 到 -24px, opacity 到 0, 180ms in;
 * 新页晚 100ms 起 (与旧页交叉 80ms), x 24px 到 0 走 thumb 弹簧 (267ms 到 95%, 420ms 钳死), opacity 180ms out.
 * 窄屏同一套数, 换成 y 轴 (上下叠, 不左右飞).
 */
export const SWAP_PAGES = ["field", "kiln", "skin"] as const;
export type SwapPage = (typeof SWAP_PAGES)[number];
const HOLD_FRAMES = 24;
const STEP_FRAMES = 42;
/** 每一档的切入时刻: 先静止 24 帧看清田野, 之后每 42 帧换一页. */
export const SWITCH_AT = [HOLD_FRAMES * FRAME_MS, (HOLD_FRAMES + STEP_FRAMES) * FRAME_MS] as const;
export const SHIFT_PX = 24;
export const LEAVE_MS = 180;
export const CROSS_MS = 80;
const ENTER_AT_MS = LEAVE_MS - CROSS_MS;
const SWAP_MS = ENTER_AT_MS + THUMB_MAX_MS;
const TAIL_FRAMES = 30;
export const SWAP_END_MS = SWITCH_AT[1] + SWAP_MS + TAIL_FRAMES * FRAME_MS;

export interface PagePose {
  readonly shift: number;
  readonly opacity: number;
}

/** 当前档: 进度越过切入时刻就算新档, 拇指跟着它走. */
export function pageAt(ms: number): SwapPage {
  if (ms >= SWITCH_AT[1]) return SWAP_PAGES[2];
  if (ms >= SWITCH_AT[0]) return SWAP_PAGES[1];
  return SWAP_PAGES[0];
}

/** 让第 index 页停稳的进度点, 点击拇指时滚到这里. */
export function restMs(index: number): number {
  if (index <= 0) return 0;
  return SWITCH_AT[index - 1] + SWAP_MS;
}

function enter(t: number): PagePose {
  if (t < 0) return { shift: SHIFT_PX, opacity: 0 };
  // 弹簧自己走到停 (约 400ms), 420ms 钳死落档; 不在 267ms 硬切, 免得最后 1px 跳一下.
  const moved = t >= THUMB_MAX_MS ? 1 : springAt(SPRING_THUMB, t);
  return { shift: SHIFT_PX * (1 - moved), opacity: ease("out", phase(t, 0, LEAVE_MS)) };
}

function leave(t: number): PagePose {
  const k = ease("in", phase(t, 0, LEAVE_MS));
  return { shift: -SHIFT_PX * k, opacity: 1 - k };
}

/** 第 index 页在 ms 时的姿态. 只依赖 ms, 往回滚到同一毫秒就是同一帧. */
export function pagePose(index: number, ms: number): PagePose {
  const inAt = index === 0 ? Number.NEGATIVE_INFINITY : SWITCH_AT[index - 1] + ENTER_AT_MS;
  const outAt = index >= SWITCH_AT.length ? Number.POSITIVE_INFINITY : SWITCH_AT[index];
  if (ms >= outAt) return leave(ms - outAt);
  if (index === 0) return { shift: 0, opacity: 1 };
  return enter(ms - inAt);
}
