# video-shotcraft demos part 1

来源提交 `1266a3e`. 每个 tsx 逐行扫描. 30fps, 1 帧 = 33.3ms.

### demos/_fixtures/Brand

- 镜头卡: 无, 共享夹具
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - 无 interpolate / spring / Easing
- 卡片参数:
  - 无对应镜头卡
- 可逆: 没有帧采样. 当静态夹具.
- 裁决: 只留规则. 节奏或收尾只给首页最后一屏, 不做成组件默认态.

### demos/_fixtures/Fixtures

- 镜头卡: 无, 共享夹具
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `Fixtures.tsx:200` `const EVENTS = ['merged #482 into main', 'commented on Roadmap', 'deployed v2.14.0', 'opened Billing v2', 'closed 3 issues', 'invited 2 members'];`
  - `Fixtures.tsx:201` `const GOALS = ['Design system', 'Mobile app', 'Billing v2', 'Docs refresh', 'Search'];`
  - `Fixtures.tsx:204` `const BASE_W = 484;`
  - `Fixtures.tsx:205` `const BASE_H = 414;`
  - `Fixtures.tsx:206` `const HEADER = 28;`
  - `Fixtures.tsx:207` `const GAP = 16;`
  - `Fixtures.tsx:208` `const METRIC = 64;`
  - `Fixtures.tsx:209` `const FOOTER = 54;`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 没有帧采样. 当静态夹具.
- 裁决: 只留规则. 节奏或收尾只给首页最后一屏, 不做成组件默认态.

### demos/_fixtures/Look

- 镜头卡: 无, 共享夹具
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `Look.tsx:97` `export const TYPE = { mega: 260, display: 180, h1: 120, h2: 84, h3: 60, body: 40, small: 32, label: 22 } as const;`
  - `Look.tsx:120` `// 物理弹簧（30fps）：start 帧起跳；damping 低 = 回弹多（12 活泼 / 18 利落 / 26 无回弹）`
  - `Look.tsx:121` `export const springAt = (frame: number, start: number, opts: { damping?: number; stiffness?: number; mass?: number } = {}) =>`
  - `Look.tsx:122` `spring({ frame: frame - start, fps: 30, config: { damping: opts.damping ?? 18, stiffness: opts.stiffness ?? 170, mass: opts.mass ?? 1 } });`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 含 random 或 noise, 网页进度函数不能依赖它, 要换成种子或删掉.
- 裁决: 只留规则. 节奏或收尾只给首页最后一屏, 不做成组件默认态.

### demos/_fixtures/Motion

- 镜头卡: 无, 共享夹具
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `Motion.tsx:46` `return Math.min(1, frame / Math.max(1, durationInFrames - 1));`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 节奏或收尾只给首页最后一屏, 不做成组件默认态.

### demos/_fixtures/PageCam2D

- 镜头卡: 无, 共享夹具
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `PageCam2D.tsx:37` `}> = ({ src, pageH, keys, children, bg = '#faf7f2', blur = 0, ease = Easing.bezier(0.33, 0, 0.15, 1) }) => {`
  - `PageCam2D.tsx:51` `: interpolate(frame, [a.frame, b.frame], [0, 1], {`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 节奏或收尾只给首页最后一屏, 不做成组件默认态.

### demos/_fixtures/Polish

- 镜头卡: 无, 共享夹具
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - 无 interpolate / spring / Easing
- 卡片参数:
  - 无对应镜头卡
- 可逆: 含 random 或 noise, 网页进度函数不能依赖它, 要换成种子或删掉.
- 裁决: 只留规则. 节奏或收尾只给首页最后一屏, 不做成组件默认态.

### demos/_legacy/_fixtures/Fixtures

- 镜头卡: 无, 共享夹具
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - 无 interpolate / spring / Easing
- 卡片参数:
  - 无对应镜头卡
- 可逆: 没有帧采样. 当静态夹具.
- 裁决: 只留规则. 这是共享夹具, 不是镜头.

### demos/_legacy/_fixtures/Motion

- 镜头卡: 无, 共享夹具
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `Motion.tsx:46` `return Math.min(1, frame / Math.max(1, durationInFrames - 1));`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 这是共享夹具, 不是镜头.

### demos/_legacy/camera/depth-layer-moves/DollyZoomReal

- 镜头卡: `references/shots/camera/depth-layer-moves.md`
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `DollyZoomReal.tsx:7` `export const DOLLYZOOM_DUR = 135;`
  - `DollyZoomReal.tsx:9` `const BG_CARDS = layout.projects.cards.filter((_, i) => i !== 3);`
  - `DollyZoomReal.tsx:13` `const t = interpolate(frame, [15, 110], [0, 1], {`
  - `DollyZoomReal.tsx:15` `easing: Easing.bezier(0.4, 0, 0.3, 1),`
- 卡片参数:
  - `depth-layer-moves.md:5` `时长: 4–5.5s 持续（demo 165f）`
  - `depth-layer-moves.md:19` `- 滑轨有终点：drive 总量按"中景落定时 card4 恰在屏心"反算，不对称 in-out（bezier 0.45,0,0.18,1）130f；`
  - `depth-layer-moves.md:20` `落定后主角浮起（elevation 6→26、1.035x、晚于位置收敛 ~8f）+ 赤陶描边 + 「In focus」角标，尾帧是海报；`
  - `depth-layer-moves.md:33` `- 整层全屏实时 'filter: blur()' 每帧变化很贵（实测可差 3 倍以上渲染时长）：模糊挂在层内的小元素上，别挂在铺满画面的层容器上`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/camera/tension-camera-moves/DutchRollToLevel

- 镜头卡: `references/shots/camera/tension-camera-moves.md`
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `DutchRollToLevel.tsx:10` `const ROLL = 70; // 滚正起拍`
  - `DutchRollToLevel.tsx:11` `const LEVEL = 94; // 完全归位帧`
  - `DutchRollToLevel.tsx:21` `const driftFade = interpolate(f, [ROLL, ROLL + 6], [1, 0], {`
  - `DutchRollToLevel.tsx:31` `? interpolate(f, [ROLL, ROLL + 14], [-10, 1.2], {`
  - `DutchRollToLevel.tsx:32` `easing: Easing.out(Easing.cubic),`
  - `DutchRollToLevel.tsx:34` `: interpolate(f, [ROLL + 14, LEVEL], [1.2, 0], {`
  - `DutchRollToLevel.tsx:36` `easing: Easing.inOut(Easing.quad),`
  - `DutchRollToLevel.tsx:43` `const scale = interpolate(f, [ROLL, LEVEL], [1.15, 1.08], {`
  - `DutchRollToLevel.tsx:46` `easing: Easing.inOut(Easing.cubic),`
  - `DutchRollToLevel.tsx:50` `const alertOpacity = interpolate(f, [ROLL, ROLL + 12], [1, 0], {`
  - `DutchRollToLevel.tsx:54` `const cleanOpacity = interpolate(f, [ROLL + 8, ROLL + 22], [0, 1], {`
- 卡片参数:
  - `tension-camera-moves.md:5` `时长: 单式 5–6s（150–170f）；全片合计 ≤2 式（各 ≤1 次）`
  - `tension-camera-moves.md:25` `| A 双时钟 | 内容动画吃 'eff'（速度坡道积分：8f smooth 刹停 → 冻结 52f → 8f 恢复），相机吃真实 f | 命门：冻结期内容必须肉眼可见地完全静止，相机却在动——两个时钟各管各的；硬停硬起没有子弹时间的变速感 |`
  - `tension-camera-moves.md:26` `| A 环绕 | perspective 1800 的 preserve-3d 场景（面板 / 带 z 深度的火花 / 网格地面 / 远处点阵墙）：rotateY 0→-52°（26f smooth）→ 顶点慢漂 12f → 回 0（22f swift），同步 rotateX 抬 6°、推近 160px | 50–55° 是"绕到侧面看"的下限；>70° 面板变纸片穿帮；没有深度参照物（单面板 + 纯色底）读不出是相机在绕 |`
  - `tension-camera-moves.md:28` `| B 后拉 | scale 2.2→0.62 / 110f Easing.out(cubic)，origin 锁主卡中心，按 2.2× CSS zoom 布局再缩小 | 前 20f 主卡仍占满画面，开场即特写不需要另加 hold；transform 放大的特写字会糊（Q2） |`
  - `tension-camera-moves.md:29` `| B 熄灭 | 兄弟卡按 hypot 距离排序，帧 30 起每 8f 一张，16f 内 opacity→0（EASE.out）+ brightness→0.3 + 失焦 5px + 下沉 0.97；背景 60–110f 从亮柔光底交叉沉入带色相深场 | 由近到远熄灭 = "世界向外塌暗"；乱序熄灭读作故障 |`
  - `tension-camera-moves.md:30` `| B 光晕 | 主卡两层冷白 box-shadow 60–100f 淡入，受光上沿同步浮现 | 光晕是"只剩它"的视觉证词，与沉黑同步才成立 |`
  - `tension-camera-moves.md:31` `| 收尾 | 两式动作完毕 hold ≥30f（A 只留光的极缓呼吸；B 110–150f 真静止） | R1；B 式是全片句号，静止给足 40f+，可在屏幕空间加一句结语 |`
  - `tension-camera-moves.md:37` `（帧 remap 互相打架）；A 的冻结是"停给你看"+相机动，speed-ramp-freeze 的`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/camera/tension-camera-moves/SlowPushIn

- 镜头卡: `references/shots/camera/tension-camera-moves.md`
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `SlowPushIn.tsx:2` `// 景 A（帧 0–120）：深色底 + 白色大数字 "10x"，scale 用 Easing.in(Easing.quad)`
  - `SlowPushIn.tsx:11` `const CUT = 120; // 硬切帧`
  - `SlowPushIn.tsx:22` `// 匀加速推近：Easing.in(quad)——前段几乎不可察，后段可感`
  - `SlowPushIn.tsx:23` `const scale = interpolate(frame, [0, CUT], [1.0, 1.14], {`
  - `SlowPushIn.tsx:24` `easing: Easing.in(Easing.quad),`
  - `SlowPushIn.tsx:29` `const vignette = interpolate(frame, [0, CUT], [0, 0.5], {`
  - `SlowPushIn.tsx:30` `easing: Easing.in(Easing.quad),`
- 卡片参数:
  - `tension-camera-moves.md:5` `时长: 单式 5–6s（150–170f）；全片合计 ≤2 式（各 ≤1 次）`
  - `tension-camera-moves.md:25` `| A 双时钟 | 内容动画吃 'eff'（速度坡道积分：8f smooth 刹停 → 冻结 52f → 8f 恢复），相机吃真实 f | 命门：冻结期内容必须肉眼可见地完全静止，相机却在动——两个时钟各管各的；硬停硬起没有子弹时间的变速感 |`
  - `tension-camera-moves.md:26` `| A 环绕 | perspective 1800 的 preserve-3d 场景（面板 / 带 z 深度的火花 / 网格地面 / 远处点阵墙）：rotateY 0→-52°（26f smooth）→ 顶点慢漂 12f → 回 0（22f swift），同步 rotateX 抬 6°、推近 160px | 50–55° 是"绕到侧面看"的下限；>70° 面板变纸片穿帮；没有深度参照物（单面板 + 纯色底）读不出是相机在绕 |`
  - `tension-camera-moves.md:28` `| B 后拉 | scale 2.2→0.62 / 110f Easing.out(cubic)，origin 锁主卡中心，按 2.2× CSS zoom 布局再缩小 | 前 20f 主卡仍占满画面，开场即特写不需要另加 hold；transform 放大的特写字会糊（Q2） |`
  - `tension-camera-moves.md:29` `| B 熄灭 | 兄弟卡按 hypot 距离排序，帧 30 起每 8f 一张，16f 内 opacity→0（EASE.out）+ brightness→0.3 + 失焦 5px + 下沉 0.97；背景 60–110f 从亮柔光底交叉沉入带色相深场 | 由近到远熄灭 = "世界向外塌暗"；乱序熄灭读作故障 |`
  - `tension-camera-moves.md:30` `| B 光晕 | 主卡两层冷白 box-shadow 60–100f 淡入，受光上沿同步浮现 | 光晕是"只剩它"的视觉证词，与沉黑同步才成立 |`
  - `tension-camera-moves.md:31` `| 收尾 | 两式动作完毕 hold ≥30f（A 只留光的极缓呼吸；B 110–150f 真静止） | R1；B 式是全片句号，静止给足 40f+，可在屏幕空间加一句结语 |`
  - `tension-camera-moves.md:37` `（帧 remap 互相打架）；A 的冻结是"停给你看"+相机动，speed-ramp-freeze 的`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/data/avatar-grid-radial-build-colorize/AvatarGridRadialBuildColorize

- 镜头卡: 无
- 时长: 168 帧 / 5600 ms, `DURATION` 于第 10 行
- 分镜:
  - `AvatarGridRadialBuildColorize.tsx:10` `export const AVATAR_GRID_RADIAL_BUILD_COLORIZE_DURATION = 168; // 5600ms @30fps`
  - `AvatarGridRadialBuildColorize.tsx:12` `const PAPER = '#F3F3F1';`
  - `AvatarGridRadialBuildColorize.tsx:13` `const INK = '#111113';`
  - `AvatarGridRadialBuildColorize.tsx:14` `const MID = '#8A8A8F';`
  - `AvatarGridRadialBuildColorize.tsx:32` `const COLS = 8;`
  - `AvatarGridRadialBuildColorize.tsx:33` `const ROWS = 7;`
  - `AvatarGridRadialBuildColorize.tsx:34` `const TOTAL = 5.6 * 30; // 总帧数（delay 换算用）`
  - `AvatarGridRadialBuildColorize.tsx:39` `const GAP = 10;`
  - `AvatarGridRadialBuildColorize.tsx:40` `const CELL_W = (480 - 32 - (COLS - 1) * GAP) / COLS; // 47.25`
  - `AvatarGridRadialBuildColorize.tsx:41` `const CELL_H = (270 - 32 - (ROWS - 1) * GAP) / ROWS; // ≈25.43`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 没有帧采样. 当静态夹具.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/data/counter-confetti/CounterConfetti

- 镜头卡: 无
- 时长: 138 帧 / 4600 ms, `DURATION` 于第 8 行
- 分镜:
  - `CounterConfetti.tsx:8` `export const COUNTER_CONFETTI_DURATION = 138; // 4600ms @30fps`
  - `CounterConfetti.tsx:10` `const PAL = ['#ff6b8b', '#ffb347', '#ffe86b', '#7bff9e', '#5fd8ff', '#6c8cff', '#c86cff', '#ff6cf0'];`
  - `CounterConfetti.tsx:11` `const BURST = 0.52; // 计数到位(0.56)前"抢拍"`
  - `CounterConfetti.tsx:14` `const BITS = Array.from({ length: 52 }, (_, i) => {`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 没有帧采样. 当静态夹具.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/data/cycle-glass-node-morph/CycleGlassNodeMorph

