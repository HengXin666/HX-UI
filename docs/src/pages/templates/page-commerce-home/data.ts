/**
 * 电商首页 (nike / apple / shopify 型) 的整页数据: 一个 BlockNode 数组, 可 JSON 序列化, 可直接交给 PageComposer.
 * 不可序列化的回调 (订阅提交) 由页面组件在渲染时注入.
 */
import type {
  CampaignHeroProps,
  CategoryTilesProps,
  NewsletterProps,
  ProductCardData,
  ProductGridProps,
  ProductRailProps,
  PromoStripProps,
  SiteFooterBlockProps,
  SiteHeaderBlockProps,
  StatBandProps,
  TestimonialsProps,
} from "@hx/ui";
import { blockFactory, demoImg } from "./compose";
import { FOOTER, HOME_HEADER } from "./site-data";

/** 首页用到的区块名 -> props 类型 (registry 的键与之一致). */
export interface HomeBlockProps {
  SiteHeader: SiteHeaderBlockProps;
  CampaignHero: CampaignHeroProps;
  CategoryTiles: CategoryTilesProps;
  ProductRail: ProductRailProps;
  PromoStrip: PromoStripProps;
  ProductGrid: ProductGridProps;
  StatBand: StatBandProps;
  Testimonials: TestimonialsProps;
  Newsletter: Omit<NewsletterProps, "onSubmit">;
  SiteFooter: SiteFooterBlockProps;
}

const block = blockFactory<HomeBlockProps>();

const product = (
  id: string,
  title: string,
  subtitle: string,
  amount: number,
  extra: Partial<ProductCardData> = {},
): ProductCardData => ({
  id,
  href: `#product-${id}`,
  title,
  subtitle,
  media: demoImg(id, title),
  price: { amount, currency: "CNY" },
  ...extra,
});

export const TRENDING: ProductCardData[] = [
  product("air-runner", "Air Runner 2", "男子公路跑鞋", 899, {
    price: { amount: 899, originalAmount: 1299, currency: "CNY" },
    hoverMedia: demoImg("air-runner-side", "Air Runner 2 侧面"),
    badges: [{ kind: "discount" }, { kind: "new" }],
    swatches: [
      { value: "black", label: "黑色", color: "var(--foreground)" },
      { value: "white", label: "白色", color: "var(--background)" },
      { value: "sand", label: "沙色", color: "var(--muted)" },
    ],
    rating: { value: 4.6, count: 1284 },
  }),
  product("trail-pro", "Trail Pro GTX", "防水越野跑鞋", 1199, { badges: [{ kind: "low-stock", remaining: 3 }], rating: { value: 4.8, count: 312 } }),
  product("court-zero", "Court Zero", "篮球鞋", 1099, { badges: [{ kind: "new" }], rating: { value: 4.5, count: 207 } }),
  product("pace-tee", "Pace 速干 T 恤", "男子跑步上衣", 249, { rating: { value: 4.4, count: 96 } }),
  product("studio-tight", "Studio 高腰紧身裤", "女子训练", 499, { badges: [{ kind: "limited", label: "限量" }] }),
  product("club-cap", "Club 棒球帽", "配件", 159, { price: { amount: 159, originalAmount: 229, currency: "CNY" }, badges: [{ kind: "sale" }] }),
];

export const GRID: ProductCardData[] = [
  product("vapor-fly", "Vapor Fly 4", "竞速跑鞋", 1699, { badges: [{ kind: "new" }] }),
  product("aero-jacket", "Aero 防风夹克", "男子跑步外套", 799),
  product("flow-bra", "Flow 中强度运动内衣", "女子训练", 329, { rating: { value: 4.7, count: 540 } }),
  product("dri-tee", "Dri-FIT 训练 T 恤", "速干面料", 199, { soldOut: true }),
  product("terra-hike", "Terra 徒步鞋", "户外", 1099),
  product("mini-runner", "Mini Runner", "幼童跑鞋", 399, { badges: [{ kind: "sale" }], price: { amount: 399, originalAmount: 499, currency: "CNY" } }),
  product("fleece-hoodie", "Fleece 连帽卫衣", "生活休闲", 599),
  product("gym-bag", "Gym 训练包 30L", "配件", 349, { rating: { value: 4.3, count: 61 } }),
];

