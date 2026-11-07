"use client";

import { useEffect, useState, type JSX } from "react";
import { DEAL_FIRST_MS, DEAL_LAST_MS } from "../tokens";

const REDUCED = "(prefers-reduced-motion: reduce)";

function delayFor(index: number): number {
  if (index <= 0) return 0;
  return DEAL_FIRST_MS + (index - 1) * DEAL_LAST_MS;
}

/**
 * 发牌. 间隔从 120ms 收到 40ms. 进度可逆: 往回滚, 相位跟着减.
 */
export function DealRow({ progress, labels }: { readonly progress: number; readonly labels: readonly string[] }): JSX.Element {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(window.matchMedia?.(REDUCED).matches === true);
  }, []);
  const clock = Math.max(0, Math.min(1, progress)) * 1000;

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {labels.map((label, index) => {
        const local = reduced ? 1 : Math.max(0, Math.min(1, (clock - delayFor(index)) / 180));
        return (
          <article
            key={label}
            className="rounded-xl border border-border bg-card p-4"
            style={{
              opacity: local,
              transform: `translate3d(${(1 - local) * 32}px, 0, 0)`,
              boxShadow: `0 ${8 - local * 6}px ${8 - local * 6}px color-mix(in srgb, var(--foreground) 12%, transparent)`,
            }}
          >
            <h3 className="text-foreground">{label}</h3>
          </article>
        );
      })}
    </div>
  );
}
