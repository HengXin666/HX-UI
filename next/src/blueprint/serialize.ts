import { TUNNEL_IN, TUNNEL_OUT } from "./registry";
import type {
  BlueprintComment, BlueprintEdge, BlueprintGraph, BlueprintNode, CommentTone, NodePins, Pin, SubGraphDef,
} from "./types";

/**
 * JSON form. Lossless (B2): nodes, edges, comments and every subgraph definition, with a version.
 * `toJSON` also canonicalises key order and drops undefined, so equal graphs give equal JSON text.
 * `fromJSON` checks structure (not semantics, use validateGraph for that) and reads v1 legacy files.
 */

export const FORMAT_VERSION = 2;

export interface GraphJSON extends BlueprintGraph {
  readonly version: number;
}

export interface ParseResult {
  readonly ok: boolean;
  readonly graph?: BlueprintGraph;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

// ---------------------------------------------------------------------------
// Write

const pick = <T extends object>(o: T, keys: readonly (keyof T)[]): T => {
  const out: Partial<T> = {};
  for (const k of keys) if (o[k] !== undefined) out[k] = o[k];
  return out as T;
};

const clone = <T>(v: T): T => (v === undefined ? v : (JSON.parse(JSON.stringify(v)) as T));

const pinOut = (p: Pin): Pin => clone(pick(p, ["id", "type", "label", "default", "multi", "hidden"]));
const pinsOut = (p: NodePins): NodePins => ({
  ...(p.inputs ? { inputs: p.inputs.map(pinOut) } : {}),
  ...(p.outputs ? { outputs: p.outputs.map(pinOut) } : {}),
});
const nodeOut = (n: BlueprintNode): BlueprintNode => ({
  ...pick(n, ["id", "type", "x", "y", "title", "collapsed", "width", "comment", "subgraph"]),
  ...(n.values && Object.keys(n.values).length ? { values: clone(n.values) } : {}),
  ...(n.pins ? { pins: pinsOut(n.pins) } : {}),
});
const edgeOut = (e: BlueprintEdge): BlueprintEdge => ({ id: e.id, from: { node: e.from.node, pin: e.from.pin }, to: { node: e.to.node, pin: e.to.pin } });
const commentOut = (c: BlueprintComment): BlueprintComment => pick(c, ["id", "x", "y", "w", "h", "title", "body", "tone", "moveWithNodes"]);

const levelOut = (g: Pick<BlueprintGraph, "nodes" | "edges" | "comments">) => ({
  nodes: g.nodes.map(nodeOut),
  edges: g.edges.map(edgeOut),
  ...(g.comments?.length ? { comments: g.comments.map(commentOut) } : {}),
});

export function toJSON(graph: BlueprintGraph): GraphJSON {
  const sgs = Object.entries(graph.subgraphs ?? {}).sort(([a], [b]) => a.localeCompare(b));
  return {
    version: FORMAT_VERSION,
    ...levelOut(graph),
    ...(sgs.length
      ? { subgraphs: Object.fromEntries(sgs.map(([id, sg]) => [id, { id: sg.id, ...(sg.label !== undefined ? { label: sg.label } : {}), ...levelOut(sg) }])) }
      : {}),
  };
}

/** Graph without the version field (what the editor holds). */
export function stripVersion(json: GraphJSON): BlueprintGraph {
  const { version: _v, ...g } = json;
  void _v;
  return g;
}

// ---------------------------------------------------------------------------
// Read

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const TONES: readonly CommentTone[] = ["default", "primary", "warning", "success", "info", "danger", "neutral"];

class Reader {
  readonly errors: string[] = [];
  readonly warnings: string[] = [];
  str(o: Obj, k: string, path: string): string {
    if (typeof o[k] === "string") return o[k] as string;
    this.errors.push(`${path}.${k}: expected string`);
    return "";
  }
  num(o: Obj, k: string, path: string): number {
    if (typeof o[k] === "number" && Number.isFinite(o[k])) return o[k] as number;
    this.errors.push(`${path}.${k}: expected number`);
    return 0;
  }
  optStr(o: Obj, k: string, path: string): { [key: string]: string } {
    if (o[k] === undefined) return {};
    return { [k]: this.str(o, k, path) };
  }
  optNum(o: Obj, k: string, path: string): { [key: string]: number } {
    if (o[k] === undefined) return {};
    return { [k]: this.num(o, k, path) };
  }
  optBool(o: Obj, k: string, path: string): { [key: string]: boolean } {
    if (o[k] === undefined) return {};
    if (typeof o[k] === "boolean") return { [k]: o[k] as boolean };
    this.errors.push(`${path}.${k}: expected boolean`);
    return {};
  }
  arr(o: Obj, k: string, path: string): unknown[] {
    if (Array.isArray(o[k])) return o[k] as unknown[];
    this.errors.push(`${path}.${k}: expected array`);
    return [];
  }
  pin(v: unknown, path: string): Pin {
    if (!isObj(v)) {
      this.errors.push(`${path}: expected pin object`);
      return { id: "", type: "any" };
    }
    return {
      id: this.str(v, "id", path), type: this.str(v, "type", path), ...this.optStr(v, "label", path),
      ...(v.default !== undefined ? { default: clone(v.default) } : {}),
      ...this.optBool(v, "multi", path), ...this.optBool(v, "hidden", path),
    };
  }
  node(v: unknown, path: string): BlueprintNode {
    if (!isObj(v)) {
      this.errors.push(`${path}: expected node object`);
      return { id: "", type: "", x: 0, y: 0 };
    }
    let pins: NodePins | undefined;
    if (v.pins !== undefined) {
      if (!isObj(v.pins)) this.errors.push(`${path}.pins: expected object`);
      else {
        const p = v.pins;
        pins = {
          ...(p.inputs !== undefined ? { inputs: this.arr(p, "inputs", `${path}.pins`).map((x, i) => this.pin(x, `${path}.pins.inputs[${i}]`)) } : {}),
          ...(p.outputs !== undefined ? { outputs: this.arr(p, "outputs", `${path}.pins`).map((x, i) => this.pin(x, `${path}.pins.outputs[${i}]`)) } : {}),
        };
      }
    }
    if (v.values !== undefined && !isObj(v.values)) this.errors.push(`${path}.values: expected object`);
    return {
      id: this.str(v, "id", path), type: this.str(v, "type", path), x: this.num(v, "x", path), y: this.num(v, "y", path),
      ...this.optStr(v, "title", path), ...this.optBool(v, "collapsed", path), ...this.optNum(v, "width", path),
      ...this.optStr(v, "comment", path), ...this.optStr(v, "subgraph", path),
      ...(isObj(v.values) && Object.keys(v.values).length ? { values: clone(v.values) } : {}),
      ...(pins ? { pins } : {}),
    };
  }
  ref(v: unknown, path: string): { node: string; pin: string } {
    if (!isObj(v)) {
      this.errors.push(`${path}: expected { node, pin }`);
      return { node: "", pin: "" };
    }
    return { node: this.str(v, "node", path), pin: this.str(v, "pin", path) };
  }
  edge(v: unknown, path: string): BlueprintEdge {
    if (!isObj(v)) {
      this.errors.push(`${path}: expected edge object`);
      return { id: "", from: { node: "", pin: "" }, to: { node: "", pin: "" } };
    }
    return { id: this.str(v, "id", path), from: this.ref(v.from, `${path}.from`), to: this.ref(v.to, `${path}.to`) };
  }
  comment(v: unknown, path: string): BlueprintComment {
    if (!isObj(v)) {
      this.errors.push(`${path}: expected comment object`);
      return { id: "", x: 0, y: 0, w: 0, h: 0 };
    }
    if (v.tone !== undefined && !TONES.includes(v.tone as CommentTone)) this.errors.push(`${path}.tone: unknown tone`);
    return {
      id: this.str(v, "id", path), x: this.num(v, "x", path), y: this.num(v, "y", path), w: this.num(v, "w", path), h: this.num(v, "h", path),
      ...this.optStr(v, "title", path), ...this.optStr(v, "body", path),
      ...(TONES.includes(v.tone as CommentTone) ? { tone: v.tone as CommentTone } : {}),
      ...this.optBool(v, "moveWithNodes", path),
    };
  }
  level(v: Obj, path: string) {
    const comments = v.comments !== undefined ? this.arr(v, "comments", path).map((c, i) => this.comment(c, `${path}.comments[${i}]`)) : [];
    return {
      nodes: this.arr(v, "nodes", path).map((n, i) => this.node(n, `${path}.nodes[${i}]`)),
      edges: this.arr(v, "edges", path).map((e, i) => this.edge(e, `${path}.edges[${i}]`)),
      ...(comments.length ? { comments } : {}),
    };
  }
}

export interface FromJSONOptions {
  /** v1 only: id given to the legacy "exec-in" pin. Default "exec". */
  readonly execInPin?: string;
}

export function fromJSON(input: unknown, opts: FromJSONOptions = {}): ParseResult {
  let raw = input;
  if (typeof input === "string") {
    try {
      raw = JSON.parse(input);
    } catch (e) {
      return { ok: false, errors: [`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`], warnings: [] };
    }
  }
  if (!isObj(raw)) return { ok: false, errors: ["Graph must be an object"], warnings: [] };
  const isV1 = raw.version === 1 || (raw.version === undefined && looksV1(raw));
  return readV2(isV1 ? migrateV1(raw, opts.execInPin ?? "exec") : raw, isV1);
}

function readV2(raw: Obj, isV1: boolean): ParseResult {
  const r = new Reader();
  if (isV1) r.warnings.push("Read a v1 graph: params became values, ports became pins. Exec wiring inside v1 collapsed graphs was never stored, re-check those.");
  else if (raw.version !== undefined && raw.version !== FORMAT_VERSION) r.errors.push(`Unsupported version ${String(raw.version)}`);

  const subgraphs: Record<string, SubGraphDef> = {};
  if (raw.subgraphs !== undefined) {
    if (!isObj(raw.subgraphs)) r.errors.push("subgraphs: expected object");
    else for (const [id, v] of Object.entries(raw.subgraphs)) {
      if (!isObj(v)) {
        r.errors.push(`subgraphs.${id}: expected object`);
        continue;
      }
      if (v.id !== undefined && v.id !== id) r.errors.push(`subgraphs.${id}.id: must equal its key`);
      subgraphs[id] = { id, ...r.optStr(v, "label", `subgraphs.${id}`), ...r.level(v, `subgraphs.${id}`) };
    }
  }
  const graph: BlueprintGraph = { ...r.level(raw, "graph"), ...(Object.keys(subgraphs).length ? { subgraphs } : {}) };
  return r.errors.length
    ? { ok: false, errors: r.errors, warnings: r.warnings }
    : { ok: true, graph, errors: [], warnings: r.warnings };
}

// ---------------------------------------------------------------------------
// v1 (legacy src/blueprint) migration

function looksV1(o: Obj): boolean {
  const e0 = Array.isArray(o.edges) ? o.edges[0] : undefined;
  return isObj(e0) && isObj(e0.from) && "port" in e0.from;
}

function migrateV1(o: Obj, execIn: string): Obj {
  const ref = (r: unknown) => (isObj(r) ? { node: r.node, pin: r.port === "exec-in" ? execIn : r.port } : r);
  const execPins = (p: Obj) => ({
    inputs: [...(p.execIn ? [{ id: execIn, type: "exec" }] : []), ...(Array.isArray(p.inputs) ? p.inputs : [])],
    outputs: [
      ...(Array.isArray(p.execOut) ? p.execOut.map((x) => ({ id: isObj(x) ? x.id : x, type: "exec", ...(isObj(x) && x.label ? { label: x.label } : {}) })) : []),
      ...(Array.isArray(p.outputs) ? p.outputs : []),
    ],
  });
  const node = (n: unknown) => {
    if (!isObj(n)) return n;
    const { params, ports, ...rest } = n;
    return { ...rest, ...(isObj(params) ? { values: params } : {}), ...(isObj(ports) ? { pins: execPins(ports) } : {}) };
  };
  const edge = (e: unknown) => (isObj(e) ? { id: e.id, from: ref(e.from), to: ref(e.to) } : e);
  const level = (g: Obj) => ({
    nodes: Array.isArray(g.nodes) ? g.nodes.map(node) : g.nodes,
    edges: Array.isArray(g.edges) ? g.edges.map(edge) : g.edges,
    ...(g.comments !== undefined ? { comments: g.comments } : {}),
  });
  const subgraphs: Obj = {};
  for (const [id, sg] of Object.entries(isObj(o.subgraphs) ? o.subgraphs : {})) {
    if (isObj(sg)) subgraphs[id] = migrateV1Subgraph(id, sg, level(sg), execIn);
  }
  return { ...level(o), ...(Object.keys(subgraphs).length ? { subgraphs } : {}), version: FORMAT_VERSION };
}

/** v1 had one tunnel node per port (pin "value"), the i-th tunnel matching inputs[i]. Merge into one tunnel per side. */
function migrateV1Subgraph(id: string, sg: Obj, inner: { nodes: unknown; edges: unknown }, execIn: string): Obj {
  const nodes = (Array.isArray(inner.nodes) ? inner.nodes : []).filter(isObj);
  const edges = (Array.isArray(inner.edges) ? inner.edges : []).filter(isObj);
  const oldIn = nodes.filter((n) => n.type === "subgraph.input");
  const oldOut = nodes.filter((n) => n.type === "subgraph.output");
  const shape = { inputs: sg.inputs, outputs: sg.outputs, execIn: sg.execIn, execOut: sg.execOut };
  const ins = (Array.isArray(shape.inputs) ? shape.inputs : []) as Obj[];
  const outs = (Array.isArray(shape.outputs) ? shape.outputs : []) as Obj[];
  const tIn = { id: `${id}_in`, type: TUNNEL_IN, x: 0, y: 0, pins: { outputs: [...(shape.execIn ? [{ id: execIn, type: "exec" }] : []), ...ins] } };
  const execOut = Array.isArray(shape.execOut) ? shape.execOut.map((x) => ({ id: isObj(x) ? x.id : x, type: "exec" })) : [];
  const tOut = { id: `${id}_out`, type: TUNNEL_OUT, x: 0, y: 0, pins: { inputs: [...execOut, ...outs] } };
  const remap = (r: unknown, dir: "from" | "to") => {
    if (!isObj(r)) return r;
    const i = (dir === "from" ? oldIn : oldOut).findIndex((t) => t.id === r.node);
    if (i < 0) return r;
    const pin = (dir === "from" ? ins : outs)[i]?.id;
    return { node: dir === "from" ? tIn.id : tOut.id, pin };
  };
  return {
    id,
    ...(sg.label !== undefined ? { label: sg.label } : {}),
    nodes: [tIn, ...nodes.filter((n) => n.type !== "subgraph.input" && n.type !== "subgraph.output"), tOut],
    edges: edges.map((e) => ({ ...e, from: remap(e.from, "from"), to: remap(e.to, "to") })),
  };
}

// ---------------------------------------------------------------------------
// JSON Schema (draft 2020-12) of GraphJSON

const pinRef = { type: "object", required: ["node", "pin"], additionalProperties: false, properties: { node: { type: "string" }, pin: { type: "string" } } };
const level = {
  nodes: { type: "array", items: { $ref: "#/$defs/node" } },
  edges: { type: "array", items: { $ref: "#/$defs/edge" } },
  comments: { type: "array", items: { $ref: "#/$defs/comment" } },
};

export const graphSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://hx-ui.dev/schemas/blueprint-graph.v2.json",
  title: "HX-UI Blueprint graph",
  type: "object",
  required: ["version", "nodes", "edges"],
  additionalProperties: false,
  properties: {
    version: { const: FORMAT_VERSION },
    ...level,
    subgraphs: { type: "object", additionalProperties: { $ref: "#/$defs/subgraph" } },
  },
  $defs: {
    pin: {
      type: "object", required: ["id", "type"], additionalProperties: false,
      properties: { id: { type: "string" }, type: { type: "string" }, label: { type: "string" }, default: {}, multi: { type: "boolean" }, hidden: { type: "boolean" } },
    },
    node: {
      type: "object", required: ["id", "type", "x", "y"], additionalProperties: false,
      properties: {
        id: { type: "string" }, type: { type: "string", description: "NodeDef id" }, x: { type: "number" }, y: { type: "number" },
        title: { type: "string" }, collapsed: { type: "boolean" }, width: { type: "number" }, comment: { type: "string" },
        subgraph: { type: "string", description: "SubGraphDef id, pins come from its tunnels" },
        values: { type: "object", description: "Param values and literals of unconnected inputs" },
        pins: {
          type: "object", additionalProperties: false,
          properties: { inputs: { type: "array", items: { $ref: "#/$defs/pin" } }, outputs: { type: "array", items: { $ref: "#/$defs/pin" } } },
        },
      },
    },
    edge: { type: "object", required: ["id", "from", "to"], additionalProperties: false, properties: { id: { type: "string" }, from: pinRef, to: pinRef } },
    comment: {
      type: "object", required: ["id", "x", "y", "w", "h"], additionalProperties: false,
      properties: {
        id: { type: "string" }, x: { type: "number" }, y: { type: "number" }, w: { type: "number" }, h: { type: "number" },
        title: { type: "string" }, body: { type: "string" }, tone: { enum: TONES }, moveWithNodes: { type: "boolean" },
      },
    },
    subgraph: {
      type: "object", required: ["id", "nodes", "edges"], additionalProperties: false,
      properties: { id: { type: "string" }, label: { type: "string" }, ...level },
    },
  },
} as const;
