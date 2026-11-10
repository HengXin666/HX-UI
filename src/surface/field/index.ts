// field 族 (着色器场): react-bits Animations 的 C 段. 行为规格参照 docs/research/catalog/animations.md 各条目, 实现为 HX 自有.
export * from "./tokens";
export { createInkDrive, hueRgb, inkPetals, inkSpread, packInk, stepInk, type InkDrive, type InkSettings, type InkSplat } from "./parts/ink";
export { InkSplash, type InkSplashProps } from "./InkSplash";
export { mergeEase, makeMerge, mergeHome, mergeLook, packMerge, pairForce, settleMerge, stepMerge, type MergeBall, type MergeMotion, type MergeState, type MergeTuning } from "./parts/merge";
export { MERGE_MAX_RINGS, MERGE_VARIANTS, type MergeVariant } from "./parts/merge-shader";
export { MergeBlobs, type MergeBlobsProps } from "./MergeBlobs";
export { MASK_UV_GLSL, maskSize, rasterImage, rasterPath, rasterText, type MaskCanvas } from "./parts/mask";
export { chromeSource, makeChrome, stepChrome, type ChromeState } from "./parts/chrome";
export { ChromeMark, type ChromeMarkProps } from "./ChromeMark";
