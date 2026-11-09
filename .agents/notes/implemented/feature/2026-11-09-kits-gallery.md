# Agent Note: 画廊族 (kits/gallery) 用 DOM 与 craft 弹簧自写

Status: implemented

Decision-ID: kits-gallery

## Code

- `src/kits/gallery/tokens.ts`, `src/kits/gallery/index.ts`
- `src/kits/gallery/FoldGallery.tsx` (react-bits Components/AccordionGallery)
- `src/kits/gallery/SpringCarousel.tsx`, `src/kits/gallery/parts/carousel-spec.ts`, `src/kits/gallery/parts/use-drag.ts` (react-bits Components/Carousel)
- `src/kits/gallery/RingCarousel.tsx`, `src/kits/gallery/parts/ring-spec.ts` (react-bits Components/CircularCarousel)
- `src/kits/gallery/BendGallery.tsx`, `src/kits/gallery/parts/bend-spec.ts` (react-bits Components/CircularGallery)
- `src/kits/gallery/DepthDeck.tsx`, `src/kits/gallery/parts/depth-spec.ts` (react-bits Components/DepthCarousel)
- `src/kits/gallery/SphereWall.tsx`, `src/kits/gallery/parts/dome-spec.ts` (react-bits Components/DomeGallery)
- `src/kits/gallery/FlexReel.tsx`, `src/kits/gallery/parts/flex-spec.ts` (react-bits Components/FlexCarousel)
- `src/kits/gallery/BlendSlider.tsx`, `src/kits/gallery/parts/blend-spec.ts` (react-bits Components/MorphSlider)
- `src/kits/gallery/HelixScroll.tsx`, `src/kits/gallery/parts/helix-spec.ts` (react-bits Components/InfiniteSpiral)
- `src/kits/gallery/PosterFlight.tsx`, `src/kits/gallery/parts/poster-spec.ts` (react-bits Components/FlyingPosters)

## Problem

L5 kits 层缺一组画廊件: 手风琴, 弹簧轮播, 环形轮播, 弯曲长廊, 纵深轮播, 穹顶墙, 弹性轮播, 变形幻灯, 螺旋, 飞行海报, 漂移墙. 行为规格在 docs/research/catalog/components-1.md 的 AccordionGallery, Carousel, CircularCarousel, CircularGallery, DepthCarousel, DomeGallery, FlexCarousel, MorphSlider, InfiniteSpiral, FlyingPosters, DriftWall 条目里. 上游许可不允许移植再分发, 只把条目里的常数, props 和行为描述当规格, 用本库引擎重写, 组件名换成本库自己的.

## Decision

全部用 DOM 与 CSS 3D 变换实现, 不引 WebGL 库. 规格里靠着色器的部分 (弯曲网格, 波纹, 色散, 噪声溶解) 不照搬, 在组件里用 ENGINE-GAP 注明缺什么, 换成能在 DOM 上做到的近似.

族内共用: tokens.ts 转出导航族已有的过渡串拼装, 语义色名, 指数趋近, 弹簧积分步与动值循环 (useKitMotion), 并补环上取模与 smoothstep; parts/use-drag.ts 是带阈值 (规格 DRAG_THRESHOLD 5px) 与平滑速度的指针拖拽. 曲线一律引用 src/motion/curves.ts 的 CURVE, 焦点环用 craft 的 FOCUS_RING, 颜色 props 只收语义 token. 减弱动效时位置直接落定, 不做入场, 不自动滚动.

kits 的总出口 src/kits/index.ts 与 ./kits 子路径在收口一步统一接, 本批只维护本族 index.ts.

各件段落写明哪些规格 props 未做.

## FoldGallery (规格 Components/AccordionGallery)

一排面板, 展开项的 flex-grow 取 ratio (n - 1) / (1 - ratio), 使它占总长 expandRatio (默认 0.52), 其余 grow 1; flex-grow 过渡 0.6s outQuart (规格 power3.out). 展开项的色条与标题按 60ms 错峰淡入归位, 收起项左移 14px 用 0.6 倍时长淡出; 未展开项可去色. 悬停或点击切换 (trigger), 焦点进入也切换, 方向键循环移动并移焦. 规格的 parallax 与 tilt (面板内图片随切换位移和转动) 不做, 只做比例与标签. 减弱动效时直接切换.

## SpringCarousel (规格 Components/Carousel)

