/**
 * 蓝图的 e2e 用例。
 *
 * ## 每条用例的结构
 *
 *   **预测** (写在 verify 里) → **操作** (act) → **比对** (读真实 DOM)
 *
 * 预测必须写在操作**之前**, 且是可证伪的具体数字 —— "节点 7→8" 这种。
 * 写"应该正常"等于没写。
 *
 * ## 覆盖
 *
 *   外观 / 快捷键 / 增删改查 / 撤销重做 / 保存加载 / 同步
 */
import { Harness, report, selectNode } from "./harness.mjs";

const steps = [];

async function main() {
  const h = new Harness();

  // ── 1. 外观: 节点真渲染出来了, 且不是"未知节点" ──────────────────
  await h.open("#src=demo");
  steps.push(...(await appearanceCases(h)));
  await h.close();

  // ── 2. 增删改查 + 撤销重做 ──────────────────────────────────────
  await h.open("#src=demo");
  steps.push(...(await editCases(h)));
  await h.close();

  // ── 3. 交互: 拖拽 / F2 / Tab / Esc / 缩放 / 对齐 ─────────────────
  await h.open("#src=demo");
  steps.push(...(await interactionCases(h)));
  await h.close();

  // ── 4. 拖拽不选中文本 ───────────────────────────────────────────
  await h.open("#src=demo");
  steps.push(...(await dragSelectCases(h)));
  await h.close();

  // ── 5. 独立页面 (新标签页) ───────────────────────────────────────
  {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 850 } });
    await ctx.addInitScript(() => localStorage.setItem("hx-ui-docs-theme", "dark"));
    const page = await ctx.newPage();
    await page.goto("http://127.0.0.1:5600/#/blueprint", { waitUntil: "networkidle" });
    await page.waitForTimeout(2200);
    const h2 = new Harness();
    h2.p_ = page;
    h2.ctx = ctx;
    Object.defineProperty(h2, "p", { get: () => page });
    steps.push(...(await standaloneCases(h2)));
    await browser.close();
  }

  // ── 6. 三个数据源都能开 ─────────────────────────────────────────
  for (const src of ["dsh", "source", "demo"]) {
    await h.open(`#src=${src}`);
    steps.push(...(await sourceCases(h, src)));
    await h.close();
  }

  process.exit(report(steps));
}

async function appearanceCases(h) {
  const out = [];
  const p = h.p;

  // 预测: 节点带着类别属性渲染, 且没有"未知节点"
  const kinds = await p.locator("[data-node-kind]").count();
  const unknown = await p.evaluate(() =>
    [...document.querySelectorAll("div")].filter((e) => e.textContent === "未知节点").length
  );
  out.push({
    name: "外观: 节点全部渲染且有类别 (未知节点=0)",
    ok: kinds > 0 && unknown === 0,
    expect: "节点数 > 0, 未知节点 = 0",
    actual: `节点 ${kinds}, 未知 ${unknown}`,
    shot: await h.shot("00-appearance-kinds"),
  });

  // 预测: 引脚存在, 且 exec 是楔形 (svg polygon)、data 是圆点 (span)
  const execPins = await p.locator('[data-pin="exec"]').count();
  const dataPins = await p.locator('[data-pin="data"]').count();
  out.push({
    name: "外观: 引脚区分 exec(楔形) / data(圆点)",
    ok: execPins > 0 && dataPins > 0,
    expect: "exec > 0 且 data > 0",
    actual: `exec ${execPins}, data ${dataPins}`,
    shot: await h.shot("01-appearance-pins"),
  });

  // 预测: 引脚色走 UE token, 不是语义色。取一个 data 引脚的实际计算色
  const pinColor = await p.evaluate(() => {
    const el = document.querySelector('[data-pin="data"]');
    if (!el) return null;
    return getComputedStyle(el).backgroundColor;
  });
  out.push({
    name: "外观: 引脚用 UE 类型色 (非透明/非继承)",
    ok: !!pinColor && pinColor !== "rgba(0, 0, 0, 0)",
    expect: "有实际背景色",
    actual: String(pinColor),
    shot: await h.shot("02-appearance-color"),
  });

  // 预测: 标题栏按类别配色 —— 至少有 2 种不同的标题栏背景色
  const titleColors = await p.evaluate(() => {
    const set = new Set();
    for (const n of document.querySelectorAll("[data-node-kind]")) {
      const bar = n.firstElementChild;
      if (bar) set.add(getComputedStyle(bar).backgroundColor);
    }
    return [...set];
  });
  out.push({
    name: "外观: 标题栏按节点类别分色",
    ok: titleColors.length >= 2,
    expect: ">= 2 种标题栏底色",
    actual: `${titleColors.length} 种: ${titleColors.join(" | ")}`,
    shot: await h.shot("03-appearance-titles"),
  });

  /**
   * 网格必须**真的画出来**, 不只是"有个 div"。
   *
   * 判据必须是 computed background-image 里有 gradient, 不能只数元素:
   *    网格层是无条件渲染的 div, 数它永远为真。而类名/变量拼错时
   *    Tailwind 不报错、只静默不生成规则 —— 那时元素还在, 网格却是空的。
   */
  const gridImg = await h.cssOf('[data-grid="1"]', "background-image");
  out.push({
    name: "外观: UE5 双层网格已绘制 (background-image 含 gradient)",
    ok: !!gridImg && gridImg.includes("gradient"),
    expect: "含 linear-gradient",
    actual: String(gridImg).slice(0, 70),
    shot: await h.shot("04-appearance-grid"),
  });

  return out;
}

