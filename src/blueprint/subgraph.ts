import type { IdGen } from "./ids";
import { findPin, paramVariables } from "./ports";
import type { Registry } from "./registry";
import { SUBGRAPH_NODE, TUNNEL_IN, TUNNEL_OUT, VAR_GET } from "./registry";
import { boundsOf, nodeBox } from "./size";
import type { BlueprintComment, BlueprintEdge, BlueprintGraph, BlueprintNode, Pin, SubGraphDef, SubgraphKind } from "./types";
import { PARAM_PREFIX } from "./types";

/**
 * Collapse to graph / expand (UE5 "Collapse Nodes").
 *
 * Inside a subgraph, one `subgraph.in` tunnel carries the external inputs as its OUTPUT pins and one
 * `subgraph.out` tunnel carries the external outputs as its INPUT pins. Everything inside is an
 * ordinary graph, so validation, cycles and evaluation need no special cases.
 *
 * Boundary pins are keyed so that no wire is lost and multiplicity stays legal:
 *   data in   -> one pin per OUTER SOURCE  (a data input takes one wire, the tunnel fans out inside)
 *   exec in   -> one pin per INNER TARGET  (exec inputs take many wires)
 *   any out   -> one pin per INNER SOURCE  (outer side fans out, exec out keeps its single wire)
 *
 * Edge ids survive collapse -> expand: the side that fans out keeps the original ids.
 */

export interface CollapseResult {
  readonly graph: BlueprintGraph;
  readonly node?: string;
  readonly subgraph?: string;
  readonly error?: string;
}

interface Boundary {
  pin: Pin;
  /** Original crossing edges mapped to this pin. */
  edges: BlueprintEdge[];
  exec: boolean;
}