- 镜头卡: 无
- 时长: 257 帧 / 8567 ms, `DURATION` 于第 7 行
- 分镜:
  - `CycleGlassNodeMorph.tsx:7` `export const CYCLE_GLASS_NODE_MORPH_DURATION = 257;`
  - `CycleGlassNodeMorph.tsx:16` `// stop/restart that three separately eased interpolate() calls would introduce.`
  - `CycleGlassNodeMorph.tsx:162` `const wipeStop = interpolate(wipe, [0, 1], [-40, 140]);`
  - `CycleGlassNodeMorph.tsx:248` `width: interpolate(vehicle, [0, 1], [332, 154]),`
  - `CycleGlassNodeMorph.tsx:249` `height: interpolate(vehicle, [0, 1], [134, 62]),`
  - `CycleGlassNodeMorph.tsx:250` `transform: 'translate(-50%, -50%) translateY(${interpolate(vehicle, [0, 1], [25, 15])}px)',`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/data/hatch-depth/HatchDepth

- 镜头卡: 无
- 时长: 132 帧 / 4400 ms, `DURATION` 于第 8 行
- 分镜:
  - `HatchDepth.tsx:8` `export const HATCH_DEPTH_DURATION = 132; // 4400ms @30fps`
  - `HatchDepth.tsx:10` `const ACCENT = '#5B8DEF'; // 模板强调色，可按项目替换`
  - `HatchDepth.tsx:11` `const ACCENT_HI = '#8FB2F7'; // 同族高亮（数值文字）`
  - `HatchDepth.tsx:22` `const NBSP2 = '  ';`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 没有帧采样. 当静态夹具.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/data/odometer-digit-roll/OdometerDigitRoll

- 镜头卡: 无
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `OdometerDigitRoll.tsx:4` `// 减速（Easing.out(cubic)），过冲半格再 6f 弹回锁定。滚动期每位叠 2 个错帧`
  - `OdometerDigitRoll.tsx:14` `const ROW = 210; // 数位行高（overflow 盒高）`
  - `OdometerDigitRoll.tsx:15` `const DW = 126; // 数位盒宽`
  - `OdometerDigitRoll.tsx:16` `const FS = 190; // 字号`
  - `OdometerDigitRoll.tsx:17` `const SPIN = 0.85; // 高速滚动速度：行/帧`
  - `OdometerDigitRoll.tsx:18` `const DIGITS = [9, 9, 9, 8]; // 目标数位（"99.98" 中可滚的四位）`
  - `OdometerDigitRoll.tsx:29` `return interpolate(f, [s, s + 16], [p0, T + 0.5], {`
  - `OdometerDigitRoll.tsx:32` `easing: Easing.out(Easing.cubic),`
  - `OdometerDigitRoll.tsx:35` `return interpolate(f, [s + 16, s + 22], [T + 0.5, T], {`
  - `OdometerDigitRoll.tsx:38` `easing: Easing.out(Easing.cubic),`
  - `OdometerDigitRoll.tsx:84` `const gate = interpolate(speed, [0.06, 0.5], [0, 1], {`
  - `OdometerDigitRoll.tsx:123` `const pulseScale = interpolate(frame, [63, 67, 71], [1, 1.035, 1], {`
  - `OdometerDigitRoll.tsx:126` `easing: Easing.inOut(Easing.quad),`
  - `OdometerDigitRoll.tsx:128` `const labelOp = interpolate(frame, [66, 84], [0, 1], {`
  - `OdometerDigitRoll.tsx:131` `easing: Easing.out(Easing.quad),`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/data/particle-celebrate-hits/ConfettiCrossfire

- 镜头卡: 无
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `ConfettiCrossfire.tsx:10` `const AMBER = '#b45309';`
  - `ConfettiCrossfire.tsx:11` `const FIRE = 16; // 揭晓帧 = 发射帧`
  - `ConfettiCrossfire.tsx:12` `const DECAY = 0.9;`
  - `ConfettiCrossfire.tsx:13` `const GRAV = 1.5; // px/f² （等效重力；decay 下终端落速 = GRAV/(1-d) = 15px/f）`
  - `ConfettiCrossfire.tsx:45` `const LEFT_GUN = makeGun(60, 3);   // 左下炮朝 60°（偏右上）`
  - `ConfettiCrossfire.tsx:46` `const RIGHT_GUN = makeGun(120, 9); // 右下炮朝 120°（偏左上）`
  - `ConfettiCrossfire.tsx:47` `const LEFT_POS = { x: 140, y: 1040 };`
  - `ConfettiCrossfire.tsx:48` `const RIGHT_POS = { x: 1780, y: 1040 };`
  - `ConfettiCrossfire.tsx:55` `const cardScale = interpolate(frame, [0, 14], [0.6, 1], {`
  - `ConfettiCrossfire.tsx:56` `easing: Easing.out(Easing.back(1.8)),`
  - `ConfettiCrossfire.tsx:59` `const cardOp = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/data/particle-celebrate-hits/CounterTickSparks

- 镜头卡: 无
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `CounterTickSparks.tsx:11` `const AMBER = '#b45309';`
  - `CounterTickSparks.tsx:12` `const TARGET = 12847;`
  - `CounterTickSparks.tsx:13` `const COUNT_END = 78; // 计数结束帧`
  - `CounterTickSparks.tsx:33` `const SPARK_LIFE = 18;`
  - `CounterTickSparks.tsx:34` `const GRAV = 0.9;`
  - `CounterTickSparks.tsx:44` `interpolate(frame, [COUNT_END, COUNT_END + 5, COUNT_END + 16], [0, 1, 0], {`
  - `CounterTickSparks.tsx:45` `easing: Easing.out(Easing.quad),`
  - `CounterTickSparks.tsx:50` `const TOP_Y = 452; // 数字顶缘（火星发射线）`
  - `CounterTickSparks.tsx:51` `const CX = 960;`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/data/particle-sand-fill/ParticleSandFill

- 镜头卡: 无
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `ParticleSandFill.tsx:11` `const AMBER = '#b45309';`
  - `ParticleSandFill.tsx:15` `const CARD = { x: 460, y: 300, w: 1000, h: 560 };`
  - `ParticleSandFill.tsx:16` `const PLOT_BOTTOM = CARD.y + CARD.h - 70; // 堆积地面（卡内基线）`
  - `ParticleSandFill.tsx:17` `const GRAIN = 14; // 方点边长（宁大勿小：4px 在 1080p 卡内不可感，加码到 14）`
  - `ParticleSandFill.tsx:18` `const PER_LAYER = 9; // 每层 9 颗 → 柱宽 126px`
  - `ParticleSandFill.tsx:20` `const DROP_FROM = 230; // 距各自落点上方 ~230px 起落`
  - `ParticleSandFill.tsx:21` `const GRAV = 1.6; // px/f²`
  - `ParticleSandFill.tsx:22` `const STAGGER = 6; // 各柱错峰启动`
  - `ParticleSandFill.tsx:23` `const RATE = 0.28; // 颗间出发间隔（帧）——最高柱 216 颗需 ~60f 发完，全局 f120 内收束`
  - `ParticleSandFill.tsx:61` `const solidOp = interpolate(frame, [doneAt, doneAt + 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });`
  - `ParticleSandFill.tsx:62` `const labelScale = interpolate(frame, [doneAt + 6, doneAt + 18], [0, 1], {`
  - `ParticleSandFill.tsx:63` `easing: Easing.out(Easing.back(2.2)),`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/data/ring-diagram-annotation-reveal/RingDiagramAnnotationReveal

- 镜头卡: 无
- 时长: 190 帧 / 6333 ms, `DURATION` 于第 7 行
- 分镜:
  - `RingDiagramAnnotationReveal.tsx:7` `export const RING_DIAGRAM_ANNOTATION_REVEAL_DURATION = 190;`
  - `RingDiagramAnnotationReveal.tsx:11` `interpolate(frame, [start, Math.max(start + 1, end)], [0, 1], {`
  - `RingDiagramAnnotationReveal.tsx:13` `easing: Easing.bezier(0.16, 1, 0.3, 1),`
  - `RingDiagramAnnotationReveal.tsx:23` `const echo = interpolate(frame, [start - 1, start, start + 2, start + 8], [0, 0.32, 0.32, 0], CLAMP);`
  - `RingDiagramAnnotationReveal.tsx:32` `transform: 'translateY(${interpolate(k, [0, 1], [8, -4])}px)',`
  - `RingDiagramAnnotationReveal.tsx:41` `clipPath: 'inset(${interpolate(k, [0, 1], [100, 0])}% 0 0 0)',`
  - `RingDiagramAnnotationReveal.tsx:42` `transform: 'translateY(${interpolate(k, [0, 1], [9, 0])}px)',`
  - `RingDiagramAnnotationReveal.tsx:66` `const centerX = interpolate(layout, [0, 1], [240, 154]);`
  - `RingDiagramAnnotationReveal.tsx:67` `const scale = interpolate(layout, [0, 1], [1, 0.84]);`
  - `RingDiagramAnnotationReveal.tsx:68` `const rotate = interpolate(frame, [29, 187], [0, 44.2], CLAMP);`
  - `RingDiagramAnnotationReveal.tsx:69` `const apertureRadius = interpolate(aperture, [0, 1], [540, 61]);`
  - `RingDiagramAnnotationReveal.tsx:115` `transform: 'scale(${interpolate(ringIn, [0, 1], [3.8, 1])})',`
  - `RingDiagramAnnotationReveal.tsx:129` `transform: 'rotate(${rotate}deg) scale(${interpolate(coilsIn, [0, 1], [1.08, 1])})',`
  - `RingDiagramAnnotationReveal.tsx:144` `x2={interpolate(arrowsIn, [0, 1], [x1, x2])}`
  - `RingDiagramAnnotationReveal.tsx:145` `y2={interpolate(arrowsIn, [0, 1], [y1, y2])}`
  - `RingDiagramAnnotationReveal.tsx:226` `transform: 'translateY(${interpolate(definition, [0, 1], [5, 0])}px)',`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/effects/dashboard-glow-highlight-pill/DashboardGlowHighlightPill

- 镜头卡: 无
- 时长: 60 帧 / 2000 ms, `DURATION` 于第 12 行
- 分镜:
  - `DashboardGlowHighlightPill.tsx:12` `export const DASHBOARD_GLOW_HIGHLIGHT_PILL_DURATION = 60; // 2000ms @30fps`
  - `DashboardGlowHighlightPill.tsx:15` `const OB_ROWS = Array.from({ length: 7 }, (_, i) => ({`
  - `DashboardGlowHighlightPill.tsx:50` `const MW = 24.5, MH = 40, MCX = 48.4, MCY = 47; // % of root`
  - `DashboardGlowHighlightPill.tsx:51` `const MRAD = 5; // 弹窗圆角（px），描边共用`
  - `DashboardGlowHighlightPill.tsx:52` `const RW = 480, RH = 270;`
  - `DashboardGlowHighlightPill.tsx:53` `const BW = (RW * MW) / 100, BH = (RH * MH) / 100; // 弹窗盒子像素尺寸`
  - `DashboardGlowHighlightPill.tsx:54` `const BO = 0.5; // 描边压在 1px 边框中线上`
  - `DashboardGlowHighlightPill.tsx:56` `const SX = ((44.1 - (MCX - MW / 2)) / MW) * BW;`
  - `DashboardGlowHighlightPill.tsx:70` `const P_L = 100;`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 没有帧采样. 当静态夹具.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/effects/fui-hud-moves/LineUnfoldPanel

- 镜头卡: `references/shots/effects/fui-hud-moves.md`
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `LineUnfoldPanel.tsx:10` `const PANEL_W = 760;`
  - `LineUnfoldPanel.tsx:11` `const PANEL_H = 460;`
  - `LineUnfoldPanel.tsx:12` `const CX = 960;`
  - `LineUnfoldPanel.tsx:13` `const CY = 540;`
  - `LineUnfoldPanel.tsx:16` `const T0 = 12; // 点亮起点`
  - `LineUnfoldPanel.tsx:17` `const LINE_END = T0 + 5; // 线抽出完成 f17`
  - `LineUnfoldPanel.tsx:18` `const UNFOLD_END = LINE_END + 9; // 面板撑开完成 f26`
  - `LineUnfoldPanel.tsx:19` `const CONTENT_END = UNFOLD_END + 8; // 内容淡入完成 f34`
  - `LineUnfoldPanel.tsx:22` `const OUT0 = 78; // 开始压扁`
  - `LineUnfoldPanel.tsx:23` `const COLLAPSE_END = OUT0 + 7; // 压成线 f85`
  - `LineUnfoldPanel.tsx:24` `const SHRINK_END = COLLAPSE_END + 6; // 线缩成点 f91`
  - `LineUnfoldPanel.tsx:25` `const OFF = SHRINK_END + 4; // 点熄灭 f95`
  - `LineUnfoldPanel.tsx:33` `const inSX = interpolate(frame, [T0, LINE_END], [0.004, 1], {`
  - `LineUnfoldPanel.tsx:34` `easing: Easing.out(Easing.poly(4)),`
  - `LineUnfoldPanel.tsx:38` `const inSY = interpolate(frame, [LINE_END, UNFOLD_END], [3 / PANEL_H, 1], {`
  - `LineUnfoldPanel.tsx:39` `easing: Easing.out(Easing.cubic),`
  - `LineUnfoldPanel.tsx:43` `const contentOp = interpolate(frame, [UNFOLD_END - 3, CONTENT_END], [0, 1], {`
  - `LineUnfoldPanel.tsx:44` `easing: Easing.out(Easing.quad),`
  - `LineUnfoldPanel.tsx:49` `const outSY = interpolate(frame, [OUT0, COLLAPSE_END], [1, 3 / PANEL_H], {`
  - `LineUnfoldPanel.tsx:50` `easing: Easing.in(Easing.cubic),`
  - `LineUnfoldPanel.tsx:53` `const outSX = interpolate(frame, [COLLAPSE_END, SHRINK_END], [1, 0.004], {`
  - `LineUnfoldPanel.tsx:54` `easing: Easing.in(Easing.poly(4)),`
  - (运动行 25 条, 留前 22 条, 文件 125 行已逐行扫过)
