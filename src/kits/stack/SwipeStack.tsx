"use client";
// 行为规格参照 docs/research/catalog/components-2.md 的 Stack 条目, 实现为 HX 自有.

import { useEffect, useRef, useState, type JSX, type KeyboardEvent, type ReactNode } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { cn } from "../../primitives/utils";
import * as W from "./parts/swipe-spec";
import { KIT_FOCUS, MS_PER_S, kitTone, useKitMotion, type KitTone } from "../tokens";
import { useDrag } from "../gallery/parts/use-drag";

export { SWIPE_DEFAULTS, exitVector, leanDeg, rotateOrder, shouldSend, slotPose, type SwipeLayout } from "./parts/swipe-spec";

export interface SwipeCard {
  readonly content: ReactNode;
  readonly label: string;
}

export interface SwipeStackProps {
  readonly cards: readonly SwipeCard[];
  readonly layout?: W.SwipeLayout;
  readonly visible?: number;
  readonly spread?: number;
  readonly depth?: number;
  readonly radius?: number;
  /** 卡框宽 px, 0 为无框. */
  readonly frame?: number;
  readonly frameTone?: KitTone;
  readonly shadow?: boolean;
  readonly tilt?: number;
  readonly threshold?: number;
  readonly speed?: number;
  readonly sendToBackOnClick?: boolean;
  readonly autoplay?: boolean;
  readonly autoplayDelay?: number;
  readonly pauseOnHover?: boolean;
  /** 顶牌换了: 参数为顶牌在 cards 里的序号. */
  readonly onChange?: (top: number) => void;
  readonly width?: number;
  readonly height?: number;
  readonly ariaLabel?: string;
  readonly className?: string;
}

/**
 * 拖拽牌堆: 顶牌可拖, 按住放大 1.035, 拖动随横向位移倾斜; 拖过 threshold (90px) 或甩出超过 650px/s 时顺拖拽方向离场再回到底部, 否则带速度弹回.
 * 点击 (可选), 方向键, Enter 与自动播放按布局方向送牌. 布局 fan / cascade / deck / pile. 减弱动效时直接换序.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-stack.md
 */
