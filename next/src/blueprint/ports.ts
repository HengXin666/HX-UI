import type { Registry } from "./registry";
import { SUBGRAPH_NODE, TUNNEL_IN, TUNNEL_OUT, VAR_GET, VAR_SET } from "./registry";
import type { BlueprintEdge, BlueprintNode, Pin, PinRef, PinShape, SubgraphScope, VariableDef } from "./types";

/**
 * The ONE place that answers "which pins does this node have".
 * Renderer, validation, connect, layout and evaluation all go through `getPorts`.
 *
 * Priority: subgraph tunnels > instance `pins` > definition.
 */

export type Direction = "in" | "out";

export interface ResolvedPin extends Pin {
  readonly direction: Direction;
  readonly shape: PinShape;
  readonly exec: boolean;
  /** Effective "takes many wires" after applying the UE5 rule and the pin's own override. */
  readonly multi: boolean;
}

export interface NodePorts {
  readonly inputs: readonly ResolvedPin[];
  readonly outputs: readonly ResolvedPin[];
  /** Set when the node cannot be resolved: unknown type, or a subgraph / variable id missing from the scope. */
  readonly missing?: "type" | "subgraph" | "variable";
}

/**
 * UE5 multiplicity (B5): exec output -> one wire, exec input -> many,
 * data input -> one wire, data output -> many.
 */
export function defaultMulti(exec: boolean, direction: Direction): boolean {
  return exec ? direction === "in" : direction === "out";
}

function resolve(pins: readonly Pin[], direction: Direction, reg: Registry): ResolvedPin[] {
  return pins.map((p) => {
    const shape = reg.shape(p.type);
    const exec = shape === "exec";
    return { ...p, direction, shape, exec, multi: p.multi ?? defaultMulti(exec, direction) };
  });
}

/** Pins of a collapsed graph, read from its tunnel nodes (fixes B3: they can never drift from the inside). */
export function subgraphPins(sgNodes: readonly BlueprintNode[]): { inputs: Pin[]; outputs: Pin[] } {
  const inputs: Pin[] = [];
  const outputs: Pin[] = [];
  for (const n of sgNodes) {
    if (n.type === TUNNEL_IN) inputs.push(...(n.pins?.outputs ?? []));
    if (n.type === TUNNEL_OUT) outputs.push(...(n.pins?.inputs ?? []));
  }
  return { inputs, outputs };
}

/**
 * Effective pins of a node.
 * @param scope where subgraph ids resolve (the root graph, or an inner view carrying `subgraphs`).
 *   Only needed for collapsed-graph nodes, without it they report `missing: "subgraph"`.
 */
export function getPorts(node: BlueprintNode, registry: Registry, scope?: SubgraphScope): NodePorts {
  if (node.type === VAR_GET || node.type === VAR_SET) {
    const v = findVariable(scope, node.variable);
    if (!v) return { inputs: [], outputs: [], missing: "variable" };
    const value = { id: "value", type: v.type, label: v.name };
    return node.type === VAR_GET
      ? { inputs: [], outputs: resolve([value], "out", registry) }
      : {
        inputs: resolve([{ id: "exec", type: "exec" }, { ...value, ...(v.default !== undefined ? { default: v.default } : {}) }], "in", registry),
        outputs: resolve([{ id: "then", type: "exec" }, value], "out", registry),
      };
  }
  if (node.subgraph !== undefined || node.type === SUBGRAPH_NODE) {
    const sg = node.subgraph !== undefined ? scope?.subgraphs?.[node.subgraph] : undefined;
    if (!sg) return { inputs: [], outputs: [], missing: "subgraph" };
    const p = subgraphPins(sg.nodes);
    return { inputs: resolve(p.inputs, "in", registry), outputs: resolve(p.outputs, "out", registry) };
  }
  const def = registry.node(node.type);
  const inputs = node.pins?.inputs ?? def?.inputs ?? [];
  const outputs = node.pins?.outputs ?? def?.outputs ?? [];
  return {
    inputs: resolve(inputs, "in", registry),
    outputs: resolve(outputs, "out", registry),
    ...(def ? {} : { missing: "type" as const }),
  };
}

/** A variable visible in `scope`: function locals first, then graph variables. */
export function findVariable(scope: SubgraphScope | undefined, id: string | undefined): VariableDef | undefined {
  if (id === undefined) return undefined;
  return scope?.locals?.find((v) => v.id === id) ?? scope?.variables?.find((v) => v.id === id);
}

export function findPin(
  node: BlueprintNode, pinId: string, direction: Direction, registry: Registry, scope?: SubgraphScope,
): ResolvedPin | undefined {
  const ports = getPorts(node, registry, scope);
  return (direction === "in" ? ports.inputs : ports.outputs).find((p) => p.id === pinId);
}

/** "exec" or "data", derived from the source pin. Unknown pins count as data. */
export function edgeKind(
  graph: { readonly nodes: readonly BlueprintNode[] } & SubgraphScope, edge: BlueprintEdge, registry: Registry,
): "exec" | "data" {
  const node = graph.nodes.find((n) => n.id === edge.from.node);
  const pin = node ? findPin(node, edge.from.pin, "out", registry, graph) : undefined;
  return pin?.exec ? "exec" : "data";
}

// ---------------------------------------------------------------------------
// Pin reference text form: "node.pin"

export function formatPinRef(ref: PinRef): string {
  return `${ref.node}.${ref.pin}`;
}

/** Parse "node.pin" (split at the FIRST dot) or "node" (pin undefined). */
export function parsePinRef(text: string): { node: string; pin?: string } {
  const i = text.indexOf(".");
  return i > 0 ? { node: text.slice(0, i), pin: text.slice(i + 1) } : { node: text };
}

export function samePin(a: PinRef, b: PinRef): boolean {
  return a.node === b.node && a.pin === b.pin;
}
