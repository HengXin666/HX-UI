"use client";

import { useId, useState, type JSX } from "react";
import { ChevronRightIcon } from "lucide-react";
import { cn } from "../primitives/utils";

export const TOOL_CALL_STATUS = {
  running: "running",
  ok: "ok",
  error: "error",
} as const;

export type ToolCallStatus = (typeof TOOL_CALL_STATUS)[keyof typeof TOOL_CALL_STATUS];

export interface ToolCallCardProps {
  name: string;
  args: unknown;
  result?: unknown;
  status: ToolCallStatus;
  durationMs?: number;
  defaultOpen?: boolean;
}

const STATUS_COLOR: Record<ToolCallStatus, string> = {
  [TOOL_CALL_STATUS.running]: "var(--warning)",
  [TOOL_CALL_STATUS.ok]: "var(--success)",
  [TOOL_CALL_STATUS.error]: "var(--danger)",
};

const STATUS_LABEL: Record<ToolCallStatus, string> = {
  [TOOL_CALL_STATUS.running]: "运行中",
  [TOOL_CALL_STATUS.ok]: "成功",
  [TOOL_CALL_STATUS.error]: "失败",
};

const JSON_INDENT = 2;
const SECOND_MS = 1000;

/** 工具调用卡, 头部展示状态, 工具名, 耗时与折叠箭头, 展开后展示入参 JSON 与出参 */
export function ToolCallCard({
  name,
  args,
  result,
  status,
  durationMs,
  defaultOpen = false,
}: ToolCallCardProps): JSX.Element {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();
  const failed = status === TOOL_CALL_STATUS.error;
  const borderColor = failed ? "var(--danger)" : "var(--border)";
  return (
    <div
      data-slot="tool-call-card"
      data-status={status}
      className="w-full overflow-hidden rounded-lg border bg-card"
      style={{ borderColor }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors duration-(--duration-fast) hover:bg-accent/40"
      >
        <span
          aria-hidden="true"
          className={cn(
            "size-2 shrink-0 rounded-full",
            status === TOOL_CALL_STATUS.running && "animate-pulse motion-reduce:animate-none",
          )}
          style={{ background: STATUS_COLOR[status] }}
        />
        <span title={name} className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-foreground">
          {name}
        </span>
        <span className="sr-only">{STATUS_LABEL[status]}</span>
        {durationMs !== undefined && (
          <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
            {formatDuration(durationMs)}
          </span>
        )}
        <ChevronRightIcon
          aria-hidden="true"
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform duration-(--duration-base) ease-out",
            open && "rotate-90",
          )}
        />
      </button>
      {open && (
        <div
          id={bodyId}
          className="grid gap-3 border-t px-3 py-2.5"
          style={{ borderColor }}
        >
          <section>
            <div className="mb-1 text-[11px] text-muted-foreground">入参</div>
            <pre className="m-0 max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-md border border-border-muted bg-muted/40 p-2 font-mono text-[11.5px] leading-relaxed text-foreground">
              {formatJson(args)}
            </pre>
          </section>
          <section>
            <div className="mb-1 text-[11px] text-muted-foreground">出参</div>
            <pre
              className={cn(
                "m-0 max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-md border p-2 font-mono text-[11.5px] leading-relaxed",
                failed ? "border-danger/40 text-danger-fg" : "border-border-muted text-foreground",
              )}
              style={failed ? { background: "color-mix(in srgb, var(--danger) 8%, transparent)" } : undefined}
            >
              {formatResult(result, status)}
            </pre>
          </section>
        </div>
      )}
    </div>
  );
}

function formatJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, JSON_INDENT) ?? "null";
  } catch {
    return String(value);
  }
}

function formatDuration(ms: number): string {
  if (ms < SECOND_MS) return `${Math.round(ms)} ms`;
  return `${(ms / SECOND_MS).toFixed(2)} s`;
}

function formatResult(value: unknown, status: ToolCallStatus): string {
  if (status === TOOL_CALL_STATUS.error) return errorMessage(value);
  if (value === undefined) {
    return status === TOOL_CALL_STATUS.running ? "等待返回" : "暂无出参";
  }
  return typeof value === "string" ? value : formatJson(value);
}

function errorMessage(value: unknown): string {
  if (value === undefined) return "无错误详情";
  if (value instanceof Error) return value.message;
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "message" in value) {
    const message = (value as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return formatJson(value);
}
