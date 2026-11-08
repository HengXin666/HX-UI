# Agent Note: surface 背景族 particles 路 (surface/backgrounds/particles)

Status: implemented

Decision-ID: surface-backgrounds-particles

## Code

- `src/surface/backgrounds/particles/index.ts`
- `src/surface/backgrounds/particles/tokens.ts`
- `src/surface/backgrounds/particles/Particles.tsx`

## Problem

L3 surface 层要落地 react-bits 的 Backgrounds 全族. particles 路收以粒子 / 实体为主角的九件: Particles, Galaxy, Hyperspeed, Antigravity, Ballpit, AeroShards, GhostFibers, MagnetLines, GradientBlinds. 上游是 MIT 加 Commons Clause, HX-UI 以 Apache-2.0 发包, 不能移植; 只把 docs/research/catalog/backgrounds-1.md 与 backgrounds-2.md 条目里的常数, props 和行为描述当规格, 在 backdrop 内核上自写, 组件名沿用条目名, 注释与实现都是本库自己的. 条目末尾的 "裁决: 不做" 已被作废.

## Decision

渲染只走 `src/surface/backdrop/kernel`: 全屏片元能表达的场 (星空, 公路, 百叶) 用 useShaderBackdrop, 要逐个实体积分或排序的 (点云, 球池, 碎片, 磁针) 用 useCanvasBackdrop 自己投影. 内核没有实例化顶点 / 点精灵通道, 3D 件一律做简化版并在文件头写 ENGINE-GAP. 颜色只收 token 名或用户 prop, 2d 画布用 tokens.ts 的 inkOf 把解析出的 sRGB 写成 color(srgb ...) 串; 着色器用 paletteUniform 摊成 vec3 数组. 公共 speed 是内核时钟倍率 (默认 1), 各件把规格默认速度折进本件常数, 使 speed=1 对应条目默认观感. 本路公共工具 (取色, 种子随机, 一阶跟随, 入场进度) 在 tokens.ts.

条目到组件:

| 规格条目 | 组件 | 取舍 |
| --- | --- | --- |
| Particles | `Particles` | Canvas2D 透视投影 (FOCAL = 1 / tan 7.5 度, NEAR 0.1, FAR 100), 点径 base * (1 + 随机) / 深度; 四种点形, 闪烁 (0.6 幅度, 6 + 14r 频率), 入场 1.8s 逐点错峰, 冲击波 520 px/s 宽 46 寿命 1.5s 推 56px 上限 4 个, 悬停 parallax / repel / attract, 近点连线 (900 点 / 9000 线), 漂移 up / down / forward. ENGINE-GAP: 点数上限 4000 (规格 20000), 景深以放大加变淡近似. pixelRatio 并入公共 dpr. |

## Alternatives considered

- 引 three / ogl 照搬上游的实例化几何: 最强理由是 3D 件观感能逐帧对齐. 否决: 内核约束不引新依赖, 且许可不允许移植.
- 给内核加点精灵 / 实例化通道: 最强理由是 Particles, Ballpit 等的数量上限能回到规格. 否决: 本路不改内核文件, 缺口写在各件 ENGINE-GAP, 由内核侧另行决定.

## Consequences

本路出口只在 particles/index.ts 追加, 总出口 src/surface/backgrounds/index.ts 已 re-export; src/index.ts 与 package.json 由主线统一接. 3D 件为简化版, 观感与上游有差距, 差什么见各件文件头 ENGINE-GAP.
