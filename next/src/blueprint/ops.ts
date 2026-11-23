import { addComment, boxAround, moveComment, removeComments, updateComment } from "./comment";
import { connect } from "./connect";
import { createIdGen, type IdGen } from "./ids";
import { findPin, parsePinRef } from "./ports";
import type { Registry } from "./registry";
import { REROUTE } from "./registry";
import { collapse, expand, subgraphAsGraph, writeSubgraph } from "./subgraph";
import type { BlueprintGraph, BlueprintNode, CommentTone, PinRef } from "./types";

/**
 * JSON edit operations. One vocabulary for the UI, the history, and AI agents:
 *
 *   applyOps(graph, [
 *     { op: "addNode", id: "sum", type: "math.add", at: [200, 80] },
 *     { op: "connect", from: "a.out", to: "sum.a" },
 *   ], registry)
 *
 * Ops apply in order. A failing op is skipped and reported, the rest still apply (pass
 * `atomic: true` to roll back everything on any error). An id requested by an op that is already
 * taken gets a fresh id, and later ops in the same batch that use the requested id are redirected.
 */

export type XY = readonly [number, number] | { readonly x: number; readonly y: number };
/** "node.pin" or { node, pin }. */
export type PinInput = string | PinRef;

export type GraphOp =
  | { readonly op: "addNode"; readonly type: string; readonly id?: string; readonly at?: XY; readonly title?: string; readonly values?: Readonly<Record<string, unknown>> }
  | { readonly op: "removeNode"; readonly id: string | readonly string[] }
  | { readonly op: "moveNode"; readonly id: string; readonly to?: XY; readonly by?: XY }
  | { readonly op: "updateNode"; readonly id: string; readonly title?: string | null; readonly comment?: string | null; readonly collapsed?: boolean; readonly width?: number | null }
  | { readonly op: "connect"; readonly from: PinInput; readonly to: PinInput; readonly convert?: boolean }
  | { readonly op: "disconnect"; readonly edge?: string; readonly pin?: PinInput; readonly from?: PinInput; readonly to?: PinInput }
  | { readonly op: "setValue"; readonly node: string; readonly key: string; readonly value?: unknown; readonly unset?: boolean }
  | { readonly op: "addComment"; readonly id?: string; readonly around?: readonly string[]; readonly at?: XY; readonly size?: XY; readonly title?: string; readonly body?: string; readonly tone?: CommentTone }
  | { readonly op: "updateComment"; readonly id: string; readonly title?: string; readonly body?: string; readonly tone?: CommentTone; readonly at?: XY; readonly size?: XY; readonly moveWithNodes?: boolean }
  | { readonly op: "moveComment"; readonly id: string; readonly to: XY; readonly carry?: boolean }
  | { readonly op: "removeComment"; readonly id: string | readonly string[] }
  | { readonly op: "collapse"; readonly nodes: readonly string[]; readonly id?: string; readonly label?: string }
  | { readonly op: "expand"; readonly node: string; readonly keepDefinition?: boolean }
  | { readonly op: "addReroute"; readonly edge?: string; readonly at?: XY; readonly id?: string };

export interface OpError {
  readonly index: number;
  readonly op: string;
  readonly message: string;
}

export interface ApplyResult {
  readonly graph: BlueprintGraph;
  readonly errors: readonly OpError[];
  /** Requested id -> actual id, for every id an op created (including generated ones, keyed `#<index>`). */
  readonly created: Readonly<Record<string, string>>;
}

export interface ApplyOptions {
  readonly ids?: IdGen;
  readonly atomic?: boolean;
  /** Apply inside this subgraph definition instead of the outer graph. */
  readonly subgraph?: string;
}

const xy = (p: XY): { x: number; y: number } => ("x" in p ? { x: p.x, y: p.y } : { x: p[0], y: p[1] });