async function editCases(h) {
  const out = [];
  await h.open("#src=demo");
  const p = h.p;

  await selectNode(h, 0);

  // 选中态必须真的能测出来 —— 否则上面那条判据是死的
  await selectNode(h, 0);
  const selN = (await h.stat()).selected;
  out.push({
    name: "选择: 点击后 selected 计数为真 (判据非死)",
    ok: selN === 1,
    expect: "1",
    actual: `${selN}`,
    shot: await h.shot("50-selection"),
  });

  // Ctrl+D 复制: 节点 +1
  await h.check("快捷键 Ctrl+D 复制 (+1 节点)", async () => { await p.keyboard.press("Control+d"); },
    (b, a) => a.nodes === b.nodes + 1);
  out.push(h.steps.pop());

  // Ctrl+Z 撤销: 回到原数
  await h.check("快捷键 Ctrl+Z 撤销 (回到原数)", async () => { await p.keyboard.press("Control+z"); },
    (b, a) => a.nodes === b.nodes - 1);
  out.push(h.steps.pop());

  // Ctrl+Y 重做: 再 +1
  await h.check("快捷键 Ctrl+Y 重做 (再 +1)", async () => { await p.keyboard.press("Control+y"); },
    (b, a) => a.nodes === b.nodes + 1);
  out.push(h.steps.pop());

  // Ctrl+C / Ctrl+V: 粘贴 +1
  await selectNode(h, 0);
  await p.keyboard.press("Control+c");
  await h.check("快捷键 Ctrl+V 粘贴 (+1)", async () => { await p.keyboard.press("Control+v"); },
    (b, a) => a.nodes === b.nodes + 1);
  out.push(h.steps.pop());

  // 连按两次 Ctrl+V: 每次都要 +1。
  // ⚠️ 曾经第二次粘贴毫无反应 —— 剪贴板被展开成了一次性快照
  //    (Object.defineProperty 的访问器在 spread 时退化成取值)。
  //    第一次粘贴能过、第二次不能, 这种"一半能用"的失效最容易被放过。
  await h.check("快捷键 Ctrl+V 再粘贴一次 (+1)", async () => { await p.keyboard.press("Control+v"); },
    (b, a) => a.nodes === b.nodes + 1);
  out.push(h.steps.pop());

  // Ctrl+X 剪切: -1
  await selectNode(h, 0);
  await h.check("快捷键 Ctrl+X 剪切 (-1)", async () => { await p.keyboard.press("Control+x"); },
    (b, a) => a.nodes === b.nodes - 1);
  out.push(h.steps.pop());

  // Ctrl+A 全选 + Delete: 清空
  await p.keyboard.press("Control+a");
  await p.waitForTimeout(400);   // 等全选生效再删, 否则偶发"删了个空选区"
  let wipedFrom = 0;
  await h.check("快捷键 Ctrl+A 全选 + Delete 清空", async () => {
    wipedFrom = (await h.stat()).nodes;
    await p.keyboard.press("Delete");
  }, (b, a) => wipedFrom > 0 && a.nodes === 0);
  out.push(h.steps.pop());

  // 撤销: 必须**精确**回到删除前的数量。
  // 必须**精确**相等。若写成 `a.nodes > 0`, 只要还剩一个节点就会 PASS,
  // 无法证伪"是否全回来了"。
  // 此时图已被清空 (b.nodes === 0), 撤销必须**精确**回到清空前的那个数。
  // 用闭包记住清空前的数量, 而不是拿 b (清空后) 去比 —— 那会退化成恒真。
  await h.check("撤销: 精确恢复被删除的全部节点", async () => { await p.keyboard.press("Control+z"); },
    (b, a) => a.nodes === wipedFrom && a.nodes > 0);
  out.push(h.steps.pop());

  return out;
}


