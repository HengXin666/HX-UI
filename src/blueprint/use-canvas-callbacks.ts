import { useCallback, useRef, type RefObject } from "react";
import type { BlueprintGraph, BlueprintRegistry, PortRef } from "./types";
import { applyConnect } from "./connect";
import { makeId } from "./useBlueprint";
import { useShortcuts, type CanvasViewportApi } from "./use-shortcuts";
import { downloadGraph, pickGraphFile, saveGraphToHandle } from "./persist";

/**
 * 编辑器喂给 `<BlueprintCanvas>` 的那一大簇回调。
 *
 * ## 为什么抽出来
 *
 * BlueprintEditor.tsx 被行预算压到 250 行, 而这十来个回调占了近 120 行。
 * 它们之间**互不相干** (连线 / 移动 / 注释 / 折叠各管各的), 但共享同一组
 * 上下文 (editing / commitInnerWithHistory / sel), 所以整体搬出来是干净的一刀。
 *
 * ## 一条贯穿的约定
 *
 * 每个回调都只做两件事: 算出新图, 交给 commitInnerWithHistory 并声明这一步
 * 在历史里叫什么。不在这里碰视图状态、不在这里发同步消息 —— 那些各有各的
 * 归口。混进来就会变成"改一处要懂三个子系统"。
 */

export interface CanvasCallbacksOptions {
  readonly registry: BlueprintRegistry;
  /** 当前层级正在编辑的图。 */
  readonly editing: BlueprintGraph;
  /** 提交改动 + 记历史。 */
  readonly commit: (
    next: Pick<BlueprintGraph, "nodes" | "edges">,
    tag: string | null,
    label?: string
  ) => void;
  /** 待写入的历史标签 (注释类改动走 api, 但要提前声明标签)。 */
  readonly pendingTag: RefObject<{ tag: string | null; label?: string } | null>;
  readonly api: {
    readonly addNode: (type: string, at: { x: number; y: number }) => string | null;
    readonly addComment: (box: { x: number; y: number; w?: number; h?: number }) => string;
    readonly moveComment: (id: string, at: { x: number; y: number }) => void;
    readonly updateComment: (id: string, patch: Record<string, unknown>) => void;
    readonly resizeComment: (id: string, box: { x: number; y: number; w: number; h: number }) => void;
  };
  readonly sel: {
    readonly only: (id: string) => void;
    readonly clear: () => void;
    readonly setSelected: (ids: Set<string>) => void;
  };
}

export interface CanvasCallbacks {
  readonly onDropNode: (type: string, at: { x: number; y: number }) => void;
  readonly onAddNode: (type: string, at: { x: number; y: number }) => void;
  readonly onCreateComment: (box: { x: number; y: number; w: number; h: number }) => void;
  readonly onCommentMove: (id: string, at: { x: number; y: number }) => void;
  readonly onCommentChange: (id: string, patch: Record<string, unknown>) => void;
  readonly onCommentTone: (id: string, tone: string) => void;
  readonly onCommentResize: (id: string, box: { x: number; y: number; w: number; h: number }) => void;
  readonly onSelect: (ids: readonly string[]) => void;
  readonly onNodesMove: (moves: readonly { id: string; x: number; y: number }[]) => void;
  readonly onConnect: (from: PortRef, to: PortRef) => void;
  readonly onDisconnect: (edgeId: string) => void;
  readonly onNodeParamChange: (id: string, key: string, v: unknown) => void;
}

