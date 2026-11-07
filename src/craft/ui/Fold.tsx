"use client";

import { useEffect, useRef, useState, type JSX, type ReactNode } from "react";
import { useTrack } from "../use-track";
import { SPRING_THUMB } from "../tokens";

/**
 * 折叠. 高度走弹簧, 中途再点从当前高度反向, 不用关键帧跳切.
 */
export function CraftFold({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const height = useTrack(0, SPRING_THUMB);
  const inner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const next = open ? inner.current?.scrollHeight ?? 0 : 0;
    height.setTarget(next);
  }, [open, height.setTarget, children]);

  return (
    <div className="border-b border-border">
      <button
        type="button"
        aria-expanded={open}
        className="flex h-10 w-full items-center justify-between text-left text-sm text-foreground"
        onClick={() => setOpen((prev) => !prev)}
      >
        {title}
        <span aria-hidden style={{ transform: `rotate(${open ? 180 : 0}deg) translateY(-0.5px)` }}>v</span>
      </button>
      <div className="overflow-hidden" style={{ height: height.value }}>
        <div ref={inner} className="pb-3 text-sm text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}
