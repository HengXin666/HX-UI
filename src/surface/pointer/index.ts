// 行为规格参照 docs/research/catalog/animations.md 的 ClickSpark, Crosshair, GlareHover, ImageTrail, Magnet, TargetCursor 条目, 实现为 HX 自有.
export { ATTRACT, LOCK, RETICLE, SHEEN, SPARK, SPARK_EASINGS, WAKE, clamp, cosineEase, mix, powerOut, seeded, smoothstep, type SparkEasing } from "./tokens";
export { TONE_CLASS, TONE_TOKEN, type SurfaceTone } from "./tone";
export { POINTER_VELOCITY_TAU_S, locate, makePointer, usePointerTrack, type PointerHandlers, type PointerState } from "./track";
export { Attract, attractPull, attractSpring, outsideDistance, strongest, type AttractAxis, type AttractProps } from "./Attract";
export { LockOnCursor, foldQuarter, lockBox, type LockOnCursorProps } from "./LockOnCursor";
export { PhotoWake, wakePhase, wakeSlots, type PhotoWakeProps } from "./PhotoWake";
export { SheenCard, bandCenter, streakGradient, sweepMs, type SheenCardProps, type SheenMode, type SheenVariant } from "./SheenCard";
export { SurfaceLayer, type SurfaceLayerProps } from "./SurfaceLayer";
export { inkOf, toPixels } from "./ink";
export { TapSparks, burstLongest, drawBurst, pushBurst, sparkLife, sparkReach, type SparkBurst, type SparkShape, type TapSparksProps } from "./TapSparks";
export { ReticleLines, makeReticle, reticleTau, stepReticle, type ReticleLineStyle, type ReticleLinesProps, type ReticleState, type ReticleTargetEffect } from "./ReticleLines";
