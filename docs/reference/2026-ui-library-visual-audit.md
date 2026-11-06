# HX-UI 视觉表现力审计: 站点取证, 视觉能力清单与复现判定

> 类型: reference. 范围: 只审"能否不改库代码拼出真实商业页面". 不写组件代码.
> 取证日期: 2026-11-02. 仓库状态: 读自工作区映射的当前文件 (非 dist).
> 配套: [区块层设计](./2026-ui-library-blocks-design.md), [任务表](./2026-ui-library-visual-tasks.json).
> 文件名沿用既有 `2026-ui-library-*` 系列; 该系列的归位与去前缀由既有任务 P0-01 统一处理, 本文随之迁移.

## 0. 结论先行

1. **不能.** 以当前 HX-UI, 在不写自定义 class 的前提下, 拼不出本文调研的 24 个站点中任何一个的首屏. 根因不是组件数量, 而是**三层基础设施缺位**: 展示级字号 (display type), 营销页纵向节奏 (section rhythm), 媒体 (image/video) 原语.
2. 库的设计目标是**高密度工具界面** (IDE / 控制台 / 设置页): 字号阶梯 9px 到 30px, 卡片与表格齐全, 4 个模板全是 app 型 (chat/settings/dashboard/console). 营销, 电商, 文档站, 作品集四类页面**零覆盖**.
3. 文档站 Gallery 首屏是唯一的"落地页"示例, 但它靠 `src/constants/gallery.ts` 里手写的 Tailwind 字符串撑起来 (`hero`, `heroTitle`, `heroFigures`...), 标题最大也只有 `--fs-5xl` = 30px. 这本身就是"必须自定义"的证据.
4. 补齐路径: V0 先补 token 与原语 (字号/节奏/容器/皮肤/媒体/导航外壳), V1 再在 `src/blocks/` 产出 ~40 个数据驱动区块, V2 用区块拼 6 套整页模板并做视觉回归. 详见区块层设计与任务表.

## 1. 现状取证 (仓库内证据)

### 1.1 tokens.css (609 行)

| 维度 | 现状 | 证据 | 对商业页的影响 |
| --- | --- | --- | --- |
| 字号阶梯 | `--fs-3xs` 9px 到 `--fs-5xl` 30px, 另有 `--fs-lead` 17px, 共 15 档, 含 10.5/11.5/12.5 半像素档 | `src/tokens.css:471-486` | 营销首屏标题普遍 48 到 96px (tailwindcss.com 用到 `text-6xl`/`text-8xl`, astro.build 有 `text-[12.5rem]`), 库里**最大档只有 30px** |
| 流体字号 | 无任何 `clamp()` | 全文 grep 无 | 无法随视口平滑缩放 display 标题 |
| 行高/字距 token | 无 `--lh-*` / `--tracking-*` | 全文 grep 无 | display 标题需要 1.0 到 1.1 行高与负字距, 只能逐处手写 |
| 色板 | 单一 GitHub Primer 风格 dim (暗) + light (亮) | `src/tokens.css:18-89`, `:94-137` | 只有一种品牌气质, 换不了"Stripe 紫" "Supabase 绿" "Nike 黑白" |
| 品牌色 | `--primary` + `--accent-2` 青色, `--gradient-brand` 135deg 双色线性 | `src/tokens.css:173-180` | 渐变网格 / mesh / 多色极光需要 3 色以上与径向渐变 |
| 圆角 | 单值 `--radius: 0.5rem`, 派生 sm..2xl | `src/tokens.css:89`, `src/styles.css:130-135` | 无"锐利 (0)" 与"胶囊 (999px)"两套皮肤切换 |
| 阴影 | xs..2xl + glow + inner + ring-glow, 亮暗各一套 | `src/tokens.css:183-221` | **可用**, 是现有最接近商业质感的部分 |
| 玻璃 | `--surface-glass`, `--glass-border`, `--blur-glass` 16px, `--glass-saturate` | `src/tokens.css:168-228` | 可用, 但只有一档模糊 |
| 动效 | 时长/缓动/弹簧 `linear()`/减弱动效归零, 很完整 | `src/tokens.css:491-570` | 可用; 缺"入场编排间隔 (stagger step)"与"滚动联动"令牌 |
| 层级 | `--z-base..--z-tooltip` | `src/tokens.css` z 段 | 可用; 缺 `--z-header` (粘性顶栏 + 公告条) |
| 皮肤/预设 | 只有 `data-mode="light"/"dark"`, 无 `data-skin` / `data-density` | 全库 grep `density` 0 命中 | **所有页面长一个样**的直接原因 |
| 纵向节奏 | token 层没有 section spacing | 只在 `src/constants/box.ts:25-33` 用 Tailwind 类 `py-0..py-32` | 无"桌面 128px / 移动 64px"这种响应式节奏档 |

### 1.2 styles.css (259 行)

- 只做 `@import` 汇总与 `@theme inline` 映射 (`src/styles.css:1-34`), 外加 streaming-markdown 的表格修饰.
- 没有任何排版基线 (prose 尺度, 标题间距), 没有 `:where()` 级别的营销页基样式.

### 1.3 布局盒 src/box/

- `Container`/`Section`/`Center` 宽度档 `prose|sm(2xl)|md(4xl)|lg(6xl)|xl(7xl=80rem)|full` (`src/box/Container.tsx:12-19`). **缺**: 1440/1536 宽屏档, "全出血 (full-bleed) + 内容回中"的破格档, 不对称双栏 (7/5) 的栅格 span.
- `Section` 已有 `eyebrow/title/description/actions` (`src/box/Container.tsx:48-60`), 这是好的起点; 但标题写死 `text-xl` (20px), 眉标写死 `text-xs` (`src/box/Container.tsx:94-101`), 无 `align="center"`, 无标题尺度档.
- 横向内边距固定 `px-4 sm:px-6 lg:px-8` (`src/constants/box.ts:36`).
- `Grid` (列数变量化), `AutoGrid`, `Bento`, `SplitView`, `Stack` 齐备, 能拼特性墙骨架.

