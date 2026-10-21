/**
 * 发布产物自检: 把当前工作区打成 tarball, 装进临时目录, 逐个入口验证.
 *
 * ## 为什么必须真装一遍
 *
 * dist 里缺扩展名, exports 指向没被打包的 src, 这两种错误都不会让 tsc 或门禁变红:
 * 它们只在别人真的把它当包用的时候才炸, 而官方发布路径 (GitHub Release) 没有 registry
 * 的安装反馈. 所以发布前在 CI 里装一遍, 比事后看 issue 便宜得多.
 *
 * 判据:
 *   1. node 能 import 包根 (验证 dist 的相对导入都带了扩展名)
 *   2. exports 里每个子入口都能被 import.meta.resolve 解析到 tarball 内的真实文件
 *   3. CSS 入口文件存在
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = process.cwd();
const CSS_ENTRIES = ["styles.css", "tokens.css", "motion.css", "spin-variants.css", "native-select.css"];
const manifest = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
  name: string;
  exports: Record<string, unknown>;
};

function run(cwd: string, args: string[]): string {
  return execFileSync("npm", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
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
  ...Object.keys(manifest.exports).filter((key) => key !== ".").map((key) => manifest.name + key.slice(1)),
];

/** 在临时工程里跑一段解析脚本: 只有真的装过包, import.meta.resolve 才有意义. */
const PROBE = "const specs = JSON.parse(process.argv[1]);\nlet bad = 0;\nfor (const spec of specs) {\n  try { process.stdout.write(spec + ' -> ' + import.meta.resolve(spec) + '\\n'); }\n  catch (error) { bad += 1; process.stdout.write('FAIL ' + spec + ' ' + error.code + '\\n'); }\n}\ntry { await import(specs[0]); } catch (error) { bad += 1; process.stdout.write('FAIL root-import ' + error.code + '\\n'); }\nprocess.exit(bad === 0 ? 0 : 1);";

let report = "";
let failed = false;
try {
  report = execFileSync(process.execPath, ["--input-type=module", "-e", PROBE, JSON.stringify(specs)], {
    cwd: work,
    encoding: "utf8",
  });
} catch (error) {
  const failure = error as { stdout?: string; stderr?: string };
  report = (failure.stdout ?? "") + (failure.stderr ?? "");
  failed = true;
}

const failures = report.split("\n").filter((line) => line.startsWith("FAIL ") || /Error/.test(line));
const installed = join(work, "node_modules", manifest.name);
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
console.log("verify-pack: 通过 (包根 + " + (specs.length - 1) + " 个子入口 + " + CSS_ENTRIES.length + " 个 CSS 全部可解析)");
