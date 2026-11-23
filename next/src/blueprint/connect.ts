import type { IdGen } from "./ids";
import { findPin, type Direction, type ResolvedPin } from "./ports";
import type { Registry } from "./registry";
import type { BlueprintEdge, BlueprintGraph, BlueprintNode, NodeDef, PinRef, SubgraphScope } from "./types";

/**
 * Connection rules. `canConnect` is the single verdict used while dragging (hover feedback)
 * and when committing (ops, agent builder, validation of new wires).
 *
 * Check order matters: existence first, then shape (exec vs data), then duplicates, then types,
 * then cycles. Reporting a type mismatch on a pin that does not exist would be noise.
 */

export type ConnectFailReason =
  | "missing-node"
  | "missing-pin"
  | "self-loop"
  | "exec-data-mix"
  | "duplicate"
  | "type-mismatch"
  | "cycle";

export type ConnectResult =
  | {
      readonly ok: true;
      /** Normalised ends: `from` is always the output. You may pass the ends in either order. */
      readonly from: PinRef;
      readonly to: PinRef;
      readonly kind: "exec" | "data";
      /** Existing edges this wire displaces (exclusive pins, UE5 "replace link"). */
      readonly replaces: readonly string[];
      /** Conversion node id to insert between the pins (UE5 autocast). */
      readonly conversion?: string;
    }
  | { readonly ok: false; readonly reason: ConnectFailReason; readonly message: string };

export interface ConnectableGraph extends SubgraphScope {
  readonly nodes: readonly BlueprintNode[];
  readonly edges: readonly BlueprintEdge[];
}

const fail = (reason: ConnectFailReason, message: string): ConnectResult => ({ ok: false, reason, message });

export function canConnect(graph: ConnectableGraph, a: PinRef, b: PinRef, registry: Registry): ConnectResult {
  const na = graph.nodes.find((n) => n.id === a.node);
  const nb = graph.nodes.find((n) => n.id === b.node);
  if (!na || !nb) return fail("missing-node", `Node "${!na ? a.node : b.node}" does not exist`);

  // Accept a drag that started on an input: swap so `from` is the output.
  let from = a, to = b;
  let src = findPin(na, a.pin, "out", registry, graph);
  let dst = findPin(nb, b.pin, "in", registry, graph);
  if (!src || !dst) {
    const s2 = findPin(nb, b.pin, "out", registry, graph);
    const d2 = findPin(na, a.pin, "in", registry, graph);
    if (s2 && d2) {
      [from, to, src, dst] = [b, a, s2, d2];
    }
  }
  if (!src) return fail("missing-pin", `"${from.node}" has no output pin "${from.pin}"`);
  if (!dst) return fail("missing-pin", `"${to.node}" has no input pin "${to.pin}"`);
  if (from.node === to.node) return fail("self-loop", "A node cannot be wired to itself");
  if (src.exec !== dst.exec) return fail("exec-data-mix", "Exec pins only connect to exec pins");

  const dup = graph.edges.some((e) => samePair(e, from, to));
  if (dup) return fail("duplicate", "These pins are already connected");

  let conversion: string | undefined;
  if (!registry.assignable(src.type, dst.type)) {
    conversion = src.exec ? undefined : registry.conversion(src.type, dst.type);
    if (!conversion) return fail("type-mismatch", `Type mismatch: ${src.type} -> ${dst.type}`);
  }

  const replaces = displaced(graph, from, src, to, dst);
  if (!src.exec && reachesByData(graph, to.node, from.node, new Set(replaces), registry)) {
    return fail("cycle", `Wiring ${from.node} -> ${to.node} would create a data cycle`);
  }

  return {
    ok: true, from, to, kind: src.exec ? "exec" : "data", replaces,
    ...(conversion ? { conversion } : {}),
  };
}

function samePair(e: BlueprintEdge, from: PinRef, to: PinRef): boolean {
  return e.from.node === from.node && e.from.pin === from.pin && e.to.node === to.node && e.to.pin === to.pin;
}

/** Edges an exclusive end would drop: data input / exec output keep one wire. */
function displaced(g: ConnectableGraph, from: PinRef, src: ResolvedPin, to: PinRef, dst: ResolvedPin): string[] {
  const out: string[] = [];
  for (const e of g.edges) {
    if (!dst.multi && e.to.node === to.node && e.to.pin === to.pin) out.push(e.id);
    else if (!src.multi && e.from.node === from.node && e.from.pin === from.pin) out.push(e.id);
  }
  return out;
}