### 1.4 primitives (shadcn 同构, 72 个文件)

- 有: `aspect-ratio` (14 行 Radix 薄封装), `carousel` (embla), `navigation-menu` (Radix), `drawer`/`sheet`, `accordion`, `tabs`, `command`, `skeleton`, `empty`, `pagination`, `input-group`, `input-otp`, `form`, `field`, `hover-card`, `typography`.
- `typography` 的 H1 = `--fs-5xl` 30px, H2 = `--fs-3xl` 22px 且自带底边线 (`src/primitives/typography.tsx:13-20`), 是文档正文尺度, 不是营销尺度. 没有 `Display`, `Eyebrow`, `Kicker`, `GradientText`, `Balance`.
- `navigation-menu` 只是 Radix 外壳, 没有 mega menu 面板版式 (分栏 + 特色卡 + 图片).

### 1.5 effects (src/effects/, 5 个组件)

- `Backdrop` (grid / dots / aurora), `BorderBeam`, `GlassPanel`, `Marquee`, `SpotlightCard` (`src/effects/index.ts`).
- **缺**: 渐变网格 (mesh), 噪点颗粒 (grain), 光束/光晕 (beam/ray, resend.com 的 bg-light), 边缘淡出遮罩 (mask-image, nextjs.org/clerk.com 大量使用), 文字渐变 token (现仅 `.hx-gradient-pan` 类), 视差层, 网格线 + 十字准星装饰 (vercel.com 风格).

### 1.6 motion (src/motion/)

- `Reveal`, `Stagger`, `Transition`, `AnimatedNumber`, `presets.ts` (soft/snappy/bouncy 弹簧 + 预设入场). 基于 IntersectionObserver 的入场已具备 (`src/motion/Reveal.tsx`).
- **缺**: 滚动进度联动 (scroll-linked progress), 粘性叙事 (sticky scrollytelling, apple.com 产品页核心手法), 视图过渡 (View Transitions), 鼠标跟随视差, 打字/轮换词 (shopify.com 首屏 "Be the next ___" 轮换).

### 1.7 媒体处理

- 全 `src/` 243 个 ts/tsx/css 文件 grep: `<img` 只出现在 chat 附件, hxbrowser, 侧栏头像, FileDropzone 等 6 处; `<video` 0 处; `loading=` 0 处; `srcset` 0 处.
- 结论: **没有任何媒体原语**: 无响应式图片 (srcset/sizes/picture), 无懒加载, 无模糊占位 (blur-up), 无焦点裁切 (object-position), 无背景视频, 无画廊/灯箱/缩放.

### 1.8 文档站 docs/src/pages/

- 模板只有 4 个: `templates-chat/settings/dashboard/console` (`docs/src/pages/templates/index.ts`), 全是应用界面.
- `gallery/GalleryPage.tsx` 是唯一营销型示例: Hero (`Backdrop` + `Reveal` + `GlassPanel` + `BorderBeam` + `AnimatedNumber`), `Marquee` 技术栈条, `Bento` 特性墙, `SpotlightCard` 原则, Dashboard 展示, CTA.
- 但它的视觉全靠 `src/constants/gallery.ts` 里 30 余条手写 class 字符串, 例如 `hero: "relative overflow-hidden rounded-2xl border border-border px-6 py-14 md:px-12 md:py-20"`, `heroTitle: "... text-[length:var(--fs-4xl)] ... md:text-[length:var(--fs-5xl)]"` (`src/constants/gallery.ts:32-38`). 换句话说: 库自己的展示页也必须自定义.

### 1.9 其他已有能力 (可复用)

- `widgets/Rating` (星级), `widgets/Timeline`, `layout/Stepper` (含 StepDots), `layout/StatCard`, `layout/EmptyState` + `DataBoundary`, `layout/DataTable`, `primitives/direction` (RTL), `motion/AnimatedNumber` (用 Intl 格式化).
- 这些是区块层的好积木, 但缺"商业语义": 价格 (原价/折后/币种/周期), 促销徽标 (NEW/SALE/-30%), 库存, 色板选择器, 尺码选择.

## 2. 横向调研: 24 个官方站点

> 方法: 抓取官方页面 HTML/文本, 提取标题层级与区块顺序; 对使用 Tailwind 的站点统计 class 频次 (如 `text-6xl`, `mask-image`, `max-w-screen-xl`) 作为节奏与手法的客观证据. 视觉手法里标"推断"的, 依据是资源文件名或结构, 不是截图.

### 2.1 现代电商

#### shopify.com
- 首屏: 全宽背景图 + 两行超大标题, 第二行为**轮换词** ("AI all-star / household name / solo-preneur / global empire ..."), 单 CTA "Start for free".
- 区块顺序: 顶栏 (mega menu: 图片卡 + 分组链接 + 特色入口) → Hero 轮换词 → 商家网址 logo 墙 (12 个店铺域名) → "Your brand has entered the chat" 宽幅图 → 三张特性卡 (店铺/统一后台/全渠道) → 全球化 (国旗价格卡 + 13 张商品图拼贴 "Buy now / Order for $125.00") → 规模叙事三列 (个人/成长/企业 案例) → Sidekick AI 区 → App 生态宽图 → 开发者区 (Hydrogen, 三张入口卡) → 数据带 (15% / 250M+) + Shop Pay → 引用卡 → Capital 三列数字 → "Build fast" 竖图拼贴 + 01/02/03 步骤 → 四列页脚 + 地区/语言选择器 (60+ 地区).
- 节奏: 大段落间留白, 卡片多为 16:10 图片 (`originalWidth=740&originalHeight=464`).
- 视觉手法: 真实商品摄影, 拼贴网格, 深色段与亮色段交替.
- 交互: 轮换词, 地区语言选择 dialog.
- 反推: `RotatingText`, `MegaMenu` (图片卡列), `LogoWall` (文本型), `MediaCollage`, `StatBand`, `StepList`, `FooterColumns` + `LocaleSwitcher`.

