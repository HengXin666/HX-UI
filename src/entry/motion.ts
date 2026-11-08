import { SPRING_FOLLOW, SPRING_PRESS, SPRING_THUMB } from "../craft/tokens";

export * from "../motion";
export { Follow, NumberRoll, SegmentedThumb, digitEase, stepSpring, usePress } from "../craft";
export {
  DEAL_FIRST_MS,
  DEAL_LAST_MS,
  DIGIT_MS,
  HERO_LIFT_PX,
  HERO_SINK_PX,
  PRESS_SCALE,
  SPRING_FOLLOW,
  SPRING_PRESS,
  SPRING_THUMB,
  THUMB_PRESS_SCALE,
  TOOLTIP_DELAY_MS,
} from "../craft";
export * from "../motion/shots";
export { Shot, ShotSequence, type ShotProps, type ShotSequenceProps } from "../studio/sequence/Sequence";
export { ShotLayer, ShotPlate, type ShotLayerProps, type ShotPlateProps } from "../studio/sequence/Plate";
export { prefersReducedMotion, playLayout, readLayout, type LayoutBox } from "../primitives/motion";

/**
 * 三档可中断弹簧按名字取用, 与 docs/research/craft.md 的合同同名.
 * 镜头语言 (原 studio/moves) 已迁入 src/motion/shots.ts. craft 的物理迁移等文档站首页那边收工后再做, 现在转发.
 * primitives/motion 的减弱动效判断与布局位移留在 L1: 原语自己要用, 搬上 L2 会让依赖朝上走, 这里只转出.
 *
 * .agents/notes/implemented/architecture/2026-11-08-layered-entries.md
 */
export const MOTION_SPRINGS = { press: SPRING_PRESS, thumb: SPRING_THUMB, follow: SPRING_FOLLOW } as const;

export type MotionSpringName = keyof typeof MOTION_SPRINGS;
