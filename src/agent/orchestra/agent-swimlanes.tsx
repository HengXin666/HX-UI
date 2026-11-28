"use client";
/**
 * 多 Agent 泳道: 每个 Agent 一条泳道, 横轴是时间. 左边标签列是 HTML (状态点 + 名字, 与库里的列表行同一套字号与截断),
 * 右边时间轴是 SVG: 运行段 = 浅强调色条, 工具调用 = 条上的细段, 等待段 = 警示色虚线框 (等别的 Agent 时一条虚线指向它),
 * 消息 / 交接 = 泳道之间的中性色竖线 (只有落点用强调色), 结束 = 一个点. 有时间刻度, 进行中有 "现在" 线.
 */
import * as React from "react";
import { cn } from "@/lib/utils";
import { AGENT_DONE, AGENT_WAITING, agentSegments, flattenAgentTree, toolSpansOfAgent, type AgentNode, type AgentSegment, type AgentTree } from "../model/agents";
import type { AgentMessage } from "../model/types";
import { agentTokenRates, formatRate } from "../model/usage";
import { formatDuration } from "../parts/format";
import { DASH, LANES, LINK_COLOR, STATUS_META, STROKE, TONE_COLOR, TOKEN } from "./constants";
import { formatOffset, timeTicks } from "./layout";
import { onActivate, StatusDot, useOrchestraNow } from "./shared";

export interface AgentSwimlanesProps {
  agents: AgentTree;
  /** 给了就在运行段上画工具调用 (按 agentId / tool-child 归属) */
  messages?: readonly AgentMessage[];
  /** 每个 Agent 此刻的 tok/s (agentTokenRates); 不给就按 messages 现算. 标签列在跑的显示速率 */
  rates?: ReadonlyMap<string, number>;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
}

const DEPTH_INDENT = 12;
const MIN_SPAN = 1000;
const TICK_TARGET = 6;
const WAIT_SPREAD = 8;

function useWidth(ref: React.RefObject<HTMLDivElement | null>, min: number): number {
  const [w, setW] = React.useState<number>(min);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(min, Math.floor(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, min]);
  return w;
}

function Segment({ seg, x, cy, laneOf, current }: { seg: AgentSegment; x: (t: number) => number; cy: number; laneOf: (id: string) => number | undefined; current: boolean }) {
  const x0 = x(seg.start);
  const w = Math.max(2, x(seg.end) - x0);
  const half = LANES.barH / 2;
  const tip = `${STATUS_META[seg.status].label}${seg.summary ? ` · ${seg.summary}` : ""} · ${formatDuration(seg.end - seg.start)}`;
  if (seg.kind === "queued") return <line x1={x0} x2={x0 + w} y1={cy} y2={cy} stroke={TOKEN.border} strokeWidth={STROKE} strokeDasharray={DASH}><title>{tip}</title></line>;
  if (seg.kind === "done") return <circle cx={x0} cy={cy} r={3} fill={TONE_COLOR[STATUS_META[seg.status].tone]}><title>{tip}</title></circle>;
  if (seg.kind === "run") return <rect x={x0} y={cy - half} width={w} height={LANES.barH} rx={3} fill={TOKEN.brandSoft}><title>{tip}</title></rect>;
  const human = AGENT_WAITING.has(seg.status);
  const mid = x0 + w / 2;
  return (
    <g data-kind="wait">
      <rect x={x0 + 0.5} y={cy - half + 0.5} width={Math.max(1, w - 1)} height={LANES.barH - 1} rx={3} fill={human ? TOKEN.warning : "none"} fillOpacity={human ? 0.12 : undefined} stroke={TOKEN.warning} strokeOpacity={0.7} strokeWidth={STROKE} strokeDasharray={DASH}>
        <title>{tip}</title>
      </rect>
      {/* 依赖连线只画正在等的那一段, 结束的等待不再连线 (否则满屏虚线) */}
      {(current ? (seg.waitingOn ?? []) : []).map((id, i, all) => {
        const ty = laneOf(id);
        if (ty === undefined) return null;
        const y1 = ty > cy ? cy + half : cy - half;
        // 同时等多个 Agent 时竖线错开, 不叠成一条
        const lx = Math.min(x0 + w - 2, Math.max(x0 + 2, mid + (i - (all.length - 1) / 2) * WAIT_SPREAD));
        return <line key={id} x1={lx} x2={lx} y1={y1} y2={ty} stroke={TOKEN.warning} strokeOpacity={0.5} strokeWidth={STROKE} strokeDasharray={DASH} />;
      })}
    </g>
  );
}

