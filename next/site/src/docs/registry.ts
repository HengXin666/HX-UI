import type { DocEntry } from "./types";
import { splitText } from "./entries/split-text";

/** 文档站的组件清单. 新组件: 在 entries/ 加 <slug>.ts + <slug>.demo.tsx, 再登记到这里 */
export const ENTRIES: DocEntry[] = [splitText];

export const entryBySlug = (slug: string) => ENTRIES.find((e) => e.slug === slug);
