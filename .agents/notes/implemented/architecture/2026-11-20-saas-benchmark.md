# Agent Note: 标杆页 C (SaaS) 由一份产品数据出整页, 导览飞在活界面上, 计算器与定价卡共用档位数据

Status: implemented

Decision-ID: saas-benchmark

## Code

- `src/blocks/marketing/ProductTour.tsx`
- `src/constants/templates-saas.ts`
- `src/page/saas.ts`

## Problem

计划 P2 要求标杆页 C: 单主角开场, 真实产品界面上的镜头, 功能分镜, 指标墙, 定价 + 对比矩阵 + 计算器, 安全合规, 证言, CTA. 现有 blocks/marketing 有定价, 对比矩阵, 证言等单件, 但没有 "在真实界面上讲解" 的导览件, 也没有按人数估价的计算器; 业务方要手拼七八个区块, 档位数据在定价卡, 矩阵, 计算器里各写一遍, 节奏与镜头没人管.

## Decision

- `src/blocks/marketing/ProductTour.tsx`: cursor-flyover 的网页版. 子节点是真实界面 (活组件), 用 `data-tour` 标目标; 光标用 WAAPI 沿三点弧线飞 (弧高按距离取比例, 封顶 72px), 落定后目标描边, 标注淡入且放不下时翻到左侧. 只动 transform / opacity. 可见, 无悬停, 无焦点时自动播放, 有播放 / 暂停键; 步骤是 tablist (方向键, Home / End); 每站 aria-live 播报一句; 减弱动效时不飞也不自动播放.
- `src/blocks/marketing/PricingCalculator.tsx`: 人数滑块 + 按月 / 按年, 纯函数 `quote` / `bestPlan` 算每档月价 (最低人数, 平台费, 年付折扣, 人数上限), 金额用 NumberRoll 按位滚; 读屏只听一句汇总.
- `src/page/saas.ts`: `saasTemplate` 七拍 open 慢 / tour 匀 / features 快 / metrics 匀 / pricing 慢 / proof 匀 / cta 快, 缺数据的拍省掉, 任意省法都不会同节奏三连; 一份 `SaasPlan[]` 同时喂定价卡, 计算器, 对比矩阵列; `validateSaas` 报矩阵引用不存在的档位等; meta 带 SoftwareApplication JSON-LD (最低席位价). `shotFor` 从 pdp.ts 导出共用.
- 默认注册表加 `tour`, `calculator`; 文档站 `#/page-software` 用一个能点的迷你对账工作台当导览的活界面.

## Alternatives considered

- 什么都不做, 用现有 Showcase 放截图: 最强理由是零新代码. 否决: 截图不能点, 计划要求 "活组件" 媒体位, 截图上的光标动画也会和真实界面对不齐.
- 复用现有, 把计算器做成 Pricing 的一个开关: 最强理由是少一个区块名. 否决: Pricing 已有月年切换与三种档位类型, 再塞人数状态会让 props 互相牵制; 分开后两者只共享档位数据.
- 引入 driver.js / intro.js 做导览: 最强理由是成熟. 否决: 它们是遮罩 + 气泡的产品引导, 不是镜头; 改不了飞行弧线与节奏, 还会接管焦点.

## Consequences

模板入口多了 `saasTemplate` / `sampleSaas`; 计划 P2 剩余: FeatureStory (pinned-scrub 功能分镜), 版式 bento, direction industrial / fintech 令牌细化, 定帧与独立终检. 页面代码 (docs 页) 约 110 行, 在 300 行门槛内.