export function useCanvasCallbacks(opts: CanvasCallbacksOptions): CanvasCallbacks {
  const { registry, editing, commit, pendingTag, api, sel } = opts;

  const onDropNode = useCallback(
    (type: string, at: { x: number; y: number }) => {
      const id = api.addNode(type, at);
      if (id) sel.only(id);
    },
    [api, sel]
  );

  const onCreateComment = useCallback(
    (box: { x: number; y: number; w: number; h: number }) => {
      pendingTag.current = { tag: null, label: "加注释" };
      api.addComment({ x: box.x, y: box.y, w: box.w, h: box.h });
    },
    [api, pendingTag]
  );

  const onCommentMove = useCallback(
    (id: string, at: { x: number; y: number }) => {
      pendingTag.current = { tag: "move", label: "移动注释" };
      api.moveComment(id, at);
    },
    [api, pendingTag]
  );

  /**
   * 改注释文字。必须设 tag="param" —— 不设的话每个字都是独立的一步,
   * 打 20 个字要按 20 次撤销才能退回, 那等于没有撤销。
   */
  const onCommentChange = useCallback(
    (id: string, patch: Record<string, unknown>) => {
      pendingTag.current = { tag: "param", label: "改注释" };
      api.updateComment(id, patch);
    },
    [api, pendingTag]
  );

  const onCommentTone = useCallback(
    (id: string, tone: string) => {
      pendingTag.current = { tag: "param", label: "改注释底色" };
      api.updateComment(id, { tone });
    },
    [api, pendingTag]
  );

  const onCommentResize = useCallback(
    (id: string, box: { x: number; y: number; w: number; h: number }) => {
      pendingTag.current = { tag: "move", label: "调整注释大小" };
      api.resizeComment(id, box);
    },
    [api, pendingTag]
  );

  /** 批量移动: **一次**提交。逐节点提交会让受控模式下只留下最后一个节点。 */
  const onNodesMove = useCallback(
    (moves: readonly { id: string; x: number; y: number }[]) => {
      const byId = new Map(moves.map((m) => [m.id, m]));
      commit(
        {
          nodes: editing.nodes.map((n) => {
            const m = byId.get(n.id);
            return m ? { ...n, x: m.x, y: m.y } : n;
          }),
          edges: editing.edges,
        },
        "move",
        "移动节点"
      );
    },
    [editing, commit]
  );

  const onConnect = useCallback(
    (from: PortRef, to: PortRef) => {
      const next = applyConnect(registry, editing, from, to, () => makeId("e"));
      if (next) commit({ nodes: next.nodes, edges: next.edges }, null, "连线");
    },
    [registry, editing, commit]
  );

  const onDisconnect = useCallback(
    (edgeId: string) =>
      commit({ nodes: editing.nodes, edges: editing.edges.filter((e) => e.id !== edgeId) }, null, "断开连线"),
    [editing, commit]
  );

  const onNodeParamChange = useCallback(
    (id: string, key: string, v: unknown) =>
      commit(
        {
          nodes: editing.nodes.map((n) =>
            n.id === id ? { ...n, params: { ...(n.params ?? {}), [key]: v } } : n
          ),
          edges: editing.edges,
        },
        "param",
        "改参数"
      ),
    [editing, commit]
  );

  const onAddNode = useCallback(
    (type: string, at: { x: number; y: number }) => {
      const def = registry.nodeTypes.get(type);
      const params: Record<string, unknown> = {};
      for (const p of def?.params ?? []) params[p.id] = p.default;
      const id = makeId();
      commit({ nodes: [...editing.nodes, { id, type, x: at.x, y: at.y, params }], edges: editing.edges }, null, "添加节点");
      sel.only(id);
    },
    [registry, editing, commit, sel]
  );

  return {
    onDropNode,
    onAddNode,
    onCreateComment,
    onCommentMove,
    onCommentChange,
    onCommentTone,
    onCommentResize,
    onSelect: (ids) => sel.setSelected(new Set(ids)),
    onNodesMove,
    onConnect,
    onDisconnect,
    onNodeParamChange,
  };
}

/**
 * 快捷键的接线。
 *
 * 与上面的画布回调同源同理: 编辑器被行预算压着, 而这块是"把外部能力接到
 * useShortcuts 上"的一整段配置, 搬出来正好。
 */
