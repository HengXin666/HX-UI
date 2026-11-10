// field 族 (着色器场): react-bits Animations 的 C 段. 行为规格参照 docs/research/catalog/animations.md 各条目, 实现为 HX 自有.
export * from "./tokens";
export { createInkDrive, hueRgb, inkPetals, inkSpread, packInk, stepInk, type InkDrive, type InkSettings, type InkSplat } from "./parts/ink";
export { InkSplash, type InkSplashProps } from "./InkSplash";
