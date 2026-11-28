import type { IdGen } from "./ids";
import { getPorts, subgraphPins } from "./ports";
import type { Registry } from "./registry";
import { TUNNEL_IN, TUNNEL_OUT } from "./registry";
import type { BlueprintEdge, BlueprintGraph, BlueprintNode, Pin, SubGraphDef, SubgraphKind } from "./types";

/**
 * Functions, macros and collapsed graphs as first-class document items (UE5 "My Blueprint"):
 * create, duplicate, remove, and edit a signature. A signature IS the tunnel pins (entry outputs =
 * inputs, Return inputs = outputs), so editing it rewrites the tunnels and every call site follows
 * through `getPorts`. Wires to pins that no longer exist are dropped (at call sites and inside);
 * wires whose types no longer fit are kept, so validation reports the broken call site.
 */

export interface Signature {
  readonly inputs: readonly Pin[];
  readonly outputs: readonly Pin[];
}

export interface CallSite {
  /** Level the call site lives on: undefined = main graph, else the subgraph id. */
  readonly sg: string | undefined;
  readonly node: BlueprintNode;
}

export function signatureOf(sg: Pick<SubGraphDef, "nodes">): Signature {
  return subgraphPins(sg.nodes);
}

/** Every node that calls `sgId`, on every level of the document. */
export function callSites(root: BlueprintGraph, sgId: string): CallSite[] {
  const out: CallSite[] = root.nodes.filter((n) => n.subgraph === sgId).map((node) => ({ sg: undefined, node }));
  for (const sg of Object.values(root.subgraphs ?? {})) for (const node of sg.nodes) if (node.subgraph === sgId) out.push({ sg: sg.id, node });
  return out;
}

/**
 * Call sites whose wires no longer fit the signature: a pin that is gone, or a type that no longer
 * assigns. What validation reports as `broken-call`.
 */
export function brokenCallSites(root: BlueprintGraph, sgId: string, registry: Registry): CallSite[] {
  const sg = root.subgraphs?.[sgId];
  if (!sg) return [];
  return callSites(root, sgId).filter(({ sg: level, node }) => {
    const edges = level === undefined ? root.edges : root.subgraphs?.[level]?.edges ?? [];
    const nodes = level === undefined ? root.nodes : root.subgraphs?.[level]?.nodes ?? [];
    const ports = getPorts(node, registry, root);
    return edges.some((e) => {
      if (e.to.node === node.id) {
        const p = ports.inputs.find((x) => x.id === e.to.pin);
        if (!p) return true;
        const src = nodes.find((n) => n.id === e.from.node);
        const sp = src && getPorts(src, registry, root).outputs.find((x) => x.id === e.from.pin);
        return !!sp && !registry.assignable(sp.type, p.type);
      }
      if (e.from.node === node.id) {
        const p = ports.outputs.find((x) => x.id === e.from.pin);
        if (!p) return true;
        const dst = nodes.find((n) => n.id === e.to.node);
        const dp = dst && getPorts(dst, registry, root).inputs.find((x) => x.id === e.to.pin);
        return !!dp && !registry.assignable(p.type, dp.type);
      }
      return false;
    });
  });
}

export interface CreateSubgraphOptions {
  readonly id?: string;
  readonly label?: string;
  readonly kind?: SubgraphKind;
  readonly pure?: boolean;
  readonly category?: string;
  readonly description?: string;
  readonly inputs?: readonly Pin[];
  readonly outputs?: readonly Pin[];
}

/**
 * A new, empty definition with its entry and Return tunnels. Exec functions get exec in / out wired
 * through (a no-op call until you add nodes), macros and graphs get unwired exec pins, pure
 * functions none. No call site is added.
 */
export function createSubgraph(root: BlueprintGraph, opts: CreateSubgraphOptions, ids: IdGen): { graph: BlueprintGraph; id: string; error?: string } {
  const id = opts.id ?? ids("sg");
  if (root.subgraphs?.[id]) return { graph: root, id, error: `Subgraph id "${id}" already exists` };
  const kind = opts.kind ?? "function";
  const pure = kind === "function" && !!opts.pure;
  const execIn: Pin[] = pure ? [] : [{ id: "exec", type: "exec" }];
  const execOut: Pin[] = pure ? [] : [{ id: "then", type: "exec" }];
  const entry: BlueprintNode = { id: ids("n"), type: TUNNEL_IN, x: 0, y: 0, pins: { outputs: [...execIn, ...(opts.inputs ?? [])] } };
  const ret: BlueprintNode = { id: ids("n"), type: TUNNEL_OUT, x: 480, y: 0, pins: { inputs: [...execOut, ...(opts.outputs ?? [])] } };
  const edges: BlueprintEdge[] = kind === "function" && !pure ? [{ id: ids("e"), from: { node: entry.id, pin: "exec" }, to: { node: ret.id, pin: "then" } }] : [];
  const def: SubGraphDef = {
    id,
    ...(opts.label !== undefined ? { label: opts.label } : {}),
    ...(kind !== "graph" ? { kind } : {}),
    ...(pure ? { pure: true } : {}),
    ...(opts.category ? { category: opts.category } : {}),
    ...(opts.description ? { description: opts.description } : {}),
    nodes: [entry, ret],
    edges,
  };
  return { graph: { ...root, subgraphs: { ...(root.subgraphs ?? {}), [id]: def } }, id };
}

