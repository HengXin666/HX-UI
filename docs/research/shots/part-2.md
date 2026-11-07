# video-shotcraft demos part 2

来源提交 `1266a3e`. 每个 tsx 逐行扫描. 30fps, 1 帧 = 33.3ms.

### demos/_legacy/typography/scramble/Scramble

- 镜头卡: 无
- 时长: 96 帧 / 3200 ms, `DURATION` 于第 8 行
- 分镜:
  - `Scramble.tsx:8` `export const SCRAMBLE_DURATION = 96; // 3200ms @30fps`
  - `Scramble.tsx:11` `const POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+=<>/\\';`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 没有帧采样. 当静态夹具.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/typography/split-flap-title/SplitFlapFlip

- 镜头卡: 无
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `SplitFlapFlip.tsx:10` `const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&';`
  - `SplitFlapFlip.tsx:11` `const START = 22; // 级联起始帧`
  - `SplitFlapFlip.tsx:12` `const STAGGER = 4; // 字符间级联延迟`
  - `SplitFlapFlip.tsx:13` `const FLIP = 5; // 单次翻牌时长`
  - `SplitFlapFlip.tsx:14` `const NFLIP = 3; // 每字符翻 3 次（2 个乱码中间态 + 1 次落到目标字）`
  - `SplitFlapFlip.tsx:15` `const CELL_W = 118;`
  - `SplitFlapFlip.tsx:16` `const CELL_H = 156;`
  - `SplitFlapFlip.tsx:26` `const FLAP_BG = '#262624';`
  - `SplitFlapFlip.tsx:27` `const FLAP_INK = '#f4f4f2';`
  - `SplitFlapFlip.tsx:76` `? interpolate(local, [15, 17, 19, 22], [0, 6, -1.5, 0], {`
  - `SplitFlapFlip.tsx:79` `easing: Easing.out(Easing.quad),`
  - `SplitFlapFlip.tsx:94` `const p = Easing.in(Easing.quad)((local - k * FLIP) / FLIP); // 重力感：越掉越快`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 含 random 或 noise, 网页进度函数不能依赖它, 要换成种子或删掉.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/typography/type-assembly-moves/TrackingExpandReveal

- 镜头卡: `references/shots/typography/type-assembly-moves.md`
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `TrackingExpandReveal.tsx:7` `// 关键帧：0–50 展开（Easing.out(poly(5)))＋去糊提亮 → 35–58 副标题淡入（≈主词展开 70% 时点）`
  - `TrackingExpandReveal.tsx:14` `const FS = 150; // 主词字号`
  - `TrackingExpandReveal.tsx:16` `const GAP_DELTA = -0.56 * FS;`
  - `TrackingExpandReveal.tsx:21` `const p = interpolate(frame, [0, 50], [0, 1], {`
  - `TrackingExpandReveal.tsx:24` `easing: Easing.out(Easing.poly(5)),`
  - `TrackingExpandReveal.tsx:27` `const op = interpolate(p, [0, 1], [0.6, 1]);`
  - `TrackingExpandReveal.tsx:28` `const sx = interpolate(p, [0, 1], [0.92, 1]);`
  - `TrackingExpandReveal.tsx:30` `const subOp = interpolate(frame, [35, 58], [0, 1], {`
  - `TrackingExpandReveal.tsx:33` `easing: Easing.out(Easing.quad),`
- 卡片参数:
  - `type-assembly-moves.md:5` `时长: 单式 4–5.5s（动作段 A ~56f / B ~104f / C ~110f；demo 全长含 hold：A 130f / B 150f / C 160f，各自导出 '*_DURATION'）`
  - `type-assembly-moves.md:19` `| A split-text-stagger 裂升 | 每字 overflow 盒内 translateY(115%→0) 带 10% 过冲，delay i×2f，基线同步生长（demo：亮场 136px 品牌短句「FRAME MOTION.」） | 通用默认；利落理性 |`
  - `type-assembly-moves.md:20` `| B drift-assembly 漂移合拢 | 字符 seed 方向 ±260–360px + blur 8px + 旋转 ±24° + 纵深 1.22 漂入错峰归位，锁定帧加深脉冲，合体后整词呼吸 1.04（demo：亮场 148px 品牌名「Shotcraft」） | 品牌名/片头级亮相 |`
  - `type-assembly-moves.md:26` `| A 过冲 | 10%（14f out-cubic 升到 −10% 再 6f 回落；原案 6% 可测不可感，实渲加码） | 正常速度要看得见回落那一下；升起快段按竖向速度加 y 向模糊 |`
  - `type-assembly-moves.md:27` `| B 锁定脉冲 | 字色深到 #000 + 描边 0→3px→0 / 8f | 白底上加深+描边，不用发光（判例） |`
  - `type-assembly-moves.md:28` `| B 漂移绑定 | 位移 (1−p)、旋转、纵深缩放、blur 8(1−p)、opacity 0.35→1 共用一条 p（Easing.out(cubic)，每字 45f、错峰 3f） | 分曲线走，字会"到了还糊着" |`
  - `type-assembly-moves.md:29` `| C 摆正 | 到达停 8f 再从左到右 1.1f 错峰、18f 抬升：y 用带 ~4% 过冲的快曲线、x 用 in-out、旋转晚 2f 收敛 → 轨迹是弧；终位按实测字宽排版 | 不摆正就永远是"挂在线上"，读不出标题；抬升行程大时过冲 >5% 会顶进眉题 |`
  - `type-assembly-moves.md:31` `| 收尾 | 全员落定真静止 ≥30f | R1 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/typography/type-entrance-moves/ScrambleDecode

- 镜头卡: `references/shots/typography/type-entrance-moves.md`
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `ScrambleDecode.tsx:11` `const CHARSET = 'ABCDEF0123456789#$%&';`
  - `ScrambleDecode.tsx:12` `const LOCK_START = 20; // 第 0 个字符锁定帧`
  - `ScrambleDecode.tsx:13` `const LOCK_STEP = 6; // 相邻字符锁定间隔`
  - `ScrambleDecode.tsx:14` `const FLASH_LEN = 2; // 锁定反色闪持续帧数`
- 卡片参数:
  - `type-entrance-moves.md:5` `时长: 单式 5s（含 hold 与静止收尾；动作段 ~116f，demo 150f）`
  - `type-entrance-moves.md:23` `| 坠落 | 第 i 字符帧 4+36·(1−(1−i/(n−1))^1.5) 起跳（首末字固定在 4f / 40f，间隔越来越密；demo 9 字符 6.5→1.6f）；y = −DROP + DROP·(t/24)²（重力）→ 4u(1−u) 抛物线弹跳 30% → 二跳 9% | 弹跳衰减比 30%/9% 是"有弹性但不闹"的甜点；三跳以上读作果冻 |`
  - `type-entrance-moves.md:25` `| 归位一拍 | 全员落定后（如帧 110）6f ease-out 集体 rotate→0 + scale 1.06→1 | 集体归位是句号——错峰归位会把"立正"的仪式感拆散 |`
  - `type-entrance-moves.md:26` `| 收尾 | 动作完毕真静止 ≥20f | R1：静止期所有属性锁死（含歪角归零后） |`
  - `type-entrance-moves.md:31` `- 落地砸声是声音强依赖候选位（sound-design §4.5）：逐字钉帧会让重量感翻倍，`
  - `type-entrance-moves.md:37` `- 标题入场自带高注意力——别和其他高能量入场同帧抢戏`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/typography/typewriter-moves/TerminalTypewriter

- 镜头卡: `references/shots/typography/typewriter-moves.md`
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `TerminalTypewriter.tsx:4` `// Easing.in(cubic) 急推 scale 1→3.2 向命令行推入（末 2f 加 blur）硬切到`
  - `TerminalTypewriter.tsx:23` `const TW = 1100;`
  - `TerminalTypewriter.tsx:24` `const TH = 620;`
  - `TerminalTypewriter.tsx:25` `const TL = (1920 - TW) / 2; // 410`
  - `TerminalTypewriter.tsx:26` `const TT = (1080 - TH) / 2; // 230`
  - `TerminalTypewriter.tsx:27` `const TITLEBAR = 52;`
  - `TerminalTypewriter.tsx:28` `const PAD = 34;`
  - `TerminalTypewriter.tsx:30` `const FOCUS_X = 960;`
  - `TerminalTypewriter.tsx:31` `const FOCUS_Y = TT + TITLEBAR + PAD + 92; // ≈ 408`
  - `TerminalTypewriter.tsx:79` `// 回车急推：整场景 scale 1→3.2，6f Easing.in(cubic)，向命令行推入`
  - `TerminalTypewriter.tsx:80` `const pushScale = interpolate(frame, [T.enter, T.pushEnd], [1, 3.2], {`
  - `TerminalTypewriter.tsx:82` `easing: Easing.in(Easing.cubic),`
  - `TerminalTypewriter.tsx:85` `const pushBlur = interpolate(frame, [T.pushEnd - 2, T.pushEnd], [0, 10], {`
  - `TerminalTypewriter.tsx:93` `const dashScale = interpolate(frame, [T.pushEnd, T.settleEnd], [1.06, 1], {`
  - `TerminalTypewriter.tsx:95` `easing: Easing.out(Easing.cubic),`
- 卡片参数:
  - `typewriter-moves.md:5` `时长: ~5.3s（160f）`
  - `typewriter-moves.md:20` `| A error-retype | 打 2f/字符 → 停顿 16f 光标闪两下 → 退 1.5f/字符 → 重打 1.5f/字符无犹豫；光标打删常亮、停顿才闪 | slogan 字卡的"改口"戏；否定式文案 |`
  - `typewriter-moves.md:25` `| 字符节奏 | substring(0, floor((f-起点)/步长))，帧确定无插值 | 任何缓动打字都读作加载动画 |`
  - `typewriter-moves.md:26` `| 三档速度 | 打 2f/字符、删 1.5f、重打 1.5f 且零犹豫 | 三档差必须可感——等速改口读作 bug 不是戏，命门 |`
  - `typewriter-moves.md:27` `| 光标三态 | 打删常亮＝果断；停顿 4f 半周期闪两下＝犹豫；完稿闪两下后条件摘除 | 光标就是演员的脸，全程等速闪就没有"犹豫" |`
  - `typewriter-moves.md:28` `| 排版 | 逐字符固定宽 span（60px 等宽槽），左缘锚定 | 变宽字体/整串测宽会逐帧重排抖动 |`
  - `typewriter-moves.md:29` `| 收尾 | 静止 ≥50f | 光标残留 0.05 opacity 都毁真静止 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/typography/typing-code-block/TypingCodeBlock

- 镜头卡: 无
- 时长: 138 帧 / 4600 ms, `DURATION` 于第 8 行
- 分镜:
  - `TypingCodeBlock.tsx:8` `export const TYPING_CODE_BLOCK_DURATION = 138; // 4600ms @30fps`
  - `TypingCodeBlock.tsx:12` `const ID = '#e8eaf0';`
  - `TypingCodeBlock.tsx:13` `const FN = '#82aaff';`
  - `TypingCodeBlock.tsx:14` `const ST = '#c3e88d';`
  - `TypingCodeBlock.tsx:15` `const PU = '#89ddff';`
  - `TypingCodeBlock.tsx:16` `const CM = '#546e7a';`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 没有帧采样. 当静态夹具.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/ui-entrance/element-body-moves/AxialStretch

- 镜头卡: `references/shots/ui-entrance/element-body-moves.md`
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `AxialStretch.tsx:10` `const CARD_W = 380;`
  - `AxialStretch.tsx:11` `const CARD_H = 230;`
  - `AxialStretch.tsx:12` `const GAP = 60;`
  - `AxialStretch.tsx:13` `const ROW_W = 3 * CARD_W + 2 * GAP; // 1260`
  - `AxialStretch.tsx:14` `const ROW_X0 = (W - ROW_W) / 2; // 330`
  - `AxialStretch.tsx:15` `const ROW_Y = (1080 - CARD_H) / 2; // 425`
  - `AxialStretch.tsx:17` `const START_X = 1980; // 完全在画面右外`
  - `AxialStretch.tsx:18` `const FLIGHT = 36; // 飞行帧数`
  - `AxialStretch.tsx:19` `const STAGGER = 12; // 错峰`
  - `AxialStretch.tsx:20` `const FIRST = 10; // 首卡起飞帧`
  - `AxialStretch.tsx:21` `const SQUASH = 8; // 落点回弹帧数`
  - `AxialStretch.tsx:23` `const VEL_MIN = 2; // px/frame，低于此不拉伸`
  - `AxialStretch.tsx:24` `const VEL_REF = 140; // px/frame，达到此速度即满拉伸`
  - `AxialStretch.tsx:25` `const STRETCH_X = 1.2; // scaleX 峰值 1 + 1.2 = 2.2`
  - `AxialStretch.tsx:26` `const SQUISH_Y = 0.28; // scaleY 谷值 1 - 0.28 = 0.72`
  - `AxialStretch.tsx:29` `const flightEase = Easing.inOut(Easing.poly(4));`
  - `AxialStretch.tsx:32` `interpolate(f, [start, start + FLIGHT], [START_X, targetX], {`
  - `AxialStretch.tsx:52` `const sqX = interpolate(frame, [land, land + SQUASH / 2, land + SQUASH], [1, 0.85, 1], {`
  - `AxialStretch.tsx:53` `easing: Easing.out(Easing.cubic),`
  - `AxialStretch.tsx:57` `const sqY = interpolate(frame, [land, land + SQUASH / 2, land + SQUASH], [1, 1.1, 1], {`
  - `AxialStretch.tsx:58` `easing: Easing.out(Easing.cubic),`
  - `AxialStretch.tsx:81` `const titleOp = interpolate(frame, [0, 10], [0, 1], {`
- 卡片参数:
  - `element-body-moves.md:5` `时长: A 150f 5s`
  - `element-body-moves.md:18` `| A contact-shadow-lift | 斜俯拍桌面（rotateX 24°→20°）上卡沿法线 translateZ 96px + scale 1.05；阴影是躺在桌面 z=0 的两层独立实体（接触核 + 环境影），随抬升变大、变虚、变淡、向背光侧偏移；点名卡落回 8f in-cubic + 2f 微压卡壳，末张选定卡弹簧抬起后停在空中 | 逐张点名强调；2.5D 段落的离面铺垫 |`
  - `element-body-moves.md:25` `| A 落地 | scale 0.99 卡壳 2f 再 5f 回弹到 1 | 无微压读作飘落，没有重量 |`
  - `element-body-moves.md:26` `| 收尾 | 末张选定后悬停 ~50f | 若要循环，把末张改成同样落回 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/ui-entrance/floating-glossy-label-pills/FloatingGlossyLabelPills

- 镜头卡: 无
- 时长: 120 帧 / 4000 ms, `DURATION` 于第 13 行
- 分镜:
  - `FloatingGlossyLabelPills.tsx:13` `export const FLOATING_GLOSSY_LABEL_PILLS_DURATION = 120; // 4000ms @30fps`
  - `FloatingGlossyLabelPills.tsx:16` `const ACCENT = '#7a8699'; // 中性蓝灰做默认演示色`
  - `FloatingGlossyLabelPills.tsx:17` `const ACCENT_LIGHT = '#a8b2c0', ACCENT_DEEP = '#4c5666';`
  - `FloatingGlossyLabelPills.tsx:18` `const A_RGB = '122,134,153', AL_RGB = '168,178,192', AD_RGB = '76,86,102';`
  - `FloatingGlossyLabelPills.tsx:26` `const CW = 330, CH = 255, CS = 252 / CW;`
  - `FloatingGlossyLabelPills.tsx:28` `const PANEL_TOP = 75;`
  - `FloatingGlossyLabelPills.tsx:31` `const TITLE = '#a8adb5', TEXT = '#d4d7dd', FAINT = '#e3e5ea', LINE = '#eceef1';`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 没有帧采样. 当静态夹具.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/ui-entrance/morph-from-primitive/MorphFromPrimitive

- 镜头卡: 无
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `MorphFromPrimitive.tsx:8` `const CX = 960;`
  - `MorphFromPrimitive.tsx:9` `const CY = 540;`
  - `MorphFromPrimitive.tsx:11` `const RECT_W = 520;`
  - `MorphFromPrimitive.tsx:12` `const RECT_H = 300;`
  - `MorphFromPrimitive.tsx:13` `const RECT_R = 20;`
  - `MorphFromPrimitive.tsx:23` `const KAPPA = 0.5522847498;`
  - `MorphFromPrimitive.tsx:132` `const breath = interpolate(frame, [10, 20, 30], [1, 1.12, 1], {`
  - `MorphFromPrimitive.tsx:133` `easing: Easing.inOut(Easing.cubic),`
  - `MorphFromPrimitive.tsx:138` `const t = interpolate(frame, [30, 54], [0, 1], {`
  - `MorphFromPrimitive.tsx:139` `easing: Easing.inOut(Easing.cubic),`
  - `MorphFromPrimitive.tsx:144` `const contentOpacity = interpolate(frame, [56, 68], [0, 1], {`
  - `MorphFromPrimitive.tsx:145` `easing: Easing.out(Easing.cubic),`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/ui-entrance/paper-craft-moves/MaskingTapeSlap

