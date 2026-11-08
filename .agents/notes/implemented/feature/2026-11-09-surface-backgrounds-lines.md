# Agent Note: surface 层 Backgrounds lines 路 (surface/backgrounds/lines)

Status: implemented

Decision-ID: surface-backgrounds-lines

## Code

- `src/surface/backgrounds/lines/index.ts`
- `src/surface/backgrounds/lines/tokens.ts`
- `src/surface/backgrounds/lines/FloatingLines.tsx`
- `src/surface/backgrounds/lines/FluxLines.tsx`
- `src/surface/backgrounds/lines/LineWaves.tsx`
- `src/surface/backgrounds/lines/line-waves-shader.ts`
- `src/surface/backgrounds/lines/Threads.tsx`
- `src/surface/backgrounds/lines/threads-shader.ts`
- `src/surface/backgrounds/lines/WebThreads.tsx`
- `src/surface/backgrounds/lines/web-threads-shader.ts`
- `src/surface/backgrounds/lines/Waves.tsx`
- `src/surface/backgrounds/lines/waves-shader.ts`
- `src/surface/backgrounds/lines/SlicedWaves.tsx`
- `src/surface/backgrounds/lines/sliced-waves-shader.ts`
- `src/surface/backgrounds/lines/ShapeWaves.tsx`
- `src/surface/backgrounds/lines/shape-waves-shader.ts`
- `src/surface/backgrounds/lines/shape-waves-field.ts`

## Problem

L3 surface 层要落地 react-bits 的 Backgrounds 全族, 分七路并行. lines 路收以线条为主体的九件: FloatingLines, FluxLines, LineWaves, Threads, WebThreads, Waves, SlicedWaves, ShapeWaves, PatternWaves. 上游是 MIT 加 Commons Clause, HX-UI 以 Apache-2.0 发包, 不能移植; 只把 docs/research/catalog/backgrounds-1.md 与 backgrounds-2.md 条目里的常数, props 和行为描述当规格自写, 条目末尾的 "裁决: 不做" 已被用户作废.

## Decision

全部接在 surface 唯一的渲染底座 `src/surface/backdrop/kernel` 上: 着色器件用 useShaderBackdrop (WebGL2 全屏片元), 画布件用 useCanvasBackdrop; 单画布, 像素比上限, 离屏与隐藏停帧, 减弱动效只画一帧, 主题切换重解析颜色都由内核负责. 每件 props 继承 BackdropCommonProps, 由 splitCommon 拆出内核选项, 返回 BackdropShell; WebGL 不可用时铺 fallbackGradient. 颜色 prop 只收 token 名或用户色值, 默认值全是 token 名 (primary, accent, foreground, ring 等), 源码不写色值字面量.

路内共用放 tokens.ts: 调色板 uniform (vec3 u_colors[8] 与 u_color_count, 不足补最后一色), 入场进度 introProgress (减弱动效时 elapsed 为 Infinity, 直接为 1), 一阶跟随指针 stepFollow (静态帧落到目标), 画布颜色串 inkOf, 以及 GLSL_LINES (ln_palette, ln_cycle, ln_edge_fade, ln_line). 线条覆盖率统一用 abs(d) / fwidth(d) 得到设备像素距离, 斜线与直线同样 1 像素抗锯齿. 规格没给的折算系数在各件文件里具名并标 "本库定".

条目到组件:

