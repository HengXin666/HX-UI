"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 CircularCarousel 条目, 实现为 HX 自有.

import { useEffect, useRef, useState, type JSX, type KeyboardEvent, type ReactNode, type WheelEvent } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { cn } from "../../primitives/utils";
import { useDrag } from "./parts/use-drag";
import * as R from "./parts/ring-spec";
import { KIT_FOCUS, MS_PER_S, useKitMotion } from "./tokens";

export { RING_SPRING, cruiseVelocity, ringActive, ringRadius, ringStep, ringTarget } from "./parts/ring-spec";

export interface RingItem {
  readonly image: string;
  readonly title: ReactNode;
  /** 给读屏的名字. */
  readonly label: string;
}

export interface RingCarouselProps {
  readonly items: readonly RingItem[];
  readonly defaultIndex?: number;
  readonly onIndexChange?: (index: number) => void;
  readonly cardWidth?: number;
  readonly cardHeight?: number;
  readonly gap?: number;
  readonly perspective?: number;
  /** 无人操作时缓慢自转. */
  readonly cruise?: boolean;
  /** 自转角速度 deg/s. */
  readonly cruiseSpeed?: number;
  readonly showTitle?: boolean;
  readonly ariaLabel?: string;
  readonly className?: string;
}

/**
 * 环形轮播: 卡片绕竖轴围成一圈, 角度由临界阻尼弹簧 (118) 驱动; 拖拽带着转, 松手吸到最近一项; 滚轮与方向键一次一项, 点卡片转到它.
 * 可选巡航: 无人操作时角速度按时间常数爬到 cruiseSpeed 匀速自转, 一碰就停并吸附. 屏幕外与页面隐藏时不跑帧.
 * 减弱动效时直接转到位, 不巡航.
 *
 * .agents/notes/implemented/feature/2026-11-09-kits-gallery.md
 */
export function RingCarousel({
  items,
  defaultIndex = 0,
  onIndexChange,
  cardWidth = 220,
  cardHeight = 300,
  gap = 24,
  perspective = 1200,
  cruise = false,
  cruiseSpeed = R.RING_CRUISE_DEG_S,
  showTitle = true,
  ariaLabel = "Carousel",
  className,
}: RingCarouselProps): JSX.Element {
  const reduced = useReducedMotion();
  const n = items.length;
  const step = R.ringStep(n);
  const radius = R.ringRadius(n, cardWidth, gap);
  const ring = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(defaultIndex);
  const s = useRef({ cruising: cruise, v: 0, start: 0, visible: true });

  const motion = useKitMotion(
    (m) => {
      const angle = m.get("a", -defaultIndex * step);
      if (ring.current) ring.current.style.transform = `translateZ(${-radius}px) rotateY(${angle}deg)`;
      const now = R.ringActive(angle, n);
      setActive((prev) => (prev === now ? prev : now));
    },
    reduced,
    (dtMs) => {
      const st = s.current;
      if (!st.cruising || reduced || !st.visible || document.visibilityState === "hidden") return false;
      st.v = R.cruiseVelocity(st.v, cruiseSpeed, dtMs);
      motion.jump("a", motion.get("a") - (st.v * dtMs) / MS_PER_S);
      return true;
    },
  );

  const activeRef = useRef(active);
  useEffect(() => {
    if (activeRef.current !== active) onIndexChange?.(active);
    activeRef.current = active;
  }, [active, onIndexChange]);

  const halt = (): void => {
    s.current.cruising = false;
    s.current.v = 0;
  };
  const goTo = (i: number): void => {
    halt();
    motion.spring("a", R.ringTarget(motion.get("a"), i, n), R.RING_SPRING);
  };
  const nudge = (dir: number): void => goTo(R.ringActive(motion.get("a"), n) + dir);

  useEffect(() => {
    motion.jump("a", -defaultIndex * step);
    s.current.cruising = cruise;
    if (cruise) motion.wake();
    const node = ring.current?.parentElement;
    if (!node || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(([entry]) => {
      s.current.visible = Boolean(entry?.isIntersecting);
      if (s.current.visible && s.current.cruising) motion.wake();
    });
    io.observe(node);
    return () => io.disconnect();
    // 只随项数与巡航开关重摆
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cruise, n]);

  const drag = useDrag({
    onStart: () => {
      halt();
      s.current.start = motion.get("a");
    },
    onMove: (dx) => motion.jump("a", s.current.start + dx * R.RING_DEG_PER_PX),
    onEnd: (vx) => {
      const fling = vx * MS_PER_S * R.RING_DEG_PER_PX;
      const angle = motion.get("a");
      const target = R.ringTarget(angle, R.ringActive(angle + fling * (1 / R.RING_SPRING.damping), n), n);
      motion.spring("a", target, R.RING_SPRING, fling);
    },
  });
  const onWheel = (event: WheelEvent<HTMLElement>): void => {
    const d = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (d) nudge(Math.sign(d));
  };
  const onKey = (event: KeyboardEvent<HTMLElement>): void => {
    const dir = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!dir) return;
    event.preventDefault();
    nudge(dir);
  };

  return (
    <section aria-roledescription="carousel" aria-label={ariaLabel} data-slot="ring-carousel" className={cn("flex w-full flex-col items-center gap-4", className)}>
      <div
        tabIndex={0}
        onKeyDown={onKey}
        onWheel={onWheel}
        className={cn("relative flex w-full touch-pan-y select-none items-center justify-center overflow-hidden", KIT_FOCUS)}
        style={{ height: cardHeight * 1.4, perspective }}
        {...drag.bind}
      >
        <div ref={ring} data-slot="ring-carousel-ring" className="relative" style={{ width: cardWidth, height: cardHeight, transformStyle: "preserve-3d", transform: `translateZ(${-radius}px) rotateY(${-defaultIndex * step}deg)` }}>
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              tabIndex={-1}
              aria-label={item.label}
              aria-current={i === active || undefined}
              onClick={() => {
                if (!drag.dragged()) goTo(i);
              }}
              data-slot="ring-carousel-card"
              className="absolute inset-0 overflow-hidden rounded-xl border-0 p-0 [backface-visibility:hidden]"
              style={{ transform: `rotateY(${i * step}deg) translateZ(${radius}px)` }}
            >
              <img src={item.image} alt="" draggable={false} className="size-full object-cover" />
            </button>
          ))}
        </div>
      </div>
      {showTitle && n > 0 ? (
        <p aria-live="polite" data-slot="ring-carousel-title" className="m-0 text-lg font-semibold">
          {items[active]?.title}
        </p>
      ) : null}
    </section>
  );
}
