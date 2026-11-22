/**
 * L3 成品可拷走检查: 每套 sites/<id>/ 只能依赖
 *   - npm 包
 *   - "@/..." (L1 控件 / L2 交互)
 *   - "@sites/_blocks/..." 与 "@sites/_shared/..."
 *   - 自己目录里的相对路径
 * 并且目录里必须有 art.css, prompt.md, cover.png 与 page.tsx.
 * sites/status.json 里标 done 的必须全部通过; wip 只报告, 不让命令失败.
 * 用法: node --experimental-strip-types scripts/check-sites.ts [id...]
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve, relative, dirname } from "node:path";

const ROOT = resolve(import.meta.dirname, "..", "sites");
const REQUIRED = ["page.tsx", "art.css", "prompt.md", "cover.png"];
const IMPORT = /(?:import|export)\s[^"']*?from\s*["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)|import\s+["']([^"']+)["']/g;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const ids = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync(ROOT).filter((d) => !d.startsWith("_") && statSync(join(ROOT, d)).isDirectory());
const status: Record<string, string> = JSON.parse(readFileSync(join(ROOT, "status.json"), "utf8"));
let failed = 0;
for (const id of ids) {
  const dir = join(ROOT, id);
  const problems: string[] = [];
  for (const f of REQUIRED) if (!existsSync(join(dir, f))) problems.push(`缺少 ${f}`);
  for (const file of walk(dir).filter((f) => /\.(tsx?|css)$/.test(f))) {
    const src = readFileSync(file, "utf8");
    for (const m of src.matchAll(IMPORT)) {
      const spec = m[1] ?? m[2] ?? m[3];
      const ok =
        spec.startsWith("@/") ||
        spec.startsWith("@sites/_blocks/") ||
        spec.startsWith("@sites/_shared/") ||
        (spec.startsWith(".") && !relative(dir, resolve(dirname(file), spec)).startsWith("..")) ||
        (!spec.startsWith(".") && !spec.startsWith("@site/") && !spec.startsWith("@sites/"));
      if (!ok) problems.push(`${relative(ROOT, file)}: 不允许的依赖 "${spec}"`);
    }
  }
  const done = status[id] === "done";
  if (problems.length) {
    if (done) failed++;
    console.log(`${done ? "✗" : "…"} ${id}${done ? "" : " (wip)"}`);
    for (const p of problems) console.log(`  - ${p}`);
  } else console.log(`✓ ${id}${done ? "" : " (wip, 可以标 done 了)"}`);
}
process.exit(failed ? 1 : 0);
