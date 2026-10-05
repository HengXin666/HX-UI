/**
 * React Flow 版画布的 e2e。
 *
 * ## 为什么要单独一套
 *
 * 换库之后, 交互**不再由我们的代码提供** —— 拖拽/缩放/连线/选中全由
 * React Flow 保证。所以这里的判据不是"我们的逻辑对不对", 而是
 * **"这套集成真的通吗"**:
 *
 *   1. 我们的语义层 (类型 DAG / 连线合法性) 有没有真的接上去 ——
 *      这是最容易断的地方: 库给了 isValidConnection 回调, 但忘记接
 *      就等于"什么都能连", 而页面看起来一切正常。
 *   2. 节点/边的数据往返有没有丢端口名 —— 端口名丢了线会连到错的脚上。
 *   3. 换库买到的东西是不是真的拿到了 (拖拽不选中文本、缩放、小地图)。
 *
 * 所有判据走**真实鼠标** —— 用 evaluate 直接派发事件会绕过命中测试,
 * 那样在功能失效时也会通过。
 */
import { Harness, report } from "./harness.mjs";

const steps = [];
const h = new Harness();
await h.open("#src=demo&rf=1");
const p = h.p;

const count = (sel) => p.locator(sel).count();

// 1. 渲染
const nodes = await count(".react-flow__node");
const edges = await count(".react-flow__edge");
steps.push({
  name: "RF: 节点与连线都渲染出来了",
  ok: nodes === 7 && edges === 6,
  expect: "7 节点 / 6 连线",
  actual: `${nodes} / ${edges}`,
  shot: await h.shot("80-rf-render"),
});

// 2. 类别判定 (UE5 标题栏分色的前提)
const kinds = await p.evaluate(() =>
  [...new Set([...document.querySelectorAll("[data-node-kind]")].map((e) => e.getAttribute("data-node-kind")))]
);
steps.push({
  name: "RF: 节点类别已判定 (>=2 种, 供标题栏分色)",
  ok: kinds.length >= 2,
  expect: ">= 2 种",
  actual: kinds.join(","),
});

// 3. 拖拽节点
{
  const n0 = p.locator(".react-flow__node").first();
  const before = await n0.evaluate((e) => e.style.transform);
  const box = await n0.boundingBox();
  await p.mouse.move(box.x + box.width / 2, box.y + 10);
  await p.mouse.down();
  await p.mouse.move(box.x + box.width / 2 + 90, box.y + 70, { steps: 10 });
  await p.mouse.up();
  await p.waitForTimeout(400);
  const after = await n0.evaluate((e) => e.style.transform);
  steps.push({
    name: "RF: 真实鼠标能拖动节点",
    ok: before !== after,
    expect: `${before} -> 别处`,
    actual: after,
    shot: await h.shot("81-rf-drag"),
  });

  // 4. 拖拽不选中文本 (换库买到的东西)
  const selLen = await p.evaluate(() => (window.getSelection()?.toString() ?? "").length);
  steps.push({
    name: "RF: 拖拽不选中文本",
    ok: selLen === 0,
    expect: "选区长度 0",
    actual: `${selLen}`,
  });
}

// 5. 缩放 —— 走快捷键 (UE5 没有缩放按钮条, 靠 Ctrl+= / Ctrl+0 / Home)
{
  const zoomNow = () => p.evaluate(() => {
    const t = document.querySelector(".react-flow__viewport")?.style.transform || "";
    return /scale\(([\d.]+)\)/.exec(t)?.[1] ?? null;
  });
  const z0 = await zoomNow();
  await p.keyboard.press("Control+=");
  await p.waitForTimeout(500);
  const z1 = await zoomNow();
  steps.push({
    name: "RF: Ctrl+= 放大生效 (缩放不依赖按钮条)",
    ok: z1 !== null && z0 !== null && +z1 > +z0,
    expect: `${z0} -> 更大`,
    actual: `${z0} -> ${z1}`,
  });
  await p.keyboard.press("Control+0");
  await p.waitForTimeout(500);
  const z2 = await zoomNow();
  steps.push({
    name: "RF: Ctrl+0 重置为 1:1",
    ok: z2 !== null && Math.abs(+z2 - 1) < 0.01,
    expect: "1",
    actual: `${z2}`,
  });
}

// 6. handle 必须有命中区域 (曾经 size-0 导致完全连不上)
{
  const sz = await p.evaluate(() => {
    const el = document.querySelector(".react-flow__handle");
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  });
  steps.push({
    name: "RF: handle 有可命中区域 (不是 0x0)",
    ok: !!sz && sz.w > 0 && sz.h > 0,
    expect: "宽高 > 0",
    actual: JSON.stringify(sz),
  });
}

