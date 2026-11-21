# Agent Note: 电商内容模型进 src/commerce, 区块吃模型, PDP 模板由模型出 PageSpec

Status: implemented

Decision-ID: omni-content-model

## Code

- `src/commerce/variant.ts`
- `src/constants/model-commerce.ts`
- `src/blocks/commerce/ProductBuy.tsx`
- `src/page/registry.ts`

## Problem

现有 ProductDetail 的库存挂在单个选项值上 (每个尺码一个 stock), 表达不了 "沙色 43 售罄, 墨蓝 43 有货" 这种 SKU 矩阵; 切换颜色时尺码的可选态不会变, 也会留下不存在的组合. 每个电商区块各写一套 props, 业务方从商品数据到页面要手拼三四遍 (详情, 卡片, JSON-LD), 标杆页 A 拼不出来.

## Decision

- `src/commerce/{catalog,variant,review,validate,adapt,fixtures,model}.ts`: `ProductModel` (选项轴 + SKU 列表), `ReviewModel`, 纯函数 `axisAvailability` (按其他轴已选值算某轴每个值: available / sold-out / missing), `findVariant`, `selectValue` (改一条轴时清掉与之组合不出 SKU 的其他已选值), `defaultSelection` (有货最低价 SKU, 只预选 swatch 轴), `priceRange`, `summarizeReviews`, `validateProduct`; 适配 `toProductDetail`, `toProductCard`, `productLdInput`; 假数据 `sampleProduct` 等, 数据表在 `src/constants/model-fixtures.ts`.
- `src/blocks/commerce/{ProductBuy,ReviewBoard,sections}.tsx`: `ProductBuy` 包现有 ProductDetail, 选择变化时用模型重算选项库存, 价格, 画廊顺序, 售罄组合禁用首个按钮, aria-live 报当前组合; `ReviewBoard` 评分分布即筛选按钮, 分布条按发牌节奏只动 transform, 减弱动效与无 IntersectionObserver 时直接终态.
- `src/page/{pdp,templates}.ts`: `pdpTemplate` 输入模型, 输出三拍 PageSpec (buy 慢 / proof 匀 / more 快), 镜头按偏好在 direction 白名单里挑, 没有评价或推荐就省掉那一拍; meta 带 canonical, og 与 Product JSON-LD; 同时返回 `validateProduct` 的问题.
- 默认注册表加 `buy` 与 `reviews` 两个区块名.

## Alternatives considered

- 什么都不做, 继续在 ProductDetail 的选项值上写 stock: 最强理由是零改动. 否决: SKU 矩阵是 PDP 的核心交互, 写不对就会把缺货组合卖出去.
- 复用现有, 直接改 ProductDetail 的 props 为 SKU 列表: 最强理由是少一层. 否决: 破坏现有用法与 api 快照; 包一层后旧用法不变, 新用法走模型.
- 引入 Shopify Hydrogen 的类型: 最强理由是与真实后端对齐. 否决: 绑定单一平台; 平台适配放到 data 适配器 (fromShopify), 模型保持中立.

## Consequences

新增 `@hx/ui/model`, `@hx/ui/sections`, `@hx/ui/templates` 三个目录 (package.json exports 与 build-lib 入口随 P1 一并接上). 标杆页 A 的数据流成立; 下一步是 BuyBar (粘性), Gallery 镜头化与文档站 `#/templates/pdp` 页.

## 落位说明 (2026-11-20)

原定新目录 src/model, src/sections, src/templates. 写入通道 (hxoa) 不能建目录, 先落在同层已有目录: 模型进 src/commerce (与电商原子同域), 区块进 src/blocks/commerce, 模板进 src/page. 等本机建好目录后用 git mv 迁回, 导入路径随之改.
