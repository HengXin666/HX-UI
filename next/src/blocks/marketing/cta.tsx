import type * as React from "react";
import { Reveal } from "@/motion/reveal";
import { cn } from "@/lib/utils";

/**
 * 收尾号召: 大标题 + 按钮, 不加光晕色块.
 * media 可放一张产品局部, 在右侧 / 下方露出.
 */
export function Cta({ title, description, actions, media, className }: {
  title: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
  media?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border-t px-5 py-24 md:px-8 md:py-32", className)}>
      <Reveal className={cn("mx-auto max-w-6xl", media && "grid items-center gap-12 lg:grid-cols-2")}>
        <div>
          <h2 className="max-w-2xl text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.035em] md:text-6xl">{title}</h2>
          {description && <p className="mt-6 max-w-lg text-pretty text-[17px] leading-relaxed text-muted-foreground">{description}</p>}
          {actions && <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3">{actions}</div>}
        </div>
        {media}
      </Reveal>
    </section>
  );
}
