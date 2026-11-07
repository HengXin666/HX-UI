"use client";

import { useEffect, useRef, type JSX, type PointerEvent, type ReactNode } from "react";
import { useTrack } from "../use-track";
import { SPRING_THUMB } from "../tokens";

const PANEL = 320;
const DISMISS_AT = 96;
const FLING = 400;

/**
 * 抽屉. 进场和拖拽共用一条弹簧. 松手时把当前速度交给关闭或回弹.
 */
export function CraftDrawer({
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
  const x = useTrack(PANEL, SPRING_THUMB);
  const drag = useRef({ active: false, lastX: 0, lastT: 0, velocity: 0 });

  useEffect(() => {
    x.setTarget(open ? 0 : PANEL);
  }, [open, x.setTarget]);

  const onDown = (event: PointerEvent<HTMLDivElement>): void => {
    drag.current = { active: true, lastX: event.clientX, lastT: performance.now(), velocity: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onMove = (event: PointerEvent<HTMLDivElement>): void => {
    if (!drag.current.active) return;
    const now = performance.now();
    const dt = Math.max(8, now - drag.current.lastT);
    const dx = event.clientX - drag.current.lastX;
    drag.current.velocity = (dx / dt) * 1000;
    x.setCurrent(Math.max(0, x.value + dx), drag.current.velocity);
    drag.current.lastX = event.clientX;
    drag.current.lastT = now;
  };

  const onUp = (): void => {
    if (!drag.current.active) return;
    drag.current.active = false;
    if (x.value > DISMISS_AT || drag.current.velocity > FLING) {
      x.setTarget(PANEL, drag.current.velocity);
      onOpenChange(false);
      return;
    }
    x.setTarget(0, drag.current.velocity);
  };

  if (!open && x.value >= PANEL - 2) return null;

  return (
    <div className="fixed inset-0 z-40">
      <button type="button" aria-label="关闭抽屉" className="absolute inset-0 bg-background/60" style={{ opacity: 1 - x.value / PANEL }} onClick={() => onOpenChange(false)} />
      <div
        role="dialog"
        aria-label={title}
        className="absolute inset-y-0 right-0 w-80 border-l border-border bg-popover p-4 shadow-md"
        style={{ transform: `translate3d(${x.value}px, 0, 0)` }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <div className="mb-3 h-1 w-10 rounded-full bg-border" />
        <h2 className="text-base text-foreground">{title}</h2>
        <div className="mt-3 text-sm text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}
