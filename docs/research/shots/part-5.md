# video-shotcraft demos part 5

来源提交 `1266a3e`. 每个 tsx 逐行扫描. 30fps, 1 帧 = 33.3ms.

### demos/typography/gradient-word-sweep/GradientWordSweep

- 镜头卡: `references/shots/typography/gradient-word-sweep.md`
- 时长: 105 帧 / 3500 ms, `DURATION` 于第 28 行
- 分镜:
  - `GradientWordSweep.tsx:26` `const GRAD = 'linear-gradient(92deg, #59c2ff 0%, #9d6bff 32%, #ff6ed4 62%, #ffc46b 100%)';`
  - `GradientWordSweep.tsx:28` `export const GRADIENT_WORD_SWEEP_DURATION = 105;`
  - `GradientWordSweep.tsx:30` `const FILL_START = 12;`
  - `GradientWordSweep.tsx:31` `const FILL_END = 30; // 18 帧 ≈ 0.6s，快扫`
  - `GradientWordSweep.tsx:32` `const LIGHT_START = FILL_END + 3;`
  - `GradientWordSweep.tsx:74` `const FLASH_AT = [2, 12, 22, 33, 43, 52, 56];`
  - `GradientWordSweep.tsx:82` `const PAD = 90;`
  - `GradientWordSweep.tsx:118` `const p = interpolate(frame, [FILL_START, FILL_END], [0, 1], {`
  - `GradientWordSweep.tsx:121` `easing: Easing.out(Easing.quad),`
  - `GradientWordSweep.tsx:125` `const headFade = interpolate(frame, [FILL_END, FILL_END + 6], [1, 0], {`
  - `GradientWordSweep.tsx:131` `const trailFade = interpolate(frame, [FILL_END, FILL_END + 10], [1, 0], {`
  - `GradientWordSweep.tsx:135` `const TRAIL = 34; // 尾迹长度（% 宽度）`
  - `GradientWordSweep.tsx:151` `interpolate(frame, [FILL_START, FILL_END], [0, 1], {`
- 卡片参数:
  - `gradient-word-sweep.md:4` `适用: 标语里给单个动词/卖点词充能（Supercharged/faster/AI…）；能量高潮段的文字戏；黑场品牌片的口号帧`
  - `gradient-word-sweep.md:5` `时长: 扫充 ~15–20f（要快）+ 稳态闪电呼吸 1–2s；全段 2.5–3.5s`
  - `gradient-word-sweep.md:14` `**快**（扫充 15–20f，慢了读作进度条）、**波前最亮**（刚点亮的`
  - `gradient-word-sweep.md:22` `辉光最强、向后衰减；填充结束后 ~10f 淡出到稳态`
  - `gradient-word-sweep.md:31` `12→30f 扫充，33f 起 7 次排期闪电（末次 ~92f 熄灭），整段极缓推近 1→1.025`
  - `gradient-word-sweep.md:36` `| 扫充时长 | 15–20f | 原片"速度很快"；>28f 读作进度条 |`
  - `gradient-word-sweep.md:40` `| 闪电频率 | 稀疏零星（同屏 ≤2 道，间歇 >8f；demo 排期 7 次、同屏 1 道、间隔 ≥4–11f） | 频率高读作电弧故障 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 节奏或收尾只给首页最后一屏, 不做成组件默认态.

### demos/typography/lead-word-zoom-assemble/LeadWordZoomAssemble

- 镜头卡: `references/shots/typography/lead-word-zoom-assemble.md`
- 时长: 84 帧 / 2800 ms, `DURATION` 于第 26 行
- 分镜:
  - `LeadWordZoomAssemble.tsx:26` `export const LEAD_WORD_ZOOM_ASSEMBLE_DURATION = 84; // 2.8s @30fps`
  - `LeadWordZoomAssemble.tsx:31` `const FONT_SIZE = 96;`
  - `LeadWordZoomAssemble.tsx:32` `const INITIAL_SCALE = 2.3; // 首词起手放大倍数`
  - `LeadWordZoomAssemble.tsx:33` `const INTRO_DURATION = 6; // f：首词淡入`
  - `LeadWordZoomAssemble.tsx:34` `const HOLD_DURATION = 12; // f：首词在峰值停留（推近发生在这一段）`
  - `LeadWordZoomAssemble.tsx:35` `const PUSH_SCALE = 1.06; // hold 期间继续推近的倍数`
  - `LeadWordZoomAssemble.tsx:36` `const RECEDE_DURATION = 12; // f：缩回终字号`
  - `LeadWordZoomAssemble.tsx:37` `const ASSEMBLE_DURATION = 24; // f：整行左滑到位`
  - `LeadWordZoomAssemble.tsx:38` `const WORD_DELAY = 6; // f：缩回起点后第二个词开始推入`
  - `LeadWordZoomAssemble.tsx:39` `const WORD_STAGGER = 4; // f：后续词之间的错峰`
  - `LeadWordZoomAssemble.tsx:40` `const WORD_DURATION = 12; // f：单词推入行程`
  - `LeadWordZoomAssemble.tsx:41` `const WORD_PUSH = 0.5; // em：后续词起始位置在自己槽位右侧多远`
  - `LeadWordZoomAssemble.tsx:42` `const WORD_FADE = 2; // f：后续词淡入（刻意极短——是被推进来的，不是淡进来的）`
  - `LeadWordZoomAssemble.tsx:43` `const LETTER_SPACING = '-0.03em';`
  - `LeadWordZoomAssemble.tsx:47` `const LIFT_DISTANCE = -56; // px`
  - `LeadWordZoomAssemble.tsx:49` `const CRASH_FRAMES = 12; // f：段尾 crash-zoom 占用的收尾帧数`
  - `LeadWordZoomAssemble.tsx:50` `const CRASH_SCALE = 0.2;`
  - `LeadWordZoomAssemble.tsx:51` `const CRASH_BLUR = 9;`
  - `LeadWordZoomAssemble.tsx:53` `const INK = '#1d1d1f';`
  - `LeadWordZoomAssemble.tsx:54` `const INK_DIM = '#6e6f76';`
  - `LeadWordZoomAssemble.tsx:55` `const ACCENT = '#5b63d3';`
  - `LeadWordZoomAssemble.tsx:65` `const PUSH_EASE = Easing.bezier(0.25, 1, 0.5, 1);`
  - (运动行 37 条, 留前 22 条, 文件 261 行已逐行扫过)
- 卡片参数:
  - `lead-word-zoom-assemble.md:3` `一句话: 首词以 2.3 倍字号占据画面中央、hold 期间继续推近 6%，随后一条曲线同时完成「缩回终字号」与「整行左滑归位」，后续词各自从槽位右侧 0.5em 被推进来；支点横向钉首词中心、纵向钉基线（挂载时实测），整行上移的同一时窗副行浮出，停一拍后整幕 crash-zoom 推近失焦交棒`
  - `lead-word-zoom-assemble.md:5` `时长: 约 2.8s（84f@30fps；组句 f36 完成、上移与副行 f32–46、静止 26f、末 12f crash）`
  - `lead-word-zoom-assemble.md:17` `位置"，如果支点取行盒中心，缩放和左滑会各自把字往两边拽，末尾几帧基线抖得肉眼可见。`
  - `lead-word-zoom-assemble.md:23` `'scale = interpolate(f, [0,12], [2.3, 2.3·1.06], PUSH_EASE)`
  - `lead-word-zoom-assemble.md:24` `+ interpolate(f, [12,24], [0, 1-2.3·1.06], ZOOM_EASE)'。`
  - `lead-word-zoom-assemble.md:25` `第一段是 hold 期间的推近（'cubic-bezier(.25,1,.5,1)'，减速后挂在峰值），第二段是缩回`
  - `lead-word-zoom-assemble.md:27` `- **缩回与左滑共用 ZOOM_EASE**（'cubic-bezier(.5,0,.05,1)'，重 ease-in-out、零回弹）：`
  - `lead-word-zoom-assemble.md:28` `'translate = interpolate(f, [12,36], [slideDistance, 0], ZOOM_EASE)'。两个动作必须读作`
  - `lead-word-zoom-assemble.md:39` `（'cubic-bezier(.22,.8,.36,1)'，起步快、落地长），透明度只用 2f 淡完。淡入必须极短，`
  - `lead-word-zoom-assemble.md:44` `淡入 + 上移 16px——上移让出的空间当帧被副行填掉，没有空当；f46–72 完全静止 26f；`
  - `lead-word-zoom-assemble.md:45` `f72–83 整幕 'scale 1→1.2' + 'blur 0→9px' + 'opacity 1→0.45'（ease-in-quad），推近失焦`
  - `lead-word-zoom-assemble.md:47` `- **质感（demo）**：首词入场 6f 内带 8px→0 失焦；缩回段按 scale 速度给瞬时失焦（≤3.5px，停稳归零）；`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 节奏或收尾只给首页最后一屏, 不做成组件默认态.

### demos/typography/marker-underline-title/MarkerUnderlineTitle

- 镜头卡: `references/shots/typography/marker-underline-title.md`
- 时长: 75 帧 / 2500 ms, `DURATION` 于第 13 行
- 分镜:
  - `MarkerUnderlineTitle.tsx:13` `export const MARKER_UNDERLINE_TITLE_DURATION = 75; // 标题 22f 落定 → f32–42 划线 → 静止 33f`
  - `MarkerUnderlineTitle.tsx:44` `const LEN = 252;`
  - `MarkerUnderlineTitle.tsx:45` `const PATH = buildStroke(LEN, 77);`
  - `MarkerUnderlineTitle.tsx:46` `const MARKER_INK = '#1b1916'; // 暖调近黑（马克笔墨，不是纯黑）`
  - `MarkerUnderlineTitle.tsx:66` `const draw = interpolate(frame, [32, 42], [0, 1], {`
- 卡片参数:
  - `marker-underline-title.md:5` `时长: 标题落定 +4~8f 后起笔，划线 8–12f，总 1–1.5s`
  - `marker-underline-title.md:12` `（8–12f 一笔呵成，慢了读作加载条）、**近**（贴着字底，离远了`
  - `marker-underline-title.md:17` `- SVG path 描画（strokeDashoffset 或裁剪窗），从左到右 8–12f，`
  - `marker-underline-title.md:18` `ease-out 微收尾（起笔快收笔略缓＝手劲）`
  - `marker-underline-title.md:22` `- 时机：标题完全落定后 +4~8f 起笔——划线是"看完标题后的强调"，`
  - `marker-underline-title.md:26` `- demo 导出 'MARKER_UNDERLINE_TITLE_DURATION = 75'：标题两行错峰 22f 落定 → f32–42 划线 → 静止 33f`
  - `marker-underline-title.md:31` `| 划线时长 | 10f（原片实测节奏；14f 版被裁偏慢） | >14f 读作进度条；<6f 看不见笔迹方向 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 节奏或收尾只给首页最后一屏, 不做成组件默认态.

### demos/typography/outline-word-fill/OutlineWordFill

- 镜头卡: `references/shots/typography/outline-word-fill.md`
- 时长: 90 帧 / 3000 ms, `DURATION` 于第 31 行
- 分镜:
  - `OutlineWordFill.tsx:31` `export const OUTLINE_WORD_FILL_DURATION = 90; // 3.0s @30fps`
  - `OutlineWordFill.tsx:34` `const CX = 960;`
  - `OutlineWordFill.tsx:35` `const CY = 540;`
  - `OutlineWordFill.tsx:38` `const SIZE = 220;`
  - `OutlineWordFill.tsx:39` `const POP = 54; // 硬切点亮帧`
- 卡片参数:
  - `outline-word-fill.md:3` `一句话: 空心词（细暖灰描边、500 字重）从 3.2 倍急缓收缩落位，虚线大圆随后从 2.8 倍收到字周围并缓慢自转，左右水平虚线从画框边缘内伸；描边先微微增亮，实心白热字在一帧内硬切点亮，一闪辉光即定格`
  - `outline-word-fill.md:4` `适用: 单词式利益点/口号的重锤一拍；节奏卡点上的"钉子"镜；深底品牌片的强调帧`
  - `outline-word-fill.md:5` `时长: 约 3.0s（90f@30fps，短促单拍 + 36f 落定）`
  - `outline-word-fill.md:11` `急速收缩到位（这是尺寸的落定），再是描边在一帧内变实心白（这是质感的`
  - `outline-word-fill.md:17` `（demo 以 1920×1080 原生坐标、帧号标定；look = ember 暖黑 · 橙）`
  - `outline-word-fill.md:18` `- 空心字急缓收缩：'scale = mix(3.2, 1, ramp(f, 2, 11, EASE.snappy))'，2–8f 淡入——`
  - `outline-word-fill.md:19` `**收缩窗只 11f**，快到几乎是一次冲击；按 scale 速度给瞬时失焦（停稳归零）`
  - `outline-word-fill.md:24` `8–18f 淡入，'scale 2.8 → 1' 在 8–52f 慢收（EASE.out，**44f，全片最慢的一条曲线**）；主圈 0.22°/f 自转，`
  - `outline-word-fill.md:25` `点亮那一刻刹停（"锁定"），内圈继续慢转让 hold 段画面仍在呼吸`
  - `outline-word-fill.md:26` `- 左右水平虚线（'dasharray 14 12'）：28–46f 从画框边缘内伸到圆边外 28px，线端带准星点；`
  - `outline-word-fill.md:28` `- 描边预热：44–53f 暖灰 → 亮橙白并带一点外发光，给硬切一个"充能"前奏`
  - `outline-word-fill.md:29` `- **瞬时填充**：第 54 帧 'lit = frame >= 54 ? 1 : 0'，solid 与 outline 透明度硬切，不存在中间态；`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 节奏或收尾只给首页最后一屏, 不做成组件默认态.

### demos/typography/paper-title-card/PaperTitleCard

- 镜头卡: `references/shots/typography/paper-title-card.md`
- 时长: 55 帧 / 1833 ms, `DURATION` 于第 10 行
- 分镜:
  - `PaperTitleCard.tsx:10` `export const PAPER_TITLE_CARD_DURATION = 55; // ≈1.8s @30fps`
  - `PaperTitleCard.tsx:29` `const SUB_DIGITS = '12';`
  - `PaperTitleCard.tsx:33` `const DIGITS = '0123456789';`
  - `PaperTitleCard.tsx:40` `const t = interpolate(frame, [delay, delay + 22], [0, 1], {`
  - `PaperTitleCard.tsx:43` `easing: Easing.bezier(0.25, 0.8, 0.25, 1),`
  - `PaperTitleCard.tsx:82` `const fadeOut = interpolate(frame, [duration - 8, duration], [1, 0], {`
  - `PaperTitleCard.tsx:86` `const underline = interpolate(frame, [16, 34], [0, 1], {`
  - `PaperTitleCard.tsx:89` `easing: Easing.bezier(0.3, 0, 0.2, 1),`
  - `PaperTitleCard.tsx:91` `const subT = interpolate(frame, [10, 22], [0, 1], {`
  - `PaperTitleCard.tsx:124` `const t = interpolate(frame, [delay, delay + 9], [0, 1], {`
  - `PaperTitleCard.tsx:127` `easing: Easing.bezier(0.2, 0.75, 0.3, 1),`
- 卡片参数:
  - `paper-title-card.md:5` `时长: 1.7–1.8s（50–55f）`
  - `paper-title-card.md:23` `| 逐词入场 | 第 i 词 delay = 4 + i·4、9f，bezier(0.2,0.75,0.3,1)；scale 1.28→1 + blur 7px→0 + opacity | scale 起点 1.28 是"压印"读感的甜点——对照暗场版 TitleCard 用 40px 上移+blur 10，同配方明暗两版 |`
  - `paper-title-card.md:25` `| 下划线 | 16→34f scaleX 0→1，220×6px 强调色 | 下划线是收束信号，出现即预告本卡快结束 |`
  - `paper-title-card.md:26` `| 时长 | 全片 4 张字卡均 50–55f（≈1.8s） | 字卡时长定式化——观众读一句话的时间，长了拖节奏短了读不完 |`
  - `paper-title-card.md:27` `| 版式 | 字号 116/serif；纸底 oklch(97.5% 0.008 82) + 中心暖光 radial；尾部 8f 淡出 | 纸底+暖光与产品画面同色系，字卡才不像广告插播 |`
  - `paper-title-card.md:28` `| 副行 | mono 小字 + DigitRoll（demo "12 shots rendered today"）；digit-roll 参数见 list-stack-press 卡计数器行 | 副行给具体数字最有说服力；数字滚动必须在本卡淡出前落定（教训）——排节拍从本卡淡出帧倒推 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 节奏或收尾只给首页最后一屏, 不做成组件默认态.

### demos/typography/pill-chip-slot-cycle-handled/PillChipSlotCycleHandled

- 镜头卡: `references/shots/typography/pill-chip-slot-cycle-handled.md`
- 时长: 150 帧 / 5000 ms, `DURATION` 于第 9 行
- 分镜:
  - `PillChipSlotCycleHandled.tsx:9` `export const PILL_CHIP_SLOT_CYCLE_HANDLED_DURATION = 150; // 5000ms @30fps`
  - `PillChipSlotCycleHandled.tsx:17` `const FONT = '700 22px -apple-system,system-ui,sans-serif';`
  - `PillChipSlotCycleHandled.tsx:20` `const FALLBACK_WIDTHS = WORDS.map((o) => o.w.length * 13 + 74);`
- 卡片参数:
  - `pill-chip-slot-cycle-handled.md:5` `时长: 约 5.0s（150f@30fps：静置 → 3 次切换（0.25/0.47/0.69）→ 尾部静置）`
  - `pill-chip-slot-cycle-handled.md:20` `（≈18f），缓动 'E.inOutCubic'——**两头都缓**，对应"滚轮起步与停稳"`
  - `pill-chip-slot-cycle-handled.md:22` `'lerp(frac, widths[ci], widths[ci+1])'，**帧内插值**所以伸缩是连续的，`
  - `pill-chip-slot-cycle-handled.md:36` `| 切换点 | '[0.25, 0.47, 0.69]'，窗 0.12（≈18f） | 段间约 0.10（≈15f）静置读词；起手 0.25 前的静置让观众先认出句式 |`
- 可逆: 没有帧采样. 当静态夹具.
- 裁决: 只留规则. 节奏或收尾只给首页最后一屏, 不做成组件默认态.

### demos/typography/pill-slot-cycle/PillSlotCycle

