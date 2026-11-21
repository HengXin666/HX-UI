/**
 * SaaS 模板 (src/page/saas.ts) 的常量: 拍的 id, 每拍的镜头偏好, 默认文案, 以及示例产品 "Tally" 的数据表.
 */

/**
 * SaaS 模板七拍的 id, 也是页内锚点.
 * .agents/notes/implemented/architecture/2026-11-20-saas-benchmark.md
 */
export const SAAS_BEAT = {
  open: "open",
  tour: "tour",
  features: "features",
  metrics: "metrics",
  pricing: "pricing",
  proof: "proof",
  cta: "cta",
} as const;

/** 每拍的镜头偏好: 取第一个在方向白名单里的; 都不在时取白名单第一张. */
export const SAAS_SHOT_PREFERENCE = {
  open: ["textAsMask", "letterspaceMaterialize", "crashZoomPunch"],
  tour: ["cursorFlyover", "scanlineAnnotate", "craneRiseReveal"],
  features: ["deckDeal", "cardFlipReveal", "strokeSegmentBuild"],
  metrics: ["segmentedThumb", "scanlineAnnotate", "strokeSegmentBuild"],
  pricing: ["craneRiseReveal", "segmentedThumb", "spotlightHeroCard"],
  proof: ["cardFlipReveal", "scanlineAnnotate", "deckDeal"],
  cta: ["crashZoomPunch", "letterspaceMaterialize", "spotlightHeroCard"],
} as const;

export const SAAS_TEXT = {
  openLead: "一句话说清产品替谁省掉了什么",
  tourLead: "光标在真实界面上走一遍主流程",
  featuresLead: "三件只有它做得到的事",
  metricsLead: "上线后的实测数字",
  pricingLead: "拖人数看每月多少钱, 再逐项比档位",
  proofLead: "谁在用, 数据放在哪",
  ctaLead: "现在开始, 不用信用卡",
  pricing: "定价",
  calculator: "按团队人数估算",
  matrix: "逐项对比",
  proof: "客户怎么说",
  security: "安全与合规",
  features: "能做什么",
  metrics: "实测",
  feature: "功能",
} as const;

/** SaaS 的 JSON-LD 默认分类与平台. */
export const SAAS_LD = { category: "BusinessApplication", os: "Web" } as const;

/** 示例产品: 一个团队对账工具. 数字故意不取整, 取整的指标读起来像编的. */
export const SAAS_FIXTURE = {
  name: "Tally",
  url: "https://tally.example.com",
  currency: "CNY",
  title: "月底对账, 从三天缩到一个下午",
  lead: "Tally 把银行流水, 发票和报销单自动配对, 对不上的那几笔单独拎出来给你看.",
  ctaStart: "免费试用 14 天",
  ctaDemo: "预约演示",
  stops: [
    { target: "import", title: "导入流水", body: "拖进三家银行的对账单, 格式自动识别" },
    { target: "match", title: "自动配对", body: "按金额, 日期和对方户名三路匹配" },
    { target: "diff", title: "只看对不上的", body: "差额与疑似原因并排列出" },
    { target: "close", title: "一键结账", body: "生成凭证并锁定本期" },
  ],
  features: [
    { title: "三路匹配", body: "金额, 日期, 对方户名同时比对, 跨月的分期也能认出来." },
    { title: "差额解释", body: "每一笔对不上的都附上最可能的原因: 手续费, 汇差或漏录." },
    { title: "审计留痕", body: "谁在什么时候改了哪一笔, 整期锁定后不可再改." },
  ],
  metrics: [
    { value: 87.4, suffix: "%", label: "流水自动配对率" },
    { value: 3.2, suffix: " 小时", label: "月结平均耗时" },
    { value: 1263, label: "在用财务团队" },
  ],
  plans: [
    { key: "starter", name: "起步", perSeat: 39, minSeats: 3, maxSeats: 10, yearDiscount: 0.2 },
    { key: "team", name: "团队", perSeat: 69, base: 199, minSeats: 5, maxSeats: 100, yearDiscount: 0.2 },
    { key: "scale", name: "规模", perSeat: 49, base: 2990, minSeats: 50, yearDiscount: 0.15 },
  ],
  planFeatures: {
    starter: ["3 个银行账户", "每月 2,000 笔流水", "邮件支持"],
    team: ["20 个银行账户", "每月 50,000 笔流水", "审批流", "工作日 4 小时响应"],
    scale: ["不限账户", "不限流水", "单点登录 (SAML)", "专属客户成功经理"],
  },
  matrix: [
    { title: "对账", rows: [
      { label: "银行账户数", values: { starter: "3", team: "20", scale: "不限" } },
      { label: "三路匹配", values: { starter: true, team: true, scale: true } },
      { label: "跨月分期识别", values: { starter: false, team: true, scale: true } },
    ] },
    { title: "管控", rows: [
      { label: "审批流", values: { starter: false, team: true, scale: true } },
      { label: "单点登录 (SAML)", values: { starter: false, team: false, scale: true } },
      { label: "审计日志保留", values: { starter: "90 天", team: "1 年", scale: "7 年" } },
    ] },
  ],
  testimonials: [
    { quote: "以前月底三个人对两天半, 现在一个人下午就关账了, 剩下的时间拿来做分析.", name: "周宁", role: "财务经理", company: "栖木家居" },
    { quote: "差额解释最有用. 审计来问的那几笔, 原因早就挂在流水旁边了.", name: "Maya Lindqvist", role: "Controller", company: "Northfold" },
    { quote: "试用第二周就把三家银行都接上了, 没找过技术支持.", name: "陈柏言", role: "会计主管", company: "回声咖啡" },
  ],
  security: [
    { title: "数据驻留", body: "数据存放在你选的地域, 默认华东." },
    { title: "传输与存储加密", body: "TLS 1.3 传输, AES-256 落盘, 密钥按租户隔离." },
    { title: "合规", body: "已通过 SOC 2 Type II 与等保三级测评." },
  ],
  rating: { value: 4.7, count: 382 },
} as const;
