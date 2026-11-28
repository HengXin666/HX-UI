import { addComment, boxAround, moveComment, removeComments, updateComment } from "./comment";
import { connect } from "./connect";
import { createIdGen, type IdGen } from "./ids";
import { findPin, findVariable, parsePinRef, subgraphPins } from "./ports";
import type { Registry } from "./registry";
import { REROUTE, VAR_GET, VAR_SET } from "./registry";
import { collapse, expand, subgraphAsGraph, writeSubgraph } from "./subgraph";
import { createSubgraph, duplicateSubgraph, removeSubgraph, setPure, setSignature } from "./functions";
import { importLibrary, type BlueprintLibrary } from "./library";
import { TUNNEL_OUT } from "./registry";
import type { BlueprintGraph, BlueprintNode, CommentTone, GraphMeta, Pin, PinRef, SubgraphKind, VariableDef } from "./types";
import { PARAM_PREFIX } from "./types";

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
  | {
    readonly op: "addNode"; readonly type: string; readonly id?: string; readonly at?: XY; readonly title?: string; readonly values?: Readonly<Record<string, unknown>>;
    /** Call site of an existing function / macro / collapsed graph (with type "subgraph"). */
    readonly subgraph?: string;
    /** Variable id for "var.get" / "var.set". */
    readonly variable?: string;
  }
  | { readonly op: "removeNode"; readonly id: string | readonly string[] }
  | { readonly op: "moveNode"; readonly id: string; readonly to?: XY; readonly by?: XY }
  | {
    readonly op: "updateNode"; readonly id: string; readonly title?: string | null; readonly comment?: string | null; readonly collapsed?: boolean;
    readonly width?: number | null; readonly disabled?: boolean | null; readonly devOnly?: boolean | null; readonly commentPinned?: boolean | null;
  }
  | { readonly op: "connect"; readonly from: PinInput; readonly to: PinInput; readonly convert?: boolean }
  | { readonly op: "disconnect"; readonly edge?: string; readonly pin?: PinInput; readonly from?: PinInput; readonly to?: PinInput }
  | { readonly op: "setValue"; readonly node: string; readonly key: string; readonly value?: unknown; readonly unset?: boolean }
  | { readonly op: "addComment"; readonly id?: string; readonly around?: readonly string[]; readonly at?: XY; readonly size?: XY; readonly title?: string; readonly body?: string; readonly tone?: CommentTone }
  | { readonly op: "updateComment"; readonly id: string; readonly title?: string; readonly body?: string; readonly tone?: CommentTone; readonly at?: XY; readonly size?: XY; readonly moveWithNodes?: boolean }
  | { readonly op: "moveComment"; readonly id: string; readonly to: XY; readonly carry?: boolean }
  | { readonly op: "removeComment"; readonly id: string | readonly string[] }
  /** Comment z-order: "front" draws it above the others, "back" below. */
  | { readonly op: "orderComment"; readonly id: string; readonly to: "front" | "back" }
  | { readonly op: "collapse"; readonly nodes: readonly string[]; readonly id?: string; readonly label?: string; readonly kind?: SubgraphKind }
  | {
    readonly op: "updateSubgraph"; readonly id: string; readonly label?: string; readonly kind?: SubgraphKind;
    readonly pure?: boolean; readonly const?: boolean; readonly category?: string | null; readonly description?: string | null; readonly keywords?: string | null;
  }
  // Document-level ops: they act on the subgraph table, whatever level is being edited.
  /** A new empty function / macro / collapsed graph (entry + Return tunnels), no call site. */
  | {
    readonly op: "addSubgraph"; readonly id?: string; readonly label?: string; readonly kind?: SubgraphKind; readonly pure?: boolean;
    readonly category?: string; readonly description?: string; readonly inputs?: readonly Pin[]; readonly outputs?: readonly Pin[];
  }
  /** Removes the definition and every call site. */
  | { readonly op: "removeSubgraph"; readonly id: string }
  | { readonly op: "duplicateSubgraph"; readonly id: string; readonly label?: string }
  /** Replace inputs and / or outputs (pins matched by id). Wires to removed pins are dropped everywhere. */
  | { readonly op: "setSignature"; readonly id: string; readonly inputs?: readonly Pin[]; readonly outputs?: readonly Pin[] }
  /** Copy a library's definitions into the document (all, or `items` and what they use). */
  | { readonly op: "importLibrary"; readonly library: BlueprintLibrary; readonly items?: readonly string[]; readonly replace?: boolean }
  | { readonly op: "setMeta"; readonly name?: string | null; readonly description?: string | null }
  /** `local` adds to the function being edited (only inside a function view). */
  | {
    readonly op: "addVariable"; readonly id?: string; readonly name: string; readonly type: string; readonly default?: unknown; readonly local?: boolean;
    readonly category?: string; readonly tooltip?: string;
  }
  | {
    readonly op: "updateVariable"; readonly id: string; readonly name?: string; readonly type?: string; readonly default?: unknown; readonly unsetDefault?: boolean;
    readonly category?: string | null; readonly tooltip?: string | null;
  }
  /** Removes the variable and every Get / Set node that uses it. */
  | { readonly op: "removeVariable"; readonly id: string }
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

