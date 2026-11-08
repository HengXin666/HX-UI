import { DEAL_FIRST_MS, DEAL_LAST_MS, FRAME_MS, ease, phase } from "../../../../../src/craft";
import { dealDelays } from "../../../../../src/viz";

/**
 * 镜 7 选一条路读, 来自 docs/research/craft.md 镜 6 (分组名发牌, 无过冲) 与 list-reveal 的重叠比例:
 * 先发三栏的分组名, 再按阅读顺序发每一行. 间隔从 120ms 线性收到 40ms, 每项窗口 = 2.4 倍它的间隔,
 * 相邻项重叠. 只用 out, y 16px 到 0, 不过冲.
 */
export const PATH_COLUMNS = 3;
export const PATH_ROWS = 4;
export const PATH_ITEMS = PATH_COLUMNS + PATH_COLUMNS * PATH_ROWS;
const START_FRAMES = 6;
const START_MS = START_FRAMES * FRAME_MS;
export const WINDOW_RATIO = 2.4;
export const RISE_PX = 16;
const HOLD_FRAMES = 30;

/** 每项起点相对 START_MS 的偏移, 间隔从 120ms 线性收到 40ms (库的 dealDelays). */
const CUES = dealDelays(PATH_ITEMS, DEAL_FIRST_MS, DEAL_LAST_MS);

/** 第 k 项的起点. */
export function pathCue(k: number): number {
  return START_MS + (CUES[k] ?? 0);
}

/** 第 k 项的窗口: 它与下一项的间隔乘 2.4; 最后一项沿用倒数第二个间隔. */
export function pathWindow(k: number): number {
  const at = Math.min(k, PATH_ITEMS - 2);
  return (CUES[at + 1] - CUES[at]) * WINDOW_RATIO;
}

export const PATHS_END_MS = Math.ceil((pathCue(PATH_ITEMS - 1) + pathWindow(PATH_ITEMS - 1) + HOLD_FRAMES * FRAME_MS) / FRAME_MS) * FRAME_MS;

export interface ItemPose {
  readonly y: number;
  readonly opacity: number;
}

export function itemPose(k: number, ms: number): ItemPose {
  const t = ease("out", phase(ms, pathCue(k), pathWindow(k)));
  return { y: RISE_PX * (1 - t), opacity: t };
}

/** 分组名先发 (k = 0..2), 行按阅读顺序 (先第一行三栏, 再第二行) 接着发. */
export function headCue(column: number): number {
  return column;
}

export function rowCue(column: number, row: number): number {
  return PATH_COLUMNS + row * PATH_COLUMNS + column;
}
