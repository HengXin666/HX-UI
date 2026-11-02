import type { JSX } from "react";
import { BlocksProvider } from "../../../../../src/blocks/_shared/BlocksProvider";
import { ProductGrid } from "../../../../../src/blocks/commerce/ProductGrid";
import { PromoStrip } from "../../../../../src/blocks/commerce/PromoStrip";
import type { ProductCardData } from "../../../../../src/blocks/commerce/ProductCard";
import type { PromoStripItemData } from "../../../../../src/blocks/commerce/PromoStrip";
import { SKIN, SKIN_ATTR, SKIN_VARIANT } from "../../../../../src/constants/skins";

/** 三皮肤演示: 同一份数据, 只换根节点的 data-skin; 区块外观差异全部来自语义令牌. */
const TRIO = [
  { skin: SKIN.default, label: "default" },
  { skin: SKIN.retail, variant: SKIN_VARIANT.sharp, label: "retail · sharp (nike)" },
  { skin: SKIN.mono, label: "mono (vercel)" },
] as const;

const STAGE = "flex w-full flex-col gap-6";
const FRAME = "overflow-hidden rounded-xl border border-border bg-background text-foreground";
const CAPTION = "px-4 pt-3 text-xs text-muted-foreground";

/**
 * 三套皮肤并排: default / retail (直角) / mono. 每块是一个 PromoStrip + 三列 ProductGrid.
 *
 * .agents/notes/implemented/feature/2026-11-02-commerce-browse-blocks.md
 */
export function CommerceBrowseSkins({ products, promo }: { products: ProductCardData[]; promo: PromoStripItemData[] }): JSX.Element {
  return (
    <div className={STAGE}>
      {TRIO.map((item) => {
        const attrs: Record<string, string> = { [SKIN_ATTR.skin]: item.skin };
        if ("variant" in item) attrs[SKIN_ATTR.variant] = item.variant;
        return (
          <div key={item.label} {...attrs} className={FRAME}>
            <p className={CAPTION}>data-skin={item.label}</p>
            <BlocksProvider locale="zh-CN" density="compact">
              <PromoStrip items={promo.slice(0, 1)} promoTone="inverted" dismissible />
              <ProductGrid pad="sm" cols={3} products={products.slice(0, 3)} card={{ showFavorite: true, onQuickAdd: () => undefined }} />
            </BlocksProvider>
          </div>
        );
      })}
    </div>
  );
}
