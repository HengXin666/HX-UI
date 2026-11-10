// 行为规格参照 docs/research/catalog/animations.md 的 Noise 条目, 实现为 HX 自有.
export * from "./tokens";
export { fillGrain, frameDue, grainValue, seededRandom, type GrainFrameOptions } from "./parts/grain";
export { GrainLayer, type GrainLayerProps } from "./GrainLayer";
