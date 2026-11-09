# Agent Note: 按压与提交族控件 (controls/press) 用 craft 弹簧自写

Status: implemented

Decision-ID: controls-press

## Code

- `src/controls/press/tokens.ts`
- `src/controls/press/hold/HoldConfirm.tsx`
- `src/controls/press/launch/PullSend.tsx`
- `src/controls/press/signal/LikeBurst.tsx`
- `src/controls/press/signal/GlintButton.tsx`, `src/controls/press/signal/glint.ts` (react-bits Components/SpecularButton)

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

## GlintButton (规格 Components/SpecularButton)

规格在 docs/research/catalog/components-1.md 的 `### Components/SpecularButton`. 放进 signal 子目录: 它和 LikeBurst, RunChip 一样是带视觉信号的单击按钮, 没有提交状态机. 按压完全交给 `src/craft/use-press.ts` (按钮合同: 0.97 + 1px 弹簧 press, 松开 1.012 再 80ms 收回 1, 连点速度乘 0.5, pointercancel 同 pointerup, 键盘 Enter / Space 同路), 缩放只加在内层 face 与高光层, 外壳不缩, 焦点环因此不跟着缩. 高光的三个量 (方位 spot, 亮度 level, 按下闪光 press) 按规格速率 8 / 7 / 5 每秒指数逼近, 帧长钳 0.05s, 逻辑是 `glint.ts` 里的纯函数, 帧循环走 `src/motion/frame/loop` 的 createFrameLoop, 落定即停 (autoAnimate 或离屏除外). 每帧只写宿主上的四个 CSS 变量, 渐变串是静态的. 规格的 WebGL 圆角矩形 SDF 场换成 1px 环形遮罩上的 conic-gradient 加一层模糊外晕和一层朝高光的内侧 radial 反光; 一枚按钮不值一张 WebGL 上下文, 所以没走 backdrop kernel 的 useShaderBackdrop, 只借了它的 cssColorOf 读 token 色, 内核未改.

| 规格条目 | 组件 | 采用 / 改动 / ENGINE-GAP |
|---|---|---|
| uSpot 跟随指针, 速率 8 (jsx:341), 走短边 wrap | GlintButton | 采用. 方位 0 为正上顺时针, 与 conic-gradient 同一套 |
| level 速率 7 (jsx:344), proximity=250, intensity=1, idleIntensity=0.35 | GlintButton | 采用. 距外沿 0 到 proximity 之间用 smoothstep 在两档亮度间插值 |
| press 衰减 exp(-dt*5) (jsx:345), dt 上限 0.05 (jsx:326) | GlintButton | 采用. 闪光以 0.5 的份额叠到亮度上, 钳到 1 |
| shineSize=10, shineFade=34 (uWindow, 沿周长弧长) | GlintButton | 改动: 按周长换成中心角. ENGINE-GAP: 长宽比大时弧长沿边略有伸缩 |
| thickness=1.2, band / hair 两条线 (jsx:64-65) | GlintButton | 改动: 线宽固定 1px (库规则), 底线用 border-border, 高光线在同一条 1px 上 |
| glow=1 | GlintButton | 改动: 1px 高光环的 6px 模糊副本, 不透明度 glow * 0.6 |
| tint / tintOpacity=0.04, blur=0 | GlintButton | 改动: tint 固定为 bg-foreground 薄层, blur 用 backdrop-filter |
| tint / textColor / lineColor / baseColor 色值 | GlintButton | 改动: 不收色值; line 收语义 token 名 (默认 foreground), 文字 text-foreground, 底线 border-border |
| autoAnimate=false, speed=0.35 | GlintButton | 采用, speed 读作圈每秒; 指针在 proximity 内时让位给跟随 |
| IntersectionObserver 离屏停帧, DPR 上限 3 | GlintButton | 离屏停帧采用; 无画布, DPR 不涉及 |
| size='lg', radius=18 | GlintButton | 改动: 默认 md (32px, 按钮合同), radius 默认 8 |
| uEntry 入场 | GlintButton | 改动: 亮度从 0 逼近 idle 即入场, 不另设时钟 |
| 减弱动效 (jsx:243) | GlintButton | 采用: 高光停在左上 315deg, 亮度 idle, 悬停直接落到 intensity, 不跟随不自转; 按压直接写终值 |
| CSS transform 0.25s 过渡 (css:29) | GlintButton | 改动: 换成 craft usePress 弹簧 (按钮合同) |
| disabled, loading (规格只有 disabled) | GlintButton | 按钮合同: 禁用 120ms 到 opacity 0.45; loading 标签 invisible 占宽, 12px 圆点 800ms 线性, 减弱动效停转, 期间吞掉点击 |
| 焦点环 (craft.md「焦点环与线宽」) | GlintButton | 采用: craft/tokens 的 FOCUS_RING, outline 1px + offset 2px |

