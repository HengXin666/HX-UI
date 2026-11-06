/**
 * V1-07 电商浏览区块的 JSON 数据示例. 全部是可 JSON 序列化的纯数据 (PageComposer / CMS 直接可用);
 * 文档页渲染时用 withDemoMedia 把示例图地址换成 canvas 现画的图, 不请求任何外部地址.
 *
 * .agents/notes/implemented/feature/2026-11-02-commerce-browse-blocks.md
 */
import type { CampaignSlideData } from "../../../../../src/blocks/commerce/CampaignHero";
import type { CategoryTileData } from "../../../../../src/blocks/commerce/CategoryTiles";
import type { ProductCardData } from "../../../../../src/blocks/commerce/ProductCard";
import type { PromoStripItemData } from "../../../../../src/blocks/commerce/PromoStrip";

const CDN = "https://cdn.example.com/";
const img = (name: string, alt: string) => ({ src: `${CDN}${name}.jpg`, srcSet: `${CDN}${name}-640.jpg 640w, ${CDN}${name}-1280.jpg 1280w`, alt });

/** 示例图的标签 (顺序即 useDemoImages 的下标). */
export const DEMO_IMAGE_KEYS = [
  "runner-black", "runner-black-side", "runner-white", "runner-sand", "trail", "trail-side", "tee", "cap",
  "tile-football", "tile-running", "tile-training", "tile-kids", "hero-air", "hero-court", "hero-split",
] as const;

export const PRODUCTS: ProductCardData[] = [
  {
    id: "air-runner",
    href: "#air-runner",
    title: "Air Runner 2",
    subtitle: "男子公路跑鞋",
    media: img("runner-black", "黑色 Air Runner 2 侧面"),
    hoverMedia: img("runner-black-side", "黑色 Air Runner 2 鞋底"),
    price: { amount: 899, originalAmount: 1299, currency: "CNY" },
    badges: [{ kind: "discount" }, { kind: "new" }],
    swatches: [
      { value: "black", label: "黑色", color: "var(--foreground)", media: img("runner-black", "黑色款") },
      { value: "white", label: "白色", color: "var(--background)", media: img("runner-white", "白色款") },
      { value: "sand", label: "沙色", color: "var(--muted)", media: img("runner-sand", "沙色款") },
    ],
    rating: { value: 4.6, count: 1284 },
  },
  {
    id: "trail-pro",
    href: "#trail-pro",
    title: "Trail Pro GTX",
    subtitle: "防水越野跑鞋",
    media: img("trail", "Trail Pro GTX"),
    hoverMedia: img("trail-side", "Trail Pro GTX 侧面"),
    price: { amount: 1199, currency: "CNY" },
    badges: [{ kind: "low-stock", remaining: 3 }],
    rating: { value: 4.8, count: 312 },
  },
  {
    id: "dri-tee",
    href: "#dri-tee",
    title: "Dri-FIT 训练 T 恤",
    subtitle: "速干面料",
    media: img("tee", "训练 T 恤"),
    price: { amount: 199, currency: "CNY" },
    soldOut: true,
  },
  {
    id: "club-cap",
    href: "#club-cap",
    title: "Club 棒球帽",
    media: img("cap", "棒球帽"),
    price: { amount: 159, originalAmount: 229, currency: "CNY" },
    badges: [{ kind: "sale" }],
    rating: { value: 4.2, count: 86 },
  },
];

export const TILES: CategoryTileData[] = [
  { title: "足球", eyebrow: "Phantom", href: "#football", media: img("tile-football", "足球鞋"), ctaLabel: "选购" },
  { title: "跑步", href: "#running", media: img("tile-running", "跑步"), ctaLabel: "选购" },
  { title: "训练", href: "#training", media: img("tile-training", "训练"), ctaLabel: "选购" },
];

export const SLIDES: CampaignSlideData[] = [
  {
    media: img("hero-air", "跑者在城市夜色中冲刺"),
    kicker: "新品上市",
    title: "Get used to it.",
    body: "全新 Air Runner 2, 更轻的缓震.",
    ctas: [{ label: "立即选购", href: "#shop", variant: "primary" }],
  },
  {
    media: img("hero-court", "篮球场上的运动员"),
    title: "Driven by legacy",
    ctas: [{ label: "探索系列", href: "#legacy", variant: "secondary" }],
    position: "center",
  },
];

export const SPLIT_SLIDE: CampaignSlideData[] = [
  {
    media: img("hero-split", "两款手机并排"),
    kicker: "限时以旧换新",
    title: "iPhone",
    body: "最高可抵 ¥4,800, 以页面实时报价为准.",
    ctas: [{ label: "购买", href: "#buy" }, { label: "进一步了解", href: "#learn", variant: "link", icon: "icon-[solar--arrow-right-linear]", iconEnd: true }],
    dark: false,
  },
];

/** 倒计时截止: 文档页加载时起算 2 天后, 让演示一直有效. */
export const promoItems = (now: number): PromoStripItemData[] => [
  { text: "双 11 全场 8 折", href: "#sale", linkLabel: "去看看", endsAt: now + 2 * 24 * 3600 * 1000 },
  { text: "满 ¥399 免运费, 30 天无理由退货", href: "#shipping", linkLabel: "了解详情" },
];

/** 把 JSON 里的示例图地址按 DEMO_IMAGE_KEYS 换成现画的图 (保持数据结构不变). */
export function withDemoMedia<T>(data: T, images: ReadonlyArray<{ src: string; srcSet: string; placeholder: string }>): T {
  if (images.length === 0) return data;
  const walk = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(walk);
    if (value && typeof value === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) out[k] = walk(v);
      if (typeof out.src === "string" && out.src.startsWith(CDN)) {
        const key = out.src.slice(CDN.length).replace(/\.jpg$/, "");
        const image = images[DEMO_IMAGE_KEYS.indexOf(key as (typeof DEMO_IMAGE_KEYS)[number])];
        if (image) Object.assign(out, { src: image.src, srcSet: image.srcSet, placeholder: image.placeholder });
      }
      return out;
    }
    return value;
  };
  return walk(data) as T;
}

/** 给代码标签页显示的 JSON. */
export const json = (value: unknown): string => JSON.stringify(value, null, 2);