export function collapse(
  graph: BlueprintGraph, nodeIds: readonly string[], registry: Registry, ids: IdGen,
  opts: { readonly label?: string; readonly id?: string; readonly kind?: SubgraphKind } = {},
): CollapseResult {
  const inside = new Set(nodeIds.filter((id) => graph.nodes.some((n) => n.id === id)));
  if (inside.size === 0) return { graph, error: "Nothing to collapse" };
  const sgId = opts.id ?? ids("sg");
  if (graph.subgraphs?.[sgId]) return { graph, error: `Subgraph id "${sgId}" already exists` };
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const pinOf = (ref: { node: string; pin: string }, dir: "in" | "out") => findPin(byId.get(ref.node)!, ref.pin, dir, registry, graph);

  const ins = new Map<string, Boundary>();
  const outs = new Map<string, Boundary>();
  const usedIn = new Set<string>();
  const usedOut = new Set<string>();
  const uniq = (used: Set<string>, base: string) => {
    let id = base;
    for (let i = 2; used.has(id); i++) id = `${base}_${i}`;
    used.add(id);
    return id;
  };

  for (const e of graph.edges) {
    const fromIn = inside.has(e.from.node);
    const toIn = inside.has(e.to.node);
    if (fromIn === toIn) continue;
    if (toIn) {
      const dst = pinOf(e.to, "in");
      const src = pinOf(e.from, "out");
      if (!dst) continue; // broken wire, dropped like the validator would flag it
      const key = dst.exec ? `x:${e.to.node}.${e.to.pin}` : `d:${e.from.node}.${e.from.pin}`;
      const b = ins.get(key) ?? { pin: { id: uniq(usedIn, dst.id), type: dst.exec ? dst.type : (src?.type ?? dst.type), label: dst.label ?? dst.id }, edges: [], exec: dst.exec };
      b.edges.push(e);
      ins.set(key, b);
    } else {
      const src = pinOf(e.from, "out");
      if (!src) continue;
      const key = `${e.from.node}.${e.from.pin}`;
      const b = outs.get(key) ?? { pin: { id: uniq(usedOut, src.id), type: src.type, label: src.label ?? src.id }, edges: [], exec: src.exec };
      b.edges.push(e);
      outs.set(key, b);
    }
  }

  if (opts.kind === "function") {
    const execIn = [...ins.values()].filter((b) => b.exec).length;
    const execOut = [...outs.values()].filter((b) => b.exec).length;
    if (execIn > 1 || execOut > 1) return { graph, error: `A function takes at most one exec input and one exec output (selection has ${execIn} in, ${execOut} out); collapse to a macro instead` };
  }

  const innerNodes = graph.nodes.filter((n) => inside.has(n.id));
  const box = boundsOf(innerNodes.map((n) => nodeBox(n, registry, graph)));
  const tIn: BlueprintNode = { id: ids("n"), type: TUNNEL_IN, x: box.x - 240, y: box.y, pins: { outputs: [...ins.values()].map((b) => b.pin) } };
  const tOut: BlueprintNode = { id: ids("n"), type: TUNNEL_OUT, x: box.x + box.w + 64, y: box.y, pins: { inputs: [...outs.values()].map((b) => b.pin) } };
  const shell: BlueprintNode = {
    id: ids("n"), type: SUBGRAPH_NODE, x: box.x, y: box.y, subgraph: sgId,
    ...(opts.label ? { title: opts.label } : {}),
  };

  const innerEdges: BlueprintEdge[] = graph.edges.filter((e) => inside.has(e.from.node) && inside.has(e.to.node));
  const outerEdges: BlueprintEdge[] = graph.edges.filter((e) => !inside.has(e.from.node) && !inside.has(e.to.node));

  for (const b of ins.values()) {
    if (b.exec) {
      // many outer sources -> one inner target
      for (const e of b.edges) outerEdges.push({ id: e.id, from: e.from, to: { node: shell.id, pin: b.pin.id } });
      innerEdges.push({ id: ids("e"), from: { node: tIn.id, pin: b.pin.id }, to: b.edges[0]!.to });
    } else {
      // one outer source -> many inner targets
      const fan = b.edges.length > 1;
      outerEdges.push({ id: fan ? ids("e") : b.edges[0]!.id, from: b.edges[0]!.from, to: { node: shell.id, pin: b.pin.id } });
      for (const e of b.edges) innerEdges.push({ id: fan ? e.id : ids("e"), from: { node: tIn.id, pin: b.pin.id }, to: e.to });
    }
  }
  for (const b of outs.values()) {
    innerEdges.push({ id: ids("e"), from: b.edges[0]!.from, to: { node: tOut.id, pin: b.pin.id } });
    for (const e of b.edges) outerEdges.push({ id: e.id, from: { node: shell.id, pin: b.pin.id }, to: e.to });
  }

  const def: SubGraphDef = {
    id: sgId,
    ...(opts.label ? { label: opts.label } : {}),
    ...(opts.kind && opts.kind !== "graph" ? { kind: opts.kind } : {}),
    // a function with no exec pins at its boundary is pure: it is pulled like a pure node
    ...(opts.kind === "function" && ![...ins.values(), ...outs.values()].some((b) => b.exec) ? { pure: true } : {}),
    nodes: [tIn, ...innerNodes, tOut],
    edges: innerEdges,
  };
  return {
    graph: {
      ...graph,
      nodes: [...graph.nodes.filter((n) => !inside.has(n.id)), shell],
      edges: outerEdges,
      subgraphs: { ...(graph.subgraphs ?? {}), [sgId]: def },
    },
    node: shell.id,
    subgraph: sgId,
  };
}

/**
 * Expand a collapsed-graph node back into its contents, placed where the node now sits.
 * The definition is removed when nothing else references it, unless `keepDefinition` is set.
 */
