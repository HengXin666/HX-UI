"use client";
/**
 * 上下文检视器 (对标 DSH 社区插件 dsh-context 的 Context 页: currentComposition + stackedBar + timelineChart + events + fleetView).
 * 一屏同时看到 (宽容器三列, 窄容器依次堆叠, 全部是紧凑表格, 11-12px 字, 22px 行):
 *   概览    一行: 总量 / 窗口 / 占比 / 状态 / 报告值 · 估算 · 缓存 · 压缩线 · 预留; 下面构成条 (压缩线, 输出预留斜纹, 缓存前缀).
 *   构成    每类一行: 项数 · tokens · 占总量 · 占窗口 · 报告 / 估算; 点一行展开这类里最大的几项.
 *   最大项  按 token 排的前 N 项 (类别色, 名字, 对象, 大小, 占比).
 *   各 Agent / 事件  每个 Agent 一行占用条 (点了切过去); 上下文为什么变了 (注入, 大块结果, 越线, 压缩回收).
 *   演变    每次请求一根按类别堆叠的柱 (contextSeries), 压缩线 / 窗口刻度, 压缩处旗标, 缓存前缀刻线; 悬停一根在下方读出这次请求的构成.
 * 所有区块共用 "悬停的类别": 构成条, 表格行, 演变柱一起点亮.
 * 数据: model/context.ts, 默认取 AgentProvider 的 messages / agents. 研究笔记: next/docs/dsh-conversation-research.md
 */
import * as React from "react";
import { AlertTriangle, ChevronRight, FileText, Gauge, Plug, Shrink } from "lucide-react";
import { cn } from "@/lib/utils";
import { flattenAgentTree, type AgentTree } from "./model/agents";
import {
  CONTEXT_CATEGORIES,
  CONTEXT_LABEL,
  contextBreakdown,
  contextEvents,
  contextSeries,
  type ContextBreakdown,
  type ContextCategory,
  type ContextEventKind,
  type ContextItem,
  type ContextSeriesCache,
  type ContextSnapshot,
} from "./model/context";
import type { AgentMessage } from "./model/types";
import { useUnfold, type UnfoldEntry } from "@/motion/use-unfold";
import { StatusDot } from "./orchestra/shared";
import { useAgentSession, useSessionMessages } from "./orchestra/session-context";
import { formatDuration, formatTokens } from "./parts/format";

/** 每类的颜色: 固定开销用中性灰 (系统提示深, 工具定义浅), 对话部分用图表色 */
const CAT_BG: Record<ContextCategory, string> = {
  system: "bg-foreground/55",
  tools: "bg-foreground/25",
  injected: "bg-chart-3",
  history: "bg-chart-4",
  user: "bg-chart-5",
  assistant: "bg-chart-1",
  results: "bg-chart-2",
};

const exact = (n: number) => n.toLocaleString("zh-CN");
const pct = (n: number, of: number) => (of > 0 ? (n / of) * 100 : 0);
const pctText = (n: number, of: number) => {
  const v = pct(n, of);
  return v > 0 && v < 1 ? "<1%" : `${v.toFixed(v < 10 ? 1 : 0)}%`;
};
const signed = (n: number) => `${n > 0 ? "+" : "−"}${formatTokens(Math.abs(n))}`;

/** 输出预留的斜纹 (颜色取 token) */
const HATCH = "repeating-linear-gradient(135deg, var(--border) 0 1px, transparent 1px 5px)";

/** 紧凑表格的行 / 表头 */
const ROW = "grid min-w-0 items-center gap-x-2 px-2.5 h-[22px] text-[11px] tabular";
/** 构成表展开一类时列出的最大项数, 其余并成一行 */
const CATEGORY_TOP = 6;
const TOTAL_KEY = "total";
type CompLine = { kind: "cat"; c: ContextCategory } | { kind: "item"; c: ContextCategory; it: ContextItem } | { kind: "more"; c: ContextCategory; count: number; tokens: number } | { kind: "total" };
const compKey = (l: CompLine) => (l.kind === "total" ? TOTAL_KEY : l.kind === "item" ? `item:${l.c}:${l.it.id}` : `${l.kind}:${l.c}`);
const HEAD = cn(ROW, "h-6 border-b text-[10px] font-medium text-muted-foreground");

