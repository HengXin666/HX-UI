"use client";

import { useTransform, type MotionValue } from "motion/react";
import { phaseAt, recipeAt, type RecipePhaseName, type ShotRecipe } from "../recipe";

export interface RecipeValues {
  /** 当前段的缓动值 0..1. */
  readonly eased: MotionValue<number>;
  /** 当前段名. */
  readonly phase: MotionValue<RecipePhaseName>;
}

/** 把时钟进度 (useClock 的返回值) 接到一张镜头配方上. 全是派生 MotionValue, 不触发重渲染. */
export function useRecipe(progress: MotionValue<number>, recipe: ShotRecipe): RecipeValues {
  const eased = useTransform(progress, (p) => recipeAt(recipe, p).eased);
  const phase = useTransform(progress, (p) => recipeAt(recipe, p).phase);
  return { eased, phase };
}

/** 配方第 index 段的缓动值: 段前 0, 段后 1. 一个元素只跟一段 (比如 deck-deal 的 enter) 时用它. */
export function usePhase(progress: MotionValue<number>, recipe: ShotRecipe, index: number): MotionValue<number> {
  return useTransform(progress, (p) => phaseAt(recipe, index, p));
}
