"use client";

import { useLayoutEffect, useRef, useState, type JSX, type PointerEvent } from "react";
import { BUTTON_TYPE } from "../constants";
import { resting, stepSpring, type Channel } from "./spring";
import { useReducedMotion } from "./hooks";
import { MS, PX, SCALE, SPRING } from "./tokens";

export type CraftSegment = { readonly id: string; readonly label: string; readonly disabled?: boolean };

type Ripple = { readonly x: number; readonly y: number; readonly n: number };

/** 拇指 267ms 滑到下一项. 涟漪锁在点击点. 拖过阈值后跟手, 松开吸到最近一档. */
export function CraftSegmented({
  segments,
  value,
  onChange,
}: {
  readonly segments: readonly CraftSegment[];
  readonly value: string;
  readonly onChange: (id: string) => void;
}): JSX.Element {
  const reduced = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLSpanElement>(null);
  const place = useRef<Channel>({ x: 0, v: 0 });
  const wide = useRef<Channel>({ x: 0, v: 0 });
  const squeeze = useRef<Channel>({ x: SCALE.rest, v: 0 });
  const frame = useRef(0);
  const goal = useRef({ x: 0, w: 0 });
  const drag = useRef({ on: false, origin: 0, pointer: 0 });
  const held = useRef(false);
  const [ripple, setRipple] = useState<Ripple | null>(null);

  const boxes = (): DOMRect[] => {
    const node = root.current;
    if (!node) return [];
    return [...node.querySelectorAll<HTMLElement>("[data-segment]")].map((item) => item.getBoundingClientRect());
  };

  const measure = (id: string): { x: number; w: number } | null => {
    const node = root.current;
    const item = node?.querySelector<HTMLElement>(`[data-segment="${id}"]`);
    if (!node || !item) return null;
    const rb = node.getBoundingClientRect();
    const ib = item.getBoundingClientRect();
    return { x: ib.left - rb.left, w: ib.width };
  };

  const paint = (): void => {
    const node = thumb.current;
    if (!node) return;
    node.style.width = `${wide.current.x.toFixed(2)}px`;
    node.style.transform = `translate3d(${place.current.x.toFixed(2)}px, 0, 0) scale(${squeeze.current.x.toFixed(4)})`;
  };

  const kick = (): void => {
    if (frame.current) return;
    let last = performance.now();
    const tick = (now: number): void => {
      const dt = now - last;
      last = now;
      const spring = drag.current.on ? SPRING.follow : SPRING.thumb;
      if (reduced) {
        place.current = { x: goal.current.x, v: 0 };
        wide.current = { x: goal.current.w, v: 0 };
        squeeze.current = { x: SCALE.rest, v: 0 };
      } else {
        stepSpring(place.current, goal.current.x, spring, dt);
        stepSpring(wide.current, goal.current.w, SPRING.width, dt);
        stepSpring(squeeze.current, held.current ? SCALE.segmentPress : SCALE.rest, SPRING.press, dt);
      }
      paint();
      const done = reduced || (!held.current && !drag.current.on && resting(place.current, goal.current.x) && resting(wide.current, goal.current.w) && resting(squeeze.current, SCALE.rest));
      if (!done) frame.current = requestAnimationFrame(tick);
      else frame.current = 0;
    };
    frame.current = requestAnimationFrame(tick);
  };

  const aim = (id: string, snap: boolean): void => {
    const next = measure(id);
    if (!next) return;
    goal.current = next;
    if (snap || reduced) {
      place.current = { x: next.x, v: 0 };
      wide.current = { x: next.w, v: 0 };
    }
    kick();
  };

  useLayoutEffect(() => {
    aim(value, place.current.x === 0 && place.current.v === 0);
  }, [value, segments]);

  const nearest = (clientX: number): string => {
    const node = root.current;
    if (!node) return value;
    const rb = node.getBoundingClientRect();
    const local = clientX - rb.left;
    let best = value;
    let score = Number.POSITIVE_INFINITY;
    segments.forEach((segment, index) => {
      if (segment.disabled) return;
      const rect = boxes()[index];
      if (!rect) return;
      const mid = rect.left - rb.left + rect.width / 2;
      const dist = Math.abs(mid - local);
      if (dist < score) {
        score = dist;
        best = segment.id;
      }
    });
    return best;
  };

  const down = (event: PointerEvent<HTMLButtonElement>, id: string): void => {
    const item = segments.find((segment) => segment.id === id);
    if (!item || item.disabled) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = root.current?.getBoundingClientRect();
    drag.current = { on: false, origin: event.clientX, pointer: event.clientX };
    held.current = true;
    if (rect) setRipple({ x: event.clientX - rect.left, y: event.clientY - rect.top, n: event.timeStamp });
    kick();
  };

  const move = (event: PointerEvent<HTMLButtonElement>): void => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    if (Math.abs(event.clientX - drag.current.origin) > MS.dragSlop) drag.current.on = true;
    if (!drag.current.on) return;
    const delta = event.clientX - drag.current.pointer;
    drag.current.pointer = event.clientX;
    goal.current = { x: goal.current.x + delta, w: goal.current.w };
    kick();
  };

  const up = (event: PointerEvent<HTMLButtonElement>, id: string): void => {
    const item = segments.find((segment) => segment.id === id);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const pick = drag.current.on ? nearest(event.clientX) : (item && !item.disabled ? id : nearest(event.clientX));
    drag.current.on = false;
    held.current = false;
    if (pick !== value) onChange(pick);
    else aim(pick, false);
  };

  return (
    <div ref={root} role="radiogroup" className="relative inline-flex h-8 items-center rounded-full border border-border bg-muted p-[3px]">
      <span ref={thumb} aria-hidden className="absolute bottom-[3px] top-[3px] left-0 rounded-full bg-background" />
      {ripple && !reduced ? <Ripple key={ripple.n} x={ripple.x} y={ripple.y} /> : null}
      {segments.map((segment) => (
        <button
          key={segment.id}
          type={BUTTON_TYPE}
          role="radio"
          data-segment={segment.id}
          aria-checked={segment.id === value}
          disabled={segment.disabled}
          onPointerDown={(event) => down(event, segment.id)}
          onPointerMove={move}
          onPointerUp={(event) => up(event, segment.id)}
          onPointerCancel={(event) => up(event, segment.id)}
          className="relative z-10 min-w-20 rounded-full px-3 text-sm outline-1 outline-offset-2 outline-transparent focus-visible:outline-ring disabled:pointer-events-none"
          style={{ opacity: segment.disabled ? 0.4 : segment.id === value ? 1 : 0.7 }}
        >
          {segment.label}
        </button>
      ))}
    </div>
  );
}

function Ripple({ x, y }: { readonly x: number; readonly y: number }): JSX.Element {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number): void => {
      const t = Math.min(1, (now - start) / MS.ripple);
      const radius = PX.rippleFrom + (PX.rippleTo - PX.rippleFrom) * t;
      node.style.width = `${radius * 2}px`;
      node.style.height = `${radius * 2}px`;
      node.style.opacity = String(0.35 * (1 - t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <span
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute z-20 rounded-full border border-foreground"
      style={{ left: x, top: y, transform: "translate(-50%, -50%)" }}
    />
  );
}
