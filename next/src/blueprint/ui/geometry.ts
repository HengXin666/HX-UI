import { getPorts, type ResolvedPin } from "../ports";
import type { Registry } from "../registry";
import { REROUTE, SUBGRAPH_NODE, VAR_GET, VAR_SET } from "../registry";
import { NODE_METRICS, nodeSize } from "../size";
import type { BlueprintNode, SubgraphScope } from "../types";

/**
 * Pin and wire geometry in GRAPH units. The node card (node-view.tsx) is laid out with the same
 * NODE_METRICS, so a pin dot's centre is exactly `pinPos`.
 *
 *   header 30 | pad 8 | row 20 x N | (gap 6 + param 24 x P) | pad 8
 *   input dot centre x = left + PIN_INSET, output dot centre x = right - PIN_INSET
 */

export const PIN_INSET = 10;

export interface NodeLayout {
  readonly w: number;
  readonly h: number;
  readonly inputs: readonly ResolvedPin[];
  readonly outputs: readonly ResolvedPin[];
  /** Pin centre relative to the node's top-left, keyed "in:<id>" / "out:<id>". */
  readonly pins: ReadonlyMap<string, { readonly x: number; readonly y: number }>;
}

/**
 * Keyed by node object; valid while the subgraph table and the variable lists are the same (they
 * only matter for collapsed nodes and variable nodes).
 */
const cache = new WeakMap<BlueprintNode, { subs: SubgraphScope["subgraphs"]; vars: SubgraphScope["variables"]; locals: SubgraphScope["locals"]; layout: NodeLayout }>();

export const pinKey = (dir: "in" | "out", pin: string) => `${dir}:${pin}`;

/** Size and pin offsets of a node. Cached per node object (graph updates are immutable). */
export function layoutNode(node: BlueprintNode, registry: Registry, scope?: SubgraphScope): NodeLayout {
  const hit = cache.get(node);
  if (hit && hit.subs === scope?.subgraphs && hit.vars === scope?.variables && hit.locals === scope?.locals) return hit.layout;
  const M = NODE_METRICS;
  const { w, h } = nodeSize(node, registry, scope);
  const ports = getPorts(node, registry, scope);
  const inputs = ports.inputs.filter((p) => !p.hidden);
  const outputs = ports.outputs.filter((p) => !p.hidden);
  const pins = new Map<string, { x: number; y: number }>();
  if (node.type === REROUTE) {
    for (const p of inputs) pins.set(pinKey("in", p.id), { x: w / 2, y: h / 2 });
    for (const p of outputs) pins.set(pinKey("out", p.id), { x: w / 2, y: h / 2 });
  } else if (node.collapsed) {
    for (const p of inputs) pins.set(pinKey("in", p.id), { x: 0, y: M.header / 2 });
    for (const p of outputs) pins.set(pinKey("out", p.id), { x: w, y: M.header / 2 });
  } else {
    const rowY = (i: number) => M.header + M.pad + i * M.row + M.row / 2;
    inputs.forEach((p, i) => pins.set(pinKey("in", p.id), { x: PIN_INSET, y: rowY(i) }));
    outputs.forEach((p, i) => pins.set(pinKey("out", p.id), { x: w - PIN_INSET, y: rowY(i) }));
  }
  const layout: NodeLayout = { w, h, inputs, outputs, pins };
  cache.set(node, { subs: scope?.subgraphs, vars: scope?.variables, locals: scope?.locals, layout });
  return layout;
}

/** Absolute pin centre, optionally with the node shifted by (dx, dy) during a drag. */
export function pinPos(
  node: BlueprintNode, dir: "in" | "out", pin: string, registry: Registry, scope?: SubgraphScope, dx = 0, dy = 0,
): { x: number; y: number } | undefined {
  const p = layoutNode(node, registry, scope).pins.get(pinKey(dir, pin));
  return p ? { x: node.x + dx + p.x, y: node.y + dy + p.y } : undefined;
}

/**
 * UE-style wire: horizontal tangents at both ends. The tangent grows with distance and is
 * stronger for backward wires (target left of source) so they loop around instead of crossing nodes.
 */
export function wirePath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1;
  const c = dx >= 0 ? Math.max(30, dx * 0.5) : Math.min(160, 50 + Math.abs(dx) * 0.4 + Math.abs(y2 - y1) * 0.15);
  const r = (n: number) => Math.round(n * 10) / 10;
  return `M${r(x1)},${r(y1)} C${r(x1 + c)},${r(y1)} ${r(x2 - c)},${r(y2)} ${r(x2)},${r(y2)}`;
}

/** Header colour role of a node. Collapsed graphs get their own; functions and macros their kind's. */
export function nodeKindOf(node: BlueprintNode, registry: Registry, scope?: SubgraphScope): string {
  if (node.subgraph !== undefined || node.type === SUBGRAPH_NODE) {
    const k = node.subgraph !== undefined ? scope?.subgraphs?.[node.subgraph]?.kind : undefined;
    return k === "function" ? "function" : k === "macro" ? "macro" : "collapsed";
  }
  if (node.type === VAR_GET || node.type === VAR_SET) return node.type === VAR_GET ? "variable" : "function";
  const k = registry.node(node.type)?.kind ?? "default";
  return ["event", "function", "pure", "flow", "macro", "cast"].includes(k) ? k : "default";
}

/** CSS colour of a pin type: its registered token, falling back to the "any" token. */
export function typeColor(registry: Registry, type: string): string {
  const token = registry.color(type);
  return token ? `var(--${token}, var(--bp-any))` : "var(--bp-any)";
}

/** Colours a container pin needs: value colour, plus key colour for maps. */
export function pinColors(registry: Registry, type: string): { value: string; key?: string } {
  const t = registry.type(type);
  const value = typeColor(registry, t?.of && !t.color ? t.of : type);
  return t?.shape === "map" && t.key ? { value, key: typeColor(registry, t.key) } : { value };
}
