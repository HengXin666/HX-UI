import * as React from "react";
import "katex/dist/katex.min.css";
import { ArrowLeft, Bot, Braces, ChevronLeft, Cloud, FileCode2, FolderGit2, Gauge, Gem, GitBranch, Laptop, MessagesSquare, Pause, Play, RotateCcw, Rows3, Shield, ShieldAlert, ShieldCheck, Sparkles, SquareTerminal } from "lucide-react";
import {
  AgentContextView,
  AgentProvider,
  AgentStatusDot,
  AGENT_DONE,
  AGENT_WAITING,
  agentTail,
  ComposerActivity,
  ComposerMeters,
  ComposerModelMenu,
  ComposerSelect,
  ComposerSheet,
  ContextLeft,
  countAgents,
  flattenAgentTree,
  TailText,
  useSessionUsage,
  type ComposerOption,
  AgentSwitcher,
  AgentThread,
  AgentTrajectory,
  Conversation,
  IconButton,
  MessageList,
  OrchestraDock,
  PlanPanel,
  PromptInput,
  SessionMeter,
  SubagentConversation,
  useOrchestraDock,
  useSessionPlan,
  type ActivityMode,
  type AgentActions,
  type AgentClientOption,
  type AgentModelSelection,
  type CodeTheme,
  type OrchestraDockPosition,
  type OrchestraView,
  type PlanPlacement,
} from "@/agent";
import { mermaidFences } from "@/agent/fences/mermaid-entry";
import { math, mathFences } from "@/agent/fences/math-entry";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { APPROVAL_CALL, APPROVAL_HOLD, sessionScript } from "./session-script";
import { useReplay } from "./use-replay";

const FENCES = { ...mermaidFences, ...mathFences };

/** 权限 (Codex App 输入框里的权限控件, 名字按 developers.openai.com/codex/permission-modes) */
type Permission = "ask" | "auto" | "full";
const PERMISSIONS: ComposerOption<Permission>[] = [
  { value: "ask", label: "请求批准", description: "在工作区内自己做, 越界 (联网, 改工作区外的文件) 前先问你", icon: <Shield /> },
  { value: "auto", label: "替我批准", description: "越界的请求交给自动审查, 工作区边界不变", icon: <ShieldCheck /> },
  { value: "full", label: "完全访问", description: "不再询问, 可以联网和改任何文件", icon: <ShieldAlert /> },
];
/** 运行位置 (Codex App 输入框下方: Local / Worktree / Cloud) */
type Env = "local" | "worktree" | "cloud";
const ENVS: ComposerOption<Env>[] = [
  { value: "local", label: "本地", description: "在你的机器上, 直接改当前目录", icon: <Laptop /> },
  { value: "worktree", label: "工作树", description: "新建 git worktree, 改动与当前目录隔开", icon: <FolderGit2 /> },
  { value: "cloud", label: "云端", description: "在云端环境里跑, 关掉页面也继续", icon: <Cloud /> },
];
const COMMANDS = [
  { value: "review", description: "审查当前改动" },
  { value: "test", description: "跑相关测试" },
  { value: "compact", description: "压缩上下文" },
];
const FILES = ["src/utils/debounce.ts", "src/utils/throttle.ts", "src/editor/autosave.ts", "src/search/box.tsx"];
const WINDOW = 200_000;

/** 演示用的 Agent 客户端与模型 (名字与数据为虚构) */
const CLIENTS: AgentClientOption[] = [
  {
    id: "claude-code",
    name: "Claude Code",
    icon: <Sparkles />,
    description: "终端里的编码 Agent",
    models: [
      { id: "hx-opus", name: "hx-opus", description: "最强推理, 适合大改动与编排", efforts: ["off", "low", "medium", "high", "max"], defaultEffort: "high", contextWindow: 200_000 },
      { id: "hx-sonnet", name: "hx-sonnet", description: "均衡, 日常写代码", efforts: ["off", "low", "medium", "high"], contextWindow: 200_000, badge: "默认" },
      { id: "hx-haiku", name: "hx-haiku", description: "最快, 适合检索与小修", contextWindow: 200_000 },
    ],
  },
  {
    id: "codex",
    name: "Codex",
    icon: <SquareTerminal />,
    description: "本地 CLI",
    models: [
      { id: "hx-codex", name: "hx-codex", description: "为编码调过的推理模型", efforts: ["minimal", "low", "medium", "high", "xhigh"], defaultEffort: "medium", contextWindow: 400_000, badge: "新" },
      { id: "hx-codex-mini", name: "hx-codex-mini", description: "更便宜, 推理强度可调", efforts: ["low", "medium", "high"], contextWindow: 400_000 },
    ],
  },
  {
    id: "opencode",
    name: "OpenCode",
    icon: <Braces />,
    description: "开源, 可接任意模型",
    models: [
      { id: "hx-open-coder", name: "hx-open-coder", description: "开源权重的编码模型", contextWindow: 128_000 },
      { id: "hx-qwen-coder", name: "hx-qwen-coder", description: "长上下文, 思考可开关", efforts: ["off", "medium", "high"], contextWindow: 256_000 },
    ],
  },
  { id: "gemini", name: "Gemini CLI", icon: <Gem />, unavailable: "未登录", models: [{ id: "hx-gemini", name: "hx-gemini", efforts: ["low", "high"] }] },
];

