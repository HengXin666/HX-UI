/**
 * scripts/docs-props.ts 与 scripts/docs-props/ 共用的字面量: 布尔成员的文本, typeof 查询的读取方式, node_modules 路径段.
 */
import { NODE_MODULES, SLASH } from "./quality.ts";

export const TRUE_TEXT = "true";
export const FALSE_TEXT = "false";
export const BOOLEAN_TEXTS: readonly string[] = [TRUE_TEXT, FALSE_TEXT];
export const BOOLEAN_TYPE_TEXT = "boolean";

/** typeof X 读什么: 对象字面量的键, 对象字面量的值, 数组字面量的元素. */
export const QUERY_KEYS = "keys";
export const QUERY_VALUES = "values";
export const QUERY_ELEMENTS = "elements";
export type QueryMode = typeof QUERY_KEYS | typeof QUERY_VALUES | typeof QUERY_ELEMENTS;

/** ts 的文件名一律是正斜杠, 所以按 "/node_modules/" 切包名. */
export const NODE_MODULES_SEGMENT = SLASH + NODE_MODULES + SLASH;
export const PACKAGE_LOCK_FILE = "package-lock.json";
/** DOM 属性不收, @types/react 的版本不影响输出. */
export const DOM_TYPES_PACKAGE = "@types/react";
