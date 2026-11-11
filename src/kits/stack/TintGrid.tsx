"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 ChromaGrid 条目, 实现为 HX 自有.

import { useRef, useState, type JSX, type PointerEvent } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { LinkOrButton } from "../../controls/nav/parts/link-or-button";
import { cn } from "../../primitives/utils";
import * as C from "./parts/chroma-spec";
import { KIT_FOCUS, kitTone, transitionOf, useKitMotion, type KitTone } from "../tokens";

export { CHROMA_DEFAULTS, chromaFollow, chromaMask, chromaPower, type ChromaReveal } from "./parts/chroma-spec";

export interface TintItem {
  readonly image: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly handle?: string;
  readonly href?: string;
  /** 这张卡的辉光色. */
  readonly tone?: KitTone;
}

export interface TintGridProps {
  readonly items: readonly TintItem[];
  readonly columns?: number;
  readonly minCardWidth?: number;
  readonly gap?: number;
  /** 聚光半径 px. */
  readonly radius?: number;
  /** 聚光边缘的柔和比例. */
  readonly softness?: number;
  /** 指针跟随的阻尼, 越大越慢. */
  readonly damping?: number;
  /** 指针离开后颜色退去的时间常数 s. */
  readonly fadeOut?: number;
  /** 聚光外的去色程度 0..1 与压暗程度. */
  readonly grayscale?: number;
  readonly dim?: number;
  /** 悬停卡内辉光强度与边框辉光强度. */
  readonly glow?: number;
  readonly borderGlow?: number;
  /** spotlight: 指针附近一圈显色; card: 只有悬停的卡显色. */
  readonly reveal?: C.ChromaReveal;
  readonly aspectRatio?: string;
  readonly cardRadius?: number;
  readonly showInfo?: boolean;
  readonly onItemClick?: (index: number) => void;
  readonly ariaLabel?: string;
  readonly className?: string;
}

/**
 * 聚光网格: 卡片默认去色压暗, 指针附近半径 radius 的一圈显出原色, 圆心以 damping × 0.32 s 的时间常数追指针;
 * 指针离开后颜色按 fadeOut 退去. 悬停的卡带随指针移动的内辉光与边框辉光. 聚焦一张卡时整张显色. 减弱动效时聚光直接贴指针, 显色即开即关.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-stack.md
 */