#### nike.com
- 首屏: 公告/工具条 (Find a Store / Help / Join Us / Sign In) → 主导航 (Men/Women/Kids/Jordan/NikeSKIMS/Sport, 每项 4 到 5 列 mega menu, 含"Shop by Color"色块入口) → 搜索 (Popular Search Terms, Ask NikeAI) → 收藏/购物袋图标.
- 区块顺序: 全幅 campaign 轮播 (标题 + 一句描述 + Shop) ×N → 分类大图卡 (Phantom / Mercurial / Tiempo) → 系列故事 (NikeSKIMS, 双图并排) → Trending 横滑 → Inside Nike → 页脚 (Featured / Shoes / Clothing / Kids 四列 + Resources/Help/Company/Promotions 折叠组 + 地区选择 70+ 站点).
- 节奏: 图像占屏 80% 以上, 文字极少, 全大写标题 ("GET USED TO IT.", "DRIVEN BY LEGACY").
- 视觉手法: 全出血摄影, 黑白为主, 品牌字体超大全大写.
- 交互: mega menu 悬停展开, 搜索建议面板, 横向滑动卡片, 页脚移动端折叠.
- 反推: `UtilityBar`, `MegaMenu` (多列), `SearchOverlay` (热门词 + 建议), `CampaignHero` (全出血), `CategoryTiles`, `ProductRail` (横滑), `FooterAccordion` (移动端), `RegionPicker`; 皮肤 `athletic` (黑白, 粗体大写, 0 圆角).

#### apple.com/iphone (产品线首页)
- 首屏: 全局细导航 (Store/Mac/iPad/...) → 本地 **产品子导航条** (iPhone Duo / 18 Pro / Air / 17 / Compare / Shop) → 促销公告条 (Apple Upgrade, 带脚注上标 §) → 大标题 "iPhone" → 双英雄图轮播 (iPhone Duo / 18 Pro, 各 Buy + Learn more).
- 区块顺序: "Explore the lineup" 产品卡横滑 (每卡: 色板圆点, 一句卖点, Learn more/Buy, 脚注) → "Why Apple is the best place to shop" 激励卡横滑 (点击展开为 modal 详情) → Upgrade to iPhone 宽图 → Essentials 双卡 → "Significant others" 设备联动 tabs (三项, 左文右图联动) → 长脚注 → 页脚 (多列 Shop and Learn / Wallet / Account ...).
- 节奏: 标题 "iPhone" 与区块标题都是超大 display 字号 (推断, 基于 Apple 惯例与结构), 区块之间大留白.
- 视觉手法: 纯色背景上的产品渲染图, 浅灰卡片圆角 18 到 28px, 脚注体系.
- 交互: 横滑带分页点 + 左右按钮, 卡片展开 modal, tabs 联动图片切换, 色板切换.
- 反推: `LocalNav` (粘性子导航), `PromoBar`, `ProductCardRail` (色板 swatch), `IncentiveCardRail` + `ExpandableCardModal`, `FeatureTabs` (图文联动), `Footnotes` (上标引用体系); 皮肤 `retail-light`.

#### 小结 (电商共性)
公告条, mega menu, 搜索覆盖层, 全出血大图 hero, 商品卡 (图/色板/价格/徽标), 横滑轨道, 地区语言选择, 多列页脚. **库里只有 carousel 与 navigation-menu 两个原始外壳**.

### 2.2 产品 SaaS 与开发者产品

#### vercel.com
- 首屏: 顶栏 (Products/Resources 双 mega menu 分组: Agent Stack / Core Platform / Tools) → 暗色光晕背景 (`fallback-dark-glow-desktop.webp`) → "Drop to deploy" 拖放区 → H1 "Agentic Infrastructure" + 轮换副标题 → Deploy now / Talk to sales.
- 区块: 三段"大标题 + 客户大截图 (Notion / Zapier / Mintlify, 暗亮各一套, 桌面移动各一套) + 特性 tabs" → Recently shipped 三卡 (含模拟聊天) → "Built by you, or your agents" CTA → 12 组超多列页脚 + 主题切换 (system/light/dark).
- 视觉手法: 黑底 + 光晕, 截图双主题切换 (`notion-desktop-dark.webp` / `-light.webp`), 网格线.
- 交互: 拖放部署, 轮换文案, 页脚主题切换器.
- 反推: `ThemedImage` (亮暗两图), `ShowcaseSection` (标题 + 截图 + tabs), `MegaMenu` (分组列), `ThemeSwitcher`, `FooterMega`; 皮肤 `mono-dark`.

#### linear.app
- 首屏: H1 + 一句 lead + "New Loops →" 胶囊徽标 → **以 DOM 渲染的完整产品界面** (侧栏 + issue 详情 + 活动流 + 属性面板), 带透视/遮罩 (推断).
- 区块: 客户 logo 墙 → "A new species of product tool" 三列 Fig 0.1/0.2/0.3 → 四大特性段 (Intake / Planning / AI / Build), 每段: 标题 + 说明 + Learn more + 大型交互模拟 (看板, 甘特, 对话, diff) + 底部 Features 折叠列表 → Changelog 四卡 → 引用卡 → "Built for the future" CTA → 六列页脚.
- 节奏: 极克制的灰阶, 大量负空间, 标题与正文字号反差大.
- 视觉手法: 暗色产品 UI 即插画, 细 1px 边, 微光渐变边框.
- 交互: 模拟界面局部动画, "Features +" 展开.
- 反推: `ProductMockFrame` (带遮罩/倾斜的产品容器), `FigureGrid` (编号说明), `FeatureSection` (含展开特性列表), `ChangelogCards`, `QuoteCard`; 皮肤 `linear-dark`. 另见 linear.app/pricing: 四档定价卡 (Free/Basic/Business/Enterprise) + 对比表.

