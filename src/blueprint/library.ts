import { fromJSON, toJSON } from "./serialize";
import { fromText, toText } from "./text";
import type { BlueprintGraph, SubGraphDef } from "./types";
import { PARAM_PREFIX } from "./types";

/**
 * Function / macro libraries (UE5 Blueprint Function Library + Macro Library): definitions that
 * are reused across documents.
 *
 *   const math = defineLibrary({ id: "math", name: "数学", items: [square, clamp] });
 *   const registry = createRegistry(types, nodes, { libraries: [math] });   // listed in the action menu
 *   applyOps(graph, [{ op: "importLibrary", library: math, items: ["square"] }], registry);
 *   libraryToJSON(math) / libraryFromJSON(text) / libraryToText(math) / libraryFromText(text)
 *   libraryFromGraph(graph, ["sg_double"], { id: "mine", name: "我的函数" })  // package a document's functions
 *
 * Items keep their ids inside the library; imported into a document they become
 * `<libraryId>:<itemId>` with `library: <libraryId>`, so re-importing updates them in place and
 * two libraries never collide. Items may call other items of the same library (imported together).
 */

export interface BlueprintLibrary {
  readonly id: string;
  readonly name: string;
  /** Free-form version of the library itself (e.g. "1.2.0"). */
  readonly version?: string;
  readonly description?: string;
  /** Definitions by their id inside the library. */
  readonly items: Readonly<Record<string, SubGraphDef>>;
}

export interface LibraryJSON extends Omit<BlueprintLibrary, "items"> {
  readonly format: "hx-blueprint-library";
  readonly formatVersion: 1;
  readonly items: Readonly<Record<string, unknown>>;
}

const ID_OK = /^[A-Za-z0-9_-]+$/;

export function defineLibrary(lib: Omit<BlueprintLibrary, "items"> & { readonly items: readonly SubGraphDef[] | Readonly<Record<string, SubGraphDef>> }): BlueprintLibrary {
  if (!ID_OK.test(lib.id)) throw new Error(`[blueprint] library id "${lib.id}" may only use letters, digits, _ and -`);
  const list = Array.isArray(lib.items) ? (lib.items as readonly SubGraphDef[]) : Object.values(lib.items as Record<string, SubGraphDef>);
  const items: Record<string, SubGraphDef> = {};
  for (const sg of list) {
    if (!ID_OK.test(sg.id)) throw new Error(`[blueprint] library "${lib.id}": item id "${sg.id}" may only use letters, digits, _ and -`);
    if (sg.kind !== "function" && sg.kind !== "macro") throw new Error(`[blueprint] library "${lib.id}": "${sg.id}" must be a function or a macro`);
    items[sg.id] = sg;
  }
  return { id: lib.id, name: lib.name, ...(lib.version ? { version: lib.version } : {}), ...(lib.description ? { description: lib.description } : {}), items };
}

/** Document id of a library item. */
export const libraryItemId = (libId: string, itemId: string) => `${libId}:${itemId}`;

/** Item ids `ids` plus every item they call, transitively. */
function withDeps(items: Readonly<Record<string, SubGraphDef>>, ids: readonly string[]): string[] {
  const out = new Set<string>();
  const stack = [...ids];
  while (stack.length) {
    const id = stack.pop()!;
    if (out.has(id) || !items[id]) continue;
    out.add(id);
    for (const n of items[id]!.nodes) if (n.subgraph !== undefined) stack.push(n.subgraph);
  }
  return [...out];
}

/**
 * Copy library items into a document (all, or `items` and their dependencies). Existing copies are
 * replaced unless `replace` is false (then only missing items are added).
 */
export function importLibrary(
  graph: BlueprintGraph, lib: BlueprintLibrary, items?: readonly string[], opts: { readonly replace?: boolean } = {},
): { graph: BlueprintGraph; ids: string[]; error?: string } {
  const want = items ?? Object.keys(lib.items);
  const missing = want.filter((id) => !lib.items[id]);
  if (missing.length) return { graph, ids: [], error: `Library "${lib.id}" has no item ${missing.join(", ")}` };
  const all = withDeps(lib.items, want);
  const map = (id: string) => (lib.items[id] ? libraryItemId(lib.id, id) : id);
  const subgraphs = { ...(graph.subgraphs ?? {}) };
  for (const id of all) {
    const docId = map(id);
    if (opts.replace === false && subgraphs[docId]) continue;
    const sg = lib.items[id]!;
    subgraphs[docId] = {
      ...sg, id: docId, library: lib.id,
      nodes: sg.nodes.map((n) => (n.subgraph !== undefined ? { ...n, subgraph: map(n.subgraph) } : n)),
    };
  }
  return { graph: { ...graph, subgraphs }, ids: want.map(map) };
}

export interface LibraryFromGraphResult {
  readonly library: BlueprintLibrary;
  /** Things that will not work in another document (graph variables used inside, collapsed graphs called). */
  readonly warnings: readonly string[];
}

/**
 * Package functions / macros of a document (and the definitions they call) as a library. Ids are
 * made library-safe; graph variables cannot travel, so items that use them are reported.
 */
