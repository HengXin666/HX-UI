# CHECKPOINT: react-bits 余量 (Components 48 件)

接手先读这份, 再读 `.hark/plan.md` (git 忽略, 用 `hxfs plan` 提交). 本文件随每段落定更新.

## 文档站批 0 (基础设施八项, 2026-11-11 起, 不做任何组件页)

对表口径 (scripts/docs-catalog/coverage.ts): 件 = 一个源文件里的全部组件导出 (含拆分文件, 见 exports.ts); 页认领 = catalog.src.json 的 exports + 同 id 组件页定义的 importName/parts.
四个数用 `env TMPDIR=/tmp npx tsx scripts/docs-catalog.ts --report` 重算.

| 项 | 内容 | 提交 |
|---|---|---|
| 1 | 对表脚本 + 目录源 catalog.src.json (照改版前目录 1:1); 改版前: 有页 197 / 没页 244 / 页指向不存在导出 0 / 一件两处 29 | 37e91bb |
| 2 | scripts/docs-catalog.ts 生成 catalog.gen.json (--check / --report); 门面左栏, 搜索, 计数, 上下页, 索引只读它, nav.ts 不进门面; 单源化后一件两处 0 | 21cbb77 |
| 3 | docs-coverage 门禁 (docs 组, 第 14 条): 页指向不存在导出 / 一件两处 / gen 不同步即 FAIL; 没页只报数, 组件批次清零后加 --require-pages; 白名单 docs-coverage-allow.json 为空 | 5f9650c |
| 4 | 展示画廊只留 #/gallery (删去与 #/viz, #/page 重复的两格与无人引用的 home-show.tsx) | 28def82 |
| 5 | 左栏折叠高度过渡 + 减弱动效直切 + 默认展开当前组; 每组 <= 12 件, 超了在 catalog.src.json 拆 subgroups (浮层与菜单, 页面版式, 模板) | 60cc594 |
| 6 | specs 拆成 specs/<层>/<组>/<id>.tsx + 每组 index.ts; 旧文件在收尾提交删除 | 5c510ed |
| 7 | docs-props 改用共用递归扫描 (scripts/docs-catalog/specs.ts), 缺属性即失败, 下限 225 / 子路径 200 | 8ec280e |
| 页型 | kinds/KindPage 四种页型模板替换 GenericPage; 三层 199 件全进左栏 / 搜索 / 上下页 (没写页的件只给 import 与 Props) | 202d21b |
| 8 | 三层各一总览页; scripts/docs-thumbs.ts 在 docs/dist 上 playwright 真跑拍图 (docs: npm run build:site), 拍不了的不出图 | d5b2c90 |
| 收尾 | 删旧 specs 文件与 GenericPage; 三个总览组改名 "<层> 总览" | (本提交) |

改版后四个数: 有页 197 / 没页 244 / 页指向不存在导出 0 / 一件两处 0. 没页 244 = surface 116 + kits 33 + controls 50 + base 45, 批 0 不做组件页, 由组件批次清零 (清零后 docs-coverage 加 --require-pages).
缩略图本地实跑 199 件拍成 126 / 拍不了 73 (默认参数抛错或空画面); pages.yml 仍是 npm run build, 要上线缩略图得改 CI (装 playwright chromium + build:site), 待用户定.

## 文档站批 1 (base 层 按钮 / 表单 / 浮层 20 件, 2026-11-12 起)

20 篇组件页定义 (specs/base/<组>/<id>.tsx) 常驻工作区, 每满 5 篇一个提交; 每个提交的 index.ts 只含已提交件 + 本批件, props.gen.json 同批重生成.
注意: docs-props 门禁按工作区扫描 specs 目录, 20 篇草稿都在盘上, 所以 879048f 起 props.gen.json 已含全部 20 篇的属性 (比当批 specs 多); 第 4 批提交后与 specs 完全对上. catalog.gen.json 不变 (base 件原本就 page:true).

| 批 | 件 | 提交 |
|---|---|---|
| 1 | button-group, toggle-group, segmented-control, input-otp, field | 879048f |
| 2 | label, checkbox, radio-group, slider, alert-dialog | (本提交) |

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

