"use client";
// 行为规格参照 docs/research/catalog/textanimations.md 的 ScrollFloat, ScrollReveal 条目, 实现为 HX 自有.

import { useRef, useState, type ElementType, type JSX, type RefObject } from "react";
import { ease } from "../../../craft/ease";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { approach } from "../../../motion/spring/follow";
import { cn } from "../../../primitives/utils";
import { clamp01, mix, smoothstep } from "../kernel/curve";
import { useScrollFrame } from "../kernel/scroll";
import { splitText, type SplitUnit } from "../kernel/split";
import { maxRank, staggerRanks, unitProgress, type StaggerFrom } from "../kernel/stagger";
import { MS_PER_S, UNIT_CLASS, WORD_CLASS } from "../kernel/tokens";
import { TextShell } from "../kernel/TextShell";
import { usePlayhead } from "../kernel/use-playhead";
import { FLOAT_DEFAULTS, FLOAT_FADE, REVEAL_DEFAULTS, REVEAL_ROTATE_MAX_S, SCROLL_RANGE, SCRUB_SPAN } from "./tokens";

/** float 逐字从下方拉伸着浮起; reveal 逐词从半透明, 模糊变清晰, 整段转角回正. */
export type ScrollTextEffect = "float" | "reveal";

export interface ScrollTextProps {
  readonly text: string;
  readonly effect?: ScrollTextEffect;
  /** 默认 float 按字, reveal 按词. */
  readonly by?: SplitUnit;
  readonly order?: StaggerFrom;
  /** scrub 跟随滚动来回; enter 进视口后按时长播一次. */
  readonly mode?: "scrub" | "enter";
  /** 名次间隔 (单位与 duration 相同). */
  readonly stagger?: number;
  /** 单元时长; enter 模式下为秒. */
  readonly duration?: number;
  /** float: 起始位移 (像素) 与纵向拉伸倍数. */
  readonly distance?: number;
  readonly stretch?: number;
  /** reveal: 底透明度, 起始模糊 (像素), 整段起始转角 (度). */
  readonly baseOpacity?: number;
  readonly blurStrength?: number;
  readonly baseRotation?: number;
  readonly enableBlur?: boolean;
  /** 进度平滑的时间常数 (秒), 0 为不平滑. */
  readonly smoothing?: number;
  /** 滚动区间: 顶边到视口 start 处开始, 底边到视口 end 处结束 (视口比例). */
  readonly start?: number;
  readonly end?: number;
  readonly scrollContainerRef?: RefObject<HTMLElement | null>;
  /** 已显影的词的附加类 (语义 token). */
  readonly highlightClassName?: string;
  readonly as?: ElementType;
  readonly className?: string;
}

/** 滚动显影里第 rank 名的单元进度: 整段进度 p 映射到刮擦时间轴. */
export function scrubUnit(p: number, rank: number, top: number, step: number, span: number): number {
  if (p >= 1) return 1;
  return unitProgress(p * (top * step + span), rank, step, span);
}

/**
 * 滚动驱动的文字: 进度来自内核 useScrollFrame (滚动唤醒 motion/frame 帧循环), 可选一阶平滑;
 * 每个单元的进度按名次从整段进度切出, 来回滚动时来回走. enter 模式改由播放头按时长播.
 * 减弱动效时直接显示原文.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-text-scroll.md
 */
export function ScrollText({
  text,
  effect = "float",
  by,
  order = "start",
  mode = "scrub",
  stagger,
  duration,
  distance = FLOAT_DEFAULTS.distance,
  stretch = FLOAT_DEFAULTS.stretch,
  baseOpacity = REVEAL_DEFAULTS.baseOpacity,
  blurStrength = REVEAL_DEFAULTS.blurStrength,
  baseRotation = REVEAL_DEFAULTS.baseRotation,
  enableBlur = true,
  smoothing = 0,
  start = SCROLL_RANGE.start,
  end = SCROLL_RANGE.end,
  scrollContainerRef,
  highlightClassName,
  as = "span",
  className,
}: ScrollTextProps): JSX.Element {
  const reduced = useReducedMotion();
  const root = useRef<HTMLElement>(null);
  const float = effect === "float";
  const split = splitText(text, by ?? (float ? "char" : "word"));
  const ranks = staggerRanks(split.count, order);
  const top = maxRank(ranks);
  const step = stagger ?? (float ? FLOAT_DEFAULTS.stagger : REVEAL_DEFAULTS.stagger);
  const span = duration ?? (float ? FLOAT_DEFAULTS.duration : mode === "enter" ? REVEAL_DEFAULTS.duration : SCRUB_SPAN);
  const [progress, setProgress] = useState(0);
  const shown = useRef(0);
  const scrub = mode === "scrub" && !reduced;

  useScrollFrame(root, (sample, dtMs) => {
    shown.current = smoothing > 0 ? approach(shown.current, sample.progress, dtMs / MS_PER_S, smoothing) : sample.progress;
    setProgress(shown.current);
    return Math.abs(shown.current - sample.progress) > 1e-3;
  }, { container: scrollContainerRef, start, end, enabled: scrub });

  const totalS = top * step + span;
  const head = usePlayhead(root, { durationMs: totalS * MS_PER_S, reduced: reduced || mode !== "enter", trigger: "view" });
  const t = mode === "enter" ? (head.started ? head.elapsedMs / MS_PER_S : 0) : progress * totalS;
  const turn = mode === "enter" ? clamp01(t / Math.min(totalS, REVEAL_ROTATE_MAX_S)) : progress;

  if (reduced) {
    const Tag = as;
    return <Tag data-slot="scroll-text" className={className}>{text}</Tag>;
  }

  return (
    <TextShell
      ref={root}
      as={as}
      text={text}
      slot="scroll-text"
      className={cn("inline-block", className)}
      style={!float && baseRotation ? { transform: `rotate(${mix(baseRotation, 0, ease("out", turn))}deg)`, transformOrigin: "0% 50%" } : undefined}
    >
      {split.groups.map((group, g) => {
        if (group.space) return <span key={g}>{group.text}</span>;
        return (
          <span key={g} className={WORD_CLASS}>
            {group.units.map((unit) => {
              const u = mode === "scrub" ? scrubUnit(progress, ranks[unit.index], top, step, span) : unitProgress(t, ranks[unit.index], step, span);
              if (float) {
                const e = ease("overshoot", u);
                return (
                  <span key={unit.index} data-unit={unit.index} className={UNIT_CLASS} style={{ opacity: smoothstep(FLOAT_FADE[0], FLOAT_FADE[1], u), transform: `translateY(${(1 - e) * distance}px) scaleY(${mix(stretch, 1, e)})`, transformOrigin: "50% 0%" }}>
                    {unit.text}
                  </span>
                );
              }
              return (
                <span key={unit.index} data-unit={unit.index} className={cn(UNIT_CLASS, u >= 1 && highlightClassName)} style={{ opacity: mix(baseOpacity, 1, u), filter: enableBlur ? `blur(${mix(blurStrength, 0, u)}px)` : undefined }}>
                  {unit.text}
                </span>
              );
            })}
          </span>
        );
      })}
    </TextShell>
  );
}
