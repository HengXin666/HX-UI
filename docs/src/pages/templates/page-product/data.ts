/**
 * 商品详情页 (apple / nike 产品页型) 的整页数据: BlockNode 数组, 可 JSON 序列化, 直接交给 PageComposer.
 * 结账页数据在同目录 checkout-data.ts.
 */
import type {
  ComparisonMatrixProps,
  FaqProps,
  FeatureAlternatingProps,
  ProductDetailProps,
  ProductRailProps,
  SiteFooterBlockProps,
  SiteHeaderBlockProps,
  TestimonialsProps,
} from "@hx/ui";
import { blockFactory, demoImg } from "../page-commerce-home/compose";
import { TRENDING } from "../page-commerce-home/data";
import { BRAND, FOOTER, HEADER_ACTIONS, NAV } from "../page-commerce-home/site-data";

/** 商品页用到的区块名 -> props 类型 (registry 的键与之一致). */
export interface ProductBlockProps {
  SiteHeader: SiteHeaderBlockProps;
  ProductDetail: ProductDetailProps;
  FeatureAlternating: FeatureAlternatingProps;
  ComparisonMatrix: ComparisonMatrixProps;
  ProductRail: ProductRailProps;
  Testimonials: TestimonialsProps;
  Faq: FaqProps;
  SiteFooter: SiteFooterBlockProps;
}

const block = blockFactory<ProductBlockProps>();

const SIZES = ["38", "39", "40", "41", "42", "43", "44", "45"];
const SOLD_OUT = new Set(["38", "45"]);

