import type { DocEntry } from "../types";

const D = { snap: "16", minimap: false, readOnly: false, lod: 0.5, wheel: "ctrl", debug: false, variables: false };
const DEMO = { ...D, graph: "flow" };

const WORKBENCH_USAGE = `import { useState } from "react";
import { BlueprintWorkbench } from "@/blueprint/ui";
import { createRegistry, defineLibrary, defineTypes, type BlueprintGraph } from "@/blueprint";

// 函数库: 文档之间复用的函数和宏, 出现在操作菜单和「我的蓝图 > 库」里
const mathLib = defineLibrary({ id: "math", name: "数学", items: [/* SubGraphDef, kind: "function" | "macro" */] });
const registry = createRegistry(types, nodes, { libraries: [mathLib] });

export function Editor() {
  const [graph, setGraph] = useState<BlueprintGraph>({ nodes: [], edges: [] });
  // 默认铺满视口 (100dvh); 放进页面里用 fullscreen={false}, 它会填满父元素
  return (
    <BlueprintWorkbench
      registry={registry}
      value={graph}
      onChange={setGraph}
      storageKey="my-bp-layout"          // 记住面板宽度和开合
      debug={{ breakpoints: ["branch"] }} // 运行、单步、条件断点、调用栈
      onSave={(g) => save(g)}             // 工具栏出现「保存」, Ctrl S
    />
  );
}

// 面板也能单独摆放, 共用一个编辑器实例:
// import { MyBlueprintPanel, DetailsPanel, DebugDock } from "@/blueprint/ui/panels";
// const bp = useBlueprint({ registry, initial });
// <MyBlueprintPanel editor={bp} /> <Blueprint editor={bp} /> <DetailsPanel editor={bp} /> <DebugDock editor={bp} />
`;

