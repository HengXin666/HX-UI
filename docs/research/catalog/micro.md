# react-bits Micro

来源提交 `4dc7b5b`. 每个目录的实现文件逐行扫描后摘运动行.

### Micro/BellToggle

- 文件: `Micro/BellToggle/BellToggle.css` 237 行, `Micro/BellToggle/BellToggle.jsx` 257 行. 目录内实现已逐行扫描.
- 看起来: motion 的 spring 或 animate. 命名常数 SPRING_UI, SEG_EASE, WARP, SIZES, WOBBLE, BELL_BODY.
- 技法: SVG + motion.
- 常数:
  - `BellToggle.css:18` `--bt-ease-out: cubic-bezier(0.23, 1, 0.32, 1);`
  - `BellToggle.css:26` `transition: transform 160ms var(--bt-ease-out);`
  - `BellToggle.css:166` `transform 180ms var(--bt-ease-out),`
  - `BellToggle.css:167` `opacity 140ms ease;`
  - `BellToggle.css:174` `transform 280ms cubic-bezier(0.34, 1.56, 0.64, 1),`
  - `BellToggle.css:175` `opacity 120ms ease;`
  - `BellToggle.css:183` `opacity 200ms ease,`
  - `BellToggle.css:184` `transform 200ms var(--bt-ease-out);`
  - `BellToggle.css:229` `transition: opacity 140ms ease;`
  - `BellToggle.css:234` `transition: opacity 200ms ease;`
  - `BellToggle.jsx:9` `const SPRING_UI = { type: 'spring', duration: 0.3, bounce: 0 };`
  - `BellToggle.jsx:10` `const SEG_EASE = 'cubic-bezier(0.77, 0, 0.175, 1)';`
  - `BellToggle.jsx:11` `const WARP = 0.6;`
  - `BellToggle.jsx:12` `const SIZES = { sm: [36, 12.5, 14, 15, 8], md: [44, 13.5, 16, 19, 9], lg: [52, 15, 18, 23, 10] };`
  - `BellToggle.jsx:13` `const WOBBLE = { amplitude: 0.4, passes: 3, duration: 420 };`
  - `BellToggle.jsx:14` `const BELL_BODY = 'M6 16.5V10a6 6 0 0 1 12 0v6.5l1.6 2.3H4.4L6 16.5z';`
  - `BellToggle.jsx:18` `const frames = [{ transform: 'rotate(${from}deg)', offset: 0, easing: SEG_EASE }];`
  - `BellToggle.jsx:21` `frames.push({ transform: 'rotate(${angle.toFixed(2)}deg)', offset: passOffset(k, passes), easing: SEG_EASE });`
  - `BellToggle.jsx:108` `delay: 70,`
  - `BellToggle.jsx:123` `{ duration: 380, delay: passOffset(k, passes) * duration, easing: 'ease-out' }`
  - `BellToggle.jsx:132` `if (pointer) spring.current = animate(t, on ? 1 : 0, { ...SPRING_UI, bounce: revealBounce });`
