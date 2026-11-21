import type { CSSProperties } from "react";
import { BEAT_ALIGN, BEAT_LAYOUT, BEAT_PACE_PAD, BEAT_TRACK, DIR_VAR } from "../constants/page-beat";
import type { BeatLayout, BeatPace } from "./beat";

/**
 * 拍的版式语法. 用内联样式而不是类名: 不依赖使用方的 Tailwind 扫描, 也不新增 CSS 入口.
 * 全部用 auto-fit / minmax 自适应, 不写断点; 间距与行宽只读 --dir-*, 换方向不改代码.
 */
/** 所有版式共用: 网格, 槽宽读方向令牌. */
const BASE: CSSProperties = { display: "grid", gap: DIR_VAR.gutter };

const LAYOUT_STYLE: Record<BeatLayout, CSSProperties> = {
  [BEAT_LAYOUT.split]: {
    ...BASE,
    gridTemplateColumns: `repeat(auto-fit, minmax(${BEAT_TRACK.split}, 1fr))`,
    alignItems: BEAT_ALIGN.center,
  },
  [BEAT_LAYOUT.center]: {
    ...BASE,
    justifyItems: BEAT_ALIGN.center,
    textAlign: BEAT_ALIGN.center,
    maxInlineSize: DIR_VAR.measure,
    marginInline: "auto",
  },
  [BEAT_LAYOUT.bleed]: {
    ...BASE,
    gap: 0,
    alignContent: "end",
    position: "relative",
    isolation: "isolate",
    overflow: "hidden",
    minBlockSize: BEAT_TRACK.bleedMin,
  },
  [BEAT_LAYOUT.grid]: {
    ...BASE,
    gridTemplateColumns: `repeat(auto-fill, minmax(${BEAT_TRACK.grid}, 1fr))`,
  },
  [BEAT_LAYOUT.rail]: {
    ...BASE,
    gridAutoFlow: "column",
    gridAutoColumns: BEAT_TRACK.rail,
    overflowX: "auto",
    scrollSnapType: "x mandatory",
    overscrollBehaviorX: "contain",
  },
  [BEAT_LAYOUT.stack]: BASE,
};

/** 一拍的版式样式: 版式定栅格, 节奏定上下留白. 返回新对象, 调用方可再合并. */
export function beatStyle(layout: BeatLayout, pace: BeatPace): CSSProperties {
  return { ...LAYOUT_STYLE[layout], paddingBlock: BEAT_PACE_PAD[pace] };
}