- 卡片参数:
  - `fui-hud-moves.md:5` `时长: 2–3s（demo 90f）`
  - `fui-hud-moves.md:6` `能量: 中高（咬合帧是打击点）`
  - `fui-hud-moves.md:18` `| A reticle-lock-on | 四 L 角=同一对矩形四份镜像，飞入（10f out cubic）与收缩（2.2×→0.94×→1 超调回弹）解耦；咬合帧目标微亮+标签 back 弹出 | 目标点名；踩音效重拍 |`
  - `fui-hud-moves.md:25` `| 咬合帧 | 目标白 overlay 快闪 0.55→停 0.28 + 标签同帧弹出 | 微亮与标签错帧就散了 |`
  - `fui-hud-moves.md:31` `- 声音：咬合帧一声"咔"（机械 click 而非游戏 UI 音，S1 边界内）`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/effects/icon-performance-moves/PopBurstConfirm

- 镜头卡: `references/shots/effects/icon-performance-moves.md`
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `PopBurstConfirm.tsx:12` `const AMBER = '#b45309';`
  - `PopBurstConfirm.tsx:13` `const POP = 27; // 释放帧`
  - `PopBurstConfirm.tsx:14` `const DUR = 120;`
  - `PopBurstConfirm.tsx:23` `return interpolate(f, [20, 23], [1, 0.6], { easing: Easing.in(Easing.quad) });`
  - `PopBurstConfirm.tsx:26` `return interpolate(f, [POP, 33], [0.6, 1.35], { easing: Easing.out(Easing.cubic) });`
  - `PopBurstConfirm.tsx:27` `return interpolate(f, [33, 44], [1.35, 1], {`
  - `PopBurstConfirm.tsx:29` `easing: Easing.out(Easing.back(2)),`
  - `PopBurstConfirm.tsx:34` `const checkT = interpolate(f, [POP, POP + 8], [0, 1], {`
  - `PopBurstConfirm.tsx:37` `easing: Easing.out(Easing.cubic),`
  - `PopBurstConfirm.tsx:41` `const pt = interpolate(f, [POP, POP + 14], [0, 1], {`
  - `PopBurstConfirm.tsx:45` `const pDist = 210 + 190 * Easing.out(Easing.cubic)(pt);`
  - `PopBurstConfirm.tsx:49` `const rt = interpolate(f, [POP, POP + 20], [0, 1], {`
  - `PopBurstConfirm.tsx:53` `const ringR = 200 + 300 * Easing.out(Easing.cubic)(rt);`
  - `PopBurstConfirm.tsx:58` `const tagT = interpolate(f, [40, 50], [0, 1], {`
  - `PopBurstConfirm.tsx:61` `easing: Easing.out(Easing.back(2.6)),`
  - `PopBurstConfirm.tsx:64` `const CX = 960;`
  - `PopBurstConfirm.tsx:65` `const CY = 470;`
- 卡片参数:
  - `icon-performance-moves.md:5` `时长: 156f（5.2s）`
  - `icon-performance-moves.md:21` `| A attention-bounce | 抛体弹跳（时长 ∝ √高度）递增 + 空中速度拉伸 + 落地 2f 挤压 + 涟漪溅点，邻居 rack focus 失焦，峰值跳镜头 scale 1.08 推近，落定触发角标 + 面板弹簧展开 | 新功能引出："看我"→镜头看它→它开面板 |`
  - `icon-performance-moves.md:27` `| 递增弹跳 | 4 跳 0.35→0.6→0.85→1.2 倍 icon 高，空中 14/18/22/26f（∝ √高度） | 等高连跳读作 loading；递增才是"越喊越大声"；时长不随高度变读作失重 |`
  - `icon-performance-moves.md:28` `| 落地挤压 | 接触 2f，压扁量 0.1→0.2 递增（末跳宽 1.2x 高 0.8x），末跳阻尼余弦回稳 | squash 缺席=没有重量 |`
  - `icon-performance-moves.md:29` `| 镜头推近 | 末跳 72–90f smooth 推 8%；邻居 30–96f 失焦到 7px、降饱和 30% | 镜头动作把"被吸引"的观众视角演出来 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/effects/light-play-moves/HalationBloom

- 镜头卡: `references/shots/effects/light-play-moves.md`
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `HalationBloom.tsx:9` `const BG = '#2a2a28';`
  - `HalationBloom.tsx:10` `const WHITE = '#f7f7f5';`
  - `HalationBloom.tsx:11` `const MID = '#8f8f8d';`
  - `HalationBloom.tsx:14` `const ZOOM_START = 8; // 入场起始`
  - `HalationBloom.tsx:15` `const IMPACT = 15; // 撞停帧（7f 急速缩入）`
  - `HalationBloom.tsx:16` `const REBOUND_END = 17; // 2f 回弹`
  - `HalationBloom.tsx:17` `const POP_END = IMPACT + 6; // 晕层猛涨 6f → f21`
  - `HalationBloom.tsx:18` `const FALL_END = POP_END + 20; // 20f 线性回落 → f41`
  - `HalationBloom.tsx:19` `const SETTLE_END = FALL_END + 15; // 15f 缓收 → f56，此后全静止`
  - `HalationBloom.tsx:42` `const zoomIn = interpolate(frame, [ZOOM_START, IMPACT], [2.4, 0.94], {`
  - `HalationBloom.tsx:43` `easing: Easing.in(Easing.quad),`
  - `HalationBloom.tsx:47` `const rebound = interpolate(frame, [IMPACT, REBOUND_END], [0.94, 1], {`
  - `HalationBloom.tsx:48` `easing: Easing.out(Easing.quad),`
  - `HalationBloom.tsx:53` `const textOpacity = interpolate(frame, [ZOOM_START, ZOOM_START + 3], [0, 1], {`
  - `HalationBloom.tsx:60` `const bloomScale = interpolate(frame, [IMPACT, POP_END], [1, 1.3], {`
  - `HalationBloom.tsx:61` `easing: Easing.out(Easing.cubic),`
  - `HalationBloom.tsx:66` `const bloomFall = interpolate(frame, [POP_END, FALL_END], [1, 0.35], {`
  - `HalationBloom.tsx:71` `const bloomSettle = interpolate(frame, [FALL_END, SETTLE_END], [0.35, 0.22], {`
  - `HalationBloom.tsx:72` `easing: Easing.out(Easing.quad),`
- 卡片参数:
  - `light-play-moves.md:5` `时长: A 170f ~5.7s / B 150f ~5s`
  - `light-play-moves.md:28` `| A 光斑 | ellipse 360px（硬芯+长软边），钟摆：x = 960+600·sin θ·env，θ 从 −π/2（最左）起、周期 50f、走 2.25 个周期至 f121；y 走下凹弧（中心最低 44px）；env 第一来回后 smooth 收到 0，x 与速度在 f121 同时归零（纯 sin 会在中心最快时急刹）；开灯 4–10f 钨丝预热闪两下 | f121–141 iris 张开 360→1080px 全亮（ou...`
  - `light-play-moves.md:29` `| B 高光带 | 宽 2×卡宽，115° 渐变：宽柔光 0.14 + 窄亮芯 0.5（暖白，screen），58–90f swift 扫一次；同段卡 rotateY 21°→14°（转向光源 = 扫光的物理动机）；光带下拉丝纹与蚀刻字的亮版副本被同一遮罩揭开 | 0.5 芯在钛黑上足够响又不糊；双向 clamp + 条件挂载保证只扫一次 |`
  - `light-play-moves.md:30` `| 摘罩 | 扫光（B）条件挂载，扫完即卸载；A 光锥收成常驻柔和顶光 | opacity 0 残留层照样每帧合成——不用的光效层直接卸载 |`
  - `light-play-moves.md:31` `| 收尾 | A ~30f / B ~55f hold；hold 段只留极缓运动（A 浮尘与顶光呼吸、B 卡 rotateY 再转 1.5°） | 不加手持抖动（Q3） |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/effects/line-boil/LineBoil

- 镜头卡: 无
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `LineBoil.tsx:14` `const BOIL_START = 35;`
  - `LineBoil.tsx:15` `const BOIL_END = 105;`
  - `LineBoil.tsx:16` `const BOIL_SCALE = 8; // 原案 3–6 已按可感性加码；QA 看不出再加到 12`
  - `LineBoil.tsx:50` `const onOp = interpolate(f, [35, 40, 100, 105], [0, 1, 1, 0], {`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/effects/riso-print-hits/RisoBeatPump

- 镜头卡: `references/shots/effects/riso-print-hits.md`
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `RisoBeatPump.tsx:11` `const HITS = [30, 54, 78, 102]; // 节拍命中帧`
  - `RisoBeatPump.tsx:12` `const AMP = [4, 7, 11, 16]; // 每拍单版初始错位（px），逐拍加码`
  - `RisoBeatPump.tsx:13` `const PUMP_WIN = 14; // scale 泵窗口：14f 后精确归 1（保证结尾真静止）`
  - `RisoBeatPump.tsx:14` `const SPLIT_WIN = 12; // 错位窗口：12f 后精确归 0（余量 <0.4px，硬切套准）`
- 卡片参数:
  - `riso-print-hits.md:3` `一句话: 套印错位冲击帧——riso-misregistration-hit 单发：标题撞停瞬间裂成双色 riso 印版，抖两下"啪"地套准`
  - `riso-print-hits.md:5` `时长: 4s（120f，单发）`
  - `riso-print-hits.md:22` `| misregistration-hit 单发 | 标题 8f 撞入撞停，裂两版反向错 ~40px，44f 衰减震荡后硬切套准 + scale 脉冲 + 「ON REGISTER」圆章盖下 | 全片 1–2 次的命中盖章；标题/大字的到位一瞬 |`
  - `riso-print-hits.md:27` `| 双版 | 两色 riso 油墨：荧光粉 #ff4fa3 + 蓝 #1f5fc4（套准叠成深紫）。'mix-blend-mode: multiply' 叠在再生纸（#f3eee2 + 静态纸纤维/油墨颗粒）上，位移反向；套准即两版归零重合 | multiply 叠出的重影就是"油墨没对准"；screen 叠加立刻变荧光故障；两版选互补色相、套准后叠成近黑最好，别用纯灰（读作阴影） |`
  - `riso-print-hits.md:28` `| 错位包络 | 'offset = A·cos(2πt/18)·exp(-t/60)'，A=(20,8)px 两版反向（300px 标题）；帧 72 硬切归零 | 命门：套准是**硬切跳变**不是渐收——衰减到 ~11px 残余时啪地归零才有"啪"；纯渐收读不出套准一拍 |`
  - `riso-print-hits.md:29` `| 撞入 | 8f Easing.in(cubic) 从画外撞停，命中帧即裂版 | 裂版必须与撞停同帧——晚 2f 就读作两件事 |`
  - `riso-print-hits.md:30` `| 套准脉冲 | 归零帧 4f scale 1.03→1；同帧圆章 scale 1.5→1 盖下；命中帧整页 1.2% 顿挫 10f 回落 | 盖章的一拍；省略则套准无重量 |`
  - `riso-print-hits.md:32` `| 收尾 | 套准后 ≥40f 真静止 | R1 |`
  - `riso-print-hits.md:40` `- 本卡与 impact-feedback C（负片冲击帧）语义重叠——纸墨调性片子用本卡、`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/interaction/ai-stream-response/StreamResponse

- 镜头卡: 无
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `StreamResponse.tsx:12` `const ROW_CUES = [42, 53, 63, 72, 80, 87, 93];`
  - `StreamResponse.tsx:24` `const ease = Easing.bezier(0.2, 0.75, 0.25, 1);`
  - `StreamResponse.tsx:27` `const ringOpacity = interpolate(progress, [0, 0.45, 0.75], [0.36, 1, 0], clamp);`
  - `StreamResponse.tsx:28` `const checkOpacity = interpolate(progress, [0.62, 1], [0, 1], clamp);`
  - `StreamResponse.tsx:29` `const checkScale = interpolate(progress, [0.62, 1], [0.72, 1], {...clamp, easing: ease});`
  - `StreamResponse.tsx:60` `const body = interpolate(frame, [cue, cue + 12], [0, 1], {...clamp, easing: ease});`
  - `StreamResponse.tsx:61` `const status = interpolate(frame, [cue + 3, cue + 11], [0, 1], {...clamp, easing: ease});`
  - `StreamResponse.tsx:84` `const panelIn = interpolate(frame, [0, 16], [0, 1], {...clamp, easing: ease});`
  - `StreamResponse.tsx:85` `const summary = interpolate(frame, [18, 30], [0, 1], {...clamp, easing: ease});`
  - `StreamResponse.tsx:86` `const camera = interpolate(frame, [0, 100], [1.04, 1], {...clamp, easing: ease});`
  - `StreamResponse.tsx:87` `const pulse = interpolate(frame, [110, 115, 120], [0.25, 0.55, 0.25], clamp);`
  - `StreamResponse.tsx:88` `const complete = interpolate(frame, [110, 120], [0, 1], {...clamp, easing: ease});`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/interaction/chip-lift-to-user-pill/ChipLiftToUserPill

- 镜头卡: 无
- 时长: 150 帧 / 5000 ms, `DURATION` 于第 9 行
- 分镜:
  - `ChipLiftToUserPill.tsx:9` `export const CHIP_LIFT_TO_USER_PILL_DURATION = 150; // 5000ms @30fps`
  - `ChipLiftToUserPill.tsx:13` `const BG = '#F1F1F3'; // 页面浅灰`
  - `ChipLiftToUserPill.tsx:14` `const INK = '#0B0B0C'; // 纯黑`
  - `ChipLiftToUserPill.tsx:15` `const TXT = '#111111'; // 正文黑`
  - `ChipLiftToUserPill.tsx:16` `const DIM = '#C9C9CE'; // 浅灰占位字`
  - `ChipLiftToUserPill.tsx:17` `const LINE = '#E6E6EA'; // 描边`
  - `ChipLiftToUserPill.tsx:28` `const COLS = 4, ROWS = 3, CW = 40, CH = 24, GX = 10, GY = 9, GX0 = 8, GY0 = 70;`
  - `ChipLiftToUserPill.tsx:29` `const TC = 1, TR = 1; // 目标 chip 的列/行`
  - `ChipLiftToUserPill.tsx:32` `const TX = GX0 + TC * (CW + GX); // 58`
  - `ChipLiftToUserPill.tsx:33` `const TY = GY0 + TR * (CH + GY); // 103`
  - `ChipLiftToUserPill.tsx:46` `const PW0 = CW, PW1 = 190; // 药丸生长的起止宽度`
  - `ChipLiftToUserPill.tsx:51` `const CAP_ST = 0.78 / CAP_WORDS.length;`
  - `ChipLiftToUserPill.tsx:52` `const CAP_WIN = CAP_ST * 1.5;`
  - `ChipLiftToUserPill.tsx:55` `const BADGE_SIZE = 26;`
  - `ChipLiftToUserPill.tsx:56` `const BADGE_SVG = Number((BADGE_SIZE * 0.52).toFixed(1)); // 13.5`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 没有帧采样. 当静态夹具.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/interaction/collab-cursor-moves/CursorDialogueDuet

