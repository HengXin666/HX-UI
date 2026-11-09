/**
 * LayerDrawer 的规格常数与纯函数: 各层与各项的入场时刻.
 *
 * .agents/notes/implemented/feature/2026-11-09-controls-nav.md
 */

/** 规格前置层: 每层 0.5s power4.out, 错峰 0.07s (StaggeredMenu.jsx:113). */
export const DRAWER_LAYER_MS = 500;
export const DRAWER_LAYER_STAGGER_MS = 70;
/** 规格面板滑入时长与在层后的间隔. 面板 0.65s, 间隔 0.08s. HX 按规格节奏取定. */
export const DRAWER_PANEL_MS = 650;
export const DRAWER_PANEL_GAP_MS = 80;
/** 规格条目文字: 1s power4.out, 错峰 0.1s (StaggeredMenu.jsx:133-135); 起点下沉 140% 并转 10 度. */
export const DRAWER_ITEM_MS = 1000;
export const DRAWER_ITEM_STAGGER_MS = 100;
export const DRAWER_ITEM_FROM_PERCENT = 140;
export const DRAWER_ITEM_FROM_DEG = 10;
/** 条目在面板起步后多久开始. HX 自定. */
export const DRAWER_ITEM_LEAD_MS = 150;
/** 规格序号: 0.6s power2.out, 错峰 0.08s (StaggeredMenu.jsx:143-146). */
export const DRAWER_INDEX_MS = 600;
export const DRAWER_INDEX_STAGGER_MS = 80;
/** 规格社交区: 标题 0.5s power2.out, 链接 0.55s power3.out 错峰 0.08s, 起点下沉 25px (StaggeredMenu.jsx:160-174). */
export const DRAWER_SOCIAL_TITLE_MS = 500;
export const DRAWER_SOCIAL_MS = 550;
export const DRAWER_SOCIAL_FROM_PX = 25;
/** 规格收起: 0.32s power3.in (StaggeredMenu.jsx:216-217). */
export const DRAWER_EXIT_MS = 320;
/** 规格开关图标: 打开转到 225 度 0.8s power4.out, 收起回 0 度 0.35s power3.inOut (StaggeredMenu.jsx:242-244). */
export const DRAWER_ICON_DEG = 225;
export const DRAWER_ICON_OPEN_MS = 800;
export const DRAWER_ICON_CLOSE_MS = 350;
/** 规格开关字色 0.3s ease (StaggeredMenu.css:245-246). */
export const DRAWER_COLOR_MS = 300;

export interface DrawerTimeline {
  /** 面板起步延迟. */
  readonly panel: number;
  /** 第 i 层的延迟. */
  readonly layer: (i: number) => number;
  /** 第 i 项文字的延迟. */
  readonly item: (i: number) => number;
  /** 第 i 个序号的延迟. */
  readonly index: (i: number) => number;
  /** 社交区起步延迟 (排在最后一项文字起步之后). */
  readonly social: (i: number) => number;
}

/** 入场时间线 (ms): 层先错峰滑入, 面板接在层后, 条目与序号接在面板起步后, 社交区接在条目后. */
export function drawerTimeline(layers: number, items: number): DrawerTimeline {
  const panel = Math.max(0, layers) * DRAWER_LAYER_STAGGER_MS + DRAWER_PANEL_GAP_MS;
  const itemsStart = panel + DRAWER_ITEM_LEAD_MS;
  const socialStart = itemsStart + Math.max(0, items) * DRAWER_ITEM_STAGGER_MS;
  return {
    panel,
    layer: (i) => i * DRAWER_LAYER_STAGGER_MS,
    item: (i) => itemsStart + i * DRAWER_ITEM_STAGGER_MS,
    index: (i) => itemsStart + i * DRAWER_INDEX_STAGGER_MS,
    social: (i) => socialStart + i * DRAWER_INDEX_STAGGER_MS,
  };
}
