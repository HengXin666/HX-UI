/**
 * 舞台源码区的拼装: 把道具台当前的值写回成使用方会写的调用代码.
 * 只拼字符串, 不 eval; 短对象与原始值数组写成一行, 其余逐项缩进, 读起来接近手写.
 */

/** 一个属性的值. raw 表示原样写进花括号的表达式 (变量名, 箭头函数). */
export type AttrValue = string | number | boolean | { raw: string } | undefined;

const INDENT = "  ";
const LINE = "\n";
const SEP = ", ";
const INLINE_WIDTH = 72;
const IDENT = /^[A-Za-z_$][\w$]*$/;

function isPrimitive(value: unknown): boolean {
  return value === null || typeof value !== "object";
}

/** 对象或数组字面量. depth 是当前缩进层数. */
export function literal(value: unknown, depth = 0): string {
  if (isPrimitive(value)) return JSON.stringify(value);
  const pad = INDENT.repeat(depth + 1);
  const close = INDENT.repeat(depth);
  if (Array.isArray(value)) {
    if (value.every(isPrimitive)) return `[${value.map((item) => JSON.stringify(item)).join(SEP)}]`;
    return `[${LINE}${value.map((item) => pad + literal(item, depth + 1)).join(`,${LINE}`)},${LINE}${close}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).filter(([, item]) => item !== undefined);
  const key = (name: string): string => (IDENT.test(name) ? name : JSON.stringify(name));
  const inline = `{ ${entries.map(([name, item]) => `${key(name)}: ${literal(item, depth + 1)}`).join(SEP)} }`;
  if (!inline.includes(LINE) && inline.length <= INLINE_WIDTH) return inline;
  return `{${LINE}${entries.map(([name, item]) => `${pad}${key(name)}: ${literal(item, depth + 1)}`).join(`,${LINE}`)},${LINE}${close}}`;
}

function attr(name: string, value: AttrValue): string | undefined {
  if (value === undefined) return undefined;
  if (value === true) return name;
  if (typeof value === "string") return `${name}=${JSON.stringify(value)}`;
  if (typeof value === "object") return `${name}={${value.raw}}`;
  return `${name}={${String(value)}}`;
}

/** 一个自闭合的 JSX 调用. 属性多于两个时逐行写. */
export function jsx(name: string, attrs: Record<string, AttrValue>): string {
  const parts = Object.entries(attrs)
    .map(([key, value]) => attr(key, value))
    .filter((part): part is string => part !== undefined);
  if (parts.length <= 2) return `<${name}${parts.map((part) => ` ${part}`).join("")} />`;
  return [`<${name}`, ...parts.map((part) => INDENT + part), "/>"].join(LINE);
}

/** 变量引用, 写进花括号. */
export function ref(name: string): { raw: string } {
  return { raw: name };
}

export function importLine(from: string, names: readonly string[]): string {
  return `import { ${names.join(SEP)} } from "${from}";`;
}

export function constLine(name: string, value: unknown): string {
  return `const ${name} = ${literal(value)};`;
}

/** 受控值的 useState 一行, setter 名按 set + 首字母大写. */
export function stateLine(name: string, value: unknown): string {
  return `const [${name}, ${setter(name)}] = useState(${literal(value)});`;
}

export function setter(name: string): string {
  return `set${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}

/** 各段之间空一行. */
export function blocks(...parts: ReadonlyArray<string | false>): string {
  return parts.filter((part): part is string => Boolean(part)).join(LINE + LINE);
}

/** 可视化层的子路径入口. */
export const VIZ_ENTRY = "@hx/ui/viz";
/** 页面描述层的子路径入口. */
export const PAGE_ENTRY = "@hx/ui/page";
/** useState 的 import 行. */
export const REACT_STATE = `import { useState } from "react";`;
