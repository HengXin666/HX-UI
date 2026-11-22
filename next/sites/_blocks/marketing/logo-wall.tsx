import type * as React from "react";
import { cn } from "@/lib/utils";

/** 客户标识墙: 静态网格, 发丝线分格, 单色. 比跑马灯更克制, 也更容易看清. */
export function LogoWall({ label, logos, className }: { label?: React.ReactNode; logos: React.ReactNode[]; className?: string }) {
  return (
    <div className={cn("px-5 md:px-8", className)}>
      <div className="mx-auto max-w-6xl">
        {label && <p className="mb-8 text-sm text-muted-foreground">{label}</p>}
        <div className="grid grid-cols-2 gap-px overflow-hidden border-y bg-border sm:grid-cols-4">
          {logos.map((l, i) => (
            <div key={i} className="flex h-20 items-center justify-center bg-background text-muted-foreground transition-colors hover:text-foreground md:h-24">{l}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
