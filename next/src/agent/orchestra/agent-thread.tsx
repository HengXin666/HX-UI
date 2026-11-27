"use client";
/**
 * 子 Agent 的只读会话, 两种放法 (同一套内容: 任务, 收发的消息 / 交接, 它自己的思考与工具调用, 用的是主线程同一套 AgentParts):
 *   AgentThread           侧栏 / 抽屉: 头部是状态, 模型, 计时, 用量与它自己的实时 tok/s. 窄屏 (variant="drawer") 是全屏抽屉, 带返回.
 *   SubagentConversation  整个会话区 (顶栏切换器切过去时, 对标 DSH 的子 Agent Session): 任务像一条来自父 Agent 的消息,
 *                         下面是它的完整轨迹; 输入框换成只读条 (DSH SubagentReadOnlyComposer) + 它自己的用量条, 一键回主 Agent.
 * 数据默认取 AgentProvider 的 agents / messages, 也可以直接传. 速率按 agentId 归属 (含嵌在派发调用里的时间线).
 */
import * as React from "react";
import { ArrowLeft, CornerUpLeft, Lock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentParts } from "../agent-parts";
import { Conversation } from "../conversation";
import { SessionMeter } from "../meter";
import { AGENT_DONE, linksOf, partsOfAgent, type AgentTree } from "../model/agents";
import type { AgentMessage } from "../model/types";
import { agentTokenRates, formatRate, sumUsage } from "../model/usage";
import { IconButton } from "../parts/copy";
import { formatTokens } from "../parts/format";
import { WorkingIndicator } from "../status";
import { KIND_LABEL } from "./constants";
import { useAgentSession, useSessionMessages } from "./session-context";
import { AgentStatusBadge, AgentTimer, useOrchestraNow } from "./shared";

export interface AgentThreadProps {
  agentId: string;
  onClose?: () => void;
  /** 不给就取 AgentProvider 的 */
  agents?: AgentTree;
  messages?: readonly AgentMessage[];
  /** panel: 侧栏 (默认); drawer: 窄屏全屏抽屉, 关闭按钮换成返回 */
  variant?: "panel" | "drawer";
  /** 头部多一个 "在主视图打开" (切到它的完整会话) */
  onExpand?: () => void;
  className?: string;
}

const LINK_LABEL = { message: "消息", result: "结果", handoff: "交接" } as const;

/** 一个 Agent 的数据: 节点, 它的 part, 用量, 此刻的 tok/s (按归属) */
function useAgentData(agentId: string, agentsProp?: AgentTree, messagesProp?: readonly AgentMessage[]) {
  const session = useAgentSession();
  const ctxMessages = useSessionMessages();
  const tree = agentsProp ?? session.agents;
  const messages = messagesProp ?? ctxMessages;
  const now = useOrchestraNow(tree);
  const node = tree.nodes[agentId];
  const parts = React.useMemo(() => partsOfAgent(messages, tree, agentId), [messages, tree, agentId]);
  const own = React.useMemo(() => messages.filter((m) => m.agentId === agentId), [messages, agentId]);
  const used = sumUsage(own);
  const rate = agentTokenRates(messages, tree, now).get(agentId) ?? 0;
  return { tree, messages, now, node, parts, own, used, rate };
}

function AgentMeta({ data }: { data: ReturnType<typeof useAgentData> }) {
  const { node, now, used, rate } = data;
  if (!node) return null;
  const meta = [node.role !== node.name ? node.role : undefined, node.model, KIND_LABEL[node.kind]].filter(Boolean).join(" · ");
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
      {meta && <span className="truncate">{meta}</span>}
      <AgentTimer node={node} now={now} />
      {(used.inputTokens ?? 0) + (used.outputTokens ?? 0) > 0 && (
        <span className="tabular">
          输入 {formatTokens(used.inputTokens ?? 0)} · 输出 {formatTokens(used.outputTokens ?? 0)}
        </span>
      )}
      {rate > 0 && <span data-slot="agent-rate" className="tabular text-foreground">{formatRate(rate)} tok/s</span>}
    </div>
  );
}

/** 任务, 收发的消息 / 交接, 它自己的轨迹 */
function ThreadBody({ data, agentId }: { data: ReturnType<typeof useAgentData>; agentId: string }) {
  const { tree, node, parts } = data;
  if (!node) return null;
  const { sent, received } = linksOf(tree, agentId);
  const links = [...received, ...sent].sort((a, b) => a.at - b.at);
  const name = (id: string) => tree.nodes[id]?.name ?? id;
  const parent = node.parentId ? tree.nodes[node.parentId] : undefined;
  const live = !AGENT_DONE.has(node.status);
  return (
    <>
      {node.task && (
        <div className="mb-3 rounded-md bg-muted px-3 py-2 text-[13px] text-foreground/85">
          <div className="mb-0.5 text-[11px] text-muted-foreground">任务{parent ? ` · 来自 ${parent.name}` : ""}</div>
          {node.task}
        </div>
      )}
      {links.length > 0 && (
        <ul className="mb-3 grid gap-1 text-xs text-muted-foreground">
          {links.map((l) => (
            <li key={l.id} className="flex min-w-0 items-center gap-1.5">
              <span className="shrink-0 rounded border px-1 text-[11px]">{LINK_LABEL[l.kind]}</span>
              <span className="shrink-0 text-foreground">
                {name(l.from)} → {name(l.to)}
              </span>
              {l.text && <span className="truncate">{l.text}</span>}
            </li>
          ))}
        </ul>
      )}
      {parts.length ? <AgentParts parts={parts} streaming={live} ownerAgentId={agentId} /> : <p className="py-6 text-center text-sm text-muted-foreground">还没有输出</p>}
    </>
  );
}

