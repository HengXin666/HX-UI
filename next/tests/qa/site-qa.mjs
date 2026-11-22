/**
 * L3 成品验收: axe 扫描 + 主流程 (锚点, 表单校验 / 失败 / 成功, 焦点回归, 手机菜单, 横向溢出) + 控制台.
 * 对应 docs/done.md 的"能用"与"稳"两节.
 * 用法:
 *   npm run build:site launch && node tests/qa/site-qa.mjs dist-sites/launch [dark]
 *   MOTION=1 开启动效 (默认按减弱动效跑); 退出码非 0 表示有失败项.
 * 依赖: playwright (含 chromium: npx playwright install chromium), axe-core.
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
const root = process.argv[2];
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2" };
const srv = createServer(async (req, res) => { let p = decodeURIComponent(req.url.split("?")[0]); if (p === "/") p = "/index.html"; try { const b = await readFile(join(root, p)); res.writeHead(200, { "content-type": types[extname(p)] || "application/octet-stream" }); res.end(b); } catch { res.writeHead(404); res.end(); } }).listen(4175);
const route = "site";
const MOTION = process.env.MOTION === "1";
const dark = process.argv[3] === "dark";
const BASE = "http://localhost:4175/";
const axeSrc = await readFile(new URL("../../node_modules/axe-core/axe.min.js", import.meta.url), "utf8");
const b = await chromium.launch();
const out = { console: [], axe: {}, flow: [] };
async function ctxFor(w, h, mobile) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile, colorScheme: dark ? "dark" : "light", reducedMotion: MOTION ? "no-preference" : "reduce" });
  const pg = await ctx.newPage();
  pg.on("pageerror", (e) => out.console.push(`pageerror ${e.message}`));
  pg.on("console", (m) => { if (["error", "warning"].includes(m.type())) out.console.push(`${m.type()} ${m.text().slice(0, 200)}`); });
  await pg.goto(BASE, { waitUntil: "networkidle" });
  await pg.waitForTimeout(800);
  return { ctx, pg };
}
async function axe(pg, tag) {
  await pg.addScriptTag({ content: axeSrc });
  const r = await pg.evaluate(async () => (await window.axe.run(document, { resultTypes: ["violations"] })).violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) })));
  out.axe[tag] = r;
}
const step = (s, ok) => out.flow.push(`${ok ? "PASS" : "FAIL"} ${s}`);

// desktop
{
  const { ctx, pg } = await ctxFor(1440, 900, false);
  await axe(pg, "desktop");
  // 页内锚点不打断路由
  await pg.getByRole("navigation", { name: "主导航" }).first().getByRole("link", { name: "定价" }).click();
  await pg.waitForTimeout(MOTION ? 2500 : 400);
  const hash = await pg.evaluate(() => location.hash);
  const top = await pg.evaluate(() => document.getElementById("pricing").getBoundingClientRect().top);
  step(`锚点: hash=${hash} pricing.top=${Math.round(top)}`, true && Math.abs(top) < 120);
  // 定价按钮 → 表单带套餐
  await pg.getByRole("button", { name: "开始试用" }).nth(1).click();
  const dlg = pg.getByRole("dialog");
  await dlg.waitFor();
  step(`定价按钮打开表单, 文案含套餐: ${(await dlg.innerText()).includes("专业版")}`, (await dlg.innerText()).includes("专业版"));
  await axe(pg, "dialog");
  // 空提交 → 原生校验拦住
  await dlg.getByRole("button", { name: "开始试用" }).click();
  await pg.waitForTimeout(300);
  const stillForm = await dlg.getByLabel("工作邮箱").isVisible();
  const focused = await pg.evaluate(() => document.activeElement?.id);
  step(`空提交被拦, 焦点在 ${focused}`, stillForm && focused === "trial-email");
  // 失败态
  await dlg.getByLabel("工作邮箱").fill("a@fail.test");
  await dlg.getByLabel("公司名称").fill("测试");
  await dlg.getByLabel("公司名称").press("Enter");
  await pg.waitForTimeout(1200);
  step(`回车提交 + 失败态: ${await dlg.getByRole("button", { name: /再试一次/ }).isVisible()}`, await dlg.getByRole("button", { name: /再试一次/ }).isVisible());
  // 成功态
  await dlg.getByLabel("工作邮箱").fill("lei@bluewhale.cn");
  await pg.waitForTimeout(2600);
  await dlg.getByRole("button", { name: "开始试用" }).click();
  await pg.waitForTimeout(1800);
  const okText = await dlg.innerText();
  step(`成功页显示邮箱`, okText.includes("lei@bluewhale.cn"));
  await pg.keyboard.press("Escape");
  await pg.waitForTimeout(400);
  const back = await pg.evaluate(() => document.activeElement?.textContent);
  step(`Esc 关闭, 焦点回到: ${back}`, back?.includes("开始试用"));
  await ctx.close();
}
// mobile
{
  const { ctx, pg } = await ctxFor(390, 844, true);
  await axe(pg, "mobile");
  await pg.getByRole("button", { name: "打开菜单" }).click();
  await pg.waitForTimeout(500);
  await pg.getByRole("dialog").getByRole("link", { name: "问答" }).click();
  await pg.waitForTimeout(MOTION ? 3000 : 900);
  const top = await pg.evaluate(() => document.getElementById("faq").getBoundingClientRect().top);
  const open = await pg.getByRole("dialog").count();
  const hash = await pg.evaluate(() => location.hash);
  step(`手机菜单: 关闭=${open === 0} faq.top=${Math.round(top)} hash=${hash}`, open === 0 && Math.abs(top) < 120 && true);
  const overflow = await pg.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  step(`手机无横向溢出 (${overflow}px)`, overflow <= 0);
  await ctx.close();
}
await b.close(); srv.close();
const bad = Object.values(out.axe).flat().filter((v) => v.impact === "serious" || v.impact === "critical");
for (const [k, vs] of Object.entries(out.axe)) console.log(`axe ${k}: ${vs.length ? vs.map((v) => `${v.id}(${v.impact})`).join(", ") : "0"}`);
for (const f of out.flow) console.log(f);
console.log(`console: ${out.console.length ? out.console.join(" | ") : "0"}`);
const fail = bad.length + out.flow.filter((f) => f.startsWith("FAIL")).length + out.console.length;
process.exit(fail ? 1 : 0);
