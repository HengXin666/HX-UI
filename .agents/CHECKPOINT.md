# CHECKPOINT: react-bits 余量 (Components 48 件)

接手先读这份, 再读 `.hark/plan.md` (git 忽略, 用 `hxfs plan` 提交). 本文件随每段落定更新.

## 顺序

controls 15 件 (已齐) → kits gallery 11 (已齐) → kits stack 8 + glass 2 (已齐) → kits card 9 (已齐) + stage3d 3 (已齐) → 收口 (./controls ./kits 子路径, api 快照, 0.10.0, docs-props, gates:push; 已完成 2026-11-10) → surface 余量 30 件.
推送由用户做, 这里只 commit. 每件单独提交, pre-commit 13/13 + 本件 vitest 全绿才提.

## 已裁定 (不再待定)

- 焦点环: outline 1px + offset 2px + ring 色, 代码只引用 `craft/tokens.ts` 的 `FOCUS_RING`. craft.md 已写「焦点环与线宽」. 不改 rules, 不改 baseline. 已提交的老控件 ring-1 在收口统一换.
- 曲线: craft EASE 之外的规格曲线收在 `src/motion/curves.ts` (`CURVE`: outQuint, outStrong, inOutQuart, backOutSoft, lift, popOut, outQuart, outCubic, inQuart, flow, outExpo, inOutCubic, settle), 族内不留 cubic-bezier 副本. GSAP powerN 对应 N+1 次 (power2 = outCubic, power3 = outQuart / inQuart, power4 = outQuint); back.out 用 craft `EASE.overshoot`. 暂不进 motion 公共出口, 收口 0.10.0 一并导出并 `check-api-snapshot --update`.
- TallyRoll 过冲: 在 tallyOvershoot 内按实际峰值反解到 ≤ 0.06 位, 不放宽合同.
- 规格里的 WebGL 场 (GooeyNav, GlassIcons) 不照搬: SVG 黏液滤镜 / backdrop-blur, 代码里 ENGINE-GAP 标出.

## 状态: controls 15 件 (全部已提, 门禁 13/13)

| 规格 | HX 名 | 位置 | 提交 |
|---|---|---|---|
| (基础) | CURVE / FOCUS_RING | motion/curves.ts, craft/tokens.ts | 9c908a0 |
| SpecularButton | GlintButton | press/signal | c5989ec |
| Counter | TallyRoll | range/meter | 4e4d5e0 |
| ElasticSlider | StretchSlider | range/input | 110a4da |
| CurvedInput | ArcField | compose/input | b0ba79f |
| OptionWheel | ReelPicker | choice/pick | ec41d3b |
| Stepper | StepTrail | choice/steps | a5a8ad1 |
| PillNav, Dock | PillTabs, MagnifyDock (+ nav tokens 改引用) | nav/bar, nav/dock | 11e1b09 |
| LineSidebar | ProximityRail | nav/rail | 7ded6ea |
| GooeyNav | GooTabs | nav/bar | 2fd78c1 |
| GlassIcons | GlassTiles | nav/tile | aad4add |
| BubbleMenu | PillBurst (+ menu 共用 use-menu-open, LinkOrButton) | nav/menu | f4dae38 |
| CardNav | DeckNav | nav/menu | ba20b0b |
| StaggeredMenu | LayerDrawer | nav/menu | efa93be |
| FlowingMenu | MarqueeRows | nav/menu | 2786ea5 |

各族 note: `.agents/notes/implemented/feature/2026-11-08-controls-{press,range,compose,choice}.md`, `2026-11-09-controls-nav.md`.

## 状态: kits gallery 11 件 (全部已提, 门禁 13/13)

| 规格 | HX 名 | 提交 |
|---|---|---|
| AccordionGallery | FoldGallery (+ 族 tokens) | 2854e46 |
| Carousel | SpringCarousel (+ parts/use-drag) | ca582db |
| CircularCarousel | RingCarousel | 9a0bd97 |
| CircularGallery | BendGallery (ENGINE-GAP) | 339e579 |
| DepthCarousel | DepthDeck | 95e17f4 |
| DomeGallery | SphereWall | 939f527 |
| FlexCarousel | FlexReel (ENGINE-GAP) | a1469dc |
| MorphSlider | BlendSlider (ENGINE-GAP, CURVE 补 outExpo / inOutCubic) | 007e932 |
| InfiniteSpiral | HelixScroll | 51eaf23 |
| FlyingPosters | PosterFlight (ENGINE-GAP) | 01cde77 |
| DriftWall | DriftColumns | f087651 |

