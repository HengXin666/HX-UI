import type { PageSpec } from "./types";
import { DIALOG } from "./core-dialog";
import { BUTTON, SWITCH } from "./core-single";
import { DATA_TABLE } from "./core-table";

/**
 * 样板批的四个组件页: Button, Switch (可调单件), Dialog, DataTable (复合组件).
 * 名称, 说明与分组沿用导航条目; Props 的类型与默认值来自源码类型, 各页只补中文说明.
 * 每页一个文件, 用法代码的拼装工具在 usage-code.ts.
 * .agents/notes/implemented/feature/2026-11-08-docs-component-pages.md
 */

export const CORE_PAGES: readonly PageSpec[] = [BUTTON, SWITCH, DIALOG, DATA_TABLE];
