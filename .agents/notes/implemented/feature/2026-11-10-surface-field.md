# Agent Note: 着色器场 (surface/field)

Status: implemented

Decision-ID: surface-field

## Code

- `src/surface/field/tokens.ts`
- `src/surface/field/parts/ink.ts`, `src/surface/field/parts/ink-shader.ts`, `src/surface/field/InkSplash.tsx`
- `src/surface/field/parts/merge.ts`, `src/surface/field/parts/merge-shader.ts`, `src/surface/field/MergeBlobs.tsx`
- `src/surface/field/parts/mask.ts` (文字 / 图片 / 路径栅格化成遮罩画布, 屏幕到遮罩的 GLSL 映射, ChromeMark 与后面的形状件共用)
- `src/surface/field/parts/chrome.ts`, `src/surface/field/parts/chrome-shader.ts`, `src/surface/field/ChromeMark.tsx`
- `src/surface/field/parts/beam.ts`, `src/surface/field/parts/beam-shader.ts`, `src/surface/field/BeamFlow.tsx`
- `src/surface/field/parts/lens.ts`, `src/surface/field/parts/lens-shader.ts`, `src/surface/field/RippleLens.tsx`
- `src/surface/field/parts/sdf.ts` (遮罩到有符号距离场 + 16 位编码与 GLSL 解码, SoftShape 与 SparkMark 共用)
- `src/surface/field/parts/soft.ts`, `src/surface/field/parts/soft-shader.ts`, `src/surface/field/SoftShape.tsx`
- `src/surface/field/parts/spark.ts`, `src/surface/field/parts/spark-shader.ts`, `src/surface/field/SparkMark.tsx`
- `src/surface/field/index.ts`
- `tests/surface/field/{ink,merge,chrome,beam,lens,soft,spark}.test.tsx`

## Problem

docs/research/catalog/animations.md 的 SplashCursor, MetaBalls, MetallicPaint, LaserFlow, RippleDistortion, ShapeBlur, ElectricLogo 是 Animations C 段 7 件 (CHECKPOINT 映射表 C 段 7 行, 26 件 = 7 + 6 + 7 + 6). 规格原裁决 "不做" (全屏着色器场), 用户 2026-11-10 把它们列进 26 件, 并定 "全走 shader 通道". 上游许可是 MIT 加 Commons Clause, 只把条目的常数与 props 当规格, 自写自命名, 不引 three / ogl.

## Decision

七件都接在 backdrop 内核的 WebGL2 渲染器上 (useShaderBackdrop + BackdropShell, 与 Backgrounds 的 LiquidEther / Lightfall 同一做法): 内核管画布, DPR, 离屏停帧, 指针 (u_pointer, u_taps) 与颜色 (colors 选项里的 token 名在宿主作用域解析), 多遍模拟走 ShaderSpec.passes 的乒乓离屏通道, 泛光复用 `src/surface/backgrounds/bloom.ts` 的金字塔. 拿不到 WebGL2 时 BackdropShell 铺 CSS 兜底. 颜色只收 token 名. 每个片元程序提交前用 glslangValidator 编译过一遍 (jsdom 里只有假上下文, 单测查不出 GLSL 语法错).

