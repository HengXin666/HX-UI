"use client";

import { useEffect, useState, type JSX } from "react";

const REDUCED = "(prefers-reduced-motion: reduce)";

/**
 * 一句引语的三拍: 模糊从 8px 收到 0, 中点 scale 0.97. 不用于按钮标签.
 */
export function BlurLine({ text }: { readonly text: string }): JSX.Element {
  const [t, setT] = useState(0);

  useEffect(() => {
    if (window.matchMedia?.(REDUCED).matches) {
      setT(1);
      return;
    }
    const began = performance.now();
    let frame = 0;
    const loop = (now: number): void => {
      const next = Math.min(1, (now - began) / 500);
      setT(next);
      if (next < 1) frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [text]);

  const blur = (1 - t) * 8;
  const scale = t < 0.5 ? 1.04 - t * 0.14 : 0.97 + (t - 0.5) * 0.06;

  return (
    <p className="text-lg text-foreground" style={{ filter: `blur(${blur}px)`, transform: `scale(${scale})`, opacity: 0.2 + t * 0.8 }}>
      {text}
    </p>
  );
}