const LanePlot = React.memo(function LanePlot({ node, y, x, now, messages, agents, laneOf }: {
  node: AgentNode;
  y: number;
  x: (t: number) => number;
  now: number;
  messages?: readonly AgentMessage[];
  agents: AgentTree;
  laneOf: (id: string) => number | undefined;
}) {
  const cy = y + LANES.laneH / 2;
  const segs = agentSegments(node, now);
  // 派子 Agent 的调用 (task) 不画: 它们的时长就是子泳道
  const tools = messages ? toolSpansOfAgent(messages, agents, node.id, now).filter((t) => !agents.order.some((id) => agents.nodes[id].callId === t.id)) : [];
  const live = !AGENT_DONE.has(node.status);
  return (
    <g data-slot="agent-lane-plot" data-status={node.status}>
      {segs.map((s, i) => <Segment key={i} seg={s} x={x} cy={cy} laneOf={laneOf} current={live && i === segs.length - 1} />)}
      {tools.map((t) => (
        <rect key={t.id} x={x(t.start)} y={cy - LANES.toolH / 2} width={Math.max(2, x(t.end) - x(t.start))} height={LANES.toolH} rx={1} fill={t.status === "error" ? TOKEN.destructive : TOKEN.brand}>
          <title>{`${t.name} · ${formatDuration(t.end - t.start)}`}</title>
        </rect>
      ))}
    </g>
  );
});

