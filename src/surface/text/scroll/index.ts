// 行为规格参照 docs/research/catalog/textanimations.md 的 ScrollFloat, ScrollReveal, ScrollVelocity, CurvedLoop, TextLoop, CircularText 条目, 实现为 HX 自有.
export * from "./tokens";
export { ScrollText, scrubUnit, type ScrollTextEffect, type ScrollTextProps } from "./ScrollText";
export { TextMarquee, marqueePath, wrapOffset, type MarqueeShape, type TextMarqueeProps } from "./TextMarquee";
export { OrbitText, orbitAngle, type OrbitHover, type OrbitTextProps } from "./OrbitText";
