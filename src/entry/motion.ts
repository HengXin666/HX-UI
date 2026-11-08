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
export { dealDelay, SHOT_DEPTH, SHOT_DRIVE, SHOT_MOVE, SHOT_PACE, type ShotDepth, type ShotDrive, type ShotFrame, type ShotMove, type ShotPace } from "../studio/moves";
export { Shot, ShotSequence, type ShotProps, type ShotSequenceProps } from "../studio/sequence/Sequence";
export { ShotLayer, ShotPlate, type ShotLayerProps, type ShotPlateProps } from "../studio/sequence/Plate";
export { prefersReducedMotion, playLayout, readLayout, type LayoutBox } from "../primitives/motion";

/**
 * 三档可中断弹簧按名字取用, 与 docs/research/craft.md 的合同同名.
 * 运动分散在 motion, craft, studio 与 primitives 四处, 这个入口把它们收成一条 @hx/ui/motion,
 * 物理迁移留到第二阶段, 现在只做转发.
 *
 * .agents/notes/implemented/architecture/2026-11-08-layered-entries.md
 */
export const MOTION_SPRINGS = { press: SPRING_PRESS, thumb: SPRING_THUMB, follow: SPRING_FOLLOW } as const;

export type MotionSpringName = keyof typeof MOTION_SPRINGS;
