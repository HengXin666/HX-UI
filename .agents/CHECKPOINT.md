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

## 状态: 收口完成并已推送 (8048ab1, 2026-11-10 pre-push 20/20); surface 未开工

`src/controls/index.ts`, `src/kits/index.ts` 汇各族; package.json exports 加 `./controls`, `./kits`, 版本 0.10.0 (lock 同步); motion 出口加 CURVE / cssCurve / CurveName; docs-props 全量抽两条子路径; api 快照按子路径分段并重记 0.10.0 哈希; CHANGELOG 0.10.0 段. note `.agents/notes/implemented/architecture/2026-11-10-controls-kits-entries.md`.

## 正在做

无. 收口 8048ab1 已由用户推送 (2026-11-10 01:31 CST). surface 30 件用户已下令开工, 但尚未写任何代码.

## 下一步: surface 余量 30 件 (用户 2026-11-10 裁定)

- 范围: Animations 余 24 件 + HalftoneReveal + DitherVeil (共 26); TextAnimations 4 件: DepthText, EchoText, TechText, TextCursor. 规格见 docs/research/catalog/components-{1,2}.md, 先列出 Animations 余 24 件的规格名 -> HX 名映射, 记入本文件.
- 顺序: 先 TextAnimations 4 件, 再 Animations (沿用本文件既有顺序; 如无则按 catalog 顺序).
- 规矩: 只借规格的常数与 props 自写, 不移植代码; 内核公共头 (src/index.ts 等公共导出头) 不改; 需要顶点着色或实例化渲染的标 ENGINE-GAP 并写清缺什么. 每件单独提交 (pre-commit 13/13 + 本件 vitest), 不 push; 每段 (Text 4 件一段, Animations 分段) 完成后报告用户一次, 用户推.
- 颜色/焦点环/曲线规则同 kits (见已知坑).
- 收口遗留待核 (已随 8048ab1 推出): api 快照根段是否误含 ArcField/ArcFieldProps (根段应为 1608); CHANGELOG 0.10.0 的 controls 件名清单; 单跑 npx vitest run tests/kits tests/motion tests/controls. 开 surface 前先查, 有误单独 fix 提交. 下面 "后续收尾" 里的项 (族 tokens 并入 src/motion 等) 另排.

## 后续收尾 (本次收口未做)

- `tallyOvershoot` 缓存 Map 无上限, 考虑量化键或 LRU.
- 老控件 ring-1 统一换 FOCUS_RING; nav / menu 之外各族 tokens 里的 cubic-bezier 副本 (choice/tone, press/tokens, range/tokens, compose/tokens, dismiss/tokens) 改引用 CURVE.
- 各族帧循环 (use-nav-motion, range motion.ts 等) 并进 src/motion; nav / gallery / stack / glass 的族 tokens 合并.
- `tests/kits/support.ts` 与 `tests/kits/stack/support.ts` 合并进公共测试支持.
- `use-drag.ts` 补单测; BlendSlider 测试的 fake Animation 补 `finish()`.

## 已知坑

- 门禁 smoke 要 `TMPDIR=/tmp` (lane 的 TMPDIR 路径过长, chromium 崩, 128 页 0B).
- 沙箱 home 重置后 hxfs 消失: `curl -fsSL https://fs.lolioa.com/.hxfs/71d06cb7fe8b4f7f14ad | sh`.

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
