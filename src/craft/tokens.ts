/**
 * 控件手感的合同数字. 组件只引用名字.
 * 按下, 滑动, 跟随是三档不同的弹簧, 不能合成一档.
 */

export const SPRING = {
  press: { stiffness: 520, damping: 32, mass: 0.8 },
  thumb: { stiffness: 220, damping: 26, mass: 1 },
  follow: { stiffness: 170, damping: 16, mass: 1 },
  /** 过冲约 0.06 位, 大约 700ms 落到整数格. */
  digit: { stiffness: 196, damping: 18, mass: 1 },
  /** 宽度不要过冲, 阻尼比拇指更高. */
  width: { stiffness: 280, damping: 42, mass: 1 },
} as const;

export type SpringName = keyof typeof SPRING;
export type Spring = (typeof SPRING)[SpringName];

export const EASE = {
  out: [0.16, 1, 0.3, 1],
  in: [0.7, 0, 0.84, 0],
  overshoot: [0.34, 1.56, 0.64, 1],
  punch: [0.2, 1.25, 0.3, 1],
  settle: [0.3, 0, 0.25, 1.15],
} as const;

export type EaseName = keyof typeof EASE;

export const MS = {
  press: 90,
  release: 140,
  settle: 80,
  color: 120,
  colorLag: 40,
  thumb: 267,
  width: 180,
  digit: 700,
  digitStagger: 70,
  digitShare: 0.4,
  hold: 1000,
  arc: 3000,
  quiet: 300,
  prep: 200,
  punch: 900,
  land: 1400,
  still: 2400,
  lag: 80,
  ripple: 200,
  spin: 800,
  dtMin: 8,
  dtMax: 34,
  rapid: 120,
  dealStart: 120,
  dealEnd: 40,
  dealFlight: 420,
  quote: 500,
  dragSlop: 4,
} as const;

export const SCALE = {
  rest: 1,
  press: 0.97,
  release: 1.012,
  retrigger: 0.99,
  velDamp: 0.5,
  switchPress: 0.92,
  thumbMid: 0.06,
  segmentPress: 0.94,
  disabled: 0.45,
  digitOvershoot: 0.06,
  hero: 1.02,
  quoteMid: 0.97,
  tabSquash: 0.7,
} as const;

export const PX = {
  pressY: 1,
  prep: 8,
  lift: -4,
  travel: 16,
  magnet: 12,
  magnetGain: 0.35,
  rippleFrom: 4,
  rippleTo: 18,
  dealIn: 16,
  page: 24,
  record: 32,
  indicatorGap: 6,
  rest: 0.0008,
  vel: 0.02,
  near: 0.004,
  half: 0.5,
  digitCell: 1.2,
  digitWidth: 0.62,
  quoteBlur: 8,
  axisOver: 140,
  axisDomain: 100,
  axisNext: 160,
} as const;

export const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

export const WEIGHT = {
  rest: 500,
  selected: 560,
} as const;