- 镜头卡: 无
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `MaskingTapeSlap.tsx:10` `const CARD_W = 560;`
  - `MaskingTapeSlap.tsx:11` `const CARD_H = 350;`
  - `MaskingTapeSlap.tsx:12` `const CX = (1920 - CARD_W) / 2;`
  - `MaskingTapeSlap.tsx:13` `const CY = (1080 - CARD_H) / 2 + 40;`
  - `MaskingTapeSlap.tsx:15` `const FLOAT_START = 12; // 开头 12f 空场静置`
  - `MaskingTapeSlap.tsx:16` `const FLOAT_END = 38;`
  - `MaskingTapeSlap.tsx:17` `const SLAP1 = 58;`
  - `MaskingTapeSlap.tsx:18` `const SLAP2 = 82;`
  - `MaskingTapeSlap.tsx:19` `const APPROACH = 6; // 胶带从画外扑向卡面的帧数`
  - `MaskingTapeSlap.tsx:20` `const FREEZE = 2; // 拍死后晃动归零帧数`
  - `MaskingTapeSlap.tsx:24` `const rise = interpolate(f, [FLOAT_END, FLOAT_END + 8], [0, 1], {`
  - `MaskingTapeSlap.tsx:28` `const damp = interpolate(f, [SLAP1, SLAP1 + 4], [1, 0.45], {`
  - `MaskingTapeSlap.tsx:42` `: interpolate(f, [SLAP2, SLAP2 + FREEZE], [raw(SLAP2), 0], {`
  - `MaskingTapeSlap.tsx:57` `const t = interpolate(frame, [land - APPROACH, land], [0, 1], {`
  - `MaskingTapeSlap.tsx:58` `easing: Easing.out(Easing.cubic),`
  - `MaskingTapeSlap.tsx:62` `const scale = interpolate(t, [0, 1], [1.45, 1]);`
  - `MaskingTapeSlap.tsx:65` `const opacity = interpolate(frame, [land - APPROACH, land - APPROACH + 2], [0, 0.85], {`
  - `MaskingTapeSlap.tsx:69` `const r = interpolate(frame, [land - APPROACH, land, land + 4], [rot - 16, rot + 7, rot], {`
  - `MaskingTapeSlap.tsx:70` `easing: Easing.out(Easing.quad),`
  - `MaskingTapeSlap.tsx:103` `const floatY = interpolate(frame, [FLOAT_START, FLOAT_END], [-120, 0], {`
  - `MaskingTapeSlap.tsx:104` `easing: Easing.out(Easing.cubic),`
  - `MaskingTapeSlap.tsx:108` `const floatOp = interpolate(frame, [FLOAT_START, FLOAT_START + 10], [0, 1], {`
  - (运动行 26 条, 留前 22 条, 文件 163 行已逐行扫过)
- 卡片参数:
  - 无对应镜头卡
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/ui-entrance/paper-craft-moves/PopupBookRise

- 镜头卡: 无
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `PopupBookRise.tsx:11` `const FPS = 30;`
  - `PopupBookRise.tsx:12` `const HOLD = 14; // 开头静置`
  - `PopupBookRise.tsx:13` `const STAGGER = 7;`
  - `PopupBookRise.tsx:14` `const RISE_DUR = 34; // spring 视觉收敛帧数`
  - `PopupBookRise.tsx:15` `const LAST_START = HOLD + 5 * STAGGER; // 49`
  - `PopupBookRise.tsx:16` `const SETTLE = LAST_START + RISE_DUR; // 83：全部立起`
  - `PopupBookRise.tsx:17` `const REST = SETTLE + 25; // 108：场景回正完成`
  - `PopupBookRise.tsx:20` `const AREA_X = 220 + 36;`
  - `PopupBookRise.tsx:21` `const AREA_Y = 72 + 36;`
  - `PopupBookRise.tsx:22` `const AREA_W = 1920 - 220 - 72;`
  - `PopupBookRise.tsx:23` `const AREA_H = 1080 - 72 - 72;`
  - `PopupBookRise.tsx:24` `const GAP = 28;`
  - `PopupBookRise.tsx:25` `const CELL_W = (AREA_W - 2 * GAP) / 3;`
  - `PopupBookRise.tsx:26` `const CELL_H = (AREA_H - GAP) / 2;`
  - `PopupBookRise.tsx:35` `const s = spring({`
  - `PopupBookRise.tsx:38` `config: { damping: 11, stiffness: 130, mass: 0.9 },`
  - `PopupBookRise.tsx:44` `const rx = interpolate(s, [0, 1], [0, -90]);`
  - `PopupBookRise.tsx:94` `const sceneRx = interpolate(frame, [SETTLE, REST], [75, 68], {`
  - `PopupBookRise.tsx:95` `easing: Easing.inOut(Easing.cubic),`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/ui-entrance/platform-hinge-rise/PlatformHingeRise

- 镜头卡: 无
- 时长: 104 帧 / 3467 ms, `DURATION` 于第 7 行
- 分镜:
  - `PlatformHingeRise.tsx:7` `export const PLATFORM_HINGE_RISE_DURATION = 104;`
  - `PlatformHingeRise.tsx:12` `interpolate(frame, [start, Math.max(start + 1, end)], [from, to], {`
  - `PlatformHingeRise.tsx:14` `easing: Easing.bezier(0.16, 1, 0.3, 1),`
  - `PlatformHingeRise.tsx:18` `interpolate(frame, [start, Math.max(start + 1, end)], [0, 1], {`
  - `PlatformHingeRise.tsx:20` `easing: Easing.bezier(0.4, 0, 0.2, 1),`
  - `PlatformHingeRise.tsx:52` `transform: 'translateY(${interpolate(progress, [0, 1], [rise, 0])}px) rotate(${interpolate(`
  - `PlatformHingeRise.tsx:101` `transform: 'translateY(${interpolate(context, [0, 1], [18, 0])}px) scale(${interpolate(`
  - `PlatformHingeRise.tsx:147` `opacity: interpolate(conclusion, [0, 0.18, 1], [0, 0.45, 1], CLAMP),`
  - `PlatformHingeRise.tsx:148` `transform: 'translateY(${interpolate(conclusion, [0, 1], [96, 0])}px)',`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/ui-entrance/runway-ground-skim/RunwayGroundSkim

- 镜头卡: 无
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `RunwayGroundSkim.tsx:11` `const INK = '#3c3c42';`
  - `RunwayGroundSkim.tsx:12` `const MID = '#8d8d94';`
  - `RunwayGroundSkim.tsx:13` `const FAINT = '#d2d2d5';`
  - `RunwayGroundSkim.tsx:15` `const easeRise = Easing.bezier(0.42, 0, 0.16, 1);`
  - `RunwayGroundSkim.tsx:25` `const CARD_W = 760;`
  - `RunwayGroundSkim.tsx:51` `const GRID_X = 1180, GRID_Y = 760, COL_GAP = 850, ROW_GAP = 250;`
  - `RunwayGroundSkim.tsx:149` `const START0 = 6, GAP = 1.5, FALLF = 9;`
  - `RunwayGroundSkim.tsx:161` `const riseP = interpolate(frame, [38, 94], [0, 1], { easing: easeRise, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });`
  - `RunwayGroundSkim.tsx:164` `const landP = interpolate(frame, [0, 34], [0, 1], { easing: Easing.bezier(0.3, 0.1, 0.6, 0.9), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });`
  - `RunwayGroundSkim.tsx:165` `const rx = interpolate(landP, [0, 1], [72, 66]) - 66 * riseP;`
  - `RunwayGroundSkim.tsx:166` `const z = interpolate(landP, [0, 1], [-620, -320]) + riseP * (-1620 - -320);`
  - `RunwayGroundSkim.tsx:167` `const bright = interpolate(frame, [0, 32, 86], [0.32, 0.8, 1.0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/ui-entrance/skeleton-reveal/SkeletonReveal

- 镜头卡: 无
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `SkeletonReveal.tsx:22` `const INK = '#2f2f2f';`
  - `SkeletonReveal.tsx:23` `const PAPER = '#f2f0ea';`
  - `SkeletonReveal.tsx:114` `const AVA = ['#5a5a58', '#7a7a78', '#4a4a48', '#8f8f8d'];`
  - `SkeletonReveal.tsx:181` `const SWAP = 32; // 涂鸦 → 骨架的那一拍`
  - `SkeletonReveal.tsx:185` `const doodleOut = interpolate(f, [SWAP, SWAP + 8], [0, 1], {`
  - `SkeletonReveal.tsx:187` `easing: Easing.in(Easing.cubic),`
  - `SkeletonReveal.tsx:192` `const winIn = spring({ frame: f - SWAP, fps, config: { damping: 16, stiffness: 160, mass: 0.7 } });`
  - `SkeletonReveal.tsx:196` `interpolate(f, [SWAP + 12 + i * 6, SWAP + 34 + i * 6], [520, 0], {`
  - `SkeletonReveal.tsx:198` `easing: Easing.out(Easing.cubic),`
  - `SkeletonReveal.tsx:202` `const zoom = interpolate(f, [66, 142], [1, 1.34], {`
  - `SkeletonReveal.tsx:204` `easing: Easing.inOut(Easing.cubic),`
  - `SkeletonReveal.tsx:209` `interpolate(f, [80 + i * 13, 92 + i * 13], [0, 1], {`
  - `SkeletonReveal.tsx:211` `easing: Easing.out(Easing.quad),`
  - `SkeletonReveal.tsx:218` `return interpolate(f, [start, start + 9], [0, 1], {`
  - `SkeletonReveal.tsx:220` `easing: Easing.out(Easing.cubic),`
  - `SkeletonReveal.tsx:241` `transform: 'scale(${interpolate(winIn, [0, 1], [1.08, 1])})',`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/ui-entrance/svg-shape-morph/SvgShapeMorph

- 镜头卡: 无
- 时长: 156 帧 / 5200 ms, `DURATION` 于第 9 行
- 分镜:
  - `SvgShapeMorph.tsx:9` `export const SVG_SHAPE_MORPH_DURATION = 156; // 5200ms @30fps`
  - `SvgShapeMorph.tsx:11` `const CX = 240;`
  - `SvgShapeMorph.tsx:12` `const CY = 138;`
  - `SvgShapeMorph.tsx:14` `const BASE = 76;`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 没有帧采样. 当静态夹具.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/_legacy/ui-entrance/wall-reveal-moves/GridWaveFlip

- 镜头卡: `references/shots/ui-entrance/wall-reveal-moves.md`
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `GridWaveFlip.tsx:9` `const COLS = 3;`
  - `GridWaveFlip.tsx:10` `const ROWS = 3;`
  - `GridWaveFlip.tsx:11` `const CELL_W = 520;`
  - `GridWaveFlip.tsx:12` `const CELL_H = 280;`
  - `GridWaveFlip.tsx:13` `const GAP = 36;`
  - `GridWaveFlip.tsx:14` `const HOLD = 20; // 开头建立`
  - `GridWaveFlip.tsx:15` `const STAGGER = 6; // 对角线波前步进`
  - `GridWaveFlip.tsx:16` `const FLIP = 14; // 单张翻转时长`
  - `GridWaveFlip.tsx:18` `const flipEase = Easing.bezier(0.35, 0, 0.25, 1);`
  - `GridWaveFlip.tsx:25` `return interpolate(frame, [delay, delay + FLIP], [0, 180], {`
  - `GridWaveFlip.tsx:32` `const main = interpolate(frame, [delay, delay + FLIP], [0, 190], {`
  - `GridWaveFlip.tsx:37` `const settle = interpolate(frame, [delay + FLIP, delay + FLIP + 8], [0, -10], {`
  - `GridWaveFlip.tsx:40` `easing: Easing.out(Easing.cubic),`
  - `GridWaveFlip.tsx:77` `const glowTop = interpolate(angle, [45, 135], [8, 92], {`
- 卡片参数:
  - `wall-reveal-moves.md:5` `时长: 单式约 5s（A 150f / B 150f @30fps，含建立 hold 与静止收尾）`
  - `wall-reveal-moves.md:13` `版式从第一帧就成立，观众看的是"状态变化的波前扫过一面墙"而不是"物体飞行"。`
  - `wall-reveal-moves.md:25` `| A 节拍 | hold 20f → 每格间隔 12f 依次激活（六格 ~96f 全亮）→ scale 1→1.04 缓推 25f（bezier 0.33,0,0.2,1）→ 静止收尾 | 12f 级联是"逐格可辨"与"整墙拖沓"的平衡点；格数增多可压到 8–10f，但间隔均匀本身就是这一式的庄重感来源，别学发牌加速 |`
  - `wall-reveal-moves.md:26` `| A 单格 | 暗态 opacity 0.18 + translateY 20px；SVG rect pathLength=100 描边 8f：22% 周长的彗星段（#e8b45e 6px 高斯辉光 + #ffe3ae 2.5px 亮芯）领跑，身后留 1.5px 细边；描边过半（+6f）内容 back-out(0.3,1.4,0.5,1) 弹出 8f 提亮归位；描完 +12f 流光退火到 0.4 常亮细边 | 描边与内容弹出要**接力...`
  - `wall-reveal-moves.md:27` `| B 描线 | hold 20f → 分组错峰各 30f 描完：侧栏 20f 起/顶栏 30f 起/6 卡 40+i*3f 起/折线图 52f 起；SVG pathLength=1 + dashoffset 1→0，蓝图冷灰蓝 #6c7894（外框 1.6px / 内件 1.25px）round，淡蓝 24px 点阵底 + 卡角裁切标记 | 分组错峰是"手在画"的感觉来源，全部同帧起笔读作打印机；卡内占位线再按 +3f 细错峰，长短用...`
  - `wall-reveal-moves.md:28` `| B 实体化 | 88–118f 实体层 clip-path inset(0 right% 0 0) 从左向右展开 30f，bezier(0.55,0,0.25,1)；前沿跟 4px 强调色竖线（#ffc46b + 双层辉光 boxShadow），86–92f 淡入、112–120f 淡出；竖线身后 260px 一段渐隐暖光（刚显影的余温） | 竖线位置与 clip 前沿必须同一个 scan 值驱动，异步读作穿帮；描线段与扫描段之间留...`
  - `wall-reveal-moves.md:29` `| 静止收尾 | 两式动作全部落定后真静止 ≥15f（A 在缓推结束后、B 在扫描线淡出后起算） | R1 呼吸判例：静止期一切属性锁死，包括辉光/阴影/高光残留 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 遗留演示, 不进首页, 幅度和否决仍可引用.

### demos/camera/basic-3d-scene/Basic3DScene

- 镜头卡: `references/shots/camera/basic-3d-scene.md`
- 时长: 225 帧 / 7500 ms, `DURATION` 于第 32 行
- 分镜:
  - `Basic3DScene.tsx:32` `export const BASIC_3D_SCENE_DURATION = 225; // 7.5s @30fps`
  - `Basic3DScene.tsx:35` `const GOLD = L.accent2;`
  - `Basic3DScene.tsx:36` `const CW = 1240; // 卡片原生尺寸（对位时屏幕 1:1）`
  - `Basic3DScene.tsx:37` `const CH = 700;`
  - `Basic3DScene.tsx:38` `const PERSP = 2600;`
  - `Basic3DScene.tsx:56` `const ARRIVE = [0, 64, 128, 190]; // 每站落位帧（站 0 开场即在）`
  - `Basic3DScene.tsx:57` `const HOLD_END = [36, 96, 158, 225];`
  - `Basic3DScene.tsx:58` `const FLY_EASE = bezier(0.62, 0, 0.16, 1); // 起步稳、落位很软的不对称 in-out`
  - `Basic3DScene.tsx:59` `const HOP = 0.3; // 站间飞行途中额外拉远比例`
  - `Basic3DScene.tsx:99` `const MOTES = Array.from({ length: 70 }, (_, i) => ({`
  - `Basic3DScene.tsx:226` `const SHUTTER = 0.5;`
- 卡片参数:
  - `basic-3d-scene.md:5` `时长: 约 7.5s（225f@30fps；四站，三段飞行 28/32/32f，每站停留 ≥30f）`
  - `basic-3d-scene.md:16` `- 飞行链式插值：三段飞行 36–64 / 96–128 / 158–190（帧），不对称 in-out bezier(0.62,0,0.16,1)；站间飞行途中相机额外拉远 30%（hop，sin 包络）让观众看见空间里的其他卡；飞行段做时间采样运动模糊（快门 0.5f，子帧 1–8 按相机位移自适应）`
  - `basic-3d-scene.md:17` `- 停留段不死：落位后相机极缓推近 1.5%（下一段起飞时同曲线还原），卡底金色进度线走满当前段；标题在落位前 8f 逐字从线下升起，每张卡只揭示一次`
  - `basic-3d-scene.md:19` `- OVERVIEW 落版挂在总览站姿态上（放大 2.7 倍排版，相机 1/2.7 看回来 = 屏幕 1:1）：眉题是 video-shotcraft 标志 + 字标，"Craft the shot." 150px 衬线逐词升起，尾段 hold 推近 1.5%`
  - `basic-3d-scene.md:25` `| 飞行时长 | 28–32f | 有旋转的段别短于 28f，观众需要时间理解"世界在转" |`
  - `basic-3d-scene.md:26` `| 停留时长 | ≥30f | 读卡位；卡内文字多时优先加停留而不是减飞行 |`
  - `basic-3d-scene.md:36` `- 落版挂在世界里时，最后一段飞行中它是斜的：显影要晚（飞行过半再淡入），逐字揭示等落位前 6f 再开始`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 节奏或收尾只给首页最后一屏, 不做成组件默认态.

