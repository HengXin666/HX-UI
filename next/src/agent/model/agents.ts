/**
 * 多 Agent 调度的数据层 (纯函数, 无 "use client").
 * agent-spawn / agent-status / agent-handoff / agent-message 四种事件 -> AgentTree (父子树 + 消息 / 交接记录),
 * 再由下面的选择器给出 "某个 Agent 的子节点", "进行中 / 完成几个", "谁在等谁", "某个 Agent 的工具段 / 最新输出".
 * 与 events.ts 的消息 reducer 并行: reduceAgentEvent 把这四种事件转给 reduceAgentTree, 其余事件仍只动消息.
 * 只改动到的节点换新对象, 其余引用不变, 视图可以逐个节点 memo.
 */
import { TOOL_DONE, type AgentMessage, type AgentPart, type ToolCallData, type ToolStatus } from "./types";

/** Agent 的来源: 模型派出的子 Agent, 一条后台命令, 监视器, 后台任务 */
export type AgentKind = "subagent" | "command" | "monitor" | "background_task";

export type AgentRunStatus = "queued" | "running" | "awaiting-approval" | "awaiting-input" | "done" | "error" | "interrupted";

/** 已经结束的状态 */
export const AGENT_DONE: ReadonlySet<AgentRunStatus> = new Set(["done", "error", "interrupted"]);
/** 停下来等人的状态 (审批 / 回答), 视图里置顶高亮 */
export const AGENT_WAITING: ReadonlySet<AgentRunStatus> = new Set(["awaiting-approval", "awaiting-input"]);

/** 新派出的 Agent. parentAgentId 缺省即根 (编排者); messageId + callId 指向派它的那次工具调用 (如 task), 用来把 tool-child 的子时间线归给它 */
export interface AgentSpawnEvent {
  type: "agent-spawn";
  agentId: string;
  parentAgentId?: string;
  name?: string;
  role?: string;
  model?: string;
  kind?: AgentKind;
  /** 任务描述 */
  task?: string;
  /** 初始状态, 默认 queued */
  status?: AgentRunStatus;
  at?: number;
  messageId?: string;
  callId?: string;
  meta?: Record<string, unknown>;
}

export interface AgentStatusEvent {
  type: "agent-status";
  agentId: string;
  status: AgentRunStatus;
  at?: number;
  /** 最新一步的摘要 ("正在跑测试", "等待批准 rm -rf dist") */
  summary?: string;
  /** 正在等哪些 Agent (依赖); 不给就是不在等别的 Agent */
  waitingOn?: string | readonly string[];
}

/** A 把任务交给 B */
export interface AgentHandoffEvent {
  type: "agent-handoff";
  from: string;
  to: string;
  /** 交接说明 */
  note?: string;
  at?: number;
  id?: string;
}

/** Agent 之间传递的消息 / 子 Agent 回传给父 Agent 的结果摘要 */
export interface AgentMessageEvent {
  type: "agent-message";
  from: string;
  to: string;
  text: string;
  /** result = 子 Agent 交回结果; message = 过程中的普通消息. 默认 message */
  kind?: "result" | "message";
  at?: number;
  id?: string;
}

export type AgentTreeEvent = AgentSpawnEvent | AgentStatusEvent | AgentHandoffEvent | AgentMessageEvent;

export interface AgentStatusEntry {
  status: AgentRunStatus;
  at: number;
  summary?: string;
  waitingOn?: readonly string[];
}

export interface AgentNode {
  id: string;
  parentId?: string;
  name: string;
  role?: string;
  model?: string;
  kind: AgentKind;
  task?: string;
  status: AgentRunStatus;
  /** 最新一步的摘要 */
  summary?: string;
  /** 正在等的 Agent */
  waitingOn?: readonly string[];
  spawnedAt: number;
  /** 第一次进入 running */
  startedAt?: number;
  /** 进入结束状态的时刻; 重新运行时清掉 */
  endedAt?: number;
  /** 子 Agent id, 按派出顺序 */
  children: readonly string[];
  /** 状态变化记录 (泳道按它画段) */
  history: readonly AgentStatusEntry[];
  /** 发出 / 收到的 link id (消息与交接) */
  sent: readonly string[];
  received: readonly string[];
  messageId?: string;
  callId?: string;
  meta?: Record<string, unknown>;
  /** 只在别的事件里被提到过, 还没收到 agent-spawn */
  placeholder?: boolean;
}

