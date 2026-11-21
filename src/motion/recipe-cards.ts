import { DEAL_FIRST_MS, DEAL_LAST_MS } from "../craft/tokens";
import {
  RECIPE_DECK_ANTICIPATE_PX,
  RECIPE_FLIP_STAGGER_F,
  RECIPE_FLYOVER_STOPS,
  RECIPE_TIMELINE,
  RECIPE_UPSTREAM,
} from "../constants/motion-recipe";
import type { RecipeCurve, RecipePhaseName, ShotPhase, ShotRecipe } from "./recipe";

/**
 * 第一批镜头配方. 时间轴数据在 src/constants/motion-recipe.ts (RECIPE_TIMELINE), 这里补上出处, 一句话说明与幅度.
 * 每张只记组件默认态用得到的部分, 成片专属的光效与音效不进.
 */

type Timeline = readonly (readonly [string, number, string])[];

function phases(...parts: Timeline[]): ShotPhase[] {
  return parts.flat().map(([name, frames, curve]) => ({ name: name as RecipePhaseName, frames, curve: curve as RecipeCurve }));
}

const T = RECIPE_TIMELINE;
const flyoverStops: Timeline[] = Array.from({ length: RECIPE_FLYOVER_STOPS }, () => T.cursorFlyoverStop);

export const SHOT_RECIPES = {
  spotlightHeroCard: {
    id: "spotlight-hero-card",
    source: `${RECIPE_UPSTREAM}/opening/spotlight-hero-card.md`,
    summary: "聚光锁定一张卡 (f34), 斜侧推进后弹起悬浮再贴回 (f142), 30f 真静止",
    phases: phases(T.spotlightHeroCard),
  },
  craneRiseReveal: {
    id: "crane-rise-reveal",
    source: `${RECIPE_UPSTREAM}/opening/crane-rise-reveal.md`,
    summary: "特写 hold 24f, 沿 Y 减速拉升 102f, 落定与余波 39f (余波 9f 与静止 30f 的拆分本库定)",
    phases: phases(T.craneRiseReveal),
  },
  deckDeal: {
    id: "deck-deal-flyin",
    source: `${RECIPE_UPSTREAM}/ui-entrance/deck-deal-flyin.md`,
    summary: "牌堆特写与预备 36f, 发牌硬加速到 f101, f108 起满板 hold; 预备下压至少 48px",
    phases: phases(T.deckDeal),
    amplitude: { px: RECIPE_DECK_ANTICIPATE_PX },
    deal: { firstMs: DEAL_FIRST_MS, lastMs: DEAL_LAST_MS },
  },
  segmentedThumb: {
    id: "segmented-thumb-hero",
    source: `${RECIPE_UPSTREAM}/interaction/segmented-thumb-hero.md`,
    summary: "胶囊浮入 18f, 光标入画 24f, thumb 8f 缓出滑到位, 新图标弹出 (弹出 12f 与 hold 本库定)",
    phases: phases(T.segmentedThumb),
  },
  cardFlipReveal: {
    id: "card-flip-reveal",
    source: `${RECIPE_UPSTREAM}/transition/card-flip-reveal.md`,
    summary: "单卡 4f 预备, 16f 翻面, 约 10f 弹簧落定; 多卡错峰 12f",
    phases: phases(T.cardFlipReveal),
    staggerFrames: RECIPE_FLIP_STAGGER_F,
  },
  textAsMask: {
    id: "text-as-mask",
    source: `${RECIPE_UPSTREAM}/opening/text-as-mask.md`,
    summary: "大字切出 18f, 字内画面漂移 78f, 吸气 8f, 冲入接管 24f, 落定 37f",
    phases: phases(T.textAsMask),
  },
  crashZoomPunch: {
    id: "crash-zoom-punch",
    source: `${RECIPE_UPSTREAM}/camera/crash-zoom-punch.md`,
    summary: "全景 hold 至少 30f, 6f 急推到特写, 特写 hold 至少 45f",
    phases: phases(T.crashZoomPunch),
  },
  cursorFlyover: {
    id: "cursor-flyover",
    source: `${RECIPE_UPSTREAM}/camera/cursor-flyover.md`,
    summary: "俯瞰 22f, 四站各飞 20f 停 24f, 拉回 24f, hold 18f; 共 240f",
    phases: phases(T.cursorFlyoverOpen, ...flyoverStops, T.cursorFlyoverClose),
  },
  strokeSegmentBuild: {
    id: "stroke-segment-build",
    source: `${RECIPE_UPSTREAM}/opening/stroke-segment-build.md`,
    summary: "笔画乱序逐段点亮, f105 末段落位语义成立, 之后 hold 2s",
    phases: phases(T.strokeSegmentBuild),
  },
  letterspaceMaterialize: {
    id: "letterspace-materialize",
    source: `${RECIPE_UPSTREAM}/opening/letterspace-materialize.md`,
    summary: "静置约 15f, 全字符同帧描画约 50f, 终态静置至少 30f",
    phases: phases(T.letterspaceMaterialize),
  },
  scanlineAnnotate: {
    id: "scanline-annotate-focus",
    source: `${RECIPE_UPSTREAM}/effects/scanline-annotate-focus.md`,
    summary: "扫描线匀速掠过, 逐块取景框弹簧收拢; 共 150f (扫描 120f 与静止 30f 的拆分本库定)",
    phases: phases(T.scanlineAnnotate),
  },
} as const satisfies Record<string, ShotRecipe>;

export type ShotRecipeName = keyof typeof SHOT_RECIPES;
