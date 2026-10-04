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
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DOCS = path.join(ROOT, "docs");
const PROBE = path.join(DOCS, ".bpprobe");
const OUT = path.join(PROBE, "out", "bp.js");

/** 只打包纯逻辑层。渲染层要 react/jsx, 不进这里。 */
const ENTRY = `export * from "../../src/blueprint/registry";
export * from "../../src/blueprint/connect";
export * from "../../src/blueprint/validate";
export * from "../../src/blueprint/evaluate";
export * from "../../src/blueprint/serialize";
export * from "../../src/blueprint/demo";
export * from "../../src/blueprint/geometry";
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
  console.log("check-blueprint: docs/node_modules 里没有 vite, 跳过 (先 cd docs && npm i)");
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
import {
  createRegistry, canConnect, applyConnect, validateGraph, findCycles,
  topoSort, upstreamOf, evaluateGraph, parseGraph, serializeGraph,
  createDemoRegistry, demoGraph,
  portPos, hitPort, nodeWidth, nodeHeight,
  collapseToSubgraph, expandSubgraph, subgraphAsGraph, subgraphRefCount,
  boundaryPorts, registerTunnels, TUNNEL_IN, TUNNEL_OUT,
  addComment, commentAround, moveCommentWithNodes, nodesInComment, commentContains,
  createDshRegistry, NODES, dshAgentLoopGraph, COLLAPSIBLE_GROUPS,
  resolvePort,
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
  const moved = moveCommentWithNodes(demo, g, c.id, { dx: 100, dy: 50 });
  const after = moved.comments[0];
  ok("注释自己移动了", Math.abs(after.x - (c.x + 100)) < 0.001 && Math.abs(after.y - (c.y + 50)) < 0.001);
  const n2 = moved.nodes.find((n) => n.id === "n2");
  ok("框内节点跟着移动", Math.abs(n2.x - (demoGraph.nodes.find((n) => n.id === "n2").x + 100)) < 0.001);
  const n5 = moved.nodes.find((n) => n.id === "n5");
  ok("框外节点不动", Math.abs(n5.x - demoGraph.nodes.find((n) => n.id === "n5").x) < 0.001);

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
  const dsh = createDshRegistry();
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
