/**
 * 计划 / 待办的数据层 (纯函数, 无 "use client", 服务端安全): 从会话里的待办工具调用派生出一棵 "大项 > 小项" 的计划树,
 * 随事件流实时更新 (参数还在流式时用部分解析的结果), 并给出进度 (x/y), 当前项, 每次更新改了什么.
 *
 * 两种线上格式都认:
 *   快照 (Claude Code 的 todo_write / Codex 的 update_plan): { todos: [{ content, status, activeForm?, children? }] },
 *     子项放在 children / subtasks / items / tasks 里; 也认 OMP 的 phases: [{ name, tasks: [...] }] 与 init 的 list: [{ phase, items: [...] }].
 *   操作 (oh-my-pi 的 todo 工具): { op: "init" | "start" | "done" | "drop" | "rm" | "append" | "view", task?, items?, phase? },
 *     在上一份计划上增量修改; 结果里带 phases (OMP 的权威快照) 时以结果为准.
 * 状态: pending / in_progress / completed / cancelled (OMP 的 abandoned, Codex 的 dropped 都归 cancelled).
 * 有子项的大项状态由子项推出: 全部关闭 = 完成, 有开始的 = 进行中, 否则待办; 进度只数叶子 (同 OMP 的 closed / total).
 * 研究笔记: docs/dsh-conversation-research.md
 */
import { isSubAgent, partsOfAgent, type AgentTree } from "./agents";
import type { AgentMessage, AgentPart, ToolCallData } from "./types";

export type PlanStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface PlanItem {
  /** 稳定 id: 给了用给的, 否则按 "父 id / 内容" 生成 (同一项跨快照保持同一个 id, 动画按它认) */
  id: string;
  content: string;
  /** 自己的状态; 有子项时看 planStatus (由子项推出) */
  status: PlanStatus;
  /** 进行中时的说法 ("正在跑测试") */
  activeForm?: string;
  children: readonly PlanItem[];
}

/** 一次待办调用之后的计划, 以及这次改了什么 */
export interface PlanStep {
  callId: string;
  items: readonly PlanItem[];
  /** 这次新完成的项 (id) */
  completed: readonly string[];
  /** 新加的项 */
  added: readonly string[];
  /** 删掉的项 (内容) */
  removed: readonly string[];
  /** 这次开始的项 */
  started: readonly string[];
  /** 参数还在流式 (部分解析) */
  live: boolean;
}

export interface Plan {
  items: readonly PlanItem[];
  /** 最近一次更新计划的调用 */
  callId?: string;
  steps: readonly PlanStep[];
}

export interface PlanProgress {
  /** 已关闭 (完成 + 取消) 的叶子 */
  closed: number;
  completed: number;
  cancelled: number;
  total: number;
  /** 当前项: 最深的进行中叶子, 没有就是第一个待办叶子 */
  current?: PlanItem;
  /** 从根到当前项的 id */
  currentPath: readonly string[];
}

/** 工具名 (小写) 里这些算待办 / 计划工具 */
export const TODO_TOOL_NAMES: ReadonlySet<string> = new Set(["todo_write", "todowrite", "todo", "todos", "update_plan", "plan", "update_todos", "write_todos"]);

export const isTodoCall = (c: Pick<ToolCallData, "name">) => TODO_TOOL_NAMES.has(c.name.toLowerCase());

const CLOSED: ReadonlySet<PlanStatus> = new Set(["completed", "cancelled"]);
export const isClosedStatus = (s: PlanStatus) => CLOSED.has(s);

/** 各家的状态写法归一 */
export function normalizePlanStatus(raw: unknown): PlanStatus {
  const s = typeof raw === "string" ? raw.toLowerCase().replace(/[-\s]/g, "_") : "";
  if (s === "completed" || s === "done" || s === "complete" || s === "finished") return "completed";
  if (s === "in_progress" || s === "active" || s === "doing" || s === "running" || s === "started") return "in_progress";
  if (s === "cancelled" || s === "canceled" || s === "abandoned" || s === "dropped" || s === "skipped") return "cancelled";
  return "pending";
}

