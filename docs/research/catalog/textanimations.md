# react-bits TextAnimations

来源提交 `4dc7b5b`. 每个目录的实现文件逐行扫描后摘运动行.

### TextAnimations/ASCIIText

- 文件: `TextAnimations/ASCIIText/ASCIIText.jsx` 570 行. 目录内实现已逐行扫描.
- 看起来: 着色器场, uniform 有 uText, uGlyphs, uSize, uCell, uGlyphCount, uTextAspect, uPlaneHeight, uTilt. 命名常数 CHARSET, FONT, GLYPH_WIDTH, GLYPH_HEIGHT, TEXT_PX, RIPPLES.
- 技法: WebGL + canvas2d + rAF.
- 常数:
  - `ASCIIText.jsx:5` `const CHARSET = ' .\''^",:;Il!i~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';`
  - `ASCIIText.jsx:7` `const GLYPH_WIDTH = 40;`
  - `ASCIIText.jsx:8` `const GLYPH_HEIGHT = 64;`
  - `ASCIIText.jsx:9` `const TEXT_PX = 256;`
  - `ASCIIText.jsx:10` `const RIPPLES = 4;`
  - `ASCIIText.jsx:59` `float tanHalf = 0.41421356;`
  - `ASCIIText.jsx:72` `float planeHeight = 24.8528 * uPlaneHeight;`
  - `ASCIIText.jsx:74` `float wave = 5.0 * sin(uTime * uWaveSpeed);`
  - `ASCIIText.jsx:95` `float ring = 0.0;`
  - `ASCIIText.jsx:103` `float strength = (1.0 - smoothstep(0.0, 1.2, ripple.z)) * (1.0 - smoothstep(0.0, band, gap));`
  - `ASCIIText.jsx:112` `float randomGlyph = 1.0 + floor(hash(cell * 1.7 + tick * 0.37) * (uGlyphCount - 1.0));`
  - `ASCIIText.jsx:115` `float scramble = uHover * uScramble * (1.0 - smoothstep(reach * 0.35, reach, distance(center, uPointer)));`
  - `ASCIIText.jsx:125` `vec3 tint = mix(mix(uColors[0], uColors[1], smoothstep(0.0, 0.5, spread)), uColors[2], smoothstep(0.5, 1.0, spread));`
  - `ASCIIText.jsx:368` `const dpr = Math.min(window.devicePixelRatio || 1, 2);`
  - `ASCIIText.jsx:381` `const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));`
  - `ASCIIText.jsx:383` `state.time += reduce ? 0 : dt;`
  - `ASCIIText.jsx:395` `const follow = 1 - Math.exp(-dt / 0.3);`
  - `ASCIIText.jsx:402` `state.hue += delta * (1 - Math.exp(-dt / 0.25));`
  - `ASCIIText.jsx:403` `state.hover += ((s.interactive && state.inside ? 1 : 0) - state.hover) * (1 - Math.exp(-dt / 0.2));`
  - `ASCIIText.jsx:404` `if (state.intro > 0) state.intro = Math.max(0, state.intro - dt / 1.4);`
  - `ASCIIText.jsx:407` `state.ripples = state.ripples.filter(ripple => (ripple.age += dt) < 1.3);`
- 指针/滚动: pointermove, pointerdown, pointerleave.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 有 rAF, 并且有 cancel; IntersectionObserver; 读 devicePixelRatio; ResizeObserver.
- 减弱动效: 有. `249` const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
- Props: `text='Hey!'` (195), `asciiFontSize=8` (196), `charset=CHARSET` (197), `fontFamily=FONT` (198), `fontWeight=600` (199), `textColor='#fdf9f3'` (200), `colors=['#ff6188'` (201), `textScale=1` (202), `blocks=0.9` (203), `waves=1` (204), `waveSpeed=1` (205), `chroma=1` (206), `tilt=1` (207), `hueShift=1` (208), `scramble=0.6` (209), `clickRipple=true` (210), `intro=true` (211), `idle=true` (212), `interactive=true` (213), `theme='dark'` (214), `className=''` (215), `style` (216)
- 裁决: 不做. 全屏场和控件状态机无关, 首页最多留一个主角效果, 不进默认包.

### TextAnimations/BlurText

- 文件: `TextAnimations/BlurText/BlurText.jsx` 397 行. 目录内实现已逐行扫描.
- 看起来: motion 的 spring 或 animate. 命名常数 AXES, EASE_OUT, EASE_IN_OUT, EASE_IN, CSS_EASE, MOVE_KEYS.
- 技法: DOM + motion.
- 常数:
  - `BlurText.jsx:16` `const CSS_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';`
  - `BlurText.jsx:18` `const INSTANT = { duration: 0 };`
  - `BlurText.jsx:146` `if (staggerFrom === 'end') return ranks.map(i => count - 1 - i);`
  - `BlurText.jsx:176` `delay = 200,`
  - `BlurText.jsx:180` `threshold = 0.1,`
  - `BlurText.jsx:223` `const stagger = Math.max(0, delay) / 1000;`
  - `BlurText.jsx:225` `const exitStagger = stagger * 0.4;`
  - `BlurText.jsx:251` `const inTotal = (totalDuration * (custom ? 1 : Math.max(1, fx.settle * 2.2)) + maxRank * stagger) * 1000;`
  - `BlurText.jsx:340` `? 'color ${totalDuration * 0.9}s ${CSS_EASE} ${rank * stagger}s'`
- 指针/滚动: 无指针监听.
- 可中断: 时间轴或 CSS, 不可中途保留速度.
- 性能: IntersectionObserver.
- 减弱动效: 无. 源码没有 prefers-reduced-motion 或 useReducedMotion.
- Props: `text=''` (175), `delay=200` (176), `className=''` (177), `animateBy='words'` (178), `direction='top'` (179), `threshold=0.1` (180), `rootMargin='0px'` (181), `animationFrom` (182), `animationTo` (183), `easing` (184), `onAnimationComplete` (185), `stepDuration=0.35` (186), `blur=10` (187), `distance=50` (188), `effect='blur'` (189), `staggerFrom='start'` (190), `trigger='view'` (191), `loop=false` (192), `loopDelay=2` (193), `color` (194), `fromColor` (195), `focusOnHover=false` (196)
- 裁决: 采用. 运动层拿走它的积分, 错峰上限或测量指示器, 不拿走演示皮肤.

### TextAnimations/CircularText

- 文件: `TextAnimations/CircularText/CircularText.css` 50 行, `TextAnimations/CircularText/CircularText.jsx` 287 行. 目录内实现已逐行扫描.
- 看起来: motion 的 spring 或 animate. 自己做 force, velocity, dt 积分. 命名常数 HOVER_SPEED, MAX_FLING.
- 技法: DOM + motion + 自写积分.
- 常数:
  - `CircularText.css:21` `transition: transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);`
  - `CircularText.css:32` `transition: transform 0.5s cubic-bezier(0, 0, 0, 1);`
  - `CircularText.css:41` `transition: opacity 0.4s ease;`
  - `CircularText.jsx:8` `const HOVER_SPEED = { slowDown: 0.5, speedUp: 4, pause: 0, goBonkers: 20 };`
  - `CircularText.jsx:9` `const MAX_FLING = 1440;`
  - `CircularText.jsx:52` `const speed = useSpring(1, { stiffness: 60, damping: 18 });`
  - `CircularText.jsx:53` `const scale = useSpring(1, { stiffness: 300, damping: 20 });`
  - `CircularText.jsx:54` `const tiltX = useSpring(0, { stiffness: 150, damping: 18 });`
  - `CircularText.jsx:55` `const tiltY = useSpring(0, { stiffness: 150, damping: 18 });`
  - `CircularText.jsx:116` `const dt = Math.min(delta, 100) / 1000;`
  - `CircularText.jsx:117` `state.fling *= Math.exp(-dt / 0.7);`
  - `CircularText.jsx:120` `if (velocity) rotation.set((rotation.get() + velocity * dt) % 360);`