export function applyOps(graph: BlueprintGraph, ops: readonly GraphOp[], registry: Registry, opts: ApplyOptions = {}): ApplyResult {
  if (opts.subgraph !== undefined) {
    const inner = subgraphAsGraph(graph, opts.subgraph);
    if (!inner) return { graph, errors: [{ index: -1, op: "*", message: `Subgraph "${opts.subgraph}" not found` }], created: {} };
    const r = applyOps(inner, ops, registry, { ...opts, subgraph: undefined, ids: opts.ids ?? createIdGen(graph) } as ApplyOptions);
    const root = { ...graph, ...(r.graph.subgraphs ? { subgraphs: r.graph.subgraphs } : {}) };
    return { ...r, graph: writeSubgraph(root, opts.subgraph, r.graph) };
  }

  const ids = opts.ids ?? createIdGen(graph);
  const alias = new Map<string, string>();
  const created: Record<string, string> = {};
  const errors: OpError[] = [];
  const real = (id: string) => alias.get(id) ?? id;
  const ref = (p: PinInput): PinRef => {
    const r = typeof p === "string" ? parsePinRef(p) : p;
    return { node: real(r.node), pin: r.pin ?? "" };
  };
  /** Use the requested id when free, otherwise a generated one, and remember the redirect. */
  const claim = (g: BlueprintGraph, requested: string | undefined, prefix: string, index: number) => {
    const taken = requested !== undefined && (g.nodes.some((n) => n.id === requested) || g.edges.some((e) => e.id === requested) || (g.comments ?? []).some((c) => c.id === requested) || !!g.subgraphs?.[requested]);
    const id = requested === undefined || taken ? ids(prefix) : requested;
    if (requested !== undefined) alias.set(requested, id);
    created[requested ?? `#${index}`] = id;
    return id;
  };

  let g = graph;
  ops.forEach((op, index) => {
    const fail = (message: string) => errors.push({ index, op: op.op, message });
    const node = (id: string) => g.nodes.find((n) => n.id === real(id));
    switch (op.op) {
      case "addNode": {
        if (!registry.node(op.type)) return fail(`Unknown node type "${op.type}"`);
        const at = op.at ? xy(op.at) : { x: 0, y: 0 };
        const n: BlueprintNode = {
          id: claim(g, op.id, "n", index), type: op.type, ...at,
          ...(op.title !== undefined ? { title: op.title } : {}),
          ...(op.values && Object.keys(op.values).length ? { values: { ...op.values } } : {}),
        };
        g = { ...g, nodes: [...g.nodes, n] };
        return;
      }
      case "removeNode": {
        const gone = new Set((typeof op.id === "string" ? [op.id] : op.id).map(real));
        if (![...gone].every((id) => node(id))) return fail(`Node not found: ${[...gone].filter((id) => !node(id)).join(", ")}`);
        g = { ...g, nodes: g.nodes.filter((n) => !gone.has(n.id)), edges: g.edges.filter((e) => !gone.has(e.from.node) && !gone.has(e.to.node)) };
        return;
      }
      case "moveNode": {
        const n = node(op.id);
        if (!n) return fail(`Node "${op.id}" not found`);
        const to = op.to ? xy(op.to) : { x: n.x + (op.by ? xy(op.by).x : 0), y: n.y + (op.by ? xy(op.by).y : 0) };
        g = { ...g, nodes: g.nodes.map((x) => (x.id === n.id ? { ...x, ...to } : x)) };
        return;
      }
      case "updateNode": {
        const n = node(op.id);
        if (!n) return fail(`Node "${op.id}" not found`);
        const next: Record<string, unknown> = { ...n };
        for (const k of ["title", "comment", "collapsed", "width"] as const) {
          if (op[k] === null) delete next[k];
          else if (op[k] !== undefined) next[k] = op[k];
        }
        g = { ...g, nodes: g.nodes.map((x) => (x.id === n.id ? (next as unknown as BlueprintNode) : x)) };
        return;
      }
      case "connect": {
        const r = connect(g, ref(op.from), ref(op.to), registry, ids, { convert: op.convert ?? true });
        if (r.error) return fail(r.error.message);
        g = r.graph;
        r.edges.forEach((id, i) => (created[`#${index}${i ? `.${i}` : ""}`] = id));
        if (r.conversionNode) created[`#${index}.conversion`] = r.conversionNode;
        return;
      }
      case "disconnect": {
        const pin = op.pin !== undefined ? ref(op.pin) : undefined;
        const from = op.from !== undefined ? ref(op.from) : undefined;
        const to = op.to !== undefined ? ref(op.to) : undefined;
        const hit = (e: (typeof g.edges)[number]) =>
          (op.edge !== undefined && e.id === op.edge)
          || (pin && ((e.from.node === pin.node && e.from.pin === pin.pin) || (e.to.node === pin.node && e.to.pin === pin.pin)))
          || (from && to && e.from.node === from.node && e.from.pin === from.pin && e.to.node === to.node && e.to.pin === to.pin);
        const kept = g.edges.filter((e) => !hit(e));
        if (kept.length === g.edges.length) return fail("No matching wire");
        g = { ...g, edges: kept };
        return;
      }
      case "setValue": {
        const n = node(op.node);
        if (!n) return fail(`Node "${op.node}" not found`);
        const def = registry.node(n.type);
        const known = def?.params.some((p) => p.id === op.key) || findPin(n, op.key, "in", registry, g);
        if (!known) return fail(`"${n.id}" has no param or input "${op.key}"`);
        const { [op.key]: _old, ...rest } = n.values ?? {};
        void _old;
        const values = op.unset || op.value === undefined ? rest : { ...rest, [op.key]: op.value };
        const { values: _v, ...bare } = n;
        void _v;
        const next: BlueprintNode = Object.keys(values).length ? { ...bare, values } : bare;
        g = { ...g, nodes: g.nodes.map((x) => (x.id === n.id ? next : x)) };
        return;
      }
      case "addComment": {
        const box = op.around ? boxAround(g, op.around.map(real), registry) : undefined;
        if (op.around && !box) return fail("addComment.around matched no nodes");
        const at = op.at ? xy(op.at) : { x: box?.x ?? 0, y: box?.y ?? 0 };
        const size = op.size ? xy(op.size) : { x: box?.w ?? 240, y: box?.h ?? 140 };
        const r = addComment(g, {
          id: claim(g, op.id, "c", index), x: at.x, y: at.y, w: size.x, h: size.y,
          ...(op.title !== undefined ? { title: op.title } : {}), ...(op.body !== undefined ? { body: op.body } : {}), ...(op.tone ? { tone: op.tone } : {}),
        }, ids);
        g = r.graph;
        return;
      }
      case "updateComment": {
        const id = real(op.id);
        if (!g.comments?.some((c) => c.id === id)) return fail(`Comment "${op.id}" not found`);
        const { op: _o, id: _i, at, size, ...patch } = op;
        void _o, void _i;
        g = updateComment(g, id, { ...patch, ...(at ? xy(at) : {}), ...(size ? { w: xy(size).x, h: xy(size).y } : {}) });
        return;
      }
      case "moveComment": {
        const id = real(op.id);
        if (!g.comments?.some((c) => c.id === id)) return fail(`Comment "${op.id}" not found`);
        g = moveComment(g, id, xy(op.to), registry, op.carry !== undefined ? { carry: op.carry } : {});
        return;
      }
      case "removeComment": {
        const list = (typeof op.id === "string" ? [op.id] : op.id).map(real);
        if (!list.every((id) => g.comments?.some((c) => c.id === id))) return fail("Comment not found");
        g = removeComments(g, list);
        return;
      }
      case "collapse": {
        const r = collapse(g, op.nodes.map(real), registry, ids, {
          id: op.id === undefined ? ids("sg") : claim(g, op.id, "sg", index), ...(op.label !== undefined ? { label: op.label } : {}),
        });
        if (r.error) return fail(r.error);
        g = r.graph;
        created[`#${index}`] = r.node!;
        return;
      }
      case "expand": {
        const r = expand(g, real(op.node), registry, ids, op.keepDefinition ? { keepDefinition: true } : {});
        if (r.error) return fail(r.error);
        g = r.graph;
        return;
      }
      case "addReroute": {
        const e = op.edge !== undefined ? g.edges.find((x) => x.id === op.edge) : undefined;
        if (op.edge !== undefined && !e) return fail(`Wire "${op.edge}" not found`);
        const src = e ? node(e.from.node) : undefined;
        const type = (src && e && findPin(src, e.from.pin, "out", registry, g)?.type) ?? "any";
        const dst = e ? node(e.to.node) : undefined;
        const at = op.at ? xy(op.at) : src && dst ? { x: Math.round((src.x + dst.x) / 2), y: Math.round((src.y + dst.y) / 2) } : { x: 0, y: 0 };
        const rr: BlueprintNode = {
          id: claim(g, op.id, "n", index), type: REROUTE, ...at,
          pins: { inputs: [{ id: "in", type }], outputs: [{ id: "out", type }] },
        };
        const edges = e
          ? [...g.edges.filter((x) => x.id !== e.id), { id: e.id, from: e.from, to: { node: rr.id, pin: "in" } }, { id: ids("e"), from: { node: rr.id, pin: "out" }, to: e.to }]
          : g.edges;
        g = { ...g, nodes: [...g.nodes, rr], edges };
        return;
      }
    }
  });

  if (opts.atomic && errors.length) return { graph, errors, created: {} };
  return { graph: g, errors, created };
}
