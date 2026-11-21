/**
 * 镜头配方与统一时钟的常量 (src/motion/recipe.ts, src/motion/drive/use-clock.ts).
 * 帧数照 docs/research/video-shotcraft.md 各镜头卡的时长行收录, 30fps; 卡上只给总长的段, 拆分在 summary 里注明本库定.
 */

/** 线性段的曲线名. 其余段只引用 craft EASE 的名字. */
export const RECIPE_LINEAR = "linear";

/** 段名. 配方之间共用同一套词. */
export const RECIPE_PHASE = {
  establish: "establish",
  anticipate: "anticipate",
  enter: "enter",
  move: "move",
  dwell: "dwell",
  settle: "settle",
  impact: "impact",
  hold: "hold",
} as const;

/** 合同测试的默认采样点. */
export const RECIPE_SAMPLE_POINTS = [0, 0.25, 0.5, 0.75, 1] as const;
/** 采样读数保留的小数位. */
export const RECIPE_SAMPLE_DECIMALS = 4;
/** 收尾静止的下限 (帧). 镜头卡里最短的是 cursor-flyover 的 18f. */
export const RECIPE_MIN_HOLD_F = 18;
/** 位移幅度下限 (px): deck-deal 预备下压 4px 被判等于没做. */
export const RECIPE_MIN_PX = 8;
/** 缩放幅度下限. */
export const RECIPE_MIN_SCALE = 0.02;
/** 发牌间隔: 末一个间隔的序号偏移 (count 张卡有 count - 1 个间隔). */
export const RECIPE_DEAL_TAIL = 2;
/** 上游镜头卡目录. */
export const RECIPE_UPSTREAM = "references/shots";
/** cursor-flyover 的站数. */
export const RECIPE_FLYOVER_STOPS = 4;

/** 配方段: [段名, 帧数, 曲线名]. 曲线名是 craft EASE 的键或 linear. */
type Phase = readonly [string, number, string];
const P = RECIPE_PHASE;
const L = RECIPE_LINEAR;

/** 第一批配方的时间轴. */
export const RECIPE_TIMELINE = {
  spotlightHeroCard: [[P.establish, 34, "out"], [P.move, 108, "settle"], [P.hold, 30, L]],
  craneRiseReveal: [[P.establish, 24, L], [P.move, 102, "crane"], [P.settle, 9, "out"], [P.hold, 30, L]],
  deckDeal: [[P.anticipate, 36, "out"], [P.enter, 65, "dive"], [P.settle, 7, "settle"], [P.hold, 42, L]],
  segmentedThumb: [[P.enter, 18, "overshoot"], [P.establish, 24, "out"], [P.move, 8, "out"], [P.impact, 12, "punch"], [P.hold, 48, L]],
  cardFlipReveal: [[P.anticipate, 4, "in"], [P.move, 16, "out"], [P.settle, 10, "settle"], [P.hold, 30, L]],
  textAsMask: [[P.enter, 18, "out"], [P.dwell, 78, L], [P.anticipate, 8, "in"], [P.impact, 24, "in"], [P.hold, 37, L]],
  crashZoomPunch: [[P.establish, 30, L], [P.impact, 6, "punch"], [P.hold, 45, L]],
  cursorFlyoverOpen: [[P.establish, 22, L]],
  cursorFlyoverStop: [[P.move, 20, "dive"], [P.dwell, 24, L]],
  cursorFlyoverClose: [[P.move, 24, "out"], [P.hold, 18, L]],
  strokeSegmentBuild: [[P.enter, 105, "stamp"], [P.hold, 60, L]],
  letterspaceMaterialize: [[P.establish, 15, L], [P.enter, 50, "out"], [P.hold, 30, L]],
  scanlineAnnotate: [[P.move, 120, L], [P.hold, 30, L]],
} as const satisfies Record<string, readonly Phase[]>;

/** deck-deal 预备下压的最小位移 (px). */
export const RECIPE_DECK_ANTICIPATE_PX = 48;
/** card-flip-reveal 多卡错峰 (帧). */
export const RECIPE_FLIP_STAGGER_F = 12;

/** 时钟的四种驱动. */
export const CLOCK_DRIVER = {
  view: "view",
  scroll: "scroll",
  loop: "loop",
  controlled: "controlled",
} as const;

/** view / loop 驱动的默认时长 (毫秒), 等于一张 150f 镜头卡. */
export const CLOCK_DEFAULT_MS = 5000;
/** view 驱动: 元素露出这个比例才开拍. */
export const CLOCK_VIEW_AMOUNT = 0.45;
/** scroll 驱动要监听的窗口事件. */
export const CLOCK_EVENT = { scroll: "scroll", resize: "resize", visibility: "visibilitychange" } as const;

/** 毫秒换秒. motion 的 transition 收秒. */
export const RECIPE_MS_PER_S = 1000;

/** Stagger 的群体节奏: even 恒定间隔 (旧行为), deal 发牌式加速 (首张 120ms 收紧到 40ms). */
export const STAGGER_RHYTHM = { even: "even", deal: "deal" } as const;