- 镜头卡: `references/shots/typography/pill-slot-cycle.md`
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - `PillSlotCycle.tsx:31` `const BEAT = 21; // ~0.7s @30fps`
  - `PillSlotCycle.tsx:32` `const INTRO = 12; // 句干入场`
  - `PillSlotCycle.tsx:34` `const SWAP = 8; // 每拍前 8f 完成换位`
  - `PillSlotCycle.tsx:35` `const FIN = 14; // 收束句落位`
  - `PillSlotCycle.tsx:36` `const CENTER = 26; // 落位后整行缓缓居中`
  - `PillSlotCycle.tsx:38` `export const PILL_SLOT_CYCLE_DURATION = INTRO + CYCLES * BEAT + FIN + 48; // 200f ≈ 6.7s`
  - `PillSlotCycle.tsx:40` `const STEM_LEFT = 300; // 句干左端锚点（列举期间纹丝不动）`
  - `PillSlotCycle.tsx:41` `const STEM_GAP = 36;`
  - `PillSlotCycle.tsx:42` `const WORD_GAP = 18; // 结论句里 "to" 与 "do" 之间是普通词距，不是槽位间距`
  - `PillSlotCycle.tsx:167` `const finT = interpolate(frame, [cycleEnd, cycleEnd + FIN], [0, 1], {`
  - `PillSlotCycle.tsx:170` `easing: Easing.out(Easing.back(1.4)),`
  - `PillSlotCycle.tsx:243` `interpolate(frame + 0.5, [cycleEnd, cycleEnd + FIN], [90, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.4)) }) -`
  - `PillSlotCycle.tsx:244` `interpolate(frame - 0.5, [cycleEnd, cycleEnd + FIN], [90, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.4)) }),`
- 卡片参数:
  - `pill-slot-cycle.md:5` `时长: 入场 12f + 每拍 21f × 词数 + 收束 14f + hold；6 词约 6.7s（demo 200f，含 48f 完整句 hold）`
  - `pill-slot-cycle.md:20` `- 每拍 21f（~0.7s），前 8f 完成换位、后 13f 静置——静置段是给观众`
  - `pill-slot-cycle.md:27` `- 收束拍：末 pill 上飞（7f ease-in），"do it all." 从下 90px 带`
  - `pill-slot-cycle.md:28` `Easing.back(1.4) 过冲落位——全片唯一一次过冲，留给结论；落位后整行用 smooth 26f 缓缓居中`
  - `pill-slot-cycle.md:34` `| 拍长 | 21f/词，5–7 词 | <16f 读不完短语；>28f 节拍器感散掉；8+ 词观众开始数数 |`
  - `pill-slot-cycle.md:35` `| 换位窗 | 拍内前 8f | 拉长到 12f+ 新旧同屏太久，读作两个 pill 打架 |`
  - `pill-slot-cycle.md:37` `| 运动模糊 | 入 ≤14 / 出 ≤12px 竖向 blur，按真实速度计算（静止为 0）；入 rotateX -38°→0、出 0→34° 绕滚筒翻页 | 去掉 blur 换位读作硬弹；>20px 中间帧糊成色块 |`
  - `pill-slot-cycle.md:38` `| 收束过冲 | Easing.back(1.4)，14f | >2 结论落位像卡通；无过冲结论与列举没有档次差 |`
  - `pill-slot-cycle.md:39` `| 收尾 hold | 完整句静置 ≥45f | 这句话是全段目的，不 hold 等于白列举 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 节奏或收尾只给首页最后一屏, 不做成组件默认态.

### demos/typography/text-column-converge/TextColumnConverge

- 镜头卡: `references/shots/typography/text-column-converge.md`
- 时长: 180 帧 / 6000 ms, `DURATION` 于第 54 行
- 分镜:
  - `TextColumnConverge.tsx:35` `const START = 8; // 开场黑场立静`
  - `TextColumnConverge.tsx:38` `const NEW_LEFT_EDGE = 618; // 412×1.5：NEW 左缘（= 左屏边距）`
  - `TextColumnConverge.tsx:39` `const WORD_RIGHT_EDGE = 1302; // 868×1.5：特性词右缘（= 右屏边距，1920-1302=618 对称）`
  - `TextColumnConverge.tsx:41` `const FS = 42; // 原片字高很小（720p 下 cap ~20px → 1080p ~30px → 字号 ~42）`
  - `TextColumnConverge.tsx:42` `const LSP = 3; // letterSpacing`
  - `TextColumnConverge.tsx:45` `const ADV = 0.6 * FS + LSP; // 每字符步进`
  - `TextColumnConverge.tsx:46` `const LINE_W = (4 + BRAND_WORD.length) * ADV; // "NEW " + 字标，共 19 字符`
  - `TextColumnConverge.tsx:47` `const MERGED_LEFT = 960 - LINE_W / 2; // 合拢后 NEW 左缘`
  - `TextColumnConverge.tsx:48` `const MERGED_RIGHT = 960 + LINE_W / 2; // 合拢后字标右缘`
  - `TextColumnConverge.tsx:49` `const CONVERGE_DUR = 36; // 合拢时长：原片 ~1.2s ≈ 36 帧`
  - `TextColumnConverge.tsx:50` `const CONVERGE_DELAY = 10; // 字标停稳后先静置 10 帧再合拢（原片 32.4→32.7s）`
  - `TextColumnConverge.tsx:51` `const SUB_DELAY = 18; // 合拢定格后 ~0.6s 出斜体小字`
  - `TextColumnConverge.tsx:54` `export const TEXT_COLUMN_CONVERGE_DURATION = 180;`
  - `TextColumnConverge.tsx:56` `const INK = '#eeeef2';`
  - `TextColumnConverge.tsx:57` `const INK_NEW = '#8a8c96'; // 轮换期 NEW 的次级灰`
  - `TextColumnConverge.tsx:58` `const INK_SUB = '#a3a5ae';`
  - `TextColumnConverge.tsx:61` `const LAST_START = START + STEPS.slice(0, -1).reduce((a, s) => a + s.dur, 0);`
  - `TextColumnConverge.tsx:63` `interpolate(frame - LAST_START - CONVERGE_DELAY, [0, CONVERGE_DUR], [0, 1], {`
  - `TextColumnConverge.tsx:65` `easing: Easing.inOut(Easing.cubic),`
  - `TextColumnConverge.tsx:93` `const cv = interpolate(cvT, [0, CONVERGE_DUR], [0, 1], {`
  - `TextColumnConverge.tsx:95` `easing: Easing.inOut(Easing.cubic),`
  - `TextColumnConverge.tsx:99` `const newLeft = interpolate(cv, [0, 1], [NEW_LEFT_EDGE, MERGED_LEFT]);`
  - (运动行 24 条, 留前 22 条, 文件 191 行已逐行扫过)
- 卡片参数:
  - `text-column-converge.md:3` `一句话: 双词对峙合拢——左"NEW"右特性词钉死在等屏边距两侧硬切轮换、全程零收缩，换到最后一词才唯一一次 ease-in-out 滑到居中咬合成短语，下方小字近乎硬切浮现；收尾揭晓型文字卡`
  - `text-column-converge.md:5` `时长: 轮换 7–16f/词 × 8–9 词 + 合拢 ~36f + 小字后静置；全段约 5–6s`
  - `text-column-converge.md:21` `- 词轮换纯硬切，停留帧数不均（16/12/9/8/7/8/10/12f，机器节奏`
  - `text-column-converge.md:23` `- **唯一一次合拢**：末词停稳 ~10f 后，~1.2s（36f）ease-in-out`
  - `text-column-converge.md:29` `- 定格 ~18f 后斜体小字近乎硬切浮现（4f 快淡、零位移），与整行`
  - `text-column-converge.md:31` `- 质感：冷色深底 + 极淡顶光 + 暗角/颗粒；词换瞬间 1 帧提亮；NEW 轮换期为次级灰、`
  - `text-column-converge.md:33` `demo 全长 180f（导出 'TEXT_COLUMN_CONVERGE_DURATION'）`
  - `text-column-converge.md:39` `| 词停留 | 7–16f 不均 | 均匀停留读作节拍器；<7f 读不完词 |`
  - `text-column-converge.md:40` `| 合拢触发 | 末词停稳 +10f（原片 32.4→32.7s 实测） | 停稳期太短，观众没意识到"这词不换了"就开始滑 |`
  - `text-column-converge.md:41` `| 合拢时长 | 36f ease-in-out cubic（**原片实测** ~1.2s 连续滑动） | <24f 读作弹跳归位；>50f 读作拖 |`
  - `text-column-converge.md:44` `| 小字浮现 | 定格 +18f，4f 快淡零位移（原片 34.4→34.6s 间直接出现） | 加滑入/长淡入就抢了合拢的戏 |`
  - `text-column-converge.md:55` `- 原片词换瞬间带 1 帧亮度闪烁（打字机换行感），demo 已加回 1f 提亮；`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 节奏或收尾只给首页最后一屏, 不做成组件默认态.

### demos/typography/title-demote-to-label/TitleDemoteToLabel

- 镜头卡: `references/shots/typography/title-demote-to-label.md`
- 时长: 246 帧 / 8200 ms, `DURATION` 于第 31 行
- 分镜:
  - `TitleDemoteToLabel.tsx:31` `export const TITLE_DEMOTE_TO_LABEL_DURATION = 246;`
  - `TitleDemoteToLabel.tsx:33` `const B0 = 112; // B 式（转场）起点`
  - `TitleDemoteToLabel.tsx:34` `const MARGIN = 120; // 网格左边距`
  - `TitleDemoteToLabel.tsx:35` `const HERO = 220; // 标题字号`
  - `TitleDemoteToLabel.tsx:36` `const LABEL_SCALE = 0.22; // 降格终点缩放（≈48px）`
  - `TitleDemoteToLabel.tsx:37` `const SLOT = { x: MARGIN + 96, y: 196 }; // 标签槽（左中锚点）；前面留给「01 /」`
  - `TitleDemoteToLabel.tsx:38` `const DEMOTE_EASE = bezier(0.6, 0, 0.18, 1); // 起步果断、落点很软的不对称 in-out`
  - `TitleDemoteToLabel.tsx:39` `const SEL = alpha(L.accent, 0.2);`
- 卡片参数:
  - `title-demote-to-label.md:5` `时长: A ~3.7s（112f）/ B ~4.5s（134f）；demo 两式串播 246f`
  - `title-demote-to-label.md:19` `- 降格是**单次连续补间**，26f 不对称 in-out（bezier(0.6,0,0.18,1)：起步果断、落点很软）：`
  - `title-demote-to-label.md:23` `- 登场显影：标题逐字从遮罩线下升起（rise，16f/字、1.6f 错峰），朱红句点晚 10f 过冲弹出；`
  - `title-demote-to-label.md:24` `mono 眉题「CHAPTER 01」字距由宽收紧。显影后必须站稳 ≥18f 再降格（demo 20f，期间 1.5% 极缓推近）——`
  - `title-demote-to-label.md:25` `没站稳就缩，宣告拍被吃掉。眉题随起飞 6f 淡出，落位前标签前缀「01 /」从左擦入接班`
  - `title-demote-to-label.md:28` `先密后疏错峰；生长起点在降格进行到 12f 时，标题还在飞内容已在长——这个重叠是"交接无空档"的来源。`
  - `title-demote-to-label.md:29` `横跨全宽的分隔线晚几帧再画，别让它在标题飞行路径上同帧生长`
  - `title-demote-to-label.md:31` `（盖住，10f），撤掉时左缘 0→100%（从左让开，8f）；高亮撤净后再起降格`
  - `title-demote-to-label.md:33` `- 两式串播不再白闪：共用一个舞台，A 内容 ease-in 上移 12f 退场 → B 大标题原地显影；`
  - `title-demote-to-label.md:35` `（demo 导出 'TITLE_DEMOTE_TO_LABEL_DURATION' = 246f，look = paper）`
  - `title-demote-to-label.md:40` `| 降格补间 | 26f 不对称 in-out，scale→0.22（落成 ≈48px） | <14f 读作标题被弹走；终点 >0.45 标签太大压内容；标签 <40px 不可读 |`
  - `title-demote-to-label.md:41` `| 站稳拍 | 显影后 ≥18f 静置 | 省掉这拍，观众没读完标题它就跑了，降格白做 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 节奏或收尾只给首页最后一屏, 不做成组件默认态.

### demos/typography/type-assembly-moves/LetterformDriftAssembly

- 镜头卡: `references/shots/typography/type-assembly-moves.md`
- 时长: 150 帧 / 5000 ms, `DURATION` 于第 22 行
- 分镜:
  - `LetterformDriftAssembly.tsx:4` `// （delay i×3f，45f 行程，Easing.out(cubic)）。每字锁定瞬间给一次`
  - `LetterformDriftAssembly.tsx:22` `export const LETTERFORM_DRIFT_ASSEMBLY_DURATION = 150;`
  - `LetterformDriftAssembly.tsx:30` `const TRAVEL = 45; // 每字漂入行程帧数`
  - `LetterformDriftAssembly.tsx:31` `const STAG = 3; // 错峰间隔`
  - `LetterformDriftAssembly.tsx:32` `const INK = [23, 24, 28]; // G.ink1 #17181c`
  - `LetterformDriftAssembly.tsx:42` `? interpolate(frame, [80, 92], [1, 1.04], {`
  - `LetterformDriftAssembly.tsx:45` `easing: Easing.inOut(Easing.cubic),`
  - `LetterformDriftAssembly.tsx:47` `: interpolate(frame, [92, 104], [1.04, 1], {`
  - `LetterformDriftAssembly.tsx:50` `easing: Easing.inOut(Easing.cubic),`
  - `LetterformDriftAssembly.tsx:86` `const p = interpolate(frame, [start, lock], [0, 1], {`
  - `LetterformDriftAssembly.tsx:89` `easing: Easing.out(Easing.cubic),`
  - `LetterformDriftAssembly.tsx:99` `const op = interpolate(p, [0, 1], [0.35, 1]);`
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
- 裁决: 只留规则. 节奏或收尾只给首页最后一屏, 不做成组件默认态.

### demos/typography/type-assembly-moves/SplitTextStagger

- 镜头卡: `references/shots/typography/type-assembly-moves.md`
- 时长: 130 帧 / 4333 ms, `DURATION` 于第 18 行
- 分镜:
  - `SplitTextStagger.tsx:3` `// 内层从 translateY(115%) 升到 0，各 14f Easing.out(cubic)，带 10% 过冲`
  - `SplitTextStagger.tsx:18` `export const SPLIT_TEXT_STAGGER_DURATION = 130;`
  - `SplitTextStagger.tsx:20` `const TEXT = 'FRAME MOTION.'; // 品牌短句 Frame motion. Craft the shot. 的前半句（13 字符，与原文等长）`
  - `SplitTextStagger.tsx:21` `const START = 12; // 首字起跳帧`
  - `SplitTextStagger.tsx:22` `const RISE = 14; // 升起时长`
  - `SplitTextStagger.tsx:23` `const SETTLE = 6; // 过冲回落时长`
  - `SplitTextStagger.tsx:24` `const OVERSHOOT = -10; // 过冲到 -10%（原案 6%，加码）`
  - `SplitTextStagger.tsx:25` `const FONT = 136;`
  - `SplitTextStagger.tsx:26` `const LINE_H = 1.05; // span 行高（translateY 百分比以此为基准）`
  - `SplitTextStagger.tsx:32` `return interpolate(f, [t0, t0 + RISE], [115, OVERSHOOT], {`
  - `SplitTextStagger.tsx:35` `easing: Easing.out(Easing.cubic),`
  - `SplitTextStagger.tsx:38` `return interpolate(f, [t0 + RISE, t0 + RISE + SETTLE], [OVERSHOOT, 0], {`
  - `SplitTextStagger.tsx:41` `easing: Easing.out(Easing.quad),`
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
- 裁决: 只留规则. 节奏或收尾只给首页最后一屏, 不做成组件默认态.

### demos/typography/type-assembly-moves/TextOnPath

- 镜头卡: `references/shots/typography/type-assembly-moves.md`
- 时长: 160 帧 / 5333 ms, `DURATION` 于第 26 行
- 分镜:
  - `TextOnPath.tsx:26` `export const TEXT_ON_PATH_DURATION = 160;`
  - `TextOnPath.tsx:31` `const P0 = { x: 150, y: 930 };`
  - `TextOnPath.tsx:32` `const P1 = { x: 860, y: 920 };`
  - `TextOnPath.tsx:33` `const P2 = { x: 1300, y: 780 };`
  - `TextOnPath.tsx:34` `const P3 = { x: 1700, y: 400 };`
  - `TextOnPath.tsx:51` `const SAMPLES = 300;`
  - `TextOnPath.tsx:78` `const FS = 92;`
  - `TextOnPath.tsx:79` `const TRACK = '-0.01em';`
  - `TextOnPath.tsx:80` `const CHAR_W = 60; // 实测前的兜底字宽`
  - `TextOnPath.tsx:81` `const FINAL = { x: 150, y: 250 }; // 标题落位：左缘 x、字心 y`
  - `TextOnPath.tsx:82` `const T0 = 4; // 起跑`
  - `TextOnPath.tsx:83` `const TRAVEL = 60; // 沿线推进`
  - `TextOnPath.tsx:84` `const HOLD = 8; // 挂线停顿`
  - `TextOnPath.tsx:85` `const SETTLE = 18; // 每字摆正`
  - `TextOnPath.tsx:86` `const SETTLE_STAG = 1.1;`
  - `TextOnPath.tsx:87` `const END_S = LEN * 0.94; // 车头字心最终停在弧长 94% 处`
  - `TextOnPath.tsx:88` `const TRAVEL_EASE = bezier(0.42, 0, 0.12, 1); // 缓起、长 ease-out`
  - `TextOnPath.tsx:89` `const LIFT_EASE = bezier(0.3, 1.22, 0.6, 1); // 抬升：快到、过冲 ~4% 回落（抬升行程大，8% 会顶进眉题）`
  - `TextOnPath.tsx:92` `const GRID = [400, 577, 753, 930];`
  - `TextOnPath.tsx:93` `const TICKS = ['$60M', '$40M', '$20M', '$0'];`
  - `TextOnPath.tsx:129` `const badge = springAt(frame, 98, { damping: 15, stiffness: 190 });`
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
- 裁决: 只留规则. 节奏或收尾只给首页最后一屏, 不做成组件默认态.

### demos/typography/type-entrance-moves/LetterDropPhysics

- 镜头卡: `references/shots/typography/type-entrance-moves.md`
- 时长: 150 帧 / 5000 ms, `DURATION` 于第 16 行
- 分镜:
  - `LetterDropPhysics.tsx:16` `export const LETTER_DROP_PHYSICS_DURATION = 150;`
  - `LetterDropPhysics.tsx:25` `const SIZE = 176; // 字号`
  - `LetterDropPhysics.tsx:26` `const FLOOR_Y = 600; // 地面线（字符基线）`
  - `LetterDropPhysics.tsx:27` `const BASE = Math.round(SIZE * 0.886); // 字行盒顶到基线（SF Pro，lineHeight 1 实测）`
  - `LetterDropPhysics.tsx:30` `const PAD = 200; // 运动模糊层外扩`
  - `LetterDropPhysics.tsx:31` `const DROP = 720; // 下落距离`
  - `LetterDropPhysics.tsx:32` `const T_FALL = 24; // 落到地面用时`
  - `LetterDropPhysics.tsx:33` `const T_B1 = 16; // 第一次弹跳时长（高 30%）`
  - `LetterDropPhysics.tsx:34` `const T_B2 = 8; // 第二次弹跳时长（高 9%）`
  - `LetterDropPhysics.tsx:35` `const SNAP = 110; // 齐整回正的一拍`
  - `LetterDropPhysics.tsx:36` `const SNAP_DUR = 6;`
