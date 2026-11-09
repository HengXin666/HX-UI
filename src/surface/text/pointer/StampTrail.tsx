"use client";
// 行为规格参照 docs/research/catalog/textanimations.md 的 TextCursor 条目, 实现为 HX 自有.

import { useRef, type JSX, type ReactNode } from "react";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { useFrameLoop } from "../../../motion/frame/use-frame-loop";
import { approach } from "../../../motion/spring/follow";
import { prefersReducedMotion } from "../../../primitives/motion";
import { cn } from "../../../primitives/utils";
import { hash01 } from "../kernel/curve";
import { usePointerField } from "../kernel/pointer";
import { MS_PER_S, TEXT_CLOCK } from "../kernel/tokens";
import { removalTick, stampAngle, stampContent, stampFloat, stampLook } from "./parts/stamp";
import type { ExtrudeTone } from "./ExtrudeText";
import { STAMP_DEFAULTS, STAMP_FLOAT_PX, STAMP_FLOAT_RATE, STAMP_IDLE_S, STAMP_MAX_DT_S, STAMP_MIN_REMOVAL_S, STAMP_POP_S, STAMP_SMOOTH_TAU_S } from "./tokens";

export interface StampTrailProps {
  /** 盖下去的字. */
  readonly text: string;
  /** stamp 每枚整段原文; trail 逐字轮换. */
  readonly mode?: "stamp" | "trail";
  /** 两枚之间的路程 (px). */
  readonly spacing?: number;
  /** 同时最多几枚, 多出的最早一枚退场. */
  readonly maxPoints?: number;
  /** 章随移动方向转. */
  readonly followMouseDirection?: boolean;
  /** 转向时保持正立. */
  readonly keepUpright?: boolean;
  /** 章轻轻漂浮. */
  readonly randomFloat?: boolean;
  /** 退场时长 (秒). */
  readonly exitDuration?: number;
  /** 指针停下后每隔多少毫秒收一枚. */
  readonly removalInterval?: number;
  /** 退场时缩小与淡出的比例, 0 到 1. */
  readonly shrink?: number;
  readonly fade?: number;
  /** 跟手平滑, 0 为紧跟. */
  readonly smoothing?: number;
  /** 新章弹出. */
  readonly popIn?: boolean;
  /** 在区域内隐藏系统光标. */
  readonly hideCursor?: boolean;
  /** 章的颜色 (语义 token 名). */
  readonly tone?: ExtrudeTone;
  /** 章的字号 (px) 与字重. */
  readonly fontSize?: number;
  readonly fontWeight?: number;
  /** 区域里的正文. */
  readonly children?: ReactNode;
  readonly className?: string;
}

interface Stamp {
  x: number;
  y: number;
  angle: number;
  age: number;
  exit: number;
  live: boolean;
  seed: number;
}

/**
 * 盖章光标: 在区域里移动指针, 沿路每隔 spacing 盖一枚字章, 超出 maxPoints 的最早一枚退场, 指针停下后逐个收走.
 * 章是装饰 (aria-hidden), 预先渲染 maxPoints 个槽位循环复用, 每帧只写槽位的 transform 与 opacity, 新章写一次字.
 * 减弱动效: 不盖章, 区域照常显示正文.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-text-pointer.md
 */
