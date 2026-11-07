"use client";

import { useEffect, useState, type JSX, type ReactNode } from "react";
import { useTrack } from "../use-track";
import { SPRING_THUMB, TOOLTIP_DELAY_MS } from "../tokens";

const TOP = "top";
const BOTTOM = "bottom";

/**
 * 提示. 显示延迟 400ms, 离开 80ms. 同组里换触发器只改目标, 不重播入场.
 */
export function CraftTip({
  label,
  side = TOP,
  children,
}: {
  readonly label: string;
  readonly side?: "top" | "bottom";
  readonly children: ReactNode;
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const show = useTrack(0, SPRING_THUMB);
  const y = side === TOP ? -1 : 1;

  useEffect(() => {
    let timer = 0;
    if (open) timer = window.setTimeout(() => show.setTarget(1), TOOLTIP_DELAY_MS);
    else timer = window.setTimeout(() => show.setTarget(0), 80);
    return () => window.clearTimeout(timer);
  }, [open, show.setTarget]);

  const t = show.value;

  return (
    <span className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-foreground px-2 py-1 text-xs text-background"
        style={{
          top: side === BOTTOM ? "100%" : undefined,
          bottom: side === TOP ? "100%" : undefined,
          opacity: t,
          transform: `translate3d(-50%, ${y * (1 - t) * 4}px, 0)`,
        }}
      >
        {label}
      </span>
    </span>
  );
}
