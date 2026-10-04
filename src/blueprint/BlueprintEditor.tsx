"use client";

import { useCallback, useMemo, useRef, useState, type JSX, type ReactNode } from "react";
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
import { writeSubgraph } from "./subgraph";

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
   * 点"独立页面"时。不传则由画布退回 Fullscreen API。
   * 传了才是真正的整页画布 —— 推荐传。
   */
  readonly onOpenStandalone?: () => void;
}

export function BlueprintEditor({
  registry, value, defaultValue, onChange, className, height = 520,
  paletteWidth = 200, showIssues = true, toolbar, apiRef, onOpenStandalone,
}: BlueprintEditorProps): JSX.Element {
  const api = useBlueprint({ registry, value, defaultValue, onChange });
  const sel = useSelection();
  const [showCode, setShowCode] = useState(false);
  /**
   * 当前所在的层级。null = 最外层。
   *
   * 进入子图时**不是换一张图**, 而是改这个路径 —— 编辑的始终是同一张根图,
   * 子图内容写回 graph.subgraphs。这样"在子图里改动"对外层立即可见,
   * 也无需维护两份状态和它们之间的同步。
   */
  const [path, setPath] = useState<string[]>([]);

  /** 当前正在编辑的那张图。 */
  const editing = useMemo(() => {
    let g: BlueprintGraph = api.graph;
    for (const sgId of path) {
      const inner = subgraphAsGraph(g, sgId);
      if (!inner) return g;
      g = inner;
    }
    return g;
  }, [api.graph, path]);

  /** 把当前层级的改动写回根图。 */
  const commitInner = useCallback(
    (next: Pick<BlueprintGraph, "nodes" | "edges">) => {
      if (path.length === 0) {
        api.replace({ ...api.graph, nodes: next.nodes, edges: next.edges });
        return;
      }
      // 从最内层往外逐层写回
      let g: BlueprintGraph = { ...api.graph, nodes: next.nodes, edges: next.edges };
      for (let i = path.length - 1; i >= 0; i--) {
        const outer = i === 0 ? api.graph : subgraphAsGraph(api.graph, path[i - 1])!;
        const g2: BlueprintGraph = { ...outer, nodes: g.nodes, edges: g.edges };
        g = writeSubgraph(g, path[i], { nodes: g2.nodes, edges: g2.edges });
        if (i > 0) g = { ...subgraphAsGraph(api.graph, path[i - 1])!, nodes: g.nodes, edges: g.edges };
      }
      api.replace(g);
    },
    [api, path]
  );

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

      {/* 层级导航 + 结构操作。只在有子图或选中时才显示折叠按钮 —— 空白时它没意义 */}
      <div className="flex flex-wrap items-center gap-1.5">
        {breadcrumb.map((b, i) => (
          <span key={b.id ?? "root"} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-[11px] text-muted-foreground">/</span>}
            <button
              type="button"
              onClick={() => setPath((p) => p.slice(0, i))}
              className={cn(
                "rounded px-1.5 py-0.5 text-[11px] transition-colors",
                i === breadcrumb.length - 1 ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {b.label}
            </button>
          </span>
        ))}
        <span className="mx-1 h-3 w-px bg-border" />
        <Button
          size="xs"
          variant="outline"
          disabled={sel.selected.size === 0}
          onClick={() => {
            const ids = [...sel.selected];
            const id = api.collapse(ids, "子图");
            if (id) sel.only(id);
          }}
          title="把选中的节点折成一个节点 (可双击进入)"
        >
          折叠为子图
        </Button>
        <Button
          size="xs"
          variant="outline"
          disabled={sel.selected.size === 0}
          onClick={() => api.commentAround([...sel.selected], "")}
          title="给选中的节点加一个注释框"
        >
          加注释
        </Button>

        {/*
          自动布局: 分层布局 (简化 Sugiyama)。
          两个按钮的差别是"保不保留选中节点的原位置" ——
          整理整图 vs 只把没摆过的节点排好, 别拆掉用户辛苦摆的部分。
        */}
        <Button
          size="xs"
          variant="outline"
          onClick={() => api.autoLayout()}
          title="按流向分层重排全部节点 (确定性: 同样的图永远得到同样的结果)"
        >
          整理布局
        </Button>
        <Button
          size="xs"
          variant="outline"
          disabled={sel.selected.size === 0}
          onClick={() => api.tidy({ preserve: [...sel.selected] })}
          title="重排其余节点, 选中的保持原位"
        >
          整理其余
        </Button>

        {path.length > 0 && (
          <Button
            size="xs"
            variant="outline"
            className="ml-auto"
            onClick={() => {
              // 展开当前所在的子图, 并退回上一层
              const sgId = path[path.length - 1];
              const caller = api.graph.nodes.find((n) => n.subgraph === sgId);
              if (caller) api.expand(caller.id);
              setPath((p) => p.slice(0, -1));
            }}
          >
            展开并退出
          </Button>
        )}
      </div>

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
            onDropNode={(type, at) => {
              const id = api.addNode(type, at);
              if (id) sel.only(id);
            }}
            onViewportCenterReady={(get) => { viewportCenterRef.current = get; }}
            {...(onOpenStandalone ? { onOpenStandalone } : {})}
            onCommentMove={(id, delta) => api.moveComment(id, delta)}
            onCommentChange={(id, patch) => api.updateComment(id, patch)}
            onSelect={(ids) => {
              sel.clear();
              sel.add(ids);
            }}
            onNodesMove={(moves) => {
              // 一次提交。逐节点提交会让受控模式下只留下最后一个节点的移动
              const byId = new Map(moves.map((m) => [m.id, m]));
              commitInner({
                nodes: editing.nodes.map((n) => {
                  const m = byId.get(n.id);
                  return m ? { ...n, x: m.x, y: m.y } : n;
                }),
                edges: editing.edges,
              });
            }}
            onConnect={(from, to) => {
              const next = applyConnect(registry, editing, from, to, () => makeId("e"));
              if (next) commitInner({ nodes: next.nodes, edges: next.edges });
            }}
            onDisconnect={(edgeId) => commitInner({ nodes: editing.nodes, edges: editing.edges.filter((e) => e.id !== edgeId) })}
            onNodeParamChange={(id, key, v) =>
              commitInner({ nodes: editing.nodes.map((n) => (n.id === id ? { ...n, params: { ...(n.params ?? {}), [key]: v } } : n)), edges: editing.edges })
            }
            onRemoveNodes={(ids) => {
              const set = new Set(ids);
              commitInner({
                nodes: editing.nodes.filter((n) => !set.has(n.id)),
                edges: editing.edges.filter((e) => !set.has(e.from.node) && !set.has(e.to.node)),
              });
              sel.clear();
            }}
            onAddNode={(type, at) => {
              const def = registry.nodeTypes.get(type);
              const params: Record<string, unknown> = {};
              for (const p of def?.params ?? []) params[p.id] = p.default;
              const id = makeId();
              commitInner({ nodes: [...editing.nodes, { id, type, x: at.x, y: at.y, params }], edges: editing.edges });
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
