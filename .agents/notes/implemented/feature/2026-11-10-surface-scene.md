# Agent Note: 揭示与立体场 (surface/scene)

Status: implemented

Decision-ID: surface-scene

## Code

- `src/surface/scene/tokens.ts`
- `src/surface/scene/parts/dot.ts`, `src/surface/scene/parts/dot-shader.ts`, `src/surface/scene/DotReveal.tsx`
- `src/surface/scene/parts/dither.ts` (误差扩散与格网, 主线程), `src/surface/scene/parts/veil-shader.ts`, `src/surface/scene/BayerVeil.tsx` (遮罩通道与 DotReveal 共用 DOT_MASK_PASS 与 parts/dot 的跟手状态)
- `src/surface/scene/parts/prism.ts`, `src/surface/scene/parts/prism-shader.ts`, `src/surface/scene/PrismOrb.tsx`
- `src/surface/scene/parts/cube.ts`, `src/surface/scene/parts/cube-shader.ts`, `src/surface/scene/CubeField.tsx`
- `src/surface/scene/parts/mesh.ts`, `src/surface/scene/parts/mesh-shader.ts`, `src/surface/scene/SpringMesh.tsx`
- `src/surface/scene/index.ts`
- `tests/surface/scene/{dot,veil,prism,cube,mesh}.test.tsx`

## Problem

docs/research/catalog/animations.md 的 HalftoneReveal, DitherVeil, CrystalizedBall, Cubes, ElasticMesh, Strands 是 Animations D 段 6 件 (CHECKPOINT 映射表 D 段 6 行). 规格原裁决 "不做" (全屏着色器场), 用户 2026-11-10 把它们列进 Animations 收编, 要求全部走内核 WebGL2 shader 通道, 走不了的标 ENGINE-GAP.

## Decision

六件都接在 backdrop 内核的 WebGL2 渲染器上 (useShaderBackdrop + BackdropShell): 内核管画布, DPR, 离屏停帧, 指针 (u_pointer, u_taps) 与颜色 (colors 选项里的 token 名在宿主作用域解析); 需要保留上一帧的状态走 ShaderSpec.passes 的乒乓通道. 只借规格的常数与 props, 自写自命名; 颜色只收语义 token 名, 规格的色值默认改成 token. field 族已接入 ./surface, 段内新件另开 scene 族, 段尾一次接入.

