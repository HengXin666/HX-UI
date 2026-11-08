# Agent Note: surface 层 Backgrounds fluid 路 (surface/backgrounds/fluid)

Status: implemented

Decision-ID: surface-backgrounds-fluid

## Code

- `src/surface/backgrounds/fluid/index.ts`

## Problem

L3 surface 层要落地 react-bits 的 Backgrounds 全族. fluid 路收以液体, 金属与有机流动为主角的九件: LiquidChrome, LiquidEther, Ferrofluid, MoltenMetal, Balatro, Orb, EvilEye, MagicRings, Topography. 上游是 MIT 加 Commons Clause, HX-UI 以 Apache-2.0 发包, 不能移植; 只把 docs/research/catalog/backgrounds-1.md 与 backgrounds-2.md 里各条目的看起来, 技法, 常数, 指针与 props 当规格, 着色器与状态机全部自写, 文件名与注释用本库自己的. 条目末尾的 "裁决: 不做" 已被用户作废.

## Decision

全部接在 surface 唯一的渲染底座 `src/surface/backdrop/kernel` 上: useShaderBackdrop 出 WebGL2 全屏片元, 需要状态的件 (涟漪, 流体) 用 passes 乒乓离屏通道; 帧循环, 像素比上限, 离屏与隐藏停帧, 减弱动效只画一帧, 主题切换重解析颜色都由内核负责, 组件不自起 rAF. 颜色只收 token 名或用户 prop, 默认值都是 token 名 (foreground, background, primary 等), 源码不写色值字面量. 拿不到 WebGL2 时 BackdropShell 铺 fallbackGradient / glowFallback. 状态通道一律把有符号量按 0.5 + 0.5x 编码, 内核在不支持半浮点时退到 RGBA8 也不丢负值. 入场, 悬停一类的 JS 侧平滑在 uniforms 回调里按 frame.dt 推进 (内核 approach), 减弱动效时直接取终值.

条目到组件:

| 规格条目 | 组件 | 取舍 |
| --- | --- | --- |
| LiquidChrome | `LiquidChrome` | 采用: 1 到 8 层正弦扭曲出液面, 有限差分取斜率当法线, 反射一个摄影棚环境 (柔光箱, 地平线亮带, 条目里的 lobe / streak / rise 形状), 粗糙度用 4 次抖动采样 (t 从 -0.375 步进 0.25) 近似, f0 = mix(1, tint, smoothstep(0.05, 0.6, 斜率)) * 0.92. 涟漪是离屏波动方程 (格子 4 CSS 像素, 每帧两步对应 1/120 秒步长), 拖动按速度注入, 点击注入一圈大的. 入场振幅 1.8 秒涨满. color 默认 foreground, 另加 backgroundColor (默认 background); lightMode 以底色为主只做明暗. maxDevicePixelRatio 并入公共 dpr. |
| LiquidEther | `LiquidEther` | 采用: 稳定流体四通道 (速度: 投影后半拉格朗日自平流, 粘性衰减, 指针 / 自动 / 点击的力; 散度; 压力 32 次 Jacobi, 以上一帧的解热启动; 染料: 按投影后速度平流, 留存率 0.5^(dt / (0.35 + persistence^2 * 12))). 压力梯度不能写回速度缓冲 (每个通道只写自己), 所以投影滞后到下一帧速度通道开头扣掉, 染料通道自己算一次投影后的速度, 结果与同帧投影一致. 上屏: 浓度经 smoothstep(0.08, 0.5) 当不透明度, 快处 mix(0.85, 0.1, smoothstep(0.7, 1.6, 速度)) 镂空, 1 - exp(-max(速度 - 0.75, 0) * 1.2) 发热, 流速沿调色板取色. 自动演示在指针停下 autoResumeDelay 后沿利萨如曲线搅动, 0.8 秒爬升; 入场 1.4 秒横扫一笔; 点击按 1400 * (mouseForce / 20) 外推. 减弱动效改画一张静态噪声流. MAX_CELLS 上限不落地 (通道缩放在构建时固定, 由 resolution 与 DPR 上限间接控制). ENGINE-GAP: 内核在不支持半浮点渲染目标时退到 RGBA8, 速度与压力按 512 / 256 的范围编码后精度不足, 流体会发涩. |

## Alternatives considered

- 什么都不做 / 复用现有: 最强理由是 effects 已有静态渐变与光斑. 否决: 它们没有状态通道, 做不出涟漪, 流体与射线步进的形体.
- 照条目引入 three 或 ogl: 最强理由是 3D 件 (Topography 的网格, MagicRings 的环带) 写起来短. 否决: 内核只直接调用 WebGL2, 不进新依赖; 3D 件改用全屏片元的射线步进或解析投影, 差距记成 ENGINE-GAP.

## Consequences

本路只改自己的 index.ts, 总出口 `src/surface/backgrounds/index.ts` 已 re-export, src/index.ts 与 package.json 的出口由主线统一接.
