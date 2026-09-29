import type { JSX, ReactNode } from "react";
import { cn } from "../primitives/utils";

/**
 * 页头: 标题 + 说明 + 右侧操作位。
 *
 * 两个下游面板各写了一份一模一样的 (gh-pool/Shell.tsx 与 ps-pool/Shell.tsx),
 * 字号、间距、断行行为逐年漂移。收进库里, 顺带定死两件事:
 *
 *   一、**标题与右操作的纵向基线对齐**。右操作区经常是按钮, 按钮比标题矮,
 *       用 items-start 会让按钮悬在标题上方; 这里用 items-center 对齐到整块的中线,
 *       有 desc 时视觉重心仍然落在标题行。
 *
 *   二、**标题不换行溢出**。长标题用 truncate, 而不是让它把右侧按钮挤到下一行 ——
 *       页面顶部一旦换行, 整页的纵向节奏就乱了。
 */
export interface PageHeaderProps {
  readonly title: ReactNode;
  readonly desc?: ReactNode;
  /** 右侧操作区 (按钮 / 分段控件 / 搜索框)。 */
  readonly right?: ReactNode;
  /** 标题下方的额外一行 (面包屑、标签等)。 */
  readonly extra?: ReactNode;
  readonly className?: string;
  /** 更小的标题档, 嵌在卡片或抽屉里时用。 */
  readonly compact?: boolean;
}

export function PageHeader({
  title,
  desc,
  right,
  extra,
  className,
  compact = false,
}: PageHeaderProps): JSX.Element {
  return (
    <div className={cn("flex items-start gap-3", compact ? "mb-3" : "mb-5", className)}>
      <div className="min-w-0 flex-1">
        <h1
          className={cn(
            "truncate font-bold leading-tight text-foreground",
            compact ? "text-[length:var(--fs-lg)]" : "text-[length:var(--fs-2xl)]",
          )}
        >
          {title}
        </h1>
        {desc ? (
          <p className="mt-0.5 text-[length:var(--fs-sm)] text-muted-foreground">{desc}</p>
        ) : null}
        {extra ? <div className="mt-1.5 flex items-center gap-2">{extra}</div> : null}
      </div>
      {right ? (
        <div
          className={cn(
            "flex shrink-0 items-center gap-2",
            desc ? "pt-0.5" : "self-center",
          )}
        >
          {right}
        </div>
      ) : null}
    </div>
  );
}