### demos/camera/crash-zoom-punch/CrashImpactReal

- 镜头卡: `references/shots/camera/crash-zoom-punch.md`
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `CrashImpactReal.tsx:29` `export const CRASHIMPACT_DUR = 126;`
  - `CrashImpactReal.tsx:35` `const CARD = CARDS[3];`
  - `CrashImpactReal.tsx:36` `const TARGET = { cx: CARD.x + CARD.w / 2, cy: CARD.y + CARD.h / 2 }; // ≈ (960, 772) 页面坐标`
  - `CrashImpactReal.tsx:37` `const CARD_R = 8.5; // 截图里卡片圆角（页面 px）`
  - `CrashImpactReal.tsx:39` `const CROP = { x: 395, y: 222, w: 1130, h: 1100 };`
  - `CrashImpactReal.tsx:40` `const CROP_C = { x: CROP.x + CROP.w / 2, y: CROP.y + CROP.h / 2 };`
  - `CrashImpactReal.tsx:41` `const SCREEN_R = 22; // 监视屏圆角（页面 px）`
  - `CrashImpactReal.tsx:43` `const PUSH = 40;`
  - `CrashImpactReal.tsx:44` `const HIT = 46;`
  - `CrashImpactReal.tsx:45` `const Z_WIDE = 0.78;`
  - `CrashImpactReal.tsx:46` `const Z_HIT = 2.35; // 落定倍率：卡片 ≈ 840×733，占画高 68%，左右各留 ~540px 给 HUD 读数`
  - `CrashImpactReal.tsx:188` `const SHUTTER = 0.55;`
- 卡片参数:
  - `crash-zoom-punch.md:3` `一句话: 全景一拍急推到目标特写（6f），落位二选一——过冲回弹（弹性）或撞停震屏（重量）`
  - `crash-zoom-punch.md:5` `时长: 约 0.5s 动作 + 前后 hold（动作 6–11f，前 hold ≥30f 建立全景、后 hold ≥45f 读特写）`
  - `crash-zoom-punch.md:16` `- zoom 6f ease-in 急加速（如 1→2.6），cx/cy 同步 ease-in 收敛到目标中心`
  - `crash-zoom-punch.md:17` `- 回弹款：zoom 过冲后 5f 回收 3–6%（2.6→2.45）`
  - `crash-zoom-punch.md:18` `- 撞停款：到位帧起机位高频抖 + 指数衰减（amp 14px、τ≈1.8f、6f 收干），`
  - `crash-zoom-punch.md:21` `（快门 ≈200°，子帧逐层 opacity 1/(i+1) 等权叠加，子帧数按本帧位移自适应、`
  - `crash-zoom-punch.md:23` `亦可，但其半透明叠层在近静止帧会让底色发灰偏黄。CrashZoomReal 的页面小字只有 ~14px，`
  - `crash-zoom-punch.md:24` `回波间距压到 ≤6px（上限 44 层），高速帧再按间距给每层补 ≤4px 微模糊，把离散回波抹成连续拖影`
  - `crash-zoom-punch.md:25` `- 急推前 6–8f 预备回拉 ~3–4%（先退后冲），全景 hold 段给 ~2–3% 的极缓 creep`
  - `crash-zoom-punch.md:28` `拉正；到位帧一记暖色曝光闪（指数衰减 ~8f），周边压暗 86% + 目标卡轮廓光；回弹收干后相机平滑`
  - `crash-zoom-punch.md:29` `左移 320px 把卡让到左侧，右栏落一组大号读数（232px 数字 + 说明），尾帧是完整海报`
  - `crash-zoom-punch.md:31` `荧光取景框在全景里扫描跳格（card1 → card5 → card4，各 8f snappy）、28f 收紧锁定并亮出 LOCK 标签后才急推`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 首页采用. 预备拍, 过冲, 停稳或坐标轴冲击按这镜的帧数改成可逆进度.

### demos/camera/crash-zoom-punch/CrashZoomReal

- 镜头卡: `references/shots/camera/crash-zoom-punch.md`
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `CrashZoomReal.tsx:32` `export const CRASHZOOM_DUR = 132;`
  - `CrashZoomReal.tsx:35` `const CARD = layout.projects.cards[3];`
  - `CrashZoomReal.tsx:36` `const TARGET = { cx: CARD.x + CARD.w / 2, cy: CARD.y + CARD.h / 2 }; // ≈ (960, 772) 页面坐标`
  - `CrashZoomReal.tsx:37` `const CARD_R = 8.5; // 截图里卡片圆角（页面 px）`
  - `CrashZoomReal.tsx:41` `const WIN = { x: 220, y: 0, w: 1480, h: 1060 };`
  - `CrashZoomReal.tsx:42` `const CHROME = 54; // 窗口标题栏高（页面 px）`
  - `CrashZoomReal.tsx:43` `const WIN_R = 18;`
  - `CrashZoomReal.tsx:44` `const WIN_C = { x: WIN.x + WIN.w / 2, y: (WIN.y - CHROME + WIN.y + WIN.h) / 2 }; // 窗口几何中心`
  - `CrashZoomReal.tsx:46` `const PUSH = 40; // 急推起点`
  - `CrashZoomReal.tsx:47` `const HIT = 46; // 到位帧（6f 急推）`
  - `CrashZoomReal.tsx:48` `const PEAK = 2.48; // 急推冲到的峰值（比落定高 6%，卡片参数表"回弹幅度 3–6%"的上沿）`
  - `CrashZoomReal.tsx:49` `const REST = 2.34; // 回弹后落定倍率（卡片 ≈ 836×730，占画高 68%）`
  - `CrashZoomReal.tsx:50` `const SHIFT = 56; // 跟随左移起点（回弹在 ~56f 已收干）`
  - `CrashZoomReal.tsx:51` `const CARD_X_END = 640; // 跟随后卡片中心的屏幕 x`
  - `CrashZoomReal.tsx:163` `const SHUTTER = 0.55; // 帧（≈200° 快门）`
- 卡片参数:
  - `crash-zoom-punch.md:3` `一句话: 全景一拍急推到目标特写（6f），落位二选一——过冲回弹（弹性）或撞停震屏（重量）`
  - `crash-zoom-punch.md:5` `时长: 约 0.5s 动作 + 前后 hold（动作 6–11f，前 hold ≥30f 建立全景、后 hold ≥45f 读特写）`
  - `crash-zoom-punch.md:16` `- zoom 6f ease-in 急加速（如 1→2.6），cx/cy 同步 ease-in 收敛到目标中心`
  - `crash-zoom-punch.md:17` `- 回弹款：zoom 过冲后 5f 回收 3–6%（2.6→2.45）`
  - `crash-zoom-punch.md:18` `- 撞停款：到位帧起机位高频抖 + 指数衰减（amp 14px、τ≈1.8f、6f 收干），`
  - `crash-zoom-punch.md:21` `（快门 ≈200°，子帧逐层 opacity 1/(i+1) 等权叠加，子帧数按本帧位移自适应、`
  - `crash-zoom-punch.md:23` `亦可，但其半透明叠层在近静止帧会让底色发灰偏黄。CrashZoomReal 的页面小字只有 ~14px，`
  - `crash-zoom-punch.md:24` `回波间距压到 ≤6px（上限 44 层），高速帧再按间距给每层补 ≤4px 微模糊，把离散回波抹成连续拖影`
  - `crash-zoom-punch.md:25` `- 急推前 6–8f 预备回拉 ~3–4%（先退后冲），全景 hold 段给 ~2–3% 的极缓 creep`
  - `crash-zoom-punch.md:28` `拉正；到位帧一记暖色曝光闪（指数衰减 ~8f），周边压暗 86% + 目标卡轮廓光；回弹收干后相机平滑`
  - `crash-zoom-punch.md:29` `左移 320px 把卡让到左侧，右栏落一组大号读数（232px 数字 + 说明），尾帧是完整海报`
  - `crash-zoom-punch.md:31` `荧光取景框在全景里扫描跳格（card1 → card5 → card4，各 8f snappy）、28f 收紧锁定并亮出 LOCK 标签后才急推`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 首页采用. 预备拍, 过冲, 停稳或坐标轴冲击按这镜的帧数改成可逆进度.

### demos/camera/cursor-flyover/CursorFlyover

- 镜头卡: `references/shots/camera/cursor-flyover.md`
- 时长: 240 帧 / 8000 ms, `DURATION` 于第 31 行
- 分镜:
  - `CursorFlyover.tsx:31` `export const CURSOR_FLYOVER_DURATION = 240; // 8s @30fps`
  - `CursorFlyover.tsx:35` `const UP = '#0f9d76'; // 正向涨幅（accent2 压暗一档，白底上够对比）`
  - `CursorFlyover.tsx:38` `const WW = 2400, WH = 1500;`
  - `CursorFlyover.tsx:48` `const CH = { x: 64, y: 190, w: 992, h: 360 };`
  - `CursorFlyover.tsx:49` `const LY = [0.62, 0.55, 0.58, 0.46, 0.5, 0.4, 0.44, 0.33, 0.37, 0.24, 0.3, 0.18];`
  - `CursorFlyover.tsx:52` `const HOT = 9;`
  - `CursorFlyover.tsx:68` `const LEG0 = 22; // 第 1 站光标起步`
  - `CursorFlyover.tsx:69` `const LEG = 44; // 每站周期`
  - `CursorFlyover.tsx:72` `const BACK = 198; // 拉回俯瞰`
  - `CursorFlyover.tsx:73` `const CAM_EASE = bezier(0.55, 0, 0.18, 1); // 起步干脆、落位很软`
  - `CursorFlyover.tsx:125` `const REV_BARS_A = [0.42, 0.5, 0.46, 0.58, 0.52, 0.6, 0.55, 0.64, 0.6, 0.7, 0.66, 0.74];`
  - `CursorFlyover.tsx:126` `const REV_BARS_B = [0.3, 0.38, 0.45, 0.42, 0.55, 0.62, 0.58, 0.7, 0.76, 0.82, 0.88, 0.96];`
  - `CursorFlyover.tsx:159` `const sp = f < clickAt(0) + 2 ? 0 : springAt(f, clickAt(0) + 2 + i * 1.4, { damping: 15, stiffness: 190 });`
  - `CursorFlyover.tsx:187` `const tip = f < clickAt(1) + 2 ? 0 : springAt(f, clickAt(1) + 2, { damping: 14, stiffness: 210 });`
  - `CursorFlyover.tsx:242` `const on = f < clickAt(2) + 1 ? 0 : springAt(f, clickAt(2) + 1, { damping: 16, stiffness: 240 });`
- 卡片参数:
  - `cursor-flyover.md:5` `时长: 约 8.0s（240f@30fps；俯瞰 22f · 四站各 44f（飞行 20f + 停留 24f）· 拉回 24f · hold 18f）`
  - `cursor-flyover.md:14` `- 相机是查表步进：CAMS[0] 俯瞰 → 四个模块中心（左上 Frames rendered → 右上 Shot previews → 右下 Release flags → 左下 Top shots），'x/y/s' 三通道用不对称 in-out（bezier 0.55,0,0.18,1：起步干脆、落位很软）插值；站间飞行途中 s 额外拉远 ~8% 再推回（hop），并按屏幕速度加方向性运动模糊（SpeedBlur amount 0...`
  - `cursor-flyover.md:16` `- **光标是手、相机是眼**：光标先走（swift 16f，一条与位移垂直的轻弧，起止弧度为 0），相机晚 2f 起步、20f 落定；光标在目标上"瞄"一拍后按下（clickAt = 起步 +22f），按下 3f 缩到 0.84 再过冲回弹；光标画在屏幕空间，屏幕上恒为 40px`
  - `cursor-flyover.md:18` `- 每次点击触发 80px 圆环涟漪（18f，scale 0.3→1.5 淡出）`
  - `cursor-flyover.md:19` `- 第 4 站后相机 smooth 24f 拉回俯瞰，四处状态同框（"巡览结束"全家福），尾段极缓推近 1%`
  - `cursor-flyover.md:25` `| 步进节奏 | 飞行 20f / 停留 24f | 停留是读功能位，短于 15f 变"扫过"没有"参观" |`
  - `cursor-flyover.md:26` `| 光标领先 | 起步早 2f、到位早 6f | 0 = 光标被相机拖着走（像录屏）；>10f 观众先看光标再找画面 |`
  - `cursor-flyover.md:27` `| 点击涟漪 | 18f，scale 0.3→1.5 | 涟漪是节拍器，四次点击等距（每 44f）——配 SFX click 四连 |`
  - `cursor-flyover.md:29` `| 收尾拉回 | smooth 24f 回俯瞰 | 不拉回就停在最后一个模块；拉回让四处状态同框成海报 |`
  - `cursor-flyover.md:34` `- 光标与相机已解耦（各自一张表），但两者的起步/到位帧差要成对改，否则点击时相机还在动、界面响应会被运动模糊吃掉`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 节奏或收尾只给首页最后一屏, 不做成组件默认态.

### demos/camera/depth-layer-moves/MultiplaneReal

- 镜头卡: `references/shots/camera/depth-layer-moves.md`
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `MultiplaneReal.tsx:29` `export const MULTIPLANE_DUR = 165;`
  - `MultiplaneReal.tsx:33` `const DRIVE_EASE = bezier(0.45, 0, 0.18, 1);`
  - `MultiplaneReal.tsx:34` `const HERO = 3; // card4`
  - `MultiplaneReal.tsx:35` `const MID_W = 440;`
  - `MultiplaneReal.tsx:36` `const GAP = 500; // 中景卡步距`
  - `MultiplaneReal.tsx:37` `const ROW_X = 260; // 第 0 张卡左缘（中景层坐标）`
  - `MultiplaneReal.tsx:38` `const ROW_Y = 410;`
  - `MultiplaneReal.tsx:40` `const MID_END = 960 - (ROW_X + HERO * GAP + MID_W / 2);`
  - `MultiplaneReal.tsx:41` `const DRIVE = -MID_END / 0.7;`
- 卡片参数:
  - `depth-layer-moves.md:5` `时长: 4–5.5s 持续（demo 165f）`
  - `depth-layer-moves.md:19` `- 滑轨有终点：drive 总量按"中景落定时 card4 恰在屏心"反算，不对称 in-out（bezier 0.45,0,0.18,1）130f；`
  - `depth-layer-moves.md:20` `落定后主角浮起（elevation 6→26、1.035x、晚于位置收敛 ~8f）+ 赤陶描边 + 「In focus」角标，尾帧是海报；`
  - `depth-layer-moves.md:33` `- 整层全屏实时 'filter: blur()' 每帧变化很贵（实测可差 3 倍以上渲染时长）：模糊挂在层内的小元素上，别挂在铺满画面的层容器上`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 节奏或收尾只给首页最后一屏, 不做成组件默认态.

### demos/camera/graze-face-tour/GrazeFaceTour

- 镜头卡: `references/shots/camera/graze-face-tour.md`
- 时长: 150 帧 / 5000 ms, `DURATION` 于第 20 行
- 分镜:
  - `GrazeFaceTour.tsx:20` `export const GRAZE_FACE_TOUR_DURATION = 150; // 三段 × 50f`
  - `GrazeFaceTour.tsx:22` `const INK = '#17181c';`
  - `GrazeFaceTour.tsx:23` `const INK2 = '#5d6068';`
  - `GrazeFaceTour.tsx:24` `const INK3 = '#9a9ca5';`
  - `GrazeFaceTour.tsx:25` `const LINE = 'rgba(20,22,28,0.085)';`
  - `GrazeFaceTour.tsx:26` `const SURF = '#f8f8f9';`
  - `GrazeFaceTour.tsx:27` `const SIDE = '#f2f2f4';`
  - `GrazeFaceTour.tsx:28` `const ACC = '#7457f5';`
  - `GrazeFaceTour.tsx:29` `const ACC_SOFT = 'rgba(116,87,245,0.11)';`
  - `GrazeFaceTour.tsx:54` `const FALL = 0.34;`
  - `GrazeFaceTour.tsx:487` `const SEG_LEN = 50; // 每段 50 帧，总 150`
  - `GrazeFaceTour.tsx:488` `const FADE = 7;`
  - `GrazeFaceTour.tsx:518` `const FX = [44, 40, 46];`
  - `GrazeFaceTour.tsx:519` `const FY = [46, 40, 50];`
