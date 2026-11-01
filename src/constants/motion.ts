/**
 * 动效引擎 (src/motion) 的令牌名, 令牌回退值与默认参数.
 * 时长与缓动在运行时从 tokens.css 读取, 这里只放令牌名与读不到时的回退.
 */

/**
 * 时长令牌名. 值在 tokens.css, 减弱动效时由媒体查询归零, JS 读到的也就是 0.
 *
 * .agents/notes/implemented/feature/2026-11-01-motion-engine.md
 */
export const MOTION_DURATION_TOKEN = {
  instant: "--duration-instant",
  fast: "--duration-fast",
  base: "--duration-base",
  slow: "--duration-slow",
  emphasized: "--duration-emphasized",
} as const;

/** 缓动令牌名. 只解析 cubic-bezier, linear() 弹簧曲线交给 motion 的物理弹簧. */
export const MOTION_EASE_TOKEN = {
  out: "--ease-out",
  in: "--ease-in",
  inOut: "--ease-in-out",
  emphasized: "--ease-emphasized",
} as const;

/** 服务端渲染或令牌缺失时的时长回退 (ms), 与 tokens.css 的默认值一致. */
export const MOTION_DURATION_FALLBACK_MS = {
  instant: 80,
  fast: 120,
  base: 200,
  slow: 300,
  emphasized: 500,
} as const;

/** 缓动回退, 四个控制点与 tokens.css 的 cubic-bezier 一致. */
export const MOTION_EASE_FALLBACK = {
  out: [0.2, 0, 0, 1],
  in: [0.7, 0, 0.84, 0],
  inOut: [0.65, 0, 0.35, 1],
  emphasized: [0.3, 0, 0, 1],
} as const;

/** 毫秒换秒 (motion 的 duration 单位是秒). */
export const MS_PER_SECOND = 1000;

/** cubic-bezier 的控制点个数. */
export const CUBIC_BEZIER_POINTS = 4;

/** 变体状态名: 初始, 出现, 离场. Reveal / Stagger / Transition 共用. */
export const MOTION_STATE = {
  hidden: "hidden",
  visible: "visible",
  exit: "exit",
} as const;

/** 预设名. 与 MOTION_PRESETS 的键一一对应. */
export const MOTION_PRESET_NAME = {
  fade: "fade",
  fadeUp: "fadeUp",
  fadeDown: "fadeDown",
  scaleIn: "scaleIn",
  blurIn: "blurIn",
  slideLeft: "slideLeft",
  slideRight: "slideRight",
} as const;

/** 节奏名: 进入用 slow + ease-out, 离场用 fast + ease-in, 强调用 emphasized. */
export const MOTION_TIMING = {
  enter: "enter",
  exit: "exit",
  emphasized: "emphasized",
} as const;

/** 弹簧名. 与 SPRING 的键一一对应. */
export const SPRING_NAME = {
  soft: "soft",
  snappy: "snappy",
  bouncy: "bouncy",
} as const;

/** motion 的过渡类型名. */
export const SPRING_TYPE = "spring";

/** 位移与缩放幅度: 入场只走短距离, 超过 24px 会显得在 "飞". */
export const MOTION_DISTANCE = {
  rise: 12,
  slide: 24,
  scaleFrom: 0.96,
  blur: "blur(8px)",
  sharp: "blur(0px)",
} as const;

/** 视口入场默认: 露出 20% 再触发, 底部收 10% 让元素真正进屏才动. */
export const REVEAL_VIEWPORT = {
  amount: 0.2,
  margin: "0px 0px -10% 0px",
} as const;

/** 交错默认间隔 (s). 子项超过 10 个时总时长会拖沓, 调用方应调小. */
export const STAGGER_GAP_S = 0.06;

/** AnimatePresence 的切换模式. */
export const PRESENCE_MODE = {
  wait: "wait",
  sync: "sync",
  popLayout: "popLayout",
} as const;

/** 可选的包裹标签. */
export const MOTION_TAG = {
  div: "div",
  span: "span",
  section: "section",
  li: "li",
  ul: "ul",
  article: "article",
} as const;

/** 数字动画: 自身值变化的监听事件名. */
export const MOTION_CHANGE_EVENT = "change";

/** Stagger 的触发时机: 进入视口, 或挂载即播. */
export const STAGGER_TRIGGER = {
  inView: "inView",
  mount: "mount",
} as const;

/** 动效文档页的示例取值与复用类名. */
export const MOTION_DOC = {
  /** 示例卡片的公共外观. */
  tile: "rounded-lg border border-border bg-card p-4 text-[13px] text-foreground",
  /** 示例区块的纵向排列. */
  column: "flex w-full flex-col gap-3",
  /** 属性表里的类型名. */
  typeNumber: "number",
  /** 示例数字的字号. */
  figure: "text-2xl font-semibold text-foreground",
  /** 示例数字的起点与两档目标. */
  numberFrom: 0,
  numberLow: 1280,
  numberHigh: 98450.5,
  /** 交错示例的子项数. */
  staggerCount: 6,
} as const;
