# Changelog

本文件记录 `@hx/ui` 每个版本对使用方可见的变化. 格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/), 版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/). 版本规则, 废弃流程与迁移段写法见 `docs/reference/versioning.md`.

每个版本按 Added / Changed / Deprecated / Removed / Fixed / Security 分段, 没有内容的段省略. 0.x 期间 minor 允许破坏性变更, 但凡有破坏, 该版本必须带 `### Migration` 段.

## [Unreleased]

### Added

- `@hx/ui/backgrounds`: surface 层 Backgrounds 全族 64 件, 按 glow / rays / lines / grid / glyph / fluid / particles 七路组织, 全部接在 `src/surface/backgrounds` 渲染内核上 (WebGL2, 不引 three / ogl / gsap). 行为规格取自 `docs/research/catalog/backgrounds-1.md` / `-2.md`, 实现为 HX 自有. 3D 件做简化版并在文件头标 `ENGINE-GAP:`. 根入口 `src/index.ts` 不新增符号.
- `@hx/ui/surface`: surface 层子路径入口, 收 backgrounds, pointer, reveal 与 text (glyph / stagger / scroll) 各族. 根入口不收.
- 契约: `check-api-snapshot` 按 package.json 的每个子路径入口分段展开 (原先只展开根入口); `docs-props` 对 `./backgrounds` 与 `./surface` 全量抽 props.
- `@hx/ui/studio`: 镜头 (`Shot`, `ShotSequence`, `ShotPlate`, `ShotLayer`), 指标与过程 (`Metric`, `Spark`, `Process`, `Compare`), 整页 `FieldPage` (田野) 与 `KilnPage` (窑四号). 根入口 `src/index.ts` 不新增符号. 文档站 `#/gallery` 可切换这两张整页, 镜头, 数据和原来的质感拼贴. 迁移说明见 `docs/reference/migration/studio.md`.
- `src/primitives/deprecate.ts`: `deprecate()` 工具函数, 开发环境同一条废弃只 `console.warn` 一次, 生产环境静默. 暂不进公共入口, 由 P0-Z 集成时决定是否导出.
- `docs/reference/versioning.md`: 版本与破坏性变更策略, 含 0.5 到 0.6 迁移模板.
- 本 CHANGELOG, 回填 0.1.0 到 0.5.0.

## [0.15.0] - 2026-11-10

`@hx/ui/surface` 新收 react-bits Animations 的 D 段 6 件, 开 scene 族 (揭示与立体场). 行为规格取自 `docs/research/catalog/animations.md`, 实现为 HX 自有, 组件名换成本库自己的. 全部走 backdrop 内核的 WebGL2 着色器通道 (`useShaderBackdrop`, DotReveal 用 `ShaderSpec.passes`), 不引 three / ogl / gsap. 规格里靠实例化或顶点变形的部分做片元近似并标 ENGINE-GAP: PrismOrb (尘埃的 GPGPU 实例化粒子), CubeField (实例化方块网格, gridSize 上限 13), SpringMesh (质点弹簧网格的顶点变形). 根入口 `src/index.ts` 不新增符号. 只增不删, 无迁移.

### Added

- `@hx/ui/surface` scene 族: `DotReveal` (HalftoneReveal, 半调网点揭示, 指针与点击爆开), `BayerVeil` (DitherVeil, 有序 / 误差扩散抖动面纱), `PrismOrb` (CrystalizedBall, 等离子玻璃球, 电弧与尘埃), `CubeField` (Cubes, 倾向指针的方块阵, 点击涟漪), `SpringMesh` (ElasticMesh, 可拉伸按压的充气文字或图片, balloon / chrome / jelly / clay), `FiberStrands` (Strands, 发光丝带与折射玻璃球).
- 一并导出各件的模拟纯函数与 `DOT` / `VEIL` / `PRISM` / `PRISM_PRESETS` / `CUBE` / `MESH` / `STRAND` 常数. 颜色只收语义 token 名.
- 契约: api 快照 `./surface` 段 656 到 726, docs-props 随之更新.

## [0.14.0] - 2026-11-10