位置 `src/kits/gallery/`, 测试 `tests/kits/gallery/`, note `.agents/notes/implemented/feature/2026-11-09-kits-gallery.md`. 族 tokens 目前转出导航族的工具 (useNavMotion 等), 收口并进 src/motion. 只维护族 index.ts; src/kits/index.ts 与 ./kits 子路径, package.json 一律留到收口 (用户裁定).

## 状态: kits stack 8 件 + glass 2 件 (全部已提, 门禁 13/13)

| 规格 | HX 名 | 提交 |
|---|---|---|
| AnimatedList | PopList (+ 族 tokens, parts/list-spec) | a956a6d |
| ScrollStack | ScrollPile | 553ef36 |
| Stack | SwipeStack | 67c75ea |
| CardSwap | CycleDeck | 5e2a795 |
| BounceCards | SpreadCards | 25bd3ae |
| Masonry | FlowMasonry (CURVE 补 settle) | 501bc5d |
| ChromaGrid | TintGrid | a0dedeb |
| MagicBento | GlowBento (不做粒子星点) | cca4bb0 |
| FluidGlass | LensGlass (+ glass tokens, ENGINE-GAP) | 8008e9b |
| GlassSurface | FrostPanel (ENGINE-GAP) | f793d4b |

位置 `src/kits/stack/`, `src/kits/glass/`, 测试 `tests/kits/stack/`, `tests/kits/glass/`, note `.agents/notes/implemented/feature/2026-11-10-kits-{stack,glass}.md`. stack tokens 转出 gallery tokens 与 use-drag, 补 omegaSpring / bounceSpring / TAU; glass tokens 转出 stack tokens. 测试支持 `tests/kits/stack/support.ts` (含假 IntersectionObserver), glass 测试也引它.

## 状态: kits card 9 件 (全部已提, 门禁 13/13)

| 规格 | HX 名 | 提交 |
|---|---|---|
| SpotlightCard | LampCard (+ 族 tokens: follow, cardPoint) | 778e1e7 |
| BorderGlow | EdgeGlow | 7531778 |
| TiltedCard | TiltCard (+ parts/tilt 族内共用倾斜) | a3b06ef |
| ProfileCard | BadgeCard | d349c4d |
| PixelCard | PixelBloom (canvas2d) | 47573c3 |
| HoloCard | FoilCard (ENGINE-GAP) | 0a4e61e |
| ReflectiveCard | MirrorCard (ENGINE-GAP) | c6fed2f |
| DecayCard | FrayCard (ENGINE-GAP) | 28f2c0c |
| Folder | FileFolder (ENGINE-GAP) | 1d314e6 |

位置 `src/kits/card/`, 测试 `tests/kits/card/` (support.ts 转出 stack support, 补 boxOf), note `.agents/notes/implemented/feature/2026-11-10-kits-card.md`. card tokens 转出 stack tokens. FoilCard 的光谱引用 tokens.css 新增的 --spectrum-1..6 (亮暗两套).

## 状态: kits stage3d 3 件 (全部已提, 门禁 13/13)

| 规格 | HX 名 | 提交 |
|---|---|---|
| Lanyard | SwingLanyard (+ 族 tokens: decayToward; 2D 绳索 parts/rope) | 02bf521 |
| ModelViewer | OrbitViewer (不加载模型) | 67afeb7 |
| InfiniteMenu | SphereMenu (DOM 球面) | 7eed988 |

三件都标 ENGINE-GAP (缺顶点通道, 网格, 模型加载, 实例化渲染), 见 `.agents/notes/implemented/feature/2026-11-10-kits-stage3d.md`.

## 状态: 收口完成并已推送 (8048ab1, 2026-11-10 pre-push 20/20)

`src/controls/index.ts`, `src/kits/index.ts` 汇各族; package.json exports 加 `./controls`, `./kits`, 版本 0.10.0 (lock 同步); motion 出口加 CURVE / cssCurve / CurveName; docs-props 全量抽两条子路径; api 快照按子路径分段并重记 0.10.0 哈希; CHANGELOG 0.10.0 段. note `.agents/notes/implemented/architecture/2026-11-10-controls-kits-entries.md`. 收口遗留三项 (根段 1608 无 ArcField, CHANGELOG 件名, vitest 527/527) 已核清.

