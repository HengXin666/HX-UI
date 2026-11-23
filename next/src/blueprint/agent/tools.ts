import { describeGraph, describeRegistry } from "../describe";
import { evaluateGraph, findEntries } from "../evaluate";
import { applyLayout, autoLayout, countCrossings, countOverlaps } from "../layout";
import { applyOps, type GraphOp } from "../ops";
import type { Registry } from "../registry";
import { fromJSON, toJSON } from "../serialize";
import { fromText, toText } from "../text";
import type { BlueprintGraph } from "../types";
import { validateGraph } from "../validate";
import { buildGraph, type AgentInput } from "./build";

/**
 * MCP-style tool surface. Each tool has a JSON Schema input and never throws: it returns
 * { ok, text, data } where `text` is what a model should read.
 */

export interface ToolResult {
  readonly ok: boolean;
  readonly text: string;
  readonly data?: unknown;
}

export interface ToolDef {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: Readonly<Record<string, unknown>>;
  readonly run: (input: Readonly<Record<string, unknown>>) => ToolResult | Promise<ToolResult>;
}

export interface ToolContext {
  readonly registry: Registry;
  readonly getGraph: () => BlueprintGraph;
  readonly setGraph: (graph: BlueprintGraph) => void;
}

const NO_INPUT = { type: "object", properties: {}, additionalProperties: false } as const;

const OPS_HELP = [
  "addNode {type, id?, at?:[x,y], title?, values?, subgraph? (type 'subgraph': call a function / macro), variable? (type 'var.get' | 'var.set')}",
  "removeNode {id | ids[]}",
  "moveNode {id, to?:[x,y], by?:[dx,dy]}",
  "updateNode {id, title?, comment?, collapsed?, width?, disabled?} (null clears)",
  "connect {from:'node.pin', to:'node.pin', convert?:true}",
  "disconnect {edge? | pin? | from+to}",
  "setValue {node, key, value | unset:true}",
  "addComment {around?:[ids], at?, size?, title?, body?, tone?}",
  "updateComment {id, ...}",
  "moveComment {id, to, carry?}",
  "removeComment {id}",
  "collapse {nodes:[ids], label?, kind?:'graph'|'function'|'macro'}",
  "updateSubgraph {id, label?, kind?}",
  "addVariable {name, type, default?, id?, local?}",
  "updateVariable {id, name?, type?, default? | unsetDefault:true}",
  "removeVariable {id} (also removes its Get / Set nodes)",
  "expand {node}",
  "addReroute {edge?, at?}",
].join("; ");

