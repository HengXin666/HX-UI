"use client";

import { useState, type JSX } from "react";
import { cn } from "../primitives/utils";
import { Badge } from "../layout/Badge";
import { serializeGraph, toPseudoCode } from "./serialize";
import type { BlueprintGraph, BlueprintRegistry, ValidationIssue } from "./types";

/**
 * 底部的诊断区。
 *
 * 单独成文件是为了行预算 (BlueprintEditor.tsx 上限 250), 但拆得也有道理:
 * 它是**只读**的一块 —— 不产生任何改动, 只消费校验结果。与编辑器的状态
 * 机没有任何纠缠。
 *
 * 三块内容:
 *   1. 错误 / 警告条数 —— 一眼知道图能不能跑
 *   2. 问题列表 —— 点得到具体是哪条
 *   3. 生成物 (JSON + 伪代码) —— 确认图连对了没有
 */

export function BlueprintIssues({
  registry, graph, errors, warnings,
}: {
  readonly registry: BlueprintRegistry;
  readonly graph: BlueprintGraph;
  readonly errors: readonly ValidationIssue[];
  readonly warnings: readonly ValidationIssue[];
}): JSX.Element {
  const [showCode, setShowCode] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card/40">
      <div className="flex items-center gap-2 border-b border-border px-3 py-1.5">
        <span className="text-[12px] font-medium text-foreground">诊断</span>
        <Badge variant={errors.length ? "destructive" : "success"}>
          {errors.length ? `${errors.length} 个错误` : "通过"}
        </Badge>
        {warnings.length > 0 && <Badge variant="warning">{warnings.length} 个警告</Badge>}
        <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">
          {graph.nodes.length} 节点 / {graph.edges.length} 连线
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
          {JSON.stringify(serializeGraph(graph), null, 2)}
          {"\n\n// 伪代码\n"}
          {toPseudoCode(registry, graph)}
        </pre>
      )}
    </div>
  );
}
