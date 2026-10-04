import { useCallback, useMemo } from "react";
import type { BlueprintGraph } from "./types";
import type { HistoryApi } from "./history";
import type { Crumb } from "./editor-toolbar";
import type { BlueprintApi } from "./useBlueprint";
import { useGraphIO } from "./use-canvas-callbacks";
import { validateGraph } from "./validate";
import type { BlueprintRegistry } from "./types";

/**
 * 顶栏那一簇 props。
 *
 * ## 为什么连 props 都要抽成 hook
 *
 * BlueprintEditor.tsx 被行预算压到 250 行, 而顶栏有 14 个回调 —— 每个一行
 * 箭头函数就是 14 行, 加上 JSX 里的缩进与换行占掉 30 多行。抽出来后编辑器
 * 只剩 `<EditorToolbar {...toolbarProps} />`, 一眼能读完整个布局。
 *
 * 顺带的好处: 这些回调**全部是转发**, 放一起能看出"顶栏到底能干什么",
 * 而不是散在 200 行的 render 里。
 */

export interface ToolbarWiring {
  readonly api: BlueprintApi;
  readonly history: HistoryApi;
  readonly breadcrumb: readonly Crumb[];
  readonly selectedIds: readonly string[];
  readonly path: readonly string[];
  readonly setPath: (fn: (p: string[]) => string[]) => void;
  readonly sel: { readonly only: (id: string) => void };
  readonly helpOpen: boolean;
  readonly setHelpOpen: (fn: (v: boolean) => boolean) => void;
  /** 导入后重置历史栈。 */
  readonly resetHistory?: (g: BlueprintGraph) => void;
}

export function useToolbarProps(o: ToolbarWiring) {
  const { api, history, breadcrumb, selectedIds, path, setPath, sel, helpOpen, setHelpOpen } = o;
  const io = useGraphIO(() => api.graph, api.replace, o.resetHistory);

  const onNavigate = useCallback((n: number) => setPath((p) => p.slice(0, n)), [setPath]);

  const onCollapse = useCallback(
    (ids: readonly string[], label: string) => {
      const id = api.collapse(ids, label);
      if (id) sel.only(id);
    },
    [api, sel]
  );

  const onExitSubgraph = useCallback(() => {
    const sgId = path[path.length - 1];
    const caller = api.graph.nodes.find((n) => n.subgraph === sgId);
    if (caller) api.expand(caller.id);
    setPath((p) => p.slice(0, -1));
  }, [api, path, setPath]);

  return {
    breadcrumb,
    onNavigate,
    selectedIds,
    onCollapse,
    onCommentAround: (ids: readonly string[]) => api.commentAround(ids, ""),
    onTidy: () => api.autoLayout(),
    onTidyRest: (ids: readonly string[]) => api.tidy({ preserve: ids }),
    history,
    onUndo: () => { const g = history.undo(); if (g) api.replace(g); },
    onRedo: () => { const g = history.redo(); if (g) api.replace(g); },
    onSave: io.onSave,
    onLoad: io.onLoad,
    onSaveAs: io.onSaveAs,
    onToggleHelp: () => setHelpOpen((v) => !v),
    ...(helpOpen ? { helpOpen: true } : {}),
    pathLength: path.length,
    onExitSubgraph,
  };
}

/** 校验结论按等级分开 —— 顶栏要显示条数, 诊断区要列清单, 两者都要。 */
export function splitIssues<T extends { readonly level: "error" | "warning" }>(
  issues: readonly T[]
): { readonly errors: readonly T[]; readonly warnings: readonly T[] } {
  return {
    errors: issues.filter((i) => i.level === "error"),
    warnings: issues.filter((i) => i.level === "warning"),
  };
}

export type { BlueprintGraph };

/** 不渲染、只校验。想在提交按钮里挡一道时用。 */
export function useGraphValid(registry: BlueprintRegistry, graph: BlueprintGraph): boolean {
  return useMemo(() => validateGraph(registry, graph).ok, [registry, graph]);
}
