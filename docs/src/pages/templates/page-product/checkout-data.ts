/**
 * 多步结账页数据: 顶栏, 步骤与表单字段描述, 配送 / 支付选项, 订单摘要. 全部可 JSON 序列化;
 * 表单节点由 checkout.tsx 按字段描述渲染 (CheckoutSteps 的 content 需要 ReactNode).
 */
import type { CartSummaryProps, SiteHeaderBlockProps } from "@hx/ui";
import { demoImg } from "../page-commerce-home/compose";
import { BRAND } from "../page-commerce-home/site-data";

export interface CheckoutField {
  name: string;
  label: string;
  type?: "text" | "email" | "tel";
  autoComplete?: string;
  placeholder?: string;
  /** 占满一行 (两列栅格里跨两列时用单独一组). */
  wide?: boolean;
}

export interface CheckoutChoice {
  value: string;
  label: string;
  description: string;
}

export interface CheckoutStepMeta {
  key: string;
  title: string;
  description: string;
  nextLabel?: string;
  /** 本步渲染为表单字段. */
  fields?: CheckoutField[];
  /** 本步渲染为单选组. */
  choices?: { legend: string; name: string; defaultValue: string; options: CheckoutChoice[] };
  /** 确认步: 只读回显这些说明. */
  review?: { label: string; value: string }[];
}

/** 结账页顶栏: 只留品牌与回购物车, 不放导航 (减少流失). */
export const CHECKOUT_HEADER: SiteHeaderBlockProps = {
  brand: BRAND,
  sticky: false,
  actions: [{ label: "返回购物车", href: "#cart", variant: "ghost", icon: "icon-[solar--arrow-left-linear]" }],
};

export const CHECKOUT_STEPS: CheckoutStepMeta[] = [
  {
    key: "address",
    title: "收货地址",
    description: "填写收件人信息",
    nextLabel: "继续选择配送",
    fields: [
      { name: "name", label: "收件人", autoComplete: "name", placeholder: "张三" },
      { name: "phone", label: "手机号", type: "tel", autoComplete: "tel", placeholder: "138 0000 0000" },
      { name: "email", label: "邮箱 (接收订单通知)", type: "email", autoComplete: "email", placeholder: "you@mail.test", wide: true },
      { name: "region", label: "省 / 市 / 区", autoComplete: "address-level1", placeholder: "上海市 徐汇区" },
      { name: "postcode", label: "邮编", autoComplete: "postal-code", placeholder: "200030" },
      { name: "street", label: "详细地址", autoComplete: "street-address", placeholder: "街道, 门牌号", wide: true },
    ],
  },
  {
    key: "shipping",
    title: "配送方式",
    description: "选择送达时效",
    nextLabel: "继续支付",
    choices: {
      legend: "配送方式",
      name: "shipping",
      defaultValue: "standard",
      options: [
        { value: "standard", label: "标准配送 · 免运费", description: "3 到 5 个工作日送达" },
        { value: "express", label: "次日达 · ¥20", description: "今日 17:00 前下单, 次日送达" },
        { value: "pickup", label: "门店自提 · 免运费", description: "下单后 2 小时可到店取货" },
      ],
    },
  },
  {
    key: "payment",
    title: "支付方式",
    description: "选择付款渠道",
    nextLabel: "核对订单",
    choices: {
      legend: "支付方式",
      name: "payment",
      defaultValue: "alipay",
      options: [
        { value: "alipay", label: "支付宝", description: "跳转支付宝完成付款" },
        { value: "wechat", label: "微信支付", description: "扫码或在微信内付款" },
        { value: "card", label: "银行卡", description: "支持 Visa, Mastercard, 银联" },
      ],
    },
  },
  {
    key: "review",
    title: "确认订单",
    description: "核对后提交",
    review: [
      { label: "收货地址", value: "张三 · 138 0000 0000 · 上海市徐汇区某路 88 号" },
      { label: "配送方式", value: "标准配送 · 3 到 5 个工作日" },
      { label: "支付方式", value: "支付宝" },
    ],
  },
];

/** 订单摘要: CheckoutSteps 渲染为只读 CartSummary (桌面右栏粘性, 移动端折叠到顶部). */
export const CHECKOUT_SUMMARY: CartSummaryProps = {
  title: "订单摘要",
  readOnly: true,
  lines: [
    {
      id: "air-runner-42",
      media: demoImg("pdp-1", "Air Runner 2 黑色"),
      title: "Air Runner 2",
      href: "#product-air-runner",
      options: ["黑色", "42"],
      qty: 1,
      price: { amount: 899, originalAmount: 1299, currency: "CNY" },
    },
    {
      id: "pace-tee-l",
      media: demoImg("pace-tee", "Pace 速干 T 恤"),
      title: "Pace 速干 T 恤",
      href: "#product-pace-tee",
      options: ["白色", "L"],
      qty: 2,
      price: { amount: 249, currency: "CNY" },
    },
  ],
  totals: [
    { label: "商品小计", value: { amount: 1397, currency: "CNY" } },
    { label: "会员优惠", value: { amount: -100, currency: "CNY" }, kind: "discount" },
    { label: "运费", value: { amount: 0, currency: "CNY" } },
    { label: "应付总额", value: { amount: 1297, currency: "CNY", note: "含税" }, kind: "grand" },
  ],
  checkout: { label: "提交订单", href: "#place-order", variant: "primary", size: "lg" },
  note: "提交即表示同意销售条款与隐私政策.",
};
