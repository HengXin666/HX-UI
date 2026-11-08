// 行为规格参照 docs/research/catalog/animations.md 的 GlareHover, ImageTrail, Magnet, TargetCursor 条目, 实现为 HX 自有.
export { ATTRACT, LOCK, SHEEN, WAKE, clamp, cosineEase, mix, powerOut, seeded, smoothstep } from "./tokens";
export { TONE_CLASS, TONE_TOKEN, type SurfaceTone } from "./tone";
export { POINTER_VELOCITY_TAU_S, locate, makePointer, usePointerTrack, type PointerHandlers, type PointerState } from "./track";
export { Attract, attractPull, attractSpring, outsideDistance, strongest, type AttractAxis, type AttractProps } from "./Attract";
export { LockOnCursor, foldQuarter, lockBox, type LockOnCursorProps } from "./LockOnCursor";
export { PhotoWake, wakePhase, wakeSlots, type PhotoWakeProps } from "./PhotoWake";
export { SheenCard, bandCenter, streakGradient, sweepMs, type SheenCardProps, type SheenMode, type SheenVariant } from "./SheenCard";
