import { BLOCKS_HERO } from "./block-hero";
import { TEMPLATE_SETTINGS } from "./block-settings";
import type { PageSpec } from "./types";

/**
 * 样板批的两个整块页: 首屏区块 (block-hero.tsx) 与设置页模板 (block-settings.tsx).
 * 皮肤与密度的舞台包裹层在 block-stage.tsx, 区块只读语义令牌.
 * .agents/notes/implemented/feature/2026-11-08-docs-component-pages.md
 */

export const BLOCK_PAGES: readonly PageSpec[] = [BLOCKS_HERO, TEMPLATE_SETTINGS];
