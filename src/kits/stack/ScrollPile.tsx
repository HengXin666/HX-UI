"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 ScrollStack 条目, 实现为 HX 自有.

import { Children, useEffect, useRef, type JSX, type ReactNode } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { cn } from "../../primitives/utils";
import * as P from "./parts/pile-spec";
import { KIT_FOCUS, useKitMotion } from "./tokens";

export { PILE_DEFAULTS, pileComplete, pilePose, pileSmooth, pinAt, stackOffset, type PilePose } from "./parts/pile-spec";

export interface ScrollPileProps {
  readonly children: ReactNode;
  /** 卡与卡的布局间距 px. */
  readonly itemDistance?: number;
  /** 叠起后每张错开 px. */
  readonly itemStackDistance?: number;
  /** 钉住线: 数字为 px, "15%" 为视口高比例. */
  readonly stackPosition?: number | string;
  readonly itemScale?: number;
  readonly baseScale?: number;
  readonly dimAmount?: number;
  readonly blurAmount?: number;
  /** 被盖住时绕 X 轴后仰的角度 deg. */
  readonly tiltAmount?: number;
  readonly rotationAmount?: number;
  /** 最后一张钉住后再停留的滚动距离 px. */
  readonly holdDistance?: number;
  readonly smoothScroll?: boolean;
  readonly height?: number | string;
  readonly onStackComplete?: () => void;
  readonly ariaLabel?: string;
  readonly className?: string;
}

/**
 * 滚动叠卡: 卡片滚到钉住线后停住, 后面的卡依次盖上并错开 itemStackDistance, 被盖住的卡缩小, 压暗, 可模糊与转动;
 * 最后一张钉住再过 holdDistance 后整叠一起离开. 滚轮按规格的帧率无关平滑 (每 1/60 秒剩 0.9) 推进. 减弱动效时用原生滚动, 无模糊与转动.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-stack.md
 */
export function ScrollPile({
  children,
  itemDistance = P.PILE_DEFAULTS.itemDistance,
  itemStackDistance = P.PILE_DEFAULTS.itemStackDistance,
  stackPosition = P.PILE_DEFAULTS.stackPosition,
  itemScale = P.PILE_DEFAULTS.itemScale,
  baseScale = P.PILE_DEFAULTS.baseScale,
  dimAmount = P.PILE_DEFAULTS.dimAmount,
  blurAmount = P.PILE_DEFAULTS.blurAmount,
  tiltAmount = P.PILE_DEFAULTS.tiltAmount,
  rotationAmount = P.PILE_DEFAULTS.rotationAmount,
  holdDistance = P.PILE_DEFAULTS.holdDistance,
  smoothScroll = true,
  height = "100%",
  onStackComplete,
  ariaLabel = "Card stack",
  className,
}: ScrollPileProps): JSX.Element {
  const reduced = useReducedMotion();
  const cards = Children.toArray(children);
  const n = cards.length;
  const scroller = useRef<HTMLDivElement>(null);
  const nodes = useRef<Array<HTMLDivElement | null>>([]);
  const s = useRef({ goal: 0, current: 0, smoothing: false, done: false });
  const complete = useRef(onStackComplete);
  complete.current = onStackComplete;

  const paint = (): void => {
    const el = scroller.current;
    if (!el) return;
    const tops = nodes.current.slice(0, n).map((node) => node?.offsetTop ?? 0);
    const o: P.PileOptions = {
      stack: P.stackOffset(stackPosition, el.clientHeight),
      itemStackDistance,
      itemScale,
      baseScale,
      dimAmount,
      blurAmount: reduced ? 0 : blurAmount,
      tiltAmount: reduced ? 0 : tiltAmount,
      rotationAmount: reduced ? 0 : rotationAmount,
      holdDistance,
    };
    const scroll = el.scrollTop;
    nodes.current.slice(0, n).forEach((node, i) => {
      if (!node) return;
      const pose = P.pilePose(i, tops, scroll, o);
      node.style.transform = `translate3d(0, ${pose.y}px, 0) perspective(1000px) rotateX(${pose.tilt}deg) rotate(${pose.rotate}deg) scale(${pose.scale})`;
      node.style.filter = `brightness(${pose.brightness})${pose.blur ? ` blur(${pose.blur}px)` : ""}`;
    });
    const done = P.pileComplete(tops, scroll, o);
    if (done && !s.current.done) complete.current?.();
    s.current.done = done;
  };

  const motion = useKitMotion(paint, reduced, (dtMs) => {
    const st = s.current;
    const el = scroller.current;
    if (!st.smoothing || !el) return false;
    st.current = P.pileSmooth(st.current, st.goal, dtMs);
    el.scrollTop = st.current;
    if (st.current === st.goal) st.smoothing = false;
    return st.smoothing;
  });

  useEffect(() => {
    const el = scroller.current;
    if (!el) return undefined;
    const onWheel = (event: WheelEvent): void => {
      if (reduced || !smoothScroll || event.ctrlKey) return;
      event.preventDefault();
      const st = s.current;
      if (!st.smoothing) st.current = el.scrollTop;
      st.goal = Math.min(Math.max(0, el.scrollHeight - el.clientHeight), Math.max(0, (st.smoothing ? st.goal : el.scrollTop) + event.deltaY));
      st.smoothing = true;
      motion.wake();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => motion.paint());
    ro?.observe(el);
    motion.paint();
    return () => {
      el.removeEventListener("wheel", onWheel);
      ro?.disconnect();
    };
  }, [motion, reduced, smoothScroll]);

  const onScroll = (): void => {
    const st = s.current;
    const el = scroller.current;
    // 滚动条, 触摸或键盘带来的外部滚动: 放弃平滑, 从当前位置接着走
    if (el && st.smoothing && Math.abs(el.scrollTop - st.current) > 1) st.smoothing = false;
    motion.paint();
  };
  const stop = (): void => {
    s.current.smoothing = false;
  };

  return (
    <div
      ref={scroller}
      role="region"
      tabIndex={0}
      aria-label={ariaLabel}
      data-slot="scroll-pile"
      onScroll={onScroll}
      onPointerDown={stop}
      onPointerCancel={stop}
      className={cn("relative overflow-y-auto overscroll-contain", KIT_FOCUS, className)}
      style={{ height }}
    >
      <div className="relative px-4" style={{ paddingTop: 1, paddingBottom: `calc(${holdDistance}px + 50%)` }}>
        {cards.map((card, i) => (
          <div
            key={i}
            ref={(node) => {
              nodes.current[i] = node;
            }}
            data-slot="scroll-pile-card"
            className="relative origin-top will-change-transform"
            style={{ marginBottom: i < n - 1 ? itemDistance : 0, zIndex: i + 1 }}
          >
            {card}
          </div>
        ))}
      </div>
    </div>
  );
}