- 卡片参数:
  - `type-entrance-moves.md:5` `时长: 单式 5s（含 hold 与静止收尾；动作段 ~116f，demo 150f）`
  - `type-entrance-moves.md:23` `| 坠落 | 第 i 字符帧 4+36·(1−(1−i/(n−1))^1.5) 起跳（首末字固定在 4f / 40f，间隔越来越密；demo 9 字符 6.5→1.6f）；y = −DROP + DROP·(t/24)²（重力）→ 4u(1−u) 抛物线弹跳 30% → 二跳 9% | 弹跳衰减比 30%/9% 是"有弹性但不闹"的甜点；三跳以上读作果冻 |`
  - `type-entrance-moves.md:25` `| 归位一拍 | 全员落定后（如帧 110）6f ease-out 集体 rotate→0 + scale 1.06→1 | 集体归位是句号——错峰归位会把"立正"的仪式感拆散 |`
  - `type-entrance-moves.md:26` `| 收尾 | 动作完毕真静止 ≥20f | R1：静止期所有属性锁死（含歪角归零后） |`
  - `type-entrance-moves.md:31` `- 落地砸声是声音强依赖候选位（sound-design §4.5）：逐字钉帧会让重量感翻倍，`
  - `type-entrance-moves.md:37` `- 标题入场自带高注意力——别和其他高能量入场同帧抢戏`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 节奏或收尾只给首页最后一屏, 不做成组件默认态.

### demos/typography/type-rhythm-sync/FontWeightPump

- 镜头卡: `references/shots/typography/type-rhythm-sync.md`
- 时长: 165 帧 / 5500 ms, `DURATION` 于第 28 行
- 分镜:
  - `FontWeightPump.tsx:28` `export const FONT_WEIGHT_PUMP_DURATION = 165;`
  - `FontWeightPump.tsx:32` `const BEATS = [16, 30, 44, 58, 72, 86, 100, 114];`
  - `FontWeightPump.tsx:33` `const DROP = 128;`
  - `FontWeightPump.tsx:34` `const DOWN = new Set([0, 4]); // 每小节第 1 拍重音`
  - `FontWeightPump.tsx:36` `const SIZE = 240;`
  - `FontWeightPump.tsx:37` `const CY = 505; // 主字行中心（略高于画面中心，给下方副标题与音序器让位）`
  - `FontWeightPump.tsx:38` `const W_REST = 250; // 静止字重（细）`
  - `FontWeightPump.tsx:39` `const W_PEAK = 900;`
  - `FontWeightPump.tsx:40` `const W_FINAL = 780; // drop 后定格字重`
  - `FontWeightPump.tsx:41` `const DECAY = 9; // 中心字衰减窗`
  - `FontWeightPump.tsx:42` `const SPREAD = 1.6; // 每离中心一字，衰减窗多 1.6f`
  - `FontWeightPump.tsx:43` `const ECHO_IN = 64;`
  - `FontWeightPump.tsx:44` `const ECHO_DY = 0.85 * SIZE; // 回声行距`
  - `FontWeightPump.tsx:45` `const LAG = 2; // 回声比主字晚 2f`
  - `FontWeightPump.tsx:79` `const CENTER = (CHARS.length - 1) / 2;`
  - `FontWeightPump.tsx:80` `const GRAD = (i: number) => mixRgb(L.accent, L.accent2, i / (CHARS.length - 1)); // drop 后的紫→粉渐变（逐字取色）`
- 卡片参数:
  - `type-rhythm-sync.md:5` `时长: A FontWeightPump 165f / B KaraokeFillSync 150f；A 128 BPM 每拍 14f、衰减窗 9–13f，B 每词按语速 18–33f`
  - `type-rhythm-sync.md:21` `| A font-weight-pump 字重脉冲 | 命中帧细体字瞬间撑成黑体（可变字重连续插值），9–13f 衰减弹回；重音拍额外撑宽 6%；第 2 小节长出上下描边回声行跟拍，drop 拍落定成粗体渐变海报 | 音乐驱动的高能段；标题当低音炮 |`
  - `type-rhythm-sync.md:27` `| A 脉冲包络 | 'env=(1−t/D)^0.8'（t=命中后帧数；demo 逐字中心 9f→边缘 13f 错开回弹，≥D 精确归 0）；fontWeight '250+650·env' 连续插值（SF Pro 可变字重）；每个字钉在 **900 字重**排好的槽位里——静止时细体字间留缝、命中时笔画撑满槽位"合拢"，整行不重排；无可变字体时退回 env>0.15 窗口 300↔900 跳变 + '-webkit-text-str...`
  - `type-rhythm-sync.md:28` `| A 节拍 | 128 BPM 每 14f 一拍（16/30/…/114）+ 第 9 拍 drop（128f）；每小节第 1 拍重音 'scaleX = 1+0.06·env' 并染粉；drop 冲到 900 后不回细，~16f 回落定格在 780 字重 + 紫→粉逐字渐变 + 一道横向光带 | 拍距必须 > 最长衰减窗（14>13），两拍重叠读作抽搐 |`
  - `type-rhythm-sync.md:29` `| A 回声行 | 第 2 小节起上下各一行 2px 描边同字，晚 2f 跟拍脉冲、每拍被推开 26px（drop 推开 60px 后归位） | 递进靠"加层"而不是加大幅度；第 1 小节就上回声，后面没牌可打 |`
  - `type-rhythm-sync.md:30` `| A 节拍参照物 | 画面下方 8+1 格步进音序器（两小节 + DROP 格），命中哪拍哪格亮起放大 12%，已过的格保留暗亮 | 静音环境（预览/静帧）没有这排格子就读不出"在跟拍"；只让格子和字动，不做整画面逐拍泵 |`
  - `type-rhythm-sync.md:31` `| B 词级时间表 | 逐词 [start,end] 帧区间，词内 linear 填充；词间留 4–10f 停顿（换气） | 时间戳实战来自旁白打点表；均匀分配读作机器朗读 |`
  - `type-rhythm-sync.md:32` `| B 词级时间表（demo） | FRAME 20–38、MOTION 42–75（长词慢读）、CRAFT 85–103、SHOTS 107–130；0–19f 预备、130–149f 真静止 | 长词给更长的读窗，读作真人语速 |`
  - `type-rhythm-sync.md:33` `| B 填色实现 | 每词双层同文本叠放：底层浅灰（13% 透明墨色）+ 上层按进度揭开：'mask-image: linear-gradient(90deg, #000 e−4%, transparent e+4%)'，e=p·108−4（±4% 柔边前沿；硬切可用 'clipPath: inset(0 (1−p)·100% 0 0)'）；正在读的词填强调色，读完 10f 退成主墨色 | 逐词独立叠层免量测词宽占比；整行单层 clip...`
  - `type-rhythm-sync.md:34` `| B 读指 | 活跃词下 8px 圆角下划线（demo 用强调色），宽度 = p·100%；读完 6f 从左往右收掉 | 4px 浅灰在 1080p 缩略下不可见（本批实渲踩坑）；读完的词不留线 |`
  - `type-rhythm-sync.md:35` `| B 旁白参照物 | 标语下方 48 根竖条旁白波形：读词处起伏、换气处回落，已播部分染强调色 | 静音预览/静帧没有这条波形就读不出"在跟读" |`
  - `type-rhythm-sync.md:36` `| 收尾 | A 末拍衰减归零后 / B 末词填完后真静止 ≥20f | R1 呼吸判例 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 节奏或收尾只给首页最后一屏, 不做成组件默认态.

### demos/typography/type-rhythm-sync/KaraokeFillSync

- 镜头卡: `references/shots/typography/type-rhythm-sync.md`
- 时长: 150 帧 / 5000 ms, `DURATION` 于第 16 行
- 分镜:
  - `KaraokeFillSync.tsx:16` `export const KARAOKE_FILL_SYNC_DURATION = 150;`
  - `KaraokeFillSync.tsx:31` `const SIZE = 150;`
  - `KaraokeFillSync.tsx:32` `const FEATHER = 4; // 揭开前沿柔边（%）`
  - `KaraokeFillSync.tsx:33` `const ACC = [91, 99, 211]; // G.accent`
  - `KaraokeFillSync.tsx:34` `const INK = [23, 24, 28]; // G.ink1`
  - `KaraokeFillSync.tsx:41` `const p = interpolate(frame, [word.start, word.end], [0, 1], {`
  - `KaraokeFillSync.tsx:79` `const BARS = 48;`
  - `KaraokeFillSync.tsx:80` `const WAVE_W = 560;`
  - `KaraokeFillSync.tsx:81` `const WAVE_T0 = 14;`
  - `KaraokeFillSync.tsx:82` `const WAVE_T1 = 136;`
- 卡片参数:
  - `type-rhythm-sync.md:5` `时长: A FontWeightPump 165f / B KaraokeFillSync 150f；A 128 BPM 每拍 14f、衰减窗 9–13f，B 每词按语速 18–33f`
  - `type-rhythm-sync.md:21` `| A font-weight-pump 字重脉冲 | 命中帧细体字瞬间撑成黑体（可变字重连续插值），9–13f 衰减弹回；重音拍额外撑宽 6%；第 2 小节长出上下描边回声行跟拍，drop 拍落定成粗体渐变海报 | 音乐驱动的高能段；标题当低音炮 |`
  - `type-rhythm-sync.md:27` `| A 脉冲包络 | 'env=(1−t/D)^0.8'（t=命中后帧数；demo 逐字中心 9f→边缘 13f 错开回弹，≥D 精确归 0）；fontWeight '250+650·env' 连续插值（SF Pro 可变字重）；每个字钉在 **900 字重**排好的槽位里——静止时细体字间留缝、命中时笔画撑满槽位"合拢"，整行不重排；无可变字体时退回 env>0.15 窗口 300↔900 跳变 + '-webkit-text-str...`
  - `type-rhythm-sync.md:28` `| A 节拍 | 128 BPM 每 14f 一拍（16/30/…/114）+ 第 9 拍 drop（128f）；每小节第 1 拍重音 'scaleX = 1+0.06·env' 并染粉；drop 冲到 900 后不回细，~16f 回落定格在 780 字重 + 紫→粉逐字渐变 + 一道横向光带 | 拍距必须 > 最长衰减窗（14>13），两拍重叠读作抽搐 |`
  - `type-rhythm-sync.md:29` `| A 回声行 | 第 2 小节起上下各一行 2px 描边同字，晚 2f 跟拍脉冲、每拍被推开 26px（drop 推开 60px 后归位） | 递进靠"加层"而不是加大幅度；第 1 小节就上回声，后面没牌可打 |`
  - `type-rhythm-sync.md:30` `| A 节拍参照物 | 画面下方 8+1 格步进音序器（两小节 + DROP 格），命中哪拍哪格亮起放大 12%，已过的格保留暗亮 | 静音环境（预览/静帧）没有这排格子就读不出"在跟拍"；只让格子和字动，不做整画面逐拍泵 |`
  - `type-rhythm-sync.md:31` `| B 词级时间表 | 逐词 [start,end] 帧区间，词内 linear 填充；词间留 4–10f 停顿（换气） | 时间戳实战来自旁白打点表；均匀分配读作机器朗读 |`
  - `type-rhythm-sync.md:32` `| B 词级时间表（demo） | FRAME 20–38、MOTION 42–75（长词慢读）、CRAFT 85–103、SHOTS 107–130；0–19f 预备、130–149f 真静止 | 长词给更长的读窗，读作真人语速 |`
  - `type-rhythm-sync.md:33` `| B 填色实现 | 每词双层同文本叠放：底层浅灰（13% 透明墨色）+ 上层按进度揭开：'mask-image: linear-gradient(90deg, #000 e−4%, transparent e+4%)'，e=p·108−4（±4% 柔边前沿；硬切可用 'clipPath: inset(0 (1−p)·100% 0 0)'）；正在读的词填强调色，读完 10f 退成主墨色 | 逐词独立叠层免量测词宽占比；整行单层 clip...`
  - `type-rhythm-sync.md:34` `| B 读指 | 活跃词下 8px 圆角下划线（demo 用强调色），宽度 = p·100%；读完 6f 从左往右收掉 | 4px 浅灰在 1080p 缩略下不可见（本批实渲踩坑）；读完的词不留线 |`
  - `type-rhythm-sync.md:35` `| B 旁白参照物 | 标语下方 48 根竖条旁白波形：读词处起伏、换气处回落，已播部分染强调色 | 静音预览/静帧没有这条波形就读不出"在跟读" |`
  - `type-rhythm-sync.md:36` `| 收尾 | A 末拍衰减归零后 / B 末词填完后真静止 ≥20f | R1 呼吸判例 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 节奏或收尾只给首页最后一屏, 不做成组件默认态.

### demos/typography/typewriter-moves/TypewriterErrorRetype

- 镜头卡: `references/shots/typography/typewriter-moves.md`
- 时长: 160 帧 / 5333 ms, `DURATION` 于第 16 行
- 分镜:
  - `TypewriterErrorRetype.tsx:16` `export const TYPEWRITER_ERROR_RETYPE_DURATION = 160;`
  - `TypewriterErrorRetype.tsx:18` `const TEXT1 = 'just a slideshow'; // 16 chars`
  - `TypewriterErrorRetype.tsx:19` `const KEEP = 5; // "just " 保留`
  - `TypewriterErrorRetype.tsx:20` `const DEL = TEXT1.length - KEEP; // 11 chars 待删`
  - `TypewriterErrorRetype.tsx:21` `const TEXT2 = 'your cinematic crew'; // 19 chars`
  - `TypewriterErrorRetype.tsx:23` `const T1 = 2; // 第一遍打字起点，2f/字符`
  - `TypewriterErrorRetype.tsx:24` `const PAUSE_START = T1 + (TEXT1.length - 1) * 2; // f32 打完`
  - `TypewriterErrorRetype.tsx:25` `const DS = PAUSE_START + 16; // f48 开删，1.5f/字符`
  - `TypewriterErrorRetype.tsx:26` `const RS = 68; // 重打起点，1.5f/字符（删完 f64.5 后小顿 3.5f）`
  - `TypewriterErrorRetype.tsx:27` `const TYPE2_END = RS + (TEXT2.length - 1) * 1.5; // f95 打完`
  - `TypewriterErrorRetype.tsx:28` `const CURSOR_OFF = 115; // 两个 10f 闪烁周期后熄灭（最后一次视觉变化 f110）`
  - `TypewriterErrorRetype.tsx:30` `const SIZE = 100; // 字号`
  - `TypewriterErrorRetype.tsx:31` `const CHAR_W = 60; // 等宽字体 100px 的字符宽（0.6em）`
  - `TypewriterErrorRetype.tsx:32` `const LEFT = (1920 - 24 * CHAR_W) / 2; // 最终句 24 字符整体居中，打字过程左缘锚定不横移`
  - `TypewriterErrorRetype.tsx:33` `const HL_START = 96; // 马克笔底色起：打完即铺，和完稿两闪同时，f110 前铺完`
  - `TypewriterErrorRetype.tsx:34` `const HL_DUR = 14;`
  - `TypewriterErrorRetype.tsx:35` `const HL_FROM = 10; // "cinematic crew" 起始字符序号（最终句 "just your cinematic crew" 第 10 字符起）`
  - `TypewriterErrorRetype.tsx:36` `const HL_LEN = 14;`
- 卡片参数:
  - `typewriter-moves.md:5` `时长: ~5.3s（160f）`
  - `typewriter-moves.md:20` `| A error-retype | 打 2f/字符 → 停顿 16f 光标闪两下 → 退 1.5f/字符 → 重打 1.5f/字符无犹豫；光标打删常亮、停顿才闪 | slogan 字卡的"改口"戏；否定式文案 |`
  - `typewriter-moves.md:25` `| 字符节奏 | substring(0, floor((f-起点)/步长))，帧确定无插值 | 任何缓动打字都读作加载动画 |`
  - `typewriter-moves.md:26` `| 三档速度 | 打 2f/字符、删 1.5f、重打 1.5f 且零犹豫 | 三档差必须可感——等速改口读作 bug 不是戏，命门 |`
  - `typewriter-moves.md:27` `| 光标三态 | 打删常亮＝果断；停顿 4f 半周期闪两下＝犹豫；完稿闪两下后条件摘除 | 光标就是演员的脸，全程等速闪就没有"犹豫" |`
  - `typewriter-moves.md:28` `| 排版 | 逐字符固定宽 span（60px 等宽槽），左缘锚定 | 变宽字体/整串测宽会逐帧重排抖动 |`
  - `typewriter-moves.md:29` `| 收尾 | 静止 ≥50f | 光标残留 0.05 opacity 都毁真静止 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 节奏或收尾只给首页最后一屏, 不做成组件默认态.

### demos/typography/vertical-word-roll-blur-cycle/VerticalWordRollBlurCycle

- 镜头卡: `references/shots/typography/vertical-word-roll-blur-cycle.md`
- 时长: 150 帧 / 5000 ms, `DURATION` 于第 12 行
- 分镜:
  - `VerticalWordRollBlurCycle.tsx:12` `export const VERTICAL_WORD_ROLL_BLUR_CYCLE_DURATION = 150; // 5000ms @30fps`
  - `VerticalWordRollBlurCycle.tsx:14` `const ROW = 44;`
  - `VerticalWordRollBlurCycle.tsx:17` `const STEPS = [0.16, 0.36, 0.56];`
  - `VerticalWordRollBlurCycle.tsx:19` `const ACCENT = '#5b63d3';`
  - `VerticalWordRollBlurCycle.tsx:20` `const ACCENT_DIM = '#B9B9BE';`
  - `VerticalWordRollBlurCycle.tsx:21` `const INK = '#17181c';`
  - `VerticalWordRollBlurCycle.tsx:41` `const DT = 0.5 / (VERTICAL_WORD_ROLL_BLUR_CYCLE_DURATION - 1); // 半帧对应的 t`
- 卡片参数:
  - `vertical-word-roll-blur-cycle.md:5` `时长: 约 5.0s（150f@30fps：静置 → 3 次换词 → 尾部整组淡出）`
  - `vertical-word-roll-blur-cycle.md:18` `（≈16f，约 0.55s），段间留 0.09 静置给观众读词`
  - `vertical-word-roll-blur-cycle.md:35` `| 拍点 | '[0.16, 0.36, 0.56]'，窗 0.11（≈16f） | 段间 0.09（≈13f）静置是给读词的，读不完的拍子等于没换；窗 >0.18 新旧同屏太久 |`
  - `vertical-word-roll-blur-cycle.md:41` `| 收尾淡出 | 'seg(t, 0.9, 0.985)' 整组 | 末词落定后约 40f 静置再淡出；不 hold 等于白列举 |`
  - `vertical-word-roll-blur-cycle.md:54` `- 'p' 是三段窗**累加**出来的，所以三段窗不能重叠：重叠会让 p 在一帧内`
