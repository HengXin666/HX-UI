import { useCallback, useState, type RefObject } from "react";
import type { BlueprintGraph } from "./types";
import {
  nodeMenuItems, paneMenuItems, edgeMenuItems,
  type ContextMenuState, type MenuItem,
} from "./ContextMenu";
import type { RfNode } from "./rf-adapter";

/**
 * 右键菜单的状态与分派。
 *
 * ## UE5 的三类右键
 *
 * 空白 -> 加注释 / 粘贴 / 全选 / 整理 / 适应
 * 节点 -> 重命名 / 复制 / 删除 / 进子图 / 断开此节点的线
 * 连线 -> 删除这条线
 *
 * ## 坐标为什么要换算
 *
 * 菜单是画布的**子元素**, 用绝对定位摆。直接拿 clientX/Y 会在页面有滚动
 * 或画布有偏移时错位, 所以减掉宿主的 boundingRect 左上角。
 *
 * ## 菜单项为什么复用 runShortcut
 *
 * "复制 / 删除 / 全选"这些菜单项与快捷键是**同一个动作**。各写一份就会
 * 出现"菜单里能用、快捷键不能用"或反之。所以菜单只做分派, 行为仍由
 * 快捷键那一套提供。
 */

export function useContextMenu(o: {
  readonly rfHostRef: RefObject<HTMLDivElement | null>;
  readonly graph: BlueprintGraph;
  readonly selected?: readonly string[];
  readonly onSelect?: (ids: readonly string[]) => void;
  readonly onGraphChange?: (next: BlueprintGraph) => void;
  readonly onEnterSubgraph?: (sgId: string) => void;
  readonly onCommentHere?: (at: { x: number; y: number }) => void;
  readonly runShortcut: (id: string) => void;
  readonly hasClip: () => boolean;
}) {
  const [menu, setMenu] = useState<ContextMenuState | null>(null);
  const [contextEdgeId, setContextEdgeId] = useState<string | null>(null);
  const {
    rfHostRef, graph, selected, onSelect, onGraphChange,
    onEnterSubgraph, onCommentHere, runShortcut, hasClip,
  } = o;

  const openMenuAt = useCallback(
    (clientX: number, clientY: number, items: readonly MenuItem[]) => {
      const rect = rfHostRef.current?.getBoundingClientRect();
      setMenu({
        x: clientX - (rect?.left ?? 0),
        y: clientY - (rect?.top ?? 0),
        items,
      });
    },
    [rfHostRef]
  );

  const onPaneContextMenu = useCallback(
    (e: { clientX: number; clientY: number; preventDefault: () => void }) => {
      e.preventDefault();
      openMenuAt(e.clientX, e.clientY, paneMenuItems({ canPaste: hasClip() }));
    },
    [openMenuAt, hasClip]
  );

  const onNodeContextMenu = useCallback(
    (e: { clientX: number; clientY: number; preventDefault: () => void }, node: RfNode) => {
      e.preventDefault();
      // 右键一个未选中的节点时先选中它  否则"删除"会删到别的东西上
      const id = String(node.data?.bpId ?? node.id);
      if (!(selected ?? []).includes(id)) onSelect?.([id]);
      openMenuAt(e.clientX, e.clientY, nodeMenuItems({
        hasSelection: true,
        multi: (selected ?? []).length > 1,
        hasSubgraph: !!node.data?.subgraph,
      }));
    },
    [openMenuAt, onSelect, selected]
  );

  const onEdgeContextMenu = useCallback(
    (e: { clientX: number; clientY: number; preventDefault: () => void; currentTarget: unknown }) => {
      e.preventDefault();
      const el = e.currentTarget as { getAttribute?: (n: string) => string | null } | null;
      // React Flow 给边元素的属性是 data-id
      setContextEdgeId(el?.getAttribute?.("data-id") ?? null);
      openMenuAt(e.clientX, e.clientY, edgeMenuItems());
    },
    [openMenuAt]
  );

  const onMenuPick = useCallback(
    (id: string) => {
      switch (id) {
        case "delete":
        case "duplicate":
        case "copy":
        case "paste":
        case "selectAll":
        case "tidy":
        case "fit":
        case "rename":
          runShortcut(id);
          return;
        case "enterSubgraph": {
          const first = (selected ?? [])[0];
          const n = graph.nodes.find((x) => x.id === first);
          if (n?.subgraph) onEnterSubgraph?.(n.subgraph);
          return;
        }
        case "addComment": {
          if (menu) onCommentHere?.({ x: menu.x, y: menu.y });
          return;
        }
        case "disconnectNode": {
          const ids = new Set(selected ?? []);
          if (!ids.size) return;
          onGraphChange?.({
            ...graph,
            edges: graph.edges.filter((e) => !ids.has(e.from.node) && !ids.has(e.to.node)),
          });
          return;
        }
        case "deleteEdge": {
          if (!contextEdgeId) return;
          onGraphChange?.({
            ...graph,
            edges: graph.edges.filter((e) => e.id !== contextEdgeId),
          });
          return;
        }
        default:
          return;
      }
    },
    [runShortcut, selected, graph, onGraphChange, onEnterSubgraph, menu, onCommentHere, contextEdgeId]
  );

  return {
    menu, setMenu, contextEdgeId, openMenuAt,
    onPaneContextMenu, onNodeContextMenu, onEdgeContextMenu, onMenuPick,
  };
}
