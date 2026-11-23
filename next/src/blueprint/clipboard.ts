import { nodesInComment } from "./comment";
import type { IdGen } from "./ids";
import type { Registry } from "./registry";
import { subgraphRefCount } from "./subgraph";
import { findVariable } from "./ports";
import type { BlueprintComment, BlueprintEdge, BlueprintGraph, BlueprintNode, SubGraphDef, VariableDef } from "./types";

/**
 * Copy / paste / duplicate / delete. All of them handle comments (B10) and collapsed graphs.
 * A clip is itself a BlueprintGraph fragment, so `toText(clip)` is the system-clipboard form
 * and `fromText(text)` gives a clip back.
 */

export interface Selection {
  readonly nodes: readonly string[];
  readonly comments?: readonly string[];
}

export function copySelection(graph: BlueprintGraph, sel: Selection, registry: Registry): BlueprintGraph {
  const ids = new Set(sel.nodes);
  const nodes = graph.nodes.filter((n) => ids.has(n.id));
  const edges = graph.edges.filter((e) => ids.has(e.from.node) && ids.has(e.to.node));
  const picked = new Set(sel.comments ?? []);
  const comments = (graph.comments ?? []).filter((c) => {
    if (picked.has(c.id)) return true;
    // A comment whose contents are all selected comes along, as in UE5.
    const inside = nodesInComment(graph, c, registry);
    return inside.length > 0 && inside.every((id) => ids.has(id));
  });
  const subgraphs = referencedSubgraphs(graph, nodes);
  // Variables used by Get / Set nodes (also inside carried subgraphs) travel with the clip.
  const used = new Map<string, VariableDef>();
  for (const n of [...nodes, ...Object.values(subgraphs).flatMap((sg) => sg.nodes)]) {
    const v = findVariable(graph, n.variable);
    if (v) used.set(v.id, v);
  }
  return {
    nodes, edges,
    ...(comments.length ? { comments } : {}),
    ...(Object.keys(subgraphs).length ? { subgraphs } : {}),
    ...(used.size ? { variables: [...used.values()] } : {}),
  };
}

/** Subgraph definitions used by `nodes`, including nested ones. */
function referencedSubgraphs(graph: BlueprintGraph, nodes: readonly BlueprintNode[]): Record<string, SubGraphDef> {
  const out: Record<string, SubGraphDef> = {};
  const stack = nodes.flatMap((n) => (n.subgraph !== undefined ? [n.subgraph] : []));
  while (stack.length) {
    const id = stack.pop()!;
    const sg = graph.subgraphs?.[id];
    if (!sg || out[id]) continue;
    out[id] = sg;
    for (const n of sg.nodes) if (n.subgraph !== undefined) stack.push(n.subgraph);
  }
  return out;
}

export interface PasteResult {
  readonly graph: BlueprintGraph;
  readonly nodes: readonly string[];
  readonly comments: readonly string[];
}

/**
 * Paste a clip with fresh ids. Subgraph definitions are reused when the target already holds an
 * identical one, added under their own id when free, and renamed otherwise.
 */
