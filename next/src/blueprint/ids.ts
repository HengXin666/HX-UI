import type { BlueprintGraph } from "./types";

/**
 * Deterministic id generation. No Math.random, no Date.now: the same edit on the same graph
 * always produces the same ids, so diffs and tests are reproducible.
 *
 * Ids are `<prefix><n>` with n one above the highest number already used with that prefix,
 * scanning the whole document (outer graph, every subgraph, comments, subgraph ids).
 */
export type IdGen = (prefix: string) => string;

export function allIds(graph: BlueprintGraph): Set<string> {
  const ids = new Set<string>();
  const scan = (g: Pick<BlueprintGraph, "nodes" | "edges" | "comments">) => {
    for (const n of g.nodes) ids.add(n.id);
    for (const e of g.edges) ids.add(e.id);
    for (const c of g.comments ?? []) ids.add(c.id);
  };
  scan(graph);
  for (const [id, sg] of Object.entries(graph.subgraphs ?? {})) {
    ids.add(id);
    scan(sg);
  }
  return ids;
}

export function createIdGen(graph: BlueprintGraph, extra: Iterable<string> = []): IdGen {
  const used = allIds(graph);
  for (const id of extra) used.add(id);
  const next = new Map<string, number>();
  return (prefix) => {
    let n = next.get(prefix) ?? highest(used, prefix) + 1;
    while (used.has(`${prefix}${n}`)) n++;
    const id = `${prefix}${n}`;
    used.add(id);
    next.set(prefix, n + 1);
    return id;
  };
}

function highest(used: ReadonlySet<string>, prefix: string): number {
  let max = 0;
  const re = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\d+)$`);
  for (const id of used) {
    const m = re.exec(id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max;
}

/** Turn free text (an AI key, a title) into a safe id: letters, digits, `_` and `-`. */
export function slugId(text: string, fallback = "n"): string {
  const s = text.trim().replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "");
  return s.length ? s : fallback;
}
