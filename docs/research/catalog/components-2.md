# react-bits Components-2

来源提交 `4dc7b5b`. 每个目录的实现文件逐行扫描后摘运动行.

### Components/Stack

- 文件: `Components/Stack/Stack.css` 50 行, `Components/Stack/Stack.jsx` 551 行. 目录内实现已逐行扫描.
- 看起来: motion 的 spring 或 animate. 自己做 force, velocity, dt 积分. 命名常数 DEFAULT_IMAGES, ORIGINS, EXITS, SHADOW, CLICK_SLOP, FLICK_SPEED.
- 技法: DOM + motion + 自写积分.
- 常数:
  - `Stack.jsx:15` `const ORIGINS = { fan: [0.9, 0.9], cascade: [0.5, 0.5], deck: [0.5, 0], pile: [0.5, 0.5] };`
  - `Stack.jsx:16` `const EXITS = { fan: [1, -0.3], cascade: [0.8, 0.6], deck: [0, 1] };`
  - `Stack.jsx:17` `const SHADOW = '0 14px 34px -10px rgba(0, 0, 0, 0.45), 0 3px 8px -2px rgba(0, 0, 0, 0.18)';`
  - `Stack.jsx:18` `const CLICK_SLOP = 6;`
  - `Stack.jsx:19` `const FLICK_SPEED = 650;`
  - `Stack.jsx:20` `const LEAN_SPEED = 1300;`
  - `Stack.jsx:21` `const LEAN_REACH = 260;`
  - `Stack.jsx:22` `const PRESS_SCALE = 1.035;`
  - `Stack.jsx:81` `threshold = 90,`
  - `Stack.jsx:128` `threshold: Math.max(threshold, 0),`
  - `Stack.jsx:168` `if (s.reduceMotion) return { duration: 0.2, ease: 'easeOut', delay: extra.delay || 0 };`
  - `Stack.jsx:180` `const settleFace = (values, s, delay = 0) => {`
  - `Stack.jsx:188` `const placeCard = (index, position, { delay = 0, lift = 0, kind = 'place', velocity = null, keepZ = false } = {}) => {`
  - `Stack.jsx:201` `const fade = { duration: s.reduceMotion ? 0.2 : 0.35 / s.speed, ease: 'easeOut', delay };`
  - `Stack.jsx:203` `animate(values.x, target.x, velocity ? { ...motionSpring, velocity: velocity[0] } : motionSpring);`
  - `Stack.jsx:204` `animate(values.y, target.y, velocity ? { ...motionSpring, velocity: velocity[1] } : motionSpring);`
  - `Stack.jsx:212` `const placeAll = ({ stagger = 0, lift = 0, released = -1, velocity = null, kind = 'place' } = {}) => {`
  - `Stack.jsx:261` `animate(values.x, out[0], velocity ? { ...launch, velocity: velocity[0] } : launch);`
  - `Stack.jsx:262` `animate(values.y, out[1], velocity ? { ...launch, velocity: velocity[1] } : launch);`
  - `Stack.jsx:358` `const progress = clamp(Math.hypot(dx, dy) / Math.max(s.threshold, 1), 0, 1);`
  - `Stack.jsx:391` `if (event.type === 'pointerup' && s.count > 1 && (distance > s.threshold || flick)) {`
  - `Stack.jsx:449` `actionsRef.current.placeAll({ stagger: mountedRef.current ? 0 : 0.06 });`
- 指针/滚动: pointermove, pointerup, pointercancel.
- 可中断: pointercancel 有监听. 弹簧保留速度, 每帧重算目标.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 未见 cancel.
- 减弱动效: 有. `4` import { animate, motion, motionValue, useReducedMotion } from 'motion/react';
- Props: `cards` (71), `layout='fan'` (72), `visible=4` (73), `spread=0.5` (74), `depth=0.5` (75), `radius=16` (76), `frame=0` (77), `frameColor='#ffffff'` (78), `shadow=true` (79), `tilt=30` (80), `threshold=90` (81), `speed=1` (82), `sendToBackOnClick=false` (83), `autoplay=false` (84), `autoplayDelay=3000` (85), `pauseOnHover=false` (86), `onChange` (87), `className=''` (88), `style` (89)
- 裁决: 借鉴. 指针场的半径和回弹值得留在招牌效果里, 不铺到每个控件.

### Components/StaggeredMenu