## 状态: surface Text 4 件 (全部已提, 门禁 13/13, 已推)

| 规格 | HX 名 | 提交 |
|---|---|---|
| DepthText | ExtrudeText (新开 text/pointer 族 + tokens) | 692f600 |
| EchoText | WakeText | 19de31b |
| TechText | DraftText (DOM + SVG, 不用画布) | d86a8b3 |
| TextCursor | StampTrail (区域组件, 包 children) | 6314864 |

位置 `src/surface/text/pointer/`, 测试 `tests/surface/text/pointer-{extrude,wake,draft,stamp}.test.tsx` (pointer 族 33 测, text 全量 72/72), note `.agents/notes/implemented/feature/2026-11-10-surface-text-pointer.md`. 颜色只收语义 token 名 (ExtrudeTone), 落成 var(--name).
接入: f63f04c (src/surface/index.ts 加 ./text/pointer, api 快照 ./surface 422 / 根段 1608, 0.11.0, CHANGELOG 0.11.0). 用户已推到 69aaee8 (20/20); f63f04c 起未推.

## 正在做: Animations 26 件 (用户 2026-11-10 02:01 裁定)

分段提交, 每段齐了报用户一次, 用户推. 段内每件单独提交 (pre-commit 13/13 + 本件 vitest), 不 push. 段内只维护各自族 index, 段尾一次性接 surface 导出 + api 快照 + 升 minor 版本 + CHANGELOG, 单独一个接入提交 (同 f63f04c 的做法).
已做过的 12 件不再做: AnimatedContent / FadeContent (motion/Reveal), ClickSpark (TapSparks), Crosshair (ReticleLines), GlareHover (SheenCard), ImageTrail (PhotoWake), Magnet (Attract), TargetCursor (LockOnCursor), GradualBlur (EdgeBlur), PixelSwap / PixelTransition (TileFlip, MosaicSwap), ScrollExpand (ScrollWiden).

规格名 -> HX 名 (规格见 docs/research/catalog/animations.md):

| 段 | 规格 | HX 名 | 状态 |
|---|---|---|---|
| A | LogoLoop | MarkRail | c6424d0 (src/surface/loop) |
| A | OrbitImages | OrbitRing | 4d86a91 (loop) |
| A | StarBorder | CometBorder | 734515a (src/surface/edge) |
| A | Noise | GrainLayer | 444cd32 (src/surface/texture) |
| A | StickerPeel | PeelSticker | 18f77c1 (src/surface/sticker, ENGINE-GAP 卷曲) |
| A | ElectricBorder | SparkEdge | c984bc0 (edge) |
| A | PixelTrail | CellTrail | e59b700 (src/surface/pointer, 未进族 index) |
| B | BlobCursor | MeldCursor | 7b47c90 (src/surface/cursor) |
| B | GlowCursor | HaloCursor | 6985f92 (src/surface/cursor) |
| B | GhostCursor | HazeCursor | 569d8f6 (src/surface/cursor) |
| B | SwarmCursor | FlockCursor | f7a60bd (src/surface/cursor, ENGINE-GAP 实例化, 761acdb 补标) |
| B | Ribbons | StreamerCursor | 48c5841 (src/surface/cursor) |
| B | CursorGrid | NudgeGrid | 3fdf64a (src/surface/cursor) |
| C | SplashCursor | InkSplash | b0de291 (src/surface/field, ENGINE-GAP 半浮点回退) |
| C | MetaBalls | MergeBlobs | 57427bd (src/surface/field) |
| C | MetallicPaint | ChromeMark | 4c046af (src/surface/field) |
| C | LaserFlow | BeamFlow | d27351b (src/surface/field) |
| C | RippleDistortion | RippleLens | 3fc0913 (src/surface/field) |
| C | ShapeBlur | SoftShape | cc96229 (src/surface/field) |
| C | ElectricLogo | SparkMark | 36ca12f (src/surface/field) |
| D | HalftoneReveal | DotReveal | 65bed6c (src/surface/scene) |
| D | DitherVeil | BayerVeil | 676ee44 (scene) |
| D | CrystalizedBall | PrismOrb | 58c81f2 (scene, ENGINE-GAP 尘埃实例化粒子) |
| D | Cubes | CubeField | be3d9b5 (scene, ENGINE-GAP 实例化网格, gridSize 上限 13) |
| D | ElasticMesh | SpringMesh | 0e80222 (scene, ENGINE-GAP 质点弹簧网格顶点变形) |
| D | Strands | FiberStrands | fdc0122 (scene) |

