import type { DocEntry, SectionId } from "./types";
import { button } from "./entries/button";
import { card } from "./entries/card";
import { badge } from "./entries/badge";
import { marquee, tiltCard } from "./entries/effects";
import { splitText } from "./entries/split-text";
import { numberRoll } from "./entries/number-roll";
import { input } from "./entries/input";
import { textarea } from "./entries/textarea";
import { select } from "./entries/select";
import { checkbox } from "./entries/checkbox";
import { switchEntry } from "./entries/switch";
import { radioGroup } from "./entries/radio-group";
import { slider } from "./entries/slider";
import { dialog } from "./entries/dialog";
import { sheet } from "./entries/sheet";
import { toastEntry } from "./entries/toast";
import { alert } from "./entries/alert";
import { progress } from "./entries/progress";
import { skeleton } from "./entries/skeleton";
import { spin } from "./entries/spin";
import { SECTIONS } from "./sections";

/**
 * 文档站清单. 只收值得单独一页的东西:
 * 一个参数就能表达的效果 (流光, 状态点, 光斑) 做成所属组件的参数, 不单列.
 */
const ALL: DocEntry[] = [button, card, badge, marquee, input, textarea, select, checkbox, switchEntry, radioGroup, slider, dialog, sheet, toastEntry, alert, progress, skeleton, spin, splitText, numberRoll, tiltCard];

const rank = (e: DocEntry) => {
  const s = SECTIONS.findIndex((x) => x.id === e.section);
  return s * 100 + SECTIONS[s].groups.indexOf(e.group);
};
export const ENTRIES: DocEntry[] = [...ALL].sort((a, b) => rank(a) - rank(b));

export const entriesOf = (s: SectionId) => ENTRIES.filter((e) => e.section === s);
export const entryBySlug = (slug: string) => ENTRIES.find((e) => e.slug === slug);