export const PRODUCT_BLOCKS = [
  block("SiteHeader", "header", {
    brand: BRAND,
    nav: NAV,
    actions: HEADER_ACTIONS,
    sticky: true,
    transparent: true,
    localNav: [
      { label: "概览", href: "#detail", current: true },
      { label: "科技", href: "#features" },
      { label: "对比", href: "#compare" },
      { label: "评价", href: "#reviews" },
    ],
  }),
  block("ProductDetail", "detail", {
    headingLevel: 1,
    eyebrow: "新品 · 公路跑鞋",
    title: "Air Runner 2",
    subtitle: "男子公路跑鞋",
    price: { amount: 899, originalAmount: 1299, currency: "CNY", note: "含税" },
    rating: { value: 4.6, count: 1284, href: "#reviews" },
    gallery: [
      { ...demoImg("pdp-1", "Air Runner 2 黑色侧面"), priority: true, ratio: "1/1" },
      { ...demoImg("pdp-2", "Air Runner 2 鞋底"), ratio: "1/1" },
      { ...demoImg("pdp-3", "Air Runner 2 鞋面细节"), ratio: "1/1" },
      { ...demoImg("pdp-4", "Air Runner 2 上脚"), ratio: "1/1" },
    ],
    options: [
      {
        name: "颜色",
        type: "swatch",
        values: [
          { value: "black", label: "黑色", color: "var(--foreground)" },
          { value: "white", label: "白色", color: "var(--background)", media: demoImg("pdp-white", "Air Runner 2 白色") },
          { value: "sand", label: "沙色", color: "var(--muted)", media: demoImg("pdp-sand", "Air Runner 2 沙色") },
        ],
      },
      {
        name: "尺码",
        type: "size",
        aside: "尺码指南",
        values: SIZES.map((s) => ({ value: s, label: s, stock: SOLD_OUT.has(s) ? 0 : 10 })),
      },
    ],
    defaultSelection: { 颜色: "black" },
    showQuantity: true,
    maxQuantity: 5,
    stock: { quantity: 6 },
    ctas: [
      { label: "加入购物车", href: "#cart", variant: "primary", size: "lg" },
      { label: "收藏", href: "#favorites", variant: "secondary", size: "lg", icon: "icon-[solar--heart-linear]" },
    ],
    details: [
      { title: "商品详情", body: "双层泡棉中底, 工程网眼鞋面, 后跟 TPU 稳定片. 适合日常训练与半马.", open: true },
      { title: "配送与退货", body: "满 ¥399 免运费, 主要城市 24 小时送达; 30 天内未穿着可无理由退货." },
      { title: "养护说明", body: "冷水手洗, 阴凉处自然晾干, 避免机洗与暴晒." },
    ],
  }),
  block("FeatureAlternating", "features", {
    heading: { eyebrow: "科技", title: "每一步, 都更省力" },
    items: [
      {
        eyebrow: "缓震",
        title: "双层泡棉中底",
        body: "上层柔软吸收冲击, 下层回弹推进, 长距离也不塌.",
        bullets: ["能量回馈提升 12%", "中底重量减轻 18 g"],
        media: demoImg("feat-foam", "中底剖面"),
      },
      {
        eyebrow: "包裹",
        title: "工程网眼鞋面",
        body: "按足部受力分区编织, 前掌透气, 中足支撑.",
        media: demoImg("feat-upper", "鞋面编织细节"),
      },
      {
        eyebrow: "抓地",
        title: "全掌橡胶外底",
        body: "人字纹在湿滑路面依然稳定, 耐磨里程约 800 km.",
        ctas: [{ label: "了解外底科技", href: "#outsole", variant: "link", icon: "icon-[solar--arrow-right-linear]", iconEnd: true }],
        media: demoImg("feat-outsole", "外底纹路"),
      },
    ],
  }),
  block("ComparisonMatrix", "compare", {
    tone: "muted",
    heading: { title: "选一双适合你的", description: "同系列三款跑鞋的规格对比." },
    featureLabel: "规格",
    plans: [
      { key: "runner", name: "Air Runner 2", description: "¥899" },
      { key: "vapor", name: "Vapor Fly 4", description: "¥1,699" },
      { key: "pace", name: "Pace Lite", description: "¥599" },
    ],
    groups: [
      {
        title: "性能",
        rows: [
          { label: "定位", values: { runner: "日常训练", vapor: "竞速", pace: "入门" } },
          { label: "重量 (42 码)", values: { runner: "268 g", vapor: "198 g", pace: "245 g" } },
          { label: "前后掌落差", values: { runner: "10 mm", vapor: "8 mm", pace: "10 mm" } },
          { label: "碳板", values: { runner: false, vapor: true, pace: false } },
        ],
      },
      {
        title: "适用",
        rows: [
          { label: "全马", values: { runner: true, vapor: true, pace: false } },
          { label: "宽楦可选", values: { runner: true, vapor: false, pace: true } },
        ],
      },
    ],
  }),
  block("ProductRail", "related", {
    heading: { title: "你可能还喜欢" },
    cta: { label: "查看全部跑步", href: "#running", variant: "link" },
    products: TRENDING.filter((p) => p.id !== "air-runner"),
    card: { showFavorite: true },
  }),
  block("Testimonials", "reviews", {
    heading: { eyebrow: "4.6 / 5 · 1,284 条评价", title: "买家评价" },
    variant: "cards",
    columns: 3,
    items: [
      { quote: "缓震很足, 跑 15 公里膝盖没有压力. 尺码正常, 建议按平时穿.", rating: 5, person: { name: "林一", role: "已购 42 码 · 黑色" } },
      { quote: "鞋面透气, 夏天也不闷. 就是白色款有点容易脏.", rating: 4, person: { name: "Mia", role: "已购 38 码 · 白色" } },
      { quote: "第二双了, 日常训练主力. 外底耐磨, 跑了 500 公里还有纹路.", rating: 5, person: { name: "老周", role: "已购 43 码 · 沙色" } },
    ],
  }),
  block("Faq", "faq", {
    heading: { title: "常见问题" },
    columns: 2,
    items: [
      { q: "尺码偏大还是偏小?", a: "尺码正常, 按平时运动鞋尺码选择即可; 脚背较高建议大半码." },
      { q: "多久可以发货?", a: "下单后 24 小时内发货, 主要城市次日送达." },
      { q: "可以退换吗?", a: "30 天内未穿着, 吊牌完整可无理由退换, 退货运费由我们承担." },
      { q: "适合跑全马吗?", a: "适合. 它的缓震面向长距离训练; 追求成绩可以看 Vapor Fly 4." },
    ],
    contact: { title: "还有问题?", description: "客服 9:00 至 22:00 在线.", cta: { label: "联系客服", href: "#contact" } },
  }),
  block("SiteFooter", "footer", FOOTER),
];
