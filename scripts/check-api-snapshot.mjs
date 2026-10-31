#!/usr/bin/env node
/**
 * 公共 API 快照.
 *
 * 从 src/index.ts 出发, 把具名再导出展开, 星号桶继续往下读, 得到排序后的符号表.
 * 和 scripts/gates/baselines/api-surface.txt 比对. 表面变了就必须带上新快照,
 * 这样「多导出一个名字」会在 diff 里被看见, 而不是埋在 export * 里面.
 *
 *   node scripts/check-api-snapshot.mjs
 *   node scripts/check-api-snapshot.mjs --update
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const ENTRY = path.join(ROOT, "src", "index.ts");
const SNAPSHOT = path.join(ROOT, "scripts", "gates", "baselines", "api-surface.txt");
const UPDATE = process.argv.includes("--update");

function strip(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function resolveModule(fromFile, spec) {
  const base = path.resolve(path.dirname(fromFile), spec);
  const candidates = [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts"), path.join(base, "index.tsx")];
  return candidates.find((file) => fs.existsSync(file) && fs.statSync(file).isFile()) ?? null;
}

function braceNames(body) {
  return body
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.split(/\s+as\s+/).pop().replace(/^type\s+/, "").trim())
    .filter((name) => /^[A-Za-z_]/.test(name));
}

function collect(file, seen, names, stars) {
  const rel = path.relative(ROOT, file);
  if (seen.has(rel)) return;
  seen.add(rel);
  const text = strip(fs.readFileSync(file, "utf8"));
  for (const match of text.matchAll(/export\s+\*\s+from\s+"(\.[^"]+)"/g)) {
    stars.push(`${rel} -> ${match[1]}`);
    const target = resolveModule(file, match[1]);
    if (target) collect(target, seen, names, stars);
  }
  for (const match of text.matchAll(/export\s+(?:type\s+)?\{([^}]+)\}/g)) {
    for (const name of braceNames(match[1])) names.add(name);
  }
  for (const match of text.matchAll(/export\s+(?:async\s+)?(?:function|const|class|type|interface|enum)\s+([A-Za-z0-9_]+)/g)) {
    names.add(match[1]);
  }
}

const names = new Set();
const stars = [];
collect(ENTRY, new Set(), names, stars);
const body = [
  "# 具名符号. 星号桶已展开, 下面的 STAR 行只标记桶还在.",
  ...[...names].sort(),
  "# STAR",
  ...[...new Set(stars)].sort(),
].join("\n") + "\n";

if (UPDATE) {
  fs.mkdirSync(path.dirname(SNAPSHOT), { recursive: true });
  fs.writeFileSync(SNAPSHOT, body);
  console.log(`check-api-snapshot: 已写入 ${path.relative(ROOT, SNAPSHOT)} (${names.size} 个符号)`);
  process.exit(0);
}

if (!fs.existsSync(SNAPSHOT)) {
  console.error("check-api-snapshot: 没有快照. 先跑 node scripts/check-api-snapshot.mjs --update");
  process.exit(1);
}

const saved = fs.readFileSync(SNAPSHOT, "utf8");
if (saved !== body) {
  console.error("check-api-snapshot: 公共符号和快照不一致.");
  console.error("  这是接口变化. 看过 diff 之后再运行:");
  console.error("  node scripts/check-api-snapshot.mjs --update");
  process.exit(1);
}

console.log(`check-api-snapshot: 通过 (${names.size} 个符号, ${new Set(stars).size} 个星号桶)`);
