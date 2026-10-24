# Agent Note: 流式 Markdown 用 markstream, 轨迹带进场动画

Status: implemented

Decision-ID: streaming-markdown-markstream

## Code

- `src/agent/streaming-markdown.tsx`
- `src/agent/streaming-markdown-parts.tsx`
- `src/chat/trace.tsx`
- `docs/src/pages/agent/StreamingTextPage.tsx`
- `docs/src/pages/parity/trace.tsx`

## Problem

AI 回复是逐 token 到达的, 内容里混着未闭合的代码块, 表格与列表。此前 StreamingText 只把字符串原样追加, 于是流式中途读者看到的是一堆 Markdown 标记; 轨迹组件 Trace 也只有静态状态图标, 看不出"正在跑", 与常见的 AI 轨迹面板体验不一致。

## Decision

- 新增 StreamingMarkdown, 内部用 markstream-react (markstream-vue 同仓的 React 渲染器): 它按增量 AST 渲染, 半截的围栏代码块与未闭合表格在流式中途也能正确显示。CSS 由使用方显式 import markstream-react/index.css, 组件不自动注入。
- 配色不出另一套: 组件用 SKIN 一组父级任意变体把 markstream 的链接, 表格边框, 引用线, 行内代码拉回本库的语义 token; 明暗跟随根元素的 data-mode, 也允许调用方显式传 isDark。
- 代码块不走 markstream 默认的 stream-diffs 容器 (可选 peer 缺失时只画标题栏, 正文空白), 而是按围栏把内容切段后交给本库 CodeBlock 渲染, 未成段的部分仍由 MarkdownRender 解析。切段, 语言名提取, 高亮节流与末尾光标这类纯逻辑放在同目录的 streaming-markdown-parts.tsx, 主文件只留皮肤与组件本体 (单文件 250 行上限)。
- 围栏 info string 只取第一个空格或 { 之前的 token: `ts title="a.ts"` 与 `ts{1,3}` 都按 ts 高亮, 整体当语言名会让 CodeBlock 找不到语法。
- 围栏未闭合期间按 300ms 固定间隔放行高亮, 闭合后立刻放行最终代码; 否则每来一个 token 都跑一次完整 shiki。
- 半截语言名 (例如 `\`\`\`t`) 会让这一次高亮失败, 所以 CodeBlock 每次重新高亮前清掉失败态, 否则正确的 `tsx` 到来后仍停在纯文本。
- streaming 的契约是"还在生成时末尾有光标": markstream 的光标只跟随文本节点, 内容为空或以代码块结束时由组件自己在末尾补一个 1px 光标。
- TraceLive 的最后一步在 pending -> running 时也要自动展开: TraceStep 在状态转为进行中或失败时, 只要 defaultOpen 不是显式 false 就展开。
- StreamingText 保留原样 (纯文本逐字追加), 因为它仍是"拼接日志式输出"的正确工具, 两者并存而不是替换。
- Trace 增加三步动画: 步骤按 stagger 逐条进场, 连接竖线按序号生长, 状态切换 (pending -> running -> done/error) 时图标缩放进场; 全部用已有关键帧与 Tailwind 类实现, 尊重 prefers-reduced-motion (motion-reduce 关闭)。

## Alternatives considered

- 什么都不做 / 复用现有 StreamingText: 最强理由是它已经能用, 且没有新增依赖。否决: 流式中途的 Markdown 原样显示正是用户报的问题, 这不是加个光标能解决的。
- 用 react-markdown + 自研节流: 依赖更常见。否决: 它按整串内容重新解析, 每来一个 token 就整篇重排, 长回复会抖; markstream 的增量解析与"未完成语法"处理是要买的东西。
- 自己写一个只识别围栏代码块的简易解析器: 依赖为零。否决: 表格, 列表, 引用都要覆盖时才意识到这就是重写一个 Markdown 解析器。
- 动画改用 motion 库的布局动画: 与仓库已有的 motion 依赖一致。否决: 轨迹是列表项的进场与连线生长, CSS 关键帧足够, 且不会给 Trace 增加运行期依赖。

## Consequences

流式回复在文档站与下游都按 Markdown 渲染, 读者在生成过程中就能看到标题与列表的正确形态。代价是每个使用方必须记得引 markstream-react/index.css, 否则样式会缺; 这一点写在组件头注释与文档页里。
