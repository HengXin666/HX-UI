"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 FlexCarousel 条目, 实现为 HX 自有.
// ENGINE-GAP: 规格在 OGL 着色器里按速度能量把卡片网格弯曲卷边 (uCurl), 并做色散与多采样模糊 (TAPS 12).
// 内核没有顶点通道与多采样后处理, 这里同一份能量驱动整卡的 rotateY 与收缩, 不弯网格, 无色散.

import { useEffect, useRef, useState, type JSX, type KeyboardEvent, type ReactNode, type WheelEvent } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { cn } from "../../primitives/utils";
import { slideOffset } from "./parts/carousel-spec";
import { useDrag } from "./parts/use-drag";
import * as F from "./parts/flex-spec";
import { KIT_FOCUS, MS_PER_S, useKitMotion, wrapIndex } from "../tokens";

export { FLEX_SPRING, flexEnergyStep, flexEnergyTarget, flexPose } from "./parts/flex-spec";

export interface FlexItem {
  readonly image: string;
  readonly title?: ReactNode;
  readonly label: string;
}

export interface FlexReelProps {
  readonly items: readonly FlexItem[];
  readonly cardWidth?: number;
  readonly cardHeight?: number;
  readonly gap?: number;
  readonly perspective?: number;
  readonly onActiveChange?: (index: number) => void;
  readonly onItemClick?: (index: number) => void;
  readonly ariaLabel?: string;
  readonly className?: string;
}

/**
 * 弹性轮播: 循环卡带, 位置是一路临界阻尼弹簧 (点选与松手 55, 滚轮 80, 按规格分模式); 运动速度换成能量 (上升 70ms, 回落 350ms),
 * 能量越大两侧卡片越朝运动反方向转并略收缩, 停下后舒展回平. 拖拽, 滚轮, 方向键, 点卡片. 减弱动效时直接到位, 无能量形变.
 *
 * .agents/notes/implemented/feature/2026-11-09-kits-gallery.md
 */
export function FlexReel({ items, cardWidth = 260, cardHeight = 340, gap = 24, perspective = 1200, onActiveChange, onItemClick, ariaLabel = "Carousel", className }: FlexReelProps): JSX.Element {
  const reduced = useReducedMotion();
  const n = items.length;
  const spacing = cardWidth + gap;
  const cards = useRef<Array<HTMLButtonElement | null>>([]);
  const s = useRef({ energy: 0, dir: 0, start: 0, target: 0 });
  const snapTimer = useRef<number | undefined>(undefined);
  const [active, setActive] = useState(0);

  const motion = useKitMotion(
    (m) => {
      const x = m.get("x", 0);
      const e = reduced ? 0 : s.current.energy;
      cards.current.forEach((card, i) => {
        if (!card) return;
        const off = slideOffset(i, x, n, true);
        const pose = F.flexPose(off, e, s.current.dir);
        card.style.transform = `translate(-50%, -50%) translateX(${off * spacing}px) rotateY(${pose.deg}deg) scale(${pose.scale})`;
      });
      const now = wrapIndex(Math.round(x), n);
      setActive((prev) => (prev === now ? prev : now));
    },
    reduced,
    (dtMs) => {
      const v = motion.velocity("x");
      if (Math.abs(v) > 0) s.current.dir = Math.sign(v);
      const st = s.current;
      st.energy = F.flexEnergyStep(st.energy, F.flexEnergyTarget(v), dtMs);
      if (st.energy < F.FLEX_ENERGY_EPS && !v) st.energy = 0;
      return st.energy > 0;
    },
  );

  const activeRef = useRef(active);
  useEffect(() => {
    if (activeRef.current !== active) onActiveChange?.(active);
    activeRef.current = active;
  }, [active, onActiveChange]);
  useEffect(() => {
    motion.jump("x", 0);
    return () => window.clearTimeout(snapTimer.current);
    // 挂上时摆位
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  const aim = (target: number, mode: keyof typeof F.FLEX_SPRING, velocity?: number): void => {
    s.current.target = target;
    motion.spring("x", target, F.FLEX_SPRING[mode], velocity);
  };
  const drag = useDrag({
    onStart: () => {
      s.current.start = motion.get("x");
    },
    onMove: (dx) => {
      const x = s.current.start - dx / spacing;
      s.current.dir = Math.sign(-dx) || s.current.dir;
      s.current.energy = Math.max(s.current.energy, F.flexEnergyTarget((Math.abs(dx) / spacing) * 2));
      motion.jump("x", x);
      s.current.target = x;
    },
    onEnd: (vx) => {
      const v = (-vx * MS_PER_S) / spacing;
      aim(Math.round(motion.get("x") + v / (2 * Math.sqrt(F.FLEX_SPRING.snap.stiffness))), "snap", v);
    },
  });
  const onWheel = (event: WheelEvent<HTMLElement>): void => {
    const d = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    aim(s.current.target + d * F.FLEX_WHEEL_UNIT, "wheel");
    window.clearTimeout(snapTimer.current);
    snapTimer.current = window.setTimeout(() => aim(Math.round(s.current.target), "snap"), F.FLEX_SNAP_IDLE_MS);
  };
  const onKey = (event: KeyboardEvent<HTMLElement>): void => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    aim(Math.round(s.current.target) + step, "snap");
  };

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={onKey}
      onWheel={onWheel}
      data-slot="flex-reel"
      className={cn("relative w-full touch-pan-y select-none overflow-hidden", KIT_FOCUS, className)}
      style={{ height: cardHeight * 1.25, perspective }}
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
          data-slot="flex-reel-card"
          onClick={() => {
            if (drag.dragged()) return;
            aim(s.current.target + slideOffset(i, s.current.target, n, true), "snap");
            onItemClick?.(i);
          }}
          className="absolute left-1/2 top-1/2 flex flex-col overflow-hidden rounded-2xl border-0 p-0 will-change-transform"
          style={{ width: cardWidth, height: cardHeight }}
        >
          <img src={item.image} alt="" draggable={false} className="min-h-0 w-full flex-1 object-cover" />
          {item.title ? <span className="p-3 text-left text-sm font-semibold">{item.title}</span> : null}
        </button>
      ))}
    </div>
  );
}
