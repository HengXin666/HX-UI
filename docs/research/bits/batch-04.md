# react-bits batch 04

来源提交 `4dc7b5b`. 这 19 个背景目录的运动行, 与 catalog 同一份逐行扫描.

### Backgrounds/GhostFibers

- 文件: `Backgrounds/GhostFibers/GhostFibers.css` 14 行, `Backgrounds/GhostFibers/GhostFibers.jsx` 1092 行. 目录内实现已逐行扫描.
- 看起来: 着色器场, uniform 有 uTime, uTwist, uRoll, uWaves, uWidth, uRibbon, uOrient, uScale. 命名常数 MAX_RENDER_DIM, BLOOM_LEVELS, INTRO_SECONDS, CAMERA, FOV, RIBBON_LENGTH.
- 技法: WebGL + canvas2d + rAF.
- 常数:
  - `GhostFibers.jsx:7` `const MAX_RENDER_DIM = 2400;`
  - `GhostFibers.jsx:8` `const BLOOM_LEVELS = 5;`
  - `GhostFibers.jsx:9` `const INTRO_SECONDS = 2.6;`
  - `GhostFibers.jsx:10` `const CAMERA = 7.5;`
  - `GhostFibers.jsx:11` `const FOV = 0.56;`
  - `GhostFibers.jsx:12` `const RIBBON_LENGTH = 24;`
  - `GhostFibers.jsx:13` `const HOVER_EFFECTS = { focus: 0, part: 1, none: 2 };`
  - `GhostFibers.jsx:14` `const FIBER_STYLES = { dots: 0, dashes: 0.45, lines: 1 };`
  - `GhostFibers.jsx:15` `const GRADIENTS = { depth: 0, along: 1, across: 2 };`
  - `GhostFibers.jsx:24` `const FOCAL = 1 / (2 * Math.tan(FOV / 2));`
  - `GhostFibers.jsx:123` `return px + away / max(dist, 1e-3) * push * smoothstep(0.0, radius * 0.25, dist);`
  - `GhostFibers.jsx:163` `float widthPx = 2.0 * uWidth * uScale * focalPx;`
  - `GhostFibers.jsx:169` `float endFade = smoothstep(0.5, 0.4, abs(s)) * smoothstep(1.6, 4.2, depth);`
  - `GhostFibers.jsx:172` `endFade *= smoothstep(tipEnd + 0.003, tipEnd - 0.001, s);`
  - `GhostFibers.jsx:173` `float appear = smoothstep(0.0, 0.12, uIntro * 1.3 - (s + 0.5) - seed * 0.12);`
  - `GhostFibers.jsx:196` `float depthTint = clamp(uTint + smoothstep(uFocus, uFocus + 5.0, depth) * 0.5, 0.0, 1.0);`
  - `GhostFibers.jsx:197` `vTint = uGradient < 0.5 ? depthTint : uGradient < 1.5 ? smoothstep(-0.42, 0.42, s) : clamp(v * 0.5 + 0.5, 0.0, 1.0);`
  - `GhostFibers.jsx:246` `float intensity = energy * (0.35 + 0.65 * twinkle) * mix(0.4, 1.0, seed.x) * smoothstep(0.3, 1.0, uIntro) * (depth > 0.2 ? 1.0 : 0.0);`
  - `GhostFibers.jsx:273` `float disk = 1.0 - smoothstep(1.0 - soft, 1.0, rho);`
  - `GhostFibers.jsx:274` `float bokeh = disk * (0.94 + 0.08 * smoothstep(0.55, 0.95, rho));`
  - `GhostFibers.jsx:276` `float shape = mix(core, bokeh, smoothstep(0.25, 0.7, vLight.z));`
  - `GhostFibers.jsx:297` `return c * smoothstep(0.35, 1.2, peak);`
  - `GhostFibers.jsx:766` `const baseDpr = Math.min(s.dpr || window.devicePixelRatio || 1, 2);`
  - `GhostFibers.jsx:944` `const dt = Math.min(0.05, elapsed);`
  - `GhostFibers.jsx:951` `state.flow += dt * s.flow * 12;`
  - `GhostFibers.jsx:966` `hover.x += (pointer.x - hover.x) * (1 - Math.exp(-dt / 0.08));`
  - `GhostFibers.jsx:967` `hover.y += (pointer.y - hover.y) * (1 - Math.exp(-dt / 0.08));`
  - `GhostFibers.jsx:969` `hover.presence += (goal - hover.presence) * (1 - Math.exp(-dt / (goal > hover.presence ? 0.3 : 0.6)));`
  - (带数字的运动行共 31 条, 留前 28 条, 文件 1092 行已逐行扫过)
- 指针/滚动: pointermove, pointerdown, pointerleave, visibilitychange.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; 读 devicePixelRatio; 离屏或隐藏时有暂停线索; ResizeObserver.
- 减弱动效: 有. `669` const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
- Props: `glowColor='#8b5cf6'` (538), `lineColor` (539), `secondaryColor` (540), `gradient='depth'` (541), `speed=0.5` (542), `scale=1` (543), `rotation=18` (544), `rollSpeed=0.15` (545), `layers=3` (546), `waves=1` (547), `twist=1.2` (548), `threads=72` (549), `volume=0.7` (550), `spread=1` (551), `density=1` (552), `thickness=1` (553), `flow=0.4` (554), `fiberStyle='dots'` (555), `tips=0` (556), `foldGlow=1` (557), `perspective=0.65` (558), `depthOfField=0.85` (559), `focusDepth=0` (560), `particles=0.5` (561)
- 裁决: 不做. 全屏场和控件状态机无关, 首页最多留一个主角效果, 不进默认包.


### Backgrounds/GradientASCII

- 文件: `Backgrounds/GradientASCII/GradientASCII.css` 14 行, `Backgrounds/GradientASCII/GradientASCII.jsx` 847 行. 目录内实现已逐行扫描.
- 看起来: 着色器场, uniform 有 uAspect, uTime, uShape, uRamp, uCount, uScale, uSoftness, uFlow. 命名常数 MAX_COLORS, MAX_CLICKS, MAX_TRAIL, CLICK_LIFE, TRAIL_LIFE, TRAIL_STEP.
- 技法: WebGL + canvas2d + rAF.
- 常数:
  - `GradientASCII.jsx:6` `const MAX_COLORS = 8;`
  - `GradientASCII.jsx:7` `const MAX_CLICKS = 4;`
  - `GradientASCII.jsx:8` `const MAX_TRAIL = 24;`
  - `GradientASCII.jsx:9` `const CLICK_LIFE = 1.2;`
  - `GradientASCII.jsx:10` `const TRAIL_LIFE = 0.7;`
  - `GradientASCII.jsx:11` `const TRAIL_STEP = 0.015;`
  - `GradientASCII.jsx:12` `const INTRO_SECONDS = 2.4;`
  - `GradientASCII.jsx:13` `const ATLAS_CELL_W = 60;`
  - `GradientASCII.jsx:14` `const ATLAS_CELL_H = 100;`
  - `GradientASCII.jsx:15` `const ATLAS_COLUMNS = 16;`
  - `GradientASCII.jsx:16` `const FONT_SCALE = 0.78;`
  - `GradientASCII.jsx:18` `const DEFAULT_CHARACTERS = ' =+xX0S8#@';`
  - `GradientASCII.jsx:20` `const SHAPES = { horizon: 0, pinch: 1, rise: 2, eclipse: 3 };`
  - `GradientASCII.jsx:21` `const CLICK_EFFECTS = { none: 0, wave: 1, burst: 2 };`
  - `GradientASCII.jsx:98` `float span = 0.5 * max(uAspect, 1.0);`
  - `GradientASCII.jsx:100` `float arch = -0.17 - 0.2 * x * x + 0.02 * sin(time * 0.6);`
  - `GradientASCII.jsx:103` `float rim = 0.38 * smoothstep(-soft, 0.42, edge);`
  - `GradientASCII.jsx:106` `float sky = mix(0.55, 1.0, smoothstep(0.2, 0.95, spread));`
  - `GradientASCII.jsx:108` `return vec3(rim, sky, smoothstep(0.18, 0.62, edge));`
  - `GradientASCII.jsx:112` `float span = 0.5 * max(uAspect, 0.75);`
  - `GradientASCII.jsx:114` `float sway = 0.02 * sin(x * 1.7 + time * 0.55);`
  - `GradientASCII.jsx:115` `float breathe = 1.0 + 0.06 * sin(time * 0.8);`
  - `GradientASCII.jsx:136` `float r = 0.23 * fit * (1.0 + 0.015 * sin(time * 0.9));`
  - `GradientASCII.jsx:141` `float t = smoothstep(-0.006, 0.006 + 0.02 * uSoftness, d) * exp(-max(d, 0.0) / reach);`
  - `GradientASCII.jsx:147` `float x = smoothstep(0.3, 1.0, t) * float(uCount - 1);`
  - `GradientASCII.jsx:149` `return vec4(mix(uRamp[index], uRamp[min(index + 1, uCount - 1)], fract(x)), smoothstep(0.0, 0.38, t));`
  - `GradientASCII.jsx:161` `float order = 0.0;`
  - `GradientASCII.jsx:171` `float scramble = 0.0;`
  - (带数字的运动行共 36 条, 留前 28 条, 文件 847 行已逐行扫过)
