"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 CardSwap 条目, 实现为 HX 自有.

import { useEffect, useRef, useState, type JSX, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { cn } from "../../primitives/utils";
import * as S from "./parts/swap-spec";
import { KIT_FOCUS, MS_PER_S, useDrag, useKitMotion } from "./tokens";

export { SWAP_DEFAULTS, swapPointer, swapShouldCycle, swapSlot, swapStagger } from "./parts/swap-spec";

export interface CycleCard {
  readonly content: ReactNode;
  readonly label: string;
}

export interface CycleDeckProps {
  readonly cards: readonly CycleCard[];
  readonly width?: number;
  readonly height?: number;
  readonly cardDistance?: number;
  readonly verticalDistance?: number;
  /** 自动轮换间隔 ms, 下限 400. 0 为不自动. */
  readonly delay?: number;
  readonly skew?: number;
  readonly speed?: number;
  readonly pauseOnHover?: boolean;
  /** 指针视差与悬停张开. */
  readonly interactive?: boolean;
  readonly onCardClick?: (index: number) => void;
  readonly onChange?: (front: number) => void;
  readonly ariaLabel?: string;
  readonly className?: string;
}

/**
 * 轮换卡组: 卡片沿右上斜向纵深排开, 每隔 delay 最前一张向下落出台面再回到最后, 其余按 0.05s / speed 错峰前移.
 * 最前一张可拖, 拖过短边 0.3 或甩出超过 700px/s 即换牌. 指针带动整台视差, 悬停张开. 悬停, 聚焦, 拖拽, 离屏与页面隐藏时暂停.
 * 减弱动效时不自动轮换, 无视差, 换牌直接到位.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-stack.md
 */
export function CycleDeck({
  cards,
  width = S.SWAP_DEFAULTS.width,
  height = S.SWAP_DEFAULTS.height,
  cardDistance = S.SWAP_DEFAULTS.cardDistance,
  verticalDistance = S.SWAP_DEFAULTS.verticalDistance,
  delay = S.SWAP_DEFAULTS.delay,
  skew = S.SWAP_DEFAULTS.skew,
  speed = S.SWAP_DEFAULTS.speed,
  pauseOnHover = true,
  interactive = true,
  onCardClick,
  onChange,
  ariaLabel = "Card deck",
  className,
}: CycleDeckProps): JSX.Element {
  const reduced = useReducedMotion();
  const n = cards.length;
  const stage = useRef<HTMLDivElement>(null);
  const nodes = useRef<Array<HTMLDivElement | null>>([]);
  const [order, setOrder] = useState(() => cards.map((_, i) => i));
  const [holds, setHolds] = useState(0);
  const [inView, setInView] = useState(true);
  const live = useRef({ order, exiting: -1, held: -1, hover: false });
  live.current.order = order;
  const springs = S.swapSprings(speed);

  const motion = useKitMotion((m) => {
    if (stage.current) stage.current.style.transform = `rotateY(${m.get("px") * S.SWAP_TILT_DEG}deg) rotateX(${-m.get("py") * S.SWAP_TILT_DEG}deg)`;
    nodes.current.forEach((node, i) => {
      if (node) node.style.transform = `translate3d(${m.get(`x${i}`)}px, ${m.get(`y${i}`)}px, ${m.get(`z${i}`)}px) skewY(${skew}deg)`;
    });
  }, reduced);

  const place = (list: readonly number[], spread: number, stagger: number, spec = springs.rest): void => {
    list.forEach((card, k) => {
      if (card === live.current.exiting || card === live.current.held) return;
      const slot = S.swapSlot(k, cardDistance, verticalDistance, spread);
      const wait = k * stagger * MS_PER_S;
      motion.spring(`x${card}`, slot.x, spec, undefined, wait);
      motion.spring(`y${card}`, slot.y, spec, undefined, wait);
      motion.spring(`z${card}`, slot.z, spec, undefined, wait);
      const node = nodes.current[card];
      if (node) node.style.zIndex = String(n - k);
    });
  };
  const spreadNow = (): number => (interactive && !reduced && live.current.hover ? S.SWAP_HOVER_SPREAD : 1);

  useEffect(() => {
    place(order, spreadNow(), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardDistance, verticalDistance, skew, reduced]);

  useEffect(() => {
    if (reduced || !stage.current?.animate) return;
    stage.current.animate([{ opacity: 0 }, { opacity: 1 }], { duration: S.SWAP_INTRO_MS, easing: "ease-out" });
  }, [reduced]);

  const cycle = (dx = 0, dy = 0, vy = 0): void => {
    const front = live.current.order[0];
    if (front === undefined || n < 2 || live.current.exiting >= 0) return;
    const next = [...live.current.order.slice(1), front];
    const finish = (): void => {
      live.current.exiting = -1;
      setOrder(next);
      place(next, spreadNow(), 0);
      onChange?.(next[0] ?? 0);
    };
    if (reduced) return finish();
    live.current.exiting = front;
    motion.spring(`x${front}`, dx, springs.exit);
    motion.spring(`y${front}`, Math.max(dy, 0) + height + S.SWAP_PAD, springs.exit, vy);
    place(next, spreadNow(), S.swapStagger(speed));
    window.setTimeout(finish, S.SWAP_EXIT_MS / Math.max(0.1, speed));
  };

  const drag = useDrag({
    onStart: () => {
      live.current.held = live.current.order[0] ?? -1;
      setHolds((h) => h + 1);
    },
    onMove: (dx, dy) => {
      const card = live.current.held;
      if (card < 0) return;
      motion.jump(`x${card}`, dx);
      motion.jump(`y${card}`, dy);
    },
    onEnd: (vx, vy) => {
      const card = live.current.held;
      live.current.held = -1;
      setHolds((h) => h - 1);
      if (card < 0) return;
      const dx = motion.get(`x${card}`);
      const dy = motion.get(`y${card}`);
      if (S.swapShouldCycle(dx, dy, Math.hypot(vx, vy) * MS_PER_S, width, height)) cycle(dx, dy, vy * MS_PER_S);
      else place(live.current.order, spreadNow(), 0);
    },
  }, n > 1);

  const cycleRef = useRef(cycle);
  cycleRef.current = cycle;
  useEffect(() => {
    const node = stage.current?.parentElement;
    if (!node || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(([entry]) => setInView(Boolean(entry?.isIntersecting)));
    io.observe(node);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!delay || reduced || holds > 0 || !inView || n < 2) return undefined;
    const id = window.setInterval(() => {
      if (document.visibilityState !== "hidden") cycleRef.current();
    }, Math.max(S.SWAP_MIN_DELAY_MS, delay));
    return () => window.clearInterval(id);
  }, [delay, holds, inView, n, reduced]);

  const hover = (on: boolean): void => {
    live.current.hover = on;
    if (pauseOnHover) setHolds((h) => h + (on ? 1 : -1));
    if (!interactive || reduced) return;
    place(live.current.order, on ? S.SWAP_HOVER_SPREAD : 1, 0, S.SWAP_SPREAD_SPRING);
    if (!on) {
      motion.spring("px", 0, S.SWAP_PARALLAX_SPRING);
      motion.spring("py", 0, S.SWAP_PARALLAX_SPRING);
    }
  };
  const onMove = (event: PointerEvent<HTMLDivElement>): void => {
    if (!interactive || reduced) return;
    const box = event.currentTarget.getBoundingClientRect();
    const [px, py] = S.swapPointer(event.clientX - box.left, event.clientY - box.top, box.width, box.height);
    motion.spring("px", px, S.SWAP_PARALLAX_SPRING);
    motion.spring("py", py, S.SWAP_PARALLAX_SPRING);
  };
  const onKey = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== "ArrowRight" && event.key !== "Enter") return;
    event.preventDefault();
    cycle();
  };
  const front = order[0] ?? 0;

  return (
    <div
      role="group"
      aria-roledescription="card deck"
      aria-label={ariaLabel}
      tabIndex={0}
      data-slot="cycle-deck"
      onKeyDown={onKey}
      onFocus={() => setHolds((h) => h + 1)}
      onBlur={() => setHolds((h) => h - 1)}
      onMouseEnter={() => hover(true)}
      onMouseLeave={() => hover(false)}
      onPointerMove={onMove}
      className={cn("relative select-none", KIT_FOCUS, className)}
      style={{ width: width + cardDistance * (n - 1), height: height + verticalDistance * (n - 1), perspective: S.SWAP_PERSPECTIVE }}
    >
      <span className="sr-only" aria-live="polite">
        {cards[front]?.label}
      </span>
      <div ref={stage} className="absolute bottom-0 left-0 [transform-style:preserve-3d]" style={{ width, height }}>
        {cards.map((card, i) => (
          <div
            key={i}
            ref={(node) => {
              nodes.current[i] = node;
            }}
            aria-hidden={i !== front || undefined}
            data-slot="cycle-deck-card"
            onClick={() => {
              if (!drag.dragged()) onCardClick?.(i);
            }}
            {...(i === front ? drag.bind : {})}
            className="absolute inset-0 overflow-hidden rounded-xl border border-border bg-card will-change-transform [backface-visibility:hidden]"
          >
            {card.content}
          </div>
        ))}
      </div>
    </div>
  );
}