export function expand(
  graph: BlueprintGraph, nodeId: string, registry: Registry, ids: IdGen,
  opts: { readonly keepDefinition?: boolean } = {},
): { readonly graph: BlueprintGraph; readonly nodes?: readonly string[]; readonly error?: string } {
  const shell = graph.nodes.find((n) => n.id === nodeId);
  const sg = shell?.subgraph !== undefined ? graph.subgraphs?.[shell.subgraph] : undefined;
  if (!shell || !sg) return { graph, error: `"${nodeId}" is not a collapsed graph node` };

  const tunnels = new Set(sg.nodes.filter((n) => n.type === TUNNEL_IN || n.type === TUNNEL_OUT).map((n) => n.id));
  if (sg.nodes.filter((n) => n.type === TUNNEL_OUT).length > 1) return { graph, error: `"${sg.label ?? sg.id}" has several Return nodes and cannot be inlined` };
  // Function input getters ("$in:x") become wires from whatever feeds the call site's pin x (or its literal).
  const getters = new Set(sg.nodes.filter((n) => n.type === VAR_GET && n.variable?.startsWith(PARAM_PREFIX)).map((n) => n.id));
  const content = sg.nodes.filter((n) => !tunnels.has(n.id) && !getters.has(n.id));
  const box = boundsOf(content.map((n) => nodeBox(n, registry, graph)));
  const dx = content.length ? shell.x - box.x : 0;
  const dy = content.length ? shell.y - box.y : 0;

  // Keep inner ids unless they clash with the outer graph (e.g. a shared definition expanded twice).
  const kept = graph.edges.filter((e) => e.from.node !== nodeId && e.to.node !== nodeId);
  const taken = new Set([...graph.nodes.filter((n) => n.id !== nodeId).map((n) => n.id), ...kept.map((e) => e.id), ...(graph.comments ?? []).map((c) => c.id)]);
  const rename = new Map<string, string>();
  const keepId = (id: string, prefix: string) => {
    const next = taken.has(id) ? ids(prefix) : id;
    taken.add(next);
    return next;
  };
  for (const n of content) rename.set(n.id, keepId(n.id, "n"));
  const ref = (r: { node: string; pin: string }) => ({ node: rename.get(r.node) ?? r.node, pin: r.pin });

  let restored = content.map((n) => ({ ...n, id: rename.get(n.id)!, x: n.x + dx, y: n.y + dy }));
  const edges: BlueprintEdge[] = [...kept];
  const literal = new Map<string, Record<string, unknown>>();
  for (const e of sg.edges) {
    if (getters.has(e.from.node)) {
      const g = sg.nodes.find((n) => n.id === e.from.node)!;
      const pin = g.variable!.slice(PARAM_PREFIX.length);
      const outer = graph.edges.find((o) => o.to.node === nodeId && o.to.pin === pin);
      if (outer) edges.push({ id: keepId(e.id, "e"), from: outer.from, to: ref(e.to) });
      else if (!tunnels.has(e.to.node)) {
        const v = shell.values?.[pin] ?? sg.nodes.find((n) => n.type === TUNNEL_IN)?.pins?.outputs?.find((p) => p.id === pin)?.default;
        if (v !== undefined) literal.set(rename.get(e.to.node)!, { ...(literal.get(rename.get(e.to.node)!) ?? {}), [e.to.pin]: v });
      }
      continue;
    }
    if (getters.has(e.to.node)) continue;
    if (!tunnels.has(e.from.node) && !tunnels.has(e.to.node)) edges.push({ id: keepId(e.id, "e"), from: ref(e.from), to: ref(e.to) });
  }
  if (literal.size) restored = restored.map((n) => (literal.has(n.id) ? { ...n, values: { ...(n.values ?? {}), ...literal.get(n.id) } } : n));

  // Rejoin boundary wires: outer edge on shell pin P x inner edge on tunnel pin P.
  const outerIn = graph.edges.filter((e) => e.to.node === nodeId);
  const outerOut = graph.edges.filter((e) => e.from.node === nodeId);
  const pairId = (o: BlueprintEdge, i: BlueprintEdge, innerCount: number) => keepId(innerCount > 1 ? i.id : o.id, "e");
  for (const o of outerIn) {
    const inner = sg.edges.filter((i) => tunnels.has(i.from.node) && i.from.pin === o.to.pin && !tunnels.has(i.to.node));
    for (const i of inner) edges.push({ id: pairId(o, i, inner.length), from: o.from, to: ref(i.to) });
  }
  for (const o of outerOut) {
    const inner = sg.edges.filter((i) => tunnels.has(i.to.node) && i.to.pin === o.from.pin && !tunnels.has(i.from.node));
    for (const i of inner) edges.push({ id: pairId(o, i, inner.length), from: ref(i.from), to: o.to });
  }
  // Pass-through wires (entry pin straight to an exit pin) join the outer source to the outer targets.
  for (const i of sg.edges.filter((x) => tunnels.has(x.from.node) && tunnels.has(x.to.node))) {
    const srcs = outerIn.filter((o) => o.to.pin === i.from.pin);
    const dsts = outerOut.filter((o) => o.from.pin === i.to.pin);
    for (const a of srcs) for (const b of dsts) edges.push({ id: keepId(dsts.length > 1 ? b.id : a.id, "e"), from: a.from, to: b.to });
  }
  // Literals typed on the call site's unconnected inputs move onto the inner pins they fed.
  for (const [pin, v] of Object.entries(shell.values ?? {})) {
    if (outerIn.some((o) => o.to.pin === pin)) continue;
    for (const i of sg.edges.filter((x) => tunnels.has(x.from.node) && x.from.pin === pin && !tunnels.has(x.to.node) && !getters.has(x.to.node))) {
      const id = rename.get(i.to.node)!;
      restored = restored.map((n) => (n.id === id ? { ...n, values: { ...(n.values ?? {}), [i.to.pin]: v } } : n));
    }
  }

  // A function's locals become graph variables (their Get / Set nodes now live in the outer graph).
  const taken2 = new Set((graph.variables ?? []).map((v) => v.id));
  const promoted = (sg.variables ?? []).filter((v) => !taken2.has(v.id));
  const variables = [...(graph.variables ?? []), ...promoted];
  const movedComments: BlueprintComment[] = (sg.comments ?? []).map((c) => ({ ...c, id: keepId(c.id, "c"), x: c.x + dx, y: c.y + dy }));
  const comments = [...(graph.comments ?? []), ...movedComments];
  const nodes = [...graph.nodes.filter((n) => n.id !== nodeId), ...restored];
  let subgraphs = graph.subgraphs ?? {};
  const after: BlueprintGraph = { ...graph, nodes, edges };
  if (!opts.keepDefinition && subgraphRefCount(after, sg.id) === 0) {
    const { [sg.id]: _drop, ...rest } = subgraphs;
    void _drop;
    subgraphs = rest;
  }
  return {
    graph: {
      nodes, edges,
      ...(comments.length ? { comments } : {}),
      ...(Object.keys(subgraphs).length ? { subgraphs } : {}),
      ...(variables.length ? { variables } : {}),
    },
    nodes: restored.map((n) => n.id),
  };
}

