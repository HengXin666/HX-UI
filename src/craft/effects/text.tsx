"use client";

import { useEffect, useState, type JSX, type ReactNode } from "react";

const REDUCED = "(prefers-reduced-motion: reduce)";

function useReduced(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(window.matchMedia?.(REDUCED).matches === true);
  }, []);
  return reduced;
}

/** 逐字升起. 减弱动效时整句直接出现. */
export function SplitRise({ text }: { readonly text: string }): JSX.Element {
  const reduced = useReduced();
  const [on, setOn] = useState(reduced);
  useEffect(() => {
    if (reduced) return;
    const frame = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(frame);
  }, [reduced, text]);
  return (
    <p className="text-lg text-foreground">
      {Array.from(text).map((char, index) => (
        <span
          key={`${char}-${index}`}
          className="inline-block transition-[opacity,transform] duration-300 motion-reduce:transition-none"
          style={{
            opacity: on ? 1 : 0,
            transform: on ? "none" : "translate3d(0, 8px, 0)",
            transitionDelay: `${index * 30}ms`,
          }}
        >
          {char === " " ? "\u00a0" : char}
        </span>
      ))}
    </p>
  );
}

/** 打字. 进度 0 到 1 决定露出几个字. */
export function TypeOn({ text, progress }: { readonly text: string; readonly progress: number }): JSX.Element {
  const count = Math.round(Math.max(0, Math.min(1, progress)) * text.length);
  return <p className="font-mono text-sm text-foreground">{text.slice(0, count)}</p>;
}

/** 下划线从左画到右. */
export function UnderlineDraw({ text, progress }: { readonly text: string; readonly progress: number }): JSX.Element {
  const width = Math.max(0, Math.min(1, progress)) * 100;
  return (
    <p className="inline-block text-foreground">
      {text}
      <span className="mt-1 block h-px bg-foreground" style={{ width: `${width}%` }} />
    </p>
  );
}

/** 两段文字按进度交叉. */
export function CrossFade({ from, to, progress }: { readonly from: string; readonly to: string; readonly progress: number }): JSX.Element {
  const t = Math.max(0, Math.min(1, progress));
  return (
    <p className="relative h-8 text-foreground">
      <span className="absolute" style={{ opacity: 1 - t }}>{from}</span>
      <span className="absolute" style={{ opacity: t }}>{to}</span>
    </p>
  );
}

/** 滚动进度把一块内容钉住再换句. */
export function StickySwap({ progress, lines }: { readonly progress: number; readonly lines: readonly string[] }): JSX.Element {
  const index = Math.min(lines.length - 1, Math.floor(Math.max(0, progress) * lines.length));
  return <p className="text-xl text-foreground">{lines[index]}</p>;
}

export function EffectFrame({ children }: { readonly children: ReactNode }): JSX.Element {
  return <div className="rounded-xl border border-border bg-card p-4">{children}</div>;
}