- 卡片参数:
  - `graze-face-tour.md:22` `easeFall 加速下落+软着陆（落地不回弹或极微回弹）`
  - `graze-face-tour.md:28` `会产生黑闪帧）`
  - `graze-face-tour.md:35` `| 贴落错峰 | 按镜头行进方向 0.2→0.85 归一化排布 | 同帧齐落读作开关；乱序落读作 bug；**错峰=错开起点但下落过程重叠并行**，串行等待（一个落完另一个才开始）被裁 |`
  - `graze-face-tour.md:36` `| 下落曲线 | easeFall 加速+软着陆 | ease-out 下落读作气球飘落，重力感靠加速 |`
  - `graze-face-tour.md:37` `| 段间接力 | 相邻段交叉淡化 ≥8f | 透明度窗口不搭接会黑闪（返工判例 f100 纯黑帧） |`
  - `graze-face-tour.md:49` `本卡巡礼镜=错峰并行；整体登场镜必须全体同帧齐落（那张卡的`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 节奏或收尾只给首页最后一屏, 不做成组件默认态.

### demos/camera/overhead-camera-moves/OverheadTabletopDrop

- 镜头卡: `references/shots/camera/overhead-camera-moves.md`
- 时长: 140 帧 / 4667 ms, `DURATION` 于第 29 行
- 分镜:
  - `OverheadTabletopDrop.tsx:29` `export const OVERHEAD_TABLETOP_DROP_DURATION = 140;`
  - `OverheadTabletopDrop.tsx:32` `const PAPER = '#f4f1ea'; // 样稿纸色（暖白，不用纯白）`
  - `OverheadTabletopDrop.tsx:33` `const INK = '#141414';`
  - `OverheadTabletopDrop.tsx:34` `const INK2 = '#5f5c56';`
  - `OverheadTabletopDrop.tsx:35` `const INK3 = '#9b968c';`
  - `OverheadTabletopDrop.tsx:36` `const RULE = 'rgba(20,20,20,0.1)';`
  - `OverheadTabletopDrop.tsx:37` `const GOLD = '#b8893a'; // 纸上的金（比 look 的香槟金深一档，白底可读）`
  - `OverheadTabletopDrop.tsx:40` `const CARD_W = 996;`
  - `OverheadTabletopDrop.tsx:41` `const CARD_H = 560;`
  - `OverheadTabletopDrop.tsx:42` `const GAP = 150;`
  - `OverheadTabletopDrop.tsx:44` `const RES = 2; // 卡片按落版倍率布局（1992×1120）后平面内缩回 0.5`
  - `OverheadTabletopDrop.tsx:45` `const INNER = (CARD_H * RES) / 1080; // 1.037：1920×1080 设计稿在 2x 卡内铺满`
  - `OverheadTabletopDrop.tsx:47` `const PAN_END = 50;`
  - `OverheadTabletopDrop.tsx:48` `const DROP = 58;`
  - `OverheadTabletopDrop.tsx:49` `const DROP_END = 86;`
  - `OverheadTabletopDrop.tsx:50` `const SETTLE_END = 94;`
  - `OverheadTabletopDrop.tsx:52` `const DIVE = bezier(0.36, 0, 0.12, 1); // 零速起步、快速加速、长减速落位`
  - `OverheadTabletopDrop.tsx:53` `const DIVE_SCALE = bezier(0.45, -0.18, 0.12, 1); // 先回缩 ~5%（机位微抬）再扎`
- 卡片参数:
  - `overhead-camera-moves.md:5` `时长: A 120f（4s）/ B 140f（4.7s）`
  - `overhead-camera-moves.md:22` `| A tilt-reveal | 整页绕下沿铰链 rotateX 86° 正面朝上平躺，40f 抬正（过冲 −2.2° 再软回），角度/缩放/铰链位置/透视/视点高度共用一条进度 | 开场 establishing；单主体 |`
  - `overhead-camera-moves.md:28` `| A 俯角 | rotateX 86°（f0–20 极缓 creep 到 83°）→ −2.2°（f60，速度归零）→ 0°（f70），主段 EASE.swift 不对称 in-out、过冲回落 smooth，transformOrigin 50% 100%（下沿铰链） | 首版 −55° 太弱：f0 仍见半页，无"窄带"悬念（实渲判例）；视点低于页面平面会看到背面（窄带里的字上下颠倒，实渲判例）——视点要在页面上方；分段各用 out...`
  - `overhead-camera-moves.md:30` `| A 收尾 | 机位 f70 落定；38–82 面积图折线描出、80f 终点光点亮起；70–120 极缓推近 1→1.018 | 过冲幅度 ≤3°，再大读作弹簧不是机位；69f 纯静止太长（> 1s 死帧），hold 段要有极缓推近 |`
  - `overhead-camera-moves.md:31` `| B pan 段 | 0–50f 只改 translateX +760→−360（smooth），角度不动；50–58 停 8f 选定（目标稿离桌 16px、它的顶灯亮、另两盏暗到 35%） | pan 段动角度 = 两段职责糊掉（判例：pan 巡视、drop 表态）；没有选定那一拍，扎入读作随机 |`
  - `overhead-camera-moves.md:32` `| B drop 段 | 58–86f 三通道同跑：rotateX 62→−1.6→0.5→0（零速起步的不对称曲线 + smooth 回落过冲）、scale 1→2.04→2.0（起步带 ~5% 预备回缩）、translateX −360→0 | 三通道必须同跑；分先后读作两个动作；pan 静止后直接 out-cubic 起跳是速度突变 |`
  - `overhead-camera-moves.md:35` `| B 收尾 | 机位 f94 落版；98–118 页面内金色镜头块滑入分镜板空槽（一次过冲）；94–140 极缓推近 1→1.012 | 落版后完全静止 47f 偏死；页面内给一个小动作收尾 |`
  - `overhead-camera-moves.md:41` `兜底，否则个别帧背面/深度穿帮`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 节奏或收尾只给首页最后一屏, 不做成组件默认态.

### demos/camera/overhead-camera-moves/TiltReveal

- 镜头卡: `references/shots/camera/overhead-camera-moves.md`
- 时长: 120 帧 / 4000 ms, `DURATION` 于第 30 行
- 分镜:
  - `TiltReveal.tsx:30` `export const TILT_REVEAL_DURATION = 120;`
  - `TiltReveal.tsx:34` `const HOLD = 20; // 预备 creep 结束`
  - `TiltReveal.tsx:35` `const MOVE = 40; // 主抬升 20→60`
  - `TiltReveal.tsx:36` `const SETTLE = 10; // 过冲回落 60→70`
  - `TiltReveal.tsx:37` `const FROM = 86; // 平躺俯角（页面绕下沿铰链向远处躺倒，正面朝上）`
  - `TiltReveal.tsx:38` `const CREEP = 3 / 86; // 预备段先抬 3°`
  - `TiltReveal.tsx:39` `const OVER = 1 + 2.2 / 86; // 主抬升冲过 0° 到 +2.2°`
  - `TiltReveal.tsx:40` `const S0 = 2.5; // 平躺时的放大倍率（窄带够宽、够近）`
  - `TiltReveal.tsx:41` `const S1 = 0.84; // 落定倍率：页面四周留出舞台`
  - `TiltReveal.tsx:42` `const BOT0 = 600; // 平躺时铰链（页面下沿）的屏幕 y——窄带落在画面中线附近`
  - `TiltReveal.tsx:43` `const BOT1 = 540 + (1080 * S1) / 2 - 18; // 落定时页面下沿（略偏上，给脚下反光留位）`
  - `TiltReveal.tsx:44` `const PAGE_R = 26; // 页面圆角（1x 页面 px）`
  - `TiltReveal.tsx:65` `const SERIES = [22, 26, 24, 31, 35, 33, 38, 44, 41, 47, 52, 49, 55, 61, 58, 66, 71, 69, 78, 86];`
  - `TiltReveal.tsx:66` `const CH = { x: 0, y: 0, w: 1600, h: 300 };`
  - `TiltReveal.tsx:188` `const TYPE_H1 = 120;`
- 卡片参数:
  - `overhead-camera-moves.md:5` `时长: A 120f（4s）/ B 140f（4.7s）`
  - `overhead-camera-moves.md:22` `| A tilt-reveal | 整页绕下沿铰链 rotateX 86° 正面朝上平躺，40f 抬正（过冲 −2.2° 再软回），角度/缩放/铰链位置/透视/视点高度共用一条进度 | 开场 establishing；单主体 |`
  - `overhead-camera-moves.md:28` `| A 俯角 | rotateX 86°（f0–20 极缓 creep 到 83°）→ −2.2°（f60，速度归零）→ 0°（f70），主段 EASE.swift 不对称 in-out、过冲回落 smooth，transformOrigin 50% 100%（下沿铰链） | 首版 −55° 太弱：f0 仍见半页，无"窄带"悬念（实渲判例）；视点低于页面平面会看到背面（窄带里的字上下颠倒，实渲判例）——视点要在页面上方；分段各用 out...`
  - `overhead-camera-moves.md:30` `| A 收尾 | 机位 f70 落定；38–82 面积图折线描出、80f 终点光点亮起；70–120 极缓推近 1→1.018 | 过冲幅度 ≤3°，再大读作弹簧不是机位；69f 纯静止太长（> 1s 死帧），hold 段要有极缓推近 |`
  - `overhead-camera-moves.md:31` `| B pan 段 | 0–50f 只改 translateX +760→−360（smooth），角度不动；50–58 停 8f 选定（目标稿离桌 16px、它的顶灯亮、另两盏暗到 35%） | pan 段动角度 = 两段职责糊掉（判例：pan 巡视、drop 表态）；没有选定那一拍，扎入读作随机 |`
  - `overhead-camera-moves.md:32` `| B drop 段 | 58–86f 三通道同跑：rotateX 62→−1.6→0.5→0（零速起步的不对称曲线 + smooth 回落过冲）、scale 1→2.04→2.0（起步带 ~5% 预备回缩）、translateX −360→0 | 三通道必须同跑；分先后读作两个动作；pan 静止后直接 out-cubic 起跳是速度突变 |`
  - `overhead-camera-moves.md:35` `| B 收尾 | 机位 f94 落版；98–118 页面内金色镜头块滑入分镜板空槽（一次过冲）；94–140 极缓推近 1→1.012 | 落版后完全静止 47f 偏死；页面内给一个小动作收尾 |`
  - `overhead-camera-moves.md:41` `兜底，否则个别帧背面/深度穿帮`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 节奏或收尾只给首页最后一屏, 不做成组件默认态.

### demos/camera/space-camera-moves/DroneDiveLanding

- 镜头卡: `references/shots/camera/space-camera-moves.md`
- 时长: 105 帧 / 3500 ms, `DURATION` 于第 26 行
- 分镜:
  - `DroneDiveLanding.tsx:20` `const HERO = { cx: 518, cy: 335, w: 524, h: 454 };`
  - `DroneDiveLanding.tsx:21` `const DIVE_START = 24; // 开头 24f：上帝视角建立 + 上提预备`
  - `DroneDiveLanding.tsx:22` `const DIVE_END = 49; // 主俯冲段 25f，ease-in(cubic) 越冲越快`
  - `DroneDiveLanding.tsx:23` `const LAND_END = 69; // 气垫段 20f，ease-out(quint) 长尾减速，之后真静止`
  - `DroneDiveLanding.tsx:24` `const DIVE_SHARE = 0.82; // 俯冲段吃掉 82% 行程，剩 18% 留给气垫`
  - `DroneDiveLanding.tsx:25` `const PRE_LIFT = 0.025; // 俯冲前相机上提（行程倒退 2.5%）：大动作前的预备`
  - `DroneDiveLanding.tsx:26` `export const DRONE_DIVE_LANDING_DURATION = 105; // 落定后 hold 36f（1.2s）`
  - `DroneDiveLanding.tsx:31` `const LIFT = 150; // 起始悬停高度（页面局部 px，经世界 scale 后约 60px）`
  - `DroneDiveLanding.tsx:37` `const pDive = interpolate(frame, [DIVE_START, DIVE_END], [-PRE_LIFT, DIVE_SHARE], {`
  - `DroneDiveLanding.tsx:40` `easing: Easing.in(Easing.cubic),`
  - `DroneDiveLanding.tsx:45` `interpolate(frame, [DIVE_END, LAND_END], [0, 1 - DIVE_SHARE], {`
  - `DroneDiveLanding.tsx:48` `easing: Easing.out(Easing.poly(5)),`
  - `DroneDiveLanding.tsx:54` `const FLOOR = { x: -2400, y: -1500, w: 6720, h: 3300 };`
  - `DroneDiveLanding.tsx:84` `const shOp = interpolate(p, [0, 0.9, 1], [0.16, 0.12, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });`
  - `DroneDiveLanding.tsx:166` `<CameraMotionBlur shutterAngle={220} samples={12}>`
- 卡片参数:
  - `space-camera-moves.md:5` `时长: A 170f（5.7s，炸开-悬停-合体-收尾标题全程）；C 105f（3.5s，俯冲 69f + 落定 hold 36f）单向俯冲`
  - `space-camera-moves.md:26` `| A 炸开 | 5 层 translateZ 150/270/400/520/640，弹簧（damping 15、stiffness 120）错峰 5f | 页面上越靠远端（顶部）的层要越高，否则低处的层升起后挡住上方层；深度全同读作整页浮起 |`
  - `space-camera-moves.md:27` `| A 合体 | 标注先撤（ease-in 8f），层逆序 ease-in 14f、错峰 3f；落座帧整组下沉 8px 阻尼回弹 + 台面接触影一紧，随后一道扫光掠过整页 | 落锤必须有——没有它合体读作软趴趴的淡入；但不用抖屏（Q3），下沉回弹 + 影子收紧同样有"咔" |`
  - `space-camera-moves.md:29` `| A 标注 | 锚点 = 层外缘中点的 3D 投影（与 CSS 同一套矩阵手算），左右两栏、水平引线到栏前一折；标题 44px + 说明 30px，描线 8f + 升起 12f，错峰 6f | 引线从层中间拉出会穿过别的层；标注字 <32px 读不清 |`
  - `space-camera-moves.md:31` `| C 速度曲线 | 0–24f 上帝视角建立 + 上提预备（行程倒退 2.5%）→ 主俯冲 25f Easing.in(cubic) 吃 82% 行程 → 气垫 20f Easing.out(poly(5)) 走 18% → 落定 hold 36f | 切换帧速度骤降 = 气垫顶住的体感；82/18 比例比帧数更关键 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 节奏或收尾只给首页最后一屏, 不做成组件默认态.

### demos/camera/space-camera-moves/ExplodedView

- 镜头卡: `references/shots/camera/space-camera-moves.md`
- 时长: 170 帧 / 5667 ms, `DURATION` 于第 31 行
- 分镜:
  - `ExplodedView.tsx:18` `//   24–62   炸开：5 层弹簧错峰上升（damping 15，一次可见过冲），间隔 5f，越高的层越晚到`
  - `ExplodedView.tsx:31` `export const EXPLODED_VIEW_DURATION = 170;`
  - `ExplodedView.tsx:37` `const PERSP = 2400;`
  - `ExplodedView.tsx:39` `const EXPLODE = 24;`
  - `ExplodedView.tsx:40` `const STAGGER = 5;`
  - `ExplodedView.tsx:41` `const ASSEMBLE = 108;`
  - `ExplodedView.tsx:42` `const BACK = 3; // 合体错峰`
  - `ExplodedView.tsx:43` `const BACK_DUR = 14;`
  - `ExplodedView.tsx:112` `const VOL = [30, 34, 31, 42, 48, 45, 56, 61, 52, 66, 72, 69, 80, 76, 88];`
  - `ExplodedView.tsx:196` `const up = springAt(f, EXPLODE + i * STAGGER, { damping: 15, stiffness: 120 });`
  - `ExplodedView.tsx:200` `const CLOSE = ASSEMBLE + (N - 1) * BACK + BACK_DUR; // 合体落座帧 = 134`
  - `ExplodedView.tsx:293` `const COL = { L: 470, R: 1450 }; // 左栏右对齐线 / 右栏左对齐线`
