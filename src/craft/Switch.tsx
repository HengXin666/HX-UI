"use client";

import { useEffect, useRef, type JSX, type PointerEvent } from "react";
import { BUTTON_TYPE } from "../constants";
import { resting, stepSpring, type Channel } from "./spring";
import { useReducedMotion } from "./hooks";
import { MS, PX, SCALE, SPRING } from "./tokens";

/** 轨道 36x20, 拇指行程 16px. aria-checked 在松开时立刻翻转, 不等滑完. */
export function CraftSwitch({
  checked,
  onChange,
  disabled = false,
  label,
}: {
  readonly checked: boolean;
  readonly onChange: (next: boolean) => void;
  readonly disabled?: boolean;
  readonly label: string;
}): JSX.Element {
  const reduced = useReducedMotion();
  const thumb = useRef<HTMLSpanElement>(null);
  const place = useRef<Channel>({ x: checked ? PX.travel : 0, v: 0 });
  const squeeze = useRef<Channel>({ x: SCALE.rest, v: 0 });
  const frame = useRef(0);
  const held = useRef(false);
  const goal = useRef(checked);
  goal.current = checked;

  const paint = (): void => {
    const node = thumb.current;
    if (!node) return;
    const along = Math.min(1, Math.max(0, place.current.x / PX.travel));
    const bulge = Math.sin(Math.PI * along) * SCALE.thumbMid;
    const scale = reduced ? SCALE.rest : squeeze.current.x + bulge;
    const x = reduced ? (goal.current ? PX.travel : 0) : place.current.x;
    node.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0) scale(${scale.toFixed(4)})`;
  };

  const kick = (): void => {
    if (reduced) {
      place.current = { x: goal.current ? PX.travel : 0, v: 0 };
      squeeze.current = { x: SCALE.rest, v: 0 };
      paint();
      return;
    }
    if (frame.current) return;
    let last = performance.now();
    const tick = (now: number): void => {
      const dt = now - last;
      last = now;
      stepSpring(place.current, goal.current ? PX.travel : 0, SPRING.thumb, dt);
      stepSpring(squeeze.current, held.current ? SCALE.switchPress : SCALE.rest, SPRING.press, dt);
      paint();
      const target = goal.current ? PX.travel : 0;
      const done = !held.current && resting(place.current, target) && resting(squeeze.current, SCALE.rest);
      if (!done) frame.current = requestAnimationFrame(tick);
      else frame.current = 0;
    };
    frame.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    kick();
    return () => {
      cancelAnimationFrame(frame.current);
      frame.current = 0;
    };
  }, [checked, reduced]);

  const release = (event: PointerEvent<HTMLButtonElement>): void => {
    if (disabled) return;
    held.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    onChange(!checked);
  };

  return (
    <button
      type={BUTTON_TYPE}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onPointerDown={(event) => {
        if (disabled || reduced) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        held.current = true;
        kick();
      }}
      onPointerUp={release}
      onPointerCancel={release}
      className="relative h-5 w-9 rounded-full border border-border p-0.5 outline-1 outline-offset-2 outline-transparent transition-[background-color,opacity] ease-out focus-visible:outline-ring disabled:pointer-events-none"
      style={{
        transitionDuration: `${MS.color}ms`,
        background: checked ? "var(--primary)" : "var(--muted)",
        opacity: disabled ? SCALE.disabled : undefined,
      }}
    >
      <span ref={thumb} className="block size-4 rounded-full bg-background" />
    </button>
  );
}
