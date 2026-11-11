import { BACKGROUND_SPECS } from "./background";
import { BLOCK_PAGES } from "./blocks";
import { CORE_PAGES } from "./core";
import { EFFECT_SPECS } from "./effect";
import { TEXT_SPECS } from "./text";
import type { PageSpec } from "./types";

/** 全部组件页定义, 按 id 挂到目录条目上; 名称, 说明与分组以目录 (catalog.gen.json) 为准. */
export const PAGE_SPECS: readonly PageSpec[] = [...TEXT_SPECS, ...BACKGROUND_SPECS, ...EFFECT_SPECS, ...CORE_PAGES, ...BLOCK_PAGES];
