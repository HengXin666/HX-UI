/**
 * 蓝图 e2e 的共享工具。
 *
 * ## 这套测试要证明什么
 *
 * 不是"页面渲染出来了"(那是冒烟), 而是**每个功能真的按预期改变了状态**。
 * 判据永远是"操作前的状态 + 预期变化 == 操作后的状态", 而不是"没报错"。
 *
 * ## 为什么必须走真实浏览器
 *
 * 这套库上一版的失效方式全是**静默**的: 33 个节点渲染成"未知节点"、
 * 撤销按了没反应、hash 参数从来没生效 —— tsc、构建、冒烟**全部是绿的**。
 * 只有真的点、真的按键、真的读 DOM 才能抓到。
 *
 * ## 用法
 *
 *   node scripts/e2e/run.mjs            # 全跑
 *   node scripts/e2e/run.mjs --keep     # 保留截图
 *
 * 依赖 docs 的 dev server (127.0.0.1:5600)。没起会自己起一个。
 */
import { chromium } from "playwright";

export const BASE = "http://127.0.0.1:5600/blueprint.html";
export const SHOTS = new URL("./shots/", import.meta.url).pathname;

/**
 * 一次断言的结果。
 * @typedef {{ name: string, ok: boolean, expect?: string, actual?: string, shot?: string }} Step
 */

export class Harness {
  steps = [];
  /** 收集到的运行时错误 (pageerror + console.error)。 */
  errors = [];
  browser = null;
  page = null;

  async open(hash = "#src=demo") {
    this.browser = await chromium.launch();
    this.page = await this.browser.newPage({ viewport: { width: 1500, height: 900 } });
    // 蓝图是给暗色设计的, 亮色下 UE 高饱和引脚色会被压暗版取代
    await this.page.addInitScript(() => localStorage.setItem("hx-ui-docs-theme", "dark"));
    this.page.on("pageerror", (e) => {
      this.errors.push(e.message);
      this.steps.push({ name: "运行时异常", ok: false, actual: e.message });
    });
    this.page.on("console", (m) => {
      if (m.type() !== "error") return;
      const t = m.text();
      // Vite 的 HMR 噪音不算; 只收集真实的运行时报错
      if (/vite|hmr|\[vite\]/i.test(t)) return;
      this.errors.push(t);
    });
    await this.page.goto(`${BASE}${hash}`, { waitUntil: "networkidle" });
    await this.page.waitForTimeout(1200);
    return this.page;
  }

  get p() {
    if (!this.page) throw new Error("还没 open()");
    return this.page;
  }

  async close() {
    await this.browser?.close();
    this.browser = null;
    this.page = null;
  }

  /**
   * 读图的**可观测状态**。
   *
   * 只读顶栏那行"N 节点 / M 连线"与错误数 —— 那是页面自己的账本,
   * 不是测试自己算的。测自己的算法等于没测。
   */
  async stat() {
    return this.p.evaluate(() => {
      const t = document.body.innerText;
      const m = /(\d+) 节点 \/ (\d+) 连线/.exec(t);
      const e = /(\d+) 个错误/.exec(t);
      return {
        nodes: m ? +m[1] : -1,
        edges: m ? +m[2] : -1,
        errors: e ? +e[1] : 0,
        /**
         * 选中态判据: 节点带一圈 --bp-selected 的描边。
         *
         * ⚠️ 踩过两次坑, 都让这条判据变成恒 0 的死断言:
         *   1. 读 `data-selected="1"` —— 蓝图侧根本没有这个属性。
         *   2. 硬编码 "255, 212, 0" —— 那是**亮色**主题的取值, 而页面跑在
         *      暗色下 (暗色是 #ffd400、亮色是 #b38600)。判据随主题变,
         *      硬编码必然只在半个世界里成立。
         *
         * 现在: 运行时从 CSS 变量读当前主题的真实值, 再拿去比对。
         */
        selected: (() => {
          const token = getComputedStyle(document.documentElement)
            .getPropertyValue("--bp-selected")
            .trim();
          // token 读不到 = 判据失效。返回 -1 让断言红, 而不是静默当"没选中"。
          if (!token) return -1;
          // --bp-selected 是 hex (#ffd400), computed boxShadow 里是 rgb() ——
          // 借一个临时元素让浏览器帮我们换算, 免得自己写 hex->rgb 再错一次
          const probe = document.createElement("div");
          probe.style.color = token;
          document.body.appendChild(probe);
          const rgb = getComputedStyle(probe).color;
          probe.remove();
          return [...document.querySelectorAll("[data-node-kind]")].filter((el) => {
            const sh = getComputedStyle(el).boxShadow;
            return sh && sh !== "none" && sh.includes(rgb);
          }).length;
        })(),
      };
    });
  }

