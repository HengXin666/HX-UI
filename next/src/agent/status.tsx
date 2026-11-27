"use client";
/**
 * 轮次状态与用量: 工作中指示 (计时), 上下文占用环, token / 费用.
 */
import * as React from "react";
import { cn } from "@/lib/utils";
import type { AgentUsage } from "./model/types";
import { useElapsed } from "./parts/elapsed";
import { formatDuration, formatTokens } from "./parts/format";

export interface WorkingIndicatorProps {
  startedAt?: number;
  /** 默认 "工作中" */
  label?: React.ReactNode;
  /** 行尾提示, 例如 "Esc 停止" */
  hint?: React.ReactNode;
  className?: string;
}

/** 三个点依次起伏 + 微光标题 + 计时. 只动 transform / opacity */
export function WorkingIndicator({ startedAt, label = "工作中", hint, className }: WorkingIndicatorProps) {
  const ms = useElapsed(startedAt, undefined, true);
  return (
    <div data-slot="working" role="status" className={cn("flex h-8 items-center gap-2.5 text-[13px] text-muted-foreground", className)}>
      <span aria-hidden className="flex items-center gap-[3px]">
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-1.5 rounded-full bg-brand motion-safe:animate-bounce" style={{ animationDelay: `${i * 140}ms`, animationDuration: "1s" }} />
        ))}
      </span>
      <span className="hx-shimmer-text font-medium">{label}</span>
      {startedAt != null && <span className="tabular">{formatDuration(ms)}</span>}
      {hint && <span className="ml-auto text-xs">{hint}</span>}
    </div>
  );
}

export interface ContextMeterProps {
  used: number;
  max: number;
  size?: number;
  /** 显示百分比文字 */
  showLabel?: boolean;
  className?: string;
}

/** 上下文占用环: 70% 以上变黄, 90% 以上变红 */
export function ContextMeter({ used, max, size = 18, showLabel = true, className }: ContextMeterProps) {
  const ratio = max > 0 ? Math.min(1, used / max) : 0;
  const r = size / 2 - 2;
  const c = 2 * Math.PI * r;
  const color = ratio >= 0.9 ? "var(--destructive)" : ratio >= 0.7 ? "var(--warning)" : "var(--brand)";
  return (
    <span data-slot="context-meter" title={`上下文 ${formatTokens(used)} / ${formatTokens(max)}`} className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground tabular", className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={2} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - ratio)} className="transition-[stroke-dashoffset] duration-500" />
      </svg>
      {showLabel && <span>{Math.round(ratio * 100)}%</span>}
    </span>
  );
}

/** 一轮的用量: 输入 / 输出 / 思考 token, 缓存命中, 费用, 上下文环 */
export function UsageSummary({ usage, className }: { usage: AgentUsage; className?: string }) {
  const parts: string[] = [];
  if (usage.inputTokens != null) parts.push(`输入 ${formatTokens(usage.inputTokens)}`);
  if (usage.cachedInputTokens) parts.push(`缓存 ${formatTokens(usage.cachedInputTokens)}`);
  if (usage.outputTokens != null) parts.push(`输出 ${formatTokens(usage.outputTokens)}`);
  if (usage.reasoningTokens) parts.push(`思考 ${formatTokens(usage.reasoningTokens)}`);
  if (usage.cost != null) parts.push(`$${usage.cost < 0.01 ? usage.cost.toFixed(4) : usage.cost.toFixed(2)}`);
  return (
    <span data-slot="usage" className={cn("inline-flex items-center gap-2 text-xs text-muted-foreground tabular", className)}>
      {usage.contextTokens != null && usage.contextWindow ? <ContextMeter used={usage.contextTokens} max={usage.contextWindow} size={14} showLabel={false} /> : null}
      {parts.join(" · ")}
    </span>
  );
}

/** 轮次耗时 (结束后静态显示) */
export function TurnDuration({ startedAt, endedAt }: { startedAt?: number; endedAt?: number }) {
  const ms = useElapsed(startedAt, endedAt, endedAt == null);
  if (startedAt == null) return null;
  return <span className="text-xs text-muted-foreground tabular">{formatDuration(ms)}</span>;
}