export const HOME_BLOCKS = [
  block("SiteHeader", "header", HOME_HEADER),
  block("CampaignHero", "hero", {
    layout: "overlay",
    width: "bleed",
    pad: "none",
    autoplay: 6000,
    headingLevel: 1,
    slides: [
      {
        media: { ...demoImg("hero-air", "跑者在城市夜色中冲刺"), priority: true, ratio: "21/9" },
        kicker: "新品上市",
        title: "跑得更远, 落地更轻.",
        body: "全新 Air Runner 2, 双层泡棉缓震.",
        ctas: [
          { label: "立即选购", href: "#shop-runner", variant: "primary" },
          { label: "了解科技", href: "#tech", variant: "secondary" },
        ],
      },
      {
        media: { ...demoImg("hero-court", "篮球场上的运动员"), ratio: "21/9" },
        kicker: "Court Zero",
        title: "为最后两分钟而生.",
        ctas: [{ label: "探索系列", href: "#court", variant: "primary" }],
        position: "center",
      },
      {
        media: { ...demoImg("hero-studio", "晨光里的瑜伽训练"), ratio: "21/9" },
        title: "冬季训练季",
        body: "全场训练装备第二件 7 折.",
        ctas: [{ label: "去看看", href: "#training", variant: "primary" }],
        position: "end",
      },
    ],
  }),
  block("CategoryTiles", "categories", {
    heading: { title: "按运动选购" },
    layout: "feature-first",
    items: [
      { title: "跑步", eyebrow: "Road & Trail", href: "#running", media: demoImg("tile-running", "跑步"), ctaLabel: "选购" },
      { title: "篮球", href: "#basketball", media: demoImg("tile-basketball", "篮球"), ctaLabel: "选购" },
      { title: "训练", href: "#training", media: demoImg("tile-training", "训练"), ctaLabel: "选购" },
      { title: "儿童", href: "#kids", media: demoImg("tile-kids", "儿童"), ctaLabel: "选购" },
    ],
  }),
  block("ProductRail", "trending", {
    heading: { eyebrow: "本周热卖", title: "Trending" },
    cta: { label: "查看全部", href: "#trending", variant: "link" },
    products: TRENDING,
    card: { showFavorite: true },
  }),
  block("PromoStrip", "promo", {
    promoTone: "inverted",
    rotate: 5000,
    items: [
      { text: "双 11 全场低至 7 折", href: "#sale", linkLabel: "去抢购", endsAt: "2026-11-11T23:59:59+08:00", icon: "icon-[solar--tag-price-linear]" },
      { text: "满 ¥399 免运费", href: "#shipping", linkLabel: "配送说明", icon: "icon-[solar--delivery-linear]" },
      { text: "30 天无理由退货", href: "#returns", linkLabel: "退货政策", icon: "icon-[solar--refresh-linear]" },
    ],
  }),
  block("ProductGrid", "shop", {
    heading: {
      eyebrow: "全部商品",
      title: "为冬季训练选好装备",
      actions: [
        { label: "全部", href: "#shop", variant: "secondary" },
        { label: "鞋类", href: "#shop-shoes", variant: "ghost" },
        { label: "服装", href: "#shop-apparel", variant: "ghost" },
        { label: "配件", href: "#shop-gear", variant: "ghost" },
      ],
    },
    cols: 4,
    products: GRID,
    card: { showFavorite: true },
    empty: { text: "没有符合条件的商品", hint: "换个分类试试" },
  }),
  block("StatBand", "stats", {
    tone: "muted",
    items: [
      { value: 1200, suffix: "+", label: "线下门店" },
      { value: 30, suffix: " 天", label: "无理由退货" },
      { value: 4.8, label: "平均评分", format: { maximumFractionDigits: 1 } },
      { value: 24, suffix: " 小时", label: "主要城市送达" },
    ],
  }),
  block("Testimonials", "reviews", {
    heading: { title: "跑者怎么说" },
    variant: "carousel",
    items: [
      { quote: "Air Runner 2 陪我跑完了上海马拉松, 后半程腿还是轻的.", rating: 5, person: { name: "林一", role: "业余马拉松跑者" } },
      { quote: "尺码很准, 第二天就送到了. 退换一件卫衣也很顺.", rating: 5, person: { name: "Chen W.", role: "会员 3 年" } },
      { quote: "Trail Pro 下雨天的山路抓地很稳, 防水确实有效.", rating: 4, person: { name: "阿杰", role: "越野爱好者" } },
      { quote: "给孩子买的 Mini Runner, 魔术贴自己就能穿, 很省心.", rating: 5, person: { name: "周女士", role: "家长" } },
    ],
  }),
  block("Newsletter", "newsletter", {
    tone: "muted",
    title: "第一时间收到新品与会员特惠",
    lead: "每周一封, 随时可退订.",
    placeholder: "you@example.com",
    emailLabel: "邮箱地址",
    submitLabel: "订阅",
    successMessage: "订阅成功, 欢迎加入.",
    errorMessage: "订阅失败, 请稍后再试.",
    invalidMessage: "请输入有效的邮箱地址.",
    consent: "订阅即表示同意隐私政策.",
  }),
  block("SiteFooter", "footer", FOOTER),
];