/** 取某个 handle 的屏幕坐标 (可指定页面)。 */
async function handlePos2(page, nodeId, hid) {
  return page.evaluate(
    ([n, id]) => {
      const el = document.querySelector(`[data-id="${n}"] [data-handleid="${id}"]`);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    },
    [nodeId, hid]
  );
}

// 7. 合法连线能连上 (连到**空闲**的输入口才算新增)
async function handlePos(nodeId, hid) {
  return p.evaluate(
    ([n, id]) => {
      const el = document.querySelector(`[data-id="${n}"] [data-handleid="${id}"]`);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    },
    [nodeId, hid]
  );
}
{
  /**
   * 独立 harness + 重载: 前面的缩放/拖拽会挪动节点, 硬编码"等 6 条边"
   * 在图被改过时会等到超时 —— 那是判据脆弱, 不是功能坏。
   * 这里只等"边渲染出来", 数量由断言自己动态取。
   */
  await h.close();
  const hc = new Harness();
  await hc.open("#src=demo");
  const pc = hc.p;
  await pc.waitForFunction(
    () => document.querySelectorAll(".react-flow__edge").length > 0,
    null,
    { timeout: 8000 }
  );
  await pc.waitForTimeout(400);
  const before = await pc.locator(".react-flow__edge").count();
  // n4.a / n4.b 都已被占用 —— 连它们会走"顶替", 总数不变 (见第 10 条)。
  // 这里要测的是"新增", 所以连到 n6 空闲的 msg 输入 (类型 any, 任何值都能进)。
  const src = await handlePos2(pc, "n2", "o:value");
  const dst = await handlePos2(pc, "n6", "i:msg");
  if (src && dst) {
    await pc.mouse.move(src.x, src.y);
    await pc.mouse.down();
    await pc.mouse.move(dst.x, dst.y, { steps: 20 });
    await pc.waitForTimeout(150);
    await pc.mouse.up();
    await pc.waitForTimeout(700);
  }
  const after = await pc.locator(".react-flow__edge").count();
  steps.push({
    name: "RF: 合法连线能连上 (连到空闲输入口, +1)",
    ok: after === before + 1,
    expect: `${before} -> ${before + 1}`,
    actual: `${after}`,
    shot: await hc.shot("82-rf-connect-ok"),
  });

  // 8. 非法连线被拒 —— 这条最关键: 证明语义层真的接上去了
  //    (与第 7 条共用 harness: 它依赖"刚连过一条"之后的图)
  {
    const b0 = await pc.locator(".react-flow__edge").count();
    const s2 = await handlePos2(pc, "n2", "o:value");
    const d2 = await handlePos2(pc, "n5", "i:exec-in");
    if (s2 && d2) {
      await pc.mouse.move(s2.x, s2.y);
      await pc.mouse.down();
      await pc.mouse.move(d2.x, d2.y, { steps: 20 });
      await pc.waitForTimeout(150);
      await pc.mouse.up();
      await pc.waitForTimeout(700);
    }
    const a0 = await pc.locator(".react-flow__edge").count();
    steps.push({
      name: "RF: 类型不匹配的连线被 canConnect 拒绝 (语义层已接入)",
      ok: a0 === b0,
      expect: `${b0} 不变`,
      actual: `${a0}`,
      shot: await hc.shot("83-rf-connect-reject"),
    });
  }
  await hc.close();
}