- 镜头卡: `references/shots/interaction/collab-cursor-moves.md`
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `CursorDialogueDuet.tsx:7` `const BLUE = '#4C8DF6';`
  - `CursorDialogueDuet.tsx:8` `const GREEN = '#2FBF71';`
  - `CursorDialogueDuet.tsx:9` `const DARK = '#101012';`
  - `CursorDialogueDuet.tsx:56` `const CX = 960; const CY = 520;`
  - `CursorDialogueDuet.tsx:87` `dx = interpolate(t, [0, 1], [dx, -320]);`
  - `CursorDialogueDuet.tsx:88` `dy = interpolate(t, [0, 1], [dy, 1240]);`
  - `CursorDialogueDuet.tsx:114` `gx = interpolate(blow, [0, 1], [gx, -160]);`
  - `CursorDialogueDuet.tsx:115` `gy = interpolate(blow, [0, 1], [gy, -140]);`
- 卡片参数:
  - `collab-cursor-moves.md:5` `时长: A ~5.2s（156f）`
  - `collab-cursor-moves.md:19` `| A cast-ensemble | 5 枚具名彩色光标错峰 spring 飞入 video-shotcraft 的分镜白板（头像组同帧弹出、便签带作者色）→双频正弦漂移驻场→一枚挂在插入点上打出简报卡标题→结尾全员 smooth 聚拢围观 | 画布/白板类产品全片氛围层；主内容之外需要"别人也在"的背景活性 |`
  - `collab-cursor-moves.md:24` `| A 入场 | 5 枚 delay 2/7/11/16/22f 错峰，spring(damping 15, stiffness 80)；名牌晚 10f 淡入+上浮 12px；右上头像组同帧弹出（槽宽随弹出长） | 名牌跟光标同帧出现读作贴纸；随减速淡入才是"人到了自报家门" |`
  - `collab-cursor-moves.md:26` `| A 打字 cameo | 48–104f 打 29 字（1.6–2.4f/字确定性抖动，空格后多停 0.9f）；光标箭头挂在行内插入点锚点上，换行也跟着走；打字时手稳（漂移压到 0） | 箭头和插入点分开算位置必错位；行内零宽锚点让浏览器排版替你算 |`
  - `collab-cursor-moves.md:27` `| A 聚拢 | 98f 起 28f smooth 到卡片四周围观位（不压标题和眉题），漂移幅度衰减到 25% 保留 | 聚拢后漂移不能归零——完全静止的光标群读作死机 |`
  - `collab-cursor-moves.md:33` `- 换标题文案时保持字数与空格数，打字节奏（每字抖动按下标取、空格多停）与收尾帧才不变`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/interaction/command-palette-summon/CommandPaletteSummon

- 镜头卡: 无
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `CommandPaletteSummon.tsx:12` `const DIM0 = 12; // 压暗开始（前 12f 初始静置）`
  - `CommandPaletteSummon.tsx:13` `const DIM1 = 22;`
  - `CommandPaletteSummon.tsx:14` `const PANEL_IN = 18; // 面板开始弹落`
  - `CommandPaletteSummon.tsx:15` `const ROWS_START = 32; // 候选行开始错峰浮现`
  - `CommandPaletteSummon.tsx:16` `const KEY1 = 62; // 第一个字母`
  - `CommandPaletteSummon.tsx:17` `const KEY2 = 78; // 第二个字母`
  - `CommandPaletteSummon.tsx:18` `const HL = 94; // 高亮首条`
  - `CommandPaletteSummon.tsx:19` `const BLINK_END = 104; // 光标停止闪烁（常亮）`
  - `CommandPaletteSummon.tsx:21` `const PANEL_W = 780;`
  - `CommandPaletteSummon.tsx:22` `const PANEL_X = (1920 - PANEL_W) / 2;`
  - `CommandPaletteSummon.tsx:23` `const PANEL_Y = 290;`
  - `CommandPaletteSummon.tsx:24` `const ROW_H = 72;`
  - `CommandPaletteSummon.tsx:25` `const ROW_GAP = 8;`
  - `CommandPaletteSummon.tsx:26` `const EXIT_DUR = 10;`
  - `CommandPaletteSummon.tsx:44` `const inOp = interpolate(frame, [inStart, inStart + 8], [0, 1], CL);`
  - `CommandPaletteSummon.tsx:45` `const inY = interpolate(frame, [inStart, inStart + 8], [12, 0], {`
  - `CommandPaletteSummon.tsx:46` `easing: Easing.out(Easing.cubic),`
  - `CommandPaletteSummon.tsx:52` `: interpolate(frame, [exitStart, exitStart + EXIT_DUR], [1, 0], {`
  - `CommandPaletteSummon.tsx:53` `easing: Easing.inOut(Easing.cubic),`
  - `CommandPaletteSummon.tsx:58` `const hl = i === 0 ? interpolate(frame, [HL, HL + 10], [0, 1], CL) : 0;`
  - `CommandPaletteSummon.tsx:94` `const dim = interpolate(frame, [DIM0, DIM1], [0, 0.45], CL);`
  - `CommandPaletteSummon.tsx:95` `const blur = interpolate(frame, [DIM0, DIM1], [0, 10], CL);`
  - (运动行 27 条, 留前 22 条, 文件 173 行已逐行扫过)
- 卡片参数:
  - 无对应镜头卡
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/interaction/input-trigger-moves/CursorPerformancePunchIn

- 镜头卡: 无
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `CursorPerformancePunchIn.tsx:20` `const BTN = { x: 1560, y: 130, w: 200, h: 64 };`
  - `CursorPerformancePunchIn.tsx:21` `const CLICK = { x: 1665, y: 168 };`
  - `CursorPerformancePunchIn.tsx:24` `const P0 = { x: 180, y: 1000 };`
  - `CursorPerformancePunchIn.tsx:25` `const P1 = { x: 820, y: 1075 };`
  - `CursorPerformancePunchIn.tsx:26` `const P2 = { x: 1795, y: 560 };`
  - `CursorPerformancePunchIn.tsx:27` `const P3 = { x: CLICK.x, y: CLICK.y };`
  - `CursorPerformancePunchIn.tsx:64` `? interpolate(frame, [0, 24], [0, 1.05], {`
  - `CursorPerformancePunchIn.tsx:66` `easing: Easing.out(Easing.cubic),`
  - `CursorPerformancePunchIn.tsx:68` `: interpolate(frame, [24, T.cursorInEnd], [1.05, 1], {`
  - `CursorPerformancePunchIn.tsx:70` `easing: Easing.inOut(Easing.quad),`
  - `CursorPerformancePunchIn.tsx:74` `const dip = interpolate(frame, [T.click, T.click + 2, T.click + 6], [0, 3, 0], {`
  - `CursorPerformancePunchIn.tsx:79` `const lift = interpolate(frame, [T.cursorInEnd, T.cursorInEnd + 4], [0, 1], {`
  - `CursorPerformancePunchIn.tsx:86` `const press = interpolate(frame, [T.click, T.click + 2, T.click + 6], [1, 0.94, 1], {`
  - `CursorPerformancePunchIn.tsx:93` `? interpolate(frame, [T.click, T.punchEnd], [1, 1.4], {`
  - `CursorPerformancePunchIn.tsx:95` `easing: Easing.out(Easing.cubic),`
  - `CursorPerformancePunchIn.tsx:97` `: interpolate(frame, [T.holdEnd, T.backEnd], [1.4, 1], {`
  - `CursorPerformancePunchIn.tsx:99` `easing: Easing.inOut(Easing.cubic),`
  - `CursorPerformancePunchIn.tsx:104` `const rippleD = interpolate(frame, [T.click, T.click + 22], [60, 380], {`
  - `CursorPerformancePunchIn.tsx:106` `easing: Easing.out(Easing.cubic),`
  - `CursorPerformancePunchIn.tsx:108` `const rippleOp = interpolate(frame, [T.click, T.click + 26], [0.9, 0], {`
  - `CursorPerformancePunchIn.tsx:111` `const rippleBw = interpolate(frame, [T.click, T.click + 22], [9, 3], {`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/interaction/input-trigger-moves/KeycapSmashCut

- 镜头卡: 无
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `KeycapSmashCut.tsx:105` `const p = interpolate(frame, [s, e], [0, 1], {`
  - `KeycapSmashCut.tsx:107` `easing: Easing.in(Easing.quad),`
  - `KeycapSmashCut.tsx:149` `const pressY = interpolate(frame, [T.press, T.pressEnd], [0, 14], {`
  - `KeycapSmashCut.tsx:153` `const thick = interpolate(frame, [T.press, T.pressEnd], [12, 3], {`
  - `KeycapSmashCut.tsx:156` `const bright = interpolate(frame, [T.press, T.pressEnd], [1, 0.9], {`
  - `KeycapSmashCut.tsx:162` `const ringD = interpolate(frame, [T.press, T.ringGrowEnd], [90, 640], {`
  - `KeycapSmashCut.tsx:164` `easing: Easing.out(Easing.cubic),`
  - `KeycapSmashCut.tsx:166` `const ringA = interpolate(frame, [T.press, T.ringFadeEnd], [0.9, 0], {`
  - `KeycapSmashCut.tsx:169` `const ringBorder = interpolate(frame, [T.press, T.ringGrowEnd], [14, 3], {`
  - `KeycapSmashCut.tsx:171` `easing: Easing.out(Easing.cubic),`
  - `KeycapSmashCut.tsx:175` `const bgScale = interpolate(frame, [T.pressEnd, T.cut], [1, 1.3], {`
  - `KeycapSmashCut.tsx:177` `easing: Easing.in(Easing.quad),`
  - `KeycapSmashCut.tsx:179` `const bgRot = interpolate(frame, [T.pressEnd, T.cut], [0, 1.5], {`
  - `KeycapSmashCut.tsx:181` `easing: Easing.in(Easing.quad),`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/outro/edit-hook-moves/LogoStingButton

- 镜头卡: 无
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `LogoStingButton.tsx:50` `const dark = interpolate(frame, [T.darkenStart, T.shotAEnd - 1], [0, 1], {`
  - `LogoStingButton.tsx:52` `easing: Easing.in(Easing.cubic),`
  - `LogoStingButton.tsx:97` `const opacity = interpolate(frame, [T.blackEnd, T.logoInEnd], [0, 1], {`
  - `LogoStingButton.tsx:99` `easing: Easing.out(Easing.cubic),`
  - `LogoStingButton.tsx:101` `const scale = interpolate(frame, [T.blackEnd, T.logoInEnd], [0.96, 1], {`
  - `LogoStingButton.tsx:103` `easing: Easing.out(Easing.cubic),`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/rhythm/beat-cut-moves/BeatCutAccelerando

- 镜头卡: `references/shots/rhythm/beat-cut-moves.md`
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `BeatCutAccelerando.tsx:23` `const CUTS = [0, 49, 65, 77, 85, 91, 95];`
  - `BeatCutAccelerando.tsx:24` `const FINAL = 95; // 最后一切：戛然定格回主画面`
  - `BeatCutAccelerando.tsx:55` `? interpolate(frame, [FINAL, FINAL + 20], [1, 1.06], {`
  - `BeatCutAccelerando.tsx:58` `easing: Easing.out(Easing.cubic),`
- 卡片参数:
  - `beat-cut-moves.md:5` `时长: 全程 140f ≈4.7s（活素材 30f + 三闪 + hold 70f）`
  - `beat-cut-moves.md:14` `三次白闪、间隔渐紧（22f→18f），读作快门连拍（A）。与 R 系不`
  - `beat-cut-moves.md:15` `冲突：R 管落定后的停，本卡管切点排布，切串结束必须接足量 hold 把`
  - `beat-cut-moves.md:17` `串切得越狠，切完的 hold 要比平常更长。`
  - `beat-cut-moves.md:27` `| 三闪切点 | 30/52/70（间隔 22f→18f 渐紧），闪前 30f 慢推"活素材"（背板上别家相机的小闪光）衬托闪后定格 | 闪前必须是活的，全片死素材三闪读不出"定格" |`
  - `beat-cut-moves.md:28` `| 白闪层 | 每闪 opacity 0.95→0 走 4f ease-out 衰减；闪帧 ±2px seed 哈希全屏抖动 | 0.95 起步才有闪光灯的爆点；衰减 >6f 变柔光转场，失去快门感 |`
  - `beat-cut-moves.md:29` `| 快门余韵 | 切入视图 scale 1.03→1 走 6f ease-out 回落 + −16px 沉降归零 | 余韵是"被拍到晃了一下"；去掉后三闪读作幻灯片翻页 |`
  - `beat-cut-moves.md:31` `| 对焦预备 | 下一闪前 8f 对焦框从 1.3 倍收到下一张裁切范围（屏幕坐标投影），闪前 3f 转香槟色锁定 | 这是"预备拍"：观众提前知道下一张拍哪里，闪光才像被按下的快门 |`
  - `beat-cut-moves.md:32` `| 末段收束 | 第三闪后特写 hold 70f，只有 1→1.015 极缓推近 + HUD「SAVED」淡入 | 三闪是重击，hold 要给足平常两倍以上；定格是照片，不加画内运动 |`
  - `beat-cut-moves.md:38` `无声版只剩画面乱跳；钉帧走 sound-design.md §4.5 相对 shot 起点，不钉绝对帧`
  - `beat-cut-moves.md:43` `- 节奏偏好判例是单向"放慢"，本卡是刻意例外——切完的 hold（70f）`
  - `beat-cut-moves.md:45` `- 真硬切 = frame 落区间渲染对应视图，无任何过渡帧；手滑加 2f 交叉`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/rhythm/montage-rhythm-moves/DominoCascade