| 条目 | 落点 | 参数 |
| --- | --- | --- |
| HalftoneReveal | `DotReveal` | 采用: 图片按 cover 铺满, 网格转 angle 度, 逐格取格心亮度, 按 contrast / brightness / invert 调过, 暗度开方乘 0.72 格宽乘 dotScale 得网点半径 (0.72 本库定, 满暗时圆点刚好盖满格子对角), roughness 按格哈希起伏; SHAPES 六种 (dot / ellipse / square / diamond / line / cross) 用解析距离, 查 3x3 邻格取最大覆盖, 大点可溢出; 边缘按规格 smoothstep(r + w, r - w, d) * clamp(r / 2w) 的意思写成正序 smoothstep (反序在 GLSL 里未定义). MODES: mono 墨色网点在纸色上; duotone 再叠一张转 30° 吃 0.6 倍暗度的强调色网 (两值本库定), 墨网按覆盖率平方压在上面; color 用格心原色. misregistration 以格为单位偏移强调色网 (duotone) 或取样 (color) 的位置. 入场按规格 delay = |field| * 1.15 + hash * 0.06, grow = smoothstep(clamp((intro * 1.7 - delay) / 0.45)), INTRO_SECONDS 1.4. 揭开遮罩是 MASK_SCALE 0.5 的乒乓通道: 每帧减 max(dt / linger, 1/255) (下限本库定, 8 位缓冲下才褪得干净), 叠上一段从上一帧落点到本帧落点的胶囊画笔 (revealRadius, softness 羽化) 乘在场程度; 点击爆开 MAX_BURSTS 4 个, BURST_SECONDS 1.3, 半径从 0.5 倍长到 2.5 倍 revealRadius (本库定) 并随进度变淡. 跟手 tau 0.035, 在场 tau 0.16, 帧长上限 0.05, 漫游 (wander) 指针不在时 1.2 秒渐入, 走一条慢李萨如路径 (频率与幅度本库定). reverse 把遮罩反过来 (平时露原图, 指针处变网点). inkColor / accentColor / paperColor 默认 foreground / primary / background. 兜底为 cover 铺图. |
| DitherVeil | `BayerVeil` | 采用: 画面切成 pixelSize 的方格 (格数上限 480000, 超了等比放大格子, 本库定). pattern 默认 floyd: 误差扩散逐格串行, 片元里做不了, 在主线程按格网算一次 (KERNELS 取 floyd 7/3/5/1 除 16, atkinson 六邻各 1/8 共推 6/8, jarvis 12 邻除 48, sierra 取 lite 2/1/1 除 4), 结果画进 cols x rows 的小画布当纹理, 尺寸或相关 props 变了才重算; ORDERED 三种 (bayer 8x8 递归阈值, noise 按格哈希, lines 取规格 period 6 的斜线) 在片元按格算阈值. levels 档量化; palette duotone 把档位映到墨色到纸色, color 三通道各自抖动. fit 默认 contain, 留边是纸色. 亮度按 contrast (默认 1.15) / brightness 调过, 主线程与片元同一公式. 揭开遮罩与 DotReveal 同一乒乓通道 (MASK_SCALE 0.5, MAX_BURSTS 4, BURST_SECONDS 1.2, 每帧褪 dt / linger, 跟手 0.035 / 在场 0.16 / 漫游 1.2 秒渐入 / 帧长上限 0.05, 均为规格值). rim 在遮罩 0.5 等值线两侧 0.18 带宽 (本库定) 里混入 rimColor. 入场 INTRO_MS 1100: 先露原图, 抖动由上往下铺开. inkColor / paperColor / rimColor 默认 foreground / background / accent. 兜底为按 fit 铺图. |
| CrystalizedBall | `PrismOrb` | 采用: 一遍上屏片元, 宿主中心一颗玻璃球 (size 0.7 为直径占短边比例). 电弧主干 MAX_STRANDS 8 从中心伸到 0.96 半径, 按极坐标角距乘半径求距离, 角度上叠值噪声抖动 (幅度随 crackle) 与一点弯曲, 芯 + 7 倍宽的指数晕, 线宽按规格 swell = 0.8 + 0.4 (0.5 + 0.5 sin(3θ + 0.7t + seed 1.7)) 起伏; 支弧 MAX_ARCS 4 挂在随机主干旁, 按 1/6 秒时间片闪烁 (出现率随 crackle); 主干落点有耀斑 (flares), 沿弧的火星 (sparks). 玻璃按规格内沿 smoothstep(0.955, 0.985, r), 边光 smoothstep(0.8, 0.97, r), 顶部压暗 1 - 0.35 pow(max(lift, 0), 1.5), 外晕 1 - smoothstep(0.05R, 0.105R, abs(dr - 0.0213R)); 高光点位置本库定. 尘埃三层 (本库定), particleCount 换算成每层格密度, MOTIONS rise / fall / drift / orbit, SHAPES square / round, depth 为层间视差, sway 横摆, 闪烁按规格 mix(1, smoothstep(-0.9, -0.6, blink), twinkle), 入场按规格 smoothstep(order, order + 0.2, reveal) 逐颗亮起; fill 与 haze 是球内填光与噪声雾. 入场 INTRO_SECONDS 2.2 电弧由中心长出; SETTLE_SECONDS 7 内多给 1.5 倍能量 (本库定) 平方回落. 悬停: 指针在 1.15 半径内时在场 tau 0.12 (本库定) 趋近, 离指针最近的主干按 hoverStrength 拉向指针, 其余按角距衰减偏一点. BALL_PRESETS 只给了名字 plasma, plasma / storm / calm / frost 四组数值本库定, 显式 props 覆盖预设. speed / paused 用内核公共的时钟倍率与暂停. color 默认 primary, 玻璃体 bodyColor 默认 background; 规格 theme 对应 lightMode. 兜底为 glowFallback. |
| Cubes | `CubeField` | 采用: n x n 方阵 (gridSize 10, 方格边长取宿主短边 / n, 居中) 俯视; 一遍片元, 每像素对所在格与 8 个邻格的方块做射线与旋转盒 (绕 x 再绕 y 倾斜, 半边长 0.5 (1 - gap)) 的板块求交, 取最近命中. perspective 0 为正交俯视, 大于 0 时相机放在 1.5 n / perspective 高处. 面按兰伯特打光 1 - shading + shading x lambert (光向本库定), faceOpacity 为面的不透明度. 边线在命中面上按到最近棱的距离画: solid 按规格 1 - smoothstep(hw - 0.5, hw + 0.5, d); dashed 每棱 4 段, 按规格 1 - smoothstep(0.25 - step, 0.25 + step, offset); dotted 每棱 5 点, 按规格 1 - smoothstep(r - 0.75, r + 0.75, d); none 不画; 掠射面上的边线按规格 smoothstep(0.06, 0.28, abs(n.z)) 收掉. JS 侧按规格: 跟手 1 - exp(-18 dt), 速度混合 1 - exp(-10 dt), 在场 attack 6 / release 2.5, 弹簧 k = 160 speed^2, c = 2 (1 - 0.82 bounce) sqrt(k), 光标扫过给角速度 (x sweepGain 4, 速度归一 0.002 本库定), 涟漪亮度 exp(-3.2 dt), 帧长上限 0.05; 方块的目标倾角朝向光标, 大小 maxAngle x (1 - d / (radius x brush))^2 x 在场权重. 点击涟漪每秒走 8 x rippleSpeed 格 (本库定), 波前扫过的方块被沿径向踢 420 度每秒 (本库定) 并发亮, 涟漪色混入面与边线. autoAnimate 时光标不在则走一条慢李萨如路径 (在场权重 0.6, 本库定). 入场 INTRO_SECONDS 1.1 由中心向外长出. speed 与公共时钟倍率同名, 改名 tiltSpeed. faceColor / edgeColor / rippleColor 默认 background / foreground / primary. 兜底为 glowFallback. |
| ElasticMesh | `SpringMesh` | 采用: 文字 (默认 "Squish", fontWeight 900) 或图片 (src) 借 field 族的 rasterText / rasterImage 栅格化, 再用 sdfCanvas 做距离场 (256, 留白 0.2, 本库定); 形状占短边 0.82 (本库定). 一遍片元: 充气高度 h = inflate x sqrt(dn (2 - dn)), dn 为归一化内深, 有限差分求法线. 环境按规格 sky = mix(skyLow, skyHigh, smoothstep(0, 0.75, y)), ground = mix(groundNear, groundFar, smoothstep(0, -0.4, y)), 分界 edge = 0.004 + blur, 地平线辉光 0.035 + blur; 遮蔽按规格 mix(0.55, 1, smoothstep(0, 12, depth)). 材质 MATERIALS balloon / chrome / jelly / clay: balloon 反射率 0.045 + 0.955 fresnel, chrome 与 jelly 0.03 + 0.97 fresnel, jelly 的 core = smoothstep(0, 1, facing) 并半透, clay 哑光; 各材质的环境模糊本库定. 不透明按规格 cover x smoothstep(0, 0.18, presence). 入场按规格欠阻尼弹簧 omega 15, zeta 0.38, 按 x 逐字延迟 0.35 秒 (本库定). 按在形状框内拖动: 抓取点 A 与位移 D, 反向扭曲 p - D exp(-|p - A - D|^2 / r^2), r = grabRadius; D 钳 stretch x 0.7 短边 (本库定); 松手按弹簧回零, 硬度按规格 firm = 0.4 + stiffness x 1.2 乘 omega 15, 阻尼比 0.7 - 0.55 wobble (本库定, wobble 0.6 时约 0.38); 按压凹陷趋向 press x 0.85, 按规格钳 [-0.6, 0.85]. 阴影为距离场偏移后的软化 (shadow 强度), 色取 background x 0.35. color 默认 primary, imageColors 时用图片原色; 规格 theme 对应 lightMode (天空 / 地面取 background / foreground 对调). 兜底为 glowFallback. |

