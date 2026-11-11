import pkg from "../../../package.json?raw";
import { SKIN_LIST } from "@hx/ui";
import { CATALOG, COMPONENTS, GROUPS } from "../docs/catalog";

/** 库版本, 从 package.json 原文读, 发版不用改首页. */
export const VERSION: string = (JSON.parse(pkg) as { version: string }).version;

/** 目录里区块与模板两组的 id. */
const BLOCKS_GROUP = "blocks";
const TEMPLATE_GROUP = "templates";

/**
 * 首页上出现的数字都从目录 (catalog.gen.json) 实算, 不手写; 组只数有页的.
 * docs 是写好文档页的组件 (目录 page: true, 不含上手说明与层总览), components 是目录里的组件总数 (含还没写页的);
 * 目录条目数含上手说明与总览页, 不当页数用.
 */
export const FACTS = {
  docs: COMPONENTS.filter((entry) => entry.page).length,
  components: COMPONENTS.length,
  groups: GROUPS.filter((group) => CATALOG.some((entry) => entry.groupId === group.id)).length,
  blocks: CATALOG.filter((entry) => entry.groupId === BLOCKS_GROUP).length,
  templates: CATALOG.filter((entry) => entry.groupId === TEMPLATE_GROUP).length,
  skins: SKIN_LIST.length,
} as const;
