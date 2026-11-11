# Agent Note: 跟手画布 (surface/cursor)

Status: implemented

Decision-ID: surface-cursor

## Code

- `src/surface/cursor/tokens.ts`
- `src/surface/cursor/parts/common.ts`
- `src/surface/cursor/parts/meld.ts`, `src/surface/cursor/MeldCursor.tsx`
- `src/surface/cursor/parts/halo.ts`, `src/surface/cursor/HaloCursor.tsx`
- `src/surface/cursor/parts/haze.ts`, `src/surface/cursor/HazeCursor.tsx`
- `src/surface/cursor/parts/fluid.ts`, `src/surface/cursor/parts/fluid-shader.ts` (Halo / Haze 共用流体通道, 2026-11-10 补做)
- `src/surface/cursor/parts/halo-fluid.ts`, `src/surface/cursor/parts/halo-shader.ts`, `src/surface/cursor/parts/haze-fluid.ts`, `src/surface/cursor/parts/haze-shader.ts`
- `src/surface/cursor/parts/flock.ts`, `src/surface/cursor/FlockCursor.tsx`
- `src/surface/cursor/parts/streamer.ts`, `src/surface/cursor/StreamerCursor.tsx`
- `src/surface/cursor/parts/nudge.ts`, `src/surface/cursor/NudgeGrid.tsx`
- `src/surface/cursor/index.ts` (common.ts 的 clamp / mix / seededRandom 等通用小工具不导出, 只导出 pointerPx / pointerVelocityPx / Body, 避开 pointer 与 texture 族已公开的同名符号)
- `tests/surface/cursor/{meld,halo,haze,flock,streamer,nudge}.test.tsx`, `tests/surface/cursor/support.ts` (挂载前钉住宿主矩形)

## Problem

docs/research/catalog/animations.md 的 BlobCursor, GlowCursor, GhostCursor, SwarmCursor, Ribbons, CursorGrid 是 Animations B 段 6 件. 规格原裁决 "不做" (全屏着色器场), 用户 2026-11-10 把它们列进 26 件. 上游许可是 MIT 加 Commons Clause, 只把条目的常数与 props 当规格, 自写自命名.

## Decision

六件都接在 backdrop 内核的 Canvas2D 渲染器上 (useCanvasBackdrop + pointer 族的 SurfaceLayer, 与 TapSparks 同一做法): 内核管画布尺寸, DPR, 离屏停帧, 指针 (宿主上监听, 归一化坐标, presence, 点击队列) 与颜色 (token 名在宿主作用域解析). 颜色只收色调名. 画布叠在 children 上方, aria-hidden 且不接指针. 减弱动效时只清屏不画.

