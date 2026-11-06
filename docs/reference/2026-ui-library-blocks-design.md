# HX-UI 区块层 (blocks) 设计与 props 契约

> 类型: reference. 前置阅读: [视觉表现力审计](./2026-ui-library-visual-audit.md). 任务拆分: [任务表](./2026-ui-library-visual-tasks.json).
> 目标: 让"任何前端页面只用 HX-UI 一个库"成立: 营销页, 电商, 文档站, 仪表盘, 作品集都能用数据驱动的区块拼出, 零自定义 class.

## 1. 分层

```
L0 tokens        src/tokens.css + src/skins/*.css      字号/节奏/容器/皮肤/密度 (V0)
L1 primitives    src/primitives, src/media, src/typography, src/site   原子 (V0)
L2 effects       src/effects, src/motion                背景/遮罩/滚动/编排 (V0)
L3 blocks        src/blocks/<category>/<Block>.tsx      页面区块, 只吃数据 (V1)
L4 pages         docs/src/pages/pages/*                 整页模板, 只组合区块 (V2)
```

规则: 上层只依赖下层; 区块禁止写颜色/字号/间距字面量, 只能引用 L0 token 与 L1/L2 组件; 区块之间不互相 import (共享件放 `src/blocks/_shared`).

## 2. 目录规划

```
src/blocks/
  _shared/
    types.ts          BlockBaseProps, 内容类型 (Cta, Media, LinkItem, Badge, Money ...)
    BlockShell.tsx    统一外壳: tone, pad, width, align, reveal, id 锚点, aria
    SectionHeading.tsx 眉标 + 标题 + lead + 动作, 尺度档 sm/md/lg/display
    PageComposer.tsx  按 schema 数组渲染整页, registry 由参数注入
    index.ts
  marketing/   Hero, LogoWall, FeatureGrid, FeatureAlternating, BentoFeatures, StatBand,
               Testimonials, Pricing, ComparisonMatrix, CaseStudies, Faq, CtaBanner,
               CodeShowcase, InstallBlock, Newsletter, ChangelogList, Showcase
  commerce/    ProductCard, ProductGrid, ProductRail, CategoryTiles, CampaignHero,
               ProductDetail, CartSummary, CheckoutSteps, SearchResults, PromoStrip
  site/        SiteHeader, MegaMenuPanel, MobileNav, AnnouncementBar, SiteFooter
  docs/        DocsShell, DocsToc, DocsPager, ApiTable, Callout, DocsHome
  dashboard/   DashboardShell, KpiRow, ChartPanel, ActivityFeed, OnboardingChecklist
  registry.ts  区块名 -> 组件 映射 (集成任务维护, 汇总各类别)
  index.ts     区块层总出口 (集成任务维护)
  portfolio/   ProfileHero, StickyProfileLayout, ExperienceTimeline, ProjectGrid, PostList
```

`site/` 单独成类: 顶栏与页脚在所有类别共用. 命名一律 PascalCase 名词, 不加 `Block` 后缀; 导出时统一前缀命名空间 `Blocks.Marketing.Hero` 之外, 也平铺导出 `MarketingHero` 以便 tree-shaking (由 V-Z 集成任务在 `src/index.ts` 决定).

## 3. 公共契约

### 3.1 BlockBaseProps (所有区块共有)

```ts
interface BlockBaseProps {
  id?: string;                     // 锚点, 也用于 ScrollSpy
  tone?: "plain" | "muted" | "inverted" | "brand" | "image";
  pad?: "none" | "sm" | "md" | "lg" | "xl";      // 映射 --section-pad-* (响应式)
  width?: "prose" | "narrow" | "content" | "wide" | "full" | "bleed";
  align?: "start" | "center";
  reveal?: false | "fade" | "rise" | "stagger";  // 编排预设, 减弱动效时为 false
  backdrop?: BackdropSpec;          // { variant: "grid"|"dots"|"aurora"|"mesh"|"grain"|"beam"|"image", mask?: MaskSpec }
  className?: string;               // 逃生口, 不作为常规用法
  as?: "section" | "div" | "header" | "footer" | "aside";
}
```

