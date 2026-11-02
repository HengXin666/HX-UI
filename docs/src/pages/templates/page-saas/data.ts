/**
 * SaaS 落地页整页模板的数据 (V2-01). 全部可 JSON 序列化: 无函数, 无节点; 页面组件只把它交给 PageComposer.
 * 区块顺序参考 vercel.com / linear.app / stripe.com / supabase.com 首页:
 * SiteHeader(+公告) -> Hero -> LogoWall -> FeatureGrid -> BentoFeatures -> StatBand -> Testimonials -> Pricing -> Faq -> CtaBanner -> SiteFooter.
 */
import type { BlockNode, Logo } from "../../../../../src/blocks/_shared/types";
import type { BentoFeaturesProps } from "../../../../../src/blocks/marketing/BentoFeatures";
import type { CtaBannerProps } from "../../../../../src/blocks/marketing/CtaBanner";
import type { FaqProps } from "../../../../../src/blocks/marketing/Faq";
import type { FeatureGridProps } from "../../../../../src/blocks/marketing/FeatureGrid";
import type { HeroProps } from "../../../../../src/blocks/marketing/Hero";
import type { LogoWallProps } from "../../../../../src/blocks/marketing/LogoWall";
import type { PricingProps } from "../../../../../src/blocks/marketing/Pricing";
import type { StatBandProps } from "../../../../../src/blocks/marketing/StatBand";
import type { TestimonialsProps } from "../../../../../src/blocks/marketing/Testimonials";
import type { AnnouncementBlockProps, SiteFooterBlockProps, SiteHeaderBlockProps } from "../../../../../src/blocks/site";

/** 皮肤切换演示: 同一份数据, 只换根节点 data-skin. */
export const SAAS_SKINS = ["default", "mono", "fintech"] as const;

const icon = (slug: string): string => `https://cdn.simpleicons.org/${slug}`;
const logo = (name: string, slug: string): Logo => ({ name, src: icon(slug), width: 32, height: 32 });

export const SAAS_LOGOS: Logo[] = [
  logo("Vercel", "vercel"), logo("Stripe", "stripe"), logo("Shopify", "shopify"), logo("Supabase", "supabase"),
  logo("Linear", "linear"), logo("Notion", "notion"), logo("Figma", "figma"), logo("Framer", "framer"),
];

const ARIA = { nav: "主导航", mobileOpen: "打开菜单", mobileTitle: "菜单", back: "返回", close: "关闭", announcement: "站点公告", dismiss: "关闭公告", footerNav: "页脚导航", social: "社交媒体", legal: "法务链接" };

export const SAAS_ANNOUNCEMENT = {
  message: "Orbit 2.0 发布: AI 自动分诊与实时协作上线.",
  cta: { label: "阅读发布说明", href: "#changelog", icon: "lucide:arrow-right", iconEnd: true },
  icon: "lucide:sparkles",
  storageKey: "tpl-saas-announcement-2-0",
  ariaLabels: ARIA,
} satisfies AnnouncementBlockProps;

export const SAAS_HEADER = {
  brand: { href: "#", name: "Orbit" },
  sticky: true,
  blurOnScroll: true,
  nav: [
    {
      label: "产品",
      mega: {
        columns: [
          { title: "规划", items: [{ label: "议题", href: "#issues", description: "键盘优先的任务流" }, { label: "路线图", href: "#roadmap", description: "跨团队的季度目标" }] },
          { title: "协作", items: [{ label: "文档", href: "#docs", description: "规格与讨论同处一处" }, { label: "洞察", href: "#insights", description: "周期与吞吐量报表" }] },
        ],
        featured: [{ title: "Orbit 2.0", description: "AI 分诊, 实时协作", cta: { label: "了解更多", href: "#changelog", variant: "link" } }],
      },
    },
    { label: "客户", href: "#customers" },
    { label: "定价", href: "#pricing" },
    { label: "文档", href: "#docs" },
  ],
  actions: [
    { label: "登录", href: "#login", variant: "ghost" },
    { label: "免费试用", href: "#signup", variant: "primary" },
  ],
  ariaLabels: ARIA,
} satisfies SiteHeaderBlockProps;

export const SAAS_HERO = {
  layout: "centered",
  pill: { badge: "新", label: "Orbit 2.0 已发布", href: "#changelog" },
  title: "为高效团队打造的",
  rotate: ["项目管理", "产品规划", "缺陷追踪", "发布节奏"],
  lead: "议题, 路线图与文档放进同一个极速工作区. 从第一张卡片到上市, 不用再切换工具.",
  ctas: [
    { label: "免费开始", href: "#signup", variant: "primary", size: "lg" },
    { label: "预约演示", href: "#demo", variant: "secondary", size: "lg" },
  ],
  media: { kind: "image", src: "https://picsum.photos/seed/tpl-saas-hero/1600/1000", alt: "Orbit 工作区截图", ratio: "16/9", priority: true },
  frame: "browser",
  frameAddress: "app.orbit.dev",
  backdrop: { variant: "grid", mask: { fade: "bottom" } },
  titleSize: "2xl",
} satisfies HeroProps;

