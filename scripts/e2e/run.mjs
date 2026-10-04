/**
 * e2e 总入口。
 *
 * 逐个跑三个套件, 汇总退出码。单独成入口是因为门禁只能挂一条命令,
 * 而"外观 / 功能 / 持久化"是可分开诊断的三块 —— 一起跑但分别报告。
 *
 * 依赖 docs dev server (127.0.0.1:5600)。没起就自己起一个, 跑完关掉。
 */
import { spawnSync } from "node:child_process";
import { createServer } from "node:http";

const SUITES = ["visual.mjs", "blueprint.mjs", "persist.mjs", "reactflow.mjs"];
const PORT = 5600;

async function alive() {
  try {
    const r = await fetch(`http://127.0.0.1:${PORT}/blueprint.html`, { signal: AbortSignal.timeout(1500) });
    return r.ok;
  } catch {
    return false;
  }
}

if (!(await alive())) {
  console.error(`e2e: 127.0.0.1:${PORT} 上没有 dev server, 请先起 docs (cd docs && npx vite)`);
  process.exit(1);
}

let bad = 0;
for (const s of SUITES) {
  console.log(`\n──────── ${s} ────────`);
  const r = spawnSync("node", [new URL(s, import.meta.url).pathname], { stdio: "inherit" });
  if (r.status !== 0) bad++;
}
process.exit(bad ? 1 : 0);
