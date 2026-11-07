"use client";

import { useRef, useState, type JSX, type PointerEvent } from "react";
import { SPRING_THUMB } from "../tokens";
import { useTrack } from "../use-track";

const FULL = 100;

/**
 * 滑杆. 拖拽跟手. 松手用当前速度吸到步长, 气泡显示当前值.
 */
export function CraftRange({
  value,
  onChange,
  min = 0,
  max = FULL,
  step = 10,
  disabled,
  label,
}: {
  readonly value: number;
  readonly onChange: (value: number) => void;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly disabled?: boolean;
  readonly label: string;
}): JSX.Element {
  const track = useRef<HTMLDivElement>(null);
  const thumb = useTrack(value, SPRING_THUMB);
  const drag = useRef({ active: false, velocity: 0, last: 0, lastT: 0 });
  const [pressed, setPressed] = useState(false);
  const span = Math.max(1, max - min);
  const ratio = (thumb.value - min) / span;

  const valueAt = (clientX: number): number => {
    const rect = track.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return value;
    const next = min + ((clientX - rect.left) / rect.width) * span;
    return Math.min(max, Math.max(min, next));
  };

  const onDown = (event: PointerEvent<HTMLDivElement>): void => {
    if (disabled) return;
    setPressed(true);
    drag.current = { active: true, velocity: 0, last: event.clientX, lastT: performance.now() };
    event.currentTarget.setPointerCapture(event.pointerId);
    const next = valueAt(event.clientX);
    thumb.setCurrent(next, 0);
    onChange(next);
  };

  const onMove = (event: PointerEvent<HTMLDivElement>): void => {
    if (!drag.current.active) return;
    const now = performance.now();
    const dx = event.clientX - drag.current.last;
    drag.current.velocity = dx / Math.max(8, now - drag.current.lastT);
    const next = valueAt(event.clientX);
    thumb.setCurrent(next, drag.current.velocity);
    onChange(next);
    drag.current.last = event.clientX;
    drag.current.lastT = now;
  };

  const onUp = (): void => {
    if (!drag.current.active) return;
    drag.current.active = false;
    setPressed(false);
    const snapped = Math.round((thumb.value - min) / step) * step + min;
    const clamped = Math.min(max, Math.max(min, snapped));
    thumb.setTarget(clamped, drag.current.velocity);
    onChange(clamped);
  };

  return (
    <div className="relative h-8 w-48" aria-disabled={disabled || undefined}>
      <div ref={track} className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-muted" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        <div className="h-full rounded-full bg-primary" style={{ width: `${ratio * FULL}%` }} />
      </div>
      <div
        className="pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 rounded-full border border-primary bg-background"
        style={{ left: `${ratio * FULL}%`, transform: `translate(-50%, -50%) scale(${pressed ? 0.92 : 1})` }}
      />
      <div className="pointer-events-none absolute -top-5 text-xs text-foreground" style={{ left: `${ratio * FULL}%`, transform: "translateX(-50%)" }}>{Math.round(thumb.value)}</div>
      <input className="sr-only" type="range" min={min} max={max} step={step} value={value} disabled={disabled} aria-label={label} onChange={(event) => onChange(Number(event.target.value))} />
    </div>
  );
}
