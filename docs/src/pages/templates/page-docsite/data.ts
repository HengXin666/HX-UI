import { BLOCK_PAD, BLOCK_TONE, BLOCK_WIDTH, CTA_VARIANT } from "../../../../../src/constants/blocks";
import { CALLOUT_KIND } from "../../../../../src/constants/blocks-docs-v109";
import type { ApiRow, BlockNode, CalloutKind, LinkGroup, LinkItem, TocItem } from "../../../../../src/blocks/_shared/types";
import type { DocsHomeProps } from "../../../../../src/blocks/docs";
import type { SiteFooterBlockProps } from "../../../../../src/blocks/site";

/**
 * 文档站整页模板 (V2-03) 的全部数据, 结构取自 mantine / shadcn / ant.design 文档站. 全部可 JSON 序列化.
 * 正文以 "节" 描述 (标题 + 段落 + 可选 Callout / ApiTable), 由页面组件渲染进 Prose; TOC 由节推出.
 */

export const DOCS_BRAND = "Tessera UI";

/** 正文一节: depth 2 = h2, 3 = h3. callout / api 给了就渲染在该节段落之后. */
export interface DocsSection {
  id: string;
  title: string;
  depth: 2 | 3;
  paragraphs: string[];
  code?: string;
  callout?: { kind: CalloutKind; title?: string; body: string };
  api?: { caption: string; rows: ApiRow[] };
}

export interface DocsArticle {
  title: string;
  lead: string;
  sections: DocsSection[];
}

/** 侧栏 / 目录 / 分页 / 正文: DocsShell 一屏需要的全部数据. */
export interface DocsWorkspaceData {
  brand: string;
  sidebar: LinkGroup[];
  currentHref: string;
  toc: TocItem[];
  pager: { prev?: LinkItem; next?: LinkItem };
  article: DocsArticle;
}

const HREF = {
  intro: "/docs/introduction",
  install: "/docs/installation",
  theming: "/docs/theming",
  button: "/docs/components/button",
  dialog: "/docs/components/dialog",
  table: "/docs/components/table",
} as const;

export const DOCS_SIDEBAR: LinkGroup[] = [
  {
    title: "开始",
    items: [
      { label: "介绍", href: HREF.intro },
      { label: "安装", href: HREF.install },
      { label: "主题与皮肤", href: HREF.theming, badge: "新" },
    ],
  },
  {
    title: "组件",
    items: [
      { label: "Button 按钮", href: HREF.button },
      { label: "Dialog 对话框", href: HREF.dialog },
      { label: "Table 表格", href: HREF.table },
    ],
  },
];

/** 从节推出右栏目录, 保证锚点与标题一一对应. */
function tocOf(article: DocsArticle): TocItem[] {
  return article.sections.map((section) => ({ id: section.id, label: section.title, depth: section.depth }));
}

const INSTALL_ARTICLE: DocsArticle = {
  title: "安装",
  lead: "三步把 Tessera UI 接进一个 React 19 项目: 安装包, 引入样式, 包一层 Provider.",
  sections: [
    { id: "install-package", title: "安装依赖", depth: 2, paragraphs: ["用你习惯的包管理器安装主包. 样式与图标随包发布, 不需要额外配置 PostCSS."], code: "npm install @tessera/ui" },
    { id: "install-styles", title: "引入样式", depth: 2, paragraphs: ["在应用入口引入一次全局样式, 其中包含令牌, 六套皮肤与三档密度."], code: 'import "@tessera/ui/styles.css";' },
    { id: "install-provider", title: "包一层 Provider", depth: 2, paragraphs: ["BlocksProvider 下发语言, 文案与密度. 不包也能用, 此时取浏览器语言与内置中文文案."] },
    { id: "install-skin", title: "切换皮肤", depth: 3, paragraphs: ["在任意祖先节点写 data-skin 即可换肤, 组件只读语义令牌, 不感知皮肤名."] },
  ],
};

const BUTTON_ARTICLE: DocsArticle = {
  title: "Button 按钮",
  lead: "触发一个操作, 例如提交表单, 打开对话框或执行破坏性命令.",
  sections: [
    { id: "button-usage", title: "用法", depth: 2, paragraphs: ["从组件包引入 Button, 用 variant 区分主次, 用 size 匹配所在区域的密度."], code: '<Button variant="primary">保存</Button>' },
    { id: "button-variants", title: "变体", depth: 3, paragraphs: ["primary 用于一屏中唯一的主操作; secondary 与 ghost 用于次要操作; link 用于行内跳转."] },
    {
      id: "button-a11y",
      title: "可访问性",
      depth: 2,
      paragraphs: ["Button 渲染原生 button 元素, 键盘与读屏行为开箱即用."],
      callout: { kind: CALLOUT_KIND.warning, title: "纯图标按钮必须有名字", body: "只放图标时一定要给 aria-label, 否则读屏只会读出 \"按钮\"." },
    },
    {
      id: "button-api",
      title: "API",
      depth: 2,
      paragraphs: ["除下表外, 其余属性透传给原生 button 元素."],
      api: {
        caption: "Button props",
        rows: [
          { name: "children", type: "ReactNode", description: "按钮内容", required: true },
          { name: "variant", type: '"primary" | "secondary" | "ghost" | "link" | "destructive"', default: '"secondary"', description: "外观变体" },
          { name: "size", type: '"sm" | "md" | "lg" | "icon"', default: '"md"', description: "尺寸档, 随 data-density 缩放" },
          { name: "loading", type: "boolean", default: "false", description: "加载中: 显示转圈并禁用点击" },
          { name: "asChild", type: "boolean", default: "false", description: "把样式合并到唯一子元素 (例如路由 Link)" },
          { name: "onClick", type: "(event: React.MouseEvent<HTMLButtonElement>) => void", description: "点击回调" },
          { name: "block", type: "boolean", default: "false", description: "占满整行", deprecated: "改用父级 Stack 的 align=\"stretch\"" },
        ],
      },
    },
  ],
};

