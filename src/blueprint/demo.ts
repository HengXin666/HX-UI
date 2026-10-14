import { createRegistry, type BlueprintRegistryImpl } from "./registry";
import { ANY, EXEC, type NodeTypeDef } from "./types";

/**
 * 演示节点库。
 *
 * 它不是"蓝图库的一部分", 是**使用方该怎么写节点定义**的样板。
 * 真实项目里照这个形状写自己的节点, 一个文件就能扩出几十个。
 *
 * 三条从样板里能看出来的约定:
 * 1. 纯数据节点没有 execIn  它只在被别人取值时才算 (惰性)。
 * 2. 有副作用的节点 (发请求 / 写文件 / 打印) 必须有 execIn 
 * 否则它在图里的求值时机无法确定, 分支语义也会失效。
 * 3. 参数缺省值写在 ParamDef.default 上, 不写在 evaluate 里兜 
 * 后者会让"节点上显示的值"与"实际用的值"不是同一个。
 */

const DEMO_NODES: Record<string, NodeTypeDef> = {
  // ── 值 ──────────────────────────────────────────────────────────
  number: {
    type: "number",
    label: "数值",
    category: "值",
    description: "一个常量数字",
    outputs: [{ id: "value", label: "值", type: "number" }],
    params: [{ id: "v", label: "值", kind: "number", default: 1 }],
    evaluate: ({ params }) => ({ value: Number(params.v ?? 0) }),
  },
  text: {
    type: "text",
    label: "文本",
    category: "值",
    outputs: [{ id: "value", label: "值", type: "string" }],
    params: [{ id: "v", label: "内容", kind: "text", default: "hello" }],
    evaluate: ({ params }) => ({ value: String(params.v ?? "") }),
  },

  // ── 计算 ────────────────────────────────────────────────────────
  math: {
    type: "math",
    label: "四则运算",
    category: "计算",
    inputs: [
      { id: "a", label: "a", type: "number", default: 0 },
      { id: "b", label: "b", type: "number", default: 0 },
    ],
    outputs: [{ id: "out", label: "结果", type: "number" }],
    params: [
      {
        id: "op", label: "运算", kind: "select", default: "add",
        options: [
          { value: "add", label: "加" },
          { value: "sub", label: "减" },
          { value: "mul", label: "乘" },
          { value: "div", label: "除" },
        ],
      },
    ],
    evaluate: ({ inputs, params }) => {
      const a = Number(inputs.a ?? 0);
      const b = Number(inputs.b ?? 0);
      switch (params.op) {
        case "sub": return { out: a - b };
        case "mul": return { out: a * b };
        case "div": return { out: b === 0 ? 0 : a / b };
        default: return { out: a + b };
      }
    },
  },
  compare: {
    type: "compare",
    label: "比较",
    category: "计算",
    description: "两个数比较, 输出布尔",
    inputs: [
      { id: "a", label: "a", type: "number", default: 0 },
      { id: "b", label: "b", type: "number", default: 0 },
    ],
    outputs: [{ id: "out", label: "结果", type: "boolean" }],
    params: [
      {
        id: "op", label: "运算", kind: "select", default: "gt",
        options: [
          { value: "gt", label: ">" },
          { value: "lt", label: "<" },
          { value: "eq", label: "=" },
        ],
      },
    ],
    evaluate: ({ inputs, params }) => {
      const a = Number(inputs.a ?? 0);
      const b = Number(inputs.b ?? 0);
      switch (params.op) {
        case "lt": return { out: a < b };
        case "eq": return { out: a === b };
        default: return { out: a > b };
      }
    },
  },

  // ── 流程 ────────────────────────────────────────────────────────
  start: {
    type: "start",
    label: "开始",
    category: "流程",
    description: "执行入口。一张执行图从这里开始。",
    execIn: false,
    execOut: ["then"],
    outputs: [],
  },
  branch: {
    type: "branch",
    label: "分支",
    category: "流程",
    description: "按条件走真/假两条执行流  走哪条由求值器决定",
    execIn: true,
    execOut: ["true", "false"],
    inputs: [{ id: "cond", label: "条件", type: "boolean", default: false }],
  },
  log: {
    type: "log",
    label: "打印",
    category: "流程",
    description: "有副作用的节点, 必须挂在执行流上",
    execIn: true,
    execOut: ["then"],
    inputs: [{ id: "msg", label: "内容", type: ANY, default: "" }],
    outputs: [{ id: "line", label: "输出行", type: "string" }],
    params: [{ id: "prefix", label: "前缀", kind: "text", default: "»" }],
    /**
     * 刻意**不在这里 console.log**。
     *
     * 库不该替使用方决定输出目标 (控制台 / 文件 / 网络 / 界面上的日志框)。
     * 所以这个节点把"要打印的那一行"作为值吐出来, 由宿主决定往哪送 
     * 副作用收敛到宿主那一侧, 节点本身保持纯的、可测的。
     */
    evaluate: ({ inputs, params }) => ({
      line: `${String(params.prefix ?? "")} ${String(inputs.msg ?? "")}`,
    }),
  },

  // ── 收集 ────────────────────────────────────────────────────────
  merge: {
    type: "merge",
    label: "合并",
    category: "流程",
    description: "多入执行口: 两条分支可以汇到这里",
    execIn: true,
    execOut: ["then"],
    evaluate: () => ({}),
  },
};

/** 演示用的注册中心。含内置类型 + 上面这些节点。 
 * .agents/notes/implemented/process/2026-10-08-repository-agent-notes-v2-adoption.md
 */
export function createDemoRegistry(): BlueprintRegistryImpl {
  const reg = createRegistry();
  reg.type({ id: "image", label: "图像", colorClass: "bg-amber-400", extends: "object" });
  for (const def of Object.values(DEMO_NODES)) reg.node(def);
  return reg;
}

export const demoRegistry: BlueprintRegistryImpl = createDemoRegistry();

/** 演示图: 数值 → 比较 → 分支 → 打印。改一个参数就能看到执行流换分支。 */
export const demoGraph = {
  nodes: [
    { id: "n1", type: "start", x: 40, y: 60 },
    { id: "n2", type: "number", x: 40, y: 180, params: { v: 7 } },
    { id: "n3", type: "number", x: 40, y: 300, params: { v: 5 } },
    { id: "n4", type: "compare", x: 260, y: 220, params: { op: "gt" } },
    { id: "n5", type: "branch", x: 480, y: 90 },
    { id: "n6", type: "log", x: 700, y: 40, params: { prefix: "真" } },
    { id: "n7", type: "log", x: 700, y: 180, params: { prefix: "假" } },
  ],
  edges: [
    { id: "e1", from: { node: "n1", port: "then" }, to: { node: "n5", port: "exec-in" }, kind: "exec" as const },
    { id: "e2", from: { node: "n2", port: "value" }, to: { node: "n4", port: "a" }, kind: "data" as const },
    { id: "e3", from: { node: "n3", port: "value" }, to: { node: "n4", port: "b" }, kind: "data" as const },
    { id: "e4", from: { node: "n4", port: "out" }, to: { node: "n5", port: "cond" }, kind: "data" as const },
    { id: "e5", from: { node: "n5", port: "true" }, to: { node: "n6", port: "exec-in" }, kind: "exec" as const },
    { id: "e6", from: { node: "n5", port: "false" }, to: { node: "n7", port: "exec-in" }, kind: "exec" as const },
  ],
};

export { DEMO_NODES, EXEC };