export function pasteClip(
  graph: BlueprintGraph, clip: BlueprintGraph, ids: IdGen, opts: { readonly offset?: { readonly x: number; readonly y: number } } = {},
): PasteResult {
  const dx = opts.offset?.x ?? 24;
  const dy = opts.offset?.y ?? 24;

  const sgRename = new Map<string, string>();
  const addedDefs: Record<string, SubGraphDef> = {};
  for (const [id, def] of Object.entries(clip.subgraphs ?? {})) {
    const existing = graph.subgraphs?.[id];
    if (existing && JSON.stringify(existing) === JSON.stringify(def)) continue;
    const target = existing ? ids("sg") : id;
    sgRename.set(id, target);
  }
  // Variables: same id kept, else a target variable with the same name and type, else added.
  const varRename = new Map<string, string>();
  const addedVars: VariableDef[] = [];
  for (const v of clip.variables ?? []) {
    if (findVariable(graph, v.id)) continue;
    const twin = [...(graph.locals ?? []), ...(graph.variables ?? [])].find((x) => x.name === v.name && x.type === v.type);
    if (twin) varRename.set(v.id, twin.id);
    else addedVars.push(v);
  }
  const fixRef = (n: BlueprintNode): BlueprintNode => {
    let out = n;
    if (n.subgraph !== undefined && sgRename.has(n.subgraph)) out = { ...out, subgraph: sgRename.get(n.subgraph)! };
    if (n.variable !== undefined && varRename.has(n.variable)) out = { ...out, variable: varRename.get(n.variable)! };
    return out;
  };
  for (const [id, target] of sgRename) {
    const def = clip.subgraphs![id]!;
    addedDefs[target] = { ...def, id: target, nodes: def.nodes.map(fixRef) };
  }

  const nodeMap = new Map(clip.nodes.map((n) => [n.id, ids("n")]));
  const nodes: BlueprintNode[] = clip.nodes.map((n) => ({ ...fixRef(n), id: nodeMap.get(n.id)!, x: n.x + dx, y: n.y + dy }));
  const edges: BlueprintEdge[] = clip.edges
    .filter((e) => nodeMap.has(e.from.node) && nodeMap.has(e.to.node))
    .map((e) => ({ id: ids("e"), from: { node: nodeMap.get(e.from.node)!, pin: e.from.pin }, to: { node: nodeMap.get(e.to.node)!, pin: e.to.pin } }));
  const comments: BlueprintComment[] = (clip.comments ?? []).map((c) => ({ ...c, id: ids("c"), x: c.x + dx, y: c.y + dy }));

  const allComments = [...(graph.comments ?? []), ...comments];
  const subgraphs = { ...(graph.subgraphs ?? {}), ...addedDefs };
  const variables = [...(graph.variables ?? []), ...addedVars];
  return {
    graph: {
      ...graph,
      ...(variables.length ? { variables } : {}),
      nodes: [...graph.nodes, ...nodes],
      edges: [...graph.edges, ...edges],
      ...(allComments.length ? { comments: allComments } : {}),
      ...(Object.keys(subgraphs).length ? { subgraphs } : {}),
    },
    nodes: nodes.map((n) => n.id),
    comments: comments.map((c) => c.id),
  };
}

export function duplicateSelection(graph: BlueprintGraph, sel: Selection, registry: Registry, ids: IdGen): PasteResult {
  return pasteClip(graph, copySelection(graph, sel, registry), ids);
}

/**
 * Delete nodes (with their wires) and comments. Subgraph definitions left without any call site
 * by this delete are dropped too.
 */
export function deleteSelection(graph: BlueprintGraph, sel: Selection): BlueprintGraph {
  const ids = new Set(sel.nodes);
  const commentIds = new Set(sel.comments ?? []);
  const touchedDefs = graph.nodes.filter((n) => ids.has(n.id) && n.subgraph !== undefined).map((n) => n.subgraph!);
  const comments = (graph.comments ?? []).filter((c) => !commentIds.has(c.id));
  const next: BlueprintGraph = {
    nodes: graph.nodes.filter((n) => !ids.has(n.id)),
    edges: graph.edges.filter((e) => !ids.has(e.from.node) && !ids.has(e.to.node)),
    ...(comments.length ? { comments } : {}),
    ...(graph.subgraphs ? { subgraphs: graph.subgraphs } : {}),
  };
  const subgraphs = { ...(graph.subgraphs ?? {}) };
  for (const id of touchedDefs) if (subgraphRefCount(next, id) === 0) delete subgraphs[id];
  const { subgraphs: _old, ...rest } = next;
  void _old;
  return Object.keys(subgraphs).length ? { ...rest, subgraphs } : rest;
}
