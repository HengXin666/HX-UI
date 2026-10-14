import { useCallback, useEffect, useMemo, useRef } from "react";
import { useNodesState, useEdgesState, type NodeChange, type EdgeChange } from "@xyflow/react";
import type { BlueprintGraph, BlueprintRegistry } from "./types";
import {
  toReactFlow, computeConnected, commentToNode, type RfNode, type RfEdge,
} from "./rf-adapter";
import { useGraphChanges } from "./use-graph-changes";

/**
 * 渲染态: 由 React Flow 持有, 只在**语义变化**时单向同步。
 *
 * ## 为什么不全量重建
 *
 * 之前是 `useMemo` 每次从 graph 换算 nodes, 而依赖链里有随 graph 变化的回调
 * (拖拽每帧都变)。于是**每帧重建整个 nodes 数组 -> 所有节点重新挂载** 
 * 那就是闪屏的来源, 且拖得越久越卡。
 *
 * 官方做法: 用 useNodesState/useEdgesState 让库维护渲染态, 外部只在语义变化
 * 时同步进去。
 *
 * ## 位置以谁的为准
 *
 * **拖拽中以库内为准**  否则正在拖的节点会被外部的老坐标拽回去 (观感就是
 * "拖不动/乱跳")。
 * **其余时候以外部为准**  否则撤销写回的旧坐标会被库内的新位置覆盖,
 * 表现是"按了撤销但节点不动"。
 */
export function useRenderState(o: {
  readonly registry: BlueprintRegistry;
  readonly graph: BlueprintGraph;
  readonly validation?: { readonly byNode: ReadonlyMap<string, { portErrors: Record<string, unknown> }> };
  readonly selected?: readonly string[];
  readonly onGraphChange?: (next: BlueprintGraph) => void;
  readonly onSelect?: (ids: readonly string[]) => void;
  readonly onMoveKind?: (kind: "move" | "remove" | "other") => void;
  readonly onParamChange?: (nodeId: string, key: string, value: unknown) => void;
}) {
  const {
    registry, graph, validation, selected, onGraphChange, onSelect, onMoveKind, onParamChange,
  } = o;

  /** 是否有节点正在被拖拽。 */
  const draggingRef = useRef(false);
  const [rfNodes, setRfNodes, onRfNodesChange] = useNodesState<RfNode>([]);
  const [rfEdges, setRfEdges, onRfEdgesChange] = useEdgesState<RfEdge>([]);

  const errorsByNode = useMemo(() => {
    const out: Record<string, Record<string, boolean>> = {};
    for (const [id, nv] of validation?.byNode ?? []) {
      const m: Record<string, boolean> = {};
      for (const k of Object.keys(nv.portErrors ?? {})) m[k] = true;
      if (Object.keys(m).length) out[id] = m;
    }
    return out;
  }, [validation]);

  /** 改参数: 用 ref 取最新回调, 免得它进同步的依赖导致每帧重建。 */
  const onParamRef = useRef(onParamChange);
  onParamRef.current = onParamChange;
  const onParam = useCallback((nodeId: string, key: string, value: unknown) => {
    onParamRef.current?.(nodeId, key, value);
  }, []);

  useEffect(() => {
    setRfNodes((prev) => {
      const byId = new Map(prev.map((n) => [n.id, n]));
      const dragging = draggingRef.current;
      const r = toReactFlow(registry, graph, {
        connectedByNode: computeConnected(graph),
        errorsByNode,
        onParamChange: onParam,
      });
      const sel = new Set(selected ?? []);
      const out: RfNode[] = r.nodes.map((n) => {
        const old = byId.get(n.id);
        return {
          ...n,
          selected: sel.has(String(n.data.bpId)),
          /**
           * `measured` 必须**无条件透传**, 不是只在拖拽时透传。
           *
           * 它是 React Flow 自己量出来的渲染尺寸, 我们的 BlueprintGraph 里没有
           * 这个概念  所以每次从图重建渲染态时它天然缺席. 而库是用它决定
           * 可见性的 (NodeWrapper: `visibility: hasDimensions ? 'visible' : 'hidden'`,
           * hasDimensions 读 measured/width/initialWidth):
           *
           * 丢掉 measured -> 该节点整块 `visibility: hidden` -> 看起来"节点全没了".
           *
           * 触发它需要一个外部同步把图换掉 (每次同步都重建渲染态). 文档站 + 独立页
           * 同频道时正好满足: 一端广播 -> 另一端 replace -> 每次 replace 都走一遍
           * 这里 -> 整图变 hidden. 单开一个页面时没有外部 replace, 所以平时看不到.
           *
           * 之前只在 dragging 时保留, 那保住了"拖拽中不跳位", 却漏了"同步后不隐身".
           */
          ...(old?.measured ? { measured: old.measured } : {}),
          /** 拖拽中以库内位置为准, 否则正在拖的节点会被外部的老坐标拽回去. */
          ...(old && dragging ? { position: old.position } : {}),
        };
      });
      for (const c of graph.comments ?? []) {
        const node = commentToNode(c);
        const old = byId.get(node.id);
        /**
         * 注释同理, 而且更脆: 它的 w/h 走的是 inline style (不进 nodeHasDimensions),
         * 所以它**只能**靠 measured 才可见  一次同步丢掉就是永久隐身.
         */
        out.push(old?.measured ? { ...node, measured: old.measured } : node);
      }
      return out;
    });
    setRfEdges(
      toReactFlow(registry, graph, { connectedByNode: computeConnected(graph) }).edges
    );
  }, [registry, graph, errorsByNode, selected, setRfNodes, setRfEdges, onParam]);

  /** 位置/删除 -> 落回我们的图 (真相仍是我们自己的图). */
  const { onNodesChange: syncNodes, onEdgesChange: syncEdges } = useGraphChanges({
    graph,
    onGraphChange,
    onSelect,
    ...(onMoveKind ? { onKind: (kind) => onMoveKind(kind) } : {}),
  });

  const handleNodesChange = useCallback(
    (changes: NodeChange<RfNode>[]) => {
      onRfNodesChange(changes);
      syncNodes(changes);
    },
    [onRfNodesChange, syncNodes]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange<RfEdge>[]) => {
      onRfEdgesChange(changes);
      syncEdges(changes);
    },
    [onRfEdgesChange, syncEdges]
  );

  return {
    rfNodes, rfEdges, handleNodesChange, handleEdgesChange, draggingRef,
    onNodeDragStart: () => { draggingRef.current = true; },
    onNodeDragStop: () => { draggingRef.current = false; },
  };
}
