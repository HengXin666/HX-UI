# HX-UI 以战代练: linear.app 首屏复刻失败点清单 (clone findings)

> 日期: 2026-11-03. 复刻产物: docs/src/pages/templates/page-clone-linear/ (data.ts, LinearClonePage.tsx, index.ts).
> 口径: 与 docs/reference/2026-ui-library-reproduction-gap.md (下称 "缺口报告", A1-A6 / B1-B4 / C1-C6 / D1-D3 / E1) 对齐,
> 已在缺口报告里的缺口只引用编号, 不重复论证; 本文件的价值在第二节标 **[新]** 的条目与第三节的 N 系列: 那些是复刻时才暴露的.
> 规则: 复刻页**零自定义 class, 零 style 覆盖, 零 classNames/styles 插槽注入**. 做不到的地方原样留在画面上, 不打补丁.

## 〇 取证方式 (实测, 非公开报道)

- 2026-11-03 实测 `GET https://linear.app` (1.26 MB HTML), 以及首页引用的 10 个
  `https://static.linear.app/web/_next/static/css/*.css` (合计 325 KB). 下表 linear 一列的数值全部来自这两处, 不是记忆.
- 实测首屏结构 (从 `<main>` 起的 DOM 顺序):
  1. 头部 `<header>`: 品牌 + 导航 (Product / Resources / Customers / Pricing / Now / Contact) + `Log in` (纯文字链) + `Sign up` (类名 `S36ykG_variant-invert S36ykG_size-small`, 反色实底).
  2. 顶部留白 spacer: `--height:200px` (桌面) / `124px` / `92px` (laptop) / `132px` (mobile).
  3. h1 `The product development system for teams and agents`, 拆成 4 个 `QI8oKG_titleLine` span, 每行 `opacity:0; filter:blur(10px); transform:translateY(20%)` 入场.
  4. 描述 `Purpose-built for planning and building products. Designed for the AI era.` 与 `New  Loops  →` 链接,
     容器 `QI8oKG_descriptionContainer{align-items:baseline}`, 描述 `max-width:378px`.
  5. 产品界面: **活的 DOM**, 不是截图. 侧栏 (Inbox / My issues / Reviews / Initiatives / Projects / Favorites), 议题 DRV-8852 详情, 活动流, 属性面板.
  6. `Powering the companies building the future` + 7 个内联 svg 字标: OpenAI, Vercel, Salesforce, Figma, Cursor, Coinbase, Ramp (aria-label 取证, 同一组重复 3 份用于轮换).
- 实测令牌: `--title-8-size:4rem`, `--title-8-letter-spacing:-.022em`, `.cVAQDa{line-height:1; font-weight:var(--font-weight-medium)}`,
  `--font-weight-medium:510`, `--font-weight-semibold:590`, `--font-regular:"Inter Variable", "SF Pro Display", ...`,
  `--color-bg-primary:#08090a`, `--color-bg-marketing:#010102`, `--color-text-primary:#f7f8f8`, `--color-text-tertiary:#8a8f98`,
  `--color-border-primary:#23252a` / `#ffffff14`, `--text-large-size:1.0625rem`, `--homepage-max-width:calc(1344px + var(--homepage-outer-padding) * 2)`.
- 我方取值来自工作区映射读到的真实文件: src/tokens.css (1041 行), src/typography/Display.tsx, src/typography/Lead.tsx,
  src/blocks/marketing/Hero.tsx / LogoWall.tsx / parts.tsx, src/constants/blocks.ts, src/constants/blocks-marketing-v102.ts,
  src/primitives/button.tsx, src/skins/linear.css, src/blocks/_shared/{types.ts,PageComposer.tsx,SectionHeading.tsx}.

## 一 复刻结果总评

**约四成像**: 深色底, 1px 细边, 副标题字号与灰阶, 头部与 logo 行的 "有没有" 都拼得出来; 但标题的字重/行高/字体, 不对称的
"标题左 + 描述右基线对齐" 版式, 活的产品界面, 小号 logo 说明文字这四件决定 linear 气质的东西, 现有件一件都做不到.

分块打分 (主观, 以 1440 视口目测对照):