位置是一路弹簧 (规格 STIFFNESS 150, DAMPING 24, 质量 1), 单位是张; 每张 translateX(偏移 × 100%), 循环时偏移取环上最近值. 拖拽过 5px 才算拖, 拖动时直接写位置; 松手时拖过宽度 20% 或速度过 0.3px/ms 就翻一页, 甩出速度换算成张/秒交给弹簧, 中途改目标保留速度. 自动播放 (默认 4s, 规格未给) 在悬停, 聚焦, 拖拽与页面隐藏时暂停. 方向键翻页, 指示点宽度过渡 320ms lift. 规格的 EFFECTS 与 THEMES (视觉主题) 不做. 减弱动效时直接跳页, 不自动播放.

## RingCarousel (规格 Components/CircularCarousel)

卡片绕竖轴围成一圈 (CSS 3D, rotateY 加 translateZ), 半径取使卡片不重叠的 (w + gap) / (2 tan(pi / n)), 不小于 1.2 倍卡宽. 角度是一路临界阻尼弹簧 (规格 SPRING 118, 阻尼 2 sqrt(118)); 拖拽每 px 转 0.25 度, 松手按甩出速度预估落点并吸到最近一项; 滚轮与方向键一次一项, 点卡片走最短路转过去. 巡航: 无人操作时角速度按 0.6s 时间常数 (规格 1 - exp(-dt / tau) 写法) 爬到 cruiseSpeed 匀速自转, 一碰就停. 屏幕外 (IntersectionObserver) 与页面隐藏时巡航不跑帧. 规格的切片拼图入场 (TILES 8, OVERLAP 2.5, INTRO_LENGTH) 与换图切片动画 (SWAP_LENGTH) 不做. 减弱动效时直接转到位, 不巡航.

## BendGallery (规格 Components/CircularGallery)

卡片排成循环长廊, 每张按距中心的横向偏移 x 落在半径 width / bend 的圆弧上: 下沉 r - sqrt(r^2 - x^2), 转角 asin(x / r); bend 为负时向上拱. 滚轮, 拖拽, 方向键只推目标位置, 实际位置按规格的帧率无关跟随 1 - (1 - scrollEase)^(dt × 60) 追上 (默认 0.05). 滚轮停 140ms 后与拖拽松手后吸附到最近一项 (snap). autoScroll 按规格每秒推进 0.25 × autoScroll 个间距. ENGINE-GAP: 规格用 WebGL 网格让卡片本身弯曲, 外加波纹, 阴影, 边缘渐隐和画布文字, 内核没有顶点通道, 这里只做整卡沿弧摆放与转向, 标题是 DOM 文字. 规格的 openOnClick 放大与 intro 入场不做. 减弱动效时位置直接跳到目标, 不自动滚动.

## DepthDeck (规格 Components/DepthCarousel)

当前牌在最前; 往后第 k 张 (k < visibleCards) 右移 k × spread, 后退 k × depth, 转 tilt (方向随 tiltDirection), 透明度 1 - k × falloff, 模糊按 k 线性到 blur; 更后面的叠在最后一张的位置并隐去; 翻过的牌左移 2 × spread 淡出. 默认值取规格 (300 × 380, depth 220, spread 90, tilt 22, perspective 1400, visibleCards 4, falloff 0.2, blur 6). 位置, 透明度, 模糊用 CSS 过渡 700ms outQuart (规格 power3.out), 打断时从当前值续走, 规格的 GSAP 时间轴不需要. 按钮, 指示点, 方向键, 滚轮 (按半个过渡时长节流), 横向拖拽翻页; 自动播放 3.2s, 悬停与聚焦时暂停. 规格的 tint 与 radius 交给内容自理. 减弱动效时直接换位.

## SphereWall (规格 Components/DomeGallery)

图片铺在球内壁 (CSS 3D, 观者在球心): segments 列 × 5 带, 带距取列距与 30 度的较小者, 相邻带错开半格, 图片按序循环. 半径取容器短边 × fit (0.5), 夹在 [minRadius 600, maxRadius], 随 ResizeObserver 更新. 拖拽转动球面, 竖向限幅 maxVerticalRotationDeg; 松手速度夹到规格 MAX_V 1.4px/ms, 按 exp(-dragDampening × dt) 衰减 (dragDampening 默认 2). 方向键每次转 10 度. 点图放大成中央对话框 (opacity 与 scale 过渡 enlargeTransitionMs), Escape 或点遮罩关闭并还焦点到原图. 规格 DEFAULTS 里 dragSensitivity, maxVerticalRotationDeg, segments, enlargeTransitionMs 的值未进目录, 这里自定 0.2 deg/px, 8 deg, 20, 300ms. 规格的 @use-gesture 换成族内 use-drag, 放大时从原格飞到中央的动画不做. 减弱动效时无惯性, 放大无过渡.

