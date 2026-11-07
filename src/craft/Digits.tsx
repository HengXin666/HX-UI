"use client";

import { useEffect, useRef, type JSX } from "react";
import { digitDelay, resting, stepSpring, type Channel } from "./spring";
import { useReducedMotion } from "./hooks";
import { PX, SPRING } from "./tokens";

function Column({ digit, delay }: { readonly digit: number; readonly delay: number }): JSX.Element {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const state = useRef<Channel>({ x: 0, v: 0 });
  const moved = useRef(false);

  useEffect(() => {
    const paint = (pos: number): void => {
      const node = ref.current;
      if (!node) return;
      const shown = Math.abs(pos - digit) < PX.near ? digit : pos;
      node.style.transform = `translate3d(0, ${(-shown * PX.digitCell).toFixed(3)}em, 0)`;
    };
    if (reduced) {
      state.current = { x: digit, v: 0 };
      paint(digit);
      return undefined;
    }
    const startAt = performance.now() + (moved.current ? 0 : delay);
    let frame = 0;
    let last = performance.now();
    const tick = (now: number): void => {
      const dt = now - last;
      last = now;
      if (now >= startAt) {
        moved.current = true;
        stepSpring(state.current, digit, SPRING.digit, dt);
      }
      paint(state.current.x);
      if (now < startAt || !resting(state.current, digit)) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [digit, delay, reduced]);

  const cells = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  return (
    <span className="inline-block overflow-hidden align-bottom" style={{ width: `${PX.digitWidth}em`, height: `${PX.digitCell}em` }}>
      <span ref={ref} className="block">
        {cells.map((cell) => (
          <span key={cell} className="block text-center" style={{ height: `${PX.digitCell}em` }}>{cell}</span>
        ))}
      </span>
    </span>
  );
}

function pieces(value: number): Array<{ key: string; kind: "d"; digit: number; index: number } | { key: string; kind: "s"; char: string }> {
  const text = Math.max(0, Math.round(value)).toString();
  const out: Array<{ key: string; kind: "d"; digit: number; index: number } | { key: string; kind: "s"; char: string }> = [];
  let index = 0;
  for (let at = 0; at < text.length; at += 1) {
    const fromEnd = text.length - at;
    if (at > 0 && fromEnd % 3 === 0) out.push({ key: `s${at}`, kind: "s", char: "," });
    out.push({ key: `d${at}`, kind: "d", digit: Number(text[at]), index });
    index += 1;
  }
  return out;
}

/** 每位一条槽. 改目标时从当前小数位继续, 不跳回 0. 读屏只读终值. */
export function CraftDigits({ value, label }: { readonly value: number; readonly label?: string }): JSX.Element {
  const rows = pieces(value);
  const count = rows.filter((row) => row.kind === "d").length;
  return (
    <span className="inline-flex items-end font-semibold tabular-nums tracking-tight" aria-label={label}>
      <span className="sr-only">{Math.round(value)}</span>
      <span aria-hidden className="inline-flex items-end">
        {rows.map((row) => row.kind === "s" ? (
          <span key={row.key} className="px-0.5">{row.char}</span>
        ) : (
          <Column key={row.key} digit={row.digit} delay={digitDelay(row.index, count)} />
        ))}
      </span>
    </span>
  );
}
