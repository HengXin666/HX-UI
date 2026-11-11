/**
 * 文档站目录: 对表 src 的组件导出 (根入口与 package.json 各子路径) 与目录源 docs/face/docs/catalog/catalog.src.json,
 * 组件页定义 docs/face/docs/specs. 口径见 scripts/docs-catalog/coverage.ts.
 * 用法: node scripts/docs-catalog.ts --report 打印四个数, 按层分列, 并列出没页, 页指向不存在导出, 一件两处的明细;
 *       加 --json 改为输出 JSON.
 */
import path from "node:path";
import { counts, coverage } from "./docs-catalog/coverage.ts";
import { readPieces, type Layer } from "./docs-catalog/exports.ts";
import { flatPages, readManifest } from "./docs-catalog/manifest.ts";
import { readSpecs } from "./docs-catalog/specs.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const JSON_OUT = process.argv.includes("--json");
const LAYERS: readonly Layer[] = ["surface", "kits", "controls", "base"];

const pieces = readPieces(ROOT);
const pages = flatPages(readManifest(ROOT));
const specs = readSpecs(ROOT);
const result = coverage(pages, specs, pieces, new Set());
const total = counts(result);

if (JSON_OUT) {
  console.log(
    JSON.stringify(
      {
        counts: total,
        byLayer: Object.fromEntries(LAYERS.map((layer) => [layer, { withPage: result.covered.filter((p) => p.layer === layer).length, withoutPage: result.uncovered.filter((p) => p.layer === layer).length }])),
        withoutPage: result.uncovered.map((p) => ({ name: p.name, layer: p.layer, file: p.file })),
        dangling: Object.fromEntries(result.dangling),
        doubled: [...result.doubled].map(([piece, ids]) => ({ name: piece.name, file: piece.file, pages: ids })),
      },
      null,
      1,
    ),
  );
} else {
  console.log(`docs-catalog: ${pieces.length} 件 (${pieces.reduce((sum, p) => sum + p.members.length, 0)} 个组件导出), 目录 ${pages.length} 页, 组件页定义 ${specs.length} 个`);
  console.log(`有页 ${total.withPage} / 没页 ${total.withoutPage} / 页指向不存在导出 ${total.dangling} / 一件两处 ${total.doubled}`);
  for (const layer of LAYERS) {
    const has = result.covered.filter((p) => p.layer === layer).length;
    const not = result.uncovered.filter((p) => p.layer === layer).length;
    console.log(`  ${layer.padEnd(9)} 有页 ${has}  没页 ${not}`);
  }
  for (const [id, names] of result.dangling) console.log(`页指向不存在导出: ${id} -> ${names.length > 0 ? names.join(", ") : "(组件页没认领任何导出)"}`);
  for (const [piece, ids] of result.doubled) console.log(`一件两处: ${piece.name} (${piece.file}) <- ${ids.join(", ")}`);
}