### 3.2 内容类型 (数据驱动, 不写死文案)

```ts
type Rich = string | ReactNode;                        // 字符串优先, 便于 JSON 序列化
interface Cta { label: Rich; href?: string; onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "link"; icon?: IconName; external?: boolean }
interface Media { kind: "image" | "video" | "node";
  src?: string; srcSet?: string; sizes?: string; alt: string;
  srcDark?: string;                                   // 亮暗双图
  ratio?: "1/1" | "4/3" | "3/2" | "16/9" | "21/9" | "3/4" | number;
  focal?: [number, number]; priority?: boolean; poster?: string; placeholder?: string;
  node?: ReactNode }                                   // 产品 mock 等自定义节点
interface LinkItem { label: Rich; href: string; badge?: Rich; description?: Rich; icon?: IconName }
interface LinkGroup { title: Rich; items: LinkItem[] }
interface Money { amount: number; currency: string; compareAt?: number; period?: "month" | "year" | "once" }
interface Person { name: string; role?: Rich; avatar?: Media; href?: string }
interface Logo { name: string; src: string; srcDark?: string; href?: string; width?: number }
```

约束: 所有可见文案来自 props; 区块内部只允许无语义的 aria 兜底串, 且必须可通过 `labels` prop 覆盖 (见 3.4).

### 3.3 响应式通则

- 断点沿用 Tailwind sm/md/lg/xl/2xl; 区块内部用**容器查询** (`@container`) 而非视口断点, 保证区块放进窄栏也正确.
- 栅格列数用 `{ base, md, lg }` 对象, 与 `Grid` 现有 `cols` 同构.
- 媒体一律经 `Media` 原语: 自动 `loading="lazy"` (除 `priority`), `decoding="async"`, 占位与比例盒防 CLS.
- 横向溢出内容 (logo, 卡片轨道) 在移动端转为横滑 + 边缘 `MaskFade`.

### 3.4 主题, 密度, 语言

- **皮肤**: 根节点 `data-skin="default|mono|linear|fintech|emerald|retail"`, 与 `data-mode` 正交. 区块只读语义 token, 不感知皮肤名.
- **密度**: `data-density="compact|comfortable|spacious"` 缩放 `--section-pad-*`, `--block-gap-*`, display 字号上限. 仪表盘区块默认 compact, 营销区块默认 spacious, 可被祖先覆盖.
- **语言**: 文案由数据提供; 数字/货币/日期统一走 `Intl` (`Money` 用 `Intl.NumberFormat(locale, {style:"currency"})`), `locale` 从 `<BlocksProvider locale>` 取, 缺省 `navigator.language`. 每个区块接受 `labels?: Partial<BlockLabels>` 覆盖内置 aria 文案 (如"上一张""关闭").
- **方向**: 尊重现有 `primitives/direction` 的 RTL; 区块内用逻辑属性 (`ps-`/`pe-`/`start`/`end`).
- **中文排版**: display 档提供 CJK 回退的字距修正 (`--tracking-display-cjk: 0`), 避免拉丁负字距挤压汉字.

### 3.5 可组合性

- 同页混搭: 区块外壳统一由 `BlockShell` 产出, 相邻区块 tone 相同时自动合并上下留白 (通过 `:where([data-block-tone=x] + [data-block-tone=x])` 收缩 padding-top), 不同时插入分隔.
- `PageComposer`:
  ```ts
  type BlockNode = { type: keyof typeof registry; key?: string; props: Record<string, unknown> };
  <PageComposer blocks={BlockNode[]} skin? density? locale? />
  ```
  让 Agent / CMS 用 JSON 生成整页, 同时 schema 可校验 (每个区块导出 `schema` zod 对象, V2 接入).
