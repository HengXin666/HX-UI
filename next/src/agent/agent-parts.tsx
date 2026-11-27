"use client";
/**
 * 一条助手消息的正文 + 过程: 正文走流式 Markdown, 连续的思考 / 工具调用折成活动分组 (ActivityGroup).
 *
 *   <AgentProvider toolViews={...} actions={{ onApprove, onAnswer, onOpenFile }}>
 *     <AgentParts parts={message.parts} streaming={message.status === "streaming"} />
 *   </AgentProvider>
 */
import * as React from "react";
import { AlertTriangle, Info, Layers, OctagonX, Paperclip, RefreshCw, Shrink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Markdown } from "./markdown/markdown";
import { activitySpan, segmentParts, type Segment } from "./model/group";
import { summarizeActivity } from "./model/summary";
import type { AgentPart, NoticeKind } from "./model/types";
import { Disclosure } from "./parts/disclosure";
import { useElapsed } from "./parts/elapsed";
import { formatBytes, formatDuration } from "./parts/format";
import { Reasoning } from "./reasoning";
import { AgentUIContext, useAgentUI, type ActivityMode, type AgentActions, type AgentMarkdownDefaults, type AgentUIConfig, type ToolViews } from "./tool/context";
import { ToolCall } from "./tool/tool-call";
import { defaultToolViews, resolveToolView } from "./tool/views";

/* ---------------- Provider ---------------- */

export interface AgentProviderProps {
  /** 追加或覆盖工具视图 (按工具名) */
  toolViews?: ToolViews;
  actions?: AgentActions;
  /** 工作目录: 路径显示时去掉这个前缀 */
  cwd?: string;
  markdown?: AgentMarkdownDefaults;
  mode?: ActivityMode;
  children: React.ReactNode;
}

export function AgentProvider({ toolViews, actions, cwd, markdown, mode = "grouped", children }: AgentProviderProps) {
  const views = React.useMemo(() => ({ ...defaultToolViews, ...toolViews }), [toolViews]);
  const value = React.useMemo<AgentUIConfig>(
    () => ({ toolViews: views, actions: actions ?? {}, cwd, markdown, mode, renderParts: (parts, o) => <AgentParts parts={parts} streaming={o.streaming} nested /> }),
    [views, actions, cwd, markdown, mode],
  );
  return <AgentUIContext.Provider value={value}>{children}</AgentUIContext.Provider>;
}

/* ---------------- 提示行 ---------------- */

const NOTICE_ICON: Record<NoticeKind, React.ReactNode> = {
  info: <Info />,
  retry: <RefreshCw />,
  compaction: <Shrink />,
  error: <AlertTriangle />,
  stopped: <OctagonX />,
};

export function Notice({ kind, text, detail }: { kind: NoticeKind; text: string; detail?: string }) {
  if (kind === "error") {
    return (
      <div data-slot="notice" data-kind={kind} role="alert" className="my-2 flex gap-2.5 rounded-lg border border-destructive/30 bg-destructive/6 px-3 py-2.5 text-[13px]">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
        <div className="min-w-0">
          <div className="font-medium text-destructive">{text}</div>
          {detail && <div className="mt-0.5 whitespace-pre-wrap break-words font-mono text-xs text-muted-foreground">{detail}</div>}
        </div>
      </div>
    );
  }
  return <Disclosure data-slot="notice" icon={NOTICE_ICON[kind]} title={text} summary={detail} expandable={false} tone={kind === "stopped" ? "warning" : "default"} />;
}

/* ---------------- 活动分组 ---------------- */

export interface ActivityGroupProps {
  parts: AgentPart[];
  /** 还在生成: 分组保持展开 */
  streaming?: boolean;
  defaultOpen?: boolean;
  className?: string;
}

