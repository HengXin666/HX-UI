"use client";

import { useEffect, useRef, useState, type JSX } from "react";
import { digitEase } from "./spring";
import { DIGIT_MS, DIGIT_STAGGER_CAP, DIGIT_STAGGER_MS } from "./tokens";

const CELL = 1.2;
const BASE = 10;
const REDUCED = "(prefers-reduced-motion: reduce)";
const STRIP = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function glyphs(value: number): string[] {
  return Math.round(Math.abs(value)).toLocaleString("en-US").split("");
}

function gapFor(count: number): number {
  if (count <= 1) return 0;
  return Math.min(DIGIT_STAGGER_MS, (DIGIT_MS * DIGIT_STAGGER_CAP) / (count - 1));
}

function Digit({ from, to, delay }: { readonly from: number; readonly to: number; readonly delay: number }): JSX.Element {
  const [offset, setOffset] = useState(to);
  const frame = useRef(0);
  useEffect(() => {
    if (window.matchMedia?.(REDUCED).matches) {
      setOffset(to);
      return;
    }
    const began = performance.now();
    const loop = (now: number): void => {
      const t = Math.min(1, Math.max(0, (now - began - delay) / DIGIT_MS));
      setOffset(from + (to - from) * digitEase(t));
      if (t < 1) frame.current = requestAnimationFrame(loop);
    };
    frame.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame.current);
  }, [from, to, delay]);
  return (
    <span className="inline-block overflow-hidden" style={{ height: `${CELL}em`, width: "0.62em" }}>
      <span className="block" style={{ transform: `translateY(${-(((offset % BASE) + BASE) % BASE) * CELL}em)` }}>
        {STRIP.map((n) => (
          <span key={n} className="block text-center" style={{ height: `${CELL}em` }}>{n}</span>
        ))}
      </span>
    </span>
  );
}

/** 每位一条槽. 改值时从当前位继续滚, 不跳回 0. */
export function NumberRoll({ value, className }: { readonly value: number; readonly className?: string }): JSX.Element {
  const previous = useRef(glyphs(value));
  const [pair, setPair] = useState({ from: glyphs(value), to: glyphs(value) });
  useEffect(() => {
    const next = glyphs(value);
    setPair({ from: previous.current, to: next });
    previous.current = next;
  }, [value]);
  const width = Math.max(pair.from.length, pair.to.length);
  const gap = gapFor(width);
  const sign = value < 0 ? "-" : "";
  return (
    <span className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      <span aria-hidden className="inline-flex items-end">
        {sign}
        {Array.from({ length: width }, (_, index) => {
          const fromChar = pair.from[pair.from.length - width + index] ?? "0";
          const toChar = pair.to[pair.to.length - width + index] ?? "0";
          if (fromChar === "," || toChar === ",") return <span key={index}>,</span>;
          return <Digit key={index} from={Number(fromChar) || 0} to={Number(toChar) || 0} delay={gap * index} />;
        })}
      </span>
      <span className="sr-only">{value}</span>
    </span>
  );
}
