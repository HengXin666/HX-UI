import type {
  BlueprintComment, BlueprintEdge, BlueprintGraph, BlueprintNode, BlueprintRegistry, PortRef,
} from "./types";
import { autoLayout, applyLayout, countCrossings, type LayoutOptions } from "./layout";
import { canConnect } from "./connect";
import { validateGraph } from "./validate";
import { parseGraph } from "./serialize";
import { makeId } from "./useBlueprint";

/**
 * 给 Agent 用的图构建 API。
 *
 * ## 为什么单独做一层
 *
 * 直接让 Agent 写 `BlueprintGraph` 的 JSON 会有三个必然出现的问题:
 *
 *   1. **坐标**。Agent 要么不写 (全 0, 节点叠成一坨), 要么瞎写 (互相压住)。
 *      让它算坐标是浪费 token, 而且它算不准。
 *   2. **id**。Agent 写的 id 会撞、会含空格、会在二次调用时变 —— 而连线靠 id 引用。
 *   3. **合法性**。它不知道哪些类型能连, 于是产出一批非法边, 图一打开全是红线。
 *
 * 所以这里的取舍是: **输入极宽松, 输出极严格**。
 *   - 输入: 不用坐标、可以用自己顺手的 key、可以按端口名连线
 *   - 输出: 坐标算好、id 稳定、非法边被拒且**说清为什么**
 *
 * ## 关于"默认布局不好看"
 *
 * Agent 产出的图不能是"能跑就行", 必须是人类愿意看的。所以:
 *   - 只要没显式给坐标, 就一定跑分层布局 (`autoLayout`)
 *   - 布局后**自检**: 有重叠就加大间距重排; 交叉数过多就多迭代几轮
 *   - 有环也能摆 (布局内部会拆回边), 不会退化成一坨
 *
 * 这条是硬要求, 不是优化项 —— 一张叠在一起的图对人类等于没有。
 */
// ── 输入形状 ──────────────────────────────────────────────────────────

/**
 * Agent 描述的一个节点。
 *
 * `key` 是 Agent 自己用的引用名 (如 "load"、"check"), 连线时用它;
 * 最终落地的节点 id 由这里生成 —— 稳定、可复现 (同一 key 同一前缀)。
 */
export interface AgentNode {
  /** Agent 侧的引用名。不写就用 type。 */
  readonly key?: string;
  readonly type: string;
  readonly title?: string;
  readonly params?: Readonly<Record<string, unknown>>;
  /** 显式坐标。给了就不参与自动布局 (但会参与防重叠检查)。 */
  readonly x?: number;
  readonly y?: number;
}

/**
 * Agent 描述的一条连线。
 *
 * 两端都可以简写:
 *   - `"a"`              = 节点 key 为 a 的第一个输出
 *   - `"a.out"`          = key 为 a 的 out 端口
 *   - `{ node: "a", port: "out" }`  完整写法
 *
 * 简写为什么值得做: 让 Agent 少写一半 token, 而且少写就少错。
 */
export type AgentEnd = string | PortRef;

export interface AgentEdge {
  readonly from: AgentEnd;
  readonly to: AgentEnd;
}

export interface AgentGraph {
  readonly nodes: readonly AgentNode[];
  readonly edges?: readonly AgentEdge[];
  /** 布局偏好。不写就用默认值, 并且会做质量自检。 */
  readonly layout?: LayoutOptions;
}

/** 区间的注释。让 Agent 也能标注"这一块是干什么的"。 */
export interface AgentComment {
  readonly title?: string;
  readonly body?: string;
  /** 属于这个注释的节点 key。给了就自动算包围盒。 */
  readonly nodes?: readonly string[];
  readonly x?: number;
  readonly y?: number;
  readonly w?: number;
  readonly h?: number;
}

export interface AgentBuildInput {
  readonly nodes: readonly AgentNode[];
  readonly edges?: readonly AgentEdge[];
  readonly comments?: readonly AgentComment[];
  readonly layout?: LayoutOptions;
}

// ── 输出形状 ──────────────────────────────────────────────────────────

