"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type JSX } from "react";
import { cn } from "../primitives/utils";
import {
  ReactFlow, Background, BackgroundVariant,
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
import { BpCommentNode } from "./rf-comment";
import type { BlueprintFlowProps } from "./flow-types";
import { useFlowShortcuts } from "./flow-shortcuts";
import { BlueprintContextMenu } from "./ContextMenu";
import { useConnectivity } from "./use-connectivity";
import { useRenderState } from "./use-render-state";
import { useContextMenu } from "./use-context-menu";

/**
 * 画布层  交互全部交给 React Flow。
 *
 * ## 这一层为什么这么短
 *
 * 拖拽 / 缩放 / 平移 / 框选 / 连线 / 选中 / 吸附 / 小地图, 全由 React Flow
 * 提供。手写那一版光这些就 800+ 行, 而且反复冒出指针捕获、忘记禁 user-select
 * 这类坑。现在这些**一行都不用写**。
 *
 * ## 我们保留什么
 *
 * 1. **UE5 外观**  自定义节点与连线组件 (rf-node.tsx)。
 * 2. **连线合法性**  isValidConnection 接到我们自己的 canConnect,
 * 类型 DAG / 协变 / 执行流与数据流分离 / 环检测 全都照旧。
 * 3. **图是真相**  BlueprintGraph 仍然是唯一数据模型, React Flow 的
 * nodes/edges 只是渲染态 (转换在 rf-adapter.ts)。
 */

const NODE_TYPES = { bp: BpNode, bpComment: BpCommentNode };
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
  onUndo, onRedo, onComment, onTidy, onSearch, onRename, onMoveKind, onCommentHere,
}: BlueprintFlowProps): JSX.Element {
  const rf = useReactFlow();
  /** 画布宿主, 用于把客户端坐标换算成菜单的画布内坐标。 */
  const rfHostRef = useRef<HTMLDivElement | null>(null);

  /**
   * UE5 全套快捷键。复用 shortcuts.ts 的键位表与判据 
   * 换库不能把已经锁住的"声明了就必须有实现"这条断言换掉。
   */
  const { runShortcut: runShortcutWith, hasClip } = useFlowShortcuts({
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

  /**
   * 渲染态由 React Flow 自己持有  **不要每次渲染重建 nodes**。
   *
   * 之前是 `useMemo` 从 graph 全量换算 nodes, 而依赖链里有 onParamChange /
   * validation, 它们随 graph 每次变化 (拖拽每帧都变)。于是每帧重建整个
   * nodes 数组 -> 所有节点重新挂载 -> **闪屏**, 且拖拽越久越卡。
   *
   * 官方推荐: 用 useNodesState / useEdgesState, 让库维护渲染态;
   * 外部只在**语义变化**时单向同步进去 (见下面的 effect)。
   */

  const {
    rfNodes, rfEdges, handleNodesChange, handleEdgesChange,
    onNodeDragStart, onNodeDragStop,
  } = useRenderState({
    registry, graph, validation, selected, onGraphChange, onSelect, onMoveKind, onParamChange,
  });

  const { isValidConnection, onConnect } = useConnectivity({
    registry, graph, onGraphChange,
  });

  /**
   * 右键菜单 (UE5 的三类: 空白 / 节点 / 连线)。
   * 实现在 use-context-menu.ts  抽走是因为本文件有 250 行上限。
   */
  const {
    menu, setMenu, contextEdgeId, openMenuAt,
    onPaneContextMenu, onNodeContextMenu, onEdgeContextMenu, onMenuPick,
  } = useContextMenu({ rfHostRef, graph, selected, onSelect, onGraphChange, onEnterSubgraph, onCommentHere, runShortcut: runShortcutWith, hasClip });

  const onSelectionChange = useCallback<OnSelectionChangeFunc>(
    ({ nodes: sel }) => {
      const ids = sel.map((n) => String(n.data?.bpId ?? n.id)).filter(Boolean);
      onSelect?.(ids);
    },
    [onSelect]
  );

  return (
    <div ref={rfHostRef} className={cn("relative", className)} style={{ height, width: "100%" }}>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onSelectionChange={onSelectionChange}
        onPaneContextMenu={onPaneContextMenu}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
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
         * 键位  UE5 语义。
         *
         * 这几个是 React Flow **原生**提供的, 值已经和 UE5 一致, 显式写出来
         * 是为了不让"默认行为悄悄变了"这种事发生:
         * - deleteKeyCode: Delete / Backspace 删除选中 (UE5: Delete)
         * - multiSelectionKeyCode: Ctrl/Cmd + 点击 = 切换选中 (UE5: Ctrl+点击)
         * - selectionKeyCode: Shift + 拖 = 框选加选 (UE5: Shift+拖)
         * - panActivationKeyCode: 空格 + 拖 = 平移
         */
        deleteKeyCode={["Delete", "Backspace"]}
        multiSelectionKeyCode={["Control", "Meta"]}
        selectionKeyCode="Shift"
        panActivationKeyCode="Space"
        // 禁掉 React Flow 自己的文本选中干扰
        // UE5 蓝图编辑器没有水印/缩放按钮/小地图  缩放靠滚轮, 平移靠右键拖。
        // 那些控件是"演示用"的杂物, 留在画布上就是在干扰。
        proOptions={{ hideAttribution: true }}
        style={{ background: "var(--background)" }}
      >
        <ExecArrowMarker />
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} className="bp-grid-minor" />
        <Background variant={BackgroundVariant.Dots} gap={128} size={1.6} className="bp-grid-major" />
      </ReactFlow>

      {menu && <BlueprintContextMenu menu={menu} onPick={onMenuPick} onClose={() => setMenu(null)} />}
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
