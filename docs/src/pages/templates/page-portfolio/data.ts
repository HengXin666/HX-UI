import { BLOCK_PAD, BLOCK_TONE, BLOCK_WIDTH } from "../../../../../src/constants/blocks";
import { PORTFOLIO_HERO_LAYOUT, PORTFOLIO_PROJECT_LAYOUT } from "../../../../../src/constants/blocks-portfolio-v111";
import type { BlockNode, ExperienceItem, LinkItem, PostItem, ProfileData, ProjectItem } from "../../../../../src/blocks/_shared/types";
import type { ExperienceTimelineProps, PostListProps, ProjectGridProps, StickyProfileAside } from "../../../../../src/blocks/portfolio";
import type { SiteFooterBlockProps } from "../../../../../src/blocks/site";

/**
 * 个人主页整页模板 (V2-03) 的全部数据. 只有字符串 / 数字 / 布尔 / 数组, 可直接 JSON.stringify 交给 CMS 或 Agent 生成.
 * 版式档位取自 src/constants, 页面组件只把这些数据交给 PageComposer.
 */

/** 右栏三节的锚点; 侧栏导航的 href 由它推出, 保证 scrollspy 对得上. */
export const PORTFOLIO_SECTION = { experience: "pf-experience", projects: "pf-projects", writing: "pf-writing" } as const;

export const PORTFOLIO_PROFILE: ProfileData = {
  name: "周屿",
  role: "前端工程师 · 设计系统与可访问性",
  bio: "我在设计与工程之间做翻译: 把排版, 节奏与细小的交互写成可复用的组件, 让产品团队少写样式, 多做产品.",
  links: [
    { label: "GitHub", href: "https://github.com/zhouyu-dev", icon: "icon-[mdi--github]", external: true },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/zhouyu-dev", icon: "icon-[mdi--linkedin]", external: true },
    { label: "Email", href: "mailto:hello@zhouyu.dev", icon: "icon-[mdi--email-outline]" },
  ],
};

export const PORTFOLIO_NAV: LinkItem[] = [
  { label: "经历", href: `#${PORTFOLIO_SECTION.experience}` },
  { label: "项目", href: `#${PORTFOLIO_SECTION.projects}` },
  { label: "文章", href: `#${PORTFOLIO_SECTION.writing}` },
];

export const PORTFOLIO_ASIDE: StickyProfileAside = {
  name: PORTFOLIO_PROFILE.name,
  role: PORTFOLIO_PROFILE.role,
  bio: "现在在 Northwind 搭建跨产品线的设计系统.",
  nav: PORTFOLIO_NAV,
  links: PORTFOLIO_PROFILE.links,
};

const EXPERIENCE: ExperienceItem[] = [
  {
    period: "2024 — 至今",
    title: "资深前端工程师",
    org: "Northwind",
    href: "#exp-northwind",
    current: true,
    body: "主导设计系统 2.0: 令牌, 皮肤与数据驱动的页面区块, 覆盖 6 条产品线, 新页面平均交付周期缩短 40%.",
    tags: ["React", "TypeScript", "Design Tokens"],
  },
  {
    period: "2021 — 2024",
    title: "前端工程师",
    org: "Lumen Labs",
    href: "#exp-lumen",
    body: "负责营销站与文档站, 首屏 LCP 从 3.2s 降到 1.3s, 搭建可视化回归流水线.",
    tags: ["Next.js", "Playwright", "Motion"],
  },
  {
    period: "2019 — 2021",
    title: "交互设计师",
    org: "Orbit Studio",
    body: "移动端组件库与动效规范, 编写减弱动效下的退化策略.",
    tags: ["Figma", "Prototyping"],
  },
  { period: "2018 — 2019", title: "前端实习生", org: "Quill", body: "内部运营工具的表格与表单.", tags: ["Vue"] },
];

