"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 DriftWall 条目, 实现为 HX 自有.

import { useEffect, useRef, useState, type JSX, type ReactNode } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { cn } from "../../primitives/utils";
import * as D from "./parts/drift-spec";
import { KIT_FOCUS, KIT_OUT_LONG, MS_PER_S, transitionOf, useKitMotion } from "../tokens";

export { DRIFT_DEFAULTS, driftBase, driftSpeedStep, driftWrap } from "./parts/drift-spec";

export interface DriftItem {
  readonly image: string;
  readonly alt: string;
  readonly title?: ReactNode;
}

export interface DriftColumnsProps {
  readonly items: readonly DriftItem[];
  readonly columns?: number;
  /** 漂移速度 px/s. */
  readonly speed?: number;
  /** 相邻列反向. */
  readonly alternate?: boolean;
  readonly gap?: number;
  readonly height?: number;
  /** 悬停的那列停下. */
  readonly pauseOnHover?: boolean;
  /** 悬停时其余卡片变淡. */
  readonly dimOthers?: boolean;
  readonly onItemClick?: (index: number) => void;
  readonly ariaLabel?: string;
  readonly className?: string;
}

/**
 * 漂移墙: 卡片分列, 每列以自己的速度上下循环漂移 (相邻列错速, 可反向). 指针或焦点进入一列时该列按 160ms 时间常数停下, 离开后 280ms 回速 (规格同);
 * 悬停的卡片上浮, 其余卡片可变淡, 过渡 420ms. 屏幕外不跑帧. 减弱动效时不漂移.
 *
 * .agents/notes/implemented/feature/2026-11-09-kits-gallery.md
 */
export function DriftColumns({
  items,
  columns = D.DRIFT_DEFAULTS.columns,
  speed = D.DRIFT_DEFAULTS.speed,
  alternate = true,
  gap = D.DRIFT_DEFAULTS.gap,
  height = D.DRIFT_DEFAULTS.height,
  pauseOnHover = true,
  dimOthers = true,
  onItemClick,
  ariaLabel = "Gallery",
  className,
}: DriftColumnsProps): JSX.Element {
  const reduced = useReducedMotion();
  const cols = Math.max(1, Math.round(columns));
  const root = useRef<HTMLDivElement>(null);
  const tracks = useRef<Array<HTMLDivElement | null>>([]);
  const s = useRef({ offsets: [] as number[], speeds: [] as number[], hot: -1, visible: true });
  const [hotItem, setHotItem] = useState(-1);
  const lists = Array.from({ length: cols }, (_, c) => items.map((item, i) => ({ item, i })).filter(({ i }) => i % cols === c));

  const motion = useKitMotion(
    () => {
      tracks.current.forEach((track, c) => {
        if (track) track.style.transform = `translateY(${s.current.offsets[c] ?? 0}px)`;
      });
    },
    reduced,
    (dtMs) => {
      const st = s.current;
      if (reduced || !st.visible) return false;
      let busy = false;
      for (let c = 0; c < cols; c += 1) {
        const target = pauseOnHover && st.hot === c ? 0 : D.driftBase(c, speed, alternate);
        let v = D.driftSpeedStep(st.speeds[c] ?? D.driftBase(c, speed, alternate), target, dtMs);
        if (Math.abs(v - target) < D.DRIFT_REST) v = target;
        st.speeds[c] = v;
        const span = (tracks.current[c]?.scrollHeight ?? 0) / 2;
        st.offsets[c] = D.driftWrap((st.offsets[c] ?? 0) - (v * dtMs) / MS_PER_S, span);
        if (v !== 0 || target !== 0) busy = true;
      }
      return busy;
    },
  );

  useEffect(() => {
    motion.wake();
    const node = root.current;
    if (!node || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(([entry]) => {
      s.current.visible = Boolean(entry?.isIntersecting);
      if (s.current.visible) motion.wake();
    });
    io.observe(node);
    return () => io.disconnect();
  }, [motion, cols, speed, alternate, reduced]);

  const enter = (c: number, i: number): void => {
    s.current.hot = c;
    setHotItem(i);
    motion.wake();
  };
  const leave = (): void => {
    s.current.hot = -1;
    setHotItem(-1);
    motion.wake();
  };
  const ease = (props: string[]): string => transitionOf(props.map((p) => [p, D.DRIFT_HOVER_MS, KIT_OUT_LONG] as const), reduced);

  return (
    <div ref={root} role="region" aria-label={ariaLabel} data-slot="drift-columns" className={cn("relative flex w-full overflow-hidden", className)} style={{ height, gap }}>
      {lists.map((list, c) => (
        <div key={c} className="min-w-0 flex-1" onMouseLeave={leave}>
          <div
            ref={(node) => {
              tracks.current[c] = node;
            }}
            data-slot="drift-columns-track"
            className="flex flex-col will-change-transform"
            style={{ gap, paddingBottom: gap }}
          >
            {[0, 1].map((copy) =>
              list.map(({ item, i }) => {
                const hot = hotItem === i;
                return (
                  <button
                    key={`${copy}-${i}`}
                    type="button"
                    tabIndex={copy ? -1 : 0}
                    aria-hidden={copy ? true : undefined}
                    aria-label={item.alt}
                    data-slot="drift-columns-card"
                    onMouseEnter={() => enter(c, i)}
                    onFocus={() => enter(c, i)}
                    onBlur={leave}
                    onClick={() => onItemClick?.(i)}
                    className={cn("relative block overflow-hidden rounded-xl border-0 p-0", KIT_FOCUS)}
                    style={{
                      transform: hot ? `translateY(${-D.DRIFT_LIFT_PX}px) scale(${D.DRIFT_LIFT_SCALE})` : "translateY(0px) scale(1)",
                      opacity: dimOthers && hotItem >= 0 && !hot ? D.DRIFT_DIM : 1,
                      transition: ease(["transform", "opacity"]),
                    }}
                  >
                    <img src={item.image} alt="" draggable={false} className="block w-full object-cover" />
                    {item.title ? (
                      <span className="absolute inset-x-0 bottom-0 p-3 text-left text-sm font-semibold" style={{ opacity: hot ? 1 : 0, transition: ease(["opacity"]) }}>
                        {item.title}
                      </span>
                    ) : null}
                  </button>
                );
              }),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
