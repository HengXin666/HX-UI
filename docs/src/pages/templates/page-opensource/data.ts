/**
 * 开源项目站整页模板的数据 (V2-01). 全部可 JSON 序列化: 无函数, 无节点; 页面组件只把它交给 PageComposer.
 * 区块顺序参考 tailwindcss.com / astro.build / bun.sh / deno.com 首页:
 * SiteHeader -> Hero(command) + InstallBlock -> CodeShowcase -> FeatureGrid -> CaseStudies -> ChangelogList -> CtaBanner -> SiteFooter.
 */
import type { BlockNode, Logo } from "../../../../../src/blocks/_shared/types";
import type { CaseStudiesProps } from "../../../../../src/blocks/marketing/CaseStudies";
import type { ChangelogListProps } from "../../../../../src/blocks/marketing/ChangelogList";
import type { CodeShowcaseProps } from "../../../../../src/blocks/marketing/CodeShowcase";
import type { CtaBannerProps } from "../../../../../src/blocks/marketing/CtaBanner";
import type { FeatureGridProps } from "../../../../../src/blocks/marketing/FeatureGrid";
import type { HeroProps } from "../../../../../src/blocks/marketing/Hero";
import type { InstallBlockProps } from "../../../../../src/blocks/marketing/InstallBlock";
import type { SiteFooterBlockProps, SiteHeaderBlockProps } from "../../../../../src/blocks/site";

/** 皮肤切换演示: 同一份数据, 只换根节点 data-skin. */
export const OSS_SKINS = ["default", "mono", "fintech"] as const;

const logo = (name: string, slug: string): Logo => ({ name, src: `https://cdn.simpleicons.org/${slug}`, width: 32, height: 32 });

const ARIA = { nav: "主导航", mobileOpen: "打开菜单", mobileTitle: "菜单", back: "返回", close: "关闭", footerNav: "页脚导航", social: "社交媒体", legal: "法务链接" };

export const OSS_HEADER = {
  brand: { href: "#", name: "Kite" },
  sticky: true,
  blurOnScroll: true,
  nav: [
    { label: "文档", href: "#docs" },
    { label: "示例", href: "#examples" },
    { label: "博客", href: "#blog" },
    { label: "更新日志", href: "#changelog" },
  ],
  actions: [
    { label: "GitHub 48.2k", href: "https://github.com", icon: "icon-[solar--code-square-linear]", variant: "ghost", external: true },
    { label: "快速开始", href: "#install", variant: "primary" },
  ],
  ariaLabels: ARIA,
} satisfies SiteHeaderBlockProps;

export const OSS_HERO = {
  layout: "centered",
  pill: { badge: "v3.0", label: "Kite 3.0: 零配置的边缘渲染", href: "#changelog" },
  title: "构建快到飞起的 Web 应用",
  lead: "Kite 是一个开源的全栈 TypeScript 框架: 文件即路由, 默认零 JS, 一条命令部署到任意边缘.",
  ctas: [
    { label: "阅读文档", href: "#docs", variant: "primary", size: "lg" },
    { label: "在 GitHub 上 Star", href: "https://github.com", icon: "icon-[solar--code-square-linear]", variant: "secondary", size: "lg", external: true },
  ],
  command: "npm create kite@latest",
  backdrop: { variant: "dots", mask: { fade: "radial" } },
  titleSize: "2xl",
} satisfies HeroProps;

export const OSS_INSTALL = {
  heading: { title: "一条命令开始", description: "选择你习惯的包管理器." },
  align: "center",
  variant: "card",
  pad: "sm",
  commands: [
    { manager: "npm", command: "npm create kite@latest" },
    { manager: "pnpm", command: "pnpm create kite" },
    { manager: "yarn", command: "yarn create kite" },
    { manager: "bun", command: "bun create kite" },
  ],
  alternativesTitle: "其他方式",
  alternatives: [
    { label: "Docker", description: "官方镜像, 适合 CI", command: "docker run -it kitejs/kite" },
    { label: "从模板开始", description: "30+ 官方与社区模板", href: "#templates" },
  ],
} satisfies InstallBlockProps;

