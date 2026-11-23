import { edgeKind, findPin, getPorts, subgraphPins } from "./ports";
import type { Registry } from "./registry";
import { TUNNEL_IN, TUNNEL_OUT } from "./registry";
import type { BlueprintEdge, BlueprintGraph, GraphValidation, ValidationIssue } from "./types";

/**
 * Static validation, layered:
 *   L1 structure: ids, node types, subgraph refs, edge ends
 *   L2 local: exec/data mix, types, duplicates, wire multiplicity, required inputs
 *   L3 global: cycles. Data-only cycles are errors (B1), exec loops are warnings (intentional loops are normal)
 *   L4 custom: NodeDef.validate hooks
 * Then every subgraph definition is validated once, issues prefixed with its label.
 */

export interface ValidateOptions {
  /** Require at least one exec entry (exec node without incoming exec wire) when the graph has exec nodes. */
  readonly requireEntry?: boolean;
}

type GraphView = Pick<BlueprintGraph, "nodes" | "edges" | "subgraphs" | "variables" | "locals">;

export function validateGraph(graph: BlueprintGraph, registry: Registry, opts: ValidateOptions = {}): GraphValidation {
  const issues = [...validateLevel(graph, registry, opts)];
  for (const [sgId, sg] of Object.entries(graph.subgraphs ?? {})) {
    const inner = validateLevel({
      nodes: sg.nodes, edges: sg.edges, subgraphs: graph.subgraphs,
      ...(graph.variables ? { variables: graph.variables } : {}), ...(sg.variables ? { locals: sg.variables } : {}),
    }, registry, {});
    if (sg.kind === "function") {
      const p = subgraphPins(sg.nodes);
      const execIn = p.inputs.filter((x) => registry.isExec(x.type)).length;
      const execOut = p.outputs.filter((x) => registry.isExec(x.type)).length;
      if (execIn > 1 || execOut > 1) {
        const shells = graph.nodes.filter((n) => n.subgraph === sgId).map((n) => n.id);
        issues.push({ code: "function-exec", level: "error", message: `Function "${sg.label ?? sgId}" has ${execIn} exec inputs and ${execOut} exec outputs (at most one each)`, nodeIds: shells.slice(0, 1) });
      }
    }
    for (const i of inner) {
      issues.push({
        ...i,
        message: `[${sg.label ?? sgId}] ${i.message}`,
        ...(i.nodeIds ? { nodeIds: i.nodeIds.map((id) => `${sgId}/${id}`) } : {}),
        ...(i.edgeIds ? { edgeIds: i.edgeIds.map((id) => `${sgId}/${id}`) } : {}),
      });
    }
  }
  const byNode = new Map<string, ValidationIssue[]>();
  const byEdge = new Map<string, ValidationIssue[]>();
  const add = (m: Map<string, ValidationIssue[]>, k: string, i: ValidationIssue) => m.set(k, [...(m.get(k) ?? []), i]);
  for (const i of issues) {
    for (const id of i.nodeIds ?? []) add(byNode, id, i);
    for (const id of i.edgeIds ?? []) add(byEdge, id, i);
  }
  return { ok: issues.every((i) => i.level !== "error"), issues, byNode, byEdge };
}

