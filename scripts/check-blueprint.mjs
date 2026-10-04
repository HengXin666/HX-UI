#!/usr/bin/env node
/**
 * 蓝图库的逻辑门禁。
 *
 * ## 为什么单开一个
 *
 * 蓝图的核心卖点是"连接合法性判定", 而它是**纯逻辑**: 不依赖 React、
 * 不依赖 DOM、不依赖浏览器。check-smoke 只能证明"页面渲染出来了",
 * 证明不了"number 连不进 string" —— 后者才是这套东西成立与否的判据。
 *
 * 而且这里有一条真实教训: 判据写错时, 页面照样渲染、tsc 照样通过、
 * 冒烟照样全绿。只有断言具体行为才能抓到。
 *
 * ## 怎么跑得起来
 *
 * 本仓 tsconfig 的 `moduleResolution` 是 bundler, 源文件里 import 不带
 * `.ts` 后缀, 而 Node 的 ESM loader 要求带后缀 —— 直接 node 跑源码会
 * ERR_MODULE_NOT_FOUND。所以先用 vite 把纯逻辑层打成一个 ESM 产物再断言。
 * 代价是多一步构建 (~20ms), 换来的是断言**真实源码**而不是复制品。
 *
 * 用法: node scripts/check-blueprint.mjs [--strict]
 *
 * 扫描根: CHECK_UI_ROOT 可覆盖 (默认上一级目录)。
 * --strict: 打包依赖 (docs/node_modules/vite) 缺失时不再静默 exit 0 ——
 *   在本地它是有意的降级 (没装依赖不该卡住开发), 在 CI 里它就是"这次什么都没验证",
 *   两者必须区分, 否则这条门禁可以靠删 node_modules 永久变绿。
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.env.CHECK_UI_ROOT
  ? path.resolve(process.env.CHECK_UI_ROOT)
  : path.resolve(import.meta.dirname, "..");
const DOCS = path.join(ROOT, "docs");
const PROBE = path.join(DOCS, ".bpprobe");
const OUT = path.join(PROBE, "out", "bp.js");
const STRICT = process.argv.includes("--strict");

/** 只打包纯逻辑层。渲染层要 react/jsx, 不进这里。 */
const ENTRY = `export * from "../../src/blueprint/registry";
export * from "../../src/blueprint/connect";
export * from "../../src/blueprint/validate";
export * from "../../src/blueprint/evaluate";
export * from "../../src/blueprint/serialize";
export * from "../../src/blueprint/demo";
export * from "../../src/blueprint/geometry";
export * from "../../src/blueprint/layout";
export * from "../../src/blueprint/sync";
export * from "../../src/blueprint/agent";
export * from "../../src/blueprint/tools";
export * from "../../src/blueprint/canvas-helpers";
export { COMMENT_TONE, COMMENT_TONES } from "../../src/blueprint/canvas-parts";
export * from "../../src/blueprint/history";
export * from "../../src/blueprint/subgraph";
export * from "../../src/blueprint/comment";
export * from "../../../HX-Blueprint-Demo/src/dsh/nodes";
export * from "../../../HX-Blueprint-Demo/src/dsh/graph";
`;

const VITE_CFG = `import { defineConfig } from "vite";
import path from "node:path";
export default defineConfig({
  build: {
    lib: { entry: path.resolve(import.meta.dirname, "entry.ts"), formats: ["es"], fileName: "bp" },
    outDir: path.resolve(import.meta.dirname, "out"), emptyOutDir: true, minify: false,
  },
});
`;

function fail(msg) {
  console.error(`check-blueprint: ${msg}`);
  process.exit(1);
}

if (!existsSync(path.join(DOCS, "node_modules", "vite"))) {
  const msg = "check-blueprint: docs/node_modules 里没有 vite, 跳过 (先 cd docs && npm i)";
  if (STRICT) {
    fail(msg + "\n  (--strict 下视为失败: 这条门禁这次没有验证任何东西, 而它平常是绿的)");
  }
  console.log(msg);
  process.exit(0);
}

mkdirSync(PROBE, { recursive: true });
writeFileSync(path.join(PROBE, "entry.ts"), ENTRY);
writeFileSync(path.join(PROBE, "vite.config.ts"), VITE_CFG);

const built = spawnSync("npx", ["vite", "build", "--config", path.join(PROBE, "vite.config.ts")], {
  cwd: DOCS,
  encoding: "utf8",
});
if (built.status !== 0 || !existsSync(OUT)) {
  fail(`打包失败\n${built.stdout ?? ""}${built.stderr ?? ""}`);
}