- 可逆: 没有帧采样. 当静态夹具.
- 裁决: 只留规则. 节奏或收尾只给首页最后一屏, 不做成组件默认态.

### demos/typography/word-relay-filmstrip/WordRelayFilmstrip

- 镜头卡: `references/shots/typography/word-relay-filmstrip.md`
- 时长: 180 帧 / 6000 ms, `DURATION` 于第 29 行
- 分镜:
  - `WordRelayFilmstrip.tsx:29` `export const WORD_RELAY_FILMSTRIP_DURATION = 180;`
  - `WordRelayFilmstrip.tsx:33` `const CARD_W = 940;`
  - `WordRelayFilmstrip.tsx:34` `const CARD_H = 530;`
  - `WordRelayFilmstrip.tsx:35` `const GAP = 105;`
  - `WordRelayFilmstrip.tsx:287` `const NOTES = ['Storyboard · 12 shots on the beat', 'Render #1284 · 1080p30 · 1m 42s', 'PR #482 · approved · launch film'];`
  - `WordRelayFilmstrip.tsx:288` `const SWITCHES = [16, 66, 114];`
  - `WordRelayFilmstrip.tsx:289` `const SW_DUR = 18;`
  - `WordRelayFilmstrip.tsx:290` `const SERIF = '"Didot", "Bodoni 72", "Playfair Display", Georgia, serif';`
  - `WordRelayFilmstrip.tsx:291` `const FS = 140;`
  - `WordRelayFilmstrip.tsx:292` `const LINE = Math.round(FS * 1.1); // 154：每行行盒`
  - `WordRelayFilmstrip.tsx:293` `const WX = 1196; // 词块左缘`
  - `WordRelayFilmstrip.tsx:294` `const BLOCK_TOP = 540 - LINE; // 两行词块中心 = 540`
  - `WordRelayFilmstrip.tsx:295` `const CARD_L = 100;`
  - `WordRelayFilmstrip.tsx:296` `const FOCUS_TOP = 540 - CARD_H / 2; // 275`
  - `WordRelayFilmstrip.tsx:358` `const IN_AT = SWITCHES.map((s) => s + 7); // 新词在切点后 7f 起升（旧词先出）`
  - `WordRelayFilmstrip.tsx:365` `const LX0 = CARD_L + CARD_W + 14;`
  - `WordRelayFilmstrip.tsx:366` `const LX1 = WX - 40;`
- 卡片参数:
  - `word-relay-filmstrip.md:5` `时长: 每词期 ~1.5–2s × 3–4 词；demo 180f（6s）`
  - `word-relay-filmstrip.md:20` `黑白（深浅）强制相间以显滚动步进；切词窗口内 18f 不对称 in-out（EASE.swift）滚动恰好一卡高，`
  - `word-relay-filmstrip.md:25` `旧词 10f 灰化 → 切点起 8f ease-in 从遮罩上沿升出（先出），新词切点 +7f 起逐字母从遮罩下沿升起`
  - `word-relay-filmstrip.md:26` `（1.2f 错峰，金色句点最后到，后进），先出后进不许叠影（判例：v2 叠影"resebuilds"被抓）`
  - `word-relay-filmstrip.md:27` `- 金色引线：从焦点卡右缘指向词块中线 y=540，切词起 6f 收回、切点 +10f 后 16f 重画；`
  - `word-relay-filmstrip.md:37` `| 词期 | ~45–60f/词 | <40f 读不完词+胶片看不清；词期不必均匀 |`
  - `word-relay-filmstrip.md:38` `| 滚动窗口 | ~16–18f 不对称 in-out，恰一卡高 | 持续滚动=命门违例；滚过头/不足读作机械故障 |`
  - `word-relay-filmstrip.md:39` `| 词接力 | 旧词灰化后 8f 升出 → 切点 +7f 新词逐字母升起（16f/字母，1.2f 错峰） | 同帧交叉必叠影；间隙 >10f 读作断片 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 节奏或收尾只给首页最后一屏, 不做成组件默认态.

### demos/typography/word-relay-geometry/WordRelayGeometry

- 镜头卡: `references/shots/typography/word-relay-geometry.md`
- 时长: 180 帧 / 6000 ms, `DURATION` 于第 31 行
- 分镜:
  - `WordRelayGeometry.tsx:31` `export const WORD_RELAY_GEOMETRY_DURATION = 180; // 6000ms @30fps`
  - `WordRelayGeometry.tsx:36` `const CX = W / 2;`
  - `WordRelayGeometry.tsx:37` `const CY = 500; // 视觉中心略高于几何中心，给副句留位`
  - `WordRelayGeometry.tsx:38` `const WORD_SIZE = 230;`
  - `WordRelayGeometry.tsx:40` `const GEO = 'rgba(236,238,244,0.42)'; // 几何线：比字暗一档，层级在字之下`
  - `WordRelayGeometry.tsx:41` `const GOLD = L.accent2;`
  - `WordRelayGeometry.tsx:67` `const RT = 452;`
  - `WordRelayGeometry.tsx:149` `const FE = 7;`
- 卡片参数:
  - `word-relay-geometry.md:5` `时长: 约 6.0s（180f@30fps：三段各 ≈60f，段间重叠 6f）`
  - `word-relay-geometry.md:6` `能量: 中高（三拍推进 + 全程几何运动 + 背景粒子，无静止帧）`
  - `word-relay-geometry.md:18` `- 三段按帧排：Faster 2→62、Tighter 56→122、Stronger 116→180；每段入场 14f（snappy，`
  - `word-relay-geometry.md:19` `'scale 1.06→1' + 10px 去虚）、出场 10f（exit 强 ease-in，'scale 1→0.86' + 12px 退焦），`
  - `word-relay-geometry.md:20` `交接重叠 6f 是交棒而非硬切；末段无出场，收白后 hold 22f`
  - `word-relay-geometry.md:24` `- 前两词的填充是 ±7% 柔边 'mask-image' 横向擦入（入场后 10f 起、18f，swift），描边层透明度`
  - `word-relay-geometry.md:27` `入场 22f 从 0.4 snappy 长到 1，同时多转 160° 减速刹住（飞轮感），之后匀速慢转永不停；一道 16 段`
  - `word-relay-geometry.md:28` `渐隐的白色彗星弧沿 r=400 以 7.5°/帧飞跑——"快"由两层相对转速 + 彗星的速度差读出`
  - `word-relay-geometry.md:30` `'rotate(-90 cx 0)'，延迟 0/6/12f、各 22f（out），笔头一粒发光点长满即熄；92f 起三圆间距`
  - `word-relay-geometry.md:31` `340→300 收拢 14f（swift），落定时圆线提亮一次、四个相交点亮起菱形铆钉光点（overshoot 弹出）`
  - `word-relay-geometry.md:33` `- Stronger 无几何：120f 起描边 → 竖向镀铬渐变（亮顶—暗腰—亮底）；124→148f 一道带香槟暖色的`
  - `word-relay-geometry.md:34` `窄白带（'100deg'、'background-size:300%'）从左扫到右；146→158f 收成纯白 + 一次泛光脉冲，`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 只留规则. 节奏或收尾只给首页最后一屏, 不做成组件默认态.

### demos/ui-entrance/avatar-bracket-carousel/AvatarBracketCarousel

- 镜头卡: `references/shots/ui-entrance/avatar-bracket-carousel.md`
- 时长: 156 帧 / 5200 ms, `DURATION` 于第 12 行
- 分镜:
  - `AvatarBracketCarousel.tsx:12` `export const AVATAR_BRACKET_CAROUSEL_DURATION = 156; // 5200ms @30fps`
  - `AvatarBracketCarousel.tsx:15` `const ACCENT = '#7b83f2';`
  - `AvatarBracketCarousel.tsx:56` `const CORNERS = ['M4,26 L4,4 L26,4', 'M66,4 L88,4 L88,26', 'M88,66 L88,88 L66,88', 'M26,88 L4,88 L4,66'];`
  - `AvatarBracketCarousel.tsx:58` `const CORNER_DIR = [[-1, -1], [1, -1], [1, 1], [-1, 1]];`
  - `AvatarBracketCarousel.tsx:60` `const STEP = 76;`
  - `AvatarBracketCarousel.tsx:61` `const SWITCHES = [0.24, 0.46, 0.68]; // 三次切换起点`
  - `AvatarBracketCarousel.tsx:70` `p += seg(tt, s0, s0 + 0.14, (k) => E.spring(k, 0.25));`
- 卡片参数:
  - `avatar-bracket-carousel.md:3` `一句话: "Your ___ agent" 填空排版，四角对焦框钉在句中不动，头像队列在框内垂直 spring 轮换三次，入框放大清晰、出框按距离缩小淡化模糊，角色标签同步更换，切换瞬间对焦框呼吸 7%`
  - `avatar-bracket-carousel.md:5` `时长: 约 5.2s（156f@30fps）`
  - `avatar-bracket-carousel.md:16` `- 位置量 'pos' 是三段 spring 的累加：'[0.24, 0.46, 0.68].forEach(s0 => pos +=`
  - `avatar-bracket-carousel.md:17` `seg(t, s0, s0+0.14, k => E.spring(k, 0.25)))'——不是索引跳变，而是连续量，所以任意`
  - `avatar-bracket-carousel.md:34` `| 切换点 | 0.24 / 0.46 / 0.68，间隔 0.22（≈34f / 1.14s） | 间隔就是"读得完一个角色"的时长；<0.12 观众来不及看标签，>0.3 节拍器感散掉 |`
  - `avatar-bracket-carousel.md:35` `| 切换行程 | 窗 0.14（≈22f），'E.spring(k, 0.25)' | 行程占间隔的 64% → 静置时间约 12f；阻尼 0.25 是明确一次回弹，调小会抖两下与相邻切换互相干扰 |`
- 可逆: 没有帧采样. 当静态夹具.
- 裁决: 首页采用或只留规则. 一镜一个主角, 飞入必须落进真实槽位.

### demos/ui-entrance/bezier-source-converge-merge/BezierSourceConvergeMerge

- 镜头卡: `references/shots/ui-entrance/bezier-source-converge-merge.md`
- 时长: 168 帧 / 5600 ms, `DURATION` 于第 15 行
- 分镜:
  - `BezierSourceConvergeMerge.tsx:15` `export const BEZIER_SOURCE_CONVERGE_MERGE_DURATION = 168; // 5600ms @30fps`
  - `BezierSourceConvergeMerge.tsx:19` `const TXT = '#17181c'; // 主文字近黑（带冷调）`
  - `BezierSourceConvergeMerge.tsx:20` `const DIM = '#c4c6cc'; // 浅灰占位字`
  - `BezierSourceConvergeMerge.tsx:21` `const LINE = 'rgba(20,22,28,0.09)'; // 发丝描边`
  - `BezierSourceConvergeMerge.tsx:22` `const ACCENT = '#5b63d3'; // 唯一强调色（与 fixture G.accent 一致）`
  - `BezierSourceConvergeMerge.tsx:23` `const ACCENT_HI = '#7d84ea';`
  - `BezierSourceConvergeMerge.tsx:33` `const XC = 332, YC = 120; // 汇聚点`
  - `BezierSourceConvergeMerge.tsx:86` `const SAMPLES = 1600;`
  - `BezierSourceConvergeMerge.tsx:87` `const LINE_LEN = 96;`
  - `BezierSourceConvergeMerge.tsx:122` `const CAP_ST = 0.78 / CAP_WORDS.length;`
  - `BezierSourceConvergeMerge.tsx:123` `const CAP_WIN = CAP_ST * 1.5;`
  - `BezierSourceConvergeMerge.tsx:126` `const BADGE_SIZE = 46; // 汇聚点白瓷圆片直径（= 接收涟漪的起始直径），略大于 44 的来源节点`
  - `BezierSourceConvergeMerge.tsx:127` `const MARK_SIZE = 34; // 标志 viewBox 128 内实形约占 81%，34 → 实形 ≈28，四周留足安全空间`
  - `BezierSourceConvergeMerge.tsx:130` `const TAIL = 9;`
  - `BezierSourceConvergeMerge.tsx:131` `const TAIL_GAP = 0.0055;`
  - `BezierSourceConvergeMerge.tsx:134` `const SHIFT = 352 - 240;`
- 卡片参数:
  - `bezier-source-converge-merge.md:2` `name: bezier-source-converge-merge`
  - `bezier-source-converge-merge.md:5` `时长: 约 5.6s（168f@30fps）`
  - `bezier-source-converge-merge.md:39` `| draw-on | 起点 '0.04+i*0.045'，窗 0.17，outQuad | 0.045 的错峰约 7f；归零会读作四条线一起刷出，失去"逐路接通"的语义 |`
  - `bezier-source-converge-merge.md:42` `| 数据包周期 | 2 个整数周期（0.1→0.74 线性） | 必须是整数周期，否则末帧包停在半路；周期加密到 4 会读作数据流很急，也更容易和节点重叠 |`
  - `bezier-source-converge-merge.md:44` `| 擦除 | 0.78→0.9，dashoffset 取负 | 12f 完成；擦除必须在节点全部消失（conv=0.74 结束、节点 0.92 前淡完）之后，否则线先没了节点悬在空中 |`
  - `bezier-source-converge-merge.md:49` `代码用 'ready' 标志在首帧 'prime()' 里做——移植到 Remotion 时首帧渲染可能拿不到`
  - `bezier-source-converge-merge.md:51` `常量表，否则首帧会出现一次错位跳变`
  - `bezier-source-converge-merge.md:66` `demos/ui-entrance/bezier-source-converge-merge/`
  - `bezier-source-converge-merge.md:67` `（BezierSourceConvergeMerge.tsx）`
- 可逆: 没有帧采样. 当静态夹具.
- 裁决: 首页采用或只留规则. 一镜一个主角, 飞入必须落进真实槽位.

### demos/ui-entrance/card-stack/CardStack

- 镜头卡: `references/shots/ui-entrance/card-stack.md`
- 时长: 150 帧 / 5000 ms, `DURATION` 于第 28 行
- 分镜:
  - `CardStack.tsx:11` `//   展开前 6f 预备（整摞收紧 2%），展开用低阻尼弹簧（damping 20）带一点惯性落定；相机同段拉远到 0.88。`
  - `CardStack.tsx:16` `//   2–42    9 张卡依次起跳（错峰 40f，越来越快），各自 spring（damping 13）≈20f 落座，落座时整摞下压 5px`
  - `CardStack.tsx:19` `//   68–100  扇形展开（弹簧 damping 20，轻微过冲一次），相机 1.06→0.88 拉远（smooth 64–106）`
  - `CardStack.tsx:28` `export const CARD_STACK_DURATION = 150; // 5000ms @30fps`
  - `CardStack.tsx:32` `const CW = 320;`
  - `CardStack.tsx:33` `const CH = 440;`
  - `CardStack.tsx:34` `const CX = 960;`
  - `CardStack.tsx:35` `const CY = 610; // 卡片中心`
  - `CardStack.tsx:36` `const ROT = 6.5; // 扇面每张偏转（°）`
  - `CardStack.tsx:37` `const TX = 138; // 扇面每张横移（px）`
  - `CardStack.tsx:38` `const FEATURED = 4;`
  - `CardStack.tsx:59` `// 入场：起跳帧按"越来越快"分布（EASE.out 映射 = 前面间隔大、后面间隔小）；spring 0→1（damping 13 = 一次可见回弹）`
  - `CardStack.tsx:60` `const START = Array.from({ length: N }, (_, i) => 2 + stagger(i, N, 40, EASE.out));`
  - `CardStack.tsx:61` `const inAt = (f: number, i: number) => (f < START[i] ? 0 : springAt(f, START[i], { damping: 13, stiffness: 150 }));`
  - `CardStack.tsx:62` `const DROP = 820; // 起点在画框下方`
  - `CardStack.tsx:69` `const fan = f < 68 ? 0 : springAt(f, 68, { damping: 20, stiffness: 95 });`
  - `CardStack.tsx:167` `const COVER_H = 256;`
- 卡片参数:
  - `card-stack.md:3` `一句话: 一组模板卡（demo 9 张）从屏幕下方逐张 spring 弹入、越落越快叠成一摞，全员落位后整摞一次性展成扇面——每张按序号偏转 6.5°、横移 138px，最后中心卡被抽出`
  - `card-stack.md:5` `时长: 约 5.0s（150f@30fps）`
  - `card-stack.md:18` `- 入场：起跳帧 '2 + stagger(i, 9, 40, EASE.out)'——EASE.out 映射让间隔先大后小（砰——砰—砰-砰砰，越来越快）；`
  - `card-stack.md:19` `每张 'springAt(f, start, {damping:13, stiffness:150})'，'y' 从 820px 抬到 0（起点在画框外），≈20f 落座；`
  - `card-stack.md:21` `- 重量：每张落座（起跳后约 6f 越过终点）时整摞被压低 5px（sin 包络 9f）；成摞时确定性 ±3.2° / ±11px 错位，`
  - `card-stack.md:22` `像随手码齐的一摞；展开前 62–72f 整摞收紧 2%（预备）`
  - `card-stack.md:23` `- 扇形：'springAt(f, 68, {damping:20, stiffness:95})' 是唯一的展开时钟（带一次轻微过冲 = 手腕甩开的惯性），`
  - `card-stack.md:28` `- 相机：成摞段 1→1.06 极缓推近给"一摞"分量，展开同段（64→106f）拉远到 0.88 让扇面完整入画；`
  - `card-stack.md:31` `标题 "Start from a shot recipe."（88px）逐词升起、副句跟随，hold 28f`
  - `card-stack.md:37` `| 入场 stagger | 40f 跨度，EASE.out 分布 | 越来越快是"一串"的手感；等差分布读作逐张点名，<20f 读作一团一起冒 |`
  - `card-stack.md:38` `| 入场行程 | y 820→0，spring damping 13 | 起点必须在画框外；damping <10 回弹两次以上，成组时抖动互相干扰 |`
  - `card-stack.md:39` `| 落座下压 | 5px，sin 9f | 这是"有分量"的来源；>10px 整摞像弹簧床 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 首页采用或只留规则. 一镜一个主角, 飞入必须落进真实槽位.

### demos/ui-entrance/carousel-3d/Carousel3D

- 镜头卡: `references/shots/ui-entrance/carousel-3d.md`
- 时长: 168 帧 / 5600 ms, `DURATION` 于第 22 行
- 分镜:
  - `Carousel3D.tsx:22` `export const CAROUSEL_3D_DURATION = 168; // 5600ms @30fps`
  - `Carousel3D.tsx:26` `const RADIUS = 700;`
  - `Carousel3D.tsx:27` `const CW = 340;`
  - `Carousel3D.tsx:28` `const CH = 460;`
  - `Carousel3D.tsx:29` `const RING_Y = 470; // 环中心高度`
  - `Carousel3D.tsx:30` `const FLOOR = CH / 2 + 10; // 卡脚下的地面（相对环中心）`
  - `Carousel3D.tsx:31` `const BEAT = 21; // 每步帧数 = 停靠 + 换位`
  - `Carousel3D.tsx:32` `const DWELL = 8;`
