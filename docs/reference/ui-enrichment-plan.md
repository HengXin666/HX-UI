# UI 丰富度与动效改造: 评估与并行拆解

基准: 本地 main = origin/main = 远端 main = 8ed4dea (2026-10-31), 工作区 package.json 已是 0.4.0 (有未提交改动, 本计划不碰). 验收清单在 `scripts/constants/enrichment.ts`, 核对命令 `node scripts/check-enrichment.ts`.

## 一. 评估结论

组件数量不少 (index.ts 119 条导出, primitives + layout 102 个文件, 蓝图 / 图表 / agent / chat 都有), 工程门禁也很完整. 做出来的界面 "粗糙, 没动效" 的根因不在组件个数, 而在下面五处.

### 1. 令牌层太薄, 没有 "质感" 的原料

| 维度 | 现状 | 后果 |
|---|---|---|
| 阴影 | `--shadow-xs..xl` 五档几乎相同: 同一个 0.18 透明度, 最大模糊 10px, 没有分层, 亮暗同值 | 浮层, 卡片, 弹窗看不出高度差, 画面发平 |
| 表面 | 只有 background / card / popover / muted / accent, card 与页面同底 | 没有 raised / overlay / sunken 三级, 层级全靠 1px 边框硬撑 |
| 品牌色 | 只有一支 primary 蓝, 无 subtle / glow / 辅色 / 渐变 | 无法做强调区, 光晕, 渐变按钮, 插画底纹 |
| 动效 | 3 档时长 + 2 条曲线 (ease-out / ease-in), 无 in-out, 无 emphasized, 无 spring | 所有动作同一种节奏, 机械感强 |
| 字号 | 有 `--fs-*` 令牌, 但组件里手写 `text-[11px]` 62 处, `text-[12px]` 54 处, `text-[13px]` 41 处, 共 13 种任意字号 | 层级混乱, 信息密度过高, 视觉噪点多 |

### 2. 动效体系是 "补丁式" 的

- CSS 关键帧只有 5 条 (折叠上下, 不定长进度, 波纹, 扫光), 全是 "组件不动就坏" 的必需品, 没有任何表现型动效 (入场, 交错, 悬浮, 光晕, 骨架扫光).
- `motion` 12 已经是 dependencies, 但只有 4 个文件 (questionnaire, SegmentedControl, Stepper, Toast) 在用. 没有共享预设, 没有 `Reveal` / `Stagger` / `AnimatedNumber` / 页面转场.
- 按压反馈只有 `translate-y-px`, `active:scale` 全库 2 处; Tabs 指示器不滑动; 弹层统一 `zoom-in-95` 一种进场.
- `src/primitives/motion.ts` 的 FLIP 与 `MotionPresence` 只做了位移与淡入淡出, 是好地基, 但没有往上长.

### 3. 没有通用布局原语

`src/layout/` 实际是 "版式件" (SettingChrome, ProxyChain, SessionStatusDot 等业务形态), 缺少任何页面都要用的: Stack / HStack / VStack / Spacer, Grid / AutoGrid, Container / Section / Center, Bento 网格, 可记忆尺寸的 SplitView. 结果是每个页面各写一遍 flex + gap, 间距与最大宽度没有统一节奏.

### 4. 缺少 "好看" 型组件

全库检索为零: Timeline, Rating, FileDropzone, TagInput, ColorSwatch, Marquee, SpotlightCard, BorderBeam, 背景底纹 (grid / dots / aurora), GlassPanel, 动态数字. 这些是现代组件库 (shadcn 生态的 magicui / aceternity 一类) 拉开观感差距的主要部件.

### 5. 上游视觉约定本身偏 "工具冷淡风"

Card 注释写明三条硬约定: 零阴影, hover 只换边框, 不位移超过 2px. 这适合 GitHub 式控制台, 但也是 "看起来平" 的直接原因. AGENTS.md 要求视觉类名沿用 open-vetta, 所以本计划不改默认外观, 只加可选变体 (elevated / glass / gradient / lift), 默认渲染逐字节不变.

## 二. 拆解原则

