/**
 * 第三方包 (Radix 等) 的属性说明读自 node_modules 里的 d.ts, 所以 props.gen.json 取决于装的版本.
 * 记下用到的包, 生成前与 package-lock.json 对一遍: 本地 node_modules 比 lockfile 旧时直接说清楚, 而不是报一个看不出原因的 diff.
 *
 * .agents/notes/implemented/process/2026-11-24-docs-props-deterministic.md
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { NODE_MODULES, PACKAGE_FILE, SLASH, UTF8 } from "../constants/quality.ts";
import { DOM_TYPES_PACKAGE, NODE_MODULES_SEGMENT, PACKAGE_LOCK_FILE } from "../constants/docs-props.ts";

const SCOPE_PREFIX = "@";
const LEADING_NODE_MODULES = new RegExp(`^${NODE_MODULES}/`);

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, UTF8)) as T;
}

export interface DependencyLog {
  /** 记下一个声明文件所在的包 (不在 node_modules 里的忽略). */
  note(file: string): void;
  /** 用到的包里版本与 lockfile 不一致的, 每条 "包 实装版本 (lockfile 版本)". */
  drift(): string[];
}

export function dependencyLog(root: string): DependencyLog {
  const used = new Set<string>();
  return {
    note(file) {
      const i = file.lastIndexOf(NODE_MODULES_SEGMENT);
      if (i < 0) return;
      const prefix = file.slice(0, i + NODE_MODULES_SEGMENT.length);
      const rest = file.slice(prefix.length).split(SLASH);
      const name = rest[0].startsWith(SCOPE_PREFIX) ? `${rest[0]}${SLASH}${rest[1]}` : rest[0];
      used.add(path.relative(root, prefix + name).split(path.sep).join(SLASH));
    },
    drift() {
      const lockFile = path.join(root, PACKAGE_LOCK_FILE);
      if (!existsSync(lockFile)) return [];
      const lock = readJson<{ packages?: Record<string, { version?: string }> }>(lockFile);
      const out: string[] = [];
      for (const dir of [...used].sort()) {
        if (dir.includes(DOM_TYPES_PACKAGE)) continue;
        const want = lock.packages?.[dir]?.version;
        const pj = path.join(root, dir, PACKAGE_FILE);
        if (!want || !existsSync(pj)) continue;
        const have = readJson<{ version?: string }>(pj).version;
        if (have !== want) out.push(`${dir.replace(LEADING_NODE_MODULES, "")} ${have} (lockfile ${want})`);
      }
      return out;
    },
  };
}