- 卡片参数:
  - `carousel-3d.md:5` `时长: 约 5.6s（168f@30fps）`
  - `carousel-3d.md:13` `不会有任何一帧出现镜像或倒置。`
  - `carousel-3d.md:22` `- 转角不是死匀速：'turn = 0.5·f/168 + 0.5·stepPart(f)'，'stepPart' 每 21f 一步（8f 停靠 + 13f smooth 换位）。`
  - `carousel-3d.md:23` `匀速底让整环永远在走（loop 稳态），分步层每 45° 给一次"推一把—停靠"；8 步 × 21f = 168f 正好一圈，`
  - `carousel-3d.md:24` `f=168 时 turn=1，首尾帧逐像素可接`
  - `carousel-3d.md:30` `- 相机固定，一帧都不动：'perspective: 2200px'，环容器 'translateZ(-RADIUS) rotateX(-9deg)'——`
  - `carousel-3d.md:41` `| 转速构成 | 50% 匀速 + 50% 分步（21f/步，停靠 8f） | 分步比例 >70% 停靠时整环几乎停住，loop 读出"卡顿"；<30% 停靠感消失，又回到平的匀速 |`
  - `carousel-3d.md:42` `| 圈数 | 全片 1 圈（8 步） | 圈数与步数都必须是整数才能 loop；非整数则末帧跳变 |`
  - `carousel-3d.md:51` `- 每帧都重设了 8 张卡的 transform（'rotateY(i*45) translateZ(RADIUS + 44·hl)'）——旋转分量恒定，`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 首页采用或只留规则. 一镜一个主角, 飞入必须落进真实槽位.

### demos/ui-entrance/clipcard-looping/ClipCardLooping

- 镜头卡: 无
- 时长: 120 帧 / 4000 ms, `DURATION` 于第 17 行
- 分镜:
  - `ClipCardLooping.tsx:7` `//   3) 短 Sequence 嵌在长 Composition 里——层数按 shot 时长(durationInFrames prop)`
  - `ClipCardLooping.tsx:17` `export const CLIPCARD_LOOPING_DURATION = 120; // 4s @30fps`
  - `ClipCardLooping.tsx:18` `const CLIP = 'clips/clipcard-demo.mp4';`
  - `ClipCardLooping.tsx:39` `durationInFrames={120}`
  - `ClipCardLooping.tsx:51` `durationInFrames={120}`
  - `ClipCardLooping.tsx:58` `{/* 场景 3：短 Sequence(120f)嵌进长 Composition(未传 durationInFrames,`
  - `ClipCardLooping.tsx:60` `这里用 Sequence 包一层模拟"短 shot 长工程"的结构) */}`
  - `ClipCardLooping.tsx:61` `<Sequence name="short-shot" from={0} durationInFrames={120} layout="none">`
  - `ClipCardLooping.tsx:68` `durationInFrames={120}`
  - `ClipCardLooping.tsx:74` `</Sequence>`
- 卡片参数:
  - 无对应镜头卡
- 可逆: 没有帧采样. 当静态夹具.
- 裁决: 首页采用或只留规则. 一镜一个主角, 飞入必须落进真实槽位.

### demos/ui-entrance/cloner-depth-echo/ClonerDepthEcho

- 镜头卡: `references/shots/ui-entrance/cloner-depth-echo.md`
- 时长: 138 帧 / 4600 ms, `DURATION` 于第 29 行
- 分镜:
  - `ClonerDepthEcho.tsx:17` `//   24–44   排开：7 个克隆 spring 错峰 2.2f/个弹向纵深（damping 15，一次轻过冲），每弹出一个计数 +1，顶栏镜头号同时浮现`
  - `ClonerDepthEcho.tsx:29` `export const CLONER_DEPTH_ECHO_DURATION = 138;`
  - `ClonerDepthEcho.tsx:33` `const GAP_Z = 250; // 相邻克隆的纵深间隔（px）`
  - `ClonerDepthEcho.tsx:34` `const SPREAD = 24; // 排开起始帧`
  - `ClonerDepthEcho.tsx:35` `const EACH = 2.2; // 克隆错峰（帧/个）`
  - `ClonerDepthEcho.tsx:36` `const MERGE = 76; // 吸回起始帧`
  - `ClonerDepthEcho.tsx:37` `const MERGE_DUR = 10;`
  - `ClonerDepthEcho.tsx:38` `const LAND = MERGE + MERGE_DUR; // 合体帧 86`
  - `ClonerDepthEcho.tsx:41` `const CW = 660;`
  - `ClonerDepthEcho.tsx:42` `const CH = 420;`
  - `ClonerDepthEcho.tsx:43` `const CX = 1130; // 左上角`
  - `ClonerDepthEcho.tsx:44` `const CY = 352;`
  - `ClonerDepthEcho.tsx:46` `const PERSP = 1500;`
  - `ClonerDepthEcho.tsx:47` `const VP = { x: 360, y: 120 };`
  - `ClonerDepthEcho.tsx:49` `const TYPE_H1 = 112; // 标题字号（h1 档略收，两行放进左上空位）`
  - `ClonerDepthEcho.tsx:51` `const REGIONS = ['S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07', 'S08']; // 镜头号（沿用原变量名）`
  - `ClonerDepthEcho.tsx:52` `const SPARK = [0.62, 0.58, 0.66, 0.52, 0.55, 0.44, 0.48, 0.36, 0.4, 0.3, 0.33, 0.26, 0.3, 0.22];`
  - `ClonerDepthEcho.tsx:57` `const spreadOf = (f: number, idx: number) => (f < SPREAD + (idx - 1) * EACH ? 0 : springAt(f, SPREAD + (idx - 1) * EACH, { damping: 15, stiffness: 150, mass: 0.9 }));`
- 卡片参数:
  - `cloner-depth-echo.md:5` `时长: 138f（约 4.6s）`
  - `cloner-depth-echo.md:12` `错峰弹出成纵队；停 ~32f 让观众数得清"有很多个"；然后全体 ease-in 加速吸回`
  - `cloner-depth-echo.md:24` `| 排开/吸回 | spring 错峰 2.2f/个（damping 15，一次轻过冲）；吸回强 ease-in 10f 全体同步，按纵深速度加拖影模糊 | 排开要错峰（复印感），吸回要同步（收束感）——节奏不对称是设计 |`
  - `cloner-depth-echo.md:25` `| 停留 | 32f，期间相机极缓推近 2% + 纵队轻微视差漂移 | 停太短数不清"有很多个"，完全静止又是死帧 |`
  - `cloner-depth-echo.md:26` `| 合体 | 主卡 sin 单脉冲 1.06x + 一次强调色描边光（14f 衰减）；同帧镜头位全亮、计数器回弹 | 吸回无弹跳读作淡出；弹跳=质量证据 |`
  - `cloner-depth-echo.md:27` `| 计数 | 左下 260px「×N」，每弹出一个克隆滚一格（5f，出场格上移淡出 + 速度竖向虚化） | 计数让"规模"从画面变成数字；滚动格不要 overflow 裁切，会把泛光裁出方框 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 首页采用或只留规则. 一镜一个主角, 飞入必须落进真实槽位.

### demos/ui-entrance/deck-deal-flyin/DeckDealFlyin

- 镜头卡: `references/shots/ui-entrance/deck-deal-flyin.md`
- 时长: 150 帧 / 5000 ms, `DURATION` 于第 33 行
- 分镜:
  - `DeckDealFlyin.tsx:33` `export const DECK_DEAL_FLYIN_DURATION = 150;`
  - `DeckDealFlyin.tsx:38` `const PAPER = '#f9f6f1';`
  - `DeckDealFlyin.tsx:41` `const BOARD = { x: 352, w: 1216 };`
  - `DeckDealFlyin.tsx:42` `const COLS = [408, 781.328125, 1154.65625];`
  - `DeckDealFlyin.tsx:43` `const CARD_W = 357.328125;`
  - `DeckDealFlyin.tsx:44` `const EXTRA_ROWS = [1795, 2188, 2581, 2974, 3367];`
  - `DeckDealFlyin.tsx:45` `const BOARD_H = PAGE_H + 2036;`
  - `DeckDealFlyin.tsx:56` `const PILE = { x: 1640, y: 250 };`
  - `DeckDealFlyin.tsx:57` `const N_CARDS = 26;`
  - `DeckDealFlyin.tsx:58` `const DEAL_START = 36;`
  - `DeckDealFlyin.tsx:59` `const STACK_STEP = 3;`
  - `DeckDealFlyin.tsx:60` `const PILE_CX = PILE.x + CARD_W / 2;`
  - `DeckDealFlyin.tsx:61` `const PILE_CY = PILE.y + 156;`
  - `DeckDealFlyin.tsx:74` `const HOVER_H = 40;`
  - `DeckDealFlyin.tsx:75` `const SETTLE_EASE = Easing.bezier(0.3, 0, 0.25, 1.15);`
  - `DeckDealFlyin.tsx:76` `const DIVE_EASE = Easing.bezier(0.3, 0, 0.2, 1);`
  - `DeckDealFlyin.tsx:77` `const ANTICIPATE = { from: 26, to: 36, pileDown: 48, topPull: 30 };`
  - `DeckDealFlyin.tsx:132` `const lightUp = interpolate(frame, [34, 64], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.5, 0, 0.6, 1) });`
  - `DeckDealFlyin.tsx:139` `const antT = interpolate(frame, [ANTICIPATE.from, ANTICIPATE.to], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) });`
  - `DeckDealFlyin.tsx:206` `const diveT = interpolate(frame, [cue, cue + 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: DIVE_EASE });`
  - `DeckDealFlyin.tsx:207` `const settleT = interpolate(frame, [cue + 8, cue + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: SETTLE_EASE });`
  - `DeckDealFlyin.tsx:212` `const zDive = interpolate(diveT, [0, 1], [c.pz, HOVER_H]) + arc;`
  - (运动行 24 条, 留前 22 条, 文件 307 行已逐行扫过)
- 卡片参数:
  - `deck-deal-flyin.md:5` `时长: 150f（约 5s：0–36 牌堆特写 + 预备，36–~101 发牌，108–150 满板 hold）`
  - `deck-deal-flyin.md:13` `- 前半（pile-orbit-open，可选）：所有卡叠成有物理高度的实体牌堆，放在页面板旁的暗色拉丝石墨桌面上，顶光只打牌堆，相机侧斜特写绕堆环绕；拉远时"灯"从牌堆处以柔边光圈把暗着的页面板照亮——页面板始终是摆在暗桌上的一块展板，四周暗场贯穿到尾帧`
  - `deck-deal-flyin.md:16` `- 相机追着发牌往板尾走（越来越快），同时升高、后仰、侧转，落在一张跑道式俯瞰：整块板沿对角线伸向远处、26 张卡全部在画，远端压暗做景深；满板后静止 hold（> 0.5s，只留 1.5% 极缓推近），左下升起标语 + mono 计数行（计数跟着落地张数跳）。收尾停顿期各层不同帧停稳——卡体先落定、阴影收敛滞后 ~3f、残影最后消散（拖拽层级，借鉴法则 5；全要素同帧冻结读作机械）`
  - `deck-deal-flyin.md:21` `| orbit 环绕 | 相机关键帧走单调三次 Hermite 样条逐帧展开（关键帧处速度连续，无顿挫）。帧 0→30，rotX 48/rotY −30/rotZ 9/zoom 1.9 绕到 rotX 42/rotY 24/rotZ −6/zoom 1.8，persp 1100 | 特写四件套缺一不可：侧面倾斜角+可感知高度+orbit+反差深色材质（Q7，用户逐项点名） |`
  - `deck-deal-flyin.md:23` `| 石墨桌面 | 4 层叠加：随拉远扩大的顶光 radial + 104deg 宽幅镜面高光带 + 确定性 feTurbulence 各向异性拉丝纹小图平铺（baseFrequency 0.0018×0.62，alpha 0.4）+ 115deg 冷灰渐变；平面向外扩 4000px、远处柔边隐进暗场。页面板（截图内容区 x 352–1568 + 纸面延长）开场被 0.88 暗层盖住，34→64f 以牌堆为圆心柔边光圈揭开；落进未照亮区域...`
  - `deck-deal-flyin.md:24` `| 预备拍 | 首发 cue 前 10f（26→36）：牌堆整体下压 48px（约堆高六成）+ 顶卡向出牌反方向回拉 30px，缓动 easeOut，首发瞬间释放 | **幅度必须过肉眼阈值**：4px/2px 初版用户实测完全无感，放大 12 倍（48/30px）才裁决通过（判例 2026-07-09 进化轮 #2）——渲染后自查"不逐帧能否看出蓄力"，看不出等于没做；帧预算从 orbit 尾段挪，不挤占发牌段 |`
  - `deck-deal-flyin.md:25` `| 发牌节拍 | 第 k 张 cue = 36 + 4k − 0.0792·k(k−1)，间隔 4f 收缩到 0.2f | 均匀间隔立刻显得机械；匀加速不够狠也被否——要"hard-accelerating"级别（R2/B3） |`
  - `deck-deal-flyin.md:27` `| 单卡飞行 | deal 8f（bezier(0.3,0,0.2,1)，z 弧顶 +110px sin、scale 峰值 1.06）+ settle 4f（bezier(0.3,0,0.25,1.15) 轻过冲）+ press 0.996→1 回弹 2f | 落地要弹必须 y1>1 的 bezier；settle+press 合计 6f ≈ 飞行 8f 的 30%——快停配足缓冲（法则 5 比例）；落定后强制 identity tra...`
  - `deck-deal-flyin.md:28` `| 收尾拖拽层级 | rest 段内分层停稳：卡体 press 回弹结束即锁定，落地阴影 '0 32px→0 2px' 收敛滞后卡体 2–4f，飞行残影 opacity 尾梢再拖 3–5f 消散 | 借鉴法则 5 的 drag hierarchy（根→主→次级错帧 2–4f）；0.5s rest 静止判例不变——层级错帧发生在 rest 段头部，rest 末端全部锁死（模式已沉为 assets/lib/helpers/motion.ts...`
  - `deck-deal-flyin.md:30` `| 运动模糊（相机） | 追逐 scroll 等 ≥30px/f 的快速运镜段用 '@remotion/motion-blur' 的 '<CameraMotionBlur shutterAngle={180} samples={10}>' 包镜；用 '<Sequence>' 把包裹范围切到快速段起点，慢速特写段（<10px/f）不包 | 30fps 下相机每帧跳 50–70px 会频闪，快摇拖影是电影摄像机的物理本能；shutterAn...`
  - `deck-deal-flyin.md:31` `| 追逐 + 升起 | 锚点 f62 正视板顶（zoom 0.8，rotX 22）→ f86 板中（zoom 0.56，rotX 38，rotZ −10）→ f110 跑道俯瞰（zoom 0.5，rotX 52，rotY −6，rotZ −26，persp 3300，屏幕右移 300px 给左下标语让位）→ f150 zoom 0.508 | persp 要随后仰同步加大（1100→3300），否则近端越过相机平面穿帮；满板后静止是用户...`
  - `deck-deal-flyin.md:40` `- anticipation/follow-through 手法借鉴自迪士尼 12 法则（pixel2motion skill 内置提炼版）；预备拍幅度已有用户判例（2026-07-09："OK能看出来了"，此前两档小幅度均无感）；拖拽层级错帧仍是默认建议——与 R2 判例冲突时（如用户要求更快更硬）判例优先`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 首页采用. 预备拍, 过冲, 停稳或坐标轴冲击按这镜的帧数改成可逆进度.

### demos/ui-entrance/doc-park-left-pill-deal/DocParkLeftPillDeal

- 镜头卡: `references/shots/ui-entrance/doc-park-left-pill-deal.md`
- 时长: 174 帧 / 5800 ms, `DURATION` 于第 16 行
- 分镜:
  - `DocParkLeftPillDeal.tsx:16` `export const DOC_PARK_LEFT_PILL_DEAL_DURATION = 174; // 5800ms @30fps`
  - `DocParkLeftPillDeal.tsx:20` `const TXT = '#17181c'; // 正文近黑（带冷调）`
  - `DocParkLeftPillDeal.tsx:21` `const DIM = '#c4c6cc'; // 浅灰占位字`
  - `DocParkLeftPillDeal.tsx:22` `const INK2 = '#5d5f66';`
  - `DocParkLeftPillDeal.tsx:23` `const INK3 = '#9b9da3';`
  - `DocParkLeftPillDeal.tsx:24` `const LINE = 'rgba(20,22,28,0.09)'; // 发丝描边`
  - `DocParkLeftPillDeal.tsx:25` `const ACCENT = '#5b63d3';`
  - `DocParkLeftPillDeal.tsx:113` `const DW = 250, DH = 190;`
  - `DocParkLeftPillDeal.tsx:144` `const SCROLL = 120;`
  - `DocParkLeftPillDeal.tsx:146` `const DOC_LEFT = 34, DOC_TOP = (240 - DH) / 2;`
  - `DocParkLeftPillDeal.tsx:153` `const PX = 214, PY = 54, PH = 34, PG = 14;`
  - `DocParkLeftPillDeal.tsx:154` `const T0 = [0.26, 0.48, 0.70]; // 三张药丸的发牌起点`
- 卡片参数:
  - `doc-park-left-pill-deal.md:5` `时长: 约 5.8s（174f@30fps）`
  - `doc-park-left-pill-deal.md:21` `- 慢发牌：三张药丸起点写死在 'T0 = [0.26, 0.48, 0.70]'——间隔 0.22（约 38f / 1.27s），`
  - `doc-park-left-pill-deal.md:23` `- 每张药丸两条曲线并行：'o = seg(t, f, f+0.035, E.outQuad)' 管透明度（快，约 6f），`
  - `doc-park-left-pill-deal.md:24` `'b = seg(t, f, f+0.062, E.outBack)' 管 'translateY(14→0) scale(0.94→1)'（慢，约 11f`
  - `doc-park-left-pill-deal.md:26` `- 字幕四段编排：起点 'cs = f+0.05'（药丸落定后约 3 帧），'show' 用 0.02 的窗快速出现，`
  - `doc-park-left-pill-deal.md:37` `| 发牌起点 | 'T0 = [0.26, 0.48, 0.70]'，间隔 0.22（≈38f） | 间隔就是旁白句长；压到 0.12 以下字幕的"逐词加深"来不及走完，读作字幕闪一下就没了 |`
  - `doc-park-left-pill-deal.md:40` `| 药丸透明度窗 | 0.035（≈6f，outQuad） | 比位移窗短是有意的——先实后稳；两窗等长会读作普通淡入 |`
  - `doc-park-left-pill-deal.md:41` `| 药丸位移窗 | 0.062（≈11f，outBack），y 14→0、scale 0.94→1 | outBack 的过冲是"发牌落桌"的手感；换 outCubic 会变成平淡的浮上来 |`
  - `doc-park-left-pill-deal.md:42` `| 字幕延迟 | 'cs = f + 0.05'（≈9f） | 药丸落定（0.062）之后才起字幕；提前会出现字幕先于结论出现 |`
  - `doc-park-left-pill-deal.md:49` `- 末张字幕的 'ce = 0.98' 意味着它在 0.93→0.98 淡出，末帧只剩三张药丸没有字幕。若要`
