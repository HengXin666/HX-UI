/**
 * HX-UI 文档站录制器: 用仓库根 devDependency 里的 playwright, 在隔离的 headless 浏览器里
 * 按分镜 (storyboard JSON) 操作已构建的 docs/dist, 产出逐帧截图与可选的 WebM 视频.
 *
 * 用法 (在仓库根目录):
 *   npm --prefix docs run build
 *   node .agents/skills/record-browser-gif/scripts/record_docs.ts \
 *     --storyboard .playwright-gif/<run>/storyboard.json --out .playwright-gif/<run> [--video] [--allow-dirty] [--clean]
 *
 * 分镜格式: { "viewport": { "width": 1280, "height": 800 }, "steps": [ ... ] }, 每步只写一个动作键:
 *   { "goto": "#/command" }          打开文档站的 hash 路由 (相对站点根, 不允许跳到别的 origin)
 *   { "waitFor": "css 选择器" }       等待元素可见 (就绪判据, 不用固定等待代替)
 *   { "click": "css 选择器" }         点击第一个匹配元素
 *   { "press": "Control+j" }          键盘组合键
 *   { "type": "文字" }               向当前焦点输入
 *   { "hover": "css 选择器" }         悬停
 *   { "wait": 600 }                  已验证状态之后的阅读停留 (毫秒)
 *   { "shot": "01-open" }            截图, 保存为 frames/NN-<名字>.png
 * 一步里出现零个或多个动作键时直接失败: 否则打错键名的那一步会被静默跳过, 录出来的 GIF 少一个动作而没人发现.
 *
 * 浏览器: 设了 CHROMIUM_PATH 时用它 (与 check-smoke / check-shell 同一约定), 否则用 playwright 自带的 chromium.
 * 产物全部写进 --out (应位于已 gitignore 的 .playwright-gif/ 下), 另写 capture.json 记录演示的 commit 与参数.
 *
 * 自证约束 (录出来的 GIF 必须真的对应这个 commit):
 *   - 工作区必须干净, 未跟踪文件也算 (否则演示里可能出现还没提交的改动);
 *   - docs/dist 必须来自当前 HEAD: 有构建标记 (.hx-build.json) 时比对 commit, 没有标记时退回
 *     "产物不早于 HEAD 提交时间, 且不早于任何 docs 源码的修改时间", 两者都不成立就失败;
 *   - frames 目录已有内容时拒绝运行 (用 --clean 清空), 免得新旧两次运行的帧混在一起;
 *   - hash 路由跳转后等 location.hash 与目标一致且 h1 有文字再截图, 不用固定等待赌它渲染完.
 */
import { createServer, type Server } from "node:http";
import { createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import path from "node:path";

type Step = { goto?: string; waitFor?: string; click?: string; press?: string; type?: string; hover?: string; wait?: number; shot?: string };
type Storyboard = { viewport?: { width: number; height: number }; steps: Step[] };

const DEFAULT_VIEWPORT = { width: 1280, height: 800 };
const STEP_TIMEOUT_MS = 15000;
const SHOT_PAD = 2;
const FLAG_PREFIX = "--";
const NEWLINE = "\n";
const SLASH = "/";
const DOT = ".";
const ACTION_KEYS = ["goto", "waitFor", "click", "press", "type", "hover", "wait", "shot"] as const;
/** 截图名只允许这些字符: 斜杠与 .. 会让文件写到 frames 之外. */
const SHOT_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
/** 构建标记: 构建步骤若写入它, 录制器按 commit 精确比对; 没有时退回时间戳判据. */
const BUILD_MARKER = ".hx-build.json";
/** 参与 "dist 是否过期" 判定的文档站源码. */
const DIST_SOURCES = ["docs/src", "docs/vite.config.ts", "docs/index.html", "docs/blueprint.html", "docs/package.json"];
const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".wasm": "application/wasm",
  ".png": "image/png",
  ".woff2": "font/woff2",
};

