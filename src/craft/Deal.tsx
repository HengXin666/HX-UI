"use client";

import { useEffect, useRef, type JSX, type ReactNode } from "react";
import { dealCue } from "./spring";
import { useReducedMotion } from "./hooks";
import { EASE, MS, PX } from "./tokens";

/** 按发牌时刻进入. 阴影比位移晚 80ms. 减弱动效直接是落幅. */
export function DealCard({
  index,
  count,
  children,
  className,
}: {
  readonly index: number;
  readonly count: number;
  readonly children: ReactNode;
  readonly className?: string;
}): JSX.Element {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (reduced) {
      node.style.opacity = "1";
      node.style.transform = "";
      node.style.boxShadow = "0 2px 0 0 var(--border)";
      return undefined;
    }
    node.style.opacity = "0";
    node.style.transform = `translate3d(0, ${PX.dealIn}px, 0)`;
    node.style.boxShadow = "0 8px 0 0 var(--border)";
    const id = window.setTimeout(() => {
      node.style.transitionProperty = "opacity, transform, box-shadow";
      node.style.transitionDuration = `${MS.dealFlight}ms, ${MS.dealFlight}ms, ${MS.dealFlight}ms`;
      node.style.transitionDelay = `0ms, 0ms, ${MS.lag}ms`;
      node.style.transitionTimingFunction = `cubic-bezier(${EASE.out.join(",")})`;
      node.style.opacity = "1";
      node.style.transform = "";
      node.style.boxShadow = "0 2px 0 0 var(--border)";
    }, dealCue(index, count));
    return () => window.clearTimeout(id);
  }, [index, count, reduced]);

  return <div ref={ref} className={className}>{children}</div>;
}
