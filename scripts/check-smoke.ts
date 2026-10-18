/**
 * 文档站冒烟: 逐页用 headless chromium 渲染, 抓 "渲染出来但是空的" 静默失效
 * 判据: DOM 含 <h1> 且体积不低于 MIN_DOM_BYTES; uncaught 错误只报告不判失败
 * 无浏览器时默认跳过 (exit 0), --strict 下视为失败; 背景见 docs/reference/quality/browser-checks.md
 * 产物目录: 设置 HX_QUALITY_BUILD 时读其中的 docs-dist, 否则读 <扫描根>/docs/dist
 * 扫描根: CHECK_UI_ROOT (默认上一级目录), 负向探针靠它把夹具指到临时目录
 * 用法: node scripts/check-smoke.ts [--strict] [--concurrency=4] [--page=button]
 */
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { existsSync, readFileSync, statSync, createReadStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BUILD_ENV, DOCS_DIR, DOCS_DIST, UTF8 } from "./constants/quality.ts";
import {
  DATA_EVENT, DIST_DIR, HTTP_OK, IGNORE, INDEX_HTML, JS_MIME, PIPE, SHOWN_ERRORS, URL_ROOT, USER_ARGS_START,
} from "./constants/browser.ts";

const ROOT = process.env.CHECK_UI_ROOT
  ? path.resolve(process.env.CHECK_UI_ROOT)
  : path.resolve(import.meta.dirname, "..");
const DIST = process.env[BUILD_ENV]
  ? path.join(process.env[BUILD_ENV], DOCS_DIST)
  : path.join(ROOT, DOCS_DIR, DIST_DIR);
const NAV = path.join(ROOT, DOCS_DIR, "src", "nav.ts");

const argv = process.argv.slice(USER_ARGS_START);
const STRICT = argv.includes("--strict");
const ONLY = (argv.find((a) => a.startsWith("--page=")) ?? "").split("=")[1];
const CONCURRENCY = Number((argv.find((a) => a.startsWith("--concurrency=")) ?? "").split("=")[1]) || 4;

/** DOM 体积下限. 正常页最小 31KB, 白屏 5.5KB, 20KB 两边都留了余量 */
const MIN_DOM_BYTES = 20000;

/** chromium 可能的位置. 系统包, Snap, 以及 Playwright 的下载目录都试一遍 */
function findChromium() {
  const explicit = process.env.CHROMIUM_PATH;
  const candidates = [
    explicit,
    "chromium",
    "chromium-browser",
    "google-chrome",
    "google-chrome-stable",
  ].filter(Boolean);
  for (const c of candidates) {
    if (c.includes(URL_ROOT)) {
      if (existsSync(c)) return c;
      continue;
    }
    // 裸命令名: 交给 which 解析
    const found = which(c);
    if (found) return found;
  }
  return null;
}

function which(cmd) {
  for (const dir of (process.env.PATH ?? "").split(":")) {
    const p = path.join(dir, cmd);
    try {
      if (statSync(p).isFile()) return p;
    } catch {
      /* 不存在就继续 */
    }
  }
  return null;
}

/**
 * 文档页清单从 nav.ts 提取, 而不是在脚本里抄一遍 - 抄的那份一定会过时.
 * 两种写法都认: 对象字面量 { id: "x" } 与多行清单里的 "x ~ 标签 ~ 说明".
 * .agents/notes/implemented/feature/2026-10-18-docs-shadcn-site-pages.md
 */
function readPages() {
  const src = readFileSync(NAV, UTF8);
  const ids = [
    ...src.matchAll(/\{\s*id:\s*"([a-z0-9-]+)"/g),
    ...src.matchAll(/^([a-z0-9-]+) ~ /gm),
  ].map((m) => m[1]);
  return [...new Set(ids)];
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": JS_MIME,
  ".mjs": JS_MIME,
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
};

function serveDist() {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      const url = (req.url ?? URL_ROOT).split("?")[0];
      let file = path.join(DIST, decodeURIComponent(url));
      // 目录与不存在的一律回 index.html (hash 路由不依赖服务端, 这里只为兜底)
      try {
        if (statSync(file).isDirectory()) file = path.join(file, INDEX_HTML);
      } catch {
        file = path.join(DIST, INDEX_HTML);
        if (!existsSync(file)) {
          res.writeHead(404).end("not found");
          return;
        }
      }
      res.writeHead(HTTP_OK, { "content-type": MIME[path.extname(file)] ?? "application/octet-stream" });
      createReadStream(file).pipe(res);
    });
    server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port }));
  });
}

