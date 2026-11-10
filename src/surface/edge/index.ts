// 行为规格参照 docs/research/catalog/animations.md 的 StarBorder, ElectricBorder 条目, 实现为 HX 自有.
export * from "./tokens";
export { emitCount, lapEase, roundRectLength, roundRectPoint, wrapPhase } from "./parts/comet";
export { CometBorder, type CometBorderProps } from "./CometBorder";
export { budgetRatio, jag, pointerEnergy, revealShown, surgeEnergy, valueNoise } from "./parts/spark";
export { SparkEdge, type SparkEdgeProps } from "./SparkEdge";