/** Same definition under a new id (the copy keeps its inner node ids: ids are per level). */
export function duplicateSubgraph(root: BlueprintGraph, sgId: string, ids: IdGen, label?: string): { graph: BlueprintGraph; id?: string; error?: string } {
  const sg = root.subgraphs?.[sgId];
  if (!sg) return { graph: root, error: `Subgraph "${sgId}" not found` };
  const id = ids("sg");
  const copy: SubGraphDef = { ...sg, id, label: label ?? `${sg.label ?? sg.id} 副本` };
  if (copy.library) delete (copy as { library?: string }).library;
  return { graph: { ...root, subgraphs: { ...root.subgraphs, [id]: copy } }, id };
}

/** Drop a pin-referencing level filter: nodes `shells` lose their wires to pins not in `keep`. */
function pruneLevel<T extends Pick<BlueprintGraph, "nodes" | "edges">>(level: T, shells: ReadonlySet<string>, keepIn: ReadonlySet<string>, keepOut: ReadonlySet<string>): T {
  if (!shells.size) return level;
  const edges = level.edges.filter((e) => !(shells.has(e.to.node) && !keepIn.has(e.to.pin)) && !(shells.has(e.from.node) && !keepOut.has(e.from.pin)));
  const nodes = level.nodes.map((n) => {
    if (!shells.has(n.id) || !n.values) return n;
    const values = Object.fromEntries(Object.entries(n.values).filter(([k]) => keepIn.has(k)));
    if (Object.keys(values).length === Object.keys(n.values).length) return n;
    const { values: _v, ...bare } = n;
    void _v;
    return Object.keys(values).length ? { ...bare, values } : bare;
  });
  return edges.length === level.edges.length && nodes.every((n, i) => n === level.nodes[i]) ? level : { ...level, nodes, edges };
}

/** Remove every call site of `sgId` (and its wires) on every level. */
function dropCallSites(root: BlueprintGraph, sgId: string): BlueprintGraph {
  const strip = <T extends Pick<BlueprintGraph, "nodes" | "edges">>(l: T): T => {
    const dead = new Set(l.nodes.filter((n) => n.subgraph === sgId).map((n) => n.id));
    if (!dead.size) return l;
    return { ...l, nodes: l.nodes.filter((n) => !dead.has(n.id)), edges: l.edges.filter((e) => !dead.has(e.from.node) && !dead.has(e.to.node)) };
  };
  const top = strip(root);
  const subgraphs = root.subgraphs ? Object.fromEntries(Object.entries(root.subgraphs).map(([id, sg]) => [id, strip(sg)])) : undefined;
  return { ...top, ...(subgraphs ? { subgraphs } : {}) };
}

/** Delete a definition together with all its call sites. */
export function removeSubgraph(root: BlueprintGraph, sgId: string): { graph: BlueprintGraph; error?: string } {
  if (!root.subgraphs?.[sgId]) return { graph: root, error: `Subgraph "${sgId}" not found` };
  const g = dropCallSites(root, sgId);
  const { [sgId]: _gone, ...rest } = g.subgraphs ?? {};
  void _gone;
  if (Object.keys(rest).length) return { graph: { ...g, subgraphs: rest } };
  const { subgraphs: _s, ...bare } = g;
  void _s;
  return { graph: bare };
}

/**
 * Replace the signature of a definition. Pins are matched by id: keep an id to rename (label) or
 * retype a pin, drop it to remove the pin. Writes every entry / Return tunnel and prunes wires to
 * removed pins inside the body and at every call site.
 */
