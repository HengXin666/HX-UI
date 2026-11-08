# Agent Note: surface 背景 glyph 路 (surface/backgrounds/glyph)

Status: implemented

Decision-ID: surface-backgrounds-glyph

## Code

- `src/surface/backgrounds/glyph/index.ts`
- `src/surface/backgrounds/glyph/kit.ts`
- `src/surface/backgrounds/glyph/Dither.tsx`
- `src/surface/backgrounds/glyph/use-glyph-atlas.ts`
- `src/surface/backgrounds/glyph/GradientASCII.tsx`

## Problem

L3 surface 层要落地 react-bits 的 Backgrounds 全族. glyph 路收以像素格, 字形格与扫描显示为主的九件: Dither, GradientASCII, LetterGlitch, FaultyTerminal, CRTWarp, PixelBlast, PixelSnow, Scanner, Radar. 上游是 MIT 加 Commons Clause, HX-UI 以 Apache-2.0 发包, 不能移植; 只把 docs/research/catalog/backgrounds-1.md 与 backgrounds-2.md 里的常数, props 和行为描述当规格, 着色器与状态全部自写.

## Decision

九件全部接在 surface 唯一的渲染底座 `src/surface/backdrop/kernel` 上: 单画布, 像素比上限, 离屏与隐藏停帧, 减弱动效只画一帧, 颜色 token 在宿主作用域解析并跟随主题. 指针与点击取内核的 u_pointer 与 u_taps, 入场进度由内核的 elapsed 算 (减弱动效时 elapsed 为 Infinity, 入场视为已完成). 颜色只收 token 名或用户 prop, 默认值都是 token 名; WebGL 不可用时铺 fallbackGradient.

本路共用 `kit.ts`: 入场进度, 解析色取值与平铺成 vec3 数组, 具名模式换编号, 字形图集的 uniform, 以及 GLSL 片段 (Bayer 8 / 4 / 2 递归阈值, 图集字形采样, 无图集时的方块字形). 字形类件用内核的 createGlyphAtlas 画图集, 拿不到 2d 上下文时着色器退到方块画法.

条目到组件:

| 规格条目 | 组件 | 取舍 |
| --- | --- | --- |
| Dither | `Dither` | 采用: 八种抖动模式, 三种指针效果 (erase / reveal / ripple), 调色板上限 8, 入场 1.8 秒, 点击涟漪 1.6 秒, 拖尾衰减 exp(-dt / (0.08 + 0.7 * trail)). 拖尾用内核的乒乓离屏通道 (四分之一分辨率) 代替上游的 16 点轨迹; 点击涟漪读内核的点击队列 (最多 8 个, 规格上限 4 不再单独裁). enableMouseInteraction 换成公共的 mouseInteraction, dpr 走公共 prop. |
| GradientASCII | `GradientASCII` | 采用: 四种形状 (horizon / pinch / rise / eclipse) 按规格的拱线, 呼吸与日食环常数写成形状场, 色带上限 8 (smoothstep(0.3, 1, t) 选段, smoothstep(0, 0.38, t) 作覆盖), 字形格宽高比 0.6, 点击效果 wave / burst 寿命 1.2 秒, 入场 2.4 秒按随机次序显字. 指针轨迹 (规格 24 点, 寿命 0.7 秒) 换成拖尾通道, 衰减时间常数 0.35 秒; 景深用远离中心时字形化成平均覆盖近似, 不做真模糊. |

## Alternatives considered

- 什么都不做 / 复用现有: 最强理由是 effects 已有若干静态背景. 否决: 它们没有量化抖动, 字形场与扫描显示, 也不接 backdrop 内核的停帧与减弱动效.
- 每件自起 WebGL 上下文与 rAF: 最强理由是可以逐件定制管线. 否决: surface 层只能有一套渲染底座, 帧循环只走 src/motion.

## Consequences

导出由主线统一接, 本路只改 glyph/index.ts. 带 ENGINE-GAP 的件在文件头写明差什么.
