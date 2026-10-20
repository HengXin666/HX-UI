import { useEffect, useRef, useState, type JSX } from "react";
import {
  Avatar, AvatarFallback, Badge, Bubble, Button, BUTTON_TYPE, Card, CardContent, CardHeader, CardTitle,
  Marker, MarkerContent, Message, MessageAvatar, MessageContent, MessageHeader,
  MessageScroller, MessageScrollerContent, MessageScrollerItem,
  Textarea,
} from "@hx/ui";
import { H2, P, PropsTable } from "../components/DocKit";

const KIND = {
  user: "user",
  assistant: "assistant",
  tool: "tool",
  confirm: "confirm",
  diff: "diff",
  marker: "marker",
} as const;

type EventKind = (typeof KIND)[keyof typeof KIND];

const STATUS = {
  pending: "pending",
  running: "running",
  done: "done",
  approved: "approved",
  rejected: "rejected",
} as const;

type EventStatus = (typeof STATUS)[keyof typeof STATUS];

interface EventItem {
  readonly id: string;
  readonly kind: EventKind;
  readonly text?: string;
  readonly status?: EventStatus;
  readonly streaming?: boolean;
}

const DEMO_PROMPT = "把 tool.ts 的请求超时改成 10 秒, 并补一条重试上限";
const INTRO_TEXT = "这是一个本地模拟的 agent 交互示例. 点击发送后依次展示工具调用, 流式回复, 人工确认与变更预览.";
const STREAM_TEXT = "已定位 src/agent/tool.ts. 超时常量当前是 5000 毫秒, 重试上限是 2 次. 我会把超时改为 10000 毫秒, 并新增 maxRetries = 3. 这次改动会写入文件, 需要你确认.";
const TOOL_ARGS = 'read_file({"path": "src/agent/tool.ts"})';
const INDENT = "ml-10";
const PUSH = "ml-auto";
const MUTED = "text-[12px] text-muted-foreground";
const ROW = "flex items-center gap-2";

const DIFF_LINES = [
  { kind: "meta", text: "--- a/src/agent/tool.ts" },
  { kind: "meta", text: "+++ b/src/agent/tool.ts" },
  { kind: "ctx", text: "@@ -12,6 +12,7 @@" },
  { kind: "del", text: "-export const TOOL_TIMEOUT_MS = 5000;" },
  { kind: "add", text: "+export const TOOL_TIMEOUT_MS = 10000;" },
  { kind: "ctx", text: " const retryLimit = 2;" },
  { kind: "add", text: "+const maxRetries = 3;" },
  { kind: "ctx", text: " // 其余逻辑不变" },
] as const;

const DIFF_CLASS = {
  add: "block bg-success/10 px-3 text-success-fg",
  del: "block bg-danger/10 px-3 text-danger-fg",
  ctx: "block px-3 text-muted-foreground",
  meta: "block px-3 text-link",
} as const;

const INITIAL_EVENTS: readonly EventItem[] = [
  { id: "intro-marker", kind: KIND.marker, text: "本地模拟, 不发起网络请求" },
  { id: "intro", kind: KIND.assistant, text: INTRO_TEXT },
];

/** 工具调用卡: 展示工具名, 参数与读取结果. */
function ToolCallCard({ status }: { readonly status: EventStatus }): JSX.Element {
  const running = status === STATUS.running;
  return (
    <Card variant="muted" className="max-w-[540px]">
      <CardHeader className={`${ROW} py-2`}>
        <span aria-hidden className="icon-[solar--code-square-linear] size-4 text-link" />
        <CardTitle>工具调用</CardTitle>
        <Badge variant={running ? "warning" : "success"} className={PUSH}>
          {running ? "运行中" : "已完成"}
        </Badge>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto rounded-md bg-background/60 p-2 font-mono text-[11.5px] text-foreground/90">
          {TOOL_ARGS}
        </div>
        {!running && (
          <div className={`mt-2 ${MUTED}`}>读取 1 个文件, 命中 2 处: 超时常量与重试上限</div>
        )}
      </CardContent>
    </Card>
  );
}

