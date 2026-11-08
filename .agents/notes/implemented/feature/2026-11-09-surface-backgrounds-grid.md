# Agent Note: Backgrounds grid 路 (surface/backgrounds/grid)

Status: implemented

Decision-ID: surface-backgrounds-grid

## Code

- `src/surface/backgrounds/grid/DotField.tsx`
- `src/surface/backgrounds/grid/DotGrid.tsx`
- `src/surface/backgrounds/grid/ShapeGrid.tsx`
- `src/surface/backgrounds/grid/tokens.ts`

## Problem

L3 surface 层要落地 react-bits 的 Backgrounds 全族. grid 路收以格点, 网格与瓦片为骨架的九件: DotField, DotGrid, ShapeGrid, GridDistortion, GridMotion, GridScan, RippleGrid, MicroSlats, AcidSquares. 上游是 MIT 加 Commons Clause, HX-UI 以 Apache-2.0 发包, 不能移植; 只把 docs/research/catalog/backgrounds-1.md 与 backgrounds-2.md 里本件条目的常数, props 和行为描述当规格, 在 backdrop 内核上重写, 组件名, 文件名, 注释都用本库自己的.

## Decision

全部件只接 `src/surface/backdrop/kernel`: 着色器件走 useShaderBackdrop (WebGL2 全屏片元, 要状态的件用 passes 乒乓通道), 画布件走 useCanvasBackdrop, DOM 件走 useDomBackdrop; 宿主统一 BackdropShell, 公共 props 统一 splitCommon. 不引 three / ogl / gsap, 不自起 rAF, 不改内核. 颜色 prop 默认给语义 token 名 (primary, accent, foreground, background, border 等), 由内核在宿主作用域解析成 sRGB 交给着色器, 主题切换自动重解析. 本路共用的小工具 (入场进度, CSS 角度换方向, 跟随量) 放 tokens.ts.

条目到组件:

| 规格条目 | 组件 | 取舍 |
| --- | --- | --- |
| DotField | `DotField` | 采用: 全屏片元逐像素求最近点, 不建实例缓冲 (PIXEL_BUDGET / MAX_DOTS 因此不需要). grid / hex / scatter 精确; spiral 用逐圈黄金角错位的同心圈近似 (片元里没法按 Vogel 螺旋序号找邻点). 透镜: 采样点向指针收拢, 放大 1 + bulge * (1 + zoom) * 透镜, 点径同步变大; 透镜在场 tau 0.18 / 0.4, 按住放大 tau 0.14, 入场 1.8s 聚焦 (alpha 乘 smoothstep(0, 0.25, focus + 0.08)), 闪烁相位 0.55 + seed * 0.9. lightMode 把光晕改为压暗. maxDevicePixelRatio 并入公共 dpr, interactive 并入 mouseInteraction. |
| DotGrid | `DotGrid` | 采用: 弹簧格点在 JS 侧积分 (半隐式欧拉, 子步上限 24, 最长 1/120s, 稳定上限 sqrt(k + 8c) + d + 8v), 回位角频率 2pi / returnDuration, 阻尼比 1 - bounce, 邻点位移耦合 tension * k / 2 与速度粘滞, 指针推力系数 0.35, 点击冲击波 (寿命 0.6s, 环带 1.5 格, 本库定). 位移与速度每帧打包成一格一纹素的 RGBA8 小纹理经 textures 上传, 片元按九宫格查点位, 点径随能量膨胀 (swell), 沿速度拉长 (smoothstep(8, 70, speed) * stretch). 8 位量程: 位移 2 格, 速度 40 格每秒, 只影响显示精度, 积分保持 float. 兜底为 CSS 径向渐变平铺的静态点阵. |
| ShapeGrid | `ShapeGrid` | 采用: Canvas2D, 方 / 六角 / 圆 / 三角四种格形 (OFFSET 32768 拼格键, 编号随滚动不变), 滚动 speed * 60 像素每秒, 光斑弹簧 220 / 阻尼比 0.85 追指针, 强度逼近速率 10 / 5, 照度 smoothstep(reach, 0.15 reach); 拖尾按 trail 指数衰减, 点击级联亮环 (寿命 1.2s, 12 格每秒, 本库定), 透视倾斜相机距离 FAR 2.5 倍长边. 底线按透明度分 8 桶合并描边 (四边淡出与入场都走分桶), 亮格逐个填充描边加 shadowBlur 光晕. 规格的 speed 与公共时钟倍率同名, 改名 scrollSpeed; MAX_PIXELS 由内核的 maxEdge 代替; rainbow 用 JS 色相环换 color(srgb ...) 串. |

## Alternatives considered

- 什么都不做: 最强理由是目录条目原裁决 "不做" (全屏场与控件状态机无关). 否决: 该裁决已被用户作废, Backgrounds 全量落地.
- 每件自带 WebGL 程序管理与 rAF: 最强理由是可以逐行贴近上游的实例化绘制. 否决: surface 层只有一套渲染底座, 离屏停帧, DPR 上限, 减弱动效一帧都由内核统一负责.

## Consequences

出口由主线统一接, 本路只改 `src/surface/backgrounds/grid/index.ts`. 带 ENGINE-GAP 的件在文件头写明差什么.
