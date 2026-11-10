# Agent Note: 着色器场 (surface/field)

Status: implemented

Decision-ID: surface-field

## Code

- `src/surface/field/tokens.ts`
- `src/surface/field/parts/ink.ts`, `src/surface/field/parts/ink-shader.ts`, `src/surface/field/InkSplash.tsx`
- `src/surface/field/index.ts`
- `tests/surface/field/ink.test.tsx`

## Problem

docs/research/catalog/animations.md 的 SplashCursor, MetaBalls, MetallicPaint, LaserFlow, RippleDistortion, ShapeBlur, ElectricLogo 是 Animations C 段 7 件 (CHECKPOINT 映射表 C 段 7 行, 26 件 = 7 + 6 + 7 + 6). 规格原裁决 "不做" (全屏着色器场), 用户 2026-11-10 把它们列进 26 件, 并定 "全走 shader 通道". 上游许可是 MIT 加 Commons Clause, 只把条目的常数与 props 当规格, 自写自命名, 不引 three / ogl.

## Decision

七件都接在 backdrop 内核的 WebGL2 渲染器上 (useShaderBackdrop + BackdropShell, 与 Backgrounds 的 LiquidEther / Lightfall 同一做法): 内核管画布, DPR, 离屏停帧, 指针 (u_pointer, u_taps) 与颜色 (colors 选项里的 token 名在宿主作用域解析), 多遍模拟走 ShaderSpec.passes 的乒乓离屏通道, 泛光复用 `src/surface/backgrounds/bloom.ts` 的金字塔. 拿不到 WebGL2 时 BackdropShell 铺 CSS 兜底. 颜色只收 token 名. 每个片元程序提交前用 glslangValidator 编译过一遍 (jsdom 里只有假上下文, 单测查不出 GLSL 语法错).

| 条目 | 落点 | 参数 |
| --- | --- | --- |
| SplashCursor | `InkSplash` | BLOOM_THRESHOLD 0.3, BLOOM_KNEE 0.7, BLOOM_ITERATIONS 4 (金字塔 4 级), 推力 6000 x force / sqrt(spread), 补色 0.15 x intensity x min(dt x 60, 1) / sqrt(spread), 点击 1100 x force, 帧长上限 1/60, 花瓣 0.78 + 0.22 sin(5a + seed) sin(3a - 1.7 seed), 平流 uv - dt x v x texel 再除 (1 + dissipation x dt), 涡度力 0.5 (abs(T) - abs(B), abs(R) - abs(L)) 归一乘 curl x C 且 y 取反, 抖动 (hash - 0.5) / 255 x smoothstep(0, 0.03, peak); props `colors` (token 名), `rainbow` true, `colorSpeed` 1, `intensity` 1, `size` 1, `force` 1, `swirl` 3, `trail` 1, `momentum` 1, `shading` 1, `glow` 0, `quality` low / medium / high, `clickSplash`, `intro`, `lightMode` (规格 theme); 本库定: spread = size, 溅点半径 0.0025 x size (以画面高为 1 的平方), 涡度 swirl x 10, 染料耗散 1 / trail, 速度耗散 0.2 / momentum, 压力热启动 0.8, 画质档 sim 0.12 / 0.18 / 0.25 dye 0.3 / 0.45 / 0.6 压力 8 / 14 / 20 次, 入场 1.2s 画一道 S 形, 彩虹色相 0.25 x colorSpeed 圈每秒 |

做法:

- InkSplash: 通道顺序 速度 (用上一帧压力投影, 自平流, 涡度约束, 溅点) -> 散度 -> 压力 Jacobi -> 染料 (用投影后的速度平流, 溅点补色) -> 泛光场景 (按浓度梯度打光) -> 金字塔各级 -> 上屏. 投影滞后一帧, 与 LiquidEther 相同. 速度与压力按范围编码 (1024 / 512), 8 位缓冲也存得下负值. glow 为 0 时金字塔 0 级, 只多一遍场景通道. 减弱动效时内核只画一帧, 场景改画静态墨迹 (第一色).

## Consequences

- InkSplash 没有落的: contained (本库永远在宿主内, 不铺满视口), zIndex (宿主是普通块, 由使用方定层级), 闲置停帧 (内核按可见性停帧, 不按指针闲置). ENGINE-GAP (同 LiquidEther): 内核在不支持半浮点渲染目标时退到 RGBA8, 速度与压力按范围编码后精度不足, 流体会发涩, 染料也会在 1 处截断; 要内核加高精度打包才能补.