function option(name: string): string | undefined {
  const index = process.argv.indexOf(FLAG_PREFIX + name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function flag(name: string): boolean {
  return process.argv.includes(FLAG_PREFIX + name);
}

function git(args: string[]): string {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function fail(message: string): never {
  console.error("record_docs: " + message);
  process.exit(1);
}

/** 只读的静态服务: 把 dist 目录挂到 127.0.0.1 的随机端口, 路径越界一律 404. */
function serve(dist: string): Promise<{ server: Server; origin: string }> {
  const server = createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url ?? "", "http://localhost").pathname);
    const relative = pathname.endsWith("/") ? pathname + "index.html" : pathname;
    const file = path.join(dist, path.normalize(relative));
    if (!file.startsWith(dist) || !existsSync(file) || !statSync(file).isFile()) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { "content-type": MIME[path.extname(file)] ?? "application/octet-stream" });
    createReadStream(file).pipe(response);
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      resolve({ server, origin: `http://127.0.0.1:${port}/` });
    });
  });
}

/** 每步必须恰好一个动作键, 且键名在约定之内. */
function checkStep(step: Step, index: number): void {
  const keys = Object.keys(step);
  const unknown = keys.filter((key) => !ACTION_KEYS.includes(key as (typeof ACTION_KEYS)[number]));
  if (unknown.length) {
    fail(`第 ${index + 1} 步有无法识别的键 ${unknown.join(", ")}: 动作键只能是 ${ACTION_KEYS.join(", ")}`);
  }
  if (keys.length !== 1) {
    fail(`第 ${index + 1} 步必须恰好一个动作键, 实际有 ${keys.length} 个 (${keys.join(", ") || "无"})`);
  }
}

/** 递归列出目录下所有文件的绝对路径. */
function walkFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...walkFiles(full));
    } else if (entry.isFile()) {
      found.push(full);
    }
  }
  return found;
}

/**
 * docs/dist 是否真的由 HEAD 构建: 有构建标记时比对 commit, 否则比对时间戳.
 * 返回来源描述, 写进 capture.json 供评审核对.
 */
function distProvenance(repo: string, dist: string, head: string): { source: string; builtAt: string } {
  const marker = path.join(dist, BUILD_MARKER);
  if (existsSync(marker)) {
    let marked: { commit?: string } = {};
    try {
      marked = JSON.parse(readFileSync(marker, "utf8")) as { commit?: string };
    } catch {
      fail(`构建标记 ${BUILD_MARKER} 不是合法 JSON, 无法确认 docs/dist 的来源`);
    }
    if (marked.commit !== head) {
      fail(`docs/dist 的构建标记是 commit ${marked.commit ?? "(空)"}, 但当前 HEAD 是 ${head}: 先重新构建再录`);
    }
    return { source: "marker", builtAt: statSync(marker).toISOString() };
  }
  const index = path.join(dist, "index.html");
  const builtAt = statSync(index).mtimeMs;
  const headTime = Number(git(["log", "-1", "--format=%ct", "HEAD"])) * 1000;
  if (builtAt < headTime) {
    fail(`docs/dist 早于 HEAD (${head}) 的提交时间: 先 npm --prefix docs run build 再录`);
  }
  const sources = DIST_SOURCES.filter((item) => existsSync(path.join(repo, item))).flatMap((item) => {
    const full = path.join(repo, item);
    return statSync(full).isDirectory() ? walkFiles(full) : [full];
  });
  const newer = sources.filter((file) => statSync(file).mtimeMs > builtAt);
  if (newer.length) {
    fail(`docs/dist 比这些源码旧, 演示的不会是当前代码: ${newer.map((file) => path.relative(repo, file)).slice(0, 3).join(", ")}`);
  }
  return { source: "mtime", builtAt: new Date(builtAt).toISOString() };
}

