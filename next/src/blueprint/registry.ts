import { defineNode, defineTypes, type PinTypes } from "./define";
import type { NodeDef, PinShape, PinTypeDef } from "./types";
import { ANY } from "./types";

/**
 * Registry: the static half of a blueprint (pin types + node definitions).
 * It knows nothing about graphs. It is a plain object, no React context, so validation,
 * evaluation and tests run anywhere.
 */
export interface Registry {
  readonly types: ReadonlyMap<string, PinTypeDef>;
  readonly nodes: ReadonlyMap<string, NodeDef>;
  node(id: string): NodeDef | undefined;
  type(id: string): PinTypeDef | undefined;
  /** Shape of a pin type. Unknown types count as "data". */
  shape(typeId: string): PinShape;
  isExec(typeId: string): boolean;
  /** Can a value of type `from` flow into a pin of type `to` without conversion? */
  assignable(from: string, to: string): boolean;
  /** Conversion node id that turns `from` into `to`, if one is registered (UE5 autocast). */
  conversion(from: string, to: string): string | undefined;
  /** Colour token of a pin type. */
  color(typeId: string): string | undefined;
}

// ---------------------------------------------------------------------------
// Built-in node types, always registered

export const SUBGRAPH_NODE = "subgraph";
export const TUNNEL_IN = "subgraph.in";
export const TUNNEL_OUT = "subgraph.out";
export const REROUTE = "reroute";
export const VAR_GET = "var.get";
export const VAR_SET = "var.set";

/** Collapsed graph shell. Declares no pins: they come from the subgraph's tunnels (see getPorts). */
const subgraphNode = defineNode({
  id: SUBGRAPH_NODE, title: "Collapsed Graph", category: "Graph", kind: "macro", internal: true, width: 200,
  description: "A collapsed graph. Its pins mirror the tunnels inside.",
});

/** Entry tunnel inside a subgraph. Its OUTPUT pins (per instance) are the subgraph's external inputs. */
const tunnelIn = defineNode({
  id: TUNNEL_IN, title: "Inputs", category: "Graph", kind: "macro", internal: true,
  description: "External inputs of the collapsed graph.",
});

/** Exit tunnel inside a subgraph. Its INPUT pins (per instance) are the subgraph's external outputs. */
const tunnelOut = defineNode({
  id: TUNNEL_OUT, title: "Outputs", category: "Graph", kind: "macro", internal: true,
  description: "External outputs of the collapsed graph.",
});

/** Reroute (knot). Pins default to `any`, `addReroute` retypes them to the wire it splits. */
const reroute = defineNode({
  id: REROUTE, title: "Reroute", category: "Graph", kind: "default", width: 16,
  inputs: [{ id: "in", type: "any" }],
  outputs: [{ id: "out", type: "any" }],
  evaluate: ({ inputs }) => ({ out: inputs.in }),
});

/** Variable getter. Declares no pins: `getPorts` derives them from the variable (node.variable). */
const varGet = defineNode({
  id: VAR_GET, title: "Get", category: "Variables", kind: "pure", internal: true,
  description: "Reads a graph variable.",
});

/** Variable setter: exec in / out, the new value in, the stored value out. Pins from the variable. */
const varSet = defineNode({
  id: VAR_SET, title: "Set", category: "Variables", kind: "function", internal: true,
  description: "Writes a graph variable.",
});

export const BUILTIN_NODES: readonly NodeDef[] = [subgraphNode, tunnelIn, tunnelOut, reroute, varGet, varSet];

// ---------------------------------------------------------------------------

/**
 * Build a registry.
 * @param types result of `defineTypes`, or a list of PinTypeDef. Base types are added when missing.
 * @param nodes node definitions from `defineNode`. Later duplicates win.
 */
export function createRegistry(
  types: Pick<PinTypes<unknown>, "list"> | readonly PinTypeDef[] = defineTypes({}),
  nodes: readonly NodeDef[] = [],
): Registry {
  const typeMap = new Map<string, PinTypeDef>();
  for (const t of defineTypes({}).list) typeMap.set(t.id, t);
  for (const t of "list" in types ? types.list : types) typeMap.set(t.id, t);

  const nodeMap = new Map<string, NodeDef>();
  for (const n of [...BUILTIN_NODES, ...nodes]) nodeMap.set(n.id, n);

  const shape = (id: string): PinShape => typeMap.get(id)?.shape ?? "data";
  const isExec = (id: string) => shape(id) === "exec";

  /** Walk `extends` from `from` looking for `to`. Guards against cycles in bad registrations. */
  const extendsTo = (from: string, to: string): boolean => {
    const seen = new Set<string>();
    for (let cur: string | undefined = from; cur && !seen.has(cur); cur = typeMap.get(cur)?.extends) {
      if (cur === to) return true;
      seen.add(cur);
    }
    return false;
  };

  const assignable = (from: string, to: string): boolean => {
    if (from === to) return true;
    const fe = isExec(from);
    if (fe !== isExec(to)) return false;
    if (fe) return extendsTo(from, to);
    if (from === ANY || to === ANY) return true;
    if (extendsTo(from, to)) return true;
    // Containers are structural: number[] fits any[] when both are declared array types.
    const a = typeMap.get(from);
    const b = typeMap.get(to);
    if (!a || !b || a.shape !== b.shape || a.shape === "data") return false;
    const ofOk = a.of !== undefined && b.of !== undefined && assignable(a.of, b.of);
    const keyOk = a.shape !== "map" || (a.key !== undefined && b.key !== undefined && assignable(a.key, b.key));
    return ofOk && keyOk;
  };

  const conversion = (from: string, to: string): string | undefined => {
    const seen = new Set<string>();
    for (let cur: string | undefined = from; cur && !seen.has(cur); cur = typeMap.get(cur)?.extends) {
      seen.add(cur);
      const conv = typeMap.get(cur)?.convert;
      if (!conv) continue;
      for (const [target, nodeId] of Object.entries(conv)) {
        if (nodeMap.has(nodeId) && (target === to || extendsTo(target, to))) return nodeId;
      }
    }
    return undefined;
  };

  return {
    types: typeMap,
    nodes: nodeMap,
    node: (id) => nodeMap.get(id),
    type: (id) => typeMap.get(id),
    shape,
    isExec,
    assignable,
    conversion,
    color: (id) => typeMap.get(id)?.color,
  };
}
