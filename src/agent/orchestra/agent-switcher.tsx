"use client";
/**
 * 顶栏的子 Agent 切换器 (对标 DSH ui-subagent 的 SubagentHeaderLineage: 标题 + 下拉箭头, 点开是整棵子 Agent 树).
 *   触发器: [状态点] 主 Agent › 探索  64 tok/s ⌄  (面包屑: 在子 Agent 时前面是主 Agent, 点它直接回去)
 *   弹层: 树 (role=tree), 第一行是主 Agent, 下面按派生关系缩进列出子 Agent; 每行 状态点 · 名字 · 角色 / 模型 · 自己的实时 tok/s · 时长, 当前的打勾.
 * 交互同 DSH: 指针悬停 150ms 打开, 离开 120ms 关上 (触摸不悬停), 点击固定; 方向键 / Home / End 移动, Enter 打开, Esc 关闭并还焦点.
 * 数据取 AgentProvider 的 agents / messages; 速率按 agentId 归属 (agentTokenRates).
 */
import * as React from "react";
import { Check, ChevronRight, ChevronsUpDown, Gauge } from "lucide-react";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { AGENT_DONE, agentRoots, agentSpan, agentTail, flattenAgentTree, type AgentNode, type AgentTree } from "../model/agents";
import type { AgentMessage } from "../model/types";
import { agentTokenRates, formatRate, MAIN_THREAD, sumUsage } from "../model/usage";
import { formatDuration, formatTokens } from "../parts/format";
import { KIND_LABEL } from "./constants";
import { useAgentSession, useSessionMessages } from "./session-context";
import { StatusDot, TailText, useOrchestraNow } from "./shared";

/** 悬停打开 / 离开关闭的延时 (DSH 同款) */
const HOVER_OPEN_MS = 150;
const HOVER_CLOSE_MS = 120;
const MAIN_LABEL = "主 Agent";

export interface AgentSwitcherProps {
  /** 正在看的 Agent; null 是主 Agent (主线程) */
  value: string | null;
  onValueChange: (id: string | null) => void;
  agents?: AgentTree;
  messages?: readonly AgentMessage[];
  className?: string;
}

interface Row {
  id: string | null;
  node?: AgentNode;
  depth: number;
}

/** 主 Agent 的速率: 根节点 (编排者) 的 + 不带 agentId 的主线程消息 */
const mainRate = (rates: ReadonlyMap<string, number>, roots: readonly AgentNode[]) => roots.reduce((s, r) => s + (rates.get(r.id) ?? 0), rates.get(MAIN_THREAD) ?? 0);

