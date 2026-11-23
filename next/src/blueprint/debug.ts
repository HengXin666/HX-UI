import { evaluateGraph, findEntries, type EvalResult, type StepEvent, type StepTarget } from "./evaluate";
import type { Registry } from "./registry";
import { resolveNodePath } from "./subgraph";
import type { BlueprintGraph } from "./types";

/**
 * Debug session (UE5 "Blueprint Debugger"), framework-free: runs `evaluateGraph` on a snapshot and
 * turns its `onBefore` hook into breakpoints, single stepping and a stop button.
 *
 *   const s = new DebugSession(graph, registry, { breakpoints: new Set(["branch"]) }, onEvent);
 *   s.start();                 // runs until the breakpoint
 *   await s.waitForPause();    // { node: "branch", edge: "e1" }
 *   s.step();                  // run one node, pause before the next
 *   s.continue();              // run to the next breakpoint or the end
 *   s.stop();
 *
 * Breakpoints are keyed like validation ids: "node" on the main graph, "<subgraphId>/<node>" inside a
 * collapsed graph, so one breakpoint in a function stops at every call site. Paths in events are
 * runtime paths ("<shell>/<node>"); `keyOf` maps one to its breakpoint key.
 */

export type DebugStatus = "idle" | "running" | "paused" | "done" | "stopped" | "error";

export interface DebugState {
  readonly status: DebugStatus;
  /** Where the run is paused (or about to go). */
  readonly at?: StepTarget;
  readonly steps: number;
  /** Every exec step so far, in order. */
  readonly trace: readonly StepEvent[];
  /** Last outputs of every node that computed, by runtime path. */
  readonly values: ReadonlyMap<string, Readonly<Record<string, unknown>>>;
  readonly result?: EvalResult;
  readonly error?: string;
}

export type DebugEvent =
  | { readonly type: "before"; readonly target: StepTarget }
  | { readonly type: "step"; readonly step: StepEvent }
  | { readonly type: "status"; readonly state: DebugState };

export interface DebugOptions {
  /** Entry node id on the main graph. Default: the first event node (findEntries). */
  readonly entry?: string;
  /** Breakpoint keys, read live (a Set you keep editing works). */
  readonly breakpoints?: { has(key: string): boolean };
  /** Pause before the first node. */
  readonly startPaused?: boolean;
  /** Wait this long before each exec step (lets a UI animate the hop). Default 0. */
  readonly stepMs?: number;
  readonly variables?: Readonly<Record<string, unknown>>;
  readonly maxSteps?: number;
}

export const IDLE_DEBUG: DebugState = { status: "idle", steps: 0, trace: [], values: new Map() };

export class DebugSession {
  private readonly graph: BlueprintGraph;
  private readonly registry: Registry;
  private readonly opts: DebugOptions;
  private readonly emit: (e: DebugEvent) => void;
  private readonly abort = new AbortController();
  private mode: "run" | "step";
  private resume: (() => void) | undefined;
  private pauseWaiters: ((t: StepTarget | undefined) => void)[] = [];
  private st: DebugState = IDLE_DEBUG;
  private readonly trace: StepEvent[] = [];
  private readonly values = new Map<string, Readonly<Record<string, unknown>>>();

  constructor(graph: BlueprintGraph, registry: Registry, opts: DebugOptions = {}, onEvent: (e: DebugEvent) => void = () => {}) {
    this.graph = graph;
    this.registry = registry;
    this.opts = opts;
    this.emit = onEvent;
    this.mode = opts.startPaused ? "step" : "run";
  }

  get state(): DebugState { return this.st; }

  /** Breakpoint key of a runtime path ("shell/node" -> "sg/node"). */
  keyOf(path: string): string {
    return resolveNodePath(this.graph, path)?.key ?? path;
  }

  private set(patch: Partial<DebugState>) {
    this.st = { ...this.st, ...patch, steps: this.trace.length, trace: this.trace, values: this.values };
    this.emit({ type: "status", state: this.st });
    if (this.st.status !== "running") {
      const w = this.pauseWaiters;
      this.pauseWaiters = [];
      w.forEach((f) => f(this.st.status === "paused" ? this.st.at : undefined));
    }
  }

  /** Run. Resolves with the evaluation result when the run ends (finished, stopped or failed). */
  async start(): Promise<EvalResult | undefined> {
    if (this.st.status !== "idle") return this.st.result;
    const entry = this.opts.entry ?? findEntries(this.graph, this.registry)[0];
    if (entry === undefined) {
      this.set({ status: "error", error: "No entry node to run" });
      return undefined;
    }
    this.set({ status: "running" });
    const delay = this.opts.stepMs ?? 0;
    try {
      const result = await evaluateGraph(this.graph, this.registry, {
        entry,
        ...(this.opts.maxSteps !== undefined ? { maxSteps: this.opts.maxSteps } : {}),
        ...(this.opts.variables ? { variables: this.opts.variables } : {}),
        signal: this.abort.signal,
        onBefore: async (target) => {
          this.emit({ type: "before", target });
          const hit = this.mode === "step" || !!this.opts.breakpoints?.has(this.keyOf(target.node));
          if (hit && !this.abort.signal.aborted) {
            this.set({ status: "paused", at: target });
            await new Promise<void>((r) => (this.resume = r));
            this.resume = undefined;
          } else if (delay > 0 && !this.abort.signal.aborted) {
            this.st = { ...this.st, at: target };
            await new Promise((r) => setTimeout(r, delay));
          }
        },
        onStep: (step) => {
          this.trace.push(step);
          if (!step.disabled) this.values.set(step.node, step.outputs);
          this.emit({ type: "step", step });
        },
        onCompute: (node, outputs) => void this.values.set(node, outputs),
      });
      const errs = [...result.errors.values()];
      this.set({
        status: result.stopped ? "stopped" : errs.length ? "error" : "done", result,
        ...(errs.length ? { error: errs[0] } : {}),
      });
      return result;
    } catch (err) {
      this.set({ status: "error", error: err instanceof Error ? err.message : String(err) });
      return undefined;
    }
  }

  /** Run to the next breakpoint or the end. */
  continue() {
    this.mode = "run";
    this.wake();
  }

  /** Leave a pause: status flips to running synchronously, so waitForPause() waits for the next one. */
  private wake() {
    if (this.st.status !== "paused" || !this.resume) return;
    this.set({ status: "running" });
    this.resume();
  }

  /** Run the paused node, then pause before the next one. Starts a stepped run when idle. */
  step() {
    this.mode = "step";
    if (this.st.status === "idle") void this.start();
    else this.wake();
  }

  stop() {
    if (this.st.status !== "running" && this.st.status !== "paused") return;
    this.abort.abort();
    this.resume?.();
  }

  /** Resolves when the run pauses (with where) or ends (undefined). */
  waitForPause(): Promise<StepTarget | undefined> {
    if (this.st.status === "paused") return Promise.resolve(this.st.at);
    if (this.st.status !== "running" && this.st.status !== "idle") return Promise.resolve(undefined);
    return new Promise((r) => this.pauseWaiters.push(r));
  }
}
