# react-bits batch 01

### Animations/AnimatedContent

- 文件: `Animations/AnimatedContent/AnimatedContent.jsx` 214 行. 目录只有这一份, 无 CSS/TW 分叉.
- 看起来: 内容沿竖直或水平轴从 `distance` 滑到 0, 透明度收到 1, 可选同时收缩放,模糊,旋转,透视倾斜, 或用 CSS 遮罩从 0 擦到 1. 进视口或挂载时播; `disappearAfter > 0` 时再反向滑出并缩到 0.8.
- 技法: DOM, GSAP timeline + ScrollTrigger. 时间积分是 GSAP 的, 没有自写弹簧.
- 常数:
  - `distance = 100` (px), `direction = 'vertical'`, `reverse = false` (`AnimatedContent.jsx:23-25`); `sign = reverse ? -1 : 1` (`:69`), 位移 `distance * sign` (`:80`)
  - `duration = 0.8` 秒, `ease = 'power3.out'` (`:26-27`); `delay = 0` 秒, 实际 `Math.max(delay, 0)` (`:36`, `:144`)
  - `initialOpacity = 0`, `animateOpacity = true`, `scale = 1`, `blur = 0`, `rotate = 0`, `tilt = 0` (`:28-33`); 终点轴 0,scale 1,opacity 1 (`:84-87`)
  - `blur > 0` 时 from `blur(${blur}px)` 到 `blur(0px)` (`:92-94`); `rotate` 时 `rotation = rotate * sign` 收到 0 (`:96-98`)
  - `tilt` 时水平用 `rotationY = -tilt * sign`, 竖直用 `rotationX = tilt * sign`, `transformPerspective = 900` (`:100-105`)
  - 擦除遮罩 `calc(var(--ac-wipe) * 140% - 40%)`, `--ac-wipe` 从 0 到 1 (`:12-17`, `:109-110`)
  - `threshold = 0.1`, `stagger = 0`, `staggerFrom = 'start'` (`:35-38`); `stagger > 0` 时 `each: stagger` (`:112`)
  - 触发线 `top ${(1 - threshold) * 100}%` (`:151`); scrub 终点 `top ${Math.max((1 - threshold) * 100 - 45, 5)}%` (`:158`); scrub 数值下限 `0.01` (`:159`)
  - `disappearAfter = 0`, `disappearDuration = 0.5` 秒, `disappearEase = 'power3.in'` (`:42-44`); 离场位移 `-distance * sign`, `scale: 0.8` (`:122-127`)
- 指针/滚动: 无指针. `trigger = 'scroll'` 时 ScrollTrigger `onEnter` 调 `tl.play()`; `once = false` 时 `onLeaveBack` 调 `tl.reverse()`, 并在有遮罩时重设 maskImage (`:165-176`). `trigger = 'mount'` 直接 `tl.play()` (`:146-148`). scroller 默认 `container` 或 `#snap-main-container` (`:60`).
- 可中断: timeline 以 `paused: true` 创建 (`:136`). `once` 默认 true, 离开再进入不重播. `once = false` 时 reverse 保留时间轴进度并倒放, 没有独立速度状态. 改 props 会 `ctx.revert()` 拆掉重来 (`:180`), 进度不保留. 离场是 `onComplete` 之后另起 `gsap.to` (`:132`, `:141`), 不排在入场时间轴上. 无 pointerup / pointercancel.
- 性能: 不自管 rAF; 非 scrub 时 ScrollTrigger 只在越过起点时启动时间轴, scrub 才跟滚动更新. 无 DPR. 每实例一个 `gsap.context` 和一个 ScrollTrigger. from/to 对象在 effect 里建一次, 无每帧分配.
- 减弱动效: effect 内读一次 `matchMedia('(prefers-reduced-motion: reduce)')` (`:63`). 命中则只调 `onComplete`, 不建 from/to (`:74-76`), 元素停在 `visibility: 'visible'` (`:72`). 不监听后续变化. 首帧样式是 `visibility: 'hidden'` (`:208`).
- Props: `children`, `container`, `distance=100`, `direction='vertical'`, `reverse=false`, `duration=0.8`, `ease='power3.out'`, `initialOpacity=0`, `animateOpacity=true`, `scale=1`, `blur=0`, `rotate=0`, `tilt=0`, `wipe='none'`, `threshold=0.1`, `delay=0`, `stagger=0`, `staggerFrom='start'`, `trigger='scroll'`, `once=true`, `scrub=false`, `disappearAfter=0`, `disappearDuration=0.5`, `disappearEase='power3.in'`, `onStart`, `onComplete`, `onDisappearanceComplete`, `className=''`, `style`
- 裁决: 借鉴. HX-UI 入场距离已是 12px, 不要搬 100px 加 `power3.out` 的通用滑入. 可拿走的是首帧 `visibility: hidden` 防未进视口闪一下, 以及擦除窗口 `140% - 40%` 和 scrub 终点再提前 45 个百分点,下限 5%. 离场 `scale: 0.8` 写死且不读 `scale` prop, 避开.

### Animations/BlobCursor

- 文件: `Animations/BlobCursor/BlobCursor.jsx` 852 行, `BlobCursor.css` 12 行. CSS 只把根设成 `absolute; inset: 0; overflow: hidden; pointer-events: none`, 画布 `width/height: 100%`. 无第二份实现.
- 看起来: 8 个核球加一条变细拖尾合成一块元球, 跟着指针移动; 按下被压扁并喷出液滴, 质量变小后再长回; 走得快时从尾部滴落. 指针离开后体积收到 0.
- 技法: three.js WebGLRenderer, 片元里自写胶囊 SDF 和多项式光滑并, 通过 `onBeforeCompile` 塞进物理材质. 质点是自写半隐式欧拉, 不用 rapier. 自由液滴是 `InstancedMesh`.
- 常数:
  - 结构: `CORE = 8`, `HEAD_RADIUS = 0.7`, `HEAD_BLEND = 0.6`, `MAX_TRAIL = 16`, `MAX_DROPS = 96`, `MAX_PARTS = 48`, `DROP_LIFE = 30` 秒 (`BlobCursor.jsx:9-15`)
  - 默认 props 与钳制: `size = 140` 钳 `12..400`, `morph = 0`, `morphSpeed = 0.4`, `depth = 1`, `trail = 16` 取整钳 `0..16`, `lag = 0.55`, `goo = 1`, `stretch = 0.6`, `wobble = 1`, `drip = 0`, `splash = true`, `splashCount = 6` 钳 `1..32`, `splashSpeed = 0.5`, `splashSize = 0.5`, `splashGravity = 0`, `regrow = 0.5`, `shine = 1`, 以上 0..1 的都钳 `0..1` (`:141-157`, `:171-187`); `material = 'chrome'`, `color = '#3B82F6'` (非法色落回 `#ffffff`), `blend = 'normal'`, `shadow = false`, `hideCursor = true` (`:139-160`, `:169`, `:189`, `:342`)
  - 积分步长: `dt` 钳在 `1/240..1/30` 秒 (`:777`); 子步 `ceil(dt / (1/240))` (`:517-518`)
  - 弹簧 (刚度直接乘位移, 无单独 mass): 锚点刚度减弱动效时 `2400`, 否则 `mix(1200, 160, lag)`; 核 `mix(900, 260, lag)` 再乘 `mix(1.3, 0.7, spread)`; 拖尾链 `mix(30000, 1500, stretch)` (`:519-521`, `:548`); 阻尼系数 `2 * sqrt(k) * 比`, 锚点比 `0.9`, 核比 `mix(0.95, 0.4, wobble)`, 链比 `mix(0.95, 0.65, wobble)` (`:522-523`, `:546`, `:554`); 速度项减的是相对帧速度 `(vx - frameX)` (`:507-511`)
  - 肿胀弹簧刚度 `300`, 阻尼比 `mix(0.8, 0.38, wobble)` (`:582-583`); 目标: 离开 `0`, 按下 `0.86`, 悬停可点元素 `1.3`, 否则 `1` (`:525`); 值小于 0 时钉 0 并把负速度清掉 (`:585-587`); 按下 `velocity -= 2`, 松开 `+= 1.2` (`:481`, `:489`)
  - 形变时钟 `dt * 4 * morphSpeed^1.5` (`:527`); 弯曲频率 `0.71`,角速 `0.23`, 折叠频率 `0.53`,角速 `0.17` (`:528-531`); 位移 `radius * clamp(0.14 + 0.75 * shape, 0, 0.8)`, `hold = 1 / (1 + 0.3 * strain)` (`:537-539`)
  - 喷溅: 速度 `mix(320, 1600, splashSpeed)` px/s, 半径比 `mix(0.12, 0.42, splashSize)`, 阻力 `0.6`, 寿命 `30` 秒, 继承锚点速度 `0.4`, 滑行目标是初速的 `0.45` (`:433-457`); 质量损失 `clamp(lost * 2.4, 0.25, 0.7)`, 下限 `0.2`, 等待 `0.28` 秒 (`:463-464`); 重力加速度 `splashGravity * 2200` (`:564`); 回收 `1 - exp(-18 * h)`, 下沉 `0.14` 秒, 质量上限 `1.35` (`:565-570`); 再生长 `(1 - mass) * (1 - exp(-dt * mix(0.9, 6, regrow)))` (`:642`)
  - 滴落: 速率 `drip * 26 * clamp((rush - 600) / 1800, 0, 1)`, 半径 `mix(0.07, 0.17)`, 寿命 `mix(2.5, 4)` 秒, 阻力 `9` (`:596-615`)
  - 着色器: 光滑并 `h = max(k - abs(d), 0) / k`, 位移 `h^3 * k / 6`, 法线权重 `0.5 * h^2` (`:64-66`); 覆盖 `clamp(0.5 - sdf / fwidth, 0, 1)`, `<= 0` 丢弃 (`:93-94`); 表面高度牛顿迭代 `8` 次, 失败取区间中点 (`:98-103`); uniform 初值 `blobJoin = 0`, `blobLift = 1`, `blobTop = 1`, `blobRef = 1` (`:244-247`); 无鼠标 uniform, 指针坐标每帧写入 `blobSeg`
  - 融合与拖尾: goo 半径 `mix(0.3, 0.9, goo)`, 接缝 `mix(0.2, 0.6, goo)`, 出现阈值半径 `0.5` (`:649-650`, `:746`); 拖尾起始半径 `mix(0.6, 0.95, smoothstep)`, 锥度指数 `mix(0.75, 1.6, clamp(length / (radius * 6), 0, 1))`, 末端厚度 `radius * 0.1`, 段融合 `radius * 0.06` (`:713-715`, `:734`); 深度 `lift = mix(0.3, 1, depth)` (`:652`)
  - 静止门槛: 能量 `<= 1.5` 累计 `calm`, `calm > 0.4` 秒停 rAF; 能量含 `|swell.velocity| * 40`, `drops * 100`, `|1 - mass| * 400` (`:786-797`); 首次进入且 `swell < 0.05` 时把速度清零并瞬移 (`:413`, `:394-399`)
- 指针/滚动: `window` 上 `pointermove` / `pointerdown` / `pointerup` / `pointercancel`, `document` `pointerout`, `window` `blur` (`:810-814`). 坐标是 `clientX/Y - rect` (`:403-407`). 移动只改 `pointer.x/y`, 力来自弹簧, 不直接写 uniform. 离开,失焦把 `inside` 和 `down` 置假, 肿胀目标变 0 (`:494-504`). 触摸的 `pointermove` 在未按下时直接返回 (`:411`). 悬停 `a, button, input, select, textarea, label, summary, [role=button], [data-blob-grow]` 时目标尺度 `1.3` (`:18`, `:419`). 无滚动.
- 可中断: 目标每帧都是当前指针, 速度累加不重置, 没有动画队列. `pointerup` 与 `pointercancel` 都进 `onUp` (`:812-813`); `onUp` 在 `pointer.down` 为假时直接返回 (`:487`). 触摸松开额外把 `inside` 设为假 (`:490`).
- 性能: rAF 在不可见且指针在外, 或 `calm > 0.4` 秒时停 (`:796-797`). DPR 上限 `2` (`:316`). 监听器是每个实例各挂一套 window/document, 不是共享. `build` 每帧新建 `parts` / `merging` / `route` 数组 (`:654-655`, `:706`). 阴影贴图 `2048`, `blurSamples = 20`, 与 `shadow` prop 无关地开着 (`:211-234`).
- 减弱动效: effect 里读一次 `prefers-reduced-motion` (`:287`), 不监听变化. 命中后锚点刚度改 `2400` (`:519`), 形变时钟不走 (`:527`), 按下不喷溅 (`:482`), 不滴落 (`:596`), 呼吸不再挡住停帧 (`:794`). 跟随弹簧仍在.
- Props: `material='chrome'`, `color='#3B82F6'`, `size=140`, `morph=0`, `morphSpeed=0.4`, `depth=1`, `trail=16`, `lag=0.55`, `goo=1`, `stretch=0.6`, `wobble=1`, `drip=0`, `splash=true`, `splashCount=6`, `splashSpeed=0.5`, `splashSize=0.5`, `splashGravity=0`, `regrow=0.5`, `shine=1`, `shadow=false`, `blend='normal'`, `hideCursor=true`, `className=''`, `style`
- 裁决: 借鉴. 不把 three 元球光标,RoomEnvironment 和 96 颗实例液滴引进组件库. 运动层只记跟随阻尼减的是相对领头速度, 以及能量降到 `1.5` 后再静 `0.4` 秒就停 rAF.

### Animations/ClickSpark

- 文件: `Animations/ClickSpark/ClickSpark.jsx` 420 行. 目录只有这一份.
- 看起来: 点击处沿角度撒出短线,拖尾,圆点或四角星, 向外走到半径后按进度淡出; 线长随 `(1-p)^1.6` 缩短. `gravity > 0` 时下坠, `ring` 时多一圈扩散环.
- 技法: canvas2d. 位置由 `elapsed / life` 采样手写缓动, 不是 GSAP 或弹簧积分. 每次爆发单独建一块 canvas.
- 常数:
  - 缓动 (`ClickSpark.jsx:5-10`): `linear` 为 `t`; `ease-in` 为 `t^2`; `ease-out` 为 `1 - (1-t)^3`; `ease-in-out` 为 `t < 0.5 ? 4 t^3 : 1 - (2-2t)^3 / 2`; `spring` 为 `1 + 2.4 (t-1)^3 + 1.4 (t-1)^2`. 未知名字落回 `ease-out` (`:99`)
  - 默认: `sparkSize = 14` (下限 0), `sparkRadius = 30` 再乘 `extraScale = 1`, `sparkCount = 8` 取整钳 `1..64`, `sparkWidth = 2` 下限 `0.5`, `duration = 500` 毫秒下限 `60`, `randomness = 0.2` 钳 `0..1`, `gravity = 0` 下限 0, `spread = 360` 钳 `0..360`, `direction = 0`, `glow = 0` 钳 `0..1` (`:67-79`, `:94-105`)
  - 下坠 `0.5 * gravity * 500 * 秒^2` (`:15`, `:122`); 减弱动效时秒数按 0, 不掉 (`:135`)
  - 寿命 `duration * life`, 粒子 `life = 1 + (rand-0.5) * 0.5 * randomness` (`:131`, `:286`); 淡出 `smoothstep`, 线从 `0.55` 起,其余形状从 `0.7` 起 (`:138`); 线长 `size * scale * (1-p)^1.6`, 第二点至少再走 `0.01` (`:144-146`)
  - 拖尾滞后 `min(elapsed, 70 + size * 4 * scale)` 毫秒 (`:166`); 点半径 `width * 1.25 * (1 - 0.5 e)`, 发光半径 `* 2.6`, 透明度 `fade * 0.18 * glow` (`:199-201`); 星内凹 `radius * 0.16`, 闪烁 `sin(π * clamp(p * 1.1, 0, 1))^0.7`, 绘制半径 `size * 0.6 * scale * twinkle`, 低于 `0.05` 不画, 自旋 `spin * p * π * 0.5` (`:30`, `:214-217`)
  - 环寿命 `duration * 0.8`, 半径 `2 + radius * 0.6 * ease-out(p)`, 透明度 `(1-p)^2 * 0.7`, 线宽 `max(0.5, width * (1-p) * 0.9)` (`:232-238`)
  - 满圆阈值 `spread >= 359.5`; 朝向 `(direction - 90)°` 转弧度, 默认 0 指向正上 (`:275-277`); 角度抖动 `(rand-0.5) * randomness * (step 或弧 或 1) * 0.9` (`:281-283`)
  - 画布外扩: `radius * (1 + 0.35 randomness) * (spring ? 1.15 : 1) + size * (1 + 0.4 randomness) + width * (glow > 0 ? 6 : 2) + 6` (`:295-299`); 同时最多 `32` 发, 超出删最旧 (`:14`, `:344`)
  - 发光强度乘相对亮度 `0.2126 r + 0.7152 g + 0.0722 b`, 再 `glow * (0.35 + 0.65 * luma/255)` (`:330`); 线发光线宽 `* 4.5`, 透明度 `fade * 0.14 * glow` (`:149-150`)
  - 鼠标去重: `700` 毫秒且位移 `< 12` px 视为同一次 (`:362-364`)