- 插槽: 每个区块提供 `slots?: { before?, after?, media? }` 渲染自定义节点, 解决"90% 数据 + 10% 定制".

## 4. 区块契约 (按类别)

以下 props 均另含 `BlockBaseProps`.

### 4.1 site

| 区块 | 关键 props | 响应式 | 备注 |
| --- | --- | --- | --- |
| AnnouncementBar | `message: Rich; cta?: Cta; dismissible?: boolean; storageKey?: string; tone?` | 文字超长时截断 + 展开 | 关闭状态存 localStorage |
| SiteHeader | `brand: {logo: Logo; href}; nav: (LinkItem \| MegaMenuSpec)[]; actions?: Cta[]; search?: SearchSpec; sticky?: boolean; blurOnScroll?: boolean; announcement?: AnnouncementBarProps; localNav?: LinkItem[]` | md 以下折叠为汉堡 → MobileNav | 滚动 8px 后加玻璃底与 1px 底线 |
| MegaMenuPanel | `columns: LinkGroup[]; featured?: {media: Media; title; cta: Cta}[]; footer?: LinkItem[]` | 移动端转钻取列表 | nike 4-5 列, shopify 图片卡 |
| MobileNav | `items: (LinkItem \| {title; children: LinkItem[]})[]; footer?: Cta[]` | 全屏 Drawer, 分级钻取 + 返回 | 焦点陷阱复用 drawer |
| SiteFooter | `columns: LinkGroup[]; newsletter?: NewsletterProps; social?: LinkItem[]; legal?: LinkItem[]; locale?: LocaleSwitcherProps; badges?: Media[]; status?: {label; href; state}; themeSwitch?: boolean; brand?` | lg 6 列 → md 3 列 → 移动端 Accordion | 覆盖 stripe/vercel/supabase/nike |

### 4.2 marketing

| 区块 | 关键 props | 变体 | 响应式 |
| --- | --- | --- | --- |
| Hero | `eyebrow?; pill?: {label; href}; title: Rich; rotate?: string[]; lead?; ctas?: Cta[]; command?: string; media?: Media; mockup?: ReactNode; trust?: {logos?: Logo[]; text?}` | `layout: "centered"\|"split"\|"media-bg"\|"video-bg"\|"product"` | split 在 md 以下堆叠, 媒体在下 |
| LogoWall | `title?; logos: Logo[]; mode: "grid"\|"marquee"; grayscale?: boolean` | 静态网格 / 无限滚动 | 移动端自动 marquee |
| FeatureGrid | `heading?: SectionHeadingProps; items: {icon?; title; body; href?; media?}[]; cols?` | `card \| plain \| numbered (Fig 0.1)` | 1 → 2 → 3/4 列 |
| FeatureAlternating | `items: {title; body; bullets?; cta?; media: Media}[]` | 左右交替 | 移动端媒体在上 |
| BentoFeatures | `items: {title; body?; media?; span?: {col; row}; hoverMedia?: Media}[]` | 复用 `box/Bento` | md 以下单列 |
| StatBand | `items: {value: number\|string; prefix?; suffix?; label; href?}[]; animate?: boolean` | 横排 / 卡片 | 4 → 2 列 |
| Testimonials | `items: {quote; person: Person; logo?: Logo; href?}[]` | `featured \| grid \| masonry \| carousel \| marquee` | masonry 列数随宽度 |
| Pricing | `plans: {name; price: Money\|{label}; description?; features: (string\|{label; included: boolean\|string})[]; cta: Cta; highlight?: boolean; badge?}[]; billing?: {options: ("month"\|"year")[]; default; saveLabel?}` | 卡片 / 紧凑 | 4 → 2 → 1, 推荐档在移动端置顶 |
| ComparisonMatrix | `plans: {key; name}[]; groups: {title; rows: {label; tooltip?; values: Record<planKey, boolean\|string>}[]}[]` | 粘性表头 + 首列 | 移动端切成"选两档对比" |
| CaseStudies | `items: {logo: Logo; title; metrics?: {value; label}[]; media?; products?: string[]; href}[]` | 卡片网格 / 手风琴 (stripe) | |
| Faq | `items: {q; a: Rich}[]; columns?: 1\|2; searchable?: boolean` | 双栏 (标题左, 问答右) | 用原生 details 兜底 SEO |
| CtaBanner | `title; lead?; ctas: Cta[]; media?; backdrop?` | `inline \| boxed \| full` | |
| CodeShowcase | `tabs: {label; language; code; preview?: ReactNode}[]; subTabs?; actions?: Cta[]` | 代码 / 代码 + 预览并排 | 移动端预览在下 |
| InstallBlock | `commands: {manager: "npm"\|"pnpm"\|"yarn"\|"bun"\|"curl"\|string; command}[]` | 胶囊 / 卡片 | 复制后 1.5s 反馈 |
| Newsletter | `title; lead?; placeholder; submitLabel; onSubmit(email): Promise<void>; consent?: Rich` | inline / card | 成功/失败状态 |
| ChangelogList | `items: {date: string\|Date; title; body?; media?; href; tags?}[]` | 卡片 / 时间线 | |
| Showcase | `items: {media: Media; title; href; tags?}[]` | masonry / grid | 作品墙, Framer/Astro themes |

