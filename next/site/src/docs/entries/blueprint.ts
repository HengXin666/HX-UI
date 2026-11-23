import type { DocEntry } from "../types";

const D = { snap: "16", minimap: false, readOnly: false, lod: 0.5, wheel: "ctrl", debug: false, variables: false };
const DEMO = { ...D, graph: "flow" };

export const blueprint: DocEntry = {
  slug: "blueprint",
  name: "Blueprint",
  title: "蓝图编辑器",
  section: "ui",
  group: "编辑器",
  description: "照着虚幻 5 蓝图做的节点图编辑器：右键或 Tab 搜节点、从引脚拖线（按类型给出能不能连和原因，拖到空白处只列能接上的节点并自动连好）、框选、注释框、折叠为子图、函数或宏、图变量、查找、断点调试（执行流脉冲、单步、监视引脚值）、对齐拉直、系统剪贴板文本复制粘贴、撤销重做。节点是 DOM，连线是一张 SVG，拖动和缩放直接改变换，几百个节点也顺；调试、变量面板和查找按需加载。",
  file: "src/blueprint/ui/blueprint.tsx",
  importFrom: "@/blueprint/ui",
  demo: () => import("./blueprint.demo"),
  source: () => import("@/blueprint/ui/blueprint.tsx?raw").then((m) => m.default),
  bleed: true,
  stageHeight: 600,
  remountOnChange: false,
  defaults: DEMO,
  componentDefaults: D,
  demoOnly: ["graph"],
  presets: [
    { label: "空白", values: { ...DEMO, graph: "blank" } },
    { label: "示例流程", values: { ...DEMO, graph: "flow" } },
    { label: "含折叠图", values: { ...DEMO, graph: "collapsed" } },
    { label: "含问题", values: { ...DEMO, graph: "broken" } },
    { label: "调试运行", values: { ...DEMO, graph: "debug", debug: true } },
    { label: "变量", values: { ...DEMO, graph: "vars", variables: true, debug: true } },
    { label: "函数与宏", values: { ...DEMO, graph: "fn", debug: true } },
    { label: "300 个节点", values: { ...DEMO, graph: "stress", minimap: true } },
  ],
  controls: [
    {
      type: "select", key: "graph", label: "图", options: [
        { value: "blank", label: "空白" }, { value: "flow", label: "示例流程" }, { value: "collapsed", label: "含折叠图" }, { value: "broken", label: "含问题" },
        { value: "debug", label: "调试运行" }, { value: "vars", label: "变量" }, { value: "fn", label: "函数与宏" }, { value: "stress", label: "300 个节点" },
      ],
    },
    { type: "select", key: "snap", label: "网格吸附", options: [{ value: "0", label: "关" }, { value: "8", label: "8" }, { value: "16", label: "16" }, { value: "32", label: "32" }] },
    { type: "toggle", key: "debug", label: "调试" },
    { type: "toggle", key: "variables", label: "变量面板" },
    { type: "select", key: "wheel", label: "滚轮", options: [{ value: "ctrl", label: "Ctrl 加滚轮缩放" }, { value: "zoom", label: "直接缩放" }] },
    { type: "toggle", key: "minimap", label: "缩略图" },
    { type: "toggle", key: "readOnly", label: "只读" },
    { type: "number", key: "lod", label: "简化阈值", min: 0.2, max: 0.9, step: 0.05 },
  ],
  usage: (v) => {
    const p: string[] = [];
    if (v.snap !== D.snap) p.push(`snap={${v.snap}}`);
    if (v.minimap) p.push("minimap");
    if (v.readOnly) p.push("readOnly");
    if (v.lod !== D.lod) p.push(`lodThreshold={${v.lod}}`);
    if (v.wheel !== D.wheel) p.push(`wheel="${v.wheel}"`);
    if (v.debug) p.push(`debug={{ breakpoints: ["branch"] }}`);
    if (v.variables) p.push("variables");
    return `import { useState } from "react";
import { Blueprint } from "@/blueprint/ui";
import { createRegistry, defineTypes, type BlueprintGraph } from "@/blueprint";

// 1. 引脚类型: 颜色取 --bp-* 令牌, ts 只给 TypeScript 推断用
const types = defineTypes({
  number: { color: "bp-float", ts: 0 as number, convert: { string: "conv.toString" } },
});

// 2. 节点: evaluate 的 inputs / params 按声明自动推断类型
const add = types.defineNode({
  id: "math.add", title: "Add", category: "Math",
  inputs: [{ id: "a", type: "number", default: 0 }, { id: "b", type: "number", default: 0 }],
  outputs: [{ id: "out", type: "number" }],
  evaluate: ({ inputs }) => ({ out: inputs.a + inputs.b }), // inputs.a: number
});
const toString = types.defineNode({
  id: "conv.toString", title: "To String", category: "Conversions", kind: "cast",
  inputs: [{ id: "in", type: "number" }],
  outputs: [{ id: "out", type: "string" }],
});

const registry = createRegistry(types, [add, toString]);

export function Editor() {
  const [graph, setGraph] = useState<BlueprintGraph>({ nodes: [], edges: [] });
  return (
    <Blueprint
      registry={registry}
      value={graph}
      onChange={setGraph}${p.length ? `\n      ${p.join("\n      ")}` : ""}
      className="h-[600px] rounded-xl"
    />
  );
}

// 想要命令式 API: const bp = useBlueprint({ registry, initial });
// bp.apply([{ op: "addNode", type: "math.add", at: [200, 80] }]); bp.undo(); bp.toText();
// bp.toggleBreakpoint(["branch"]); await bp.run(); bp.step(); bp.stop(); bp.debug.status
// <Blueprint editor={bp} debug />
`;
  },
  props: [
    { name: "registry", type: "Registry", description: "引脚类型和节点定义，createRegistry(defineTypes(...), [defineNode(...)]) 得到。" },
    { name: "value / onChange", type: "BlueprintGraph / (g) => void", description: "受控用法。图是纯 JSON：节点、连线、注释、子图表。" },
    { name: "defaultValue", type: "BlueprintGraph", description: "非受控用法的初始图。" },
    { name: "editor", type: "BlueprintHandle", description: "useBlueprint() 的返回值；给了它就不用上面三项，可以命令式 apply / undo / select / fit / toText。" },
    { name: "readOnly", type: "boolean", default: "false", description: "只读：能平移、缩放、选中、复制，不能改。" },
    { name: "snap", type: "number", default: "16", description: "拖动节点和注释时吸附的网格，0 关闭。" },
    { name: "minimap", type: "boolean", default: "false", description: "右下角缩略图，可点击或拖动跳转。" },
    { name: "lodThreshold", type: "number", default: "0.5", description: "缩放低于它只显示节点标题；低于它的 0.6 倍节点画成色块。" },
    { name: "issues", type: "boolean", default: "true", description: "左下角校验条，点问题会定位并选中节点；问题在多层子图里时，面包屑显示完整路径。" },
    { name: "wheel", type: "\"ctrl\" | \"zoom\"", default: "\"ctrl\"", description: "滚轮行为。ctrl：按住 Ctrl 或 ⌘（以及触控板捏合）才缩放，编辑器获得焦点后直接滚轮也缩放，否则让页面滚动并提示一句，适合放在长文档里；zoom：滚轮总是缩放，适合整屏编辑器。" },
    { name: "debug", type: "boolean | { breakpoints?, stepMs? }", default: "false", description: "调试：右下角运行条（运行、单步、继续、停止、清除），执行流沿走过的连线跑一段脉冲（每跳 150–250ms，减少动态时只高亮），F9 断点、F5 运行或继续、F10 单步、Shift F5 停止；右键引脚可监视它的值，运行后悬停引脚看最后的值。按需加载。breakpoints 写节点 id，子图里写「子图 id/节点 id」。" },
    { name: "variables", type: "boolean", default: "false", description: "左侧变量面板：图变量（名称、类型、默认值），在函数里还有局部变量。拖到画布得到获取节点，按住 Alt 拖入得到设置节点；也可以点「获取」「设置」。改名处处生效。按需加载；想放到编辑器外面，用 @/blueprint/ui/variables-panel 里的 VariablesPanel。" },
    { name: "className / aria-label", type: "string", description: "外层样式和无障碍名称。编辑器要有高度。" },
    { name: "useBlueprint({ registry, initial, value?, onChange? })", type: "BlueprintHandle", description: "graph、selection、apply(ops)（一次撤销）、undo、redo、select、fit、viewport、toText、fromText、enter / exitTo / openPath / reveal（子图）；调试：run()、step()、continue()、stop()、clearDebug()、debug（status、at、trace、values）、breakpoints、toggleBreakpoint()、watches、toggleWatch()。" },
    { name: "折叠为子图 / 函数 / 宏", type: "collapse op 的 kind", description: "右键节点选择。折叠图只是分组；函数最多一个执行输入和一个执行输出，有自己的局部变量，每次调用重置，走完才从执行输出继续；宏可以有多个执行引脚，内联执行，到达出口就立刻接着外面的流程。函数和宏会出现在右键菜单里，可以多处调用。" },
    { name: "节点注释、禁用、查找", type: "右键菜单 / Ctrl F", description: "节点上方的注释气泡（双击编辑）；禁用的节点画成虚线框，运行时跳过（执行流直通第一个执行输出，数据输出取类型相符的输入）；Ctrl F 在主图和所有子图里查找，回车逐个跳转。" },
    { name: "键盘", type: "方向键 / Alt 方向键 / Enter / Esc", description: "方向键按网格微移选中项（Shift 逐单位），Alt 加方向键切到该方向最近的节点（屏幕阅读器经 aria-activedescendant 读到它），Enter 进入折叠图或重命名，拖线途中按 Esc 取消。" },
  ],
};
