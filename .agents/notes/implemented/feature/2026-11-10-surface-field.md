# Agent Note: 着色器场 (surface/field)

Status: implemented

Decision-ID: surface-field

## Code

- `src/surface/field/tokens.ts`
- `src/surface/field/parts/ink.ts`, `src/surface/field/parts/ink-shader.ts`, `src/surface/field/InkSplash.tsx`
- `src/surface/field/parts/merge.ts`, `src/surface/field/parts/merge-shader.ts`, `src/surface/field/MergeBlobs.tsx`
- `src/surface/field/parts/mask.ts` (文字 / 图片 / 路径栅格化成遮罩画布, 屏幕到遮罩的 GLSL 映射, ChromeMark 与后面的形状件共用)
- `src/surface/field/parts/chrome.ts`, `src/surface/field/parts/chrome-shader.ts`, `src/surface/field/ChromeMark.tsx`
- `src/surface/field/index.ts`
- `tests/surface/field/{ink,merge,chrome}.test.tsx`

## Problem

docs/research/catalog/animations.md 的 SplashCursor, MetaBalls, MetallicPaint, LaserFlow, RippleDistortion, ShapeBlur, ElectricLogo 是 Animations C 段 7 件 (CHECKPOINT 映射表 C 段 7 行, 26 件 = 7 + 6 + 7 + 6). 规格原裁决 "不做" (全屏着色器场), 用户 2026-11-10 把它们列进 26 件, 并定 "全走 shader 通道". 上游许可是 MIT 加 Commons Clause, 只把条目的常数与 props 当规格, 自写自命名, 不引 three / ogl.

## Decision

七件都接在 backdrop 内核的 WebGL2 渲染器上 (useShaderBackdrop + BackdropShell, 与 Backgrounds 的 LiquidEther / Lightfall 同一做法): 内核管画布, DPR, 离屏停帧, 指针 (u_pointer, u_taps) 与颜色 (colors 选项里的 token 名在宿主作用域解析), 多遍模拟走 ShaderSpec.passes 的乒乓离屏通道, 泛光复用 `src/surface/backgrounds/bloom.ts` 的金字塔. 拿不到 WebGL2 时 BackdropShell 铺 CSS 兜底. 颜色只收 token 名. 每个片元程序提交前用 glslangValidator 编译过一遍 (jsdom 里只有假上下文, 单测查不出 GLSL 语法错).

