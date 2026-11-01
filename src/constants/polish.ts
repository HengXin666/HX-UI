/**
 * UI 丰富度改造 (StatCard, AnimatedNumber, 动效预设, 标签页指示器, 文档导航图标) 复用三次以上的字面量 (PROJECT-CONST-DUP).
 * 只做字面量外提, 值与改动前逐字节一致; 语义不同的同值参数分别命名, 不合并.
 */

/** 趋势方向值. */
export const TREND_DIRECTION = { up: "up", down: "down", flat: "flat" } as const;

/** 趋势与迷你折线共用的语气档. */
export const TREND_TONE = { good: "good", bad: "bad", flat: "flat", brand: "brand" } as const;

/** 迷你折线画布 (viewBox 单位): 宽与高. */
export const SPARK_WIDTH = 100;
export const SPARK_HEIGHT = 28;
/** 迷你折线至少几个点才画. */
export const SPARK_MIN_POINTS = 2;
/** 上下两侧留白, 可用高度要减去两份. */
export const SPARK_PAD_SIDES = 2;
/** path 坐标保留的小数位. */
export const SPARK_COORD_DECIMALS = 2;

/** SVG 属性值. */
export const SVG_NONE = "none";
export const SVG_CURRENT_COLOR = "currentColor";
export const SVG_NON_SCALING_STROKE = "non-scaling-stroke";

/** 数字的小数点与 cubic-bezier 参数的分隔符. */
export const DECIMAL_POINT = ".";
export const BEZIER_SEPARATOR = ",";

/** 数字类名: 等宽数字与只给读屏器的终值. */
export const NUMBER_CLASS = { tabular: "tabular-nums", srOnly: "sr-only" } as const;

/** 三档物理弹簧的刚度, 阻尼与质量 (motion/presets SPRING). */
export const SPRING_STIFFNESS = { soft: 120, snappy: 420, bouncy: 260 } as const;
export const SPRING_DAMPING = { soft: 20, snappy: 36, bouncy: 13 } as const;
export const SPRING_MASS = { soft: 1, snappy: 0.8, bouncy: 1 } as const;

/** 标签页滑动指示器的弹簧: 偏硬, 不回弹出标签边界. */
export const TABS_INDICATOR_STIFFNESS = 480;
export const TABS_INDICATOR_DAMPING = 36;
export const TABS_INDICATOR_MASS = 0.8;

/** 文档导航: 确认类对话框共用的图标. */
export const NAV_ICON_SHIELD_WARNING = "icon-[solar--shield-warning-linear]";
