# Agent Note: 叠放族 (kits/stack) 用 DOM 与 craft 弹簧自写

Status: implemented

Decision-ID: kits-stack

## Code

- `src/kits/stack/tokens.ts`, `src/kits/stack/index.ts`
- `src/kits/stack/PopList.tsx`, `src/kits/stack/parts/list-spec.ts` (react-bits Components/AnimatedList)

## Problem

L5 kits 层缺一组叠放与网格件: 动画列表, 滚动叠卡, 拖拽牌堆, 轮换卡组, 弹开卡片, 瀑布流, 聚光网格, 便当格. 行为规格在 docs/research/catalog/components-1.md 与 components-2.md 的 AnimatedList, ScrollStack, Stack, CardSwap, BounceCards, Masonry, ChromaGrid, MagicBento 条目里 (目录的裁决多为借鉴, 计划已由用户确认, 照计划落地). 上游许可不允许移植再分发, 只把条目里的常数, props 和行为描述当规格, 用本库引擎重写, 组件名换成本库自己的.

## Decision

全部用 DOM, CSS 变换与 craft 弹簧实现, 不引动画库. 规格里用 omega / zeta 写的弹簧经 tokens.ts 的 omegaSpring 换成 craft 的劲度与阻尼 (质量 1), "劲度 + 回弹度" 写法经 bounceSpring 换算. 族内共用的过渡串, 动值循环 (useKitMotion), 拖拽 (useDrag, 5px 阈值) 从画廊族转出. 曲线一律引用 src/motion/curves.ts 的 CURVE, 焦点环用 craft 的 FOCUS_RING, 颜色 props 只收语义 token. 规格里没给出数值的常数标 "HX 自定". 减弱动效时位置直接落定, 不做入场, 不自动播放.

kits 的总出口 src/kits/index.ts 与 ./kits 子路径在收口一步统一接, 本批只维护本族 index.ts.

各件段落写明哪些规格 props 未做.

## PopList (规格 Components/AnimatedList)

列表项滚进视口时按批错峰入场: 同一次视口回调里进来的项按序号排, 每项延迟 stagger (默认 0.05s) 只加在位移与透明度上, 模糊不延迟 (规格 transitionDelay "d, d, 0s"). 过渡为位移 620ms 回弹缓出 (CURVE.backOutSoft, 规格 (0.34, 1.4, 0.64, 1)), 透明度 300ms outQuint, 模糊 200ms ease. animation 取 pop (缩小加模糊), slide (下移), fade, none; 未入场姿态的具体数值规格未给, HX 自定. animateOnce 为假时滚出视口收回, 再进来重放. 选中底板以弹簧 (380 / 34, HX 自定; 规格只给了 240Hz 细分) 跟随选中项的位置与高度. 悬停可选中 (selectOnHover), 方向键与 Home / End 移动并滚到可见, loop 时首尾相接, Enter 与点击回调 onItemSelect. 上下渐隐层按距边缘 fadeSize (56px) 的比例淡出, 过渡 200ms ease. 读屏语义为 listbox 与 option, aria-activedescendant 指向选中项. theme 与 accentColor 换成语义色 accentTone. 减弱动效时全部直接在位, 无过渡, 底板跳到位.
