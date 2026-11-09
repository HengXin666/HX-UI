# CHECKPOINT: react-bits 余量 (Components 48 件)

接手先读这份, 再读 `.hark/plan.md` (git 忽略, 用 `hxfs plan` 提交). 本文件随每段落定更新.

## 顺序

controls 15 件 (已齐) → kits gallery 11 (已齐) → kits stack 8 + glass 2 (已齐) → kits card 9 (已齐) + stage3d 3 → 收口 (./controls ./kits 子路径, api 快照, 0.10.0, docs-props, gates:push) → surface 余量 30 件.
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

位置 `src/kits/card/`, 测试 `tests/kits/card/` (support.ts 转出 stack support, 补 boxOf), note `.agents/notes/implemented/feature/2026-11-10-kits-card.md`. card tokens 转出 stack tokens. FoilCard 的光谱用 CSS 颜色关键字 (royalblue 等), 不是语义色, note 里写了理由.

## 下一步

kits stage3d 3 (Lanyard, ModelViewer, InfiniteMenu): 不引 three, 缺顶点通道 / 模型加载的部分标 ENGINE-GAP 并写清缺什么 (用户裁定). 做完单独报一次.

## 收口待办 (不要提前做)

- `tallyOvershoot` 缓存 Map 无上限, 考虑量化键或 LRU.
- 老控件 ring-1 统一换 FOCUS_RING; nav / menu 之外各族 tokens 里的 cubic-bezier 副本 (choice/tone, press/tokens, range/tokens, compose/tokens, dismiss/tokens) 改引用 CURVE.
- motion 出口加 CURVE / cssCurve, 升 0.10.0.
- 各族帧循环 (use-nav-motion, range motion.ts 等) 并进 src/motion; nav / gallery / stack / glass 的族 tokens 合并.
- `tests/kits/support.ts` 与 `tests/kits/stack/support.ts` 合并进公共测试支持.
- `use-drag.ts` 补单测; BlendSlider 测试的 fake Animation 补 `finish()`.

## 已知坑

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