const PROJECTS: ProjectItem[] = [
  {
    title: "Tessera UI",
    href: "#project-tessera",
    featured: true,
    body: "开源区块库: 一份 JSON 拼出营销页, 文档站与仪表盘.",
    tags: ["React", "Tailwind"],
    links: [{ label: "源码", href: "https://github.com/zhouyu-dev/tessera", external: true }],
  },
  { title: "Inkwell", href: "#project-inkwell", body: "面向中文长文的排版引擎, 自动处理标点挤压.", tags: ["Typography"] },
  { title: "Contrast Lens", href: "#project-contrast-lens", body: "浏览器扩展: 实时检查页面对比度与焦点顺序.", tags: ["a11y", "Extension"] },
  { title: "Tidewatch", href: "#project-tidewatch", body: "潮汐与日落时间的离线 PWA.", tags: ["PWA"] },
];

const POSTS: PostItem[] = [
  { title: "把区块做成数据: 一个页面 schema 的演化", date: "2026-10-18", href: "/writing/blocks-as-data", excerpt: "从 props 到 JSON, 再到 Agent 可生成的页面.", tags: ["Architecture"] },
  { title: "容器查询让侧栏布局不再说谎", date: "2026-08-02", href: "/writing/container-queries" },
  { title: "中文标题的字距该不该收紧", date: "2026-03-11", href: "/writing/cjk-tracking", tags: ["Typography"] },
  { title: "减弱动效不是关掉动效", date: "2025-12-06", href: "/writing/reduced-motion" },
  { title: "我如何评审一个设计令牌提案", date: "2025-05-20", href: "/writing/token-review" },
];

/** 右栏三节的区块 props (除 children 外全部是数据). */
export interface PortfolioSections {
  experience: Pick<ExperienceTimelineProps, "id" | "heading" | "items" | "limit" | "pad" | "width">;
  projects: Pick<ProjectGridProps, "id" | "heading" | "items" | "layout" | "featuredFirst" | "pad" | "width">;
  posts: Pick<PostListProps, "id" | "heading" | "items" | "limit" | "rssHref" | "allPosts" | "pad" | "width">;
}

export const PORTFOLIO_SECTIONS: PortfolioSections = {
  experience: { id: PORTFOLIO_SECTION.experience, heading: { title: "经历" }, items: EXPERIENCE, limit: 3, pad: BLOCK_PAD.sm, width: BLOCK_WIDTH.full },
  projects: {
    id: PORTFOLIO_SECTION.projects,
    heading: { title: "项目" },
    items: PROJECTS,
    layout: PORTFOLIO_PROJECT_LAYOUT.grid,
    featuredFirst: true,
    pad: BLOCK_PAD.sm,
    width: BLOCK_WIDTH.full,
  },
  posts: {
    id: PORTFOLIO_SECTION.writing,
    heading: { title: "文章" },
    items: POSTS,
    limit: 4,
    rssHref: "/rss.xml",
    allPosts: { label: "全部文章", href: "/writing" },
    pad: BLOCK_PAD.sm,
    width: BLOCK_WIDTH.full,
  },
};

/** 极简页脚 (leerob.com 式): 无链接列, 只留社交与版权. */
export const PORTFOLIO_FOOTER: Pick<SiteFooterBlockProps, "columns" | "social" | "copyright" | "pad" | "tone" | "width"> = {
  columns: [],
  social: PORTFOLIO_PROFILE.links,
  copyright: "© 2026 周屿 · 用 HX-UI 区块搭建",
  pad: BLOCK_PAD.sm,
  tone: BLOCK_TONE.plain,
  width: BLOCK_WIDTH.content,
};

/** 整页区块序列: ProfileHero -> StickyProfileLayout(经历 + 项目 + 文章) -> SiteFooter. type 对应页面里的 registry 键. */
export const PORTFOLIO_BLOCKS: BlockNode[] = [
  {
    type: "ProfileHero",
    key: "pf-about",
    props: { ...PORTFOLIO_PROFILE, layout: PORTFOLIO_HERO_LAYOUT.start, pad: BLOCK_PAD.lg, width: BLOCK_WIDTH.content },
  },
  { type: "PortfolioBody", key: "pf-body", props: { aside: PORTFOLIO_ASIDE, sections: PORTFOLIO_SECTIONS, width: BLOCK_WIDTH.content } },
  { type: "SiteFooter", key: "pf-footer", props: PORTFOLIO_FOOTER },
];