export function AgentSwimlanes({ agents, messages, rates: ratesProp, selectedId, onSelect, className }: AgentSwimlanesProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const plotMin = LANES.minWidth - LANES.labelW;
  const width = useWidth(ref, plotMin);
  const now = useOrchestraNow(agents);
  const rates = ratesProp ?? (messages ? agentTokenRates(messages, agents, now) : undefined);
  const rows = React.useMemo(() => flattenAgentTree(agents), [agents]);
  const t0 = rows.reduce((m, r) => Math.min(m, r.node.spawnedAt), Number.POSITIVE_INFINITY);
  const span = Math.max(MIN_SPAN, now - t0);
  const plot = width - LANES.pad * 2;
  const x = React.useCallback((t: number) => LANES.pad + ((t - t0) / span) * plot, [t0, span, plot]);
  const laneY = React.useMemo(() => new Map(rows.map((r, i) => [r.node.id, LANES.axisH + i * LANES.laneH + LANES.laneH / 2])), [rows]);
  const laneOf = React.useCallback((id: string) => laneY.get(id), [laneY]);
  const height = LANES.axisH + rows.length * LANES.laneH;
  const live = rows.some((r) => !AGENT_DONE.has(r.node.status));
  if (!rows.length) return <p className={cn("p-6 text-sm text-muted-foreground", className)}>还没有派出 Agent。</p>;
  return (
    <div data-slot="agent-swimlanes" className={cn("grid overflow-x-auto", className)} style={{ gridTemplateColumns: `${LANES.labelW}px minmax(${plotMin}px, 1fr)` }}>
      {/* 标签列 */}
      <div className="border-r" style={{ paddingTop: LANES.axisH }}>
        {rows.map((r) => {
          const meta = STATUS_META[r.node.status];
          const selected = selectedId === r.node.id;
          const select = () => onSelect?.(r.node.id);
          return (
            <div
              key={r.node.id}
              data-slot="agent-lane"
              data-status={r.node.status}
              role={onSelect ? "button" : undefined}
              tabIndex={onSelect ? 0 : undefined}
              aria-pressed={onSelect ? selected : undefined}
              aria-label={`${r.node.name} ${meta.label}`}
              onClick={onSelect ? select : undefined}
              onKeyDown={onSelect ? onActivate(select) : undefined}
              className={cn(
                "flex min-w-0 items-center gap-1.5 border-t pr-2 text-[13px] outline-none transition-colors duration-150",
                onSelect && "cursor-pointer hover:bg-accent/50 focus-visible:bg-accent/50",
                selected && "bg-accent",
              )}
              style={{ height: LANES.laneH, paddingLeft: 8 + r.depth * DEPTH_INDENT }}
            >
              <StatusDot node={r.node} />
              <span className={cn("min-w-0 truncate", r.depth === 0 ? "font-medium text-foreground" : "text-foreground/85")}>{r.node.name}</span>
              {(rates?.get(r.node.id) ?? 0) > 0 ? (
                <span data-slot="agent-rate" className="ml-auto shrink-0 text-[11px] text-foreground tabular">{formatRate(rates?.get(r.node.id) ?? 0)} tok/s</span>
              ) : (
                <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">{meta.label}</span>
              )}
            </div>
          );
        })}
      </div>
      {/* 时间轴 */}
      <div ref={ref} className="min-w-0">
        <svg role="group" aria-label="Agent 泳道" width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block font-sans">
          {timeTicks(span, TICK_TARGET).map((t) => (
            <g key={t}>
              <line x1={x(t0 + t)} x2={x(t0 + t)} y1={LANES.axisH} y2={height} stroke={TOKEN.border} strokeWidth={STROKE} strokeOpacity={0.6} />
              <text x={x(t0 + t)} y={LANES.axisH - 7} fontSize={10} textAnchor="middle" fill={TOKEN.muted} className="tabular">{formatOffset(t)}</text>
            </g>
          ))}
          {rows.map((r, i) => {
            const y = LANES.axisH + i * LANES.laneH;
            return (
              <g key={r.node.id}>
                {selectedId === r.node.id && <rect x={0} y={y} width={width} height={LANES.laneH} fill="var(--accent)" />}
                <line x1={0} x2={width} y1={y} y2={y} stroke={TOKEN.border} strokeWidth={STROKE} />
                <LanePlot node={r.node} y={y} x={x} now={now} messages={messages} agents={agents} laneOf={laneOf} />
              </g>
            );
          })}
          {/* 消息 / 交接: 泳道之间的竖线, 落点一个强调色小点 */}
          {agents.links.map((l) => {
            const y1 = laneY.get(l.from);
            const y2 = laneY.get(l.to);
            if (y1 === undefined || y2 === undefined) return null;
            const lx = x(l.at);
            return (
              <g key={l.id} data-kind={l.kind}>
                <title>{`${agents.nodes[l.from]?.name ?? l.from} → ${agents.nodes[l.to]?.name ?? l.to}${l.text ? `: ${l.text}` : ""}`}</title>
                <line x1={lx} x2={lx} y1={y1} y2={y2} stroke={TOKEN.muted} strokeOpacity={0.6} strokeWidth={STROKE} strokeDasharray={l.kind === "handoff" ? DASH : undefined} />
                <circle cx={lx} cy={y1} r={2} fill={TOKEN.muted} />
                <circle cx={lx} cy={y2} r={2.5} fill={LINK_COLOR[l.kind]} />
              </g>
            );
          })}
          {live && <line x1={x(now)} x2={x(now)} y1={LANES.axisH} y2={height} stroke={TOKEN.brand} strokeWidth={STROKE} strokeOpacity={0.7} />}
        </svg>
      </div>
    </div>
  );
}