export function libraryFromGraph(
  graph: BlueprintGraph, sgIds: readonly string[], meta: Omit<BlueprintLibrary, "items">,
): LibraryFromGraphResult {
  const table = graph.subgraphs ?? {};
  const all = withDeps(table, sgIds);
  const safe = new Map<string, string>();
  const used = new Set<string>();
  for (const id of all) {
    // an imported item keeps its own id inside a new library
    let base = (table[id]!.library && id.includes(":") ? id.slice(id.indexOf(":") + 1) : id).replace(/[^A-Za-z0-9_-]/g, "_") || "item";
    for (let i = 2; used.has(base); i++) base = `${base}_${i}`;
    used.add(base);
    safe.set(id, base);
  }
  const warnings: string[] = [];
  const items: SubGraphDef[] = all.map((id) => {
    const sg = table[id]!;
    if (sg.kind !== "function" && sg.kind !== "macro") warnings.push(`"${sg.label ?? id}" is a collapsed graph; packaged as a macro`);
    const locals = new Set((sg.variables ?? []).map((v) => v.id));
    const globals = sg.nodes.filter((n) => n.variable !== undefined && !n.variable.startsWith(PARAM_PREFIX) && !locals.has(n.variable));
    if (globals.length) warnings.push(`"${sg.label ?? id}" uses graph variables, which do not travel with a library`);
    const { library: _l, ...rest } = sg;
    void _l;
    return {
      ...rest, id: safe.get(id)!, kind: sg.kind === "function" ? "function" : "macro",
      nodes: sg.nodes.map((n) => (n.subgraph !== undefined && safe.has(n.subgraph) ? { ...n, subgraph: safe.get(n.subgraph)! } : n)),
    };
  });
  return { library: defineLibrary({ ...meta, items }), warnings };
}

// ---------------------------------------------------------------------------
// JSON and text forms (definitions go through the graph serializers, so they stay lossless)

const asGraph = (lib: BlueprintLibrary): BlueprintGraph => ({ nodes: [], edges: [], subgraphs: lib.items });

export function libraryToJSON(lib: BlueprintLibrary): LibraryJSON {
  return {
    format: "hx-blueprint-library", formatVersion: 1,
    id: lib.id, name: lib.name, ...(lib.version ? { version: lib.version } : {}), ...(lib.description ? { description: lib.description } : {}),
    items: toJSON(asGraph(lib)).subgraphs ?? {},
  };
}

export function libraryFromJSON(input: unknown): { ok: boolean; library?: BlueprintLibrary; errors: readonly string[] } {
  let raw = input;
  if (typeof input === "string") {
    try {
      raw = JSON.parse(input);
    } catch (e) {
      return { ok: false, errors: [`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`] };
    }
  }
  const o = raw as Partial<LibraryJSON> | null;
  if (!o || typeof o !== "object" || o.format !== "hx-blueprint-library") return { ok: false, errors: ["Not a blueprint library (format)"] };
  if (typeof o.id !== "string" || typeof o.name !== "string") return { ok: false, errors: ["Library needs id and name"] };
  const r = fromJSON({ version: 2, nodes: [], edges: [], subgraphs: o.items ?? {} });
  if (!r.ok || !r.graph) return { ok: false, errors: r.errors };
  try {
    return {
      ok: true, errors: [],
      library: defineLibrary({
        id: o.id, name: o.name, ...(typeof o.version === "string" ? { version: o.version } : {}),
        ...(typeof o.description === "string" ? { description: o.description } : {}), items: r.graph.subgraphs ?? {},
      }),
    };
  } catch (e) {
    return { ok: false, errors: [e instanceof Error ? e.message : String(e)] };
  }
}

/** Text form: a `library` header line, then the blueprint text of the definitions. */
export function libraryToText(lib: BlueprintLibrary): string {
  const head = [`library ${lib.id}`, `name=${JSON.stringify(lib.name)}`, ...(lib.version ? [`version=${JSON.stringify(lib.version)}`] : []), ...(lib.description ? [`description=${JSON.stringify(lib.description)}`] : [])];
  return `${head.join(" ")}\n${toText(asGraph(lib))}`;
}

export function libraryFromText(text: string): { ok: boolean; library?: BlueprintLibrary; errors: readonly string[] } {
  const nl = text.indexOf("\n");
  const first = (nl < 0 ? text : text.slice(0, nl)).trim();
  const m = /^library ([A-Za-z0-9_-]+)((?: [a-z]+="(?:[^"\\]|\\.)*")*)$/.exec(first);
  if (!m) return { ok: false, errors: ["line 1: expected: library <id> name=\"…\""] };
  const attrs: Record<string, string> = {};
  for (const a of m[2]!.matchAll(/ ([a-z]+)=("(?:[^"\\]|\\.)*")/g)) attrs[a[1]!] = JSON.parse(a[2]!) as string;
  if (!attrs.name) return { ok: false, errors: ["line 1: library needs name=\"…\""] };
  const r = fromText(nl < 0 ? "" : text.slice(nl + 1));
  if (!r.ok || !r.graph) return { ok: false, errors: r.errors };
  try {
    return {
      ok: true, errors: [],
      library: defineLibrary({ id: m[1]!, name: attrs.name, ...(attrs.version ? { version: attrs.version } : {}), ...(attrs.description ? { description: attrs.description } : {}), items: r.graph.subgraphs ?? {} }),
    };
  } catch (e) {
    return { ok: false, errors: [e instanceof Error ? e.message : String(e)] };
  }
}
