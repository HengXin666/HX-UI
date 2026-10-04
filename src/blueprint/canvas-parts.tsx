import type { JSX, ReactNode } from "react";
import { cn } from "../primitives/utils";
import type { BlueprintComment } from "./types";
import type { Viewport } from "./BlueprintCanvas";

/**
 * 画布的两块纯展示件。
 *
 * 单独成文件是因为 BlueprintCanvas.tsx 已被行预算**冻结且只许降** ——
 * 而这两块 (区间注释层、左上角工具条) 与画布的主逻辑 (拖拽/连线/缩放)
 * 没有任何纠缠, 搬出来既降行数也更清楚。
 */

/** 注释的语义色。只允许这四种 —— 放开任意颜色换肤时又会失效。 */
export const COMMENT_TONE: Record<string, string> = {
  default: "border-border/60 bg-muted/40 text-muted-foreground",
  primary: "border-primary/40 bg-primary/10 text-primary",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
};

/** 一个小按钮。 */
export function CanvasButton({
  onClick, title, children,
}: { readonly onClick: () => void; readonly title?: string; readonly children: ReactNode }): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="rounded border border-border bg-card/80 px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
    >
      {children}
    </button>
  );
}


/** 区间注释层。 */
export function CommentLayer({
  comments, view, editingId, onEdit, onChange,
}: {
  readonly comments: readonly BlueprintComment[] | undefined;
  readonly view: Viewport;
  readonly editingId: string | null;
  readonly onEdit: (id: string | null) => void;
  readonly onChange?: (id: string, patch: { title?: string }) => void;
}): JSX.Element {
  return (
    <div
      className="absolute left-0 top-0 origin-top-left"
      style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`, width: 0, height: 0 }}
    >
      {(comments ?? []).map((c) => (
        <div key={c.id} className="absolute" style={{ left: c.x, top: c.y, width: c.w, height: c.h }}>
          <div className={cn("flex h-[22px] items-center gap-1 rounded-t-md border-b px-2", COMMENT_TONE[c.tone ?? "default"])}>
            {editingId === c.id ? (
              <input
                autoFocus
                defaultValue={c.title ?? ""}
                className="min-w-0 flex-1 bg-transparent text-[11px] font-medium outline-none"
                onBlur={(e) => { onChange?.(c.id, { title: e.target.value }); onEdit(null); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  if (e.key === "Escape") onEdit(null);
                }}
              />
            ) : (
              <span className="min-w-0 flex-1 truncate text-[11px] font-medium" onDoubleClick={() => onEdit(c.id)}>
                {c.title || "注释"}
              </span>
            )}
          </div>
          {c.body ? <div className="px-2 py-1 text-[11px] leading-snug opacity-80">{c.body}</div> : null}
        </div>
      ))}
    </div>
  );
}


/** 左上角工具条。单独成组件: 画布文件冻结只许降行数, 这块是纯展示。 */
export function CanvasToolbar({
  toolbar, zoom, onFit, onReset, allowFullscreen, expanded, onOpenStandalone, onToggleFullscreen,
}: {
  readonly toolbar?: ReactNode;
  readonly zoom: number;
  readonly onFit: () => void;
  readonly onReset: () => void;
  readonly allowFullscreen: boolean;
  readonly expanded: boolean;
  readonly onOpenStandalone?: () => void;
  readonly onToggleFullscreen: () => void;
}): JSX.Element {
  return (
    <div className="absolute left-2 top-2 flex items-center gap-1">
      {toolbar ?? (
        <>
          <CanvasButton onClick={onFit} title="缩放到适应">适应</CanvasButton>
          <CanvasButton onClick={onReset} title="重置视图">1:1</CanvasButton>
          <span className="px-1 text-[11px] tabular-nums text-muted-foreground">{Math.round(zoom * 100)}%</span>
          {allowFullscreen && (
            onOpenStandalone ? (
              <CanvasButton onClick={onOpenStandalone} title="在一个独立的整页画布里打开 (可多开, 改动实时同步)">
                独立页面
              </CanvasButton>
            ) : (
              <CanvasButton onClick={onToggleFullscreen} title={expanded ? "退出全屏 (Esc)" : "全屏"}>
                {expanded ? "退出全屏" : "全屏"}
              </CanvasButton>
            )
          )}
        </>
      )}
    </div>
  );
}

