"use client";

import type { MotionValue } from "motion/react";
import { createContext, useContext, useRef, type CSSProperties, type JSX, type ReactNode } from "react";
import { MOTION_TAG } from "../constants/motion";
import { CLOCK_DRIVER, type ClockDriver } from "../motion/drive/clock";
import { useClock } from "../motion/drive/use-clock";
import { useRecipe, type RecipeValues } from "../motion/drive/use-recipe";
import { recipeMs, type ShotRecipe } from "../motion/recipe";
import { SHOT_RECIPES } from "../motion/recipe-cards";
import type { Beat, DirectionName } from "./beat";
import { beatStyle } from "./beat-layout";

export interface BeatContextValue extends RecipeValues {
  readonly beat: Beat;
  readonly recipe: ShotRecipe;
  /** 时钟原始进度 0..1. */
  readonly progress: MotionValue<number>;
}

const BeatContext = createContext<BeatContextValue | null>(null);

/** 读当前拍的时钟与配方. 只能在 BeatStage 里用. */
export function useBeat(): BeatContextValue {
  const value = useContext(BeatContext);
  if (!value) throw new Error("useBeat 只能在 BeatStage 里用");
  return value;
}

type StageTag = typeof MOTION_TAG.section | typeof MOTION_TAG.div | typeof MOTION_TAG.article;

export interface BeatStageProps {
  beat: Beat;
  /** 写到 data-direction, 由 tokens.css 的 --dir-* 令牌组接住. 一般只在页根写一次, 这里用于单拍换方向. */
  direction?: DirectionName;
  /** 时钟驱动, 默认 view (进视口播一次配方时长). scroll 适合钉住的长拍. */
  driver?: ClockDriver;
  /** controlled 驱动的外部进度 0..1, 文档站 Page Studio 的时间轴用它. */
  progress?: number;
  as?: StageTag;
  /** 套用 beat.layout 与 beat.pace 的内联版式, 默认 true. 自己排版时传 false. */
  styled?: boolean;
  style?: CSSProperties;
  className?: string;
  children: ReactNode;
}

/**
 * 一拍的舞台: 按 beat.shot 取镜头配方, 用 useClock 起一个时钟, 把进度, 段名与缓动值经 useBeat 交给里面的元素.
 * 自身不做任何动画; 默认按 beat.layout / beat.pace 套内联版式 (beat-layout.ts), data-layout / data-pace 留给门禁读取.
 * 减弱动效由 useClock 负责, 进度直接落到 1.
 *
 * .agents/notes/implemented/architecture/2026-11-18-omni-page-beats.md
 */
export function BeatStage({ beat, direction, driver = CLOCK_DRIVER.view, progress, as = MOTION_TAG.section, styled = true, style, className, children }: BeatStageProps): JSX.Element {
  const ref = useRef<HTMLElement>(null);
  const recipe = SHOT_RECIPES[beat.shot];
  const clock = useClock(ref, { driver, durationMs: recipeMs(recipe), progress });
  const values = useRecipe(clock, recipe);
  const Tag = as;
  return (
    <BeatContext.Provider value={{ beat, recipe, progress: clock, ...values }}>
      <Tag
        ref={ref as never}
        id={beat.id}
        className={className}
        style={styled ? { ...beatStyle(beat.layout, beat.pace), ...style } : style}
        data-beat={beat.shot}
        data-layout={beat.layout}
        data-pace={beat.pace}
        data-direction={direction}
      >
        {children}
      </Tag>
    </BeatContext.Provider>
  );
}