## Consequences

- DotReveal 没有落的: 规格片元里的抠像 (uMatte / uKey, 没有对应 props), fit (固定 cover); DEFAULT_SRC 不带, src 必填. 都不需要顶点或实例化, 不标 ENGINE-GAP.
- BayerVeil 没有落的: 规格常数 HOLD 1.6 (条目只给了常数, 没写用在哪, 不落), 抠像 (uMatte / uKey, 没有对应 props); 误差扩散的格网纹理在宿主尺寸变化时于主线程重算 (大宿主加 pixelSize 1 时约数十毫秒一次), 不需要顶点或实例化, 不标 ENGINE-GAP.
- PrismOrb ENGINE-GAP (已在组件文件头与片元头标): 规格的尘埃是 STATE_WIDTH 256 的 GPGPU 状态纹理驱动的实例化粒子 (MAX_PARTICLES 40000), 带逐颗物理与深度; 内核没有实例化 / 顶点取样通道, 这里是片元里按格的三层程序化光点, 视差近似深度, 无逐颗物理, 指针推不动尘埃. PIXEL_BUDGET 4.5e6 由内核 dpr 上限 2 与 maxEdge 代替 (同 MicroSlats). 其余没有落的: dustTime 之外的规格 uniform (uTurn, uLine) 的具体用法条目未写, 按上面的近似实现.
- CubeField ENGINE-GAP (已在组件文件头标): 规格是实例化方块网格走顶点投影 (uProjection); 内核只有全屏片元, 这里片元里对邻近 9 块求交. 每块状态走 vec4 uniform 数组, 片元 uniform 向量保底只有 224 个, 所以 gridSize 上限 13 (规格无上限), 要内核能上传浮点数据纹理才能放开. 倾斜大于约 45 度且间隙很小时, 方块可能伸出邻格范围被裁一角. 其余没有落的: dpr (由内核统一管).
- SpringMesh ENGINE-GAP (已在组件文件头标): 规格是 MAX_NODES 5200 节点的质点弹簧网格 (STEP 1/480, MAX_FIELD 720) 走顶点着色器变形, 另有阴影遍与逐字零件 uParts; 内核没有顶点 / 网格通道, 这里是距离场充气 + 单抓取点高斯扭曲 + 一根阻尼弹簧, 没有逐节点传播与自遮挡, 逐字入场按 x 近似. 其余没有落的: dpr (由内核统一管), 多点同时抓取.
