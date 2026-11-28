"use client";
/**
 * 计划 / 待办 (对标 oh-my-pi 的 todo HUD 与 DSH 输入框上方的 TodoPanel): 大项 > 小项的嵌套清单, 实时打勾.
 *   PlanTree   嵌套清单: 大项可折叠并显示 x/y, 叶子是状态图标 + 内容, 当前项高亮; 新完成的项划线从左到右扫过,
 *              新加的项淡入 (只动 transform / opacity, 减弱动效时直接到位).
 *   PlanCard   卡片: 标题 · x/y · 进度条 + PlanTree. 会话里最新一次待办调用画成它 (实时更新).
 *   PlanPanel  固定面板: 停在输入框上方 (收起时一行 "计划 3/9 · 当前项") 或侧边; 可切换位置, 可收起.
 *   TodoCallCard 待办工具的视图. 默认 (AgentProvider planCalls="hidden") 更新时不在对话里出现, 只有第一次列出计划时一行 "列出计划 · 9 项";
 *              planCalls="line" 每次调用一行很淡的变更摘要 "更新计划 · 完成 写用例 · 3/9",
 *              完整计划只在输入框上方的 PlanPanel 里 (避免对话里和底部两份计划分不清); planCalls="card" 回退成内联计划卡
 *              (最新一步画整张卡, 更早的几步收成可展开的一行), 给没放 PlanPanel 的场景.
 * 数据: model/todos.ts (从 todo_write / update_plan / OMP todo 调用派生); 会话里的索引由 AgentProvider 维护 (usePlanIndex).
 * 研究笔记: docs/dsh-conversation-research.md
 */
