/**
 * 文档站目录: 对表 src 的组件导出 (根入口与 package.json 各子路径) 与目录源 docs/face/docs/catalog/catalog.src.json,
 * 组件页定义 docs/face/docs/specs, 生成 docs/face/docs/catalog/catalog.gen.json (导航, 搜索, 计数, 上下页, 总览只读它).
 * 口径见 scripts/docs-catalog/coverage.ts, 生成规则见 scripts/docs-catalog/build.ts; 门禁见 scripts/gates/frontend/check-docs-coverage.ts.
 * 用法: node scripts/docs-catalog.ts          写 catalog.gen.json
 *       node scripts/docs-catalog.ts --check  与入库的 catalog.gen.json 比对, 不一致即失败
 *       node scripts/docs-catalog.ts --report 打印四个数与明细 (加 --json 输出 JSON)
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { counts, type Coverage } from "./docs-catalog/coverage.ts";
import type { Layer, Piece } from "./docs-catalog/exports.ts";
import { GEN_FILE, genIsFresh, loadAll } from "./docs-catalog/load.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const LAYERS: readonly Layer[] = ["surface", "kits", "controls", "base"];
const argv = process.argv.slice(2);
const loaded = loadAll(ROOT);
const { pieces, pages, specs } = loaded;

function byLayer(list: readonly Piece[], layer: Layer): number {
  return list.filter((piece) => piece.layer === layer).length;
}

function report(res: Coverage): void {
  const total = counts(res);
  if (argv.includes("--json")) {
    const layers = Object.fromEntries(LAYERS.map((layer) => [layer, { withPage: byLayer(res.covered, layer), withoutPage: byLayer(res.uncovered, layer) }]));
    const withoutPage = res.uncovered.map((piece) => ({ name: piece.name, layer: piece.layer, file: piece.file }));
    const doubled = [...res.doubled].map(([piece, ids]) => ({ name: piece.name, file: piece.file, pages: ids }));
    console.log(JSON.stringify({ counts: total, byLayer: layers, withoutPage, dangling: Object.fromEntries(res.dangling), doubled }, null, 1));
    return;
  }
  console.log(`docs-catalog: ${pieces.length} 件 (${pieces.reduce((sum, p) => sum + p.members.length, 0)} 个组件导出), 目录 ${pages.length} 页, 组件页定义 ${specs.length} 个`);
  console.log(`有页 ${total.withPage} / 没页 ${total.withoutPage} / 页指向不存在导出 ${total.dangling} / 一件两处 ${total.doubled}`);
  for (const layer of LAYERS) console.log(`  ${layer.padEnd(9)} 有页 ${byLayer(res.covered, layer)}  没页 ${byLayer(res.uncovered, layer)}`);
  for (const [id, names] of res.dangling) console.log(`页指向不存在导出: ${id} -> ${names.length > 0 ? names.join(", ") : "(组件页没认领任何导出)"}`);
  for (const [piece, ids] of res.doubled) console.log(`一件两处: ${piece.name} (${piece.file}) <- ${ids.join(", ")}`);
}

if (argv.includes("--report")) {
  report(loaded.result);
} else if (argv.includes("--check")) {
  if (!genIsFresh(ROOT, loaded)) {
    console.error("docs-catalog: catalog.gen.json 与目录源不一致, 跑 node scripts/docs-catalog.ts 重新生成");
    process.exit(1);
  }
  console.log("docs-catalog: catalog.gen.json 与目录源一致");
} else {
  writeFileSync(path.join(ROOT, GEN_FILE), loaded.genText);
  console.log(`docs-catalog: 写入 ${GEN_FILE}`);
}