- 可逆: 没有帧采样. 当静态夹具.
- 裁决: 首页采用或只留规则. 一镜一个主角, 飞入必须落进真实槽位.

### demos/ui-entrance/document-typewriter-reveal/DocumentTypewriterReveal

- 镜头卡: `references/shots/typography/document-typewriter-reveal.md`
- 时长: 150 帧 / 5000 ms, `DURATION` 于第 30 行
- 分镜:
  - `DocumentTypewriterReveal.tsx:30` `export const DOCUMENT_TYPEWRITER_REVEAL_DURATION = 150;`
  - `DocumentTypewriterReveal.tsx:37` `const PAGE_W = 1920;`
  - `DocumentTypewriterReveal.tsx:40` `const PAPER = '#fefcf9'; // 纹理纸面实测色`
  - `DocumentTypewriterReveal.tsx:41` `const CARET = '#7a4dff'; // 深一档的极光紫：暖白纸上要看得见`
  - `DocumentTypewriterReveal.tsx:42` `const WASH = 'rgba(196,170,255,0.4)';`
  - `DocumentTypewriterReveal.tsx:79` `const PERSP = 2200;`
  - `DocumentTypewriterReveal.tsx:82` `const REVEAL_EASE = Easing.bezier(0.4, 0, 0.6, 1);`
  - `DocumentTypewriterReveal.tsx:84` `const WIPE = 9;`
  - `DocumentTypewriterReveal.tsx:94` `const WEEK_Y0 = 228;`
  - `DocumentTypewriterReveal.tsx:95` `const WEEK_H = 56;`
  - `DocumentTypewriterReveal.tsx:96` `const WEEK_CUE = (i: number) => 66 + i * 5;`
  - `DocumentTypewriterReveal.tsx:97` `const WEEK_DROP = Easing.bezier(0.2, 1.15, 0.3, 1);`
  - `DocumentTypewriterReveal.tsx:159` `const coverT = interpolate(frame, [cue, cue + WIPE], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: REVEAL_EASE });`
  - `DocumentTypewriterReveal.tsx:168` `? interpolate(frame, [nameCue, nameCue + 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.3, 0, 0.2, 1) })`
  - `DocumentTypewriterReveal.tsx:187` `opacity: coverT > 0 ? 1 : interpolate(frame, [cue + WIPE, cue + WIPE + 2], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),`
  - `DocumentTypewriterReveal.tsx:204` `const t = interpolate(frame, [cue, cue + 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.3, 0, 0.2, 1) });`
  - `DocumentTypewriterReveal.tsx:205` `const lineFade = interpolate(frame, [cue + 10, cue + 24], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });`
  - `DocumentTypewriterReveal.tsx:220` `const t = interpolate(frame, [cue, cue + 9], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: WEEK_DROP });`
  - `DocumentTypewriterReveal.tsx:221` `const appear = interpolate(frame, [cue, cue + 3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });`
- 卡片参数:
  - `document-typewriter-reveal.md:5` `时长: 150f（约 5s，含 history-list-stack 尾段与标语 hold）`
  - `document-typewriter-reveal.md:23` `| 写入节拍 | 20 块两两一对，第 g 对 cue = 8 + g·4.4，每块 wipe 9f，最后一对 ~57f 完成（赶在 64f 全窗 settle 前） | 逐块写会超预算——"块数×节拍要先对预算"是这卡的核心算术，先算再写 |`
  - `document-typewriter-reveal.md:24` `| 写入手法 | 底色遮罩 width 100%→0，bezier(0.4,0,0.6,1)，遮罩色取纹理纸面实测色、右侧多盖（标题 120px——块测量宽度短于粗体实际字宽，否则尾词漏出）；强调色 caret 3px（深一档的极光紫 + 同色柔光）只跟最新块、只骑在实际文字宽度内，写完 2f 淡出；首块开写前 8f 笔尖在标题起点闪烁待命 | caret 同时出现多个立刻穿帮；永远只有一个"笔尖" |`
  - `document-typewriter-reveal.md:26` `| @-mention | wipe 完成后 4f 起、8f 长出强调色底（极光紫 0.4）、'mix-blend-mode: multiply'（底色盖在纹理字上方，normal 混合会把人名洗浅）；跳过非人名标题 | 高亮晚于写入才读作"重点被标出"；同帧出现读作贴图 |`
  - `document-typewriter-reveal.md:27` `| 双栏入场 | 左栏 cue 54 / 右栏 cue 62，底色补丁上→下 10f 收走 + 内缘 2px 强调色线随揭示生长、24f 淡去 | 双栏与正文错开节拍，同时入场会互相抢视线 |`
  - `document-typewriter-reveal.md:28` `| 历史条目落入 | 6 条，cue = 66 + i·5（排在侧栏 wipe 完成 64f 后），每条 9f 落下；起点 −48px，bezier(0.2,1.15,0.3,1) 轻弹跳，空中影 '0 12·air px 24·air px' | 条目几何紧贴烤入纹理已有条目的下方、行高对齐——DOM 重绘条目必须和纹理里的活条目严格对齐 |`
  - `document-typewriter-reveal.md:30` `| 相机 | 自写 3D 窗口相机（布局级 CSS zoom，Q2），单调三次 Hermite 样条逐帧展开：f0 zoom 1.42 / rotY −18° / rotX 8°（窗口左上角与舞台光同时入画）→ f26 1.24 → f64 全窗 0.86 → f104 0.74 + rotX 9° + 上移 78px（底部让给标语）→ f150 0.746 | 开场太近（>1.6x）整屏只剩纸面，暗场与窗口边都看不见，读作原版平铺页面...`
  - `document-typewriter-reveal.md:33` `写入段钉 keyboard.mp3 修剪到 ~50f（8→57f）盖住书写段（拟音与动作严格等长，S4）；历史条目 6 连 pop 每 5f 一发、音量 0.40→0.25 阶梯递减做距离衰减（S2）。`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 首页采用或只留规则. 一镜一个主角, 飞入必须落进真实槽位.

### demos/ui-entrance/draw-svg-trace/DrawSvgTrace

- 镜头卡: `references/shots/ui-entrance/draw-svg-trace.md`
- 时长: 132 帧 / 4400 ms, `DURATION` 于第 30 行
- 分镜:
  - `DrawSvgTrace.tsx:30` `export const DRAW_SVG_TRACE_DURATION = 132;`
  - `DrawSvgTrace.tsx:33` `const CW = 1120;`
  - `DrawSvgTrace.tsx:34` `const CH = 660;`
  - `DrawSvgTrace.tsx:35` `const CX = (1920 - CW) / 2; // 400`
  - `DrawSvgTrace.tsx:36` `const CY = (1080 - CH) / 2; // 210`
  - `DrawSvgTrace.tsx:37` `const RX = 28; // 与卡片圆角一致（交棒不错型）`
  - `DrawSvgTrace.tsx:38` `const PEN = 0.04; // 笔头 dash 长度（占整圈比例）`
  - `DrawSvgTrace.tsx:40` `const TRACE0 = 10, TRACE1 = 50;`
  - `DrawSvgTrace.tsx:64` `const BARS = [34, 40, 37, 48, 45, 54, 58, 56, 66, 74, 81, 96];`
  - `DrawSvgTrace.tsx:68` `const UL_PATH = 'M4,14 C70,6 150,18 230,9 S290,10 300,8';`
  - `DrawSvgTrace.tsx:73` `const p = interpolate(frame, [TRACE0, TRACE1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });`
  - `DrawSvgTrace.tsx:89` `const penOp = interpolate(p, [0, 0.02, 0.97, 0.995], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });`
  - `DrawSvgTrace.tsx:98` `const up = interpolate(frame, [74, 92], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });`
  - `DrawSvgTrace.tsx:99` `const upenOp = interpolate(up, [0, 0.04, 0.92, 0.99], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });`
- 卡片参数:
  - `draw-svg-trace.md:5` `时长: 132f（预告 10f + 描边 40f + 闪黑交棒 16f + 下划线 18f + hold 40f，约 4.4s）`
  - `draw-svg-trace.md:15` `的点名时刻。第二用法是标题下划线生长：同一套路 18f 短版，给重点词`
  - `draw-svg-trace.md:20` `dashoffset 1→0（40f Easing.inOut(cubic)）——不用 getTotalLength`
  - `draw-svg-trace.md:24` `- 预告：开场 0–12f 四角先长出裁切标记（印刷对位线，错峰 2f），底下是一层中心清晰、四周隐去的绘图纸点阵——`
  - `draw-svg-trace.md:25` `第 1 帧就有画面，观众先知道"这里要画一个东西"；闭合时裁切标记外弹 22px 并淡出`
  - `draw-svg-trace.md:26` `- 闭合闪：50–52f 描边冲纯黑 + 6→11px 加粗，52–58f out 回落`
  - `draw-svg-trace.md:28` `- 交棒：56–66f 描边层淡出、元素自身发丝边淡入；50f 起卡底上墨、卡片从贴地升起（阴影长出来），`
  - `draw-svg-trace.md:29` `内容自上而下 3f 错峰由虚到实 + 上浮，柱图错峰 1.5f 从基线长出——闭合即"画完了"，内容跟着"上色"`
  - `draw-svg-trace.md:30` `- 第二用法：74–92f 给重点词「100%」画一笔朱红马克笔下划线（略带弧度的手绘路径，笔头跟随），画完常驻`
  - `draw-svg-trace.md:35` `| 描边速度 | 一整圈 40f（10→50f，inOut cubic 起收有呼吸） | <28f 读不出"在画"，>60f 读作加载中 |`
  - `draw-svg-trace.md:37` `| 闭合闪 | 2f 冲黑 + 加粗到 11px，6f 回落 | 没有这一下，"画完"没有句号 |`
  - `draw-svg-trace.md:39` `| 下划线版 | 18f out cubic 单向生长，12px 朱红、路径带 ±5px 手绘弧度，画完常驻 | 用在单个重点词；一屏 ≥2 条读作装饰线 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 首页采用或只留规则. 一镜一个主角, 飞入必须落进真实槽位.

### demos/ui-entrance/element-body-moves/ContactShadowLift

- 镜头卡: `references/shots/ui-entrance/element-body-moves.md`
- 时长: 150 帧 / 5000 ms, `DURATION` 于第 27 行
- 分镜:
  - `ContactShadowLift.tsx:18` `//   86–100  选定 3：抬升 14f（spring damping 16，~3% 过冲），100f 起悬停呼吸`
  - `ContactShadowLift.tsx:27` `export const CONTACT_SHADOW_LIFT_DURATION = 150;`
  - `ContactShadowLift.tsx:32` `const CARD_W = 420;`
  - `ContactShadowLift.tsx:33` `const CARD_H = 600;`
  - `ContactShadowLift.tsx:34` `const GAP = 60;`
  - `ContactShadowLift.tsx:35` `const DESK_W = 3 * CARD_W + 2 * GAP; // 1448`
  - `ContactShadowLift.tsx:37` `const RADIUS = 30;`
  - `ContactShadowLift.tsx:40` `const LIFT_Z = 96; // 沿桌面法线的抬升（屏幕上约 40–50px 的可见位移，远大于 28px 判例下限）`
  - `ContactShadowLift.tsx:41` `const LIFT_S = 1.05;`
  - `ContactShadowLift.tsx:42` `const SCANS = [16, 50]; // 前两张点名起点`
  - `ContactShadowLift.tsx:43` `const PICK = 86; // 第三张选定起点`
  - `ContactShadowLift.tsx:64` `const k = springAt(f, PICK, { damping: 16, stiffness: 120 });`
  - `ContactShadowLift.tsx:92` `const DAYS = ['1', '2', '3', '4', '5', '6', '7']; // 节拍号（沿用原变量名）`
  - `ContactShadowLift.tsx:145` `const check = frame < PICK + 14 ? 0 : springAt(frame, PICK + 14, { damping: 13, stiffness: 220 });`
- 卡片参数:
  - `element-body-moves.md:5` `时长: A 150f 5s`
  - `element-body-moves.md:18` `| A contact-shadow-lift | 斜俯拍桌面（rotateX 24°→20°）上卡沿法线 translateZ 96px + scale 1.05；阴影是躺在桌面 z=0 的两层独立实体（接触核 + 环境影），随抬升变大、变虚、变淡、向背光侧偏移；点名卡落回 8f in-cubic + 2f 微压卡壳，末张选定卡弹簧抬起后停在空中 | 逐张点名强调；2.5D 段落的离面铺垫 |`
  - `element-body-moves.md:25` `| A 落地 | scale 0.99 卡壳 2f 再 5f 回弹到 1 | 无微压读作飘落，没有重量 |`
  - `element-body-moves.md:26` `| 收尾 | 末张选定后悬停 ~50f | 若要循环，把末张改成同样落回 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 首页采用或只留规则. 一镜一个主角, 飞入必须落进真实槽位.

### demos/ui-entrance/integration-hub-map/IntegrationHubMap

- 镜头卡: `references/shots/ui-entrance/integration-hub-map.md`
- 时长: 150 帧 / 5000 ms, `DURATION` 于第 27 行
- 分镜:
  - `IntegrationHubMap.tsx:27` `export const INTEGRATION_HUB_MAP_DURATION = 150; // 前摇 0.5s + 快翻 1.2s + 两拍接入 0.7s + 输送呼吸 ~2.6s`
  - `IntegrationHubMap.tsx:39` `const INK = '#1d1e25', INK2 = '#5f616b', INK3 = '#a0a2ab', HAIR = 'rgba(20,22,28,0.08)';`
  - `IntegrationHubMap.tsx:40` `const ACC = '#5b55c8';`
  - `IntegrationHubMap.tsx:43` `const PW = 820, PH = 520;`
  - `IntegrationHubMap.tsx:176` `const AMBER = '#D3923C';`
  - `IntegrationHubMap.tsx:264` `const GROW = 9; // v8（批次 17）：用户意见"翻转过来后，5个app同时出现，然后同时连接"——两拍制：五图标 tIcon 统一 52 同帧出现，五管 tPipe 统一 62 同帧连接`
  - `IntegrationHubMap.tsx:265` `const FLOW_SPEED = 4.6; // 输送脉冲速度 px/f`
  - `IntegrationHubMap.tsx:266` `const FLOW_PERIOD = 74; // 脉冲间距（px）`
  - `IntegrationHubMap.tsx:301` `const RECTS = Array.from({ length: 9 }, (_, i) => ({`
  - `IntegrationHubMap.tsx:311` `const CAM = bezier(0.55, 0, 0.18, 1);`
  - `IntegrationHubMap.tsx:324` `const rotY = interpolate(frame, [14, 49], [0, 180], {`
  - `IntegrationHubMap.tsx:327` `easing: Easing.out(Easing.cubic),`
  - `IntegrationHubMap.tsx:334` `const bloom = interpolate(frame, [19, 21, 23, 27], [0, 1, 0.25, 0], {`
  - `IntegrationHubMap.tsx:346` `const mapIn = interpolate(frame, [34, 60], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });`
  - `IntegrationHubMap.tsx:363` `const on = interpolate(frame, [36 + i * 4, 56 + i * 4], [0, 1], {`
  - `IntegrationHubMap.tsx:366` `easing: Easing.out(Easing.cubic),`
  - `IntegrationHubMap.tsx:368` `const settle = interpolate(frame, [90, 120], [1, 0.62], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });`
  - `IntegrationHubMap.tsx:422` `const grow = interpolate(frame, [p.tPipe, p.tPipe + GROW], [0, 1], {`
  - `IntegrationHubMap.tsx:425` `easing: Easing.out(Easing.quad),`
  - `IntegrationHubMap.tsx:432` `const flowIn = interpolate(frame, [p.tPipe + GROW, p.tPipe + GROW + 8], [0, 1], {`
  - `IntegrationHubMap.tsx:502` `const appear = interpolate(frame, [p.tIcon, p.tIcon + 13], [0, 1], {`
  - `IntegrationHubMap.tsx:507` `const pop = Easing.bezier(0.34, 1.5, 0.64, 1)(appear); // 过冲 ~8% 再回落`
  - (运动行 27 条, 留前 22 条, 文件 652 行已逐行扫过)
- 卡片参数:
  - `integration-hub-map.md:3` `一句话: 旧页面一次性快翻 180°（侧棱瞬间亮闪）落成新中枢页，五个集成 app 图标同帧弹现、随即五条彩虹光管同帧齐连，光管内输送脉冲持续流动——"翻开新一页，生态一齐接入"`
  - `integration-hub-map.md:14` `linear；90° 侧棱停顿版被裁）。侧棱时刻只"闪一下"（1–3f 脉冲，`
  - `integration-hub-map.md:15` `长光晕平台被裁）。接入是**两拍制**：五图标同帧弹现（第一拍）→`
  - `integration-hub-map.md:16` `五管同帧起画齐连（第二拍）——齐，才读作"生态一次到位"；错峰`
  - `integration-hub-map.md:21` `- 翻面：rotateY 0→180°，35f，Easing.out(cubic)（前 41% 时间完成`
  - `integration-hub-map.md:23` `- 侧棱瞬闪：~90° 时刻 2f 脉冲 bloom（0→1→0.25→0，4f 内归零）`
  - `integration-hub-map.md:24` `- 两拍制接入：五图标 tIcon 同帧（翻面落定 +3f）弹现；+10f 五管`
  - `integration-hub-map.md:25` `tPipe 同帧起画，9f 齐长全亮`
  - `integration-hub-map.md:33` `| 翻面时长 | 35f（曾 70f 被裁"再快1倍"） | <24f 读不出双面；尾段减速比例 ~60% 时间走 20% 角度 |`
  - `integration-hub-map.md:34` `| 翻面曲线 | ease-out 单调无停顿 | 侧棱停顿/分段被裁；严格 linear 起停生硬也被裁——快翻尾缓 |`
  - `integration-hub-map.md:35` `| 侧棱闪 | 2f 脉冲、4f 归零 | 长光晕平台被裁"闪一下就行" |`
  - `integration-hub-map.md:36` `| 接入节奏 | 两拍制：图标同帧 → +10f 光管同帧 | 错峰逐连两轮被裁"同时出现，然后同时连接"；两拍间隔 <6f 读作一拍 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 首页采用或只留规则. 一镜一个主角, 飞入必须落进真实槽位.

### demos/ui-entrance/list-reveal/ListReveal

- 镜头卡: `references/shots/ui-entrance/list-reveal.md`
- 时长: 120 帧 / 4000 ms, `DURATION` 于第 27 行
- 分镜:
  - `ListReveal.tsx:27` `export const LIST_REVEAL_DURATION = 120;`
  - `ListReveal.tsx:40` `const ROW_W = 700;`
  - `ListReveal.tsx:41` `const ROW_H = 92;`
  - `ListReveal.tsx:42` `const GAP = 14;`
  - `ListReveal.tsx:43` `const LIST_X = 170;`
  - `ListReveal.tsx:44` `const LIST_Y = 236; // 漂移中点处的列表顶`
  - `ListReveal.tsx:45` `const DRIFT = 96; // 全程总漂移（+48 → −48）`
  - `ListReveal.tsx:47` `const START = 2; // 首项起点`
  - `ListReveal.tsx:48` `const STAGGER = 10;`
  - `ListReveal.tsx:49` `const EACH = 24;`
