# Agent Note: surface 层显露与切换族 (surface/reveal) 与 Reveal 的 cloak / scrub

Status: implemented

Decision-ID: surface-reveal

## Code

- `src/surface/reveal/TileFlip.tsx`
- `src/motion/Reveal.tsx`

## Problem

react-bits Animations 目录 (docs/research/catalog/animations.md) 里有一组 "进入视口显露" 与 "两面切换" 的条目: AnimatedContent, FadeContent, PixelSwap, PixelTransition, ScrollExpand, GradualBlur, HalftoneReveal, DitherVeil. 其中 AnimatedContent 与 FadeContent 和现有 `src/motion/Reveal.tsx` 重叠. 上游是 MIT 加 Commons Clause, 只能把条目里的常数, props 和行为描述当规格, 用本库引擎重写, 名字与注释用本库自己的.

## Decision

重叠的两条不另起组件, 在 Reveal 上加两个默认关闭的可选 prop, 默认行为不变:

- `cloak`: 未入场时同时 visibility hidden, 防首帧闪, 入场前不可聚焦 (规格的 "防闪 visibility").
- `scrub` / `scrubEnd`: 进度跟滚动走, 可正可反 (规格的 "可 reverse 的进度"). scrub 分支单独成内部件 ScrubReveal, 不开 scrub 的 Reveal 不挂滚动监听; 插值键固定为 opacity / x / y / scale / filter, 两端取自预设. 减弱动效时直接落在 visible.

其余四条在 `src/surface/reveal/` 新建组件, 动效只走 src/motion (useFrameLoop, spring/fit, spring/step, spring/follow, 不自起 rAF). 条目到落点:

| 规格条目 | 落点 | 取舍 |
| --- | --- | --- |
| AnimatedContent | `Reveal` 的 cloak, scrub, scrubEnd | distance / direction / scale / blur 由 preset 覆盖 (fadeUp, slideLeft, scaleIn, blurIn 等); threshold 即 amount; delay, once 原有; stagger 用现有 Stagger; reverse 即 once=false; disappearAfter, wipe, tilt, rotate 不落地 (通用滑入不进首页). |
| FadeContent | `Reveal` 的 cloak, scrub (preset fade / blurIn) | 噪声遮罩 (SVG feTurbulence 的 LEVELS 阶梯) 不落地; 跟随平滑由 scrub 的滚动进度承担. |
| PixelSwap | `TileFlip` | 每格一路解析弹簧 (pixelDuration 350ms + bounce 0.3 经 spring/fit), 起步 = (顺序 - 最早) * duration 400ms, 方块并集写成 clip-path path(), 半径 min(x * 1.08, 1.25) * (半格 + 留白 * smoothstep(0.6, 0.93, x)), 总数上限 600. 图案默认 pointer (从指针进入处扩散). pixelRadius, pixelScale 不落地; pixelSpin 落地为每格旋转. |
| PixelTransition | `MosaicSwap` | 进度每秒 1 / (2 * duration), 前半盖上后半揭开, 每块窗口 0.35, dither 用 4x4 Bayer; pop / fade / scale 三种动画, square / circle 两种形状, fps 阶梯推进, once. 方块是 DOM 色块 (bg-current + 色调类), pixelColor 换成 tone, mosaic 不落地. |
| ScrollExpand | `ScrollWiden` | 展开曲线 smoothstep(0, 1, p), 标题 0.4 到 0.88 淡出, 提示 0 到 0.12 消失, 内容 0.68 到 1 进场, 进度一阶跟随 (smoothing 0.1s). 只跟窗口滚动, useWindowScroll 不再需要. |
| GradualBlur | `EdgeBlur` | layers 层 backdrop-filter, 每层遮罩只露自己那段, 指数分布 2^(4t) - 1; 悬停乘 hoverIntensity, CSS 过渡 duration 0.3s. tint 换成 tone, target='page' 换成 fixed, autoHide 与 zIndex 不落地. |
| HalftoneReveal, DitherVeil | 待接 backdrop 内核后补 | 着色器件, 等 `src/surface/backdrop/kernel` 提交后接在它的 WebGL2 渲染器上, 届时本表补行. |

颜色只收色调名 (src/surface/pointer/tone.ts), 落成 text-* 语义类.

## Alternatives considered

- 什么都不做 / 复用现有: 最强理由是 Reveal 与 Stagger 已覆盖通用入场. 否决: 它们没有防闪 visibility 与可倒放的滚动进度, 也没有方块切换, 滚动展开, 渐进模糊这些画面; 用户要求每条目都有落点.
- 为 AnimatedContent / FadeContent 另起组件: 最强理由是 props 可以与规格一一对齐. 否决: 与 Reveal 职责重叠, 两套入场会在同一页面上手感不一; 加可选 prop 默认行为不变.
- TileFlip / MosaicSwap 用画布逐帧画: 最强理由是方块多时更省 DOM. 否决: 画布件要走 backdrop 内核, 而两面内容本身是 DOM; clip-path 并集与 DOM 色块让内容保持可读可选, 方块数有上限.

## Consequences

导出入口由主线统一接. ENGINE-GAP: src/motion 没有 GSAP 的 power / back 曲线族, Reveal 的 scrub 用 motion/react 的 useScroll 与 useTransform 线性插值, 不复刻规格的 power3.out; 没有成组弹簧的批量积分, TileFlip 逐格调用 stepSpringExact.
