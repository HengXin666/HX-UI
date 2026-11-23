import { memo } from "react";
import { findPin } from "../ports";
import type { Registry } from "../registry";
import type { BlueprintEdge, BlueprintGraph, BlueprintNode } from "../types";
import { pinPos, typeColor, wirePath } from "./geometry";

/**
 * All wires in ONE svg. Each wire is a <g data-edge> with a wide transparent hit path (hover,
 * click, double-click, right-click) and the visible path. During a drag the canvas rewrites the
 * `d` of the affected paths directly (see `edgePathFor`), React only re-renders on commit.
 */

export interface WireGeo { readonly d: string; readonly kind: "exec" | "data"; readonly color: string }

/** Path and colour of one edge, with optional per-node drag offsets. */
export function edgePathFor(
  g: BlueprintGraph, byId: ReadonlyMap<string, BlueprintNode>, e: BlueprintEdge, registry: Registry,
  offset?: ReadonlyMap<string, { x: number; y: number }>,
): WireGeo | undefined {
  const a = byId.get(e.from.node);
  const b = byId.get(e.to.node);
  if (!a || !b) return undefined;
  const oa = offset?.get(a.id);
  const ob = offset?.get(b.id);
  const p1 = pinPos(a, "out", e.from.pin, registry, g, oa?.x, oa?.y);
  const p2 = pinPos(b, "in", e.to.pin, registry, g, ob?.x, ob?.y);
  if (!p1 || !p2) return undefined;
  const pin = findPin(a, e.from.pin, "out", registry, g);
  const kind = pin?.exec ? "exec" : "data";
  return { d: wirePath(p1.x, p1.y, p2.x, p2.y), kind, color: kind === "exec" ? "var(--bp-exec)" : typeColor(registry, pin?.type ?? "any") };
}

export const Wires = memo(function Wires({
  graph, registry, selected, bad, near,
}: { graph: BlueprintGraph; registry: Registry; selected: string; bad: string; near: string }) {
  const sel = new Set(selected.split("|"));
  const badSet = new Set(bad.split("|"));
  const nearSet = new Set(near.split("|"));
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  return (
    <svg className="bp-wires" aria-hidden>
      {graph.edges.map((e) => {
        const w = edgePathFor(graph, byId, e, registry);
        if (!w) return null;
        return (
          <g key={e.id} className="bp-wire-g" data-edge={e.id} data-selected={sel.has(e.id) || undefined}
            data-bad={badSet.has(e.id) || undefined} data-near={nearSet.has(e.id) || undefined}>
            <path className="bp-wire-hit" d={w.d} />
            <path className="bp-wire" data-kind={w.kind} d={w.d} style={{ ["--bp-wire" as string]: w.color }} />
          </g>
        );
      })}
    </svg>
  );
});