| 条目 | 落点 | 参数 |
| --- | --- | --- |
| BlobCursor | `MeldCursor` | MAX_TRAIL 16, MAX_DROPS 96, 质量下限 0.2, 一次损失 clamp(lost x 2.4, 0.25, 0.7), 等 0.28s 回长, 回长速率 mix(0.9, 6, regrow), 形变时钟 dt x 4 x morphSpeed^1.5, 子步 1/240; props `size` 140, `morphSpeed` 0.4, `trail` 16, `lag` 0.55, `goo` 1, `stretch` 0.6, `wobble` 1, `splash`, `splashCount` 6, `splashSpeed` 0.5, `splashSize` 0.5, `splashGravity` 0, `regrow` 0.5, `shine` 1, `hideCursor` true, `tone`; 本库定: 头部刚度 mix(600, 60, lag) 阻尼比 0.8, 尾链 tau 0.02 + 0.06 x lag, 拉伸满格 1500px/s 上限 0.6, 晃动 0.06, 溅滴 900px/s x splashSpeed 寿命 1s, 重力 1800 x splashGravity, 一次损失 lost = splashSize x count / 24 |
| GlowCursor | `HaloCursor` | 平静衰减 exp(-dt x 1.2), 三层余辉 exp(-dt x 4.6 / (linger x 1.2 / 0.8 / 0.2)); props `intensity` 1.3, `trailWidth` 3, `linger` 1.4, `glow` 1.2, `hotspot` 0.8, `followSpeed` 0.6, `clickBurst`, `enabled`, `tone`, `secondaryTone`; 本库定: 轨迹点上限 160, 间距 3px, 线宽单位 6px, 跟手 tau 0.12 x (1 - followSpeed) + 0.01, 热点模糊 26px, 点击光环 0.7s 到 120px |
| GhostCursor | `HazeCursor` | 出现 1.9s, 在场 0.12 进 / 0.08 出, 浓度保留 exp(-dt / (0.12 + trailLength x 0.022)), 弹簧 520 x (1 - inertia)^2 + 26 阻尼 2 sqrt(k) x 0.92, 拖拽 exp(-dt x 2.4), 漂移 drift x 110 px/s, 子步 1/240; props `size` 80, `trailLength` 50, `inertia` 0.5, `turbulence` 0.5, `drift` 0.3, `brightness` 1, `clickPuff`, `intro`, `tone` (默认 foreground); 本库定: 烟团上限 140, 每 6px 一团, 胀大到 2.2 倍, 湍流 40px, 点击 14 团 260px/s |
| SwarmCursor | `FlockCursor` | MAX_PARTICLES 2000, 入场 1.4s (smoothstep), 抓取 (1 - exp(-dt x 20)) x clamp(moving / 240, 0, 1) x presence, 旋涡衰减 exp(-dt / (0.35 + 1.5 x swirl)), 聚拢 12 / 拉回 30 乘 (0.2 + 0.8 x ease), 指针速度钳 4000 平滑 exp(-dt x 30), 在场 0.25, 每帧两个半步; props `count` (规格 800, 本库默认 400), `size` 2.6, `shape` dot / square / streak, `spread` 90, `speed` 1, `swirl` 0.6, `wander` 0.5, `depth` 0.7, `idle` roam / still, `clickEffect` burst / none, `intro`, `enabled`, `tone`, `accentTone`; 本库定: 漫游利萨如 9s / 7s, 炸开冲量 900px/s, 游走力 60, 聚拢项再乘 0.1 |
| Ribbons | `StreamerCursor` | POINTS 50, 定步 1/120, 弹簧量 0.03 x 4^(2 x stiffness - 1), omega 60 sqrt(spring x pull), 阻尼 2 zeta 60 sqrt(spring) x drag, 身体跟随 1 - 0.183^((1 / length) x dt x 60), 半宽 thickness x 0.5 x width x smoothstep(0, 1.5 thickness, 总长), comet (1 - u)^1.2 sqrt(smoothstep(0, 0.1, u)), even sqrt(smoothstep(0, 0.06, u) smoothstep(0, 0.06, 1 - u)); props `thickness` 30, `length` 1.4, `spread` 18, `stiffness` 0.5, `bounce` 0.5, `shape` lens / comet / even, `wave` 0, `fade`, `opacity` 1, `tones` (规格 colors); 本库定: lens 曲线 sqrt(4u(1 - u)), zeta 1 - 0.8 x bounce, 各条拉力 / 拖拽 / 宽度在 0.85..1.15 错开, 偏移角均分一圈, 波浪 3 周 4 rad/s |
| CursorGrid | `NudgeGrid` | 入场 1.4s 从中心展开, 跟手 0.07, 在场 0.25, 起亮 0.045, 熄灭步长 dt / (fadeDuration / 1000), 环境闪格概率 ambient x dt x 格数 x 0.04; props `cellSize` 60, `radius` 140, `falloff` smooth / linear / sharp, `highlight` area / cell, `holdTime` 400, `fadeDuration` 800, `lineWidth` 1, `maxOpacity` 1, `fillOpacity` 0.06, `gridOpacity` 0.08, `gridStyle` lines / dashed / dots / crosses, `cellRadius` 0, `cellGap` 0, `spotlight` 0.6, `clickPulse`, `pulseSpeed` 600, `ambient` 0, `edgeFade` 0.2, `intro`, `tone`, `gridTone` (规格 color / gridColor); 本库定: 波环宽 1 格, 最远 1200px, 虚线 6 / 6, 亮格填充透明度 fillOpacity x 4 x 亮度, 聚光 spotlight x 0.4 |

做法:

