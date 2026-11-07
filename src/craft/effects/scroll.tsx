"use client";

import { useEffect, useState, type JSX } from "react";

const TEXT = "text-foreground";

/** 视差. 进度越大, 位移越大. */
export function ParallaxBlock({ progress, label }: { readonly progress: number; readonly label: string }): JSX.Element {
  const shift = Math.max(0, Math.min(1, progress)) * 24;
  return <p className={TEXT} style={{ transform: `translate3d(0, ${shift}px, 0)` }}>{label}</p>;
}

/** 滚动淡入. */
export function ScrollFade({ progress, label }: { readonly progress: number; readonly label: string }): JSX.Element {
  const t = Math.max(0, Math.min(1, progress));
  return <p className={TEXT} style={{ opacity: t, transform: `translate3d(0, ${(1 - t) * 12}px, 0)` }}>{label}</p>;
}

/** 共享缩放. 从 0.96 到 1. */
export function SharedScale({ progress, label }: { readonly progress: number; readonly label: string }): JSX.Element {
  const t = Math.max(0, Math.min(1, progress));
  return <p className={TEXT} style={{ transform: `scale(${0.96 + t * 0.04})` }}>{label}</p>;
}

/** 骨架闪一下. 减弱动效时静止. */
export function ShimmerBar(): JSX.Element {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true);
  }, []);
  return (
    <div className="h-4 w-40 overflow-hidden rounded-md bg-muted">
      {reduced ? null : <div className="h-full w-1/2 bg-background/60" style={{ animation: "hx-shimmer 1.2s linear infinite" }} />}
    </div>
  );
}
