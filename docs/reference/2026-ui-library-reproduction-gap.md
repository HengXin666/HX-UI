# HX-UI 1:1 还原真实站点的缺口取证 (reproduction gap)

> 类型: reference. 只回答一个问题: 为什么用当前 HX-UI 拼不出真实站点, 差在哪些可枚举的视觉手法上.
> 取证日期: 2026-11-03. 仓库状态: 经工作区映射读取的当前 src/ 与 docs/ (非 dist).
> 前置材料 (不重复其结论): [视觉审计](./2026-ui-library-visual-audit.md) (24 站, 2026-11-02, 当时 tokens.css 609 行),
> [区块设计](./2026-ui-library-blocks-design.md), [库差距分析](./audit/ui-library-gap-analysis.md).
> 与视觉审计的关系: 那份文档写于 V0 之前, 结论是 "缺 display 字号 / 节奏 / 媒体原语". 这些 token 与组件**现在已存在**
> (tokens.css 已 1041 行, src/blocks/ 已有 marketing 19 / commerce 10 / portfolio 5 / dashboard 5 个区块, 8 套整页模板).
> 本文只追问: 东西都有了, 为什么拼出来仍然不像.

## 一 结论摘要

1:1 还原目前卡在 3 个硬缺口, 都不是 "缺组件", 而是 "已有的件没接上 / 取值方向错":

1. **硬缺口 A: 展示排版没接线.** `Display` 组件写死 `font-bold leading-tight tracking-tight` (src/typography/Display.tsx:38),
   不读 `--lh-display` (1.05) / `--tracking-display-tight` (-0.04em) / `--font-display`, 所以 80px 标题实际行高 1.25, 字距 -0.025em,
   字重固定 700, 字体是 "SF Pro Text". 真实站点的 display 是 300 到 590 的可变字重, 行高 1.0 到 1.1, 字距 -0.02 到 -0.06em.
   字号本身**不是**问题: 我们 72 到 96px 的上限已覆盖 12 站中 11 站.
2. **硬缺口 B: 产品视觉层是空的.** 模板里 35 张 demo 图全部是约 800 字节的灰色对角线占位 SVG (docs/src/public/demo/);
   Hero 的 `centered` 版式会**静默丢弃** media (src/blocks/marketing/Hero.tsx:209-213), 而 SaaS 模板恰好用 centered + 截图
   (docs/src/pages/templates/page-saas/data.ts:66,75); `product` 版式只有一个 mockup 插槽 + 底部渐隐, 无透视, 无 DeviceFrame, 无 "真实产品界面" 区块.
3. **硬缺口 C: 节奏被 spacious 密度整体放大 25%.** 营销区块默认 `density: "spacious"` (src/constants/blocks.ts:209) =
   `--density: 1.25` (src/skins/density.css:31), 同时改写 Tailwind `--spacing` (density.css:57-59). 结果: 1440 宽下 hero 上下各 200px,
   普通区块上下各 160px, 按钮 lg 从 36px 变 45px, 卡片 p-6 变 30px. 真实站点量到的区块留白是 48 到 96px.

最刺眼的三个数值:
- 区块纵向留白: 我们 160px (pad lg x spacious, 1440 视口) vs linear.app `--page-padding-block: 64px`, supabase.com `md:py-24` = 96px.
- display 行高: 我们 1.25 (Display.tsx:38 `leading-tight`) vs vercel.com 64px/64px = 1.0, stripe.com 1.03, tailwindcss.com `text-8xl` = 1.
- 1px 描边对比度: 我们暗色 1.73:1 (#444c56 on #22272e, tokens.css:201) vs linear.app 1.17:1 (#ffffff14 on #08090a), vercel.com 亮色 1.19:1 (#00000014).

## 二 取证方法

我们的值:
- 全部来自工作区映射读取的源文件, 每条给 `文件:行号`. 流体 clamp 按 tokens.css:944-946 写明的公式 (360px 取下限, 1440px 取上限) 计算到 1440 视口.
- 乘密度的值按 density.css:29-32 的 spacious = 1.25 计算. 这是计算值, 不是浏览器 computed style.
- "某 token 有没有被用" 用 `grep -rl -- "--<token>\b" src docs/src` 排除 tokens.css 自身统计.

真实站点的值:
- **本次没有截图, 也没有打开 devtools 读 computed style.** 方法是用 curl (桌面 Chrome UA) 抓取 12 个站的首页 HTML,
  再抓取 HTML 引用的样式表 (stripe 3 个, linear 46 个, vercel 3 个, nike 5 个, mantine 5 个, apple 9 个, ant.design 8 个), 用正则读:
  1) 首屏 `<h1>` 的 class; 2) 该 class 或其 CSS 变量在样式表里的声明值; 3) Tailwind 站点的 class 频次.
