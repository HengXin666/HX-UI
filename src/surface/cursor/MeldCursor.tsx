"use client";
// 行为规格参照 docs/research/catalog/animations.md 的 BlobCursor 条目, 实现为 HX 自有.

import { useRef, type JSX, type ReactNode } from "react";
import type { BackdropFrame } from "../backdrop/kernel/use-backdrop";
import { useCanvasBackdrop } from "../backdrop/kernel/use-surfaces";
import { inkOf } from "../pointer/ink";
import { SurfaceLayer } from "../pointer/SurfaceLayer";
import { TONE_TOKEN, type SurfaceTone } from "../pointer/tone";
import { clamp, pointerPx, seededRandom } from "./parts/common";
import { makeMeld, splashMeld, stepMeld } from "./parts/meld";
import { MELD } from "./tokens";

export interface MeldCursorProps {
  readonly children?: ReactNode;
  readonly tone?: SurfaceTone;
  /** 头部直径 px. */
  readonly size?: number;
  /** 形变时钟的速度, 0 时不晃. */
  readonly morphSpeed?: number;
  /** 尾链点数, 上限 16. */
  readonly trail?: number;
  /** 0 到 1, 越大头部越拖. */
  readonly lag?: number;
  /** 0 到 1, 尾链之间的粘连粗细. */
  readonly goo?: number;
  /** 沿速度方向的拉伸. */
  readonly stretch?: number;
  readonly wobble?: number;
  /** 点击时溅出. */
  readonly splash?: boolean;
  readonly splashCount?: number;
  readonly splashSpeed?: number;
  readonly splashSize?: number;
  readonly splashGravity?: number;
  /** 0 到 1, 溅出后回长的快慢. */
  readonly regrow?: number;
  /** 头部高光强度, 0 关闭. */
  readonly shine?: number;
  /** 区域内隐藏系统光标. */
  readonly hideCursor?: boolean;
  readonly className?: string;
}

/**
 * 跟手的融滴光标: 头部是弹簧跟随的软球, 后面拖一串逐点跟随的小球并以粘连带相连; 快速移动时沿速度拉伸, 停下后轻轻晃.
 * 点击溅出几滴, 头部按溅出量变小再回长. 画布叠在 children 上方, aria-hidden 且不接指针.
 * 减弱动效: 不画.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-cursor.md
 */
export function MeldCursor({
  children,
  tone = "primary",
  size = MELD.size,
  morphSpeed = MELD.morphSpeed,
  trail = MELD.trail,
  lag = MELD.lag,
  goo = 1,
  stretch = MELD.stretch,
  wobble = MELD.wobble,
  splash = true,
  splashCount = MELD.splashCount,
  splashSpeed = MELD.splashSpeed,
  splashSize = MELD.splashSize,
  splashGravity = MELD.splashGravity,
  regrow = MELD.regrow,
  shine = MELD.shine,
  hideCursor = true,
  className,
}: MeldCursorProps): JSX.Element {
  const sim = useRef(makeMeld());
  const seen = useRef(-1);
  const rand = useRef(seededRandom(Math.round(size)));

  const draw = (ctx: CanvasRenderingContext2D, frame: BackdropFrame): void => {
    const { width, height, scale } = frame.fit;
    ctx.clearRect(0, 0, width, height);
    if (frame.reduced) return;
    const s = sim.current;
    const [tx, ty] = pointerPx(frame);
    if (!frame.pointer.inside && !s.placed) return;
    stepMeld(s, tx, ty, frame.dt, { lag, trail, morphSpeed, regrow, splashGravity }, scale);
    const radius = (size / 2) * scale;
    for (const tap of frame.pointer.taps) {
      if (tap.at <= seen.current) continue;
      seen.current = tap.at;
      if (splash) splashMeld(s, splashCount, splashSpeed, splashSize, radius, scale, rand.current);
    }
    const body = radius * Math.cbrt(s.mass) * (1 + MELD.wobbleAmp * wobble * Math.sin(s.clock * 2.3) * Math.cos(s.clock * 1.7));
    ctx.globalAlpha = frame.pointer.presence;
    ctx.fillStyle = inkOf(frame.colors[0]);
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineCap = "round";
    let px = s.head.x;
    let py = s.head.y;
    let pr = body;
    s.trail.forEach((p, i) => {
      const r = body * (1 - (i + 1) / (s.trail.length + 1)) ** 0.8;
      if (goo > 0) {
        ctx.lineWidth = Math.min(r, pr) * 2 * clamp(goo, 0, 1);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      px = p.x;
      py = p.y;
      pr = r;
    });
    const speed = Math.hypot(s.head.vx, s.head.vy) / Math.max(scale, 1e-6);
    const pull = Math.min(MELD.stretchCap, stretch * (speed / MELD.stretchSpeed));
    ctx.beginPath();
    ctx.ellipse(s.head.x, s.head.y, body * (1 + pull), body / Math.sqrt(1 + pull), Math.atan2(s.head.vy, s.head.vx), 0, Math.PI * 2);
    ctx.fill();
    for (const d of s.drops) {
      ctx.globalAlpha = frame.pointer.presence * (1 - d.age / MELD.dropLifeS);
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r * (1 - 0.5 * (d.age / MELD.dropLifeS)), 0, Math.PI * 2);
      ctx.fill();
    }
    if (shine > 0) {
      ctx.globalAlpha = frame.pointer.presence * clamp(shine, 0, 1) * 0.35;
      ctx.fillStyle = inkOf(frame.colors[1]);
      ctx.beginPath();
      ctx.arc(s.head.x - body * 0.3, s.head.y - body * 0.35, body * 0.28, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  const handle = useCanvasBackdrop({ draw }, { colors: [TONE_TOKEN[tone], TONE_TOKEN.background] });
  return (
    <SurfaceLayer handle={handle} slot="meld-cursor" className={hideCursor ? `cursor-none ${className ?? ""}`.trim() : className}>
      {children}
    </SurfaceLayer>
  );
}
