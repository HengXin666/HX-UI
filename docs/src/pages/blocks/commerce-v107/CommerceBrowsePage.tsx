import { useMemo, useState, type JSX } from "react";
import { BlocksProvider } from "../../../../../src/blocks/_shared/BlocksProvider";
import { CampaignHero } from "../../../../../src/blocks/commerce/CampaignHero";
import { CategoryTiles } from "../../../../../src/blocks/commerce/CategoryTiles";
import { ProductCard } from "../../../../../src/blocks/commerce/ProductCard";
import { ProductGrid } from "../../../../../src/blocks/commerce/ProductGrid";
import { ProductRail } from "../../../../../src/blocks/commerce/ProductRail";
import { PromoStrip } from "../../../../../src/blocks/commerce/PromoStrip";
import { Callout, Code, CodeBlock, H2, H3, P, Preview } from "../../../components/DocKit";
import { useDemoImages } from "../../../components/MediaDemo";
import { CommerceBrowseSkins } from "./CommerceBrowseSkins";
import { DEMO_IMAGE_KEYS, PRODUCTS, SLIDES, SPLIT_SLIDE, TILES, json, promoItems, withDemoMedia } from "./commerce-v107-data";

const WIDE = "w-full";
const CARD_W = "w-full max-w-72";
const STATES = ["ready", "loading", "empty", "error"] as const;
const TOGGLE = "rounded-md border border-border px-2 py-1 text-xs data-[on=true]:bg-foreground data-[on=true]:text-background";

/**
 * V1-07 电商浏览区块文档页: ProductCard / ProductGrid / ProductRail / CategoryTiles / CampaignHero / PromoStrip,
 * 每个区块一个示例 + JSON 数据 + 三皮肤演示. 示例图 canvas 现画, 不请求外部地址.
 *
 * .agents/notes/implemented/feature/2026-11-02-commerce-browse-blocks.md
 */
export function CommerceBrowsePage(): JSX.Element {
  const images = useDemoImages(DEMO_IMAGE_KEYS);
  const [now] = useState(() => Date.now());
  const [state, setState] = useState<(typeof STATES)[number]>("loading");
  const d = useMemo(
    () => ({
      products: withDemoMedia(PRODUCTS, images),
      tiles: withDemoMedia(TILES, images),
      slides: withDemoMedia(SLIDES, images),
      split: withDemoMedia(SPLIT_SLIDE, images),
    }),
    [images],
  );
  const promo = useMemo(() => promoItems(now), [now]);

  return (
    <BlocksProvider locale="zh-CN">
      <P>
        电商浏览区块 (设计稿 4.3). 数据驱动, 价格与倒计时全部经 <Code>Intl</Code>, 图片全部经 <Code>media/Image</Code>; 每个区块的代码标签页给出可直接用于
        <Code>PageComposer</Code> 的 JSON.
      </P>

      <H2>ProductCard</H2>
      <P>hover / 聚焦换第二张图, 色板换主图, 角标贴左上, 售罄灰化并禁用加购. 整卡可点 (标题链接铺满), 收藏与加购在链接之上.</P>
      <Preview code={json(PRODUCTS[0])}>
        {d.products.slice(0, 3).map((p) => (
          <ProductCard key={p.id} {...p} className={CARD_W} showFavorite onQuickAdd={() => undefined} />
        ))}
      </Preview>

      <H2>ProductGrid</H2>
      <P>列数档 2 到 5 走容器查询; dataBoundary 切换 loading 骨架, empty / error 空态.</P>
      <div className="flex gap-2">
        {STATES.map((s) => (
          <button key={s} type="button" data-on={s === state} className={TOGGLE} onClick={() => setState(s)}>
            {s}
          </button>
        ))}
      </div>
      <Preview code={json({ cols: 4, dataBoundary: state, products: PRODUCTS, empty: { text: "没有符合条件的商品" } })}>
        <ProductGrid
          className={WIDE}
          pad="sm"
          heading={{ title: "热卖" }}
          cols={4}
          dataBoundary={state}
          products={d.products}
          empty={{ text: "没有符合条件的商品", hint: "换个筛选条件试试" }}
          error={{ text: "商品加载失败" }}
          onRetry={() => setState("loading")}
          card={{ showFavorite: true }}
        />
      </Preview>

      <H2>ProductRail</H2>
      <P>scroll-snap 吸附, 左右按钮到端禁用, 只在可继续滚的一侧淡出; 窄容器全宽单卡.</P>
      <Preview code={json({ heading: { title: "Trending" }, cardSize: "md", cta: { label: "查看全部", href: "#all", variant: "link" }, products: PRODUCTS })}>
        <ProductRail
          className={WIDE}
          pad="sm"
          heading={{ title: "Trending" }}
          cta={{ label: "查看全部", href: "#all", variant: "link" }}
          products={[...d.products, ...d.products]}
          card={{ showFavorite: true }}
        />
      </Preview>

      <H2>CategoryTiles</H2>
      <H3>圆角组 · 首张加宽</H3>
      <Preview code={json({ layout: "feature-first", shape: "rounded", items: TILES })}>
        <CategoryTiles className={WIDE} pad="sm" items={d.tiles} />
      </Preview>
      <H3>全出血组 · 等宽</H3>
      <Preview code={json({ layout: "even", shape: "bleed", items: TILES })}>
        <CategoryTiles className={WIDE} pad="none" layout="even" shape="bleed" items={d.tiles} />
      </Preview>

      <H2>CampaignHero</H2>
      <Callout title="可暂停">自动播放在 hover, 聚焦, 点暂停按钮或系统减弱动效时停止 (WCAG 2.2.2).</Callout>
      <Preview code={json({ autoplay: 6000, slides: SLIDES })}>
        <CampaignHero className={WIDE} slides={d.slides} autoplay={6000} />
      </Preview>
      <H3>分屏版式</H3>
      <Preview code={json({ layout: "split", slides: SPLIT_SLIDE })}>
        <CampaignHero className={WIDE} layout="split" slides={d.split} />
      </Preview>

      <H2>PromoStrip</H2>
      <Preview code={json({ promoTone: "sale", rotate: 5000, dismissible: true, items: promo })}>
        <div className="flex w-full flex-col gap-3">
          <PromoStrip items={promo} promoTone="sale" rotate={5000} dismissible />
          <PromoStrip items={promo.slice(1)} promoTone="neutral" />
        </div>
      </Preview>

      <H2>三皮肤演示</H2>
      <P>同一份数据, 只换容器上的 <Code>data-skin</Code>.</P>
      <CommerceBrowseSkins products={d.products} promo={promo} />

      <H2>整页 JSON</H2>
      <CodeBlock
        lang="json"
        code={json([
          { type: "PromoStrip", props: { items: promo.slice(1), promoTone: "inverted" } },
          { type: "CampaignHero", props: { slides: SLIDES } },
          { type: "CategoryTiles", props: { items: TILES } },
          { type: "ProductRail", props: { heading: { title: "Trending" }, products: PRODUCTS } },
        ])}
      />
    </BlocksProvider>
  );
}
