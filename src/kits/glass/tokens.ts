/**
 * 玻璃族 (src/kits/glass) 共用的名字. 叠放族已有的动值循环, 弹簧换算与过渡串在这里转出.
 * 收口时与导航族, 画廊族, 叠放族一起并进 src/motion.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-glass.md
 */
export { KIT_FOCUS, MS_PER_S, TAU, clamp, kitTone, omegaSpring, transitionOf, useKitMotion, type KitMotion, type KitTone } from "../stack/tokens";
