/**
 * 文档站外壳交互检查: 主题三态, Ctrl/Cmd+K 搜索, 页内目录锚点与标题 id
 * 断言行为而不是存在性; 只能稳定抓到元素/属性缺失类故障, 边界见 docs/reference/quality/browser-checks.md
 * 读 React 更新后的 DOM 必须等一次提交, 探针统一用 setTimeout 轮询
 * 产物目录: 设置 HX_QUALITY_BUILD 时读其中的 docs-dist, 否则读 docs/dist
 * 用法: node scripts/check-shell.ts [--strict]
 */
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { existsSync, readFileSync, statSync, writeFileSync, unlinkSync, createReadStream } from "node:fs";
import path from "node:path";
import { BUILD_ENV, DOCS_DIR, DOCS_DIST, UTF8 } from "./constants/quality.ts";
import { DATA_EVENT, DIST_DIR, HTTP_OK, IGNORE, INDEX_HTML, JS_MIME, MIN_TOC_ITEMS, PIPE, URL_ROOT } from "./constants/browser.ts";

const ROOT = process.env.CHECK_UI_ROOT
  ? path.resolve(process.env.CHECK_UI_ROOT)
  : path.resolve(import.meta.dirname, "..");
const DIST = process.env[BUILD_ENV]
  ? path.join(process.env[BUILD_ENV], DOCS_DIST)
  : path.join(ROOT, DOCS_DIR, DIST_DIR);
const STRICT = process.argv.includes("--strict");

function which(cmd) {
  for (const dir of (process.env.PATH ?? "").split(":")) {
    const p = path.join(dir, cmd);
    try { if (statSync(p).isFile()) return p; } catch { /* 不存在 */ }
  }
  return null;
}
const chromium = process.env.CHROMIUM_PATH || which("chromium") || which("chromium-browser") || which("google-chrome");

if (!chromium) {
  const msg = "check-shell: 本机找不到 chromium, 跳过外壳交互检查";
  if (STRICT) { console.error(msg + " (--strict 下视为失败)"); process.exit(1); }
  console.log(msg + " (未验证)");
  process.exit(0);
}
if (!existsSync(path.join(DIST, INDEX_HTML))) {
  console.error("check-shell: docs/dist 不存在, 先跑 docs 的 build");
  process.exit(1);
}

