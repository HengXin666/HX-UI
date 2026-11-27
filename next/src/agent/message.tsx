"use client";
/**
 * 消息: 用户气泡, 助手回答 (正文 + 过程 + 状态 + 操作条), 以及按消息数组整段渲染的 MessageList.
 * 操作 (复制, 重试, 编辑) 都是回调, 组件不碰数据.
 */
import * as React from "react";
import { Pencil, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentParts, Notice } from "./agent-parts";
import type { AgentMessage, AgentPart } from "./model/types";
import { textOfParts } from "./model/text";
import { CopyIconButton, IconButton } from "./parts/copy";
import { TurnDuration, UsageSummary, WorkingIndicator } from "./status";
import type { ActivityMode } from "./tool/context";

/* ---------------- 用户 ---------------- */

export interface UserMessageProps {
  message: AgentMessage;
  onEdit?: (message: AgentMessage) => void;
  className?: string;
}

export const UserMessage = React.memo(function UserMessage({ message, onEdit, className }: UserMessageProps) {
  const text = textOfParts(message.parts);
  const files = message.parts.filter((p): p is Extract<AgentPart, { type: "file" }> => p.type === "file");
  return (
    <div data-slot="user-message" className={cn("group/msg flex flex-col items-end gap-1", className)}>
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
      {text && <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-secondary px-4 py-2.5 text-[15px] leading-7 text-secondary-foreground">{text}</div>}
      <div className="flex gap-0.5 text-muted-foreground opacity-0 transition-opacity duration-150 group-hover/msg:opacity-100 focus-within:opacity-100">
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
  className?: string;
}

export const AssistantMessage = React.memo(function AssistantMessage({ message, mode, onRetry, actions, showMeta = true, className }: AssistantMessageProps) {
  const streaming = message.status === "streaming";
  const last = message.parts[message.parts.length - 1];
  // 还没有任何可见输出, 或者最后一段已经结束而模型在想下一步: 显示工作中
  const idle = streaming && (!last || (last.type === "text" && !last.streaming) || (last.type === "tool" && ["success", "error", "denied"].includes(last.call.status)));
  const text = textOfParts(message.parts);
  return (
    <div data-slot="assistant-message" data-status={message.status} className={cn("group/msg flex min-w-0 flex-col gap-1", className)}>
      <AgentParts parts={message.parts} streaming={streaming} mode={mode} />
      {idle && <WorkingIndicator startedAt={message.startedAt} />}
      {message.status === "error" && <Notice kind="error" text="这一轮出错了" detail={message.error} />}
      {message.status === "stopped" && <Notice kind="stopped" text="已停止" />}
      {!streaming && (
        <div className="flex min-h-7 items-center gap-0.5 text-muted-foreground opacity-0 transition-opacity duration-150 group-hover/msg:opacity-100 focus-within:opacity-100 group-last/item:opacity-100">
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
              {message.usage && <UsageSummary usage={message.usage} />}
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

/** 整段渲染. 长会话的老消息用 content-visibility 跳过布局和绘制, 滚到附近才算 */
export function MessageList({ messages, mode, onRetry, onEdit, empty, className }: MessageListProps) {
  if (!messages.length) return <>{empty}</>;
  return (
    <div data-slot="message-list" className={cn("group/list flex flex-col gap-6", className)}>
      {messages.map((m, i) => {
        const far = i < messages.length - 6;
        const style = far ? ({ contentVisibility: "auto", containIntrinsicSize: "auto 240px" } as React.CSSProperties) : undefined;
        return (
          <div key={m.id} style={style} className="group/item min-w-0">
            {m.role === "user" ? <UserMessage message={m} onEdit={onEdit} /> : m.role === "system" ? <Notice kind="info" text={textOfParts(m.parts)} /> : <AssistantMessage message={m} mode={mode} onRetry={onRetry} />}
          </div>
        );
      })}
    </div>
  );
}
