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
  stress,
};

export default function BlueprintDemo({ values: v }: DemoProps) {
  const key = String(v.graph);
  return <Editor key={key} initial={(GRAPHS[key] ?? GRAPHS.flow!)()} v={v} />;
}

function Editor({ initial, v }: { initial: BlueprintGraph; v: DemoProps["values"] }) {
  const [graph, setGraph] = useState(initial);
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
        aria-label="蓝图编辑器演示"
        className="h-full w-full"
      >
        <p className="pointer-events-none absolute bottom-3 z-10 hidden text-[11px] text-muted-foreground sm:block" style={{ right: v.minimap ? 200 : 12 }}>
          演示数据为虚构，按 ? 键看快捷键
        </p>
      </Blueprint>
    </div>
  );
}