| 条目 | 落点 | 参数 |
| --- | --- | --- |
| SplashCursor | `InkSplash` | BLOOM_THRESHOLD 0.3, BLOOM_KNEE 0.7, BLOOM_ITERATIONS 4 (金字塔 4 级), 推力 6000 x force / sqrt(spread), 补色 0.15 x intensity x min(dt x 60, 1) / sqrt(spread), 点击 1100 x force, 帧长上限 1/60, 花瓣 0.78 + 0.22 sin(5a + seed) sin(3a - 1.7 seed), 平流 uv - dt x v x texel 再除 (1 + dissipation x dt), 涡度力 0.5 (abs(T) - abs(B), abs(R) - abs(L)) 归一乘 curl x C 且 y 取反, 抖动 (hash - 0.5) / 255 x smoothstep(0, 0.03, peak); props `colors` (token 名), `rainbow` true, `colorSpeed` 1, `intensity` 1, `size` 1, `force` 1, `swirl` 3, `trail` 1, `momentum` 1, `shading` 1, `glow` 0, `quality` low / medium / high, `clickSplash`, `intro`, `lightMode` (规格 theme); 本库定: spread = size, 溅点半径 0.0025 x size (以画面高为 1 的平方), 涡度 swirl x 10, 染料耗散 1 / trail, 速度耗散 0.2 / momentum, 压力热启动 0.8, 画质档 sim 0.12 / 0.18 / 0.25 dye 0.3 / 0.45 / 0.6 压力 8 / 14 / 20 次, 入场 1.2s 画一道 S 形, 彩虹色相 0.25 x colorSpeed 圈每秒 |
| MetaBalls | `MergeBlobs` | MAX_BALLS 50, VISIBLE 0.877 (= 1 / sqrt(1.3)), 阈值 1.3^gamma, 影响范围 2^(0.5 / gamma), 球间贴近 -60 x (core - d) 之外 pull x min(rp, rq) x smoothstep(0, 0.6, t) x (1 - smoothstep(0.82, 1, t)) 除以质量, 光标球 -140 x (core - d) 之外 pull x 0.6 x rp 同窗 除以 rp^2 + 0.05, 入场延迟 0.1 + 0..0.55 再 1.15s 缓入缓出, 光标速度平滑 1 - exp(-dt / 0.05), 跟手 1 - (1 - hoverSmoothness)^(dt x 60), 过密等值环淡出 smoothstep(6 line, 12 line, spacing / rate); props `color` foreground, `cursorBallColor` primary, `ballSpeed` 0.3 (规格 speed, 与公共时钟倍率重名), `enableMouseInteraction`, `hoverSmoothness` 0.1, `animationSize` 30, `ballCount` 15, `clumpFactor` 1, `cursorBallSize` 3, `variant` solid / outline / contour, `motion` orbit / drift / still, `gooeyness` 0.5, `stickiness` 0.5, `stretch` 0.5, `wobble` 0.5, `lineWidth` 1.5, `rings` 4, `clickBurst`, `intro`; 本库定: 世界单位为画布短边 / animationSize, 球半径 1..2.2, gamma = mix(3, 0.6, gooeyness), pull = 30 x stickiness, core 0.6 (rp + rq), 作用范围 2.2 (rp + rq), 回轨弹簧 6 阻尼 3, 轨道幅度 0.3 x animationSize x clumpFactor, 点击冲量 40 单位每秒 8 单位内线性衰减, 拉伸 |v| / 12 x stretch 上限 1.5, 晃动 1 + 0.1 x wobble x sin(3t + 相位), 等值环逐级乘 0.7 |
| MetallicPaint | `ChromeMark` | WORKING_SIZE 512 (遮罩长边), 时钟 0.3 x (time + 2.8), 细条 0.12 / cycleWidth x (1 - 0.4 bump) 与 0.07 / cycleWidth x (1 + 0.4 bump), 条纹 mix 链 smoothstep(0, 2 blur) / smoothstep(border, border + 2 blur) / 末段 0.5 blur, 边缘弯折 direction -= 2 x noise x diag x s(edge)(1 - s(edge)), direction *= mix(1, 1 - edge, smoothstep(0.5, 1, contour)), direction -= 1.7 x edge x smoothstep(0.5, 1, contour); props `imageSrc`, `text`, `fontFamily` system-ui, `fontWeight` 800, `color` foreground, `backgroundColor` transparent, `density` 2, `softness` 0.1, `dispersion` 0.3, `distortion` 0.07, `edgeBend` 0.6 (规格 contour 对应), `angle` 70, `scale` 0.6, `rotation` 0, `mouseTilt` 0.5, `lightMode`, `intro`; 本库定: 隆起场在遮罩内解泊松 (源项 4 / r^2, r = 通道短边 x scale / 2), 通道比例 0.15, 每帧 24 次 Jacobi 静态帧 240 次, 倾斜弹簧 tau 0.25s 最大 0.6 rad, 入场 1.2s 由下往上扫亮, 色散错开 dispersion x 0.08 x (0.3 + edge), 亮色 mix(tint, 白, 0.7) 暗色 tint x 0.12 (浅色 0.45) |
| LaserFlow | `BeamFlow` | 起亮 smoothstep(-6, 12, f), 纹 0.88 + 0.24 noise(u x 6, f / 22 - 1.7t), 色带 smoothstep(50, 75, f) / smoothstep(100, 125, f), 侧光 smoothstep(-24, 24, dx), 铺展 250 x spread, runMask 1 - smoothstep(run - 34, run + 6, adx), flowMask (1 - smoothstep(0.75 spread, 1.1 spread, adx)) x runMask, 贴地光 exp(-(below / 14)^2) 与 exp(-(below / 40)^2), 呼吸 1 + pulse (0.12 sin(1.5708 t) + 0.08 (noise - 0.5)), 揭幕前沿 1 - smoothstep(front - 70, front + 8, f); props `beamPosition` 0.6, `surfaceLevel`, `colors` (规格单色 color, 着色器里的 TINTS 色板换成三个 token 色), `intensity` 1.8, `beamWidth` 1.5, `flare` 1.5, `spread` 1.5, `spill` 1, `fog` 0.2, `dust` 1.6, `streaks` 1.5, `dots` 1, `pulse` 1.5, `speed` 1.5 (即公共时钟倍率), `seed` 3, `mouseInteraction`, `revealImage`, `revealRadius` 220, `revealOpacity` 0.6, `intro`, `lightMode` (规格 theme), `paused`, `dpr`; 本库定: surfaceLevel 是落点高度占宿主高的比例 默认 0.78, 色带的 f 按落点归一到 130, 落下 0.9s 再铺展 1.2s (缓出立方), 光柱随指针横移最多 12% 宿主宽 tau 0.3s, 尘点 9px 格子 上浮 22px/s, 光点间距 46px |
| RippleDistortion | `RippleLens` | MAX_WAVES 100, QUALITY_SCALE low 0.4 / medium 0.7 / high 1 (乘像素比上限), START_SCALE 1.5 (出生半径 brushSize / 2 / 1.5), EDGE exp(-5) (振幅 exp(-age x fade) 低于它出队, 寿命 5 / fade); props `src` (必填), `brushSize` 150, `strength` 0.2, `swirl` 1, `rings` 4, `spread` 5, `fade` 3, `spacing` 15, `dispersion` 0, `glint` 0, `tint` primary, `tintAmount` 0.1, `grayscale` true, `highlightColor` foreground, `trigger` hover / click / both, `clickStrength` 2, `quality` low, `enabled`, `alt` (本库加, 给了宿主就是 role=img); 本库定: 波半径每秒长 spread x brushSize x 0.1, 波带宽 brushSize x 0.25 (高斯 exp(-2x^2)), 位移 brushSize x 0.25 x strength, 带内 rings 道起伏 cos(x x rings x pi), 漩涡 0.5 x swirl x sin 相位, 色散错开 dispersion x 0.3 |
| ShapeBlur | `SoftShape` | FIELD 512, PAD 0.35, FAR 1e20 (图片形状的距离变换), 自转 (angle + spin x dt) % 360, 透镜跟手 1 - exp(-dt x (在场 10 / 闲置 3)), 力度 1 - exp(-dt x 4), 透镜遮罩 power x (1 - smoothstep(r (1 - soft), r, dist)); props `shape` rect / circle / polygon, `src`, `sides` 6, `size` 0.8, `roundness` 0.2, `thickness` 2, `fill`, `echoes` 1, `spacing` 12, `color` foreground, `blur` 16, `lensSize` 0.3, `lensSoftness` 0.7, `focus`, `chroma` 0.3, `rotation`, `spin`, `idle`, `children`; 本库定: 失焦是按距离场把边缘展宽 blur 像素 (smoothstep, 峰值按 (hw + aa) / (hw + aa + blur) 压低), 回声向外每条 spacing 像素 渐弱到 0.4 上限 8 条, 色散按 chroma x 0.35 x 当前模糊错开距离, 闲置利萨如 9s / 7s 幅度 0.3 短边 |
| ElectricLogo | `SparkMark` | RASTER 560, CELL 4, FAR 1e20, ARCS 5, PULSES 3, 形变 morph += dt / (排队 0.3 : 1.6) 与逐像素 k = smoothstep(0, 1, morph x 1.7 - 0.35 + 0.35 wobble(p / unit x 0.018)), 脉冲进度 dt / 1.4 包络 exp(-front^2) x w x exp(-age x 1.7), 呼吸 1 + flicker x 0.6 wobble(2.1t), swell 0.5 + 0.5 wobble(q x 0.06 + (0.9t, 5.1 fi - 0.6t)), vis mix(0.3 + 0.45 smoothstep(-0.25, 0.2, wobble(q x 0.035 + (0.21t, 3.7 fi))), 1, lead), spark 1 - flicker x 0.3 (0.5 + 0.5 wobble(6t, 2.3 fi)), 本体 smoothstep(0.75, -0.75, base) x fill x (0.06 + 1.2 min(halo, 1)) x (1 + heat x 0.5), 支弧 fade smoothstep(reach, 0.55 reach, edge), alpha 1 - exp(-energy x gain), 光标弹簧 v += ((p - x) 120 - 19 v) dt, 力度 tau 0.3 / 0.55, 帧长上限 0.05; props `src`, `color` accent (规格色值改 token), `glowColor` primary (同), `scale`, `intensity`, `glow`, `thickness`, `strands`, `bend`, `crackle`, `arcs`, `flicker`, `fill`, `speed` (公共), `interactive`, `cursorIntensity`, `cursorRadius`, `lightMode` (规格 theme); 本库定: 各 props 默认值 (规格条目没有记), 自画闪电 SPARK_BOLT 24 视框, 脉冲每 1.1s 发一个, 支弧 reach 14 x glow 格, 电弧宽 thickness x unit x 0.35, 主弧抖动 1.2 格 其余 2.5 格, gain 1.6 |

