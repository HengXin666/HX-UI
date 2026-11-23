import type { DocEntry } from "../types";

const D = { snap: "16", minimap: false, readOnly: false, lod: 0.5 };
const DEMO = { ...D, graph: "flow" };

export const blueprint: DocEntry = {
  slug: "blueprint",
  name: "Blueprint",
  title: "蓝图编辑器",
  section: "ui",
  group: "编辑器",
  description: "照着虚幻 5 蓝图做的节点图编辑器：右键或 Tab 搜节点、从引脚拖线（按类型给出能不能连和原因，拖到空白处只列能接上的节点并自动连好）、框选、注释框、折叠为子图、对齐拉直、系统剪贴板文本复制粘贴、撤销重做。节点是 DOM，连线是一张 SVG，拖动和缩放直接改变换，几百个节点也顺。",
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
    { label: "300 个节点", values: { ...DEMO, graph: "stress", minimap: true } },
  ],
  controls: [
    { type: "select", key: "graph", label: "图", options: [{ value: "blank", label: "空白" }, { value: "flow", label: "示例流程" }, { value: "collapsed", label: "含折叠图" }, { value: "broken", label: "含问题" }, { value: "stress", label: "300 个节点" }] },
    { type: "select", key: "snap", label: "网格吸附", options: [{ value: "0", label: "关" }, { value: "8", label: "8" }, { value: "16", label: "16" }, { value: "32", label: "32" }] },
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
// <Blueprint editor={bp} />
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
    { name: "issues", type: "boolean", default: "true", description: "左下角校验条，点问题会定位并选中节点。" },
    { name: "className / aria-label", type: "string", description: "外层样式和无障碍名称。编辑器要有高度。" },
    { name: "useBlueprint({ registry, initial, value?, onChange? })", type: "BlueprintHandle", description: "graph、selection、apply(ops)（一次撤销）、undo、redo、select、fit、viewport、toText、fromText、enter / exitTo（子图）。" },
  ],
};
