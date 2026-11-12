import { TEXT_MOTION_SPECS } from "./base/text-motion";
import { BACKGROUND_SPECS } from "./base/background";
import { EFFECT_SPECS } from "./base/effect";
import { ACTIONS_SPECS } from "./base/actions";
import { FORM_SPECS } from "./base/form";
import { OVERLAY_SPECS } from "./base/overlay";
import { LAYOUT_SPECS } from "./base/layout";
import { BLOCKS_SPECS } from "./base/blocks";
import { TEMPLATES_SPECS } from "./base/templates";
import { PRESS_SPECS } from "./controls/press";
import { RANGE_SPECS } from "./controls/range";
import { COMPOSE_SPECS } from "./controls/compose";
import { CHOICE_SPECS } from "./controls/choice";
import type { PageSpec } from "./types";

/**
 * 全部组件页定义, 按 id 挂到目录条目上; 名称, 说明与分组以目录 (catalog.gen.json) 为准.
 * 文件布局: specs/<层>/<组>/<id>.tsx 一页一个文件, 每组 index.ts 汇总 (controls 层的共用工具在 controls/shared.ts); types.ts, usage-code.ts, groups.ts, block-stage.tsx 是各页共用的.
 */
export const PAGE_SPECS: readonly PageSpec[] = [...TEXT_MOTION_SPECS, ...BACKGROUND_SPECS, ...EFFECT_SPECS, ...ACTIONS_SPECS, ...FORM_SPECS, ...OVERLAY_SPECS, ...LAYOUT_SPECS, ...BLOCKS_SPECS, ...TEMPLATES_SPECS, ...PRESS_SPECS, ...RANGE_SPECS, ...COMPOSE_SPECS, ...CHOICE_SPECS];
