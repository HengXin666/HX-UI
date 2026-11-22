import type { SectionId } from "./types";

/**
 * 文档站三大块, 各有一个章节色 (思路来自 Shopify Editions):
 * UI 组件 = 做产品用的基础件, 特效只是参数; 视觉组件 = 能当一屏主视觉的效果; 落地页 = 整页可拿走的成品.
 */
export interface Section {
  id: SectionId;
  no: string;
  title: string;
  en: string;
  color: string;
  band: string;
  blurb: string;
  /** 侧栏分组, 按这个顺序排 */
  groups: string[];
}

export const SECTIONS: Section[] = [
  { id: "ui", no: "01", title: "UI 组件", en: "UI Components", color: "oklch(0.62 0.2 262)", band: "oklch(0.43 0.23 264)", blurb: "做产品用的基础件。动效和特效只是它们的一个参数。", groups: ["操作", "展示", "反馈", "表单", "数据"] },
  { id: "visual", no: "02", title: "视觉组件", en: "Visual Components", color: "oklch(0.64 0.24 305)", band: "oklch(0.45 0.23 305)", blurb: "能撑起一屏主视觉的效果。宁缺毋滥。", groups: ["文字", "卡片", "背景"] },
  { id: "pages", no: "03", title: "落地页", en: "Landing Pages", color: "oklch(0.7 0.18 45)", band: "oklch(0.52 0.18 38)", blurb: "完整的产品落地页，整页拿走就能改。", groups: [] },
];

export const sectionOf = (id: SectionId) => SECTIONS.find((s) => s.id === id)!;