/**
 * Inner graph of a subgraph as an editable view. Carries the root subgraph table (nesting resolves),
 * the root variables, and, for a function, its local variables as `locals`.
 */
export function subgraphAsGraph(root: BlueprintGraph, sgId: string, registry?: Registry): BlueprintGraph | undefined {
  const sg = root.subgraphs?.[sgId];
  if (!sg) return undefined;
  return {
    nodes: sg.nodes, edges: sg.edges, ...(sg.comments ? { comments: sg.comments } : {}),
    ...(root.subgraphs ? { subgraphs: root.subgraphs } : {}),
    ...(root.variables ? { variables: root.variables } : {}),
    ...(sg.kind === "function" ? { locals: sg.variables ?? [], params: paramVariables(sg.nodes, registry) } : {}),
  };
}

/**
 * Write an edited inner graph back into its definition. Pins follow automatically (they live on
 * the tunnels); `locals` become the definition's variables.
 */
export function writeSubgraph(root: BlueprintGraph, sgId: string, inner: Pick<BlueprintGraph, "nodes" | "edges" | "comments" | "locals">): BlueprintGraph {
  const sg = root.subgraphs?.[sgId];
  if (!sg) return root;
  const locals = "locals" in inner ? inner.locals : sg.variables;
  const { variables: _v, comments: _c, ...meta } = sg;
  void _v, void _c;
  const next: SubGraphDef = {
    ...meta,
    ...(locals?.length ? { variables: locals } : {}),
    nodes: inner.nodes, edges: inner.edges,
    ...(inner.comments?.length ? { comments: inner.comments } : {}),
  };
  return { ...root, subgraphs: { ...root.subgraphs, [sgId]: next } };
}

