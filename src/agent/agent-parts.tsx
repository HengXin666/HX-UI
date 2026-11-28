"use client";
/**
 * 一条助手消息的正文 + 过程: 正文走流式 Markdown, 连续的思考 / 工具调用折成活动分组 (ActivityGroup).
 * 分组规则对标 DSH: 正文与需要用户处理的调用断开分组; 运行中的分组标题是正在进行的那一类 ("正在运行命令 · npm test"),
 * 结束后是 "已处理 8 秒 · 运行了 3 条命令, 修改了 2 个文件"; 展开体限高 min(400px, 50vh), 运行中贴底跟随.
 * 多 Agent: AgentProvider 给了 agents 时, 这条消息派出的子 Agent 在派发的位置渲染成一个编排块 (AgentOrchestraBlock),
 * 子 Agent 自己的 part 不在主线程里重复显示 (在编排块与子 Agent 轨迹里看).
 *
 *   <AgentProvider toolViews={...} actions={{ onApprove, onAnswer, onOpenFile }} agents={agents} messages={messages} onOpenAgent={setOpen}>
 *     <AgentParts parts={message.parts} streaming={message.status === "streaming"} messageId={message.id} />
 *   </AgentProvider>
 */
import * as React from "react";
import { AlertTriangle, Info, Layers, OctagonX, Paperclip, RefreshCw, Shrink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Markdown } from "./markdown/markdown";
import { dispatchedAgents, isSubAgent, type AgentTree } from "./model/agents";
import { activitySpan, segmentParts, type Segment } from "./model/group";
import { ANALYZING, RUNNING_PHRASE, summarizeActivity } from "./model/summary";
import { TOOL_DONE, type AgentMessage, type AgentPart, type NoticeKind } from "./model/types";
import type { OrchestraView } from "./orchestra/constants";
import { AgentOrchestraBlock } from "./orchestra/orchestra-block";
import { AgentSessionProvider, useAgentSession, usePlanIndex } from "./orchestra/session-context";
import { isTodoCall } from "./model/todos";
import { isRepeatPlanCall } from "./model/plan-index";
import { Disclosure } from "./parts/disclosure";
import { useElapsed } from "./parts/elapsed";
import { formatBytes, formatDuration } from "./parts/format";
import { Reasoning } from "./reasoning";
import { AgentUIContext, useAgentUI, type ActivityMode, type AgentActions, type AgentMarkdownDefaults, type AgentUIConfig, type PlanCallDisplay, type ToolViews } from "./tool/context";
import { ToolCall } from "./tool/tool-call";
import { defaultToolViews, resolveToolView } from "./tool/views";

/* ---------------- Provider ---------------- */

export interface AgentProviderProps {
  /** 追加或覆盖工具视图 (按工具名) */
  toolViews?: ToolViews;
  actions?: AgentActions;
  /** 工作目录: 路径显示时去掉这个前缀 */
  cwd?: string;
  markdown?: AgentMarkdownDefaults;
  mode?: ActivityMode;
  /** 多 Agent: Agent 父子树 (useAgentStream().agents). 给了才会在会话里渲染编排块 */
  agents?: AgentTree;
  /** 全部消息 (含子 Agent 自己的), 编排块的泳道 / 卡片与子 Agent 轨迹从这里取 */
  messages?: readonly AgentMessage[];
  /** 打开着的子 Agent */
  openAgentId?: string | null;
  /** 点编排块里的子 Agent (打开侧栏里的 AgentThread); 不给就只在块内选中 */
  onOpenAgent?: (id: string | null) => void;
  /** 编排块的默认视图, 默认关系图 */
  orchestraView?: OrchestraView;
  /** 对话里的待办调用: line (默认, 一行变更摘要, 完整计划看 PlanPanel) / card (没放 PlanPanel 时回退成内联计划卡) */
  planCalls?: PlanCallDisplay;
  children: React.ReactNode;
}

