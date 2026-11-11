/**
 * 文档覆盖对账: 组件导出 (根入口与 package.json 各子路径) x 目录源 catalog.src.json x 组件页定义, 口径见
 * scripts/docs-catalog/coverage.ts. 拦三件事: 页指向不存在导出, 一件两处 (同一导出被两页认领),
 * catalog.gen.json 与目录源不同步. 第四件 "导出没页" 默认只报数不拦 (组件页按批次补, 批 0 只做基础设施);
 * 加 --require-pages 时它也拦, 等组件批次把没页清零后把这个参数接进注册表.
 * 白名单 scripts/gates/frontend/docs-coverage-allow.json 只收确属非组件的导出, 每条写原因.
 *
 * 用法: node scripts/gates/frontend/check-docs-coverage.ts [--require-pages]; 扫描根: CHECK_UI_ROOT (默认仓库根)
 * 退出码: 0=通过 / 1=有违规 / 2=扫描根或输入坏了
 */
import path from "node:path";
import { counts } from "../../docs-catalog/coverage.ts";
import { GEN_FILE, genIsFresh, loadAll, type Loaded } from "../../docs-catalog/load.ts";
import { EXIT_TOOL, REPO_UP_FROM_GATE_SUBDIR } from "../../constants/gates.ts";

const ROOT = process.env.CHECK_UI_ROOT ? path.resolve(process.env.CHECK_UI_ROOT) : path.resolve(import.meta.dirname, REPO_UP_FROM_GATE_SUBDIR);
const REQUIRE_PAGES_FLAG = "--require-pages";
const KNOWN_FLAGS = [REQUIRE_PAGES_FLAG];
/** 违规明细最多列几条, 其余只给条数. */
const MAX_LISTED = 40;

const flags = process.argv.slice(2);
const unknown = flags.filter((flag) => !KNOWN_FLAGS.includes(flag));
if (unknown.length > 0) {
  console.error(`check-docs-coverage: 不认识的参数 ${unknown.join(" ")}`);
  process.exit(EXIT_TOOL);
}
const requirePages = flags.includes(REQUIRE_PAGES_FLAG);

let loaded: Loaded;
try {
  loaded = loadAll(ROOT);
} catch (error) {
  console.error(`check-docs-coverage: ${(error as Error).message} (扫描根 = ${ROOT})`);
  process.exit(EXIT_TOOL);
}

const { result } = loaded;
const total = counts(result);
const problems: string[] = [];
for (const [id, names] of result.dangling) problems.push(`页指向不存在导出: ${id} -> ${names.length > 0 ? names.join(", ") : "(组件页没认领任何导出)"}`);
for (const [piece, ids] of result.doubled) problems.push(`一件两处: ${piece.name} (${piece.file}) <- ${ids.join(", ")}`);
if (!genIsFresh(ROOT, loaded)) problems.push(`${GEN_FILE} 与目录源不一致, 跑 node scripts/docs-catalog.ts 重新生成`);
if (requirePages) for (const piece of result.uncovered) problems.push(`导出没页: ${piece.name} (${piece.file})`);

console.log(`check-docs-coverage: 有页 ${total.withPage} / 没页 ${total.withoutPage} / 页指向不存在导出 ${total.dangling} / 一件两处 ${total.doubled} (白名单 ${loaded.allowed.size} 条)`);
if (!requirePages && total.withoutPage > 0) console.log(`  没页 ${total.withoutPage} 件: 非阻塞, 待组件批次清零后加 ${REQUIRE_PAGES_FLAG} 启用`);
if (problems.length > 0) {
  for (const line of problems.slice(0, MAX_LISTED)) console.error(`  ${line}`);
  if (problems.length > MAX_LISTED) console.error(`  ... 另有 ${problems.length - MAX_LISTED} 条`);
  process.exit(1);
}