`@hx/ui/surface` 新收 react-bits Animations 的 C 段 7 件, 开 field 族 (着色器场). 行为规格取自 `docs/research/catalog/animations.md`, 实现为 HX 自有, 组件名换成本库自己的. 全部走 backdrop 内核的 WebGL2 着色器通道 (`useShaderBackdrop`, 需要时用 `ShaderSpec.passes` 乒乓离屏与共用泛光金字塔), 不引 three / ogl / gsap. InkSplash 的半浮点回退精度标 ENGINE-GAP. 根入口 `src/index.ts` 不新增符号. 只增不删, 无迁移.

### Added

- `@hx/ui/surface` field 族: `InkSplash` (SplashCursor, 指针搅动的流体染料, 涡度约束与泛光), `MergeBlobs` (MetaBalls, 轨道漂移的融合球, solid / outline / contour), `ChromeMark` (MetallicPaint, 文字或图片的流动金属条纹), `BeamFlow` (LaserFlow, 落地铺开的光柱), `RippleLens` (RippleDistortion, 图片上的扩散涟漪折射), `SoftShape` (ShapeBlur, 失焦形状与对焦透镜), `SparkMark` (ElectricLogo, 沿图形轮廓的电弧与形变).
- 一并导出各件的模拟纯函数与 `INK` / `MERGE` / `CHROME` / `BEAM` / `LENS` / `SOFT` / `SPARK_MARK` 常数, 以及形状件共用的遮罩栅格化 (`rasterText`, `rasterImage`, `rasterPath`) 与距离场 (`signedDistance`, `sdfCanvas`, `sdfGlsl`). 颜色只收语义 token 名.
- 契约: api 快照 `./surface` 段 566 到 656, docs-props 随之更新.

### Fixed

- cursor 族 `FlockCursor` 补标 ENGINE-GAP (实例化绘制), 0.13.0 段同步改正.

## [0.13.0] - 2026-11-10

`@hx/ui/surface` 新收 react-bits Animations 的 B 段 6 件, 开 cursor 族 (跟手画布). 行为规格取自 `docs/research/catalog/animations.md`, 实现为 HX 自有, 组件名换成本库自己的. 规格是 WebGL 着色器场, 这里全部接在 backdrop 内核的 Canvas2D 渲染器上近似; FlockCursor 的实例化绘制标 ENGINE-GAP (2026-11-10 补). 根入口 `src/index.ts` 不新增符号. 只增不删, 无迁移.

### Added

- `@hx/ui/surface` cursor 族: `MeldCursor` (BlobCursor, 弹簧头加尾链的融滴, 点击溅滴, 质量扣减回长), `HaloCursor` (GlowCursor, 三层余辉光带), `HazeCursor` (GhostCursor, 烟团拖尾, 上漂与湍流), `FlockCursor` (SwarmCursor, 绕指针打转的粒子群, 闲时漫游, 点击炸开), `StreamerCursor` (Ribbons, 弹簧彩带, lens / comet / even 宽度曲线), `NudgeGrid` (CursorGrid, 垫底网格, 指针附近亮格, 点击扩散波).
- 一并导出各件的模拟纯函数 (`stepMeld`, `stepHalo`, `stepHaze`, `stepFlock`, `stepStreamers`, `stepNudge` 等) 与 `MELD` / `HALO` / `HAZE` / `FLOCK` / `STREAMER` / `NUDGE` 常数, 以及 `pointerPx` / `pointerVelocityPx`. 颜色只收语义 token 名.
- 契约: api 快照 `./surface` 段 491 到 566, docs-props 随之更新.

## [0.12.0] - 2026-11-10

`@hx/ui/surface` 新收 react-bits Animations 的 A 段 7 件, 开 loop / edge / texture / sticker 四个族, pointer 族加 1 件. 行为规格取自 `docs/research/catalog/animations.md`, 实现为 HX 自有, 组件名换成本库自己的. 根入口 `src/index.ts` 不新增符号. 只增不删, 无迁移.

### Added

