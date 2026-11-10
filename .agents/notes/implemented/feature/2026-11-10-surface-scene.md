# Agent Note: 揭示与立体场 (surface/scene)

Status: implemented

Decision-ID: surface-scene

## Code

- `src/surface/scene/tokens.ts`
- `src/surface/scene/parts/dot.ts`, `src/surface/scene/parts/dot-shader.ts`, `src/surface/scene/DotReveal.tsx`
- `src/surface/scene/parts/dither.ts` (误差扩散与格网, 主线程), `src/surface/scene/parts/veil-shader.ts`, `src/surface/scene/BayerVeil.tsx` (遮罩通道与 DotReveal 共用 DOT_MASK_PASS 与 parts/dot 的跟手状态)
- `src/surface/scene/index.ts`
- `tests/surface/scene/{dot,veil}.test.tsx`

## Problem

docs/research/catalog/animations.md 的 HalftoneReveal, DitherVeil, CrystalizedBall, Cubes, ElasticMesh, Strands 是 Animations D 段 6 件 (CHECKPOINT 映射表 D 段 6 行). 规格原裁决 "不做" (全屏着色器场), 用户 2026-11-10 把它们列进 Animations 收编, 要求全部走内核 WebGL2 shader 通道, 走不了的标 ENGINE-GAP.

## Decision

六件都接在 backdrop 内核的 WebGL2 渲染器上 (useShaderBackdrop + BackdropShell): 内核管画布, DPR, 离屏停帧, 指针 (u_pointer, u_taps) 与颜色 (colors 选项里的 token 名在宿主作用域解析); 需要保留上一帧的状态走 ShaderSpec.passes 的乒乓通道. 只借规格的常数与 props, 自写自命名; 颜色只收语义 token 名, 规格的色值默认改成 token. field 族已接入 ./surface, 段内新件另开 scene 族, 段尾一次接入.

| 条目 | 落点 | 参数 |
| --- | --- | --- |
| HalftoneReveal | `DotReveal` | 采用: 图片按 cover 铺满, 网格转 angle 度, 逐格取格心亮度, 按 contrast / brightness / invert 调过, 暗度开方乘 0.72 格宽乘 dotScale 得网点半径 (0.72 本库定, 满暗时圆点刚好盖满格子对角), roughness 按格哈希起伏; SHAPES 六种 (dot / ellipse / square / diamond / line / cross) 用解析距离, 查 3x3 邻格取最大覆盖, 大点可溢出; 边缘按规格 smoothstep(r + w, r - w, d) * clamp(r / 2w) 的意思写成正序 smoothstep (反序在 GLSL 里未定义). MODES: mono 墨色网点在纸色上; duotone 再叠一张转 30° 吃 0.6 倍暗度的强调色网 (两值本库定), 墨网按覆盖率平方压在上面; color 用格心原色. misregistration 以格为单位偏移强调色网 (duotone) 或取样 (color) 的位置. 入场按规格 delay = |field| * 1.15 + hash * 0.06, grow = smoothstep(clamp((intro * 1.7 - delay) / 0.45)), INTRO_SECONDS 1.4. 揭开遮罩是 MASK_SCALE 0.5 的乒乓通道: 每帧减 max(dt / linger, 1/255) (下限本库定, 8 位缓冲下才褪得干净), 叠上一段从上一帧落点到本帧落点的胶囊画笔 (revealRadius, softness 羽化) 乘在场程度; 点击爆开 MAX_BURSTS 4 个, BURST_SECONDS 1.3, 半径从 0.5 倍长到 2.5 倍 revealRadius (本库定) 并随进度变淡. 跟手 tau 0.035, 在场 tau 0.16, 帧长上限 0.05, 漫游 (wander) 指针不在时 1.2 秒渐入, 走一条慢李萨如路径 (频率与幅度本库定). reverse 把遮罩反过来 (平时露原图, 指针处变网点). inkColor / accentColor / paperColor 默认 foreground / primary / background. 兜底为 cover 铺图. |
| DitherVeil | `BayerVeil` | 采用: 画面切成 pixelSize 的方格 (格数上限 480000, 超了等比放大格子, 本库定). pattern 默认 floyd: 误差扩散逐格串行, 片元里做不了, 在主线程按格网算一次 (KERNELS 取 floyd 7/3/5/1 除 16, atkinson 六邻各 1/8 共推 6/8, jarvis 12 邻除 48, sierra 取 lite 2/1/1 除 4), 结果画进 cols x rows 的小画布当纹理, 尺寸或相关 props 变了才重算; ORDERED 三种 (bayer 8x8 递归阈值, noise 按格哈希, lines 取规格 period 6 的斜线) 在片元按格算阈值. levels 档量化; palette duotone 把档位映到墨色到纸色, color 三通道各自抖动. fit 默认 contain, 留边是纸色. 亮度按 contrast (默认 1.15) / brightness 调过, 主线程与片元同一公式. 揭开遮罩与 DotReveal 同一乒乓通道 (MASK_SCALE 0.5, MAX_BURSTS 4, BURST_SECONDS 1.2, 每帧褪 dt / linger, 跟手 0.035 / 在场 0.16 / 漫游 1.2 秒渐入 / 帧长上限 0.05, 均为规格值). rim 在遮罩 0.5 等值线两侧 0.18 带宽 (本库定) 里混入 rimColor. 入场 INTRO_MS 1100: 先露原图, 抖动由上往下铺开. inkColor / paperColor / rimColor 默认 foreground / background / accent. 兜底为按 fit 铺图. |

## Consequences

- DotReveal 没有落的: 规格片元里的抠像 (uMatte / uKey, 没有对应 props), fit (固定 cover); DEFAULT_SRC 不带, src 必填. 都不需要顶点或实例化, 不标 ENGINE-GAP.
- BayerVeil 没有落的: 规格常数 HOLD 1.6 (条目只给了常数, 没写用在哪, 不落), 抠像 (uMatte / uKey, 没有对应 props); 误差扩散的格网纹理在宿主尺寸变化时于主线程重算 (大宿主加 pixelSize 1 时约数十毫秒一次), 不需要顶点或实例化, 不标 ENGINE-GAP.