- 卡片参数:
  - `list-reveal.md:3` `一句话: 垂直菜单 6 项按 10f 的间隔依次 scale 找位、软 back 轻微过冲落定，同时整个列表容器全程匀速上移——逐项入场与整体漂移是两层不相干的运动`
  - `list-reveal.md:5` `时长: 约 4s（120f@30fps）`
  - `list-reveal.md:12` `观众读得清每一项，同时画面从头到尾没有一帧是钉死的。`
  - `list-reveal.md:15` `- 两层运动完全解耦：容器 'translateY(DRIFT/2 − DRIFT·f/(N−1))' 只吃全局帧，是贯穿全片的匀速漂移`
  - `list-reveal.md:17` `- 逐项入场：起点 '2 + i·10f'、窗口 24f，stagger 10f 比常规 UI stagger 慢一档——这是"读得完"的间隔，`
  - `list-reveal.md:21` `- 软过冲 'bezier(0.3, 1.18, 0.5, 1)'（~1.5%）——量很小，作用是把落位那一帧从"停"变成"扣住"`
  - `list-reveal.md:22` `- 跟随：图标晚 2f、右侧快捷键 / 徽章晚 4f 落定；透明度 'min(1, lin·2.2)'，行程 45% 就已全实`
  - `list-reveal.md:28` `| 项数 | 6（Home…Sign out） | 末项 52f 起、76f 落定，尾部留 ~44f 给观众收尾；>8 项必须压 stagger，否则末项吃到收尾 |`
  - `list-reveal.md:29` `| stagger | 10f/项 | 10f 是"逐项读得完"；压到 4f 变成一次铺开（另一种手法），拉到 16f 以上节拍会散 |`
  - `list-reveal.md:30` `| 单项窗口 | 24f | 窗口比 stagger 长 2.4 倍 → 相邻项重叠；两者相等会变成一项一项硬接 |`
  - `list-reveal.md:33` `| 过冲 | 软 back ~1.5% | 要小到几乎读不出来；换 spring 或加大过冲，6 项连续抖会显得廉价 |`
  - `list-reveal.md:38` `- 容器漂移是匀速且贯穿全程，末帧停在 −48px 而不是 0——这个动效**末帧不回位**。`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 首页采用或只留规则. 一镜一个主角, 飞入必须落进真实槽位.

### demos/ui-entrance/list-stack-press/ListStackPress

- 镜头卡: `references/shots/ui-entrance/list-stack-press.md`
- 时长: 88 帧 / 2933 ms, `DURATION` 于第 21 行
- 分镜:
  - `ListStackPress.tsx:21` `export const LIST_STACK_PRESS_DURATION = 88; // 18–88f 落在 shot 内 offset 0`
  - `ListStackPress.tsx:26` `const AMBER = 'oklch(52% 0.115 65)';`
  - `ListStackPress.tsx:27` `const FILES = ['paper1.png', 'paper2.png', 'paper3.png', 'paper4.png', 'paper5.png'];`
  - `ListStackPress.tsx:29` `const HL_TOP = 156, HL_H = 20, HL_LEFT = 16;`
  - `ListStackPress.tsx:30` `const HL_W = [187, 244, 247, 240, 191];`
  - `ListStackPress.tsx:32` `const CUES = [6, 18, 30, 42, 54]; // 首卡前留 6f 给计数器预备拍（anticipation）`
  - `ListStackPress.tsx:33` `const DUR = 22;`
  - `ListStackPress.tsx:34` `const FLY_EASE = Easing.bezier(0.45, 0.05, 0.25, 1.12);`
  - `ListStackPress.tsx:35` `const TILTS = [2, -2, 2, -2, 2];`
  - `ListStackPress.tsx:38` `const ANTICIPATE_START = 0;`
  - `ListStackPress.tsx:39` `const ANTICIPATE_END = 6;`
  - `ListStackPress.tsx:43` `const CAM_END = 82;`
  - `ListStackPress.tsx:44` `const CY_EASE = bezier(0.42, 0, 0.2, 1);`
  - `ListStackPress.tsx:45` `const Z_EASE = bezier(0.3, 0, 0.18, 1);`
  - `ListStackPress.tsx:58` `const DIGITS = '0123456789';`
  - `ListStackPress.tsx:59` `const ROLL_DUR = 8; // 单格滚动帧数，< 12f 落卡间距`
  - `ListStackPress.tsx:60` `const ROLL_EASE = Easing.bezier(0.25, 0.8, 0.25, 1);`
  - `ListStackPress.tsx:64` `pos += interpolate(frame, [c + DUR, c + DUR + ROLL_DUR], [0, 1], {`
  - `ListStackPress.tsx:92` `interpolate(f, [CUES[i], CUES[i] + DUR], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: FLY_EASE });`
  - `ListStackPress.tsx:103` `const antT = interpolate(frame, [ANTICIPATE_START, ANTICIPATE_END], [0, 1], {`
  - `ListStackPress.tsx:104` `extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad),`
  - `ListStackPress.tsx:115` `const p = interpolate(frame, [cue, cue + 4, cue + 8], [0, 6, 0], {`
  - (运动行 29 条, 留前 22 条, 文件 238 行已逐行扫过)
- 卡片参数:
  - `list-stack-press.md:5` `时长: 约 3s（18–88f）`
  - `list-stack-press.md:13` `- **预备拍（anticipation，借鉴迪士尼法则 2）**：首张升入前给一拍段落级预备——计数器先于首卡 4–6f 亮起归零/微缩 scale(0.96)→1，把视线引到堆叠区，再让首卡入画。只做段落级一次，不逐卡加`
  - `list-stack-press.md:15` `- 每张到场压下整摞 6px、8f 弹回（stackPress 脉冲——即法则 5 的 follow-through：新卡的动能传给整摞再缓冲耗散，这一笔就是"有重量"的来源）`
  - `list-stack-press.md:16` `- 落地后按拖拽层级依次收尾（法则 5）：卡体先停 → 整摞弹回 → 高亮条再长出（滞后 2–4f）——三者同帧发生读作贴图切换`
  - `list-stack-press.md:23` `| 节拍 | CUES=[18,30,42,54,66]（12f 等距），每张飞 22f，bezier(0.45,0.05,0.25,1.12) 末端过冲 | 少量卡（5 张）可以等距；大批量入场才需要递加速（对照 deck-deal 的 R2） |`
  - `list-stack-press.md:25` `| 堆叠压感 | 后一张到场时整摞压下 6px、8f 弹回（脉冲 [cue,cue+4,cue+8]→[0,6,0]） | 这是"有重量"的关键一笔，砍掉后堆叠变成简单排版 |`
  - `list-stack-press.md:27` `| 联动高亮 | 落地后滞后 2–4f 在项目名那一行（截图实测卡内 y156–176）长出与项目名等宽的强调色（模板片为琥珀）荧光笔底色，multiply 叠在字下（7f 长 + 5f 淡）；最后一张离切点仅 ~12f，压到 5f 长 + 4f 淡 | 高亮是次级动作（法则 5/8）：在主动作（落地压弹）之后跟进，不与之同帧抢戏；末尾元素的节拍要按剩余帧预算压缩，不能照抄前面的 |`
  - `list-stack-press.md:28` `| glaze 扫光 | 360px 宽、rotate 14°、mixBlendMode soft-light，最后一张落定后帧 74→87 从 −500 扫到 2300，裁进每张卡的圆角内 | 扫光全镜头只此一次、扫整摞不逐卡（Q4） |`
  - `list-stack-press.md:29` `| 计数器（digit-roll 手法） | 连续里程计位置 pos：每张卡落地让 pos 沿数字带 +1 格，单格 8f 滚定，bezier(0.25,0.8,0.25,1)；滚动量=pos·lineH 沿双份 0-9 带连续下滚 | 计数与落地不同步立刻穿帮；**单格滚动必须短于落卡间距（12f）且尾格在镜头收尾前滚定**——以 count 为 key 重挂重滚的写法每次都要从 0 滚 22f，12f 节拍下前一次永远滚不完、尾帧停...`
  - `list-stack-press.md:30` `| 相机 | zoom 1.35→0.86 一条连续曲线跟随堆叠向下（逐帧喂给 PageCam2D，避免分段关键帧处速度归零） | 正视机位（见已知坑），相机只做纵向跟随 |`
  - `list-stack-press.md:40` `- 预备动作幅度必须过肉眼阈值（deck-deal 判例 2026-07-09：小幅度用户完全无感，放大 12 倍才通过）——渲染后自查"不逐帧能否看出蓄力"`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 首页采用或只留规则. 一镜一个主角, 飞入必须落进真实槽位.

### demos/ui-entrance/neon-frame-forerun/NeonFrameForerun

- 镜头卡: `references/shots/ui-entrance/neon-frame-forerun.md`
- 时长: 140 帧 / 4667 ms, `DURATION` 于第 29 行
- 分镜:
  - `NeonFrameForerun.tsx:29` `export const NEON_FRAME_FORERUN_DURATION = 140;`
  - `NeonFrameForerun.tsx:32` `const NEON_A = '#b48cff'; // 灯管紫`
  - `NeonFrameForerun.tsx:33` `const NEON_B = '#ff6fb5'; // 灯管粉`
  - `NeonFrameForerun.tsx:36` `const INK = '#17141f', INK2 = '#5a5568', INK3 = '#9a95a8';`
  - `NeonFrameForerun.tsx:37` `const HAIR = 'rgba(30,20,50,0.09)';`
  - `NeonFrameForerun.tsx:38` `const ACC = '#7c5cf0';`
  - `NeonFrameForerun.tsx:40` `const PW = 1440;`
  - `NeonFrameForerun.tsx:41` `const PH = 840;`
  - `NeonFrameForerun.tsx:42` `const PAD = 22; // 霓虹框在面板外的距离`
  - `NeonFrameForerun.tsx:43` `const PERSP = 1600;`
  - `NeonFrameForerun.tsx:163` `const FW = PW + PAD * 2;`
  - `NeonFrameForerun.tsx:164` `const FH = PH + PAD * 2;`
  - `NeonFrameForerun.tsx:166` `const FRAME_D = 'M 0 ${FH / 2} L 0 0 L ${FW} 0 L ${FW} ${FH} L 0 ${FH} Z';`
  - `NeonFrameForerun.tsx:167` `const PERIM = 2 * (FW + FH);`
  - `NeonFrameForerun.tsx:181` `const STRIKE = [0, 0.7, 0.15, 0.9, 0.35, 1];`
  - `NeonFrameForerun.tsx:183` `const FADE = [1, 0.3, 0.8, 0.12, 0.4, 0];`
  - `NeonFrameForerun.tsx:197` `const ECHO = Array.from({ length: 5 }, (_, i) => {`
- 卡片参数:
  - `neon-frame-forerun.md:5` `时长: 框奔画 ~0.7s + 点亮&贴落 ~2.7s + 背景熄灭收束 ~1s；全段 4–4.7s（demo 140f）`
  - `neon-frame-forerun.md:19` `- 霓虹框：强透视直角框，自左缘中点两颗白热亮头上下分头奔画（20f，swift 起步快、`
  - `neon-frame-forerun.md:22` `- 页面点亮：框合拢后页面才从黑里浮出（16–30f），再由暗转亮（24–84f smooth），`
  - `neon-frame-forerun.md:26` `不在 3D 父级上加 filter/opacity（会把 3D 压平）。每件 24f 加速下落 + 软着陆，`
  - `neon-frame-forerun.md:27` `落点 54→104f 按"侧栏自上而下 → 主区自上而下"错峰（先密后疏），比点亮晚 ~20f 收尾`
  - `neon-frame-forerun.md:29` `框合拢后由近到远逐层"打火"（荧光管启辉的确定性闪烁）；终段中段先熄、两端后熄（94–118f）`
  - `neon-frame-forerun.md:30` `- 机位：rotateY −30° → −12°（0–96f EASE.out 长减速），hold 段再极缓转 1.5°`
  - `neon-frame-forerun.md:35` `| 框奔画 | 20f 两头对奔（swift） | 单头描画读作画图；>30f 观众等不及内容 |`
  - `neon-frame-forerun.md:37` `| 贴落窗口 | 每件 24f；落点 54→104f，比点亮晚 ~20f 收尾 | 贴落先于点亮完＝黑屋子里落家具；滞后太多读作两段戏 |`
  - `neon-frame-forerun.md:38` `| 错峰 | 错开起点、下落重叠并行（EASE.out 分布，先密后疏） | 串行等待被裁（掉落节奏通用判例） |`
  - `neon-frame-forerun.md:39` `| 背景熄灭 | 中亮尾熄，每层 6f 闪烁熄灭、层间隔 7f | 不熄灭主角不突出；同帧全熄读作断电 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 首页采用或只留规则. 一镜一个主角, 飞入必须落进真实槽位.

### demos/ui-entrance/neon-frame-orbit-drop/NeonFrameForerunOrbit

- 镜头卡: `references/shots/ui-entrance/neon-frame-orbit-drop.md`
- 时长: 140 帧 / 4667 ms, `DURATION` 于第 16 行
- 分镜:
  - `NeonFrameForerunOrbit.tsx:16` `export const NEON_FRAME_FORERUN_ORBIT_DURATION = 140; // 描框 0.5s + 旋转&同时贴落 3.8s + 落定`
  - `NeonFrameForerunOrbit.tsx:18` `const easeFall = Easing.bezier(0.5, 0.05, 0.6, 1); // 加速下落、末端软着陆`
  - `NeonFrameForerunOrbit.tsx:40` `const LAND = 0.52;`
  - `NeonFrameForerunOrbit.tsx:42` `const FALL = 0.3;`
  - `NeonFrameForerunOrbit.tsx:54` `const INK = '#1c1d22', INK2 = '#5d5f67', INK3 = '#9c9ea6';`
  - `NeonFrameForerunOrbit.tsx:55` `const HAIR = 'rgba(20,22,28,0.08)';`
  - `NeonFrameForerunOrbit.tsx:56` `const ACC = '#6a5ae0';`
  - `NeonFrameForerunOrbit.tsx:58` `const PW = 1330;`
  - `NeonFrameForerunOrbit.tsx:59` `const PH = 790;`
  - `NeonFrameForerunOrbit.tsx:60` `const PL = 1000; // 归一路径长`
  - `NeonFrameForerunOrbit.tsx:63` `const FRAME_D = 'M 0 ${PH / 2} L 0 0 L ${PW} 0 L ${PW} ${PH} L 0 ${PH} Z';`
  - `NeonFrameForerunOrbit.tsx:94` `const AV = ['#e4e1da', '#dde0e8', '#e8e2e8', '#dce6e1'];`
  - `NeonFrameForerunOrbit.tsx:212` `const HUES = ['#b06af0', '#e879c9', '#f0a35c', '#6a7df0', '#e0679a', '#8a5cf0', '#c06af0'];`
  - `NeonFrameForerunOrbit.tsx:226` `const trace = interpolate(frame, [0, 14], [0, 1], {`
  - `NeonFrameForerunOrbit.tsx:228` `easing: Easing.bezier(0.3, 0.1, 0.3, 1),`
  - `NeonFrameForerunOrbit.tsx:231` `const lit = interpolate(frame, [8, 30], [0.25, 1], {`
  - `NeonFrameForerunOrbit.tsx:233` `easing: Easing.bezier(0.35, 0, 0.3, 1),`
  - `NeonFrameForerunOrbit.tsx:235` `const frameLine = interpolate(frame, [96, 130], [1, 0.35], {`
  - `NeonFrameForerunOrbit.tsx:238` `const rimGlow = interpolate(frame, [0, 20, 108, 138], [0.7, 1, 0.75, 0.5], {`
  - `NeonFrameForerunOrbit.tsx:241` `const bgLit = interpolate(frame, [0, 30, 100, 136], [0.3, 1, 0.85, 0.1], {`
  - `NeonFrameForerunOrbit.tsx:246` `const orbit = interpolate(frame, [0, 128], [0, 1], {`
  - `NeonFrameForerunOrbit.tsx:248` `easing: Easing.bezier(0.42, 0.05, 0.32, 1),`
  - (运动行 23 条, 留前 22 条, 文件 354 行已逐行扫过)
- 卡片参数:
  - `neon-frame-orbit-drop.md:3` `一句话: 霓虹框先行描框后，镜头绕页面左→右弧线旋转，页面全部组件/文字**同帧**从空中往下贴合（同形软影同步收敛）——整体登场式的框内安放`
  - `neon-frame-orbit-drop.md:5` `时长: 描框 ~0.5s + 旋转&同时贴落 ~2.5s + 落定 ~1s；全段 ~4.7s（140f，旋转到 128f 收住后留落定）`
  - `neon-frame-orbit-drop.md:14` `同帧起落、同帧贴合、软影同步消失——这是"整体登场"的语法`
  - `neon-frame-orbit-drop.md:20` `- 霓虹描框：渐变霓虹框 ~14f 奔画成型（同 neon-frame-forerun）`
  - `neon-frame-orbit-drop.md:23` `- 同时贴落：全部元素统一 LAND 时刻（归一化 ~0.52）——同帧离地`
  - `neon-frame-orbit-drop.md:24` `悬空、同帧空中下降、同帧贴合；FloatWrap 同形软影（blur/offset/`
  - `neon-frame-orbit-drop.md:31` `| 贴落同时性 | 全元素同帧起落（零错峰） | **命门**；任何错峰都会读成巡礼语法（判例裁决原话见上） |`
  - `neon-frame-orbit-drop.md:35` `| 描框 | ~14f 奔画 | 同 neon-frame-forerun |`
  - `neon-frame-orbit-drop.md:40` `巡礼镜=错开起点+重叠并行下落；整体登场镜=全体同帧。选错语法`
  - `neon-frame-orbit-drop.md:43` `三层咬合；本卡镜头旋转+同帧齐落。同段落二选一，别连用（同框`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 首页采用或只留规则. 一镜一个主角, 飞入必须落进真实槽位.

### demos/ui-entrance/page-waterfall-wall/PageWaterfallWall