- `@hx/ui/surface` loop 族: `MarkRail` (LogoLoop, 可拖可甩的标志跑马灯), `OrbitRing` (OrbitImages, 沿椭圆或路径环绕的图片).
- edge 族: `CometBorder` (StarBorder, 沿圆角边框跑的彗星光), `SparkEdge` (ElectricBorder, 值噪声抖动的电弧边框, 浪涌与指针放电).
- texture 族: `GrainLayer` (Noise, 按帧重抽的颗粒叠层).
- sticker 族: `PeelSticker` (StickerPeel, 悬停揭角, 可拖动摆动). 卷曲与表面光照标 ENGINE-GAP, 当前是沿直线对折.
- pointer 族: `CellTrail` (PixelTrail, 网格像素轨迹, 方 / 圆 / 菱形, fade / shrink / dither 衰减).
- 一并导出各件的纯函数与 `RAIL` / `ORBIT` / `COMET` / `SPARK_EDGE` / `GRAIN` / `PEEL` / `CELL` 等常数. 画布件全部是 Canvas2D, 颜色经语义 token 读计算色, 不写色值, 不引 three / WebGL / 动画库.
- 契约: api 快照 `./surface` 段 422 到 491, docs-props 随之更新.

### Changed

- loop 族的 `wrapOffset` 在接入前改名 `railOffset`, 避开 text/scroll 已公开的同名函数 (loop 族此前未公开, 不算破坏).

## [0.11.0] - 2026-11-10

`@hx/ui/surface` 新收 text/pointer 族 4 件, 是 react-bits TextAnimations 余量中跟随指针的文字效果. 行为规格取自 `docs/research/catalog/textanimations.md`, 实现为 HX 自有, 组件名换成本库自己的. 根入口 `src/index.ts` 不新增符号. 只增不删, 无迁移.

### Added

- `@hx/ui/surface`: `ExtrudeText` (DepthText, 逐层堆叠的立体字, 随指针或自转倾斜), `WakeText` (EchoText, 跟随指针的残影字链, 点击散开), `DraftText` (TechText, DOM + SVG 的制图字: 近邻描边, 选框与坐标, 可拖动回弹), `StampTrail` (TextCursor, 区域内沿指针路径盖字章, 停下后逐个收走). 一并导出各件的纯函数 (`extrudeLayers`, `followChain`, `nearestGlyph`, `stampLook` 等) 与 `EXTRUDE_*` / `WAKE_*` / `DRAFT_*` / `STAMP_*` 常数. 颜色只收语义 token 名. 不引 three / 画布 / 动画库.
- 契约: api 快照 `./surface` 段与 docs-props 随之更新.

## [0.10.0] - 2026-11-10

新增两个子路径 `@hx/ui/controls` 与 `@hx/ui/kits`, 收 react-bits Components 余量的 48 件中的 controls 15 件与 kits 33 件. 行为规格取自 `docs/research/catalog/components-1.md` / `-2.md`, 实现为 HX 自有, 组件名换成本库自己的. 根入口 `src/index.ts` 不新增符号. 只增不删, 无迁移.

### Added

- `@hx/ui/controls`: press / range / compose / choice / dismiss / nav 六族. 本批新增 `GlintButton`, `TallyRoll`, `StretchSlider`, `ArcField`, `ReelPicker`, `StepTrail`, `PillTabs`, `MagnifyDock`, `ProximityRail`, `GooTabs`, `GlassTiles`, `PillBurst`, `DeckNav`, `LayerDrawer`, `MarqueeRows`, 与先前各族控件一起从该子路径发布.
- `@hx/ui/kits`: gallery 11 件 (`FoldGallery`, `SpringCarousel`, `RingCarousel`, `BendGallery`, `DepthDeck`, `SphereWall`, `FlexReel`, `BlendSlider`, `HelixScroll`, `PosterFlight`, `DriftColumns`), stack 8 件 (`PopList`, `ScrollPile`, `SwipeStack`, `CycleDeck`, `SpreadCards`, `FlowMasonry`, `TintGrid`, `GlowBento`), glass 2 件 (`LensGlass`, `FrostPanel`), card 9 件 (`LampCard`, `EdgeGlow`, `TiltCard`, `BadgeCard`, `PixelBloom`, `FoilCard`, `MirrorCard`, `FrayCard`, `FileFolder`), stage3d 3 件 (`SwingLanyard`, `OrbitViewer`, `SphereMenu`). 不引 three / WebGL / 动画库; 着色器或 3D 管线才能做到的部分在组件文件头与各族 note 里标 `ENGINE-GAP:`.
- `@hx/ui/motion`: 公共曲线表 `CURVE`, `cssCurve`, `CurveName` (outQuint, outStrong, inOutQuart, backOutSoft, lift, popOut, outQuart, outCubic, inQuart, flow, outExpo, inOutCubic, settle).
- 令牌: 光谱阶梯 `--spectrum-1` .. `--spectrum-6` (蓝, 青, 绿, 黄, 红, 紫), 亮暗两套各取色板不同阶, 皮肤可覆盖.
- 契约: `check-api-snapshot` 新增 `./controls` 与 `./kits` 两段; `docs-props` 对 `./controls` 与 `./kits` 全量抽 props.