#### stripe.com
- 首屏: 顶栏 (Products/Solutions/Developers/Resources + Guide me) → 动态**波浪渐变**背景 (`wave-fallback-desktop-1x.webp` 为静态回退) → H1 + lead → Get started / Sign up with Google → 新闻/客户 chips 无限横滚.
- 区块: "Flexible solutions" bento (支付/计费/agentic/发卡/稳定币/嵌入) 带背景图与 UI 片段 → AI 推荐输入框 (字数计数 0/500) → 活动横幅 → "The backbone of global commerce" 四项大数字 + 数据可视化图 → 企业/创业/平台三段 (手风琴式客户故事: 图 + 数据 + 用到的产品) → 创业客户卡横滑 (8 张) → 引用轮播 (头像 + 职位) → 开发者区 (三条集成路径 + 500M+ 数据) → "What's happening" 新闻轮播 (Item 1 of 8) → Book of the week → 双 CTA + 两张小卡 → 超大页脚.
- 视觉手法: 斜切色带, 渐变网格, 卡片背景图, 精细排版.
- 交互: 横滚 chips, 手风琴客户故事, 轮播分页 "Item 1 of 8".
- 反推: `MeshGradientHero`, `TickerChips`, `BentoFeatures` (图片底), `StatBand` (大数字 + 说明), `StoryAccordion`, `TestimonialCarousel`, `NewsCarousel`, `IntegrationPaths`; 皮肤 `fintech-light`.

#### supabase.com
- 首屏: 顶栏含 **GitHub 星数徽标 (114.4K)** + Sign in + Start your project → H1 两行 "Build in a weekend / Scale to millions" (第二行品牌绿) → 双 CTA.
- 区块: 产品 bento 7 格 (Database 大格, Auth/Functions/Storage/Realtime/Vector/Data APIs, 每格亮暗两套 SVG 插画, hover 换 active 图) → "Trusted by" logo 墙 → Dashboard tabs (Table/SQL/RLS) → 代码示例 → 模板卡 6 张 → 客户故事 tabs (logo 切换 + 引用 + 头像) → 社区推文墙 (14 条) → Open source 段 → CTA → 页脚 (合规徽标 SOC2/HIPAA/ISO, 社交图标, 订阅, 6 列).
- 视觉手法: 暗底绿光, 亮暗双插画, 代码块.
- 反推: `GitHubStarBadge`, `BentoFeatures` (hover 换图), `LogoWall`, `CodeShowcase`, `TemplateCards`, `CustomerStoryTabs`, `TweetWall` (瀑布流), `ComplianceBadges`, `NewsletterForm`; 皮肤 `dev-emerald-dark`.

#### resend.com
- 首屏: 全幅"地板"背景图 (`bg-hero-1.jpg`) → 事件胶囊 "What you missed at Resend Forward" → H1 "Email for developers" (两行) → 双 CTA → 光束图 (`bg-light.avif`).
- 区块: logo 墙 → Integrate (13 语言 tabs + 框架子 tabs + 带行号代码块 + View on GitHub/Download ZIP) → DX 段 (模拟发送 + HTTP 200 响应流) → Test mode → 模块化 webhooks (事件流动画) → 编辑器模拟 → 截图放大段 ×2 → React Email 代码与预览并排 → 9 格特性网格 → 大引用 (Guillermo Rauch) → 截图 tabs → 引用无限滚动 (重复 3 轮) → CTA → 地址 + 社交 + 5 列页脚 + 状态指示.
- 视觉手法: 摄影级 3D 背景, 光线, 极简白字.
- 反推: `PhotoHero` (背景图 + 光束层), `EventPill`, `CodeTabs` (两级 tabs), `ResponseStream`, `ScreenshotZoom`, `CodePreviewSplit`, `FeatureGrid9`, `TestimonialMarquee`, `StatusDot` (已有 `SessionStatusDot` 可借鉴).

#### clerk.com
- 首屏: H1 "Everything you need for authentication" + 组件预览.
- 区块: User authentication 11 项特性卡 → Multi-tenancy 4 项 → Agents (MCP/CLI) → Frameworks 墙 → Integrations 墙.
- 证据: 页面 `mask-image` 63 次, `loading="lazy"` 157 次 (159 张图), 说明**边缘淡出遮罩与大规模懒加载**是常规手法.
- 反推: `MaskFade` 效果, `LazyImage`, `FeatureCardGrid`, `IntegrationWall`.

#### framer.com
- 首屏: H1 "Framer is the pro website builder ..." + 产品视频.
- 区块: 三步 (agent / canvas / publish) → 三组"设计/CMS/代码 with agent" (每组成对出现, 推断为 tab/滚动切换) → 9 项平台能力 (Performance/CMS/SEO/...) → Shipped with Framer 作品墙 → Trusted by → 社区 → CTA.
- 证据: 5 个 `<video>`, 185 张图其中 156 张懒加载.
- 反推: `VideoHero`, `StepTriplet`, `ScrollTabs`, `ShowcaseMasonry`; 皮肤 `creative-dark`.

### 2.3 开源项目介绍站

#### tailwindcss.com
- 首屏: H1 "Rapidly build modern websites without ever leaving your HTML." 超大字 (页面出现 `text-6xl`/`text-8xl`, `tracking-tighter` 18 次) + 安装命令.
- 区块: "Supported by the best" 赞助 logo → "Built for the modern web" 特性 + 交互演示 ("Browse properties") → 性能对比 → "Ship faster and smaller" → "Build whatever you want" → 3 列页脚.
- 节奏: `max-w-xl`/`max-w-80` 窄文本列, `aspect-square`/`aspect-3/2` 网格图, `backdrop-blur-lg` 粘性顶栏.
- 视觉手法: 白底细网格线, 代码与渲染结果并排, 超大标题负字距.
- 反推: `DisplayHeading` (负字距), `InstallCommand` (带复制), `SponsorWall`, `CodeAndPreview`, `GridLines` 背景, `StickyBlurHeader`.