### 4.3 commerce

| 区块 | 关键 props | 响应式 / 交互 |
| --- | --- | --- |
| ProductCard | `media: Media; hoverMedia?: Media; title; subtitle?; price: Money; badges?: ("new"\|"sale"\|"soldout"\|string)[]; swatches?: {name; color?: string; media?: Media}[]; rating?: {value; count}; href; onQuickAdd?` | hover 换图, 色板切换换主图, 售罄灰化 |
| ProductGrid | `products: ProductCardProps[]; cols?; loading?: boolean; empty?: EmptyStateProps` | loading 时渲染同尺寸骨架 |
| ProductRail | `title?; products; cta?` | 横滑吸附, 左右按钮, 边缘淡出 |
| CategoryTiles | `items: {title; media: Media; href; cta?}[]; layout?: "even"\|"feature-first"` | 全出血 / 圆角卡 |
| CampaignHero | `slides: {media: Media; kicker?; title; body?; ctas}[]; autoplay?: number` | 全出血大图, 文字位置 `start\|center\|end` |
| PromoStrip | `items: {icon?; text; href?}[]` | 免运费/退货等横条, 移动端轮换 |
| ProductDetail | `gallery: Media[]; title; price: Money; rating?; options: {name; type: "swatch"\|"size"\|"select"; values}[]; stock?; ctas: Cta[]; details?: {title; body}[]` | 桌面左画廊右信息 (信息粘性), 移动端画廊轮播, 灯箱 |
| CartSummary | `lines: {media; title; options?; qty; price: Money}[]; totals: {label; value: Money}[]; promo?: {onApply}; checkout: Cta` | 抽屉版 / 页面版 |
| CheckoutSteps | `steps: {key; title; content: ReactNode}[]; current; summary: CartSummaryProps` | 复用 `layout/Stepper`; 移动端摘要折叠到顶部 |
| SearchResults | `query; filters: {key; title; options}[]; sort; results: ReactNode; total; onChange` | 桌面侧栏筛选, 移动端 Sheet 筛选 |

### 4.4 docs

| 区块 | 关键 props | 说明 |
| --- | --- | --- |
| DocsShell | `sidebar: LinkGroup[]; toc?: {id; label; depth}[]; header: SiteHeaderProps; children` | 三栏, lg 以下侧栏进 Sheet, TOC 收起 |
| DocsToc | `items; activeId?` | ScrollSpy 高亮 |
| DocsPager | `prev?: LinkItem; next?: LinkItem` | |
| ApiTable | `rows: {name; type; default?; description; required?}[]` | 复用 table, 支持类型折叠 |
| Callout | `kind: "note"\|"tip"\|"warning"\|"danger"; title?; children` | |
| DocsHome | `hero: HeroProps; cards: FeatureGridProps; search?: SearchSpec` | 文档站首页 |

