# Agent Note: Backgrounds grid 路 (surface/backgrounds/grid)

Status: implemented

Decision-ID: surface-backgrounds-grid

## Code

- `src/surface/backgrounds/grid/DotField.tsx`
- `src/surface/backgrounds/grid/DotGrid.tsx`
- `src/surface/backgrounds/grid/ShapeGrid.tsx`
- `src/surface/backgrounds/grid/GridDistortion.tsx`
- `src/surface/backgrounds/grid/GridMotion.tsx`
- `src/surface/backgrounds/grid/GridScan.tsx`
- `src/surface/backgrounds/grid/use-device-tilt.ts`
- `src/surface/backgrounds/grid/RippleGrid.tsx`
- `src/surface/backgrounds/grid/tokens.ts`
- `src/surface/backgrounds/grid/MicroSlats.tsx`
- `src/surface/backgrounds/grid/micro-slats-shader.ts`
- `src/surface/backgrounds/grid/micro-slats-fluid.ts`
- `src/surface/backgrounds/grid/AcidSquares.tsx`
- `src/surface/backgrounds/grid/acid-squares-shader.ts`
- `src/surface/backgrounds/grid/acid-squares-motion.ts`

## Problem

L3 surface 层要落地 react-bits 的 Backgrounds 全族. grid 路收以格点, 网格与瓦片为骨架的九件: DotField, DotGrid, ShapeGrid, GridDistortion, GridMotion, GridScan, RippleGrid, MicroSlats, AcidSquares. 上游是 MIT 加 Commons Clause, HX-UI 以 Apache-2.0 发包, 不能移植; 只把 docs/research/catalog/backgrounds-1.md 与 backgrounds-2.md 里本件条目的常数, props 和行为描述当规格, 在 backdrop 内核上重写, 组件名, 文件名, 注释都用本库自己的.

## Decision

全部件只接 `src/surface/backdrop/kernel`: 着色器件走 useShaderBackdrop (WebGL2 全屏片元, 要状态的件用 passes 乒乓通道), 画布件走 useCanvasBackdrop, DOM 件走 useDomBackdrop; 宿主统一 BackdropShell, 公共 props 统一 splitCommon. 不引 three / ogl / gsap, 不自起 rAF, 不改内核. 颜色 prop 默认给语义 token 名 (primary, accent, foreground, background, border 等), 由内核在宿主作用域解析成 sRGB 交给着色器, 主题切换自动重解析. 本路共用的小工具 (入场进度, CSS 角度换方向, 跟随量) 放 tokens.ts.

条目到组件:

