/**
 * compose 族 (输入, 浮层与菜单) 的手感常数. 每个数字只写一次, 同值的常数用别名指回第一处.
 * 毫秒写 _MS, 秒写 _S, 像素写 _PX. 组件只引用名字.
 */

// ---- 共用 ----

/** 本族所有件共用的出场曲线 (catalog 里每件的 --*-ease-out 都是这一条). */
export const COMPOSE_EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";
/** ThoughtLine 与 PromptBar 共用的进出曲线. */
export const COMPOSE_EASE_IN_OUT = "cubic-bezier(0.77, 0, 0.175, 1)";
export const EASE_PLAIN = "ease";
export const EASE_LINEAR = "linear";
export const PX = "px";
export const MS = "ms";
export const BUTTON_TYPE = "button";
export const NONE = "none";
export const CURRENT_COLOR = "currentColor";

/** 画布帧间隔上限 (秒) 与像素比上限: 切后台回来不跳一大步, 高分屏不超过两倍. */
export const DT_CAP_S = 0.05;
export const DPR_CAP = 2;
/** 没有上一帧时按 60fps 的一帧算. */
export const FIRST_FRAME_S = 0.016;
export const HALF = 2;
export const MS_PER_S = 1000;
/** 本族 "时长 + bounce" 换算的口径: 落定判据取常见 UI 动画库的 duration 包络, 时长下限 1ms. */
export const COMPOSE_FIT = { envelope: "slope", minDurationS: 1 / MS_PER_S } as const;
/** 本族画布帧循环的口径: 帧长上限, 第一帧帧长, 页面隐藏时停帧. 回调里的 dt 自行换成秒. */
export const COMPOSE_FRAME = { maxDtMs: DT_CAP_S * MS_PER_S, firstFrameMs: FIRST_FRAME_S * MS_PER_S, pauseWhenHidden: true } as const;

/** 像素与字号的尺子. 规格里同一个数在多件里各有含义, 只在这里写一次. */
export const SCALE = { s3: 3, s4: 4, s6: 6, s8: 8, s10: 10, s12: 12, s14: 14, s16: 16, s22: 22 } as const;
/** 时长的尺子 (毫秒), 同上. */
export const SPAN = { m240: 240, m320: 320, m400: 400, m500: 500, m1200: 1200, m80: 80 } as const;

export const FADE_MS = 200;
export const COLOR_FAST_MS = 150;
export const PRESS_MS = 160;
export const SLIDE_MS = 220;
export const COLOR_SLOW_MS = 300;
export const POP_MS = 180;
export const QUICK_MS = 120;

/** 语义色. 颜色类 props 只收这些名字, 落到 var(--name). */
export const HX_COLORS = [
  "foreground",
  "muted-foreground",
  "background",
  "muted",
  "primary",
  "primary-foreground",
  "accent",
  "accent-foreground",
  "secondary",
  "popover",
  "popover-foreground",
  "card",
  "card-foreground",
  "border",
  "danger",
  "success",
  "warning",
] as const;
export type HxColor = (typeof HX_COLORS)[number];

/** 语义色名转 CSS 变量. currentColor 原样放行. */
export function colorVar(name: HxColor | "currentColor"): string {
  return name === CURRENT_COLOR ? name : `var(--${name})`;
}

/** 拼一条只列具体属性的 transition, 不用 all. */
export function transitionOf(parts: ReadonlyArray<readonly [string, number, string?, number?]>): string {
  return parts
    .map(([prop, ms, curve, delay]) => [prop, ms + MS, curve ?? EASE_PLAIN, delay ? delay + MS : ""].filter(Boolean).join(" "))
    .join(", ");
}

export const CSS_PROP = {
  opacity: "opacity",
  transform: "transform",
  color: "color",
  background: "background-color",
  top: "top",
  left: "left",
  width: "width",
  height: "height",
  filter: "filter",
  dash: "stroke-dashoffset",
} as const;

// ---- PromptBar -> ComposerField ----

export const COMPOSER = {
  popMs: POP_MS,
  menuPopMs: FADE_MS,
  slideMs: SLIDE_MS,
  fadeMs: COLOR_FAST_MS,
  placeholderMs: SPAN.m500,
  hoverMs: QUICK_MS,
  pressMs: PRESS_MS,
  colorMs: COLOR_FAST_MS,
  toggleColorMs: COLOR_SLOW_MS,
  sendColorMs: FADE_MS,
  eqMs: 900,
  eqStepMs: COLOR_FAST_MS,
  line: SCALE.s22,
  edge: 11,
  morphMs: FADE_MS,
  maxRows: SCALE.s8,
  /** 打字能量衰减, 提交脉冲衰减, 流速追随的时间常数 (秒). */
  energyTau: 0.8,
  pulseTau: 0.16,
  speedTau: 0.15,
  /** 流速 = 1 + energy * speedGain. */
  speedGain: 6,
  /** 每次按键注入的能量, 上限 1. */
  keyEnergy: 0.18,
  /** 能量与脉冲低于此值且失焦时停帧. */
  idle: 0.002,
  eqFloor: 0.3,
} as const;

// ---- VoicePill -> DictateButton ----

