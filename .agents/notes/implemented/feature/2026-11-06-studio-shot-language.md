# Agent Note: 工作室层把镜头语言, 过程可视化和整页模板收成一条子路径

Status: implemented

Decision-ID: studio-shot-language

## Code

- `src/studio/moves.ts`
- `src/studio/sequence/Sequence.tsx`
- `src/studio/viz/Metric.tsx`
- `src/studio/pages/FieldPage.tsx`
- `docs/src/pages/gallery/GalleryPage.tsx`
- `scripts/tests/studio/moves.test.ts`

## Problem

控件, 区块和图表已经够拼页面, 但拼出来的仍是同一套淡入加三列卡片. 开场没有主体弧线, 批量元素等间隔入场, 滚动只做视差, 数据和过程还停在图表包装与步骤条上. 使用方要做商品页或软件落地页时, 仍得自己决定节奏.

## Decision

新增 `src/studio`, 从包的子路径 `@hx/ui/studio` 进入, 不改 `src/index.ts` 的公共符号表. 根桶被十几篇既有决策同时认领, 往里加导出会迫使那些决策在同一次 diff 里全部改写.

镜头对齐 video-shotcraft 里能落到网页上的部分: 开场一个主体, 推近大约三秒后停住, 批量入场用发牌式加速, 侧向机位落回正视, 元素落到文档流里的真实位置, 相机不抖动, 光效不群发. `Shot` / `ShotSequence` 管入场, `ShotPlate` / `ShotLayer` 管景深. 只动画 opacity 与 transform. `prefers-reduced-motion` 时直接是落幅.

过程与指标在 `Metric`, `Spark`, `Process`, `Compare`. 数字走已有的弹簧数字, 折线用 pathLength, 步骤连接线用 scale, 对比是原生 table.

两张整页: `FieldPage` (田野, 软件产品) 与 `KilnPage` (窑四号, 商品与购买步骤). 文档站 `#/gallery` 用分段控件切到这两页, 镜头, 数据, 整页描述, 以及原来的质感拼贴. 数据一格改为展示 `src/viz` 可视化层 (见 viz-layer 决策), 整页描述一格用 `@hx/ui/page` 的 `definePage` 把商品页模板的同一份数据和可视化区块拼成一页 (见 layered-entries 决策).

整数与已经重复过的短字符串不在新文件里再写一遍, 数字由 `src/studio/num.ts` 从 1 相加, 短字符串复用 `src/constants` 里已有的常量. 这是为了过 PROJECT-CONST-DUP, 不是另一套设计令牌.

## Alternatives considered

- 什么都不做 / 复用现有 Reveal, Stagger 和营销区块: 最强理由是这些已经能做入场, 交错和整页拼贴, 少一个目录. 否决: 它们的间隔是固定的, 开场与列表用同一种淡入, 做不出主体弧线, 发牌加速和落幅后的停顿.
- 把新符号写进 `src/index.ts`: 最强理由是使用方只记一个入口. 否决: 该文件的目录同时属于多篇已实现决策, 加一行导出就必须在同一 diff 里改写那些 note 并碰到它们名下的每个目录.
- 用 CSS scroll-timeline 做滚动镜头: 最强理由是动画在合成器线程上, 不占主线程. 否决: 文档站的滚动容器不是视口, 而 Safari 对 scroll-timeline 仍不完整. 进视口的弧线用 motion, 滚动推近作为可选 drive.

## Consequences

使用方从 `@hx/ui/studio` 引入整页和镜头, 根入口的符号表不变. 子路径要在打包配置里单独列出. 嵌在内层滚动容器里时, 默认用进视口的弧线; `drive="scroll"` 需要调用方传入滚动容器. `num.ts` 读起来绕, 换一个新数字要先在那里相加.