// 9. 快捷键 —— 换库不能把已锁住的判据换掉
{
  /**
   * 用**独立的 harness**: 前面的连线/拖拽用例会挪动节点并改变选择,
   * 后续点击"第一个节点"可能落到空白处, 于是 Ctrl+D 静默无效 ——
   * 那是判据互相污染造成的假失败, 不是功能坏了。
   */
  await h.close();
  const hk = new Harness();
  await hk.open("#src=demo");
  const pk = hk.p;
  // 画布要等 React Flow 完成 fitView 与首次布局, 否则点击会落在旧坐标上
  await pk.waitForTimeout(1500);
  const nk = () => pk.evaluate(() => {
    const m = /(\d+) 节点/.exec(document.body.innerText);
    return m ? +m[1] : -1;
  });
  await pk.locator(".react-flow__node").first().click();
  /**
   * 必须**等选择真正建立**再按快捷键, 不能睡固定时长。
   *
   * 点击到 selected state 生效之间有一帧以上的间隔; 固定等待时够时不够,
   * 于是 Ctrl+D 偶发无效 (选中为空时它会静默返回)。
   */
  /**
   * 等选择**真正建立**: 判据是节点出现 UE5 那圈黄色选中描边。
   *
   * 不能用 .selected 类 —— React Flow 12 不在 DOM 上加这个类, 选中态是
   * 通过 props 传给自定义节点的。也不能睡固定时长, 那会偶发失败。
   */
  await pk.waitForFunction(
    () => {
      const el = document.querySelector(".react-flow__node")?.firstElementChild;
      if (!el) return false;
      return getComputedStyle(el).boxShadow.includes("255, 212, 0");
    },
    null,
    { timeout: 5000 }
  );
  const base = await nk();
  await pk.keyboard.press("Control+d");
  await pk.waitForTimeout(450);
  const afterDup = await nk();
  await pk.keyboard.press("Control+z");
  await pk.waitForTimeout(450);
  const afterUndo = await nk();
  steps.push({
    name: "RF: Ctrl+D 复制 + Ctrl+Z 撤销 (快捷键已接入)",
    ok: afterDup === base + 1 && afterUndo === base,
    expect: `${base} -> ${base + 1} -> ${base}`,
    actual: `${base} -> ${afterDup} -> ${afterUndo}`,
  });

  await pk.keyboard.press("Control+a");
  await pk.waitForTimeout(350);
  await pk.keyboard.press("Delete");
  await pk.waitForTimeout(550);
  const afterDel = await nk();
  await pk.keyboard.press("Control+z");
  await pk.waitForTimeout(550);
  const restored = await nk();
  steps.push({
    name: "RF: Ctrl+A 全选 + Delete 清空 + 撤销恢复",
    ok: afterDel === 0 && restored > 0,
    expect: `清空到 0, 撤销回到 ${restored}`,
    actual: `清空到 ${afterDel}, 撤销回到 ${restored}`,
    shot: await hk.shot("84-rf-shortcuts"),
  });
  await hk.close();
}

// 10. 独占输入必须顶替, 不能双占 (这条写错了会产出非法图)
{
  await h.close();
  const hb = new Harness();
  await hb.open("#src=demo");
  const pb = hb.p;
  const stat = () => pb.evaluate(() => {
    const t = document.body.innerText;
    const e = /(\d+) 节点 \/ (\d+) 连线/.exec(t);
    const er = /(\d+) 个错误/.exec(t);
    return { edges: e ? +e[2] : -1, errors: er ? +er[1] : 0 };
  });
  const before = await stat();
  const src = await handlePos2(pb, "n2", "o:value");
  const dst = await handlePos2(pb, "n4", "i:b"); // n4.b 已被 n3 占用
  if (src && dst) {
    await pb.mouse.move(src.x, src.y);
    await pb.mouse.down();
    await pb.mouse.move(dst.x, dst.y, { steps: 20 });
    await pb.waitForTimeout(150);
    await pb.mouse.up();
    await pb.waitForTimeout(700);
  }
  const after = await stat();
  steps.push({
    name: "RF: 独占输入被顶替而非双占 (走 applyConnect)",
    ok: after.edges === before.edges && after.errors === 0,
    expect: `连线数 ${before.edges} 不变、错误 0`,
    actual: `连线 ${before.edges}->${after.edges}, 错误 ${after.errors}`,
    shot: await hb.shot("85-rf-replaces"),
  });
  await hb.close();
}

// 11. 拖动必须合并成一步撤销
{
  await h.close();
  const hm = new Harness();
  await hm.open("#src=demo");
  const n0 = hm.p.locator(".react-flow__node").first();
  const before = await n0.evaluate((e) => e.style.transform);
  const box = await n0.boundingBox();
  await hm.p.mouse.move(box.x + box.width / 2, box.y + 10);
  await hm.p.mouse.down();
  await hm.p.mouse.move(box.x + box.width / 2 + 110, box.y + 85, { steps: 25 });
  await hm.p.mouse.up();
  await hm.p.waitForTimeout(600);
  const moved = await n0.evaluate((e) => e.style.transform);
  await hm.p.keyboard.press("Control+z");
  await hm.p.waitForTimeout(700);
  const after = await n0.evaluate((e) => e.style.transform);
  steps.push({
    name: "RF: 拖动合并成一步 (一次 Ctrl+Z 回原位)",
    ok: moved !== before && after === before,
    expect: `${before} -> 移动 -> 一次撤销回到 ${before}`,
    actual: `${before} -> ${moved} -> ${after}`,
    shot: await hm.shot("86-rf-move-coalesce"),
  });
  await hm.close();
}