### 4.5 dashboard

| 区块 | 关键 props | 说明 |
| --- | --- | --- |
| DashboardShell | `sidebar; header; children` | 复用现有 sidebar/AppFrame, 默认 compact 密度 |
| KpiRow | `items: StatCardProps[]` | 复用 StatCard |
| ChartPanel | `title; actions?; chart: ReactNode; range?` | 包裹 charts |
| ActivityFeed | `items: {actor: Person; action; time; target?}[]` | |
| OnboardingChecklist | `steps: {title; done; cta?}[]` | 进度条 + 勾选 |

### 4.6 portfolio

| 区块 | 关键 props | 说明 |
| --- | --- | --- |
| ProfileHero | `name; role?; bio: Rich; avatar?: Media; links: LinkItem[]` | |
| StickyProfileLayout | `aside: ProfileHeroProps & {nav: LinkItem[]}; children` | lg 左栏粘性 + ScrollSpy, 移动端上下 |
| ExperienceTimeline | `items: {period; title; org; href?; body?; tags?: string[]}[]` | 扩展 widgets/Timeline |
| ProjectGrid | `items: {media; title; body?; href; tags?}[]` | 悬停抬升 + 图片缩放 |
| PostList | `items: {title; date; href; excerpt?}[]; groupByYear?: boolean` | 纯排版 |

## 5. V0 前置原语 (区块依赖的 L0 到 L2)

| 模块 | 内容 | 目录 |
| --- | --- | --- |
| 字号与节奏 token | `--fs-display-sm..2xl` (clamp, 36→96px), `--lh-display`, `--tracking-display`, `--section-pad-sm..xl` (clamp 48→160px), `--block-gap-*`, `--container-content/wide` (1280/1440/1536) | `src/tokens.css` |
| 皮肤 | 6 套皮肤 css + 密度三档 | `src/skins/` |
| 版式组件 | `Display`, `Eyebrow`, `Lead`, `Kicker`, `GradientText`, `Prose` | `src/typography/` |
| 布局扩展 | Container `wide/bleed`, Section 标题尺度与 `align`, `Grid` span/offset (`GridItem`) | `src/box/` |
| 媒体 | `Image` (srcset/lazy/blur/focal), `ThemedImage`, `Video` (自动播放策略), `Gallery`, `Lightbox`, `DeviceFrame`/`BrowserFrame`, `MaskFade` | `src/media/` |
| 效果 | `MeshGradient`, `Grain`, `Beam`, `GridLines` 准星, 静态渐变描边 (1px, 用 background-clip) | `src/effects/` (新增文件) |
| 动效 | `useScrollProgress`, `Parallax`, `StickyScroll`, `RotatingText`, `SplitText`, 编排预设 `ORCHESTRATION.hero` | `src/motion/` (新增文件) |
| 站点零件 | `StickyHeader` 行为, `ThemeSwitcher`, `LocaleSwitcher`, `ScrollSpy`, `CopyButton` | `src/site/` |
| 商业原子 | `Price`, `PriceRange`, `ProductBadge`, `SwatchPicker`, `SizePicker`, `RatingSummary`, `QuantityInput` | `src/commerce/` |
| 区块基座 | `BlockShell`, `SectionHeading`, `types.ts`, `PageComposer` (registry 在 `src/blocks/registry.ts`, 归 V1-Z) | `src/blocks/_shared/` |

## 6. 皮肤规格 (摘要)