export interface ConversationPageProps {
  speed?: number;
  mode?: ActivityMode;
  codeTheme?: CodeTheme;
  orchestraView?: OrchestraView;
  /** 整页打开时顶栏出 "返回文档" (文档页的 "全屏打开" 由文档外壳提供) */
  full?: boolean;
  onEvent?: (msg: string) => void;
}

type PageView = "chat" | "trajectory" | "context";

/** 页面宽度 (文档舞台可能比视口窄, 按容器量) */
function useWidth(ref: React.RefObject<HTMLElement | null>): number {
  const [w, setW] = React.useState(1200);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

/** 从左边缘右滑返回 (手机, DSH Go 的抽屉手势: 先看位移方向再认领, 竖向滚动不受影响) */
function useEdgeSwipeBack(ref: React.RefObject<HTMLElement | null>, onBack: (() => void) | undefined) {
  const cb = React.useRef(onBack);
  cb.current = onBack;
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let start: { x: number; y: number } | null = null;
    const down = (e: TouchEvent) => {
      const t = e.touches[0];
      const left = el.getBoundingClientRect().left;
      start = cb.current && t.clientX - left < EDGE ? { x: t.clientX, y: t.clientY } : null;
    };
    const up = (e: TouchEvent) => {
      if (!start) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.x;
      const dy = Math.abs(t.clientY - start.y);
      start = null;
      if (dx > SWIPE && dy < dx / 2) cb.current?.();
    };
    el.addEventListener("touchstart", down, { passive: true });
    el.addEventListener("touchend", up, { passive: true });
    return () => {
      el.removeEventListener("touchstart", down);
      el.removeEventListener("touchend", up);
    };
  }, [ref]);
}

/** 窄于这个宽度: 手机布局 (浮动胶囊顶栏, 底部弹层代替弹层与侧栏, 输入条空闲时收成一行) */
const NARROW = 768;
/** 宽于这个宽度才放得下计划侧栏 */
const WIDE = 1180;
/** 左边缘多宽内起手算 "返回" 手势, 右滑多远生效 (px) */
const EDGE = 28;
const SWIPE = 72;
/** 顶栏胶囊的样子 (手机): 浮在内容上, 44px 高够手指点 */
const PILL = "inline-flex h-10 min-w-0 shrink-0 items-center gap-1.5 rounded-full border bg-background/85 px-3 text-[13px] shadow-xs backdrop-blur transition-colors duration-150 active:bg-accent";

/**
 * 完整的对话页面 (文档站演示, 数据为虚构). 宽屏: 顶栏 (标题, 子 Agent 切换器, 对话 / 轨迹 / 上下文, 回放控制), 会话, Codex 式输入栏
 * (框里: + · 权限 …… 模型 强度 ⌄ · 发送; 框下: 本地 ⌄ …… 分支 · 上下文剩余), 生成中输入框上方一条 "工作中 (12 秒 · esc 中断)".
 * 手机 (DSH Go 式, 常用操作都在拇指区): 顶栏只有浮动胶囊 (标题 + 状态, 子 Agent 数), 点开都是底部弹层; 输入条空闲时一行, 聚焦展开出模型 / 权限;
 * 活动条点开看轨迹, 上下文环点开看用量; 子 Agent 会话从左边缘右滑返回. 文档页舞台与整页 (#/ui/conversation/full) 共用.
 */