#### bun.sh
- 首屏: H1 "Bun is a fast JavaScript runtime & toolkit. All in one." + 安装命令 + 基准柱状图 (推断).
- 区块: 四个场景 tabs (Next.js / Express HTTPS / Postgres / WebSocket) → "Four tools, designed together" 四卡 (Runtime/PM/Test/Bundler) → One binary → bun fmt → 生产案例 (Claude Code / Midjourney / Railway) → 安装速度对比 → Everything built in → API 分类 (HTTP / Data / Files / Security / Formats / Low level) → Full speed full-stack → 最后 CTA "Try it on the repo you have open".
- 反推: `BenchmarkBars` (横向对比条), `ScenarioTabs`, `ToolCards4`, `CaseStudyList`, `ApiCategoryGrid`, `InstallCommand`.

#### astro.build
- 首屏: H1 "The web framework for content-driven websites" + 渐变背景 (`bg-gradient-to-b` 32 次, `bg-gradient-to-tr` 12 次).
- 区块: 五大理念 (Server-First / Content-Driven / Customizable / Islands / Zero Lock-in) → 周边商品卡 (Snapback Cap, 说明官网内嵌商城) → Fully Featured 14 项特性 → Themes 画廊 → 专业支持 → CTA → 赞助墙 → 4 列页脚.
- 证据: `max-w-screen-xl` 13 次 (约 1280px 主容器), 41/43 张图懒加载, 6 个 `<details>` (原生折叠).
- 反推: `GradientSection`, `PrincipleList`, `ProductMiniCard`, `FeatureGrid14`, `ThemeGallery`, `SponsorTiers`.

#### react.dev
- 首屏: Logo + H1 "React" + lead + Learn React / API Reference.
- 区块: 五段"说明 + 代码编辑器 + 实时渲染结果" (Video.js / VideoList.js / SearchableVideoList.js / confs/[slug].js), 渲染结果是完整的视频列表 UI → React Conf 视频墙 → 社区 → 页脚.
- 视觉手法: 左代码右浏览器框 (带地址栏) 的对照.
- 反推: `CodeWithLivePreview`, `BrowserFrame` (库已有 hxbrowser 可借鉴), `VideoCardList`.

#### nextjs.org
- 首屏: H1 "The React Framework for the Web" + 双 CTA + `npx create-next-app` 命令.
- 区块: 特性网格 → 工具链 → 客户展示 → Get started → 部署 CTA → 页脚.
- 证据: `py-16` 65 次 (统一纵向节奏), `mask-image` 8 次, `aspect-5/4`, `aspect-600/337`.
- 反推: 统一 section padding 档, `MaskFade`, `ShowcaseGrid`.

#### deno.com
- 首屏: H1 "Better, faster JavaScript" + 安装 (多平台 tabs) + "Or let your agent do it".
- 区块: Everything just works → Node 兼容 → Built-in everything → 前沿 JS → 三层安全 → 性能 → 可观测 (OTEL / Profiling / Debugging) → Deploy → Desktop → Loved by developers → 页脚.
- 反推: `InstallTabs` (OS 切换), `SecurityLayers` (分层图示), `FeatureAlternating` (左右交替图文).

### 2.4 个人主页 / 作品集

#### brittanychiang.com
- 结构: 桌面端**左栏粘性** (姓名 H1, 职位, 一句介绍, 页内导航 About/Experience/Projects, 社交图标), 右栏滚动 (About → Experience 时间线 6 条, 每条日期 + 职位 + 公司 + 技术标签 chips → Projects 4 张带缩略图 → Writing 4 篇).
- 证据: `sticky` 5 次, `aspect-video` 8 次, `backdrop-blur` 4 次, `py-24`, `max-w-screen-xl`.
- 交互: 滚动高亮当前导航项 (scrollspy), 鼠标位置聚光 (spotlight, 业内广为人知的效果).
- 反推: `StickySidebarLayout`, `ScrollSpyNav`, `ExperienceTimeline` (库有 Timeline 可扩展), `ProjectCard`, `CursorSpotlight` (库有 SpotlightCard, 需页面级版本).

#### leerob.com
- 结构: 极简单栏, H1 "@leerob", Notes 与 Blogs 两个列表.
- 手法: 纯排版, 无图, 依赖正文字号/行高/链接下划线的质量.
- 反推: `ProseLayout`, `PostList` (标题 + 日期), 排版基线 token.

#### rauno.me
- 结构: 一段介绍 H1 ("Rauno Freiberg is an Estonian interaction designer ...") + Craft / Projects 列表.
- 手法: 交互细节驱动 (微动效, 悬停预览), 极简排版.
- 反推: `HoverPreviewLink`, `CraftGrid`, 精细 hover 动效预设.

### 2.5 设计系统与组件库站

#### ui.shadcn.com
- 首屏: H1 "The Foundation for your Design System" + 公告胶囊 + 双 CTA, 下方**真实组件拼成的示例仪表盘**.
- 手法: `aspect-ratio` 9 次, `max-w-4xl`, `text-5xl`, `py-16`/`py-20`; 展示即组件.
- 反推: `ComponentShowcase` (组件实景墙), `AnnouncementPill`.

#### mantine.dev
- 首屏: H1 "A fully featured React components library".
- 区块: AI 工作流 (LLM docs / Skills / MCP) → 120+ components → Hooks 演示 (use-move 等可交互) → Flexible styling → Dark color scheme → Combobox 六连演示 → Extensions → Form library → 第二个 H1 "120+ responsive components" (示例墙) → Trusted by → Join community → CTA.
- 反推: `LiveDemoGrid`, `FeatureChecklist`, `ColorSchemeToggleDemo`.

#### ant.design
- 首屏: H1 "Ant Design" + 大幅插画 + 开始使用.
- 区块: "Flexible theme customization" (主题编辑器实时预览) → "Rich components" → "Design and framework" → Resources / Community / Help / More Products 页脚.
- 反推: **主题预设切换演示** (`ThemePlayground`), 证明主题/皮肤是组件库站点的卖点.