export interface AgentLink {
  id: string;
  kind: "handoff" | "message" | "result";
  from: string;
  to: string;
  text?: string;
  at: number;
}

export interface AgentTree {
  nodes: Readonly<Record<string, AgentNode>>;
  /** 第一次出现的顺序 */
  order: readonly string[];
  /** 消息与交接, 按到达顺序 */
  links: readonly AgentLink[];
}

export const emptyAgentTree = (): AgentTree => ({ nodes: {}, order: [], links: [] });

const AGENT_EVENT_TYPES: ReadonlySet<string> = new Set(["agent-spawn", "agent-status", "agent-handoff", "agent-message"]);
export const isAgentTreeEvent = (e: { type: string }): e is AgentTreeEvent => AGENT_EVENT_TYPES.has(e.type);

const toList = (w: string | readonly string[] | undefined): readonly string[] | undefined => (w === undefined ? undefined : typeof w === "string" ? [w] : w.length ? w : undefined);

const placeholder = (id: string, at: number): AgentNode => ({ id, name: id, kind: "subagent", status: "queued", spawnedAt: at, children: [], history: [], sent: [], received: [], placeholder: true });

function put(tree: AgentTree, node: AgentNode): AgentTree {
  const known = node.id in tree.nodes;
  return { ...tree, nodes: { ...tree.nodes, [node.id]: node }, order: known ? tree.order : [...tree.order, node.id] };
}

function ensure(tree: AgentTree, id: string, at: number): AgentTree {
  return id in tree.nodes ? tree : put(tree, placeholder(id, at));
}

function withStatus(n: AgentNode, status: AgentRunStatus, at: number, summary: string | undefined, waitingOn: readonly string[] | undefined): AgentNode {
  return {
    ...n,
    status,
    summary: summary ?? n.summary,
    waitingOn,
    startedAt: n.startedAt ?? (status === "queued" ? undefined : at),
    endedAt: AGENT_DONE.has(status) ? (n.endedAt ?? at) : undefined,
    history: [...n.history, { status, at, summary, waitingOn }],
  };
}

function spawn(tree: AgentTree, e: AgentSpawnEvent, at: number): AgentTree {
  const prev = tree.nodes[e.agentId];
  const status = e.status ?? prev?.status ?? "queued";
  // 先到的子节点 (父还没 spawn) 在父 spawn 时收回来
  const orphans = tree.order.filter((id) => tree.nodes[id].parentId === e.agentId && !prev?.children.includes(id));
  let node: AgentNode = {
    ...(prev ?? placeholder(e.agentId, at)),
    parentId: e.parentAgentId ?? prev?.parentId,
    name: e.name ?? (prev && !prev.placeholder ? prev.name : (e.role ?? e.agentId)),
    role: e.role ?? prev?.role,
    model: e.model ?? prev?.model,
    kind: e.kind ?? prev?.kind ?? "subagent",
    task: e.task ?? prev?.task,
    spawnedAt: prev && !prev.placeholder ? prev.spawnedAt : at,
    messageId: e.messageId ?? prev?.messageId,
    callId: e.callId ?? prev?.callId,
    meta: e.meta ?? prev?.meta,
    children: [...(prev?.children ?? []), ...orphans],
    placeholder: undefined,
  };
  // 先收到 status 再收到 spawn 时不要把状态退回 queued
  if (e.status || !prev || (prev.placeholder && !prev.history.length)) node = withStatus(node, status, at, undefined, undefined);
  let out = put(tree, node);
  const pid = node.parentId;
  if (pid && pid !== node.id) {
    out = ensure(out, pid, at);
    const parent = out.nodes[pid];
    if (!parent.children.includes(node.id)) out = put(out, { ...parent, children: [...parent.children, node.id] });
  }
  return out;
}

function link(tree: AgentTree, l: AgentLink): AgentTree {
  let out = ensure(ensure(tree, l.from, l.at), l.to, l.at);
  const from = out.nodes[l.from];
  out = put(out, { ...from, sent: [...from.sent, l.id] });
  const to = out.nodes[l.to];
  out = put(out, { ...to, received: [...to.received, l.id] });
  return { ...out, links: [...out.links, l] };
}