export function ConversationPage({ speed = 1, mode = "grouped", codeTheme = "dark", orchestraView = "graph", full = false, onEvent }: ConversationPageProps) {
  const [playing, setPlaying] = React.useState(true);
  const replay = useReplay(sessionScript, { speed, playing });
  const [openAgent, setOpenAgent] = React.useState<string | null>(null);
  const [viewAgent, setViewAgent] = React.useState<string | null>(null);
  const [view, setView] = React.useState<PageView>("chat");
  const [sheet, setSheet] = React.useState<"session" | "agents" | "trajectory" | null>(null);
  const [model, setModel] = React.useState<AgentModelSelection>({ client: "claude-code", model: "hx-opus", effort: "high" });
  const root = React.useRef<HTMLDivElement>(null);
  const width = useWidth(root);
  const narrow = width < NARROW;
  const { release } = replay;
  const markdown = React.useMemo(() => ({ fences: FENCES, plugins: { math }, codeTheme }), [codeTheme]);
  const actions = React.useMemo<AgentActions>(
    () => ({
      onOpenFile: (p, l) => onEvent?.(`打开 ${p}${l ? `:${l}` : ""}`),
      onApprove: (id, scope) => {
        if (id === APPROVAL_CALL) release(APPROVAL_HOLD);
        onEvent?.(`${scope === "always" ? "总是允许" : "允许"} ${id}`);
      },
      onDeny: (id) => {
        // 演示不分叉剧本: 拒绝也继续往下放
        if (id === APPROVAL_CALL) release(APPROVAL_HOLD);
        onEvent?.(`拒绝 ${id}`);
      },
    }),
    [onEvent, release],
  );
  const restart = () => {
    replay.restart();
    setOpenAgent(null);
    setViewAgent(null);
    setPlaying(true);
  };
  const n = React.useRef(0);
  const send = (text: string) => {
    const id = `demo-${++n.current}`;
    replay.push([
      { type: "user-message", messageId: `${id}-u`, text },
      { type: "message-start", messageId: id, model: model.model },
      { type: "usage", messageId: id, scope: "request", usage: { inputTokens: 47_000, cachedInputTokens: 44_800, contextTokens: 47_000, contextWindow: WINDOW } },
    ]);
    const reply = `这是文档站的演示, 没有接模型 (选的是 ${model.model}${model.effort ? ` · 推理强度 ${model.effort}` : ""})。把 \`useAgentStream().push\` 接到你的事件流上, 这里就是真实的回答。`;
    let i = 0;
    const timer = window.setInterval(() => {
      if (i >= reply.length) {
        window.clearInterval(timer);
        replay.push({ type: "message-end", messageId: id });
        return;
      }
      replay.push([
        { type: "text-delta", messageId: id, partId: `${id}-t`, delta: reply.slice(i, i + 3) },
        { type: "usage-delta", messageId: id, outputTokens: 3 },
      ]);
      i += 3;
    }, 30);
  };
  const live = playing && !replay.done;
  const openFromGraph = React.useCallback((id: string | null) => setOpenAgent(id), []);
  // 手机: 返回一层 (子 Agent 会话 → 主对话; 轨迹 / 上下文 → 对话)
  const back = narrow && (viewAgent || view !== "chat") ? () => (viewAgent ? setViewAgent(null) : setView("chat")) : undefined;
  useEdgeSwipeBack(root, back);
  const switchAgent = (id: string | null) => {
    setViewAgent(id);
    setView("chat");
    if (id) setOpenAgent(null);
  };
  const stop = () => {
    setPlaying(false);
    const last = [...replay.messages].reverse().find((m) => m.status === "streaming");
    if (last) replay.push({ type: "message-end", messageId: last.id, status: "stopped" });
  };
  const replayKeys = (
    <>
      <IconButton label={live ? "暂停回放" : "继续回放"} onClick={() => setPlaying((p) => !p)} disabled={replay.done}>
        {live ? <Pause /> : <Play />}
      </IconButton>
      <IconButton label="重放" onClick={restart}>
        <RotateCcw />
      </IconButton>
    </>
  );
  return (
    <AgentProvider markdown={markdown} actions={actions} cwd="/repo" mode={mode} agents={replay.agents} messages={replay.messages} openAgentId={openAgent} onOpenAgent={openFromGraph} orchestraView={orchestraView}>
      <div ref={root} data-slot="conversation-page" data-narrow={narrow || undefined} className="relative flex h-full min-h-0 w-full overflow-hidden bg-background">
        <div className="relative flex min-w-0 flex-1 flex-col">
          {narrow ? (
            <PhoneHeader
              full={full}
              view={view}
              viewAgent={viewAgent}
              onBack={back}
              agents={replay.agents}
              messages={replay.messages}
              busy={replay.busy}
              onOpenSession={() => setSheet("session")}
              onOpenAgents={() => setSheet("agents")}
            />
          ) : (
            <header className="flex h-12 shrink-0 items-center gap-3 border-b px-3">
              <span className="flex min-w-0 shrink items-center gap-2">
                <Sparkles aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm font-medium">给 debounce 加 leading 选项</span>
              </span>
              <AgentSwitcher value={viewAgent} onValueChange={switchAgent} className="min-w-0 shrink" />
              <Tabs value={view} onValueChange={(v) => setView(v as PageView)} className="ml-auto shrink-0">
                <TabsList aria-label="视图" className="h-8">
                  <TabsTrigger value="chat" className="px-2.5 text-[13px]">
                    <MessagesSquare className="size-3.5" />
                    对话
                  </TabsTrigger>
                  <TabsTrigger value="trajectory" className="px-2.5 text-[13px]">
                    <Rows3 className="size-3.5" />
                    轨迹
                  </TabsTrigger>
                  <TabsTrigger value="context" className="px-2.5 text-[13px]">
                    <Gauge className="size-3.5" />
                    上下文
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <span className="flex shrink-0 items-center gap-0.5 text-muted-foreground">
                {replayKeys}
                <span aria-hidden className="relative ml-1 h-1 w-16 overflow-hidden rounded-full bg-muted lg:w-20">
                  <span className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-brand transition-transform duration-150" style={{ transform: `scaleX(${Math.min(1, replay.progress)})` }} />
                </span>
                {full && (
                  <a href="#/ui/conversation" className="ml-2 inline-flex h-7 shrink-0 items-center rounded-md px-2 text-xs whitespace-nowrap hover:bg-accent hover:text-foreground">
                    返回文档
                  </a>
                )}
              </span>
            </header>
          )}
          {view === "context" ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <AgentContextView agentId={viewAgent} onAgentChange={setViewAgent} contextWindow={WINDOW} className="min-h-0 flex-1" />
              <div className="border-t px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                <SessionMeter messages={replay.messages} agents={replay.agents} agentId={viewAgent ?? undefined} contextWindow={WINDOW} compact={narrow} />
              </div>
            </div>
          ) : view === "trajectory" ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <AgentTrajectory messages={replay.messages} agents={replay.agents} className="min-h-0 flex-1" />
              <div className="border-t px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                <SessionMeter messages={replay.messages} agents={replay.agents} contextWindow={WINDOW} compact={narrow} />
              </div>
            </div>
          ) : viewAgent ? (
            <SubagentConversation agentId={viewAgent} onBack={() => setViewAgent(null)} contextWindow={WINDOW} dock={<PlanPanel agentId={viewAgent} defaultCollapsed className="mb-2" />} />
          ) : (
            <MainChat
              narrow={narrow}
              wide={width >= WIDE}
              busy={replay.busy}
              messages={replay.messages}
              agents={replay.agents}
              model={model}
              onModel={setModel}
              onSend={send}
              onRetry={restart}
              onOpenContext={() => setView("context")}
              onOpenTrajectory={() => (narrow ? setSheet("trajectory") : setView("trajectory"))}
              onStop={stop}
            />
          )}
        </div>
        {openAgent && !narrow && (
          <AgentThread
            agentId={openAgent}
            variant="panel"
            onClose={() => setOpenAgent(null)}
            onExpand={() => switchAgent(openAgent)}
            className="absolute inset-y-0 right-0 z-20 w-[min(23rem,100%)] border-l shadow-float xl:static xl:shadow-none"
          />
        )}
      </div>
      {narrow && (
        <>
          {/* 子 Agent 的只读会话: 底部弹层 (下拉关闭), "在主视图打开" 切成整页 */}
          <Drawer open={!!openAgent} onOpenChange={(o) => !o && setOpenAgent(null)}>
            <DrawerContent className="h-[88dvh] max-h-[88dvh]! rounded-t-2xl">
              <DrawerTitle className="sr-only">子 Agent 会话</DrawerTitle>
              <DrawerDescription className="sr-only">只读, 下拉关闭</DrawerDescription>
              {openAgent && <AgentThread agentId={openAgent} variant="panel" onClose={() => setOpenAgent(null)} onExpand={() => switchAgent(openAgent)} className="min-h-0 flex-1" />}
            </DrawerContent>
          </Drawer>
          <ComposerSheet open={sheet === "trajectory"} onOpenChange={(o) => setSheet(o ? "trajectory" : null)} title="本轮轨迹" maxHeight="88dvh">
            <AgentTrajectory messages={replay.messages} agents={replay.agents} layout="list" className="h-[70dvh]" />
          </ComposerSheet>
          <ComposerSheet open={sheet === "agents"} onOpenChange={(o) => setSheet(o ? "agents" : null)} title="子 Agent" description="点一个切到它的会话; 从左边缘右滑回来">
            <AgentSheetList agents={replay.agents} messages={replay.messages} current={viewAgent} onPick={(id) => (switchAgent(id), setSheet(null))} />
          </ComposerSheet>
          <ComposerSheet open={sheet === "session"} onOpenChange={(o) => setSheet(o ? "session" : null)} title="给 debounce 加 leading 选项">
            <div className="grid gap-1 px-2">
              {(
                [
                  ["chat", "对话", <MessagesSquare key="c" />],
                  ["trajectory", "轨迹", <Rows3 key="t" />],
                  ["context", "上下文", <Gauge key="x" />],
                ] as const
              ).map(([v, label, icon]) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => (setView(v), setSheet(null))}
                  className={cn("flex h-12 items-center gap-3 rounded-xl px-3 text-[15px] active:bg-accent [&_svg]:size-4 [&_svg]:text-muted-foreground", view === v && "bg-accent font-medium")}
                >
                  {icon}
                  {label}
                </button>
              ))}
              <div className="mt-2 flex items-center gap-2 border-t px-3 pt-3 text-sm text-muted-foreground">
                演示回放
                <span className="ml-auto flex items-center gap-1">{replayKeys}</span>
              </div>
              {full && (
                <a href="#/ui/conversation" className="flex h-12 items-center gap-3 rounded-xl px-3 text-[15px] active:bg-accent">
                  <ArrowLeft className="size-4 text-muted-foreground" />
                  返回文档
                </a>
              )}
            </div>
          </ComposerSheet>
        </>
      )}
    </AgentProvider>
  );
}

