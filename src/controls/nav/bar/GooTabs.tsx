"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 GooeyNav 条目, 实现为 HX 自有.
// ENGINE-GAP: 规格用 WebGL 着色器画黏液 (法线高光, 投影); 本件改用 SVG 滤镜 (高斯模糊 + alpha 阈值) 在 DOM 上合并液滴与胶囊, 不画高光与投影.

import { useId, useLayoutEffect, useRef, useState, type JSX } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { DOUBLE, MS_PER_SECOND, NAV_DISABLED, NAV_FOCUS, PLAIN_EASE, PX, easeOutCubic, navTone, transitionOf, type NavTone, useNavMotion, type NavMotion } from "../tokens";
import { BarEntry, moveBarFocus, type BarItem } from "./parts/bar-entry";
import { GOO_CARRY_DIV, GOO_CARRY_MAX_S, GOO_COLOR_MS, GOO_DEFAULTS, GOO_DROP_RATIO, GOO_HOVER_TAU, GOO_MAX_DROPS, dropPoint, dropSize, gooFilter, gooRandom, planDrops } from "./parts/goo-spec";
import { PILL_SIZES, pillSpring, type PillSize } from "./parts/pill-spec";

export { GOO_DEFAULTS, GOO_MAX_DROPS, dropPoint, dropSize, gooFilter, gooRandom, planDrops, type GooDrop } from "./parts/goo-spec";

export interface GooTabsProps {
  readonly items: readonly BarItem[];
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onChange?: (value: string) => void;
  readonly size?: PillSize;
  /** 外圈 1px 边框与底色. */
  readonly frame?: boolean;
  /** 液滴基准飞行时间 ms. */
  readonly animationTime?: number;
  readonly particleCount?: number;
  /** 液滴时长的随机加量 ms. */
  readonly timeVariance?: number;
  /** 液滴弧线最大鼓出 px. */
  readonly spread?: number;
  /** 0..1, 越大液滴越容易粘连. */
  readonly gooeyness?: number;
  /** 0..1, 胶囊长出时的回弹. */
  readonly wobble?: number;
  readonly hoverEffect?: boolean;
  readonly blobTone?: NavTone;
  /** 液滴轮流取这些色; 不给则同 blobTone. */
  readonly dropTones?: readonly NavTone[];
  readonly activeTextTone?: NavTone;
  readonly textTone?: NavTone;
  readonly hoverTone?: NavTone;
  readonly ariaLabel?: string;
  readonly className?: string;
}

interface Flight {
  start: number;
  duration: number;
  lift: number;
  x0: number;
  x1: number;
}

const ids = { x: "x", w: "w", mass: "mass", ghost: "ghost", hx: "hx", hw: "hw", hover: "hover" } as const;

/**
 * 黏液导航条: 换选时旧胶囊缩回, 一串液滴沿弧线飞向新项并在滤镜里与新胶囊粘成一体, 新胶囊按弹簧长出.
 * 液滴的时长与弧度由可复现随机数按规格公式生成. 左右方向键移焦点; 减弱动效时不放液滴, 胶囊直接落定.
 *
 * .agents/notes/implemented/feature/2026-11-09-controls-nav.md
 */
