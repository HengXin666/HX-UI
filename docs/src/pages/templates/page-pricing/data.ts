/**
 * 定价页整页模板的数据 (V2-01). 全部可 JSON 序列化: 无函数, 无节点; 页面组件只把它交给 PageComposer.
 * 区块顺序参考 linear.app/pricing 与 vercel.com/pricing:
 * SiteHeader -> 小 Hero -> Pricing(月 / 年切换) -> ComparisonMatrix -> Faq(16 项, 分组 + 搜索) -> CtaBanner -> SiteFooter.
 * 16 项 FAQ 单独放在 data-faq.ts, 保持本文件在行数上限内.
 */
import type { BlockNode } from "../../../../../src/blocks/_shared/types";
import type { ComparisonMatrixProps } from "../../../../../src/blocks/marketing/ComparisonMatrix";
import type { CtaBannerProps } from "../../../../../src/blocks/marketing/CtaBanner";
import type { HeroProps } from "../../../../../src/blocks/marketing/Hero";
import type { PricingProps } from "../../../../../src/blocks/marketing/Pricing";
import type { SiteFooterBlockProps, SiteHeaderBlockProps } from "../../../../../src/blocks/site";
import { PRICING_FAQ } from "./data-faq";

export { PRICING_FAQ };

/** 皮肤切换演示: 同一份数据, 只换根节点 data-skin. */
export const PRICING_SKINS = ["default", "mono", "fintech"] as const;

const ARIA = { nav: "主导航", mobileOpen: "打开菜单", mobileTitle: "菜单", back: "返回", close: "关闭", footerNav: "页脚导航", social: "社交媒体", legal: "法务链接" };

export const PRICING_HEADER = {
  brand: { href: "#", name: "Orbit" },
  sticky: true,
  nav: [
    { label: "产品", href: "#product" },
    { label: "客户", href: "#customers" },
    { label: "定价", href: "#pricing", current: true },
    { label: "文档", href: "#docs" },
  ],
  actions: [
    { label: "登录", href: "#login", variant: "ghost" },
    { label: "免费试用", href: "#signup", variant: "primary" },
  ],
  ariaLabels: ARIA,
} satisfies SiteHeaderBlockProps;

export const PRICING_HERO = {
  layout: "centered",
  eyebrow: "定价",
  title: "简单透明的价格",
  lead: "免费起步, 按席位付费, 随时升级或降级. 年付立省两个月.",
  titleSize: "lg",
  pad: "md",
} satisfies HeroProps;

const usd = (amount: number, period: "month" | "year") => ({ amount, currency: "USD", period });

export const PRICING_PLANS = {
  align: "center",
  billing: { options: ["month", "year"], default: "year", saveLabel: "年付省 17%" },
  plans: [
    {
      key: "free", name: "Free", kind: "free", description: "个人与小团队起步",
      price: { amount: 0, currency: "USD" }, priceNote: "永久免费",
      features: ["最多 10 名成员", "无限议题", "2 个团队", "GitHub 与 Slack 集成"],
      cta: { label: "免费开始", href: "#signup", variant: "secondary" },
    },
    {
      key: "basic", name: "Basic", description: "成长中的团队",
      prices: { month: usd(10, "month"), year: usd(100, "year") }, priceNote: "按席位计费",
      featuresTitle: "Free 的全部内容, 另加",
      features: ["无限成员", "5 个团队", { label: "文件上传", included: "单文件 100 MB" }, { label: "管理员角色", included: false }],
      cta: { label: "选择 Basic", href: "#basic", variant: "secondary" },
    },
    {
      key: "business", name: "Business", highlight: true, badge: "最受欢迎", description: "需要洞察与管控的团队",
      prices: { month: usd(16, "month"), year: usd(160, "year") }, priceNote: "按席位计费",
      featuresTitle: "Basic 的全部内容, 另加",
      features: ["无限团队", "私有团队与访客", "数据洞察", { label: "管理员角色", included: true }],
      cta: { label: "选择 Business", href: "#business" },
    },
    {
      key: "enterprise", name: "Enterprise", kind: "contact", description: "规模化与安全合规",
      priceNote: "年度合同, 按量议价",
      featuresTitle: "Business 的全部内容, 另加",
      features: ["SAML 与 SCIM", "审计日志", "单租户部署", "专属客户经理"],
      cta: { label: "联系销售", href: "#sales", variant: "secondary" },
    },
  ],
  includes: { title: "所有方案都包含", items: ["99.9% 可用性", "SOC 2 Type II", "传输与存储加密", "API 与 Webhook", "iOS 与 Android 应用", "社区支持"] },
} satisfies PricingProps;