**已推到 18f47bd (0.17.0, 按序补做 7 件全部完成). Animations 段已收口 (2026-11-11 00:10). 交接见下方 "交接 (2026-11-11)".** 用户 2026-11-10 定: 每段做完立刻单独一个接入提交 (导出, api 快照, minor 版本, CHANGELOG, docs-props), 不攒到最后.
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
  3. ~~FiberStrands: listening 与 ROLES 7 分角色着色~~ 已做 (默认关, 拒权 / 不支持退回 level, data-listening 标状态).
  4. ~~SpringMesh: 多点抓取~~ 已做 (上限 4 槽, parts/mesh-grabs).
  5. ~~SoftShape: 失焦改真高斯~~ 已做 (形状遍 + 横纵两遍高斯, 上屏按透镜插值).
  6. ~~SparkMark: 脉冲沿轮廓改弧长参数~~ 已做 (parts/spark-map 轮廓参数图, CELL 4).
  7. ~~SparkMark: PIXEL_BUDGET 与预模糊辉光~~ 已做 (pixelBudgetDpr; 辉光烘在参数图 B 通道). 用户 2026-11-10 23:37 定为未落项, 组件文件头 / field note / CHANGELOG 已一致.
- ENGINE-GAP 复核 (2026-11-10 定, 组件文件头 / note / CHANGELOG 0.16.0 一致): SoftShape 失焦近似不标 (不涉顶点 / 实例化 / 深度, 真高斯排在上面第 5 件); SparkMark 的 PIXEL_BUDGET 与预模糊辉光不标 ENGINE-GAP, 用户定为未落项已补 (第 7 件), 脉冲极角是未落项已补 (第 6 件); PrismOrb 的 PIXEL_BUDGET 同样不算 ENGINE-GAP, 文件头措辞已改.
- ~~CubeField gridSize 上限~~ 已做 (按序待办第 7 条之一): 状态改走 RGBA8 数据纹理 (16 位倾角), 不需要内核浮点纹理, 上限 13 放到 64.
- **按序待办 (用户 2026-11-11 00:12 定, 每件单独提交, 门禁 13/13, 不 push)**:
  1. ~~DotReveal: 底色覆盖 prop~~ 已做 (`keyColor` 0..1 RGB 三元组, 接线 parts/dot `dotKey`, 单测在 dot.test.tsx).
  2. ~~SparkMark: 规格的 2d 画布逐帧层~~ 代码已做 921c069 (onRender). 欠: tests/surface/field/spark-layer.test.tsx, CHANGELOG onRender 条, field note "仍没有落的: 2d 画布逐帧层" 改写; hover.y 翻转未实测.
  3. ~~FiberStrands: fp 抗锯齿~~ 已做 144541a (sg = sqrt((0.25 th)^2 + fp^2), 本库定, scene note 已写). 欠: 锁 fp 接线的测试, CHANGELOG 条.
  4. ~~PrismOrb: PIXEL_BUDGET~~ 已做 bc98e63. 原文: PIXEL_BUDGET 4.5e6 真做 (照 SparkMark `pixelBudgetDpr` 的做法, 经 setState 作内核 dpr), 再把文件头 / scene note / CHANGELOG 改成 "未落项, 已补" 写法 (现文件头第 5 行写的是 "由 dpr 上限与 maxEdge 代替", 未实现前不能写已补).
  5. ~~HazeCursor 烟团老化~~ 已做 95664e3 (寿命 (0.12 + trailLength x 0.022) x ln50 x sqrt(size / 80), 夹 0.4..12 秒, 末 30% 淡出). 原文: 用户定为真漏做, 补老化 (1530d2d 里的测试锁定了不老化, 要一起改).
  6. ~~实测~~ 已做 cdf0cbf (SparkMark dpr) 与 81821b4 (SoftShape 帧耗); 由此发现 blur 0 仍跑离屏, 已修 fd8be0d. 原文: (a) SparkMark PIXEL_BUDGET 经 setState 在帧回调里改 dpr 的路径 (真实浏览器, 记录不同宿主面积下的 dpr 与画布尺寸); (b) SoftShape 每帧多 3 遍离屏的帧耗 (开 / 关 blur 对比). field note 写数字.
  7. 再往下: 本节后面 "收尾" 六条, 按原顺序.