export function AgentProvider({ toolViews, actions, cwd, markdown, mode = "grouped", agents, messages, openAgentId, onOpenAgent, orchestraView, planCalls = "hidden", children }: AgentProviderProps) {
  const views = React.useMemo(() => ({ ...defaultToolViews, ...toolViews }), [toolViews]);
  const value = React.useMemo<AgentUIConfig>(
    () => ({ toolViews: views, actions: actions ?? {}, cwd, markdown, mode, planCalls, renderParts: (parts, o) => <AgentParts parts={parts} streaming={o.streaming} nested /> }),
    [views, actions, cwd, markdown, mode, planCalls],
  );
  return (
    <AgentUIContext.Provider value={value}>
      <AgentSessionProvider agents={agents} messages={messages} openAgentId={openAgentId} onOpenAgent={onOpenAgent} orchestraView={orchestraView}>
        {children}
      </AgentSessionProvider>
    </AgentUIContext.Provider>
  );
}

/* ---------------- 提示行 ---------------- */

const NOTICE_ICON: Record<NoticeKind, React.ReactNode> = {
  info: <Info />,
  retry: <RefreshCw />,
  compaction: <Shrink />,
  error: <AlertTriangle />,
  stopped: <OctagonX />,
};

export function Notice({ kind, text, detail }: { kind: NoticeKind; text: string; detail?: string }) {
  if (kind === "error") {
    return (
      <div data-slot="notice" data-kind={kind} role="alert" className="my-2 flex gap-2.5 rounded-lg border border-destructive/30 bg-destructive/6 px-3 py-2.5 text-[13px]">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
        <div className="min-w-0">
          <div className="font-medium text-destructive">{text}</div>
          {detail && <div className="mt-0.5 whitespace-pre-wrap break-words font-mono text-xs text-muted-foreground">{detail}</div>}
        </div>
      </div>
    );
  }
  return <Disclosure data-slot="notice" icon={NOTICE_ICON[kind]} title={text} summary={detail} expandable={false} tone={kind === "stopped" ? "warning" : "default"} />;
}

/* ---------------- 活动分组 ---------------- */

export interface ActivityGroupProps {
  parts: AgentPart[];
  /** 还在生成: 分组保持展开 */
  streaming?: boolean;
  defaultOpen?: boolean;
  className?: string;
}

/** 展开的分组体: 限高, 内容长高时如果停在底部就跟到底 (运行中打开从底部开始, 结束后打开从顶部开始) */
function FollowBody({ live, children }: { live: boolean; children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inner = React.useRef<HTMLDivElement>(null);
  const stick = React.useRef(live);
  React.useLayoutEffect(() => {
    const el = ref.current;
    const content = inner.current;
    if (!el || !content) return;
    if (stick.current) el.scrollTop = el.scrollHeight;
    const onScroll = () => (stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24);
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => stick.current && (el.scrollTop = el.scrollHeight));
    ro?.observe(content);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      ro?.disconnect();
      el.removeEventListener("scroll", onScroll);
    };
  }, []);
  return (
    <div ref={ref} data-slot="activity-body" className="max-h-[min(400px,50vh)] overflow-y-auto overscroll-auto scrollbar-thin">
      <div ref={inner} className="flex flex-col">
        {children}
      </div>
    </div>
  );
}

/**
 * 一段连续的思考 / 工具调用. 运行中展开并计时, 标题是正在进行的那一类 + 它的参数 ("正在运行命令 · npm test"),
 * 没有在跑的工具时 "正在分析"; 结束收成 "已处理 8 秒 · 运行了 2 条命令, 修改了 3 个文件".
 */
