"use client";
/**
 * 消息: 用户气泡, 助手回答 (轮次头 + 正文 + 过程 + 状态 + 操作条), 以及按消息数组整段渲染的 MessageList.
 * 轮次头对标 DSH: 结束的一轮在最上面一行 "已处理 1 分 05 秒 · 12 次调用 · 4 个子 Agent", 点它把整轮过程折起
 * (正文, 编排块, 等你处理的调用仍可见); 最新一轮默认展开, 更早的默认折起. 操作条带这一轮的用量胶囊.
 * 多 Agent: AgentProvider 给了 agents 时, MessageList 只渲染主线程, 子 Agent 自己的消息在编排块和子 Agent 轨迹里看.
 * 操作 (复制, 重试, 编辑) 都是回调, 组件不碰数据.
 */
import * as React from "react";
import { ChevronRight, Pencil, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentParts, Notice } from "./agent-parts";
import { TurnUsage } from "./meter";
import { dispatchedAgents, threadMessages } from "./model/agents";
import type { AgentMessage, AgentPart } from "./model/types";
import { textOfParts } from "./model/text";
import { useAgentSession } from "./orchestra/session-context";
import { CopyIconButton, IconButton } from "./parts/copy";
import { formatDuration } from "./parts/format";
import { TurnDuration, WorkingIndicator } from "./status";
import type { ActivityMode } from "./tool/context";

/* ---------------- 用户 ---------------- */

export interface UserMessageProps {
  message: AgentMessage;
  onEdit?: (message: AgentMessage) => void;
  className?: string;
}

/** 长按多久算 "按住" (ms), 按住后操作条露出多久 */
const HOLD_MS = 450;
const HELD_MS = 5_000;

/** 触屏上长按气泡露出操作条 (没有悬停的设备, DSH Go 的长按菜单); 鼠标右键不拦 */
function useLongPress() {
  const [held, setHeld] = React.useState(false);
  const timer = React.useRef<number | undefined>(undefined);
  const clear = () => window.clearTimeout(timer.current);
  React.useEffect(() => clear, []);
  const show = () => {
    setHeld(true);
    clear();
    timer.current = window.setTimeout(() => setHeld(false), HELD_MS);
  };
  return {
    held,
    bind: {
      onPointerDown: (e: React.PointerEvent) => {
        if (e.pointerType !== "touch") return;
        clear();
        timer.current = window.setTimeout(show, HOLD_MS);
      },
      onPointerUp: () => !held && clear(),
      onPointerCancel: () => !held && clear(),
      onContextMenu: (e: React.MouseEvent) => {
        if (!window.matchMedia("(hover: none)").matches) return;
        e.preventDefault();
        show();
      },
    },
  };
}

export const UserMessage = React.memo(function UserMessage({ message, onEdit, className }: UserMessageProps) {
  const text = textOfParts(message.parts);
  const press = useLongPress();
  const files = message.parts.filter((p): p is Extract<AgentPart, { type: "file" }> => p.type === "file");
  return (
    <div data-slot="user-message" data-held={press.held || undefined} className={cn("group/msg flex flex-col items-end gap-1", className)}>
      {files.length > 0 && (
        <div className="flex flex-wrap justify-end gap-1.5">
          {files.map((f) =>
            f.mediaType?.startsWith("image/") && f.url ? (
              <img key={f.id} src={f.url} alt={f.name} className="size-20 rounded-lg border object-cover" />
            ) : (
              <span key={f.id} className="rounded-md border bg-muted/50 px-2 py-1 text-xs">{f.name}</span>
            ),
          )}
        </div>
      )}
      {text && (
        <div {...press.bind} className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-secondary px-4 py-2.5 text-[15px] leading-7 text-secondary-foreground transition-transform duration-150 group-data-[held]/msg:scale-[0.98]">
          {text}
        </div>
      )}
      <div className="flex gap-0.5 text-muted-foreground opacity-0 transition-opacity duration-150 group-hover/msg:opacity-100 group-data-[held]/msg:opacity-100 focus-within:opacity-100">
        <CopyIconButton text={text} />
        {onEdit && (
          <IconButton label="编辑" onClick={() => onEdit(message)}>
            <Pencil />
          </IconButton>
        )}
      </div>
    </div>
  );
});

/* ---------------- 助手 ---------------- */

export interface AssistantMessageProps {
  message: AgentMessage;
  mode?: ActivityMode;
  onRetry?: (message: AgentMessage) => void;
  /** 操作条右侧额外内容 */
  actions?: React.ReactNode;
  /** 显示用量 / 耗时 (默认 true) */
  showMeta?: boolean;
  /** 结束后整轮过程默认折起 (MessageList 给更早的轮次设上) */
  defaultFolded?: boolean;
  className?: string;
}

