/**
 * 构建 dist 并给相对导入补扩展名.
 *
 * Node 在 ESM 下不会补 "./x" 的 .js 后缀, tsc 的产物因此无法被 node 直接 import.
 * 这里在 tsc 之后统一改写相对说明符 (目录的补 /index.js), 再拷 CSS 与许可证.
 * 决策与取舍见 release-tarball-packaging 决策记录 (锚点在 rewrite 上方).
 */
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { LICENSE_FILE, SRC_DIR } from "./constants/pack.ts";
import { NODE_MODULES, STDIO_INHERIT, UTF8 } from "./constants/quality.ts";

const ROOT = process.cwd();
const DIST = join(ROOT, "dist");
const SRC = join(ROOT, SRC_DIR);
const CSS_FILES = ["tokens.css", "styles.css", "motion.css", "spin-variants.css", "native-select.css"];
const EXTRA_FILES = [LICENSE_FILE, "NOTICE"];
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
    const before = readFileSync(file, UTF8);
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

/** 复用旧 dist 会把已删除或已改名的模块继续打进 tarball, 所以每次构建前先清空输出目录. */
rmSync(DIST, { recursive: true, force: true });
execFileSync(process.execPath, [join(ROOT, NODE_MODULES, "typescript", "bin", "tsc"), "-p", "tsconfig.build.json"], {
  stdio: STDIO_INHERIT,
});
for (const name of CSS_FILES) {
  cpSync(join(SRC, name), join(DIST, name));
}
for (const name of EXTRA_FILES) {
  cpSync(join(ROOT, name), join(DIST, name));
}
const rewritten = rewrite();
console.log("build-lib: dist 就绪 (" + relative(ROOT, DIST) + "), 改写说明符 " + rewritten + " 个文件");
