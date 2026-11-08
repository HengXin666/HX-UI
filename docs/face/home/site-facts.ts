import pkg from "../../../package.json?raw";
import { SKIN_LIST } from "@hx/ui";
import { DOCS, GROUPS, TEMPLATE_GROUP } from "../../src/nav";

/** 库版本, 从 package.json 原文读, 发版不用改首页. */
export const VERSION: string = (JSON.parse(pkg) as { version: string }).version;

const BLOCKS_GROUP = "区块";

/** 首页上出现的数字都从导航数据实算, 不手写. */
export const FACTS = {
  pages: DOCS.length,
  groups: GROUPS.length,
  blocks: DOCS.filter((entry) => entry.group === BLOCKS_GROUP).length,
  templates: DOCS.filter((entry) => entry.group === TEMPLATE_GROUP).length,
  skins: SKIN_LIST.length,
} as const;