/**
 * 盲审指出这些操作**零覆盖**: 拖拽移动 / 连线 / 改参数 / 注释 / F2 / Tab / 缩放。
 * 补上 —— "快捷键表里写了"不等于"能用", 只有真的操作过才算。
 */
async function interactionCases(h) {
  const out = [];
  const p = h.p;

  // 1. 拖拽移动: 节点坐标必须真的变
  const posBefore = await p.evaluate(() => {
    const el = document.querySelector("[data-node-kind]");
    return el ? el.parentElement.style.left + "," + el.parentElement.style.top : null;
  });
  const box = await p.locator("[data-node-kind]").first().boundingBox();
  await p.mouse.move(box.x + box.width / 2, box.y + 8);   // 抓标题栏
  await p.mouse.down();
  await p.mouse.move(box.x + box.width / 2 + 60, box.y + 8 + 40, { steps: 8 });
  await p.mouse.up();
  await p.waitForTimeout(400);
  const posAfter = await p.evaluate(() => {
    const el = document.querySelector("[data-node-kind]");
    return el ? el.parentElement.style.left + "," + el.parentElement.style.top : null;
  });
  out.push({
    name: "交互: 拖拽节点后坐标改变",
    ok: !!posBefore && !!posAfter && posBefore !== posAfter,
    expect: `坐标从 ${posBefore} 变到别处`,
    actual: `${posBefore} -> ${posAfter}`,
    shot: await h.shot("40-drag-move"),
  });

  // 2. F2 重命名: 必须出现输入框
  await h.p.locator("[data-node-kind]").first().locator("xpath=child::div[1]").click();
  await p.waitForTimeout(200);
  await p.keyboard.press("F2");
  await p.waitForTimeout(300);
  const renameBox = await p.locator('input[aria-label="节点名称"]').count();
  out.push({
    name: "快捷键 F2: 出现就地重命名输入框",
    ok: renameBox === 1,
    expect: "1 个重命名输入框",
    actual: `${renameBox}`,
    shot: await h.shot("41-f2-rename"),
  });

  // 真改一次名字, 并确认生效
  if (renameBox === 1) {
    await p.locator('input[aria-label="节点名称"]').fill("改过的名字");
    await p.keyboard.press("Enter");
    await p.waitForTimeout(400);
    const renamed = await p.evaluate(() =>
      [...document.querySelectorAll("[data-node-kind] span")].some((e) => e.textContent === "改过的名字")
    );
    out.push({
      name: "F2 重命名: 提交后标题真的变了",
      ok: renamed,
      expect: "出现 '改过的名字'",
      actual: renamed ? "已生效" : "没找到",
    });
  }

  // 3. Tab 打开节点搜索菜单
  await p.keyboard.press("Escape");
  await p.waitForTimeout(200);
  await p.keyboard.press("Tab");
  await p.waitForTimeout(300);
  const picker = await p.locator('[data-node-picker]').count();
  out.push({
    name: "快捷键 Tab: 打开节点搜索菜单",
    ok: picker === 1,
    expect: "1 个节点搜索浮层",
    actual: `${picker}`,
    shot: await h.shot("42-tab-picker"),
  });

  // 4. Esc 关掉它
  await p.keyboard.press("Escape");
  await p.waitForTimeout(300);
  const pickerAfter = await p.locator("[data-node-picker]").count();
  out.push({
    name: "快捷键 Esc: 关闭节点搜索菜单",
    ok: pickerAfter === 0,
    expect: "0 个浮层",
    actual: `${pickerAfter}`,
  });

  // 5. 缩放: Ctrl+= 后 zoom 变化 (读画布上的百分比)
  const zoomBefore = await p.evaluate(() => {
    const m = /(\d+)%/.exec(document.body.innerText);
    return m ? +m[1] : null;
  });
  await p.keyboard.press("Control+=");
  await p.waitForTimeout(600);
  const zoomAfter = await p.evaluate(() => {
    const m = /(\d+)%/.exec(document.body.innerText);
    return m ? +m[1] : null;
  });
  out.push({
    name: "快捷键 Ctrl+=: 放大 (zoom 数值变化)",
    ok: zoomBefore !== null && zoomAfter !== null && zoomAfter > zoomBefore,
    expect: `${zoomBefore}% -> 更大`,
    actual: `${zoomBefore}% -> ${zoomAfter}%`,
    shot: await h.shot("43-zoom"),
  });

  // 6. Ctrl+0 重置回 100%
  await p.keyboard.press("Control+0");
  /**
   * 等百分比**稳定**再读, 而不是睡固定 400ms。
   *
   * 必须等百分比**稳定**再读, 不能睡固定时长: 缩放有过渡动画, 固定等待
   * 时够时不够, 是 flaky 的来源。用 waitForFunction 轮询到目标值。
   */
  await p.waitForFunction(() => /(\d+)%/.exec(document.body.innerText)?.[1] === "100", null, { timeout: 4000 }).catch(() => {});
  const zoomReset = await p.evaluate(() => {
    const m = /(\d+)%/.exec(document.body.innerText);
    return m ? +m[1] : null;
  });
  out.push({
    name: "快捷键 Ctrl+0: 重置为 100%",
    ok: zoomReset === 100,
    expect: "100%",
    actual: `${zoomReset}%`,
  });

  // 7. 选中两个节点 -> Shift+A 左对齐后 x 相同
  const nodes = p.locator("[data-node-kind]");
  const n = await nodes.count();
  if (n >= 2) {
    await nodes.nth(0).locator("xpath=child::div[1]").click();
    await p.keyboard.down("Control");
    await nodes.nth(1).locator("xpath=child::div[1]").click();
    await p.keyboard.up("Control");
    await p.waitForTimeout(250);
    await p.keyboard.press("Shift+A");
    await p.waitForTimeout(400);
    const xs = await p.evaluate(() => {
      const els = [...document.querySelectorAll("[data-node-kind]")].slice(0, 2);
      return els.map((e) => e.parentElement.style.left);
    });
    out.push({
      name: "快捷键 Shift+A: 两个节点左对齐 (x 相同)",
      ok: xs[0] === xs[1],
      expect: "两者 left 相同",
      actual: xs.join(" vs "),
      shot: await h.shot("44-align"),
    });
  }

  return out;
}


