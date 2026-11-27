"use client";
/**
 * 编排视图共用的小件: 状态点 (与 Badge / LiveDot 同一套), 状态徽章, 计时, 总览条, "现在" 时钟.
 */
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AGENT_DONE, AGENT_WAITING, agentSpan, agentWaits, countAgents, type AgentNode, type AgentTree } from "../model/agents";
import { useElapsed } from "../parts/elapsed";
import { formatDuration } from "../parts/format";
import { STATUS_META, TONE_BG } from "./constants";

/** 有 Agent 还没结束时每 250ms 刷新一次 (共用 useElapsed 的定时器), 返回当前时刻; 全部结束时停在最后一个结束时刻 */
export function useOrchestraNow(tree: AgentTree): number {
  const live = tree.order.some((id) => !AGENT_DONE.has(tree.nodes[id].status));
  const now = useElapsed(0, undefined, live);
  if (live) return now;
  let end = 0;
  for (const id of tree.order) {
    const n = tree.nodes[id];
    end = Math.max(end, n.endedAt ?? 0, n.history.at(-1)?.at ?? 0, n.spawnedAt);
  }
  for (const l of tree.links) end = Math.max(end, l.at);
  return end || now;
}

/** 状态点: 运行中 / 等人时外圈脉冲 (同 LiveDot), 只是辅助, 旁边要有文字 */
export function StatusDot({ node, className }: { node: Pick<AgentNode, "status">; className?: string }) {
  const tone = TONE_BG[STATUS_META[node.status].tone];
  const live = node.status === "running" || AGENT_WAITING.has(node.status);
  return (
    <span aria-hidden className={cn("relative inline-flex size-1.5 shrink-0", className)}>
      {live && <span className={cn("absolute inset-0 animate-pulse-ring rounded-full", tone)} />}
      <span className={cn("relative inline-flex size-1.5 rounded-full", tone)} />
    </span>
  );
}

/** 状态徽章: 库里的 Badge (outline) + 状态点 */
export function AgentStatusBadge({ node, className }: { node: Pick<AgentNode, "status">; className?: string }) {
  return (
    <Badge variant="outline" className={cn("h-5 px-1.5 font-normal text-muted-foreground", className)}>
      <StatusDot node={node} />
      {STATUS_META[node.status].label}
    </Badge>
  );
}

export function AgentTimer({ node, now, className }: { node: AgentNode; now: number; className?: string }) {
  if (node.status === "queued") return <span className={cn("tabular text-muted-foreground", className)}>排队中</span>;
  const { start, end } = agentSpan(node, now);
  return <span className={cn("tabular text-muted-foreground", className)}>{formatDuration(end - start)}</span>;
}

export interface OrchestraSummaryProps {
  tree: AgentTree;
  /** 只统计这些 Agent (默认整棵树) */
  ids?: readonly string[];
  className?: string;
}

/** 总览条: 运行中 / 等待 / 完成 / 失败, 以及谁在等谁 */
export function OrchestraSummary({ tree, ids, className }: OrchestraSummaryProps) {
  const c = countAgents(tree, ids);
  const waits = agentWaits(tree).filter((w) => !ids || ids.includes(w.from));
  const name = (id: string) => tree.nodes[id]?.name ?? id;
  const items: { key: string; label: string; n: number; tone: keyof typeof TONE_BG }[] = [
    { key: "running", label: "运行中", n: c.running, tone: "brand" },
    { key: "waiting", label: "等待", n: c.waiting, tone: "warning" },
    { key: "done", label: "完成", n: c.done, tone: "success" },
    { key: "error", label: "失败", n: c.error, tone: "destructive" },
  ];
  if (c.queued) items.push({ key: "queued", label: "排队", n: c.queued, tone: "muted" });
  return (
    <div data-slot="orchestra-summary" className={cn("flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground", className)}>
      {items.map((i) => (
        <span key={i.key} className="inline-flex items-center gap-1.5">
          <span aria-hidden className={cn("size-1.5 rounded-full", TONE_BG[i.tone])} />
          {i.label}
          <span className="tabular font-medium text-foreground">{i.n}</span>
        </span>
      ))}
      <span className="tabular">共 {c.total}</span>
      {waits.length > 0 && (
        <span className="flex min-w-0 flex-1 flex-wrap justify-end gap-x-3 gap-y-1">
          {waits.slice(0, 3).map((w) => (
            <span key={`${w.from}>${w.to ?? "user"}`} className="truncate">
              <span className="text-foreground">{name(w.from)}</span> 在等 <span className="text-foreground">{w.to ? name(w.to) : w.reason === "awaiting-input" ? "你回答" : "你批准"}</span>
            </span>
          ))}
        </span>
      )}
    </div>
  );
}

