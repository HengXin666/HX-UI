import { DOCS, GROUPS, type DocEntry } from "../../src/nav";
import { BACKGROUND_SPECS } from "./specs/background";
import { BLOCK_PAGES } from "./specs/blocks";
import { CORE_PAGES } from "./specs/core";
import { EFFECT_SPECS } from "./specs/effect";
import { SPEC_GROUP } from "./specs/groups";
import { TEXT_SPECS } from "./specs/text";
import type { ComponentSpec, PageSpec } from "./specs/types";
import { ICON, INDEX_ID } from "./constants";

/** 所有可调组件页 (有 Customize 与 Props 定义). */
export const SPECS: readonly ComponentSpec[] = [...TEXT_SPECS, ...BACKGROUND_SPECS, ...EFFECT_SPECS];

/** 左栏与索引页的一项: 可调组件页或原有文档页. 原有文档页没有 spec, 走通用回退. */
export interface CatalogEntry extends DocEntry {
  readonly spec?: ComponentSpec;
}

/** 挂在原有导航条目上的组件页 (样板批: 按钮, 开关, 对话框, 数据表, 首屏区块, 设置页模板), 按 id 找. */
const PAGE_SPECS: ReadonlyMap<string, PageSpec> = new Map([...CORE_PAGES, ...BLOCK_PAGES].map((spec) => [spec.id, spec]));

const START = GROUPS[0];
const fromSpec = (spec: ComponentSpec): CatalogEntry => ({ id: spec.id, label: spec.label, group: spec.group, desc: spec.desc, spec });

/** 原有条目有组件页定义时换成组件页, 名称, 说明, 分组仍取导航; 没有的继续走通用回退. */
function withPage(entry: DocEntry): CatalogEntry {
  const page = PAGE_SPECS.get(entry.id);
  return page ? { ...entry, spec: { ...page, label: entry.label, desc: entry.desc, group: entry.group } } : entry;
}

/** 上手组在最前, 可调组件页紧随其后, 再是原有分组, 与侧栏阅读顺序一致. */
export const CATALOG: readonly CatalogEntry[] = [
  ...DOCS.filter((entry) => entry.group === START),
  ...SPECS.map(fromSpec),
  ...DOCS.filter((entry) => entry.group !== START).map(withPage),
];

export const CATALOG_GROUPS: readonly string[] = [START, ...Object.values(SPEC_GROUP), ...GROUPS.slice(1)];

/** 组件 (不含上手的说明页) 的条目, 索引页与 "N 个组件" 计数用. */
export const COMPONENTS: readonly CatalogEntry[] = CATALOG.filter((entry) => entry.group !== START);

const BLOCK_GROUPS = new Set(["区块", "模板", "页面版式", "蓝图"]);
const TEXT_GROUPS = new Set<string>([SPEC_GROUP.text, "排版"]);
const EFFECT_GROUPS = new Set<string>([SPEC_GROUP.effect, "动效与质感"]);

/** 左栏分类页签: 一个图标一类, 对标 reactbits 左栏那排图标. */
export const CATEGORIES = [
  { id: "all", label: "全部", icon: ICON.all, match: (): boolean => true },
  { id: "text", label: "文字", icon: ICON.text, match: (group: string): boolean => TEXT_GROUPS.has(group) },
  { id: "background", label: "背景", icon: ICON.background, match: (group: string): boolean => group === SPEC_GROUP.background },
  { id: "effect", label: "效果", icon: ICON.effect, match: (group: string): boolean => EFFECT_GROUPS.has(group) },
  {
    id: "component",
    label: "组件",
    icon: ICON.component,
    match: (group: string): boolean => group !== START && !BLOCK_GROUPS.has(group) && !TEXT_GROUPS.has(group) && !EFFECT_GROUPS.has(group) && group !== SPEC_GROUP.background,
  },
  { id: "block", label: "区块与模板", icon: ICON.block, match: (group: string): boolean => BLOCK_GROUPS.has(group) },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

/** 条目所在的分类 (第一个非 "全部" 的命中). */
export function categoryOf(group: string): (typeof CATEGORIES)[number] {
  return CATEGORIES.slice(1).find((category) => category.match(group)) ?? CATEGORIES[0];
}

export function findEntry(id: string): CatalogEntry | undefined {
  return CATALOG.find((entry) => entry.id === id);
}

/** 外壳认得的路由 id: 目录里的条目与组件索引页. */
export function isShellRoute(id: string): boolean {
  return id === INDEX_ID || CATALOG.some((entry) => entry.id === id);
}

/** 同组的其他条目, 不够时用同分类补齐; 组件页底部 "相关组件" 用. */
export function relatedOf(entry: CatalogEntry, count: number): CatalogEntry[] {
  const category = categoryOf(entry.group);
  const same = COMPONENTS.filter((item) => item.id !== entry.id && item.group === entry.group);
  const near = COMPONENTS.filter((item) => item.id !== entry.id && item.group !== entry.group && category.match(item.group));
  return [...same, ...near].slice(0, count);
}