| 条目 | 落点 | 参数 |
| --- | --- | --- |
| SplashCursor | `InkSplash` | BLOOM_THRESHOLD 0.3, BLOOM_KNEE 0.7, BLOOM_ITERATIONS 4 (金字塔 4 级), 推力 6000 x force / sqrt(spread), 补色 0.15 x intensity x min(dt x 60, 1) / sqrt(spread), 点击 1100 x force, 帧长上限 1/60, 花瓣 0.78 + 0.22 sin(5a + seed) sin(3a - 1.7 seed), 平流 uv - dt x v x texel 再除 (1 + dissipation x dt), 涡度力 0.5 (abs(T) - abs(B), abs(R) - abs(L)) 归一乘 curl x C 且 y 取反, 抖动 (hash - 0.5) / 255 x smoothstep(0, 0.03, peak); props `colors` (token 名), `rainbow` true, `colorSpeed` 1, `intensity` 1, `size` 1, `force` 1, `swirl` 3, `trail` 1, `momentum` 1, `shading` 1, `glow` 0, `quality` low / medium / high, `clickSplash`, `intro`, `lightMode` (规格 theme); 本库定: spread = size, 溅点半径 0.0025 x size (以画面高为 1 的平方), 涡度 swirl x 10, 染料耗散 1 / trail, 速度耗散 0.2 / momentum, 压力热启动 0.8, 画质档 sim 0.12 / 0.18 / 0.25 dye 0.3 / 0.45 / 0.6 压力 8 / 14 / 20 次, 入场 1.2s 画一道 S 形, 彩虹色相 0.25 x colorSpeed 圈每秒 |
| MetaBalls | `MergeBlobs` | MAX_BALLS 50, VISIBLE 0.877 (= 1 / sqrt(1.3)), 阈值 1.3^gamma, 影响范围 2^(0.5 / gamma), 球间贴近 -60 x (core - d) 之外 pull x min(rp, rq) x smoothstep(0, 0.6, t) x (1 - smoothstep(0.82, 1, t)) 除以质量, 光标球 -140 x (core - d) 之外 pull x 0.6 x rp 同窗 除以 rp^2 + 0.05, 入场延迟 0.1 + 0..0.55 再 1.15s 缓入缓出, 光标速度平滑 1 - exp(-dt / 0.05), 跟手 1 - (1 - hoverSmoothness)^(dt x 60), 过密等值环淡出 smoothstep(6 line, 12 line, spacing / rate); props `color` foreground, `cursorBallColor` primary, `ballSpeed` 0.3 (规格 speed, 与公共时钟倍率重名), `enableMouseInteraction`, `hoverSmoothness` 0.1, `animationSize` 30, `ballCount` 15, `clumpFactor` 1, `cursorBallSize` 3, `variant` solid / outline / contour, `motion` orbit / drift / still, `gooeyness` 0.5, `stickiness` 0.5, `stretch` 0.5, `wobble` 0.5, `lineWidth` 1.5, `rings` 4, `clickBurst`, `intro`; 本库定: 世界单位为画布短边 / animationSize, 球半径 1..2.2, gamma = mix(3, 0.6, gooeyness), pull = 30 x stickiness, core 0.6 (rp + rq), 作用范围 2.2 (rp + rq), 回轨弹簧 6 阻尼 3, 轨道幅度 0.3 x animationSize x clumpFactor, 点击冲量 40 单位每秒 8 单位内线性衰减, 拉伸 |v| / 12 x stretch 上限 1.5, 晃动 1 + 0.1 x wobble x sin(3t + 相位), 等值环逐级乘 0.7 |
| MetallicPaint | `ChromeMark` | WORKING_SIZE 512 (遮罩长边), 时钟 0.3 x (time + 2.8), 细条 0.12 / cycleWidth x (1 - 0.4 bump) 与 0.07 / cycleWidth x (1 + 0.4 bump), 条纹 mix 链 smoothstep(0, 2 blur) / smoothstep(border, border + 2 blur) / 末段 0.5 blur, 边缘弯折 direction -= 2 x noise x diag x s(edge)(1 - s(edge)), direction *= mix(1, 1 - edge, smoothstep(0.5, 1, contour)), direction -= 1.7 x edge x smoothstep(0.5, 1, contour); props `imageSrc`, `text`, `fontFamily` system-ui, `fontWeight` 800, `color` foreground, `backgroundColor` transparent, `density` 2, `softness` 0.1, `dispersion` 0.3, `distortion` 0.07, `edgeBend` 0.6 (规格 contour 对应), `angle` 70, `scale` 0.6, `rotation` 0, `mouseTilt` 0.5, `lightMode`, `intro`; 本库定: 隆起场在遮罩内解泊松 (源项 4 / r^2, r = 通道短边 x scale / 2), 通道比例 0.15, 每帧 24 次 Jacobi 静态帧 240 次, 倾斜弹簧 tau 0.25s 最大 0.6 rad, 入场 1.2s 由下往上扫亮, 色散错开 dispersion x 0.08 x (0.3 + edge), 亮色 mix(tint, 白, 0.7) 暗色 tint x 0.12 (浅色 0.45) |

做法:

- InkSplash: 通道顺序 速度 (用上一帧压力投影, 自平流, 涡度约束, 溅点) -> 散度 -> 压力 Jacobi -> 染料 (用投影后的速度平流, 溅点补色) -> 泛光场景 (按浓度梯度打光) -> 金字塔各级 -> 上屏. 投影滞后一帧, 与 LiquidEther 相同. 速度与压力按范围编码 (1024 / 512), 8 位缓冲也存得下负值. glow 为 0 时金字塔 0 级, 只多一遍场景通道. 减弱动效时内核只画一帧, 场景改画静态墨迹 (第一色).
- MergeBlobs: 模拟在 JS 里 (球数上限 49 加 1 个光标球, O(n^2) 两两力), 每帧把球打包成 u_balls / u_shapes 两个 vec4[50] 数组, 片元里逐像素求和. 拉伸是把偏移投影到速度方向上再缩短. 描边与等值环用 fwidth(field) 把场值差换成像素距离.
- ChromeMark: 遮罩是 Canvas2D 画的白字 / 原图 (512 长边), 交给 ShaderSpec.textures 上传 (内核按对象身份缓存). 规格在 CPU 上解 512 的泊松方程; 这里换成一个低分辨率离屏通道每帧迭代 24 次, 首几帧里隆起从边缘往里长满, 观感像入场. 遮罩异步就绪 (图片加载) 时组件重渲染, 静态帧随之重画.

## Consequences

- InkSplash 没有落的: contained (本库永远在宿主内, 不铺满视口), zIndex (宿主是普通块, 由使用方定层级), 闲置停帧 (内核按可见性停帧, 不按指针闲置). ENGINE-GAP (同 LiquidEther): 内核在不支持半浮点渲染目标时退到 RGBA8, 速度与压力按范围编码后精度不足, 流体会发涩, 染料也会在 1 处截断; 要内核加高精度打包才能补.
- MergeBlobs 没有落的: enableTransparency (本库永远透明叠在宿主上), dpr (走内核公共 dpr). motion 规格只给了默认 orbit, drift / still 是本库补的两档.
- ChromeMark 没有落的: 规格的 u_imageAspect / u_scale 等映射细节按本库自己的 maskUv 重写; 图片跨域加载失败时没有形状 (画布透明, 不退兜底). 遮罩文字对读屏不可见, 使用方要给可读文本.