export function AgentThread({ agentId, onClose, agents, messages, variant = "panel", onExpand, className }: AgentThreadProps) {
  const data = useAgentData(agentId, agents, messages);
  const { node } = data;
  if (!node) return null;
  const drawer = variant === "drawer";
  return (
    <aside data-slot="agent-thread" data-variant={variant} data-status={node.status} aria-label={`${node.name} 的会话`} className={cn("flex min-h-0 flex-col bg-background", drawer && "animate-in fade-in-0 slide-in-from-right-4 duration-200", className)}>
      <header className="grid gap-1 border-b px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {drawer && onClose && (
            <IconButton label="返回" className="-ml-2" onClick={onClose}>
              <ArrowLeft />
            </IconButton>
          )}
          <span className="truncate text-sm font-medium">{node.name}</span>
          <AgentStatusBadge node={node} />
          <span className="ml-auto flex items-center">
            {onExpand && (
              <button type="button" onClick={onExpand} className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
                在主视图打开
              </button>
            )}
            {!drawer && onClose && (
              <IconButton label="关闭" onClick={onClose}>
                <X />
              </IconButton>
            )}
          </span>
        </div>
        <AgentMeta data={data} />
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin px-4 py-3">
        <ThreadBody data={data} agentId={agentId} />
      </div>
      <footer className="border-t px-4 py-2 text-[11px] text-muted-foreground">只读 · 子 Agent 的会话{node.summary ? ` · 最新: ${node.summary}` : ""}</footer>
    </aside>
  );
}

export interface SubagentConversationProps {
  agentId: string;
  /** 回到主 Agent */
  onBack?: () => void;
  agents?: AgentTree;
  messages?: readonly AgentMessage[];
  /** 用量条的上下文窗口 (消息里没报时) */
  contextWindow?: number;
  /** 输入区上方额外内容 (例如这个子 Agent 的计划面板) */
  dock?: React.ReactNode;
  className?: string;
}

/**
 * 切到子 Agent 时的整个会话区: 任务像一条来自父 Agent 的消息, 下面是它的完整轨迹 (同一套组件),
 * 输入框换成只读条 + 它自己的用量条. 研究笔记: next/docs/dsh-conversation-research.md
 */
export function SubagentConversation({ agentId, onBack, agents, messages, contextWindow, dock, className }: SubagentConversationProps) {
  const data = useAgentData(agentId, agents, messages);
  const { node, tree } = data;
  if (!node) return null;
  const parent = node.parentId ? tree.nodes[node.parentId] : undefined;
  const live = !AGENT_DONE.has(node.status);
  return (
    <Conversation
      data-slot="subagent-conversation"
      className={cn("min-h-0 flex-1", className)}
      footer={
        <div className="mx-auto w-full max-w-3xl px-4 pb-3">
          {dock}
          <div data-slot="subagent-readonly" className="flex min-w-0 items-center gap-2 rounded-2xl border border-dashed bg-muted/40 px-3 py-2.5 text-[13px] text-muted-foreground">
            <Lock aria-hidden className="size-3.5 shrink-0" />
            <span className="min-w-0 flex-1 truncate">
              这是 <span className="font-medium text-foreground">{node.name}</span> 的会话, 只读{parent ? ` · 由 ${parent.name} 派出` : ""}
            </span>
            {onBack && (
              <button type="button" onClick={onBack} className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md px-2 text-xs text-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring">
                <CornerUpLeft className="size-3.5" />
                回到主 Agent
              </button>
            )}
          </div>
          <SessionMeter messages={data.messages} agents={tree} agentId={agentId} contextWindow={contextWindow} className="mt-1.5" />
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-end gap-1">
          <span className="text-[11px] text-muted-foreground">{parent ? `${parent.name} 派来的任务` : "任务"}</span>
          <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-secondary px-4 py-2.5 text-[15px] leading-7 text-secondary-foreground">{node.task ?? node.name}</div>
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex min-w-0 items-center gap-2">
            <AgentStatusBadge node={node} />
            <AgentMeta data={data} />
          </div>
          <ThreadBody data={{ ...data, node: { ...node, task: undefined } }} agentId={agentId} />
          {live && <WorkingIndicator startedAt={node.startedAt} label={node.summary ?? "工作中"} />}
        </div>
      </div>
    </Conversation>
  );
}