export const blueprint: DocEntry = {
  slug: "blueprint",
  name: "Blueprint",
  title: "蓝图编辑器",
  section: "ui",
  group: "编辑器",
  description: "照着虚幻 5 蓝图做的节点图编辑器，可以单独用画布，也可以用整套工作台（我的蓝图、细节、编译结果、调用栈）：右键或 Tab 搜节点、从引脚拖线（按类型给出能不能连和原因，拖到空白处只列能接上的节点并自动连好）、框选、注释框、折叠为子图、函数或宏、图变量、查找、断点调试（执行流脉冲、单步、监视引脚值）、对齐拉直、系统剪贴板文本复制粘贴、撤销重做。节点是 DOM，连线是一张 SVG，拖动和缩放直接改变换，几百个节点也顺；调试、变量面板和查找按需加载。",
  file: "src/blueprint/ui/blueprint.tsx",
  importFrom: "@/blueprint/ui",
  demo: () => import("./blueprint.demo"),
  source: () => import("@/blueprint/ui/blueprint.tsx?raw").then((m) => m.default),
  bleed: true,
  stageHeight: 600,
  fullPage: { label: "蓝图工作台", load: () => import("./blueprint.full") },
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
    { label: "工作台", values: { ...DEMO, graph: "workbench", debug: true } },
  ],
  controls: [
    {
      type: "select", key: "graph", label: "图", options: [
        { value: "blank", label: "空白" }, { value: "flow", label: "示例流程" }, { value: "collapsed", label: "含折叠图" }, { value: "broken", label: "含问题" },
        { value: "debug", label: "调试运行" }, { value: "vars", label: "变量" }, { value: "fn", label: "函数与宏" }, { value: "stress", label: "300 个节点" },
        { value: "workbench", label: "工作台（整套面板）" },
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
    if (v.graph === "workbench") return WORKBENCH_USAGE;
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
    { name: "placeKeys", type: "Record<string, string> | false", default: "{ b: \"flow.branch\", s: \"flow.sequence\", d: \"flow.delay\" }", description: "按住一个字母键再点空白处，就在那里放下对应的节点（虚幻 5 的 B 分支、S 序列、D 延迟）。值是节点类型 id，注册表里没有的会忽略；false 关闭。" },
    { name: "toolbar / breadcrumb / onFind", type: "boolean / boolean / () => void", default: "true / true", description: "隐藏画布右上角工具栏、左上角面包屑；onFind 让 Ctrl F 交给外面处理（工作台用它打开「查找结果」）。" },
    { name: "debug.bar", type: "boolean", default: "true", description: "右下角运行条。工作台把运行控制放进自己的工具栏，所以关掉它。" },
    { name: "<BlueprintWorkbench>", type: "组件", description: "整套编辑器：顶部工具栏（编译状态、保存、撤销重做、运行 / 单步 / 继续 / 停止 / 运行到光标、查找、缩放、面板开关、快捷键、全屏），左侧「我的蓝图」，中间多标签画布，右侧「细节」，底部「编译结果 / 查找结果 / 调用栈 / 监视 / 断点」。分隔条可拖可用键盘（方向键 16px，Shift 64px，Enter 收起），窄于 900px 时左右面板变成抽屉。" },
    { name: "fullscreen", type: "boolean", default: "true", description: "工作台默认铺满视口（100dvh）；false 时填满父元素，父元素要有高度。" },
    { name: "storageKey / panels", type: "string / { left?, right?, bottom? }", description: "storageKey 把面板尺寸和开合存进 localStorage；panels 决定宽屏时哪些面板一开始打开（默认都开）。" },
    { name: "onSave / title / toolbarEnd", type: "(g) => void / string / ReactNode", description: "onSave 让工具栏出现「保存」并绑定 Ctrl S；title 默认取图设置里的名称；toolbarEnd 往工具栏右侧塞自己的按钮。" },
    { name: "MyBlueprintPanel", type: "@/blueprint/ui/panels", description: "我的蓝图：图表、函数、宏、变量（按分类分组）、函数里的局部变量和输入、库。+ 新建，F2 重命名，Delete 删除，右键或 ⋯ 复制、转换（折叠图提升为函数）、查找引用；拖到画布得到调用节点、获取节点（Alt 设置）；双击打开。" },
    { name: "DetailsPanel", type: "@/blueprint/ui/panels", description: "细节：节点（标题、注释气泡和固定、启用 / 禁用 / 仅开发、引脚默认值、断点条件和命中次数、运行到此处）；注释（颜色、移动方式、层级）；变量（类型和单个 / 数组 / 集合 / 映射、默认值、分类、提示）；函数和宏（类型、纯函数、常量、输入输出的增删改排序改类型，所有调用处跟着变，失配的调用处标红）；什么都没选时是图设置。" },
    { name: "DebugDock", type: "@/blueprint/ui/panels", description: "底部输出：编译结果（按错误 / 警告筛选，点击定位）、查找结果（所有层级的节点、函数、变量、注释、值）、调用栈（暂停时从外到内列出调用处，点击跳转）、监视、断点列表（启用、条件、命中次数、本次到达次数、删除全部）。" },
    { name: "函数签名与库", type: "setSignature / importLibrary op", description: "函数的输入输出就是入口和返回节点的引脚：改名只改标签，连线保留；改类型保留连线但校验报「调用处与函数签名不符」；删引脚会删掉所有调用处接在上面的线。函数里可以有多个返回节点，用「获取 输入」读取输入；纯函数没有执行引脚，被用到时才求值；常量函数不能设置图变量。defineLibrary 定义函数库，createRegistry(…, { libraries }) 让它出现在操作菜单，用到时复制进文档（id 为「库 id:条目 id」）；libraryToJSON / libraryToText 存成文件，libraryFromGraph 把文档里的函数打包成库。" },
    { name: "调试", type: "条件断点 / 运行到光标 / 调用栈", description: "断点条件是一个安全的小表达式（不用 eval）：引脚值、hit（第几次到达），例如 msg == 'x' && hit >= 3；命中次数表示从第 N 次起才停；Ctrl F10 运行到选中节点；Ctrl Shift F9 删除所有断点；PageDown 进入选中的折叠图。暂停在函数里时，标签和调用处会标出调用栈。仅开发的节点平时照常执行，evaluateGraph({ shipping: true }) 时跳过。" },
    { name: "键盘", type: "方向键 / Alt 方向键 / Enter / Esc", description: "方向键按网格微移选中项（Shift 逐单位），Alt 加方向键切到该方向最近的节点（屏幕阅读器经 aria-activedescendant 读到它），Enter 进入折叠图或重命名，拖线途中按 Esc 取消。" },
  ],
};
