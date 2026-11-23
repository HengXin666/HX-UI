import { addComment, boxAround } from "../comment";
import { canConnect, connect } from "../connect";
import { createIdGen, slugId } from "../ids";
import { applyLayout, autoLayout, countCrossings, countOverlaps, type LayoutOptions } from "../layout";
import { getPorts, parsePinRef, type ResolvedPin } from "../ports";
import type { Registry } from "../registry";
import type { BlueprintGraph, BlueprintNode, CommentTone, PinRef } from "../types";
import { validateGraph } from "../validate";

/**
 * Lenient-input, strict-output graph builder for LLMs.
 *
 * - Node ids come from the agent's `key` (slugged), so they are stable and readable.
 * - A wire end may be "key", "key.pin" or { node, pin }. Missing pins are inferred: exec-to-exec
 *   first, then the first compatible free data pair. Exclusive pins already wired are skipped,
 *   so "branch -> a" then "branch -> b" lands on `true` then `false`.
 * - Every wire goes through canConnect. Rejections come back with the reason and the pins that exist.
 * - Nodes without coordinates are auto-laid out, then checked for overlaps (retried with more room).
 */

export interface AgentNode {
  readonly key?: string;
  readonly type: string;
  readonly title?: string;
  readonly values?: Readonly<Record<string, unknown>>;
  readonly x?: number;
  readonly y?: number;
}

export type AgentEnd = string | PinRef;

export interface AgentInput {
  readonly nodes: readonly AgentNode[];
  readonly edges?: readonly { readonly from: AgentEnd; readonly to: AgentEnd }[];
  readonly comments?: readonly { readonly title?: string; readonly body?: string; readonly tone?: CommentTone; readonly nodes?: readonly string[] }[];
  readonly layout?: LayoutOptions;
}

export interface RejectedWire {
  readonly from: string;
  readonly to: string;
  readonly reason: string;
  readonly message: string;
}

export interface AgentBuildResult {
  readonly ok: boolean;
  readonly graph: BlueprintGraph;
  /** Agent key -> node id. */
  readonly ids: Readonly<Record<string, string>>;
  readonly rejected: readonly RejectedWire[];
  readonly warnings: readonly string[];
  readonly layout: { readonly auto: boolean; readonly overlaps: number; readonly crossings: number; readonly retries: number };
}

const endText = (e: AgentEnd) => (typeof e === "string" ? e : `${e.node}.${e.pin}`);
const pinList = (ps: readonly ResolvedPin[]) => ps.map((p) => `${p.id}:${p.type}`).join(", ") || "none";