- 因此下文所有真实站点数值都属于 "**我读到的 CSS 值**", 不是渲染实测. 一个 CSS 值对应多档断点时, 取最大视口那档.
  标 "推断" 的条目表示 CSS 值存在但不能确定它作用于首屏 h1.
- Tailwind 默认刻度换算: text-4xl 36px, 5xl 48px, 6xl 60px, 8xl 96px; v4 `tracking-tighter` = -0.05em; py-16 64px, py-24 96px.
- 对比度按 WCAG 相对亮度公式计算, 半透明描边先与页面底色混合再算.

## 三 五个问题的逐条取证

### Q1 首屏为什么不像

现象: 模板首屏结构对 (pill + 标题 + lead + 双 CTA + 背景), 但没有 "产品", 标题像文档标题, 背景是装饰而不是场景.

我们的值:
- Hero 有 5 种版式 `centered / split / media-bg / video-bg / product` (src/constants/blocks-marketing-v102.ts:11-17), 默认 centered, 标题 xl, pad xl (同文件 :46-51).
- `centered` 分支只渲染文本: `else body = text;` (src/blocks/marketing/Hero.tsx:213). 前面算好的 `visual` (Hero.tsx:203) 被丢弃, 无告警.
- SaaS 模板: `layout: "centered"`, `media: saas-hero.svg`, `frame: "browser"` (docs/src/pages/templates/page-saas/data.ts:66,75-77) -> 截图与浏览器框都不渲染.
- `product` 版式 = `flex flex-col` + `productMedia: "mx-auto w-full"` + `<MaskFade direction="bottom">` (blocks-marketing-v102.ts:136,138; Hero.tsx:205).
  全库 grep `perspective|rotateX|rotate-x` 0 命中: 无透视倾斜.
- 外框只有 `HERO_FRAME = { none, browser }` (blocks-marketing-v102.ts:20). `DeviceFrame` 存在 (src/media/frames/device-frame.tsx) 但 src/blocks 下 0 处引用.
- 演示资产: docs/src/public/demo/ 下 35 个 SVG, 每个 794 到 808 字节, 内容是两色线性渐变 + 133px 网格 + 两条对角线, `aria-label="... 占位图"`.
  commerce 首页的商品图, 作品集缩略图, SaaS 截图全是这一种.
- 背景件已齐: `Backdrop / Beam / GradientBorder / Grain / GridLines / MaskFade / MeshGradient / GlassPanel / SpotlightCard / BorderBeam / Marquee` (src/effects/).

真实站点 (读到的 CSS 值 + HTML 结构):

| 站点 | h1 字号 | 字重 / 行高 / 字距 | 首屏视觉元素 | 我们的对应件 | 缺 |
| --- | --- | --- | --- | --- | --- |
| stripe.com | 48px (`--hds-font-heading-xl-size:3rem`, 1.css) | 300 或 400 / 1.03 / -0.02em | 动态波浪渐变 + 标题前景层 `mix-blend-mode:hard-light` (3.css) | MeshGradient | 标题混合模式层, 动画渐变 |
| linear.app | 刻度上限 72px (`--title-9-size:4.5rem`), 推断 | 510 / 590 可变字重, -0.022em | DOM 绘制的完整产品界面 + 渐隐 | Hero product + mockup 插槽 | 产品界面区块, 透视, `text-box:trim-both` |
| vercel.com | 64px (`text-heading-64`, @lg) | 450 / 64px=1.0 / -3.84px=-0.06em | 12 栏栅格参考线 (`--guide-color`) + 光晕图 | GridLines, Beam | 参考线与容器栅格对齐 |
| supabase.com | 48px (`sm:text-5xl`) | 400 / `leading-none` | 暗底 + 产品 bento 插画 | BentoFeatures | 插画资产 |
| tailwindcss.com | 96px (`xl:text-8xl`) | 500 (`max-lg:font-medium`) / 1 / -0.05em | 细网格线 + 代码与渲染并排 | GridLines, CodeShowcase | -0.05em 字距档 |
| astro.build | 48px (`xl:text-5xl/[1.1]`) | 700 / 1.1 | 渐变背景 (`bg-gradient-to-b` 32 次, 旧审计) | MeshGradient | 无 |
| apple.com | 48px (`.typography-headline`, 4.css) | 600 / 1.083 / -0.002em | 全出血产品渲染图磁贴 | media-bg, CategoryTiles | 真实图片 |
| nike.com | 150px (`oversize1: 500 9.375rem/1`, 1440-1919) | 500 / 1.0 / 全大写 | 全出血摄影 campaign | CampaignHero (display-xl 80px) | >96px 档 |
| shopify.com | 96px (`--font-size-dsp:6rem`) | -0.02em | 全宽摄影 + 轮换词 | media-bg + RotatingText | 真实图片 |
| brittanychiang.com | 48px (`sm:text-5xl`) | 700 / -0.025em | 左栏粘性 + 鼠标聚光 | StickyProfileLayout | 无 (我们 52 到 68px 反而更大) |
| mantine.dev | 72px (`4.5rem * --mantine-scale`) | 450 / 1.1 | 组件实景演示墙 | 无专门区块 | LiveDemo 墙 |
| ant.design | 推断 72px (4.css 中唯一的 `font-size:72px`) | 未读到 | 插画 + 主题实时预览 | 无 | ThemePlayground |

