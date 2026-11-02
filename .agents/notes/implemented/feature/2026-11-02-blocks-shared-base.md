# Agent Note: 区块基座 (src/blocks/_shared), 类型单一来源 + BlockShell 外壳 + 参数注入的 PageComposer

Status: implemented

Decision-ID: blocks-shared-base

## Code

- `src/blocks/_shared/BlockShell.tsx`
- `src/constants/blocks.ts`

## Problem

V1 的 11 个区块任务需要一套稳定的公共契约: 统一的 props 词汇 (tone / pad / width / align / reveal / backdrop / as), 数据驱动的内容类型 (Cta, Media, LinkItem, Money, Person, Logo ...), 统一的区块外壳与标题组, 以及按 JSON 拼整页的组合器. 若各区块各写一套, 同页混搭时留白, 对齐, 语言与格式化都会分叉.

## Decision

- 遵循 docs/architecture/component-contract.md 与 docs/reference/2026-ui-library-blocks-design.md 第 3 节.
- types.ts 是区块层类型的唯一来源, 取值联合由 src/constants/blocks.ts 的 as const 常量推导; 组件 props 类型也经 types.ts 转出.
- BlockShell 输出 data-block-tone / data-block-pad / data-block-width / data-align; 相邻同 tone 合并留白用 `:where([data-block-tone=x]) + &` 的纯 CSS 兄弟选择器收掉 padding-top, 不做 JS 测量. PageComposer 不加包裹层, 保证区块是直接兄弟.
- 留白, 容器宽度, 标题字号走 --section-pad-* / --container-* / --fs-display-* 令牌, 令牌未落地前用 var() 回退到 Tailwind 主题值; 标题尺度待 V0-03 typography 落地后替换 (TODO 标在 constants 与 SectionHeading).
- reveal: motion/orchestration 尚不存在, 先用现有 motion/presets 的 presetVariants 与 staggerChildren 实现 fade / rise / stagger, 减弱动效时为瞬时; TODO 标注后续切到 ORCHESTRATION.
- backdrop: grid / dots / aurora 复用 effects/Backdrop; mesh / grain / beam / image 由 BlocksProvider.backdrops 注入或直接传节点, 区块层不 import 尚不存在的效果件.
- BlocksProvider 提供 locale (prop > 外层 > LocaleProvider > navigator.language), 内置 aria 文案 (zh / en, labels 逐键覆盖), 密度与 Intl 格式化函数.
- 偏离: 任务书要求 forwardRef, 契约 6.1 规定 React 19 下 ref 作普通 prop 且不使用 forwardRef, 本目录全部按契约以 ref prop 实现. 任务书 align 写作 left / center, 按契约 4.6 与设计 3.1 取 start / center. Media.darkSrc 与 srcDark, Money.originalAmount 与 compareAt 同时保留为等价别名, 兼容任务书与设计稿两种写法.

## Alternatives considered

- 什么都不做 / 复用现有 box/Section: 最强理由是 Section 已有 tone, pad, 标题头. 否决: 没有 inverted / brand / image tone, 没有同 tone 合并, 没有 reveal 与 backdrop, 标题尺度不到 display 档, 也没有数据驱动的 Cta.
- JS 测量相邻区块后调整留白: 否决, 任务明确要求纯 CSS, 且会引入布局抖动与 SSR 不一致.
- PageComposer 直接 import registry: 否决, 会与各区块形成循环依赖, registry 改为参数注入.

## Consequences

区块任务只需 import ./_shared 的类型与组件. src/blocks/index.ts 与 src/index.ts 的导出由集成任务接入. 令牌, typography, orchestration, mesh 等效果件落地后, 只需改 src/constants/blocks.ts 的类名映射与两处 TODO, 区块代码不变. navigator.language 作为缺省 locale 时服务端与客户端可能不同, 需要 SSR 的页面应显式传 locale.
