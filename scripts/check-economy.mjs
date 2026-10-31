#!/usr/bin/env node
/**
 * 安装图节约门禁, 并写出一份可复原的刻画产物.
 *
 * 守住的只有现在能机械判定的一件: package.json 的 sideEffects 必须是 CSS 列表.
 * 缺这个字段时, 打包器把入口当成有副作用, 摇树没有保证.
 * monaco / xyflow 仍在 dependencies 里, 这条门禁不假装它们已经被拆出去.
 *
 * 通过时写入 scripts/.hx_code_quality/characterization.json.
 * CI 把这份文件当成 artifact. 本地用 scripts/restore-characterization.mjs 核对摘要.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(ROOT, "scripts", ".hx_code_quality");
const OUT = path.join(OUT_DIR, "characterization.json");

function fail(message) {
  console.error(`check-economy: ${message}`);
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const sideEffects = pkg.sideEffects;
if (!Array.isArray(sideEffects) || sideEffects.length === 0) {
  fail("sideEffects 必须是非空数组. 不写这个字段, 打包器会假设入口有副作用.");
}
if (!sideEffects.every((item) => typeof item === "string" && item.endsWith(".css"))) {
  fail("sideEffects 只允许 CSS 通配. JS 模块要能被摇掉.");
}

const snapshot = path.join(ROOT, "scripts", "gates", "baselines", "api-surface.txt");
const apiText = fs.existsSync(snapshot) ? fs.readFileSync(snapshot, "utf8") : "";
const apiNames = apiText.split("\n").filter((line) => line && !line.startsWith("#") && !line.includes(" -> ")).length;
const starBarrels = apiText.split("\n").filter((line) => line.includes(" -> "));

const payload = {
  schema: "hx.characterization/1",
  subject: `${pkg.name}@${pkg.version}`,
  sideEffects,
  apiNames,
  starBarrels,
};
const canonical = JSON.stringify(payload);
payload.digest = createHash("sha256").update(canonical).digest("hex").slice(0, 16);

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n");

const restored = spawnSync(process.execPath, ["scripts/restore-characterization.mjs", OUT], {
  cwd: ROOT,
  encoding: "utf8",
});
if (restored.status !== 0) {
  fail(`产物写完但复原核对失败\n${restored.stdout ?? ""}${restored.stderr ?? ""}`);
}

console.log(`check-economy: 通过 (sideEffects=${sideEffects.join(",")}, digest=${payload.digest})`);
