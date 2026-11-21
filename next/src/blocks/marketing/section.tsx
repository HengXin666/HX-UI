import type * as React from "react";
import { Reveal } from "@/motion/reveal";
import { cn } from "@/lib/utils";

/** 区块容器: 统一宽度与垂直节奏 + 标题组. */
export function Section({ id, eyebrow, title, description, align = "center", className, children }: {
  id?: string;
  eyebrow?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  align?: "center" | "left";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn("relative px-4 py-20 md:py-28", className)}>
      <div className="mx-auto max-w-6xl">
        {(title || eyebrow) && (
          <Reveal className={cn("mb-12 md:mb-16", align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl")}>
            {eyebrow && <div className="mb-3 text-sm font-medium text-brand">{eyebrow}</div>}
            {title && <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>}
            {description && <p className="mt-4 text-pretty text-muted-foreground md:text-lg">{description}</p>}
          </Reveal>
        )}
        {children}
      </div>
    </section>
  );
}
