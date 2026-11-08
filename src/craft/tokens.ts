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
/** 分段拇指的按下合同: 90ms 缩到 0.94; 点击点一圈 1px 线 200ms 内半径 4px 到 18px, 透明度 0.35 到 0; 滑动钳在 160 到 420ms. */
export const PRESS_MS = 90;
export const SEGMENT_PRESS_SCALE = 0.94;
export const RING_MS = 200;
export const RING_FROM_PX = 4;
export const RING_TO_PX = 18;
export const RING_ALPHA = 0.35;
export const THUMB_MIN_MS = 160;
export const THUMB_MAX_MS = 420;

/**
 * 具名缓动, 值是 cubic-bezier 的四个控制点原文, 和研究文档里的写法逐字一致. 组件和镜头只引用名字.
 * 前五条来自 docs/research/craft.md; crane / dive / stamp 取镜头卡原值:
 * crane = crane-rise-reveal 拉升, dive = deck-deal-flyin 单卡飞行, stamp = paper-title-card 逐词压印.
 */
export const EASE = {
  out: "0.16, 1, 0.3, 1",
  in: "0.7, 0, 0.84, 0",
  overshoot: "0.34, 1.56, 0.64, 1",
  punch: "0.2, 1.25, 0.3, 1",
  settle: "0.3, 0, 0.25, 1.15",
  crane: "0.2, 0, 0.25, 1",
  dive: "0.3, 0, 0.2, 1",
  stamp: "0.2, 0.75, 0.3, 1",
} as const;

export type EaseName = keyof typeof EASE;

export const COLOR_MS = 120;
export const THUMB_MS = 267;
export const HOLD_MS = 1000;
export const ARC_MS = 3000;
/** 30fps 下一帧的毫秒数, 镜头卡帧数换算用. */
export const FRAME_MS = 1000 / 30;
