/**
 * 把一条消息的 parts 切成 "正文" 和 "活动" 两种段 (纯函数), 照 DSH dsh-fold / T3 Activity log 的规则:
 * - 相邻的工具调用和思考合成一段活动, 正文 (text) 和文件断开它
 * - 重试 / 压缩 这类提示是透明的: 不断开, 跟着活动一起折
 * - 需要用户处理的调用 (提问, 审批) 钉在外面, 不进折叠
 */
import type { AgentPart } from "./types";

export type Segment = { type: "part"; part: AgentPart } | { type: "activity"; id: string; parts: AgentPart[] };

export function segmentParts(parts: readonly AgentPart[], isPinned: (p: AgentPart) => boolean = () => false): Segment[] {
  const out: Segment[] = [];
  let cur: AgentPart[] | null = null;
  const flush = () => {
    if (cur?.length) out.push({ type: "activity", id: `act:${cur[0].id}`, parts: cur });
    cur = null;
  };
  for (const p of parts) {
    const foldable = (p.type === "tool" && !isPinned(p)) || p.type === "reasoning" || (p.type === "notice" && (p.kind === "retry" || p.kind === "compaction" || p.kind === "info"));
    if (foldable) (cur ??= []).push(p);
    else {
      flush();
      out.push({ type: "part", part: p });
    }
  }
  flush();
  return out;
}

/** 活动段的时间范围: 最早开始到最晚结束 (还有没结束的就是 undefined) */
export function activitySpan(parts: readonly AgentPart[]): { start?: number; end?: number; live: boolean } {
  let start: number | undefined;
  let end: number | undefined;
  let live = false;
  for (const p of parts) {
    const s = p.type === "tool" ? p.call.startedAt : p.type === "reasoning" ? p.startedAt : undefined;
    const e = p.type === "tool" ? p.call.endedAt : p.type === "reasoning" ? p.endedAt : undefined;
    const running = p.type === "tool" ? !["success", "error", "interrupted", "denied"].includes(p.call.status) : p.type === "reasoning" ? !!p.streaming : false;
    if (running) live = true;
    if (s != null) start = start == null ? s : Math.min(start, s);
    if (e != null) end = end == null ? e : Math.max(end, e);
  }
  return { start, end: live ? undefined : end, live };
}