#### primer.style
- 结构: H1 "Primer" → Product UI / Brand toolkit / **Brand UI** (GitHub 营销页专用组件) 三入口 → Shared Foundations (Accessibility / Octicons / Primitives) → Design at GitHub.
- 关键证据: GitHub 把"产品 UI"与"营销 UI (Primer Brand)"拆成两套组件. HX-UI 的色板就源自 Primer Product, 却**没有对应的 Brand 层**, 这正是本次缺口的结构性原因.

#### carbondesignsystem.com
- 首屏: 逐字动画标题 "Let's make together" (HTML 中字母以空格分隔, 推断为逐字入场).
- 区块: Carbon MCP → Building experiences → The next evolution of Carbon.
- 反推: `SplitTextReveal` (逐字/逐词入场), `PathCards`.

### 2.6 横向共性 (出现频次, 24 站)

> 计数依据 2.1 到 2.5 的逐站记录与抓取 HTML; 未截图核验的手法按结构推断计入, 是量级参考而非精确统计.

| 手法/区块 | 出现站点数 | 典型 |
| --- | --- | --- |
| 多列页脚 (≥4 列) | 20 | stripe, vercel, supabase, nike |
| logo 墙 / 客户墙 | 14 | linear, supabase, resend, shopify |
| 超大 display 标题 (≥48px) | 22 | tailwind, apple, astro, nike |
| mega menu / 分组下拉 | 9 | shopify, nike, stripe, vercel |
| 代码 + 预览/结果并排 | 9 | react, resend, supabase, tailwind |
| 引用/推荐卡 (轮播或墙) | 10 | stripe, supabase, resend, linear |
| 大数字数据带 | 6 | stripe, shopify, bun |
| bento 特性墙 | 7 | stripe, supabase, vercel |
| 亮暗双图 | 4 | vercel, supabase |
| 遮罩淡出 / mask-image | 5+ | clerk, nextjs, astro |
| 背景视频或产品视频 | 4 | framer, bun, deno |
| 横滑卡片轨道 | 5 | apple, nike, stripe |
| 粘性子导航 / 侧栏 | 4 | apple, brittanychiang, docs 类 |
| 安装命令 + 复制 | 6 | tailwind, bun, deno, nextjs |
| 定价卡 + 对比表 | 3 (含独立 pricing 页) | linear/pricing, vercel/pricing |
| FAQ 折叠 | 3+ | vercel/pricing (16 个 details), astro |
| 地区/语言选择 | 3 | shopify, nike, apple |
| 公告条 / 事件胶囊 | 8 | apple, resend, linear, shadcn |

## 3. 视觉能力清单与"不改代码能否拼出"判定

判定口径: **能** = 只组合现有导出即可, 视觉达标; **勉强** = 能搭出结构, 但必须写自定义 class 或视觉明显不达标; **不能** = 缺原语或缺 token, 无法实现.

### 3.1 排版与间距体系缺口 (T)

| ID | 能力 | 判定 | 依据 |
| --- | --- | --- | --- |
| T1 | display 字号 (48/60/72/96px) 与流体 clamp | 不能 | 最大 `--fs-5xl` 30px |
| T2 | 行高/字距 token (display 1.05 + 负字距) | 不能 | 无 token |
| T3 | 版式层级组件 Display / Eyebrow / Lead / SectionTitle | 勉强 | Section 有 eyebrow 但写死 xs/xl |
| T4 | section 纵向节奏档 (响应式 64→128px) | 勉强 | 仅 `py-*` 类, 非响应式 |
| T5 | 宽屏容器 1440/1536 + full-bleed 破格 | 不能 | 最大 7xl |
| T6 | 12 列栅格 + span/offset/不对称 | 勉强 | Grid 仅等宽列 |
| T7 | 居中/左对齐标题区切换, 文本最大宽度 (`text-balance` + measure) | 勉强 | 需自定义 |
| T8 | 正文排版基线 (prose) 用于博客/文档 | 勉强 | typography 为片段组件, 无 Prose 容器 |

### 3.2 组件级缺口 (C)

| ID | 能力 | 判定 | 依据 |
| --- | --- | --- | --- |
| C1 | 响应式图片 (srcset/sizes/picture, 懒加载, blur 占位, 焦点裁切) | 不能 | 0 处 srcset/loading |
| C2 | 亮暗双图 ThemedImage | 不能 | 无 |
| C3 | 背景视频 / 产品视频 (静音自动播放, poster, 减弱动效时静止) | 不能 | 0 处 video |
| C4 | 画廊 / 灯箱 / 缩放 | 不能 | 无 |
| C5 | 设备/浏览器框 (BrowserFrame, DeviceFrame) | 勉强 | hxbrowser 是业务组件 |
| C6 | 价格 Price (原价/现价/币种/周期, Intl) | 不能 | 0 处 currency |
| C7 | 促销徽标 / 角标 (NEW, SALE, -30%) | 勉强 | Badge 存在, 无语义变体与角标定位 |
| C8 | 色板选择 Swatch / 尺码选择 | 勉强 | ColorSwatch 是取色器, 非商品色板 |
| C9 | 评分摘要 (星 + 分数 + 评价数) | 勉强 | Rating 只有星 |
| C10 | 轮换词 RotatingText / 逐字入场 SplitText | 不能 | 无 |
| C11 | 安装命令 InstallCommand (复制 + 包管理器 tabs) | 勉强 | CodeBlock + Tabs 可拼, 无复制反馈规范 |
| C12 | 公告条 AnnouncementBar / 事件胶囊 Pill | 勉强 | Badge 可拼胶囊, 无可关闭的顶栏 |
| C13 | 粘性模糊顶栏 SiteHeader (滚动变色/收起) | 不能 | 无 |
| C14 | MegaMenu 面板版式 | 勉强 | navigation-menu 外壳 |
| C15 | 移动端导航抽屉 (分级钻取) | 勉强 | drawer/sheet 外壳, 无钻取 |
| C16 | 搜索覆盖层 (热门词, 分组结果, 键盘) | 勉强 | command 可做, 视觉为调色板而非站点搜索 |
| C17 | 主题切换器 ThemeSwitcher (system/light/dark) | 勉强 | 需自写 |
| C18 | 地区/语言选择 LocaleSwitcher | 不能 | 无 |
| C19 | 横滑轨道 Rail (分页点, 吸附, 左右按钮, 溢出淡出) | 勉强 | carousel 存在, 无溢出淡出与卡片宽度档 |
| C20 | 邮件订阅 NewsletterForm (状态反馈) | 勉强 | input-group 可拼 |
| C21 | GitHub 星数徽标 / 版本徽标 | 不能 | 无 |
| C22 | 基准对比条 BenchmarkBars | 勉强 | charts 可做, 无营销样式 |
| C23 | 脚注体系 Footnote (上标 + 页底注) | 不能 | 无 |
| C24 | 页面级鼠标聚光 / hover 预览链接 | 勉强 | SpotlightCard 仅卡片级 |

