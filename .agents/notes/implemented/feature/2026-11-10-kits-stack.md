# Agent Note: 叠放族 (kits/stack) 用 DOM 与 craft 弹簧自写

Status: implemented

Decision-ID: kits-stack

## Code

- `src/kits/stack/tokens.ts`, `src/kits/stack/index.ts`
- `src/kits/stack/PopList.tsx`, `src/kits/stack/parts/list-spec.ts` (react-bits Components/AnimatedList)
- `src/kits/stack/ScrollPile.tsx`, `src/kits/stack/parts/pile-spec.ts` (react-bits Components/ScrollStack)
- `src/kits/stack/SwipeStack.tsx`, `src/kits/stack/parts/swipe-spec.ts` (react-bits Components/Stack)
- `src/kits/stack/CycleDeck.tsx`, `src/kits/stack/parts/swap-spec.ts` (react-bits Components/CardSwap)

## Problem

L5 kits 层缺一组叠放与网格件: 动画列表, 滚动叠卡, 拖拽牌堆, 轮换卡组, 弹开卡片, 瀑布流, 聚光网格, 便当格. 行为规格在 docs/research/catalog/components-1.md 与 components-2.md 的 AnimatedList, ScrollStack, Stack, CardSwap, BounceCards, Masonry, ChromaGrid, MagicBento 条目里 (目录的裁决多为借鉴, 计划已由用户确认, 照计划落地). 上游许可不允许移植再分发, 只把条目里的常数, props 和行为描述当规格, 用本库引擎重写, 组件名换成本库自己的.

## Decision

全部用 DOM, CSS 变换与 craft 弹簧实现, 不引动画库. 规格里用 omega / zeta 写的弹簧经 tokens.ts 的 omegaSpring 换成 craft 的劲度与阻尼 (质量 1), "劲度 + 回弹度" 写法经 bounceSpring 换算. 族内共用的过渡串, 动值循环 (useKitMotion), 拖拽 (useDrag, 5px 阈值) 从画廊族转出. 曲线一律引用 src/motion/curves.ts 的 CURVE, 焦点环用 craft 的 FOCUS_RING, 颜色 props 只收语义 token. 规格里没给出数值的常数标 "HX 自定". 减弱动效时位置直接落定, 不做入场, 不自动播放.

kits 的总出口 src/kits/index.ts 与 ./kits 子路径在收口一步统一接, 本批只维护本族 index.ts.

各件段落写明哪些规格 props 未做.

## PopList (规格 Components/AnimatedList)

列表项滚进视口时按批错峰入场: 同一次视口回调里进来的项按序号排, 每项延迟 stagger (默认 0.05s) 只加在位移与透明度上, 模糊不延迟 (规格 transitionDelay "d, d, 0s"). 过渡为位移 620ms 回弹缓出 (CURVE.backOutSoft, 规格 (0.34, 1.4, 0.64, 1)), 透明度 300ms outQuint, 模糊 200ms ease. animation 取 pop (缩小加模糊), slide (下移), fade, none; 未入场姿态的具体数值规格未给, HX 自定. animateOnce 为假时滚出视口收回, 再进来重放. 选中底板以弹簧 (380 / 34, HX 自定; 规格只给了 240Hz 细分) 跟随选中项的位置与高度. 悬停可选中 (selectOnHover), 方向键与 Home / End 移动并滚到可见, loop 时首尾相接, Enter 与点击回调 onItemSelect. 上下渐隐层按距边缘 fadeSize (56px) 的比例淡出, 过渡 200ms ease. 读屏语义为 listbox 与 option, aria-activedescendant 指向选中项. theme 与 accentColor 换成语义色 accentTone. 减弱动效时全部直接在位, 无过渡, 底板跳到位.

## ScrollPile (规格 Components/ScrollStack)