- 镜头卡: 无
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `DominoCascade.tsx:7` `// ③ 帧 78–100 左侧深色侧边栏被横向撞滑进场，Easing.out(cubic) 带过冲回弹；帧 100–150 全体真静止。`
  - `DominoCascade.tsx:12` `const easeInCubic = Easing.in(Easing.cubic);`
  - `DominoCascade.tsx:13` `const easeOutCubic = Easing.out(Easing.cubic);`
  - `DominoCascade.tsx:16` `const TITLE_START = 36; // 砸落开始（前 36f hold 读布景）`
  - `DominoCascade.tsx:17` `const IMPACT_1 = 51; // 标题落地 = 第一次撞击`
  - `DominoCascade.tsx:18` `const CARD_STAGGER = 5;`
  - `DominoCascade.tsx:19` `const CARD_DUR = 12;`
  - `DominoCascade.tsx:20` `const IMPACT_2 = IMPACT_1 + 3 * CARD_STAGGER + CARD_DUR; // 78，末卡落地`
  - `DominoCascade.tsx:21` `const SIDE_END = IMPACT_2 + 14; // 92 侧边栏到位（过冲点）`
  - `DominoCascade.tsx:22` `const SIDE_SETTLE = SIDE_END + 8; // 100 回弹结束，此后真静止`
  - `DominoCascade.tsx:32` `const CARD_W = 340;`
  - `DominoCascade.tsx:33` `const CARD_H = 220;`
  - `DominoCascade.tsx:34` `const GAP = 40;`
  - `DominoCascade.tsx:35` `const ROW_W = 4 * CARD_W + 3 * GAP; // 1480`
  - `DominoCascade.tsx:36` `const ROW_LEFT = 1080 - ROW_W / 2; // 340`
  - `DominoCascade.tsx:37` `const CARD_TOP = 700; // 卡片底边 920，落在地板线上`
  - `DominoCascade.tsx:43` `const titleTop = interpolate(frame, [TITLE_START, IMPACT_1], [-260, 240], {`
  - `DominoCascade.tsx:59` `const lastCardRot = interpolate(`
  - `DominoCascade.tsx:75` `sideX = 12 * (1 - Easing.inOut(Easing.quad)(t));`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/rhythm/montage-rhythm-moves/DropBlackoutSlam

- 镜头卡: 无
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `DropBlackoutSlam.tsx:17` `const BLACK_IN = 50; // 切黑帧`
  - `DropBlackoutSlam.tsx:18` `const SLAM = 62; // 爆入帧`
  - `DropBlackoutSlam.tsx:29` `const beatOn = interpolate(beatPhase, [0, 1, 5], [0.25, 1, 0.25], {`
  - `DropBlackoutSlam.tsx:33` `const beatScale = interpolate(beatPhase, [0, 1, 5], [1, 1.5, 1], {`
  - `DropBlackoutSlam.tsx:69` `const slamScale = interpolate(t, [0, 5], [1.35, 1], {`
  - `DropBlackoutSlam.tsx:70` `easing: Easing.out(Easing.cubic),`
  - `DropBlackoutSlam.tsx:81` `const ringR = interpolate(t, [0, 16], [80, 900], {`
  - `DropBlackoutSlam.tsx:82` `easing: Easing.out(Easing.cubic),`
  - `DropBlackoutSlam.tsx:86` `const ringOpacity = interpolate(t, [0, 3, 16], [0.85, 0.55, 0], {`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 含 random 或 noise, 网页进度函数不能依赖它, 要换成种子或删掉.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/rhythm/montage-rhythm-moves/WrightTripleCut

- 镜头卡: 无
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `WrightTripleCut.tsx:11` `const HOLD_END = 25; // 全景 hold 结束`
  - `WrightTripleCut.tsx:12` `const C1 = 25; // 特写一:光标按下`
  - `WrightTripleCut.tsx:13` `const C2 = 35; // 特写二:开关`
  - `WrightTripleCut.tsx:14` `const C3 = 45; // 特写三:翻牌`
  - `WrightTripleCut.tsx:15` `const WHIP = 55; // 甩回全景`
  - `WrightTripleCut.tsx:31` `const RESULT = { left: 808, top: 108, w: 524, h: 454 };`
  - `WrightTripleCut.tsx:44` `const p = interpolate(t, [4, 7], [0, 1], {`
  - `WrightTripleCut.tsx:45` `easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp',`
  - `WrightTripleCut.tsx:77` `const p = interpolate(t, [4, 7], [0, 1], {`
  - `WrightTripleCut.tsx:78` `easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp',`
  - `WrightTripleCut.tsx:102` `const p = interpolate(t, [4, 7], [0, 1], {`
  - `WrightTripleCut.tsx:103` `easing: Easing.inOut(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp',`
  - `WrightTripleCut.tsx:132` `const whipX = t >= 6 ? 0 : interpolate(t, [0, 6], [900, 0], {`
  - `WrightTripleCut.tsx:133` `easing: Easing.out(Easing.poly(5)), extrapolateLeft: 'clamp', extrapolateRight: 'clamp',`
  - `WrightTripleCut.tsx:138` `const glow = interpolate(f, [57, 84], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });`
  - `WrightTripleCut.tsx:139` `const pop = f >= 64 ? 1 : interpolate(f, [57, 60, 64], [1, 1.07, 1], {`
  - `WrightTripleCut.tsx:140` `easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp',`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/rhythm/panel-grid-moves/FlipGridReflow

- 镜头卡: `references/shots/rhythm/panel-grid-moves.md`
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `FlipGridReflow.tsx:10` `const CARD_W = 280;`
  - `FlipGridReflow.tsx:11` `const CARD_H = 170;`
  - `FlipGridReflow.tsx:16` `const ROW_Y = 330;`
  - `FlipGridReflow.tsx:24` `const GC = [571.6, 960, 1348.4]; // 列中心`
  - `FlipGridReflow.tsx:25` `const GR = [416.2, 663.8]; // 行中心`
  - `FlipGridReflow.tsx:36` `const BEAT = 30; // 节拍点`
  - `FlipGridReflow.tsx:37` `const STAGGER = 1.5; // 每卡延迟`
  - `FlipGridReflow.tsx:38` `const MOVE = 16; // 飞行帧数`
  - `FlipGridReflow.tsx:39` `const SETTLE = 3; // 落定过冲帧数`
  - `FlipGridReflow.tsx:40` `const SCALE_END = 1.28;`
  - `FlipGridReflow.tsx:41` `const OVERSHOOT = 1.02;`
  - `FlipGridReflow.tsx:43` `const ALL_SETTLED = BEAT + (N - 1) * STAGGER + MOVE + SETTLE; // 56.5`
  - `FlipGridReflow.tsx:46` `const PULSE_IN = 58;`
  - `FlipGridReflow.tsx:47` `const PULSE_MID = 61;`
  - `FlipGridReflow.tsx:48` `const PULSE_OUT = 64;`
  - `FlipGridReflow.tsx:50` `const moveEase = Easing.inOut(Easing.cubic);`
  - `FlipGridReflow.tsx:57` `const x = interpolate(frame, [t0, t0 + MOVE], [x0, x1], {`
  - `FlipGridReflow.tsx:60` `const y = interpolate(frame, [t0, t0 + MOVE], [y0, y1], {`
  - `FlipGridReflow.tsx:65` `const sUp = interpolate(frame, [t0, t0 + MOVE], [1, SCALE_END * OVERSHOOT], {`
  - `FlipGridReflow.tsx:68` `const sBack = interpolate(frame, [t0 + MOVE, t0 + MOVE + SETTLE], [SCALE_END * OVERSHOOT, SCALE_END], {`
  - `FlipGridReflow.tsx:69` `easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp',`
  - `FlipGridReflow.tsx:97` `? interpolate(frame, [PULSE_IN, PULSE_MID, PULSE_OUT], [1, 0.78, 1], {`
- 卡片参数:
  - `panel-grid-moves.md:5` `时长: 156f ≈5.2s（全屏侧拍 20f + 三刀分格定格 + 吃屏 + 海报 hold）`
  - `panel-grid-moves.md:21` `| A comic-panel-split | 全屏 3/4 侧拍 20f → 三刀 12° 斜缝每 4f 一刀从上往下劈出，对应格硬切弹入（5f scale 1.07→1 + 白闪）；三格 = 同一主体的全身 / 局部特写 / 微距；定格 29f 靠主体自身动作保活；末格 2f 反向回拉 + 14f 扫屏吃掉全屏成海报 | 同一主体多视角并列；漫画感段落 |`
  - `panel-grid-moves.md:26` `| A 斜缝 | SVG 双线：墨边 + 奶油纸芯（总宽 18px），12° 斜角，每刀 3f 从上往下画出 | 斜缝纸芯是漫画感命门；直缝读作分屏工具 |`
  - `panel-grid-moves.md:29` `| 收尾 | 最后一行字揭示完后 ~50f 海报 hold（只留 1.5% 极缓推近） | R1；摘罩帧与吞屏终值逐像素对齐防跳变 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/rhythm/panel-grid-moves/GridFlashMosaic

- 镜头卡: `references/shots/rhythm/panel-grid-moves.md`
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `GridFlashMosaic.tsx:4` `// 填满后停 14f(整墙微呼吸 1.008) → 中心格 14f Easing.in(cubic) 放大吞掉全屏`
  - `GridFlashMosaic.tsx:15` `const CELL_W = 600;`
  - `GridFlashMosaic.tsx:16` `const CELL_H = 340;`
  - `GridFlashMosaic.tsx:17` `const GAP = 12;`
  - `GridFlashMosaic.tsx:18` `const GRID_X = (1920 - (CELL_W * 3 + GAP * 2)) / 2; // 48`
  - `GridFlashMosaic.tsx:19` `const GRID_Y = (1080 - (CELL_H * 3 + GAP * 2)) / 2; // 18`
  - `GridFlashMosaic.tsx:21` `const FILL_START = 25; // 第一格落下`
  - `GridFlashMosaic.tsx:22` `const STEP = 2; // 十六分音符：每 2f 一格`
  - `GridFlashMosaic.tsx:24` `const ORDER = Array.from({ length: 9 }, (_, i) => i).sort(`
  - `GridFlashMosaic.tsx:30` `const LAST_IN = FILL_START + 8 * STEP + 3; // 最后一格入格动画结束 f44`
  - `GridFlashMosaic.tsx:31` `const HOLD_END = LAST_IN + 14; // 整墙呼吸段结束 f58`
  - `GridFlashMosaic.tsx:32` `const ZOOM_DUR = 14;`
  - `GridFlashMosaic.tsx:33` `const ZOOM_END = HOLD_END + ZOOM_DUR; // f72，之后真静止`
  - `GridFlashMosaic.tsx:36` `const MINI_SCALE = CELL_W / 1920; // 0.3125`
  - `GridFlashMosaic.tsx:38` `const ZOOM_SCALE = 3.28;`
  - `GridFlashMosaic.tsx:105` `// 中心格放大：14f Easing.in(cubic)，吞掉全屏`
  - `GridFlashMosaic.tsx:106` `const zoom = interpolate(f, [HOLD_END, ZOOM_END], [1, ZOOM_SCALE], {`
  - `GridFlashMosaic.tsx:107` `easing: Easing.in(Easing.cubic),`
  - `GridFlashMosaic.tsx:136` `const popScale = interpolate(f, [start, start + 3], [1.18, 1], {`
  - `GridFlashMosaic.tsx:141` `const darken = interpolate(f, [start, start + 2], [0.45, 0], {`
- 卡片参数:
  - `panel-grid-moves.md:5` `时长: 156f ≈5.2s（全屏侧拍 20f + 三刀分格定格 + 吃屏 + 海报 hold）`
  - `panel-grid-moves.md:21` `| A comic-panel-split | 全屏 3/4 侧拍 20f → 三刀 12° 斜缝每 4f 一刀从上往下劈出，对应格硬切弹入（5f scale 1.07→1 + 白闪）；三格 = 同一主体的全身 / 局部特写 / 微距；定格 29f 靠主体自身动作保活；末格 2f 反向回拉 + 14f 扫屏吃掉全屏成海报 | 同一主体多视角并列；漫画感段落 |`
  - `panel-grid-moves.md:26` `| A 斜缝 | SVG 双线：墨边 + 奶油纸芯（总宽 18px），12° 斜角，每刀 3f 从上往下画出 | 斜缝纸芯是漫画感命门；直缝读作分屏工具 |`
  - `panel-grid-moves.md:29` `| 收尾 | 最后一行字揭示完后 ~50f 海报 hold（只留 1.5% 极缓推近） | R1；摘罩帧与吞屏终值逐像素对齐防跳变 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/rhythm/rhythm-interrupt-moves/StrobeBlackFrames

- 镜头卡: `references/shots/rhythm/rhythm-interrupt-moves.md`
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `StrobeBlackFrames.tsx:2` `// FakeDashboard A 全程缓慢推近蓄张力（scale 1.0→1.05，Easing.in(quad)，`
  - `StrobeBlackFrames.tsx:16` `const CARD_L = 220 + 36 + 524.67 + 28; // ≈808.67`
  - `StrobeBlackFrames.tsx:17` `const CARD_T = 72 + 36 + 454 + 28; // 590`
  - `StrobeBlackFrames.tsx:18` `const CARD_W = 524.67;`
  - `StrobeBlackFrames.tsx:19` `const CARD_H = 454;`
  - `StrobeBlackFrames.tsx:20` `const ORIGIN_X = CARD_L + CARD_W / 2; // ≈1071`
  - `StrobeBlackFrames.tsx:21` `const ORIGIN_Y = CARD_T + CARD_H / 2; // 817`
  - `StrobeBlackFrames.tsx:24` `const FLASHES = [40, 48, 55, 61, 66, 70, 73, 76, 79];`
  - `StrobeBlackFrames.tsx:29` `// 帧 81 前缓慢推近（Easing.in 蓄力），81 起零补间硬切 1.35 定住`
  - `StrobeBlackFrames.tsx:32` `? interpolate(f, [0, 80], [1.0, 1.05], {`
  - `StrobeBlackFrames.tsx:35` `easing: Easing.in(Easing.quad),`
