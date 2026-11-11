import pkg from "../../../package.json?raw";
import { SKIN_LIST } from "@hx/ui";
import { CATALOG, GROUPS } from "../docs/catalog";

/** 库版本, 从 package.json 原文读, 发版不用改首页. */
export const VERSION: string = (JSON.parse(pkg) as { version: string }).version;

/** 目录里区块与模板两组的 id. */
const BLOCKS_GROUP = "blocks";
const TEMPLATE_GROUP = "templates";

/** 首页上出现的数字都从目录 (catalog.gen.json) 实算, 不手写; 组只数有页的. */
export const FACTS = {
  pages: CATALOG.length,
  groups: GROUPS.filter((group) => CATALOG.some((entry) => entry.groupId === group.id)).length,
  blocks: CATALOG.filter((entry) => entry.groupId === BLOCKS_GROUP).length,
  templates: CATALOG.filter((entry) => entry.groupId === TEMPLATE_GROUP).length,
  skins: SKIN_LIST.length,
} as const;
