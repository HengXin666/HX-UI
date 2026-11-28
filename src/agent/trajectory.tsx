"use client";
/**
 * 轨迹视图 (对标 DSH 的 Trajectory 标签页): 按轮分组的账本. 每轮一个吸顶的轮次头 (第 N 轮 + 列名),
 * 每行 32px: 序号 · 类型标签 (用户 / 助手 / 思考 / 工具 / 子工具 / 子 Agent) · 说明 · 输入 / 输出 / 思考 token · 时长 · 计时条.
 * 子调用与子 Agent 的工作折在父行下面 ("6 个子调用"), 可以单独展开, 工具栏一键展开 / 收起全部.
 * 窄 (layout="auto" 且窄于 600px, 或 layout="list") 时改成单列卡片式行: 序号 · 类型标签 · 一行摘要, token 与时长放右侧小字, 不挤成多列表格.
 * 计时条画在这一轮的时间范围里: 助手行分成 "等首 token" (浅) 与 "生成" (强调色) 两段; 还在进行的行只画开始标记, 不编造时长.
 */
import * as React from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AgentTree } from "./model/agents";
import { buildTrajectory, type TrajectoryKind, type TrajectoryRow, type TrajectoryTurn } from "./model/trajectory";
import type { AgentMessage } from "./model/types";
import { useElapsed } from "./parts/elapsed";
import { formatDuration, formatTokens } from "./parts/format";

export interface AgentTrajectoryProps {
  messages: readonly AgentMessage[];
  agents?: AgentTree;
  /** 子调用默认展开 */
  defaultExpanded?: boolean;
  /**
   * 排版: table 是多列账本; list 是单列卡片式行 (序号 + 类型标签 + 一行摘要, token 与时长在右侧小字), 手机用;
   * auto (默认) 按自身宽度选, 窄于 600px 用 list.
   */
  layout?: "auto" | "table" | "list";
  className?: string;
}

/** auto 排版时, 窄于这个宽度 (px) 改成单列卡片式行 */
const TRAJECTORY_LIST_BELOW = 600;

const KIND: Record<TrajectoryKind, { label: string; cls: string }> = {
  user: { label: "用户", cls: "bg-success/12 text-success" },
  assistant: { label: "助手", cls: "bg-brand-soft text-brand" },
  reasoning: { label: "思考", cls: "bg-muted text-muted-foreground" },
  tool: { label: "工具", cls: "bg-muted text-foreground/80" },
  subtool: { label: "子工具", cls: "border text-muted-foreground" },
  agent: { label: "子 Agent", cls: "border border-brand/40 text-brand" },
  text: { label: "回答", cls: "bg-muted text-foreground/80" },
  notice: { label: "提示", cls: "bg-muted text-muted-foreground" },
};

const STATUS_TEXT: Record<NonNullable<TrajectoryRow["status"]>, { label: string; cls: string }> = {
  error: { label: "失败", cls: "text-destructive" },
  interrupted: { label: "中断", cls: "text-warning" },
  denied: { label: "已拒绝", cls: "text-muted-foreground" },
  waiting: { label: "等批准", cls: "text-warning" },
};

/** 列: 序号, 类型, 说明, 输入, 输出, 思考, 时长, 计时条 */
const GRID = "grid grid-cols-[2.5rem_6rem_minmax(0,1fr)_3.25rem_3.25rem_3.25rem_4rem_minmax(5rem,9rem)] items-center gap-x-2";
const INDENT = 12;

function TimeBar({ row, t0, span }: { row: TrajectoryRow; t0: number; span: number }) {
  if (row.start == null) return <span />;
  const left = ((row.start - t0) / span) * 100;
  if (row.live || row.end == null) {
    return (
      <span className="relative h-3">
        <span className="absolute inset-y-0 w-0.5 rounded-full bg-brand" style={{ left: `${Math.min(99, left)}%` }} title="进行中" />
      </span>
    );
  }
  const width = Math.max(0.6, ((row.end - row.start) / span) * 100);
  const wait = row.ttftMs != null && row.end > row.start ? Math.min(100, (row.ttftMs / (row.end - row.start)) * 100) : 0;
  return (
    <span className="relative h-3" title={`${formatDuration(row.end - row.start)}${row.ttftMs != null ? ` · 首 token ${formatDuration(row.ttftMs)}` : ""}`}>
      <span className={cn("absolute inset-y-0.5 flex overflow-hidden rounded-sm", row.status === "error" ? "bg-destructive/70" : "bg-brand/70")} style={{ left: `${left}%`, width: `${width}%` }}>
        {wait > 0 && <span className="h-full bg-muted-foreground/40" style={{ width: `${wait}%` }} />}
      </span>
    </span>
  );
}

