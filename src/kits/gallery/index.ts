/**
 * 画廊族出口. kits 总出口与 ./kits 子路径在收口时接.
 *
 * .agents/notes/implemented/feature/2026-11-09-kits-gallery.md
 */
export { FOLD_DEFAULTS, FoldGallery, foldGrow, type FoldGalleryProps, type FoldItem } from "./FoldGallery";
export { CAROUSEL_SPRING, SpringCarousel, releaseTarget, slideOffset, type CarouselSlide, type SpringCarouselProps } from "./SpringCarousel";
export { RING_SPRING, RingCarousel, cruiseVelocity, ringActive, ringRadius, ringStep, ringTarget, type RingCarouselProps, type RingItem } from "./RingCarousel";
export { BEND_DEFAULTS, BendGallery, arcPlace, followFactor, type BendGalleryProps, type BendItem } from "./BendGallery";
export { DEPTH_DEFAULTS, DepthDeck, depthPose, depthRank, type DepthCard, type DepthDeckProps, type DepthLook, type DepthPose } from "./DepthDeck";