/** Is `target` reachable from `start` along data edges (ignoring `skip`)? */
function reachesByData(g: ConnectableGraph, start: string, target: string, skip: ReadonlySet<string>, reg: Registry): boolean {
  const byId = new Map(g.nodes.map((n) => [n.id, n]));
  const seen = new Set<string>();
  const stack = [start];
  while (stack.length) {
    const u = stack.pop()!;
    if (u === target) return true;
    if (seen.has(u)) continue;
    seen.add(u);
    for (const e of g.edges) {
      if (e.from.node !== u || skip.has(e.id)) continue;
      const n = byId.get(u);
      if (n && !findPin(n, e.from.pin, "out", reg, g)?.exec) stack.push(e.to.node);
    }
  }
  return false;
}

// ---------------------------------------------------------------------------

export interface ConnectOutcome {
  readonly graph: BlueprintGraph;
  /** Ids of the edges added (two when a conversion node was inserted). */
  readonly edges: readonly string[];
  readonly conversionNode?: string;
  readonly error?: { readonly reason: ConnectFailReason; readonly message: string };
}

/**
 * Commit a wire: drop displaced edges, insert a conversion node when needed.
 * Set `convert: false` to refuse conversions instead of inserting them.
 */
export function connect(
  graph: BlueprintGraph, a: PinRef, b: PinRef, registry: Registry, ids: IdGen, opts: { readonly convert?: boolean } = {},
): ConnectOutcome {
  const v = canConnect(graph, a, b, registry);
  if (!v.ok) return { graph, edges: [], error: { reason: v.reason, message: v.message } };
  const kept = graph.edges.filter((e) => !v.replaces.includes(e.id));
  if (!v.conversion) {
    const id = ids("e");
    return { graph: { ...graph, edges: [...kept, { id, from: v.from, to: v.to }] }, edges: [id] };
  }
  if (opts.convert === false) {
    return { graph, edges: [], error: { reason: "type-mismatch", message: `Needs conversion node "${v.conversion}"` } };
  }
  const def = registry.node(v.conversion);
  const fromNode = graph.nodes.find((n) => n.id === v.from.node)!;
  const toNode = graph.nodes.find((n) => n.id === v.to.node)!;
  const srcType = findPin(fromNode, v.from.pin, "out", registry, graph)!.type;
  const dstType = findPin(toNode, v.to.pin, "in", registry, graph)!.type;
  const inPin = def?.inputs.find((p) => !registry.isExec(p.type) && registry.assignable(srcType, p.type));
  const outPin = def?.outputs.find((p) => !registry.isExec(p.type) && registry.assignable(p.type, dstType));
  if (!def || !inPin || !outPin) {
    return { graph, edges: [], error: { reason: "type-mismatch", message: `Conversion node "${v.conversion}" has no matching pins` } };
  }
  const convId = ids("n");
  const conv: BlueprintNode = {
    id: convId, type: def.id,
    x: Math.round((fromNode.x + toNode.x) / 2), y: Math.round((fromNode.y + toNode.y) / 2),
  };
  const e1 = ids("e");
  const e2 = ids("e");
  return {
    graph: {
      ...graph,
      nodes: [...graph.nodes, conv],
      edges: [...kept, { id: e1, from: v.from, to: { node: convId, pin: inPin.id } }, { id: e2, from: { node: convId, pin: outPin.id }, to: v.to }],
    },
    edges: [e1, e2],
    conversionNode: convId,
  };
}

// ---------------------------------------------------------------------------
// Drag-to-empty-space menu filter

export interface PinMatch {
  readonly node: NodeDef;
  /** Pin on the new node that the dragged wire would attach to. */
  readonly pin: string;
  /** Set when the match needs an autocast node. */
  readonly conversion?: string;
}

/**
 * Node types that can take a wire dragged from a pin of `pinType`.
 * `direction` is the direction of the DRAGGED pin: dragging from an output looks for inputs.
 * Direct matches come first, then matches through a conversion node. Internal nodes are skipped.
 */
export function nodesAcceptingPin(pinType: string, direction: Direction, registry: Registry): PinMatch[] {
  const direct: PinMatch[] = [];
  const converted: PinMatch[] = [];
  const exec = registry.isExec(pinType);
  for (const def of registry.nodes.values()) {
    if (def.internal) continue;
    const pins = direction === "out" ? def.inputs : def.outputs;
    const fits = (t: string) => (direction === "out" ? registry.assignable(pinType, t) : registry.assignable(t, pinType));
    const hit = pins.find((p) => registry.isExec(p.type) === exec && fits(p.type));
    if (hit) {
      direct.push({ node: def, pin: hit.id });
      continue;
    }
    if (exec) continue;
    for (const p of pins) {
      if (registry.isExec(p.type)) continue;
      const conv = direction === "out" ? registry.conversion(pinType, p.type) : registry.conversion(p.type, pinType);
      if (conv) {
        converted.push({ node: def, pin: p.id, conversion: conv });
        break;
      }
    }
  }
  const order = (a: PinMatch, b: PinMatch) =>
    a.node.category.localeCompare(b.node.category) || a.node.title.localeCompare(b.node.title);
  return [...direct.sort(order), ...converted.sort(order)];
}
