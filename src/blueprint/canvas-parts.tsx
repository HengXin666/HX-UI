import type { JSX, ReactNode } from "react";
import { cn } from "../primitives/utils";
import type { BlueprintComment } from "./types";
import type { Viewport } from "./BlueprintCanvas";
export * from "./canvas-helpers";

/**
 * 画布的两块纯展示件。
 *
 * 单独成文件是因为 BlueprintCanvas.tsx 已被行预算**冻结且只许降** ——
 * 而这两块 (区间注释层、左上角工具条) 与画布的主逻辑 (拖拽/连线/缩放)
 * 没有任何纠缠, 搬出来既降行数也更清楚。
 */

/** 注释的语义色。只允许这四种 —— 放开任意颜色换肤时又会失效。 */
/**
 * 注释的语义色。
 *
 * ⚠️ 必须同时给 **背景** 与 **边框** —— 之前每组只有 border-* 与 text-*,
 * 没有任何 bg, 于是整个框体是**透明的**: 看起来就是"一个悬空的标题条 +
 * 一片空白", 完全不像一个框。注释框的意义是把一片节点**圈出来**,
 * 没有底色就圈不住任何东西。
 *
 * 用 /12 ~ /20 的低透明度: 要能透出下面的节点与连线, 又要有足够的色块
 * 让人一眼看出"这一片属于这个注释"。
 */
export const COMMENT_TONE: Record<string, string> = {
  /**
   * 透明度用 Tailwind 的标准档位 (10/20/25)。
   *
   * 别写 bg-primary/[0.14] 这种任意值 —— 实测它在本工程的 Tailwind 版本下
   * **不生成规则**, 而类名静默失效 (不报错, 但背景就没了)。这正是"框体
   * 看起来是空的"的另一种成因, 所以这里只用标准档。
   */
  default: "border-border bg-muted/25 text-muted-foreground",
  primary: "border-primary/50 bg-primary/10 text-primary",
  warning: "border-amber-500/50 bg-amber-500/10 text-amber-400",
  success: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
};

/**
 * 一个小按钮。
 *
 * 给 `href` 时渲染成原生锚点 (target=_blank) 而不是按钮 + window.open。
 *
 * 为什么: window.open 会被弹窗拦截器拦掉 (实测: 调了 window.open 但标签页
 * 数没变 —— 用户点"独立页面"毫无反应)。而点击链接是浏览器的原生导航意图,
 * 不会被拦。这是"打开新页面"唯一可靠的做法。
 */
export function CanvasButton({
  onClick, title, children, href, rel,
}: {
  readonly onClick?: () => void;
  readonly title?: string;
  readonly children: ReactNode;
  readonly href?: string;
  readonly rel?: string;
}): JSX.Element {
  const cls =
    "inline-flex items-center rounded border border-border bg-card/80 px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground";
  if (href) {
    return (
      <a href={href} target="_blank" rel={rel ?? "noopener noreferrer"} title={title} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} title={title} className={cls}>
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
        <div
          key={c.id}
          className={cn(
            "absolute flex flex-col overflow-hidden rounded-md border backdrop-blur-[1px]",
            "cursor-grab active:cursor-grabbing",
            COMMENT_TONE[c.tone ?? "default"]
          )}
          style={{ left: c.x, top: c.y, width: c.w, height: c.h }}
        >
          /* 分隔线用当前文字色的低透明版: border-current/20 不是标准
             Tailwind 语法, 会静默失效 (产物里没有这条规则且不报错)。 */
          <div className="flex h-[22px] shrink-0 items-center gap-1 border-b border-current px-2 opacity-90">
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
          {c.body ? (
            <div className="min-h-0 flex-1 overflow-hidden px-2 py-1 text-[11px] leading-snug opacity-80">
              {c.body}
            </div>
          ) : (
            <div className="min-h-0 flex-1" />
          )}
          {/*
            "框住了几个" —— 这条是注释与节点之间**看得见**的联系。
            没有它, 用户不知道拖动会带走什么, 于是要么不敢拖、要么拖错。
          */}
          {insideCount > 0 && (
            <div className="absolute bottom-1 right-1.5 rounded bg-card/90 px-1 text-[10px] tabular-nums opacity-80">
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
  toolbar, zoom, onFit, onReset, allowFullscreen, expanded, standaloneHref, onToggleFullscreen,
}: {
  readonly toolbar?: ReactNode;
  readonly zoom: number;
  readonly onFit: () => void;
  readonly onReset: () => void;
  readonly allowFullscreen: boolean;
  readonly expanded: boolean;
  /** 独立页面的 URL。给了就渲染成链接 (不会被弹窗拦截器拦)。 */
  readonly standaloneHref?: string;
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
            standaloneHref ? (
              <CanvasButton
                href={standaloneHref}
                title="在一个独立的整页画布里打开 (可多开, 改动实时同步)"
              >
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
