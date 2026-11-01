# Agent Note: 动效引擎 (共享预设, 视口入场, 交错, 弹簧数字, 转场)

Status: implemented

Decision-ID: motion-engine

## Code

- `src/index.ts`
- `src/motion/presets.ts`
- `src/constants/motion.ts`
- `docs/src/pages/motion/MotionPage.tsx`

## Problem

`motion` 12 早已是 dependencies, 但只有少数组件各自直接调用它, 没有共享预设. 每个想要入场,
交错或数字滚动的页面都要重新决定位移多远, 时长多长, 用哪条曲线, 结果是节奏各不相同, 而且
几乎所有手写调用都把 0.3, 0.2 这样的秒数写死在代码里, 与 tokens.css 的 `--duration-*` 脱节:
调令牌改不动它们, 减弱动效的媒体查询也管不到它们.

## Decision

新目录 `src/motion/`, 6 个文件:

- `presets.ts`: `SPRING` (soft / snappy / bouncy 三档物理弹簧), `MOTION_PRESETS` (fade, fadeUp,
  fadeDown, scaleIn, blurIn, slideLeft, slideRight; 只描述 hidden / visible / exit 三态的取值,
  不带时长). `readMotionTokens` 在运行时用 getComputedStyle 读 `--duration-instant..emphasized`
  与 `--ease-out / --ease-in / --ease-in-out / --ease-emphasized`, 只解析 cubic-bezier,
  读不到 (服务端渲染, 令牌缺失, linear() 写法) 时退回 `src/constants/motion.ts` 里与令牌默认值一致的回退.
  `presetVariants` 把预设与节奏 (enter = slow + ease-out, exit = fast + ease-in, emphasized) 合成变体.
- `Reveal.tsx`: whileInView 视口入场, 默认只播一次, 露出 20% 触发.
- `Stagger.tsx`: 容器只下发 staggerChildren 与 delayChildren, `StaggerItem` 继承父状态并决定怎么动.
- `AnimatedNumber.tsx`: useSpring 驱动, 每帧写 textContent 不重渲染, `Intl.NumberFormat` 格式化,
  `tabular-nums` 定宽, sr-only 终值给读屏器, 动画文字 aria-hidden.
- `Transition.tsx`: `PageTransition` (AnimatePresence wait, 首屏默认不播) 与 `FadeSwap`
  (popLayout, 首帧不播), 共用同一个进出场骨架.
- `index.ts`: 桶文件. 接入 `src/index.ts` 归集成分片 Z.

减弱动效: 所有组件经 `useMotionTokens` 取 motion 的 `useReducedMotion`, 为真时过渡换成 0 时长
(数字直接 jump 到终值, 交错间隔归零). hidden 初值保持不变, 服务端与客户端首帧一致, 不触发水合告警.
时长令牌在 tokens.css 的减弱动效媒体查询里本身也归零, 两道保险.

所有 tsx 首行 `"use client"`, 与 SegmentedControl 等既有 motion 组件一致; presets.ts 含 hook, 同样标注.

## Alternatives considered

**什么都不做, 继续由各组件直接调用 motion**: 最强的理由是零新增 API, 每处调用可以按场景精调,
而且已有四处用法工作正常. 否决理由: 精调的结果正是节奏不统一与时长写死, 新增的画廊, 仪表盘
与效果件会把这种分叉放大十几倍; 收敛成预设后精调仍可通过 preset 与 timing 参数完成.

**复用现有的 `src/primitives/motion.ts` (FLIP 与 MotionPresence) 往上长**: 最强的理由是它已经
处理了减弱动效且不依赖 motion 运行时, 体积更小. 否决理由: 它基于 Web Animations 做位移与淡入淡出,
没有视口观察, 交错编排与弹簧, 要补齐等于重写一套 motion 已有的能力; 两者并存, 前者继续服务布局位移.

**纯 CSS 关键帧 (S0 的 hx-fade-up 等) 加 animation-delay 做交错**: 最强的理由是无 JS 也能动.
否决理由: 离场动画, 视口触发与数字插值都需要 JS; 关键帧仍保留给不需要编排的场景.

**把时长写成常量而不读令牌**: 最强的理由是简单且可在服务端确定. 否决理由: 与令牌脱节正是要解决的问题.

## Consequences

**变好的**: 全库表现型动效共享一套节奏, 改 tokens.css 即全局生效; 减弱动效在一处兜住;
文档页给出每个组件的可交互示例.

**变差的**: 令牌只在组件挂载时读一次, 运行中改令牌要等组件重新挂载才生效; 首帧固定 hidden,
无 JS 环境下 Reveal 包裹的内容不可见, 首屏关键内容不应放进 Reveal.