- 指针/滚动: 无指针监听.
- 可中断: 时间轴或 CSS, 不可中途保留速度.
- 性能: 无自管循环. 交给 CSS 或库.; ResizeObserver.
- 减弱动效: 有. `217` @media (prefers-reduced-motion: reduce) {
- Props: `offLabel='Notify me'` (34), `onLabel="You'll be notified"` (35), `icon` (36), `label` (37), `color='#f5f5f5'` (38), `background='#27272a'` (39), `onColor='#18181b'` (40), `onBackground='#f5f5f5'` (41), `size='md'` (42), `radius=22` (43), `ringAmplitude=17` (44), `ringPasses=5` (45), `ringDecay=1` (46), `ringDuration=820` (47), `ringPivot=16` (48), `crossfadeMs=200` (49), `revealBounce=0` (50), `count=0` (51), `badge=true` (52), `badgeColor='#ef4444'` (53), `badgeTextColor='#ffffff'` (54), `waves=true` (55), `clapper=false` (56), `pressed` (57)
- 裁决: 控件教材. 按下, 松开, 拖拽或吸附是分开的, 常数写进对应控件合同, 不整件移植.

### Micro/BranchedMenu

- 文件: `Micro/BranchedMenu/BranchedMenu.css` 195 行, `Micro/BranchedMenu/BranchedMenu.jsx` 213 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 DEFAULT_ITEMS, PAD, MARK.
- 技法: SVG.
- 常数:
  - `BranchedMenu.css:12` `--bm-ease-out: cubic-bezier(0.23, 1, 0.32, 1);`
  - `BranchedMenu.css:49` `top 220ms var(--bm-ease-out),`
  - `BranchedMenu.css:50` `opacity 150ms ease;`
  - `BranchedMenu.css:76` `transition: color 200ms ease;`
  - `BranchedMenu.css:118` `transition: opacity 200ms ease;`
  - `BranchedMenu.css:123` `transition: opacity 250ms ease 100ms;`
  - `BranchedMenu.css:160` `transition: color 200ms ease;`
  - `BranchedMenu.css:185` `transition: opacity 150ms ease;`
  - `BranchedMenu.jsx:37` `const PAD = 6;`
  - `BranchedMenu.jsx:38` `const MARK = 16;`
- 指针/滚动: 无指针监听.
- 可中断: 时间轴或 CSS, 不可中途保留速度.
- 性能: 无自管循环. 交给 CSS 或库.; ResizeObserver.
- 减弱动效: 有. `183` @media (prefers-reduced-motion: reduce) {
- Props: `items=DEFAULT_ITEMS` (44), `defaultOpen=0` (45), `defaultActive=''` (46), `onSelect` (47), `onToggle` (48), `color='#f5f5f5'` (49), `accentColor='#f5f5f5'` (50), `lineColor='#3f3f46'` (51), `width=240` (52), `rowHeight=36` (53), `indent=40` (54), `trunk=14` (55), `radius=10` (56), `lineWidth=1.5` (57), `fontSize=14` (58), `drawDuration=400` (59), `foldDuration=300` (60), `className=''` (61)
- 裁决: 控件教材. 按下, 松开, 拖拽或吸附是分开的, 常数写进对应控件合同, 不整件移植.

### Micro/CallChip

- 文件: `Micro/CallChip/CallChip.css` 181 行, `Micro/CallChip/CallChip.jsx` 211 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 HOLD_AT, SHAKE, ICONS, WORDS.
- 技法: DOM + rAF.
- 常数:
  - `CallChip.css:15` `--cc-ease-out: cubic-bezier(0.23, 1, 0.32, 1);`
  - `CallChip.css:34` `transition: transform 160ms var(--cc-ease-out);`
  - `CallChip.css:63` `transform 200ms var(--cc-ease-out),`
  - `CallChip.css:64` `background-color 120ms ease,`
  - `CallChip.css:65` `clip-path 400ms var(--cc-ease-out) 200ms;`
  - `CallChip.css:70` `transition: background-color 200ms ease;`
  - `CallChip.css:101` `opacity 240ms var(--cc-ease-out),`
  - `CallChip.css:102` `transform 240ms var(--cc-ease-out),`
  - `CallChip.css:103` `filter 240ms var(--cc-ease-out);`
  - `CallChip.css:109` `opacity 160ms var(--cc-ease-out),`
  - `CallChip.css:110` `transform 160ms var(--cc-ease-out),`
  - `CallChip.css:111` `filter 160ms var(--cc-ease-out);`
  - `CallChip.css:170` `transition: background-color 120ms ease;`
  - `CallChip.jsx:16` `const HOLD_AT = 0.9;`
  - `CallChip.jsx:18` `const ICONS = { terminal: CommandLineIcon, file: File02Icon, search: Search01Icon, edit: PencilEdit01Icon };`
  - `CallChip.jsx:85` `SHAKE.map(k => ({ transform: 'translateX(${k * shake}px)', easing: 'cubic-bezier(0.77, 0, 0.175, 1)' })),`
  - `CallChip.jsx:86` `{ duration: 450, composite: 'add' }`
- 指针/滚动: 无指针监听.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel.
- 减弱动效: 有. `167` @media (prefers-reduced-motion: reduce) {
- Props: `icon='terminal'` (26), `name='bash'` (27), `argument='npm test'` (28), `status='running'` (29), `expectedMs=2500` (30), `size=34` (31), `radius=10` (32), `color='currentColor'` (33), `surfaceColor='#27272a'` (34), `progressColor='currentColor'` (35), `progressOpacity=0.08` (36), `doneColor='#22c55e'` (37), `errorColor='#ef4444'` (38), `washOpacity=0.14` (39), `shake=6` (40), `showTimer=true` (41), `onRetry` (42), `className=''` (43), `style` (44)
- 裁决: 控件教材. 按下, 松开, 拖拽或吸附是分开的, 常数写进对应控件合同, 不整件移植.

### Micro/CodeSlots

- 文件: `Micro/CodeSlots/CodeSlots.css` 185 行, `Micro/CodeSlots/CodeSlots.jsx` 459 行. 目录内实现已逐行扫描.
- 看起来: motion 的 spring 或 animate. 命名常数 EASE_OUT, WASH_IN, WASH_OUT, SINK_DELAY, SINK_STEP, CHECK_DELAY.
- 技法: DOM + motion.
- 常数:
  - `CodeSlots.css:24` `transition: opacity 200ms ease;`
  - `CodeSlots.css:74` `transition: background-color 200ms ease;`
  - `CodeSlots.css:85` `transition: background-color 200ms ease;`
  - `CodeSlots.css:170` `transition: opacity 150ms ease;`
  - `CodeSlots.css:179` `transition: opacity 200ms ease;`
  - `CodeSlots.jsx:11` `const WASH_IN = 0.3;`
  - `CodeSlots.jsx:12` `const WASH_OUT = 0.2;`
  - `CodeSlots.jsx:13` `const SINK_DELAY = 0.06;`
  - `CodeSlots.jsx:14` `const SINK_STEP = 0.03;`
  - `CodeSlots.jsx:15` `const CHECK_DELAY = 0.28;`
  - `CodeSlots.jsx:16` `const CHECK_RISE = 8;`
  - `CodeSlots.jsx:17` `const SINK_FADE = 0.6;`
  - `CodeSlots.jsx:102` `animate(mv, to, { type: 'spring', duration: L.settle, bounce: L.bounce, delay: delayMs / 1000 });`
  - `CodeSlots.jsx:304` `animate(openMv, 1, { duration: WASH_IN, ease: EASE_OUT });`
  - `CodeSlots.jsx:306` `animate(d, 1, { type: 'spring', duration: 0.3, bounce: 0, delay: SINK_DELAY + k * SINK_STEP })`
  - `CodeSlots.jsx:308` `animate(checkMv, 1, { type: 'spring', duration: 0.35, bounce: L.bounce, delay: CHECK_DELAY });`
  - `CodeSlots.jsx:319` `animate(checkMv, 0, { duration: 0.15, ease: EASE_OUT });`
  - `CodeSlots.jsx:320` `animate(openMv, 0, { duration: WASH_OUT, ease: EASE_OUT, delay: 0.06 }).then(() => {`
  - `CodeSlots.jsx:323` `drops.forEach(d => animate(d, 0, { type: 'spring', duration: 0.3, bounce: 0, delay: 0.1 }));`
- 指针/滚动: 无指针监听.
- 可中断: GSAP 时间轴可 reverse 或 kill, 改 props 通常拆掉重建.
- 性能: 无自管循环. 交给 CSS 或库..
- 减弱动效: 有. `166` @media (prefers-reduced-motion: reduce) {
- Props: `length=6` (32), `value` (33), `defaultValue=''` (34), `onChange` (35), `onComplete` (36), `status='idle'` (37), `mask=false` (38), `caret=true` (39), `disabled=false` (40), `autoFocus=false` (41), `accentColor='#f5f5f5'` (42), `inkColor='#f5f5f5'` (43), `slotColor='#27272a'` (44), `digitColor='#18181b'` (45), `dangerColor='#ff3b30'` (46), `slotSize=44` (47), `gap=8` (48), `radius=12` (49), `bounce=0.2` (50), `settle=0.3` (51), `rise=8` (52), `cascade=20` (53), `ariaLabel='One-time code'` (54), `className=''` (55)
- 裁决: 控件教材. 按下, 松开, 拖拽或吸附是分开的, 常数写进对应控件合同, 不整件移植.

### Micro/CometDial

- 文件: `Micro/CometDial/CometDial.css` 89 行, `Micro/CometDial/CometDial.jsx` 381 行. 目录内实现已逐行扫描.
- 看起来: motion 的 spring 或 animate. 自己做 force, velocity, dt 积分. 命名常数 DEAD, V_FULL, V_FLICK, TAU_FOLLOW, TAU_V, DECEL.
- 技法: SVG + motion + 自写积分.
- 常数:
  - `CometDial.jsx:9` `const DEAD = 44;`
  - `CometDial.jsx:11` `const V_FULL = 4;`
  - `CometDial.jsx:12` `const V_FLICK = 2;`
  - `CometDial.jsx:13` `const TAU_FOLLOW = 0.06;`
  - `CometDial.jsx:14` `const TAU_V = 0.05;`
  - `CometDial.jsx:15` `const DECEL = 0.99;`
  - `CometDial.jsx:16` `const DRAG_PX = 10;`
  - `CometDial.jsx:17` `const STALE_MS = 80;`
  - `CometDial.jsx:116` `damping: crit * (1 - clamp(bounce, 0, 0.9)),`
  - `CometDial.jsx:117` `mass: 1,`
  - `CometDial.jsx:130` `const dt = clamp((now - L.last) / 1000, 0, 0.05);`
  - `CometDial.jsx:135` `else reading.set(reading.get() + (g.at - reading.get()) * (1 - Math.exp(-dt / TAU_FOLLOW)));`
  - `CometDial.jsx:138` `const vRaw = L.rPrev == null || dt === 0 || reduce ? 0 : (r - L.rPrev) / dt / range;`
  - `CometDial.jsx:140` `L.v += (vRaw - L.v) * (1 - Math.exp(-dt / TAU_V));`
  - `CometDial.jsx:184` `L.raf = moving ? requestAnimationFrame(tick) : 0;`
  - `CometDial.jsx:230` `const v = e.type === 'pointercancel' || stale ? 0 : velocityOf(g.hist);`
- 指针/滚动: pointermove, pointerup, pointercancel.
- 可中断: pointercancel 有监听. 弹簧保留速度, 每帧重算目标.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel.
- 减弱动效: 有. `4` import { animate, useMotionValue, useReducedMotion } from 'motion/react';
- Props: `value` (42), `defaultValue=62` (43), `min=0` (44), `max=100` (45), `step=1` (46), `unit='%'` (47), `label='Level'` (48), `accent='#f5f5f5'` (49), `ink='#fdfdfd'` (50), `size=250` (51), `sweep=320` (52), `thickness=5` (53), `speed=25` (54), `tapBounce=0.2` (55), `flickBounce=0.1` (56), `momentum=1` (57), `cometReach=180` (58), `cometWidth=12` (59), `disabled=false` (60), `onChange` (61), `onChangeEnd` (62), `className=''` (63)
- 裁决: 控件教材. 按下, 松开, 拖拽或吸附是分开的, 常数写进对应控件合同, 不整件移植.

### Micro/DodgeField

- 文件: `Micro/DodgeField/DodgeField.css` 111 行, `Micro/DodgeField/DodgeField.jsx` 244 行. 目录内实现已逐行扫描.
- 看起来: motion 的 spring 或 animate. 命名常数 COUNT_LINE, DEAD_ZONE, CAUGHT_HOLD_MS, INSET, DEFAULT_TAUNTS.
- 技法: DOM + motion.
- 常数:
  - `DodgeField.css:5` `--df-ease-out: cubic-bezier(0.23, 1, 0.32, 1);`
  - `DodgeField.css:41` `transform 160ms var(--df-ease-out),`
  - `DodgeField.css:42` `background-color 220ms ease,`
  - `DodgeField.css:43` `color 220ms ease;`
  - `DodgeField.css:78` `opacity 200ms ease,`
  - `DodgeField.css:79` `filter 200ms ease;`
  - `DodgeField.css:100` `background-color 220ms ease,`
  - `DodgeField.css:101` `color 220ms ease;`
  - `DodgeField.jsx:8` `const COUNT_LINE = 0.55;`
  - `DodgeField.jsx:9` `const DEAD_ZONE = 6;`
  - `DodgeField.jsx:10` `const CAUGHT_HOLD_MS = 760;`
  - `DodgeField.jsx:11` `const INSET = 12;`
  - `DodgeField.jsx:135` `? { type: 'spring', duration: L.fleeDuration / 1000, bounce: 0 }`
  - `DodgeField.jsx:136` `: { type: 'spring', duration: L.returnDuration / 1000, bounce: L.returnBounce };`
- 指针/滚动: change, pointermove, scroll, pointerleave, blur.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; ResizeObserver.
- 减弱动效: 有. `97` @media (prefers-reduced-motion: reduce) {
- Props: `children` (29), `taunts=DEFAULT_TAUNTS` (30), `notice=''` (31), `inkColor='#f5f5f5'` (32), `contrastColor='#18181b'` (33), `fieldHeight=240` (34), `reach=72` (35), `radius=120` (36), `falloff=2` (37), `fleeDuration=130` (38), `returnDuration=620` (39), `returnBounce=0.1` (40), `axis='both'` (41), `wall='clamp'` (42), `patience=4` (43), `disabled=false` (44), `onDodge` (45), `onRelent` (46), `onCatch` (47), `className=''` (48), `style` (49)
- 裁决: 控件教材. 按下, 松开, 拖拽或吸附是分开的, 常数写进对应控件合同, 不整件移植.

### Micro/FlipCard

- 文件: `Micro/FlipCard/FlipCard.css` 109 行, `Micro/FlipCard/FlipCard.jsx` 267 行. 目录内实现已逐行扫描.
- 看起来: 自己做 force, velocity, dt 积分. 命名常数 SLOP, TILT_SPRING, LIFT_SPRING, FLING, HISTORY_MS.
- 技法: DOM + 自写积分.
- 常数:
  - `FlipCard.css:103` `transition: opacity 200ms ease;`
  - `FlipCard.jsx:16` `const SLOP = { fine: 4, coarse: 8 };`
  - `FlipCard.jsx:17` `const TILT_SPRING = { stiffness: 240, damping: 24, mass: 0.6 };`
  - `FlipCard.jsx:18` `const LIFT_SPRING = { stiffness: 320, damping: 26 };`
  - `FlipCard.jsx:19` `const FLING = 0.16;`
  - `FlipCard.jsx:20` `const HISTORY_MS = 90;`
  - `FlipCard.jsx:42` `stiffness = 170,`
  - `FlipCard.jsx:43` `damping = 20,`
  - `FlipCard.jsx:69` `const tiltX = useSpring(0, TILT_SPRING);`
  - `FlipCard.jsx:70` `const tiltY = useSpring(0, TILT_SPRING);`
  - `FlipCard.jsx:71` `const lift = useSpring(1, LIFT_SPRING);`
  - `FlipCard.jsx:72` `const sheen = useSpring(0, LIFT_SPRING);`
  - `FlipCard.jsx:90` `else spin.current = animate(turn, to, { type: 'spring', stiffness, damping, velocity, restDelta: 0.05 });`
  - `FlipCard.jsx:114` `else spin.current = animate(turn, target.current, { type: 'spring', stiffness, damping, restDelta: 0.05 });`
- 指针/滚动: 无指针监听.
- 可中断: 弹簧保留速度, 每帧重算目标.
- 性能: 无自管循环. 交给 CSS 或库..
- 减弱动效: 有. `9` useReducedMotion,
- Props: `front=null` (27), `back=null` (28), `flipped` (29), `defaultFlipped=false` (30), `onFlipChange` (31), `axis='y'` (32), `flipOnClick=true` (33), `draggable=true` (34), `dragDistance=0` (35), `tilt=true` (36), `tiltMax=12` (37), `glare=true` (38), `glareOpacity=0.22` (39), `hoverScale=1.03` (40), `perspective=1100` (41), `stiffness=170` (42), `damping=20` (43), `width=300` (44), `height=400` (45), `radius=22` (46), `background='#27272a'` (47), `color='#f5f5f5'` (48), `shadow=true` (49), `shadowColor='#000000'` (50)
- 裁决: 控件教材. 按下, 松开, 拖拽或吸附是分开的, 常数写进对应控件合同, 不整件移植.

### Micro/FlyingButton

- 文件: `Micro/FlyingButton/FlyingButton.css` 204 行, `Micro/FlyingButton/FlyingButton.jsx` 2136 行. 目录内实现已逐行扫描.
- 看起来: 着色器场, uniform 有 uJetA, uJetB, uJetBend, uVelocity, uSource, uWorld, uDt, uKeep. 命名常数 SPRING, DAMP, REST, POD_H, MAX_JETS, TILT_MAX.
- 技法: WebGL + canvas2d + SVG + rAF.
- 常数:
  - `FlyingButton.jsx:7` `const SPRING = 380;`
  - `FlyingButton.jsx:8` `const DAMP = 10;`
  - `FlyingButton.jsx:10` `const POD_H = 5;`
  - `FlyingButton.jsx:11` `const MAX_JETS = 4;`
  - `FlyingButton.jsx:12` `const TILT_MAX = 0.55;`
  - `FlyingButton.jsx:14` `const FLIP_TIME = 0.42;`
  - `FlyingButton.jsx:76` `return exp(-dot(off, off) / (b.y * b.y)) * smoothstep(-b.y, 0.0, along);`
  - `FlyingButton.jsx:128` `float e = 0.35;`
  - `FlyingButton.jsx:139` `float smokeHere = smoothstep(0.02, 0.4, d.x + d.y);`
  - `FlyingButton.jsx:146` `v.x += (uWind - v.x) * (1.0 - exp(-0.35 * uDt)) * smoothstep(0.0, 60.0, p.y);`
  - `FlyingButton.jsx:161` `float wa = smoothstep(-b.y, 0.0, along) * (1.0 - smoothstep(0.55, 1.0, sN));`
  - `FlyingButton.jsx:188` `float inside = smoothstep(2.0, -2.0, sd) * uObstacle;`
  - `FlyingButton.jsx:335` `float depth = 0.68 * belly * smoothstep(40.0, 110.0, belly);`
  - `FlyingButton.jsx:337` `float wy = smoothstep(-4.0, 6.0, below) * (1.0 - smoothstep(depth * 0.7, depth, below));`
  - `FlyingButton.jsx:338` `float nearest = 1e4;`
  - `FlyingButton.jsx:339` `float outer = 0.0;`
  - `FlyingButton.jsx:345` `float wx = uGap.x > 1.0 ? smoothstep(uGap.x * 0.22, uGap.x * 0.4, nearest) * (1.0 - smoothstep(outer - uGap.x * 0.1, outer, abs(lq.x))) : 0.0;`
  - `FlyingButton.jsx:358` `float wn = exp(-dot(off, off) / (jb.y * jb.y)) * smoothstep(-jb.y, 0.0, along);`
  - `FlyingButton.jsx:359` `float pulse = 0.6 + 0.8 * noise(vec2(uTime * 6.0 + float(i) * 13.1, along * 0.06 + float(i)));`
  - `FlyingButton.jsx:366` `float wc = exp(-across * across / (R * R)) * smoothstep(0.45, 0.8, sN) * (1.0 - step(reach + 2.0, along));`
  - `FlyingButton.jsx:367` `float grain = 0.45 + 1.1 * noise(vec2(across * 0.12 + float(i) * 3.0, along * 0.05 - uTime * 9.0));`
  - `FlyingButton.jsx:377` `float g2 = 0.5 + noise(vec2(p.x * 0.08, uTime * 4.0 + float(i) * 9.0));`
  - `FlyingButton.jsx:425` `float w1 = 1.0 - abs(2.0 * f1 - 1.0);`
  - `FlyingButton.jsx:426` `float w2 = 1.0 - w1;`
  - `FlyingButton.jsx:440` `float flare = smoothstep(S - 32.0 * uScale, S + 2.0, sc);`
  - `FlyingButton.jsx:445` `float lam = 9.0 * uScale + 0.22 * sc;`
  - `FlyingButton.jsx:448` `float amp = 0.12 + 0.5 * smoothstep(4.0, 70.0, sc);`
  - `FlyingButton.jsx:452` `float onset = smoothstep(2.0 * uScale, 16.0 * uScale, s);`
  - (带数字的运动行共 75 条, 留前 28 条, 文件 2136 行已逐行扫过)
- 指针/滚动: pointermove, pointerenter, pointerleave, pointerdown, pointerup, pointercancel, click.
- 可中断: pointercancel 有监听.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; 读 devicePixelRatio; ResizeObserver.
- 减弱动效: 有. `627` typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
- Props: `children='Take off'` (1998), `onClick` (1999), `theme='dark'` (2000), `size='medium'` (2001), `radius` (2002), `altitude=170` (2003), `hoverTime=2.4` (2004), `jets=2` (2005), `thrusters=true` (2006), `trigger='hover'` (2007), `carryCursor=true` (2008), `ramp=false` (2009), `rampColor` (2010), `smoke=1` (2011), `turbulence=1` (2012), `wobble=1` (2013), `thrustColor` (2014), `smokeColor` (2015), `buttonColor` (2016), `textColor` (2017), `className=''` (2018), `style` (2019)
- 裁决: 控件教材. 按下, 松开, 拖拽或吸附是分开的, 常数写进对应控件合同, 不整件移植.

### Micro/FolderFloat

- 文件: `Micro/FolderFloat/FolderFloat.css` 277 行, `Micro/FolderFloat/FolderFloat.jsx` 415 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 DEFAULT_ITEMS, PAD, CHAR, GAP, ROW, DRAG_MIN.
- 技法: DOM + matter-js + rAF.
- 常数:
  - `FolderFloat.css:18` `--ff-stagger: 45ms;`
  - `FolderFloat.css:20` `--ff-spring: cubic-bezier(0.34, 1.57, 0.64, 1);`
  - `FolderFloat.css:21` `--ff-ease-out: cubic-bezier(0.23, 1, 0.32, 1);`
  - `FolderFloat.css:134` `opacity 200ms ease;`
  - `FolderFloat.css:177` `transform var(--ff-close) var(--ff-ease-out) calc((var(--ff-n) - 1 - var(--i)) * var(--ff-stagger) * 0.5),`
  - `FolderFloat.css:178` `opacity 160ms ease calc((var(--ff-n) - 1 - var(--i)) * var(--ff-stagger) * 0.5 + var(--ff-close) * 0.45),`
  - `FolderFloat.css:179` `scale 160ms var(--ff-ease-out);`
  - `FolderFloat.css:188` `opacity 160ms ease calc(var(--i) * var(--ff-stagger)),`
  - `FolderFloat.css:189` `scale 160ms var(--ff-ease-out);`
  - `FolderFloat.css:194` `transition: scale 160ms var(--ff-ease-out);`
  - `FolderFloat.css:212` `animation: folder-float-pop 320ms var(--ff-ease-out);`
  - `FolderFloat.css:217` `animation: folder-float-drift 3.2s ease-in-out infinite;`
  - `FolderFloat.css:218` `animation-delay: calc(var(--i) * -0.7s);`
  - `FolderFloat.css:255` `transition: opacity 200ms ease;`
  - `FolderFloat.css:267` `transition: opacity 200ms ease;`
  - `FolderFloat.css:271` `transition: opacity 200ms ease calc(var(--i) * var(--ff-stagger));`
  - `FolderFloat.jsx:10` `const PAD = 28;`
  - `FolderFloat.jsx:11` `const CHAR = 6.8;`
  - `FolderFloat.jsx:12` `const GAP = 12;`
  - `FolderFloat.jsx:13` `const ROW = 52;`
  - `FolderFloat.jsx:14` `const DRAG_MIN = 4;`
  - `FolderFloat.jsx:15` `const ZONE_PAD = 8;`
  - `FolderFloat.jsx:76` `stagger = 45,`
  - `FolderFloat.jsx:194` `const dt = s.last ? Math.min(32, now - s.last) : 16;`
  - `FolderFloat.jsx:202` `x: Math.sin(t * 0.9 + ph) * k * b.mass,`
  - `FolderFloat.jsx:203` `y: Math.cos(t * 1.3 + ph * 1.7) * k * b.mass`
  - `FolderFloat.jsx:238` `liveTimer.current = setTimeout(startPhysics, openDuration + (n - 1) * stagger + 80);`
  - `FolderFloat.jsx:362` `'--ff-spring': 'cubic-bezier(0.34, ${(1 + bounce * 1.9).toFixed(2)}, 0.64, 1)'`
- 指针/滚动: change.
- 可中断: 有 pointerup, 无 pointercancel.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel.
- 减弱动效: 有. `252` @media (prefers-reduced-motion: reduce) {
- Props: `items=DEFAULT_ITEMS` (51), `label='Design feedback'` (52), `sublabel=''` (53), `trigger='hover'` (54), `defaultOpen=false` (55), `closeOnSelect=true` (56), `physics=true` (57), `drift=0.5` (58), `onSelect` (59), `onOpenChange` (60), `folderColor='#3f3f46'` (61), `frontColor='#52525b'` (62), `paperColor='#f5f5f5'` (63), `itemColor='#f5f5f5'` (64), `itemTextColor='#18181b'` (65), `labelColor='#f5f5f5'` (66), `width=200` (67), `height=148` (68), `radius=14` (69), `spread=180` (70), `lift=26` (71), `tilt=8` (72), `flapAngle=34` (73), `restAngle=16` (74)
- 裁决: 控件教材. 按下, 松开, 拖拽或吸附是分开的, 常数写进对应控件合同, 不整件移植.

### Micro/FuseButton

- 文件: `Micro/FuseButton/FuseButton.css` 232 行, `Micro/FuseButton/FuseButton.jsx` 255 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 LINE, OUTLINE, SIZES.
- 技法: SVG.
- 常数:
  - `FuseButton.css:13` `--fb-ease-out: cubic-bezier(0.23, 1, 0.32, 1);`
  - `FuseButton.css:35` `transition: transform 160ms var(--fb-ease-out);`
  - `FuseButton.css:86` `background-color 160ms ease;`
  - `FuseButton.css:95` `transition-delay: 0s;`
  - `FuseButton.css:99` `transition-duration: 0s;`
  - `FuseButton.css:165` `transition-duration: 0s;`
- 指针/滚动: visibilitychange.
- 可中断: 时间轴或 CSS, 不可中途保留速度.
- 性能: 无自管循环. 交给 CSS 或库.; 离屏或隐藏时有暂停线索.
- 减弱动效: 有. `200` @media (prefers-reduced-motion: reduce) {
- Props: `label='Archive'` (18), `undoLabel='Undo'` (19), `doneLabel='Archived'` (20), `icon` (21), `color='#f5f5f5'` (22), `background='#27272a'` (23), `fuseColor='#f5a524'` (24), `size='md'` (25), `radius=22` (26), `undoWindow=4000` (27), `fuse='outline'` (28), `fuseThickness=1.5` (29), `crossfadeMs=200` (30), `commitOn='press'` (31), `pauseOnHover=true` (32), `settle='reset'` (33), `disabled=false` (34), `onCommit` (35), `onUndo` (36), `onFuseEnd` (37), `onPhaseChange` (38), `className=''` (39), `type='button'` (40)
- 裁决: 控件教材. 按下, 松开, 拖拽或吸附是分开的, 常数写进对应控件合同, 不整件移植.

### Micro/GlideSelect

- 文件: `Micro/GlideSelect/GlideSelect.css` 242 行, `Micro/GlideSelect/GlideSelect.jsx` 321 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 SIZES, PAD, GAP, MENU_GAP, DEFAULT_OPTIONS.
- 技法: DOM.
- 常数:
  - `GlideSelect.css:16` `--gs-ease-out: cubic-bezier(0.23, 1, 0.32, 1);`
  - `GlideSelect.css:49` `background-color 100ms ease,`
  - `GlideSelect.css:50` `transform 160ms var(--gs-ease-out);`
  - `GlideSelect.css:76` `animation: gs-swap 160ms ease;`
  - `GlideSelect.css:89` `transition: transform 200ms var(--gs-ease-out);`
  - `GlideSelect.css:158` `opacity 150ms ease;`
  - `GlideSelect.css:176` `transition: background-color 150ms ease;`
  - `GlideSelect.css:224` `transition: opacity 150ms ease;`
  - `GlideSelect.css:232` `transition: background-color 100ms ease;`
  - `GlideSelect.jsx:14` `const PAD = 4;`
  - `GlideSelect.jsx:15` `const GAP = 1;`
  - `GlideSelect.jsx:16` `const MENU_GAP = 6;`
- 指针/滚动: pointerdown.
- 可中断: 有 pointerup, 无 pointercancel.
- 性能: 无自管循环. 交给 CSS 或库..
- 减弱动效: 有. `213` @media (prefers-reduced-motion: reduce) {
- Props: `options=DEFAULT_OPTIONS` (32), `value` (33), `defaultValue` (34), `onChange` (35), `placeholder='Select…'` (36), `showTags=true` (37), `accentColor='#f5f5f5'` (38), `surfaceColor='#27272a'` (39), `highlightColor='#3f3f46'` (40), `textColor='#f5f5f5'` (41), `size='md'` (42), `radius=10` (43), `menuWidth=176` (44), `placement='bottom'` (45), `align='left'` (46), `popDuration=180` (47), `glideDuration=220` (48), `rememberPosition=true` (49), `disabled=false` (50), `ariaLabel='Select'` (51), `className=''` (52)
- 裁决: 控件教材. 按下, 松开, 拖拽或吸附是分开的, 常数写进对应控件合同, 不整件移植.

### Micro/HoldButton

- 文件: `Micro/HoldButton/HoldButton.css` 274 行, `Micro/HoldButton/HoldButton.jsx` 266 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 TAP_MS, HIT_PAD, LINEAR, EASE_OUT.
- 技法: DOM + rAF.
- 常数:
  - `HoldButton.css:15` `--hb-ease-out: cubic-bezier(0.23, 1, 0.32, 1);`
  - `HoldButton.css:42` `transform 160ms var(--hb-ease-out),`
  - `HoldButton.css:43` `background-color 160ms ease,`
  - `HoldButton.css:82` `transform 160ms var(--hb-ease-out),`
  - `HoldButton.css:83` `background-color 160ms ease,`
  - `HoldButton.css:108` `animation: hb-pulse 600ms var(--hb-ease-out) forwards;`
  - `HoldButton.css:136` `opacity 200ms ease,`
  - `HoldButton.css:137` `filter 200ms ease;`
  - `HoldButton.css:244` `background-color 160ms ease,`
  - `HoldButton.css:271` `transition: opacity 200ms ease;`
  - `HoldButton.jsx:7` `const TAP_MS = 250;`
  - `HoldButton.jsx:8` `const HIT_PAD = 10;`
  - `HoldButton.jsx:65` `const t = duration > 0 ? Math.min(1, (now - m.start) / duration) : 1;`
- 指针/滚动: blur, visibilitychange.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; 离屏或隐藏时有暂停线索; ResizeObserver.
- 减弱动效: 有. `241` @media (prefers-reduced-motion: reduce) {
- Props: `children='Hold to delete'` (13), `doneLabel='Deleted'` (14), `icon=null` (15), `doneIcon=null` (16), `backgroundColor='#27272a'` (17), `fillColor='#5227FF'` (18), `textColor='#f5f5f5'` (19), `fillTextColor='#ffffff'` (20), `size='md'` (21), `radius=14` (22), `fillDirection='right'` (23), `holdTime=2000` (24), `releaseTime=200` (25), `pressScale=0.97` (26), `wave=true` (27), `waveAmplitude=6` (28), `glow=true` (29), `resetAfter=1200` (30), `disabled=false` (31), `onHold` (32), `onTap` (33), `className=''` (34)
- 裁决: 控件教材. 按下, 松开, 拖拽或吸附是分开的, 常数写进对应控件合同, 不整件移植.

### Micro/JellyRadio

- 文件: `Micro/JellyRadio/JellyRadio.css` 108 行, `Micro/JellyRadio/JellyRadio.jsx` 218 行. 目录内实现已逐行扫描.
- 看起来: motion 的 spring 或 animate. 命名常数 DEFAULT_ITEMS, SIZES.
- 技法: DOM + motion.
- 常数:
  - `JellyRadio.css:13` `--jr-ease-out: cubic-bezier(0.23, 1, 0.32, 1);`
  - `JellyRadio.css:70` `transform 160ms var(--jr-ease-out),`
  - `JellyRadio.css:71` `background-color 200ms ease,`
  - `JellyRadio.css:72` `color 200ms ease;`
  - `JellyRadio.css:82` `transition: opacity 160ms ease;`
  - `JellyRadio.jsx:9` `const SIZES = { sm: [28, 12, 12], md: [36, 13, 16], lg: [44, 14, 20] };`
  - `JellyRadio.jsx:14` `damping: 2 * Math.sqrt(k * m) * (1 - bounce),`
  - `JellyRadio.jsx:44` `stagger = 22,`
  - `JellyRadio.jsx:45` `stiffness = 580,`
  - `JellyRadio.jsx:95` `const k = C.stiffness * (1 - 0.12 * Math.min(far, 3));`
  - `JellyRadio.jsx:97` `const delay = inFlight ? 0 : (far * C.stagger) / 1000;`
  - `JellyRadio.jsx:98` `animate(mv.x, x, { ...spring(k, 0.9, C.bounce), delay });`
  - `JellyRadio.jsx:101` `...spring(k * (1 + 0.24 * j), 0.9 - 0.1 * j, Math.min(0.85, C.bounce + 0.3 * j)),`
  - `JellyRadio.jsx:104` `animate(mv.sy, s, { ...spring(k * (1 - 0.14 * j), 0.9 + 0.05 * j, C.bounce), delay: delay + 0.05 * j });`
- 指针/滚动: 无指针监听.
- 可中断: 时间轴或 CSS, 不可中途保留速度.
- 性能: 无自管循环. 交给 CSS 或库.; ResizeObserver.
- 减弱动效: 有. `104` @media (prefers-reduced-motion: reduce) {
- Props: 见源码解构, 没有带默认值的签名字段
- 裁决: 控件教材. 按下, 松开, 拖拽或吸附是分开的, 常数写进对应控件合同, 不整件移植.

### Micro/LatticeLoader

- 文件: `Micro/LatticeLoader/LatticeLoader.css` 242 行, `Micro/LatticeLoader/LatticeLoader.jsx` 163 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 PATTERNS, DEFAULT_PATTERN, MARKS.
- 技法: DOM.
- 常数:
  - `LatticeLoader.css:13` `--ll-ease-out: cubic-bezier(0.23, 1, 0.32, 1);`
  - `LatticeLoader.css:14` `--ll-ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);`
  - `LatticeLoader.css:58` `transition: opacity 200ms ease;`
  - `LatticeLoader.css:87` `opacity 160ms var(--ll-ease-out),`
  - `LatticeLoader.css:88` `transform 160ms var(--ll-ease-out);`
  - `LatticeLoader.css:93` `opacity 200ms ease,`
  - `LatticeLoader.css:94` `background-color 200ms ease;`
  - `LatticeLoader.css:114` `opacity 200ms ease,`
  - `LatticeLoader.css:115` `transform 200ms var(--ll-ease-out);`
  - `LatticeLoader.css:132` `opacity 200ms ease,`
  - `LatticeLoader.css:133` `filter 200ms ease;`
  - `LatticeLoader.css:177` `@keyframes lattice-on-45 {`
  - `LatticeLoader.css:193` `@keyframes lattice-on-35 {`
  - `LatticeLoader.css:209` `@keyframes lattice-on-25 {`
  - `LatticeLoader.css:231` `animation-delay: 0ms !important;`
  - `LatticeLoader.css:232` `animation-duration: 1400ms !important;`
  - `LatticeLoader.jsx:25` `const DEFAULT_PATTERN = { 3: 'orbit', 4: 'sweep' };`
- 指针/滚动: 无指针监听.
- 可中断: 时间轴或 CSS, 不可中途保留速度.
- 性能: 无自管循环. 交给 CSS 或库..
- 减弱动效: 有. `225` @media (prefers-reduced-motion: reduce) {
- Props: `label='Thinking'` (47), `doneLabel='Done in'` (48), `errorLabel='Failed after'` (49), `status='working'` (50), `pattern='orbit'` (51), `grid=3` (52), `shape='round'` (53), `color='currentColor'` (54), `doneColor='#22c55e'` (55), `errorColor='#ef4444'` (56), `cellSize=6` (57), `gap=2` (58), `fontSize=14` (59), `step=90` (60), `idleOpacity=0.15` (61), `glow=false` (62), `glowColor=''` (63), `showTimer=true` (64), `elapsed` (65), `className=''` (66), `style` (67)
- 裁决: 控件教材. 按下, 松开, 拖拽或吸附是分开的, 常数写进对应控件合同, 不整件移植.

### Micro/PaperCrumple

- 文件: `Micro/PaperCrumple/PaperCrumple.css` 86 行, `Micro/PaperCrumple/PaperCrumple.jsx` 1119 行. 目录内实现已逐行扫描.
- 看起来: 着色器场, uniform 有 paperLighting. 自己做 force, velocity, dt 积分.
- 技法: WebGL + three + 自写积分.
- 常数:
  - `PaperCrumple.jsx:6` `const spring = (value = 0) => ({ value, target: value, velocity: 0 });`
  - `PaperCrumple.jsx:10` `if (instant || duration <= 0) {`
  - `PaperCrumple.jsx:15` `const omega = 8 / Math.max(0.06, duration);`
  - `PaperCrumple.jsx:20` `s.velocity = (s.velocity - omega * term * dt) * decay;`
  - `PaperCrumple.jsx:98` `const amount = (1 - list[edge + 2] / length) * 0.5 * stiffness * weight;`
  - `PaperCrumple.jsx:592` `const weight = THREE.MathUtils.smoothstep(dot, 0.88 - (1 - sharpness) * 0.18, 0.98);`
  - `PaperCrumple.jsx:609` `lighting.value = THREE.MathUtils.smoothstep(fold + memory.value, 0, 0.4);`
  - `PaperCrumple.jsx:643` `const dt = lastTime ? Math.min(0.04, (time - lastTime) / 1000) : 1 / 60;`
  - `PaperCrumple.jsx:647` `const duration = held ? finite(opts.crumpleDuration, 0.55) : finite(opts.releaseDuration, 0.4);`
  - `PaperCrumple.jsx:649` `moving = advance(s, dt, s === amount || s === memory ? duration : 0.42, reduceMotion || keyboard) || moving;`
  - `PaperCrumple.jsx:705` `renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));`
  - `PaperCrumple.jsx:830` `const dt = Math.max(0.008, (now - lastMove) / 1000);`
- 指针/滚动: pointerdown, pointermove, pointerup, pointercancel, lostpointercapture, keydown, keyup, blur, visibilitychange, change, webglcontextlost, webglcontextrestored.
- 可中断: pointercancel 有监听. 弹簧保留速度, 每帧重算目标.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; 读 devicePixelRatio; 离屏或隐藏时有暂停线索; ResizeObserver.
- 减弱动效: 有. `538` const media = window.matchMedia('(prefers-reduced-motion: reduce)');
- Props: `src` (240), `alt='Crumplable image'` (241), `backSrc=''` (242), `width=320` (243), `height=400` (244), `sceneHeight=560` (245), `imageFit='cover'` (246), `releaseBehavior='restore'` (247), `crumpleAmount=0.85` (248), `crumpleDuration=0.55` (249), `releaseDuration=0.4` (250), `foldCount=6` (251), `foldSharpness=0.6` (252), `wrinkleDepth=0.65` (253), `creaseStrength=0.18` (254), `paperColor='#f4f0e8'` (255), `roughness=0.92` (256), `paperTexture=0.08` (257), `lightIntensity=1.8` (258), `lightAngle=-35` (259), `shadow=true` (260), `shadowOpacity=0.08` (261), `draggable=true` (262), `dragRotation=10` (263)
- 裁决: 控件教材. 按下, 松开, 拖拽或吸附是分开的, 常数写进对应控件合同, 不整件移植.

### Micro/PeekRating

- 文件: `Micro/PeekRating/PeekRating.css` 135 行, `Micro/PeekRating/PeekRating.jsx` 309 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 EASE_OUT, SHAPES.
- 技法: DOM.
- 常数:
  - `PeekRating.css:10` `--pr-ease-out: cubic-bezier(0.23, 1, 0.32, 1);`
  - `PeekRating.css:80` `transition: color 160ms ease;`
  - `PeekRating.css:114` `opacity 180ms ease;`
  - `PeekRating.css:124` `transition-duration: 0ms;`
  - `PeekRating.css:133` `transition: opacity 180ms ease;`
  - `PeekRating.jsx:9` `const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';`
  - `PeekRating.jsx:126` `{ transform: 'scale(1)', easing: EASE_OUT },`
  - `PeekRating.jsx:127` `{ transform: 'scale(${popScale})', offset: 0.35, easing: EASE_OUT },`
  - `PeekRating.jsx:130` `{ duration: 300 }`
- 指针/滚动: visibilitychange, blur.
- 可中断: 有 pointerup, 无 pointercancel.
- 性能: 无自管循环. 交给 CSS 或库.; 离屏或隐藏时有暂停线索.
- 减弱动效: 有. `127` @media (prefers-reduced-motion: reduce) {
- Props: `defaultValue=0` (18), `onChange` (19), `onPreview` (20), `count=5` (21), `shape='star'` (22), `icon` (23), `labels=[]` (24), `activeColor='#f5b400'` (25), `idleColor='#52525b'` (26), `tipColor='#27272a'` (27), `tipTextColor='#f5f5f5'` (28), `size=28` (29), `lift=6` (30), `magnify=1.15` (31), `riseDuration=320` (32), `popScale=1.3` (33), `showTip=true` (34), `allowClear=true` (35), `readOnly=false` (36), `disabled=false` (37), `ariaLabel='Rating'` (38), `className=''` (39)
- 裁决: 控件教材. 按下, 松开, 拖拽或吸附是分开的, 常数写进对应控件合同, 不整件移植.

### Micro/PromptBar

- 文件: `Micro/PromptBar/PromptBar.css` 516 行, `Micro/PromptBar/PromptBar.jsx` 718 行. 目录内实现已逐行扫描.
- 看起来: motion 的 spring 或 animate. 2d 画布逐帧画. 命名常数 ARROW_UP, SQUARE, EASE_IN_OUT, LINE, EDGE, DEFAULT_SOURCES.
- 技法: canvas2d + SVG + motion.
- 常数:
  - `PromptBar.css:9` `--pb-ease-out: cubic-bezier(0.23, 1, 0.32, 1);`
  - `PromptBar.css:34` `animation: prompt-bar-pop 180ms var(--pb-ease-out) both;`
  - `PromptBar.css:59` `top 220ms var(--pb-ease-out),`
  - `PromptBar.css:60` `height 220ms var(--pb-ease-out),`
  - `PromptBar.css:61` `opacity 150ms ease;`
  - `PromptBar.css:161` `transition: opacity 500ms ease;`
  - `PromptBar.css:193` `animation: prompt-bar-pop 200ms var(--pb-ease-out) both;`
  - `PromptBar.css:217` `opacity 120ms ease,`
  - `PromptBar.css:218` `background-color 120ms ease;`
  - `PromptBar.css:285` `background-color 150ms ease,`
  - `PromptBar.css:286` `color 150ms ease,`
  - `PromptBar.css:287` `transform 160ms var(--pb-ease-out);`
  - `PromptBar.css:306` `background-color 150ms ease,`
  - `PromptBar.css:307` `color 150ms ease;`
  - `PromptBar.css:388` `width 220ms var(--pb-ease-out),`
  - `PromptBar.css:389` `background-color 300ms ease;`
  - `PromptBar.css:413` `left 220ms var(--pb-ease-out),`
  - `PromptBar.css:414` `background-color 300ms ease;`
  - `PromptBar.css:439` `animation: prompt-bar-eq 900ms ease-in-out infinite;`
  - `PromptBar.css:443` `animation-delay: 150ms;`
  - `PromptBar.css:447` `animation-delay: 300ms;`
  - `PromptBar.css:472` `background-color 200ms ease,`
  - `PromptBar.css:473` `color 200ms ease,`
  - `PromptBar.css:474` `transform 160ms var(--pb-ease-out);`
  - `PromptBar.css:504` `transition: opacity 150ms ease;`
  - `PromptBar.css:509` `transition: background-color 300ms ease;`
  - `PromptBar.jsx:26` `const LINE = 22;`
  - `PromptBar.jsx:27` `const EDGE = 11;`
  - `PromptBar.jsx:89` `reduce ? { duration: 0 } : { duration: morphDuration / 1000, ease: EASE_IN_OUT }`
  - `PromptBar.jsx:263` `const dpr = Math.min(2, window.devicePixelRatio || 1);`
  - `PromptBar.jsx:283` `const dt = Math.min(0.05, (now - last) / 1000);`
  - `PromptBar.jsx:287` `typed.energy *= Math.exp(-dt / 0.8);`
  - `PromptBar.jsx:288` `pulse *= Math.exp(-dt / 0.16);`
  - `PromptBar.jsx:294` `speed += (1 + energy * 6 - speed) * (1 - Math.exp(-dt / 0.15));`
- 指针/滚动: pointerdown.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; 读 devicePixelRatio; ResizeObserver.
- 减弱动效: 有. `497` @media (prefers-reduced-motion: reduce) {
- Props: 见源码解构, 没有带默认值的签名字段
- 裁决: 控件教材. 按下, 松开, 拖拽或吸附是分开的, 常数写进对应控件合同, 不整件移植.

### Micro/PulseHeart

- 文件: `Micro/PulseHeart/PulseHeart.css` 172 行, `Micro/PulseHeart/PulseHeart.jsx` 254 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 OUT, ICONS.
- 技法: SVG + rAF.
- 常数:
  - `PulseHeart.css:10` `--ph-ease-out: cubic-bezier(0.23, 1, 0.32, 1);`
  - `PulseHeart.css:30` `transition: transform 160ms var(--ph-ease-out);`
  - `PulseHeart.css:68` `transition: color 160ms ease;`
  - `PulseHeart.css:166` `transition: color 200ms ease;`
  - `PulseHeart.jsx:8` `const OUT = 0.4;`
  - `PulseHeart.jsx:34` `duration = 560,`
  - `PulseHeart.jsx:36` `overshoot = 1.7,`
- 指针/滚动: 无指针监听.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel.
- 减弱动效: 有. `160` @media (prefers-reduced-motion: reduce) {
- Props: `defaultLiked=false` (22), `count=0` (23), `onChange` (24), `showCount=true` (25), `icon='heart'` (26), `idleOutline=true` (27), `size=40` (28), `corner=32` (29), `likedColor='#ff4d6d'` (30), `idleColor='#8b8b93'` (31), `pillColor='#232326'` (32), `textColor='#f5f5f5'` (33), `duration=560` (34), `dotSize=0.3` (35), `overshoot=1.7` (36), `beat=3` (37), `rollDuration=350` (38), `disabled=false` (39), `label='Like'` (40), `className=''` (41)
- 裁决: 控件教材. 按下, 松开, 拖拽或吸附是分开的, 常数写进对应控件合同, 不整件移植.

### Micro/RefineFrame

- 文件: `Micro/RefineFrame/RefineFrame.css` 262 行, `Micro/RefineFrame/RefineFrame.jsx` 299 行. 目录内实现已逐行扫描.
- 看起来: 2d 画布逐帧画. 命名常数 STAGES, TARGET, LEVELS, EDGE, STRIPS, DEFAULT_LABELS.
- 技法: canvas2d + rAF.
- 常数:
  - `RefineFrame.css:13` `--rf-ease-out: cubic-bezier(0.23, 1, 0.32, 1);`
  - `RefineFrame.css:42` `animation: refine-frame-wait 2.4s ease-in-out infinite;`
  - `RefineFrame.css:142` `opacity 200ms ease,`
  - `RefineFrame.css:143` `transform 200ms var(--rf-ease-out);`
  - `RefineFrame.css:173` `animation: refine-frame-label 200ms ease both;`
  - `RefineFrame.css:205` `opacity 200ms ease,`
  - `RefineFrame.css:206` `transform 160ms var(--rf-ease-out),`
  - `RefineFrame.css:207` `background-color 150ms ease;`
  - `RefineFrame.css:256` `transition: opacity 200ms ease;`
  - `RefineFrame.jsx:15` `const TARGET = { queued: 0, generating: 0.5, refining: 0.875, complete: 1 };`
  - `RefineFrame.jsx:17` `const EDGE = 28;`
  - `RefineFrame.jsx:18` `const STRIPS = 14;`
  - `RefineFrame.jsx:142` `const dt = Math.min(0.05, s.last ? (now - s.last) / 1000 : 0.016);`
  - `RefineFrame.jsx:144` `const dpr = Math.min(2, window.devicePixelRatio || 1);`
  - `RefineFrame.jsx:192` `s.raf = keep ? requestAnimationFrame(tick) : 0;`
- 指针/滚动: change, load.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; 读 devicePixelRatio.
- 减弱动效: 有. `236` @media (prefers-reduced-motion: reduce) {
- Props: `status='generating'` (91), `children` (92), `aspectRatio='4 / 3'` (93), `width=320` (94), `radius=16` (95), `background='#27272a'` (96), `color='#f5f5f5'` (97), `stageDuration=400` (98), `sweep=true` (99), `showStatus=true` (100), `hideAfter=1200` (101), `labels=DEFAULT_LABELS` (102), `retryLabel='Retry'` (103), `onRetry` (104), `className=''` (105)
- 裁决: 控件教材. 按下, 松开, 拖拽或吸附是分开的, 常数写进对应控件合同, 不整件移植.

### Micro/RubberSegment

- 文件: `Micro/RubberSegment/RubberSegment.css` 121 行, `Micro/RubberSegment/RubberSegment.jsx` 360 行. 目录内实现已逐行扫描.
- 看起来: motion 的 spring 或 animate. 命名常数 EASE_OUT, SPRING_UI, SPRING_MOMENTUM, SPRING_RELAX, DILATE, HANDOFF.
- 技法: DOM + motion.
- 常数:
  - `RubberSegment.css:15` `--rs-ease-out: cubic-bezier(0.23, 1, 0.32, 1);`
  - `RubberSegment.css:64` `opacity 160ms ease,`
  - `RubberSegment.css:65` `transform 160ms var(--rs-ease-out);`
  - `RubberSegment.css:119` `transition: opacity 160ms ease;`
  - `RubberSegment.jsx:9` `const SPRING_UI = { type: 'spring', duration: 0.3, bounce: 0 };`
  - `RubberSegment.jsx:10` `const SPRING_MOMENTUM = { type: 'spring', duration: 0.4, bounce: 0.2 };`
  - `RubberSegment.jsx:11` `const SPRING_RELAX = { type: 'spring', duration: 0.16, bounce: 0 };`
  - `RubberSegment.jsx:12` `const DILATE = 0.19;`
  - `RubberSegment.jsx:13` `const HANDOFF = 0.15;`
  - `RubberSegment.jsx:14` `const FLICK = 110;`
  - `RubberSegment.jsx:15` `const MAX_VELOCITY = 2000;`
  - `RubberSegment.jsx:16` `const DEADZONE = 4;`
  - `RubberSegment.jsx:17` `const SLOP = 10;`
  - `RubberSegment.jsx:18` `const RUBBER = 0.55;`
  - `RubberSegment.jsx:162` `duration: t(flick ? 0.4 : 0.3),`
  - `RubberSegment.jsx:167` `animate(trail, trailTo, { ...SPRING_UI, duration: t(0.3), velocity: trailVelocity });`
  - `RubberSegment.jsx:170` `animate(trail, trailTo + dir * squash, { ...SPRING_UI, duration: t(0.3), velocity: trailVelocity }).then(() => {`
  - `RubberSegment.jsx:171` `if (gen.current === g) animate(trail, trailTo, { ...SPRING_RELAX, duration: t(0.16) });`
- 指针/滚动: 无指针监听.
- 可中断: 时间轴或 CSS, 不可中途保留速度.
- 性能: 无自管循环. 交给 CSS 或库.; ResizeObserver.
- 减弱动效: 有. `117` @media (prefers-reduced-motion: reduce) {
- Props: `items` (47), `value` (48), `defaultValue` (49), `onChange` (50), `trackColor='#27272a'` (51), `thumbColor='#fafafa'` (52), `textColor='#fafafa'` (53), `activeTextColor='#18181b'` (54), `size='md'` (55), `radius=10` (56), `inset=3` (57), `equalSlots=true` (58), `stretch=100` (59), `squash=3` (60), `speed=1` (61), `glide=75` (62), `draggable=true` (63), `disabled=false` (64), `className=''` (65)
- 裁决: 控件教材. 按下, 松开, 拖拽或吸附是分开的, 常数写进对应控件合同, 不整件移植.

### Micro/ScrubField

- 文件: `Micro/ScrubField/ScrubField.css` 163 行, `Micro/ScrubField/ScrubField.jsx` 350 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 SPRING_UI, LEAN, SIZES.
- 技法: DOM.
- 常数:
  - `ScrubField.css:9` `--sf-ease-out: cubic-bezier(0.23, 1, 0.32, 1);`
  - `ScrubField.css:32` `background-color 200ms ease,`
  - `ScrubField.css:33` `box-shadow 200ms ease;`
  - `ScrubField.css:38` `transition-duration: 0ms;`
  - `ScrubField.css:78` `color 120ms ease,`
  - `ScrubField.css:79` `transform 160ms var(--sf-ease-out);`
  - `ScrubField.css:109` `transition: color 120ms ease;`
  - `ScrubField.css:144` `opacity 125ms var(--sf-ease-out),`
  - `ScrubField.css:145` `scale 125ms var(--sf-ease-out);`
  - `ScrubField.css:156` `transition: color 120ms ease;`
  - `ScrubField.css:161` `transition: opacity 200ms ease;`
  - `ScrubField.jsx:16` `const SPRING_UI = { type: 'spring', duration: 0.3, bounce: 0 };`
  - `ScrubField.jsx:17` `const LEAN = 4;`
  - `ScrubField.jsx:220` `else animate(display, bound, { ...SPRING_UI, duration: returnDuration / 1000 });`
- 指针/滚动: keydown.
- 可中断: 时间轴或 CSS, 不可中途保留速度.
- 性能: 无自管循环. 交给 CSS 或库..
- 减弱动效: 有. `153` @media (prefers-reduced-motion: reduce) {
- Props: `label='Radius'` (40), `suffix='px'` (41), `defaultValue=24` (43), `min=0` (44), `max=100` (45), `step=1` (46), `size='md'` (47), `sensitivity=2` (48), `rubberReach=8` (49), `returnDuration=300` (50), `coarseMultiplier=10` (51), `fineMultiplier=0.1` (52), `showDelta=true` (53), `showDirty=false` (54), `showFill=true` (55), `accent='#f5f5f5'` (56), `chipColor='#27272a'` (57), `disabled=false` (58), `onChange` (59), `onCommit` (60), `className=''` (61)
- 裁决: 控件教材. 按下, 松开, 拖拽或吸附是分开的, 常数写进对应控件合同, 不整件移植.

### Micro/Shredder

- 文件: `Micro/Shredder/Shredder.css` 108 行, `Micro/Shredder/Shredder.jsx` 1025 行. 目录内实现已逐行扫描.
- 看起来: 2d 画布逐帧画. 命名常数 FOLLOW, SETTLE, TUG, TUG_DECAY, SLIT, OVER.
- 技法: canvas2d + SVG + rAF.
- 常数:
  - `Shredder.css:56` `transition: filter 240ms ease;`
  - `Shredder.jsx:8` `const FOLLOW = 30;`
  - `Shredder.jsx:9` `const SETTLE = 16;`
  - `Shredder.jsx:10` `const TUG = 2.4;`
  - `Shredder.jsx:11` `const TUG_DECAY = 0.14;`
  - `Shredder.jsx:12` `const SLIT = 6;`
  - `Shredder.jsx:13` `const OVER = 40;`
  - `Shredder.jsx:14` `const SLIVER = 2;`
  - `Shredder.jsx:15` `const STACK_K = 320;`
  - `Shredder.jsx:16` `const STACK_C = 22;`
  - `Shredder.jsx:17` `const STAGGER = 0.035;`
  - `Shredder.jsx:18` `const ENTER = 22;`
  - `Shredder.jsx:19` `const HYSTERESIS = 8;`
  - `Shredder.jsx:23` `const ease = (from, to, dt, tau) => from + (to - from) * (1 - Math.exp(-dt / tau));`
  - `Shredder.jsx:84` `const scale = Math.min(3, window.devicePixelRatio || 1);`
  - `Shredder.jsx:290` `sh = { el: slot, y: 0, v: 0, target: 0, delay: 0, item: null };`
  - `Shredder.jsx:321` `rec.delay = born * 0.05;`
  - `Shredder.jsx:333` `if (from >= 0) rec.delay = Math.max(0, from - 1 - idx) * STAGGER;`
  - `Shredder.jsx:582` `const dt = clamp((now - s.last) / 1000, 0, 0.05);`
  - `Shredder.jsx:609` `d.tilt = ease(d.tilt, lean, dt, 0.09);`
  - `Shredder.jsx:610` `d.lift = ease(d.lift, d.phase === 'return' ? 1 : c.lift, dt, 0.12);`
  - `Shredder.jsx:644` `f.rx = ease(f.rx, f.tx, dt, 0.1);`
  - `Shredder.jsx:645` `f.tilt = ease(f.tilt, 0, dt, 0.08);`
  - `Shredder.jsx:646` `f.lift = ease(f.lift, 1, dt, 0.1);`
  - `Shredder.jsx:664` `if (sh.delay > 0) {`
  - `Shredder.jsx:671` `el.style.transition = 'opacity 280ms ease';`
  - `Shredder.jsx:678` `const n = Math.ceil(dt * 240);`
  - `Shredder.jsx:734` `st.vy = ease(st.vy, st.speed * breath, dt, 0.25);`
  - `Shredder.jsx:735` `st.vx = ease(st.vx, st.splay * tear + (st.ax - m.rw / 2) * 0.25, dt, 0.4);`
  - (带数字的运动行共 30 条, 留前 28 条, 文件 1025 行已逐行扫过)
- 指针/滚动: 无指针监听.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; 读 devicePixelRatio; ResizeObserver.
- 减弱动效: 有. `104` @media (prefers-reduced-motion: reduce) {
- Props: `items=[]` (172), `renderItem` (173), `onShred` (174), `onReorder` (175), `width=340` (176), `height=460` (177), `inset=14` (178), `gap=10` (179), `slitHeight=4` (180), `fallHeight=140` (181), `feedSpeed=180` (182), `bite=18` (183), `autoFeed=true` (184), `stripWidth=10` (185), `curl=1` (186), `autoAnimate=false` (187), `loop=false` (188), `loopAfterDelete=false` (189), `dragTilt=6` (190), `lift=1.02` (191), `slitColor='#3f3f46'` (192), `color='#f5f5f5'` (193), `disabled=false` (194), `className=''` (195)
- 裁决: 控件教材. 按下, 松开, 拖拽或吸附是分开的, 常数写进对应控件合同, 不整件移植.

### Micro/SlideCommit

- 文件: `Micro/SlideCommit/SlideCommit.css` 201 行, `Micro/SlideCommit/SlideCommit.jsx` 364 行. 目录内实现已逐行扫描.
- 看起来: motion 的 spring 或 animate. 自己做 force, velocity, dt 积分. 命名常数 PAD, SQUASH_MAX, SQUASH_DIV, SWELL, MIN_PENDING, EASE_OUT.
- 技法: SVG + motion + 自写积分.
- 常数:
  - `SlideCommit.css:65` `opacity 200ms ease,`
  - `SlideCommit.css:66` `filter 200ms ease;`
  - `SlideCommit.css:95` `background-color 200ms ease,`
  - `SlideCommit.css:96` `color 200ms ease;`
  - `SlideCommit.css:143` `transition: filter 200ms ease;`
  - `SlideCommit.css:183` `animation: slide-commit-breathe 1.4s ease-in-out infinite;`
  - `SlideCommit.jsx:10` `const PAD = 4;`
  - `SlideCommit.jsx:11` `const SQUASH_MAX = 0.08;`
  - `SlideCommit.jsx:12` `const SQUASH_DIV = 110;`
  - `SlideCommit.jsx:13` `const SWELL = 1.03;`
  - `SlideCommit.jsx:14` `const MIN_PENDING = 300;`
  - `SlideCommit.jsx:86` `const mass = 0.9;`
  - `SlideCommit.jsx:87` `const critical = 2 * Math.sqrt(k * mass);`
  - `SlideCommit.jsx:89` `const homeSpring = { ...commitSpring, damping: critical * (1 - clamp(returnBounce, 0, 0.5)) };`
  - `SlideCommit.jsx:137` `if (reduce) animate(x, 0, { duration: 0.2, ease: EASE_OUT });`
  - `SlideCommit.jsx:143` `animate(shown, 1, { duration: 0.2, delay: 0.12 });`
  - `SlideCommit.jsx:145` `else animate(anchor, 0, { type: 'spring', duration: 0.3, bounce: 0 });`
  - `SlideCommit.jsx:151` `animate(spin, 0, { duration: 0.12 });`
  - `SlideCommit.jsx:156` `animate(pulse, [1, 1 - landingDip, 1], { duration: 0.46, times: [0, 0.62, 1], ease: EASE_OUT, delay: 0.1 });`
  - `SlideCommit.jsx:166` `animate(spin, 0, { duration: 0.12 });`
  - `SlideCommit.jsx:167` `animate(shown, 1, { duration: 0.2, delay: 0.12 });`
  - `SlideCommit.jsx:170` `animate(shake, SHAKE, { duration: 0.45, ease: EASE_OUT });`
  - `SlideCommit.jsx:191` `animate(shown, 0, { duration: 0.12 });`
  - `SlideCommit.jsx:196` `animate(shown, 0, { duration: 0.2 });`
  - `SlideCommit.jsx:197` `animate(spin, 1, { duration: 0.2 });`
  - `SlideCommit.jsx:351` `transition={{ duration: 0.2, ease: EASE_OUT }}`
- 指针/滚动: pointermove, pointerup, pointercancel.
- 可中断: pointercancel 有监听. 弹簧保留速度, 每帧重算目标.
- 性能: 无自管循环. 交给 CSS 或库..
- 减弱动效: 有. `181` @media (prefers-reduced-motion: reduce) {
- Props: `label='Slide to pay'` (44), `doneLabel='Paid'` (45), `errorLabel='Payment failed'` (46), `onConfirm` (47), `onDone` (48), `onError` (49), `trackColor='#262626'` (50), `handleColor='#f5f5f5'` (51), `successColor='#22c55e'` (52), `dangerColor='#e5484d'` (53), `width=280` (54), `height=56` (55), `radius=28` (56), `speed=50` (57), `returnBounce=0.38` (58), `landingDip=0.026` (59), `holdMs=1500` (60), `disabled=false` (61), `icon` (62), `className=''` (63)
- 裁决: 控件教材. 按下, 松开, 拖拽或吸附是分开的, 常数写进对应控件合同, 不整件移植.

### Micro/SlingButton

- 文件: `Micro/SlingButton/SlingButton.css` 166 行, `Micro/SlingButton/SlingButton.jsx` 414 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 GAP, SLOP, FINGER_MAX, HAND_MAX, CANCEL, POWER_CAP.
- 技法: SVG + rAF.
- 常数:
  - `SlingButton.css:11` `--sl-ease-out: cubic-bezier(0.23, 1, 0.32, 1);`
  - `SlingButton.css:33` `transition: fill 200ms ease;`
  - `SlingButton.css:45` `transition: stroke-width 160ms var(--sl-ease-out);`
  - `SlingButton.css:61` `transition: stroke-width 160ms var(--sl-ease-out);`
  - `SlingButton.css:117` `transition: transform 160ms var(--sl-ease-out);`
  - `SlingButton.jsx:17` `const GAP = 4;`
  - `SlingButton.jsx:18` `const SLOP = { fine: 4, coarse: 8 };`
  - `SlingButton.jsx:19` `const FINGER_MAX = 3000;`
  - `SlingButton.jsx:20` `const HAND_MAX = 6000;`
  - `SlingButton.jsx:21` `const CANCEL = 0.5;`
  - `SlingButton.jsx:22` `const POWER_CAP = 1.5;`
  - `SlingButton.jsx:23` `const DOT_MS = 300;`
  - `SlingButton.jsx:24` `const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';`
  - `SlingButton.jsx:106` `const duration = lead ? DOT_MS : DOT_MS * (0.7 + Math.random());`
  - `SlingButton.jsx:107` `const delay = lead ? 0 : Math.random() * 70;`
  - `SlingButton.jsx:137` `icon.style.transition = reduce ? 'none' : 'transform 360ms cubic-bezier(0.23, 1, 0.32, 1)';`
  - `SlingButton.jsx:197` `fx.style.transition = 'opacity 200ms ease';`
  - `SlingButton.jsx:207` `animX.current = animate(px, 0, { type: 'spring', duration: 0.4, bounce: recoil, velocity: v0.x });`
  - `SlingButton.jsx:208` `animY.current = animate(py, 0, { type: 'spring', duration: 0.4, bounce: recoil, velocity: v0.y });`
  - `SlingButton.jsx:283` `if (dt > 0 && performance.now() - b.t < 50) {`
  - `SlingButton.jsx:284` `vx = ((b.x - a.x) / dt) * 1000;`
  - `SlingButton.jsx:285` `vy = ((b.y - a.y) / dt) * 1000;`
- 指针/滚动: 无指针监听.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 未见 cancel.
- 减弱动效: 有. `161` @media (prefers-reduced-motion: reduce) {
- Props: `children` (30), `onSend` (31), `padColor='#f5f5f5'` (32), `iconColor='#18181b'` (33), `accentColor='#f5f5f5'` (34), `wellColor='#27272a'` (35), `bandColor='#52525b'` (36), `size=56` (37), `strokeWidth=3` (38), `armAt=48` (39), `maxPull=160` (40), `launchSpeed=2600` (41), `recoil=0.2` (42), `flight=120` (43), `particles=14` (44), `spread=60` (45), `axis='any'` (46), `tapSends=true` (47), `disabled=false` (48), `ariaLabel='Send'` (49), `className=''` (50)
- 裁决: 控件教材. 按下, 松开, 拖拽或吸附是分开的, 常数写进对应控件合同, 不整件移植.

### Micro/SloshGauge

- 文件: `Micro/SloshGauge/SloshGauge.css` 90 行, `Micro/SloshGauge/SloshGauge.jsx` 299 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 DT_MAX, TILT_GAIN, TILT_MAX, REST_POS, REST_VEL, STEP.
- 技法: DOM + rAF.
- 常数:
  - `SloshGauge.css:84` `transition: opacity 150ms ease;`
  - `SloshGauge.jsx:8` `const DT_MAX = 0.05;`
  - `SloshGauge.jsx:9` `const TILT_GAIN = 0.07;`
  - `SloshGauge.jsx:10` `const TILT_MAX = 30;`
  - `SloshGauge.jsx:11` `const REST_POS = 0.05;`
  - `SloshGauge.jsx:12` `const REST_VEL = 2;`
  - `SloshGauge.jsx:13` `const STEP = 2;`
  - `SloshGauge.jsx:14` `const BIG = 10;`
  - `SloshGauge.jsx:15` `const BAND = 10;`
  - `SloshGauge.jsx:81` `const dt = s.last ? Math.min((now - s.last) / 1000, DT_MAX) : H;`
  - `SloshGauge.jsx:91` `for (let n = Math.ceil(dt / H), h = dt / n; n > 0; n -= 1) {`
- 指针/滚动: change.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel.
- 减弱动效: 有. `138` const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
- Props: `value` (26), `defaultValue=60` (27), `onChange` (28), `interactive=false` (29), `showValue=true` (30), `disabled=false` (31), `liquidColor='#f5f5f5'` (32), `glassColor='#27272a'` (33), `width=88` (34), `height=180` (35), `radius=20` (36), `ticks=4` (37), `viscosity=0.15` (38), `tilt=0.45` (39), `splash=0.42` (40), `unit='%'` (41), `ariaLabel='Level'` (42), `className=''` (43)
- 裁决: 控件教材. 按下, 松开, 拖拽或吸附是分开的, 常数写进对应控件合同, 不整件移植.

### Micro/SpringCheck

- 文件: `Micro/SpringCheck/SpringCheck.css` 132 行, `Micro/SpringCheck/SpringCheck.jsx` 167 行. 目录内实现已逐行扫描.
- 看起来: motion 的 spring 或 animate. 命名常数 VISUAL_DURATION, RULE_END, SWELL, TICK_PATH, ORIGIN.
- 技法: SVG + motion.
- 常数:
  - `SpringCheck.css:13` `--sc-ease-out: cubic-bezier(0.23, 1, 0.32, 1);`
  - `SpringCheck.css:49` `transition: transform 160ms var(--sc-ease-out);`
  - `SpringCheck.css:78` `transition: opacity 120ms ease;`
  - `SpringCheck.jsx:9` `const VISUAL_DURATION = 0.2;`
  - `SpringCheck.jsx:10` `const RULE_END = 0.84;`
  - `SpringCheck.jsx:11` `const SWELL = 0.35;`
  - `SpringCheck.jsx:152` `<svg className="spring-check__tick" viewBox="0 0 24 24" aria-hidden="true">`
- 指针/滚动: 无指针监听.
- 可中断: 时间轴或 CSS, 不可中途保留速度.
- 性能: 无自管循环. 交给 CSS 或库..
- 减弱动效: 有. `128` @media (prefers-reduced-motion: reduce) {
- Props: `label='Ship the build'` (30), `checked` (31), `defaultChecked=false` (32), `onChange` (33), `disabled=false` (34), `color='#ffffff'` (35), `fillColor='#ffffff'` (36), `checkColor='#0b0b0f'` (37), `boxSize=28` (38), `boxRadius=9` (39), `fontSize=18` (40), `bounce=0.2` (41), `strikeLag=0.12` (42), `doneOpacity=0.42` (43), `strike='left'` (44), `ariaLabel` (45), `className=''` (46)
- 裁决: 控件教材. 按下, 松开, 拖拽或吸附是分开的, 常数写进对应控件合同, 不整件移植.

### Micro/SquishSwitch

- 文件: `Micro/SquishSwitch/SquishSwitch.css` 90 行, `Micro/SquishSwitch/SquishSwitch.jsx` 199 行. 目录内实现已逐行扫描.
- 看起来: motion 的 spring 或 animate. 命名常数 FLOW_SPRING, SWELL_SPRING, MAX_STRETCH, STRETCH_SPEED, TAP_SLOP.
- 技法: DOM + motion.
- 常数:
  - `SquishSwitch.css:88` `transition-duration: 1ms;`
  - `SquishSwitch.jsx:9` `const FLOW_SPRING = { stiffness: 320, damping: 40, mass: 0.6 };`
  - `SquishSwitch.jsx:10` `const SWELL_SPRING = { stiffness: 520, damping: 34, mass: 0.6 };`
  - `SquishSwitch.jsx:11` `const MAX_STRETCH = 0.4;`
  - `SquishSwitch.jsx:12` `const STRETCH_SPEED = 600;`
  - `SquishSwitch.jsx:13` `const TAP_SLOP = { fine: 4, coarse: 8 };`
  - `SquishSwitch.jsx:59` `const swell = useSpring(1, SWELL_SPRING);`
  - `SquishSwitch.jsx:81` `stiffness: 170 - (50 - clamp(speed, 0, 100)) * 1.1,`
  - `SquishSwitch.jsx:82` `damping: 21.5,`
  - `SquishSwitch.jsx:83` `mass: 0.9,`
- 指针/滚动: 无指针监听.
- 可中断: 时间轴或 CSS, 不可中途保留速度.
- 性能: 无自管循环. 交给 CSS 或库..
- 减弱动效: 有. `85` @media (prefers-reduced-motion: reduce) {
- Props: `checked` (16), `defaultChecked=false` (17), `onChange` (18), `label=''` (19), `disabled=false` (20), `trackColor='#27272a'` (21), `trackOnColor='#f5f5f5'` (22), `thumbColor=''` (23), `thumbOnColor=''` (24), `width=76` (25), `height=38` (26), `radius=19` (27), `speed=50` (28), `stretch=36` (29), `hoverScale=1.035` (30), `colorDuration=320` (31), `ariaLabel` (32), `className=''` (33), `id` (34)
- 裁决: 控件教材. 按下, 松开, 拖拽或吸附是分开的, 常数写进对应控件合同, 不整件移植.

### Micro/StatusMark

- 文件: `Micro/StatusMark/StatusMark.css` 179 行, `Micro/StatusMark/StatusMark.jsx` 157 行. 目录内实现已逐行扫描.
- 看起来: motion 的 spring 或 animate. 命名常数 MORPH, CHECK, CROSS, TEXT, IDLE_DASH.
- 技法: SVG + motion.
- 常数:
  - `StatusMark.css:10` `--sm-strike-delay: 180ms;`
  - `StatusMark.css:12` `--sm-check-delay: 120ms;`
  - `StatusMark.css:14` `--sm-ease-out: cubic-bezier(0.23, 1, 0.32, 1);`
  - `StatusMark.css:15` `--sm-ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);`
  - `StatusMark.css:29` `transition: color 200ms ease;`
  - `StatusMark.css:47` `fill-opacity 180ms ease,`
  - `StatusMark.css:48` `stroke-opacity 200ms ease;`
  - `StatusMark.css:66` `transition: opacity 200ms ease;`
  - `StatusMark.css:86` `stroke-dashoffset 160ms var(--sm-ease-out),`
  - `StatusMark.css:97` `opacity 0ms linear var(--sm-check-delay);`
  - `StatusMark.css:106` `transition: opacity 200ms ease;`
  - `StatusMark.css:136` `transition: transform 160ms var(--sm-ease-out);`
  - `StatusMark.css:141` `transition: transform 280ms var(--sm-ease-out) var(--sm-strike-delay);`
  - `StatusMark.css:161` `animation: sm-breathe 1400ms var(--sm-ease-in-out) infinite;`
  - `StatusMark.css:167` `transition: opacity 200ms ease;`
  - `StatusMark.css:173` `transition: opacity 200ms ease;`
  - `StatusMark.jsx:8` `const UI = { type: 'spring', duration: 0.3, bounce: 0 };`
  - `StatusMark.jsx:9` `const MORPH = { duration: 0.3, ease: [0.77, 0, 0.175, 1] };`
  - `StatusMark.jsx:10` `const CHECK = 'M7.5 12.25 10.5 15.25 16.75 8.75';`
  - `StatusMark.jsx:11` `const CROSS = 'M8.5 8.5 15.5 15.5M15.5 8.5 8.5 15.5';`
  - `StatusMark.jsx:19` `const IDLE_DASH = 0.3;`
  - `StatusMark.jsx:101` `animate(travel, [t0, t0 - C], { duration: spinDuration / 1000, ease: 'linear', repeat: Infinity });`
  - `StatusMark.jsx:130` `'--sm-strike-delay': '${120 + strikeDelay}ms',`
- 指针/滚动: 无指针监听.
- 可中断: 时间轴或 CSS, 不可中途保留速度.
- 性能: 无自管循环. 交给 CSS 或库..
- 减弱动效: 有. `159` @media (prefers-reduced-motion: reduce) {
- Props: `status='pending'` (24), `progress` (25), `label` (26), `color='currentColor'` (27), `doneColor='#22c55e'` (28), `errorColor='#ef4444'` (29), `size=20` (30), `strokeWidth=2` (31), `dashes=8` (32), `fontSize=14` (33), `spinDuration=1100` (34), `arcLength=0.68` (35), `drawDuration=240` (36), `fillOpacity=0.06` (37), `strike=true` (38), `strikeDelay=60` (39), `className=''` (40), `style` (41)
- 裁决: 控件教材. 按下, 松开, 拖拽或吸附是分开的, 常数写进对应控件合同, 不整件移植.

### Micro/SwipeRow

- 文件: `Micro/SwipeRow/SwipeRow.css` 225 行, `Micro/SwipeRow/SwipeRow.jsx` 423 行. 目录内实现已逐行扫描.
- 看起来: motion 的 spring 或 animate. 命名常数 HYST, FLICK, DECEL, VMAX, EASE_OUT, SPRING_UI.
- 技法: DOM + motion.
- 常数:
  - `SwipeRow.css:12` `--sr-ease-out: cubic-bezier(0.23, 1, 0.32, 1);`
  - `SwipeRow.css:82` `transition: opacity 150ms ease;`
  - `SwipeRow.css:98` `transition: transform 160ms var(--sr-ease-out);`
  - `SwipeRow.jsx:10` `const HYST = 10;`
  - `SwipeRow.jsx:11` `const FLICK = 110;`
  - `SwipeRow.jsx:12` `const DECEL = 0.998;`
  - `SwipeRow.jsx:13` `const VMAX = 1500;`
  - `SwipeRow.jsx:15` `const SPRING_UI = { type: 'spring', duration: 0.3, bounce: 0 };`
  - `SwipeRow.jsx:161` `animate(x, s * target, { duration: 0.2, ease: EASE_OUT });`
  - `SwipeRow.jsx:169` `? { type: 'spring', duration: 0.4, bounce: snapBounce, velocity: s * clamp(v, -VMAX, VMAX) }`
  - `SwipeRow.jsx:202` `} else animate(x, s * w.current, { duration: 0.2, ease: EASE_OUT }).then(fold);`
- 指针/滚动: pointermove, pointerup, pointercancel.
- 可中断: pointercancel 有监听.
- 性能: 无自管循环. 交给 CSS 或库.; ResizeObserver.
- 减弱动效: 有. `221` @media (prefers-reduced-motion: reduce) {
- Props: `children` (55), `actions=DEFAULT_ACTIONS` (56), `actionColor='#e5484d'` (57), `drawerColor='#3f3f46'` (58), `rowColor='#27272a'` (59), `textColor='#f5f5f5'` (60), `height=64` (61), `radius=16` (62), `actionWidth=80` (63), `direction='left'` (64), `snapBounce=0.2` (65), `resistance=0.55` (66), `collapseMs=200` (67), `commitAt=0.6` (68), `fullSwipe=true` (69), `disabled=false` (70), `onOpenChange` (72), `onAction` (73), `onCommit` (74), `closeOnAction=true` (75), `haptic=true` (76), `label='List item'` (77), `className=''` (78), `style` (79)
- 裁决: 控件教材. 按下, 松开, 拖拽或吸附是分开的, 常数写进对应控件合同, 不整件移植.

### Micro/SwipeToast

- 文件: `Micro/SwipeToast/SwipeToast.css` 268 行, `Micro/SwipeToast/SwipeToast.jsx` 318 行. 目录内实现已逐行扫描.
- 看起来: motion 的 spring 或 animate. 命名常数 EASE_OUT, FLICK, DEAD_ZONE, RESIST_PX, COLLAPSE_MS, EXIT.
- 技法: DOM + motion.
- 常数:
  - `SwipeToast.css:12` `--st-ease-out: cubic-bezier(0.23, 1, 0.32, 1);`
  - `SwipeToast.css:51` `transition-duration: calc(var(--st-slide) * 0.7);`
  - `SwipeToast.css:55` `transition-duration: 200ms;`
  - `SwipeToast.css:71` `opacity calc(var(--st-slide) * 0.6) ease;`
  - `SwipeToast.css:94` `transform calc(var(--st-slide) * 0.7) var(--st-ease-out),`
  - `SwipeToast.css:95` `opacity calc(var(--st-slide) * 0.5) ease;`
  - `SwipeToast.css:105` `transition-duration: 0s;`
  - `SwipeToast.css:179` `transform 160ms var(--st-ease-out),`
  - `SwipeToast.css:180` `background-color 160ms ease,`
  - `SwipeToast.css:181` `opacity 160ms ease;`
  - `SwipeToast.css:261` `transition: opacity 200ms ease;`
  - `SwipeToast.jsx:11` `const FLICK = 0.11;`
  - `SwipeToast.jsx:12` `const DEAD_ZONE = 3;`
  - `SwipeToast.jsx:13` `const RESIST_PX = 24;`
  - `SwipeToast.jsx:14` `const COLLAPSE_MS = 200;`
  - `SwipeToast.jsx:15` `const EXIT = 0.7;`
  - `SwipeToast.jsx:43` `duration = 4000,`
  - `SwipeToast.jsx:118` `if (phase !== 'open' || duration <= 0 || !fuseRef.current) return undefined;`
  - `SwipeToast.jsx:156` `animate(y, dy + cardRef.current.offsetHeight, { type: 'spring', duration: 0.3, bounce: 0, velocity: v * 1000 });`
  - `SwipeToast.jsx:158` `animate(fade, 0, { duration: 0.2, ease: EASE_OUT }).then(() => finish('swipe'));`
  - `SwipeToast.jsx:213` `? { duration: 0.2, ease: EASE_OUT }`
  - `SwipeToast.jsx:214` `: { type: 'spring', duration: 0.5, bounce: settleBounce, velocity: v * 1000 }`
  - `SwipeToast.jsx:228` `data-fuse={duration > 0 ? fuse : 'none'}`
- 指针/滚动: visibilitychange.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 未见 cancel; 离屏或隐藏时有暂停线索.
- 减弱动效: 有. `258` @media (prefers-reduced-motion: reduce) {
- Props: `title='File archived'` (28), `description=''` (29), `icon` (30), `actionLabel=''` (31), `onAction` (32), `open=true` (33), `onClose` (34), `background='#27272a'` (35), `color='#f5f5f5'` (36), `fuseColor='#f5a524'` (37), `width=356` (38), `radius=12` (39), `slideMs=400` (40), `settleBounce=0.2` (41), `swipeDistance=40` (42), `duration=4000` (43), `fuse='bottom'` (44), `pauseOnHover=true` (45), `closeButton=false` (46), `inline=false` (47), `dismissible=true` (48), `className=''` (49)
- 裁决: 控件教材. 按下, 松开, 拖拽或吸附是分开的, 常数写进对应控件合同, 不整件移植.

### Micro/TearTicket

- 文件: `Micro/TearTicket/TearTicket.css` 209 行, `Micro/TearTicket/TearTicket.jsx` 609 行. 目录内实现已逐行扫描.
- 看起来: motion 的 spring 或 animate. 命名常数 TILT_SPRING, GRAVITY, ART_INSET, ART_SPAN, RETRACT.
- 技法: SVG + motion.
- 常数:
  - `TearTicket.css:39` `transition: transform 650ms cubic-bezier(0.22, 1, 0.36, 1);`
  - `TearTicket.css:121` `transition: filter 700ms ease;`
  - `TearTicket.css:146` `transition: opacity 500ms ease;`
  - `TearTicket.css:177` `transition-duration: 0ms;`
  - `TearTicket.jsx:8` `const TILT_SPRING = { stiffness: 220, damping: 24, mass: 0.6 };`
  - `TearTicket.jsx:9` `const GRAVITY = 2400;`
  - `TearTicket.jsx:10` `const ART_INSET = 8;`
  - `TearTicket.jsx:11` `const ART_SPAN = 0.78;`
  - `TearTicket.jsx:12` `const RETRACT = 0.17;`
  - `TearTicket.jsx:164` `const tiltX = useSpring(0, TILT_SPRING);`
  - `TearTicket.jsx:165` `const tiltY = useSpring(0, TILT_SPRING);`
  - `TearTicket.jsx:272` `const dt = clamp((now - s.last) / 1000, 0.001, 0.034);`
  - `TearTicket.jsx:283` `s.theta += (want - s.theta) * (1 - Math.exp(-dt / 0.035));`
  - `TearTicket.jsx:289` `s.sx += (px - s.sx) * (1 - Math.exp(-dt / 0.05));`
  - `TearTicket.jsx:290` `s.sy += (py - s.sy) * (1 - Math.exp(-dt / 0.05));`
  - `TearTicket.jsx:313` `s.sx += (wx - s.sx) * (1 - Math.exp(-dt / 0.045));`
  - `TearTicket.jsx:314` `s.sy += (wy - s.sy) * (1 - Math.exp(-dt / 0.045));`
  - `TearTicket.jsx:316` `s.theta += (hang - s.theta) * (1 - Math.exp(-dt / 0.12));`
  - `TearTicket.jsx:329` `s.thetaV += (-300 * s.theta - 24 * s.thetaV) * dt;`
  - `TearTicket.jsx:331` `s.sx += (0 - s.sx) * (1 - Math.exp(-dt / 0.07));`
  - `TearTicket.jsx:332` `s.sy += (0 - s.sy) * (1 - Math.exp(-dt / 0.07));`
  - `TearTicket.jsx:341` `s.bv += (-520 * s.bx - 30 * s.bv) * dt;`
  - `TearTicket.jsx:454` `const dt = Math.max(0.004, (now - s.pt) / 1000);`
  - `TearTicket.jsx:455` `s.pvx += ((p.x - s.point.x) / dt - s.pvx) * 0.35;`
  - `TearTicket.jsx:456` `s.pvy += ((p.y - s.point.y) / dt - s.pvy) * 0.35;`
- 指针/滚动: pointermove.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; ResizeObserver.
- 减弱动效: 有. `205` @media (prefers-reduced-motion: reduce) {
- Props: `children=null` (76), `stub=null` (77), `image=''` (78), `imageAlt=''` (79), `scrim=true` (80), `imageRadius=8` (81), `orientation='horizontal'` (82), `torn` (83), `defaultTorn=false` (84), `onTear` (85), `width=460` (86), `height=250` (87), `stubSize=150` (88), `radius=16` (89), `holes=12` (90), `holeSize=6` (91), `notch=3` (92), `roughness=0` (93), `tearAngle=30` (94), `stretch=30` (95), `resistance=0.45` (96), `rotate=4` (97), `tilt=true` (98), `tiltMax=9` (99)
- 裁决: 控件教材. 按下, 松开, 拖拽或吸附是分开的, 常数写进对应控件合同, 不整件移植.

### Micro/ThoughtLine

- 文件: `Micro/ThoughtLine/ThoughtLine.css` 257 行, `Micro/ThoughtLine/ThoughtLine.jsx` 266 行. 目录内实现已逐行扫描.
- 看起来: motion 的 spring 或 animate. 命名常数 EASE_OUT, EASE_IN_OUT, GLYPH_DONE, EMPTY_STEPS.
- 技法: DOM + motion.
- 常数:
  - `ThoughtLine.css:2` `--tl-ease-out: cubic-bezier(0.23, 1, 0.32, 1);`
  - `ThoughtLine.css:3` `--tl-ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);`
  - `ThoughtLine.css:134` `opacity 200ms ease,`
  - `ThoughtLine.css:135` `transform 200ms var(--tl-ease-out);`
  - `ThoughtLine.css:191` `opacity 200ms var(--tl-ease-out),`
  - `ThoughtLine.css:192` `transform 200ms var(--tl-ease-out);`
  - `ThoughtLine.css:217` `animation: thought-line-pulse 1.6s var(--tl-ease-in-out) infinite;`
  - `ThoughtLine.css:251` `transition: opacity 200ms ease;`
  - `ThoughtLine.css:255` `animation-duration: 2.4s;`
  - `ThoughtLine.jsx:11` `const GLYPH_DONE = 0.55;`
  - `ThoughtLine.jsx:82` `animate(el, { opacity: [trough, 1, trough] }, { duration: period, ease: EASE_IN_OUT, repeat: Infinity, delay });`
  - `ThoughtLine.jsx:87` `if (sheen) running.push(animate(breathEl, { opacity: 1 }, { duration: 0.2, ease: EASE_OUT }));`
  - `ThoughtLine.jsx:89` `const lead = animate(glyphEl, { opacity: trough }, { duration: 0.2, ease: EASE_OUT });`
  - `ThoughtLine.jsx:100` `if (glyphEl) running.push(animate(glyphEl, { opacity: 1 }, { duration: 0.2, ease: EASE_OUT }));`
  - `ThoughtLine.jsx:101` `running.push(animate(breathEl, { opacity: 1 }, { duration: 0.2, ease: EASE_OUT }));`
  - `ThoughtLine.jsx:105` `running.push(animate(breathEl, { opacity: 1 }, { duration: s, ease: EASE_OUT }));`
- 指针/滚动: 无指针监听.
- 可中断: 时间轴或 CSS, 不可中途保留速度.
- 性能: 无自管循环. 交给 CSS 或库.; ResizeObserver.
- 减弱动效: 有. `239` @media (prefers-reduced-motion: reduce) {
- Props: `label='Thinking…'` (21), `doneLabel=''` (22), `renderLabel` (23), `glyph='sparkle'` (24), `steps=EMPTY_STEPS` (25), `collapsible=true` (26), `collapseOnSettle=true` (27), `color='currentColor'` (28), `glyphColor=''` (29), `fontSize=16` (30), `breathPeriod=1.6` (31), `breathDepth=0.45` (32), `shimmer=true` (33), `shimmerDuration=1.8` (34), `settleDuration=350` (35), `settleBlur=2` (36), `working=true` (37), `settleAfter=0` (38), `elapsed` (39), `showTimer=true` (40), `onSettle` (41), `className=''` (42), `style` (43)
- 裁决: 控件教材. 按下, 松开, 拖拽或吸附是分开的, 常数写进对应控件合同, 不整件移植.

### Micro/VoicePill

- 文件: `Micro/VoicePill/VoicePill.css` 235 行, `Micro/VoicePill/VoicePill.jsx` 415 行. 目录内实现已逐行扫描.
- 看起来: 2d 画布逐帧画. 命名常数 LOOP, SYLLABLES, MIC_BINS, MIC_GAIN, DT_MAX, SLIDE_MIN.
- 技法: canvas2d + rAF.
- 常数:
  - `VoicePill.css:19` `--vp-ease-out: cubic-bezier(0.23, 1, 0.32, 1);`
  - `VoicePill.css:42` `transform 160ms var(--vp-ease-out),`
  - `VoicePill.css:43` `color 150ms ease;`
  - `VoicePill.css:76` `background-color 150ms ease;`
  - `VoicePill.css:108` `opacity 200ms ease,`
  - `VoicePill.css:109` `filter 200ms ease,`
  - `VoicePill.css:110` `transform 240ms var(--vp-ease-out);`
  - `VoicePill.css:129` `opacity 200ms ease,`
  - `VoicePill.css:130` `filter 200ms ease,`
  - `VoicePill.css:131` `transform 240ms var(--vp-ease-out);`
  - `VoicePill.css:170` `transition: transform 240ms var(--vp-ease-out);`
  - `VoicePill.css:176` `opacity 200ms ease,`
  - `VoicePill.css:177` `filter 200ms ease,`
  - `VoicePill.css:178` `transform 200ms var(--vp-ease-out);`
  - `VoicePill.css:210` `transition-duration: 0ms;`
  - `VoicePill.css:216` `transition: color 150ms ease;`
  - `VoicePill.css:220` `transition: background-color 150ms ease;`
  - `VoicePill.css:226` `transition: opacity 200ms ease;`
  - `VoicePill.jsx:8` `const LOOP = 4.8;`
  - `VoicePill.jsx:29` `const MIC_GAIN = 2.2;`
  - `VoicePill.jsx:30` `const DT_MAX = 0.05;`
  - `VoicePill.jsx:31` `const SLIDE_MIN = 4;`
  - `VoicePill.jsx:32` `const WAVE_EVERY = 4;`
  - `VoicePill.jsx:33` `const WAVE_MAX = 80;`
  - `VoicePill.jsx:55` `const dpr = Math.min(2, window.devicePixelRatio || 1);`
  - `VoicePill.jsx:196` `const dt = Math.min((now - s.last) / 1000, DT_MAX);`
  - `VoicePill.jsx:205` `s.env += (target - s.env) * (1 - Math.exp(-dt / tau));`
  - `VoicePill.jsx:211` `s.raf = s.listening ? requestAnimationFrame(frame) : 0;`
- 指针/滚动: blur, visibilitychange.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; 读 devicePixelRatio; 离屏或隐藏时有暂停线索.
- 减弱动效: 有. `213` @media (prefers-reduced-motion: reduce) {
- Props: `accentColor='#f5f5f5'` (127), `iconColor='#a1a1aa'` (128), `background='#27272a'` (129), `size=28` (130), `shape='pill'` (131), `reach=8` (132), `showTime=true` (133), `waveform=true` (134), `slideToCancel=true` (135), `cancelDistance=64` (136), `attack=40` (137), `release=240` (138), `sensitivity=1` (139), `floor=0.1` (140), `openDuration=200` (141), `pressScale=0.95` (142), `mode='auto'` (143), `holdAfter=300` (144), `reactive='simulated'` (145), `disabled=false` (146), `ariaLabel='Dictate'` (147), `onStart` (148), `onStop` (149), `className=''` (150)
- 裁决: 控件教材. 按下, 松开, 拖拽或吸附是分开的, 常数写进对应控件合同, 不整件移植.

### Micro/WakeSlider

- 文件: `Micro/WakeSlider/WakeSlider.css` 100 行, `Micro/WakeSlider/WakeSlider.jsx` 240 行. 目录内实现已逐行扫描.
- 看起来: motion 的 spring 或 animate. 自己做 force, velocity, dt 积分. 命名常数 SETTLE, FULL_SPEED, MIN_REACH, FLAT.
- 技法: DOM + motion + 自写积分.
- 常数:
  - `WakeSlider.css:55` `transition: background-color 120ms ease;`
  - `WakeSlider.css:63` `transition-duration: 0ms;`
  - `WakeSlider.jsx:8` `const SETTLE = 9.23;`
  - `WakeSlider.jsx:9` `const FULL_SPEED = 320;`
  - `WakeSlider.jsx:10` `const MIN_REACH = 1.5;`
  - `WakeSlider.jsx:11` `const FLAT = 0.002;`
  - `WakeSlider.jsx:14` `const smoothstep = s => s * s * (3 - 2 * s);`
  - `WakeSlider.jsx:68` `const head = useSpring(target, { stiffness: w0 * w0, damping: 2 * w0, mass: 1 });`
  - `WakeSlider.jsx:71` `const speed = useSpring(rawSpeed, { stiffness: wv * wv, damping: 2.5 * wv, mass: 1 });`
  - `WakeSlider.jsx:77` `const paint = (force = false) => {`
  - `WakeSlider.jsx:80` `const amp = smoothstep(clamp((Math.abs(v) * sensitivity) / FULL_SPEED, 0, 1));`
  - `WakeSlider.jsx:86` `const flat = !force && amp < FLAT && lastAmp.current < FLAT;`
- 指针/滚动: 无指针监听.
- 可中断: 时间轴或 CSS, 不可中途保留速度.
- 性能: 无自管循环. 交给 CSS 或库..
- 减弱动效: 有. `96` @media (prefers-reduced-motion: reduce) {
- Props: `defaultValue=50` (26), `onChange` (27), `min=0` (28), `max=100` (29), `step=1` (30), `bars=32` (31), `height=56` (32), `restHeight=12` (33), `gap=4` (34), `fillColor='#f5f5f5'` (35), `trackColor='#27272a'` (36), `crestColor=''` (37), `sensitivity=1` (38), `reach=6` (39), `skew=0.6` (40), `glide=0.3` (41), `smoothing=100` (42), `showValue=false` (43), `formatValue` (44), `disabled=false` (45), `ariaLabel='Value'` (46), `className=''` (47)
- 裁决: 控件教材. 按下, 松开, 拖拽或吸附是分开的, 常数写进对应控件合同, 不整件移植.

### Micro/WarmTooltip

- 文件: `Micro/WarmTooltip/WarmTooltip.css` 169 行, `Micro/WarmTooltip/WarmTooltip.jsx` 585 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 EASE_OUT, LEAN_SPRING, FULL_LEAN_SPEED, SIGN, ORIGIN, SIZES.
- 技法: DOM + rAF.
- 常数:
  - `WarmTooltip.css:4` `--wt-ease-out: cubic-bezier(0.23, 1, 0.32, 1);`
  - `WarmTooltip.css:31` `transform 125ms var(--wt-ease-out),`
  - `WarmTooltip.css:32` `opacity 125ms var(--wt-ease-out);`
  - `WarmTooltip.css:68` `opacity 80ms var(--wt-ease-out);`
  - `WarmTooltip.jsx:31` `const LEAN_SPRING = { stiffness: 260, damping: 22, mass: 0.4 };`
  - `WarmTooltip.jsx:32` `const FULL_LEAN_SPEED = 1200;`
  - `WarmTooltip.jsx:33` `const SIGN = { top: 1, bottom: -1, left: -1, right: 1 };`
  - `WarmTooltip.jsx:40` `const MARGIN = 8;`
  - `WarmTooltip.jsx:41` `const HOLD_SLOP = 10;`
  - `WarmTooltip.jsx:42` `const SWAP = 0.14;`
  - `WarmTooltip.jsx:43` `const SWAP_SHIFT = 10;`
  - `WarmTooltip.jsx:44` `const RISE = 4;`
  - `WarmTooltip.jsx:45` `const GRACE = 80;`
  - `WarmTooltip.jsx:86` `{ delay = 400, warmWindow = 300, travel = 320, lean = 0, onWarmChange, children },`
  - `WarmTooltip.jsx:202` `animate(presence, 0, { duration: closeMs / 1000, ease: EASE_OUT });`
  - `WarmTooltip.jsx:247` `const spring = { type: 'spring', duration: travel / 1000, bounce: 0.1 };`
  - `WarmTooltip.jsx:252` `animate(presence, 1, { duration: 0.12, ease: EASE_OUT });`
  - `WarmTooltip.jsx:261` `animate(presence, 1, { duration: c.popDuration / 1000, ease: EASE_OUT });`
  - `WarmTooltip.jsx:340` `transition={{ duration: reduce ? 0 : SWAP, ease: EASE_OUT }}`
- 指针/滚动: scroll, resize, visibilitychange, pointerdown.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; 离屏或隐藏时有暂停线索.
- 减弱动效: 有. `22` useReducedMotion,
- Props: `content` (366), `shortcut` (367), `children` (368), `side` (369), `delay` (370), `warmWindow` (371), `surfaceColor` (372), `inkColor` (373), `size` (374), `radius` (375), `gap` (376), `arrow` (377), `popDuration` (378), `popScale` (379), `popBlur` (380), `showFuse` (381), `longPress` (382), `disabled` (383), `className` (384)
- 裁决: 控件教材. 按下, 松开, 拖拽或吸附是分开的, 常数写进对应控件合同, 不整件移植.
