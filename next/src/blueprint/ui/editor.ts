import { createHistory, type History, type StepOptions } from "../history";
import { createIdGen, type IdGen } from "../ids";
import type { BreakpointSpec, DebugEvent, DebugOptions, DebugSession, DebugState } from "../debug";
import { mergeInner, type ApplyResult, type GraphOp } from "../ops";
import type { Registry } from "../registry";
import { boundsOf, nodeBox, type Box } from "../size";
import { subgraphAsGraph, subgraphPath } from "../subgraph";
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

/**
 * What the Details panel shows when it is not the canvas selection: a variable or a function /
 * macro / collapsed graph picked in My Blueprint. Selecting nodes or comments clears it.
 */
export type InspectTarget =
  | { readonly kind: "variable"; readonly id: string; /** subgraph id for function locals */ readonly sg?: string | undefined }
  | { readonly kind: "subgraph"; readonly id: string }
  | { readonly kind: "graph" };

export const ZOOM = { min: 0.2, max: 2.5 } as const;
const IDLE: DebugState = { status: "idle", steps: 0, trace: [], values: new Map(), hits: new Map() };
/** Options of `run()`: the session options minus the breakpoints (the editor's own set is used). */
export type RunOptions = Omit<DebugOptions, "breakpoints" | "conditions">;
export const EMPTY_SELECTION: EditorSelection = { nodes: [], comments: [], edges: [] };

const uniq = (a: readonly string[]) => [...new Set(a)];
const clampZ = (z: number) => Math.min(ZOOM.max, Math.max(ZOOM.min, z));

export class BlueprintEditor {
  readonly registry: Registry;
  readonly history: History;
  readOnly = false;
  snap = 16;
  /** Wheel behaviour, see useCanvas: "zoom" always, "ctrl" only with Ctrl / Cmd or once focused. */
  wheel: "zoom" | "ctrl" = "ctrl";
  /** Set by the host (controlled mode). Called after every document change made by the editor. */
  onChange: ((graph: BlueprintGraph) => void) | undefined;
  /** In-memory clipboard, used when the system clipboard is unavailable. */
  clip: string | undefined;
  /** Last pointer position in graph units (paste / Tab menu / C place things there). */
  pointer: { x: number; y: number } | undefined;
  el: HTMLElement | null = null;
  /** Node type placed by a click on empty canvas while a place key (B / S / D) is held. */
  placing: string | undefined;
  /** The view has debugging on (menus offer run to cursor, conditions). Set by <Blueprint>. */
  debugEnabled = false;

  private sel: EditorSelection = EMPTY_SELECTION;
  private pathIds: readonly string[] = [];
  private vp: Viewport = { x: 40, y: 40, z: 1 };
  private ver = 0;
  private emitted: BlueprintGraph;
  private readonly listeners = new Set<() => void>();
  private readonly vpListeners = new Set<(v: Viewport) => void>();
  private viewCache: { root: BlueprintGraph; sg: string | undefined; graph: BlueprintGraph } | undefined;
  /** Breakpoint keys: "node" on the main graph, "<subgraphId>/<node>" inside a collapsed graph. */
  readonly breakpoints = new Set<string>();
  /** Conditions / hit counts / enabled flags per breakpoint key (conditional breakpoints). */
  readonly breakpointSpecs = new Map<string, BreakpointSpec>();
  /** Watched pins: "<level key>|in:<pin>" or "<level key>|out:<pin>". */
  readonly watches = new Set<string>();
  private insp: InspectTarget | undefined;
  private dbg: DebugState = IDLE;
  private session: DebugSession | undefined;
  private readonly debugListeners = new Set<(e: DebugEvent) => void>();
  /** Delay per exec hop for `run()` (the pulse animation), ms. */
  stepMs = 200;
  /** Screen space covered by docked panels; `fit` frames the graph in what is left. */
  fitInset = { left: 0, top: 0, right: 0, bottom: 0 };
  /** Short status line shown at the bottom of the editor (role=status). */
  notice: string | undefined;
  private noticeTimer: ReturnType<typeof setTimeout> | undefined;
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
    const graph = (sg !== undefined && subgraphAsGraph(root, sg, this.registry)) || root;
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

