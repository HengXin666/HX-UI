import { defineTypes } from "./define";
import { defineLibrary } from "./library";
import { createRegistry } from "./registry";
import type { BlueprintGraph, SubGraphDef } from "./types";

/**
 * Demo registry and graph: number -> compare -> branch -> print. Used by docs and scripts/bp-check.ts.
 * Also shows a custom array type and a number -> string autocast.
 */

export const demoTypes = defineTypes({
  number: { label: "Number", color: "bp-float", ts: 0 as number, convert: { string: "conv.toString" } },
  numbers: { label: "Number Array", color: "bp-float", shape: "array", of: "number" },
});

const t = demoTypes;

export const demoNodes = [
  t.defineNode({
    id: "event.start", title: "Start", category: "Events",
    outputs: [{ id: "then", type: "exec" }],
  }),
  t.defineNode({
    id: "value.number", title: "Number", category: "Values",
    outputs: [{ id: "value", type: "number" }],
    params: [{ id: "v", kind: "number", default: 1 }],
    evaluate: ({ params }) => ({ value: params.v }),
  }),
  t.defineNode({
    id: "value.text", title: "Text", category: "Values",
    outputs: [{ id: "value", type: "string" }],
    params: [{ id: "v", kind: "text", default: "hello" }],
    evaluate: ({ params }) => ({ value: params.v }),
  }),
  t.defineNode({
    id: "math.add", title: "Add", category: "Math",
    inputs: [{ id: "a", type: "number", default: 0 }, { id: "b", type: "number", default: 0 }],
    outputs: [{ id: "out", type: "number" }],
    evaluate: ({ inputs }) => ({ out: inputs.a + inputs.b }),
  }),
  t.defineNode({
    id: "math.subtract", title: "Subtract", category: "Math",
    inputs: [{ id: "a", type: "number", default: 0 }, { id: "b", type: "number", default: 0 }],
    outputs: [{ id: "out", type: "number" }],
    evaluate: ({ inputs }) => ({ out: inputs.a - inputs.b }),
  }),
  t.defineNode({
    id: "math.multiply", title: "Multiply", category: "Math",
    inputs: [{ id: "a", type: "number", default: 1 }, { id: "b", type: "number", default: 1 }],
    outputs: [{ id: "out", type: "number" }],
    evaluate: ({ inputs }) => ({ out: inputs.a * inputs.b }),
  }),
  t.defineNode({
    id: "math.min", title: "Min", category: "Math",
    inputs: [{ id: "a", type: "number", default: 0 }, { id: "b", type: "number", default: 0 }],
    outputs: [{ id: "out", type: "number" }],
    evaluate: ({ inputs }) => ({ out: Math.min(inputs.a, inputs.b) }),
  }),
  t.defineNode({
    id: "math.max", title: "Max", category: "Math",
    inputs: [{ id: "a", type: "number", default: 0 }, { id: "b", type: "number", default: 0 }],
    outputs: [{ id: "out", type: "number" }],
    evaluate: ({ inputs }) => ({ out: Math.max(inputs.a, inputs.b) }),
  }),
  t.defineNode({
    id: "math.sum", title: "Sum", category: "Math",
    inputs: [{ id: "items", type: "numbers", default: [] }],
    outputs: [{ id: "out", type: "number" }],
    evaluate: ({ inputs }) => ({ out: inputs.items.reduce((s, x) => s + x, 0) }),
  }),
  t.defineNode({
    id: "math.compare", title: "Compare", category: "Math",
    inputs: [{ id: "a", type: "number", default: 0 }, { id: "b", type: "number", default: 0 }],
    outputs: [{ id: "out", type: "boolean" }],
    params: [{ id: "op", kind: "select", default: "gt", options: [{ value: "gt", label: ">" }, { value: "lt", label: "<" }, { value: "eq", label: "=" }] }],
    evaluate: ({ inputs, params }) => ({ out: params.op === "lt" ? inputs.a < inputs.b : params.op === "eq" ? inputs.a === inputs.b : inputs.a > inputs.b }),
  }),
  t.defineNode({
    id: "flow.branch", title: "Branch", category: "Flow", kind: "flow",
    inputs: [{ id: "exec", type: "exec" }, { id: "cond", type: "boolean", default: false }],
    outputs: [{ id: "true", type: "exec" }, { id: "false", type: "exec" }],
    evaluate: ({ inputs }) => ({ $exec: inputs.cond ? "true" : "false" }),
  }),
  t.defineNode({
    id: "flow.sequence", title: "Sequence", category: "Flow", kind: "flow",
    description: "Fires each output in order (UE5 Sequence).",
    inputs: [{ id: "exec", type: "exec" }],
    outputs: [{ id: "then_0", type: "exec", label: "Then 0" }, { id: "then_1", type: "exec", label: "Then 1" }],
  }),
  t.defineNode({
    id: "flow.delay", title: "Delay", category: "Flow", kind: "function",
    description: "Waits, then continues (latent node). Duration in seconds.",
    inputs: [{ id: "exec", type: "exec" }, { id: "duration", type: "number", default: 0.2, label: "Duration" }],
    outputs: [{ id: "then", type: "exec", label: "Completed" }],
    evaluate: async ({ inputs }) => {
      await new Promise((r) => setTimeout(r, Math.max(0, Math.min(5, inputs.duration)) * 1000));
      return {};
    },
  }),
  t.defineNode({
    id: "flow.print", title: "Print", category: "Flow",
    description: "Side effect node: returns the line instead of logging, the host decides where it goes.",
    inputs: [{ id: "exec", type: "exec" }, { id: "msg", type: "string", default: "" }],
    outputs: [{ id: "then", type: "exec" }, { id: "line", type: "string" }],
    params: [{ id: "prefix", kind: "text", default: ">" }],
    evaluate: ({ inputs, params }) => ({ line: `${params.prefix} ${inputs.msg}` }),
  }),
  t.defineNode({
    id: "conv.toString", title: "To String", category: "Conversions", kind: "cast",
    inputs: [{ id: "in", type: "number" }],
    outputs: [{ id: "out", type: "string" }],
    evaluate: ({ inputs }) => ({ out: String(inputs.in) }),
  }),
];