/** 确认卡: 写入前要求人工选择允许或拒绝. */
function ConfirmCard({
  status,
  onApprove,
  onReject,
}: {
  readonly status: EventStatus;
  readonly onApprove: () => void;
  readonly onReject: () => void;
}): JSX.Element {
  const pending = status === STATUS.pending;
  return (
    <Card variant="default" className="max-w-[540px] border-warning/40">
      <CardHeader className={`${ROW} py-2`}>
        <span aria-hidden className="icon-[solar--shield-warning-linear] size-4 text-warning-fg" />
        <CardTitle>需要确认</CardTitle>
        <Badge
          variant={pending ? "warning" : status === STATUS.approved ? "success" : "destructive"}
          className={PUSH}
        >
          {pending ? "等待确认" : status === STATUS.approved ? "已允许" : "已拒绝"}
        </Badge>
      </CardHeader>
      <CardContent className="pt-0">
        <div className={MUTED}>即将写入 src/agent/tool.ts, 共 1 个文件, 2 行新增与 1 行删除.</div>
        {pending ? (
          <div className={`mt-3 ${ROW}`}>
            <Button type={BUTTON_TYPE} variant="primary" size="sm" onClick={onApprove}>允许并写入</Button>
            <Button type={BUTTON_TYPE} variant="outline" size="sm" onClick={onReject}>拒绝</Button>
          </div>
        ) : (
          <div className={`mt-2 ${MUTED}`}>
            {status === STATUS.approved ? "已允许, 正在应用变更." : "已拒绝, 文件保持不变."}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** 变更卡: 逐行渲染新增, 删除与上下文. */
function DiffCard(): JSX.Element {
  return (
    <Card variant="solid" className="max-w-[560px] overflow-hidden">
      <CardHeader className={`${ROW} py-2`}>
        <span aria-hidden className="icon-[solar--document-add-linear] size-4 text-link" />
        <CardTitle>变更预览</CardTitle>
        <Badge variant="success">+2</Badge>
        <Badge variant="destructive">-1</Badge>
        <span className={`${PUSH} font-mono text-[11px] text-muted-foreground`}>src/agent/tool.ts</span>
      </CardHeader>
      <CardContent className="p-0">
        <pre className="overflow-x-auto py-2 font-mono text-[11.5px] leading-relaxed">
          {DIFF_LINES.map((line, index) => (
            <span key={index} className={DIFF_CLASS[line.kind]}>{line.text}</span>
          ))}
        </pre>
      </CardContent>
    </Card>
  );
}

/** 按事件类型渲染一条会话内容. */
function EventView({
  item,
  onApprove,
  onReject,
}: {
  readonly item: EventItem;
  readonly onApprove: () => void;
  readonly onReject: () => void;
}): JSX.Element {
  switch (item.kind) {
    case KIND.user:
      return (
        <Message align="end">
          <MessageAvatar>
            <Avatar size="sm"><AvatarFallback>你</AvatarFallback></Avatar>
          </MessageAvatar>
          <MessageContent>
            <MessageHeader><strong>你</strong><span>刚刚</span></MessageHeader>
            <Bubble variant="primary" align="end">{item.text}</Bubble>
          </MessageContent>
        </Message>
      );
    case KIND.assistant:
      return (
        <Message>
          <MessageAvatar>
            <Avatar size="sm"><AvatarFallback>A</AvatarFallback></Avatar>
          </MessageAvatar>
          <MessageContent>
            <MessageHeader>
              <strong>Agent</strong>
              {item.streaming && <Badge variant="default">生成中</Badge>}
            </MessageHeader>
            <Bubble variant="ghost" align="start" className="max-w-full">
              {item.text}
              {item.streaming && (
                <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-primary/70 align-middle" />
              )}
            </Bubble>
          </MessageContent>
        </Message>
      );
    case KIND.tool:
      return <div className={INDENT}><ToolCallCard status={item.status ?? STATUS.running} /></div>;
    case KIND.confirm:
      return (
        <div className={INDENT}>
          <ConfirmCard status={item.status ?? STATUS.pending} onApprove={onApprove} onReject={onReject} />
        </div>
      );
    case KIND.diff:
      return <div className={INDENT}><DiffCard /></div>;
    case KIND.marker:
      return <Marker variant="separator"><MarkerContent>{item.text}</MarkerContent></Marker>;
    default:
      return <></>;
  }
}

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
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  }

  function startStream(id: number): void {
    let index = 0;
    stream.current = window.setInterval(() => {
      if (id !== run.current) return;
      index = Math.min(STREAM_TEXT.length, index + 2);
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
    }, 24);
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
    }, 500);
    schedule(() => {
      if (id !== run.current) return;
      setEvents((prev) => [
        ...prev.map((item) => (item.kind === KIND.tool ? { ...item, status: STATUS.done } : item)),
        { id: "assistant-1", kind: KIND.assistant, text: "", streaming: true },
      ]);
      startStream(id);
    }, 1300);
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
              <EventView item={item} onApprove={approve} onReject={reject} />
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
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
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
        所有数据都在本地模拟, 不会发起网络请求.
      </P>
      <H2>完整流程</H2>
      <P>在输入框里发送消息, 然后按提示允许或拒绝写入. 点重置可以重放.</P>
      <AgentDemo />
      <H2>五个阶段</H2>
      <PropsTable
        rows={[
          { name: "发消息", type: "用户输入", desc: "追加用户气泡, 清空输入框." },
          { name: "工具调用", type: "运行中 -> 已完成", desc: "展示工具名, 参数与读取结果." },
          { name: "流式回复", type: "逐字追加", desc: "完成后自动进入确认阶段." },
          { name: "人工确认", type: "允许 / 拒绝", desc: "确认前不写入任何文件." },
          { name: "变更预览", type: "diff", desc: "允许后展示差异, 拒绝则保留原文件." },
        ]}
      />
    </>
  );
}