export const ActivityGroup = React.memo(function ActivityGroup({ parts, streaming = false, defaultOpen, className }: ActivityGroupProps) {
  const { toolViews } = useAgentUI();
  const span = activitySpan(parts);
  const live = span.live || streaming;
  const ms = useElapsed(span.start, span.end, live);
  const [touched, setTouched] = React.useState<boolean | null>(null);
  const open = touched ?? defaultOpen ?? live;
  const tools = parts.flatMap((p) => (p.type === "tool" ? [p.call] : []));
  const kinds = tools.map((c) => resolveToolView(c.name, toolViews).kind ?? "other");
  const failed = tools.filter((c) => c.status === "error").length;
  const thoughts = parts.filter((p) => p.type === "reasoning").length;
  const running = live ? tools.filter((c) => !TOOL_DONE.has(c.status)).at(-1) : undefined;
  const runningView = running ? resolveToolView(running.name, toolViews) : undefined;
  const title = running ? RUNNING_PHRASE[runningView?.kind ?? "other"] : live ? ANALYZING : span.start != null && span.end != null ? `已处理 ${formatDuration(span.end - span.start)}` : tools.length ? "工具调用" : "思考过程";
  const summary = running && runningView?.summary ? runningView.summary(running) : summarizeActivity(kinds, { reasoning: thoughts });
  return (
    <Disclosure
      data-slot="activity"
      icon={<Layers />}
      title={title}
      summary={summary}
      suffix={
        <>
          {failed > 0 && <span className="text-destructive">{failed} 个失败</span>}
          {live && span.start != null && <span>{formatDuration(ms)}</span>}
        </>
      }
      running={live}
      open={open}
      onOpenChange={setTouched}
      className={className}
    >
      <FollowBody live={live}>{parts.map((p) => <PartView key={p.id} part={p} />)}</FollowBody>
    </Disclosure>
  );
});

/* ---------------- 单个 part ---------------- */

const PartView = React.memo(function PartView({ part }: { part: AgentPart }) {
  const { markdown } = useAgentUI();
  switch (part.type) {
    case "text":
      return <Markdown streaming={part.streaming} {...markdown}>{part.text}</Markdown>;
    case "reasoning":
      return <Reasoning text={part.text} streaming={part.streaming} startedAt={part.startedAt} endedAt={part.endedAt} markdown={markdown} />;
    case "tool":
      return <ToolCall call={part.call} />;
    case "notice":
      return <Notice kind={part.kind} text={part.text} detail={part.detail} />;
    case "file":
      return (
        <a href={part.url} target="_blank" rel="noopener noreferrer" className="my-1 inline-flex max-w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-[13px] hover:bg-accent/60">
          <Paperclip className="size-3.5 text-muted-foreground" />
          <span className="truncate">{part.name}</span>
          {part.size != null && <span className="text-xs text-muted-foreground">{formatBytes(part.size)}</span>}
        </a>
      );
  }
});

/* ---------------- 整条消息的 parts ---------------- */

export interface AgentPartsProps {
  parts: AgentPart[];
  /** 消息还在生成 */
  streaming?: boolean;
  /** 覆盖 Provider 的显示模式 */
  mode?: ActivityMode;
  /** 子 Agent 里嵌套时更紧凑 */
  nested?: boolean;
  /** 所在消息的 id: 给了才会找这条消息派出的子 Agent, 在派发处渲染编排块 */
  messageId?: string;
  /** 这些 part 属于哪个 Agent (消息的 agentId); 别的子 Agent 的 part 不在这里显示 */
  ownerAgentId?: string;
  /** 整轮折起: 只留正文, 文件, 编排块, 等你处理的调用与错误 (DSH 的完成轮次折叠) */
  folded?: boolean;
  className?: string;
}

function visibleInMode(p: AgentPart, mode: ActivityMode): boolean {
  if (mode === "zen") return p.type === "text" || p.type === "file" || (p.type === "notice" && p.kind === "error") || (p.type === "tool" && (p.call.status === "error" || p.call.status === "awaiting-approval"));
  if (mode === "hide-success") return !(p.type === "tool" && p.call.status === "success") && p.type !== "reasoning";
  return true;
}

type View = Segment | { type: "orchestra"; id: string; agentIds: string[] };

