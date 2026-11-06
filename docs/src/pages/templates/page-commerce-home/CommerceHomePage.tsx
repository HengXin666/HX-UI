import { useMemo, type JSX } from "react";
import {
  BlocksSiteFooter,
  BlocksSiteHeader,
  CampaignHero,
  CategoryTiles,
  Newsletter,
  ProductGrid,
  ProductRail,
  PromoStrip,
  StatBand,
  Testimonials,
  type BlockRegistry,
} from "@hx/ui";
import { injectProps } from "./compose";
import { HOME_BLOCKS, type HomeBlockProps } from "./data";
import { TemplateShell } from "./TemplateShell";

/** 首页 registry: 键与 data.ts 的 HomeBlockProps 一一对应. */
export const HOME_REGISTRY = {
  SiteHeader: BlocksSiteHeader,
  CampaignHero,
  CategoryTiles,
  ProductRail,
  PromoStrip,
  ProductGrid,
  StatBand,
  Testimonials,
  Newsletter,
  SiteFooter: BlocksSiteFooter,
} satisfies BlockRegistry & Record<keyof HomeBlockProps, unknown>;

/** 演示用订阅提交: 真实项目换成接口调用, 抛错即进入失败态. */
async function subscribe(email: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  if (!email.includes("@")) throw new Error("invalid email");
}

/**
 * 电商首页模板 (nike / apple / shopify 型), 只组合区块 + 数据:
 * SiteHeader(大菜单 + 公告条) -> CampaignHero(全出血轮播) -> CategoryTiles -> ProductRail(Trending) -> PromoStrip
 * -> ProductGrid(分区) -> StatBand -> Testimonials -> Newsletter -> SiteFooter. 皮肤 default / retail / mono 切换.
 */
export function CommerceHomePage(): JSX.Element {
  const blocks = useMemo(() => injectProps(HOME_BLOCKS, "Newsletter", { onSubmit: subscribe }), []);
  return <TemplateShell blocks={blocks} registry={HOME_REGISTRY} />;
}
