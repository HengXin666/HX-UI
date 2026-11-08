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
- `src/surface/backgrounds/rays/LightPillar.tsx`
- `src/surface/backgrounds/rays/light-pillar-shader.ts`
- `src/surface/backgrounds/rays/LightTunnel.tsx`
- `src/surface/backgrounds/rays/light-tunnel-shader.ts`
- `src/surface/backgrounds/rays/Lightfall.tsx`
- `src/surface/backgrounds/rays/lightfall-shader.ts`
- `src/surface/backgrounds/rays/Lightning.tsx`
- `src/surface/backgrounds/rays/lightning-shader.ts`
- `src/surface/backgrounds/rays/PrismaticBurst.tsx`
- `src/surface/backgrounds/rays/prismatic-burst-shader.ts`

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
| LightPillar | `LightPillar` | 单通道射线步进 56 步, 扭转噪声柱累积 1 / d 辉光, 顶底两色渐变, 自转时钟 0.96 * rotationSpeed, 五次曲线入场 2.1s 自下而上揭开 (遮罩软边 0.9), 点击亮环沿柱上行 (寿命 1.4s), 视角跟手 2.4, 在场 3, 画质档 0.35 / 0.5 / 0.6. ENGINE-GAP: 规格的独立合成 / 泛光通道以峰值处解析增益近似; mixBlendMode 交给 className. 默认色 primary / accent-2. |
| LightTunnel | `LightTunnel` | 极坐标线缆隧道, 深度 1 / r, 线缆按 hash 明暗 (variance 0.9), 脉冲头 exp(-(lead / head)^2) 尾 exp(-lead / tail) 分段, 远处线缆像素级时 lod 化成整体光 (smoothstep(4, 1.2, spacing)), 近 / 远淡出, reach 1 - exp(-depth * 0.55) 驱动由外向内揭开 1.8s, 漂移 (speed + 0.2), 指针拉弯中段 tau 0.6s. 规格的 speed 与公共时钟倍率重名, 改名 drift. |
| Lightfall | `Lightfall` | 四层视差竖向光痕下落, 每列 streakCount 条, 尾巴 exp(-tail * behind) 乘 (1 - smoothstep(0.5, 0.95, behind / (0.5 * period))) 与 (1 - smoothstep(1.2, 3.2, tail * behind)) 截断, 列宽软边 smoothstep(0.72 * edge, edge), 列宽小于 1.6 到 3.2 像素时 lod 成整体光, 头部高斯辉光, 闪烁, 调色板最多 8 色按列哈希取色, 均色背景微光. 入场 2.6s 自上而下揭开, 按住冲刺 (升 2.2 / 降 1.6, 下落 1 + warp * 9 倍, 光痕拉长), 下落行程 dt * 0.1 * fallSpeed, 视差跟手时间常数 mouseDampening, 透镜跟手 6, 在场 4 / 2. ENGINE-GAP: 四级降采样泛光以峰值处解析增益近似. 规格的 speed 改名 fallSpeed, backgroundColor 不给时透明叠加. |
| Lightning | `Lightning` | 域扭曲 (WARP 2.1) 加 5 层值噪声的折线电光, 斜率修正的近似法向距离, 远处按 reach 估计剔除 (1 - smoothstep(reach * 0.6, reach, estimate)), 每条最多 3 叉, 分叉渐细 pow(1 - along, 1.6) * smoothstep(0, 0.2, along). 周期 PERIOD 8 的四分之一为一轮闪现, 显示窗 smoothstep(0, 0.03) * (1 - smoothstep(0.3, 0.42)), 稳态抖闪 0.82 + 0.18 sin sin, 起闪爆亮照亮天空. 芯线 smoothstep(gCore ± gPixel), 发白 hot = core + smoothstep(6, 20, e) * 0.55, 描边 smoothstep(1, 3.6), 辉光 1 - exp(-e * 0.35). 点击落雷读内核点击队列 (最多 4 道), 先导 0.11s 下行后爆闪, 寿命 1.3s. 揭开线 1.1 - 2.4 * intro (入场 1.2s 本库定), 下端偏向指针 (速率 5 本库定). 规格的 speed 由公共 speed 承担. 默认色 primary. |
| PrismaticBurst | `PrismaticBurst` | 体积步进 44 步的放射光束: 方向上两层 3D 值噪声成束, 阈值 edge = 0.5 - 0.35 (rayWidth - 1), rayCount 梳齿 smoothstep(0.15, 0.95, 0.5 + 0.5 cos(n * ang)), 每步 0.05 / (0.4 + stepLen) 累积, 沿半径光谱 (无调色板时余弦光谱, 有则至多 8 色循环插值) 着色, 沿半径扭转 twist, 噪声弯折 distort 随深度 smoothstep(0.35, 3.0) 生长, 中心压暗 centerFade, 起点按哈希抖动加颗粒. 三种转动 rotate / rotate3d / hover (ANIMATIONS 0 / 1 / 2), 朝向跟手时间常数 hoverDampness. 相位 phase += dt * speed * (1 + rush) + kick * dt, 点击冲量 2.5 衰减速率 3 (本库定), 点击光环寿命 1.5s 最多 4 个. 入场 2.4s 星形前沿 streak = 0.5 + 0.22 sin(5a + 1.3) + 0.16 sin(13a + 4.1) + 0.12 sin(29a + 2.2), lift = smoothstep(front, front - 0.5, r). 画质 0.35 / 0.5 / 0.7, 下限 0.2, resolution 覆盖. ENGINE-GAP: 四级泛光以峰值解析增益 glow 近似; mixBlendMode 交给 className. 规格的 speed 改名 burstSpeed. |

## Alternatives considered

- 引入 three / ogl 照搬多通道泛光: 最强理由是与上游观感更接近. 否决: 内核约束只直接调用 WebGL2, 不引依赖; 泛光以片元内的解析辉光近似.
- 每件各写一套出光与入场: 最强理由是各件互不牵连. 否决: 九件的出光, 入场, 跟手是同一套语义, 收进 field.ts 只写一次, 规格差异落在各件常数里.

## Consequences

导出入口由主线统一接, 本路只维护 `rays/index.ts`. ENGINE-GAP 逐件写在文件头, 汇总见上表.
