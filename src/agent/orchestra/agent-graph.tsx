"use client";
/**
 * 多 Agent 关系图 = 派生树: 每个节点是一张完整的 HTML 卡片 (与库里的 Card / Badge 同一套: rounded-lg, 1px 边框, bg-card,
 * 13px 名字 / 12px 次要信息, 状态点 + 状态徽章, 自己的实时 tok/s), 布局是 DOM (flex), 不是一张画出来的图.
 * 子节点从父节点长出来: 宽时父在左、子在右竖排 (父卡片竖直居中于子节点), 窄容器 (< 34rem) 变成竖向缩进树, 不会横向溢出.
 * 树枝是 1px 边框 (agent.css 的 .hx-otree-*), 子 Agent 在跑 / 等人的枝用强调色.
 * 新派出的子节点: 枝从父那一侧伸出 (scaleX), 卡片平移淡入; 消息 / 交接到达时目标卡片闪一下. 减弱动效时都直接到位.
 */
import * as React from "react";
import { Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/motion/use-reduced-motion";
import { AGENT_DONE, AGENT_WAITING, agentRoots, agentSpan, agentTail, childrenOf, type AgentLink, type AgentTail, type AgentNode, type AgentTree } from "../model/agents";
import type { AgentMessage } from "../model/types";
import { agentTokenRates, formatRate, sumUsage } from "../model/usage";
import { stripAnsi } from "../parts/ansi";
import { formatDuration, formatTokens } from "../parts/format";
import "../agent.css";
import { FLASH_MS, KIND_LABEL, LINK_COLOR, STATUS_META } from "./constants";
import { AgentStatusBadge, StatusDot, TailText, useOrchestraNow } from "./shared";

export interface AgentGraphProps {
  agents: AgentTree;
  /** 给了就在卡片上显示最新一步与 token 用量 (按 agentId / tool-child 归属) */
  messages?: readonly AgentMessage[];
  /** 每个 Agent 此刻的 tok/s (agentTokenRates); 不给就按 messages 现算 */
  rates?: ReadonlyMap<string, number>;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
}

const EASE = "cubic-bezier(0.4, 0, 0.2, 1)";

/** 新到的 link: 挂载时已有的不算, 只播之后到达的 */
function useNewLinks(links: readonly AgentLink[]): [AgentLink[], (id: string) => void] {
  const seen = React.useRef<Set<string> | null>(null);
  const [fresh, setFresh] = React.useState<AgentLink[]>([]);
  if (seen.current === null) seen.current = new Set(links.map((l) => l.id));
  React.useEffect(() => {
    const s = seen.current!;
    // 重放 (树被清空) 时重置
    if (links.length < s.size) {
      seen.current = new Set(links.map((l) => l.id));
      setFresh([]);
      return;
    }
    const add = links.filter((l) => !s.has(l.id));
    if (!add.length) return;
    for (const l of add) s.add(l.id);
    setFresh((p) => [...p, ...add]);
  }, [links]);
  const done = React.useCallback((id: string) => setFresh((p) => p.filter((x) => x.id !== id)), []);
  return [fresh, done];
}

/** 新出现的节点 (挂载时已有的不算): 用来播 "从父节点长出来" */
function useGrown(order: readonly string[]): ReadonlySet<string> {
  const seen = React.useRef<Set<string> | null>(null);
  const grown = React.useRef<Set<string>>(new Set());
  if (seen.current === null) seen.current = new Set(order);
  if (order.length < seen.current.size) {
    seen.current = new Set(order);
    grown.current = new Set();
  }
  for (const id of order) {
    if (!seen.current.has(id)) {
      seen.current.add(id);
      grown.current.add(id);
    }
  }
  return grown.current;
}

function Flash({ color, onDone }: { color: string; onDone: () => void }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof el.animate !== "function") return onDone();
    const a = el.animate([{ opacity: 0 }, { opacity: 0.2 }, { opacity: 0 }], { duration: FLASH_MS, easing: EASE });
    a.onfinish = onDone;
    return () => a.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <span ref={ref} aria-hidden className="pointer-events-none absolute inset-0 rounded-lg opacity-0" style={{ background: color }} />;
}

interface NodeCardProps {
  node: AgentNode;
  now: number;
  rate: number;
  tokens: number;
  tail?: AgentTail;
  selected: boolean;
  onSelect?: (id: string) => void;
  flash?: AgentLink;
  onFlashDone: (id: string) => void;
}

