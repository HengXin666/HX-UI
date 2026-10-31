#!/usr/bin/env node
/**
 * 公共符号变了, 版本号必须一起变.
 *
 * 快照哈希记在 scripts/gates/baselines/api-surface.version.
 * 哈希对不上时, --update 只有在 package.json 的 version 已经不同于记录里的版本时才接受.
 * 这样「改了导出但版本还停在原地」过不了门禁.
 *
 *   node scripts/check-api-version.mjs
 *   node scripts/check-api-version.mjs --update
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SNAPSHOT = path.join(ROOT, "scripts", "gates", "baselines", "api-surface.txt");
const RECORD = path.join(ROOT, "scripts", "gates", "baselines", "api-surface.version");
const UPDATE = process.argv.includes("--update");

function fail(message) {
  console.error(`check-api-version: ${message}`);
  process.exit(1);
}

const version = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).version;
if (!fs.existsSync(SNAPSHOT)) fail("没有 api-surface.txt");
const hash = createHash("sha256").update(fs.readFileSync(SNAPSHOT)).digest("hex").slice(0, 16);

if (UPDATE) {
  let previous = null;
  if (fs.existsSync(RECORD)) previous = JSON.parse(fs.readFileSync(RECORD, "utf8"));
  if (previous && previous.hash !== hash && previous.version === version) {
    fail(`符号变了但版本仍是 ${version}. 先改 package.json 的 version, 再 --update`);
  }
  fs.writeFileSync(RECORD, JSON.stringify({ version, hash }, null, 2) + "\n");
  console.log(`check-api-version: 已记下 ${version} ${hash}`);
  process.exit(0);
}

if (!fs.existsSync(RECORD)) fail("没有版本记录. 先跑 node scripts/check-api-version.mjs --update");
const saved = JSON.parse(fs.readFileSync(RECORD, "utf8"));
if (saved.version !== version) fail(`记录的版本是 ${saved.version}, package.json 是 ${version}. 跑 --update 承认`);
if (saved.hash !== hash) fail(`符号和 ${version} 的记录不一致. 先升版本, 再 --update`);
console.log(`check-api-version: 通过 (${version} ${hash})`);
