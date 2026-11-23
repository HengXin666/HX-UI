import { createHistory, type History, type StepOptions } from "../history";
import { createIdGen, type IdGen } from "../ids";
import type { ApplyResult, GraphOp } from "../ops";
import type { Registry } from "../registry";
import { boundsOf, nodeBox, type Box } from "../size";
import { subgraphAsGraph, writeSubgraph } from "../subgraph";
import type { BlueprintGraph, GraphValidation, ValidationIssue } from "../types";
import { validateGraph } from "../validate";

/**
 * Editor state, framework-free: document + undo history, selection, subgraph path, viewport.
 * React reads it through `useBlueprint` (useSyncExternalStore on `subscribe` / `version`).
 *
 * Two listener sets on purpose: `subscribe` fires on document / selection / path changes and
 * re-renders React; `onViewport` fires on pan / zoom and is consumed imperatively (transforms),
 * so panning never re-renders the node layer.
 */

export interface EditorSelection {
  readonly nodes: readonly string[];
  readonly comments: readonly string[];
  readonly edges: readonly string[];
}
export type SelectMode = "replace" | "add" | "toggle" | "remove";
/** screen = graph * z + (x, y), in px relative to the editor element. */
export interface Viewport { readonly x: number; readonly y: number; readonly z: number }
export interface ViewValidation {
  readonly all: GraphValidation;
  /** Issues of nodes / wires on the level being edited, keyed by local id. */
  readonly byNode: ReadonlyMap<string, readonly ValidationIssue[]>;
  readonly byEdge: ReadonlyMap<string, readonly ValidationIssue[]>;
}

export const ZOOM = { min: 0.2, max: 2.5 } as const;
export const EMPTY_SELECTION: EditorSelection = { nodes: [], comments: [], edges: [] };

const uniq = (a: readonly string[]) => [...new Set(a)];
const clampZ = (z: number) => Math.min(ZOOM.max, Math.max(ZOOM.min, z));

export class BlueprintEditor {
  readonly registry: Registry;
  readonly history: History;
  readOnly = false;
  snap = 16;
  /** Set by the host (controlled mode). Called after every document change made by the editor. */
  onChange: ((graph: BlueprintGraph) => void) | undefined;
  /** In-memory clipboard, used when the system clipboard is unavailable. */
  clip: string | undefined;
  /** Last pointer position in graph units (paste / Tab menu / C place things there). */
  pointer: { x: number; y: number } | undefined;
  el: HTMLElement | null = null;

  private sel: EditorSelection = EMPTY_SELECTION;
  private pathIds: readonly string[] = [];
  private vp: Viewport = { x: 40, y: 40, z: 1 };
  private ver = 0;
  private emitted: BlueprintGraph;
  private readonly listeners = new Set<() => void>();
  private readonly vpListeners = new Set<(v: Viewport) => void>();
  private viewCache: { root: BlueprintGraph; sg: string | undefined; graph: BlueprintGraph } | undefined;
  private valCache: { root: BlueprintGraph; sg: string | undefined; v: ViewValidation } | undefined;

  constructor(registry: Registry, initial: BlueprintGraph) {
    this.registry = registry;
    this.history = createHistory(initial);
    this.emitted = initial;
    this.history.subscribe(() => {
      const g = this.history.current;
      if (g !== this.emitted) {
        this.emitted = g;
        this.onChange?.(g);
      }
      this.bump();
    });
  }

