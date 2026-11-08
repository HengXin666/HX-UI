# Agent Note: 文本动效族的滚动与循环意图 (surface/text/scroll)

Status: implemented

Decision-ID: surface-text-scroll

## Code

- `src/surface/text/scroll/tokens.ts`
- `src/surface/text/scroll/ScrollText.tsx`
- `src/surface/text/scroll/TextMarquee.tsx`
- `src/surface/text/scroll/OrbitText.tsx`
- `src/surface/text/scroll/index.ts`
- `tests/surface/text/scroll.test.tsx`

## Problem

docs/research/catalog/textanimations.md 里有六个条目由滚动或常驻循环驱动: ScrollFloat, ScrollReveal (滚动刮擦), ScrollVelocity, CurvedLoop, TextLoop (沿路径循环的条带, 受滚动速率影响), CircularText (环形常转). 条目的上游实现多是 GSAP ScrollTrigger 时间轴或自写积分, 不可中断或不保留速度. 上游许可是 MIT 加 Commons Clause, 只把条目的常数, props 和行为描述当规格, 用本库引擎重写.

## Decision

条目到落点:

| 条目 | 落点 | 参数 |
| --- | --- | --- |
| ScrollFloat | `ScrollText` | `effect="float"` (默认): 按字, `stagger` 0.03, `duration` 1, `distance` 120px, `stretch` 2.3 (scaleY 从 2.3 回到 1), 透明度在单元进度 0.05 到 0.55 之间 smoothstep 淡入, `order`, `smoothing`, `start` / `end` (滚动区间), `scrollContainerRef` |
| ScrollReveal | `ScrollText` | `effect="reveal"`: 按词, `stagger` 0.05, 刮擦单元跨度 0.5, `baseOpacity` 0.1, `blurStrength` 4, `enableBlur`, `baseRotation` 3 度 (整段回正, enter 模式最长 1.4s), `mode` scrub / enter (enter 时长 0.8s), `highlightClassName` |
| ScrollVelocity | `TextMarquee` | `shape="line"` (默认): `speed`, `direction`, `scrollBoost` (滚动速率叠加到速度上), `followScroll` (方向随滚动方向翻转), `pauseOnHover` |
| CurvedLoop | `TextMarquee` | `shape="arc"`: 画布 1440 x 120, `curveAmount` 400, 甩出上限 4000 单位/秒, 滚动速率跟随上升 10 / 回落 2.4 (1/秒), 速度靠拢速率 3, 拖拽速度估计新旧各半, `edgeFade`, `separator`, `fontSize`, `draggable` |
| TextLoop | `TextMarquee` | `shape="wave"` (波长 960, `curviness` 90) 或自定 `path` + `viewHeight`; 甩出按 0.55s 时间常数衰减, `draggable`, `pauseOnHover`, `scrollBoost` |
| CircularText | `OrbitText` | `spinDuration` 20s, `onHover` slowDown 0.5 / speedUp 4 / pause 0 / goBonkers 20 (速度倍数弹簧 60 / 18), goBonkers 时缩放弹簧 300 / 20, `direction`, `size` 200, `startAngle`, `repeat`, `draggable` (甩出上限 1440 度/秒, 0.7s 时间常数衰减) |

做法:

- ScrollText 的进度来自内核 `useScrollFrame` (滚动事件唤醒 `motion/frame/use-frame-loop`), 可选 `approach` 一阶平滑; 单元进度由内核 `staggerRanks` / `unitProgress` 切, 来回滚动来回走. enter 模式改由内核 `usePlayhead` 的 view 触发播放.
- TextMarquee 每帧只写 textPath 的 startOffset, 不重渲染; 速度向目标用 `approach` 靠拢 (悬停暂停与反向都是改目标, 不跳变), 甩出与滚动加速用 `decay` / `approach`; 帧循环常驻但页面隐藏时停 (TEXT_FRAME).
- OrbitText 的速度倍数与缩放各是一条 `motion/drive/axis`, 用 `stepSpringExact` 解析推进, 刚度阻尼取条目原值; 甩出用 `decay`.
- 颜色: 条带文字 `fill="currentColor"`, 跟随外层的 token 文字类; 边缘淡出的遮罩用 currentColor 的透明度, 不写色值.
- 读屏: 每件一份 sr-only 原文, 视觉层 aria-hidden. 减弱动效: ScrollText 直接显示原文; TextMarquee 与 OrbitText 静止不转, 不能拖.

## Alternatives considered

- 直线条带单独一件 (对应 ScrollVelocity): 否决, 直线只是路径的一种, 速度, 甩出, 滚动加速的状态机与曲线条带完全相同.
- 用 CSS animation 做循环: 否决, 拖拽, 甩出与滚动加速都需要每帧可改的速度, 关键帧不保留速度.
- 复用 src/motion/ScrollProgress 的 useScrollProgress: 最强理由是已有. 否决: 它基于 motion/react 的 MotionValue, 拿不到滚动速度, 而条带要速度.

## Consequences

- 没有落的视觉: ScrollFloat 的 swell / sway / mix 几种效果与颜色过渡, ScrollVelocity 的随速度纵向拉伸与描边字, CurvedLoop 的描边与分隔符着色, TextLoop 的彩带 (ribbon) 与交叉条带, CircularText 的倾斜与外圈环.
- 条带的一份文字长度用 getComputedTextLength 量, 量不到 (测试环境) 时按字号乘 0.6 估.
- ENGINE-GAP: src/motion 没有带速度输出的滚动源; 本批由内核 `useScrollFrame` 自算滚动速度, TextMarquee 也在自己的帧回调里读 scrollY 差分. 若 L1 以后提供滚动速度通道, 两处应改引它.
