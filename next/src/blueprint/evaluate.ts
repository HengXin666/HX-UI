import { edgeKind, getPorts, type ResolvedPin } from "./ports";
import type { Registry } from "./registry";
import { TUNNEL_IN, TUNNEL_OUT, VAR_GET, VAR_SET } from "./registry";
import type { BlueprintEdge, BlueprintGraph, BlueprintNode, EvalOutput, SubGraphDef, SubgraphScope, VariableDef } from "./types";
import { topoSort } from "./validate";

/**
 * Interpreter.
 *
 * With an `entry`, it walks exec wires from that node (UE5 semantics): each executed node pulls its
 * data inputs, pure nodes are recomputed per execution step (cached within the step), impure nodes
 * keep their last outputs. `$exec` in a node's result picks the exec outputs to fire, otherwise all
 * fire in declared order. Loops are allowed, bounded by `maxSteps`.
 *
 * Without an entry it evaluates every node once in data order (handy for pure graphs and previews).
 *
 * Collapsed graphs run by kind (see SubgraphKind): "graph" walks its body and then fires the exit
 * pins it reached; "macro" is inlined, an exit pin continues the outer graph immediately; "function"
 * gets fresh local variables, stops at the first exit it reaches (return) and then fires its single
 * exec output. Node ids inside are reported as `<shellId>/<innerId>`.
 *
 * Disabled nodes are skipped: exec passes through to the first exec output, each data output takes
 * the first input of an assignable type. They are reported to `onStep` with `disabled: true` but do
 * not appear in `trace` or `outputs`.
 *
 * Variables: `var.get` reads, `var.set` writes (function locals first, then graph variables).
 * Initial values are the variable defaults, overridable with `opts.variables`.
 */

export interface StepEvent {
  /** Path id of the node that ran. */
  readonly node: string;
  readonly outputs: Readonly<Record<string, unknown>>;
  /** Exec outputs that fired after it. */
  readonly fired: readonly string[];
  /** Path id of the exec wire that led here (`<shellId>/<edgeId>` inside collapsed graphs). */
  readonly edge?: string;
  /** The node is disabled: it was passed through, not run. */
  readonly disabled?: boolean;
}

/** Before an exec step: where execution is about to go. */
export interface StepTarget {
  readonly node: string;
  readonly edge?: string;
}

export interface EvalOptions {
  readonly entry?: string;
  readonly maxSteps?: number;
  /** Called after every executed node, the hook for exec-flow animation and watch values. */
  readonly onStep?: (step: StepEvent) => void;
  /** Awaited before every exec step: the hook for breakpoints and stepping (return a promise to pause). */
  readonly onBefore?: (target: StepTarget) => void | Promise<void>;
  /** Called whenever a node's data outputs are computed (pure nodes included), for "last value" readouts. */
  readonly onCompute?: (node: string, outputs: Readonly<Record<string, unknown>>) => void;
  /** Initial variable values by id (defaults come from the variable definitions). */
  readonly variables?: Readonly<Record<string, unknown>>;
  /** Abort to stop the run between steps. */
  readonly signal?: AbortSignal;
}

export interface EvalResult {
  readonly outputs: ReadonlyMap<string, Readonly<Record<string, unknown>>>;
  readonly errors: ReadonlyMap<string, string>;
  /** Path ids in exec order (empty without an entry). */
  readonly trace: readonly string[];
  /** Graph variable values at the end. */
  readonly variables: ReadonlyMap<string, unknown>;
  /** The run was aborted through `signal`. */
  readonly stopped: boolean;
  readonly ok: boolean;
}

type Level = { readonly nodes: readonly BlueprintNode[]; readonly edges: readonly BlueprintEdge[] } & SubgraphScope;

