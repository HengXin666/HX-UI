"use client";
/**
 * 会话里的编排块: 一条消息派出子 Agent 时, 在这条消息的轨迹里出现的一个框 (内联卡片).
 * 框里是这次派出的那一支 Agent (派生树 / 泳道 / 卡片墙, 默认派生树), 随事件流实时更新; 每个子 Agent 显示自己的实时 tok/s,
 * 头部是子 Agent 合计. 点子 Agent 打开它的会话 (AgentProvider 的 onOpenAgent).
 * 弹出: 页面里放了 OrchestraDock 时, 头部多一个 "弹出" 按钮, 框变成停靠在侧边 / 右下角的悬浮面板 (可收起成小条),
 * 主对话照常往下滚, 子 Agent 一直能看; 原位置留一行紧凑占位, 点它放回.
 * 子 Agent 停下来等批准 / 回答时, 请求上浮到框下面的父线程里 (弹出时也在原位置), 标明来自哪个 Agent.
 * 数据全来自 AgentProvider 提供的 agents / messages, 消息本身只需要带派发 (task 调用的 tool-child agent-spawn, 或 spawn 的 messageId).
 */
import * as React from "react";
import { ChevronDown, ChevronUp, Gauge, Network, PanelRight, PictureInPicture2, SquareArrowDownRight, Undo2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { AGENT_DONE, agentWaits, countAgents, orchestraScope, pendingRequests, type AgentRequest, type AgentTree } from "../model/agents";
import { agentTokenRates, formatRate, sumRates } from "../model/usage";
import { IconButton } from "../parts/copy";
import { ToolCall } from "../tool/tool-call";
import { ApprovalBar } from "../tool/views/interactive";
import { AgentCardWall } from "./agent-card-wall";
import { AgentGraph } from "./agent-graph";
import { AgentSwimlanes } from "./agent-swimlanes";
import { ORCHESTRA_VIEWS, TONE_BG, type OrchestraView } from "./constants";
import { useAgentSession, useOrchestraDock, useSessionMessages, type DockedOrchestra } from "./session-context";
import { useOrchestraNow } from "./shared";

export interface AgentOrchestraBlockProps {
  /** 这条消息派出的 Agent */
  agentIds: readonly string[];
  /** 派发者 (编排者 / 消息所属的 Agent); 在树里时画在最左 */
  rootId?: string;
  defaultView?: OrchestraView;
  /** 弹出 / 放回用的 id (同一会话里唯一), 默认按 agentIds 拼 */
  dockKey?: string;
  className?: string;
}

const COUNT_ITEMS = [
  { key: "running", label: "运行中", tone: "brand" },
  { key: "waiting", label: "等待", tone: "warning" },
  { key: "done", label: "完成", tone: "success" },
  { key: "error", label: "失败", tone: "destructive" },
  { key: "queued", label: "排队", tone: "muted" },
] as const;

function Counts({ tree, ids, compact = false }: { tree: AgentTree; ids: readonly string[]; compact?: boolean }) {
  const c = countAgents(tree, ids);
  return (
    <span className={cn("flex min-w-0 items-center gap-x-3 gap-y-1 text-xs text-muted-foreground", compact ? "flex-nowrap overflow-hidden" : "flex-wrap")}>
      <span className={cn("tabular", compact && "max-sm:hidden")}>{c.total} 个子 Agent</span>
      {COUNT_ITEMS.filter((i) => c[i.key] > 0 && (!compact || i.key === "running" || i.key === "waiting")).map((i) => (
        <span key={i.key} className="inline-flex shrink-0 items-center gap-1">
          <span aria-hidden className={cn("size-1.5 rounded-full", TONE_BG[i.tone])} />
          {i.label}
          <span className="tabular text-foreground">{c[i.key]}</span>
        </span>
      ))}
    </span>
  );
}

/**
 * 子 Agent 的请求, 上浮到父线程: 等批准的走 ApprovalBar, 提问走原来的提问卡, 其余一行说明.
 * 研究笔记: docs/dsh-conversation-research.md
 */
function SubagentRequest({ request, onOpen }: { request: AgentRequest; onOpen?: (id: string) => void }) {
  const { agent, call } = request;
  const source = (
    <button type="button" onClick={() => onOpen?.(agent.id)} disabled={!onOpen} className="font-medium text-foreground underline-offset-2 hover:underline disabled:no-underline">
      {agent.name}
      {agent.role && agent.role !== agent.name ? <span className="font-normal text-muted-foreground"> · {agent.role}</span> : null}
    </button>
  );
  if (call?.status === "awaiting-approval") return <ApprovalBar call={call} source={source} />;
  if (call) {
    return (
      <div data-slot="subagent-request" className="rounded-lg border border-warning/40 px-3 py-1">
        <div className="pt-1 text-[11px] text-muted-foreground">来自 {source}</div>
        <ToolCall call={call} />
      </div>
    );
  }
  return (
    <div data-slot="subagent-request" className="my-1.5 flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/8 px-3 py-2 text-[13px]">
      <span aria-hidden className="size-1.5 rounded-full bg-warning" />
      {source}
      <span className="text-muted-foreground">{agent.status === "awaiting-input" ? "在等你回答" : "在等你批准"}</span>
      {agent.summary && <span className="min-w-0 truncate">{agent.summary}</span>}
    </div>
  );
}

/** 编排的范围, 子 Agent, 各自速率与合计 (内联框, 悬浮面板, 占位条共用) */
function useOrchestra(agentIds: readonly string[], rootId: string | undefined) {
  const { agents } = useAgentSession();
  const messages = useSessionMessages();
  const scope = React.useMemo(() => orchestraScope(agents, agentIds, rootId), [agents, agentIds, rootId]);
  const subIds = React.useMemo(() => scope.order.filter((id) => id !== rootId || agentIds.includes(id)), [scope, rootId, agentIds]);
  const now = useOrchestraNow(scope);
  // 每个 Agent 按归属各算各的速率; 头部只加子 Agent 的
  const rates = React.useMemo(() => agentTokenRates(messages, agents, now), [messages, agents, now]);
  return { agents, messages, scope, subIds, rates, rate: sumRates(rates, subIds) };
}

function RateChip({ rate, title = "子 Agent 合计的输出速率" }: { rate: number; title?: string }) {
  if (rate <= 0) return null;
  return (
    <span data-slot="orchestra-rate" className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground tabular" title={title}>
      <Gauge aria-hidden className="size-3.5" />
      <span className="text-foreground">{formatRate(rate)}</span> tok/s
    </span>
  );
}

export interface OrchestraFrameProps {
  agentIds: readonly string[];
  rootId?: string;
  view: OrchestraView;
  onViewChange: (v: OrchestraView) => void;
  /** 头部右侧额外按钮 (弹出 / 收起 / 停靠) */
  actions?: React.ReactNode;
  /** 主体限高的类 (内联默认随内容长高, 到 min(48rem, 85vh) 才滚动, 不在固定高度处截半张卡片) */
  bodyClassName?: string;
  className?: string;
}

/** 编排框本体: 头部 (计数, 合计速率, 视图切换, 按钮) + 视图 + 底部谁在等谁. 内联与悬浮共用 */
export function OrchestraFrame({ agentIds, rootId, view, onViewChange, actions, bodyClassName, className }: OrchestraFrameProps) {
  const { openAgentId, onOpenAgent } = useAgentSession();
  const { messages, scope, subIds, rates, rate } = useOrchestra(agentIds, rootId);
  const [local, setLocal] = React.useState<string | null>(null);
  const selected = onOpenAgent ? (openAgentId ?? null) : local;
  const select = React.useCallback(
    (id: string) => {
      const next = selected === id ? null : id;
      if (onOpenAgent) onOpenAgent(next);
      else setLocal(next);
    },
    [selected, onOpenAgent],
  );
  const subSet = React.useMemo(() => new Set(subIds), [subIds]);
  const waits = agentWaits(scope).filter((w) => subSet.has(w.from));
  const name = (id: string) => scope.nodes[id]?.name ?? id;
  const shared = { agents: scope, selectedId: selected, onSelect: select, messages, rates };
  return (
    <section data-slot="agent-orchestra-block" aria-label="多 Agent 编排" className={cn("flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs", className)}>
      <Tabs value={view} onValueChange={(v) => onViewChange(v as OrchestraView)} className="gap-0">
        <header className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b px-3 py-2">
          <span className="flex items-center gap-1.5 text-[13px] font-medium">
            <Network aria-hidden className="size-4 text-muted-foreground" />
            编排
          </span>
          <Counts tree={scope} ids={subIds} />
          <span className="ml-auto flex items-center gap-2">
            <RateChip rate={rate} />
            <TabsList aria-label="编排视图" className="h-7">
              {ORCHESTRA_VIEWS.map((v) => (
                <TabsTrigger key={v.value} value={v.value} className="px-2 text-xs">
                  {v.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {actions && <span className="flex items-center text-muted-foreground">{actions}</span>}
          </span>
        </header>
      </Tabs>
      <div className={cn("min-h-0 overflow-auto scrollbar-thin p-3", bodyClassName ?? "max-h-[min(48rem,85vh)]")}>
        {view === "graph" ? <AgentGraph {...shared} /> : view === "lanes" ? <AgentSwimlanes {...shared} /> : <AgentCardWall {...shared} />}
      </div>
      <footer className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 border-t px-3 py-1.5 text-xs text-muted-foreground">
        {waits.length ? (
          waits.slice(0, 3).map((w) => (
            <span key={`${w.from}>${w.to ?? "user"}`} className="truncate">
              <span className="text-foreground">{name(w.from)}</span> 在等 <span className="text-foreground">{w.to ? name(w.to) : w.reason === "awaiting-input" ? "你回答" : "你批准"}</span>
            </span>
          ))
        ) : (
          <span>{onOpenAgent ? "点子 Agent 查看它的会话" : "点子 Agent 选中"}</span>
        )}
      </footer>
    </section>
  );
}

/** 弹出后原位置留的紧凑占位: "编排已弹出 · 5 个子 Agent · 运行中 3 · 64 tok/s [放回]" */
function DockedPlaceholder({ agentIds, rootId, onRestore }: { agentIds: readonly string[]; rootId?: string; onRestore: () => void }) {
  const { scope, subIds, rate } = useOrchestra(agentIds, rootId);
  return (
    <button
      type="button"
      data-slot="orchestra-placeholder"
      onClick={onRestore}
      aria-label="编排已弹出成悬浮面板, 点击放回对话"
      className="group/ph my-1.5 flex min-w-0 items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-left text-[13px] transition-colors duration-150 hover:bg-accent/50 focus-visible:outline-2 focus-visible:outline-ring"
    >
      <PictureInPicture2 aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      <span className="shrink-0 font-medium">编排已弹出</span>
      <Counts tree={scope} ids={subIds} compact />
      <span className="ml-auto flex shrink-0 items-center gap-2">
        <RateChip rate={rate} />
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground group-hover/ph:text-foreground">
          <Undo2 aria-hidden className="size-3.5" />
          <span className="max-sm:sr-only">放回</span>
        </span>
      </span>
    </button>
  );
}

export const AgentOrchestraBlock = React.memo(function AgentOrchestraBlock({ agentIds, rootId, defaultView, dockKey, className }: AgentOrchestraBlockProps) {
  const session = useAgentSession();
  const { agents } = session;
  const messages = useSessionMessages();
  const dock = useOrchestraDock();
  const key = dockKey ?? `orch:${agentIds.join(",")}`;
  const [view, setView] = React.useState<OrchestraView>(defaultView ?? session.orchestraView ?? "graph");
  const subIds = React.useMemo(() => orchestraScope(agents, agentIds, rootId).order.filter((id) => id !== rootId || agentIds.includes(id)), [agents, agentIds, rootId]);
  const requests = React.useMemo(() => pendingRequests(messages, agents, subIds), [messages, agents, subIds]);
  const popped = dock.docked?.key === key;
  const pop = () => dock.pop({ key, agentIds, rootId });
  return (
    <>
      {popped ? (
        <DockedPlaceholder agentIds={agentIds} rootId={rootId} onRestore={dock.restore} />
      ) : (
        <OrchestraFrame
          agentIds={agentIds}
          rootId={rootId}
          view={view}
          onViewChange={setView}
          className={cn("my-1.5", className)}
          actions={
            dock.hosted ? (
              <IconButton label="弹出成悬浮面板" className="size-7" onClick={pop}>
                <PictureInPicture2 />
              </IconButton>
            ) : undefined
          }
        />
      )}
      {requests.map((r) => (
        <SubagentRequest key={`${r.agent.id}:${r.call?.id ?? ""}`} request={r} onOpen={session.onOpenAgent ? (id) => session.onOpenAgent?.(id) : undefined} />
      ))}
    </>
  );
});

export type OrchestraDockPosition = "side" | "corner";

export interface OrchestraDockProps {
  /** 停靠位置, 不给由面板自己记 (默认右下角) */
  position?: OrchestraDockPosition;
  defaultPosition?: OrchestraDockPosition;
  onPositionChange?: (p: OrchestraDockPosition) => void;
  defaultView?: OrchestraView;
  /** 定位: 面板是 absolute, 相对最近的定位祖先; 这里调偏移 (例如避开输入框) */
  className?: string;
}

/**
 * 悬浮编排面板的宿主: 放在会话区 (有定位的容器) 里. 编排框点 "弹出" 后在这里画, 停靠在侧边或右下角, 可收起成小条,
 * 点 "放回" 回到对话里的原位置. 弹出的那一支全部不在树里了 (重放 / 换会话) 时自动放回.
 */
export function OrchestraDock({ position: positionProp, defaultPosition = "corner", onPositionChange, defaultView, className }: OrchestraDockProps) {
  const dock = useOrchestraDock();
  const { agents, orchestraView } = useAgentSession();
  const { register, docked, restore, ui, setUi } = dock;
  React.useEffect(() => register(), [register]);
  // 收起 / 位置 / 视图记在会话上下文里: 切到子 Agent 时宿主卸载, 回来后面板保持原样
  const position = positionProp ?? ui.position ?? defaultPosition;
  const setPosition = (p: OrchestraDockPosition) => {
    if (positionProp === undefined) setUi({ position: p });
    onPositionChange?.(p);
  };
  const collapsed = ui.collapsed;
  const setCollapsed = (c: boolean) => setUi({ collapsed: c });
  const view = ui.view ?? defaultView ?? orchestraView ?? "graph";
  const setView = (v: OrchestraView) => setUi({ view: v });
  const gone = !!docked && !docked.agentIds.some((id) => id in agents.nodes);
  React.useEffect(() => {
    if (gone) restore();
  }, [gone, restore]);
  if (!docked || gone) return null;
  return <DockPanel docked={docked} position={position} setPosition={setPosition} collapsed={collapsed} setCollapsed={setCollapsed} view={view} setView={setView} onRestore={restore} className={className} />;
}

function DockPanel({ docked, position, setPosition, collapsed, setCollapsed, view, setView, onRestore, className }: {
  docked: DockedOrchestra;
  position: OrchestraDockPosition;
  setPosition: (p: OrchestraDockPosition) => void;
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  view: OrchestraView;
  setView: (v: OrchestraView) => void;
  onRestore: () => void;
  className?: string;
}) {
  const { scope, subIds, rate } = useOrchestra(docked.agentIds, docked.rootId);
  const live = subIds.some((id) => !AGENT_DONE.has(scope.nodes[id]?.status ?? "done"));
  const side = position === "side";
  // 放在 Conversation 的 overlay 里时用 --hx-footer-h 避开输入区
  const place = side
    ? "top-3 right-3 bottom-[calc(var(--hx-footer-h,0px)+0.75rem)] w-[min(26rem,calc(100%-1.5rem))]"
    : "right-3 bottom-[calc(var(--hx-footer-h,0px)+0.75rem)] w-[min(32rem,calc(100%-1.5rem))] max-h-[min(34rem,calc(100%-var(--hx-footer-h,0px)-1.5rem))]";
  if (collapsed) {
    return (
      <div data-slot="orchestra-dock" data-position={position} data-collapsed className={cn("absolute right-3 bottom-[calc(var(--hx-footer-h,0px)+0.75rem)] z-30 flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-full border bg-popover py-1 pr-1 pl-3 text-popover-foreground shadow-float animate-in fade-in-0 slide-in-from-bottom-2", className)}>
        <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", live ? "bg-brand" : "bg-success")} />
        <span className="shrink-0 text-[13px] font-medium">编排</span>
        <Counts tree={scope} ids={subIds} compact />
        <RateChip rate={rate} />
        <IconButton label="展开编排面板" className="size-7 shrink-0" onClick={() => setCollapsed(false)}>
          <ChevronUp />
        </IconButton>
      </div>
    );
  }
  const actions = (
    <>
      <IconButton label={side ? "停到右下角" : "停靠到侧边"} className="size-7" onClick={() => setPosition(side ? "corner" : "side")}>
        {side ? <SquareArrowDownRight /> : <PanelRight />}
      </IconButton>
      <IconButton label="收起成小条" className="size-7" onClick={() => setCollapsed(true)}>
        <ChevronDown />
      </IconButton>
      <IconButton label="放回对话" className="size-7" onClick={onRestore}>
        <Undo2 />
      </IconButton>
    </>
  );
  return (
    <div data-slot="orchestra-dock" data-position={position} className={cn("absolute z-30 flex min-h-0 animate-in fade-in-0 zoom-in-95 duration-200", place, className)}>
      <OrchestraFrame agentIds={docked.agentIds} rootId={docked.rootId} view={view} onViewChange={setView} actions={actions} className="w-full shadow-float" bodyClassName="flex-1" />
    </div>
  );
}