export function reduceAgentTree(tree: AgentTree, e: AgentTreeEvent): AgentTree {
  const at = e.at ?? Date.now();
  switch (e.type) {
    case "agent-spawn":
      return spawn(tree, e, at);
    case "agent-status": {
      const t = ensure(tree, e.agentId, at);
      return put(t, withStatus(t.nodes[e.agentId], e.status, at, e.summary, toList(e.waitingOn)));
    }
    case "agent-handoff":
      return link(tree, { id: e.id ?? `handoff:${tree.links.length}`, kind: "handoff", from: e.from, to: e.to, text: e.note, at });
    case "agent-message": {
      const kind = e.kind === "result" ? "result" : "message";
      return link(tree, { id: e.id ?? `${kind}:${tree.links.length}`, kind, from: e.from, to: e.to, text: e.text, at });
    }
    default:
      return tree;
  }
}

/* ---------------- 选择器 (纯函数) ---------------- */

const nodesOf = (tree: AgentTree, ids: readonly string[]) => ids.map((id) => tree.nodes[id]).filter((n): n is AgentNode => !!n);

/** 没有父, 或父不在树里的节点 */
export const agentRoots = (tree: AgentTree): AgentNode[] => nodesOf(tree, tree.order).filter((n) => !n.parentId || !(n.parentId in tree.nodes));

/** 按父取子; 不给父就取根 */
export const childrenOf = (tree: AgentTree, parentId?: string): AgentNode[] => (parentId ? nodesOf(tree, tree.nodes[parentId]?.children ?? []) : agentRoots(tree));

/** 先序遍历的所有后代 (不含自己) */
export function descendantsOf(tree: AgentTree, id: string): AgentNode[] {
  const out: AgentNode[] = [];
  const seen = new Set([id]);
  const walk = (pid: string) => {
    for (const c of childrenOf(tree, pid)) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      out.push(c);
      walk(c.id);
    }
  };
  walk(id);
  return out;
}

/** 整棵树按先序展开, 附带深度 (根为 0); 图和泳道都按这个顺序排 */
export function flattenAgentTree(tree: AgentTree): { node: AgentNode; depth: number }[] {
  const out: { node: AgentNode; depth: number }[] = [];
  const seen = new Set<string>();
  const walk = (n: AgentNode, depth: number) => {
    if (seen.has(n.id)) return;
    seen.add(n.id);
    out.push({ node: n, depth });
    for (const c of childrenOf(tree, n.id)) walk(c, depth + 1);
  };
  for (const r of agentRoots(tree)) walk(r, 0);
  return out;
}

export interface AgentCounts {
  total: number;
  queued: number;
  running: number;
  /** 等审批 + 等回答 */
  waiting: number;
  done: number;
  error: number;
  interrupted: number;
}

/** 统计各状态个数; 给 ids 就只数这些 (如某个父的子节点) */
export function countAgents(tree: AgentTree, ids: readonly string[] = tree.order): AgentCounts {
  const c: AgentCounts = { total: 0, queued: 0, running: 0, waiting: 0, done: 0, error: 0, interrupted: 0 };
  for (const n of nodesOf(tree, ids)) {
    c.total++;
    if (AGENT_WAITING.has(n.status)) c.waiting++;
    else if (n.status === "queued") c.queued++;
    else if (n.status === "running") c.running++;
    else if (n.status === "done") c.done++;
    else if (n.status === "error") c.error++;
    else c.interrupted++;
  }
  return c;
}

/** 一条等待关系: to 为 null 表示在等用户 (审批 / 回答) */
export interface AgentWait {
  from: string;
  to: string | null;
  reason: "dependency" | "awaiting-approval" | "awaiting-input";
}

/** 谁在等谁. 已结束的 Agent 不再等; 被等的 Agent 已结束的依赖也去掉 */
export function agentWaits(tree: AgentTree): AgentWait[] {
  const out: AgentWait[] = [];
  for (const n of nodesOf(tree, tree.order)) {
    if (AGENT_DONE.has(n.status)) continue;
    if (n.status === "awaiting-approval" || n.status === "awaiting-input") out.push({ from: n.id, to: null, reason: n.status });
    for (const w of n.waitingOn ?? []) if (!AGENT_DONE.has(tree.nodes[w]?.status ?? "done")) out.push({ from: n.id, to: w, reason: "dependency" });
  }
  return out;
}

