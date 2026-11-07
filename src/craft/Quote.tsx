"use client";

import { useEffect, useState, type JSX } from "react";
import { ease } from "./spring";
import { useReducedMotion } from "./hooks";
import { MS, PX, SCALE } from "./tokens";

/** 一句引语的三拍: 模糊从 8px 收到 0, 中点 scale 0.97. 不用于按钮标签. */
export function CraftQuote({ text }: { readonly text: string }): JSX.Element {
  const reduced = useReducedMotion();
  const [at, setAt] = useState(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      setAt(1);
      return undefined;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number): void => {
      const t = Math.min(1, (now - start) / MS.quote);
      setAt(t);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduced]);

  const blur = PX.quoteBlur * (1 - ease("out", at));
  const scale = at < 0.5
    ? SCALE.rest + (SCALE.quoteMid - SCALE.rest) * ease("in", at / 0.5)
    : SCALE.quoteMid + (SCALE.rest - SCALE.quoteMid) * ease("out", (at - 0.5) / 0.5);
  return (
    <p
      className="text-lg text-foreground"
      style={{
        filter: blur < PX.near ? undefined : `blur(${blur.toFixed(2)}px)`,
        transform: `scale(${scale.toFixed(4)})`,
      }}
    >
      {text}
    </p>
  );
}
