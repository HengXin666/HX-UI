#!/usr/bin/env node
/**
 * 库构建: tsc 出 dist/*.js 与 dist/*.d.ts, 再把 CSS 与 LICENSE 拷进 dist.
 *
 * 产物布局与 package.json 的 exports 一一对应, 改这里必须同步 exports.
 */
import { copyFileSync, cpSync, mkdirSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const DIST = join(ROOT, "dist");
const CSS = ["tokens.css", "styles.css", "motion.css", "spin-variants.css", "native-select.css"];

execFileSync("npx", ["tsc", "-p", "tsconfig.build.json"], { cwd: ROOT, stdio: "inherit" });
mkdirSync(DIST, { recursive: true });

for (const name of CSS) {
    try {
        copyFileSync(join(ROOT, "src", name), join(DIST, name));
    } catch (err) {
        console.warn("跳过缺失的样式文件: " + name);
    }
}

for (const name of ["LICENSE", "NOTICE"]) {
    try {
        copyFileSync(join(ROOT, name), join(DIST, name));
    } catch {
        /* 缺失不致命 */
    }
}

const files = readdirSync(DIST);
console.log("dist 就绪: " + files.length + " 个顶层条目");