export function StampTrail({
  text,
  mode = "stamp",
  spacing = STAMP_DEFAULTS.spacing,
  maxPoints = STAMP_DEFAULTS.maxPoints,
  followMouseDirection = true,
  keepUpright = true,
  randomFloat = true,
  exitDuration = STAMP_DEFAULTS.exitDuration,
  removalInterval = STAMP_DEFAULTS.removalInterval,
  shrink = STAMP_DEFAULTS.shrink,
  fade = STAMP_DEFAULTS.fade,
  smoothing = STAMP_DEFAULTS.smoothing,
  popIn = true,
  hideCursor = false,
  tone = "current",
  fontSize = STAMP_DEFAULTS.fontSize,
  fontWeight = STAMP_DEFAULTS.fontWeight,
  children,
  className,
}: StampTrailProps): JSX.Element {
  const reduced = useReducedMotion();
  const still = reduced || prefersReducedMotion();
  const slots = Math.max(1, Math.round(maxPoints)) + 1;
  const host = useRef<HTMLDivElement>(null);
  const nodes = useRef<(HTMLSpanElement | null)[]>([]);
  const s = useRef({ stamps: [] as Stamp[], px: 0, py: 0, init: false, travel: 0, idle: 0, cut: 0, t: 0, n: 0 });
  if (s.current.stamps.length !== slots) s.current.stamps = Array.from({ length: slots }, () => ({ x: 0, y: 0, angle: 0, age: 0, exit: -1, live: false, seed: 0 }));

  const retireOldest = (): boolean => {
    let oldest: Stamp | null = null;
    for (const st of s.current.stamps) if (st.live && st.exit < 0 && (!oldest || st.age > oldest.age)) oldest = st;
    if (oldest) oldest.exit = 0;
    return oldest !== null;
  };

  const loop = useFrameLoop((dtMs) => {
    const st = s.current;
    const dt = Math.min(STAMP_MAX_DT_S, dtMs / MS_PER_S);
    st.t += dt;
    if (field.inside) {
      if (!st.init) { st.px = field.x; st.py = field.y; st.init = true; }
      const nx = approach(st.px, field.x, dt, smoothing * STAMP_SMOOTH_TAU_S);
      const ny = approach(st.py, field.y, dt, smoothing * STAMP_SMOOTH_TAU_S);
      const step = Math.hypot(nx - st.px, ny - st.py);
      st.travel += step;
      st.idle = step > 0.5 ? 0 : st.idle + dt;
      if (st.travel >= spacing) {
        st.travel = 0;
        const live = st.stamps.filter((p) => p.live && p.exit < 0).length;
        if (live >= maxPoints) retireOldest();
        const free = st.stamps.findIndex((p) => !p.live);
        if (free >= 0) {
          const angle = followMouseDirection ? stampAngle(nx - st.px, ny - st.py, keepUpright) : 0;
          st.stamps[free] = { x: nx, y: ny, angle, age: 0, exit: -1, live: true, seed: hash01(st.n) };
          const node = nodes.current[free];
          if (node) node.textContent = stampContent(text, st.n, mode);
          st.n += 1;
        }
      }
      st.px = nx;
      st.py = ny;
    } else {
      st.init = false;
      st.idle += dt;
    }
    if (st.idle > STAMP_IDLE_S) {
      const tick = removalTick(st.cut, dt, Math.max(STAMP_MIN_REMOVAL_S, removalInterval / MS_PER_S));
      st.cut = tick.acc;
      for (let i = 0; i < tick.count; i += 1) if (!retireOldest()) st.cut = 0;
    } else st.cut = 0;
    let busy = field.inside;
    st.stamps.forEach((p, i) => {
      const node = nodes.current[i];
      if (!p.live) {
        if (node) node.style.opacity = "0";
        return;
      }
      busy = true;
      p.age += dt;
      if (p.exit >= 0) p.exit += dt;
      const look = stampLook(p.age, p.exit, popIn ? STAMP_POP_S : 0, exitDuration, shrink, fade);
      if (look.done) p.live = false;
      const f = randomFloat ? stampFloat(st.t, p.seed, STAMP_FLOAT_PX, STAMP_FLOAT_RATE) : { x: 0, y: 0 };
      if (!node) return;
      node.style.transform = `translate(${p.x + f.x}px, ${p.y + f.y}px) translate(-50%, -50%) rotate(${p.angle}deg) scale(${look.scale})`;
      node.style.opacity = String(look.opacity);
    });
    return busy;
  }, TEXT_CLOCK);

  const field = usePointerField(host, () => loop.wake(), { enabled: !still });

  return (
    <div ref={host} data-slot="stamp-trail" className={cn("relative overflow-hidden", hideCursor && !still && "cursor-none", className)}>
      {children}
      {!still && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none" style={{ fontSize, fontWeight, color: tone === "current" ? "currentColor" : `var(--${tone})` }}>
          {Array.from({ length: slots }, (_, i) => (
            <span key={i} ref={(n) => { nodes.current[i] = n; }} data-stamp={i} className="absolute left-0 top-0 whitespace-nowrap opacity-0" />
          ))}
        </div>
      )}
    </div>
  );
}
