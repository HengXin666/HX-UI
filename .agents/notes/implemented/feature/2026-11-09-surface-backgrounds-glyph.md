# Agent Note: surface 背景 glyph 路 (surface/backgrounds/glyph)

Status: implemented

Decision-ID: surface-backgrounds-glyph

## Code

- `src/surface/backgrounds/glyph/index.ts`
- `src/surface/backgrounds/glyph/kit.ts`
- `src/surface/backgrounds/glyph/Dither.tsx`
- `src/surface/backgrounds/glyph/use-glyph-atlas.ts`
- `src/surface/backgrounds/glyph/GradientASCII.tsx`
- `src/surface/backgrounds/glyph/LetterGlitch.tsx`
- `src/surface/backgrounds/glyph/FaultyTerminal.tsx`
- `src/surface/backgrounds/glyph/CRTWarp.tsx`
- `src/surface/backgrounds/glyph/PixelBlast.tsx`
- `src/surface/backgrounds/glyph/PixelSnow.tsx`
- `src/surface/backgrounds/glyph/Radar.tsx`
- `src/surface/backgrounds/glyph/radar-shader.ts`
- `src/surface/backgrounds/glyph/Scanner.tsx`
- `src/surface/backgrounds/glyph/scanner-shader.ts`

## Problem

L3 surface 层要落地 react-bits 的 Backgrounds 全族. glyph 路收以像素格, 字形格与扫描显示为主的九件: Dither, GradientASCII, LetterGlitch, FaultyTerminal, CRTWarp, PixelBlast, PixelSnow, Scanner, Radar. 上游是 MIT 加 Commons Clause, HX-UI 以 Apache-2.0 发包, 不能移植; 只把 docs/research/catalog/backgrounds-1.md 与 backgrounds-2.md 里的常数, props 和行为描述当规格, 着色器与状态全部自写.

## Decision

九件全部接在 surface 唯一的渲染底座 `src/surface/backdrop/kernel` 上: 单画布, 像素比上限, 离屏与隐藏停帧, 减弱动效只画一帧, 颜色 token 在宿主作用域解析并跟随主题. 指针与点击取内核的 u_pointer 与 u_taps, 入场进度由内核的 elapsed 算 (减弱动效时 elapsed 为 Infinity, 入场视为已完成). 颜色只收 token 名或用户 prop, 默认值都是 token 名; WebGL 不可用时铺 fallbackGradient.

本路共用 `kit.ts`: 入场进度, 解析色取值与平铺成 vec3 数组, 具名模式换编号, 字形图集的 uniform, 以及 GLSL 片段 (Bayer 8 / 4 / 2 递归阈值, 图集字形采样, 无图集时的方块字形). 字形类件用内核的 createGlyphAtlas 画图集, 拿不到 2d 上下文时着色器退到方块画法.

条目到组件:

