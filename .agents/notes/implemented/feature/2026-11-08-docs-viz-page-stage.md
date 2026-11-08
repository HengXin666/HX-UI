# Agent Note: 文档站给可视化层与页面描述层加舞台页

Status: implemented

Decision-ID: docs-viz-page-stage

## Code

- `docs/src/pages/stage/StageKit.tsx`
- `docs/src/pages/gallery/VizStage.tsx`
- `docs/src/nav.ts`

## Problem

`src/viz` 与 `src/page` 只在画廊的两个格子里出现: 数据一格把所有图平铺, 只有趋势线能推一个尖峰; 整页描述一格是一份写死的商品页. 读者看不到改值时动画从当前位置继续 (中断与回程), 也拿不到与眼前状态一致的调用代码. `docs/research/plan.md` 第 7 节要求组件页改成舞台, 道具台, 源码三截, 这两层还没有自己的页.

## Decision

新增 `docs/src/pages/stage/`, 注册两张 hash 路由页 `#/viz` (数据可视化, 图表组) 与 `#/page` (整页描述, 区块组, 宽页).

- `StageLayout` 统一三截: 舞台只渲染当前态, 不加入场动画; 道具台每个数值 prop 一条 `Slider`, 布尔一条 `Switch`, 枚举一条 `SegmentedControl`, 改值直接作为新 props 传给同一个组件实例, 不重挂载; 唯一的重挂载是 "重播入场" 按钮换 key. 源码区用 DocKit 的 `CodeBlock`, 复制按钮由库的 CodeBlock 自带.
- `#/viz` 用组件选择器加一个舞台, 一次只放一件: Trend (尖峰开关, area, height), BarChart (当前柱, 末柱数值, height), Ring / RingRow (value, max, size, delay), FlowGraph (当前节点, pulse, height), Funnel (选层改数值, rateLabel), Timeline (active 项, scrollLinked).
- `#/page` 用 `definePage` / `Page` 渲染商品页模板的区块加两块可视化; 道具台改材料区块标题, 每个区块的开关与上移下移. 区块按 key 渲染, 调序与开关不会让其余区块重挂载. 源码区显示当前描述对象.
- `code.ts` 把道具台的值拼回调用代码 (只拼字符串, 不 eval), 入口写子路径 `@hx/ui/viz` 与 `@hx/ui/page`.
- 示例数据抽到 `stage/samples.ts`, 画廊的 `VizStage` 与 `PageStage` 改为从这里取, 不复制字面量.

## Alternatives considered

- 什么都不做 / 复用现有画廊格子: 最强理由是画廊已经能看到全部图, 不用新增路由和注册. 否决: 画廊格子没有道具台, 改值的入口只有趋势线一个按钮, 也没有可复制的调用代码, 达不到第 7 节的三截结构.
- 复用 DocKit 的 `Preview` (预览 / 代码两个标签页): 最强理由是全站已有统一样式. 否决: 标签页一次只显示一边, 拖滑杆时看不到源码同步, 也没有道具台的位置.
- 每个组件一个舞台段, 六段竖排: 最强理由是一页能扫完全部. 否决: 六套道具台和源码叠在一起太长, 拖动时舞台常在视口外, 反而看不见中断.

## Consequences

新增组件到 `src/viz` 时, 要在 `stage/` 的选择器里加一项和一个舞台组件, 否则 `#/viz` 不会出现它. 源码区的商品页区块只写 `productProps(key)` 取数, 不展开模板数据, 复制后需自备这些 props. 趋势线与柱状的坐标轴只外扩不回缩 (关掉尖峰后不缩回), 是组件本身的行为, 舞台如实呈现.