// A small library: two pure functions and a macro, offered in every document using demoRegistry.
const square: SubGraphDef = {
  id: "square", label: "平方", kind: "function", pure: true, category: "常用数学", description: "x × x", keywords: "square pow",
  nodes: [
    { id: "in", type: "subgraph.in", x: 0, y: 0, pins: { outputs: [{ id: "x", type: "number", label: "x" }] } },
    { id: "mul", type: "math.multiply", x: 240, y: 0 },
    { id: "out", type: "subgraph.out", x: 480, y: 0, pins: { inputs: [{ id: "out", type: "number", label: "结果" }] } },
  ],
  edges: [
    { id: "e1", from: { node: "in", pin: "x" }, to: { node: "mul", pin: "a" } },
    { id: "e2", from: { node: "in", pin: "x" }, to: { node: "mul", pin: "b" } },
    { id: "e3", from: { node: "mul", pin: "out" }, to: { node: "out", pin: "out" } },
  ],
};
const clamp: SubGraphDef = {
  id: "clamp", label: "限制范围", kind: "function", pure: true, category: "常用数学", description: "把 x 限制在 [下限, 上限]", keywords: "clamp range",
  nodes: [
    { id: "in", type: "subgraph.in", x: 0, y: 0, pins: { outputs: [{ id: "x", type: "number", label: "x" }, { id: "lo", type: "number", label: "下限", default: 0 }, { id: "hi", type: "number", label: "上限", default: 1 }] } },
    { id: "min", type: "math.min", x: 240, y: 0 },
    { id: "max", type: "math.max", x: 440, y: 0 },
    { id: "out", type: "subgraph.out", x: 660, y: 0, pins: { inputs: [{ id: "out", type: "number", label: "结果" }] } },
  ],
  edges: [
    { id: "e1", from: { node: "in", pin: "x" }, to: { node: "min", pin: "a" } },
    { id: "e2", from: { node: "in", pin: "hi" }, to: { node: "min", pin: "b" } },
    { id: "e3", from: { node: "min", pin: "out" }, to: { node: "max", pin: "a" } },
    { id: "e4", from: { node: "in", pin: "lo" }, to: { node: "max", pin: "b" } },
    { id: "e5", from: { node: "max", pin: "out" }, to: { node: "out", pin: "out" } },
  ],
};
const ifTrue: SubGraphDef = {
  id: "if_true", label: "仅当为真", kind: "macro", category: "常用流程", description: "条件为真才继续", keywords: "if when",
  nodes: [
    { id: "in", type: "subgraph.in", x: 0, y: 0, pins: { outputs: [{ id: "exec", type: "exec" }, { id: "cond", type: "boolean", label: "条件" }] } },
    { id: "br", type: "flow.branch", x: 240, y: 0 },
    { id: "out", type: "subgraph.out", x: 480, y: 0, pins: { inputs: [{ id: "then", type: "exec", label: "是" }] } },
  ],
  edges: [
    { id: "e1", from: { node: "in", pin: "exec" }, to: { node: "br", pin: "exec" } },
    { id: "e2", from: { node: "in", pin: "cond" }, to: { node: "br", pin: "cond" } },
    { id: "e3", from: { node: "br", pin: "true" }, to: { node: "out", pin: "then" } },
  ],
};

export const demoLibrary = defineLibrary({ id: "demo", name: "示例库", version: "1.0.0", description: "演示用函数和宏", items: [square, clamp, ifTrue] });

export const demoRegistry = createRegistry(demoTypes, demoNodes, { libraries: [demoLibrary] });

export const demoGraph: BlueprintGraph = {
  nodes: [
    { id: "start", type: "event.start", x: 40, y: 60 },
    { id: "a", type: "value.number", x: 40, y: 180, values: { v: 7 } },
    { id: "b", type: "value.number", x: 40, y: 300, values: { v: 5 } },
    { id: "cmp", type: "math.compare", x: 260, y: 220, values: { op: "gt" } },
    { id: "branch", type: "flow.branch", x: 480, y: 90 },
    { id: "yes", type: "flow.print", x: 700, y: 40, values: { prefix: "yes", msg: "a > b" } },
    { id: "no", type: "flow.print", x: 700, y: 200, values: { prefix: "no", msg: "a <= b" } },
  ],
  edges: [
    { id: "e1", from: { node: "start", pin: "then" }, to: { node: "branch", pin: "exec" } },
    { id: "e2", from: { node: "a", pin: "value" }, to: { node: "cmp", pin: "a" } },
    { id: "e3", from: { node: "b", pin: "value" }, to: { node: "cmp", pin: "b" } },
    { id: "e4", from: { node: "cmp", pin: "out" }, to: { node: "branch", pin: "cond" } },
    { id: "e5", from: { node: "branch", pin: "true" }, to: { node: "yes", pin: "exec" } },
    { id: "e6", from: { node: "branch", pin: "false" }, to: { node: "no", pin: "exec" } },
  ],
};
