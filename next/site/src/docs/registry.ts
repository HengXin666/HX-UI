import type { DocEntry, SectionId } from "./types";
import { button } from "./entries/button";
import { card } from "./entries/card";
import { badge } from "./entries/badge";
import { marquee, tiltCard } from "./entries/effects";
import { splitText } from "./entries/split-text";
import { numberRoll } from "./entries/number-roll";
import { decryptedText } from "./entries/decrypted-text";
import { stage } from "./entries/stage";
import { blueprint } from "./entries/blueprint";
import { particles } from "./entries/particles";
import { clickSpark } from "./entries/click-spark";
import { scrollStack } from "./entries/scroll-stack";
import { scrollReveal } from "./entries/scroll-reveal";
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
import { dropdownMenu } from "./entries/dropdown-menu";
import { toggleGroup } from "./entries/toggle-group";
import { command } from "./entries/command";
import { tabs } from "./entries/tabs";
import { breadcrumb } from "./entries/breadcrumb";
import { pagination } from "./entries/pagination";
import { avatar } from "./entries/avatar";
import { tooltip } from "./entries/tooltip";
import { popover } from "./entries/popover";
import { accordion } from "./entries/accordion";
import { kbd } from "./entries/kbd";
import { datePicker } from "./entries/date-picker";
import { dataTable } from "./entries/data-table";
import { charts } from "./entries/charts";
import { comboChart } from "./entries/combo-chart";
import { radarCompare } from "./entries/radar-compare";
import { gauge } from "./entries/gauge";
import { scatterBubble } from "./entries/scatter-bubble";
import { conversionFunnel } from "./entries/conversion-funnel";
import { shareTreemap } from "./entries/share-treemap";
import { sankeyFlow } from "./entries/sankey-flow";
import { heatCalendar } from "./entries/heat-calendar";
import { candlestick } from "./entries/candlestick";
import { scatter3d } from "./entries/scatter-3d";
import { map3d } from "./entries/map-3d";
import { intraday } from "./entries/intraday";
import { depthChart } from "./entries/depth-chart";
import { volumeProfile } from "./entries/volume-profile";
import { forceGraph } from "./entries/force-graph";
import { waterfall } from "./entries/waterfall";
import { bullet } from "./entries/bullet";
import { distribution } from "./entries/distribution";
import { sunburst } from "./entries/sunburst";
import { rose } from "./entries/rose";
import { gantt } from "./entries/gantt";
import { chinaMap } from "./entries/china-map";
import { bar3d } from "./entries/bar-3d";
import { surface3d } from "./entries/surface-3d";
import { globeArcs } from "./entries/globe-arcs";
import { agentMarkdown } from "./entries/agent-markdown";
import { agentCodeBlock } from "./entries/agent-code-block";
import { agentReasoning } from "./entries/agent-reasoning";
import { agentToolCall } from "./entries/agent-tool-call";
import { agentConversation } from "./entries/agent-conversation";
import { SECTIONS } from "./sections";

/**
 * 文档站清单. 只收值得单独一页的东西:
 * 一个参数就能表达的效果 (流光, 状态点, 光斑) 做成所属组件的参数, 不单列.
 */
const ALL: DocEntry[] = [button, dropdownMenu, toggleGroup, command, tabs, breadcrumb, pagination, card, badge, avatar, tooltip, popover, accordion, kbd, marquee, dialog, sheet, toastEntry, alert, progress, skeleton, spin, input, textarea, select, checkbox, switchEntry, radioGroup, slider, datePicker, dataTable, charts, comboChart, radarCompare, gauge, scatterBubble, conversionFunnel, shareTreemap, sankeyFlow, heatCalendar, candlestick, intraday, depthChart, volumeProfile, forceGraph, waterfall, bullet, distribution, sunburst, rose, gantt, chinaMap, bar3d, surface3d, globeArcs, scatter3d, map3d, stage, blueprint, splitText, decryptedText, numberRoll, scrollReveal, particles, clickSpark, scrollStack, tiltCard, agentMarkdown, agentCodeBlock, agentReasoning, agentToolCall, agentConversation];

const rank = (e: DocEntry) => {
  const s = SECTIONS.findIndex((x) => x.id === e.section);
  return s * 100 + SECTIONS[s].groups.indexOf(e.group);
};
export const ENTRIES: DocEntry[] = [...ALL].sort((a, b) => rank(a) - rank(b));

export const entriesOf = (s: SectionId) => ENTRIES.filter((e) => e.section === s);
export const entryBySlug = (slug: string) => ENTRIES.find((e) => e.slug === slug);
