# Agent Note: 按压与提交族控件 (controls/press) 用 craft 弹簧自写

Status: implemented

Decision-ID: controls-press

## Code

- `src/controls/press/tokens.ts`
- `src/controls/press/hold/HoldConfirm.tsx`
- `src/controls/press/launch/PullSend.tsx`
- `src/controls/press/signal/LikeBurst.tsx`

## Problem

L2 controls 层缺一组按压与提交类控件: 按住确认, 带撤销窗口的提交, 滑动确认, 弹弓发送, 起飞按钮, 点赞, 工具调用芯片. 行为规格在 docs/research/catalog/micro.md 的 HoldButton, FuseButton, SlideCommit, SlingButton, FlyingButton, PulseHeart, CallChip 七个条目里. 上游是 MIT 加 Commons Clause, 不能移植再分发, 而 HX-UI 以 Apache-2.0 发包, 所以只能把条目里的常数, props 和行为描述当规格, 用本库引擎重写, 组件名也换成本库自己的.

## Decision

七件放在 `src/controls/press/` 下, 按意图分三个子目录: hold (HoldConfirm, GraceCommit, SwipeConfirm), launch (PullSend, Liftoff), signal (LikeBurst, RunChip). 每个组件文件头写明规格参照的条目原名.

动画只有一个驱动 `src/controls/press/use-motion-value.ts`: 弹簧一步交给 `src/craft/spring.ts` 的 stepSpring, 定时补间从当前值出发, 两者都可中途改目标且不跳变, 减弱动效时直接落终值. 规格里 "时长 + bounce" 写法的弹簧由 `src/controls/press/spring-fit.ts` 换成 stiffness / damping / mass: bounce 定阻尼比 (1 - bounce), 时长定固有频率, 使包络在该时长衰减到 0.001; 换算在测试里用 stepSpring 实际积分核对过冲与落定. 规格已是刚度阻尼的 (FlyingButton 的 380 / 10) 原样使用.

共用时长与过渡串在 `src/controls/press/tokens.ts`, transitionOf 只列具体属性, 减弱动效时返回 none. 颜色 props 全部换成语义 token 类 (bg-primary, bg-danger, bg-success, bg-muted, text-warning 等), 不收任意色值. 规格里大于 1px 的线 (FuseButton 的 fuseThickness 1.5, SlingButton 的 strokeWidth 3) 统一画成 1px, 不暴露该 prop. 进度类信息 (按住进度, 引线倒计时, 运行计时) 在减弱动效时照常更新, 只去掉缩放, 抖动, 粒子和飞行.

引擎缺口用 `// ENGINE-GAP` 或块注释 ENGINE-GAP 标出: craft EASE 缺 (0.23, 1, 0.32, 1) 与 (0.77, 0, 0.175, 1) 两条曲线且 ease() 不收任意控制点; 缺可调过冲量的 back-out (PulseHeart 的 overshoot 1.7); 缺粒子场或流体场 (FlyingButton 的烟与湍流, 未落地).

## Alternatives considered

- 什么都不做 / 复用现有: 最强理由是 craft 已有 usePress 与 SegmentedThumb, Button 已有按下弹簧. 否决: 它们只覆盖按下缩放, 没有按住进度, 撤销窗口, 拖动提交, 发射这些带状态的提交语义, 硬塞进 Button 会让基础按钮背上七种状态机.
- 直接用 motion/react 的 animate 与 spring 写法: 最强理由是规格原本就是 motion 的 duration / bounce 参数, 抄过来零换算. 否决: brief 要求物理只走 craft/spring, 不另起第二套引擎; motion 的 duration 弹簧与 stepSpring 的积分不同, 混用会让同一个数在两处手感不一样.
- 常数放进 `src/constants/`: 最强理由是字面量规则豁免常量目录. 否决: 那个目录归十几篇已有决策所有, 加文件要牵动它们; 本族常数按组件具名导出, 放在本族目录里更好找.

## Consequences

主线接入时从 `src/controls/press/index.ts` 导出, 本次不改 src/index.ts. Liftoff 只实现升降, 倾斜, 翻转与推进器火焰, 烟雾, 湍流, ramp, carryCursor 与 theme 不落地, 等 L1 有粒子或场引擎再补. SwipeConfirm 的 speed 到刚度的系数, 抖动序列, LikeBurst 的粒子数与心跳幅度是本库定的值, 规格没给, 调手感时改 tokens 或组件顶部的具名常量即可.
