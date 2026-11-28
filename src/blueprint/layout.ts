import type { Registry } from "./registry";
import { boxesOverlap, nodeBox, nodeSize } from "./size";
import type { BlueprintEdge, BlueprintGraph } from "./types";

/**
 * Deterministic layered layout (left to right), tolerant of exec loops, plus align / distribute.
 *
 * Steps: break back edges (DFS) -> rank by longest path -> merge unlinked adjacent ranks ->
 * barycenter ordering sweeps -> wrap ranks into rows toward a 2:1 aspect -> stack, centre on
 * neighbours -> push apart any remaining overlaps. Ties break on node id, so output is stable.
 */

export type Positions = ReadonlyMap<string, { x: number; y: number }>;

export interface LayoutOptions {
  /** Horizontal gap between ranks. Default 120. */
  readonly rankGap?: number;
  /** Vertical gap between nodes in a rank. Default 40. */
  readonly nodeGap?: number;
  /** Ordering sweeps. Default 4. */
  readonly iterations?: number;
  /** Node ids that keep their current position. */
  readonly preserve?: readonly string[];
}

interface LNode { id: string; w: number; h: number; rank: number; y: number }

export function autoLayout(graph: BlueprintGraph, registry: Registry, opts: LayoutOptions = {}): Positions {
  const gapX = opts.rankGap ?? 120;
  const gapY = opts.nodeGap ?? 40;
  const iterations = opts.iterations ?? 4;
  if (!graph.nodes.length) return new Map();

  const nodes = new Map<string, LNode>();
  for (const n of graph.nodes) nodes.set(n.id, { id: n.id, ...nodeSize(n, registry, graph), rank: 0, y: 0 });
  const edges = graph.edges.filter((e) => e.from.node !== e.to.node && nodes.has(e.from.node) && nodes.has(e.to.node));
  const back = new Set(findBackEdges(graph.nodes.map((n) => n.id), edges).map((e) => e.id));

  const succ = new Map<string, string[]>();
  const pred = new Map<string, string[]>();
  const link = (a: string, b: string) => {
    const s = succ.get(a) ?? [];
    if (!s.includes(b)) succ.set(a, [...s, b]);
    const p = pred.get(b) ?? [];
    if (!p.includes(a)) pred.set(b, [...p, a]);
  };
  for (const e of edges) (back.has(e.id) ? link(e.to.node, e.from.node) : link(e.from.node, e.to.node));

  // Rank = longest path from a source, in Kahn order.
  const indeg = new Map([...nodes.keys()].map((id) => [id, pred.get(id)?.length ?? 0]));
  const queue = [...nodes.keys()].filter((id) => indeg.get(id) === 0);
  const order: string[] = [];
  while (queue.length) {
    const u = queue.shift()!;
    order.push(u);
    for (const v of succ.get(u) ?? []) {
      indeg.set(v, indeg.get(v)! - 1);
      if (indeg.get(v) === 0) queue.push(v);
    }
  }
  for (const id of nodes.keys()) if (!order.includes(id)) order.push(id);
  for (const id of order) {
    nodes.get(id)!.rank = Math.max(0, ...(pred.get(id) ?? []).map((p) => nodes.get(p)!.rank + 1));
  }

  const ranks = new Map<number, string[]>();
  for (const n of nodes.values()) ranks.set(n.rank, [...(ranks.get(n.rank) ?? []), n.id]);
  compactRanks(nodes, ranks, succ);
  const keys = [...ranks.keys()].sort((a, b) => a - b);
  for (const k of keys) ranks.get(k)!.sort((a, b) => a.localeCompare(b));

  // Barycenter sweeps, alternating direction.
  const pos = new Map<string, number>();
  const reindex = () => keys.forEach((k) => ranks.get(k)!.forEach((id, i) => pos.set(id, i)));
  reindex();
  for (let it = 0; it < iterations; it++) {
    const down = it % 2 === 0;
    for (const k of down ? keys : [...keys].reverse()) {
      const layer = ranks.get(k)!;
      const score = new Map(layer.map((id, i) => {
        const nb = (down ? pred : succ).get(id) ?? [];
        return [id, nb.length ? nb.reduce((s, o) => s + (pos.get(o) ?? 0), 0) / nb.length : i];
      }));
      layer.sort((a, b) => score.get(a)! - score.get(b)! || a.localeCompare(b));
      reindex();
    }
  }

  // Wrap ranks into rows: pick the row width whose bounding box is closest to 2:1.
  const colW = keys.map((k) => Math.max(...ranks.get(k)!.map((id) => nodes.get(id)!.w)));
  const colH = keys.map((k) => ranks.get(k)!.reduce((s, id) => s + nodes.get(id)!.h + gapY, 0));
  const totalW = colW.reduce((s, w) => s + w + gapX, 0);
  const stair = Math.round((colW[0] ?? 176) * 1.5);
  const place = (rowW: number) => {
    const xs: number[] = [];
    const rowOf: number[] = [];
    const rowH: number[] = [0];
    let cursor = 0;
    let row = 0;
    keys.forEach((_, i) => {
      if (cursor > 0 && cursor + colW[i]! > rowW) {
        row += 1;
        rowH.push(0);
        cursor = row * stair;
      }
      xs.push(cursor);
      rowOf.push(row);
      rowH[row] = Math.max(rowH[row]!, colH[i]!);
      cursor += colW[i]! + gapX;
    });
    return { xs, rowOf, rowH };
  };
  const cost = (rowW: number) => {
    const p = place(rowW);
    const h = p.rowH.reduce((s, x) => s + x, 0) + gapY * 2.5 * (p.rowH.length - 1);
    const w = Math.min(rowW, totalW);
    let pull = 0; // worst leftward jump of a forward wire, wrapping should not send wires far back
    for (const [a, bs] of succ) for (const b of bs) pull = Math.max(pull, p.xs[keys.indexOf(nodes.get(a)!.rank)]! - p.xs[keys.indexOf(nodes.get(b)!.rank)]!);
    return Math.abs(Math.log(w / Math.max(1, h)) - Math.log(2)) + 1.5 * (pull / Math.max(1, totalW));
  };
  let rowW = totalW;
  let best = cost(totalW);
  for (let cols = 2; cols <= keys.length; cols++) {
    const w = colW.slice(0, cols).reduce((s, x) => s + x + gapX, 0);
    const c = cost(w);
    if (c < best) {
      best = c;
      rowW = w;
    }
  }
  const { xs, rowOf, rowH } = place(rowW);
  const rowBase: number[] = [];
  rowH.reduce((y, h, i) => ((rowBase[i] = y), y + h + gapY * 2.5), 0);

  // Stack each rank, centre it in its row, then pull nodes toward their neighbours.
  keys.forEach((k, i) => {
    const layer = ranks.get(k)!;
    let y = rowBase[rowOf[i]!]! + (rowH[rowOf[i]!]! - colH[i]!) / 2;
    for (const id of layer) {
      const n = nodes.get(id)!;
      n.y = y;
      y += n.h + gapY;
    }
  });
  for (let it = 0; it < iterations; it++) {
    for (const k of keys) {
      const layer = ranks.get(k)!;
      layer.forEach((id, idx) => {
        const n = nodes.get(id)!;
        const nb = [...(succ.get(id) ?? []), ...(pred.get(id) ?? [])].map((o) => nodes.get(o)!);
        if (!nb.length) return;
        const want = nb.reduce((s, o) => s + o.y + o.h / 2, 0) / nb.length - n.h / 2;
        const prev = idx > 0 ? nodes.get(layer[idx - 1]!)! : undefined;
        const next = idx < layer.length - 1 ? nodes.get(layer[idx + 1]!)! : undefined;
        const lo = prev ? prev.y + prev.h + gapY : -Infinity;
        const hi = next ? next.y - n.h - gapY : Infinity;
        if (lo <= hi) n.y = Math.min(hi, Math.max(lo, want));
      });
    }
  }
  const xOf = (n: LNode) => xs[keys.indexOf(n.rank)] ?? 0;
  resolveOverlaps([...nodes.values()], xOf, gapY);

  const preserve = new Set(opts.preserve ?? []);
  const out = new Map<string, { x: number; y: number }>();
  for (const n of graph.nodes) {
    const l = nodes.get(n.id)!;
    out.set(n.id, preserve.has(n.id) ? { x: n.x, y: n.y } : { x: xOf(l), y: l.y });
  }
  const minY = Math.min(...[...out.values()].map((p) => p.y));
  if (minY < 0) for (const [id, p] of out) if (!preserve.has(id)) out.set(id, { x: p.x, y: p.y - minY });
  return out;
}

