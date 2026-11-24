"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** 指针跟随光斑卡片. 只写两个 CSS 变量, 不触发 React 重渲染. */
export interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 光斑颜色, 任意 CSS 颜色; 默认品牌色淡版 */
  color?: string;
  /** 光斑直径, 像素 */
  size?: number;
}

export function SpotlightCard({ className, children, color, size = 420, style, ...rest }: SpotlightCardProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerEnter={() => ref.current?.style.setProperty("--spot-opacity", "1")}
      onPointerLeave={() => ref.current?.style.setProperty("--spot-opacity", "0")}
      style={{ "--spot-size": `${size}px`, ...(color ? { "--spot-color": color } : {}), ...style } as React.CSSProperties}
      className={cn("hx-spotlight relative overflow-hidden rounded-xl border bg-card text-card-foreground", className)}
      {...rest}
    >
      {children}
    </div>
  );
}
