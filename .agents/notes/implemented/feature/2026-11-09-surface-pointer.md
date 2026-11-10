# Agent Note: surface 层指针族 (surface/pointer)

Status: implemented

Decision-ID: surface-pointer

## Code

- `src/surface/pointer/Attract.tsx`
- `src/surface/pointer/cell.ts`, `src/surface/pointer/CellTrail.tsx`, `tests/surface/pointer/cell.test.tsx`

## Problem

L3 surface 层要落地 react-bits 的 Animations 全族 (docs/research/catalog/animations.md 共 38 条). pointer 意图收指针驱动的表层效果: ClickSpark, Crosshair, GlareHover, ImageTrail, Magnet, TargetCursor. 上游是 MIT 加 Commons Clause, HX-UI 以 Apache-2.0 发包, 不能移植; 只把条目里的常数, props 和行为描述当规格, 用 src/motion 的引擎重写, 组件名, 文件名, 注释都用本库自己的.

## Decision

本族分两批. 第一批是纯 DOM 的四件 (不碰画布, 不需要渲染底座); 第二批是画在画布上的 ClickSpark 与 Crosshair, 接在 surface 唯一的渲染底座 `src/surface/backdrop/kernel` 的 Canvas2D 渲染器 (useCanvasBackdrop) 上: 单画布, 像素比上限, 离屏与隐藏停帧, 主题切换重解析颜色都由内核负责. 指针件的画布要叠在内容上方, 内核的 BackdropShell 把画布垫在下面, 所以本族加了 SurfaceLayer: 同一套 handle refs 与 data-backdrop-* 属性, 只把画布层级改成 z-10; ink.ts 把内核解析出的 sRGB 写成 color(srgb ...) 给 2d 画布, 不出现任意色值字面量. 两者也供 Animations 族其余子目录复用.

条目到组件:

| 规格条目 | 组件 | 取舍 |
| --- | --- | --- |
| Magnet | `Attract` | 采用: 积分换成 src/motion 的解析弹簧 (useSpringChannels + exactStepper, 默认 170 / 16 / 1, 下限 1 / 0 / 0.01), 吸力 1 - smoothstep(padding / 2, padding, 矩形外距离), exclusive 由模块级登记表取吸力最大者; 滚动, 失焦, pointercancel 都松开. tilt / scale / axis / maxOffset / onActiveChange 全部落地, wrapperClassName / innerClassName 改名 className / innerClassName. |
| TargetCursor | `LockOnCursor` | 出现弹簧 260 / 32, 按下 900 / 40, 吸附弹簧由 hoverDuration 经 spring/fit 换算, 自转速度一阶跟随 (速率 3). thickness 3 统一画成 1px, blendMode difference 不落地, 默认目标选择器换成 `[data-cursor-target]`, cursorColor / cursorColorOnTarget 换成 tone / lockTone. |
| GlareHover | `SheenCard` | 扫光是 useDrivenValue 的可中断补间 (余弦曲线), 时长 max(120, 650 * 剩余行程), 离开时倒扫; loop / playOnce / intro (露出 40%) 三种触发; rimGlint 是 1px 内描边; variant 收 streak / spot. width / height / background / borderRadius / borderColor 交给 className, glareColor 换成 tone, blendMode 不落地. |
| ClickSpark | `TapSparks` | 采用: 三条曲线, 重力 500, 上限 32, 寿命错峰上限 1 + 0.25 * randomness, 距离错峰 1 + 0.35 * randomness, 中心测量环 (2 + radius * 0.6 * 进度, 寿命 0.8 * duration), 线宽 1px. 爆点从内核的点击队列取 (按时间戳去重), 自己留 32 个. 减弱动效时内核只画一帧, 不出火花也不出环 (规格的 320ms 淡出环不落地). |
| Crosshair | `ReticleLines` | 状态机: 跟手 tau 0.008 + smoothing * 0.16, 出现 0.12 / 0.25, 锁框吸附 0.085, 锁框透明度 0.08 / 0.14, 脉冲寿命 0.55s. 锁定目标每帧用 elementFromPoint 取指针下的元素再 closest(targetSelector). thickness 固定 1px; color 换成 tone; fade, glitch 与 blendMode 不落地. |
| ImageTrail | `PhotoWake` | 入场 0.4s (power4), 出场 0.4s (漂移时 0.9s), 闪白 0.5s, threshold 80; 未启用槽 visibility hidden 防首帧闪, 进出场是可回放的进度函数 wakePhase. stack prop 不落地 (层级按放下顺序递增). 减弱动效时不放图. |
| PixelTrail | `CellTrail` | Canvas2D 网格 (不用着色器): 横向 `gridSize` 40 格, 笔刷半径 `trailSize` 0.1 x 宽 (高斯, sigma 为半径一半), 寿命 `maxAge` 250ms (前 0.3 升起再线性落), `interpolate` 5 补点, 力度 = 位移比例平方 x 10000 钳到 0.3..1, `gap` 0.08, `shape` square / circle / diamond, `decay` fade / shrink / dither (4x4 有序抖动), `glow` 0.4, `clickBurst` (一圈 10 点); 点上限 256. color / trailColor 换成 tone / trailTone (陈旧半段用 trailTone). flow / gravity / sparkle / shine / gooeyFilter / imageSrc 与 easingFunction 不落地. 区域组件包 children, 没有活点时停帧; 减弱动效不画轨迹. pointer 族已接在 `@hx/ui/surface` 上, 按 Animations 段的规矩段内不动 api 快照, 所以 CellTrail 先不进族 index.ts, 段尾接入时一并导出. |

窗口级指针跟踪 (track.ts) 留在本族: 磁吸要在宿主外按 padding 算距离, 锁定光标要读事件目标, 而 backdrop 内核的指针只挂在宿主上, 坐标归一化. 色调 (tone.ts) 只映射到 text-* 语义类与 token 名, 不收任意色值. 常数按组件具名放在 tokens.ts, 注释写原规格名; 规格没给的数标 "本库定".

## Alternatives considered

- 什么都不做 / 复用现有: 最强理由是 craft 已有按下与跟随弹簧, effects 已有 SpotlightCard. 否决: 它们只覆盖单个元素的按下与静态光斑, 没有吸力场, 锁框, 扫光状态机与图片尾迹; 硬塞进 SpotlightCard 会让一张卡片背上四种状态机.
- 照规格原样自写半隐式积分与 120Hz 子步: 最强理由是数值与上游逐帧一致. 否决: 帧循环与弹簧只走 src/motion; 解析解在任意帧长都精确, 不需要子步.
- 本族自带一套画布舞台 (单画布, 像素比上限, 离屏停帧): 最强理由是不用等别的提交. 否决: surface 层只能有一套渲染底座, 即 backdrop/kernel, 与 motion 合并成一套是同一原则; 画布件等它提交再接.

## Consequences

导出入口由主线统一接, 本次不改 src/index.ts. ENGINE-GAP: src/motion 没有指针速度采样器, track.ts 用 approach 平滑逐事件速度; craft/ease 只收具名 cubic-bezier, 没有余弦与 GSAP power 系列, tokens.ts 局部给出 cosineEase 与 powerOut.
