/**
 * L2 交互体积预算: 每件交互自身代码 (共享依赖 react / motion / lucide / radix / 工具函数 除外)
 * 压缩 + gzip 后不得超过 meta.ts 里的 budgetKb.
 * 用法: node --experimental-strip-types scripts/check-budgets.ts
 */
import { readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { build } from "vite";
import react from "@vitejs/plugin-react";

const NEXT = resolve(import.meta.dirname, "..");
const DIR = join(NEXT, "src/interactions");
const SHARED = ["react", "react-dom", "motion", "clsx", "tailwind-merge", "lucide-react", "radix-ui"];
let failed = 0;
for (const id of readdirSync(DIR).filter((d) => statSync(join(DIR, d)).isDirectory())) {
  const { meta } = await import(join(DIR, id, "meta.ts"));
  const res = await build({
    configFile: false,
    logLevel: "error",
    plugins: [react()],
    resolve: { alias: { "@": join(NEXT, "src") } },
    build: {
      write: false,
      minify: true,
      lib: { entry: join(DIR, id, "index.tsx"), formats: ["es"], fileName: "x" },
      rollupOptions: { external: (s: string) => SHARED.some((p) => s === p || s.startsWith(`${p}/`)) || s === "react/jsx-runtime" },
    },
  });
  const outputs = (Array.isArray(res) ? res : [res]).flatMap((r) => ("output" in r ? r.output : []));
  const code = outputs.filter((o) => o.type === "chunk").map((o) => ("code" in o ? o.code : "")).join("");
  const kb = gzipSync(code, { level: 9 }).length / 1024;
  const ok = kb <= meta.budgetKb;
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${id.padEnd(18)} ${kb.toFixed(2)} KB / ${meta.budgetKb} KB`);
}
process.exit(failed ? 1 : 0);