- 卡片参数:
  - `rhythm-interrupt-moves.md:5` `时长: A 135f ≈4.5s`
  - `rhythm-interrupt-moves.md:18` `| A jump-cut-punch-in | transform-origin 钉目标中心，三档 scale 阶梯跳变（零补间），每跳 2f 加深脉冲当 tick | 逐级逼近核心指标；纪录片式盯住 |`
  - `rhythm-interrupt-moves.md:23` `| A 跳挡 | 1.0→1.6→2.6，各 hold ≥35f | 挡差 <1.5× 读作画面抖了一下 |`
  - `rhythm-interrupt-moves.md:24` `| A tick | 跳变帧起 2f brightness 0.92 全画面脉冲 | 无 tick 的跳切读作丢帧 |`
  - `rhythm-interrupt-moves.md:25` `| 收尾 | 末挡 ≥45f 真静止 | 打断系事后 hold 从重给 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/rhythm/smear-multiples/SmearMultiples

- 镜头卡: 无
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `SmearMultiples.tsx:11` `const X0 = 240; // 左槽卡片左边缘`
  - `SmearMultiples.tsx:12` `const X1 = 1140; // 右槽卡片左边缘（横移 900px）`
  - `SmearMultiples.tsx:13` `const OVER = 27; // 3% 过冲`
  - `SmearMultiples.tsx:19` `? interpolate(f, [25, 37], [X0, X1 + OVER], {`
  - `SmearMultiples.tsx:22` `easing: Easing.inOut(Easing.cubic),`
  - `SmearMultiples.tsx:24` `: interpolate(f, [37, 43], [X1 + OVER, X1], {`
  - `SmearMultiples.tsx:27` `easing: Easing.out(Easing.cubic),`
  - `SmearMultiples.tsx:50` `const speedGate = interpolate(speed, [25, 60], [0, 1], {`
  - `SmearMultiples.tsx:55` `const cv = interpolate(frame, [35, 38], [0, 1], {`
  - `SmearMultiples.tsx:58` `easing: Easing.out(Easing.quad),`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/rhythm/spectrum-morph-ui/SpectrumMorphUi

- 镜头卡: 无
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `SpectrumMorphUi.tsx:15` `const LINE_W = 720;`
  - `SpectrumMorphUi.tsx:16` `const LINE_H = 8;`
  - `SpectrumMorphUi.tsx:17` `const LINE_X = (1920 - LINE_W) / 2; // 600`
  - `SpectrumMorphUi.tsx:18` `const LINE_BOTTOM = 620; // 下划线底边 y（条从这里向上长）`
  - `SpectrumMorphUi.tsx:20` `const N_BARS = 28;`
  - `SpectrumMorphUi.tsx:21` `const GAP_MAX = 6;`
  - `SpectrumMorphUi.tsx:23` `const SPLIT = 25; // 裂开起点`
  - `SpectrumMorphUi.tsx:24` `const SPLIT_DUR = 8; // 裂开 & 幅度爬升`
  - `SpectrumMorphUi.tsx:25` `const DANCE = 64; // 跳动两小节`
  - `SpectrumMorphUi.tsx:26` `const COLLAPSE_START = SPLIT + DANCE; // 89`
  - `SpectrumMorphUi.tsx:27` `const COLLAPSE_DUR = 12;`
  - `SpectrumMorphUi.tsx:28` `const COLLAPSE_END = COLLAPSE_START + COLLAPSE_DUR; // 101 → 之后真静止 39f`
  - `SpectrumMorphUi.tsx:30` `const AMP = 92; // 理论峰值 8 + 92 = 100px；wobble×jitter×env 很少同时取满，实测峰值 ~80px`
  - `SpectrumMorphUi.tsx:38` `const titleOp = interpolate(frame, [0, 10], [0, 1], {`
  - `SpectrumMorphUi.tsx:44` `const rampIn = interpolate(frame, [SPLIT, SPLIT + SPLIT_DUR], [0, 1], {`
  - `SpectrumMorphUi.tsx:45` `easing: Easing.out(Easing.cubic),`
  - `SpectrumMorphUi.tsx:49` `const rampOut = interpolate(frame, [COLLAPSE_START, COLLAPSE_END], [1, 0], {`
  - `SpectrumMorphUi.tsx:50` `easing: Easing.out(Easing.cubic),`
  - `SpectrumMorphUi.tsx:57` `const gapIn = interpolate(frame, [SPLIT, SPLIT + SPLIT_DUR], [0, GAP_MAX], {`
  - `SpectrumMorphUi.tsx:58` `easing: Easing.out(Easing.cubic),`
  - `SpectrumMorphUi.tsx:62` `const gapOut = interpolate(frame, [COLLAPSE_START, COLLAPSE_END], [GAP_MAX, 0], {`
  - `SpectrumMorphUi.tsx:63` `easing: Easing.out(Easing.cubic),`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 含 random 或 noise, 网页进度函数不能依赖它, 要换成种子或删掉.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/rhythm/speed-ramp-freeze/SpeedRampReal

- 镜头卡: `references/shots/rhythm/speed-ramp-freeze.md`
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `SpeedRampReal.tsx:8` `export const SPEEDRAMP_DUR = 135;`
  - `SpeedRampReal.tsx:10` `const CARD_W = 460;`
  - `SpeedRampReal.tsx:11` `const GAP = 60;`
  - `SpeedRampReal.tsx:12` `const RAIL = layout.projects.cards.slice(0, 9);`
  - `SpeedRampReal.tsx:13` `const TARGET_I = 5;`
  - `SpeedRampReal.tsx:18` `const src = interpolate(frame, [0, 40, 85, 135], [0, 88, 97, 207], {`
  - `SpeedRampReal.tsx:52` `<CameraMotionBlur shutterAngle={200} samples={20}>`
