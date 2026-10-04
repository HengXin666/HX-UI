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

// 5. 缩放
{
  await p.locator(".react-flow__controls-zoomin").click();
  await p.waitForTimeout(500);
  const zoom = await p.evaluate(() => {
    const t = document.querySelector(".react-flow__viewport")?.style.transform || "";
    return /scale\(([\d.]+)\)/.exec(t)?.[1] ?? null;
  });
  steps.push({
    name: "RF: 缩放控件生效",
    ok: zoom !== null && +zoom > 1,
    expect: "scale > 1",
    actual: `${zoom}`,
  });
  await p.locator(".react-flow__controls-fitview").click();
  await p.waitForTimeout(400);
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
  const before = await count(".react-flow__edge");
  // n4.a / n4.b 都已被占用 —— 连它们会走"顶替", 总数不变 (见第 10 条)。
  // 这里要测的是"新增", 所以连到 n6 空闲的 msg 输入 (类型 any, 任何值都能进)。
  const src = await handlePos("n2", "o:value");
  const dst = await handlePos("n6", "i:msg");
  if (src && dst) {
    await p.mouse.move(src.x, src.y);
    await p.mouse.down();
    await p.mouse.move(dst.x, dst.y, { steps: 20 });
    await p.waitForTimeout(150);
    await p.mouse.up();
    await p.waitForTimeout(700);
  }
  const after = await count(".react-flow__edge");
  steps.push({
    name: "RF: 合法连线能连上 (连到空闲输入口, +1)",
    ok: after === before + 1,
    expect: `${before} -> ${before + 1}`,
    actual: `${after}`,
    shot: await h.shot("82-rf-connect-ok"),
  });
}

// 8. 非法连线被拒 —— 这条最关键: 证明我们的语义层真的接上去了
{
  const before = await count(".react-flow__edge");
  const src = await handlePos("n2", "o:value");
  const dst = await handlePos("n5", "i:exec-in");
  if (src && dst) {
    await p.mouse.move(src.x, src.y);
    await p.mouse.down();
    await p.mouse.move(dst.x, dst.y, { steps: 20 });
    await p.waitForTimeout(150);
    await p.mouse.up();
    await p.waitForTimeout(700);
  }
  const after = await count(".react-flow__edge");
  steps.push({
    name: "RF: 类型不匹配的连线被 canConnect 拒绝 (语义层已接入)",
    ok: after === before,
    expect: `${before} 不变`,
    actual: `${after}`,
    shot: await h.shot("83-rf-connect-reject"),
  });
}

// 9. 快捷键 —— 换库不能把已锁住的判据换掉
{
  const n = () => p.evaluate(() => {
    const m = /(\d+) 节点/.exec(document.body.innerText);
    return m ? +m[1] : -1;
  });
  await p.locator(".react-flow__node").first().click();
  await p.waitForTimeout(250);
  const base = await n();
  await p.keyboard.press("Control+d");
  await p.waitForTimeout(450);
  const afterDup = await n();
  await p.keyboard.press("Control+z");
  await p.waitForTimeout(450);
  const afterUndo = await n();
  steps.push({
    name: "RF: Ctrl+D 复制 + Ctrl+Z 撤销 (快捷键已接入)",
    ok: afterDup === base + 1 && afterUndo === base,
    expect: `${base} -> ${base + 1} -> ${base}`,
    actual: `${base} -> ${afterDup} -> ${afterUndo}`,
  });

  await p.keyboard.press("Control+a");
  await p.waitForTimeout(350);
  await p.keyboard.press("Delete");
  await p.waitForTimeout(550);
  const afterDel = await n();
  await p.keyboard.press("Control+z");
  await p.waitForTimeout(550);
  const restored = await n();
  steps.push({
    name: "RF: Ctrl+A 全选 + Delete 清空 + 撤销恢复",
    ok: afterDel === 0 && restored > 0,
    expect: `清空到 0, 撤销回到 ${restored}`,
    actual: `清空到 ${afterDel}, 撤销回到 ${restored}`,
    shot: await h.shot("84-rf-shortcuts"),
  });
}

// 10. 独占输入必须顶替, 不能双占 (这条写错了会产出非法图)
{
  const stat = () => p.evaluate(() => {
    const t = document.body.innerText;
    const e = /(\d+) 节点 \/ (\d+) 连线/.exec(t);
    const er = /(\d+) 个错误/.exec(t);
    return { edges: e ? +e[2] : -1, errors: er ? +er[1] : 0 };
  });
  await p.reload();
  await p.waitForTimeout(2500);
  const before = await stat();
  const src = await handlePos("n2", "o:value");
  const dst = await handlePos("n4", "i:b"); // n4.b 已被 n3 占用
  if (src && dst) {
    await p.mouse.move(src.x, src.y);
    await p.mouse.down();
    await p.mouse.move(dst.x, dst.y, { steps: 20 });
    await p.waitForTimeout(150);
    await p.mouse.up();
    await p.waitForTimeout(700);
  }
  const after = await stat();
  steps.push({
    name: "RF: 独占输入被顶替而非双占 (走 applyConnect)",
    ok: after.edges === before.edges && after.errors === 0,
    expect: `连线数 ${before.edges} 不变、错误 0`,
    actual: `连线 ${before.edges}->${after.edges}, 错误 ${after.errors}`,
    shot: await h.shot("85-rf-replaces"),
  });
}

// 11. 拖动必须合并成一步撤销
{
  const n0 = p.locator(".react-flow__node").first();
  const before = await n0.evaluate((e) => e.style.transform);
  const box = await n0.boundingBox();
  await p.mouse.move(box.x + box.width / 2, box.y + 10);
  await p.mouse.down();
  await p.mouse.move(box.x + box.width / 2 + 110, box.y + 85, { steps: 25 });
  await p.mouse.up();
  await p.waitForTimeout(600);
  const moved = await n0.evaluate((e) => e.style.transform);
  await p.keyboard.press("Control+z");
  await p.waitForTimeout(700);
  const after = await n0.evaluate((e) => e.style.transform);
  steps.push({
    name: "RF: 拖动合并成一步 (一次 Ctrl+Z 回原位)",
    ok: moved !== before && after === before,
    expect: `${before} -> 移动 -> 一次撤销回到 ${before}`,
    actual: `${before} -> ${moved} -> ${after}`,
    shot: await h.shot("86-rf-move-coalesce"),
  });
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

// 13. 无运行时错误
steps.push({
  name: "RF: 控制台无错误 (SVG marker 等未误用)",
  ok: h.errors.length === 0,
  expect: "0 条",
  actual: `${h.errors.length} 条: ${h.errors.slice(0, 2).join(" | ")}`,
});

await h.close();
process.exit(report(steps));