| 区块 | 像几成 | 主要扣分 |
|---|---|---|
| 头部 | 6 | Sign up 不是反色白底而是品牌紫 (N5) |
| 标题 | 3 | 字重 700 vs 510, 行高 1.25 vs 1, 字体 SF Pro Text vs Inter (A1/A3/A4), 断行不同 (N9) |
| 描述 + New 链接 | 3 | 被挤到标题下方另起一行 (N1), 胶囊带边框 (N4), 行宽 60ch vs 378px (N3) |
| 产品主视觉 | 1 | 占位 svg, 无窗口外框 (B2/B3, N12) |
| logo 行 | 3 | 说明文字被渲染成 44-56px 的区块标题 (N2), 第 7 个 logo 折行 (N7), 图标而非字标 (N6) |
| 背景/光晕 | 5 | 底色偏亮 (N8), aurora 是彩色双色而非近黑 (#30) |

加权方式: 标题与产品主视觉各占 30%, 描述与 logo 行各占 15%, 头部与背景各占 5%,
加权约 0.3x3 + 0.3x1 + 0.15x3 + 0.15x3 + 0.05x6 + 0.05x5 = 2.65, 再加 "结构顺序完全正确" 的基础分, 合计约四成.

若只补第三节 3.3 的三项 (Display 接线, editorial 版式, AppShellMock), 预计可到七成;
其余 N 系列多为区块层 props, 补齐后可到八成以上. 剩余差距在品牌字体授权与真实产品截图, 不属于组件库.

## 二 逐项对照表

层级缩写: T = 令牌 (tokens.css / 皮肤 css), P = 原语 (primitives / typography / effects), B = 区块 (src/blocks), C = 内容 / 资产.
"[新]" = 缺口报告未写; "[=A1]" 等 = 缺口报告已有, 此处是复刻实证.

| # | linear 的做法 | 我们的做法 | 差距 | 卡在哪一层 | 补它要改什么 |
|---|---|---|---|---|---|
| 1 | 页面底色 `--color-bg-primary:#08090a`, 营销底 `#010102` | linear 皮肤 `--background:#0f1015` (src/skins/linear.css:16); 默认主题 `#22272e` (src/tokens.css:170) | 底色亮一档, 截图并排一眼看出 "发灰" [新] | T | src/skins/linear.css:16 `--background` 改 `#08090a`; :27 `--muted` 改 `#010102` 作营销底 |
| 2 | 标题 `--title-8-size:4rem` 固定 64px | Display size="lg" = `--fs-display-lg: clamp(3.25rem, 2.917rem + 1.481vw, 4.25rem)` (src/tokens.css:960), 1440 视口 68px, 1200 视口约 63px | ±4px, 可接受 | 无 | 不改. 字号不是问题, 与缺口报告结论一致 (见第四节 4.1) |
| 3 | 字重 `--font-weight-medium:510` (Inter Variable 可变字重) | Display 写死 `font-bold` = 700 (src/typography/Display.tsx:38), 无 weight prop | 粗 190 档, 复刻时最刺眼 [=A3] | P | 按 A3: tokens.css 加 `--fw-display`, linear.css 覆盖为 `510`; Display.tsx:38 `font-bold` -> `font-(--fw-display)` |
| 4 | 行高 `line-height:1` (覆盖了 `--title-8-line-height:1.06`) | Display 写死 `leading-tight` = 1.25 (Display.tsx:38); `--lh-display:1.05` / `--lh-display-tight:1` (tokens.css:966-967) 无人引用 | 4 行标题总高多 64px (64 x 0.25 x 4) [=A1] | P | 按 A1: Display.tsx:38 `leading-tight` -> `leading-(--lh-display)`, size 2xl 用 `--lh-display-tight` |
| 5 | 字距 `-.022em` | Display `tracking-tight` = -0.025em (Display.tsx:38); `--tracking-display:-0.025em` (tokens.css:972) 未被 Display 引用 | 数值差 0.003em 肉眼可忽略, 问题是令牌是死的, 皮肤改不动 [=A2] | P | 按 A2 接线; 另在 src/skins/linear.css 加 `--tracking-display: -0.022em` 一行 |
| 6 | 字体 `"Inter Variable", "SF Pro Display"` | `--font-sans` = `-apple-system, "SF Pro Text", ...` (tokens.css:229); linear 皮肤声明了 `--font-display: "Inter Display", "Inter", ...` (linear.css:10), 但 Display 不读 | 皮肤里写了等于没写 [=A4] | P | 按 A4: Display.tsx:38 加 `[font-family:var(--font-display,var(--font-sans))]` |
| 7 | Inter 字体文件由站点自托管 | 库不带任何 webfont, `--font-display` 里的 "Inter Display" 在未安装的机器上直接回落到 -apple-system | 即使 A4 接线, 访客机器上大概率仍不是 Inter [新] | C | 新增 docs/src/public/fonts/InterVariable.woff2 + docs 入口 `@font-face`; 库只文档化 "皮肤字体需宿主自托管", 不进 src |
| 8 | 标题色 `#f7f8f8` | Display neutral -> `text-heading` (src/constants/typography.ts:39), linear 皮肤 `--heading:#f2f3f7` (linear.css:31) | 基本一致 | 无 | 不改 |
| 9 | 标题拆 4 个显式行 span, 桌面/移动各一套断行 | Hero `title: Rich` 一整串 + `text-balance` (Display.tsx:39) | 断行位置由浏览器决定, 与 linear 的 "The product / development / system for teams / and agents" 不同 [新] | B | Hero.tsx:42 后加 `titleLines?: string[]`, 渲染为 `<span class="block">` 序列 (区块层, 不动 Display) |
| 10 | 每行 `blur(10px) + translateY(20%) + opacity 0` 依次入场 | BLOCK_REVEAL 只有 `fade / rise / stagger` (src/constants/blocks.ts:38), 无 blur 预设, 且作用于整块不按行 | 入场质感做不到 [新] | P | blocks.ts:38 加 `blurLines`; motion 预设读已有 `--stagger-step:60ms` (tokens.css 区块 "入场编排"), 依赖 #9 的行结构 |
| 11 | 标题左, 描述在右下, `align-items:baseline` 同行对齐 | HERO_LAYOUT 五种 (src/constants/blocks-marketing-v102.ts:11-17) 都是标题/描述纵向堆叠; HERO_CLASS.text 写死 `flex flex-col` (v102.ts:126) | **做不到**. 描述被压到标题下方另起一行, 版式气质完全变了 [新] | B | v102.ts:11 加 `editorial: "editorial"`; HERO_CLASS 加 `editorial: "grid @3xl:grid-cols-[1fr_auto] items-baseline"`; Hero.tsx:210-213 分发 |
| 12 | 描述 `max-width:378px`, 强制两行 | Hero 把 Lead 的 `measure` 写死 `"default"` = `max-w-[60ch]` (Hero.tsx:183, Lead.tsx:32), 17px 下约 540px, 变成一行 | 行宽偏宽 [新] | B | HeroProps 加 `leadMeasure?: LeadMeasure`, Hero.tsx:183 透传; 或配合 #11 由 editorial 版式给描述列定宽 |
| 13 | 描述字号 `--text-large-size:1.0625rem` 17px, 色 `#8a8f98` | Lead md = `--fs-lead:17px` (tokens.css:593); 色 `text-muted-foreground`, linear 皮肤 `#8a8f9e` (linear.css:28) | 一致 | 无 | 不改 |
| 14 | `New  Loops  →`: 无边框无底的文字链 | HeroPill 固定胶囊 `rounded-full border border-border bg-background/60 px-3 py-1` (v102.ts:130) | 多出一圈 1px 边与半透明底 [新] | B | HeroPill 加 `variant?: "pill" \| "link"`; v102.ts:130 旁加 `pillLink: "inline-flex items-center gap-2 text-sm text-foreground hover:text-heading"` |
| 15 | Pill 在描述之后 (右列底部) | Hero 把 pill 渲染在标题**之前** (Hero.tsx:168) | 位置反了, 无 prop 可调 [新] | B | HeroProps 加 `pillPosition?: "before" \| "after-lead"`, Hero.tsx:168 / :186 两处条件渲染 |
| 16 | Sign up: 反色实底 (白底黑字), size-small | CTA_VARIANT 只有 `primary / secondary / ghost / link` (blocks.ts:65); primary = `bg-primary` (button.tsx:27), linear 皮肤 primary = `#5e6ad2` 紫 (linear.css:22) | **做不到**白底黑字, 只能出紫色按钮 [新] | P | button.tsx:26-35 加 `invert: "bg-foreground text-background hover:bg-foreground/90"`; blocks.ts:65 / :69 两张映射表加 `invert` |
| 17 | Log in: 纯文字, 色同正文主色 `#f7f8f8` | ghost = `text-muted-foreground` (button.tsx:31) | 偏暗一档 [新] | P/B | 头部区块层可解决: SiteHeader actions 用 `variant: "link"` 并让 link 读 `text-foreground` (不必改 ghost, 见 4.5) |
| 18 | 首屏主按钮: linear **没有** hero 按钮 (任务书 "一主一幽灵" 来自旧版首页) | Hero 支持 `ctas` (Hero.tsx:187) | 无差距; 我们把两个按钮放回头部 actions (data.ts LINEAR_HEADER) | 无 | 不改. 记录: 任务书描述与 2026-11 实测不符, 以实测为准 |
| 19 | 头部到标题留白 200px (spacer `--height:200px`) | Hero pad="lg" = `--section-pad-lg` 88->128px (tokens.css:998); pad="xl" 上限 160px (tokens.css:999) | 少 40-72px [新, 与 C2 方向相反但不矛盾, 见 4.2] | B | 不改 section 令牌. HeroProps 加 `padTop?: BlockPad \| "hero"`, 新令牌 `--hero-pad-top: clamp(5.75rem, ..., 12.5rem)` 只给 Hero |
| 20 | 内容宽 1344px + 外边距 | BLOCK_WIDTH: content 80rem / wide 90rem (blocks.ts:163-164, tokens.css:978); `max` 档实际也是 80rem (blocks.ts:165 读 `--container-max`, tokens.css:834) | 无 84rem 档, 只能在 1280 与 1440 之间二选一 [新]; max 档取错 [=C4] | T | tokens.css:978 后加 `--container-marketing: 84rem`; BLOCK_WIDTH 加 `marketing`; C4 照改 |
| 21 | 产品主视觉: 活的 DOM 界面 (侧栏 + 议题详情 + 活动流) | Hero 只有 `mockup?: ReactNode` 插槽 (Hero.tsx:55), 库里没有任何应用外壳 mock; 复刻页只能塞 `./demo/saas-hero.svg` 占位 | **做不到**, 一成像 [=B2/B3] | C/B | 按 B2 新增 product-mock-frame; 另新增 src/blocks/marketing/mock/ 下 AppShellMock (Sidebar / IssueDetail / ActivityFeed 三件, 数据驱动) [新] |
| 22 | 产品界面自带窗口外框: 1px `#ffffff14` 边, 无地址栏 | HERO_FRAME 只有 `none / browser` (v102.ts:20); browser 带地址栏与红黄绿点 (src/media/frames/browser-frame.tsx:47-66); none 连边都没有 | 二选一都不对 [新, B2 的细化] | B | v102.ts:20 加 `window: "window"`: 只渲染 `rounded-(--radius-xl) border border-(--glass-border)`, 不渲染 toolbar |
| 23 | 产品界面底部渐隐 | product 版式自动包 `MaskFade direction="bottom"` (Hero.tsx:205), 长度读 `--mask-fade` 24->64px | 渐隐偏短, Hero 不透传 MaskFade 的 `length` [新, 小] | B | HeroProps 加 `mediaFade?: number \| string`, Hero.tsx:205 透传 `length` |
| 24 | logo 说明 `Powering the companies building the future`: 小号正文 | LogoWall 的 `title` 必走 SectionHeading (LogoWall.tsx:75, :101), 标题档默认 `md` (blocks.ts:204) = `--fs-display-md` 44->56px, LogoWall 无 titleSize prop | **做不到小字**, 说明文字变成 50px 的区块大标题 [新, 复刻时最意外] | B | LogoWallProps 加 `caption?: Rich`, 渲染为 `text-sm text-muted-foreground` 的 `<p>`, 与 heading 互斥 |
| 25 | logo 行紧贴产品图之下 | Hero 的 `trust` 槽渲染在文字列内、产品图之上 (Hero.tsx:197) | 用 trust 位置错, 用 LogoWall 又撞 #24 [新] | B | HeroProps 加 `trustPosition?: "text" \| "after-media"`, Hero.tsx:211 product 分支在 visual 后渲染 |
| 26 | 7 个 logo 一排 | LOGO_WALL_COLS 只有 3-6 (v102.ts:29, :155-160) | 第 7 个折到第二行 [新] | B | v102.ts:29 加 `7: 7, 8: 8`, :160 后加 `@3xl:grid-cols-7` / `-8`; 或加 `mode: "row"` (flex, justify-between) |
| 27 | 内联 svg 字标 (wordmark), `fill="currentColor"` | `Logo.src: string` 必填 (src/blocks/_shared/types.ts:158), LogoMark 只渲染 `<img>` (parts.tsx:172-190) | 只能用 simpleicons 方形图标替代, 字标做不到; 也无法随 `currentColor` 变色 [新] | B | types.ts:156 Logo 加 `node?: ReactNode` (或 `svg?: string`), parts.tsx:172 LogoMark 优先渲染 node |
| 28 | logo 纯白 / 次级灰, 静态 | `logoGray` = `opacity-70 grayscale` + hover 复原 (v102.ts:120) | 70% 透明度略灰, 方向对 | 无 | 不改 (grayscale 可关) |
| 29 | 描边 `#23252a` / `#ffffff14` | linear 皮肤 `--border:#23252f` (linear.css:33); 默认 `#444c56` (tokens.css:201) | linear 皮肤下一致; 默认主题偏重 [=D1] | T | 按 D1 |
| 30 | 首屏无可见全屏光晕; 光感来自产品界面与黑底的对比 (首屏 `QI8oKG_*` 规则中无 gradient, 全站 css 有 9 处 radial-gradient, 不在首屏) | 任务书要求 "渐变光晕", 我们用 `backdrop: aurora` (Backdrop.tsx:12, 主色 + accent-2 双色); linear 皮肤 accent-2 = `#b48ef0` 紫 (linear.css:42) | aurora 偏彩色, 比 linear 更 "花" [新] | T/P | BackdropSpec.options 文档化 `hue` / `intensity`; linear.css 加 `--effect-intensity` 已有 (linear.css:11, 0.6), 需让 aurora 读它 |

## 三 硬缺口

### 3.1 已在缺口报告中, 复刻再次坐实 (不补, 任何深色 SaaS 首屏都做不了)

- **A1 + A3 + A4 (Display 三连)**: Display.tsx:38 一行写死了字重 700, 行高 1.25, 不读字体位. linear 的标题靠 510 字重 + 行高 1
  + Inter 撑起 "克制" 的气质, 这三个都改不了, 复刻在第一眼就输了. 这是本次复刻**最刺眼**的缺口.
- **B2 + B3 (产品视觉层是空的)**: linear 首屏 60% 的面积是活的产品界面, 我们只有 800 字节的灰色占位 svg.
- **C4 (max 宽度档取错)**: 复刻时想用 `width="max"` 拉宽, 实际得到的仍是 80rem, 才发现 blocks.ts:165 读错令牌.

### 3.2 复刻时才暴露的新缺口 (N 系列, 缺口报告未写)

| 编号 | 缺口 | 位置 | 要做到需要新增什么 | 判据 |
|---|---|---|---|---|
| N1 | Hero 无 "标题左 + 描述右基线对齐" 的 editorial 版式 | v102.ts:11-17, :126; Hero.tsx:210-213 | HERO_LAYOUT 加 `editorial`, 两列 grid + `items-baseline` | 1440 视口下 `[data-slot=marketing-hero-lead]` 的 top 与 h1 末行 baseline 同行 |
| N2 | LogoWall 说明文字被强制渲染成区块大标题 | LogoWall.tsx:75, :101; blocks.ts:204 | LogoWallProps 加 `caption`, 渲染为小号 `<p>` | caption computed fontSize <= 15px |
| N3 | Hero 不透传 Lead measure | Hero.tsx:183 | `leadMeasure` prop | `leadMeasure="narrow"` 时 lead computed maxWidth = 45ch |
| N4 | HeroPill 只有胶囊形态, 且只能在标题前 | v102.ts:130; Hero.tsx:168 | `variant: "link"`, `pillPosition` | link 形态 computed borderWidth = 0 |
| N5 | 按钮无 invert (反色实底) 变体 | button.tsx:26-35; blocks.ts:65, :69 | `invert` 变体 + 两张映射表 | 暗色下 invert 按钮 computed backgroundColor = `--foreground` |
| N6 | Logo 只收 URL, 不收内联 svg | types.ts:156-165; parts.tsx:172 | `Logo.node` | 传 node 时 DOM 中无 `<img>` |
| N7 | logo 网格最多 6 列 | v102.ts:29, :155-160 | 7 / 8 列或 row 模式 | 7 个 logo 在 1440 视口单行 |
| N8 | linear 皮肤底色比 linear 实测亮一档 | linear.css:16, :27 | 改值 `#08090a` / `#010102` | `data-skin=linear` 下 body computed bg = rgb(8, 9, 10) |
| N9 | 标题无显式断行 | Hero.tsx:42, :174-181 | `titleLines` | 渲染出 4 个 `block` span |
| N10 | 无逐行 blur 入场预设 | blocks.ts:38 | `blurLines` 预设 | 减弱动效关闭时首帧 h1 行 filter 含 blur |
| N11 | 无 84rem 营销容器档 | tokens.css:978; blocks.ts:163-168 | `--container-marketing` + `marketing` 档 | computed maxWidth = 1344px |
| N12 | 无 "只有边框的窗口" 外框 | v102.ts:20; browser-frame.tsx:47 | HERO_FRAME `window` | DOM 中无 `browser-frame-address` |
| N13 | Hero 顶部留白无法独立于 section 节奏加大 | tokens.css:998-999; Hero 无 padTop | `padTop` + `--hero-pad-top` | 1440 视口 hero paddingTop = 200px, 其它区块不变 |
| N14 | 皮肤字体无字体文件 | linear.css:10 | 宿主自托管 woff2 + 文档 | `document.fonts.check("16px Inter")` 为 true |

### 3.3 三个最该先补的

1. **A1/A3/A4 Display 接线** (一行改动, 影响所有站点的标题气质).
2. **N1 editorial 版式** (linear / vercel 新版 / 多数 2026 SaaS 首屏都是不对称标题, 现有五种版式全是对称的).
3. **B2 + 新增 AppShellMock** (产品界面是 SaaS 首屏的主角, 占位图永远做不到 "像").

## 四 我差点做错的地方

### 4.1 差点改 `--fs-display-2xl` 上限
任务书写 "linear 用 60-80px 的 display 字", 我一开始准备把 `--fs-display-2xl` (tokens.css:962, 72->96px) 往上调.
实测 linear 是 `--title-8-size:4rem` = 64px, `size="lg"` 已经覆盖. 字号不是缺口, 改了反而破坏其它模板. 与缺口报告 "字号本身不是问题" 一致.

### 4.2 差点为了 200px 顶部留白调大 `--section-pad-*`
linear 头部到标题有 200px, 而我们 pad="xl" 上限 160px. 直接调 tokens.css:996-999 会和缺口报告 C2 ("区块留白档整体偏高, 应下调") 正面冲突.
正解是: section 节奏照 C2 下调, hero 顶部的特殊大留白是 **Hero 区块自己的事** (N13 的 `padTop`), 不是令牌的事.

### 4.3 差点用 classNames 插槽把 Display 改成 510 / 行高 1
Display 支持 `classNames.root`, Hero 也支持 `slots`, 技术上可以在复刻页里塞 `font-[510] leading-none` 立刻 "像" 七成.
没做: 那是打补丁, 会把 A1/A3 的证据藏起来, 下一个用库的人仍然拿到 700 / 1.25.

### 4.4 差点自己写一个 LinearHero 区块
任务允许在 page-clone-linear/ 下新增区块级组件. 我差点写一个两列 grid 的 LinearHero 解决 N1.
没做: 那会让页面 "看起来像", 但 N1 在库里依然存在. editorial 版式应该进 Hero 本身 (区块层, src/blocks), 不应该留在一个复刻页里.

### 4.5 看起来是原语缺口, 其实应在区块层解决的
- **Log in 偏暗 (#17)**: 不该把 button.tsx:31 的 ghost 改亮 (ghost 在后台界面里就该是弱化色). 应在 SiteHeader 的 actions 用 link 变体.
- **Pill 位置与形态 (#14/#15)**: 是 Hero 的 props 缺失, 不是 Badge 原语的问题.
- **logo 说明文字 (#24)**: 是 LogoWall 的 props 缺失, 不该去改 SectionHeading 的默认标题档 (blocks.ts:204), 那会影响所有区块标题.
- **lead 行宽 (#12)**: Lead 原语已有 `narrow` 档, 只是 Hero 没透传, 改 Hero 一行即可.
- **logo 列数 (#26)**: 是区块常量表少两档, 不是 Grid 原语问题.

### 4.6 不该改, 但必须改的 (真正属于库层)
- Display 的字重 / 行高 / 字体 (A1/A3/A4): 区块层无论怎么包都绕不过 Display.tsx:38 的写死类名.
- 按钮 invert 变体 (N5): CTA_VARIANT 是契约, 区块层不能凭空造一个按钮外观.
- linear 皮肤底色 (N8): 只改皮肤文件的两个值, 不动 tokens.css.

## 五 复刻页里的 "补丁" 清单 (最硬的证据)

复刻页 LinearClonePage.tsx 与 data.ts 中: **自定义 class 0 处, 内联 style 0 处, classNames / styles 插槽注入 0 处**.
这是刻意的. 但为了让页面 "能看", 我在 props 层做了下列妥协, 每一处都对应一个缺口:

| # | 妥协 (data.ts 中的 prop) | 本该是什么 | 对应缺口 |
|---|---|---|---|
| P1 | `layout: "product", align: "start"` | editorial 不对称版式 | N1 |
| P2 | `titleSize: "lg"` (流体 52->68px) | 固定 64px, 字重 510, 行高 1 | A1 / A3 (字号本身可接受) |
| P3 | `pill: { badge: "New", label: "Loops" }` 放在标题前且带边框 | 描述之后的纯文字链 | N4 |
| P4 | `media: ./demo/saas-hero.svg` + `frame: "none"` | 活的 DOM 产品界面 + 只有边框的窗口外框 | B2 / B3 / N12 |
| P5 | `backdrop: aurora` + `mask.fade: bottom` | 近黑纯色底 (实测首屏无光晕) | #30 (aurora 无强度/色相控制) |
| P6 | `width: "wide"` (1440px) | 1344px | N11 |
| P7 | `pad: "lg"` (88->128px) | 头部下 200px | N13 |
| P8 | 两个按钮放进 SiteHeader actions, Sign up 用 `primary` (紫) | 反色白底 invert | N5 |
| P9 | `LogoWall.title` 承载 "Powering the companies..." | 小号 caption | N2 |
| P10 | `cols: 6` (7 个 logo) | 一排 7 个 | N7 |
| P11 | logo 用 `cdn.simpleicons.org/<slug>/ffffff` 方形图标, `logoHeight: 24` | 内联 svg 字标 | N6 |
| P12 | `autoMarquee: false` | linear 3 份轮换 (库的 marquee 可用, 但它是横滚不是轮换) | 无 (可接受) |
| P13 | `skin: SKIN.linear` | 底色 `#08090a` | N8 |

## 六 逐步复刻记录 (哪一步卡住, 试了什么, 为什么现有件做不到)

按实际动手顺序记录. 每一步写 "想要 / 试了 / 结果 / 结论".

### 第 1 步 深色底
- 想要: `#08090a` 近黑底, 1px `#ffffff14` 细边.
- 试了: PageComposer `skin={SKIN.linear}` (src/blocks/_shared/PageComposer.tsx:61, :76 写 `data-skin`).
- 结果: 底色 `#0f1015`, 比 linear 亮约 3 个亮度点; 边框 `#23252f` 与 linear `#23252a` 基本一致.
- 结论: 皮肤机制可用, 只是取值没按实测校准 (N8). 不需要新机制.

### 第 2 步 超大标题
- 想要: 64px, 字重 510, 行高 1, 字距 -0.022em, Inter.
- 试了: Hero `titleSize` 依次试 `xl` (60->80px) / `2xl` (72->96px) / `lg` (52->68px). xl 在 1440 视口 80px, 四行标题直接撑出首屏; 最后取 lg.
- 结果: 字号对上了, 但字重 700 让标题 "粗而挤", 行高 1.25 让四行之间空出明显缝隙, 字体是系统 SF Pro Text.
- 再试: 想通过皮肤覆盖 `--fw-display` / `--lh-display`, 发现 Display 根本不读这些变量 (Display.tsx:38 写死 Tailwind 类),
  皮肤里写什么都无效. `--font-display` 在 linear.css:10 已经声明, 也同样无效.
- 结论: 只能停在这里. 唯一能 "修好" 的办法是 classNames 注入, 那是补丁 (第四节 4.3). 坐实 A1 / A3 / A4.

### 第 3 步 标题断行
- 想要: "The product / development / system for teams / and agents" 四行.
- 试了: title 传一整串, 依赖 `text-balance` (Display.tsx:39).
- 结果: 1440 视口下浏览器平衡成三行, 断点与 linear 不同.
- 再试: title 传 ReactNode 并手写 `<br />`? 那要在 data.ts 里放节点, 破坏 "全部可 JSON 序列化" 的模板约定, 且等于手工排版补丁.
- 结论: 缺 `titleLines` (N9).

### 第 4 步 副标题与 New 链接
- 想要: 标题左, 描述在右下与标题末行基线对齐, 描述 378px 宽两行, 下面是 `New Loops →` 文字链.
- 试了: `layout: "split"` -- split 是 "文字 vs 媒体" 两列 (v102.ts:134), 标题和描述在同一列, 媒体被挤到右边, 更不像.
- 再试: `layout: "product", align: "start"` -- 标题, 描述, 产品图纵向堆叠, 左对齐.
- 结果: 描述在标题下方另起一行, 行宽 60ch 一行写完; `pill` 只能出现在标题上方, 且带边框和底色.
- 结论: N1 (版式), N3 (measure 不透传), N4 (pill 形态与位置). 三个都属于 Hero 区块层.

### 第 5 步 按钮
- 想要: 任务书写 "一主一幽灵". 实测 linear 首屏没有按钮, 只有头部 `Log in` 文字链 + `Sign up` 反色白底小按钮.
- 试了: 按实测把两个按钮放进 SiteHeader `actions`: Log in `ghost`, Sign up `primary`.
- 结果: Sign up 出来是 linear 皮肤的品牌紫 `#5e6ad2`, 不是白底黑字; Log in 是 muted 灰, 比 linear 暗.
- 再试: 找 Cta 有没有 `invert` / `contrast` 变体 -- CTA_VARIANT (blocks.ts:65) 与 CTA_BUTTON_VARIANT (blocks.ts:69) 都没有,
  Button 也没有 (button.tsx:26-35).
- 结论: N5 是原语层缺口; Log in 偏暗可在区块层用 link 变体解决 (4.5).

### 第 6 步 渐变光晕
- 想要: 任务书写 "细腻的渐变光晕".
- 实测: linear 首屏相关 css (`QI8oKG_*`) 中没有 gradient; 光感来自黑底上产品界面本身的明暗.
- 试了: `backdrop: { variant: "aurora", mask: { fade: "bottom" } }`.
- 结果: aurora 用主色 + accent-2 (linear 皮肤为紫 + 淡紫), 比 linear 更彩, 更 "模板感".
- 结论: aurora 没有 "近黑单色微光" 的强度/色相控制 (#30). 这里保留 aurora 是为了按任务书要求出效果, 不代表 linear 实测有.

### 第 7 步 产品界面
- 想要: 活的 DOM 产品界面, 窗口只有 1px 边, 底部渐隐.
- 试了: `mockup` 插槽 -- 库里没有任何 app shell mock 可以塞; 自己在复刻页写一个等于造假 (4.4).
- 再试: `media` + `frame: "browser"` -- 出现地址栏与红黄绿点, linear 没有; 改 `frame: "none"` -- 连边框都没有.
- 结果: 占位 svg + 无外框 + 底部 64px 渐隐.
- 结论: B2 / B3 坐实, 外加 N12 (window 外框) 与 #23 (渐隐长度不可调).

### 第 8 步 客户 logo 行
- 想要: 产品图下方一行小字说明 + 7 个白色字标.
- 试了: Hero `trust` -- 位置在文字列内, 产品图上方 (Hero.tsx:197), 不对.
- 再试: 单独一个 LogoWall 区块. `title` 一写上, 渲染成 44-56px 的区块大标题 (SectionHeading 默认 md 档), 首屏立刻失衡.
- 再试: 不写 title, 改用 `description`? 仍然走 SectionHeading, 只是少了标题, 且 LogoWall 的 heading 必有 title 才渲染 (LogoWall.tsx:75).
- 结果: 保留大标题 (作为证据), 7 个 logo 在 6 列网格里折出一行孤儿; logo 是 simpleicons 方形图标而不是字标.
- 结论: N2 / N6 / N7, 全部是 LogoWall 区块层的 props 缺失. 这是复刻时最意外的一处: 一句话的小字说明, 库里没有任何位置能放.

### 第 9 步 宽度与留白
- 想要: 1344px 内容宽, 头部下 200px.
- 试了: `width: "max"` 期待 1536px, 实际 1280px (C4); 改 `wide` = 1440px. `pad: "xl"` 上限 160px, 改 `lg` 避免与 C2 冲突.
- 结论: N11 (缺 84rem 档), N13 (hero 顶部留白应独立).

## 七 验证

- `docs/src/pages/templates/page-clone-linear/` 三个文件已 PUT (201). LinearClonePage.tsx 32 行, data.ts 97 行, index.ts 5 行, 均在红线内;
  无原生 button, 无 transition-all, 无颜色字面量, 无 3 次以上重复字面量.
- 类型检查: 本机未提供 exec 地址, 我方沙箱按约束不 npm install; 以工作区映射读到的 node_modules/typescript 与 @types/react
  对 page-clone-linear/*.ts(x) + page-saas 跑 tsc (第三方库以 ambient 声明桩替代), **page-clone-linear 与 page-saas 0 个错误**.
  完整的 `npx tsc -p docs/tsconfig.json --noEmit` 需在本机跑一次确认退出码.
- 未把页面接入 docs 导航 (templates/index.ts / nav.ts / App.tsx), 与其它模板一致, 归集成任务.

## 附 引用来源

- https://linear.app (2026-11-03 实测 HTML)
- https://static.linear.app/web/_next/static/css/Tpxbzi3N.css 等 10 个样式表 (2026-11-03 实测)
- docs/reference/2026-ui-library-reproduction-gap.md (A1-A6, B1-B4, C1-C6, D1-D3, E1)
- docs/reference/2026-ui-library-visual-audit.md:120-126 (linear.app 反推: ProductMockFrame 等, 至今未实现)
- docs/reference/2026-ui-library-blocks-design.md 第 3 / 4.2 节 (Hero / LogoWall 契约)
