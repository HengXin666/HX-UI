# Agent Note: surface 层 Backgrounds lines 路 (surface/backgrounds/lines)

Status: implemented

Decision-ID: surface-backgrounds-lines

## Code

- `src/surface/backgrounds/lines/index.ts`
- `src/surface/backgrounds/lines/tokens.ts`
- `src/surface/backgrounds/lines/FloatingLines.tsx`

## Problem

L3 surface 层要落地 react-bits 的 Backgrounds 全族, 分七路并行. lines 路收以线条为主体的九件: FloatingLines, FluxLines, LineWaves, Threads, WebThreads, Waves, SlicedWaves, ShapeWaves, PatternWaves. 上游是 MIT 加 Commons Clause, HX-UI 以 Apache-2.0 发包, 不能移植; 只把 docs/research/catalog/backgrounds-1.md 与 backgrounds-2.md 条目里的常数, props 和行为描述当规格自写, 条目末尾的 "裁决: 不做" 已被用户作废.

## Decision

全部接在 surface 唯一的渲染底座 `src/surface/backdrop/kernel` 上: 着色器件用 useShaderBackdrop (WebGL2 全屏片元), 画布件用 useCanvasBackdrop; 单画布, 像素比上限, 离屏与隐藏停帧, 减弱动效只画一帧, 主题切换重解析颜色都由内核负责. 每件 props 继承 BackdropCommonProps, 由 splitCommon 拆出内核选项, 返回 BackdropShell; WebGL 不可用时铺 fallbackGradient. 颜色 prop 只收 token 名或用户色值, 默认值全是 token 名 (primary, accent, foreground, ring 等), 源码不写色值字面量.

路内共用放 tokens.ts: 调色板 uniform (vec3 u_colors[8] 与 u_color_count, 不足补最后一色), 入场进度 introProgress (减弱动效时 elapsed 为 Infinity, 直接为 1), 一阶跟随指针 stepFollow (静态帧落到目标), 画布颜色串 inkOf, 以及 GLSL_LINES (ln_palette, ln_cycle, ln_edge_fade, ln_line). 线条覆盖率统一用 abs(d) / fwidth(d) 得到设备像素距离, 斜线与直线同样 1 像素抗锯齿. 规格没给的折算系数在各件文件里具名并标 "本库定".

条目到组件:

| 规格条目 | 组件 | 取舍 |
| --- | --- | --- |
| FloatingLines | `FloatingLines` | 采用: MAX_LINES 24, MAX_CLICKS 3, INTRO 1.8s, 旋涡 turn = 1.9 * smoothstep(0, 0.23, age) * exp(-(age - 0.23) * 1.1), spread = 0.3 * (1 + 0.55 age), 抗锯齿 0.75 dpr, 光晕 tight 1 / (2.6 dpr) 与 wide 1 / (11 dpr), lift 1 + 0.8 near, 左右 edgeFade. 跟手阻尼 1 - (1 - d)^(60 dt) 换成等价时间常数走 approach. 组位置收数字 (居中坐标纵向), mixBlendMode 默认 normal 而非 screen (token 色在明暗主题都可读). |

## Alternatives considered

- 什么都不做 / 复用现有: 最强理由是 effects 已有静态渐变背景. 否决: 没有任何以线为主体, 跟手, 入场与减弱动效齐备的场; 用户已作废 "不做" 裁决.
- 每件自带 WebGL 封装或引 ogl / three: 最强理由是能照搬顶点几何 (Threads, SlicedWaves 上游是线带网格). 否决: surface 层只有一套渲染底座, 不引新依赖; 线带改为片元里逐线求距离.
- 九件各写一份调色板与入场: 最强理由是各件互不牵连. 否决: 七路共用工作区, 重复片段越多越难统一修; 路内 tokens.ts 一份即可, 不进内核.

## Consequences

出口只追加在 lines/index.ts, 总出口 src/surface/backgrounds/index.ts 已 re-export 本路; package.json 与 src/index.ts 由主线统一接. 带 ENGINE-GAP 的件在文件头写明差什么.
