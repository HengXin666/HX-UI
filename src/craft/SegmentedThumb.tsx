"use client";

import { useEffect, useLayoutEffect, useRef, useState, type JSX, type PointerEvent } from "react";
import { stepSpring } from "./spring";
import {
  EASE,
  PRESS_MS,
  RING_ALPHA,
  RING_FROM_PX,
  RING_MS,
  RING_TO_PX,
  SEGMENT_PRESS_SCALE,
  SPRING_THUMB,
  THUMB_MAX_MS,
  THUMB_MIN_MS,
} from "./tokens";

const REDUCED = "(prefers-reduced-motion: reduce)";
const PX = "px";
const DIAMETER = 2;
const CENTER = "translate(-50%, -50%)";

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

interface Ring {
  readonly x: number;
  readonly y: number;
  readonly index: number;
  readonly id: number;
}

function reduced(): boolean {
  return window.matchMedia?.(REDUCED).matches === true;
}

/** 点击点的 1px 圈: 圆心锁在点击点, 只改直径, 线宽始终 1px. */
function ringFrames(): Keyframe[] {
  const from = RING_FROM_PX * DIAMETER + PX;
  const to = RING_TO_PX * DIAMETER + PX;
  return [
    { width: from, height: from, opacity: RING_ALPHA, transform: CENTER },
    { width: to, height: to, opacity: 0, transform: CENTER },
  ];
}

/**
 * 分段拇指. 按下 90ms 缩到 0.94, 点击点起一圈 1px 线; 拇指跟着 value 用 thumb 弹簧滑到新档,
 * 不论 value 来自点击还是外部 (滚动进度), 滑动时间钳在 160 到 420ms.
 */
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
  const live = useRef<Thumb>(thumb);
  const [pressed, setPressed] = useState(false);
  const [ring, setRing] = useState<Ring | null>(null);
  const frame = useRef(0);
  const placed = useRef(false);

  const measure = (next: T): { x: number; width: number } => {
    const index = options.findIndex((item) => item.value === next);
    const node = buttons.current[index];
    if (!node) return { x: 0, width: 0 };
    return { x: node.offsetLeft, width: node.offsetWidth };
  };

  const write = (next: Thumb): void => {
    live.current = next;
    setThumb(next);
  };

  const glide = (next: T): void => {
    const target = measure(next);
    cancelAnimationFrame(frame.current);
    if (reduced() || !placed.current) {
      placed.current = target.width > 0;
      write({ ...target, velocity: 0 });
      return;
    }
    let { x: current, velocity, width } = live.current;
    let last = 0;
    let began = 0;
    const loop = (now: number): void => {
      const dt = last ? now - last : 16;
      last = now;
      began = began || now;
      const step = stepSpring(current, velocity, target.x, SPRING_THUMB, dt);
      current = step.current;
      velocity = step.velocity;
      width += (target.width - width) * Math.min(1, dt / THUMB_MIN_MS);
      const spent = now - began;
      // 420ms 还没停就直接落档; 160ms 以内不落档, 弹簧自己也到不了.
      if (spent >= THUMB_MAX_MS || (step.resting && spent >= THUMB_MIN_MS)) {
        write({ ...target, velocity: 0 });
        return;
      }
      write({ x: current, width, velocity });
      frame.current = requestAnimationFrame(loop);
    };
    frame.current = requestAnimationFrame(loop);
  };

  useLayoutEffect(() => {
    glide(value);
    // value 是唯一的驱动; glide 每次读最新的拇指位置.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const latest = useRef(value);
  latest.current = value;
  useEffect(() => {
    const again = (): void => {
      placed.current = false;
      glide(latest.current);
    };
    window.addEventListener("resize", again);
    void document.fonts?.ready.then(again);
    return () => {
      window.removeEventListener("resize", again);
      cancelAnimationFrame(frame.current);
    };
    // 只在挂载时登记一次, 量的是最新 value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = (next: T, index: number, event: PointerEvent<HTMLButtonElement>): void => {
    setPressed(true);
    const option = options.find((item) => item.value === next);
    if (!option || option.disabled || next === value) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setRing({ x: event.clientX - rect.left, y: event.clientY - rect.top, index, id: event.timeStamp });
    onChange(next);
  };

  const spread = (node: HTMLSpanElement | null): void => {
    if (!node || reduced()) return;
    node.animate(ringFrames(), { duration: RING_MS, easing: `cubic-bezier(${EASE.out})`, fill: "forwards" });
  };

  return (
    <div role="radiogroup" aria-label={ariaLabel} className="relative inline-flex h-8 items-center rounded-full border border-border bg-muted p-[3px]">
      <span
        aria-hidden
        className="absolute left-0 top-[3px] h-[26px]"
        style={{ width: thumb.width || undefined, transform: `translate3d(${thumb.x}px, 0, 0)` }}
      >
        <span
          className="absolute inset-0 rounded-full bg-background"
          style={{
            transform: `scale(${pressed ? SEGMENT_PRESS_SCALE : 1})`,
            transition: `transform ${PRESS_MS}ms cubic-bezier(${EASE.out})`,
          }}
        />
      </span>
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
          onPointerDown={(event) => choose(option.value, index, event)}
          onPointerUp={() => setPressed(false)}
          onPointerLeave={() => setPressed(false)}
          onPointerCancel={() => setPressed(false)}
        >
          {option.label}
          {ring && ring.index === index ? (
            <span
              key={ring.id}
              ref={spread}
              aria-hidden
              className="pointer-events-none absolute rounded-full border border-foreground opacity-0"
              style={{ left: ring.x, top: ring.y }}
            />
          ) : null}
        </button>
      ))}
    </div>
  );
}