**A, B, C, D 段已推 (到 f473510, 0.15.0). HaloCursor / HazeCursor 补做 1530d2d (0.16.0) 与 ENGINE-GAP 复核已提本地, 待用户推. ring-1 → FOCUS_RING 已提本地. 下一步按 "按序补做" 清单第 2 件起.** 用户 2026-11-10 定: 每段做完立刻单独一个接入提交 (导出, api 快照, minor 版本, CHANGELOG, docs-props), 不攒到最后.
接入时查 export * 撞名 (tsc TS2308): 族内通用小工具 (clamp, mix, seededRandom, wrapOffset 之类) 不进族 index 或改名.
注意: pointer 族已接在 ./surface 上, 段内往它的 index 加导出会改 api 快照 (门禁 4/13 会拦), 所以段内新件放已接入的族时先不进族 index.
B 段读规格时先看技法: 这几件大多是 WebGL 场, 用 Canvas2D 或 DOM 做近似, 真需要顶点 / 实例化的标 ENGINE-GAP.
分段按技法粗分 (A DOM/SVG/Canvas2D, B 光标画布, C WebGL 片元, D reveal 与 3D), 读到规格后可微调, 改了就改本表.
- 规矩: 只借规格的常数与 props 自写; 内核公共头不改; 需要顶点着色或实例化渲染的标 ENGINE-GAP 并写清缺什么; 颜色只走语义 token; 不引 three.
- **已补做 (1530d2d, 0.16.0)**: HaloCursor 与 HazeCursor 的流体 / 烟雾场目前是 Canvas2D 近似; 改走内核 `useShaderBackdrop` + `ShaderSpec.passes` 乒乓通道 (参照 InkSplash 的速度 / 散度 / 压力 / 染料与 bloomPyramid), 补上规格的 bloom、grain、quality 等未落 props, 改 cursor note 的 "没有落的" 行与 CHANGELOG.
- **已做 (见按序补做第 1 件)**: 已提交老控件的 ring-1 统一换 FOCUS_RING.

## 后续收尾 (本次收口未做)

- **按序补做 (用户 2026-11-10 23:25 定: 未落项不是只记下, 按这个顺序一件件做, 每件单独提交)**:
  1. ~~老控件 ring-1 统一换 FOCUS_RING~~ 已做 (src/controls 26 个文件, 27 处; ring-inset 的 3 处用 FOCUS_RING 加 focus-visible:-outline-offset-1 内收; primitives 的 shadcn 对齐件不在范围, 仍是 ring-1).
  2. ~~DotReveal: 抠像 (uMatte / uKey) 与 fit~~ 已做 (fit + keyOut, 底色取四角).
  3. FiberStrands: listening (麦克风电平, getUserMedia + AnalyserNode, 默认关, 拒权时退回 level) 与 ROLES 7 分角色着色.
  4. SpringMesh: 多点抓取 (多指针各一个抓取点).
  5. SoftShape: 失焦改真高斯 (内核 passes 两遍可分离模糊, 对应规格 uFieldTexture 两遍).
  6. SparkMark: 脉冲沿轮廓改弧长参数 (替掉极角近似, 凹形图形上沿边走).
- ENGINE-GAP 复核 (2026-11-10 定, 组件文件头 / note / CHANGELOG 0.16.0 一致): SoftShape 失焦近似不标 (不涉顶点 / 实例化 / 深度, 真高斯排在上面第 5 件); SparkMark 的 PIXEL_BUDGET 与预模糊辉光 / 2d 画布逐帧层不标, 是有意替代不再补, 脉冲极角是未落项 (第 6 件); PrismOrb 的 PIXEL_BUDGET 同样不算 ENGINE-GAP, 文件头措辞已改.
- 内核若加浮点数据纹理上传, CubeField 的 gridSize 上限 13 可放开.

