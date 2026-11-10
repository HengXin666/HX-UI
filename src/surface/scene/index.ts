// scene 族 (揭示与立体场): react-bits Animations 的 D 段. 行为规格参照 docs/research/catalog/animations.md 各条目, 实现为 HX 自有.
export * from "./tokens";
export { dotFade, dotWanderPath, makeDot, packBursts, stepDot, type DotBurst, type DotInput, type DotState, type DotTuning } from "./parts/dot";
export { DotReveal, type DotMode, type DotRevealProps, type DotShape } from "./DotReveal";
export type { VeilBuild, VeilFit, VeilKernel, VeilOrdered, VeilPalette, VeilPattern } from "./parts/dither";
export { BayerVeil, type BayerVeilProps } from "./BayerVeil";
export { makePrism, packPrism, prismEnergy, prismLook, prismWander, stepPrism, type PrismLook, type PrismMotion, type PrismPreset, type PrismShape, type PrismState } from "./parts/prism";
export { PrismOrb, type PrismOrbProps } from "./PrismOrb";
export { cubeCenter, cubeGrid, cubeIntro, makeCubes, packCubes, stepCubes, type CubeInput, type CubeRipple, type CubeState, type CubeTuning } from "./parts/cube";
export { CubeField, type CubeEdgeStyle, type CubeFieldProps } from "./CubeField";
export { makeMesh, meshSpring, stepMesh, type MeshState, type MeshTuning } from "./parts/mesh";
export { SpringMesh, type MeshMaterial, type SpringMeshProps } from "./SpringMesh";
export { makeStrands, stepStrands, strandEnergy, strandIntro, strandPulse, type StrandState } from "./parts/strand";
export { FiberStrands, type FiberStrandsProps } from "./FiberStrands";