/** 停在等人的 Agent, 先等的在前 */
export const pendingAgents = (tree: AgentTree): AgentNode[] =>
  nodesOf(tree, tree.order)
    .filter((n) => AGENT_WAITING.has(n.status))
    .sort((a, b) => (a.history.at(-1)?.at ?? 0) - (b.history.at(-1)?.at ?? 0));

/** 某个 Agent 发出 / 收到的消息与交接 */
export function linksOf(tree: AgentTree, id: string): { sent: AgentLink[]; received: AgentLink[] } {
  const byId = new Map(tree.links.map((l) => [l.id, l]));
  const pick = (ids: readonly string[]) => ids.map((x) => byId.get(x)).filter((l): l is AgentLink => !!l);
  const n = tree.nodes[id];
  return n ? { sent: pick(n.sent), received: pick(n.received) } : { sent: [], received: [] };
}

/** 运行时长的起止; 还没结束的用 now */
export function agentSpan(n: AgentNode, now: number): { start: number; end: number } {
  const start = n.startedAt ?? n.spawnedAt;
  return { start, end: n.endedAt ?? Math.max(start, now) };
}

export type AgentSegmentKind = "queued" | "run" | "wait" | "done";

/** 泳道上的一段状态 */
export interface AgentSegment {
  kind: AgentSegmentKind;
  status: AgentRunStatus;
  start: number;
  end: number;
  summary?: string;
  waitingOn?: readonly string[];
}

const segKind = (h: AgentStatusEntry): AgentSegmentKind =>
  AGENT_WAITING.has(h.status) || h.waitingOn?.length ? "wait" : h.status === "queued" ? "queued" : AGENT_DONE.has(h.status) ? "done" : "run";

/** 按状态记录切段, 相邻同类同等待对象的段合并; 结束状态只占一个点 (start === end) */
export function agentSegments(n: AgentNode, now: number): AgentSegment[] {
  const out: AgentSegment[] = [];
  n.history.forEach((h, i) => {
    const next = n.history[i + 1];
    const kind = segKind(h);
    const end = kind === "done" ? h.at : (next?.at ?? Math.max(h.at, now));
    const last = out.at(-1);
    if (last && last.kind === kind && last.status === h.status && (last.waitingOn ?? []).join() === (h.waitingOn ?? []).join()) {
      out[out.length - 1] = { ...last, end, summary: h.summary ?? last.summary };
      return;
    }
    out.push({ kind, status: h.status, start: h.at, end, summary: h.summary, waitingOn: h.waitingOn });
  });
  return out;
}

/** 某个 Agent 的 part: part.agentId 或所在消息的 agentId 等于它, 以及派它的那次工具调用 (tool-child) 的子时间线 */
export function partsOfAgent(messages: readonly AgentMessage[], tree: AgentTree, id: string): AgentPart[] {
  const byCall = new Map<string, string>();
  for (const aid of tree.order) {
    const c = tree.nodes[aid]?.callId;
    if (c) byCall.set(c, aid);
  }
  const out: AgentPart[] = [];
  const visit = (parts: readonly AgentPart[], owner: string | undefined) => {
    for (const p of parts) {
      const who = p.agentId ?? owner;
      if (who === id) out.push(p);
      if (p.type === "tool" && p.call.children?.length) visit(p.call.children, byCall.get(p.id) ?? who);
    }
  };
  for (const m of messages) visit(m.parts, m.agentId);
  return out;
}

export interface AgentToolSpan {
  id: string;
  name: string;
  status: ToolStatus;
  start: number;
  end: number;
}

/** 某个 Agent 的工具调用段 (泳道画在运行段上) */
export function toolSpansOfAgent(messages: readonly AgentMessage[], tree: AgentTree, id: string, now: number): AgentToolSpan[] {
  const out: AgentToolSpan[] = [];
  for (const p of partsOfAgent(messages, tree, id)) {
    if (p.type !== "tool" || p.call.startedAt === undefined) continue;
    const end = p.call.endedAt ?? (TOOL_DONE.has(p.call.status) ? p.call.startedAt : Math.max(p.call.startedAt, now));
    out.push({ id: p.id, name: p.call.name, status: p.call.status, start: p.call.startedAt, end });
  }
  return out;
}

