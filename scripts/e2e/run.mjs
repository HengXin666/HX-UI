/**
 * e2e 总入口。
 *
 * 逐个跑三个套件, 汇总退出码。单独成入口是因为门禁只能挂一条命令,
 * 而"外观 / 功能 / 持久化"是可分开诊断的三块 —— 一起跑但分别报告。
 *
 * 依赖 docs dev server (127.0.0.1:5600)。没起就自己起一个, 跑完关掉。
 */
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";

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

/**
 * 没有现成的 server 时用 vite preview 起已构建的 docs/dist (门禁声明了 requires=dist),
 * 跑完关掉; CI 的干净 runner 上不会有人提前起 dev server.
 */
let server = null;
if (!(await alive())) {
  const docs = path.resolve(import.meta.dirname, "..", "..", "docs");
  server = spawn("npx", ["vite", "preview", "--host", "127.0.0.1", "--port", String(PORT), "--strictPort"], {
    cwd: docs, stdio: "ignore", detached: true,
  });
  const deadline = Date.now() + 30000;
  while (!(await alive())) {
    if (Date.now() > deadline || server.exitCode !== null) {
      console.error(`e2e: 127.0.0.1:${PORT} 起不来 (先 npm --prefix docs run build 产出 docs/dist)`);
      stop();
      process.exit(1);
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
}

function stop() {
  if (server && server.exitCode === null) {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {
      server.kill("SIGTERM");
    }
  }
}

let bad = 0;
for (const s of SUITES) {
  console.log(`\n──────── ${s} ────────`);
  const r = spawnSync("node", [new URL(s, import.meta.url).pathname], { stdio: "inherit" });
  if (r.status !== 0) bad++;
}
stop();
process.exit(bad ? 1 : 0);
