import { FORMAT_VERSION, fromJSON, toJSON, type ParseResult } from "./serialize";
import type { BlueprintComment, BlueprintEdge, BlueprintGraph, BlueprintNode, PinRef, VariableDef } from "./types";

/**
 * Compact line format for the system clipboard and for AI (the UE5 "copy as T3D" idea).
 * Round-trips losslessly with the JSON form. One item per line:
 *
 *   blueprint v2
 *   node n1 event.start @40,60
 *   node n2 math.add @260,60 title="Sum" values={"b":2}
 *   edge e1 n1.then -> n3.exec
 *   comment c1 @0,0 420x200 title="Setup" tone="info"
 *   variable v1 "Count" number default=0
 *   meta name="Doc" description="…"
 *   subgraph sg1 label="Double" kind="function" pure=true category="Math" {
 *     variable v2 "Tmp" number
 *     node n7 subgraph.in @-240,0 pins={"outputs":[{"id":"x","type":"number"}]}
 *     edge e9 n7.x -> n8.a
 *   }
 *
 * Bare words are ids and types. Anything else is JSON: quoted ids, and every `key=value` attribute.
 */

const BARE_ID = /^[A-Za-z0-9_\-:/]+$/;
const BARE_TYPE = /^[A-Za-z0-9_\-:/.]+$/;

const word = (s: string, re: RegExp) => (re.test(s) ? s : JSON.stringify(s));
const refText = (r: PinRef) => `${word(r.node, BARE_ID)}.${word(r.pin, BARE_TYPE)}`;
const attrs = (o: object, keys: readonly string[]) =>
  keys.flatMap((k) => {
    const v = (o as Record<string, unknown>)[k];
    return v === undefined ? [] : [`${k}=${JSON.stringify(v)}`];
  });

const NODE_ATTRS = ["title", "subgraph", "variable", "collapsed", "width", "comment", "commentPinned", "disabled", "devOnly", "values", "pins"] as const;
const SUBGRAPH_ATTRS = ["label", "kind", "pure", "const", "category", "description", "keywords", "library"] as const;
const VAR_ATTRS = ["default", "category", "tooltip"] as const;
const COMMENT_ATTRS = ["title", "body", "tone", "moveWithNodes"] as const;

const varLines = (vs: readonly VariableDef[] | undefined, indent: string) =>
  (vs ?? []).map((v) => [`${indent}variable`, word(v.id, BARE_ID), JSON.stringify(v.name), word(v.type, BARE_TYPE), ...attrs(v, VAR_ATTRS)].join(" "));

function levelLines(g: Pick<BlueprintGraph, "nodes" | "edges" | "comments">, indent: string): string[] {
  return [
    ...g.nodes.map((n) => [`${indent}node`, word(n.id, BARE_ID), word(n.type, BARE_TYPE), `@${n.x},${n.y}`, ...attrs(n, NODE_ATTRS)].join(" ")),
    ...g.edges.map((e) => `${indent}edge ${word(e.id, BARE_ID)} ${refText(e.from)} -> ${refText(e.to)}`),
    ...(g.comments ?? []).map((c) => [`${indent}comment`, word(c.id, BARE_ID), `@${c.x},${c.y}`, `${c.w}x${c.h}`, ...attrs(c, COMMENT_ATTRS)].join(" ")),
  ];
}

export function toText(graph: BlueprintGraph): string {
  const g = toJSON(graph);
  const lines = [`blueprint v${FORMAT_VERSION}`, ...(g.meta ? [["meta", ...attrs(g.meta, ["name", "description"])].join(" ")] : []), ...varLines(g.variables, ""), ...levelLines(g, "")];
  for (const sg of Object.values(g.subgraphs ?? {})) {
    lines.push([`subgraph ${word(sg.id, BARE_ID)}`, ...attrs(sg, SUBGRAPH_ATTRS), "{"].join(" "));
    lines.push(...varLines(sg.variables, "  "), ...levelLines(sg, "  "), "}");
  }
  return lines.join("\n") + "\n";
}

// ---------------------------------------------------------------------------
// Parsing

/** End index (exclusive) of the JSON value starting at s[i]. */
function scanJson(s: string, i: number): number {
  const c = s[i];
  if (c === '"') {
    for (let j = i + 1; j < s.length; j++) {
      if (s[j] === "\\") j++;
      else if (s[j] === '"') return j + 1;
    }
    throw new Error("unterminated string");
  }
  if (c === "{" || c === "[") {
    let depth = 0;
    for (let j = i; j < s.length; j++) {
      const ch = s[j];
      if (ch === '"') j = scanJson(s, j) - 1;
      else if (ch === "{" || ch === "[") depth++;
      else if (ch === "}" || ch === "]") if (--depth === 0) return j + 1;
    }
    throw new Error("unbalanced brackets");
  }
  let j = i;
  while (j < s.length && !/\s/.test(s[j]!)) j++;
  return j;
}

/** Split a line into tokens. A token is a JSON string, `key=<json>`, or a run of non-space characters. */
function tokenize(line: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (/\s/.test(line[i]!)) {
      i++;
      continue;
    }
    const m = /^[A-Za-z]+=/.exec(line.slice(i));
    let end: number;
    if (m) end = scanJson(line, i + m[0].length);
    else if (line[i] === '"') {
      end = scanJson(line, i);
      // a quoted node id followed by .pin stays one token
      if (line[end] === ".") end = line[end + 1] === '"' ? scanJson(line, end + 1) : scanJson(line, end);
    } else {
      end = i;
      while (end < line.length && !/\s/.test(line[end]!)) end = line[end] === '"' ? scanJson(line, end) : end + 1;
    }
    out.push(line.slice(i, end));
    i = end;
  }
  return out;
}

