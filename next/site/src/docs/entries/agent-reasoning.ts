import type { DocEntry } from "../types";

export const agentReasoning: DocEntry = {
  slug: "reasoning",
  name: "Reasoning",
  title: "思考过程",
  section: "agent",
  group: "过程",
  description:
    "模型的思考。生成中标题是带微光的「思考中」和实时计时，折叠时显示最新一行；结束后自动收起成「已思考 12 秒」，折叠时显示首行。展开后正文是紧凑排版的流式 Markdown。用户手动开合过就不再自动开合。",
  file: "src/agent/reasoning.tsx",
  importFrom: "@hx/ui/agent",
  demo: () => import("./agent-reasoning.demo"),
  source: () => import("@/agent/reasoning.tsx?raw").then((m) => m.default),
  bleed: true,
  stageHeight: 480,
  remountOnChange: false,
  defaults: { cps: 60, open: false },
  componentDefaults: { open: false },
  demoOnly: ["cps"],
  controls: [
    { type: "number", key: "cps", label: "每秒字数", min: 10, max: 400, step: 10 },
    { type: "toggle", key: "open", label: "生成中展开" },
  ],
  usage: (v) => `import { Reasoning } from "@hx/ui/agent";

<Reasoning
  text={part.text}
  streaming={part.streaming}
  startedAt={part.startedAt}
  endedAt={part.endedAt}${v.open ? "\n  openWhileStreaming" : ""}
/>
`,
  props: [
    { name: "text", type: "string", description: "思考内容（Markdown）。" },
    { name: "streaming", type: "boolean", default: "false", description: "还在思考：标题微光 + 计时，折叠态显示最新一行。" },
    { name: "startedAt / endedAt", type: "number", description: "毫秒时间戳；结束后标题是「已思考 N 秒」。" },
    { name: "openWhileStreaming", type: "boolean", default: "false", description: "生成中自动展开。" },
    { name: "defaultOpen", type: "boolean", default: "false", description: "结束后默认展开。" },
    { name: "title", type: "ReactNode", description: "自定义标题。" },
    { name: "markdown", type: "MarkdownProps", description: "正文 Markdown 的设置（围栏渲染器等）。" },
  ],
};