## [0.7.0] - 2026-11-03

V0 十项与 V1 区块层接进公共入口 (集成任务 V0-Z). 公共符号 981 -> 1599, 只增不删, 无迁移.

### Added

- 运行时主题 `src/provider`: `HxProvider`, `createTheme` / `varsToCss` / `isHxTheme`, `useTheme` / `useDefaults` / `mergeDefaults`, `getThemeScript`.
- 国际化 `src/locale`: `LocaleProvider`, `useLocale` / `useLocaleText`, `formatNumber` / `formatCurrency` / `formatDate` / `formatDateTime` / `formatRelative`, `zhCN` / `enUS` 语言包.
- 共享 hooks `src/hooks`: state / dom / browser / input 四类 16 个 hook (`useControllableState`, `useMediaQuery`, `useHotkeys` ...).
- 皮肤与密度 `src/skins`: 六套皮肤 (default / mono / linear / fintech / emerald / retail) 与 compact / comfortable / spacious 三档密度, `applySkin` / `applyDensity` / `readSkin` / `readDensity`.
- 营销排版 `src/typography`: `Display`, `Eyebrow`, `Kicker`, `Lead`, `GradientText`, `Prose`.
- 媒体原语 `src/media`: `Image`, `ThemedImage`, `Video`, `Gallery`, `Lightbox`, `DeviceFrame`, `BrowserFrame`.
- 视觉效果件新增 `MeshGradient`, `Grain`, `Beam`, `GridLines`, `MaskFade`, `GradientBorder`.
- 动效新增 `ScrollProgress`, `Parallax`, `StickyScroll`, `RotatingText`, `SplitText` 与编排 (`orchestrate` / `useOrchestration`).
- 站点外壳 `src/site`: `SiteHeader`, `MegaMenu`, `MobileNav`, `AnnouncementBar`, `LocaleSwitcher`, `SearchOverlay`, `SiteFooter`, `ThemeSwitcher`.
- 商业原子 `src/commerce`: `Price`, `PromoBadge`, `ProductSwatch`, `SizeSelector`, `RatingSummary`.
- 区块层 `src/blocks`: `_shared` 基座 (`BlockShell` / `SectionHeading` / `BlocksProvider` / `PageComposer`) 与 site / marketing / commerce / docs / portfolio 五类区块; 分类写法 `Blocks.Marketing.Hero` 与平铺导出并存. marketing 与 commerce 补了桶文件 `index.ts`.
- 样式入口 `@hx/ui/base.css`, `@hx/ui/skins.css`, `@hx/ui/density.css`; `styles.css` 已在 `tokens.css` 之后引入皮肤层, 层序仍为 hx.tokens -> hx.base -> hx.components.
- 常量桶 `src/constants` 接入上述各层的常量文件; 同值重名的指定单一来源, 电商活动首屏的 `HERO_LAYOUT` 另以 `CAMPAIGN_HERO_LAYOUT` 转出.
- 文档站新增 "媒体" 与 "区块" 两组共 16 页, "排版" 组新增营销排版页.

### Changed