缺在哪一层:
- **区块层 (Hero)**: centered 丢 media 是缺陷; product 版式缺 "透视 + 叠层 + 出血" 参数.
- **组件层**: 缺一个承载 "真实产品界面" 的容器 (ProductMockFrame: 倾斜, 透视, 亮暗双图, 底部渐隐, 可塞 DOM 也可塞截图). DeviceFrame 未接入 Hero.
- **资产层**: 模板没有任何真实截图或摄影. 这一条不是库的缺口, 但它是 "模板看起来不像" 的最大单一原因 (见第五节).
- 背景处理层基本齐全, 只缺标题混合模式 (stripe) 与参考线-容器对齐 (vercel).

### Q2 字号与字重体系为什么不够

我们的值:
- `--fs-display-*` (tokens.css:958-962): sm 36->44, md 44->56, lg 52->68, xl 60->80, 2xl 72->96 px (360->1440 视口).
- 固定档 `--fs-6xl 36 / 7xl 48 / 8xl 60` (tokens.css:807-809), src 内 0 处引用.
- 字重 `--fw-regular 400 / medium 500 / semibold 600 / bold 700` (tokens.css:820-823), 共 4 档, 全部静态整数.
- `Display` 根类: `font-bold leading-tight tracking-tight [font-synthesis:none]` (Display.tsx:38). Tailwind `leading-tight` = 1.25, `tracking-tight` = -0.025em.
  `--lh-display: 1.05` / `--lh-display-tight: 1` (tokens.css:966-967) 与 `--tracking-display-tight: -0.04em` (tokens.css:973) 不被 Display 读取;
  `--tracking-display-tight` 在 src 内 0 处引用.
- 同一个 "区块标题" 角色有两套字重: `SectionHeading` 走 `BLOCK_CLASS.displayType` = `font-semibold` + `--lh-display` (src/constants/blocks.ts:191),
  Hero / CtaBanner / Newsletter 走 `Display` = `font-bold` + 1.25. 同页 hero 与 section 标题行高与字重不一致.
- 字体: `--font-sans` 首位是 "SF Pro Text" (tokens.css:229), 是小字号光学尺寸. `--font-display` 只在皮肤层定义
  (src/skins/foundation.css:24 回退到 sans; linear.css:10 "Inter Display"; mono.css:10 "Geist"; retail.css:10 "Helvetica Neue"),
  而 Display.tsx 不引用它, 唯一引用处是皮肤演示 src/constants/skins.ts:82. 切到 linear 皮肤, 标题字体不变.
- CJK: `data-cjk:leading-snug data-cjk:tracking-[var(--tracking-display-cjk)] data-cjk:[line-break:strict]` (Display.tsx:40),
  即中文标题行高 1.375, 字距 0. Eyebrow CJK 取消大写 (Eyebrow.tsx:38), Lead CJK 用 `leading-loose` 2.0 与 em 行宽 (Lead.tsx:31-37).
- Eyebrow 字号 10/11/12px (Eyebrow.tsx:27-29); Lead 15/17/19px (Lead.tsx:24-26); Prose 13/15/17px 正文, h1 固定 `--fs-5xl` 30px (Prose.tsx:23-25,35).

真实站点的值 (读到的 CSS 值):
- display 字号: 48 (stripe, supabase, astro, apple, brittanychiang), 64 (vercel), 72 (linear 刻度上限, mantine, ant.design 推断), 96 (tailwindcss, shopify), 150 (nike).
  -> 我们 2xl 上限 96px 覆盖除 nike 外全部. **字号不是缺口.**
- 字重: vercel 450, mantine 450, linear 300/400/510/590/680 (`--font-weight-*`), stripe 300/400, nike 500, apple 600, astro HTML 中 light/normal/medium/semibold/bold 5 种.
  -> 真实站点 display 用的是 300 到 600 的可变字重, 我们 Display 唯一取值 700.
- 行高: vercel 1.0, tailwind 1.0, nike 1.0, stripe 1.03, apple 1.083, astro/mantine 1.1. 我们 1.25.
- 字距: vercel -0.06em, tailwind -0.05em, linear -0.022em, stripe/shopify -0.02em, apple -0.002em. 我们 -0.025em 固定, 没有随字号加大的收紧.

