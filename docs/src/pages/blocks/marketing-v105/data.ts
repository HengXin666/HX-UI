/**
 * 营销区块 D (转化) 的示例数据. 全部可 JSON 序列化 (无函数, 无节点), 文档页同时把它原样展示为"JSON 数据示例",
 * 便于 Agent / CMS 照抄生成整页 (PageComposer 的 props).
 * 取证: linear.app/pricing 四档定价 + 对比表; vercel.com/pricing 的 details FAQ.
 *
 * .agents/notes/implemented/feature/2026-11-02-marketing-conversion-blocks.md
 */
import type { ComparisonMatrixProps } from "../../../../../src/blocks/marketing/ComparisonMatrix";
import type { FaqProps } from "../../../../../src/blocks/marketing/Faq";
import type { PricingProps } from "../../../../../src/blocks/marketing/Pricing";

export const PRICING_DATA = {
  heading: { eyebrow: "定价", title: "按团队规模选择方案", description: "随时升级或降级, 年付立省两个月." },
  align: "center",
  billing: { options: ["month", "year"], default: "year" },
  plans: [
    {
      key: "free",
      name: "Free",
      kind: "free",
      description: "个人与小团队起步",
      price: { amount: 0, currency: "USD" },
      priceNote: "最多 2 个团队",
      features: ["无限成员", "250 个议题", "Slack 与 GitHub 集成"],
      cta: { label: "免费开始", href: "#signup" },
    },
    {
      key: "basic",
      name: "Basic",
      description: "成长中的团队",
      prices: { month: { amount: 10, currency: "USD", period: "month" }, year: { amount: 100, currency: "USD", period: "year" } },
      priceNote: "按席位计费",
      features: ["Free 的全部内容", "无限议题", { label: "文件上传", included: "单文件 100 MB" }, { label: "管理员角色", included: false }],
      cta: { label: "选择 Basic", href: "#basic" },
    },
    {
      key: "business",
      name: "Business",
      highlight: true,
      badge: "最受欢迎",
      description: "需要洞察与管控的团队",
      prices: { month: { amount: 16, currency: "USD", period: "month" }, year: { amount: 160, currency: "USD", period: "year" } },
      priceNote: "按席位计费",
      features: ["Basic 的全部内容", "私有团队与访客", "数据洞察", { label: "管理员角色", included: true }],
      cta: { label: "选择 Business", href: "#business" },
    },
    {
      key: "enterprise",
      name: "Enterprise",
      kind: "contact",
      description: "规模化与安全合规",
      priceNote: "年度合同, 按量议价",
      features: ["Business 的全部内容", "SAML 与 SCIM", "高级安全与审计日志", "专属客户经理"],
      cta: { label: "联系销售", href: "#sales" },
    },
  ],
  includes: { items: ["99.9% 可用性", "SOC 2 Type II", "数据加密传输与存储", "API 与 Webhook", "移动端应用", "社区支持"] },
} satisfies PricingProps;

export const MATRIX_DATA = {
  heading: { title: "方案对比", description: "左右滑动或打开\"仅显示差异\", 快速看清区别." },
  plans: [
    { key: "free", name: "Free" },
    { key: "basic", name: "Basic" },
    { key: "business", name: "Business" },
    { key: "enterprise", name: "Enterprise" },
  ],
  groups: [
    {
      title: "用量",
      rows: [
        { label: "成员", values: { free: "无限", basic: "无限", business: "无限", enterprise: "无限" } },
        { label: "议题数", tooltip: "所有团队合计", values: { free: 250, basic: "无限", business: "无限", enterprise: "无限" } },
        { label: "文件上传上限 (MB)", values: { free: 10, basic: 100, business: 1000, enterprise: 10000 } },
      ],
    },
    {
      title: "协作",
      rows: [
        { label: "Slack 与 GitHub 集成", values: { free: true, basic: true, business: true, enterprise: true } },
        { label: "私有团队", values: { free: false, basic: false, business: true, enterprise: true } },
        { label: "数据洞察", values: { free: false, basic: false, business: { icon: "icon-[solar--star-bold]", label: "Beta" }, enterprise: true } },
      ],
    },
    {
      title: "安全",
      rows: [
        { label: "SAML 单点登录", values: { free: false, basic: false, business: false, enterprise: true } },
        { label: "审计日志", values: { free: false, basic: false, business: "30 天", enterprise: "无限期" } },
      ],
    },
  ],
} satisfies ComparisonMatrixProps;

export const FAQ_DATA = {
  heading: { eyebrow: "FAQ", title: "常见问题", description: "找不到答案? 直接联系我们." },
  columns: 2,
  searchable: true,
  items: [
    { id: "faq-trial", category: "计费", q: "可以免费试用付费方案吗?", a: "可以. 所有付费方案都有 14 天试用, 无需绑卡." },
    { id: "faq-yearly", category: "计费", q: "年付有什么优惠?", a: "年付相当于按月价付 10 个月, 节省约 17%." },
    { id: "faq-seat", category: "计费", q: "如何计算席位?", a: "按当月活跃成员计费, 访客不计入席位." },
    { id: "faq-downgrade", category: "账户", q: "降级后数据会丢失吗?", a: "不会. 超出新方案额度的内容转为只读, 升级后恢复." },
    { id: "faq-export", category: "账户", q: "可以导出全部数据吗?", a: "可以, 在设置中一键导出 CSV 或通过 API 拉取." },
    { id: "faq-sso", category: "安全", q: "支持 SAML 与 SCIM 吗?", a: "Enterprise 方案支持 SAML 单点登录与 SCIM 用户同步." },
  ],
  contact: { title: "还有问题?", description: "销售与支持团队工作日 24 小时内回复.", cta: { label: "联系我们", href: "#contact", variant: "secondary" } },
} satisfies FaqProps;
