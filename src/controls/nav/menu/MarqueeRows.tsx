"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 FlowingMenu 条目, 实现为 HX 自有.

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type JSX, type PointerEvent, type ReactNode } from "react";
import { FOCUS_RING } from "../../../craft/tokens";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cssCurve } from "../../../motion/curves";
import { prefersReducedMotion } from "../../../primitives/motion";
import { cn } from "../../../primitives/utils";
import { LinkOrButton } from "../parts/link-or-button";
import { useNavMotion } from "../parts/use-nav-motion";
import { PLAIN_EASE, navTone, transitionOf, type NavTone } from "../tokens";
import * as M from "./parts/marquee-spec";

export { MARQUEE_DEFAULTS, marqueeAdvance, marqueeEdge, marqueeHidden, marqueeSpring, type MarqueeEdge } from "./parts/marquee-spec";

export interface MarqueeItem {
  readonly label: ReactNode;
  readonly href?: string;
  /** 跑马带里与文字交替的图片地址. */
  readonly image?: string;
  readonly onSelect?: () => void;
}

export interface MarqueeRowsProps {
  readonly items: readonly MarqueeItem[];
  /** 跑马速度 px/s. */
  readonly speed?: number;
  readonly direction?: "left" | "right";
  /** 跑马带滑入的弹簧周期, 秒. */
  readonly duration?: number;
  readonly textTone?: NavTone;
  readonly surfaceTone?: NavTone;
  readonly bandTone?: NavTone;
  readonly bandTextTone?: NavTone;
  readonly dividers?: boolean;
  /** 有行激活时其余行淡化. */
  readonly dimInactive?: boolean;
  readonly showIndex?: boolean;
  readonly intro?: boolean;
  readonly onItemClick?: (index: number) => void;
  readonly ariaLabel?: string;
  readonly className?: string;
}

const band = (i: number): string => `band${i}`;

/**
 * 跑马行菜单: 指针从哪条边进入一行, 跑马带就从那条边按弹簧滑入盖住这行, 带里文字与图片循环横向滚动; 离开时从最近的边滑出.
 * 键盘聚焦按从上边进入处理. 入场时行与文字按规格错峰升起. 减弱动效时带直接显隐, 不滚动, 不入场.
 *
 * .agents/notes/implemented/feature/2026-11-09-controls-nav.md
 */
