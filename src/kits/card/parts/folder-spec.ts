/**
 * FileFolder 的规格常数与纯函数: 封面与插页的角度表, 层级, 文件的扇形摆位.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-card.md
 */
import { clamp, omegaSpring } from "../tokens";

/** 最多 6 份文件 (Folder.jsx:8 MAX_ITEMS). */
export const FOLDER_MAX_ITEMS = 6;
/** 封面角度: 打开 -180, 接收 -24, 探看 -13, 静止 0; 插页: -64 / -30 / -15 / 0 (Folder.jsx:33-34). 打开时封面平放会挡住文件, 这里封面绕底边最多转到 OPEN_COVER_DEG. */
export const FOLDER_BOOK = { open: -180, receive: -24, peek: -13, rest: 0 } as const;
export const FOLDER_FLAP = { open: -64, receive: -30, peek: -15, rest: 0 } as const;
export type FolderPose = keyof typeof FOLDER_BOOK;
/** 层级: 飞出 50, 拖拽 80, 聚焦 90 (Folder.jsx:35). */
export const FOLDER_LAYERS = { out: 50, drag: 80, focus: 90 } as const;
/** DOM 里封面是绕底边翻的正面板, -180 度会翻到背面; 打开时只翻到 -75 度 (HX 自定), 其余姿态照表. */
export const FOLDER_OPEN_COVER_DEG = -75;
/** 封面弹簧 omega 14 zeta 0.7, 文件弹簧 omega 16 zeta 0.72, 错峰 40ms (规格用 spring(value) 积分, 数值未摘录, HX 自定). */
export const FOLDER_COVER_SPRING = omegaSpring(14, 0.7);
export const FOLDER_ITEM_SPRING = omegaSpring(16, 0.72);
export const FOLDER_STAGGER_MS = 40;

/** 封面角度: 规格表, open 改用 DOM 可见的上限. */
export function coverAngle(pose: FolderPose): number {
  return pose === "open" ? FOLDER_OPEN_COVER_DEG : FOLDER_BOOK[pose];
}

export interface ItemPose {
  readonly x: number;
  readonly y: number;
  readonly r: number;
  readonly s: number;
}

/**
 * 第 i 份 (共 n 份) 文件的位置. rest: 叠在夹内, 微露顶边; peek: 整体上探; open: 在夹上方扇形散开,
 * 横向间距 spread px, 抬高 lift px, 每份转 fan 度, 中间高两边低. hover 的那份再抬 12px 放大 1.05 (HX 自定).
 */
export function itemPose(i: number, n: number, pose: FolderPose, spread: number, lift: number, fan: number, hovered: boolean): ItemPose {
  const c = n > 1 ? i - (n - 1) / 2 : 0;
  const norm = n > 1 ? c / ((n - 1) / 2) : 0;
  if (pose === "open") {
    const up = hovered ? 12 : 0;
    return { x: c * spread, y: 0 - lift + Math.abs(norm) * lift * 0.18 - up, r: norm * fan, s: hovered ? 1.05 : 1 };
  }
  const rise = pose === "peek" ? 14 : pose === "receive" ? 22 : 0;
  return { x: c * 4, y: 0 - rise - (n - 1 - i) * 3, r: norm * 2, s: 1 };
}

export function clampItems<T>(items: readonly T[]): readonly T[] {
  return items.slice(0, clamp(FOLDER_MAX_ITEMS, 0, items.length));
}