CJK 判定:
- 字距 0 正确 (负字距会挤压汉字), 保留.
- 行高 1.375 对 80px 中文偏松: 两行标题之间约 30px 空白. 本次没有量中文站点, 此条依据是排版常识而非实测, 列为待核验:
  建议值 `--lh-display-cjk: 1.2`, 放进 tokens.css 展示级一节 (:966 附近), Display.tsx:40 改读它.
- 字体回退顺序 "Noto Sans SC" 在 "PingFang SC" 之前 (tokens.css:229): 装了 Noto 的 macOS 会用 Noto 而不是苹方, 中文 display 观感会变. 低优先级.

缺在哪一层: **typography 组件层没消费 token 层**. token 层只缺两项: 可变字重档 (`--fw-display`) 与 CJK display 行高.

### Q3 布局为什么不够

我们的值:
- 容器 token: `--container-narrow 45rem / --container-max 80rem / --container-wide 90rem` (tokens.css:833-835),
  `--container-content 80rem / --container-display 96rem` (tokens.css:978-979).
- 区块宽度档 `BLOCK_WIDTH_CLASS` (src/constants/blocks.ts:160-168): content -> `--container-content` 1280; wide -> `--container-wide` 1440;
  **max -> `--container-max` = 80rem = 1280**, 与 content 相同, 比 wide 还窄. 回退值写的是 96rem, 说明本意是 `--container-display`. 这是取值错误.
- 横向内边距: 区块写死 `gutter: "px-4 sm:px-6 lg:px-8"` (blocks.ts:187); token `--container-padding-x: clamp(16px,4vw,32px)` (tokens.css:837) 与
  `--grid-gutter` (tokens.css:841) 在 src/blocks 中 0 处引用.
- 12 栏能力: `Grid cols={12}` + `GridItem span/start/offset` 已存在 (src/box/Grid.tsx:33-34,114-135), 可写 7/5, 8/4.
  但 src/blocks 与 docs/src/pages/templates 中 0 处使用 `GridItem`; 区块各自写 container query 等分列, 例如
  FeatureGrid `@2xl:grid-cols-2 @4xl:grid-cols-3` (blocks-marketing-v103.ts:13), Pricing `md:grid-cols-2 lg:grid-cols-3` (blocks-marketing-v105.ts:64).
  唯一的非对称是 ProductDetail `7fr/5fr` (blocks-commerce-v108.ts:205) 与 StickyProfileLayout `5/12 + 7/12` (blocks-portfolio-v111.ts:92-93).
- 出血: `BLOCK_WIDTH.bleed` 去掉 gutter (BlockShell.tsx:156); `Container` 有 `full / breakout` (src/constants/box.ts:228-234).
  只有 CampaignHero / PromoStrip 默认 bleed (CampaignHero.tsx:80, PromoStrip.tsx:97). 没有 "单侧出血" (分屏 hero 媒体冲出容器右缘).
- 卡片跨栏: BentoFeatures 支持 `span: {col,row}` (page-saas/data.ts:108). 可用.

真实站点的值 (读到的 CSS 值, 1440 视口折算的左右留白合计占比):
- vercel.com `--geist-page-width:1200px`, 12 栏 (`grid-cols-12` 7 处): (1440-1200)/1440 = 16.7%.
- astro.build `max-w-screen-xl` 13 次 = 1280px: 11.1%. brittanychiang.com 同为 `max-w-screen-xl`.
- stripe.com 样式表中的 max-width 1184 / 1232 / 1263 / 1295px; 首屏标题 `grid-column-start:2; grid-column-end:-2` (3.css), 即页面级栅格把边距本身做成列.
- linear.app `--page-max-width:1024px`, `--page-padding-inline:24px`: 28.9% (推断, 不确定此变量作用于首屏).
- shopify.com `md:grid-cols-12` 4 处, `grid-cols-full` 14 处 (自定义整幅栅格), `max-w-[65ch]` 8 处.
- tailwindcss.com 文本列 `max-w-(--breakpoint-md)` 768px, `max-w-80` 33 次; 正文区窄而栅格线铺满.
- 我们 content 1280 + gutter 32: 正文宽 1216, 15.6%. **与真实站点同一量级, 宽度不是缺口.**

缺在哪一层: **区块层不用已有的 box 层**. 需要的是: 区块列体系改用 Grid/GridItem, max 档修值, gutter 改读 token, Hero split 加单侧出血参数.

### Q4 细节层次为什么不够

