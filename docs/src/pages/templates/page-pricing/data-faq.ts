/**
 * 定价页的 16 项 FAQ (vercel.com/pricing 式: 按类分组, 可搜索, 双栏, 尾部联系 CTA). 纯 JSON.
 */
import type { FaqProps } from "../../../../../src/blocks/marketing/Faq";

export const PRICING_FAQ = {
  heading: { title: "常见问题", description: "关于计费, 方案与安全的一切." },
  columns: 2,
  searchable: true,
  items: [
    { category: "计费", q: "按什么计费?", a: "按工作区内的活跃成员席位计费. 停用的成员与访客不计费." },
    { category: "计费", q: "年付与月付有什么区别?", a: "年付按全年预付, 相当于免费送两个月; 月付可随时取消." },
    { category: "计费", q: "支持哪些付款方式?", a: "支持 Visa, Mastercard, American Express 与银行转账 (Enterprise)." },
    { category: "计费", q: "可以开发票吗?", a: "每次扣款后自动生成发票, 可在账单设置中下载并填写税号." },
    { category: "计费", q: "中途增加成员怎么算?", a: "按剩余天数折算, 在下一个账单周期一并结算." },
    { category: "方案", q: "Free 档有时间限制吗?", a: "没有. Free 档永久免费, 只在成员数与团队数上有上限." },
    { category: "方案", q: "可以随时升级或降级吗?", a: "可以. 升级立即生效; 降级在当前计费周期结束时生效." },
    { category: "方案", q: "有免费试用吗?", a: "Business 档提供 14 天免费试用, 无需绑定信用卡." },
    { category: "方案", q: "教育与开源项目有优惠吗?", a: "符合条件的学校, 非营利组织与开源项目可申请免费的 Business 档." },
    { category: "方案", q: "取消订阅后数据怎么办?", a: "工作区自动降为 Free 档, 数据完整保留; 超出上限的部分转为只读." },
    { category: "安全", q: "数据存储在哪里?", a: "默认存储在美国区域; Enterprise 档可选择欧盟或亚太区域." },
    { category: "安全", q: "通过了哪些合规认证?", a: "SOC 2 Type II, ISO 27001, 并支持签署 GDPR DPA." },
    { category: "安全", q: "支持 SSO 吗?", a: "Enterprise 档支持 SAML SSO 与 SCIM 自动同步成员." },
    { category: "安全", q: "数据会被用来训练 AI 吗?", a: "不会. 你的工作区数据从不用于训练任何模型." },
    { category: "支持", q: "如何联系支持团队?", a: "付费方案可通过邮件与应用内对话联系, 通常 2 小时内回复." },
    { category: "支持", q: "可以协助从其他工具迁移吗?", a: "内置 Jira, Asana 与 GitHub Issues 导入器; Enterprise 档提供专人迁移协助." },
  ],
  contact: { title: "还有其他问题?", description: "销售团队乐意为你定制方案.", cta: { label: "联系销售", href: "#sales", variant: "secondary" } },
} satisfies FaqProps;
