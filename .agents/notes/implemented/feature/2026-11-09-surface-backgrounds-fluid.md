# Agent Note: surface 层 Backgrounds fluid 路 (surface/backgrounds/fluid)

Status: implemented

Decision-ID: surface-backgrounds-fluid

## Code

- `src/surface/backgrounds/fluid/index.ts`
- `src/surface/backgrounds/fluid/MoltenMetal.tsx`
- `src/surface/backgrounds/fluid/molten-metal-shader.ts`
- `tests/surface/backgrounds/fluid/molten-metal.test.tsx`
- `src/surface/backgrounds/fluid/Balatro.tsx`
- `src/surface/backgrounds/fluid/balatro-shader.ts`
- `tests/surface/backgrounds/fluid/balatro.test.tsx`
- `src/surface/backgrounds/fluid/Orb.tsx`
- `src/surface/backgrounds/fluid/orb-shader.ts`
- `tests/surface/backgrounds/fluid/orb.test.tsx`
- `src/surface/backgrounds/fluid/EvilEye.tsx`
- `src/surface/backgrounds/fluid/evil-eye-shader.ts`
- `tests/surface/backgrounds/fluid/evil-eye.test.tsx`

## Problem

L3 surface 层要落地 react-bits 的 Backgrounds 全族. fluid 路收以液体, 金属与有机流动为主角的九件: LiquidChrome, LiquidEther, Ferrofluid, MoltenMetal, Balatro, Orb, EvilEye, MagicRings, Topography. 上游是 MIT 加 Commons Clause, HX-UI 以 Apache-2.0 发包, 不能移植; 只把 docs/research/catalog/backgrounds-1.md 与 backgrounds-2.md 里各条目的看起来, 技法, 常数, 指针与 props 当规格, 着色器与状态机全部自写, 文件名与注释用本库自己的. 条目末尾的 "裁决: 不做" 已被用户作废.

## Decision

全部接在 surface 唯一的渲染底座 `src/surface/backdrop/kernel` 上: useShaderBackdrop 出 WebGL2 全屏片元, 需要状态的件 (涟漪, 流体) 用 passes 乒乓离屏通道; 帧循环, 像素比上限, 离屏与隐藏停帧, 减弱动效只画一帧, 主题切换重解析颜色都由内核负责, 组件不自起 rAF. 颜色只收 token 名或用户 prop, 默认值都是 token 名 (foreground, background, primary 等), 源码不写色值字面量. 拿不到 WebGL2 时 BackdropShell 铺 fallbackGradient / glowFallback. 状态通道一律把有符号量按 0.5 + 0.5x 编码, 内核在不支持半浮点时退到 RGBA8 也不丢负值. 入场, 悬停一类的 JS 侧平滑在 uniforms 回调里按 frame.dt 推进 (内核 approach), 减弱动效时直接取终值.

条目到组件:

