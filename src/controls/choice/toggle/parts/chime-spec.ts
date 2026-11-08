/** ChimeToggle 的规格常数与尺寸档. */

/** 宽度展开弹簧: 0.3 秒, bounce 由 revealBounce 覆盖 (规格 SPRING_UI). */
export const CHIME_REVEAL_DURATION = 0.3;
/** 摆动关键帧的时间轴扭曲指数: 第 k 次摆到位的时刻 = (k / n)^0.6, 大摆慢, 小摆快. */
export const CHIME_WARP = 0.6;
/** 尺寸档: [高, 字号, 图标, 徽标直径, 图标与文字间距]. */
export const CHIME_SIZES = { sm: [36, 12.5, 14, 15, 8], md: [44, 13.5, 16, 19, 9], lg: [52, 15, 18, 23, 10] } as const;
/** 关掉时的轻晃: 振幅取 ringAmplitude 的 0.4 倍, 3 次, 420ms. */
export const CHIME_WOBBLE = { amplitude: 0.4, passes: 3, duration: 420 } as const;
/** 铃身轮廓, 24 视口. */
export const CHIME_BELL_BODY = "M6 16.5V10a6 6 0 0 1 12 0v6.5l1.6 2.3H4.4L6 16.5z";
/** 铃舌比铃身晚 70ms 起摆. */
export const CHIME_CLAPPER_DELAY_MS = 70;
/** 声波: 每次摆到位放一圈, 380ms ease-out. */
export const CHIME_WAVE_MS = 380;
/** 声波向外漂的像素. */
export const CHIME_WAVE_SHIFT_PX = 3;
/** 规格里的 CSS 过渡时长. */
export const CHIME_MS = { press: 160, labelMove: 180, labelFade: 140, badgeMove: 280, badgeFade: 120, wave: 200 } as const;

export type ChimeSize = keyof typeof CHIME_SIZES;
