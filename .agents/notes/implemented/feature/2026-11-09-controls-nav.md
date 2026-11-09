# Agent Note: 导航族控件 (controls/nav) 用 craft 弹簧与 DOM 自写

Status: implemented

Decision-ID: controls-nav

## Code

- `src/controls/nav/tokens.ts`, `src/controls/nav/parts/use-nav-motion.ts`, `src/controls/nav/index.ts`
- `src/controls/nav/bar/PillTabs.tsx`, `src/controls/nav/bar/parts/pill-spec.ts`, `src/controls/nav/bar/parts/bar-entry.tsx` (react-bits Components/PillNav)
- `src/controls/nav/dock/MagnifyDock.tsx`, `src/controls/nav/dock/parts/dock-math.ts` (react-bits Components/Dock)
- `src/controls/nav/rail/ProximityRail.tsx`, `src/controls/nav/rail/parts/rail-spec.ts` (react-bits Components/LineSidebar)
- `src/controls/nav/bar/GooTabs.tsx`, `src/controls/nav/bar/parts/goo-spec.ts` (react-bits Components/GooeyNav)
- `src/controls/nav/tile/GlassTiles.tsx`, `src/controls/nav/tile/parts/glass-spec.ts` (react-bits Components/GlassIcons)

## Problem

L2 controls 层缺一组导航件: 胶囊导航条, 放大坞, 黏液导航条, 玻璃图标格, 邻近侧栏, 以及四种展开菜单. 行为规格在 docs/research/catalog/components-1.md / components-2.md 的 PillNav, Dock, GooeyNav, GlassIcons, LineSidebar, BubbleMenu, CardNav, StaggeredMenu, FlowingMenu 条目里. 上游许可不允许移植再分发, 只把条目里的常数, props 和行为描述当规格, 用本库引擎重写, 组件名换成本库自己的.

## Decision

按意图分子目录: bar (PillTabs, GooTabs), dock (MagnifyDock), tile (GlassTiles), rail (ProximityRail), menu (PillBurst, DeckNav, LayerDrawer, MarqueeRows). 每个组件文件头写明规格参照的条目原名.

族内共用: tokens.ts 放过渡串拼装, 语义色名, 指数趋近与积分步; parts/use-nav-motion.ts 把弹簧通道 (保留速度, 改目标即中断) 和规格的 1 - exp(-dt / tau) 趋近通道合到一个按需 rAF 里, 每帧直接写 DOM 不重渲.
曲线一律引用 src/motion/curves.ts 的 CURVE (outQuint, lift, popOut, outQuart, outCubic, inQuart, flow) 或 craft 的 EASE, 族内不留 cubic-bezier 副本; GSAP 的 powerN 按 N+1 次多项式对应 (power2 = cubic, power3 = quart, power4 = quint). 焦点环 NAV_FOCUS 即 craft 的 FOCUS_RING (outline 1px + 偏移 2px). 颜色 props 只收语义 token, 线条只画 1px, 禁用透明度 0.45. 减弱动效时位置与透明度直接落定, 不做位移与缩放入场.
规格里 WebGL 着色器场 (GooeyNav 的黏液, GlassIcons 的折射与色散) 本库不做: 黏液改用 SVG 滤镜 (高斯模糊加阈值), 玻璃改用 backdrop-blur 加 1px 高光边, 在各件代码里以 ENGINE-GAP 标出.

## Alternatives considered

- 直接用 GSAP 时间轴: 最强理由是 BubbleMenu, StaggeredMenu 原本就是 GSAP. 否决: 重依赖不进默认安装图, 且时间轴不保留速度, 打断时会跳; 改用 CSS 过渡加 craft 弹簧.
- 照搬 WebGL: 最强理由是视觉还原度. 否决: 导航是常驻件, 每页一个 GL 上下文代价太大, 且失去上下文时要整套回退.

## Consequences

