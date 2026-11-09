# Agent Note: 画廊族 (kits/gallery) 用 DOM 与 craft 弹簧自写

Status: implemented

Decision-ID: kits-gallery

## Code

- `src/kits/gallery/tokens.ts`, `src/kits/gallery/index.ts`
- `src/kits/gallery/FoldGallery.tsx` (react-bits Components/AccordionGallery)

## Problem

L5 kits 层缺一组画廊件: 手风琴, 弹簧轮播, 环形轮播, 弯曲长廊, 纵深轮播, 穹顶墙, 弹性轮播, 变形幻灯, 螺旋, 飞行海报, 漂移墙. 行为规格在 docs/research/catalog/components-1.md 的 AccordionGallery, Carousel, CircularCarousel, CircularGallery, DepthCarousel, DomeGallery, FlexCarousel, MorphSlider, InfiniteSpiral, FlyingPosters, DriftWall 条目里. 上游许可不允许移植再分发, 只把条目里的常数, props 和行为描述当规格, 用本库引擎重写, 组件名换成本库自己的.

## Decision

全部用 DOM 与 CSS 3D 变换实现, 不引 WebGL 库. 规格里靠着色器的部分 (弯曲网格, 波纹, 色散, 噪声溶解) 不照搬, 在组件里用 ENGINE-GAP 注明缺什么, 换成能在 DOM 上做到的近似.

族内共用: tokens.ts 转出导航族已有的过渡串拼装, 语义色名, 指数趋近, 弹簧积分步与动值循环 (useKitMotion), 并补环上取模与 smoothstep; parts/use-drag.ts 是带阈值 (规格 DRAG_THRESHOLD 5px) 与平滑速度的指针拖拽. 曲线一律引用 src/motion/curves.ts 的 CURVE, 焦点环用 craft 的 FOCUS_RING, 颜色 props 只收语义 token. 减弱动效时位置直接落定, 不做入场, 不自动滚动.

kits 的总出口 src/kits/index.ts 与 ./kits 子路径在收口一步统一接, 本批只维护本族 index.ts.

各件段落写明哪些规格 props 未做.

## FoldGallery (规格 Components/AccordionGallery)

一排面板, 展开项的 flex-grow 取 ratio (n - 1) / (1 - ratio), 使它占总长 expandRatio (默认 0.52), 其余 grow 1; flex-grow 过渡 0.6s outQuart (规格 power3.out). 展开项的色条与标题按 60ms 错峰淡入归位, 收起项左移 14px 用 0.6 倍时长淡出; 未展开项可去色. 悬停或点击切换 (trigger), 焦点进入也切换, 方向键循环移动并移焦. 规格的 parallax 与 tilt (面板内图片随切换位移和转动) 不做, 只做比例与标签. 减弱动效时直接切换.
