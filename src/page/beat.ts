import {
  BEAT_HEAVY_BUDGET,
  BEAT_ISSUE,
  BEAT_LAYOUT,
  BEAT_MAX_CENTER_RUN,
  BEAT_MAX_SAME_PACE,
  BEAT_PACE,
  DIRECTION_NAME,
  DIRECTION_SHOTS,
} from "../constants/page-beat";
import type { ShotRecipeName } from "../motion/recipe-cards";

/**
 * 页面导演层的描述: 一页是若干拍 (beat), 每拍一个主角, 一个镜头配方, 一个版式, 一个节奏.
 * 这里只有类型与纯函数校验, 渲染仍走 Page / PageComposer; 规范见 docs/architecture/omni-1.0.md 第 4, 5 节.
 */

export type BeatPace = (typeof BEAT_PACE)[keyof typeof BEAT_PACE];
export type BeatLayout = (typeof BEAT_LAYOUT)[keyof typeof BEAT_LAYOUT];
export type DirectionName = (typeof DIRECTION_NAME)[keyof typeof DIRECTION_NAME];
export type BeatIssueCode = (typeof BEAT_ISSUE)[keyof typeof BEAT_ISSUE];

export interface BeatMedia {
  readonly src: string;
  /** 图片的替代文字. 纯装饰图写空串并把 decorative 设为 true. */
  readonly alt?: string;
  readonly decorative?: boolean;
}

export interface Beat {
  /** 锚点与 React key, 页内唯一. */
  readonly id: string;
  /** 这一拍的主角: 一句话说清观众该看什么. */
  readonly lead: string;
  readonly shot: ShotRecipeName;
  readonly layout: BeatLayout;
  readonly pace: BeatPace;
  readonly media?: readonly BeatMedia[];
  /** 这一拍用了几个重效果 (WebGL 背景, 粒子, 着色器). */
  readonly heavy?: number;
}

export interface Direction {
  readonly name: DirectionName;
  /** 这套方向允许的镜头. */
  readonly shots: readonly ShotRecipeName[];
  /** 整页重效果预算. */
  readonly heavyBudget: number;
}

export interface BeatIssue {
  readonly code: BeatIssueCode;
  /** 出问题的拍; 整页级问题为 undefined. */
  readonly beat?: string;
  readonly message: string;
}

const D = DIRECTION_NAME;
const S = DIRECTION_SHOTS as Record<keyof typeof DIRECTION_SHOTS, readonly ShotRecipeName[]>;

/** 第一批六套方向的镜头白名单与重效果预算. 字体阶, 栅格与图片处理随 P2 的 direction 令牌组补上. */
export const DIRECTIONS: Record<DirectionName, Direction> = {
  [D.editorial]: { name: D.editorial, shots: S.editorial, heavyBudget: 0 },
  [D.industrial]: { name: D.industrial, shots: S.industrial, heavyBudget: BEAT_HEAVY_BUDGET },
  [D.retailLuxe]: { name: D.retailLuxe, shots: S.retailLuxe, heavyBudget: 0 },
  [D.retailPop]: { name: D.retailPop, shots: S.retailPop, heavyBudget: BEAT_HEAVY_BUDGET },
  [D.devtool]: { name: D.devtool, shots: S.devtool, heavyBudget: BEAT_HEAVY_BUDGET },
  [D.fintech]: { name: D.fintech, shots: S.fintech, heavyBudget: 0 },
};

/** 类型化写一页的拍. 运行时原样返回. */
export function defineBeats(beats: readonly Beat[]): readonly Beat[] {
  return beats;
}

/** 连续同值的段, 返回每段的起点与长度. */
function runs<T>(items: readonly T[]): Array<{ start: number; length: number; value: T }> {
  const out: Array<{ start: number; length: number; value: T }> = [];
  items.forEach((value, index) => {
    const last = out[out.length - 1];
    if (last && last.value === value) last.length += 1;
    else out.push({ start: index, length: 1, value });
  });
  return out;
}

/**
 * 校验一页的拍. 返回问题列表, 空数组表示通过. 品味门禁 (TASTE-*) 与文档站 Page Studio 都调它.
 *
 * .agents/notes/implemented/architecture/2026-11-18-omni-page-beats.md
 */
export function validateBeats(beats: readonly Beat[], direction?: Direction): BeatIssue[] {
  const issues: BeatIssue[] = [];
  if (beats.length === 0) return [{ code: BEAT_ISSUE.empty, message: "一拍都没有" }];
  const seen = new Set<string>();
  for (const beat of beats) {
    if (seen.has(beat.id)) issues.push({ code: BEAT_ISSUE.duplicateId, beat: beat.id, message: `id 重复: ${beat.id}` });
    seen.add(beat.id);
    if (beat.lead.trim() === "") issues.push({ code: BEAT_ISSUE.lead, beat: beat.id, message: "没有主角" });
    if (direction && !direction.shots.includes(beat.shot)) {
      issues.push({ code: BEAT_ISSUE.shot, beat: beat.id, message: `${direction.name} 不用 ${beat.shot}` });
    }
    for (const media of beat.media ?? []) {
      if (!media.decorative && !media.alt?.trim()) issues.push({ code: BEAT_ISSUE.alt, beat: beat.id, message: `图片缺 alt: ${media.src}` });
    }
  }
  for (const run of runs(beats.map((beat) => beat.pace))) {
    if (run.length > BEAT_MAX_SAME_PACE) {
      const at = beats[run.start + BEAT_MAX_SAME_PACE].id;
      issues.push({ code: BEAT_ISSUE.pace, beat: at, message: `连续 ${run.length} 拍都是 ${run.value}` });
    }
  }
  for (const run of runs(beats.map((beat) => beat.layout))) {
    if (run.value === BEAT_LAYOUT.center && run.length > BEAT_MAX_CENTER_RUN) {
      const at = beats[run.start + BEAT_MAX_CENTER_RUN].id;
      issues.push({ code: BEAT_ISSUE.center, beat: at, message: `连续 ${run.length} 拍居中` });
    }
  }
  const heavy = beats.reduce((sum, beat) => sum + (beat.heavy ?? 0), 0);
  const budget = direction?.heavyBudget ?? BEAT_HEAVY_BUDGET;
  if (heavy > budget) issues.push({ code: BEAT_ISSUE.heavy, message: `重效果 ${heavy} 个, 预算 ${budget}` });
  return issues;
}