export interface ContextBarProps {
  breakdown: ContextBreakdown;
  /** sm: 弹层里的细条 (无标注); md: 检视器概览 (压缩线标签 + 缓存段) */
  size?: "sm" | "md";
  /** 点亮的一类 (其余变淡) */
  highlight?: ContextCategory | null;
  className?: string;
}

/**
 * 构成条: 宽度按窗口 (没有窗口按总量), 每类一段 (只动 transform, 数字变化时平滑伸缩); 压缩线是一根 1px 竖线,
 * 输出预留画在末尾斜纹, md 时下沿一条缓存命中段 (从头开始的前缀).
 */
export function ContextBar({ breakdown: b, size = "md", highlight, className }: ContextBarProps) {
  const scale = b.window ?? b.total;
  if (!scale) return null;
  let left = 0;
  const segs = CONTEXT_CATEGORIES.map((c) => {
    const w = pct(b.byCategory[c], scale);
    const s = { c, left, w };
    left += w;
    return s;
  });
  const md = size === "md";
  return (
    <div data-slot="context-bar" className={cn("relative", md && "pt-3.5 pb-1.5", className)}>
      <div className={cn("relative overflow-hidden rounded-sm bg-muted", md ? "h-2.5" : "h-1.5 rounded-full")}>
        {b.reservedOutput ? <span aria-hidden className="absolute inset-y-0 right-0" style={{ width: `${pct(b.reservedOutput, scale)}%`, backgroundImage: HATCH }} /> : null}
        {segs.map(({ c, left: l, w }) => (
          <span
            key={c}
            aria-hidden
            data-cat={c}
            className={cn("absolute inset-y-0 left-0 w-full origin-left transition-[transform,opacity] duration-500", CAT_BG[c], highlight && highlight !== c && "opacity-25")}
            style={{ transform: `translateX(${l}%) scaleX(${w / 100})` }}
          />
        ))}
      </div>
      {md && b.cached ? <span aria-hidden title={`缓存命中 ${exact(b.cached)}`} className="absolute bottom-0 left-0 h-px bg-brand" style={{ width: `${pct(b.cached, scale)}%` }} /> : null}
      {b.compactAt && b.window ? (
        <span aria-hidden className="pointer-events-none absolute top-0 bottom-0 flex flex-col items-center" style={{ left: `${pct(b.compactAt, scale)}%` }}>
          {md && <span className="-translate-x-1/2 text-[10px] leading-3 whitespace-nowrap text-muted-foreground">压缩线 {formatTokens(b.compactAt)}</span>}
          <span className={cn("w-px flex-1 -translate-x-1/2 bg-foreground/70", !md && "-my-0.5")} />
        </span>
      ) : null}
    </div>
  );
}

const LEVEL: Record<ContextBreakdown["level"], { label: string; cls: string }> = {
  ok: { label: "正常", cls: "text-muted-foreground" },
  near: { label: "接近压缩线", cls: "border-warning/50 text-warning" },
  over: { label: "越过压缩线", cls: "border-destructive/50 text-destructive" },
};

const EVENT_ICON: Record<ContextEventKind, React.ReactNode> = {
  inject: <Plug />,
  result: <FileText />,
  near: <AlertTriangle />,
  over: <AlertTriangle />,
  compaction: <Shrink />,
};
const EVENT_TONE: Record<ContextEventKind, string> = {
  inject: "text-chart-3",
  result: "text-chart-2",
  near: "text-warning",
  over: "text-destructive",
  compaction: "text-chart-4",
};

/** 紧凑面板: 24px 表头 (标题 + 右侧小字), 内容自己排 */
function Panel({ title, right, children, className, bodyClassName }: { title: string; right?: React.ReactNode; children: React.ReactNode; className?: string; bodyClassName?: string }) {
  return (
    <section aria-label={title} className={cn("flex min-w-0 flex-col overflow-hidden rounded-lg border bg-card text-card-foreground", className)}>
      <header className="flex h-7 min-w-0 shrink-0 items-center gap-2 border-b bg-muted/40 px-2.5 text-[11px] font-medium">
        <span className="truncate">{title}</span>
        {right && <span className="ml-auto flex shrink-0 items-center gap-2 font-normal text-muted-foreground tabular">{right}</span>}
      </header>
      <div className={cn("min-h-0", bodyClassName)}>{children}</div>
    </section>
  );
}

