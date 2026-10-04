"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type JSX } from "react";
import {
  BlueprintFlow, useHistory, validateGraph, createRegistry, type BlueprintGraph,
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
 * 手动 push 的前后是同一份, 栈永远是空的 (这个坑在手写版踩过,
 * 表现是撤销按钮一直 disabled)。
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
  const history = useHistory();
  const historyRef = useRef(history);
  historyRef.current = history;
  const pendingTag = useRef<{ tag: string | null; label?: string } | null>(null);

  /**
   * 图一变就记一步。
   *
   * ⚠️ 必须走 useEffect, 不能在 render 里手写 `if (ref !== graph)`:
   *    撤销时我们主动把旧图塞回去, 那时 render 里的比较会把它当成
   *    "又变了一次"而再记一步 —— 于是撤销被自己记录的步骤抵消,
   *    表现为"按了 Ctrl+Z 数字纹丝不动"。实测踩到过。
   *    effect 配合 history 内部的 seenRef 去重才是对的。
   */
  useEffect(() => {
    const t = pendingTag.current ?? undefined;
    pendingTag.current = null;
    historyRef.current.track(graph, t);
  }, [graph]);

  const v = useMemo(() => validateGraph(registry, graph), [registry, graph]);

  const commit = useCallback(
    (next: BlueprintGraph, tag: string | null = null, label?: string) => {
      pendingTag.current = { tag, ...(label ? { label } : {}) };
      onChange(next);
    },
    [onChange]
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
        onUndo={undo}
        onRedo={redo}
        height="100%"
      />
    </div>
  );
}