- 文件: `Components/StaggeredMenu/StaggeredMenu.css` 360 行, `Components/StaggeredMenu/StaggeredMenu.jsx` 448 行. 目录内实现已逐行扫描.
- 看起来: GSAP 时间轴驱动进入或离开.
- 技法: DOM + gsap.
- 常数:
  - `StaggeredMenu.css:245` `color 0.3s ease,`
  - `StaggeredMenu.css:246` `opacity 0.3s ease;`
  - `StaggeredMenu.css:289` `transition: opacity 0.3s ease;`
  - `StaggeredMenu.jsx:113` `tl.fromTo(ls.el, { xPercent: ls.start }, { xPercent: 0, duration: 0.5, ease: 'power4.out' }, i * 0.07);`
  - `StaggeredMenu.jsx:121` `{ xPercent: 0, duration: panelDuration, ease: 'power4.out' },`
  - `StaggeredMenu.jsx:133` `duration: 1,`
  - `StaggeredMenu.jsx:134` `ease: 'power4.out',`
  - `StaggeredMenu.jsx:135` `stagger: { each: 0.1, from: 'start' }`
  - `StaggeredMenu.jsx:143` `duration: 0.6,`
  - `StaggeredMenu.jsx:144` `ease: 'power2.out',`
  - `StaggeredMenu.jsx:146` `stagger: { each: 0.08, from: 'start' }`
  - `StaggeredMenu.jsx:160` `duration: 0.5,`
  - `StaggeredMenu.jsx:161` `ease: 'power2.out'`
  - `StaggeredMenu.jsx:172` `duration: 0.55,`
  - `StaggeredMenu.jsx:173` `ease: 'power3.out',`
  - `StaggeredMenu.jsx:174` `stagger: { each: 0.08, from: 'start' },`
  - `StaggeredMenu.jsx:216` `duration: 0.32,`
  - `StaggeredMenu.jsx:217` `ease: 'power3.in',`
  - `StaggeredMenu.jsx:242` `spinTweenRef.current = gsap.to(icon, { rotate: 225, duration: 0.8, ease: 'power4.out', overwrite: 'auto' });`
  - `StaggeredMenu.jsx:244` `spinTweenRef.current = gsap.to(icon, { rotate: 0, duration: 0.35, ease: 'power3.inOut', overwrite: 'auto' });`
  - `StaggeredMenu.jsx:257` `delay: 0.18,`
  - `StaggeredMenu.jsx:258` `duration: 0.3,`
  - `StaggeredMenu.jsx:259` `ease: 'power2.out'`
  - `StaggeredMenu.jsx:302` `duration: 0.5 + lineCount * 0.07,`
  - `StaggeredMenu.jsx:303` `ease: 'power4.out'`
- 指针/滚动: mousedown.
- 可中断: GSAP 时间轴可 reverse 或 kill, 改 props 通常拆掉重建. 时间轴, 不保留指针速度.
- 性能: 无自管循环. 交给 CSS 或库..
- 减弱动效: 无. 源码没有 prefers-reduced-motion 或 useReducedMotion.
- Props: `position='right'` (8), `colors=['#B497CF'` (9), `items=[]` (10), `socialItems=[]` (11), `displaySocials=true` (12), `displayItemNumbering=true` (13), `className` (14), `logoUrl='/src/assets/logos/reactbits-gh-white.svg'` (15), `menuButtonColor='#fff'` (16), `openMenuButtonColor='#fff'` (17), `accentColor='#5227FF'` (18), `changeMenuColorOnOpen=true` (19), `isFixed=false` (20), `closeOnClickAway=true` (21), `onMenuOpen` (22), `onMenuClose` (23)
- 裁决: 不做. 和已选的弹簧, 发牌, 按位数字或拇指重复, 或只是装饰.

### Components/Stepper

- 文件: `Components/Stepper/Stepper.css` 430 行, `Components/Stepper/Stepper.jsx` 504 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 THEMES, SPRING, SETTLE.
- 技法: DOM.
- 常数:
  - `Stepper.css:86` `transition: background-color 0.2s ease;`
  - `Stepper.css:107` `background-color 0.15s ease,`
  - `Stepper.css:108` `box-shadow 0.15s ease,`
  - `Stepper.css:109` `color 0.15s ease;`
  - `Stepper.css:145` `transition: color 0.2s ease;`
  - `Stepper.css:203` `background-color 0.25s ease,`
  - `Stepper.css:204` `transform 0.45s var(--stepper-spring);`
  - `Stepper.css:247` `transition: transform 560ms var(--stepper-spring);`
  - `Stepper.css:294` `grid-template-rows 480ms var(--stepper-spring),`
  - `Stepper.css:295` `opacity 0.2s ease;`
  - `Stepper.css:335` `filter 0.2s ease,`
  - `Stepper.css:336` `transform 0.2s ease,`
  - `Stepper.css:337` `opacity 0.2s ease;`
  - `Stepper.css:354` `opacity 0.2s ease,`
  - `Stepper.css:421` `transition-duration: 0s;`
  - `Stepper.css:428` `transition-duration: 0.01ms;`
  - `Stepper.jsx:60` `const SETTLE = 'cubic-bezier(0.22, 1, 0.36, 1)';`
  - `Stepper.jsx:81` `: 'cubic-bezier(0.34, 1.4, 0.64, 1)';`
  - `Stepper.jsx:92` `duration: 360,`
  - `Stepper.jsx:249` `duration: reduced ? 200 : 560,`
  - `Stepper.jsx:258` `duration: 560,`
  - `Stepper.jsx:263` `duration: 420,`
  - `Stepper.jsx:269` `duration: 140,`
  - `Stepper.jsx:270` `easing: 'cubic-bezier(0.2, 0, 0.4, 1)',`
  - `Stepper.jsx:275` `{ duration: 200, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' }`
  - `Stepper.jsx:290` `? 'transform 560ms ${spring}, width 560ms ${spring}, height 560ms ${spring}, opacity 200ms ease'`
  - `Stepper.jsx:291` `: 'opacity 200ms ease';`