- 新能力全部进新目录 (`src/motion/`, `src/box/`, `src/effects/`, `src/widgets/`), 各带 `index.ts` 桶文件, 互不 import, phase 1 可完全并行.
- 共享入口 (src/index.ts, src/constants/index.ts, styles.css 的 import, build-lib, package.json, nav.ts, App.tsx, navIcons.ts, README) 只归集成分片 Z, 在 phase 2 一次性接线, 避免多人改同一文件.
- 每目录直接文件不超过 6 个 (HC-DIR); tsx 不超过 250 行 (gates line-budget), ts 不超过 300 行 (HC-SIZE).
- 每个分片带一篇自己的 agent note, 在本目录代表文件的声明上方反向引用, 满足 Agent Notes 红线.
- 令牌名是跨分片契约: S1 到 S4 可以在 phase 1 直接写 `var(--ease-spring)` / `shadow-2xl` 等名字, S0 保证提供. 名字以本文第三节 S0 为准.

## 三. 分片 (同一 phase 内路径互不相交)

### Phase 1 (并行 6 路)

**S0 设计令牌** owns: `src/tokens.css`, `src/styles.css`, `src/motion.css`, `docs/src/pages/TokensPage.tsx`, `.agents/notes/implemented/feature/2026-11-01-design-tokens-depth-motion.md`

- 新增 (亮暗两套都要给值): `--surface-raised` `--surface-overlay` `--surface-sunken` `--primary-subtle` `--primary-glow` `--accent-2` `--gradient-brand` `--shadow-2xl` `--shadow-glow` `--shadow-inner` `--ring-glow`
- 重写 `--shadow-xs..xl` 为双层阴影 (近处锐影 + 远处柔影), 亮色透明度更低
- 新增 `--blur-glass` `--duration-instant` `--duration-emphasized` `--ease-in-out` `--ease-emphasized` `--ease-spring` (用 CSS `linear()` 写弹簧)
- styles.css 桥接上述颜色 / 阴影 / 曲线, 加 `--radius-2xl`, 在 `@theme` 里登记至少 8 个 `--animate-*` 工具类
- motion.css 新增关键帧: hx-fade-up, hx-fade-down, hx-scale-in, hx-blur-in, hx-slide-in-left, hx-slide-in-right, hx-float, hx-glow-pulse, hx-skeleton-sweep 等, 总数不少于 14, 每组都有 reduced-motion 兜底
- 判据: tokens.css 不少于 560 行, motion.css 不少于 280 行, `@keyframes hx-` 不少于 14 次, 关键字见清单

**S1 动效引擎** owns: `src/motion/`, `src/constants/motion.ts`, `docs/src/pages/motion/`, 对应 note

- `presets.ts`: `SPRING` (soft / snappy / bouncy), `MOTION_PRESETS` (fadeUp / scaleIn / blurIn / slide), 时长从令牌读
- `Reveal.tsx` 视口内入场; `Stagger.tsx` + `StaggerItem` 子项交错; `AnimatedNumber.tsx` 弹簧数字, `Intl.NumberFormat`, `tabular-nums`; `Transition.tsx` 的 `PageTransition` / `FadeSwap` (AnimatePresence)
- 全部尊重 `useReducedMotion` 或复用 `prefersReducedMotion`
- 判据: 6 个文件存在, 行数下限 40 到 60, 关键字见清单, 文档页不少于 120 行

**S2 布局原语** owns: `src/box/`, `src/constants/box.ts`, `docs/src/pages/box/`, 对应 note

- `Stack.tsx` (Stack / HStack / VStack / Spacer, cva 的 gap / align / justify 变体), `Grid.tsx` (Grid / AutoGrid, minmax 自适应), `Container.tsx` (Container / Section / Center, 统一 max-w 档), `Bento.tsx` (BentoItem 的 col-span / row-span), `SplitView.tsx` (包 resizable, 尺寸持久化)
- 判据: 见清单, 两个文档页 BoxPage 与 BentoPage

**S3 视觉效果件** owns: `src/effects/`, `src/effects.css`, `src/constants/effects.ts`, `docs/src/pages/effects/`, 对应 note