const num = (n?: number) => (n ? formatTokens(n) : "");

function Row({ row, index, depth, t0, span, expanded, onToggle }: { row: TrajectoryRow; index: string; depth: number; t0: number; span: number; expanded: boolean; onToggle?: () => void }) {
  const k = KIND[row.kind];
  const st = row.status ? STATUS_TEXT[row.status] : undefined;
  const dur = row.start != null && row.end != null && !row.live ? formatDuration(row.end - row.start) : row.live ? "进行中" : "";
  return (
    <div data-slot="trajectory-row" data-kind={row.kind} data-live={row.live || undefined} className={cn(GRID, "h-8 rounded-md px-2 text-[13px] transition-colors duration-150 hover:bg-accent/50")}>
      <span className="text-xs text-muted-foreground tabular">{index}</span>
      <span className="min-w-0" style={{ paddingLeft: depth * INDENT }}>
        <span className={cn("inline-flex h-5 max-w-full items-center truncate rounded px-1.5 text-[11px] font-medium", k.cls)}>{k.label}</span>
      </span>
      <span className="flex min-w-0 items-center gap-1.5">
        {onToggle ? (
          <button type="button" aria-expanded={expanded} aria-label={expanded ? "收起子调用" : "展开子调用"} onClick={onToggle} className="grid size-5 shrink-0 place-items-center rounded text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground">
            <ChevronRight className={cn("size-3.5 transition-transform duration-200", expanded && "rotate-90")} />
          </button>
        ) : null}
        {row.label && <span className={cn("shrink-0 font-mono text-[12px]", row.kind === "agent" ? "font-sans font-medium text-foreground" : "text-foreground/85")}>{row.label}</span>}
        <span className={cn("min-w-0 truncate text-muted-foreground", row.live && "hx-shimmer-text")}>{row.text}</span>
        {st && <span className={cn("shrink-0 text-xs", st.cls)}>{st.label}</span>}
      </span>
      <span className="text-right text-xs text-muted-foreground tabular">{num(row.input)}</span>
      <span className="text-right text-xs text-muted-foreground tabular">{num(row.output)}</span>
      <span className="text-right text-xs text-muted-foreground tabular">{num(row.think)}</span>
      <span className={cn("text-right text-xs tabular", row.live ? "text-brand" : "text-muted-foreground")}>{dur}</span>
      <TimeBar row={row} t0={t0} span={span} />
    </div>
  );
}