export function applyLayout(graph: BlueprintGraph, positions: Positions): BlueprintGraph {
  return {
    ...graph,
    nodes: graph.nodes.map((n) => {
      const p = positions.get(n.id);
      return p ? { ...n, x: Math.round(p.x), y: Math.round(p.y) } : n;
    }),
  };
}

/** Edges that close a cycle in DFS order. Treated as reversed for ranking. */
export function findBackEdges(ids: readonly string[], edges: readonly BlueprintEdge[]): BlueprintEdge[] {
  const out = new Map<string, BlueprintEdge[]>();
  for (const e of edges) if (e.from.node !== e.to.node) out.set(e.from.node, [...(out.get(e.from.node) ?? []), e]);
  const state = new Map<string, 1 | 2>();
  const back: BlueprintEdge[] = [];
  const visit = (u: string) => {
    state.set(u, 1);
    for (const e of out.get(u) ?? []) {
      const s = state.get(e.to.node);
      if (s === 1) back.push(e);
      else if (s === undefined) visit(e.to.node);
    }
    state.set(u, 2);
  };
  for (const id of ids) if (!state.has(id)) visit(id);
  return back;
}

/** Merge adjacent ranks with no wire between them until the rank count is near sqrt(n) * 1.6. */
function compactRanks(nodes: Map<string, LNode>, ranks: Map<number, string[]>, succ: Map<string, string[]>): void {
  if (nodes.size <= 2) return;
  const target = Math.max(2, Math.round(Math.sqrt(nodes.size) * 1.6));
  for (let guard = 0; ranks.size > target && guard < 200; guard++) {
    const keys = [...ranks.keys()].sort((a, b) => a - b);
    let bestI = -1;
    let bestCost = Infinity;
    for (let i = 0; i < keys.length - 1; i++) {
      const a = ranks.get(keys[i]!)!;
      const b = ranks.get(keys[i + 1]!)!;
      if (a.some((u) => (succ.get(u) ?? []).some((v) => b.includes(v)))) continue;
      if (a.length + b.length < bestCost) {
        bestCost = a.length + b.length;
        bestI = i;
      }
    }
    if (bestI < 0) return;
    const [to, from] = [keys[bestI]!, keys[bestI + 1]!];
    for (const id of ranks.get(from)!) nodes.get(id)!.rank = to;
    ranks.set(to, [...ranks.get(to)!, ...ranks.get(from)!]);
    ranks.delete(from);
  }
}

