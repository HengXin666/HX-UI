"use client";
/**
 * 多 Agent 卡片墙: 子 Agent 平铺, 每张卡显示状态, 模型, 计时, 任务描述, 最新一步 / 流式输出的末尾.
 * 等待批准 / 等待回答的置顶并高亮.
 */
import * as React from "react";
import { cn } from "@/lib/utils";
import { AGENT_WAITING, agentRoots, agentTail, linksOf, type AgentNode, type AgentTree } from "../model/agents";
import type { AgentMessage } from "../model/types";
import { agentTokenRates, formatRate, sumUsage } from "../model/usage";
import { stripAnsi } from "../parts/ansi";
import { formatTokens } from "../parts/format";
import { KIND_LABEL, STATUS_META } from "./constants";
import { AgentStatusBadge, AgentTimer, StatusDot, TailText, useOrchestraNow } from "./shared";

export interface AgentCardWallProps {
  agents: AgentTree;
  /** 给了就从消息里取最新输出 (按 agentId / tool-child 归属), 否则用状态摘要 */
  messages?: readonly AgentMessage[];
  /** 每个 Agent 此刻的 tok/s (agentTokenRates); 不给就按 messages 现算 */
  rates?: ReadonlyMap<string, number>;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** 也显示根 (编排者); 默认只显示子 Agent, 没有子 Agent 时显示全部 */
  includeRoots?: boolean;
  className?: string;
}

const rank = (n: AgentNode) => (AGENT_WAITING.has(n.status) ? 0 : n.status === "running" ? 1 : n.status === "queued" ? 2 : 3);

function AgentCard({ node, tree, messages, now, rate, selected, onSelect }: { node: AgentNode; tree: AgentTree; messages?: readonly AgentMessage[]; now: number; rate: number; selected: boolean; onSelect?: (id: string) => void }) {
  const meta = STATUS_META[node.status];
  const waiting = AGENT_WAITING.has(node.status);
  const t = messages ? agentTail(messages, tree, node.id, 200) : undefined;
  const tail = t ? { ...t, text: stripAnsi(t.text), label: t.label && stripAnsi(t.label) } : undefined;
  const parent = node.parentId ? tree.nodes[node.parentId] : undefined;
  const { sent, received } = linksOf(tree, node.id);
  const used = messages ? sumUsage(messages.filter((m) => m.agentId === node.id)) : undefined;
  const tokens = (used?.inputTokens ?? 0) + (used?.outputTokens ?? 0);
  const body = (
    <>
      <span className="flex min-w-0 items-center gap-2">
        <StatusDot node={node} />
        <span className="truncate text-sm font-medium text-foreground">{node.name}</span>
        <AgentStatusBadge node={node} className="ml-auto" />
      </span>
      <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
        <span className="truncate">{[node.role !== node.name ? node.role : undefined, node.model, KIND_LABEL[node.kind]].filter(Boolean).join(" · ")}</span>
        <AgentTimer node={node} now={now} className="ml-auto shrink-0" />
      </span>
      {node.task && <span className="line-clamp-2 text-[13px] text-foreground/85">{node.task}</span>}
      {waiting && node.summary && (
        <span className="rounded-md border border-warning/40 bg-warning/8 px-2 py-1 text-xs text-foreground">
          {meta.label}: {node.summary}
        </span>
      )}
      {tail && !(waiting && tail.kind === "summary") && (
        <span className="rounded-md bg-muted px-2 py-1 font-mono text-[11px] text-muted-foreground">
          <TailText tail={tail} lines={2} surface="bg-muted" />
        </span>
      )}
      <span className="mt-auto flex flex-wrap gap-x-3 text-[11px] text-muted-foreground">
        {parent && <span>来自 {parent.name}</span>}
        {node.children.length > 0 && <span>子 Agent {node.children.length}</span>}
        {received.length > 0 && <span>收到 {received.length}</span>}
        {sent.length > 0 && <span>发出 {sent.length}</span>}
        {(tokens > 0 || rate > 0) && (
          <span className="ml-auto tabular">
            {rate > 0 && <span data-slot="agent-rate" className="text-foreground">{formatRate(rate)} tok/s</span>}
            {rate > 0 && tokens > 0 && " · "}
            {tokens > 0 && `${formatTokens(tokens)} tokens`}
          </span>
        )}
      </span>
    </>
  );
  const cls = cn(
    "flex min-h-32 min-w-0 flex-col gap-2 rounded-xl border bg-card p-3 text-left shadow-xs transition-[border-color,background-color,box-shadow] duration-150",
    waiting && "border-warning/60",
    selected && "border-brand",
  );
  return onSelect ? (
    <button type="button" data-slot="agent-card" data-status={node.status} aria-pressed={selected} aria-label={`${node.name} ${meta.label}`} onClick={() => onSelect(node.id)} className={cn(cls, "hover:bg-accent/50 focus-visible:outline-2 focus-visible:outline-ring")}>
      {body}
    </button>
  ) : (
    <div data-slot="agent-card" data-status={node.status} className={cls}>
      {body}
    </div>
  );
}

export function AgentCardWall({ agents, messages, rates: ratesProp, selectedId, onSelect, includeRoots = false, className }: AgentCardWallProps) {
  const now = useOrchestraNow(agents);
  const rates = ratesProp ?? (messages ? agentTokenRates(messages, agents, now) : undefined);
  const list = React.useMemo(() => {
    const roots = new Set(agentRoots(agents).map((n) => n.id));
    const all = agents.order.map((id) => agents.nodes[id]);
    const kids = includeRoots ? all : all.filter((n) => !roots.has(n.id));
    const shown = kids.length ? kids : all;
    // 稳定排序: 等人的置顶, 其次运行中, 排队, 已结束
    return shown.map((n, i) => ({ n, i })).sort((a, b) => rank(a.n) - rank(b.n) || a.i - b.i).map((x) => x.n);
  }, [agents, includeRoots]);
  if (!list.length) return <p className={cn("p-6 text-sm text-muted-foreground", className)}>还没有派出 Agent。</p>;
  return (
    <div data-slot="agent-card-wall" className={cn("grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-2.5", className)}>
      {list.map((n) => <AgentCard key={n.id} node={n} tree={agents} messages={messages} now={now} rate={rates?.get(n.id) ?? 0} selected={selectedId === n.id} onSelect={onSelect} />)}
    </div>
  );
}
