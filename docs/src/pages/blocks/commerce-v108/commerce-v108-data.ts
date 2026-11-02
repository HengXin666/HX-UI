/**
 * V1-08 电商交易与搜索区块的 JSON 数据示例. 全部是可 JSON 序列化的纯数据 (PageComposer / CMS 直接可用);
 * 文档页渲染时用 withDemoMedia 把示例图地址换成 canvas 现画的图, 不请求任何外部地址.
 */
import type { CartLineData, CartTotalData } from "../../../../../src/blocks/commerce/CartSummary";
import type { ProductDetailData } from "../../../../../src/blocks/commerce/ProductDetail";
import type { SearchFilter, SearchSortSpec } from "../../../../../src/blocks/commerce/SearchResults";
import type { ProductCardData } from "../../../../../src/blocks/commerce/ProductCard";

const CDN = "https://cdn.example.com/";
const img = (name: string, alt: string) => ({ src: `${CDN}${name}.jpg`, srcSet: `${CDN}${name}-640.jpg 640w, ${CDN}${name}-1280.jpg 1280w`, alt });

/** 示例图的标签 (顺序即 useDemoImages 的下标). */
export const DEMO_IMAGE_KEYS = ["pd-front", "pd-side", "pd-sole", "pd-back", "pd-white", "pd-detail", "tee", "cap"] as const;

export const DETAIL: ProductDetailData = {
  gallery: [img("pd-front", "Air Runner 2 正面"), img("pd-side", "Air Runner 2 侧面"), img("pd-sole", "鞋底纹路"), img("pd-back", "后跟"), img("pd-detail", "鞋面细节")],
  eyebrow: "男子公路跑鞋",
  title: "Air Runner 2",
  price: { amount: 899, originalAmount: 1299, currency: "CNY", note: "含税, 满 ¥399 免运费" },
  rating: { value: 4.6, count: 1284, href: "#reviews" },
  options: [
    {
      name: "颜色",
      type: "swatch",
      values: [
        { value: "black", label: "黑色", color: "var(--foreground)" },
        { value: "white", label: "白色", color: "var(--background)", media: img("pd-white", "白色款正面") },
        { value: "sand", label: "沙色", color: "var(--muted)", disabled: true },
      ],
    },
    {
      name: "尺码",
      type: "size",
      aside: "尺码指南",
      values: [
        { value: "40", label: "40", stock: 12 },
        { value: "41", label: "41", stock: 3 },
        { value: "42", label: "42", stock: 0 },
        { value: "43", label: "43", stock: 20 },
        { value: "44", label: "44", stock: 8 },
      ],
    },
    { name: "鞋垫", type: "select", values: [{ value: "std", label: "标准" }, { value: "wide", label: "宽版" }] },
  ],
  stock: { quantity: 3 },
  ctas: [
    { label: "加入购物袋", variant: "primary", size: "lg" },
    { label: "收藏", variant: "secondary", size: "lg", icon: "icon-[solar--heart-linear]" },
  ],
  details: [
    { title: "商品描述", body: "轻量网面鞋面与全掌回弹中底, 适合日常 5 到 21 公里训练.", open: true },
    { title: "配送与退货", body: "下单后 48 小时内发货, 30 天无理由退货." },
    { title: "评价 (1,284)", body: "4.6 分. 鞋码偏标准, 宽脚建议选宽版鞋垫." },
  ],
};

export const CART_LINES: CartLineData[] = [
  { id: "air-runner-42", media: img("pd-front", "Air Runner 2 黑色"), title: "Air Runner 2", href: "#air-runner", options: ["黑色", "42"], qty: 1, price: { amount: 899, originalAmount: 1299, currency: "CNY" } },
  { id: "tee-m", media: img("tee", "训练 T 恤"), title: "Dri-FIT 训练 T 恤", options: ["白色", "M"], qty: 2, maxQty: 5, price: { amount: 199, currency: "CNY" } },
  { id: "cap", media: img("cap", "运动帽"), title: "Club 运动帽", qty: 1, price: { amount: 149, currency: "CNY" } },
];

export const CART_TOTALS: CartTotalData[] = [
  { label: "小计", value: { amount: 1446, currency: "CNY" } },
  { label: "优惠", value: { amount: -100, currency: "CNY" }, kind: "discount" },
  { label: "运费", value: { amount: 0, currency: "CNY" } },
  { label: "总计", value: { amount: 1346, currency: "CNY" }, kind: "grand" },
];

export const CHECKOUT = { label: "去结算", href: "#checkout", variant: "primary" } as const;

export const STEP_KEYS = [
  { key: "address", title: "收货地址" },
  { key: "shipping", title: "配送方式" },
  { key: "payment", title: "支付" },
] as const;

export const FILTERS: SearchFilter[] = [
  { key: "category", title: "品类", options: [{ value: "running", label: "跑鞋", count: 128 }, { value: "trail", label: "越野", count: 42 }, { value: "apparel", label: "服装", count: 96 }] },
  { key: "size", title: "尺码", options: ["40", "41", "42", "43", "44"].map((s) => ({ value: s, label: s })) },
  { key: "price", title: "价格", multiple: false, options: [{ value: "lt500", label: "¥500 以下" }, { value: "500-1000", label: "¥500 到 ¥1,000" }, { value: "gt1000", label: "¥1,000 以上" }] },
];

export const SORT: SearchSortSpec = {
  options: [{ value: "relevance", label: "相关度" }, { value: "newest", label: "最新" }, { value: "price-asc", label: "价格从低到高" }, { value: "price-desc", label: "价格从高到低" }],
};

export const RESULTS: ProductCardData[] = [
  { id: "r1", href: "#r1", title: "Air Runner 2", subtitle: "男子公路跑鞋", media: img("pd-front", "Air Runner 2"), price: { amount: 899, originalAmount: 1299, currency: "CNY" }, rating: { value: 4.6, count: 1284 } },
  { id: "r2", href: "#r2", title: "Air Runner 2 白色", subtitle: "男子公路跑鞋", media: img("pd-white", "白色款"), price: { amount: 899, currency: "CNY" } },
  { id: "r3", href: "#r3", title: "Dri-FIT 训练 T 恤", subtitle: "速干面料", media: img("tee", "训练 T 恤"), price: { amount: 199, currency: "CNY" } },
  { id: "r4", href: "#r4", title: "Club 运动帽", media: img("cap", "运动帽"), price: { amount: 149, currency: "CNY" } },
];

/** 把 JSON 里的示例图地址按 DEMO_IMAGE_KEYS 换成现画的图 (保持数据结构不变). */
export function withDemoMedia<T>(data: T, images: ReadonlyArray<{ src: string; srcSet: string; placeholder: string }>): T {
  if (images.length === 0) return data;
  const walk = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(walk);
    if (!value || typeof value !== "object") return value;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = walk(v);
    if (typeof out.src === "string" && out.src.startsWith(CDN)) {
      const key = out.src.slice(CDN.length).replace(/\.jpg$/, "");
      const image = images[DEMO_IMAGE_KEYS.indexOf(key as (typeof DEMO_IMAGE_KEYS)[number])];
      if (image) Object.assign(out, { src: image.src, srcSet: image.srcSet, placeholder: image.placeholder });
    }
    return out;
  };
  return walk(data) as T;
}

/** 给代码标签页显示的 JSON. */
export const json = (value: unknown): string => JSON.stringify(value, null, 2);
