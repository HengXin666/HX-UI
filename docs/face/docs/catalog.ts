import data from "./catalog/catalog.gen.json";
import { ICON, INDEX_ID } from "./constants";
import { PAGE_SPECS } from "./specs";
import type { ComponentSpec } from "./specs/types";

/** catalog.gen.json 的一条 (scripts/docs-catalog.ts 生成, 目录源是 catalog/catalog.src.json). */
interface GenEntry {
  readonly id: string;
  readonly name: string;
  readonly layer: string;
  readonly group: string;
  readonly kind: string;
  readonly role: string;
  readonly exports: readonly string[];
  readonly desc: string;
  readonly page: boolean;
  readonly sub?: string;
  readonly source?: string;
}

/** 目录的组; 超过 12 件的组带子组, 左栏在组内按子组分段. */
export interface CatalogGroup {
  readonly id: string;
  readonly layer: string;
  readonly label: string;
  readonly subs?: readonly { readonly id: string; readonly label: string }[];
}

interface GenCatalog {
  readonly layers: readonly { readonly id: string; readonly label: string }[];
  readonly groups: readonly CatalogGroup[];
  readonly entries: readonly GenEntry[];
}

const GEN = data as GenCatalog;

/** 目录条目. group 是组的显示名, groupId 是组 id; 有组件页定义的条目带 spec. */
export interface CatalogEntry {
  readonly id: string;
  readonly label: string;
  readonly desc: string;
  readonly group: string;
  readonly groupId: string;
  readonly layer: string;
  readonly layerLabel: string;
  readonly kind: string;
  readonly role: string;
  readonly exports: readonly string[];
  readonly page: boolean;
  readonly sub?: string;
  readonly source?: string;
  readonly spec?: ComponentSpec;
}

export const START_LAYER = "start";
export const LAYERS = GEN.layers;
export const GROUPS = GEN.groups;

const SPEC_BY_ID = new Map(PAGE_SPECS.map((spec) => [spec.id, spec]));
const LAYER_LABEL = new Map(LAYERS.map((layer) => [layer.id, layer.label]));
const GROUP_LABEL = new Map(GROUPS.map((group) => [group.id, group.label]));

function toEntry(item: GenEntry): CatalogEntry {
  const group = GROUP_LABEL.get(item.group) ?? item.group;
  const base = { ...item, label: item.name, group, groupId: item.group, layerLabel: LAYER_LABEL.get(item.layer) ?? item.layer };
  const page = SPEC_BY_ID.get(item.id);
  return page ? { ...base, spec: { ...page, label: item.name, desc: item.desc, group } } : base;
}

/** 目录全部条目, 含组件层里还没有页的件 (page: false). */
export const ENTRIES: readonly CatalogEntry[] = GEN.entries.map(toEntry);
/** 有页的条目: 路由, 上下页与左栏列表用. */
export const CATALOG: readonly CatalogEntry[] = ENTRIES.filter((entry) => entry.page);
/** 组件页 (不含上手的说明页), 索引页, 计数与上下页用. */
export const COMPONENTS: readonly CatalogEntry[] = CATALOG.filter((entry) => entry.layer !== START_LAYER);

/** 左栏与索引页的层页签: 一个图标一层. */
export const LAYER_TABS = [
  { id: "all", label: "全部", icon: ICON.all },
  { id: "surface", label: "Surface", icon: ICON.effect },
  { id: "kits", label: "Kits", icon: ICON.block },
  { id: "controls", label: "Controls", icon: ICON.component },
  { id: "base", label: "基础组件", icon: ICON.doc },
] as const;

export type LayerTabId = (typeof LAYER_TABS)[number]["id"];

export function inTab(tab: LayerTabId, entry: { readonly layer: string }): boolean {
  return tab === "all" || entry.layer === tab;
}

export function tabOf(layer: string): (typeof LAYER_TABS)[number] {
  return LAYER_TABS.find((tab) => tab.id === layer) ?? LAYER_TABS[0];
}

export function findEntry(id: string): CatalogEntry | undefined {
  return CATALOG.find((entry) => entry.id === id);
}

/** 外壳认得的路由 id: 有页的条目与组件索引页. */
export function isShellRoute(id: string): boolean {
  return id === INDEX_ID || CATALOG.some((entry) => entry.id === id);
}

/** 同组的其他页, 不够时用同层补齐; 组件页底部 "相关组件" 用. */
export function relatedOf(entry: CatalogEntry, count: number): CatalogEntry[] {
  const same = COMPONENTS.filter((item) => item.id !== entry.id && item.groupId === entry.groupId);
  const near = COMPONENTS.filter((item) => item.id !== entry.id && item.groupId !== entry.groupId && item.layer === entry.layer);
  return [...same, ...near].slice(0, count);
}