/** 构建结果。失败时 `ok` 为 false, 但**仍然给出能画的图** —— 见 build 的说明。 */
export interface AgentBuildResult {
  readonly ok: boolean;
  readonly graph: BlueprintGraph;
  /** key -> 实际节点 id。Agent 后续操作要用它。 */
  readonly ids: ReadonlyMap<string, string>;
  /** 被拒绝的连线及原因。 */
  readonly rejected: readonly {
    readonly from: string;
    readonly to: string;
    readonly reason: string;
    readonly message: string;
  }[];
  /** 其它问题 (未知类型、重复 key 等)。 */
  readonly warnings: readonly string[];
  /** 布局质量自检的结论。 */
  readonly layoutReport: {
    /** 有没有跑自动布局。 */
    readonly auto: boolean;
    /** 重叠对数 (应为 0)。 */
    readonly overlaps: number;
    /** 交叉数。 */
    readonly crossings: number;
    /** 为了达到零重叠, 重试了几次。 */
    readonly retries: number;
  };
}

// ── 端点解析 ──────────────────────────────────────────────────────────

function splitEnd(end: AgentEnd): { key: string; port?: string } {
  if (typeof end === "string") {
    const i = end.indexOf(".");
    if (i > 0) return { key: end.slice(0, i), port: end.slice(i + 1) };
    return { key: end };
  }
  return { key: end.node, port: end.port };
}

/**
 * 推断端口。
 *
 * Agent 只给了节点没给端口时, 取该节点**第一个**匹配方向的端口。
 * 这是最有用的默认: 绝大多数节点就一个主输出, 指名道姓是浪费。
 */
/**
 * 推断端口。
 *
 * 关键设计: **对端感知**。
 *
 * 只看一端推不准: 有的节点既有数据输出又有执行出口, 单看一端会取错端口,
 * 于是把合法的一对端点判成"执行流与数据流不能互连"。
 *
 * 所以改成: 先看对端能接什么, 再决定这端给什么。
 *   - 对端是 exec-in  -> 这端优先给执行出口
 *   - 对端是数据口    -> 这端优先给数据输出, 且类型要相容
 *
 * 这样 Agent 写 `{ from: "pre", to: "step" }` 就能连对, 不需要它知道
 * "preStep 有两个出口、第二个才是执行流" 这种实现细节。
 */
function inferPort(
  reg: BlueprintRegistry,
  node: BlueprintNode,
  dir: "in" | "out",
  hint?: string,
  peerNeedsExec?: boolean
): string | undefined {
  const def = reg.nodeTypes.get(node.type);
  const execOuts = def?.execOut?.map((e) => (typeof e === "string" ? e : e.id)) ?? [];
  const dataOuts = def?.outputs ?? [];
  const dataIns = def?.inputs ?? [];

  // 显式给了 hint 就以它为准 (Agent 指名了就别自作聪明)
  if (hint) {
    const known =
      execOuts.includes(hint) || dataOuts.some((p) => p.id === hint) || dataIns.some((p) => p.id === hint);
    if (known) return hint;
    // hint 不认识: 往下走, 用推断的
  }

  if (dir === "out") {
    // 对端要执行流 -> 优先执行出口
    if (peerNeedsExec && execOuts.length > 0) return execOuts[0];
    if (dataOuts.length > 0) return dataOuts[0].id;
    // 没有数据输出, 只有执行出口
    return execOuts[0];
  }

  // 入口: 目标有数据入口就给数据口, 否则给 exec-in
  if (dataIns.length > 0) return dataIns[0].id;
  return def?.execIn ? "exec-in" : undefined;
}

/**
 * 决定一对端点各自该用哪个端口 —— **双向**对端感知。
 *
 * 为什么单向不够: 有的节点只有执行出口, 有的只有数据入口。单向逻辑
 * 先看了对端再选源端口, 就会选出类型不匹配的那一个。
 * Agent 只是写了 `step -> stream`, 这个错不该由它承担。
 *
 * 解法: 先看两边各有什么, 能凑成执行流就凑执行流, 否则凑数据流。
 *   - 一边只有执行端口 -> 走执行流 (对端切 exec-in / execOut)
 *   - 否则 -> 走数据流
 */
function resolveEnds(
  reg: BlueprintRegistry,
  fromNode: BlueprintNode,
  toNode: BlueprintNode,
  fromHint: string | undefined,
  toHint: string | undefined
): { from: string; to: string } | undefined {
  const fDef = reg.nodeTypes.get(fromNode.type);
  const tDef = reg.nodeTypes.get(toNode.type);
  const fExec = fDef?.execOut?.map((e) => (typeof e === "string" ? e : e.id)) ?? [];
  const fData = fDef?.outputs ?? [];
  const tData = tDef?.inputs ?? [];
  const tExec = !!tDef?.execIn;

  // 显式 hint 优先
  if (fromHint && toHint) return { from: fromHint, to: toHint };

  const preferExec = tExec && (fExec.length > 0 && fData.length === 0);

  if (preferExec) {
    return { from: fromHint ?? fExec[0], to: toHint ?? "exec-in" };
  }

  // 数据优先
  if (fData.length > 0 && tData.length > 0) {
    return { from: fromHint ?? fData[0].id, to: toHint ?? tData[0].id };
  }
  // 退回执行流
  if (fExec.length > 0 && tExec) {
    return { from: fromHint ?? fExec[0], to: toHint ?? "exec-in" };
  }
  return undefined;
}