/** 这条消息派出的子 Agent 与派发调用的位置 (第一个派发调用; 没有调用就放在最后一段正文之前) */
function useDispatch(parts: readonly AgentPart[], messageId: string | undefined, tree: AgentTree) {
  return React.useMemo(() => {
    if (!messageId || !tree.order.length) return null;
    const callIds = parts.flatMap((p) => (p.type === "tool" ? [p.id] : []));
    const ids = dispatchedAgents(tree, messageId, callIds).map((n) => n.id);
    if (!ids.length) return null;
    const anchors = new Set(ids.map((id) => tree.nodes[id].callId).filter((c): c is string => !!c));
    return { ids, anchors };
  }, [parts, messageId, tree]);
}

export const AgentParts = React.memo(function AgentParts({ parts, streaming = false, mode: modeProp, nested, messageId, ownerAgentId, folded = false, className }: AgentPartsProps) {
  const ui = useAgentUI();
  const { agents } = useAgentSession();
  const mode = modeProp ?? ui.mode ?? "grouped";
  const planMode = ui.planCalls ?? "hidden";
  const planIndex = usePlanIndex();
  const dispatch = useDispatch(parts, messageId, agents);
  const views = React.useMemo<View[]>(() => {
    // 别的子 Agent 的 part (带 agentId) 不在这里重复
    const own = agents.order.length ? parts.filter((p) => !p.agentId || p.agentId === ownerAgentId || !isSubAgent(agents, p.agentId)) : parts;
    const pinned = (p: AgentPart) => p.type === "tool" && (p.call.status === "awaiting-approval" || !!resolveToolView(p.call.name, ui.toolViews).pinned?.(p.call));
    // planCalls="hidden": 计划的后续更新不进对话 (完整计划在 PlanPanel), 只留每份计划第一次列出的那次调用
    const planHidden = (p: AgentPart) => {
      if (planMode !== "hidden" || p.type !== "tool" || !isTodoCall(p.call)) return false;
      return isRepeatPlanCall(planIndex, p.id);
    };
    const keep = (p: AgentPart) => !planHidden(p) && (folded ? p.type === "text" || p.type === "file" || pinned(p) || (p.type === "notice" && p.kind === "error") : true);
    const segment = (list: AgentPart[]): Segment[] => {
      const shown = (mode === "grouped" || mode === "flat" ? list : list.filter((p) => visibleInMode(p, mode) || pinned(p))).filter(keep);
      if (mode !== "grouped") return shown.map((part) => ({ type: "part", part }));
      return segmentParts(shown, pinned);
    };
    if (!dispatch) return segment(own);
    // 编排块放在第一个派发调用处, 派发调用本身由块代替
    let at = own.findIndex((p) => dispatch.anchors.has(p.id));
    const rest = own.filter((p) => !dispatch.anchors.has(p.id));
    if (at < 0) {
      const lastText = rest.map((p) => p.type).lastIndexOf("text");
      at = lastText < 0 ? rest.length : lastText;
    } else {
      at = own.slice(0, at).filter((p) => !dispatch.anchors.has(p.id)).length;
    }
    return [...segment(rest.slice(0, at)), { type: "orchestra", id: `orch:${messageId}`, agentIds: dispatch.ids }, ...segment(rest.slice(at))];
  }, [parts, mode, ui.toolViews, agents, ownerAgentId, folded, dispatch, messageId, planMode, planIndex]);
  const last = views.length - 1;
  return (
    <div data-slot="agent-parts" className={cn("flex min-w-0 flex-col", nested ? "gap-0.5" : "gap-1", className)}>
      {views.map((s, i) => {
        if (s.type === "orchestra") return <AgentOrchestraBlock key={s.id} agentIds={s.agentIds} rootId={ownerAgentId} />;
        if (s.type === "part") return <PartView key={s.part.id} part={s.part} />;
        if (s.parts.length === 1) return <PartView key={s.parts[0].id} part={s.parts[0]} />;
        return <ActivityGroup key={s.id} parts={s.parts} streaming={streaming && i === last} />;
      })}
    </div>
  );
});
