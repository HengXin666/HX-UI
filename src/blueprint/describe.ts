import { edgeKind, getPorts } from "./ports";
import type { Registry } from "./registry";
import { TUNNEL_IN, TUNNEL_OUT } from "./registry";
import type { BlueprintGraph, BlueprintNode } from "./types";
import { validateGraph } from "./validate";

/**
 * Plain-language views for LLMs and humans. They are summaries, not formats: use toText/toJSON to round-trip.
 */

const label = (n: BlueprintNode, reg?: Registry) => n.title ?? reg?.node(n.type)?.title ?? n.type;

function describeLevel(g: Pick<BlueprintGraph, "nodes" | "edges" | "subgraphs">, reg: Registry | undefined, indent: string): string[] {
  const lines: string[] = [];
  const byId = new Map(g.nodes.map((n) => [n.id, n]));
  const name = (id: string) => {
    const n = byId.get(id);
    return n ? `${label(n, reg)} [${id}]` : `? [${id}]`;
  };
  const kindOf = (e: (typeof g.edges)[number]) => (reg ? edgeKind(g, e, reg) : "data");

  for (const n of g.nodes) {
    const parts: string[] = [`${indent}- ${name(n.id)} type=${n.type}`];
    if (n.subgraph !== undefined) parts.push(`${g.subgraphs?.[n.subgraph]?.kind ?? "collapsed"} graph "${n.subgraph}"`);
    if (n.variable !== undefined) parts.push(`variable "${n.variable}"`);
    if (n.disabled) parts.push("DISABLED (skipped when run)");
    if (n.type === TUNNEL_IN) parts.push(`external inputs: ${(n.pins?.outputs ?? []).map((p) => `${p.id}:${p.type}`).join(", ") || "none"}`);
    if (n.type === TUNNEL_OUT) parts.push(`external outputs: ${(n.pins?.inputs ?? []).map((p) => `${p.id}:${p.type}`).join(", ") || "none"}`);
    const ins = g.edges.filter((e) => e.to.node === n.id && kindOf(e) === "data").map((e) => `${e.to.pin} <- ${name(e.from.node)}.${e.from.pin}`);
    if (ins.length) parts.push(`inputs ${ins.join("; ")}`);
    const vals = Object.entries(n.values ?? {}).map(([k, v]) => `${k}=${JSON.stringify(v)}`);
    if (vals.length) parts.push(`values ${vals.join(", ")}`);
    if (n.comment) parts.push(`note "${n.comment}"`);
    lines.push(parts.join(", "));
  }
  const exec = g.edges.filter((e) => kindOf(e) === "exec");
  if (exec.length) {
    lines.push(`${indent}Execution order wires:`);
    for (const e of exec) lines.push(`${indent}  ${name(e.from.node)} --${e.from.pin}--> ${name(e.to.node)}`);
  }
  return lines;
}

/** Summary of a graph: counts, nodes with their incoming data, exec wires, comments, collapsed graphs and problems. */
export function describeGraph(graph: BlueprintGraph, registry?: Registry): string {
  const sgs = Object.values(graph.subgraphs ?? {});
  const lines = [
    `Graph with ${graph.nodes.length} nodes, ${graph.edges.length} wires, ${graph.comments?.length ?? 0} comments, ${sgs.length} collapsed graphs.`,
    ...(graph.variables?.length ? [`Variables: ${graph.variables.map((v) => `${v.name} [${v.id}]:${v.type}${v.default !== undefined ? `=${JSON.stringify(v.default)}` : ""}`).join(", ")}`] : []),
    ...describeLevel(graph, registry, ""),
  ];
  for (const c of graph.comments ?? []) lines.push(`Comment "${c.title ?? c.id}" at (${c.x}, ${c.y}) size ${c.w}x${c.h}${c.body ? `: ${c.body}` : ""}`);
  for (const sg of sgs) {
    const kind = sg.kind === "function" ? "Function" : sg.kind === "macro" ? "Macro" : "Collapsed graph";
    lines.push(`${kind} "${sg.label ?? sg.id}" (${sg.id})${sg.variables?.length ? `, locals ${sg.variables.map((v) => `${v.name}:${v.type}`).join(", ")}` : ""}:`);
    lines.push(...describeLevel({ nodes: sg.nodes, edges: sg.edges, ...(graph.subgraphs ? { subgraphs: graph.subgraphs } : {}) }, registry, "  "));
  }
  if (registry) {
    const v = validateGraph(graph, registry);
    const errs = v.issues.filter((i) => i.level === "error");
    const warns = v.issues.filter((i) => i.level === "warning");
    lines.push(errs.length ? `Problems (${errs.length}):` : "No errors.");
    for (const i of errs) lines.push(`  x ${i.message}`);
    for (const i of warns) lines.push(`  ! ${i.message}`);
  }
  return lines.join("\n");
}

/** Every public node type with its pins, grouped by category. What an agent reads before building. */
export function describeRegistry(registry: Registry): string {
  const byCat = new Map<string, string[]>();
  for (const def of registry.nodes.values()) {
    if (def.internal) continue;
    const ports = getPorts({ id: "_", type: def.id, x: 0, y: 0 }, registry);
    const pins = (ps: typeof ports.inputs) => ps.map((p) => `${p.id}:${p.type}${p.default !== undefined ? `=${JSON.stringify(p.default)}` : ""}`).join(", ");
    const params = def.params.map((p) => `${p.id}(${p.kind}${p.options ? ": " + p.options.map((o) => o.value).join("|") : ""})`).join(", ");
    const line = `${def.id} "${def.title}" [${def.kind}] in(${pins(ports.inputs)}) out(${pins(ports.outputs)})${params ? ` params(${params})` : ""}${def.description ? ` - ${def.description}` : ""}`;
    byCat.set(def.category, [...(byCat.get(def.category) ?? []), line]);
  }
  const types = [...registry.types.values()].map((t) => `${t.id}${t.extends ? `<${t.extends}` : ""}${t.shape !== "data" ? `(${t.shape}${t.of ? ` of ${t.of}` : ""})` : ""}`).join(", ");
  return [`Pin types: ${types}`, ...[...byCat.entries()].map(([cat, ls]) => `${cat}:\n  ${ls.join("\n  ")}`)].join("\n");
}
