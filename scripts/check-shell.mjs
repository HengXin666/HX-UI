#!/usr/bin/env node
/**
 * 文档站外壳交互检查。
 *
 * ## 为什么与 check-smoke.mjs 分开
 *
 * check-smoke 只回答一个问题: "页面渲染出来了吗"。而"渲染正常但功能不对"这类问题它抓不到:
 *   1. 生成物缺失 —— 页内目录在、但标题没有 id, 于是目录点不动 (已用负样本验证本脚本能抓到);
 *   2. 交互没接上 —— 按钮在、点了没反应。
 * 两者都"渲染正常、控制台零报错"。所以这一层单独做, 断言的是**行为**而不是存在性。
 *
 * ⚠️ 诚实说明本层的边界: 它不是万能的。我最初以为"主题切换状态脱节"是真 bug,
 * 实际是探针在 React 提交前读值造成的误判 —— 把副作用搬回 updater 的**负样本**跑本脚本
 * 依然通过。也就是说: 本脚本能稳定抓到"元素/属性缺失"类故障, 但抓不到
 * "不纯 updater"这类在开发模式才显形的写法问题。不要把它当成交互的全面保障。
 *
 * ## 测量纪律 (踩过的坑)
 *
 * 读 React 更新后的 DOM **必须等一次提交**。第一版探针在 click() 之后立刻读,
 * 拿到的是变更前的值, 于是把"功能正常"误判成"按钮没反应"。这里统一用 setTimeout 轮询。
 *
 * 用法: node scripts/check-shell.mjs [--strict]
 */
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { existsSync, readFileSync, statSync, writeFileSync, unlinkSync, createReadStream } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIST = path.join(ROOT, "docs", "dist");
const STRICT = process.argv.includes("--strict");

function which(cmd) {
  for (const dir of (process.env.PATH ?? "/usr/bin:/bin").split(":")) {
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
if (!existsSync(path.join(DIST, "index.html"))) {
  console.error("check-shell: docs/dist 不存在, 先跑 docs 的 build");
  process.exit(1);
}

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml" };
const server = createServer((req, res) => {
  const url = (req.url ?? "/").split("?")[0];
  let file = path.join(DIST, decodeURIComponent(url));
  try { if (statSync(file).isDirectory()) file = path.join(file, "index.html"); }
  catch { file = path.join(DIST, "index.html"); }
  res.writeHead(200, { "content-type": MIME[path.extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;

/** 把探针注入 index.html, 返回临时页面的文件名。 */
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
          document.title = "SHELLRESULT " + JSON.stringify(out);
        }, 200);
      }, 300);
    }, 400);
  }
  setTimeout(themeStep, 1500);
});`;

writeFileSync(path.join(DIST, "__shell_probe.html"), readFileSync(path.join(DIST, "index.html"), "utf8").replace("</head>", "<script>" + PROBE + "</script></head>"));

function run(url) {
  return new Promise((resolve) => {
    const child = spawn(chromium, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=15000", "--window-size=1400,900", "--dump-dom", url], { stdio: ["ignore", "pipe", "ignore"] });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.on("close", () => resolve(out));
    child.on("error", () => resolve(""));
  });
}

const dom = await run(`http://127.0.0.1:${port}/__shell_probe.html#/data-table`);
server.close();
// 探针页面是注入到 dist 里的临时文件, 用完立刻删 —— 留在产物里会被当成真的静态页
try { unlinkSync(path.join(DIST, "__shell_probe.html")); } catch { /* 已经不在 */ }

const m = dom.match(/SHELLRESULT (\{[^<]*\})/);
if (!m) {
  console.error("check-shell: 探针没有回报结果 (页面可能崩溃或探针未执行)");
  process.exit(1);
}
const r = JSON.parse(m[1]);

const failures = [];
// 主题必须是 system -> light -> dark -> system, 且标签与 data-mode 同步
const expectedTheme = "t0=跟随系统/light t1=亮色/light t2=暗色/dark t3=跟随系统/light";
if (r.theme !== expectedTheme) {
  failures.push(`主题三态不对\n      期望: ${expectedTheme}\n      实际: ${r.theme}`);
}
if (!r.search) failures.push("⌘K 没有打开搜索面板");
else if (!(r.hits > 0)) failures.push(`搜索 'table' 返回 0 条 (应 >=1)`);
if (!(r.tocAnchors >= 2)) failures.push(`页内目录锚点不足 (${r.tocAnchors} 个, 应 >=2)`);
if (!(r.headingIds >= 2)) failures.push(`标题没有生成 id (${r.headingIds} 个), 目录会点不动`);

if (failures.length === 0) {
  console.log(`check-shell: 通过 (主题三态 / ⌘K 搜索 ${r.hits} 条 / 目录锚点 ${r.tocAnchors} 个 / 标题 id ${r.headingIds} 个)`);
  process.exit(0);
}
console.error("check-shell: " + failures.length + " 项失败\n");
for (const f of failures) console.error("  → " + f);
console.error("");
process.exit(1);
