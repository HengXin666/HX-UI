# Agent Note: 滚动联动, 视差, 粘性叙事, 轮换词, 逐字入场与区块入场编排

Status: implemented

Decision-ID: scroll-motion-orchestration

## Code

- `src/motion/orchestration.ts`
- `src/constants/motion.ts`
- `docs/src/pages/motion/ScrollMotionSection.tsx`

## Problem

视觉审计 (docs/reference/2026-ui-library-visual-audit.md) E8 滚动联动与 E9 粘性叙事判为 "不能",
E10 区块入场编排判为 "勉强": 动效引擎只有 IntersectionObserver 驱动的 Reveal / Stagger, 没有滚动进度,
视差, scrollytelling, 轮换词与逐字入场, 区块层每次都要手算眉标, 标题, lead, CTA, 媒体的延迟.

## Decision

在 `src/motion/` 新增 6 个文件, 全部建在既有 motion 引擎 (`useMotionTokens`, `presetVariants`, `FadeSwap`) 之上, 不加依赖:

- `ScrollProgress.tsx`: `useScrollProgress` (0 到 1 的 MotionValue, 可指定容器 / 跟踪元素 / 轴向),
  `useScrollProgressValue` (普通数值), `ScrollProgress` 进度条 (scaleX + 弹簧平滑, 可选 progressbar 语义).
- `Parallax.tsx`: 外层测量, 内层按进度位移 [-d, +d], 正中归位; 速度因子与 up / down / left / right 方向.
- `StickyScroll.tsx`: CSS sticky 媒体 + 分步内容, 每步 useInView 压视口正中线判定当前步, `onStepChange`, 媒体经 FadeSwap 切换.
- `RotatingText.tsx`: 定时或按滚动进度均分换词, FadeSwap popLayout 换场, sr-only 完整列表.
- `SplitText.tsx`: 逐字 (Array.from) 或逐词拆分, 方向映射到 fadeUp / fadeDown / slideLeft / slideRight 预设, staggerChildren 排步长.
- `orchestration.ts`: `ORCHESTRATION_PRESETS` (hero, split, mediaFirst, compact) 与 `orchestrate` / `useOrchestration`,
  间隔读 `--stagger-step` 令牌 (V0-01 引入), 读不到回退 `STAGGER_GAP_S`.

prefers-reduced-motion: 视差不挂位移; 进度条不缩放不走弹簧, 改百分比宽度静态贴合; 轮换词只显示第一个且不建定时器;
SplitText 不拆分直接渲染原文; 编排延迟归零; StickyScroll 的粘住是布局照常保留, 只是切换无过渡.
字面量进 `src/constants/motion.ts` (SCROLL_OFFSET, MOTION_DIRECTION, PARALLAX_*, STICKY_*, ROTATE_*, SPLIT_*, ORCHESTRATION_ROLE, SCROLL_DOC).
`src/index.ts` 未改: 根导出由集成分片统一接入, 本次只扩 `src/motion/index.ts`.
文档示例为 `ScrollMotionSection`, 挂在 MotionPage 末尾, 不新增路由.

## Alternatives considered

**什么都不做, 由区块层直接调用 motion 的 useScroll / useTransform**: 最强理由是 motion 已提供这些原语, 零新增 API.
否决: 减弱动效, 测量层与位移层分离, 读屏器处理在每个区块里都要重做一遍, 正是 motion-engine 一篇要收敛的分叉.

**复用现有 Reveal / Stagger 扩参数**: 最强理由是不增文件. 否决: 二者是视口触发的一次性入场, 滚动联动是持续映射, 语义不同, 硬塞会让 Reveal 的参数表失控.

**纯 CSS scroll-driven animations (animation-timeline: scroll())**: 最强理由是零 JS, 合成器线程运行. 否决: Safari / Firefox 支持不完整, 且 onStepChange 与按进度换词需要 JS 回调.

## Consequences

**变好的**: E8 / E9 / E10 有了库级实现, 区块层用 `useOrchestration("hero")` 一行拿到延迟.

**变差的**: 编排间隔在挂载时读一次令牌, 运行中改令牌需重挂载; StickyScroll 每步一个观察器, 步数很多 (>20) 时应改为单观察器.
