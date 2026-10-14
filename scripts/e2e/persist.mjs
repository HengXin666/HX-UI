/**
 * 保存 / 加载 / 同步 的 e2e。
 *
 * ## 三条链路各自验什么
 *
 *   1. **导出**: 点"导出"真的触发了一次 .bp.json 下载, 且内容能被 parseGraph
 *      读回来 (往返一致)。只验证"弹出了保存框"是不够的  那证明不了内容对。
 *   2. **导入**: 塞一份 JSON 进去, 图真的变了。
 *   3. **同步**: 两个标签页开同一频道, A 改了 B 能收到。这是本库的卖点,
 *      不测等于没做。
 */
import { Harness, report } from "./harness.mjs";
import { chromium } from "playwright";

const steps = [];
const h = new Harness();

// ── 1. 导出 ────────────────────────────────────────────────────────
await h.open("#src=demo&rf=0");
const before = await h.stat();

const downloaded = await h.p.evaluate(async () => {
  // 拦下 Blob URL 的创建, 把内容读出来  不落地到磁盘也要能验
  const orig = URL.createObjectURL;
  let captured = null;
  URL.createObjectURL = (blob) => {
    captured = blob;
    return "blob:stub";
  };
  const btn = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "导出");
  if (!btn) return { ok: false, why: "找不到导出按钮" };
  btn.click();
  await new Promise((r) => setTimeout(r, 200));
  URL.createObjectURL = orig;
  if (!captured) return { ok: false, why: "没有产生 Blob" };
  const text = await captured.text();
  return { ok: true, text };
});

let parsed = null;
if (downloaded.ok) {
  try { parsed = JSON.parse(downloaded.text); } catch { /* 下面断言会报出来 */ }
}
steps.push({
  name: "导出: 点导出产出可解析的 .bp.json",
  ok: downloaded.ok && parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.edges),
  expect: "含 nodes / edges 数组",
  actual: downloaded.ok
    ? `version=${parsed?.version} nodes=${parsed?.nodes?.length} edges=${parsed?.edges?.length}`
    : downloaded.why,
});

// 往返一致: 导出的节点数 == 页面上的节点数
steps.push({
  name: "导出: 内容与当前图一致 (往返)",
  ok: !!parsed && parsed.nodes.length === before.nodes,
  expect: `${before.nodes} 个节点`,
  actual: `${parsed?.nodes?.length ?? "-"} 个节点`,
  shot: await h.shot("30-export"),
});

// ── 2. 导入 ────────────────────────────────────────────────────────
/**
 * 真走一次导入: 用 DataTransfer 伪造一个 File 塞进 input。
 *
 * 为什么能这么干: pickGraphFile 内部建一个 <input type=file>, 而
 * Playwright 的 setInputFiles 能直接给它喂内容  绕开系统文件对话框,
 * 但走的**完全是同一条代码路径** (同一个 change 事件、同一个 parseGraph)。
 * 不像"只测解析函数"那种自欺欺人的断言。
 */
const imported = await h.p.evaluate(async (json) => {
  const btn = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "导入");
  if (!btn) return { ok: false, why: "找不到导入按钮" };
  // 抢在 click 之前把 input 抓到手
  const origClick = HTMLInputElement.prototype.click;
  let input = null;
  HTMLInputElement.prototype.click = function () {
    if (this.type === "file") { input = this; return; }   // 不真弹框
    return origClick.call(this);
  };
  btn.click();
  HTMLInputElement.prototype.click = origClick;
  if (!input) return { ok: false, why: "没有创建 file input" };

  const file = new File([json], "imp.bp.json", { type: "application/json" });
  const dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
  input.dispatchEvent(new Event("change"));
  await new Promise((r) => setTimeout(r, 400));
  return { ok: true };
}, JSON.stringify({ version: 1, nodes: [{ id: "e2e1", type: "start", x: 40, y: 40 }], edges: [] }));

await h.p.waitForTimeout(500);
const afterImport = await h.stat();
steps.push({
  name: "导入: 走真实 file input 路径, 图被替换",
  ok: imported.ok && afterImport.nodes === 1,
  expect: "导入 1 个节点的图后 nodes == 1",
  actual: imported.ok ? `nodes=${afterImport.nodes}` : imported.why,
  shot: await h.shot("31-import"),
});

