"use client";
// 行为规格参照 docs/research/catalog/textanimations.md 的 FallingText 条目, 实现为 HX 自有.

import { useEffect, useRef, useState, type JSX, type PointerEvent as ReactPointerEvent } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { SpringChannels } from "../../../motion/drive/channels";
import { useFrameLoop } from "../../../motion/frame/use-frame-loop";
import { springFromDuration } from "../../../motion/spring/fit";
import { stepSpringExact } from "../../../motion/spring/step";
import { cn } from "../../../primitives/utils";
import { clamp, hash01 } from "../kernel/curve";
import { splitText, type SplitUnit } from "../kernel/split";
import { staggerRanks } from "../kernel/stagger";
import { HALF, MS_PER_S, SR_ONLY, TEXT_CLOCK, VIEW_THRESHOLD } from "../kernel/tokens";
import { DROP_DEFAULTS, DROP_FALL_S, DROP_SCATTER_SHARE, DROP_TILT_DEG } from "./tokens";

export interface DropTextProps {
  readonly text: string;
  /** 要高亮的词 (按原样比较). */
  readonly highlightWords?: readonly string[];
  /** 高亮词的类, 默认主色. */
  readonly highlightClassName?: string;
  /** auto 挂载即落; click 点击; hover 指针进入; view 进视口. */
  readonly trigger?: "auto" | "click" | "hover" | "view";
  readonly split?: SplitUnit;
  /** 重力倍数: 越大落得越快. */
  readonly gravity?: number;
  /** 落地回弹 0 到 1. */
  readonly bounciness?: number;
  /** 横向散开 0 到 1. */
  readonly scatter?: number;
  /** 相邻名次的起落间隔 (秒). */
  readonly stagger?: number;
  /** random 乱序; start 从头; together 同时. */
  readonly order?: "random" | "start" | "together";
  /** 可以拖起单个词, 松手再落. */
  readonly draggable?: boolean;
  /** 落地后多少秒回到原位; 0 不回. */
  readonly restoreDelay?: number;
  readonly className?: string;
}

type Pose = { x: number; y: number; r: number };

/** 每个单元落地的位姿: 落到容器底, 横向散开但不出容器, 带一点倾角. */
export function dropPose(i: number, cell: DOMRect, box: DOMRect, scatter: number): Pose {
  const spread = (hash01(i, 2) - HALF) * 2 * scatter * box.width * DROP_SCATTER_SHARE;
  const x = clamp(spread, box.left - cell.left, box.right - cell.right);
  return { x, y: box.bottom - cell.bottom, r: (hash01(i, 3) - HALF) * 2 * DROP_TILT_DEG * scatter };
}

/**
 * 坠落文字: 触发后各词按名次错开落到容器底, 落地回弹由 "时长 + bounce" 换算的弹簧给出, 可拖起再落, 可定时复位.
 * 容器高度由调用方的类给出. 减弱动效时文字不动.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-text-stagger.md
 */