| 维度 | 我们的值 (文件:行) | 真实站点 (读到的 CSS 值) | 差异 |
| --- | --- | --- | --- |
| 1px 描边 | 暗 `--border` #444c56 on #22272e = 1.73:1 (tokens.css:170,201); 亮 #d1d9e0 on #fff = 1.43:1 (tokens.css:250,269); 均为不透明实色 | linear.app `--color-border-primary:#ffffff14` on `#08090a` = 1.17:1, 另有 1f/26 两档; vercel.com `--ds-gray-alpha-400` 亮 #00000014 = 1.19:1, 暗 #ffffff24 = 1.44:1 | 我们描边重 20% 到 45%, 且是实色, 叠在渐变/图片上会显出灰框 |
| 卡片阴影 | 暗 `--shadow-lg` 两层 alpha .28/.36 (tokens.css:338); Hero/Showcase 媒体盒默认 `shadow-lg` (blocks-marketing-v102.ts:115) | 本次未读到可对应的值 | 未量, 不下结论 |
| 圆角 | `--radius` 8px (tokens.css:241); `--card-radius` = radius-xl 12px (tokens.css:864); 但营销卡片写 `rounded-(--radius-lg)` 8px (v103:96, v104:130, v105:69), CTA boxed 与 Newsletter card 写 radius-xl 12px (v102:165,176), 代码块 `rounded-xl` (v106:99) | linear.app 刻度 4/6/8/12/16/24/32; vercel.com `--geist-marketing-radius:8px`, `--geist-radius:6px`; astro.build `rounded-xl` 109 次为主 | 同一页 8 与 12 混用, 卡片 token 与区块实写不一致 |
| 图标 | 特性图标盒 `size-10` 内 svg `size-5` (v103:99), 外加 1px 边框底色盒; 无描边粗细 token (tokens.css grep `stroke` 0 命中) | 未读到图标 CSS 值 | 只能确认我们不可调描边 |
| 图片比例 | `MEDIA_RATIO` 1/1, 4/3, 3/2, 16/9, 21/9, 3/4 (blocks.ts:74-81) | shopify.com 卡图 740x464 = 1.595 (16:10, 旧审计); nextjs `aspect-5/4`, `aspect-600/337` (旧审计) | 缺 16/10 与 5/4 命名档 |
| 动效 | `--duration-fast 120 / base 200 / slow 300ms` (tokens.css:599-601), `--ease-out: cubic-bezier(0.2,0,0,1)` (tokens.css:618), `--stagger-step 60ms` | linear.app `--speed-quickTransition .1s / regularTransition .25s`, `--ease-out-quint (.23,1,.32,1)`; vercel.com `--hero-duration .35s`, `--transition-step .2s` | 同一量级, 不是缺口 |

缺在哪一层:
- **token 层**: 缺半透明描边档. 需新增 `--border-subtle: color-mix(in srgb, var(--foreground) 8%, transparent)` 与 `--border-strong` (12%), 亮暗两套各声明一次.
- **区块常量层**: 营销卡片圆角从 `--radius-lg` 统一改读 `--card-radius` (v103:96, v104:130,200,213, v105:69).
- **token 层**: `MEDIA_RATIO` 增加 `wide: "16/10"`, `frame: "5/4"`.

### Q5 内容密度为什么不对

我们的值 (1440 视口, 计算值):
- `--section-pad-*` (tokens.css:996-999) 默认密度: sm 48->64, md 64->96, lg 88->128, xl 112->160 px.
- 营销默认 `pad: "lg"` (blocks.ts:201), Hero `heroPad: "xl"` (blocks-marketing-v102.ts:51), 默认 `density: "spacious"` (blocks.ts:209) -> `--density: 1.25` (density.css:31).
  -> 普通区块上下各 **160px**, Hero 上下各 **200px**. 下限也被抬高: 普通 110px, Hero 140px.
- 相邻同 tone 合并 padding-top (blocks.ts `BLOCK_TONE_MERGE_CLASS`), 所以两个 plain 区块之间内容间距 160px; tone 交替时 320px.
- spacious 同时改写 `--spacing` (density.css:57-59), 所以区块里所有 Tailwind 刻度一起放大: Button `lg` = `h-9` (src/primitives/button.tsx:43) 36 -> 45px,
  默认 `h-8` 32 -> 40px; 卡片 `p-6` 24 -> 30px; 特性图标盒 `size-10` 40 -> 50px; `gap-6` 24 -> 30px.
- 首屏可见内容 (1440x900, centered hero, 2 行标题, 计算值): 顶栏约 64 + pad-top 200 + 眉标/pill 约 30 + 标题 96x1.25x2 = 240 + lead 3 行约 83 + CTA 45 + 间隙约 90 = 约 750px,
  product 版式的截图要再隔 `--block-gap-lg` 64x1.25 = 80px 才开始, 首屏只露约 70px.
