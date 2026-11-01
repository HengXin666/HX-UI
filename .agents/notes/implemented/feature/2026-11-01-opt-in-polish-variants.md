# Agent Note: 既有组件只加可选的外观变体与交互反馈, 默认渲染逐字节不变

Status: implemented

Decision-ID: opt-in-polish-variants

## Code

- `src/layout/Card.tsx`
- `src/primitives/button.tsx`
- `docs/src/pages/CardPage.tsx`

## Problem

Card, Button, Tabs, StatCard 是页面里出现最多的件, 观感偏平: Card 零阴影, 按压只有 1px 下沉, Tabs 指示不滑动, StatCard 只有一个数. 但 AGENTS.md 要求组件视觉类名沿用上游 open-vetta, 不在门禁类改动中顺手修改组件视觉或行为, 下游 HXLoLis / HX-Jungle 的截图与布局依赖现有默认外观. 需要在不碰默认路径的前提下提供更有层次的外观.

## Decision

- 全部新能力是可选项, 不传就不出现在类名里. cva 的 defaultVariants 保持 `variant: "default"` (Card 还有 `interactive: false`, Button 还有 `size: "default"`), 新增的布尔变体 (Card `lift`, Button `press`) 不进 defaultVariants: cva 对未传且无默认值的变体返回 undefined 并被过滤, 所以原有调用的输出与改动前逐字节一致. 自查方式是对改动前后的 cardVariants / buttonVariants / tabsTriggerVariants 在全部原有取值组合下逐个比对字符串.
- Card: `variant="elevated"` (bg-surface-raised + shadow-md, 暗色加实边), `variant="glass"` (半透明 card 底 + `--blur-glass` 模糊 + 饱和), `lift` (hover 上移 2px 加深阴影, 守住上游 "不平移超过 2px", 减弱动效时不位移). elevated / glass 与 interactive 叠加时用 compoundVariants 保住各自的底色.
- Button: `variant="gradient"` (bg-primary 打底, 其上叠 `--gradient-brand`, 令牌缺失时退回 primary 实底), `press` (按下 scale-97, 减弱动效时不缩放). 两者共用一条补了 scale / filter 的 transition, 只在它们生效时由 tailwind-merge 替换基础串里的那一条.
- Tabs: `TabsList animated` 经 context 下发; 打开后选中指示改成 motion 的 layoutId 共享布局元素, underline 形态是贴在列表底线上的 1px 主色线, pill 形态是浮起底. 指示器需要知道选中值, Tabs 根节点旁听 Radix 的 onValueChange 并经 context 提供 (value / defaultValue / onValueChange 原样转交). 打开时波纹改挂到子层 (useRipple 的 container), 宿主不再 overflow: hidden, 滑动途中的指示器不被裁掉. 动效内联在 tabs.tsx, 不依赖 src/motion/.
- StatCard: `trend` (数字或 { value, better, label }, better 说明涨是不是好事) 与 `sparkline` (1px 内联 SVG 折线 + 极淡面积), 颜色只表达好坏, 走 TONE 语义色.
- 遮罩: `src/primitives/styles.ts` 新增 MODAL_OVERLAY_GLASS, 经 DialogContent 的 overlayClassName 或各 Overlay 的 className 传入; MODAL_OVERLAY 本身不变.
- 颜色只用语义令牌, 新令牌名 (surface-raised, gradient-brand, blur-glass, shadow-glow) 以 S0 设计令牌分片为准.

## Alternatives considered

- 什么都不做 / 复用现有: 最强理由是默认外观符合上游规范, 不加东西就零风险, 需要强调时用 solid 卡片或 primary 按钮已经够用. 否决: 现有件给不出高度差, 按压与切换没有过程, 这正是评估里 "看起来平" 的直接原因, 而 S5 画廊需要这些能力.
- 直接改默认外观 (给 default 卡片加阴影, Tabs 默认滑动): 观感提升覆盖全站. 否决: 违反 AGENTS.md 对上游视觉的约束, 并会改变下游已有页面的截图与布局.
- 另起 FancyCard / GradientButton 等新组件: 不碰旧文件. 否决: 同一能力出现两个入口, 使用者要先猜该用哪个, 而变体是 cva 的本来用法.

## Consequences

默认路径不变, 下游无需改动. 新外观依赖 S0 提供的令牌, S0 未合入前 elevated 的底色, gradient 的渐变与 glass 的模糊不生效 (gradient 退回 primary 实底). Tabs 根节点多了一层 context 与一个旁听回调, 对 Radix 行为无影响. MODAL_OVERLAY_GLASS 需要集成分片从公共入口导出后下游才能直接引用.