export function MarqueeRows({
  items,
  speed = M.MARQUEE_DEFAULTS.speed,
  direction = "left",
  duration = M.MARQUEE_DEFAULTS.duration,
  textTone = "foreground",
  surfaceTone = "background",
  bandTone = "foreground",
  bandTextTone = "background",
  dividers = true,
  dimInactive = false,
  showIndex = false,
  intro = true,
  onItemClick,
  ariaLabel = "Menu",
  className,
}: MarqueeRowsProps): JSX.Element {
  const reduced = useReducedMotion();
  // useReducedMotion 首帧恒为 false; 入场过渡串同步再查一次媒体查询
  const calm = reduced || prefersReducedMotion();
  const bands = useRef<Array<HTMLSpanElement | null>>([]);
  const tracks = useRef<Array<HTMLSpanElement | null>>([]);
  const offsets = useRef<number[]>([]);
  const [hot, setHot] = useState(-1);
  const [entered, setEntered] = useState(!intro);
  const spec = M.marqueeSpring(duration);
  const sign: 1 | -1 = direction === "left" ? 1 : -1;

  const scroll = (dtMs: number): boolean => {
    if (reduced || hot < 0) return false;
    const track = tracks.current[hot];
    const segment = (track?.firstElementChild as HTMLElement | null)?.offsetWidth ?? 0;
    offsets.current[hot] = M.marqueeAdvance(offsets.current[hot] ?? 0, dtMs, speed, segment, sign);
    if (track) track.style.transform = `translateX(${offsets.current[hot]}px)`;
    return segment > 0;
  };
  const motion = useNavMotion((m) => {
    items.forEach((_, i) => {
      const node = bands.current[i];
      if (node) node.style.transform = `translateY(${m.get(band(i), M.marqueeHidden("top"))}%)`;
    });
  }, reduced, scroll);

  useLayoutEffect(() => {
    if (entered) return;
    if (calm) {
      setEntered(true);
      return;
    }
    // 读一次布局让起始样式落定, 再切到入场终态
    void document.body.offsetHeight;
    setEntered(true);
  }, [entered, calm]);

  useEffect(() => {
    items.forEach((_, i) => motion.jump(band(i), M.marqueeHidden("top")));
    // 项数变了才重摆
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  const enter = (i: number, edge: M.MarqueeEdge): void => {
    motion.jump(band(i), M.marqueeHidden(edge));
    motion.spring(band(i), 0, spec);
    setHot(i);
    motion.wake();
  };
  const leave = (i: number, edge: M.MarqueeEdge): void => {
    motion.spring(band(i), M.marqueeHidden(edge), spec);
    setHot((prev) => (prev === i ? -1 : prev));
  };
  const edgeOf = (event: PointerEvent<HTMLElement>): M.MarqueeEdge => {
    const rect = event.currentTarget.getBoundingClientRect();
    return M.marqueeEdge(event.clientY - rect.top, rect.height);
  };

  const rowStyle = (i: number): CSSProperties => ({
    opacity: entered ? (dimInactive && hot >= 0 && hot !== i ? M.MARQUEE_DIM : 1) : 0,
    transform: entered ? "translateY(0px)" : `translateY(${M.MARQUEE_ROW_FROM_PX}px)`,
    transition: transitionOf(
      [
        ["transform", M.MARQUEE_ROW_MS, cssCurve("outCubic"), i * M.MARQUEE_ROW_STAGGER_MS],
        ["opacity", hot >= 0 ? M.MARQUEE_DIM_MS : M.MARQUEE_TEXT_MS, hot >= 0 ? PLAIN_EASE : cssCurve("outCubic"), hot >= 0 ? 0 : M.MARQUEE_TEXT_LEAD_MS + i * M.MARQUEE_TEXT_STAGGER_MS],
      ],
      calm,
    ),
  });

  return (
    <nav aria-label={ariaLabel} data-slot="marquee-rows" className={cn("w-full", className)} style={{ backgroundColor: navTone(surfaceTone), color: navTone(textTone) }}>
      <ul className="m-0 flex list-none flex-col p-0">
        {items.map((item, i) => (
          <li key={i} className={cn("relative overflow-hidden", dividers && "border-t border-border last:border-b")} style={rowStyle(i)}>
            <LinkOrButton
              href={item.href}
              data-slot="marquee-rows-row"
              onPointerEnter={(event) => enter(i, edgeOf(event))}
              onPointerLeave={(event) => leave(i, edgeOf(event))}
              onFocus={() => enter(i, "top")}
              onBlur={() => leave(i, "top")}
              onClick={() => {
                item.onSelect?.();
                onItemClick?.(i);
              }}
              className={cn("relative flex w-full items-center justify-center gap-3 py-6 text-4xl font-semibold uppercase text-inherit no-underline", FOCUS_RING)}
            >
              {showIndex ? <span className="text-sm font-normal tabular-nums opacity-60">{String(i + 1).padStart(2, "0")}</span> : null}
              <span>{item.label}</span>
              <span
                ref={(node) => {
                  bands.current[i] = node;
                }}
                aria-hidden
                data-slot="marquee-rows-band"
                className="pointer-events-none absolute inset-0 flex items-center overflow-hidden"
                style={{ backgroundColor: navTone(bandTone), color: navTone(bandTextTone), transform: `translateY(${M.marqueeHidden("top")}%)` }}
              >
                <span
                  ref={(node) => {
                    tracks.current[i] = node;
                  }}
                  className="flex shrink-0 items-center will-change-transform"
                >
                  {Array.from({ length: M.MARQUEE_REPEAT }, (_, k) => (
                    <span key={k} className="flex shrink-0 items-center gap-6 pr-6">
                      <span className="whitespace-nowrap">{item.label}</span>
                      {item.image ? <span className="block h-14 w-40 shrink-0 rounded-full bg-cover bg-center" style={{ backgroundImage: `url("${item.image}")` }} /> : null}
                    </span>
                  ))}
                </span>
              </span>
            </LinkOrButton>
          </li>
        ))}
      </ul>
    </nav>
  );
}
