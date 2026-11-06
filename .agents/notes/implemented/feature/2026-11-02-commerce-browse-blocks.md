# Agent Note: 电商浏览区块 (V1-07) ProductCard / ProductGrid / ProductRail / CategoryTiles / CampaignHero / PromoStrip

Status: implemented

Decision-ID: commerce-browse-blocks

## Code

- `src/blocks/commerce/ProductCard.tsx`
- `src/blocks/commerce/ProductGrid.tsx`
- `src/blocks/commerce/ProductRail.tsx`
- `src/blocks/commerce/CategoryTiles.tsx`
- `src/blocks/commerce/CampaignHero.tsx`
- `src/blocks/commerce/PromoStrip.tsx`
- `src/blocks/commerce/browse/` (BlockMedia, useScrollRail, useCarousel, useCountdown)
- `src/constants/blocks-commerce-v107.ts`
- `docs/src/pages/blocks/commerce-v107/`

## Problem

设计稿 4.3 的电商浏览区块需要在 V0 commerce 原子 (Price / PromoBadge / ProductSwatch / RatingSummary) 与 media/Image 之上组合成数据驱动区块, 覆盖 shopify 16:10 拼贴, nike 全幅 campaign 与分类大图卡, apple 色板与横滑轨道.

## Decision

- 区块级组件 (Grid / Rail / Tiles / Hero / Strip) 继承 BlockBaseProps 并由 BlockShell 包壳; ProductCard 是卡片级 (article), 不包壳, 数据形态 ProductCardData 可 JSON 序列化.
- 整卡可点用 stretched link: 标题 <a> 的 ::after 铺满卡片, 收藏 / 加购 / 色板 / 评分抬到 z-10, 读屏只有一个链接.
- 价格走 Price (Intl), 倒计时走 Intl.NumberFormat(unit) + Intl.ListFormat(unit), 不手拼.
- 图片一律经 BlockMedia -> media/Image (视频经 media/Video). overlay 首屏用 radix 包裹层选择器让 AspectRatio 铺满.
- src/commerce/engage/Rail 未落盘, ProductRail 自带最小 useScrollRail (scroll-snap, 到端禁用按钮, 单侧 MaskFade); Rail 落地后可替换视口层.
- 偏离: 内部辅助放在 src/blocks/commerce/browse/ 子目录 (经 exec 建目录), 使 commerce/ 直接文件中本任务只占 6 个.
- 文案: 可见文案来自数据; aria 兜底与售罄 / 收藏 / 加购默认词在 BROWSE_TEXT_ZH/EN, 经 texts prop 覆盖; 上一张 / 下一张 / 暂停取 BlockLabels.

## Alternatives considered

- 什么都不做, 让调用方自己拼 commerce 原子: 最强理由是原子已齐. 否决: 每页重复写 hover 换图, 色板换图, 骨架, 轮播 a11y, 容易分叉.
- ProductCard 也包 BlockShell: 否决, 卡片放进网格时会产生嵌套 section 与留白.

## Consequences

- 文档页未接入 docs 导航 (nav 为共享文件, 留给集成任务).
- src/index.ts / src/blocks/index.ts 未导出, 由集成任务接入.
