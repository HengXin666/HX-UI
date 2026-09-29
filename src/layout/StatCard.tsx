import type { JSX, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../primitives/utils";
import { Card, CardContent } from "./Card";

/**
 * 统计卡: 一个数 + 它的名字。
 *
 * 语气色 (tone) 的**全部**用途是"这个数说明好还是坏", 不是装饰。
 * 因此只有五档, 且默认档不染色 —— 大多数指标本身没有好坏, 硬染色会让整页都在喊。
 *
 * 数字用 tabular-nums: 等宽数字, 轮询刷新时位数变化不会让整块面板左右抖。
 * 这一点在手写版本里几乎总被漏掉, 而它恰好是"数据面板看起来专业还是业余"的分水岭。
 */
const statValueVariants = cva("mt-0.5 text-[length:var(--fs-3xl)] font-semibold leading-none tabular-nums", {
  variants: {
    tone: {
      default: "text-foreground",
      good: "text-emerald-400",
      bad: "text-destructive",
      muted: "text-muted-foreground",
      accent: "text-primary",
    },
  },
  defaultVariants: { tone: "default" },
});

export type StatTone = "default" | "good" | "bad" | "muted" | "accent";

export interface StatCardProps
  extends Omit<React.ComponentPropsWithoutRef<"div">, "children"> {
  readonly label: ReactNode;
  readonly value: ReactNode;
  readonly hint?: ReactNode;
  /** 图标类名 (iconify, 例如 icon-[solar--users-group-rounded-linear])。 */
  readonly icon?: string;
  readonly tone?: StatTone;
  /** 右上角小徽章之类的补充信息。 */
  readonly extra?: ReactNode;
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
  extra,
  className,
  ...props
}: StatCardProps): JSX.Element {
  return (
    <Card className={className} {...props}>
      <CardContent className="pt-3">
        <div className="flex items-start gap-2.5">
          {icon ? (
            <span
              aria-hidden
              className={cn(icon, "mt-0.5 size-4 shrink-0 bg-current", statValueVariants({ tone }))}
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <div className="truncate text-[length:var(--fs-xs)] leading-tight text-muted-foreground">{label}</div>
              {extra ? <div className="ml-auto shrink-0">{extra}</div> : null}
            </div>
            <div className={statValueVariants({ tone })}>{value}</div>
            {hint ? (
              <div className="mt-1 truncate text-[length:var(--fs-2xs)] text-muted-foreground/80">{hint}</div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 指标栅格。手写时每个页面都在写 same 的 grid-cols-4 + gap-2 且断点写法每次不一样,
 * 这里固定四档: 2 / 3 / 4 / 5 列 (窄屏一律先掉到 2 列)。
 */
export function StatGrid({
  columns = 4,
  className,
  children,
}: {
  columns?: 2 | 3 | 4 | 5;
  className?: string;
  children: ReactNode;
}): JSX.Element {
  const cols = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
    5: "sm:grid-cols-2 lg:grid-cols-5",
  }[columns];
  return <div className={cn("grid grid-cols-1 gap-2", cols, className)}>{children}</div>;
}

export { statValueVariants };