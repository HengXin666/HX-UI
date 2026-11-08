// 行为规格参照 docs/research/catalog/animations.md 的 PixelSwap, PixelTransition, ScrollExpand, GradualBlur 条目, 实现为 HX 自有.
export { BAYER, EDGE_BLUR, EDGE_CURVES, MOSAIC, TILE, WIDEN, cellNoise, type EdgeCurve } from "./tokens";
export { mosaicAmount, tileClip, tileGrid, tileHalf, tileOrders, type MosaicAnimation, type TileGrid, type TilePattern } from "./tile-math";
export { TileFlip, type TileFlipProps, type TileTrigger } from "./TileFlip";
export { MosaicSwap, mosaicRate, quantize, type MosaicShape, type MosaicSwapProps, type MosaicTrigger } from "./MosaicSwap";
export { ScrollWiden, widenFrame, widenProgress, type ScrollWidenProps } from "./ScrollWiden";
export { EdgeBlur, layerBlur, layerMask, type EdgeBlurProps, type EdgeSide } from "./EdgeBlur";