- 潜在冲突: tokens.css:717 定义 `--density-space = 4px x density`, 而 density.css:37 定义为 `1rem x density`; tokens.css 在 `@layer hx.tokens` (tokens.css:27-29),
  density.css 不分层, 后者恒胜. 于是 tokens.css 里 `--space-N` = N x 16px, `--section-space-y` (tokens.css:767) = clamp(256px, 8vw, 384px).
  这些派生令牌当前 0 处消费 (grep `--space-4 / --card-padding / --section-gap` 无结果), 所以还没有视觉后果, 但任何新区块一引用就会放大 4 倍.
  另: tokens.css:713 comfortable = 1.125, density.css:26 comfortable = 1, 两处矛盾.

真实站点的值 (读到的 CSS 值 / class 频次):
- linear.app `--page-padding-block:64px`, `--page-padding-y:48px`.
- supabase.com 区块 `py-16` 12 次, `sm:py-18` 11 次, `md:py-24` 11 次 -> 64 / 72 / 96px.
- nextjs.org `py-16` 65 次 (旧审计) -> 64px.
- brittanychiang.com `lg:py-24` -> 96px.
- vercel.com 区块之间用栅格线分隔, HTML 中 `py-0` 85 次, 无大于 `pb-6` 的区块留白: 节奏靠描边而非空白.
- 按钮高度: vercel.com 用 `--geist-form-height` 系列 (值未读到), linear.app 未读到. 不下结论.

结论: 我们的区块留白下限 (110px) 已高于真实站点上限 (96px). 区块本身的内部排版 (卡片 p-6, gap-6) 在默认密度下与真实站点同级, 问题出在 spacious 乘数.

缺在哪一层: **皮肤/密度层 + 区块默认值**. 不是每个区块都松, 是一个乘数把所有区块一起放大.

## 四 硬缺口清单