function render(chromium, url) {
  return new Promise((resolve) => {
    const args = [
      "--headless=new",
      "--no-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--hide-scrollbars",
      "--virtual-time-budget=7000",
      "--window-size=1400,1200",
      "--enable-logging=stderr",
      "--dump-dom",
      url,
    ];
    const child = spawn(chromium, args, { stdio: [IGNORE, PIPE, PIPE] });
    let out = "";
    let err = "";
    child.stdout.on(DATA_EVENT, (d) => (out += d));
    child.stderr.on(DATA_EVENT, (d) => (err += d));
    child.on("close", () => {
      const errors = [...err.matchAll(/CONSOLE:\d+\] "(.*?)", source:/g)]
        .map((m) => m[1])
        .filter((m) => /uncaught|error/i.test(m));
      resolve({ dom: out, bytes: Buffer.byteLength(out, UTF8), errors });
    });
    child.on("error", () => resolve({ dom: "", bytes: 0, errors: [], spawnFailed: true }));
  });
}

/** 小并发池: chromium 每个进程上百 MB, 全量并行会把内存打满 */
async function pool(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

const chromium = findChromium();
if (!chromium) {
  const msg = "check-smoke: 本机找不到 chromium, 跳过浏览器验证";
  if (STRICT) {
    console.error(msg + " (--strict 下视为失败: 这次构建没有任何页面被真正验证过)");
    process.exit(1);
  }
  console.log(msg + " (未验证; 装了 chromium 或设 CHROMIUM_PATH 后会真跑)");
  process.exit(0);
}

if (!existsSync(path.join(DIST, INDEX_HTML))) {
  console.error("check-smoke: docs/dist 不存在, 先跑 \`npm run build\` (在 docs/ 下)");
  process.exit(1);
}

let pages = readPages();
if (ONLY) pages = pages.filter((p) => p === ONLY);
if (pages.length === 0) {
  console.error("check-smoke: nav.ts 里没有解析到任何页面 id");
  process.exit(1);
}

const { server, port } = await serveDist();
const base = `http://127.0.0.1:${port}`;

const results = await pool(pages, CONCURRENCY, async (page) => {
  const r = await render(chromium, `${base}/#/${page}`);
  const hasHeading = /<h1[\s>]/.test(r.dom);
  const failures = [];
  if (r.spawnFailed) failures.push("chromium 启动失败");
  if (!hasHeading) failures.push("DOM 里没有 <h1> (页面没渲染出来)");
  if (r.bytes < MIN_DOM_BYTES) failures.push(`DOM 只有 ${r.bytes}B (< ${MIN_DOM_BYTES}B)`);
  return { page, bytes: r.bytes, errors: r.errors, failures };
});

server.close();

const bad = results.filter((r) => r.failures.length > 0);
const warned = results.filter((r) => r.failures.length === 0 && r.errors.length > 0);

console.log(`check-smoke: ${pages.length} 个页面, chromium=${chromium}`);
for (const w of warned) {
  console.log(`  ! ${w.page}: ${w.errors[0]}`);
}

if (bad.length === 0) {
  console.log(`check-smoke: 通过 (${pages.length}/${pages.length} 页渲染正常)`);
  process.exit(0);
}

console.error(`\ncheck-smoke: ${bad.length}/${pages.length} 页有问题\n`);
for (const b of bad) {
  console.error(`  ${b.page}`);
  for (const f of b.failures) console.error(`    → ${f}`);
  for (const e of b.errors.slice(0, SHOWN_ERRORS)) console.error(`    ! ${e}`);
  console.error("");
}
process.exit(1);