export const SAAS_LOGO_WALL = {
  title: "超过 12,000 个团队每天在 Orbit 上交付",
  logos: SAAS_LOGOS,
  mode: "marquee",
  pad: "md",
} satisfies LogoWallProps;

export const SAAS_FEATURES = {
  heading: { eyebrow: "为速度而生", title: "每一个操作都在 50 毫秒内完成", description: "本地优先同步引擎, 离线可用, 联网即合并." },
  cols: 3,
  variant: "card",
  items: [
    { icon: "lucide:zap", title: "即时响应", body: "所有数据缓存在本地, 搜索与筛选无需等待网络." },
    { icon: "lucide:keyboard", title: "键盘优先", body: "命令面板覆盖全部操作, 双手不离开键盘." },
    { icon: "lucide:git-branch", title: "Git 联动", body: "分支, PR 与议题自动关联, 合并即关闭." },
    { icon: "lucide:bot", title: "AI 分诊", body: "新议题自动归类, 指派与估时, 准确率 92%." },
    { icon: "lucide:shield-check", title: "企业级安全", body: "SOC 2 Type II, SAML SSO 与细粒度权限." },
    { icon: "lucide:plug", title: "开放 API", body: "GraphQL API 与 Webhook, 和现有工具链无缝衔接.", cta: { label: "查看 API", href: "#api", icon: "lucide:arrow-right", iconEnd: true } },
  ],
} satisfies FeatureGridProps;

export const SAAS_BENTO = {
  heading: { eyebrow: "一个工作区", title: "从想法到发布的完整闭环" },
  cols: 3,
  tone: "muted",
  items: [
    { icon: "lucide:map", title: "路线图", body: "季度目标拆到每一张卡片, 进度自动汇总.", span: { col: 2, row: 2 }, media: { kind: "image", src: "https://picsum.photos/seed/tpl-saas-roadmap/1200/800", alt: "路线图视图", ratio: "3/2" } },
    { icon: "lucide:refresh-cw", title: "周期", body: "两周一个节奏, 未完成项自动顺延." },
    { icon: "lucide:inbox", title: "收件箱", body: "提及, 指派与评审集中处理." },
    { icon: "lucide:file-text", title: "文档", body: "规格书直接引用议题, 状态实时同步.", span: { col: 2 } },
    { icon: "lucide:bar-chart-3", title: "洞察", body: "吞吐量, 周期时长与燃尽图一键生成." },
  ],
} satisfies BentoFeaturesProps;

export const SAAS_STATS = {
  items: [
    { value: 12000, suffix: "+", label: "活跃团队", format: { notation: "compact" } },
    { value: 99.99, suffix: "%", label: "全年可用性" },
    { value: 48, suffix: "ms", label: "P95 操作延迟" },
    { value: 3.2, suffix: "x", label: "平均交付提速", description: "2026 年客户调研" },
  ],
  variant: "inline",
} satisfies StatBandProps;

export const SAAS_TESTIMONIALS = {
  heading: { eyebrow: "客户评价", title: "团队换上 Orbit 之后" },
  variant: "cards",
  columns: 3,
  items: [
    { quote: "我们把三套工具合并成 Orbit, 每周站会从 45 分钟缩到 15 分钟.", person: { name: "林舟", role: "工程副总裁", company: "Northwind" }, logo: SAAS_LOGOS[0] },
    { quote: "键盘操作快到离谱, 新同事第一天就能上手.", person: { name: "Maya Chen", role: "产品负责人", company: "Lumen" }, logo: SAAS_LOGOS[1] },
    { quote: "AI 分诊替我们每周省下一整天的整理时间.", person: { name: "周岚", role: "支持主管", company: "Halcyon" }, logo: SAAS_LOGOS[2] },
    { quote: "路线图和议题终于是同一份数据, 管理层不再追问进度.", person: { name: "Diego Ruiz", role: "CTO", company: "Fieldwork" }, logo: SAAS_LOGOS[3] },
    { quote: "迁移只用了一个下午, 导入器把历史全部保留下来.", person: { name: "苏言", role: "研发经理", company: "Brightline" }, logo: SAAS_LOGOS[4] },
    { quote: "安全评审一次通过, SSO 与审计日志开箱即用.", person: { name: "Aiko Tanaka", role: "安全负责人", company: "Kestrel" }, logo: SAAS_LOGOS[5] },
  ],
} satisfies TestimonialsProps;

