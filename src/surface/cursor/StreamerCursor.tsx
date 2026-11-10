"use client";
// 行为规格参照 docs/research/catalog/animations.md 的 Ribbons 条目, 实现为 HX 自有.

import { useEffect, useRef, type JSX, type ReactNode } from "react";
import type { BackdropFrame } from "../backdrop/kernel/use-backdrop";
import { useCanvasBackdrop } from "../backdrop/kernel/use-surfaces";
import { inkOf } from "../pointer/ink";
import { SurfaceLayer } from "../pointer/SurfaceLayer";
import { TONE_TOKEN, type SurfaceTone } from "../pointer/tone";
import { clamp, pointerPx } from "./parts/common";
import { makeStreamers, ribbonOutline, stepStreamers, type StreamerShape } from "./parts/streamer";
import { STREAMER } from "./tokens";

export interface StreamerCursorProps {
  readonly children?: ReactNode;
  /** 每条彩带一个色调 (语义 token), 条数等于长度. */
  readonly tones?: readonly SurfaceTone[];
  /** 最粗处宽度 px. */
  readonly thickness?: number;
  /** 身长倍数, 越大拖得越长. */
  readonly length?: number;
  /** 各条相对指针错开的距离 px. */
  readonly spread?: number;
  /** 0 到 1, 头部弹簧的硬度. */
  readonly stiffness?: number;
  /** 0 到 1, 越大越弹. */
  readonly bounce?: number;
  readonly shape?: StreamerShape;
  /** 沿法向起伏的幅度, 0 为不起伏. */
  readonly wave?: number;
  /** 打开后尾部渐隐. */
  readonly fade?: boolean;
  readonly opacity?: number;
  readonly className?: string;
}

const DEFAULT_TONES: readonly SurfaceTone[] = ["primary", "link", "success"];

/**
 * 彩带光标: 几条彩带的头各自用弹簧追指针 (错开一点位置与手感), 身体逐点跟随, 宽度按 lens / comet / even 曲线收放,
 * 可选沿法向起伏与尾部渐隐. 画布叠在 children 上方, aria-hidden 且不接指针.
 * 规格没有减弱动效分支; 本库在减弱动效时不画.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-cursor.md
 */
export function StreamerCursor({
  children,
  tones = DEFAULT_TONES,
  thickness = STREAMER.thickness,
  length = STREAMER.length,
  spread = STREAMER.spread,
  stiffness = STREAMER.stiffness,
  bounce = STREAMER.bounce,
  shape = "lens",
  wave = STREAMER.wave,
  fade = false,
  opacity = STREAMER.opacity,
  className,
}: StreamerCursorProps): JSX.Element {
  const sim = useRef(makeStreamers(tones.length));
  useEffect(() => {
    sim.current = makeStreamers(tones.length);
  }, [tones.length]);

  const draw = (ctx: CanvasRenderingContext2D, frame: BackdropFrame): void => {
    const { width, height, scale } = frame.fit;
    ctx.clearRect(0, 0, width, height);
    if (frame.reduced) return;
    const s = sim.current;
    if (!frame.pointer.inside && !s.placed) return;
    const [tx, ty] = pointerPx(frame);
    stepStreamers(s, tx, ty, frame.dt, { stiffness, bounce, length, spread }, scale);
    const half = thickness * 0.5 * scale;
    const phase = s.clock * STREAMER.waveSpeed;
    s.ribbons.forEach((r, i) => {
      const outline = ribbonOutline(r, half, shape, wave, phase);
      if (outline.length < 4) return;
      const ink = frame.colors[i] ?? frame.colors[0];
      const n = outline.length / 2;
      if (!fade) {
        ctx.fillStyle = inkOf(ink, clamp(opacity, 0, 1));
        ctx.beginPath();
        outline.forEach((p, j) => (j === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.closePath();
        ctx.fill();
        return;
      }
      for (let j = 0; j < n - 1; j += 1) {
        const a = outline[j];
        const b = outline[j + 1];
        const c = outline[outline.length - 2 - j];
        const d = outline[outline.length - 1 - j];
        ctx.fillStyle = inkOf(ink, clamp(opacity, 0, 1) * (1 - j / (n - 1)));
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.lineTo(c.x, c.y);
        ctx.lineTo(d.x, d.y);
        ctx.closePath();
        ctx.fill();
      }
    });
  };

  const handle = useCanvasBackdrop({ draw }, { colors: tones.map((t) => TONE_TOKEN[t]) });
  return (
    <SurfaceLayer handle={handle} slot="streamer-cursor" className={className}>
      {children}
    </SurfaceLayer>
  );
}
