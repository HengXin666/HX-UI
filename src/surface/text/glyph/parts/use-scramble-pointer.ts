"use client";
// 行为规格参照 docs/research/catalog/textanimations.md 的 ScrambledText 条目, 实现为 HX 自有.

import { useRef, useState, type RefObject } from "react";
import { useFrameLoop } from "../../../../motion/frame/use-frame-loop";
import { centerDistance, usePointerField } from "../../kernel/pointer";
import { DOUBLE, MS_PER_S, TEXT_CLOCK } from "../../kernel/tokens";

/**
 * 指针邻近乱码: 指针扫过时, 半径内的格乱码一段时间, 越近越久 (中心处为 duration, 半径处为 0).
 * 按下时半径加倍, 一次乱一片. 每格只记 "乱到何时", 帧循环在还有格没到点时继续排帧.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-text-glyph.md
 */
export interface ScramblePointer {
  /** 每格乱到的时间戳 (performance.now 口径). */
  readonly until: readonly number[];
  /** 本帧时间戳. */
  readonly now: number;
}

/** 某一格因一次指针经过而乱到何时. 半径外返回 -Infinity. */
export function scrambleUntil(now: number, distance: number, radius: number, durationS: number): number {
  if (radius <= 0 || distance >= radius) return Number.NEGATIVE_INFINITY;
  return now + durationS * MS_PER_S * (1 - distance / radius);
}

export function useScramblePointer(root: RefObject<HTMLElement | null>, cells: RefObject<(HTMLElement | null)[]>, radius: number, durationS: number, enabled: boolean): ScramblePointer {
  const until = useRef<number[]>([]);
  const [now, setNow] = useState(0);
  const loop = useFrameLoop((_, t) => {
    setNow(t);
    return until.current.some((u) => u > t);
  }, TEXT_CLOCK);

  usePointerField(
    root,
    (field, kind) => {
      const host = root.current;
      if (!host || kind === "leave" || kind === "up") return;
      const base = host.getBoundingClientRect();
      const t = performance.now();
      const reach = kind === "down" ? radius * DOUBLE : radius;
      (cells.current ?? []).forEach((el, i) => {
        if (!el) return;
        const end = scrambleUntil(t, centerDistance(field.x + base.left, field.y + base.top, el.getBoundingClientRect()), reach, durationS);
        if (end > (until.current[i] ?? 0)) until.current[i] = end;
      });
      loop.wake();
    },
    { enabled },
  );

  return { until: until.current, now };
}
