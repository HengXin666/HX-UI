#!/usr/bin/env node
/**
 * 图标名校验。
 *
 * 为什么需要它: Iconify 的类串是**字符串**, Tailwind 与 TS 都管不到它。
 * 写错一个名字不会报错, 只会让那个位置空着 —— 而且只有在构建日志的角落留一行
 * "Cannot find ..." 提醒。这个脚本把它变成会失败的门禁。
 *
 * 用法: node scripts/check-icons.mjs     退出码 1 表示有无效名字。
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SCAN = ["src", "../src"];
const SETS = { solar: "@iconify-json/solar", mdi: "@iconify-json/mdi" };

/** 载入各图标集的名字集合。 */
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
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const full = path.join(abs, e.name);
    if (e.isDirectory()) walk(path.relative(ROOT, full));
    else if (/\.(ts|tsx|css)$/.test(e.name)) {
      const text = fs.readFileSync(full, "utf8");
      for (const m of text.matchAll(/icon-\[([a-z0-9-]+)--([a-z0-9-]+)\]/g)) {
        found.push({ prefix: m[1], name: m[2], file: path.relative(ROOT, full) });
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
