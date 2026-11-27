/**
 * 会话里所有待办调用的索引 (纯函数, 无 "use client"): 按所属 Agent 分组折叠成计划,
 * 每次调用对应哪一步, 是不是这份计划的最新一步. 待办卡片 (TodoCallCard) 与计划面板 (PlanPanel) 都读它.
 * 研究笔记: next/docs/dsh-conversation-research.md
 */
import { isSubAgent, type AgentTree } from "./agents";
import { isTodoCall, planFromParts, type Plan, type PlanStep } from "./todos";
import type { AgentMessage, AgentPart } from "./types";
import { MAIN_THREAD } from "./usage";

export interface PlanIndex {
  /** 所属 Agent -> 计划; 主线程 (编排者 / 无 agentId) 的键是 MAIN_THREAD */
  plans: ReadonlyMap<string, Plan>;
  /** 调用 id -> 它那一步, 以及是不是所属计划的最新一步 */
  steps: ReadonlyMap<string, { owner: string; step: PlanStep; latest: boolean }>;
  /** 参与折叠的调用对象 (引用比较用, 没变就复用上一份索引) */
  calls: readonly AgentPart[];
}

export const EMPTY_PLAN_INDEX: PlanIndex = { plans: new Map(), steps: new Map(), calls: [] };

/** 主线程 (编排者) 归 MAIN_THREAD, 子 Agent 归它自己 */
const ownerKey = (tree: AgentTree | undefined, who: string | undefined) => (who && tree && isSubAgent(tree, who) ? who : MAIN_THREAD);

/** 收集待办调用 (按出现顺序, 带所属) */
function collect(messages: readonly AgentMessage[], tree: AgentTree | undefined): { part: AgentPart; owner: string }[] {
  const out: { part: AgentPart; owner: string }[] = [];
  for (const m of messages) {
    for (const p of m.parts) if (p.type === "tool" && isTodoCall(p.call)) out.push({ part: p, owner: ownerKey(tree, p.agentId ?? m.agentId) });
  }
  return out;
}

/** 建索引; prev 的调用对象全都没变时直接返回 prev (token 流不会每帧重算) */
export function buildPlanIndex(messages: readonly AgentMessage[], tree: AgentTree | undefined, prev: PlanIndex = EMPTY_PLAN_INDEX): PlanIndex {
  const found = collect(messages, tree);
  if (found.length === prev.calls.length && found.every((f, i) => f.part === prev.calls[i])) return prev;
  const byOwner = new Map<string, AgentPart[]>();
  for (const f of found) byOwner.set(f.owner, [...(byOwner.get(f.owner) ?? []), f.part]);
  const plans = new Map<string, Plan>();
  const steps = new Map<string, { owner: string; step: PlanStep; latest: boolean }>();
  for (const [owner, parts] of byOwner) {
    const plan = planFromParts(parts);
    plans.set(owner, plan);
    for (const s of plan.steps) steps.set(s.callId, { owner, step: s, latest: s.callId === plan.callId });
  }
  return { plans, steps, calls: found.map((f) => f.part) };
}

/**
 * planCalls="hidden" 时这次待办调用要不要从对话里滤掉: 进了索引, 且不是所属计划第一次列出的那次 (后续更新都在 PlanPanel 里看).
 * 没进索引的调用 (单独渲染) 不滤.
 */
export function isRepeatPlanCall(index: PlanIndex, callId: string): boolean {
  const hit = index.steps.get(callId);
  return !!hit && index.plans.get(hit.owner)?.steps[0]?.callId !== callId;
}
