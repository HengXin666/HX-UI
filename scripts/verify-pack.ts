/**
 * 发布产物自检: 打包 -> 装进临时目录 -> 逐个 exports 入口解析.
 *
 * 缺扩展名, exports 指向未打包目录这类问题在 tsc 与门禁里都是绿的, 只有真装一遍才暴露.
 * 决策与取舍见 release-tarball-packaging 决策记录 (锚点在 scripts/build-lib.ts).
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DOT, NODE_MODULES, UTF8 } from "./constants/quality.ts";

const ROOT = process.cwd();
const CSS_ENTRIES = ["styles.css", "tokens.css", "motion.css", "spin-variants.css", "native-select.css"];
const manifest = JSON.parse(readFileSync(join(ROOT, "package.json"), UTF8)) as {
  name: string;
  exports: Record<string, unknown>;
};

function run(cwd: string, args: string[]): string {
  return execFileSync("npm", args, { cwd, encoding: UTF8, stdio: ["ignore", "pipe", "pipe"] });
}

/** --ignore-scripts: 否则 prepare 会在 pack 时构建一遍, 它的日志会污染 --json 输出. */
const packJson = JSON.parse(run(ROOT, ["pack", "--json", "--ignore-scripts"])) as { filename: string }[];
const tarball = join(ROOT, packJson[0].filename);
const work = mkdtempSync(join(tmpdir(), "hx-ui-pack-"));
run(work, ["init", "-y"]);
/**
 * react / react-dom 是 peerDependency: 不在装包里, 但缺了连 import 都过不去,
 * 所以自检时显式装上, 模拟真实宿主而不是空工程.
 */
run(work, ["install", tarball, "react@19", "react-dom@19", "--ignore-scripts", "--no-audit", "--no-fund"]);

const specs = [
  manifest.name,
  ...Object.keys(manifest.exports)
    .filter((key) => key !== DOT && !key.includes("*"))
    .map((key) => manifest.name + key.slice(1)),
];
/**
 * 通配导出没法整条解析, 用 tarball 里真实存在的样本代替:
 * `./src/*` 取 src/index.ts, 验证这条映射确实指到了打包进去的源码目录.
 */
const wildcardSpecs = Object.keys(manifest.exports)
  .filter((key) => key.includes("*"))
  .map((key) => manifest.name + key.slice(1).replace("*", "index.ts"));
const allSpecs = [...specs, ...wildcardSpecs];

/** 在临时工程里跑一段解析脚本: 只有真的装过包, import.meta.resolve 才有意义. */
const PROBE = [
  "import { existsSync } from 'node:fs';",
  "import { fileURLToPath } from 'node:url';",
  "const specs = JSON.parse(process.argv[1]);",
  "let bad = 0;",
  "for (const spec of specs) {",
  "  try {",
  "    const url = import.meta.resolve(spec);",
  // import.meta.resolve 只看 exports 映射, 不保证文件真在包里, 所以再查一次磁盘.
  "    if (!existsSync(fileURLToPath(url))) { bad += 1; process.stdout.write('FAIL ' + spec + ' missing-file\\n'); continue; }",
  // CSS 与 ./src/* 样本只校验文件落地: 前者是样式, 后者是 TS 源码 (node_modules 里不能类型剥离), 都不 import.
  "    if (!spec.endsWith('.css') && !spec.includes('/src/')) await import(url);",
  "    process.stdout.write(spec + ' -> ' + url + '\\n');",
  "  } catch (error) { bad += 1; process.stdout.write('FAIL ' + spec + ' ' + (error.code ?? error.message) + '\\n'); }",
  "}",
  "try { await import(specs[0]); } catch (error) { bad += 1; process.stdout.write('FAIL root-import ' + error.code + '\\n'); }",
  "process.exit(bad === 0 ? 0 : 1);",
].join("\n");

let report = "";
let failed = false;
try {
  report = execFileSync(process.execPath, ["--input-type=module", "-e", PROBE, JSON.stringify(allSpecs)], {
    cwd: work,
    encoding: UTF8,
  });
} catch (error) {
  const failure = error as { stdout?: string; stderr?: string };
  report = (failure.stdout ?? "") + (failure.stderr ?? "");
  failed = true;
}

const failures = report.split("\n").filter((line) => line.startsWith("FAIL ") || /Error/.test(line));
const installed = join(work, NODE_MODULES, manifest.name);
for (const css of CSS_ENTRIES) {
  if (!existsSync(join(installed, "dist", css))) {
    failures.push("缺少 CSS 入口: dist/" + css);
  }
}

if (failures.length > 0 || failed) {
  console.error("verify-pack: 失败 (" + failures.length + " 项)");
  for (const item of failures) {
    console.error("  " + item.trim());
  }
  process.exit(1);
}
console.log(report.trim());
console.log("verify-pack: 通过 (包根 + " + (allSpecs.length - 1) + " 个子入口 + " + CSS_ENTRIES.length + " 个 CSS 全部可解析)");
