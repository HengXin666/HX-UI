// 行为规格参照 docs/research/catalog/textanimations.md 的 DecryptedText, ScrambledText, Shuffle, SplitFlapText, TextType, GradientText, ShinyText, GlitchText 条目, 实现为 HX 自有.

/**
 * 字形意图 (src/surface/text/glyph) 的常数. 毫秒写 _MS, 秒写 _S, 像素写 _PX.
 * 每个数字在这里写一次, 组件只引用名字.
 */

/** 解密: 每拍 50ms, 非逐位时乱 10 拍后整体停格, 循环间隔 2000ms. */
export const SCRAMBLE_DEFAULTS = { speed: 50, maxIterations: 10, loopDelay: 2000 } as const;
/** 指针乱码: 半径 100px, 中心处持续 1.2s, 字符表两个点号. */
export const SCRAMBLE_POINTER = { radius: 100, duration: 1.2, chars: ".:" } as const;
/** 洗牌: 字间隔 30ms, 每格乱 1 轮, 每轮 0.35s. */
export const SHUFFLE_DEFAULTS = { stagger: 0.03, shuffleTimes: 1, duration: 0.35 } as const;

/** 翻牌: 每翻 0.12s (下限 0.04s), 格间隔 60ms, 停留 2400ms, 每格最多翻 8 次, 补到 12 格. */
export const FLAP_DEFAULTS = { flipDuration: 0.12, stagger: 0.06, cycleDelay: 2400, flipsPerChar: 8, padTo: 12, gap: 6, tileRadius: 8 } as const;
export const FLAP_MIN_FLIP_S = 0.04;
export const FLAP_CHARSETS = {
  alphanumeric: " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  alpha: " ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  numeric: " 0123456789",
} as const;

/** 打字: 每字 50ms, 退格每字 30ms, 停顿 2000ms, 光标半周期 0.5s. */
export const TYPE_DEFAULTS = { typingSpeed: 50, deletingSpeed: 30, pauseDuration: 2000, initialDelay: 0, cursorBlinkDuration: 0.5, cursorCharacter: "|" } as const;

/** 渐变流动: 一圈 8s, 背景放大 3 倍, 角度按方向取; 跟随指针时的拉力时间常数 1/6s. */
export const GRADIENT_DEFAULTS = { animationSpeed: 8, scale: 3 } as const;
export const GRADIENT_ANGLES = { horizontal: 90, vertical: 180, diagonal: 135 } as const;
export const GRADIENT_PULL_TAU_S = 1 / 6;
/** 渐变跟随指针的弹簧刚度 (临界阻尼). */
export const GRADIENT_FOLLOW_STIFFNESS = 160;
/** 扫光: 一趟 2s, 角度 120, 光带宽 40%. */
export const SHINE_DEFAULTS = { speed: 2, delay: 0, angle: 120, shineWidth: 40 } as const;
/** 扫光跟随指针的弹簧刚度 (临界阻尼). */
export const SHINE_FOLLOW_STIFFNESS = 220;
/** 扫光一趟占全程的最短比例, 指针很近时也不会一闪而过. */
export const SHINE_MIN_SPAN = 0.15;

/** 错位: 速度 0.5, 偏移 10px, 强度 0.5, 点击或悬停一次持续 0.6s. */
export const SHIFT_DEFAULTS = { speed: 0.5, offset: 10, intensity: 0.5, burstDuration: 0.6 } as const;
/** 错位切片数. */
export const SHIFT_SLICES = 4;
/** speed 为 1 时每秒换几次切片. */
export const SHIFT_RATE_HZ = 24;