export function setSignature(root: BlueprintGraph, sgId: string, sig: Partial<Signature>, registry: Registry): { graph: BlueprintGraph; error?: string } {
  const sg = root.subgraphs?.[sgId];
  if (!sg) return { graph: root, error: `Subgraph "${sgId}" not found` };
  const cur = signatureOf(sg);
  const inputs = sig.inputs ?? cur.inputs;
  const outputs = sig.outputs ?? cur.outputs;
  const dupe = (ps: readonly Pin[]) => ps.find((p, i) => ps.findIndex((q) => q.id === p.id) !== i);
  if (dupe(inputs) || dupe(outputs)) return { graph: root, error: `Pin id "${(dupe(inputs) ?? dupe(outputs))!.id}" is used twice` };
  if (sg.kind === "function") {
    const ei = inputs.filter((p) => registry.isExec(p.type)).length;
    const eo = outputs.filter((p) => registry.isExec(p.type)).length;
    if (ei > 1 || eo > 1) return { graph: root, error: "A function takes at most one exec input and one exec output" };
    if (sg.pure && (ei || eo)) return { graph: root, error: "A pure function has no exec pins" };
  }
  const keepIn = new Set(inputs.map((p) => p.id));
  const keepOut = new Set(outputs.map((p) => p.id));
  const tIn = new Set(sg.nodes.filter((n) => n.type === TUNNEL_IN).map((n) => n.id));
  const tOut = new Set(sg.nodes.filter((n) => n.type === TUNNEL_OUT).map((n) => n.id));
  const nodes = sg.nodes.map((n) => (tIn.has(n.id) ? { ...n, pins: { outputs: [...inputs] } } : tOut.has(n.id) ? { ...n, pins: { inputs: [...outputs] } } : n));
  // inside: entry tunnels are sources (their outputs = inputs), Return tunnels are targets
  const edges = sg.edges.filter((e) => !(tIn.has(e.from.node) && !keepIn.has(e.from.pin)) && !(tOut.has(e.to.node) && !keepOut.has(e.to.pin)));
  // a Get of a removed input dies with its wires
  const deadGet = new Set(nodes.filter((n) => n.variable?.startsWith("$in:") && !keepIn.has(n.variable.slice(4))).map((n) => n.id));
  const body: SubGraphDef = {
    ...sg,
    nodes: nodes.filter((n) => !deadGet.has(n.id)),
    edges: edges.filter((e) => !deadGet.has(e.from.node) && !deadGet.has(e.to.node)),
  };
  let g: BlueprintGraph = { ...root, subgraphs: { ...root.subgraphs, [sgId]: body } };
  const shellsOf = (l: Pick<BlueprintGraph, "nodes">) => new Set(l.nodes.filter((n) => n.subgraph === sgId).map((n) => n.id));
  g = pruneLevel(g, shellsOf(g), keepIn, keepOut);
  if (g.subgraphs) {
    g = { ...g, subgraphs: Object.fromEntries(Object.entries(g.subgraphs).map(([id, s]) => [id, pruneLevel(s, shellsOf(s), keepIn, keepOut)])) };
  }
  return { graph: g };
}

/**
 * Turn a function pure (strip its exec pins and the wires on them, everywhere) or impure again
 * (exec in "exec" / out "then", wired through when the body has no exec flow yet).
 */
export function setPure(root: BlueprintGraph, sgId: string, pure: boolean, registry: Registry, ids: IdGen): { graph: BlueprintGraph; error?: string } {
  const sg = root.subgraphs?.[sgId];
  if (!sg) return { graph: root, error: `Subgraph "${sgId}" not found` };
  if (sg.kind !== "function") return { graph: root, error: "Only functions can be pure" };
  if (!!sg.pure === pure) return { graph: root };
  const cur = signatureOf(sg);
  if (pure) {
    const bodyExec = sg.nodes.some((n) => n.type !== TUNNEL_IN && n.type !== TUNNEL_OUT && getPorts(n, registry, root).inputs.some((p) => p.exec));
    if (bodyExec) return { graph: root, error: "The body has exec nodes; a pure function can only hold pure nodes" };
    const flagged: BlueprintGraph = { ...root, subgraphs: { ...root.subgraphs, [sgId]: { ...sg, pure: true } } };
    return setSignature(flagged, sgId, { inputs: cur.inputs.filter((p) => !registry.isExec(p.type)), outputs: cur.outputs.filter((p) => !registry.isExec(p.type)) }, registry);
  }
  const { pure: _p, ...rest } = sg;
  void _p;
  const unflagged: BlueprintGraph = { ...root, subgraphs: { ...root.subgraphs, [sgId]: rest } };
  const r = setSignature(unflagged, sgId, { inputs: [{ id: "exec", type: "exec" }, ...cur.inputs], outputs: [{ id: "then", type: "exec" }, ...cur.outputs] }, registry);
  if (r.error) return r;
  const def = r.graph.subgraphs![sgId]!;
  const entry = def.nodes.find((n) => n.type === TUNNEL_IN);
  const rets = def.nodes.filter((n) => n.type === TUNNEL_OUT);
  if (!entry || !rets.length) return r;
  const wired = rets.map((t) => ({ id: ids("e"), from: { node: entry.id, pin: "exec" }, to: { node: t.id, pin: "then" } }));
  return { graph: { ...r.graph, subgraphs: { ...r.graph.subgraphs, [sgId]: { ...def, edges: [...def.edges, ...wired.slice(0, 1)] } } } };
}

/** A fresh pin id not used in `pins` ("in", "in_2", ...). */
export function freshPinId(pins: readonly Pin[], base: string): string {
  const used = new Set(pins.map((p) => p.id));
  let id = base;
  for (let i = 2; used.has(id); i++) id = `${base}_${i}`;
  return id;
}