- 卡片参数:
  - `space-camera-moves.md:5` `时长: A 170f（5.7s，炸开-悬停-合体-收尾标题全程）；C 105f（3.5s，俯冲 69f + 落定 hold 36f）单向俯冲`
  - `space-camera-moves.md:26` `| A 炸开 | 5 层 translateZ 150/270/400/520/640，弹簧（damping 15、stiffness 120）错峰 5f | 页面上越靠远端（顶部）的层要越高，否则低处的层升起后挡住上方层；深度全同读作整页浮起 |`
  - `space-camera-moves.md:27` `| A 合体 | 标注先撤（ease-in 8f），层逆序 ease-in 14f、错峰 3f；落座帧整组下沉 8px 阻尼回弹 + 台面接触影一紧，随后一道扫光掠过整页 | 落锤必须有——没有它合体读作软趴趴的淡入；但不用抖屏（Q3），下沉回弹 + 影子收紧同样有"咔" |`
  - `space-camera-moves.md:29` `| A 标注 | 锚点 = 层外缘中点的 3D 投影（与 CSS 同一套矩阵手算），左右两栏、水平引线到栏前一折；标题 44px + 说明 30px，描线 8f + 升起 12f，错峰 6f | 引线从层中间拉出会穿过别的层；标注字 <32px 读不清 |`
  - `space-camera-moves.md:31` `| C 速度曲线 | 0–24f 上帝视角建立 + 上提预备（行程倒退 2.5%）→ 主俯冲 25f Easing.in(cubic) 吃 82% 行程 → 气垫 20f Easing.out(poly(5)) 走 18% → 落定 hold 36f | 切换帧速度骤降 = 气垫顶住的体感；82/18 比例比帧数更关键 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 节奏或收尾只给首页最后一屏, 不做成组件默认态.

### demos/camera/steep-tilt-glide/SteepTiltGlide

- 镜头卡: `references/shots/camera/steep-tilt-glide.md`
- 时长: 120 帧 / 4000 ms, `DURATION` 于第 313 行
- 分镜:
  - `SteepTiltGlide.tsx:21` `const INK = '#2a2a31';`
  - `SteepTiltGlide.tsx:23` `const easeFall = Easing.bezier(0.5, 0.05, 0.6, 1); // 加速贴落、末端软着陆`
  - `SteepTiltGlide.tsx:44` `const FALL = 0.32;`
  - `SteepTiltGlide.tsx:106` `const PW = 6200;`
  - `SteepTiltGlide.tsx:107` `const PH = 2400;`
  - `SteepTiltGlide.tsx:295` `const CAM = { persp: 1100, origin: '30% 58%', rotY: -60, rotZ: -2, left: '40%', top: '15%', scale: 0.62 };`
  - `SteepTiltGlide.tsx:313` `export const STEEP_TILT_GLIDE_DURATION = 120; // 4s 单镜（滑移曲线按 0–120f 标定）`
  - `SteepTiltGlide.tsx:320` `const glide = Easing.bezier(0.3, 0.12, 0.72, 0.9);`
  - `SteepTiltGlide.tsx:322` `const p = interpolate(f, [0, 120], [0, 1], { easing: glide, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });`
  - `SteepTiltGlide.tsx:323` `return interpolate(p, [0, 1], [60, -4100]);`
  - `SteepTiltGlide.tsx:328` `const shade = interpolate(frame, [0, 18, 44], [0.7, 0.4, 0], { extrapolateRight: 'clamp' });`
  - `SteepTiltGlide.tsx:336` `const drop = interpolate(frame, [4, 100], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });`
  - `SteepTiltGlide.tsx:338` `const glow = interpolate(frame, [14, 70], [0.15, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });`
- 卡片参数:
  - `steep-tilt-glide.md:5` `时长: 4s（120f）单镜；页面越宽越可拉长`
  - `steep-tilt-glide.md:22` `滑移，bezier(0.3,0.12,0.72,0.9)——起步柔和后近匀速，尾段斜率`
  - `steep-tilt-glide.md:35` `| 滑移曲线 | 尾段斜率不归零的 bezier | 中途停死被抓（v4 返工）；全 linear 少了起步呼吸 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 节奏或收尾只给首页最后一屏, 不做成组件默认态.

### demos/camera/tension-camera-moves/BulletTimeFreezeOrbit

- 镜头卡: `references/shots/camera/tension-camera-moves.md`
- 时长: 170 帧 / 5667 ms, `DURATION` 于第 28 行
- 分镜:
  - `BulletTimeFreezeOrbit.tsx:28` `export const BULLET_TIME_FREEZE_ORBIT_DURATION = 170;`
  - `BulletTimeFreezeOrbit.tsx:31` `const PANEL = { w: 1180, h: 640 };`
  - `BulletTimeFreezeOrbit.tsx:32` `const CH = { x: 90, y: 250, w: 1000, h: 300 }; // 图表区（面板内坐标）`
  - `BulletTimeFreezeOrbit.tsx:33` `const BARS = [0.46, 0.58, 0.52, 0.7, 0.64, 0.82, 1.0];`
  - `BulletTimeFreezeOrbit.tsx:35` `const BAR_W = 96;`
  - `BulletTimeFreezeOrbit.tsx:36` `const BAR_GAP = (CH.w - BARS.length * BAR_W) / (BARS.length - 1);`
  - `BulletTimeFreezeOrbit.tsx:37` `const GROW = 40; // 每根柱子的生长时长（内容时钟）`
  - `BulletTimeFreezeOrbit.tsx:39` `const TOTAL = 184920;`
  - `BulletTimeFreezeOrbit.tsx:89` `const STRIP = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];`
  - `BulletTimeFreezeOrbit.tsx:208` `const lk = springAt(e, startOf(i) + GROW - 2, { damping: 15, stiffness: 200 });`
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
- 裁决: 只留规则. 节奏或收尾只给首页最后一屏, 不做成组件默认态.

### demos/camera/tension-camera-moves/PullBackIsolation

- 镜头卡: `references/shots/camera/tension-camera-moves.md`
- 时长: 150 帧 / 5000 ms, `DURATION` 于第 17 行
- 分镜:
  - `PullBackIsolation.tsx:2` `// 相机容器 scale 2.2→0.62（0–110f，Easing.out(cubic)）：开场怼在主卡`
  - `PullBackIsolation.tsx:17` `export const PULL_BACK_ISOLATION_DURATION = 150; // 110f 后拉 + 40f 孤悬静止`
  - `PullBackIsolation.tsx:37` `const FADE_DUR = 16;`
  - `PullBackIsolation.tsx:45` `const DAYS = Array.from({ length: 45 }, (_, i) => (i === 17 ? 1 : i === 33 ? 2 : 0));`
  - `PullBackIsolation.tsx:107` `const scale = interpolate(frame, [0, 110], [2.2, 0.62], {`
  - `PullBackIsolation.tsx:108` `easing: Easing.out(Easing.cubic),`
  - `PullBackIsolation.tsx:113` `const bgT = interpolate(frame, [60, 110], [0, 1], { easing: Easing.inOut(Easing.quad), ...clamp });`
  - `PullBackIsolation.tsx:116` `const glow = interpolate(frame, [60, 100], [0, 1], { easing: Easing.inOut(Easing.quad), ...clamp });`
  - `PullBackIsolation.tsx:141` `const k = interpolate(frame, [t0, t0 + FADE_DUR], [0, 1], clamp);`
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
- 裁决: 只留规则. 节奏或收尾只给首页最后一屏, 不做成组件默认态.

### demos/camera/terminal-3d/Terminal3D

- 镜头卡: `references/shots/camera/terminal-3d.md`
- 时长: 246 帧 / 8200 ms, `DURATION` 于第 31 行
- 分镜:
  - `Terminal3D.tsx:31` `export const TERMINAL_3D_DURATION = 246;`
  - `Terminal3D.tsx:35` `const STAGE = { ...L, light: '#56613f', accent2: '#3a4a1c' };`
  - `Terminal3D.tsx:39` `const PERSP = 1800; // 场景透视距离`
  - `Terminal3D.tsx:40` `const FLOOR_Y = 500; // 地面高度（世界坐标，y 向下）`
  - `Terminal3D.tsx:49` `const VIEW = [9, -8, 10]; // 每站相机相对窗口的侧视角（度）`
  - `Terminal3D.tsx:50` `const TILT = -4; // 相机微俯（rotateX，度）`
  - `Terminal3D.tsx:53` `const FLY = [[62, 92], [152, 182]] as const;`
  - `Terminal3D.tsx:54` `const TYPE_AT = [8, 94, 184];`
  - `Terminal3D.tsx:55` `const PULL_PEAK = 1250; // 飞行中拉远量（峰值处画面缩到 ~0.6，三窗同框）`
  - `Terminal3D.tsx:101` `const CELL = 240;`
  - `Terminal3D.tsx:205` `const TYPING = WINS.map((w, i) => charTimes(w.cmd, i + 3));`
- 卡片参数:
  - `terminal-3d.md:5` `时长: 约 8.2s（246f@30fps；三站各约 2–3s 停留 + 两段 30f 飞行）`
  - `terminal-3d.md:15` `- 两段飞行各 30f（swift 不对称 in-out），途中 'sin(π·u^0.85)×1250px' 拉远鼓包——峰值处画面缩到 ~0.6，三窗同框，"瞥见全貌"；按相机屏速加横向方向性模糊（只在飞行段生效）`
  - `terminal-3d.md:18` `- 打字机三要素：命令逐字符（每字 0.75–1.65f 确定性抖动、空格多停 0.6f）、块光标紧贴字尾（打字中常亮 / 打完 8f 半周期闪）、敲完停 2f 再回车；输出是终端式快速打印（每行 6f snappy 淡入 + 左移 10px 收回，行距 4f），状态位先转 braille 小菊花 ~6f 再落成 ✓`
  - `terminal-3d.md:25` `| 飞行/停留 | 飞 30f，站内 ~60–90f | 停留必须容下打字 ~20f + 输出 ~20f + 读秒 ≥14f |`
  - `terminal-3d.md:28` `| 打字节奏 | 0.75–1.65f/字 + 空格 +0.6f | 匀速逐字读作机器回放；>2.5f/字 观众等得不耐烦 |`
  - `terminal-3d.md:29` `| 输出打印 | 6f snappy、行距 4f | 终端是"吐"出来的，慢滑入（>12f）读作 PPT |`
  - `terminal-3d.md:35` `- 光标闪烁按帧取模（8f 半周期），改时长不影响；"打字中常亮、待机慢闪"的对比要保留`
  - `terminal-3d.md:36` `- 第三窗 READY 行在 ~220f 弹出，之后至少留 ~24f hold，否则尾帧没有落定`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 节奏或收尾只给首页最后一屏, 不做成组件默认态.

### demos/data/before-after-slider-scrub/BeforeAfterSliderScrub

- 镜头卡: `references/shots/data/before-after-slider-scrub.md`
- 时长: 150 帧 / 5000 ms, `DURATION` 于第 16 行
- 分镜:
  - `BeforeAfterSliderScrub.tsx:16` `export const BEFORE_AFTER_SLIDER_SCRUB_DURATION = 150; // 110f 动作 + 40f 真静止`
  - `BeforeAfterSliderScrub.tsx:19` `const PRE = 10; // 预备：10→14 先向左回拉 1.5%（甩之前"蓄力"）`
  - `BeforeAfterSliderScrub.tsx:20` `const T0 = 14; // 快甩起点`
  - `BeforeAfterSliderScrub.tsx:21` `const FLING = 26; // 快甩：14→26（12f 冲到 76%）`
  - `BeforeAfterSliderScrub.tsx:22` `const BOUNCE = 38; // 回弹：26→38 落到 70%`
  - `BeforeAfterSliderScrub.tsx:23` `const HOLD = 56; // 停顿看清`
  - `BeforeAfterSliderScrub.tsx:24` `const SCRUB = 104; // 慢扫：56→104（48f 回到 40%）——速度约为快甩的 1/5`
- 卡片参数:
  - `before-after-slider-scrub.md:18` `| 阶段 | 帧段参考 | 内容 |`
  - `before-after-slider-scrub.md:21` `| 2 快甩 | 12f | 8%→76%（out cubic）过冲 |`
  - `before-after-slider-scrub.md:22` `| 3 回弹 | 12f | 76%→70% |`
  - `before-after-slider-scrub.md:23` `| 4 停顿 | ~18f | 让观众看清 after |`
  - `before-after-slider-scrub.md:24` `| 5 慢扫 | ~48f | 70%→40% 二次展示差异 |`
  - `before-after-slider-scrub.md:25` `| 6 定格 | 末 ≥40f | 真静止 |`
  - `before-after-slider-scrub.md:30` `| 速度比 | 快甩 12f vs 慢扫 48f，约 5:1 | 比例 <3:1 节奏对比不可感 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 控件合同. 数据变化要让刻度或读数坏一次再停住.

### demos/data/chart-live-moves/AxisRescaleShockV2

- 镜头卡: `references/shots/data/chart-live-moves.md`
- 时长: 168 帧 / 5600 ms, `DURATION` 于第 29 行
- 分镜:
  - `AxisRescaleShockV2.tsx:29` `export const AXIS_RESCALE_SHOCK_V2_DURATION = 168;`
  - `AxisRescaleShockV2.tsx:37` `const X0 = 268; // 绘图区左`
  - `AxisRescaleShockV2.tsx:38` `const X1 = 1800; // 绘图区右（Dec）`
  - `AxisRescaleShockV2.tsx:39` `const PW = X1 - X0;`
  - `AxisRescaleShockV2.tsx:40` `const CEIL = 362; // 天花板规线`
  - `AxisRescaleShockV2.tsx:41` `const BASE = 902; // 基线`
  - `AxisRescaleShockV2.tsx:43` `const SHOCK_TOP = CEIL - 226; // 冲出天花板 226px，扎进标题行`
  - `AxisRescaleShockV2.tsx:45` `const DATA = [22, 30, 26, 38, 35, 47, 44, 58, 55, 66, 72, 340];`
  - `AxisRescaleShockV2.tsx:49` `const DRAW0 = 14;`
  - `AxisRescaleShockV2.tsx:50` `const DRAW1 = 56;`
  - `AxisRescaleShockV2.tsx:51` `const WARN = 50;`
  - `AxisRescaleShockV2.tsx:52` `const SHOCK0 = 62;`
  - `AxisRescaleShockV2.tsx:53` `const SHOCK1 = 76;`
  - `AxisRescaleShockV2.tsx:54` `const BEAT = 94;`
  - `AxisRescaleShockV2.tsx:55` `const RESCALE1 = 108;`
  - `AxisRescaleShockV2.tsx:56` `const MARK = 106;`
  - `AxisRescaleShockV2.tsx:125` `const OLD = ['25k', '50k', '75k', '100k'];`
  - `AxisRescaleShockV2.tsx:126` `const NEW = ['100k', '200k', '300k', '400k'];`
- 卡片参数:
  - `chart-live-moves.md:5` `时长: 各 165–192f（5.5–6.4s）`
  - `chart-live-moves.md:25` `| B unit-dot-swarm-regroup | 三幕 spring 错峰迁徙（stiffness 150、damping 13、错峰 8f），簇用向日葵螺旋紧排，终幕点阵拼数字 | 用户量/构成叙事："每个点是一个人" |`
  - `chart-live-moves.md:36` `| 收尾 | 三式都要 ≥36f 真静止 | 数据图表尾漂读作还没播完 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 首页采用. 预备拍, 过冲, 停稳或坐标轴冲击按这镜的帧数改成可逆进度.

### demos/data/chart-live-moves/OscilloscopeStreamV2

- 镜头卡: `references/shots/data/chart-live-moves.md`
- 时长: 165 帧 / 5500 ms, `DURATION` 于第 27 行
- 分镜:
  - `OscilloscopeStreamV2.tsx:27` `export const OSCILLOSCOPE_STREAM_V2_DURATION = 165;`
  - `OscilloscopeStreamV2.tsx:31` `const HOT = '#ff6b5b'; // 事件色：珊瑚红（只给尖峰）`
  - `OscilloscopeStreamV2.tsx:34` `const PX = 96;`
  - `OscilloscopeStreamV2.tsx:35` `const PW = 1728;`
  - `OscilloscopeStreamV2.tsx:36` `const PY = 404;`
  - `OscilloscopeStreamV2.tsx:37` `const PH = 520;`
  - `OscilloscopeStreamV2.tsx:38` `const HEAD = Math.round(PW * 0.86); // 写入头位置（绘图区内 x）`
  - `OscilloscopeStreamV2.tsx:40` `const SPEED = 8;`
  - `OscilloscopeStreamV2.tsx:41` `const FREEZE0 = 104;`
  - `OscilloscopeStreamV2.tsx:42` `const FREEZE1 = 118;`
  - `OscilloscopeStreamV2.tsx:43` `const OFFSET = 1400; // 世界坐标偏移：第 0 帧时窗口里已有完整历史`
  - `OscilloscopeStreamV2.tsx:54` `const S0 = OFFSET + 46 * SPEED;`
  - `OscilloscopeStreamV2.tsx:55` `const SW = 176;`
  - `OscilloscopeStreamV2.tsx:56` `const SC = S0 + SW * 0.5;`
  - `OscilloscopeStreamV2.tsx:65` `const MAXV = 3000;`
  - `OscilloscopeStreamV2.tsx:88` `const STEP = 4;`