// ── 主入口 ────────────────────────────────────────────────────────────

/**
 * 从 Agent 的描述构建一张**人类可读**的图。
 *
 * 关键行为: **即使有错, 也返回能画的图**。
 *
 * 为什么: Agent 是迭代式的 —— 它先写一版, 看报错再修。如果非法就返回 null,
 * 它得凭空重试; 而返回一张"尽力修复过"的图 + 一份问题清单, 它下一轮就能
 * 精确改那一条。人类也能立刻看到半成品, 不至于一开就是空白。
 */
export function buildFromAgent(
  reg: BlueprintRegistry,
  input: AgentBuildInput
): AgentBuildResult {
  const warnings: string[] = [];
  const rejected: Array<{ from: string; to: string; reason: string; message: string }> = [];
  const ids = new Map<string, string>();

  // ── 1. 节点: 生成稳定 id ────────────────────────────────────────
  const nodes: BlueprintNode[] = [];
  const usedKeys = new Set<string>();
  for (const n of input.nodes) {
    const rawKey = n.key ?? n.type;
    let key = rawKey;
    if (usedKeys.has(key)) {
      // key 撞了不该抛 —— 给个后缀继续, 并在 warnings 里说一声
      let i = 2;
      while (usedKeys.has(`${rawKey}-${i}`)) i += 1;
      key = `${rawKey}-${i}`;
      warnings.push(`重复的 key "${rawKey}" 已改名为 "${key}"`);
    }
    usedKeys.add(key);

    if (!reg.nodeTypes.has(n.type)) {
      warnings.push(`未注册的节点类型: ${n.type} (节点 "${key}" 仍会创建, 但会显示为未知节点)`);
    }

    const id = makeId("n");
    ids.set(key, id);
    nodes.push({
      id,
      type: n.type,
      x: n.x ?? 0,
      y: n.y ?? 0,
      ...(n.title ? { title: n.title } : {}),
      ...(n.params ? { params: { ...n.params } } : {}),
    });
  }

  // ── 2. 连线: 逐条判定, 非法就拒并说明为什么 ────────────────────
  const edges: BlueprintEdge[] = [];
  const withNodes: BlueprintGraph = { nodes, edges: [] };

  for (const e of input.edges ?? []) {
    const f = splitEnd(e.from);
    const t = splitEnd(e.to);
    const fromId = ids.get(f.key);
    const toId = ids.get(t.key);
    if (!fromId || !toId) {
      rejected.push({
        from: String(e.from), to: String(e.to),
        reason: "missing-node",
        message: `找不到节点 "${!fromId ? f.key : t.key}" —— 可用: ${[...ids.keys()].join(", ")}`,
      });
      continue;
    }
    const fromNode = nodes.find((n) => n.id === fromId)!;
    const toNode = nodes.find((n) => n.id === toId)!;
    // 双向对端感知: 看两边各有什么, 再决定走执行流还是数据流
    const ends = resolveEnds(reg, fromNode, toNode, f.port, t.port);
    const fp = ends?.from;
    const tp = ends?.to;
    if (!fp || !tp) {
      rejected.push({
        from: String(e.from), to: String(e.to),
        reason: "missing-port",
        message: `无法为 "${f.key}"(${f.port ?? "?"}) → "${t.key}"(${t.port ?? "?"}) 找到端口`,
      });
      continue;
    }
    const from: PortRef = { node: fromId, port: fp };
    const to: PortRef = { node: toId, port: tp };
    const verdict = canConnect(reg, withNodes, from, to);
    if ("reason" in verdict) {
      rejected.push({ from: String(e.from), to: String(e.to), reason: verdict.reason, message: verdict.message });
      continue;
    }
    edges.push({ id: makeId("e"), from, to, kind: verdict.kind });
  }

  // ── 3. 布局: 只摆没给坐标的, 然后自检 ──────────────────────────
  const explicit = nodes.filter((n) => {
    const src = input.nodes.find((x) => x.key ?? x.type === n.type);
    return src?.x !== undefined && src?.y !== undefined;
  }).map((n) => n.id);

  let graph: BlueprintGraph = { nodes, edges };
  let overlaps = 0;
  let retries = 0;

  if (explicit.length < nodes.length) {
    // 有节点没给坐标 -> 跑自动布局
    const base = input.layout ?? {};
    let gapY = base.nodeGap ?? 40;
    let iterations = base.iterations ?? 4;
    for (let attempt = 0; attempt < 4; attempt++) {
      const layout = autoLayout(reg, graph, { ...base, nodeGap: gapY, iterations, preserve: explicit });
      graph = applyLayout(graph, layout, { preserve: explicit });
      overlaps = countOverlaps(reg, graph);
      if (overlaps === 0) break;
      // 还重叠: 加大间距再来。间距不够是最常见的重叠原因
      gapY += 28;
      iterations += 2;
      retries += 1;
    }
  } else {
    // 全给了坐标: 仍然检查重叠, 但不重排 (尊重显式坐标)
    overlaps = countOverlaps(reg, graph);
    if (overlaps > 0) {
      warnings.push(`显式坐标里有 ${overlaps} 处重叠 —— 未自动调整 (你给了坐标, 我尊重它)`);
    }
  }

  // 用刚算好的坐标评估 —— countCrossings 需要显式坐标
  const posForCross = new Map(graph.nodes.map((n) => [n.id, { x: n.x, y: n.y }]));
  const crossings = countCrossings(reg, graph, posForCross);

  // ── 4. 注释 ──────────────────────────────────────────────────────
  const comments: BlueprintComment[] = (input.comments ?? []).map((c): BlueprintComment => {
    if (c.x !== undefined && c.y !== undefined) {
      return {
        id: makeId("cm"),
        ...(c.title ? { title: c.title } : {}),
        ...(c.body ? { body: c.body } : {}),
        x: c.x,
        y: c.y,
        w: c.w ?? 240,
        h: c.h ?? 140,
      };
    }
    // 没给坐标: 按它包含的节点算包围盒
    const picked = (c.nodes ?? []).flatMap((k) => {
      const id = ids.get(k);
      const n = id ? graph.nodes.find((x) => x.id === id) : undefined;
      return n ? [n] : [];
    });
    if (picked.length === 0) {
      return {
        id: makeId("cm"),
        ...(c.title ? { title: c.title } : {}),
        ...(c.body ? { body: c.body } : {}),
        x: 0, y: 0, w: c.w ?? 240, h: c.h ?? 140,
      };
    }
    const pad = 24;
    const xs = picked.map((n) => n.x);
    const ys = picked.map((n) => n.y);
    return {
      id: makeId("cm"),
      ...(c.title ? { title: c.title } : {}),
      ...(c.body ? { body: c.body } : {}),
      x: Math.min(...xs) - pad,
      y: Math.min(...ys) - pad - 18,
      w: Math.max(...xs) - Math.min(...xs) + pad * 2 + 176,
      h: Math.max(...ys) - Math.min(...ys) + pad * 2 + 118,
    };
  });

  const finalGraph: BlueprintGraph = { ...graph, ...(comments.length ? { comments } : {}) };
  const v = validateGraph(reg, finalGraph);

  /**
   * 把"必填输入没连"明确列进 warnings。
   *
   * 校验层已经报了, 但那些报错挂在节点 id 上 (n1b2c3 这种), Agent 看到
   * 也不知道是哪个 key、该补什么。这里翻译成 key + 端口名, 它下一轮
   * 就能精确补一条边 —— 这正是"Agent 友好"该做的事。
   */
  const idToKey = new Map<string, string>();
  for (const [k, id] of ids) idToKey.set(id, k);
  for (const i of v.issues) {
    if (i.code !== "missing-input") continue;
    for (const nid of i.nodeIds ?? []) {
      const key = idToKey.get(nid);
      if (key) warnings.push(`节点 "${key}" 有必填输入没有连上: ${i.message}`);
    }
  }

  /**
   * `ok` 只表示"图建出来了、且没有连不上的边"。
   *
   * 刻意**不包含**校验通过: 少连一个必填输入是很常见的中间状态
   * (Agent 边写边补), 那种情况下图是能画、能看的, 报 ok:false 会让它
   * 以为整个调用失败了, 于是重来一遍 —— 而问题只是差一条边。
   * 校验结果仍然完整返回, 由 validate_graph 工具如实报告。
   */
  const ok = nodes.length > 0 && rejected.length === 0;

  return {
    ok,
    graph: finalGraph,
    ids,
    rejected,
    warnings,
    layoutReport: {
      auto: explicit.length < nodes.length,
      overlaps,
      crossings,
      retries,
    },
  };
}