- 指针/滚动: 根上 `pointerdown` 与 `click` (`:368-369`). 鼠标只在 `pointerdown` 且 `button === 0` 时生成 (`:348-351`), 随后的 `click` 因 `pointerType === 'mouse'` 直接返回 (`:355`). 触摸和笔走 `click`. `detail === 0` (键盘) 在目标矩形中心生成 (`:356-359`). 命令式 `spark(x, y)` 用根矩形左上角加偏移, 缺省取中心 (`:372-374`). 无滚动. 坐标是 `clientX/Y`, 不转换成力.
- 可中断: 每颗粒子的位置是进度函数, 中途没有速度状态可保留. 新的点击另起一发, 旧的继续画完, 不排队. 没有 `pointerup` / `pointercancel`. 卸载时 `cancelAnimationFrame` 并拆掉 canvas (`:378-382`).
- 性能: `bursts` 为空就不再 `requestAnimationFrame` (`:267`). 无离屏检测. DPR 上限 `2` (`:307`). 监听器挂在该实例根节点. 拖尾每个粒子每帧 `createLinearGradient` (`:176`). 每发爆发新建一块 canvas, 不是每帧.
- 减弱动效: effect 内读一次 `prefers-reduced-motion`, 不监听变化 (`:117`). 命中后寿命改 `320` 毫秒 (`:16`, `:131`), 缓动锁在 `0.55`, 线长再乘 `0.5`, 拖尾 `back = 0.4`, 星闪烁改成 `1-p`, 环半径系数改 `0.6` (`:134-138`, `:144`, `:166-167`, `:214`, `:235`). 仍然会画, 只是更短.
- Props: `sparkColor='#fff'`, `sparkSize=14`, `sparkRadius=30`, `sparkCount=8`, `sparkWidth=2`, `duration=500`, `easing='ease-out'`, `extraScale=1`, `shape='line'`, `randomness=0.2`, `gravity=0`, `spread=360`, `direction=0`, `glow=0`, `ring=false`, `layer='front'`, `disabled=false`, `className=''`, `style`, `children`
- 裁决: 借鉴. 点击反馈若要做, 拿走鼠标 `pointerdown` 与键盘 `detail === 0` 分路, 以及 `700` 毫秒 / `12` px 去重, 避免一次点击画两发. 不把每发一块 canvas,`500` 毫秒 8 线当成动效令牌; `ease-out` 的三次方和 `spring` 多项式可以单独留作采样曲线.

### Animations/Crosshair

- 文件: `Animations/Crosshair/Crosshair.jsx` 433 行. 无独立 CSS; 隐藏系统光标靠运行时插入的 `cursor: none !important`. 无第二份实现.
- 看起来: 两条贯穿画布的十字线跟着指针, 中间留 `gap`. 锁到 `a` / `button` 时十字让出, 四角括号扩到目标盒外 6px. 点击时一圈从半径 3 扩到 33 后消失. `glitch` 时线段被切成抖动碎片, 约半秒收回.
- 技法: canvas2d. 跟随,出现,锁框都是 `1 - exp(-dt / τ)` 的一阶滞后, 没有速度状态, 也不是 GSAP.
- 常数:
  - 默认与钳制 (`Crosshair.jsx:25-56`): `color = '#ffffff'`, `thickness = 1` 钳 `0.5..8`, `opacity = 0.85` 钳 `0..1`, `lineStyle = 'solid'`, `gap = 0` 下限 0, `fade = 0` 钳 `0..1`, `smoothing = 0.35` 钳 `0..1`, `showCoordinates = true`, `targetEffect = 'lock'`, `targetSelector = 'a, button, [data-crosshair-target]'`, `clickPulse = true`, `hideCursor = false`, `blendMode = 'normal'`
  - `dt` 钳 `0.001..0.05` 秒 (`:252`). 跟随系数 `smoothing === 0` 或减弱动效时为 `1`, 否则 `1 - exp(-dt / (0.008 + smoothing * 0.16))` (`:259`); 默认 `smoothing = 0.35` 时 τ = `0.064` 秒
  - 出现 τ: 进入 `0.12` 秒, 离开 `0.25` 秒; 与目标差 `< 0.002` 就钉死 (`:263-264`)
  - 锁框: 目标盒左右上下各外扩 `6` (`-6` 与 `+12`, `:270`); 无目标时是以指针为中心的 `20×20` (`:272`). 吸附 τ = `0.085` 秒 (`:274`). 透明度 τ: 出现 `0.08`, 消失 `0.14`, 差 `< 0.002` 钉死 (`:280-281`)
  - 十字透明度 `presence * opacity * (1 - 0.6 * lock.alpha)` (`:194`). 虚线 `[thickness*6, thickness*5]`, 点线 `[0, thickness*4]` (`:197-198`). 隐藏系统光标时中心圆半径 `max(1.5, thickness*1.5)` (`:209`)
  - 淡出梯度端点透明度 `1 - fade`, 指针处为 1, 指针比例钳在 `0.001..0.999` (`:137-140`)
  - 故障: 新目标时 `glitch = 1` (`:328`), 每秒减 `dt / 0.5` (`:282`); `> 0.01` 才切段, 段数 `max(4, round(length / 28))`, 抖动 `(rand-0.5) * 14 * glitch` (`:146-149`)
  - 括号臂长 `min(14, w/3, h/3)`, 线宽 `max(1.5, thickness)` (`:168-170`)
  - 点击环: 寿命 `0.55` 秒, 缓动 `1 - (1-t)^3`, 透明度 `(1-t)^2 * opacity`, 半径 `3 + 30 * eased` (`:228-235`)
  - 停帧阈值: 指针差 `> 0.05` px, 锁框差和 `> 0.1` (`:285-290`)
  - 坐标标签字号 `10px`, 高 `16`, 文字宽再加 `10`, 边距 `4`, 圆角 `3`; 亮度 `0.2126 r + 0.7152 g + 0.0722 b > 150` 时字色 `#0a0a0a`, 否则 `#ffffff` (`:7`, `:113-124`)
- 指针/滚动: `pointermove` / `pointerdown` 挂在 `containerRef` 或 `window`; `pointerup` / `pointercancel` 挂在 `window`, 都进 `onUp` (`:386-389`). 坐标 `clientX/Y - canvas rect` (`:241-244`). 触摸且 `buttons === 0` 的移动直接返回 (`:356`). 非鼠标的松开会 `leave()`, 鼠标松开不离开 (`:370-371`). 无容器时 `document pointerout` 且 `relatedTarget` 为空才离开; 有容器则 `pointerleave` (`:374-376`, `:391-392`). `scroll` 捕获阶段用 `elementFromPoint` 重选目标 (`:378-381`, `:390`). 首次进入把十字瞬移到指针, 不走滞后 (`:332-336`).
- 可中断: 没有速度量. 目标改变后从当前 `x/y` 继续用同一 τ 趋近, 不排队. 点击环并行追加, 旧环照常放到 `0.55` 秒. `pointerup` 与 `pointercancel` 同路, 但只对非鼠标收起.
- 性能: 位置差,锁框,故障,点击环都停稳后不再 `requestAnimationFrame` (`:293`). 无离屏观察. DPR 上限 `2` (`:97`). 监听器按实例挂, 无容器时就是又一套 window 监听. `fade > 0` 时四条线每帧各建一条线性梯度 (`:134-136`); 点击环列表每帧 `filter` 出新数组 (`:283`).
- 减弱动效: 读一次 `prefers-reduced-motion` (`:72`). 命中后跟随,出现,锁框系数都是 `1`, `glitch` 恒为 `0`, 不生成点击环 (`:259`, `:263`, `:274`, `:280`, `:282`, `:364`).
- Props: `color='#ffffff'`, `containerRef=null`, `thickness=1`, `opacity=0.85`, `lineStyle='solid'`, `gap=0`, `fade=0`, `smoothing=0.35`, `showCoordinates=true`, `targetEffect='lock'`, `targetSelector='a, button, [data-crosshair-target]'`, `clickPulse=true`, `hideCursor=false`, `blendMode='normal'`, `className=''`, `style`
- 裁决: 借鉴. 不铺 `position: fixed`,`z-index: 10000` 的全视口十字光标. 可记的是跟随 τ = `0.008 + smoothing * 0.16` 秒, 以及差小于 `0.05` px 就停 rAF. 锁框外扩 `6` px 用的是测量矩形, 和 PillNav 一类指示器是同一件事, 不必为光标再做一份.

### Animations/CrystalizedBall

- 文件: `Animations/CrystalizedBall/CrystalizedBall.jsx` 1456 行, `CrystalizedBall.css` 6 行. CSS 只给根 `position: relative; width/height: 100%; overflow: hidden`. 无第二份实现. 预设 `plasma` / `aurora` / `nebula` / `ember` / `frost` / `solar` / `eclipse` / `abyss` 改的是同一套 uniform, 不是另一条积分.
- 看起来: 球面上几条谐波丝线带着耀斑转, 内部尘粒按 rise / fall / drift / orbit 动. 指针靠近时热力沿切向跟上, 拖过球面会把粒子从驻点拨开; 按下在点击角两边各甩一条短电弧. 入场约 2.2 秒从无到有.
- 技法: OGL / WebGL2. 丝线在片元里采样, 尘粒是 `POINTS`, 搅拌是浮点离屏里的自写弹簧 (`acc = -k o - 1.5 sqrt(k) v`). 不是 three, 不是 GSAP.
- 常数:
  - 默认预设 `plasma` (`CrystalizedBall.jsx:9-24`): 色 `#F25BD0`, `strands = 6`, `crackle = 0.85`, `flares = 0.65`, `glow = 0.9`, `sparks = 0.6`, `particleCount = 15000`, `fill = 0.5`, `motion = 'rise'`, `particleShape = 'square'`, `depth = 0.6`, `sway = 0.5`, `twinkle = 0.5`, `haze = 0.7`, `dustSpeed = 1`. 组件自身默认 `size = 0.7` 钳 `0.1..1.5`, `speed = 1`, `hoverStrength = 0.7`, `interactive = true`, `intro = true`, `paused = false`, `theme = 'dark'` (`:807-829`, `:1182`)
  - 其余预设只换这些数: `ember` 尘速 `1.6`,圆点,`haze = 0.9`; `frost` 运动 `fall`,`crackle = 0.3`; `solar` 运动 `orbit`,`glow = 1.1`,`flares = 1`; `abyss` `20000` 粒,`fill = 0.8` (`:60-75`, `:77-92`, `:94-109`, `:128-144`)
  - 上限: 丝 `8`, 电弧 `4`, 粒子 `40000` 且按 `100` 取整, 状态贴图宽 `256`, 像素预算 `4.5e6`, 入场 `2.2` 秒, 搅拌余晖 `7` 秒 (`:149-155`, `:1097`)
  - `dt` 钳 `1/240..0.05` 秒 (`:1173`). 入场时钟收到 1 用 `2.2` 秒 (`:1178`). `presence = easeOut(smooth(0, 0.42))`, `unfold = easeOut(smooth(0, 0.32))`, `charge = sin(π * smooth(0.22, 0.78)) * 0.35`, 内部雾 `smooth(0.2, 0.95)`, 粒子揭开 `smooth(0.18, 1)` (`:164`, `:1179-1181`, `:1279`, `:1308`). `easeOut` 是 `1 - (1-t)^3`
  - 热力角弹簧: `power < 0.02` 时角度瞬移且速度清零 (`:1189-1191`); 否则 `velocity += (120 * turn - 19 * velocity) * dt` (`:1194`). 功率 τ 上升 `0.3` 秒,下降 `0.55` 秒 (`:1196`). 近球高斯 `exp(-((reach - radius) / (radius * 0.45))^2)`, τ `0.15` 秒 (`:1197-1198`). `surge` 衰减 `exp(-dt / 0.7)` (`:1199`)
  - 笔刷: 跳动 `> 0.6` 半径就瞬移并清速度 (`:1203-1209`); 跟随 `1 - exp(-dt / 0.05)`, 速度上限 `4` (`:1211-1217`); 球内 `exp(-max(0, hypot - 1) * 6)` (`:1218`). 搅拌能量衰减 `exp(-dt / 1.2)` (`:1220`). 注视弹簧 `velocity += (40 * error - 11 * velocity) * dt`, 注视钳 `±1.6`, 写入转角时乘 `0.3` / `0.16` (`:1292-1301`)
  - 摇摆: `sway * 0.42 * sin(t * 0.23)` 与 `sway * 0.12 * sin(t * 0.17 + 1.3)` (`:1299-1301`)
  - 丝线片元: 谐波振幅 `0.35, 0.3, 0.22, 0.13` (`:471`); 热力 `exp(-delta^2 / 0.3)` (`:518`); 线振幅 `R * 0.016 * (0.3 + 1.4 crackle)`, 抖动 `R * 0.0048`, 耀斑 `R * 0.064 * (0.4 + 1.2 crackle) * flares * 1.6` (`:520-522`); 线宽 `max(0.6, radius * 0.0035)`, 角分箱 `clamp(round(2π R / 2.6), 240, 900)`, 帧盐 `floor(rimTime * 24) % 100000` (`:1266-1269`); 光环 `smoothstep(R*0.05, R*0.105, abs(dr - R*0.0213))`, 细铃 `bell(dr, max(R*0.0117, line))` (`:512-515`)
  - 尘粒片元: rise/fall 沿寿命上下 `seed.w * (u-0.5)`; drift 频率 `0.37 / 0.83 / 0.29 / 0.61 / 0.33`, 幅度 `0.045`; orbit 角速度 `0.6 + 0.9 rand`, 半径 `0.025 + 0.05 rand`; 微抖 `0.002 + 0.006`, 频率 `0.8 + 2.4` (`:401-418`). 闪烁频率 `2 + 6 rand`, `smoothstep(-0.9, -0.6)` (`:648-649`). 点大小 `max(1, radius / 491)` (`:1307`)
  - 搅拌 uniform 默认 `uBrush = (0,0,0,0)`, `uKick = (0,0,0,0)`, `uDt = 0.016` (`:977-981`). 每粒 `k = mix(0.8, 2.2)`, `acc = -k o - 1.5 sqrt(k) v` (`:737-738`); 笔刷高斯 `exp(-|gap|^2 / 0.07)` 再乘 `14` (`:740-742`); 旋度频率 `1.7, 1.9, 1.5` 与 `2.3, 2.1, 2.7`, 时间 `uDustTime * 0.15` (`:712-717`); 约束半径 `0.97`, 法向速度反弹 `1.5` (`:762-765`). 实际步长 `min(dt, 1/30)` (`:1317`)
  - 电弧: 跨度 `(0.05 + rand*0.07)` 带符号, 时长 `0.2 + rand*0.2` 秒, 强度在片元里乘 `sin(π life / duration)` (`:1160-1165`, `:1257`). 自动间隔重置 `0.15 + rand*0.6` 秒 (`:1240`). 按下距离 `> 1.3` 半径则忽略; 冲量 `hoverStrength * 1.2`, 两条弧强度 `1.3` 与 `1.1` (`:1388-1394`)
  - 合成: 暗色膝点 `0.6`, 过曝 `0.4 * (1 - exp(-over / 0.4))`, 峰超过 `1.8` 再加 `0.25`; 亮色覆盖 `1 - exp(-peak * 2.4)` (`:782-794`, `:793`)
