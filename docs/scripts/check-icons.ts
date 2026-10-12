/**
 * 图标名校验: Iconify 类串是字符串, Tailwind 与 TS 都管不到, 写错只会让位置空着
 * 扫描 docs/src 与 ../src 中的 icon-[<set>--<name>], 对照已安装图标集的名字
 * 扫描根: CHECK_UI_ROOT 指向仓库根 (默认按脚本位置推断), 负向探针靠它把夹具指到临时目录
 * 用法: node scripts/check-icons.ts, 退出码 1 表示有无效名字
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.env.CHECK_UI_ROOT
  ? path.join(path.resolve(process.env.CHECK_UI_ROOT), "docs")
  : path.resolve(import.meta.dirname, "..");
const SCAN = ["src", "../src"];
const SETS = { solar: "@iconify-json/solar", mdi: "@iconify-json/mdi" };

/** 载入各图标集的名字集合 */
const names = {};
for (const [prefix, pkg] of Object.entries(SETS)) {
  try {
    const json = JSON.parse(fs.readFileSync(path.join(ROOT, "node_modules", pkg, "icons.json"), "utf8"));
    names[prefix] = new Set(Object.keys(json.icons ?? {}));
  } catch {
    names[prefix] = null;
  }
}

const found = [];
function walk(dir) {
  const abs = path.resolve(ROOT, dir);
  if (!fs.existsSync(abs)) return;
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    if (e.name === "node_modules" || /^\./.test(e.name)) continue;
    const full = path.join(abs, e.name);
    if (e.isDirectory()) walk(path.relative(ROOT, full));
    else if (/\.(ts|tsx|css)$/.test(e.name)) {
      const text = fs.readFileSync(full, "utf8");
      for (const m of text.matchAll(/icon-\[(?<prefix>[a-z0-9-]+)--(?<name>[a-z0-9-]+)\]/g)) {
        found.push({ prefix: m.groups.prefix, name: m.groups.name, file: path.relative(ROOT, full) });
      }
    }
  }
}
for (const d of SCAN) walk(d);

const bad = [];
for (const f of found) {
  const set = names[f.prefix];
  if (!set) continue;                       // 该图标集没装, 跳过
  if (!set.has(f.name)) bad.push(f);
}

const uniq = [...new Map(bad.map((b) => [b.prefix + "--" + b.name, b])).values()];
if (uniq.length) {
  console.error("无效图标名 (" + uniq.length + "):");
  for (const b of uniq) console.error("  icon-[" + b.prefix + "--" + b.name + "]  出现在 " + b.file);
  console.error("\n去 node_modules/@iconify-json/<set>/icons.json 里找真实名字。");
  process.exit(1);
}
console.log("icons: 通过 (" + found.length + " 处引用, 全部有效)");
