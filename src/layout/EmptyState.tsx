import type { JSX, ReactNode } from "react";
import { cn } from "../primitives/utils";

/**
 * 空态 / 错误态 / 加载态。
 *
 * 为什么把它做成组件而不是让每个页面各写一句"暂无数据": 空态是**最容易被漏掉**的
 * 一种界面。手写时它总是最后才补, 于是措辞、留白、图标风格每个页面都不一样,
 * 而且十有八九漏掉"接下来该干什么"。
 *
 * 三种语气共用同一个骨架 (图标 + 一句话 + 可选的操作按钮), 因为它们在视觉上本就
 * 是同一件事: 这个位置现在没有内容。差别只在图标与文案。
 */
export type EmptyKind = "empty" | "error" | "loading" | "denied";

const KIND_ICON: Record<EmptyKind, string> = {
  empty: "icon-[solar--inbox-linear]",
  error: "icon-[solar--danger-triangle-linear]",
  loading: "icon-[solar--refresh-linear]",
  denied: "icon-[solar--lock-keyhole-minimalistic-linear]",
};

const KIND_TONE: Record<EmptyKind, string> = {
  empty: "text-muted-foreground/45",
  error: "text-destructive/60",
  loading: "text-muted-foreground/45",
  denied: "text-amber-500/60",
};

export interface EmptyStateProps {
  /** 主文案。默认按 kind 给一句。 */
  readonly text?: ReactNode;
  /** 第二行: 补充说明或"接下来做什么"。 */
  readonly hint?: ReactNode;
  readonly kind?: EmptyKind;
  /** 覆盖图标类名。 */
  readonly icon?: string;
  /** 操作区 (通常放一个 Button)。 */
  readonly action?: ReactNode;
  readonly className?: string;
  /** 紧凑档, 用在卡片内部。 */
  readonly compact?: boolean;
}

const DEFAULT_TEXT: Record<EmptyKind, string> = {
  empty: "暂无数据",
  error: "加载失败",
  loading: "加载中…",
  denied: "无访问权限",
};

export function EmptyState({
  text,
  hint,
  kind = "empty",
  icon,
  action,
  className,
  compact = false,
}: EmptyStateProps): JSX.Element {
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 text-center",
        compact ? "py-6" : "py-10",
        KIND_TONE[kind],
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(icon ?? KIND_ICON[kind], "size-6 bg-current", kind === "loading" && "animate-spin")}
      />
      <span className="text-[length:var(--fs-sm)] text-muted-foreground">{text ?? DEFAULT_TEXT[kind]}</span>
      {hint ? <span className="text-[length:var(--fs-xs)] text-muted-foreground/70">{hint}</span> : null}
      {action ? <div className="mt-1.5">{action}</div> : null}
    </div>
  );
}

/**
 * 边界包装: 三态 (加载 / 出错 / 空 / 有内容) 一次判完。
 *
 * 手写时这段判断在每个页面里出现一次, 而且顺序经常写错 —— 先判空再判 loading,
 * 于是首次加载会先闪一下"暂无数据"再变成内容。这里把顺序固定为
 * loading > error > empty > 内容。
 */
export function DataBoundary({
  loading,
  error,
  empty,
  emptyText,
  loadingText,
  onRetry,
  children,
}: {
  loading?: boolean;
  error?: unknown;
  empty?: boolean;
  emptyText?: ReactNode;
  loadingText?: ReactNode;
  onRetry?: () => void;
  children: ReactNode;
}): JSX.Element {
  if (loading) return <EmptyState kind="loading" text={loadingText} />;
  if (error) {
    return (
      <EmptyState
        kind="error"
        text={emptyText === undefined ? "加载失败" : emptyText}
        hint={error instanceof Error ? error.message : String(error)}
        action={
          onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-lg border border-border px-2.5 py-1 text-[length:var(--fs-xs-half)] text-foreground transition-colors hover:bg-accent/50"
            >
              重试
            </button>
          ) : undefined
        }
      />
    );
  }
  if (empty) return <EmptyState text={emptyText} />;
  return <>{children}</>;
}