/**
 * 数重叠的节点对数。
 *
 * 只比包围盒 —— 节点是矩形卡片, 包围盒相交就是视觉上压住了。
 */
export function countOverlaps(reg: BlueprintRegistry, graph: BlueprintGraph): number {
  let n = 0;
  const boxes = graph.nodes.map((node) => {
    const def = reg.nodeTypes.get(node.type);
    const h = nodeHeightOf(def);
    return { x: node.x, y: node.y, w: nodeWidthOf(def), h };
  });
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const b = boxes[j];
      if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) n += 1;
    }
  }
  return n;
}

/**
 * 节点尺寸。刻意不 import geometry 里的完整实现 (它会算 params 行数),
 * 这里只需要一个够用的估计值来做防重叠 —— 精确值留给渲染层。
 */
function nodeWidthOf(def: { readonly width?: number } | undefined): number {
  return def?.width ?? 176;
}
function nodeHeightOf(def: { readonly inputs?: readonly unknown[]; readonly outputs?: readonly unknown[]; readonly params?: readonly unknown[] } | undefined): number {
  const rows = Math.max(def?.inputs?.length ?? 0, def?.outputs?.length ?? 0);
  const params = def?.params?.length ?? 0;
  return 30 + 8 + rows * 20 + (params > 0 ? params * 24 + 6 : 0) + 8;
}