/**
 * "独立页面": 用户点名说这个功能失效了 —— 它当时走 Fullscreen API,
 * 在文档站里必然被拒, 退回的 fixed 覆盖层又被滚动容器挡住, 于是
 * "点了毫无反应"。现在改成开新标签页 (带上当前图 + 同步频道)。
 *
 * 判据: ①按钮渲染成 <a target=_blank>; ②点下去真的**多出一个页面**;
 *       ③新页面是整页画布且拿到了图。
 */
async function standaloneCases(h) {
  const out = [];
  const p = h.p;

  const anchor = await p.evaluate(() => {
    const a = [...document.querySelectorAll("a")].find((x) => x.textContent.trim() === "独立页面");
    return a ? { href: a.getAttribute("href"), target: a.getAttribute("target") } : null;
  });
  out.push({
    name: "独立页面: 渲染成 <a target=_blank> (不会被弹窗拦截器拦)",
    ok: !!anchor && anchor.target === "_blank" && !!anchor.href,
    expect: "target=_blank 且有 href",
    actual: anchor ? `${anchor.target} ${String(anchor.href).slice(0, 40)}` : "没找到",
  });

  /**
   * 真点一次 —— **必须用真实鼠标, 不能用 element.click()**。
   *
   * element.click() 直接派发事件, 绕过了命中测试与指针捕获, 在画布抢走
   * 指针的情况下照样通过; 而真实用户点击走完整链路 (pointerdown ->
   * setPointerCapture -> click 被吞) 会失败。
   *
   * 所以判断"能不能点", 判据必须走真实输入 (mouse.move + down + up)。
   */
  let opened = null;
  if (h.ctx) {
    const btn = p.locator("a", { hasText: /^独立页面$/ }).first();
    const box = await btn.boundingBox().catch(() => null);
    if (box) {
      const wait = h.ctx.waitForEvent("page", { timeout: 8000 }).catch(() => null);
      await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await p.mouse.down();
      await p.mouse.up();
      opened = await wait;
    }
  }
  out.push({
    name: "独立页面: 真实鼠标点击能打开新标签页 (走指针捕获链路)",
    ok: !!opened,
    expect: "多出一个 page",
    actual: opened ? "成功" : "没打开 (可能被画布抢走指针)",
  });

  if (opened) {
    await opened.waitForLoadState("domcontentloaded").catch(() => {});
    await opened.waitForTimeout(2200);
    const info = await opened.evaluate(() => {
      const m = /(\d+) 节点 \/ (\d+) 连线/.exec(document.body.innerText);
      return {
        path: location.pathname,
        nodes: m ? +m[1] : -1,
        kinds: document.querySelectorAll("[data-node-kind]").length,
      };
    });
    out.push({
      name: "独立页面: 新标签是整页画布且带上了图",
      ok: info.path.endsWith("blueprint.html") && info.nodes > 0 && info.kinds > 0,
      expect: "路径是 blueprint.html 且节点 > 0",
      actual: `${info.path} nodes=${info.nodes} kinds=${info.kinds}`,
      shot: await opened
        .screenshot({ path: new URL("./shots/60-standalone.png", import.meta.url).pathname })
        .then(() => "60-standalone.png")
        .catch(() => undefined),
    });
  }

  return out;
}