- MeldCursor: 头部是沿速度方向拉伸的椭圆, 尾链是逐点一阶跟随的圆, 相邻两点之间画 round cap 的粗线当粘连带 (粗细 x goo). 高光是 background 色调的小圆.
- HaloCursor (2026-11-10 补做, 改走内核 WebGL2 着色器通道): 光头 (stepHalo 跟手) 这一帧走过的线段打成线段溅点, 进一张稳定流体: 速度通道 (自平流, 平静衰减 exp(-dt x 1.2), 溅点按 FLOW 0.75 并入, 压力投影滞后一帧), 散度, Jacobi 压力 (PRESSURE_STEPS 20, 画质档 low 6 / medium 12 / high 20), 染料三通道 energy / gas / halo 按规格三层余辉各自衰减, 单遍 MacCormack 近似 (前向取样加一半往返误差, 夹到邻域内); 场景按规格密度 1 - exp(-((energy x 1.1 + gas x 0.8) x intensity + halo x 0.25)) 与墨色 tint x min(1, 0.5 / tone) x mix(0.95, 0.72, smoothstep(0.5, 3, energy)), 主尾色按 energy 与 halo 的比例混, 热芯趋向 foreground (lightMode 时不趋白); 泛光走 backgrounds/bloom 金字塔 (glow 为强度); 上屏按规格边缘 smoothstep(0, 0.02, 边距) 与颗粒. 点击打径向推开的溅点.
- HazeCursor (2026-11-10 补做, 改走内核 WebGL2 着色器通道): 烟头弹簧与烟团发射仍由 stepHaze 管, 烟团老化 (2026-11-11 补, 本库定, 规格没有这一层): 每团带 age 与寿命, 寿命 = (0.12 + trailLength x 0.022) x ln 50 x sqrt(size / 80) 夹 0.4..12 秒 (即染料场浓度降到 2% 的时长, 烟头越大散得越久), 浓度在寿命末 30% 线性淡出并按 puffRadius 胀大, 过寿命出表; 没打过的烟团从老到新每帧至多 maxSplats 12 团打成溅点 (补色乘当前浓度), 排队里已过寿命的不发射 (原来超出 12 的直接丢); 已进场的染料仍按规格 uDecay 随 dt 衰减. 理由: 老化各团独立, 不整场一起乘; 点击喷 14 团不再丢 2 团. 减弱动效时 dt 为 0, 不推进不老化; fadeDelayMs / fadeDurationMs 的上屏渐隐不受影响; 烟雾场两条通道: 速度 (自平流, 拖拽 exp(-dt x 2.4), 上漂 drift x 110 px/s, 旋度值噪声湍流, 不做压力投影, 同规格 SIM 的自写积分) 与染料 body / smoke (按 trailLength 衰减, MacCormack 近似). 场景按规格 wisp = pow(smoothstep(0.18, 0.82, smoke), 2) x 2.8, cloud = body x smoothstep(0, 0.32, body) x 1.15, 法线打光 0.7 + 0.5 x max(dot(n, normalize(-0.35, 0.55, 0.75)), 0), 芯 smoothstep(0.7, 2.2, cloud); 细节噪声 (detail) 调制 smoke; edgeIntensity 为梯度轮廓光. 上屏按规格覆盖 1 - exp(-(a + bloom x bloomStrength x 0.6) x 0.95), grainIntensity 颗粒, fadeDelayMs / fadeDurationMs 静止后线性隐去. bloomRadius 按级数衰减远级权重, bloomThreshold 为金字塔阈值.
- FlockCursor: 粒子数据放一张 Float32Array (每粒 9 槽), 每种颜色并成一条路径一次 fill 或 stroke; 深度大于 0.8 的近处粒子用 accentTone.
- StreamerCursor: 轮廓是头加 50 点沿法向左右偏移的多边形, 一条一次 fill; fade 时逐段四边形按 1 - u 透明度填. 规格没有减弱动效分支, 本库照族规矩在减弱动效时不画.
- NudgeGrid: 画布垫在 children 下方 (SurfaceLayer front=false). 网格线一条路径一次描; 聚光是把网格在指针圆内裁剪后用主色调再描一遍. 减弱动效时内核只画一帧, 网格静态, 不点亮.

## Consequences

- MeldCursor 没有落的: 着色器里的等值面融合 (这里用粘连带近似, 观感接近, 不需要顶点, 不标 ENGINE-GAP), material / depth / morph 形状族 / drip 滴落 / shadow / blend, 溅滴落回再被吸收 (这里寿命走完淡出).
- HaloCursor 没有落的 (2026-11-10 补做后): 规格 BLOOM_LEVELS 5, 内核泛光金字塔上限 4 级 (BLOOM_MAX_LEVELS), 取 4; blendMode (画布 CSS 混合, 宿主是 SurfaceLayer, 混合会连带 children, 不落). quality 已落 (画质档), theme 落为 lightMode, maxDevicePixelRatio 落为内核 dpr 上限. 半浮点渲染目标不可用时同 InkSplash 退 RGBA8 范围编码, 精度不足 (InkSplash 已标 ENGINE-GAP, 这里同源).
- HazeCursor 没有落的 (2026-11-10 补做后): mixBlendMode 与 zIndex (同上, 宿主是 SurfaceLayer, 不落), targetPixels (由内核 maxEdge 代替). detail, bloomStrength / bloomRadius / bloomThreshold, edgeIntensity, grainIntensity, theme (lightMode), fadeDelayMs / fadeDurationMs, maxDevicePixelRatio 已落.
- FlockCursor 没有落的: 规格的压力网格 (CELL 16, MAX_COLS 72 x MAX_ROWS 48, PRESSURE_STEPS 12, 粒子互斥) 与实例化绘制; targets (吸附到链接), tail / trail 拖影, hideCursor, lightMode. 2000 个实例化粒子在 Canvas2D 上偏重, 默认降到 400; 粒子互斥不做, 群会叠在一起. ENGINE-GAP: 实例化绘制 (内核没有实例化通道), 已在组件文件头标注 (2026-11-10 补).
- StreamerCursor 没有落的: DETAIL 4 的样条细分 (这里每段 1 个采样, 50 点已经够顺), softness 边缘羽化, backgroundColor, dpr.
- NudgeGrid 没有落的: 网格线的边缘渐隐 (只对亮格做), lightMode, dpr. 环境闪格的随机源是按 cellSize 播种的可复现随机数.
- HaloCursor / HazeCursor ENGINE-GAP (2026-11-10 补做时标, 组件文件头 + CHANGELOG 0.16.0 一致): 同 InkSplash, 半浮点渲染目标不可用时退 RGBA8 范围编码, 精度不足.