export function TintGrid({
  items,
  columns = C.CHROMA_DEFAULTS.columns,
  minCardWidth = C.CHROMA_DEFAULTS.minCardWidth,
  gap = C.CHROMA_DEFAULTS.gap,
  radius = C.CHROMA_DEFAULTS.radius,
  softness = C.CHROMA_DEFAULTS.softness,
  damping = C.CHROMA_DEFAULTS.damping,
  fadeOut = C.CHROMA_DEFAULTS.fadeOut,
  grayscale = C.CHROMA_DEFAULTS.grayscale,
  dim = C.CHROMA_DEFAULTS.dim,
  glow = C.CHROMA_DEFAULTS.glow,
  borderGlow = C.CHROMA_DEFAULTS.borderGlow,
  reveal = "spotlight",
  aspectRatio = C.CHROMA_DEFAULTS.aspectRatio,
  cardRadius = C.CHROMA_DEFAULTS.cardRadius,
  showInfo = true,
  onItemClick,
  ariaLabel = "Gallery",
  className,
}: TintGridProps): JSX.Element {
  const reduced = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const shade = useRef<HTMLDivElement>(null);
  const s = useRef({ x: 0, y: 0, tx: 0, ty: 0, power: 0, target: 0, seen: false });
  const [hot, setHot] = useState(-1);

  const motion = useKitMotion(
    () => {
      const st = s.current;
      const layer = shade.current;
      if (!layer) return;
      const mask = reveal === "spotlight" ? C.chromaMask(st.x, st.y, radius, softness, st.power) : "linear-gradient(black, black)";
      layer.style.maskImage = mask;
      layer.style.webkitMaskImage = mask;
    },
    reduced,
    (dtMs) => {
      const st = s.current;
      const k = C.chromaFollow(dtMs, damping, reduced);
      st.x += (st.tx - st.x) * k;
      st.y += (st.ty - st.y) * k;
      st.power = C.chromaPower(st.power, st.target, dtMs, fadeOut, reduced);
      return Math.abs(st.tx - st.x) > 0.1 || Math.abs(st.ty - st.y) > 0.1 || st.power !== st.target;
    },
  );

  const onMove = (event: PointerEvent<HTMLDivElement>): void => {
    const box = root.current?.getBoundingClientRect();
    if (!box) return;
    const st = s.current;
    st.tx = event.clientX - box.left;
    st.ty = event.clientY - box.top;
    if (!st.seen) {
      st.x = st.tx;
      st.y = st.ty;
      st.seen = true;
    }
    st.target = 1;
    motion.wake();
  };
  const onLeave = (): void => {
    s.current.target = 0;
    s.current.seen = false;
    setHot(-1);
    motion.wake();
  };
  const onCardMove = (event: PointerEvent<HTMLElement>): void => {
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--mx", `${event.clientX - box.left}px`);
    event.currentTarget.style.setProperty("--my", `${event.clientY - box.top}px`);
  };
  const fade = transitionOf([["opacity", C.CHROMA_FADE_MS, "ease"]], reduced);

  return (
    <div
      ref={root}
      role="list"
      aria-label={ariaLabel}
      data-slot="tint-grid"
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onPointerCancel={onLeave}
      className={cn("relative grid", className)}
      style={{ gap, gridTemplateColumns: `repeat(${columns}, minmax(${minCardWidth}px, 1fr))` }}
    >
      {items.map((item, i) => {
        const tone = kitTone(item.tone ?? "primary");
        const lit = hot === i;
        return (
          <div key={i} role="listitem" className="relative" style={{ zIndex: reveal === "card" && lit ? 2 : undefined }}>
            <LinkOrButton
              href={item.href}
              aria-label={item.title}
              data-slot="tint-grid-card"
              onPointerEnter={() => setHot(i)}
              onPointerMove={onCardMove}
              onFocus={() => setHot(i)}
              onBlur={() => setHot(-1)}
              onClick={() => onItemClick?.(i)}
              className={cn("group relative block w-full overflow-hidden border border-border bg-card p-0 text-left", KIT_FOCUS)}
              style={{ borderRadius: cardRadius, borderColor: lit ? `color-mix(in oklab, ${tone} ${borderGlow * 100}%, var(--border))` : undefined, transition: transitionOf([["border-color", C.CHROMA_FADE_MS, "ease"]], reduced) }}
            >
              <img src={item.image} alt="" draggable={false} className="block w-full object-cover" style={{ aspectRatio }} />
              <span
                aria-hidden
                data-slot="tint-grid-glow"
                className="pointer-events-none absolute inset-0"
                style={{ opacity: lit ? glow : 0, background: `radial-gradient(circle at var(--mx, 50%) var(--my, 50%), color-mix(in oklab, ${tone} 60%, transparent), transparent 60%)`, transition: fade }}
              />
              {showInfo ? (
                <span className="relative grid gap-0.5 p-3 text-sm">
                  <span className="font-semibold text-foreground">{item.title}</span>
                  {item.subtitle ? <span className="text-muted-foreground">{item.subtitle}</span> : null}
                  {item.handle ? <span className="text-xs text-muted-foreground">{item.handle}</span> : null}
                </span>
              ) : null}
            </LinkOrButton>
          </div>
        );
      })}
      <div
        ref={shade}
        aria-hidden
        data-slot="tint-grid-shade"
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          backdropFilter: `grayscale(${grayscale}) brightness(${1 - dim})`,
          WebkitBackdropFilter: `grayscale(${grayscale}) brightness(${1 - dim})`,
          maskImage: "linear-gradient(black, black)",
          transition: transitionOf([["backdrop-filter", C.CHROMA_FILTER_MS, "ease"]], reduced),
        }}
      />
    </div>
  );
}