做法:

- InkSplash: 通道顺序 速度 (用上一帧压力投影, 自平流, 涡度约束, 溅点) -> 散度 -> 压力 Jacobi -> 染料 (用投影后的速度平流, 溅点补色) -> 泛光场景 (按浓度梯度打光) -> 金字塔各级 -> 上屏. 投影滞后一帧, 与 LiquidEther 相同. 速度与压力按范围编码 (1024 / 512), 8 位缓冲也存得下负值. glow 为 0 时金字塔 0 级, 只多一遍场景通道. 减弱动效时内核只画一帧, 场景改画静态墨迹 (第一色).
- MergeBlobs: 模拟在 JS 里 (球数上限 49 加 1 个光标球, O(n^2) 两两力), 每帧把球打包成 u_balls / u_shapes 两个 vec4[50] 数组, 片元里逐像素求和. 拉伸是把偏移投影到速度方向上再缩短. 描边与等值环用 fwidth(field) 把场值差换成像素距离.
- ChromeMark: 遮罩是 Canvas2D 画的白字 / 原图 (512 长边), 交给 ShaderSpec.textures 上传 (内核按对象身份缓存). 规格在 CPU 上解 512 的泊松方程; 这里换成一个低分辨率离屏通道每帧迭代 24 次, 首几帧里隆起从边缘往里长满, 观感像入场. 遮罩异步就绪 (图片加载) 时组件重渲染, 静态帧随之重画.
- BeamFlow: 单遍上屏片元, 坐标换成 CSS 像素 (gl_FragCoord / u_dpr, y 从顶部量), 光叠加后取峰值当不透明度并做色调压缩. 揭图用 ShaderSpec.textures 上传 revealImage, 在场程度跟 u_pointer.z.
- RippleLens: 波队列在 JS 里 (CSS 像素), 每帧打包成 u_waves vec4[100] (设备像素的位置, 半径, 当前振幅), 片元里逐波累加位移再按 cover 取图. 图片异步加载, 未就绪时画布透明.
- SoftShape: 失焦按规格走离屏 (按序补做第 5 件): 形状遍 (满分辨率, 清晰覆盖, 三通道按最大失焦的色散错开) -> 横向高斯 -> 纵向高斯 (各 0.5 倍分辨率, 15 采样覆盖正负 3 西格玛, 西格玛 = blur x 0.5, 本库定); 上屏在解析的清晰层与失焦层之间按透镜插值 (focus 反过来). 图片形状在 JS 里做 512 的两遍一维距离变换 (Felzenszwalb 下包络), 编码进 RGBA8 的 R/G 两字节, 片元里 texelFetch 手动双线性解码.
- SparkMark: 图形 (自带闪电的 Path2D 或图片) 栅格化成 560 的遮罩, 走 parts/sdf.ts 得到距离场, 两张 (旧 / 新) 同时作为纹理传入, sdfGlsl(name) 生成各自的解码函数; 换 src 时旧的挪到 from, 形变进度从 0 走. 电弧, 支弧, 脉冲全部是距离场上的解析光线 (w^2 / (d^2 + w^2)), 一遍上屏.

