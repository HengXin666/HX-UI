import { getPorts } from "./ports";
import type { Registry } from "./registry";
import { REROUTE } from "./registry";
import type { BlueprintNode, SubgraphScope } from "./types";

/**
 * Logical node box used by layout, comment containment and alignment.
 * The renderer must lay cards out with the same metrics so boxes match what is drawn.
 */
export const NODE_METRICS = {
  width: 176,
  /** Pure nodes (no exec pins) are drawn compact, as in UE5. */
  pureWidth: 160,
  header: 30,
  /** Gap between header and first pin row, and below the last row. */
  pad: 8,
  row: 20,
  paramRow: 24,
  reroute: 16,
} as const;

export interface Box {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/** Width and height of a node. Counts exec pins as rows (fixes B4). */
export function nodeSize(node: BlueprintNode, registry: Registry, scope?: SubgraphScope): { w: number; h: number } {
  const M = NODE_METRICS;
  if (node.type === REROUTE) return { w: M.reroute, h: M.reroute };
  const def = registry.node(node.type);
  const w = node.width ?? def?.width ?? (def?.kind === "pure" ? M.pureWidth : M.width);
  if (node.collapsed) return { w, h: M.header };
  const ports = getPorts(node, registry, scope);
  const rows = Math.max(
    ports.inputs.filter((p) => !p.hidden).length,
    ports.outputs.filter((p) => !p.hidden).length,
  );
  const params = def?.params.length ?? 0;
  return { w, h: M.header + M.pad + rows * M.row + (params ? params * M.paramRow + 6 : 0) + M.pad };
}

export function nodeBox(node: BlueprintNode, registry: Registry, scope?: SubgraphScope): Box {
  const s = nodeSize(node, registry, scope);
  return { x: node.x, y: node.y, w: s.w, h: s.h };
}

export function boxContains(outer: Box, inner: Box): boolean {
  return inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.w <= outer.x + outer.w && inner.y + inner.h <= outer.y + outer.h;
}

export function boxesOverlap(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function boundsOf(boxes: readonly Box[]): Box {
  if (boxes.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const b of boxes) {
    x0 = Math.min(x0, b.x);
    y0 = Math.min(y0, b.y);
    x1 = Math.max(x1, b.x + b.w);
    y1 = Math.max(y1, b.y + b.h);
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
