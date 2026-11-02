/**
 * 电商区块桶文件 (V1-07 浏览, V1-08 交易): 商品卡, 商品栅格, 横滑轨道, 类目, 活动首屏, 促销条, 详情, 购物车, 结账步骤, 搜索结果.
 * 名字逐个写出, 不用 export *; 内部拆分件 commerce-v108-parts.tsx 与 browse/ 不对外.
 * 根入口 src/index.ts 由集成任务 V0-Z 接入.
 */
export { CampaignHero, type CampaignSlideData, type CampaignHeroProps } from "./CampaignHero";
export { CartSummary, type CartLineData, type CartTotalData, type CartPromoSpec, type CartSummaryData, type CartSummaryProps } from "./CartSummary";
export { CategoryTiles, type CategoryTileData, type CategoryTilesProps } from "./CategoryTiles";
export { CheckoutSteps, type CheckoutStepData, type CheckoutStepsProps } from "./CheckoutSteps";
export { ProductCard, type ProductBadgeData, type ProductSwatchData, type ProductCardData, type ProductCardProps } from "./ProductCard";
export { ProductDetail, type DetailOptionValue, type DetailOption, type ProductDetailData, type ProductDetailProps } from "./ProductDetail";
export { ProductGrid, type ProductGridStateData, type ProductGridCardOptions, type ProductGridProps } from "./ProductGrid";
export { ProductRail, type ProductRailProps } from "./ProductRail";
export { PromoStrip, type PromoStripItemData, type PromoStripProps } from "./PromoStrip";
export { SearchResults, type SearchFilterOption, type SearchFilter, type SearchSortSpec, type SearchQueryState, type SearchResultsProps } from "./SearchResults";