// 12. 注释框必须**看得见** —— 有底色、有层次、与画布能分开
{
  // 注释只在 dsh 图里有, 换一个 harness 打开 (close 后原 page 引用会失效)
  const h2 = new Harness();
  await h2.open("#src=dsh&rf=1");
  const p2 = h2.p;
  const info = await p2.evaluate(() => {
    const c = document.querySelector('[data-id^="cmt:"]');
    if (!c) return null;
    const box = c.firstElementChild;
    const bar = box.children[0];
    const parse = (s) => (s.match(/[\d.]+/g) ?? []).map(Number);
    return {
      canvas: parse(getComputedStyle(document.body).backgroundColor),
      boxBg: parse(getComputedStyle(box).backgroundColor),
      barBg: parse(getComputedStyle(bar).backgroundColor),
      barText: bar.innerText.trim().slice(0, 12),
      bodyText: (box.children[1]?.innerText ?? "").trim().slice(0, 12),
    };
  });
  const lum = (c) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
  const okVisible =
    !!info &&
    Math.abs(lum(info.boxBg) - lum(info.canvas)) > 20 &&
    lum(info.barBg) > lum(info.boxBg) &&
    info.barText.length > 0;
  steps.push({
    name: "RF: 注释框有可见底色 + 标题栏更亮 + 正文渲染 (不是全透明)",
    ok: okVisible,
    expect: "框体与画布亮度差 > 20, 标题栏比框体亮, 有标题与正文",
    actual: info
      ? `画布 ${info.canvas.slice(0, 3)} / 框 ${info.boxBg.slice(0, 3)} / 栏 ${info.barBg.slice(0, 3)}; 标题"${info.barText}" 正文"${info.bodyText}"`
      : "没找到注释",
    shot: await h2.shot("87-rf-comment"),
  });

  // 各 tone 必须是不同的颜色, 否则"换底色"这个能力等于假的
  const tones = await p2.evaluate(() => {
    const names = ["default", "neutral", "primary", "success", "warning", "danger", "info"];
    return names.map((n) =>
      getComputedStyle(document.documentElement).getPropertyValue("--bp-cmt-" + n).trim()
    );
  });
  await h2.close();
  steps.push({
    name: "RF: 注释七种 tone 各不同色",
    ok: tones.every((t) => t.length > 0) && new Set(tones).size === tones.length,
    expect: "7 个不同的色值",
    actual: `${new Set(tones).size} 种: ${tones.slice(0, 3).join(",")}…`,
  });
}

// 13. 右键菜单: 空白 / 节点 / 连线 三类内容各不相同
{
  await h.close();
  const h3 = new Harness();
  await h3.open("#src=demo");
  const p3 = h3.p;
  const items = () => p3.evaluate(() => {
    const m = document.querySelector("[data-context-menu]");
    return m ? [...m.querySelectorAll("button")].map((b) => b.textContent.trim()) : null;
  });

  // 空白
  await p3.mouse.click(1000, 700, { button: "right" });
  await p3.waitForTimeout(400);
  const pane = await items();
  steps.push({
    name: "RF: 右键空白 -> 图菜单 (加注释/粘贴/全选/整理/适应)",
    ok: !!pane && pane.length >= 4 && pane.some((t) => t.includes("加注释")),
    expect: "含'加注释'等多项",
    actual: JSON.stringify(pane),
    shot: await h3.shot("88-rf-menu-pane"),
  });

  // Esc 关闭
  await p3.keyboard.press("Escape");
  await p3.waitForTimeout(300);
  steps.push({ name: "RF: Esc 关闭右键菜单", ok: (await items()) === null, expect: "null", actual: `${await items()}` });

  // 节点
  const nb = await p3.locator(".react-flow__node").first().boundingBox();
  await p3.mouse.click(nb.x + nb.width / 2, nb.y + 8, { button: "right" });
  await p3.waitForTimeout(400);
  const node = await items();
  steps.push({
    name: "RF: 右键节点 -> 节点菜单 (重命名/副本/复制/断线/删除)",
    ok: !!node && node.some((t) => t.includes("重命名")) && node.some((t) => t.includes("删除")),
    expect: "含'重命名'与'删除'",
    actual: JSON.stringify(node),
    shot: await h3.shot("89-rf-menu-node"),
  });

  // 节点菜单真的能删
  const n0 = await p3.evaluate(() => +/(\d+) 节点/.exec(document.body.innerText)[1]);
  await p3.locator("[data-context-menu] button", { hasText: "删除" }).click();
  await p3.waitForTimeout(600);
  const n1 = await p3.evaluate(() => +/(\d+) 节点/.exec(document.body.innerText)[1]);
  steps.push({ name: "RF: 节点菜单的删除真的生效", ok: n1 === n0 - 1, expect: `${n0} -> ${n0 - 1}`, actual: `${n1}` });

  // 连线
  const eb = await p3.locator(".react-flow__edge").first().boundingBox();
  const e0 = await p3.evaluate(() => document.querySelectorAll(".react-flow__edge").length);
  await p3.mouse.click(eb.x + eb.width / 2, eb.y + eb.height / 2, { button: "right" });
  await p3.waitForTimeout(400);
  const edge = await items();
  await p3.locator("[data-context-menu] button", { hasText: "删除这条连线" }).click();
  await p3.waitForTimeout(600);
  const e1 = await p3.evaluate(() => document.querySelectorAll(".react-flow__edge").length);
  steps.push({
    name: "RF: 右键连线 -> 删除这条连线 (真的 -1)",
    ok: !!edge && edge.some((t) => t.includes("删除这条连线")) && e1 === e0 - 1,
    expect: `边 ${e0} -> ${e0 - 1}`,
    actual: `菜单 ${JSON.stringify(edge)} 边 ${e1}`,
    shot: await h3.shot("90-rf-menu-edge"),
  });

  await h3.close();
}