/** 一个 Agent 的完整卡片 */
const NodeCard = React.memo(function NodeCard({ node, now, rate, tokens, tail, selected, onSelect, flash, onFlashDone }: NodeCardProps) {
  const meta = STATUS_META[node.status];
  const { start, end } = agentSpan(node, now);
  const time = node.status === "queued" ? "排队" : formatDuration(end - start);
  const sub = [node.model, node.role !== node.name ? node.role : undefined].filter(Boolean).join(" · ") || KIND_LABEL[node.kind];
  const waiting = AGENT_WAITING.has(node.status);
  const live = !AGENT_DONE.has(node.status) && node.status !== "queued";
  // 卡片是 grid (agent.css 的 .hx-otree-card): 宽时四行 (名字 · 时长 / 模型 · 状态 / 尾部两行 / 速率 · token),
  // 窄容器压成两行 (名字 · 状态点 · 时长 / 尾部一行 · tok/s), 手机一屏放得下更多卡片
  const body = (
    <>
      <span data-area="head" className="flex min-w-0 items-center gap-1.5">
        <StatusDot node={node} />
        <span className="min-w-0 truncate text-[13px] leading-5 font-medium text-foreground">{node.name}</span>
        <span className="ml-auto shrink-0 text-[11px] text-muted-foreground tabular">{time}</span>
      </span>
      <span data-area="sub" className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
        <span className="min-w-0 truncate">{sub}</span>
        <AgentStatusBadge node={node} className="ml-auto h-[18px] text-[11px]" />
      </span>
      <span data-area="tail" className="min-w-0">
        <TailText tail={tail} lines={2} className={cn("text-[11px] text-muted-foreground", live && "text-foreground/80")} />
      </span>
      <span data-area="tail1" className="min-w-0">
        <TailText tail={tail} lines={1} className={cn("text-[11px] text-muted-foreground", live && "text-foreground/80")} />
      </span>
      <span data-area="rate" className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground tabular">
        <Gauge aria-hidden className={cn("size-3 shrink-0", rate > 0 && "text-brand")} />
        <span data-slot="agent-rate" className={cn(rate > 0 ? "text-foreground" : "")}>{rate > 0 ? `${formatRate(rate)} tok/s` : live ? "0 tok/s" : "—"}</span>
        {tokens > 0 && <span data-area="tokens" className="ml-auto">{formatTokens(tokens)} tokens</span>}
      </span>
      {flash && <Flash key={flash.id} color={LINK_COLOR[flash.kind]} onDone={() => onFlashDone(flash.id)} />}
    </>
  );
  const cls = cn(
    "hx-otree-card relative rounded-lg border bg-card px-2.5 py-1.5 text-left shadow-xs transition-[border-color,background-color,box-shadow] duration-150",
    waiting && "border-warning/60",
    selected && "border-brand ring-1 ring-brand/30",
  );
  return onSelect ? (
    <button type="button" data-slot="agent-graph-node" data-status={node.status} aria-pressed={selected} aria-label={`${node.name} ${meta.label} ${time}${rate > 0 ? ` ${formatRate(rate)} tok/s` : ""}`} title={node.task ?? node.name} onClick={() => onSelect(node.id)} className={cn(cls, "cursor-pointer hover:bg-accent/50 focus-visible:outline-2 focus-visible:outline-ring")}>
      {body}
    </button>
  ) : (
    <div data-slot="agent-graph-node" data-status={node.status} title={node.task ?? node.name} className={cls}>
      {body}
    </div>
  );
});

/** 卡片里的一行: 去掉 ANSI 与 Markdown 记号 */
const plain = (s: string) => stripAnsi(s).replace(/(\*\*|__|`+|^#+\s*|^>\s*)/gm, "").replace(/\s*\|[\s|:-]*/g, " · ").replace(/^ · | · $/g, "");

const activeNode = (n: AgentNode | undefined) => !!n && !AGENT_DONE.has(n.status) && n.status !== "queued";

export function AgentGraph({ agents, messages, rates: ratesProp, selectedId, onSelect, className }: AgentGraphProps) {
  const now = useOrchestraNow(agents);
  const reduced = useReducedMotion();
  const [links, doneLink] = useNewLinks(agents.links);
  const grown = useGrown(agents.order);
  const rates = React.useMemo(() => ratesProp ?? (messages ? agentTokenRates(messages, agents, now) : new Map<string, number>()), [ratesProp, messages, agents, now]);
  const usage = React.useMemo(() => {
    const out = new Map<string, number>();
    if (!messages) return out;
    for (const id of agents.order) {
      const u = sumUsage(messages.filter((m) => m.agentId === id));
      out.set(id, (u.inputTokens ?? 0) + (u.outputTokens ?? 0));
    }
    return out;
  }, [messages, agents]);
  if (!agents.order.length) return <p className={cn("p-6 text-sm text-muted-foreground", className)}>还没有派出 Agent。</p>;
  const flashOf = (id: string) => (reduced ? undefined : links.find((l) => l.to === id));
  const branch = (node: AgentNode, seen: Set<string>): React.ReactNode => {
    if (seen.has(node.id)) return null;
    seen.add(node.id);
    const kids = childrenOf(agents, node.id).filter((k) => !seen.has(k.id));
    const tail = messages ? agentTail(messages, agents, node.id, 160) : node.summary || node.task ? { kind: "summary" as const, text: node.summary ?? node.task ?? "", live: false, cut: false } : undefined;
    return (
      <li key={node.id} role="treeitem" aria-expanded={kids.length ? true : undefined} aria-label={node.name} className="hx-otree-branch" data-active={activeNode(node) || undefined} data-grow={grown.has(node.id) || undefined}>
        <div className="hx-otree-row">
          <NodeCard
            node={node}
            now={now}
            rate={rates.get(node.id) ?? 0}
            tokens={usage.get(node.id) ?? 0}
            tail={tail ? { ...tail, text: plain(tail.text) } : undefined}
            selected={selectedId === node.id}
            onSelect={onSelect}
            flash={flashOf(node.id)}
            onFlashDone={doneLink}
          />
          {kids.length > 0 && (
            <ul role="group" className="hx-otree-kids" data-active={kids.some(activeNode) || undefined}>
              {kids.map((k) => branch(k, seen))}
            </ul>
          )}
        </div>
      </li>
    );
  };
  const seen = new Set<string>();
  return (
    <div data-slot="agent-graph" className={cn("hx-otree min-w-0 overflow-x-auto scrollbar-thin", className)}>
      <ul role="tree" aria-label="Agent 派生树">
        {agentRoots(agents).map((r) => branch(r, seen))}
      </ul>
    </div>
  );
}