- 卡片参数:
  - `chart-live-moves.md:5` `时长: 各 165–192f（5.5–6.4s）`
  - `chart-live-moves.md:25` `| B unit-dot-swarm-regroup | 三幕 spring 错峰迁徙（stiffness 150、damping 13、错峰 8f），簇用向日葵螺旋紧排，终幕点阵拼数字 | 用户量/构成叙事："每个点是一个人" |`
  - `chart-live-moves.md:36` `| 收尾 | 三式都要 ≥36f 真静止 | 数据图表尾漂读作还没播完 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 首页采用. 预备拍, 过冲, 停稳或坐标轴冲击按这镜的帧数改成可逆进度.

### demos/data/chart-live-moves/UnitDotSwarmRegroupV2

- 镜头卡: `references/shots/data/chart-live-moves.md`
- 时长: 192 帧 / 6400 ms, `DURATION` 于第 25 行
- 分镜:
  - `UnitDotSwarmRegroupV2.tsx:15` `//   24–48   第一幕迁徙 → 三簇（随机错峰 8f，spring stiffness 150 / damping 13）；38f 起簇标签浮现`
  - `UnitDotSwarmRegroupV2.tsx:25` `export const UNIT_DOT_SWARM_REGROUP_V2_DURATION = 192;`
  - `UnitDotSwarmRegroupV2.tsx:31` `const M1 = 24;`
  - `UnitDotSwarmRegroupV2.tsx:32` `const M2 = 62;`
  - `UnitDotSwarmRegroupV2.tsx:33` `const M3 = 100;`
  - `UnitDotSwarmRegroupV2.tsx:34` `const DUR = 24;`
  - `UnitDotSwarmRegroupV2.tsx:35` `const STAG = 8;`
  - `UnitDotSwarmRegroupV2.tsx:38` `const GROUP_N = [180, 102, 38];`
  - `UnitDotSwarmRegroupV2.tsx:40` `const GROUP_VAL = ['7,210', '4,102', '1,535'];`
  - `UnitDotSwarmRegroupV2.tsx:64` `const VOGEL = 12.6; // r_k = VOGEL·√k ≈ 每点占 500px²`
  - `UnitDotSwarmRegroupV2.tsx:75` `const BASE = 900;`
  - `UnitDotSwarmRegroupV2.tsx:76` `const BX = [520, 1000, 1420];`
  - `UnitDotSwarmRegroupV2.tsx:77` `const SP = 23;`
  - `UnitDotSwarmRegroupV2.tsx:88` `const GS = 1.08; // 字形放大`
  - `UnitDotSwarmRegroupV2.tsx:97` `const GW = (1004 + 200) * GS;`
  - `UnitDotSwarmRegroupV2.tsx:98` `const GX = (1920 - GW) / 2;`
  - `UnitDotSwarmRegroupV2.tsx:99` `const GY = 372;`
  - `UnitDotSwarmRegroupV2.tsx:150` `spring({ frame: f - start - stagOf(i, phase), fps: 30, config: { damping: 13, stiffness: 150, mass: 0.8 }, durationInFrames: DUR, durationRestThreshold: 0.0001 });`
  - `UnitDotSwarmRegroupV2.tsx:239` `const pop = spring({ frame: frame - popDelay(i), fps: 30, config: { damping: 12, stiffness: 200 } });`
- 卡片参数:
  - `chart-live-moves.md:5` `时长: 各 165–192f（5.5–6.4s）`
  - `chart-live-moves.md:25` `| B unit-dot-swarm-regroup | 三幕 spring 错峰迁徙（stiffness 150、damping 13、错峰 8f），簇用向日葵螺旋紧排，终幕点阵拼数字 | 用户量/构成叙事："每个点是一个人" |`
  - `chart-live-moves.md:36` `| 收尾 | 三式都要 ≥36f 真静止 | 数据图表尾漂读作还没播完 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 首页采用. 预备拍, 过冲, 停稳或坐标轴冲击按这镜的帧数改成可逆进度.

### demos/data/gauge-readout-moves/NeedleSweepSelftest

- 镜头卡: `references/shots/data/gauge-readout-moves.md`
- 时长: 140 帧 / 4667 ms, `DURATION` 于第 18 行
- 分镜:
  - `NeedleSweepSelftest.tsx:18` `export const NEEDLE_SWEEP_SELFTEST_DURATION = 140; // f60 后真静止 80f`
  - `NeedleSweepSelftest.tsx:20` `const AMBER = '#f59e0b';`
  - `NeedleSweepSelftest.tsx:21` `const AMBER_HI = '#fcd34d';`
  - `NeedleSweepSelftest.tsx:22` `const RED = '#ef4444';`
  - `NeedleSweepSelftest.tsx:23` `const INK1 = '#f3f4f7';`
  - `NeedleSweepSelftest.tsx:24` `const INK3 = '#737885';`
  - `NeedleSweepSelftest.tsx:26` `const CARD_W = 1500;`
  - `NeedleSweepSelftest.tsx:27` `const CARD_H = 640;`
  - `NeedleSweepSelftest.tsx:28` `const CARD_X = (1920 - CARD_W) / 2;`
  - `NeedleSweepSelftest.tsx:29` `const CARD_Y = (1080 - CARD_H) / 2 + 10;`
  - `NeedleSweepSelftest.tsx:31` `const GA_W = CARD_W / 3; // 每表盘占位宽`
  - `NeedleSweepSelftest.tsx:33` `const CX = GA_W / 2;`
  - `NeedleSweepSelftest.tsx:34` `const CY = 220;`
  - `NeedleSweepSelftest.tsx:57` `const STIFF = 120;`
  - `NeedleSweepSelftest.tsx:69` `const k = spring({ frame: frame - (s + 12), fps: 30, config: { stiffness: STIFF, damping: dampingFor(target), mass: 1 } });`
- 卡片参数:
  - `gauge-readout-moves.md:5` `时长: A 140f（4.7s）/ B 150f（5s）`
  - `gauge-readout-moves.md:12` `多表错峰成波浪，落定同帧盘下数值弹出，先亮量程再报数，开场宣誓感；`
  - `gauge-readout-moves.md:14` `（峰值 ~100px/f）、末尾 spring 刹车带回摆过冲，"世界动、针不动"，`
  - `gauge-readout-moves.md:20` `| A needle-sweep-selftest | 表面与外环点亮 → 指针去程 12f ease-out 甩满弧（扫过的刻度依次点亮、24f 内回落）→ 弹簧回程 ~8° 过冲回摆落真值；三表错峰 4f；落定同帧盘下数值 overshoot 弹出、指标名淡入，全部落定后自检胶囊 Running self-test… → Ready to render | dashboard 开场/系统就绪仪式 |`
  - `gauge-readout-moves.md:21` `| B tape-scroll-fixed-pointer | 全画高刻度带 translate：慢爬顶住旧上限线→上限线断开→预备回拉 5→冲刺 22f（峰值 ~100px/f，纵向运动模糊）→spring 刹车过冲回摆停位，新上限 bug 停进指针；窗内读数同步刷新 | 单指标大跳变（性能翻倍/配额提升） |`
  - `gauge-readout-moves.md:28` `| A 错峰 | 4f/表（左→中→右） | 齐甩读作复制粘贴；错峰成波浪 |`
  - `gauge-readout-moves.md:30` `| B 刹车 | spring 过冲（冲过头再弹回停位） | 词汇原案的回摆是"哐"的来源，直停可惜 |`
  - `gauge-readout-moves.md:31` `| 真静止 | 停位后 ≥30f 全锁死（A 末表落定 ~66f、B 110f 锁常数） | 指针类最忌尾漂 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 控件合同. 数据变化要让刻度或读数坏一次再停住.

### demos/data/gauge-readout-moves/TapeScrollFixedPointer

- 镜头卡: `references/shots/data/gauge-readout-moves.md`
- 时长: 150 帧 / 5000 ms, `DURATION` 于第 28 行
- 分镜:
  - `TapeScrollFixedPointer.tsx:28` `export const TAPE_SCROLL_FIXED_POINTER_DURATION = 150;`
  - `TapeScrollFixedPointer.tsx:31` `const PXU = 5; // px / 单位：每 10 单位一刻 = 50px`
  - `TapeScrollFixedPointer.tsx:32` `const CY = 540; // 指针中线（屏幕 y）`
  - `TapeScrollFixedPointer.tsx:33` `const TAPE_X = 1000; // 刻度带左缘`
  - `TapeScrollFixedPointer.tsx:34` `const TAPE_W = 520;`
  - `TapeScrollFixedPointer.tsx:35` `const TICK_R = TAPE_X + TAPE_W - 40; // 刻度右端（向左伸）`
  - `TapeScrollFixedPointer.tsx:36` `const NUM_R = TAPE_X + 310; // 数字右对齐线`
  - `TapeScrollFixedPointer.tsx:37` `const WIN_X = TAPE_X - 30; // 读数窗`
  - `TapeScrollFixedPointer.tsx:38` `const WIN_W = 400;`
  - `TapeScrollFixedPointer.tsx:39` `const WIN_H = 150;`
  - `TapeScrollFixedPointer.tsx:40` `const OLD_LIMIT = 140; // 旧上限 140k ×3 = 新上限 420k（▲200%）`
  - `TapeScrollFixedPointer.tsx:41` `const NEW_LIMIT = 420;`
  - `TapeScrollFixedPointer.tsx:43` `const SPRINT = bezier(0.55, 0, 0.25, 1); // 冲刺：猛加速、长刹车`
  - `TapeScrollFixedPointer.tsx:45` `const SET_STIFF = 140;`
  - `TapeScrollFixedPointer.tsx:59` `return mix(444, NEW_LIMIT, spring({ frame: f - 83, fps: 30, config: { stiffness: SET_STIFF, damping: SET_DAMP, mass: 1 } }));`
- 卡片参数:
  - `gauge-readout-moves.md:5` `时长: A 140f（4.7s）/ B 150f（5s）`
  - `gauge-readout-moves.md:12` `多表错峰成波浪，落定同帧盘下数值弹出，先亮量程再报数，开场宣誓感；`
  - `gauge-readout-moves.md:14` `（峰值 ~100px/f）、末尾 spring 刹车带回摆过冲，"世界动、针不动"，`
  - `gauge-readout-moves.md:20` `| A needle-sweep-selftest | 表面与外环点亮 → 指针去程 12f ease-out 甩满弧（扫过的刻度依次点亮、24f 内回落）→ 弹簧回程 ~8° 过冲回摆落真值；三表错峰 4f；落定同帧盘下数值 overshoot 弹出、指标名淡入，全部落定后自检胶囊 Running self-test… → Ready to render | dashboard 开场/系统就绪仪式 |`
  - `gauge-readout-moves.md:21` `| B tape-scroll-fixed-pointer | 全画高刻度带 translate：慢爬顶住旧上限线→上限线断开→预备回拉 5→冲刺 22f（峰值 ~100px/f，纵向运动模糊）→spring 刹车过冲回摆停位，新上限 bug 停进指针；窗内读数同步刷新 | 单指标大跳变（性能翻倍/配额提升） |`
  - `gauge-readout-moves.md:28` `| A 错峰 | 4f/表（左→中→右） | 齐甩读作复制粘贴；错峰成波浪 |`
  - `gauge-readout-moves.md:30` `| B 刹车 | spring 过冲（冲过头再弹回停位） | 词汇原案的回摆是"哐"的来源，直停可惜 |`
  - `gauge-readout-moves.md:31` `| 真静止 | 停位后 ≥30f 全锁死（A 末表落定 ~66f、B 110f 锁常数） | 指针类最忌尾漂 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 控件合同. 数据变化要让刻度或读数坏一次再停住.

### demos/data/scroll-brake-moves/BrakeReticleLock

- 镜头卡: `references/shots/data/scroll-brake-moves.md`
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `BrakeReticleLock.tsx:20` `const SCROLL_START = 12;`
  - `BrakeReticleLock.tsx:21` `const BRAKE = 59;`
  - `BrakeReticleLock.tsx:22` `const DUR = 150;`
  - `BrakeReticleLock.tsx:25` `const PITCH = 156; // 行高 120 + 间距 36`
  - `BrakeReticleLock.tsx:26` `const ROW_H = 120;`
  - `BrakeReticleLock.tsx:27` `const TARGET_ROW = 30;`
  - `BrakeReticleLock.tsx:28` `const FINAL_SCROLL = TARGET_ROW * PITCH - 480; // 停点条目 top 落在屏幕 y=480`
  - `BrakeReticleLock.tsx:29` `const LIST_X = 360;`
  - `BrakeReticleLock.tsx:30` `const LIST_W = 1200;`
  - `BrakeReticleLock.tsx:37` `return interpolate(f, [SCROLL_START, 50], [0, FINAL_SCROLL - 430], {`
  - `BrakeReticleLock.tsx:38` `easing: Easing.in(Easing.sin),`
  - `BrakeReticleLock.tsx:42` `return interpolate(f, [50, BRAKE], [FINAL_SCROLL - 430, FINAL_SCROLL + 30], {`
  - `BrakeReticleLock.tsx:43` `easing: Easing.out(Easing.cubic),`
  - `BrakeReticleLock.tsx:46` `return interpolate(f, [BRAKE, BRAKE + 4], [FINAL_SCROLL + 30, FINAL_SCROLL], {`
  - `BrakeReticleLock.tsx:48` `easing: Easing.out(Easing.quad),`
  - `BrakeReticleLock.tsx:146` `interpolate(f, [BRAKE, BRAKE + 9], [0, 1], {`
  - `BrakeReticleLock.tsx:149` `easing: Easing.out(Easing.back(2.4)),`
  - `BrakeReticleLock.tsx:153` `const LIST_MASK = 'linear-gradient(180deg, transparent 72px, #000 170px, #000 960px, transparent 1080px)';`
  - `BrakeReticleLock.tsx:163` `const highlight = interpolate(f, [BRAKE, BRAKE + 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });`
  - `BrakeReticleLock.tsx:164` `const dim = interpolate(f, [BRAKE + 2, BRAKE + 14], [0, 1], {`
  - `BrakeReticleLock.tsx:167` `easing: Easing.out(Easing.cubic),`
  - `BrakeReticleLock.tsx:172` `const GAP = 10; // 咬合位：角外扩 10px`
  - (运动行 25 条, 留前 22 条, 文件 299 行已逐行扫过)
- 卡片参数:
  - `scroll-brake-moves.md:3` `一句话: 长卷急刹两式——changelog-scroll-brake 基本款（高速长卷指数减速精准停位+目标抬升）与 brake-reticle-lock 组合款（急刹帧同帧准星咬合）`
  - `scroll-brake-moves.md:14` `B 是组合变异：急刹帧**同帧**四个 L 角标从画外飞入咬合锁定停点`
  - `scroll-brake-moves.md:15` `条目——急刹的"哐"与咬合的"咔"叠在同一帧共振（组合命门：`
  - `scroll-brake-moves.md:16` `角标起跳帧=列表首停帧，错开退化成两招并置）。`
  - `scroll-brake-moves.md:21` `| A changelog-scroll-brake | translateY 扫 ~2400px（cubic-bezier(.45,0,.06,1)：~5f 拉满速再长尾指数式减速，共 50f），纵向方向性 blur 由帧间位移差分驱动（×0.32 封顶 30px，停稳自动清零）；停点行 scale 1.03 抬升+阴影+2px 强调色描边，其余 opacity 退 0.38 | changelog 段落基本款 |`
  - `scroll-brake-moves.md:22` `| B brake-reticle-lock | 滚动三段：sin-in 加速→cubic-out 猛减速冲过头 +30px→回弹落定；纵向方向性 blur=v×0.15 封顶 32px；角标从 ±620/±320 画外 Easing.back(2.4) 飞入咬合，高亮 6f 内完成、标签 back(2.6) 弹出 | 停点需要更强打击感的高光段 |`
  - `scroll-brake-moves.md:27` `| 减速曲线 | A 快起步 + 长尾减速（bezier .45,0,.06,1）；B 加"冲过头 30px 回弹" | 匀速滚读作跑马灯；B 的过头回弹是"哐"的来源 |`
  - `scroll-brake-moves.md:28` `| blur 驱动 | 帧间位移差分 '|p(f)-p(f-1)|'×系数 | 手排模糊关键帧必然对不上速度；差分法帧确定（模式已沉为 assets/lib/helpers/motion.ts velocityAt） |`
  - `scroll-brake-moves.md:31` `| B 共振帧 | 角标挂载起跳帧 = 列表首次停住帧（严格同帧） | 组合命门，错 2f 以上就散 |`
  - `scroll-brake-moves.md:41` `- 声音：高速段低频 riser 铺垫，急刹一声 impact；B 咬合帧`
  - `scroll-brake-moves.md:42` `再叠一声"咔"（与 impact 同帧不同声部）`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 控件合同. 数据变化要让刻度或读数坏一次再停住.

### demos/data/scroll-brake-moves/ChangelogScrollBrake

- 镜头卡: `references/shots/data/scroll-brake-moves.md`
- 时长: 150 帧 / 5000 ms, `DURATION` 于第 16 行
- 分镜:
  - `ChangelogScrollBrake.tsx:16` `export const CHANGELOG_SCROLL_BRAKE_DURATION = 150; // 静置 14f + 滚动 50f + 抬升 14f + 静止 66f`
  - `ChangelogScrollBrake.tsx:21` `const SCROLL0 = 14; // 前 14f 初始静置（停在长卷顶部）`
  - `ChangelogScrollBrake.tsx:22` `const SCROLL1 = 64; // 急刹停位帧`
  - `ChangelogScrollBrake.tsx:23` `const LIFT0 = 68; // 目标行抬升开始`
  - `ChangelogScrollBrake.tsx:24` `const LIFT1 = 82;`
  - `ChangelogScrollBrake.tsx:26` `const COL_W = 1000;`
  - `ChangelogScrollBrake.tsx:27` `const COL_X = (1920 - COL_W) / 2;`
  - `ChangelogScrollBrake.tsx:28` `const GAP = 20;`
  - `ChangelogScrollBrake.tsx:30` `const TARGET = 28;`
  - `ChangelogScrollBrake.tsx:44` `const TARGET_CY = rowY[TARGET] + rowH(TARGET) / 2;`
  - `ChangelogScrollBrake.tsx:45` `const END_T = 540 - TARGET_CY; // 目标行停在画面正中`
  - `ChangelogScrollBrake.tsx:46` `const START_T = 200; // 起始：长卷顶部在页眉下方`
  - `ChangelogScrollBrake.tsx:49` `const BRAKE_EASE = bezier(0.45, 0, 0.06, 1);`
  - `ChangelogScrollBrake.tsx:51` `interpolate(f, [SCROLL0, SCROLL1], [START_T, END_T], { easing: BRAKE_EASE, ...CL });`
  - `ChangelogScrollBrake.tsx:98` `const t = interpolate(frame, [LIFT0, LIFT1], [0, 1], { easing: EASE.out, ...CL });`
  - `ChangelogScrollBrake.tsx:194` `const LIST_MASK = 'linear-gradient(180deg, transparent 150px, #000 250px, #000 930px, transparent 1060px)';`
