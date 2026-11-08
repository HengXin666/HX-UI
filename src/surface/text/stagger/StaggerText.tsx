"use client";
// 行为规格参照 docs/research/catalog/textanimations.md 的 BlurText, FoldText, MaskedHeading 条目, 实现为 HX 自有.

import { useRef, type CSSProperties, type ElementType, type JSX } from "react";
import { ease } from "../../../craft/ease";
import { useReducedMotion } from "../../../hooks/browser/media/useReducedMotion";
import { cn } from "../../../primitives/utils";
import { clamp01, midpoint, smoothstep } from "../kernel/curve";
import { splitText, type SplitUnit } from "../kernel/split";
import { maxRank, staggerRanks, unitProgress, type StaggerFrom } from "../kernel/stagger";
import { MS_PER_S, UNIT_CLASS, VIEW_THRESHOLD, WORD_CLASS } from "../kernel/tokens";
import { TextShell } from "../kernel/TextShell";
import { usePlayhead, type PlayTrigger } from "../kernel/use-playhead";
import { BLUR_MID_OVERSHOOT, FOLD_ANGLE_DEG, FOLD_FADE_END, FOLD_PERSPECTIVE_PX, LOOP_DELAY_S, MASK_FROM_PERCENT, MASK_LETTER_SHARE, STAGGER_PRESETS } from "./tokens";

/** blur 模糊入场 (经模糊中点); rise 上浮; fold 绕折线翻下; mask 在词的遮罩里升起. */
export type StaggerVariant = keyof typeof STAGGER_PRESETS;

export interface StaggerTextProps {
  readonly text: string;
  readonly variant?: StaggerVariant;
  /** 按字或按词. 默认 blur 与 mask 按词, 其余按字. */
  readonly by?: SplitUnit;
  /** 相邻名次的间隔 (秒). */
  readonly step?: number;
  /** 单个单元的时长 (秒). */
  readonly duration?: number;
  readonly from?: StaggerFrom;
  /** 进入方向: down 自上而下落入, up 自下而上. 只对 blur 与 rise 生效. */
  readonly direction?: "up" | "down";
  /** 起始模糊 (像素), 只对 blur 生效. */
  readonly blur?: number;
  /** 起始位移 (像素). */
  readonly distance?: number;
  /** 折角 (度), 只对 fold 生效. */
  readonly foldAngle?: number;
  /** 折线在单元的上沿还是下沿. */
  readonly hinge?: "top" | "bottom";
  readonly perspective?: number;
  readonly trigger?: PlayTrigger;
  readonly play?: boolean;
  readonly threshold?: number;
  readonly rootMargin?: string;
  readonly loop?: boolean;
  /** 循环之间停在终点的时长 (秒). */
  readonly loopDelay?: number;
  readonly onComplete?: () => void;
  readonly as?: ElementType;
  readonly className?: string;
}

interface Look {
  readonly style: CSSProperties;
}

function look(variant: StaggerVariant, u: number, o: { blur: number; distance: number; sign: number; foldAngle: number; hinge: string }): Look {
  const e = ease("out", u);
  if (variant === "blur") {
    const y = midpoint(u, o.sign * -o.distance, o.sign * o.distance * BLUR_MID_OVERSHOOT, 0);
    return { style: { opacity: midpoint(u, 0, 0.5, 1), filter: `blur(${midpoint(u, o.blur, o.blur / 2, 0)}px)`, transform: `translateY(${y}px)` } };
  }
  if (variant === "fold") {
    const turn = (o.hinge === "top" ? -1 : 1) * (1 - e) * o.foldAngle;
    return { style: { opacity: smoothstep(0, FOLD_FADE_END, u), transform: `rotateX(${turn}deg)`, transformOrigin: o.hinge === "top" ? "50% 0%" : "50% 100%" } };
  }
  if (variant === "mask") return { style: { transform: `translateY(${(1 - e) * MASK_FROM_PERCENT}%)` } };
  return { style: { opacity: clamp01(u * 2), transform: `translateY(${o.sign * (1 - e) * o.distance}px)` } };
}

/**
 * 错峰入场标题. 一条播放头驱动全部单元, 单元进度由名次与间隔切出; 模糊入场经模糊中点, 前半段降到一半, 后半段才清晰.
 * 进视口, 挂载, 悬停, 点击或受控起播, 可循环. 减弱动效时直接显示原文.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-text-stagger.md
 */
export function StaggerText({
  text,
  variant = "blur",
  by,
  step,
  duration,
  from = "start",
  direction = "down",
  blur,
  distance,
  foldAngle = FOLD_ANGLE_DEG,
  hinge = "top",
  perspective = FOLD_PERSPECTIVE_PX,
  trigger = "view",
  play,
  threshold = VIEW_THRESHOLD,
  rootMargin,
  loop = false,
  loopDelay = LOOP_DELAY_S,
  onComplete,
  as = "span",
  className,
}: StaggerTextProps): JSX.Element {
  const preset = STAGGER_PRESETS[variant];
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const unit = by ?? preset.by;
  const split = splitText(text, unit);
  const gap = step ?? preset.step;
  const span = duration ?? preset.duration;
  const ranks = staggerRanks(split.count, from);
  const letterGap = variant === "mask" && unit === "char" ? gap * MASK_LETTER_SHARE : gap;
  const totalS = maxRank(ranks) * letterGap + span;
  const head = usePlayhead(ref, { durationMs: totalS * MS_PER_S, reduced, trigger, play, threshold, rootMargin, loop, loopDelayMs: loopDelay * MS_PER_S, onComplete });
  const t = head.elapsedMs / MS_PER_S;
  const opts = { blur: blur ?? preset.blur, distance: distance ?? preset.distance, sign: direction === "down" ? 1 : -1, foldAngle, hinge };

  if (reduced) {
    const Tag = as;
    return <Tag data-slot="stagger-text" className={className}>{text}</Tag>;
  }

  return (
    <TextShell ref={ref} as={as} text={text} slot="stagger-text" className={className} {...head.bind}>
      {split.groups.map((group, g) => {
        if (group.space) return <span key={g}>{group.text}</span>;
        return (
          <span key={g} className={cn(WORD_CLASS, variant === "mask" && "overflow-hidden align-bottom")} style={variant === "fold" ? { perspective } : undefined}>
            {group.units.map((piece) => {
              const u = head.started ? unitProgress(t, ranks[piece.index], letterGap, span) : 0;
              return (
                <span key={piece.index} data-unit={piece.index} className={UNIT_CLASS} style={look(variant, u, opts).style}>
                  {piece.text}
                </span>
              );
            })}
          </span>
        );
      })}
    </TextShell>
  );
}
