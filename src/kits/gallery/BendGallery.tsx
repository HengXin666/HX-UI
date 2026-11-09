"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 CircularGallery 条目, 实现为 HX 自有.
// ENGINE-GAP: 规格用 WebGL 网格把卡片按弧弯曲, 并做波纹 (uWave), 阴影 (uShadow), 边缘渐隐和画布文字.
// 内核没有顶点通道, 这里每张卡片整体沿圆弧摆放与转动, 卡片本身不弯曲; 无波纹, 标题用 DOM 文字.

import { useEffect, useRef, useState, type JSX, type KeyboardEvent, type ReactNode, type WheelEvent } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { cn } from "../../primitives/utils";
import { slideOffset } from "./parts/carousel-spec";
import { useDrag } from "./parts/use-drag";
import * as B from "./parts/bend-spec";
import { KIT_FOCUS, MS_PER_S, useKitMotion, wrapIndex } from "./tokens";

export { BEND_DEFAULTS, arcPlace, followFactor } from "./parts/bend-spec";

export interface BendItem {
  readonly image: string;
  readonly title: ReactNode;
  readonly label: string;
}

export interface BendGalleryProps {
  readonly items: readonly BendItem[];
  readonly bend?: number;
  readonly cardWidth?: number;
  /** 卡片宽高比 (宽 / 高). */
  readonly itemAspect?: number;
  /** 卡片间距, 卡宽的比例. */
  readonly gap?: number;
  readonly scrollSpeed?: number;
  /** 每帧 (60fps 计) 跟上目标的比例. */
  readonly scrollEase?: number;
  readonly snap?: boolean;
  /** 自动滚动速度, 每秒 0.25 × 该值个间距. */
  readonly autoScroll?: number;
  readonly showTitles?: boolean;
  readonly onItemClick?: (index: number) => void;
  readonly onActiveChange?: (index: number) => void;
  readonly ariaLabel?: string;
  readonly className?: string;
}

/**
 * 弯曲长廊: 卡片排成一条循环长廊, 按距中心的横向偏移落在圆弧上并转向; 滚轮, 拖拽, 方向键推目标位置, 实际位置按规格的帧率无关跟随 (scrollEase) 追上.
 * 停下后吸附到最近一项. 可自动滚动. 减弱动效时位置直接跳到目标, 不自动滚动.
 *
 * .agents/notes/implemented/feature/2026-11-09-kits-gallery.md
 */
export function BendGallery({
  items,
  bend = B.BEND_DEFAULTS.bend,
  cardWidth = 240,
  itemAspect = B.BEND_DEFAULTS.itemAspect,
  gap = B.BEND_DEFAULTS.gap,
  scrollSpeed = B.BEND_DEFAULTS.scrollSpeed,
  scrollEase = B.BEND_DEFAULTS.scrollEase,
  snap = true,
  autoScroll = B.BEND_DEFAULTS.autoScroll,
  showTitles = true,
  onItemClick,
  onActiveChange,
  ariaLabel = "Gallery",
  className,
}: BendGalleryProps): JSX.Element {
  const reduced = useReducedMotion();
  const n = items.length;
  const spacing = cardWidth * (1 + gap);
  const root = useRef<HTMLDivElement>(null);
  const cards = useRef<Array<HTMLButtonElement | null>>([]);
  const s = useRef({ scroll: 0, target: 0, start: 0 });
  const snapTimer = useRef<number | undefined>(undefined);
  const [active, setActive] = useState(0);

  const paint = (): void => {
    const width = root.current?.offsetWidth || spacing * 3;
    cards.current.forEach((card, i) => {
      if (!card) return;
      const x = slideOffset(i, s.current.scroll, n, true) * spacing;
      const { dy, deg } = B.arcPlace(x, width, bend);
      card.style.transform = `translate(-50%, -50%) translate(${x}px, ${dy}px) rotate(${deg}deg)`;
    });
    const now = wrapIndex(Math.round(s.current.scroll), n);
    setActive((prev) => (prev === now ? prev : now));
  };

  const motion = useKitMotion(paint, reduced, (dtMs) => {
    const st = s.current;
    const auto = autoScroll && !reduced;
    if (auto) st.target += (autoScroll * B.BEND_AUTO_RATE * dtMs) / MS_PER_S;
    if (reduced) st.scroll = st.target;
    else st.scroll += (st.target - st.scroll) * B.followFactor(scrollEase, dtMs);
    if (Math.abs(st.target - st.scroll) < B.BEND_SETTLE) st.scroll = st.target;
    return Boolean(auto) || st.scroll !== st.target;
  });

  const aim = (target: number): void => {
    s.current.target = target;
    if (reduced) s.current.scroll = target;
    motion.wake();
    motion.paint();
  };
  const settleSoon = (): void => {
    if (!snap) return;
    window.clearTimeout(snapTimer.current);
    snapTimer.current = window.setTimeout(() => aim(Math.round(s.current.target)), B.BEND_SNAP_IDLE_MS);
  };

  useEffect(() => {
    motion.paint();
    if (autoScroll) motion.wake();
    return () => window.clearTimeout(snapTimer.current);
    // 挂上时摆位
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoScroll, n]);

  const activeRef = useRef(active);
  useEffect(() => {
    if (activeRef.current !== active) onActiveChange?.(active);
    activeRef.current = active;
  }, [active, onActiveChange]);

  const drag = useDrag({
    onStart: () => {
      s.current.start = s.current.target;
    },
    onMove: (dx) => aim(s.current.start - dx / spacing),
    onEnd: (vx) => aim(snap ? Math.round(s.current.target - (vx * MS_PER_S) / spacing / B.BEND_REF_FPS) : s.current.target),
  });
  const onWheel = (event: WheelEvent<HTMLElement>): void => {
    const d = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    aim(s.current.target + d * B.BEND_WHEEL_UNIT * scrollSpeed);
    settleSoon();
  };
  const onKey = (event: KeyboardEvent<HTMLElement>): void => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    aim(Math.round(s.current.target) + step);
  };
  const height = cardWidth / itemAspect;

  return (
    <div
      ref={root}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={onKey}
      onWheel={onWheel}
      data-slot="bend-gallery"
      className={cn("relative w-full touch-pan-y select-none overflow-hidden", KIT_FOCUS, className)}
      style={{ height: height * 1.5 }}
      {...drag.bind}
    >
      {items.map((item, i) => (
        <button
          key={i}
          ref={(node) => {
            cards.current[i] = node;
          }}
          type="button"
          tabIndex={-1}
          aria-label={item.label}
          aria-current={i === active || undefined}
          data-slot="bend-gallery-card"
          onClick={() => {
            if (drag.dragged()) return;
            aim(s.current.target + slideOffset(i, s.current.target, n, true));
            onItemClick?.(i);
          }}
          className="absolute left-1/2 top-1/2 flex flex-col items-center gap-2 border-0 bg-transparent p-0 will-change-transform"
          style={{ width: cardWidth }}
        >
          <img src={item.image} alt="" draggable={false} className="w-full rounded-lg object-cover" style={{ height }} />
          {showTitles ? <span className="text-sm font-semibold">{item.title}</span> : null}
        </button>
      ))}
    </div>
  );
}