- 用户 2026-11-11 已定 (无需再问): SpringMesh 保留 touch-action: none; FiberStrands 7 角色保留本库定义; DotReveal 四角平均底色可以 (但要可覆盖, 见上第 1 条); Halo/Haze 的 RGBA8 ENGINE-GAP 标签三处保留 (算引擎能力限制, 不是漏做); packSplats 等通用名不进族 index, 维持现做法.
- ~~`tallyOvershoot` 缓存 Map 无上限~~ 已做 (收尾第 2 条): 键量化为目标过冲的 1000 档, 缓存至多 1000 条.
- ~~各族 cubic-bezier 副本改引用 CURVE~~ 已做 (收尾第 3 条): choice/tone, press, range, compose, dismiss 五处; CURVE 加 backOut. 留在范围外的: evade-math 按 bounce 现拼曲线 (参数化, 不算副本), primitives/slider, primitives/motion, layout/CollapsePanel 的老写法.
- ~~各族帧循环并进 src/motion, 族 tokens 合并~~ 已做 (收尾第 4 条, b042d3d..本批末提交): 动值表与帧工具在 src/motion/drive/{glide,use-motion-table}.ts, kits 公共名在 src/kits/tokens.ts; range 已无自有 motion.ts (早先已走 motion/frame). 规矩 (用户 2026-11-11 22:47): 跨族合并一族一提交, 旧文件留到最后一个提交删, 工作区不长时间红.
- ~~`tests/kits/support.ts` 与 `tests/kits/stack/support.ts` 合并~~ 已做 (收尾第 5 条, b4f5eed..本批末提交): kits 公共测试支持在 tests/kits/support.ts (nav 的三样 + fakeIntersection); card / stage3d 的 support 只补 boxOf 并转出.
- ~~`use-drag.ts` 补单测; BlendSlider 测试的 fake Animation 补 `finish()`~~ 已做 (收尾第 6 条): tests/kits/gallery/use-drag.test.ts 四例; nav support 的 spyAnimate 假动画补 finish() (派发 finish 事件) 与真实的事件表, BlendSlider 补 "转场中再翻页" 一例. 收尾六条齐.

## 交接 (2026-11-11)

- 已完成: Animations A/B/C/D 四段 + Halo/Haze 补做 + 按序补做 7 件 + 收口 (0274103), 已推. 1bfd17d (总账计数更正) 与本次 CHECKPOINT 提交在本地, 待推.
- 正在做: 无. 按序待办第 1 条已提交 (见 git log), 用户要求每条做完报一次再推.
- 下一步: "按序待办" 第 2 条 SparkMark 的 2d 画布逐帧层 (先重读 docs/research/catalog/animations.md 的 SparkMark 对应条目, 看 2d 层画什么), 之后按序. 第 4 条 PrismOrb 要先真做 PIXEL_BUDGET 再改文件头.
- 接手第一步: 装 hxfs (见已知坑), `git log --oneline -3` 确认 HEAD 是 DotReveal keyColor 提交 (feat(surface/scene): DotReveal 补 keyColor), 读本节与 "按序待办", 从第 2 条做起: 看 `src/surface/field/SparkMark.tsx` 与 `parts/spark-map.ts`, 2d 层用内核 `useCanvasBackdrop` 或宿主内一张 Canvas2D, 注意 SparkMark.tsx 166 行, 超 250 就拆 parts.
- 总账 (0.17.0, 读 scripts/gates/baselines/api-surface.txt): 根入口 1608 符号; 子路径 surface 769, kits 290, controls 214, motion 159, backgrounds 136, hxbrowser 85, viz 56, hxbrowser/protocol 37, studio 34, page 23, blocks 1; 合计 3412. ENGINE-GAP: 标签 34 个文件 / 35 处 (`grep -rln 'ENGINE-GAP:' src`; surface 10, kits 13, controls 11); 另 18 个文件以别的写法提到 ENGINE-GAP (含 "不标" 说明).

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
