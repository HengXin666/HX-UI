/**
 * 层总览的缩略图: 在文档站构建产物 (docs/dist) 上用 playwright 逐件打开拍摄台 #/thumb/<id>, 用默认参数真跑组件,
 * 截图写到 docs/dist/thumbs/<id>.png, 拍成功的 id 记进 docs/dist/thumbs/manifest.json (总览页只给清单里的件放图).
 * 拍不了的 (缺必填参数抛错, 入口不认识, 画面与空框一模一样) 不出图, 列进 manifest 的 failed, 不放占位.
 * 范围: catalog.gen.json 里 surface / kits / controls 三层的件.
 *
 * 用法: node scripts/docs-thumbs.ts [--layer surface|kits|controls] [--slice 起:止] [--jobs N]
 *       (--slice 按清单下标切一段, 分几次跑时用; 清单按次合并)
 *       先 vite build (docs 下 npm run build); docs 的 npm run build:site 把两步连起来.
 * 退出码: 0=跑完 (失败的件见输出) / 2=没有构建产物或工具错误
 */
import { createReadStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import path from "node:path";
import { chromium, type Browser } from "playwright";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIST = path.join(ROOT, "docs", "dist");
const OUT = path.join(DIST, "thumbs");
const GEN = path.join(ROOT, "docs", "face", "docs", "catalog", "catalog.gen.json");
const LAYERS = ["surface", "kits", "controls"];
/** 与 docs/face/docs/kinds/thumbs.ts 的 THUMB_PX 一致. */
const WIDTH = 640;
const HEIGHT = 400;
const STATE_SELECTOR = "[data-thumb-state]";
/** 等拍摄台给出结论的上限 (组件加载 + 1.5s 稳定期). */
const WAIT_MS = 12000;
const DEFAULT_JOBS = 6;
const EXIT_TOOL = 2;
const TYPES: Readonly<Record<string, string>> = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json", ".png": "image/png", ".woff2": "font/woff2", ".wasm": "application/wasm" };

interface Failure { readonly id: string; readonly reason: string }

function arg(name: string): string | undefined {
  const at = process.argv.indexOf(name);
  return at > 0 ? process.argv[at + 1] : undefined;
}

function serve(): Promise<{ server: Server; port: number }> {
  const server = createServer((req, res) => {
    const url = decodeURIComponent((req.url ?? "/").split("?")[0]);
    const file = path.join(DIST, url === "/" ? "index.html" : url);
    if (!file.startsWith(DIST) || !existsSync(file)) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream" });
    createReadStream(file).pipe(res);
  });
  return new Promise((ok) => server.listen(0, "127.0.0.1", () => ok({ server, port: (server.address() as { port: number }).port })));
}

async function shoot(browser: Browser, base: string, id: string, blank: Buffer | undefined, want = "ok"): Promise<Buffer | Failure> {
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1, colorScheme: "dark" });
  try {
    await page.goto(`${base}/index.html#/thumb/${id}`);
    const stage = page.locator(STATE_SELECTOR);
    await page.waitForFunction((sel) => document.querySelector(sel)?.getAttribute("data-thumb-state") !== "loading", STATE_SELECTOR, { timeout: WAIT_MS });
    const state = await stage.getAttribute("data-thumb-state");
    if (state !== want) return { id, reason: state ?? "no-stage" };
    const png = await stage.screenshot({ animations: "allow" });
    if (blank && png.equals(blank)) return { id, reason: "blank" };
    return png;
  } catch (error) {
    return { id, reason: (error as Error).message.split("\n")[0] };
  } finally {
    await page.close();
  }
}

if (!existsSync(path.join(DIST, "index.html"))) {
  console.error("docs-thumbs: 没有 docs/dist, 先在 docs 下 npm run build");
  process.exit(EXIT_TOOL);
}
const only = arg("--layer");
const jobs = Number(arg("--jobs") ?? DEFAULT_JOBS);
const gen = JSON.parse(readFileSync(GEN, "utf8")) as { entries: { id: string; layer: string; role: string }[] };
const all = gen.entries.filter((e) => e.role === "component" && LAYERS.includes(e.layer) && (!only || e.layer === only)).map((e) => e.id);
const [from, to] = (arg("--slice") ?? `0:${all.length}`).split(":").map(Number);
const ids = all.slice(from, to);
mkdirSync(OUT, { recursive: true });
const manifestFile = path.join(OUT, "manifest.json");
const before = existsSync(manifestFile) ? (JSON.parse(readFileSync(manifestFile, "utf8")) as { ok: string[]; failed: Failure[] }) : { ok: [], failed: [] };

const { server, port } = await serve();
const browser = await chromium.launch();
const base = `http://127.0.0.1:${port}`;
/** 空框的样子: 目录里没有的 id 让拍摄台停在 missing, 拍下来作对照, 与它一模一样的截图算没画出东西. */
const blankShot = await shoot(browser, base, "__blank__", undefined, "missing");
const blank = Buffer.isBuffer(blankShot) ? blankShot : undefined;
const ok: string[] = [];
const failed: Failure[] = [];
let next = 0;
async function worker(): Promise<void> {
  while (next < ids.length) {
    const id = ids[next++];
    const result = await shoot(browser, base, id, blank);
    if (Buffer.isBuffer(result)) {
      writeFileSync(path.join(OUT, `${id}.png`), result);
      ok.push(id);
    } else failed.push(result);
  }
}
await Promise.all(Array.from({ length: Math.max(1, jobs) }, worker));
await browser.close();
server.close();

const done = new Set(ids);
const manifest = {
  ok: [...before.ok.filter((id) => !done.has(id)), ...ok].sort(),
  failed: [...before.failed.filter((f) => !done.has(f.id)), ...failed].sort((a, b) => a.id.localeCompare(b.id)),
};
writeFileSync(manifestFile, JSON.stringify(manifest, null, 1) + "\n");
console.log(`docs-thumbs: ${only ?? "三层"} ${ids.length} 件, 拍成 ${ok.length}, 拍不了 ${failed.length}; 清单累计 拍成 ${manifest.ok.length} / 拍不了 ${manifest.failed.length}`);
for (const f of failed) console.log(`  拍不了: ${f.id} (${f.reason})`);
