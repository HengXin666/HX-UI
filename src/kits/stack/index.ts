/**
 * 叠放族出口. kits 总出口与 ./kits 子路径在收口时接.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-stack.md
 */
export { LIST_DEFAULTS, PopList, edgeFades, listPose, listStep, revealDelay, type ListAnimation, type PopListProps } from "./PopList";
export { PILE_DEFAULTS, ScrollPile, pileComplete, pilePose, pileSmooth, pinAt, stackOffset, type PilePose, type ScrollPileProps } from "./ScrollPile";
export { SWIPE_DEFAULTS, SwipeStack, exitVector, leanDeg, rotateOrder, shouldSend, slotPose, type SwipeCard, type SwipeLayout, type SwipeStackProps } from "./SwipeStack";
export { CycleDeck, SWAP_DEFAULTS, swapPointer, swapShouldCycle, swapSlot, swapStagger, type CycleCard, type CycleDeckProps } from "./CycleDeck";
export { BOUNCE_DEFAULTS, SpreadCards, hoverPose, popDelay, restPose, type BouncePose, type SpreadCardsProps, type SpreadImage } from "./SpreadCards";