export const DICTATE = {
  loopS: 4.8,
  micGain: 2.2,
  slideMin: SCALE.s4,
  waveEvery: SCALE.s4,
  waveMax: 80,
  size: 28,
  reach: SCALE.s8,
  cancelDistance: 64,
  attackMs: 40,
  releaseMs: SPAN.m240,
  sensitivity: 1,
  floor: 0.1,
  openMs: FADE_MS,
  pressScale: 0.95,
  holdAfterMs: COLOR_SLOW_MS,
  pressMs: PRESS_MS,
  colorMs: COLOR_FAST_MS,
  fadeMs: FADE_MS,
  growMs: SPAN.m240,
  /** 规格只给了名字没给值: 取 32 个频段, 只读低半段 (人声). */
  micBins: 32,
  barGapPx: HALF,
  barWidthPx: HALF,
  /** 计时文字宽度预留. */
  timeWidthPx: 36,
} as const;

// ---- ThoughtLine -> ReasoningTrace ----

export const TRACE = {
  glyphDone: 0.55,
  breathPeriodS: 1.6,
  breathDepth: 0.45,
  reducedBreathS: 2.4,
  shimmerS: 1.8,
  settleMs: 350,
  settleBlurPx: HALF,
  fontSize: SCALE.s16,
  fadeS: FADE_MS / MS_PER_S,
  stepMs: FADE_MS,
  tickMs: MS_PER_S,
} as const;

// ---- WarmTooltip -> CueTip ----

export const CUE = {
  leanSpring: { stiffness: 260, damping: SCALE.s22, mass: 0.4 },
  fullLeanSpeed: SPAN.m1200,
  margin: SCALE.s8,
  holdSlop: SCALE.s10,
  swapS: 0.14,
  swapShiftPx: SCALE.s10,
  risePx: SCALE.s4,
  graceMs: SPAN.m80,
  delayMs: SPAN.m400,
  warmWindowMs: COLOR_SLOW_MS,
  travelMs: SPAN.m320,
  travelBounce: 0.1,
  warmPopMs: QUICK_MS,
  popMs: 125,
  closeMs: SPAN.m80,
  popScale: 0.96,
  popBlurPx: HALF,
  longPressMs: SPAN.m500,
  radius: SCALE.s8,
  gap: SCALE.s8,
} as const;

/** 浮层朝向. sign 是 RISE 与倾斜的方向. */
export const CUE_SIDE = { top: "top", bottom: "bottom", left: "left", right: "right" } as const;
export type CueSide = (typeof CUE_SIDE)[keyof typeof CUE_SIDE];
export const CUE_SIGN: Record<CueSide, number> = { top: 1, bottom: -1, left: -1, right: 1 };

export const CUE_SIZES = {
  sm: { font: SCALE.s12, padX: SCALE.s8, padY: SCALE.s4 },
  md: { font: 13, padX: SCALE.s10, padY: SCALE.s6 },
  lg: { font: SCALE.s14, padX: SCALE.s12, padY: SCALE.s8 },
} as const;
export type CueSize = keyof typeof CUE_SIZES;

// ---- BranchedMenu -> ForkMenu ----

export const FORK = {
  pad: SCALE.s6,
  mark: SCALE.s16,
  width: 240,
  rowHeight: 36,
  indent: 40,
  trunk: SCALE.s14,
  radius: SCALE.s10,
  /** 规格 1.5, 硬约束只许 1px 线. */
  lineWidth: 1,
  fontSize: SCALE.s14,
  drawMs: SPAN.m400,
  foldMs: COLOR_SLOW_MS,
  slideMs: SLIDE_MS,
  fadeMs: COLOR_FAST_MS,
  colorMs: FADE_MS,
  labelInMs: 250,
  labelInDelayMs: 100,
  /** 同一枝里每条分支的起笔错开. */
  drawStaggerMs: 50,
} as const;

// ---- FlipCard -> TurnCard ----

export const TURN = {
  slop: { fine: SCALE.s4, coarse: SCALE.s8 },
  tiltSpring: { stiffness: SPAN.m240, damping: 24, mass: 0.6 },
  liftSpring: { stiffness: SPAN.m320, damping: 26, mass: 1 },
  fling: 0.16,
  historyMs: 90,
  stiffness: 170,
  damping: 20,
  tiltMax: SCALE.s12,
  glareOpacity: 0.22,
  hoverScale: 1.03,
  perspective: 1100,
  width: 300,
  height: SPAN.m400,
  radius: SCALE.s22,
  fadeMs: FADE_MS,
  halfTurn: 180,
} as const;

// ---- RefineFrame -> DevelopFrame ----

export const DEVELOP_STATUS = {
  queued: "queued",
  generating: "generating",
  refining: "refining",
  complete: "complete",
  error: "error",
} as const;
export type DevelopStatus = (typeof DEVELOP_STATUS)[keyof typeof DEVELOP_STATUS];

export const DEVELOP_TARGET: Record<DevelopStatus, number> = {
  queued: 0,
  generating: 0.5,
  refining: 0.875,
  complete: 1,
  error: 0,
};

export const DEVELOP = {
  edge: 28,
  strips: SCALE.s14,
  waitS: 2.4,
  fadeMs: FADE_MS,
  pressMs: PRESS_MS,
  colorMs: COLOR_FAST_MS,
  width: SPAN.m320,
  radius: SCALE.s16,
  aspect: "4 / 3",
  stageMs: SPAN.m400,
  hideAfterMs: SPAN.m1200,
  /** 规格只给了名字: 未落定时内容的模糊级别 (px), 按进度逐级收清. */
  levels: [SCALE.s12, SCALE.s6, SCALE.s3, 0],
  /** 扫光带每秒走过画面宽度的倍数. */
  sweepPerS: 0.6,
  /** 各条带揭开的错开比例. */
  stripLag: 0.35,
  /** 进度追随: stageMs 内走完 95%, tau = stageMs / 3. */
  approachSpan: SCALE.s3,
  rest: 0.001,
} as const;