- `tallyOvershoot` 缓存 Map 无上限, 考虑量化键或 LRU.
- nav / menu 之外各族 tokens 里的 cubic-bezier 副本 (choice/tone, press/tokens, range/tokens, compose/tokens, dismiss/tokens) 改引用 CURVE.
- 各族帧循环 (use-nav-motion, range motion.ts 等) 并进 src/motion; nav / gallery / stack / glass 的族 tokens 合并.
- `tests/kits/support.ts` 与 `tests/kits/stack/support.ts` 合并进公共测试支持.
- `use-drag.ts` 补单测; BlendSlider 测试的 fake Animation 补 `finish()`.

## 已知坑

- 提交信息文件要用 lane 绝对路径: `git commit -F /home/hx/Loli/code/AI-Code/gpt-json-to-token/HX-Jungle/var/hark-scratch/team-3e95a864-030c-4206-9a5d-9e26522abdac/m-xxx.txt` (`hxfs put scratch/...` 写到 lane, 仓库里的相对 scratch/ 不存在, commit 会在门禁跑完后才报读不到文件).
- hxfs exec 不许 `git rm`; 删文件先 `rm`, 再 `git add -A -- <目录>`.
- 单跑门禁脚本要 `env TMPDIR=/tmp npx tsx scripts/gates/frontend/check-line-budget.ts` (tsx 的 IPC 管道在 lane TMPDIR 下路径过长).
- 测试文件也受 line-budget 250 行; 一族多件时按件拆测试文件.
- 假时钟下 `await toHaveNoSeriousA11yViolations()` 会超时: 先 `vi.useRealTimers()` 再 await.
- 沙箱重置会清掉 /workspace/work 下的本地草稿: 写完立刻 put 进仓库, 别留本地.

- 门禁 smoke 要 `TMPDIR=/tmp` (lane 的 TMPDIR 路径过长, chromium 崩, 128 页 0B).
- 沙箱 home 重置后 hxfs 消失: `curl -fsSL https://fs.lolioa.com/.hxfs/a90ac7468961d18caa44 | sh (installer 写 ~/.bashrc 会报 Permission denied, 无碍; 用 `export PATH=$HOME/.hxfs/bin:$PATH`)`.

- hxfs exec 首词白名单: 不能 `bash`; 多步用 `git ... && ...` 直接串. 提交: `git add -- <files> && git commit -q -F <scratch>/msg`, msg 经 `hxfs put scratch/...`.
- hxfs put 不建目录: 新目录先 `hxfs exec "mkdir -p ..."`.
- hxfs 桥接偶发 502, 等 1 到 2 分钟再试, 别快速重发.
- 新 sandbox home 会重置, 先装 hxfs, 二进制在 `~/.hxfs/bin/hxfs`.
- useReducedMotion 首帧恒为 false: 挂上即播的入场 / 描画要在动之前同步再查 `prefersReducedMotion()` (StepTrail, GlassTiles, MarqueeRows 都这样做).
- ui-rules 的 BUTTON-TYPE 静态检查看不到展开属性里的 type: 链接或按钮用 `nav/parts/link-or-button.tsx` 的 LinkOrButton, 不要写动态 Tag.
- line-budget: tsx ≤ 250 行, ts ≤ 450.
- 测试里 vi.useFakeTimers 要放在 manualFrames 之前并只 fake setTimeout / clearTimeout, 否则与 performance.now 的 spy 互相包裹, 栈溢出.
- kits 测试共用 `tests/kits/support.ts` (转出 nav 的 manualFrames 等). setState 发生在 rAF 回调里时, 测试里 flush 要包 act.
- 同一 index.ts 分件提交时先删掉别的件的导出行, 提完补回.
- ui-rules 的 HEX / RGB 规则扫整个 src (含 .ts 与字符串): 阴影, 遮罩, SVG 位移图一律用 token, color-mix 或 CSS 颜色关键字 (black / white / red / transparent).
- jsdom 的 Event.timeStamp 恒为 0, 拖拽速度测试要 spy performance.now; cssstyle 会丢掉含 color-mix 的 background 简写, 测试改读自定义属性.
- 规格只取 `docs/research/catalog/components-1.md` / `components-2.md`; 上游 MIT + Commons Clause, 只当规格, 自写自命名.