export function GooTabs({
  items,
  value,
  defaultValue,
  onChange,
  size = "md",
  frame = true,
  animationTime = GOO_DEFAULTS.animationTime,
  particleCount = GOO_DEFAULTS.particleCount,
  timeVariance = GOO_DEFAULTS.timeVariance,
  spread = GOO_DEFAULTS.spread,
  gooeyness = GOO_DEFAULTS.gooeyness,
  wobble = GOO_DEFAULTS.wobble,
  hoverEffect = true,
  blobTone = "primary",
  dropTones,
  activeTextTone = "primary-foreground",
  textTone = "muted-foreground",
  hoverTone = "accent",
  ariaLabel = "Main",
  className,
}: GooTabsProps): JSX.Element {
  const reduced = useReducedMotion();
  const filterId = `goo${useId().replace(/:/g, "")}`;
  const [inner, setInner] = useState(defaultValue ?? items[0]?.value);
  const current = value ?? inner;
  const index = items.findIndex((item) => item.value === current);
  const [height, fontSize, padX] = PILL_SIZES[size];
  const refs = useRef<Array<HTMLElement | null>>([]);
  const blob = useRef<HTMLSpanElement>(null);
  const ghost = useRef<HTMLSpanElement>(null);
  const hover = useRef<HTMLSpanElement>(null);
  const drops = useRef<Array<HTMLSpanElement | null>>([]);
  const flights = useRef<Array<Flight | null>>([]);
  const ghostAt = useRef({ x: 0, w: 0 });
  const from = useRef(-1);
  const seed = useRef(1);
  const dropPx = height * GOO_DROP_RATIO;
  const filter = gooFilter(gooeyness);

  const paint = (m: NavMotion): void => {
    if (blob.current) {
      blob.current.style.width = m.get(ids.w) + PX;
      blob.current.style.transform = `translateX(${m.get(ids.x)}px) scale(${m.get(ids.mass, 1)})`;
    }
    if (ghost.current) {
      ghost.current.style.width = ghostAt.current.w + PX;
      ghost.current.style.transform = `translateX(${ghostAt.current.x}px) scale(${m.get(ids.ghost)})`;
    }
    if (hover.current) {
      hover.current.style.width = m.get(ids.hw) + PX;
      hover.current.style.transform = `translateX(${m.get(ids.hx)}px)`;
      hover.current.style.opacity = String(m.get(ids.hover));
    }
  };

  const fly = (_dt: number, now: number): boolean => {
    let busy = false;
    drops.current.forEach((node, i) => {
      const f = flights.current[i];
      if (!node) return;
      if (!f) {
        node.style.opacity = "0";
        return;
      }
      const t = (now - f.start) / (f.duration * MS_PER_SECOND);
      if (t >= 1) {
        flights.current[i] = null;
        node.style.opacity = "0";
        return;
      }
      busy = true;
      const k = Math.max(0, t);
      const p = dropPoint(easeOutCubic(k), f.x0, f.x1, height / DOUBLE, f.lift);
      const d = dropSize(k, dropPx);
      node.style.opacity = t < 0 ? "0" : "1";
      node.style.width = d + PX;
      node.style.height = d + PX;
      node.style.transform = `translate(${p.x - d / DOUBLE}px, ${p.y - d / DOUBLE}px)`;
    });
    return busy;
  };
  const motion = useNavMotion(paint, reduced, fly);

  useLayoutEffect(() => {
    const node = refs.current[index];
    const prev = refs.current[from.current];
    const spec = pillSpring(wobble / DOUBLE);
    if (!node) return;
    if (from.current < 0 || reduced || !prev) {
      motion.jump(ids.x, node.offsetLeft);
      motion.jump(ids.w, node.offsetWidth);
      motion.jump(ids.mass, 1);
      motion.jump(ids.ghost, 0);
      from.current = index;
      return;
    }
    ghostAt.current = { x: prev.offsetLeft, w: prev.offsetWidth };
    motion.jump(ids.ghost, 1);
    motion.spring(ids.ghost, 0, spec);
    motion.jump(ids.x, node.offsetLeft);
    motion.jump(ids.w, node.offsetWidth);
    motion.jump(ids.mass, 0);
    const rand = gooRandom(seed.current);
    seed.current += 1;
    const plan = planDrops(particleCount, animationTime / MS_PER_SECOND, timeVariance / MS_PER_SECOND, spread, rand);
    const start = performance.now();
    const x0 = prev.offsetLeft + prev.offsetWidth / DOUBLE;
    const x1 = node.offsetLeft + node.offsetWidth / DOUBLE;
    flights.current = plan.map((drop) => ({ start, duration: drop.duration, lift: drop.lift, x0, x1 }));
    const shortest = plan.reduce((min, drop) => Math.min(min, drop.duration), animationTime / MS_PER_SECOND);
    motion.spring(ids.mass, 1, spec, 0, Math.min(shortest / GOO_CARRY_DIV, GOO_CARRY_MAX_S) * MS_PER_SECOND);
    motion.wake();
    from.current = index;
    // 只在活动项与布局档变化时重摆
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, size, items.length, reduced]);

  const hoverTo = (i: number): void => {
    const node = refs.current[i];
    if (!hoverEffect || !node || items[i]?.disabled) return;
    motion.jump(ids.hx, node.offsetLeft);
    motion.jump(ids.hw, node.offsetWidth);
    motion.ease(ids.hover, i === index ? 0 : 1, GOO_HOVER_TAU, 0);
  };

  const select = (i: number): void => {
    const item = items[i];
    if (!item || item.disabled) return;
    if (value === undefined) setInner(item.value);
    if (item.value !== current) onChange?.(item.value);
  };

  const shape = "pointer-events-none absolute left-0 top-0 rounded-full";
  return (
    <nav aria-label={ariaLabel} data-slot="goo-tabs" className={cn("inline-flex rounded-full p-1", frame && "border border-border bg-card", className)}>
      <svg aria-hidden width="0" height="0" className="absolute">
        <filter id={filterId}>
          <feGaussianBlur in="SourceGraphic" stdDeviation={filter.blur} result="blur" />
          <feColorMatrix in="blur" values={filter.matrix} />
        </filter>
      </svg>
      <ul className="relative m-0 flex list-none items-center p-0" onKeyDown={(event) => moveBarFocus(event, refs.current, items)} onPointerLeave={() => motion.ease(ids.hover, 0, GOO_HOVER_TAU)}>
        {hoverEffect ? <span ref={hover} aria-hidden className={cn(shape, "opacity-0")} style={{ height, backgroundColor: navTone(hoverTone) }} /> : null}
        <span aria-hidden data-slot="goo-tabs-goo" className="pointer-events-none absolute inset-0" style={{ filter: `url(#${filterId})` }}>
          <span ref={ghost} className={shape} style={{ height, backgroundColor: navTone(blobTone) }} />
          <span ref={blob} className={shape} style={{ height, backgroundColor: navTone(blobTone), opacity: index < 0 ? 0 : 1 }} />
          {Array.from({ length: GOO_MAX_DROPS }, (_, i) => (
            <span
              key={i}
              ref={(node) => {
                drops.current[i] = node;
              }}
              data-slot="goo-tabs-drop"
              className={cn(shape, "opacity-0")}
              style={{ backgroundColor: navTone(dropTones?.length ? (dropTones[i % dropTones.length] ?? blobTone) : blobTone) }}
            />
          ))}
        </span>
        {items.map((item, i) => (
          <li key={item.value}>
            <BarEntry
              item={item}
              active={i === index}
              entryRef={(node) => {
                refs.current[i] = node;
              }}
              onSelect={() => select(i)}
              onPointerEnter={() => hoverTo(i)}
              className={cn("relative flex select-none items-center whitespace-nowrap rounded-full font-medium no-underline", NAV_FOCUS, NAV_DISABLED)}
              style={{ height, fontSize, paddingInline: padX, color: navTone(i === index ? activeTextTone : textTone), transition: transitionOf([["color", GOO_COLOR_MS, PLAIN_EASE]], reduced) }}
            >
              {item.label}
            </BarEntry>
          </li>
        ))}
      </ul>
    </nav>
  );
}
