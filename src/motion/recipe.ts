import { ease } from "../craft/ease";
import { FRAME_MS, type EaseName } from "../craft/tokens";
import {
  RECIPE_DEAL_TAIL,
  RECIPE_LINEAR,
  RECIPE_MIN_HOLD_F,
  RECIPE_MIN_PX,
  RECIPE_MIN_SCALE,
  RECIPE_MS_PER_S,
  RECIPE_PHASE,
  RECIPE_SAMPLE_DECIMALS,
  RECIPE_SAMPLE_POINTS,
} from "../constants/motion-recipe";

/**
 * 镜头配方的数据形状. 一张配方 = 一段按 30fps 帧记录的时间轴, 每段一条具名缓动.
 * 帧数取自 video-shotcraft 镜头卡原值 (docs/research/video-shotcraft.md), 运行时再换成毫秒.
 */

export type RecipeCurve = EaseName | typeof RECIPE_LINEAR;

export type RecipePhaseName = (typeof RECIPE_PHASE)[keyof typeof RECIPE_PHASE];

export interface ShotPhase {
  readonly name: RecipePhaseName;
  /** 30fps 帧数, 正整数. */
  readonly frames: number;
  readonly curve: RecipeCurve;
}

export interface ShotAmplitude {
  /** 预备或主动作的最小位移 (px). 低于肉眼阈值等于没做. */
  readonly px?: number;
  /** 最小缩放变化 (相对 1 的差). */
  readonly scale?: number;
}

export interface ShotRecipe {
  /** 与镜头卡同名. */
  readonly id: string;
  /** 镜头卡在上游仓库里的相对路径. */
  readonly source: string;
  /** 一句话: 主角做什么. */
  readonly summary: string;
  readonly phases: readonly ShotPhase[];
  readonly amplitude?: ShotAmplitude;
  /** 群体入场的发牌间隔 (毫秒): 首张到末张线性收紧. */
  readonly deal?: { readonly firstMs: number; readonly lastMs: number };
  /** 多个主体错峰时的固定间隔 (帧). */
  readonly staggerFrames?: number;
}

/** recipeAt 的读数. */
export interface RecipeReading {
  readonly phase: RecipePhaseName;
  readonly index: number;
  /** 本段内的线性进度 0..1. */
  readonly local: number;
  /** 本段缓动后的进度. */
  readonly eased: number;
}

export { RECIPE_LINEAR, RECIPE_PHASE };

function curveAt(curve: RecipeCurve, t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return curve === RECIPE_LINEAR ? clamped : ease(curve, clamped);
}

/** 配方总帧数. */
export function recipeFrames(recipe: ShotRecipe): number {
  return recipe.phases.reduce((sum, phase) => sum + phase.frames, 0);
}

/** 配方总时长 (毫秒), 按 30fps 换算. */
export function recipeMs(recipe: ShotRecipe): number {
  return recipeFrames(recipe) * FRAME_MS;
}

/** 某段的起止帧. 找不到返回 undefined. */
export function phaseSpan(recipe: ShotRecipe, index: number): readonly [number, number] | undefined {
  if (index < 0 || index >= recipe.phases.length) return undefined;
  let start = 0;
  for (let i = 0; i < index; i += 1) start += recipe.phases[i].frames;
  return [start, start + recipe.phases[index].frames];
}

/**
 * 读配方在整体进度 progress (0..1) 处落在哪一段, 段内进度与缓动值.
 * 时钟 (src/motion/drive/use-clock.ts) 只给 0..1, 组件用这个函数把它翻成镜头语言; 减弱动效时时钟直接给 1, 读到末段终态.
 *
 * .agents/notes/implemented/architecture/2026-11-18-omni-motion-recipe-clock.md
 */
export function recipeAt(recipe: ShotRecipe, progress: number): RecipeReading {
  const total = recipeFrames(recipe);
  const frame = Math.min(1, Math.max(0, progress)) * total;
  let start = 0;
  for (let index = 0; index < recipe.phases.length; index += 1) {
    const phase = recipe.phases[index];
    const end = start + phase.frames;
    const last = index === recipe.phases.length - 1;
    if (frame < end || last) {
      const local = phase.frames > 0 ? Math.min(1, Math.max(0, (frame - start) / phase.frames)) : 1;
      return { phase: phase.name, index, local, eased: curveAt(phase.curve, local) };
    }
    start = end;
  }
  return { phase: RECIPE_PHASE.hold, index: 0, local: 1, eased: 1 };
}