// 14. 注释必须垫在节点**下面**, 但自己仍可见
{
  await h.close();
  const hz = new Harness();
  await hz.open("#src=dsh");
  const pz = hz.p;
  const r = await pz.evaluate(() => {
    const nodes = [...document.querySelectorAll(".react-flow__node")].filter(
      (n) => !n.getAttribute("data-id").startsWith("cmt:")
    );
    let covered = 0;
    for (const n of nodes) {
      const b = n.getBoundingClientRect();
      const top = document.elementsFromPoint(b.x + b.width / 2, b.y + 15)[0];
      const owner = top?.closest?.(".react-flow__node");
      if (owner && owner.getAttribute("data-id").startsWith("cmt:")) covered += 1;
    }
    // 注释自己还得看得见: 取它中心点, 顶层应是注释本身(或其子节点)
    const cmt = document.querySelector('[data-id^="cmt:"]');
    let cmtVisible = false;
    if (cmt) {
      const cb = cmt.getBoundingClientRect();
      const t = document.elementsFromPoint(cb.x + 8, cb.y + cb.height - 8)[0];
      cmtVisible = !!t?.closest?.('[data-id^="cmt:"]');
    }
    return { covered, total: nodes.length, cmtVisible };
  });
  steps.push({
    name: "RF: 注释垫在节点下面 (不糊住节点内容)",
    ok: r.covered === 0 && r.total > 0,
    expect: "0 个节点被注释覆盖",
    actual: `${r.covered}/${r.total} 被覆盖`,
    shot: await hz.shot("92-rf-comment-below"),
  });
  steps.push({
    name: "RF: 注释自身仍可见 (没沉到画布下面)",
    ok: r.cmtVisible,
    expect: "注释中心点命中注释本身",
    actual: `${r.cmtVisible}`,
  });
  await hz.close();
}

// 15. 画布上没有 UE5 里不存在的杂物
{
  await h.close();
  const h4 = new Harness();
  await h4.open("#src=demo");
  const junk = await h4.p.evaluate(() => ({
    minimap: !!document.querySelector(".react-flow__minimap"),
    controls: !!document.querySelector(".react-flow__controls"),
    attribution: !!document.querySelector(".react-flow__attribution"),
  }));
  steps.push({
    name: "RF: 无小地图/缩放按钮/水印 (UE5 没有这些)",
    ok: !junk.minimap && !junk.controls && !junk.attribution,
    expect: "三者都不存在",
    actual: JSON.stringify(junk),
    shot: await h4.shot("91-rf-clean"),
  });
  await h4.close();
}

// 16. 无运行时错误
steps.push({
  name: "RF: 控制台无错误 (SVG marker 等未误用)",
  ok: h.errors.length === 0,
  expect: "0 条",
  actual: `${h.errors.length} 条: ${h.errors.slice(0, 2).join(" | ")}`,
});

await h.close();
process.exit(report(steps));
