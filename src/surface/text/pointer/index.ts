// 行为规格参照 docs/research/catalog/textanimations.md 的 DepthText, EchoText, TechText, TextCursor 条目, 实现为 HX 自有.
export * from "./tokens";
export { extrudeIntro, extrudeLayers, layerOpacity, orbitTilt, pointerTilt, pushTarget, smoothingStep, type Tilt } from "./parts/extrude";
export { ExtrudeText, type ExtrudeTextProps, type ExtrudeTone } from "./ExtrudeText";
export { burstAt, driftLead, echoLook, followChain, pointerLead, wakeCount, wakeEase, type Vec, type WakeDirection, type WakeEase } from "./parts/wake";
export { WakeText, type WakeTextProps } from "./WakeText";
export { draftDamping, kickShare, nearestGlyph, outlineAmount, springBack, typeShown, type Glyph2 } from "./parts/draft";
export { DraftText, type DraftTextProps } from "./DraftText";
