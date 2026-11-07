"use client";

import { useEffect, useRef, useState, type JSX, type PointerEvent } from "react";

const REDUCED = "(prefers-reduced-motion: reduce)";

/** 指针聚光. 圆心跟鼠标, 离开后停在最后一点. */
export function Spotlight({ label }: { readonly label: string }): JSX.Element {
  const [spot, setSpot] = useState({ x: 40, y: 24 });
  const onMove = (event: PointerEvent<HTMLDivElement>): void => {
    const rect = event.currentTarget.getBoundingClientRect();
    setSpot({ x: event.clientX - rect.left, y: event.clientY - rect.top });
  };
  return (
    <div onPointerMove={onMove} className="relative h-28 overflow-hidden rounded-xl border border-border bg-card">
      <div
        className="pointer-events-none absolute size-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/70"
        style={{ left: spot.x, top: spot.y }}
      />
      <p className="relative p-4 text-sm text-foreground">{label}</p>
    </div>
  );
}

/** 倾斜卡片. 减弱动效时不倾斜. */
export function TiltCard({ label }: { readonly label: string }): JSX.Element {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const reduced = useRef(false);
  useEffect(() => {
    reduced.current = window.matchMedia?.(REDUCED).matches === true;
  }, []);
  const onMove = (event: PointerEvent<HTMLDivElement>): void => {
    if (reduced.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -6, y: px * 6 });
  };
  return (
    <div
      onPointerMove={onMove}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
      className="h-28 rounded-xl border border-border bg-card p-4 text-sm text-foreground"
      style={{ transform: `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
    >
      {label}
    </div>
  );
}

/** 指针拖尾. 最多 6 个点. */
export function PointerTrail(): JSX.Element {
  const [dots, setDots] = useState<Array<{ x: number; y: number }>>([]);
  const onMove = (event: PointerEvent<HTMLDivElement>): void => {
    const rect = event.currentTarget.getBoundingClientRect();
    const next = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    setDots((prev) => [...prev.slice(-5), next]);
  };
  return (
    <div onPointerMove={onMove} className="relative h-28 overflow-hidden rounded-xl border border-border bg-card">
      {dots.map((dot, index) => (
        <span key={`${dot.x}-${dot.y}-${index}`} className="absolute size-2 rounded-full bg-primary" style={{ left: dot.x, top: dot.y, opacity: (index + 1) / 6 }} />
      ))}
    </div>
  );
}

/** 横向擦除. */
export function Wipe({ progress, label }: { readonly progress: number; readonly label: string }): JSX.Element {
  const shown = Math.max(0, Math.min(1, progress)) * 100;
  return (
    <p className="relative text-lg text-muted-foreground">
      {label}
      <span className="absolute inset-0 overflow-hidden text-foreground" style={{ width: `${shown}%` }}>{label}</span>
    </p>
  );
}