- 指针/滚动: 无指针监听.
- 可中断: 时间轴或 CSS, 不可中途保留速度.
- 性能: 无自管循环. 交给 CSS 或库.; ResizeObserver.
- 减弱动效: 有. `424` @media (prefers-reduced-motion: reduce) {
- Props: `children` (109), `step` (110), `initialStep=1` (111)
- 裁决: 借鉴. 指针场的半径和回弹值得留在招牌效果里, 不铺到每个控件.

### Components/TiltedCard

- 文件: `Components/TiltedCard/TiltedCard.css` 170 行, `Components/TiltedCard/TiltedCard.jsx` 561 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 FLIP_THRESHOLD.
- 技法: DOM + rAF.
- 常数:
  - `TiltedCard.jsx:6` `const FLIP_THRESHOLD = 6;`
  - `TiltedCard.jsx:31` `const steps = Math.max(1, Math.ceil(dt / (1 / 240)));`
  - `TiltedCard.jsx:174` `const dt = clamp((now - last) / 1000 || 0, 0, 0.05);`
  - `TiltedCard.jsx:191` `tilt.baseGamma += (tilt.gamma - tilt.baseGamma) * (1 - Math.exp(-dt / 4));`
  - `TiltedCard.jsx:192` `tilt.baseBeta += (tilt.beta - tilt.baseBeta) * (1 - Math.exp(-dt / 4));`
  - `TiltedCard.jsx:220` `busy = step(state, 'lift', lifted, omega, Math.max(zeta, 0.85), dt) || busy;`
  - `TiltedCard.jsx:221` `busy = step(state, 'flip', s.flipped ? 180 : 0, reduced ? 18 : 9.5, 0.72, dt) || busy;`
  - `TiltedCard.jsx:222` `busy = step(state, 'press', press.active && !press.moved && s.interactive ? 1 : 0, 26, 0.8, dt) || busy;`
  - `TiltedCard.jsx:224` `opacity = Math.min(1, opacity + dt / 0.45);`
  - `TiltedCard.jsx:262` `busy = step(state, 'shown', show, 16, 1, dt) || busy;`
  - `TiltedCard.jsx:263` `const follow = 1 - Math.exp(-dt / 0.035);`
  - `TiltedCard.jsx:267` `pointer.vx *= Math.exp(-dt / 0.08);`
  - `TiltedCard.jsx:268` `busy = step(state, 'tip', reduced ? 0 : clamp(-pointer.vx * 0.012, -14, 14), 18, 0.62, dt) || busy;`
- 指针/滚动: pointerenter, pointermove, pointerleave, pointerdown, focus, blur, pointerup, pointercancel, deviceorientation.
- 可中断: pointercancel 有监听.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver.
- 减弱动效: 有. `129` const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
- Props: `imageSrc` (52), `altText='Tilted card image'` (53), `captionText=''` (54), `containerHeight='300px'` (55), `containerWidth='100%'` (56), `imageHeight='300px'` (57), `imageWidth='300px'` (58), `scaleOnHover=1.05` (59), `rotateAmplitude=12` (60), `showTooltip=true` (61), `overlayContent=null` (62), `displayOverlayContent=false` (63), `overlayDepth=30` (64), `children` (65), `backContent=null` (66), `flipOnClick=true` (67), `flipped` (68), `onFlip` (69), `radius=15` (70), `perspective=800` (71), `smoothness=0.6` (72), `glare=0.5` (73), `glareColor='#ffffff'` (74), `shadow=0.5` (75)
- 裁决: 借鉴. 减弱动效和可中断是真的, 只取这条状态机, 不取视觉主题.
