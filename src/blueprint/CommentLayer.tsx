import { useState, type JSX } from "react";
import { cn } from "../primitives/utils";
import type { BlueprintComment } from "./types";
import type { Viewport } from "./BlueprintCanvas";
import { COMMENT_TONE, COMMENT_TONES, type CommentToneId } from "./canvas-parts";

/**
 * 区间注释层。
 *
 * 单独成文件: canvas-parts 超了 tsx 行上限, 而注释层是最独立的一块
 * (自成一体的渲染 + 它自己的指针交互)。
 */

/** 区间注释层。 */
export function CommentLayer({
  comments, view, editingId, onEdit, onChange, countInside, draft, draftCount = 0,
  onResize, onResizeStateChange, onChangeTone,
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
  /** 右下角拖拽改尺寸 (UE5 的行为)。给了才画把手。 */
  readonly onResize?: (id: string, box: { x: number; y: number; w: number; h: number }) => void;
  /** 开始/结束拖把手。外层据此暂停画布的框选与平移。 */
  readonly onResizeStateChange?: (active: boolean) => void;
  /**
   * 换底色 (UE5 的 Comment Color)。
   *
   * UE5 放在 Details 面板里改; 这里做成标题条上的一个色块按钮 ——
   * 面板要滚到下面找, 而换色是高频的视觉整理动作, 就地改更顺手。
   */
  readonly onChangeTone?: (id: string, tone: CommentToneId) => void;
}): JSX.Element {
  /** 正在选颜色的注释 id。 */
  const [picking, setPicking] = useState<string | null>(null);
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
            COMMENT_TONE[c.tone ?? "default"].bg,
            COMMENT_TONE[c.tone ?? "default"].fg
          )}
          style={{ left: c.x, top: c.y, width: c.w, height: c.h }}
        >
          /* 分隔线用当前文字色的低透明版: border-current/20 不是标准
             Tailwind 语法, 会静默失效 (产物里没有这条规则且不报错)。 */
          <div className={cn("flex h-[22px] shrink-0 items-center gap-1 border-b border-bp-node-border px-2", COMMENT_TONE[c.tone ?? "default"].bar)}>
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

            {/*
              取色按钮 (UE5 的 Comment Color)。放在标题条右侧 ——
              它是这一块的分类标记, 换色是高频动作, 不该藏进右键菜单。
              onPointerDown 拦住, 否则点它会被当成"开始拖标题条"。
            */}
            {onChangeTone && (
              <button
                type="button"
                onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                onClick={(e) => { e.stopPropagation(); setPicking(picking === c.id ? null : c.id); }}
                title="注释底色"
                aria-label="注释底色"
                className="grid size-4 shrink-0 place-items-center rounded-sm border border-current/40 opacity-70 transition-opacity hover:opacity-100"
              >
                <span className="block size-2 rounded-[2px] bg-current" />
              </button>
            )}
          </div>

          {picking === c.id && onChangeTone && (
            <div className="flex shrink-0 items-center gap-1 border-b border-current/30 px-2 py-1">
              {COMMENT_TONES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                  onClick={(e) => { e.stopPropagation(); onChangeTone(c.id, t); setPicking(null); }}
                  title={t}
                  aria-label={t}
                  className={cn(
                    "size-3.5 rounded-sm border transition-transform hover:scale-110",
                    COMMENT_TONE[t].bg,
                    (c.tone ?? "default") === t && "ring-1 ring-current"
                  )}
                />
              ))}
            </div>
          )}
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
          {/*
            右下角 resize 把手 —— UE5 就是拖这个角改大小。
            没有它, 注释的尺寸只能靠"创建时框多大就是多大", 完全没法调。
          */}
          {onResize && (
            <div
              role="presentation"
              title="拖拽调整大小"
              ref={(el) => {
                /**
                 * 用**原生 capture 阶段**监听, 不用 React 的 onPointerDown。
                 *
                 * 为什么: 画布自己也在这棵树上监听 pointerdown (用于拖注释/框选),
                 * 并且对画布元素调 setPointerCapture —— 那会**抢走**指针,
                 * 把手上的后续 pointermove 就再也收不到 (实测: 把手收到 0 个事件,
                 * 拖动完全没反应)。
                 *
                 * capture 阶段先于冒泡, 于是在画布之前拿到事件; 再 stopPropagation
                 * 就把它彻底截住, 画布不会误入拖拽分支。
                 */
                if (!el) return;
                el.onpointerdown = (e: PointerEvent) => {
                  e.stopPropagation();
                  e.preventDefault();
                  const startX = e.clientX;
                  const startY = e.clientY;
                  const w0 = c.w;
                  const h0 = c.h;
                  onResizeStateChange?.(true);
                  const onMove = (ev: PointerEvent) => {
                    // 除以缩放: 屏幕位移要换算回图坐标, 否则缩放后把手"跑得比鼠标快"
                    const k = view.zoom || 1;
                    onResize(c.id, {
                      x: c.x, y: c.y,
                      w: Math.max(60, w0 + (ev.clientX - startX) / k),
                      h: Math.max(40, h0 + (ev.clientY - startY) / k),
                    });
                  };
                  const onUp = () => {
                    onResizeStateChange?.(false);
                    window.removeEventListener("pointermove", onMove);
                    window.removeEventListener("pointerup", onUp);
                  };
                  window.addEventListener("pointermove", onMove);
                  window.addEventListener("pointerup", onUp);
                };
              }}
              className="absolute bottom-0 right-0 z-10 size-3 cursor-nwse-resize"
            >
              {/* 三道斜线, 一眼看出是"可拖" */}
              <svg viewBox="0 0 12 12" className="size-3 opacity-50">
                <path d="M11 5 L5 11 M11 9 L9 11" stroke="currentColor" strokeWidth="1" fill="none" />
              </svg>
            </div>
          )}

          {/* 计数放左下角: 右下角被 resize 把手占着, 两个都在那儿会互相盖住 */}
          {insideCount > 0 && (
            <div className="absolute bottom-1 left-1.5 rounded bg-card/90 px-1 text-[10px] tabular-nums opacity-80">
              {insideCount} 个节点{c.moveWithNodes === false ? " (不跟随)" : ""}
            </div>
          )}
        </div>
        );
      })}
    </div>
  );
}
