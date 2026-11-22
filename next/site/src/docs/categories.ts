import type { CategoryId } from "./types";

/** 每个分类一个章节色 (思路来自 Shopify Editions): 侧栏标记, 页眉, 舞台底光都读它 */
export const CATEGORIES: { id: CategoryId; no: string; title: string; en: string; color: string; band: string; blurb: string }[] = [
  { id: "text", band: "oklch(0.43 0.23 264)", no: "01", title: "文字", en: "Text", color: "oklch(0.62 0.2 262)", blurb: "标题和数字的登场方式" },
  { id: "motion", band: "oklch(0.45 0.23 305)", no: "02", title: "动效", en: "Motion", color: "oklch(0.64 0.24 305)", blurb: "滚动、悬停、进出场" },
  { id: "background", band: "oklch(0.5 0.21 358)", no: "03", title: "背景", en: "Backgrounds", color: "oklch(0.64 0.23 355)", blurb: "铺满一屏的氛围" },
  { id: "interaction", band: "oklch(0.52 0.18 38)", no: "04", title: "交互", en: "Interactions", color: "oklch(0.7 0.18 45)", blurb: "按钮、表单、反馈的完整状态" },
  { id: "foundation", band: "oklch(0.44 0.12 152)", no: "05", title: "基础", en: "Foundation", color: "oklch(0.7 0.15 155)", blurb: "shadcn/ui 基础件，跟随主题令牌" },
];

export const categoryOf = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)!;