| 编号 | 缺口 | 影响站点 | 补它要改哪一层 / 哪一行 | 可机械验收的判据 |
| --- | --- | --- | --- | --- |
| A1 | Display 不读 display 行高 | 全部 12 站 | src/typography/Display.tsx:38 `leading-tight` -> `leading-(--lh-display)`; size 2xl 时 `leading-(--lh-display-tight)` | 渲染 `<Display size="xl">` 后 `getComputedStyle(h).lineHeight / fontSize` 在 1.00 到 1.06 |
| A2 | Display 字距不随字号收紧 | vercel.com, tailwindcss.com, linear.app, stripe.com | Display.tsx:38 `tracking-tight` -> sm/md 读 `--tracking-display`, lg 以上读 `--tracking-display-tight`; grep `--tracking-display-tight` 在 src 内出现 >= 1 | size="2xl" 的 computed letterSpacing = -0.04em 对应 px 值 |
| A3 | Display 字重写死 700, 无可变字重档 | vercel.com, mantine.dev, linear.app, stripe.com, nike.com | tokens.css:820-823 后加 `--fw-display: 600` (皮肤可覆盖为 450/510/300); Display.tsx:38 `font-bold` -> `font-(--fw-display)`; DisplayProps 加 `weight?: "light"\|"regular"\|"medium"\|"semibold"\|"bold"` | `data-skin="mono"` 下 h1 computed fontWeight = 皮肤声明值; Display.tsx 中 grep `font-bold` 0 命中 |
| A4 | display 字体位未接线 | 全部皮肤演示 | Display.tsx:38 加 `[font-family:var(--font-display)]`; blocks.ts:191 displayType 同步 | `data-skin="linear"` 下 h1 computed fontFamily 以 "Inter Display" 开头 |
| A5 | 两套区块标题字重/行高不一致 | 所有模板 | blocks.ts:191 与 SectionHeading.tsx:172 改为渲染 `<Display>`, 删除 displayType 中 `font-semibold` 与 lh 自写 | 同页 Hero h1 与 Section h2 的 computed lineHeight/fontSize 比值相等 |
| A6 | CJK display 行高 1.375 | 中文模板 (page-saas, page-commerce-home) | tokens.css:967 后加 `--lh-display-cjk: 1.2`; Display.tsx:40 `data-cjk:leading-snug` -> `data-cjk:leading-(--lh-display-cjk)` | `lang="zh-CN"` 的 Display computed lineHeight/fontSize = 1.2 (待中文站点实测后再定值) |
| B1 | Hero centered 丢弃 media | 模板 page-saas; vercel.com, linear.app, supabase.com 式 "标题下截图" | Hero.tsx:213 `else body = text` 改为 `media \|\| mockup` 存在时按 product 布局渲染 visual; 或在 dev 下 console.warn | page-saas 渲染后存在 `[data-slot=marketing-hero-media]` 且内含 browser-frame |
| B2 | 无 "真实产品界面" 容器 | linear.app, vercel.com, stripe.com, supabase.com, mantine.dev | 新增 src/media/frames/product-mock-frame.tsx: props `tilt` (deg), `perspective` (px), `fade` (MaskFade 方向), `themed: {light, dark}`; HERO_FRAME (blocks-marketing-v102.ts:20) 增加 `device`, `mock` 两档并在 Hero.tsx:202 分发 | src 内 grep `perspective` >= 1; Hero `frame="device"` 渲染出 `[data-slot=device-frame]` |
| B3 | 模板资产全为占位 | 全部 8 套整页模板 | docs/src/public/demo/ 下 35 个 SVG 替换为真实截图 (用本库 dashboard/chat 模板截屏生成) 与授权摄影 | `find docs/src/public/demo -size -2k` 结果为 0 |
| B4 | 标题混合模式层 | stripe.com | effects 加 `BlendTitle` 或 Display 加 `blend?: "hard-light"\|"overlay"`, 只作用于 Hero tone=image | Hero 标题 computed mixBlendMode != normal |
| C1 | spacious 乘数放大全部间距 | 全部 SaaS 与开源站 | blocks.ts:209 默认 density 改 `comfortable`; 或 density.css:31 spacious 只乘 `--section-pad-*`, 删除 density.css:57-59 对 `--spacing` 的改写 (仅 spacious 作用域) | 1440 视口下 `pad="lg"` 区块 computed paddingTop <= 128px; Hero 内 Button lg computed height = 36px |
| C2 | 区块留白档整体偏高 | linear.app, supabase.com, nextjs.org, brittanychiang.com | tokens.css:996-999 下调为 sm 40->48, md 48->64, lg 64->96, xl 96->128 (px); Hero heroPad (v102:51) 改 lg | 默认密度 1440 视口 `--section-pad-lg` 计算值 = 96px |
| C3 | density 双重定义 | 潜在, 任何新区块 | 删 tokens.css:708-717 的 `--density / --density-space` 定义 (以 density.css 为唯一来源), 或把 density.css:37 改名 `--density-rem`; 统一 comfortable 取值 | grep `--density-space:` 在 src 内只命中 1 处; `--space-4` 计算值 = 16px |
| C4 | `max` 宽度档取错 token | 宽屏站 (nike.com, apple.com, shopify.com) | blocks.ts:165 `--container-max` -> `--container-display` | `width="max"` computed maxWidth = 1536px |
| C5 | 区块不用 12 栏 / gutter 写死 | stripe.com, vercel.com, shopify.com | blocks.ts:187 改 `px-(--container-padding-x)`; FeatureGrid / Pricing / Testimonials 的列类 (v103:12-24, v105:63-65, v104:26-29) 改为 Grid cols=12 + GridItem span | src/blocks 内 grep `GridItem` >= 3; grep `px-4 sm:px-6 lg:px-8` 0 命中 |
| C6 | 无单侧出血 | apple.com, nike.com, stripe.com | Hero split 加 `mediaBleed?: boolean`, 媒体列用 `margin-inline-end: calc(50% - 50vw)` (同 box.ts:234 的 breakout 写法) | split + mediaBleed 时媒体右缘 = 视口右缘 (getBoundingClientRect().right === innerWidth) |
| D1 | 描边过重且为实色 | linear.app, vercel.com | tokens.css 暗色段 (:201 附近) 与亮色段 (:269 附近) 新增 `--border-subtle` (8%) / `--border-strong` (12%) color-mix; 营销卡片 (v103:96, v104:130, v105:69) 改读 `--border-subtle` | 暗色下卡片描边与 card 底色对比度 <= 1.25:1 |
| D2 | 圆角混用 | 全部 | 营销卡片 `rounded-(--radius-lg)` -> `rounded-(--card-radius)` (v103:96, v104:130,200,213, v105:69,79,111) | src/constants/blocks-marketing-*.ts 中 grep `rounded-(--radius-lg)` 只剩媒体盒 |
| D3 | 缺 16:10 / 5:4 比例档 | shopify.com, nextjs.org | blocks.ts:74-81 MEDIA_RATIO 增 `wide: "16/10"`, `frame: "5/4"` | `ratio="wide"` 渲染 aspect-ratio = 1.6 |
| E1 | >96px 的 oversize 档 | nike.com | tokens.css:962 后加 `--fs-display-3xl: clamp(5rem, ..., 9.375rem)` (80->150px), Display size 加 "3xl", CampaignHero 默认用它 | `size="3xl"` 在 1440 视口 computed fontSize = 150px |

优先级: A1-A5, B1, C1 是改几行就能让 12 站整体观感变化的项, 先做; B2, C2, C5, D1 次之; B3 是模板资产, 与库发版解耦; A6, B4, C6, D3, E1 最后.

## 五 不该做的事

