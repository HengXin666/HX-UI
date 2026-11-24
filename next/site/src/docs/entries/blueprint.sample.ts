import { applyOps, demoLibrary, demoRegistry, type BlueprintGraph, type GraphOp } from "@/blueprint";

// 演示数据为虚构: 「伤害结算」只用来展示工作台, 不对应任何真实业务.

/**
 * A document that exercises the workbench: graph variables in categories (incl. a container), a
 * function with input getters and a Return node, a library pure function and macro, a collapsed
 * graph, comments (also inside the function), a development-only node, a disabled node.
 */
export function workbenchDoc(): BlueprintGraph {
  const steps: GraphOp[][] = [
    [
      { op: "setMeta", name: "伤害结算", description: "演示用的虚构流程" },
      { op: "addVariable", id: "v_hp", name: "生命", type: "number", default: 100, category: "状态", tooltip: "当前生命值" },
      { op: "addVariable", id: "v_shield", name: "护盾", type: "number", default: 20, category: "状态" },
      { op: "addVariable", id: "v_name", name: "目标", type: "string", default: "训练假人", category: "目标" },
      { op: "addVariable", id: "v_log", name: "伤害记录", type: "array<number>", default: [12, 30], category: "目标" },
      { op: "importLibrary", library: demoLibrary },
      {
        op: "addSubgraph", id: "fn_damage", label: "计算伤害", kind: "function", category: "战斗", description: "原始伤害 × 倍率，扣掉护盾，不低于 0",
        inputs: [{ id: "raw", type: "number", label: "原始伤害", default: 10 }, { id: "mul", type: "number", label: "倍率", default: 1.5 }],
        outputs: [{ id: "out", type: "number", label: "结果" }],
      },
    ],
  ];
  let g: BlueprintGraph = { nodes: [], edges: [] };
  for (const ops of steps) g = run(g, ops);
  // function body: raw * mul - shield, clamped at 0 (library pure function)
  const def = g.subgraphs!.fn_damage!;
  const entry = def.nodes.find((n) => n.type === "subgraph.in")!.id;
  const ret = def.nodes.find((n) => n.type === "subgraph.out")!.id;
  g = run(g, [
    { op: "disconnect", pin: `${entry}.exec` },
    { op: "moveNode", id: entry, to: [0, 32] },
    { op: "moveNode", id: ret, to: [976, 32] },
    { op: "addNode", id: "g_raw", type: "var.get", variable: "$in:raw", at: [64, 224] },
    { op: "addNode", id: "g_mul", type: "var.get", variable: "$in:mul", at: [64, 320] },
    { op: "addNode", id: "g_sh", type: "var.get", variable: "v_shield", at: [272, 384] },
    { op: "addNode", id: "mul", type: "math.multiply", at: [272, 224] },
    { op: "addNode", id: "sub", type: "math.subtract", at: [480, 272] },
    { op: "addNode", id: "clamp", type: "subgraph", subgraph: "demo:clamp", at: [688, 256], values: { lo: 0, hi: 999 } },
    { op: "addNode", id: "log", type: "flow.print", at: [688, 32], values: { prefix: "伤害" } },
    { op: "addNode", id: "ts", type: "conv.toString", at: [480, 96] },
    { op: "connect", from: "g_raw.value", to: "mul.a" },
    { op: "connect", from: "g_mul.value", to: "mul.b" },
    { op: "connect", from: "mul.out", to: "sub.a" },
    { op: "connect", from: "g_sh.value", to: "sub.b" },
    { op: "connect", from: "sub.out", to: "clamp.x" },
    { op: "connect", from: "clamp.out", to: `${ret}.out` },
    { op: "connect", from: "clamp.out", to: "ts.in" },
    { op: "connect", from: "ts.out", to: "log.msg" },
    { op: "connect", from: `${entry}.exec`, to: "log.exec" },
    { op: "connect", from: "log.then", to: `${ret}.then` },
    { op: "addComment", id: "c_fn", around: ["g_raw", "g_mul", "mul", "sub", "g_sh"], title: "原始伤害 × 倍率 − 护盾", tone: "info" },
  ], "fn_damage");
  // main graph
  g = run(g, [
    { op: "addNode", id: "start", type: "event.start", at: [0, 48] },
    { op: "addNode", id: "seq", type: "flow.sequence", at: [208, 48] },
    { op: "addNode", id: "hit", type: "subgraph", subgraph: "fn_damage", at: [432, 32], values: { raw: 40 } },
    { op: "addNode", id: "hp", type: "var.get", variable: "v_hp", at: [432, 208] },
    { op: "addNode", id: "left", type: "math.subtract", at: [688, 176] },
    { op: "addNode", id: "set_hp", type: "var.set", variable: "v_hp", at: [896, 32] },
    { op: "addNode", id: "alive", type: "math.compare", at: [1120, 192], values: { b: 0, op: "gt" } },
    { op: "addNode", id: "only", type: "subgraph", subgraph: "demo:if_true", at: [1328, 32] },
    { op: "addNode", id: "say", type: "flow.print", at: [1552, 32], values: { prefix: "还活着" } },
    { op: "addNode", id: "wait", type: "flow.delay", at: [432, 432], values: { duration: 0.3 } },
    { op: "addNode", id: "dbg", type: "flow.print", at: [688, 432], values: { prefix: "调试", msg: "只在开发时打印" } },
    { op: "addNode", id: "old", type: "flow.print", at: [896, 432], values: { prefix: "旧逻辑", msg: "已停用" } },
    { op: "connect", from: "start.then", to: "seq.exec" },
    { op: "connect", from: "seq.then_0", to: "hit.exec" },
    { op: "connect", from: "hit.then", to: "set_hp.exec" },
    { op: "connect", from: "hp.value", to: "left.a" },
    { op: "connect", from: "hit.out", to: "left.b" },
    { op: "connect", from: "left.out", to: "set_hp.value" },
    { op: "connect", from: "set_hp.value", to: "alive.a" },
    { op: "connect", from: "set_hp.then", to: "only.exec" },
    { op: "connect", from: "alive.out", to: "only.cond" },
    { op: "connect", from: "only.then", to: "say.exec" },
    { op: "connect", from: "seq.then_1", to: "wait.exec" },
    { op: "connect", from: "wait.then", to: "dbg.exec" },
    { op: "connect", from: "dbg.then", to: "old.exec" },
    { op: "updateNode", id: "dbg", devOnly: true },
    { op: "updateNode", id: "old", disabled: true, comment: "旧逻辑已禁用，执行流直通", commentPinned: true },
    { op: "updateNode", id: "hit", comment: "双击进入函数" },
    { op: "addComment", id: "c_main", around: ["hit", "hp", "left", "set_hp"], title: "结算一次伤害", tone: "primary" },
    { op: "addComment", id: "c_tail", around: ["wait", "dbg", "old"], title: "收尾", tone: "neutral" },
  ]);
  // a collapsed graph (pure grouping) around the "alive" branch
  g = run(g, [{ op: "collapse", nodes: ["alive"], id: "sg_alive", label: "是否存活" }]);
  return g;
}

function run(g: BlueprintGraph, ops: readonly GraphOp[], subgraph?: string): BlueprintGraph {
  const r = applyOps(g, ops, demoRegistry, subgraph ? { subgraph } : {});
  if (r.errors.length && import.meta.env.DEV) console.warn("[blueprint sample]", r.errors);
  return r.graph;
}