const Swatch = ({ c, className }: { c: ContextCategory; className?: string }) => <span aria-hidden className={cn("size-2 shrink-0 rounded-[2px]", CAT_BG[c], className)} />;

/** 一类的来源: 全部报告 / 全部估算 / 混合 */
function sourceOf(items: readonly ContextItem[]): string {
  const est = items.filter((i) => i.estimated).length;
  return est === 0 ? "报告" : est === items.length ? "估算" : "混合";
}

export interface AgentContextViewProps {
  /** 不给取 AgentProvider 的 */
  messages?: readonly AgentMessage[];
  agents?: AgentTree;
  /** 看哪个 Agent (不给是主线程); 不受控时检视器里的 "各 Agent" 可以切换 */
  agentId?: string | null;
  onAgentChange?: (id: string | null) => void;
  /** 消息里没报窗口时用 */
  contextWindow?: number;
  /** 最大项默认列几条 */
  topItems?: number;
  className?: string;
}

/**
 * 上下文检视器. 回放 / 流式时随消息实时变化: 新消息与工具结果撑长构成条, 每次请求多一根柱, 接近压缩线变色, 压缩后收成摘要.
 */
export function AgentContextView({ messages: messagesProp, agents: agentsProp, agentId: agentProp, onAgentChange, contextWindow, topItems = 12, className }: AgentContextViewProps) {
  const session = useAgentSession();
  const sessionMessages = useSessionMessages();
  const messages = messagesProp ?? sessionMessages;
  const agents = agentsProp ?? session.agents;
  const [inner, setInner] = React.useState<string | null>(null);
  const agentId = agentProp !== undefined ? agentProp : inner;
  const pick = (id: string | null) => {
    if (agentProp === undefined) setInner(id);
    onAgentChange?.(id);
  };
  const [hover, setHover] = React.useState<ContextCategory | null>(null);
  const [open, setOpen] = React.useState<ContextCategory | null>(null);
  const [all, setAll] = React.useState(false);
  const opts = React.useMemo(() => ({ agents, agentId: agentId ?? undefined, contextWindow }), [agents, agentId, contextWindow]);
  const b = React.useMemo(() => contextBreakdown(messages, opts), [messages, opts]);
  // 演变: 每个 (Agent, 窗口) 一份缓存, 流式时只算新来的采样
  const caches = React.useRef(new Map<string, ContextSeriesCache>());
  const cacheKey = `${agentId ?? ""}|${contextWindow ?? ""}`;
  let cache = caches.current.get(cacheKey);
  if (!cache) caches.current.set(cacheKey, (cache = new Map()));
  const series = React.useMemo(() => contextSeries(messages, opts, cache), [messages, opts, cache]);
  // 事件: 最新的在上
  const events = React.useMemo(() => contextEvents(messages, opts).reverse(), [messages, opts]);
  const flat = React.useMemo(() => flattenAgentTree(agents), [agents]);
  const fleet = React.useMemo(
    () => (flat.length > 1 ? flat.map(({ node, depth }) => ({ node, depth, b: contextBreakdown(messages, { agents, agentId: node.parentId ? node.id : undefined, contextWindow }) })) : []),
    [flat, messages, agents, contextWindow],
  );
  const scale = b.window ?? b.total;
  const t0 = series[0]?.at ?? events[events.length - 1]?.at ?? 0;
  const items = all ? b.items : b.items.slice(0, topItems);
  const top = b.items[0]?.tokens ?? 1;
  const viewing = agentId ? agents.nodes[agentId] : undefined;
  const cats = CONTEXT_CATEGORIES.filter((c) => b.byCategory[c] > 0);
  const hoverProps = (c: ContextCategory) => ({ onMouseEnter: () => setHover(c), onMouseLeave: () => setHover(null) });
  const dim = (c: ContextCategory) => hover && hover !== c && "opacity-40";
  // 构成表的行 (类别行, 展开的明细, 合计) 排成一列交给 useUnfold, 展开 / 收起时平滑让位
  const compLines = React.useMemo(() => {
    const out: CompLine[] = [];
    for (const c of cats) {
      out.push({ kind: "cat", c });
      if (open !== c) continue;
      const list = b.items.filter((i) => i.category === c);
      for (const it of list.slice(0, CATEGORY_TOP)) out.push({ kind: "item", c, it });
      const rest = list.slice(CATEGORY_TOP);
      if (rest.length) out.push({ kind: "more", c, count: rest.length, tokens: rest.reduce((a, i) => a + i.tokens, 0) });
    }
    out.push({ kind: "total" });
    return out;
    // cats 由 b 派生
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [b, open]);
  const comp = useUnfold(compLines, compKey);
  const byCat = new Map<ContextCategory, UnfoldEntry<CompLine>[]>();
  for (const e of comp.entries) {
    if (e.item.kind === "total") continue;
    const list = byCat.get(e.item.c);
    if (list) list.push(e);
    else byCat.set(e.item.c, [e]);
  }

  if (b.empty) {
    return (
      <div data-slot="context-view" className={cn("grid min-h-0 place-items-center p-8 text-sm text-muted-foreground", className)}>
        <span className="flex items-center gap-2">
          <Gauge className="size-4" />
          还没有上下文数据
        </span>
      </div>
    );
  }

  return (
    <div data-slot="context-view" className={cn("@container min-h-0 overflow-y-auto scrollbar-thin", className)}>
      <div className="grid w-full gap-2 p-2 @3xl:p-3">
        {/* 概览: 一行数字 + 构成条 */}
        <section aria-label="上下文概览" className="min-w-0 rounded-lg border bg-card px-2.5 pt-1.5 pb-1">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5 text-[11px] tabular">
            <span className="flex min-w-0 items-baseline gap-1.5">
              <Gauge aria-hidden className="size-3 self-center text-muted-foreground" />
              <span className="font-medium">{viewing ? viewing.name ?? viewing.id : "主线程"}</span>
            </span>
            <span className="text-[13px] font-semibold">
              {exact(b.total)}
              {b.window ? <span className="font-normal text-muted-foreground"> / {exact(b.window)}</span> : null}
            </span>
            {b.ratio != null && <span className={cn("text-[13px] font-semibold", b.level === "over" ? "text-destructive" : b.level === "near" ? "text-warning" : "text-foreground")}>{(b.ratio * 100).toFixed(1)}%</span>}
            <span data-level={b.level} className={cn("rounded-sm border px-1 leading-4", LEVEL[b.level].cls)}>
              {LEVEL[b.level].label}
            </span>
            {b.compactions > 0 && <span className="rounded-sm border border-chart-4/50 px-1 leading-4 text-chart-4">压缩 {b.compactions} 次</span>}
            <span className="flex min-w-0 flex-wrap gap-x-2.5 text-muted-foreground @3xl:ml-auto">
              <span>报告 {b.reported != null ? exact(b.reported) : "—"}</span>
              {b.estimatedTokens > 0 && <span>估算 ≈{formatTokens(b.estimatedTokens)}</span>}
              {b.cached ? <span className="text-brand">缓存 {pctText(b.cached, b.total)}</span> : null}
              {b.compactAt ? <span>压缩线 {formatTokens(b.compactAt)}</span> : null}
              {b.reservedOutput ? <span>预留 {formatTokens(b.reservedOutput)}</span> : null}
              {b.window ? <span>剩余 {formatTokens(Math.max(0, b.window - b.total))}</span> : null}
            </span>
          </div>
          <ContextBar breakdown={b} highlight={hover} />
        </section>

        <div className="grid min-w-0 items-start gap-2 @3xl:grid-cols-2 @6xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)_minmax(0,0.95fr)]">
          {/* 构成 */}
          <Panel title="构成" right={<span>{b.items.length} 项 · {cats.length} 类</span>}>
            <div role="table" aria-label="构成">
              <div role="row" className={cn(HEAD, "grid-cols-[minmax(0,1fr)_2rem_3.25rem_3rem_3rem] @md:grid-cols-[minmax(0,1fr)_2rem_3.25rem_3rem_3rem_2.25rem]")}>
                <span role="columnheader">类别</span>
                <span role="columnheader" className="text-right">项</span>
                <span role="columnheader" className="text-right">tokens</span>
                <span role="columnheader" className="text-right">占总量</span>
                <span role="columnheader" className="text-right">占窗口</span>
                <span role="columnheader" className="text-right @max-md:hidden">来源</span>
              </div>
              {cats.map((c) => {
                const list = b.items.filter((i) => i.category === c);
                const expanded = open === c;
                const kids = (byCat.get(c) ?? []).filter((e) => e.item.kind !== "cat");
                const head = byCat.get(c)?.find((e) => e.item.kind === "cat");
                return (
                  <div key={c} role="rowgroup">
                    <button
                      ref={head ? comp.ref(head.key) : undefined}
                      type="button"
                      role="row"
                      aria-expanded={expanded}
                      onClick={() => setOpen(expanded ? null : c)}
                      {...hoverProps(c)}
                      className={cn(ROW, "w-full grid-cols-[minmax(0,1fr)_2rem_3.25rem_3rem_3rem] text-left transition-[background-color,opacity] duration-150 hover:bg-accent/60 @md:grid-cols-[minmax(0,1fr)_2rem_3.25rem_3rem_3rem_2.25rem]", dim(c))}
                    >
                      <span role="cell" className="flex min-w-0 items-center gap-1.5">
                        <ChevronRight aria-hidden className={cn("size-3 shrink-0 text-muted-foreground transition-transform duration-150", expanded && "rotate-90")} />
                        <Swatch c={c} />
                        <span className="truncate">{CONTEXT_LABEL[c]}</span>
                      </span>
                      <span role="cell" className="text-right text-muted-foreground">{list.length}</span>
                      <span role="cell" className="text-right">{formatTokens(b.byCategory[c])}</span>
                      <span role="cell" className="relative text-right">
                        <span aria-hidden className={cn("absolute inset-y-[5px] left-0 origin-left rounded-[1px] opacity-30", CAT_BG[c])} style={{ width: `${pct(b.byCategory[c], b.total)}%` }} />
                        <span className="relative">{pctText(b.byCategory[c], b.total)}</span>
                      </span>
                      <span role="cell" className="text-right text-muted-foreground">{scale ? pctText(b.byCategory[c], scale) : "—"}</span>
                      <span role="cell" className={cn("text-right @max-md:hidden", sourceOf(list) === "报告" ? "text-muted-foreground" : "text-muted-foreground/70")}>{sourceOf(list)}</span>
                    </button>
                    {/* 展开的明细行由 useUnfold 驱动: 下方行平滑让位, 明细自上而下淡入; 收起中的行 inert + aria-hidden */}
                    {kids.map(({ key, item, exiting }) =>
                      item.kind === "item" ? (
                        <div key={key} ref={comp.ref(key)} inert={exiting || undefined} aria-hidden={exiting || undefined} role="row" className={cn(ROW, "grid-cols-[minmax(0,1fr)_3.25rem_3rem] bg-muted/30 pl-[2.1rem] text-muted-foreground")}>
                          <span role="cell" className="truncate" title={item.it.detail ? `${item.it.label} · ${item.it.detail}` : item.it.label}>
                            <span className="text-foreground">{item.it.label}</span>
                            {item.it.detail ? ` · ${item.it.detail}` : ""}
                          </span>
                          <span role="cell" className="text-right text-foreground">
                            {item.it.estimated && "≈"}
                            {formatTokens(item.it.tokens)}
                          </span>
                          <span role="cell" className="text-right">{pctText(item.it.tokens, b.total)}</span>
                        </div>
                      ) : item.kind === "more" ? (
                        <div key={key} ref={comp.ref(key)} inert={exiting || undefined} aria-hidden={exiting || undefined} role="row" className={cn(ROW, "bg-muted/30 pl-[2.1rem] text-muted-foreground")}>
                          其余 {item.count} 项 · {formatTokens(item.tokens)}
                        </div>
                      ) : null,
                    )}
                  </div>
                );
              })}
              <div ref={comp.ref(TOTAL_KEY)} role="row" className={cn(ROW, "grid-cols-[minmax(0,1fr)_2rem_3.25rem_3rem_3rem] border-t font-medium @md:grid-cols-[minmax(0,1fr)_2rem_3.25rem_3rem_3rem_2.25rem]")}>
                <span role="cell" className="pl-[1.375rem]">合计</span>
                <span role="cell" className="text-right">{b.items.length}</span>
                <span role="cell" className="text-right">{formatTokens(b.total)}</span>
                <span role="cell" className="text-right">100%</span>
                <span role="cell" className="text-right">{scale ? pctText(b.total, scale) : "—"}</span>
                <span role="cell" className="text-right font-normal text-muted-foreground @max-md:hidden">{b.estimatedTokens ? `≈${pctText(b.estimatedTokens, b.total)}` : "报告"}</span>
              </div>
            </div>
          </Panel>

          {/* 最大项 */}
          <Panel title="最大项" right={<span>前 {Math.min(items.length, b.items.length)} / {b.items.length}</span>}>
            <ol aria-label="最大项">
              {items.map((it, i) => (
                <li key={it.id} {...hoverProps(it.category)} title={it.detail ? `${it.label} · ${it.detail}` : it.label} className={cn(ROW, "grid-cols-[1.1rem_minmax(0,1fr)_3.25rem_2.75rem] transition-opacity duration-150 hover:bg-accent/60", dim(it.category))}>
                  <span className="text-right text-[10px] text-muted-foreground">{i + 1}</span>
                  <span className="flex min-w-0 items-center gap-1.5">
                    <Swatch c={it.category} />
                    <span className="min-w-0 truncate">
                      {it.label}
                      {it.detail && <span className="text-muted-foreground"> · {it.detail}</span>}
                    </span>
                  </span>
                  <span className="relative text-right">
                    <span aria-hidden className={cn("absolute inset-y-[5px] right-0 rounded-[1px] opacity-25", CAT_BG[it.category])} style={{ width: `${Math.min(100, (it.tokens / top) * 100)}%` }} />
                    <span className="relative">
                      {it.estimated && <span className="text-muted-foreground">≈</span>}
                      {formatTokens(it.tokens)}
                    </span>
                  </span>
                  <span className="text-right text-muted-foreground">{pctText(it.tokens, b.total)}</span>
                </li>
              ))}
            </ol>
            {b.items.length > topItems && (
              <button type="button" onClick={() => setAll((v) => !v)} className="h-6 w-full border-t text-[11px] text-muted-foreground transition-colors duration-150 hover:bg-accent/60 hover:text-foreground">
                {all ? "收起" : `展开全部 ${b.items.length} 项`}
              </button>
            )}
          </Panel>

          {/* 各 Agent + 事件 */}
          <div className="grid min-w-0 content-start gap-2 @3xl:col-span-2 @3xl:grid-cols-2 @6xl:col-span-1 @6xl:grid-cols-1">
            {fleet.length > 0 && (
              <Panel title="各 Agent" right={<span>{fleet.length} 个</span>}>
                <ul aria-label="各 Agent">
                  {fleet.map(({ node, depth, b: fb }) => {
                    const id = node.parentId ? node.id : null;
                    const on = (agentId ?? null) === id;
                    return (
                      <li key={node.id}>
                        <button
                          type="button"
                          aria-pressed={on}
                          onClick={() => pick(id)}
                          className={cn(ROW, "w-full grid-cols-[minmax(0,1fr)_minmax(2.5rem,4.5rem)_5.5rem] text-left transition-colors duration-150 hover:bg-accent/60", on && "bg-accent")}
                        >
                          <span className="flex min-w-0 items-center gap-1.5" style={{ paddingLeft: depth * 10 }}>
                            <StatusDot node={node} />
                            <span className="truncate">{node.name ?? node.id}</span>
                            {node.model && <span className="truncate text-[10px] text-muted-foreground @max-sm:hidden">{node.model}</span>}
                          </span>
                          <ContextBar breakdown={fb} size="sm" />
                          <span className="text-right text-muted-foreground">{fb.empty ? "—" : `${formatTokens(fb.total)}${fb.ratio != null ? ` · ${Math.round(fb.ratio * 100)}%` : ""}`}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            )}
            <Panel title="事件" right={<span>{events.length} 条</span>} bodyClassName="max-h-[14.5rem] overflow-y-auto scrollbar-thin">
              {events.length ? (
                <ol aria-label="上下文事件">
                  {events.map((e, i) => (
                    <li key={`${e.kind}-${e.partId ?? e.label}-${i}`} title={e.detail ? `${e.label} · ${e.detail}` : e.label} className={cn(ROW, "grid-cols-[2.6rem_0.85rem_minmax(0,1fr)_auto] animate-in fade-in-0 duration-300")}>
                      <span className="text-[10px] text-muted-foreground">{t0 ? (e.at - t0 < 1000 ? "开始" : `+${formatDuration(e.at - t0)}`) : ""}</span>
                      <span aria-hidden className={cn("grid place-items-center [&_svg]:size-3", EVENT_TONE[e.kind])}>
                        {EVENT_ICON[e.kind]}
                      </span>
                      <span className="min-w-0 truncate">
                        {e.label}
                        {e.detail && <span className="text-muted-foreground"> · {e.detail}</span>}
                      </span>
                      {e.delta != null ? <span className={cn("text-right", e.delta < 0 ? "text-success" : "text-muted-foreground")}>{signed(e.delta)}</span> : <span />}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="px-2.5 py-3 text-[11px] text-muted-foreground">还没有事件</p>
              )}
            </Panel>
          </div>
        </div>

        {/* 演变 */}
        <Panel
          title="每次请求的构成"
          right={
            <span className="flex flex-wrap items-center justify-end gap-x-2 text-[10px]">
              {CONTEXT_CATEGORIES.map((c) => (
                <span key={c} {...hoverProps(c)} className={cn("flex cursor-default items-center gap-1 transition-opacity duration-150", dim(c))}>
                  <Swatch c={c} />
                  <span className="@max-lg:hidden">{CONTEXT_LABEL[c]}</span>
                </span>
              ))}
            </span>
          }
        >
          <Timeline series={series} breakdown={b} highlight={hover} />
        </Panel>
      </div>
    </div>
  );
}

/** 演变图最多画这么多根 (更早的省略) */
const MAX_BARS = 160;
/** 演变图至少按这么多根排宽度 */
const MIN_SLOTS = 48;
/** 纵轴刻度数 */
const TICKS = 4;

/** 每次请求一根按类别堆叠的柱; 纵轴刻度, 压缩线, 窗口; 压缩处旗标; 缓存前缀刻线; 悬停读出这次请求 */
function Timeline({ series: all, breakdown: b, highlight }: { series: readonly ContextSnapshot[]; breakdown: ContextBreakdown; highlight: ContextCategory | null }) {
  const series = all.length > MAX_BARS ? all.slice(all.length - MAX_BARS) : all;
  const [hot, setHot] = React.useState<number | null>(null);
  const last = series[series.length - 1];
  // 此刻: 最后一次请求之后流式长出来的部分 (估算), 虚框
  const now = !last || b.total > last.tokens ? b.total : 0;
  const peak = Math.max(b.compactAt ?? 0, b.total, ...series.map((p) => p.tokens)) || 1;
  const step = niceStep(peak / TICKS);
  const max = Math.ceil(peak / step) * step;
  if (!series.length && !now) return <p className="px-2.5 py-3 text-[11px] text-muted-foreground">还没有请求</p>;
  const t0 = series[0]?.at;
  // 柱宽按 "槽位" 算: 请求少时也按 MIN_SLOTS 份排, 图从左往右长满, 不会几根柱撑满整宽
  const slot = `${100 / Math.max(MIN_SLOTS, series.length + (now > 0 ? 1 : 0))}%`;
  const pick = hot != null ? series[hot] : last;
  const pickIdx = hot ?? series.length - 1;
  return (
    <div className="px-2.5 pt-3 pb-1.5">
      <div className="relative grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-1.5">
        {/* 纵轴 */}
        <div aria-hidden className="relative h-36 text-right text-[10px] text-muted-foreground tabular @3xl:h-44">
          {Array.from({ length: TICKS + 1 }, (_, i) => (
            <span key={i} className="absolute right-0 -translate-y-1/2 leading-none" style={{ bottom: `${(i / TICKS) * 100}%`, transform: i === 0 ? "translateY(0)" : undefined }}>
              {formatTokens((max / TICKS) * i)}
            </span>
          ))}
        </div>
        <div className="relative h-36 @3xl:h-44" onMouseLeave={() => setHot(null)}>
          {Array.from({ length: TICKS }, (_, i) => (
            <span key={i} aria-hidden className="absolute inset-x-0 border-t border-border/60" style={{ bottom: `${((i + 1) / TICKS) * 100}%` }} />
          ))}
          {b.compactAt && (
            <span aria-hidden className="absolute inset-x-0 z-10 border-t border-dashed border-destructive/60" style={{ bottom: `${pct(b.compactAt, max)}%` }}>
              <span className="absolute right-0 bottom-0.5 bg-card px-1 text-[10px] leading-3 text-destructive/80">压缩线 {formatTokens(b.compactAt)}</span>
            </span>
          )}
          <div className="absolute inset-0 flex items-end border-b">
            {series.map((p, i) => {
              const cachedH = p.cached != null ? pct(Math.min(p.cached, p.tokens), max) : null;
              return (
                <span
                  key={`${p.messageId}-${p.at}-${i}`}
                  data-hot={hot === i || undefined}
                  onMouseEnter={() => setHot(i)}
                  className="group relative flex h-full min-w-[2px] shrink-0 flex-col justify-end px-px" style={{ width: slot }}
                >
                  {p.compacted && <span aria-hidden title="压缩" className="absolute -top-0.5 left-1/2 z-10 size-1.5 -translate-x-1/2 rotate-45 bg-chart-4" />}
                  {[...CONTEXT_CATEGORIES].reverse().map((c) =>
                    p.byCategory[c] > 0 ? <span key={c} className={cn("w-full transition-opacity duration-150 first:rounded-t-[1px]", CAT_BG[c], highlight && highlight !== c && "opacity-20", hot != null && hot !== i && "opacity-60")} style={{ height: `${pct(p.byCategory[c], max)}%` }} /> : null,
                  )}
                  {cachedH != null && cachedH > 0 && <span aria-hidden className="absolute inset-x-0 h-px bg-background/90" style={{ bottom: `${cachedH}%` }} />}
                </span>
              );
            })}
            {now > 0 && (
              <span title={`此刻约 ${exact(now)} tokens (估算)`} className="relative flex h-full min-w-[2px] shrink-0 flex-col justify-end px-px" style={{ width: slot }}>
                <span className="w-full rounded-t-[1px] border border-dashed border-foreground/50 bg-foreground/5" style={{ height: `${pct(now, max)}%` }} />
              </span>
            )}
          </div>
        </div>
      </div>
      {/* 读数: 悬停的一根, 默认最后一根 */}
      <div className="mt-1 flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-0.5 pl-[2.625rem] text-[10px] text-muted-foreground tabular">
        <span className="text-foreground">
          #{pick ? all.length - series.length + pickIdx + 1 : "—"} / {all.length} 次请求
        </span>
        {pick && t0 != null && <span>+{formatDuration(pick.at - t0)}</span>}
        {pick && <span className="font-medium text-foreground">{exact(pick.tokens)}</span>}
        {pick?.cached != null && <span className="text-brand">缓存 {pctText(pick.cached, pick.tokens)}</span>}
        {pick?.compacted && <span className="text-chart-4">压缩后</span>}
        {pick &&
          CONTEXT_CATEGORIES.filter((c) => pick.byCategory[c] > 0).map((c) => (
            <span key={c} className="flex items-center gap-1">
              <Swatch c={c} className="size-1.5" />
              {formatTokens(pick.byCategory[c])}
            </span>
          ))}
        <span className="ml-auto @max-md:hidden">白线 = 缓存前缀 · ◆ = 压缩</span>
      </div>
    </div>
  );
}

/** 刻度步长取 1 / 2 / 5 × 10^n */
function niceStep(raw: number): number {
  if (raw <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(raw));
  const f = raw / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
}
