"use client";

import { useState, type JSX } from "react";
import { BUTTON_TYPE } from "../constants";
import { useSpringNumber } from "./hooks";
import { useReducedMotion } from "./hooks";
import { PX } from "./tokens";

const POINTS = [24, 46, 70, 88];

/** 值冲出当前刻度时, 坐标轴和线一起重标, 线不从零重画. */
export function AxisShock(): JSX.Element {
  const reduced = useReducedMotion();
  const [spike, setSpike] = useState(false);
  const domain = useSpringNumber(spike ? PX.axisNext : PX.axisDomain, "thumb", reduced);
  const values = spike ? [...POINTS, PX.axisOver] : POINTS;
  const width = 280;
  const height = 120;
  const step = width / (values.length - 1);
  const path = values.map((value, index) => {
    const x = index * step;
    const y = height - (value / Math.max(domain, 1)) * (height - 16);
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
  const ceiling = height - (PX.axisDomain / Math.max(domain, 1)) * (height - 16);

  return (
    <div className="grid gap-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-32 w-full text-foreground" role="img" aria-label="坐标轴重标">
        <line x1="0" y1={ceiling} x2={width} y2={ceiling} stroke="currentColor" strokeOpacity="0.25" />
        <path d={path} fill="none" stroke="currentColor" strokeWidth="1" />
      </svg>
      <button type={BUTTON_TYPE} className="text-sm text-muted-foreground" onClick={() => setSpike((on) => !on)}>
        {spike ? "收回尖峰" : "让它冲出刻度"}
      </button>
    </div>
  );
}
