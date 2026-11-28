/**
 * Blueprint editor bundle size: builds src/blueprint/ui/index.ts as a library (shared deps
 * react / motion / lucide / radix / utils external, like check-budgets.ts) and prints the
 * minified + gzip size of the entry chunk (what every <Blueprint> pays) and of each lazy chunk
 * (debug, variables panel, find), plus the agent tools entry.
 * Usage: node --experimental-strip-types scripts/bp-size.ts
 */
import { join, resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { build } from "vite";
import react from "@vitejs/plugin-react";

const NEXT = resolve(import.meta.dirname, "..");
const SHARED = ["react", "react-dom", "motion", "clsx", "tailwind-merge", "lucide-react", "radix-ui"];

async function measure(entry: string, label: string) {
  const res = await build({
    configFile: false,
    logLevel: "error",
    plugins: [react()],
    resolve: { alias: { "@": join(NEXT, "src") } },
    build: {
      write: false,
      minify: true,
      cssCodeSplit: false,
      lib: { entry: join(NEXT, entry), formats: ["es"], fileName: "x" },
      rollupOptions: { external: (s: string) => SHARED.some((p) => s === p || s.startsWith(`${p}/`)) || s === "react/jsx-runtime" || s.startsWith("@/lib/") || s.startsWith("@/components/") },
    },
  });
  const outputs = (Array.isArray(res) ? res : [res]).flatMap((r) => ("output" in r ? r.output : []));
  console.log(label);
  let total = 0;
  for (const o of outputs) {
    const code = o.type === "chunk" ? o.code : typeof o.source === "string" ? o.source : Buffer.from(o.source).toString();
    const gz = gzipSync(code, { level: 9 }).length / 1024;
    if (o.type === "chunk") total += gz;
    const kind = o.type === "chunk" ? (o.isEntry ? "entry" : o.isDynamicEntry ? "lazy " : "chunk") : "asset";
    console.log(`  ${kind}  ${o.fileName.padEnd(28)} ${(code.length / 1024).toFixed(1).padStart(6)} KB min  ${gz.toFixed(2).padStart(6)} KB gz`);
  }
  // what loads up front: the entry plus every chunk it imports statically, gzipped together
  const chunks = new Map(outputs.flatMap((o) => (o.type === "chunk" ? [[o.fileName, o] as const] : [])));
  const seen = new Set<string>();
  const walk = (f: string) => {
    if (seen.has(f)) return;
    seen.add(f);
    chunks.get(f)?.imports.forEach(walk);
  };
  for (const o of chunks.values()) if (o.isEntry) walk(o.fileName);
  const eager = [...seen].flatMap((f) => (chunks.has(f) ? [chunks.get(f)!.code] : [])).join("\n");
  console.log(`  eager (entry + static chunks) ${(eager.length / 1024).toFixed(1)} KB min  ${(gzipSync(eager, { level: 9 }).length / 1024).toFixed(2)} KB gz`);
  console.log(`  all JS ${total.toFixed(2)} KB gz (sum of chunks)`);
}

await measure("src/blueprint/ui/index.ts", "editor (@/blueprint/ui)");
await measure("src/blueprint/agent/index.ts", "agent tools (@/blueprint/agent)");
