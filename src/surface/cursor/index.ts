// 行为规格参照 docs/research/catalog/animations.md 的 BlobCursor, GlowCursor, GhostCursor, SwarmCursor, Ribbons, CursorGrid 条目, 实现为 HX 自有.
/**
 * cursor 族 (跟手画布, Canvas2D). 只维护本族导出; 接到 @hx/ui/surface 在 Animations B 段段尾.
 */
export * from "./tokens";
export { clamp, follow, integrate, mix, noise1, pointerPx, pointerVelocityPx, seededRandom, type Body } from "./parts/common";
export { makeMeld, massAfterSplash, meldSpring, regrowMass, splashMeld, stepMeld, type Drop, type MeldState, type MeldTuning } from "./parts/meld";
export { MeldCursor, type MeldCursorProps } from "./MeldCursor";
