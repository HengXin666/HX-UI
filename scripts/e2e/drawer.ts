/**
 * 文档站窄屏抽屉的焦点归还 e2e.
 *
 * 抽屉由顶栏菜单键打开, 不是 SheetTrigger, 关上后要靠 onCloseAutoFocus 把焦点交还菜单键.
 * 两种关法都要验: 按 Esc, 和点抽屉外的遮罩 (抽屉不带关闭键, 点遮罩就是点关闭).
 * 必须走真实浏览器: 库的 Sheet 等退场动画结束才归还焦点, --dump-dom 的虚拟时间里退场动画不结束.
 *
 * 依赖 docs 的 server (127.0.0.1:5600), 由 run.mjs 负责起.
 */
import { chromium } from "playwright";
import { report } from "./harness.mjs";

const URL_INSTALL = "http://127.0.0.1:5600/#/install";
const VIEWPORT = { width: 390, height: 844 };
const MENU = 'button[aria-controls="docs-navigation"]';
const DRAWER = "#docs-navigation";
const SETTLE_MS = 3000;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: VIEWPORT });
await page.goto(URL_INSTALL, { waitUntil: "networkidle" });
const menu = page.locator(MENU);
await menu.waitFor();

const focusOnMenu = () => page.evaluate((sel) => document.activeElement === document.querySelector(sel), MENU);

/**
 * 打开抽屉, 用 close 关掉, 返回关没关上与焦点是否回到菜单键.
 * .agents/notes/implemented/process/2026-11-08-docs-drawer-focus-e2e.md
 */
async function openThenClose(close) {
  await menu.click();
  await page.locator(DRAWER).waitFor({ state: "visible", timeout: SETTLE_MS });
  await close();
  const closed = await page.locator(DRAWER).waitFor({ state: "detached", timeout: SETTLE_MS }).then(() => true, () => false);
  return { closed, focus: await focusOnMenu() };
}

const steps = [];
const esc = await openThenClose(() => page.keyboard.press("Escape"));
steps.push({ name: "抽屉: Esc 关闭后焦点回到菜单键", ok: esc.closed && esc.focus, expect: "关闭 true, 焦点 true", actual: `关闭 ${esc.closed}, 焦点 ${esc.focus}` });

// 点抽屉右侧的遮罩 (抽屉宽至多 320, 视口 390, 右缘一定落在遮罩上)
const outside = await openThenClose(() => page.mouse.click(VIEWPORT.width - 10, VIEWPORT.height / 2));
steps.push({ name: "抽屉: 点遮罩关闭后焦点回到菜单键", ok: outside.closed && outside.focus, expect: "关闭 true, 焦点 true", actual: `关闭 ${outside.closed}, 焦点 ${outside.focus}` });

await browser.close();
process.exit(report(steps));
