"use client";

import { useEffect, type JSX } from "react";
import { useTrack } from "../use-track";
import { SPRING_THUMB } from "../tokens";

const STEPS = ["排队", "制作", "校对", "落定"] as const;

/**
 * 过程. 当前步的连接线用弹簧伸长, 点按已完成的步会从当前长度反向收回.
 */
export function ProcessRail({ index }: { readonly index: number }): JSX.Element {
  const fill = useTrack(0, SPRING_THUMB);
  const target = Math.max(0, Math.min(STEPS.length - 1, index)) / (STEPS.length - 1);
  useEffect(() => {
    fill.setTarget(target);
  }, [target, fill.setTarget]);

  return (
    <ol className="grid grid-cols-4 gap-2 text-xs">
      {STEPS.map((label, step) => (
        <li key={label} className="text-foreground">
          <span className="mb-1 block h-1 overflow-hidden rounded-full bg-muted">
            <span className="block h-full bg-primary" style={{ width: step === 0 ? "100%" : `${Math.max(0, fill.value * (STEPS.length - 1) - (step - 1)) * 100}%` }} />
          </span>
          {label}
        </li>
      ))}
    </ol>
  );
}
