"use client";

import { useRef, type JSX, type PointerEvent, type ReactNode } from "react";
import { resting, stepSpring, type Channel } from "./spring";
import { useReducedMotion } from "./hooks";
import { PX, SPRING } from "./tokens";

/** 指针在卡片内时用 follow 弹簧靠过去, 离开后速度保留地回到 0. */
export function Magnet({ children, className }: { readonly children: ReactNode; readonly className?: string }): JSX.Element {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useRef<Channel>({ x: 0, v: 0 });
  const y = useRef<Channel>({ x: 0, v: 0 });
  const goal = useRef({ x: 0, y: 0 });
  const frame = useRef(0);

  const paint = (): void => {
    const node = ref.current;
    if (!node) return;
    const quiet = Math.abs(x.current.x) < PX.rest && Math.abs(y.current.x) < PX.rest;
    node.style.transform = quiet ? "" : `translate3d(${x.current.x.toFixed(2)}px, ${y.current.x.toFixed(2)}px, 0)`;
  };

  const kick = (): void => {
    if (reduced) {
      x.current = { x: 0, v: 0 };
      y.current = { x: 0, v: 0 };
      paint();
      return;
    }
    if (frame.current) return;
    let last = performance.now();
    const tick = (now: number): void => {
      const dt = now - last;
      last = now;
      stepSpring(x.current, goal.current.x, SPRING.follow, dt);
      stepSpring(y.current, goal.current.y, SPRING.follow, dt);
      paint();
      const done = resting(x.current, goal.current.x) && resting(y.current, goal.current.y);
      if (!done) frame.current = requestAnimationFrame(tick);
      else frame.current = 0;
    };
    frame.current = requestAnimationFrame(tick);
  };

  const follow = (event: PointerEvent<HTMLDivElement>): void => {
    if (reduced) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    goal.current = {
      x: Math.max(-PX.magnet, Math.min(PX.magnet, dx * PX.magnetGain)),
      y: Math.max(-PX.magnet, Math.min(PX.magnet, dy * PX.magnetGain)),
    };
    kick();
  };

  return (
    <div
      ref={ref}
      className={className}
      onPointerMove={follow}
      onPointerLeave={() => {
        goal.current = { x: 0, y: 0 };
        kick();
      }}
    >
      {children}
    </div>
  );
}
