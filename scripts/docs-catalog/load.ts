/**
 * 对表一次读全: 组件导出, 目录源, 组件页定义, 白名单, 对表结果与 catalog.gen.json 应有的文本.
 * scripts/docs-catalog.ts (生成与报告) 与 docs-coverage 门禁共用, 两边的四个数必然一致.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { buildCatalog } from "./build.ts";
import { claimedNames, coverage, type Coverage } from "./coverage.ts";
import { readPieces, type Piece } from "./exports.ts";
import { flatPages, readManifest, type FlatPage, type Manifest } from "./manifest.ts";
import { readSpecs, type SpecInfo } from "./specs.ts";

export const GEN_FILE = path.join("docs", "face", "docs", "catalog", "catalog.gen.json");
/** 不计入对表的导出: 只收确属非组件的导出, 每条写原因 (见文件里的 _why). */
export const ALLOW_FILE = path.join("scripts", "gates", "frontend", "docs-coverage-allow.json");

export interface Loaded {
  readonly pieces: readonly Piece[];
  readonly manifest: Manifest;
  readonly pages: readonly FlatPage[];
  readonly specs: readonly SpecInfo[];
  readonly allowed: ReadonlySet<string>;
  readonly result: Coverage;
  /** catalog.gen.json 应有的全文. */
  readonly genText: string;
}

/** 白名单: { "allow": { "导出名": ["原因"] } }; 没写原因的条目直接报错. */
export function readAllow(root: string): Set<string> {
  const file = path.join(root, ALLOW_FILE);
  if (!existsSync(file)) return new Set();
  const allow = (JSON.parse(readFileSync(file, "utf8")) as { allow?: Record<string, readonly string[]> }).allow ?? {};
  const bare = Object.entries(allow).filter(([, why]) => !Array.isArray(why) || why.join("").trim() === "");
  if (bare.length > 0) throw new Error(`docs-catalog: ${ALLOW_FILE} 里这些条目没写原因: ${bare.map(([name]) => name).join(", ")}`);
  return new Set(Object.keys(allow));
}

export function loadAll(root: string): Loaded {
  const pieces = readPieces(root);
  const manifest = readManifest(root);
  const pages = flatPages(manifest);
  const specs = readSpecs(root);
  const allowed = readAllow(root);
  const result = coverage(pages, specs, pieces, allowed);
  const genText = JSON.stringify(buildCatalog(manifest, pages, pieces, result, (page) => claimedNames(page, specs)), null, 1) + "\n";
  return { pieces, manifest, pages, specs, allowed, result, genText };
}

/** 入库的 catalog.gen.json 是否与目录源一致. */
export function genIsFresh(root: string, loaded: Loaded): boolean {
  const file = path.join(root, GEN_FILE);
  return existsSync(file) && readFileSync(file, "utf8") === loaded.genText;
}
