# Agent Note: Backgrounds glow 路 (surface/backgrounds/glow)

Status: implemented

Decision-ID: surface-backgrounds-glow

## Code

- `src/surface/backgrounds/glow/glow-kit.ts`
- `src/surface/backgrounds/glow/Aurora.tsx`
- `src/surface/backgrounds/glow/SoftAurora.tsx`
- `src/surface/backgrounds/glow/DarkVeil.tsx`
- `src/surface/backgrounds/glow/Silk.tsx`

## Problem

Backgrounds 全量落地分七路, glow 路收以柔光, 光幕, 渐变流动为主的全屏着色器场: Aurora, SoftAurora, DarkVeil, Silk, Grainient, Iridescence, Plasma, PlasmaWave, ColorBends, GradientWaves. 上游是 MIT 加 Commons Clause, HX-UI 以 Apache-2.0 发包, 不能移植; 只取 docs/research/catalog/backgrounds-1.md 与 backgrounds-2.md 里各件条目的常数, props 与行为描述当规格, 着色器与状态机自写. 条目末尾的 "裁决: 不做" 已作废.

## Decision

每件都是 backdrop 内核 `useShaderBackdrop` 上的一个 WebGL2 全屏片元程序, 宿主是 `BackdropShell`, 公共 props 走 `splitCommon`; 单画布, 像素比上限, 离屏与隐藏停帧, 减弱动效只画一帧, 颜色 token 解析与主题切换都由内核负责. 本路共用 `glow-kit.ts`: 颜色表转定长 vec3 数组 uniform, 入场进度 (内核 elapsed, 减弱动效为 Infinity 时即为 1), 指针跟随 (规格里的 1 - exp(-dt * k) 统一写成 approach 的时间常数 tau = 1 / k), 以及收尾片段 GLOW_GLSL (fade 边缘渐隐, grain 颗粒, lightMode 把光色压成墨色, 直通 alpha 输出). 点击脉冲直接读内核公共头的 u_taps (距今秒数), 不在组件里另记队列. 着色器源码放在各件的 `<piece>-shader.ts`, 组件文件只做 props 到 uniform 的映射, 映射函数导出为纯函数供单测.

件清单:

| 规格条目 | 组件 | 取舍 |
| --- | --- | --- |
| Aurora | `Aurora` | 色标上限 5, 层数上限 3, 入场 2.4s (光幕垂下, smoothstep 缓动), 下缘高度 0.26 + soft * 0.6 与 lobes 0.86 + 0.14 * 噪声取规格原式; 指针横向跟随 tau 0.6, 抬起光幕的进场 / 离场 0.9 / 1.4; 点击处按 u_taps 闪一下. `time` prop 覆写 u_time. 兜底为色标线性渐变. |
| SoftAurora | `SoftAurora` | 脉冲上限 4 (读 u_taps 最近 4 次), 入场 2s, 跟随 tau 0.325, 在场 0.45 / 0.8, 噪声相位 0.4 * 时钟, 三层光带; 能量着色取规格的 core = smoothstep(0.55, 1.6, energy), depth = 1.25 + 0.45 * core 与 density = 0.88 * (1 - exp(-1.9 * energy^1.7)). 默认速度 0.6. `enableMouseInteraction` 与公共 `mouseInteraction` 同义. 兜底为底色上一团主色光晕. |
| DarkVeil | `DarkVeil` | 两段: 场通道 (域扭曲 fbm 高度 + 两向梯度, 分辨率倍率 = quality 钳到 0.1..1) 与上屏打光. 入场 1.8s 由中心外扩; 指针跟随速率 9, 拖拽速度混合 5, 触碰进场 / 离场 3 / 1.6, 光源跟随 4 (都换成 tau = 1 / k); sheen = pow(facing, 40) * smoothstep(0.08, 0.7, base), cover = 1 - exp(-peak * 1.6), ink = mix(ink, ink * 0.82, smoothstep(0.5, 1, cover)) 取规格原式. 默认速度 0.5, 颗粒 0.03. ENGINE-GAP: MAX_FIELD_PIXELS 需按画布尺寸动态定通道倍率, 内核 PassSpec.scale 是静态的, 只按 quality 取. |
| Silk | `Silk` | 两层正弦褶皱 (宽褶 + 细褶按 ripple 混入) 经正弦域扭曲 (wave) 叠成绸面, 中心差分求法线; relief = 1 + (dot(normal, toLight) - toLight.z) * 1.8 * depth 与 gloss = pow(dot(normal, halfway), 48) * smoothstep(0.25, 0.85, n), fold / specular 取 smoothstep(0.28, 0.9) / smoothstep(0.72, 0.98) 取规格原式. 入场 2.2s 五次缓动由中心显出, 流动相位 0.1 * 时钟 (默认速度 5) 入场时多推 INTRO_RUSH 1.6 再收回; 跟随速率 10, 拖拽混合 4, 触碰 3.5 / 1.4, 光源跟随 3 (换成 tau); 点击涟漪读 u_taps, 寿命 1.6s. 兜底为双色斜向渐变. |

## Alternatives considered

- 什么都不做 / 复用现有: 最强理由是 effects 里已有静态渐变背景. 否决: 静态渐变没有时钟, 指针跟随与入场, 也不走内核的停帧与减弱动效.
- 每件自带 WebGL 管线与 rAF: 最强理由是可以逐件调优. 否决: surface 层只能有一套渲染底座 (backdrop/kernel), 帧循环只走 src/motion.
- 多通道 (先低分辨率体积再合成) 照搬规格结构: 最强理由是贴近规格的 MAX_*_PIXELS 质量档. 否决于首版: 单通道已能出效果, 多通道等内核加降采样上屏能力再换.

## Consequences

本路出口 `src/surface/backgrounds/glow/index.ts` 由总出口 re-export, `src/index.ts` 由主线统一接. 各件的 ENGINE-GAP 写在件文件头, 汇总见上表.