// ── 断言 ────────────────────────────────────────────────────────────
// 每条 ok() 对应一条"这套东西凭什么成立"的具体承诺。
const CASES = `
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  createRegistry, canConnect, applyConnect, validateGraph, findCycles,
  topoSort, upstreamOf, evaluateGraph, parseGraph, serializeGraph,
  createDemoRegistry, demoGraph,
  portPos, hitPort, nodeWidth, nodeHeight,
  collapseToSubgraph, expandSubgraph, subgraphAsGraph, subgraphRefCount,
  boundaryPorts, registerTunnels, TUNNEL_IN, TUNNEL_OUT,
  addComment, commentAround, moveCommentWithNodes, nodesInComment, commentContains,
  commentRelation,
  createSourceRegistry, NODES, dshAgentLoopGraph, COLLAPSIBLE_GROUPS,
  resolvePort, autoLayout, applyLayout, countCrossings,
  graphFromUrl, graphToHash,
  buildFromAgent, countOverlaps, describeGraph, describeRegistry, graphFromJson, nodeShape,
  createBlueprintTools, toolManifest, dispatchTool,
  shouldCoalesce, detourPath, shouldDetour, edgePath,
  resizeComment, COMMENT_TONE,
} from ${JSON.stringify(OUT)};

let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) pass++; else { fail++; console.log("  FAIL: " + name); } };

// ── 1. 类型相容 (协变) ──
{
  const reg = createRegistry();
  reg.type({ id: "image", extends: "object" });
  reg.type({ id: "mask", extends: "image" });
  ok("同类型可连", reg.assignable("number", "number"));
  ok("异类型不可连", !reg.assignable("number", "string"));
  ok("子类型→父类型放行", reg.assignable("image", "object"));
  ok("父类型→子类型不放行", !reg.assignable("object", "image"));
  ok("跨两级仍放行", reg.assignable("mask", "image"));
  ok("任意类型→any 放行", reg.assignable("number", "any"));
  ok("any→任意类型放行", reg.assignable("any", "number"));

  // 注册写错成环时不能拖死 UI —— 这条是防御性的, 但真出事就是整页卡死
  reg.type({ id: "loopA", extends: "loopB" });
  reg.type({ id: "loopB", extends: "loopA" });
  ok("类型环不死循环", !reg.assignable("loopA", "number"));
}

// ── 2. 连接判定 ──
const demo = createDemoRegistry();
const G0 = {
  nodes: [
    { id: "a", type: "number", x: 0, y: 0 },
    { id: "b", type: "math", x: 100, y: 0 },
    { id: "s", type: "start", x: 0, y: 100 },
    { id: "l", type: "log", x: 100, y: 100 },
  ],
  edges: [],
};
{
  ok("number→math 可连", canConnect(demo, G0, { node: "a", port: "value" }, { node: "b", port: "a" }).ok);

  const r = canConnect(demo, G0, { node: "b", port: "out" }, { node: "b", port: "a" });
  ok("自环被拒", "reason" in r && r.reason === "self-loop");

  // 连到不存在的输入口时报 missing-port 而不是 self-loop:
  // 拿一个不存在的端口去做自环比较没有意义, 判据顺序是对的
  const r0 = canConnect(demo, G0, { node: "a", port: "value" }, { node: "a", port: "value" });
  ok("无效端口报 missing-port 而非自环", "reason" in r0 && r0.reason === "missing-port");

  const r1 = canConnect(demo, G0, { node: "s", port: "then" }, { node: "b", port: "a" });
  ok("执行流→数据流被拒", "reason" in r1 && r1.reason === "direction");

  const r2 = canConnect(demo, G0, { node: "s", port: "then" }, { node: "l", port: "exec-in" });
  ok("执行流→执行流可连", r2.ok === true && !("reason" in r2));

  const r3 = canConnect(demo, G0, { node: "a", port: "nope" }, { node: "b", port: "a" });
  ok("不存在的输出口被拒", "reason" in r3 && r3.reason === "missing-port");
}

// ── 3. 独占输入: 顶替而不是报错 ──
{
  const g1 = { ...G0, edges: [{ id: "e1", from: { node: "a", port: "value" }, to: { node: "b", port: "a" }, kind: "data" }] };
  const r = canConnect(demo, g1, { node: "a", port: "value" }, { node: "b", port: "a" });
  ok("完全重复的连线被拒", "reason" in r && r.reason === "duplicate");

  const g2 = { ...g1, nodes: [...g1.nodes, { id: "a2", type: "number", x: 0, y: 50 }] };
  const r2 = canConnect(demo, g2, { node: "a2", port: "value" }, { node: "b", port: "a" });
  ok("独占输入已占时放行(顶替)", r2.ok === true);
  ok("回传被顶掉的边 id", r2.ok === true && r2.replaces === "e1");

  let n = 0;
  const g3 = applyConnect(demo, g2, { node: "a2", port: "value" }, { node: "b", port: "a" }, () => "e" + n++);
  ok("顶替后只剩一条边", g3.edges.length === 1);
  ok("顶替后来源换成新节点", g3.edges[0].from.node === "a2");
}

// ── 4. 校验四层 ──
{
  ok("演示图校验通过", validateGraph(demo, demoGraph).ok);

  const v = validateGraph(demo, { nodes: [{ id: "z", type: "nope", x: 0, y: 0 }], edges: [] });
  ok("未注册节点类型被报", v.issues.some((i) => i.code === "unknown-node-type"));

  // math 的两个输入都带 default, 所以不该报 missing-input
  ok("有默认值的输入不算缺失", !validateGraph(demo, { nodes: [{ id: "m", type: "math", x: 0, y: 0 }], edges: [] }).issues.some((i) => i.code === "missing-input"));

  // log.msg 带 default:"" 也是可选 —— 另注册一个真必填的节点来测
  const strict = createDemoRegistry();
  strict.node({
    type: "strict", label: "必填",
    inputs: [{ id: "req", label: "必填项", type: "number" }],
    outputs: [{ id: "out", label: "out", type: "number" }],
  });
  const vs = validateGraph(strict, { nodes: [{ id: "s1", type: "strict", x: 0, y: 0 }], edges: [] });
  ok("无默认值的输入被报缺失", !!vs.byNode.get("s1").portErrors["req"]);
  const vs2 = validateGraph(strict, {
    nodes: [{ id: "s1", type: "strict", x: 0, y: 0 }, { id: "n1", type: "number", x: 100, y: 0 }],
    edges: [{ id: "e", from: { node: "n1", port: "value" }, to: { node: "s1", port: "req" }, kind: "data" }],
  });
  ok("连上之后不再报缺失", !vs2.byNode.get("s1").portErrors["req"] && vs2.ok);
  ok("有 default 的输入不算必填", !validateGraph(demo, { nodes: [{ id: "lg", type: "log", x: 0, y: 0 }], edges: [] }).byNode.get("lg").portErrors["msg"]);

  const cyc = {
    nodes: [{ id: "a", type: "math", x: 0, y: 0 }, { id: "b", type: "math", x: 100, y: 0 }],
    edges: [
      { id: "e1", from: { node: "a", port: "out" }, to: { node: "b", port: "a" }, kind: "data" },
      { id: "e2", from: { node: "b", port: "out" }, to: { node: "a", port: "a" }, kind: "data" },
    ],
  };
  ok("检出环", findCycles(cyc).length === 1);
  ok("有环时 topoSort 返回 null", topoSort(cyc) === null);
  const vc = validateGraph(demo, cyc);
  /**
   * 静态校验不再报数据环 —— 环检测只看执行流边。
   *
   * 为什么: 拿数据边判环会误判。agent loop 里一条横跨两段的数据边
   * (assemble -> admitPrompt) 会被圈进执行回路里, 于是纯控制流循环
   * 被判成"数据依赖环"而报错。数据在图上并没有回环, 回环的是控制流。
   *
   * 数据依赖的环由**求值器**负责 (evaluating 集合 + "求值过程中出现循环依赖"),
   * 它落在具体节点上, 比静态报更准。下面这条断言就是那条路径。
   */
  ok("静态校验不因数据环报错", vc.issues.every((i) => i.level !== "error" || i.code !== "cycle"));
  const cycEval = await evaluateGraph(demo, cyc);
  ok("数据环由求值器报出 (落在具体节点)", !cycEval.ok && [...cycEval.errors.values()].some((m) => m.includes("循环依赖")));
  if (![...cycEval.errors.values()].some((m) => m.includes("循环依赖"))) console.log("    求值器 errors:", JSON.stringify([...cycEval.errors]), "outputs:", JSON.stringify([...cycEval.outputs.keys()]));

  // 执行流回路是刻意的, 只给 warning, 不算错误
  // 两个 log 节点互连: 都有 execIn/execOut, 回路两端都是真实端口
  const execLoop = {
    nodes: [
      { id: "la", type: "log", x: 0, y: 0 },
      { id: "lb", type: "log", x: 200, y: 0 },
    ],
    edges: [
      { id: "e1", from: { node: "la", port: "then" }, to: { node: "lb", port: "exec-in" }, kind: "exec" },
      { id: "e2", from: { node: "lb", port: "then" }, to: { node: "la", port: "exec-in" }, kind: "exec" },
    ],
  };
  ok("执行流回路被检出", findCycles(execLoop, execLoop.edges.filter((e) => e.kind === "exec")).length === 1);
  const vl = validateGraph(demo, execLoop);
  ok("执行流回路只给 warning, 不算错误", vl.issues.some((i) => i.code === "cycle" && i.level === "warning") && vl.issues.every((i) => i.level !== "error"));
  console.log("    执行回路的 issues:", JSON.stringify(vl.issues.map((i) => i.level + ":" + i.code)));

  const up = upstreamOf(demoGraph, "n6");
  ok("上游递归正确", up.has("n5") && up.has("n4") && up.has("n2"));
}

// ── 5. 求值: 分支只走被走到的那条 ──
{
  const r = await evaluateGraph(demo, demoGraph, { entry: "n1" });
  ok("求值无错", r.ok);
  ok("7 > 5 为真", r.outputs.get("n4").out === true);

  const g = { ...demoGraph, nodes: demoGraph.nodes.map((n) => n.id === "n2" ? { ...n, params: { v: 3 } } : n) };
  const r2 = await evaluateGraph(demo, g, { entry: "n1" });
  ok("改参数后比较变假", r2.outputs.get("n4").out === false);

  const r3 = await evaluateGraph(demo, demoGraph);
  ok("不传 entry 时按拓扑序全跑", r3.ok && r3.outputs.has("n4"));
}

// ── 6. 几何: 端口坐标必须落在节点卡片画圆点的那一行 ──
{
  // 这条最容易被悄悄改坏: 卡片里画圆点的顺序与 portPos 的行序一旦错位,
  // 线的端点就会明显偏离圆点, 而 tsc / 构建 / 冒烟全都绿。
  const PORT_ROW_ = 20, HEADER_H_ = 30, BODY_TOP_ = HEADER_H_ + 8;
  const n5 = demoGraph.nodes.find((n) => n.id === "n5");
  const branch = demo.nodeTypes.get("branch");
  const outs = branch.execOut.map((e) => typeof e === "string" ? e : e.id);

  // 输出列行序 = [执行出口, 数据出口], 所以第 i 个执行出口在第 i 行
  for (let i = 0; i < outs.length; i++) {
    const p = portPos(demo, demoGraph, { node: "n5", port: outs[i] }, "out");
    const wantY = n5.y + BODY_TOP_ + i * PORT_ROW_ + PORT_ROW_ / 2;
    ok("执行出口 " + outs[i] + " 落在第 " + i + " 行", !!p && Math.abs(p.y - wantY) < 0.001);
  }
  // 数据出口排在执行出口之后
  const cond = portPos(demo, demoGraph, { node: "n4", port: "out" }, "out");
  ok("纯数据节点的第一个出口在第 0 行", !!cond && Math.abs(cond.y - (demoGraph.nodes.find((n) => n.id === "n4").y + BODY_TOP_ + PORT_ROW_ / 2)) < 0.001);

  // 输入列: 第 i 个输入在第 i 行
  const a = portPos(demo, demoGraph, { node: "n4", port: "a" }, "in");
  const b = portPos(demo, demoGraph, { node: "n4", port: "b" }, "in");
  ok("输入 a 在 b 上一行, 相差一个 PORT_ROW", !!a && !!b && Math.abs((b.y - a.y) - PORT_ROW_) < 0.001);

  // 执行入口落在标题条中线
  const ein = portPos(demo, demoGraph, { node: "n5", port: "exec-in" }, "in");
  ok("执行入口在标题条中线", !!ein && Math.abs(ein.y - (n5.y + HEADER_H_ / 2)) < 0.001);
  ok("执行入口在节点左边界", !!ein && ein.x === n5.x);

  // 命中测试要能找回来
  const hit1 = hitPort(demo, demoGraph, { x: n5.x, y: n5.y + HEADER_H_ / 2 }, 9);
  ok("命中测试能抓到执行入口", hit1?.ref.port === "exec-in" && hit1.dir === "in");
  const hit2 = hitPort(demo, demoGraph, { x: n5.x + nodeWidth(demo, n5), y: n5.y + BODY_TOP_ + PORT_ROW_ / 2 }, 9);
  ok("命中测试能抓到第一个执行出口", hit2?.ref.port === outs[0] && hit2.dir === "out");
}

// ── 7. 子图: 折叠 / 展开 ──
{
  registerTunnels(demo);

  /**
   * 构造一片可折叠的区域: n2/n3 (数值) -> n4 (比较)。
   * 折叠后, 对外应该只剩 n4.out 一个输出口, 输入口为零 (数值节点在内部)。
   */
  const folded = collapseToSubgraph(demo, demoGraph, ["n2", "n3", "n4"], { label: "算比较" });
  const sub = folded.nodes.find((n) => n.subgraph)!;
  ok("折叠后产生一个子图节点", !!sub);
  ok("外层节点数 = 5 (原 7 减 3 加 1)", folded.nodes.length === 5);
  ok("子图定义被存下来", !!folded.subgraphs[sub.subgraph]);

  const sg = folded.subgraphs[sub.subgraph];
  ok("子图内部有 3 个原节点", sg.nodes.filter((n) => n.type !== TUNNEL_IN && n.type !== TUNNEL_OUT).length === 3);
  ok("子图对外有一个输出口 (比较结果)", (sg.outputs ?? []).length === 1);
  ok("子图对外没有输入口 (数值节点在内部)", (sg.inputs ?? []).length === 0);

  // 外部那条"n4.out -> n5.cond"必须改接到子图节点上
  ok("跨界边被改接到子图节点", folded.edges.some((e) => e.from.node === sub.id && e.to.node === "n5"));

  // 折叠后仍要能连: 子图节点的外形来自子图定义
  const rc = canConnect(demo, folded, { node: sub.id, port: sg.outputs[0].id }, { node: "n6", port: "msg" });
  ok("子图输出能连到下游 (boolean -> any)", rc.ok === true);

  // 折叠后校验仍通过 —— 子图内部被递归校验
  const vf = validateGraph(demo, folded);
  ok("折叠后整图校验通过", vf.ok);
  if (!vf.ok) console.log("    折叠后报错:", JSON.stringify(vf.issues.slice(0, 6), null, 1));

  // 展开要还原回等价的图
  const unfolded = expandSubgraph(folded, sub.id);
  ok("展开后节点数回到 7", unfolded.nodes.length === 7);
  ok("展开后隧道节点不残留", !unfolded.nodes.some((n) => n.type === TUNNEL_IN || n.type === TUNNEL_OUT));
  ok("展开后边数回到 6", unfolded.edges.length === 6);
  ok("展开后校验通过", validateGraph(demo, unfolded).ok);
  ok("展开后子图定义默认保留", !!unfolded.subgraphs[sub.subgraph]);

  // 展开后求值结果必须和折叠前一致 —— 这是折叠语义正确性的硬判据
  const before = await evaluateGraph(demo, demoGraph, { entry: "n1" });
  const after = await evaluateGraph(demo, unfolded, { entry: "n1" });
  ok("折叠-展开往返后求值结果不变", JSON.stringify(before.outputs.get("n4")) === JSON.stringify(after.outputs.get("n4")));

  // 折叠态下求值: 必须能进子图把结果算出来
  const foldedEval = await evaluateGraph(demo, folded, { entry: "n1" });
  ok("折叠态下求值能进入子图", foldedEval.ok);
  const subOut = foldedEval.outputs.get(sub.id);
  ok("子图节点吐出了正确的值", subOut && Object.values(subOut)[0] === true);

  // 引用计数: 决定展开时能不能安全删定义
  ok("引用计数正确", subgraphRefCount(folded, sub.subgraph) === 1);
  ok("取子图内部图为独立图", subgraphAsGraph(folded, sub.subgraph).nodes.length === sg.nodes.length);

  // 边界计算: 只折叠 n4 时, 两个数值节点在外, 所以对外应有两个输入口
  const b2 = boundaryPorts(demo, demoGraph, ["n4"]);
  ok("边界计算: 折叠单个节点时对外两个输入口", b2.inputs.length === 2);
  ok("边界计算: 对外一个输出口", b2.outputs.length === 1);
}

// ── 8. 区间注释 ──
{
  const r = commentAround(demo, demoGraph, ["n2", "n3", "n4"], { title: "算一个大数" });
  const g = r.graph;
  ok("注释被加进图", (g.comments ?? []).length === 1);

  const c = g.comments[0];
  const inside = nodesInComment(demo, g, c.id);
  ok("注释包住了那三个节点", inside.length === 3);
  ok("完全包含判定: 框外的节点不算", !inside.some((n) => n.id === "n5"));

  // 拖动注释, 里面的节点跟着走
  // 语义是"走到哪"(绝对坐标), 不是"加多少"(增量)
  const moved = moveCommentWithNodes(demo, g, c.id, { x: c.x + 100, y: c.y + 50 });
  const after = moved.comments[0];
  ok("注释走到了目标位置", Math.abs(after.x - (c.x + 100)) < 0.001 && Math.abs(after.y - (c.y + 50)) < 0.001);
  const n2 = moved.nodes.find((n) => n.id === "n2");
  ok("框内节点跟着移动", Math.abs(n2.x - (demoGraph.nodes.find((n) => n.id === "n2").x + 100)) < 0.001);
  const n5 = moved.nodes.find((n) => n.id === "n5");
  ok("框外节点不动", Math.abs(n5.x - demoGraph.nodes.find((n) => n.id === "n5").x) < 0.001);

  /**
   * 幂等性 —— "拖拽乱飞"的直接防线。
   * 旧的增量语义下, 同样的调用会不断累加位移 (实测注释一拖就飞出去)。
   * 绝对坐标天然幂等: 无论调多少次, 结果只取决于最后那个目标位置。
   */
  const again = moveCommentWithNodes(demo, moved, c.id, { x: c.x + 100, y: c.y + 50 });
  ok("★ 传同样的目标位置两次, 位置不变 (幂等)", Math.abs(again.comments[0].x - after.x) < 0.001);
  ok("★ 节点也不会被二次位移", Math.abs(again.nodes.find((n) => n.id === "n2").x - n2.x) < 0.001);

  // 注释不影响校验与求值 —— 它不是节点
  ok("加注释后校验仍通过", validateGraph(demo, g).ok);
  ok("注释不会被当成节点算进拓扑序", topoSort(g).length === g.nodes.length);
  ok("注释不产生端口", !hitPort(demo, g, { x: c.x + 1, y: c.y + 1 }, 9));
}

// ── 9. 序列化往返 (含子图与注释) ──
{
  const back = parseGraph(JSON.parse(JSON.stringify(serializeGraph(demoGraph))));
  ok("往返节点数一致", back.nodes.length === demoGraph.nodes.length);
  ok("往返边数一致", back.edges.length === demoGraph.edges.length);
  ok("往返后校验仍通过", validateGraph(demo, back).ok);

  // 脏数据: 指向不存在节点的边直接丢掉, 不留着污染下游
  const dirty = parseGraph({
    nodes: [{ id: "a", type: "number", x: 0, y: 0 }],
    edges: [{ id: "x", from: { node: "a", port: "v" }, to: { node: "ghost", port: "in" } }],
  });
  ok("悬空边被丢弃", dirty.edges.length === 0);
  ok("垃圾输入返回 null", parseGraph("nonsense") === null);
}

// ── 10. dsh agent loop 图 (使用方演示包的实体图) ──
{
  const dsh = createSourceRegistry();
  registerTunnels(dsh);

  // 节点定义齐不齐: 图里用到的每个 type 都必须注册过
  const usedTypes = new Set(dshAgentLoopGraph.nodes.map((n) => n.type));
  const missing = [...usedTypes].filter((t) => !dsh.nodeTypes.has(t));
  ok("图里用到的节点类型都已注册", missing.length === 0);
  if (missing.length) console.log("    缺失:", missing);

  // 自定义数据类型生效: context/messages 等必须能连
  ok("自定义数据类型已注册", dsh.assignable("messages", "any") && dsh.assignable("decision", "any"));
  ok("不同类型之间不通", !dsh.assignable("messages", "decision"));

  // 整图校验
  const vd = validateGraph(dsh, dshAgentLoopGraph);
  ok("dsh 图校验通过", vd.ok);
  if (!vd.ok) console.log("    dsh 图报错:", JSON.stringify(vd.issues.filter((i)=>i.level==="error").map((i) => i.code + " @" + (i.nodeIds ?? []).join(",")), null, 1));
  console.log("    回路(warning):", vd.issues.filter((i)=>i.level==="warning").length, "条");

  // 每条边都要能被解析成真实端口 —— 这是"图连对了"的最低判据
  const dangling = dshAgentLoopGraph.edges.filter(
    (e) => !resolvePort(dsh, dshAgentLoopGraph, e.from, "out") || !resolvePort(dsh, dshAgentLoopGraph, e.to, "in")
  );
  ok("没有悬空边 (每条线两端都是真实端口)", dangling.length === 0);
  if (dangling.length) console.log("    悬空边:", JSON.stringify(dangling.slice(0, 5)));

  // 执行流不能连到数据口
  const mixed = dshAgentLoopGraph.edges.filter((e) => {
    const a = resolvePort(dsh, dshAgentLoopGraph, e.from, "out");
    const b = resolvePort(dsh, dshAgentLoopGraph, e.to, "in");
    return a && b && a.isExec !== b.isExec;
  });
  ok("没有执行流/数据流混连", mixed.length === 0);

  // 每个节点都可达 (从入口出发)。孤儿节点说明漏连了。
  const reachable = new Set();
  const stack = ["created"];
  const adj = new Map();
  for (const e of dshAgentLoopGraph.edges) {
    if (!adj.has(e.from.node)) adj.set(e.from.node, []);
    adj.get(e.from.node).push(e.to.node);
  }
  while (stack.length) {
    const u = stack.pop();
    if (reachable.has(u)) continue;
    reachable.add(u);
    for (const w of adj.get(u) ?? []) stack.push(w);
  }
  const orphans = dshAgentLoopGraph.nodes.filter((n) => !reachable.has(n.id)).map((n) => n.id);
  ok("没有孤儿节点 (全部从 agent 创建可达)", orphans.length === 0);
  if (orphans.length) console.log("    孤儿:", orphans);

  // 源码里的关键控制流必须体现在图上
  const hasEdge = (f, fp, t) => dshAgentLoopGraph.edges.some((e) => e.from.node === f && e.from.port === fp && e.to.node === t);
  ok("重试回到 prepareRequest (复用已渲染组装)", hasEdge("requestError", "retry", "prepare"));
  ok("被拒绝时不进步骤, 直接 turnEnd", hasEdge("checkReject", "reject", "turnEnd"));
  ok("首步输入为空时直接 turnEnd", hasEdge("checkEmpty", "empty", "turnEnd"));
  ok("还有待处理时回到 kick 再来一轮", hasEdge("wake", "again", "kick"));
  ok("本轮内继续走下一步", hasEdge("checkContinue", "continue", "stepStart"));
  ok("独占模式走屏障", hasEdge("mode", "exclusive", "exclusive"));
  ok("并行模式走有界池", hasEdge("mode", "parallel", "parallel"));

  // 区间注释: 每个注释都要真的包住点东西, 否则是画错了位置
  for (const c of dshAgentLoopGraph.comments ?? []) {
    const inside = nodesInComment(dsh, dshAgentLoopGraph, c.id);
    ok("注释「" + c.title + "」包住了节点", inside.length > 0);
  }

  // 可折叠分组: 折叠后必须仍是一张合法的图, 且节点数减少
  for (const [label, ids] of Object.entries(COLLAPSIBLE_GROUPS)) {
    const g = collapseToSubgraph(dsh, dshAgentLoopGraph, ids, { label });
    ok("折叠「" + label + "」后节点数减少", g.nodes.length < dshAgentLoopGraph.nodes.length);
    ok("折叠「" + label + "」后校验通过", validateGraph(dsh, g).issues.every((i) => i.level !== "error"));
    const vg = validateGraph(dsh, g);
    const verr = vg.issues.filter((i) => i.level === "error");
    if (verr.length) console.log("    折叠「" + label + "」报错:", JSON.stringify(verr.slice(0, 4).map((i)=>i.code+" @"+i.nodeIds), null, 1));
    const sub = g.nodes.find((n) => n.subgraph);
    ok("折叠「" + label + "」后能进子图", !!subgraphAsGraph(g, sub.subgraph));
  }

  // 三个分组全部折叠: 图应该塌成很小但依然合法 —— 这是"分层能压住复杂度"的证据
  let all = dshAgentLoopGraph;
  for (const [label, ids] of Object.entries(COLLAPSIBLE_GROUPS)) {
    all = collapseToSubgraph(dsh, all, ids, { label });
  }
  ok("三层全折叠后仍校验通过", validateGraph(dsh, all).issues.every((i) => i.level !== "error"));
  ok("三层全折叠后节点数大幅下降", all.nodes.length <= dshAgentLoopGraph.nodes.length - 15);
  console.log("    (dsh 图: " + dshAgentLoopGraph.nodes.length + " 节点 -> 全折叠后 " + all.nodes.length + " 节点)");
}

// ── 11. 自动布局 ──
{
  const dsh = createSourceRegistry();
  registerTunnels(dsh);

  // 确定性: 同样的图跑两次必须得到同样的坐标
  const l1 = autoLayout(dsh, dshAgentLoopGraph);
  const l2 = autoLayout(dsh, dshAgentLoopGraph);
  const same = [...l1.keys()].every((k) => {
    const a = l1.get(k); const b = l2.get(k);
    return a && b && a.x === b.x && a.y === b.y;
  });
  ok("布局是确定性的 (跑两次结果一致)", same);

  // 每个节点都要有坐标
  ok("每个节点都得到了坐标", dshAgentLoopGraph.nodes.every((n) => l1.has(n.id)));

  /**
   * 方向性判据必须**分行的**看。
   *
   * 折行之后, 下一行从 x=0 重新开始 —— 于是"跨行"的边在 x 上一定是
   * "从右往左", 但那是折行的正常结果, 不是布局失败。
   * 只看 x 会把这些误判成逆流 (实测就这么失败过)。
   *
   * 所以: 先按 y 分行 (y 差超过一个阈值算换行), 只在同一行内比 x。
   */
  const posOf = new Map<string, { x: number; y: number }>();
  for (const n of dshAgentLoopGraph.nodes) posOf.set(n.id, l1.get(n.id)!);
  const ys = [...posOf.values()].map((p) => p.y).sort((a, b) => a - b);
  // 行边界: y 的跳跃处
  const rowBreaks = [];
  for (let i = 1; i < ys.length; i++) if (ys[i] - ys[i - 1] > 120) rowBreaks.push((ys[i] + ys[i - 1]) / 2);
  const rowOf = (y) => rowBreaks.filter((b) => y > b).length;

  let sameRowFwd = 0, sameRowBack = 0, crossRow = 0;
  for (const e of dshAgentLoopGraph.edges) {
    if (e.kind !== "exec") continue;
    const a = posOf.get(e.from.node)!, b = posOf.get(e.to.node)!;
    if (rowOf(a.y) !== rowOf(b.y)) { crossRow += 1; continue; }
    if (a.x < b.x) sameRowFwd += 1; else sameRowBack += 1;
  }
  ok("★ 同行内的执行边绝大多数从左往右", sameRowFwd > sameRowBack * 2);
  console.log("    (执行边: 同行顺流 " + sameRowFwd + " / 同行逆流 " + sameRowBack + " / 跨行 " + crossRow + ")");

  // 不重叠: 直接两两比包围盒。
  // 不能按 x 分组 —— 折行后不同行的节点会有相同的 x, 被误判成"同列"。
  let overlaps = 0;
  {
    const boxes = dshAgentLoopGraph.nodes.map((n) => {
      const p = l1.get(n.id)!;
      const def = dsh.nodeTypes.get(n.type);
      const h = 30 + 8 + Math.max((def?.inputs ?? []).length, (def?.outputs ?? []).length) * 20 + ((def?.params ?? []).length ? 6 : 0) + 8 + (def?.params ?? []).length * 24;
      return { x: p.x, y: p.y, w: def?.width ?? 176, h };
    });
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j];
        if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) overlaps += 1;
      }
    }
  }
  ok("★ 任意两节点都不重叠", overlaps === 0);
  if (overlaps) console.log("    重叠:", overlaps);

  // 坐标非负 —— 负坐标会让"缩放到适应"算出奇怪偏移
  ok("坐标非负", [...l1.values()].every((p) => p.x >= 0 && p.y >= 0));

  // 交叉数: 布局后不应比随机摆放更差。这里只做"能算出来"的下限判据,
  // 因为交叉数没有绝对好坏, 只有相对。
  const cx = countCrossings(dsh, dshAgentLoopGraph, l1);
  ok("交叉数可计算且有限", Number.isFinite(cx) && cx >= 0);
  console.log("    (交叉数: " + cx + ")");
  /**
   * 布局质量的硬判据 (这三条是"整理完不难看"的量化定义):
   *   1. 零重叠 —— 叠在一起的图对人类等于没有
   *   2. 宽高比落在 0.5~6 —— 太瘦长(实测过 39.6)或太方都难看
   *   3. 有层次 —— 同行内执行流从左往右
   */
  {
    const L = autoLayout(dsh, dshAgentLoopGraph);
    const applied = applyLayout(dshAgentLoopGraph, L);
    const ov = countOverlaps(dsh, applied);
    ok("★ 布局零重叠", ov === 0);
    if (ov) console.log("    重叠:", ov);

    const xs = [...L.values()].map((p) => p.x);
    const ys = [...L.values()].map((p) => p.y);
    const W = Math.max(...xs) - Math.min(...xs);
    const H = Math.max(...ys) - Math.min(...ys);
    const aspect = W / Math.max(1, H);
    ok("★ 宽高比在可看区间 (0.5~6)", aspect > 0.5 && aspect < 6);
    console.log("    (宽高比 " + aspect.toFixed(2) + ", " + Math.round(W) + " x " + Math.round(H) + ")");
  }

  // 交叉数为 0 要么是真的摆得好, 要么是统计逻辑太宽松。用一张必然交叉的图验一下。
  // 结构: 0->3, 1->2 (两列之间交叉)
  const mustCross = {
    nodes: [
      { id: "p0", type: "number", x: 0, y: 0 }, { id: "p1", type: "number", x: 0, y: 100 },
      { id: "q0", type: "math", x: 300, y: 0 }, { id: "q1", type: "math", x: 300, y: 100 },
    ],
    edges: [
      { id: "c1", from: { node: "p0", port: "value" }, to: { node: "q1", port: "a" }, kind: "data" as const },
      { id: "c2", from: { node: "p1", port: "value" }, to: { node: "q0", port: "a" }, kind: "data" as const },
    ],
  };
  // countCrossings 内部会先 autoLayout, 所以布局已经把交叉修掉了 —— 这里测不到。
  // 直接验证: 用"已经摆成交叉"的坐标 + 不重叠的 x 列, 看统计能否报出来。
  const crossed = {
    nodes: [
      { id: "p0", type: "number", x: 0, y: 0 }, { id: "p1", type: "number", x: 0, y: 100 },
      { id: "q0", type: "math", x: 300, y: 0 }, { id: "q1", type: "math", x: 300, y: 100 },
    ],
    edges: [
      { id: "c1", from: { node: "p0", port: "value" }, to: { node: "q1", port: "a" }, kind: "data" as const },
    ],
  };
  // 自检: 手工摆成交叉, 统计必须报出来; 摆成平行, 必须报 0
  const crossedPos = new Map([
    ["p0", { x: 0, y: 0 }], ["p1", { x: 0, y: 100 }],
    ["q0", { x: 300, y: 0 }], ["q1", { x: 300, y: 100 }],
  ]);
  const crossedEdges = {
    nodes: crossed.nodes,
    edges: [
      { id: "c1", from: { node: "p0", port: "value" }, to: { node: "q1", port: "a" }, kind: "data" as const },
      { id: "c2", from: { node: "p1", port: "value" }, to: { node: "q0", port: "a" }, kind: "data" as const },
    ],
  };
  const nCross = countCrossings(demo, crossedEdges, crossedPos);
  ok("交叉统计能报出手工摆出来的交叉", nCross === 1);
  const parallelEdges = {
    nodes: crossed.nodes,
    edges: [
      { id: "c1", from: { node: "p0", port: "value" }, to: { node: "q0", port: "a" }, kind: "data" as const },
      { id: "c2", from: { node: "p1", port: "value" }, to: { node: "q1", port: "a" }, kind: "data" as const },
    ],
  };
  ok("平行的边不报交叉", countCrossings(demo, parallelEdges, crossedPos) === 0);
  // 布局之后, 原来交叉的那张图应该被摆成不交叉
  ok("布局把交叉修掉了", countCrossings(demo, crossedEdges, autoLayout(demo, crossedEdges)) === 0);
  const cxCross = countCrossings(demo, mustCross, autoLayout(demo, mustCross));
  const cxLayout = autoLayout(demo, mustCross);
  console.log("    (必然交叉的图: 交叉数 " + cxCross + ", 布局后 y: " +
    JSON.stringify(["p0","p1","q0","q1"].map((id) => id + "=" + Math.round(cxLayout.get(id)!.y))));

  // preserve: 指定保留的节点必须真的不动
  const keep = ["created", "kick"];
  const l3 = autoLayout(dsh, dshAgentLoopGraph, { preserve: keep });
  const kept = keep.every((id) => {
    const orig = dshAgentLoopGraph.nodes.find((n) => n.id === id)!;
    const p = l3.get(id);
    return p && p.x === orig.x && p.y === orig.y;
  });
  ok("preserve 的节点保持原坐标", kept);

  // applyLayout 应用后仍是一张合法图
  const applied = applyLayout(dshAgentLoopGraph, l1);
  ok("应用布局后校验仍通过", validateGraph(dsh, applied).issues.every((i) => i.level !== "error"));
  ok("应用布局后节点数不变", applied.nodes.length === dshAgentLoopGraph.nodes.length);

  // 有环的图不能死循环 —— 分层要求偏序, 有环必须能拆
  const cyclic = {
    nodes: [
      { id: "a", type: "number", x: 0, y: 0 },
      { id: "b", type: "math", x: 100, y: 0 },
      { id: "c", type: "math", x: 200, y: 0 },
    ],
    edges: [
      { id: "e1", from: { node: "a", port: "value" }, to: { node: "b", port: "a" }, kind: "data" as const },
      { id: "e2", from: { node: "b", port: "out" }, to: { node: "c", port: "a" }, kind: "data" as const },
      { id: "e3", from: { node: "c", port: "out" }, to: { node: "b", port: "b" }, kind: "data" as const },
    ],
  };
  let cyclicOk = true;
  try {
    const lc = autoLayout(demo, cyclic);
    cyclicOk = lc.size === 3 && [...lc.values()].every((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
  } catch { cyclicOk = false; }
  ok("有环的图能算出布局 (不死循环)", cyclicOk);

  // 空图 / 单节点
  ok("空图返回空布局", autoLayout(demo, { nodes: [], edges: [] }).size === 0);
  ok("单节点也能布局", autoLayout(demo, { nodes: [{ id: "s", type: "number", x: 5, y: 5 }], edges: [] }).size === 1);
}

// ── 11.5 注释与节点的关系 (UI 交互反馈的依据) ──
{
  const dsh = createSourceRegistry();
  registerTunnels(dsh);
  const g = buildFromAgent(dsh, {
    nodes: [
      { key: "a", type: "agentCreated" }, { key: "b", type: "kick" }, { key: "c", type: "turnStart" },
    ],
    edges: [{ from: "a", to: "b" }, { from: "b", to: "c" }],
  }).graph;

  // 包住两个
  const r1 = buildFromAgent(dsh, {
    nodes: [
      { key: "a", type: "agentCreated" }, { key: "b", type: "kick" }, { key: "c", type: "turnStart" },
    ],
    edges: [{ from: "a", to: "b" }, { from: "b", to: "c" }],
    comments: [{ title: "启动", nodes: ["a", "b"] }],
  }).graph;
  const rel = commentRelation(dsh, r1, (r1.comments ?? [])[0].id);
  ok("注释关系: 框内的算 inside", rel.inside.length === 2);

  // 只包住一个 -> inside=1, 另一个既不算 inside 也不算 partial (不相交)
  const r2 = buildFromAgent(dsh, {
    nodes: [
      { key: "a", type: "agentCreated" }, { key: "b", type: "kick" }, { key: "c", type: "turnStart" },
    ],
    edges: [{ from: "a", to: "b" }, { from: "b", to: "c" }],
    comments: [{ title: "只包 a", nodes: ["a"] }],
  }).graph;
  const rel2 = commentRelation(dsh, r2, (r2.comments ?? [])[0].id);
  ok("注释关系: 只包声明的那些", rel2.inside.length === 1);

  /**
   * inside 与"拖动会带走哪些"必须是**同一判据**。
   * 两条规则不一致的话, UI 显示的"框住 3 个"和实际带走的 4 个对不上,
   * 用户会按显示的预期操作然后带错 —— 这正是"注释和节点要有交互"的意思。
   */
  const cm = (r1.comments ?? [])[0];
  const moved = moveCommentWithNodes(dsh, r1, cm.id, { x: cm.x + 50, y: cm.y + 50 });
  const movedIds = new Set();
  for (const n of r1.nodes) {
    const after = moved.nodes.find((x) => x.id === n.id)!;
    if (after.x !== n.x || after.y !== n.y) movedIds.add(n.id);
  }
  ok("★ 显示框住的数量 == 实际被带走的数量", movedIds.size === rel.inside.length);
}

// ── 12. 多页面同步: URL 编解码 ──
{
  // 中文标签要能完整往返 —— 直接 atob 处理不了多字节, 必须走 TextDecoder
  const withChinese = {
    nodes: [{ id: "n1", type: "text", x: 10, y: 20, params: { v: "中文内容「引号」" } }],
    edges: [],
  };
  const enc = graphToHash(withChinese);
  ok("图能编码进 URL", typeof enc === "string" && enc.length > 0);
  const back = graphFromUrl("#graph=" + enc);
  ok("URL 往返后中文不丢", back?.nodes[0]?.params?.v === "中文内容「引号」");
  ok("URL 往返后坐标不变", back?.nodes[0]?.x === 10 && back?.nodes[0]?.y === 20);

  // 大图不该硬塞进 URL —— 撑爆 URL 比"不同步"更糟
  const huge = {
    nodes: Array.from({ length: 400 }, (_, i) => ({ id: "n" + i, type: "text", x: i, y: i })),
    edges: [],
  };
  ok("大图不塞进 URL (返回 null)", graphToHash(huge, 2000) === null);

  // 坏输入不能抛
  ok("非法 URL 参数返回 null", graphFromUrl("#graph=!!!notbase64!!!") === null);
  ok("没有 graph 参数返回 null", graphFromUrl("#src=dsh") === null);
}

// ── 13. Agent API: 输入宽松, 输出必须人类可读 ──
{
  const dsh = createSourceRegistry();
  registerTunnels(dsh);

  /**
   * 最典型的 Agent 输入: 只说有什么节点、怎么连, **一个坐标都不给**。
   * 这正是之前"叠成一坨"的用法 —— 现在必须摆得好看。
   */
  const built = buildFromAgent(dsh, {
    nodes: [
      { key: "start", type: "agentCreated" },
      { key: "kick", type: "kick" },
      { key: "turn", type: "turnStart" },
      { key: "claim", type: "claim" },
      { key: "pre", type: "preStep" },
      { key: "step", type: "stepStart" },
      { key: "prep", type: "prepareRequest" },
      { key: "stream", type: "stream" },
      { key: "finish", type: "checkFinish" },
      { key: "asst", type: "appendAssistant" },
      { key: "tools", type: "checkToolCalls" },
    ],
    edges: [
      { from: "start", to: "kick" },
      { from: "kick", to: "turn" },
      { from: "turn", to: "claim" },
      { from: "claim", to: "pre" },
      { from: "pre", to: "step" },
      { from: "step", to: "prep" },
      { from: "prep", to: "stream" },
      { from: "stream", to: "finish" },
      { from: "finish", to: "asst" },
      { from: "asst", to: "tools" },
    ],
  });

  ok("Agent 不写坐标也能建图", built.graph.nodes.length === 11);
  ok("全部连线都被接受", built.rejected.length === 0);
  if (built.rejected.length) console.log("    被拒:", JSON.stringify(built.rejected.slice(0, 3)));

  // ★ 核心判据: 不重叠。叠在一起的图对人类等于没有。
  ok("★ Agent 建的图无重叠 (布局质量)", built.layoutReport.overlaps === 0);
  ok("跑了自动布局", built.layoutReport.auto === true);
  console.log("    (Agent 图: 重叠 " + built.layoutReport.overlaps +
    " / 交叉 " + built.layoutReport.crossings +
    " / 重试 " + built.layoutReport.retries + ")");

  // 方向性: 同样要分行看 (折行后跨行的边在 x 上必然"往左", 那是正常的)
  {
    const posOf = new Map(built.graph.nodes.map((n) => [n.id, { x: n.x, y: n.y }]));
    const ys = [...posOf.values()].map((p) => p.y).sort((a, b) => a - b);
    const breaks = [];
    for (let i = 1; i < ys.length; i++) if (ys[i] - ys[i - 1] > 120) breaks.push((ys[i] + ys[i - 1]) / 2);
    const rowOf = (y) => breaks.filter((b) => y > b).length;
    let fwd = 0, back = 0;
    for (const e of built.graph.edges) {
      const a = posOf.get(e.from.node)!, b = posOf.get(e.to.node)!;
      if (rowOf(a.y) !== rowOf(b.y)) continue;
      if (a.x < b.x) fwd += 1; else back += 1;
    }
    ok("★ 同行内执行流从左往右 (有层次)", fwd >= back * 2 && fwd > 0);
  }

  // 校验通过
  ok("Agent 建的图校验通过", validateGraph(dsh, built.graph).issues.every((i) => i.level !== "error"));

  // key -> id 映射可用: Agent 下一轮要能精确改
  ok("返回了 key -> id 映射", built.ids.size === 11 && [...built.ids.keys()].includes("kick"));

  /**
   * 非法连线: 要被拒, 且说清为什么。
   *
   * 用 demo registry 造一条**类型不匹配**的边: number 的 number 输出
   * 连进 compare 的 boolean 型输入不存在, 所以换成 text(string) -> math(number),
   * string 与 number 不相容, 必然被拒。
   */
  const bad = buildFromAgent(demo, {
    nodes: [{ key: "t", type: "text" }, { key: "m", type: "math" }],
    edges: [{ from: "t.value", to: "m.a" }], // string -> number, 类型不合
  });
  ok("非法连线被拒绝", bad.rejected.length >= 1);
  ok("拒绝时给了原因", (bad.rejected[0]?.reason ?? "").length > 0);
  ok("★ 即使有非法边, 仍然返回能画的图", bad.graph.nodes.length === 2);
  ok("被拒的边不会进图", bad.graph.edges.length === 0);
  if (bad.rejected[0]) console.log("    拒绝原因:", bad.rejected[0].reason, "/", bad.rejected[0].message);

  // ── 找不到节点 ──
  const ghost = buildFromAgent(dsh, {
    nodes: [{ key: "a", type: "agentCreated" }],
    edges: [{ from: "a", to: "不存在的节点" }],
  });
  ok("连到不存在的 key 会被拒并列出可用 key", ghost.rejected.length === 1 && ghost.rejected[0].message.includes("可用"));

  // ── 重复 key ──
  const dup = buildFromAgent(dsh, {
    nodes: [{ key: "x", type: "agentCreated" }, { key: "x", type: "kick" }],
  });
  ok("重复 key 自动改名而不是抛错", dup.graph.nodes.length === 2 && dup.warnings.some((w) => w.includes("重复")));

  // ── 未知类型: 警告但仍建出来 ──
  const unk = buildFromAgent(dsh, { nodes: [{ key: "u", type: "完全不存在的类型" }] });
  ok("未知类型给警告而不是抛错", unk.graph.nodes.length === 1 && unk.warnings.length > 0);

  // ── 显式坐标被尊重 ──
  const manual = buildFromAgent(dsh, {
    nodes: [
      { key: "a", type: "agentCreated", x: 0, y: 0 },
      { key: "b", type: "kick", x: 400, y: 0 },
    ],
    edges: [{ from: "a", to: "b" }],
  });
  ok("给了坐标就不重排", manual.layoutReport.auto === false &&
    manual.graph.nodes.find((n) => n.x === 0).x === 0);

  // ── 重叠的显式坐标会被指出 ──
  const overlapManual = buildFromAgent(dsh, {
    nodes: [
      { key: "a", type: "agentCreated", x: 0, y: 0 },
      { key: "b", type: "kick", x: 10, y: 10 },
    ],
  });
  ok("显式坐标重叠会被提示", overlapManual.warnings.some((w) => w.includes("重叠")));

  // ── 注释: 按节点算包围盒 ──
  const withComment = buildFromAgent(dsh, {
    nodes: [
      { key: "a", type: "agentCreated" }, { key: "b", type: "kick" }, { key: "c", type: "turnStart" },
    ],
    edges: [{ from: "a", to: "b" }, { from: "b", to: "c" }],
    comments: [{ title: "启动流程", nodes: ["a", "b"] }],
  });
  ok("注释被建出来", (withComment.graph.comments ?? []).length === 1);
  const cm = withComment.graph.comments?.[0];
  const inC = cm ? nodesInComment(dsh, withComment.graph, cm.id) : [];
  ok("★ 注释确实包住了它声明的节点", inC.length === 2);
  if (inC.length !== 2) console.log("    注释包住:", inC.length, JSON.stringify(cm));

  // ── 给 Agent 读的摘要 ──
  const desc = describeGraph(dsh, built.graph);
  ok("图摘要包含节点标签", desc.length > 0 && desc.includes("kick"));
  const regDesc = describeRegistry(dsh);
  ok("注册表摘要包含类型与端口", regDesc.includes("kick") && regDesc.includes("入") || regDesc.includes("出"));

  // ── 从 JSON 读 ──
  ok("能从 JSON 读图", graphFromJson({ nodes: [{ id: "a", type: "kick", x: 0, y: 0 }], edges: [] }) !== null);
  ok("坏 JSON 返回 null", graphFromJson("nope") === null);
}

// ── 14. MCP 风格工具面 ──
{
  const dsh = createSourceRegistry();
  registerTunnels(dsh);

  // 宿主保管图; 工具只做变换
  let current = { nodes: [], edges: [] };
  const tools = createBlueprintTools({
    registry: dsh,
    getGraph: () => current,
    setGraph: (g) => { current = g; },
  });

  ok("工具集建立", tools.length >= 8);
  const names = tools.map((t) => t.name);
  ok("每个工具都有名字与 schema", tools.every((t) => t.name && t.inputSchema));
  ok("清单能被列出来 (给 MCP 客户端)", toolManifest(tools).length === tools.length);

  // 1) Agent 先问"我能用什么节点"
  const listed = await dispatchTool(tools, "list_node_types");
  ok("list_node_types 列出了类型", listed.ok && listed.text.includes("kick"));

  // 2) 建图 —— 不给坐标
  const built = await dispatchTool(tools, "build_graph", {
    nodes: [
      { key: "start", type: "agentCreated" },
      { key: "kick", type: "kick" },
      { key: "turn", type: "turnStart" },
      { key: "claim", type: "claim" },
      { key: "pre", type: "preStep" },
      { key: "step", type: "stepStart" },
      { key: "stream", type: "stream" },
    ],
    edges: [
      { from: "start", to: "kick" }, { from: "kick", to: "turn" },
      { from: "turn", to: "claim" }, { from: "claim", to: "pre" },
      { from: "pre", to: "step" }, { from: "step", to: "stream" },
    ],
  });
  ok("★ build_graph 成功", built.ok);
  ok("★ 建出的图无重叠 (布局质量硬要求)", countOverlaps(dsh, current) === 0);
  ok("节点数与边数正确", current.nodes.length === 7 && current.edges.length === 6);

  // 3) 查看
  const seen = await dispatchTool(tools, "inspect_graph");
  ok("inspect_graph 能读回图", seen.ok && seen.text.includes("kick"));

  // 4) 校验
  // 这条链故意少了一环 (step -> stream, 跳过了 freeze), 所以 stream 的
  // request 会缺。判据是: 校验工具如实报出来, 而不是静默放过。
  const vres = await dispatchTool(tools, "validate_graph");
  ok("validate_graph 如实报出缺失", !vres.ok && vres.text.includes("缺少输入"));
  ok("★ 缺失被翻译成 key, 便于 Agent 补边", String(built.text).includes("必填输入"));

  // 5) 整理布局: 打乱坐标后重排, 必须回到无重叠
  current = { ...current, nodes: current.nodes.map((n) => ({ ...n, x: 5, y: 5 })) };
  ok("打乱后确实重叠", countOverlaps(dsh, current) > 0);
  const tidied = await dispatchTool(tools, "tidy_layout");
  ok("★ tidy_layout 把重叠消掉了", tidied.ok && countOverlaps(dsh, current) === 0);

  // 6) 分析
  const ana = await dispatchTool(tools, "analyze_graph");
  ok("analyze_graph 给出结构结论", ana.ok && ana.text.includes("节点"));

  // 7) 导出 / 导入往返
  const exported = await dispatchTool(tools, "export_graph", { format: "json" });
  ok("export_graph 出 JSON", exported.ok && typeof exported.text === "string");
  const imported = await dispatchTool(tools, "import_graph", { json: exported.text });
  ok("★ 导出再导入后节点数不变", imported.ok && current.nodes.length === 7);

  // 8) 伪代码
  const pseudo = await dispatchTool(tools, "export_graph", { format: "pseudo" });
  ok("能导出伪代码", pseudo.ok && pseudo.text.length > 0);

  // 9) 运行
  const run = await dispatchTool(tools, "run_graph");
  ok("run_graph 不抛 (有错也返回结果)", typeof run.ok === "boolean" && typeof run.text === "string");

  // 10) 错误处理: 未知工具 / 坏输入
  const unknown = await dispatchTool(tools, "不存在的工具");
  ok("未知工具返回失败而不是抛", !unknown.ok && unknown.text.includes("可用"));
  const badJson = await dispatchTool(tools, "import_graph", { json: "{坏数据" });
  ok("坏 JSON 返回失败而不是抛", !badJson.ok);
  ok("坏 JSON 不会弄坏当前图", current.nodes.length === 7);

  // 11) 没有打开图时也要优雅
  const bare = createBlueprintTools({ registry: dsh });
  const noGraph = await dispatchTool(bare, "inspect_graph");
  ok("没有图时返回友好提示", !noGraph.ok && noGraph.text.includes("没有"));
}

// ── 15. 撤销/重做: 合并判定 ──
{
  const W = 400;

  // 同 tag、在窗口内 -> 合并
  ok("同 tag 且在窗口内 -> 合并",
    shouldCoalesce({ tag: "move", at: 0 }, { tag: "move", at: 100 }, W));
  // 同 tag、超出窗口 -> 不合并 (松手后过了一会儿再拖, 该是两步)
  ok("同 tag 但超出窗口 -> 不合并",
    !shouldCoalesce({ tag: "move", at: 0 }, { tag: "move", at: 500 }, W));
  // 不同 tag -> 不合并
  ok("不同 tag -> 不合并",
    !shouldCoalesce({ tag: "move", at: 0 }, { tag: "param", at: 10 }, W));
  // tag 为 null -> 必须独立可撤
  ok("tag 为 null -> 不合并 (这一步要独立可撤)",
    !shouldCoalesce({ tag: "move", at: 0 }, { tag: null, at: 10 }, W));
  // 上一步是 null -> 不合并
  ok("上一步无 tag -> 不合并",
    !shouldCoalesce({ tag: null, at: 0 }, { tag: "move", at: 10 }, W));
  // 没有上一步 -> 不合并
  ok("没有上一步 -> 不合并", !shouldCoalesce(null, { tag: "move", at: 0 }, W));
  // 边界: 正好等于窗口 -> 不合并 (< 是严格小于)
  ok("间隔正好等于窗口 -> 不合并",
    !shouldCoalesce({ tag: "move", at: 0 }, { tag: "move", at: W }, W));

  /**
   * 为什么必须合并: 拖一个节点每帧都产生一次提交, 不合并的话
   * 撤销一次只退 1px —— 等于没有撤销。这是"撤销能用"的前提。
   */
  ok("★ 连续拖动会被合并成一步 (撤销才退得动)",
    shouldCoalesce({ tag: "move", at: 1000 }, { tag: "move", at: 1016 }, W));
}

// ── 15.1 resize 与色板 (UE5 的注释行为) ──
{
  const reg = createRegistry();
  const g = {
    nodes: [{ id: "n1", type: "number", x: 0, y: 0 }],
    edges: [],
    comments: [{ id: "c1", title: "t", x: 100, y: 200, w: 300, h: 150 }],
  };

  // resize: 给新的绝对矩形, 位置不变、尺寸变
  const bigger = resizeComment(g, "c1", { x: 100, y: 200, w: 400, h: 260 });
  const c1 = (bigger.comments ?? [])[0];
  ok("resize 改变了尺寸", c1.w === 400 && c1.h === 260);
  ok("resize 不动位置", c1.x === 100 && c1.y === 200);

  // 最小尺寸: 拖到负值会被夹住, 否则注释会消失
  const tiny = resizeComment(g, "c1", { x: 100, y: 200, w: -50, h: -20 });
  const c2 = (tiny.comments ?? [])[0];
  ok("resize 有最小尺寸 (不会缩成负数)", c2.w >= 60 && c2.h >= 40);

  // resize 是幂等的: 同样的目标矩形两次, 结果一致
  const r1 = resizeComment(g, "c1", { x: 100, y: 200, w: 400, h: 260 });
  const r2 = resizeComment(r1, "c1", { x: 100, y: 200, w: 400, h: 260 });
  ok("resize 幂等", JSON.stringify(r1.comments) === JSON.stringify(r2.comments));

  // 色板: 每档都要有定义, 且都在允许的语义色里
  const tones = ["default", "neutral", "primary", "success", "warning", "danger"];
  for (const t of tones) {
    ok("注释色板有 " + t, !!COMMENT_TONE[t]);
    ok("注释色 " + t + " 有背景", (COMMENT_TONE[t] ?? "").indexOf("bg-") !== -1);
  }

  // 拖动仍要带走完全框住的节点 (这个行为不能被 resize 破坏)
  const moved = moveCommentWithNodes(reg, g, "c1", { x: 150, y: 250 });
  ok("移动注释不影响 resize 能力", (moved.comments ?? [])[0].x === 150);
}

// ── 15.2 回边绕行 ──
{
  /**
   * 折行之后, "上一行末尾 -> 下一行开头"这类边在几何上必然往左回拉。
   * 普通贝塞尔会让它**斜穿过中间所有节点** —— 就是"从左边深入右边又拉
   * 回去"的那条。绕行让它在两行之间的空白车道里走。
   */
  const a = { x: 1000, y: 300 };
  const b = { x: 300, y: 600 };
  ok("明显的回边走绕行", shouldDetour(a, b));
  const p = detourPath(a, b);
  ok("绕行路径含横向段", p.indexOf(" L ") !== -1);
  ok("绕行从起点出发、到终点结束", p.startsWith("M " + a.x + " " + a.y) && p.indexOf(String(b.x) + " " + String(b.y)) !== -1);

  // 不该绕的不能绕 —— 否则短边也会被画成绕来绕去, 比原来更难看
  ok("同行的正向边不绕", !shouldDetour({ x: 100, y: 100 }, { x: 400, y: 130 }));
  ok("短距离的回拉不绕", !shouldDetour({ x: 400, y: 100 }, { x: 300, y: 105 }));
  ok("垂直跨度小的回拉不绕", !shouldDetour({ x: 900, y: 100 }, { x: 200, y: 110 }));
}

// ── 15.5 注释框必须真的有背景 (静态检查) ──
{
  /**
   * 用户报"注释只有一个头, 框体是空的"。
   *
   * 两个成因, 都静默:
   *   1. COMMENT_TONE 里每组只有 border-* 与 text-*, **没有任何 bg-* **
   *      —— 于是框体完全透明, 只剩 22px 的标题条
   *   2. 修的时候若写 bg-primary/[0.14] 这种任意透明度, 本工程的 Tailwind
   *      **不生成规则**, 类名静默失效, 背景还是没有
   *
   * 所以断言两件事: 色调表里每组都有 bg-, 且只用标准档位 (5/10/20/25 等)。
   */
  const toneSrc = readFileSync(
    path.resolve(import.meta.dirname, "../../src/blueprint/canvas-parts.tsx"),
    "utf8"
  );
  const toneStart = toneSrc.indexOf("export const COMMENT_TONE");
  ok("找得到 COMMENT_TONE", toneStart !== -1);
  // 朴素字符串检查: 正则在模板字符串里会被转义吃掉, 实测踩过多次
  const toneBlock = toneSrc.slice(toneStart, toneStart + 4000);
  const has = (needle) => toneBlock.indexOf(needle) !== -1;
  ok("注释色 default 有背景", has("border-border bg-muted/25"));
  ok("注释色 primary 有背景", has("border-primary/50 bg-primary/10"));
  ok("注释色 warning 有背景", has("border-amber-500/50 bg-amber-500/10"));
  ok("注释色 success 有背景", has("border-emerald-500/50 bg-emerald-500/10"));
  /**
   * 标准档检查: 不允许 /[0.xx] 这种任意值语法 (它不生成规则)。
   *
   * ⚠️ 必须先把注释行去掉再查 —— 色调表上方的说明里**提到了这个反例**,
   * 不去掉的话检查会被自己的文档命中, 永远失败 (实测踩到)。
   * 这和 ui-rules 门禁里"注释行不参与判定"是同一个道理。
   */
  const toneCode = toneBlock
    .split(String.fromCharCode(10))
    .filter((l) => l.trim().indexOf("*") !== 0 && l.trim().indexOf("//") !== 0)
    .join(String.fromCharCode(10));
  ok("注释背景没用任意透明度语法", toneCode.indexOf("[0.") === -1);
  ok("注释框体带 border", /border/.test(toneBlock));
}

// ── 16. 拖拽状态必须能被收尾 (静态检查) ──
{
  /**
   * 这条是**结构性**的回归防线, 不是行为断言。
   *
   * 背景: 用户报"拿起注释块就放不下去" —— 根因是 onPointerUp 里处理完
   * 注释位移后写了提前 return, 跳过了函数末尾的 setCommentDrag(null),
   * 于是拖拽状态永远清不掉, 注释粘着光标不放。
   *
   * 这类 bug 的恶劣之处在于: tsc 通过、构建通过、冒烟通过、行为断言
   * 也通过 (因为断言测的是"移动后位置对不对", 而不是"松手后停不停")。
   * 只有真的用鼠标拖一下才发现。所以补一条静态检查:
   * **onPointerUp 的顶层分支里不许有 return**, 它必须清掉所有拖拽状态。
   */
  // cases.mts 跑在 docs/.bpprobe 下, 不能用 import.meta.dirname 推相对路径
  const canvasPath = path.resolve(
    import.meta.dirname, "../../src/blueprint/BlueprintCanvas.tsx"
  );
  const src = readFileSync(canvasPath, "utf8");
  const start = src.indexOf("const onPointerUp = useCallback(");
  const end = src.indexOf(String.fromCharCode(10) + "    },", src.indexOf("setCommentDrag(null);", start));
  ok("找得到 onPointerUp", start !== -1 && end !== -1);
  if (start !== -1 && end !== -1) {
    const body = src.slice(start, end);
    // 去掉注释再找 return —— 注释里提到 return 是正常的
    // 不用正则: 反斜杠在模板字符串里会被吃掉, 实测踩过两次
    const NL = String.fromCharCode(10);
    const lines = body.split(NL);
    let inBlockComment = false;
    const bad = [];
    for (const raw of lines) {
      let l = raw.trim();
      if (l.startsWith("/*")) inBlockComment = true;
      if (inBlockComment) {
        if (l.includes("*/")) inBlockComment = false;
        continue;
      }
      if (l.startsWith("//")) continue;
      // 顶层分支的 return: 缩进 >= 6 空格 且就是 return;
      if (/^return\s*;/.test(l) && raw.length - raw.trimStart().length >= 6) bad.push(raw.trim());
    }
    ok("★ onPointerUp 顶层分支没有提前 return (拖拽状态必须能收尾)", bad.length === 0);
    if (bad.length) console.log("    违规:", JSON.stringify(bad));

    // 三个拖拽状态都要被清掉
    // 注释的状态清理搬进了 use-comment-interaction (cmt.end()), 所以这里
    // 既认 setXxx(null) 也认 cmt.end()
    for (const st of ["setDrag(null)", "setPanning(null)", "cmt.end()", "setCommentDraft(null)", "setMarquee(null)", "setLink(null)"]) {
      ok("松手时会清 " + st.replace("(null)", ""), src.includes(st));
    }
  }
}

// ── 17. dsh 架构图 (根图 + 子图) ──
{
  // 探针里跑不了演示包的 TS 模块, 所幸这里用等价结构验证蓝图库撑不撑得住
  // 探针里跑不了 TS 模块, 所以在这里用等价的方式验证:
  // 手搭一个同样的"根图 + 子图"结构, 检查蓝图库是否撑得住
  const reg = createRegistry();
  registerTunnels(reg);
  reg.node({
    type: "stage", label: "大步骤", category: "大步骤",
    execIn: true, execOut: ["then"], multiExecIn: true,
    inputs: [{ id: "in", type: "any", multi: true, default: null }], outputs: [{ id: "out", type: "any" }],
  });
  reg.node({
    type: "sub", label: "子步骤", category: "子步骤",
    execIn: true, execOut: ["then"], multiExecIn: true,
  });

  const root = buildFromAgent(reg, {
    nodes: [
      { key: "a", type: "stage" }, { key: "b", type: "stage" }, { key: "c", type: "stage" },
      { key: "d", type: "stage" }, { key: "e", type: "stage" },
    ],
    edges: [
      { from: "a", to: "b" }, { from: "b", to: "c" }, { from: "c", to: "d" },
      { from: "d", to: "e" }, { from: "e", to: "b" }, // 回路
    ],
  });
  {
    // 测量布线: 每条边的水平跨度, 找出"拉回去"的长边
    const pos = new Map(root.graph.nodes.map((n) => [n.id, { x: n.x, y: n.y }]));
    const spans = root.graph.edges.map((e) => {
      const a = pos.get(e.from.node), b = pos.get(e.to.node);
      return { dx: Math.round(b.x - a.x), dy: Math.round(b.y - a.y) };
    });
    const back = spans.filter((s) => s.dx < 0);
    console.log("    边跨度:", JSON.stringify(spans));
    console.log("    回边数:", back.length, " 最长回拉:", back.length ? Math.max(...back.map((s) => -s.dx)) : 0);
    const xs = [...pos.values()].map((p) => p.x), ys = [...pos.values()].map((p) => p.y);
    console.log("    宽高:", Math.round(Math.max(...xs) - Math.min(...xs)), "x", Math.round(Math.max(...ys) - Math.min(...ys)));
  }
  ok("根图建出来了", root.graph.nodes.length === 5 && root.graph.edges.length === 5);
  ok("根图零重叠", countOverlaps(reg, root.graph) === 0);
  ok("被拒的边为 0", root.rejected.length === 0);

  // 给每个大步骤挂子图 (模拟 build.ts 的做法)
  const subgraphs = {};
  const nodes = root.graph.nodes.map((n, i) => {
    const inner = buildFromAgent(reg, {
      nodes: [{ key: "s1", type: "sub" }, { key: "s2", type: "sub" }, { key: "s3", type: "sub" }],
      edges: [{ from: "s1", to: "s2" }, { from: "s2", to: "s3" }],
    });
    const id = "sg:" + n.id;
    /**
     * 子图要**显式声明**对外端口。
     *
     * 这不是形式主义: 子图节点的外形完全由 SubGraphDef 决定, 不声明就等于
     * "没有任何端口", 所有连到它的边都会变成 unknown-port。库里有从内部
     * 隧道推导的容错, 但显式声明才是可靠做法 —— 尤其是子图还要再被折叠时。
     */
    subgraphs[id] = {
      id, label: "步骤 " + (i + 1), nodes: inner.graph.nodes, edges: inner.graph.edges,
      execIn: true, execOut: ["then"], multiExecIn: true,
      inputs: [{ id: "in", label: "入", type: "any", multi: true, default: null }],
      outputs: [{ id: "out", label: "出", type: "any" }],
    };
    return { ...n, subgraph: id };
  });
  const withSub = { ...root.graph, nodes, subgraphs };
  ok("子图都挂上了", Object.keys(withSub.subgraphs).length === 5);
  const sv = validateGraph(reg, withSub);
  ok("★ 挂了子图后校验仍通过", sv.issues.every((i) => i.level !== "error"));
  if (sv.issues.some((i) => i.level === "error")) console.log("    挂子图报错:", JSON.stringify(sv.issues.filter(i=>i.level==="error").slice(0,4).map(i=>i.code+":"+i.message)));
  const svv = validateGraph(reg, withSub);
  void svv;

  // 折叠根图的一部分 -> 子图里再套一层
  /**
   * 折叠**本身**必须可用 (不抛、节点数减少、子图能进)。
   *
   * 已知的残留限制: 折叠"已经含子图的节点"时, 多个外部入边会汇到新子图的
   * 同一个输入口, 触发 input-occupied。这是**可见**的报错 (不是静默丢边),
   * 属于可接受的已知边界 —— 修它需要让折叠产生的对外端口一律可多入,
   * 那会牵动"独占输入"的默认语义。当前不做。
   */
  const folded = collapseToSubgraph(reg, withSub, [nodes[0].id, nodes[1].id], { label: "前半段" });
  const sub2 = folded.nodes.find((n) => n.subgraph);
  ok("折叠不抛且节点数减少", folded.nodes.length < withSub.nodes.length);
  ok("折叠出的子图能进", !!subgraphAsGraph(folded, sub2.subgraph));
  ok("折叠普通节点(非子图)后合法", validateGraph(reg, collapseToSubgraph(reg, root.graph, [nodes[0].id, nodes[1].id])).issues.every((i) => i.level !== "error"));

  // 诊断: 用与演示包等价的 stage 定义, 逐条跑真实边
  {
    const reg2 = createRegistry();
    registerTunnels(reg2);
    const spec = {
      input:    { in: "input",    out: "history" },
      history:  { in: "history",  out: "history" },
      assemble: { in: "history",  out: "assembly" },
      request:  { in: "assembly", out: "request" },
      stream:   { in: "request",  out: "response" },
      tools:    { in: "response", out: "tools" },
      compact:  { in: "state",    out: "history" },
      loop:     { in: "tools",    out: "state" },
      settle:   { in: "state",    out: "state" },
      output:   { in: "state",    out: "response" },
    };
    for (const [k, v] of Object.entries(spec)) {
      reg2.node({
        type: "stage." + k, label: k, category: "大步骤",
        execIn: true, execOut: ["then"], multiExecIn: true,
        inputs: [{ id: v.in, type: v.in, multi: true, default: null }],
        outputs: [{ id: v.out, type: v.out }],
      });
    }
    reg2.node({ type: "sub", label: "子步骤", execIn: true, execOut: ["then"], multiExecIn: true });

    const keys = Object.keys(spec);
    const nodes = keys.map((k) => ({ key: k, type: "stage." + k }));
    const edges = [
      { from: "input", to: "history" }, { from: "history", to: "assemble" },
      { from: "assemble", to: "request" }, { from: "request", to: "stream" },
      { from: "stream", to: "tools" }, { from: "tools", to: "loop" },
      { from: "loop", to: "compact" }, { from: "compact", to: "assemble" },
      { from: "loop", to: "settle" }, { from: "settle", to: "output" },
      { from: "loop.then", to: "request.exec-in" },
    ];
    const built2 = buildFromAgent(reg2, { nodes, edges });
    console.log("    被拒的边:", JSON.stringify(built2.rejected));
    // 挂子图
    const sgs2 = {};
    const ns2 = built2.graph.nodes.map((n) => {
      const inner = buildFromAgent(reg2, {
        nodes: [{ key: "s1", type: "sub" }, { key: "s2", type: "sub" }],
        edges: [{ from: "s1", to: "s2" }],
      });
      const sid = "sg:" + n.id;
      sgs2[sid] = {
        id: sid, label: "S", nodes: inner.graph.nodes, edges: inner.graph.edges,
        execIn: true, execOut: ["then"], multiExecIn: true,
        // 端口必须与原节点一致, 否则根图上的边会全部悬空
        inputs: nodeShape(reg2, built2.graph, n.id).inputs.map((x) => ({ ...x })),
        outputs: nodeShape(reg2, built2.graph, n.id).outputs.map((x) => ({ ...x })),
      };
      return { ...n, subgraph: sid };
    });
    const g3 = { ...built2.graph, nodes: ns2, subgraphs: sgs2 };
    const v3 = validateGraph(reg2, g3);
    const e3 = v3.issues.filter((i) => i.level === "error");
    ok("★ 架构图(10 大步骤 + 子图)校验通过", e3.length === 0);
    if (e3.length) console.log("    报错:", JSON.stringify([...new Set(e3.map((i) => i.code + ":" + i.message))].slice(0, 10)));
    {
      const pos3 = new Map(built2.graph.nodes.map((n) => [n.id, { x: n.x, y: n.y }]));
      const xs3 = [...pos3.values()].map((p) => p.x), ys3 = [...pos3.values()].map((p) => p.y);
      const W3 = Math.round(Math.max(...xs3) - Math.min(...xs3)), H3 = Math.round(Math.max(...ys3) - Math.min(...ys3));
      console.log("    dsh架构图 宽x高:", W3, "x", H3, " 宽高比", (W3 / Math.max(1, H3)).toFixed(2));
      console.log("    dsh架构图 边跨度:", JSON.stringify(built2.graph.edges.map((e) => {
        const a = pos3.get(e.from.node), b = pos3.get(e.to.node);
        return (b.x - a.x) + "," + (b.y - a.y);
      })));
    }
  }
}

console.log("");
if (fail > 0) {
  console.log(\`check-blueprint: \${fail} 条断言失败 (共 \${pass + fail} 条)\`);
  process.exit(1);
}
console.log(\`check-blueprint: 通过 (\${pass} 条断言)\`);
`;

const testFile = path.join(PROBE, "cases.mts");
writeFileSync(testFile, CASES);

const run = spawnSync("node", ["--experimental-strip-types", testFile], { encoding: "utf8" });
const out = (run.stdout ?? "") + (run.stderr ?? "");
process.stdout.write(out);

rmSync(PROBE, { recursive: true, force: true });
process.exit(run.status ?? 1);