- 指针/滚动: pointermove, pointerdown, visibilitychange.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; 读 devicePixelRatio; 离屏或隐藏时有暂停线索; ResizeObserver.
- 减弱动效: 有. `526` const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
- Props: `colors=DEFAULT_COLORS` (426), `shape='horizon'` (427), `characters=DEFAULT_CHARACTERS` (428), `cellSize=18` (429), `density=0.8` (430), `glyphOpacity=0.85` (431), `glow=0.2` (432), `depthOfField=0` (433), `flicker=0.2` (434), `softness=0.5` (435), `scale=1` (436), `flow=0.5` (437), `speed=1` (438), `gradientOpacity=0.9` (439), `grain=0.08` (440), `variation=0` (441), `mouseInteraction=true` (442), `scrambleRadius=0.1` (443), `clickEffect='wave'` (444), `intro=true` (445), `lightMode=false` (446), `fontFamily=DEFAULT_FONT` (447), `dpr` (448), `className=''` (449)
- 裁决: 不做. 全屏场和控件状态机无关, 首页最多留一个主角效果, 不进默认包.


### Backgrounds/GradientBlinds

- 文件: `Backgrounds/GradientBlinds/GradientBlinds.css` 14 行, `Backgrounds/GradientBlinds/GradientBlinds.jsx` 587 行. 目录内实现已逐行扫描.
- 看起来: 着色器场, uniform 有 uResolution, uTime, uMouse, uAngle, uNoise, uBlindCount, uSpotlightRadius, uSpotlightSoftness. 命名常数 MAX_COLORS, MAX_WAVES, INTRO_SECONDS, RIPPLE_SECONDS, VERTEX, FRAGMENT.
- 技法: WebGL + rAF.
- 常数:
  - `GradientBlinds.jsx:6` `const MAX_COLORS = 8;`
  - `GradientBlinds.jsx:7` `const MAX_WAVES = 4;`
  - `GradientBlinds.jsx:8` `const INTRO_SECONDS = 1.8;`
  - `GradientBlinds.jsx:9` `const RIPPLE_SECONDS = 1.6;`
  - `GradientBlinds.jsx:77` `float w = 0.01 * uDistort;`
  - `GradientBlinds.jsx:120` `float edgeBlend = 1.0 - smoothstep(0.0, stripeAA, min(s, 1.0 - s));`
  - `GradientBlinds.jsx:129` `float tilt = 0.0;`
  - `GradientBlinds.jsx:130` `float pulse = 0.0;`
  - `GradientBlinds.jsx:148` `float ring = exp(-k * k) * exp(-along * along) * fade * smoothstep(0.0, 0.2, age);`
  - `GradientBlinds.jsx:153` `float settle = smoothstep(0.0, 1.0, clamp(uIntro * 1.5 - uv0.x * 0.5, 0.0, 1.0));`
  - `GradientBlinds.jsx:158` `float calm = 1.0 - 0.6 * clamp(spot, 0.0, 1.0);`
  - `GradientBlinds.jsx:161` `float crease = uRelief * 0.38 * smoothstep(0.62, 1.0, ramp);`
  - `GradientBlinds.jsx:176` `hue *= mix(1.0, 0.82, smoothstep(0.55, 0.9, dot(hue, luma)));`
  - `GradientBlinds.jsx:177` `vec3 tint = mix(base, hue, smoothstep(0.06, 0.28, chroma));`
  - `GradientBlinds.jsx:180` `float stroke = 1.0 - smoothstep(pixel, pixel * 2.2, edge);`
  - `GradientBlinds.jsx:181` `col = mix(vec3(1.0), tint, 0.72 * smoothstep(0.0, 1.0, coverage));`
  - `GradientBlinds.jsx:187` `vec3 haze = base * uGlow * 0.4 * smoothstep(0.0, 1.0, spot) * (0.4 + 0.6 * ramp);`
  - `GradientBlinds.jsx:192` `float grain = 0.5 * (hash(frag + uGrainTime) + hash(frag.yx + uGrainTime * 1.7)) - 0.5;`
  - `GradientBlinds.jsx:193` `col += grain * uNoise * (0.45 + 0.55 * smoothstep(0.0, 0.5, luma));`
  - `GradientBlinds.jsx:196` `float presence = smoothstep(0.0, 0.65, uIntro);`
  - `GradientBlinds.jsx:434` `const steps = Math.max(1, Math.ceil(dt / 0.008));`
  - `GradientBlinds.jsx:448` `view.ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);`
  - `GradientBlinds.jsx:464` `const dt = last ? clamp((now - last) / 1000, 0.001, 1 / 20) : 1 / 60;`
  - `GradientBlinds.jsx:470` `shift = (shift + dt * s.gradientSpeed * 0.06) % 2;`
  - `GradientBlinds.jsx:473` `if (introClock < 1) introClock = Math.min(1, introClock + dt / INTRO_SECONDS);`
  - `GradientBlinds.jsx:474` `hover += ((pointer.inside ? 1 : 0) - hover) * (1 - Math.exp(-dt / 0.35));`
- 指针/滚动: pointermove, pointerdown, pointerleave, visibilitychange.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; 读 devicePixelRatio; 离屏或隐藏时有暂停线索; ResizeObserver.
- 减弱动效: 有. `343` const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
- Props: `className=''` (259), `style` (260), `dpr` (261), `paused=false` (262), `gradientColors` (263), `angle=0` (264), `noise=0.3` (265), `blindCount=16` (266), `blindMinWidth=60` (267), `mouseDampening=0.15` (268), `mirrorGradient=false` (269), `spotlightRadius=0.5` (270), `spotlightSoftness=1` (271), `spotlightOpacity=1` (272), `distortAmount=0` (273), `shineDirection='left'` (274), `lightColor='#ffffff'` (275), `perspective=0` (276), `gradientSpeed=0` (277), `shine=0.4` (278), `relief=0.5` (279), `glow=0.4` (280), `sway=0.35` (281), `speed=1` (282)
- 裁决: 不做. 全屏场和控件状态机无关, 首页最多留一个主角效果, 不进默认包.


### Backgrounds/GradientWaves

- 文件: `Backgrounds/GradientWaves/GradientWaves.css` 14 行, `Backgrounds/GradientWaves/GradientWaves.jsx` 633 行. 目录内实现已逐行扫描.
- 看起来: 着色器场, uniform 有 uResolution, uTime, uClock, uAmplitude, uWaveScale, uWaveRatio, uSwell, uTurbulence. 命名常数 CANVAS, MAX_SWELLS, SWELL_SECONDS, SWELL_GAIN, SWELL_WIDTH, INTRO_SECONDS.
- 技法: WebGL + canvas2d + rAF.
- 常数:
  - `GradientWaves.jsx:9` `const MAX_SWELLS = 4;`
  - `GradientWaves.jsx:10` `const SWELL_SECONDS = 3.2;`
  - `GradientWaves.jsx:11` `const SWELL_GAIN = 2.8;`
  - `GradientWaves.jsx:12` `const SWELL_WIDTH = 8;`
  - `GradientWaves.jsx:13` `const INTRO_SECONDS = 2.6;`
  - `GradientWaves.jsx:14` `const CAMERA_HEIGHT = 30;`
  - `GradientWaves.jsx:15` `const QUALITY = { low: 56, medium: 84, high: 120 };`
  - `GradientWaves.jsx:57` `const float FAR = 4000.0;`
  - `GradientWaves.jsx:77` `float rise = 1.0;`
  - `GradientWaves.jsx:78` `if (uIntro.z > 0.0) rise = mix(1.0, smoothstep(uIntro.y * 0.45, uIntro.y * 1.6, xy.x), uIntro.z);`
  - `GradientWaves.jsx:97` `float dist = 0.0;`
  - `GradientWaves.jsx:138` `vec3 body = mix(uWave, uCrest, smoothstep(0.45, 1.0, crest) * 0.5);`
  - `GradientWaves.jsx:147` `float haze = 1.0 - exp(-dist / (uFogDepth * 5.0));`
  - `GradientWaves.jsx:148` `float fade = 1.0 - smoothstep(0.35, 1.0, haze);`
  - `GradientWaves.jsx:152` `col = mix(lit, uHorizon, smoothstep(0.0, 1.0, haze)) * 0.85 * uBrightness;`
  - `GradientWaves.jsx:158` `density *= 1.0 - 0.5 * smoothstep(0.0, 1.0, haze);`
  - `GradientWaves.jsx:423` `const ratio = Math.min(window.devicePixelRatio || 1, s.dpr);`
  - `GradientWaves.jsx:515` `const dt = state.last ? Math.min((now - state.last) / 1000, 0.1) : 0;`
  - `GradientWaves.jsx:524` `const ease = 1 - Math.exp(-dt / 0.45);`
  - `GradientWaves.jsx:527` `state.look[0] += (goalX - state.look[0]) * ease;`
  - `GradientWaves.jsx:528` `state.look[1] += (goalY - state.look[1]) * ease;`
  - `GradientWaves.jsx:531` `const steerEase = 1 - Math.exp(-dt / 0.6);`
- 指针/滚动: visibilitychange, pointermove, pointerdown, pointerleave.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; 读 devicePixelRatio; 离屏或隐藏时有暂停线索; ResizeObserver.
- 减弱动效: 有. `239` typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
- Props: `horizonColor='#5227FF'` (242), `waveColor='#FF9FFC'` (243), `crestColor='#FFFFFF'` (244), `backgroundColor='transparent'` (245), `lightMode=false` (246), `speed=0.4` (247), `amplitude=2.5` (248), `waveScale=0.6` (249), `waveRatio=0.9` (250), `swell=35` (251), `turbulence=20` (252), `tilt=64` (253), `zoom=1` (254), `height=5.5` (255), `fogDepth=15` (256), `relief=1` (257), `lightAngle=120` (258), `sheen=0` (259), `brightness=1` (260), `opacity=1` (261), `grain=0.2` (262), `quality='medium'` (263), `intro=true` (264), `mouseInteraction=true` (265)
- 裁决: 不做. 全屏场和控件状态机无关, 首页最多留一个主角效果, 不进默认包.


### Backgrounds/Grainient