/** 文档站首页 (着陆页): 首屏 + 检索入口 + 入口卡片墙. */
export const DOCS_HOME: Pick<DocsHomeProps, "hero" | "search" | "cards" | "pad" | "tone"> = {
  hero: {
    eyebrow: "v2.0 已发布 · 新增皮肤与区块",
    title: "构建界面, 而不是重写样式",
    description: "可访问, 可换肤, 数据驱动的 React 组件与页面区块. 复制一份 JSON, 就是一整页.",
    actions: [
      { label: "开始使用", href: HREF.install, variant: CTA_VARIANT.primary },
      { label: "浏览组件", href: HREF.button, variant: CTA_VARIANT.secondary },
    ],
  },
  search: { placeholder: "搜索文档, 组件与令牌…", shortcut: "⌘K", href: "/docs/search" },
  cards: {
    heading: { title: "从这里开始", description: "按你现在要做的事挑一个入口." },
    items: [
      { title: "安装", href: HREF.install, description: "三步接进 React 19 项目.", icon: "icon-[lucide--download]" },
      { title: "主题与皮肤", href: HREF.theming, description: "六套皮肤与三档密度, 一个属性切换.", icon: "icon-[lucide--palette]", badge: "新" },
      { title: "组件", href: HREF.button, description: "60+ 个基础组件, 键盘与读屏完整支持.", icon: "icon-[lucide--component]" },
      { title: "页面区块", href: "/docs/blocks", description: "营销页, 文档站, 仪表盘与作品集.", icon: "icon-[lucide--layout-template]" },
    ],
  },
  pad: BLOCK_PAD.lg,
  tone: BLOCK_TONE.plain,
};

/** 着陆页之后的文档一屏: "安装" 一页 (纯 Prose 正文). */
export const DOCS_GUIDE: DocsWorkspaceData = {
  brand: DOCS_BRAND,
  sidebar: DOCS_SIDEBAR,
  currentHref: HREF.install,
  toc: tocOf(INSTALL_ARTICLE),
  pager: { prev: { label: "介绍", href: HREF.intro }, next: { label: "主题与皮肤", href: HREF.theming } },
  article: INSTALL_ARTICLE,
};

/** 文章页示范: 组件文档 (Prose + Callout + ApiTable). */
export const DOCS_ARTICLE: DocsWorkspaceData = {
  brand: DOCS_BRAND,
  sidebar: DOCS_SIDEBAR,
  currentHref: HREF.button,
  toc: tocOf(BUTTON_ARTICLE),
  pager: { prev: { label: "主题与皮肤", href: HREF.theming }, next: { label: "Dialog 对话框", href: HREF.dialog } },
  article: BUTTON_ARTICLE,
};

export const DOCS_FOOTER: Pick<SiteFooterBlockProps, "columns" | "brand" | "legal" | "copyright" | "pad" | "tone" | "width"> = {
  brand: { href: "/", name: DOCS_BRAND, description: "数据驱动的 React 组件与页面区块." },
  columns: [
    { title: "文档", items: [{ label: "安装", href: HREF.install }, { label: "组件", href: HREF.button }, { label: "区块", href: "/docs/blocks" }] },
    { title: "社区", items: [{ label: "GitHub", href: "https://github.com/tessera-ui/tessera", external: true }, { label: "讨论区", href: "https://github.com/tessera-ui/tessera/discussions", external: true }] },
  ],
  legal: [{ label: "MIT 许可证", href: "/license" }, { label: "隐私", href: "/privacy" }],
  copyright: "© 2026 Tessera UI",
  pad: BLOCK_PAD.md,
  tone: BLOCK_TONE.muted,
  width: BLOCK_WIDTH.wide,
};

/** 文档站首页整页: DocsHome -> DocsShell(安装页, 内含 DocsPager) -> SiteFooter. */
export const DOCSITE_BLOCKS: BlockNode[] = [
  { type: "DocsHome", key: "docs-home", props: DOCS_HOME },
  { type: "DocsWorkspace", key: "docs-guide", props: { data: DOCS_GUIDE } },
  { type: "SiteFooter", key: "docs-footer", props: DOCS_FOOTER },
];

/** 文章页整页: DocsShell(Button 文档, 含 Callout + ApiTable + DocsPager) -> SiteFooter. */
export const DOCS_ARTICLE_BLOCKS: BlockNode[] = [
  { type: "DocsWorkspace", key: "docs-article", props: { data: DOCS_ARTICLE } },
  { type: "SiteFooter", key: "docs-article-footer", props: DOCS_FOOTER },
];
