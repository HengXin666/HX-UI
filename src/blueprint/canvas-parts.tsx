import type { JSX, ReactNode } from "react";
import { cn } from "../primitives/utils";
import type { BlueprintComment, BlueprintGraph, BlueprintRegistry } from "./types";
import type { Viewport } from "./BlueprintCanvas";
import { nodeHeight, nodeWidth } from "./geometry";

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
  comments, view, editingId, onEdit, onChange, countInside, draft, draftCount = 0,
}: {
  readonly comments: readonly BlueprintComment[] | undefined;
  readonly view: Viewport;
  readonly editingId: string | null;
  readonly onEdit: (id: string | null) => void;
  readonly onChange?: (id: string, patch: { title?: string }) => void;
  /** 算某个注释完全框住了几个节点。由外层提供 (需要 registry)。 */
  readonly countInside?: (commentId: string) => number;
  /** 正在拖出来的框 (有值就画虚线预览 + 底部提示)。 */
  readonly draft?: { x: number; y: number; w: number; h: number } | null;
  readonly draftCount?: number;
}): JSX.Element {
  return (
    <div
      className="absolute left-0 top-0 origin-top-left"
      style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`, width: 0, height: 0 }}
    >
      {draft && (
        <div
          className="absolute rounded-md border border-dashed border-primary/70 bg-primary/5"
          style={{ left: draft.x, top: draft.y, width: draft.w, height: draft.h }}
        >
          <div className="absolute -top-5 left-0 whitespace-nowrap rounded bg-card px-1.5 py-0.5 text-[10px] text-muted-foreground">
            新注释{draftCount > 0 ? ` · 框住 ${draftCount} 个节点` : ""}
          </div>
        </div>
      )}
      {(comments ?? []).map((c) => {
        const insideCount = countInside?.(c.id) ?? 0;
        return (
        <div key={c.id} className="absolute" style={{ left: c.x, top: c.y, width: c.w, height: c.h }}>
          <div
            className={cn(
              "flex h-[22px] items-center gap-1 rounded-t-md border-b px-2 cursor-grab active:cursor-grabbing",
              COMMENT_TONE[c.tone ?? "default"]
            )}
          >
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
          {/*
            "框住了几个" —— 这条是注释与节点之间**看得见**的联系。
            没有它, 用户不知道拖动会带走什么, 于是要么不敢拖、要么拖错。
          */}
          {insideCount > 0 && (
            <div className="absolute bottom-1 right-1.5 rounded bg-background/70 px-1 text-[10px] tabular-nums opacity-70">
              {insideCount} 个节点{c.moveWithNodes === false ? " (不跟随)" : ""}
            </div>
          )}
        </div>
        );
      })}
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

/**
 * 画布的辅助函数。
 *
 * 单独成文件是因为 BlueprintCanvas.tsx 已被行预算冻结且只许降 ——
 * 这些是独立的小函数, 与主流程没有纠缠。
 */

/** 命中注释的**整个框** (不只是标题条)。倒序: 后加的在上面。 */
/** reason -> 人话。UI 靠 reason 而不是 message: message 是英文的。 */
export function reasonText(reason?: string): string {
  switch (reason) {
    case "type-mismatch": return "类型不匹配";
    case "self-loop": return "不能连回自己";
    case "duplicate": return "已经连过了";
    case "occupied": return "该输入口已占用";
    case "direction": return "执行流与数据流不能互连";
    case "missing-port": return "端口不存在";
    default: return "不能这样连";
  }
}

/** 命中注释的**整个框**。倒序: 后加的在上面。 */
export function hitComment(
  comments: readonly { id: string; x: number; y: number; w: number; h: number }[] | undefined,
  p: { x: number; y: number }
): { id: string; x: number; y: number } | undefined {
  if (!comments) return undefined;
  for (let i = comments.length - 1; i >= 0; i--) {
    const c = comments[i];
    if (p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h) {
      return { id: c.id, x: c.x, y: c.y };
    }
  }
  return undefined;
}

/** 把拖拽的两点归一成矩形。 */
export function normRect(r: { x0: number; y0: number; x1: number; y1: number }) {
  return {
    x: Math.min(r.x0, r.x1),
    y: Math.min(r.y0, r.y1),
    w: Math.abs(r.x1 - r.x0),
    h: Math.abs(r.y1 - r.y0),
  };
}

/** 完全落在矩形里的节点 —— 与"拖动会带走哪些"同一判据。 */
export function containedIds(
  reg: BlueprintRegistry,
  graph: Pick<BlueprintGraph, "nodes">,
  box: { x: number; y: number; w: number; h: number }
): string[] {
  return graph.nodes
    .filter((n) => {
      const w = nodeWidth(reg, n);
      const h = nodeHeight(reg, n);
      return n.x >= box.x && n.y >= box.y && n.x + w <= box.x + box.w && n.y + h <= box.y + box.h;
    })
    .map((n) => n.id);
}

const COMMENT_BAR_H = 22;


