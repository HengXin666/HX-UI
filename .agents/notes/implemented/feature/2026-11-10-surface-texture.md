# Agent Note: 叠在内容上的表面质感 (surface/texture)

Status: implemented

Decision-ID: surface-texture

## Code

- `src/surface/texture/tokens.ts`
- `src/surface/texture/parts/grain.ts`
- `src/surface/texture/GrainLayer.tsx`
- `src/surface/texture/index.ts`
- `tests/surface/texture/grain.test.tsx`

## Problem

docs/research/catalog/animations.md 的 Noise 条目是一层按帧率换帧的胶片颗粒, 叠在内容上按混合模式出效果. 条目裁决原为 "不做", 用户 2026-11-10 把它列进 Animations 26 件. 上游许可是 MIT 加 Commons Clause, 只把条目的常数与 props 当规格, 自写自命名.

## Decision

| 条目 | 落点 | 参数 |
| --- | --- | --- |
| Noise | `GrainLayer` | 贴片 `TILE` 256px, 像素比上限 2; props `opacity` 0.2, `size` 1, `fps` 24, `blendMode` overlay, `contrast` 0.6, `colored`, `dust`, `scratches`, `scanlines`, `flicker`, `fixed`; 本库定: 尘点每帧上限 24 粒 2px, 划痕概率上限 0.6 宽 1px, 扫描线周期 3px 压暗上限 0.5, 闪烁下探上限 0.5, `seed` |

做法:

- 每出一帧只重写一块 256 x 256 的贴片像素 (颗粒, 尘点, 竖向划痕, 扫描线全写进 ImageData), 再以 repeat 图案铺满画布, 图案原点随机平移, 看不出贴片接缝.
- 颗粒是灰度或三通道随机的数值, 不经颜色串, 也不写色值; 混合模式决定它在亮暗皮肤上的观感.
- 帧节拍按 fps 累加出帧 (`frameDue`), 不是每个 rAF 都重画. 帧循环 `active` = 在视口内, fps > 0 且不减弱动效; 页面隐藏停帧.
- 装饰层 aria-hidden, pointer-events none; `fixed` 时铺满视口, 否则铺满最近的定位祖先.
- 减弱动效: 只画一帧, 不换帧不闪烁.

## Consequences

- 尘点, 划痕, 扫描线的具体形状规格没给数值, 由本库定 (上面已标).
