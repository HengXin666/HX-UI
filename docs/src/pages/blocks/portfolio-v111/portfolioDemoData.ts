import type { ExperienceItem, LinkItem, PostItem, ProfileData, ProjectItem } from "../../../../../src/blocks/_shared/types";

/**
 * 作品集演示数据: 全部是可 JSON 序列化的字符串 / 布尔 / 数组, 与 PageComposer / CMS 生成的数据同形.
 * 图片地址由文档页在浏览器里现画后注入 (withImages), 这里只留 alt 与比例.
 */
export const PORTFOLIO_DEMO_NAV: LinkItem[] = [
  { label: "关于", href: "#pf-about" },
  { label: "经历", href: "#pf-experience" },
  { label: "项目", href: "#pf-projects" },
  { label: "文章", href: "#pf-writing" },
];

export const PORTFOLIO_DEMO_PROFILE: ProfileData = {
  name: "林知远",
  role: "前端工程师 · 设计系统",
  bio: "我做让人用着舒服的界面: 关注可访问性, 排版与细小的交互, 在设计与工程之间来回翻译.",
  links: [
    { label: "GitHub", href: "https://github.com", icon: "icon-[mdi--github]", external: true },
    { label: "X", href: "https://x.com", icon: "icon-[mdi--twitter]", external: true },
    { label: "Email", href: "mailto:hi@example.com", icon: "icon-[mdi--email-outline]" },
  ],
};

export const PORTFOLIO_DEMO_EXPERIENCE: ExperienceItem[] = [
  { period: "2024 — 至今", title: "高级前端工程师", org: "Atlas", href: "https://example.com", current: true, body: "负责设计系统与区块层, 把 24 个参考站的版式抽成数据驱动的区块.", tags: ["React", "TypeScript", "Tailwind"] },
  { period: "2021 — 2024", title: "前端工程师", org: "Lumen", href: "https://example.com", body: "搭建营销站与文档站, 首屏 LCP 从 3.1s 降到 1.4s.", tags: ["Next.js", "Motion"] },
  { period: "2019 — 2021", title: "交互设计师", org: "Orbit", body: "移动端组件库与动效规范.", tags: ["Figma", "Prototyping"] },
  { period: "2017 — 2019", title: "实习生", org: "Quill", body: "内部工具前端.", tags: ["Vue"] },
];

export const PORTFOLIO_DEMO_PROJECTS: ProjectItem[] = [
  { title: "HX-UI", href: "https://example.com", external: true, featured: true, body: "数据驱动的区块与皮肤体系.", tags: ["React", "Design System"] },
  { title: "Lumen Docs", href: "https://example.com", external: true, body: "带 scrollspy 目录的文档站外壳.", tags: ["MDX", "Search"] },
  { title: "Orbit Motion", href: "https://example.com", external: true, body: "尊重减弱动效的编排预设.", tags: ["Motion"] },
  { title: "Quill Notes", href: "https://example.com", body: "极简写作应用.", tags: ["PWA"], links: [{ label: "源码", href: "https://github.com", external: true }] },
];

export const PORTFOLIO_DEMO_POSTS: PostItem[] = [
  { title: "粘性侧栏为什么要用容器查询", date: "2026-10-12", href: "#post-1", excerpt: "放进窄栏时视口断点会说谎.", tags: ["CSS"] },
  { title: "IntersectionObserver 版 scrollspy", date: "2026-07-03", href: "#post-2" },
  { title: "中文排版的字距回退", date: "2026-02-18", href: "#post-3", tags: ["Typography"] },
  { title: "减弱动效不是关掉动效", date: "2025-11-09", href: "#post-4" },
  { title: "从 Primer 学到的分层", date: "2025-04-21", href: "#post-5" },
];

/** 把现画的示例图按下标注入项目与头像. */
export function withImages(projects: ProjectItem[], srcs: ReadonlyArray<string | undefined>): ProjectItem[] {
  return projects.map((p, i) => (srcs[i] ? { ...p, media: { src: srcs[i], alt: typeof p.title === "string" ? p.title : "", ratio: "16/9" } } : p));
}