export function DropText({
  text,
  highlightWords = [],
  highlightClassName = "text-primary",
  trigger = "auto",
  split = "word",
  gravity = DROP_DEFAULTS.gravity,
  bounciness = DROP_DEFAULTS.bounciness,
  scatter = DROP_DEFAULTS.scatter,
  stagger = DROP_DEFAULTS.stagger,
  order = "random",
  draggable = true,
  restoreDelay = DROP_DEFAULTS.restoreDelay,
  className,
}: DropTextProps): JSX.Element {
  const reduced = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const cells = useRef<(HTMLSpanElement | null)[]>([]);
  const channels = useRef(new SpringChannels(stepSpringExact));
  const [fallen, setFallen] = useState(false);
  const drag = useRef<{ i: number; sx: number; sy: number; ox: number; oy: number } | null>(null);
  const parts = splitText(text, split);
  const spec = springFromDuration(DROP_FALL_S / Math.sqrt(Math.max(0.05, gravity)), bounciness);

  const paint = (): void => {
    cells.current.forEach((el, i) => {
      if (!el) return;
      const c = channels.current;
      el.style.transform = `translate(${c.value(`${i}x`)}px, ${c.value(`${i}y`)}px) rotate(${c.value(`${i}r`)}deg)`;
    });
  };
  const loop = useFrameLoop((dt, now) => {
    channels.current.step(dt, now);
    paint();
    return channels.current.active();
  }, TEXT_CLOCK);

  const aimAll = (pose: (i: number) => Pose, delayed: boolean): void => {
    const now = performance.now();
    const ranks = staggerRanks(parts.count, order === "random" ? "random" : "start");
    cells.current.forEach((_, i) => {
      const p = pose(i);
      const delayMs = delayed && order !== "together" ? ranks[i] * stagger * MS_PER_S : 0;
      for (const k of ["x", "y", "r"] as const) channels.current.aim(`${i}${k}`, p[k], spec, { now, delayMs });
    });
    loop.wake();
  };

  const fall = (): void => {
    const host = root.current;
    if (reduced || fallen || !host) return;
    const box = host.getBoundingClientRect();
    const rest = cells.current.map((el, i) => (el ? dropPose(i, el.getBoundingClientRect(), box, scatter) : { x: 0, y: 0, r: 0 }));
    setFallen(true);
    aimAll((i) => rest[i], true);
  };

  useEffect(() => {
    if (!fallen || restoreDelay <= 0) return undefined;
    const id = globalThis.setTimeout(() => {
      aimAll(() => ({ x: 0, y: 0, r: 0 }), false);
      setFallen(false);
    }, restoreDelay * MS_PER_S);
    return () => globalThis.clearTimeout(id);
  });

  useEffect(() => {
    if (trigger === "auto") fall();
    const host = root.current;
    if (trigger !== "view" || !host || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && fall(), { threshold: VIEW_THRESHOLD });
    io.observe(host);
    return () => io.disconnect();
    // 触发方式只在挂载时接一次
  }, [trigger]);

  const down = (i: number) => (e: ReactPointerEvent<HTMLSpanElement>): void => {
    if (!draggable || !fallen) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const c = channels.current;
    drag.current = { i, sx: e.clientX, sy: e.clientY, ox: c.value(`${i}x`), oy: c.value(`${i}y`) };
  };
  const move = (e: ReactPointerEvent<HTMLSpanElement>): void => {
    const d = drag.current;
    if (!d) return;
    channels.current.jump(`${d.i}x`, d.ox + e.clientX - d.sx, spec);
    channels.current.jump(`${d.i}y`, d.oy + e.clientY - d.sy, spec);
    paint();
  };
  const up = (): void => {
    const d = drag.current;
    const host = root.current;
    const el = cells.current[d?.i ?? -1];
    drag.current = null;
    if (!d || !host || !el) return;
    const floor = host.getBoundingClientRect().bottom - el.getBoundingClientRect().bottom;
    channels.current.aim(`${d.i}y`, channels.current.value(`${d.i}y`) + floor, spec, { now: performance.now() });
    loop.wake();
  };

  const hot = new Set(highlightWords);
  return (
    <div
      ref={root}
      data-slot="drop-text"
      data-fallen={fallen || undefined}
      className={cn("relative overflow-hidden", className)}
      onClick={trigger === "click" ? fall : undefined}
      onPointerEnter={trigger === "hover" ? fall : undefined}
    >
      <span className={SR_ONLY}>{text}</span>
      <span aria-hidden="true">
        {parts.groups.map((group, g) =>
          group.space ? (
            <span key={g}>{group.text}</span>
          ) : (
            group.units.map((u) => (
              <span
                key={u.index}
                ref={(el) => { cells.current[u.index] = el; }}
                className={cn("inline-block touch-none select-none", hot.has(group.text) && highlightClassName, fallen && draggable && "cursor-grab")}
                onPointerDown={down(u.index)}
                onPointerMove={move}
                onPointerUp={up}
                onPointerCancel={up}
              >
                {u.text}
              </span>
            ))
          ),
        )}
      </span>
    </div>
  );
}
