# Agent Note: 库按层分子路径入口, 页面层用类型化描述加默认注册表拼整页

Status: implemented

Decision-ID: layered-entries

## Code

- `src/entry/motion.ts`
- `src/page/Page.tsx`
- `docs/src/pages/gallery/PageStage.tsx`

## Problem

HX-UI 已经有控件, 区块, 运动和两张样板页, 但对使用方仍是一个控件库: 根桶平铺上千个符号, 运动分在 `src/motion`, `src/craft`, `src/studio`, `src/primitives` 四处, `PageComposer` 要求调用方自己拼注册表, 页面描述的 props 是 `Record<string, unknown>`, 区块名拼错或字段漏写要到运行时才发现. 想 "写一份描述就出一整页电商或软件产品页" 做不到.

## Decision

按层给入口, 根桶冻结只删不增:

- `@hx/ui/motion` 指向 `src/entry/motion.ts`, 转出 motion, craft 的可中断弹簧与按位数字, studio 的镜头组件, 以及按名字取用的 `MOTION_SPRINGS`. 只转发, 不搬文件.
- `@hx/ui/viz` 指向 `src/viz` (见 viz-layer 决策).
- `@hx/ui/blocks` 指向既有的 `Blocks` 命名空间.
- `@hx/ui/page` 指向 `src/page`: `definePage` 与 `section` 给出按注册表推导的类型化描述, `DEFAULT_SECTIONS` 收齐站点, 营销, 电商与数据四组区块, 可视化组件经 `framed` 包上 `BlockShell` 与标题组, `Page` 底层仍是 `PageComposer`. `createPage` 把自定义区块并进默认注册表并返回绑定好类型的 `define` 与 `Page`.
- `@hx/ui/studio` 保留为兼容入口, 新代码从 motion, viz, page 取.
- 文档站 `#/gallery` 多一格 "整页描述": 用 `definePage` 把商品页模板的同一份数据与 rings, flow 两个可视化区块拼成一页. "数据" 一格改为展示 `src/viz` 全部组件.

## Alternatives considered

- 什么都不做 / 复用现有 `PageComposer` 与根桶: 最强理由是组合器已经能按 JSON 渲染区块, 根桶也能取到所有组件, 零迁移成本. 否决: 没有默认注册表和类型推导, 使用方仍要自己知道几十个区块名和各自 props, 这正是 "只是控件库" 的感受.
- 往根桶 `src/index.ts` 继续加导出: 最强理由是使用方只记一个入口. 否决: 根桶被十几篇既有决策共同认领, 每加一行都要连带改写那些决策, 而且根桶已经大到无法浏览.
- 这一轮就把 craft, studio/moves, primitives/motion 物理搬进 `src/motion`: 最强理由是一步到位, 不留转发层. 否决: 那些目录各有已实现决策和测试, 一起搬会让本次 diff 牵动十几篇决策, 改为第二阶段先 deprecate 转发再删除.

## Consequences

使用方按层 import, 页面描述在编译期检查. `package.json` 的 exports 多出四个子路径, 构建产物路径不变 (tsc 本来就编译整个 src). 第二阶段已把镜头语言迁入 `src/motion/shots.ts`, 清掉 studio 的数字别名, 区块常量按域改名 (旧名留一版转发). craft 的物理迁移, gates 迁 .ts, 文档站舞台和 GIF 还没做, 分层与路线见 `docs/architecture/layers.md` 第 4 节.
