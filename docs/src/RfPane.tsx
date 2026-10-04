"use client";

import type { JSX } from "react";
import { BlueprintFlow, createRegistry, validateGraph, type BlueprintGraph } from "@hx/ui";

/**
 * React Flow 版画布 (渐进替换中, 用 &rf=1 打开)。
 *
 * 单独成组件是因为 blueprint-main.tsx 撞到 250 行上限; 但拆得也合理 ——
 * 它是"另一种画布实现", 与上面的编辑器分支平级, 各自内聚。
 */
export function RfPane({
  registry, graph, validation, onChange,
}: {
  readonly registry: ReturnType<typeof createRegistry>;
  readonly graph: BlueprintGraph;
  readonly validation: ReturnType<typeof validateGraph>;
  readonly onChange: (g: BlueprintGraph) => void;
}): JSX.Element {
  return (
    <div className="h-full rounded-xl border border-border">
      <BlueprintFlow registry={registry} graph={graph} validation={validation} onGraphChange={onChange} height="100%" />
    </div>
  );
}

