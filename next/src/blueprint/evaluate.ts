import { edgeKind, getPorts } from "./ports";
import type { Registry } from "./registry";
import { TUNNEL_IN, TUNNEL_OUT } from "./registry";
import type { BlueprintEdge, BlueprintGraph, BlueprintNode, EvalOutput, SubgraphScope } from "./types";
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
 * Collapsed graphs run inline: exec enters through the matching tunnel pin and leaves through the
 * exit tunnel pins it reaches. Node ids inside are reported as `<shellId>/<innerId>`.
 */

export interface StepEvent {
  /** Path id of the node that ran. */
  readonly node: string;
  readonly outputs: Readonly<Record<string, unknown>>;
  /** Exec outputs that fired after it. */
  readonly fired: readonly string[];
}

export interface EvalOptions {
  readonly entry?: string;
  readonly maxSteps?: number;
  /** Called after every executed node, the hook for exec-flow animation and watch values. */
  readonly onStep?: (step: StepEvent) => void;
}

export interface EvalResult {
  readonly outputs: ReadonlyMap<string, Readonly<Record<string, unknown>>>;
  readonly errors: ReadonlyMap<string, string>;
  /** Path ids in exec order (empty without an entry). */
  readonly trace: readonly string[];
  readonly ok: boolean;
}

type Level = { readonly nodes: readonly BlueprintNode[]; readonly edges: readonly BlueprintEdge[] } & SubgraphScope;

interface Scope {
  readonly level: Level;
  readonly prefix: string;
  /** Value of an external input pin, for `subgraph.in` nodes. */
  readonly tunnelInput?: (pin: string) => Promise<unknown>;
  /** Exit tunnel pins reached during an exec walk. */
  readonly exits: string[];
}

type Cache = Map<string, Record<string, unknown>>;

export async function evaluateGraph(graph: BlueprintGraph, registry: Registry, opts: EvalOptions = {}): Promise<EvalResult> {
  const outputs = new Map<string, Record<string, unknown>>();
  const errors = new Map<string, string>();
  const trace: string[] = [];
  const computing = new Set<string>();
  const maxSteps = opts.maxSteps ?? 10_000;
  const root: Scope = { level: graph, prefix: "", exits: [] };
  const isImpure = (n: BlueprintNode, s: Scope) => getPorts(n, registry, s.level).inputs.some((p) => p.exec);

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
      if (out) cache.set(path, out);
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

  const compute = async (s: Scope, n: BlueprintNode, cache: Cache): Promise<Record<string, unknown> | undefined> => {
    const ports = getPorts(n, registry, s.level);
    if (n.type === TUNNEL_IN) {
      const out: Record<string, unknown> = {};
      for (const p of ports.outputs) if (!p.exec) out[p.id] = await s.tunnelInput?.(p.id);
      return out;
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

  /** Run a collapsed graph. With `viaExec`, walk exec from that entry pin, otherwise only pull data. */
  const runSubgraph = async (s: Scope, shell: BlueprintNode, viaExec: string | undefined, cache: Cache) => {
    const sg = shell.subgraph !== undefined ? graph.subgraphs?.[shell.subgraph] : undefined;
    if (!sg) throw new Error(`Collapsed graph "${shell.subgraph ?? "?"}" not found`);
    const inner: Scope = {
      level: { nodes: sg.nodes, edges: sg.edges, ...(graph.subgraphs ? { subgraphs: graph.subgraphs } : {}) },
      prefix: `${s.prefix}${shell.id}/`,
      tunnelInput: (pin) => inputValue(s, shell, pin, undefined, cache),
      exits: [],
    };
    if (viaExec !== undefined) {
      for (const t of sg.nodes.filter((x) => x.type === TUNNEL_IN)) await fire(inner, t, [viaExec]);
    }
    const innerCache: Cache = new Map();
    const out: Record<string, unknown> = {};
    for (const t of sg.nodes.filter((x) => x.type === TUNNEL_OUT)) {
      for (const p of getPorts(t, registry, inner.level).inputs) if (!p.exec) out[p.id] = await inputValue(inner, t, p.id, undefined, innerCache);
    }
    return viaExec !== undefined ? { ...out, $exec: inner.exits } : out;
  };

  let steps = 0;
  /** Follow the wires leaving `pins` of node `n`. */
  const fire = async (s: Scope, n: BlueprintNode, pins: readonly string[]) => {
    for (const pin of pins) {
      for (const e of s.level.edges.filter((x) => x.from.node === n.id && x.from.pin === pin)) {
        const next = s.level.nodes.find((x) => x.id === e.to.node);
        if (next) await execute(s, next, e.to.pin);
      }
    }
  };

  const execute = async (s: Scope, n: BlueprintNode, via: string): Promise<void> => {
    if (n.type === TUNNEL_OUT) {
      s.exits.push(via);
      return;
    }
    if (++steps > maxSteps) {
      errors.set("*", `Stopped after ${maxSteps} exec steps (infinite loop?)`);
      return;
    }
    const path = s.prefix + n.id;
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
    const execOuts = getPorts(n, registry, s.level).outputs.filter((p) => p.exec).map((p) => p.id);
    const fired = $exec === undefined ? execOuts : (typeof $exec === "string" ? [$exec] : [...$exec]).filter((p) => execOuts.includes(p));
    opts.onStep?.({ node: path, outputs: data, fired });
    if (!errors.has("*")) await fire(s, n, fired);
  };

  if (opts.entry !== undefined) {
    const start = graph.nodes.find((n) => n.id === opts.entry);
    if (!start) errors.set(opts.entry, `Entry node "${opts.entry}" not found`);
    else await execute(root, start, "");
    return { outputs, errors, trace, ok: errors.size === 0 };
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
  return { outputs, errors, trace, ok: errors.size === 0 };
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