- `SpotlightCard` (指针跟随光斑, 写 `--spot-x/--spot-y`), `BorderBeam` (沿 1px 边框流动的光), `Marquee` (无限滚动, pauseOnHover, reverse, 复制件 aria-hidden), `Backdrop` (grid / dots / aurora 底纹), `GlassPanel` (毛玻璃)
- 颜色全部在 effects.css 里经 `var(--...)` 与 color-mix 取, tsx 内零色值; effects.css 由 Z 在 phase 2 接进 styles.css
- 判据: effects.css 不少于 120 行, 3 条以上关键帧, 有 reduced-motion

**S4 富交互件** owns: `src/widgets/`, `src/constants/widgets.ts`, `docs/src/pages/widgets/`, 对应 note

- `Timeline` (tone 语义色, 可带入场), `Rating` (radiogroup, 方向键, 半星), `FileDropzone` (拖入态, accept / maxSize 校验, 预览列表), `TagInput` (回车 / 逗号建签, Backspace 删签, 粘贴拆分, AnimatePresence 进出), `ColorSwatch` (色块单选)
- 判据: 见清单

**S6 既有组件提质** owns: `src/layout/Card.tsx`, `src/layout/StatCard.tsx`, `src/primitives/button.tsx`, `src/primitives/tabs.tsx`, `src/primitives/styles.ts`, 对应 3 个文档页与 note

- Card 增加 `elevated` / `glass` 变体与 `lift` 悬浮; Button 增加 `gradient` 变体与 `press` 按压缩放 (默认关); Tabs 增加 `animated` 指示器 (motion layoutId); StatCard 增加 trend 与迷你折线; 弹层遮罩可选 backdrop-blur
- 约束: 默认变体的类名逐字节不变, `defaultVariants` 保持 `variant: "default"`; 不 import S0 以外分片的东西
- 需要维护者确认: AGENTS.md 要求视觉沿用 open-vetta, 本分片只加可选项, 是否接受由你拍板

### Phase 2 (单人, phase 1 全部合入后)

**Z 集成** owns: `src/index.ts`, `src/constants/index.ts`, `src/styles.css`, `scripts/build-lib.ts`, `package.json`, `README.md`, `docs/src/nav.ts`, `docs/src/App.tsx`, `docs/src/navIcons.ts`

- index.ts 导出四个新目录; constants/index.ts 汇出四个常量文件; styles.css 加 `@import "./effects.css"`; build-lib 的 CSS_FILES 与 package.json exports 加 effects.css; 版本 0.5.x
- nav.ts 新增页面 id: motion, box, bento, effects, widgets; App.tsx 与 navIcons.ts 对齐 (check-docs-registry 会对账)
- 跑 `npm run quality:all` 处理跨分片才暴露的 PROJECT-CONST-DUP (同一字面量在不同分片各出现 1 到 2 次, 合起来到 3 次)

### Phase 3

**S5 展示画廊** owns: `docs/src/pages/gallery/`, 以及 phase 2 结束后的 nav.ts / App.tsx / navIcons.ts

- GalleryPage: Backdrop + Reveal + Bento + SpotlightCard + AnimatedNumber 拼一张落地页; DashboardShowcase: StatCard (trend) + Stagger + 图表. 它是 "好不好看" 的最终验收面, PR GIF 从这页录

## 四. 验收

收尾时 (八个分片全部合入后) 在维护者本机跑的验收命令与结果:

```sh
node scripts/gates/run.mjs --checkpoint pre-push   # 19 条 ALL PASS
npm run quality:done                               # 新增 Error 归零
```

关键字判据只证明 "做了", 不证明 "好看". 好看与否以 S5 画廊页在亮暗两套主题下的录屏为准.

## 五. 风险

- PROJECT-UI-RGB 禁止 tsx 内的 rgb/oklch 等函数色值, 光晕与渐变必须写在 css 文件里经变量取值, S3 最容易踩
- PROJECT-UI-LINE-1PX: BorderBeam 只能沿 1px 边框做, 不能加粗
- `linear()` 弹簧曲线在旧浏览器不支持, S0 需给 `--ease-spring` 一个 cubic-bezier 回退 (用 @supports)
- motion 在 SSR 下需要 `"use client"`, 新 tsx 首行照现有组件写