function validateLevel(g: GraphView, reg: Registry, opts: ValidateOptions): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  const push = (i: ValidationIssue) => out.push(i);
  const byId = new Map(g.nodes.map((n) => [n.id, n]));

  // L1: nodes
  const seenIds = new Set<string>();
  for (const n of g.nodes) {
    if (seenIds.has(n.id)) push({ code: "duplicate-id", level: "error", message: `Duplicate node id "${n.id}"`, nodeIds: [n.id] });
    seenIds.add(n.id);
    const ports = getPorts(n, reg, g);
    if (n.disabled) push({ code: "disabled-node", level: "warning", message: `Node "${n.id}" is disabled and will be skipped`, nodeIds: [n.id] });
    if (ports.missing === "variable") {
      push({ code: "unknown-variable", level: "error", message: `Variable "${n.variable ?? "?"}" not found`, nodeIds: [n.id] });
    } else if (ports.missing === "subgraph") {
      push({ code: "missing-subgraph", level: "error", message: `Collapsed graph "${n.subgraph ?? "?"}" not found`, nodeIds: [n.id] });
    } else if (ports.missing === "type") {
      push({ code: "unknown-node-type", level: "error", message: `Unknown node type "${n.type}"`, nodeIds: [n.id] });
    }
  }

  // L1 + L2: edges
  const live: BlueprintEdge[] = [];
  const seenPairs = new Set<string>();
  const wiresOn = new Map<string, BlueprintEdge[]>();
  const count = (key: string, e: BlueprintEdge) => wiresOn.set(key, [...(wiresOn.get(key) ?? []), e]);
  for (const e of g.edges) {
    const fn = byId.get(e.from.node);
    const tn = byId.get(e.to.node);
    if (!fn || !tn) {
      push({ code: "dangling-edge", level: "error", message: `Wire ${e.id} points to a missing node`, edgeIds: [e.id] });
      continue;
    }
    const src = findPin(fn, e.from.pin, "out", reg, g);
    const dst = findPin(tn, e.to.pin, "in", reg, g);
    if (!src || !dst) {
      const bad = !src ? e.from : e.to;
      push({ code: "unknown-pin", level: "error", message: `Pin "${bad.pin}" not found on "${bad.node}"`, edgeIds: [e.id], nodeIds: [bad.node], pin: bad });
      continue;
    }
    if (e.from.node === e.to.node) {
      push({ code: "self-loop", level: "error", message: `Node "${e.from.node}" is wired to itself`, edgeIds: [e.id], nodeIds: [e.from.node] });
      continue;
    }
    const pair = `${e.from.node}.${e.from.pin}>${e.to.node}.${e.to.pin}`;
    if (seenPairs.has(pair)) {
      push({ code: "duplicate-edge", level: "error", message: `Duplicate wire ${pair}`, edgeIds: [e.id] });
      continue;
    }
    seenPairs.add(pair);
    if (src.exec !== dst.exec) {
      push({ code: "exec-data-mix", level: "error", message: `Exec and data pins cannot be wired (${pair})`, edgeIds: [e.id], nodeIds: [e.to.node] });
      continue;
    }
    if (!reg.assignable(src.type, dst.type)) {
      push({ code: "type-mismatch", level: "error", message: `Type mismatch ${src.type} -> ${dst.type} (${pair})`, edgeIds: [e.id], nodeIds: [e.to.node], pin: e.to });
      continue;
    }
    live.push(e);
    if (!dst.multi) count(`in:${e.to.node}.${e.to.pin}`, e);
    if (!src.multi) count(`out:${e.from.node}.${e.from.pin}`, e);
  }

  // L2: multiplicity (B5 rules come from ResolvedPin.multi)
  for (const [key, es] of wiresOn) {
    if (es.length < 2) continue;
    const isIn = key.startsWith("in:");
    const ref = isIn ? es[0]!.to : es[0]!.from;
    push({
      code: isIn ? "input-occupied" : "output-occupied",
      level: "error",
      message: `${isIn ? "Input" : "Exec output"} ${ref.node}.${ref.pin} has ${es.length} wires but takes one`,
      edgeIds: es.map((x) => x.id), nodeIds: [ref.node], pin: ref,
    });
  }

  // L2: required inputs. Tunnel pins are fed from outside the subgraph, so they are never "missing".
  const wiredInputs = new Set(live.map((e) => `${e.to.node}.${e.to.pin}`));
  for (const n of g.nodes) {
    if (n.type === TUNNEL_IN || n.type === TUNNEL_OUT || n.disabled) continue;
    for (const p of getPorts(n, reg, g).inputs) {
      if (p.exec || wiredInputs.has(`${n.id}.${p.id}`)) continue;
      if (p.default !== undefined || n.values?.[p.id] !== undefined) continue;
      push({ code: "missing-input", level: "error", message: `Input "${p.label ?? p.id}" of "${n.id}" is not connected`, nodeIds: [n.id], pin: { node: n.id, pin: p.id } });
    }
  }

  // L3: cycles
  const dataEdges = live.filter((e) => edgeKind(g, e, reg) === "data");
  const execEdges = live.filter((e) => edgeKind(g, e, reg) === "exec");
  for (const cyc of findCycles(g.nodes.map((n) => n.id), dataEdges)) {
    push({ code: "cycle", level: "error", message: `Data cycle: ${cyc.join(" -> ")}`, nodeIds: cyc, edgeIds: cycleEdges(dataEdges, cyc) });
  }
  for (const cyc of findCycles(g.nodes.map((n) => n.id), execEdges)) {
    push({ code: "cycle", level: "warning", message: `Exec loop: ${cyc.join(" -> ")}`, nodeIds: cyc, edgeIds: cycleEdges(execEdges, cyc) });
  }

  // L4: custom hooks
  for (const n of g.nodes) {
    const def = reg.node(n.type);
    if (!def?.validate) continue;
    const inDegree: Record<string, number> = {};
    for (const p of getPorts(n, reg, g).inputs) inDegree[p.id] = live.filter((e) => e.to.node === n.id && e.to.pin === p.id).length;
    for (const i of def.validate({ node: n, def, inDegree })) push({ ...i, nodeIds: i.nodeIds ?? [n.id] });
  }

  if (opts.requireEntry) {
    const execNodes = g.nodes.filter((n) => getPorts(n, reg, g).inputs.some((p) => p.exec));
    const hasEntryEvent = g.nodes.some((n) => {
      const p = getPorts(n, reg, g);
      return !p.inputs.some((x) => x.exec) && p.outputs.some((x) => x.exec);
    });
    const fed = new Set(execEdges.map((e) => e.to.node));
    if (execNodes.length > 0 && !hasEntryEvent && execNodes.every((n) => fed.has(n.id))) {
      push({ code: "no-entry", level: "error", message: "Exec graph has no entry: every exec node has an upstream wire" });
    }
  }
  return out;
}

