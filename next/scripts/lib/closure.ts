/**
 * 一套成品的本地依赖闭包: 从 sites/<id>/ 下的源码出发, 沿 "@/", "@sites/", 相对路径的 import 走到底.
 * build-registry (列文件) 和 build-site (给 Tailwind 精确的 @source) 共用.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

export const NEXT = resolve(import.meta.dirname, "..", "..");
export const SITES = join(NEXT, "sites");
const IMPORT = /(?:import|export)\s[^"']*?from\s*["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)|import\s+["']([^"']+)["']/g;
const EXT = ["", ".tsx", ".ts", ".css", "/index.tsx", "/index.ts"];

export function resolveLocal(spec: string, from: string): string | null {
  let base: string;
  if (spec.startsWith("@/")) base = join(NEXT, "src", spec.slice(2));
  else if (spec.startsWith("@sites/")) base = join(SITES, spec.slice(7));
  else if (spec.startsWith(".")) base = resolve(dirname(from), spec);
  else return null;
  for (const e of EXT) if (existsSync(base + e) && statSync(base + e).isFile()) return base + e;
  throw new Error(`无法解析 ${spec} (来自 ${relative(NEXT, from)})`);
}

const walk = (dir: string): string[] => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));
const pkgName = (spec: string) => (spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0]);

/**
 * @param stop 命中时不再往下走 (例如 shadcn 官方组件), 但仍记入 stopped
 */
export function closure(id: string, extra: string[] = [], stop: (file: string) => boolean = () => false) {
  const files = new Set<string>();
  const stopped = new Set<string>();
  const packages = new Set<string>();
  const queue = [...walk(join(SITES, id)).filter((f) => /\.(tsx?|css|md)$/.test(f)), ...extra.map((f) => join(NEXT, f))];
  while (queue.length) {
    const f = queue.pop()!;
    if (files.has(f) || stopped.has(f)) continue;
    if (stop(f)) { stopped.add(f); continue; }
    files.add(f);
    if (!/\.(tsx?|css)$/.test(f)) continue;
    for (const m of readFileSync(f, "utf8").matchAll(IMPORT)) {
      const spec = m[1] ?? m[2] ?? m[3];
      const local = resolveLocal(spec, f);
      if (local) queue.push(local);
      else if (!spec.startsWith("node:")) packages.add(pkgName(spec));
    }
  }
  return { files: [...files].sort(), stopped: [...stopped].sort(), packages: [...packages].sort() };
}