function resolveOverlaps(nodes: LNode[], xOf: (n: LNode) => number, gapY: number): void {
  const placed: { x: number; y: number; w: number; h: number }[] = [];
  for (const n of [...nodes].sort((a, b) => a.y - b.y || a.rank - b.rank || a.id.localeCompare(b.id))) {
    const x = xOf(n);
    for (let guard = 0; guard < 500; guard++) {
      const hit = placed.find((p) => boxesOverlap(p, { x, y: n.y, w: n.w, h: n.h }));
      if (!hit) break;
      n.y = hit.y + hit.h + gapY;
    }
    placed.push({ x, y: n.y, w: n.w, h: n.h });
  }
}

// ---------------------------------------------------------------------------
// Layout quality metrics (used by the agent builder to self-check)

export function countOverlaps(graph: BlueprintGraph, registry: Registry): number {
  const boxes = graph.nodes.map((n) => nodeBox(n, registry, graph));
  let n = 0;
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) if (boxesOverlap(boxes[i]!, boxes[j]!)) n++;
  return n;
}

/** Wire crossings between columns, approximated by node order within each x column. */
export function countCrossings(graph: BlueprintGraph): number {
  const byX = new Map<number, string[]>();
  for (const n of graph.nodes) byX.set(Math.round(n.x), [...(byX.get(Math.round(n.x)) ?? []), n.id]);
  const yOf = new Map(graph.nodes.map((n) => [n.id, n.y]));
  const idx = new Map<string, number>();
  for (const col of byX.values()) col.sort((a, b) => yOf.get(a)! - yOf.get(b)!).forEach((id, i) => idx.set(id, i));
  const es = graph.edges.filter((e) => e.from.node !== e.to.node && idx.has(e.from.node) && idx.has(e.to.node));
  let crossings = 0;
  for (let i = 0; i < es.length; i++) {
    for (let j = i + 1; j < es.length; j++) {
      const a = es[i]!;
      const b = es[j]!;
      const o1 = Math.sign(idx.get(a.from.node)! - idx.get(b.from.node)!);
      const o2 = Math.sign(idx.get(a.to.node)! - idx.get(b.to.node)!);
      if (o1 && o2 && o1 !== o2) crossings++;
    }
  }
  return crossings;
}

