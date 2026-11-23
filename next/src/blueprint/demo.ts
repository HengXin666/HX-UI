import { defineTypes } from "./define";
import { createRegistry } from "./registry";
import type { BlueprintGraph } from "./types";

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

export const demoRegistry = createRegistry(demoTypes, demoNodes);

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