## Consequences

- InkSplash 没有落的: contained (本库永远在宿主内, 不铺满视口), zIndex (宿主是普通块, 由使用方定层级), 闲置停帧 (内核按可见性停帧, 不按指针闲置). ENGINE-GAP (同 LiquidEther): 内核在不支持半浮点渲染目标时退到 RGBA8, 速度与压力按范围编码后精度不足, 流体会发涩, 染料也会在 1 处截断; 要内核加高精度打包才能补.
- MergeBlobs 没有落的: enableTransparency (本库永远透明叠在宿主上), dpr (走内核公共 dpr). motion 规格只给了默认 orbit, drift / still 是本库补的两档.
- ChromeMark 没有落的: 规格的 u_imageAspect / u_scale 等映射细节按本库自己的 maskUv 重写; 图片跨域加载失败时没有形状 (画布透明, 不退兜底). 遮罩文字对读屏不可见, 使用方要给可读文本.
- BeamFlow 没有落的: surfaceRef (跟随页面上另一个元素的顶边当地面; 内核只量自己的宿主, 这里改成 surfaceLevel 比例), 规格的固定 TINTS 色板 (颜色只走 token), MAX_RENDER_DIM 与 BASE_SATURATION, 揭图按宿主拉伸而不是 cover 裁切.
- RippleLens 没有落的: 规格的 uTexel / uTextureSize 细节按本库自己的 cover 映射重写. 图片跨域失败时画布透明 (不退兜底).
- SoftShape 没有落的: 无 (真高斯已补). 色散是最大失焦时的三通道错开, 局部失焦按插值同比缩小. 图片距离场在主线程算 (512 x 512 约几十毫秒), 换图时一次.
- SparkMark 没有落的: PIXEL_BUDGET (按 4e6 像素压低像素比; 内核只有统一的 dpr 上限), 规格里 tGlowFrom / tGlowTo 两张预模糊辉光纹理 (这里辉光由距离场 exp(-d / (6 glow unit)) 直接算, 不要离屏), 2d 画布逐帧层. 脉冲沿轮廓的位置用极角近似, 凹形图形上不严格沿边走.
- ENGINE-GAP 复核 (2026-11-10 定, 组件文件头, 本 note, CHANGELOG 0.16.0 三处一致): SoftShape 失焦不标 ENGINE-GAP, 理由是不涉顶点 / 实例化 / 深度; 真高斯卷积已走内核 passes 补上. SparkMark 的 PIXEL_BUDGET (内核 dpr 上限与 maxEdge 代替) 与预模糊辉光 / 2d 画布逐帧层 (距离场解析辉光代替) 不标, 是有意替代不再补; 脉冲极角近似是未落项, 排进待办 (改为轮廓弧长参数).
