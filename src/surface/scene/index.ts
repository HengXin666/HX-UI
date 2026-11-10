// scene 族 (揭示与立体场): react-bits Animations 的 D 段. 行为规格参照 docs/research/catalog/animations.md 各条目, 实现为 HX 自有.
export * from "./tokens";
export { dotFade, dotWanderPath, makeDot, packBursts, stepDot, type DotBurst, type DotInput, type DotState, type DotTuning } from "./parts/dot";
export { DotReveal, type DotMode, type DotRevealProps, type DotShape } from "./DotReveal";
