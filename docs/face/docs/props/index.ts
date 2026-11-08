import data from "./props.gen.json";
import type { PropRow } from "../specs/types";

interface GeneratedRow {
  readonly name: string;
  readonly type: string;
  readonly default: string;
  readonly desc: string;
  readonly required: boolean;
}

const TABLE = data as Readonly<Record<string, readonly GeneratedRow[]>>;

/**
 * 导出名的属性行, 来自 scripts/docs-props.ts 从源码类型抽出的 props.gen.json; 没有该组件时返回 undefined.
 * .agents/notes/implemented/feature/2026-11-08-docs-component-pages.md
 */
export function generatedRows(name: string): PropRow[] | undefined {
  const rows = TABLE[name];
  return rows?.map((row) => ({ name: row.name, type: row.type, initial: row.default, desc: row.desc, required: row.required }));
}
