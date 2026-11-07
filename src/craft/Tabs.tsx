"use client";

import { useEffect, useLayoutEffect, useRef, useState, type JSX } from "react";
import { BUTTON_TYPE } from "../constants";
import { resting, type Channel } from "./spring";
import { useReducedMotion, useSpringNumber } from "./hooks";
import { MS, PX, SCALE, WEIGHT } from "./tokens";

export type CraftTab = { readonly id: string; readonly label: string };

/** 指示条跟文字等宽, x 与宽分开积分. 字重在 120ms 时切, 不插值. */
export function CraftTabs({
  tabs,
  value,
  onChange,
}: {
  readonly tabs: readonly CraftTab[];
  readonly value: string;
  readonly onChange: (id: string) => void;
}): JSX.Element {
  const reduced = useReducedMotion();
  const list = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ x: number; w: number; top: number } | null>(null);
  const [bold, setBold] = useState(value);
  const [squash, setSquash] = useState(false);

  useLayoutEffect(() => {
    const root = list.current;
    const current = root?.querySelector<HTMLElement>(`[data-tab="${value}"] span`);
    if (!root || !current) return;
    const rb = root.getBoundingClientRect();
    const lb = current.getBoundingClientRect();
    setBox({ x: lb.left - rb.left, w: lb.width, top: lb.bottom - rb.top + PX.indicatorGap });
  }, [value, tabs]);

  useEffect(() => {
    const id = window.setTimeout(() => setBold(value), MS.color);
    return () => window.clearTimeout(id);
  }, [value]);

  const x = useSpringNumber(box ? box.x : null, "thumb", reduced);
  const w = useSpringNumber(box ? box.w : null, "width", reduced);
  const place = useRef<Channel>({ x: 0, v: 0 });
  place.current.x = x;
  const left = box && resting(place.current, box.x) ? Math.round(box.x / PX.half) * PX.half : x;
  const width = box && resting({ x: w, v: 0 }, box.w) ? Math.round(box.w / PX.half) * PX.half : w;

  return (
    <div ref={list} role="tablist" className="relative inline-flex gap-1" style={{ paddingBottom: PX.indicatorGap + 2 }}>
      {tabs.map((tab) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            type={BUTTON_TYPE}
            role="tab"
            data-tab={tab.id}
            aria-selected={selected}
            className="rounded-md px-3 py-1 text-sm outline-1 outline-offset-2 outline-transparent transition-colors ease-out focus-visible:outline-ring"
            style={{
              transitionDuration: `${MS.color}ms`,
              transitionDelay: selected ? `${MS.colorLag}ms` : "0ms",
              color: selected ? "var(--foreground)" : "var(--muted-foreground)",
              fontWeight: bold === tab.id ? WEIGHT.selected : WEIGHT.rest,
            }}
            onPointerDown={() => {
              if (selected) setSquash(true);
            }}
            onPointerUp={() => setSquash(false)}
            onPointerCancel={() => setSquash(false)}
            onClick={() => onChange(tab.id)}
          >
            <span>{tab.label}</span>
          </button>
        );
      })}
      {box ? (
        <span
          aria-hidden
          className="absolute h-0.5 bg-foreground"
          style={{
            left: left,
            width,
            top: box.top,
            transform: squash && !reduced ? `scaleY(${SCALE.tabSquash})` : undefined,
            transition: reduced ? undefined : `transform ${MS.press}ms linear`,
          }}
        />
      ) : null}
    </div>
  );
}
