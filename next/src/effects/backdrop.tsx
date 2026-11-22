import type * as React from "react";
import { cn } from "@/lib/utils";

interface BackdropProps {
  variant?: "grid" | "dots" | "aurora" | "glow";
  className?: string;
  /** 网格 / 点阵的间距, 像素 */
  size?: number;
}

/** 区块底纹. 只放在 absolute 层, 不吃交互; aurora 只用两块模糊色斑, 便宜. */
export function Backdrop({ variant = "grid", className, size }: BackdropProps) {
  if (variant === "aurora") {
    return (
      <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
        <div className="absolute -top-1/3 left-1/4 h-[60%] w-[60%] animate-aurora rounded-full bg-brand/25 blur-[100px]" />
        <div className="absolute -bottom-1/3 right-0 h-[55%] w-[50%] animate-aurora rounded-full bg-chart-2/20 blur-[110px] [animation-delay:-6s]" />
      </div>
    );
  }
  if (variant === "glow") {
    return (
      <div aria-hidden className={cn("pointer-events-none absolute inset-x-0 top-0 h-[480px] overflow-hidden", className)}>
        <div className="absolute left-1/2 top-[-240px] h-[480px] w-[880px] -translate-x-1/2 rounded-full bg-brand/20 blur-[120px]" />
      </div>
    );
  }
  return <div aria-hidden className={cn("pointer-events-none absolute inset-0 hx-fade-edges", variant === "grid" ? "hx-grid" : "hx-dots", className)} style={size ? ({ "--grid-size": `${size}px` } as React.CSSProperties) : undefined} />;
}