- 指针/滚动: `window` 上 `pointermove` / `pointerdown` / `pointerup` / `pointerout` / `blur` (`:1415-1419`). 坐标 `client` 减容器矩形, y 再翻成球心向上 (`:1185-1186`, `:1360-1364`). 不直接写一个衰减 uniform: 热力进 `uHeat = (angle, near, power * presence)`, 笔刷进 `uBrush`, 按下进一帧 `uKick` (`:1288`, `:1318-1320`). 离开,失焦把 `inside` 置假 (`:1398-1405`). 触摸的 `pointerup` 额外离开 (`:1407-1408`). 无 `pointercancel`. 无滚动.
- 可中断: 热力角速度和注视速度一直累加, 只有 `heat.power < 0.02` 或笔刷跳动 `> 0.6` 才清速度. 电弧并行, 最多 4 条, 满了就丢新的 (`:1157`), 不排队. `pointerup` 只对触摸收起; `pointercancel` 没有监听.
- 性能: `IntersectionObserver` 离屏置 `visible = false` 后不再排 rAF (`:1351`, `:1424-1427`). `paused` 或减弱动效时时间不走, 但热力未停稳仍会再画几帧. DPR 取 `min(设备比, 2, sqrt(4.5e6 / 像素))` (`:1150`). 监听器每实例一套 window. 半精度失败时颜色编码 `0.25` 再在合成里除掉 (`:892`, `:987`). 搅拌贴图两张 `STATE_WIDTH × rows`, 粒子默认一万五.
- 减弱动效: 读一次 (`:1123`). 命中后 `moving` 为假, 入场时钟直接当 `1`, `hoverStrength` 被当成 `0`, `pointerdown` 不产生冲量和电弧 (`:1177-1178`, `:1184`, `:1379`). 画面停在终态, 不监听媒体查询变化.
- Props: `preset='plasma'`, `color` (缺省用预设), `theme='dark'`, `size=0.7`, `strands`, `crackle`, `flares`, `glow`, `sparks`, `particleCount`, `fill`, `motion`, `particleShape`, `depth`, `sway`, `twinkle`, `haze`, `speed=1`, `dustSpeed`, `interactive=true`, `hoverStrength=0.7`, `intro=true`, `paused=false`, `className=''`, `style`. 未传的丝线/粒子项回落到当前预设.
- 裁决: 不做. 这是容器里的装饰能量球, 和控件状态无关. 不引进 OGL,一万五千个点,以及 `4.5e6` 像素预算的半精度离屏. 角弹簧 `120 * turn - 19 * velocity` 和搅拌 `1.5 * sqrt(k)` 留在这份实现里, 运动层不从装饰场再抄一份积分.

### Animations/Cubes

- 文件: `Animations/Cubes/Cubes.jsx` 679 行, `Cubes.css` 15 行. CSS 把容器做成 `overflow: hidden; touch-action: pan-y`, 画布 `absolute; inset: 0`. 无第二份实现.
- 看起来: `gridSize` 见方的小立方体朝指针倾, 倾角在半径内按四次方衰减; 划过时沿切向给角速度. 点击发出最多 6 圈涟漪, 波前扫到的格子被拧一下并闪白. 无人碰 3 秒后笔刷自己走利萨如. 入场从中心向外, 每格先翻 90° 再站住.
- 技法: 手写 WebGL2 实例化立方体, 不用 three / OGL. 倾角是自写半隐式弹簧; 指针位置是一阶跟随, 不是 GSAP.
- 常数:
  - 默认与钳制 (`Cubes.jsx:216-264`): `gridSize = 10` 取整钳 `1..40`, `gap = 0.18` 钳 `0..0.9`, `faceColor = '#120F17'`, `edgeColor = '#ffffff'`, `edgeWidth = 1` 下限 0, `edgeStyle = 'solid'`, `faceOpacity = 1` 钳 `0..1`, `shading = 0.6` 下限 0, `maxAngle = 45` 度, `radius = 3` 下限 `0.5` (格), `speed = 1` 下限 `0.05`, `bounce = 0.4` 钳 `0..1`, `brush = 1` 下限 0, `perspective = 0` 钳 `0..1`, `autoAnimate = true`, `rippleOnClick = true`, `rippleColor = '#ffffff'`, `rippleSpeed = 1` 下限 `0.05`, `intro = true`, `paused = false`
  - 弹簧 (`:464-521`): `stiffness = 160 * speed^2`, `damping = 2 * (1 - 0.82 * bounce) * sqrt(stiffness)`. `bounce = 0.4` 时阻尼比是 `0.672`. `wx += (stiffness * (target - rx) - damping * wx) * dt`, 角度再加 `wx * dt`. 停稳阈值角度差或角速度和 `> 0.0005`
  - 倾角目标: `t = distance / radius`, `t < 1` 时衰减 `(1 - t^2)^2 * weight`; `tilt = maxAngle * falloff * (distance / hypot(distance, 0.8))`, 轴向是切向 (`:485-492`)
  - 笔刷切向冲量: 速度超过 `0.0001` 才有方向, 幅度 `min(speed, 40) * brush * 1.6`, 加进角速度时再乘 `falloff * dt * 4` (`:474-496`)
  - 光标跟随 `1 - exp(-dt * 18)`, 速度估计 `1 - exp(-dt * 10)`, `dt` 下限按 `0.001` (`:454-461`). 权重速率: 进入 `6`, 离开 `2.5`, 差 `< 0.002` 算停 (`:462`, `:556`). 帧 `dt` 有上次时间时钳到 `0.05` 秒, 否则 `1/60` (`:564`)
  - 自动笔刷: 指针在内且 `clock - moved <= 3` 秒用指针, 否则 `autoAnimate` 时 `reach = gridSize * 0.42`, `x = sin(t*0.37) * reach * cos(t*0.11)`, `y = sin(t*0.53 + 1.2) * reach` (`:436-447`). 第一次咬合瞬移光标 (`:449-452`)
  - 涟漪: 最多 `6` 圈, 超出丢掉最旧 (`:378`). 波速 `8 * rippleSpeed` 格/秒, 波前厚度是这一帧的行程 (`:468`, `:504-505`). 冲量 `13 * exp(-reach / (gridSize * 0.8))` 加进角速度 (`:506-508`). 闪光衰减 `exp(-dt * 3.2)`, `> 0.01` 仍算在动 (`:469`, `:511`). 波程超过 `gridSize * 1.5 + 2` 删除 (`:470-472`)
  - 入场 `1.1` 秒 (`:117`). 错峰 `hypot(col, row) / max(1, size/2) * 0.55` 秒 (`:361`, `:533`). 缓动 `1 - (1-t)^3`, 缩放即该值, 翻滚 `(1 - eased) * π/2` (`:534-536`). 全场 `introClock >= 1.1 + 0.6` 后钉成 `99`, 不再翻 (`:550`)
  - 片元: 边覆盖 `smoothstep(halfWidth ± 0.5)`, 虚线缝在 `0.25`, 点半径 `max(edgeWidth*0.9, 1)` 再 `±0.75` (`:54-64`). 侧面可见 `smoothstep(0.06, 0.28, abs(normal.z))` (`:69`). 明暗在边色上混 `0.12..0.42` (`:72`). 闪光把面色混向涟漪色 `0.22`, 边色全混 (`:73-74`). 光源 `(-0.42, 0.55, 0.72)` 再归一 (`:401-403`)
  - 透视: `perspective <= 0.001` 正交; 否则 fov `(8 + perspective * 52)` 度, 深度 `max(halfW, halfH) * 4 + 4`, near 至少 `0.1` (`:185-192`). 格子像素尺度 `min(w, h) / (gridSize + 0.9)`, 立方体边长 uniform `1 - gap` (`:397`, `:583`)
- 指针/滚动: `window` `pointermove` 写 `client - rect`, 在容器内才刷新 `moved` (`:594-600`, `:628`). `documentElement` `pointerleave` 把 `inside` 置假 (`:603-605`, `:629`). `container` `pointerdown` 在点击点发涟漪, 不看松手 (`:608-611`). 没有 `pointerup` / `pointercancel`. 无滚动监听. 坐标经 `toWorld` 变成格子单位 (`:371`).
- 可中断: 倾角速度 `wx/wy` 每帧累加, 目标改了不清零; 涟漪也是往同一速度上加冲量. 新涟漪与旧的并行, 超过 6 条丢最旧, 不排队. 减弱动效时直接把角度写成目标并把速度清零 (`:512-516`).
- 性能: `step` 返回假就停 rAF (`:568`). `IntersectionObserver` 离屏不再画; `document.hidden` 时本帧直接 return (`:562`, `:620-626`). DPR 上限 `2` (`:580`). 监听器每实例一套, 不是共享. `projection()` 每帧 `new Float32Array` (`:187`, `:195`); 实例缓冲每帧 `DYNAMIC_DRAW` 整块上传 (`:394`).
- 减弱动效: 读一次 (`:327`). 命中后自动笔刷关闭 (`:436`), 切向扫动为 `0` (`:477`), 不发涟漪 (`:375`), 入场时钟初始就是 `99` (`:341`), 倾角无弹簧,速度恒 `0`.
- Props: `gridSize=10`, `gap=0.18`, `faceColor='#120F17'`, `edgeColor='#ffffff'`, `edgeWidth=1`, `edgeStyle='solid'`, `faceOpacity=1`, `shading=0.6`, `maxAngle=45`, `radius=3`, `speed=1`, `bounce=0.4`, `brush=1`, `perspective=0`, `autoAnimate=true`, `rippleOnClick=true`, `rippleColor='#ffffff'`, `rippleSpeed=1`, `intro=true`, `paused=false`, `dpr`, `className=''`
- 裁决: 借鉴. 不把 10×10 的 WebGL 立方阵引进组件库. 运动层可记阻尼比 `1 - 0.82 * bounce` (满弹跳仍剩 `0.18`, 不会停不住), 以及涟漪是往角速度加 `13 * strength`, 不是再开一条时间轴.

### Animations/CursorGrid

- 文件: `Animations/CursorGrid/CursorGrid.jsx` 596 行, `CursorGrid.css` 21 行. CSS 只定位容器,`pointer-events: none` 的画布和内容层. 无第二份实现.
- 看起来: 格子线常驻很淡. 指针扫过的格子在半径内亮起, 停 `holdTime` 再线性熄灭. 点击从落点扩出一圈高斯环. 聚光是指针周围的高斯, 跟着指针滞后. 入场从画面中心揭开, 并在中心放一圈弱脉冲.
- 技法: 手写 WebGL2 全屏三角形. 格子亮度在 CPU 上记目标值, 上升用一阶滞后, 下降直接跟线性衰减的目标, 没有角速度. 聚光在片元里算. 不是 three, 不是 GSAP.
- 常数:
  - 默认与钳制 (`CursorGrid.jsx:207-261`): `cellSize = 60` 下限 `8`, `radius = 140` 下限 `1`, `falloff = 'smooth'`, `highlight = 'area'`, `holdTime = 400` 毫秒下限 0, `fadeDuration = 800` 毫秒下限 `16`, `lineWidth = 1` 下限 `0.25`, `maxOpacity = 1`, `fillOpacity = 0.06`, `gridOpacity = 0.08`, `gridStyle = 'lines'`, `cellRadius = 0`, `cellGap = 0`, `spotlight = 0.6` 钳 `0..1`, `clickPulse = true`, `pulseSpeed = 600` 下限 `1` (像素/秒), `ambient = 0` 钳 `0..1`, `edgeFade = 0.2` 钳 `0..0.5`, `intro = true`, `lightMode = false` (墨色 `#18181b`, 否则 `#ffffff`)
  - 衰减曲线 (`:9-13`): `linear` 为 `t`; `smooth` 为 `t^2 (3-2t)`; `sharp` 为 `t^3`. 用在 `1 - dist / radius` 上 (`:362`). `highlight = 'cell'` 只把所在格写成 `1` (`:344-348`)
  - 上升 `1 - exp(-dt / 0.045)` (`:474`, `:482`); 目标高于当前才用它. 低于当前时亮度直接等于目标. 亮度 `< 0.002` 钉 0 (`:483`). 停住超过 `holdTime / 1000` 秒后, 目标每帧减 `dt / (fadeDuration/1000)` (`:472-479`)
  - 指针滞后 `1 - exp(-dt / 0.07)`, 出现 τ `0.25` 秒, 差 `< 0.002` 算停 (`:455-459`, `:475`). 帧 `dt` 钳 `0..1/20` 秒, 首帧 `1/60` (`:450`). 鼠标与指针差之和 `> 0.05` 且 `presence > 0.002` 继续跑 (`:487`)
  - 聚光 uniform: `uMouse` 是滞后坐标乘 DPR, `uRadius = radius * DPR`, `uSpotlight`, `uPresence` (`:436-439`). 片元 `exp(-|toMouse|^2 / max(uRadius^2, 1) * 1.6) * uSpotlight * uPresence` (`:89-90`). 格子线不透明度加上 `spot * 0.45`, 上限 `1` (`:108`)
  - 点击环: 半径 `(clock - t0) * pulseSpeed`, 前缘 `cellSize * 0.6`, 后缘 `cellSize * 1.4`, 包络 `strength * (1 - ringR / (对角线 + 后缘))^0.6`, 截面 `exp(-t^2)` (`:370-395`). 强度默认 `1`. 入场中心脉冲 `t0 = 0.15` 秒, 强度 `0.6` (`:557`)
  - 入场 `1.4` 秒 (`:6`, `:453`). 揭开缓动 `1 - (1 - introClock)^2.2` (`:441`). 片元窗口宽 `uCellSize * 2`, `uReveal >= 1` 时直接全开 (`:94-95`)
  - 环境光: 每秒期望 `ambient * 格数 * 0.04` 次, 每次亮度 `0.25 + rand * 0.45` (`:462-464`). `ambient > 0` 时 rAF 不停 (`:488`)
  - 纹理里的亮度再做一次 `v^2 (3-2v)` (`:51`). 线覆盖 `clamp(w*0.5 + 0.5 - d, 0, 1) * (width / max(width, 1))` (`:54-56`). 虚线周期 `cellSize / 6` (`:74`). 点半径 `max(lineWidth * 1.25, 1.2)` (`:78`). 十字臂 `cellSize * 0.1 + lineWidth` (`:83`). 边缘是五次平滑 `t^3 (t(6t-15)+10)`, 四边相乘 (`:98-104`)
- 指针/滚动: `window` `pointermove` / `pointerdown`, `documentElement` `pointerleave` (`:552-554`). 移出容器不更新坐标, 只把 `inside` 置假 (`:512-514`). 首次进入把滞后鼠标瞬移到指针 (`:518-520`). `pointerdown` 在内部且 `clickPulse` 时压入一圈 (`:526-530`). 没有 `pointerup` / `pointercancel`. 无滚动. 格子目标由距离曲线写成, 聚光才是 `uMouse`.
- 可中断: 格子没有速度. 新的照亮只抬高目标, 上升沿重走 `0.045` 秒滞后; 衰减中的目标被更高值盖掉. 脉冲并行, 不排队, 波前超出对角线加两倍后缘就删 (`:377-378`). 松手和取消都没监听.
- 性能: `active` 为假就停 rAF (`:491`). 离屏或 `document.hidden` 本帧 return (`:448`). DPR 上限 `2` (`:312`). 监听器每实例一套. 脏了才 `texSubImage2D` 上传 R8 (`:414-418`). `waves.fill(0)` 在脉冲之间整表清 (`:373`, `:468`).
- 减弱动效: 读一次 (`:289`). 命中后入场时钟从 `1` 起 (`:302`), 不播中心脉冲, 不发点击环 (`:529`, `:557`), 环境光不生成 (`:461`). 悬停照亮,`holdTime` 和线性熄灭仍在.
- Props: `cellSize=60`, `color`, `gridColor`, `radius=140`, `falloff='smooth'`, `highlight='area'`, `holdTime=400`, `fadeDuration=800`, `lineWidth=1`, `maxOpacity=1`, `fillOpacity=0.06`, `gridOpacity=0.08`, `gridStyle='lines'`, `cellRadius=0`, `cellGap=0`, `spotlight=0.6`, `clickPulse=true`, `pulseSpeed=600`, `ambient=0`, `edgeFade=0.2`, `intro=true`, `lightMode=false`, `dpr`, `children`, `className=''`, `style`
- 裁决: 借鉴. 不铺一整块 WebGL 格子背景. 悬停高亮若要做, 用这段时序: 上升 τ `0.045` 秒, 稳住 `400` 毫秒, 再按 `800` 毫秒线性降目标. 聚光系数 `1.6` 可以单独留. 不要把点击环和常驻网格绑在同一个控件上.