- 指针/滚动: 无指针监听.
- 可中断: 弹簧保留速度, 每帧重算目标.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver.
- 减弱动效: 有. `4` import { cancelFrame, frame, motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
- Props: `text` (16), `spinDuration=20` (17), `onHover='speedUp'` (18), `direction='clockwise'` (19), `size=200` (20), `fontSize=24` (21), `fontWeight=900` (22), `letterSpacing=0` (23), `color=''` (24), `startAngle=0` (25), `fill=true` (26), `repeat=1` (27), `ring=false` (28), `ringColor=''` (29), `tilt=0` (30), `hoverTilt=0` (31), `draggable=false` (32), `children` (33), `className=''` (34)
- 裁决: 借鉴. 只留错峰公式, 模糊中点和按位停格, 不把解密或扫光当正文.

### TextAnimations/CountUp

- 文件: `TextAnimations/CountUp/CountUp.jsx` 449 行. 目录内实现已逐行扫描.
- 看起来: motion 的 spring 或 animate. 命名常数 CELL, STAGGER, UNITS, SLOT_STYLE, SR_ONLY, EASINGS.
- 技法: SVG + motion.
- 常数:
  - `CountUp.jsx:6` `const CELL = 1.2;`
  - `CountUp.jsx:7` `const STAGGER = 0.07;`
  - `CountUp.jsx:37` `const log = Math.log(Math.min(0.5, Math.max(0.001, overshoot)));`
  - `CountUp.jsx:51` `spring: makeSpring(0.06)`
  - `CountUp.jsx:131` `delay = 0,`
  - `CountUp.jsx:132` `duration = 2,`
  - `CountUp.jsx:192` `duration: Math.max(0, duration),`
  - `CountUp.jsx:228` `const stagger = layout.length > 1 ? Math.min(STAGGER, (total * 0.4) / (layout.length - 1)) : 0;`
  - `CountUp.jsx:229` `const span = Math.max(0.001, total - stagger * (layout.length - 1));`
  - `CountUp.jsx:263` `const u = clamp01((t - index * stagger) / span);`
  - `CountUp.jsx:277` `u1 > u0 ? (Math.abs(column.delta) * Math.abs(column.ease(u1) - column.ease(u0))) / (u1 - u0) / span : 0;`
  - `CountUp.jsx:334` `delay: play.wait ? live.delay : 0,`
- 指针/滚动: 无指针监听.
- 可中断: 时间轴或 CSS, 不可中途保留速度.
- 性能: 无自管循环. 交给 CSS 或库..
- 减弱动效: 有. `327` if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
- Props: `to` (128), `from=0` (129), `direction='up'` (130), `delay=0` (131), `duration=2` (132), `className=''` (133), `style` (134), `startWhen=true` (135), `separator=''` (136), `prefix=''` (137), `suffix=''` (138), `mode='count'` (139), `easing='easeOut'` (140), `decimals` (141), `format='standard'` (142), `trigger='view'` (143), `replayOnHover=false` (144), `onStart` (145), `onEnd` (146)
- 裁决: 采用. 运动层拿走它的积分, 错峰上限或测量指示器, 不拿走演示皮肤.

### TextAnimations/CurvedLoop

- 文件: `TextAnimations/CurvedLoop/CurvedLoop.css` 20 行, `TextAnimations/CurvedLoop/CurvedLoop.jsx` 411 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 VIEW_WIDTH, VIEW_HEIGHT, MAX_FLING, WAVE_LENGTH, RING_RADIUS, TAU.
- 技法: SVG + rAF.
- 常数:
  - `CurvedLoop.jsx:6` `const VIEW_WIDTH = 1440;`
  - `CurvedLoop.jsx:7` `const VIEW_HEIGHT = 120;`
  - `CurvedLoop.jsx:8` `const MAX_FLING = 4000;`
  - `CurvedLoop.jsx:9` `const WAVE_LENGTH = 960;`
  - `CurvedLoop.jsx:10` `const RING_RADIUS = 2.2;`
  - `CurvedLoop.jsx:217` `const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;`
  - `CurvedLoop.jsx:220` `const rate = dt > 0 ? scroll.distance / dt : 0;`
  - `CurvedLoop.jsx:222` `scroll.level += (rate - scroll.level) * (1 - Math.exp(-dt * (rate > scroll.level ? 10 : 2.4)));`
  - `CurvedLoop.jsx:229` `velocityRef.current += (target - velocityRef.current) * (1 - Math.exp(-dt * 3));`
  - `CurvedLoop.jsx:230` `const step = (velocityRef.current + extra) * dt;`
  - `CurvedLoop.jsx:292` `const dt = Math.max(now - drag.time, 1) / 1000;`
  - `CurvedLoop.jsx:295` `drag.velocity = drag.velocity * 0.5 + (delta / dt) * 0.5;`
- 指针/滚动: scroll.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; ResizeObserver.
- 减弱动效: 有. `209` const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
- Props: `marqueeText=''` (74), `speed=2` (75), `className` (76), `curveAmount=400` (77), `direction='left'` (78), `interactive=true` (79), `pauseOnHover=false` (80), `color='currentColor'` (81), `edgeFade=0` (82), `shape='arc'` (83), `fontSize=96` (84), `fontWeight=700` (85), `letterSpacing=0` (86), `outline=false` (87), `separator=''` (88), `separatorColor` (89), `scrollBoost=0` (90)
- 裁决: 借鉴. 减弱动效和可中断是真的, 只取这条状态机, 不取视觉主题.

### TextAnimations/DecryptedText

- 文件: `TextAnimations/DecryptedText/DecryptedText.jsx` 594 行. 目录内实现已逐行扫描.
- 看起来: motion 的 spring 或 animate. 2d 画布逐帧画. 命名常数 FADE_FLOOR, FADE_PEAK, FADE_LEAD, SETTLE.
- 技法: canvas2d + motion.
- 常数:
  - `DecryptedText.jsx:40` `const FADE_FLOOR = 0.16;`
  - `DecryptedText.jsx:41` `const FADE_PEAK = 0.62;`
  - `DecryptedText.jsx:42` `const FADE_LEAD = 6;`
  - `DecryptedText.jsx:43` `const SETTLE = 'color 0.7s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1)';`
  - `DecryptedText.jsx:438` `{ threshold: 0.1 }`
  - `DecryptedText.jsx:456` `duration: Math.min(step * 0.92, 240),`
  - `DecryptedText.jsx:457` `easing: 'cubic-bezier(0.3, 0.7, 0.4, 1)'`
  - `DecryptedText.jsx:461` `duration: Math.min(Math.max(step * 7, 360), 760),`
  - `DecryptedText.jsx:462` `easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)'`
- 指针/滚动: 无指针监听.
- 可中断: GSAP 时间轴可 reverse 或 kill, 改 props 通常拆掉重建.
- 性能: IntersectionObserver; ResizeObserver.
- 减弱动效: 有. `50` typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
- Props: `text` (86), `speed=50` (87), `maxIterations=10` (88), `sequential=false` (89), `revealDirection='start'` (90), `useOriginalCharsOnly=false` (91), `characters='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+'` (92), `className=''` (93), `parentClassName=''` (94), `encryptedClassName=''` (95), `animateOn='hover'` (96), `clickMode='once'` (97), `effect='scramble'` (98), `scrambleColor=''` (99), `loop=false` (100), `loopDelay=2000` (101), `hoverRadius=0` (102)
- 裁决: 借鉴. 只留错峰公式, 模糊中点和按位停格, 不把解密或扫光当正文.

### TextAnimations/DepthText

- 文件: `TextAnimations/DepthText/DepthText.css` 67 行, `TextAnimations/DepthText/DepthText.jsx` 357 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 MAX_LAYERS, INTRO_MS, PUSH_STIFFNESS, PUSH_DAMPING, PRESS_EXTRA, FLOAT_EASE.
- 技法: DOM + rAF.
- 常数:
  - `DepthText.jsx:6` `const MAX_LAYERS = 64;`
  - `DepthText.jsx:7` `const INTRO_MS = 1200;`
  - `DepthText.jsx:8` `const PUSH_STIFFNESS = 260;`
  - `DepthText.jsx:9` `const PUSH_DAMPING = 17;`
  - `DepthText.jsx:10` `const PRESS_EXTRA = 0.25;`
  - `DepthText.jsx:11` `const FLOAT_EASE = 0.7;`
- 指针/滚动: pointermove, pointerout, blur, pointerenter, pointerleave, pointerdown, pointerup, pointercancel.
- 可中断: pointercancel 有监听.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; ResizeObserver.
- 减弱动效: 有. `63` @media (prefers-reduced-motion: reduce) {
- Props: `text='Elevate'` (41), `layers=34` (42), `depth=2.4` (43), `faceColor='currentColor'` (44), `depthColor='#7c3aed'` (45), `gradientDepth=false` (46), `tilt=7.5` (47), `pointerTracking=true` (48), `smoothing=0.14` (49), `perspective=900` (50), `autoOrbit=true` (51), `orbitSpeed=0.35` (52), `hoverPush=0` (53), `float=false` (54), `fontSize='clamp(3rem` (55), `fontWeight=900` (56), `shadow=true` (57), `outline=false` (58), `intro=true` (59), `className=''` (60), `style={}` (61)
- 裁决: 借鉴. 减弱动效和可中断是真的, 只取这条状态机, 不取视觉主题.

### TextAnimations/EchoText

- 文件: `TextAnimations/EchoText/EchoText.css` 52 行, `TextAnimations/EchoText/EchoText.jsx` 445 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 DRIFT_PERIOD, DRIFT_IDLE, BURST_LIFE, BURST_GAP.
- 技法: DOM + rAF.
- 常数:
  - `EchoText.jsx:21` `'ease-out': t => 1 - Math.pow(1 - t, 3),`
  - `EchoText.jsx:22` `'ease-in-out': t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),`
  - `EchoText.jsx:26` `const DRIFT_PERIOD = 7200;`
  - `EchoText.jsx:27` `const DRIFT_IDLE = 2600;`
  - `EchoText.jsx:28` `const BURST_LIFE = 1100;`
  - `EchoText.jsx:29` `const BURST_GAP = 80;`
  - `EchoText.jsx:50` `duration = 900,`
  - `EchoText.jsx:99` `const safeDuration = Math.max(0, Number(duration) || 0);`
  - `EchoText.jsx:170` `const dt = state.lastTime ? clamp(now - state.lastTime, 0, 64) : 16.67;`
  - `EchoText.jsx:171` `const step = dt / 16.67;`
  - `EchoText.jsx:185` `state.phase += (dt / DRIFT_PERIOD) * Math.PI * 2;`
- 指针/滚动: pointermove, pointerout, scroll, click.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver.
- 减弱动效: 有. `44` @media (prefers-reduced-motion: reduce) {
- Props: `text='Motion Echo'` (35), `echoes=12` (36), `lag=0.24` (37), `offset=36` (38), `direction='right'` (39), `fade=0.72` (40), `blur=3` (41), `tint='#7dd3fc'` (42), `echoColors` (43), `echoStyle='solid'` (44), `echoScale=1` (45), `mode='both'` (46), `trail='pointer'` (47), `clickBurst=true` (48), `cursorRadius=320` (49), `duration=900` (50), `ease='ease-out'` (51), `fontSize='clamp(3rem` (52), `fontWeight=800` (53), `color='currentColor'` (54), `className=''` (55), `style` (56)
- 裁决: 借鉴. 减弱动效和可中断是真的, 只取这条状态机, 不取视觉主题.

### TextAnimations/FallingText

- 文件: `TextAnimations/FallingText/FallingText.css` 83 行, `TextAnimations/FallingText/FallingText.jsx` 564 行. 目录内实现已逐行扫描.
- 看起来: 自己做 force, velocity, dt 积分. 命名常数 THEMES, STEP, WALL, SPRING.
- 技法: DOM + matter-js + 自写积分.
- 常数:
  - `FallingText.jsx:25` `const STEP = 1000 / 120;`
  - `FallingText.jsx:26` `const WALL = 400;`
  - `FallingText.jsx:48` `: 'cubic-bezier(0.34, 1.4, 0.64, 1)';`
  - `FallingText.jsx:60` `stagger = 0.03,`
  - `FallingText.jsx:166` `const dt = Math.min(0.05, last ? (now - last) / 1000 : 1 / 60);`
  - `FallingText.jsx:179` `accumulator += dt * 1000;`
  - `FallingText.jsx:278` `at: s.order === 'together' ? 0 : rank * Math.max(0, s.stagger),`
  - `FallingText.jsx:323` `duration: 760,`
  - `FallingText.jsx:324` `delay: Math.min(index * 14, 360),`
  - `FallingText.jsx:389` `stiffness: clamp(s.mouseConstraintStiffness, 0.01, 1),`
  - `FallingText.jsx:390` `damping: 0.08,`
  - `FallingText.jsx:402` `const dt = Math.max(1, now - pointer.time);`
  - `FallingText.jsx:403` `if (pointer.time && dt < 120) {`
  - `FallingText.jsx:404` `const blend = Math.min(1, dt / 40);`
  - `FallingText.jsx:470` `{ threshold: [0, 0.3] }`
- 指针/滚动: pointerenter, pointerleave, click, pointerdown, pointermove, pointerup, pointercancel.
- 可中断: pointercancel 有监听. 弹簧保留速度, 每帧重算目标.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; ResizeObserver.
- 减弱动效: 有. `104` const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
- Props: `text=''` (51), `highlightWords=[]` (52), `highlightClass='highlighted'` (53), `trigger='auto'` (54), `variant='text'` (55), `split='words'` (56), `gravity=1` (57), `bounciness=0.2` (58), `scatter=0.5` (59), `stagger=0.03` (60), `order='random'` (61), `draggable=true` (62), `mouseConstraintStiffness=0.2` (63), `cursorPush=0.5` (64), `restoreDelay=0` (65), `fontSize='1rem'` (66), `accentColor='#5b8cff'` (67), `theme='dark'` (68), `backgroundColor='transparent'` (69), `wireframes=false` (70), `className=''` (71), `style` (72)
- 裁决: 借鉴. 减弱动效和可中断是真的, 只取这条状态机, 不取视觉主题.

### TextAnimations/FoldText

- 文件: `TextAnimations/FoldText/FoldText.css` 117 行, `TextAnimations/FoldText/FoldText.jsx` 349 行. 目录内实现已逐行扫描.
- 看起来: GSAP 时间轴驱动进入或离开. 命名常数 HINGES, SLATS, FOLD_STYLES, SLAT_DELAY.
- 技法: DOM + gsap.
- 常数:
  - `FoldText.jsx:32` `const SLAT_DELAY = 0.24;`
  - `FoldText.jsx:41` `duration = 0.65,`
  - `FoldText.jsx:42` `stagger = 0.045,`
  - `FoldText.jsx:45` `ease = 'power3.out',`
  - `FoldText.jsx:65` `const safeStagger = Math.max(0, stagger);`
  - `FoldText.jsx:136` `const unfoldEase = gsap.parseEase(reduceMotion ? 'power1.out' : ease) || gsap.parseEase('power3.out');`
  - `FoldText.jsx:142` `const unfoldDuration = reduceMotion ? Math.min(duration, 0.22) : duration;`
  - `FoldText.jsx:143` `const staggerVars = { each: reduceMotion ? Math.min(safeStagger, 0.02) : safeStagger, from: staggerFrom };`
  - `FoldText.jsx:198` `timeline.fromTo(pieces, { t: 0, f: 0 }, { t: 1, duration: unfoldDuration, ease: 'none', stagger: staggerVars });`
  - `FoldText.jsx:202` `{ f: 1, duration: unfoldDuration * 0.75, ease: 'none', stagger: staggerVars },`
- 指针/滚动: mouseenter, pointermove, scroll, pointerleave.
- 可中断: GSAP 时间轴可 reverse 或 kill, 改 props 通常拆掉重建. 时间轴, 不保留指针速度.
- 性能: 无自管循环. 交给 CSS 或库..
- 减弱动效: 有. `107` @media (prefers-reduced-motion: reduce) {
- Props: `text='Design unfolds'` (37), `splitBy='char'` (38), `hinge='top'` (39), `foldStyle='paper'` (40), `duration=0.65` (41), `stagger=0.045` (42), `staggerFrom='start'` (43), `foldAngle=92` (44), `ease='power3.out'` (45), `perspective=700` (46), `creaseShading=0.55` (47), `trigger='mount'` (48), `loopDelay=1.4` (49), `hoverRefold=false` (50), `refoldRadius=140` (51), `refoldAngle=45` (52), `fontSize=80` (53), `fontWeight=800` (54), `color='currentColor'` (55), `className=''` (56), `style={}` (57)
- 裁决: 借鉴. 只留错峰公式, 模糊中点和按位停格, 不把解密或扫光当正文.

### TextAnimations/FuzzyText

- 文件: `TextAnimations/FuzzyText/FuzzyText.jsx` 508 行. 目录内实现已逐行扫描.
- 看起来: 2d 画布逐帧画. 命名常数 INTRO_PEAK, BURST_ATTACK, BURST_DECAY.
- 技法: canvas2d + rAF.
- 常数:
  - `FuzzyText.jsx:5` `const INTRO_PEAK = 2;`
  - `FuzzyText.jsx:6` `const BURST_ATTACK = 70;`
  - `FuzzyText.jsx:7` `const BURST_DECAY = 240;`
  - `FuzzyText.jsx:174` `const pixelRatio = () => Math.min(window.devicePixelRatio || 1, 2);`
- 指针/滚动: pointermove, pointerdown, pointerup, pointerleave, pointercancel, click, resize.
- 可中断: pointercancel 有监听.
- 性能: 有 rAF, 并且有 cancel; IntersectionObserver; 读 devicePixelRatio.
- 减弱动效: 有. `107` if (!glitchMode || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
- Props: `children` (33), `fontSize='clamp(2rem` (34), `fontWeight=900` (35), `fontFamily='inherit'` (36), `color='currentColor'` (37), `enableHover=true` (38), `baseIntensity=0.18` (39), `hoverIntensity=0.5` (40), `fuzzRange=30` (41), `fps=60` (42), `direction='horizontal'` (43), `transitionDuration=0` (44), `clickEffect=false` (45), `glitchMode=false` (46), `glitchInterval=2000` (47), `glitchDuration=200` (48), `gradient=null` (49), `letterSpacing=0` (50), `sliceSize=1` (51), `trigger='hover'` (52), `intro=false` (53), `introDuration=1400` (54), `colorSplit=0` (55), `className=''` (56)
- 裁决: 借鉴. 减弱动效和可中断是真的, 只取这条状态机, 不取视觉主题.

### TextAnimations/GlitchText

- 文件: `TextAnimations/GlitchText/GlitchText.css` 115 行, `TextAnimations/GlitchText/GlitchText.jsx` 369 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 MODES, GLYPHS, SLICE_STOPS.
- 技法: DOM + rAF.
- 常数:
  - `GlitchText.jsx:195` `const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;`
- 指针/滚动: pointerenter, pointerleave, click.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver.
- 减弱动效: 有. `107` const reduce = Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
- Props: `children` (75), `speed=0.5` (76), `enableShadows=true` (77), `enableOnHover=false` (78), `offset=10` (79), `shadowColors=['#ff0000'` (80), `className=''` (81), `mode='slices'` (82), `intensity=0.5` (83), `skew=0` (84), `flicker=false` (85), `trigger='always'` (86), `burstDuration=0.6` (87), `color` (88), `fontSize` (89), `fontWeight` (90)
- 裁决: 借鉴. 只留错峰公式, 模糊中点和按位停格, 不把解密或扫光当正文.

### TextAnimations/GradientText

- 文件: `TextAnimations/GradientText/GradientText.css` 57 行, `TextAnimations/GradientText/GradientText.jsx` 200 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 VARIANTS, ANGLES, TAU.
- 技法: DOM + rAF.
- 常数:
  - `GradientText.jsx:8` `const ANGLES = { horizontal: 90, vertical: 180, diagonal: 135 };`
  - `GradientText.jsx:105` `const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));`
  - `GradientText.jsx:110` `state.pull += (target - state.pull) * (1 - Math.exp(-dt * 6));`
  - `GradientText.jsx:111` `const stiffness = 160;`
  - `GradientText.jsx:112` `state.vx += ((state.x - state.px) * stiffness - state.vx * 2 * Math.sqrt(stiffness)) * dt;`
  - `GradientText.jsx:113` `state.vy += ((state.y - state.py) * stiffness - state.vy * 2 * Math.sqrt(stiffness)) * dt;`
- 指针/滚动: pointerenter, pointermove, pointerleave.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver.
- 减弱动效: 有. `54` const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
- Props: `children` (14), `colors=['#5227FF'` (15), `animationSpeed=8` (16), `variant='linear'` (17), `angle=90` (18), `direction` (19), `scale=3` (20), `yoyo=true` (21), `glow=0` (22), `showBorder=false` (23), `borderWidth=1.5` (24), `pauseOnHover=false` (25), `followPointer=false` (26), `className=''` (27), `style` (28)
- 裁决: 借鉴. 只留错峰公式, 模糊中点和按位停格, 不把解密或扫光当正文.

### TextAnimations/MaskedHeading

- 文件: `TextAnimations/MaskedHeading/MaskedHeading.css` 100 行, `TextAnimations/MaskedHeading/MaskedHeading.jsx` 616 行. 目录内实现已逐行扫描.
- 看起来: GSAP 时间轴驱动进入或离开. 命名常数 SPOT_MASK.
- 技法: SVG + gsap.
- 常数:
  - `MaskedHeading.jsx:41` `duration = 1.1,`
  - `MaskedHeading.jsx:42` `stagger = 0.09,`
  - `MaskedHeading.jsx:231` `const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;`
  - `MaskedHeading.jsx:244` `const ease = 1 - Math.exp(-dt / 0.18);`
  - `MaskedHeading.jsx:247` `off.zoom += ((hovering ? s.hoverZoom : 0) - off.zoom) * (1 - Math.exp(-dt / 0.35));`
  - `MaskedHeading.jsx:267` `const follow = 1 - Math.exp(-dt / (hovering ? 0.12 : 0.6));`
  - `MaskedHeading.jsx:358` `const letterDelay = i => i * stagger * 0.35;`
  - `MaskedHeading.jsx:415` `{ y: 0, duration, stagger: wordDelay, ease: 'power4.out', overwrite: 'auto', onUpdate: renderGlyphs }`
  - `MaskedHeading.jsx:423` `{ y: 0, s: 1, duration, stagger: letterDelay, ease: 'expo.out', overwrite: 'auto', onUpdate: renderGlyphs }`
  - `MaskedHeading.jsx:432` `timeline.fromTo(states, { x: 0.22, y: 0, s: 1 }, { x: 0, duration: duration * 1.2, ease: 'expo.out' }, 0);`
  - `MaskedHeading.jsx:438` `duration: duration * 1.2,`
  - `MaskedHeading.jsx:439` `ease: 'power2.out',`
  - `MaskedHeading.jsx:456` `ease: 'power3.inOut',`
  - `MaskedHeading.jsx:467` `{ opacity: 1, scale: 1, duration, ease: 'power3.out', overwrite: 'auto' }`
  - `MaskedHeading.jsx:491` `{ threshold: 0.25 }`
- 指针/滚动: pointermove, pointerenter, pointerleave.
- 可中断: GSAP 时间轴可 reverse 或 kill, 改 props 通常拆掉重建. 时间轴, 不保留指针速度.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; ResizeObserver.
- 减弱动效: 有. `221` const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
- Props: `text='Designed in the details'` (22), `tag='h2'` (23), `mediaType='image'` (24), `src=''` (25), `poster=''` (26), `fillScale=1.25` (27), `parallax=26` (28), `drift=18` (29), `hoverZoom=0` (30), `brightness=1` (31), `saturation=1` (32), `grayscale=false` (33), `tint=''` (34), `spotlight=false` (35), `spotlightRadius=160` (36), `outline=false` (37), `outlineColor=''` (38), `outlineWidth=1` (39), `reveal='rise'` (40), `duration=1.1` (41), `stagger=0.09` (42), `trigger='view'` (43), `align='center'` (44), `weight=700` (45)
- 裁决: 借鉴. 只留错峰公式, 模糊中点和按位停格, 不把解密或扫光当正文.

### TextAnimations/ParticleText

- 文件: `TextAnimations/ParticleText/ParticleText.css` 30 行, `TextAnimations/ParticleText/ParticleText.jsx` 799 行. 目录内实现已逐行扫描.
- 看起来: 自己做 force, velocity, dt 积分. 2d 画布逐帧画. 命名常数 INHERIT, TONES, FADES, HEAT_RANGE, HEAT_DEADZONE, TAU.
- 技法: canvas2d + 自写积分.
- 常数:
  - `ParticleText.jsx:7` `const TONES = 12;`
  - `ParticleText.jsx:8` `const FADES = 8;`
  - `ParticleText.jsx:9` `const HEAT_RANGE = 36;`
  - `ParticleText.jsx:10` `const HEAT_DEADZONE = 3;`
  - `ParticleText.jsx:12` `const REST_ANGLE = -Math.PI / 4;`
  - `ParticleText.jsx:13` `const BURST_SPRING = 18;`
  - `ParticleText.jsx:14` `const BURST_DAMPING = 7.5;`
  - `ParticleText.jsx:16` `const FADE_FLOOR = { gather: 0, rain: 0.55, spiral: 0.45, scan: 0.35 };`
  - `ParticleText.jsx:63` `stagger = 420,`
  - `ParticleText.jsx:147` `const scan = { from: 0, to: 0, top: 0, bottom: 0, duration: 1 };`
  - `ParticleText.jsx:158` `return '${Math.floor(rect.width)}x${Math.floor(rect.height)}@${Math.min(window.devicePixelRatio || 1, 2)}';`
  - `ParticleText.jsx:210` `scan.duration = Math.max(200, s.gatherDuration * 0.8);`
  - `ParticleText.jsx:231` `delay = particle.seed * s.stagger * 1.3;`
  - `ParticleText.jsx:243` `delay = along * scan.duration + particle.seed * s.stagger * 0.15;`
  - `ParticleText.jsx:253` `particle.delay = reducedMotion ? 0 : delay;`
  - `ParticleText.jsx:339` `const dt = last ? Math.min(0.05, Math.max(0, (now - last) / 1000)) : 1 / 60;`
  - `ParticleText.jsx:343` `const frames = Math.max(dt * 60, 0.001);`
  - `ParticleText.jsx:371` `const local = (now - gatherStart - particle.delay) / Math.max(1, travelTime(s, particle));`
  - `ParticleText.jsx:416` `const force = Math.pow(1 - distance / s.repelRadius, 2) * s.pointerRepel;`
  - `ParticleText.jsx:417` `baseX += (dx / distance) * force;`
  - `ParticleText.jsx:418` `baseY += (dy / distance) * force;`
  - `ParticleText.jsx:546` `const nextDpr = Math.min(window.devicePixelRatio || 1, 2);`
  - `ParticleText.jsx:650` `delay: 0,`
- 指针/滚动: pointerenter, pointermove, pointerleave, pointerdown, click.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; 读 devicePixelRatio; ResizeObserver.
- 减弱动效: 有. `121` const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
- Props: `text='React Bits'` (53), `particleSize=2` (54), `density=4` (55), `color='currentColor'` (56), `highlightColor='#ff5a36'` (57), `highlightMode='motion'` (58), `shape='circle'` (59), `intro='gather'` (60), `scatter=180` (61), `gatherDuration=1600` (62), `stagger=420` (63), `clickBurst=true` (64), `burstStrength=1` (65), `pointerRepel=40` (66), `repelRadius=120` (67), `idleDrift=0.7` (68), `trigger='mount'` (69), `fontSize='clamp(3rem` (70), `fontWeight=800` (71), `fontFamily='inherit'` (72), `glow=true` (73), `className=''` (74), `style` (75)
- 裁决: 借鉴. 只留错峰公式, 模糊中点和按位停格, 不把解密或扫光当正文.

### TextAnimations/RotatingText

- 文件: `TextAnimations/RotatingText/RotatingText.css` 51 行, `TextAnimations/RotatingText/RotatingText.jsx` 338 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 LAYOUT_SPRING, WIDTH_SPRING, FLIP_STYLE, EFFECTS.
- 技法: DOM.
- 常数:
  - `RotatingText.jsx:39` `const LAYOUT_SPRING = { type: 'spring', damping: 25, stiffness: 300 };`
  - `RotatingText.jsx:40` `const WIDTH_SPRING = { type: 'spring', damping: 34, stiffness: 320 };`
  - `RotatingText.jsx:41` `const FLIP_STYLE = { transformOrigin: '50% 50% -0.45em', backfaceVisibility: 'hidden' };`
  - `RotatingText.jsx:48` `transition: { type: 'spring', damping: 25, stiffness: 300 }`
  - `RotatingText.jsx:54` `transition: { type: 'tween', duration: 0.6, ease: [0.34, 1.4, 0.64, 1] },`
  - `RotatingText.jsx:55` `exitTransition: { type: 'tween', duration: 0.32, ease: [0.5, 0, 0.75, 0] }`
  - `RotatingText.jsx:61` `transition: { type: 'tween', duration: 0.55, ease: [0.22, 1, 0.36, 1] }`
  - `RotatingText.jsx:67` `transition: { type: 'spring', damping: 17, stiffness: 240 }`
  - `RotatingText.jsx:73` `transition: { type: 'spring', damping: 18, stiffness: 320, mass: 0.9 },`
  - `RotatingText.jsx:74` `exitTransition: { type: 'tween', duration: 0.3, ease: [0.55, 0, 1, 0.45] }`
  - `RotatingText.jsx:111` `staggerDuration = 0,`
  - `RotatingText.jsx:178` `if (staggerFrom === 'last') return (total - 1 - index) * staggerDuration;`
  - `RotatingText.jsx:179` `if (staggerFrom === 'center') return Math.abs(Math.floor(total / 2) - index) * staggerDuration;`
- 指针/滚动: 无指针监听.
- 可中断: 时间轴或 CSS, 不可中途保留速度.
- 性能: 无自管循环. 交给 CSS 或库.; ResizeObserver.
- 减弱动效: 有. `19` useReducedMotion
- Props: 见源码解构, 没有带默认值的签名字段
- 裁决: 借鉴. 只留错峰公式, 模糊中点和按位停格, 不把解密或扫光当正文.

### TextAnimations/ScrambledText

- 文件: `TextAnimations/ScrambledText/ScrambledText.css` 18 行, `TextAnimations/ScrambledText/ScrambledText.jsx` 375 行. 目录内实现已逐行扫描.
- 看起来: GSAP 时间轴驱动进入或离开. 命名常数 PHYSICAL.
- 技法: DOM + gsap.
- 常数:
  - `ScrambledText.jsx:24` `duration = 1.2,`
  - `ScrambledText.jsx:191` `const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;`
  - `ScrambledText.jsx:200` `const follow = 1 - Math.exp(-dt / 0.06);`
  - `ScrambledText.jsx:201` `const attack = 1 - Math.exp(-dt / 0.08);`
  - `ScrambledText.jsx:202` `const release = 1 - Math.exp(-dt / Math.max(0.04, s.trail / 3));`
  - `ScrambledText.jsx:233` `gsap.to(glyphs[i], scramble(i, Math.max(0.2, s.duration * (0.2 + 0.5 * strengthAt))));`
  - `ScrambledText.jsx:278` `if (dist < radius) gsap.to(glyph, scramble(index, duration * (1 - dist / radius)));`
- 指针/滚动: pointerenter, pointermove, pointerleave, pointerdown.
- 可中断: GSAP 时间轴可 reverse 或 kill, 改 props 通常拆掉重建. 时间轴, 不保留指针速度.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; ResizeObserver.
- 减弱动效: 有. `85` const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
- Props: `radius=100` (23), `duration=1.2` (24), `speed=0.5` (25), `scrambleChars='.:'` (26), `scrambleColor=''` (27), `effect='scramble'` (28), `strength=1` (29), `trail=0.6` (30), `clickBurst=true` (31), `intro=true` (32), `fontFamily=''` (33), `color=''` (34), `className=''` (35), `style={}` (36), `children` (37)
- 裁决: 借鉴. 只留错峰公式, 模糊中点和按位停格, 不把解密或扫光当正文.

### TextAnimations/ScrollFloat

- 文件: `TextAnimations/ScrollFloat/ScrollFloat.css` 38 行, `TextAnimations/ScrollFloat/ScrollFloat.jsx` 257 行. 目录内实现已逐行扫描.
- 看起来: GSAP 时间轴驱动进入或离开.
- 技法: DOM + gsap.
- 常数:
  - `ScrollFloat.jsx:18` `const smoothstep = (from, to, value) => {`
  - `ScrollFloat.jsx:43` `return ranks.map(rank => (rank - first) * Math.max(0, stagger));`
  - `ScrollFloat.jsx:57` `ease = 'back.inOut(2)',`
  - `ScrollFloat.jsx:60` `stagger = 0.03,`
  - `ScrollFloat.jsx:149` `{ duration: animationDuration, stagger: index => delays[index] || 0, ...toVars },`
  - `ScrollFloat.jsx:162` `{ ease, rotationX: 0 }`
  - `ScrollFloat.jsx:164` `add({ opacity: 0 }, { ease: p => smoothstep(0.05, 0.55, timing(p)), opacity: 1 });`
  - `ScrollFloat.jsx:174` `{ ease, x: 0, y: 0, rotation: 0, scale: 1 }`
  - `ScrollFloat.jsx:176` `add({ opacity: 0 }, { ease: p => smoothstep(0, 0.4, timing(p)), opacity: 1 });`
  - `ScrollFloat.jsx:187` `{ ease, opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }`
  - `ScrollFloat.jsx:197` `{ ease: swell, yPercent: 0, scaleY: 1, scaleX: 1 }`
  - `ScrollFloat.jsx:199` `add({ rotation: 0 }, { ease: sway, rotation: -16 * sign });`
  - `ScrollFloat.jsx:200` `add({ opacity: 0 }, { ease: p => clamp01(timing(p) * 2.5), opacity: 1 });`
  - `ScrollFloat.jsx:210` `{ ease, opacity: 1, yPercent: 0, scaleY: 1, scaleX: 1 }`
  - `ScrollFloat.jsx:215` `add({ '--scroll-float-mix': 1 }, { ease: p => smoothstep(0.5, 1, timing(p)), '--scroll-float-mix': 0 });`
- 指针/滚动: 无指针监听.
- 可中断: 时间轴, 不保留指针速度.
- 性能: 无自管循环. 交给 CSS 或库..
- 减弱动效: 有. `133` mm.add('(prefers-reduced-motion: no-preference)', () => {
- Props: `children` (47), `scrollContainerRef` (48), `containerClassName=''` (49), `textClassName=''` (50), `effect='float'` (51), `splitBy='chars'` (52), `direction='up'` (53), `order='start'` (54), `fromColor='currentColor'` (55), `animationDuration=1` (56), `ease='back.inOut(2)'` (57), `scrollStart='center bottom+=50%'` (58), `scrollEnd='bottom bottom-=40%'` (59), `stagger=0.03` (60), `distance=120` (61), `stretch=2.3` (62), `smoothing=0` (63)
- 裁决: 借鉴. 只留错峰公式, 模糊中点和按位停格, 不把解密或扫光当正文.

### TextAnimations/ScrollReveal

- 文件: `TextAnimations/ScrollReveal/ScrollReveal.css` 15 行, `TextAnimations/ScrollReveal/ScrollReveal.jsx` 305 行. 目录内实现已逐行扫描.
- 看起来: GSAP 时间轴驱动进入或离开. 命名常数 SCRUB_SPAN, RISE_MASK.
- 技法: DOM + gsap.
- 常数:
  - `ScrollReveal.jsx:13` `const SCRUB_SPAN = 0.5;`
  - `ScrollReveal.jsx:14` `const RISE_MASK = 'inset(-1em -1em -0.15em -1em)';`
  - `ScrollReveal.jsx:24` `return 1 + (overshoot + 1) * shifted * shifted * shifted + overshoot * shifted * shifted;`
  - `ScrollReveal.jsx:70` `stagger = 0.05,`
  - `ScrollReveal.jsx:75` `duration = 0.8,`
  - `ScrollReveal.jsx:126` `const span = mode === 'enter' ? Math.max(0.05, duration) : SCRUB_SPAN;`
  - `ScrollReveal.jsx:127` `const gap = Math.max(0, stagger);`
  - `ScrollReveal.jsx:189` `gsap.to(state, { p: 1, duration: total(), ease: 'none', onUpdate: render });`
  - `ScrollReveal.jsx:190` `if (baseRotation) gsap.to(el, { rotate: 0, duration: Math.min(total(), 1.4), ease: 'power3.out' });`
- 指针/滚动: 无指针监听.
- 可中断: 时间轴, 不保留指针速度.
- 性能: 无自管循环. 交给 CSS 或库.; ResizeObserver.
- 减弱动效: 有. `138` mm.add('(prefers-reduced-motion: no-preference)', () => {
- Props: `children` (63), `scrollContainerRef` (64), `enableBlur=true` (65), `baseOpacity=0.1` (66), `baseRotation=3` (67), `blurStrength=4` (68), `baseOffset=0` (69), `stagger=0.05` (70), `smoothing=0` (71), `splitBy='words'` (72), `effect='fade'` (73), `mode='scrub'` (74), `duration=0.8` (75), `highlightColor=''` (76), `containerClassName=''` (77), `textClassName=''` (78), `rotationEnd='bottom bottom'` (79), `wordAnimationEnd='bottom bottom'` (80)
- 裁决: 借鉴. 只留错峰公式, 模糊中点和按位停格, 不把解密或扫光当正文.

### TextAnimations/ScrollVelocity

- 文件: `TextAnimations/ScrollVelocity/ScrollVelocity.css` 26 行, `TextAnimations/ScrollVelocity/ScrollVelocity.jsx` 322 行. 目录内实现已逐行扫描.
- 看起来: 自己做 force, velocity, dt 积分. 命名常数 FADE_STEPS, FADE_MASK, OUTLINE_STYLE.
- 技法: DOM + 自写积分.
- 常数:
  - `ScrollVelocity.jsx:150` `const ease = 1 - Math.exp(-delta / 110);`
  - `ScrollVelocity.jsx:152` `const nextScale = scaleY.get() + (1 + scaleWithVelocity * surge - scaleY.get()) * ease;`
  - `ScrollVelocity.jsx:175` `const dt = Math.max(event.timeStamp - grab.lastTime, 1);`
  - `ScrollVelocity.jsx:180` `grab.velocity += ((dx / dt) * 1000 - grab.velocity) * (1 - Math.exp(-dt / 50));`
  - `ScrollVelocity.jsx:257` `damping = 50,`
  - `ScrollVelocity.jsx:258` `stiffness = 400,`
- 指针/滚动: resize.
- 可中断: 弹簧保留速度, 每帧重算目标.
- 性能: 无自管循环. 交给 CSS 或库.; ResizeObserver.
- 减弱动效: 有. `8` useReducedMotion,
- Props: 见源码解构, 没有带默认值的签名字段
- 裁决: 借鉴. 只留错峰公式, 模糊中点和按位停格, 不把解密或扫光当正文.

### TextAnimations/ShinyText

- 文件: `TextAnimations/ShinyText/ShinyText.css` 21 行, `TextAnimations/ShinyText/ShinyText.jsx` 364 行. 目录内实现已逐行扫描.
- 看起来: 2d 画布逐帧画. 命名常数 EASINGS, TRIGGERS, FALLOFF.
- 技法: canvas2d + rAF.
- 常数:
  - `ShinyText.jsx:52` `delay = 0,`
  - `ShinyText.jsx:78` `delay: Math.max(0, delay),`
  - `ShinyText.jsx:109` `duration: 1,`
  - `ShinyText.jsx:188` `state.duration = s.speed * 1000 * Math.max(0.15, Math.abs(to - from) / span);`
  - `ShinyText.jsx:203` `const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));`
  - `ShinyText.jsx:214` `const stiffness = 220;`
  - `ShinyText.jsx:215` `state.vel += ((state.target - state.pos) * stiffness - state.vel * 2 * Math.sqrt(stiffness)) * dt;`
  - `ShinyText.jsx:228` `state.start += dt * 1000;`
  - `ShinyText.jsx:232` `const t = clamp((now - state.start) / state.duration, 0, 1);`
  - `ShinyText.jsx:246` `state.resume = now + s.delay * 1000;`
- 指针/滚动: pointerenter, pointermove, pointerleave.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver.
- 减弱动效: 有. `101` const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
- Props: `text` (47), `children` (48), `color='#b5b5b5'` (49), `shineColor='#ffffff'` (50), `speed=2` (51), `delay=0` (52), `angle=120` (53), `shineWidth=40` (54), `softness=0.8` (55), `bands=1` (56), `glow=0` (57), `direction='left'` (58), `easing='smooth'` (59), `trigger='loop'` (60), `yoyo=false` (61), `followPointer=false` (62), `pauseOnHover=false` (63), `disabled=false` (64), `className=''` (65), `style` (66)
- 裁决: 借鉴. 只留错峰公式, 模糊中点和按位停格, 不把解密或扫光当正文.

### TextAnimations/Shuffle

- 文件: `TextAnimations/Shuffle/Shuffle.css` 33 行, `TextAnimations/Shuffle/Shuffle.jsx` 623 行. 目录内实现已逐行扫描.
- 看起来: GSAP 时间轴驱动进入或离开. 2d 画布逐帧画. 命名常数 SVG_NS, BLUR_STEPS.
- 技法: canvas2d + gsap.
- 常数:
  - `Shuffle.jsx:12` `const SVG_NS = 'http://www.w3.org/2000/svg';`
  - `Shuffle.jsx:13` `const BLUR_STEPS = 12;`
  - `Shuffle.jsx:20` `duration = 0.35,`
  - `Shuffle.jsx:22` `ease = 'power3.out',`
  - `Shuffle.jsx:23` `threshold = 0.1,`
  - `Shuffle.jsx:32` `stagger = 0.03,`
  - `Shuffle.jsx:66` `const startPct = (1 - threshold) * 100;`
  - `Shuffle.jsx:141` `if (dt > 0) cell.speed = cell.speed * 0.35 + (Math.abs(value - cell.lastValue) / dt) * 0.65;`
  - `Shuffle.jsx:442` `const evenStart = oddCount ? (duration + Math.max(0, oddCount - 1) * stagger) * 0.7 : 0;`
  - `Shuffle.jsx:443` `return cells.map((_, i) => (i % 2 === 1 ? Math.floor(i / 2) * stagger : evenStart + (i / 2) * stagger));`
  - `Shuffle.jsx:483` `duration * (0.5 + 0.5 * strength)`
  - `Shuffle.jsx:485` `tl.delay((1 - strength) * 0.08);`
- 指针/滚动: pointermove, mouseenter.
- 可中断: GSAP 时间轴可 reverse 或 kill, 改 props 通常拆掉重建. 时间轴, 不保留指针速度.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel.
- 减弱动效: 有. `77` if (respectReducedMotion && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
- Props: `text` (16), `className=''` (17), `style={}` (18), `shuffleDirection='right'` (19), `duration=0.35` (20), `maxDelay=0` (21), `ease='power3.out'` (22), `threshold=0.1` (23), `rootMargin='-100px'` (24), `tag='p'` (25), `textAlign='center'` (26), `onShuffleComplete` (27), `shuffleTimes=1` (28), `animationMode='evenodd'` (29), `loop=false` (30), `loopDelay=0` (31), `stagger=0.03` (32), `scrambleCharset=''` (33), `colorFrom` (34), `colorTo` (35), `triggerOnce=true` (36), `respectReducedMotion=true` (37), `triggerOnHover=true` (38), `effect='slide'` (39)
- 裁决: 借鉴. 只留错峰公式, 模糊中点和按位停格, 不把解密或扫光当正文.

### TextAnimations/SplitFlapText

- 文件: `TextAnimations/SplitFlapText/SplitFlapText.css` 400 行, `TextAnimations/SplitFlapText/SplitFlapText.jsx` 410 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 DEFAULT_WORDS, CHARSETS.
- 技法: DOM + rAF.
- 常数:
  - `SplitFlapText.css:148` `animation: split-flap-front var(--split-flap-flip-duration, 0.12s) linear both;`
  - `SplitFlapText.css:155` `animation: split-flap-back var(--split-flap-flip-duration, 0.12s) linear both;`
  - `SplitFlapText.css:165` `animation: split-flap-shade-top var(--split-flap-flip-duration, 0.12s) linear both;`
  - `SplitFlapText.css:191` `animation: split-flap-glare-front var(--split-flap-flip-duration, 0.12s) linear both;`
  - `SplitFlapText.css:226` `animation: split-flap-reveal var(--split-flap-flip-duration, 0.12s) linear both;`
  - `SplitFlapText.css:230` `animation: split-flap-cover var(--split-flap-flip-duration, 0.12s) linear both;`
  - `SplitFlapText.css:237` `animation-timing-function: cubic-bezier(0.55, 0.055, 0.675, 0.19);`
  - `SplitFlapText.css:252` `animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);`
  - `SplitFlapText.css:276` `animation-timing-function: cubic-bezier(0.55, 0.055, 0.675, 0.19);`
  - `SplitFlapText.jsx:96` `stagger = 0.06,`
  - `SplitFlapText.jsx:141` `staggerMs: Math.max(0, (Number(stagger) || 0) * 1000),`
  - `SplitFlapText.jsx:351` `'--split-flap-flip-duration': '${Math.max(0.04, Number(flipDuration) || 0.12)}s',`
- 指针/滚动: change.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; 离屏或隐藏时有暂停线索.
- 减弱动效: 有. `393` @media (prefers-reduced-motion: reduce) {
- Props: `words=['LAUNCH READY'` (93), `text` (94), `flipDuration=0.12` (95), `stagger=0.06` (96), `cycleDelay=2400` (97), `charset='alphanumeric'` (98), `flipsPerChar=8` (99), `tileColor='#111827'` (100), `textColor='#f8fafc'` (101), `tileRadius=8` (102), `gap=6` (103), `fontSize=52` (104), `loop=true` (105), `padTo=12` (106), `align='left'` (107), `intro=true` (108), `glare=0` (109), `depth=0.5` (110), `order='left'` (111), `tileStyle='board'` (112), `className=''` (113), `style={}` (114)
- 裁决: 借鉴. 只留错峰公式, 模糊中点和按位停格, 不把解密或扫光当正文.

### TextAnimations/SplitText

- 文件: `TextAnimations/SplitText/SplitText.jsx` 428 行. 目录内实现已逐行扫描.
- 看起来: GSAP 时间轴驱动进入或离开. 命名常数 DEFAULT_FROM, DEFAULT_TO, STIFFNESS, DAMPING, KICK.
- 技法: DOM + gsap.
- 常数:
  - `SplitText.jsx:11` `const DEFAULT_FROM = { opacity: 0, y: 40 };`
  - `SplitText.jsx:12` `const DEFAULT_TO = { opacity: 1, y: 0 };`
  - `SplitText.jsx:13` `const STIFFNESS = 180;`
  - `SplitText.jsx:14` `const DAMPING = 19;`
  - `SplitText.jsx:15` `const KICK = 0.024;`
  - `SplitText.jsx:26` `return { from: { opacity: 0 }, to: { opacity: 1 }, ease: 'power2.inOut' };`
  - `SplitText.jsx:31` `ease: 'power2.out'`
  - `SplitText.jsx:38` `ease: 'power3.out'`
  - `SplitText.jsx:42` `return { from: { opacity: 0, scale: 0 }, to: { opacity: 1, scale: 1 }, ease: 'back.out(1.6)' };`
  - `SplitText.jsx:50` `return { from: { opacity: 0, y: em * 0.45 }, to: { opacity: 1, y: 0 }, ease: waveEase };`
  - `SplitText.jsx:52` `return { from: { ...DEFAULT_FROM }, to: { ...DEFAULT_TO }, ease: 'power3.out' };`
  - `SplitText.jsx:59` `delay = 50,`
  - `SplitText.jsx:60` `duration = 1.25,`
  - `SplitText.jsx:65` `threshold = 0.1,`
  - `SplitText.jsx:125` `const startPct = (1 - threshold) * 100;`
  - `SplitText.jsx:143` `const easing = ease || (custom ? 'power3.out' : look.ease);`
  - `SplitText.jsx:145` `const exit = Math.max(0.35, duration * 0.55);`
  - `SplitText.jsx:149` `let order = gsap.utils.distribute({ each: delay / 1000, from: staggerFrom });`
  - `SplitText.jsx:177` `duration: duration * 0.7,`
  - `SplitText.jsx:178` `ease: 'power1.inOut',`
  - `SplitText.jsx:182` `duration * 0.3`
  - `SplitText.jsx:195` `{ ...fromVars, duration: exit, ease: 'power2.in', stagger: order, immediateRender: false },`
  - `SplitText.jsx:198` `if (accent) tl.to(pieces, { color: accent, duration: exit, ease: 'power1.in', stagger: order }, 0);`
  - `SplitText.jsx:235` `const dt = Math.min(0.032, Math.max(0.001, (now - last) / 1000));`
  - `SplitText.jsx:243` `if (spring) spring.v -= kicks[k].velocity;`
  - `SplitText.jsx:247` `const spring = springs[i] || (springs[i] = { y: 0, v: 0 });`
  - `SplitText.jsx:257` `if (Math.abs(target - spring.y) < 0.02 && Math.abs(spring.v) < 0.05) {`
  - `SplitText.jsx:259` `spring.v = 0;`
  - (带数字的运动行共 30 条, 留前 28 条, 文件 428 行已逐行扫过)
- 指针/滚动: pointerenter, pointermove, pointerleave, click.
- 可中断: GSAP 时间轴可 reverse 或 kill, 改 props 通常拆掉重建.
- 性能: 有 rAF, 并且有 cancel.
- 减弱动效: 有. `119` if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
- Props: `text` (57), `className=''` (58), `delay=50` (59), `duration=1.25` (60), `ease` (61), `splitType='chars'` (62), `from` (63), `to` (64), `threshold=0.1` (65), `rootMargin='-100px'` (66), `textAlign='center'` (67), `tag='p'` (68), `staggerFrom='start'` (69), `mask=false` (70), `effect='rise'` (71), `trigger='view'` (72), `loop=false` (73), `loopDelay=1.5` (74), `hoverEffect='none'` (75), `color` (76), `accentColor` (77), `onLetterAnimationComplete` (78)
- 裁决: 借鉴. 减弱动效和可中断是真的, 只取这条状态机, 不取视觉主题.

### TextAnimations/StrokeText

- 文件: `TextAnimations/StrokeText/StrokeText.css` 23 行, `TextAnimations/StrokeText/StrokeText.jsx` 431 行. 目录内实现已逐行扫描.
- 看起来: GSAP 时间轴驱动进入或离开. 命名常数 DEFAULT_TEXT, SHADOW_OPACITY.
- 技法: SVG + gsap.
- 常数:
  - `StrokeText.jsx:14` `const SHADOW_OPACITY = 0.5;`
  - `StrokeText.jsx:46` `stagger = 0.05,`
  - `StrokeText.jsx:47` `ease = 'power2.out',`
  - `StrokeText.jsx:198` `tl.to(strokes, { strokeDashoffset: 0, duration: drawDuration, ease, stagger: staggerConfig }, 0);`
  - `StrokeText.jsx:201` `tl.to(wipe, { attr: frames.end, duration: fillDuration, ease: 'power2.inOut' }, drawDuration + fillDelay);`
  - `StrokeText.jsx:205` `{ opacity: 1, duration: fillDuration, ease: 'power2.out', stagger: staggerConfig },`
  - `StrokeText.jsx:213` `{ attr: lifted, duration: fillDuration * 1.4, ease: 'power3.out' },`
  - `StrokeText.jsx:257` `.to(strokes, { strokeOpacity: 0, duration: 0.2, ease: 'power1.out' })`
  - `StrokeText.jsx:259` `.to(strokes, { strokeDashoffset: 0, duration: drawDuration * 0.8, ease, stagger: staggerConfig });`
  - `StrokeText.jsx:269` `{ strokeDashoffset: -dashPeriod, duration: dashPeriod / (fontSize * 0.22), ease: 'none', repeat: -1 }`
- 指针/滚动: pointerenter.
- 可中断: GSAP 时间轴可 reverse 或 kill, 改 props 通常拆掉重建. 时间轴, 不保留指针速度.
- 性能: 无自管循环. 交给 CSS 或库.; ResizeObserver.
- 减弱动效: 有. `181` const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
- Props: `text=DEFAULT_TEXT` (40), `strokeColor='#A78BFA'` (41), `fillColor='currentColor'` (42), `strokeWidth=1.4` (43), `drawDuration=1.6` (44), `fillDelay=0.2` (45), `stagger=0.05` (46), `ease='power2.out'` (47), `trigger='mount'` (48), `fillMode='wipe'` (49), `wipeFrom='left'` (50), `fontSize=128` (51), `fontWeight=800` (52), `fontFamily='inherit'` (53), `letterSpacing=-4` (54), `reverse=false` (55), `strokeStyle='solid'` (56), `dashLength=10` (57), `marching=false` (58), `hoverRedraw=false` (59), `shadow=false` (60), `shadowColor` (61), `className=''` (62), `style={}` (63)
- 裁决: 借鉴. 只留错峰公式, 模糊中点和按位停格, 不把解密或扫光当正文.

### TextAnimations/TechText

- 文件: `TextAnimations/TechText/TechText.css` 13 行, `TextAnimations/TechText/TechText.jsx` 993 行. 目录内实现已逐行扫描.
- 看起来: 2d 画布逐帧画. 命名常数 LABEL_FONT, FALLOFF_STEPS, SPRING, INHERIT, INTRO_DELAY, KICK_DECAY.
- 技法: canvas2d + rAF.
- 常数:
  - `TechText.jsx:7` `const LABEL_FONT = '10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';`
  - `TechText.jsx:8` `const FALLOFF_STEPS = 8;`
  - `TechText.jsx:9` `const SPRING = 320;`
  - `TechText.jsx:11` `const INTRO_DELAY = 0.15;`
  - `TechText.jsx:12` `const KICK_DECAY = 0.62;`
  - `TechText.jsx:14` `const approach = (current, target, dt, seconds) => current + (target - current) * (1 - Math.exp(-dt / seconds));`
  - `TechText.jsx:18` `const smoothstep = (edge0, edge1, value) => {`
  - `TechText.jsx:537` `ctx.globalAlpha = alpha * 0.62 * smoothstep(0.7, 1, grow);`
  - `TechText.jsx:639` `const amount = smoothstep(0.3 * band.order, 0.3 * band.order + 0.4, fill);`
  - `TechText.jsx:646` `const outline = smoothstep(0.08 + 0.2 * lead, 0.22 + 0.2 * lead, progress);`
  - `TechText.jsx:685` `const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));`
  - `TechText.jsx:689` `const damping = 2 * Math.sqrt(SPRING) * (1 - clamp01(s.bounce) * 0.96);`
  - `TechText.jsx:720` `presence = approach(presence, s.reveal === 'area' && active && dragging < 0 ? 1 : 0, dt, 0.16);`
  - `TechText.jsx:732` `glyph.offset.x = approach(glyph.offset.x, pointer.x - grab.x, dt, 0.03);`
  - `TechText.jsx:733` `glyph.offset.y = approach(glyph.offset.y, pointer.y - grab.y, dt, 0.03);`
  - `TechText.jsx:747` `velocity.x += (-SPRING * offset.x - damping * velocity.x) * dt;`
  - `TechText.jsx:748` `velocity.y += (-SPRING * offset.y - damping * velocity.y) * dt;`
  - `TechText.jsx:749` `offset.x += velocity.x * dt;`
  - `TechText.jsx:750` `offset.y += velocity.y * dt;`
  - `TechText.jsx:760` `glyph.shown = i < cursorAt ? 1 : i === cursorAt ? smoothstep(0, step * 0.3, progress - i * step) : 0;`
  - `TechText.jsx:782` `frame.x1 = approach(frame.x1, bx1, dt, glide);`
  - `TechText.jsx:783` `frame.y1 = approach(frame.y1, by1, dt, glide);`
  - `TechText.jsx:784` `frame.x2 = approach(frame.x2, bx2, dt, glide);`
  - `TechText.jsx:785` `frame.y2 = approach(frame.y2, by2, dt, glide);`
  - `TechText.jsx:788` `frame.alpha = approach(frame.alpha, focus >= 0 && s.selection ? 1 : 0, dt, 0.1);`
  - `TechText.jsx:799` `glyph.outline = approach(glyph.outline, target, dt, 0.09);`
  - `TechText.jsx:804` `guideAlpha = approach(guideAlpha, s.guides && !introducing && (focus >= 0 || presence > 0.4) ? 1 : 0, dt, 0.14);`
  - `TechText.jsx:827` `drawLines(s, view, accent, 1 - smoothstep(0.84, 1, progress), k =>`
  - (带数字的运动行共 30 条, 留前 28 条, 文件 993 行已逐行扫过)
- 指针/滚动: pointermove, pointerenter, pointerdown, pointerup, pointercancel, pointerleave.
- 可中断: pointercancel 有监听.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; 读 devicePixelRatio; ResizeObserver.
- 减弱动效: 有. `111` const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
- Props: `text='React Bits'` (37), `fontFamily=''` (38), `fontWeight=600` (39), `fontSize=150` (40), `letterSpacing=-0.05` (41), `color='currentColor'` (42), `accentColor='currentColor'` (43), `align='center'` (44), `reach=200` (45), `softness=0.7` (46), `dashLength=4` (47), `dashGap=2` (48), `strokeWidth=1.5` (49), `lineStyle='dashed'` (50), `reveal='letter'` (51), `specks=15` (52), `selection=true` (53), `labels=true` (54), `draggable=true` (55), `bounce=0.4` (56), `sweep=true` (57), `speed=1` (58), `clickKick=true` (59), `intro='none'` (60)
- 裁决: 借鉴. 减弱动效和可中断是真的, 只取这条状态机, 不取视觉主题.

### TextAnimations/TextCursor

- 文件: `TextAnimations/TextCursor/TextCursor.css` 23 行, `TextAnimations/TextCursor/TextCursor.jsx` 394 行. 目录内实现已逐行扫描.
- 看起来: DOM + rAF.
- 技法: DOM + rAF.
- 常数:
  - `TextCursor.jsx:199` `const dt = Math.min(0.05, (now - last) / 1000 || 0);`
  - `TextCursor.jsx:205` `const k = tau > 0 ? 1 - Math.exp(-dt / tau) : 1;`
  - `TextCursor.jsx:222` `cut += (unit / Math.max(0.005, s.removalInterval / 1000)) * dt;`
  - `TextCursor.jsx:272` `scale *= 1 - 0.55 * ease;`
  - `TextCursor.jsx:273` `opacity *= 1 - ease;`
- 指针/滚动: pointermove, pointerdown, pointerleave.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel.
- 减弱动效: 有. `72` const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
- Props: `text='Hello'` (25), `mode='stamp'` (26), `spacing=88` (27), `maxPoints=7` (28), `followMouseDirection=true` (29), `randomFloat=true` (30), `exitDuration=0.5` (31), `removalInterval=30` (32), `shrink=0.5` (33), `fade=0.6` (34), `smoothing=0.3` (35), `popIn=true` (36), `keepUpright=true` (37), `hideCursor=false` (38), `color='currentColor'` (39), `fontSize=28` (40), `fontWeight=600` (41), `fontFamily='inherit'` (42), `className=''` (43), `style` (44)
- 裁决: 借鉴. 只留错峰公式, 模糊中点和按位停格, 不把解密或扫光当正文.

### TextAnimations/TextLoop

- 文件: `TextAnimations/TextLoop/TextLoop.css` 25 行, `TextAnimations/TextLoop/TextLoop.jsx` 627 行. 目录内实现已逐行扫描.
- 看起来: GSAP 时间轴驱动进入或离开. 命名常数 VIEW_W, VIEW_H, EDGE_PAD, FADE_STEPS, MAX_FLING, MAX_BOOST.
- 技法: SVG + gsap.
- 常数:
  - `TextLoop.jsx:8` `const VIEW_W = 1200;`
  - `TextLoop.jsx:9` `const VIEW_H = 520;`
  - `TextLoop.jsx:12` `const EDGE_PAD = 6;`
  - `TextLoop.jsx:13` `const FADE_STEPS = 8;`
  - `TextLoop.jsx:14` `const MAX_FLING = 2600;`
  - `TextLoop.jsx:15` `const MAX_BOOST = 1600;`
  - `TextLoop.jsx:286` `const dt = Math.min(0.05, deltaMs / 1000);`
  - `TextLoop.jsx:287` `fling *= Math.exp(-dt / 0.55);`
  - `TextLoop.jsx:289` `if (performance.now() - scrollAt > 90) scrollVelocity *= Math.exp(-dt / 0.12);`
  - `TextLoop.jsx:291` `boost += (target - boost) * (1 - Math.exp(-dt / 0.18));`
  - `TextLoop.jsx:313` `duration: hovered ? 0.6 : 0.9,`
  - `TextLoop.jsx:314` `ease: hovered ? 'power2.out' : 'power2.inOut',`
  - `TextLoop.jsx:352` `const dt = Math.max(1, now - lastT) / 1000;`
  - `TextLoop.jsx:353` `velocity = velocity * 0.6 + (delta / dt) * 0.4;`
- 指针/滚动: pointerenter, pointerleave, pointerdown, pointermove, pointerup, pointercancel, scroll.
- 可中断: pointercancel 有监听.
- 性能: 无自管循环. 交给 CSS 或库.; IntersectionObserver.
- 减弱动效: 有. `260` const reduced = Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
- Props: `text='React ✦ Bits'` (112), `shape='wave'` (113), `path` (114), `speed=90` (115), `direction='forward'` (116), `separator='✦'` (117), `curviness=90` (118), `tilt=0` (119), `fontSize=46` (120), `fontWeight=800` (121), `letterSpacing=2` (122), `uppercase=true` (123), `color` (124), `ribbon=true` (125), `ribbonColor='#5227FF'` (126), `ribbonWidth=86` (127), `edgeFade=0` (128), `pauseOnHover=true` (129), `cross=false` (130), `crossColor` (131), `crossAngle=16` (132), `draggable=false` (133), `scrollBoost=0` (134), `outline=false` (135)
- 裁决: 借鉴. 减弱动效和可中断是真的, 只取这条状态机, 不取视觉主题.

### TextAnimations/TextPressure

- 文件: `TextAnimations/TextPressure/TextPressure.jsx` 397 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 RIPPLE_LIFE, MAX_RIPPLES, WAVE_PERIOD, PULSE_PERIOD, PULSE_DEPTH.
- 技法: DOM + rAF.
- 常数:
  - `TextPressure.jsx:8` `const RIPPLE_LIFE = 1.3;`
  - `TextPressure.jsx:9` `const MAX_RIPPLES = 6;`
  - `TextPressure.jsx:10` `const WAVE_PERIOD = 3.2;`
  - `TextPressure.jsx:11` `const PULSE_PERIOD = 2.8;`
  - `TextPressure.jsx:12` `const PULSE_DEPTH = 0.42;`
  - `TextPressure.jsx:304` `if (animating || (changed && idleFrames < 60)) rafId = requestAnimationFrame(tick);`
- 指针/滚动: mousemove, touchstart, touchmove, touchend, touchcancel, scroll, mouseleave, pointerdown.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 有 rAF, 并且有 cancel; IntersectionObserver; ResizeObserver.
- 减弱动效: 有. `211` const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
- Props: `text='Compressa'` (51), `fontFamily='Roboto Flex'` (52), `fontUrl='https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz` (53), `width=true` (55), `weight=true` (56), `italic=true` (57), `alpha=false` (58), `flex=true` (60), `stroke=false` (61), `scale=false` (62), `radius=0.5` (64), `smoothing=0.5` (65), `idle='none'` (67), `idleSpeed=1` (68), `clickRipple=true` (69), `textColor='currentColor'` (71), `pressureColor=''` (72), `strokeColor='#FF0000'` (73), `strokeWidth=3` (74), `className=''` (75), `minFontSize=24` (77)
- 裁决: 借鉴. 只留错峰公式, 模糊中点和按位停格, 不把解密或扫光当正文.

### TextAnimations/TextType

- 文件: `TextAnimations/TextType/TextType.css` 79 行, `TextAnimations/TextType/TextType.jsx` 395 行. 目录内实现已逐行扫描.
- 看起来: GSAP 时间轴驱动进入或离开. 命名常数 NEIGHBORS, EFFECTS.
- 技法: DOM + gsap.
- 常数:
  - `TextType.css:38` `transition: opacity 0.2s ease;`
  - `TextType.jsx:51` `options: { duration: 360, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' }`
  - `TextType.jsx:58` `options: { duration: 520, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }`
  - `TextType.jsx:65` `options: { duration: 480, easing: 'cubic-bezier(0.34, 1.4, 0.64, 1)' }`
  - `TextType.jsx:162` `{ threshold: 0.1 }`
  - `TextType.jsx:179` `.to(blink, { opacity: 0, duration: fade, ease: 'sine.inOut' }, hold)`
  - `TextType.jsx:180` `.to(blink, { opacity: 1, duration: fade, ease: 'sine.inOut' }, hold + fade + cursorBlinkDuration * 0.4);`
  - `TextType.jsx:211` `gsap.to(cursor, { x, y, duration: glideTime, ease: 'power3.out', overwrite: true });`
  - `TextType.jsx:219` `gsap.to(blink, { opacity: 1, duration: 0.12, ease: 'power1.out' });`
- 指针/滚动: change.
- 可中断: GSAP 时间轴可 reverse 或 kill, 改 props 通常拆掉重建. 时间轴, 不保留指针速度.
- 性能: 无自管循环. 交给 CSS 或库.; IntersectionObserver; ResizeObserver.
- 减弱动效: 有. `146` const query = window.matchMedia('(prefers-reduced-motion: reduce)');
- Props: `text` (84), `typingSpeed=50` (86), `initialDelay=0` (87), `pauseDuration=2000` (88), `deletingSpeed=30` (89), `deleteMode='backspace'` (90), `loop=true` (91), `className=''` (92), `showCursor=true` (93), `hideCursorWhileTyping=false` (94), `cursorStyle='character'` (95), `cursorCharacter='|'` (96), `cursorColor='currentColor'` (97), `cursorClassName=''` (98), `cursorBlinkDuration=0.5` (99), `cursorGlide=true` (100), `typeEffect='none'` (101), `mistakes=0` (102), `prefix=''` (103), `prefixColor='currentColor'` (104), `textColors=[]` (105), `variableSpeed` (106), `onSentenceComplete` (107), `startOnVisible=false` (108)
- 裁决: 借鉴. 只留错峰公式, 模糊中点和按位停格, 不把解密或扫光当正文.

### TextAnimations/TrueFocus

- 文件: `TextAnimations/TrueFocus/TrueFocus.css` 93 行, `TextAnimations/TrueFocus/TrueFocus.jsx` 202 行. 目录内实现已逐行扫描.
- 看起来: motion 的 spring 或 animate. 命名常数 CORNERS, FRAME_GAP, SMOOTH_EASE, SMOOTH_CSS, SPRING_CSS.
- 技法: DOM + motion.
- 常数:
  - `TrueFocus.css:18` `filter 0.3s ease,`
  - `TrueFocus.css:19` `color 0.3s ease;`
  - `TrueFocus.jsx:8` `const FRAME_GAP = 10;`
  - `TrueFocus.jsx:10` `const SMOOTH_CSS = 'cubic-bezier(0.65, 0, 0.35, 1)';`
  - `TrueFocus.jsx:11` `const SPRING_CSS = 'cubic-bezier(0.34, 1.56, 0.64, 1)';`
  - `TrueFocus.jsx:39` `const duration = reduceMotion ? 0 : animationDuration;`
  - `TrueFocus.jsx:43` `? { type: 'spring', visualDuration: duration, bounce: 0.38 }`
- 指针/滚动: 无指针监听.
- 可中断: 时间轴或 CSS, 不可中途保留速度.
- 性能: 无自管循环. 交给 CSS 或库.; ResizeObserver.
- 减弱动效: 有. `4` import { motion, useReducedMotion } from 'motion/react';
- Props: `sentence='True Focus'` (16), `separator=' '` (17), `manualMode=false` (18), `focusStyle='brackets'` (19), `order='sequential'` (20), `easing='smooth'` (21), `blurAmount=5` (22), `focusScale=1` (23), `borderColor='green'` (24), `highlightColor` (25), `glowColor='transparent'` (26), `animationDuration=0.5` (27), `pauseBetweenAnimations=1` (28), `cornerSize=16` (29), `borderWidth=3` (30), `unfocusedOpacity=1` (31)
- 裁决: 借鉴. 只留错峰公式, 模糊中点和按位停格, 不把解密或扫光当正文.

### TextAnimations/VariableProximity

- 文件: `TextAnimations/VariableProximity/VariableProximity.css` 17 行, `TextAnimations/VariableProximity/VariableProximity.jsx` 418 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 GAUSSIAN_EDGE, WAVE_PERIOD, WAVE_PEAK.
- 技法: DOM + rAF.
- 常数:
  - `VariableProximity.jsx:9` `const WAVE_PERIOD = 3.2;`
  - `VariableProximity.jsx:10` `const WAVE_PEAK = 0.7;`
  - `VariableProximity.jsx:240` `const ease = smoothing > 0 ? 1 - Math.exp(-delta / (smoothing * 400)) : 1;`
- 指针/滚动: mousemove, touchmove, touchend, touchcancel, scroll, resize, mouseleave.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; ResizeObserver.
- 减弱动效: 有. `149` const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
- Props: 见源码解构, 没有带默认值的签名字段
- 裁决: 借鉴. 只留错峰公式, 模糊中点和按位停格, 不把解密或扫光当正文.

### TextAnimations/WarpText

- 文件: `TextAnimations/WarpText/WarpText.css` 28 行, `TextAnimations/WarpText/WarpText.jsx` 687 行. 目录内实现已逐行扫描.
- 看起来: 着色器场, uniform 有 uTextTexture, uResolution, uPointer, uPointerActive, uTime, uWarpStrength, uWarpScale, uSpeed. 2d 画布逐帧画. 命名常数 LENS_MODES, INTRO_MS, RIPPLE_LIFE, MAX_CLICKS.
- 技法: OGL + canvas2d + ogl + rAF.
- 常数:
  - `WarpText.jsx:7` `const LENS_MODES = { bulge: 0, pinch: 1, swirl: 2 };`
  - `WarpText.jsx:8` `const INTRO_MS = 1600;`
  - `WarpText.jsx:9` `const RIPPLE_LIFE = 1.6;`
  - `WarpText.jsx:10` `const MAX_CLICKS = 4;`
  - `WarpText.jsx:68` `float value = 0.0;`
  - `WarpText.jsx:69` `float amplitude = 0.5;`
  - `WarpText.jsx:101` `float lens = smoothstep(radius, 0.0, dist) * uPointerActive;`
  - `WarpText.jsx:121` `float shockLight = 0.0;`
  - `WarpText.jsx:130` `float fade = 1.0 - smoothstep(0.0, 1.6, age);`
  - `WarpText.jsx:131` `float energy = exp(-offset * offset) * fade * smoothstep(0.0, 0.08, age) * click.w;`
  - `WarpText.jsx:149` `float k = 1.0 - float(i) / 3.0;`
  - `WarpText.jsx:413` `dpr: Math.min(window.devicePixelRatio || 1, 2)`
  - `WarpText.jsx:491` `const dpr = Math.min(window.devicePixelRatio || 1, 2);`
  - `WarpText.jsx:512` `renderer.dpr = Math.min(window.devicePixelRatio || 1, 2);`
  - `WarpText.jsx:621` `{ threshold: 0 }`
- 指针/滚动: pointermove, pointerleave, pointerdown, webglcontextlost, visibilitychange, change.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; 读 devicePixelRatio; 离屏或隐藏时有暂停线索; ResizeObserver.
- 减弱动效: 有. `394` let reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
- Props: `text='Bend the moment'` (280), `color='currentColor'` (281), `warpStrength=0.08` (282), `warpScale=1.7` (283), `speed=0.55` (284), `pointerInfluence=0.42` (285), `pointerStrength=0.38` (286), `refraction=0.018` (287), `chromatic=0` (288), `ripple=true` (289), `clickRipple=true` (290), `idleDrift=0.2` (291), `lens='bulge'` (292), `intro=true` (293), `fontSize='clamp(3rem` (294), `fontWeight=800` (295), `fontFamily='inherit'` (296), `letterSpacing='-0.06em'` (297), `lineHeight=0.9` (298), `className=''` (299), `style` (300)
- 裁决: 不做. 全屏场和控件状态机无关, 首页最多留一个主角效果, 不进默认包.
