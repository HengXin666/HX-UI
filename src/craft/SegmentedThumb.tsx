"use client";

import { useRef, useState, type JSX, type PointerEvent } from "react";
import { stepSpring } from "./spring";
import { SPRING_THUMB, THUMB_PRESS_SCALE } from "./tokens";

const REDUCED = "(prefers-reduced-motion: reduce)";

export interface SegmentedOption<T extends string> {
  readonly value: T;
  readonly label: string;
  readonly disabled?: boolean;
}

interface Thumb {
  x: number;
  width: number;
  velocity: number;
}

/** 分段拇指. 按下先缩小, 再在 160ms 到 420ms 内滑到新档. */
export function SegmentedThumb<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  readonly options: readonly SegmentedOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly ariaLabel: string;
}): JSX.Element {
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const [thumb, setThumb] = useState<Thumb>({ x: 0, width: 0, velocity: 0 });
  const [pressed, setPressed] = useState(false);
  const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(null);
  const frame = useRef(0);

  const measure = (next: T): { x: number; width: number } => {
    const index = options.findIndex((item) => item.value === next);
    const node = buttons.current[index];
    if (!node) return { x: 0, width: 0 };
    return { x: node.offsetLeft, width: node.offsetWidth };
  };

  const glide = (next: T): void => {
    const target = measure(next);
    if (window.matchMedia?.(REDUCED).matches) {
      setThumb({ ...target, velocity: 0 });
      return;
    }
    cancelAnimationFrame(frame.current);
    let current = thumb.x;
    let velocity = thumb.velocity;
    let width = thumb.width;
    let last = 0;
    const loop = (now: number): void => {
      const dt = last ? now - last : 16;
      last = now;
      const step = stepSpring(current, velocity, target.x, SPRING_THUMB, dt);
      current = step.current;
      velocity = step.velocity;
      width += (target.width - width) * Math.min(1, dt / 180);
      setThumb({ x: current, width, velocity });
      if (!step.resting) frame.current = requestAnimationFrame(loop);
    };
    frame.current = requestAnimationFrame(loop);
  };

  const choose = (next: T, event: PointerEvent<HTMLButtonElement>): void => {
    const option = options.find((item) => item.value === next);
    if (!option || option.disabled || next === value) {
      setPressed(true);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    setRipple({ x: event.clientX - rect.left, y: event.clientY - rect.top, id: event.timeStamp });
    setPressed(true);
    onChange(next);
    glide(next);
  };

  return (
    <div role="radiogroup" aria-label={ariaLabel} className="relative inline-flex h-8 items-center rounded-full border border-border bg-muted p-[3px]">
      <span
        aria-hidden
        className="absolute top-[3px] h-[26px] rounded-full bg-background"
        style={{
          width: thumb.width || undefined,
          transform: `translate3d(${thumb.x}px, 0, 0) scale(${pressed ? THUMB_PRESS_SCALE : 1})`,
        }}
      />
      {options.map((option, index) => (
        <button
          key={option.value}
          ref={(node) => {
            buttons.current[index] = node;
          }}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          disabled={option.disabled}
          className="relative z-[1] min-w-20 px-3 text-sm text-foreground disabled:opacity-40"
          style={{ opacity: option.value === value ? 1 : 0.7 }}
          onPointerDown={(event) => choose(option.value, event)}
          onPointerUp={() => setPressed(false)}
          onPointerCancel={() => setPressed(false)}
        >
          {option.label}
          {ripple && option.value === value ? (
            <span
              key={ripple.id}
              aria-hidden
              className="pointer-events-none absolute size-2 rounded-full border border-foreground opacity-35"
              style={{ left: ripple.x, top: ripple.y }}
            />
          ) : null}
        </button>
      ))}
    </div>
  );
}