/** 键盘可选中: Enter / 空格 */
export const onActivate = (fn: () => void) => (e: React.KeyboardEvent) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    fn();
  }
};

export interface TailTextProps {
  /** agentTail 的结果 */
  tail: { text: string; label?: string; live: boolean; cut: boolean; kind: string } | undefined;
  /** 显示几行 (默认 2) */
  lines?: 1 | 2;
  /** 省略号的底色, 与所在卡片一致 (默认 bg-card) */
  surface?: string;
  className?: string;
}

/** 测量: 内容比盒子宽 / 高就是被截了 */
function useClipped(dep: unknown, axis: "x" | "y") {
  const box = React.useRef<HTMLSpanElement>(null);
  const inner = React.useRef<HTMLSpanElement>(null);
  const [clipped, setClipped] = React.useState(false);
  React.useLayoutEffect(() => {
    const b = box.current;
    const i = inner.current;
    if (!b || !i) return;
    const check = () => setClipped(axis === "x" ? i.offsetWidth > b.clientWidth + 1 : i.offsetHeight > b.clientHeight + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(b);
    return () => ro.disconnect();
  }, [dep, axis]);
  return { box, inner, clipped };
}

/** 一行, 靠右对齐: 放不下时截掉开头, 左端盖省略号 */
function TailLine({ text, cut, surface }: { text: string; cut: boolean; surface: string }) {
  const { box, inner, clipped } = useClipped(text, "x");
  return (
    <span ref={box} className={cn("relative flex min-w-0 flex-1 overflow-hidden whitespace-nowrap", clipped ? "justify-end" : "justify-start")}>
      <span ref={inner} className="shrink-0">
        {text}
      </span>
      {(clipped || cut) && (
        <span aria-hidden className={cn("absolute inset-y-0 left-0 pr-0.5", surface)}>
          …
        </span>
      )}
    </span>
  );
}

/** 两行, 贴底排: 新字从右下长出来, 旧字从上沿出去; 截了时左上角盖省略号 */
function TailBlock({ text, cut, surface }: { text: string; cut: boolean; surface: string }) {
  const { box, inner, clipped } = useClipped(text, "y");
  return (
    <span ref={box} className="relative block h-[3em] min-w-0 overflow-hidden">
      <span ref={inner} className="absolute inset-x-0 bottom-0 block break-all">
        {text}
      </span>
      {(clipped || cut) && (
        <span aria-hidden className={cn("absolute top-0 left-0 h-[1.5em] pr-0.5", surface)}>
          …
        </span>
      )}
    </span>
  );
}

/**
 * 子 Agent 最新输出的尾部 (编排框节点, 卡片墙, 切换器): 截掉的是开头不是结尾, 流式时随 token 往前走.
 * 有标签 (运行中的命令 / 思考) 时第一行是标签 (保留开头), 第二行是输出尾部; 没标签时两行都给文字.
 */
export function TailText({ tail, lines = 2, surface = "bg-card", className }: TailTextProps) {
  if (!tail) return <span className={cn("block leading-[1.5em] text-muted-foreground", className)}>—</span>;
  const label = tail.label ? <span className={cn("min-w-0 truncate font-medium", tail.kind === "reasoning" ? "text-muted-foreground" : "font-mono text-foreground/90")}>{tail.label}</span> : null;
  const live = tail.live ? <span className="sr-only">进行中</span> : null;
  if (lines === 1) {
    return (
      <span data-slot="agent-tail" data-live={tail.live || undefined} className={cn("flex min-w-0 items-baseline gap-1 leading-[1.5em]", className)}>
        {label && <span className={cn("flex min-w-0", tail.text ? "max-w-[55%] shrink-0" : "flex-1")}>{label}</span>}
        {tail.text && <TailLine text={tail.text} cut={tail.cut} surface={surface} />}
        {live}
      </span>
    );
  }
  return (
    <span data-slot="agent-tail" data-live={tail.live || undefined} className={cn("flex min-w-0 flex-col leading-[1.5em]", className)}>
      {label ? (
        <>
          <span className="flex min-w-0">{label}</span>
          {tail.text ? <span className="flex min-w-0"><TailLine text={tail.text} cut={tail.cut} surface={surface} /></span> : <span className="h-[1.5em]" />}
        </>
      ) : (
        <TailBlock text={tail.text} cut={tail.cut} surface={surface} />
      )}
      {live}
    </span>
  );
}