/** 子 Agent 此刻在做的事: 最新一段文字 / 思考的尾部, 或正在跑的工具 (命令 + 输出尾部) */
export interface AgentTail {
  kind: "text" | "reasoning" | "tool" | "summary";
  /** 尾部文字 (已折叠空白, 太长时只留末尾 max 个字符, 开头不带省略号; 截没截看 cut) */
  text: string;
  /** 前缀: "思考" / "运行 npm test" 一类; 文字时没有 */
  label?: string;
  /** 还在生成 / 运行 */
  live: boolean;
  /** text 是否截掉了开头 */
  cut: boolean;
}

const TOOL_VERB: [RegExp, string][] = [
  [/todo|plan/i, "更新计划"],
  [/bash|shell|exec|command|terminal|run/i, "运行"],
  [/read|view|cat|open/i, "读取"],
  [/edit|write|patch|apply|create/i, "编辑"],
  [/grep|glob|search|find|list|ls/i, "搜索"],
  [/fetch|web|http|browse/i, "抓取"],
];

/** 工具调用的一行: "运行 npm test" / "读取 src/a.ts" / 工具名 */
export function toolLine(call: Pick<ToolCallData, "name" | "args">): string {
  const a = call.args ?? {};
  let target: string | undefined;
  for (const k of ["command", "cmd", "file_path", "path", "pattern", "url", "query", "description"]) {
    const v = a[k];
    if (typeof v === "string" && v.trim()) {
      target = v.trim().split("\n")[0];
      break;
    }
    if (Array.isArray(v) && v.every((x) => typeof x === "string")) {
      target = v.join(" ");
      break;
    }
  }
  const verb = TOOL_VERB.find(([re]) => re.test(call.name))?.[1];
  if (verb === "更新计划") return verb;
  if (!target) return call.name;
  return `${verb ?? call.name} ${target}`;
}

const squash = (s: string) => s.replace(/\s+/g, " ").trim();
const tailOf = (s: string, max: number) => (s.length > max ? { text: s.slice(-max), cut: true } : { text: s, cut: false });

/**
 * 子 Agent 最新输出的尾部 (节点卡片 / 卡片墙 / 切换器的预览): 看它最后一个部件 ——
 * 文字 / 思考取末尾 max 个字符 (流式时随 token 前进), 工具取 "运行 xxx" 加输出末尾 (运行中也算),
 * 什么都没有时用状态摘要或任务. 与 latestOutput 不同, 不会跳过正在跑的工具或思考停在更早的文字上.
 */
export function agentTail(messages: readonly AgentMessage[], tree: AgentTree, id: string, max = 240): AgentTail | undefined {
  const parts = partsOfAgent(messages, tree, id);
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    if (p.type === "text" || p.type === "reasoning") {
      const t = squash(p.text);
      if (!t) continue;
      return { kind: p.type, ...tailOf(t, max), label: p.type === "reasoning" ? "思考" : undefined, live: !!p.streaming };
    }
    if (p.type === "tool") {
      const c = p.call;
      // 派发子 Agent 的调用不算它自己的输出 (那是孩子的)
      if (tree.order.some((aid) => tree.nodes[aid].callId === p.id && aid !== id)) continue;
      const label = toolLine(c);
      // 计划调用的结果 ("ok") 没有信息量
      const out = label === "更新计划" ? "" : squash(c.output ?? (typeof c.result === "string" ? c.result : "") ?? c.error ?? "");
      return { kind: "tool", label, ...tailOf(out, max), live: !TOOL_DONE.has(c.status) };
    }
  }
  const n = tree.nodes[id];
  const s = n?.summary ?? n?.task;
  return s ? { kind: "summary", ...tailOf(squash(s), max), live: false } : undefined;
}

/** 卡片上的 "最新一步" (一行文字): agentTail 的标签与尾部合在一起, 截掉开头时前置省略号 */
export function latestOutput(messages: readonly AgentMessage[], tree: AgentTree, id: string, max = 140): string | undefined {
  const t = agentTail(messages, tree, id, max);
  if (!t) return undefined;
  const body = `${t.cut ? "…" : ""}${t.text}`;
  return t.label ? (t.text ? `${t.label} · ${body}` : t.label) : body;
}

/* ---------------- 会话里的编排块 ---------------- */

