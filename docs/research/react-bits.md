# react-bits 逐件读记

来源: https://github.com/DavidHDev/react-bits
提交: `4dc7b5b7772e1217c8fb8d2a7aa074302180e5b4` (浅克隆, 2026-11-06 拉取).

## 0. 实际读了多少

跟踪文件 8805 个. 构成:

| 类 | 数量 | 这次怎么处理 |
|---|---|---|
| `public/` 媒体 | 6022 | 预览片 (webp 3313, mp4 590, webm 585, jpg 227). 不是实现. 没有逐张解码 |
| `src/content` 实现 | 422 个 js/jsx/ts/tsx/css | 183 个组件目录全部做了全文特征扫描 (依赖, 弹簧, 时长, 缓动, WebGL/canvas/GSAP/motion) |
| 其中交互核心全文 | Magnet, CountUp, SplitText, BlurText, AnimatedContent, ClickSpark, Dock, PillNav, Information.js, jsrepo.config.ts, package.json | 按行读过, 下面的数字来自这些文件, 不是印象 |
| 站点壳, 声音实验室, demo 包装 | 其余 src | 读了目录职责和注册方式, 没有把每个 demo 页的 JSX 当效果本体 |

183 个组件目录 = Animations 38 + Backgrounds 64 + Components 48 + TextAnimations 33. 每个目录通常是同一实现的两份 (默认 CSS 版 + Tailwind 版), 不是两种手感. 变体名在 `src/constants/Information.js`: `JS-CSS`, `JS-TW`, `TS-CSS`, `TS-TW`.

## 1. 它怎么包装

`jsrepo.config.ts` 把 `componentMetadata` 收成 registry `@react-bits`. 每件:

- `title`, `description`, `category` (Animations / Backgrounds / Components / TextAnimations, 另有 Micro 类型位)
- `variants`: 四种源码口味, 同一行为
- 输出到 `public/r`, 格式走 `@jsrepo/shadcn` 的 output. 使用方是复制源码或 CLI 拉一份进自己的仓库, 不是 `import { X } from "react-bits"`
- `excludeDeps: ['react']`. 其余依赖 (gsap, motion, three, ogl) 随组件声明
- 另有 SoundEngine 和每条声音的 JS/TS 注册. 声音是独立目录 `src/sounds`, 用 Web Audio, 不绑在每个视觉组件上

