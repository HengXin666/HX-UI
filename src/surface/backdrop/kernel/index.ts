// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Backgrounds 族共用 (单画布, DPR 上限, 离屏停帧) 条目, 实现为 HX 自有.
export { atlasGrid, createGlyphAtlas, type GlyphAtlas } from "./atlas";
export { BackdropShell, type BackdropShellProps } from "./BackdropShell";
export { canvasFactory, domFactory, type CanvasSpec, type DomSpec } from "./canvas2d";
export { cssColorOf, oklchToRgb, parseColor, resolveColor, type Rgb } from "./color";
export { splitCommon, type BackdropCommonProps, type CommonKeys } from "./common";
export { fallbackGradient, glowFallback, FALLBACK_ANGLE } from "./fallback";
export { createPingPong, disposePingPong, feedbackSize, resizePingPong, swapPingPong, type PingPong } from "./feedback";
export { planRun, watchView, VIEW_MARGIN, type RunGate, type RunPlan } from "./gate";
export {
  applyUniforms, bindTexture, createPass, disposePass, drawPass, FULLSCREEN_VERTEX, uniformData, uniformKind, uploadTexture,
  type ShaderPass, type UniformKind, type UniformList, type UniformMap, type UniformValue,
} from "./gl";
export { BACKDROP_MAX_TAPS, fragmentSource, GLSL_HASH, GLSL_HEADER, GLSL_NOISE, GLSL_UTIL } from "./glsl";
export {
  approach, BACKDROP_DPR_CAP, BACKDROP_DT_CAP, BACKDROP_MAX_EDGE, BACKDROP_STILL_TIME, clamp, clampDpr, fitCanvas, frameSeconds, mix, MS_PER_S,
  seedOf, smoothstep, type CanvasFit,
} from "./math";
export {
  attachPointer, createPointerState, POINTER_ENTER_TAU, POINTER_LEAVE_TAU, POINTER_VELOCITY_TAU, pushTap, stepPointer, TAP_LIFETIME, toLocal,
  type BackdropTap, type PointerState,
} from "./pointer";
export { kernelUniforms, shaderFactory, shaderKey, type PassSpec, type ShaderSpec } from "./shader";
export { useBackdrop, type BackdropFactory, type BackdropFrame, type BackdropHandle, type BackdropOptions, type BackdropRenderer, type BackdropStatus } from "./use-backdrop";
export { useReducedMotionPreference } from "./use-reduced-motion";
export { useCanvasBackdrop, useDomBackdrop, useShaderBackdrop, type SurfaceOptions } from "./use-surfaces";
