import type * as React from "react";
import { cn } from "@/lib/utils";

/** 图表卡: 标题 / 说明 / 右上角操作 (时间范围切换等) + 图表本体. */
export function ChartCard({ title, description, actions, footer, className, children }: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("flex min-w-0 flex-col rounded-xl border bg-card p-4 shadow-soft sm:p-5", className)}>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-0.5">
          <h3 className="text-sm font-medium">{title}</h3>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </header>
      <div className="min-h-0 flex-1">{children}</div>
      {footer && <footer className="mt-4 border-t pt-3 text-xs text-muted-foreground">{footer}</footer>}
    </section>
  );
}