/** 结束的一轮: "已处理 1 分 05 秒 · 12 次调用 · 4 个子 Agent", 点击折起 / 展开整轮过程 */
function TurnHeader({ message, calls, agents, folded, onToggle }: { message: AgentMessage; calls: number; agents: number; folded: boolean; onToggle: () => void }) {
  const ms = message.startedAt != null && message.endedAt != null ? Math.max(1000, message.endedAt - message.startedAt) : undefined;
  const label = message.status === "stopped" ? "已停止" : message.status === "error" ? "出错" : ms != null ? `已处理 ${formatDuration(ms)}` : "已处理";
  const extra = [calls ? `${calls} 次调用` : "", agents ? `${agents} 个子 Agent` : ""].filter(Boolean).join(" · ");
  return (
    <button
      type="button"
      data-slot="turn-header"
      aria-expanded={!folded}
      onClick={onToggle}
      className="group/turn -mx-1.5 flex h-7 w-fit max-w-full items-center gap-1.5 rounded-md px-1.5 text-[13px] text-muted-foreground transition-colors duration-150 hover:bg-accent/60 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
    >
      <span className="font-medium tabular">{label}</span>
      {extra && <span className="truncate tabular">· {extra}</span>}
      <ChevronRight aria-hidden className={cn("size-3.5 shrink-0 transition-transform duration-200", !folded && "rotate-90")} />
    </button>
  );
}

export const AssistantMessage = React.memo(function AssistantMessage({ message, mode, onRetry, actions, showMeta = true, defaultFolded = false, className }: AssistantMessageProps) {
  const { agents } = useAgentSession();
  const streaming = message.status === "streaming";
  const last = message.parts[message.parts.length - 1];
  // 生成中且不是正在打字: 底部一行 "工作中 12 秒" (DSH 的 running status); 编排者在等子 Agent 时显示它的状态摘要
  const idle = streaming && !(last?.type === "text" && last.streaming);
  const owner = message.agentId ? agents.nodes[message.agentId] : undefined;
  const text = textOfParts(message.parts);
  const calls = message.parts.filter((p) => p.type === "tool").length;
  const process = calls > 0 || message.parts.some((p) => p.type === "reasoning");
  const spawned = React.useMemo(() => (agents.order.length ? dispatchedAgents(agents, message.id, message.parts.flatMap((p) => (p.type === "tool" ? [p.id] : []))).length : 0), [agents, message.id, message.parts]);
  const [touched, setTouched] = React.useState<boolean | null>(null);
  const foldable = !streaming && process;
  const folded = foldable && (touched ?? defaultFolded);
  return (
    <div data-slot="assistant-message" data-status={message.status} data-folded={folded || undefined} className={cn("group/msg flex min-w-0 flex-col gap-1", className)}>
      {foldable && <TurnHeader message={message} calls={calls} agents={spawned} folded={folded} onToggle={() => setTouched(!folded)} />}
      <AgentParts parts={message.parts} streaming={streaming} mode={mode} messageId={message.id} ownerAgentId={message.agentId} folded={folded} />
      {idle && <WorkingIndicator startedAt={message.startedAt} label={owner?.summary ?? "工作中"} />}
      {message.status === "error" && <Notice kind="error" text="这一轮出错了" detail={message.error} />}
      {message.status === "stopped" && <Notice kind="stopped" text="已停止" />}
      {!streaming && (
        <div className="flex min-h-7 items-center gap-0.5 text-muted-foreground opacity-0 transition-opacity duration-150 group-hover/msg:opacity-100 focus-within:opacity-100 group-last/item:opacity-100 [@media(hover:none)]:opacity-100">
          {text && <CopyIconButton text={text} />}
          {onRetry && (
            <IconButton label="重试" onClick={() => onRetry(message)}>
              <RotateCcw />
            </IconButton>
          )}
          {actions}
          {showMeta && (
            <span className="ml-2 flex items-center gap-3">
              {message.model && <span className="text-xs">{message.model}</span>}
              <TurnDuration startedAt={message.startedAt} endedAt={message.endedAt} />
              {message.usage && <TurnUsage message={message} />}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

/* ---------------- 列表 ---------------- */

export interface MessageListProps {
  messages: AgentMessage[];
  mode?: ActivityMode;
  onRetry?: (message: AgentMessage) => void;
  onEdit?: (message: AgentMessage) => void;
  /** 空会话时显示 */
  empty?: React.ReactNode;
  className?: string;
}

/**
 * 整段渲染. 长会话的老消息用 content-visibility 跳过布局和绘制, 滚到附近才算.
 * AgentProvider 给了 agents 时只渲染主线程 (子 Agent 自己的消息去掉); 最后一轮之前的助手消息默认折起过程.
 */
export function MessageList({ messages: all, mode, onRetry, onEdit, empty, className }: MessageListProps) {
  const { agents } = useAgentSession();
  const messages = React.useMemo(() => threadMessages(all, agents), [all, agents]);
  if (!messages.length) return <>{empty}</>;
  let lastUser = -1;
  messages.forEach((m, i) => m.role === "user" && (lastUser = i));
  return (
    <div data-slot="message-list" className={cn("group/list flex flex-col gap-6", className)}>
      {messages.map((m, i) => {
        const far = i < messages.length - 6;
        const style = far ? ({ contentVisibility: "auto", containIntrinsicSize: "auto 240px" } as React.CSSProperties) : undefined;
        return (
          <div key={m.id} style={style} className="group/item min-w-0">
            {m.role === "user" ? <UserMessage message={m} onEdit={onEdit} /> : m.role === "system" ? <Notice kind="info" text={textOfParts(m.parts)} /> : <AssistantMessage message={m} mode={mode} onRetry={onRetry} defaultFolded={i < lastUser} />}
          </div>
        );
      })}
    </div>
  );
}
