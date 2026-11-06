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

/**
 * 滚动联动与入场编排 (V0-07): ScrollProgress, Parallax, StickyScroll, RotatingText, SplitText, orchestration.
 */

/**
 * 编排间隔令牌名 (V0-01 在 tokens.css 引入). 读不到时回退 STAGGER_GAP_S.
 *
 * .agents/notes/implemented/feature/2026-11-02-scroll-motion-orchestration.md
 */
export const STAGGER_STEP_TOKEN = "--stagger-step";

/** 滚动轴. */
export const SCROLL_AXIS = { x: "x", y: "y" } as const;

/** 滚动区间: through 为元素底边进屏到顶边出屏; contain 为元素顶边到顶, 底边到底 (粘性叙事用). */
export const SCROLL_OFFSET = {
  through: ["start end", "end start"],
  contain: ["start start", "end end"],
} as const;

/** 进度的两端. */
export const PROGRESS_RANGE = [0, 1] as const;

/** 位移方向. Parallax 与 SplitText 共用. */
export const MOTION_DIRECTION = { up: "up", down: "down", left: "left", right: "right" } as const;

/** 视差: 速度因子 1 对应整段滚动内的总位移 (px); 默认速度 0.2 即约 40px, 读起来是 "慢半拍". */
export const PARALLAX_RANGE_PX = 200;
export const PARALLAX_DEFAULT_SPEED = 0.2;

/** 进度条: 平滑弹簧, 让滚轮的阶跃变成连续推进. */
export const SCROLL_BAR_SPRING = { stiffness: 200, damping: 40, restDelta: 0.001 } as const;

/** 进度条贴边位置. */
export const SCROLL_BAR_POSITION = { top: "top", bottom: "bottom", inline: "inline" } as const;

/** 粘性叙事: 媒体在侧边 (宽屏左粘右滚) 或在上方 (上粘下滚). */
export const STICKY_LAYOUT = { side: "side", top: "top" } as const;

/** 粘性叙事的判定线: 视口正中一条线, 哪一步压线哪一步就是当前步. */
export const STICKY_STEP_MARGIN = "-50% 0px -50% 0px";

/** 轮换词触发: 定时, 或按滚动进度换词. */
export const ROTATE_TRIGGER = { interval: "interval", scroll: "scroll" } as const;

/** 轮换词默认停留 (ms). 短于 2s 读不完一个词, 长于 3s 首屏已经滚走. */
export const ROTATE_INTERVAL_MS = 2400;

/** 逐字或逐词. */
export const SPLIT_BY = { char: "char", word: "word" } as const;

/** 逐字 / 逐词的默认步长 (s). 逐字超过 40 字时总时长会拖沓, 调用方应调小或改逐词. */
export const SPLIT_STEP_S = { char: 0.02, word: 0.06 } as const;

/** 拆分时识别空白的正则源: 空白原样保留, 不包进动画单元. */
export const WHITESPACE_PATTERN = /(\s+)/;

/** 区块内的编排角色. */
export const ORCHESTRATION_ROLE = {
  eyebrow: "eyebrow",
  title: "title",
  lead: "lead",
  cta: "cta",
  media: "media",
} as const;

/** 滚动联动文档示例的取值与复用类名. */
export const SCROLL_DOC = {
  /** 示例滚动框. */
  scrollBox: "h-48 w-full overflow-y-auto rounded-lg border border-border",
  /** 滚动框内的加高内容, 留出可滚距离. */
  tallInner: "flex min-h-[200%] flex-col justify-center gap-2 p-4",
  /** 属性表里的 ref 类型名. */
  typeRef: "RefObject<HTMLElement>",
  /** 示例说明文字. */
  caption: "text-[13px] text-muted-foreground",
  /** 视差三层的速度因子. */
  speedSlow: 0.1,
  speedMid: 0.3,
  speedFast: 0.6,
} as const;
