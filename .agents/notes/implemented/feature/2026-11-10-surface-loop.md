# Agent Note: 循环行进的条带与轨道 (surface/loop)

Status: implemented

Decision-ID: surface-loop

## Code

- `src/surface/loop/tokens.ts`
- `src/surface/loop/parts/rail.ts`
- `src/surface/loop/MarkRail.tsx`
- `src/surface/loop/parts/orbit.ts`
- `src/surface/loop/OrbitRing.tsx`
- `src/surface/loop/index.ts`
- `tests/surface/loop/{rail,orbit}.test.tsx`

## Problem

docs/research/catalog/animations.md 的 LogoLoop 与 OrbitImages 都是一组件沿固定路线循环行进, 可拖动可甩出, 悬停放慢, 离屏停帧. 上游许可是 MIT 加 Commons Clause, 只把条目的常数, props 和行为描述当规格, 用本库引擎重写, 自命名.

## Decision

| 条目 | 落点 | 参数 |
| --- | --- | --- |
| LogoLoop | `MarkRail` | 速度跟随 `SMOOTH_TAU` 0.25s, 甩出滑行衰减 `GLIDE_TAU` 0.8s, 拖动阈值 6px (过了吞掉一次点击), 甩出上限 4000px/s, 入场每件 0.7s 错峰总量 0.45s, 帧长上限 0.1s, 进视口 0.1; props `speed` 80 / `gap` 40 (本库定), `direction`, `pauseOnHover` + `hoverSpeed`, `draggable`, `fadeEdges`, `scaleOnHover` (0.3s, `cssCurve("outCubic")`), `intro` |
| OrbitImages | `OrbitRing` | 轨道采样 720 点按弧长取位, 前排放大 0.3, 后排缩小 0.45 压暗 0.55, 入场散开 1.3s 淡入 0.45s, 拖动阈值 5px, 速度跟随 0.35s, 甩出滑行 0.7s, 键盘换位 0.45s, 帧长上限 0.1s, 进视口 0.05; props `shape` ellipse / circle / square / star, `baseWidth` 1400, `radiusX` 700, `radiusY` 170, `radius` 300, `starPoints` 5, `starInnerRatio` 0.5, `rotation` -8, `duration` 40, `itemSize` 64, `direction`, `fill`, `easing` linear / ease (每圈三次缓入缓出), `paused`, `pauseOnHover`, `showPath` / `pathWidth` 2 / `pathDash` |

做法:

- MarkRail 一条序列铺成 `copiesNeeded` 份 (至少两份), 每帧只写轨道一个 translate3d, 偏移按序列宽度折回. 第一份是带读屏名的列表, 其余 aria-hidden, 链接 tabIndex -1.
- 悬停与键盘聚焦都放慢到 `hoverSpeed`; 拖动时偏移跟手, 速度一阶平滑 (0.05s), 松手后按甩出速度滑行再衰减. 指针过阈值才 capture, 原生拖图被禁.
- 帧循环 `active` = 在视口内且不减弱动效, `pauseWhenHidden` 页面隐藏停帧.
- OrbitRing 用 viewBox 坐标 (baseWidth 宽) 定位, 外框按 aspect-ratio 随容器缩放, 件的 left / top 写百分比; 层级按前后排深度. 拖动把横向位移折成弧长比例, 前排跟手方向一致. 左右方向键各换一位 (外框可聚焦, 焦点环 FOCUS_RING).
- 两侧渐隐用 mask-image 的 transparent 与 currentColor, 只取透明度, 不写色值.
- 减弱动效: 首帧同步查 `prefersReducedMotion()`, 只渲染一份, 不动, 容器 overflow-x auto 可横向滚动.

## Alternatives considered

- CSS keyframes 跑马: 否决, 做不了速度一阶跟随, 拖动与甩出.

## Consequences

- 没有落的: LogoLoop 的视觉主题, 放大镜效果 (mag / magU 两条跟随), 跟页面滚动叠加速度 (scrollVel 0.18s), 程序化 seek / move; OrbitImages 的 customPath (要 SVG getPointAtLength, 未收), `pathColor` (改为 text-border 语义类), width / height props (改为铺满容器宽, 高由 aspect-ratio 定).