import * as React from "react";
import { Check, ChevronDown, ChevronRight, Circle, CircleDot, ListTodo, PanelBottom, PanelRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { planOf, describePlanStep, flattenPlan, planFromParts, planProgress, planStatus, type Plan, type PlanItem, type PlanStatus, type PlanStep } from "./model/todos";
import { MAIN_THREAD } from "./model/usage";
import { useAgentSession, usePlanIndex, useSessionMessages } from "./orchestra/session-context";
import { Disclosure } from "./parts/disclosure";
import { IconButton } from "./parts/copy";
import { useAgentUI, type ToolViewProps } from "./tool/context";
import "./agent.css";

const STATUS_LABEL: Record<PlanStatus, string> = { pending: "待办", in_progress: "进行中", completed: "已完成", cancelled: "已取消" };

/** 状态图标: 完成 = 成功色实心勾, 进行中 = 强调色, 待办 = 空心, 取消 = 叉 */
function StatusGlyph({ status, fresh }: { status: PlanStatus; fresh?: boolean }) {
  if (status === "completed") {
    return (
      <span data-fresh={fresh || undefined} className="hx-plan-check grid size-3.5 place-items-center rounded-full bg-success text-background">
        <Check className="size-2.5" strokeWidth={3} />
      </span>
    );
  }
  if (status === "in_progress") return <CircleDot className="size-3.5 text-brand" />;
  if (status === "cancelled") return <X className="size-3.5 text-muted-foreground/70" />;
  return <Circle className="size-3.5 text-muted-foreground/50" />;
}

const NONE: ReadonlySet<string> = new Set();
/** 动画播完再清掉标记 (与 agent.css 的 hx-plan-* 时长一致) */
const FRESH_MS = 900;

/** 刚变成完成 / 刚出现的项 (挂载时已有的不算, 只播之后的变化); 动画播完自动清掉 */
function useFresh(items: readonly PlanItem[]): { done: ReadonlySet<string>; added: ReadonlySet<string> } {
  const prev = React.useRef<Map<string, PlanStatus> | null>(null);
  const [fresh, setFresh] = React.useState({ done: NONE, added: NONE });
  const flat = flattenPlan(items);
  const key = flat.map((it) => `${it.id}:${planStatus(it)}`).join("|");
  React.useLayoutEffect(() => {
    const before = prev.current;
    prev.current = new Map(flat.map((it) => [it.id, planStatus(it)]));
    if (!before) return;
    const done = new Set<string>();
    const added = new Set<string>();
    for (const [id, now] of prev.current) {
      const was = before.get(id);
      if (was === undefined) added.add(id);
      else if (now === "completed" && was !== "completed") done.add(id);
    }
    if (!done.size && !added.size) return;
    setFresh({ done, added });
    const t = window.setTimeout(() => setFresh({ done: NONE, added: NONE }), FRESH_MS);
    return () => window.clearTimeout(t);
    // 只在清单真的变了时比较
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return fresh;
}

export interface PlanTreeProps {
  items: readonly PlanItem[];
  /** 高亮的当前项 (默认按进度取) */
  currentId?: string;
  /** 大项默认折叠: 已关闭的大项折起, 其余展开 (OMP 的 stage window) */
  className?: string;
}

/** 嵌套清单 */
export function PlanTree({ items, currentId, className }: PlanTreeProps) {
  const progress = planProgress(items);
  const current = currentId ?? progress.current?.id;
  const path = new Set(progress.currentPath);
  const fresh = useFresh(items);
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const render = (list: readonly PlanItem[], depth: number): React.ReactNode => (
    <ul role={depth ? "group" : "tree"} aria-label={depth ? undefined : "计划"} className={cn("grid", depth > 0 && "ml-[7px] border-l pl-3")}>
      {list.map((it) => {
        const status = planStatus(it);
        const parent = it.children.length > 0;
        const p = parent ? planProgress(it.children) : undefined;
        const open = parent && (touched[it.id] ?? (!(status === "completed" || status === "cancelled") || path.has(it.id)));
        const isCurrent = it.id === current;
        const label = status === "in_progress" && it.activeForm && !parent ? it.activeForm : it.content;
        const row = (
          <>
            <span className="grid size-4 shrink-0 place-items-center">
              <StatusGlyph status={status} fresh={fresh.done.has(it.id)} />
            </span>
            <span
              data-done={status === "completed" || status === "cancelled" || undefined}
              data-fresh={fresh.done.has(it.id) || undefined}
              className={cn(
                "hx-plan-text relative min-w-0 truncate",
                parent ? "font-medium text-foreground" : "text-foreground/90",
                (status === "completed" || status === "cancelled") && "text-muted-foreground",
                isCurrent && "font-medium text-foreground",
              )}
            >
              {label}
            </span>
            {parent && p && (
              <span className="ml-auto shrink-0 pl-2 text-[11px] text-muted-foreground tabular">
                {p.closed}/{p.total}
              </span>
            )}
            {!parent && isCurrent && <span className="ml-auto shrink-0 pl-2 text-[11px] text-brand">当前</span>}
            {parent && <ChevronRight aria-hidden className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-90")} />}
          </>
        );
        const rowCls = cn(
          "flex h-7 min-w-0 items-center gap-2 rounded-md px-1.5 text-[13px]",
          isCurrent && "bg-brand-soft",
          fresh.added.has(it.id) && "hx-plan-added",
        );
        return (
          <li key={it.id} role="treeitem" aria-expanded={parent ? !!open : undefined} aria-current={isCurrent || undefined} aria-label={`${it.content} ${STATUS_LABEL[status]}${p ? ` ${p.closed}/${p.total}` : ""}`} data-status={status} className="min-w-0">
            {parent ? (
              <button type="button" aria-expanded={!!open} onClick={() => setTouched((t) => ({ ...t, [it.id]: !open }))} className={cn(rowCls, "w-full text-left transition-colors duration-150 hover:bg-accent/60 focus-visible:outline-2 focus-visible:outline-ring")}>
                {row}
              </button>
            ) : (
              <div className={rowCls}>{row}</div>
            )}
            {open && render(it.children, depth + 1)}
          </li>
        );
      })}
    </ul>
  );
  if (!items.length) return null;
  return <div data-slot="plan-tree" className={cn("min-w-0", className)}>{render(items, 0)}</div>;
}

/** 进度条 (scaleX, 只动 transform) */
export function PlanProgressBar({ closed, total, className }: { closed: number; total: number; className?: string }) {
  const ratio = total ? closed / total : 0;
  return (
    <span aria-hidden className={cn("relative block h-1 overflow-hidden rounded-full bg-muted", className)}>
      <span className="absolute inset-0 origin-left rounded-full bg-success transition-transform duration-500" style={{ transform: `scaleX(${ratio})` }} />
    </span>
  );
}

function PlanHeader({ items, live, right, onToggle, collapsed }: { items: readonly PlanItem[]; live?: boolean; right?: React.ReactNode; onToggle?: () => void; collapsed?: boolean }) {
  const p = planProgress(items);
  const done = p.total > 0 && p.closed === p.total;
  const inner = (
    <>
      <ListTodo aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      <span className="shrink-0 font-medium">计划</span>
      <span className="shrink-0 text-xs text-muted-foreground tabular">
        {p.closed}/{p.total}
      </span>
      <PlanProgressBar closed={p.closed} total={p.total} className="w-12 shrink-0 sm:w-16" />
      {collapsed && p.current && (
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <CircleDot aria-hidden className="size-3 shrink-0 text-brand" />
          <span className={cn("min-w-0 truncate text-foreground/85", live && "hx-shimmer-text")}>{p.current.activeForm ?? p.current.content}</span>
        </span>
      )}
      {collapsed && done && <span className="text-xs text-success">全部完成</span>}
    </>
  );
  return (
    <div className="flex h-9 min-w-0 items-center gap-2 px-3 text-[13px]">
      {onToggle ? (
        <button type="button" aria-expanded={!collapsed} onClick={onToggle} className="-ml-1 flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 text-left hover:bg-accent/60 focus-visible:outline-2 focus-visible:outline-ring">
          {inner}
          <ChevronDown aria-hidden className={cn("ml-auto size-3.5 shrink-0 text-muted-foreground transition-transform duration-200", collapsed && "-rotate-90")} />
        </button>
      ) : (
        <span className="flex min-w-0 flex-1 items-center gap-2">{inner}</span>
      )}
      {right}
    </div>
  );
}

export interface PlanCardProps {
  items: readonly PlanItem[];
  /** 计划还在更新 (参数流式 / 所属 Agent 在跑): 当前项文字呼吸 */
  live?: boolean;
  defaultCollapsed?: boolean;
  className?: string;
}

/** 会话里的计划卡: 标题 · x/y · 进度条, 下面是嵌套清单, 可整体收起 */
export function PlanCard({ items, live, defaultCollapsed = false, className }: PlanCardProps) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);
  if (!items.length) return null;
  return (
    <section data-slot="plan-card" aria-label="计划" className={cn("my-1 min-w-0 overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs", className)}>
      <PlanHeader items={items} live={live} collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      {!collapsed && <PlanTree items={items} className="border-t px-1.5 py-1.5" />}
    </section>
  );
}

export type PlanPlacement = "dock" | "side";

export interface PlanPanelProps {
  /** 不给就取 AgentProvider 里的会话计划 (主线程, 或 agentId 的) */
  plan?: Plan;
  agentId?: string;
  /** dock: 输入框上方 (默认); side: 侧边一栏 */
  placement?: PlanPlacement;
  /** 给了就在标题栏出切换位置的按钮 */
  onPlacementChange?: (p: PlanPlacement) => void;
  onClose?: () => void;
  defaultCollapsed?: boolean;
  /** 所属 Agent 在跑 */
  live?: boolean;
  className?: string;
}

/** 会话的计划 (主线程或某个子 Agent): 读 AgentProvider 的消息 */
export function useSessionPlan(agentId?: string): Plan {
  const index = usePlanIndex();
  const { agents } = useAgentSession();
  const messages = useSessionMessages();
  const key = agentId && agents.nodes[agentId]?.parentId ? agentId : MAIN_THREAD;
  const fromIndex = index.plans.get(key);
  // 索引里没有 (没把 messages 交给 AgentProvider) 时按树现算一次
  return React.useMemo(() => fromIndex ?? planOf(messages, agents, key === MAIN_THREAD ? undefined : key), [fromIndex, messages, agents, key]);
}

/**
 * 固定的计划面板. dock 时收起成一行 "计划 3/9 ▬▬ · ◉ 当前项", 展开是嵌套清单 (限高可滚); side 时是一整栏.
 * 没有计划时什么都不画.
 */
export function PlanPanel({ plan: planProp, agentId, placement = "dock", onPlacementChange, onClose, defaultCollapsed, live, className }: PlanPanelProps) {
  const session = useSessionPlan(agentId);
  const plan = planProp ?? session;
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed ?? placement === "dock");
  if (!plan.items.length) return null;
  const side = placement === "side";
  const shut = !side && collapsed;
  const right = (
    <span className="flex shrink-0 items-center text-muted-foreground">
      {onPlacementChange && (
        <IconButton label={side ? "停到输入框上方" : "固定到侧边"} className="size-7" onClick={() => onPlacementChange(side ? "dock" : "side")}>
          {side ? <PanelBottom /> : <PanelRight />}
        </IconButton>
      )}
      {onClose && (
        <IconButton label="关闭计划" className="size-7" onClick={onClose}>
          <X />
        </IconButton>
      )}
    </span>
  );
  return (
    <section data-slot="plan-panel" data-placement={placement} aria-label="计划" className={cn("flex min-h-0 min-w-0 flex-col overflow-hidden bg-card text-card-foreground", side ? "h-full" : "rounded-xl border shadow-xs", className)}>
      <PlanHeader items={plan.items} live={live} collapsed={shut} onToggle={side ? undefined : () => setCollapsed((c) => !c)} right={right} />
      {!shut && <PlanTree items={plan.items} className={cn("min-h-0 overflow-y-auto scrollbar-thin border-t px-1.5 py-1.5", side ? "flex-1" : "max-h-[min(16rem,40vh)]")} />}
    </section>
  );
}

/** 对话流里的一行计划变更: 很淡, 不可展开 (完整计划在 PlanPanel) */
function PlanLine({ step, live, first }: { step: PlanStep; live: boolean; first: boolean }) {
  const p = planProgress(step.items);
  const what = first ? `${p.total} 项` : describePlanStep(step) || (step.items.length ? "无变化" : "");
  return (
    <div data-slot="plan-line" aria-label={`${first ? "列出计划" : "更新计划"}${what ? ` · ${what}` : ""} · ${p.closed}/${p.total}`} className="flex h-7 min-w-0 items-center gap-2 text-[12px] text-[var(--hx-agent-process)]">
      <span className="grid size-5 shrink-0 place-items-center opacity-70 [&_svg]:size-3.5">
        <ListTodo />
      </span>
      <span className={cn("shrink-0", live && "hx-shimmer-text")}>{first ? "列出计划" : "更新计划"}</span>
      {what && <span className="min-w-0 truncate opacity-80">· {what}</span>}
      <span className="ml-auto shrink-0 pl-2 tabular opacity-80">
        {p.closed}/{p.total}
      </span>
    </div>
  );
}

/**
 * 待办工具的视图 (todoView 的 Body, 始终露在外面). 默认 (planCalls="hidden") 只有第一次列出计划时一行, 之后的更新由 AgentParts 滤掉;
 * "line" 每次一行变更摘要 (PlanLine); AgentProvider planCalls="card" 时
 * 所属计划的最新一步画整张实时卡片, 更早的几步收成一行 "更新计划 · 完成 写用例 · 3/9", 展开看当时的清单.
 */
export function TodoCallCard({ call }: ToolViewProps) {
  const index = usePlanIndex();
  const { planCalls = "hidden" } = useAgentUI();
  const hit = index.steps.get(call.id);
  // 没进索引 (单独渲染的工具调用): 只看这一次调用自己的快照
  const solo = React.useMemo(() => (hit ? null : planFromParts([{ type: "tool", id: call.id, call }])), [hit, call]);
  const step = hit?.step ?? solo?.steps[0];
  if (!step) return <Disclosure icon={<ListTodo />} title="更新计划" summary={typeof call.args?.op === "string" ? call.args.op : undefined} expandable={false} />;
  const live = step.live || call.status === "preparing" || call.status === "running";
  // hidden: AgentParts 已经滤掉了后续的更新, 走到这里的是第一次列出 (或没进索引的单独调用)
  if (planCalls === "line" || planCalls === "hidden") return <PlanLine step={step} live={live} first={!hit || index.plans.get(hit.owner)?.steps[0]?.callId === call.id} />;
  if (!hit || hit.latest) return <PlanCard items={step.items} live={live} />;
  const p = planProgress(step.items);
  return (
    <Disclosure
      data-slot="plan-step"
      icon={<ListTodo />}
      title="更新计划"
      summary={describePlanStep(step) || undefined}
      suffix={
        <span className="tabular">
          {p.closed}/{p.total}
        </span>
      }
    >
      <PlanTree items={step.items} />
    </Disclosure>
  );
}