- 文件: `Backgrounds/Grainient/Grainient.css` 14 行, `Backgrounds/Grainient/Grainient.jsx` 632 行. 目录内实现已逐行扫描.
- 看起来: 着色器场, uniform 有 uAspect, uTime, uRamp, uCount, uType, uDir, uExtent, uBands. 命名常数 MAX_COLORS, MAX_STIRS, MAX_TWIRLS, STIR_LIFE, STIR_STEP, TWIRL_LIFE.
- 技法: WebGL + canvas2d + rAF.
- 常数:
  - `Grainient.jsx:6` `const MAX_COLORS = 8;`
  - `Grainient.jsx:7` `const MAX_STIRS = 24;`
  - `Grainient.jsx:8` `const MAX_TWIRLS = 4;`
  - `Grainient.jsx:9` `const STIR_LIFE = 1.3;`
  - `Grainient.jsx:10` `const STIR_STEP = 0.06;`
  - `Grainient.jsx:11` `const TWIRL_LIFE = 2.6;`
  - `Grainient.jsx:12` `const INTRO_SECONDS = 1.6;`
  - `Grainient.jsx:14` `const TYPES = { linear: 0, radial: 1 };`
  - `Grainient.jsx:15` `const LIFT = 0.2;`
  - `Grainient.jsx:145` `float shaped = smoothstep(0.5 - edge, 0.5 + edge, f);`
  - `Grainient.jsx:163` `lab = mix(uRamp[0], lab, smoothstep(0.0, 1.0, uReveal * 1.5 - length(vUv - 0.5) * 0.6));`
  - `Grainient.jsx:439` `view.ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);`
  - `Grainient.jsx:459` `const follow = 1 - Math.exp(-dt / 0.06);`
  - `Grainient.jsx:481` `live.grow = Math.min(1, live.grow + dt / STIR_STEP);`
  - `Grainient.jsx:518` `const dt = last ? clamp((now - last) / 1000, 0.001, 0.05) : 1 / 60;`
  - `Grainient.jsx:520` `if (!reduce) time += dt * s.speed * 0.16;`
  - `Grainient.jsx:521` `if (introClock < 1) introClock = Math.min(1, introClock + dt / INTRO_SECONDS);`
- 指针/滚动: pointermove, pointerdown, pointerleave, visibilitychange.
- 可中断: GSAP 时间轴可 reverse 或 kill, 改 props 通常拆掉重建.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; 读 devicePixelRatio; 离屏或隐藏时有暂停线索; ResizeObserver.
- 减弱动效: 有. `356` const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
- Props: `colors=DEFAULT_COLORS` (256), `type='linear'` (257), `angle=55` (258), `bands=1` (259), `speed=1` (260), `flow=0.8` (261), `scale=1` (262), `softness=1` (263), `silk=0.35` (264), `grainAmount=0.08` (265), `grainSize=1.2` (266), `grainAnimated=true` (267), `contrast=1` (268), `saturation=1` (269), `variation=0` (270), `interactive=true` (271), `stir=1` (272), `clickSwirl=true` (273), `intro=true` (274), `lightMode=false` (275), `dpr` (276), `className=''` (277), `style` (278)
- 裁决: 不做. 全屏场和控件状态机无关, 首页最多留一个主角效果, 不进默认包.


### Backgrounds/GridDistortion

- 文件: `Backgrounds/GridDistortion/GridDistortion.css` 16 行, `Backgrounds/GridDistortion/GridDistortion.jsx` 463 行. 目录内实现已逐行扫描.
- 看起来: 着色器场, uniform 有 uImage, uField, uGrid, uCover, uSoftness, uChroma, uReveal. 命名常数 VERTEX, FRAGMENT, MODES, GAIN, RIPPLE_LIFE.
- 技法: WebGL + rAF.
- 常数:
  - `GridDistortion.jsx:59` `const GAIN = 18;`
  - `GridDistortion.jsx:60` `const RIPPLE_LIFE = 1.6;`
  - `GridDistortion.jsx:253` `const decay = Math.pow(s.relaxation, dt * 60);`
  - `GridDistortion.jsx:274` `state.phantom = clamp(state.phantom + (resting ? dt : -dt * 3), 0, 1);`
  - `GridDistortion.jsx:335` `const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;`
  - `GridDistortion.jsx:339` `if (state.loaded) state.reveal = reduce ? 1 : Math.min(1, state.reveal + dt / 0.6);`
  - `GridDistortion.jsx:402` `const dpr = Math.min(window.devicePixelRatio || 1, 2);`
- 指针/滚动: pointermove, pointerdown.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; 读 devicePixelRatio; ResizeObserver.
- 减弱动效: 有. `161` const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
- Props: `imageSrc` (82), `grid=15` (83), `radius=0.18` (84), `strength=0.15` (85), `relaxation=0.96` (86), `mode='drag'` (87), `softness=0` (88), `chroma=0` (89), `idle=0.3` (90), `clickRipple=true` (91), `intro=true` (92), `className=''` (93), `style` (94)
- 裁决: 不做. 全屏场和控件状态机无关, 首页最多留一个主角效果, 不进默认包.


### Backgrounds/GridMotion

- 文件: `Backgrounds/GridMotion/GridMotion.css` 66 行, `Backgrounds/GridMotion/GridMotion.jsx` 339 行. 目录内实现已逐行扫描.
- 看起来: 命名常数 THEMES, DIRECTIONS, IMAGE, INERTIA, PACE, EMPTY.
- 技法: DOM + rAF.
- 常数:
  - `GridMotion.jsx:27` `const smoothstep = (edge0, edge1, value) => {`
  - `GridMotion.jsx:196` `const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));`
  - `GridMotion.jsx:200` `motion.intro = Math.min(1, motion.intro + dt / 0.9);`
  - `GridMotion.jsx:224` `const settle = 1 - Math.exp(-dt / 0.22);`
  - `GridMotion.jsx:234` `motion.shifts[r] += (target - motion.shifts[r]) * (1 - Math.exp(-dt / INERTIA[r % INERTIA.length]));`
  - `GridMotion.jsx:247` `wanted = 1 - smoothstep(0.25, 1, distance);`
- 指针/滚动: pointermove, pointerdown, pointerup, blur, pointerleave.
- 可中断: 有 pointerup, 无 pointercancel.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; ResizeObserver.
- 减弱动效: 有. `180` const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
- Props: `items=[]` (68), `rows=4` (69), `aspectRatio=1.33` (70), `gap=16` (71), `radius=14` (72), `angle=-12` (73), `tilt=0` (74), `speed=24` (75), `direction='alternate'` (76), `parallax=0.5` (77), `spotlight=0.6` (78), `dim=0.35` (79), `grayscale=false` (80), `fade=0.5` (81), `tileColor` (82), `textColor` (83), `theme='dark'` (84), `className=''` (85), `style` (86)
- 裁决: 不做. 全屏场和控件状态机无关, 首页最多留一个主角效果, 不进默认包.


### Backgrounds/GridScan

- 文件: `Backgrounds/GridScan/GridScan.css` 61 行, `Backgrounds/GridScan/GridScan.jsx` 1034 行. 目录内实现已逐行扫描.
- 看起来: 着色器场, uniform 有 uAspect, uPixel, uEye, uDepth, uCell, uThick, uDot, uStyle. 命名常数 MAX_PINGS, PING_LIFE, INTRO_SECONDS, EYE_DISTANCE, FACE_API_URL, MODELS_URL.
- 技法: WebGL + canvas2d + rAF.
- 常数:
  - `GridScan.jsx:6` `const MAX_PINGS = 4;`
  - `GridScan.jsx:7` `const PING_LIFE = 2.4;`
  - `GridScan.jsx:8` `const INTRO_SECONDS = 2.2;`
  - `GridScan.jsx:9` `const EYE_DISTANCE = 1.25;`
  - `GridScan.jsx:10` `const FACE_API_URL = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';`
  - `GridScan.jsx:11` `const MODELS_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights';`
  - `GridScan.jsx:12` `const STYLES = { solid: 0, dashed: 1, dotted: 2 };`
  - `GridScan.jsx:83` `float dense = smoothstep(0.1, 0.4, du);`
  - `GridScan.jsx:90` `return mix(cov, mean, max(dense, smoothstep(0.1, 0.4, dc)));`
  - `GridScan.jsx:99` `cov *= mix(m, 0.5, smoothstep(0.1, 0.4, dc));`
  - `GridScan.jsx:155` `l.reveal = smoothstep(uReveal, uReveal - 0.2, z);`
  - `GridScan.jsx:161` `l.trail = exp(-max(behind, 0.0) / uTrail) * smoothstep(-width, width * 0.5, behind) * uScanAlpha;`
  - `GridScan.jsx:170` `l.wake += exp(min(dist, 0.0) / 0.22) * smoothstep(0.03, -0.03, dist) * alpha;`
  - `GridScan.jsx:209` `float energy = 0.0;`
  - `GridScan.jsx:217` `float lamp = 1.0 / (1.0 + h.z * h.z * 0.9);`
  - `GridScan.jsx:243` `float grazing = 1.0 - normalize(r).y;`
  - `GridScan.jsx:245` `float reflected = 0.0;`
  - `GridScan.jsx:267` `float flicker = 0.75 + 0.25 * sin(uTime * (3.0 + r * 5.0) + r * 40.0);`
  - `GridScan.jsx:268` `float dots = spot * smoothstep(5.0, 10.0, gap) * smoothstep(0.25, 0.6, r) * (0.3 + 0.7 * r * r) * flicker;`
  - `GridScan.jsx:477` `duration: clamp(scanDuration, 0.3, 20),`
  - `GridScan.jsx:478` `delay: clamp(scanDelay, 0, 30),`
  - `GridScan.jsx:618` `const steps = Math.max(1, Math.ceil(dt / (1 / 120)));`
  - `GridScan.jsx:649` `view.ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);`
  - `GridScan.jsx:753` `const dt = last ? clamp((now - last) / 1000, 0.001, 0.05) : 1 / 60;`
  - `GridScan.jsx:756` `if (introClock < 1) introClock = Math.min(1, introClock + dt / INTRO_SECONDS);`
  - `GridScan.jsx:766` `const follow = 1 - Math.exp(-dt / 0.08);`
  - `GridScan.jsx:771` `hover.strength += (aim - hover.strength) * (1 - Math.exp(-dt / 0.25));`
