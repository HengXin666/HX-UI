"use client";

import { useCallback, useMemo, type JSX } from "react";
import {
  ReactFlow, Background, BackgroundVariant, Controls, MiniMap,
  ReactFlowProvider, useReactFlow,
  type Connection, type OnSelectionChangeFunc,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { BlueprintGraph, BlueprintRegistry, ValidationIssue } from "./types";
import { makeId } from "./useBlueprint";
import {
  toReactFlow, edgeFromRf, computeConnected, commentToNode, isCommentNode, commentIdOf,
  type RfNode, type RfEdge,
} from "./rf-adapter";
import { BpNode, BpExecEdge, BpDataEdge, ExecArrowMarker } from "./rf-node";
import { useFlowShortcuts } from "./flow-shortcuts";
import { useGraphChanges } from "./use-graph-changes";
import { useConnectivity } from "./use-connectivity";

/**
 * 画布层 —— 交互全部交给 React Flow。
 *
 * ## 这一层为什么这么短
 *
 * 拖拽 / 缩放 / 平移 / 框选 / 连线 / 选中 / 吸附 / 小地图, 全由 React Flow
 * 提供。手写那一版光这些就 800+ 行, 而且反复冒出指针捕获、忘记禁 user-select
 * 这类坑。现在这些**一行都不用写**。
 *
 * ## 我们保留什么
 *
 *   1. **UE5 外观** —— 自定义节点与连线组件 (rf-node.tsx)。
 *   2. **连线合法性** —— isValidConnection 接到我们自己的 canConnect,
 *      类型 DAG / 协变 / 执行流与数据流分离 / 环检测 全都照旧。
 *   3. **图是真相** —— BlueprintGraph 仍然是唯一数据模型, React Flow 的
 *      nodes/edges 只是渲染态 (转换在 rf-adapter.ts)。
 */

export interface BlueprintFlowProps {
  readonly registry: BlueprintRegistry;
  readonly graph: BlueprintGraph;
  readonly validation?: { readonly byNode: ReadonlyMap<string, { portErrors: Record<string, ValidationIssue> }> };
  readonly selected?: readonly string[];
  readonly onGraphChange?: (next: BlueprintGraph) => void;
  readonly onSelect?: (ids: readonly string[]) => void;
  readonly onParamChange?: (nodeId: string, key: string, value: unknown) => void;
  readonly onEnterSubgraph?: (sgId: string) => void;
  readonly onRemove?: (ids: readonly string[]) => void;
  readonly onUndo?: () => void;
  readonly onRedo?: () => void;
  readonly onComment?: (ids: readonly string[]) => void;
  readonly onTidy?: () => void;
  readonly onSearch?: () => void;
  readonly onRename?: (id: string) => void;
  /** 这批 change 属于哪一类 (用于给历史打 tag 以便合并)。 */
  readonly onMoveKind?: (kind: "move" | "remove" | "other") => void;
  /** 拖线到空白松手时: 是否弹节点面板 (UE5 行为)。 */
  readonly onConnectEndAtBlank?: (at: { x: number; y: number }) => void;
  readonly className?: string;
  readonly height?: number | string;
}

const NODE_TYPES = { bp: BpNode, bpComment: BpNode };
const EDGE_TYPES = { bpExec: BpExecEdge, bpData: BpDataEdge };

export function BlueprintFlow(props: BlueprintFlowProps): JSX.Element {
  // ReactFlowProvider 必须包在外面: 内部要用 useReactFlow 拿视口命令与快捷键
  return (
    <ReactFlowProvider>
      <FlowInner {...props} />
    </ReactFlowProvider>
  );
}

function FlowInner({
  registry, graph, validation, selected, onGraphChange, onSelect,
  onParamChange, onEnterSubgraph, onRemove, onConnectEndAtBlank, className, height = 520,
  onUndo, onRedo, onComment, onTidy, onSearch, onRename, onMoveKind,
}: BlueprintFlowProps): JSX.Element {
  const rf = useReactFlow();

  /**
   * UE5 全套快捷键。复用 shortcuts.ts 的键位表与判据 ——
   * 换库不能把已经锁住的"声明了就必须有实现"这条断言换掉。
   */
  useFlowShortcuts({
    graph,
    selected: selected ?? [],
    onGraphChange: (next) => onGraphChange?.(next),
    onSelect: (ids) => onSelect?.(ids),
    undo: () => onUndo?.(),
    redo: () => onRedo?.(),
    ...(onComment ? { onComment } : {}),
    ...(onTidy ? { onTidy } : {}),
    ...(onSearch ? { onSearch } : {}),
    ...(onRename ? { onRename } : {}),
  });

  /** 校验错误 -> 每个节点每个输入口的红点标记。 */
  const errorsByNode = useMemo(() => {
    const out: Record<string, Record<string, boolean>> = {};
    for (const [id, nv] of validation?.byNode ?? []) {
      const m: Record<string, boolean> = {};
      for (const k of Object.keys(nv.portErrors ?? {})) m[k] = true;
      if (Object.keys(m).length) out[id] = m;
    }
    return out;
  }, [validation]);

  const onParam = useCallback(
    (nodeId: string, key: string, value: unknown) => {
      onParamChange?.(nodeId, key, value);
    },
    [onParamChange]
  );

  const { nodes, edges } = useMemo(() => {
    const r = toReactFlow(registry, graph, {
      connectedByNode: computeConnected(graph),
      errorsByNode,
      onParamChange: onParam,
    });
    // 注释作为"在节点下面的自定义节点"参与渲染
    return {
      nodes: [...r.nodes, ...(graph.comments ?? []).map(commentToNode)],
      edges: r.edges,
    };
  }, [registry, graph, errorsByNode, onParam]);

  /** 选中集 -> 我们的节点 id (过滤掉注释伪节点)。 */
  const selectedIds = useMemo(() => new Set(selected ?? []), [selected]);

  const rfSelected = useMemo(
    () => nodes.filter((n) => selectedIds.has(String(n.data.bpId))),
    [nodes, selectedIds]
  );

  const { isValidConnection, onConnect } = useConnectivity({
    registry, graph, onGraphChange,
  });

  const { onNodesChange, onEdgesChange } = useGraphChanges({
    graph,
    onGraphChange,
    ...(onMoveKind ? { onKind: (kind) => onMoveKind(kind) } : {}),
  });

  const onSelectionChange = useCallback<OnSelectionChangeFunc>(
    ({ nodes: sel }) => {
      const ids = sel.map((n) => String(n.data?.bpId ?? n.id)).filter(Boolean);
      onSelect?.(ids);
    },
    [onSelect]
  );

  return (
    <div className={className} style={{ height, width: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onSelectionChange={onSelectionChange}
        onNodeDoubleClick={(_, n) => {
          const sg = n.data?.subgraph as string | undefined;
          if (sg) onEnterSubgraph?.(sg);
        }}
        onNodesDelete={(deleted) => {
          const ids = deleted.map((n) => String(n.data?.bpId ?? n.id));
          onRemove?.(ids);
        }}
        /**
         * 网格: React Flow 自带。UE5 是 16px 细线 + 每 8 格主线,
         * 这里用它的双 Background 叠出来 (gap / size 两个层)。
         */
        fitView
        minZoom={0.25}
        maxZoom={2.5}
        /**
         * 键位 —— UE5 语义。
         *
         * 这几个是 React Flow **原生**提供的, 值已经和 UE5 一致, 显式写出来
         * 是为了不让"默认行为悄悄变了"这种事发生:
         *   - deleteKeyCode: Delete / Backspace 删除选中 (UE5: Delete)
         *   - multiSelectionKeyCode: Ctrl/Cmd + 点击 = 切换选中 (UE5: Ctrl+点击)
         *   - selectionKeyCode: Shift + 拖 = 框选加选 (UE5: Shift+拖)
         *   - panActivationKeyCode: 空格 + 拖 = 平移
         */
        deleteKeyCode={["Delete", "Backspace"]}
        multiSelectionKeyCode={["Control", "Meta"]}
        selectionKeyCode="Shift"
        panActivationKeyCode="Space"
        // 禁掉 React Flow 自己的文本选中干扰
        proOptions={{ hideAttribution: false }}
        style={{ background: "var(--background)" }}
      >
        <ExecArrowMarker />
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} className="bp-grid-minor" />
        <Background variant={BackgroundVariant.Dots} gap={128} size={1.6} className="bp-grid-major" />
        <Controls />
        <MiniMap pannable zoomable />
      </ReactFlow>
    </div>
  );
}

/** 这条连接是不是执行流。 */
function isExecConnection(
  reg: BlueprintRegistry,
  g: BlueprintGraph,
  c: { source: string; sourceHandle?: string | null }
): boolean {
  const port = (c.sourceHandle ?? "").replace(/^o:/, "");
  const n = g.nodes.find((x) => x.id === c.source);
  const def = n ? reg.nodeTypes.get(n.type) : undefined;
  if (!def) return false;
  return (def.execOut ?? []).some((o) => (typeof o === "string" ? o : o.id) === port);
}