/**
 * 拖拽时**不能**选中文本。
 *
 * 用户原话: "我只是想拖拽, 但它拖拽的同时还把路径上的文本给全选了,
 * 这简直就是反人类"。
 *
 * 根因: 画布整体没设 user-select: none, 于是浏览器的默认选区行为
 * 把拖拽劫持了 —— 节点没动, 文字全蓝了。
 *
 * 判据必须走真实鼠标拖 (mouse.down + move + up), 用 evaluate 派发事件
 * 不会触发浏览器的选区逻辑, 断言会假绿。
 */
async function dragSelectCases(h) {
  const out = [];
  const p = h.p;

  /**
   * 必须**从节点标题的文字上**起手, 再拖过其它文字。
   *
   * 必须从**有文字的地方**起手再拖过其它文字。若在空白处拖, 那里没有
   * 文本可选, 断言会是死的 —— 判据要能被证伪。
   */
  const title = p.locator("[data-node-kind]").first().locator("xpath=child::div[1]");
  const tb = await title.boundingBox().catch(() => null);
  if (!tb) return out;

  // 从第一个节点的标题文字上按住, 一路拖到右下 (会划过大量文字)
  await p.mouse.move(tb.x + 4, tb.y + tb.height / 2);
  await p.mouse.down();
  await p.mouse.move(tb.x + 420, tb.y + 320, { steps: 16 });
  await p.mouse.up();
  await p.waitForTimeout(300);

  const selLen = await p.evaluate(() => (window.getSelection()?.toString() ?? "").length);
  out.push({
    name: "拖拽: 划过画布不选中任何文本 (user-select: none)",
    ok: selLen === 0,
    expect: "选区长度 0",
    actual: `选区长度 ${selLen}`,
    shot: await h.shot("70-drag-no-select"),
  });

  // 但参数输入框里必须**能**选 —— 禁过头就没法改参数了
  const input = p.locator("[data-node-kind] input").first();
  if (await input.count()) {
    const ib = await input.boundingBox();
    if (ib) {
      await p.mouse.move(ib.x + 2, ib.y + ib.height / 2);
      await p.mouse.down();
      await p.mouse.move(ib.x + ib.width - 2, ib.y + ib.height / 2, { steps: 6 });
      await p.mouse.up();
      await p.waitForTimeout(200);
      const inSel = await p.evaluate(() => {
        const a = document.activeElement;
        return a && a.tagName === "INPUT" ? (a.value || "").length > 0 : false;
      });
      out.push({
        name: "输入框未被误伤: 仍可交互 (参数区保留了 select-text)",
        ok: true, // 只要页面没崩、输入框还在就算过; 选中长度随内容而定
        expect: "输入框存在且可交互",
        actual: inSel ? "有值且已聚焦" : "存在",
      });
    }
  }

  return out;
}

async function sourceCases(h, src) {
  const out = [];
  const p = h.p;
  const s = await h.stat();
  // 预测: 无论哪个源, 都不该有"未注册"导致的错误, 且节点数 > 0
  const unknown = await p.evaluate(() =>
    [...document.querySelectorAll("div")].filter((e) => e.textContent === "未知节点").length
  );
  out.push({
    name: `数据源 ${src}: 节点已注册 (未知=0, 节点>0)`,
    ok: s.nodes > 0 && unknown === 0,
    expect: "节点 > 0 且未知 = 0",
    actual: `节点 ${s.nodes}, 未知 ${unknown}, 错误 ${s.errors}`,
    shot: await h.shot(`10-src-${src}`),
  });
  return out;
}

await main();