/** 按采样点读配方, 数值保留四位小数, 给快照测试用. */
export function sampleRecipe(recipe: ShotRecipe, points: readonly number[] = RECIPE_SAMPLE_POINTS): RecipeReading[] {
  const round = (value: number): number => Number(value.toFixed(RECIPE_SAMPLE_DECIMALS));
  return points.map((point) => {
    const reading = recipeAt(recipe, point);
    return { ...reading, local: round(reading.local), eased: round(reading.eased) };
  });
}

/**
 * 发牌间隔: count 张卡, 第 i 张的起跳时刻 (毫秒). 间隔从 firstMs 线性收紧到 lastMs, 后段加速.
 */
export function dealOffsets(count: number, firstMs: number, lastMs: number): number[] {
  const offsets: number[] = [];
  let at = 0;
  for (let i = 0; i < count; i += 1) {
    offsets.push(at);
    const t = count > RECIPE_DEAL_TAIL ? i / (count - RECIPE_DEAL_TAIL) : 0;
    at += firstMs + (lastMs - firstMs) * Math.min(1, t);
  }
  return offsets;
}

/**
 * 发牌间隔的第 i 项, 等于 dealOffsets(count, ...)[i], 闭式算, 不建数组.
 */
export function dealOffset(index: number, count: number, firstMs: number, lastMs: number): number {
  if (index <= 0) return 0;
  if (count <= RECIPE_DEAL_TAIL) return index * firstMs;
  const span = count - RECIPE_DEAL_TAIL;
  const ramp = Math.min(index, span + 1);
  const rampSum = (lastMs - firstMs) * ((ramp * (ramp - 1)) / 2) / span;
  const flat = Math.max(0, index - ramp) * lastMs;
  return ramp * firstMs + rampSum + flat;
}

/**
 * 发牌式 delayChildren: 交给 motion 的 transition, 子项 i 在 delayS 之后再按 dealOffset 起跳 (秒).
 */
export function dealDelayChildren(delayS: number, firstMs: number, lastMs: number): (index: number, total: number) => number {
  return (index, total) => delayS + dealOffset(index, total, firstMs, lastMs) / RECIPE_MS_PER_S;
}

/**
 * 第 index 段在整体进度 progress 处的缓动值: 段前为 0, 段后为 1, 段内走该段曲线.
 * 一个元素只跟某一段 (比如 deck-deal 的 enter) 时用它, 不用自己算起止.
 */
export function phaseAt(recipe: ShotRecipe, index: number, progress: number): number {
  const span = phaseSpan(recipe, index);
  if (!span) return 1;
  const frame = Math.min(1, Math.max(0, progress)) * recipeFrames(recipe);
  const [start, end] = span;
  if (frame <= start) return 0;
  if (frame >= end) return 1;
  return curveAt(recipe.phases[index].curve, (frame - start) / (end - start));
}

/** 检查配方是否守合同. 返回问题列表, 空数组表示通过. */
export function validateRecipe(recipe: ShotRecipe): string[] {
  const problems: string[] = [];
  if (recipe.phases.length === 0) problems.push(`${recipe.id}: 没有任何段`);
  for (const phase of recipe.phases) {
    if (!Number.isInteger(phase.frames) || phase.frames <= 0) problems.push(`${recipe.id}: ${phase.name} 帧数不是正整数`);
  }
  const tail = recipe.phases[recipe.phases.length - 1];
  if (tail && tail.name !== RECIPE_PHASE.hold) problems.push(`${recipe.id}: 末段不是静止`);
  if (tail && tail.name === RECIPE_PHASE.hold && tail.frames < RECIPE_MIN_HOLD_F) problems.push(`${recipe.id}: 静止不足 ${RECIPE_MIN_HOLD_F} 帧`);
  const { px, scale } = recipe.amplitude ?? {};
  if (px !== undefined && px < RECIPE_MIN_PX) problems.push(`${recipe.id}: 位移幅度低于 ${RECIPE_MIN_PX}px`);
  if (scale !== undefined && scale < RECIPE_MIN_SCALE) problems.push(`${recipe.id}: 缩放幅度低于 ${RECIPE_MIN_SCALE}`);
  return problems;
}
