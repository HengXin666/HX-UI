# Agent Note: Backgrounds 光线路 (surface/backgrounds/rays)

Status: implemented

Decision-ID: surface-backgrounds-rays

## Code

- `src/surface/backgrounds/rays/index.ts`
- `src/surface/backgrounds/rays/field.ts`
- `src/surface/backgrounds/rays/Beams.tsx`
- `src/surface/backgrounds/rays/beams-shader.ts`
- `src/surface/backgrounds/rays/LightRays.tsx`
- `src/surface/backgrounds/rays/light-rays-shader.ts`
- `src/surface/backgrounds/rays/SideRays.tsx`
- `src/surface/backgrounds/rays/side-rays-shader.ts`

## Problem

Backgrounds 全量落地分七路, rays 路收以光束, 光柱, 闪电, 棱镜为主体的九件: Beams, LightRays, SideRays, LightPillar, LightTunnel, Lightfall, Lightning, PrismaticBurst, Prism. 上游是 MIT 加 Commons Clause, HX-UI 以 Apache-2.0 发包, 不能移植; 只把 docs/research/catalog/backgrounds-1.md 与 backgrounds-2.md 里的常数, props 和行为描述当规格, 着色器与状态机全部自写, 渲染只走 `src/surface/backdrop/kernel`.

## Decision

九件都是 WebGL2 全屏片元, 接 useShaderBackdrop; 单画布, 像素比上限, 离屏与隐藏停帧, 减弱动效一帧, 主题切换重解析颜色都由内核负责. 本路共用 `field.ts`:

- `RAYS_COMPOSE` 出光: 光能先过 hx_tonemap, 不给底色时按覆盖率输出带透明度的颜色, 叠在任何底色与主题上; 给了底色则做屏幕混合后铺满. 四边淡出 rays_edge 对应条目里的 fade.
- 入场进度 introProgress (elapsed 驱动, 减弱动效直接为 1), 指数跟随 followStep (条目里的 1 - exp(-dt * k)), 光源方位 RAY_ORIGINS, 调色板 paletteList, 画质 qualityDpr (乘到像素比上限), 像素预算 budgetEdge (换成内核的最长边上限).
- 点击脉冲直接读内核的 u_taps (距今秒数在 z), 不在组件里另记队列.
- 颜色默认是 token 名 (foreground / primary / accent / accent-2), 源码里没有色值字面量. lightMode 不落地: 透明叠加输出在亮暗主题下都成立, 色由 token 随主题走.

件清单:

| 规格条目 | 组件 | 取舍 |
| --- | --- | --- |
| Beams | `Beams` | 平行凸起光带的曲面法线 + GGX 高光 + Schlick 菲涅尔 (0.028 + 0.972 (1 - vh)^5), 接缝暗线 (pixel * 1.5), 入场 1.6s, 光源跟手速率 7, reach 升 3.2 / 降 1.8, 像素预算 1.6M. 光源静止时自己绕圈 (本库定). |
| LightRays | `LightRays` | 角向两层值噪声成束, 阈值 0.62 按 raySharpness 锐化, 源头辉光 smoothstep(-0.2, 0.6, cos), 雾气 0.65 / 0.35 两层, 指针影子 smoothstep(0.97, 1.25, along) * exp(-trail * 1.1), 点击外扩脉冲最多 4 个 (读内核点击队列). 开场 1.8s, 转向 tau 0.2s, 影子 0.08 / 0.25 / 0.5s, 像素预算 2.4M. 规格里减弱动效时 0.35 倍速常驻, 此处按内核约定只画一帧. |
| SideRays | `SideRays` | 侧向扇形双色光束: 两层值噪声 0.7 / 0.3 成束, fwidth 抗锯齿 smoothstep(0.12, 0.45), 聚光 1 + z * exp(-((a - x) / y)^2), 衰减 1 / (1 + (r / 0.4)^falloff), 揭开 1.6s, 高光泛白 smoothstep(0.7, 1) * 0.55, 浮尘闪烁 0.55 + 0.45 sin. 朝向用临界阻尼弹簧 (刚度 18), 聚光跟手速率 6, 偏离上限 spread * 1.5. 默认时钟倍率 2.5 落在公共 speed. 默认色 primary / foreground. |

## Alternatives considered

- 引入 three / ogl 照搬多通道泛光: 最强理由是与上游观感更接近. 否决: 内核约束只直接调用 WebGL2, 不引依赖; 泛光以片元内的解析辉光近似.
- 每件各写一套出光与入场: 最强理由是各件互不牵连. 否决: 九件的出光, 入场, 跟手是同一套语义, 收进 field.ts 只写一次, 规格差异落在各件常数里.

## Consequences

导出入口由主线统一接, 本路只维护 `rays/index.ts`. ENGINE-GAP 逐件写在文件头, 汇总见上表.
