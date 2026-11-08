# Agent Note: Backgrounds glow 路 (surface/backgrounds/glow)

Status: implemented

Decision-ID: surface-backgrounds-glow

## Code

- `src/surface/backgrounds/glow/glow-kit.ts`
- `src/surface/backgrounds/glow/Aurora.tsx`

## Problem

Backgrounds 全量落地分七路, glow 路收以柔光, 光幕, 渐变流动为主的全屏着色器场: Aurora, SoftAurora, DarkVeil, Silk, Grainient, Iridescence, Plasma, PlasmaWave, ColorBends, GradientWaves. 上游是 MIT 加 Commons Clause, HX-UI 以 Apache-2.0 发包, 不能移植; 只取 docs/research/catalog/backgrounds-1.md 与 backgrounds-2.md 里各件条目的常数, props 与行为描述当规格, 着色器与状态机自写. 条目末尾的 "裁决: 不做" 已作废.

## Decision

每件都是 backdrop 内核 `useShaderBackdrop` 上的一个 WebGL2 全屏片元程序, 宿主是 `BackdropShell`, 公共 props 走 `splitCommon`; 单画布, 像素比上限, 离屏与隐藏停帧, 减弱动效只画一帧, 颜色 token 解析与主题切换都由内核负责. 本路共用 `glow-kit.ts`: 颜色表转定长 vec3 数组 uniform, 入场进度 (内核 elapsed, 减弱动效为 Infinity 时即为 1), 指针跟随 (规格里的 1 - exp(-dt * k) 统一写成 approach 的时间常数 tau = 1 / k), 以及收尾片段 GLOW_GLSL (fade 边缘渐隐, grain 颗粒, lightMode 把光色压成墨色, 直通 alpha 输出). 点击脉冲直接读内核公共头的 u_taps (距今秒数), 不在组件里另记队列. 着色器源码放在各件的 `<piece>-shader.ts`, 组件文件只做 props 到 uniform 的映射, 映射函数导出为纯函数供单测.

件清单:

| 规格条目 | 组件 | 取舍 |
| --- | --- | --- |
| Aurora | `Aurora` | 色标上限 5, 层数上限 3, 入场 2.4s (光幕垂下, smoothstep 缓动), 下缘高度 0.26 + soft * 0.6 与 lobes 0.86 + 0.14 * 噪声取规格原式; 指针横向跟随 tau 0.6, 抬起光幕的进场 / 离场 0.9 / 1.4; 点击处按 u_taps 闪一下. `time` prop 覆写 u_time. 兜底为色标线性渐变. |

## Alternatives considered

- 什么都不做 / 复用现有: 最强理由是 effects 里已有静态渐变背景. 否决: 静态渐变没有时钟, 指针跟随与入场, 也不走内核的停帧与减弱动效.
- 每件自带 WebGL 管线与 rAF: 最强理由是可以逐件调优. 否决: surface 层只能有一套渲染底座 (backdrop/kernel), 帧循环只走 src/motion.
- 多通道 (先低分辨率体积再合成) 照搬规格结构: 最强理由是贴近规格的 MAX_*_PIXELS 质量档. 否决于首版: 单通道已能出效果, 多通道等内核加降采样上屏能力再换.

## Consequences

本路出口 `src/surface/backgrounds/glow/index.ts` 由总出口 re-export, `src/index.ts` 由主线统一接. 各件的 ENGINE-GAP 写在件文件头, 汇总见上表.
