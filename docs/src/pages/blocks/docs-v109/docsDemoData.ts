import type { ApiRow, DocsHomeCard, LinkGroup, TocItem } from "../../../../../src/blocks/docs";

/** V1-09 文档站演示数据: 结构取自 shadcn / mantine / ant.design 文档站 (视觉审计 2.5). 全部可 JSON 序列化. */
export const DOCS_DEMO_SIDEBAR: LinkGroup[] = [
  {
    title: "开始",
    items: [
      { label: "介绍", href: "#docs-intro" },
      { label: "安装", href: "#docs-install" },
      { label: "主题与皮肤", href: "#docs-theme", badge: "新" },
    ],
  },
  {
    title: "组件",
    items: [
      { label: "Button", href: "#docs-button", current: true },
      { label: "Dialog", href: "#docs-dialog" },
      { label: "Table", href: "#docs-table" },
      { label: "Tabs", href: "#docs-tabs" },
    ],
  },
];

export const DOCS_DEMO_TOC: TocItem[] = [
  { id: "v109-usage", label: "用法", depth: 2 },
  { id: "v109-variants", label: "变体", depth: 3 },
  { id: "v109-sizes", label: "尺寸", depth: 3 },
  { id: "v109-a11y", label: "可访问性", depth: 2 },
  { id: "v109-api", label: "API", depth: 2 },
];

export const DOCS_DEMO_API: ApiRow[] = [
  { name: "variant", type: '"default" | "secondary" | "outline" | "ghost" | "link" | "destructive"', default: '"default"', description: "外观变体" },
  { name: "size", type: '"xs" | "sm" | "default" | "lg" | "icon"', default: '"default"', description: "尺寸档" },
  { name: "asChild", type: "boolean", default: "false", description: "把样式合并到唯一子元素上 (Slot)" },
  { name: "onClick", type: "(event: React.MouseEvent<HTMLButtonElement>) => void", description: "点击回调", required: false },
  { name: "children", type: "ReactNode", description: "按钮内容", required: true },
  { name: "ripple", type: "boolean", default: "true", description: "按压涟漪", deprecated: "V2 起改用 polish 变体" },
];

export const DOCS_DEMO_PAGER = {
  prev: { label: "主题与皮肤", href: "#docs-theme" },
  next: { label: "Dialog", href: "#docs-dialog" },
};

export const DOCS_DEMO_HOME = {
  hero: {
    eyebrow: "HX-UI 2026",
    title: "用一个库拼出整个文档站",
    description: "三栏外壳, 本页目录, 上一页下一页, Props 表与提示框, 全部只吃数据.",
    actions: [
      { label: "开始使用", href: "#docs-intro", variant: "primary" as const },
      { label: "组件一览", href: "#docs-button", variant: "secondary" as const },
    ],
  },
  search: { placeholder: "搜索组件, 钩子, 令牌…", shortcut: "⌘K" },
  cards: {
    heading: { title: "从这里开始" },
    items: [
      { title: "安装", href: "#docs-install", description: "pnpm add, 引入样式, 配置 BlocksProvider.", icon: "icon-[lucide--download]" },
      { title: "120+ 组件", href: "#docs-button", description: "shadcn 同构的原语, 带容器查询的区块.", icon: "icon-[lucide--blocks]", badge: "V1" },
      { title: "主题编辑", href: "#docs-theme", description: "六套皮肤 × 亮暗 × 三档密度, 实时切换.", icon: "icon-[lucide--palette]" },
    ] satisfies DocsHomeCard[],
  },
};
