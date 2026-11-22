import type * as React from "react";
import { Reveal } from "@/motion/reveal";
import { cn } from "@/lib/utils";

/** 发丝线交点上的十字标记, 用于分区线两端. 只在 xl 以上显示: 更窄时页面栏线贴边, 十字会撑出横向滚动 */
function Cross({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 11 11" className={cn("absolute hidden size-[11px] text-muted-foreground/60 xl:block", className)}>
      <path d="M5.5 0v11M0 5.5h11" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

/**
 * 区块容器: 统一宽度与垂直节奏 + 标题组.
 * - layout="stack": 标题在上 (默认); "split": 标题左侧吸顶, 内容在右, 适合 FAQ / 长说明.
 * - divider: 顶部发丝线 + 两端十字, 配合页面两侧竖线形成版式骨架.
 */
export function Section({ id, eyebrow, title, description, align = "left", layout = "stack", divider = false, className, children }: {
  id?: string;
  eyebrow?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  align?: "center" | "left";
  layout?: "stack" | "split";
  divider?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const head = (title || eyebrow) && (
    <Reveal className={cn(layout === "split" ? "md:sticky md:top-24 md:self-start" : "mb-12 md:mb-16", align === "center" && layout === "stack" ? "mx-auto max-w-2xl text-center" : "max-w-2xl")}>
      {eyebrow && <div className="mb-4 font-mono text-xs text-muted-foreground">{eyebrow}</div>}
      {title && <h2 className="text-balance text-3xl font-medium leading-[1.12] tracking-[-0.03em] md:text-[2.75rem]">{title}</h2>}
      {description && <p className="mt-5 max-w-xl text-pretty leading-relaxed text-muted-foreground md:text-[17px]">{description}</p>}
    </Reveal>
  );
  return (
    <section id={id} className={cn("relative scroll-mt-16 px-5 py-20 md:px-8 md:py-28", divider && "border-t", className)}>
      {divider && <><Cross className="-left-[6px] -top-[6px]" /><Cross className="-right-[6px] -top-[6px]" /></>}
      <div className={cn("mx-auto max-w-6xl", layout === "split" && "grid gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-16")}>
        {head}
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}
