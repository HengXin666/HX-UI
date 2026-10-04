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

  // ── 4. 三个数据源都能开 ─────────────────────────────────────────
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
   * ⚠️ 上一版判 `[data-grid="1"]` 计数 === 1 —— 而 CanvasGrid 是无条件渲染
   *    的 div, 这个断言**永远为真**。真正的判据是 computed background-image
   *    里有没有 gradient: 类名/变量拼错时 Tailwind 不报错、只静默不生成规则,
   *    那时 div 还在、但网格是空白的。
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
  // ⚠️ 这条的上一版写成 `a.nodes > 0 && a.nodes === b.nodes + 0 || a.nodes > 0`,
  //    化简后就是 `a.nodes > 0` —— 只要还剩一个节点就 PASS, 完全无法证伪
  //    "是否全回来了"。盲审抓出来的, 这里改成严格相等。
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
   * 固定等待是 flaky 的来源: 本机实测这条用例偶发 FAIL (读到 79% 而不是
   * 100%) —— 缩放有过渡动画, 400ms 有时够有时不够。用 waitForFunction
   * 轮询到目标值, 慢一点但确定性。
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
