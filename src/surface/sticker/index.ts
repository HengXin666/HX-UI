// 行为规格参照 docs/research/catalog/animations.md 的 StickerPeel 条目, 实现为 HX 自有.
export * from "./tokens";
export { clipHalfPlane, foldLine, mirrorMatrix, polygonCss, springStep, type Pt } from "./parts/peel";
export { PeelSticker, type PeelStickerProps } from "./PeelSticker";