const MIME = { ".html": "text/html; charset=utf-8", ".js": JS_MIME, ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml" };
const server = createServer((req, res) => {
  const url = (req.url ?? URL_ROOT).split("?")[0];
  let file = path.join(DIST, decodeURIComponent(url));
  try { if (statSync(file).isDirectory()) file = path.join(file, INDEX_HTML); }
  catch { file = path.join(DIST, INDEX_HTML); }
  res.writeHead(HTTP_OK, { "content-type": MIME[path.extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;

/** 把探针注入 index.html, 返回临时页面的文件名 */
const PROBE = `window.addEventListener("load", function () {
  var out = {};
  var log = [];
  function btn() { return document.querySelector('button[aria-label^="主题"]'); }
  function snap(tag) {
    var b = btn();
    log.push(tag + "=" + (b ? b.getAttribute("aria-label").replace("主题: ", "") : "NONE") + "/" + document.documentElement.getAttribute("data-mode"));
  }
  var n = 0;
  function themeStep() {
    snap("t" + n);
    if (n >= 3) return afterTheme();
    n++;
    var b = btn();
    if (b) b.click();
    setTimeout(themeStep, 250);
  }
  function afterTheme() {
    out.theme = log.join(" ");
    // 搜索: 在 document 上派发 ⌘K (React 的根委托挂在容器上, 必须冒泡到 document)
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
    setTimeout(function () {
      out.search = !!document.querySelector('[aria-label="搜索组件"]');
      // 输入一个查询词, 看候选是否过滤
      var inp = document.querySelector('input[aria-label="搜索组件"]');
      if (inp) {
        var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        setter.call(inp, "table");
        inp.dispatchEvent(new Event("input", { bubbles: true }));
      }
      setTimeout(function () {
        out.hits = document.querySelectorAll('[aria-label="搜索组件"] button[type="button"]').length;
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        setTimeout(function () {
          out.tocAnchors = document.querySelectorAll('nav[aria-label="本页目录"] a[href^="#"]').length;
          out.headingIds = document.querySelectorAll("h2[id], h3[id]").length;
          if (innerWidth < 768) {
            out.mobileWidth = document.querySelector("main").getBoundingClientRect().width;
            out.mobileViewport = innerWidth;
            document.querySelector('button[aria-label="打开导航"]').click();
            setTimeout(function () {
              out.mobileNav = document.querySelector('button[aria-label="打开导航"]').getAttribute("aria-expanded") === "true";
              document.title = "SHELLRESULT " + JSON.stringify(out);
            }, 200);
            return;
          }
          var link = document.querySelector("tbody tr a");
          if (link) {
            link.addEventListener("click", function (e) { e.preventDefault(); }, { once: true });
            link.click();
          }
          setTimeout(function () {
            out.linkKeptRow = document.body.textContent.includes("点过的行: (没点过行)");
            document.querySelector("tbody tr td:nth-child(3)")?.click();
            setTimeout(function () {
              out.rowClicked = document.body.textContent.includes("点过的行: deepstack0914");
              document.title = "SHELLRESULT " + JSON.stringify(out);
            }, 200);
          }, 200);
        }, 200);
      }, 300);
    }, 400);
  }
  setTimeout(themeStep, 1500);
});`;

writeFileSync(path.join(DIST, "__shell_probe.html"), readFileSync(path.join(DIST, INDEX_HTML), UTF8).replace("</head>", "<script>" + PROBE + "</script></head>"));

function run(url, width = 1400) {
  return new Promise((resolve) => {
    const child = spawn(chromium, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=15000", `--window-size=${width},900`, "--dump-dom", url], { stdio: [IGNORE, PIPE, IGNORE] });
    let out = "";
    child.stdout.on(DATA_EVENT, (d) => (out += d));
    child.on("close", () => resolve(out));
    child.on("error", () => resolve(""));
  });
}

const url = `http://127.0.0.1:${port}/__shell_probe.html#/data-table`;
const [dom, mobileDom] = await Promise.all([run(url), run(url, 500)]);
server.close();
// 探针页面是注入到 dist 里的临时文件, 用完立刻删 - 留在产物里会被当成真的静态页
try { unlinkSync(path.join(DIST, "__shell_probe.html")); } catch { /* 已经不在 */ }

const m = dom.match(/SHELLRESULT (\{[^<]*\})/);
if (!m) {
  console.error("check-shell: 探针没有回报结果 (页面可能崩溃或探针未执行)");
  process.exit(1);
}
const r = JSON.parse(m[1]);
const mobileMatch = mobileDom.match(/SHELLRESULT (\{[^<]*\})/);
const mobile = mobileMatch ? JSON.parse(mobileMatch[1]) : null;

const failures = [];
// 主题必须是 system -> light -> dark -> system, 且标签与 data-mode 同步
const expectedTheme = "t0=跟随系统/light t1=亮色/light t2=暗色/dark t3=跟随系统/light";
if (r.theme !== expectedTheme) {
  failures.push(`主题三态不对\n      期望: ${expectedTheme}\n      实际: ${r.theme}`);
}
if (!r.search) failures.push("⌘K 没有打开搜索面板");
else if (!(r.hits > 0)) failures.push(`搜索 'table' 返回 0 条 (应 >=1)`);
if (!(r.tocAnchors >= MIN_TOC_ITEMS)) failures.push(`页内目录锚点不足 (${r.tocAnchors} 个, 应 >=2)`);
if (!(r.headingIds >= MIN_TOC_ITEMS)) failures.push(`标题没有生成 id (${r.headingIds} 个), 目录会点不动`);
if (!r.linkKeptRow || !r.rowClicked) failures.push("表格链接与行点击的事件边界异常");
if (!mobile || !mobile.mobileNav || mobile.mobileWidth < mobile.mobileViewport - 40 || mobile.mobileWidth > mobile.mobileViewport) {
  failures.push(`窄屏主区或导航异常: ${JSON.stringify(mobile?.mobileWidth ?? null)} / ${JSON.stringify(mobile?.mobileViewport ?? null)}`);
}

if (failures.length === 0) {
  console.log(`check-shell: 通过 (主题三态 / ⌘K 搜索 ${r.hits} 条 / 目录锚点 ${r.tocAnchors} 个 / 标题 id ${r.headingIds} 个 / 表格行点击 / 窄屏导航)`);
  process.exit(0);
}
console.error("check-shell: " + failures.length + " 项失败\n");
for (const f of failures) console.error("  → " + f);
console.error("");
process.exit(1);