### Animations/DitherVeil

- 文件: `Animations/DitherVeil/DitherVeil.jsx` 808 行, `DitherVeil.css` 7 行. CSS 只给根 `overflow: hidden; touch-action: pan-y`. 无第二份实现. `floyd` / `atkinson` 走 CPU 误差扩散, `bayer` / `noise` / `lines` 走片元阈值, 是同一张遮罩.
- 看起来: 图片先被半色调量化成墨色和纸色. 指针拖过留下一条会褪的笔迹, 笔迹里露出原图, 可选一圈色边. 点击扩出一圈冲击波, 1.2 秒走完. 入场 1.1 秒从中心按 Bayer 次序点亮.
- 技法: OGL. 遮罩是半分辨率乒乓 RenderTarget, 每帧减去 `uFade`. 笔刷是一阶跟随, 没有速度. 误差扩散在 CPU. 不是 GSAP.
- 常数:
  - 默认 (`DitherVeil.jsx:371-390`): `pixelSize = 2`, `levels = 2` 运行时至少 `2` (`:703`), `palette = 'duotone'`, `inkColor = '#120f17'`, `paperColor = '#f4f1ea'`, `contrast = 1.15`, `brightness = 0`, `revealRadius = 200`, `softness = 0.6`, `linger = 1` 秒, `rimColor = '#a78bfa'`, `rim = 0` 钳到 `0..0.95` (`:707`), `reverse = false`, `wander = false`, `clickBurst = true`, `fit = 'contain'`, `pattern = 'floyd'`
  - 遮罩: `HOLD = 1.6` (`:32`). 半径 `revealRadius * (0.45 + 0.55 * presence)` (`:658`). 软边 `band = max(radius * softness, 1) * HOLD`, 笔迹 `clamp((radius - d) / band, 0, 1) * strength`, 再和 `上一帧 - uFade` 取最大 (`:238-241`). `linger > 0` 时 `uFade = dt / linger`, 否则 `1`; 无半精度时下限 `1.5/255` (`:653-661`). 遮罩分辨率是容器的 `0.5` (`:29`, `:535-536`)
  - 跟随: 出现 τ `0.16` 秒 (`:624`). 笔刷 `1 - exp(-dt / 0.035)`, 新进入时 `fresh` 把笔刷瞬移到目标 (`:626-633`). `dt` 钳 `0..0.05` 秒 (`:608`). 笔迹忙到 `now + linger*1000 + 150` 毫秒 (`:651`)
  - 冲击波最多 `4` 条, 寿命 `1.2` 秒 (`:30-31`, `:639`). 半径 `到达角点的距离 + uBurstWidth`, 进度 `sin(k * π / 2)`, 强度 `1 - k^3` (`:641-648`). `uBurstWidth = max(60, revealRadius * 0.9)` (`:502`, `:662`). 片元前缘除以 `uBurstWidth * 0.35`, 后缘除以 `uBurstWidth` (`:315`)
  - 入场 `1100` 毫秒, 缓动 `1 - (1-t)^2` (`:33`, `:711-712`). 点亮阈值 `spread * 0.72 + bayer(cell+(3,5)) * 0.28` (`:365-366`). 色边用 Bayer 低阈 `order * (1 - rim)` (`:359-362`)
  - 量化: 灰度 `0.2126, 0.7152, 0.0722`, 再 `pow(..., 1.6)` (`:174`, `:306`, `:596`). Bayer 8×8, `(m+0.5)/64` (`:279-283`). 线刻周期 `6` (`:291`). 蓝噪声 `64`, 核半径 `6`, 权重 `exp(-(dx^2+dy^2)/4.5)`, 种子 `7`, LCG `16807`, 初始占 `10%` (`:83-116`). Floyd 权重 `7/16, 3/16, 5/16, 1/16`; Atkinson 六向各 `1/8` (`:13-26`)
  - 徘徊: 频率 `0.53` 与 `1.31` (相位 `0.6`), 幅度 `0.33` 与 `0.08`; 纵向 `0.71` (相位 `1.1`) 幅度 `0.28`, `1.57` 幅度 `0.07` (`:48-51`). 接手用 `1.2` 秒收到 1, 再 `t^2(3-2t)` (`:615-617`)
  - 纯色底: 边缘 32×32 的标准差 `< 0.06` 才抠图, 片元 `smoothstep(0.05, 0.22, distance(raw, matte))` (`:53-76`, `:353`)
- 指针/滚动: 监听在容器上, 不是 window: `pointermove` / `pointerenter` / `pointerdown` / `pointerleave` / `pointercancel` (`:769-773`). 坐标 `client - rect` (`:745-749`). `pointerleave` 与 `pointercancel` 都进 `onLeave`, 只把 `inside` 置假 (`:759-761`). 没有 `pointerup`. `pointerdown` 先走 `onMove`, 鼠标非主键不发波 (`:763-767`). 无滚动. 鼠标不进一个衰减 uniform, 而是写成遮罩笔画的 `uFrom`/`uTo` 和 `uBursts`.
- 可中断: 笔刷没有速度, 目标一变就用 τ `0.035` 秒跟上; 只有 `fresh` 才瞬移. 冲击波并行, 超过 4 条丢掉最旧 (`:767`), 不排队. `pointercancel` 与离开同路, 不取消已经发出的波.
- 性能: `presence <= 0.002`,没有波,过了笔迹余晖,入场结束,指针不在内且不徘徊时停 rAF (`:715-717`). `IntersectionObserver` 离屏不再排下一帧 (`:780-783`). 不看 `document.hidden`. DPR 在创建 Renderer 时上限 `2`, 之后不改 (`:425`). 蓝噪声是模块级单例 (`:79`). 监听器每实例挂在自己的容器上. 误差扩散只在参数或尺寸变化时重算 (`:563`).
- 减弱动效: 读一次 (`:424`), 只关掉 `wander` (`:611`). 入场,点击波,笔迹褪去都照常. 不监听媒体查询变化.
- Props: `src` (默认一张 Unsplash 图), `fit='contain'`, `pattern='floyd'`, `pixelSize=2`, `levels=2`, `palette='duotone'`, `inkColor='#120f17'`, `paperColor='#f4f1ea'`, `contrast=1.15`, `brightness=0`, `revealRadius=200`, `softness=0.6`, `linger=1`, `rimColor='#a78bfa'`, `rim=0`, `reverse=false`, `wander=false`, `clickBurst=true`, `className=''`, `style`
- 裁决: 不做. 半色调揭图是装饰场, 默认图还是外链. 不引进 OGL 遮罩乒乓和 Floyd/Atkinson 扩散. 笔刷 τ `0.035` 秒,遮罩按 `linger` 秒线性减, 留在这份实现里.

### Animations/ElasticMesh

- 文件: `Animations/ElasticMesh/ElasticMesh.jsx` 1390 行, `ElasticMesh.css` 17 行. CSS 是 `overflow: hidden; touch-action: pan-y; user-select: none`, 画布 `absolute; inset: 0`. 无第二份实现. `balloon` / `chrome` / `jelly` / `clay` 只改片元光照, 积分相同.
- 看起来: 文字或图片被铺成一张可压的曲面. 悬停在字形上会凹下去并被笔刷速度带一下; 拖拽时抓住一块, 松手后靠弹簧回到静止形. 位移很小且很快的一次按下改成径向一戳. 入场时每个连通块从一半大小弹到全大, 从左到右错开.
- 技法: 手写 WebGL2. 节点是自写半隐式弹簧, 子步 `1/480` 秒. 入场是片元里的欠阻尼解析解, 不是 GSAP. 高度场用 Jacobi 迭代充气.
- 常数:
  - 默认与钳制 (`ElasticMesh.jsx:475-517`): `text = 'Squish'`, `src = ''`, `fontWeight = 900`, `color = '#3b5bff'`, `material = 'balloon'`, `inflate = 1` 钳 `0.1..3`, `stiffness = 0.5` 钳 `0..1`, `wobble = 0.6` 钳 `0..1`, `grabRadius = 70` 钳 `10..400`, `stretch = 0.5` 钳 `0..1`, `press = 0.5` 钳 `0..1`, `shadow = 0.5` 钳 `0..1`, `intro = true`, `theme = 'dark'`
  - 锚点 (`:969-973`): `firm = 0.4 + stiffness * 1.2`, `anchor = 350 * firm^2`. 默认 `stiffness = 0.5` 时 `firm = 1`, `anchor = 350`. 阻尼比减弱动效时 `0.8`, 否则 `0.5 - 0.42 * wobble` (默认 `0.248`). `damping = 2 * ratio * sqrt(anchor)`. 加速度 `-anchor * 位移 - damping * 速度` (`:990-991`)
  - 邻接: `couple = anchor * (52 / sqrt(firm) / spacing)^2`, 正交权重 `1`, 对角 `0.5` (`:971`, `:997-999`). 凹痕刚度 `anchor * 1.4`, 耦合 `(18 / spacing)^2`, 阻尼比再加 `0.06`, 凹痕钳 `-0.6..0.85` (`:974-976`, `:1023`)
  - 按压高斯 `pressRadius = grabRadius * 0.32`, `inv = 1 / (2 r^2)` (`:981-982`). 凹痕加 `dentAnchor * 2.6 * pressDepth * power * falloff`; 拖拽时 `pressDepth = 1.6`, 否则 `1` (`:984`, `:1006`). 切向 `anchor * 0.3 * 偏移 + brush * 悬停速度`; 拖拽时 `brush = 0`, 否则 `10` (`:979`, `:1007-1008`)
  - 抓取半径 `grabRadius * 0.3`, 权重 `> 0.03` 才抓住 (`:1046-1056`). 握点刚度 `anchor * 30`, 阻尼 `1.2 * sqrt` (比 `0.6`) (`:977-978`, `:1011-1012`). 拉伸上限 `max(20, min(w,h) * (0.08 + stretch * 0.32))`, 位移乘 `tanh(length / limit)` (`:1032-1036`)
  - 戳: 冲量 `9 * (0.4 + press) * falloff`, 同时加进凹痕速度和径向速度 (`:1073-1081`). 判定是位移 `< 8` px 且按下短于 `260` 毫秒 (`:1293-1296`)
  - 子步 `STEP = 1/480` 秒, 一帧最多 `40` 步, 超出把累加器清零 (`:236`, `:1236-1241`). 帧 `dt` 钳 `0.05` 秒, 首帧 `1/60` (`:1197`). 停稳: 能量 `> 0.05 * 活动节点数`, 悬停差 `> 0.1` px, 压力差 `> 0.002` (`:1247-1254`)
  - 悬停位置 τ `0.05` 秒, 速度估计 τ `0.04` 秒, `dt` 下限 `0.001` (`:1207-1212`). 压力 τ: 按下 `0.12`, 松开 `0.25` (`:1216`). 转向弹簧 `velocity += (28 * error - 10 * velocity) * dt`, 目标是指针偏离中心的 `0.7` (水平) 和 `0.4` (垂直) (`:1219-1224`)
  - 入场解析解: `omega = 15`, `zeta = 0.38`, `1 - exp(-zeta omega t) * (cos(ωd t) + zeta omega / ωd * sin(ωd t))` (`:38-41`, `:88-90`). 缩放从 `0.5` 到 `1` (`:105`). 错峰 `min(0.07, 0.5 / (块数-1))` 秒, 按左边缘排序, 最多 `64` 块 (`:909-911`, `:957`). 时钟超过 `1.8` 秒就钉到 `10`; 片元在 `uClock > 9` 时跳过入场 (`:51`, `:1201`)
  - 网格间距 `max(7, sqrt(面积 / 5200))`, 场边长上限 `720` (`:234-235`, `:667`, `:790`). 节点在 SDF `> -2.5 * spacing` 时活动 (`:693`, `:705`). 命中用 SDF `> -4`, 搜索 `ceil(80 / spacing)` (`:1089`, `:1104`). 坡度钳到 `7` (`:936-938`). Jacobi 最粗 `300` 次,其余 `60` 次, 松弛 `1.85`, 源项 `4^level`, 缩到边长 `≤ 48` 停止 (`:372`, `:421-435`). 模糊 `sigma = radius / 2.5` (`:446`)
  - 阴影偏移 `min(w,h) * 0.035 * inflate`, 水平再乘 `0.25`; 暗色强度 `shadow * 0.7`, 亮色 `shadow * 0.35` (`:1149-1154`). 菲涅尔 `pow(1-facing, 5)`, 光向 `(-0.5, 0.62, 0.62)` (`:195-197`)
- 指针/滚动: `pointerdown` 在容器上, 先 `setPointerCapture` (`:1285`, `:1321`). `pointermove` 在 `window`. `pointerup` 与 `pointercancel` 都进 `onPointerUp` (`:1322-1324`). 不在字形上的按下直接返回 (`:1278`). 松开时若移动 `< 8` 且时间 `< 260` ms, 先 `release` 再 `poke`; 否则只 `release`, 速度留下 (`:1293-1296`). `pointerleave` 只清 `inside`, 不放抓 (`:1301-1303`). 悬停且未按下,点仍在曲面上时, 压力目标仍是 `1` (`:1205-1206`). 无滚动.
- 可中断: 节点速度每步累加, 目标或抓取点改变都不清零. 松开只把 `grip` 填 `0` (`:1064-1066`). 没有第二条时间轴在排队. `pointerup` 与 `pointercancel` 同路; `onPointerUp` 在 `down` 为假时返回 (`:1290`).
- 性能: 能量,转向,压力都停稳后停 rAF, 并把 `last` 清零 (`:1255-1256`). 离屏或 `document.hidden` 本帧 return (`:1195`). DPR 上限 `2` (`:1111`). 监听器每实例一套. 拖拽开始时新建两块锚点数组 (`:1048-1049`). 动态顶点每步整块 `DYNAMIC_DRAW` (`:783`). 改尺寸除第一次外防抖 `160` 毫秒再栅格化 (`:1120`).
- 减弱动效: 读一次 (`:595`). 命中后阻尼比改 `0.8` (`:972`), 入场时钟钉在 `10` (`:1200`), 转向目标为 `0` (`:1219-1220`). 悬停凹痕,拖拽和戳仍在. 不监听后续变化.
- Props: `text='Squish'`, `src=''`, `fontFamily='system-ui, sans-serif'`, `fontWeight=900`, `color='#3b5bff'`, `imageColors=true`, `material='balloon'`, `inflate=1`, `stiffness=0.5`, `wobble=0.6`, `grabRadius=70`, `stretch=0.5`, `press=0.5`, `shadow=0.5`, `intro=true`, `theme='dark'`, `dpr`, `className=''`, `style`
- 裁决: 控件教材. 不搬充气字和片元里的工作室反射. 要写进控件合同的是: 位移 `< 8` px 且短于 `260` ms 算戳, 往速度加冲量; 更长的按下算拖, 松手只撤抓取,速度留下; `pointerup` 和 `pointercancel` 走同一条 `release`. 阻尼比用 `0.5 - 0.42 * wobble`, 拉伸用 `tanh(length / limit)`.

### Animations/ElectricBorder