export function buildGraph(registry: Registry, input: AgentInput): AgentBuildResult {
  const warnings: string[] = [];
  const rejected: RejectedWire[] = [];
  const ids: Record<string, string> = {};
  const nodes: BlueprintNode[] = [];
  const used = new Set<string>();

  for (const n of input.nodes) {
    const base = slugId(n.key ?? n.type.split(".").pop() ?? "n");
    let id = base;
    for (let i = 2; used.has(id); i++) id = `${base}_${i}`;
    used.add(id);
    if (n.key !== undefined) {
      if (ids[n.key] !== undefined) warnings.push(`Duplicate key "${n.key}", the second one became "${id}"`);
      else ids[n.key] = id;
    } else ids[id] = id;
    if (!registry.node(n.type)) warnings.push(`Unknown node type "${n.type}" (node "${id}" is kept but will not validate)`);
    nodes.push({
      id, type: n.type, x: n.x ?? 0, y: n.y ?? 0,
      ...(n.title !== undefined ? { title: n.title } : {}),
      ...(n.values ? { values: { ...n.values } } : {}),
    });
  }

  let graph: BlueprintGraph = { nodes, edges: [] };
  const idGen = createIdGen(graph);
  for (const e of input.edges ?? []) {
    const f = typeof e.from === "string" ? parsePinRef(e.from) : { node: e.from.node, pin: e.from.pin };
    const t = typeof e.to === "string" ? parsePinRef(e.to) : { node: e.to.node, pin: e.to.pin };
    const reject = (reason: string, message: string) => rejected.push({ from: endText(e.from), to: endText(e.to), reason, message });
    const fromId = ids[f.node] ?? (used.has(f.node) ? f.node : undefined);
    const toId = ids[t.node] ?? (used.has(t.node) ? t.node : undefined);
    if (!fromId || !toId) {
      reject("missing-node", `No node "${!fromId ? f.node : t.node}". Known keys: ${Object.keys(ids).join(", ")}`);
      continue;
    }
    const pair = pickPins(graph, fromId, f.pin, toId, t.pin, registry);
    if (!pair.ok) {
      reject(pair.reason, pair.message);
      continue;
    }
    const r = connect(graph, pair.from, pair.to, registry, idGen);
    if (r.error) {
      reject(r.error.reason, r.error.message);
      continue;
    }
    if (r.conversionNode) warnings.push(`Inserted conversion node "${r.conversionNode}" for ${endText(e.from)} -> ${endText(e.to)}`);
    graph = r.graph;
  }

  // Layout: nodes the agent placed stay put.
  const explicit = graph.nodes.filter((_n, i) => i < input.nodes.length && input.nodes[i]!.x !== undefined && input.nodes[i]!.y !== undefined).map((n) => n.id);
  const auto = explicit.length < graph.nodes.length;
  let overlaps = countOverlaps(graph, registry);
  let retries = 0;
  if (auto) {
    let nodeGap = input.layout?.nodeGap ?? 40;
    let iterations = input.layout?.iterations ?? 4;
    for (let attempt = 0; attempt < 4; attempt++) {
      graph = applyLayout(graph, autoLayout(graph, registry, { ...input.layout, nodeGap, iterations, preserve: explicit }));
      overlaps = countOverlaps(graph, registry);
      if (!overlaps) break;
      nodeGap += 28;
      iterations += 2;
      retries++;
    }
  } else if (overlaps) warnings.push(`${overlaps} overlapping nodes in the given coordinates (left as given)`);

  for (const c of input.comments ?? []) {
    const box = boxAround(graph, (c.nodes ?? []).map((k) => ids[k] ?? k), registry) ?? { x: 0, y: 0, w: 240, h: 140 };
    graph = addComment(graph, {
      ...box, ...(c.title !== undefined ? { title: c.title } : {}), ...(c.body !== undefined ? { body: c.body } : {}), ...(c.tone ? { tone: c.tone } : {}),
    }, idGen).graph;
  }

  for (const i of validateGraph(graph, registry).issues) if (i.code === "missing-input") warnings.push(i.message);
  return {
    ok: graph.nodes.length > 0 && rejected.length === 0,
    graph, ids, rejected, warnings,
    layout: { auto, overlaps, crossings: countCrossings(graph), retries },
  };
}

type PinPair =
  | { readonly ok: true; readonly from: PinRef; readonly to: PinRef }
  | { readonly ok: false; readonly reason: string; readonly message: string };

/** Choose the pin pair for a wire whose pins may be omitted. */
function pickPins(g: BlueprintGraph, fromId: string, fromPin: string | undefined, toId: string, toPin: string | undefined, reg: Registry): PinPair {
  const fp = getPorts(g.nodes.find((n) => n.id === fromId)!, reg, g);
  const tp = getPorts(g.nodes.find((n) => n.id === toId)!, reg, g);
  const outs = fromPin !== undefined ? fp.outputs.filter((p) => p.id === fromPin) : fp.outputs;
  const ins = toPin !== undefined ? tp.inputs.filter((p) => p.id === toPin) : tp.inputs;
  if (fromPin !== undefined && !outs.length) return { ok: false, reason: "missing-pin", message: `"${fromId}" has no output "${fromPin}". Outputs: ${pinList(fp.outputs)}` };
  if (toPin !== undefined && !ins.length) return { ok: false, reason: "missing-pin", message: `"${toId}" has no input "${toPin}". Inputs: ${pinList(tp.inputs)}` };

  const busy = (node: string, pin: string, dir: "from" | "to") => g.edges.some((e) => e[dir].node === node && e[dir].pin === pin);
  const pairs: [ResolvedPin, ResolvedPin][] = [];
  for (const exec of [true, false]) {
    for (const o of outs) for (const i of ins) if (o.exec === exec && i.exec === exec) pairs.push([o, i]);
  }
  const free = pairs.filter(([o, i]) => (fromPin !== undefined || o.multi || !busy(fromId, o.id, "from")) && (toPin !== undefined || i.multi || !busy(toId, i.id, "to")));
  let firstFail: PinPair | undefined;
  let converted: PinPair | undefined;
  for (const [o, i] of free) {
    const from = { node: fromId, pin: o.id };
    const to = { node: toId, pin: i.id };
    const v = canConnect(g, from, to, reg);
    if (v.ok && !v.conversion) return { ok: true, from, to };
    if (v.ok) converted ??= { ok: true, from, to };
    else firstFail ??= { ok: false, reason: v.reason, message: v.message };
  }
  return converted ?? firstFail ?? {
    ok: false, reason: "no-compatible-pins",
    message: `No free compatible pins from "${fromId}" (outputs: ${pinList(fp.outputs)}) to "${toId}" (inputs: ${pinList(tp.inputs)})`,
  };
}
