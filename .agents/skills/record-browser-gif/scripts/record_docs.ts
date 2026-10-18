/**
 * HX-UI 文档站录制器: 用仓库根 devDependency 里的 playwright, 在隔离的 headless 浏览器里
 * 按分镜 (storyboard JSON) 操作已构建的 docs/dist, 产出逐帧截图与可选的 WebM 视频.
 *
 * 用法 (在仓库根目录):
 *   npm --prefix docs run build
 *   node .agents/skills/record-browser-gif/scripts/record_docs.ts \
 *     --storyboard .playwright-gif/<run>/storyboard.json --out .playwright-gif/<run> [--video] [--allow-dirty]
 *
 * 分镜格式: { "viewport": { "width": 1280, "height": 800 }, "steps": [ ... ] }, 每步只写一个动作:
 *   { "goto": "#/command" }          打开文档站的 hash 路由 (相对站点根)
 *   { "waitFor": "css 选择器" }       等待元素可见 (就绪判据, 不用固定等待代替)
 *   { "click": "css 选择器" }         点击第一个匹配元素
 *   { "press": "Control+j" }          键盘组合键
 *   { "type": "文字" }               向当前焦点输入
 *   { "hover": "css 选择器" }         悬停
 *   { "wait": 600 }                  已验证状态之后的阅读停留 (毫秒)
 *   { "shot": "01-open" }            截图, 保存为 frames/NN-<名字>.png
 *
 * 浏览器: 设了 CHROMIUM_PATH 时用它 (与 check-smoke / check-shell 同一约定), 否则用 playwright 自带的 chromium.
 * 产物全部写进 --out (应位于已 gitignore 的 .playwright-gif/ 下), 另写 capture.json 记录演示的 commit 与参数.
 */
import { createServer, type Server } from "node:http";
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import path from "node:path";

type Step = { goto?: string; waitFor?: string; click?: string; press?: string; type?: string; hover?: string; wait?: number; shot?: string };
type Storyboard = { viewport?: { width: number; height: number }; steps: Step[] };

const DEFAULT_VIEWPORT = { width: 1280, height: 800 };
const STEP_TIMEOUT_MS = 15000;
const SHOT_PAD = 2;
const FLAG_PREFIX = "--";
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

async function main(): Promise<void> {
  const repo = git(["rev-parse", "--show-toplevel"]);
  const storyboardPath = option("storyboard");
  const outOption = option("out");
  if (!storyboardPath || !outOption) {
    fail("需要 --storyboard <json> 与 --out <目录>");
  }
  const dirty = git(["status", "--porcelain", "--untracked-files=no"]) !== "";
  if (dirty && !flag("allow-dirty")) {
    fail("工作区有未提交改动: GIF 必须演示一个确切的 commit, 先提交或用 --allow-dirty 并在 PR 里说明");
  }
  const dist = path.resolve(repo, option("dist") ?? path.join("docs", "dist"));
  if (!existsSync(path.join(dist, "index.html"))) {
    fail("找不到 " + dist + " 下的 index.html, 先运行 npm --prefix docs run build");
  }
  const out = path.resolve(outOption);
  const frames = path.join(out, "frames");
  const videos = path.join(out, "videos");
  mkdirSync(frames, { recursive: true });
  const storyboard = JSON.parse(readFileSync(path.resolve(storyboardPath), "utf8")) as Storyboard;
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
        await page.goto(new URL(step.goto, origin).href, { waitUntil: "networkidle" });
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
        const file = path.join(frames, `${String(shots.length).padStart(SHOT_PAD, "0")}-${step.shot}.png`);
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
    commit: git(["rev-parse", "HEAD"]),
    dirty,
    viewport,
    browser: process.env.CHROMIUM_PATH ? "CHROMIUM_PATH" : "playwright chromium",
    shots,
    video: flag("video") ? "demo.webm" : null,
    timeline,
  };
  writeFileSync(path.join(out, "capture.json"), JSON.stringify(capture, null, 2) + "\n");
  console.log(JSON.stringify({ out, commit: capture.commit, shots: shots.length, video: capture.video }, null, 2));
}

await main();
