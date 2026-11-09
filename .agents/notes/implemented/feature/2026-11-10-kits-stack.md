# Agent Note: 叠放族 (kits/stack) 用 DOM 与 craft 弹簧自写

Status: implemented

Decision-ID: kits-stack

## Code

- `src/kits/stack/tokens.ts`, `src/kits/stack/index.ts`
- `src/kits/stack/PopList.tsx`, `src/kits/stack/parts/list-spec.ts` (react-bits Components/AnimatedList)
- `src/kits/stack/ScrollPile.tsx`, `src/kits/stack/parts/pile-spec.ts` (react-bits Components/ScrollStack)
- `src/kits/stack/SwipeStack.tsx`, `src/kits/stack/parts/swipe-spec.ts` (react-bits Components/Stack)
- `src/kits/stack/CycleDeck.tsx`, `src/kits/stack/parts/swap-spec.ts` (react-bits Components/CardSwap)
- `src/kits/stack/SpreadCards.tsx`, `src/kits/stack/parts/bounce-spec.ts` (react-bits Components/BounceCards)
- `src/kits/stack/FlowMasonry.tsx`, `src/kits/stack/parts/masonry-spec.ts` (react-bits Components/Masonry)
- `src/kits/stack/TintGrid.tsx`, `src/kits/stack/parts/chroma-spec.ts` (react-bits Components/ChromaGrid)
- `src/kits/stack/GlowBento.tsx`, `src/kits/stack/parts/bento-spec.ts` (react-bits Components/MagicBento)

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

## SpreadCards (规格 Components/BounceCards)

一排照片卡以中间为轴横向错开 spread (85px), 转角按交替系数 1, 0.5, -0.3, -1, 0.2 乘 rotation (10 度; 规格 PATTERN 的形状), arc 让两侧沿抛物线下沉; poses 可整组覆盖 (规格 transformStyles 收 CSS 串, 这里收 x, y, 转角数值). 挂上后延迟 animationDelay (0.5s) 按 animationStagger (0.06s) 错峰从 0 弹出, 劲度 170; 指针或焦点停在一张上时它摆正并放大 hoverScale (1.06), 两侧各推开 pushDistance (160px), 劲度 210. 两档弹簧的阻尼都按规格 2 (1 - 0.85 bounciness) sqrt(劲度), bounciness 默认 0.6. 阴影随悬停加深, 过渡 0.3s ease, 阴影用主题 token. 每张是按钮, 方向键左右移焦, 点击回调 onCardClick. borderColor 换成语义色 borderTone. 减弱动效时不弹出, 换位直接到位.

## FlowMasonry (规格 Components/Masonry)

卡片按 高 / 宽 比 (ratio) 依次放进当前最矮的一列, 列数可固定, 不给时按容器宽自动 (1500 / 1000 / 600 / 400px 断点取 5 / 4 / 3 / 2 列, HX 自定). 容器宽 (ResizeObserver) 或项变化时各卡以弹簧换位, omega 取规格的 2pi / duration (duration 默认 0.6s), zeta 规格未给数值, HX 取 1 (换位不过冲), 换位保留速度. 容器进入视口时逐张错峰 stagger (0.05s) 从 animateFrom 方向 (bottom / top / left / right / center / random) 偏移 80px 飞入 (规格从视口外飞入, 这里改为固定距离), 同时每张在 duration 内按三次缓出揭开透明度, blurToFocus 时模糊从 12px 收到 0 (规格同式). 悬停缩放 hoverScale (0.95) 0.25s, 阴影 0.5s, 曲线为新增的 CURVE.settle (规格 (0.2, 0.8, 0.2, 1)). 有 href 的项渲染为链接, 否则为按钮, 点击回调 onItemClick. 规格的 colorShiftOnHover 与图片视差 (PARALLAX) 未做. 减弱动效时直接在位, 无飞入, 揭开与换位动画.

## TintGrid (规格 Components/ChromaGrid)

卡片网格 (columns 3, 每列至少 minCardWidth 180px, gap 12px, 卡片 aspectRatio 3 / 2, 圆角 22px) 上盖一层不接指针的去色层: backdrop-filter grayscale(grayscale) brightness(1 - dim) (默认 1 与 0.12). 指针在网格上时去色层的遮罩在指针处挖出半径 radius (260px) 的圆, 内圈 (1 - softness) 全透, 外缘渐到全遮 (softness 0.6), 露出原色. 圆心按时间常数 damping × 0.32 s (damping 0.45, 下限 0.01s) 追指针, 写法同规格 1 - exp(-dt / tau). 显色强度乘到半径上, 指针进入时以 0.2s 升起 (HX 自定, 规格只给了回落), 离开时以 fadeOut (0.6s) 回落到全遮. reveal 取 card 时去色层整层全遮, 只把悬停或聚焦的卡抬到层上方显色. 悬停或聚焦的卡带随指针移动的内辉光 (不透明度 glow 0.5) 与边框辉光 (borderGlow 1, 色由 tone 定, color-mix 到 --border), 过渡 0.3s ease; 去色层滤镜过渡 0.25s ease. 遮罩用 black / transparent 关键字, 不写色值. 每张卡有 href 时为链接, 否则为按钮, 点击回调 onItemClick; showInfo 显示标题, 副标题与 handle. 规格的 frame 外框未做. 减弱动效时聚光直接贴指针, 显色即开即关.

## GlowBento (规格 Components/MagicBento)

便当格: columns (4) 列, 行高 rowHeight (200px), gap 12px, 圆角 20px; 容器窄时按每格最窄 MIN_CELL 150px 减列, 跨两列以上的格合宽不到 MIN_PAIR 200px 收成一列 (span.col / span.row 给跨格). 指针下一团半径 spotlightRadius (300px) 的光斑, 圆心以 tau 0.05s 追指针, 亮起 tau 0.12s, 熄灭 0.4s; 离光斑圆心 spotlightRadius 内的格子边框按到格子矩形的距离线性发光 (边框辉光用 mask exclude 只露 2px 边). 悬停或聚焦格的热度升 tau 0.14s 降 0.32s (规格同), 驱动格底色混入主题色 6% × 热度 (过渡 200ms ease), enableTilt 时按格内指针倾斜至多 TILT 6 度, enableMagnetism 时吸附至多 MAGNET 6px, 都乘热度. 帧间隔上限 0.05s. intro 时容器 15% 可见后逐格错峰 STAGGER 80ms 入场: 透明度 420ms CURVE.outQuint, 位移与缩放 760ms CURVE.backOutSoft (规格 --mb-spring 同值); 起点下移 16px 缩 0.96 是 HX 自定. clickEffect 在点击处放一圈直径为格对角线两倍的波纹, 1.1s (规格 wave.duration) 放大淡出后移除. textAutoHide 时描述限两行. 有 href 的格为链接, 否则为按钮, 点击回调 onItemClick. 不做: enableStars 与 particleCount (要 canvas 粒子), 规格的 THEMES 主题与格内插画动画 (draw / grow / packet 等关键帧). 减弱动效或 disableAnimations 时无入场, 倾斜, 吸附与波纹, 光斑直接贴指针.
