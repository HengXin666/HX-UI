"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type JSX, type ReactNode } from "react";
import { cn } from "../primitives/utils";
import type { BlueprintGraph, BlueprintRegistry } from "./types";
import { useBlueprint, useSelection, type BlueprintApi } from "./useBlueprint";
import { BlueprintCanvas } from "./BlueprintCanvas";
import { BlueprintPalette } from "./BlueprintPalette";
import { validateGraph } from "./validate";
import { useHistory } from "./history";
import { EditorToolbar } from "./editor-toolbar";
import { useSubgraphEditing } from "./use-subgraph-editing";
import type { CanvasViewportApi } from "./use-shortcuts";
import { ShortcutHelp } from "./ShortcutHelp";
import { BlueprintIssues } from "./BlueprintIssues";
import { useCanvasCallbacks, useEditorShortcuts } from "./use-canvas-callbacks";
import { useToolbarProps, splitIssues } from "./use-toolbar-props";

/**
 * 编辑器: 把上面的零件拼成一个能直接放进页面的东西。
 *
 * ## 为什么要它
 *
 * 单独用 Canvas 要自己接六七个回调、自己存图、自己算校验、自己摆面板。
 * 那些代码在每个使用方里都会长成**不同的样子**, 于是"蓝图编辑器"变成
 * 每个人各自的一坨。这里把标准布局固化下来: 左面板 / 中画布 / 下诊断。
 *
 * ## 什么时候别用它
 *
 * 要自定义布局 (画布嵌在向导里、面板是抽屉) 时直接用 Canvas + useBlueprint。
 * 这个组件是"默认形态", 不是唯一形态。
 */

export interface BlueprintEditorProps {
  readonly registry: BlueprintRegistry;
  readonly value?: BlueprintGraph;
  readonly defaultValue?: BlueprintGraph;
  readonly onChange?: (graph: BlueprintGraph) => void;
  readonly className?: string;
  readonly height?: number | string;
  readonly paletteWidth?: number;
  /** 底部诊断区。关掉用于只读展示。 */
  readonly showIssues?: boolean;
  /** 顶部插槽。 */
  readonly toolbar?: ReactNode;
  /** 把 api 交出去 (父组件要"运行"按钮时用)。 */
  readonly apiRef?: (api: BlueprintApi) => void;
  /**
   * 独立整页画布的 URL。传了就把画布的"全屏"按钮换成链接 (不会被弹窗
   * 拦截器拦)。不传则退回 Fullscreen API。
   */
  readonly standaloneHref?: string;
  /**
   * 独立整页画布的 URL。给了它, 画布上的"独立页面"按钮会把**当前图**编码
   * 进链接并在新标签页打开 —— 而不是去调那个在文档站里必然失败的
   * Fullscreen API。
   */
  readonly standalonePageHref?: string;
  /** 同步频道。新标签页靠它拿到同一张图。 */
  readonly syncChannel?: string;
}