// ── 供 Agent 读取的图摘要 ──────────────────────────────────────────────

/**
 * 把一张图摘要成 Agent 好读的文本。
 *
 * 为什么不是直接给 JSON: JSON 里全是 id (n1b2c3 这种), Agent 读了一脸懵,
 * 而且 token 花在括号上。摘要给的是**语义**: 类型、标题、连线关系、问题。
 */
export function describeGraph(reg: BlueprintRegistry, graph: BlueprintGraph): string {
  const lines: string[] = [];
  for (const n of graph.nodes) {
    const def = reg.nodeTypes.get(n.type);
    const label = n.title ?? def?.label ?? n.type;
    const ins = graph.edges.filter((e) => e.to.node === n.id).map((e) => e.to.port);
    const outs = graph.edges.filter((e) => e.from.node === n.id).map((e) => e.from.port);
    const tail = [
      ins.length ? `入:${ins.join(",")}` : "",
      outs.length ? `出:${outs.join(",")}` : "",
    ].filter(Boolean).join(" ");
    lines.push(`- ${n.id}  ${label} (${n.type})${tail ? "  " + tail : ""}`);
  }
  const v = validateGraph(reg, graph);
  const errs = v.issues.filter((i) => i.level === "error");
  if (errs.length) lines.push("", `问题 ${errs.length} 处:`, ...errs.map((i) => `  ✕ ${i.message}`));
  return lines.join("\n");
}

/** 列出可注册的节点类型, 供 Agent 决定用哪个。 */
export function describeRegistry(reg: BlueprintRegistry): string {
  const byCat = new Map<string, string[]>();
  for (const def of reg.nodeTypes.values()) {
    const cat = def.category ?? "未分组";
    const ins = (def.inputs ?? []).map((p) => `${p.id}:${p.type}`).join(",");
    const outs = (def.outputs ?? []).map((p) => `${p.id}:${p.type}`).join(",");
    const exec = [def.execIn ? "execIn" : "", def.execOut?.length ? `execOut(${def.execOut.length})` : ""].filter(Boolean).join(" ");
    const line = `${def.type} — ${def.label}${ins ? ` | 入 ${ins}` : ""}${outs ? ` | 出 ${outs}` : ""}${exec ? ` | ${exec}` : ""}`;
    const list = byCat.get(cat);
    if (list) list.push(line); else byCat.set(cat, [line]);
  }
  return [...byCat.entries()].map(([cat, list]) => `【${cat}】\n  ${list.join("\n  ")}`).join("\n");
}

/** 从任意 JSON 读图 (Agent 可能直接吐 JSON)。容错: 坏数据返回 null。 */
export function graphFromJson(raw: unknown): BlueprintGraph | null {
  return parseGraph(raw);
}
