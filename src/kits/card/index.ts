/**
 * 卡片族出口. kits 总出口与 ./kits 子路径在收口时接.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-card.md
 */
export { LAMP_DEFAULTS, LampCard, lampFollowTau, lampGradient, lampReach, type LampCardProps, type LampShape } from "./LampCard";
export { EDGE_DEFAULTS, EDGE_SWEEP_MS, EdgeGlow, edgeAngle, edgeCone, edgeLevel, edgeProximity, edgeSweep, type EdgeGlowProps } from "./EdgeGlow";
export { TILTED_DEFAULTS, TiltCard, glarePose, isTap, tiltSpring, tiltTarget, tipAngle, type TiltCardProps } from "./TiltCard";
export { BADGE_DEFAULTS, BadgeCard, badgeHolo, badgeIntro, badgeParallax, type BadgeCardProps } from "./BadgeCard";
export { PIXEL_VARIANTS, PixelBloom, buildField, hash01, pixelSize, stepField, stepSpot, type PixelBloomProps, type PixelOrigin, type PixelShape, type PixelTrigger, type PixelVariant } from "./PixelBloom";
export { FOIL_SPECTRUM, FoilCard, foilIdle, foilPattern, foilRainbow, foilShift, type FoilCardProps, type FoilPreset } from "./FoilCard";
export { MIRROR_DEFAULTS, MIRROR_INTRO_MS, MirrorCard, mirrorFilter, mirrorMetal, mirrorSheen, type MirrorCardProps } from "./MirrorCard";
export { FRAY_BLEED, FRAY_DEFAULTS, FrayCard, frayFrequency, frayScale, frayWanted, type FrayCardProps, type FrayScope } from "./FrayCard";