  // ------------------------------------------------------------------ store
  readonly subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => void this.listeners.delete(fn);
  };
  readonly version = () => this.ver;
  private bump() {
    this.ver++;
    this.listeners.forEach((l) => l());
  }

  /** Controlled mode: adopt an outside value (clears undo when it differs from ours). */
  syncValue(value: BlueprintGraph) {
    if (value === this.history.current) return;
    this.emitted = value;
    this.history.reset(value);
  }

  // ------------------------------------------------------------------ document
  get root(): BlueprintGraph { return this.history.current; }
  /** Subgraph path being edited, outermost first. Ids that no longer exist are dropped. */
  get path(): readonly string[] {
    const subs = this.root.subgraphs ?? {};
    const ok = this.pathIds.filter((id) => subs[id]);
    return ok.length === this.pathIds.length ? this.pathIds : ok;
  }
  get subgraph(): string | undefined { return this.path[this.path.length - 1]; }
  /** The graph on screen: the root, or the inner view of the subgraph being edited. */
  get graph(): BlueprintGraph {
    const root = this.root;
    const sg = this.subgraph;
    if (this.viewCache?.root === root && this.viewCache.sg === sg) return this.viewCache.graph;
    const graph = (sg !== undefined && subgraphAsGraph(root, sg)) || root;
    this.viewCache = { root, sg, graph };
    return graph;
  }
  get validation(): ViewValidation {
    const root = this.root;
    const sg = this.subgraph;
    if (this.valCache?.root === root && this.valCache.sg === sg) return this.valCache.v;
    const all = validateGraph(root, this.registry);
    const local = <T>(m: ReadonlyMap<string, T>) => {
      const out = new Map<string, T>();
      for (const [k, v] of m) {
        const i = k.indexOf("/");
        if (sg === undefined ? i < 0 : k.startsWith(`${sg}/`)) out.set(sg === undefined ? k : k.slice(sg.length + 1), v);
      }
      return out;
    };
    const v = { all, byNode: local(all.byNode), byEdge: local(all.byEdge) };
    this.valCache = { root, sg, v };
    return v;
  }
  get canUndo() { return this.history.canUndo; }
  get canRedo() { return this.history.canRedo; }

  /** Apply JSON ops to the level being edited as ONE undo step. */
  apply(ops: readonly GraphOp[], step: StepOptions = {}): ApplyResult | undefined {
    if (this.readOnly || !ops.length) return undefined;
    const sg = this.subgraph;
    return this.history.apply(ops, this.registry, { ...step, ...(sg !== undefined ? { subgraph: sg } : {}) });
  }

  /** Replace the level being edited with `fn(graph, ids)` as ONE undo step. */
  update(fn: (graph: BlueprintGraph, ids: IdGen) => BlueprintGraph, step: StepOptions = {}): void {
    if (this.readOnly) return;
    const root = this.root;
    const view = this.graph;
    const next = fn(view, createIdGen(root));
    if (next === view) return;
    const sg = this.subgraph;
    const merged = sg === undefined ? next : writeSubgraph({ ...root, ...(next.subgraphs ? { subgraphs: next.subgraphs } : {}) }, sg, next);
    this.history.set(merged, step);
  }

  undo() { if (!this.readOnly) this.history.undo(); }
  redo() { if (!this.readOnly) this.history.redo(); }

  // ------------------------------------------------------------------ selection
  get selection(): EditorSelection {
    const g = this.graph;
    const s = this.sel;
    const nodes = s.nodes.filter((id) => g.nodes.some((n) => n.id === id));
    const comments = s.comments.filter((id) => g.comments?.some((c) => c.id === id));
    const edges = s.edges.filter((id) => g.edges.some((e) => e.id === id));
    if (nodes.length === s.nodes.length && comments.length === s.comments.length && edges.length === s.edges.length) return s;
    return (this.sel = { nodes, comments, edges });
  }

  select(next: Partial<EditorSelection> | readonly string[], mode: SelectMode = "replace") {
    const n: EditorSelection = Array.isArray(next)
      ? { nodes: next as readonly string[], comments: [], edges: [] }
      : { nodes: [], comments: [], edges: [], ...(next as Partial<EditorSelection>) };
    const cur = this.selection;
    const merge = (a: readonly string[], b: readonly string[]) => {
      if (mode === "replace") return uniq(b);
      if (mode === "add") return uniq([...a, ...b]);
      if (mode === "remove") return a.filter((x) => !b.includes(x));
      return [...a.filter((x) => !b.includes(x)), ...b.filter((x) => !a.includes(x))];
    };
    const sel = { nodes: merge(cur.nodes, n.nodes), comments: merge(cur.comments, n.comments), edges: merge(cur.edges, n.edges) };
    const same = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((x, i) => x === b[i]);
    if (same(sel.nodes, cur.nodes) && same(sel.comments, cur.comments) && same(sel.edges, cur.edges)) return;
    this.sel = sel;
    this.bump();
  }
  clearSelection() { this.select(EMPTY_SELECTION); }
  selectAll() {
    const g = this.graph;
    this.select({ nodes: g.nodes.map((n) => n.id), comments: (g.comments ?? []).map((c) => c.id) });
  }

  // ------------------------------------------------------------------ subgraph navigation
  enter(sgId: string) {
    if (!this.root.subgraphs?.[sgId]) return;
    this.pathIds = [...this.path, sgId];
    this.sel = EMPTY_SELECTION;
    this.bump();
    requestAnimationFrame(() => this.fit());
  }
  /** Go back to `depth` levels (0 = the main graph). */
  exitTo(depth: number) {
    if (depth >= this.path.length) return;
    const left = this.subgraph;
    this.pathIds = this.path.slice(0, Math.max(0, depth));
    this.sel = left !== undefined ? { ...EMPTY_SELECTION, nodes: this.graph.nodes.filter((n) => n.subgraph === left).map((n) => n.id) } : EMPTY_SELECTION;
    this.bump();
    requestAnimationFrame(() => this.fit(this.sel.nodes.length ? this.sel.nodes : undefined));
  }

  // ------------------------------------------------------------------ viewport
  get viewport(): Viewport { return this.vp; }
  readonly onViewport = (fn: (v: Viewport) => void) => {
    this.vpListeners.add(fn);
    return () => void this.vpListeners.delete(fn);
  };
  setViewport(v: Viewport) {
    const next = { x: v.x, y: v.y, z: clampZ(v.z) };
    if (next.x === this.vp.x && next.y === this.vp.y && next.z === this.vp.z) return;
    this.vp = next;
    this.vpListeners.forEach((l) => l(next));
  }
  panBy(dx: number, dy: number) { this.setViewport({ ...this.vp, x: this.vp.x + dx, y: this.vp.y + dy }); }
  /** Zoom by `factor`, keeping the graph point under screen (sx, sy) fixed. */
  zoomAt(sx: number, sy: number, factor: number) {
    const { x, y, z } = this.vp;
    const nz = clampZ(z * factor);
    this.setViewport({ x: sx - ((sx - x) / z) * nz, y: sy - ((sy - y) / z) * nz, z: nz });
  }
  toGraph(sx: number, sy: number) {
    const { x, y, z } = this.vp;
    return { x: (sx - x) / z, y: (sy - y) / z };
  }
  /** Frame some nodes (default: the selection, else everything). Never zooms past 1. */
  fit(ids?: readonly string[]) {
    const g = this.graph;
    const want = ids ?? (this.selection.nodes.length ? this.selection.nodes : undefined);
    const boxes: Box[] = g.nodes.filter((n) => !want || want.includes(n.id)).map((n) => nodeBox(n, this.registry, g));
    if (!want) boxes.push(...(g.comments ?? []));
    const w = this.el?.clientWidth ?? 800;
    const h = this.el?.clientHeight ?? 600;
    if (!boxes.length) return this.setViewport({ x: w / 2 - 100, y: h / 2 - 60, z: 1 });
    const b = boundsOf(boxes);
    const pad = Math.min(48, w * 0.06, h * 0.06);
    const z = clampZ(Math.min(1, (w - pad * 2) / Math.max(1, b.w), (h - pad * 2) / Math.max(1, b.h)));
    this.setViewport({ x: w / 2 - (b.x + b.w / 2) * z, y: h / 2 - (b.y + b.h / 2) * z, z });
  }
}
