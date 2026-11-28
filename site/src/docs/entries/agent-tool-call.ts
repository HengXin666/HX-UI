import type { DocEntry } from "../types";

export const agentToolCall: DocEntry = {
  slug: "tool-call",
  name: "ToolCall",
  title: "工具调用",
  section: "ui",
  group: "Agent",
  sub: "过程",
  description:
    "一次工具调用一行，折叠时就给出最重要的信息：命令描述、文件路径、写入大小、diff 增删数、命中数、非零退出码胶囊。生命周期是 preparing（参数还在流式生成，摘要随参数增长）、running（微光 + 计时，终端输出实时滚动）、success / error / interrupted / denied，以及 awaiting-approval（挂审批条）。按工具名找视图，内置终端、读写改文件、搜索、网页、图片、待办、提问、子 Agent，常见 Agent 的工具名都已收录；没注册的工具走通用 IN / OUT 卡片，MCP 前缀会自动去掉。连续的调用由 ActivityGroup 折成一行摘要。",
  file: "src/agent/tool/tool-call.tsx",
  importFrom: "@hx/ui/agent",
  demo: () => import("./agent-tool-call.demo"),
  source: () => import("@/agent/tool/views/defs.tsx?raw").then((m) => m.default),
  bleed: true,
  stageHeight: 720,
  remountOnChange: false,
  defaults: { group: false },
  componentDefaults: { group: false },
  demoOnly: ["group"],
  presets: [
    { label: "逐条", values: { group: false } },
    { label: "活动分组", values: { group: true } },
  ],
  controls: [{ type: "toggle", key: "group", label: "折成活动分组" }],
  usage: () => `import { AgentProvider, ToolCall, terminalView, type ToolView } from "@hx/ui/agent";
import { Rocket } from "lucide-react";

// 自己的工具: 折叠行画什么, 展开画什么
const deployView: ToolView = {
  kind: "command",
  icon: <Rocket />,
  title: (c) => (c.status === "running" ? "部署中" : "部署"),
  summary: (c) => String(c.args?.env ?? ""),
  Body: ({ call }) => <pre>{String(call.output ?? "")}</pre>,
};

<AgentProvider
  cwd="/repo"
  toolViews={{ deploy: deployView, run_tests: terminalView }}
  actions={{
    onApprove: (callId, scope) => api.approve(callId, scope),
    onDeny: (callId) => api.deny(callId),
    onAnswer: (callId, answers) => api.answer(callId, answers),
    onOpenFile: (path, line) => editor.open(path, line),
  }}
>
  <ToolCall call={call} />
</AgentProvider>
`,
  props: [
    { name: "call", type: "ToolCallData", description: "{ id, name, status, args, argsText, output, result, error, exitCode, startedAt, endedAt, children }。" },
    { name: "view", type: "ToolView", description: "直接指定视图，不按名字找。" },
    { name: "defaultOpen", type: "boolean", description: "默认展开；不给时由视图决定（运行中的终端、子 Agent、等待批准的调用会自动展开，结束自动收起）。" },
    { name: "AgentProvider.toolViews", type: "Record<string, ToolView>", description: "按工具名追加或覆盖视图，查找不区分大小写，会去掉 mcp__server__ 前缀。" },
    { name: "AgentProvider.actions", type: "AgentActions", description: "onApprove / onDeny / onAnswer / onOpenFile / onOpenUrl / onInspect 回调。" },
    { name: "ToolView", type: "{ icon, title, summary, suffix, Body, kind, defaultOpen, pinned }", description: "kind 决定活动摘要里怎么数（运行了 N 条命令）；pinned 的调用不进折叠（提问）。" },
  ],
};
