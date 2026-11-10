# Agent Note: 揭示与立体场 (surface/scene)

Status: implemented

Decision-ID: surface-scene

## Code

- `src/surface/scene/tokens.ts`
- `src/surface/scene/parts/dot.ts`, `src/surface/scene/parts/dot-shader.ts`, `src/surface/scene/DotReveal.tsx`
- `src/surface/scene/index.ts`
- `tests/surface/scene/dot.test.tsx`

## Problem

docs/research/catalog/animations.md 的 HalftoneReveal, DitherVeil, CrystalizedBall, Cubes, ElasticMesh, Strands 是 Animations D 段 6 件 (CHECKPOINT 映射表 D 段 6 行). 规格原裁决 "不做" (全屏着色器场), 用户 2026-11-10 把它们列进 Animations 收编, 要求全部走内核 WebGL2 shader 通道, 走不了的标 ENGINE-GAP.

## Decision

六件都接在 backdrop 内核的 WebGL2 渲染器上 (useShaderBackdrop + BackdropShell): 内核管画布, DPR, 离屏停帧, 指针 (u_pointer, u_taps) 与颜色 (colors 选项里的 token 名在宿主作用域解析); 需要保留上一帧的状态走 ShaderSpec.passes 的乒乓通道. 只借规格的常数与 props, 自写自命名; 颜色只收语义 token 名, 规格的色值默认改成 token. field 族已接入 ./surface, 段内新件另开 scene 族, 段尾一次接入.

| 条目 | 落点 | 参数 |
| --- | --- | --- |
| HalftoneReveal | `DotReveal` | 采用: 图片按 cover 铺满, 网格转 angle 度, 逐格取格心亮度, 按 contrast / brightness / invert 调过, 暗度开方乘 0.72 格宽乘 dotScale 得网点半径 (0.72 本库定, 满暗时圆点刚好盖满格子对角), roughness 按格哈希起伏; SHAPES 六种 (dot / ellipse / square / diamond / line / cross) 用解析距离, 查 3x3 邻格取最大覆盖, 大点可溢出; 边缘按规格 smoothstep(r + w, r - w, d) * clamp(r / 2w) 的意思写成正序 smoothstep (反序在 GLSL 里未定义). MODES: mono 墨色网点在纸色上; duotone 再叠一张转 30° 吃 0.6 倍暗度的强调色网 (两值本库定), 墨网按覆盖率平方压在上面; color 用格心原色. misregistration 以格为单位偏移强调色网 (duotone) 或取样 (color) 的位置. 入场按规格 delay = |field| * 1.15 + hash * 0.06, grow = smoothstep(clamp((intro * 1.7 - delay) / 0.45)), INTRO_SECONDS 1.4. 揭开遮罩是 MASK_SCALE 0.5 的乒乓通道: 每帧减 max(dt / linger, 1/255) (下限本库定, 8 位缓冲下才褪得干净), 叠上一段从上一帧落点到本帧落点的胶囊画笔 (revealRadius, softness 羽化) 乘在场程度; 点击爆开 MAX_BURSTS 4 个, BURST_SECONDS 1.3, 半径从 0.5 倍长到 2.5 倍 revealRadius (本库定) 并随进度变淡. 跟手 tau 0.035, 在场 tau 0.16, 帧长上限 0.05, 漫游 (wander) 指针不在时 1.2 秒渐入, 走一条慢李萨如路径 (频率与幅度本库定). reverse 把遮罩反过来 (平时露原图, 指针处变网点). inkColor / accentColor / paperColor 默认 foreground / primary / background. 兜底为 cover 铺图. |

## Consequences

- DotReveal 没有落的: 规格片元里的抠像 (uMatte / uKey, 没有对应 props), fit (固定 cover); DEFAULT_SRC 不带, src 必填. 都不需要顶点或实例化, 不标 ENGINE-GAP.