export function SwipeStack({
  cards,
  layout = "fan",
  visible = W.SWIPE_DEFAULTS.visible,
  spread = W.SWIPE_DEFAULTS.spread,
  depth = W.SWIPE_DEFAULTS.depth,
  radius = W.SWIPE_DEFAULTS.radius,
  frame = 0,
  frameTone = "background",
  shadow = true,
  tilt = W.SWIPE_DEFAULTS.tilt,
  threshold = W.SWIPE_DEFAULTS.threshold,
  speed = W.SWIPE_DEFAULTS.speed,
  sendToBackOnClick = false,
  autoplay = false,
  autoplayDelay = W.SWIPE_DEFAULTS.autoplayDelay,
  pauseOnHover = false,
  onChange,
  width = 240,
  height = 320,
  ariaLabel = "Card stack",
  className,
}: SwipeStackProps): JSX.Element {
  const reduced = useReducedMotion();
  const n = cards.length;
  const nodes = useRef<Array<HTMLDivElement | null>>([]);
  const [order, setOrder] = useState(() => cards.map((_, i) => i));
  const [hover, setHover] = useState(false);
  const live = useRef({ order, exiting: -1, held: -1 });
  live.current.order = order;
  const spring = W.swipeSpring(speed);

  const motion = useKitMotion((m) => {
    nodes.current.forEach((node, i) => {
      if (!node) return;
      node.style.transform = `translate(${m.get(`x${i}`)}px, ${m.get(`y${i}`)}px) rotate(${m.get(`r${i}`)}deg) scale(${m.get(`s${i}`, 1)})`;
      node.style.opacity = String(m.get(`o${i}`, 1));
    });
  }, reduced);

  const place = (list: readonly number[], delayStep = 0): void => {
    list.forEach((card, p) => {
      if (card === live.current.exiting || card === live.current.held) return;
      const pose = W.slotPose(layout, p, visible, spread, depth, tilt, card);
      const delay = p * delayStep;
      motion.spring(`x${card}`, pose.x, spring, undefined, delay);
      motion.spring(`y${card}`, pose.y, spring, undefined, delay);
      motion.spring(`r${card}`, pose.rotate, spring, undefined, delay);
      motion.spring(`s${card}`, pose.scale, spring, undefined, delay);
      motion.ease(`o${card}`, pose.opacity, W.SWIPE_FADE_MS / 3 / speed, 0);
      const node = nodes.current[card];
      if (node) node.style.zIndex = String(n - p);
    });
  };

  const mounted = useRef(false);
  useEffect(() => {
    place(order, mounted.current || reduced ? 0 : W.SWIPE_MOUNT_STAGGER_MS);
    mounted.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, layout, visible, spread, depth, tilt, speed, reduced]);

  const commit = (next: number[]): void => {
    setOrder(next);
    if (next[0] !== undefined) onChange?.(next[0]);
  };
  const send = (dx = 0, dy = 0, vx = 0, vy = 0): void => {
    const top = live.current.order[0];
    if (top === undefined || n < 2 || live.current.exiting >= 0) return;
    const next = W.rotateOrder(live.current.order, 1);
    if (reduced) return commit(next);
    const [ux, uy] = W.exitVector(layout, dx, dy);
    const reach = Math.hypot(width, height) * W.SWIPE_EXIT_REACH;
    live.current.exiting = top;
    motion.spring(`x${top}`, ux * reach, spring, vx);
    motion.spring(`y${top}`, uy * reach, spring, vy);
    window.setTimeout(() => {
      live.current.exiting = -1;
      commit(next);
    }, W.SWIPE_FADE_MS / Math.max(0.1, speed));
  };
  const back = (): void => commit(W.rotateOrder(live.current.order, -1));

  const drag = useDrag(
    {
      onStart: () => {
        live.current.held = order[0] ?? -1;
      },
      onMove: (dx, dy) => {
        const top = live.current.held;
        if (top < 0) return;
        motion.jump(`x${top}`, dx);
        motion.jump(`y${top}`, dy);
        motion.jump(`r${top}`, W.leanDeg(dx));
        motion.spring(`s${top}`, reduced ? 1 : W.SWIPE_PRESS_SCALE, spring);
      },
      onEnd: (vx, vy) => {
        const top = live.current.held;
        live.current.held = -1;
        if (top < 0) return;
        const dx = motion.get(`x${top}`);
        const dy = motion.get(`y${top}`);
        if (W.shouldSend(dx, dy, Math.hypot(vx, vy) * MS_PER_S, threshold, n)) send(dx, dy, vx * MS_PER_S, vy * MS_PER_S);
        else place(live.current.order);
      },
    },
    n > 1,
  );

  const sendRef = useRef(send);
  sendRef.current = send;
  useEffect(() => {
    if (!autoplay || reduced || n < 2 || (pauseOnHover && hover)) return undefined;
    const id = window.setInterval(() => {
      if (document.visibilityState !== "hidden" && live.current.held < 0) sendRef.current();
    }, autoplayDelay);
    return () => window.clearInterval(id);
  }, [autoplay, autoplayDelay, hover, n, pauseOnHover, reduced]);

  const onKey = (event: KeyboardEvent<HTMLDivElement>): void => {
    const act = { ArrowRight: () => send(), Enter: () => send(), " ": () => send(), ArrowLeft: back }[event.key];
    if (!act) return;
    event.preventDefault();
    act();
  };
  const [ox, oy] = W.SWIPE_ORIGINS[layout];
  const top = order[0] ?? 0;

  return (
    <div
      role="group"
      aria-roledescription="card stack"
      aria-label={ariaLabel}
      tabIndex={0}
      data-slot="swipe-stack"
      onKeyDown={onKey}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={cn("relative touch-none select-none", KIT_FOCUS, className)}
      style={{ width, height }}
    >
      <span className="sr-only" aria-live="polite">
        {cards[top]?.label}
      </span>
      {cards.map((card, i) => (
        <div
          key={i}
          ref={(node) => {
            nodes.current[i] = node;
          }}
          aria-hidden={i !== top || undefined}
          data-slot="swipe-stack-card"
          onClick={() => {
            if (!drag.dragged() && sendToBackOnClick && i === top) send();
          }}
          {...(i === top ? drag.bind : {})}
          className={cn("absolute inset-0 overflow-hidden will-change-transform", i === top && "cursor-grab active:cursor-grabbing")}
          style={{
            borderRadius: radius,
            transformOrigin: `${ox * 100}% ${oy * 100}%`,
            boxShadow: shadow ? W.SWIPE_SHADOW : undefined,
            border: frame ? `${frame}px solid ${kitTone(frameTone)}` : undefined,
          }}
        >
          {card.content}
        </div>
      ))}
    </div>
  );
}