type Obj = Record<string, unknown>;
const obj = (x: unknown): Obj | undefined => (x && typeof x === "object" && !Array.isArray(x) ? (x as Obj) : undefined);
const arr = (x: unknown): unknown[] | undefined => (Array.isArray(x) ? x : undefined);
const text = (o: Obj | undefined, ...keys: string[]) => {
  for (const k of keys) {
    const v = o?.[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return undefined;
};

const CONTENT_KEYS = ["content", "step", "title", "text", "task", "name", "phase", "description"];
const CHILD_KEYS = ["children", "subtasks", "subTasks", "sub_tasks", "items", "tasks", "todos", "steps"];

const childId = (parent: string, content: string) => (parent ? `${parent}/${content}` : content);

function parseItem(x: unknown, parent: string): PlanItem | null {
  if (typeof x === "string") return x.trim() ? { id: childId(parent, x), content: x, status: "pending", children: [] } : null;
  const o = obj(x);
  const content = text(o, ...CONTENT_KEYS);
  if (!o || !content) return null;
  const id = text(o, "id") ?? childId(parent, content);
  let kids: unknown[] | undefined;
  for (const k of CHILD_KEYS) {
    kids = arr(o[k]);
    if (kids) break;
  }
  return {
    id,
    content,
    status: normalizePlanStatus(o.status ?? o.state),
    activeForm: text(o, "activeForm", "active_form"),
    children: parseList(kids ?? [], id),
  };
}

function parseList(list: readonly unknown[], parent = ""): PlanItem[] {
  const out: PlanItem[] = [];
  for (const x of list) {
    const it = parseItem(x, parent);
    if (it) out.push(it);
  }
  return out;
}

/** 调用里的完整快照: 参数 (todos / plan / phases / list) 或结果 (OMP 的 details.phases); 没有就是 null */
export function planSnapshotOf(c: Pick<ToolCallData, "args" | "result">): PlanItem[] | null {
  const a = c.args ?? {};
  const r = obj(c.result);
  const fromResult = arr(obj(r?.details)?.phases) ?? arr(r?.phases) ?? arr(r?.todos);
  if (fromResult) return parseList(fromResult);
  const op = typeof a.op === "string" ? a.op : undefined;
  if (op && op !== "init") return null;
  const list = arr(a.todos) ?? arr(a.plan) ?? arr(a.phases) ?? arr(a.list) ?? (op === "init" || !op ? arr(a.items) : undefined);
  if (!list) return null;
  // OMP 的扁平 init: { op: "init", phase?, items: ["a", "b"] } 是一个大项
  if (op === "init" && !arr(a.list) && arr(a.items) && typeof a.phase === "string") return parseList([{ name: a.phase, tasks: a.items }]);
  return parseList(list);
}

/* ---------------- OMP 的增量操作 ---------------- */

const mapItems = (items: readonly PlanItem[], fn: (it: PlanItem) => PlanItem | null): PlanItem[] => {
  const out: PlanItem[] = [];
  for (const it of items) {
    const next = fn({ ...it, children: mapItems(it.children, fn) });
    if (next) out.push(next);
  }
  return out;
};

const targetsOf = (a: Obj): string[] => {
  const t = a.task;
  if (typeof t === "string" && t) return [t];
  if (Array.isArray(t)) return t.filter((x): x is string => typeof x === "string" && !!x);
  return [];
};

/** 找第一个内容等于 content 的项 (先序) */
export function findPlanItem(items: readonly PlanItem[], match: (it: PlanItem) => boolean): PlanItem | undefined {
  for (const it of items) {
    if (match(it)) return it;
    const hit = findPlanItem(it.children, match);
    if (hit) return hit;
  }
  return undefined;
}

/**
 * 没有进行中的叶子时, 第一个待办叶子变成进行中 (OMP 的 normalizeInProgressTask). 多个进行中只在 start 时收成一个:
 * 纯 OMP 流程里本来就只有一个; 与 todo_write 快照混用时 (并行的子 Agent 各做各的) 不去压掉别的进行中项.
 */
function normalizeInProgress(items: PlanItem[]): PlanItem[] {
  if (flattenPlan(items).some((it) => !it.children.length && it.status === "in_progress")) return items;
  let started = false;
  return mapItems(items, (it) => {
    if (started || it.children.length || it.status !== "pending") return it;
    started = true;
    return { ...it, status: "in_progress" };
  });
}

function applyOp(prev: readonly PlanItem[], a: Obj): PlanItem[] {
  const op = a.op;
  const tasks = targetsOf(a);
  const named = tasks.length ? tasks : (arr(a.items)?.filter((x): x is string => typeof x === "string") ?? []);
  const phase = typeof a.phase === "string" ? a.phase : undefined;
  const hit = (it: PlanItem) => named.includes(it.content) || (!named.length && !!phase && it.content === phase);
  const setStatus = (status: PlanStatus) =>
    mapItems(prev, (it) => {
      if (!hit(it)) return it;
      // 点名大项: 它的子项一起改
      return it.children.length ? { ...it, children: mapItems(it.children, (c) => ({ ...c, status })) } : { ...it, status };
    });
  switch (op) {
    case "start": {
      const target = tasks[0];
      return mapItems(prev, (it) => (it.children.length ? it : it.content === target ? { ...it, status: "in_progress" } : it.status === "in_progress" ? { ...it, status: "pending" } : it));
    }
    case "done":
      return normalizeInProgress(setStatus("completed"));
    case "drop":
      return normalizeInProgress(setStatus("cancelled"));
    case "rm":
      return normalizeInProgress(mapItems(prev, (it) => (hit(it) ? null : it)));
    case "append": {
      const add = arr(a.items)?.filter((x): x is string => typeof x === "string") ?? [];
      if (!add.length) return [...prev];
      // 没点名大项: 加到当前项所在的大项, 没有就加到最后一个大项 (OMP 同款)
      const cur = planProgress(prev).currentPath[0];
      const name = phase ?? (cur ? prev.find((p) => p.id === cur)?.content : prev.at(-1)?.content);
      const owner = name !== undefined ? prev.find((p) => p.content === name && p.children.length) : undefined;
      if (!owner) {
        if (phase) return normalizeInProgress([...prev, { id: phase, content: phase, status: "pending", children: parseList(add, phase) }]);
        return normalizeInProgress([...prev, ...parseList(add)]);
      }
      return normalizeInProgress(prev.map((p) => (p === owner ? { ...p, children: [...p.children, ...parseList(add, p.id).filter((n) => !p.children.some((c) => c.id === n.id))] } : p)));
    }
    default:
      return [...prev];
  }
}

/* ---------------- 进度 ---------------- */

/** 大项的状态由子项推出; 叶子就是自己的状态 */
export function planStatus(it: PlanItem): PlanStatus {
  if (!it.children.length) return it.status;
  const kids = it.children.map(planStatus);
  if (kids.every((s) => s === "cancelled")) return "cancelled";
  if (kids.every(isClosedStatus)) return "completed";
  if (kids.some((s) => s !== "pending")) return "in_progress";
  return it.status === "in_progress" ? "in_progress" : "pending";
}

/** 叶子计数与当前项 (只数叶子) */
export function planProgress(items: readonly PlanItem[]): PlanProgress {
  let closed = 0;
  let completed = 0;
  let cancelled = 0;
  let total = 0;
  let active: { item: PlanItem; path: string[] } | undefined;
  let pending: { item: PlanItem; path: string[] } | undefined;
  const walk = (list: readonly PlanItem[], path: string[]) => {
    for (const it of list) {
      const p = [...path, it.id];
      if (it.children.length) {
        walk(it.children, p);
        continue;
      }
      total++;
      if (it.status === "completed") completed++;
      if (it.status === "cancelled") cancelled++;
      if (isClosedStatus(it.status)) closed++;
      if (it.status === "in_progress" && !active) active = { item: it, path: p };
      if (it.status === "pending" && !pending) pending = { item: it, path: p };
    }
  };
  walk(items, []);
  const cur = active ?? pending;
  return { closed, completed, cancelled, total, current: cur?.item, currentPath: cur?.path ?? [] };
}

/** 所有项 (先序) */
export function flattenPlan(items: readonly PlanItem[]): PlanItem[] {
  const out: PlanItem[] = [];
  const walk = (list: readonly PlanItem[]) => {
    for (const it of list) {
      out.push(it);
      walk(it.children);
    }
  };
  walk(items);
  return out;
}

function diffPlan(prev: readonly PlanItem[], next: readonly PlanItem[]): Pick<PlanStep, "completed" | "added" | "removed" | "started"> {
  const before = new Map(flattenPlan(prev).map((it) => [it.id, planStatus(it)]));
  const after = flattenPlan(next);
  const ids = new Set(after.map((it) => it.id));
  const completed: string[] = [];
  const added: string[] = [];
  const started: string[] = [];
  for (const it of after) {
    const was = before.get(it.id);
    const now = planStatus(it);
    if (was === undefined) {
      if (prev.length) added.push(it.id);
      continue;
    }
    if (now === "completed" && was !== "completed") completed.push(it.id);
    if (now === "in_progress" && was === "pending" && !it.children.length) started.push(it.id);
  }
  const removed = flattenPlan(prev)
    .filter((it) => !ids.has(it.id))
    .map((it) => it.content);
  return { completed, added, removed, started };
}

/* ---------------- 从会话派生 ---------------- */

/** 按顺序折叠一串 part 里的待办调用 (失败的调用不算; 参数还在流式的快照照用, 操作等参数完整再算) */
export function planFromParts(parts: readonly AgentPart[]): Plan {
  let items: readonly PlanItem[] = [];
  let callId: string | undefined;
  const steps: PlanStep[] = [];
  for (const p of parts) {
    if (p.type !== "tool" || !isTodoCall(p.call)) continue;
    const c = p.call;
    if (c.status === "error" || c.status === "denied") continue;
    const live = c.status === "preparing";
    const snap = planSnapshotOf(c);
    let next: readonly PlanItem[] | null = snap;
    if (!next && !live && typeof c.args?.op === "string") next = c.args.op === "view" ? null : applyOp(items, c.args);
    if (!next) continue;
    steps.push({ callId: c.id, items: next, live, ...diffPlan(items, next) });
    items = next;
    callId = c.id;
  }
  return { items, callId, steps };
}

/**
 * 某个 Agent 的计划: 给 agentId 时取它的 part (partsOfAgent); 不给是主线程 (去掉子 Agent 自己的消息与 part).
 * 子 Agent 也写待办时, 各自一份.
 */
export function planOf(messages: readonly AgentMessage[], tree?: AgentTree, agentId?: string): Plan {
  if (agentId && tree) return planFromParts(partsOfAgent(messages, tree, agentId));
  const parts: AgentPart[] = [];
  for (const m of messages) {
    if (tree?.order.length && isSubAgent(tree, m.agentId)) continue;
    for (const p of m.parts) if (!tree?.order.length || !p.agentId || !isSubAgent(tree, p.agentId)) parts.push(p);
  }
  return planFromParts(parts);
}

/** 一步更新的一句话摘要: "完成 写用例 · 新增 2 项" */
export function describePlanStep(step: PlanStep): string {
  const name = (id: string) => findPlanItem(step.items, (it) => it.id === id)?.content ?? id;
  const bits: string[] = [];
  if (step.completed.length) bits.push(`完成 ${step.completed.slice(0, 2).map(name).join("、")}${step.completed.length > 2 ? ` 等 ${step.completed.length} 项` : ""}`);
  if (step.started.length) bits.push(`开始 ${name(step.started[0])}`);
  if (step.added.length) bits.push(`新增 ${step.added.length} 项`);
  if (step.removed.length) bits.push(`移除 ${step.removed.length} 项`);
  return bits.join(" · ");
}