/** Edges that close the cycle, matched head-to-tail (not "both ends on the cycle", which over-collects). */
function cycleEdges(edges: readonly BlueprintEdge[], cycle: readonly string[]): string[] {
  const ids: string[] = [];
  cycle.forEach((from, i) => {
    const to = cycle[(i + 1) % cycle.length];
    for (const e of edges) if (e.from.node === from && e.to.node === to) ids.push(e.id);
  });
  return ids;
}

/** Elementary cycles found by DFS back edges, deduplicated by node set. Self-loops are reported elsewhere. */
export function findCycles(nodeIds: readonly string[], edges: readonly BlueprintEdge[]): string[][] {
  const adj = new Map<string, string[]>();
  for (const e of edges) {
    if (e.from.node === e.to.node) continue;
    adj.set(e.from.node, [...(adj.get(e.from.node) ?? []), e.to.node]);
  }
  const state = new Map<string, 1 | 2>(); // 1 = on stack, 2 = done
  const stack: string[] = [];
  const cycles: string[][] = [];
  const seen = new Set<string>();
  const visit = (u: string) => {
    state.set(u, 1);
    stack.push(u);
    for (const v of adj.get(u) ?? []) {
      const s = state.get(v);
      if (s === 1) {
        const cyc = stack.slice(stack.indexOf(v));
        const key = [...cyc].sort().join("|");
        if (!seen.has(key)) {
          seen.add(key);
          cycles.push(cyc);
        }
      } else if (s === undefined) visit(v);
    }
    stack.pop();
    state.set(u, 2);
  };
  for (const id of nodeIds) if (!state.has(id)) visit(id);
  return cycles;
}

/** Kahn topological order of node ids, or null when the edges contain a cycle. */
export function topoSort(nodeIds: readonly string[], edges: readonly BlueprintEdge[]): string[] | null {
  const indeg = new Map(nodeIds.map((id) => [id, 0]));
  const adj = new Map<string, string[]>();
  for (const e of edges) {
    if (e.from.node === e.to.node || !indeg.has(e.to.node) || !indeg.has(e.from.node)) continue;
    indeg.set(e.to.node, indeg.get(e.to.node)! + 1);
    adj.set(e.from.node, [...(adj.get(e.from.node) ?? []), e.to.node]);
  }
  const queue = nodeIds.filter((id) => indeg.get(id) === 0);
  const order: string[] = [];
  while (queue.length) {
    const u = queue.shift()!;
    order.push(u);
    for (const v of adj.get(u) ?? []) {
      const d = indeg.get(v)! - 1;
      indeg.set(v, d);
      if (d === 0) queue.push(v);
    }
  }
  return order.length === nodeIds.length ? order : null;
}

/** All nodes upstream of `nodeId` (transitively), following every edge backwards. */
export function upstreamOf(edges: readonly BlueprintEdge[], nodeId: string): Set<string> {
  const out = new Set<string>();
  const stack = [nodeId];
  while (stack.length) {
    const u = stack.pop()!;
    for (const e of edges) {
      if (e.to.node !== u || out.has(e.from.node)) continue;
      out.add(e.from.node);
      stack.push(e.from.node);
    }
  }
  return out;
}
