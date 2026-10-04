"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type JSX, type ReactNode } from "react";
import { cn } from "../primitives/utils";
import { Badge } from "../layout/Badge";
import type { BlueprintGraph, BlueprintRegistry } from "./types";
import { useBlueprint, useSelection, type BlueprintApi } from "./useBlueprint";
import { BlueprintCanvas } from "./BlueprintCanvas";
import { BlueprintPalette } from "./BlueprintPalette";
import { serializeGraph, toPseudoCode } from "./serialize";
import { applyConnect } from "./connect";
import { makeId } from "./useBlueprint";
import { subgraphAsGraph } from "./subgraph";
import { Button } from "../primitives/button";
import { validateGraph } from "./validate";
import { useHistory } from "./history";
import { EditorToolbar } from "./editor-toolbar";
import { writeSubgraph } from "./subgraph";
import { useSubgraphEditing } from "./use-subgraph-editing";

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
}

export function BlueprintEditor({
  registry, value, defaultValue, onChange, className, height = 520,
  paletteWidth = 200, showIssues = true, toolbar, apiRef, standaloneHref,
}: BlueprintEditorProps): JSX.Element {
  const api = useBlueprint({ registry, value, defaultValue, onChange });
  const sel = useSelection();
  const [showCode, setShowCode] = useState(false);  /**
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
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
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

  /** 改动当前层级并声明标签; 历史由 track effect 统一记 (见上)。 */
  const commitInnerWithHistory = useCallback(
    (next: Pick<BlueprintGraph, "nodes" | "edges">, tag: string | null, label?: string) => {
      pendingTag.current = { tag, ...(label ? { label } : {}) };
      commitInner(next);
    },
    [commitInner]
  );

  /**
   * 键盘快捷键: ⌘Z 撤销 / ⌘⇧Z (或 Ctrl+Y) 重做。
   *
   * 输入框里不拦 —— 否则在注释标题里按 ⌘Z 会把图撤一步, 而用户想撤的是
   * 刚打的字。这是所有编辑器都遵守的边界。
   */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        const g = historyRef.current.undo();
        if (g) api.replace(g);
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        const g = historyRef.current.redo();
        if (g) api.replace(g);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [api]);

  const breadcrumb = useMemo(() => {
    const out: Array<{ id: string | null; label: string }> = [{ id: null, label: "根图" }];
    for (const sgId of path) {
      out.push({ id: sgId, label: api.graph.subgraphs?.[sgId]?.label ?? sgId });
    }
    return out;
  }, [path, api.graph]);

  // 用 ref 交出 api, 避免每次 render 都回调
  const handed = useMemo(() => ({ api }), [api]);
  if (apiRef && handed.api !== api) apiRef(api);

  const errors = useMemo(() => api.validation.issues.filter((i) => i.level === "error"), [api.validation]);
  const warnings = useMemo(() => api.validation.issues.filter((i) => i.level === "warning"), [api.validation]);

  return (
    <div className={cn("flex min-h-0 flex-col gap-2", className)}>
      {toolbar}

      <EditorToolbar
        breadcrumb={breadcrumb}
        onNavigate={(n) => setPath((p) => p.slice(0, n))}
        selectedIds={[...sel.selected]}
        onCollapse={(ids, label) => { const id = api.collapse(ids, label); if (id) sel.only(id); }}
        onCommentAround={(ids) => api.commentAround(ids, "")}
        onTidy={() => api.autoLayout()}
        onTidyRest={(ids) => api.tidy({ preserve: ids })}
        history={history}
        onUndo={() => { const g = history.undo(); if (g) api.replace(g); }}
        onRedo={() => { const g = history.redo(); if (g) api.replace(g); }}
        pathLength={path.length}
        onExitSubgraph={() => {
          const sgId = path[path.length - 1];
          const caller = api.graph.nodes.find((n) => n.subgraph === sgId);
          if (caller) api.expand(caller.id);
          setPath((p) => p.slice(0, -1));
        }}
      />

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
            onCreateComment={(box) => {
              pendingTag.current = { tag: null, label: "加注释" };
              api.addComment({ x: box.x, y: box.y, w: box.w, h: box.h });
            }}
            onDropNode={(type, at) => {
              const id = api.addNode(type, at);
              if (id) sel.only(id);
            }}
            onViewportCenterReady={(get) => { viewportCenterRef.current = get; }}
            {...(standaloneHref ? { standaloneHref } : {})}
            onCommentMove={(id, at) => {
              pendingTag.current = { tag: "move", label: "移动注释" };
              api.moveComment(id, at);
            }}
            onCommentChange={(id, patch) => api.updateComment(id, patch)}
            onSelect={(ids) => {
              sel.clear();
              sel.add(ids);
            }}
            onNodesMove={(moves) => {
              // 一次提交。逐节点提交会让受控模式下只留下最后一个节点的移动
              const byId = new Map(moves.map((m) => [m.id, m]));
              commitInnerWithHistory(
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
            }}
            onConnect={(from, to) => {
              const next = applyConnect(registry, editing, from, to, () => makeId("e"));
              if (next) commitInnerWithHistory({ nodes: next.nodes, edges: next.edges }, null, "连线");
            }}
            onDisconnect={(edgeId) =>
              commitInnerWithHistory({ nodes: editing.nodes, edges: editing.edges.filter((e) => e.id !== edgeId) }, null, "断开连线")
            }
            onNodeParamChange={(id, key, v) =>
              commitInnerWithHistory(
                { nodes: editing.nodes.map((n) => (n.id === id ? { ...n, params: { ...(n.params ?? {}), [key]: v } } : n)), edges: editing.edges },
                "param",
                "改参数"
              )
            }
            onRemoveNodes={(ids) => {
              const set = new Set(ids);
              commitInnerWithHistory(
                {
                  nodes: editing.nodes.filter((n) => !set.has(n.id)),
                  edges: editing.edges.filter((e) => !set.has(e.from.node) && !set.has(e.to.node)),
                },
                null,
                "删除节点"
              );
              sel.clear();
            }}
            onAddNode={(type, at) => {
              const def = registry.nodeTypes.get(type);
              const params: Record<string, unknown> = {};
              for (const p of def?.params ?? []) params[p.id] = p.default;
              const id = makeId();
              commitInnerWithHistory(
                { nodes: [...editing.nodes, { id, type, x: at.x, y: at.y, params }], edges: editing.edges },
                null,
                "添加节点"
              );
              sel.only(id);
            }}
          />
        </div>
      </div>

      {showIssues && (
        <div className="rounded-xl border border-border bg-card/40">
          <div className="flex items-center gap-2 border-b border-border px-3 py-1.5">
            <span className="text-[12px] font-medium text-foreground">诊断</span>
            <Badge variant={errors.length ? "destructive" : "success"}>
              {errors.length ? `${errors.length} 个错误` : "通过"}
            </Badge>
            {warnings.length > 0 && <Badge variant="warning">{warnings.length} 个警告</Badge>}
            <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">
              {api.graph.nodes.length} 节点 / {api.graph.edges.length} 连线
            </span>
            <button
              type="button"
              onClick={() => setShowCode((v) => !v)}
              className="rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {showCode ? "隐藏生成物" : "查看生成物"}
            </button>
          </div>

          {errors.length + warnings.length > 0 && (
            <ul className="max-h-28 overflow-y-auto px-3 py-1.5">
              {[...errors, ...warnings].map((i, idx) => (
                <li key={idx} className="flex items-start gap-2 py-0.5 text-[11px]">
                  <span className={cn("shrink-0", i.level === "error" ? "text-destructive" : "text-amber-400")}>
                    {i.level === "error" ? "✕" : "!"}
                  </span>
                  <span className="text-foreground">{i.message}</span>
                </li>
              ))}
            </ul>
          )}

          {showCode && (
            <pre className="max-h-48 overflow-auto border-t border-border px-3 py-2 font-mono text-[11px] text-muted-foreground">
              {JSON.stringify(serializeGraph(api.graph), null, 2)}
              {"\n\n// 伪代码\n"}
              {toPseudoCode(registry, api.graph)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

/** 不渲染、只校验。想在提交按钮里挡一道时用。 */
export function useGraphValid(registry: BlueprintRegistry, graph: BlueprintGraph): boolean {
  return useMemo(() => validateGraph(registry, graph).ok, [registry, graph]);
}

