"use client";

import { motion, type TargetAndTransition } from "motion/react";
import { Children, createContext, useContext, type JSX, type ReactNode } from "react";
import { cn } from "../../primitives/utils";
import { useMotionTokens } from "../../motion/presets";
import { STUDIO_CLASS } from "../classes";
import {
  dealDelay,
  SHOT_ARC_S,
  SHOT_BEAT_S,
  SHOT_DURATION,
  SHOT_DURATION_KIND,
  SHOT_HIDDEN,
  SHOT_MOVE,
  SHOT_ORIGIN,
  SHOT_PACE,
  SHOT_PERSPECTIVE,
  SHOT_SHOWN,
  SHOT_VIEWPORT_AMOUNT,
  type ShotMove,
  type ShotPace,
} from "../moves";

interface ShotContextValue {
  pace: ShotPace;
  index: number;
  count: number;
}

const ShotContext = createContext<ShotContextValue>({ pace: SHOT_PACE.even, index: 0, count: 1 });

export interface ShotSequenceProps {
  children: ReactNode;
  /** even 等间隔; deal 后段加速, 像发牌. 默认 even. */
  pace?: ShotPace;
  className?: string;
  classNames?: { root?: string };
  /** 给读屏的分组名. 不传时这一组只是视觉编排, 不额外报幕. */
  label?: string;
}

/**
 * 一场戏: 子项按拍入画, 落定后停住.
 * 减弱动效时子项直接是落幅, 不先藏起来.
 *
 * .agents/notes/implemented/feature/2026-11-06-studio-shot-language.md
 */
export function ShotSequence({
  children,
  pace = SHOT_PACE.even,
  className,
  classNames,
  label,
}: ShotSequenceProps): JSX.Element {
  const items = Children.toArray(children);
  const count = items.length;
  return (
    <div data-slot="shot-sequence" data-pace={pace} className={cn(className, classNames?.root)} aria-label={label}>
      {items.map((child, index) => (
        <ShotContext.Provider key={index} value={{ pace, index, count }}>
          {child}
        </ShotContext.Provider>
      ))}
    </div>
  );
}

export interface ShotProps {
  children: ReactNode;
  /** 运镜. 默认 rise: 短距离落到真实槽位. */
  move?: ShotMove;
  /** 覆盖序列给出的拍位. 单独使用 Shot 时从 0 起. */
  at?: number;
  className?: string;
  classNames?: { root?: string };
}

/**
 * 一个镜头. 只动画 opacity 与 transform, 落点就是文档流里的位置.
 * hold 几乎不位移, 用来让眉标先站住; dolly 是开场主体的慢推.
 */
export function Shot({ children, move = SHOT_MOVE.rise, at, className, classNames }: ShotProps): JSX.Element {
  const { tokens, reduced } = useMotionTokens();
  const context = useContext(ShotContext);
  const kind = SHOT_DURATION[move];
  const duration = kind === SHOT_DURATION_KIND.arc ? SHOT_ARC_S : kind === SHOT_DURATION_KIND.beat ? SHOT_BEAT_S : tokens.duration.emphasized;
  const delay = at ?? dealDelay(context.index, context.count, context.pace);
  const shown = SHOT_SHOWN[move];
  const hidden = reduced ? shown : SHOT_HIDDEN[move];
  const perspective = move === SHOT_MOVE.glide ? SHOT_PERSPECTIVE : undefined;
  return (
    <motion.div
      data-slot="shot"
      data-move={move}
      className={cn(STUDIO_CLASS.shot, className, classNames?.root)}
      style={{ transformOrigin: SHOT_ORIGIN, perspective }}
      initial={hidden as TargetAndTransition}
      whileInView={shown as TargetAndTransition}
      viewport={{ once: true, amount: SHOT_VIEWPORT_AMOUNT }}
      transition={reduced ? { duration: 0 } : { duration, ease: tokens.ease.emphasized, delay }}
    >
      {children}
    </motion.div>
  );
}