export function AgentSwitcher({ value, onValueChange, agents: agentsProp, messages: messagesProp, className }: AgentSwitcherProps) {
  const session = useAgentSession();
  const ctxMessages = useSessionMessages();
  const tree = agentsProp ?? session.agents;
  const messages = messagesProp ?? ctxMessages;
  const now = useOrchestraNow(tree);
  const rates = React.useMemo(() => agentTokenRates(messages, tree, now), [messages, tree, now]);
  const roots = React.useMemo(() => agentRoots(tree), [tree]);
  const rows = React.useMemo<Row[]>(() => {
    const out: Row[] = [{ id: null, node: roots[0], depth: 0 }];
    const rootIds = new Set(roots.map((r) => r.id));
    for (const f of flattenAgentTree(tree)) if (!rootIds.has(f.node.id)) out.push({ id: f.node.id, node: f.node, depth: f.depth });
    return out;
  }, [tree, roots]);
  const [open, setOpen] = React.useState<"closed" | "hover" | "pinned">("closed");
  const timer = React.useRef<number | undefined>(undefined);
  const trigger = React.useRef<HTMLButtonElement>(null);
  const list = React.useRef<HTMLDivElement>(null);
  const cancel = () => window.clearTimeout(timer.current);
  React.useEffect(() => cancel, []);
  const current = value ? tree.nodes[value] : undefined;
  const subs = rows.length - 1;
  if (!subs) return null;
  const rateOf = (r: Row) => (r.id === null ? mainRate(rates, roots) : (rates.get(r.id) ?? 0));
  const curRow = rows.find((r) => r.id === value) ?? rows[0];
  const curRate = rateOf(curRow);
  const shown = open !== "closed";
  const close = (focus = false) => {
    cancel();
    setOpen("closed");
    if (focus) queueMicrotask(() => trigger.current?.focus());
  };
  const pick = (id: string | null) => {
    onValueChange(id);
    close(true);
  };
  const items = () => Array.from(list.current?.querySelectorAll<HTMLElement>('[role="treeitem"]') ?? []);
  const focusAt = (i: number) => {
    const all = items();
    all[(i + all.length) % all.length]?.focus();
  };
  const onKey = (e: React.KeyboardEvent) => {
    const all = items();
    const at = all.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") focusAt(at + 1);
    else if (e.key === "ArrowUp") focusAt(at < 0 ? -1 : at - 1);
    else if (e.key === "Home") focusAt(0);
    else if (e.key === "End") focusAt(-1);
    else return;
    e.preventDefault();
  };
  const usedOf = (id: string) => {
    const u = sumUsage(messages.filter((m) => m.agentId === id));
    return (u.inputTokens ?? 0) + (u.outputTokens ?? 0);
  };
  return (
    <Popover open={shown} onOpenChange={(o) => (o ? setOpen("pinned") : close())}>
      <span data-slot="agent-switcher" className={cn("flex min-w-0 items-center gap-0.5", className)} onPointerLeave={() => {
        cancel();
        if (open === "hover") timer.current = window.setTimeout(() => setOpen("closed"), HOVER_CLOSE_MS);
      }}>
        {current && (
          <>
            <button type="button" onClick={() => onValueChange(null)} className="hidden h-7 shrink-0 items-center rounded-md px-1.5 text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring sm:inline-flex">
              {MAIN_LABEL}
            </button>
            <ChevronRight aria-hidden className="hidden size-3.5 shrink-0 text-muted-foreground sm:block" />
          </>
        )}
        <PopoverAnchor asChild>
          <button
            ref={trigger}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={shown}
            aria-label={`切换 Agent, 当前 ${current?.name ?? MAIN_LABEL}`}
            onPointerEnter={(e) => {
              if (e.pointerType === "touch") return;
              cancel();
              if (!shown) timer.current = window.setTimeout(() => setOpen("hover"), HOVER_OPEN_MS);
            }}
            onClick={() => {
              cancel();
              setOpen(open === "pinned" ? "closed" : "pinned");
              queueMicrotask(() => focusAt(Math.max(0, rows.indexOf(curRow))));
            }}
            onKeyDown={(e) => {
              if (e.key !== "ArrowDown") return;
              e.preventDefault();
              setOpen("pinned");
              queueMicrotask(() => focusAt(0));
            }}
            className="inline-flex h-8 min-w-0 items-center gap-1.5 rounded-md border bg-card px-2 text-[13px] shadow-xs transition-colors duration-150 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring data-[state=open]:bg-accent"
          >
            {curRow.node ? <StatusDot node={curRow.node} /> : <span aria-hidden className="size-1.5 rounded-full bg-muted-foreground/60" />}
            <span className="min-w-0 truncate font-medium">{current?.name ?? MAIN_LABEL}</span>
            {curRate > 0 && (
              <span data-slot="agent-rate" className="hidden shrink-0 items-center gap-0.5 text-xs text-muted-foreground tabular sm:inline-flex">
                <Gauge aria-hidden className="size-3" />
                {formatRate(curRate)} tok/s
              </span>
            )}
            <span className="shrink-0 rounded bg-muted px-1 text-[11px] text-muted-foreground tabular">{subs}</span>
            <ChevronsUpDown aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
          </button>
        </PopoverAnchor>
      </span>
      <PopoverContent
        align="start"
        sideOffset={6}
        aria-label="Agent 列表"
        className="w-[min(22rem,calc(100vw-1.5rem))] p-1"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onPointerEnter={(e) => e.pointerType !== "touch" && cancel()}
        onPointerLeave={() => {
          if (open === "hover") timer.current = window.setTimeout(() => setOpen("closed"), HOVER_CLOSE_MS);
        }}
        onEscapeKeyDown={() => close(true)}
      >
        <div ref={list} role="tree" aria-label="Agent" onKeyDown={onKey} className="grid max-h-[min(24rem,60vh)] gap-0.5 overflow-y-auto scrollbar-thin">
          {rows.map((r) => {
            const isCur = r.id === value;
            const rate = rateOf(r);
            const n = r.node;
            const span = n ? agentSpan(n, now) : undefined;
            const time = n && n.status !== "queued" && span ? formatDuration(span.end - span.start) : undefined;
            const sub = r.id === null ? (n ? `${n.name} · 主线程` : "主线程") : [n?.role !== n?.name ? n?.role : undefined, n?.model ?? (n ? KIND_LABEL[n.kind] : undefined)].filter(Boolean).join(" · ");
            const tokens = r.id ? usedOf(r.id) : 0;
            return (
              <div
                key={r.id ?? "main"}
                role="treeitem"
                tabIndex={-1}
                aria-level={r.depth + 1}
                aria-selected={isCur}
                aria-current={isCur || undefined}
                onClick={() => pick(r.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    pick(r.id);
                  }
                }}
                className={cn("flex min-w-0 cursor-pointer items-center gap-2 rounded-md py-1.5 pr-2 text-[13px] outline-none transition-colors duration-150 hover:bg-accent focus-visible:bg-accent", isCur && "bg-accent/60")}
                style={{ paddingLeft: 8 + Math.max(0, r.depth - 1) * 14 + (r.depth > 0 ? 6 : 0) }}
              >
                {n ? <StatusDot node={n} /> : <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-muted-foreground/60" />}
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className={cn("truncate", isCur ? "font-medium text-foreground" : "text-foreground/90")}>{r.id === null ? MAIN_LABEL : (n?.name ?? r.id)}</span>
                  {n && r.id !== null && !AGENT_DONE.has(n.status) && n.status !== "queued" ? (
                    <TailText tail={agentTail(messages, tree, n.id, 120)} lines={1} surface={isCur ? "bg-accent" : "bg-popover"} className="text-[11px] text-muted-foreground" />
                  ) : (
                    sub && <span className="truncate text-[11px] text-muted-foreground">{sub}</span>
                  )}
                </span>
                <span className="flex shrink-0 flex-col items-end text-[11px] text-muted-foreground tabular">
                  {rate > 0 ? <span data-slot="agent-rate" className="text-foreground">{formatRate(rate)} tok/s</span> : tokens > 0 ? <span>{formatTokens(tokens)} tokens</span> : null}
                  {time && <span>{time}</span>}
                </span>
                <span className="grid size-4 shrink-0 place-items-center">{isCur && <Check aria-hidden className="size-3.5" />}</span>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