// ---------------------------------------------------------------------------
// Align / distribute, size-aware (fixes B11)

export type AlignMode = "left" | "right" | "top" | "bottom" | "center" | "middle";

export function alignNodes(graph: BlueprintGraph, ids: readonly string[], mode: AlignMode, registry: Registry): BlueprintGraph {
  const boxes = graph.nodes.filter((n) => ids.includes(n.id)).map((n) => ({ id: n.id, ...nodeBox(n, registry, graph) }));
  if (boxes.length < 2) return graph;
  const minX = Math.min(...boxes.map((b) => b.x));
  const maxR = Math.max(...boxes.map((b) => b.x + b.w));
  const minY = Math.min(...boxes.map((b) => b.y));
  const maxB = Math.max(...boxes.map((b) => b.y + b.h));
  const at = new Map(boxes.map((b) => {
    switch (mode) {
      case "left": return [b.id, { x: minX, y: b.y }];
      case "right": return [b.id, { x: maxR - b.w, y: b.y }];
      case "top": return [b.id, { x: b.x, y: minY }];
      case "bottom": return [b.id, { x: b.x, y: maxB - b.h }];
      case "center": return [b.id, { x: Math.round((minX + maxR) / 2 - b.w / 2), y: b.y }];
      case "middle": return [b.id, { x: b.x, y: Math.round((minY + maxB) / 2 - b.h / 2) }];
    }
  }));
  return applyLayout(graph, at);
}

/** Even gaps between the selected nodes along one axis, first and last stay put. */
export function distributeNodes(graph: BlueprintGraph, ids: readonly string[], axis: "x" | "y", registry: Registry): BlueprintGraph {
  const boxes = graph.nodes.filter((n) => ids.includes(n.id)).map((n) => ({ id: n.id, ...nodeBox(n, registry, graph) }));
  if (boxes.length < 3) return graph;
  const size = axis === "x" ? "w" : "h";
  boxes.sort((a, b) => a[axis] - b[axis]);
  const first = boxes[0]!;
  const last = boxes[boxes.length - 1]!;
  const span = last[axis] + last[size] - first[axis];
  const gap = (span - boxes.reduce((s, b) => s + b[size], 0)) / (boxes.length - 1);
  let cursor = first[axis];
  const at = new Map<string, { x: number; y: number }>();
  for (const b of boxes) {
    at.set(b.id, axis === "x" ? { x: cursor, y: b.y } : { x: b.x, y: cursor });
    cursor += b[size] + gap;
  }
  return applyLayout(graph, at);
}
