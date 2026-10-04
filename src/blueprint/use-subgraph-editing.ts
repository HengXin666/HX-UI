import { useCallback, useMemo } from "react";
import type { BlueprintGraph } from "./types";
import { subgraphAsGraph, writeSubgraph } from "./subgraph";
import type { BlueprintApi } from "./useBlueprint";

/**
 * 子图层级的编辑: 算出"当前在看哪张图", 以及"把改动写回根图"。
 *
 * 单独成文件是因为 BlueprintEditor.tsx 被行预算**冻结且只许降**, 而这块
 * 是内聚的一小段 (路径 -> 当前图 / 改动 -> 逐层写回), 搬出来正合适。
 *
 * 关键语义: 进入子图**不是换一张图**, 而是改一条路径 —— 编辑的始终是同一张
 * 根图, 子图内容写回 graph.subgraphs。这样"在子图里改动"对外层立即可见,
 * 也无需维护两份状态和它们之间的同步。
 */
export function useSubgraphEditing(
  api: BlueprintApi,
  path: readonly string[]
): {
  readonly editing: BlueprintGraph;
  readonly commitInner: (next: Pick<BlueprintGraph, "nodes" | "edges">) => void;
} {
  const editing = useMemo(() => {
    let g: BlueprintGraph = api.graph;
    for (const sgId of path) {
      const inner = subgraphAsGraph(g, sgId);
      if (!inner) return g;
      g = inner;
    }
    return g;
  }, [api.graph, path]);

  const commitInner = useCallback(
    (next: Pick<BlueprintGraph, "nodes" | "edges">) => {
      if (path.length === 0) {
        api.replace({ ...api.graph, nodes: next.nodes, edges: next.edges });
        return;
      }
      // 从最内层往外逐层写回
      let g: BlueprintGraph = { ...api.graph, nodes: next.nodes, edges: next.edges };
      for (let i = path.length - 1; i >= 0; i--) {
        const outer = i === 0 ? api.graph : subgraphAsGraph(api.graph, path[i - 1])!;
        const g2: BlueprintGraph = { ...outer, nodes: g.nodes, edges: g.edges };
        g = writeSubgraph(g, path[i], { nodes: g2.nodes, edges: g2.edges });
        if (i > 0) g = { ...subgraphAsGraph(api.graph, path[i - 1])!, nodes: g.nodes, edges: g.edges };
      }
      api.replace(g);
    },
    [api, path]
  );

  return { editing, commitInner };
}
