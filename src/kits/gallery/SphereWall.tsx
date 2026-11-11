"use client";
// 行为规格参照 docs/research/catalog/components-1.md 的 DomeGallery 条目, 实现为 HX 自有.

import { useEffect, useRef, useState, type CSSProperties, type JSX, type KeyboardEvent } from "react";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import { cn } from "../../primitives/utils";
import { useDrag } from "./parts/use-drag";
import * as D from "./parts/dome-spec";
import { KIT_FOCUS, PLAIN_EASE, transitionOf, useKitMotion } from "../tokens";

export { DOME_DEFAULTS, domeCells, domeDecay, domeFling, domeRadius, type DomeCell } from "./parts/dome-spec";

export interface SphereImage {
  readonly src: string;
  readonly alt: string;
}

export interface SphereWallProps {
  readonly images: readonly SphereImage[];
  readonly fit?: number;
  readonly minRadius?: number;
  readonly maxRadius?: number;
  readonly segments?: number;
  readonly dragSensitivity?: number;
  /** 惯性衰减率 (每秒). */
  readonly dragDampening?: number;
  readonly maxVerticalRotationDeg?: number;
  readonly enlargeTransitionMs?: number;
  readonly grayscale?: boolean;
  readonly ariaLabel?: string;
  readonly className?: string;
}

const KEY_STEP_DEG = 10;

/**
 * 穹顶墙: 图片铺在球内壁上, 观者在球心. 拖拽转动球面 (竖向限幅), 松手带惯性按 dragDampening 衰减; 方向键每次转 10 度.
 * 点一张图放大到中央对话框, Escape 或点遮罩关闭并还焦点. 减弱动效时无惯性, 放大无过渡.
 *
 * .agents/notes/implemented/feature/2026-11-09-kits-gallery.md
 */