| 规格条目 | 组件 | 取舍 |
| --- | --- | --- |
| LiquidChrome | `LiquidChrome` | 采用: 1 到 8 层正弦扭曲出液面, 有限差分取斜率当法线, 反射一个摄影棚环境 (柔光箱, 地平线亮带, 条目里的 lobe / streak / rise 形状), 粗糙度用 4 次抖动采样 (t 从 -0.375 步进 0.25) 近似, f0 = mix(1, tint, smoothstep(0.05, 0.6, 斜率)) * 0.92. 涟漪是离屏波动方程 (格子 4 CSS 像素, 每帧两步对应 1/120 秒步长), 拖动按速度注入, 点击注入一圈大的. 入场振幅 1.8 秒涨满. color 默认 foreground, 另加 backgroundColor (默认 background); lightMode 以底色为主只做明暗. maxDevicePixelRatio 并入公共 dpr. |
| LiquidEther | `LiquidEther` | 采用: 稳定流体四通道 (速度: 投影后半拉格朗日自平流, 粘性衰减, 指针 / 自动 / 点击的力; 散度; 压力 32 次 Jacobi, 以上一帧的解热启动; 染料: 按投影后速度平流, 留存率 0.5^(dt / (0.35 + persistence^2 * 12))). 压力梯度不能写回速度缓冲 (每个通道只写自己), 所以投影滞后到下一帧速度通道开头扣掉, 染料通道自己算一次投影后的速度, 结果与同帧投影一致. 上屏: 浓度经 smoothstep(0.08, 0.5) 当不透明度, 快处 mix(0.85, 0.1, smoothstep(0.7, 1.6, 速度)) 镂空, 1 - exp(-max(速度 - 0.75, 0) * 1.2) 发热, 流速沿调色板取色. 自动演示在指针停下 autoResumeDelay 后沿利萨如曲线搅动, 0.8 秒爬升; 入场 1.4 秒横扫一笔; 点击按 1400 * (mouseForce / 20) 外推. 减弱动效改画一张静态噪声流. MAX_CELLS 上限不落地 (通道缩放在构建时固定, 由 resolution 与 DPR 上限间接控制). ENGINE-GAP: 内核在不支持半浮点渲染目标时退到 RGBA8, 速度与压力按 512 / 256 的范围编码后精度不足, 流体会发涩. |
| Ferrofluid | `Ferrofluid` | 采用: 斜视 (tilt 48 度) 的液面, 六角排布的锥形尖刺 (锐度为锥形指数), 高度由漂移的三维值噪声磁场 smoothstep(0.44, 0.86, n) 决定, flowDirection 映射为图样漂移, 指针处高斯抬升 (跟手 1 - exp(-dt / mouseDampening), 强度 tau 0.35), 点击放出一圈脉冲 (包络 smoothstep(0, 0.08, t) * exp(-1.1 t)). 全屏片元射线步进 72 步加 5 次二分求交, 菲涅耳 F0 0.06, 环境 mix(0.3, 1, smoothstep(-0.25, 0.3, r.z)), 边缘光 pow(1 - abs(dot(rd, n)), 3), 远处按距离淡出. 入场 2.4 秒尖刺长出. 射线步进件默认 dpr 1. ENGINE-GAP: 条目的 Canvas2D 叠层 (阴影预烘) 不做, 阴影与雾在同一片元里近似. |
| MoltenMetal | `MoltenMetal` | 采用: 1 到 6 层旋涡扭曲 (旋转角 swirl * 0.55 / i * sin(半径)) 后取 4 阶分形当高度 l, 8 档脊线按屏幕导数 footprint = 0.5 * length(dFdx, dFdy) 抗锯齿, 导数当法线出金属高光; 颜色沿至多 6 色调色板 smoothstep 插值, colorMode 偏置 molten 0.5 / ember 0.3 / frost 0.7. 指针拖尾 16 点 (0.06 秒采样, 0.9 秒寿命, 权重 (1 - age / life)^2), 热点跟手 tau 0.33, 在场 tau 0.25; 点击耀斑最多 8 个, 包络 (1 - exp(-age / 0.07)) 乘寿命 1.8 秒的平滑落下; 受热处烧成 coreColor (默认 foreground). 入场 2.4 秒前沿自下而上漫开 (reveal = smoothstep(-1, 1, 前沿距离), 前沿亮边 0.2 * exp(-d^2 * 1.5)), 进度过 0.4 才开始流动. 默认 colors primary, backgroundColor background, 另加 transparent. ENGINE-GAP: 条目的 Canvas2D 拖尾预烘不做, 拖尾点直接进 uniform 数组. |
| Balatro | `Balatro` | 采用: 坐标先按 pixelSize (CSS 像素乘 dpr) 取块心, 经离屏搅动场位移与至多 4 个点击旋涡 (强度 0.15 秒拧起, exp(-1.2 t) 松开, 3 秒寿命) 扭过, 再按 spin - swirl * 20 * (r - r^2 / 2) 旋转, 放大 30 / scale 后做 detail 次正弦折叠; 颜料量 paint = clamp(|q| * 0.035 * contrastMod, 0, 2), contrastMod = 0.25 * contrast + 0.5 * swirl + 1.2, 三色权重 c1 = 1 - contrastMod * abs(1 - paint), c2 = 1 - contrastMod * abs(paint), c3 = 1 - min(1, c1 + c2), 底色份额 0.3 / contrast, 高光 (lighting - 0.2) * max(5 c1 - 4, 0) + lighting * max(5 c2 - 4, 0). 流动相位 time * 7, 自转 time * rotationSpeed * 0.2. 搅动场格子 8 CSS 像素, 本帧指针线段按半径 90 CSS 像素高斯推开颜料, 每帧乘 exp(-dt / 1.6), 位移按 0.5 + 0.5v 编码. 指针转向 tau 0.8, 入场 2.2 秒从中心旋开. crt 做桶形弯曲, 扫描线与暗角. 默认 color1 primary, color2 accent, color3 background. maxDevicePixelRatio 并入公共 dpr. |
| Orb | `Orb` | 采用: 屏幕坐标从焦距 3.2 的相机射到按 tiltX / tiltY 倾斜的平面上, 半径 r0 = (0.62 + 0.07 * 噪声 * wobble) * (1 + 0.12 * 脉冲) 的光环, 亮度 1 / (1 + d * a) 只取内侧 (smoothstep(r0 * 1.05, r0, len)), 内侧按 reach 渐隐出体积, 外侧泛光 1 / (1 + d^2 * 160 / glow); 朝指针一侧按 reach * facing * smoothstep(0.25, 0.65, r) 隆起. JS 侧: 悬停 tau 0.16, 贴近 tau 0.12 涨到 hoverIntensity, 伸向指针弹簧 (刚度 70, 阻尼 7), 悬停时每秒自转 0.3 * hover, 尾迹头部以 1 - exp(-6 dt) 转向指针 (无指针时匀速绕行), 尾迹 smoothstep(0, 0.35, lag) * exp(-2.6 lag / trail); 点击给脉冲弹簧 (170 / 11) 初速 4 并放出 1.2 秒扩到满的回声环, 闪亮按 exp(-2.5 dt) 衰减; 入场 1.1 秒. 颜色 1 到 3 个沿环流转, hue 用 YIQ 旋转. 默认 colors primary, accent. |
| EvilEye | `EvilEye` | 采用: 极坐标方向乘 2.2 与 r * 3 - t 取三层三维值噪声 (0.6 / 0.3 / 0.1) 烧火焰, flames = smoothstep(0.35, 0.95, n + distanceMask * 0.55) * max(distanceMask + 0.35, 0), distanceMask = 1 - length(uv); 虹膜环半径 0.3 + 0.04 (n - 0.5), 环宽 irisWidth * 0.4, 环内放射纹 smoothstep(0.45, 0.85, 噪声); 竖缝瞳孔按 (9, 2.3) 压缩, 外圈光晕按 (0.5, 1.5) 椭圆压缩后平方乘 glowIntensity * 2, 能量过 0.9 起泛白. 瞳孔跟手 tau 0.2s, 偏移上限 0.15, 目标为指针偏移乘 pupilFollow 并封顶为 1, 离场回正; 减弱动效只画一帧且瞳孔居中. 默认 intensity 1.5, pupilSize 0.6, irisWidth 0.25, glowIntensity 0.35, scale 0.8, eyeColor primary, backgroundColor background; lightMode 在浅底上画深色眼. 条目的噪声纹理改为片元内三维值噪声, 不上传纹理. |

## Alternatives considered

- 什么都不做 / 复用现有: 最强理由是 effects 已有静态渐变与光斑. 否决: 它们没有状态通道, 做不出涟漪, 流体与射线步进的形体.
- 照条目引入 three 或 ogl: 最强理由是 3D 件 (Topography 的网格, MagicRings 的环带) 写起来短. 否决: 内核只直接调用 WebGL2, 不进新依赖; 3D 件改用全屏片元的射线步进或解析投影, 差距记成 ENGINE-GAP.

## Consequences

本路只改自己的 index.ts, 总出口 `src/surface/backgrounds/index.ts` 已 re-export, src/index.ts 与 package.json 的出口由主线统一接.