- 指针/滚动: pointermove, pointerdown, deviceorientation, click, pointerleave, visibilitychange.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; 读 devicePixelRatio; 离屏或隐藏时有暂停线索; ResizeObserver.
- 减弱动效: 有. `538` const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
- Props: `linesColor` (427), `scanColor` (428), `cells=8` (429), `lineThickness=1` (430), `lineStyle='solid'` (431), `depth=3` (432), `depthFade=0.6` (433), `parallax=1` (434), `points=true` (435), `reflection=0.35` (436), `shading=0.7` (437), `scanDirection='forward'` (438), `scanDuration=2.4` (439), `scanDelay=1.6` (440), `scanWidth=1` (441), `trail=0.5` (442), `glow=0.6` (443), `autoScan=true` (444), `interactive=true` (445), `clickEffect='ping'` (446), `enableWebcam=false` (447), `showPreview=false` (448), `modelsPath=MODELS_URL` (449), `enableGyro=false` (450)
- 裁决: 不做. 全屏场和控件状态机无关, 首页最多留一个主角效果, 不进默认包.


### Backgrounds/Hyperspeed

- 文件: `Backgrounds/Hyperspeed/Hyperspeed.css` 15 行, `Backgrounds/Hyperspeed/Hyperspeed.jsx` 1040 行. 目录内实现已逐行扫描.
- 看起来: 着色器场, uniform 有 uTime, uCurvature, uCurveA, uCurveB, uFogNear, uFogFar, uPixel, uTravel. 命名常数 TRAVEL, MAX_CARS, MAX_POLES, MAX_DUST, MAX_COLORS, CURVES.
- 技法: WebGL + canvas2d + three + rAF.
- 常数:
  - `Hyperspeed.jsx:8` `const TRAVEL = 400;`
  - `Hyperspeed.jsx:9` `const MAX_CARS = 160;`
  - `Hyperspeed.jsx:10` `const MAX_POLES = 80;`
  - `Hyperspeed.jsx:11` `const MAX_DUST = 1500;`
  - `Hyperspeed.jsx:12` `const MAX_COLORS = 8;`
  - `Hyperspeed.jsx:44` `#define PI 3.14159265358979`
  - `Hyperspeed.jsx:134` `vFog = smoothstep(uFogNear, uFogFar, -mv.z);`
  - `Hyperspeed.jsx:153` `float alpha = pow(facing, uSharp) * smoothstep(uFade.x, uFade.y, vUv.x) * uIntensity * vThin * (1.0 - vFog);`
  - `Hyperspeed.jsx:203` `vFog = smoothstep(uFogNear, uFogFar, -mv.z);`
  - `Hyperspeed.jsx:221` `float ends = smoothstep(0.0, 0.08, vHeight) * smoothstep(1.0, 0.9, vHeight);`
  - `Hyperspeed.jsx:247` `vAlpha = aEnd * (1.0 - smoothstep(uFogNear, uFogFar, -mv.z));`
  - `Hyperspeed.jsx:273` `vFog = smoothstep(uFogNear, uFogFar, -mv.z);`
  - `Hyperspeed.jsx:291` `return 1.0 - smoothstep(w - aa, w + aa, d);`
  - `Hyperspeed.jsx:518` `renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));`
  - `Hyperspeed.jsx:869` `const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));`
  - `Hyperspeed.jsx:874` `state.boost += (wanted - state.boost) * (1 - Math.exp(-dt / (wanted > state.boost ? 0.28 : 0.85)));`
  - `Hyperspeed.jsx:881` `const blend = 1 - Math.exp(-dt / 0.6);`
  - `Hyperspeed.jsx:920` `state.fovVelocity += ((fovTarget - state.fov) * 90 - state.fovVelocity * 13) * dt;`
  - `Hyperspeed.jsx:925` `const steerBlend = 1 - Math.exp(-dt / 0.35);`
- 指针/滚动: pointerdown, pointermove, pointerleave, contextmenu, pointerup, pointercancel, blur.
- 可中断: pointercancel 有监听.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; 读 devicePixelRatio; ResizeObserver.
- 减弱动效: 有. `514` const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
- Props: `curve='winding'` (439), `curvature=1` (440), `speed=1` (441), `boost=3` (442), `fov=90` (443), `boostFov=130` (444), `lanes=3` (445), `roadWidth=10` (446), `medianWidth=2` (447), `density=40` (448), `trailLength=1` (449), `lightSize=1` (450), `poles=20` (451), `poleHeight=1` (452), `dust=100` (453), `glow=0.6` (454), `reflections=0.5` (455), `steer=0.35` (456), `tailColors` (457), `headColors` (458), `poleColors` (459), `roadColor` (460), `roadOpacity=0.1` (461), `lineColor` (462)
- 裁决: 不做. 全屏场和控件状态机无关, 首页最多留一个主角效果, 不进默认包.


### Backgrounds/Iridescence

- 文件: `Backgrounds/Iridescence/Iridescence.css` 14 行, `Backgrounds/Iridescence/Iridescence.jsx` 524 行. 目录内实现已逐行扫描.
- 看起来: 着色器场, uniform 有 uResolution, uTime, uColor, uMouse, uAmplitude, uScale, uRotation, uDetail. 命名常数 VERTEX, FRAGMENT, FIELD_COLUMNS, MAX_SWIRLS, SWIRL_LIFE.
- 技法: WebGL + canvas2d + rAF.
- 常数:
  - `Iridescence.jsx:81` `float a = 0.0;`
  - `Iridescence.jsx:113` `const FIELD_COLUMNS = 48;`
  - `Iridescence.jsx:114` `const MAX_SWIRLS = 6;`
  - `Iridescence.jsx:115` `const SWIRL_LIFE = 3.2;`
  - `Iridescence.jsx:329` `const decay = Math.exp(-dt * 1.4);`
  - `Iridescence.jsx:363` `const ease = Math.exp(-swirl.age * 1.35) - Math.exp(-swirl.age * 10);`
  - `Iridescence.jsx:365` `swirlData.set([swirl.x, swirl.y, radius, 3 * ease * fade * (0.21 / radius) ** 2], k * 4);`
  - `Iridescence.jsx:397` `const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;`
  - `Iridescence.jsx:402` `const follow = 1 - Math.exp(-dt * 5);`
  - `Iridescence.jsx:405` `state.presence += ((pointer.inside ? 1 : 0) - state.presence) * (1 - Math.exp(-dt * 4));`
  - `Iridescence.jsx:465` `const dpr = Math.min(window.devicePixelRatio || 1, 2) * s.resolution;`
  - `Iridescence.jsx:475` `const dpr = Math.min(window.devicePixelRatio || 1, 2) * settingsRef.current.resolution;`
- 指针/滚动: pointermove, pointerdown, pointerleave.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; 读 devicePixelRatio; ResizeObserver.
- 减弱动效: 有. `247` const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
- Props: `color=[1` (130), `speed=1` (131), `amplitude=0.1` (132), `mouseReact=true` (133), `scale=1` (134), `detail=8` (135), `rotation=0` (136), `warp=1` (137), `hueShift=0` (138), `saturation=1` (139), `brightness=1.5` (140), `contrast=1` (141), `stir=0.5` (142), `sheen=0.3` (143), `clickSwirl=true` (144), `grain=0` (145), `fade=0` (146), `opacity=1` (147), `resolution=1` (148), `paused=false` (149), `className=''` (150), `style` (151)
- 裁决: 不做. 全屏场和控件状态机无关, 首页最多留一个主角效果, 不进默认包.


### Backgrounds/LetterGlitch