- 文件: `Animations/ElectricBorder/ElectricBorder.jsx` 768 行, `ElectricBorder.css` 11 行. CSS 给根 `isolation: isolate`, 画布 `position: absolute; z-index: 1; pointer-events: none`. 画布再向左上扩 `64` px. 无第二份实现.
- 看起来: 圆角矩形边上有几条沿周长爬的电丝, 粗细和偏移由噪声决定. 指针靠近时电丝被加热变密. 点击沿周长放出一圈行波, 并额外甩出一段短弧. `active` 从关到开时电丝从两端向中点揭开.
- 技法: 手写 WebGL2 全屏三角形. 电丝在片元里沿周长采样值噪声. 悬停位置是自写二阶弹簧. 不是 three, 不是 GSAP.
- 常数:
  - 默认与钳制 (`ElectricBorder.jsx:388-435`): `color = '#7df9ff'`, 芯色是该色再往白混 `0.55` (`:418`); `speed = 1` 下限 0, `chaos = 0.5` 钳 `0..2`, `spread = 0.6` 钳 `0..2`, `thickness = 1.5` 下限 `0.25`, `strands = 3` 取整钳 `1..6`, `glow = 0.6` 钳 `0..3`, `intensity = 0.8` 下限 0, `arcs = 1` 下限 0, `flicker = 0.5` 钳 `0..1`, `borderRadius = 24` 下限 0, `offset = 0`, `active = true`, `intro = true`, `interactive = true`, `cursorRadius = 90` 下限 `1`, `theme = 'dark'`
  - 时间: 帧 `dt` 钳 `0..0.05` 秒 (`:581`). 减弱动效时时间步乘 `0.2`, 否则乘 `1` (`:583-584`). 功率 τ: 打开 `0.28` 秒, 关掉 `0.4` 秒 (`:588`). 揭开速度 `dt / 0.9`, 减弱动效时直接为 `1` (`:589`). 墨色 τ `0.25` 秒 (`:590`). 画进片元的功率是 `power^2 (3-2 power)` (`:556`)
  - 悬停弹簧: `power < 0.01` 时瞬移并清速度 (`:593-597`); 否则 `v += ((pointer - hover) * 120 - v * 19) * dt` (`:599-602`). 热力 τ: 靠近 `0.3`, 离开 `0.55` (`:603`)
  - 鼠标 uniform: `uHover = (x+64, y+64, heatPower)`, `uHoverRadius = cursorRadius` (`:558-559`). 片元 `heat = power * exp(-|p-hover|^2 / radius^2)`, 再 `min(heat*0.7 + surge*0.8 + flare*0.6, 1.2)` (`:171`, `:181`)
  - 周长行波最多 `3` 条, 超过丢掉最旧, 寿命 `2200` 毫秒 (`:7`, `:635`, `:688`). 波速 `560` px/秒, 截面 `exp(-((gap - age*560) / 46)^2) * exp(-age * 1.2)` (`:10`, `:178-179`)
  - 短弧最多 `4` 条. 跨度 `min(周长*0.3, 60 + rand*90)`, 弓高 `min(34, length*(0.14+rand*0.16)+5)`, 寿命 `0.35 + rand*0.45` 秒, 强度 `sin(π k) * fit` (`:6`, `:503-523`, `:630`). 噪声三阶, 时间系数 `1.4 + o*1.1`, 波长和权重各乘 `0.42` 与 `0.4` (`:135-140`)
  - 电丝噪声时间: 弯 `0.7`, 涟 `1.9`, 皱 `4.6`, 附加 `6.8` (`:211-214`). 周长分箱 `perimeter/75, /25, /9, /4` (`:545-548`). 闪烁 `1 - flicker*0.3*(0.5+0.5*wobble(t*13))`, 呼吸 `1 + flicker*0.5*wobble(t*4.6+7)` (`:227`, `:243`)
  - 振幅: 弯 `spread*16*(1+heat*0.35)`, 涟 `spread*6*(1+heat*0.3)`, 皱 `chaos*4.5*(1+heat*0.3)`, 再被 `34 / (...)` 钳住 (`:191-197`). 热芯 `exp(-across^2 / (w^2 * 0.16))` (`:234`). 向内衰减 `exp(d/14)`, 晕 `exp(-edge/3)*0.1 + exp(-edge/16)*0.05` (`:186-187`)
  - 揭开: 前沿 `reveal * (周长*0.5 + 80)`, 窗口 `70` px, 闪光 `exp(-((along-front+30)/26)^2)` (`:166-168`). 画布边距 `64`, 像素预算 `3e6` (`:8-9`)
- 指针/滚动: `window` 上 `pointermove` / `pointerdown` (`:698-699`). 靠近范围是容器外再扩 `32` px (`MARGIN/2`, `:670-674`). `documentElement` `pointerleave` 把 `over` 和 `near` 都清掉, 不清速度 (`:693-696`). `pointerdown` 仅在容器内,`interactive`,`active`,且未减弱动效时, 沿周长压入一条脉冲并生成一段弧 (`:682-689`). 没有 `pointerup` / `pointercancel`. 无滚动.
- 可中断: 悬停速度一直累加, 只有热力低于 `0.01` 才清零. 脉冲和短弧并行, 满了丢最旧, 不排队. `active` 从假变真时把 `reveal` 打回 `0` 重揭 (`:586`). 没有松手路径.
- 性能: `active` 为真时 rAF 不停 (`:651-652`). 关掉后要等功率降到 `0.002` 且短弧清空. 离屏或 `document.hidden` 不再排帧 (`:652`, `:724-726`). DPR 取 `min(设备比, 2, sqrt(3e6 / 像素))` (`:489`). 监听器每实例一套 window. 上下文丢失时停帧, 恢复会加 `generation` 重建 (`:702-708`).
- 减弱动效: 读一次 (`:460`). 时间步乘 `0.2`, `uFlicker` 写成 `0` (`:569`), 揭开直接为 `1`, 不随机生弧, `pointerdown` 不发脉冲 (`:589`, `:608`, `:685`). 悬停弹簧和功率淡入仍在.
- Props: `children`, `color='#7df9ff'`, `glowColor`, `speed=1`, `chaos=0.5`, `spread=0.6`, `thickness=1.5`, `strands=3`, `glow=0.6`, `intensity=0.8`, `arcs=1`, `flicker=0.5`, `borderRadius=24`, `offset=0`, `active=true`, `intro=true`, `interactive=true`, `cursorRadius=90`, `theme='dark'`, `className=''`, `style`
- 裁决: 不做. 这是包在内容外面的装饰电边, `active` 默认开着就每帧画全画布. 不把周长噪声引进组件库. 悬停那组 `120` 和 `19` 与 CrystalizedBall 的角弹簧是同一对系数, 不另做一份.

### Animations/ElectricLogo

- 文件: `Animations/ElectricLogo/ElectricLogo.jsx` 1008 行, `ElectricLogo.css` 6 行. CSS 只给根 `position: relative; width/height: 100%; overflow: hidden`. 无第二份实现. 默认 `src` 是内嵌的闪电 SVG.
- 看起来: 字形边缘上爬电丝, 电丝用域扭曲挪开再按 SDF 重采样. 换图时旧形和新形用噪声前沿交叉溶解, 约 1.6 秒. 点击从落点扩出径向波, 并在轮廓上甩最多 3 段弧. 入场 1.4 秒从几乎贴边长到全振幅.
- 技法: OGL. 轮廓是 CPU 上的有符号距离场, 电丝在片元里. 悬停是自写二阶弹簧. 不是 GSAP.
- 常数:
  - 默认 (`ElectricLogo.jsx:580-597`): `color = '#ecc7ff'`, `glowColor = '#ad6dff'`, `scale = 0.7`, `intensity = 1`, `glow = 1`, `thickness = 1.5`, `strands = 4` 运行时取整钳 `1..6` (`:939`), `bend = 0.6`, `crackle = 1.5`, `arcs = 1`, `flicker = 0.6`, `fill = 0`, `speed = 2.5`, `interactive = true`, `cursorIntensity = 0.75`, `cursorRadius = 100` 下限 `1` (`:925`), `theme = 'dark'`
  - 栅格: 长边栅到 `560` (`:11`, `:139`), 距离场单元 `4` px (`:12`). 轮廓点超过约 `3000` 对就隔点取样 (`:210`). 紧晕半径 `max(1, round(size*0.035/4))`, 宽晕 `max(2, round(size*0.13/4))` (`:227-228`). 单位长度 `max(logoW, logoH) * fit / 100` (`:787`)
  - 入场 `progress += dt / 1.4`, 振幅 `progress^2 (3-2 progress)` (`:820-821`). 换形 `morph += dt / 1.6`, 若下一张已在等则改 `dt / 0.3` (`:816`). 片元前沿 `clamp(morph*1.7 - 0.35 + 0.35 * wobble(p/unit*0.018), 0, 1)` 再 smoothstep, 过渡闪光 `sin(π morph)` (`:509-510`)
  - 悬停弹簧与电边相同的一对系数: `power < 0.01` 瞬移清速度, 否则 `v += ((pointer-hover)*120 - v*19)*dt` (`:830-839`). 热力 τ 靠近 `0.3`,离开 `0.55` (`:840`). `uHover` 的 z 是 `power * cursorIntensity` (`:924`). 片元热力 `min(power * exp(-|d|^2/radius^2) + surge*1.4 + transit*0.5, 2)` (`:514`)
  - 域扭曲频率 (`:441-447`): `q*0.028` 时间 `(0.29, 0.21)`; `q*0.085` 时间 `(0.83, -0.61)` 再加前一层 `0.4`; `p/9` 时间 `(1.9, 1.3)`; `p/4.1` 时间 `(-2.7, 2.2)`. 弯幅 `bend*8`, 涟幅 `bend*3.2`, 皱幅 `crackle*1.5`, 都乘 `reachScale`. `reachScale` 从 `0.15` 到 `1`, 再乘 `1+heat*0.9` (`:527`)
  - 径向脉冲最多 `3` 条, 寿命 `2` 秒 (`:15`, `:891`, `:969`). 波前 `(dist - age * unit * 150) / (unit * 10)`, 包络 `exp(-front^2) * exp(-age*1.7) * smoothstep(0, unit*8, dist)`, 位移 `cos(front*2.2) * unit * 7.5` (`:421-430`). 闪光 `exp(-age*7)` (`:906`). 颜色趋近 τ `0.35` 秒, 第一帧直接跳到目标 (`:929`)
  - 弧: 弦长必须落在字形尺寸的 `0.08..0.3`, 弓高 `len*(0.2+rand*0.3)`, 朝 SDF 更大的一侧, 寿命 `0.35+rand*0.45` 秒, 找点最多 `40` 次,找对最多 `24` 次 (`:262-295`). 同时最多 `5` 条 (`:14`). 点击一次最多补 `3` 条 (`:854`). 随机出现要 `presence > 0.8` 且形变结束, 靠近概率 `dt*speed*arcs*6*power*cursorIntensity`, 否则 `*2.2` (`:860-867`)
  - 电丝时间按股乘 `1 + fi*0.19` (`:543`). 呼吸 `1 + flicker*0.6*wobble(t*2.1)`, 火花闪 `t*6` (`:516`, `:551`). 可见度噪声 `q*0.035` 时间 `0.21`, 阈值 `smoothstep(-0.25, 0.2)` (`:550`). 热芯仍是 `exp(-d^2/(w^2*0.16))` (`:559`)
  - 帧 `dt` 钳 `0..0.05` 秒 (`:802`). 墨色 τ `0.25` 秒 (`:943`)
- 指针/滚动: 监听在容器上: `pointermove` / `pointerdown` / `pointerleave` / `pointercancel` (`:975-978`). 移动把 `over` 设真并写下坐标 (`:959-963`). `pointerleave` 与 `pointercancel` 都只把 `over` 置假 (`:972-973`). 没有 `pointerup`. 按下在 `interactive` 且未减弱动效时压入脉冲并把 `burst` 设成落点 (`:965-970`). 无滚动.
- 可中断: 悬停速度保留, 只有热力 `< 0.01` 才清. 换形开始时清空短弧数组 (`:811`). 脉冲并行, 超过 3 条丢最旧. `pointercancel` 不取消已发出的波.
- 性能: 只要还在视口里就继续 `requestAnimationFrame`, 不看有没有在动 (`:950`). 离屏才停 (`:982-985`). 不看 `document.hidden`. DPR 取 `min(设备比, 2, sqrt(4e6 / 像素))` (`:16`, `:794`). 监听器每实例挂在自己的容器上.
- 减弱动效: 读一次 (`:746`). 时间步乘 `0.2` (`:842`), `uFlicker` 写成 `0` (`:942`), 不随机生弧, `pointerdown` 直接返回 (`:860`, `:967`). 形变,入场和悬停弹簧仍走.
- Props: `src` (默认内嵌闪电), `color='#ecc7ff'`, `glowColor='#ad6dff'`, `scale=0.7`, `intensity=1`, `glow=1`, `thickness=1.5`, `strands=4`, `bend=0.6`, `crackle=1.5`, `arcs=1`, `flicker=0.6`, `fill=0`, `speed=2.5`, `interactive=true`, `cursorIntensity=0.75`, `cursorRadius=100`, `theme='dark'`, `onRender`, `className=''`, `style`
- 裁决: 不做. 这是 ElectricBorder 贴到字形 SDF 上的另一份装饰, 悬停仍是 `120` / `19`. 不把 OGL 标志电光和 `560` 边长的距离场引进组件库. 形变 `1.6` 秒,径向波速 `unit * 150` 留在这里.

### Animations/FadeContent

- 文件: `Animations/FadeContent/FadeContent.jsx` 378 行. 目录只有这一份. 没有位移, 和 AnimatedContent 的滑入不是同一条时间轴.
- 看起来: 内容从 `initialOpacity` 收到全显. `focus` 同时从 `blur(12+blur)`,`scale 0.97` 收到清晰和 `1`. `develop` 从灰度,对比 `0.55`,亮度 `1.3` 收到正常. `dissolve` / `mist` / `pixel` 用 SVG 噪声遮罩按一张 33 级曲线吃掉. 可选滚出后再倒放, 或停一会儿再藏回去.
- 技法: DOM, GSAP timeline + ScrollTrigger. 噪声遮罩是 SVG `feTurbulence` 加 `feFuncA` 表, 不是 canvas. 积分是 GSAP 的.
- 常数:
  - 默认 (`FadeContent.jsx:156-171`): `effect = 'fade'`, `blur = false`, `duration = 1`, `ease = 'power2.out'`, `delay = 0`, `threshold = 0.1`, `initialOpacity = 0`, `stagger = 0`, `staggerFrom = 'start'`, `trigger = 'scroll'`, `once = true`, `exit = false`, `scrub = false`, `disappearAfter = 0`, `disappearDuration = 0.5`, `disappearEase = 'power2.in'`
  - 数字 `> 10` 当成毫秒除以 `1000`, 否则当秒 (`:19`). 时长下限 `0.01` 秒 (`:203`, `:267`). `blur === true` 时模糊 `10` px, 否则取不小于 `0` 的数字 (`:204`)
  - `focus`: 透明度时段占 `0.6`, 模糊和缩放占 `1`, 两条从同一位置叠上. 起点 `blur(12+blur)`,`scale 0.97` (`:129-132`). `develop`: 透明度占 `0.5`; 滤镜 `grayscale(1) contrast(0.55) brightness(1.3)` 加模糊, 收到 `contrast(1) brightness(1)` (`:135-142`)
  - 噪声 logistic: `33` 级, `1 / (1 + exp(-10.8 * (i/32 - 0.5)))` (`:15`). 前沿 `progress * (1 + 2*edge) - edge`, 每级再 smoothstep 半宽 `edge` (`:104-107`)
  - `mist`: 频率钳在 `4/size` 的 `0.004..0.02`, `octaves = 3`, `edge = 0.35`, 自带模糊 `10` (`:29-30`). `pixel`: 块 `2 * round(clamp(size/32, 6, 24) / 2)`, 频率 `0.5/block`, `edge = 0.06` (`:32-34`). `dissolve`: 频率 `0.6`, `octaves = 1`, `edge = 0.15` (`:36`). 滤镜区 `-10%` / `120%`, alpha 矩阵 `1.43` 和 `-0.21` (`:53`, `:84`). 种子 `floor(rand*1000)` (`:62`)
  - scrub 区高 `height * clamp((1 - 2*threshold)*0.4, 0.05, 0.4)` (`:302`). 默认 `threshold = 0.1` 时系数是 `0.32`. 进度四舍五入到 `0.001` (`:310`). `scrub === true` 时平滑时长 `0`, 直接写 `tl.progress`; 数字则 `gsap.to` 用 `power3.out` 且 `overwrite: true` (`:299`, `:312`)
  - 非 scrub 的起点是 `top - height*(1-threshold)`, 超过可滚极限时改成 `limit - 1` (`:334-335`). `exit` 的终点是 `bottom ${threshold*100}%` (`:337`)