export function createBlueprintTools(ctx: ToolContext): ToolDef[] {
  const { registry } = ctx;
  return [
    {
      name: "list_node_types",
      description: "List pin types and every node type with its pins, defaults and params. Call before building.",
      inputSchema: NO_INPUT,
      run: () => ({ ok: true, text: describeRegistry(registry), data: { types: [...registry.nodes.keys()] } }),
    },
    {
      name: "build_graph",
      description:
        "Replace the graph with one built from nodes and wires. Coordinates are optional (auto layout). " +
        "Wire ends are 'key' or 'key.pin', missing pins are inferred. Rejected wires are listed with reasons.",
      inputSchema: {
        type: "object",
        required: ["nodes"],
        properties: {
          nodes: {
            type: "array",
            items: {
              type: "object", required: ["type"],
              properties: { key: { type: "string" }, type: { type: "string" }, title: { type: "string" }, values: { type: "object" }, x: { type: "number" }, y: { type: "number" } },
            },
          },
          edges: { type: "array", items: { type: "object", required: ["from", "to"], properties: { from: { type: "string" }, to: { type: "string" } } } },
          comments: { type: "array", items: { type: "object", properties: { title: { type: "string" }, body: { type: "string" }, nodes: { type: "array", items: { type: "string" } } } } },
        },
      },
      run: (input) => {
        const r = buildGraph(registry, input as unknown as AgentInput);
        ctx.setGraph(r.graph);
        const lines = [
          `Built ${r.graph.nodes.length} nodes and ${r.graph.edges.length} wires.`,
          `Layout: ${r.layout.auto ? "auto" : "as given"}, ${r.layout.overlaps} overlaps, ${r.layout.crossings} crossings.`,
          ...r.rejected.map((x) => `rejected ${x.from} -> ${x.to}: ${x.message}`),
          ...r.warnings.map((w) => `warning: ${w}`),
          `ids: ${Object.entries(r.ids).map(([k, v]) => (k === v ? k : `${k}=${v}`)).join(", ")}`,
        ];
        return { ok: r.ok, text: lines.join("\n"), data: { ids: r.ids, rejected: r.rejected } };
      },
    },
    {
      name: "apply_ops",
      description: `Edit the current graph with JSON ops, applied in order as one undo step. Ops: ${OPS_HELP}.`,
      inputSchema: {
        type: "object", required: ["ops"],
        properties: {
          ops: { type: "array", items: { type: "object", required: ["op"], properties: { op: { type: "string" } } } },
          subgraph: { type: "string", description: "Apply inside this collapsed graph definition" },
          atomic: { type: "boolean", description: "Roll back everything if any op fails" },
        },
      },
      run: (input) => {
        const ops = Array.isArray(input.ops) ? (input.ops as GraphOp[]) : [];
        const r = applyOps(ctx.getGraph(), ops, registry, {
          ...(typeof input.subgraph === "string" ? { subgraph: input.subgraph } : {}),
          ...(input.atomic === true ? { atomic: true } : {}),
        });
        ctx.setGraph(r.graph);
        const lines = [
          `${ops.length - r.errors.length}/${ops.length} ops applied.`,
          ...r.errors.map((e) => `op #${e.index} ${e.op}: ${e.message}`),
          ...(Object.keys(r.created).length ? [`created: ${Object.entries(r.created).map(([k, v]) => `${k}=${v}`).join(", ")}`] : []),
        ];
        return { ok: r.errors.length === 0, text: lines.join("\n"), data: { errors: r.errors, created: r.created } };
      },
    },
    {
      name: "inspect_graph",
      description: "Plain-language summary of the current graph: nodes, wires, comments, collapsed graphs, problems.",
      inputSchema: NO_INPUT,
      run: () => ({ ok: true, text: describeGraph(ctx.getGraph(), registry) }),
    },
    {
      name: "validate_graph",
      description: "Check types, required inputs, wire multiplicity, cycles (data cycles are errors) and collapsed graphs.",
      inputSchema: NO_INPUT,
      run: () => {
        const v = validateGraph(ctx.getGraph(), registry);
        const text = v.issues.length ? v.issues.map((i) => `${i.level === "error" ? "x" : "!"} [${i.code}] ${i.message}`).join("\n") : "Valid.";
        return { ok: v.ok, text, data: { issues: v.issues } };
      },
    },
    {
      name: "tidy_layout",
      description: "Re-run the deterministic layered layout on the current graph.",
      inputSchema: { type: "object", properties: { rankGap: { type: "number" }, nodeGap: { type: "number" } } },
      run: (input) => {
        const g = ctx.getGraph();
        const next = applyLayout(g, autoLayout(g, registry, {
          ...(typeof input.rankGap === "number" ? { rankGap: input.rankGap } : {}),
          ...(typeof input.nodeGap === "number" ? { nodeGap: input.nodeGap } : {}),
        }));
        ctx.setGraph(next);
        return { ok: true, text: `Laid out ${next.nodes.length} nodes: ${countOverlaps(next, registry)} overlaps, ${countCrossings(next)} crossings.` };
      },
    },
    {
      name: "run_graph",
      description: "Evaluate. Walks exec wires from `entry` (or the first entry found), otherwise evaluates all data.",
      inputSchema: { type: "object", properties: { entry: { type: "string" } } },
      run: async (input) => {
        const g = ctx.getGraph();
        const entry = typeof input.entry === "string" ? input.entry : findEntries(g, registry)[0];
        const r = await evaluateGraph(g, registry, entry !== undefined ? { entry } : {});
        const lines = [
          ...(r.trace.length ? [`exec order: ${r.trace.join(" -> ")}`] : []),
          ...[...r.outputs].map(([id, v]) => `${id}: ${JSON.stringify(v)}`),
          ...[...r.errors].map(([id, m]) => `x ${id}: ${m}`),
        ];
        return { ok: r.ok, text: lines.join("\n") || "(no output)", data: { trace: r.trace, outputs: Object.fromEntries(r.outputs), errors: Object.fromEntries(r.errors) } };
      },
    },
    {
      name: "export_graph",
      description: "Export the current graph losslessly as compact text (default, best for reading and editing) or JSON.",
      inputSchema: { type: "object", properties: { format: { enum: ["text", "json"] } } },
      run: (input) => {
        const g = ctx.getGraph();
        return { ok: true, text: input.format === "json" ? JSON.stringify(toJSON(g), null, 2) : toText(g) };
      },
    },
    {
      name: "import_graph",
      description: "Replace the graph from exported text or JSON. Bad input is rejected with line/path errors, the current graph is kept.",
      inputSchema: { type: "object", required: ["source"], properties: { source: { type: "string" } } },
      run: (input) => {
        const src = String(input.source ?? "").trim();
        const r = src.startsWith("{") ? fromJSON(src) : fromText(src);
        if (!r.ok || !r.graph) return { ok: false, text: r.errors.join("\n") };
        ctx.setGraph(r.graph);
        return { ok: true, text: [`Imported ${r.graph.nodes.length} nodes, ${r.graph.edges.length} wires.`, ...r.warnings].join("\n") };
      },
    },
  ];
}

/** Tool list without the run functions, for an MCP `tools/list` response. */
export function toolManifest(tools: readonly ToolDef[]): { name: string; description: string; inputSchema: Readonly<Record<string, unknown>> }[] {
  return tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema }));
}

export async function dispatchTool(tools: readonly ToolDef[], name: string, input: Readonly<Record<string, unknown>> = {}): Promise<ToolResult> {
  const t = tools.find((x) => x.name === name);
  if (!t) return { ok: false, text: `Unknown tool "${name}". Available: ${tools.map((x) => x.name).join(", ")}` };
  try {
    return await t.run(input);
  } catch (e) {
    return { ok: false, text: `Tool ${name} failed: ${e instanceof Error ? e.message : String(e)}` };
  }
}