async function main(): Promise<void> {
  const repo = git(["rev-parse", "--show-toplevel"]);
  const storyboardPath = option("storyboard");
  const outOption = option("out");
  if (!storyboardPath || !outOption) {
    fail("需要 --storyboard <json> 与 --out <目录>");
  }
  const head = git(["rev-parse", "HEAD"]);
  // 未跟踪文件也要算: 只加 --untracked-files=no 会漏掉新写的组件文件, 演示里就混进了没提交的改动
  const dirty = git(["status", "--porcelain"]) !== "";
  if (dirty && !flag("allow-dirty")) {
    fail("工作区有未提交改动 (含未跟踪文件): GIF 必须演示一个确切的 commit, 先提交或用 --allow-dirty 并在 PR 里说明");
  }
  const dist = path.resolve(repo, option("dist") ?? path.join("docs", "dist"));
  if (!existsSync(path.join(dist, "index.html"))) {
    fail("找不到 " + dist + " 下的 index.html, 先运行 npm --prefix docs run build");
  }
  const provenance = distProvenance(repo, dist, head);
  const out = path.resolve(outOption);
  const frames = path.join(out, "frames");
  const videos = path.join(out, "videos");
  if (existsSync(frames) && readdirSync(frames).length) {
    if (!flag("clean")) {
      fail(`${frames} 已有内容: 复用会混入上一次运行的帧, 加 --clean 清空后再录`);
    }
    rmSync(frames, { recursive: true, force: true });
  }
  mkdirSync(frames, { recursive: true });
  const storyboard = JSON.parse(readFileSync(path.resolve(storyboardPath), "utf8")) as Storyboard;
  storyboard.steps.forEach(checkStep);
  const viewport = storyboard.viewport ?? DEFAULT_VIEWPORT;

  const { chromium } = createRequire(path.join(repo, "package.json"))("playwright");
  const { server, origin } = await serve(dist);
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ["--no-sandbox"] });
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    ...(flag("video") ? { recordVideo: { dir: videos, size: viewport } } : {}),
  });
  const shots: string[] = [];
  const startedAt = Date.now();
  const timeline: Array<{ step: Step; atMs: number }> = [];
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(STEP_TIMEOUT_MS);
    const video = page.video();
    for (const step of storyboard.steps) {
      timeline.push({ step, atMs: Date.now() - startedAt });
      if (step.goto !== undefined) {
        const target = new URL(step.goto, origin);
        if (target.origin !== new URL(origin).origin) {
          fail(`goto 目标 ${target.href} 不在本地服务 ${origin} 上: 分镜只能演示本次构建的文档站`);
        }
        await page.goto(target.href, { waitUntil: "networkidle" });
        // hash 路由不会触发新的文档加载: 等目标路由真的渲染出来 (hash 一致且 h1 有文字) 再往下走
        if (target.hash) {
          await page.waitForFunction((hash: string) => window.location.hash === hash, target.hash);
        }
        await page.locator("h1").first().waitFor({ state: "visible" });
        await page.waitForFunction(() => (document.querySelector("h1")?.textContent ?? "").trim().length > 0);
      } else if (step.waitFor !== undefined) {
        await page.locator(step.waitFor).first().waitFor({ state: "visible" });
      } else if (step.click !== undefined) {
        await page.locator(step.click).first().click();
      } else if (step.press !== undefined) {
        await page.keyboard.press(step.press);
      } else if (step.type !== undefined) {
        await page.keyboard.type(step.type, { delay: 60 });
      } else if (step.hover !== undefined) {
        await page.locator(step.hover).first().hover();
      } else if (step.wait !== undefined) {
        await page.waitForTimeout(step.wait);
      } else if (step.shot !== undefined) {
        if (!SHOT_NAME.test(step.shot) || step.shot.includes("..")) {
          fail(`截图名 ${step.shot} 不合法: 只能用字母数字与 . _ -, 且不能含 ..`);
        }
        const file = path.join(frames, `${String(shots.length).padStart(SHOT_PAD, "0")}-${step.shot}.png`);
        if (path.dirname(path.resolve(file)) !== path.resolve(frames)) {
          fail(`截图 ${step.shot} 会写到 frames 之外: ${file}`);
        }
        await page.screenshot({ path: file });
        shots.push(path.relative(out, file));
      } else {
        fail("无法识别的分镜步骤: " + JSON.stringify(step));
      }
    }
    await context.close();
    if (video) {
      await video.saveAs(path.join(out, "demo.webm"));
    }
  } finally {
    await context.close().catch(() => undefined);
    await browser.close();
    server.close();
  }
  const capture = {
    commit: head,
    dirty,
    dist: provenance,
    viewport,
    browser: process.env.CHROMIUM_PATH ? "CHROMIUM_PATH" : "playwright chromium",
    shots,
    video: flag("video") ? "demo.webm" : null,
    timeline,
  };
  writeFileSync(path.join(out, "capture.json"), JSON.stringify(capture, null, 2) + NEWLINE);
  console.log(JSON.stringify({ out, commit: capture.commit, shots: shots.length, video: capture.video, dist: provenance.source }, null, 2));
}

await main();