/**
 * Fold an edited inner view back into the root: its subgraph table, the root variables (which the
 * view carries), and the definition itself. Root nodes that used a removed variable go too.
 */
export function mergeInner(root: BlueprintGraph, sgId: string, inner: BlueprintGraph): BlueprintGraph {
  const vars = inner.variables ?? [];
  const gone = new Set((root.variables ?? []).filter((v) => !vars.some((x) => x.id === v.id)).map((v) => v.id));
  let base: BlueprintGraph = { ...root, ...(inner.subgraphs ? { subgraphs: inner.subgraphs } : {}) };
  if (vars.length) base = { ...base, variables: vars };
  else if (base.variables) {
    const { variables: _v, ...rest } = base;
    void _v;
    base = rest;
  }
  if (gone.size) base = dropVarNodes(base, gone);
  return writeSubgraph(base, sgId, inner);
}

/** Remove Get / Set nodes of the given variables (and their wires) from one level. */
function dropVarNodesLevel<T extends Pick<BlueprintGraph, "nodes" | "edges">>(g: T, gone: ReadonlySet<string>): T {
  const dead = new Set(g.nodes.filter((n) => (n.type === VAR_GET || n.type === VAR_SET) && n.variable !== undefined && gone.has(n.variable)).map((n) => n.id));
  if (!dead.size) return g;
  return { ...g, nodes: g.nodes.filter((n) => !dead.has(n.id)), edges: g.edges.filter((e) => !dead.has(e.from.node) && !dead.has(e.to.node)) };
}

function dropVarNodes(g: BlueprintGraph, gone: ReadonlySet<string>): BlueprintGraph {
  const top = dropVarNodesLevel(g, gone);
  if (!g.subgraphs) return top;
  const subgraphs = Object.fromEntries(Object.entries(g.subgraphs).map(([id, sg]) => [id, dropVarNodesLevel(sg, gone)]));
  return { ...top, subgraphs };
}

/** Exec pin counts of a subgraph's tunnels. */
function subgraphPinsOf(nodes: readonly BlueprintNode[], registry: Registry): { execIn: number; execOut: number } {
  const p = subgraphPins(nodes);
  return { execIn: p.inputs.filter((x) => registry.isExec(x.type)).length, execOut: p.outputs.filter((x) => registry.isExec(x.type)).length };
}

/** An inner view of a function (it carries `locals`, possibly empty). */
const isFunctionView = (g: BlueprintGraph) => g.locals !== undefined;

const xy = (p: XY): { x: number; y: number } => ("x" in p ? { x: p.x, y: p.y } : { x: p[0], y: p[1] });

/** Ops that act on the document's subgraph table: inside a subgraph view they run on the root. */
const DOC_OPS = new Set<GraphOp["op"]>(["updateSubgraph", "addSubgraph", "removeSubgraph", "duplicateSubgraph", "setSignature", "importLibrary", "setMeta"]);