- 卡片参数:
  - `scroll-brake-moves.md:3` `一句话: 长卷急刹两式——changelog-scroll-brake 基本款（高速长卷指数减速精准停位+目标抬升）与 brake-reticle-lock 组合款（急刹帧同帧准星咬合）`
  - `scroll-brake-moves.md:14` `B 是组合变异：急刹帧**同帧**四个 L 角标从画外飞入咬合锁定停点`
  - `scroll-brake-moves.md:15` `条目——急刹的"哐"与咬合的"咔"叠在同一帧共振（组合命门：`
  - `scroll-brake-moves.md:16` `角标起跳帧=列表首停帧，错开退化成两招并置）。`
  - `scroll-brake-moves.md:21` `| A changelog-scroll-brake | translateY 扫 ~2400px（cubic-bezier(.45,0,.06,1)：~5f 拉满速再长尾指数式减速，共 50f），纵向方向性 blur 由帧间位移差分驱动（×0.32 封顶 30px，停稳自动清零）；停点行 scale 1.03 抬升+阴影+2px 强调色描边，其余 opacity 退 0.38 | changelog 段落基本款 |`
  - `scroll-brake-moves.md:22` `| B brake-reticle-lock | 滚动三段：sin-in 加速→cubic-out 猛减速冲过头 +30px→回弹落定；纵向方向性 blur=v×0.15 封顶 32px；角标从 ±620/±320 画外 Easing.back(2.4) 飞入咬合，高亮 6f 内完成、标签 back(2.6) 弹出 | 停点需要更强打击感的高光段 |`
  - `scroll-brake-moves.md:27` `| 减速曲线 | A 快起步 + 长尾减速（bezier .45,0,.06,1）；B 加"冲过头 30px 回弹" | 匀速滚读作跑马灯；B 的过头回弹是"哐"的来源 |`
  - `scroll-brake-moves.md:28` `| blur 驱动 | 帧间位移差分 '|p(f)-p(f-1)|'×系数 | 手排模糊关键帧必然对不上速度；差分法帧确定（模式已沉为 assets/lib/helpers/motion.ts velocityAt） |`
  - `scroll-brake-moves.md:31` `| B 共振帧 | 角标挂载起跳帧 = 列表首次停住帧（严格同帧） | 组合命门，错 2f 以上就散 |`
  - `scroll-brake-moves.md:41` `- 声音：高速段低频 riser 铺垫，急刹一声 impact；B 咬合帧`
  - `scroll-brake-moves.md:42` `再叠一声"咔"（与 impact 同帧不同声部）`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 控件合同. 数据变化要让刻度或读数坏一次再停住.

### demos/data/timeline-travel/TimelineTravel

- 镜头卡: `references/shots/data/timeline-travel.md`
- 时长: 160 帧 / 5333 ms, `DURATION` 于第 17 行
- 分镜:
  - `TimelineTravel.tsx:17` `export const TIMELINE_TRAVEL_DURATION = 160;`
  - `TimelineTravel.tsx:20` `const AXIS_Y = 700;`
  - `TimelineTravel.tsx:21` `const TICK_GAP = 1400; // 刻度间距（世界坐标）`
  - `TimelineTravel.tsx:29` `const WORLD_W = 960 + TICK_GAP * 3 + 960;`
  - `TimelineTravel.tsx:31` `const TRAVEL_START = 12;`
  - `TimelineTravel.tsx:32` `const TRAVEL_END = 104; // 急停帧`
  - `TimelineTravel.tsx:33` `const ZOOM_END = 114;`
  - `TimelineTravel.tsx:36` `// 用两段拼：0–0.82 加速段（Easing.in(poly(2.2))），0.82–1 急刹段`
  - `TimelineTravel.tsx:39` `const t = interpolate(f, [TRAVEL_START, TRAVEL_END], [0, 1], {`
  - `TimelineTravel.tsx:44` `const eased = interpolate(t, [0, 0.15, 0.88, 1], [0, 0.055, 0.9, 1], {`
  - `TimelineTravel.tsx:45` `easing: Easing.inOut(Easing.quad),`
  - `TimelineTravel.tsx:59` `const CARD_W = 360;`
  - `TimelineTravel.tsx:60` `const CARD_H = 240;`
  - `TimelineTravel.tsx:61` `const STEM = 36; // 卡底到轴的连杆长度`
  - `TimelineTravel.tsx:114` `const s = spring({`
  - `TimelineTravel.tsx:117` `config: { damping: 11, stiffness: 160, mass: 0.9 }, // 明显过冲`
  - `TimelineTravel.tsx:118` `durationInFrames: 26,`
  - `TimelineTravel.tsx:122` `const lit = interpolate(frame, [pop, pop + 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });`
  - `TimelineTravel.tsx:194` `const zoom = interpolate(frame, [TRAVEL_END, ZOOM_END], [1, 1.28], {`
  - `TimelineTravel.tsx:195` `easing: Easing.out(Easing.cubic),`
  - `TimelineTravel.tsx:199` `const headIn = interpolate(frame, [0, 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });`
- 卡片参数:
  - `timeline-travel.md:13` `每过一格对应卡片从刻度线上 spring 弹立——历史在窗外闪过，`
  - `timeline-travel.md:17` `| 阶段 | 帧段参考 | 内容 |`
  - `timeline-travel.md:21` `| 3 弹卡 | 掠过中 | 相机扫过刻度前 6f 卡片起弹（spring damping ~11 明显过冲），底边为轴 scaleY 立起 |`
  - `timeline-travel.md:22` `| 4 急停推近 | 急停帧起 10f | scale 1→1.28 推近末刻度（out cubic），接静止 ≥30f |`
  - `timeline-travel.md:28` `| 弹立时机 | 相机到达刻度前 6f 起弹，由 camXAt 反查 | 到了才弹观众已经错过；早太多读作预告 |`
  - `timeline-travel.md:30` `| 急停推近 | 1→1.28 / 10f | 不推近急停就只是"停了"，推近才是"到了" |`
  - `timeline-travel.md:36` `- 急停后静止预算前置：demo 首版静止只有 25f 不达标，急停帧前移才够`
  - `timeline-travel.md:37` `——排时间线时先给末段留 ≥30f 再倒推行程`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 控件合同. 数据变化要让刻度或读数坏一次再停住.

### demos/effects/assemble-then-type-flyin/AssembleThenTypeFlyin

- 镜头卡: `references/shots/effects/assemble-then-type-flyin.md`
- 时长: 168 帧 / 5600 ms, `DURATION` 于第 30 行
- 分镜:
  - `AssembleThenTypeFlyin.tsx:30` `export const ASSEMBLE_THEN_TYPE_FLYIN_DURATION = 168;`
  - `AssembleThenTypeFlyin.tsx:33` `const GOLD = L.accent2;`
  - `AssembleThenTypeFlyin.tsx:42` `const SHELL_DUR = 16;`
  - `AssembleThenTypeFlyin.tsx:83` `const TEXT_END = 128; // 每块最后一字落定上限`
  - `AssembleThenTypeFlyin.tsx:84` `const CHAR_DUR = 16;`
- 卡片参数:
  - `assemble-then-type-flyin.md:5` `时长: 约5.6s（168f@30fps）`
  - `assemble-then-type-flyin.md:17` `1920×1080 原生坐标；开场第 1 帧先有 12 栏版式参考线，骨架齐后退淡`
  - `assemble-then-type-flyin.md:19` `按起飞帧 6/10/15/19/23/27/31/35/39/44 依次飞入，每件 16f 'EASE.overshoot' 过冲贴合，`
  - `assemble-then-type-flyin.md:20` `'from' 位移 120–420px + ±7° 旋转（旋转晚 4f 收敛）`
  - `assemble-then-type-flyin.md:21` `- 骨架运动中按真实速度（px/帧）给方向性运动模糊（'SpeedBlur' ×0.32，上限 18px），静止即为 0`
  - `assemble-then-type-flyin.md:22` `- 19 个文字块按起始帧 58→114 依次开始：112px 衬线大标题最先（58/66），`
  - `assemble-then-type-flyin.md:27` `每字 16f 'EASE.snappy' 落位，飞行中按离焦距离给景深模糊，'a>=1' 时 transform 直接设 'none'`
  - `assemble-then-type-flyin.md:28` `- 块内字符间隔自适应：'step = clamp((128 − start − 16)/字符数, 0.35, 1.6)' 帧`
  - `assemble-then-type-flyin.md:29` `——保证不论块多长都在 f128 前落完，尾段留 40f 整页静止呼吸（1.5% 极缓推近）`
  - `assemble-then-type-flyin.md:38` `| 骨架时序 | 10 件，起飞帧 6→44（间隔 4–5f） | 骨架段占前 30%；压缩到 20f 内就和文字段糊在一起 |`
  - `assemble-then-type-flyin.md:39` `| 骨架飞入 | overshoot、16f、位移 120–420px + ±7° | 与 'scanline-assemble-flyin' 同一手法，去掉扫描线后靠时序读顺序 |`
  - `assemble-then-type-flyin.md:41` `| 两段断点 | 骨架齐（f50）→ 文字起（f58）留 8f，参考线同期退淡 | 没有这半拍观众读不出"这是第二步" |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 不做. 转场和光效不进普通文档页, 全片最多一处砸.

### demos/effects/aurora-bloom-bg-flip/AuroraBloomBgFlip

- 镜头卡: `references/shots/effects/aurora-bloom-bg-flip.md`
- 时长: 156 帧 / 5200 ms, `DURATION` 于第 18 行
- 分镜:
  - `AuroraBloomBgFlip.tsx:18` `export const AURORA_BLOOM_BG_FLIP_DURATION = 156; // 5200ms @30fps`
  - `AuroraBloomBgFlip.tsx:23` `const DEEPP = [124, 92, 255]; // 效果本体光色（深紫）`
  - `AuroraBloomBgFlip.tsx:24` `const WHITE = [245, 245, 250];`
  - `AuroraBloomBgFlip.tsx:25` `const LIGHT = [236, 236, 236]; // 亮场底色`
  - `AuroraBloomBgFlip.tsx:26` `const DARK = [10, 10, 18]; // 暗场底色`
  - `AuroraBloomBgFlip.tsx:27` `const INK = [22, 23, 28]; // 亮场文字（带冷调的近黑）`
  - `AuroraBloomBgFlip.tsx:37` `const A_OUT = 0.4; // A 句首词开始 blur-out（stagger 0.04、各 0.10）→ 0.58 收完`
  - `AuroraBloomBgFlip.tsx:38` `const B_IN = 0.7; // B 句首词 blur-in（stagger 0.05、各 0.11）；0.12 ≈ 0.6s 无字空档`
- 卡片参数:
  - `aurora-bloom-bg-flip.md:5` `时长: 约5.2s（156f@30fps）`
  - `aurora-bloom-bg-flip.md:49` `- 底色用 JS 逐帧写 'background'（'mix()' 出实色），不要用 CSS transition，`
  - `aurora-bloom-bg-flip.md:50` `否则 seek 到任意帧时颜色不确定`
- 可逆: 没有帧采样. 当静态夹具.
- 裁决: 不做. 转场和光效不进普通文档页, 全片最多一处砸.

### demos/effects/brand-frame-snap/BrandFrameSnap

- 镜头卡: `references/shots/effects/brand-frame-snap.md`
- 时长: 140 帧 / 4667 ms, `DURATION` 于第 30 行
- 分镜:
  - `BrandFrameSnap.tsx:18` `//   10–40   主动作：窗口从框下沿 660px 弹簧落进框内（damping 15）+ 18° 前倾回正，按速度纵向模糊，阴影随高度收紧`
  - `BrandFrameSnap.tsx:30` `export const BRAND_FRAME_SNAP_DURATION = 140;`
  - `BrandFrameSnap.tsx:33` `const BLUE = '#2F55FF'; // Design 模式品牌色`
  - `BrandFrameSnap.tsx:34` `const ORANGE = '#FF5B1F'; // Dev 模式品牌色`
  - `BrandFrameSnap.tsx:35` `const FLIP = 84; // 同帧硬翻色`
  - `BrandFrameSnap.tsx:36` `const BAND = 60; // 画框厚度`
  - `BrandFrameSnap.tsx:37` `const WIN_W = 1560;`
  - `BrandFrameSnap.tsx:38` `const WIN_H = 864;`
  - `BrandFrameSnap.tsx:39` `const BAR_H = 64; // 窗口标题栏`
  - `BrandFrameSnap.tsx:40` `const LEFT_W = 300;`
  - `BrandFrameSnap.tsx:41` `const RIGHT_W = 400;`
  - `BrandFrameSnap.tsx:42` `const INK = '#14161f';`
  - `BrandFrameSnap.tsx:47` `const CANVAS_W = WIN_W - LEFT_W - RIGHT_W; // 860`
  - `BrandFrameSnap.tsx:48` `const BODY_H = WIN_H - BAR_H; // 800`
  - `BrandFrameSnap.tsx:49` `const CARD_W = 468;`
  - `BrandFrameSnap.tsx:50` `const CARD_H = 600;`
  - `BrandFrameSnap.tsx:51` `const CARD_X = CANVAS_X + (CANVAS_W - CARD_W) / 2;`
  - `BrandFrameSnap.tsx:52` `const CARD_Y = BAR_H + (BODY_H - CARD_H) / 2 + 12;`
  - `BrandFrameSnap.tsx:53` `const BTN_W = 404;`
  - `BrandFrameSnap.tsx:54` `const BTN_H = 76;`
  - `BrandFrameSnap.tsx:55` `const BTN_X = CARD_X + 32;`
  - `BrandFrameSnap.tsx:56` `const BTN_Y = CARD_Y + CARD_H - 32 - BTN_H;`
  - (运动行 30 条, 留前 22 条, 文件 536 行已逐行扫过)
- 卡片参数:
  - `brand-frame-snap.md:3` `一句话: 品牌色画框语法——一圈粗纯色画框先于内容长出包住全屏，录屏窗口落进框内；模式切换时整圈画框同帧硬翻色+窗内布局同帧换，一个 borderColor 干完章节导航/状态提示/品牌露出三件事`
  - `brand-frame-snap.md:5` `时长: 单次翻色 ~4.7s（140f）；画框本身可全片驻场`
  - `brand-frame-snap.md:14` `橘红=Dev Mode（原片是蓝/绿；关键是色相对冲 + 明度差）。章节切换时整圈画框一帧内硬翻色，无渐变，颜色硬切就是"换挡"`
  - `brand-frame-snap.md:15` `声效的视觉等价物；窗内布局同帧 A→B、角标与徽标同步换字，三处同帧`
  - `brand-frame-snap.md:17` `肤色（有扫过边界），本卡换的是"画框"这个包装层（同帧无边界），`
  - `brand-frame-snap.md:21` `- 画框用 4 条实体色带（非 border 属性），厚度 0→60px snappy 19f`
  - `brand-frame-snap.md:22` `长出（第 2 帧就有可见框）；洞口是 22px 圆角（四角补色块），色带叠一层`
  - `brand-frame-snap.md:23` `顶亮底暗的薄釉；翻色 = 同一帧换 background，帧确定`
  - `brand-frame-snap.md:24` `- 产品窗口（1560×864，原生像素布局）spring(damping 15, stiffness 115)`
  - `brand-frame-snap.md:25` `从下方 660px + 前倾 18°→0 + scale 0.88→1 落进框内（帧 10 起，画框长出`
  - `brand-frame-snap.md:27` `- 动机：光标 56–80f 弧线滑向标题栏 Design | Dev 开关，80 按下、84 松开 = 翻色帧`
  - `brand-frame-snap.md:28` `- 翻色帧四件事同帧：画框换色 + 窗内布局 A→B 硬切（右栏浅色检查器→深色`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 不做. 转场和光效不进普通文档页, 全片最多一处砸.

### demos/effects/fui-hud-moves/ReticleLockOn