export interface ShortcutWiringOptions {
  readonly getGraph: () => BlueprintGraph;
  readonly commit: (
    next: Pick<BlueprintGraph, "nodes" | "edges">,
    tag: string | null,
    label?: string
  ) => void;
  readonly getSelection: () => readonly string[];
  readonly setSelection: (ids: readonly string[]) => void;
  readonly undo: () => void;
  readonly redo: () => void;
  readonly onComment: (ids: readonly string[]) => void;
  readonly onTidy: () => void;
  readonly onSearch: () => void;
  /** F2 重命名。 */
  readonly onRename: (id: string) => void;
  readonly onEnterSubgraph: () => void;
  readonly onExitSubgraph: () => void;
  readonly getViewport: () => CanvasViewportApi | null;
}

export function useEditorShortcuts(opts: ShortcutWiringOptions) {
  return useShortcuts({
    getGraph: opts.getGraph,
    commit: opts.commit,
    getSelection: opts.getSelection,
    setSelection: opts.setSelection,
    undo: opts.undo,
    redo: opts.redo,
    onComment: opts.onComment,
    onTidy: opts.onTidy,
    onSearch: opts.onSearch,
    onRename: opts.onRename,
    onEnterSubgraph: opts.onEnterSubgraph,
    onExitSubgraph: opts.onExitSubgraph,
    getViewport: opts.getViewport,
  });
}

/**
 * 导入 / 导出。
 *
 * 一条刻意的取舍: **读失败时不动当前图**。
 * 用户选错了文件 (不是蓝图 JSON / 缺 nodes), 最糟的做法是清空画布 ——
 * 那等于把他正在编辑的东西弄没了。留着原图、什么都不做, 比报错弹窗友好,
 * 也比静默清空安全。
 *
 * @param getGraph 取当前图。用 getter 而不是值, 避免每次 render 都重建回调。
 * @param replace 整体替换。
 */
export function useGraphIO(
  getGraph: () => BlueprintGraph,
  replace: (g: BlueprintGraph) => void,
  /** 导入后重置历史栈 —— 否则按一下 Ctrl+Z 就把刚导入的图撤没了。 */
  resetHistory?: (g: BlueprintGraph) => void
): {
  readonly onSave: () => void;
  readonly onLoad: () => void;
  /** "另存到…": 走 File System Access, 授权一次后可直接写回原文件。 */
  readonly onSaveAs: () => void;
} {
  const onSave = useCallback(() => downloadGraph(getGraph()), [getGraph]);

  /**
   * 另存到… (File System Access)。
   *
   * 与"导出"的区别: 导出每次都是一个**新**下载, 而这里拿到 handle 后可以
   * 反复写回同一个文件 —— 那才是"保存"这个词的意思。
   *
   * 不支持的浏览器 (Firefox / Safari) 返回 null, 此时退回下载。不做
   * "假装有 handle" 的降级 —— 那会让用户以为存住了而实际没有。
   */
  const handleRef = useRef(null);
  const onSaveAs = useCallback(() => {
    void (async () => {
      try {
        const h = await saveGraphToHandle(getGraph(), handleRef.current);
        if (h) handleRef.current = h;
        else downloadGraph(getGraph()); // 不支持 -> 退回下载, 至少文件还在
      } catch {
        // 用户在保存框里点了取消: 什么都不做, 也不要弹错
      }
    })();
  }, [getGraph]);

  const onLoad = useCallback(() => {
    void (async () => {
      try {
        const g = await pickGraphFile();
        if (g) {
          replace(g);
          // 关键: 导入是"换了一张图", 不是"改了一步"。
          // 不重置的话撤销栈里还压着导入前的旧图, 用户按一下 Ctrl+Z
          // 就会看到"我刚导入的东西没了"。
          resetHistory?.(g);
        }
      } catch {
        // 读失败: 留着当前图不动
      }
    })();
  }, [replace, resetHistory]);

  return { onSave, onLoad, onSaveAs };
}
