"use client";
// 行为规格参照 docs/research/catalog/textanimations.md 的 StrokeText 条目, 实现为 HX 自有.

import { useLayoutEffect, useRef, useState, type ElementType, type JSX } from "react";
import { ease } from "../../../craft/ease";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { clamp01 } from "../kernel/curve";
import { splitCells } from "../kernel/split";
import { maxRank, staggerRanks, unitProgress } from "../kernel/stagger";
import { HALF, MS_PER_S, PERCENT, SR_ONLY } from "../kernel/tokens";
import { usePlayhead, type PlayTrigger } from "../kernel/use-playhead";
import { TRACE_DEFAULTS, TRACE_FILL_SHARE, TRACE_OUTLINE_EM } from "./tokens";

export interface TraceTextProps {
  readonly text: string;
  /** 单字描边时长 (秒). */
  readonly drawDuration?: number;
  /** 最后一笔描完到开始填色的间隔 (秒). */
  readonly fillDelay?: number;
  /** 字间隔 (秒). */
  readonly stagger?: number;
  readonly strokeWidth?: number;
  /** wipe 从一侧擦出; fade 淡入; none 只留描边. */
  readonly fillMode?: "wipe" | "fade" | "none";
  readonly wipeFrom?: "left" | "right";
  /** 从最后一个字开始描. */
  readonly reverse?: boolean;
  readonly strokeStyle?: "solid" | "dashed";
  readonly dashLength?: number;
  readonly trigger?: PlayTrigger;
  readonly play?: boolean;
  readonly loop?: boolean;
  /** 描边颜色, 语义 token 类. */
  readonly strokeClassName?: string;
  readonly as?: ElementType;
  readonly className?: string;
}

interface Box {
  readonly x: number;
  readonly y: number;
  readonly size: number;
}

/** 描边书写进度: 每字的描边量, 与整体填色量. */
export function traceAt(t: number, rank: number, top: number, o: { readonly stagger: number; readonly draw: number; readonly fillDelay: number }): { readonly draw: number; readonly fill: number } {
  const fillStart = top * o.stagger + o.draw + o.fillDelay;
  return { draw: unitProgress(t, rank, o.stagger, o.draw), fill: clamp01((t - fillStart) / (o.draw * TRACE_FILL_SHARE)) };
}

/**
 * 描边书写: 每个字的轮廓按字间隔依次描出, 全部描完后底下的正文擦出或淡入.
 * 正文层是真实文字, 也是量位置的尺子; 描边层是叠在上面的 SVG. 减弱动效时直接显示正文.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-text-stagger.md
 */
export function TraceText({
  text,
  drawDuration = TRACE_DEFAULTS.drawDuration,
  fillDelay = TRACE_DEFAULTS.fillDelay,
  stagger = TRACE_DEFAULTS.stagger,
  strokeWidth = TRACE_DEFAULTS.strokeWidth,
  fillMode = "wipe",
  wipeFrom = "left",
  reverse = false,
  strokeStyle = "solid",
  dashLength = TRACE_DEFAULTS.dashLength,
  trigger = "mount",
  play,
  loop = false,
  strokeClassName = "stroke-primary",
  as: Tag = "span",
  className,
}: TraceTextProps): JSX.Element {
  const reduced = useReducedMotion();
  const root = useRef<HTMLElement>(null);
  const cells = useRef<(HTMLSpanElement | null)[]>([]);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const glyphs = splitCells(text);
  const ranks = staggerRanks(glyphs.length, reverse ? "end" : "start");
  const top = maxRank(ranks);
  const timing = { stagger, draw: drawDuration, fillDelay };
  const totalS = top * stagger + drawDuration + fillDelay + drawDuration * TRACE_FILL_SHARE;
  const head = usePlayhead(root, { durationMs: totalS * MS_PER_S, reduced, trigger, play, loop });
  const t = head.started ? head.elapsedMs / MS_PER_S : 0;

  useLayoutEffect(() => {
    const host = root.current;
    if (!host || reduced) return undefined;
    const measure = (): void => {
      const base = host.getBoundingClientRect();
      setBoxes(cells.current.map((el) => {
        const r = el?.getBoundingClientRect();
        return r ? { x: r.left - base.left, y: r.top - base.top + r.height * HALF, size: r.height } : { x: 0, y: 0, size: 0 };
      }));
    };
    measure();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    ro?.observe(host);
    return () => ro?.disconnect();
  }, [text, reduced]);

  if (reduced) return <Tag data-slot="trace-text" className={className}>{text}</Tag>;
  const fill = traceAt(t, 0, top, timing).fill;
  const clip = wipeFrom === "left" ? `inset(0 ${(1 - fill) * PERCENT}% 0 0)` : `inset(0 0 0 ${(1 - fill) * PERCENT}%)`;
  const fillStyle = fillMode === "wipe" ? { clipPath: clip } : { opacity: fillMode === "fade" ? fill : 0 };

  return (
    <Tag ref={root} data-slot="trace-text" className={cn("relative inline-block", className)} {...head.bind}>
      <span className={SR_ONLY}>{text}</span>
      <span aria-hidden="true" className="inline-block" style={fillStyle}>
        {glyphs.map((g, i) => (
          <span key={i} ref={(el) => { cells.current[i] = el; }}>{g.text}</span>
        ))}
      </span>
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" style={{ font: "inherit" }}>
        {glyphs.map((g, i) => {
          const box = boxes[i];
          if (g.space || !box) return null;
          const outline = box.size * TRACE_OUTLINE_EM;
          const draw = ease("out", traceAt(t, ranks[i], top, timing).draw);
          const dashed = strokeStyle === "dashed";
          return (
            <text
              key={i}
              x={box.x}
              y={box.y}
              dominantBaseline="central"
              fill="none"
              className={strokeClassName}
              strokeWidth={strokeWidth}
              strokeDasharray={dashed ? `${dashLength} ${dashLength}` : outline}
              strokeDashoffset={dashed ? 0 : outline * (1 - draw)}
              opacity={dashed ? draw : 1}
            >
              {g.text}
            </text>
          );
        })}
      </svg>
    </Tag>
  );
}