| skin | 参考站 | 色 | 圆角 | 字体 | 效果强度 |
| --- | --- | --- | --- | --- | --- |
| default | 现状 Primer | 现有 token | 0.5rem | sans | 中 |
| mono | vercel, nextjs | 纯黑白 + 灰阶, 主色=前景 | 0.375rem | Geist 类无衬线 (可替换) | 光晕 + 网格线 |
| linear | linear | 暗紫灰, 低饱和 | 0.5rem | Inter 类 | 渐变边 + mask |
| fintech | stripe | 亮底, 紫蓝主色, mesh 三色 | 0.5rem | 无衬线, 标题偏粗 | mesh 渐变 |
| emerald | supabase | 暗底, 绿色主色 | 0.375rem | sans + mono 强调 | 绿光晕 |
| retail | nike, apple | 白/黑, 图像优先, 主色黑 | `sharp` 0 或 `soft` 1.25rem 两态 | 粗体大写 display | 弱 (让位图片) |

每套皮肤只覆盖语义 token (含 `--radius`, `--font-display`, `--shadow-*`, `--gradient-*`, `--effect-intensity`), 不触碰组件类名, 满足"不改上游 open-vetta 视觉类名"约束.

## 7. 质量与验收

- 可访问: 每个区块有 landmark/aria-labelledby; 轮播可暂停; 视频默认静音且有暂停按钮; 所有动效在 `prefers-reduced-motion` 下退化.
- 性能: 首屏 `priority` 图片不懒加载; 区块按类别分包; 效果层只用 transform/opacity.
- 回归: V2 在 `default/mono/retail` 三皮肤 × `light/dark` × 375/768/1440 宽度截图.
- 文档: 每个区块文档页含 "数据示例 JSON", "PageComposer 用法", "皮肤切换预览".

## 8. 典型页面的区块拼法 (验证契约够用)

| 目标站 | 区块序列 |
| --- | --- |
| stripe.com 型 | SiteHeader(mega) → Hero(media-bg, backdrop mesh) → LogoWall(marquee) → BentoFeatures → StatBand → CaseStudies(accordion) → Testimonials(carousel) → CodeShowcase → ChangelogList → CtaBanner → SiteFooter |
| supabase.com 型 | SiteHeader(+GitHubStars) → Hero(centered) → BentoFeatures(hoverMedia) → LogoWall → CodeShowcase → Showcase → Testimonials(masonry) → CtaBanner → SiteFooter(badges, newsletter) |
| nike.com 型 | AnnouncementBar → SiteHeader(mega, search) → CampaignHero → CategoryTiles → ProductRail → PromoStrip → SiteFooter(accordion, locale), skin=retail |
| apple.com/iphone 型 | SiteHeader(localNav) → AnnouncementBar → Hero(product) → ProductRail(swatches) → FeatureAlternating → Showcase → SiteFooter |
| tailwindcss.com 型 | SiteHeader(sticky blur) → Hero(centered, command) → LogoWall(sponsor) → CodeShowcase(preview) → FeatureGrid → SiteFooter |
| brittanychiang.com 型 | StickyProfileLayout(ProfileHero) → ExperienceTimeline → ProjectGrid → PostList |
| linear.app/pricing 型 | SiteHeader → Pricing(billing toggle) → ComparisonMatrix → Faq → CtaBanner → SiteFooter |

## 9. 引用来源

- 审计与站点取证: [2026-ui-library-visual-audit.md](./2026-ui-library-visual-audit.md)
- 现有积木: `src/box/Container.tsx`, `src/box/Bento.tsx`, `src/layout/Stepper.tsx`, `src/widgets/Rating.tsx`, `src/widgets/Timeline.tsx`, `src/primitives/direction.tsx`, `src/motion/Reveal.tsx`
- 外部参考: https://primer.style (Product UI 与 Brand UI 分层), https://ui.shadcn.com (blocks 概念), https://stripe.com , https://supabase.com , https://www.nike.com , https://www.apple.com/iphone/ , https://tailwindcss.com , https://brittanychiang.com , https://linear.app/pricing , https://vercel.com/pricing
- 容器查询与流体字号: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries , https://developer.mozilla.org/en-US/docs/Web/CSS/clamp
