# react-bits Components-1

来源提交 `4dc7b5b`. 每个目录的实现文件逐行扫描后摘运动行.

### Components/AccordionGallery

- 文件: `Components/AccordionGallery/AccordionGallery.css` 145 行, `Components/AccordionGallery/AccordionGallery.jsx` 235 行. 目录内实现已逐行扫描.
- 看起来: GSAP 时间轴驱动进入或离开. 命名常数 DEFAULT_ITEMS.
- 技法: DOM + gsap.
- 常数:
  - `AccordionGallery.jsx:27` `duration = 0.6,`
  - `AccordionGallery.jsx:28` `ease = 'power3.out',`
  - `AccordionGallery.jsx:31` `stagger = 0.06,`
  - `AccordionGallery.jsx:65` `const dur = animate && !prefersReduced ? duration : 0;`
  - `AccordionGallery.jsx:78` `tl.to(panel, { flexGrow: isActive ? grow : 1, ...rotProp, duration: dur, ease }, 0);`
  - `AccordionGallery.jsx:102` `tl.to([bar, text], { opacity: 1, x: 0, duration: dur, ease, stagger: prefersReduced ? 0 : stagger }, 0);`
  - `AccordionGallery.jsx:104` `tl.to([bar, text], { opacity: 0, x: -14, duration: dur * 0.6, ease }, 0);`
