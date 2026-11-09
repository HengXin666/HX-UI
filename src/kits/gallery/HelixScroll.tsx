"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 InfiniteSpiral 条目, 实现为 HX 自有.

import { useEffect, useRef, type JSX } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { cn } from "../../primitives/utils";
import * as H from "./parts/helix-spec";
import { useKitMotion } from "./tokens";

export { HELIX_DEFAULTS, helixAdvance, helixPose, type HelixLook, type HelixPose } from "./parts/helix-spec";

export interface HelixItem {
  readonly image: string;
  readonly alt: string;
}

export interface HelixScrollProps {
  readonly items: readonly HelixItem[];
  /** 自动模式速度, 60fps 下每帧 px. */
  readonly speed?: number;
  readonly direction?: "up" | "down";
  /** auto 自转上升; scroll 跟页面滚动. */
  readonly animationMode?: "auto" | "scroll";
  readonly radius?: number;
  readonly cardWidth?: number;
  readonly cardHeight?: number;
  readonly verticalSpacing?: number;
  readonly perspective?: number;
  readonly cardsPerTurn?: number;
  /** 整条螺旋绕竖轴的初始转角 deg. */
  readonly rotation?: number;
  readonly centerScale?: number;
  /** 边缘渐隐的宽度, 视口半高的比例. */
  readonly edgeFade?: number;
  readonly edgeBlur?: number;
  readonly pauseOnHover?: boolean;
  /** 容器高 px. */
  readonly height?: number;
  readonly ariaLabel?: string;
  readonly className?: string;
}

/**
 * 螺旋: 卡片沿竖直螺旋排布, 每圈 cardsPerTurn 张; 自动模式下螺旋匀速上升 (或下降) 并随之转动, 滚动模式下跟页面滚动走.
 * 越靠上下边缘越淡越糊 (规格 smoothstep), 中央的卡片放大到 centerScale. 屏幕外不跑帧, 可悬停暂停.
 * 减弱动效时自动模式不动, 滚动模式照常跟手.
 *
 * .agents/notes/implemented/feature/2026-11-09-kits-gallery.md
 */
export function HelixScroll({
  items,
  speed = H.HELIX_DEFAULTS.speed,
  direction = "up",
  animationMode = "auto",
  radius = H.HELIX_DEFAULTS.radius,
  cardWidth = H.HELIX_DEFAULTS.cardWidth,
  cardHeight = H.HELIX_DEFAULTS.cardHeight,
  verticalSpacing = H.HELIX_DEFAULTS.verticalSpacing,
  perspective = H.HELIX_DEFAULTS.perspective,
  cardsPerTurn = H.HELIX_DEFAULTS.cardsPerTurn,
  rotation = 0,
  centerScale = H.HELIX_DEFAULTS.centerScale,
  edgeFade = H.HELIX_DEFAULTS.edgeFade,
  edgeBlur = H.HELIX_DEFAULTS.edgeBlur,
  pauseOnHover = true,
  height = 520,
  ariaLabel = "Gallery",
  className,
}: HelixScrollProps): JSX.Element {
  const reduced = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const cards = useRef<Array<HTMLLIElement | null>>([]);
  const s = useRef({ offset: 0, paused: false, visible: true });
  const look: H.HelixLook = { count: items.length, spacing: verticalSpacing, perTurn: cardsPerTurn, half: height / 2, edgeFade, edgeBlur, centerScale };
  const sign = direction === "up" ? 1 : -1;

  const motion = useKitMotion(
    () => {
      cards.current.forEach((card, i) => {
        if (!card) return;
        const p = H.helixPose(i, s.current.offset, look);
        card.style.transform = `translate(-50%, -50%) translateY(${p.y}px) rotateY(${p.deg + rotation}deg) translateZ(${radius}px) scale(${p.scale})`;
        card.style.opacity = String(p.opacity);
        card.style.filter = `blur(${p.blur}px)`;
      });
    },
    reduced,
    (dtMs) => {
      const st = s.current;
      if (animationMode !== "auto" || reduced || st.paused || !st.visible) return false;
      st.offset += sign * H.helixAdvance(speed, dtMs);
      return true;
    },
  );

  useEffect(() => {
    motion.paint();
    motion.wake();
    const node = root.current;
    if (!node) return undefined;
    const cleanups: Array<() => void> = [];
    if (typeof IntersectionObserver !== "undefined") {
      const io = new IntersectionObserver(([entry]) => {
        s.current.visible = Boolean(entry?.isIntersecting);
        if (s.current.visible) motion.wake();
      });
      io.observe(node);
      cleanups.push(() => io.disconnect());
    }
    if (animationMode === "scroll") {
      const onScroll = (): void => {
        s.current.offset = -sign * node.getBoundingClientRect().top;
        motion.paint();
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      cleanups.push(() => window.removeEventListener("scroll", onScroll));
    }
    return () => cleanups.forEach((fn) => fn());
    // 模式与方向变了才重挂
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animationMode, sign, items.length]);

  const hold = (paused: boolean): void => {
    if (!pauseOnHover) return;
    s.current.paused = paused;
    if (!paused) motion.wake();
  };

  return (
    <div
      ref={root}
      data-slot="helix-scroll"
      onMouseEnter={() => hold(true)}
      onMouseLeave={() => hold(false)}
      className={cn("relative w-full overflow-hidden", className)}
      style={{ height, perspective }}
    >
      <ul aria-label={ariaLabel} className="absolute left-1/2 top-1/2 m-0 list-none p-0" style={{ transformStyle: "preserve-3d" }}>
        {items.map((item, i) => (
          <li
            key={i}
            ref={(node) => {
              cards.current[i] = node;
            }}
            data-slot="helix-scroll-card"
            className="absolute left-0 top-0 overflow-hidden rounded-[10px] will-change-transform"
            style={{ width: cardWidth, height: cardHeight }}
          >
            <img src={item.image} alt={item.alt} draggable={false} className="size-full object-cover" />
          </li>
        ))}
      </ul>
    </div>
  );
}
