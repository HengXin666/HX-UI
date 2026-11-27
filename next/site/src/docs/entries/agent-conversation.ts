import type { DocEntry } from "../types";

export const agentConversation: DocEntry = {
  slug: "conversation",
  name: "Conversation",
  title: "会话",
  section: "agent",
  group: "会话",
  description:
    "整段 Agent 运行：事件流 -> useAgentStream (requestAnimationFrame 合批, 一帧最多提交一次; 只换掉改动的消息和 part, 其余引用不变) -> MessageList。连续的思考和工具调用折成「已处理 8 秒 · 修改了 2 个文件, 运行了 3 条命令」，运行中保持展开并计时；提问和审批钉在外面。显示模式：分组 / 逐条 / 隐藏成功的 / 只看结论。滚动贴底跟随，往上翻就停住并出现「回到最新」；输入框支持附件、/ 命令、@ 提及、输入法组字、生成中变停止。",
  file: "src/agent/agent-parts.tsx",
  importFrom: "@hx/ui/agent",
  demo: () => import("./agent-conversation.demo"),
  source: () => import("@/agent/agent-parts.tsx?raw").then((m) => m.default),
  bleed: true,
  stageHeight: 760,
  remountOnChange: false,
  defaults: { speed: 1, mode: "grouped", codeTheme: "dark" },
  componentDefaults: { mode: "grouped", codeTheme: "dark" },
  demoOnly: ["speed"],
  presets: [
    { label: "分组", values: { speed: 1, mode: "grouped", codeTheme: "dark" } },
    { label: "逐条", values: { speed: 1, mode: "flat", codeTheme: "dark" } },
    { label: "只看结论", values: { speed: 2, mode: "zen", codeTheme: "dark" } },
  ],
  controls: [
    { type: "number", key: "speed", label: "倍速", min: 0.25, max: 4, step: 0.25, unit: "x" },
    { type: "select", key: "mode", label: "显示模式", options: [{ value: "grouped", label: "分组" }, { value: "flat", label: "逐条" }, { value: "hide-success", label: "隐藏成功的" }, { value: "zen", label: "只看结论" }] },
    { type: "select", key: "codeTheme", label: "代码配色", options: [{ value: "dark", label: "One Dark Pro" }, { value: "auto", label: "跟随亮暗" }] },
  ],
  usage: (v) => `import { AgentProvider, Conversation, MessageList, PromptInput, useAgentStream } from "@hx/ui/agent";
import { mermaidFences } from "@hx/ui/agent/mermaid";

export function Chat() {
  const { messages, push, busy } = useAgentStream();
  // 把后端事件 (SSE / WebSocket) 转成 AgentEvent 推进来:
  // push({ type: "text-delta", messageId, partId, delta })
  // push({ type: "tool-start", messageId, callId, name }) / "tool-args-delta" / "tool-output-delta" / "tool-result"
  // AI SDK 用户: fromAiSdkMessages(useChat().messages, { streaming })

  return (
    <AgentProvider mode="${v.mode}" markdown={{ fences: mermaidFences${v.codeTheme === "auto" ? ', codeTheme: "auto"' : ""} }} actions={{ onApprove, onDeny, onAnswer, onOpenFile }}>
      <Conversation className="h-dvh" footer={<PromptInput busy={busy} onSubmit={send} onStop={stop} />}>
        <MessageList messages={messages} onRetry={retry} />
      </Conversation>
    </AgentProvider>
  );
}
`,
  props: [
    { name: "useAgentStream()", type: "{ messages, push, flush, reset, busy }", description: "事件 -> 消息快照，按帧合批。事件见 AgentEvent：message-start / text-delta / reasoning-delta / tool-start / tool-args-delta / tool-status / tool-output-delta / tool-result / tool-child / notice / usage / message-end。" },
    { name: "AgentProvider.mode", type: '"grouped" | "flat" | "hide-success" | "zen"', default: '"grouped"', description: "过程的显示方式；审批、提问、错误在任何模式下都可见。" },
    { name: "AgentProvider.markdown", type: "MarkdownProps", description: "正文与思考里 Markdown 的默认设置（围栏渲染器、公式、代码配色）。" },
    { name: "MessageList", type: "{ messages, mode?, onRetry?, onEdit?, empty? }", description: "整段渲染，老消息用 content-visibility 跳过布局。" },
    { name: "Conversation", type: "{ footer?, contentClassName? }", description: "贴底跟随的滚动容器；footer 放输入框，「回到最新」自动避开它。" },
    { name: "PromptInput", type: "{ onSubmit, busy, onStop, commands, mentions, toolbar, status, attachments }", description: "Enter 发送、Shift+Enter 换行、输入法组字不误发；附件可选择、拖拽、粘贴；/ 命令与 @ 提及菜单。" },
    { name: "fromAiSdkMessages", type: "(UIMessage[], { streaming }) => AgentMessage[]", description: "Vercel AI SDK v5 / v6 的 UIMessage 适配。" },
  ],
};
