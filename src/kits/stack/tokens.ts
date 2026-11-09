/**
 * 叠放族 (src/kits/stack) 共用的名字. 画廊族已有的过渡串, 动值循环, 拖拽与取模在这里转出,
 * 本族补规格里 omega / zeta 写法的弹簧换算. 收口时与导航族, 画廊族一起并进 src/motion.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-stack.md
 */
import type { SpringSpec } from "../../craft/spring";

export {
  KIT_FOCUS,
  KIT_OUT_LONG,
  MS_PER_S,
  approach,
  clamp,
  kitTone,
  smoothstep,
  transitionOf,
  useKitMotion,
  wrapIndex,
  type KitMotion,
  type KitTone,
} from "../gallery/tokens";
export { useDrag } from "../gallery/parts/use-drag";

export const TAU = Math.PI * 2;

/** 规格的 omega (rad/s) 与阻尼比 zeta 换成 craft 弹簧: 质量 1, 劲度 omega^2, 阻尼 2 zeta omega. */
export function omegaSpring(omega: number, zeta: number): SpringSpec {
  return { stiffness: omega * omega, damping: 2 * zeta * omega, mass: 1 };
}

/** 规格的 "劲度 + 回弹度" 写法: 阻尼 2 (1 - 0.85 bounciness) sqrt(stiffness), bounciness 钳到 [0, 1]. */
export function bounceSpring(stiffness: number, bounciness: number): SpringSpec {
  const b = Math.min(1, Math.max(0, bounciness));
  return { stiffness, damping: 2 * (1 - 0.85 * b) * Math.sqrt(stiffness), mass: 1 };
}
