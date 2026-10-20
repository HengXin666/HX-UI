import { useEffect, useRef, useState, type JSX } from "react";
import {
  Badge, Button, BUTTON_TYPE, Card, MessageScroller, MessageScrollerContent,
  MessageScrollerItem, Textarea,
} from "@hx/ui";
import { H2, P, PropsTable } from "../components/DocKit";
import {
  DEMO_PROMPT, INITIAL_EVENTS, KIND, STATUS, STREAM_TEXT, type EventItem,
} from "./agent/agent-overview-copy";
import { AgentEventView } from "./agent/AgentOverviewTimeline";

const PUSH = "ml-auto";
const STREAM_TICK_MS = 24;
const STREAM_STEP = 2;
const TOOL_DELAY_MS = 500;
const REPLY_DELAY_MS = 1300;

/** 可交互的本地模拟: 发消息, 工具调用, 流式回复, 确认与 diff. */
function AgentDemo(): JSX.Element {
  const [events, setEvents] = useState<EventItem[]>(() => [...INITIAL_EVENTS]);
  const [draft, setDraft] = useState(DEMO_PROMPT);
  const [busy, setBusy] = useState(false);
  const timers = useRef<number[]>([]);
  const stream = useRef<number | null>(null);
  const run = useRef(0);

  function stopStream(): void {
    if (stream.current !== null) {
      window.clearInterval(stream.current);
      stream.current = null;
    }
  }

  function clearTimers(): void {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    stopStream();
  }

  function schedule(fn: () => void, ms: number): void {
    timers.current.push(window.setTimeout(fn, ms));
  }

  function startStream(id: number): void {
    let index = 0;
    stream.current = window.setInterval(() => {
      if (id !== run.current) return;
      index = Math.min(STREAM_TEXT.length, index + STREAM_STEP);
      const done = index >= STREAM_TEXT.length;
      setEvents((prev) => prev.map((item) =>
        item.kind === KIND.assistant && item.streaming
          ? { ...item, text: STREAM_TEXT.slice(0, index), streaming: !done }
          : item,
      ));
      if (done) {
        stopStream();
        setEvents((prev) => [...prev, { id: "confirm-1", kind: KIND.confirm, status: STATUS.pending }]);
      }
    }, STREAM_TICK_MS);
  }

  function send(): void {
    const text = draft.trim();
    if (busy || !text) return;
    clearTimers();
    run.current += 1;
    const id = run.current;
    setBusy(true);
    setDraft("");
    setEvents([{ id: "user-1", kind: KIND.user, text }]);
    schedule(() => {
      if (id !== run.current) return;
      setEvents((prev) => [...prev, { id: "tool-1", kind: KIND.tool, status: STATUS.running }]);
    }, TOOL_DELAY_MS);
    schedule(() => {
      if (id !== run.current) return;
      setEvents((prev) => [
        ...prev.map((item) => (item.kind === KIND.tool ? { ...item, status: STATUS.done } : item)),
        { id: "assistant-1", kind: KIND.assistant, text: "", streaming: true },
      ]);
      startStream(id);
    }, REPLY_DELAY_MS);
  }

  function approve(): void {
    setEvents((prev) => [
      ...prev.map((item) => (item.kind === KIND.confirm ? { ...item, status: STATUS.approved } : item)),
      { id: "diff-1", kind: KIND.diff },
      { id: "assistant-2", kind: KIND.assistant, text: "已写入 src/agent/tool.ts. 超时改为 10000 毫秒, 重试上限改为 3 次." },
    ]);
    setBusy(false);
  }

  function reject(): void {
    setEvents((prev) => [
      ...prev.map((item) => (item.kind === KIND.confirm ? { ...item, status: STATUS.rejected } : item)),
      { id: "rejected-marker", kind: KIND.marker, text: "已拒绝写入, 文件未改动" },
    ]);
    setBusy(false);
  }

  function reset(): void {
    clearTimers();
    run.current += 1;
    setEvents([...INITIAL_EVENTS]);
    setDraft(DEMO_PROMPT);
    setBusy(false);
  }

  useEffect(() => () => clearTimers(), []);

  return (
    <Card variant="solid" className="my-4 overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-3.5 py-2.5">
        <span aria-hidden className="icon-[solar--chat-round-dots-linear] size-4 text-link" />
        <span className="text-[13px] font-semibold">Agent 交互演示</span>
        <Badge variant="secondary">本地模拟</Badge>
        <Button type={BUTTON_TYPE} size="xs" variant="ghost" className={PUSH} onClick={reset} disabled={busy}>
          <span aria-hidden className="icon-[solar--refresh-linear] size-3.5" />
          重置
        </Button>
      </div>
      <MessageScroller className="h-[520px]">
        <MessageScrollerContent>
          {events.map((item) => (
            <MessageScrollerItem key={item.id} messageId={item.id}>
              <AgentEventView item={item} onApprove={approve} onReject={reject} />
            </MessageScrollerItem>
          ))}
        </MessageScrollerContent>
      </MessageScroller>
      <div className="border-t border-border/60 p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing) return;
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }}
            placeholder="描述你希望 agent 完成的改动"
            className="min-h-[44px] resize-none text-[13px]"
            rows={1}
            disabled={busy}
            aria-label="消息输入"
          />
          <Button type={BUTTON_TYPE} variant="primary" onClick={send} disabled={busy || !draft.trim()}>
            发送
          </Button>
        </div>
        <div className="mt-1.5 text-[11px] text-muted-foreground">Enter 发送, Shift + Enter 换行</div>
      </div>
    </Card>
  );
}

/** AI 交互总览: 用一个可运行示例串起消息, 工具调用, 流式回复, 确认与 diff. */
export function AgentOverviewPage(): JSX.Element {
  return (
    <>
      <P>
        这一页把一次完整的 agent 交互串起来: 用户发消息, agent 调用工具, 流式输出, 请求确认, 最后展示变更预览.
        所有数据都在本地模拟, 不会发起网络请求; 过程中用到的是 agent/ 下的真实组件.
      </P>
      <H2>完整流程</H2>
      <P>在输入框里发送消息, 然后按提示允许或拒绝写入. 点重置可以重放.</P>
      <AgentDemo />
      <H2>五个阶段</H2>
      <PropsTable
        rows={[
          { name: "发消息", type: "用户输入", desc: "追加用户气泡, 清空输入框." },
          { name: "工具调用", type: "ToolCallCard", desc: "运行中到成功, 入参与出参可折叠." },
          { name: "流式回复", type: "StreamingText", desc: "逐字追加, 完成后进入确认阶段." },
          { name: "人工确认", type: "InlineApproval", desc: "确认前不写入任何文件." },
          { name: "变更预览", type: "DiffView", desc: "允许后展示差异, 拒绝则保留原文件." },
        ]}
      />
    </>
  );
}