- 文件: `Backgrounds/LetterGlitch/LetterGlitch.css` 14 行, `Backgrounds/LetterGlitch/LetterGlitch.jsx` 931 行. 目录内实现已逐行扫描.
- 看起来: 着色器场, uniform 有 uAtlas, uState, uCell, uGrid, uAtlasColumns, uResolution, uOrigin, uBase. 命名常数 DEFAULT_CHARACTERS, DEFAULT_FONT, DARK_COLORS, LIGHT_COLORS, MAX_COLORS, INTRO_SECONDS.
- 技法: WebGL + canvas2d + rAF.
- 常数:
  - `LetterGlitch.jsx:6` `const DEFAULT_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789';`
  - `LetterGlitch.jsx:10` `const MAX_COLORS = 8;`
  - `LetterGlitch.jsx:11` `const INTRO_SECONDS = 1.4;`
  - `LetterGlitch.jsx:12` `const REST_RATE = 0.2;`
  - `LetterGlitch.jsx:13` `const GLITCH_RATE = 0.1;`
  - `LetterGlitch.jsx:14` `const MAX_WALKERS = 48;`
  - `LetterGlitch.jsx:81` `float mask = 1.0;`
  - `LetterGlitch.jsx:95` `float n = 0.65 * noise(p + vec2(uTime * 0.05, uTime * 0.03)) + 0.35 * noise(p * 2.03 - vec2(uTime * 0.04, -uTime * 0.06));`
  - `LetterGlitch.jsx:96` `rest *= mix(1.0, 0.1 + 1.7 * smoothstep(0.25, 0.8, n), uFlow);`
  - `LetterGlitch.jsx:278` `let delay = new Float32Array(0);`
  - `LetterGlitch.jsx:442` `delay = new Float32Array(n);`
  - `LetterGlitch.jsx:604` `glitchCarry += count * s.glitchAmount ** 1.6 * GLITCH_RATE * s.speed * dt;`
  - `LetterGlitch.jsx:638` `const chance = pointer.presence * (3 + 9 * pointer.stir) * dt;`
  - `LetterGlitch.jsx:653` `cursorCarry += cells * pointer.presence * (0.15 + 4 * pointer.stir) * dt;`
  - `LetterGlitch.jsx:679` `const attack = 1 - Math.exp(-dt / 0.05);`
  - `LetterGlitch.jsx:682` `if (delay[i] > 0) {`
  - `LetterGlitch.jsx:692` `h = s.smooth ? h * Math.exp((-dt * 4) / Math.max(fade[i], 0.05)) : 0;`
  - `LetterGlitch.jsx:723` `if (age < dt && Math.random() < (luck[i] < s.density ? 0.45 : 0.12)) {`
  - `LetterGlitch.jsx:739` `const dt = last ? clamp((now - last) / 1000, 0.0005, 0.05) : 1 / 60;`
  - `LetterGlitch.jsx:751` `pointer.presence += (goal - pointer.presence) * (1 - Math.exp(-dt / 0.25));`
  - `LetterGlitch.jsx:755` `const follow = 1 - Math.exp(-dt / 0.07);`
  - `LetterGlitch.jsx:759` `pointer.stir += (clamp(moved / 1400, 0, 1) - pointer.stir) * (1 - Math.exp(-dt / 0.12));`
  - `LetterGlitch.jsx:825` `view.ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);`
- 指针/滚动: pointermove, pointerdown, pointerup, pointercancel, pointerleave, visibilitychange.
- 可中断: pointercancel 有监听.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; 读 devicePixelRatio; 离屏或隐藏时有暂停线索; ResizeObserver.
- 减弱动效: 有. `260` const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
- Props: `glitchColors` (155), `baseColor` (156), `characters=DEFAULT_CHARACTERS` (157), `fontFamily=DEFAULT_FONT` (158), `fontSize=14` (159), `spacing=0.6` (160), `density=0.9` (161), `baseOpacity=0.16` (162), `glitchAmount=0.5` (163), `speed=1` (164), `smooth=true` (165), `interactive=true` (166), `cursorRadius=140` (167), `clickEffect='tear'` (168), `flow=0.5` (169), `edgeFade=0` (170), `centerFade=0` (171), `intro=true` (172), `lightMode=false` (173), `backgroundColor` (174), `dpr` (175), `className=''` (176), `style` (177)
- 裁决: 不做. 全屏场和控件状态机无关, 首页最多留一个主角效果, 不进默认包.


### Backgrounds/LightPillar

- 文件: `Backgrounds/LightPillar/LightPillar.css` 16 行, `Backgrounds/LightPillar/LightPillar.jsx` 613 行. 目录内实现已逐行扫描.
- 看起来: 着色器场, uniform 有 uTime, uResolution, uTarget, uRot, uPillarRot, uWave, uShift, uPillarWidth. 命名常数 VERTEX, MARCH, COMPOSITE, QUALITY, INTRO_SECONDS, PULSE_LIFE.
- 技法: WebGL + canvas2d + rAF.
- 常数:
  - `LightPillar.jsx:42` `float glow = 0.0;`
  - `LightPillar.jsx:43` `float lift = 0.0;`
  - `LightPillar.jsx:44` `float t = 0.1;`
  - `LightPillar.jsx:50` `float freq = 1.0;`
  - `LightPillar.jsx:51` `float amp = 1.0;`
  - `LightPillar.jsx:66` `float weight = 1.0 / d;`
  - `LightPillar.jsx:76` `outColor = vec4(col, smoothstep(0.62, 1.0, peak));`
  - `LightPillar.jsx:152` `float boost = 0.0;`
  - `LightPillar.jsx:167` `float mask = smoothstep(uReveal, uReveal - 0.9, axis);`
  - `LightPillar.jsx:177` `float coverage = smoothstep(0.025, 0.95, energy);`
  - `LightPillar.jsx:188` `const QUALITY = { low: 0.35, medium: 0.5, high: 0.6 };`
  - `LightPillar.jsx:189` `const INTRO_SECONDS = 2.1;`
  - `LightPillar.jsx:190` `const PULSE_LIFE = 1.4;`
  - `LightPillar.jsx:191` `const MIN_SCALE = 0.25;`
  - `LightPillar.jsx:195` `const ease = t => t * t * t * (t * (t * 6 - 15) + 10);`
  - `LightPillar.jsx:451` `if (dt > 1 / 40) {`
  - `LightPillar.jsx:454` `} else if (dt < 1 / 55) {`
  - `LightPillar.jsx:471` `const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;`
  - `LightPillar.jsx:475` `if (running) state.clock += dt * 0.96 * s.rotationSpeed;`
  - `LightPillar.jsx:477` `else if (state.intro < 1) state.intro = Math.min(1, state.intro + dt / INTRO_SECONDS);`
  - `LightPillar.jsx:481` `const follow = 1 - Math.exp(-dt * 2.4);`
  - `LightPillar.jsx:485` `state.touch += ((engaged ? 1 : 0) - state.touch) * (1 - Math.exp(-dt * 3));`
  - `LightPillar.jsx:510` `const ratio = Math.min(window.devicePixelRatio || 1, 2);`
- 指针/滚动: webglcontextlost, webglcontextrestored, pointermove, pointerdown, pointerleave, visibilitychange.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; 读 devicePixelRatio; 离屏或隐藏时有暂停线索; ResizeObserver.
- 减弱动效: 有. `355` const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
- Props: `topColor='#5227FF'` (232), `bottomColor='#FF9FFC'` (233), `intensity=1.0` (234), `rotationSpeed=0.3` (235), `flow=1` (236), `interactive=true` (237), `clickPulse=true` (238), `glowAmount=0.002` (239), `bloom=0.5` (240), `pillarWidth=3.0` (241), `pillarHeight=0.4` (242), `pillarRotation=25` (243), `twist=0.4` (244), `detail=4` (245), `noiseIntensity=0.5` (246), `fade=0` (247), `intro=true` (248), `mixBlendMode='screen'` (249), `quality='high'` (250), `resolution` (251), `lightMode=false` (252), `paused=false` (253), `className=''` (254), `style` (255)
- 裁决: 不做. 全屏场和控件状态机无关, 首页最多留一个主角效果, 不进默认包.


### Backgrounds/LightRays

- 文件: `Backgrounds/LightRays/LightRays.css` 15 行, `Backgrounds/LightRays/LightRays.jsx` 556 行. 目录内实现已逐行扫描.
- 看起来: 着色器场, uniform 有 uResolution, uScale, uTime, uSource, uAim, uReach, uColor, uSpread. 命名常数 PIXEL_BUDGET, MAX_PULSES, ORIGINS, VERTEX, FRAGMENT.
- 技法: WebGL + rAF.
- 常数:
  - `LightRays.jsx:6` `const PIXEL_BUDGET = 2.4e6;`
  - `LightRays.jsx:7` `const MAX_PULSES = 4;`
  - `LightRays.jsx:70` `return mix(strength, smoothstep(0.62 - edge, 0.62 + edge, strength), uSharpness);`
  - `LightRays.jsx:84` `float glowLight = uGlow * source * smoothstep(-0.2, 0.6, cosAngle);`
  - `LightRays.jsx:89` `float reveal = uIntensity * uIntro.y * (1.0 - smoothstep(uIntro.x - 0.35, uIntro.x, depth));`
  - `LightRays.jsx:110` `float fog = 0.65 * valueNoise(drift * vec2(3.0, 1.0)) + 0.35 * valueNoise(drift * vec2(7.0, 2.3) + 4.1);`
  - `LightRays.jsx:121` `float behind = smoothstep(0.97, 1.25, along) * exp(-trail * 1.1);`
  - `LightRays.jsx:122` `float shade = (1.0 - smoothstep(width * 0.3, width * 1.6, side)) * behind;`
  - `LightRays.jsx:126` `float boost = 0.0;`
  - `LightRays.jsx:151` `vec3 ink = tone * (mix(0.66, 0.94, warm) - 0.1 * smoothstep(0.4, 1.2, energy));`
  - `LightRays.jsx:158` `hue = mix(hue, vec3(top), smoothstep(0.8, 1.0, level) * 0.45);`
  - `LightRays.jsx:331` `window.devicePixelRatio || 1,`
  - `LightRays.jsx:351` `const dt = clamp((now - last) / 1000 || 0, 0, 0.05);`
  - `LightRays.jsx:353` `time += dt * s.speed * (reduced ? 0.35 : 1);`
  - `LightRays.jsx:354` `if (opening < 1) opening = Math.min(1, opening + dt / 1.8);`
  - `LightRays.jsx:356` `const steer = 1 - Math.exp(-dt / 0.2);`
  - `LightRays.jsx:361` `const glide = 1 - Math.exp(-dt / 0.08);`
  - `LightRays.jsx:365` `shade.presence += ((shading ? 1 : 0) - shade.presence) * (1 - Math.exp(-dt / (shading ? 0.25 : 0.5)));`
