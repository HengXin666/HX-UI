/**
 * 控件手感合同里的弹簧, 时长和幅度.
 * 每个数字只在这里写一次, 组件引用名字.
 */

export const SPRING_PRESS = { stiffness: 520, damping: 32, mass: 0.8 } as const;
export const SPRING_THUMB = { stiffness: 220, damping: 26, mass: 1 } as const;
export const SPRING_FOLLOW = { stiffness: 170, damping: 16, mass: 1 } as const;

export const PRESS_SCALE = 0.97;
export const PRESS_Y_PX = 1;
export const RELEASE_SCALE = 1.012;
export const RELEASE_HOLD_MS = 140;
export const SETTLE_MS = 80;
export const THUMB_PRESS_SCALE = 0.92;
export const THUMB_TRAVEL_PX = 16;
export const DIGIT_MS = 700;
export const DIGIT_STAGGER_MS = 70;
export const DIGIT_STAGGER_CAP = 0.4;
export const DIGIT_OVERSHOOT = 0.06;
export const DT_MIN_MS = 8;
export const DT_MAX_MS = 34;
export const REST_EPSILON = 0.0008;
export const RAPID_SCALE = 0.99;
export const VELOCITY_KEEP = 0.5;
export const TOOLTIP_DELAY_MS = 400;
export const FOLLOW_LIMIT_PX = 12;
export const HERO_SINK_PX = 8;
export const HERO_LIFT_PX = 4;
export const DEAL_FIRST_MS = 120;
export const DEAL_LAST_MS = 40;