- 跨层同名的导出按层加前缀: 站点区块 `BlocksSiteHeader` / `BlocksSiteFooter` / `BlocksMobileNav` / `BlocksAnnouncementBar` / `BlocksSearchSpec`, 以及 `siteResolveSlots`, `blocksResolveSlots`, `blocksHashTarget`, `BlocksBadge`, `BlocksNewsletterStatus`, `Site*` / `Commerce*` / `Blocks*` 前缀的 slot 类型. 平铺的 `SiteHeader` 等指 `src/site` 的外壳零件, `resolveSlots` 指 `src/media` 的版本.

## [0.5.0] - 2026-11-02

公共符号 894 -> 979, 只增不删, 无迁移.

### Added

- 动效引擎 `src/motion`: `SPRING` 三档, `MOTION_PRESETS` 七种, `Reveal`, `Stagger` / `StaggerItem`, `AnimatedNumber`, `PageTransition`, `FadeSwap`, `useMotionTokens` / `readMotionTokens`, `timingTransition`.
- 布局原语 `src/box`: `Stack` / `HStack` / `VStack` / `Spacer`, `Grid` / `AutoGrid`, `Container` / `Section` / `Center`, `Bento` / `BentoItem`, `SplitView` (包 resizable 并持久化尺寸).
- 视觉效果件 `src/effects`: `SpotlightCard`, `BorderBeam`, `Marquee`, `Backdrop`, `GlassPanel`; 新样式入口 `@hx/ui/effects.css`, 已并入 `styles.css`.
- 富交互件 `src/widgets`: `Timeline`, `Rating`, `FileDropzone`, `TagInput`, `ColorSwatch`.
- 令牌: 表面三级 `surface-raised` / `overlay` / `sunken`, 品牌辅色 `accent-2` 与渐变, `--blur-glass`, `--duration-instant` / `emphasized`, `--ease-in-out` / `emphasized` / `spring`; `motion.css` 关键帧由 5 条增至 14 条, 均带 reduced-motion 兜底.
- 既有组件的可选变体: `Card` 的 elevated / glass / lift, `Button` 的 gradient, `Tabs` 滑动指示器, `StatCard` 的 trend 与迷你折线.

### Changed

- 阴影五档重写为双层 (近处锐影 + 远处柔影), 亮色透明度更低. 默认变体渲染的类名不变, 但阴影观感会变化.

### Fixed

- 同步 `package-lock.json`, 补回三个缺失的图标包.

## [0.4.0] - 2026-10-31

公共符号新增 4 个, 共 894 个.

### Added

- 公共导出补上 `DOC_PAGE_ID`, `DOC_EVENT`, `DOC_SHELL_CLS`, `NAV_ICON` (此前已在 public-constants 中但入口漏列).

### Changed

- `@iconify-json/solar` 与 `@iconify-json/mdi` 提升为库的 `peerDependencies`. 使用方需自行安装, 否则图标类渲染为空.

### Fixed

- `check-docs-registry` 同时识别字面量 case 与 `case DOC_PAGE_ID.x:` 两种写法, 不再误报 nav-without-case.

### Migration

- 安装两个图标 peer: `npm i @iconify-json/solar @iconify-json/mdi`.

## [0.3.0] - 2026-10-31

### Added

- agent 过程组件进入公共导出: `Thinking` / `ThinkingBranches`, `SubagentCard` / `SubagentGroup`, `TodoTree` / `TodoNode`, `StatusGlyph`, `deriveTodoStatus`, `extractHeadline`.
- agent 相关常量导出: `AGENT_DEMO_STATUS`, `TODO_STATUS`, `TOOL_STATE`, `DIFF_KIND`, `DOC_KEY` 等.
- 文档站增加思考计时, 发散思考, 子代理与 TodoTree 演示页.

### Removed

- 文档站合并重复页并移除空演示页 (只影响文档站, 不影响库导出).

## [0.2.1] - 2026-10-31

### Added

- `DiffEditor`: CodeEditor 的左右对比模式, 共用本地 monaco 加载与主题, 行下说明走 view zone. 新导出 `DiffEditorProps`, `DiffLineNote`, `DiffSide`.