/**
 * Chain of subgraph ids from the root down to `sgId` (inclusive), for breadcrumbs. A definition no
 * call site reaches gives `[sgId]`; an unknown id gives undefined.
 */
export function subgraphPath(root: BlueprintGraph, sgId: string): string[] | undefined {
  if (!root.subgraphs?.[sgId]) return undefined;
  const seen = new Set<string>();
  const queue: { id: string; path: string[] }[] = root.nodes.flatMap((n) => (n.subgraph !== undefined ? [{ id: n.subgraph, path: [n.subgraph] }] : []));
  while (queue.length) {
    const { id, path } = queue.shift()!;
    if (id === sgId) return path;
    if (seen.has(id)) continue;
    seen.add(id);
    for (const n of root.subgraphs?.[id]?.nodes ?? []) if (n.subgraph !== undefined) queue.push({ id: n.subgraph, path: [...path, n.subgraph] });
  }
  return [sgId];
}

/**
 * Where a runtime path (evaluate's "shell/shell/node") lives: the subgraph id of its level
 * (undefined = root) and the local node id. `key` is the validation-style id ("sg/node" or "node").
 */
export function resolveNodePath(root: BlueprintGraph, path: string): { readonly sg: string | undefined; readonly id: string; readonly key: string } | undefined {
  const parts = path.split("/");
  let nodes = root.nodes;
  let sg: string | undefined;
  for (let i = 0; i < parts.length - 1; i++) {
    const shell = nodes.find((n) => n.id === parts[i]);
    const next = shell?.subgraph !== undefined ? root.subgraphs?.[shell.subgraph] : undefined;
    if (!next) return undefined;
    sg = next.id;
    nodes = next.nodes;
  }
  const id = parts[parts.length - 1]!;
  return { sg, id, key: sg === undefined ? id : `${sg}/${id}` };
}

/** Call sites of a subgraph across the whole document (outer graph and every subgraph). */
export function subgraphRefCount(root: BlueprintGraph, sgId: string): number {
  let n = root.nodes.filter((x) => x.subgraph === sgId).length;
  for (const sg of Object.values(root.subgraphs ?? {})) n += sg.nodes.filter((x) => x.subgraph === sgId).length;
  return n;
}

export interface StackFrame {
  /** Runtime path of this frame's node ("shell", "shell/inner", ...). */
  readonly path: string;
  /** Level the node lives on (undefined = main graph). */
  readonly sg: string | undefined;
  /** Local node id on that level. */
  readonly id: string;
  /** Validation / breakpoint key ("node" or "sg/node"). */
  readonly key: string;
}

/**
 * Call stack of a runtime path, outermost first: the call site on the main graph, the call site
 * inside it, ..., then the node itself (UE5 Blueprint Debugger "Call Stack", newest last).
 */
export function callStackOf(root: BlueprintGraph, path: string): StackFrame[] {
  const parts = path.split("/");
  const out: StackFrame[] = [];
  for (let i = 1; i <= parts.length; i++) {
    const p = parts.slice(0, i).join("/");
    const r = resolveNodePath(root, p);
    if (!r) break;
    out.push({ path: p, ...r });
  }
  return out;
}
