import * as React from "react";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

/** 主 CTA: 品牌色底 + 流光 + 按压缩放. 一页最多一两个. */
export function ShimmerButton({ className, asChild, children, type, ...rest }: ShimmerButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      {...(asChild ? {} : { type: type ?? "button" })}
      className={cn(
        "group relative inline-flex h-11 items-center justify-center gap-2 overflow-hidden rounded-full bg-brand px-6 text-sm font-medium text-brand-foreground",
        "shadow-[0_8px_24px_-8px_var(--brand)] transition-[transform,box-shadow] duration-200 ease-out hover:shadow-[0_12px_32px_-8px_var(--brand)] active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/40",
        className,
      )}
      {...rest}
    >
      <span
        aria-hidden
        className="absolute inset-0 animate-shimmer bg-[linear-gradient(110deg,transparent_35%,oklch(1_0_0/0.35)_50%,transparent_65%)] bg-[length:200%_100%]"
      />
      <span className="relative inline-flex items-center gap-2">{children}</span>
    </Comp>
  );
}