/** 单列卡片式的一行 (手机): 第一行 序号 · 类型 · 名称 · 状态 …… 时长; 第二行 摘要 …… 入 / 出 token */
function ListRow({ row, index, depth, expanded, onToggle }: { row: TrajectoryRow; index: string; depth: number; expanded: boolean; onToggle?: () => void }) {
  const k = KIND[row.kind];
  const st = row.status ? STATUS_TEXT[row.status] : undefined;
  const dur = row.start != null && row.end != null && !row.live ? formatDuration(row.end - row.start) : row.live ? "进行中" : "";
  const tokens = [row.input ? `入 ${formatTokens(row.input)}` : "", row.output ? `出 ${formatTokens(row.output)}` : "", row.think ? `思 ${formatTokens(row.think)}` : ""].filter(Boolean).join(" · ");
  const head = (
    <>
      <span className="w-7 shrink-0 text-[11px] text-muted-foreground tabular">{index}</span>
      <span className={cn("inline-flex h-5 shrink-0 items-center rounded px-1.5 text-[11px] font-medium", k.cls)}>{k.label}</span>
      {row.label && <span className={cn("min-w-0 truncate text-[13px]", row.kind === "agent" ? "font-medium text-foreground" : "font-mono text-[12px] text-foreground/85")}>{row.label}</span>}
      {st && <span className={cn("shrink-0 text-xs", st.cls)}>{st.label}</span>}
      <span className={cn("ml-auto shrink-0 pl-2 text-[11px] tabular", row.live ? "text-brand" : "text-muted-foreground")}>{dur}</span>
    </>
  );
  return (
    <div data-slot="trajectory-row" data-kind={row.kind} data-live={row.live || undefined} className="flex min-w-0 flex-col gap-0.5 border-b px-3 py-2 last:border-b-0" style={{ paddingLeft: 12 + depth * INDENT }}>
      {onToggle ? (
        <button type="button" aria-expanded={expanded} aria-label={expanded ? "收起子调用" : "展开子调用"} onClick={onToggle} className="-mx-1 flex min-w-0 items-center gap-1.5 rounded px-1 text-left active:bg-accent">
          {head}
          <ChevronRight aria-hidden className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform duration-200", expanded && "rotate-90")} />
        </button>
      ) : (
        <span className="flex min-w-0 items-center gap-1.5">{head}</span>
      )}
      {(row.text || tokens) && (
        <span className="flex min-w-0 items-baseline gap-2 pl-[2.125rem] text-xs text-muted-foreground">
          <span className={cn("min-w-0 flex-1 truncate", row.live && "hx-shimmer-text")}>{row.text}</span>
          {tokens && <span className="shrink-0 text-[11px] tabular opacity-80">{tokens}</span>}
        </span>
      )}
    </div>
  );
}

