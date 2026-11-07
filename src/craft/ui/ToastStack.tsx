"use client";

import { useEffect, useRef, useState, type JSX, type PointerEvent } from "react";
import { useTrack } from "../use-track";
import { SPRING_PRESS } from "../tokens";

export interface CraftToast {
  readonly id: number;
  readonly message: string;
}

/**
 * 提示条. 新的一条从右侧弹簧进入, 横向拖出并带速度关闭.
 */
export function CraftToasts(): JSX.Element {
  const [items, setItems] = useState<CraftToast[]>([]);
  const next = useRef(1);

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        className="h-8 rounded-lg border border-border px-3 text-sm text-foreground"
        onClick={() => {
          const id = next.current;
          next.current += 1;
          setItems((prev) => [...prev, { id, message: `已记录 ${id}` }]);
        }}
      >
        推一条
      </button>
      <div className="flex w-64 flex-col gap-2">
        {items.map((item) => (
          <ToastCard key={item.id} message={item.message} onClose={() => setItems((prev) => prev.filter((row) => row.id !== item.id))} />
        ))}
      </div>
    </div>
  );
}

function ToastCard({ message, onClose }: { readonly message: string; readonly onClose: () => void }): JSX.Element {
  const x = useTrack(48, SPRING_PRESS);
  const drag = useRef({ active: false, lastX: 0, lastT: 0, velocity: 0 });

  useEffect(() => {
    x.setTarget(0);
  }, [x.setTarget]);

  const onDown = (event: PointerEvent<HTMLDivElement>): void => {
    drag.current = { active: true, lastX: event.clientX, lastT: performance.now(), velocity: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onMove = (event: PointerEvent<HTMLDivElement>): void => {
    if (!drag.current.active) return;
    const now = performance.now();
    const dx = event.clientX - drag.current.lastX;
    drag.current.velocity = (dx / Math.max(8, now - drag.current.lastT)) * 1000;
    x.setCurrent(Math.max(0, x.value + dx), drag.current.velocity);
    drag.current.lastX = event.clientX;
    drag.current.lastT = now;
  };

  const onUp = (): void => {
    if (!drag.current.active) return;
    drag.current.active = false;
    if (x.value > 80 || drag.current.velocity > 300) onClose();
    else x.setTarget(0, drag.current.velocity);
  };

  return (
    <div
      className="rounded-lg border border-border bg-popover px-3 py-2 text-sm text-foreground"
      style={{ transform: `translate3d(${x.value}px, 0, 0)` }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {message}
    </div>
  );
}