/** 一段连续的思考 / 工具调用: 运行中展开并计时, 结束收成 "已处理 8 秒 · 运行了 2 条命令, 修改了 3 个文件" */
export const ActivityGroup = React.memo(function ActivityGroup({ parts, streaming = false, defaultOpen, className }: ActivityGroupProps) {
  const { toolViews } = useAgentUI();
  const span = activitySpan(parts);
  const live = span.live || streaming;
  const ms = useElapsed(span.start, span.end, live);
  const [touched, setTouched] = React.useState<boolean | null>(null);
  const open = touched ?? defaultOpen ?? live;
  const tools = parts.flatMap((p) => (p.type === "tool" ? [p.call] : []));
  const kinds = tools.map((c) => resolveToolView(c.name, toolViews).kind ?? "other");
  const failed = tools.filter((c) => c.status === "error").length;
  const thoughts = parts.filter((p) => p.type === "reasoning").length;
  const title = live ? "处理中" : span.start != null && span.end != null ? `已处理 ${formatDuration(span.end - span.start)}` : tools.length ? "工具调用" : "思考过程";
  return (
    <Disclosure
      data-slot="activity"
      icon={<Layers />}
      title={title}
      summary={summarizeActivity(kinds, { reasoning: thoughts })}
      suffix={
        <>
          {failed > 0 && <span className="text-destructive">{failed} 个失败</span>}
          {live && span.start != null && <span>{formatDuration(ms)}</span>}
        </>
      }
      running={live}
      open={open}
      onOpenChange={setTouched}
      className={className}
    >
      <div className="flex flex-col">{parts.map((p) => <PartView key={p.id} part={p} />)}</div>
    </Disclosure>
  );
});

/* ---------------- 单个 part ---------------- */

const PartView = React.memo(function PartView({ part }: { part: AgentPart }) {
  const { markdown } = useAgentUI();
  switch (part.type) {
    case "text":
      return <Markdown streaming={part.streaming} {...markdown}>{part.text}</Markdown>;
    case "reasoning":
      return <Reasoning text={part.text} streaming={part.streaming} startedAt={part.startedAt} endedAt={part.endedAt} markdown={markdown} />;
    case "tool":
      return <ToolCall call={part.call} />;
    case "notice":
      return <Notice kind={part.kind} text={part.text} detail={part.detail} />;
    case "file":
      return (
        <a href={part.url} target="_blank" rel="noopener noreferrer" className="my-1 inline-flex max-w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-[13px] hover:bg-accent/60">
          <Paperclip className="size-3.5 text-muted-foreground" />
          <span className="truncate">{part.name}</span>
          {part.size != null && <span className="text-xs text-muted-foreground">{formatBytes(part.size)}</span>}
        </a>
      );
  }
});

/* ---------------- 整条消息的 parts ---------------- */

export interface AgentPartsProps {
  parts: AgentPart[];
  /** 消息还在生成 */
  streaming?: boolean;
  /** 覆盖 Provider 的显示模式 */
  mode?: ActivityMode;
  /** 子 Agent 里嵌套时更紧凑 */
  nested?: boolean;
  className?: string;
}

function visibleInMode(p: AgentPart, mode: ActivityMode): boolean {
  if (mode === "zen") return p.type === "text" || p.type === "file" || (p.type === "notice" && p.kind === "error") || (p.type === "tool" && (p.call.status === "error" || p.call.status === "awaiting-approval"));
  if (mode === "hide-success") return !(p.type === "tool" && p.call.status === "success") && p.type !== "reasoning";
  return true;
}

export const AgentParts = React.memo(function AgentParts({ parts, streaming = false, mode: modeProp, nested, className }: AgentPartsProps) {
  const ui = useAgentUI();
  const mode = modeProp ?? ui.mode ?? "grouped";
  const segments = React.useMemo<Segment[]>(() => {
    const shown = mode === "grouped" || mode === "flat" ? parts : parts.filter((p) => visibleInMode(p, mode) || (p.type === "tool" && resolveToolView(p.call.name, ui.toolViews).pinned?.(p.call)));
    if (mode !== "grouped") return shown.map((part) => ({ type: "part", part }));
    return segmentParts(shown, (p) => p.type === "tool" && (p.call.status === "awaiting-approval" || !!resolveToolView(p.call.name, ui.toolViews).pinned?.(p.call)));
  }, [parts, mode, ui.toolViews]);
  const last = segments.length - 1;
  return (
    <div data-slot="agent-parts" className={cn("flex min-w-0 flex-col", nested ? "gap-0.5" : "gap-1", className)}>
      {segments.map((s, i) => {
        if (s.type === "part") return <PartView key={s.part.id} part={s.part} />;
        if (s.parts.length === 1) return <PartView key={s.parts[0].id} part={s.parts[0]} />;
        return <ActivityGroup key={s.id} parts={s.parts} streaming={streaming && i === last} />;
      })}
    </div>
  );
});
