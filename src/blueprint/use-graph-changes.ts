import { useCallback } from "react";
import type { NodeChange, EdgeChange } from "@xyflow/react";
import type { BlueprintGraph } from "./types";
import { isCommentNode, commentIdOf, type RfNode, type RfEdge } from "./rf-adapter";

/**
 * React Flow 的"变化事件" -> 我们的图。
 *
 * 单独成文件是因为 BlueprintFlow.tsx 撞 250 行上限, 但拆得也合理:
 * 这是**纯转换**  读 React Flow 的 change 数组, 产出我们的图。
 * 与渲染没有任何纠缠。
 *
 * ## 为什么必须自己处理 position / remove
 *
 * React Flow 的 change 是它自己内部的 diff 格式 (不是最终状态)。
 * 如果不接, 拖节点时**画布上动了但我们的图没变**  刷新就回原位,
 * 而序列化出去的也还是旧坐标。这类"看着能用、数据没落"的失效最难发现。
 */
export function useGraphChanges(o: {
  readonly graph: BlueprintGraph;
  readonly onGraphChange?: (next: BlueprintGraph) => void;
  /**
   * 选中变化。
   *
   * 走 NodeChange 里的 `select` 项, 而不是 React Flow 的 onSelectionChange:
   * 后者在受控模式下依赖内部 selection state, 实测点击后**不回调**,
   * 于是外部 selected 一直是空  表现是"能操作但看不出选中了谁"。
   */
  readonly onSelect?: (ids: readonly string[]) => void;
  /**
   * 告诉外层"这批 change 属于哪一类", 好让它给历史打 tag。
   *
   * 为什么需要: 拖动时 React Flow 每移动几像素就发一次 position change,
   * 如果每次都当独立的一步, 拖一下要按十几次撤销才回得去 
   * 那等于没有撤销。所以移动必须打同一个 tag 让历史合并。
   */
  readonly onKind?: (kind: "move" | "remove" | "other", label: string) => void;
}) {
  const { graph, onGraphChange, onKind, onSelect } = o;

  const onNodesChange = useCallback(
    (changes: NodeChange<RfNode>[]) => {
      let touched = false;
      let selectTouched = false;
      const next = { ...graph, nodes: graph.nodes.map((n) => ({ ...n })) };
      const comments = (graph.comments ?? []).map((c) => ({ ...c }));

      for (const ch of changes) {
        if (ch.type === "select") { selectTouched = true; }
        if (ch.type === "position" && ch.position) {
          if (isCommentNode(ch.id)) {
            const c = comments.find((x) => commentIdOf(ch.id) === x.id);
            if (c) { c.x = ch.position.x; c.y = ch.position.y; touched = true; }
          } else {
            const n = next.nodes.find((x) => x.id === ch.id);
            if (n) { n.x = ch.position.x; n.y = ch.position.y; touched = true; }
          }
        }
        // 删除: 必须连挂在它上面的边一起清掉, 否则会留下悬空边
        if (ch.type === "remove" && !isCommentNode(ch.id)) {
          const before = next.nodes.length;
          next.nodes = next.nodes.filter((x) => x.id !== ch.id);
          if (next.nodes.length !== before) {
            next.edges = next.edges.filter((e) => e.from.node !== ch.id && e.to.node !== ch.id);
            touched = true;
          }
        }
      }
      // 选中变化与图变化分开上报: 选中不改图, 不该进历史
      if (selectTouched) {
        const sel = new Set(changes.filter((c) => c.type === "select" && c.selected).map((c) => (c as { id: string }).id));
        onSelect?.([...sel]);
      }
      if (touched) {
        const isMove = changes.every((c) => c.type === "position");
        onKind?.(isMove ? "move" : "remove", isMove ? "移动节点" : "删除节点");
        onGraphChange?.({ ...next, ...(comments.length ? { comments } : {}) });
      }
    },
    [graph, onGraphChange, onKind, onSelect]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<RfEdge>[]) => {
      const removed = new Set(
        changes.filter((c) => c.type === "remove").map((c) => (c as { id: string }).id)
      );
      if (!removed.size) return;
      onGraphChange?.({ ...graph, edges: graph.edges.filter((e) => !removed.has(e.id)) });
    },
    [graph, onGraphChange]
  );

  return { onNodesChange, onEdgesChange };
}
