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
 * 那正是上一版"测试绿但功能坏"的成因。
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

// 7. 合法连线能连上
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
  const src = await handlePos("n2", "o:value");
  const dst = await handlePos("n4", "i:b");
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
    name: "RF: 合法连线能连上 (+1)",
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

// 9. 无运行时错误
steps.push({
  name: "RF: 控制台无错误 (SVG marker 等未误用)",
  ok: h.errors.length === 0,
  expect: "0 条",
  actual: `${h.errors.length} 条: ${h.errors.slice(0, 2).join(" | ")}`,
});

await h.close();
process.exit(report(steps));