export function applyOps(graph: BlueprintGraph, ops: readonly GraphOp[], registry: Registry, opts: ApplyOptions = {}): ApplyResult {
  if (opts.subgraph !== undefined) {
    const sgId = opts.subgraph;
    if (!subgraphAsGraph(graph, sgId)) return { graph, errors: [{ index: -1, op: "*", message: `Subgraph "${sgId}" not found` }], created: {} };
    const ids = opts.ids ?? createIdGen(graph);
    let root = graph;
    const errors: OpError[] = [];
    const created: Record<string, string> = {};
    // consecutive level ops run as one batch on the inner view; document ops run on the root between batches
    let batch: { op: GraphOp; index: number }[] = [];
    const collect = (r: ApplyResult, idx: readonly number[]) => {
      r.errors.forEach((e) => errors.push({ ...e, index: idx[e.index] ?? e.index }));
      for (const [k, v] of Object.entries(r.created)) {
        const m = /^#(\d+)(.*)$/.exec(k);
        created[m ? `#${idx[Number(m[1])] ?? m[1]}${m[2]}` : k] = v;
      }
    };
    const flush = () => {
      if (!batch.length) return;
      const inner = subgraphAsGraph(root, sgId, registry);
      if (!inner) {
        batch.forEach((b) => errors.push({ index: b.index, op: b.op.op, message: `Subgraph "${sgId}" no longer exists` }));
        batch = [];
        return;
      }
      const r = applyOps(inner, batch.map((b) => b.op), registry, { ids });
      collect(r, batch.map((b) => b.index));
      root = mergeInner(root, sgId, r.graph);
      batch = [];
    };
    ops.forEach((op, index) => {
      if (!DOC_OPS.has(op.op)) return void batch.push({ op, index });
      flush();
      const r = applyOps(root, [op], registry, { ids });
      collect(r, [index]);
      root = r.graph;
    });
    flush();
    if (opts.atomic && errors.length) return { graph, errors, created: {} };
    return { graph: root, errors, created };
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
        const type = op.type;
        if (!registry.node(type)) return fail(`Unknown node type "${type}"`);
        if (op.subgraph !== undefined && !g.subgraphs?.[op.subgraph]) return fail(`Subgraph "${op.subgraph}" not found`);
        if ((type === VAR_GET || type === VAR_SET) && !findVariable(g, op.variable)) return fail(`Variable "${op.variable ?? "?"}" not found`);
        if (type === VAR_SET && op.variable?.startsWith(PARAM_PREFIX)) return fail("Function inputs are read only");
        const at = op.at ? xy(op.at) : { x: 0, y: 0 };
        // another Return node (UE5 allows several in a function): same signature as the first
        const sig = type === TUNNEL_OUT ? g.nodes.find((n) => n.type === TUNNEL_OUT)?.pins : undefined;
        if (type === TUNNEL_OUT && !isFunctionView(g)) return fail("Return nodes can only be added inside a function");
        const n: BlueprintNode = {
          id: claim(g, op.id, "n", index), type, ...at,
          ...(type === TUNNEL_OUT ? { pins: { inputs: [...(sig?.inputs ?? [])] } } : {}),
          ...(op.subgraph !== undefined ? { subgraph: op.subgraph } : {}),
          ...(op.variable !== undefined ? { variable: op.variable } : {}),
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
        for (const k of ["title", "comment", "collapsed", "width", "disabled", "devOnly", "commentPinned"] as const) {
          if (op[k] === null || ((k === "disabled" || k === "devOnly" || k === "commentPinned") && op[k] === false)) delete next[k];
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
      case "orderComment": {
        const id = real(op.id);
        const c = g.comments?.find((x) => x.id === id);
        if (!c) return fail(`Comment "${op.id}" not found`);
        const rest = g.comments!.filter((x) => x.id !== id);
        g = { ...g, comments: op.to === "front" ? [...rest, c] : [c, ...rest] };
        return;
      }
      case "addSubgraph": {
        const r = createSubgraph(g, {
          id: op.id === undefined ? ids("sg") : claim(g, op.id, "sg", index),
          ...(op.label !== undefined ? { label: op.label } : {}), ...(op.kind ? { kind: op.kind } : {}), ...(op.pure ? { pure: true } : {}),
          ...(op.category ? { category: op.category } : {}), ...(op.description ? { description: op.description } : {}),
          ...(op.inputs ? { inputs: op.inputs } : {}), ...(op.outputs ? { outputs: op.outputs } : {}),
        }, ids);
        if (r.error) return fail(r.error);
        g = r.graph;
        created[op.id ?? `#${index}`] = r.id;
        return;
      }
      case "removeSubgraph": {
        const r = removeSubgraph(g, real(op.id));
        if (r.error) return fail(r.error);
        g = r.graph;
        return;
      }
      case "duplicateSubgraph": {
        const r = duplicateSubgraph(g, real(op.id), ids, op.label);
        if (r.error) return fail(r.error);
        g = r.graph;
        created[`#${index}`] = r.id!;
        return;
      }
      case "setSignature": {
        const r = setSignature(g, real(op.id), { ...(op.inputs ? { inputs: op.inputs } : {}), ...(op.outputs ? { outputs: op.outputs } : {}) }, registry);
        if (r.error) return fail(r.error);
        g = r.graph;
        return;
      }
      case "importLibrary": {
        const r = importLibrary(g, op.library, op.items, op.replace === false ? { replace: false } : {});
        if (r.error) return fail(r.error);
        g = r.graph;
        r.ids.forEach((id, i) => (created[`#${index}${i ? `.${i}` : ""}`] = id));
        return;
      }
      case "setMeta": {
        const meta: Record<string, string> = { ...(g.meta ?? {}) };
        for (const k of ["name", "description"] as const) {
          if (op[k] === null || op[k] === "") delete meta[k];
          else if (op[k] !== undefined) meta[k] = op[k];
        }
        const { meta: _m, ...bare } = g;
        void _m;
        g = Object.keys(meta).length ? { ...bare, meta: meta as GraphMeta } : bare;
        return;
      }
      case "collapse": {
        const r = collapse(g, op.nodes.map(real), registry, ids, {
          id: op.id === undefined ? ids("sg") : claim(g, op.id, "sg", index), ...(op.label !== undefined ? { label: op.label } : {}),
          ...(op.kind ? { kind: op.kind } : {}),
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
      case "updateSubgraph": {
        const sg = g.subgraphs?.[real(op.id)];
        if (!sg) return fail(`Subgraph "${op.id}" not found`);
        const shellPorts = subgraphPinsOf(sg.nodes, registry);
        if (op.kind === "function" && (shellPorts.execIn > 1 || shellPorts.execOut > 1)) return fail("A function takes at most one exec input and one exec output");
        const next: Record<string, unknown> = {
          ...sg, ...(op.label !== undefined ? { label: op.label } : {}),
          ...(op.kind !== undefined ? { kind: op.kind } : {}),
        };
        for (const k of ["category", "description", "keywords"] as const) {
          if (op[k] === null || op[k] === "") delete next[k];
          else if (op[k] !== undefined) next[k] = op[k];
        }
        const kind = (next.kind as SubgraphKind | undefined) ?? "graph";
        if (kind === "graph") delete next.kind;
        if (kind !== "function") {
          delete next.pure;
          delete next.const;
          delete next.variables;
        } else {
          // promoted to a function with no exec pins: it is pure
          if (op.kind === "function" && sg.kind !== "function" && shellPorts.execIn + shellPorts.execOut === 0) next.pure = true;
          if (op.const !== undefined) { if (op.const) next.const = true; else delete next.const; }
        }
        g = { ...g, subgraphs: { ...g.subgraphs, [sg.id]: next as unknown as typeof sg } };
        if (op.pure !== undefined && kind === "function") {
          const r = setPure(g, sg.id, op.pure, registry, ids);
          if (r.error) return fail(r.error);
          g = r.graph;
        } else if (op.pure && kind !== "function") return fail("Only functions can be pure");
        return;
      }
      case "addVariable": {
        if (!registry.type(op.type) || registry.isExec(op.type)) return fail(`Unknown or exec pin type "${op.type}"`);
        if (!op.name.trim()) return fail("Variable name is empty");
        const v: VariableDef = {
          id: claim(g, op.id, "v", index), name: op.name.trim(), type: op.type, ...(op.default !== undefined ? { default: op.default } : {}),
          ...(op.category ? { category: op.category } : {}), ...(op.tooltip ? { tooltip: op.tooltip } : {}),
        };
        if (op.local) {
          if (!isFunctionView(g)) return fail("Local variables exist only inside a function");
          g = { ...g, locals: [...(g.locals ?? []), v] };
        } else g = { ...g, variables: [...(g.variables ?? []), v] };
        return;
      }
      case "updateVariable": {
        const id = real(op.id);
        const where = g.locals?.some((v) => v.id === id) ? "locals" : g.variables?.some((v) => v.id === id) ? "variables" : undefined;
        if (!where) return fail(`Variable "${op.id}" not found`);
        if (op.type !== undefined && (!registry.type(op.type) || registry.isExec(op.type))) return fail(`Unknown or exec pin type "${op.type}"`);
        if (op.name !== undefined && !op.name.trim()) return fail("Variable name is empty");
        const list = (g[where] ?? []).map((v) => {
          if (v.id !== id) return v;
          const next: Record<string, unknown> = { ...v };
          if (op.name !== undefined) next.name = op.name.trim();
          if (op.type !== undefined) next.type = op.type;
          if (op.unsetDefault || (op.type !== undefined && op.type !== v.type && op.default === undefined)) delete next.default;
          if (op.default !== undefined) next.default = op.default;
          for (const k of ["category", "tooltip"] as const) {
            if (op[k] === null || op[k] === "") delete next[k];
            else if (op[k] !== undefined) next[k] = op[k];
          }
          return next as unknown as VariableDef;
        });
        g = { ...g, [where]: list };
        return;
      }
      case "removeVariable": {
        const id = real(op.id);
        const local = g.locals?.some((v) => v.id === id);
        if (!local && !g.variables?.some((v) => v.id === id)) return fail(`Variable "${op.id}" not found`);
        const gone = new Set([id]);
        g = local ? { ...dropVarNodesLevel(g, gone), locals: g.locals!.filter((v) => v.id !== id) } : { ...dropVarNodes(g, gone), variables: g.variables!.filter((v) => v.id !== id) };
        if (!local && !g.variables!.length) {
          const { variables: _v, ...rest } = g;
          void _v;
          g = rest;
        }
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
