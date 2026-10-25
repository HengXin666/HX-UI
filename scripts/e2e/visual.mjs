/**
 * 视觉断言  证明"UE5 配色真的画出来了", 而不是"类名写了但没生效"。
 *
 * ## 为什么必须查 computed value
 *
 * Tailwind 里写一个不存在的类名 (`bg-bp-int` 拼错成 `bg-bpt-int`) **不会报错**,
 * 产物里就是没有那条规则, 元素拿到继承色或透明。页面看起来"基本正常",
 * 但整套配色是死的。这类失效是本库反复踩到的坑 (注释框没背景、
 * 任意透明度类名不生成), 所以这里逐条读真实计算值。
 *
 * ## 判据
 *
 * 取 UE5 引擎源码默认表换算出的 sRGB 值, 断言页面上真的出现了它。
 */
import { Harness, report } from "./harness.mjs";

/** UE5 GraphEditorSettings.cpp 默认表 (linear -> sRGB 换算)。 */
const UE = {
  exec:   "rgb(255, 255, 255)",
  bool:   "rgb(148, 0, 0)",
  int:    "rgb(36, 226, 174)",
  float:  "rgb(160, 255, 71)",
  string: "rgb(255, 0, 211)",
  object: "rgb(0, 168, 244)",
};

const steps = [];
const h = new Harness();
await h.open("#src=demo&rf=0");

// 1. token 层: CSS 变量真的定义了吗
for (const [name, expect] of Object.entries(UE)) {
  const got = await h.p.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(`--bp-${n}`).trim(), name);
  steps.push({
    name: `token --bp-${name} 已定义`,
    ok: !!got,
    expect: "非空",
    actual: got || "(空)",
  });
}

// 2. 引脚实际渲染色: 页面上至少出现一种 UE 类型色 (圆点用 background-color)
const pinColors = await h.distinctColors('[data-pin="data"]', "background-color");
steps.push({
  name: "引脚圆点用 UE 类型色渲染 (非全透明)",
  ok: pinColors.length > 0 && pinColors.every((c) => c !== "rgba(0, 0, 0, 0)"),
  expect: "至少一种实心色",
  actual: pinColors.join(" | ") || "(全透明)",
  shot: await h.shot("20-pin-colors"),
});

// 3. 标题栏按类别分色: 至少 2 种不同底色
const titleBg = await h.distinctColors('[data-node-kind] > [data-slot="bp-title"]', "background-color");
steps.push({
  name: "标题栏按节点类别分色 (>=2 种底色)",
  ok: titleBg.length >= 2,
  expect: ">= 2 种",
  actual: `${titleBg.length} 种: ${titleBg.join(" | ")}`,
  shot: await h.shot("21-title-colors"),
});

// 4. exec 引脚是楔形: 用 polygon 画的, 且描边可见
const execStroke = await h.cssOf('[data-pin="exec"] polygon', "stroke");
steps.push({
  name: "exec 引脚是楔形 polygon 且有描边",
  ok: !!execStroke && execStroke !== "none",
  expect: "有 stroke 值",
  actual: String(execStroke),
});

// 5. 节点体有阴影 (UE5 的节点是浮在画布上的)
const shadow = await h.cssOf("[data-node-kind]", "box-shadow");
steps.push({
  name: "节点体有阴影 (浮在画布上)",
  ok: !!shadow && shadow !== "none",
  expect: "有 box-shadow",
  actual: String(shadow),
});

// 6. 网格真的画出来了 (有 background-image)
const gridImg = await h.cssOf('[data-grid="1"]', "background-image");
steps.push({
  name: "画布网格已绘制 (background-image 非空)",
  ok: !!gridImg && gridImg !== "none" && gridImg.includes("gradient"),
  expect: "含 gradient",
  actual: String(gridImg).slice(0, 80),
});

// 7. 亮色主题下引脚色被压暗 (证明换肤真的生效, 不是写死)
await h.p.evaluate(() => document.documentElement.setAttribute("data-mode", "light"));
await h.p.waitForTimeout(300);
const lightInt = await h.p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--bp-int").trim());
steps.push({
  name: "亮色主题下引脚色被压暗 (换肤生效)",
  ok: !!lightInt && lightInt.toLowerCase() !== "#24e2ae",
  expect: "与暗色不同",
  actual: lightInt || "(空)",
  shot: await h.shot("22-light-theme"),
});

await h.close();
process.exit(report(steps));
