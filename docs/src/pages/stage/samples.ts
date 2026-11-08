import type { ComparisonMatrixProps, FaqProps, FeatureAlternatingProps, ProductDetailProps, SiteFooterBlockProps, SiteHeaderBlockProps } from "@hx/ui";
import { section, type DefaultSections, type SectionOf } from "../../../../src/page";
import { PRODUCT_BLOCKS } from "../templates/page-product/data";

/** 一周订单 (千单). 画廊的柱状图与 #/viz 的柱状舞台共用. */
export const WEEK = [
  { id: "mon", label: "周一", value: 42 },
  { id: "tue", label: "周二", value: 58 },
  { id: "wed", label: "周三", value: 51 },
  { id: "thu", label: "周四", value: 66 },
  { id: "fri", label: "周五", value: 73 },
] as const;

/** 越过坐标轴的尖峰值, 与趋势线的起始序列. */
export const SPIKE = 180;
export const SEED: readonly number[] = [31, 34, 33, 38, 41, 40, 46];

export const STEP = { order: "order", pay: "pay", risk: "risk", pick: "pick", ship: "ship", sign: "sign" } as const;

export const FLOW_NODES = [
  { id: STEP.order, label: "下单", detail: "用户提交订单, 库存先锁 15 分钟." },
  { id: STEP.pay, label: "支付", detail: "第三方支付回调, 失败自动重试三次." },
  { id: STEP.risk, label: "风控", detail: "与支付并行, 命中规则的订单转人工." },
  { id: STEP.pick, label: "拣货", detail: "仓内按波次拣货, 平均 22 分钟." },
  { id: STEP.ship, label: "发货", detail: "交给承运商, 生成物流单号." },
  { id: STEP.sign, label: "签收", detail: "签收后 7 天进入可结算." },
] as const;

export const FLOW_EDGES = [
  { from: STEP.order, to: STEP.pay },
  { from: STEP.order, to: STEP.risk },
  { from: STEP.pay, to: STEP.pick },
  { from: STEP.risk, to: STEP.pick },
  { from: STEP.pick, to: STEP.ship },
  { from: STEP.ship, to: STEP.sign },
] as const;

export const FUNNEL = [
  { id: "visit", label: "访问商品页", value: 48210 },
  { id: "cart", label: "加入购物车", value: 9630 },
  { id: "checkout", label: "进入结账", value: 4120 },
  { id: "paid", label: "支付成功", value: 3388 },
] as const;

export const ROADMAP = [
  { id: "alpha", when: "2026 Q1", title: "内测", detail: "二十家种子客户.", status: "done" as const },
  { id: "beta", when: "2026 Q2", title: "公测", detail: "开放注册, 免费额度.", status: "done" as const },
  { id: "ga", when: "2026 Q4", title: "正式版", detail: "SLA 与企业合同.", status: "active" as const },
  { id: "intl", when: "2027 Q2", title: "海外区", detail: "新加坡与法兰克福节点.", status: "next" as const },
];

/** 环形进度的两块: 画廊并排放, #/viz 的 RingRow 用它们打头. */
export const RINGS = [
  { value: 72, label: "季度目标" },
  { value: 38, label: "库存周转" },
] as const;

/** 整页描述里的区块键. 商品页模板的区块按 key 取, 可视化区块用自己的 key. */
export const PAGE_KEY = {
  header: "header",
  detail: "detail",
  features: "features",
  materials: "materials",
  delivery: "delivery",
  compare: "compare",
  faq: "faq",
  footer: "footer",
} as const;

export type PageKey = (typeof PAGE_KEY)[keyof typeof PAGE_KEY];

/** 商品页模板的同一份区块数据, 按 key 取出后改写成页面描述. */
export function productProps<P>(key: string): P {
  return PRODUCT_BLOCKS.find((node) => node.key === key)?.props as unknown as P;
}

export const MATERIALS_EYEBROW = "材料";
export const MATERIALS_TITLE = "每双鞋里有多少回收料";
export const MATERIALS_ITEMS = [
  { value: 62, label: "鞋面再生纱线" },
  { value: 35, label: "中底生物基" },
  { value: 20, label: "外底回收橡胶" },
  { value: 100, label: "包装再生纸" },
];

export const DELIVERY = {
  heading: { eyebrow: "配送", title: "从下单到签收" },
  label: "履约流程",
  nodes: [
    { id: STEP.order, label: "下单", detail: "库存锁定 15 分钟, 尺码售罄会立即提示." },
    { id: STEP.pay, label: "支付", detail: "支持分期, 失败自动重试三次." },
    { id: STEP.pick, label: "仓内拣货", detail: "最近的前置仓, 平均 22 分钟出库." },
    { id: STEP.ship, label: "顺丰发货", detail: "一线城市次日达." },
    { id: STEP.sign, label: "签收", detail: "30 天无理由退换." },
  ],
  edges: [
    { from: STEP.order, to: STEP.pay },
    { from: STEP.pay, to: STEP.pick },
    { from: STEP.pick, to: STEP.ship },
    { from: STEP.ship, to: STEP.sign },
  ],
};

/** 默认顺序的整页区块. title 是材料区块的标题, 舞台的道具台会改它. */
export function pageSections(title: string): Record<PageKey, SectionOf<DefaultSections>> {
  return {
    header: { type: PAGE_KEY.header, key: PAGE_KEY.header, props: productProps<SiteHeaderBlockProps>(PAGE_KEY.header) },
    detail: { type: "product", key: PAGE_KEY.detail, props: productProps<ProductDetailProps>(PAGE_KEY.detail) },
    features: { type: "alternating", key: PAGE_KEY.features, props: productProps<FeatureAlternatingProps>(PAGE_KEY.features) },
    materials: section("rings", { heading: { eyebrow: MATERIALS_EYEBROW, title }, items: MATERIALS_ITEMS }, PAGE_KEY.materials),
    delivery: section("flow", DELIVERY, PAGE_KEY.delivery),
    compare: { type: "matrix", key: PAGE_KEY.compare, props: productProps<ComparisonMatrixProps>(PAGE_KEY.compare) },
    faq: { type: PAGE_KEY.faq, key: PAGE_KEY.faq, props: productProps<FaqProps>(PAGE_KEY.faq) },
    footer: { type: PAGE_KEY.footer, key: PAGE_KEY.footer, props: productProps<SiteFooterBlockProps>(PAGE_KEY.footer) },
  };
}

export const PAGE_ORDER: readonly PageKey[] = Object.values(PAGE_KEY);