function ListRows({ rows, prefix, depth, open, toggle }: { rows: readonly TrajectoryRow[]; prefix: string; depth: number; open: (id: string) => boolean; toggle: (id: string) => void }) {
  return (
    <>
      {rows.map((r, i) => {
        const index = prefix ? `${prefix}.${i + 1}` : String(i + 1);
        const kids = r.children ?? [];
        const expanded = kids.length > 0 && open(r.id);
        return (
          <React.Fragment key={r.id}>
            <ListRow row={r} index={index} depth={depth} expanded={expanded} onToggle={kids.length ? () => toggle(r.id) : undefined} />
            {expanded && <ListRows rows={kids} prefix={index} depth={depth + 1} open={open} toggle={toggle} />}
            {kids.length > 0 && !expanded && (
              <button type="button" onClick={() => toggle(r.id)} className="flex h-7 w-full items-center border-b text-left text-xs text-muted-foreground active:bg-accent" style={{ paddingLeft: 12 + 34 + (depth + 1) * INDENT }}>
                {kids.length} 个子调用{kids.some((k) => k.live) ? " · 进行中" : ""}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </>
  );
}

function Rows({ rows, prefix, depth, t0, span, open, toggle }: { rows: readonly TrajectoryRow[]; prefix: string; depth: number; t0: number; span: number; open: (id: string) => boolean; toggle: (id: string) => void }) {
  return (
    <>
      {rows.map((r, i) => {
        const index = prefix ? `${prefix}.${i + 1}` : String(i + 1);
        const kids = r.children ?? [];
        const expanded = kids.length > 0 && open(r.id);
        return (
          <React.Fragment key={r.id}>
            <Row row={r} index={index} depth={depth} t0={t0} span={span} expanded={expanded} onToggle={kids.length ? () => toggle(r.id) : undefined} />
            {kids.length > 0 &&
              (expanded ? (
                <Rows rows={kids} prefix={index} depth={depth + 1} t0={t0} span={span} open={open} toggle={toggle} />
              ) : (
                <button type="button" onClick={() => toggle(r.id)} className={cn(GRID, "h-6 w-full rounded-md px-2 text-left text-xs text-muted-foreground hover:bg-accent/50")}>
                  <span />
                  <span />
                  <span style={{ paddingLeft: (depth + 1) * INDENT }}>{kids.length} 个子调用{kids.some((k) => k.live) ? " · 进行中" : ""}</span>
                </button>
              ))}
          </React.Fragment>
        );
      })}
    </>
  );
}

function Turn({ turn, now, open, toggle, list }: { turn: TrajectoryTurn; now: number; open: (id: string) => boolean; toggle: (id: string) => void; list?: boolean }) {
  const t0 = turn.start ?? now;
  const t1 = turn.live ? Math.max(now, turn.end ?? now) : (turn.end ?? now);
  const span = Math.max(1, t1 - t0);
  if (list) {
    return (
      <section data-slot="trajectory-turn" aria-label={`第 ${turn.index} 轮`}>
        <div className="sticky top-0 z-10 flex h-8 items-center gap-2 border-b bg-background/95 px-3 text-xs text-muted-foreground backdrop-blur">
          <span className="font-medium text-foreground">第 {turn.index} 轮</span>
          <span className="tabular">{turn.live ? "进行中" : formatDuration(span)}</span>
          {turn.usage.cost != null && <span className="ml-auto tabular">${turn.usage.cost.toFixed(4)}</span>}
        </div>
        <ListRows rows={turn.rows} prefix="" depth={0} open={open} toggle={toggle} />
      </section>
    );
  }
  return (
    <section data-slot="trajectory-turn" aria-label={`第 ${turn.index} 轮`}>
      <div className={cn(GRID, "sticky top-0 z-10 h-8 border-y bg-background/95 px-2 text-xs text-muted-foreground backdrop-blur")}>
        <span className="col-span-3 flex items-center gap-2">
          <span className="font-medium text-foreground">第 {turn.index} 轮</span>
          <span className="tabular">{turn.live ? "进行中" : formatDuration(span)}</span>
          {turn.usage.cost != null && <span className="tabular">${turn.usage.cost.toFixed(4)}</span>}
        </span>
        <span className="text-right">输入</span>
        <span className="text-right">输出</span>
        <span className="text-right">思考</span>
        <span className="text-right">时长</span>
        <span>计时</span>
      </div>
      <div className="py-1">
        <Rows rows={turn.rows} prefix="" depth={0} t0={t0} span={span} open={open} toggle={toggle} />
      </div>
    </section>
  );
}

export function AgentTrajectory({ messages, agents, defaultExpanded = false, layout = "auto", className }: AgentTrajectoryProps) {
  const root = React.useRef<HTMLDivElement>(null);
  const [narrow, setNarrow] = React.useState(false);
  React.useLayoutEffect(() => {
    const el = root.current;
    if (layout !== "auto" || !el || typeof ResizeObserver === "undefined") return;
    const measure = (w: number) => setNarrow(w < TRAJECTORY_LIST_BELOW);
    measure(el.clientWidth);
    const ro = new ResizeObserver(([e]) => measure(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [layout]);
  const list = layout === "list" || (layout === "auto" && narrow);
  const live = messages.some((m) => m.status === "streaming");
  const now = useElapsed(0, undefined, live) || Date.now();
  const turns = React.useMemo(() => buildTrajectory(messages, agents, now), [messages, agents, now]);
  const [all, setAll] = React.useState(defaultExpanded);
  const [flip, setFlip] = React.useState<ReadonlySet<string>>(new Set());
  const open = React.useCallback((id: string) => all !== flip.has(id), [all, flip]);
  const toggle = React.useCallback((id: string) => setFlip((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    return n;
  }), []);
  return (
    <div ref={root} data-slot="agent-trajectory" data-layout={list ? "list" : "table"} className={cn("flex min-h-0 flex-col", className)}>
      <div className="flex items-center gap-2 border-b px-3 py-1.5 text-xs text-muted-foreground">
        <span>{turns.length} 轮</span>
        <span className={cn("flex items-center gap-1", list && "hidden")}>
          <span aria-hidden className="h-2 w-3 rounded-sm bg-muted-foreground/40" />等首 token
        </span>
        <span className={cn("flex items-center gap-1", list && "hidden")}>
          <span aria-hidden className="h-2 w-3 rounded-sm bg-brand/70" />生成 / 执行
        </span>
        <Button size="sm" variant="ghost" className="ml-auto h-7 text-xs" onClick={() => (setAll((a) => !a), setFlip(new Set()))}>
          {all ? "收起所有子调用" : "展开所有子调用"}
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto scrollbar-thin">
        <div className={cn(list ? "pb-4" : "min-w-[720px] px-2 pb-4")}>
          {turns.length ? turns.map((t) => <Turn key={t.index} turn={t} now={now} open={open} toggle={toggle} list={list} />) : <p className="py-10 text-center text-sm text-muted-foreground">还没有记录</p>}
        </div>
      </div>
    </div>
  );
}