## FlexReel (规格 Components/FlexCarousel)

循环卡带, 位置 (单位: 张) 是一路临界阻尼弹簧, 刚度按规格分模式: 点选, 方向键与松手 55, 滚轮 80, 阻尼 2 sqrt(k). 运动速度换成能量 (速度 6 张/秒为满), 按规格的不对称时间常数上升 70ms, 回落 350ms; 能量越大, 两侧卡片越朝运动反方向 rotateY (最多 28 度, 越靠边越多) 并收缩 6%, 停下后舒展回平. 拖拽直接写位置, 松手按速度预估落点吸附; 滚轮停 140ms 后吸附. ENGINE-GAP: 规格在 OGL 着色器里按能量弯曲卷边卡片网格, 并做色散与 12 采样模糊, 内核没有顶点通道与多采样后处理, 这里只做整卡转向与收缩. 规格的 INTRO_DURATION 入场与 BEND_PRESETS 不做. 减弱动效时直接到位, 无能量形变.

## BlendSlider (规格 Components/MorphSlider)

新一幅叠在旧一幅上用 Web Animations 进场, 1.1s inOutCubic (规格 power2.inOut, CURVE 新增); 四种转场: melt 由模糊 14px 淡入, ripple 由中心圆形 clip-path 扩开, shear 由前进方向一侧 inset 扫入, swirl 由转 10 度放大 1.15 淡入. 标题以 0.66 倍时长 outExpo (规格 (0.16, 1, 0.3, 1), CURVE 新增) 上升淡入, 指示条宽度 0.45 倍时长. 中途再翻页时先把进行中的转场 finish 再起新的; 没有 Element.animate 时直接落定. 按钮, 指示点, 方向键, 横扫 40px 翻页; 自动播放 4s, 悬停聚焦暂停. ENGINE-GAP: 规格的噪声位移溶解, 色差 (aberration), 暗角与 drift 在 WebGL 片元着色器里, 内核没有片元通道, 这里换成 filter / clip-path / transform 关键帧. 减弱动效时只淡入且不超过 0.4s (规格同), 标题不动.

## HelixScroll (规格 Components/InfiniteSpiral)

卡片沿竖直螺旋排布: 第 i 张高 i × verticalSpacing, 转 360 / cardsPerTurn 度一张, 绕半径 radius; 整条按 count × spacing 循环. 自动模式下螺旋按规格 speed (60fps 每帧 px, 默认 0.55) 匀速上升或下降, 前进时同步转动; 滚动模式下前进量跟容器相对视口的位置. 边缘度 = |y| / 半高: 透明度 1 - smoothstep(1 - edgeFade, 1, 边缘度), 模糊 edgeBlur × smoothstep(0.35, 1, 边缘度) (规格同式), 中央放大到 centerScale (默认 1.2). 屏幕外不跑帧, pauseOnHover 时悬停暂停. 规格的 cardTilt, cardRadius, imageFit, grayscale 交给内容自理. 减弱动效时自动模式不动, 滚动模式照常跟手.

## PosterFlight (规格 Components/FlyingPosters)

海报排成一列或几列循环带 (alternate 时相邻列反向), 滚轮与竖向拖拽推目标位置, 实际位置按规格的帧率无关跟随 1 - (1 - scrollEase)^(dt × 60) 追上 (默认 0.01); 速度与倾斜按规格的 1 - exp(-rate × dt) 平滑 (速率 8 与 6). 每张海报穿过视口时绕所选轴 (vertical 转 rotateY, horizontal 转 rotateX, diagonal 两轴同转) 从 -rotation/2 转到 rotation/2 (默认 180); 速度越快斜切越大 (distortion × 速度 / 400 度, 限 20 度); lean 让整层随速度倾斜; fade 让上下边缘渐隐. speed 为自动滚动 px/s. ENGINE-GAP: 规格在 WebGL 里用自带相机投影 (cameraFov, cameraZ) 按速度弯曲海报网格, 并做明暗与圆角遮罩, 内核没有顶点通道, 这里用 CSS 透视加整张旋转与斜切近似. pageScroll 联动页面滚动不做. 减弱动效时位置直接跳, 无斜切与倾斜, 不自动滚.