const unword = (t: string): string => (t.startsWith('"') ? (JSON.parse(t) as string) : t);

function parseRef(t: string): PinRef {
  if (t.startsWith('"')) {
    const end = scanJson(t, 0);
    if (t[end] !== ".") throw new Error(`expected node.pin, got ${t}`);
    return { node: JSON.parse(t.slice(0, end)) as string, pin: unword(t.slice(end + 1)) };
  }
  const i = t.indexOf(".");
  if (i <= 0) throw new Error(`expected node.pin, got ${t}`);
  return { node: t.slice(0, i), pin: unword(t.slice(i + 1)) };
}

function parsePair(t: string | undefined, re: RegExp, what: string): [number, number] {
  const m = t ? re.exec(t) : null;
  if (!m) throw new Error(`expected ${what}, got ${t ?? "nothing"}`);
  return [Number(m[1]), Number(m[2])];
}
const NUM = "(-?\\d+(?:\\.\\d+)?(?:e[-+]?\\d+)?)";
const AT = new RegExp(`^@${NUM},${NUM}$`);
const SIZE = new RegExp(`^${NUM}x${NUM}$`);

function parseAttrs(tokens: readonly string[], allowed: readonly string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const t of tokens) {
    const eq = t.indexOf("=");
    const key = t.slice(0, eq);
    if (eq <= 0 || !allowed.includes(key)) throw new Error(`unexpected "${t}"`);
    out[key] = JSON.parse(t.slice(eq + 1));
  }
  return out;
}

interface Level { nodes: BlueprintNode[]; edges: BlueprintEdge[]; comments: BlueprintComment[]; variables: VariableDef[] }

export function fromText(text: string): ParseResult {
  const top: Level = { nodes: [], edges: [], comments: [], variables: [] };
  const subgraphs: Record<string, Level & { id: string; attrs: Record<string, unknown> }> = {};
  let meta: Record<string, unknown> | undefined;
  let cur: Level = top;
  let inSub = false;
  const errors: string[] = [];
  text.split(/\r?\n/).forEach((raw, idx) => {
    const line = raw.trim();
    if (!line || line.startsWith("#") || /^blueprint v\d+$/.test(line)) return;
    try {
      const t = tokenize(line);
      const kw = t[0];
      if (kw === "}") {
        if (!inSub) throw new Error("unmatched }");
        cur = top;
        inSub = false;
      } else if (kw === "subgraph") {
        if (inSub) throw new Error("subgraph blocks cannot nest (the table is flat)");
        if (t[t.length - 1] !== "{") throw new Error("expected { at end of subgraph line");
        const id = unword(t[1] ?? "");
        const a = parseAttrs(t.slice(2, -1), SUBGRAPH_ATTRS);
        const sg = { id, attrs: a, nodes: [], edges: [], comments: [], variables: [] };
        subgraphs[id] = sg;
        cur = sg;
        inSub = true;
      } else if (kw === "meta") {
        if (inSub) throw new Error("meta belongs to the main graph");
        meta = parseAttrs(t.slice(1), ["name", "description"]);
      } else if (kw === "node") {
        const [x, y] = parsePair(t[3], AT, "@x,y");
        cur.nodes.push({ id: unword(t[1] ?? ""), type: unword(t[2] ?? ""), x, y, ...parseAttrs(t.slice(4), NODE_ATTRS) } as BlueprintNode);
      } else if (kw === "variable") {
        const name = t[2] ?? "";
        if (!name.startsWith('"')) throw new Error("expected: variable <id> \"<name>\" <type>");
        cur.variables.push({ id: unword(t[1] ?? ""), name: unword(name), type: unword(t[3] ?? ""), ...parseAttrs(t.slice(4), VAR_ATTRS) } as VariableDef);
      } else if (kw === "edge") {
        if (t[3] !== "->") throw new Error("expected: edge <id> <node.pin> -> <node.pin>");
        cur.edges.push({ id: unword(t[1] ?? ""), from: parseRef(t[2] ?? ""), to: parseRef(t[4] ?? "") });
      } else if (kw === "comment") {
        const [x, y] = parsePair(t[2], AT, "@x,y");
        const [w, h] = parsePair(t[3], SIZE, "WxH");
        cur.comments.push({ id: unword(t[1] ?? ""), x, y, w, h, ...parseAttrs(t.slice(4), COMMENT_ATTRS) } as BlueprintComment);
      } else throw new Error(`unknown line kind "${kw ?? ""}"`);
    } catch (e) {
      errors.push(`line ${idx + 1}: ${e instanceof Error ? e.message : String(e)}`);
    }
  });
  if (inSub) errors.push("missing } at end of subgraph block");
  if (errors.length) return { ok: false, errors, warnings: [] };
  const level = (l: Level) => ({
    nodes: l.nodes, edges: l.edges, ...(l.comments.length ? { comments: l.comments } : {}), ...(l.variables.length ? { variables: l.variables } : {}),
  });
  return fromJSON({
    version: FORMAT_VERSION,
    ...(meta ? { meta } : {}),
    ...level(top),
    ...(Object.keys(subgraphs).length
      ? {
        subgraphs: Object.fromEntries(Object.entries(subgraphs).map(([id, s]) => [id, {
          id, ...s.attrs, ...level(s),
        }])),
      }
      : {}),
  });
}