卡片在自己的滚动容器里纵向排开 (间距 itemDistance 100px). 第 i 张在滚动到 布局上沿 - 钉住线 - i × itemStackDistance (24px) 时钉住, 之后补位移停在线上, 直到最后一张钉住再过 holdDistance (200px) 整叠一起离开. 钉住线 stackPosition 收 px 或视口百分比 (默认 15%). 被后面的卡盖上的进度 p 从自己钉住到末张钉住线性走完, 卡缩到 baseScale + i × itemScale (0.8, 0.05), 压暗 dimAmount × p (亮度滤镜), rotationAmount × i × p 转动, tiltAmount × p 后仰, 已被几张盖住就模糊 blurAmount 的几倍. 滚轮在 smoothScroll 时接管, 位置按规格 current += (goal - current)(1 - 0.9^(dt × 60)) 帧率无关地追目标; 拖滚动条, 触摸或键盘带来的外部滚动立即放弃平滑. 末张钉住时 onStackComplete 回调一次. useWindowScroll (跟随页面滚动) 与 snap 未做. 减弱动效时滚轮交给原生滚动, 无模糊, 转动与后仰, 钉住与缩放保留 (随滚动位置, 不是动画).

## SwipeStack (规格 Components/Stack)

一叠卡, 顶牌可拖: 跟手位移, 按横向位移倾斜 (LEAN_REACH 260px 时满幅 12 度, 幅度 HX 自定), 按住放大 1.035 (PRESS_SCALE). 松手时拖过 threshold (90px) 或速度超过 650px/s (FLICK_SPEED) 就顺拖拽方向飞出, 0.35s / speed 后换到底部再以弹簧回槽, 否则带松手速度弹回. 点击 (sendToBackOnClick), 方向右键, Enter, 空格与自动播放 (autoplayDelay 3000ms, pauseOnHover, 页面隐藏时不送) 按布局的 EXITS 方向送牌, 左键把底牌抽回顶. 布局 fan / cascade / deck / pile 的变换原点取规格 ORIGINS, 槽位几何 (每层错开 56px × spread, 缩小 0.16 × depth, fan 末层转 tilt × spread, pile 按序号稳定歪斜) 规格未给数值, HX 自定. 挂载时逐张错峰 60ms 就位. 弹簧劲度与阻尼按 speed 缩放 (基值 260 / 26, HX 自定; 规格用 motion 默认弹簧). 阴影用主题 token --shadow-xl (规格 SHADOW 是硬编的黑色两层影, 色值不进组件). 拖拽起算用族阈值 5px (规格 CLICK_SLOP 6px). 顶牌变化时读屏播报其 label, 回调 onChange(顶牌序号). frameColor 换成语义色 frameTone. 减弱动效时送牌直接换序, 无飞出与错峰 (规格为 0.2s 淡变).

## CycleDeck (规格 Components/CardSwap)

卡片在透视 900px 的台面上沿右上斜向纵深排开 (每层 cardDistance 60px, verticalDistance 70px, 纵深 1.5 倍横距), 统一 skewY. 每隔 delay (默认 4000ms, 下限 400ms) 最前一张按离场弹簧落出台面下沿 (卡高 + PAD 32px), 450ms / speed 后排到最后; 其余同时按 0.05s / speed 错峰前移 (规格 card.hold). 最前一张可拖, 松手时拖过卡片短边的 0.3 或速度超过 700px/s 即换牌, 否则弹回. 指针在台面上带动整台视差 (满幅 8 度, HX 自定), 弹簧 omega 2pi × 1.1, zeta 1; 悬停张开到 1.15 倍, 弹簧 omega 2pi × 1.4, zeta 0.9 (规格同). 离场弹簧临界阻尼 omega 2pi × 1.6, 归位 omega 2pi × 1.2 zeta 0.72, 规格只给了名字, 数值 HX 自定, 都乘 speed. 悬停 (pauseOnHover), 聚焦, 拖拽, 离屏 (IntersectionObserver) 与页面隐藏时暂停. 挂载时整台淡入 420ms ease-out. Enter 与右键手动换牌, 点击回调 onCardClick, 换牌回调 onChange 并播报前牌 label. 规格的 THEMES 与 DEFAULT_ITEMS 视觉主题不取. 减弱动效时不自动轮换, 无视差与张开, 换牌直接到位.