### 3.3 效果与动效缺口 (E)

| ID | 能力 | 判定 | 依据 |
| --- | --- | --- | --- |
| E1 | mesh 渐变 / 多色极光 (≥3 色, 径向) | 勉强 | aurora 仅双色 |
| E2 | 噪点颗粒 grain | 不能 | 无 |
| E3 | 光束/光晕 beam/ray/glow 层 | 勉强 | shadow-glow 仅阴影 |
| E4 | 边缘淡出遮罩 MaskFade (上/下/左右/径向) | 不能 | 无 mask token |
| E5 | 网格线 + 十字准星装饰 | 勉强 | Backdrop grid 可用, 无准星/交点 |
| E6 | 渐变描边 / 发光边框 (非 1px 硬边) | 勉强 | BorderBeam 动态, 无静态渐变边; 注意 1px 硬约束 |
| E7 | 文字渐变 GradientText | 勉强 | 仅 `.hx-gradient-pan` 类 |
| E8 | 滚动联动 (进度, 视差, 缩放) | 不能 | 无 scroll progress |
| E9 | 粘性叙事 Scrollytelling | 不能 | 无 |
| E10 | 入场编排 (区块级次序: 眉标→标题→lead→CTA→媒体) | 勉强 | Reveal/Stagger 可做, 无编排预设 |
| E11 | hover 细节预设 (卡片抬升, 图片放大, 箭头位移) | 勉强 | 需自写 |
| E12 | 无限滚动 logo / 推荐 Marquee | 能 | Marquee 已有 |
| E13 | 玻璃面板 | 能 | GlassPanel 已有 |
| E14 | 数字滚动 | 能 | AnimatedNumber 已有 |

### 3.4 页面级区块缺口 (B)

| ID | 区块 | 判定 | 依据 |
| --- | --- | --- | --- |
| B1 | Hero (居中 / 分屏 / 媒体底 / 产品 mock / 视频底 / 渐变网格) | 勉强 (居中) / 不能 (视频, 媒体底) | T1 C1 C3 |
| B2 | LogoWall / Marquee 客户墙 | 勉强 | 无灰度/悬停复色规范 |
| B3 | FeatureGrid / Bento / 交替图文 | 勉强 | Bento 可用, 标题尺度不够 |
| B4 | StatBand 大数字带 | 勉强 | StatCard 是仪表盘尺度 |
| B5 | Testimonial 卡 / 墙 / 轮播 | 不能 | 无组件 |
| B6 | Pricing 定价表 (月/年切换, 推荐档高亮) | 不能 | 无 |
| B7 | ComparisonMatrix 功能对比矩阵 (粘性表头, 分组, ✓/—) | 勉强 | table 可拼, 无粘性列头与分组 |
| B8 | CaseStudy 客户案例卡 | 勉强 | Card 可拼 |
| B9 | FAQ 折叠 | 勉强 | accordion 可用, 无双栏版式 |
| B10 | CTA 横幅 | 勉强 | Gallery 自定义 |
| B11 | SiteFooter 多列 + 订阅 + 社交 + 地区 + 法务 | 不能 | 无 |
| B12 | SiteHeader + MegaMenu + 公告条 + 移动抽屉 | 不能 | C12-C15 |
| B13 | ProductCard / ProductGrid / ProductRail | 不能 | C1 C6 C7 C8 |
| B14 | ProductDetail (画廊 + 选项 + 加购) | 不能 | C4 C6 C8 |
| B15 | Cart / Checkout 步骤 (地址, 配送, 支付, 订单摘要) | 勉强 | Stepper/form 存在, 无摘要与价格行 |
| B16 | 搜索结果页 (筛选侧栏, 排序, 结果网格, 空态) | 勉强 | 零件在, 无版式 |
| B17 | 文档站外壳 (三栏: 侧栏/正文/目录, 上一页下一页) | 勉强 | SidebarNav 有, 无 TOC 与 Pager |
| B18 | Changelog / 博客列表 | 勉强 | Timeline 可借 |
| B19 | 作品集 (粘性侧栏, 经历, 项目) | 勉强 | Timeline + Card |
| B20 | 代码展示区 (多语言 tabs + 结果并排) | 勉强 | CodeBlock + Tabs |
| B21 | 空态 / 404 / 加载骨架 (营销尺度) | 勉强 | EmptyState/skeleton 为工具尺度 |
| B22 | Newsletter / 等候名单 | 勉强 | C20 |

### 3.5 预设与皮肤缺口 (P)

| ID | 能力 | 判定 | 依据 |
| --- | --- | --- | --- |
| P1 | 皮肤机制 `data-skin` (色板 + 圆角 + 字体 + 阴影 + 效果强度一次切换) | 不能 | 只有 data-mode |
| P2 | 至少 6 套皮肤: `default`(现状), `mono` (vercel 黑白), `linear` (暗紫灰), `fintech` (stripe 亮紫), `emerald` (supabase 暗绿), `retail` (nike/apple 黑白大图, 0/大圆角两态) | 不能 | 同上 |
| P3 | 密度 `data-density` (compact 工具 / comfortable 默认 / spacious 营销) 作用于间距与字号 | 不能 | 0 处 density |
| P4 | 字体预设 (display 字体位, 中文 display 回退) | 不能 | 仅 `--font-sans/mono` |
| P5 | 区块 tone (plain / muted / inverted / brand / image) | 勉强 | Section tone 仅 plain/muted/card |