站点是 Vite + React Router. 依赖里和手感直接相关的是: `gsap`, `@gsap/react`, `motion`, `ogl`, `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `@react-three/rapier`, `postprocessing`, `gl-matrix`, `maath`, `meshline`, `matter-js`, `lenis`, `@use-gesture/react`.

这不是一套设计系统. 没有共享的时长令牌, 没有统一的按下/聚焦/禁用状态机. 每件自己带默认值. 高级感来自单件里的物理和着色器, 不来自组件之间的节奏合同.

特征扫描的引擎分布 (一个组件可占多类): WebGL 92, canvas 2d 85, 纯 DOM 34, SVG 21, GSAP 18, OGL 10, CSS 关键帧 8, motion 8, three 6, fiber 1.

## 2. 手感从哪来: 读过的核心常数

### 2.1 Magnet (`Animations/Magnet/Magnet.jsx`)

默认弹簧 `{ stiffness: 170, damping: 16, mass: 1 }`. 自己积分, 不交给 motion:

```
force = stiffness * (target - current) - damping * velocity
velocity += (force / mass) * dt
current += velocity * dt
```

静止阈值: 位移类 0.05 px, scale 0.001. 指针在 padding 外目标归零, padding 内用 smoothstep 从 `padding * 0.5` 到 `padding` 做拉力. `maxOffset` 按长度钳制, 不按轴钳制. 倾斜是指针相对中心的 nx/ny 乘 `tilt`. `prefers-reduced-motion` 直接把目标钉在 0, 不播弹簧. 变换只写 `translate3d` / `rotateX` / `rotateY` / `scale`, 数字保留 2 位 (位移) 或 4 位 (scale), perspective 800px. 这是指针物理, 不是 CSS hover.

### 2.2 CountUp (`TextAnimations/CountUp/CountUp.jsx`)

每个数字位是一条高 `1.2em` 的竖条, 不是一个变模糊的总数字.

- `STAGGER = 0.07` 秒, 但总错峰不超过整段时长的 40%: `min(0.07, duration * 0.4 / (n-1))`
- 默认 `duration = 2` 秒, `delay = 0`, `easing = 'easeOut'`
- `easeOut` 是 `cubicBezier(0.33, 1, 0.68, 1)`
- `expo` 是 `1 - 2^(-10t)`, 再除以 `1 - 2^-10` 让 t=1 时落到 1
- `spring` 用 `makeSpring(0.06)`: 过冲上限 0.06, 阻尼比由 `log(overshoot)` 反解, 半周 `PI/0.52`, 末尾用 `t^3` 把残差补进 1, 保证停在整数格上
- 外层时间轴 `ease: 'linear'`, 非线性只发生在每一位自己的 ease 上. 这样中断时进度是均匀时钟, 视觉曲线仍是弹簧
- 读屏只留一份终值 (`sr-only` 1px clip)

### 2.3 SplitText (`TextAnimations/SplitText/SplitText.jsx`)

GSAP SplitText. 默认 `duration = 1.25` 秒, `splitType = 'chars'`. 外观预设的缓动是字面量:

| 外观 | from | to | ease |
|---|---|---|---|
| fade | opacity 0 | 1 | `power2.inOut` |
| slide | y = 0.6em 量级 | 0 | `power2.out` |
| blur 类 | y + filter | 清晰 | `power3.out` |
| scale | scale 0 | 1 | `back.out(1.6)` 过冲 |
| mask | 裁切 | 露出 | `expo.out` |

错峰: `gsap.utils.distribute({ each: delay/1000, from: staggerFrom })`, `staggerFrom` 默认 `start`, 也可 center / edges / random. 离场时长 `max(0.35, duration * 0.55)`, 缓动 `power2.in`. 强调色在离场用 `power1.in`. 中段循环用 `duration * 0.7` 和 `power1.inOut`. `autoSplit` 只对 lines 开. 结束 `revert()`, 不把拆出来的 span 留在 DOM.

### 2.4 BlurText (`TextAnimations/BlurText/BlurText.jsx`)

默认 `delay = 200` ms, `stepDuration = 0.35` s, `blur = 10` px, `distance = 50` px, `threshold = 0.1`. 关键帧不是两态, 是三拍:

- blur 效果: 起点 `blur(12px)` (1.2 倍), opacity 0, scale 1.4; 中点 blur 20%, opacity 0.9, scale 0.97, 反向位移 3%; 终点清晰
- 透视效果: `transformPerspective: 600`, 旋转 55deg 收到 0, 中点还留 15% 模糊
- 斜切: skewX 28deg 收到 -7deg 再归 0
- 减弱动效常量 `INSTANT = { duration: 0 }`
- 触发: `view` 从隐藏开始, `hover` / `click` 先停在终态再播, `load` 直接入场. 循环 `loopDelay = 2` s

### 2.5 AnimatedContent (`Animations/AnimatedContent/AnimatedContent.jsx`)

GSAP. `duration = 0.8`, `ease = 'power3.out'`, 离场 `disappearEase = 'power3.in'`. `stagger > 0` 时目标改成子节点, `each` 就是 stagger 秒数, `from` 默认 `start`. 首帧 `visibility: hidden`, 开播前改 visible, 避免未进视口时闪一下. 这是全库最接近 "通用入场" 的一件, 也是最容易被用成模板的一件.

### 2.6 ClickSpark

500 ms, 8 粒, 半径 30, 线宽 2, 尺寸 14. 缓动表是手写的: ease-out = `1 - (1-t)^3`, ease-in-out 是三次方分段. 星形内凹 `radius * 0.16`. 画在 canvas 上, 不碰布局.

### 2.7 Dock

`baseItemSize = 50`, `magnification = 70`, `distance = 200`. 弹簧 `{ mass: 0.1, stiffness: 150, damping: 12 }`. 积分用 `k = stiffness / mass`. 指针影响按 `|focus - rest| / distance` 衰减. 尺寸下限 16. 这是 macOS 程序坞的连续放大, 不是离散的 hover scale.

### 2.8 PillNav

指示器是测量出来的 pill 或 dot, 不是 CSS `left` 过渡. 入场:

- 弹出 `700ms`, `cubic-bezier(0.34, 1.56, 0.64, 1)` (过冲)
- 次级 `760ms`, delay 90, ease-out
- 列表项 `560ms`, delay `200 + index * 50`
- 面板 `clip-path` 560ms
- 行内项 delay `90 + index * 40`, 420ms
- 收起 opacity 160ms
- 另一条 900ms 的长入场
- `pointerup` 和 `pointercancel` 都走 `release`, 避免指针在按钮外松开时卡住按下态
- `prefers-reduced-motion` 直接 return, 不建 Web Animations
- 折叠用 ResizeObserver, 阈值 `need > available + 0.5` (半像素, 防抖动)

### 2.9 其余 183 件的技术归类

下面每个名字都扫过实现. "看起来" 是源码结构能确定的画面, 不是看过预览片之后的形容词.

**指针场 (弹簧或力, 跟随光标)**

Magnet (见上), TargetCursor (DOM 准星, 锁最近可点元素), BlobCursor / GlowCursor / GhostCursor / SwarmCursor / SplashCursor (流体或粒子光标, WebGL), ClickSpark (点击爆发).

**滚动入场 (GSAP, 短, 容易做成模板)**

AnimatedContent, FadeContent, ScrollReveal (`power` 系), ScrollFloat, ImageTrail (多段 fromTo), FoldText, MaskedHeading, StrokeText, Shuffle, TextType, TextLoop, ScrambledText. 共同病: 默认 0.6 到 1.25 秒, `power2.out` 或 `power3.out`, 子项等间隔. 高级感只在 blur/mask/back.out 那几档, 不在 "fade up 12px".

**motion 弹簧字**

BlurText, CountUp, RotatingText (digest 里 15 处 duration/ease), CircularText, ScrollVelocity, TrueFocus, DecryptedText. RotatingText 和 TrueFocus 用 layout 测量, 不是写死宽度.

**画布 / 着色器背景 (64 个 Backgrounds 里绝大多数)**

Aurora, Silk, Waves, Plasma, Grainient, Iridescence, DarkVeil, Dither, Balatro, Galaxy, Lightning, LightRays, LiquidChrome, LiquidEther, Particles, Threads, PixelBlast, FaultyTerminal, LetterGlitch, Hyperspeed (three), ColorBends (three), 以及同目录其余件. 技法是片元着色器里的 `uTime`, 噪声, 域扭曲, 鼠标 uniform. 它们贵在连续的场, 不在组件状态机. 性能手法: 单 canvas, DPR 上限, 离屏暂停 rAF (各件自己写, 不统一). 没有共享的降级到静态渐变的合同, 减弱动效覆盖不完整.

**OGL 小场景**

CrystalizedBall, DitherVeil, ElectricLogo, RippleDistortion, EvilEye, MicroSlats, PatternWaves, WarpText, FlexCarousel 的一部分. 比 three 轻, 仍是每帧画全屏或一块.

**three / rapier**

ModelViewer (fiber), Lanyard (布料/物理), BorderGlow, Hyperspeed, BlobCursor. 这是展示件, 不该进默认包体.

**卡片与导航 (DOM + 少量 GSAP)**

SpotlightCard (指针坐标写 CSS 变量, 光斑), TiltedCard (rotateX/Y 跟随), GlareHover (渐变角度), BounceCards, CardSwap, ScrollStack, MagicBento (聚光 + 粒子, 文件很大), ChromaGrid, Dock, PillNav, GooeyNav (滤镜黏连), StaggeredMenu (GSAP 时间线, digest 22 处缓动), CardNav, BubbleMenu, FlowingMenu, Stepper (11 处时长), ElasticSlider (拖拽 + canvas), MorphSlider (GSAP + OGL). GlassSurface / FluidGlass / HoloCard / ReflectiveCard 是折射或高光着色器, 玻璃是可选一件, 不是全站材质.

**字效里真正有信息的**

DecryptedText (随机字符收敛), ScrambledText, SplitFlapText (CSS 翻牌), FuzzyText (canvas 抖动字形), TextPressure (字距随指针), VariableProximity (字重随距离), ASCIIText / ParticleText / WarpText (字形采样成点). GradientText / GlitchText / ShinyText 是扫光和错位, 好看但最容易被用滥.

## 3. 什么让它显贵, 什么让它显假

显贵的是这几条, 都能量到:

1. 运动有积分或有过冲曲线, 不是 `transition: all 200ms ease`.
2. 错峰有上限 (CountUp 的 40%), 或有 from: center/edges, 不是第 n 项永远 `n * 60ms`.
3. 指针影响有半径和衰减 (Magnet padding, Dock distance), 离开场会自己回弹到位.
4. 模糊, 倾斜, 缩放叠在同一条曲线的不同相位, BlurText 的中点 scale 0.97 就是为了不发飘.
5. 着色器背景是一整块场, 和前景 UI 分开, 不给每张卡片上玻璃.

显假的也明确:

1. 背景件可以无限叠加. 一个页面同时上 Aurora + Particles + Glass 就是模板站.
2. 大多数 GSAP 入场共用 `power3.out` + 十几像素位移. 这和 PR #42 的 rise 是同一档, 不是 react-bits 的上限.
3. 复制进业务仓库之后, 没有禁用, 加载, 键盘聚焦, 快速连点的状态机. 它们是镜头, 不是控件.
4. 声音目录是分开的. 视觉组件默认无声. 手感靠运动的加减速, 不靠音效.

## 4. 对 HX-UI 有用的部分

值得学的是算法和默认常数, 不是把 64 个着色器背景搬进来.

- 弹簧积分 (Magnet, Dock) 比 `transition: transform` 更能在指针离开时保留速度.
- 数字按位滚动 + 错峰上限 (CountUp), 并且外层时钟线性, 方便中断.
- 文字三拍关键帧 (BlurText), 中点略过冲再收回.
- 指示器用测量矩形 + Web Animations 的过冲曲线 (PillNav 的 `0.34, 1.56, 0.64, 1`, 700ms), 加上 pointercancel.
- 注册表按变体发源码, 文档站应能改 props 并看到同一份源码, 而不是只放一段不能改的 JSX.