- 镜头卡: `references/shots/ui-entrance/page-waterfall-wall.md`
- 时长: 150 帧 / 5000 ms, `DURATION` 于第 17 行
- 分镜:
  - `PageWaterfallWall.tsx:17` `export const PAGE_WATERFALL_WALL_DURATION = 150; // 5s（无限循环体，按段落需要裁）`
  - `PageWaterfallWall.tsx:19` `const BG = '#0d0e13';`
  - `PageWaterfallWall.tsx:20` `const ZOOM = 1.2; // 补透视收缩的底值（配方 scale 1.2）`
  - `PageWaterfallWall.tsx:21` `const PUSH = 0.06; // 镜头缓推 1→1.06`
  - `PageWaterfallWall.tsx:64` `const FADE_TOP = 'linear-gradient(to bottom, #111319 0%, rgba(17,19,25,0.85) 10%, rgba(17,19,25,0) 30%)';`
  - `PageWaterfallWall.tsx:65` `const FADE_BOTTOM = 'linear-gradient(to top, #08090c 0%, rgba(8,9,12,0.8) 8%, rgba(8,9,12,0) 22%)';`
  - `PageWaterfallWall.tsx:84` `const push = interpolate(frame, [0, durationInFrames], [1, 1 + PUSH], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });`
- 卡片参数:
  - `page-waterfall-wall.md:37` `| 循环周期 | -50% 位移必须恰等于单副本周期（内容高+n·gap） | lib 已用 marginBottom 保证；自写实现用 flex gap 会差 gap/2 跳帧 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 首页采用或只留规则. 一镜一个主角, 飞入必须落进真实槽位.

### demos/ui-entrance/page-waterfall-wall/VerticalTicker

- 镜头卡: `references/shots/ui-entrance/page-waterfall-wall.md`
- 时长: 文件里没有导出的 DURATION 数字
- 分镜:
  - 无 interpolate / spring / Easing
- 卡片参数:
  - `page-waterfall-wall.md:37` `| 循环周期 | -50% 位移必须恰等于单副本周期（内容高+n·gap） | lib 已用 marginBottom 保证；自写实现用 flex gap 会差 gap/2 跳帧 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 首页采用或只留规则. 一镜一个主角, 飞入必须落进真实槽位.

### demos/ui-entrance/product-card-progressive-assemble/ProductCardProgressiveAssemble

- 镜头卡: `references/shots/ui-entrance/product-card-progressive-assemble.md`
- 时长: 172 帧 / 5733 ms, `DURATION` 于第 35 行
- 分镜:
  - `ProductCardProgressiveAssemble.tsx:13` `//   Free（Apache-2.0 开源）物理弹簧（damping 14）从 1.18 收到 1、OPEN SOURCE chip 晚 6f 滑入。`
  - `ProductCardProgressiveAssemble.tsx:35` `export const PRODUCT_CARD_PROGRESSIVE_ASSEMBLE_DURATION = 172;`
  - `ProductCardProgressiveAssemble.tsx:41` `const CW = 1520;`
  - `ProductCardProgressiveAssemble.tsx:42` `const CH = 840;`
  - `ProductCardProgressiveAssemble.tsx:43` `const CL = (1920 - CW) / 2;`
  - `ProductCardProgressiveAssemble.tsx:44` `const CT = (1080 - CH) / 2 + 6;`
  - `ProductCardProgressiveAssemble.tsx:45` `const PAD = 60;`
  - `ProductCardProgressiveAssemble.tsx:46` `const IMG = { x: PAD, y: PAD, w: 640, h: CH - PAD * 2 };`
  - `ProductCardProgressiveAssemble.tsx:47` `const COL = PAD + 640 + 64; // 右列 x（卡片局部）`
  - `ProductCardProgressiveAssemble.tsx:62` `const HOP = 6; // 光标跳格帧数`
  - `ProductCardProgressiveAssemble.tsx:63` `const LAND = 2; // 字段在光标到达后几帧开始落位`
  - `ProductCardProgressiveAssemble.tsx:64` `const PRICE_DROP = 62;`
  - `ProductCardProgressiveAssemble.tsx:92` `const s = springAt(f, start, { damping: 13, stiffness: 260 });`
  - `ProductCardProgressiveAssemble.tsx:141` `const newP = springAt(frame, PRICE_DROP + 1, { damping: 14, stiffness: 240 });`
- 卡片参数:
  - `product-card-progressive-assemble.md:3` `一句话: 详情卡像被逐字段抓取般自建——一枚"填充光标"领先跳格，图→标题→分类 pill 依次 pop→原价出现后被划线降级、强调色新价 spring 跳出→正文逐行揭示且高亮块由左向右刷过→色卡点亮→按钮填满，整卡全程极慢 scale 前推`
  - `product-card-progressive-assemble.md:5` `时长: 约 5.7s（172f@30fps）`
  - `product-card-progressive-assemble.md:17` `- 字段时间表直接用 30fps 帧号：光标到达 图 8 / 标题 20 / pill 30 / 价格 42 / 正文 76 / 色卡 96 / 按钮 114，`
  - `product-card-progressive-assemble.md:18` `字段在光标到达后 2f 开始落位；同组内部间隔 3f（pill、正文行、色卡），跨组间隔 10–20f——间隔的疏密就是信息分组`
  - `product-card-progressive-assemble.md:20` `（'cubic-bezier(.4,0,.2,1)'，6f）同时插值位置与宽高；最后收进按钮（ease-in 8f 淡出）。这是全片唯一的光效`
  - `product-card-progressive-assemble.md:22` `- 两种落位：'rise'（上移 10–26px + 6px→0 失焦淡入，expo-out 14f）给图/标题/价格/正文；'pop'`
  - `product-card-progressive-assemble.md:24` `- 价格降级 f62（$449 完整落位后 hold 18f）：6f 内同窗"scale 1→0.46 + 变灰 + 9px 删除线从左划过"，`
  - `product-card-progressive-assemble.md:26` `- 马克笔高亮：钴蓝 16% 底块 'scaleX 0→1'（origin 左），f86 / f90 起各 6f——比字段落位还快，读作"笔一划过去"`
  - `product-card-progressive-assemble.md:27` `- 按钮：墨黑底色 f116 起 12f 由左向右填满，文案 f122 淡入`
  - `product-card-progressive-assemble.md:28` `- 整卡呼吸：'scale 1→1.035'（不对称 in-out）摊在 0–132f；入场 0–14f scale .96→1 + 上移 30px；末段 40f 静止定格`
  - `product-card-progressive-assemble.md:33` `| 字段时间表 | 光标 8/20/30/42/76/96/114，落位 +2f | 同类字段间隔 3 帧、跨类间隔 10–20 帧；全部改成等间隔会读作机械点名 |`
  - `product-card-progressive-assemble.md:34` `| 光标跳格 | 6f，swift in-out，框形同步变形 | <4f 读作闪现；>10f 光标拖在字段后面，"领先抓取"变成"事后框选" |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 首页采用或只留规则. 一镜一个主角, 飞入必须落进真实槽位.

### demos/ui-entrance/radial-wave/RadialWave

- 镜头卡: `references/shots/ui-entrance/radial-wave.md`
- 时长: 114 帧 / 3800 ms, `DURATION` 于第 8 行
- 分镜:
  - `RadialWave.tsx:8` `export const RADIAL_WAVE_DURATION = 114; // 3800ms @30fps`
  - `RadialWave.tsx:10` `const COLS = 17;`
  - `RadialWave.tsx:11` `const ROWS = 9;`
  - `RadialWave.tsx:12` `const CX = (COLS - 1) / 2;`
  - `RadialWave.tsx:13` `const CY = (ROWS - 1) / 2;`
- 卡片参数:
  - `radial-wave.md:5` `时长: 约 3.8s（114f@30fps）`
  - `radial-wave.md:23` `- 脉冲峰值处（'pulse2 > 0.3'）硬切成 '#b9f2ff' 并挂 '0 0 12px #7fd8ff' 光晕——只有第二`
  - `radial-wave.md:31` `| 单点行程 | 0.18（≈21f） | 决定波前的厚度；<0.1 波前锐利像扫描线，>0.3 全场几乎同时亮，扩散感消失 |`
  - `radial-wave.md:40` `- 末帧不完全静止：中心点（dist=0）的第二道波窗是 0.87→1.02，t=1 时才走到 87%，`
  - `radial-wave.md:44` `- 颜色只有两档（常色 '#6c8cff' / 峰值 '#b9f2ff'），换品牌色要改这两处加光晕色共三处；`
- 可逆: 没有帧采样. 当静态夹具.
- 裁决: 首页采用或只留规则. 一镜一个主角, 飞入必须落进真实槽位.

### demos/ui-entrance/research-card-stack-scroll/ResearchCardStackScroll

- 镜头卡: `references/shots/ui-entrance/research-card-stack-scroll.md`
- 时长: 144 帧 / 4800 ms, `DURATION` 于第 9 行
- 分镜:
  - `ResearchCardStackScroll.tsx:9` `export const RESEARCH_CARD_STACK_SCROLL_DURATION = 144; // 4800ms @30fps`
  - `ResearchCardStackScroll.tsx:11` `const ORANGE = '#FF6A1F';`
  - `ResearchCardStackScroll.tsx:12` `const ORANGE_SOFT = '#FF8A44';`
  - `ResearchCardStackScroll.tsx:13` `const INK = '#1A1A1A';`
  - `ResearchCardStackScroll.tsx:20` `const PER = 12; // 每 12 帧进一张卡`
  - `ResearchCardStackScroll.tsx:21` `const GAP = 30; // 叠压后每张卡的下移间距`
  - `ResearchCardStackScroll.tsx:22` `const XOFF = 9; // 滚流时的右移量`
  - `ResearchCardStackScroll.tsx:25` `const LW = 420;`
  - `ResearchCardStackScroll.tsx:26` `const LH = 250;`
  - `ResearchCardStackScroll.tsx:44` `const CW = 296;`
  - `ResearchCardStackScroll.tsx:45` `const CH = 96;`
- 卡片参数:
  - `research-card-stack-scroll.md:3` `一句话: 深色论文卡每 12 帧一张沿右下轴线飞入中心叠压，落位带 1 帧压缩，只有最上一张全清晰渲染标题+作者+摘要，下方卡按堆积深度递增模糊变暗只露标题条，背景横向 grid 同步下移做速度参照`
  - `research-card-stack-scroll.md:5` `时长: 约 4.8s（144f@30fps）`
  - `research-card-stack-scroll.md:16` `- 时间轴用真实帧号而非归一化 t：内部 'F=144'，每张卡的本地时间 'e = t*144 - i*12'，`
  - `research-card-stack-scroll.md:17` `一切编排（入场、堆积、深度）都以 'PER=12' 帧为节拍单位写死`
  - `research-card-stack-scroll.md:18` `- 入场是 6 帧短促动作：'seg(clamp((e+6)/6), 0, 1, E.outCubic)'——注意起点是 'e=-6'，`
  - `research-card-stack-scroll.md:19` `即卡在自己的节拍到达前 6 帧就开始飞，'translateY(-40→0)' + 'scale(0.94→1)'`
  - `research-card-stack-scroll.md:20` `- 落位 squash：'e ∈ [0, 1.6)' 时 y 轴 scale 额外乘 0.97，只压 1.6 帧——短到读不出是`
  - `research-card-stack-scroll.md:34` `| 节拍 | PER=12 帧/张，13 张 | 12f 是"紧但看得清"的下限；<8f 标题来不及读，>20f 量级感垮掉变成逐张展示 |`
  - `research-card-stack-scroll.md:35` `| 入场行程 | 6 帧（outCubic），提前量 -6 帧 | 行程只有节拍的一半 → 每张在下一张来之前已经落定；行程 ≥ PER 时会有两张同时在飞 |`
  - `research-card-stack-scroll.md:37` `| 落位压缩 | 1.6 帧，y 轴 ×0.97 | 3% 是刚好能感知的量；>6% 或时长 >3f 会看出橡皮变形 |`
  - `research-card-stack-scroll.md:44` `- 卡数与节拍是绑定的：'13 张 × 12 帧 = 156 帧 > F=144'，末两张在 t=1 时仍在入场途中，`
  - `research-card-stack-scroll.md:45` `末帧不是干净的静态。要做定格结尾，把卡数压到 'F/PER - 1' 以内（12 帧节拍下 ≤11 张）`
- 可逆: 没有帧采样. 当静态夹具.
- 裁决: 首页采用或只留规则. 一镜一个主角, 飞入必须落进真实槽位.

### demos/ui-entrance/row-embed/RowEmbed

- 镜头卡: `references/shots/ui-entrance/row-embed.md`
- 时长: 68 帧 / 2267 ms, `DURATION` 于第 21 行
- 分镜:
  - `RowEmbed.tsx:21` `export const ROW_EMBED_DURATION = 68;`
  - `RowEmbed.tsx:25` `const PAGE_BG = '#f9f6f1'; // 截图里内容区的真实底色（逐像素采样）`
  - `RowEmbed.tsx:34` `const CUES = [12, 22, 31, 39, 46];`
  - `RowEmbed.tsx:35` `const FLY = 12;`
  - `RowEmbed.tsx:37` `const FLY_EASE = Easing.bezier(0.5, 0, 0.8, 0.75);`
  - `RowEmbed.tsx:41` `const airOf = (frame: number, cue: number) => 1 - interpolate(frame, [cue, cue + FLY], [0, 1], { ...clamp, easing: FLY_EASE });`
  - `RowEmbed.tsx:54` `const patchOpacity = interpolate(frame, [land, land + 2], [1, 0], clamp);`
  - `RowEmbed.tsx:56` `const slotHint = interpolate(frame, [cue - 6, cue + 4], [0.55, 1], clamp);`
  - `RowEmbed.tsx:64` `const appear = interpolate(frame, [cue, cue + 3], [0, 1], clamp);`
  - `RowEmbed.tsx:68` `: interpolate(frame, [land, land + 4], [0.995, 1], { ...clamp, easing: Easing.out(Easing.quad) });`
  - `RowEmbed.tsx:106` `const near = interpolate(air, [0, 0.5], [1, 0], clamp);`
  - `RowEmbed.tsx:107` `const contactOp = frame < land ? near * 0.5 : interpolate(frame, [land, land + 3], [0.5, 0], clamp);`
  - `RowEmbed.tsx:124` `const spread = interpolate(frame, [land, land + 5], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });`
  - `RowEmbed.tsx:125` `const seamOpacity = interpolate(frame, [land, land + 2, land + 8], [1, 1, 0], clamp);`
- 卡片参数:
  - `row-embed.md:5` `时长: 约 2s（12–68f）`
  - `row-embed.md:21` `| 节拍 | cue = 12/22/31/39/46（间隔 10→7 递减），飞行 12f，最后一行 58f 落地、强调色缝 66f 收尾 ≤ 镜头 68f 预算 | 先算"最后一行何时落地"再定 cue 间隔——节拍×行数要对预算（同 document-typewriter-reveal 卡的核心算术） |`
  - `row-embed.md:22` `| 飞行姿态 | 'perspective(900px) translateY(−120·air) rotateX(16°·air)'，进度缓动 bezier(.5,0,.8,.75)（末段仍有速度），scale 1.06→0.995 再 4f press-bounce 回 1 | rotateX 收平是"嵌入"的关键读感；纯垂直下落读作贴纸 |`
  - `row-embed.md:24` `| 空槽补丁 | 行位先盖页面真实底色 #f9f6f1 patch（逐像素采样，偏白会读成一整块白板）+ 20% 虚线槽位框，落地后 2f 消失 | 无补丁时纹理里烤入的行会先透出来，飞入变成"重影" |`
  - `row-embed.md:25` `| 嵌入闪光 | 底边 2px 强调色缝（两端羽化）从中心向两侧 5f 展开（Easing.out cubic）、8f 淡出，带 7px 辉光 | 缝只在底边、只闪一次；四边都闪读作选中框 |`
  - `row-embed.md:26` `| 相机 | cy 500→740、zoom 1.12→1.25，68f 缓动下摇 + 微推 | 运镜与行雨并行制造"边看边长"的感觉；相机若等行落完再动，镜头会拖；起止两端都要让页面铺满画框，露出页顶/页底外就是空白死区 |`
- 可逆: 纯帧函数. 给定帧能算回相位, 滚动进度可以反向.
- 裁决: 首页采用或只留规则. 一镜一个主角, 飞入必须落进真实槽位.

### demos/ui-entrance/value-stagger-gradient/ValueStaggerGradient

- 镜头卡: `references/shots/ui-entrance/value-stagger-gradient.md`
- 时长: 150 帧 / 5000 ms, `DURATION` 于第 15 行
- 分镜:
  - `ValueStaggerGradient.tsx:15` `export const VALUE_STAGGER_GRADIENT_DURATION = 150; // 5000ms @30fps`
  - `ValueStaggerGradient.tsx:33` `const BASE_Y = 196; // 基线（设计 px）`
  - `ValueStaggerGradient.tsx:34` `const SWITCH = 0.52; // 两拍之间换代码句`
  - `ValueStaggerGradient.tsx:37` `const KEY = '#9aa3bd';`
  - `ValueStaggerGradient.tsx:38` `const FN = '#c9b3ff';`
  - `ValueStaggerGradient.tsx:39` `const NUM = '#86d4ff';`
  - `ValueStaggerGradient.tsx:40` `const STR = '#f3b58c';`
  - `ValueStaggerGradient.tsx:41` `const PUN = '#5f6782';`
- 卡片参数:
  - `value-stagger-gradient.md:5` `时长: 约 5.0s（150f@30fps）`
  - `value-stagger-gradient.md:16` `- 核心工具是一个 8 行的 'staggerVal(i, n, a, b, ease)'：把索引归一化成 'k = i/(n-1)'`
  - `value-stagger-gradient.md:17` `再 'lerp(k, a, b)'——等价 anime.js 的 'stagger([a, b])' 值模式，可选 ease 让梯度非线性`
  - `value-stagger-gradient.md:20` `- 动态梯度（每帧用）：位移量 'staggerVal(i,N,46,14)'、模糊量 'staggerVal(i,N,8,2)'`
  - `value-stagger-gradient.md:30` `- 代码字幕是一条语法着色的代码条，在 t≈0.52 用约 5f 上下交叉换句（旧句上移淡出、新句自下替入），从 'scale: stagger([1, 0.35])  hue: stagger([200, 320])'`
  - `value-stagger-gradient.md:37` `| 时间错峰 | 'd = i*0.02'（≈3f/根，总 0.3） | 3f 是连绵的铺开；>0.05 会变成逐根点名，梯度的"整体感"丢失 |`
  - `value-stagger-gradient.md:38` `| 单柱行程 | 窗 0.22（≈33f，outCubic） | 行程是总错峰的 0.73 倍 → 大部分时间十来根同时在动；行程 < 错峰总量时变成一根接一根 |`
  - `value-stagger-gradient.md:42` `| 第二拍原点 | 'from:'center''，'distC*0.13' | 0.13 是从中心到端点的传播延迟（≈4f）；归零则整排同时脉冲，'from' 参数就没有意义了 |`
  - `value-stagger-gradient.md:49` `- 端点柱的第二拍窗口是 '0.69→0.87'，之后到 t=1 有约 0.13（20f）的完全静止。这是给`
- 可逆: 没有帧采样. 当静态夹具.
- 裁决: 首页采用或只留规则. 一镜一个主角, 飞入必须落进真实槽位.
