# react-bits 逐件记录

来源提交 `4dc7b5b7772e1217c8fb8d2a7aa074302180e5b4`. 跟踪文件 8805.

已读: 183 个组件目录在 `src/content`, `src/ts-default`, `src/ts-tailwind`, `src/tailwind` 的全部实现, 共 1070 个源文件 (含 CSS 与文件内着色器). 预览媒体 webp/mp4/webm 不是实现, 未逐帧解码.

变体是同一行为的四种源码口味, 注册在 `src/constants/Information.js`, 经 `jsrepo.config.ts` 发到 `public/r`. 使用方复制源码.

Micro 35 件不在这 183 里. 第一遍漏了, 附在文末. 常数是源码里的赋值.

## Animations

### Animations/AnimatedContent
画面: 指针, 滚动或点击驱动的运动层. 技法: gsap. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: distance=100; duration=0.8; ease='power3.out'; blur=0; threshold=0.1; delay=0. uniform: none. 标记: reduced-motion.
结论: 入场曲线可参考, 但等间隔 power.out 正是 #42 的平. 只借 mask/back.out 那种有相位的预设.
### Animations/BlobCursor
画面: 指针, 滚动或点击驱动的运动层. 技法: three, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: damping=2 * Math.sqrt(linkStiffness) * mix(0.95; ease=Math.exp(-drop.drag * h); ease=radius + blend. uniform: blobCount, blobDepth, blobHeadEnd, blobInfo, blobJoin, blobLift, blobRef, blobSeg. 标记: reduced-motion, rAF, dpr.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Animations/ClickSpark
画面: 指针, 滚动或点击驱动的运动层. 技法: canvas. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: sparkradius=30; sparkcount=8; duration=500; ease=EASINGS[easing] ?? EASINGS['ease-out']; ease=== EASINGS.spring ? 1.15 : 1) +. uniform: none. 标记: reduced-motion, rAF, dpr.
结论: 值得采用其物理或错峰公式, 用 HX 令牌重写, 不复制源码.
### Animations/Crosshair
画面: 指针, 滚动或点击驱动的运动层. 技法: canvas. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: none. 标记: reduced-motion, rAF, dpr.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### Animations/CrystalizedBall
画面: 指针, 滚动或点击驱动的运动层. 技法: ogl, canvas. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: duration=0.2 + random() * 0.2. uniform: tHome, tOffset, tScene, tSeed, tVelocity, uArcs, uBins, uBloom. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Animations/Cubes
画面: 指针, 滚动或点击驱动的运动层. 技法: webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: stiffness=160 * s.speed * s.speed; damping=2 * (1 - 0.82 * s.bounce) * Math.sqrt(stiffness). uniform: uEdge, uEdgeWidth, uFace, uLight, uMarks, uOpacity, uProjection, uRipple. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Animations/CursorGrid
画面: 指针, 滚动或点击驱动的运动层. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: duration=800; ease=FALLOFF_CURVES[s.falloff] ?? FALLOFF_CURVES.linear. uniform: uCellGap, uCellRadius, uCellSize, uCells, uColor, uEdgeFade, uFillOpacity, uGridColor. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Animations/DitherVeil
画面: 指针, 滚动或点击驱动的运动层. 技法: ogl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: tDiffused, tImage, tMask, tNoise, tPrev, uBrightness, uBurstWidth, uBursts. 标记: reduced-motion, rAF, dpr, in-view.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Animations/ElasticMesh
画面: 指针, 滚动或点击驱动的运动层. 技法: webgl. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: stiffness=0.5; delay=0 }); damping=2 * ratio * Math.sqrt(anchor); damping=2 * (ratio + 0.06) * Math.sqrt(dentAnchor). uniform: uClock, uColor, uField, uInflate, uLight, uMaterial, uOffset, uPaint. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Animations/ElectricBorder
画面: 指针, 滚动或点击驱动的运动层. 技法: ogl, webgl, canvas. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: uArcEnds, uArcShape, uCells, uCenter, uChaos, uCore, uFlicker, uGlow. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Animations/ElectricLogo
画面: 指针, 滚动或点击驱动的运动层. 技法: ogl, svg. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: tFieldFrom, tFieldTo, tGlowFrom, tGlowTo, uArcEnds, uArcShape, uBend, uColor. 标记: reduced-motion, rAF, dpr, in-view.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Animations/FadeContent
画面: 指针, 滚动或点击驱动的运动层. 技法: gsap. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: blur=10; blur=0; duration=1; ease='power2.out'; delay=0; threshold=0.1. uniform: none. 标记: reduced-motion.
结论: 入场曲线可参考, 但等间隔 power.out 正是 #42 的平. 只借 mask/back.out 那种有相位的预设.
### Animations/GhostCursor
画面: 指针, 滚动或点击驱动的运动层. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: threshold=0.025; threshold=0); stiffness=520 * Math.pow(1 - s.inertia. uniform: uBloom, uBloom0, uBloom1, uBloom2, uBrightness, uColor, uDecay, uDetail. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Animations/GlareHover
画面: 指针, 滚动或点击驱动的运动层. 技法: dom. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=1px; ease=t => (1 - Math.cos(Math.PI * t)) / 2; duration=650; threshold=0.4 }. uniform: none. 标记: reduced-motion, rAF, in-view, hidden-pause.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### Animations/GlowCursor
画面: 指针, 滚动或点击驱动的运动层. 技法: webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: ease=() => {. uniform: uA, uAspect, uB, uBack, uBloom, uColor, uDecay, uDivergence. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Animations/GradualBlur
画面: 指针, 滚动或点击驱动的运动层. 技法: dom. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: duration=0.3. uniform: none. 标记: rAF.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### Animations/HalftoneReveal
画面: 指针, 滚动或点击驱动的运动层. 技法: webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: uAccent, uAngle, uBrightness, uBurstWidth, uBursts, uCell, uContrast, uDpr. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Animations/ImageTrail
画面: 指针, 滚动或点击驱动的运动层. 技法: gsap. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: duration=0.4; ease='power4'; ease=drift ? 'power2' : 'power1'; duration=0.5; ease='power1'; ease=drift ? 'expo' : 'power3'. uniform: none. 标记: reduced-motion, rAF.
结论: 入场曲线可参考, 但等间隔 power.out 正是 #42 的平. 只借 mask/back.out 那种有相位的预设.
### Animations/LaserFlow
画面: 指针, 滚动或点击驱动的运动层. 技法: webgl, canvas. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: ease=clamp((elapsed + 0.15) / 0.8. uniform: uAmount, uAtmosphere, uBeamX, uDpr, uExtra, uIntro, uLens, uPour. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Animations/LogoLoop
画面: 指针, 滚动或点击驱动的运动层. 技法: dom. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=0 var(--logoloop-pad); padding=0; threshold=6; stagger=0.45; threshold=0.1 }. uniform: none. 标记: reduced-motion, rAF, in-view, hidden-pause.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### Animations/Magnet
画面: 指针, 滚动或点击驱动的运动层. 技法: dom. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: stiffness=170; damping=16; mass=1 }; padding=100. uniform: none. 标记: reduced-motion, rAF.
结论: 值得采用其物理或错峰公式, 用 HX 令牌重写, 不复制源码.
### Animations/MetaBalls
画面: 指针, 滚动或点击驱动的运动层. 技法: webgl. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: mass=0.0; delay=0.1 + fract(h1[2] * 7.31 + h2[1] * 3.17) * 0.55; ease=(ball. uniform: uBalls, uColor, uCount, uCursorColor, uGamma, uLine, uOpaque, uResolution. 标记: reduced-motion, rAF, dpr, in-view.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Animations/MetallicPaint
画面: 指针, 滚动或点击驱动的运动层. 技法: webgl, canvas. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: stiffness=60; damping=14. uniform: u_angle, u_colorBack, u_colorTint, u_contour, u_distortion, u_image, u_imageAspect, u_light. 标记: reduced-motion, rAF, dpr, in-view.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Animations/Noise
画面: 指针, 滚动或点击驱动的运动层. 技法: canvas. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: none. 标记: reduced-motion, rAF, dpr, in-view.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### Animations/OrbitImages
画面: 指针, 滚动或点击驱动的运动层. 技法: svg. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: threshold=5; ease=EASINGS[cfg.easing] || EASINGS.linear; threshold=0.05 }; duration=40. uniform: none. 标记: reduced-motion, rAF, in-view, hidden-pause.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### Animations/PixelSwap
画面: 指针, 滚动或点击驱动的运动层. 技法: dom. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: duration=400; duration=350. uniform: none. 标记: reduced-motion, rAF.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### Animations/PixelTrail
画面: 指针, 滚动或点击驱动的运动层. 技法: webgl, canvas. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: ease=x => x; ease=easingFunction || identityEase. uniform: u_age, u_color, u_decay, u_gap, u_glow, u_gridSize, u_hasImage, u_image. 标记: rAF, dpr, in-view.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Animations/PixelTransition
画面: 指针, 滚动或点击驱动的运动层. 技法: canvas. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: duration=0.4. uniform: none. 标记: reduced-motion, rAF, dpr.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### Animations/Ribbons
画面: 指针, 滚动或点击驱动的运动层. 技法: webgl. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: stiffness=0.5; damping=2 * zeta * 60 * Math.sqrt(spring) * ribbon.drag. uniform: u_color, u_fade, u_opacity, u_resolution, u_softness. 标记: rAF, dpr, in-view.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Animations/RippleDistortion
画面: 指针, 滚动或点击驱动的运动层. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: uDispersion, uDisplacement, uGlint, uGrayscale, uHighlight, uResolution, uRings, uStrength. 标记: reduced-motion, rAF, dpr.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Animations/ScrollExpand
画面: 指针, 滚动或点击驱动的运动层. 技法: dom. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=6%; padding=0 6%; distance=1.2; distance=0.35. uniform: none. 标记: reduced-motion, rAF.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### Animations/ShapeBlur
画面: 指针, 滚动或点击驱动的运动层. 技法: webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: blur=16. uniform: uAngle, uBackdrop, uBlur, uChroma, uColor, uDpr, uEchoes, uField. 标记: reduced-motion, rAF, dpr, in-view.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Animations/SplashCursor
画面: 指针, 滚动或点击驱动的运动层. 技法: webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: threshold=0.3; ease=() => {. uniform: aspectRatio, bloom, color, colorA, colorB, curl, curve, dissipation. 标记: reduced-motion, rAF, dpr.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Animations/StarBorder
画面: 指针, 滚动或点击驱动的运动层. 技法: canvas. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=0.875rem 1.5rem; ease=t => (t < 0.5 ? 4 * t * t * t : 1 - (2 - 2 * t) ** 3 / 2); duration=4. uniform: none. 标记: reduced-motion, rAF, dpr, in-view.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### Animations/StickerPeel
画面: 指针, 滚动或点击驱动的运动层. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: uAngle, uBack, uCanvas, uCenter, uDir, uFinish, uFold, uGlint. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Animations/Strands
画面: 指针, 滚动或点击驱动的运动层. 技法: webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: uAmplitude, uColors, uCount, uDispersion, uGlass, uGlow, uHueShift, uIntensity. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Animations/SwarmCursor
画面: 指针, 滚动或点击驱动的运动层. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: ease=introClock * introClock * (3 - 2 * introClock). uniform: uAccent, uColor, uRatio, uView. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Animations/TargetCursor
画面: 指针, 滚动或点击驱动的运动层. 技法: dom. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: duration=2; duration=0.2; padding=6; duration=0. uniform: none. 标记: reduced-motion, rAF.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
## Backgrounds

### Backgrounds/AcidSquares
画面: 铺满容器的连续背景场. 技法: webgl. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: ease=x => {; distance=8 / s.zoom. uniform: uAccent, uAngle, uArea, uBrightness, uBulge, uClock, uColor, uEye. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/AeroShards
画面: 铺满容器的连续背景场. 技法: canvas. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: distance=-1e9; stiffness=24 * (1 - shard.gather * 0.95); ease=1 - Math.exp(-dt / 0.12). uniform: none. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### Backgrounds/Antigravity
画面: 铺满容器的连续背景场. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: ease=capture * capture * (3 - 2 * capture); damping=1.64 * omega. uniform: uAmbient, uBand, uCharge, uColorMode, uCursor, uDepth, uHue, uOpacity. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/Aurora
画面: 铺满容器的连续背景场. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: uAmplitude, uBlend, uBrightness, uFlip, uGlow, uHeight, uLayers, uLightMode. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/Balatro
画面: 铺满容器的连续背景场. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: uBlock, uCanvas, uColor1, uColor2, uColor3, uContrast, uCrt, uCss. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/Ballpit
画面: 铺满容器的连续背景场. 技法: webgl. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: ease=event => {. uniform: uCameraZ, uExposure, uExtra, uLight, uLightPos, uPixel, uProj, uShadow. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/Beams
画面: 铺满容器的连续背景场. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: uCamera, uColor, uDepth, uFade, uField, uFill, uGain, uGlow. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/CRTWarp
画面: 铺满容器的连续背景场. 技法: ogl, webgl, canvas. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: uAmplitude, uBackground, uBloom, uBrightness, uColor, uContent, uCorners, uCurve. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/ColorBends
画面: 铺满容器的连续背景场. 技法: three, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: uBandWidth, uCanvas, uColorCount, uColors, uFrequency, uIntensity, uIterations, uMouseInfluence. 标记: rAF, dpr.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/DarkVeil
画面: 铺满容器的连续背景场. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: uColor, uDither, uDrag, uFade, uField, uFlow, uGain, uGlow. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/Dither
画面: 铺满容器的连续背景场. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: uBackground, uBrightness, uCell, uCellDevice, uColorNum, uContrast, uEffect, uField. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/DotField
画面: 铺满容器的连续背景场. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: uBase, uCell, uFocus, uFrom, uGlow, uGlowColor, uGradient, uLens. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/DotGrid
画面: 铺满容器的连续背景场. 技法: webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: duration=0.8; damping=2 * zeta * omega; distance=0. uniform: uActive, uBase, uFade, uGlow, uOpacity, uResolution, uShape, uSize. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/EvilEye
画面: 铺满容器的连续背景场. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: uBgColor, uEyeColor, uFlameSpeed, uGlowIntensity, uIntensity, uIrisWidth, uLightMode, uMouse. 标记: rAF.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/FaultyTerminal
画面: 铺满容器的连续背景场. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: iResolution, iTime, uBrightness, uCellCount, uChromaticAberration, uClickMode, uClickSeconds, uClicks. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/Ferrofluid
画面: 铺满容器的连续背景场. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: distance=1.0 - smoothstep(uFogStart; distance=4 }. uniform: uBase, uBottom, uBound, uBoundCell, uBoundSpan, uCamera, uCell, uCellSize. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/FloatingLines
画面: 铺满容器的连续背景场. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: distance=6; damping=0.05. uniform: uBackground, uBendRadius, uBendStrength, uBrightness, uClicks, uCount, uEdgeFade, uFocus. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/FluxLines
画面: 铺满容器的连续背景场. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: uBackground, uColorCount, uColors, uFlow, uFluidity, uGlow, uLight, uLine. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/Galaxy
画面: 铺满容器的连续背景场. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: uAutoCenterRepulsion, uBackground, uColorCount, uColors, uDensity, uDepth, uFlareGain, uFocal. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/GhostFibers
画面: 铺满容器的连续背景场. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: ease=1 - (1 - intro) * (1 - intro) * (1 - intro). uniform: uBloom, uBrightness, uDepthSpread, uDof, uDotLength, uDots, uDpr, uEye. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/GradientASCII
画面: 铺满容器的连续背景场. 技法: ogl, webgl, canvas. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: uAspect, uAtlas, uAtlasGrid, uAux, uCell, uClickEffect, uClicks, uCount. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/GradientBlinds
画面: 铺满容器的连续背景场. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: ease=uRelief * 0.38 * smoothstep(0.62. uniform: uAngle, uBlindCount, uColorCount, uColors, uDistort, uGlow, uGradientShift, uGrainTime. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/GradientWaves
画面: 铺满容器的连续背景场. 技法: webgl, canvas. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: ease=1 - Math.exp(-dt / 0.45); ease=1 - Math.exp(-dt / 0.6). uniform: uAmplitude, uBackground, uBrightness, uClock, uCrest, uFogDepth, uGrain, uHeight. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/Grainient
画面: 铺满容器的连续背景场. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: uAspect, uBands, uContrast, uCount, uDir, uExtent, uField, uFlow. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/GridDistortion
画面: 铺满容器的连续背景场. 技法: webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: distance=0; distance=== 0) continue. uniform: uChroma, uCover, uField, uGrid, uImage, uReveal, uSoftness. 标记: reduced-motion, rAF, dpr, in-view.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/GridMotion
画面: 铺满容器的连续背景场. 技法: dom. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=0 1em. uniform: none. 标记: reduced-motion, rAF, in-view.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### Backgrounds/GridScan
画面: 铺满容器的连续背景场. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=3px 8px; distance=1.25; ease=1.0 - exp(-max(gaps; duration=2.4; delay=1.6. uniform: uAspect, uBloom, uCell, uCoreColor, uDepth, uDot, uEye, uFade. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/Hyperspeed
画面: 铺满容器的连续背景场. 技法: three, webgl, canvas. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: uBackground, uCeiling, uColor, uColorCount, uColors, uCore, uCount, uCurvature. 标记: reduced-motion, rAF, dpr, in-view.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/Iridescence
画面: 铺满容器的连续背景场. 技法: webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: ease=Math.exp(-swirl.age * 1.35) - Math.exp(-swirl.age * 10). uniform: uAmplitude, uBrightness, uColor, uContrast, uDetail, uFade, uField, uGrain. 标记: reduced-motion, rAF, dpr, in-view.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/LetterGlitch
画面: 铺满容器的连续背景场. 技法: ogl, webgl, canvas. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: ease=k => {. uniform: uAtlas, uAtlasColumns, uBackground, uBase, uBaseOpacity, uCell, uCenter, uColors. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/LightPillar
画面: 铺满容器的连续背景场. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: ease=t => t * t * t * (t * (t * 6 - 15) + 10). uniform: uAspect, uBloom, uBottomColor, uDetail, uFade, uField, uFieldSize, uFlare. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/LightRays
画面: 铺满容器的连续背景场. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: distance=1. uniform: uAim, uAtmosphere, uColor, uDensity, uDistortion, uFade, uGlow, uHaze. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/LightTunnel
画面: 铺满容器的连续背景场. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: uBend, uBody, uBrightness, uCable, uCenter, uChance, uCount, uDrift. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/Lightfall
画面: 铺满容器的连续背景场. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: uBloom, uBloom0, uBloom1, uBloom2, uBloom3, uColorCount, uColors, uColumns. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/Lightning
画面: 铺满容器的连续背景场. 技法: webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: uAngle, uBolts, uBranches, uColor, uFade, uFlash, uFlicker, uGlow. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/LineWaves
画面: 铺满容器的连续背景场. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: uBrightness, uColor1, uColor2, uColor3, uCycle, uEdge, uGlow, uHighlight. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/LiquidChrome
画面: 铺满容器的连续背景场. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: ease=dot(stepX; stiffness=36; damping=2 * Math.sqrt(stiffness) * 0.95. uniform: uAmplitude, uDepth, uDetail, uExposure, uFrequency, uImpulse, uLight, uPresence. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/LiquidEther
画面: 铺满容器的连续背景场. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: delay=1000. uniform: uAmount, uBackground, uDivergence, uForce, uKeep, uLight, uPalette, uPressure. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/MagicRings
画面: 铺满容器的连续背景场. 技法: ogl, webgl, canvas. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: stagger=0.5; stiffness=70; damping=2 * Math.sqrt(stiffness) * 0.9. uniform: uBounds, uCenter, uCount, uForward, uFrame, uGlow, uGrain, uHalo. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/MagnetLines
画面: 铺满容器的连续背景场. 技法: ogl, webgl, canvas. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: stiffness=s.inertia <= 0 || reduced ? 0 : Math.pow(6 + 42 * Math.pow(1. uniform: uAccent, uAccentMix, uCanvas, uColor, uEdge, uFade, uFar, uHead. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/MicroSlats
画面: 铺满容器的连续背景场. 技法: ogl, canvas. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: duration=1.5; ease=introLinear < 0.5 ? 4 * introLinear * introLinear * introLin. uniform: tField, tInk, tVelocity, uAspect, uBackground, uChop, uColor, uContrast. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/MoltenMetal
画面: 铺满容器的连续背景场. 技法: webgl, canvas. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: ease=1 - Math.exp(-dt / 0.33). uniform: uBackground, uBalance, uBlackPoint, uBrightness, uClock, uColorCount, uColors, uDetail. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/Orb
画面: 铺满容器的连续背景场. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: uAwake, uBackground, uBleed, uColor1, uColor2, uColor3, uEcho, uGlow. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/Particles
画面: 铺满容器的连续背景场. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: distance=20; distance=110. uniform: uAspect, uBlur, uBurstCount, uBursts, uCamera, uDrift, uEffect, uFocus. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/PatternWaves
画面: 铺满容器的连续背景场. 技法: ogl, canvas. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: tAtlas, tField, tRipple, tState, uAccent, uAmp, uAppear, uAtlas. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/PixelBlast
画面: 铺满容器的连续背景场. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: uAccent, uCellCount, uCells, uClickAge, uClickPos, uClock, uColor, uDecay. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/PixelSnow
画面: 铺满容器的连续背景场. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: ease=1 - Math.exp(-dt * 2.2). uniform: uAtlas, uBase, uBrightness, uColor, uFade, uGlow, uGlowMap, uGrid. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/Plasma
画面: 铺满容器的连续背景场. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: uColor, uDither, uFade, uGain, uGrain, uHeat, uHighlight, uInk. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/PlasmaWave
画面: 铺满容器的连续背景场. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: uBase, uBend1, uBend2, uBloom, uCoarse, uCoarseSize, uColor1, uColor2. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/Prism
画面: 铺满容器的连续背景场. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: uCenterShift, uColorFreq, uGlow, uHue, uInvBaseHalf, uInvHeight, uLight, uMinAxis. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/PrismaticBurst
画面: 铺满容器的连续背景场. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: uBloom, uBloom0, uBloom1, uBloom2, uBloom3, uCenterFade, uColorCount, uDecode. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/Radar
画面: 铺满容器的连续背景场. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: uAccent, uBackground, uBase, uBloom, uCenter, uClutter, uCycle, uDirection. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/RippleGrid
画面: 铺满容器的连续背景场. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: uCell, uColor, uFade, uFocal, uGlow, uInk, uLightMode, uLineWidth. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/Scanner
画面: 铺满容器的连续背景场. 技法: webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: uAttract, uBrightness, uColor1, uColor2, uColor3, uDensity, uDirection, uFrequency. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/ShapeGrid
画面: 铺满容器的连续背景场. 技法: canvas. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: blur=0; stiffness=220; damping=2 * Math.sqrt(stiffness) * 0.85. uniform: none. 标记: reduced-motion, rAF, dpr, in-view.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### Backgrounds/ShapeWaves
画面: 铺满容器的连续背景场. 技法: canvas. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: threshold=0.01; threshold=0.6; duration=1.6. uniform: none. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### Backgrounds/SideRays
画面: 铺满容器的连续背景场. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: ease=1 - Math.exp(-dt * 6); stiffness=18; damping=2 * Math.sqrt(stiffness). uniform: uAim, uBlend, uColorA, uColorB, uDensity, uDust, uFalloff, uFocus. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/Silk
画面: 铺满容器的连续背景场. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: ease=t => t * t * t * (t * (t * 6 - 15) + 10). uniform: uBloom, uColor, uDepth, uDrag, uFade, uFold, uGlow, uLight. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/SlicedWaves
画面: 铺满容器的连续背景场. 技法: webgl. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: distance=2.6; blur=0.6. uniform: uAngle, uBase, uExposure, uFade, uGlow, uGrain, uHalfBar, uLight. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/SoftAurora
画面: 铺满容器的连续背景场. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: uBandHeight, uBandSpread, uBrightness, uColor1, uColor2, uCursor, uFlow, uHue. 标记: reduced-motion, rAF, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/Threads
画面: 铺满容器的连续背景场. 技法: webgl. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: distance=0.4. uniform: uAccent, uAmplitude, uColor, uCount, uCurve, uDistance, uFade, uFrame. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/Topography
画面: 铺满容器的连续背景场. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: ease=reduce ? 1 : 1 - Math.exp(-dt / 0.4). uniform: sampler2D, uBase, uBloom0, uBloom1, uBloom2, uBloom3, uBrightness, uBrush. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/Waves
画面: 铺满容器的连续背景场. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: duration=1.4; damping=2 * zeta * omega. uniform: uAccent, uAmplitude, uAxis, uBand, uBase, uCell, uColor, uDrift. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Backgrounds/WebThreads
画面: 铺满容器的连续背景场. 技法: webgl, canvas. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: stagger=0.05; ease=1 - Math.exp(-dt / 0.22). uniform: uAngle, uBackground, uBrightness, uClock, uColorCount, uColors, uCore, uCount. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
## Components

### Components/AccordionGallery
画面: 可放进布局的交互卡片或导航. 技法: gsap. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: duration=0.6; ease='power3.out'; stagger=0.06; duration=0. uniform: none. 标记: reduced-motion.
结论: 入场曲线可参考, 但等间隔 power.out 正是 #42 的平. 只借 mask/back.out 那种有相位的预设.
### Components/AnimatedList
画面: 可放进布局的交互卡片或导航. 技法: dom. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=6px; padding=10px 14px 10px 10px; stagger=0.05; ease=CSS.supports?.('transition-timing-function'. uniform: none. 标记: reduced-motion, rAF, in-view.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### Components/BorderGlow
画面: 可放进布局的交互卡片或导航. 技法: dom. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=40px; duration=1000; delay=0; ease=easeOutCubic; duration=500; ease=easeInCubic. uniform: none. 标记: rAF.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### Components/BounceCards
画面: 可放进布局的交互卡片或导航. 技法: dom. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: delay=0.5; stagger=0.06; distance=160; stiffness=170; damping=2 * (1 - 0.85 * s.bounciness) * Math.sqrt(popStiffness); stiffness=210. uniform: none. 标记: reduced-motion, rAF.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### Components/BubbleMenu
画面: 可放进布局的交互卡片或导航. 技法: gsap. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=0 2em; padding=0 16px; padding=0; padding=0 24px; ease='back.out(1.5)'; duration=0.5. uniform: none. 标记: no reduced-motion or rAF marker.
结论: 入场曲线可参考, 但等间隔 power.out 正是 #42 的平. 只借 mask/back.out 那种有相位的预设.
### Components/CardNav
画面: 可放进布局的交互卡片或导航. 技法: waapi. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=0 var(--cn-inset); padding=0 14px 0 16px; padding=0; padding=0 16px; padding=0 var(--cn-inset) var(--cn-inset); padding=16px 16px 14px. uniform: none. 标记: reduced-motion, rAF.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### Components/CardSwap
画面: 可放进布局的交互卡片或导航. 技法: dom. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=6px; padding=0 6px; distance=60; distance=70; delay=4000; stagger=0.05 / s.speed. uniform: none. 标记: reduced-motion, rAF, in-view, hidden-pause.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### Components/Carousel
画面: 可放进布局的交互卡片或导航. 技法: waapi. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=10px; padding=0; padding=14%; duration=0s; stiffness=150; damping=24. uniform: none. 标记: reduced-motion, rAF, in-view, hidden-pause.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### Components/ChromaGrid
画面: 可放进布局的交互卡片或导航. 技法: dom. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=10px; padding=8px; padding=2px 6px 4px; duration=0.3s; damping=0.45. uniform: none. 标记: reduced-motion, rAF.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### Components/CircularCarousel
画面: 可放进布局的交互卡片或导航. 技法: css. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=0 16px; threshold=5; damping=2 * Math.sqrt(SPRING); ease=1 - Math.exp(-dt / 0.35). uniform: none. 标记: reduced-motion, rAF, in-view, hidden-pause.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### Components/CircularGallery
画面: 可放进布局的交互卡片或导航. 技法: ogl, webgl, svg. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=0; ease=value => value * value * (3 - 2 * value); ease=0.05; ease=clamp(scrollEase; ease=1 - Math.pow(1 - state.intro. uniform: uAlpha, uAngle, uBlur, uCenter, uDim, uFade, uFocal, uGray. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Components/Counter
画面: 可放进布局的交互卡片或导航. 技法: svg. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=0; duration=0.7; stagger=0.04. uniform: none. 标记: reduced-motion, rAF, in-view.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### Components/CurvedInput
画面: 可放进布局的交互卡片或导航. 技法: svg. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=0. uniform: none. 标记: no reduced-motion or rAF marker.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### Components/DecayCard
画面: 可放进布局的交互卡片或导航. 技法: webgl. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=1.25rem. uniform: uChroma, uFlow, uFrequency, uGray, uIdle, uImage, uImageSize, uOctaves. 标记: reduced-motion, rAF, dpr, in-view.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Components/DepthCarousel
画面: 可放进布局的交互卡片或导航. 技法: gsap, svg. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=8px 12px; padding=0; blur=6; duration=700; ease='power3.out'; delay=3200. uniform: none. 标记: reduced-motion.
结论: 入场曲线可参考, 但等间隔 power.out 正是 #42 的平. 只借 mask/back.out 那种有相位的预设.
### Components/Dock
画面: 可放进布局的交互卡片或导航. 技法: svg, waapi. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=0; duration=0s; padding=0 calc(var(--dock-base) * 0.1); padding=6px 10px; padding=5px; padding=0 10px 0 7px. uniform: none. 标记: reduced-motion, rAF.
结论: 值得采用其物理或错峰公式, 用 HX 令牌重写, 不复制源码.
### Components/DomeGallery
画面: 可放进布局的交互卡片或导航. 技法: gesture. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: threshold=0.015 - 0.01 * d. uniform: none. 标记: rAF.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### Components/DriftWall
画面: 可放进布局的交互卡片或导航. 技法: dom. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: ease=1 - Math.exp(-dt / (target === 0 ? 0.16 : 0.28)); ease=useCallback(() => {. uniform: none. 标记: reduced-motion, rAF.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### Components/ElasticSlider
画面: 可放进布局的交互卡片或导航. 技法: waapi. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=0 var(--elastic-slider-pad; padding=5px 8px; duration=280; ease=() => {. uniform: none. 标记: reduced-motion, rAF.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### Components/FlexCarousel
画面: 可放进布局的交互卡片或导航. 技法: ogl, css. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=0 16px; padding=0; damping=2 * Math.sqrt(stiffness). uniform: tMap, tScene, uAlpha, uAngle, uCenter, uCurl, uDispersion, uDpr. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Components/FlowingMenu
画面: 可放进布局的交互卡片或导航. 技法: waapi. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=0; padding=0 clamp(16px; padding=0.06em 0; padding=0 0.4em; ease='cubic-bezier(0.2; duration=0.5. uniform: none. 标记: reduced-motion, rAF.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### Components/FluidGlass
画面: 可放进布局的交互卡片或导航. 技法: webgl, canvas. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=0. uniform: uBackground, uBound, uCenter, uDispersion, uFocal, uFrost, uInverse, uIor. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Components/FlyingPosters
画面: 可放进布局的交互卡片或导航. 技法: webgl, canvas. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: ease=0.01; ease=clamp(scrollEase. uniform: uAlternate, uAtlas, uAxis, uCamera, uCells, uColumnGap, uColumns, uDepth. 标记: reduced-motion, rAF, dpr, in-view.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Components/Folder
画面: 可放进布局的交互卡片或导航. 技法: ogl, webgl, canvas, svg. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=0; damping=0.78. uniform: uAlpha, uBehind, uBevel, uBleed, uDepth, uDim, uGlint, uGutter. 标记: reduced-motion, rAF, dpr, in-view.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Components/GlassIcons
画面: 可放进布局的交互卡片或导航. 技法: webgl, canvas, svg. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=0; stagger=0.07; ease=t => 1 - Math.pow(1 - clamp(t; threshold=0.15 }. uniform: uBevel, uCanvas, uCenter, uDirection, uDisc, uExtent, uGlassAlpha, uGlassScale. 标记: reduced-motion, rAF, dpr, in-view.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Components/GlassSurface
画面: 可放进布局的交互卡片或导航. 技法: webgl, canvas, svg. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=0.5rem; padding=3px; blur=11. uniform: uBackdrop, uCanvas, uChannel, uLod, uMap, uOrigin, uSaturation, uScale. 标记: rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Components/GooeyNav
画面: 可放进布局的交互卡片或导航. 技法: webgl. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=0; ease=t => {; mass=0. uniform: uCount, uDrops, uHover, uHoverColor, uPill, uPills, uRatio, uShadow. 标记: reduced-motion, rAF, dpr.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Components/HoloCard
画面: 可放进布局的交互卡片或导航. 技法: webgl, canvas. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: uArt, uAspect, uDistance, uEdge, uFoil, uFrame, uGlare, uIntensity. 标记: reduced-motion, rAF, dpr, in-view.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Components/InfiniteMenu
画面: 可放进布局的交互卡片或导航. 技法: webgl, canvas, svg. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=0; duration=0.18s. uniform: uAtlas, uCamera, uCells, uDim, uGrayscale, uInset, uOrientation, uPlaceholder. 标记: reduced-motion, rAF, dpr, in-view.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Components/InfiniteSpiral
画面: 可放进布局的交互卡片或导航. 技法: dom. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: blur=6; threshold=0.02 }. uniform: none. 标记: reduced-motion, rAF, in-view.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### Components/Lanyard
画面: 可放进布局的交互卡片或导航. 技法: three, webgl, canvas. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: mass=1; damping=0.5; damping=3; damping=6. uniform: foilAspect, foilFill, foilKey, foilStrength, foilTop. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Components/LineSidebar
画面: 可放进布局的交互卡片或导航. 技法: dom. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=1rem 0; ease=FALLOFF_CURVES[falloff] ?? FALLOFF_CURVES.linear. uniform: none. 标记: rAF.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### Components/MagicBento
画面: 可放进布局的交互卡片或导航. 技法: canvas, svg, css. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: delay=0ms; padding=1px; padding=16px 16px 22px; padding=2px 7px; padding=8px 12px 8px 8px; padding=2px 0 0. uniform: none. 标记: reduced-motion, rAF, dpr, in-view.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### Components/Masonry
画面: 可放进布局的交互卡片或导航. 技法: waapi. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=0; padding=40px 14px 12px; padding=0 72px; ease='cubic-bezier(0.2; stagger=0.05; duration=0.6. uniform: none. 标记: reduced-motion, rAF, in-view.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### Components/ModelViewer
画面: 可放进布局的交互卡片或导航. 技法: three, fiber. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: delay=2. uniform: none. 标记: reduced-motion, dpr, in-view.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Components/MorphSlider
画面: 可放进布局的交互卡片或导航. 技法: gsap, ogl, webgl, svg. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=8px 14px; padding=0 16px; padding=0; ease=opts.ease; ease='power2.out'; duration=1.1. uniform: tCurrent, tNext, uAberration, uCurrentSize, uDir, uDrift, uIntensity, uMode. 标记: reduced-motion, rAF, dpr.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Components/OptionWheel
画面: 可放进布局的交互卡片或导航. 技法: dom. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: blur=2. uniform: none. 标记: rAF.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### Components/PillNav
画面: 可放进布局的交互卡片或导航. 技法: waapi. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=0; padding=0 var(--pn-x); duration=0.5s; padding=0 16px; ease=() => {. uniform: none. 标记: reduced-motion, rAF.
结论: 值得采用其物理或错峰公式, 用 HX 令牌重写, 不复制源码.
### Components/PixelCard
画面: 可放进布局的交互卡片或导航. 技法: canvas. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: duration=600; delay=0; distance=1. uniform: none. 标记: reduced-motion, rAF, dpr, in-view.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### Components/ProfileCard
画面: 可放进布局的交互卡片或导航. 技法: svg. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=10px; padding=6px 20px 8px; padding=0 14px; duration=0s; ease=() => aim(0. uniform: none. 标记: reduced-motion, rAF.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### Components/ReflectiveCard
画面: 可放进布局的交互卡片或导航. 技法: ogl, webgl. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: distance=900; ease=() => aim(0. uniform: uBevel, uBlur, uCam, uCamMap, uCapture, uEnv, uEnvSize, uGlare. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Components/ScrollStack
画面: 可放进布局的交互卡片或导航. 技法: dom. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=2.5rem; distance=100; distance=24; distance=200; ease=() => {. uniform: none. 标记: reduced-motion, rAF.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### Components/SpecularButton
画面: 可放进布局的交互卡片或导航. 技法: webgl. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: blur=0px; padding=10px 20px; padding=14px 28px; padding=18px 38px; blur=0. uniform: uBaseColor, uCenter, uEntry, uGlow, uHalf, uIntensity, uLineColor, uPx. 标记: reduced-motion, rAF, dpr, in-view.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### Components/SpotlightCard
画面: 可放进布局的交互卡片或导航. 技法: dom. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=2rem; padding=1px. uniform: none. 标记: reduced-motion, rAF, in-view.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### Components/Stack
画面: 可放进布局的交互卡片或导航. 技法: motion. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: threshold=90; delay=3000; duration=0.2; ease='easeOut'. uniform: none. 标记: reduced-motion, rAF.
结论: 弹簧和 layout 测量值得学. 必须补上中断和减弱动效, 原件经常没有.
### Components/StaggeredMenu
画面: 可放进布局的交互卡片或导航. 技法: gsap. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=2em; padding=6em 2em 2em 2em; padding=0; padding=2px 0; duration=0.5; ease='power4.out' }. uniform: none. 标记: no reduced-motion or rAF marker.
结论: 入场曲线可参考, 但等间隔 power.out 正是 #42 的平. 只借 mask/back.out 那种有相位的预设.
### Components/Stepper
画面: 可放进布局的交互卡片或导航. 技法: waapi. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=4px; padding=0 10px; padding=10px; padding=0; padding=20px var(--stepper-inset) var(--stepper-inset); padding=6px var(--stepper-bleed). uniform: none. 标记: reduced-motion.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### Components/TiltedCard
画面: 可放进布局的交互卡片或导航. 技法: dom. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=1px; padding=5px 9px; threshold=6; delay=0. uniform: none. 标记: reduced-motion, rAF, in-view.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
## TextAnimations

### TextAnimations/ASCIIText
画面: 把句子或数字拆开再动. 技法: webgl, canvas. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: uBlocks, uCell, uChroma, uColors, uGlyphCount, uGlyphs, uHover, uHue. 标记: reduced-motion, rAF, dpr, in-view.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
### TextAnimations/BlurText
画面: 把句子或数字拆开再动. 技法: motion. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: ease='cubic-bezier(0.22; duration=0 }; padding=0; ease=EASE_IN; ease=EASE_IN_OUT; delay=200. uniform: none. 标记: in-view.
结论: 值得采用其物理或错峰公式, 用 HX 令牌重写, 不复制源码.
### TextAnimations/CircularText
画面: 把句子或数字拆开再动. 技法: motion. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: duration=20; stiffness=60; damping=18 }); stiffness=300; damping=20 }); stiffness=150. uniform: none. 标记: reduced-motion, rAF, in-view.
结论: 弹簧和 layout 测量值得学. 必须补上中断和减弱动效, 原件经常没有.
### TextAnimations/CountUp
画面: 把句子或数字拆开再动. 技法: motion, svg. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: stagger=0.07; padding=0; delay=0; duration=2; ease=EASINGS[live.easing] || EASINGS.easeOut. uniform: none. 标记: reduced-motion.
结论: 值得采用其物理或错峰公式, 用 HX 令牌重写, 不复制源码.
### TextAnimations/CurvedLoop
画面: 把句子或数字拆开再动. 技法: svg. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: distance=0. uniform: none. 标记: reduced-motion, rAF, in-view.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### TextAnimations/DecryptedText
画面: 把句子或数字拆开再动. 技法: motion, canvas, waapi. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=0; delay=2000; threshold=0.1 }. uniform: none. 标记: reduced-motion, in-view.
结论: 弹簧和 layout 测量值得学. 必须补上中断和减弱动效, 原件经常没有.
### TextAnimations/DepthText
画面: 把句子或数字拆开再动. 技法: dom. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: stiffness=260; damping=17; ease=0.7. uniform: none. 标记: reduced-motion, rAF, in-view.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### TextAnimations/EchoText
画面: 把句子或数字拆开再动. 技法: dom. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: blur=3; duration=900; ease='ease-out'; distance=0. uniform: none. 标记: reduced-motion, rAF, in-view.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### TextAnimations/FallingText
画面: 把句子或数字拆开再动. 技法: waapi, matter. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=1em; padding=0.24em 0.56em; ease=() =>; stagger=0.03; stiffness=0.2; delay=0. uniform: none. 标记: reduced-motion, rAF, in-view.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### TextAnimations/FoldText
画面: 把句子或数字拆开再动. 技法: gsap. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=0; delay=0.24; duration=0.65; stagger=0.045; ease='power3.out'; delay=1.4. uniform: none. 标记: reduced-motion.
结论: 入场曲线可参考, 但等间隔 power.out 正是 #42 的平. 只借 mask/back.out 那种有相位的预设.
### TextAnimations/FuzzyText
画面: 把句子或数字拆开再动. 技法: canvas. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: duration=0; duration=200; duration=1400. uniform: none. 标记: reduced-motion, rAF, dpr, in-view.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### TextAnimations/GlitchText
画面: 把句子或数字拆开再动. 技法: dom. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=0; duration=0.6. uniform: none. 标记: reduced-motion, rAF, in-view.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### TextAnimations/GradientText
画面: 把句子或数字拆开再动. 技法: dom. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=0.35em 0.75em; stiffness=160. uniform: none. 标记: reduced-motion, rAF, in-view.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### TextAnimations/MaskedHeading
画面: 把句子或数字拆开再动. 技法: gsap, svg. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=0; duration=1.1; stagger=0.09; ease=1 - Math.exp(-dt / 0.18); ease='power4.out'. uniform: none. 标记: reduced-motion, rAF, in-view.
结论: 入场曲线可参考, 但等间隔 power.out 正是 #42 的平. 只借 mask/back.out 那种有相位的预设.
### TextAnimations/ParticleText
画面: 把句子或数字拆开再动. 技法: canvas. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=0; damping=7.5; duration=1600; stagger=420; duration=1 }. uniform: none. 标记: reduced-motion, rAF, dpr, in-view.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### TextAnimations/RotatingText
画面: 把句子或数字拆开再动. 技法: motion. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=0; padding=0.1em 0.28em; damping=25; stiffness=300 }; damping=34; stiffness=320 }. uniform: none. 标记: reduced-motion.
结论: 弹簧和 layout 测量值得学. 必须补上中断和减弱动效, 原件经常没有.
### TextAnimations/ScrambledText
画面: 把句子或数字拆开再动. 技法: gsap. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=0; duration=1.2; delay=0) => {; ease='none'; ease=1 - Math.exp(-dt / Math.max(0.04. uniform: none. 标记: reduced-motion, rAF, in-view.
结论: 入场曲线可参考, 但等间隔 power.out 正是 #42 的平. 只借 mask/back.out 那种有相位的预设.
### TextAnimations/ScrollFloat
画面: 把句子或数字拆开再动. 技法: gsap. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=0; duration=1; ease='back.inOut(2)'; stagger=0.03; distance=120; ease=gsap.parseEase(ease) || (p => p). uniform: none. 标记: reduced-motion.
结论: 入场曲线可参考, 但等间隔 power.out 正是 #42 的平. 只借 mask/back.out 那种有相位的预设.
### TextAnimations/ScrollReveal
画面: 把句子或数字拆开再动. 技法: gsap. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: stagger=0.05; duration=0.8; ease='none'; ease='power3.out' }). uniform: none. 标记: reduced-motion.
结论: 入场曲线可参考, 但等间隔 power.out 正是 #42 的平. 只借 mask/back.out 那种有相位的预设.
### TextAnimations/ScrollVelocity
画面: 把句子或数字拆开再动. 技法: motion. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: ease=1 - Math.exp(-delta / 110); damping=50; stiffness=400. uniform: none. 标记: reduced-motion.
结论: 弹簧和 layout 测量值得学. 必须补上中断和减弱动效, 原件经常没有.
### TextAnimations/ShinyText
画面: 把句子或数字拆开再动. 技法: canvas. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: delay=0; ease=EASINGS[easing] ?? EASINGS.smooth; duration=1; stiffness=220. uniform: none. 标记: reduced-motion, rAF, in-view.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### TextAnimations/Shuffle
画面: 把句子或数字拆开再动. 技法: gsap, canvas, svg. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: duration=0.35; delay=0; ease='power3.out'; threshold=0.1; stagger=0.03. uniform: none. 标记: reduced-motion, rAF.
结论: 入场曲线可参考, 但等间隔 power.out 正是 #42 的平. 只借 mask/back.out 那种有相位的预设.
### TextAnimations/SplitFlapText
画面: 把句子或数字拆开再动. 技法: css. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=0; duration=0.12; stagger=0.06; delay=2400; duration=0. uniform: none. 标记: reduced-motion, rAF, hidden-pause.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### TextAnimations/SplitText
画面: 把句子或数字拆开再动. 技法: gsap. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: stiffness=180; damping=19; ease=t => 1 - Math.cos(t * Math.PI * 1.5) * Math.pow(1 - t; ease='power2.inOut' }; ease='power2.out'; ease='power3.out'. uniform: none. 标记: reduced-motion, rAF.
结论: 值得采用其物理或错峰公式, 用 HX 令牌重写, 不复制源码.
### TextAnimations/StrokeText
画面: 把句子或数字拆开再动. 技法: gsap, svg. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: duration=1.6; delay=0.2; stagger=0.05; ease='power2.out'. uniform: none. 标记: reduced-motion.
结论: 入场曲线可参考, 但等间隔 power.out 正是 #42 的平. 只借 mask/back.out 那种有相位的预设.
### TextAnimations/TechText
画面: 把句子或数字拆开再动. 技法: canvas. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: delay=0.15; duration=2; damping=2 * Math.sqrt(SPRING) * (1 - clamp01(s.bounce) * 0.96). uniform: none. 标记: reduced-motion, rAF, dpr, in-view.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### TextAnimations/TextCursor
画面: 把句子或数字拆开再动. 技法: dom. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: duration=0.5; ease=element => {; ease=smootherstep(gone); distance=0. uniform: none. 标记: reduced-motion, rAF.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### TextAnimations/TextLoop
画面: 把句子或数字拆开再动. 技法: gsap, svg. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: ease=hovered ? 'power2.out' : 'power2.inOut'; ease=performance.now() - lastT > 90 ? 0 : clamp(velocity. uniform: none. 标记: reduced-motion, in-view.
结论: 入场曲线可参考, 但等间隔 power.out 正是 #42 的平. 只借 mask/back.out 那种有相位的预设.
### TextAnimations/TextPressure
画面: 把句子或数字拆开再动. 技法: dom. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: none. 标记: reduced-motion, rAF, in-view.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### TextAnimations/TextType
画面: 把句子或数字拆开再动. 技法: gsap, waapi. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=0; duration=360; duration=520; duration=480; delay=0; duration=2000. uniform: none. 标记: reduced-motion, in-view.
结论: 入场曲线可参考, 但等间隔 power.out 正是 #42 的平. 只借 mask/back.out 那种有相位的预设.
### TextAnimations/TrueFocus
画面: 把句子或数字拆开再动. 技法: motion. 变体: content, tailwind, ts-default, ts-tailwind. 四种变体的运动字面量一致.
常数: ease=[0.65; duration=0.5; ease=SMOOTH_EASE }. uniform: none. 标记: reduced-motion.
结论: 弹簧和 layout 测量值得学. 必须补上中断和减弱动效, 原件经常没有.
### TextAnimations/VariableProximity
画面: 把句子或数字拆开再动. 技法: dom. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=0; ease=smoothing > 0 ? 1 - Math.exp(-delta / (smoothing * 400)) : 1. uniform: none. 标记: reduced-motion, rAF, in-view.
结论: DOM/SVG 交互件. 采用测量矩形和 pointercancel, 不用其默认配色.
### TextAnimations/WarpText
画面: 把句子或数字拆开再动. 技法: ogl, canvas. 变体: content, tailwind, ts-default, ts-tailwind. 变体之间字面量不一致, 以 content 为准.
常数: padding=0 7%; threshold=0 }. uniform: uBackdrop, uChromatic, uClicks, uIntro, uLens, uMotion, uPointer, uPointerActive. 标记: reduced-motion, rAF, dpr, in-view, hidden-pause.
结论: 不进默认包. 只借鉴 '单画布 + DPR 上限 + 离屏停帧', 首页不用着色器墙.
## Micro

第一遍没有把这个目录算进 183. 这里全是控件级按下和回弹.

### Micro/BellToggle
画面: 控件级微交互 (按下, 拖拽, 开关, 滑杆). 技法: motion, svg, waapi. 变体: content, ts-default. 四种变体的运动字面量一致.
常数: duration=0.3; ease='cubic-bezier(0.77; duration=420 }; duration=820; delay=70; duration=380. uniform: none. 标记: reduced-motion.
结论: 值得超过: 这是控件级手感, 不是背景. 吸收按下/回弹/速度保留, 不要整段复制视觉.
### Micro/BranchedMenu
画面: 控件级微交互 (按下, 拖拽, 开关, 滑杆). 技法: svg. 变体: content, ts-default. 四种变体的运动字面量一致.
常数: duration=400; duration=300; padding=9px 0; padding=6px 0; padding=0 0 0 var(--bm-indent). uniform: none. 标记: reduced-motion.
结论: 值得超过: 这是控件级手感, 不是背景. 吸收按下/回弹/速度保留, 不要整段复制视觉.
### Micro/CallChip
画面: 控件级微交互 (按下, 拖拽, 开关, 滑杆). 技法: waapi. 变体: content, ts-default. 四种变体的运动字面量一致.
常数: duration=450; padding=0 var(--cc-pad); padding=0. uniform: none. 标记: reduced-motion, rAF.
结论: 值得超过: 这是控件级手感, 不是背景. 吸收按下/回弹/速度保留, 不要整段复制视觉.
### Micro/CodeSlots
画面: 控件级微交互 (按下, 拖拽, 开关, 滑杆). 技法: motion, css. 变体: content, ts-default. 四种变体的运动字面量一致.
常数: padding=0; delay=0.06; delay=0.28; ease=EASE_OUT }); duration=0.3. uniform: none. 标记: reduced-motion.
结论: 值得超过: 这是控件级手感, 不是背景. 吸收按下/回弹/速度保留, 不要整段复制视觉.
### Micro/CometDial
画面: 控件级微交互 (按下, 拖拽, 开关, 滑杆). 技法: motion, svg. 变体: content, ts-default. 四种变体的运动字面量一致.
常数: mass=1. uniform: none. 标记: reduced-motion, rAF.
结论: 值得超过: 这是控件级手感, 不是背景. 吸收按下/回弹/速度保留, 不要整段复制视觉.
### Micro/DodgeField
画面: 控件级微交互 (按下, 拖拽, 开关, 滑杆). 技法: motion. 变体: content, ts-default. 四种变体的运动字面量一致.
常数: padding=0 28px; duration=130; duration=620. uniform: none. 标记: reduced-motion, rAF.
结论: 值得超过: 这是控件级手感, 不是背景. 吸收按下/回弹/速度保留, 不要整段复制视觉.
### Micro/FlipCard
画面: 控件级微交互 (按下, 拖拽, 开关, 滑杆). 技法: motion. 变体: content, ts-default. 四种变体的运动字面量一致.
常数: stiffness=240; damping=24; mass=0.6 }; stiffness=320; damping=26 }; distance=0. uniform: none. 标记: reduced-motion.
结论: 值得超过: 这是控件级手感, 不是背景. 吸收按下/回弹/速度保留, 不要整段复制视觉.
### Micro/FlyingButton
画面: 控件级微交互 (按下, 拖拽, 开关, 滑杆). 技法: ogl, webgl, canvas, svg. 变体: content, ts-default. 四种变体的运动字面量一致.
常数: padding=0 var(--fly-px); threshold=0.035; blur=3; ease=r * 0.4. uniform: uBuoyancy, uCol, uCraft, uCraftMotion, uCurl, uDamping, uDispV, uDisperse. 标记: reduced-motion, rAF.
结论: 值得超过: 这是控件级手感, 不是背景. 吸收按下/回弹/速度保留, 不要整段复制视觉.
### Micro/FolderFloat
画面: 控件级微交互 (按下, 拖拽, 开关, 滑杆). 技法: css, matter. 变体: content, ts-default. 四种变体的运动字面量一致.
常数: stagger=45ms; padding=14px 16px; padding=0; padding=0 14px; duration=520; stagger=45. uniform: none. 标记: reduced-motion, rAF.
结论: 值得超过: 这是控件级手感, 不是背景. 吸收按下/回弹/速度保留, 不要整段复制视觉.
### Micro/FuseButton
画面: 控件级微交互 (按下, 拖拽, 开关, 滑杆). 技法: svg, waapi. 变体: content, ts-default. 四种变体的运动字面量一致.
常数: padding=0 var(--fb-px); delay=0s; duration=0s; padding=0; ease=() => {. uniform: none. 标记: reduced-motion.
结论: 值得超过: 这是控件级手感, 不是背景. 吸收按下/回弹/速度保留, 不要整段复制视觉.
### Micro/GlideSelect
画面: 控件级微交互 (按下, 拖拽, 开关, 滑杆). 技法: css. 变体: content, ts-default. 四种变体的运动字面量一致.
常数: duration=180; duration=220; padding=0 8px 0 10px; padding=4px. uniform: none. 标记: reduced-motion.
结论: 值得超过: 这是控件级手感, 不是背景. 吸收按下/回弹/速度保留, 不要整段复制视觉.
### Micro/HoldButton
画面: 控件级微交互 (按下, 拖拽, 开关, 滑杆). 技法: css. 变体: content, ts-default. 四种变体的运动字面量一致.
常数: ease=({ drifted = false } = {}) => {; ease=200ms; padding=0 16px; padding=0 22px; padding=0 28px; ease=(t: number) => number) => {. uniform: none. 标记: reduced-motion, rAF.
结论: 值得超过: 这是控件级手感, 不是背景. 吸收按下/回弹/速度保留, 不要整段复制视觉.
### Micro/JellyRadio
画面: 控件级微交互 (按下, 拖拽, 开关, 滑杆). 技法: motion. 变体: content, ts-default. 四种变体的运动字面量一致.
常数: damping=2 * Math.sqrt(k * m) * (1 - bounce); stagger=22; stiffness=580. uniform: none. 标记: reduced-motion.
结论: 值得超过: 这是控件级手感, 不是背景. 吸收按下/回弹/速度保留, 不要整段复制视觉.
### Micro/LatticeLoader
画面: 控件级微交互 (按下, 拖拽, 开关, 滑杆). 技法: css. 变体: content, ts-default. 四种变体的运动字面量一致.
常数: padding=0; delay=0ms !important; duration=1400ms !important. uniform: none. 标记: reduced-motion.
结论: 值得超过: 这是控件级手感, 不是背景. 吸收按下/回弹/速度保留, 不要整段复制视觉.
### Micro/PaperCrumple
画面: 控件级微交互 (按下, 拖拽, 开关, 滑杆). 技法: three, webgl. 变体: content, ts-default. 四种变体的运动字面量一致.
常数: padding=0; duration=0.55; duration=0.4. uniform: paperLighting. 标记: reduced-motion, rAF.
结论: 值得超过: 这是控件级手感, 不是背景. 吸收按下/回弹/速度保留, 不要整段复制视觉.
### Micro/PeekRating
画面: 控件级微交互 (按下, 拖拽, 开关, 滑杆). 技法: waapi. 变体: content, ts-default. 四种变体的运动字面量一致.
常数: duration=320; duration=300 }; padding=0; padding=0 calc(var(--pr-size) * 0.3); duration=0ms. uniform: none. 标记: reduced-motion.
结论: 值得超过: 这是控件级手感, 不是背景. 吸收按下/回弹/速度保留, 不要整段复制视觉.
### Micro/PromptBar
画面: 控件级微交互 (按下, 拖拽, 开关, 滑杆). 技法: motion, canvas, svg, css. 变体: content, ts-default. 四种变体的运动字面量一致.
常数: duration=0 } : { duration: morphDuration / 1000; ease=EASE_IN_OUT }; duration=240; blur=6 + energy * 10 + pulse * 6; padding=4px; padding=0 8px. uniform: none. 标记: reduced-motion, rAF.
结论: 值得超过: 这是控件级手感, 不是背景. 吸收按下/回弹/速度保留, 不要整段复制视觉.
### Micro/PulseHeart
画面: 控件级微交互 (按下, 拖拽, 开关, 滑杆). 技法: svg. 变体: content, ts-default. 四种变体的运动字面量一致.
常数: duration=560; overshoot=1.7; duration=350; padding=0. uniform: none. 标记: reduced-motion, rAF.
结论: 值得超过: 这是控件级手感, 不是背景. 吸收按下/回弹/速度保留, 不要整段复制视觉.
### Micro/RefineFrame
画面: 控件级微交互 (按下, 拖拽, 开关, 滑杆). 技法: canvas, css. 变体: content, ts-default. 四种变体的运动字面量一致.
常数: blur=4; blur=1.5; blur=0.5; blur=0; blur=2; duration=400. uniform: none. 标记: reduced-motion, rAF.
结论: 值得超过: 这是控件级手感, 不是背景. 吸收按下/回弹/速度保留, 不要整段复制视觉.
### Micro/RubberSegment
画面: 控件级微交互 (按下, 拖拽, 开关, 滑杆). 技法: motion. 变体: content, ts-default. 四种变体的运动字面量一致.
常数: duration=0.3; duration=0.4; duration=0.16; ease=EASE_OUT }. uniform: none. 标记: reduced-motion.
结论: 值得超过: 这是控件级手感, 不是背景. 吸收按下/回弹/速度保留, 不要整段复制视觉.
### Micro/ScrubField
画面: 控件级微交互 (按下, 拖拽, 开关, 滑杆). 技法: motion. 变体: content, ts-default. 四种变体的运动字面量一致.
常数: duration=0.3; duration=300; padding=0 8px 0 4px; duration=0ms; padding=0 6px. uniform: none. 标记: reduced-motion.
结论: 值得超过: 这是控件级手感, 不是背景. 吸收按下/回弹/速度保留, 不要整段复制视觉.
### Micro/Shredder
画面: 控件级微交互 (按下, 拖拽, 开关, 滑杆). 技法: canvas, svg. 变体: content, ts-default. 四种变体的运动字面量一致.
常数: stagger=0.035; ease=(from; delay=0; padding=0 var(--sh-inset); ease=(from: number. uniform: none. 标记: reduced-motion, rAF.
结论: 值得超过: 这是控件级手感, 不是背景. 吸收按下/回弹/速度保留, 不要整段复制视觉.
### Micro/SlideCommit
画面: 控件级微交互 (按下, 拖拽, 开关, 滑杆). 技法: motion, svg, css. 变体: content, ts-default. 四种变体的运动字面量一致.
常数: padding=0; mass=0.9; duration=0.2; ease=EASE_OUT }); delay=0.12 }). uniform: none. 标记: reduced-motion.
结论: 值得超过: 这是控件级手感, 不是背景. 吸收按下/回弹/速度保留, 不要整段复制视觉.
### Micro/SlingButton
画面: 控件级微交互 (按下, 拖拽, 开关, 滑杆). 技法: motion, svg, waapi. 变体: content, ts-default. 四种变体的运动字面量一致.
常数: duration=0.4; ease=(pointerId; padding=0; ease=(pointerId: number. uniform: none. 标记: reduced-motion, rAF.
结论: 值得超过: 这是控件级手感, 不是背景. 吸收按下/回弹/速度保留, 不要整段复制视觉.
### Micro/SloshGauge
画面: 控件级微交互 (按下, 拖拽, 开关, 滑杆). 技法: dom. 变体: content, ts-default. 四种变体的运动字面量一致.
常数: 没有单独的 duration/stiffness 字面量, 运动在逐帧公式或着色器里. uniform: none. 标记: reduced-motion, rAF.
结论: 值得超过: 这是控件级手感, 不是背景. 吸收按下/回弹/速度保留, 不要整段复制视觉.
### Micro/SpringCheck
画面: 控件级微交互 (按下, 拖拽, 开关, 滑杆). 技法: motion, svg. 变体: content, ts-default. 四种变体的运动字面量一致.
常数: duration=0.2; padding=0. uniform: none. 标记: reduced-motion.
结论: 值得超过: 这是控件级手感, 不是背景. 吸收按下/回弹/速度保留, 不要整段复制视觉.
### Micro/SquishSwitch
画面: 控件级微交互 (按下, 拖拽, 开关, 滑杆). 技法: motion. 变体: content, ts-default. 四种变体的运动字面量一致.
常数: stiffness=320; damping=40; mass=0.6 }; stiffness=520; damping=34; duration=320. uniform: none. 标记: reduced-motion.
结论: 值得超过: 这是控件级手感, 不是背景. 吸收按下/回弹/速度保留, 不要整段复制视觉.
### Micro/StatusMark
画面: 控件级微交互 (按下, 拖拽, 开关, 滑杆). 技法: motion, svg, css. 变体: content, ts-default. 四种变体的运动字面量一致.
常数: duration=0.3; ease=[0.77; duration=1100; duration=240; delay=60; ease='linear'. uniform: none. 标记: reduced-motion.
结论: 值得超过: 这是控件级手感, 不是背景. 吸收按下/回弹/速度保留, 不要整段复制视觉.
### Micro/SwipeRow
画面: 控件级微交互 (按下, 拖拽, 开关, 滑杆). 技法: motion. 变体: content, ts-default. 四种变体的运动字面量一致.
常数: padding=0; padding=0 16px; padding=0 10px; duration=0.3; duration=0.2; ease=EASE_OUT }). uniform: none. 标记: reduced-motion.
结论: 值得超过: 这是控件级手感, 不是背景. 吸收按下/回弹/速度保留, 不要整段复制视觉.
### Micro/SwipeToast
画面: 控件级微交互 (按下, 拖拽, 开关, 滑杆). 技法: motion, waapi. 变体: content, ts-default. 四种变体的运动字面量一致.
常数: distance=40; duration=4000; duration=0.3; duration=0.2; ease=EASE_OUT }).then(() => finish('swipe')); ease=EASE_OUT }. uniform: none. 标记: reduced-motion, rAF.
结论: 值得超过: 这是控件级手感, 不是背景. 吸收按下/回弹/速度保留, 不要整段复制视觉.
### Micro/TearTicket
画面: 控件级微交互 (按下, 拖拽, 开关, 滑杆). 技法: motion, svg. 变体: content, ts-default. 四种变体的运动字面量一致.
常数: duration=0ms; stiffness=220; damping=24; mass=0.6 }. uniform: none. 标记: reduced-motion, rAF.
结论: 值得超过: 这是控件级手感, 不是背景. 吸收按下/回弹/速度保留, 不要整段复制视觉.
### Micro/ThoughtLine
画面: 控件级微交互 (按下, 拖拽, 开关, 滑杆). 技法: motion, css. 变体: content, ts-default. 四种变体的运动字面量一致.
常数: blur=2px; padding=0; padding=0.6em 0 0.2em 1.6em; duration=2.4s; duration=1.8; duration=350. uniform: none. 标记: reduced-motion.
结论: 值得超过: 这是控件级手感, 不是背景. 吸收按下/回弹/速度保留, 不要整段复制视觉.
### Micro/VoicePill
画面: 控件级微交互 (按下, 拖拽, 开关, 滑杆). 技法: canvas. 变体: content, ts-default. 四种变体的运动字面量一致.
常数: distance=64; ease=240; duration=200; padding=0; duration=0ms; ease=number. uniform: none. 标记: reduced-motion, rAF.
结论: 值得超过: 这是控件级手感, 不是背景. 吸收按下/回弹/速度保留, 不要整段复制视觉.
### Micro/WakeSlider
画面: 控件级微交互 (按下, 拖拽, 开关, 滑杆). 技法: motion. 变体: content, ts-default. 四种变体的运动字面量一致.
常数: duration=0ms; padding=0; damping=2 * w0; mass=1 }); damping=2.5 * wv. uniform: none. 标记: reduced-motion.
结论: 值得超过: 这是控件级手感, 不是背景. 吸收按下/回弹/速度保留, 不要整段复制视觉.
### Micro/WarmTooltip
画面: 控件级微交互 (按下, 拖拽, 开关, 滑杆). 技法: motion. 变体: content, ts-default. 四种变体的运动字面量一致.
常数: stiffness=260; damping=22; mass=0.4 }; delay=400; ease=EASE_OUT }). uniform: none. 标记: reduced-motion, rAF.
结论: 值得超过: 这是控件级手感, 不是背景. 吸收按下/回弹/速度保留, 不要整段复制视觉.