1. **不要再加 display 字号档 (除 E1 外).** 2xl 上限 96px 已覆盖 tailwindcss.com / shopify.com 的 96px; stripe.com / supabase.com / apple.com / astro.build / brittanychiang.com 只有 48px.
   "标题不够大" 的观感来自行高 1.25 与字重 700, 不是字号.
2. **不要加宽容器.** 我们 1280 正文区与 astro.build 相同, 比 vercel.com 1200 还宽. 只修 C4 的取值错误, 不新增档.
3. **不要再加背景特效组件.** Backdrop / Beam / Grain / GridLines / MaskFade / MeshGradient / GradientBorder / GlassPanel 都已在 src/effects/. 缺的是 Hero 把它们和产品视觉叠在一起的参数 (B2), 不是新特效.
4. **不要调动效时长与曲线.** 120/200/300ms + cubic-bezier(0.2,0,0,1) 与 linear.app 的 100/250ms + ease-out-quint, vercel.com 的 350ms 同一量级.
5. **不要给 CJK 加负字距.** `--tracking-display-cjk: 0` (tokens.css:974) 是对的.
6. **不要把 B3 (占位图) 当成库缺口去补组件.** 占位图让每个模板都像线框稿, 但换上真实截图不需要改任何 src/ 代码. 先换资产再判断组件差距, 否则会把资产问题误判为组件问题.
7. **不要逐个区块调 padding.** 区块内部 p-6 / gap-6 在默认密度下与真实站点同级, 松是 spacious 乘数造成的 (C1). 在区块里写死更小的值会让 compact 密度失效.
8. **不要再造 12 栏栅格或出血容器.** src/box/Grid.tsx 与 box.ts:228-234 已经能表达 7/5, offset, breakout. 缺的是区块去用它们 (C5, C6).
9. **不要基于本文未量到的项下结论.** 卡片阴影层次, 图标描边粗细, 真实按钮高度, linear.app 首屏 h1 的确切档位, ant.design 72px 的作用对象,
   本次只读到 CSS 变量或没有读到. 动手前需要截图或 devtools computed style 实测, 实测结果追加到本文第三节.

## 附 引用来源

仓库 (工作区映射读取, 2026-11-03):
- src/tokens.css:27-29, 170, 201, 229, 241, 250, 269, 338, 579-594, 599-628, 708-717, 767-770, 807-823, 833-841, 864, 944-979, 990, 996-1004
- src/skins/density.css:16-59; src/skins/foundation.css:24; src/skins/linear.css:10; src/skins/mono.css:10; src/skins/retail.css:9-10,89
- src/typography/Display.tsx:25-41; Eyebrow.tsx:27-38; Lead.tsx:24-37; Prose.tsx:23-35
- src/constants/blocks.ts:74-81, 129-133, 160-168, 175-179, 187-193, 199-210
- src/constants/blocks-marketing-v102.ts:11-20, 45-65, 115, 125-138, 165, 176; v103:12-24, 44-49, 94-137; v104:26-29, 61-73, 130, 200, 213; v105:63-111; v106:99
- src/constants/blocks-commerce-v107.ts:217, 226, 233; blocks-commerce-v108.ts:205, 221; blocks-portfolio-v111.ts:81, 92-93; blocks-dashboard-v110.ts:146, 221
- src/blocks/marketing/Hero.tsx:130-231; src/blocks/_shared/SectionHeading.tsx:163-172; src/blocks/_shared/BlockShell.tsx:156
- src/box/Grid.tsx:33-135; src/constants/box.ts:227-234, 300-322; src/media/frames/device-frame.tsx; src/primitives/button.tsx:40-43
- docs/src/pages/templates/index.ts; page-saas/data.ts:65-86, 108; page-saas/SaasLandingPage.tsx:37-57; docs/src/public/demo/ (35 个 SVG)

外部站点 (curl 抓取首页 HTML 与其样式表, 2026-11-03, 读 CSS 值, 非截图):
- https://stripe.com (1.css `--hds-font-heading-xl-*`, 3.css `h1.hero-section__title`)
- https://linear.app (`--title-N-size`, `--font-weight-*`, `--color-border-*`, `--page-*`, `--radius-*`, `--speed-*`, `--ease-out-*`)
- https://vercel.com (`.text-heading-64`, `--geist-page-width`, `--ds-gray-alpha-400`, `--geist-marketing-radius`, `--hero-duration`)
- https://supabase.com, https://tailwindcss.com, https://astro.build, https://brittanychiang.com (h1 class 与 Tailwind class 频次)
- https://www.apple.com (4.css `.typography-headline`), https://www.nike.com (2.css `--podium-cds-typography-*`)
- https://www.shopify.com (`--font-size-dsp`, `.text-dsp`), https://mantine.dev (4.css `HomePageTitle-module__title`), https://ant.design (4.css)