interface PhoneHeaderProps {
  full: boolean;
  view: PageView;
  viewAgent: string | null;
  onBack?: () => void;
  agents: ReturnType<typeof useReplay>["agents"];
  messages: ReturnType<typeof useReplay>["messages"];
  busy: boolean;
  onOpenSession: () => void;
  onOpenAgents: () => void;
}

const VIEW_LABEL: Record<PageView, string> = { chat: "对话", trajectory: "轨迹", context: "上下文" };

/**
 * 手机顶栏 (DSH Go): 没有整条色带, 只有浮动胶囊. 左: 返回 (子 Agent / 轨迹 / 上下文时) 或文档返回; 标题胶囊 (第二行是状态: 点 + 一句话),
 * 点开是会话弹层 (视图 / 回放); 右: 子 Agent 胶囊 (图标 + 数量, 有在跑的就呼吸), 点开是子 Agent 弹层.
 */
function PhoneHeader({ full, view, viewAgent, onBack, agents, messages, busy, onOpenSession, onOpenAgents }: PhoneHeaderProps) {
  const c = countAgents(agents);
  const sub = Math.max(0, c.total - (agents.order.length ? 1 : 0));
  const node = viewAgent ? agents.nodes[viewAgent] : undefined;
  const waiting = agents.order.some((id) => AGENT_WAITING.has(agents.nodes[id].status));
  const status = waiting ? "等你批准" : busy ? "生成中" : messages.length ? "已完成" : "就绪";
  const tone = waiting ? "bg-warning" : busy ? "bg-brand" : "bg-success";
  const title = node ? node.name : view !== "chat" ? VIEW_LABEL[view] : "给 debounce 加 leading 选项";
  return (
    <header className="relative z-30 flex h-14 shrink-0 items-center gap-1.5 px-2">
      {onBack ? (
        <button type="button" onClick={onBack} aria-label={node ? "回到主对话" : "回到对话"} className={cn(PILL, "w-10 justify-center px-0")}>
          <ChevronLeft className="size-5" />
        </button>
      ) : (
        full && (
          <a href="#/ui/conversation" aria-label="返回文档" className={cn(PILL, "w-10 justify-center px-0")}>
            <ArrowLeft className="size-4" />
          </a>
        )
      )}
      <button type="button" onClick={onOpenSession} aria-label={`${title}, ${status}`} className={cn(PILL, "min-w-0 shrink flex-col items-start justify-center gap-0 py-1 leading-tight")}>
        <span className="max-w-full truncate font-medium">{title}</span>
        <span className="flex max-w-full items-center gap-1 truncate text-[11px] text-muted-foreground">
          <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", node ? (AGENT_DONE.has(node.status) ? "bg-success" : "bg-brand") : tone)} />
          {node ? `子 Agent · ${node.model ?? node.role ?? ""}` : status}
        </span>
      </button>
      {sub > 0 && (
        <button type="button" onClick={onOpenAgents} aria-label={`${sub} 个子 Agent${c.running ? `, ${c.running} 个在跑` : ""}`} className={cn(PILL, "ml-auto")}>
          <span className="relative">
            <Bot className="size-4" />
            {c.running > 0 && <span aria-hidden className="absolute -top-0.5 -right-0.5 size-1.5 animate-pulse rounded-full bg-brand" />}
          </span>
          <span className="tabular">{sub}</span>
        </button>
      )}
    </header>
  );
}