const PAGE_CODE = `import { defineRoute } from "kite";

export default defineRoute({
  async load({ params }) {
    return { post: await db.post.find(params.slug) };
  },
  render: ({ post }) => <Article post={post} />,
});`;

const CONFIG_CODE = `import { defineConfig } from "kite/config";

export default defineConfig({
  output: "edge",
  adapters: ["vercel", "cloudflare"],
  prerender: { routes: ["/", "/blog/*"] },
});`;

export const OSS_CODE = {
  heading: { eyebrow: "开发体验", title: "写起来就像普通的 TypeScript", description: "数据加载, 渲染与部署配置都是类型完备的函数." },
  layout: "code",
  showLineNumbers: true,
  tone: "muted",
  tabs: [
    { label: "路由", language: "tsx", filename: "src/routes/blog/[slug].tsx", code: PAGE_CODE, highlightLines: [4, 5] },
    { label: "配置", language: "ts", filename: "kite.config.ts", code: CONFIG_CODE },
    { label: "部署", language: "bash", filename: "terminal", code: "kite build\nkite deploy --target edge" },
  ],
  actions: [{ label: "在 StackBlitz 中打开", href: "#stackblitz", variant: "secondary", icon: "icon-[solar--square-arrow-right-up-linear]", iconEnd: true }],
} satisfies CodeShowcaseProps;

export const OSS_FEATURES = {
  heading: { eyebrow: "为什么选择 Kite", title: "默认就快, 按需才重" },
  cols: 3,
  variant: "plain",
  items: [
    { icon: "icon-[solar--leaf-linear]", title: "默认零 JS", body: "页面先输出纯 HTML, 只有交互岛才加载脚本." },
    { icon: "icon-[solar--folder-path-connect-linear]", title: "文件即路由", body: "目录结构就是 URL, 嵌套布局与动态段开箱即用." },
    { icon: "icon-[solar--global-linear]", title: "边缘优先", body: "同一份代码部署到 Vercel, Cloudflare 与 Deno Deploy." },
    { icon: "icon-[solar--widget-add-linear]", title: "框架无关", body: "React, Vue, Svelte 组件可在同一页混用." },
    { icon: "icon-[solar--speedometer-middle-linear]", title: "增量构建", body: "万页站点二次构建只需 3 秒." },
    { icon: "icon-[solar--hand-heart-linear]", title: "社区驱动", body: "MIT 许可, 900+ 贡献者, 每周发版.", cta: { label: "参与贡献", href: "#contributing", icon: "icon-[solar--arrow-right-linear]", iconEnd: true } },
  ],
} satisfies FeatureGridProps;

export const OSS_CASES = {
  heading: { eyebrow: "谁在用 Kite", title: "从个人博客到百万流量的产品站" },
  variant: "tabs",
  productsLabel: "用到的能力",
  linkLabel: "阅读案例",
  items: [
    { id: "northwind", logo: logo("Shopify", "shopify"), title: "Northwind 把营销站首屏时间降到 0.6 秒", description: "从 SPA 迁移到 Kite 的孤岛架构后, 移动端转化提升 18%.", metrics: [{ value: "0.6s", label: "LCP" }, { value: "18%", label: "转化提升" }], products: ["孤岛架构", "边缘渲染"], href: "#case-northwind" },
    { id: "lumen", logo: logo("Netlify", "netlify"), title: "Lumen 文档站 12,000 页, 构建只需 40 秒", description: "增量构建让每次文档提交几乎即时上线.", metrics: [{ value: 12000, label: "页面" }, { value: "40s", label: "全量构建" }], products: ["增量构建", "内容集合"], href: "#case-lumen" },
    { id: "halcyon", logo: logo("Cloudflare", "cloudflare"), title: "Halcyon 在 300 个边缘节点上服务个性化页面", description: "边缘中间件按地区与 A/B 分组渲染, 无需源站.", metrics: [{ value: 300, label: "边缘节点" }, { value: "35ms", label: "P95 TTFB" }], products: ["中间件", "边缘缓存"], href: "#case-halcyon" },
  ],
} satisfies CaseStudiesProps;