- 指针/滚动: 无指针. `trigger = 'mount'` 直接 `tl.play()` (`:278-280`). 否则 ScrollTrigger. scrub 从 `top bottom` 到 `bottom top` 每帧重算进度 (`:317-324`). 非 scrub: `onEnter` 播放; `exit` 时 `onLeave` 倒放,`onEnterBack` 再播; `once = false` 时 `onLeaveBack` 倒放 (`:339-342`). scroller 默认 `container` 或 `#snap-main-container` (`:187`).
- 可中断: timeline 以 `paused: true` 创建 (`:256`). `reverse` 保留进度. scrub 的数字平滑用 `overwrite: true`, 新滚动替换上一次 `gsap.to`, 不排队. 离场是 `onComplete` 之后另起一条 timeline, `delay` 为 `disappearAfter` (`:262-270`), 不接在入场末尾的同一条上. 改 props 会 `ctx.revert()` (`:348`). 无 pointerup / pointercancel.
- 性能: 不自管 rAF. 噪声遮罩每个目标往 `document.body` 插一个 SVG (`:48`). 播放中 `onUpdate` 重写 `tableValues` 和 `filter` (`:105-111`). 进度到 `1` 就清掉 filter (`:99-102`). 无 DPR. 每实例一个 ScrollTrigger.
- 减弱动效: 读一次 (`:190`). 命中后只调 `onComplete`, 不建时间轴 (`:198-200`). 在这之前已经把根设成 `visibility: visible` (`:196`). 首帧样式是 `visibility: hidden` (`:372`). 不监听媒体查询变化.
- Props: `children`, `container`, `effect='fade'`, `blur=false`, `duration=1`, `ease='power2.out'`, `delay=0`, `threshold=0.1`, `initialOpacity=0`, `stagger=0`, `staggerFrom='start'`, `trigger='scroll'`, `once=true`, `exit=false`, `scrub=false`, `disappearAfter=0`, `disappearDuration=0.5`, `disappearEase='power2.in'`, `onStart`, `onComplete`, `onDisappearanceComplete`, `className=''`, `style`
- 裁决: 借鉴. 不要再加一条 `power2.out`,1 秒的透明度入场; HX 已有 fade, 模糊是 8px,缩放从 0.96. 可记的是 focus 把 `blur(12px)` 和 `scale 0.97` 叠在透明度上, 以及噪声表的 logistic 陡度 `10.8`,33 级. `duration > 10` 就改当毫秒, 这个换算不要抄.

### Animations/GhostCursor

- 文件: `Animations/GhostCursor/GhostCursor.jsx` 874 行, `GhostCursor.css` 14 行. CSS 把根做成 `absolute; inset: 0; pointer-events: none`, 画布铺满. 无第二份实现. 没有 `EXT_color_buffer_float` 就直接不画 (`GhostCursor.jsx:454`).
- 看起来: 一团烟跟着指针, 拖尾在模拟网格里平流, 再用噪声揉成丝. 指针停一段时间后烟线性淡出, 离开容器后按惯性滑一段再自己停. 点击在落点喷一圈径向速度. 入场先等 280 毫秒, 再沿一条弧从左下走到中上, 1.9 秒.
- 技法: 手写 WebGL2. 密度和速度在半精度乒乓纹理里平流. 光标位置是自写半隐式弹簧, 离开后改成每帧乘衰减, 不拉回目标. 不是 GSAP, 不是 three.
- 常数:
  - 默认与钳制 (`:372-426`): `color = '#B497CF'` 先做 `pow(通道, 2.2)` (`:407`); `brightness = 1` 下限 0, `size = 80` 下限 `8`, `trailLength = 50` 钳 `1..200`, `inertia = 0.5` 钳 `0..0.99`, `turbulence = 0.5` 钳 `0..2`, `drift = 0.3`, `detail = 1` 钳 `0..1`, `grainIntensity = 0.05` 钳 `0..1`, `bloomStrength = 0.6` 下限 0, `bloomRadius = 1` 钳 `0..3`, `bloomThreshold = 0.025` 下限 0, `edgeIntensity = 0` 钳 `0..1`, `clickPuff = true`, `intro = true`, `zIndex = 10`, `maxDevicePixelRatio = 2` 钳 `0.25..3`. 淡出延迟默认触摸 `500` 毫秒,否则 `1000`; 淡出时长触摸 `1000`,否则 `1500`, 下限 `1` (`:423-424`)
  - 跟随弹簧 (`:712-720`): `stiffness = 520 * (1-inertia)^2 + 26`, `damping = 2 * sqrt(stiffness) * 0.92`. 默认 `inertia = 0.5` 时刚度 `156`, 阻尼比 `0.92`. 子步 `ceil(dt / (1/240))`. 离开后不再追指针, `glide = inertia^(dt*60)`, 速度乘 `glide` 再 `x += v*dt` (`:723-727`)
  - 帧 `dt` 钳 `0..0.05` 秒 (`:675`). 出现 τ `0.12` 秒, 消失 τ `0.08` 秒, 差 `< 0.002` 钉死 (`:705-706`). 空闲超过 `fadeDelay` 后目标从 `1` 线性降到 `0`, 除数是 `fadeDuration` (`:704`)
  - 密度寿命 `exp(-dt / (0.12 + trail * 0.022))` (`:582`). 默认 `trail = 50` 时 τ = `1.22` 秒. 场速度再乘 `exp(-dt * 2.4)` (`:590`). 密度钳 `0..6` (`:109`)
  - 拖尾: 模拟半径 `size * simScale * 0.3` (`:581`). 线段长 `> 0.25` 才盖章, 截面高斯, 纵向用 `erf`, 系数 `1.4142136 * sigma` (`:88-94`). `erf` 近似 `sign(x) * sqrt(1 - exp(-x^2 * (1.2732395 + 0.147 x^2) / (1 + 0.147 x^2)))` (`:62-64`). 注入量拖尾 `0.42 * presence`, 头部 `0.22 * presence * dt` (`:597-598`). 速度朝指针速度混合, 指针速度先乘 `0.5`, 混合量 `clamp(trail*0.65, 0, 1)` (`:99`, `:599`)
  - 旋度: 频率 `1 / max(1, size*simScale*2.2)` (`:593`). 第一层时间 `(0.11, -0.07)`, 第二层频率 `*2.03`, 时间 `(-0.13, 0.09)`, 偏移 `17.3`, 梯度权重 `0.5` (`:67-69`). 湍流幅度 `turbulence * 70 * simScale` (`:592`). 上漂 `drift * 110` (`:591`, `:730`)
  - 喷团每帧最多取一发 (`:600`). 半径 `sigma * 1.4`, 密度 `0.9`, 径向速度再乘 `uPuff.z * 2.2` (`:102-106`, `:602`)
  - 着色: 头部高斯 `size * 0.38`, 量 `0.8 * presence` (`:618-619`). 噪声尺度 `2.4 / max(20, size*2.6)` (`:623`). fbm 4 层振幅 `*0.5`, 旋转矩阵 `(0.8776, 0.4794)`; 5 层振幅 `*0.52` (`:144-159`). 丝 `pow(smoothstep(0.18, 0.82, smoke), 2) * 2.8`, 云 `smoothstep(0, 0.32) * 1.15` (`:201-203`). 密度 `< 0.002` 丢弃 (`:188`). 光向 `(-0.35, 0.55, 0.75)`, 底光 `0.7`, 高光 `0.5` (`:210`). 核 `smoothstep(0.7, 2.2)` (`:211`)
  - bloom 权重 `1`, `0.6+0.4*radius`, `0.25+0.75*min(1, radius^2*0.5)` (`:661`). 模糊核 `0.181862`, 偏移 `1.423135` 权重 `0.284316`, `3.326702` 权重 `0.106598`, `5.242989` 权重 `0.018156` (`:244-247`). 颗粒时间 `7.13`, 位移 `91.7` (`:298`)
  - 入场延迟 `280` 毫秒, 时长 `1900` 毫秒 (`:313`, `:683`). 缓动 `t^2(3-2t)`. 路径 `x = w*(0.16+0.44 e+0.05 sin(e π))`, `y = h*(0.7-0.24 e-0.1 sin(e π*2))` (`:686-688`)
  - 模拟分辨率 `min(0.35, 220 / max(w,h))`, 至少 `16` (`:568-570`). 着色预算触摸 `3e5` 像素,否则 `6e5`, 下限 `5e4` (`:426`, `:556`)
- 指针/滚动: `window` `pointermove` / `pointerdown` (`:806-807`). 坐标 `client - rect` (`:758-761`). 移出时若离上次移动还不到 `fadeDelay`, 把 `moved` 刷新成现在, 推迟淡出 (`:799-802`). `documentElement` `pointerleave` 走同一条 `onLeave`. 没有 `pointerup` / `pointercancel`. 按下且 `clickPuff` 时把喷团推进队列 (`:793-795`). 无滚动. 力不直接写 uniform: 弹簧先更新 `ghost`, 再把 `uFrom`/`uTo`/`uVelocity` 交给平流.
- 可中断: 指针在内时速度每子步累加, 目标改了不清零. 重新进入且 `presence < 0.05`, 或第一次进入, 才把速度清零并瞬移 (`:772-780`). 喷团是队列, 每帧 `shift` 一发, 多击会留到后面的帧. 没有松手路径.
- 性能: `intro`,可见目标,`presence > 0.001`,喷团都没有时停 rAF, 并清掉两张模拟纹理和画布 (`:735-746`). 离屏或页面隐藏不再排帧 (`:748`, `:832-834`). DPR 上限是 `maxDevicePixelRatio` (默认 `2`). 监听器每实例一套 window. 模拟网格大约是视口的四分之一以下.
- 减弱动效: 读一次 (`:444`). 只关掉入场 (`:538`). 弹簧,平流,湍流,点击喷团仍在. 不监听后续变化.
- Props: `color='#B497CF'`, `brightness=1`, `size=80`, `trailLength=50`, `inertia=0.5`, `turbulence=0.5`, `drift=0.3`, `detail=1`, `grainIntensity=0.05`, `bloomStrength=0.6`, `bloomRadius=1`, `bloomThreshold=0.025`, `edgeIntensity=0`, `clickPuff=true`, `intro=true`, `theme='dark'`, `mixBlendMode`, `fadeDelayMs`, `fadeDurationMs`, `maxDevicePixelRatio=2`, `targetPixels`, `zIndex=10`, `className=''`, `style`
- 裁决: 不做. 这是铺在父级上的烟雾光标, 还要浮点颜色缓冲和三层 bloom. 不引进. 离开后的滑行 `inertia^(dt*60)` 和密度寿命 `0.12 + trailLength*0.022` 秒留在这份流体里.

### Animations/GlareHover

- 文件: `Animations/GlareHover/GlareHover.jsx` 290 行, `GlareHover.css` 48 行. CSS 把根做成 `inline-grid; overflow: hidden; isolation: isolate`, 边框 `1px solid`, 光带 `will-change: transform`, 描边用 `1px` padding 的 mask 挖空. 没有 CSS transition. 无第二份实现.
- 看起来: 一条斜光带从控件一侧扫到另一侧. `hover` 进入时从指针所在的对侧扫入, 离开时按离开侧的方向扫出. `follow` 时光带跟着指针在投影轴上滑动, 透明度单独淡入淡出. `click` 在按下时扫一次. `loop` 按间隔重复. 键盘 `:focus-visible` 也扫一次, `follow` 除外.
- 技法: DOM. 扫动是时间进度乘余弦缓动, 没有速度. `follow` 才是自写半隐式弹簧. 不是 GSAP.
- 常数:
  - 默认 (`GlareHover.jsx:34-52`): `glareColor = '#ffffff'`, `glareOpacity = 0.5`, `glareAngle = -45` 度, `glareSize = 30`, `softness = 0.6`, `variant = 'streak'`, `blendMode = 'screen'`, `rimGlint = true`, `mode = 'hover'`, `transitionDuration = 650` 毫秒, `interval = 3` 秒, `playOnce = false`, `intro = false`, `borderRadius = '10px'`
  - 带宽 `max(8, 对角线 * glareSize / 100)` px, 高是对角线再加带宽 (`:94`, `:100`). 行程 `(|w*ux| + |h*uy|) / 2 + 带宽/2 + 2`, `ux = sin(angle)`, `uy = -cos(angle)` (`:91-95`)
  - 扫动缓动 `(1 - cos(π t)) / 2` (`:31`). 时长 `max(120, transitionDuration * share)` 毫秒, `share` 是剩余距离除以全程 `2 * reach` (`:146-151`). 新的扫动从当前 `pos` 起, 直接换掉上一段 (`:144`)
  - `follow` 弹簧: `velocity += (170 * (target - pos) - 24 * velocity) * h`, 子步 `ceil(dt / (1/120))` (`:117-121`). `2 * sqrt(170) ≈ 26.1`, 所以阻尼比约 `0.92`. 目标钳在 `±reach` (`:164`). 停稳: 位置差或速度 `> 0.05`, 透明度差 `> 0.002` (`:126-128`)
  - 透明度 τ: 变亮 `0.18` 秒, 变暗 `0.4` 秒 (`:123`). `follow` 初次且 `presence < 0.02` 时位置瞬移,速度清零 (`:171-173`)
  - 帧 `dt` 钳到 `0.05` 秒 (`:107`). 循环间隔 `max(0.5, interval)` 秒 (`:208`), 只在相交且页面可见时真的扫 (`:205`)
  - 梯度 33 档, 透明度四舍五入到 `0.1%` (`:23-25`). `smootherstep` 是 `t^3 (t(6t-15)+10)` (`:7`). `streak` 主瓣半宽 `0.06 + 0.16*softness`, 再加 `0.32` 倍的半宽 `0.5` 底 (`:15`). `twin` 中心在 `0.36` 和 `0.7`, 权重 `1` 和 `0.85`, 半宽 `0.08+0.18*softness` 与 `0.03+0.06*softness` (`:16-17`). `sheen` 半宽 `0.25+0.25*softness`, 权重 `0.55`, 底 `0.3` (`:18`). 描边梯度不透明度 `min(1, glareOpacity * 1.8)` (`:259`)
  - 入场观察阈值 `0.4`, 只扫一次 (`:224-229`)
- 指针/滚动: 根上 `pointerenter` / `pointermove` / `pointerleave` / `pointerdown` / `focusin` (`:212-216`). 投影 `dx*ux + dy*uy`, 原点是元素中心 (`:156-160`). `hover` 进入时符号取反再扫 (`:169`), 离开时不取反, 除非 `playOnce` (`:185`). `click` 只在 `pointerdown` 扫 (`:192-193`). `follow` 的移动只改弹簧目标. 没有 `pointerup` / `pointercancel`. 无滚动监听. `IntersectionObserver` 只负责循环和入场.
- 可中断: 扫动没有速度, 中途再进入会从当前像素重算剩余时长, 不排队. `follow` 的速度保留, 只有 `presence < 0.02` 才清. `pointerdown` 在 `hover` 模式不另起扫动.
- 性能: 扫完或弹簧停稳就不再 `requestAnimationFrame` (`:132`). 循环用 `setTimeout`, 离屏或 `document.hidden` 时这次不扫, 但计时器照样排下一次 (`:202-209`). 无 DPR. 监听器在该实例根上. 光带一直标着 `will-change: transform` (`GlareHover.css:30`).
- 减弱动效: 读一次 (`:71`). `sweep` 直接返回 (`:142`), 循环不排期 (`:202`), `follow` 的透明度目标写成 `0` (`:175`). 不监听后续变化.
- Props: `width='auto'`, `height='auto'`, `background='transparent'`, `borderRadius='10px'`, `borderColor='transparent'`, `children`, `glareColor='#ffffff'`, `glareOpacity=0.5`, `glareAngle=-45`, `glareSize=30`, `softness=0.6`, `variant='streak'`, `blendMode='screen'`, `rimGlint=true`, `mode='hover'`, `transitionDuration=650`, `interval=3`, `playOnce=false`, `intro=false`, `className=''`, `style={}`
- 裁决: 借鉴. 卡片反光不要做成常驻装饰. 若要一条扫光, 用剩余路程比例缩时长 `max(120ms, 650ms * share)`, 缓动用 `(1-cos(πt))/2`; 跟手才用刚度 `170`,阻尼 `24`. 进入从指针对侧起扫, 离开才顺着离开的一侧, 这个方向不要写成 CSS `hover` 来回同一条.

