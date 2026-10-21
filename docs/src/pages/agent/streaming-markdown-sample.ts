/**
 * 流式 Markdown 演示用的原文: 一段同时含标题, 列表, 表格, 代码块与链接的模型输出.
 * 逐字追加时, 未闭合的标题与表格由 markstream 按半成品渲染, 结束后再收尾.
 */
export const STREAMING_MARKDOWN_SAMPLE = [
  "## 变更摘要",
  "",
  "把会话列表改成**流式渲染**, 并补齐轨迹动画:",
  "",
  "- 标题, 列表与表格在流式期间保持排版",
  "- 代码块在围栏闭合前也能高亮",
  "- 链接在流式期间可点",
  "",
  "| 文件 | 改动 |",
  "| --- | --- |",
  "| `src/agent/streaming-markdown.tsx` | 新增流式 Markdown |",
  "| `src/chat/trace.tsx` | 步骤进场与连线生长 |",
  "",
  "```tsx",
  "import { StreamingMarkdown } from \"@hx/ui\";",
  "import \"markstream-react/index.css\";",
  "",
  "<StreamingMarkdown content={content} streaming={streaming} />",
  "```",
  "",
  "详见 [markstream 文档](https://markstream.simonhe.me/frameworks/react).",
].join("\n");