- 镜头卡: `references/shots/effects/fui-hud-moves.md`
- 时长: 90 帧 / 3000 ms, `DURATION` 于第 19 行
- 分镜:
  - `ReticleLockOn.tsx:19` `export const RETICLE_LOCK_ON_DURATION = 90; // 3s：飞入 → 咬合 → 标签 → 静止 ≥1s`
  - `ReticleLockOn.tsx:22` `const CARD_X = 808;`
  - `ReticleLockOn.tsx:23` `const CARD_Y = 108;`
  - `ReticleLockOn.tsx:24` `const CARD_W = 524;`
  - `ReticleLockOn.tsx:25` `const CARD_H = 454;`
  - `ReticleLockOn.tsx:26` `const PAD = 16; // 咬合后角标与卡的呼吸距`
  - `ReticleLockOn.tsx:28` `const TCX = CARD_X + CARD_W / 2;`
  - `ReticleLockOn.tsx:29` `const TCY = CARD_Y + CARD_H / 2;`
  - `ReticleLockOn.tsx:31` `const FLY_IN = 14; // 飞入开始`
  - `ReticleLockOn.tsx:32` `const FLY_END = 24; // 飞入结束（大框就位）`
  - `ReticleLockOn.tsx:33` `const SHRINK0 = 20; // 收缩起点（与飞入尾段重叠 4f，动作连贯不停顿）`
  - `ReticleLockOn.tsx:34` `const UNDER = 40; // 收过头（0.94×）的时刻`
  - `ReticleLockOn.tsx:35` `const LOCK_END = 46; // 咬合帧`
  - `ReticleLockOn.tsx:36` `const LABEL0 = LOCK_END + 2;`
  - `ReticleLockOn.tsx:37` `const LABEL_END = LOCK_END + 12;`
  - `ReticleLockOn.tsx:39` `const ARM = 58; // L 臂长`
  - `ReticleLockOn.tsx:40` `const THICK = 5; // L 笔画粗`
  - `ReticleLockOn.tsx:47` `const t = interpolate(f, [FLY_IN, FLY_END], [0, 1], { easing: Easing.out(Easing.cubic), ...clamp });`
  - `ReticleLockOn.tsx:62` `const bite = interpolate(frame, [LOCK_END, LOCK_END + 1, LOCK_END + 5], [0, 1, 0], clamp);`
  - `ReticleLockOn.tsx:67` `const glow = interpolate(frame, [LOCK_END, LOCK_END + 3, LOCK_END + 10], [0, 0.55, 0.28], clamp);`
  - `ReticleLockOn.tsx:69` `const focus = interpolate(frame, [LOCK_END - 2, LOCK_END + 10], [0, 1], { easing: Easing.out(Easing.cubic), ...clamp });`
  - `ReticleLockOn.tsx:72` `const labelT = interpolate(frame, [LABEL0, LABEL_END], [0, 1], { easing: Easing.out(Easing.back(1.8)), ...clamp });`
  - (运动行 23 条, 留前 22 条, 文件 164 行已逐行扫过)
- 卡片参数:
  - `fui-hud-moves.md:5` `时长: 2–3s（demo 90f）`
  - `fui-hud-moves.md:6` `能量: 中高（咬合帧是打击点）`
  - `fui-hud-moves.md:18` `| A reticle-lock-on | 四 L 角=同一对矩形四份镜像，飞入（10f out cubic）与收缩（2.2×→0.94×→1 超调回弹）解耦；咬合帧目标微亮+标签 back 弹出 | 目标点名；踩音效重拍 |`
  - `fui-hud-moves.md:25` `| 咬合帧 | 目标白 overlay 快闪 0.55→停 0.28 + 标签同帧弹出 | 微亮与标签错帧就散了 |`
  - `fui-hud-moves.md:31` `- 声音：咬合帧一声"咔"（机械 click 而非游戏 UI 音，S1 边界内）`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 不做. 转场和光效不进普通文档页, 全片最多一处砸.

### demos/effects/glow-flyline-moves/FlylineArc

- 镜头卡: `references/shots/effects/glow-flyline-moves.md`
- 时长: 140 帧 / 4667 ms, `DURATION` 于第 15 行
- 分镜:
  - `FlylineArc.tsx:15` `export const FLYLINE_ARC_DURATION = 140; // ~4.7s：动画 f86 前结束，末 54f 真静止`
  - `FlylineArc.tsx:29` `const GLOW = '128,138,255'; // 飞线辉光色（与暗场 dashboard 的强调色同族）`
  - `FlylineArc.tsx:32` `const CARD_LT = { x: 256, y: 108, w: 524, h: 454, cx: 518, cy: 335 }; // 左上`
  - `FlylineArc.tsx:33` `const CARD_RB = { x: 1360, y: 590, w: 524, h: 454, cx: 1622, cy: 817 }; // 右下`
  - `FlylineArc.tsx:34` `const CARD_TM = { x: 808, y: 108, w: 524, h: 454, cx: 1070, cy: 335 }; // 上中`
  - `FlylineArc.tsx:45` `const DUR = 22;`
  - `FlylineArc.tsx:47` `const e = interpolate(frame, [start, start + DUR], [0, 1], { easing: Easing.out(Easing.cubic), ...clampX });`
  - `FlylineArc.tsx:50` `const settle = interpolate(frame, [start + DUR, start + DUR + 10], [0, 1], { easing: Easing.out(Easing.quad), ...clampX });`
  - `FlylineArc.tsx:52` `const anchor = interpolate(frame, [start, start + 6], [0, 1], { easing: Easing.out(Easing.cubic), ...clampX });`
  - `FlylineArc.tsx:119` `? interpolate(frame, [at, at + 6], [0, 1], { easing: Easing.out(Easing.cubic), ...clampX })`
  - `FlylineArc.tsx:120` `: interpolate(frame, [at + 6, at + 18], [1, 0.25], { easing: Easing.out(Easing.quad), ...clampX });`
  - `FlylineArc.tsx:121` `const ring = interpolate(frame, [at, at + 14], [0, 1], { easing: Easing.out(Easing.cubic), ...clampX });`
  - `FlylineArc.tsx:149` `const L1 = { p0: { x: CARD_LT.cx, y: CARD_LT.cy }, p1: { x: 818, y: 60 }, p2: { x: 1322, y: 380 }, p3: { x: CARD_RB.cx, y: CARD_RB.cy } };`
  - `FlylineArc.tsx:150` `const L2 = { p0: { x: CARD_RB.cx, y: CARD_RB.cy }, p1: { x: 1760, y: 560 }, p2: { x: 1360, y: 150 }, p3: { x: CARD_TM.cx, y: CARD_TM.cy } };`
- 卡片参数:
  - `glow-flyline-moves.md:3` `一句话: 暗场光斑与飞线三式——glow-orb-ambient 光斑底噪、flyline-arc 飞线连接、orb-flyline-relay 同帧共振组合`
  - `glow-flyline-moves.md:5` `时长: A 170f（~5.7s）/ B 140f（~4.7s）/ C 165f（5.5s）`
  - `glow-flyline-moves.md:15` `亮点头领跑、渐隐光尾，落点描边脉冲点亮，指标关联第一次有了方向；C 是 A+B 的焊接——飞线落点帧邻近光斑同帧涨亮一拍，`
  - `glow-flyline-moves.md:16` `氛围层与事件层**同帧共振**，互相搭腔而非各演各的（组合命门：拆开共振帧`
  - `glow-flyline-moves.md:23` `| B flyline-arc | 暗场 dashboard 压暗当底，卡心到卡心的手写 bezier 100 段采样，22f out-cubic 生长；光头 + 彗尾条件挂载领跑，段 opacity 按离头距离渐隐、到站 10f 抹匀；起点锚亮起、落点节点常驻；落点卡描边脉冲 + 冲击环，可接力 | 数据流向/指标关联；dashboard 叙事 |`
  - `glow-flyline-moves.md:24` `| C orb-flyline-relay | A+B 焊接：三颗玻璃节点各配一团背后光斑，光斑 surge 与节点点亮共用落点帧常量，涨亮 1+1.6×surge 并放大 12%、5f 起升 15f 消散；飞线到站后消散成细点虚线 | 暗场高光段；三站接力收束 |`
  - `glow-flyline-moves.md:29` `| A 光斑 | 潮青 / 深海蓝 / 珊瑚，峰值 0.55/0.5/0.42；漂移振幅 280–300px、周期 96–150f 交叉不等 | 同周期漂移读作整体晃动不是"有机" |`
  - `glow-flyline-moves.md:32` `| A 收敛 | 115–145f out-sine 收敛冻结（振幅 60/π，起始斜率 = 1 速度连续），末 25f 真静止 | 硬停一帧读作卡死；缓动收敛才有真静止 |`
  - `glow-flyline-moves.md:35` `| B 脉冲 | 描边扩散 out-cubic 6f / 消散 12f 到残余 0.25；暗场版提亮（强调色描边 + 外辉光 + 极淡卡面提亮）+ 14f 冲击环；f86 后全静止 | 白底禁提亮——浅底版用加深罩 0.16 替代 |`
  - `glow-flyline-moves.md:36` `| C 共振 | 落点帧同帧起 surge（同一常量 LIT_B / LIT_C）；节点 8f 亮到 1 + 描边脉冲残余 0.35 + 20f 冲击环 | 错 2f 以上共振读不出"搭腔" |`
  - `glow-flyline-moves.md:37` `| C 时间轴 | 动作 f98 前结束、光斑 110–140f 收敛冻结，末 25f 真静止 | 氛围层最后冻，事件层先收 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 不做. 转场和光效不进普通文档页, 全片最多一处砸.

### demos/effects/glow-flyline-moves/GlowOrbAmbient

- 镜头卡: `references/shots/effects/glow-flyline-moves.md`
- 时长: 170 帧 / 5667 ms, `DURATION` 于第 28 行
- 分镜:
  - `GlowOrbAmbient.tsx:28` `export const GLOW_ORB_AMBIENT_DURATION = 170; // ~5.7s：亮起 → 漂移 → 115–145f 收敛 → 末 25f 真静止`
  - `GlowOrbAmbient.tsx:39` `const CX = W / 2;`
  - `GlowOrbAmbient.tsx:40` `const CY = H / 2 + 10;`
  - `GlowOrbAmbient.tsx:41` `const CARD_W = 1100;`
  - `GlowOrbAmbient.tsx:42` `const CARD_H = 600;`
  - `GlowOrbAmbient.tsx:48` `const TAU = Math.PI * 2;`
  - `GlowOrbAmbient.tsx:66` `const T0 = 115, TS = 30;`
  - `GlowOrbAmbient.tsx:70` `const BARS = 64;`
- 卡片参数:
  - `glow-flyline-moves.md:3` `一句话: 暗场光斑与飞线三式——glow-orb-ambient 光斑底噪、flyline-arc 飞线连接、orb-flyline-relay 同帧共振组合`
  - `glow-flyline-moves.md:5` `时长: A 170f（~5.7s）/ B 140f（~4.7s）/ C 165f（5.5s）`
  - `glow-flyline-moves.md:15` `亮点头领跑、渐隐光尾，落点描边脉冲点亮，指标关联第一次有了方向；C 是 A+B 的焊接——飞线落点帧邻近光斑同帧涨亮一拍，`
  - `glow-flyline-moves.md:16` `氛围层与事件层**同帧共振**，互相搭腔而非各演各的（组合命门：拆开共振帧`
  - `glow-flyline-moves.md:23` `| B flyline-arc | 暗场 dashboard 压暗当底，卡心到卡心的手写 bezier 100 段采样，22f out-cubic 生长；光头 + 彗尾条件挂载领跑，段 opacity 按离头距离渐隐、到站 10f 抹匀；起点锚亮起、落点节点常驻；落点卡描边脉冲 + 冲击环，可接力 | 数据流向/指标关联；dashboard 叙事 |`
  - `glow-flyline-moves.md:24` `| C orb-flyline-relay | A+B 焊接：三颗玻璃节点各配一团背后光斑，光斑 surge 与节点点亮共用落点帧常量，涨亮 1+1.6×surge 并放大 12%、5f 起升 15f 消散；飞线到站后消散成细点虚线 | 暗场高光段；三站接力收束 |`
  - `glow-flyline-moves.md:29` `| A 光斑 | 潮青 / 深海蓝 / 珊瑚，峰值 0.55/0.5/0.42；漂移振幅 280–300px、周期 96–150f 交叉不等 | 同周期漂移读作整体晃动不是"有机" |`
  - `glow-flyline-moves.md:32` `| A 收敛 | 115–145f out-sine 收敛冻结（振幅 60/π，起始斜率 = 1 速度连续），末 25f 真静止 | 硬停一帧读作卡死；缓动收敛才有真静止 |`
  - `glow-flyline-moves.md:35` `| B 脉冲 | 描边扩散 out-cubic 6f / 消散 12f 到残余 0.25；暗场版提亮（强调色描边 + 外辉光 + 极淡卡面提亮）+ 14f 冲击环；f86 后全静止 | 白底禁提亮——浅底版用加深罩 0.16 替代 |`
  - `glow-flyline-moves.md:36` `| C 共振 | 落点帧同帧起 surge（同一常量 LIT_B / LIT_C）；节点 8f 亮到 1 + 描边脉冲残余 0.35 + 20f 冲击环 | 错 2f 以上共振读不出"搭腔" |`
  - `glow-flyline-moves.md:37` `| C 时间轴 | 动作 f98 前结束、光斑 110–140f 收敛冻结，末 25f 真静止 | 氛围层最后冻，事件层先收 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 不做. 转场和光效不进普通文档页, 全片最多一处砸.

### demos/effects/glow-flyline-moves/OrbFlylineRelay

- 镜头卡: `references/shots/effects/glow-flyline-moves.md`
- 时长: 165 帧 / 5500 ms, `DURATION` 于第 32 行
- 分镜:
  - `OrbFlylineRelay.tsx:32` `export const ORB_FLYLINE_RELAY_DURATION = 165; // 5.5s：动作 f98 前结束、光斑 f140 冻结、末 25f 真静止`
  - `OrbFlylineRelay.tsx:35` `const TAU = Math.PI * 2;`
  - `OrbFlylineRelay.tsx:52` `const T0 = 110, TS = 30;`
  - `OrbFlylineRelay.tsx:57` `const LIT_B = 48; // 线 1 落点 = B 点亮 = B 光斑 surge`
  - `OrbFlylineRelay.tsx:58` `const LIT_C = 82; // 线 2 落点 = C 点亮 = C 光斑 surge`
  - `OrbFlylineRelay.tsx:61` `const ICON_STROKE = { fill: 'none', strokeWidth: 7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };`
- 卡片参数:
  - `glow-flyline-moves.md:3` `一句话: 暗场光斑与飞线三式——glow-orb-ambient 光斑底噪、flyline-arc 飞线连接、orb-flyline-relay 同帧共振组合`
  - `glow-flyline-moves.md:5` `时长: A 170f（~5.7s）/ B 140f（~4.7s）/ C 165f（5.5s）`
  - `glow-flyline-moves.md:15` `亮点头领跑、渐隐光尾，落点描边脉冲点亮，指标关联第一次有了方向；C 是 A+B 的焊接——飞线落点帧邻近光斑同帧涨亮一拍，`
  - `glow-flyline-moves.md:16` `氛围层与事件层**同帧共振**，互相搭腔而非各演各的（组合命门：拆开共振帧`
  - `glow-flyline-moves.md:23` `| B flyline-arc | 暗场 dashboard 压暗当底，卡心到卡心的手写 bezier 100 段采样，22f out-cubic 生长；光头 + 彗尾条件挂载领跑，段 opacity 按离头距离渐隐、到站 10f 抹匀；起点锚亮起、落点节点常驻；落点卡描边脉冲 + 冲击环，可接力 | 数据流向/指标关联；dashboard 叙事 |`
  - `glow-flyline-moves.md:24` `| C orb-flyline-relay | A+B 焊接：三颗玻璃节点各配一团背后光斑，光斑 surge 与节点点亮共用落点帧常量，涨亮 1+1.6×surge 并放大 12%、5f 起升 15f 消散；飞线到站后消散成细点虚线 | 暗场高光段；三站接力收束 |`
  - `glow-flyline-moves.md:29` `| A 光斑 | 潮青 / 深海蓝 / 珊瑚，峰值 0.55/0.5/0.42；漂移振幅 280–300px、周期 96–150f 交叉不等 | 同周期漂移读作整体晃动不是"有机" |`
  - `glow-flyline-moves.md:32` `| A 收敛 | 115–145f out-sine 收敛冻结（振幅 60/π，起始斜率 = 1 速度连续），末 25f 真静止 | 硬停一帧读作卡死；缓动收敛才有真静止 |`
  - `glow-flyline-moves.md:35` `| B 脉冲 | 描边扩散 out-cubic 6f / 消散 12f 到残余 0.25；暗场版提亮（强调色描边 + 外辉光 + 极淡卡面提亮）+ 14f 冲击环；f86 后全静止 | 白底禁提亮——浅底版用加深罩 0.16 替代 |`
  - `glow-flyline-moves.md:36` `| C 共振 | 落点帧同帧起 surge（同一常量 LIT_B / LIT_C）；节点 8f 亮到 1 + 描边脉冲残余 0.35 + 20f 冲击环 | 错 2f 以上共振读不出"搭腔" |`
  - `glow-flyline-moves.md:37` `| C 时间轴 | 动作 f98 前结束、光斑 110–140f 收敛冻结，末 25f 真静止 | 氛围层最后冻，事件层先收 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 不做. 转场和光效不进普通文档页, 全片最多一处砸.
