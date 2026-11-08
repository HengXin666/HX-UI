// 行为规格参照 docs/research/catalog/textanimations.md 的 CountUp, BlurText, SplitText, DecryptedText, ScrollReveal 条目, 实现为 HX 自有.

/**
 * 文本族 (src/surface/text) 内核共用的常数. 每个数字在这里写一次, 各件只引用名字.
 * 毫秒写 _MS, 秒写 _S, 像素写 _PX.
 */

/** 错峰上限: 相邻单元的间隔不超过它 (秒). */
export const STAGGER_CAP_S = 0.07;
/** 错峰总量不超过整段时长的这个比例, 单元再多也留出主体时长. */
export const STAGGER_SHARE = 0.4;
/** 进视口判定: 露出这个比例才起播. */
export const VIEW_THRESHOLD = 0.1;
/** 帧长上限 (秒): 切后台回来不一帧跳完. */
export const DT_CAP_S = 0.05;
/** 画布像素比上限. */
export const DPR_CAP = 2;
export const MS_PER_S = 1000;
export const HALF = 0.5;
export const DOUBLE = 2;
export const PERCENT = 100;
/** 按需起停的帧循环口径: 只钳帧长. */
export const TEXT_CLOCK = { maxDtMs: DT_CAP_S * MS_PER_S } as const;
/** 常驻帧循环的口径 (配 active 使用): 帧长上限, 页面隐藏时停帧, 回到前台接上. */
export const TEXT_FRAME = { maxDtMs: DT_CAP_S * MS_PER_S, pauseWhenHidden: true } as const;

/** 乱码默认字符表 (本库自定): 大写, 数字与几个等宽符号, 视觉宽度接近, 跳字时不抖行. */
export const GLYPH_POOL = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*+=?";
/** 乱码换字的节拍 (毫秒): 每格每拍换一次字. */
export const GLYPH_TICK_MS = 50;

/** 读屏专用的视觉隐藏类. */
export const SR_ONLY = "sr-only";
/** 单元的基础类: 行内块, 可以变换. */
export const UNIT_CLASS = "inline-block";
/** 一个词的包裹: 换行只发生在词与词之间. */
export const WORD_CLASS = "inline-block whitespace-nowrap";