| 规格条目 | 组件 | 取舍 |
| --- | --- | --- |
| Dither | `Dither` | 采用: 八种抖动模式, 三种指针效果 (erase / reveal / ripple), 调色板上限 8, 入场 1.8 秒, 点击涟漪 1.6 秒, 拖尾衰减 exp(-dt / (0.08 + 0.7 * trail)). 拖尾用内核的乒乓离屏通道 (四分之一分辨率) 代替上游的 16 点轨迹; 点击涟漪读内核的点击队列 (最多 8 个, 规格上限 4 不再单独裁). enableMouseInteraction 换成公共的 mouseInteraction, dpr 走公共 prop. |
| GradientASCII | `GradientASCII` | 采用: 四种形状 (horizon / pinch / rise / eclipse) 按规格的拱线, 呼吸与日食环常数写成形状场, 色带上限 8 (smoothstep(0.3, 1, t) 选段, smoothstep(0, 0.38, t) 作覆盖), 字形格宽高比 0.6, 点击效果 wave / burst 寿命 1.2 秒, 入场 2.4 秒按随机次序显字. 指针轨迹 (规格 24 点, 寿命 0.7 秒) 换成拖尾通道, 衰减时间常数 0.35 秒; 景深用远离中心时字形化成平均覆盖近似, 不做真模糊. |
| LetterGlitch | `LetterGlitch` | 采用: 字符集, 静息换字 0.2 次每秒并按两层噪声 (0.65 / 0.35, 指数 2.03) 以 flow 调制, 闪烁频率 0.1 * glitchAmount ** 1.6, smooth 时按 exp(-4 * age / fade) 淡出, 指针搅动按 1400 像素每秒封顶, 入场 1.4 秒. 上游的逐格 CPU 状态 (延迟, 衰减, 游走者) 换成按格哈希把闪烁事件排在时间轴上的无状态着色器; tear 撕裂寿命 0.6 秒与格子尺寸 (高 = fontSize * (1 + 0.5 * spacing), 宽 = 0.6 倍高) 为本库定. lightMode 不单列, 换色靠 token. |
| FaultyTerminal | `FaultyTerminal` | 采用: 三种字形画法 (blocks / dots / characters), 点击 glitch 0.7 秒与 degauss 1.6 秒, 入场 2 秒按 smoothstep 逐格亮起, 噪声首层幅度 0.5 * noiseAmp, 圆点半径 0.36 + 0.06 * on, 乱码翻动 1.2 + scramble * 18, 指针增亮 1 + mouseGlow * 1.3, 余辉 persistence ** (dt * 60), 暗角边宽 0.04 + 0.22 * vignette. 管线分两段: 满分辨率屏幕通道 (乒乓, 自带余辉) 与上屏后期 (弯曲, 色差, 5x5 辉光, 扫描线, 抖动). tint 默认换成 foreground token, 另加 backgroundColor (默认 background) 垫底; 指针坐标按平面屏幕计, 不随弯曲反算. |
| CRTWarp | `CRTWarp` | 采用: 四种荫罩 (none / aperture / shadow / slot), 格宽高比 0.56, 入场 1.6 秒逐行预热且荧光按 rise = dt / 0.22 上升, 点击垂直翻滚 0.8 秒 (接缝 smoothstep(0, 0.05) 消隐, 首尾 0.08 渐入), 余辉 persistence ** (dt * 60) 且减弱动效时为 0, 工频干扰 0.24 * interference, 闪烁 0.1 * flicker, 暗角 mix(1, smoothstep(0, 1, 1 - 2 * r^2), vignette). 管线分满分辨率内容通道 (乒乓余辉, columns 分格, 四种波场变体量化成 levels 级) 与上屏后期 (弯曲, 圆角, 色移, 5x5 辉光, 荫罩, 扫描线, 颗粒). 上游 speed 默认 0.5 折进着色器时钟, 公共 speed 默认 1; 指针的弹簧质点换成内核的平滑在场程度, 表现为磁偏拉扯并加大色移; lightMode 不单列, 换色靠 token. |
| PixelBlast | `PixelBlast` | 采用: 六种形状 (square / circle / triangle / diamond / cross / ring), 三种悬停 (none / grow / reveal), 入场 1.8 秒按 1 - (1 - t) ** 2.4 缓出由中心向外显影 (前沿 smoothstep(front + 0.04, front - 0.06, r)), 形状边长 0.5 * sqrt(覆盖度), 十字臂长 0.42 * s 与臂宽 0.13 * s + 0.02, 柔化 smoothstep(-0.12 * softness, 0.12 * softness, margin), 尺寸抖动 1 + (h - 0.5) * jitter. 图案场为五层梯度噪声按 Bayer 8 阈值判亮; 点击上限从 10 收到内核队列的 8, 涟漪寿命 3 秒为本库定; 上游的透视平面与 LOD / 景深淡出没做, 只铺平面; 图案振幅区间 RANGE_MIN / RANGE_MAX 换成直接归一化到 0..1 覆盖度. |
| PixelSnow | `PixelSnow` | 采用: 雪花图案边长 9 (snowflake / star / dot / crystal / mixed), 景深 5 层, 入场 1.4 秒, 体内 Bayer 4 阈值 (b + 0.5) / 16 抖动三级明暗 body = 0.94 - 0.13 * 级, 积雪增长 (0.25 + density * 0.9) * dt * min(1, speed). ENGINE-GAP: 上游的 CPU 粒子 (至多 4000 片, 速度, 推开与携带积分) 换成按层格子哈希的无状态着色器, 每格至多一片; 指针推开改成以指针为心的径向拉伸加附近减淡, 不随指针速度携带. 积雪用八分之一分辨率的乒乓高度场 (高度上限占画面 0.16, 增长折算系数 0.04, 指针融化每秒 1.5 为本库定). 底透明, 颜色默认 foreground token, lightMode 不单列; 上游 speed 与 opacity, paused, dpr 走公共 props. |
| Radar | `Radar` | 采用: 两种模式 (sweep / pulse), 极坐标网格含 ringCount 6 道距离环, 外环, 每度刻度 (5 度与 15 度加长到 0.035 / 0.055, 刻度过密按 smoothstep(2.5, 5) 淡出), spokeCount 12 根辐条, 正方位轴与外框 1.065; 扫描一圈 4 秒 (本库定, 随公共 speed), 扫过处余亮 exp(-behind / trail) (trail 默认 0.35), 杂波为 4 阶分形成团 smoothstep(0.5, 0.78) 按 clutter 0.35 撒点; 目标上限 16 (默认 6), 沿慢速漂移轨道运动, 被扫到时亮起并保留 4 次历史回波 (0.25 递减). 指针在盘内出现锁定框并按 exp(-d^2 / 0.01) 点亮附近目标; 入场 2.2s 依次画出环, 外环, 辐条, 刻度与扫描. tilt 钳在 0..70 度按 cos 纵向压扁, centerY 自上而下给; backgroundColor 默认 transparent 不铺底, 叠在宿主背景上. 颗粒 0.03, fade 外缘淡出. 减弱动效只画一帧. |
| Scanner | `Scanner` | 采用: 三种扫描方向 (vertical / horizontal / diagonal), 条纹为正弦 (frequency 2, scale 1.5) 加梯度噪声起伏 (ripple 0.22) 后按 bandDensity 11 等距取线, 线宽 lineWidth 1.2 按 fwidth 抗锯齿, 每条亮度 0.62 + 0.38 * 哈希, 过密时 smoothstep(0.2, 0.55) 淡成平均灰; 扫描行程 -1.3..1.3, 速度 sweepSpeed 0.25, 前沿宽 0.1 sweepWidth 用 color3 (foreground) 高光, 扫过处余亮 exp(-behind / (0.6 trail)), 余亮从 color1 (primary) 过渡到 color2 (accent) 并按 colorSpread 0.7 铺展. 指针附近 exp(-d^2 / 0.03) 条纹鼓起并增亮; 点击回波最多 6 个, 外扩 0.55 每秒, 环宽 0.12 + 0.1 age, 亮度 exp(-0.9 age) * smoothstep(0, 0.12, age), 寿命 5s; 入场 2s 由扫描起点一侧展开. 扫描线 0.5, 颗粒 0.04, 暗角 0.3. 上游 speed 默认 0.5 折进着色器时钟, 公共 speed 默认 1. 减弱动效只画一帧. |

## Alternatives considered

- 什么都不做 / 复用现有: 最强理由是 effects 已有若干静态背景. 否决: 它们没有量化抖动, 字形场与扫描显示, 也不接 backdrop 内核的停帧与减弱动效.
- 每件自起 WebGL 上下文与 rAF: 最强理由是可以逐件定制管线. 否决: surface 层只能有一套渲染底座, 帧循环只走 src/motion.

## Consequences

导出由主线统一接, 本路只改 glyph/index.ts. 带 ENGINE-GAP 的件在文件头写明差什么.
