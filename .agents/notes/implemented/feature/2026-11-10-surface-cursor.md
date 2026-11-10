# Agent Note: 跟手画布 (surface/cursor)

Status: implemented

Decision-ID: surface-cursor

## Code

- `src/surface/cursor/tokens.ts`
- `src/surface/cursor/parts/common.ts`
- `src/surface/cursor/parts/meld.ts`, `src/surface/cursor/MeldCursor.tsx`
- `src/surface/cursor/parts/halo.ts`, `src/surface/cursor/HaloCursor.tsx`
- `src/surface/cursor/parts/haze.ts`, `src/surface/cursor/HazeCursor.tsx`
- `src/surface/cursor/parts/flock.ts`, `src/surface/cursor/FlockCursor.tsx`
- `src/surface/cursor/index.ts`
- `tests/surface/cursor/{meld,halo,haze,flock}.test.tsx`, `tests/surface/cursor/support.ts` (挂载前钉住宿主矩形)

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

做法:

- MeldCursor: 头部是沿速度方向拉伸的椭圆, 尾链是逐点一阶跟随的圆, 相邻两点之间画 round cap 的粗线当粘连带 (粗细 x goo). 高光是 background 色调的小圆.
- HaloCursor: 轨迹点按间距留下, 每段按三层 (外晕 2.6 倍宽, 主体, 热芯 0.4 倍宽) 各自的余辉描线, shadowBlur 做光晕, 叠加混合 lighter; 尾部半段用 secondaryTone.
- HazeCursor: 烟团是 shadowBlur 等于半径的软圆, 浓度乘 0.28 的透明度叠出烟雾.
- FlockCursor: 粒子数据放一张 Float32Array (每粒 9 槽), 每种颜色并成一条路径一次 fill 或 stroke; 深度大于 0.8 的近处粒子用 accentTone.

## Consequences

- MeldCursor 没有落的: 着色器里的等值面融合 (这里用粘连带近似, 观感接近, 不需要顶点, 不标 ENGINE-GAP), material / depth / morph 形状族 / drip 滴落 / shadow / blend, 溅滴落回再被吸收 (这里寿命走完淡出).
- HaloCursor 没有落的: 规格的流体模拟 (速度场平流, MacCormack, 压力投影 20 步, 5 级 bloom) 换成轨迹描线; 观感是光带而不是流体卷动. 真要流体需要多张浮点纹理与多遍片元, 内核单 pass 片元管线做不到, 不过这条走的是 Canvas2D 近似, 不标 ENGINE-GAP. grain, quality, theme, blendMode 不落地.
- HazeCursor 没有落的: 规格的烟雾场 (双缓冲平流, 法线光照, bloom 多级降采样, grain) 换成软圆粒子; detail, bloom*, edgeIntensity, grainIntensity, theme, mixBlendMode, fadeDelayMs / fadeDurationMs, targetPixels 不落地.
- FlockCursor 没有落的: 规格的压力网格 (CELL 16, MAX_COLS 72 x MAX_ROWS 48, PRESSURE_STEPS 12, 粒子互斥) 与实例化绘制; targets (吸附到链接), tail / trail 拖影, hideCursor, lightMode. 2000 个实例化粒子在 Canvas2D 上偏重, 默认降到 400; 粒子互斥不做, 群会叠在一起, 不标 ENGINE-GAP (观感可接受).