- 卡片参数:
  - `speed-ramp-freeze.md:3` `一句话: 帧号非线性 remap 的节奏手法——定格标注（流动→定格圈注→解冻）`
  - `speed-ramp-freeze.md:5` `时长: 定格标注全程 158f（≈5.3s，定格段 67f ≥45f）`
  - `speed-ramp-freeze.md:11` `运动里干脆停下来——马克笔圈出重点再走。技术根是帧号 remap（斜率即速率），`
  - `speed-ramp-freeze.md:15` `- 源动画匀速，输出帧对源帧做非线性 remap（斜率即速率）：流动段斜率 1（26px/源帧）→`
  - `speed-ramp-freeze.md:19` `- 定格段斜率 =0（瞬时切换，无缓入——定格要干脆）；定格那一帧给"按下暂停"的`
  - `speed-ramp-freeze.md:20` `信号：快门白闪 3f、整帧取景框四角弹入、时间码从 LIVE 走字切到 PAUSED 并停住；`
  - `speed-ramp-freeze.md:21` `强调色马克笔超椭圆一笔圈 10f 描边（stroke-dashoffset，1.08 圈、收笔不闭合）圈住目标 +`
  - `speed-ramp-freeze.md:22` `箭杆 6f + 箭头 3f 点题，feTurbulence（scale≈6）给手绘抖动，再接一行 68px 粗体批注 +`
  - `speed-ramp-freeze.md:23` `手绘下划线 + 署名；解冻段 smootherstep（ease-in 起步）22f 走完一张卡、`
  - `speed-ramp-freeze.md:24` `平均斜率 >1 补偿时长，墨迹 8f 淡出，但在目标卡角留一枚评论图钉随卡离场`
  - `speed-ramp-freeze.md:31` `| 定格时长 | ≥45f | 短了凝视不成立（R3 宁慢勿快） |`
  - `speed-ramp-freeze.md:32` `| 解冻补偿 | smootherstep 22f 走完一张卡（平均斜率 >1） | 解冻太慢全片拖沓；不补偿则定格吃掉的时间读作冷场 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/rhythm/trailer-grammar-moves/CardFootageCadence

- 镜头卡: `references/shots/rhythm/trailer-grammar-moves.md`
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `CardFootageCadence.tsx:20` `const scale = interpolate(local, [0, 5], [1.05, 1], {`
  - `CardFootageCadence.tsx:22` `easing: Easing.out(Easing.cubic),`
  - `CardFootageCadence.tsx:77` `const s = interpolate(frame, [0, 14], [1, 1.08], CLAMP);`
  - `CardFootageCadence.tsx:89` `const tx = interpolate(frame - 22, [0, 12], [60, -60], CLAMP);`
  - `CardFootageCadence.tsx:102` `const s = interpolate(frame - 42, [0, 10], [2, 2.14], CLAMP);`
  - `CardFootageCadence.tsx:113` `const s = interpolate(frame, [62, 105], [1, 1.02], {`
  - `CardFootageCadence.tsx:115` `easing: Easing.out(Easing.cubic),`
- 卡片参数:
  - `trailer-grammar-moves.md:3` `一句话: 预告片语法一式——trailer-bumper 前置速剪钩子：三镜 9f 速剪 + 黑场静默一拍，再开场标题`
  - `trailer-grammar-moves.md:5` `时长: A ~4.7s（140f）`
  - `trailer-grammar-moves.md:19` `| A trailer-bumper | 三镜头各 9f 等长硬切（0/9/18），每镜内部 scale 1→1.04 微推保活；27–33f 纯黑静默，33f 起标题 16f 淡入 + 44px out-cubic 微升（demo 标题是 video-shotcraft 字标 + 品牌 tagline） | 正片开场前的钩子；cold open |`
  - `trailer-grammar-moves.md:24` `| A 速剪 | 三镜等长 9f，零过渡；镜头 3 对焦中列 Top pages 卡放大 2.2x 怼脸特写（CSS zoom，字不糊） | 节拍感靠等长；三镜构图必须明显不同 |`
  - `trailer-grammar-moves.md:25` `| A 微推 | 每镜内部 scale 1→1.04 线性 | 静帧三连读作幻灯片——命门 |`
  - `trailer-grammar-moves.md:26` `| A 黑场 | 27–33f 纯黑 #000 空 div，6f | 黑场里放任何东西都毁掉"静默一拍" |`
  - `trailer-grammar-moves.md:27` `| 收尾 | A 静止 77f（≥40f） | 字距收拢完（63f）后整帧冻结，真静止 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/rhythm/trailer-grammar-moves/SmashCut

- 镜头卡: `references/shots/rhythm/trailer-grammar-moves.md`
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `SmashCut.tsx:11` `const CUT = 42; // 硬切帧：>=42 全静止`
  - `SmashCut.tsx:50` `const p = interpolate(frame, [s, e], [0, 1], {`
  - `SmashCut.tsx:52` `easing: Easing.in(Easing.quad),`
  - `SmashCut.tsx:81` `const bgScale = interpolate(frame, [0, CUT], [1, 1.55], {`
  - `SmashCut.tsx:83` `easing: Easing.in(Easing.quad),`
  - `SmashCut.tsx:85` `const bgRot = interpolate(frame, [0, CUT], [0, 1.8], {`
  - `SmashCut.tsx:87` `easing: Easing.in(Easing.quad),`
- 卡片参数:
  - `trailer-grammar-moves.md:3` `一句话: 预告片语法一式——trailer-bumper 前置速剪钩子：三镜 9f 速剪 + 黑场静默一拍，再开场标题`
  - `trailer-grammar-moves.md:5` `时长: A ~4.7s（140f）`
  - `trailer-grammar-moves.md:19` `| A trailer-bumper | 三镜头各 9f 等长硬切（0/9/18），每镜内部 scale 1→1.04 微推保活；27–33f 纯黑静默，33f 起标题 16f 淡入 + 44px out-cubic 微升（demo 标题是 video-shotcraft 字标 + 品牌 tagline） | 正片开场前的钩子；cold open |`
  - `trailer-grammar-moves.md:24` `| A 速剪 | 三镜等长 9f，零过渡；镜头 3 对焦中列 Top pages 卡放大 2.2x 怼脸特写（CSS zoom，字不糊） | 节拍感靠等长；三镜构图必须明显不同 |`
  - `trailer-grammar-moves.md:25` `| A 微推 | 每镜内部 scale 1→1.04 线性 | 静帧三连读作幻灯片——命门 |`
  - `trailer-grammar-moves.md:26` `| A 黑场 | 27–33f 纯黑 #000 空 div，6f | 黑场里放任何东西都毁掉"静默一拍" |`
  - `trailer-grammar-moves.md:27` `| 收尾 | A 静止 77f（≥40f） | 字距收拢完（63f）后整帧冻结，真静止 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/transition/bubble-swarm-takeover/BubbleSwarmTakeover

- 镜头卡: 无
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `BubbleSwarmTakeover.tsx:15` `const PEAK = 75; // 遮蔽峰值帧（藏切点）`
  - `BubbleSwarmTakeover.tsx:18` `const CX = W / 2;`
  - `BubbleSwarmTakeover.tsx:19` `const CY = H / 2;`
  - `BubbleSwarmTakeover.tsx:96` `const pIn = interpolate(frame, [spec.t0, PEAK], [0, 1], {`
  - `BubbleSwarmTakeover.tsx:98` `easing: Easing.out(Easing.cubic),`
  - `BubbleSwarmTakeover.tsx:101` `const disperse = interpolate(frame, [PEAK + 2, 118], [0, 1], {`
  - `BubbleSwarmTakeover.tsx:103` `easing: Easing.in(Easing.quad),`
  - `BubbleSwarmTakeover.tsx:112` `const scale = interpolate(frame, [spec.t0, PEAK], [0.22, 1], {`
  - `BubbleSwarmTakeover.tsx:114` `easing: Easing.out(Easing.quad),`
  - `BubbleSwarmTakeover.tsx:117` `interpolate(frame, [spec.t0, spec.t0 + 7], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) *`
  - `BubbleSwarmTakeover.tsx:118` `interpolate(disperse, [0.55, 1], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });`
  - `BubbleSwarmTakeover.tsx:136` `const whiteout = interpolate(frame, [42, 68, 82, 104], [0, 0.92, 0.92, 0], {`
  - `BubbleSwarmTakeover.tsx:138` `easing: Easing.inOut(Easing.quad),`
  - `BubbleSwarmTakeover.tsx:155` `const pIn = interpolate(frame, [host.t0 + 4, PEAK], [0, 1], {`
  - `BubbleSwarmTakeover.tsx:156` `extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),`
  - `BubbleSwarmTakeover.tsx:158` `const disperse = interpolate(frame, [PEAK + 2, 116], [0, 1], {`
  - `BubbleSwarmTakeover.tsx:159` `extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad),`
  - `BubbleSwarmTakeover.tsx:168` `const op = pIn * interpolate(disperse, [0.5, 1], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/transition/color-block-step-wipe/ColorBlockStepWipe

- 镜头卡: 无
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `ColorBlockStepWipe.tsx:8` `const BLUE = '#2383e2';`
  - `ColorBlockStepWipe.tsx:9` `const RED = '#e8503a';`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/transition/cube-navigation/CubeNavigation

- 镜头卡: 无
- 时长: 180 帧 / 6000 ms, `DURATION` 于第 8 行
- 分镜:
  - `CubeNavigation.tsx:8` `export const CUBE_NAVIGATION_DURATION = 180; // 6000ms @30fps`
  - `CubeNavigation.tsx:50` `const RAD = Math.PI / 180;`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 没有帧采样. 当静态夹具.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/transition/page-turn-transitions/CubeRotate

- 镜头卡: `references/shots/transition/page-turn-transitions.md`
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `CubeRotate.tsx:62` `const p = interpolate(frame, [30, 68], [0, 1], {`
  - `CubeRotate.tsx:65` `easing: Easing.inOut(Easing.cubic),`
- 卡片参数:
  - `page-turn-transitions.md:5` `时长: 单式 150f（前态建立 30–40f + 转场 24–40f + 跟随与收尾 ≥70f），约 5.0s`
  - `page-turn-transitions.md:19` `| A barn-door-split | 旧页两个 960px overflow 容器对位拼合，同时向外 ease-in 加速滑出画外（按速度挂横向运动模糊）；裂缝里透出新页的光——门内缘 10px 切面被照亮、门面近缝处被光染暖，新页带一次过曝光束 scale 1.08→1 迎上；demo 为同版式的 video-shotcraft 版本更替：「Shotcraft 3」冷灰旧页 → 「Shotcraft 4」余烬发布页（眉题挂镜刻标...`
  - `page-turn-transitions.md:24` `| 预告 | 裂前中缝一条发丝亮线（带泛光）自中点向上下描出（20–30f），30–40f 裂缝 ease-in 撑开 0→16px 成一道光缝 | 直接裂开观众没看到裂点在哪；硬开关闪线读作渲染故障 |`
  - `page-turn-transitions.md:25` `| 滑出 | 各 translateX ∓1000px / 24f，bezier(0.42,0,0.8,0.25) 加速 | ease-out 滑出是"被推走"，ease-in 才是"让位"；quart-in 太猛会读作"停住→最后一帧消失" |`
  - `page-turn-transitions.md:26` `| 新页迎上 | scale 1.08→1（snappy 36f，晚门 2f 起跳），过曝光束随门远去 ~30f 衰减；新旧两页同版式同槽位 | 新旧页版式不同就读不出"取代" |`
  - `page-turn-transitions.md:28` `| 收尾 | 新页落定后跟随动作（数据滚动 / 清单打勾）+ hold ≥30f，hold 段相机极缓推近 1.5–2% | R1 |`
  - `page-turn-transitions.md:37` `- 转场前后两页都要有 ≥30f 静止建立/收尾——两端都在动，体块感被`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/transition/paper-plane-messenger/PaperPlaneMessenger

- 镜头卡: 无
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `PaperPlaneMessenger.tsx:17` `const AX = 520, AY = 560;   // 窗口 A 中心`
  - `PaperPlaneMessenger.tsx:18` `const BX = 3200, BY = 600;  // 窗口 B 中心`
  - `PaperPlaneMessenger.tsx:19` `const WIN_W = 760, WIN_H = 500;`
  - `PaperPlaneMessenger.tsx:22` `const P0 = { x: AX + 300, y: AY + 150 };`
  - `PaperPlaneMessenger.tsx:23` `const P1 = { x: 1250, y: -80 };`
  - `PaperPlaneMessenger.tsx:24` `const P2 = { x: 2500, y: 300 };`
  - `PaperPlaneMessenger.tsx:25` `const P3 = { x: BX - 470, y: BY + 20 };`
  - `PaperPlaneMessenger.tsx:35` `const CLICK = 12;        // 点击发送`
  - `PaperPlaneMessenger.tsx:36` `const ZOOM_OUT = [16, 42] as const; // 镜头拉远`
  - `PaperPlaneMessenger.tsx:37` `const FLY = [34, 104] as const;     // 飞行`
  - `PaperPlaneMessenger.tsx:38` `const TAKEOVER = [112, 146] as const; // 窗口 B 接管`
  - `PaperPlaneMessenger.tsx:90` `const tFly = interpolate(frame, [FLY[0], FLY[1]], [0, 1], {`
  - `PaperPlaneMessenger.tsx:92` `easing: Easing.bezier(0.45, 0.05, 0.25, 1),`
  - `PaperPlaneMessenger.tsx:99` `const zoomOutP = interpolate(frame, [ZOOM_OUT[0], ZOOM_OUT[1]], [0, 1], {`
  - `PaperPlaneMessenger.tsx:100` `extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic),`
  - `PaperPlaneMessenger.tsx:102` `const takeP = interpolate(frame, [TAKEOVER[0], TAKEOVER[1]], [0, 1], {`
  - `PaperPlaneMessenger.tsx:103` `extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic),`
  - `PaperPlaneMessenger.tsx:106` `const followW = interpolate(frame, [ZOOM_OUT[0], ZOOM_OUT[1]], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });`
  - `PaperPlaneMessenger.tsx:120` `const btnPulse = interpolate(frame, [CLICK, CLICK + 3, CLICK + 12], [0, 1, 0], {`
  - `PaperPlaneMessenger.tsx:121` `extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad),`
  - `PaperPlaneMessenger.tsx:125` `const flightBoost = interpolate(tFly, [0, 0.25, 0.75, 1], [1, 1.7, 1.7, 1.1], {`
  - `PaperPlaneMessenger.tsx:128` `const planeScale = interpolate(frame, [FLY[0] - 2, FLY[0] + 8], [0.3, 1], {`
  - (运动行 26 条, 留前 22 条, 文件 183 行已逐行扫过)
- 卡片参数:
  - 无对应镜头卡
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/transition/shot-transitions/BlackCardTransition

- 镜头卡: `references/shots/transition/shot-transitions.md`
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `BlackCardTransition.tsx:12` `export const BLACKCARD_DUR = 120;`
  - `BlackCardTransition.tsx:14` `const A_VIEW_Y = -180;`
  - `BlackCardTransition.tsx:19` `const PAPER_LIGHT = 'oklch(92% 0.01 82)';`
  - `BlackCardTransition.tsx:20` `const AMBER = 'oklch(68% 0.12 65)';`
  - `BlackCardTransition.tsx:21` `const DIM = 'oklch(72% 0.01 82)';`
  - `BlackCardTransition.tsx:37` `const aOut = interpolate(frame, [0, 8], [1, 0], {`
  - `BlackCardTransition.tsx:38` `extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.5, 0, 0.4, 1),`
  - `BlackCardTransition.tsx:42` `const cardOpacity = interpolate(frame, [18, 26], [0, 1], {`
  - `BlackCardTransition.tsx:43` `extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.2, 0.7, 0.3, 1),`
  - `BlackCardTransition.tsx:46` `const cardOut = interpolate(frame, [62, 70], [0, 1], {`
  - `BlackCardTransition.tsx:47` `extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.4, 0, 0.5, 1),`
  - `BlackCardTransition.tsx:51` `const bIn = interpolate(frame, [70, 78], [0, 1], {`
  - `BlackCardTransition.tsx:52` `extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.3, 0, 0.2, 1),`
  - `BlackCardTransition.tsx:85` `const t = interpolate(frame, [delay, delay + 9], [0, 1], {`
  - `BlackCardTransition.tsx:86` `extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.2, 0.75, 0.3, 1),`
  - `BlackCardTransition.tsx:106` `background: AMBER, transform: 'scaleX(${interpolate(frame, [32, 44], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.3, 0, 0.2, 1) })})',`
  - `BlackCardTransition.tsx:113` `opacity: interpolate(frame, [26, 36], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),`
- 卡片参数:
  - `shot-transitions.md:5` `时长: n/a（技法卡；各式占用帧数见参数表，从相邻镜头预算里划）`
  - `shot-transitions.md:12` `（Linear Releases/Agent，2026-07-11 抽帧逆向）全程没有一次裸切：`
  - `shot-transitions.md:14` `白闪盖切、甩镜借糊帧换景、穿窗点进详情世界。`
  - `shot-transitions.md:21` `| B whip-pan 甩镜（急刹款） | 机位一拍横甩到下一场景，中段运动模糊糊到不可辨，借糊帧换景；落点前急刹、长尾滑入 | 快节奏功能段连打（高能量→高能量的轻快款）；落点是"要读内容"的镜头 |`
  - `shot-transitions.md:27` `| A flash-cut | 'assets/lib/FlashCut.tsx'，from = 切点 − 5，两侧各 5f | 用法详见 type-and-filter 卡；白闪只盖硬切，不当装饰光效（Q4）|`
  - `shot-transitions.md:28` `| B 甩镜急刹款 | 起点 hold ≥20f → 前 70% 路程用 30% 时间（糊段，峰值 ~300px/f）→ 后 30% 路程 ease-out 长尾 ~48f 滑入落位；用一条连续速度曲线（3f 起步 + 指数衰减）积分出位移，别分段各套 ease-out（分段处速度会二次起跳）；按瞬时速度做方向性运动模糊（'_fixtures/Polish' 的 'SpeedBlur'，sd ≈ 0.085×速度、封顶 64px），只在...`
  - `shot-transitions.md:29` `| C 穿窗纵深款 portal-wipe | 目标卡先悬浮抬起作预备（−10px、1.03×，邻卡退暗）→ 窗放大 40f 用 bezier(0.7,0,0.3,1) 先慢后快，窗内新景从 ~0.42 缩放反向补偿长到 1（与窗几何同一个 t），卡面在前 ~28% 行程内渐隐（opacity 1−t·3.6，再慢会被拉成满屏巨字残影）；窗内**只 2 层**视差（远景面板系数 0.08 + 近景 2 卡 0.3，不加 blur），穿窗...`
  - `shot-transitions.md:33` `等于全线挪帧——转场占用的帧从相邻镜头预算划走，规矩同 hold 预算（R3）`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/transition/shot-transitions/DarkTunnelTransition

- 镜头卡: `references/shots/transition/shot-transitions.md`
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `DarkTunnelTransition.tsx:12` `export const DARKTUNNEL_DUR = 120;`
  - `DarkTunnelTransition.tsx:15` `const A_VIEW_Y = -180;`
  - `DarkTunnelTransition.tsx:16` `const A_W = 1920;`
  - `DarkTunnelTransition.tsx:24` `const pushX = interpolate(frame, [26, 36], [0, -A_W], {`
  - `DarkTunnelTransition.tsx:25` `extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.45, 0, 0.2, 1),`
  - `DarkTunnelTransition.tsx:31` `const tunnelVis = interpolate(frame, [32, 40, 42, 50], [0, 1, 1, 0], {`
  - `DarkTunnelTransition.tsx:32` `extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.4, 0, 0.6, 1),`
  - `DarkTunnelTransition.tsx:38` `const bIn = interpolate(frame, [42, 52], [0, 1], {`
  - `DarkTunnelTransition.tsx:39` `extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.3, 0, 0.2, 1),`
  - `DarkTunnelTransition.tsx:49` `const DUST = Array.from({ length: 4 }, (_, i) => ({`
- 卡片参数:
  - `shot-transitions.md:5` `时长: n/a（技法卡；各式占用帧数见参数表，从相邻镜头预算里划）`
  - `shot-transitions.md:12` `（Linear Releases/Agent，2026-07-11 抽帧逆向）全程没有一次裸切：`
  - `shot-transitions.md:14` `白闪盖切、甩镜借糊帧换景、穿窗点进详情世界。`
  - `shot-transitions.md:21` `| B whip-pan 甩镜（急刹款） | 机位一拍横甩到下一场景，中段运动模糊糊到不可辨，借糊帧换景；落点前急刹、长尾滑入 | 快节奏功能段连打（高能量→高能量的轻快款）；落点是"要读内容"的镜头 |`
  - `shot-transitions.md:27` `| A flash-cut | 'assets/lib/FlashCut.tsx'，from = 切点 − 5，两侧各 5f | 用法详见 type-and-filter 卡；白闪只盖硬切，不当装饰光效（Q4）|`
  - `shot-transitions.md:28` `| B 甩镜急刹款 | 起点 hold ≥20f → 前 70% 路程用 30% 时间（糊段，峰值 ~300px/f）→ 后 30% 路程 ease-out 长尾 ~48f 滑入落位；用一条连续速度曲线（3f 起步 + 指数衰减）积分出位移，别分段各套 ease-out（分段处速度会二次起跳）；按瞬时速度做方向性运动模糊（'_fixtures/Polish' 的 'SpeedBlur'，sd ≈ 0.085×速度、封顶 64px），只在...`
  - `shot-transitions.md:29` `| C 穿窗纵深款 portal-wipe | 目标卡先悬浮抬起作预备（−10px、1.03×，邻卡退暗）→ 窗放大 40f 用 bezier(0.7,0,0.3,1) 先慢后快，窗内新景从 ~0.42 缩放反向补偿长到 1（与窗几何同一个 t），卡面在前 ~28% 行程内渐隐（opacity 1−t·3.6，再慢会被拉成满屏巨字残影）；窗内**只 2 层**视差（远景面板系数 0.08 + 近景 2 卡 0.3，不加 blur），穿窗...`
  - `shot-transitions.md:33` `等于全线挪帧——转场占用的帧从相邻镜头预算划走，规矩同 hold 预算（R3）`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/transition/shot-transitions/FocusHandoffTransition

- 镜头卡: `references/shots/transition/shot-transitions.md`
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `FocusHandoffTransition.tsx:11` `export const FOCUSHANDOFF_DUR = 120;`
  - `FocusHandoffTransition.tsx:13` `const PAGE_H = 1746; // projects-full 的 CSS 高（layout.projects.pageH）`
  - `FocusHandoffTransition.tsx:15` `const A_VIEW_Y = -180;`
  - `FocusHandoffTransition.tsx:18` `const B_VIEW_Y = -900;`
  - `FocusHandoffTransition.tsx:24` `const aOut = interpolate(frame, [24, 40], [0, 1], {`
  - `FocusHandoffTransition.tsx:25` `extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.45, 0, 0.3, 1),`
  - `FocusHandoffTransition.tsx:31` `const bIn = interpolate(frame, [26, 42], [0, 1], {`
  - `FocusHandoffTransition.tsx:32` `extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.3, 0, 0.2, 1),`
- 卡片参数:
  - `shot-transitions.md:5` `时长: n/a（技法卡；各式占用帧数见参数表，从相邻镜头预算里划）`
  - `shot-transitions.md:12` `（Linear Releases/Agent，2026-07-11 抽帧逆向）全程没有一次裸切：`
  - `shot-transitions.md:14` `白闪盖切、甩镜借糊帧换景、穿窗点进详情世界。`
  - `shot-transitions.md:21` `| B whip-pan 甩镜（急刹款） | 机位一拍横甩到下一场景，中段运动模糊糊到不可辨，借糊帧换景；落点前急刹、长尾滑入 | 快节奏功能段连打（高能量→高能量的轻快款）；落点是"要读内容"的镜头 |`
  - `shot-transitions.md:27` `| A flash-cut | 'assets/lib/FlashCut.tsx'，from = 切点 − 5，两侧各 5f | 用法详见 type-and-filter 卡；白闪只盖硬切，不当装饰光效（Q4）|`
  - `shot-transitions.md:28` `| B 甩镜急刹款 | 起点 hold ≥20f → 前 70% 路程用 30% 时间（糊段，峰值 ~300px/f）→ 后 30% 路程 ease-out 长尾 ~48f 滑入落位；用一条连续速度曲线（3f 起步 + 指数衰减）积分出位移，别分段各套 ease-out（分段处速度会二次起跳）；按瞬时速度做方向性运动模糊（'_fixtures/Polish' 的 'SpeedBlur'，sd ≈ 0.085×速度、封顶 64px），只在...`
  - `shot-transitions.md:29` `| C 穿窗纵深款 portal-wipe | 目标卡先悬浮抬起作预备（−10px、1.03×，邻卡退暗）→ 窗放大 40f 用 bezier(0.7,0,0.3,1) 先慢后快，窗内新景从 ~0.42 缩放反向补偿长到 1（与窗几何同一个 t），卡面在前 ~28% 行程内渐隐（opacity 1−t·3.6，再慢会被拉成满屏巨字残影）；窗内**只 2 层**视差（远景面板系数 0.08 + 近景 2 卡 0.3，不加 blur），穿窗...`
  - `shot-transitions.md:33` `等于全线挪帧——转场占用的帧从相邻镜头预算划走，规矩同 hold 预算（R3）`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/transition/shot-transitions/MaskWipeReal

- 镜头卡: `references/shots/transition/shot-transitions.md`
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `MaskWipeReal.tsx:7` `export const MASKWIPE_DUR = 120;`
  - `MaskWipeReal.tsx:9` `const C4 = layout.projects.cards[3]; // 页面空间 x=781,y=616,w=357,h=312`
  - `MaskWipeReal.tsx:10` `const VIEW_Y = 180; // 全景观察窗：页面 y=180 起`
  - `MaskWipeReal.tsx:14` `const t = interpolate(frame, [40, 85], [0, 1], {`
  - `MaskWipeReal.tsx:16` `easing: Easing.bezier(0.5, 0, 0.2, 1),`
  - `MaskWipeReal.tsx:20` `const x = interpolate(t, [0, 1], [g0.x, 0]);`
  - `MaskWipeReal.tsx:21` `const y = interpolate(t, [0, 1], [g0.y, 0]);`
  - `MaskWipeReal.tsx:22` `const w = interpolate(t, [0, 1], [g0.w, 1920]);`
  - `MaskWipeReal.tsx:23` `const h = interpolate(t, [0, 1], [g0.h, 1080]);`
  - `MaskWipeReal.tsx:24` `const r = interpolate(t, [0, 1], [g0.r, 0]);`
  - `MaskWipeReal.tsx:26` `const innerScale = interpolate(t, [0, 1], [0.42, 1]);`
- 卡片参数:
  - `shot-transitions.md:5` `时长: n/a（技法卡；各式占用帧数见参数表，从相邻镜头预算里划）`
  - `shot-transitions.md:12` `（Linear Releases/Agent，2026-07-11 抽帧逆向）全程没有一次裸切：`
  - `shot-transitions.md:14` `白闪盖切、甩镜借糊帧换景、穿窗点进详情世界。`
  - `shot-transitions.md:21` `| B whip-pan 甩镜（急刹款） | 机位一拍横甩到下一场景，中段运动模糊糊到不可辨，借糊帧换景；落点前急刹、长尾滑入 | 快节奏功能段连打（高能量→高能量的轻快款）；落点是"要读内容"的镜头 |`
  - `shot-transitions.md:27` `| A flash-cut | 'assets/lib/FlashCut.tsx'，from = 切点 − 5，两侧各 5f | 用法详见 type-and-filter 卡；白闪只盖硬切，不当装饰光效（Q4）|`
  - `shot-transitions.md:28` `| B 甩镜急刹款 | 起点 hold ≥20f → 前 70% 路程用 30% 时间（糊段，峰值 ~300px/f）→ 后 30% 路程 ease-out 长尾 ~48f 滑入落位；用一条连续速度曲线（3f 起步 + 指数衰减）积分出位移，别分段各套 ease-out（分段处速度会二次起跳）；按瞬时速度做方向性运动模糊（'_fixtures/Polish' 的 'SpeedBlur'，sd ≈ 0.085×速度、封顶 64px），只在...`
  - `shot-transitions.md:29` `| C 穿窗纵深款 portal-wipe | 目标卡先悬浮抬起作预备（−10px、1.03×，邻卡退暗）→ 窗放大 40f 用 bezier(0.7,0,0.3,1) 先慢后快，窗内新景从 ~0.42 缩放反向补偿长到 1（与窗几何同一个 t），卡面在前 ~28% 行程内渐隐（opacity 1−t·3.6，再慢会被拉成满屏巨字残影）；窗内**只 2 层**视差（远景面板系数 0.08 + 近景 2 卡 0.3，不加 blur），穿窗...`
  - `shot-transitions.md:33` `等于全线挪帧——转场占用的帧从相邻镜头预算划走，规矩同 hold 预算（R3）`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/transition/shot-transitions/WhipPanReal

- 镜头卡: `references/shots/transition/shot-transitions.md`
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `WhipPanReal.tsx:8` `export const WHIPPAN_DUR = 120;`
  - `WhipPanReal.tsx:10` `const SWING = 2880; // 1.5 屏`
  - `WhipPanReal.tsx:12` `const VIEW_Y = -180;`
  - `WhipPanReal.tsx:16` `const dx = interpolate(frame, [35, 43], [0, SWING], {`
  - `WhipPanReal.tsx:19` `easing: Easing.bezier(0.6, 0, 0.4, 1),`
  - `WhipPanReal.tsx:42` `<CameraMotionBlur shutterAngle={200} samples={20}>`
- 卡片参数:
  - `shot-transitions.md:5` `时长: n/a（技法卡；各式占用帧数见参数表，从相邻镜头预算里划）`
  - `shot-transitions.md:12` `（Linear Releases/Agent，2026-07-11 抽帧逆向）全程没有一次裸切：`
  - `shot-transitions.md:14` `白闪盖切、甩镜借糊帧换景、穿窗点进详情世界。`
  - `shot-transitions.md:21` `| B whip-pan 甩镜（急刹款） | 机位一拍横甩到下一场景，中段运动模糊糊到不可辨，借糊帧换景；落点前急刹、长尾滑入 | 快节奏功能段连打（高能量→高能量的轻快款）；落点是"要读内容"的镜头 |`
  - `shot-transitions.md:27` `| A flash-cut | 'assets/lib/FlashCut.tsx'，from = 切点 − 5，两侧各 5f | 用法详见 type-and-filter 卡；白闪只盖硬切，不当装饰光效（Q4）|`
  - `shot-transitions.md:28` `| B 甩镜急刹款 | 起点 hold ≥20f → 前 70% 路程用 30% 时间（糊段，峰值 ~300px/f）→ 后 30% 路程 ease-out 长尾 ~48f 滑入落位；用一条连续速度曲线（3f 起步 + 指数衰减）积分出位移，别分段各套 ease-out（分段处速度会二次起跳）；按瞬时速度做方向性运动模糊（'_fixtures/Polish' 的 'SpeedBlur'，sd ≈ 0.085×速度、封顶 64px），只在...`
  - `shot-transitions.md:29` `| C 穿窗纵深款 portal-wipe | 目标卡先悬浮抬起作预备（−10px、1.03×，邻卡退暗）→ 窗放大 40f 用 bezier(0.7,0,0.3,1) 先慢后快，窗内新景从 ~0.42 缩放反向补偿长到 1（与窗几何同一个 t），卡面在前 ~28% 行程内渐隐（opacity 1−t·3.6，再慢会被拉成满屏巨字残影）；窗内**只 2 层**视差（远景面板系数 0.08 + 近景 2 卡 0.3，不加 blur），穿窗...`
  - `shot-transitions.md:33` `等于全线挪帧——转场占用的帧从相邻镜头预算划走，规矩同 hold 预算（R3）`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/transition/transition-travel/SharedElementMorph

- 镜头卡: `references/shots/transition/transition-travel.md`
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `SharedElementMorph.tsx:13` `const SLOT = { x: 808, y: 590, w: 524, h: 454, r: 14, seed: 5 };`
  - `SharedElementMorph.tsx:14` `const FULL = { x: 0, y: 0, w: 1920, h: 1080, r: 0 };`
  - `SharedElementMorph.tsx:18` `const MORPH_START = 35;`
  - `SharedElementMorph.tsx:19` `const MORPH_END = 60;`
  - `SharedElementMorph.tsx:20` `const SETTLE_END = 70;`
  - `SharedElementMorph.tsx:28` `const drive = interpolate(frame, [MORPH_START, MORPH_END], [0, 1.03], {`
  - `SharedElementMorph.tsx:31` `easing: Easing.bezier(0.4, 0, 0.2, 1),`
  - `SharedElementMorph.tsx:33` `const settle = interpolate(frame, [MORPH_END, SETTLE_END], [1.03, 1], {`
  - `SharedElementMorph.tsx:36` `easing: Easing.out(Easing.cubic),`
  - `SharedElementMorph.tsx:57` `const bgOpacity = interpolate(frame, [MORPH_END - 2, MORPH_END + 3], [0.9, 1], {`
  - `SharedElementMorph.tsx:60` `easing: Easing.out(Easing.quad),`
- 卡片参数:
  - `transition-travel.md:5` `时长: n/a（技法卡；demo 150f，主推动作段 52f，前后 hold 另计，帧数从相邻镜头预算里划）`
  - `transition-travel.md:11` `shot-transitions 三式是"交棒"型——前镜收尾、后镜入场，接缝靠白闪/糊帧/`
  - `transition-travel.md:27` `| A 穿腔主推 | 盖板 SVG mask（白底+黑字 900 字重）挖洞，transform-origin 对准字形笔画（洞）中心——锚在字腔里推到底撑满的是盖板不是洞（demo：「EDITS」560px 的 I 竖笔中心 973,515，竖笔 107px×30 > 画宽；选词时让 I 竖笔落在画面中线附近，洞才从正中撑开）；scale=30^u，u 52f bezier(0.6,0,0.85,0.5) 慢起陡收，推前 26–34f...`
  - `transition-travel.md:29` `| A 洞里只给光不给字 | 字卡 hold 期页面的文字/卡片层完全隐去，洞里只透出暖色渐变 + 柔光形（卡片位一团奶白光、标题位一抹暗赤）；主推中段 64–90f 内容层由 18px 失焦淡入合焦（EASE.out），接管时已清晰 | 洞里能读到页面标题时，两层可读文字互相抢，标题字读作"杂乱"而不是一个干净的镂空 |`
  - `transition-travel.md:30` `| A 撤场与拖影 | scale∈[14,26] 盖板 opacity 1→0；u>0.35 起期望模糊 0→20px（除以 scale 写进 blur）+ 四层更早 0.8–3.2 帧的半透明盖板残影叠成径向变焦拖尾；接管瞬间页面 brightness +12% 一闪回落 | blur 不除 scale 会被放大成糊墙；只用两层残影会读成硬边半透明色块，四层才连成拖尾 |`
  - `transition-travel.md:31` `| A 后景视差 | 页面只推 1→1.08（主推期 0.7·u，接管后 quint-out 补完，交接处速度连续）+ 0–100f 向左漂 28px；接管后渲染卡上的镜头计数 0→12、时长条错峰填满、DONE 标签弹出 | 后景不动则洞里是张死图；后景推太多会和盖板同速，纵深消失 |`
  - `transition-travel.md:34` `- 推进锚点要按渲染帧实测（demo 的竖笔坐标是从静帧量出来的），换字体/换词/渲染器字距`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/transition/wipe-transitions/ClockWipe

- 镜头卡: `references/shots/transition/wipe-transitions.md`
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `ClockWipe.tsx:10` `const CX = 960;`
  - `ClockWipe.tsx:11` `const CY = 540;`
  - `ClockWipe.tsx:13` `const SEGS = 72; // 顶点数固定且够密，避免锯齿跳变`
  - `ClockWipe.tsx:34` `const theta = interpolate(frame, [30, 90], [0, 360], {`
  - `ClockWipe.tsx:41` `const lineOpacity = interpolate(frame, [90, 96], [1, 0], {`
- 卡片参数:
  - `wipe-transitions.md:5` `时长: 前态 ≥20f + 擦除 ~56f + 收尾 ≥40f，约 4.4s（132f）`
  - `wipe-transitions.md:24` `| 波 | 24f 起，叶 i 起跳 = 24 + 28·(i/11)^0.78（间隔 3.4f→2.1f，越翻越快）；每叶物理弹簧 damping 13 / stiffness 75（~13f 到 180°、≈5° 过冲回落） | 同时 4–5 叶在转才读作"波"；EASE.out 错峰首间隔 9f，第一叶之后空等，波显得拖 |`
  - `wipe-transitions.md:26` `| 摘罩 | 最后一叶弹簧收敛（|θ−180°|<0.3° 连续 4 帧，demo ≈80f）后卸载全部 3D 叶片，B 页直出 | opacity 0 不算摘，残留 clip-path / 3D 层毁真静止，3D 层里的字也不如平面锐利 |`
  - `wipe-transitions.md:27` `| 收尾 | 摘罩后 ≈50f 落定（≥40f；刊头细线重画一遍、相机 1.02 落回 1） | R1 |`
  - `wipe-transitions.md:35` `- 摘罩必须等最后一叶弹簧收敛（≈80f）再做，早一帧卸载就是叶片跳位穿帮`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/typography/cel-flash-stomp/CelFlashStomp

- 镜头卡: 无
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `CelFlashStomp.tsx:23` `const LAND = 6; // 入场弹落时长：start+6 落定，同帧起闪`
  - `CelFlashStomp.tsx:38` `? interpolate(t, [0, 4], [1.18, 0.98], {`
  - `CelFlashStomp.tsx:40` `easing: Easing.out(Easing.poly(5)),`
  - `CelFlashStomp.tsx:42` `: interpolate(t, [4, LAND], [0.98, 1], {`
  - `CelFlashStomp.tsx:45` `easing: Easing.out(Easing.quad),`
  - `CelFlashStomp.tsx:54` `const labelOp = interpolate(frame, [66, 80], [0, 1], {`
  - `CelFlashStomp.tsx:57` `easing: Easing.out(Easing.quad),`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.
