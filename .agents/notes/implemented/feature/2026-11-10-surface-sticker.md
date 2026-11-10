# Agent Note: 可揭可拖的贴纸 (surface/sticker)

Status: implemented

Decision-ID: surface-sticker

## Code

- `src/surface/sticker/tokens.ts`
- `src/surface/sticker/parts/peel.ts`
- `src/surface/sticker/PeelSticker.tsx`
- `src/surface/sticker/index.ts`
- `tests/surface/sticker/peel.test.tsx`

## Problem

docs/research/catalog/animations.md 的 StickerPeel 是一张贴纸: 悬停揭起一角, 按下揭得更多, 可拖动, 拖动时托起并摆动. 规格原裁决 "不做", 用户 2026-11-10 把它列进 Animations 26 件. 上游许可是 MIT 加 Commons Clause, 只把条目的常数与 props 当规格, 自写自命名.

## Decision

| 条目 | 落点 | 参数 |
| --- | --- | --- |
| StickerPeel | `PeelSticker` | 帧长 0.001 到 1/30s, 入场 1.1s, 指针平滑 0.045s, 揭起弹簧 3Hz / 0.7 (悬停或按下) 与 3.6Hz / 0.62 (回落), 托起 3.2Hz / 0.55, 摆动回正 1.4Hz / 0.32, 摆动驱动 1.1, 摆角上限 1.2 rad, 拖动惯性衰减 exp(-dt x (1.5 + 9 x friction)); props `width` 200, `rotate`, `peelDirection`, `peelBackHoverPct` 25, `peelBackActivePct` 40, `curlRadius` 12, `lightingIntensity` 0.5, `shadowIntensity` 0.6, `followPointer`, `draggable`, `swing` 1, `friction` 0.5, `intro`, `onDragStart`, `onDragEnd`; 本库定: 力矩 0.002 / (px/s), 托起放大 0.06, 拖动阈值 4px |

做法:

- 揭起退化为沿直线对折: 折线法向指向被揭的一边, 正面图用 clip-path 裁到折线内侧, 背面层是同尺寸的块, 裁到折线外侧后用关于折线的镜像矩阵翻回来. 背面形状用 mask-image 取图本身的 alpha, 透明底贴纸也贴合.
- 背面底色 `var(--muted)`, 折痕处高光 `color-mix(in oklab, var(--background) N%, var(--muted))`, 带宽取 curlRadius; 投影 `drop-shadow` 用 `color-mix(... var(--foreground) ..., transparent)`. 不写色值.
- followPointer 时悬停中的揭起方向一阶跟随指针相对中心的方向. 弹簧全部落定, 不拖动且滑行停下时帧循环停, 指针事件唤醒.
- 减弱动效: 静态贴纸 (只保留 rotate), 不渲染背面层.

ENGINE-GAP: 规格用 96 x 96 网格 (GRID, PAD 0.18) 在顶点着色器里按 curlRadius 把揭起部分卷成圆柱, 并有 gloss / matte / holo 三种表面 (FINISHES) 与 LIGHT_HEIGHT 260 的点光源. backdrop 内核只有全屏片元管线, 没有可位移的网格顶点与第二张贴图, 做不出卷曲与表面光照. 要补: 内核支持带 UV 的细分网格 (约 96 x 96 顶点) 加顶点着色器 uniform, 以及按实例上传一张图片纹理.

## Consequences

- 没有落的: 卷曲 (见 ENGINE-GAP), finish 与 holo 闪光, backColor (改为 `var(--muted)`), 撞边回弹 `bounce`, `initialPosition`, `dpr`.
