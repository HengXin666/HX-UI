// 行为规格参照 docs/research/catalog/textanimations.md 的 DepthText, EchoText, TechText, TextCursor 条目, 实现为 HX 自有.
export * from "./tokens";
export { extrudeIntro, extrudeLayers, layerOpacity, orbitTilt, pointerTilt, pushTarget, smoothingStep, type Tilt } from "./parts/extrude";
export { ExtrudeText, type ExtrudeTextProps, type ExtrudeTone } from "./ExtrudeText";