  /**
   * 取一个元素的**实际计算样式**。
   *
   * 视觉断言不能靠"类名里写了 bg-bp-int" —— 类名写错了 Tailwind 不会报错,
   * 只是静默不生成规则。必须读 computed value 才知道颜色到底有没有生效。
   */
  async cssOf(selector, prop) {
    return this.p.evaluate(
      ([sel, p]) => {
        const el = document.querySelector(sel);
        return el ? getComputedStyle(el).getPropertyValue(p) : null;
      },
      [selector, prop]
    );
  }

  /**
   * 数一数画面上出现了多少种不同的颜色 —— 用于"标题栏真的分色了吗"这类
   * 视觉断言。比"有 N 个元素"强: 元素可以都画成同一个色然后照样 PASS。
   */
  async distinctColors(selector, prop = "background-color") {
    return this.p.evaluate(
      ([sel, p]) => {
        const set = new Set();
        for (const el of document.querySelectorAll(sel)) {
          const v = getComputedStyle(el).getPropertyValue(p);
          if (v && v !== "rgba(0, 0, 0, 0)") set.add(v);
        }
        return [...set];
      },
      [selector, prop]
    );
  }

  /** 截一张图, 文件名带步骤号, 便于"预测 vs 实际"逐张对比。 */
  async shot(name) {
    const path = `${SHOTS}${name}.png`;
    await this.p.screenshot({ path });
    return path;
  }

  /**
   * 断言: 跑一个动作, 然后比对状态。
   *
   * @param expect 描述**预期**的变化。"节点 7 -> 8" 这种人能读的话,
   *               失败时一眼看出偏在哪。
   */
  async check(name, act, verify) {
    const before = await this.stat();
    await act();
    await this.p.waitForTimeout(350);
    const after = await this.stat();
    const ok = verify(before, after);
    const shot = await this.shot(`${this.steps.length.toString().padStart(2, "0")}-${name}`);
    this.steps.push({
      name,
      ok,
      expect: JSON.stringify(before),
      actual: JSON.stringify(after),
      shot,
    });
  }
}

/** 汇总打印。退出码 1 = 有失败。 */
export function report(steps) {
  const bad = steps.filter((s) => !s.ok);
  console.log(`\n${"=".repeat(60)}`);
  for (const s of steps) {
    console.log(`${s.ok ? "  PASS" : "  FAIL"}  ${s.name}`);
    if (!s.ok) {
      console.log(`        预期前: ${s.expect ?? "-"}`);
      console.log(`        实际后: ${s.actual ?? "-"}`);
      if (s.shot) console.log(`        截图: ${s.shot}`);
    }
  }
  console.log(`${"=".repeat(60)}`);
  console.log(`e2e: ${steps.length - bad.length}/${steps.length} 通过`);
  return bad.length ? 1 : 0;
}

/** 选中第 n 个节点。 */
/**
 * 选中第 n 个节点。
 *
 * 点**标题栏**而不是卡片根节点: 卡片根节点的中心常常被标题栏/引脚行盖住,
 * Playwright 会判定 "subtree intercepts pointer events" 然后一直重试到超时。
 * 标题栏是卡片里最稳定的一块可点区域。
 */
export async function selectNode(h, index = 0) {
  await h.p.locator("[data-node-kind]").nth(index).locator("xpath=child::div[1]").click();
  await h.p.waitForTimeout(200);
}
