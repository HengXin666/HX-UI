"use client";

import { useEffect, type JSX, type ReactNode } from "react";
import { useTrack } from "../use-track";
import { SPRING_THUMB } from "../tokens";

/**
 * 对话框. 遮罩和面板共用进度. Esc 在打开途中从当前进度反向关闭.
 */
export function CraftDialog({
  open,
  onOpenChange,
  title,
  children,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title: string;
  readonly children: ReactNode;
}): JSX.Element | null {
  const progress = useTrack(0, SPRING_THUMB);

  useEffect(() => {
    progress.setTarget(open ? 1 : 0);
  }, [open, progress.setTarget]);

  useEffect(() => {
    if (!open && progress.value === 0) return;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange, progress.value]);

  if (!open && progress.value < 0.02) return null;
  const t = progress.value;

  return (
    <div className="fixed inset-0 z-40 grid place-items-center">
      <button type="button" aria-label="关闭对话框" className="absolute inset-0 bg-background/60" style={{ opacity: t }} onClick={() => onOpenChange(false)} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-[min(28rem,calc(100%-2rem))] rounded-xl border border-border bg-popover p-5 shadow-md"
        style={{ opacity: t, transform: `translate3d(0, ${(1 - t) * 8}px, 0) scale(${0.98 + t * 0.02})` }}
      >
        <h2 className="text-lg text-foreground">{title}</h2>
        <div className="mt-2 text-sm text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}