export const OSS_CHANGELOG = {
  heading: { eyebrow: "更新日志", title: "每周都在变得更好" },
  variant: "list",
  limit: 4,
  tone: "muted",
  viewAll: { label: "查看完整日志", href: "#changelog-all", variant: "link", icon: "icon-[solar--arrow-right-linear]", iconEnd: true },
  items: [
    { date: "2026-10-28", version: "3.0.0", title: "Kite 3.0: 零配置边缘渲染", summary: "自动识别部署目标, 删除 adapter 配置.", tags: [{ label: "重大", tone: "primary" }], href: "#v3-0-0" },
    { date: "2026-10-14", version: "2.9.0", title: "服务端动作与表单渐进增强", summary: "表单无 JS 可提交, 有 JS 时无刷新.", tags: [{ label: "新功能", tone: "success" }], href: "#v2-9-0" },
    { date: "2026-09-30", version: "2.8.2", title: "开发服务器冷启动快 2 倍", tags: [{ label: "性能", tone: "info" }], href: "#v2-8-2" },
    { date: "2026-09-16", version: "2.8.0", title: "内置图片优化与 AVIF 输出", tags: [{ label: "新功能", tone: "success" }], href: "#v2-8-0" },
  ],
} satisfies ChangelogListProps;

export const OSS_CTA = {
  eyebrow: "MIT 开源",
  title: "五分钟搭出你的第一个 Kite 站点",
  lead: "加入 4 万名开发者的 Discord 社区, 随时提问.",
  ctas: [
    { label: "快速开始", href: "#install", variant: "primary" },
    { label: "加入 Discord", href: "#discord", variant: "secondary", icon: "icon-[solar--chat-round-linear]" },
  ],
  variant: "full",
  fill: "mesh",
} satisfies CtaBannerProps;

export const OSS_FOOTER = {
  brand: { href: "#", name: "Kite", description: "开源的全栈 TypeScript 框架." },
  columns: [
    { title: "学习", items: [{ label: "文档", href: "#docs" }, { label: "教程", href: "#tutorial" }, { label: "示例", href: "#examples" }] },
    { title: "社区", items: [{ label: "GitHub", href: "https://github.com", external: true }, { label: "Discord", href: "#discord" }, { label: "贡献指南", href: "#contributing" }] },
    { title: "项目", items: [{ label: "更新日志", href: "#changelog" }, { label: "路线图", href: "#roadmap" }, { label: "赞助", href: "#sponsor" }] },
  ],
  social: [{ label: "GitHub", href: "https://github.com", icon: "icon-[solar--code-square-linear]", external: true }, { label: "X", href: "https://x.com", icon: "icon-[solar--hashtag-linear]", external: true }],
  legal: [{ label: "MIT 许可", href: "#license" }, { label: "行为准则", href: "#coc" }],
  copyright: "© 2026 Kite 贡献者",
  ariaLabels: ARIA,
} satisfies SiteFooterBlockProps;

/** PageComposer 的 blocks 数组: Hero 与 InstallBlock 同 tone 相邻, 留白由 BlockShell 自动合并. */
export const OSS_PAGE: BlockNode[] = [
  { type: "SiteHeader", key: "header", props: OSS_HEADER },
  { type: "Hero", key: "hero", props: OSS_HERO },
  { type: "InstallBlock", key: "install", props: OSS_INSTALL },
  { type: "CodeShowcase", key: "code", props: OSS_CODE },
  { type: "FeatureGrid", key: "features", props: OSS_FEATURES },
  { type: "CaseStudies", key: "showcase", props: OSS_CASES },
  { type: "ChangelogList", key: "changelog", props: OSS_CHANGELOG },
  { type: "CtaBanner", key: "cta", props: OSS_CTA },
  { type: "SiteFooter", key: "footer", props: OSS_FOOTER },
];
