import { applyOps, type ApplyOptions, type ApplyResult, type GraphOp } from "./ops";
import type { Registry } from "./registry";
import type { BlueprintGraph } from "./types";

/**
 * Undo/redo over immutable snapshots, framework-free (the React hook in the UI milestone wraps it
 * with useSyncExternalStore through `subscribe`).
 *
 * One `apply(ops)` = one undo step. Consecutive steps with the same non-null `tag` inside
 * `coalesceMs` merge into one (dragging a node fires many moves, undo should take one).
 */

export interface StepOptions {
  readonly label?: string;
  /** Steps with the same tag close together merge. null / undefined never merges. */
  readonly tag?: string | null;
}

export interface History {
  readonly current: BlueprintGraph;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly undoLabel: string | undefined;
  readonly redoLabel: string | undefined;
  readonly depth: { readonly past: number; readonly future: number };
  /** Apply ops as one undoable step. Nothing is recorded when the ops change nothing. */
  apply(ops: readonly GraphOp[], registry: Registry, opts?: StepOptions & ApplyOptions): ApplyResult;
  /** Record an arbitrary new graph as one step (e.g. the end of a drag). */
  set(graph: BlueprintGraph, opts?: StepOptions): void;
  undo(): BlueprintGraph | undefined;
  redo(): BlueprintGraph | undefined;
  /** Replace the current graph and clear both stacks. */
  reset(graph: BlueprintGraph): void;
  subscribe(listener: () => void): () => void;
}

interface Entry {
  readonly graph: BlueprintGraph;
  readonly label?: string;
}

export function createHistory(
  initial: BlueprintGraph,
  opts: { readonly limit?: number; readonly coalesceMs?: number; readonly now?: () => number } = {},
): History {
  const limit = opts.limit ?? 100;
  const coalesceMs = opts.coalesceMs ?? 400;
  const now = opts.now ?? (() => Date.now());
  let current = initial;
  let past: Entry[] = [];
  let future: Entry[] = [];
  let last: { tag: string; at: number } | undefined;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  const record = (next: BlueprintGraph, o: StepOptions = {}) => {
    if (next === current) return;
    const t = now();
    const merge = o.tag != null && last?.tag === o.tag && t - last.at < coalesceMs && past.length > 0;
    if (!merge) past = [...past, { graph: current, ...(o.label !== undefined ? { label: o.label } : {}) }].slice(-limit);
    last = o.tag != null ? { tag: o.tag, at: t } : undefined;
    future = [];
    current = next;
    emit();
  };

  const h: History = {
    get current() { return current; },
    get canUndo() { return past.length > 0; },
    get canRedo() { return future.length > 0; },
    get undoLabel() { return past[past.length - 1]?.label; },
    get redoLabel() { return future[0]?.label; },
    get depth() { return { past: past.length, future: future.length }; },
    apply(ops, registry, o = {}) {
      const r = applyOps(current, ops, registry, o);
      record(r.graph, o);
      return r;
    },
    set: record,
    undo() {
      const prev = past[past.length - 1];
      if (!prev) return undefined;
      past = past.slice(0, -1);
      future = [{ graph: current, ...(prev.label !== undefined ? { label: prev.label } : {}) }, ...future].slice(0, limit);
      current = prev.graph;
      last = undefined;
      emit();
      return current;
    },
    redo() {
      const next = future[0];
      if (!next) return undefined;
      future = future.slice(1);
      past = [...past, { graph: current, ...(next.label !== undefined ? { label: next.label } : {}) }].slice(-limit);
      current = next.graph;
      last = undefined;
      emit();
      return current;
    },
    reset(graph) {
      current = graph;
      past = [];
      future = [];
      last = undefined;
      emit();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  return h;
}
