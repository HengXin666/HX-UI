# Agent Note: surface 背景族 particles 路 (surface/backgrounds/particles)

Status: implemented

Decision-ID: surface-backgrounds-particles

## Code

- `src/surface/backgrounds/particles/index.ts`
- `src/surface/backgrounds/particles/tokens.ts`
- `src/surface/backgrounds/particles/Particles.tsx`
- `src/surface/backgrounds/particles/Galaxy.tsx`
- `src/surface/backgrounds/particles/Hyperspeed.tsx`
- `src/surface/backgrounds/particles/Antigravity.tsx`

## Problem

L3 surface 层要落地 react-bits 的 Backgrounds 全族. particles 路收以粒子 / 实体为主角的九件: Particles, Galaxy, Hyperspeed, Antigravity, Ballpit, AeroShards, GhostFibers, MagnetLines, GradientBlinds. 上游是 MIT 加 Commons Clause, HX-UI 以 Apache-2.0 发包, 不能移植; 只把 docs/research/catalog/backgrounds-1.md 与 backgrounds-2.md 条目里的常数, props 和行为描述当规格, 在 backdrop 内核上自写, 组件名沿用条目名, 注释与实现都是本库自己的. 条目末尾的 "裁决: 不做" 已被作废.

## Decision

渲染只走 `src/surface/backdrop/kernel`: 全屏片元能表达的场 (星空, 公路, 百叶) 用 useShaderBackdrop, 要逐个实体积分或排序的 (点云, 球池, 碎片, 磁针) 用 useCanvasBackdrop 自己投影. 内核没有实例化顶点 / 点精灵通道, 3D 件一律做简化版并在文件头写 ENGINE-GAP. 颜色只收 token 名或用户 prop, 2d 画布用 tokens.ts 的 inkOf 把解析出的 sRGB 写成 color(srgb ...) 串; 着色器用 paletteUniform 摊成 vec3 数组. 公共 speed 是内核时钟倍率 (默认 1), 各件把规格默认速度折进本件常数, 使 speed=1 对应条目默认观感. 本路公共工具 (取色, 种子随机, 一阶跟随, 入场进度) 在 tokens.ts.

条目到组件:

| 规格条目 | 组件 | 取舍 |
| --- | --- | --- |
| Particles | `Particles` | Canvas2D 透视投影 (FOCAL = 1 / tan 7.5 度, NEAR 0.1, FAR 100), 点径 base * (1 + 随机) / 深度; 四种点形, 闪烁 (0.6 幅度, 6 + 14r 频率), 入场 1.8s 逐点错峰, 冲击波 520 px/s 宽 46 寿命 1.5s 推 56px 上限 4 个, 悬停 parallax / repel / attract, 近点连线 (900 点 / 9000 线), 漂移 up / down / forward. ENGINE-GAP: 点数上限 4000 (规格 20000), 景深以放大加变淡近似. pixelRatio 并入公共 dpr. |
| Galaxy | `Galaxy` | WebGL2 全屏片元: 最多 8 层视差星格循环推进 (层深 fract(i / layers + depth)), 每格一颗星 (光核 0.05 * glow / d 加十字与 45 度十字光芒, 大星阈值 smoothstep(0.9, 1, size)), 层淡入淡出 depth * smoothstep(1, 0.9, depth); 指针跟随 tau 0.325s 推开星场, 点击跃迁 boost 衰减 exp(-1.3 dt), 期间飞行乘 (1 + 14 boost); 入场 2.2s 由中心向外点亮. starColors 收 token (最多 4 个, 规格 MAX_COLORS), hueShift 默认改为 0 以保留 token 原色; saturation 改为相对 token 色的增减; lightMode 画带色相的暗点; transparent=false 铺 background token; disableAnimation 并入 paused. |
| Hyperspeed | `Hyperspeed` | WebGL2 全屏片元: 视线与路面求交, 路中心横移 curvature * z^2 * bend(行程) 成弯道 (straight / winding / turbulent), 每侧 lanes 条车道上的车灯对按行程哈希成光带 (对向 1.65 倍, 同向 0.35 倍相对速度), 车道虚线, 两侧灯杆逐根投影带灯头光晕, 尘线由消失点放射; 雾从 TRAVEL 的 1/4 到 TRAVEL (400). 按住加速: boost 升 0.28s / 落 0.85s, 视场弹簧 90 / 13 拉向 boostFov, 指针横移镜头 tau 0.35s. ENGINE-GAP: 无实例化网格与真泛光 (宽高斯光晕近似), 车灯贴路面; 规格 MAX_CARS / MAX_DUST 不适用. |
| Antigravity | `Antigravity` | Canvas2D: 群体以结构化数组存家位置 / 位置 / 速度 / 深度, 光标弹簧 (刚度 49, 阻尼 14) 拖出的磁环 (ringRadius, waveCount 条波纹以 waveSpeed 绕行) 把半径内的小体吸到环带上, 临界附近阻尼 1.64 omega, 子步上限 4, omega = 4 + lerpSpeed * 120 (本库定). 入场 3 秒从下方升起, 按住蓄力 (0.9s 蓄满, 4/s 泄掉) 环收到 0.5, 点击冲量 28 散开. 深度缩放 1 + z * 0.32, 远处雾 0.35, 脉动 0.22 * variance; conic / radial / random 三种着色. ENGINE-GAP: 上游的 WebGL 实例化三维小体带光照不做, 胶囊 / 球 / 盒 / 四面体画成圆头线 / 圆 / 方块 / 三角剪影, 深度只体现为尺寸与雾. |

## Alternatives considered

- 引 three / ogl 照搬上游的实例化几何: 最强理由是 3D 件观感能逐帧对齐. 否决: 内核约束不引新依赖, 且许可不允许移植.
- 给内核加点精灵 / 实例化通道: 最强理由是 Particles, Ballpit 等的数量上限能回到规格. 否决: 本路不改内核文件, 缺口写在各件 ENGINE-GAP, 由内核侧另行决定.

## Consequences

本路出口只在 particles/index.ts 追加, 总出口 src/surface/backgrounds/index.ts 已 re-export; src/index.ts 与 package.json 由主线统一接. 3D 件为简化版, 观感与上游有差距, 差什么见各件文件头 ENGINE-GAP.
