// 行为规格参照 docs/research/catalog/animations.md 的 BlobCursor, GlowCursor, GhostCursor, SwarmCursor, Ribbons, CursorGrid 条目, 实现为 HX 自有.
/**
 * cursor 族 (跟手画布, Canvas2D). 只维护本族导出; 接到 @hx/ui/surface 在 Animations B 段段尾.
 */
export * from "./tokens";
export { pointerPx, pointerVelocityPx, type Body } from "./parts/common";
export { makeMeld, massAfterSplash, meldSpring, regrowMass, splashMeld, stepMeld, type Drop, type MeldState, type MeldTuning } from "./parts/meld";
export { MeldCursor, type MeldCursorProps } from "./MeldCursor";
export { haloFollowTau, haloLayers, makeHalo, stepHalo, type HaloPoint, type HaloState } from "./parts/halo";
export { HaloCursor, type HaloCursorProps } from "./HaloCursor";
export { hazeDecay, hazeSpring, makeHaze, puffHaze, puffRadius, stepHaze, type HazeState, type HazeTuning, type Puff } from "./parts/haze";
export { HazeCursor, type HazeCursorProps } from "./HazeCursor";
export { FLOCK_STRIDE, burstFlock, flockEase, flockGrab, makeFlock, stepFlock, type FlockState, type FlockTuning } from "./parts/flock";
export { FlockCursor, type FlockCursorProps, type FlockShape } from "./FlockCursor";
export { makeStreamers, ribbonOutline, stepStreamers, streamerFollow, streamerProfile, streamerSpring, type Ribbon, type StreamerShape, type StreamerState, type StreamerTuning } from "./parts/streamer";
export { StreamerCursor, type StreamerCursorProps } from "./StreamerCursor";
export { edgeAlpha, fitNudge, makeNudge, nudgeEase, stepNudge, type NudgeFalloff, type NudgeHighlight, type NudgeState, type NudgeTuning } from "./parts/nudge";
export { NudgeGrid, type NudgeGridProps, type NudgeGridStyle } from "./NudgeGrid";