| 规格条目 | 组件 | 取舍 |
| --- | --- | --- |
| FloatingLines | `FloatingLines` | 采用: MAX_LINES 24, MAX_CLICKS 3, INTRO 1.8s, 旋涡 turn = 1.9 * smoothstep(0, 0.23, age) * exp(-(age - 0.23) * 1.1), spread = 0.3 * (1 + 0.55 age), 抗锯齿 0.75 dpr, 光晕 tight 1 / (2.6 dpr) 与 wide 1 / (11 dpr), lift 1 + 0.8 near, 左右 edgeFade. 跟手阻尼 1 - (1 - d)^(60 dt) 换成等价时间常数走 approach. 组位置收数字 (居中坐标纵向), mixBlendMode 默认 normal 而非 screen (token 色在明暗主题都可读). |
| FluxLines | `FluxLines` | 采用: INTRO 1.8s, ref = 700 / max(scale, 0.05), 平流 200 px/s 乘 speed (默认 0.5), band = 5 rimWidth, reveal = smoothstep(0.2, 0.85, ...), core = smoothstep(line + 0.75, line - 0.75, px) * max(smoothstep(0.08, 0.6, glow), reveal), 磁铁强弱 tau 0.3s, 跟手 tau = mouseDampening. 线为流向坐标系里噪声扭曲场的等值线 (每参考尺度 16 条, 本库定), 第二层噪声给线身亮段 (pow sharpness). 旋涡常数本库定 (1.6 转, 0.2s 起, 1.4 衰减). transparent false 时铺 backgroundColor token. |
| LineWaves | `LineWaves` | 采用: MAX_RIPPLES 4, INTRO 1.8s (扫线 span = 0.5 sqrt(aspect^2 + 1), reveal = 1 - smoothstep(sweep - 0.6, sweep, x)), 时钟倍率 2.5 与 speed 默认 0.3, 颜色循环 0.05 cycleSpeed, 扭曲 w = 0.6 sin(q.x 0.55 + 0.4t + 0.6 sin(q.y 0.9 - 0.28t)), 漂移 0.7 (0.18 sin(1.6x - 0.33t + 0.7) + 0.1 sin(3.1x + 0.21t)), 高光带 center 0.5 (0.2 sin 0.17t + 0.08 sin(0.29t + 1.3)) 宽 0.13 highlightWidth, crowd = smoothstep(0.18, 0.5, fwidth), shimmer 噪声 mix 0.5, 涟漪 fade = exp(-1.3 age) smoothstep(0, 0.12, age), 跟手 tau 0.1 s 透镜在场 tau 0.2 s. 三色 uniform 换成调色板 ln_cycle (至多 8 色); 透镜半径 0.22, 推开 0.03, 涟漪 0.6 短边/s 环宽 0.05 本库定; fold 与 PIXEL_BUDGET 交给内核 DPR / 最长边上限. |
| Threads | `Threads` | 采用: 包络 smoothstep(split, max(0.7, split + 0.2), x), blur = smoothstep(split, split + 0.05, x) * perc, 纵向 0.5 + (perc - 0.5) distance + 噪声 / 2 * 振幅, 线宽 7 thickness px (1 - perc), alpha = 1 - smoothstep(0, 1, perc^0.3) taper, 覆盖率按线宽 / 绘制宽守恒, 跟手 tau 1/3 s, 拨开在场 tau 1/4 s 且 parting > 0 才响应, speed 默认 0.6. 上游线带网格改为片元逐线求距离 (至多 128 条, 本库定), 覆盖率用 1 - (1 - a)(1 - b) 叠加防止发白成片; 拨开半径 0.18 与位移 0.12, 虚化 5 px softness 本库定; MAX_RENDER_DIM 交给内核最长边上限. |
| WebThreads | `WebThreads` | 采用: MAX_THREADS 24, MAX_COLORS 6, MAX_SURGES 3, SURGE 1.6s 逐线错开 0.05s, STROKE 1.25s 与 staggerFor = min(0.12, 0.9 / (n - 1)) 的逐线描出, born = smoothstep(-0.05, 0.03, head), amp = 1 + i taper, 结点 spacing 1 / nodes 与 twist = depth smoothstep(0, 0.07, |x - hub|), depth = 0.5 + 0.5 cos(z), core = smoothstep(0.5, 2.2, energy) 混芯色, focal = smoothstep(2, 9, energy fade) 0.25, speed 默认 0.2, 光晕 glow / d^falloff. 收拢包络 |sin(PI x nodes)|^pinch, 光晕缩放 0.15, 指针拉线 (tau 0.12 s, 力度 0.35) 与 pulses 的自动光点 (0.25 pulses 每秒) 本库定; backgroundColor 不给时透明. |
| Waves | `Waves` | 采用: 线距 spacing 10 CSS 像素, 线宽 1, 位移场两层梯度噪声 (尺度 0.0028 scale, 0.55 / 0.45 混合), 方向角 n * twist * 2.2 + m * variation * 2, 幅度 amplitude 32 CSS 像素; 虚线周期 WAVES_CELL 12; 跟手 tau 0.045s 与在场 tau 0.06s 取条目原式, 指针推挤半径 175 按 exp(-d^2 / r^2) 衰减; 拖动甩出为弹簧, 阻尼比 zeta = 1 - bounce (默认 0.5), omega = 2 PI / returnDuration (默认 1.4s), 子步 min(16, max(1, ceil(dt / min(1/120, 0.6 / omega)))); 点击涟漪至多 8 个, 640 px/s 外扩, 环宽 64, 衰减 exp(-1.2 age); 染色 heat = smoothstep(0, 1, 0.8 energy) 从 lineColor (foreground) 混到 accentColor (primary); 入场 2.2s 由中间向两侧长出. 指针速度换弹簧目标系数 WAVES_DRAG 0.06 本库定; backgroundColor 不给时透明, lightMode 线收到 0.85, mixBlendMode 交宿主 style. 减弱动效只画一帧, 弹簧归零. |
| SlicedWaves | `SlicedWaves` | 采用: MAX_RIBBONS 6 (默认 3), 竖条间距 28 CSS 像素占宽 barWidth 0.5, 透视 FOCAL 1.1 与 DISTANCE 2.6, 缩放 s = 3.7 / (3.7 + perspective * curve * u^2 * 2) (默认 0.45 / 0.5), 飘带高 0.26, 间距 spread 0.1, 起伏 amplitude 0.1 * sin(3 frequency u + 0.8t + 1.3 i), 竖向边缘按 erf 近似高斯虚化 (blur 0.6), slices 横切成段; 叠加后 1 - exp(-1.4 peak brightness) 压缩 (brightness 1.25), smoothstep(1.1, 3.2) 处泛白 0.75; 抬起在场进 / 离 tau 0.25 / 0.6s, 位置 tau 0.12s, 抬起 0.12 exp(-(3 (u - x))^2); 聚焦弹簧 v += (36 (target - focus) - 11 v) dt 取条目原式, 聚焦飘带提亮 1 + 0.6 exp(-(2.5 d)^2); 入场 1.5s 条身从中线长出. 默认色 accent / primary / ring (调色板至多 8 色按飘带序分布), position 0.78, 颗粒 0.08, fade 左右淡出. 减弱动效只画一帧, 抬起与聚焦直接落到指针. |
| ShapeWaves | `ShapeWaves` | 采用: SHAPE_MODES mixed / squares / circles / triangles (mixed 按格哈希), NOISE_CELLS 32 (每 32 格一个噪声周期, 乘 scale), TIME_RATE 0.1, SIMULATION_STEP 1/60 固定步长 (一帧至多补 4 步), WAVE_SPEED 0.42 / WAVE_FRICTION 0.94 / WAVE_DECAY 0.972 的四邻阻尼波, SETTLED_THRESHOLD 0.01 后清零停算, MAX_MASK_SIZE 1024 的文字遮罩, 暗角 1 - smoothstep(max(0, 1 - 2.2 fade), 1, radius), 入场 INTRO_BAND 0.2 / WARP 0.3 / JITTER 0.16 / END 1.66 与 front = 1 - smoothstep(0, 1, abs(intro - spread) / band), 覆盖率 smoothstep(aa, -aa, sdf), tint = mix(color, hover, max(smoothstep(0.15, 0.85, charge), 0.35 front)), GLOW_THRESHOLD 0.6, introDuration 1.6s, introKey 变化重放入场. 上游 2d 逐帧画改为 WebGL2 片元按格求形状 SDF, 波场在 JS 侧积分后打包成一格一纹素 RGBA8 纹理 (仿 GridDistortion), 格数每边上限 360 本库定; 水花量按指针挪动格数 (满一格满量) 与 (1 - d / r)^2 落点本库定, charge 撑大形状 0.6 与光晕 exp(-3d) 本库定; 颜色默认 muted-foreground / foreground, backgroundColor 不给时透明; MAX_DPR, IntersectionObserver, visibilitychange 与减弱动效交给内核, CSS 600ms 淡入由入场波前代替. |

## Alternatives considered

- 什么都不做 / 复用现有: 最强理由是 effects 已有静态渐变背景. 否决: 没有任何以线为主体, 跟手, 入场与减弱动效齐备的场; 用户已作废 "不做" 裁决.
- 每件自带 WebGL 封装或引 ogl / three: 最强理由是能照搬顶点几何 (Threads, SlicedWaves 上游是线带网格). 否决: surface 层只有一套渲染底座, 不引新依赖; 线带改为片元里逐线求距离.
- 九件各写一份调色板与入场: 最强理由是各件互不牵连. 否决: 七路共用工作区, 重复片段越多越难统一修; 路内 tokens.ts 一份即可, 不进内核.

## Consequences

出口只追加在 lines/index.ts, 总出口 src/surface/backgrounds/index.ts 已 re-export 本路; package.json 与 src/index.ts 由主线统一接. 带 ENGINE-GAP 的件在文件头写明差什么.
