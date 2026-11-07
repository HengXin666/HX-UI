"use client";

import { useEffect, useState, type JSX } from "react";

const AXIS = 24;
const BASELINE = 128;
const TOP = 8;
const RIGHT = 220;
const PLOT = 120;
const START_DOMAIN = 100;

/**
 * 坐标轴冲击. 值冲出当前域时, 网格用 200ms 重标, 线不从头画.
 */
export function AxisShock({ value }: { readonly value: number }): JSX.Element {
  const [domain, setDomain] = useState(START_DOMAIN);
  const [shown, setShown] = useState(domain);

  useEffect(() => {
    const next = value > domain ? Math.ceil(value / 50) * 50 : domain;
    if (next === domain) return;
    const began = performance.now();
    let frame = 0;
    const from = domain;
    const loop = (now: number): void => {
      const t = Math.min(1, (now - began) / 200);
      setShown(from + (next - from) * (1 - (1 - t) * (1 - t)));
      if (t < 1) frame = requestAnimationFrame(loop);
      else setDomain(next);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [value, domain]);

  const plot = Math.max(0, Math.min(PLOT, (value / Math.max(shown, 1)) * PLOT));

  return (
    <svg viewBox="0 0 240 140" className="h-36 w-full" role="img" aria-label="坐标轴">
      <line x1={AXIS} y1={TOP} x2={AXIS} y2={BASELINE} className="stroke-border" strokeWidth="1" />
      <line x1={AXIS} y1={BASELINE} x2={RIGHT} y2={BASELINE} className="stroke-border" strokeWidth="1" />
      <text x="4" y="16" className="fill-muted-foreground" fontSize="10">{Math.round(shown)}</text>
      <rect x={AXIS} y={BASELINE - plot} width="160" height={plot} className="fill-primary" />
    </svg>
  );
}