- 指针/滚动: pointermove, pointerdown, pointerup, pointercancel, pointerleave, webglcontextlost, webglcontextrestored, visibilitychange.
- 可中断: pointercancel 有监听.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; 读 devicePixelRatio; 离屏或隐藏时有暂停线索; ResizeObserver.
- 减弱动效: 有. `307` const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
- Props: `raysOrigin='top-center'` (224), `raysColor='#ffffff'` (225), `raysSpeed=1` (226), `lightSpread=0.5` (227), `rayLength=3` (228), `rayDensity=1` (229), `tilt=0` (230), `raySharpness=0.35` (231), `glow=0.6` (232), `haze=0.25` (233), `atmosphere=1` (234), `intensity=1` (235), `pulsating=false` (236), `fadeDistance=1` (237), `saturation=1` (238), `followMouse=true` (239), `mouseInfluence=0.1` (240), `cursorShadow=true` (241), `clickPulse=true` (242), `noiseAmount=0` (243), `distortion=0` (244), `intro=true` (245), `lightMode=false` (246), `opacity=1` (247)
- 裁决: 不做. 全屏场和控件状态机无关, 首页最多留一个主角效果, 不进默认包.


### Backgrounds/LightTunnel

- 文件: `Backgrounds/LightTunnel/LightTunnel.css` 14 行, `Backgrounds/LightTunnel/LightTunnel.jsx` 531 行. 目录内实现已逐行扫描.
- 看起来: 着色器场, uniform 有 uResolution, uCenter, uScale, uRatio, uTime, uDrift, uSteer, uBend. 命名常数 INTRO_SECONDS, VERTEX, FRAGMENT.
- 技法: WebGL + canvas2d + rAF.
- 常数:
  - `LightTunnel.jsx:6` `const INTRO_SECONDS = 1.8;`
  - `LightTunnel.jsx:53` `const float TAU = 6.2831853;`
  - `LightTunnel.jsx:67` `float reach = 1.0 - exp(-max(depth, 0.0) * 0.55);`
  - `LightTunnel.jsx:86` `float near = smoothstep(0.55, 1.25, r);`
  - `LightTunnel.jsx:92` `float lines = 0.0;`
  - `LightTunnel.jsx:93` `float body = 0.0;`
  - `LightTunnel.jsx:95` `float strokes = 0.0;`
  - `LightTunnel.jsx:106` `float shade = 1.0 + uVariance * (h3 - 0.5) * 0.9;`
  - `LightTunnel.jsx:107` `float reach = smoothstep(spacing * 2.4, spacing * 1.4, d);`
  - `LightTunnel.jsx:109` `lines += smoothstep(width + soft, width - soft, d) * shade;`
  - `LightTunnel.jsx:115` `float limit = 0.5 / uSpacing;`
  - `LightTunnel.jsx:116` `float head = exp(-pow(max(-lead, 0.0) / uHead, 2.0)) * smoothstep(-limit, -limit * 0.8, lead);`
  - `LightTunnel.jsx:117` `float tail = exp(-max(lead, 0.0) / uTail) * smoothstep(limit, limit * 0.55, lead);`
  - `LightTunnel.jsx:124` `float stroke = smoothstep(core + soft, core - soft, d);`
  - `LightTunnel.jsx:131` `float lod = smoothstep(4.0, 1.2, spacing);`
  - `LightTunnel.jsx:139` `float fade = smoothstep(0.0, uFadeNear, rr) * smoothstep(uFadeFar, uFadeFar * 0.55, rr);`
  - `LightTunnel.jsx:140` `fade *= smoothstep(uReveal - 0.6, uReveal, depth);`
  - `LightTunnel.jsx:142` `float grain = 1.0;`
  - `LightTunnel.jsx:394` `const dt = last ? clamp((now - last) / 1000, 0.0005, 0.05) : 1 / 60;`
  - `LightTunnel.jsx:398` `drift += dt * (s.speed + 0.2) * motion;`
  - `LightTunnel.jsx:400` `if (s.intro && !reduce && reveal < 1) reveal = Math.min(1, reveal + dt / INTRO_SECONDS);`
  - `LightTunnel.jsx:406` `const follow = 1 - Math.exp(-dt / 0.6);`
  - `LightTunnel.jsx:425` `const ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);`
- 指针/滚动: pointermove, pointerdown, pointerup, pointercancel, pointerleave, visibilitychange.
- 可中断: pointercancel 有监听.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; 读 devicePixelRatio; 离屏或隐藏时有暂停线索; ResizeObserver.
- 减弱动效: 有. `325` const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
- Props: `cableColor='#ffffff'` (200), `pulseColor='#ffffff'` (201), `tunnelColor='#ffffff'` (202), `tunnelOpacity=0` (203), `speed=0.1` (204), `flowDirection='inward'` (205), `pulseSpeed=2` (206), `pulseLength=0.28` (207), `pulseBlend=0.6` (208), `pulseWidth=1` (209), `pulseDensity=0.5` (210), `cableCount=56` (211), `thickness=0.35` (212), `rimWidth=0.15` (213), `waviness=0.3` (214), `sway=0.5` (215), `bend=0.4` (216), `size=1` (217), `centerX=0` (218), `centerY=0` (219), `glow=1` (220), `fadeNear=0.5` (221), `fadeFar=2` (222), `brightness=1` (223)
- 裁决: 不做. 全屏场和控件状态机无关, 首页最多留一个主角效果, 不进默认包.


### Backgrounds/Lightfall

- 文件: `Backgrounds/Lightfall/Lightfall.css` 14 行, `Backgrounds/Lightfall/Lightfall.jsx` 749 行. 目录内实现已逐行扫描.
- 看起来: 着色器场, uniform 有 uView, uZoom, uPhase, uTwinkleClock, uRings, uColors, uColorCount, uStreakCount. 命名常数 MAX_COLORS, BLOOM_LEVELS, VERTEX, STREAKS, DOWNSAMPLE, BLUR.
- 技法: WebGL + canvas2d + rAF.
- 常数:
  - `Lightfall.jsx:7` `const MAX_COLORS = 8;`
  - `Lightfall.jsx:8` `const BLOOM_LEVELS = 4;`
  - `Lightfall.jsx:39` `const float TAU = 6.28318530718;`
  - `Lightfall.jsx:40` `const float SPACING = 0.005;`
  - `Lightfall.jsx:41` `const float REACH = 0.32;`
  - `Lightfall.jsx:63` `float e = 0.6 * r / s;`
  - `Lightfall.jsx:108` `float detail = smoothstep(1.6, 3.2, spacing);`
  - `Lightfall.jsx:115` `float headReach = 4.0 * max(0.6 * headRadius, 0.7);`
  - `Lightfall.jsx:120` `float boost = 1.0;`
  - `Lightfall.jsx:145` `float fall = exp(-uTail * behind) * (1.0 - smoothstep(0.5, 0.95, behind / (0.5 * period)));`
  - `Lightfall.jsx:146` `fall *= 1.0 - smoothstep(1.2, 3.2, uTail * behind);`
  - `Lightfall.jsx:151` `weight *= 1.0 - smoothstep(0.72 * edge, edge, abs(across) / spacing);`
  - `Lightfall.jsx:233` `float spread = 0.34 * max(aspect, 0.75);`
  - `Lightfall.jsx:252` `float coverage = clamp(smoothstep(0.0, 0.5, peak) * mask * 0.94 + grain, 0.0, 1.0);`
  - `Lightfall.jsx:256` `float saturation = 1.0 - min(chroma.r, min(chroma.g, chroma.b));`
  - `Lightfall.jsx:257` `chroma = mix(vec3(0.3), chroma, smoothstep(0.08, 0.35, saturation));`
  - `Lightfall.jsx:265` `const INTRO_SECONDS = 2.6;`
  - `Lightfall.jsx:266` `const WARP_SPEED = 9;`
  - `Lightfall.jsx:588` `const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;`
  - `Lightfall.jsx:591` `else if (state.intro < 1) state.intro = Math.min(1, state.intro + dt / INTRO_SECONDS);`
  - `Lightfall.jsx:594` `state.warp += ((holding ? 1 : 0) - state.warp) * (1 - Math.exp(-dt * (holding ? 2.2 : 1.6)));`
  - `Lightfall.jsx:597` `if (running) state.travel += dt * 0.1 * s.speed * (1 + rush);`
  - `Lightfall.jsx:609` `const follow = s.mouseDampening > 0 ? 1 - Math.exp(-dt / s.mouseDampening) : 1;`
  - `Lightfall.jsx:612` `const lensFollow = 1 - Math.exp(-dt * 6);`
  - `Lightfall.jsx:615` `state.touch += ((engaged ? 1 : 0) - state.touch) * (1 - Math.exp(-dt * (engaged ? 4 : 2)));`
  - `Lightfall.jsx:620` `if ((running && s.speed !== 0) || settling) raf = requestAnimationFrame(frame);`
  - `Lightfall.jsx:632` `const ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);`
- 指针/滚动: webglcontextlost, webglcontextrestored, pointermove, pointerdown, pointerup, pointercancel, pointerleave, visibilitychange.
- 可中断: pointercancel 有监听.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; 读 devicePixelRatio; 离屏或隐藏时有暂停线索; ResizeObserver.
- 减弱动效: 有. `457` const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
- Props: `colors=['#ffffff']` (306), `backgroundColor='#94a3b8'` (307), `speed=0.3` (308), `streakCount=2` (309), `streakWidth=0.8` (310), `streakLength=1` (311), `glow=1` (312), `density=0.6` (313), `twinkle=0.3` (314), `zoom=3` (315), `backgroundGlow=0.1` (316), `headGlow=0.6` (317), `depth=0.5` (318), `bloom=0.35` (319), `opacity=1` (320), `mouseInteraction=true` (321), `mouseStrength=0.4` (322), `mouseRadius=0.45` (323), `mouseDampening=0.15` (324), `lens=0.5` (325), `holdToWarp=true` (326), `intro=true` (327), `fade=0` (328), `lightMode=false` (329)
- 裁决: 不做. 全屏场和控件状态机无关, 首页最多留一个主角效果, 不进默认包.


### Backgrounds/Lightning