export function SphereWall({
  images,
  fit = D.DOME_DEFAULTS.fit,
  minRadius = D.DOME_DEFAULTS.minRadius,
  maxRadius = Infinity,
  segments = D.DOME_DEFAULTS.segments,
  dragSensitivity = D.DOME_DEFAULTS.dragSensitivity,
  dragDampening = D.DOME_DEFAULTS.dragDampening,
  maxVerticalRotationDeg = D.DOME_DEFAULTS.maxVerticalRotationDeg,
  enlargeTransitionMs = D.DOME_DEFAULTS.enlargeTransitionMs,
  grayscale = false,
  ariaLabel = "Gallery",
  className,
}: SphereWallProps): JSX.Element {
  const reduced = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const sphere = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const s = useRef({ x: 0, y: 0, vy: 0, x0: 0, y0: 0 });
  const [radius, setRadius] = useState(minRadius);
  const [open, setOpen] = useState(-1);
  const [shown, setShown] = useState(false);
  const cells = D.domeCells(segments, images.length);
  const cellSize = (2 * Math.PI * radius) / Math.max(1, segments);

  const clampX = (x: number): number => Math.max(-maxVerticalRotationDeg, Math.min(maxVerticalRotationDeg, x));
  const motion = useKitMotion(
    () => {
      if (sphere.current) sphere.current.style.transform = `translateZ(${radius}px) rotateX(${s.current.x}deg) rotateY(${s.current.y}deg)`;
    },
    reduced,
    (dtMs) => {
      const st = s.current;
      if (reduced || Math.abs(st.vy) < D.DOME_REST_V) {
        st.vy = 0;
        return false;
      }
      st.y += st.vy * dtMs;
      st.vy = D.domeDecay(st.vy, dragDampening, dtMs);
      return true;
    },
  );

  useEffect(() => {
    const node = root.current;
    if (!node) return undefined;
    const fitNow = (): void => setRadius(D.domeRadius(node.offsetWidth, node.offsetHeight, fit, minRadius, maxRadius));
    fitNow();
    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(fitNow);
    ro.observe(node);
    return () => ro.disconnect();
  }, [fit, maxRadius, minRadius]);
  useEffect(() => motion.paint(), [motion, radius]);

  useEffect(() => {
    if (open < 0) return undefined;
    closeBtn.current?.focus();
    const id = window.requestAnimationFrame(() => setShown(true));
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  const close = (): void => {
    setShown(false);
    setOpen(-1);
    opener.current?.focus();
  };
  const drag = useDrag({
    onStart: () => {
      s.current.vy = 0;
      s.current.x0 = s.current.x;
      s.current.y0 = s.current.y;
    },
    onMove: (dx, dy) => {
      s.current.y = s.current.y0 + dx * dragSensitivity;
      s.current.x = clampX(s.current.x0 - dy * dragSensitivity);
      motion.paint();
    },
    onEnd: (vx) => {
      s.current.vy = D.domeFling(vx) * dragSensitivity;
      motion.wake();
    },
  });
  const onKey = (event: KeyboardEvent<HTMLElement>): void => {
    const d = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [1, 0], ArrowDown: [-1, 0] }[event.key];
    if (!d) return;
    event.preventDefault();
    s.current.vy = 0;
    s.current.x = clampX(s.current.x + (d[0] ?? 0) * KEY_STEP_DEG);
    s.current.y += (d[1] ?? 0) * KEY_STEP_DEG;
    motion.paint();
  };
  const fade = (props: string[]): CSSProperties => ({ transition: transitionOf(props.map((p) => [p, enlargeTransitionMs, PLAIN_EASE] as const), reduced) });
  const current = open >= 0 ? images[open] : undefined;

  return (
    <div ref={root} data-slot="sphere-wall" className={cn("relative size-full min-h-80 overflow-hidden", className)}>
      <div tabIndex={0} role="region" aria-label={ariaLabel} onKeyDown={onKey} className={cn("absolute inset-0 touch-none select-none", KIT_FOCUS)} style={{ perspective: radius }} {...drag.bind}>
        <div ref={sphere} data-slot="sphere-wall-sphere" className="absolute left-1/2 top-1/2" style={{ transformStyle: "preserve-3d", transform: `translateZ(${radius}px) rotateX(0deg) rotateY(0deg)` }}>
          {cells.map((cell, i) => {
            const img = images[cell.image];
            return (
              <button
                key={i}
                type="button"
                aria-label={img?.alt}
                data-slot="sphere-wall-tile"
                onClick={(event) => {
                  if (drag.dragged()) return;
                  opener.current = event.currentTarget;
                  setOpen(cell.image);
                }}
                className={cn("absolute overflow-hidden rounded-lg border-0 p-0 [backface-visibility:hidden]", KIT_FOCUS)}
                style={{ width: cellSize * 0.9, height: cellSize * 0.9, left: -cellSize * 0.45, top: -cellSize * 0.45, transform: `rotateY(${cell.lon}deg) rotateX(${cell.lat}deg) translateZ(${-radius}px)` }}
              >
                <img src={img?.src} alt="" draggable={false} className="size-full object-cover" style={{ filter: grayscale ? "grayscale(1)" : undefined }} />
              </button>
            );
          })}
        </div>
      </div>
      {current ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.alt}
          data-slot="sphere-wall-dialog"
          onKeyDown={(event) => {
            if (event.key === "Escape") close();
          }}
          className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-sm"
          style={{ opacity: shown ? 1 : 0, ...fade(["opacity"]) }}
        >
          <button ref={closeBtn} type="button" aria-label="Close" onClick={close} className={cn("absolute inset-0 cursor-zoom-out border-0 bg-transparent", KIT_FOCUS)} />
          <img src={current.src} alt={current.alt} className="pointer-events-none relative max-h-[80%] max-w-[80%] rounded-2xl object-contain" style={{ transform: `scale(${shown ? 1 : 0.9})`, ...fade(["transform"]) }} />
        </div>
      ) : null}
    </div>
  );
}
