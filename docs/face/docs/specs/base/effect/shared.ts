import { NONE } from "../../types";

/** 演示卡: 效果件都叠在一张圆角卡上. */
export const DEMO_CARD = "relative grid h-44 w-80 place-items-center rounded-2xl border border-border bg-card text-sm text-muted-foreground";
export const DEMO_LABEL = "悬停或聚焦这张卡";
export const REVERSE = "reverse";
/** 演示卡尺寸固定, 缩略图里放大些才看得清. */
export const THUMB_SCALE = 0.62;
export const COLORS = "colors";
export const CHILDREN_ROW = { name: "children", type: "ReactNode", initial: NONE, desc: "卡片内容." };
export const MARQUEE_ITEMS = ["按钮", "输入框", "下拉选择", "对话框", "抽屉", "日历", "图表", "代码块"];
export const CHIP = "rounded-full border border-border bg-card px-3 py-1 text-sm text-foreground";
