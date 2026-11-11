/**
 * 组件页定义的静态扫描: docs/face/docs/specs 下递归所有 .ts / .tsx, 找每个带 importName 的对象,
 * 取同一缩进层的 id, kind, parts. 不执行文件 (它们引 React 与 ?raw), 只读文本.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export interface SpecInfo {
  readonly id: string;
  readonly importName: string;
  readonly parts: readonly string[];
  /** 省略时为 single. */
  readonly kind: string;
  /** 仓库相对路径. */
  readonly file: string;
}

export const SPECS_DIR = path.join("docs", "face", "docs", "specs");
const SPEC_FILE = /\.tsx?$/;
const QUOTED = /"(\w+)"/g;

export function specFiles(dir: string): string[] {
  const out: string[] = [];
  for (const item of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) out.push(...specFiles(full));
    else if (SPEC_FILE.test(item.name)) out.push(full);
  }
  return out;
}

/** 从 importName 那一行往上找同缩进的 id, 往下到对象收尾前找同缩进的 kind 与 parts. */
function readObject(lines: readonly string[], at: number, file: string): SpecInfo | undefined {
  const indent = lines[at].match(/^\s*/)?.[0] ?? "";
  const field = (name: string): RegExp => new RegExp(`^${indent}${name}: (.*)$`);
  const close = new RegExp(`^${indent.slice(2)}\\}`);
  let start = at;
  while (start > 0 && !close.test(lines[start - 1]) && !field("id").test(lines[start])) start -= 1;
  let end = at;
  while (end < lines.length - 1 && !close.test(lines[end + 1])) end += 1;
  const body = lines.slice(start, end + 1);
  const value = (name: string): string | undefined => body.map((line) => line.match(field(name))?.[1]).find((v) => v !== undefined);
  const id = value("id")?.match(/^"([^"]+)"/)?.[1];
  const importName = lines[at].match(/importName: "(\w+)"/)?.[1];
  if (!id || !importName) return undefined;
  const parts = [...(value("parts") ?? "").matchAll(QUOTED)].map((m) => m[1]);
  const kind = value("kind")?.match(/^"(\w+)"/)?.[1] ?? "single";
  return { id, importName, parts, kind, file };
}

export function readSpecs(root: string): SpecInfo[] {
  const out: SpecInfo[] = [];
  for (const full of specFiles(path.join(root, SPECS_DIR))) {
    const lines = readFileSync(full, "utf8").split("\n");
    const file = path.relative(root, full).split(path.sep).join("/");
    lines.forEach((line, index) => {
      if (!/^\s+importName: "/.test(line)) return;
      const spec = readObject(lines, index, file);
      if (!spec) throw new Error(`docs-catalog: ${file}:${index + 1} 的 importName 找不到同层的 id`);
      out.push(spec);
    });
  }
  return out;
}
