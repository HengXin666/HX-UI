/**
 * 页面导演层 (src/page/beat.ts) 的词表与预算. 规范见 docs/architecture/omni-1.0.md 第 4 节.
 */

/** 节奏. 相邻三拍不得同节奏. */
export const BEAT_PACE = { slow: "slow", even: "even", fast: "fast", cut: "cut" } as const;

/** 版式. center 连续超过两拍判为全部居中. */
export const BEAT_LAYOUT = {
  split: "split",
  center: "center",
  bleed: "bleed",
  grid: "grid",
  rail: "rail",
  stack: "stack",
} as const;

/** 第一批 direction. */
export const DIRECTION_NAME = {
  editorial: "editorial",
  industrial: "industrial",
  retailLuxe: "retail-luxe",
  retailPop: "retail-pop",
  devtool: "devtool",
  fintech: "fintech",
} as const;

/** 校验问题代号. */
export const BEAT_ISSUE = {
  empty: "BEAT-EMPTY",
  lead: "BEAT-LEAD",
  duplicateId: "BEAT-ID",
  pace: "BEAT-PACE",
  shot: "BEAT-SHOT",
  center: "BEAT-CENTER",
  alt: "BEAT-ALT",
  heavy: "BEAT-HEAVY",
} as const;

/** 同节奏连续拍数的上限. */
export const BEAT_MAX_SAME_PACE = 2;
/** 居中版式连续拍数的上限. */
export const BEAT_MAX_CENTER_RUN = 2;
/** 整页重效果 (WebGL 背景, 粒子, 着色器) 的默认预算. */
export const BEAT_HEAVY_BUDGET = 1;

/** 各方向允许的镜头 (SHOT_RECIPES 的键). 测试保证每个名字都存在. */
export const DIRECTION_SHOTS = {
  editorial: ["textAsMask", "letterspaceMaterialize", "craneRiseReveal", "cardFlipReveal"],
  industrial: ["strokeSegmentBuild", "scanlineAnnotate", "crashZoomPunch", "craneRiseReveal"],
  retailLuxe: ["spotlightHeroCard", "craneRiseReveal", "letterspaceMaterialize", "cardFlipReveal"],
  retailPop: ["deckDeal", "cardFlipReveal", "crashZoomPunch", "segmentedThumb", "spotlightHeroCard"],
  devtool: ["cursorFlyover", "segmentedThumb", "scanlineAnnotate", "strokeSegmentBuild", "textAsMask"],
  fintech: ["scanlineAnnotate", "craneRiseReveal", "segmentedThumb", "deckDeal"],
} as const;

/** 版式读的方向令牌. 区块只认这些变量, 不认方向名. */
export const DIR_VAR = {
  gutter: "var(--dir-gutter)",
  measure: "var(--dir-measure)",
} as const;

/** 各节奏的上下留白: 慢拍多留白, 硬切贴边. */
export const BEAT_PACE_PAD = {
  slow: "var(--space-24)",
  even: "var(--space-16)",
  fast: "var(--space-12)",
  cut: "0",
} as const;

/** 版式栅格的最小列宽. */
export const BEAT_TRACK = {
  split: "min(100%, 26rem)",
  grid: "min(100%, 16rem)",
  rail: "min(80%, 22rem)",
  bleedMin: "min(100svh, 56rem)",
} as const;

/** sections 自动转拍时的节奏轮换. 三档轮转, 不会出现同节奏三连. */
export const STORY_PACE_CYCLE = [BEAT_PACE.even, BEAT_PACE.fast, BEAT_PACE.slow] as const;

/** sections 自动转拍时的版式: 区块自带栅格, 拍只给留白. */
export const STORY_LAYOUT = BEAT_LAYOUT.stack;

/** sections 自动转拍且没给方向时的镜头 (SHOT_RECIPES 的键). 给了方向时取该方向白名单的第一张. */
export const STORY_FALLBACK_SHOT = "craneRiseReveal";

/** 版式里的 CSS 对齐取值. 多处共用, 收在这里 (PROJECT-CONST-DUP). */
export const BEAT_ALIGN = { center: "center" } as const;
