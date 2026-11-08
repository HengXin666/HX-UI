# Agent Note: 输入, 浮层与菜单族控件 (controls/compose) 用 craft 弹簧自写

Status: implemented

Decision-ID: controls-compose

## Code

- `src/controls/compose/kinetics.ts`
- `src/controls/compose/input/ComposerField.tsx`
- `src/controls/compose/overlay/CueTip.tsx`
- `src/controls/compose/status/ReasoningTrace.tsx`

## Problem

L2 controls 层缺一组对话与输入相关的交互件: 输入条, 语音听写键, 显影框, 思考行, 暖提示, 分枝菜单, 翻转卡. 行为规格在 docs/research/catalog/micro.md 的 PromptBar, VoicePill, RefineFrame, ThoughtLine, WarmTooltip, BranchedMenu, FlipCard 七个条目里. 上游是 MIT 加 Commons Clause, 不能移植再分发, 所以只把条目里的常数, props 和行为描述当规格, 用本库引擎重写, 组件名换成本库自己的.

## Decision

七件放在 `src/controls/compose/` 下, 按意图分三个子目录: input (ComposerField, DictateButton), overlay (CueTip, ForkMenu, TurnCard), status (DevelopFrame, ReasoningTrace). 每个组件文件头写明规格参照的条目原名.

运动集中在 `src/controls/compose/kinetics.ts`: 时长加回弹到 stiffness / damping / mass 的换算 (阻尼比 1 - bounce, 包络在时长内衰减到 0.001), 一阶追随与衰减, 画布适配, 以及多路弹簧共用一个 rAF 的 useSpringChannels, 每路交给 craft 的 stepSpring 积分, 改目标保留速度. CueTip 的倾斜与热切换滑移, TurnCard 的翻转, 倾斜, 抬起和高光都走这一个 hook. CueTip 的热度 (上次收起时刻与位置) 是模块级共享, 所以两个提示之间切换无需外层 Provider. ForkMenu 只用 CSS 过渡, 分支线用 pathLength 加 stroke-dashoffset 画出. 每个数字只在 tokens.ts 写一次, 同值用别名指回.

颜色 props 只收语义 token 名, 落到 var(--name). 规格里 1.5px 的分支线统一画 1px. 减弱动效时去掉倾斜, 滑移, 扫光与模糊, 状态与进度照常更新. 引擎缺口用 ENGINE-GAP 标出.

## Alternatives considered

- 什么都不做 / 复用现有: 最强理由是库里已有 Tooltip, Textarea, Accordion 与对话 kit, 能满足基本功能. 否决: 它们没有热窗口, 速度倾斜, 甩动翻面, 分支线绘制, 打字能量流光这些手感, 加进基础件会改变既有行为.
- 直接用 motion/react 的 animate 与 spring: 最强理由是规格原本就是 motion 写法. 否决: 物理只走 craft/spring, 混用两套积分会让同一参数手感不一致.
- CueTip 用外层 Provider 管热度: 最强理由是可以按区域隔离. 否决: 规格的热窗口是全局语义, Provider 会让每个用法多一层包裹; 需要隔离时用 resetCueWarmth 清空.

## Consequences

主线接入时从 `src/controls/compose/index.ts` 导出, 本次不改 src/index.ts. kinetics.ts 与其它三族的换算, 帧循环重复, 下一步统一并进 src/motion 后删掉族内副本. CueTip 的热切换滑移按上一个气泡的屏幕位置计算, 跨滚动容器时以收起瞬间的位置为准.