  /**
   * Apply JSON ops to the document root as ONE undo step, whatever level is on screen (My Blueprint
   * and Details use it for functions, variables and graph settings).
   */
  applyDocument(ops: readonly GraphOp[], step: StepOptions = {}): ApplyResult | undefined {
    if (this.readOnly || !ops.length) return undefined;
    return this.history.apply(ops, this.registry, step);
  }

  /** Apply JSON ops on a given level (undefined = main graph, else a subgraph id) as ONE undo step. */
  applyAt(sg: string | undefined, ops: readonly GraphOp[], step: StepOptions = {}): ApplyResult | undefined {
    if (this.readOnly || !ops.length) return undefined;
    return this.history.apply(ops, this.registry, { ...step, ...(sg !== undefined ? { subgraph: sg } : {}) });
  }

  /** Open a subgraph by id, through the full path of call sites that reach it (breadcrumb). */
  open(sgId: string | undefined) {
    if (sgId === undefined) return this.exitTo(0);
    this.openPath(subgraphPath(this.root, sgId) ?? [sgId]);
  }

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
    const merged = sg === undefined ? next : mergeInner(root, sg, next);
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
    if (sel.nodes.length || sel.comments.length) this.insp = undefined;
    this.bump();
  }

  // ------------------------------------------------------------------ inspection (Details panel)
  /** The item My Blueprint picked, while no canvas selection overrides it. */
  get inspected(): InspectTarget | undefined {
    const t = this.insp;
    if (!t) return undefined;
    if (t.kind === "subgraph" && !this.root.subgraphs?.[t.id]) return undefined;
    if (t.kind === "variable") {
      const list = t.sg !== undefined ? this.root.subgraphs?.[t.sg]?.variables : this.root.variables;
      if (!list?.some((v) => v.id === t.id)) return undefined;
    }
    return t;
  }
  /** Show a variable / function / the graph settings in Details (clears the canvas selection). */
  inspect(t: InspectTarget | undefined) {
    this.insp = t;
    this.sel = EMPTY_SELECTION;
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
  /** Open a subgraph by its full path from the main graph (what breadcrumbs show). */
  openPath(path: readonly string[]) {
    const subs = this.root.subgraphs ?? {};
    const ok = path.filter((id) => subs[id]);
    this.pathIds = ok;
    this.sel = EMPTY_SELECTION;
    this.bump();
    requestAnimationFrame(() => this.fit());
  }
  /** Open the level a validation-style id ("node" or "sg/node") lives on; returns the local id. */
  reveal(key: string): string {
    const i = key.lastIndexOf("/");
    const sg = i < 0 ? undefined : key.slice(0, i).split("/").pop();
    const local = i < 0 ? key : key.slice(i + 1);
    if (sg !== this.subgraph) {
      if (sg === undefined) this.exitTo(0);
      else this.openPath(subgraphPath(this.root, sg) ?? [sg]);
    }
    return local;
  }
  /** Key ("node" / "sg/node") of a node on the level being edited. */
  keyOf(localId: string): string {
    const sg = this.subgraph;
    return sg === undefined ? localId : `${sg}/${localId}`;
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

  /** Show a short message in the editor's status line for `ms`. */
  notify(text: string, ms = 2200) {
    clearTimeout(this.noticeTimer);
    this.notice = text;
    this.bump();
    this.noticeTimer = setTimeout(() => {
      this.notice = undefined;
      this.bump();
    }, ms);
  }

  // ------------------------------------------------------------------ debugging
  /** F9: toggle breakpoints on these nodes of the level being edited (default: the selection). */
  toggleBreakpoint(ids: readonly string[] = this.selection.nodes) {
    if (!ids.length) return;
    const keys = ids.map((id) => this.keyOf(id));
    const on = !keys.every((k) => this.breakpoints.has(k));
    keys.forEach((k) => (on ? this.breakpoints.add(k) : this.breakpoints.delete(k)));
    this.bump();
  }
  /** Set (or clear with undefined) the condition / hit count of a breakpoint key; adds the breakpoint. */
  setBreakpointSpec(key: string, spec: BreakpointSpec | undefined) {
    const clean = spec && (spec.condition?.trim() || (spec.hitCount ?? 0) > 1 || spec.enabled === false) ? spec : undefined;
    if (clean) {
      this.breakpointSpecs.set(key, clean);
      this.breakpoints.add(key);
    } else this.breakpointSpecs.delete(key);
    this.bump();
  }
  removeBreakpoint(key: string) {
    this.breakpoints.delete(key);
    this.breakpointSpecs.delete(key);
    this.bump();
  }
  /** Ctrl+Shift+F9: remove every breakpoint (all levels). */
  clearBreakpoints() {
    if (!this.breakpoints.size) return;
    this.breakpoints.clear();
    this.breakpointSpecs.clear();
    this.bump();
  }
  /** Remove a watch by its full key ("<level key>|in:<pin>"). */
  removeWatch(key: string) {
    if (this.watches.delete(key)) this.bump();
  }
  toggleWatch(node: string, dir: "in" | "out", pin: string) {
    const k = `${this.keyOf(node)}|${dir}:${pin}`;
    if (!this.watches.delete(k)) this.watches.add(k);
    this.bump();
  }
  get debug(): DebugState { return this.dbg; }
  readonly onDebug = (fn: (e: DebugEvent) => void) => {
    this.debugListeners.add(fn);
    return () => void this.debugListeners.delete(fn);
  };
  /**
   * Run the main graph from its entry (default: the first event node) with exec-flow pulses,
   * breakpoints and watch values. The interpreter is loaded on first use (its own chunk).
   */
  async run(opts: RunOptions = {}) {
    if (this.session && (this.dbg.status === "running" || this.dbg.status === "paused")) {
      if (opts.runTo !== undefined) this.session.runTo(opts.runTo);
      else if (opts.startPaused) this.session.step();
      else this.session.continue();
      return this.dbg.result;
    }
    const { DebugSession } = await import("../debug");
    const s = new DebugSession(this.root, this.registry, { stepMs: this.stepMs, ...opts, breakpoints: this.breakpoints, conditions: this.breakpointSpecs }, (e) => {
      if (this.session !== s) return;
      if (e.type === "status") {
        this.dbg = e.state;
        this.bump();
      }
      this.debugListeners.forEach((l) => l(e));
    });
    this.session?.stop();
    this.session = s;
    this.dbg = IDLE;
    this.debugListeners.forEach((l) => l({ type: "status", state: IDLE }));
    return s.start();
  }
  /**
   * Run to cursor: run (or continue) until this node of the level being edited is reached, once.
   * Default: the selected node. Breakpoints on the way still stop.
   */
  runToCursor(localId: string | undefined = this.selection.nodes[this.selection.nodes.length - 1]) {
    if (localId === undefined) return undefined;
    return this.run({ runTo: this.keyOf(localId) });
  }
  /** Continue a paused run (or start one). */
  continue() { return this.run(); }
  /** Single step: run the paused node and pause before the next, or start a stepped run. */
  step() { return this.run({ startPaused: true }); }
  stop() { this.session?.stop(); }
  /** Forget the last run (clears highlights and values). */
  clearDebug() {
    this.session?.stop();
    this.session = undefined;
    this.dbg = IDLE;
    this.debugListeners.forEach((l) => l({ type: "status", state: IDLE }));
    this.bump();
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
    const ins = this.fitInset;
    const fullW = this.el?.clientWidth ?? 800;
    // ignore the inset when it would leave too little room (narrow editors)
    const left = fullW - ins.left - ins.right >= 320 ? ins.left : 0;
    const w = fullW - left - (left ? ins.right : 0);
    const h = (this.el?.clientHeight ?? 600) - ins.top - ins.bottom;
    if (!boxes.length) return this.setViewport({ x: left + w / 2 - 100, y: ins.top + h / 2 - 60, z: 1 });
    const b = boundsOf(boxes);
    const pad = Math.min(48, w * 0.06, h * 0.06);
    const z = clampZ(Math.min(1, (w - pad * 2) / Math.max(1, b.w), (h - pad * 2) / Math.max(1, b.h)));
    this.setViewport({ x: left + w / 2 - (b.x + b.w / 2) * z, y: ins.top + h / 2 - (b.y + b.h / 2) * z, z });
  }
}
