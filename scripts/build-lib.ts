/**
 * 构建库产物 (dist/) 并把相对导入补上扩展名.
 *
 * ## 为什么需要补扩展名
 *
 * 包是 type: module, Node 在 ESM 下不会替我们补全 "./primitives/button" 的 .js 后缀,
 * 也不会找目录下的 index.js. tsc 按 Bundler 分辨率产出的是无扩展名的相对导入, 于是
 * node -e "import('@hx/ui')" 直接报 ERR_MODULE_NOT_FOUND -- 打包工具会自动补, 所以这个
 * 缺口只在"直接用 Node 跑"与部分 SSR 场景暴露, 很容易漏测.
 *
 * 这里在 tsc 出完 .js 与 .d.ts 之后统一改写三类说明符:
 *   1. 指向目录的: "./chat" -> "./chat/index.js" (存在 index 时)
 *   2. 指向文件的: "./connect" -> "./connect.js"
 *   3. 已经带扩展名的原样保留
 *
 * 只改相对说明符: 裸包名由消费方解析, 动它没有意义而且会改错.
 */
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const DIST = join(ROOT, "dist");
const SRC = join(ROOT, "src");
const CSS_FILES = ["tokens.css", "styles.css", "motion.css", "spin-variants.css", "native-select.css"];
const EXTRA_FILES = ["LICENSE", "NOTICE"];
const SPECIFIER = /((?:from|import)\s*["'])(\.{1,2}\/[^"']+)(["'])/g;

/** 递归列出目录下的文件 (不跟随符号链接). */
function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

/** 把一个相对说明符解析成 dist 里真实存在的路径, 补上 /index.js 或 .js. */
function resolveSpecifier(spec: string, fromFile: string): string {
  if (/\.(?:js|json|css)$/.test(spec)) {
    return spec;
  }
  const dir = fromFile.slice(0, fromFile.length - (fromFile.split(/[\\/]/).pop() ?? "").length);
  const base = join(dir, spec);
  if (existsSync(base) && statSync(base).isDirectory()) {
    return existsSync(join(base, "index.js")) ? spec + "/index.js" : spec;
  }
  if (existsSync(base + ".js")) {
    return spec + ".js";
  }
  return spec;
}

/**
 * .agents/notes/implemented/architecture/2026-10-22-release-tarball-packaging.md
 */
function rewrite(): number {
  let changed = 0;
  for (const file of walk(DIST)) {
    if (!/\.(?:js|d\.ts)$/.test(file)) {
      continue;
    }
    const before = readFileSync(file, "utf8");
    const after = before.replace(SPECIFIER, (_all: string, head: string, spec: string, tail: string) => {
      return head + resolveSpecifier(spec, file) + tail;
    });
    if (after !== before) {
      writeFileSync(file, after);
      changed += 1;
    }
  }
  return changed;
}

execFileSync(process.execPath, [join(ROOT, "node_modules", "typescript", "bin", "tsc"), "-p", "tsconfig.build.json"], {
  stdio: "inherit",
});
for (const name of CSS_FILES) {
  cpSync(join(SRC, name), join(DIST, name));
}
for (const name of EXTRA_FILES) {
  cpSync(join(ROOT, name), join(DIST, name));
}
const rewritten = rewrite();
console.log("build-lib: dist 就绪 (" + relative(ROOT, DIST) + "), 改写说明符 " + rewritten + " 个文件");
