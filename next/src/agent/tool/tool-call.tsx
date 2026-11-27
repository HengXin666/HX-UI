"use client";
/**
 * 一次工具调用. 按工具名找视图 (见 views/index.ts), 未注册的走通用 IN / OUT 卡片.
 * - preparing: 参数还在流式生成, 摘要随参数增长
 * - running: 标题微光 + 计时; 终端 / 子 Agent 自动展开, 结束自动收起 (用户动过就不再自动)
 * - awaiting-approval: 卡片展开 + 审批条
 * - error / interrupted / denied: 标题变色 + 状态胶囊, 失败原因在展开体里
 */
import * as React from "react";
import { Loader2 } from "lucide-react";
import type { ToolCallData } from "../model/types";
import { Disclosure, StatusPill } from "../parts/disclosure";
import { useElapsed } from "../parts/elapsed";
import { formatDuration } from "../parts/format";
import { useAgentUI, type ToolView } from "./context";
import { ErrorText } from "./views/basic";
import { ApprovalBar } from "./views/interactive";
import { resolveToolView } from "./views";

export interface ToolCallProps {
  call: ToolCallData;
  /** 直接指定视图 (不按名字找) */
  view?: ToolView;
  defaultOpen?: boolean;
  className?: string;
}

const RUNNING = new Set(["preparing", "running"]);

function StatusSuffix({ call }: { call: ToolCallData }) {
  const live = RUNNING.has(call.status);
  const ms = useElapsed(call.startedAt, call.endedAt, live);
  if (call.status === "error") return <StatusPill tone="error">失败</StatusPill>;
  if (call.status === "interrupted") return <StatusPill tone="warning">已中断</StatusPill>;
  if (call.status === "denied") return <StatusPill tone="muted">已拒绝</StatusPill>;
  if (call.status === "awaiting-approval") return <StatusPill tone="warning">等待批准</StatusPill>;
  if (live && call.startedAt != null && ms >= 1000) return <span>{formatDuration(ms)}</span>;
  if (live) return <Loader2 className="size-3.5 animate-spin" />;
  if (call.startedAt != null && call.endedAt != null && call.endedAt - call.startedAt >= 1000) return <span className="opacity-0 transition-opacity group-hover/row:opacity-100">{formatDuration(call.endedAt - call.startedAt)}</span>;
  return null;
}

export const ToolCall = React.memo(function ToolCall({ call, view: viewProp, defaultOpen, className }: ToolCallProps) {
  const { toolViews } = useAgentUI();
  const view = viewProp ?? resolveToolView(call.name, toolViews);
  const [touched, setTouched] = React.useState<boolean | null>(null);
  const auto = defaultOpen ?? (call.status === "awaiting-approval" || (view.defaultOpen?.(call) ?? false));
  const open = touched ?? auto;
  const icon = typeof view.icon === "function" ? view.icon(call) : view.icon;
  const tone = call.status === "error" ? "error" : call.status === "interrupted" ? "warning" : "default";
  const Body = view.Body;
  const extra = view.suffix?.(call);

  if (view.pinned?.(call) && Body) {
    return (
      <div data-slot="tool-call" data-tool={call.name} data-status={call.status} className={className}>
        <Body call={call} />
      </div>
    );
  }

  return (
    <div data-slot="tool-call" data-tool={call.name} data-status={call.status} className={className} data-chat-call-id={call.id}>
      <Disclosure
        icon={icon}
        title={view.title?.(call) ?? call.name}
        summary={view.summary?.(call)}
        suffix={
          <>
            {extra}
            <StatusSuffix call={call} />
          </>
        }
        running={RUNNING.has(call.status)}
        tone={tone}
        open={open}
        onOpenChange={setTouched}
        expandable={!!Body || !!call.error}
      >
        {Body ? <Body call={call} /> : call.error ? <ErrorText text={call.error} /> : null}
      </Disclosure>
      {call.status === "awaiting-approval" && <ApprovalBar call={call} />}
    </div>
  );
});
