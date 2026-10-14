"use client";

import { useCallback, useEffect, useRef, type JSX } from "react";
import { useReactFlow } from "@xyflow/react";
import type { BlueprintGraph } from "./types";
import { matchShortcut, shouldHandle, isTypingTarget, type ShortcutDef } from "./shortcuts";
import { copySelection, pasteClip, alignNodes, type ClipboardPayload } from "./clipboard";
import { SHORTCUTS } from "./shortcuts";

/**
 * 把我们的快捷键表接到 React Flow 版画布上。
 *
 * ## 为什么要自己接, 不用库的
 *
 * React Flow 只原生提供 delete / 多选 / 框选 / 平移那几个键。而我们要的是
 * **UE5 全套** (Ctrl+D 复制、Ctrl+C/X/V 剪贴板、Ctrl+Z/Y 撤销重做、
 * Shift+WASD 对齐、Ctrl+A 全选、F2 重命名、Tab 搜索、Home 适应 …)。
 * 那些是我们的语义, 库里没有。
 *
 * 好处是: 键位识别与分派**复用同一份** shortcuts.ts / runShortcut,
 * 于是"表里声明了就必须有实现"那条断言对新画布同样成立 
 * 换库不能把已经锁住的判据换掉。
 */

export interface FlowShortcutsProps {
  readonly graph: BlueprintGraph;
  readonly selected: readonly string[];
  readonly onGraphChange: (next: BlueprintGraph) => void;
  readonly onSelect: (ids: readonly string[]) => void;
  readonly undo: () => void;
  readonly redo: () => void;
  readonly onComment?: (ids: readonly string[]) => void;
  readonly onTidy?: () => void;
  readonly onSearch?: () => void;
  readonly onRename?: (id: string) => void;
  readonly onSearchClose?: () => void;
}

/** 键位表暴露出去, 帮助面板照它渲染  与手写画布同一份。 */
export const FLOW_SHORTCUTS: readonly ShortcutDef[] = SHORTCUTS;

export function useFlowShortcuts(o: FlowShortcutsProps): {
  /** 手动触发一个快捷键 (右键菜单复用同一套行为)。 */
  readonly runShortcut: (id: string) => void;
  /** 剪贴板里有没有东西 (决定"粘贴"是否可用)。 */
  readonly hasClip: () => boolean;
} {
  const rf = useReactFlow();
  const ref = useRef(o);
  ref.current = o;

  /** 剪贴板。放在这里而不是模块级: 每个画布实例各一份。 */
  const clipRef = useRef<ClipboardPayload | null>(null);

  const run = useCallback((id: string) => {
    const s = ref.current;
    const graph = s.graph;
    const sel = s.selected;

    switch (id) {
      case "delete": {
        if (!sel.length) return;
        const set = new Set(sel);
        s.onGraphChange({
          ...graph,
          nodes: graph.nodes.filter((n) => !set.has(n.id)),
          edges: graph.edges.filter((e) => !set.has(e.from.node) && !set.has(e.to.node)),
        });
        s.onSelect([]);
        return;
      }
      case "duplicate": {
        if (!sel.length) return;
        const { graph: next, ids } = pasteClip(graph, copySelection(graph, sel));
        s.onGraphChange(next);
        s.onSelect(ids);
        return;
      }
      case "copy":
      case "cut": {
        if (!sel.length) return;
        clipRef.current = copySelection(graph, sel);
        if (id === "cut") {
          const set = new Set(sel);
          s.onGraphChange({
            ...graph,
            nodes: graph.nodes.filter((n) => !set.has(n.id)),
            edges: graph.edges.filter((e) => !set.has(e.from.node) && !set.has(e.to.node)),
          });
          s.onSelect([]);
        }
        return;
      }
      case "paste": {
        const c = clipRef.current;
        if (!c || !c.nodes.length) return;
        const { graph: next, ids } = pasteClip(graph, c);
        s.onGraphChange(next);
        s.onSelect(ids);
        return;
      }
      case "undo": s.undo(); return;
      case "redo": s.redo(); return;
      case "selectAll": s.onSelect(graph.nodes.map((n) => n.id)); return;
      case "comment": if (sel.length) s.onComment?.(sel); return;
      case "tidy": s.onTidy?.(); return;
      case "search": s.onSearch?.(); return;
      case "rename": if (sel[0]) s.onRename?.(sel[0]); return;
      case "escape": s.onSelect([]); s.onSearchClose?.(); return;
      case "alignLeft":
      case "alignRight":
      case "alignTop":
      case "alignBottom": {
        if (sel.length < 2) return;
        const edge = id === "alignLeft" ? "left" : id === "alignRight" ? "right" : id === "alignTop" ? "top" : "bottom";
        s.onGraphChange(alignNodes(graph, sel, edge));
        return;
      }
      case "zoomIn": rf.zoomIn({ duration: 120 }); return;
      case "zoomOut": rf.zoomOut({ duration: 120 }); return;
      case "zoomReset": rf.setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 120 }); return;
      case "fit": rf.fitView({ duration: 200, padding: 0.15 }); return;
      default:
        return;
    }
  }, [rf]);

  const hasClip = useCallback(() => !!clipRef.current && clipRef.current.nodes.length > 0, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target as HTMLElement | null)) return;
      const id = matchShortcut(e);
      if (!id) return;
      const hasSelection = ref.current.selected.length > 0;
      if (!shouldHandle(id, { hasSelection })) return;
      e.preventDefault();
      run(id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [run]);

  return { runShortcut: run, hasClip };
}
