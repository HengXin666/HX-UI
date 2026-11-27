"use client";
/**
 * 实时上下文 / 用量条 (对标 DSH 输入框下方的 composer dock: 上下文环 + 速率 + 用量 胶囊, 点开看明细):
 *   [◔ 上下文 21%]  [⏲ 64 tok/s · 3 路]  [▤ 125k tokens · 命中 68%]  [本轮 12 秒 · $0.021]
 * 每个胶囊是一个弹层按钮, 数字等宽, 生成中每 250ms 刷新 (所有计时共用一个定时器), 不生成时停住.
 * 每轮的用量胶囊 (TurnUsage) 挂在助手消息的操作条上, 点开是这一轮的提示 / 缓存 / 输出 / 首 token / 吞吐 / 费用.
 */
import * as React from "react";
import { ArrowRight, Database, Gauge, Timer } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ContextBar } from "./context-view";
import { ComposerSheet } from "./composer";
import { CONTEXT_CATEGORIES, CONTEXT_LABEL, contextBreakdown } from "./model/context";
import { cn } from "@/lib/utils";
import { isSubAgent, type AgentTree } from "./model/agents";
import type { AgentMessage } from "./model/types";
import { agentTokenRates, cacheHitRate, contextRatio, formatCost, formatPercent, formatRate, messageTiming, sessionUsage, usageLabels, type SessionUsage } from "./model/usage";
import { useElapsed } from "./parts/elapsed";
import { formatDuration, formatTokens } from "./parts/format";

/** 上下文占用到这里变黄 / 变红 */
const WARN_AT = 0.7;
const DANGER_AT = 0.9;
const RING = 14;

const exact = (n: number) => n.toLocaleString("zh-CN");

export interface UseSessionUsageOptions {
  /** 给了就按树区分主线程 / 子 Agent (上下文只看主线程) */
  agents?: AgentTree;
  /** 只看这个 Agent: 用量取它自己的消息, 速率取它自己的 (含嵌在派发调用里的时间线) */
  agentId?: string;
  /** 消息里没报上下文窗口时用 */
  contextWindow?: number;
}

/** 整段会话的实时用量; 有消息在生成时每 250ms 重新算一次 (速率随滑动窗口变化) */
export function useSessionUsage(messages: readonly AgentMessage[], opts: UseSessionUsageOptions = {}): SessionUsage {
  const { agents, contextWindow, agentId } = opts;
  const own = React.useMemo(() => (agentId === undefined ? messages : messages.filter((m) => m.agentId === agentId)), [messages, agentId]);
  const node = agentId && agents ? agents.nodes[agentId] : undefined;
  const live = messages.some((m) => m.status === "streaming");
  const now = useElapsed(0, undefined, live) || Date.now();
  if (agentId === undefined) {
    const isMain = agents ? (m: AgentMessage) => !isSubAgent(agents, m.agentId) : undefined;
    return sessionUsage(messages, now, { isMain, contextWindow });
  }
  // 单个 Agent: 用量看它自己的消息, 速率按归属 (它的消息 + 嵌在派发调用里的时间线)
  const u = sessionUsage(own, now, { isMain: () => true, contextWindow });
  const rate = agentTokenRates(messages, agents, now).get(agentId) ?? 0;
  const running = node ? node.status === "running" : u.live;
  return { ...u, tokensPerSecond: rate, streams: rate > 0 || running ? 1 : 0, live: u.live || (rate > 0 && running) };
}

const toneOf = (ratio: number) => (ratio >= DANGER_AT ? "var(--destructive)" : ratio >= WARN_AT ? "var(--warning)" : "var(--brand)");

/** 占用环 (14px, 1.5px 线宽的轨道 + 弧) */
export function MeterRing({ ratio, size = RING, className }: { ratio: number; size?: number; className?: string }) {
  const r = size / 2 - 1.5;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden className={cn("-rotate-90 shrink-0", className)}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={1.5} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={toneOf(ratio)} strokeWidth={1.5} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - ratio)} className="transition-[stroke-dashoffset] duration-500" />
    </svg>
  );
}