await h.close();

// ── 3. 同步: 两个标签页 ────────────────────────────────────────────
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 } });
await ctx.addInitScript(() => localStorage.setItem("hx-ui-docs-theme", "dark"));

const a = await ctx.newPage();
await a.goto("http://127.0.0.1:5600/blueprint.html#src=demo&channel=e2e-sync", { waitUntil: "networkidle" });
await a.waitForTimeout(1500);

const b = await ctx.newPage();
await b.goto("http://127.0.0.1:5600/blueprint.html#src=demo&channel=e2e-sync", { waitUntil: "networkidle" });
await b.waitForTimeout(1500);

const statOf = (pg) => pg.evaluate(() => {
  const m = /(\d+) 节点 \/ (\d+) 连线/.exec(document.body.innerText);
  return m ? +m[1] : -1;
});

const aBefore = await statOf(a);
const bBefore = await statOf(b);

// A 里加一个节点 (通过面板点击, 走视口中心)
const paletteItem = a.locator("aside button, [data-palette-item]").first();
let added = false;
if (await paletteItem.count()) {
  await paletteItem.click();
  added = true;
} else {
  // 退回: 用快捷键复制一个
  await a.locator("[data-node-kind]").first().locator("xpath=child::div[1]").click();
  await a.keyboard.press("Control+d");
  added = true;
}
await a.waitForTimeout(600);
const aAfter = await statOf(a);

// B 等同步
await b.waitForTimeout(1500);
const bAfter = await statOf(b);

steps.push({
  name: "同步: A 改动后 B 在同一频道收到",
  ok: added && aAfter === aBefore + 1 && bAfter === aAfter,
  expect: `A ${aBefore}->${aBefore + 1}, B 跟到 ${aBefore + 1}`,
  actual: `A ${aBefore}->${aAfter}, B ${bBefore}->${bAfter}`,
  shot: await b.screenshot({ path: new URL("./shots/31-sync-b.png", import.meta.url).pathname }) ?? "",
});

await browser.close();

/**
 * 同步必须**拒绝不兼容的图**。
 *
 * 频道只是一个名字: 同名频道的另一端可能是另一套节点命名空间的图
 * (例如源码层 33 节点)。无条件接受会让对面所有节点变成"未注册" 
 * 实测一拖就 85 个错误。所以收到图要先校验节点类型是否被注册表认识。
 */
{
  const br = await chromium.launch();
  const cx = await br.newContext({ viewport: { width: 1400, height: 850 } });
  const pa = await cx.newPage();
  await pa.goto("http://127.0.0.1:5600/blueprint.html#src=dsh&channel=cross-e2e", { waitUntil: "networkidle" });
  await pa.waitForTimeout(3000);
  const pb = await cx.newPage();
  await pb.goto("http://127.0.0.1:5600/blueprint.html#src=source&channel=cross-e2e", { waitUntil: "networkidle" });
  await pb.waitForTimeout(3500);

  const st = (pg) => pg.evaluate(() => {
    const t = document.body.innerText;
    const e = /(\d+) 节点/.exec(t);
    const er = /(\d+) 个错误/.exec(t);
    return { n: e ? +e[1] : -1, errors: er ? +er[1] : 0 };
  });
  const a0 = await st(pa);
  // B 拖一下 -> 广播它的 33 节点源码层图
  const n0 = pb.locator(".react-flow__node").first();
  const bx = await n0.boundingBox();
  await pb.mouse.move(bx.x + bx.width / 2, bx.y + 10);
  await pb.mouse.down();
  await pb.mouse.move(bx.x + bx.width / 2 + 70, bx.y + 50, { steps: 10 });
  await pb.mouse.up();
  await pb.waitForTimeout(2500);
  const a1 = await st(pa);

  steps.push({
    name: "同步: 拒绝不兼容的图 (同名频道不同节点命名空间)",
    ok: a0.n === a1.n && a1.errors === 0,
    expect: `${a0.n} 节点、0 错误 保持不变`,
    actual: `${a0.n} -> ${a1.n} 节点, 错误 ${a1.errors}`,
  });
  await br.close();
}

process.exit(report(steps));
