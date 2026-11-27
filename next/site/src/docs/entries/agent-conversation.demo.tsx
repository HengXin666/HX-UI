import * as React from "react";
import "katex/dist/katex.min.css";
import { FileCode2, Sparkles } from "lucide-react";
import { AgentProvider, ContextMeter, Conversation, MessageList, PromptInput, type ActivityMode, type AgentActions, type CodeTheme } from "@/agent";
import { mermaidFences } from "@/agent/fences/mermaid-entry";
import { math, mathFences } from "@/agent/fences/math-entry";
import type { DemoProps } from "../types";
import { agentScript } from "./agent/samples";
import { ReplayBar } from "./agent/replay-bar";
import { useReplay } from "./agent/use-replay";

const FENCES = { ...mermaidFences, ...mathFences };
const COMMANDS = [
  { value: "review", description: "审查当前改动" },
  { value: "test", description: "跑相关测试" },
  { value: "compact", description: "压缩上下文" },
];
const FILES = ["src/utils/debounce.ts", "src/utils/throttle.ts", "src/editor/autosave.ts", "src/search/box.tsx"];

export default function AgentConversationDemo({ values, onEvent }: DemoProps) {
  const [playing, setPlaying] = React.useState(true);
  const replay = useReplay(agentScript, { speed: Number(values.speed), playing });
  const markdown = React.useMemo(() => ({ fences: FENCES, plugins: { math }, codeTheme: values.codeTheme as CodeTheme }), [values.codeTheme]);
  const actions = React.useMemo<AgentActions>(() => ({ onOpenFile: (p, l) => onEvent?.(`打开 ${p}${l ? `:${l}` : ""}`), onApprove: (id) => onEvent?.(`批准 ${id}`) }), [onEvent]);
  const last = replay.messages[replay.messages.length - 1];
  const usage = last?.usage;
  const n = React.useRef(0);
  const send = (text: string) => {
    const id = `demo-${++n.current}`;
    replay.push([
      { type: "user-message", messageId: `${id}-u`, text },
      { type: "message-start", messageId: id },
    ]);
    const reply = "这是文档站的演示, 没有接模型。把 `useAgentStream().push` 接到你的事件流上, 这里就是真实的回答。";
    let i = 0;
    const timer = window.setInterval(() => {
      if (i >= reply.length) {
        window.clearInterval(timer);
        replay.push({ type: "message-end", messageId: id });
        return;
      }
      replay.push({ type: "text-delta", messageId: id, partId: `${id}-t`, delta: reply.slice(i, i + 3) });
      i += 3;
    }, 30);
  };
  return (
    <AgentProvider markdown={markdown} actions={actions} cwd="/repo" mode={values.mode as ActivityMode}>
      <div className="flex h-full w-full flex-col">
        <ReplayBar playing={playing && !replay.done} done={replay.done} onToggle={() => setPlaying((p) => !p)} onRestart={() => (replay.restart(), setPlaying(true))} progress={replay.progress} />
        <Conversation
          className="min-h-0 flex-1"
          footer={
            <div className="mx-auto w-full max-w-3xl px-4 pb-4">
              <PromptInput
                busy={replay.busy}
                onStop={() => {
                  setPlaying(false);
                  if (last) replay.push({ type: "message-end", messageId: last.id, status: "stopped" });
                }}
                onSubmit={(text) => send(text)}
                commands={COMMANDS}
                mentions={(q) => FILES.filter((f) => f.includes(q)).map((f) => ({ value: f, icon: <FileCode2 /> }))}
                toolbar={
                  <span className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground">
                    <Sparkles className="size-3.5" />
                    hx-coder
                  </span>
                }
                status={usage?.contextTokens && usage.contextWindow ? <ContextMeter used={usage.contextTokens} max={usage.contextWindow} /> : null}
              />
            </div>
          }
        >
          <MessageList messages={replay.messages} onRetry={() => (replay.restart(), setPlaying(true))} empty={<div className="py-20 text-center text-sm text-muted-foreground">按「重放」开始</div>} />
        </Conversation>
      </div>
    </AgentProvider>
  );
}
