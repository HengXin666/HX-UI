"use client";

import type { JSX } from "react";
import { Button } from "../primitives/button";
import { cn } from "../primitives/utils";
import type { HistoryApi } from "./history";

/**
 * 编辑器顶部的工具条。
 *
 * 单独成文件是因为 BlueprintEditor.tsx 被行预算**冻结且只许降** 
 * 而这块是纯展示 + 转发回调, 与编辑器的层级/同步逻辑没有纠缠。
 */

export interface Crumb {
  readonly id: string | null;
  readonly label: string;
}

export function EditorToolbar({
  breadcrumb, onNavigate, selectedIds, onCollapse, onCommentAround,
  onTidy, onTidyRest, history, onUndo, onRedo, pathLength, onExitSubgraph,
  onSave, onLoad, onSaveAs, onToggleHelp, helpOpen,
}: {
  readonly breadcrumb: readonly Crumb[];
  readonly onNavigate: (depth: number) => void;
  readonly selectedIds: readonly string[];
  readonly onCollapse: (ids: readonly string[], label: string) => void;
  readonly onCommentAround: (ids: readonly string[]) => void;
  readonly onTidy: () => void;
  readonly onTidyRest: (ids: readonly string[]) => void;
  readonly history: HistoryApi;
  readonly onUndo: () => void;
  readonly onRedo: () => void;
  readonly pathLength: number;
  readonly onExitSubgraph: () => void;
  /** 导出成 .bp.json 文件 (下载)。 */
  readonly onSave?: () => void;
  /** 从 .bp.json 文件导入。 */
  readonly onLoad?: () => void;
  /** 另存到… (File System Access, 可反复写回同一个文件)。 */
  readonly onSaveAs?: () => void;
  readonly onToggleHelp?: () => void;
  readonly helpOpen?: boolean;
}): JSX.Element {
  const hasSel = selectedIds.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* 层级导航: 在子图里时能退回上一层 */}
      {breadcrumb.map((b, i) => (
        <span key={b.id ?? "root"} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-[11px] text-muted-foreground">/</span>}
          <button
            type="button"
            onClick={() => onNavigate(i)}
            className={cn(
              "rounded px-1.5 py-0.5 text-[11px] transition-colors",
              i === breadcrumb.length - 1
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
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
        disabled={!hasSel}
        onClick={() => onCollapse(selectedIds, "子图")}
        title="把选中的节点折成一个节点 (可双击进入)"
      >
        折叠为子图
      </Button>
      <Button
        size="xs"
        variant="outline"
        disabled={!hasSel}
        onClick={() => onCommentAround(selectedIds)}
        title="给选中的节点加一个注释框"
      >
        加注释
      </Button>
      <Button
        size="xs"
        variant="outline"
        onClick={onTidy}
        title="按流向分层重排全部节点 (确定性: 同样的图永远得到同样的结果)"
      >
        整理布局
      </Button>
      <Button
        size="xs"
        variant="outline"
        disabled={!hasSel}
        onClick={() => onTidyRest(selectedIds)}
        title="重排其余节点, 选中的保持原位"
      >
        整理其余
      </Button>

      {/* 撤销 / 重做。拖动会合并成一步, 所以不会"撤一次只退 1px" */}
      <Button
        size="xs"
        variant="outline"
        disabled={!history.canUndo}
        onClick={onUndo}
        title={history.nextUndoLabel ? `撤销: ${history.nextUndoLabel} (⌘Z)` : "撤销 (⌘Z)"}
      >
        ↶ 撤销{history.depth.past ? ` ${history.depth.past}` : ""}
      </Button>
      <Button
        size="xs"
        variant="outline"
        disabled={!history.canRedo}
        onClick={onRedo}
        title={history.nextRedoLabel ? `重做: ${history.nextRedoLabel} (⌘⇧Z)` : "重做 (⌘⇧Z)"}
      >
        ↷ 重做{history.depth.future ? ` ${history.depth.future}` : ""}
      </Button>

      {/* 保存 / 加载。刻意在撤销之后  它们是"整张图"的操作,
          与上面的"选中项"操作不是一类。 */}
      {onSave && (
        <Button size="xs" variant="outline" onClick={onSave} title="导出成 .bp.json (就是一个 JSON, 可进 git diff)">
          导出
        </Button>
      )}
      {onLoad && (
        <Button size="xs" variant="outline" onClick={onLoad} title="从 .bp.json 导入">
          导入
        </Button>
      )}
      {onSaveAs && (
        <Button
          size="xs"
          variant="outline"
          onClick={onSaveAs}
          title="存到指定文件 (授权一次后可反复写回同一个文件; 不支持的浏览器退回下载)"
        >
          另存到…
        </Button>
      )}
      {onToggleHelp && (
        <Button
          size="xs"
          variant="outline"
          onClick={onToggleHelp}
          title="快捷键一览"
          className={cn(helpOpen && "border-primary/60 text-foreground")}
        >
          快捷键
        </Button>
      )}

      {pathLength > 0 && (
        <Button size="xs" variant="outline" className="ml-auto" onClick={onExitSubgraph}>
          展开并退出
        </Button>
      )}
    </div>
  );
}