- 文件: `Backgrounds/Lightning/Lightning.css` 6 行, `Backgrounds/Lightning/Lightning.jsx` 644 行. 目录内实现已逐行扫描.
- 看起来: 着色器场, uniform 有 uResolution, uPhase, uColor, uIntensity, uSize, uThickness, uGlow, uFlicker. 命名常数 MAX_BOLTS, MAX_STRIKES, LEADER, LIFE, VERTEX, FRAGMENT.
- 技法: WebGL + rAF.
- 常数:
  - `Lightning.jsx:7` `const MAX_BOLTS = 4;`
  - `Lightning.jsx:8` `const MAX_STRIKES = 4;`
  - `Lightning.jsx:9` `const LEADER = 0.11;`
  - `Lightning.jsx:10` `const LIFE = 1.3;`
  - `Lightning.jsx:46` `const float TAU = 6.28318530718;`
  - `Lightning.jsx:47` `const float PERIOD = 8.0;`
  - `Lightning.jsx:48` `const float WARP = 2.1;`
  - `Lightning.jsx:75` `float value = 0.0;`
  - `Lightning.jsx:76` `float amplitude = 0.5;`
  - `Lightning.jsx:89` `float value = 0.0;`
  - `Lightning.jsx:90` `float amplitude = 0.5;`
  - `Lightning.jsx:94` `float weight = 1.0;`
  - `Lightning.jsx:97` `weight = 1.0 - smoothstep(reach * 0.6, reach, estimate);`
  - `Lightning.jsx:110` `float steady = 0.82 + 0.18 * sin(TAU * (uPhase * 13.0 + seed)) * sin(TAU * (uPhase * 7.0 + seed * 1.7));`
  - `Lightning.jsx:111` `float burst = 0.0;`
  - `Lightning.jsx:151` `float core = (1.0 - smoothstep(gCore - gPixel, gCore + gPixel, d)) * min(strength, 1.6);`
  - `Lightning.jsx:170` `float shown = smoothstep(0.0, 0.03, window) * (1.0 - smoothstep(0.3, 0.42, window));`
  - `Lightning.jsx:179` `float taper = pow(1.0 - along, 1.6) * smoothstep(0.0, 0.2, along) * smoothstep(front, front + 0.08, p.y);`
  - `Lightning.jsx:182` `core += (1.0 - smoothstep(gCore * 0.6 - gPixel, gCore * 0.6 + gPixel, bd)) * taper * min(gain, 1.0) * 0.8;`
  - `Lightning.jsx:202` `float energy = 0.0;`
  - `Lightning.jsx:203` `float core = 0.0;`
  - `Lightning.jsx:204` `float line = 0.0;`
  - `Lightning.jsx:214` `float reveal = uIntro >= 1.0 ? 1.0 : smoothstep(0.0, 0.08, uv.y - (1.1 - 2.4 * uIntro));`
  - `Lightning.jsx:261` `float hot = clamp(core + smoothstep(6.0, 20.0, e) * 0.55, 0.0, 1.0);`
  - `Lightning.jsx:263` `float fade = uFade > 0.0 ? smoothstep(0.0, 1.0, edge.x) * smoothstep(0.0, 1.0, edge.y) : 1.0;`
  - `Lightning.jsx:268` `float stroke = smoothstep(1.0, 3.6, line * uIntensity);`
  - `Lightning.jsx:269` `float halo = 1.0 - exp(-e * 0.35);`
  - `Lightning.jsx:412` `const ratio = Math.min(settingsRef.current.dpr ?? window.devicePixelRatio ?? 1, 2);`
  - (带数字的运动行共 32 条, 留前 28 条, 文件 644 行已逐行扫过)
- 指针/滚动: pointermove, pointerdown, pointerout, visibilitychange.
- 可中断: 连续模拟, 目标改了下一帧生效.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; 读 devicePixelRatio; 离屏或隐藏时有暂停线索; ResizeObserver.
- 减弱动效: 有. `396` const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
- Props: `color='#4d6bff'` (327), `bolts=1` (328), `spread=0.6` (329), `branches=0.5` (330), `xOffset=0` (331), `angle=0` (332), `size=1` (333), `thickness=1` (334), `glow=1` (335), `intensity=1` (336), `speed=1` (337), `flicker=0.6` (338), `mouseInteraction=true` (339), `mouseStrength=1` (340), `clickStrike=true` (341), `intro=true` (342), `fade=0` (343), `opacity=1` (344), `lightMode=false` (345), `paused=false` (346), `dpr` (347), `className=''` (348), `style` (349)
- 裁决: 不做. 全屏场和控件状态机无关, 首页最多留一个主角效果, 不进默认包.


### Backgrounds/LineWaves

- 文件: `Backgrounds/LineWaves/LineWaves.css` 14 行, `Backgrounds/LineWaves/LineWaves.jsx` 516 行. 目录内实现已逐行扫描.
- 看起来: 着色器场, uniform 有 uResolution, uPixel, uTime, uLines, uWidth, uGlow, uBrightness, uHighlight. 命名常数 PIXEL_BUDGET, MAX_RIPPLES, VERTEX, FRAGMENT.
- 技法: WebGL + rAF.
- 常数:
  - `LineWaves.jsx:6` `const PIXEL_BUDGET = 2.4e6;`
  - `LineWaves.jsx:7` `const MAX_RIPPLES = 4;`
  - `LineWaves.jsx:67` `float w = 0.6 * sin(q.x * 0.55 + t * 0.4 + 0.6 * sin(q.y * 0.9 - t * 0.28));`
  - `LineWaves.jsx:74` `float drift = 0.7 * (0.18 * sin(p.x * 1.6 - t * 0.33 + 0.7) + 0.1 * sin(p.x * 3.1 + t * 0.21));`
  - `LineWaves.jsx:75` `float center = 0.5 * (0.2 * sin(t * 0.17) + 0.08 * sin(t * 0.29 + 1.3));`
  - `LineWaves.jsx:76` `float width = 0.13 * uHighlightWidth;`
  - `LineWaves.jsx:84` `if (x < 1.0) return mix(uColor1, uColor2, smoothstep(0.0, 1.0, x));`
  - `LineWaves.jsx:85` `if (x < 2.0) return mix(uColor2, uColor3, smoothstep(1.0, 2.0, x));`
  - `LineWaves.jsx:86` `return mix(uColor3, uColor1, smoothstep(2.0, 3.0, x));`
  - `LineWaves.jsx:100` `float ring = 0.0;`
  - `LineWaves.jsx:105` `float fade = exp(-ripple.z * 1.3) * smoothstep(0.0, 0.12, ripple.z);`
  - `LineWaves.jsx:115` `float crowd = smoothstep(0.18, 0.5, fw);`
  - `LineWaves.jsx:117` `float fold = smoothstep(1.3, 2.2, fw * uResolution.y / uLines);`
  - `LineWaves.jsx:118` `float shimmer = mix(1.0, smoothstep(0.15, 0.85, noise(vec2(y * 1.6 + t * 0.07, p.x * 0.55 - t * 0.22))), 0.5);`
  - `LineWaves.jsx:130` `float span = 0.5 * sqrt(aspect * aspect + 1.0);`
  - `LineWaves.jsx:132` `float reveal = 1.0 - smoothstep(sweep - 0.6, sweep, p.x);`
  - `LineWaves.jsx:134` `float edge = 1.0;`
  - `LineWaves.jsx:148` `vec3 ink = mix(vec3(0.08), hue * 0.56 + 0.06, smoothstep(0.04, 0.2, chroma));`
  - `LineWaves.jsx:317` `window.devicePixelRatio || 1,`
  - `LineWaves.jsx:338` `const dt = clamp((now - last) / 1000 || 0, 0, 0.05);`
  - `LineWaves.jsx:340` `time += dt * s.speed * 2.5 * (reduced ? 0.25 : 1);`
  - `LineWaves.jsx:341` `cycle += dt * s.speed * s.cycleSpeed * 0.05;`
  - `LineWaves.jsx:342` `if (reveal < 1) reveal = Math.min(1, reveal + dt / 1.8);`
  - `LineWaves.jsx:352` `const follow = 1 - Math.exp(-dt * 10);`
  - `LineWaves.jsx:357` `lens.presence += (presence - lens.presence) * (1 - Math.exp(-dt * 5));`
- 指针/滚动: pointermove, pointerdown, pointerup, pointercancel, pointerleave, webglcontextlost, webglcontextrestored, visibilitychange.
- 可中断: pointercancel 有监听.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; 读 devicePixelRatio; 离屏或隐藏时有暂停线索; ResizeObserver.
- 减弱动效: 有. `295` const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
- Props: `color1='#ffffff'` (218), `color2='#ffffff'` (219), `color3='#ffffff'` (220), `colorCycleSpeed=1` (221), `speed=0.3` (222), `lineCount=72` (223), `lineWidth=1.3` (224), `glow=0.6` (225), `brightness=1` (226), `highlight=1` (227), `highlightWidth=1` (228), `warpIntensity=1` (229), `warpScale=1` (230), `rotation=-33` (231), `edgeFade=0` (232), `enableMouseInteraction=true` (233), `mouseInfluence=2` (234), `clickRipple=true` (235), `intro=true` (236), `lightMode=false` (237), `opacity=1` (238), `maxDevicePixelRatio=2` (239), `className=''` (240), `style` (241)
- 裁决: 不做. 全屏场和控件状态机无关, 首页最多留一个主角效果, 不进默认包.


### Backgrounds/LiquidChrome

