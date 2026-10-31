#!/usr/bin/env node
/**
 * 复原核对: 读一份 characterization.json, 用除 digest 以外的字段重算摘要.
 * 对得上就说明这份产物没有被改过, 不需要重新跑浏览器.
 *
 *   node scripts/restore-characterization.mjs scripts/.hx_code_quality/characterization.json
 */
import { createHash } from "node:crypto";
import fs from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("用法: node scripts/restore-characterization.mjs <characterization.json>");
  process.exit(2);
}

let parsed;
try {
  parsed = JSON.parse(fs.readFileSync(file, "utf8"));
} catch (err) {
  console.error(`restore-characterization: 读不到产物 (${err.message})`);
  process.exit(1);
}

if (parsed.schema !== "hx.characterization/1" || typeof parsed.digest !== "string") {
  console.error("restore-characterization: 不是 hx.characterization/1");
  process.exit(1);
}

const { digest, ...rest } = parsed;
const again = createHash("sha256").update(JSON.stringify(rest)).digest("hex").slice(0, 16);
if (again !== digest) {
  console.error(`restore-characterization: 摘要对不上 (文件 ${digest}, 重算 ${again})`);
  process.exit(1);
}

console.log(`restore-characterization: 复原通过 ${parsed.subject} ${digest}`);