export const SAAS_PRICING = {
  heading: { eyebrow: "定价", title: "随团队成长的价格", description: "免费起步, 年付立省两个月." },
  align: "center",
  billing: { options: ["month", "year"], default: "year" },
  plans: [
    { key: "free", name: "Free", kind: "free", description: "个人与小团队", price: { amount: 0, currency: "USD" }, features: ["最多 10 名成员", "无限议题", "GitHub 集成"], cta: { label: "免费开始", href: "#signup" } },
    { key: "pro", name: "Pro", highlight: true, badge: "最受欢迎", description: "成长中的团队", prices: { month: { amount: 12, currency: "USD", period: "month" }, year: { amount: 120, currency: "USD", period: "year" } }, priceNote: "按席位计费", features: ["Free 的全部内容", "无限成员", "路线图与周期", "AI 分诊"], cta: { label: "试用 Pro", href: "#pro" } },
    { key: "enterprise", name: "Enterprise", kind: "contact", description: "规模化与合规", priceNote: "年度合同", features: ["Pro 的全部内容", "SAML 与 SCIM", "审计日志", "专属客户经理"], cta: { label: "联系销售", href: "#sales" } },
  ],
} satisfies PricingProps;

export const SAAS_FAQ = {
  heading: { title: "常见问题", description: "找不到答案? 随时联系我们." },
  columns: 2,
  items: [
    { q: "可以免费使用多久?", a: "Free 档永久免费, 没有试用期限制." },
    { q: "如何从其他工具迁移?", a: "内置 Jira, Asana 与 GitHub Issues 导入器, 历史与附件完整保留." },
    { q: "支持私有化部署吗?", a: "Enterprise 档支持单租户部署与自带密钥加密." },
    { q: "按什么计费?", a: "按活跃席位按月计费, 停用成员不计费." },
    { q: "可以随时取消吗?", a: "可以. 取消后当前计费周期结束前仍可使用." },
  ],
  contact: { title: "还有疑问?", description: "我们的团队通常在 2 小时内回复.", cta: { label: "联系我们", href: "#contact", variant: "secondary" } },
} satisfies FaqProps;

export const SAAS_CTA = {
  title: "今天就让团队快起来",
  lead: "两分钟创建工作区, 无需信用卡.",
  ctas: [
    { label: "免费开始", href: "#signup", variant: "primary" },
    { label: "预约演示", href: "#demo", variant: "secondary" },
  ],
  variant: "boxed",
  fill: "gradient",
} satisfies CtaBannerProps;

export const SAAS_FOOTER = {
  brand: { href: "#", name: "Orbit", description: "为高效团队打造的项目管理工具." },
  columns: [
    { title: "产品", items: [{ label: "议题", href: "#issues" }, { label: "路线图", href: "#roadmap" }, { label: "定价", href: "#pricing" }, { label: "更新日志", href: "#changelog" }] },
    { title: "资源", items: [{ label: "文档", href: "#docs" }, { label: "API", href: "#api" }, { label: "社区", href: "#community" }] },
    { title: "公司", items: [{ label: "关于", href: "#about" }, { label: "招聘", href: "#careers" }, { label: "联系", href: "#contact" }] },
  ],
  social: [{ label: "GitHub", href: "https://github.com", icon: "lucide:github", external: true }, { label: "X", href: "https://x.com", icon: "lucide:twitter", external: true }],
  legal: [{ label: "隐私", href: "#privacy" }, { label: "条款", href: "#terms" }],
  status: { label: "所有系统正常", href: "#status", state: "ok" },
  copyright: "© 2026 Orbit Labs",
  ariaLabels: ARIA,
} satisfies SiteFooterBlockProps;

/** PageComposer 的 blocks 数组: type 为 SAAS_REGISTRY 的键, props 为上面的纯数据. */
export const SAAS_PAGE: BlockNode[] = [
  { type: "SiteHeader", key: "header", props: { ...SAAS_HEADER, announcement: SAAS_ANNOUNCEMENT } },
  { type: "Hero", key: "hero", props: SAAS_HERO },
  { type: "LogoWall", key: "customers", props: SAAS_LOGO_WALL },
  { type: "FeatureGrid", key: "features", props: SAAS_FEATURES },
  { type: "BentoFeatures", key: "workspace", props: SAAS_BENTO },
  { type: "StatBand", key: "stats", props: SAAS_STATS },
  { type: "Testimonials", key: "testimonials", props: SAAS_TESTIMONIALS },
  { type: "Pricing", key: "pricing", props: SAAS_PRICING },
  { type: "Faq", key: "faq", props: SAAS_FAQ },
  { type: "CtaBanner", key: "cta", props: SAAS_CTA },
  { type: "SiteFooter", key: "footer", props: SAAS_FOOTER },
];