export function BlueprintEditor({
  registry, value, defaultValue, onChange, className, height = 520,
  paletteWidth = 200, showIssues = true, toolbar, apiRef, standaloneHref, standalonePageHref, syncChannel,
}: BlueprintEditorProps): JSX.Element {
  const api = useBlueprint({ registry, value, defaultValue, onChange });
  const sel = useSelection();
  /**
   * 当前所在的层级。null = 最外层。
   *
   * 进入子图时**不是换一张图**, 而是改这个路径 —— 编辑的始终是同一张根图,
   * 子图内容写回 graph.subgraphs。这样"在子图里改动"对外层立即可见,
   * 也无需维护两份状态和它们之间的同步。
   */
  const [path, setPath] = useState<string[]>([]);

  /** 存快照而非操作: 二十来个操作逐个写逆操作迟早漏, 漏了就是静默损坏。 */
  const history = useHistory();
  const historyRef = useRef(history);
  historyRef.current = history;
  /** 下一步改动的标签; track 消费它。 */
  const pendingTag = useRef<{ tag: string | null; label?: string } | null>(null);

  /**
   * 把当前层级的改动写回根图, 并记一步历史。
   *
   * @param tag 同类连续改动的标识。拖动传 "move", 参数连续输入传 "param",
   *            结构改动传 null (每一步都单独可撤)。
   */
  /**
   * 历史: 监听 graph 引用变化, 变了就记一步。
   * 不用"命令后手动 push" —— 受控模式下命令返回时 graph 还没更新,
   * push 的前后是同一份, 栈永远是空的 (实测撤销按钮一直 disabled)。
   */
  useEffect(() => {
    const t = pendingTag.current ?? undefined;
    pendingTag.current = null;
    historyRef.current.track(api.graph, t);
  }, [api.graph]);

  /**
   * 点面板时把节点放在**当前视口的中心**。
   *
   * 写死一个坐标(上一版是 x:140,y:120)在两种情况下都会错: 图被平移过、
   * 或缩放过之后, 那个固定的点可能在视口外 —— 用户点了没看见任何东西,
   * 只能以为"添加坏了"。所以向画布要它当前的视口中心。
   */
  const viewportCenterRef = useRef<() => { x: number; y: number }>(() => ({ x: 140, y: 120 }));

  const addAtViewportCenter = useCallback(
    (type: string) => {
      const at = viewportCenterRef.current();
      return api.addNode(type, at);
    },
    [api]
  );

  /** 层级导航: 当前编辑的图 + 写回。抽成 hook 是为了行预算。 */
  const { editing, commitInner } = useSubgraphEditing(api, path);

  /**
   * 快捷键要读**最新**的当前图与选区, 而键盘监听器只在挂载时绑定一次。
   * 直接用 editing 会让处理器永远读到注册那一刻的旧值 —— 在受控模式下
   * 那等于把旧图提交回去, 表现为"按了快捷键毫无反应"。
   */
  const editingRef = useRef(editing);
  editingRef.current = editing;

  /**
   * 画布把"缩放 / 重置 / 适应"这几个能力交上来。
   *
   * 视口状态只存在于画布内部 (平移与缩放随手势每帧变), 编辑器拿不到也
   * 不该自己存一份 —— 存了就是两份真相, 必然漂移。所以让画布注册一个
   * 命令对象, 快捷键只是转发。
   */
  const canvasViewportRef = useRef<CanvasViewportApi | null>(null);

  /** Tab 打开的节点搜索菜单位置。null = 关闭。 */
  /** Tab 打开的节点搜索菜单。 */
  const [pickerOpen, setPickerOpen] = useState(false);
  /** F2 正在重命名的节点。 */
  const [renamingId, setRenamingId] = useState<string | null>(null);
  /** 快捷键帮助面板。 */
  const [helpOpen, setHelpOpen] = useState(false);

  /** 改动当前层级并声明标签; 历史由 track effect 统一记 (见上)。 */
  const commitInnerWithHistory = useCallback(
    (next: Pick<BlueprintGraph, "nodes" | "edges">, tag: string | null, label?: string) => {
      pendingTag.current = { tag, ...(label ? { label } : {}) };
      commitInner(next);
    },
    [commitInner]
  );

  /** 快捷键 + 画布回调的接线。抽成 hook 是为了行预算 (本文件上限 250)。 */
  const shortcuts = useEditorShortcuts({
    getGraph: () => editingRef.current,
    commit: commitInnerWithHistory,
    getSelection: () => [...sel.ref.current],
    setSelection: (ids) => sel.setSelected(new Set(ids)),
    undo: () => { const g = historyRef.current.undo(); if (g) api.replace(g); },
    redo: () => { const g = historyRef.current.redo(); if (g) api.replace(g); },
    onComment: (ids) => api.commentAround(ids, ""),
    onTidy: () => api.autoLayout(),
    onSearch: () => setPickerOpen((v) => !v),
    onRename: (id) => setRenamingId(id),
    onEnterSubgraph: () => {
      const first = [...sel.ref.current][0];
      const n = first ? api.graph.nodes.find((x) => x.id === first) : undefined;
      if (n?.subgraph) setPath((p) => [...p, n.subgraph!]);
    },
    onExitSubgraph: () => setPath((p) => p.slice(0, -1)),
    getViewport: () => canvasViewportRef.current,
  });

  /** 画布那一大簇回调。抽成 hook 是为了行预算 (本文件上限 250)。 */

  const canvasCb = useCanvasCallbacks({
    registry,
    editing,
    commit: commitInnerWithHistory,
    pendingTag,
    api: {
      addNode: api.addNode,
      addComment: api.addComment,
      moveComment: api.moveComment,
      updateComment: api.updateComment,
      resizeComment: api.resizeComment,
    },
    sel: { only: sel.only, clear: sel.clear, setSelected: sel.setSelected },
  });

  const breadcrumb = useMemo(() => {
    const out: Array<{ id: string | null; label: string }> = [{ id: null, label: "根图" }];
    for (const sgId of path) {
      out.push({ id: sgId, label: api.graph.subgraphs?.[sgId]?.label ?? sgId });
    }
    return out;
  }, [path, api.graph]);


  const toolbarProps = useToolbarProps({
    api, history, breadcrumb, selectedIds: [...sel.selected], path, setPath,
    sel: { only: sel.only }, helpOpen, setHelpOpen,
    resetHistory: (g) => historyRef.current.reset(g),
  });

  // 用 ref 交出 api, 避免每次 render 都回调
  const handed = useMemo(() => ({ api }), [api]);
  if (apiRef && handed.api !== api) apiRef(api);

  const { errors, warnings } = useMemo(() => splitIssues(api.validation.issues), [api.validation]);

  return (
    <div className={cn("flex min-h-0 flex-col gap-2", className)}>
      {toolbar}

      <EditorToolbar {...toolbarProps} />

      <div className="flex min-h-0 gap-2" style={{ height }}>
        <div
          className="min-h-0 shrink-0 overflow-hidden rounded-xl border border-border bg-card/40"
          style={{ width: paletteWidth }}
        >
          <BlueprintPalette
            registry={registry}
            onPick={(type, at) => {
              // 拖拽: 用落点。点击: 没落点, 交给画布算视口中心。
              const id = at ? api.addNode(type, at) : addAtViewportCenter(type);
              if (id) sel.only(id);
            }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <BlueprintCanvas
            registry={registry}
            graph={editing}
            validation={api.validation}
            selected={sel.selected}
            height="100%"
            onEnterSubgraph={(_nodeId, sgId) => setPath((p) => [...p, sgId])}
            {...canvasCb}
            onViewportCenterReady={(get) => { viewportCenterRef.current = get; }}
            onViewportReady={(v) => { canvasViewportRef.current = v; }}
            pickerOpen={pickerOpen}
            setPickerOpen={setPickerOpen}
            {...(standaloneHref ? { standaloneHref } : {})}
            {...(standalonePageHref ? { standalonePageHref } : {})}
            {...(syncChannel ? { syncChannel } : {})}
            renamingId={renamingId}
            onRenameCommit={(id, next) => {
              commitInnerWithHistory(
                { nodes: editing.nodes.map((n) => (n.id === id ? { ...n, title: next } : n)), edges: editing.edges },
                null,
                "重命名节点"
              );
              setRenamingId(null);
            }}
            onRenameCancel={() => setRenamingId(null)}
          />
        </div>
      </div>

      {helpOpen && <ShortcutHelp onClose={() => setHelpOpen(false)} />}

      {showIssues && (
        <BlueprintIssues registry={registry} graph={api.graph} errors={errors} warnings={warnings} />
      )}
    </div>
  );
}

