"use client";

import { useRef, type JSX, type PointerEvent, type ReactNode } from "react";
import { stepSpring } from "./spring";
import { FOLLOW_LIMIT_PX, SPRING_FOLLOW } from "./tokens";

const REDUCED = "(prefers-reduced-motion: reduce)";

/** 指针在卡片内时用 follow 弹簧偏移, 离开后速度保留地回到 0. */
export function Follow({ children, className }: { readonly children: ReactNode; readonly className?: string }): JSX.Element {
  const frame = useRef(0);
  const node = useRef<HTMLDivElement>(null);
  const state = useRef({ x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 });

  const wake = (): void => {
    if (frame.current) return;
    let last = 0;
    const loop = (now: number): void => {
      const dt = last ? now - last : 16;
      last = now;
      const s = state.current;
      const sx = stepSpring(s.x, s.vx, s.tx, SPRING_FOLLOW, dt);
      const sy = stepSpring(s.y, s.vy, s.ty, SPRING_FOLLOW, dt);
      s.x = sx.current;
      s.vx = sx.velocity;
      s.y = sy.current;
      s.vy = sy.velocity;
      if (node.current) node.current.style.transform = `translate3d(${s.x}px, ${s.y}px, 0)`;
      if (sx.resting && sy.resting && s.tx === 0 && s.ty === 0) {
        frame.current = 0;
        return;
      }
      frame.current = requestAnimationFrame(loop);
    };
    frame.current = requestAnimationFrame(loop);
  };

  const aim = (event: PointerEvent<HTMLDivElement>): void => {
    if (window.matchMedia?.(REDUCED).matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const limit = FOLLOW_LIMIT_PX;
    state.current.tx = Math.max(-limit, Math.min(limit, dx / 8));
    state.current.ty = Math.max(-limit, Math.min(limit, dy / 8));
    wake();
  };

  const leave = (): void => {
    state.current.tx = 0;
    state.current.ty = 0;
    wake();
  };

  return (
    <div ref={node} className={className} onPointerMove={aim} onPointerLeave={leave}>
      {children}
    </div>
  );
}