/** 有父 (父在树里) 的节点: 子 Agent. 编排者 / 主线程本身不算 */
export const isSubAgent = (tree: AgentTree, id: string | undefined): boolean => {
  const n = id ? tree.nodes[id] : undefined;
  return !!n?.parentId && n.parentId in tree.nodes;
};

/**
 * 这条消息派出的 Agent: spawn 记着这条消息, 或记着这条消息里的某次工具调用 (task / agent).
 * 会话里在这条消息的轨迹中渲染编排块, 就按这个找.
 */
export function dispatchedAgents(tree: AgentTree, messageId: string, callIds: readonly string[] = []): AgentNode[] {
  const calls = new Set(callIds);
  return nodesOf(tree, tree.order).filter((n) => n.messageId === messageId || (!!n.callId && calls.has(n.callId)));
}

/**
 * 只保留 rootIds 与它们后代的子树 (同一棵树的视图, 节点对象复用): 编排块只画这条消息派出的那一支.
 * 根节点的父被去掉之外的父子关系保留; 只连着子树外节点的消息 / 交接去掉.
 */
export function pickSubtree(tree: AgentTree, rootIds: readonly string[]): AgentTree {
  const keep = new Set<string>();
  for (const id of rootIds) {
    if (!(id in tree.nodes)) continue;
    keep.add(id);
    for (const d of descendantsOf(tree, id)) keep.add(d.id);
  }
  if (keep.size === tree.order.length) return tree;
  const nodes: Record<string, AgentNode> = {};
  for (const id of keep) {
    const n = tree.nodes[id];
    nodes[id] = n.parentId && !keep.has(n.parentId) ? { ...n, parentId: undefined } : n;
  }
  return { nodes, order: tree.order.filter((id) => keep.has(id)), links: tree.links.filter((l) => keep.has(l.from) && keep.has(l.to)) };
}

/** 主线程的消息: 去掉子 Agent 自己的消息 (它们在编排块和子 Agent 轨迹里看) */
export const threadMessages = (messages: readonly AgentMessage[], tree: AgentTree): AgentMessage[] =>
  tree.order.length ? messages.filter((m) => !isSubAgent(tree, m.agentId)) : (messages as AgentMessage[]);

/** 子 Agent 停下来等人: 哪个 Agent, 卡在哪次调用 (等批准的调用 / 提问), 找不到调用时只有状态摘要 */
export interface AgentRequest {
  agent: AgentNode;
  call?: Extract<AgentPart, { type: "tool" }>["call"];
}

/** ids 里 (默认整棵树) 正在等审批 / 回答的 Agent 及其调用, 先等的在前. 父线程把它们上浮显示, 标明来源 */
export function pendingRequests(messages: readonly AgentMessage[], tree: AgentTree, ids?: readonly string[]): AgentRequest[] {
  const scope = ids ? new Set(ids) : null;
  return pendingAgents(tree)
    .filter((n) => !scope || scope.has(n.id))
    .map((agent) => {
      const parts = partsOfAgent(messages, tree, agent.id);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        if (p.type !== "tool") continue;
        const want = agent.status === "awaiting-approval" ? p.call.status === "awaiting-approval" : !TOOL_DONE.has(p.call.status);
        if (want) return { agent, call: p.call };
      }
      return { agent };
    });
}

/**
 * 编排块的范围: 这条消息派出的 Agent 及其后代; 给了 rootId (派发者, 通常是编排者) 且它在树里时一并画上,
 * 但它的子节点只留这次派出的那几个 (同一个编排者在别的消息里派的不混进来).
 */
export function orchestraScope(tree: AgentTree, agentIds: readonly string[], rootId?: string): AgentTree {
  const sub = pickSubtree(tree, agentIds);
  const root = rootId ? tree.nodes[rootId] : undefined;
  if (!root || rootId! in sub.nodes) return sub;
  const kids = new Set(agentIds);
  const nodes: Record<string, AgentNode> = { [root.id]: { ...root, parentId: undefined, children: root.children.filter((c) => kids.has(c)) } };
  for (const id of sub.order) nodes[id] = kids.has(id) && tree.nodes[id].parentId === root.id ? tree.nodes[id] : sub.nodes[id];
  const keep = new Set([root.id, ...sub.order]);
  return { nodes, order: tree.order.filter((id) => keep.has(id)), links: tree.links.filter((l) => keep.has(l.from) && keep.has(l.to)) };
}
