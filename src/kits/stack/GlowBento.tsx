"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 MagicBento 条目, 实现为 HX 自有.

import { useEffect, useLayoutEffect, useRef, useState, type JSX, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { LinkOrButton } from "../../controls/nav/parts/link-or-button";
import { cssCurve } from "../../motion/curves";
import { prefersReducedMotion } from "../../primitives/motion";
import { cn } from "../../primitives/utils";
import * as B from "./parts/bento-spec";
import { KIT_FOCUS, kitTone, transitionOf, useKitMotion, type KitTone } from "../tokens";

export { BENTO_DEFAULTS, bentoColumns, bentoEase, bentoPose, bentoProximity, bentoSpan, type BentoSpan } from "./parts/bento-spec";

export interface BentoItem {
  readonly title: string;
  readonly description?: string;
  readonly label?: string;
  readonly content?: ReactNode;
  readonly span?: B.BentoSpan;
  readonly href?: string;
}

export interface GlowBentoProps {
  readonly items: readonly BentoItem[];
  readonly columns?: number;
  readonly rowHeight?: number;
  readonly gap?: number;
  readonly radius?: number;
  readonly glowTone?: KitTone;
  readonly textAutoHide?: boolean;
  readonly enableBorderGlow?: boolean;
  readonly enableSpotlight?: boolean;
  readonly spotlightRadius?: number;
  readonly enableTilt?: boolean;
  readonly enableMagnetism?: boolean;
  readonly clickEffect?: boolean;
  readonly intro?: boolean;
  readonly disableAnimations?: boolean;
  readonly onItemClick?: (index: number) => void;
  readonly ariaLabel?: string;
  readonly className?: string;
}

/**
 * 发光便当格: 卡片按 columns 列排, 窄时按每格最窄 150px 减列, 跨格合宽不到 200px 收成一列.
 * 指针下有一团光斑 (追指针 tau 0.05s, 亮 0.12s, 暗 0.4s), 离指针 spotlightRadius 内的格子边框按距离发光; 悬停格热度升 0.14s 降 0.32s, 驱动底色, 可选倾斜 6 度与吸附 6px.
 * 进视口 15% 时逐格错峰 80ms 入场; 点击处放一圈 1.1s 的波纹. 减弱动效或 disableAnimations 时无入场, 倾斜, 吸附与波纹, 光斑直接贴指针.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-stack.md
 */
export function GlowBento({
  items,
  columns = B.BENTO_DEFAULTS.columns,
  rowHeight = B.BENTO_DEFAULTS.rowHeight,
  gap = B.BENTO_DEFAULTS.gap,
  radius = B.BENTO_DEFAULTS.radius,
  glowTone = "primary",
  textAutoHide = true,
  enableBorderGlow = true,
  enableSpotlight = true,
  spotlightRadius = B.BENTO_DEFAULTS.spotlightRadius,
  enableTilt = false,
  enableMagnetism = false,
  clickEffect = true,
  intro = true,
  disableAnimations = false,
  onItemClick,
  ariaLabel = "Features",
  className,
}: GlowBentoProps): JSX.Element {
  const reducedPref = useReducedMotion();
  const still = reducedPref || disableAnimations;
  const root = useRef<HTMLDivElement>(null);
  const light = useRef<HTMLDivElement>(null);
  const cells = useRef<Array<HTMLElement | null>>([]);
  const [width, setWidth] = useState(0);
  const [shown, setShown] = useState(!intro);
  const s = useRef({ px: 0, py: 0, x: 0, y: 0, in: false, light: 0, hotIdx: -1, hot: [] as number[] });
  const cols = B.bentoColumns(width, columns, gap);
  const cellWidth = width > 0 ? (width - gap * (cols - 1)) / cols : B.BENTO_MIN_PAIR;
  const tone = kitTone(glowTone);

  const motion = useKitMotion(
    () => {
      const st = s.current;
      const box = root.current?.getBoundingClientRect();
      if (light.current) {
        light.current.style.opacity = String(enableSpotlight ? st.light : 0);
        light.current.style.setProperty("--lx", `${st.x.toFixed(1)}px`);
        light.current.style.setProperty("--ly", `${st.y.toFixed(1)}px`);
      }
      cells.current.forEach((cell, i) => {
        if (!cell || !box) return;
        const r = cell.getBoundingClientRect();
        const rect = { x: r.left - box.left, y: r.top - box.top, w: r.width, h: r.height };
        const near = st.in && enableBorderGlow ? B.bentoProximity(st.x, st.y, rect, spotlightRadius) * st.light : 0;
        const hot = st.hot[i] ?? 0;
        cell.style.setProperty("--gx", `${(st.x - rect.x).toFixed(1)}px`);
        cell.style.setProperty("--gy", `${(st.y - rect.y).toFixed(1)}px`);
        cell.style.setProperty("--glow", near.toFixed(3));
        cell.style.setProperty("--hot", hot.toFixed(3));
        const nx = rect.w > 0 ? ((st.x - rect.x) / rect.w) * 2 - 1 : 0;
        const ny = rect.h > 0 ? ((st.y - rect.y) / rect.h) * 2 - 1 : 0;
        const pose = B.bentoPose(nx, ny, hot, enableTilt && !still, enableMagnetism && !still);
        cell.style.setProperty("--pose", `perspective(800px) translate(${pose.tx.toFixed(2)}px, ${pose.ty.toFixed(2)}px) rotateX(${pose.rx.toFixed(2)}deg) rotateY(${pose.ry.toFixed(2)}deg)`);
      });
    },
    still,
    (dtMs) => {
      const st = s.current;
      const dt = dtMs / 1000;
      const k = still ? 1 : 1 - Math.exp(-Math.min(B.BENTO_MAX_DT_S, dt) / B.BENTO_FOLLOW_S);
      st.x += (st.px - st.x) * k;
      st.y += (st.py - st.y) * k;
      st.light = still ? (st.in ? 1 : 0) : B.bentoEase(st.light, st.in ? 1 : 0, dt, B.BENTO_LIGHT_S);
      let busy = Math.abs(st.px - st.x) > 0.1 || Math.abs(st.py - st.y) > 0.1 || st.light !== (st.in ? 1 : 0);
      items.forEach((_, i) => {
        const target = i === st.hotIdx ? 1 : 0;
        const v = st.hot[i] ?? 0;
        st.hot[i] = still ? target : B.bentoEase(v, target, dt, B.BENTO_HOT_S);
        busy ||= st.hot[i] !== target;
      });
      return busy;
    },
  );
  useLayoutEffect(() => {
    const node = root.current;
    if (!node) return undefined;
    setWidth(node.clientWidth);
    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(() => setWidth(node.clientWidth));
    ro.observe(node);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const node = root.current;
    if (shown || !node) return undefined;
    if (still || prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return undefined;
    }
    const io = new IntersectionObserver(([entry]) => entry?.isIntersecting && setShown(true), { threshold: B.BENTO_INTRO_THRESHOLD });
    io.observe(node);
    return () => io.disconnect();
  }, [shown, still]);
  const onMove = (event: PointerEvent<HTMLDivElement>): void => {
    const box = root.current?.getBoundingClientRect();
    if (!box) return;
    const st = s.current;
    st.px = event.clientX - box.left;
    st.py = event.clientY - box.top;
    if (!st.in) {
      st.x = st.px;
      st.y = st.py;
      st.in = true;
    }
    motion.wake();
  };
  const heat = (i: number, inside = s.current.in): void => {
    Object.assign(s.current, { hotIdx: i, in: inside });
    motion.wake();
  };
  const onLeave = (): void => heat(-1, false);
  const ripple = (event: MouseEvent<HTMLElement>): void => {
    if (clickEffect && !still) B.bentoRipple(event.currentTarget, event.clientX, event.clientY, `radial-gradient(circle, color-mix(in oklab, ${tone} 35%, transparent), transparent 70%)`, cssCurve("outQuint"));
  };

  const enter = transitionOf([["opacity", B.BENTO_INTRO_FADE_MS, cssCurve("outQuint")], ["transform", B.BENTO_INTRO_MOVE_MS, cssCurve("backOutSoft")]], still);
  const tint = transitionOf([["background-color", B.BENTO_TINT_MS, "ease"]], still);

  return (
    <div
      ref={root}
      role="list"
      aria-label={ariaLabel}
      data-slot="glow-bento"
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onPointerCancel={onLeave}
      className={cn("relative grid", className)}
      style={{ gap, gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridAutoRows: rowHeight }}
    >
      {items.map((item, i) => {
        const span = B.bentoSpan(item.span?.col ?? 1, cols, cellWidth, gap);
        return (
          <div
            key={i}
            role="listitem"
            data-slot="glow-bento-item"
            style={{
              gridColumn: `span ${span}`,
              gridRow: `span ${Math.max(1, item.span?.row ?? 1)}`,
              opacity: shown ? 1 : 0,
              transform: shown ? "none" : `translateY(${B.BENTO_INTRO_RISE_PX}px) scale(${B.BENTO_INTRO_SCALE})`,
              transition: enter,
              transitionDelay: still ? undefined : `${i * B.BENTO_STAGGER_MS}ms`,
            }}
          >
            <LinkOrButton
              href={item.href}
              nodeRef={(node: HTMLElement | null) => {
                cells.current[i] = node;
              }}
              data-slot="glow-bento-cell"
              onPointerEnter={() => heat(i)}
              onPointerLeave={() => heat(-1)}
              onFocus={() => heat(i)}
              onBlur={() => heat(-1)}
              onClick={(event: MouseEvent<HTMLElement>) => {
                ripple(event);
                onItemClick?.(i);
              }}
              className={cn("relative flex h-full w-full flex-col justify-between overflow-hidden border border-border bg-card p-5 text-left text-card-foreground", KIT_FOCUS)}
              style={{
                borderRadius: radius,
                transform: "var(--pose)",
                backgroundColor: `color-mix(in oklab, ${tone} calc(var(--hot, 0) * 6%), var(--card))`,
                transition: tint,
              }}
            >
              {enableBorderGlow ? (
                <span
                  aria-hidden
                  data-slot="glow-bento-border"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    borderRadius: radius,
                    padding: 2,
                    opacity: "var(--glow, 0)",
                    background: `radial-gradient(circle ${spotlightRadius}px at var(--gx) var(--gy), ${tone}, transparent 60%)`,
                    mask: "linear-gradient(black, black) content-box, linear-gradient(black, black)",
                    maskComposite: "exclude",
                  }}
                />
              ) : null}
              {item.label ? <span className="text-xs font-medium text-muted-foreground">{item.label}</span> : null}
              {item.content}
              <span className="grid gap-1">
                <span className="font-semibold">{item.title}</span>
                {item.description ? <span className={cn("text-sm text-muted-foreground", textAutoHide && "line-clamp-2")}>{item.description}</span> : null}
              </span>
            </LinkOrButton>
          </div>
        );
      })}
      <div ref={light} aria-hidden data-slot="glow-bento-light" className="pointer-events-none absolute inset-0" style={{ opacity: 0, background: `radial-gradient(circle ${spotlightRadius}px at var(--lx, 50%) var(--ly, 50%), color-mix(in oklab, ${tone} 18%, transparent), transparent 70%)` }} />
    </div>
  );
}