### Animations/GlowCursor

- 文件: `Animations/GlowCursor/GlowCursor.jsx` 943 行, `GlowCursor.css` 23 行. CSS 根是 `relative; overflow: hidden`, 画布 `absolute; inset: 0; pointer-events: none`, 内容层 `z-index: 1`. 无第二份实现. 这是投影掉散度的染料流体, 不是 GhostCursor 那种旋度烟.
- 看起来: 指针走过留下一条会自己铺开的光带, 热的部分先灭, 气晕留得更久. 停下并安静约 `linger` 秒后再清场. 点击喷 6 股, 速度方向比半径方向多转 `0.6` 弧度. 离开容器后不再注墨, 已有的速度自己衰减.
- 技法: 手写 WebGL2. 速度用 20 次 Jacobi 压力投影, 染料用 MacCormack. 跟随是临界阻尼谐振子, `followSpeed >= 1` 时直接粘住指针. 不是 GSAP.
- 常数:
  - 默认与钳制 (`GlowCursor.jsx:301-338`): `color = '#5f8bff'`, 解析失败落回 `(0.37, 0.55, 1)` (`:443`); 未给 `secondaryColor` 时色相 `+8` 度, 饱和度 `min(1, s*1.1+0.05)` (`:447-448`). `intensity = 1.3` 下限 0, `trailWidth = 3` 钳 `0.5..40`, `linger = 1.4` 钳 `0.1..10`, `glow = 1.2` 下限 0, `hotspot = 0.8` 下限 0, `followSpeed = 0.6` 钳 `0..1`, `grain = 0` 下限 0, `clickBurst = true`, `quality = 'high'`, `theme = 'dark'`, `maxDevicePixelRatio = 2`, `enabled = true`
  - 质量 (`:255-263`): `low` 速度 `96` / 染料 `384`, `medium` `128` / `576`, `high` `160` / `768`. 压力迭代 `20`. `FLOW = 0.75`. bloom `5` 层
  - 跟随 (`:620-631`): `omega = 10 + followSpeed * 50`. 默认 `0.6` 时 `ω = 40`. `v += (ω^2 * 误差 - 2 ω v) * h`, 阻尼比是 `1`. 子步 `ceil(dt / 0.004)`. `followSpeed >= 1` 或减弱动效时位置直接写成指针, 不积分
  - 帧 `dt` 有上次时间时钳 `1/30` 秒, 否则 `1/60` (`:813`). 移动短于 `0.05` px 不注墨 (`:637`). 安静条件: 距上次注墨超过 `linger * 1200 + 900` 毫秒, 且发射器速度 `< 1` px/秒 (`:831-832`). 默认 `linger = 1.4` 时阈值是 `2580` 毫秒
  - 染料衰减, 三个通道分开 (`:719-723`): `exp(-dt * 4.6 / (linger * 0.8))`, `* 0.2`, `* 1.2`. 速度场再乘 `exp(-dt * 1.2)` (`:713`). 压力开算前先乘 `0.8` (`:690`)
  - 注墨 (`:638-653`): 笔宽 `max(trailWidth * 0.5, 染料像素 * 0.9)` (`:613`). 速度盖章半径 `笔宽*4+18`, 混合强度 `FLOW * 0.6`, 模式 `3` (沿线段加). 染料值 `(5.6, 5.6, 0.7)`, 模式 `2` (线段混合), 宽半径 `笔宽*5+6`. 线段高斯是 `exp(-across^2 / radius^2)`, 纵向 `erf`, `erf` 系数 `1.2732395` 和 `0.147` (`:45-51`)
  - 点击 (`:660-677`): `6` 股, 角抖动 `(rand-0.5)*0.5` 弧度, 近端偏移 `3` px, 远端 `20+rand*14` px. 速度大小 `760` px/秒, 方向再加 `0.6` 弧度, 盖章半径 `18`, 强度 `0.9`. 染料 `(2.4, 2.4, 0.3)` 半径 `笔宽*1.1`, 中心再补 `(1.8, 1.8, 0.4)` 半径 `笔宽*2.2`, 宽半径 `笔宽*7+10`
  - 散度 `0.5 * (右-左+上-下)`, 出界速度取反 (`:123-127`). Jacobi `(左+右+下+上-散度)*0.25` (`:146`). 梯度直接从速度里减掉压力差 (`:157`). MacCormack 修正 `0.5 * (源-回退)`, 再钳进四邻最小最大 (`:104-112`)
  - 着色: 热点 `heat^2 * 0.3 * hotspot` (`:172`). 暗色 `1 - exp(-(光+bloom) * grain)` (`:249`). bloom 系数 `(glow * 1.4) / 5` (`:795`). 亮色覆盖 `1 - exp(-((能量*1.1+气*0.8)*intensity + 晕*0.25))`, 墨色在能量 `0.5..3` 从 `0.95` 收到 `0.72` (`:242-244`). 边缘 `smoothstep(0, 0.02)` (`:233`). 颗粒时间 `13.7`, 位移 `97` (`:234`)
- 指针/滚动: `window` `pointermove` / `pointerdown`, `documentElement` `pointerleave` (`:909-911`). 坐标 `client - rect` (`:847-849`). 离开把 `inside` 和 `ready` 置假, 停止注墨, 不清速度场 (`:851-855`, `:885-887`). 重新进入时发射器瞬移并速度清零 (`:859-866`). 按下在容器内且 `clickBurst` 时把点推进 `bursts`, 同一帧全部喷完 (`:824-826`, `:881`). 没有 `pointerup` / `pointercancel`. 无滚动.
- 可中断: 跟随速度每子步累加, 只有重新进入或 `followSpeed >= 1` 才清零. 点击爆发不排队到下一帧, `while` 把队列一次倒空. 没有松手路径.
- 性能: 安静且速度 `< 1` 就停 rAF 并清速度,染料,压力 (`:833-837`, `:510-514`). 离屏不再 `wake`; `document.hidden` 时本帧 return (`:811`, `:901-906`). DPR 取 `min(设备比, max(0.5, maxDevicePixelRatio))` (`:557`). 监听器每实例一套 window. 默认 `high` 速度格短边 `160`, 染料短边 `768`, 再加 5 层 bloom.
- 减弱动效: 读一次 (`:405`). 命中后跟随改为瞬移 (`:620`), 不写速度盖章 (`:639`), 跳过散度,压力和速度平流 (`:683`), 染料用 `uDt = 0` 只做衰减 (`:726-734`). 点击仍画染料, 不喷速度 (`:671`). 不监听后续变化.
- Props: `color='#5f8bff'`, `secondaryColor`, `intensity=1.3`, `trailWidth=3`, `linger=1.4`, `glow=1.2`, `hotspot=0.8`, `followSpeed=0.6`, `grain=0`, `clickBurst=true`, `quality='high'`, `theme='dark'`, `blendMode`, `maxDevicePixelRatio=2`, `enabled=true`, `children`, `className=''`, `style`
- 裁决: 不做. 不可压流体光标默认就要 `160` 的速度格,`768` 的染料格和 `20` 次压力迭代. 不引进. 临界阻尼 `ω = 10 + followSpeed * 50` 和三通道寿命 `linger` 乘 `0.8 / 0.2 / 1.2` 留在这里, 跟 GhostCursor 的欠阻尼弹簧不是同一套.

### Animations/GradualBlur

- 文件: `Animations/GradualBlur/GradualBlur.jsx` 245 行, `GradualBlur.css` 3 行. CSS 只有 `pointer-events: none`. 无第二份实现. 模糊是叠出来的 `backdrop-filter`, 不是时间轴.
- 看起来: 贴在容器一边的一条带, 从透明到实, 越靠外沿越糊. `autoHide` 时离滚动尽头还有大约一条带的距离就开始把整条收到 0. `hoverIntensity` 不等于 1 时, 指针进入把模糊再乘一个系数, 离开回到 1.
- 技法: DOM, `backdrop-filter`. 形状是静态采样, 滚动只改 CSS 变量. 悬停的变化交给 CSS `transition`, 没有自写积分, 也没有 GSAP.
- 常数:
  - 默认 (`GradualBlur.jsx:42-58`): `position = 'bottom'`, `target = 'parent'`, `height = '6rem'`, `strength = 2`, `layers = 8` 取整钳 `1..16` (`:67`), `curve = 'linear'`, `exponential = true`, `opacity = 1`, `saturation = 1`, `tint = 'transparent'`, `autoHide = false`, `hoverIntensity = 1`, `duration = 0.3`, `easing = 'ease-out'`, `zIndex = 1000`
  - 最大模糊 `max(strength, 0) * 12` px. 默认 `strength = 2` 时是 `24` px (`:69`). 采样 `t` 先走曲线, 指数开着时再 ` (2^(4t) - 1) / 15 `, `t = 1` 时正好是 `1` (`:70-72`)
  - 曲线 (`:9-14`): `linear` 为 `t`; `bezier` 为 `t^2 (3-2t)`; `ease-in` 为 `t^2`; `ease-out` 为 `1-(1-t)^2`; `ease-in-out` 为 `t<0.5 ? 2t^2 : 1-(2-2t)^2/2`. 未知名字落回 `linear` (`:68`)
  - 第 `i` 层半径 `sqrt(max(level((i+1)/n)^2 - level(i/n)^2, 0))`, 写成三位小数 (`:79-83`). 遮罩从 `(i/n)*100%` 透明到 `((i+1)/n)*100%` 实 (`:88`). 饱和度每层 `saturation^(1/n)`, 再写成 `saturate(1 + (boost-1) * reveal)` (`:74`, `:84`)
  - 过渡字符串是 `` `${duration}s ${easing}` `` (`:23`, `:75`, `:98`). 这里的 `easing` 是 CSS 时间函数名, 和上面那张 `CURVES` 不是同一个函数. 默认就是 CSS 的 `ease-out`, `0.3` 秒
  - 染色遮罩 `9` 档, `alpha = s^3 (s(6s-15)+10)`, `s` 是曲线在 `k/8` 的值 (`:101-104`)
  - 自动隐藏: `reveal = clamp(room / reach, 0, 1)`, `reach` 是这条带自己的高或宽, 至少 `1` px (`:153-155`). 顶和左用已滚距离, 底和右用剩余可滚距离 (`:134`, `:154`)
- 指针/滚动: `hoverIntensity === 1` 时不监听指针 (`:176`). 否则 `window` `pointermove` 记 `clientX/Y`, 用一帧 rAF 对一下矩形, 进入写成 `hoverIntensity` (下限 0), 离开写成 `1` (`:181-199`). `documentElement` `pointerleave` 也写回 `1` (`:196-203`). 没有 `pointerdown` / `pointerup` / `pointercancel`. `autoHide` 在滚动容器上挂被动 `scroll`, 再加 `window` `resize` (`:160-161`). 找不到会滚动的兄弟或父级就不隐藏 (`:131-132`).
- 可中断: 没有速度. 悬停变量是直接赋值, 视觉上的进出靠同一条 CSS transition, 中途改目标会从当前滤镜值接着过渡, 不排队. 滚动每帧重写 `--gradual-blur-reveal`, 也不排队.
- 性能: 悬停的 rAF 只对一次命中, 对完就停 (`:181-193`). 模糊层数就是 `layers`, 每层一个 `backdrop-filter`. 滚动监听在找到的那一个 scroller 上, 不是每个层各挂. 无 DPR. 没有每帧分配, 层样式在 `useMemo` 里算好.
- 减弱动效: 无.
- Props: `position='bottom'`, `target='parent'`, `height='6rem'`, `width`, `strength=2`, `layers=8`, `curve='linear'`, `exponential=true`, `opacity=1`, `saturation=1`, `tint='transparent'`, `autoHide=false`, `container`, `hoverIntensity=1`, `duration=0.3`, `easing='ease-out'`, `zIndex=1000`, `className=''`, `style`
- 裁决: 借鉴. 不要叠 8 层 `backdrop-filter`. 可拿走的是增量半径 `sqrt(下一档^2 - 这一档^2)`, 以及滚到尽头时用"剩余距离 / 带高"收起. 指数 `(2^(4t)-1)/15` 让 `t=1` 落在满模糊上. 这份实现没有减弱动效, 不要连这个缺口一起抄.

### Animations/HalftoneReveal

- 文件: `Animations/HalftoneReveal/HalftoneReveal.jsx` 824 行, `HalftoneReveal.css` 14 行. CSS 只把根和画布铺满. 无第二份实现. 遮罩乒乓和 DitherVeil 同一结构, 画面是网点而不是 Bayer.
- 看起来: 图片被印成网点, 指针拖过的地方网点让开, 露出原图. 点从画面中心按格子哈希先后长大. 点击扩出一圈, 1.3 秒走完. 彩色模式是四套角度不同的网点叠印.
- 技法: 手写 WebGL2. 遮罩是半分辨率乒乓, 每帧减 `uFade`. 笔刷是一阶跟随, 没有速度. 网点在片元里. 不是 GSAP, 不是 OGL.
- 常数:
  - 默认与钳制 (`HalftoneReveal.jsx:367-416`): `fit = 'cover'`, `mode = 'mono'`, `shape = 'dot'`, `cellSize = 6` 钳 `2..80`, `angle = 45` 度, `dotScale = 1` 钳 `0.2..2`, `inkColor = '#120f17'`, `accentColor = '#ff4f2a'`, `paperColor = '#ffffff'`, `contrast = 1.1`, `brightness = 0`, `invert = false`, `roughness = 0` 钳 `0..1`, `misregistration = 0` 钳 `0..1`, `revealRadius = 160` 下限 0, `softness = 0.6` 钳 `0..1`, `linger = 1.2` 秒下限 0, `reverse = false`, `wander = false`, `clickBurst = true`, `intro = true`
  - 网点半径 (`:176-183`): 圆在 `t < 0.785` 时 `sqrt(t/π)`, 否则从 `0.5` 收到 `0.72`. 椭圆阈值 `0.7`, 系数 `0.92`. 方 `0.5*sqrt(t)+0.02*t`. 菱形 `t<0.5` 时 `sqrt(t*0.5)`, 否则 `1-sqrt((1-t)*0.5)`. 线 `0.52*t`. 十字 `(1-sqrt(1-t))*0.5+0.02*t`. 边缘再乘 `dotScale` 和入场 `grow`, 抗锯齿 `fwidth * 0.75` (`:197-198`)
  - 角度: 双色第二套 `+0.5236` 弧度 (`:237`). 四色青 `-0.5236`, 品红 `+0.5236`, 黄 `-0.7854` (`:248-250`). 套印偏移 `misregistration * cellSize * 0.35`, y 再乘 `-0.6` (`:226`, `:638`). 粗糙 `(noise(p*0.42+seed*17)-0.5) * roughness * 0.18` (`:196`)
  - 覆盖: 单色 ` (0.05 + t*0.89) * alpha` (`:129-130`). 色版 ` (0.02 + t*0.92) * alpha` (`:133-134`). 双色主点 `pow(t, 1.9)`, 辅点 `clamp(t*1.3, 0, 1)*0.8` (`:240-241`). 黑版 `pow(clamp(1 - bright/0.62, 0, 1), 1.4)*0.95`, `bright` 先做 `pow(..., 0.4545)` (`:146-147`). 色调 `pow(..., 1.5)` (`:125-126`). 亮度 `0.2126, 0.7152, 0.0722` (`:74`)
  - 揭开原图的洞用满点半径再乘 `1.08 * shown`, `shown` 再做一次 `t^2(3-2t)` (`:279-284`)
  - 入场 `1.4` 秒 (`:294`, `:612`), 送进片元的是 `1-(1-intro)^2` (`:642`). 延迟 `length(field)*1.15 + hash(floor(p/cell))*0.06`, 生长窗口 `(intro*1.7 - delay) / 0.45` (`:229-230`)
  - 遮罩: 半径 `revealRadius * (0.45 + 0.55*presence)`, 软边 `max(radius*softness, 1)`, 笔迹再 `t^2(3-2t)`, 和 `上一帧 - uFade` 取最大 (`:37-41`, `:599-602`). `uFade = dt/linger`, 无浮点时下限 `1.5/255`. 分辨率 `0.5` (`:295`, `:574`). 出现 τ `0.16` 秒, 笔刷 `1 - exp(-dt/0.035)` (`:671`, `:677`). 余晖 `linger*1000+200` 毫秒 (`:695`)
  - 冲击波最多 `4` 条, `1.3` 秒 (`:292-293`). 半径是到角点的距离再加 `80`, 进度 `sin(k π / 2)`, 强度 `1-k^3` (`:687-692`). 片元前缘除以 `uBurstWidth*0.35`, 后缘除以全宽; `uBurstWidth = max(60, revealRadius*0.9)` (`:216`, `:644`)
  - 徘徊: `0.32*sin(t*0.53)` 与 `0.08*sin(t*1.31+0.6)`, 纵向 `0.27*sin(t*0.71+1.1)` 与 `0.07*cos(t*1.57)` (`:331-333`). 接手 `1.2` 秒, 再 `t^2(3-2t)` (`:662-664`)
  - 纯色底: 边像素 alpha `< 250` 的比例要 `< 0.5`, 且标准差 `< 0.06` (`:351`, `:363`). 抠图 `smoothstep(0.05, 0.2)` (`:112`)
  - 帧 `dt` 钳 `0..0.05` 秒, 首帧 `1/60` (`:655`). DPR 上限 `2` (`:568`)