interface Scope {
  readonly level: Level;
  readonly prefix: string;
  /** Value of an external input pin, for `subgraph.in` nodes. */
  readonly tunnelInput?: (pin: string) => Promise<unknown>;
  /** Called when exec reaches an exit tunnel pin. */
  readonly onExit?: (pin: string) => Promise<void>;
  /** Exit tunnel pins reached during an exec walk. */
  readonly exits: string[];
  /** Function locals of this call (shared by macros / graphs inlined inside it). */
  readonly locals: Map<string, unknown> | undefined;
  /** A function body: the first exit reached returns. */
  readonly fn?: boolean;
  /** Set once a function body has returned: nothing more runs in it. */
  halted?: boolean;
}

type Cache = Map<string, Record<string, unknown>>;

const clone = (v: unknown): unknown => (v === undefined || typeof v !== "object" || v === null ? v : JSON.parse(JSON.stringify(v)));
const initVars = (defs: readonly VariableDef[] | undefined, over: Readonly<Record<string, unknown>> = {}) =>
  new Map((defs ?? []).map((v) => [v.id, v.id in over ? over[v.id] : clone(v.default)]));

export async function evaluateGraph(graph: BlueprintGraph, registry: Registry, opts: EvalOptions = {}): Promise<EvalResult> {
  const outputs = new Map<string, Record<string, unknown>>();
  const errors = new Map<string, string>();
  const trace: string[] = [];
  const computing = new Set<string>();
  const maxSteps = opts.maxSteps ?? 10_000;
  const globals = initVars(graph.variables, opts.variables);
  const root: Scope = { level: graph, prefix: "", exits: [], locals: undefined };
  let stopped = false;
  const isImpure = (n: BlueprintNode, s: Scope) => getPorts(n, registry, s.level).inputs.some((p) => p.exec);
  const store = (s: Scope, id: string | undefined) => (id !== undefined && s.locals?.has(id) ? s.locals : globals);

  /** Data outputs of a node, computing it if needed. */
  const pull = async (s: Scope, n: BlueprintNode, cache: Cache): Promise<Record<string, unknown> | undefined> => {
    const path = s.prefix + n.id;
    if (isImpure(n, s) && outputs.has(path)) return outputs.get(path);
    if (cache.has(path)) return cache.get(path);
    if (computing.has(path)) {
      errors.set(path, `Data cycle while evaluating: ${[...computing, path].join(" -> ")}`);
      return undefined;
    }
    computing.add(path);
    try {
      const out = await compute(s, n, cache);
      if (out) {
        cache.set(path, out);
        if (!n.disabled) opts.onCompute?.(path, out);
      }
      return out;
    } catch (err) {
      errors.set(path, err instanceof Error ? err.message : String(err));
      return undefined;
    } finally {
      computing.delete(path);
    }
  };

  /** Value arriving at an input pin: wire, then literal, then pin default. */
  const inputValue = async (s: Scope, n: BlueprintNode, pin: string, fallback: unknown, cache: Cache) => {
    const e = s.level.edges.find((x) => x.to.node === n.id && x.to.pin === pin);
    const src = e && s.level.nodes.find((x) => x.id === e.from.node);
    if (e && src) return (await pull(s, src, cache))?.[e.from.pin];
    return n.values?.[pin] ?? fallback;
  };

  /** Disabled node: each data output passes the first input whose type fits (same id first). */
  const passThrough = async (s: Scope, n: BlueprintNode, cache: Cache) => {
    const ports = getPorts(n, registry, s.level);
    const ins = ports.inputs.filter((p) => !p.exec);
    const out: Record<string, unknown> = {};
    for (const o of ports.outputs) {
      if (o.exec) continue;
      const src: ResolvedPin | undefined = ins.find((p) => p.id === o.id && registry.assignable(p.type, o.type)) ?? ins.find((p) => registry.assignable(p.type, o.type));
      out[o.id] = src ? await inputValue(s, n, src.id, src.default, cache) : undefined;
    }
    return out;
  };

  const compute = async (s: Scope, n: BlueprintNode, cache: Cache): Promise<Record<string, unknown> | undefined> => {
    if (n.disabled) return passThrough(s, n, cache);
    const ports = getPorts(n, registry, s.level);
    if (n.type === TUNNEL_IN) {
      const out: Record<string, unknown> = {};
      for (const p of ports.outputs) if (!p.exec) out[p.id] = await s.tunnelInput?.(p.id);
      return out;
    }
    if (n.type === VAR_GET) {
      if (ports.missing) throw new Error(`Variable "${n.variable ?? "?"}" not found`);
      return { value: store(s, n.variable).get(n.variable!) };
    }
    if (n.type === VAR_SET) {
      if (ports.missing) throw new Error(`Variable "${n.variable ?? "?"}" not found`);
      const v = await inputValue(s, n, "value", ports.inputs.find((p) => p.id === "value")?.default, cache);
      store(s, n.variable).set(n.variable!, v);
      return { value: v };
    }
    if (n.subgraph !== undefined) return runSubgraph(s, n, undefined, cache);
    const def = registry.node(n.type);
    if (!def) throw new Error(`Unknown node type "${n.type}"`);
    const inputs: Record<string, unknown> = {};
    for (const p of ports.inputs) if (!p.exec) inputs[p.id] = await inputValue(s, n, p.id, p.default, cache);
    const params: Record<string, unknown> = {};
    for (const p of def.params) params[p.id] = n.values?.[p.id] ?? p.default;
    if (!def.evaluate) {
      const pass: Record<string, unknown> = {};
      for (const o of ports.outputs) if (!o.exec) pass[o.id] = inputs[o.id];
      return pass;
    }
    return { ...(await def.evaluate({ inputs, params, node: n })) };
  };

  /** Data outputs of a collapsed graph: the exit tunnel's inputs. */
  const exitValues = async (sg: SubGraphDef, inner: Scope) => {
    const out: Record<string, unknown> = {};
    const cache: Cache = new Map();
    for (const t of sg.nodes.filter((x) => x.type === TUNNEL_OUT)) {
      for (const p of getPorts(t, registry, inner.level).inputs) if (!p.exec) out[p.id] = await inputValue(inner, t, p.id, undefined, cache);
    }
    return out;
  };

  /** Run a collapsed graph. With `viaExec`, walk exec from that entry pin, otherwise only pull data. */
  const runSubgraph = async (s: Scope, shell: BlueprintNode, viaExec: string | undefined, cache: Cache) => {
    const sg = shell.subgraph !== undefined ? graph.subgraphs?.[shell.subgraph] : undefined;
    if (!sg) throw new Error(`Collapsed graph "${shell.subgraph ?? "?"}" not found`);
    const kind = sg.kind ?? "graph";
    const shellPath = s.prefix + shell.id;
    const isFn = kind === "function";
    const level: Level = {
      nodes: sg.nodes, edges: sg.edges,
      ...(graph.subgraphs ? { subgraphs: graph.subgraphs } : {}),
      ...(graph.variables ? { variables: graph.variables } : {}),
      ...(isFn ? { locals: sg.variables ?? [] } : s.level.locals ? { locals: s.level.locals } : {}),
    };
    const inner: Scope = {
      level,
      prefix: `${shellPath}/`,
      tunnelInput: (pin) => inputValue(s, shell, pin, undefined, cache),
      exits: [],
      locals: isFn ? initVars(sg.variables) : s.locals,
      fn: isFn,
      ...(kind === "macro" && viaExec !== undefined
        ? {
          onExit: async (pin: string) => {
            const data = await exitValues(sg, inner);
            outputs.set(shellPath, data);
            opts.onStep?.({ node: shellPath, outputs: data, fired: [pin] });
            await fire(s, shell, [pin]);
          },
        }
        : {}),
    };
    if (viaExec !== undefined) {
      for (const t of sg.nodes.filter((x) => x.type === TUNNEL_IN)) await fire(inner, t, [viaExec]);
      if (kind === "macro") return undefined;
    }
    const out = await exitValues(sg, inner);
    return viaExec !== undefined ? { ...out, $exec: isFn ? inner.exits.slice(0, 1) : inner.exits } : out;
  };

  let steps = 0;
  /** Follow the wires leaving `pins` of node `n`. */
  const fire = async (s: Scope, n: BlueprintNode, pins: readonly string[]) => {
    for (const pin of pins) {
      for (const e of s.level.edges.filter((x) => x.from.node === n.id && x.from.pin === pin)) {
        if (s.halted || stopped || errors.has("*")) return;
        const next = s.level.nodes.find((x) => x.id === e.to.node);
        if (next) await execute(s, next, e.to.pin, s.prefix + e.id);
      }
    }
  };

  const execute = async (s: Scope, n: BlueprintNode, via: string, edge?: string): Promise<void> => {
    if (n.type === TUNNEL_OUT) {
      s.exits.push(via);
      if (s.fn) s.halted = true;
      if (s.onExit) await s.onExit(via);
      return;
    }
    if (opts.signal?.aborted) {
      stopped = true;
      return;
    }
    if (++steps > maxSteps) {
      errors.set("*", `Stopped after ${maxSteps} exec steps (infinite loop?)`);
      return;
    }
    const path = s.prefix + n.id;
    await opts.onBefore?.({ node: path, ...(edge !== undefined ? { edge } : {}) });
    if (opts.signal?.aborted) {
      stopped = true;
      return;
    }
    const execOuts = getPorts(n, registry, s.level).outputs.filter((p) => p.exec).map((p) => p.id);
    if (n.disabled) {
      const fired = execOuts.slice(0, 1);
      opts.onStep?.({ node: path, outputs: {}, fired, ...(edge !== undefined ? { edge } : {}), disabled: true });
      await fire(s, n, fired);
      return;
    }
    trace.push(path);
    let result: Record<string, unknown> | undefined;
    try {
      result = n.subgraph !== undefined ? await runSubgraph(s, n, via, new Map()) : await compute(s, n, new Map());
    } catch (err) {
      errors.set(path, err instanceof Error ? err.message : String(err));
      return;
    }
    if (!result) return;
    const { $exec, ...data } = result as EvalOutput;
    outputs.set(path, data);
    if (n.subgraph === undefined) opts.onCompute?.(path, data);
    const fired = $exec === undefined ? execOuts : (typeof $exec === "string" ? [$exec] : [...$exec]).filter((p) => execOuts.includes(p));
    opts.onStep?.({ node: path, outputs: data, fired, ...(edge !== undefined ? { edge } : {}) });
    await fire(s, n, fired);
  };

  if (opts.entry !== undefined) {
    const start = graph.nodes.find((n) => n.id === opts.entry);
    if (!start) errors.set(opts.entry, `Entry node "${opts.entry}" not found`);
    else await execute(root, start, "");
    return { outputs, errors, trace, variables: globals, stopped, ok: errors.size === 0 };
  }

  // Data mode: everything once, in data order. Cycles still evaluate node by node so the error names them.
  const dataEdges = graph.edges.filter((e) => edgeKind(graph, e, registry) === "data");
  const order = topoSort(graph.nodes.map((n) => n.id), dataEdges) ?? graph.nodes.map((n) => n.id);
  const cache: Cache = new Map();
  for (const id of order) {
    const n = graph.nodes.find((x) => x.id === id)!;
    const out = await pull(root, n, cache);
    if (out) outputs.set(id, out);
  }
  return { outputs, errors, trace, variables: globals, stopped, ok: errors.size === 0 };
}

/** Exec entry candidates: event nodes (exec out, no exec in), else exec nodes with no incoming exec wire. */
export function findEntries(graph: BlueprintGraph, registry: Registry): string[] {
  const events = graph.nodes.filter((n) => {
    const p = getPorts(n, registry, graph);
    return !p.inputs.some((x) => x.exec) && p.outputs.some((x) => x.exec);
  });
  if (events.length) return events.map((n) => n.id);
  const fed = new Set(graph.edges.filter((e) => edgeKind(graph, e, registry) === "exec").map((e) => e.to.node));
  return graph.nodes.filter((n) => getPorts(n, registry, graph).inputs.some((x) => x.exec) && !fed.has(n.id)).map((n) => n.id);
}