export const PRICING_MATRIX = {
  heading: { title: "详细对比", description: "逐项查看各方案包含的功能." },
  tone: "muted",
  featureLabel: "功能",
  plans: [
    { key: "free", name: "Free", description: "$0" },
    { key: "basic", name: "Basic", description: "$8 / 席位 / 月" },
    { key: "business", name: "Business", description: "$13 / 席位 / 月" },
    { key: "enterprise", name: "Enterprise", description: "联系销售" },
  ],
  groups: [
    {
      title: "基础",
      rows: [
        { label: "成员数", values: { free: "10", basic: "无限", business: "无限", enterprise: "无限" } },
        { label: "团队数", values: { free: 2, basic: 5, business: "无限", enterprise: "无限" } },
        { label: "议题", values: { free: "无限", basic: "无限", business: "无限", enterprise: "无限" } },
        { label: "文件上传", tooltip: "单个附件大小上限", values: { free: "10 MB", basic: "100 MB", business: "1 GB", enterprise: "自定义" } },
      ],
    },
    {
      title: "规划与洞察",
      rows: [
        { label: "路线图", values: { free: false, basic: true, business: true, enterprise: true } },
        { label: "周期", values: { free: true, basic: true, business: true, enterprise: true } },
        { label: "数据洞察", values: { free: false, basic: false, business: true, enterprise: true } },
        { label: "AI 分诊", values: { free: false, basic: "每月 200 次", business: "无限", enterprise: "无限" } },
      ],
    },
    {
      title: "安全与管理",
      rows: [
        { label: "管理员角色", values: { free: false, basic: false, business: true, enterprise: true } },
        { label: "私有团队与访客", values: { free: false, basic: false, business: true, enterprise: true } },
        { label: "SAML SSO", values: { free: false, basic: false, business: false, enterprise: true } },
        { label: "SCIM 用户同步", values: { free: false, basic: false, business: false, enterprise: true } },
        { label: "审计日志", tooltip: "保留 1 年, 可导出", values: { free: false, basic: false, business: false, enterprise: true } },
      ],
    },
    {
      title: "支持",
      rows: [
        { label: "社区支持", values: { free: true, basic: true, business: true, enterprise: true } },
        { label: "邮件支持", values: { free: false, basic: true, business: true, enterprise: true } },
        { label: "专属客户经理", values: { free: false, basic: false, business: false, enterprise: true } },
        { label: "可用性 SLA", values: { free: false, basic: false, business: "99.9%", enterprise: "99.99%" } },
      ],
    },
  ],
} satisfies ComparisonMatrixProps;

export const PRICING_CTA = {
  title: "还在犹豫? 先免费用起来",
  lead: "Business 档 14 天免费试用, 无需信用卡.",
  ctas: [
    { label: "开始试用", href: "#signup", variant: "primary" },
    { label: "联系销售", href: "#sales", variant: "secondary" },
  ],
  variant: "boxed",
  fill: "gradient",
} satisfies CtaBannerProps;

export const PRICING_FOOTER = {
  brand: { href: "#", name: "Orbit", description: "为高效团队打造的项目管理工具." },
  columns: [
    { title: "产品", items: [{ label: "议题", href: "#issues" }, { label: "路线图", href: "#roadmap" }, { label: "定价", href: "#pricing" }] },
    { title: "资源", items: [{ label: "文档", href: "#docs" }, { label: "API", href: "#api" }, { label: "状态", href: "#status" }] },
    { title: "公司", items: [{ label: "关于", href: "#about" }, { label: "招聘", href: "#careers" }, { label: "联系", href: "#contact" }] },
  ],
  social: [{ label: "GitHub", href: "https://github.com", icon: "icon-[solar--code-square-linear]", external: true }],
  legal: [{ label: "隐私", href: "#privacy" }, { label: "条款", href: "#terms" }, { label: "DPA", href: "#dpa" }],
  status: { label: "所有系统正常", href: "#status", state: "ok" },
  copyright: "© 2026 Orbit Labs",
  ariaLabels: ARIA,
} satisfies SiteFooterBlockProps;

/** PageComposer 的 blocks 数组: 小 Hero 与 Pricing 同 tone 相邻, 留白自动合并. */
export const PRICING_PAGE: BlockNode[] = [
  { type: "SiteHeader", key: "header", props: PRICING_HEADER },
  { type: "Hero", key: "intro", props: PRICING_HERO },
  { type: "Pricing", key: "plans", props: PRICING_PLANS },
  { type: "ComparisonMatrix", key: "compare", props: PRICING_MATRIX },
  { type: "Faq", key: "faq", props: PRICING_FAQ },
  { type: "CtaBanner", key: "cta", props: PRICING_CTA },
  { type: "SiteFooter", key: "footer", props: PRICING_FOOTER },
];