- 文件: `Backgrounds/LiquidChrome/LiquidChrome.css` 14 行, `Backgrounds/LiquidChrome/LiquidChrome.jsx` 657 行. 目录内实现已逐行扫描.
- 看起来: 着色器场, uniform 有 uState, uSize, uStroke, uImpulse, uResolution, uUnit, uTime, uAmplitude. 命名常数 PIXEL_BUDGET, SIM_CELL, SIM_STEP, VERTEX, SIM, SLOPE.
- 技法: WebGL + rAF.
- 常数:
  - `LiquidChrome.jsx:6` `const PIXEL_BUDGET = 2.4e6;`
  - `LiquidChrome.jsx:7` `const SIM_CELL = 4;`
  - `LiquidChrome.jsx:8` `const SIM_STEP = 1 / 120;`
  - `LiquidChrome.jsx:113` `float shape = (1.0 - smoothstep(1.0 - edge, 1.0 + edge, d)) * (1.0 - 0.45 * d * d);`
  - `LiquidChrome.jsx:119` `p += uShift * smoothstep(0.3, 1.0, length(p));`
  - `LiquidChrome.jsx:121` `float soft = 0.008 + blur;`
  - `LiquidChrome.jsx:126` `float rise = smoothstep(-1.0, 1.0, dir.y);`
  - `LiquidChrome.jsx:128` `float edge = 0.008 + blur * 0.8;`
  - `LiquidChrome.jsx:129` `float lobe = smoothstep(0.15, 0.85, 0.5 + 0.5 * sin(atan(dir.y, dir.x) * 2.0 + 0.9));`
  - `LiquidChrome.jsx:130` `float tone = mix(2.4, 0.95, smoothstep(0.5 - edge, 1.0 + edge, radius));`
  - `LiquidChrome.jsx:131` `tone = mix(tone, 0.02, smoothstep(0.98 - edge, 1.12 + edge, radius));`
  - `LiquidChrome.jsx:132` `tone = mix(tone, mix(0.03, 0.3, lobe) * (0.8 + 0.4 * rise), smoothstep(1.15 - edge, 1.3 + edge, radius));`
  - `LiquidChrome.jsx:133` `float width = 0.035 + edge;`
  - `LiquidChrome.jsx:137` `float width = 0.015 + soft * 2.0;`
  - `LiquidChrome.jsx:138` `float rim = exp(-abs(radius - 1.0) / width) * 0.031 / width * (0.8 + smoothstep(-0.5, 0.8, p.y));`
  - `LiquidChrome.jsx:139` `float band = 1.0 - 0.95 * smoothstep(1.04 - soft, 1.12 + soft, radius);`
  - `LiquidChrome.jsx:140` `float wall = smoothstep(1.25, 1.55, radius) * (0.6 + 0.4 * rise);`
  - `LiquidChrome.jsx:141` `float streak = smoothstep(0.2, 0.8, 0.5 + 0.5 * sin(atan(dir.y, dir.x) * 3.0 + 0.6));`
  - `LiquidChrome.jsx:142` `vec3 color = vec3(0.004, 0.004, 0.005) + 0.02 * smoothstep(-0.4, 0.6, p.y);`
  - `LiquidChrome.jsx:169` `for (float i = 1.0; i < 9.0; i++) {`
  - `LiquidChrome.jsx:189` `float fade = smoothstep(3.0, 9.0, 3.14159 * uUnit / density);`
  - `LiquidChrome.jsx:198` `float alpha = smoothstep(0.0, 0.1, length(slope));`
  - `LiquidChrome.jsx:199` `vec3 f0 = mix(vec3(1.0), uTint, smoothstep(0.05, 0.6, length(slope))) * 0.92;`
  - `LiquidChrome.jsx:207` `for (float t = -0.375; t < 0.4; t += 0.25) {`
  - `LiquidChrome.jsx:393` `window.devicePixelRatio || 1,`
  - `LiquidChrome.jsx:477` `const dt = clamp((now - last) / 1000 || 0, 0, 0.05);`
  - `LiquidChrome.jsx:479` `time += dt * s.speed * (reduced ? 0.25 : 1);`
  - `LiquidChrome.jsx:480` `presence = Math.min(1, presence + dt / 1.8);`
  - (带数字的运动行共 30 条, 留前 28 条, 文件 657 行已逐行扫过)
- 指针/滚动: pointermove, pointerdown, pointerup, pointercancel, pointerleave, webglcontextlost, webglcontextrestored, visibilitychange.
- 可中断: pointercancel 有监听.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; 读 devicePixelRatio; 离屏或隐藏时有暂停线索; ResizeObserver.
- 减弱动效: 有. `344` const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
- Props: `color='#ffffff'` (275), `speed=0.2` (276), `amplitude=0.3` (277), `frequencyX=3` (278), `frequencyY=3` (279), `detail=4` (280), `thickness=1` (281), `depth=1` (282), `roughness=0.3` (283), `exposure=1` (284), `interactive=true` (285), `rippleStrength=1` (286), `rippleSize=1` (287), `tilt=1` (288), `intro=true` (289), `lightMode=false` (290), `maxDevicePixelRatio=2` (291), `className=''` (292), `style` (293)
- 裁决: 不做. 全屏场和控件状态机无关, 首页最多留一个主角效果, 不进默认包.


### Backgrounds/LiquidEther

- 文件: `Backgrounds/LiquidEther/LiquidEther.css` 14 行, `Backgrounds/LiquidEther/LiquidEther.jsx` 784 行. 目录内实现已逐行扫描.
- 看起来: 着色器场, uniform 有 uTexel, uVelocity, uSize, uSegment, uForce, uRadius, uAmount, uWalls. 命名常数 PIXEL_BUDGET, MAX_CELLS, PRESSURE_STEPS, PALETTE_SIZE, VERTEX, HEADER.
- 技法: WebGL + rAF.
- 常数:
  - `LiquidEther.jsx:6` `const PIXEL_BUDGET = 2.4e6;`
  - `LiquidEther.jsx:7` `const MAX_CELLS = 140000;`
  - `LiquidEther.jsx:8` `const PRESSURE_STEPS = 32;`
  - `LiquidEther.jsx:9` `const PALETTE_SIZE = 256;`
  - `LiquidEther.jsx:174` `float hollow = smoothstep(0.7, 1.6, speed);`
  - `LiquidEther.jsx:175` `alpha = smoothstep(0.08, 0.5, level) * mix(0.85, 0.1, hollow);`
  - `LiquidEther.jsx:177` `float hot = 1.0 - exp(-max(speed - 0.75, 0.0) * 1.2);`
  - `LiquidEther.jsx:189` `const keepFor = (persistence, dt) => Math.pow(0.5, dt / (0.35 + persistence * persistence * 12));`
  - `LiquidEther.jsx:302` `force: Math.max(0, mouseForce),`
  - `LiquidEther.jsx:436` `window.devicePixelRatio || 1,`
  - `LiquidEther.jsx:526` `gl.uniform2f(u.uStep, dt / size.width, dt / size.height);`
  - `LiquidEther.jsx:527` `gl.uniform1f(u.uKeep, keepFor(s.persistence, dt));`
  - `LiquidEther.jsx:568` `vx: clamp(((to[0] - from[0]) / dt) * scale, -6000, 6000),`
  - `LiquidEther.jsx:569` `vy: clamp(((to[1] - from[1]) / dt) * scale, -6000, 6000),`
  - `LiquidEther.jsx:579` `const dt = clamp((now - last) / 1000 || 0, 0, 1 / 30);`
  - `LiquidEther.jsx:581` `const pace = Math.min(1, dt * 60);`
  - `LiquidEther.jsx:584` `if (opening.active && dt > 0) {`
  - `LiquidEther.jsx:588` `addStroke(from, sweep(opening.time), dt, 0.2 * fade, s.radius);`
  - `LiquidEther.jsx:591` `} else if (s.autoDemo && !reduced && idle && dt > 0) {`
  - `LiquidEther.jsx:592` `auto.ramp = Math.min(1, auto.ramp + dt / 0.8);`
  - `LiquidEther.jsx:593` `auto.phase += dt * s.autoSpeed * 1.6;`
  - `LiquidEther.jsx:597` `const scale = (s.force / 20) * 0.45 * s.autoIntensity * auto.ramp * auto.ramp * gust * pace;`
  - `LiquidEther.jsx:608` `if (pointer.moved && dt > 0) {`
  - `LiquidEther.jsx:611` `addStroke([pointer.fromX, pointer.fromY], [pointer.x, pointer.y], span, (s.force / 20) * 0.15 * pace, s.radius);`
  - `LiquidEther.jsx:623` `if (dt > 0) simulate(s, dt);`
  - `LiquidEther.jsx:694` `const push = 1400 * (s.force / 20);`
- 指针/滚动: pointermove, pointerdown, pointerup, pointercancel, pointerleave, webglcontextlost, webglcontextrestored, visibilitychange.
- 可中断: pointercancel 有监听.
- 性能: 无自管循环. 交给 CSS 或库.; 有 rAF, 并且有 cancel; IntersectionObserver; 读 devicePixelRatio; 离屏或隐藏时有暂停线索; ResizeObserver.
- 减弱动效: 有. `352` const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
- Props: `colors=['#5227FF'` (271), `intensity=1` (272), `mouseForce=20` (273), `cursorSize=100` (274), `persistence=0.75` (275), `viscosity=0` (276), `resolution=0.5` (277), `bounceEdges=false` (278), `clickBurst=true` (279), `autoDemo=true` (280), `autoSpeed=0.5` (281), `autoIntensity=2.2` (282), `autoResumeDelay=1000` (283), `intro=true` (284), `lightMode=false` (285), `backgroundColor='transparent'` (286), `maxDevicePixelRatio=2` (287), `className=''` (288), `style` (289)
- 裁决: 不做. 全屏场和控件状态机无关, 首页最多留一个主角效果, 不进默认包.

# react-bits TextAnimations

来源提交 `4dc7b5b`. 每个目录的实现文件逐行扫描后摘运动行.

