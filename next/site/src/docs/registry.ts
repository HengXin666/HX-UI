import type { DocEntry } from "./types";
import { splitText } from "./entries/split-text";
import { animatedNumber } from "./entries/animated-number";
import { speedCounter } from "./entries/speed-counter";
import { statefulButton } from "./entries/stateful-button";
import { backdrop, borderBeam, liveDot, magnetic, marquee, shimmerButton, spotlightCard, tiltCard } from "./entries/effects";
import { CATEGORIES } from "./categories";

/** 文档站的组件清单. 新组件: 在 entries/ 加 <slug>.ts + <slug>.demo.tsx, 再登记到这里. 按章节顺序排 */
const ALL: DocEntry[] = [
  splitText, animatedNumber, speedCounter,
  spotlightCard, borderBeam, magnetic, tiltCard, marquee,
  backdrop,
  statefulButton, shimmerButton,
  liveDot,
];
const rank = (e: DocEntry) => CATEGORIES.findIndex((c) => c.id === e.category);
export const ENTRIES: DocEntry[] = [...ALL].sort((a, b) => rank(a) - rank(b));

export const entryBySlug = (slug: string) => ENTRIES.find((e) => e.slug === slug);
