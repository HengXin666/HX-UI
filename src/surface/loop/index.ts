// 行为规格参照 docs/research/catalog/animations.md 的 LogoLoop, OrbitImages 条目, 实现为 HX 自有.
export * from "./tokens";
export { copiesNeeded, flingVelocity, introOpacity, introTotal, wrapOffset } from "./parts/rail";
export { MarkRail, type MarkRailItem, type MarkRailProps } from "./MarkRail";
export { buildOrbit, lapPhase, orbitAt, orbitLook, shapePoint, type OrbitPathSpec, type OrbitShape, type OrbitTable } from "./parts/orbit";
export { OrbitRing, type OrbitImage, type OrbitRingProps } from "./OrbitRing";
