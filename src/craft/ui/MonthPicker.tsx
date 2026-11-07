"use client";

import { useState, type JSX } from "react";
import { useTrack } from "../use-track";
import { SPRING_THUMB } from "../tokens";

const BUTTON = "button";
const MONTHS = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];

/**
 * 日期. 换月按方向滑入, 往回拨从当前位移反向.
 */
export function CraftMonth({
  value,
  onChange,
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
}): JSX.Element {
  const [cursor, setCursor] = useState(() => new Date());
  const slide = useTrack(0, SPRING_THUMB);
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const days = new Date(year, month + 1, 0).getDate();

  const turn = (delta: number): void => {
    slide.setCurrent(delta > 0 ? -24 : 24, 0);
    slide.setTarget(0);
    setCursor(new Date(year, month + delta, 1));
  };

  return (
    <div className="w-64 rounded-xl border border-border bg-card p-3 text-sm">
      <div className="mb-2 flex items-center justify-between">
        <button type={BUTTON} className="h-7 w-7 rounded-md border border-border" onClick={() => turn(-1)} aria-label="上个月">‹</button>
        <span className="text-foreground">{year} {MONTHS[month]}</span>
        <button type={BUTTON} className="h-7 w-7 rounded-md border border-border" onClick={() => turn(1)} aria-label="下个月">›</button>
      </div>
      <div className="grid grid-cols-7 gap-1" style={{ transform: `translate3d(${slide.value}px, 0, 0)` }}>
        {Array.from({ length: days }, (_, index) => {
          const day = index + 1;
          const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const selected = iso === value;
          return (
            <button
              key={iso}
              type={BUTTON}
              aria-pressed={selected}
              className="h-8 rounded-md text-foreground hover:bg-accent/60 aria-pressed:bg-primary aria-pressed:text-primary-foreground"
              onClick={() => onChange(iso)}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