function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <p className="mb-1.5 flex items-baseline gap-2 text-xs font-medium text-foreground">
      {children}
      {hint && <span className="truncate font-normal text-muted-foreground">{hint}</span>}
    </p>
  );
}

function Rows({ rows }: { rows: [string, React.ReactNode, boolean?][] }) {
  return (
    <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1.5 text-[13px]">
      {rows.map(([k, v, strong]) => (
        <React.Fragment key={k}>
          <dt className="text-muted-foreground">{k}</dt>
          <dd className={cn("text-right tabular", strong && "font-medium text-foreground")}>{v}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

const PILL = "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground tabular transition-colors duration-150 hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring data-[state=open]:bg-accent data-[state=open]:text-foreground [&_svg:not([class*='size-'])]:size-3.5";

function MeterPill({ meter, label, icon, children, title }: { meter: string; label: React.ReactNode; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" data-meter={meter} aria-label={title} className={PILL}>
          {icon}
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" aria-label={title} className="w-64 p-3">
        <div className="mb-2 flex items-center gap-1.5 text-[13px] font-medium">
          {icon}
          {title}
        </div>
        {children}
      </PopoverContent>
    </Popover>
  );
}

/** 上下文弹层里的小构成条 + 三大类 */
function ContextMini({ messages, agents, agentId, contextWindow }: { messages: readonly AgentMessage[]; agents?: AgentTree; agentId?: string; contextWindow?: number }) {
  const b = React.useMemo(() => contextBreakdown(messages, { agents, agentId, contextWindow }), [messages, agents, agentId, contextWindow]);
  const top = CONTEXT_CATEGORIES.filter((c) => b.byCategory[c] > 0)
    .sort((x, y) => b.byCategory[y] - b.byCategory[x])
    .slice(0, 2);
  return (
    <div className="mb-2.5 grid gap-1.5">
      <ContextBar breakdown={b} size="sm" />
      <p className="truncate text-[11px] text-muted-foreground">{top.map((c) => `${CONTEXT_LABEL[c]} ${formatTokens(b.byCategory[c])}`).join(" · ")}</p>
    </div>
  );
}

export interface SessionMeterProps {
  messages: readonly AgentMessage[];
  /** 多 Agent 时给树: 上下文只看主线程, 速率把并行的子 Agent 加起来 */
  agents?: AgentTree;
  /** 消息里没报上下文窗口时用 */
  contextWindow?: number;
  /** 紧凑: 只留上下文, 速率, 命中率 (DSH 的 Compact) */
  compact?: boolean;
  /** 只看这个 Agent (切到子 Agent 的会话时) */
  agentId?: string;
  /** 胶囊的对齐, 默认居中 (输入框正下方) */
  align?: "start" | "center" | "end";
  /** 给了就在上下文弹层里出构成条与 "查看上下文构成" (打开 AgentContextView) */
  onOpenContext?: () => void;
  className?: string;
}

const ALIGN = { start: "justify-start", center: "justify-center", end: "justify-end" } as const;

/**
 * 会话的实时用量条, 放在输入框下方 (默认居中). 没有任何用量时什么都不画. 给 agentId 时只看那个 Agent 自己的用量与速率.
 * 研究笔记: next/docs/dsh-conversation-research.md
 */
export function SessionMeter({ messages, agents, contextWindow, compact = false, agentId, align = "center", onOpenContext, className }: SessionMeterProps) {
  const u = useSessionUsage(messages, { agents, contextWindow, agentId });
  const total = (u.inputTokens ?? 0) + (u.outputTokens ?? 0);
  if (!total && u.contextRatio == null && !u.live) return null;
  const ratio = u.contextRatio;
  const missed = (u.inputTokens ?? 0) - (u.cachedInputTokens ?? 0);
  const turnMs = u.turn.startedAt != null ? (u.turn.endedAt ?? Date.now()) - u.turn.startedAt : undefined;
  const speed = u.live ? u.tokensPerSecond : (u.avgTokensPerSecond ?? 0);
  return (
    <div data-slot="session-meter" data-live={u.live || undefined} role="group" aria-label="上下文与用量" className={cn("flex min-w-0 flex-wrap items-center gap-0.5", ALIGN[align], className)}>
      {ratio != null && (
        <MeterPill meter="context" title={`上下文已用 ${formatPercent(ratio)}%`} icon={<MeterRing ratio={ratio} />} label={<span>上下文 {formatPercent(ratio)}%</span>}>
          {onOpenContext ? (
            <ContextMini messages={messages} agents={agents} agentId={agentId} contextWindow={contextWindow} />
          ) : (
            <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full origin-left rounded-full transition-transform duration-500" style={{ transform: `scaleX(${ratio})`, background: toneOf(ratio) }} />
            </div>
          )}
          <Rows
            rows={[
              ["已用", `~${formatTokens(u.contextTokens ?? 0)}`, true],
              ["窗口", formatTokens(u.contextWindow ?? 0)],
              ["剩余", formatTokens(Math.max(0, (u.contextWindow ?? 0) - (u.contextTokens ?? 0)))],
            ]}
          />
          {onOpenContext && (
            <PopoverPrimitive.Close asChild>
              <button type="button" onClick={onOpenContext} className="mt-2.5 flex h-8 w-full items-center justify-center gap-1.5 rounded-md border text-xs transition-colors duration-150 hover:bg-accent">
                查看上下文构成
                <ArrowRight className="size-3.5" />
              </button>
            </PopoverPrimitive.Close>
          )}
        </MeterPill>
      )}
      {(u.live || speed > 0) && (
        <MeterPill
          meter="speed"
          title="输出速率"
          icon={<Gauge />}
          label={
            <span>
              {!u.live && <span>均速 </span>}
              <span className="inline-block min-w-[3ch] text-right text-foreground">{formatRate(speed)}</span> tok/s
              {u.live && u.streams > 1 && agentId === undefined && <span> · {u.streams} 路</span>}
            </span>
          }
        >
          <Rows
            rows={[
              ["此刻", `${formatRate(u.tokensPerSecond)} tok/s`, true],
              ["并行生成", `${u.streams} 路`],
              ["平均吞吐", u.avgTokensPerSecond != null ? `${formatRate(u.avgTokensPerSecond)} tok/s` : "—"],
              ["最近首 token", u.lastTtftMs != null ? formatDuration(u.lastTtftMs) : "—"],
              ["输出 token", exact(u.outputTokens ?? 0)],
            ]}
          />
          <p className="mt-2 text-[11px] text-muted-foreground">速率取最近 2 秒的滑动窗口; 子 Agent 并行时加总。</p>
        </MeterPill>
      )}
      {total > 0 && (
        <MeterPill
          meter="usage"
          title="Token 用量 (累计)"
          icon={<Database />}
          label={
            <span>
              累计 {formatTokens(total)} tokens
              {u.cacheHitRate != null && <span> · 命中 {formatPercent(u.cacheHitRate)}%</span>}
            </span>
          }
        >
          <Rows
            rows={[
              ["缓存命中 · 累计", u.cacheHitRate != null ? `${formatPercent(u.cacheHitRate, 1)}%` : "—", true],
              ...(u.lastRequest ? ([["缓存命中 · 本次请求", u.lastRequest.cacheHitRate != null ? `${formatPercent(u.lastRequest.cacheHitRate, 1)}%` : "—"]] as [string, string][]) : []),
              ["提示 (含缓存)", exact(u.inputTokens ?? 0)],
              ["缓存读取", exact(u.cachedInputTokens ?? 0)],
              ...(u.cacheWriteTokens ? ([["缓存写入", exact(u.cacheWriteTokens)]] as [string, string][]) : []),
              ["未命中", exact(Math.max(0, missed))],
              ["输出", exact(u.outputTokens ?? 0)],
              ...(u.reasoningTokens ? ([["其中思考", exact(u.reasoningTokens)]] as [string, string][]) : []),
              ...(u.cost != null ? ([["费用", formatCost(u.cost)]] as [string, string][]) : []),
            ]}
          />
        </MeterPill>
      )}
      {!compact && turnMs != null && (
        <span data-meter="turn" className={cn(PILL, "hover:bg-transparent hover:text-muted-foreground")}>
          <Timer />
          本轮 {formatDuration(turnMs)}
          {u.turn.cost != null && <span>· {formatCost(u.turn.cost)}</span>}
        </span>
      )}
    </div>
  );
}

/** 一轮的用量胶囊 (助手消息操作条上): "1.2万 tokens", 点开看这一轮的明细 */
export function TurnUsage({ message, className }: { message: AgentMessage; className?: string }) {
  const u = message.usage;
  const t = messageTiming(message);
  if (!u) return null;
  const total = (u.inputTokens ?? 0) + (u.outputTokens ?? 0);
  const hit = cacheHitRate(u);
  const ctx = contextRatio(u);
  const rows: [string, React.ReactNode, boolean?][] = [];
  if (hit != null) rows.push(["缓存命中", `${formatPercent(hit, 1)}%`, true]);
  if (u.inputTokens != null) rows.push(["提示 (含缓存)", exact(u.inputTokens)]);
  if (u.cachedInputTokens != null) rows.push(["缓存读取", exact(u.cachedInputTokens)]);
  if (u.cacheWriteTokens) rows.push(["缓存写入", exact(u.cacheWriteTokens)]);
  if (u.outputTokens != null) rows.push(["输出", exact(u.outputTokens)]);
  if (u.reasoningTokens) rows.push(["其中思考", exact(u.reasoningTokens)]);
  if (t.ttftMs != null) rows.push(["首 token", formatDuration(t.ttftMs)]);
  if (t.decodeMs != null) rows.push(["生成", formatDuration(t.decodeMs)]);
  if (t.tokensPerSecond != null) rows.push(["吞吐", `${formatRate(t.tokensPerSecond)} tok/s`]);
  if (ctx != null) rows.push(["上下文", `${formatPercent(ctx)}% · ${formatTokens(u.contextTokens ?? 0)} / ${formatTokens(u.contextWindow ?? 0)}`]);
  if (u.cost != null) rows.push(["费用", formatCost(u.cost)]);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" data-slot="turn-usage" aria-label="这一轮的用量" className={cn(PILL, "h-7 px-1.5", className)}>
          <Database />
          {formatTokens(total)} tokens
          {t.tokensPerSecond != null && <span>· {formatRate(t.tokensPerSecond)} tok/s</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" aria-label="这一轮的用量" className="w-64 p-3">
        <div className="mb-2 flex items-center justify-between gap-2 text-[13px] font-medium">
          <span>这一轮的用量</span>
          {message.model && <span className="truncate text-xs font-normal text-muted-foreground">{message.model}</span>}
        </div>
        <Rows rows={rows} />
      </PopoverContent>
    </Popover>
  );
}

export interface ContextLeftProps {
  messages: readonly AgentMessage[];
  agents?: AgentTree;
  agentId?: string;
  contextWindow?: number;
  /** 给了就在明细里出 "查看上下文构成" */
  onOpenContext?: () => void;
  /** 手机: 点开是底部弹层 */
  sheet?: boolean;
  /** 窄处 (手机): 只写 "上下文 68%", 默认还带 "13.6万 / 20万" */
  compact?: boolean;
  className?: string;
}

/**
 * 实时上下文 (此刻主线程占了多少窗口; 会涨, 压缩后回落): 小环 + "上下文 68% · 13.6万 / 20万" (Codex App 输入框下方的 "◔ 50%").
 * 与旁边 ComposerMeters 的 "累计 398万" 分开标签: 那个是整段会话加起来的 token, 只增不减.
 * 悬停给精确值; 点开是会话用量明细 (UsageDetails): 实时上下文 (构成条, 已用 / 窗口 / 剩余) 与累计 (token, 命中率, 费用) 分两节.
 */
export function ContextLeft({ messages, agents, agentId, contextWindow, onOpenContext, sheet, compact, className }: ContextLeftProps) {
  const u = useSessionUsage(messages, { agents, contextWindow, agentId });
  const [open, setOpen] = React.useState(false);
  const ratio = u.contextRatio;
  const ctx = usageLabels(u).context;
  if (ratio == null || !ctx) return null;
  const precise = `上下文 (实时) 已用 ${exact(u.contextTokens ?? 0)} / ${exact(u.contextWindow ?? 0)} tokens (${ctx.percent}%) · 剩余 ${exact(ctx.left)}`;
  const details = <UsageDetails u={u} messages={messages} agents={agents} agentId={agentId} contextWindow={contextWindow} />;
  const button = (props: React.ComponentProps<"button">) => (
    <button
      type="button"
      data-meter="context"
      data-live={u.live || undefined}
      aria-label={precise}
      title={precise}
      {...props}
      className={cn("inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2 text-xs text-muted-foreground tabular transition-colors duration-150 hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring data-[state=open]:bg-accent", className)}
    >
      <MeterRing ratio={ratio} />
      <span data-meter-part="context" className="whitespace-nowrap">
        上下文{" "}
        <Num w={3} strong>
          <span style={ratio >= WARN_AT ? { color: toneOf(ratio) } : undefined}>{ctx.percent}%</span>
        </Num>
      </span>
      {!compact && (
        <span data-meter-part="context-amount" className="whitespace-nowrap">
          <span aria-hidden className="px-1 opacity-50">·</span>
          {ctx.amount}
        </span>
      )}
    </button>
  );
  if (sheet) {
    return (
      <>
        {button({ onClick: () => setOpen(true), "aria-haspopup": "dialog" })}
        <ComposerSheet open={open} onOpenChange={setOpen} title="用量" description={`${ctx.label} · ${ctx.amount}`}>
          <div className="px-4 pb-2">{details}</div>
          {onOpenContext && (
            <div className="px-4 pt-1">
              <button type="button" onClick={() => (setOpen(false), onOpenContext())} className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border text-sm active:bg-accent">
                查看上下文构成
                <ArrowRight className="size-4" />
              </button>
            </div>
          )}
        </ComposerSheet>
      </>
    );
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{button({})}</PopoverTrigger>
      <PopoverContent side="top" align="end" aria-label="用量" className="w-72 p-3">
        {details}
        {onOpenContext && (
          <PopoverPrimitive.Close asChild>
            <button type="button" onClick={onOpenContext} className="mt-3 flex h-8 w-full items-center justify-center gap-1.5 rounded-md border text-xs transition-colors duration-150 hover:bg-accent">
              查看上下文构成
              <ArrowRight className="size-3.5" />
            </button>
          </PopoverPrimitive.Close>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** 本轮用时 (毫秒); 本轮还没开始为 undefined */
const turnMsOf = (u: SessionUsage) => (u.turn.startedAt != null ? (u.turn.endedAt ?? Date.now()) - u.turn.startedAt : undefined);
const pct = (r: number | null | undefined, digits = 0) => (r != null ? `${formatPercent(r, digits)}%` : "—");

/**
 * 用量明细 (上下文余量 / 底栏指标点开都是它): 上下文构成与 已用 / 窗口 / 剩余; 速率与路数; token 与缓存命中 ("累计" 与 "本次请求" 分开);
 * 本轮用时与费用.
 */
function UsageDetails({ u, messages, agents, agentId, contextWindow }: { u: SessionUsage; messages: readonly AgentMessage[]; agents?: AgentTree; agentId?: string; contextWindow?: number }) {
  const labels = usageLabels(u);
  const ctx = labels.context;
  const turnMs = turnMsOf(u);
  const speed = u.live ? u.tokensPerSecond : (u.avgTokensPerSecond ?? 0);
  const req = u.lastRequest;
  return (
    <div data-slot="usage-details" className="grid gap-3">
      {ctx && (
        <section data-usage-section="context">
          <SectionTitle hint="此刻占用, 压缩后回落">实时上下文</SectionTitle>
          <ContextMini messages={messages} agents={agents} agentId={agentId} contextWindow={contextWindow} />
          <Rows
            rows={[
              ["已用", `${ctx.percent}% · ${exact(u.contextTokens ?? 0)}`, true],
              ["窗口", exact(u.contextWindow ?? 0)],
              ["剩余", exact(ctx.left)],
            ]}
          />
        </section>
      )}
      <section data-usage-section="total" className={cn(ctx && "border-t pt-3")}>
      <SectionTitle hint="整段会话加起来, 只增不减">累计</SectionTitle>
      <Rows
        rows={[
          [u.live ? "此刻速率" : "平均吞吐", `${formatRate(speed)} tok/s${u.live && u.streams > 1 ? ` · ${u.streams} 路` : ""}`],
          ["累计 token", exact(labels.totalTokens), true],
          ["缓存命中 · 累计", pct(u.cacheHitRate, 1), true],
          ...(req ? ([["缓存命中 · 本次请求", `${pct(req.cacheHitRate, 1)}${req.inputTokens != null ? ` · ${formatTokens(req.inputTokens)} 提示` : ""}`]] as [string, string][]) : []),
          ...(u.requests > 0 ? ([["请求次数", String(u.requests)]] as [string, string][]) : []),
          ["输出", exact(u.outputTokens ?? 0)],
          ...(turnMs != null ? ([["本轮", `${formatDuration(turnMs)}${u.turn.cost != null ? ` · ${formatCost(u.turn.cost)}` : ""}`]] as [string, string][]) : []),
          ...(u.cost != null ? ([["会话费用", formatCost(u.cost)]] as [string, string][]) : []),
        ]}
      />
      </section>
    </div>
  );
}

export interface ComposerMetersProps {
  messages: readonly AgentMessage[];
  agents?: AgentTree;
  /** 只看这个 Agent (切到子 Agent 的会话时) */
  agentId?: string;
  contextWindow?: number;
  /** 手机: 只留 tok/s 与缓存命中率, 路数 / token / 用时 / 费用进弹层 */
  compact?: boolean;
  /** 显示本轮用时 (默认 true). 生成中输入框上方的状态条已经在走秒时可以关掉, 避免同一个数出现两次 */
  turnTime?: boolean;
  /** 手机: 点开是底部弹层 */
  sheet?: boolean;
  /** 给了就在明细里出 "查看上下文构成" */
  onOpenContext?: () => void;
  className?: string;
}

/** 数字占位: 等宽数字 + 最小宽度 + 右对齐, 跳动时整行不跟着变宽 */
function Num({ w, children, strong }: { w: number; children: React.ReactNode; strong?: boolean }) {
  return (
    <span className={cn("inline-block text-right tabular", strong && "text-foreground")} style={{ minWidth: `${w}ch` }}>
      {children}
    </span>
  );
}

/**
 * 输入框下方那一行里的实时指标 (DSH 的 StatsPills 放进 Codex 的底栏): "82 tok/s · 3 路 · 16.7万 tokens · 命中 95% · 本轮 19 秒 · $0.42".
 * tok/s 按当前 Agent (给 agentId 时只算它), 生成中每 250ms 跳; 命中率是累计值 (不随单次请求跳), 悬停 / 明细里同时给本次请求的.
 * 整行是一个按钮, 点开是用量明细 (宽屏弹层 / 手机底部弹层). 没有任何用量时不画.
 */
export function ComposerMeters({ messages, agents, agentId, contextWindow, compact = false, turnTime = true, sheet, onOpenContext, className }: ComposerMetersProps) {
  const u = useSessionUsage(messages, { agents, contextWindow, agentId });
  const [open, setOpen] = React.useState(false);
  const labels = usageLabels(u);
  const total = labels.totalTokens;
  if (!total && !u.live) return null;
  const speed = u.live ? u.tokensPerSecond : (u.avgTokensPerSecond ?? 0);
  const turnMs = turnMsOf(u);
  const streams = u.live && u.streams > 1 && agentId === undefined ? u.streams : 0;
  const req = u.lastRequest;
  const sep = <span aria-hidden className="px-1 opacity-50">·</span>;
  const title = [
    `${u.live ? "此刻" : "平均"} ${formatRate(speed)} tok/s${streams ? ` · ${streams} 路并行` : ""}`,
    `累计 ${exact(total)} tokens (整段会话, 只增不减)`,
    `缓存命中 累计 ${pct(u.cacheHitRate, 1)}${req ? ` · 本次请求 ${pct(req.cacheHitRate, 1)}` : ""}`,
    ...(turnMs != null ? [`本轮 ${formatDuration(turnMs)}`] : []),
    ...(u.cost != null ? [`费用 ${formatCost(u.cost)}`] : []),
  ].join("\n");
  const body = (
    <>
      <Gauge aria-hidden className={cn("size-3.5 shrink-0", u.live && speed > 0 && "text-brand")} />
      <span data-meter-part="rate" className="whitespace-nowrap">
        {!u.live && !compact && <span>均速 </span>}
        <Num w={3} strong={u.live}>
          {formatRate(speed)}
        </Num>{" "}
        tok/s
      </span>
      {!compact && streams > 0 && (
        <span data-meter-part="streams" className="whitespace-nowrap">
          {sep}
          {streams} 路
        </span>
      )}
      {total > 0 && (
        <span data-meter-part="tokens" className="whitespace-nowrap">
          {sep}累计 <Num w={4}>{formatTokens(total)}</Num>
        </span>
      )}
      {u.cacheHitRate != null && (
        <span data-meter-part="hit" className="whitespace-nowrap">
          {sep}命中 <Num w={2}>{formatPercent(u.cacheHitRate)}</Num>%
        </span>
      )}
      {!compact && turnTime && turnMs != null && (
        <span data-meter-part="turn" className="whitespace-nowrap">
          {sep}本轮 <Num w={4}>{formatDuration(turnMs)}</Num>
        </span>
      )}
      {!compact && u.cost != null && (
        <span data-meter-part="cost" className="whitespace-nowrap">
          {sep}
          <Num w={5}>{formatCost(u.cost)}</Num>
        </span>
      )}
    </>
  );
  const cls = cn(
    "inline-flex h-7 min-w-0 shrink items-center gap-1 overflow-hidden rounded-full px-2 text-xs text-muted-foreground tabular transition-colors duration-150 hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring data-[state=open]:bg-accent",
    className,
  );
  const aria = `用量: ${title.replace(/\n/g, ", ")}`;
  const contextButton = (close: () => void, big?: boolean) =>
    onOpenContext && (
      <button type="button" onClick={() => (close(), onOpenContext())} className={cn("flex w-full items-center justify-center gap-1.5 rounded-md border transition-colors duration-150 hover:bg-accent", big ? "mt-1 h-11 rounded-xl text-sm" : "mt-3 h-8 text-xs")}>
        查看上下文构成
        <ArrowRight className="size-3.5" />
      </button>
    );
  if (sheet) {
    return (
      <>
        <button type="button" data-slot="composer-meters" data-live={u.live || undefined} aria-label={aria} aria-haspopup="dialog" onClick={() => setOpen(true)} className={cls}>
          {body}
        </button>
        <ComposerSheet open={open} onOpenChange={setOpen} title="用量">
          <div className="px-4 pb-2">
            <UsageDetails u={u} messages={messages} agents={agents} agentId={agentId} contextWindow={contextWindow} />
            {contextButton(() => setOpen(false), true)}
          </div>
        </ComposerSheet>
      </>
    );
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" data-slot="composer-meters" data-live={u.live || undefined} aria-label={aria} title={title} className={cls}>
          {body}
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="center" aria-label="用量" className="w-72 p-3">
        <UsageDetails u={u} messages={messages} agents={agents} agentId={agentId} contextWindow={contextWindow} />
        {contextButton(() => setOpen(false))}
      </PopoverContent>
    </Popover>
  );
}
