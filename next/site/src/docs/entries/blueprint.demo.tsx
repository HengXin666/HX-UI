import { useState } from "react";
import { Blueprint } from "@/blueprint/ui";
import { applyOps, demoGraph, demoRegistry, type BlueprintEdge, type BlueprintGraph, type BlueprintNode } from "@/blueprint";
import type { DemoProps } from "../types";

// 演示数据为虚构: 节点和数值只用来展示编辑器, 不对应任何真实业务.

const flow: BlueprintGraph = {
  ...demoGraph,
  nodes: [...demoGraph.nodes, { id: "sum", type: "math.sum", x: 500, y: 330 }],
  comments: [{ id: "c1", x: 16, y: 136, w: 448, h: 280, title: "比较两个数", tone: "info" }],
};

// Debug run: the same flow, with node comments that say what to try.
const debugFlow: BlueprintGraph = {
  ...flow,
  nodes: flow.nodes.map((n) => (n.id === "branch" ? { ...n, comment: "红点是断点，按 F9 切换" } : n.id === "no" ? { ...n, comment: "这条分支这次不会走" } : n)),
};

// Variables: Start -> 设置 次数 (= 次数 + 1) -> Print.
const vars: BlueprintGraph = {
  variables: [
    { id: "v_count", name: "次数", type: "number", default: 0 },
    { id: "v_name", name: "称呼", type: "string", default: "访客" },
  ],
  nodes: [
    { id: "start", type: "event.start", x: 32, y: 48 },
    { id: "get", type: "var.get", variable: "v_count", x: 32, y: 208 },
    { id: "inc", type: "math.add", x: 240, y: 192, values: { b: 1 } },
    { id: "set", type: "var.set", variable: "v_count", x: 448, y: 48 },
    { id: "str", type: "conv.toString", x: 672, y: 192 },
    { id: "print", type: "flow.print", x: 880, y: 48, values: { prefix: "第几次：" } },
  ],
  edges: [
    { id: "e1", from: { node: "start", pin: "then" }, to: { node: "set", pin: "exec" } },
    { id: "e2", from: { node: "get", pin: "value" }, to: { node: "inc", pin: "a" } },
    { id: "e3", from: { node: "inc", pin: "out" }, to: { node: "set", pin: "value" } },
    { id: "e4", from: { node: "set", pin: "then" }, to: { node: "print", pin: "exec" } },
    { id: "e5", from: { node: "set", pin: "value" }, to: { node: "str", pin: "in" } },
    { id: "e6", from: { node: "str", pin: "out" }, to: { node: "print", pin: "msg" } },
  ],
};

// Functions and macros: compare + branch collapsed to a macro (two exec outputs), add collapsed to
// a function "加倍" with two call sites, one node disabled.
function fnGraph(): BlueprintGraph {
  const base = applyOps(demoGraph, [
    { op: "disconnect", edge: "e2" },
    { op: "disconnect", edge: "e3" },
    { op: "addNode", id: "dbl", type: "math.add", at: [272, 176] },
    { op: "connect", from: "a.value", to: "dbl.a" },
    { op: "connect", from: "a.value", to: "dbl.b" },
    { op: "connect", from: "dbl.out", to: "cmp.a" },
    { op: "collapse", nodes: ["dbl"], id: "sg_double", label: "加倍", kind: "function" },
  ], demoRegistry).graph;
  const r = applyOps(base, [
    { op: "addNode", id: "dbl2", type: "subgraph", subgraph: "sg_double", at: [272, 304] },
    { op: "connect", from: "b.value", to: "dbl2.a" },
    { op: "connect", from: "dbl2.out", to: "cmp.b" },
    { op: "collapse", nodes: ["cmp", "branch"], id: "sg_cmp", label: "比较并分支", kind: "macro" },
  ], demoRegistry);
  const macro = r.created["#3"]!;
  return applyOps(r.graph, [
    { op: "moveNode", id: macro, to: [512, 96] },
    { op: "moveNode", id: "yes", to: [752, 32] },
    { op: "moveNode", id: "no", to: [752, 208] },
    { op: "addNode", id: "log", type: "flow.print", at: [992, 32], values: { prefix: "调试" } },
    { op: "connect", from: "yes.then", to: "log.exec" },
    { op: "updateNode", id: "log", disabled: true, comment: "禁用的节点会被跳过" },
  ], demoRegistry).graph;
}

const collapsed = applyOps(demoGraph, [{ op: "collapse", nodes: ["a", "b", "cmp"], label: "比较 a 与 b" }], demoRegistry).graph;

const broken: BlueprintGraph = {
  ...demoGraph,
  nodes: [...demoGraph.nodes, { id: "conv", type: "conv.toString", x: 480, y: 330 }],
};

function stress(): BlueprintGraph {
  const nodes: BlueprintNode[] = [];
  const edges: BlueprintEdge[] = [];
  for (let r = 0; r < 20; r++) {
    for (let c = 0; c < 15; c++) {
      const id = `s${r}_${c}`;
      nodes.push(c === 0
        ? { id, type: "value.number", x: c * 220, y: r * 120, values: { v: r } }
        : { id, type: "math.add", x: c * 220, y: r * 120 });
      if (c > 0) edges.push({ id: `w${r}_${c}`, from: { node: `s${r}_${c - 1}`, pin: c === 1 ? "value" : "out" }, to: { node: id, pin: "a" } });
    }
  }
  return { nodes, edges };
}

const GRAPHS: Record<string, () => BlueprintGraph> = {
  blank: () => ({ nodes: [], edges: [] }),
  flow: () => flow,
  collapsed: () => collapsed,
  broken: () => broken,
  debug: () => debugFlow,
  vars: () => vars,
  fn: fnGraph,
  stress,
};

export default function BlueprintDemo({ values: v }: DemoProps) {
  const key = String(v.graph);
  return <Editor key={key} k={key} initial={(GRAPHS[key] ?? GRAPHS.flow!)()} v={v} />;
}

function Editor({ initial, k, v }: { initial: BlueprintGraph; k: string; v: DemoProps["values"] }) {
  const [graph, setGraph] = useState(initial);
  const debug = v.debug ? { breakpoints: k === "debug" || k === "flow" ? ["branch"] : [], stepMs: 200 } : false;
  return (
    <div className="absolute inset-0">
      <Blueprint
        registry={demoRegistry}
        value={graph}
        onChange={setGraph}
        snap={Number(v.snap)}
        minimap={Boolean(v.minimap)}
        readOnly={Boolean(v.readOnly)}
        lodThreshold={Number(v.lod)}
        wheel={v.wheel === "zoom" ? "zoom" : "ctrl"}
        debug={debug}
        variables={Boolean(v.variables)}
        aria-label="蓝图编辑器演示"
        className="h-full w-full"
      >
        <p className="pointer-events-none absolute bottom-3 z-10 hidden text-[11px] text-muted-foreground lg:block" style={{ right: v.debug ? 320 : v.minimap ? 200 : 12 }}>
          演示数据为虚构，按 ? 键看快捷键
        </p>
      </Blueprint>
    </div>
  );
}