### Changed

- `src/index.ts` 的多行导出收紧, 入口文件行数回到 300 行上限以内.

## [0.2.0] - 2026-10-31

本版是第一个带 API 快照门禁的版本, 入口形状有破坏性变化.

### Added

- 流式 Markdown, Monaco 代码编辑器, Trace 实时生成模式, 模板页 (#21, #28).
- 动效契约导出: `MotionPresence`, `MotionPoint`, `bindGesture`, `bindScrollProgress`, `gestureDelta`, `layoutDelta`, `presenceDuration`, `retainedIds`, `scrollProgress`; `playLayout` 与 `MotionList` 从入口导出 (#35, #37).
- 门禁: API 快照 (`check-api-snapshot`) 与版本联动 (`check-api-version`), sideEffects 只允许 CSS 的 economy 检查, 可复原的视觉基线与刻画产物.

### Changed

- `monaco`, `xyflow`, `shiki`, `markstream` 改为可选 peer 依赖, 用到对应组件时由使用方安装.
- 仅作为类型的名字改为 `export type`.

### Removed

- `src/index.ts` 不再使用 `export *`, 改为逐名导出; 包内 `./src/*` 深路径导出去掉.

### Fixed

- 蓝图引脚视觉不再吞指针事件, Handle 提到上层; Markdown 代码块改用 CodeBlock 渲染; 列表内代码围栏保留 `<li>` 嵌套.

### Migration

- 原先经 `@hx/ui/src/...` 深路径引用的代码改为从 `@hx/ui` 入口具名导入.
- 用到 CodeEditor, 蓝图画布, 代码高亮或流式 Markdown 的项目, 补装对应 peer 依赖.

## [0.1.2] - 2026-10-21

### Changed

- 版本号对齐 Release 产物, 无代码变化.

## [0.1.1] - 2026-10-21

### Added

- 库构建与 GitHub Release 分发, 不需要 npm 账号 (#19); 安装说明见 `docs/tutorials/install.md`.
- `tsconfig.build.json` 归入 lib lane.

## [0.1.0] - 2026-09-28 .. 2026-10-21

首个版本, 从 0.0 一路累积到 PR #17 合入.

### Added

- 独立组件库与可交互文档站; 补齐 radix 组件, 并对标 shadcn/ui 补齐全部组件 (组合式版本与已有组件并存).
- 节点蓝图库: 自定义节点, 连接合法性判定, 执行流, 子图折叠, UE5 式注释与连线, 自动布局, 撤销重做, 多标签同步, 给 Agent 用的构建 API; 画布层接入 React Flow 并设为默认.
- 布局件: 图标槽, 通用树 (行内重命名, 状态位, 右键菜单与拖放), 可收起侧栏, 顶栏导航, 会话状态指示点.
- hx-browser 实时预览库组件 (协议客户端 + 钩子), 子路径 `@hx/ui/hxbrowser` 与 `@hx/ui/hxbrowser/protocol`.
- agent 交互组件: `UsageMeter`, `DiffView`, 内联审批等, 以及概览页.
- 主题: 暗色改为 GitHub Dark Dimmed, 语义状态色, 动效令牌, 水波纹.
- 三层验证门禁与质量规则 (HC-* / PROJECT-UI-*), 前端 PR 附 GIF 演示.

### Fixed

- 蓝图: 拖拽乱飞与闪屏, 回边斜穿节点, 注释框空壳与遮挡, 同步无条件接受对端的图, 独立页面被弹窗拦截.
- carousel 箭头按下丢失点击, input-otp 激活格边线, native-select 菜单配色.

### Removed

- 源码里的开发日记式注释, 并加门禁拦住.

[Unreleased]: https://github.com/HengXin666/HX-UI/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/HengXin666/HX-UI/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/HengXin666/HX-UI/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/HengXin666/HX-UI/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/HengXin666/HX-UI/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/HengXin666/HX-UI/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/HengXin666/HX-UI/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/HengXin666/HX-UI/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/HengXin666/HX-UI/releases/tag/v0.1.0