| 规格条目 | 组件 | 取舍 |
| --- | --- | --- |
| DotField | `DotField` | 采用: 全屏片元逐像素求最近点, 不建实例缓冲 (PIXEL_BUDGET / MAX_DOTS 因此不需要). grid / hex / scatter 精确; spiral 用逐圈黄金角错位的同心圈近似 (片元里没法按 Vogel 螺旋序号找邻点). 透镜: 采样点向指针收拢, 放大 1 + bulge * (1 + zoom) * 透镜, 点径同步变大; 透镜在场 tau 0.18 / 0.4, 按住放大 tau 0.14, 入场 1.8s 聚焦 (alpha 乘 smoothstep(0, 0.25, focus + 0.08)), 闪烁相位 0.55 + seed * 0.9. lightMode 把光晕改为压暗. maxDevicePixelRatio 并入公共 dpr, interactive 并入 mouseInteraction. |
| DotGrid | `DotGrid` | 采用: 弹簧格点在 JS 侧积分 (半隐式欧拉, 子步上限 24, 最长 1/120s, 稳定上限 sqrt(k + 8c) + d + 8v), 回位角频率 2pi / returnDuration, 阻尼比 1 - bounce, 邻点位移耦合 tension * k / 2 与速度粘滞, 指针推力系数 0.35, 点击冲击波 (寿命 0.6s, 环带 1.5 格, 本库定). 位移与速度每帧打包成一格一纹素的 RGBA8 小纹理经 textures 上传, 片元按九宫格查点位, 点径随能量膨胀 (swell), 沿速度拉长 (smoothstep(8, 70, speed) * stretch). 8 位量程: 位移 2 格, 速度 40 格每秒, 只影响显示精度, 积分保持 float. 兜底为 CSS 径向渐变平铺的静态点阵. |
| ShapeGrid | `ShapeGrid` | 采用: Canvas2D, 方 / 六角 / 圆 / 三角四种格形 (OFFSET 32768 拼格键, 编号随滚动不变), 滚动 speed * 60 像素每秒, 光斑弹簧 220 / 阻尼比 0.85 追指针, 强度逼近速率 10 / 5, 照度 smoothstep(reach, 0.15 reach); 拖尾按 trail 指数衰减, 点击级联亮环 (寿命 1.2s, 12 格每秒, 本库定), 透视倾斜相机距离 FAR 2.5 倍长边. 底线按透明度分 8 桶合并描边 (四边淡出与入场都走分桶), 亮格逐个填充描边加 shadowBlur 光晕. 规格的 speed 与公共时钟倍率同名, 改名 scrollSpeed; MAX_PIXELS 由内核的 maxEdge 代替; rainbow 用 JS 色相环换 color(srgb ...) 串. |
| GridDistortion | `GridDistortion` | 采用: 粗网格位移场 (横向 grid 格, 纵向按宽高比) 在 JS 侧积分, 指针速度按 drag / push / swirl 写入半径内格子 (增益 GAIN 18), 每帧按 relaxation^(dt * 60) 回弹, 静止时幽灵量以 dt 上升, 动起来 3 倍速退去, 驱动 idle 晃动; 场打包成 RGBA8 小纹理, 片元在 texelFetch 块状与双线性平滑间按 softness 混, chroma 错开 R / B, 点击涟漪取内核 u_taps (寿命 1.6s), 图像就绪后 0.6s 由中心揭开. imageSrc 缺省时用 fromColor / toColor 渐变底加细网格, 便于不带图也能用. |
| GridMotion | `GridMotion` | 采用: 纯 DOM (useDomBackdrop, BackdropShell 不放画布), 舞台按旋转角取外接矩形再放 1.12 倍盖住画面, 行高平分, 瓦片宽 = 行高 * aspectRatio, 每行瓦片数 = ceil(舞台宽 / 步长) + 条目数 + 1, 平移折回 [-周期, 0) 无缝循环. 滚动 scrollSpeed 像素每秒 (规格的 speed 与公共时钟倍率同名, 改名), left / right / alternate; 视差按指针横向偏移 * parallax * 160px, 行越往下越深, 各行惯性 0.45 / 0.7 / 0.55 / 0.85s 轮换 (本库定); 光斑照度 1 - smoothstep(0.25, 1, d / (0.35 长边)) 乘指针在场, 亮度以 0.22s 跟随, 指针在场时光斑外压暗 dim, 灰度模式光斑处复彩; 入场 0.9s 由 1.06 倍淡入落位, 四边淡出走 mask-image 径向渐变. theme 由语义 token 代替 (tileColor 默认 muted, textColor 默认 foreground); 光斑求距按平面旋转算, 不计 tilt 透视. |
| GridScan | `GridScan` | 采用: 全屏片元把视线与贴合画面的隧道 (半宽 = 宽高比, 半高 1, 深 depth) 四壁求交, 眼位在口前 EYE_DISTANCE 1.25, 超深处落在尽头墙; 壁面坐标上画网格线 (线宽按像素, fwidth 在 0.1..0.4 之间退成平均覆盖防摩尔纹, 虚线 / 点线同样在挤密时退成 0.5), 深度淡出 exp(-depthFade * 2 z / depth), 打光 1 / (1 + 0.9 z^2) 按 shading 混; 扫描面由 JS 按时长 (钳 0.3..20) 与停顿 (钳 0..30) 排程, 进出各 8% 淡入淡出, forward / backward / pingpong, 拖尾 exp(-behind / trail) * smoothstep(-w, 0.5w, behind); 交点闪烁 0.75 + 0.25 sin(t (3 + 5r) + 40r) 只在格距 5..10px 以上出现; 地面按掠射角反光; 眼位视差 tau 0.08, 指针光斑 tau 0.25; 点击取内核 u_taps 最近 4 个 (MAX_PINGS) 在壁面打外扩环与尾迹, 寿命 2.4s, clickEffect 另有 scan (从头重扫); 入场 2.2s 由近到远亮起. enableWebcam / showPreview / modelsPath (人脸追踪要从 CDN 拉模型) 不做. 已补 (2026-11-09): enableGyro (默认 false) 由组件层 use-device-tilt.ts 监听 deviceorientation, 以首次读数为中性姿态, 偏 30° 满偏, tau 0.12s 平滑, 按屏幕旋转角换轴, 指针不在场时带动 u_eye 视差; iOS 的 DeviceOrientationEvent.requestPermission 只在宿主内第一次 pointerdown 时请求, 不在挂载时请求; 减弱动效不监听. |
| RippleGrid | `RippleGrid` | 采用: 全屏片元把屏幕点 (CSS 像素, 中心为原点) 按 tilt 反投影到后仰平面 (焦距取长边, 地平线处 smoothstep(0, 0.35 长边, depth) 淡出), 再按 rotation 转到格面; lines / dots / cross 三种样式 (点径 1.7 线宽, 十字臂长 0.16 格), 格子挤密时 1 - smoothstep(0.18, 0.5, fwidth) 淡出. 涟漪 (上限 MAX_RIPPLES 12, 走 { list, size: 4 } 数组 uniform, 不受内核 8 个点击的限制) 由 JS 调度: autoRipple center / random (可复现的线性同余序列) / none 按 rippleInterval 放, 新点击放满强度, 指针移动每 0.16s 留 0.3 强度小涟漪 (本库定), 寿命 3s, 波前 260 * rippleSpeed 像素每秒, 波长 1.1 格 * rippleSize (本库定); 波形 sin 乘高斯包络乘 1 / (1 + d / 5 波长) 扩散与 smoothstep(0, 0.9 波长, d) 源点静区, 沿径向推格线并提亮. 光晕随指针按 6 / 2.5 每秒升降, 入场 1.6s 由中心铺开 (边缘带 4 格), lightMode 把光晕改为压暗. 兜底为 color-mix 线色的静态方格. |
| MicroSlats | `MicroSlats` | 采用: 全屏片元把屏幕点 (CSS 像素, 中心为原点) 按 perspective * 62° 反投影到后仰地面 (焦距取长边), 加 lean 斜切, 切成 slatWidth x slatHeight + gap 的圆角小百叶 (圆角 roundness * 短边一半, 挤密时 smoothstep(0.25, 0.6, fwidth) 退成平均覆盖); 每片在片心取一次四分量方向浪高 (LENGTH 1 / 0.61 / 0.37 / 0.23, 深水色散 sqrt(9.8k), chop 把浪形尖化为 2 * pow(0.5 + 0.5 sin, 1 + 2 chop) - 1, stretch 沿浪向拉长, 规格的 meander 0.55 sin(dot(world, (0.23, 0.41)) * 0.9 + 0.13t) 慢摆), 亮度 pow(level, contrast), 浪峰 smoothstep(0.6, 1, level) 按 glint 出逐片闪烁的闪光. SWELL_PRESETS 取 swell / chop / storm / glass 四组 (数值本库定), 显式 props 覆盖预设. 流体走内核乒乓通道: 涡量, 速度 (投影滞后一帧扣压力梯度, 自平流, 规格的涡量约束力 uSwirl = swirl * 24, 轻阻尼 0.6/s), 散度, PRESSURE_STEPS 16 次 Jacobi, 墨迹 (按 trail 秒时间常数衰减); 指针速度按 SPLAT_FORCE 6900 * dt 注入, 点击沿 SPLASH_JETS 3 个方向喷射流 (140 格每秒, 本库定); 墨迹按规格 1 - exp(-ink * 1.6) 把百叶点亮到 glintColor, 流速推移浪面. 远处与四边按 fog 入雾, 入场按规格 1 - smoothstep(front - 0.35, front, v) 由下往上揭开 (片间错落 0.15, introDuration 下限 0.2). speed 与公共时钟倍率同名, 改名 waveSpeed; 已补 (2026-11-09): FLUID_SIZE 96 恰为长边格数 (五个通道的 PassSpec.scale 为 getter, 每次 resize 取 96 / 画布设备像素长边, 短边随宽高比). ENGINE-GAP: PIXEL_BUDGET 4.5e6 要按 CSS 面积定画布像素比, useShaderBackdrop 渲染时展开 options, dpr 在 measure 时已定, 由内核 dpr 上限 2 与 maxEdge 2400 代替 (宽屏比预算紧, 近方形且长边超 2121 设备像素时超预算). 规格的 canvas2d 逐帧绘制条目未写画什么, 百叶由上屏片元直接画出, 不另起 2D 层. 兜底为 color-mix 主色的静态竖百叶. |
| AcidSquares | `AcidSquares` | 采用: 全屏片元从绕原点的环绕相机 (rotation 度绕竖轴, tilt 0..1 映射俯角 20°..88°, 画面半高 8 / (zoom * tileSize) 格, 眼距 depth * 0.25 倍半高) 发视线, 先跳到柱顶上限平面, 再按格步进: 每步只看所在格的柱子 (柱子不越格), 步长取到本格柱子的距离场 (方 / 圆截面, 竖边圆角 roundness, 顶边倒角 softness, 顶面隆起 bulge, 缝隙 gap) 与走出本格的距离中较小者, 换格时才重算柱高; 柱高按格心取规格的 0.55 sin(a1) + 0.4 sin(a2) + 0.22 sin(a3) 乘 waves, 加外扩脉冲环 (pulse / pulseSpeed / pulseSpacing / pulseWidth, center 或 pointer 起点), 点击涟漪取内核 u_taps 8 个 (MAX_RIPPLES 8, 强度按规格 life^2 * smoothstep(0, 1.5, radius), 寿命 2.5s 与 6 格每秒本库定), 悬停按 HOVER_EFFECTS press 1 / lift -1 / none 0 压下或抬起; 悬停点弹簧 90 / 19, 视角弹簧 30 / 11, 在场 tau 0.35 / 0.6. 命中后有限差分求法线, 两盏绕场缓转点光 (灯光时钟 0.6 倍) 按规格 1 / (1 + 0.02 d^2) 衰减, split 主副两色分光或 mono 单色, Schlick 菲涅尔 0.04 + 0.96 (1 - n.v)^5 与 gloss 高光; 远处按规格 1 - smoother((dist - x) / (y - x)) 淡出, 格子挤密时按规格 smoothstep(0.08, 0.3, footprint) 混向平均色. 入场按规格逐格 smoother((front - d - hash * 1.1) / 1.6) 由中心升起 (REVEAL_SECONDS 2.6, REVEAL_REACH 19), 隆起 0.9 * (1 - smoothstep(0.55, 1, age / INTRO_SECONDS 3)) 回落. speed 与公共时钟倍率同名, 改名 waveSpeed; MESH 150 / 210 / 280 与 uViewProj 为 ENGINE-GAP (内核只有全屏片元, quality 改为步进上限 48 / 72 / 96, 柱高按格取样不做柱面内细分形变); MAX_RENDER_DIM 由内核 maxEdge 代替. 兜底为底色加主光色光晕. |

## Alternatives considered

- 什么都不做: 最强理由是目录条目原裁决 "不做" (全屏场与控件状态机无关). 否决: 该裁决已被用户作废, Backgrounds 全量落地.
- 每件自带 WebGL 程序管理与 rAF: 最强理由是可以逐行贴近上游的实例化绘制. 否决: surface 层只有一套渲染底座, 离屏停帧, DPR 上限, 减弱动效一帧都由内核统一负责.

## Consequences

出口由主线统一接, 本路只改 `src/surface/backgrounds/grid/index.ts`. 带 ENGINE-GAP 的件在文件头写明差什么.
