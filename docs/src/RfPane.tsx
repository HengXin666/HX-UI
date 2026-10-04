"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type JSX } from "react";
import {
  BlueprintFlow, useHistory, validateGraph, createRegistry, autoLayout, applyLayout,
  addComment, type BlueprintGraph,
} from "@hx/ui";

/**
 * React Flow 版画布 (渐进替换中, 用 &rf=1 打开)。
 *
 * 单独成组件是因为 blueprint-main.tsx 撞到 250 行上限; 但拆得也合理 ——
 * 它是"另一种画布实现", 与上面的编辑器分支平级, 各自内聚。
 *
 * ## 撤销重做在哪
 *
 * **在外面**, 不在画布里。画布只管渲染与交互; 历史栈由这一层持有,
 * 因为"哪一步算一步"是应用语义 (拖动合并、连续输入参数合并)。
 *
 * 用 track(graph) 而不是手动 push: 受控模式下命令返回时 graph 还没更新,
 * 手动 push 的前后是同一份, 历史栈会一直是空的。
 */
export function RfPane({
  registry, graph, onChange,
}: {
  readonly registry: ReturnType<typeof createRegistry>;
  readonly graph: BlueprintGraph;
  readonly validation: ReturnType<typeof validateGraph>;
  readonly onChange: (g: BlueprintGraph) => void;
}): JSX.Element {
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const history = useHistory();
  const historyRef = useRef(history);
  historyRef.current = history;
  const pendingTag = useRef<{ tag: string | null; label?: string } | null>(null);

  /**
   * 图一变就记一步。
   *
   * 必须走 useEffect, 不能在 render 里比较: 撤销时我们会主动把旧图塞回去,
   * 那时 render 里的比较会把它当成"又变了一次"而再记一步, 撤销于是被
   * 自己记录的步骤抵消。effect 配合 history 内部的 seenRef 去重才对。
   */
  useEffect(() => {
    const t = pendingTag.current ?? undefined;
    pendingTag.current = null;
    historyRef.current.track(graph, t);
  }, [graph]);

  const v = useMemo(() => validateGraph(registry, graph), [registry, graph]);

  /**
   * 提交一份新图, 并声明这一步在历史里怎么记。
   *
   * tag 的默认值**不能**无条件覆盖已设好的 pendingTag: 移动时画布会先
   * 声明 tag="move", 紧接着的变化回调若用默认 tag=null 覆盖掉,
   * shouldCoalesce 就不会合并, 于是拖一次被拆成很多步撤销。
   * 所以外层声明过 tag 时保留它, 只在没声明时才用默认值。
   */
  const commit = useCallback(
    (next: BlueprintGraph, tag: string | null = null, label?: string) => {
      if (!pendingTag.current) pendingTag.current = { tag, ...(label ? { label } : {}) };
      onChange(next);
    },
    [onChange]
  );

  /** 改参数。合并成一步 (连续输入不该每敲一个字记一步)。 */
  const onParamChange = useCallback(
    (nodeId: string, key: string, value: unknown) => {
      pendingTag.current = { tag: "param", label: "改参数" };
      onChange({
        ...graph,
        nodes: graph.nodes.map((n) =>
          n.id === nodeId ? { ...n, params: { ...(n.params ?? {}), [key]: value } } : n
        ),
      });
    },
    [graph, onChange]
  );

  const undo = useCallback(() => {
    const g = historyRef.current.undo();
    if (g) onChange(g);
  }, [onChange]);

  const redo = useCallback(() => {
    const g = historyRef.current.redo();
    if (g) onChange(g);
  }, [onChange]);

  return (
    <div className="h-full rounded-xl border border-border">
      <BlueprintFlow
        registry={registry}
        graph={graph}
        validation={v}
        selected={selected}
        onSelect={setSelected}
        onGraphChange={(g) => commit(g)}
        onMoveKind={(kind) => { pendingTag.current = { tag: kind === "move" ? "move" : null }; }}
        onParamChange={onParamChange}
        onUndo={undo}
        onRedo={redo}
        /** 注释: 给选中的节点套一个框 (快捷键 C)。 */
        onComment={(ids) => {
          const box = boundsOf(graph, ids);
          if (box) commit(addComment(graph, box).graph, null, "加注释");
        }}
        onTidy={() => {
          const layout = autoLayout(registry, graph);
          commit(applyLayout(graph, layout), null, "整理布局");
        }}
        onRename={(id) => setRenamingId(id)}
        height="100%"
      />
    </div>
  );
}

/** 选中节点的包围盒 (给注释框用)。 */
function boundsOf(
  graph: BlueprintGraph,
  ids: readonly string[]
): { x: number; y: number; w: number; h: number } | null {
  const set = new Set(ids);
  const picked = graph.nodes.filter((n) => set.has(n.id));
  if (!picked.length) return null;
  const xs = picked.map((n) => n.x);
  const ys = picked.map((n) => n.y);
  const pad = 28;
  return {
    x: Math.min(...xs) - pad,
    y: Math.min(...ys) - pad,
    w: Math.max(...xs) - Math.min(...xs) + 220,
    h: Math.max(...ys) - Math.min(...ys) + 120,
  };
}