主线接入时从 `src/controls/nav/index.ts` 导出, 本次不改 src/index.ts. use-nav-motion 与 range / press 等族的帧循环是重复实现, 收口时并进 src/motion.

## PillTabs (规格 Components/PillNav)

活动块按弹簧 (bounce 换阻尼比 1 - bounce, 取 thumb 弹簧的刚度与质量) 滑到所选项, 速度越快拉得越宽 (额外宽度上限为本身宽度乘 stretch, 对称铺开). 悬停块按规格时间常数淡入 60ms, 淡出 70ms, 出现时从 0.9 弹到 1; 按下用自己的弹簧 (700 / 30 / 1) 缩到分段按下值. 条目有 href 是链接否则是按钮, 活动项 aria-current=page, 左右方向键与 Home / End 移焦点并跳过禁用项.

## MagnifyDock (规格 Components/Dock)

指针附近的图标按余弦钟形放大 (中心导数为 0, 指针抖动不跳), 每格一根弹簧, 规格默认 0.1 / 150 / 12 并按规格夹取下限; 低质量高阻尼弹簧在 16ms 帧上会数值振荡, 所以积分按 craft 能接受的最细 8ms 子步. 点选后起跳 (上抛走 CURVE.lift, 落地走 CURVE.popOut), 按住 450ms 触发 onItemHold 且这次点击不算选中. 工具栏语义, 漫游 tabindex. ENGINE-GAP: 规格的嵌套菜单要锚点定位与焦点陷阱, 本件只给长按回调.

## ProximityRail (规格 Components/LineSidebar)

竖排条目, 指针靠近的几条按距离衰减 (linear / smooth / sharp) 向右推 maxShift, 刻度线从 tickScale 倍拉到全长; 强度用规格的 1 - exp(-dt / tau) 趋近, tau = smoothing 100ms, 帧长上限交给帧循环. 活动项刻度线恒为全长并用强调色. 键盘聚焦的条目按指针正对处理, 上下方向键与 Home / End 移焦点并跳过禁用项; 条目有 href 是链接. 规格源码没有减弱动效处理, 本件减弱时强度直接落定.

## GooTabs (规格 Components/GooeyNav)

换选时旧胶囊按弹簧缩回, 一串液滴 (默认 15, 上限 32) 沿三次贝塞尔弧线从旧项飞向新项, 飞到一半最细; 新胶囊在 min(最短时长 / 3, 0.12s) 后按弹簧长出, 回弹取 wobble / 2. 液滴时长按规格 max(0.15, base * (0.62 + r * 0.32) + variance * r * 0.6), 随机数用按换选次数播种的 mulberry32, 可复现. 悬停块按 80ms 时间常数淡入淡出. 液滴与胶囊放在同一层, 用 SVG 滤镜 (模糊 2 + gooeyness * 8, alpha 阈值 18 / -7) 粘成一体. ENGINE-GAP: 规格的 WebGL 黏液高光与投影不做. 减弱动效不放液滴, 胶囊直接落定.

## GlassTiles (规格 Components/GlassIcons)

每格一块语义色背板 (tilt 倾斜, offset 错位, circle 右上圆, none) 衬在磨砂玻璃面后; 背板角度与位移按 0.5 + spread 放大, 悬停再放大 1.5 倍. 入场按规格 STAGGER 0.07s 错峰, 用临界阻尼弹簧从下沉 0.1 倍尺寸浮起. 悬停 press 缩到 0.94, lift 抬 0.08 倍尺寸, 都走弹簧, 键盘聚焦同悬停. 标签显隐按规格 0.3s outQuint. 方向键按网格走行列, 越界不动. useReducedMotion 首帧恒为 false, 入场前同步再查 prefersReducedMotion. ENGINE-GAP: 规格的 WebGL 折射, 斜面与色散不做, 玻璃改为 backdrop-blur (frost * 24px) 加 1px 边与渐变光泽.