- 指针/滚动: 无指针监听.
- 可中断: GSAP 时间轴可 reverse 或 kill, 改 props 通常拆掉重建. 时间轴, 不保留指针速度.
- 性能: 无自管循环. 交给 CSS 或库.; ResizeObserver.
- 减弱动效: 有. `140` @media (prefers-reduced-motion: reduce) {
- Props: `items=DEFAULT_ITEMS` (17), `defaultIndex=2` (18), `accentColor='#ffffff'` (19), `overlayColor='#060010'` (20), `textColor='#ffffff'` (21), `height=460` (22), `gap=10` (23), `radius=16` (24), `expandRatio=0.52` (25), `orientation='horizontal'` (26), `duration=0.6` (27), `ease='power3.out'` (28), `parallax=0.5` (29), `tilt=8` (30), `stagger=0.06` (31), `trigger='hover'` (32), `showLabels=true` (33), `grayscale=true` (34), `className=''` (35)
- 裁决: 不做. 和已选的弹簧, 发牌, 按位数字或拇指重复, 或只是装饰.

### Components/AnimatedList

- 文件: `Components/AnimatedList/AnimatedList.css` 195 行, `Components/AnimatedList/AnimatedList.jsx` 552 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 THEMES, DEFAULT_ITEMS, HIDDEN, SPRING, FADE_MASK.
- 技法: DOM + rAF.
- 常数:
  - `AnimatedList.css:186` `transition: opacity 0.2s ease;`
  - `AnimatedList.jsx:117` `stagger = 0.05,`
  - `AnimatedList.jsx:170` `: 'cubic-bezier(0.34, 1.4, 0.64, 1)';`
  - `AnimatedList.jsx:171` `const transition = 'transform 620ms ${springEase}, opacity 300ms cubic-bezier(0.22, 1, 0.36, 1), filter 200ms ease';`
  - `AnimatedList.jsx:211` `const dt = Math.min(0.05, (now - last) / 1000 || 0);`
  - `AnimatedList.jsx:215` `const steps = Math.max(1, Math.ceil(dt / (1 / 240)));`
  - `AnimatedList.jsx:298` `const delay = entrance && !hidden ? (order++ * Math.max(0, s.stagger)).toFixed(3) : 0;`
  - `AnimatedList.jsx:299` `item.style.transitionDelay = delay ? '${delay}s, ${delay}s, 0s' : '';`
- 指针/滚动: scroll, keydown, pointerenter, pointerleave, pointermove.
- 可中断: GSAP 时间轴可 reverse 或 kill, 改 props 通常拆掉重建.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; ResizeObserver.
- 减弱动效: 有. `167` const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
- Props: `items=DEFAULT_ITEMS` (108), `onItemSelect` (109), `renderItem` (110), `initialSelectedIndex=-1` (111), `selectOnHover=true` (112), `enableArrowNavigation=true` (113), `loop=false` (114), `animation='pop'` (115), `animateOnce=false` (116), `stagger=0.05` (117), `showGradients=true` (118), `fadeSize=56` (119), `displayScrollbar=true` (120), `frame=true` (121), `theme='dark'` (122), `accentColor` (123), `radius=14` (124), `gap=8` (125), `width=420` (126), `maxHeight=440` (127), `className=''` (128), `itemClassName=''` (129), `style` (130)
- 裁决: 借鉴. 指针场的半径和回弹值得留在招牌效果里, 不铺到每个控件.

### Components/BorderGlow

- 文件: `Components/BorderGlow/BorderGlow.css` 153 行, `Components/BorderGlow/BorderGlow.jsx` 169 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 GRADIENT_POSITIONS, GRADIENT_KEYS, COLOR_MAP.
- 技法: DOM + rAF.
- 常数:
  - `BorderGlow.css:46` `transition: opacity 0.25s ease-out;`
  - `BorderGlow.css:54` `transition: opacity 0.75s ease-in-out;`
  - `BorderGlow.jsx:51` `function animateValue({ start = 0, end = 100, duration = 1000, delay = 0, ease = easeOutCubic, onUpdate, onEnd }) {`
  - `BorderGlow.jsx:52` `const t0 = performance.now() + delay;`
  - `BorderGlow.jsx:55` `const t = Math.min(elapsed / duration, 1);`
  - `BorderGlow.jsx:57` `if (t < 1) requestAnimationFrame(tick);`
  - `BorderGlow.jsx:129` `animateValue({ duration: 500, onUpdate: v => card.style.setProperty('--edge-proximity', v) });`
  - `BorderGlow.jsx:130` `animateValue({ ease: easeInCubic, duration: 1500, end: 50, onUpdate: v => {`
  - `BorderGlow.jsx:133` `animateValue({ ease: easeOutCubic, delay: 1500, duration: 2250, start: 50, end: 100, onUpdate: v => {`
  - `BorderGlow.jsx:136` `animateValue({ ease: easeInCubic, delay: 2500, duration: 1500, start: 100, end: 0,`
- 指针/滚动: 无指针监听.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 未见 cancel.
- 减弱动效: 无. 源码没有 prefers-reduced-motion 或 useReducedMotion.
- Props: `children` (64), `className=''` (65), `edgeSensitivity=30` (66), `glowColor='40 80 80'` (67), `backgroundColor='#120F17'` (68), `borderRadius=28` (69), `glowRadius=40` (70), `glowIntensity=1.0` (71), `coneSpread=25` (72), `animated=false` (73), `colors=['#c084fc'` (74), `fillOpacity=0.5` (75)
- 裁决: 不做. 和已选的弹簧, 发牌, 按位数字或拇指重复, 或只是装饰.

### Components/BounceCards

- 文件: `Components/BounceCards/BounceCards.css` 43 行, `Components/BounceCards/BounceCards.jsx` 318 行. 目录内实现已逐行扫描.
- 看起来: 自己做 force, velocity, dt 积分. 命名常数 PATTERN.
- 技法: DOM + 自写积分.
- 常数:
  - `BounceCards.css:19` `transition: box-shadow 0.3s ease;`
  - `BounceCards.jsx:67` `delay: Math.max(0, animationDelay),`
  - `BounceCards.jsx:68` `stagger: Math.max(0, animationStagger),`
  - `BounceCards.jsx:109` `const step = (value, velocity, target, stiffness, damping, dt) => {`
  - `BounceCards.jsx:110` `const next = velocity + ((target - value) * stiffness - velocity * damping) * dt;`
  - `BounceCards.jsx:118` `const dt = Math.min(1 / 30, Math.max(1 / 240, (now - last) / 1000));`
  - `BounceCards.jsx:127` `const substeps = Math.ceil(dt / (1 / 240));`
  - `BounceCards.jsx:183` `if (moving > 0.02) raf = requestAnimationFrame(frame);`
- 指针/滚动: pointermove, pointerdown, pointerleave, click, focusin, focusout, keydown.
- 可中断: 弹簧保留速度, 每帧重算目标.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel.
- 减弱动效: 有. `84` const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
- Props: `images=[]` (25), `className=''` (26), `style` (27), `containerWidth=400` (28), `containerHeight=400` (29), `cardSize=200` (30), `spread=85` (31), `rotation=10` (32), `arc=0` (33), `animationDelay=0.5` (34), `animationStagger=0.06` (35), `bounciness=0.6` (36), `enableHover=true` (37), `pushDistance=160` (38), `hoverScale=1.06` (39), `borderWidth=5` (40), `borderColor='#ffffff'` (41), `radius=25` (42), `shadow=true` (43), `transformStyles` (44), `onCardClick` (45)
- 裁决: 借鉴. 减弱动效和可中断是真的, 只取这条状态机, 不取视觉主题.

### Components/BubbleMenu

- 文件: `Components/BubbleMenu/BubbleMenu.css` 268 行, `Components/BubbleMenu/BubbleMenu.jsx` 216 行. 目录内实现已逐行扫描.
- 看起来: GSAP 时间轴驱动进入或离开. 命名常数 DEFAULT_ITEMS.
- 技法: DOM + gsap.
- 常数:
  - `BubbleMenu.css:97` `transform 0.3s ease,`
  - `BubbleMenu.css:98` `opacity 0.3s ease;`
  - `BubbleMenu.css:204` `background 0.3s ease,`
  - `BubbleMenu.css:205` `color 0.3s ease;`
  - `BubbleMenu.jsx:58` `staggerDelay = 0.12`
  - `BubbleMenu.jsx:93` `const delay = i * staggerDelay + gsap.utils.random(-0.05, 0.05);`
  - `BubbleMenu.jsx:108` `ease: 'power3.out'`
  - `BubbleMenu.jsx:119` `duration: 0.2,`
  - `BubbleMenu.jsx:120` `ease: 'power3.in'`
  - `BubbleMenu.jsx:124` `duration: 0.2,`
  - `BubbleMenu.jsx:125` `ease: 'power3.in',`
- 指针/滚动: resize.
- 可中断: 时间轴, 不保留指针速度.
- 性能: 无自管循环. 交给 CSS 或库..
- 减弱动效: 无. 源码没有 prefers-reduced-motion 或 useReducedMotion.
- Props: `logo` (47), `onMenuClick` (48), `className` (49), `style` (50), `menuAriaLabel='Toggle menu'` (51), `menuBg='#fff'` (52), `menuContentColor='#111'` (53), `useFixedPosition=false` (54), `items` (55), `animationEase='back.out(1.5)'` (56), `animationDuration=0.5` (57), `staggerDelay=0.12` (58)
- 裁决: 不做. 和已选的弹簧, 发牌, 按位数字或拇指重复, 或只是装饰.

### Components/CardNav

- 文件: `Components/CardNav/CardNav.css` 371 行, `Components/CardNav/CardNav.jsx` 528 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 THEMES, PANEL, RIM, BAR, MENU, BURGER.
- 技法: DOM + rAF.
- 常数:
  - `CardNav.css:65` `transition: background-color 0.2s ease;`
  - `CardNav.css:100` `transform 0.5s cubic-bezier(0.22, 1, 0.36, 1),`
  - `CardNav.css:101` `top 0.5s cubic-bezier(0.22, 1, 0.36, 1);`
  - `CardNav.css:130` `transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);`
  - `CardNav.css:181` `transition: filter 0.2s ease;`
  - `CardNav.css:321` `transition: opacity 0.2s ease;`
  - `CardNav.css:342` `transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);`
  - `CardNav.jsx:101` `const NARROW = 560;`
  - `CardNav.jsx:102` `const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';`
  - `CardNav.jsx:138` `stagger = 0.12,`
  - `CardNav.jsx:176` `stagger: clamp(stagger, 0, 0.3),`
  - `CardNav.jsx:229` `const lag = count > 1 ? Math.min(s.stagger, 0.7 / (count - 1)) : 0;`
  - `CardNav.jsx:253` `const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;`
  - `CardNav.jsx:262` `const steps = Math.ceil(dt / (1 / 240));`
  - `CardNav.jsx:364` `{ duration: 820, easing: EASE_OUT, fill: 'backwards' }`
  - `CardNav.jsx:372` `{ duration: 560, delay: 220 + index * 70, easing: EASE_OUT, fill: 'backwards' }`
- 指针/滚动: pointerdown, keydown.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; ResizeObserver.
- 减弱动效: 有. `365` @media (prefers-reduced-motion: reduce) {
- Props: `logo` (129), `logoAlt='Logo'` (130), `logoHref='#'` (131), `items=DEFAULT_ITEMS` (132), `cta` (133), `theme='dark'` (134), `surface='glass'` (135), `openOn='click'` (136), `cardEffect='rise'` (137), `stagger=0.12` (138), `bounce=0.2` (139), `speed=1` (140), `cardHeight=176` (141), `maxWidth=800` (142), `accentColor` (143), `menuLabel=true` (144), `intro=true` (145), `defaultOpen=false` (146), `onOpenChange` (148), `onLinkClick` (150), `ariaLabel='Main'` (151), `className=''` (152), `style` (153)
- 裁决: 不做. 和已选的弹簧, 发牌, 按位数字或拇指重复, 或只是装饰.

### Components/CardSwap

- 文件: `Components/CardSwap/CardSwap.css` 157 行, `Components/CardSwap/CardSwap.jsx` 797 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 THEMES, DEFAULT_ITEMS, PERSPECTIVE, TAU, STEP, PAD.
- 技法: DOM + rAF.
- 常数:
  - `CardSwap.jsx:65` `const PERSPECTIVE = 900;`
  - `CardSwap.jsx:67` `const STEP = 1 / 240;`
  - `CardSwap.jsx:68` `const PAD = 32;`
  - `CardSwap.jsx:70` `const DOWN = { x: 0, y: 1 };`
  - `CardSwap.jsx:139` `delay = 4000,`
  - `CardSwap.jsx:273` `delay: s0.delay`
  - `CardSwap.jsx:330` `const steps = Math.max(1, Math.ceil(dt / STEP));`
  - `CardSwap.jsx:341` `const scalar = (value, velocity, target, omega, zeta, dt) => {`
  - `CardSwap.jsx:344` `const steps = Math.max(1, Math.ceil(dt / STEP));`
  - `CardSwap.jsx:358` `const dt = state.last ? Math.min(0.05, (time - state.last) / 1000) : 1 / 60;`
  - `CardSwap.jsx:367` `[state.spread, state.spreadV] = scalar(state.spread, state.spreadV, spreadTarget, TAU * 1.4, 0.9, dt);`
  - `CardSwap.jsx:368` `[state.px, state.pvx] = scalar(state.px, state.pvx, reduce ? 0 : state.tx, TAU * 1.1, 1, dt);`
  - `CardSwap.jsx:369` `[state.py, state.pvy] = scalar(state.py, state.pvy, reduce ? 0 : state.ty, TAU * 1.1, 1, dt);`
  - `CardSwap.jsx:389` `integrate(card, target, moving ? exitOmega : restOmega, moving ? 1 : restZeta, dt);`
  - `CardSwap.jsx:449` `Math.max(400, settingsRef.current.delay)`
  - `CardSwap.jsx:459` `card.hold = time + Math.max(0, position) * stagger;`
  - `CardSwap.jsx:467` `const stagger = 0.05 / s.speed;`
  - `CardSwap.jsx:471` `settleOrder(time, stagger * 1000);`
  - `CardSwap.jsx:486` `settleOrder(time, stagger * 1000);`
  - `CardSwap.jsx:625` `if (event.type !== 'pointercancel' && (distance > Math.min(s.width, s.height) * 0.3 || fling > 700)) {`
  - `CardSwap.jsx:686` `stage.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: 'ease-out' });`
- 指针/滚动: pointermove, pointerleave, pointerdown, pointerup, pointercancel, click, visibilitychange.
- 可中断: pointercancel 有监听.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; 离屏或隐藏时有暂停线索; ResizeObserver.
- 减弱动效: 有. `227` const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
- Props: 见源码解构, 没有带默认值的签名字段
- 裁决: 借鉴. 减弱动效和可中断是真的, 只取这条状态机, 不取视觉主题.

### Components/Carousel

- 文件: `Components/Carousel/Carousel.css` 371 行, `Components/Carousel/Carousel.jsx` 802 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 DEFAULT_ITEMS, THEMES, EFFECTS, STIFFNESS, DAMPING.
- 技法: DOM + rAF.
- 常数:
  - `Carousel.css:102` `transition: filter 0.25s ease;`
  - `Carousel.css:249` `opacity 0.2s ease,`
  - `Carousel.css:250` `filter 0.2s ease,`
  - `Carousel.css:251` `transform 0.2s ease;`
  - `Carousel.css:262` `transition-duration: 0s;`
  - `Carousel.css:295` `background-color 0.2s ease,`
  - `Carousel.css:296` `transform 0.2s ease;`
  - `Carousel.css:329` `transition: background-color 0.2s ease;`
  - `Carousel.jsx:90` `const STIFFNESS = 150;`
  - `Carousel.jsx:91` `const DAMPING = 24;`
  - `Carousel.jsx:336` `const dt = state.last ? Math.min(0.05, (now - state.last) / 1000) : 1 / 60;`
  - `Carousel.jsx:344` `const steps = Math.ceil(dt * 240);`
  - `Carousel.jsx:363` `state.elapsed += dt * 1000;`
  - `Carousel.jsx:628` `{ duration: 320, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }`
- 指针/滚动: pointerdown, pointermove, pointerup, pointercancel, click, wheel, keydown, mouseenter, mouseleave, focusin, focusout, visibilitychange.
- 可中断: pointercancel 有监听. GSAP 时间轴可 reverse 或 kill, 改 props 通常拆掉重建.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; 离屏或隐藏时有暂停线索; ResizeObserver.
- 减弱动效: 有. `271` const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
- Props: 见源码解构, 没有带默认值的签名字段
- 裁决: 借鉴. 减弱动效和可中断是真的, 只取这条状态机, 不取视觉主题.

### Components/ChromaGrid

- 文件: `Components/ChromaGrid/ChromaGrid.css` 209 行, `Components/ChromaGrid/ChromaGrid.jsx` 282 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 THEMES, DEFAULT_ITEMS.
- 技法: DOM + rAF.
- 常数:
  - `ChromaGrid.css:60` `transition: filter 0.25s ease;`
  - `ChromaGrid.css:198` `transition-duration: 0.3s;`
  - `ChromaGrid.css:203` `transition-duration: 0.3s;`
  - `ChromaGrid.css:208` `transition-duration: 0.3s;`
  - `ChromaGrid.jsx:101` `damping = 0.45,`
  - `ChromaGrid.jsx:143` `const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;`
  - `ChromaGrid.jsx:145` `const follow = reduce ? 1 : 1 - Math.exp(-dt / Math.max(0.01, s.damping * 0.32));`
  - `ChromaGrid.jsx:149` `state.power += (state.target - state.power) * (reduce ? 1 : 1 - Math.exp(-dt / span));`
- 指针/滚动: pointermove, pointerdown, pointerleave, pointercancel.
- 可中断: pointercancel 有监听.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; ResizeObserver.
- 减弱动效: 有. `124` const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
- Props: `items` (95), `columns=3` (96), `minCardWidth=180` (97), `gap=12` (98), `radius=260` (99), `softness=0.6` (100), `damping=0.45` (101), `fadeOut=0.6` (102), `grayscale=1` (103), `dim=0.12` (104), `glow=0.5` (105), `borderGlow=1` (106), `reveal='spotlight'` (107), `aspectRatio='3 / 2'` (108), `cardRadius=22` (109), `showInfo=true` (110), `frame=false` (111), `theme='dark'` (112), `className=''` (113)
- 裁决: 借鉴. 减弱动效和可中断是真的, 只取这条状态机, 不取视觉主题.

### Components/CircularCarousel

- 文件: `Components/CircularCarousel/CircularCarousel.css` 240 行, `Components/CircularCarousel/CircularCarousel.jsx` 964 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 DEFAULT_ITEMS, PRESETS, INTRO_LENGTH, TILES, OVERLAP, DRAG_THRESHOLD.
- 技法: DOM + rAF.
- 常数:
  - `CircularCarousel.css:54` `transition: opacity 0.45s ease;`
  - `CircularCarousel.css:106` `animation: circular-carousel-leave 700ms cubic-bezier(0.33, 1, 0.68, 1) both;`
  - `CircularCarousel.css:139` `animation: circular-carousel-reveal 900ms ease both;`
  - `CircularCarousel.css:150` `animation: circular-carousel-title 520ms cubic-bezier(0.22, 1, 0.36, 1);`
  - `CircularCarousel.css:185` `transition: transform 600ms cubic-bezier(0.22, 1, 0.36, 1);`
  - `CircularCarousel.jsx:119` `const INTRO_LENGTH = { assemble: 1500, rise: 1400, spin: 1800, none: 0 };`
  - `CircularCarousel.jsx:120` `const TILES = 8;`
  - `CircularCarousel.jsx:121` `const OVERLAP = 2.5;`
  - `CircularCarousel.jsx:122` `const DRAG_THRESHOLD = 5;`
  - `CircularCarousel.jsx:123` `const SPRING = 118;`
  - `CircularCarousel.jsx:124` `const SETTLE_SPEED = 9;`
  - `CircularCarousel.jsx:125` `const CAPTION_SPACE = 76;`
  - `CircularCarousel.jsx:126` `const SWAP_LENGTH = 700;`
  - `CircularCarousel.jsx:127` `const SWAP_SPREAD = 420;`
  - `CircularCarousel.jsx:462` `const delay = (reach / 180) * 420;`
  - `CircularCarousel.jsx:463` `const p = easeOut(clamp((elapsed - delay) / 1080, 0, 1));`
  - `CircularCarousel.jsx:467` `const delay = (reach / 180) * 480;`
  - `CircularCarousel.jsx:468` `const p = easeOutQuint(clamp((elapsed - delay) / 900, 0, 1));`
  - `CircularCarousel.jsx:498` `const damping = 2 * Math.sqrt(SPRING);`
  - `CircularCarousel.jsx:501` `const accel = SPRING * (state.target - state.angle) - damping * state.velocity;`
  - `CircularCarousel.jsx:514` `state.velocity += (cruise - state.velocity) * (1 - Math.exp(-dt / tau));`
  - `CircularCarousel.jsx:515` `state.angle += state.velocity * dt;`
  - `CircularCarousel.jsx:535` `const ease = 1 - Math.exp(-dt / 0.35);`
  - `CircularCarousel.jsx:606` `const dt = state.last ? Math.min((now - state.last) / 1000, 0.05) : 1 / 60;`
- 指针/滚动: wheel, visibilitychange.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; 离屏或隐藏时有暂停线索; ResizeObserver.
- 减弱动效: 有. `230` @media (prefers-reduced-motion: reduce) {
- Props: 见源码解构, 没有带默认值的签名字段
- 裁决: 借鉴. 减弱动效和可中断是真的, 只取这条状态机, 不取视觉主题.

### Components/CircularGallery

- 文件: `Components/CircularGallery/CircularGallery.css` 102 行, `Components/CircularGallery/CircularGallery.jsx` 1106 行. 目录内实现已逐行扫描.
- 看起来: 着色器场, uniform 有 uResolution, uCenter, uSize, uAngle, uPad, uWave, uWaveTime, uFocal. 命名常数 DEFAULT_FONT, DEFAULT_FONT_URL, SEGMENTS_X, SEGMENTS_Y, INTRO_SECONDS, WORLD_HEIGHT.
- 技法: WebGL + canvas2d + SVG + rAF.
- 常数:
  - `CircularGallery.css:75` `transition: opacity 0.2s ease;`
  - `CircularGallery.jsx:6` `const DEFAULT_FONT = 'bold 30px Figtree';`
  - `CircularGallery.jsx:7` `const DEFAULT_FONT_URL = 'https://fonts.googleapis.com/css2?family=Figtree:wght@400;700&display=swap';`
  - `CircularGallery.jsx:8` `const SEGMENTS_X = 32;`
  - `CircularGallery.jsx:9` `const SEGMENTS_Y = 24;`
  - `CircularGallery.jsx:10` `const INTRO_SECONDS = 1.4;`
  - `CircularGallery.jsx:11` `const WORLD_HEIGHT = 16.57;`
  - `CircularGallery.jsx:22` `const STEPS = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };`
  - `CircularGallery.jsx:104` `float a = uShadow * (1.0 - smoothstep(-uBlur, uBlur, d)) * uAlpha * edgeFade();`
  - `CircularGallery.jsx:128` `const ease = value => value * value * (3 - 2 * value);`
  - `CircularGallery.jsx:506` `const focus = ease(state.focus.get(slot) || 0);`
  - `CircularGallery.jsx:512` `const shown = ease(clamp(state.intro * 2.2 - order * 0.22, 0, 1));`
  - `CircularGallery.jsx:644` `caption.style.opacity = String(ease(clamp((state.open - 0.5) / 0.5, 0, 1)));`
  - `CircularGallery.jsx:685` `const dt = last ? clamp((now - last) / 1000, 0.0005, 0.05) : 1 / 60;`
  - `CircularGallery.jsx:701` `if (auto) state.target += s.autoScroll * state.spacing * 0.25 * dt;`
  - `CircularGallery.jsx:702` `const follow = reduce ? 1 : 1 - Math.pow(1 - s.scrollEase, dt * 60);`
  - `CircularGallery.jsx:706` `const velocity = (state.scroll - before) / dt;`
  - `CircularGallery.jsx:707` `state.velocity += (velocity - state.velocity) * (1 - Math.exp(-dt / 0.08));`
  - `CircularGallery.jsx:709` `state.waveTime += dt * 2.4;`
  - `CircularGallery.jsx:710` `const openFollow = reduce ? 1 : 1 - Math.exp(-dt / 0.14);`
  - `CircularGallery.jsx:713` `state.ring += ((state.keyboard ? 1 : 0) - state.ring) * (1 - Math.exp(-dt / 0.1));`
  - `CircularGallery.jsx:715` `if (state.intro < 1) state.intro = Math.min(1, state.intro + dt / INTRO_SECONDS);`
  - `CircularGallery.jsx:719` `const next = value + (goal - value) * (1 - Math.exp(-dt / 0.12));`
  - `CircularGallery.jsx:731` `const next = reduce ? goal : value + (goal - value) * (1 - Math.exp(-dt / 0.16));`
  - `CircularGallery.jsx:742` `entry.ready = reduce ? 1 : Math.min(1, entry.ready + dt / 0.45);`
  - `CircularGallery.jsx:775` `view.ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);`
- 指针/滚动: pointerdown, pointermove, pointerup, pointercancel, pointerleave, wheel, keydown, focusin, focusout, visibilitychange.
- 可中断: pointercancel 有监听.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; 读 devicePixelRatio; 离屏或隐藏时有暂停线索; ResizeObserver.
- 减弱动效: 有. `371` const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
- Props: `items` (229), `bend=3` (230), `textColor='#ffffff'` (231), `borderRadius=0.05` (232), `font=DEFAULT_FONT` (233), `fontUrl` (234), `scrollSpeed=2` (235), `scrollEase=0.05` (236), `itemSize=1` (237), `itemAspect=0.78` (238), `gap=0.26` (239), `wave=1` (240), `fadeEdges=0.12` (241), `shadow=0.25` (242), `grayscale=false` (243), `showTitles=true` (244), `snap=true` (245), `autoScroll=0` (246), `openOnClick=true` (247), `intro=true` (248), `onItemClick` (249), `onActiveChange` (250), `dpr` (251), `className=''` (252)
- 裁决: 不做. 全屏场和控件状态机无关, 首页最多留一个主角效果, 不进默认包.

### Components/Counter

- 文件: `Components/Counter/Counter.css` 110 行, `Components/Counter/Counter.jsx` 533 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 ROW, AFFIX, DIGIT, SIZER, WINDOW, STRIP.
- 技法: SVG + rAF.
- 常数:
  - `Counter.jsx:133` `duration = 0.7,`
  - `Counter.jsx:135` `stagger = 0.04,`
  - `Counter.jsx:177` `duration: Math.max(0.05, duration),`
  - `Counter.jsx:179` `stagger: Math.max(0, stagger),`
  - `Counter.jsx:234` `const presence = TAU / (s.duration * 0.85);`
  - `Counter.jsx:255` `item.vel += (-omega * omega * (item.pos - item.target) - 2 * zeta * omega * item.vel) * dt;`
  - `Counter.jsx:258` `(-presence * presence * (item.shown - item.shownTarget) - 2 * presence * item.shownVel) * dt;`
  - `Counter.jsx:447` `{ threshold: 0.5 }`
- 指针/滚动: 无指针监听.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; ResizeObserver.
- 减弱动效: 有. `35` typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
- Props: `value=0` (125), `locale='en-US'` (126), `format` (127), `decimals` (128), `minDigits=1` (129), `prefix` (130), `suffix` (131), `direction='auto'` (132), `duration=0.7` (133), `bounce=0.2` (134), `stagger=0.04` (135), `motionBlur=true` (136), `intro=true` (137), `fade=0.3` (138), `fontSize=100` (139), `fontWeight='inherit'` (140), `textColor='inherit'` (141), `gap=0` (142), `padding=0` (143), `tabular=true` (144), `digitStyle` (145), `className=''` (146), `style` (147)
- 裁决: 不做. 和已选的弹簧, 发牌, 按位数字或拇指重复, 或只是装饰.

### Components/CurvedInput

- 文件: `Components/CurvedInput/CurvedInput.css` 71 行, `Components/CurvedInput/CurvedInput.jsx` 512 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 DEG, SHADOWS, THEMES, SELECTABLE_TYPES.
- 技法: SVG.
- 常数:
  - `CurvedInput.css:26` `transition: opacity 0.25s ease;`
  - `CurvedInput.css:40` `filter 0.2s ease,`
  - `CurvedInput.css:41` `opacity 0.2s ease;`
  - `CurvedInput.jsx:6` `const DEG = 180 / Math.PI;`
  - `CurvedInput.jsx:22` `const SHADOWS = { sm: [5, 12, 0.3], md: [10, 24, 0.4], lg: [16, 40, 0.52] };`
- 指针/滚动: 无指针监听.
- 可中断: 时间轴或 CSS, 不可中途保留速度.
- 性能: 无自管循环. 交给 CSS 或库.; ResizeObserver.
- 减弱动效: 无. 源码没有 prefers-reduced-motion 或 useReducedMotion.
- Props: `value` (133), `defaultValue=''` (134), `onChange` (135), `onSubmit` (136), `placeholder='Enter your email'` (137), `buttonText='Get Started'` (138), `type='email'` (139), `name` (140), `ariaLabel` (141), `theme='dark'` (142), `width=450` (143), `bend=28` (144), `height=64` (145), `cornerRadius=18` (146), `borderWidth=1.5` (147), `fontSize=16` (148), `backgroundColor` (149), `textColor` (150), `placeholderColor` (151), `borderColor` (152), `buttonColor` (153), `buttonTextColor` (154), `iconColor` (155), `shadowSize='md'` (156)
- 裁决: 不做. 和已选的弹簧, 发牌, 按位数字或拇指重复, 或只是装饰.

### Components/DecayCard

- 文件: `Components/DecayCard/DecayCard.css` 34 行, `Components/DecayCard/DecayCard.jsx` 504 行. 目录内实现已逐行扫描.
- 看起来: 着色器场, uniform 有 uImage, uSize, uImageSize, uUnit, uScale, uIdle, uFrequency, uOctaves. 命名常数 SCOPES, BLEED, VERTEX, FRAGMENT.
- 技法: WebGL + rAF.
- 常数:
  - `DecayCard.jsx:8` `const BLEED = 1.24;`
  - `DecayCard.jsx:60` `float n = 1.0 / 7.0;`
  - `DecayCard.jsx:90` `float sum = 0.0;`
  - `DecayCard.jsx:91` `float amp = 1.0;`
  - `DecayCard.jsx:108` `float card = 600.0 / 750.0;`
  - `DecayCard.jsx:117` `float rim = 1.0 - smoothstep(0.0, 160.0, inside);`
  - `DecayCard.jsx:119` `float idle = uIdle * mix(smoothstep(0.55, 0.95, drift) * 0.5, 0.25 + 0.75 * smoothstep(0.3, 0.8, drift), rim);`
  - `DecayCard.jsx:131` `float alpha = (1.0 - smoothstep(-0.75 / uUnit, 0.75 / uUnit, edge)) * uReady;`
  - `DecayCard.jsx:330` `const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));`
  - `DecayCard.jsx:350` `const follow = 1 - Math.exp(-dt / 0.16);`
  - `DecayCard.jsx:362` `state.level += (wanted - state.level) * (1 - Math.exp(-dt / tau));`
  - `DecayCard.jsx:374` `calm = settling ? 0 : calm + dt;`
  - `DecayCard.jsx:375` `if (state.visible && (calm < 0.25 || animating)) raf = requestAnimationFrame(frame);`
  - `DecayCard.jsx:387` `const dpr = Math.min(window.devicePixelRatio || 1, 2);`
- 指针/滚动: pointermove, pointerenter, pointerleave.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; 读 devicePixelRatio; ResizeObserver.
- 减弱动效: 有. `213` const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
- Props: `image='https://images.unsplash.com/photo-1762846818262-33c197852fa8?w=900&q=80&auto=format&fit=crop'` (161), `width=300` (162), `height=400` (163), `intensity=0.5` (164), `sensitivity=0.5` (165), `hoverDecay=0.05` (166), `recovery=0.6` (167), `grain=0.25` (168), `detail=5` (169), `pattern=4` (170), `idle=0.35` (171), `flow=0` (172), `chroma=0` (173), `travel=50` (174), `tilt=10` (175), `scope='window'` (176), `radius=0` (177), `grayscale=false` (178), `children` (179), `className=''` (180), `style` (181)
- 裁决: 不做. 全屏场和控件状态机无关, 首页最多留一个主角效果, 不进默认包.

### Components/DepthCarousel

- 文件: `Components/DepthCarousel/DepthCarousel.css` 144 行, `Components/DepthCarousel/DepthCarousel.jsx` 439 行. 目录内实现已逐行扫描.
- 看起来: GSAP 时间轴驱动进入或离开. 命名常数 DEFAULT_ITEMS.
- 技法: SVG + gsap.
- 常数:
  - `DepthCarousel.css:82` `background 0.2s ease,`
  - `DepthCarousel.css:83` `border-color 0.2s ease,`
  - `DepthCarousel.css:84` `transform 0.2s ease;`
  - `DepthCarousel.css:127` `width 0.25s ease,`
  - `DepthCarousel.css:128` `background 0.25s ease;`
  - `DepthCarousel.jsx:33` `duration = 700,`
  - `DepthCarousel.jsx:34` `ease = 'power3.out',`
  - `DepthCarousel.jsx:138` `const dur = animate && !reducedRef.current ? cfg.duration / 1000 : 0;`
  - `DepthCarousel.jsx:244` `const dt = Math.max(now - drag.lastT, 1);`
- 指针/滚动: wheel, mouseenter, mouseleave, focusin, focusout.
- 可中断: GSAP 时间轴可 reverse 或 kill, 改 props 通常拆掉重建. 时间轴, 不保留指针速度.
- 性能: 无自管循环. 交给 CSS 或库.; ResizeObserver.
- 减弱动效: 有. `136` @media (prefers-reduced-motion: reduce) {
- Props: `items=DEFAULT_ITEMS` (20), `cardWidth=300` (21), `cardHeight=380` (22), `radius=18` (23), `tint='#05060a'` (24), `depth=220` (25), `spread=90` (26), `tilt=22` (27), `tiltDirection='right'` (28), `perspective=1400` (29), `visibleCards=4` (30), `falloff=0.2` (31), `blur=6` (32), `duration=700` (33), `ease='power3.out'` (34), `autoplay=false` (35), `autoplayDelay=3200` (36), `loop=true` (37), `showControls=true` (38), `showIndicators=true` (39), `onChange` (40), `className=''` (41)
- 裁决: 不做. 和已选的弹簧, 发牌, 按位数字或拇指重复, 或只是装饰.

### Components/Dock

- 文件: `Components/Dock/Dock.css` 513 行, `Components/Dock/Dock.jsx` 1023 行. 目录内实现已逐行扫描.
- 看起来: 自己做 force, velocity, dt 积分. 命名常数 SIDES, EDGE, HOP, HOP_TIME, HOLD_TIME, TAIL.
- 技法: SVG + 自写积分.
- 常数:
  - `Dock.css:18` `translate 0.5s cubic-bezier(0.22, 1, 0.36, 1),`
  - `Dock.css:19` `opacity 0.2s ease;`
  - `Dock.css:26` `translate 0.36s cubic-bezier(0.55, 0, 0.75, 0.15),`
  - `Dock.css:27` `opacity 0.24s ease 0.1s;`
  - `Dock.css:171` `transition: filter 0.2s ease;`
  - `Dock.css:184` `transition-duration: 0s;`
  - `Dock.css:293` `opacity 0.16s ease,`
  - `Dock.css:294` `transform 0.16s ease;`
  - `Dock.css:420` `transform 0.16s cubic-bezier(0.3, 0.8, 0.3, 1),`
  - `Dock.css:421` `height 0.16s cubic-bezier(0.3, 0.8, 0.3, 1),`
  - `Dock.css:422` `opacity 0.12s ease;`
  - `Dock.jsx:9` `const EDGE = 12;`
  - `Dock.jsx:10` `const HOP = 0.4;`
  - `Dock.jsx:11` `const HOP_TIME = 0.38;`
  - `Dock.jsx:12` `const HOLD_TIME = 450;`
  - `Dock.jsx:13` `const TAIL = 9;`
  - `Dock.jsx:14` `const TAIL_HALF = 9;`
  - `Dock.jsx:15` `const MENU_RADIUS = 10;`
  - `Dock.jsx:16` `const MENU_GAP = 8;`
  - `Dock.jsx:17` `const MARGIN = 8;`
  - `Dock.jsx:18` `const POP = 'cubic-bezier(0.2, 1.25, 0.4, 1)';`
  - `Dock.jsx:187` `layers.forEach(layer => layer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120, easing: 'ease-out' }));`
  - `Dock.jsx:190` `duration: nested ? 220 : 340,`
  - `Dock.jsx:194` `layer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: nested ? 120 : 160, easing: 'ease-out' })`
  - `Dock.jsx:214` `const duration = reduceRef.current ? 100 : 150;`
  - `Dock.jsx:229` `layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration, easing: 'ease-in', fill: 'forwards' })`
  - `Dock.jsx:446` `spring = { mass: 0.1, stiffness: 150, damping: 12 },`
  - `Dock.jsx:495` `mass: Math.max(0.01, spring?.mass ?? 0.1),`
  - `Dock.jsx:496` `stiffness: Math.max(1, spring?.stiffness ?? 150),`
  - `Dock.jsx:497` `damping: Math.max(0, spring?.damping ?? 12),`
  - `Dock.jsx:571` `const dt = Math.min(1 / 30, Math.max(0.001, (now - last) / 1000));`
  - `Dock.jsx:596` `const steps = Math.max(1, Math.ceil(dt * 240));`
- 指针/滚动: pointermove, pointerdown, pointerleave, pointercancel, focusin, focusout, scroll, resize, blur, pointerup.
- 可中断: pointercancel 有监听. 弹簧保留速度, 每帧重算目标.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; ResizeObserver.
- 减弱动效: 有. `507` @media (prefers-reduced-motion: reduce) {
- Props: `rows` (106), `label` (107), `side=null` (108), `point` (109), `edge` (110), `tokens` (111), `nested=false` (112), `focusFirst=false` (113), `closing=false` (114), `pressingRef` (115), `onSelect` (116), `onDismiss` (117), `onBack` (118), `onEnter` (119), `onExited` (120)
- 裁决: 采用. 运动层拿走它的积分, 错峰上限或测量指示器, 不拿走演示皮肤.

### Components/DomeGallery

- 文件: `Components/DomeGallery/DomeGallery.css` 198 行, `Components/DomeGallery/DomeGallery.jsx` 653 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 DEFAULT_IMAGES, DEFAULTS, MAX_V.
- 技法: DOM + @use-gesture + rAF.
- 常数:
  - `DomeGallery.css:149` `transition: opacity 500ms ease;`
  - `DomeGallery.css:164` `transform 500ms ease,`
  - `DomeGallery.css:165` `opacity 500ms ease;`
  - `DomeGallery.jsx:269` `const MAX_V = 1.4;`
  - `DomeGallery.jsx:391` `animatingOverlay.style.cssText = 'position:absolute;left:${overlayRelativeToRoot.left}px;top:${overlayRelativeToRoot.top}px;width:${overlayRelativeToRoot.width}px;height:${overlayRelativeToRoot.height}px;z-index:9999;bor...`
  - `DomeGallery.jsx:424` `el.style.transition = 'opacity 300ms ease-out';`
- 指针/滚动: transitionend, click, keydown.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; ResizeObserver.
- 减弱动效: 无. 源码没有 prefers-reduced-motion 或 useReducedMotion.
- Props: `images=DEFAULT_IMAGES` (111), `fit=0.5` (112), `fitBasis='auto'` (113), `minRadius=600` (114), `maxRadius=Infinity` (115), `padFactor=0.25` (116), `overlayBlurColor='#120F17'` (117), `maxVerticalRotationDeg=DEFAULTS.maxVerticalRotationDeg` (118), `dragSensitivity=DEFAULTS.dragSensitivity` (119), `enlargeTransitionMs=DEFAULTS.enlargeTransitionMs` (120), `segments=DEFAULTS.segments` (121), `dragDampening=2` (122), `openedImageWidth='400px'` (123), `openedImageHeight='400px'` (124), `imageBorderRadius='30px'` (125), `openedImageBorderRadius='30px'` (126), `grayscale=true` (127)
- 裁决: 不做. 和已选的弹簧, 发牌, 按位数字或拇指重复, 或只是装饰.

### Components/DriftWall

- 文件: `Components/DriftWall/DriftWall.css` 126 行, `Components/DriftWall/DriftWall.jsx` 291 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 DEFAULT_ITEMS.
- 技法: DOM + rAF.
- 常数:
  - `DriftWall.css:73` `transform 0.42s cubic-bezier(0.22, 1, 0.36, 1),`
  - `DriftWall.css:74` `opacity 0.42s cubic-bezier(0.22, 1, 0.36, 1),`
  - `DriftWall.css:75` `box-shadow 0.42s cubic-bezier(0.22, 1, 0.36, 1);`
  - `DriftWall.css:84` `transition: filter 0.42s cubic-bezier(0.22, 1, 0.36, 1);`
  - `DriftWall.css:95` `transition: opacity 0.42s cubic-bezier(0.22, 1, 0.36, 1);`
  - `DriftWall.jsx:126` `const dt = Math.min(0.05, Math.max(0, ts - lastTsRef.current) / 1000);`
  - `DriftWall.jsx:132` `const damp = 1 - Math.exp(-dt / 0.12);`
  - `DriftWall.jsx:145` `const ease = 1 - Math.exp(-dt / (target === 0 ? 0.16 : 0.28));`
  - `DriftWall.jsx:147` `let next = (offsetsRef.current[c] ?? 0) + velocitiesRef.current[c] * dt;`
- 指针/滚动: change.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; ResizeObserver.
- 减弱动效: 有. `121` @media (prefers-reduced-motion: reduce) {
- Props: 见源码解构, 没有带默认值的签名字段
- 裁决: 不做. 和已选的弹簧, 发牌, 按位数字或拇指重复, 或只是装饰.

### Components/ElasticSlider

- 文件: `Components/ElasticSlider/ElasticSlider.css` 216 行, `Components/ElasticSlider/ElasticSlider.jsx` 633 行. 目录内实现已逐行扫描.
- 看起来: 2d 画布逐帧画. 命名常数 VALUE, BODY, ICON, ICON_INNER, HIT, TRACK.
- 技法: canvas2d + rAF.
- 常数:
  - `ElasticSlider.jsx:26` `const DARK_INK = 'rgba(18, 15, 23, 0.86)';`
  - `ElasticSlider.jsx:27` `const LIGHT_INK = 'rgba(255, 255, 255, 0.94)';`
  - `ElasticSlider.jsx:253` `m.vp += (-fillOmega * fillOmega * (m.p - m.target) - 2 * fillZeta * fillOmega * m.vp) * dt;`
  - `ElasticSlider.jsx:256` `m.vs += (-stretchOmega * stretchOmega * m.s - 2 * stretchZeta * stretchOmega * m.vs) * dt;`
  - `ElasticSlider.jsx:259` `m.va += (-activeOmega * activeOmega * (m.a - m.goal) - 2 * 0.9 * activeOmega * m.va) * dt;`
  - `ElasticSlider.jsx:314` `duration: 280,`
  - `ElasticSlider.jsx:315` `easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)'`
- 指针/滚动: wheel.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; ResizeObserver.
- 减弱动效: 有. `41` typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
- Props: `value` (66), `defaultValue=50` (67), `startingValue=0` (68), `maxValue=100` (69), `isStepped=false` (70), `stepSize=1` (71), `onChange` (72), `onChangeEnd` (73), `orientation='horizontal'` (74), `leftIcon=<HugeiconsIcon icon={VolumeLowIcon} size={20} strokeWidth={1.75} />` (75), `rightIcon=<HugeiconsIcon icon={VolumeHighIcon} size={20} strokeWidth={1.75} />` (76), `iconPlacement='outside'` (77), `valuePosition='top'` (78), `formatValue` (79), `ticks=false` (80), `thumb=false` (81), `fillFrom` (82), `thickness=6` (83), `activeThickness=12` (84), `radius` (85), `restOpacity=0.7` (86), `growOnHover=true` (87), `maxStretch=50` (88), `bounce=0.5` (89)
- 裁决: 采用. 运动层拿走它的积分, 错峰上限或测量指示器, 不拿走演示皮肤.

### Components/FlexCarousel

- 文件: `Components/FlexCarousel/FlexCarousel.css` 142 行, `Components/FlexCarousel/FlexCarousel.jsx` 1271 行. 目录内实现已逐行扫描.
- 看起来: 着色器场, uniform 有 uRect, uResolution, tMap, uSize, uImage, uRadius, uAlpha, uReady. 自己做 force, velocity, dt 积分. 2d 画布逐帧画. 命名常数 DEFAULT_ITEMS, BEND_PRESETS, FIT_ASPECT, TAPS, PIXEL_BUDGET, INTRO_DURATION.
- 技法: OGL + canvas2d + ogl + 自写积分.
- 常数:
  - `FlexCarousel.css:43` `animation: flex-carousel-reveal 900ms ease both;`
  - `FlexCarousel.css:54` `animation: flex-carousel-title 520ms cubic-bezier(0.22, 1, 0.36, 1);`
  - `FlexCarousel.css:70` `transition: opacity 400ms ease;`
  - `FlexCarousel.css:90` `transition: transform 600ms cubic-bezier(0.22, 1, 0.36, 1);`
  - `FlexCarousel.jsx:96` `const FIT_ASPECT = { portrait: 0.75, square: 1, landscape: 4 / 3 };`
  - `FlexCarousel.jsx:97` `const TAPS = 12;`
  - `FlexCarousel.jsx:98` `const PIXEL_BUDGET = 4.5e6;`
  - `FlexCarousel.jsx:99` `const INTRO_DURATION = { rise: 2.1, bloom: 1.6, spin: 2.2, deal: 1.5, fade: 0.35 };`
  - `FlexCarousel.jsx:206` `float slope = 16.0 * t * t * (1.0 - t) * (1.0 - t);`
  - `FlexCarousel.jsx:208` `float side = smoothstep(0.02, 0.3, abs(reachX)) * (uCurl == 0.0 ? sign(reachX) : uCurl);`
  - `FlexCarousel.jsx:235` `color.rgb = mix(color.rgb, clamp(split, 0.0, 1.0) * color.a, smoothstep(0.25, 1.5, spreadPx));`
  - `FlexCarousel.jsx:340` `dpr: Math.min(window.devicePixelRatio || 1, 2),`
  - `FlexCarousel.jsx:646` `const delay = Math.min(Math.abs(rel) / (width * 0.6), 1) * 0.34;`
  - `FlexCarousel.jsx:647` `const local = clamp01((t - delay) / 0.6);`
  - `FlexCarousel.jsx:658` `const delay = Math.min(Math.abs(rel) / (width * 0.6), 1) * 0.25;`
  - `FlexCarousel.jsx:659` `const local = easeOut((t - delay) / 0.55);`
  - `FlexCarousel.jsx:697` `renderer.dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(PIXEL_BUDGET / (width * height)));`
  - `FlexCarousel.jsx:709` `const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));`
  - `FlexCarousel.jsx:742` `introState.t = Math.min(1, introState.t + dt / (INTRO_DURATION[introState.kind] || 1));`
  - `FlexCarousel.jsx:757` `const stiffness = spinning ? 9 : mode === 'wheel' ? 80 : 55;`
  - `FlexCarousel.jsx:758` `const damping = 2 * Math.sqrt(stiffness);`
  - `FlexCarousel.jsx:759` `const steps = Math.ceil(dt / (1 / 240));`
  - `FlexCarousel.jsx:790` `if (focus.pending >= 0 && mode === 'spring' && Math.abs(goal - pos) < 1.5 && Math.abs(vel) < 30) {`
  - `FlexCarousel.jsx:817` `energy += (energyTarget - energy) * (1 - Math.exp(-dt / (energyTarget > energy ? 0.07 : 0.35)));`
  - `FlexCarousel.jsx:828` `focus.v += (focusStiffness * (focus.target - focus.t) - 2 * Math.sqrt(focusStiffness) * focus.v) * dt;`
  - `FlexCarousel.jsx:878` `slot.ready = Math.min(1, slot.ready + dt / 0.45);`
- 指针/滚动: pointerdown, pointermove, pointerup, pointerleave, pointercancel, wheel, keydown, focus, blur, visibilitychange.
- 可中断: pointercancel 有监听. 弹簧保留速度, 每帧重算目标.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; 读 devicePixelRatio; 离屏或隐藏时有暂停线索; ResizeObserver.
- 减弱动效: 有. `133` @media (prefers-reduced-motion: reduce) {
- Props: 见源码解构, 没有带默认值的签名字段
- 裁决: 不做. 全屏场和控件状态机无关, 首页最多留一个主角效果, 不进默认包.

### Components/FlowingMenu

- 文件: `Components/FlowingMenu/FlowingMenu.css` 204 行, `Components/FlowingMenu/FlowingMenu.jsx` 660 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 DIVIDER, LINK, INDEX, LABEL, LABEL_TEXT, DOT.
- 技法: DOM + rAF.
- 常数:
  - `FlowingMenu.css:56` `transition: opacity 0.45s ease;`
  - `FlowingMenu.jsx:30` `const EASE = 'cubic-bezier(0.2, 0.9, 0.2, 1)';`
  - `FlowingMenu.jsx:44` `duration = 0.5,`
  - `FlowingMenu.jsx:98` `duration: Math.max(0.1, duration),`
  - `FlowingMenu.jsx:227` `const omega = (Math.PI * 2) / s.duration;`
  - `FlowingMenu.jsx:236` `b.vTop += (-wTop * wTop * (b.top - b.toTop) - 2 * zeta * wTop * b.vTop) * dt;`
  - `FlowingMenu.jsx:237` `b.vBottom += (-wBottom * wBottom * (b.bottom - b.toBottom) - 2 * zeta * wBottom * b.vBottom) * dt;`
  - `FlowingMenu.jsx:263` `r.p = reduced ? 1 : Math.min(1, r.p + elapsed / (s.duration * 0.8));`
  - `FlowingMenu.jsx:437` `duration: 900,`
  - `FlowingMenu.jsx:438` `delay: index * 70,`
  - `FlowingMenu.jsx:445` `duration: 700,`
  - `FlowingMenu.jsx:446` `delay: 200 + index * 40,`
  - `FlowingMenu.jsx:453` `duration: 1100,`
  - `FlowingMenu.jsx:454` `delay: index * 70,`
- 指针/滚动: 无指针监听.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; ResizeObserver.
- 减弱动效: 有. `37` typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
- Props: `items=[]` (40), `speed=60` (41), `direction='left'` (42), `followCursor=0.4` (43), `duration=0.5` (44), `stretch=0.6` (45), `magnet=0.25` (46), `bandInset=0` (47), `bandRadius=0` (48), `carryContent=false` (49), `textColor='#ffffff'` (50), `bgColor='#120F17'` (51), `marqueeBgColor='#ffffff'` (52), `marqueeTextColor='#120F17'` (53), `borderColor='rgba(255` (54), `dividers=true` (55), `dimInactive=false` (56), `align='center'` (57), `showIndex=false` (58), `showArrow=false` (59), `imageShape='pill'` (60), `intro=true` (61), `activeIndex` (62), `onItemClick` (63)
- 裁决: 不做. 和已选的弹簧, 发牌, 按位数字或拇指重复, 或只是装饰.

### Components/FluidGlass

- 文件: `Components/FluidGlass/FluidGlass.css` 61 行, `Components/FluidGlass/FluidGlass.jsx` 1418 行. 目录内实现已逐行扫描.
- 看起来: 着色器场, uniform 有 uView, uRatio, uMedia, uMediaRect, uMediaOn, uText, uTextOn, uBackground. 命名常数 PIXEL_BUDGET, SHADOW_SIZE, SHAPES, EXTENT, BASE, SPIN.
- 技法: WebGL + canvas2d + rAF.
- 常数:
  - `FluidGlass.jsx:6` `const PIXEL_BUDGET = 5e6;`
  - `FluidGlass.jsx:7` `const SHADOW_SIZE = 160;`
  - `FluidGlass.jsx:9` `const EXTENT = { lens: 1.02, blob: 1.08, cube: 1.32, pill: 1.02, torus: 1.0, prism: 1.18, diamond: 1.05 };`
  - `FluidGlass.jsx:106` `float rim = tr.mode > 1.5 ? 1.0 - smoothstep(0.3, 0.55, clamp(-dot(rd, tr.n), 0.0, 1.0)) : tr.mode;`
  - `FluidGlass.jsx:171` `float e = 0.35;`
  - `FluidGlass.jsx:214` `float key = smoothstep(0.42, 0.22, abs(a.x + 0.62)) * smoothstep(0.3, 0.12, abs(a.y - 0.5));`
  - `FluidGlass.jsx:215` `float strip = smoothstep(0.12, 0.05, abs(a.x - 0.95)) * smoothstep(0.8, 0.35, abs(a.y - 0.05));`
  - `FluidGlass.jsx:216` `float dome = smoothstep(0.0, 1.0, d.z) * 0.04;`
  - `FluidGlass.jsx:237` `float t = 2.0;`
  - `FluidGlass.jsx:238` `float occlusion = 1.0;`
  - `FluidGlass.jsx:239` `float deepest = 1e5;`
  - `FluidGlass.jsx:249` `caustic = smoothstep(0.12, 0.5, depth) * (uIor - 1.0) * 2.0;`
  - `FluidGlass.jsx:311` `float closest = 1e5;`
  - `FluidGlass.jsx:380` `return max(smoothstep(0.42, 0.12, cosi), smoothstep(0.06, 0.24, scatter));`
  - `FluidGlass.jsx:425` `float edge = 1.0 - smoothstep(0.04, 0.3, cosi);`
  - `FluidGlass.jsx:429` `rimLight *= smoothstep(0.0, 0.08, cosi);`
  - `FluidGlass.jsx:445` `float pixel = 1.0 / uRatio;`
  - `FluidGlass.jsx:446` `float eps = 0.25 * pixel;`
  - `FluidGlass.jsx:738` `const spring = { stretch: 1, vstretch: 0, tiltX: 0, vtiltX: 0, tiltY: 0, vtiltY: 0, scale: 0, vscale: 0 };`
  - `FluidGlass.jsx:744` `if (presence === 1) spring.scale = 1;`
  - `FluidGlass.jsx:867` `window.devicePixelRatio || 1,`
  - `FluidGlass.jsx:938` `const steps = Math.max(1, Math.ceil(dt / (1 / 240)));`
  - `FluidGlass.jsx:941` `spring[velocity] += (omega * omega * (target - spring[key]) - 2 * zeta * omega * spring[velocity]) * h;`
  - `FluidGlass.jsx:942` `spring[key] += spring[velocity] * h;`
  - `FluidGlass.jsx:944` `const settled = Math.abs(target - spring[key]) < 0.0005 && Math.abs(spring[velocity]) < 0.002;`
  - `FluidGlass.jsx:947` `spring[velocity] = 0;`
  - `FluidGlass.jsx:965` `const dt = clamp((now - last) / 1000 || 0, 0, 0.05);`
  - `FluidGlass.jsx:983` `spring.vstretch -= 2.5 * s.wobble;`
  - (带数字的运动行共 43 条, 留前 28 条, 文件 1418 行已逐行扫过)
- 指针/滚动: loadeddata, pointermove, pointerdown, pointerup, pointercancel, pointerleave, webglcontextlost, webglcontextrestored, visibilitychange.
- 可中断: pointercancel 有监听.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; 读 devicePixelRatio; 离屏或隐藏时有暂停线索; ResizeObserver.
- 减弱动效: 有. `684` const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
- Props: `text='Look closer.'` (552), `textColor` (553), `fontFamily` (554), `fontWeight=600` (555), `fontSize` (556), `src` (557), `fit='cover'` (558), `background='transparent'` (559), `shape='torus'` (560), `shapes` (561), `size=260` (562), `refraction=1` (563), `dispersion=0.35` (564), `reflection=1` (565), `frost=0` (566), `color='#ffffff'` (567), `tint=0` (568), `shadow=0.5` (569), `elevation=0.4` (570), `interaction='follow'` (571), `smoothness=0.5` (572), `wobble=0.5` (573), `spin=0.3` (574), `idle=true` (575)
- 裁决: 不做. 全屏场和控件状态机无关, 首页最多留一个主角效果, 不进默认包.

### Components/FlyingPosters

- 文件: `Components/FlyingPosters/FlyingPosters.css` 19 行, `Components/FlyingPosters/FlyingPosters.jsx` 621 行. 目录内实现已逐行扫描.
- 看起来: 着色器场, uniform 有 uProjection, uCamera, uPoster, uDepth, uSpacing, uLoop, uColumnGap, uColumns. 命名常数 VERTEX, FRAGMENT, AXES, REFERENCE_FOV, REFERENCE_Z, GRID_X.
- 技法: WebGL + canvas2d + rAF.
- 常数:
  - `FlyingPosters.jsx:34` `float oc = 1.0 - c;`
  - `FlyingPosters.jsx:57` `float position = 5.0 + (y + uViewHeight) / (2.0 * uViewHeight) * 10.0;`
  - `FlyingPosters.jsx:99` `float mask = r > 0.0 ? 1.0 - smoothstep(-aa, aa, d) : 1.0;`
  - `FlyingPosters.jsx:112` `const AXES = { vertical: [0, 1, 0], horizontal: [1, 0, 0], diagonal: [1, 1, 0] };`
  - `FlyingPosters.jsx:114` `const REFERENCE_Z = 20;`
  - `FlyingPosters.jsx:115` `const GRID_X = 100;`
  - `FlyingPosters.jsx:116` `const GRID_Y = 1;`
  - `FlyingPosters.jsx:467` `const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;`
  - `FlyingPosters.jsx:472` `state.reveal = Math.min(1, state.reveal + dt / (reduce ? 0.01 : 0.6));`
  - `FlyingPosters.jsx:475` `state.scroll += (state.target - state.scroll) * (1 - Math.pow(1 - s.scrollEase, dt * 60));`
  - `FlyingPosters.jsx:476` `state.velocity += ((state.scroll - previous) / dt - state.velocity) * (1 - Math.exp(-dt * 8));`
  - `FlyingPosters.jsx:478` `state.lean += (leanTarget - state.lean) * (1 - Math.exp(-dt * 6));`
  - `FlyingPosters.jsx:548` `state.dpr = Math.min(window.devicePixelRatio || 1, 2);`
- 指针/滚动: wheel, pointerdown, pointermove, pointerup, pointercancel, scroll.
- 可中断: pointercancel 有监听.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; 读 devicePixelRatio; ResizeObserver.
- 减弱动效: 有. `275` const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
- Props: `items=[]` (133), `planeWidth=320` (134), `planeHeight=320` (135), `distortion=3` (136), `scrollEase=0.01` (137), `cameraFov=45` (138), `cameraZ=20` (139), `gap` (140), `columns=1` (141), `columnGap=40` (142), `alternate=true` (143), `radius=0` (144), `rotation=180` (145), `axis='vertical'` (146), `speed=0` (147), `lean=0` (148), `fade=0` (149), `shading=0` (150), `wheel=true` (151), `drag=true` (152), `pageScroll=0` (153), `onItemClick` (154), `className=''` (155), `style` (156)
- 裁决: 不做. 全屏场和控件状态机无关, 首页最多留一个主角效果, 不进默认包.

### Components/Folder

- 文件: `Components/Folder/Folder.css` 352 行, `Components/Folder/Folder.jsx` 1932 行. 目录内实现已逐行扫描.
- 看起来: 着色器场, uniform 有 uModel, uSize, uDepth, uOrigin, uView, uBleed, uImage, uAlpha. 命名常数 TAU, STEP, MAX_ITEMS, DEFAULT_ITEMS, PILE_TURN, BOOK_REST.
- 技法: WebGL + canvas2d + SVG + rAF.
- 常数:
  - `Folder.jsx:7` `const STEP = 1 / 240;`
  - `Folder.jsx:8` `const MAX_ITEMS = 6;`
  - `Folder.jsx:33` `const BOOK_ANGLES = { open: -180, receive: -24, peek: -13, rest: 0 };`
  - `Folder.jsx:34` `const FLAP_ANGLES = { open: -64, receive: -30, peek: -15, rest: 0 };`
  - `Folder.jsx:35` `const LAYERS = { out: 50, drag: 80, focus: 90 };`
  - `Folder.jsx:176` `float w = 1.0 - q.z / uDepth;`
  - `Folder.jsx:211` `float total = 1.0;`
  - `Folder.jsx:263` `float w = 1.0 - q.z / uDepth;`
  - `Folder.jsx:274` `float e = 0.5;`
  - `Folder.jsx:281` `float t = 1.0 - clamp(inside / uBevel, 0.0, 1.0);`
  - `Folder.jsx:295` `float band = 0.0;`
  - `Folder.jsx:297` `band = (1.0 - smoothstep(0.0, uSize.x * 0.75, vLocal.x)) * uMorph;`
  - `Folder.jsx:301` `if (uGutter.y > 0.0) color.rgb *= 1.0 - uGutter.y * (1.0 - smoothstep(0.0, uGutter.x, vLocal.x));`
  - `Folder.jsx:306` `float sheen = smoothstep(0.85, 0.0, across * 0.55 + span.y) * 0.07 * uShine * (1.0 - band);`
  - `Folder.jsx:894` `const spring = value => ({ value, velocity: 0 });`
  - `Folder.jsx:909` `front: spring(0),`
  - `Folder.jsx:910` `rx: spring(0),`
  - `Folder.jsx:911` `ry: spring(0),`
  - `Folder.jsx:912` `lift: spring(0),`
  - `Folder.jsx:913` `squash: spring(1),`
  - `Folder.jsx:922` `anchor: spring(0),`
  - `Folder.jsx:930` `x: spring(0),`
  - `Folder.jsx:931` `y: spring(0),`
  - `Folder.jsx:932` `z: spring(0),`
  - `Folder.jsx:933` `r: spring(0),`
  - `Folder.jsx:934` `ry: spring(0),`
  - `Folder.jsx:935` `s: spring(1),`
  - `Folder.jsx:936` `hover: spring(0),`
  - (带数字的运动行共 46 条, 留前 28 条, 文件 1932 行已逐行扫过)
- 指针/滚动: load, pointermove, pointerleave, pointerdown, pointerup, pointercancel, keydown, webglcontextlost.
- 可中断: pointercancel 有监听.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; 读 devicePixelRatio.
- 减弱动效: 有. `892` const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
- Props: 见源码解构, 没有带默认值的签名字段
- 裁决: 不做. 全屏场和控件状态机无关, 首页最多留一个主角效果, 不进默认包.

### Components/GlassIcons

- 文件: `Components/GlassIcons/GlassIcons.css` 173 行, `Components/GlassIcons/GlassIcons.jsx` 1013 行. 目录内实现已逐行扫描.
- 看起来: 着色器场, uniform 有 uCanvas, uCenter, uExtent, uSize, uRadius, uBevel, uStrength, uSplit. 自己做 force, velocity, dt 积分. 命名常数 GRADIENTS, THEMES, PLATES, HOVERS, LABELS, PLATE_CODES.
- 技法: WebGL + canvas2d + SVG + 自写积分.
- 常数:
  - `GlassIcons.css:141` `opacity 0.3s cubic-bezier(0.22, 1, 0.36, 1),`
  - `GlassIcons.css:142` `transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);`
  - `GlassIcons.jsx:42` `const PLATE_CODES = { none: 0, tilt: 1, offset: 2, circle: 3 };`
  - `GlassIcons.jsx:43` `const SIDES = { top: 0, right: 90, bottom: 180, left: 270 };`
  - `GlassIcons.jsx:44` `const STAGGER = 0.07;`
  - `GlassIcons.jsx:122` `color.rgb *= 1.0 - (1.0 - smoothstep(-uSize * 0.12, uSize * 0.14, drop)) * 0.28 * uGlassAlpha;`
  - `GlassIcons.jsx:127` `float t = 1.0 - clamp(inside / uBevel, 0.0, 1.0);`
  - `GlassIcons.jsx:184` `const ease = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);`
  - `GlassIcons.jsx:190` `const drive = (value, velocity, target, stiffness, damping, dt) => {`
  - `GlassIcons.jsx:191` `const next = velocity + (stiffness * (target - value) - damping * velocity) * dt;`
  - `GlassIcons.jsx:354` `const swing = ease((enter - 0.18) / 0.82);`
  - `GlassIcons.jsx:366` `const settle = clear ? 1 : 0.92 + 0.08 * ease(enter);`
  - `GlassIcons.jsx:367` `const glyphRise = (1 - ease((enter - 0.25) / 0.75)) * 0.1 * size;`
  - `GlassIcons.jsx:398` `bend: 1 + 1.2 * (1 - ease(enter)),`
  - `GlassIcons.jsx:605` `layout.dpr = Math.min(window.devicePixelRatio || 1, 2);`
  - `GlassIcons.jsx:703` `const dt = last ? Math.min(1 / 30, time - last) : 1 / 60;`
  - `GlassIcons.jsx:705` `const steps = Math.max(1, Math.ceil(dt * 240));`
  - `GlassIcons.jsx:763` `{ threshold: 0.15 }`
- 指针/滚动: webglcontextlost.
- 可中断: 弹簧保留速度, 每帧重算目标.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; 读 devicePixelRatio; ResizeObserver.
- 减弱动效: 有. `169` @media (prefers-reduced-motion: reduce) {
- Props: `items=[]` (405), `size=82` (406), `gap=66` (407), `columns=3` (408), `roundness=0.6` (409), `refraction=0.8` (410), `bevel=0.6` (411), `dispersion=0` (412), `frost=0.2` (413), `shine=0.85` (414), `tint='#dfdfdf'` (415), `tintOpacity=0.2` (416), `iconColor` (417), `plate='tilt'` (418), `tilt=30` (419), `spread=0.5` (420), `hover='press'` (421), `parallax=1` (422), `labels='hover'` (423), `intro=true` (424), `theme='dark'` (425), `className=''` (426), `style` (427)
- 裁决: 不做. 全屏场和控件状态机无关, 首页最多留一个主角效果, 不进默认包.

### Components/GlassSurface

- 文件: `Components/GlassSurface/GlassSurface.css` 168 行, `Components/GlassSurface/GlassSurface.jsx` 824 行. 目录内实现已逐行扫描.
- 看起来: 着色器场, uniform 有 uBackdrop, uMap, uCanvas, uSize, uOrigin, uStep, uScale, uChannel. 命名常数 FAR, GLASS_VERTEX, GLASS_FRAGMENT, CHANNELS.
- 技法: WebGL + canvas2d + SVG + rAF.
- 常数:
  - `GlassSurface.css:7` `transition: opacity 0.26s ease-out;`
  - `GlassSurface.jsx:7` `const FAR = 1e20;`
  - `GlassSurface.jsx:46` `float total = 0.0;`
  - `GlassSurface.jsx:68` `const CHANNELS = { R: 0, G: 1, B: 2, A: 3 };`
  - `GlassSurface.jsx:451` `const ratio = Math.min(2, window.devicePixelRatio || 1, Math.sqrt(400000 / (w * h)));`
  - `GlassSurface.jsx:550` `const ratio = Math.min(2, window.devicePixelRatio || 1);`
  - `GlassSurface.jsx:607` `const ratio = Math.min(2, window.devicePixelRatio || 1);`
- 指针/滚动: visibilitychange, webglcontextlost.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; 读 devicePixelRatio; 离屏或隐藏时有暂停线索; ResizeObserver.
- 减弱动效: 无. 源码没有 prefers-reduced-motion 或 useReducedMotion.
- Props: `children` (282), `width=200` (283), `height=80` (284), `borderRadius=20` (285), `borderWidth=0.07` (286), `brightness=50` (287), `opacity=0.93` (288), `blur=11` (289), `displace=0` (290), `backgroundOpacity=0` (291), `saturation=1` (292), `distortionScale=-180` (293), `redOffset=0` (294), `greenOffset=10` (295), `blueOffset=20` (296), `xChannel='R'` (297), `yChannel='G'` (298), `mixBlendMode='difference'` (299), `refraction=true` (300), `renderer='auto'` (301), `backdrop` (302), `shape` (303), `className=''` (304), `style={}` (305)
- 裁决: 不做. 全屏场和控件状态机无关, 首页最多留一个主角效果, 不进默认包.

### Components/GooeyNav

- 文件: `Components/GooeyNav/GooeyNav.css` 139 行, `Components/GooeyNav/GooeyNav.jsx` 806 行. 目录内实现已逐行扫描.
- 看起来: 着色器场, uniform 有 uSize, uRatio, uPills, uHover, uDrops, uTails, uTints, uCount. 命名常数 THEMES, PILLS, SIZES, DEFAULT_ITEMS, MAX_DROPS, MAX_PILLS.
- 技法: WebGL + rAF.
- 常数:
  - `GooeyNav.css:98` `transition: color 0.2s ease;`
  - `GooeyNav.jsx:42` `const MAX_DROPS = 32;`
  - `GooeyNav.jsx:43` `const MAX_PILLS = 4;`
  - `GooeyNav.jsx:44` `const MARGIN = 72;`
  - `GooeyNav.jsx:117` `float rim = (1.0 - smoothstep(0.0, 1.6, -d)) * max(0.0, -n.y) * 0.3;`
  - `GooeyNav.jsx:118` `vec3 fill = mix(shape.rgb, vec3(1.0), rim) * (1.0 - 0.06 * max(0.0, n.y) * (1.0 - smoothstep(0.0, 6.0, -d)));`
  - `GooeyNav.jsx:121` `float shadow = (1.0 - smoothstep(-3.0, 9.0, lifted)) * uShadow * (1.0 - body);`
  - `GooeyNav.jsx:290` `const ratio = Math.min(window.devicePixelRatio || 1, 2);`
  - `GooeyNav.jsx:363` `if (!pills.has(index)) pills.set(index, { mass: 0, scale: 0, velocity: 0, outgoing: 0 });`
  - `GooeyNav.jsx:384` `const duration = Math.max(0.15, base * (0.62 + Math.random() * 0.32) + variance * 0.6);`
  - `GooeyNav.jsx:389` `const carry = Math.min(duration / 3, 0.12);`
  - `GooeyNav.jsx:536` `const dt = Math.min(0.05, (now - last) / 1000 || 0);`
  - `GooeyNav.jsx:549` `drop.emerged = Math.min(1, drop.emerged + dt / emergeTime);`
  - `GooeyNav.jsx:553` `source.mass = Math.max(0, source.mass - step);`
  - `GooeyNav.jsx:557` `const t = clamp01((now - drop.start) / 1000 / drop.duration);`
  - `GooeyNav.jsx:560` `const x = bezier(x0, x1, x2, x3, eased);`
  - `GooeyNav.jsx:561` `const y = bezier(y0, y1, y2, y3, eased);`
  - `GooeyNav.jsx:562` `if (dt > 0) {`
  - `GooeyNav.jsx:571` `const step = Math.min(1 - drop.absorbed, dt / absorbTime);`
  - `GooeyNav.jsx:576` `host.mass = Math.min(1, host.mass + drop.mass * step);`
  - `GooeyNav.jsx:583` `const steps = Math.max(1, Math.ceil(dt / (1 / 240)));`
  - `GooeyNav.jsx:587` `state.velocity += (omega * omega * (state.mass - state.scale) - 2 * zeta * omega * state.velocity) * h;`
  - `GooeyNav.jsx:590` `if (index !== target && state.mass <= 0.002 && state.outgoing <= 0.002 && Math.abs(state.scale) < 0.004) {`
  - `GooeyNav.jsx:597` `const k = 1 - Math.exp(-dt / 0.06);`
  - `GooeyNav.jsx:604` `hover.alpha += (hoverGoal - hover.alpha) * (1 - Math.exp(-dt / 0.08));`
  - `GooeyNav.jsx:613` `Math.abs(host.mass - host.scale) < 0.0008 &&`
  - `GooeyNav.jsx:621` `host.mass = 1;`
  - `GooeyNav.jsx:640` `state.mass = 1;`
  - `GooeyNav.jsx:660` `drop.mass *= 1 - drop.absorbed;`
- 指针/滚动: pointerover, pointerleave.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; 读 devicePixelRatio; ResizeObserver.
- 减弱动效: 有. `268` const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
- Props: `items=DEFAULT_ITEMS` (205), `initialActiveIndex=0` (206), `activeIndex` (207), `onChange` (208), `theme='dark'` (209), `color` (210), `activeTextColor` (211), `colors=[]` (212), `size='md'` (213), `frame=true` (214), `animationTime=600` (215), `particleCount=15` (216), `timeVariance=300` (217), `spread=56` (218), `gooeyness=0.5` (219), `wobble=0.5` (220), `hoverEffect=true` (221), `className=''` (222), `style` (223)
- 裁决: 不做. 全屏场和控件状态机无关, 首页最多留一个主角效果, 不进默认包.

### Components/HoloCard

- 文件: `Components/HoloCard/HoloCard.css` 81 行, `Components/HoloCard/HoloCard.jsx` 677 行. 目录内实现已逐行扫描.
- 看起来: 着色器场, uniform 有 uArt, uSize, uAspect, uTilt, uLight, uDistance, uPreset, uIntensity. 自己做 force, velocity, dt 积分. 命名常数 PRESETS, PERSPECTIVE, CARD_RATIO, VERTEX, FRAGMENT.
- 技法: WebGL + canvas2d + 自写积分.
- 常数:
  - `HoloCard.css:76` `transition: opacity 0.3s ease;`
  - `HoloCard.jsx:8` `const PERSPECTIVE = 1100;`
  - `HoloCard.jsx:9` `const CARD_RATIO = 63 / 88;`
  - `HoloCard.jsx:39` `const float TAU = 6.28318530718;`
  - `HoloCard.jsx:60` `vec3 c = mix(vec3(0.1, 0.25, 1.0), vec3(0.0, 0.85, 1.0), smoothstep(0.0, 0.25, t));`
  - `HoloCard.jsx:61` `c = mix(c, vec3(0.25, 1.0, 0.2), smoothstep(0.25, 0.45, t));`
  - `HoloCard.jsx:62` `c = mix(c, vec3(1.0, 0.92, 0.05), smoothstep(0.45, 0.65, t));`
  - `HoloCard.jsx:63` `c = mix(c, vec3(1.0, 0.45, 0.05), smoothstep(0.65, 0.85, t));`
  - `HoloCard.jsx:64` `return mix(c, vec3(0.95, 0.12, 0.3), smoothstep(0.85, 1.0, t));`
  - `HoloCard.jsx:77` `float m = smoothstep(0.024, 0.012, length(d / 0.49 - dot));`
  - `HoloCard.jsx:87` `float m = smoothstep(1.0, 0.78, across) * smoothstep(width, width - 0.2, along);`
  - `HoloCard.jsx:100` `float m = smoothstep(0.07, 0.035, length(d));`
  - `HoloCard.jsx:106` `m = smoothstep(edge, edge * 0.8, length(d));`
  - `HoloCard.jsx:117` `float best = 9.0;`
  - `HoloCard.jsx:118` `float second = 9.0;`
  - `HoloCard.jsx:133` `float crack = smoothstep(0.015, 0.07, second - best);`
  - `HoloCard.jsx:134` `float shine = 0.25 + 0.75 * pow(hash(id + 7.7), 2.0);`
  - `HoloCard.jsx:148` `float m = max(smoothstep(0.05, 0.0, abs(r - size)), smoothstep(size, size - 0.04, r) * 0.22);`
  - `HoloCard.jsx:154` `float dots = smoothstep(0.2, 0.1, length(fine - cell - 0.5 - (hash2(cell + 9.0) - 0.5) * 0.6)) * step(0.55, hash(cell + 2.0));`
  - `HoloCard.jsx:166` `float rays = 0.55 + 0.45 * smoothstep(0.3, 0.7, abs(fract(angle / TAU * 60.0 * uScale) - 0.5) * 2.0);`
  - `HoloCard.jsx:174` `float m = smoothstep(size, size * 0.55, length(fract(g) - 0.5 - (hash2(cell) - 0.5) * 0.5)) * step(0.25, hash(cell + 5.0));`
  - `HoloCard.jsx:181` `float etch = 0.55 + 0.45 * smoothstep(0.2, 0.8, abs(fract((p.x * 0.6 + p.y) * 140.0 * uScale) - 0.5) * 2.0);`
  - `HoloCard.jsx:194` `float piece = smoothstep(size, size - 0.07, hexagon) * step(0.42, hash(cell + 4.0));`
  - `HoloCard.jsx:201` `float speck = smoothstep(0.24, 0.0, length(fract(fine) - 0.5 - (hash2(speckCell) - 0.5) * 0.5)) * step(0.72, hash(speckCell + 1.0));`
  - `HoloCard.jsx:212` `float pixel = 1.0 / uSize.x;`
  - `HoloCard.jsx:233` `float frame = 1.0 - smoothstep(uFrame - pixel, uFrame + pixel, -outside);`
  - `HoloCard.jsx:256` `float spoke = 1.0;`
  - `HoloCard.jsx:260` `spoke = 0.3 + 0.7 * smoothstep(0.25, 0.95, abs(facing));`
  - `HoloCard.jsx:267` `float tilted = smoothstep(0.02, 0.21, length(sin(uTilt)));`
  - (带数字的运动行共 41 条, 留前 28 条, 文件 677 行已逐行扫过)
- 指针/滚动: 无指针监听.
- 可中断: 弹簧保留速度, 每帧重算目标.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; 读 devicePixelRatio; ResizeObserver.
- 减弱动效: 有. `369` const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
- Props: `image` (307), `backImage` (308), `alt=''` (309), `preset='bursts'` (310), `intensity=0.85` (311), `scale=1` (312), `edgeSparkle=0.8` (313), `frame=4` (314), `glare=0.5` (315), `foilColor='#e2e6ec'` (316), `width=320` (317), `radius=14` (318), `tiltMax=14` (319), `hoverScale=1.04` (320), `idle=true` (321), `shadow=true` (322), `className=''` (323), `style` (324)
- 裁决: 不做. 全屏场和控件状态机无关, 首页最多留一个主角效果, 不进默认包.

### Components/InfiniteMenu

- 文件: `Components/InfiniteMenu/InfiniteMenu.css` 161 行, `Components/InfiniteMenu/InfiniteMenu.jsx` 896 行. 目录内实现已逐行扫描.
- 看起来: 着色器场, uniform 有 uOrientation, uProjection, uCamera, uRadius, uTileRadius, uSpin, uStretch, uShift. 命名常数 VERTEX, FRAGMENT, GRID, RADIUS, FOV, FRONT.
- 技法: WebGL + canvas2d + SVG + rAF.
- 常数:
  - `InfiniteMenu.css:41` `opacity 0.45s ease,`
  - `InfiniteMenu.css:42` `transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);`
  - `InfiniteMenu.css:104` `transition-duration: 0.18s;`
  - `InfiniteMenu.css:110` `transition-duration: 0.18s;`
  - `InfiniteMenu.css:117` `transition-duration: 0.18s;`
  - `InfiniteMenu.jsx:70` `float mask = 1.0 - smoothstep(-aa, aa, d);`
  - `InfiniteMenu.jsx:71` `float alpha = mask * smoothstep(0.02, 0.4, vFront) * uReveal;`
  - `InfiniteMenu.jsx:77` `float focus = smoothstep(0.93, 0.997, vFront);`
  - `InfiniteMenu.jsx:84` `const GRID = 12;`
  - `InfiniteMenu.jsx:85` `const RADIUS = 2;`
  - `InfiniteMenu.jsx:532` `const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;`
  - `InfiniteMenu.jsx:536` `if (state.started) state.reveal = Math.min(1, state.reveal + dt / (reduce ? 0.01 : 0.7));`
  - `InfiniteMenu.jsx:545` `const blend = 1 - Math.exp(-dt * 30);`
  - `InfiniteMenu.jsx:551` `state.speed *= Math.exp(-dt * 14);`
  - `InfiniteMenu.jsx:558` `state.speed *= Math.exp(-dt * (6 - 5 * s.inertia));`
  - `InfiniteMenu.jsx:568` `const step = angle * (1 - Math.exp(-dt * (state.target >= 0 ? 6 : 8))) * pull;`
  - `InfiniteMenu.jsx:584` `state.settle += ((moving ? 0 : 1) - state.settle) * (1 - Math.exp(-dt * (moving ? 10 : 3)));`
  - `InfiniteMenu.jsx:591` `state.camera += (target - state.camera) * (1 - Math.exp(-dt * 4.5));`
  - `InfiniteMenu.jsx:605` `state.shift += (shiftTarget - state.shift) * (1 - Math.exp(-dt * 6));`
  - `InfiniteMenu.jsx:759` `const dpr = Math.min(window.devicePixelRatio || 1, 2);`
- 指针/滚动: pointerdown, pointermove, pointerup, pointercancel, keydown, pointerenter, pointerleave, focusin, focusout.
- 可中断: pointercancel 有监听.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; 读 devicePixelRatio; ResizeObserver.
- 减弱动效: 有. `285` const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
- Props: `items=[]` (156), `count=160` (157), `tileSize=0.63` (158), `roundness=0.2` (159), `zoom=1.65` (160), `pullBack=1` (161), `stretch=0.6` (162), `inertia=0.6` (163), `autoplay=3` (164), `grayscale=true` (165), `dim=0.5` (166), `intro=true` (167), `showInfo=true` (168), `renderInfo` (169), `theme='dark'` (170), `accentColor` (171), `backgroundColor` (172), `onActiveChange` (173), `onItemClick` (174), `className=''` (175), `style` (176)
- 裁决: 不做. 全屏场和控件状态机无关, 首页最多留一个主角效果, 不进默认包.

### Components/InfiniteSpiral

- 文件: `Components/InfiniteSpiral/InfiniteSpiral.css` 48 行, `Components/InfiniteSpiral/InfiniteSpiral.jsx` 272 行. 目录内实现已逐行扫描.
- 看起来: DOM + rAF.
- 技法: DOM + rAF.
- 常数:
  - `InfiniteSpiral.jsx:8` `const smoothstep = (min, max, value) => {`
  - `InfiniteSpiral.jsx:77` `{ threshold: 0.02 }`
  - `InfiniteSpiral.jsx:127` `const opacity = 1 - smoothstep(fadeStart, 1, edge);`
  - `InfiniteSpiral.jsx:137` `const blur = edgeBlur * smoothstep(0.35, 1, edge);`
- 指针/滚动: scroll.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; ResizeObserver.
- 减弱动效: 有. `44` @media (prefers-reduced-motion: reduce) {
- Props: `items=[]` (14), `speed=0.55` (15), `direction='up'` (16), `animationMode='auto'` (17), `radius=170` (18), `cardWidth=100` (19), `cardHeight=100` (20), `verticalSpacing=60` (21), `perspective=1000` (22), `cardsPerTurn=7` (23), `rotation=0` (24), `cardTilt=0` (25), `cardRadius=10` (26), `centerScale=1.2` (27), `edgeFade=0.3` (28), `edgeBlur=6` (29), `pauseOnHover=true` (30), `imageFit='cover'` (31), `grayscale=0` (32), `className=''` (33)
- 裁决: 不做. 和已选的弹簧, 发牌, 按位数字或拇指重复, 或只是装饰.

### Components/Lanyard

- 文件: `Components/Lanyard/Lanyard.css` 12 行, `Components/Lanyard/Lanyard.jsx` 1295 行. 目录内实现已逐行扫描.
- 看起来: 着色器场, uniform 有 foilStrength, foilAspect, foilKey, foilFill, foilTop. 自己做 force, velocity, dt 积分. 命名常数 CARD_SIZES, ANCHORS, THICKNESS, BEVEL, JOINTS, NODE_WEIGHT.
- 技法: WebGL + canvas2d + three + 自写积分.
- 常数:
  - `Lanyard.jsx:12` `const ANCHORS = { left: 0.27, center: 0.5, right: 0.73 };`
  - `Lanyard.jsx:13` `const THICKNESS = 0.018;`
  - `Lanyard.jsx:14` `const BEVEL = 0.007;`
  - `Lanyard.jsx:15` `const JOINTS = 4;`
  - `Lanyard.jsx:16` `const NODE_WEIGHT = 1 / 0.05;`
  - `Lanyard.jsx:17` `const MAX_STEP = 1 / 960;`
  - `Lanyard.jsx:18` `const ITERATIONS = 2;`
  - `Lanyard.jsx:19` `const SAMPLES = 72;`
  - `Lanyard.jsx:20` `const FOV = 24;`
  - `Lanyard.jsx:21` `const STRAP_WIDTH = 0.36;`
  - `Lanyard.jsx:22` `const RING_RADIUS = 0.095;`
  - `Lanyard.jsx:23` `const RING_TUBE = 0.0135;`
  - `Lanyard.jsx:24` `const EYELET_RADIUS = 0.036;`
  - `Lanyard.jsx:25` `const CLAMP_BODY = 0.15;`
  - `Lanyard.jsx:26` `const FACE_WIDTH = 1024;`
  - `Lanyard.jsx:37` `const FLIP_SPIN = 9;`
  - `Lanyard.jsx:92` `float best = 9.0;`
  - `Lanyard.jsx:93` `float edge = 9.0;`
  - `Lanyard.jsx:122` `float spacing = 1.7 * (0.95 + shard.y * 0.1);`
  - `Lanyard.jsx:125` `rainbow *= 0.8 + 0.2 * smoothstep(0.0, 0.04, shard.z);`
  - `Lanyard.jsx:130` `float flake = smoothstep(0.32, 0.06, length(fract(grid) - jitter * 0.6 - 0.2)) * step(0.45, foilHash(cell + 4.4));`
  - `Lanyard.jsx:134` `float fine = 1.0 - smoothstep(0.35, 0.9, max(fwidth(grid.x), fwidth(grid.y)));`
  - `Lanyard.jsx:137` `float foil = foilStrength * (0.08 + 0.92 * smoothstep(0.04, 0.7, ink));`
  - `Lanyard.jsx:479` `mass: 1,`
  - `Lanyard.jsx:522` `return 1 / body.mass + rn.dot(applyInverseInertia(body, rn, scratch.d));`
  - `Lanyard.jsx:526` `body.position.addScaledVector(impulse, 1 / body.mass);`
  - `Lanyard.jsx:604` `body.mass = 1;`
  - `Lanyard.jsx:614` `const steps = Math.max(1, Math.ceil(dt / MAX_STEP - 1e-6));`
  - (带数字的运动行共 36 条, 留前 28 条, 文件 1295 行已逐行扫过)
- 指针/滚动: pointerdown, pointermove, pointerup, pointercancel, lostpointercapture, touchstart, visibilitychange.
- 可中断: pointercancel 有监听. 弹簧保留速度, 每帧重算目标.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; 读 devicePixelRatio; 离屏或隐藏时有暂停线索; ResizeObserver.
- 减弱动效: 有. `883` const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
- Props: `frontImage` (705), `backImage` (706), `imageFit='cover'` (707), `cardColor='#ffffff'` (708), `orientation='portrait'` (709), `finish='glossy'` (710), `cornerRadius=0.3` (711), `size=0.6` (712), `anchor='center'` (713), `strapLength=0.5` (714), `strapImage` (715), `strapColor='#111111'` (716), `strapWidth=0.65` (717), `metal='silver'` (718), `gravity=1` (719), `damping=0.5` (720), `elasticity=0.5` (721), `breeze=0.5` (722), `interactive=true` (723), `intro=true` (724), `className=''` (725), `style` (726)
- 裁决: 不做. 全屏场和控件状态机无关, 首页最多留一个主角效果, 不进默认包.

### Components/LineSidebar

- 文件: `Components/LineSidebar/LineSidebar.css` 91 行, `Components/LineSidebar/LineSidebar.jsx` 181 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 FALLOFF_CURVES, DEFAULT_ITEMS.
- 技法: DOM + rAF.
- 常数:
  - `LineSidebar.jsx:65` `const dt = Math.min((now - lastRef.current) / 1000, 0.05);`
  - `LineSidebar.jsx:68` `const k = 1 - Math.exp(-dt / tau);`
  - `LineSidebar.jsx:110` `targetsRef.current[i] = ease(Math.max(0, 1 - distance / proximityRadius));`
- 指针/滚动: 无指针监听.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel.
- 减弱动效: 无. 源码没有 prefers-reduced-motion 或 useReducedMotion.
- Props: `items=DEFAULT_ITEMS` (28), `accentColor='#A855F7'` (29), `textColor='#c4c4c4'` (30), `markerColor='#6c6c6c'` (31), `showIndex=true` (32), `showMarker=true` (33), `proximityRadius=100` (34), `maxShift=30` (35), `falloff='smooth'` (36), `markerLength=60` (37), `markerGap=0` (38), `tickScale=0.5` (39), `scaleTick=true` (40), `itemGap=20` (41), `fontSize=1.1` (42), `smoothing=100` (43), `defaultActive=null` (44), `onItemClick` (45), `className=''` (46)
- 裁决: 不做. 和已选的弹簧, 发牌, 按位数字或拇指重复, 或只是装饰.

### Components/MagicBento

- 文件: `Components/MagicBento/MagicBento.css` 1126 行, `Components/MagicBento/MagicBento.jsx` 1131 行. 目录内实现已逐行扫描.
- 看起来: 2d 画布逐帧画. 命名常数 THEMES, INK, MIN_CELL, MIN_PAIR, STAGGER, TILT.
- 技法: canvas2d + SVG + rAF.
- 常数:
  - `MagicBento.css:2` `--mb-spring: cubic-bezier(0.34, 1.4, 0.64, 1);`
  - `MagicBento.css:53` `--mb-delay: 0ms;`
  - `MagicBento.css:65` `opacity 420ms cubic-bezier(0.22, 1, 0.36, 1) var(--mb-delay),`
  - `MagicBento.css:66` `transform 760ms var(--mb-spring) var(--mb-delay);`
  - `MagicBento.css:402` `transition: opacity 180ms ease;`
  - `MagicBento.css:446` `background-color 200ms ease,`
  - `MagicBento.css:447` `filter 200ms ease;`
  - `MagicBento.css:819` `transition: background-color 220ms ease;`
  - `MagicBento.css:833` `transition: transform 320ms var(--mb-spring);`
  - `MagicBento.css:847` `animation: magic-bento-draw 1100ms cubic-bezier(0.65, 0, 0.35, 1) calc(var(--mb-delay) + 220ms) both paused;`
  - `MagicBento.css:851` `animation: magic-bento-fade 700ms ease calc(var(--mb-delay) + 700ms) both paused;`
  - `MagicBento.css:855` `animation: magic-bento-grow 760ms var(--mb-spring) calc(var(--mb-delay) + 200ms + var(--i) * 55ms) both paused;`
  - `MagicBento.css:860` `magic-bento-pop 420ms var(--mb-spring) calc(var(--mb-delay) + 600ms + var(--i) * 160ms) both paused,`
  - `MagicBento.css:861` `var(--path) 9s ease-in-out calc(var(--i) * -3s) infinite paused;`
  - `MagicBento.css:865` `animation: magic-bento-select 900ms cubic-bezier(0.65, 0, 0.35, 1) calc(var(--mb-delay) + 760ms) both paused;`
  - `MagicBento.css:873` `animation: magic-bento-wait 1ms linear calc(var(--mb-delay) + 360ms + var(--i) * 520ms) both paused;`
  - `MagicBento.css:878` `magic-bento-run 520ms linear calc(var(--mb-delay) + 360ms + var(--i) * 520ms) both paused,`
  - `MagicBento.css:883` `animation: magic-bento-check 420ms var(--mb-spring) calc(var(--mb-delay) + 880ms + var(--i) * 520ms) both paused;`
  - `MagicBento.css:887` `animation: magic-bento-fade 300ms ease calc(var(--mb-delay) + 880ms + var(--i) * 520ms) both paused;`
  - `MagicBento.css:891` `animation: magic-bento-rail calc(var(--n) * 520ms) linear calc(var(--mb-delay) + 360ms) both paused;`
  - `MagicBento.css:895` `animation: magic-bento-pop 520ms var(--mb-spring) calc(var(--mb-delay) + 200ms + var(--i) * 70ms) both paused;`
  - `MagicBento.css:900` `animation: magic-bento-draw 700ms cubic-bezier(0.65, 0, 0.35, 1) calc(var(--mb-delay) + 360ms) both paused;`
  - `MagicBento.css:904` `animation: magic-bento-packet 1.8s cubic-bezier(0.45, 0, 0.55, 1) calc(var(--i) * 0.45s) infinite;`
  - `MagicBento.css:908` `animation: magic-bento-switch-track 420ms ease calc(var(--mb-delay) + 520ms + var(--i) * 200ms) both paused;`
  - `MagicBento.css:912` `animation: magic-bento-switch-knob 520ms var(--mb-spring) calc(var(--mb-delay) + 520ms + var(--i) * 200ms) both paused;`
  - `MagicBento.jsx:70` `const INK = { dark: [244, 244, 245], light: [24, 24, 27] };`
  - `MagicBento.jsx:71` `const MIN_CELL = 150;`
  - `MagicBento.jsx:72` `const MIN_PAIR = 200;`
  - `MagicBento.jsx:73` `const STAGGER = 80;`
  - `MagicBento.jsx:74` `const TILT = 6;`
  - `MagicBento.jsx:75` `const MAGNET = 6;`
  - `MagicBento.jsx:536` `const wave = { x: 0, y: 0, t: -1, duration: 1.1, reach: 800 };`
  - `MagicBento.jsx:581` `const ratio = Math.min(window.devicePixelRatio || 1, 2);`
  - `MagicBento.jsx:674` `const dt = Math.min(0.05, (now - last) / 1000 || 0);`
  - `MagicBento.jsx:696` `const follow = 1 - Math.exp(-dt / 0.05);`
  - `MagicBento.jsx:699` `const fade = 1 - Math.exp(-dt / (near > light.near ? 0.12 : 0.4));`
  - `MagicBento.jsx:709` `const progress = Math.min(1, wave.t / wave.duration);`
  - `MagicBento.jsx:740` `state.hot += (hotTarget - state.hot) * (1 - Math.exp(-dt / (hotTarget > state.hot ? 0.14 : 0.32)));`
  - `MagicBento.jsx:760` `const steps = Math.max(1, Math.ceil(dt / (1 / 240)));`
  - `MagicBento.jsx:798` `state.stars += (starTarget - state.stars) * (1 - Math.exp(-dt / (starTarget ? 0.3 : 0.5)));`
  - `MagicBento.jsx:916` `cellRefs.current.forEach(cell => cell?.style.setProperty('--mb-delay', '0ms'));`
  - `MagicBento.jsx:931` `{ threshold: 0.15 }`
  - `MagicBento.jsx:937` `cell.style.setProperty('--mb-delay', '0ms');`
  - `MagicBento.jsx:971` `cell.style.setProperty('--mb-delay', '0ms');`
- 指针/滚动: pointermove, pointerdown, pointerup, pointercancel, scroll, resize, pointerout, click, keydown.
- 可中断: pointercancel 有监听.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; 读 devicePixelRatio; ResizeObserver.
- 减弱动效: 有. `525` const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
- Props: `items=DEFAULT_ITEMS` (470), `columns=4` (471), `rowHeight=200` (472), `gap=12` (473), `radius=20` (474), `theme='dark'` (475), `glowColor` (476), `textAutoHide=true` (477), `enableBorderGlow=true` (478), `enableSpotlight=true` (479), `spotlightRadius=300` (480), `enableStars=false` (481), `particleCount=24` (482), `enableTilt=false` (483), `enableMagnetism=false` (484), `clickEffect=true` (485), `intro=true` (486), `disableAnimations=false` (487), `onItemClick` (488), `className=''` (489), `style` (490)
- 裁决: 借鉴. 减弱动效和可中断是真的, 只取这条状态机, 不取视觉主题.

### Components/Masonry

- 文件: `Components/Masonry/Masonry.css` 275 行, `Components/Masonry/Masonry.jsx` 1028 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 CARD, MEDIA, PARALLAX, IMAGE, CAPTION, TITLE.
- 技法: DOM + rAF.
- 常数:
  - `Masonry.css:40` `transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1),`
  - `Masonry.css:41` `box-shadow 0.5s cubic-bezier(0.2, 0.8, 0.2, 1),`
  - `Masonry.css:42` `opacity 0.35s ease;`
  - `Masonry.css:58` `transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1),`
  - `Masonry.css:59` `box-shadow 0.5s cubic-bezier(0.2, 0.8, 0.2, 1),`
  - `Masonry.css:60` `opacity 0.35s ease;`
  - `Masonry.css:105` `opacity 0.5s ease,`
  - `Masonry.css:106` `transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);`
  - `Masonry.css:140` `opacity 0.35s ease,`
  - `Masonry.css:141` `transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);`
  - `Masonry.css:225` `transition: opacity 0.2s ease;`
  - `Masonry.css:250` `transition: background 0.2s ease;`
  - `Masonry.jsx:32` `const EASE = 'cubic-bezier(0.2, 0.9, 0.2, 1)';`
  - `Masonry.jsx:120` `stagger = 0.05,`
  - `Masonry.jsx:121` `duration = 0.6,`
  - `Masonry.jsx:161` `stagger: Math.max(0, stagger),`
  - `Masonry.jsx:162` `duration: Math.max(0.05, duration),`
  - `Masonry.jsx:251` `node.style.transform = 'translate3d(${spring.x}px, ${spring.y}px, 0) scale(${spring.s})';`
  - `Masonry.jsx:252` `if (spring.reveal < 1) {`
  - `Masonry.jsx:253` `const eased = 1 - Math.pow(1 - Math.max(0, spring.reveal), 3);`
  - `Masonry.jsx:255` `node.style.filter = spring.blur ? 'blur(${((1 - eased) * 12).toFixed(2)}px)' : '';`
  - `Masonry.jsx:268` `const omega = (Math.PI * 2) / s.duration;`
  - `Masonry.jsx:284` `spring.vx += (-omega * omega * (spring.x - spring.tx) - 2 * zeta * omega * spring.vx) * dt;`
  - `Masonry.jsx:285` `spring.vy += (-omega * omega * (spring.y - spring.ty) - 2 * zeta * omega * spring.vy) * dt;`
  - `Masonry.jsx:286` `spring.vs += (-omega * omega * (spring.s - 1) - 2 * zeta * omega * spring.vs) * dt;`
  - `Masonry.jsx:292` `Math.abs(spring.x - spring.tx) < 0.05 &&`
  - `Masonry.jsx:293` `Math.abs(spring.y - spring.ty) < 0.05 &&`
  - `Masonry.jsx:294` `Math.abs(spring.s - 1) < 0.0005 &&`
  - `Masonry.jsx:295` `Math.abs(spring.vx) + Math.abs(spring.vy) < 0.05 &&`
  - `Masonry.jsx:296` `Math.abs(spring.vs) < 0.001;`
  - `Masonry.jsx:300` `spring.s = 1;`
  - `Masonry.jsx:301` `spring.vx = spring.vy = spring.vs = 0;`
  - `Masonry.jsx:303` `if (spring.reveal < 1) {`
  - `Masonry.jsx:304` `spring.reveal = clamp((now - spring.start) / (s.duration * 1000), 0, 1);`
  - `Masonry.jsx:305` `if (spring.reveal < 1) active = true;`
  - `Masonry.jsx:349` `spring.s = 1;`
  - `Masonry.jsx:350` `spring.reveal = 1;`
  - `Masonry.jsx:357` `const distance = 60 + Math.min(spring.h, 280) * 0.35;`
  - `Masonry.jsx:360` `spring.s = 0.96;`
  - `Masonry.jsx:362` `spring.x = rootWidth / 2 - spring.w / 2;`
  - (带数字的运动行共 48 条, 留前 28 条, 文件 1028 行已逐行扫过)
- 指针/滚动: scroll, resize, pointermove, pointerup, pointercancel, keydown.
- 可中断: pointercancel 有监听.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; ResizeObserver.
- 减弱动效: 有. `246` typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
- Props: `items=[]` (114), `columns='auto'` (115), `columnWidth=240` (116), `gap=12` (117), `radius=12` (118), `animateFrom='bottom'` (119), `stagger=0.05` (120), `duration=0.6` (121), `bounce=0.15` (122), `blurToFocus=true` (123), `revealOnScroll=true` (124), `hoverEffect='zoom'` (125), `focusOnHover=false` (126), `captions='hover'` (127), `parallax=0` (128), `lightbox=true` (129), `draggable=true` (130), `onItemClick` (131), `onReorder` (132), `className=''` (133), `style` (134)
- 裁决: 借鉴. 减弱动效和可中断是真的, 只取这条状态机, 不取视觉主题.

### Components/ModelViewer

- 文件: `Components/ModelViewer/ModelViewer.jsx` 486 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 FOV, INTRO_SECONDS, DRAG_SPEED, PITCH_LIMIT.
- 技法: DOM + @react-three/fiber + three.
- 常数:
  - `ModelViewer.jsx:10` `const FOV = 30;`
  - `ModelViewer.jsx:11` `const INTRO_SECONDS = 1.3;`
  - `ModelViewer.jsx:12` `const DRAG_SPEED = 0.0065;`
  - `ModelViewer.jsx:263` `const dt = Math.min(delta, 0.05);`
  - `ModelViewer.jsx:268` `if (m.intro < 1) m.intro = reduce ? 1 : Math.min(1, m.intro + dt / INTRO_SECONDS);`
  - `ModelViewer.jsx:272` `m.yaw += (m.reset.yaw - m.yaw) * (1 - Math.exp(-dt * 7));`
  - `ModelViewer.jsx:273` `m.pitch += (m.reset.pitch - m.pitch) * (1 - Math.exp(-dt * 7));`
  - `ModelViewer.jsx:276` `const decay = Math.exp(-dt * 4.5);`
  - `ModelViewer.jsx:281` `if (s.turntable) m.pitch += (toRadians(s.tilt) - m.pitch) * (1 - Math.exp(-dt * 4));`
  - `ModelViewer.jsx:285` `m.spinSpeed += ((spinning ? s.autoRotateSpeed : 0) - m.spinSpeed) * (1 - Math.exp(-dt * 2));`
  - `ModelViewer.jsx:288` `m.zoom += (m.zoomGoal - m.zoom) * (1 - Math.exp(-dt * 8));`
  - `ModelViewer.jsx:289` `m.tiltX += (m.tiltGoalX - m.tiltX) * (1 - Math.exp(-dt * 6));`
  - `ModelViewer.jsx:290` `m.tiltY += (m.tiltGoalY - m.tiltY) * (1 - Math.exp(-dt * 6));`
  - `ModelViewer.jsx:466` `transition: intro === 'none' ? 'none' : 'opacity 0.6s ease'`
- 指针/滚动: pointerdown, pointermove, pointerup, pointercancel, pointerleave, wheel, dblclick.
- 可中断: pointercancel 有监听.
- 性能: IntersectionObserver.
- 减弱动效: 有. `418` reducedMotion: typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
- Props: 见源码解构, 没有带默认值的签名字段
- 裁决: 不做. 全屏场和控件状态机无关, 首页最多留一个主角效果, 不进默认包.

### Components/MorphSlider

- 文件: `Components/MorphSlider/MorphSlider.css` 171 行, `Components/MorphSlider/MorphSlider.jsx` 685 行. 目录内实现已逐行扫描.
- 看起来: 着色器场, uniform 有 tCurrent, tNext, uResolution, uCurrentSize, uNextSize, uProgress, uDir, uMode. GSAP 时间轴驱动进入或离开. 命名常数 TRANSITIONS, DEFAULT_ITEMS.
- 技法: WebGL + OGL + SVG + ogl + gsap.
- 常数:
  - `MorphSlider.css:59` `opacity var(--ms-swap) cubic-bezier(0.16, 1, 0.3, 1),`
  - `MorphSlider.css:60` `transform var(--ms-swap) cubic-bezier(0.16, 1, 0.3, 1),`
  - `MorphSlider.css:61` `filter var(--ms-swap) cubic-bezier(0.16, 1, 0.3, 1);`
  - `MorphSlider.css:98` `transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),`
  - `MorphSlider.css:99` `background 0.25s ease,`
  - `MorphSlider.css:100` `border-color 0.25s ease;`
  - `MorphSlider.css:139` `width var(--ms-dot) cubic-bezier(0.16, 1, 0.3, 1),`
  - `MorphSlider.jsx:9` `const TRANSITIONS = { melt: 0, ripple: 1, shear: 2, swirl: 3 };`
  - `MorphSlider.jsx:62` `const float PI = 3.14159265359;`
  - `MorphSlider.jsx:89` `float v = 0.0;`
  - `MorphSlider.jsx:90` `float a = 0.5;`
  - `MorphSlider.jsx:129` `float m = smoothstep(0.0, 1.0, p);`
  - `MorphSlider.jsx:138` `m = smoothstep(0.0, 1.0, p);`
  - `MorphSlider.jsx:147` `m = 1.0 - smoothstep(ring - 0.03, ring + 0.03, d);`
  - `MorphSlider.jsx:149` `float slices = 14.0;`
  - `MorphSlider.jsx:157` `m = 1.0 - smoothstep(th - 0.06, th + 0.06, localX);`
  - `MorphSlider.jsx:164` `m = smoothstep(nn - 0.15, nn + 0.15, p);`
  - `MorphSlider.jsx:186` `float vig = smoothstep(1.25, 0.25, length(uv - 0.5));`
  - `MorphSlider.jsx:235` `dpr: Math.min(window.devicePixelRatio || 1, dprCap)`
  - `MorphSlider.jsx:358` `const duration = this.reducedMotion ? Math.min(opts.duration, 0.4) : opts.duration;`
  - `MorphSlider.jsx:433` `const duration = this.reducedMotion ? 0.3 : 0.5;`
  - `MorphSlider.jsx:440` `ease: 'power2.out',`
  - `MorphSlider.jsx:448` `ease: 'power2.out',`
  - `MorphSlider.jsx:481` `duration = 1.1,`
  - `MorphSlider.jsx:482` `ease = 'power2.inOut',`
  - `MorphSlider.jsx:602` `'--ms-swap': '${(duration * 0.66).toFixed(3)}s',`
  - `MorphSlider.jsx:603` `'--ms-dot': '${(duration * 0.45).toFixed(3)}s'`
- 指针/滚动: webglcontextlost, pointerdown, pointermove, pointerup, pointercancel.
- 可中断: pointercancel 有监听. GSAP 时间轴可 reverse 或 kill, 改 props 通常拆掉重建. 时间轴, 不保留指针速度.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; 读 devicePixelRatio; ResizeObserver.
- 减弱动效: 有. `164` @media (prefers-reduced-motion: reduce) {
- Props: `items=DEFAULT_ITEMS` (478), `startIndex=0` (479), `transition='melt'` (480), `duration=1.1` (481), `ease='power2.inOut'` (482), `intensity=0.55` (483), `scale=2.4` (484), `aberration=0.35` (485), `drift=0.4` (486), `autoplay=false` (487), `autoplayDelay=4` (488), `loop=true` (489), `radius=16` (490), `overlayColor='#000000'` (491), `showCaptions=true` (492), `showControls=true` (493), `showIndicators=true` (494), `className=''` (495)
- 裁决: 不做. 全屏场和控件状态机无关, 首页最多留一个主角效果, 不进默认包.

### Components/OptionWheel

- 文件: `Components/OptionWheel/OptionWheel.css` 46 行, `Components/OptionWheel/OptionWheel.jsx` 307 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 DEFAULT_ITEMS.
- 技法: DOM + rAF.
- 常数:
  - `OptionWheel.jsx:85` `const dt = Math.min((now - lastRef.current) / 1000, 0.05);`
  - `OptionWheel.jsx:89` `const k = 1 - Math.exp(-dt / tau);`
- 指针/滚动: wheel.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel.
- 减弱动效: 无. 源码没有 prefers-reduced-motion 或 useReducedMotion.
- Props: `items=DEFAULT_ITEMS` (22), `defaultSelected=3` (23), `onChange` (24), `textColor='#a6a6a6'` (25), `activeColor='#ffffff'` (26), `side='left'` (27), `fontSize=3` (28), `spacing=1.4` (29), `curve=1` (30), `tilt=6` (31), `blur=2` (32), `fade=0.25` (33), `minOpacity=0.05` (34), `smoothing=200` (35), `inset=80` (36), `loop=false` (37), `draggable=true` (38), `soundUrl=''` (39), `soundVolume=0.5` (40), `className=''` (41)
- 裁决: 不做. 和已选的弹簧, 发牌, 按位数字或拇指重复, 或只是装饰.

### Components/PillNav

- 文件: `Components/PillNav/PillNav.css` 460 行, `Components/PillNav/PillNav.jsx` 860 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 THEMES, SIZES, SURFACE, RIM, ROOT_RIM, LOGO.
- 技法: DOM + rAF.
- 常数:
  - `PillNav.css:160` `transition: color 0.25s ease;`
  - `PillNav.css:188` `transition: transform 0.36s cubic-bezier(0.22, 1, 0.36, 1);`
  - `PillNav.css:206` `transition: transform 0.36s cubic-bezier(0.22, 1, 0.36, 1);`
  - `PillNav.css:218` `transition-duration: 0.5s;`
  - `PillNav.css:224` `transition-duration: 0.5s;`
  - `PillNav.css:238` `transition: transform 0.36s cubic-bezier(0.4, 0, 0.2, 1);`
  - `PillNav.css:245` `transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);`
  - `PillNav.css:309` `transition: background-color 0.3s ease;`
  - `PillNav.css:356` `transform 0.45s cubic-bezier(0.22, 1, 0.36, 1),`
  - `PillNav.css:357` `top 0.45s cubic-bezier(0.22, 1, 0.36, 1);`
  - `PillNav.css:422` `transition: background-color 0.2s ease;`
  - `PillNav.jsx:111` `const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';`
  - `PillNav.jsx:331` `const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;`
  - `PillNav.jsx:360` `const steps = Math.ceil(dt / (1 / 240));`
  - `PillNav.jsx:369` `state.alpha += (1 - state.alpha) * (reduce ? 1 : 1 - Math.exp(-dt / 0.06));`
  - `PillNav.jsx:378` `state.alpha += (0 - state.alpha) * (reduce ? 1 : 1 - Math.exp(-dt / 0.07));`
  - `PillNav.jsx:383` `state.pop += (1 - state.pop) * (reduce ? 1 : 1 - Math.exp(-dt / 0.09));`
  - `PillNav.jsx:391` `state.pressVelocity += (-700 * (state.press - pressTarget) - 30 * state.pressVelocity) * dt;`
  - `PillNav.jsx:408` `const steps = Math.ceil(dt / (1 / 240));`
  - `PillNav.jsx:416` `state.dotAlpha += (1 - state.dotAlpha) * (reduce ? 1 : 1 - Math.exp(-dt / 0.1));`
  - `PillNav.jsx:420` `state.dotAlpha += (0 - state.dotAlpha) * (reduce ? 1 : 1 - Math.exp(-dt / 0.1));`
  - `PillNav.jsx:572` `{ duration: 700, delay, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'backwards' }`
  - `PillNav.jsx:583` `{ duration: 760, delay: 90, easing: EASE_OUT, fill: 'backwards' }`
  - `PillNav.jsx:599` `{ duration: 560, delay: 200 + index * 50, easing: EASE_OUT, fill: 'backwards' }`
  - `PillNav.jsx:624` `running.push(panel.animate([{ clipPath: start }, { clipPath: end }], { duration: 560, easing: EASE_OUT }));`
  - `PillNav.jsx:632` `{ duration: 420, delay: 90 + index * 40, easing: EASE_OUT, fill: 'backwards' }`
  - `PillNav.jsx:642` `duration: 380,`
  - `PillNav.jsx:643` `easing: 'cubic-bezier(0.4, 0, 0.2, 1)',`
  - `PillNav.jsx:649` `running.push(row.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' }));`
  - `PillNav.jsx:685` `duration: 900,`
  - `PillNav.jsx:686` `easing: 'cubic-bezier(0.65, 0, 0.25, 1)'`
- 指针/滚动: pointerup, pointercancel, pointerdown, keydown.
- 可中断: pointercancel 有监听.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; ResizeObserver.
- 减弱动效: 有. `451` @media (prefers-reduced-motion: reduce) {
- Props: `logo` (138), `logoAlt='Logo'` (139), `logoHref='#'` (140), `items=DEFAULT_ITEMS` (141), `activeHref` (142), `defaultActiveIndex=0` (143), `onItemClick` (144), `theme='dark'` (146), `layout='split'` (147), `size='md'` (148), `surface='glass'` (149), `itemStyle='pill'` (150), `hoverEffect='fill'` (151), `indicator='dot'` (152), `highlightColor` (153), `highlightTextColor` (154), `barColor` (155), `textColor` (156), `bounce=0.3` (157), `stretch=0.5` (158), `intro=true` (159), `collapse='auto'` (160), `onMenuToggle` (161), `ariaLabel='Main'` (162)
- 裁决: 采用. 运动层拿走它的积分, 错峰上限或测量指示器, 不拿走演示皮肤.

### Components/PixelCard

- 文件: `Components/PixelCard/PixelCard.css` 68 行, `Components/PixelCard/PixelCard.jsx` 591 行. 目录内实现已逐行扫描.
- 看起来: 2d 画布逐帧画. 命名常数 VARIANTS, SHAPES, TRIGGERS, APPEAR, EXIT.
- 技法: canvas2d + rAF.
- 常数:
  - `PixelCard.css:40` `transition: box-shadow 260ms ease;`
  - `PixelCard.jsx:38` `const SHAPES = { square: 0, circle: 1, diamond: 2 };`
  - `PixelCard.jsx:40` `const APPEAR = 0.26;`
  - `PixelCard.jsx:41` `const EXIT = 0.22;`
  - `PixelCard.jsx:45` `const smoothstep = (edge0, edge1, value) => {`
  - `PixelCard.jsx:161` `delay: new Float32Array(0),`
  - `PixelCard.jsx:179` `dt: 1 / 60,`
  - `PixelCard.jsx:189` `const ratio = Math.min(window.devicePixelRatio || 1, 2);`
  - `PixelCard.jsx:214` `state.delay = new Float32Array(count);`
  - `PixelCard.jsx:315` `const twinkle = reduce ? 0 : smoothstep(0, 100, s.speed) > 0 ? 1 : 0;`
  - `PixelCard.jsx:338` `const near = smoothstep(spotRadius, 0, Math.hypot(x - state.spotX, y - state.spotY));`
  - `PixelCard.jsx:379` `const dt = state.last ? Math.min(0.05, (now - state.last) / 1000) : 1 / 60;`
  - `PixelCard.jsx:399` `state.spotPower += (want - state.spotPower) * (1 - Math.exp(-(want ? 6 : 3) * dt));`
  - `PixelCard.jsx:400` `const stiffness = 120;`
  - `PixelCard.jsx:401` `const damping = 2 * Math.sqrt(stiffness) * 0.9;`
- 指针/滚动: pointerenter, pointermove, pointerleave, pointerdown, keydown.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; 读 devicePixelRatio; ResizeObserver.
- 减弱动效: 有. `140` const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
- Props: `variant='default'` (80), `colors` (81), `gap` (82), `speed` (83), `pixelSize=2` (84), `shape='square'` (85), `origin='center'` (86), `revealDuration=600` (87), `spotlight=0.5` (88), `glow=0.5` (89), `glowColor` (90), `opacity=1` (91), `fade=0` (92), `trigger='hover'` (93), `clickPulse=true` (94), `intro=true` (95), `introDelay=0` (96), `noFocus` (97), `theme='dark'` (98), `radius=24` (99), `className=''` (100), `style` (101), `children` (102)
- 裁决: 不做. 和已选的弹簧, 发牌, 按位数字或拇指重复, 或只是装饰.

### Components/ProfileCard

- 文件: `Components/ProfileCard/ProfileCard.css` 367 行, `Components/ProfileCard/ProfileCard.jsx` 370 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 THEMES, FOILS, GRAIN.
- 技法: SVG + rAF.
- 常数:
  - `ProfileCard.css:318` `filter 0.2s ease,`
  - `ProfileCard.css:319` `transform 0.2s ease;`
  - `ProfileCard.css:325` `transition-duration: 0s;`
  - `ProfileCard.jsx:135` `const dt = Math.min(0.05, (now - last) / 1000 || 0);`
  - `ProfileCard.jsx:138` `const stiffness = slow ? 24 : 120;`
  - `ProfileCard.jsx:139` `const damping = slow ? 9 : 16;`
  - `ProfileCard.jsx:140` `const steps = Math.max(1, Math.ceil(dt / (1 / 120)));`
  - `ProfileCard.jsx:149` `light.p += (light.target - light.p) * (1 - Math.exp(-dt / tau));`
- 指针/滚动: pointerenter, pointermove, pointerleave, pointerdown, pointerup, pointercancel, deviceorientation, click.
- 可中断: pointercancel 有监听.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; ResizeObserver.
- 减弱动效: 有. `104` const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
- Props: `avatarUrl=''` (70), `iconUrl` (71), `miniAvatarUrl` (72), `name='Javi A. Torres'` (73), `title='Software Engineer'` (74), `handle='javicodes'` (75), `status='Online'` (76), `statusColor='#22c55e'` (77), `contactText='Contact'` (78), `showUserInfo=true` (79), `onContactClick` (80), `theme='dark'` (81), `backdropColor` (82), `radius=16` (83), `holo=0.8` (84), `glare=0.5` (85), `enableTilt=true` (86), `tiltStrength=12` (87), `parallax=8` (88), `enableMobileTilt=false` (89), `mobileTiltSensitivity=5` (90), `intro=true` (91), `className=''` (92)
- 裁决: 借鉴. 减弱动效和可中断是真的, 只取这条状态机, 不取视觉主题.

### Components/ReflectiveCard

- 文件: `Components/ReflectiveCard/ReflectiveCard.css` 177 行, `Components/ReflectiveCard/ReflectiveCard.jsx` 1052 行. 目录内实现已逐行扫描.
- 看起来: 着色器场, uniform 有 uVideo, uCam, uVideoMap, uCamMap, uWeights, uLod, uTexture, uStep. 命名常数 THEMES, VIEW_DISTANCE, OVERSCAN, INTRO_MS, FADE_SECONDS, VERTEX.
- 技法: WebGL + rAF.
- 常数:
  - `ReflectiveCard.jsx:36` `const VIEW_DISTANCE = 900;`
  - `ReflectiveCard.jsx:37` `const OVERSCAN = 1.2;`
  - `ReflectiveCard.jsx:38` `const INTRO_MS = 1400;`
  - `ReflectiveCard.jsx:39` `const FADE_SECONDS = 0.35;`
  - `ReflectiveCard.jsx:65` `float mean = 0.0;`
  - `ReflectiveCard.jsx:90` `float falloff = -0.5 / (uSigma * uSigma);`
  - `ReflectiveCard.jsx:92` `float total = 1.0;`
  - `ReflectiveCard.jsx:130` `const float CONTENT = 46.0;`
  - `ReflectiveCard.jsx:180` `float s = 1.4142136 * max(sigma, 0.0001);`
  - `ReflectiveCard.jsx:200` `float fall = smoothstep(-0.55, 0.5, q.y);`
  - `ReflectiveCard.jsx:249` `float chamfer = chamferWidth > 0.01 ? 1.0 - smoothstep(0.0, chamferWidth, -d) : 0.0;`
  - `ReflectiveCard.jsx:709` `source.mix += (target - source.mix) * (1 - Math.exp(-dt / FADE_SECONDS));`
  - `ReflectiveCard.jsx:717` `size.scale = Math.min(window.devicePixelRatio || 1, 2);`
  - `ReflectiveCard.jsx:730` `const dt = Math.min(0.05, (now - last) / 1000 || 0);`
  - `ReflectiveCard.jsx:733` `const stiffness = slow ? 24 : 120;`
  - `ReflectiveCard.jsx:734` `const damping = slow ? 9 : 16;`
  - `ReflectiveCard.jsx:735` `const steps = Math.max(1, Math.ceil(dt / (1 / 120)));`
  - `ReflectiveCard.jsx:744` `light.p += (light.target - light.p) * (1 - Math.exp(-dt / tau));`
- 指针/滚动: pointerenter, pointermove, pointerleave, pointerdown, pointerup, pointercancel, webglcontextlost, webglcontextrestored, visibilitychange.
- 可中断: pointercancel 有监听.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; 读 devicePixelRatio; 离屏或隐藏时有暂停线索; ResizeObserver.
- 减弱动效: 有. `622` if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
- Props: `name='Alexander Doe'` (553), `role='Senior Developer'` (554), `badge='Verified'` (555), `status='Active'` (556), `statusColor='#22c55e'` (557), `idLabel='ID number'` (558), `idValue='8901 2345 6789'` (559), `children` (560), `theme='dark'` (561), `videoSrc` (562), `webcam=false` (563), `onWebcamError` (564), `tint='#ffffff'` (565), `metalness=1` (566), `roughness=0.3` (567), `blurStrength=6` (568), `grayscale=1` (569), `warp=0.6` (570), `warpScale=1` (571), `shine=1` (572), `bevel=3` (573), `glare=0.5` (574), `enableTilt=true` (575), `tiltStrength=12` (576)
- 裁决: 不做. 全屏场和控件状态机无关, 首页最多留一个主角效果, 不进默认包.

### Components/ScrollStack

- 文件: `Components/ScrollStack/ScrollStack.css` 45 行, `Components/ScrollStack/ScrollStack.jsx` 337 行. 目录内实现已逐行扫描.
- 看起来: DOM + rAF.
- 技法: DOM + rAF.
- 常数:
  - `ScrollStack.jsx:200` `const dt = Math.min(0.05, (now - last) / 1000);`
  - `ScrollStack.jsx:208` `current += (goal - current) * (1 - Math.pow(0.9, dt * 60));`
- 指针/滚动: scroll, wheel, pointerdown, pointerup, pointercancel, resize.
- 可中断: pointercancel 有监听.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; ResizeObserver.
- 减弱动效: 有. `86` const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
- Props: `children` (35), `className=''` (36), `itemDistance=100` (37), `itemStackDistance=24` (38), `stackPosition='15%'` (39), `itemScale=0.05` (40), `baseScale=0.8` (41), `dimAmount=0.2` (42), `blurAmount=0` (43), `tiltAmount=0` (44), `rotationAmount=0` (45), `holdDistance=200` (46), `smoothScroll=true` (47), `snap=false` (48), `useWindowScroll=false` (49), `onStackComplete` (50)
- 裁决: 借鉴. 减弱动效和可中断是真的, 只取这条状态机, 不取视觉主题.

### Components/SpecularButton

- 文件: `Components/SpecularButton/SpecularButton.css` 81 行, `Components/SpecularButton/SpecularButton.jsx` 455 行. 目录内实现已逐行扫描.
- 看起来: 着色器场, uniform 有 uCenter, uHalf, uRadius, uPx, uSpot, uEntry, uLineColor, uBaseColor. 命名常数 PAD, TAU, VERTEX, FRAGMENT, UNIFORMS.
- 技法: WebGL + canvas2d + rAF.
- 常数:
  - `SpecularButton.css:29` `transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);`
  - `SpecularButton.jsx:7` `const PAD = 24;`
  - `SpecularButton.jsx:39` `float arc = 1.5707963 * r;`
  - `SpecularButton.jsx:53` `return 1.0 - smoothstep(uWindow.x, uWindow.x + uWindow.y, gap);`
  - `SpecularButton.jsx:64` `float band = smoothstep(-width - 0.6, -width + 0.6, d) * (1.0 - smoothstep(-0.6, 0.6, d));`
  - `SpecularButton.jsx:65` `float hair = smoothstep(-uPx - 0.6, -uPx + 0.6, d) * (1.0 - smoothstep(-0.6, 0.6, d));`
  - `SpecularButton.jsx:66` `float inside = 1.0 - smoothstep(-0.6, 0.6, d);`
  - `SpecularButton.jsx:326` `const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;`
  - `SpecularButton.jsx:341` `state.spot = wrap(state.spot + diff * (1 - Math.exp(-dt * 8)));`
  - `SpecularButton.jsx:344` `state.level += (level - state.level) * (1 - Math.exp(-dt * 7));`
  - `SpecularButton.jsx:345` `state.press *= Math.exp(-dt * 5);`
  - `SpecularButton.jsx:360` `view.ratio = Math.min(window.devicePixelRatio || 1, 3);`
- 指针/滚动: pointermove, pointerup, pointercancel, pointerleave, pointerdown.
- 可中断: pointercancel 有监听.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; 读 devicePixelRatio; ResizeObserver.
- 减弱动效: 有. `243` const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
- Props: `children='Get Started'` (170), `size='lg'` (171), `radius=18` (172), `tint='#ffffff'` (173), `tintOpacity=0.04` (174), `blur=0` (175), `textColor='#f5f5f5'` (176), `lineColor='#ffffff'` (177), `baseColor='#525252'` (178), `intensity=1` (179), `idleIntensity=0.35` (180), `shineSize=10` (181), `shineFade=34` (182), `thickness=1.2` (183), `glow=1` (184), `speed=0.35` (185), `followMouse=true` (186), `proximity=250` (187), `autoAnimate=false` (188), `disabled=false` (189), `onClick` (190), `className=''` (191), `type='button'` (192), `style` (193)
- 裁决: 不做. 全屏场和控件状态机无关, 首页最多留一个主角效果, 不进默认包.

### Components/SpotlightCard

- 文件: `Components/SpotlightCard/SpotlightCard.css` 51 行, `Components/SpotlightCard/SpotlightCard.jsx` 288 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 THEMES, SHAPES, NOISE.
- 技法: DOM + rAF.
- 常数:
  - `SpotlightCard.jsx:147` `const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));`
  - `SpotlightCard.jsx:176` `const follow = reduce || s.smoothing === 0 ? 1 : 1 - Math.exp(-dt / (0.015 + s.smoothing * 0.22));`
  - `SpotlightCard.jsx:179` `const fade = reduce ? 1 : 1 - Math.exp(-dt / (target > state.presence ? 0.1 : 0.32));`
  - `SpotlightCard.jsx:183` `state.flare += (press - state.flare) * (1 - Math.exp(-dt / (press ? 0.05 : 0.28)));`
- 指针/滚动: pointermove, pointerup, pointercancel, scroll, pointerout, pointerdown, focusin, focusout.
- 可中断: pointercancel 有监听.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver.
- 减弱动效: 有. `102` const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
- Props: `children` (50), `className=''` (51), `style` (52), `spotlightColor` (53), `intensity=0.15` (54), `spotlightSize=240` (55), `softness=0.7` (56), `shape='circle'` (57), `borderGlow=0.6` (58), `proximity=80` (59), `smoothing=0.3` (60), `ambient=false` (61), `flare=true` (62), `grain=0` (63), `theme='dark'` (64)
- 裁决: 借鉴. 减弱动效和可中断是真的, 只取这条状态机, 不取视觉主题.