/** 子 Agent 弹层里的列表: 每行 56px, 状态点 + 名字 + 实时尾部 (在跑时) / 模型, 行尾是用时 */
function AgentSheetList({ agents, messages, current, onPick }: { agents: ReturnType<typeof useReplay>["agents"]; messages: ReturnType<typeof useReplay>["messages"]; current: string | null; onPick: (id: string | null) => void }) {
  const rows = flattenAgentTree(agents);
  return (
    <ul className="grid">
      {rows.map(({ node, depth }) => {
        const id = node.parentId ? node.id : null;
        const on = (current ?? null) === id;
        const running = !AGENT_DONE.has(node.status) && node.status !== "queued";
        return (
          <li key={node.id}>
            <button type="button" aria-current={on || undefined} onClick={() => onPick(id)} className={cn("flex min-h-14 w-full min-w-0 items-center gap-3 px-4 py-2 text-left active:bg-accent", on && "bg-accent/60")} style={{ paddingLeft: 16 + depth * 14 }}>
              <AgentStatusDot node={node} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[15px]">{id ? node.name : `${node.name} · 主对话`}</span>
                {running && id ? <TailText tail={agentTail(messages, agents, node.id, 120)} lines={1} surface={on ? "bg-accent" : "bg-background"} className="text-xs text-muted-foreground" /> : <span className="truncate text-xs text-muted-foreground">{node.model ?? node.role}</span>}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

interface MainChatProps {
  narrow: boolean;
  wide: boolean;
  busy: boolean;
  messages: ReturnType<typeof useReplay>["messages"];
  agents: ReturnType<typeof useReplay>["agents"];
  model: AgentModelSelection;
  onModel: (m: AgentModelSelection) => void;
  onSend: (text: string) => void;
  onStop: () => void;
  onRetry: () => void;
  onOpenContext: () => void;
  onOpenTrajectory: () => void;
}

/** 主 Agent 的会话区: 在 AgentProvider 里面, 才能读弹出的编排面板 / 会话计划 */
function MainChat({ narrow, wide, busy, messages, agents, model, onModel, onSend, onStop, onRetry, onOpenContext, onOpenTrajectory }: MainChatProps) {
  const dock = useOrchestraDock();
  const plan = useSessionPlan();
  const [placement, setPlacement] = React.useState<PlanPlacement>("dock");
  const [dockAt, setDockAt] = React.useState<OrchestraDockPosition>("corner");
  const [permission, setPermission] = React.useState<Permission>("ask");
  const [env, setEnv] = React.useState<Env>("local");
  const side = placement === "side" && wide;
  const roomForDock = !!dock.docked && !dock.ui.collapsed && dockAt === "side" && !narrow;
  const lead = agents.order[0] ? agents.nodes[agents.order[0]] : undefined;
  const room = roomForDock && "lg:max-w-[calc(48rem+28rem)] lg:pr-[28rem]";
  const planLive = !!lead && lead.status === "running";
  const u = useSessionUsage(messages, { agents, contextWindow: WINDOW });
  const tail = lead && busy ? agentTail(messages, agents, lead.id, 60) : undefined;
  const activity = tail ? (tail.label ?? (tail.cut ? `…${tail.text}` : tail.text)) : undefined;
  return (
    <div className="flex min-h-0 flex-1">
      <Conversation
        className="min-h-0 min-w-0 flex-1"
        contentClassName={cn(room)}
        overlay={<OrchestraDock position={narrow ? "corner" : dockAt} onPositionChange={setDockAt} className={cn(roomForDock && "lg:bottom-3")} />}
        footer={
          <div className={cn("mx-auto w-full max-w-3xl px-3 sm:px-4", narrow ? "pb-[max(0.5rem,env(safe-area-inset-bottom))]" : "pb-3", room)}>
            {!side && plan.items.length > 0 && <PlanPanel placement="dock" defaultCollapsed onPlacementChange={narrow || !wide ? undefined : setPlacement} live={planLive} className="mb-1.5" />}
            {/* 分工: 上方状态条只说 "在做什么 + 本轮走了几秒", 速率 / token / 命中 / 费用都在框下那一行, 同一个数不出现两次 */}
            {busy && <ComposerActivity startedAt={u.turn.startedAt} activity={activity} escHint={!narrow} onOpen={onOpenTrajectory} className="mb-1" />}
            <PromptInput
              busy={busy}
              onStop={onStop}
              onSubmit={(text) => onSend(text)}
              commands={COMMANDS}
              mentions={(q) => FILES.filter((f) => f.includes(q)).map((f) => ({ value: f, icon: <FileCode2 /> }))}
              collapsible={narrow}
              toolbar={
                narrow ? (
                  <>
                    <ComposerModelMenu clients={CLIENTS} value={model} onValueChange={onModel} sheet />
                    <ComposerSelect label="权限" options={PERMISSIONS} value={permission} onValueChange={setPermission} sheet iconOnly />
                  </>
                ) : (
                  <ComposerSelect label="权限" options={PERMISSIONS} value={permission} onValueChange={setPermission} />
                )
              }
              status={narrow ? undefined : <ComposerModelMenu clients={CLIENTS} value={model} onValueChange={onModel} />}
            />
            {/* 框下一行: Codex 的 本地 ⌄ · ⑂ main, DSH 的指标 (tok/s · 路数 · 累计 · 命中 · 本轮 · 费用), 竖线后是实时上下文 (环 + 上下文 68% · 13.6万 / 20万); 手机留 tok/s · 累计 · 命中 | 上下文环 + 百分比 */}
            {narrow ? (
              <div data-slot="composer-footer" className="flex min-w-0 items-center gap-1 px-1 pt-1">
                <ComposerMeters messages={messages} agents={agents} contextWindow={WINDOW} onOpenContext={onOpenContext} sheet compact className="-ml-1" />
                {/* 竖线隔开: 左边是累计 (只增), 右边是实时上下文 (会回落) */}
                <span aria-hidden className="ml-auto h-3.5 w-px shrink-0 bg-border" />
                <ContextLeft messages={messages} agents={agents} contextWindow={WINDOW} onOpenContext={onOpenContext} sheet compact />
              </div>
            ) : (
              <div data-slot="composer-footer" className="flex min-w-0 items-center gap-1 px-1 pt-1">
                <ComposerSelect label="运行位置" options={ENVS} value={env} onValueChange={setEnv} side="top" />
                <span className="inline-flex h-7 shrink-0 items-center gap-1 px-1.5 text-[13px] text-muted-foreground [&_svg]:size-3.5">
                  <GitBranch />
                  main
                </span>
                <ComposerMeters messages={messages} agents={agents} contextWindow={WINDOW} onOpenContext={onOpenContext} turnTime={!busy} className="ml-auto" />
                <span aria-hidden className="h-3.5 w-px shrink-0 bg-border" />
                <ContextLeft messages={messages} agents={agents} contextWindow={WINDOW} onOpenContext={onOpenContext} />
              </div>
            )}
          </div>
        }
      >
        <MessageList messages={messages} onRetry={onRetry} empty={<div className="flex flex-col items-center gap-2 py-20 text-sm text-muted-foreground"><Bot className="size-5" />按「重放」开始</div>} />
      </Conversation>
      {side && (
        <div className="w-72 shrink-0 border-l">
          <PlanPanel placement="side" onPlacementChange={setPlacement} live={planLive} />
        </div>
      )}
    </div>
  );
}