- 指针/滚动: 容器上 `pointermove` / `pointerenter` / `pointerdown` / `pointerleave` / `pointercancel` (`:766-770`). `pointerleave` 与 `pointercancel` 都只把 `inside` 置假 (`:751-753`). 没有 `pointerup`. 按下先走移动, 鼠标非主键不发波 (`:755-759`). 新进入时 `fresh` 把笔刷瞬移 (`:745-747`). 无滚动.
- 可中断: 笔刷没有速度, 只有 `fresh` 才瞬移. 冲击波并行, 超过 4 条丢掉最旧 (`:759`). `pointercancel` 不取消已经发出的波.
- 性能: `engaged`,`presence > 0.002`,还有波,还在余晖,入场未完, 才继续 rAF; 否则把 `last` 清零 (`:701-704`). 离屏不 `wake`. `document.hidden` 时本帧 return (`:653`, `:774-778`). 监听器每实例挂在自己的容器上. 遮罩是视口一半.
- 减弱动效: 读一次 (`:518`). 入场直接当 `1` (`:612`), 徘徊关掉 (`:658`). 笔刷,遮罩衰减和点击波仍在. 不监听后续变化.
- Props: `src` (默认一张 Unsplash 图), `fit='cover'`, `mode='mono'`, `shape='dot'`, `cellSize=6`, `angle=45`, `dotScale=1`, `inkColor='#120f17'`, `accentColor='#ff4f2a'`, `paperColor='#ffffff'`, `contrast=1.1`, `brightness=0`, `invert=false`, `roughness=0`, `misregistration=0`, `revealRadius=160`, `softness=0.6`, `linger=1.2`, `reverse=false`, `wander=false`, `clickBurst=true`, `intro=true`, `className=''`, `style`
- 裁决: 不做. 和 DitherVeil 是同一类揭图, 笔刷 τ `0.035` 秒和出现 τ `0.16` 秒不要再抄一遍. 不把半色调网点和默认外链图引进组件库. 屏角差 `0.5236` 弧度, 以及入场延迟 `长度*1.15 + 格子哈希*0.06`, 留在这份片元里.

### Animations/ImageTrail

- 文件: `Animations/ImageTrail/ImageTrail.jsx` 254 行, `ImageTrail.css` 32 行. 容器 `z-index: 100`, 图初始 `opacity: 0`, 内层比外框各边多 `10` px (`20px` 总宽, 再平移一半). 无第二份实现.
- 看起来: 指针每走过 `threshold` 就在落后于指针的位置盖一张图, 再滑到当前点. 默认 `0.4` 秒后缩到 `exitScale` 并淡出. `drift > 0` 时滑得更远, 淡出同时再按位移漂一段. `stack > 0` 时不按寿命收, 只保留最近几张, 多出来的立刻淡掉.
- 技法: DOM, GSAP timeline. 跟随缓存是每帧 `lerp(..., 0.1)`, 不看 `dt`. 不是弹簧.
- 常数:
  - 默认 (`ImageTrail.jsx:197-211`): `size = 190`, `aspectRatio = 1.1`, `radius = 15`, `threshold = 80` px, `lifetime = 0.4` 秒, `appearScale = 1`, `zoom = 1`, `flash = 0`, `exitScale = 0.2`, `drift = 0`, `rotation = 0`, `sizeVariance = 0`, `alignToMotion = false`, `stack = 0`, `tilt = 0`. `tilt` 非 0 时容器 `perspective: 1000px` (`:244`)
  - 缓存 `lerp(cache, mouse, 0.1)` (`:8`, `:154-155`). 与鼠标差 `> 0.5` px 才继续 rAF (`:161`)
  - 生成条件: 距上次落点 `hypot > threshold`, 且没有减弱动效 (`:156-159`)
  - 出现时长 `drift > 0` 时 `0.9` 秒,缓动 `power2`, 否则 `0.4` 秒,`power1` (`:96-97`). 起点缩放 `appearScale * scale`, 旋转 `fromAngle`, 倾斜先到一半 (`:87-93`). 终点缩放就是 `scale`, 位置是鼠标再加 `dx * slide`, `slide = 0.6 * drift` (`:73`, `:99-100`)
  - `scale = 1 + random(-0.5, 0.6) * sizeVariance` (`:68`). 不对齐运动时 `fromAngle` 在 `±rotation` 度里随机, `toAngle = fromAngle * 0.4` (`:59-60`). 对齐时从上一角度收到移动角, 差超过 `±180` 度就加减 `360` (`:62-66`)
  - 倾斜: 指针相对中心的归一化位置乘 `tilt`, x 再取负 (`:70-71`)
  - 内层只有 `zoom !== 1` 或 `flash > 0` 才动: `0.5` 秒, `power1`, 从 `scale: zoom`,`brightness(1 + flash * 1.5)` 收到 `1` (`:107-112`)
  - 离场插在时间轴的 `lifetime` 秒处, 时长 `0.4` 秒, 缓动 `drift > 0` 时 `expo` 否则 `power3`, 透明度 `0`, 缩放 `exitScale * scale` (`:126-134`). 漂移动画同时起, `1.5` 秒, `power4`, 位移再加 `dx * drift * 1.2` (`:136-146`)
  - 堆叠保留 `max(1, min(round(stack), 张数-1))` (`:118`). 挤掉的那张单独 `0.4` 秒,`power4`,透明度 `0`,缩放 `exitScale` (不再乘随机 `scale`) (`:36-42`)
- 指针/滚动: 容器上 `mousemove` 和 `touchmove` (`:180-181`). 触摸读 `touches[0]` (`:168`). 坐标 `client - rect` (`:170-171`). 第一次移动把缓存和上次落点都设成当前点, 不立刻盖图 (`:172-175`). 没有 `pointerup` / `pointercancel` / `pointerleave`. 无滚动.
- 可中断: 同一张图再次被抽到时 `gsap.killTweensOf` 拆掉旧补间, 用新的 fromTo 重来, 不保留速度 (`:77-78`). 堆叠的离场和出现是分开的补间, 不排成一条队列. 没有松手路径.
- 性能: 缓存追上 `0.5` px 就停 rAF (`:161-162`). 无离屏检测, 无 DPR. 监听器在该容器上. `will-change: transform, filter` 写在每张图上 (`ImageTrail.css:21`). 减弱动效只是跳过生成, 循环仍会把缓存 lerp 完.
- 减弱动效: 每帧读 `prefers-reduced-motion` 的 `.matches`, 不听 `change` (`:18`, `:156`). 命中后不 `spawn`, 已在播的 GSAP 不停.
- Props: `items=[]`, `size=190`, `aspectRatio=1.1`, `radius=15`, `threshold=80`, `lifetime=0.4`, `appearScale=1`, `zoom=1`, `flash=0`, `exitScale=0.2`, `drift=0`, `rotation=0`, `sizeVariance=0`, `alignToMotion=false`, `stack=0`, `tilt=0`, `className=''`
- 裁决: 借鉴. 不把跟着指针盖图的拖尾做成组件. 可记的是两件事: 落点间距 `80` px 才生成下一张, 以及盖图位置每帧只追 `10%`, 所以图落在指针后面. 离场插在 `lifetime` 秒处,默认缩到 `0.2`, 缓动在 `drift` 开着时从 `power3` 换成 `expo`.

### Animations/LaserFlow

- 文件: `Animations/LaserFlow/LaserFlow.jsx` 868 行, `LaserFlow.css` 14 行. CSS 根 `pointer-events: none`, 画布 `absolute; inset: 0`. 无第二份实现. 一整条竖梁打在一块表面上, 再向两边铺开.
- 看起来: 梁从画面上方落下, 撞到表面后按欠阻尼弹簧胀开, 同时一道闪光按两个指数相乘. 铺开前沿是 `1 - exp(-1.15 t)`. 指针在里面时, 一枚透镜跟过去, 用来在 `revealImage` 上开一个半径 `revealRadius` 的洞. 时间走到 `5` 秒后入场量钉死, 只剩梁自己的噪声在走.
- 技法: 手写 WebGL2 全屏三角形. 入场胀开是解析弹簧, 不是逐步积分. 透镜是自写二阶弹簧, 系数和 CrystalizedBall 的角弹簧相同. 不是 GSAP.
- 常数:
  - 默认与钳制 (`LaserFlow.jsx:426-478`): `beamPosition = 0.6` 钳 `0..1`, `surfaceLevel = 1` 钳 `0..1`, `color = '#3847ff'`, 解析失败落回 `(0.22, 0.28, 1)` (`:563`); `intensity = 1.8` 下限 0, `beamWidth = 1.5` 钳 `0.2..5`, `flare = 1.5` 钳 `0.2..4`, `spread = 1.5` 钳 `0.1..4`, `spill = 1`, `fog = 0.2`, `dust = 1.6`, `streaks = 1.5`, `dots = 1`, `pulse = 1.5`, `speed = 1.5`, `seed = 3`, `mouseInteraction = true`, `revealRadius = 220` 下限 `1`, `revealOpacity = 0.6` 钳 `0..1`, `intro = true`, `theme = 'dark'`, `paused = false`
  - 画面比例 `clamp(min(width/585, height/507), 至少 0.2)` (`:670`). 最长边像素超过 `2048` 就按比例把 DPR 压下去; DPR 先钳到 `2` (`:345`, `:651-653`)
  - 落下 `INTRO_DROP = 1.25` 秒, 整段入场时钟收到 `INTRO_END = 5` 秒 (`:346-347`, `:764-765`). 起点 `y = -0.15 * height`, 跨度再加 `0.3 * height` (`:681-682`). 前沿 `start + span * (t/1.25)^1.3` (`:685`). 撞上表面的时刻 `1.25 * ((surface.top - start) / span)^(1/1.3)` (`:686`)
  - 撞后胀开 (`:351-356`): `omega = 8`, `zeta = 0.62`, `1 - exp(-ζωt) * (cos(ωd t) + ζω/ωd * sin(ωd t))`. 闪光 `exp(-t/0.35) * (1 - exp(-t/0.05))` (`:689`). 铺开 `runRange * (1 - exp(-1.15 t))`, `runRange = spread * 250 * 1.3 + 80` (`:690-691`). 珠 `exp(-1.15 t) * (1 - exp(-t/0.08))` (`:692`)
  - 浇注 (`:693-703`): 目标 `min(reach, runRange * 0.97)`, 到达 `-ln(1 - target/runRange) / 1.15`. 填充用五次平滑, 窗口 `(elapsed + 0.15) / 0.8`. 到达之后位移 `speed * elapsed + 260 * elapsed^2`, `speed = 1.15 * (runRange - target)`. 大气在撞前 `0.3 * (1-(1-t)^3)`, 撞后 `0.3 + 0.7 * (1 - exp(-1.3 t))` (`:707-711`)
  - 梁 (`:173-174`): 核 `24 * exp(-adx / (2 * beamWidth))`, 晕 `1.3 * exp(-adx / (6 * beamWidth)) + 0.3 * exp(-adx / (22 * beamWidth))`. 裙摆 `16.6 * (exp(-(rise/(11.8*flare))^2) + 0.3 * exp(-rise/(60*flare)))` (`:182`). 噪声 5 层, 振幅每次 `*0.5`, 矩阵 `(1.6, 1.2, -1.2, 1.6)` (`:67-74`). 细线时间 `t*0.4` 和 `t*1.1`, 索引 `*3.7` 与 `*5.3` (`:200`, `:207`)
  - 透镜 (`:776-783`): `a = 120 * 误差 - 19 * 速度`, 再 `v += a * dt`. 强度 τ 上升 `0.3` 秒,下降 `0.55` 秒. 半径 uniform `95 * scale` (`:728`). 第一次进入才瞬移并清速度 (`:769-774`). 停稳: 强度差 `> 0.002` 或速度 `> 0.5` (`:787-789`)
  - 色相表 16 组偏移, 基准饱和度 `0.78`, 再按源色饱和度缩放 (`:325-345`, `:383-388`). 种子 uniform `34.34 + seed * 7.31` 和 `11.58 + seed * 3.17` (`:748`)
- 指针/滚动: 只有 `window` `pointermove` 和 `documentElement` `pointerleave` (`:828-829`). 坐标 `client - rect`, 在矩形内才算 `inside` (`:798-804`). 离开只把 `inside` 置假, 透镜继续积分, 强度往 `0` 收 (`:808-809`, `:782`). 没有 `pointerdown` / `pointerup` / `pointercancel`. 无滚动. 透镜位置进 `uLens`, 不写成力.
- 可中断: 透镜速度一直累加. 只有"刚进入且还没放置"才清速度. 强度中途改目标用同一条指数, 不排队. 没有按下态.
- 性能: `paused` 或减弱动效时 `uTime` 不加 (`:762-763`). 入场未到 `5` 秒, 或透镜还没停稳, rAF 继续 (`:790`). 离屏或 `document.hidden` 本帧 return (`:758`). 监听器每实例一套 window. 揭示图长边收到 `2048` (`:593`).
- 减弱动效: 读一次 (`:543`). 命中后入场时钟从 `5` 起 (`:546`), `uTime` 不走, 透镜不算激活 (`:768`). 梁停在终态, 不跟指针. 不监听后续变化.
- Props: `surfaceRef`, `beamPosition=0.6`, `surfaceLevel=1`, `color='#3847ff'`, `intensity=1.8`, `beamWidth=1.5`, `flare=1.5`, `spread=1.5`, `spill=1`, `fog=0.2`, `dust=1.6`, `streaks=1.5`, `dots=1`, `pulse=1.5`, `speed=1.5`, `seed=3`, `mouseInteraction=true`, `revealImage`, `revealRadius=220`, `revealOpacity=0.6`, `intro=true`, `theme='dark'`, `paused=false`, `dpr`
- 裁决: 不做. 这是整屏装饰光梁, 不进组件库. 透镜那组 `120` 和 `19` 已经在 CrystalizedBall 里出现过, 不另做. 撞上表面后的胀开是另一套解析弹簧: `omega = 8`, `zeta = 0.62`, 落下用 `1.25` 秒的 `t^1.3`.