### 3.6 汇总

| 类别 | 条目 | 能 | 勉强 | 不能 |
| --- | --- | --- | --- | --- |
| 排版与间距 T | 8 | 0 | 5 | 3 |
| 组件 C | 24 | 0 | 15 | 9 |
| 效果动效 E | 14 | 3 | 7 | 4 |
| 区块 B | 22 | 0 | 15 | 7 |
| 预设皮肤 P | 5 | 0 | 1 | 4 |
| 合计 | 73 | 3 | 43 | 27 |

## 4. 逐站复现判定 (不改代码)

| 站点 | 首屏 | 整页 | 主要阻塞 |
| --- | --- | --- | --- |
| shopify.com | 不能 | 不能 | T1 C1 C10 C14 B11 B13 |
| nike.com | 不能 | 不能 | C1 C12 C14 C16 B12 B13 P2 |
| apple.com/iphone | 不能 | 不能 | T1 C1 C19 C23 E9 B13 |
| vercel.com | 不能 | 不能 | T1 C2 E3 C13 B11 P2 |
| linear.app | 勉强 | 不能 | T1 C5 E4 B5 B11 |
| stripe.com | 不能 | 不能 | E1 T1 B4 B5 B11 |
| supabase.com | 勉强 | 不能 | T1 C2 C21 B5 B11 |
| resend.com | 不能 | 不能 | C1 E3 T1 B5 B11 |
| clerk.com | 勉强 | 不能 | E4 C1 B11 |
| framer.com | 不能 | 不能 | C3 C1 T1 |
| tailwindcss.com | 不能 | 不能 | T1 T2 C11 B20 |
| bun.sh | 勉强 | 不能 | T1 C22 B11 |
| astro.build | 勉强 | 不能 | E1 T1 C1 B11 |
| react.dev | 勉强 | 勉强 | B20 C5 T1 |
| nextjs.org | 勉强 | 不能 | T1 E4 B11 |
| deno.com | 勉强 | 不能 | T1 C11 B11 |
| brittanychiang.com | 勉强 | 勉强 | C24 B19 (最接近可复现) |
| leerob.com | 勉强 | 勉强 | T8 |
| rauno.me | 勉强 | 勉强 | C24 E11 |
| ui.shadcn.com | 勉强 | 勉强 | T1 (组件同源, 最接近) |
| mantine.dev | 勉强 | 不能 | T1 B11 |
| ant.design | 不能 | 不能 | P1 C1 |
| primer.style | 勉强 | 不能 | T1 B11 |
| carbondesignsystem.com | 不能 | 不能 | C10 T1 |

结论: 24 站中首屏"能"为 0, "勉强" 14; 整页"能"为 0, "勉强" 5 (均为纯排版或组件同源站). 用户的判断成立.

## 5. 补齐优先级 (与任务表对应)

1. **V0 基础** (阻塞一切): T1/T2 display 字号与流体, T4 节奏档, T5/T6 容器与栅格, P1-P4 皮肤/密度/字体机制, C1-C4 媒体原语, E1-E4/E7 背景与遮罩, E8/E10 滚动与编排, C12-C17 站点外壳零件, C6-C9 商业原子.
2. **V1 区块**: B1-B22, 按 marketing / commerce / docs / dashboard / portfolio 五类并行.
3. **V2 整页与回归**: 用区块拼 6 套整页模板 (SaaS 落地页, 开源项目站, 电商首页, 商品详情, 定价页, 作品集), 每套至少在 3 个皮肤下截图回归; 文档站新增 "Blocks" 与 "Pages" 两个导航组.

## 6. 约束提醒 (来自 AGENTS.md)

- 组件颜色只来自语义 token, 线条只用 1px: 渐变边框/发光边须用 `background-clip` 或 `box-shadow` 实现, 不得写 2px 边.
- 不写 `transition-all`; 同一字面量 3 次以上进 `src/constants/`.
- 不在门禁类改动中顺手改上游 open-vetta 视觉类名: 皮肤只能通过新 token 层覆盖, 不改既有组件类名.
- 前端改动 PR 需 GIF 演示.

## 7. 引用来源

仓库内 (工作区映射读取):
- `src/tokens.css`, `src/styles.css`, `src/effects.css`, `src/motion.css`
- `src/box/Container.tsx`, `src/box/Grid.tsx`, `src/box/Bento.tsx`, `src/constants/box.ts`
- `src/primitives/typography.tsx`, `src/primitives/navigation-menu.tsx`, `src/primitives/carousel.tsx`, `src/primitives/aspect-ratio.tsx`
- `src/effects/index.ts`, `src/effects/Backdrop.tsx`, `src/motion/presets.ts`, `src/motion/Reveal.tsx`
- `src/constants/gallery.ts`, `docs/src/pages/gallery/GalleryPage.tsx`, `docs/src/pages/templates/index.ts`
- `AGENTS.md`, `docs/reference/audit/ui-library-tasks.json`

外部官方站点 (2026-11-02 抓取):
- 电商: https://www.shopify.com , https://www.nike.com , https://www.apple.com/iphone/
- SaaS: https://vercel.com , https://vercel.com/pricing , https://linear.app , https://linear.app/pricing , https://stripe.com , https://supabase.com , https://resend.com , https://clerk.com , https://www.framer.com
- 开源: https://tailwindcss.com , https://bun.sh , https://astro.build , https://react.dev , https://nextjs.org , https://deno.com
- 作品集: https://brittanychiang.com , https://leerob.com , https://rauno.me
- 设计系统: https://ui.shadcn.com , https://mantine.dev , https://ant.design , https://primer.style , https://carbondesignsystem.com
